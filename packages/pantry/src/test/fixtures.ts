/* oxlint-disable unicorn/throw-new-error -- Schema.TaggedError is a schema class factory. */
import { createHash } from "node:crypto";
import path from "node:path";
import { Config, Effect, FileSystem, Match, Option, Schema, Stream } from "effect";
import type { PlatformError } from "effect";
import { ChildProcess, ChildProcessSpawner } from "effect/process";

/**
 * The version of this module's own extraction code, one of the four inputs of every fixture's hash.
 *
 * A fix-forward of the materializer that changes what any directory holds bumps it, so the
 * corrected directories appear beside the old ones under new names instead of replacing them.
 */
export const FIXTURES_VERSION = "3" as const;

/**
 * A string edit applied to one file of a freshly extracted package, as plain data.
 *
 * An edit is part of a fixture's hash, so it stays `JSON.stringify`-able. A file is read as
 * latin1, so ASCII and single-byte text round-trips byte for byte, and is written back as
 * latin1 unless an `EncodeUtf16` edit names it. Edits of one file apply in list order.
 *
 * - `ReplaceText` replaces the one occurrence of `search` in `file` with `replacement`.
 * - `InsertAfterLine` inserts `text` as a new line after the 1-based line `line` of `file`, ended
 *   with the terminator that line has (`\r\n` or `\n`).
 * - `EncodeUtf16` writes `file` as a byte order mark `FF FE` followed by its text as UTF-16 little
 *   endian. The text is the latin1 reading of the extracted bytes, so the file must be ASCII: a
 *   multi-byte UTF-8 character would be encoded as its separate bytes, not as one character.
 */
export type TextEdit =
  | {
      readonly _tag: "ReplaceText";
      readonly file: string;
      readonly search: string;
      readonly replacement: string;
    }
  | {
      readonly _tag: "InsertAfterLine";
      readonly file: string;
      readonly line: number;
      readonly text: string;
    }
  | { readonly _tag: "EncodeUtf16"; readonly file: string };

/**
 * Where an `addFile` edit takes the new file's bytes from.
 *
 * - `{ zip, path }` is the entry `path` of the examples tarball's zip member `zip` (a tarball path
 *   ending `.zip`, so a file of another package).
 * - `{ member }` is a loose, non-zip tarball member.
 * - `{ text }` is a hand-written file, written as UTF-8.
 */
export type FileSource =
  | { readonly zip: string; readonly path: string }
  | { readonly member: string }
  | { readonly text: string };

/**
 * An edit of the package's file set, as plain data.
 *
 * - `addFile` writes `source` to `path`, making its directories.
 * - `copyFile` copies the package's file `from` to `to`, making its directories.
 * - `deleteFile` removes `path`.
 */
export type FileEdit =
  | { readonly _tag: "addFile"; readonly path: string; readonly source: FileSource }
  | { readonly _tag: "copyFile"; readonly from: string; readonly to: string }
  | { readonly _tag: "deleteFile"; readonly path: string };

/**
 * The edit that turns an extracted package into a minimal package of one item.
 *
 * It keeps the item file `item` and the files that item references by a relative `src`, `data`,
 * `href`, `poster`, `srcset`, `cite`, `altimg` or `longdesc`, or by the text of a `qti-file-href`
 * or a `qti-resource-icon`, deletes every other entry and writes a manifest of one
 * `imsqti_item_xmlv3p0` resource declaring `schemaversion`. It applies after the {@link FileEdit}s
 * and {@link TextEdit}s of its spec, once the package is extracted.
 */
export interface CutEdit {
  readonly _tag: "cut";
  readonly item: string;
  readonly schemaversion: "3.0.0" | "3.0.1";
}

/**
 * The edit that turns an extracted package into a minimal package of one test.
 *
 * It keeps the test document `test`, every document its item, section and stimulus refs reach
 * (transitively) and every file those documents reference by a relative `src`, `data`, `href`,
 * `poster`, `srcset`, `cite`, `altimg` or `longdesc`, and deletes every other entry. It writes a
 * manifest declaring `schemaversion` with one resource per kept document under its real type
 * (`imsqti_test_xmlv3p0`, `imsqti_section_xmlv3p0`, `imsqti_item_xmlv3p0`,
 * `imsqti_stimulus_xmlv3p0`), each referenced file listed under the resource whose document
 * references it. A document an `xi:include` names is kept too, as a resource of its own of type
 * `imsqti_fragment_xmlv3p0` (readings 93 and 115), not as a file of the including resource. It
 * applies after the {@link FileEdit}s and {@link TextEdit}s of its spec.
 */
export interface CutTestEdit {
  readonly _tag: "cutTest";
  readonly test: string;
  readonly schemaversion: "3.0.0" | "3.0.1";
}

/**
 * The edit that packages one loose test document with generated stub items.
 *
 * The spec's member is the loose test, which lands at the package root under its file name; `test`
 * names it (a member under `qtiv3-examples/tests/`). The edit writes one stub item per distinct
 * item `href` of the test, from `simple`'s item as the template, at that `href`. A stub's
 * identifier is the item ref's identifier and it declares `RESPONSE` (identifier, single),
 * `SCORE` (float, single; left out when a `qti-variable-mapping` inside that item ref targets
 * `SCORE`, which reading 97 forbids an item that declares it) and every other variable the test
 * prefixes with that identifier or names in a `qti-variable-mapping` `source-identifier` inside
 * that item ref, as a float single outcome.
 * It writes a manifest declaring `schemaversion` of one test resource and one item resource per
 * stub, and deletes every other entry. It applies last, after the spec's {@link FileEdit}s and
 * {@link TextEdit}s.
 */
export interface LooseTestEdit {
  readonly _tag: "looseTest";
  readonly test: string;
  readonly schemaversion: "3.0.0" | "3.0.1";
}

/**
 * One edit of a fixture: a {@link TextEdit} of one file's text, a {@link FileEdit} of the file
 * set, or the {@link CutEdit}, {@link CutTestEdit} or {@link LooseTestEdit} that reduces the
 * package to one item or one test.
 *
 * A spec's file edits apply first, in list order, so a text edit can name a file an `addFile` or
 * `copyFile` made; its text edits then apply file by file, as {@link TextEdit} says; its cut
 * applies last.
 */
export type Edit = TextEdit | FileEdit | CutEdit | CutTestEdit | LooseTestEdit;

/**
 * A fixture's whole definition: what it is called, the tarball member it comes from and the edits
 * applied to the extracted copy. Its directory is named by a hash of exactly these three values and
 * the module version.
 */
export interface FixtureSpec {
  readonly name: string;
  readonly member: string;
  readonly edits: readonly Edit[];
}

/**
 * The failure of the examples tarball as a source, never of a test's own assertion.
 *
 * `missing` is a tarball that is not at the configured path, `tar` and `unzip` are a non-zero exit
 * of that command, with its standard error as the `detail`.
 */
export class ExamplesError extends Schema.TaggedError<ExamplesError>()("ExamplesError", {
  detail: Schema.String,
  step: Schema.Literals(["tar", "unzip", "missing"]),
}) {
  /**
   * The step that failed and why, in one line.
   */
  override get message(): string {
    return `${this.step}: ${this.detail}`;
  }
}

/**
 * Compute the hex sha256 that names a fixture's directory.
 *
 * Every input is an argument, so the hash cannot depend on anything but the spec and the version a
 * caller names. The module itself always passes {@link FIXTURES_VERSION}.
 *
 * @param spec - The fixture's name, tarball member and edit list.
 * @param version - The extraction code's version.
 * @returns The 64 lower-case hex digits of the sha256 of `JSON.stringify([name, member, edits,
 *   version])`.
 */
export const transformHash = (spec: FixtureSpec, version: string): string =>
  createHash("sha256")
    .update(JSON.stringify([spec.name, spec.member, spec.edits, version]))
    .digest("hex");

/**
 * Shorten {@link transformHash} to the 12 digits that go into a directory name.
 *
 * @param spec - The fixture's name, tarball member and edit list.
 * @returns The first 12 hex digits of the hash under {@link FIXTURES_VERSION}.
 */
export const hash12 = (spec: FixtureSpec): string =>
  transformHash(spec, FIXTURES_VERSION).slice(0, 12);

/**
 * The names of the cut items: one `cut-<interaction>` fixture per interaction that has an
 * M0+M1-pure corpus item (spec 3.6's `one source each` line), 19 of the 20 interactions.
 * `qti-end-attempt-interaction` has no pure corpus item, so its fixture is hand-written, and
 * `qti-position-object-stage` is in the item `cut-position-object` is cut from.
 */
const cutNames = [
  "cut-associate",
  "cut-choice",
  "cut-drawing",
  "cut-extended-text",
  "cut-gap-match",
  "cut-graphic-associate",
  "cut-graphic-gap-match",
  "cut-graphic-order",
  "cut-hotspot",
  "cut-hottext",
  "cut-inline-choice",
  "cut-match",
  "cut-media",
  "cut-order",
  "cut-position-object",
  "cut-select-point",
  "cut-slider",
  "cut-text-entry",
  "cut-upload",
] as const;

/**
 * The corpus packages the cut items come from, each as the tarball member of its zip, which
 * `materializeCorpus` names by the zip's file name.
 */
const corpusMembers = {
  BBQsTest: "qtiv3-examples/packaging/BBQsTest/BBQsTest.zip",
  BPIG_22April: "QTI3_BPIG_Examples/BPIG_22April.zip",
  items: "qtiv3-examples/packaging/items/items.zip",
  sharedStimulus: "qtiv3-examples/packaging/sharedStimulus/sharedStimulus.zip",
  testWithLti: "qtiv3-examples/packaging/testWithLti/testWithLti.zip",
} as const;

/**
 * The spec of a cut item: the package's zip, with the one {@link CutEdit} that keeps `itemPath`
 * and the files it references and writes a minimal manifest.
 *
 * @param name - The fixture's name, `cut-<interaction>`.
 * @param pkg - The corpus package the item is in.
 * @param itemPath - The item's path inside the package's zip.
 * @param schemaversion - The `schemaversion` the minimal manifest declares: `3.0.1` for a
 *   `BPIG_22April` item and `3.0.0` for one of `BBQsTest`.
 * @returns The spec, whose directory is named by the hash of exactly these values like any other.
 */
export const cutItem = (
  name: string,
  pkg: keyof typeof corpusMembers,
  itemPath: string,
  schemaversion: CutEdit["schemaversion"],
): FixtureSpec => ({
  edits: [{ _tag: "cut", item: itemPath, schemaversion }],
  member: corpusMembers[pkg],
  name,
});

/**
 * The names of the 40 hand-written HTML positives: `html-<element>`, one per HTML kind that has an
 * arm and that the corpus never uses (spec 3.6's second census: 41 names, `template` among them,
 * which has no arm and no positive).
 */
const htmlElements = [
  "abbr",
  "acronym",
  "address",
  "article",
  "aside",
  "audio",
  "bdi",
  "big",
  "caption",
  "cite",
  "code",
  "col",
  "colgroup",
  "dd",
  "details",
  "dfn",
  "dl",
  "dt",
  "footer",
  "h4",
  "h6",
  "header",
  "kbd",
  "label",
  "nav",
  "ol",
  "param",
  "pre",
  "q",
  "rp",
  "rtc",
  "samp",
  "small",
  "sub",
  "summary",
  "tfoot",
  "th",
  "thead",
  "tt",
  "var",
] as const;

/**
 * The names of the XML copies of phase 2's fixtures b (negatives, part one) and c: each is a cut of
 * one corpus item, or a copy of `simple` or `sharedMedia`, with a few edits. Of fixtures b's six,
 * three are refused by the database and three admitted; of fixtures c's six, one is refused
 * (`adaptive-zero-feedback`) and five admitted. Fixtures a adds two admitted copies, one for each
 * of the six feedback and template kinds' arms.
 */
const copyNames = [
  "admission-choice-in-feedback",
  "gap-outside-gap-match",
  "controls-3-0-0",
  "padded-m1-attributes",
  "empty-class",
  "hottext-in-prompt",
  "label-3-0-0",
  "manifest-xml-lang",
  "item-lang-en",
  "item-lang-no-general",
  "adaptive-one-feedback",
  "adaptive-zero-feedback",
  "feedback-block-kinds",
  "rubric-template-kinds",
] as const;

/**
 * The names of phase 5's eleven positive fixtures (the twelfth, the corpus package
 * `BegGuide_March2025`, needs no spec): tests, section documents and stimuli, each a data-only edit
 * set over a tarball member.
 */
const testNames = [
  "test-linear",
  "test-selection",
  "test-mapping",
  "test-template-default",
  "test-section-ref",
  "test-include",
  "test-adaptive",
  "test-content",
  "stimulus-shared",
  "stimulus-301",
  "test-lti",
] as const;

/**
 * The names of phase 5's 60 negative fixtures: each a data-only edit set over one of
 * {@link testNames}, a refusal of one rule of the spec's 4.15, bin 1 by the database and bin 2 by
 * the importer. `item-prefixed`, `instance-spelling-canonical`, `section-variable-in-test` and
 * `duration-of-item-ref` are "(direct)" only: their spec is the positive's own, and the leased
 * suite alters the positive's rows by hand, because the importer cannot write their breach.
 * `prefixed-ambiguous` is decision 189's: a dotted reference with two resolving readings.
 */
export const negativeNames = [
  "branch-backward",
  "branch-exit-misspelled",
  "branch-into-ref",
  "branch-part-to-item",
  "branch-replacement-target",
  "branch-unknown-target",
  "duration-of-item-ref",
  "feedback-outcome-float",
  "feedback-template",
  "include-text",
  "include-xpointer",
  "instance-spelling-canonical",
  "item-in-section",
  "item-prefixed",
  "item-ref-missing",
  "item-ref-to-stimulus",
  "mapping-target-twice",
  "mapping-undeclared",
  "navigation-misspelled",
  "part-no-section",
  "part-order",
  "precondition-number-correct",
  "prefixed-ambiguous",
  "prefixed-undeclared-variable",
  "prefixed-unknown-ref",
  "rubric-empty-view",
  "rubric-in-rubric",
  "rubric-interaction",
  "rubric-no-body",
  "rubric-printed-undeclared",
  "section-adaptive-and-selection",
  "section-feedback-undeclared",
  "section-identifier-unknown",
  "section-prefixed-unresolved",
  "section-printed-undeclared",
  "section-ref-cycle",
  "section-ref-identifier-clash",
  "section-ref-to-item",
  "section-two-isc",
  "section-unprefixed-undeclared",
  "section-variable-in-test",
  "select-not-integer",
  "select-over",
  "select-under-required",
  "stimulus-300-attributes",
  "stimulus-300-include",
  "stimulus-body-empty",
  "stimulus-missing-image",
  "stimulus-ref-duplicate",
  "stimulus-ref-to-item",
  "stimulus-typed-test",
  "template-default-type",
  "template-default-undeclared",
  "test-declares-duration",
  "test-duplicate-identifier",
  "test-identifier-mismatch",
  "test-lang-no-lom",
  "test-no-part",
  "test-title-mismatch",
  "test-undeclared-variable",
] as const;

/**
 * The names of the fixtures that restore a lost check, each a data-only edit set over `simple` or
 * one of {@link testNames}: `aria-h1-role-button` and `aria-source-role` break the two ARIA role
 * rules (a `role` of `button` on an `h1`, a `role` on a `source`), `lang-case-mismatch` is the item
 * root's `xml:lang="en-GB"` against the resource's LOM `language` `en-gb` (accepted, the two
 * languages are the same one), and `pattern-unresolved-item` and `pattern-unresolved-test` hold a
 * `qti-pattern-match` whose `pattern` is `{NOSUCH}`, with no variable of that name, in an item's
 * response processing and a test's outcome processing (accepted, an unresolved braced pattern is a
 * string).
 */
export const restoredNames = [
  "aria-h1-role-button",
  "aria-source-role",
  "lang-case-mismatch",
  "pattern-unresolved-item",
  "pattern-unresolved-test",
] as const;

/**
 * The names of the whole-package test fixtures over {@link testNames}: the section document
 * placed twice (`section-doc-twice`, accepted), the item ref that shares an identifier with a
 * section of the placed document (`section-doc-name-clash`), a backward branch inside a shuffled
 * section (`branch-backward-shuffled`, accepted), a branch to the rule's own section
 * (`branch-to-own-section`), a selection that equals its required parts (`select-two-required`,
 * accepted) and a branch rule inside a section document placed twice that names a later item ref
 * of the same document (`branch-in-twice-placed-section`, accepted).
 */
export const assemblyNames = [
  "section-doc-twice",
  "section-doc-name-clash",
  "branch-backward-shuffled",
  "branch-to-own-section",
  "select-two-required",
  "branch-in-twice-placed-section",
] as const;

/**
 * The names of the weighted test variables fixtures over `test-mapping`, whose item refs carry
 * `rtest04.xml`'s weights (decision 434, spec reading 167): `weighted-sum-float` sets a float
 * single outcome from `rtest04.xml`'s weighted sum of a `qti-test-variables` that writes no
 * `base-type` (accepted: the weighted test variables is float, its sum float), and
 * `weighted-variables-integer` sets an integer multiple outcome from the same test variables
 * (refused under "Set type": a weighted test variables with no `base-type` is float, §7.39.5).
 */
export const weightedNames = ["weighted-sum-float", "weighted-variables-integer"] as const;

/**
 * The names of phase 9's catalog positives: the five catalog items of `BPIG_22April` cut as they
 * are (`cut-catalog-supports`, `cut-catalog-multiple`, `cut-catalog-nodes`,
 * `cut-catalog-reference` and `cut-catalog-rubric`), `catalog-300` (the first at 3.0.0) and eight
 * hand-edited packages, one for each shape the corpus lacks: `catalog-hosts` (a catalog in a
 * feedback block, a modal feedback, a template block, a feedback block in a template block and a
 * template block in a rubric block), `card-files` (cards that hold files), `catalog-padded` (outer
 * whitespace and a tab in the values that collapse or normalize), `catalog-lang` (decision 85:
 * languages in catalog content that the item's metadata does not list), `card-qti-content`
 * (decision 216: a printed variable and an interaction in a card), `card-gap-inside` (decision
 * 309's case B: a gap in a card inside a gap match), `card-empty` (a card with no content) and
 * `entry-empty` (a card whose one entry has none), the last two accepted by decision 324.
 */
export const catalogNames = [
  "cut-catalog-supports",
  "cut-catalog-multiple",
  "cut-catalog-nodes",
  "cut-catalog-reference",
  "cut-catalog-rubric",
  "catalog-300",
  "catalog-hosts",
  "card-files",
  "catalog-padded",
  "catalog-lang",
  "card-qti-content",
  "card-gap-inside",
  "card-empty",
  "entry-empty",
] as const;

/**
 * The names of phase 9's companion-materials positives, cut or edited from `testWithLti`'s
 * `elements.xml`, the one corpus item with a `qti-companion-materials-info`: `cut-companion` (a
 * digital material with a label, a media type, a file and an icon, at 3.0.0), `companion-301` (the
 * same at 3.0.1), `companion-full` (every kind of material, every calculator type and every unit
 * value) and `companion-padded` (outer whitespace and a tab in the values that collapse or
 * normalize).
 */
export const companionNames = [
  "cut-companion",
  "companion-301",
  "companion-full",
  "companion-padded",
] as const;

/**
 * The names of phase 9's 29 XML-path negatives, each a hand-broken copy of a catalog or companion
 * positive (or of `simple`) that breaks the laws of one rule, in the order of the spec's 4.9
 * table. They are a list of their own, not part of {@link negativeNames}, which holds phase 5's 63
 * test-document negatives. `card-empty` and `entry-empty` are not here: decision 324 accepts an
 * empty card and an empty entry, and they are positives of {@link catalogNames}.
 *
 * - The catalog: `support-twice`, `default-twice` (one `true`, one `1`), `idref-html`,
 *   `idref-missing`, `catalog-id-twice`, `catalog-no-id`, `card-file-no-type`, `info-empty`,
 *   `catalog-empty`, `card-mixed`, `html-twice`, `card-file-first`, `default-default`,
 *   `support-case`, `support-ext-empty`, `card-file-missing`, `card-file-undescribed`,
 *   `card-interaction-in-modal`, `card-gap-outside` and `body-lang`.
 * - The companion materials: `physical-first`, `calculator-no-description`, `two-infos` (two
 *   `qti-calculator-info` in one calculator), `rule-both-systems`, `calculator-Basic`, `unit-case`,
 *   `increment-text`, `rule-system-SI` and `icon-missing`.
 */
export const catalogNegativeNames = [
  "support-twice",
  "default-twice",
  "idref-html",
  "idref-missing",
  "catalog-id-twice",
  "catalog-no-id",
  "card-file-no-type",
  "info-empty",
  "catalog-empty",
  "card-mixed",
  "html-twice",
  "card-file-first",
  "physical-first",
  "calculator-no-description",
  "two-infos",
  "rule-both-systems",
  "default-default",
  "support-case",
  "support-ext-empty",
  "calculator-Basic",
  "unit-case",
  "increment-text",
  "rule-system-SI",
  "card-file-missing",
  "icon-missing",
  "card-file-undescribed",
  "card-interaction-in-modal",
  "card-gap-outside",
  "body-lang",
] as const;

/**
 * The rules each of {@link catalogNegativeNames} may be refused under, from the predicted column
 * of the spec's 4.9 table, as the metadata fixtures' verdicts are written. A leased run that
 * refuses one under a rule outside its row reports a finding; it does not edit this table.
 *
 * - `child-set` or `ordering` name the content model's automaton, which refuses an empty container, a
 *   repeated child and a missing required child alike.
 * - The two element-text negatives (`calculator-Basic`, `increment-text`) are the text-domain rule,
 *   `text-copy`; the attribute ones (`default-default`, `support-case`, `support-ext-empty`,
 *   `unit-case`) are `attribute-lexical`.
 * - `card-file-undescribed` is `file-listed` (reading 103: a file a document references is described
 *   in the manifest).
 */
export const catalogVerdicts: readonly (readonly [
  (typeof catalogNegativeNames)[number],
  readonly string[],
])[] = [
  ["support-twice", ["card-support"]],
  ["default-twice", ["card-default"]],
  ["idref-html", ["idref-target"]],
  ["idref-missing", ["idref-target"]],
  ["catalog-id-twice", ["document-key"]],
  ["catalog-no-id", ["required-attribute"]],
  ["card-file-no-type", ["required-attribute"]],
  ["info-empty", ["child-set", "ordering"]],
  ["catalog-empty", ["child-set", "ordering"]],
  ["card-mixed", ["child-set", "ordering"]],
  ["html-twice", ["child-set", "ordering"]],
  ["card-file-first", ["ordering"]],
  ["physical-first", ["ordering"]],
  ["calculator-no-description", ["child-set", "ordering"]],
  ["two-infos", ["child-set", "ordering"]],
  ["rule-both-systems", ["child-set", "ordering"]],
  ["default-default", ["attribute-lexical"]],
  ["support-case", ["attribute-lexical"]],
  ["support-ext-empty", ["attribute-lexical"]],
  ["calculator-Basic", ["text-copy"]],
  ["unit-case", ["attribute-lexical"]],
  ["increment-text", ["text-copy"]],
  ["rule-system-SI", ["unmodeled-vocabulary"]],
  ["card-file-missing", ["file-exists"]],
  ["icon-missing", ["file-exists"]],
  ["card-file-undescribed", ["file-listed"]],
  ["card-interaction-in-modal", ["ancestry-ban"]],
  ["card-gap-outside", ["ancestry-ban"]],
  ["body-lang", ["document-lang"]],
];

/**
 * The names of the ten wildcard fixtures of phase 11 (spec W12): foreign content under the lax
 * hosts of `qti-custom-operator`, `xi:include`, `xi:fallback` and LOM, the four refusals, and
 * `test-selection-foreign`, a test with an extension element and an `xml:lang` on the strict
 * attribute hosts `qti-selection` and `qti-ordering`.
 */
const wildcardNames = [
  "cut-custom-operator",
  "operator-foreign-content",
  "fallback-3-0-1",
  "lom-wildcard",
  "operator-foreign-first",
  "nested-root-in-foreign",
  "unqualified-on-operator",
  "strict-file-foreign",
  "qti-ns-under-operator",
  "test-selection-foreign",
] as const;

/**
 * The names of the nine SSML and `data-ssml` positives of phase 7's stage N (spec 5.3), the first
 * seven SSML in the item body and the last two `data-ssml` attributes: `ssml-corpus-sub`, the
 * corpus's one SSML shape cut from `sharedStimulus`; `ssml-hooks`, the twelve elements the item's
 * inline hosts admit, in both namespace forms and as a bare hook; `ssml-speak`, the `speak`
 * element's attributes and its head of `meta`, `metadata` and `lexicon`; `ssml-voice`,
 * `ssml-prosody` and `ssml-nested`, the attribute domains and content models below it;
 * `ssml-two-speaks`, mark scope per fragment; `data-ssml`, valid Data-SSML on four hosts; and
 * `data-ssml-custom`, a value on an element that does not declare the attribute.
 */
const ssmlNames = [
  "ssml-corpus-sub",
  "ssml-hooks",
  "ssml-speak",
  "ssml-voice",
  "ssml-prosody",
  "ssml-nested",
  "ssml-two-speaks",
  "data-ssml",
  "data-ssml-custom",
] as const;

/**
 * The names of the eight `data-*` fixtures of phase 8's stage N (spec 5.3): four positives and four
 * negatives. `cut-data-dash` and `cut-data-attributes` are the corpus's two items with custom
 * `data-*` attributes, cut; `data-custom` puts the name class through `simple` (every host kind,
 * every name shape, every value shape); `data-entity` holds an entity reference in a value; The
 * negatives break the name language, `data-non-ascii` (a name with a non-ASCII letter, which the
 * information model's pattern bars, reading 13), `data-uppercase` and `data-bare-prefix`, or name a
 * host that does not admit the class, `data-item-body`.
 */
const dataNames = [
  "cut-data-dash",
  "cut-data-attributes",
  "data-custom",
  "data-entity",
  "data-non-ascii",
  "data-uppercase",
  "data-bare-prefix",
  "data-item-body",
] as const;

/**
 * The names of phase 10's ten PCI positives, from the corpus packages `pci_simple_example` and
 * `pci_item_examples` and hand-edited items of the first: `pci-simple` (the `module` attribute,
 * markup of HTML and ARIA, the module files as bytes), `pci-modules` (two PCIs of four modules
 * each with repeated module ids and whitespace-only markup), `pci-configurations` (the two
 * configuration attributes as file references, a PCI with both module forms and the three
 * path shapes of a module), `pci-variables` (a prompt, a template variable, a context variable, a
 * record binding and an `identifier multiple` binding, at 3.0.0), `pci-3-0-1` (an undeclared
 * `QTI_CONTEXT` and a `qti-stylesheet`), `pci-context-3-0-1` (a declared `QTI_CONTEXT` record and a
 * second context declaration), `pci-catalog-3-0-1` (a `qti-catalog-info` of one catalog of one
 * card), `pci-markup-content` (the QTI content a PCI's markup holds, then two `template`
 * elements), `template-foreign` (foreign content in a `template`) and `custom-3-0-1` (a custom
 * interaction at 3.0.1, bound to a record). Every `template` and custom interaction is
 * self-closed except `template-foreign`'s. The corpus PCIs' custom `data-*` attributes are
 * dropped: phase 8's law for them has not landed.
 */
export const pciNames = [
  "pci-simple",
  "pci-modules",
  "pci-configurations",
  "pci-variables",
  "pci-3-0-1",
  "pci-context-3-0-1",
  "pci-catalog-3-0-1",
  "pci-markup-content",
  "template-foreign",
  "custom-3-0-1",
] as const;

/**
 * The names of phase 10's 28 PCI negatives, each one of {@link pciNames}' positives (or a corpus
 * package cut) with one defect, in the order of the spec's 4.5 table. They are a list of their own,
 * not part of {@link negativeNames}, which holds phase 5's 63 test-document negatives.
 *
 * - The module source and the version: `pci-no-module`, `custom-3-0-0` (a custom interaction in a
 *   3.0.0 package), `pci-stylesheet-3-0-0` and `pci-catalog-info-3-0-0` (what 3.0.1 adds, in
 *   3.0.0).
 * - The variables: `pci-context-builtin-3-0-0` (`QTI_CONTEXT` read at 3.0.0 without a declaration),
 *   `pci-context-undeclared` and `pci-context-undeclared-3-0-1`, and `pci-template-undeclared`.
 * - The content model: `pci-no-type`, `pci-two-modules`, `pci-modules-empty`, `pci-no-markup`,
 *   `pci-two-markups`, `pci-markup-order`, `pci-modules-after-markup`, `pci-prompt-late`,
 *   `pci-markup-text`, `template-outside` and `pci-nested`.
 * - The lexical forms: `pci-type-malformed` and `pci-path-malformed` (each `%zz`),
 *   `pci-module-malformed` and `pci-module-id-malformed` (each `1shading`), and `custom-attribute`
 *   (a namespaced attribute on a custom interaction).
 * - The corpus cuts of `pci_item_examples`, each with exactly one of the corpus's defects left:
 *   `pci-items-fallback`, `pci-items-unlisted`, `pci-items-missing` and
 *   `pci-configuration-missing`.
 */
export const pciNegativeNames = [
  "pci-no-module",
  "custom-3-0-0",
  "pci-context-builtin-3-0-0",
  "pci-context-undeclared",
  "pci-context-undeclared-3-0-1",
  "pci-template-undeclared",
  "pci-no-type",
  "pci-two-modules",
  "pci-modules-empty",
  "pci-no-markup",
  "pci-two-markups",
  "pci-markup-order",
  "pci-modules-after-markup",
  "pci-prompt-late",
  "pci-markup-text",
  "pci-stylesheet-3-0-0",
  "pci-catalog-info-3-0-0",
  "template-outside",
  "pci-nested",
  "pci-type-malformed",
  "pci-path-malformed",
  "pci-module-malformed",
  "pci-module-id-malformed",
  "custom-attribute",
  "pci-items-fallback",
  "pci-items-unlisted",
  "pci-items-missing",
  "pci-configuration-missing",
] as const;

/**
 * The rules each of {@link pciNegativeNames} may be refused under, from the predicted column of the
 * spec's 4.5 table, as {@link catalogVerdicts} writes them. A leased run that refuses one under a
 * rule outside its row reports a finding; it does not edit this table.
 *
 * - `child-set` or `ordering` name the content model's automaton, which refuses a repeated, an empty
 *   and a missing required child alike; `admission` or `ordering` are the two ways it can refuse a
 *   child the version does not admit.
 * - `pci-module-source` is the law "PCI module source" (reading R10-a); `admission` for
 *   `custom-3-0-0` is the law "Custom interaction version" (reading R10-b).
 * - `pci-context-undeclared` is read at 3.0.0, where the reader's declared-variable rule may name it
 *   `idref-target`; `pci-context-undeclared-3-0-1` only `context-variable-ref`.
 * - `pci-markup-text` is the automaton's character-data rule, predicted `admission`.
 * - `template-outside` is `unmodeled-vocabulary`, reading 57's rule: an HTML `template` is admitted
 *   only inside a PCI's markup.
 * - `custom-attribute` is reading 90's refusal of an undeclared attribute on the custom interaction
 *   (open question O5 can turn it into a positive).
 * - `pci-items-fallback` is reading 11; `pci-configuration-missing` is `file-exists`, or the
 *   description rule (reading 103: `file-listed`) when the missing path is also unlisted.
 */
export const pciVerdicts: readonly (readonly [FixtureName, readonly string[]])[] = [
  ["pci-no-module", ["pci-module-source"]],
  ["custom-3-0-0", ["admission"]],
  ["pci-context-builtin-3-0-0", ["idref-target"]],
  ["pci-context-undeclared", ["context-variable-ref", "idref-target"]],
  ["pci-context-undeclared-3-0-1", ["context-variable-ref"]],
  ["pci-template-undeclared", ["template-ref"]],
  ["pci-no-type", ["required-attribute"]],
  ["pci-two-modules", ["child-set", "ordering"]],
  ["pci-modules-empty", ["child-set", "ordering"]],
  ["pci-no-markup", ["child-set", "ordering"]],
  ["pci-two-markups", ["child-set", "ordering"]],
  ["pci-markup-order", ["ordering"]],
  ["pci-modules-after-markup", ["ordering"]],
  ["pci-prompt-late", ["ordering"]],
  ["pci-markup-text", ["admission"]],
  ["pci-stylesheet-3-0-0", ["admission", "ordering"]],
  ["pci-catalog-info-3-0-0", ["admission", "ordering"]],
  ["template-outside", ["unmodeled-vocabulary"]],
  ["pci-nested", ["ancestry-ban"]],
  ["pci-type-malformed", ["attribute-lexical"]],
  ["pci-path-malformed", ["attribute-lexical"]],
  ["pci-module-malformed", ["attribute-lexical"]],
  ["pci-module-id-malformed", ["attribute-lexical"]],
  ["custom-attribute", ["attribute-admission"]],
  ["pci-items-fallback", ["attribute-admission"]],
  ["pci-items-unlisted", ["file-listed"]],
  ["pci-items-missing", ["file-exists"]],
  ["pci-configuration-missing", ["file-exists", "file-listed"]],
];

/**
 * The names `materialize` accepts: `simple`, its seven variants and the eleven hand-edited
 * packages, each the same package with the edits of its row in the spec table, `sharedMedia`, the
 * examples' shared-media package unedited, `quoted-q`, phase 2's hand-broken package,
 * `end-attempt`, phase 2's hand-written positive, the 19 cut items of {@link cutNames}, the 40
 * hand-written HTML positives of {@link htmlElements}, the 14 XML copies of {@link copyNames}, the
 * packaging phase's metadata and content cuts with their negatives, the 11 positive fixtures of
 * phase 5's tests, sections and stimuli ({@link testNames}) and its 60 negatives
 * ({@link
 * negativeNames}), the five restored-check fixtures of {@link restoredNames}, the six
 * assembly fixtures of {@link assemblyNames}, the 14 catalog positives of {@link catalogNames}, the
 * four companion-materials positives of {@link companionNames}, the 29 XML-path negatives of
 * {@link catalogNegativeNames}, the ten PCI positives of {@link pciNames}, the 28 PCI negatives of
 * {@link pciNegativeNames}, the ten wildcard fixtures of {@link wildcardNames}, the nine SSML and
 * `data-ssml` positives of {@link ssmlNames}, the eight `data-*` fixtures of {@link dataNames}, and
 * `rtest01`, the examples' included fragment in place (spec reading 117), with one negative per
 * include law.
 */
export const fixtureNames = [
  "simple",
  "doctype",
  "latin1",
  "external",
  "utf16",
  "windows-1252",
  "padded-attributes",
  "padded-text",
  "undeclared-response",
  "choice-in-prompt",
  "two-values-single",
  "bad-identifier-value",
  "padded-identifier-value",
  "choice-bounds",
  "identifier-mismatch",
  "title-mismatch",
  "body-empty",
  "comment-in-element",
  "bad-template-uri",
  "sharedMedia",
  "quoted-q",
  "end-attempt",
  ...cutNames,
  ...htmlElements.map((element) => `html-${element}` as const),
  ...copyNames,
  ...testNames,
  ...negativeNames,
  ...restoredNames,
  ...assemblyNames,
  ...weightedNames,
  ...catalogNames,
  ...companionNames,
  ...catalogNegativeNames,
  ...pciNames,
  ...pciNegativeNames,
  "lomrest",
  "lomrest-two-titles",
  "lomrest-two-purposes",
  "lomrest-two-kinds",
  "lomrest-exam",
  "lomrest-self-assessment",
  "csm",
  "csm-no-labelled-guid",
  "csm-two-guids",
  "csm-no-guid",
  "csm-two-sets",
  "filelom",
  "filelom-qmd",
  "filelom-two-metadata",
  "nestedqmd",
  "nestedqmd-manifest-lom",
  "nestedqmd-both",
  "extmeta",
  "extmeta-item-root",
  "extmeta-item-href",
  "extmeta-two-resources",
  "extmeta-hrefless",
  "variant",
  "variant-padded",
  "variant-301",
  "variant-self-ref",
  "variant-no-resource",
  "variant-id-clash",
  "variant-tactile",
  "variant-bad-uri",
  "variant-two-atinteroperable",
  "variant-two-complexity",
  "variant-no-metadata",
  "variant-before-file",
  "outcome",
  "outcome-title",
  "lti301",
  "lti300",
  "lti300-as-301",
  "bytes",
  "bytes-webcontent-item",
  "resproc",
  "resproc-webcontent",
  "rtest01",
  "rtest01-include-root",
  "rtest01-include-target",
  "rtest01-fragment-identifier",
  "rtest01-fragment-context",
  "rtest01-cycle",
  "rtest01-hottext-key",
  "rtest01-choice-variable",
  "rtest01-template-reference",
  "rtest01-fragment-lang",
  "rtest01-rule-variable",
  "usage3",
  "usage3-typed",
  "usage3-padded",
  "usage3-integer-float",
  "usage3-float-padded",
  "usage3-no-target",
  "usage3-two-values",
  "usage3-ordinary-mapping",
  "usage3-no-map-entry",
  "usage3-bad-month",
  "usage3-feb-30",
  "usage3-bad-context",
  "usage3-bad-name",
  ...wildcardNames,
  ...ssmlNames,
  ...dataNames,
] as const;

/**
 * One of {@link fixtureNames}.
 */
export type FixtureName = (typeof fixtureNames)[number];

/**
 * The tarball member `simple` and every variant of it are extracted from.
 */
const simpleMember = "qtiv3-examples/packaging/simple/simple.zip";

/**
 * The tarball member `sharedMedia` is extracted from (`tar -tzf` of the examples tarball lists it
 * beside `imsmanifest.xml`, `example/graphic_order.xml`, `example/hotspot.xml` and
 * `example/ukair.png`).
 */
const sharedMediaMember = "qtiv3-examples/packaging/sharedMedia/sharedMedia.zip";

/**
 * Build a `ReplaceText` edit of one file.
 *
 * @param file - The file the edit names, relative to the package directory.
 * @param search - The text to replace, which must occur exactly once when the edit applies.
 * @param replacement - The text that takes its place.
 * @returns The edit as plain data.
 */
const replaceIn = (file: string, search: string, replacement: string): TextEdit => ({
  _tag: "ReplaceText",
  file,
  replacement,
  search,
});

/**
 * Build the `ReplaceText` edit of `choice.xml`'s encoding declaration.
 *
 * @param label - The encoding label the declaration names instead of `UTF-8`.
 * @returns The edit as plain data.
 */
const declareEncoding = (label: string): TextEdit =>
  replaceIn("choice.xml", 'encoding="UTF-8"', `encoding="${label}"`);

/**
 * Build the `ReplaceText` edit that appends a character to the sentence on `choice.xml`'s line 15,
 * so the character lands inside the item body's first paragraph.
 *
 * @param character - The character to insert after `picture.`.
 * @returns The edit as plain data.
 */
const afterPicture = (character: string): TextEdit =>
  replaceIn("choice.xml", "in the picture.</p>", `in the picture.${character}</p>`);

/**
 * The prompt of `choice.xml`'s interaction, which `doctype` and `external` extend with an entity
 * reference.
 */
const prompt = "<qti-prompt>What does it say?</qti-prompt>";

/**
 * The last word of `choice.xml`'s `alt` text with the quote that closes the attribute, which
 * `latin1` and `external` replace.
 */
const altEnding = 'LUGGAGE UNATTENDED"';

/**
 * The item body's children of `choice.xml` (its lines 15 to 24), from the first paragraph to the
 * end of the interaction, as the CRLF text the file holds.
 */
const bodyChildren = [
  "<p>Look at the text in the picture.</p>",
  "        <p>",
  '            <img src="images/sign.png" alt="NEVER LEAVE LUGGAGE UNATTENDED"/>',
  "        </p>",
  '        <qti-choice-interaction response-identifier="RESPONSE" shuffle="false" max-choices="1">',
  "            <qti-prompt>What does it say?</qti-prompt>",
  '            <qti-simple-choice identifier="ChoiceA">You must stay with your luggage at all times.</qti-simple-choice>',
  '            <qti-simple-choice identifier="ChoiceB">Do not let someone else look after your luggage.</qti-simple-choice>',
  '            <qti-simple-choice identifier="ChoiceC">Remember your luggage when you leave.</qti-simple-choice>',
  "        </qti-choice-interaction>",
].join("\r\n");

/**
 * The first choice of `choice.xml`, which `choice-in-prompt` moves into the prompt.
 */
const firstChoice =
  '<qti-simple-choice identifier="ChoiceA">You must stay with your luggage at all times.</qti-simple-choice>';

/**
 * The 19 cut items: `cut-<interaction>` and the source item of spec 3.6's `one source each` line.
 * The picks are revision 2's of the spec, and a later tarball change is a list update here.
 */
const cutSpecs: Record<(typeof cutNames)[number], FixtureSpec> = {
  "cut-associate": cutItem("cut-associate", "BPIG_22April", "items/QTI3-associate.xml", "3.0.1"),
  "cut-choice": cutItem("cut-choice", "BPIG_22April", "items/BG007.xml", "3.0.1"),
  "cut-drawing": cutItem("cut-drawing", "BPIG_22April", "items/drawing-interaction-1.xml", "3.0.1"),
  "cut-extended-text": cutItem(
    "cut-extended-text",
    "BBQsTest",
    "id-1ccd6e04685f/ShortAnswer-extText-postcard.xml",
    "3.0.0",
  ),
  "cut-gap-match": cutItem(
    "cut-gap-match",
    "BPIG_22April",
    "items/gap-match-example-1.xml",
    "3.0.1",
  ),
  "cut-graphic-associate": cutItem(
    "cut-graphic-associate",
    "BPIG_22April",
    "items/example-graphic-assoc-1.xml",
    "3.0.1",
  ),
  "cut-graphic-gap-match": cutItem(
    "cut-graphic-gap-match",
    "BPIG_22April",
    "items/graphic-gap-match-item1.xml",
    "3.0.1",
  ),
  "cut-graphic-order": cutItem(
    "cut-graphic-order",
    "BPIG_22April",
    "items/QTI3-graphic-order.xml",
    "3.0.1",
  ),
  "cut-hotspot": cutItem("cut-hotspot", "BPIG_22April", "items/QTI3-hotspot.xml", "3.0.1"),
  "cut-hottext": cutItem("cut-hottext", "BPIG_22April", "items/hot-text-example-1.xml", "3.0.1"),
  "cut-inline-choice": cutItem(
    "cut-inline-choice",
    "BPIG_22April",
    "items/QTI3-custom-stylesheet.xml",
    "3.0.1",
  ),
  "cut-match": cutItem("cut-match", "BPIG_22April", "items/QTI3-match.xml", "3.0.1"),
  "cut-media": cutItem("cut-media", "BPIG_22April", "items/media-example-1.xml", "3.0.1"),
  "cut-order": cutItem("cut-order", "BPIG_22April", "items/Order_RTL_Hebrew.xml", "3.0.1"),
  "cut-position-object": cutItem(
    "cut-position-object",
    "BPIG_22April",
    "items/position-object-1.xml",
    "3.0.1",
  ),
  "cut-select-point": cutItem(
    "cut-select-point",
    "BPIG_22April",
    "items/select-point-item_1.xml",
    "3.0.1",
  ),
  "cut-slider": cutItem("cut-slider", "BPIG_22April", "items/slider-1.xml", "3.0.1"),
  "cut-text-entry": cutItem("cut-text-entry", "BPIG_22April", "items/BG010.xml", "3.0.1"),
  "cut-upload": cutItem("cut-upload", "BBQsTest", "id-90b59b73c8e4/upload-file.xml", "3.0.0"),
};

/**
 * The item of `BPIG_22April` that every `html-<element>` fixture is cut from, `cut-choice`'s
 * source (spec 3.6's pick for `qti-choice-interaction`).
 */
const bgChoiceItem = "items/BG007.xml";

/**
 * The paragraph of {@link bgChoiceItem}'s item body that every `html-<element>` edit replaces.
 */
const bgChoiceQuestion = "<p>This is a True/False question?</p>";

/**
 * The body of one table row cell, which the table fixtures share.
 */
const bodyRow = "<tbody><tr><td>cell</td></tr></tbody>";

/**
 * Build the spec of one hand-written HTML positive: `cut-choice`'s item with
 * {@link bgChoiceQuestion} replaced by `use`, then cut like any cut item.
 *
 * `use` is the paragraph as it was with a minimal valid use of the element where
 * `864e756f.md` section 3.4's host matrix admits it. An inline element sits inside the paragraph;
 * a block element follows it in the item body, which admits `HBLOCK` only; a part of a structure
 * sits in a minimal host (`caption`, `col`, `colgroup`, `thead`, `tfoot` and `th` in a `table`;
 * `dd` and `dt` in a `dl`; `summary` in a `details`, which sits in a `div` because the XSD's item
 * body does not admit `details` (`kinds/asi.ts`); `param` in an `object`; `rp` and `rtc` in a
 * `ruby`). The text is ASCII, because an edit is written as latin1.
 *
 * @param element - The element the fixture exercises.
 * @param use - The text that replaces the item body's first paragraph.
 * @param files - The files the item names that its package does not hold, added before the cut.
 * @returns The spec, named `html-<element>`.
 */
const htmlItem = (element: string, use: string, files: readonly FileEdit[] = []): FixtureSpec => ({
  edits: [
    ...files,
    replaceIn(bgChoiceItem, bgChoiceQuestion, use),
    { _tag: "cut", item: bgChoiceItem, schemaversion: "3.0.1" },
  ],
  member: corpusMembers.BPIG_22April,
  name: `html-${element}`,
});

/**
 * The 40 hand-written HTML positives, one row per element of {@link htmlElements}.
 */
const htmlSpecs: Record<`html-${(typeof htmlElements)[number]}`, FixtureSpec> = {
  "html-abbr": htmlItem("abbr", "<p>This is a True/False question? <abbr>T/F</abbr></p>"),
  "html-acronym": htmlItem(
    "acronym",
    "<p>This is a True/False question? <acronym>TF</acronym></p>",
  ),
  "html-address": htmlItem("address", `${bgChoiceQuestion}<address>1 Main Street</address>`),
  "html-article": htmlItem("article", `${bgChoiceQuestion}<article><p>An article.</p></article>`),
  "html-aside": htmlItem("aside", `${bgChoiceQuestion}<aside><p>An aside.</p></aside>`),
  "html-audio": htmlItem(
    "audio",
    `${bgChoiceQuestion}<audio controls="controls"><source src="audio/clip.mp3" type="audio/mpeg"/></audio>`,
    [
      {
        _tag: "addFile",
        path: "items/audio/clip.mp3",
        source: { member: "qtiv3-examples/packaging/items/tree.mp3" },
      },
    ],
  ),
  "html-bdi": htmlItem("bdi", "<p>This is a True/False question? <bdi>isolated</bdi></p>"),
  "html-big": htmlItem("big", "<p>This is a True/False question? <big>big</big></p>"),
  "html-caption": htmlItem(
    "caption",
    `${bgChoiceQuestion}<table><caption>A caption.</caption>${bodyRow}</table>`,
  ),
  "html-cite": htmlItem("cite", "<p>This is a True/False question? <cite>A title</cite></p>"),
  "html-code": htmlItem("code", "<p>This is a True/False question? <code>x = 1</code></p>"),
  "html-col": htmlItem("col", `${bgChoiceQuestion}<table><col/>${bodyRow}</table>`),
  "html-colgroup": htmlItem(
    "colgroup",
    `${bgChoiceQuestion}<table><colgroup><col/></colgroup>${bodyRow}</table>`,
  ),
  "html-dd": htmlItem("dd", `${bgChoiceQuestion}<dl><dd>A definition.</dd></dl>`),
  "html-details": htmlItem(
    "details",
    `${bgChoiceQuestion}<div><details><summary>Hint</summary><p>A hint.</p></details></div>`,
  ),
  "html-dfn": htmlItem("dfn", "<p>This is a True/False question? <dfn>term</dfn></p>"),
  "html-dl": htmlItem("dl", `${bgChoiceQuestion}<dl><dt>Term</dt><dd>A definition.</dd></dl>`),
  "html-dt": htmlItem("dt", `${bgChoiceQuestion}<dl><dt>Term</dt></dl>`),
  "html-footer": htmlItem("footer", `${bgChoiceQuestion}<footer><p>A footer.</p></footer>`),
  "html-h4": htmlItem("h4", `${bgChoiceQuestion}<h4>A heading</h4>`),
  "html-h6": htmlItem("h6", `${bgChoiceQuestion}<h6>A heading</h6>`),
  "html-header": htmlItem("header", `${bgChoiceQuestion}<header><p>A header.</p></header>`),
  "html-kbd": htmlItem("kbd", "<p>This is a True/False question? <kbd>Enter</kbd></p>"),
  "html-label": htmlItem("label", "<p>This is a True/False question? <label>A label</label></p>"),
  "html-nav": htmlItem("nav", `${bgChoiceQuestion}<nav><p>A nav.</p></nav>`),
  "html-ol": htmlItem("ol", `${bgChoiceQuestion}<ol><li>One</li></ol>`),
  "html-param": htmlItem(
    "param",
    `<p>This is a True/False question? <object data="images/train.png" type="image/png"><param name="n" value="v" valuetype="DATA"/></object></p>`,
  ),
  "html-pre": htmlItem("pre", `${bgChoiceQuestion}<pre>a  b</pre>`),
  "html-q": htmlItem("q", "<p>This is a True/False question? <q>quoted</q></p>"),
  "html-rp": htmlItem(
    "rp",
    "<p>This is a True/False question? <ruby>base<rp>(</rp><rt>top</rt><rp>)</rp></ruby></p>",
  ),
  "html-rtc": htmlItem(
    "rtc",
    "<p>This is a True/False question? <ruby>base<rtc><rt>top</rt></rtc></ruby></p>",
  ),
  "html-samp": htmlItem("samp", "<p>This is a True/False question? <samp>output</samp></p>"),
  "html-small": htmlItem(
    "small",
    "<p>This is a True/False question? <small>fine print</small></p>",
  ),
  "html-sub": htmlItem("sub", "<p>This is a True/False question? H<sub>2</sub>O</p>"),
  "html-summary": htmlItem(
    "summary",
    `${bgChoiceQuestion}<div><details><summary>Hint</summary><p>A hint.</p></details></div>`,
  ),
  "html-tfoot": htmlItem(
    "tfoot",
    `${bgChoiceQuestion}<table>${bodyRow}<tfoot><tr><td>total</td></tr></tfoot></table>`,
  ),
  "html-th": htmlItem(
    "th",
    `${bgChoiceQuestion}<table><tbody><tr><th>head</th><td>cell</td></tr></tbody></table>`,
  ),
  "html-thead": htmlItem(
    "thead",
    `${bgChoiceQuestion}<table><thead><tr><td>head</td></tr></thead>${bodyRow}</table>`,
  ),
  "html-tt": htmlItem("tt", "<p>This is a True/False question? <tt>mono</tt></p>"),
  "html-var": htmlItem("var", "<p>This is a True/False question? <var>x</var></p>"),
};

/**
 * The item of `BBQsTest` that `controls-3-0-0` is cut from: an extended-text item of a package
 * whose schema is 3.0.0 (spec 3.6's pick for the 3.0.0 version).
 */
const bbqExtendedTextItem = "id-1ccd6e04685f/ShortAnswer-extText-postcard.xml";

/**
 * The root element's last attribute of {@link bgChoiceItem}, which the copies that give the root
 * `tool-name` and `tool-version` extend.
 */
const bgRootAttribute = 'time-dependent="false"';

/**
 * The opening tag of {@link bgChoiceItem}'s choice interaction.
 */
const bgInteractionOpen = '<qti-choice-interaction max-choices="1" response-identifier="RESPONSE">';

/**
 * The spec of one XML copy of phase 2's fixtures b (negatives, part one): a cut of
 * {@link bgChoiceItem} with `edits` applied first.
 *
 * @param name - The fixture's name, one of {@link copyNames}.
 * @param edits - The `ReplaceText` edits of the item, each of which must match exactly once.
 * @returns The spec, cut at schema version 3.0.1 like any `BPIG_22April` item.
 */
const bgCopy = (name: string, edits: readonly TextEdit[]): FixtureSpec => ({
  edits: [...edits, { _tag: "cut", item: bgChoiceItem, schemaversion: "3.0.1" }],
  member: corpusMembers.BPIG_22April,
  name,
});

/**
 * Lines of XML text, each without its indentation, as the metadata fixtures build their inserted
 * elements.
 */
type Lines = readonly string[];

/**
 * The line terminator of `simple`'s `imsmanifest.xml`, which every inserted line ends with.
 */
const CRLF = "\r\n";

/**
 * Build an element as lines: its start tag, its children one level in and its end tag.
 *
 * @param name - The qualified name.
 * @param attributes - The attributes with their leading space, or `""`.
 * @param children - The child elements, comments and leaves, in order.
 * @returns The lines, the children indented four spaces as the manifest is.
 */
const element = (name: string, attributes: string, ...children: readonly Lines[]): Lines => [
  `<${name}${attributes}>`,
  ...children.flat().map((line) => `    ${line}`),
  `</${name}>`,
];

/**
 * Build an element holding only text.
 *
 * @param name - The qualified name.
 * @param value - The text, already escaped.
 * @returns The element as one line.
 */
const leaf = (name: string, value: string): Lines => [`<${name}>${value}</${name}>`];

/**
 * Build a comment.
 *
 * @param value - The comment's text.
 * @returns The comment as one line.
 */
const note = (value: string): Lines => [`<!-- ${value} -->`];

/**
 * Lay lines out at a column.
 *
 * @param column - The number of spaces before every line.
 * @param lines - The lines, relative to each other.
 * @returns The lines each padded and joined with the manifest's terminator.
 */
const atColumn = (column: number, lines: Lines): string =>
  lines.map((line) => `${" ".repeat(column)}${line}`).join(CRLF);

/**
 * Lay lines out at a column for a replacement that continues a line already indented to it.
 *
 * @param column - The column the first line already sits at.
 * @param lines - The lines, relative to each other.
 * @returns {@link atColumn} 's text without the first line's padding.
 */
const continuingAt = (column: number, lines: Lines): string => atColumn(column, lines).trimStart();

/**
 * Build an `imsmd:` element holding only text, as a `CharacterString`.
 *
 * @param name - The local name.
 * @param value - The text.
 * @returns The element as one line.
 */
const mdLeaf = (name: string, value: string): Lines => leaf(`imsmd:${name}`, value);

/**
 * Build an `imsmd:` container.
 *
 * @param name - The local name.
 * @param children - The children, in order.
 * @returns The container's lines.
 */
const mdGroup = (name: string, ...children: readonly Lines[]): Lines =>
  element(`imsmd:${name}`, "", ...children);

/**
 * Build an `imsmd:` `LangString`: the element holding one `imsmd:string`.
 *
 * @param name - The local name.
 * @param value - The string.
 * @returns The element's lines.
 */
const mdText = (name: string, value: string): Lines => mdGroup(name, leaf("imsmd:string", value));

/**
 * Build an `imsmd:` vocabulary leaf in its `source` and `value` form.
 *
 * @param name - The local name.
 * @param value - The vocabulary value.
 * @returns The element's lines, under source `LOMv1.0`.
 */
const mdVocabulary = (name: string, value: string): Lines =>
  mdGroup(name, mdLeaf("source", "LOMv1.0"), mdLeaf("value", value));

/**
 * Build a minimal `imsmd:lom` whose `general` holds a title.
 *
 * @param title - The title's string.
 * @returns The `lom`'s lines.
 */
const titledLom = (title: string): Lines =>
  mdGroup("lom", mdGroup("general", mdText("title", title)));

/**
 * `simple`'s `qtiMetadata` block, as it stands at lines 53 to 58 of `imsmanifest.xml`.
 */
const qtiMetadata: Lines = element(
  "imsqti:qtiMetadata",
  "",
  leaf("imsqti:timeDependent", "false"),
  leaf("imsqti:interactionType", "choiceInteraction"),
  leaf("imsqti:feedbackType", "none"),
  leaf("imsqti:solutionAvailable", "true"),
);

/**
 * The column of the resource `lom`'s children in `simple`'s manifest (line 59 is the `lom`, at 16).
 */
const resourceLomChildren = 20;

/**
 * The end of the resource `lom` in `simple`'s manifest (lines 85 to 91): its `rights` closes at
 * column 20 and the `lom` at 16. The metadata fixtures that add children to the `lom` search here.
 */
const resourceLomEnd = `</imsmd:rights>${CRLF}                </imsmd:lom>`;

/**
 * The end of the manifest-level `lom` of `simple`'s manifest (lines 41 to 47): its `rights` closes
 * at column 12 and the `lom` at 8.
 */
const manifestLomEnd = `</imsmd:rights>${CRLF}        </imsmd:lom>`;

/**
 * The `ReplaceText` edit that adds children to the end of the resource `lom`.
 *
 * @param children - The children, after `rights`.
 * @returns The edit as plain data.
 */
const endResourceLom = (...children: readonly Lines[]): Edit =>
  replaceIn(
    "imsmanifest.xml",
    resourceLomEnd,
    `</imsmd:rights>${CRLF}${atColumn(resourceLomChildren, children.flat())}${CRLF}                </imsmd:lom>`,
  );

/**
 * The first `educational` of `lomrest`: every child of the category with its comment.
 */
const fullEducational: Lines = mdGroup(
  "educational",
  note("every child of educational, as the loose schema lists them"),
  mdVocabulary("interactivityType", "active"),
  mdVocabulary("learningResourceType", "exercise"),
  mdVocabulary("interactivityLevel", "medium"),
  mdVocabulary("semanticDensity", "low"),
  mdVocabulary("intendedEndUserRole", "learner"),
  mdVocabulary("context", "school"),
  mdText("typicalAgeRange", "10-12"),
  mdVocabulary("difficulty", "easy"),
  mdGroup(
    "typicalLearningTime",
    mdLeaf("duration", "PT30M"),
    mdText("description", "Half an hour of work."),
  ),
  mdText("description", "A short worked example."),
  mdLeaf("language", "en"),
);

/**
 * The `classification` of `lomrest`: a purpose, two taxon paths, a description and a keyword.
 */
const fullClassification: Lines = mdGroup(
  "classification",
  mdVocabulary("purpose", "discipline"),
  mdGroup(
    "taxonPath",
    mdText("source", "Example scheme"),
    mdGroup("taxon", mdLeaf("id", "M1"), mdText("entry", "Mathematics")),
  ),
  mdGroup(
    "taxonPath",
    mdText("source", "Example scheme"),
    mdGroup("taxon", mdLeaf("id", "M1.2"), mdText("entry", "Arithmetic")),
  ),
  mdText("description", "Filed under arithmetic."),
  mdText("keyword", "reading"),
);

/**
 * The `relation` of `lomrest`: a kind and a related resource with its identifier.
 */
const fullRelation: Lines = mdGroup(
  "relation",
  mdVocabulary("kind", "precludes"),
  mdGroup(
    "resource",
    mdGroup("identifier", mdLeaf("catalog", "URI"), mdLeaf("entry", "urn:example:other-item")),
    mdText("description", "An item this one cannot be set beside."),
  ),
);

/**
 * The `annotation` of `lomrest`: an entity, a date and a description.
 */
const fullAnnotation: Lines = mdGroup(
  "annotation",
  mdLeaf("entity", "reviewer"),
  mdGroup("date", mdLeaf("dateTime", "2026-01-15"), mdText("description", "Reviewed in January.")),
  mdText("description", "Read through and accepted."),
);

/**
 * The second `educational` of `lomrest`, which repeats the category.
 */
const secondEducational: Lines = mdGroup(
  "educational",
  mdText("description", "A second educational category."),
);

/**
 * The edits of `lomrest`: the resource `lom` gains the five categories after `rights`.
 */
const lomrestEdits: readonly Edit[] = [
  endResourceLom(
    fullEducational,
    fullClassification,
    fullRelation,
    fullAnnotation,
    secondEducational,
  ),
];

/**
 * Build the `ReplaceText` edit that adds a sibling after one element of `lomrest`.
 *
 * @param closing - The end tag of the element the sibling follows, which occurs once in `lomrest`.
 * @param column - The column of that element.
 * @param sibling - The sibling to add.
 * @returns The edit as plain data.
 */
const addAfter = (closing: string, column: number, sibling: Lines): Edit =>
  replaceIn("imsmanifest.xml", closing, `${closing}${CRLF}${atColumn(column, sibling)}`);

/**
 * The namespace of the curriculum standards metadata, from the `targetNamespace` of
 * `imsqtiv3p0_csmv1p1_v1p0.xsd` and the `csmd` declaration of `CASEWithOutcome.zip`'s manifest.
 */
const csmNamespace = "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscsmd_v1p1";

/**
 * The edit that declares `csmd` on the manifest root, after `xmlns:imsqti` (line 6).
 */
const declareCsmd: Edit = replaceIn(
  "imsmanifest.xml",
  'xmlns:imsqti="http://www.imsglobal.org/xsd/imsqti_metadata_v3p0" ',
  `xmlns:imsqti="http://www.imsglobal.org/xsd/imsqti_metadata_v3p0" ${CRLF}${" ".repeat(10)}xmlns:csmd="${csmNamespace}" `,
);

/**
 * The URI the CASE register gives an item.
 *
 * @param guid - The item's GUID.
 * @returns The `caseItemURI`.
 */
const caseItemUri = (guid: string): string => `http://www.imsglobal.org/caseregistry/${guid}`;

/**
 * Build a `labelledGUID`, as `CASEWithOutcome.zip`'s manifest does.
 *
 * @param scope - What the item is addressed by, in its label.
 * @param guid - The item's GUID.
 * @returns The `labelledGUID`'s lines.
 */
const labelledGuid = (scope: string, guid: string): Lines =>
  element(
    "csmd:labelledGUID",
    "",
    leaf(
      "csmd:label",
      `GUID for a top-level Learning Standard Item definition addressed by this ${scope}.`,
    ),
    leaf("csmd:caseItemURI", caseItemUri(guid)),
    leaf("csmd:GUID", guid),
  );

/**
 * Build a `setOfGUIDs` with a comment and one `labelledGUID` per GUID.
 *
 * @param region - The `region` attribute.
 * @param scope - What the items are addressed by.
 * @param guids - The GUIDs, in order.
 * @returns The set's lines.
 */
const setOfGuids = (region: string, scope: string, guids: readonly string[]): Lines =>
  element(
    "csmd:setOfGUIDs",
    ` region="${region}" version="1.0"`,
    note(`identifiers of the ${region} standards`),
    ...guids.map((guid) => labelledGuid(scope, guid)),
  );

/**
 * The GUIDs of the manifest-level set and of the resource-level set, each as a Texas pair and a
 * Florida pair taken from `CASEWithOutcome.zip`'s manifest. No GUID is in two sets, so each is a
 * unique search for the negatives.
 */
const csmGuids = {
  manifest: [
    ["e57e4172-44ae-11e9-b210-d663bd873d93", "2759e09c-44af-11e9-b210-d663bd873d93"],
    ["0c06bc21-c83a-4635-a90a-b55e3b1added", "fd4412d1-0687-4f2b-b610-8a9161dad42d"],
  ],
  resource: [
    ["a3d6bbda-44b0-11e9-b210-d663bd873d93", "b1ffaba4-44b0-11e9-b210-d663bd873d93"],
    ["7a1a83f8-a371-46e8-96ab-2af89223af79", "ce496478-235a-4d85-abee-805475838cf0"],
  ],
  second: [
    ["3c1d0a52-44b1-11e9-b210-d663bd873d93", "4e2f1b63-44b1-11e9-b210-d663bd873d93"],
    ["9d8e7f60-1b2a-4c3d-8e4f-5a6b7c8d9e0f", "1f2e3d4c-5b6a-4798-8a9b-0c1d2e3f4a5b"],
  ],
  spare: "5b4bfc1c-5e7b-4f43-8f0e-ee2a8d7dbb8e",
} as const;

/**
 * Build a curriculum standards metadata set: one `curriculumStandardsMetadata` with a Texas and a
 * Florida `setOfGUIDs`.
 *
 * @param attributes - The set's attributes with their leading space.
 * @param scope - What the items are addressed by.
 * @param guids - The Texas pair and the Florida pair.
 * @returns The set's lines.
 */
const csmSet = (
  attributes: string,
  scope: string,
  guids: readonly [readonly string[], readonly string[]],
): Lines =>
  element(
    "csmd:curriculumStandardsMetadataSet",
    attributes,
    element(
      "csmd:curriculumStandardsMetadata",
      ' providerId="IMS_CASE_REGISTER"',
      setOfGuids("Texas", scope, guids[0]),
      setOfGuids("Florida", scope, guids[1]),
    ),
  );

/**
 * The set under the manifest `metadata`, which `csm` adds between `schemaversion` and the manifest
 * `lom` (lines 11 and 12).
 */
const manifestCsmSet: Lines = csmSet(
  ' resourceLabel="Package (QTI 3.0)"',
  "package",
  csmGuids.manifest,
);

/**
 * The set under the resource `metadata`, which `csm` adds between `qtiMetadata` and the resource
 * `lom` (lines 58 and 59).
 */
const resourceCsmSet: Lines = csmSet(' resourcePartId="choice"', "resource", csmGuids.resource);

/**
 * The edits of `csm`: the declaration and one set under each `metadata`, each just before its
 * `lom`. That is where the content-packaging XSD's sequences put it: `schema`, `schemaversion`, the
 * set, `lom` in the manifest's (`imsqtiv3p0_imscpv1p2_v1p0.xsd` lines 324 to 345) and
 * `qtiMetadata`, the set, `lom` in a resource's (lines 441 to 443). `CASEWithOutcome.zip`'s
 * manifest writes them in the same order. The children of the manifest `metadata` sit at column 8,
 * and the resource's at 16.
 */
const csmEdits: readonly Edit[] = [
  declareCsmd,
  replaceIn(
    "imsmanifest.xml",
    `</schemaversion>${CRLF}        <imsmd:lom>`,
    `</schemaversion>${CRLF}${atColumn(8, manifestCsmSet)}${CRLF}        <imsmd:lom>`,
  ),
  replaceIn(
    "imsmanifest.xml",
    `</imsqti:qtiMetadata>${CRLF}                <imsmd:lom>`,
    `</imsqti:qtiMetadata>${CRLF}${atColumn(16, resourceCsmSet)}${CRLF}                <imsmd:lom>`,
  ),
];

/**
 * The text of the resource-level Florida `labelledGUID`s, where the set's children sit at column 28.
 */
const resourceFloridaGuids: string = continuingAt(
  28,
  csmGuids.resource[1].flatMap((guid) => labelledGuid("resource", guid)),
);

/**
 * The text of a `GUID` leaf and the `caseItemURI` before it, in the resource-level Texas set,
 * whose `labelledGUID` children sit at column 32.
 */
const resourceUriAndGuid: string = continuingAt(32, [
  ...leaf("csmd:caseItemURI", caseItemUri(csmGuids.resource[0][1])),
  ...leaf("csmd:GUID", csmGuids.resource[0][1]),
]);

/**
 * The qtiMetadata block as one text, for the edits that search for it where it stands in the
 * manifest (lines 53 to 58), its first line unpadded.
 */
const qtiMetadataInPlace: string = continuingAt(16, qtiMetadata);

/**
 * The edit that removes the block from the resource `metadata`, where `nestedqmd` takes it from.
 */
const takeQtiMetadataOut: Edit = replaceIn(
  "imsmanifest.xml",
  `${qtiMetadataInPlace}${CRLF}                <imsmd:lom>`,
  "<imsmd:lom>",
);

/**
 * Build the `ReplaceText` edit that adds the qtiMetadata block as the last child of a `lom`.
 *
 * @param end - The text that ends the `lom`, as {@link resourceLomEnd} and {@link manifestLomEnd}.
 * @param column - The column of the `lom`'s children; the `lom` closes four columns before it.
 * @returns The edit as plain data.
 */
const putQtiMetadataIn = (end: string, column: number): Edit =>
  replaceIn(
    "imsmanifest.xml",
    end,
    `</imsmd:rights>${CRLF}${atColumn(column, qtiMetadata)}${CRLF}${" ".repeat(column - 4)}</imsmd:lom>`,
  );

/**
 * The `lom`s and curriculum sets of the file `images/sign.png` in `filelom`, inside its one
 * `metadata`: two `lom`s each with a titled `general`, and two sets.
 */
const fileMetadataChildren: readonly Lines[] = [
  titledLom("Sign image"),
  titledLom("Sign image, long description"),
  csmSet(' resourceLabel="Image (QTI 3.0)"', "image", csmGuids.manifest),
  csmSet(' resourceLabel="Image text (QTI 3.0)"', "image text", csmGuids.second),
];

/**
 * The file `images/sign.png` of `filelom`: its `metadata` closes at column 16 and the file at 12.
 */
const fileWithMetadata: Lines = element(
  "file",
  ' href="images/sign.png"',
  element("metadata", "", ...fileMetadataChildren),
);

/**
 * The end of `filelom`'s file, where the negatives add to its `metadata`.
 */
const fileMetadataEnd = `</metadata>${CRLF}            </file>`;

/**
 * The edits of `filelom`: the declaration, and the file `images/sign.png` gaining its `metadata`.
 */
const filelomEdits: readonly Edit[] = [
  declareCsmd,
  replaceIn(
    "imsmanifest.xml",
    '<file href="images/sign.png"/>',
    continuingAt(12, fileWithMetadata),
  ),
];

/**
 * The record resource of `extmeta`, after `choice` in `simple`'s manifest (line 95 closes
 * `choice`).
 *
 * @param identifier - The resource's identifier.
 * @param attributes - The attributes after the identifier, with their leading space.
 * @param files - The `href` of each file the resource lists.
 * @returns The resource's lines.
 */
const recordResource = (identifier: string, attributes: string, files: readonly string[]): Lines =>
  element(
    "resource",
    ` identifier="${identifier}"${attributes}`,
    ...files.map((href): Lines => [`<file href="${href}"/>`]),
  );

/**
 * The attributes of a record resource that names `meta/choice.xml` as its `href`.
 */
const recordAttributes = ' type="resourcemetadata/xml" href="meta/choice.xml"';

/**
 * The end of the last resource of `simple`'s manifest (lines 95 and 96), where `extmeta` adds its
 * record resources.
 */
const resourcesEnd = `</resource>${CRLF}    </resources>`;

/**
 * Build the edit that adds resources after the last one.
 *
 * @param resources - The resources to add.
 * @returns The edit as plain data.
 */
const addResources = (...resources: readonly Lines[]): Edit =>
  replaceIn(
    "imsmanifest.xml",
    resourcesEnd,
    `</resource>${CRLF}${atColumn(8, resources.flat())}${CRLF}    </resources>`,
  );

/**
 * The published record that `extmeta` takes its `meta/choice.xml` from: the LOM of an item in
 * `externalMetadata.zip`.
 */
const externalRecord: FileSource = {
  path: "testitems/metadata_747eee11-848c-597a-8c9c-a71c5399798d.xml",
  zip: "qtiv3-examples/packaging/externalMetadata/externalMetadata.zip",
};

/**
 * The edits of `extmeta` that put the record resource in the manifest and make `choice` depend on
 * it: a `dependency` after the last `file` of `choice` (line 94) and the resource after `choice`.
 */
const extmetaManifestEdits: readonly Edit[] = [
  replaceIn(
    "imsmanifest.xml",
    '<file href="images/sign.png"/>',
    `<file href="images/sign.png"/>${CRLF}            <dependency identifierref="choice-meta"/>`,
  ),
  addResources(recordResource("choice-meta", recordAttributes, ["meta/choice.xml"])),
];

/**
 * The edits of `extmeta` that put the record in `meta/choice.xml`: the published file, unchanged,
 * including the two `xml:lang="en"` attributes it carries (on the `lom:string`s `jacs` and
 * `Mathematics`).
 */
const extmetaRecordEdits: readonly Edit[] = [
  { _tag: "addFile", path: "meta/choice.xml", source: externalRecord },
];

/**
 * The edits of `extmeta`: the record resource, the dependency and the record file.
 */
const extmetaEdits: readonly Edit[] = [...extmetaManifestEdits, ...extmetaRecordEdits];

/**
 * Build a spec over `simple`'s member.
 *
 * @param name - The fixture's name.
 * @param edits - The fixture's edits.
 * @returns The spec.
 */
const overSimple = (name: string, edits: readonly Edit[]): FixtureSpec => ({
  edits,
  member: simpleMember,
  name,
});

/**
 * The line of `simple`'s manifest that ends the resource's `general` title, after which
 * `item-lang-en` writes the resource's `general.language`.
 */
const simpleResourceTitleEnd = 66;

/**
 * The `general` element of `simple`'s resource LOM, as the manifest writes it (CRLF lines), which
 * `item-lang-no-general` removes.
 */
const simpleResourceGeneral = [
  "<imsmd:general>",
  "                        <imsmd:identifier>",
  "                            <imsmd:entry>choice</imsmd:entry>",
  "                        </imsmd:identifier>",
  "                        <imsmd:title>",
  "                            <imsmd:string>Unattended Luggage</imsmd:string>",
  "                        </imsmd:title>",
  "                        <imsmd:description>",
  "                            <imsmd:string>This example illustrates the",
  "                                choiceInteraction being used to obtain a single response from the candidate.</imsmd:string>",
  "                        </imsmd:description>",
  "                    </imsmd:general>",
].join("\r\n");

/**
 * The edit that gives `simple`'s item root an `xml:lang` of `en`.
 */
const simpleItemLang = replaceIn(
  "choice.xml",
  'adaptive="false" time-dependent="false">',
  'adaptive="false" time-dependent="false" xml:lang="en">',
);

/**
 * The question of {@link bgChoiceItem} with a `qti-template-inline` in it, which
 * `rubric-template-kinds` writes in place of {@link bgChoiceQuestion}.
 */
const bgTemplateQuestion =
  '<p>This is a True/False <qti-template-inline template-identifier="T" identifier="ti">question</qti-template-inline>?</p>';

/**
 * The declaration of a template variable `T`, which the template block and inline kinds read.
 */
const templateDeclaration =
  '<qti-template-declaration base-type="identifier" cardinality="single" identifier="T"/>';

/**
 * The edits of `adaptive-one-feedback` and `adaptive-zero-feedback`: the choice interaction of
 * {@link bgChoiceItem} goes in the content body of a feedback block, the `FEEDBACK` outcome the
 * block reads is declared, and the root writes `adaptive`, which the item does not.
 *
 * @param adaptive - The root's `adaptive`, an `xs:boolean` spelling.
 * @returns The edits, each of which must match exactly once.
 */
const feedbackWrapped = (adaptive: string): readonly TextEdit[] => [
  replaceIn(
    bgChoiceItem,
    bgInteractionOpen,
    `<qti-feedback-block outcome-identifier="FEEDBACK" identifier="shown" show-hide="show"><qti-content-body>${bgInteractionOpen}`,
  ),
  replaceIn(
    bgChoiceItem,
    "</qti-choice-interaction>",
    "</qti-choice-interaction></qti-content-body></qti-feedback-block>",
  ),
  replaceIn(
    bgChoiceItem,
    "</qti-outcome-declaration>",
    '</qti-outcome-declaration><qti-outcome-declaration base-type="identifier" cardinality="single" identifier="FEEDBACK"/>',
  ),
  replaceIn(bgChoiceItem, bgRootAttribute, `adaptive="${adaptive}" ${bgRootAttribute}`),
];

/**
 * The XML copies of {@link copyNames}.
 *
 * - `admission-choice-in-feedback` moves the second choice into the content body of a feedback block,
 *   where `Admission` admits no simple choice (a `FEEDBACK` outcome is declared for the block to
 *   read).
 * - `gap-outside-gap-match` has a `qti-gap` in an item with no gap-match interaction, which the
 *   ancestry bans.
 * - `controls-3-0-0` is the 3.0.0 pick for `controls`: an extended-text item whose manifest and root
 *   declare 3.0.0 with a `video controls="controls"`, a 3.0.1 spelling.
 * - `padded-m1-attributes` carries decision 19's witnesses, one per class (spec 4.11): a `class` that
 *   collapses, a `label` that is replaced and an `aria-valuetext` that is preserved. `label` is not
 *   on the item root, so the root carries `tool-name` and `tool-version`.
 * - `empty-class` is campaign decision 22's pair, `class=""` and `class=" "`.
 * - `hottext-in-prompt` has a `qti-hottext` in a `span` in the choice interaction's `qti-prompt`.
 *
 * Fixtures c (phase 2, V34) adds six:
 *
 * - `label-3-0-0` is the 3.0.0 extended-text pick given `label="L"` on its root and no tool fields,
 *   which 3.0.0 admits (goal 3.12).
 * - `manifest-xml-lang` is `sharedMedia` with an `xml:lang="en"` on the first `lom:string` of its
 *   manifest (decision 16, spec 3.10).
 * - `item-lang-en` is `simple` whose item root carries `xml:lang="en"` and whose resource LOM
 *   `general` lists the language `en` (R26).
 * - `item-lang-no-general` is the same item with the resource LOM's `general` removed, so R26's
 *   exemption holds.
 * - `adaptive-one-feedback` wraps the choice interaction of {@link bgChoiceItem} in a feedback block
 *   and writes `adaptive="1"` on the root, an `xs:boolean` true.
 * - `adaptive-zero-feedback` is the same copy with `adaptive="0"`, which is false.
 *
 * Fixtures a (phase 2, V32) adds two, which between them hold each feedback and template kind once:
 *
 * - `feedback-block-kinds` holds a `qti-feedback-block`, a `qti-template-block` and, in that block's
 *   content body, a `qti-feedback-block.template`, with the `FEEDBACK` outcome and the template
 *   variable `T` declared.
 * - `rubric-template-kinds` holds a `qti-rubric-block` with a `qti-template-block.rubric` and a
 *   `qti-template-inline.rubric`, and a `qti-template-inline` in the question.
 */
const copySpecs: Record<(typeof copyNames)[number], FixtureSpec> = {
  "adaptive-one-feedback": bgCopy("adaptive-one-feedback", feedbackWrapped("1")),
  "adaptive-zero-feedback": bgCopy("adaptive-zero-feedback", feedbackWrapped("0")),
  "admission-choice-in-feedback": bgCopy("admission-choice-in-feedback", [
    replaceIn(bgChoiceItem, '<qti-simple-choice identifier="false">False</qti-simple-choice>', ""),
    replaceIn(
      bgChoiceItem,
      "</qti-choice-interaction>",
      '</qti-choice-interaction><qti-feedback-block outcome-identifier="FEEDBACK" identifier="wrong" show-hide="show"><qti-content-body><qti-simple-choice identifier="false">False</qti-simple-choice></qti-content-body></qti-feedback-block>',
    ),
    replaceIn(
      bgChoiceItem,
      "</qti-outcome-declaration>",
      '</qti-outcome-declaration><qti-outcome-declaration base-type="identifier" cardinality="single" identifier="FEEDBACK"/>',
    ),
  ]),
  "controls-3-0-0": {
    edits: [
      {
        _tag: "addFile",
        path: "id-1ccd6e04685f/video/clip.mp4",
        source: { member: "QTI3_BPIG_Examples/items/images/bubble.mp4" },
      },
      replaceIn(
        bbqExtendedTextItem,
        "<p><br/>Here is a sample response:</p>",
        '<video controls="controls"><source src="video/clip.mp4" type="video/mp4"/></video><p><br/>Here is a sample response:</p>',
      ),
      { _tag: "cut", item: bbqExtendedTextItem, schemaversion: "3.0.0" },
    ],
    member: corpusMembers.BBQsTest,
    name: "controls-3-0-0",
  },
  "empty-class": bgCopy("empty-class", [
    replaceIn(
      bgChoiceItem,
      bgChoiceQuestion,
      '<div class=""><p>This is a True/False question?</p></div><p class="  ">Choose one.</p>',
    ),
  ]),
  "feedback-block-kinds": bgCopy("feedback-block-kinds", [
    replaceIn(
      bgChoiceItem,
      "</qti-choice-interaction>",
      '</qti-choice-interaction><qti-feedback-block outcome-identifier="FEEDBACK" identifier="fa"><qti-content-body><p>Wrong</p></qti-content-body></qti-feedback-block><qti-template-block template-identifier="T" identifier="tb"><qti-content-body><qti-feedback-block outcome-identifier="FEEDBACK" identifier="ft" show-hide="hide"><qti-content-body><p>Hint</p></qti-content-body></qti-feedback-block></qti-content-body></qti-template-block>',
    ),
    replaceIn(
      bgChoiceItem,
      "</qti-outcome-declaration>",
      `</qti-outcome-declaration><qti-outcome-declaration base-type="identifier" cardinality="single" identifier="FEEDBACK"/>${templateDeclaration}`,
    ),
  ]),
  "gap-outside-gap-match": bgCopy("gap-outside-gap-match", [
    replaceIn(bgChoiceItem, bgChoiceQuestion, '<p><qti-gap identifier="G"/></p>'),
  ]),
  "hottext-in-prompt": bgCopy("hottext-in-prompt", [
    replaceIn(
      bgChoiceItem,
      bgInteractionOpen,
      `${bgInteractionOpen}<qti-prompt><span><qti-hottext identifier="H">Pick</qti-hottext></span></qti-prompt>`,
    ),
  ]),
  "item-lang-en": {
    edits: [
      simpleItemLang,
      {
        _tag: "InsertAfterLine",
        file: "imsmanifest.xml",
        line: simpleResourceTitleEnd,
        text: "                        <imsmd:language>en</imsmd:language>",
      },
    ],
    member: simpleMember,
    name: "item-lang-en",
  },
  "item-lang-no-general": {
    edits: [simpleItemLang, replaceIn("imsmanifest.xml", simpleResourceGeneral, "")],
    member: simpleMember,
    name: "item-lang-no-general",
  },
  "label-3-0-0": {
    edits: [
      replaceIn(
        bbqExtendedTextItem,
        'adaptive="false" time-dependent="false">',
        'adaptive="false" time-dependent="false" label="L">',
      ),
      { _tag: "cut", item: bbqExtendedTextItem, schemaversion: "3.0.0" },
    ],
    member: corpusMembers.BBQsTest,
    name: "label-3-0-0",
  },
  "manifest-xml-lang": {
    edits: [
      replaceIn(
        "imsmanifest.xml",
        '<imsmd:string language="en">Shared Image Example</imsmd:string>',
        '<imsmd:string language="en" xml:lang="en">Shared Image Example</imsmd:string>',
      ),
    ],
    member: sharedMediaMember,
    name: "manifest-xml-lang",
  },
  "padded-m1-attributes": bgCopy("padded-m1-attributes", [
    replaceIn(
      bgChoiceItem,
      bgRootAttribute,
      `${bgRootAttribute} tool-name="gr8des" tool-version="1"`,
    ),
    replaceIn(
      bgChoiceItem,
      bgChoiceQuestion,
      '<p class=" a  b ">This is a True/False question?</p><div label="x&#9;y"><p>Choose one.</p></div><p><span aria-valuetext="a&#9;b">Answer.</span></p>',
    ),
  ]),
  "rubric-template-kinds": bgCopy("rubric-template-kinds", [
    replaceIn(
      bgChoiceItem,
      "<qti-item-body>",
      '<qti-item-body><qti-rubric-block use="instructions" view="candidate"><qti-content-body><qti-template-block template-identifier="T" identifier="rb" show-hide="hide"><qti-content-body><p>Read</p></qti-content-body></qti-template-block><qti-template-inline template-identifier="T" identifier="ri" show-hide="hide">note</qti-template-inline></qti-content-body></qti-rubric-block>',
    ),
    replaceIn(bgChoiceItem, bgChoiceQuestion, bgTemplateQuestion),
    replaceIn(
      bgChoiceItem,
      "</qti-outcome-declaration>",
      `</qti-outcome-declaration>${templateDeclaration}`,
    ),
  ]),
};

/**
 * The item of `BPIG_22April` that `cut-text-entry` is cut from, which `end-attempt` edits before
 * it cuts it.
 */
const bgTextEntryItem = "items/BG010.xml";

/**
 * The namespace of the content packaging extension, from the `targetNamespace` of
 * `imsqtiv3p0_cpextv1p2_v1p0.xsd`: the `cpx:variant` element lives here.
 */
const cpxNamespace = "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_extensionv1p2";

/**
 * The namespace of the access for all digital resource description, from the `targetNamespace` of
 * `imsqtiv3p0_afa3p0drd_v1p0.xsd`.
 */
const drdNamespace = "http://www.imsglobal.org/xsd/qti/qtiv3p0/imsafa3p0drd_v1p0";

/**
 * The `Access_For_All_Resource.Type` children `variant` writes, in the sequence order the DRD
 * schema gives: `accessMode`, `adaptationType`, then `languageOfAdaptation`.
 */
const drdChildren: readonly Lines[] = [
  leaf("drd:accessMode", "textual"),
  leaf("drd:adaptationType", "ext:stacked_translation"),
  leaf("drd:languageOfAdaptation", "es"),
];

/**
 * The edit that declares `cpx` and `drd` on the manifest root, after `xmlns:imsqti` (line 6).
 */
const declareVariantNamespaces: Edit = replaceIn(
  "imsmanifest.xml",
  'xmlns:imsqti="http://www.imsglobal.org/xsd/imsqti_metadata_v3p0" ',
  `xmlns:imsqti="http://www.imsglobal.org/xsd/imsqti_metadata_v3p0" ${CRLF}${" ".repeat(10)}xmlns:cpx="${cpxNamespace}" ${CRLF}${" ".repeat(10)}xmlns:drd="${drdNamespace}" `,
);

/**
 * The first `file` of `choice`'s resource, before which `variant-before-file` moves its variant.
 */
const firstFile = '<file href="choice.xml"/>';

/**
 * The last `file` of `choice`'s resource, after which a variant belongs.
 */
const lastFile = '<file href="images/sign.png"/>';

/**
 * How a variant fixture differs from `variant`.
 */
interface VariantOptions {
  /**
   * The `cpx:variant`'s `identifier` as written.
   */
  readonly identifier?: string;
  /**
   * The `identifierref` of the variant: the resource it names.
   */
  readonly identifierref?: string;
  /**
   * The `drd:accessForAllResource` children, in the order written.
   */
  readonly children?: readonly Lines[];
  /**
   * Whether the variant has its `cpx:metadata` child.
   */
  readonly metadata?: boolean;
  /**
   * Whether the variant stands before the first `file` instead of after the last.
   */
  readonly beforeFile?: boolean;
  /**
   * The `schemaversion` text when it is not `3.0.0`.
   */
  readonly schemaversion?: string;
}

/**
 * Build the edits of a variant fixture over `simple`: the Spanish copy of the item as
 * `es/choice.xml`, its resource `choice_es`, the namespaces and a `cpx:variant` on `choice`.
 *
 * @param options - How the fixture differs from `variant`, whose defaults are the valid package.
 * @returns The edits as plain data.
 */
const variantEdits = (options: VariantOptions = {}): readonly Edit[] => {
  const {
    beforeFile = false,
    children = drdChildren,
    identifier = "v1",
    identifierref = "choice_es",
    metadata = true,
    schemaversion = "3.0.0",
  } = options;
  const variant: Lines = element(
    "cpx:variant",
    ` identifier="${identifier}" identifierref="${identifierref}"`,
    metadata
      ? element("cpx:metadata", "", element("drd:accessForAllResource", "", ...children))
      : [],
  );
  const placement: Edit = beforeFile
    ? replaceIn(
        "imsmanifest.xml",
        firstFile,
        `${continuingAt(12, variant)}${CRLF}            ${firstFile}`,
      )
    : replaceIn("imsmanifest.xml", lastFile, `${lastFile}${CRLF}${atColumn(12, variant)}`);

  return [
    { _tag: "copyFile", from: "choice.xml", to: "es/choice.xml" },
    replaceIn(
      "es/choice.xml",
      'identifier="choice" title="Unattended Luggage"',
      'identifier="choice_es" title="Equipaje desatendido"',
    ),
    replaceIn("es/choice.xml", 'src="images/sign.png"', 'src="../images/sign.png"'),
    declareVariantNamespaces,
    placement,
    addResources(
      recordResource("choice_es", ' type="imsqti_item_xmlv3p0" href="es/choice.xml"', [
        "es/choice.xml",
      ]),
    ),
    ...(schemaversion === "3.0.0"
      ? []
      : [
          replaceIn(
            "imsmanifest.xml",
            "<schemaversion>3.0.0</schemaversion>",
            `<schemaversion>${schemaversion}</schemaversion>`,
          ),
        ]),
  ];
};

/**
 * The DRD children of `variant-padded`: the three class witnesses of whitespace. `atInteroperable`
 * (a boolean, collapsed) is padded and `languageOfAdaptation` (a `normalizedString`, replaced)
 * holds a tab character reference; the variant's own `identifier` is padded in the options.
 */
const paddedDrdChildren: readonly Lines[] = [
  leaf("drd:accessMode", "textual"),
  leaf("drd:adaptationType", "ext:stacked_translation"),
  leaf("drd:atInteroperable", " true "),
  leaf("drd:languageOfAdaptation", "es&#9;ES"),
];

/**
 * Build the DRD children of a variant negative from `variant`'s, with extra children placed in the
 * sequence order of `Access_For_All_Resource.Type`.
 *
 * @param between - The children between `adaptationType` and `languageOfAdaptation`.
 * @returns The children, `accessMode` and `adaptationType` first and `languageOfAdaptation` last.
 */
const drdWith = (...between: readonly Lines[]): readonly Lines[] => [
  leaf("drd:accessMode", "textual"),
  leaf("drd:adaptationType", "ext:stacked_translation"),
  ...between,
  leaf("drd:languageOfAdaptation", "es"),
];

/**
 * The resource block of the test outcome that `CASEWithOutcome.zip`'s manifest holds
 * (`Outcome_01`), its `imscp:` prefixes written as the default namespace and its curriculum
 * standards block kept.
 */
const outcomeResource: Lines = element(
  "resource",
  ' identifier="Outcome_01" type="imsqti_outcomes_xmlv3p0" href="testoutcome01.xml"',
  element(
    "metadata",
    "",
    element(
      "csmd:curriculumStandardsMetadataSet",
      ' resourceLabel="Outcome (QTI 3.0)" resourcePartId="SCORE"',
      element(
        "csmd:curriculumStandardsMetadata",
        ' providerId="IMS_CASE_REGISTER"',
        element(
          "csmd:setOfGUIDs",
          ' region="Texas" version="1.0"',
          note("UUID v1.0 used in the Texas examples"),
          ...csmGuids.manifest[0].map((guid) => labelledGuid("Outcome variable", guid)),
        ),
        element(
          "csmd:setOfGUIDs",
          ' region="Florida" version="1.0"',
          note("UUID v4.0 used in the Florida examples"),
          ...csmGuids.manifest[1].map((guid) => labelledGuid("Outcome variable", guid)),
        ),
      ),
    ),
    mdGroup(
      "lom",
      mdGroup(
        "general",
        mdText("title", "Mapping between an Outcome variable for a test and the CSM"),
      ),
    ),
  ),
  ['<file href="testoutcome01.xml"/>'],
);

/**
 * The edits of `outcome`: the `csmd` declaration, the `Outcome_01` resource, its file from
 * `CASEWithOutcome.zip` and a `dependency` on it after `choice`'s last `file`.
 */
const outcomeEdits: readonly Edit[] = [
  declareCsmd,
  replaceIn(
    "imsmanifest.xml",
    lastFile,
    `${lastFile}${CRLF}            <dependency identifierref="Outcome_01"/>`,
  ),
  addResources(outcomeResource),
  {
    _tag: "addFile",
    path: "testoutcome01.xml",
    source: {
      path: "testoutcome01.xml",
      zip: "qtiv3-examples/packaging/CASEWithOutcome/CASEWithOutcome.zip",
    },
  },
];

/**
 * The tarball member the two `lti` fixtures derive from, the package `materializePackage("lti")`
 * extracts.
 */
const ltiMember = "qtiv3-examples/packaging/lti/lti.zip";

/**
 * The tarball member the `usage3` fixtures are extracted from, the `usageData` package.
 */
const usageMember = "qtiv3-examples/packaging/usageData/usageData.zip";

/**
 * The unpackaged QTI fragment `bytes` carries, whose root is `div`.
 */
const fragmentMember = "qtiv3-examples/tests/rtest01-fragment.xml";

/**
 * A well-formed `xs:schema` of ten lines, the payload of `bytes`' `controlfile`.
 */
const schemaStub = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema"',
  '           targetNamespace="urn:example:control"',
  '           elementFormDefault="qualified">',
  '  <xs:element name="control">',
  "    <xs:complexType>",
  '      <xs:attribute name="id" type="xs:string"/>',
  "    </xs:complexType>",
  "  </xs:element>",
  "</xs:schema>",
  "",
].join("\n");

/**
 * A two-lexeme pronunciation lexicon, the payload of `bytes`' `pls`.
 */
const lexicon = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<lexicon version="1.0" xmlns="http://www.w3.org/2005/01/pronunciation-lexicon"',
  '         alphabet="ipa" xml:lang="en">',
  "  <lexeme><grapheme>luggage</grapheme><phoneme>lʌɡɪdʒ</phoneme></lexeme>",
  "  <lexeme><grapheme>sign</grapheme><phoneme>saɪn</phoneme></lexeme>",
  "</lexicon>",
  "",
].join("\n");

/**
 * One packaged-file resource of `bytes`: its type, the file's path and where the bytes come from.
 */
interface BytesResource {
  readonly href: string;
  readonly identifier: string;
  readonly source: FileSource;
  readonly type: string;
}

/**
 * The nine resources `bytes` adds to `simple`, one per type that nothing reads as QTI.
 */
const bytesResources: readonly BytesResource[] = [
  {
    href: "control/item.xsd",
    identifier: "r-controlfile",
    source: { text: schemaStub },
    type: "controlfile",
  },
  { href: "speech/words.pls", identifier: "r-pls", source: { text: lexicon }, type: "pls" },
  {
    href: "css/two.css",
    identifier: "r-css2",
    source: { text: "p { margin: 0; }\n" },
    type: "css2",
  },
  {
    href: "css/three.css",
    identifier: "r-css3",
    source: { text: "p { color: rebeccapurple; }\n" },
    type: "css3",
  },
  {
    href: "web/page.html",
    identifier: "r-webcontent",
    source: {
      text: "<!DOCTYPE html>\n<html><head><title>Page</title></head><body><p>Hello</p></body></html>\n",
    },
    type: "webcontent",
  },
  {
    href: "app/launch.xml",
    identifier: "r-app",
    source: {
      text: '<?xml version="1.0" encoding="UTF-8"?>\n<launch><tool>viewer</tool></launch>\n',
    },
    type: "associatedcontent/learning-application-resource",
  },
  {
    href: "extra/notes.txt",
    identifier: "r-extension",
    source: { text: "An extension resource.\n" },
    type: "extension",
  },
  {
    href: "meta/other.xml",
    identifier: "r-extmeta",
    source: {
      text: '<?xml version="1.0" encoding="UTF-8"?>\n<record><note>arbitrary</note></record>\n',
    },
    type: "resourceextmetadata/xml",
  },
  {
    href: "fragments/rtest01-fragment.xml",
    identifier: "r-fragment",
    source: { member: fragmentMember },
    type: "imsqti_fragment_xmlv3p0",
  },
];

/**
 * Build the manifest edit of `bytes`: the resources added after `choice`.
 *
 * @param resources - The resources to add.
 * @returns The edit as plain data.
 */
const bytesManifestEdit = (resources: readonly BytesResource[]): Edit =>
  addResources(
    ...resources.map((resource) =>
      recordResource(resource.identifier, ` type="${resource.type}" href="${resource.href}"`, [
        resource.href,
      ]),
    ),
  );

/**
 * Build the file edits of `bytes`: each resource's file added from its source.
 *
 * @param resources - The resources whose files are added.
 * @returns The edits as plain data.
 */
const bytesFileEdits = (resources: readonly BytesResource[]): readonly Edit[] =>
  resources.map((resource): Edit => ({
    _tag: "addFile",
    path: resource.href,
    source: resource.source,
  }));

/**
 * The resources of `bytes` that are not its `webcontent`, which `bytes-webcontent-item` replaces.
 */
const bytesWithoutWebcontent: readonly BytesResource[] = bytesResources.filter(
  (resource) => resource.type !== "webcontent",
);

/**
 * The directory of the `rtest01` fixtures, beside `simple`'s item: the three set items of the
 * examples' `tests` folder and the fragment they include, the implementation guide's own example of
 * the `imsqti_fragment_xmlv3p0` resource type (§6.2, "Example tests/rtest01-set01").
 */
const rtest01Directory = "rtest01";

/**
 * The resources of `rtest01`: the three set items, loose members of the tarball, and their shared
 * fragment, each at its own name under {@link rtest01Directory}.
 */
const rtest01Resources: readonly BytesResource[] = [
  ...(["01", "02", "03"] as const).map((set): BytesResource => ({
    href: `${rtest01Directory}/rtest01-set${set}.xml`,
    identifier: `r-rtest01-set${set}`,
    source: { member: `qtiv3-examples/tests/rtest01-set${set}.xml` },
    type: "imsqti_item_xmlv3p0",
  })),
  {
    href: `${rtest01Directory}/rtest01-fragment.xml`,
    identifier: "r-rtest01-fragment",
    source: { member: fragmentMember },
    type: "imsqti_fragment_xmlv3p0",
  },
];

/**
 * The include each `rtest01` set item writes, as written.
 */
const rtest01Include = '<xi:include href="rtest01-fragment.xml" parse="xml"/>';

/**
 * A fragment of hottexts alone, which `rtest01-fragment-context` places inside two items'
 * interactions (spec reading 117's limit).
 */
const rtest01Words: BytesResource = {
  href: `${rtest01Directory}/rtest01-words.xml`,
  identifier: "r-rtest01-words",
  source: {
    text: '<?xml version="1.0" encoding="UTF-8"?>\n<p xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0">The <qti-hottext identifier="W1">quick</qti-hottext> fox.</p>\n',
  },
  type: "imsqti_fragment_xmlv3p0",
};

/**
 * A response rule fragment that sets an outcome no `rtest01` set item declares, which
 * `rtest01-rule-variable` includes in an item's response processing (spec reading 117).
 */
const rtest01Rules: BytesResource = {
  href: `${rtest01Directory}/rtest01-rules.xml`,
  identifier: "r-rtest01-rules",
  source: {
    text: '<?xml version="1.0" encoding="UTF-8"?>\n<qti-response-condition xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"><qti-response-if><qti-is-null><qti-variable identifier="RESPONSE"/></qti-is-null><qti-set-outcome-value identifier="NOPE"><qti-base-value base-type="float">0</qti-base-value></qti-set-outcome-value></qti-response-if></qti-response-condition>\n',
  },
  type: "imsqti_fragment_xmlv3p0",
};

/**
 * Build the edits of an `rtest01` fixture: `simple` with the set items and their fragment, and the
 * resources and edits a variant adds.
 *
 * @param resources - The resources beside `rtest01`'s own.
 * @param edits - The edits of the added files.
 * @returns The edits as plain data.
 */
const rtest01Edits = (
  resources: readonly BytesResource[],
  edits: readonly Edit[],
): readonly Edit[] => [
  bytesManifestEdit([...rtest01Resources, ...resources]),
  ...bytesFileEdits([...rtest01Resources, ...resources]),
  ...edits,
];

/**
 * Write the edit that replaces the include of one `rtest01` set item.
 *
 * @param set - The set item, `01` to `03`.
 * @param replacement - The text in its place.
 * @returns The edit as plain data.
 */
const rtest01IncludeAs = (set: "01" | "02" | "03", replacement: string): Edit =>
  replaceIn(`${rtest01Directory}/rtest01-set${set}.xml`, rtest01Include, replacement);

/**
 * The outcome declaration each `rtest01` set item writes, as written.
 */
const rtest01Score =
  '<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>';

/**
 * Write the edit that adds a declaration before the outcome declaration of `rtest01-set01`.
 *
 * @param declaration - The declaration, before the outcome's.
 * @returns The edit as plain data.
 */
const rtest01DeclaringFirst = (declaration: string): Edit =>
  replaceIn(`${rtest01Directory}/rtest01-set01.xml`, rtest01Score, `${declaration}${rtest01Score}`);

/**
 * The response processing template `resproc` packages, as a file of `maxfiles.zip`.
 */
const matchCorrect: FileSource = {
  path: "rptemplates/match_correct.xml",
  zip: "qtiv3-examples/packaging/maxfiles/maxfiles.zip",
};

/**
 * Build the edits of `resproc`: the resource `rp1` of the given type and its file.
 *
 * @param type - The resource's type.
 * @returns The edits as plain data.
 */
const resprocEdits = (type: string): readonly Edit[] => [
  addResources(
    recordResource("rp1", ` type="${type}" href="rp/match_correct.xml"`, ["rp/match_correct.xml"]),
  ),
  { _tag: "addFile", path: "rp/match_correct.xml", source: matchCorrect },
];

/**
 * Build a spec over the `lti` package's member.
 *
 * @param name - The fixture's name.
 * @param edits - The fixture's edits.
 * @returns The spec.
 */
const overLti = (name: string, edits: readonly Edit[]): FixtureSpec => ({
  edits,
  member: ltiMember,
  name,
});

/**
 * The edit that makes the `lti` manifest's resource the basic LTI type.
 */
const ltiBasicType: Edit = replaceIn(
  "imsmanifest.xml",
  'type="imslti_xmlv1p1"',
  'type="imsbasiclti_xmlv1p3"',
);

/**
 * The edit that makes the `lti` manifest's `schemaversion` `3.0.1`.
 */
const ltiVersion301: Edit = replaceIn(
  "imsmanifest.xml",
  "<schemaversion>3.0.0</schemaversion>",
  "<schemaversion>3.0.1</schemaversion>",
);

/**
 * The member of the usage-data example the `usage3` fixtures package, loose in the tarball and in
 * the QTI 3 usage-data namespace: 24 `ordinaryStatistic` and 2 `categorizedStatistic`, none with a
 * `baseType`.
 */
const usageExample: FileSource = { member: "qtiv3-examples/usageData/example.xml" };

/**
 * The `usageData` package's three usage files, each a resource of its manifest.
 */
const usageFiles = [
  "USAGE-FEMALE-TEST-106391.xml",
  "USAGE-MALE-TEST-106391.xml",
  "USAGE-TOTAL-TEST-106391.xml",
] as const;

/**
 * The manifest's second resource, `USAGE-MALE-TEST-106391`, whole (lines 59 to 75 of its manifest).
 */
const maleResource: string = [
  '      <resource identifier="USAGE-MALE-TEST-106391" type="qtiusagedata/xml" href="USAGE-MALE-TEST-106391.xml">',
  "         <metadata>",
  "            <imsmd:lom>",
  "               <imsmd:general>",
  "                  <imsmd:identifier>",
  "                     <imsmd:entry>USAGE-MALE-TEST-106391</imsmd:entry>",
  "                  </imsmd:identifier>",
  "                  <imsmd:title>",
  "                     <imsmd:string>Spring 2012 Grade 4 Math Assessment - MALE</imsmd:string>",
  "                  </imsmd:title>",
  "                  <imsmd:description>",
  "                     <imsmd:string>This example illustrates the MALE only usage data set for an assessment administration that can be used to determine gender discrimination.</imsmd:string>",
  "                  </imsmd:description>",
  "               </imsmd:general>",
  "            </imsmd:lom>",
  "         </metadata>",
  '         <file href="USAGE-MALE-TEST-106391.xml" />',
  "      </resource>",
]
  .map((line) => `${line}\n`)
  .join("");

/**
 * The manifest's third resource, `USAGE-FEMALE-TEST-106391`, whole (lines 76 to 92 of its
 * manifest).
 */
const femaleResource: string = [
  '      <resource identifier="USAGE-FEMALE-TEST-106391" type="qtiusagedata/xml" href="USAGE-FEMALE-TEST-106391.xml">',
  "         <metadata>",
  "            <imsmd:lom>",
  "               <imsmd:general>",
  "                  <imsmd:identifier>",
  "                     <imsmd:entry>USAGE-FEMALE-TEST-106391</imsmd:entry>",
  "                  </imsmd:identifier>",
  "                  <imsmd:title>",
  "                     <imsmd:string>Spring 2012 Grade 4 Math Assessment - FEMALE</imsmd:string>",
  "                  </imsmd:title>",
  "                  <imsmd:description>",
  "                     <imsmd:string>This example illustrates the FEMALE only usage data set for an assessment administration that can be used to determine gender discrimination.</imsmd:string>",
  "                  </imsmd:description>",
  "               </imsmd:general>",
  "            </imsmd:lom>",
  "         </metadata>",
  '         <file href="USAGE-FEMALE-TEST-106391.xml" />',
  "      </resource>",
]
  .map((line) => `${line}\n`)
  .join("");

/**
 * The edits that make the `usageData` package hold one resource, the total one, over `example.xml`:
 * the other two resources and the three `USAGE-*.xml` files go, and the kept resource's `href` and
 * `file` name `example.xml`.
 */
const usage3Edits: readonly Edit[] = [
  ...usageFiles.map((file): Edit => ({ _tag: "deleteFile", path: file })),
  { _tag: "addFile", path: "example.xml", source: usageExample },
  replaceIn("imsmanifest.xml", maleResource, ""),
  replaceIn("imsmanifest.xml", femaleResource, ""),
  replaceIn(
    "imsmanifest.xml",
    'type="qtiusagedata/xml" href="USAGE-TOTAL-TEST-106391.xml"',
    'type="qtiusagedata/xml" href="example.xml"',
  ),
  replaceIn(
    "imsmanifest.xml",
    '<file href="USAGE-TOTAL-TEST-106391.xml" />',
    '<file href="example.xml" />',
  ),
];

/**
 * The opening tag of `example.xml`'s first statistic, `AIS`, split at its edited attributes.
 */
const firstStatistic = {
  context: 'context="http://ntweb.ets.org/itemStats/Context/XVZ2004_J1B"',
  lastUpdated: 'lastUpdated="2004-07-04"',
  name: 'name="AIS"',
};

/**
 * Build the edit of the first statistic's opening tag.
 *
 * @param changes - The attributes that replace the original `name`, `context` and `lastUpdated`.
 * @returns The edit as plain data.
 */
const editFirstStatistic = (changes: Partial<typeof firstStatistic>): Edit => {
  const open = (attributes: typeof firstStatistic): string =>
    `<ordinaryStatistic ${attributes.name} ${attributes.context} caseCount="689325" stdError="0.0022" ${attributes.lastUpdated}>`;

  return replaceIn("example.xml", open(firstStatistic), open({ ...firstStatistic, ...changes }));
};

/**
 * The first statistic's target object and value, which no other statistic shares because of the
 * value: the text every edit of that statistic's content searches.
 */
const firstTargetAndValue = [
  '<targetObject identifier="Item_VB123456"/>',
  "<value>0.87</value>",
].join("\n        ");

/**
 * The twenty-four values of `example.xml`, in document order, and what the typed copy makes of
 * each: the five statistics of the distractors `A` to `E` carry no float, so their values become
 * the identifiers `A` to `E`, and the other nineteen become floats.
 */
const usageValues: readonly { readonly text: string; readonly identifier?: string }[] = [
  { text: "0.87" },
  { text: "0.647" },
  { text: "0.3687" },
  { text: "0.2837" },
  { text: "0.3122" },
  { text: "0.15556" },
  { text: "0.02083" },
  { text: "384.3477" },
  { text: "0.2275" },
  { identifier: "A", text: "0.21" },
  { identifier: "B", text: "0.17" },
  { identifier: "C", text: "0.05" },
  { identifier: "D", text: "0.92" },
  { identifier: "E", text: "0.46" },
  { text: "0" },
  { text: "465" },
  { text: "2077" },
  { text: "101101" },
  { text: "585678" },
  { text: "100200" },
  { text: "100300" },
  { text: "100400" },
  { text: "100500" },
  { text: "200222" },
];

/**
 * The edits that type every value of `example.xml`.
 */
const usageTypedEdits: readonly Edit[] = usageValues.map(({ identifier, text }) =>
  replaceIn(
    "example.xml",
    `<value>${text}</value>`,
    identifier === undefined
      ? `<value baseType="float">${text}</value>`
      : `<value baseType="identifier">${identifier}</value>`,
  ),
);

/**
 * The first mapping's four entries, whole, which `usage3-no-map-entry` removes.
 */
const firstMapEntries = [
  '<mapEntry mapKey="d1" mappedValue="412.5267"/>',
  '<mapEntry mapKey="d2" mappedValue="426.5699"/>',
  '<mapEntry mapKey="d3" mappedValue="451.8811"/>',
  '<mapEntry mapKey="d4" mappedValue="441.8085"/>',
].join("\n            ");

/**
 * Build a spec over the `usageData` package's member.
 *
 * @param name - The fixture's name.
 * @param edits - The edits after `usage3`'s.
 * @returns The spec.
 */
const overUsage = (name: string, ...edits: readonly Edit[]): FixtureSpec => ({
  edits: [...usage3Edits, ...edits],
  member: usageMember,
  name,
});

/**
 * Escape text for an XML attribute value written in double quotes.
 */
const escapeAttribute = (text: string): string =>
  text.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");

/**
 * One resource of a written manifest: its identifier, type, `href` and the `href` of each `file`
 * it lists.
 */
interface ManifestResource {
  readonly identifier: string;
  readonly type: string;
  readonly href: string;
  readonly files: readonly string[];
}

/**
 * Write a minimal manifest: the QTI 3 content-package namespaces, `QTI Package` and a
 * `schemaversion`, no LOM, and the given resources.
 *
 * @param identifier - The manifest's identifier.
 * @param schemaversion - The `schemaversion` it declares.
 * @param resources - The resources, in order.
 * @returns The manifest's text.
 */
const manifestText = (
  identifier: string,
  schemaversion: CutEdit["schemaversion"],
  resources: readonly ManifestResource[],
): string =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"',
    '  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
    '  xsi:schemaLocation="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqtiv3p0_imscpv1p2_v1p0.xsd"',
    `  identifier="MANIFEST-${identifier}">`,
    "  <metadata>",
    "    <schema>QTI Package</schema>",
    `    <schemaversion>${schemaversion}</schemaversion>`,
    "  </metadata>",
    "  <organizations/>",
    "  <resources>",
    ...resources.flatMap((resource) => [
      `    <resource identifier="${resource.identifier}" type="${resource.type}" href="${escapeAttribute(resource.href)}">`,
      ...resource.files.map((file) => `      <file href="${escapeAttribute(file)}"/>`),
      "    </resource>",
    ]),
    "  </resources>",
    "</manifest>",
    "",
  ].join("\n");

/**
 * The tarball member of the tests the loose fixtures of phase 5 are extracted from.
 */
const testsDirectory = "qtiv3-examples/tests";

/**
 * The tarball member of the `sharedStimulus` package.
 */
const sharedStimulusMember = corpusMembers.sharedStimulus;

/**
 * The tarball member of the `basicFeedbackTest` package.
 */
const basicFeedbackMember = "qtiv3-examples/packaging/basicFeedbackTest/basicFeedbackTest.zip";

/**
 * The tarball member of the `BPIG_22April` package.
 */
const bpigMember = "QTI3_BPIG_Examples/BPIG_22April.zip";

/**
 * The namespace and schema declarations every hand-written QTI 3.0.0 document opens with.
 */
const asiRoot =
  'xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_asiv3p0_v1p0.xsd"';

/**
 * Build the `addFile` edit that writes a hand-written text file into the package.
 *
 * @param file - The file's path in the package.
 * @param text - Its text, written as UTF-8.
 * @returns The edit as plain data.
 */
const addText = (file: string, text: string): FileEdit => ({
  _tag: "addFile",
  path: file,
  source: { text },
});

/**
 * Build the `addFile` edit that copies a loose tarball member into the package.
 *
 * @param file - The file's path in the package.
 * @param member - The member's path in the examples tarball.
 * @returns The edit as plain data.
 */
const addExample = (file: string, member: string): FileEdit => ({
  _tag: "addFile",
  path: file,
  source: { member },
});

/**
 * Write a hand-written stub item: `RESPONSE` (identifier, single) and `SCORE` (float, single), the
 * given further outcomes, an empty body and the match-correct response processing.
 *
 * @param identifier - The item's identifier and title.
 * @param outcomes - Each further outcome's identifier and base type, declared single.
 * @param scored - Whether the stub declares `SCORE`; `false` for an item a mapping targets
 *   `SCORE` of (reading 97).
 * @returns The item's text.
 */
const stubItem = (
  identifier: string,
  outcomes: readonly (readonly [string, string])[] = [],
  scored = true,
): string =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<qti-assessment-item ${asiRoot} identifier="${identifier}" title="${identifier}" adaptive="false" time-dependent="false">`,
    '  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/>',
    ...(scored
      ? ['  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>']
      : []),
    ...outcomes.map(
      ([name, baseType]) =>
        `  <qti-outcome-declaration identifier="${name}" cardinality="single" base-type="${baseType}"/>`,
    ),
    "  <qti-item-body>",
    `    <p>${identifier}</p>`,
    "  </qti-item-body>",
    '  <qti-response-processing template="https://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct.xml"/>',
    "</qti-assessment-item>",
    "",
  ].join("\n");

/**
 * Write the root of a hand-written test document.
 *
 * @param identifier - The test's identifier and title.
 * @param body - The test's children.
 * @param extra - Further root attributes, each with its leading space.
 * @returns The test's text.
 */
const testDocument = (identifier: string, body: readonly string[], extra = ""): string =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<qti-assessment-test ${asiRoot}${extra} identifier="${identifier}" title="${identifier}">`,
    ...body,
    "</qti-assessment-test>",
    "",
  ].join("\n");

/**
 * Write the root of a hand-written section document.
 *
 * @param identifier - The section's identifier and title.
 * @param body - The section's children.
 * @returns The section's text.
 */
const sectionDocument = (identifier: string, body: readonly string[]): string =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<qti-assessment-section ${asiRoot} identifier="${identifier}" title="${identifier}" visible="true">`,
    ...body,
    "</qti-assessment-section>",
    "",
  ].join("\n");

/**
 * A `qti-gt` pre-condition expression comparing a variable with a float.
 *
 * @param variable - The variable's name as the document writes it.
 * @param baseType - The literal's base type.
 * @param value - The literal.
 * @returns The expression's text.
 */
const greaterThan = (variable: string, baseType: string, value: string): string =>
  `<qti-gt><qti-variable identifier="${variable}"/><qti-base-value base-type="${baseType}">${value}</qti-base-value></qti-gt>`;

/**
 * The manifest resource of one hand-written document, with its files.
 *
 * @param identifier - The resource's identifier.
 * @param type - Its type.
 * @param href - Its document, which is its first file.
 * @param files - Any further files it lists.
 * @returns The resource.
 */
const resourceOf = (
  identifier: string,
  type: string,
  href: string,
  files: readonly string[] = [],
): ManifestResource => ({ files: [href, ...files], href, identifier, type });

/**
 * `rtest13.xml` with `complete.xml`'s parts merged in, packaged with generated stub items.
 *
 * The edits give it a test outcome, test and part time limits (with `allow-late-submission`), a
 * part `title`, a part `EXIT_TEST` rule, an item time limit, an `EXIT_TESTPART` rule on an item ref
 * and `complete.xml`'s invisible section holding a pre-conditioned section.
 */
const testLinearEdits: readonly Edit[] = [
  replaceIn(
    "rtest13.xml",
    '    <qti-test-part navigation-mode="linear" submission-mode="individual" identifier="RTEST-13-A">\n        <qti-item-session-control show-feedback="true" max-attempts="1" show-solution="false"/>',
    [
      '    <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float" interpretation="The Test Score" long-interpretation="http://www.google.com/search?q=interpreting+test+scores" normal-maximum="100.0">',
      '        <qti-default-value interpretation="Zero">',
      "            <qti-value>0.0</qti-value>",
      "        </qti-default-value>",
      "    </qti-outcome-declaration>",
      '    <qti-time-limits max-time="3600" min-time="600" allow-late-submission="true"/>',
      '    <qti-test-part navigation-mode="linear" submission-mode="individual" identifier="RTEST-13-A" title="Part A">',
      '        <qti-branch-rule target="EXIT_TEST">',
      `            ${greaterThan("item034.SCORE", "float", "99")}`,
      "        </qti-branch-rule>",
      '        <qti-item-session-control show-feedback="true" max-attempts="1" show-solution="false"/>',
      '        <qti-time-limits max-time="3600"/>',
    ].join("\n"),
  ),
  replaceIn(
    "rtest13.xml",
    '<qti-assessment-item-ref identifier="item653" href="item653.xml"/>',
    [
      '<qti-assessment-item-ref identifier="item653" href="item653.xml">',
      '                <qti-branch-rule target="EXIT_TESTPART">',
      `                    ${greaterThan("item653.SCORE", "float", "0")}`,
      "                </qti-branch-rule>",
      "            </qti-assessment-item-ref>",
    ].join("\n"),
  ),
  replaceIn(
    "rtest13.xml",
    '<qti-assessment-item-ref identifier="item656" href="item656.xml"/>',
    [
      '<qti-assessment-item-ref identifier="item656" href="item656.xml">',
      '                <qti-time-limits max-time="120"/>',
      "            </qti-assessment-item-ref>",
    ].join("\n"),
  ),
  replaceIn(
    "rtest13.xml",
    "    </qti-test-part>",
    [
      '        <qti-assessment-section identifier="main" title="Main Section" visible="false">',
      '            <qti-assessment-item-ref identifier="switch" href="switch.xml"/>',
      '            <qti-assessment-section identifier="SA" title="Section A" visible="true">',
      "                <qti-pre-condition>",
      "                    <qti-match>",
      '                        <qti-variable identifier="switch.RESPONSE"/>',
      '                        <qti-base-value base-type="identifier">A</qti-base-value>',
      "                    </qti-match>",
      "                </qti-pre-condition>",
      '                <qti-assessment-item-ref identifier="A1" href="a1.xml"/>',
      "            </qti-assessment-section>",
      "        </qti-assessment-section>",
      "    </qti-test-part>",
    ].join("\n"),
  ),
  {
    _tag: "looseTest",
    schemaversion: "3.0.0",
    test: "qtiv3-examples/tests/rtest13.xml",
  },
];

/**
 * `rtest12.xml` (`required` children, `shuffle`, `keep-together="false"`) edited toward
 * `rtest01.xml` and `rtest24.xml`: selection with replacement on one section and a non-canonical
 * `select="+2"` on another, a `fixed` item ref, and a third section with `keep-together="true"`.
 * Sections A and B leave `keep-together` to its default.
 */
const testSelectionTextEdits: readonly Edit[] = [
  replaceIn(
    "rtest12.xml",
    '<qti-selection select="2"/>\n            <qti-ordering shuffle="false"/>',
    '<qti-selection select="2" with-replacement="true"/>\n            <qti-ordering shuffle="false"/>',
  ),
  replaceIn(
    "rtest12.xml",
    '<qti-selection select="2"/>\n            <qti-ordering shuffle="true"/>',
    '<qti-selection select="+2"/>\n            <qti-ordering shuffle="true"/>',
  ),
  replaceIn(
    "rtest12.xml",
    '<qti-assessment-item-ref identifier="item160" href="item160.xml"/>',
    '<qti-assessment-item-ref identifier="item160" href="item160.xml" fixed="true"/>',
  ),
  replaceIn(
    "rtest12.xml",
    "    </qti-test-part>",
    [
      '        <qti-assessment-section identifier="sectionC" title="Section C" visible="true" keep-together="true">',
      '            <qti-ordering shuffle="false"/>',
      '            <qti-assessment-item-ref identifier="item901" href="item901.xml"/>',
      '            <qti-assessment-item-ref identifier="item902" href="item902.xml"/>',
      "        </qti-assessment-section>",
      "    </qti-test-part>",
    ].join("\n"),
  ),
];

/**
 * The edit that stubs the items `rtest12.xml` names, after the text edits.
 */
const testSelectionLoose: Edit = {
  _tag: "looseTest",
  schemaversion: "3.0.0",
  test: "qtiv3-examples/tests/rtest12.xml",
};

/**
 * The edits of `test-selection`.
 */
const testSelectionEdits: readonly Edit[] = [...testSelectionTextEdits, testSelectionLoose];

/**
 * The extra outcome declarations of `test-mapping`, one for each prefixed source it names.
 */
const mappingOutcomes = [
  ["DECLARED", "float"],
  ["DOTTED", "float"],
  ["INSTANCE", "float"],
  ["NESTED", "float"],
  ["PADDED", "float"],
  ["PARTTIME", "duration"],
  ["SECTIONSUM", "float"],
  ["TIMED", "float"],
] as const;

/**
 * One `qti-set-outcome-value` of a test's outcome processing.
 *
 * @param outcome - The outcome it sets.
 * @param expression - The expression it sets it to.
 * @returns The rule's text.
 */
const setOutcome = (outcome: string, expression: string): string =>
  [
    `        <qti-set-outcome-value identifier="${outcome}">`,
    `            ${expression}`,
    "        </qti-set-outcome-value>",
  ].join("\n");

/**
 * `rtest26.xml` (a variable mapping) with `rtest04.xml`'s weights, packaged with generated stubs.
 *
 * It names the three prefixed sources (the mapping target `SCORE`, a declaration of an item,
 * `item160.SCORE`, and `I.duration` of a stub the generator declares time-dependent); `I.2.SCORE`
 * and the non-canonical `I.02.SCORE`; `PART.duration` with `RTEST-26-A` the part; `I.A.B` of a
 * stub declaring a float outcome `A.B` (reading 37); and, of decision 189, the item refs `J` and
 * `J.K` that name one stub declaring `SCORE` and no `K.SCORE`, so that `J.K.SCORE` has one
 * resolving reading, `J.K` with `SCORE`. `item034`, whose mapping targets `SCORE`, is a stub that
 * does not declare it (reading 97), and `I` sits in a section whose selection is with replacement,
 * the one place a numbered reference `I.2.SCORE` resolves (reading 88).
 */
const testMappingEdits: readonly Edit[] = [
  replaceIn("rtest26.xml", "Ã¯tem065.xml", "item065.xml"),
  replaceIn(
    "rtest26.xml",
    "    </qti-outcome-declaration>",
    [
      "    </qti-outcome-declaration>",
      ...mappingOutcomes.map(
        ([name, baseType]) =>
          `    <qti-outcome-declaration identifier="${name}" cardinality="single" base-type="${baseType}"/>`,
      ),
    ].join("\n"),
  ),
  replaceIn(
    "rtest26.xml",
    '<qti-assessment-item-ref identifier="item034" href="item034.xml">',
    '<qti-assessment-item-ref identifier="item034" href="item034.xml" category="easy hard">',
  ),
  replaceIn(
    "rtest26.xml",
    '<qti-assessment-item-ref identifier="item160" href="item160.xml"/>',
    [
      '<qti-assessment-item-ref identifier="item160" href="item160.xml" category="easy">',
      '                <qti-weight identifier="WEIGHT" value="2"/>',
      "            </qti-assessment-item-ref>",
    ].join("\n"),
  ),
  replaceIn(
    "rtest26.xml",
    '<qti-assessment-item-ref identifier="item063" href="item063.xml"/>',
    [
      '<qti-assessment-item-ref identifier="item063" href="item063.xml"/>',
      '            <qti-assessment-section identifier="sectionI" title="Section I" visible="false">',
      '                <qti-selection select="2" with-replacement="true"/>',
      '                <qti-assessment-item-ref identifier="I" href="itemI.xml"/>',
      "            </qti-assessment-section>",
      '            <qti-assessment-item-ref identifier="J" href="itemJ.xml"/>',
      '            <qti-assessment-item-ref identifier="J.K" href="itemJ.xml"/>',
    ].join("\n"),
  ),
  replaceIn(
    "rtest26.xml",
    "    </qti-outcome-processing>",
    [
      setOutcome("DECLARED", '<qti-variable identifier="item160.SCORE"/>'),
      setOutcome("INSTANCE", '<qti-variable identifier="I.2.SCORE"/>'),
      setOutcome("PADDED", '<qti-variable identifier="I.02.SCORE"/>'),
      setOutcome("NESTED", '<qti-variable identifier="I.A.B"/>'),
      setOutcome("TIMED", '<qti-variable identifier="I.duration"/>'),
      setOutcome("PARTTIME", '<qti-variable identifier="RTEST-26-A.duration"/>'),
      setOutcome("DOTTED", '<qti-variable identifier="J.K.SCORE"/>'),
      setOutcome(
        "SECTIONSUM",
        '<qti-sum><qti-test-variables variable-identifier="SCORE" section-identifier="sectionA" include-category="easy" weight-identifier="WEIGHT"/></qti-sum>',
      ),
      "    </qti-outcome-processing>",
    ].join("\n"),
  ),
  {
    _tag: "looseTest",
    schemaversion: "3.0.0",
    test: "qtiv3-examples/tests/rtest26.xml",
  },
];

/**
 * A hand-written test over `BPIG_22April`'s `template_image.xml`: its `SPEED` template declaration
 * (integer) takes as default `TRIP.SPEEDLIMIT`, an integer outcome of the item ref before it.
 */
const templateDefaultTest: string = testDocument("TEMPLATE-DEFAULT", [
  '  <qti-test-part identifier="PART" navigation-mode="linear" submission-mode="individual">',
  '    <qti-assessment-section identifier="SECTION" title="Section" visible="true">',
  '      <qti-assessment-item-ref identifier="TRIP" href="items/trip.xml"/>',
  '      <qti-assessment-item-ref identifier="MICK" href="items/template_image.xml">',
  '        <qti-template-default template-identifier="SPEED">',
  '          <qti-variable identifier="TRIP.SPEEDLIMIT"/>',
  "        </qti-template-default>",
  "      </qti-assessment-item-ref>",
  "    </qti-assessment-section>",
  "  </qti-test-part>",
]);

/**
 * The outcomes both tests of `test-section-ref` declare, which the shared section document names
 * unprefixed: `SCORE` (float), `COUNT` (integer, the `base` of the printed variable) and `FLAG`
 * (identifier, the feedback inline's outcome).
 */
const sectionRefOutcomes: readonly string[] = [
  '  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>',
  '  <qti-outcome-declaration identifier="COUNT" cardinality="single" base-type="integer"/>',
  '  <qti-outcome-declaration identifier="FLAG" cardinality="single" base-type="identifier"/>',
];

/**
 * One test of `test-section-ref`: a part `PART` whose section holds an item ref `ITEMREF` and a
 * ref to the shared section document.
 *
 * @param identifier - The test's identifier and title.
 * @param outcomes - Its outcome declarations.
 * @param items - Its item refs, as lines.
 * @returns The test's text.
 */
const sectionRefTest = (
  identifier: string,
  outcomes: readonly string[],
  items: readonly string[],
): string =>
  testDocument(identifier, [
    ...outcomes,
    '  <qti-test-part identifier="PART" navigation-mode="linear" submission-mode="individual">',
    '    <qti-assessment-section identifier="main" title="Main" visible="true">',
    ...items,
    '      <qti-assessment-section-ref identifier="S1" href="sections/shared.xml"/>',
    "    </qti-assessment-section>",
    "  </qti-test-part>",
  ]);

/**
 * The section document both tests of `test-section-ref` reach: a pre-condition with
 * `ITEMREF.SCORE`, one naming `SCORE` unprefixed, a third naming `COUNT` unprefixed, a branch
 * rule comparing `PART.duration` with `qti-duration-gte`, one naming `I2.SCORE`, and a rubric with
 * a printed variable of `SCORE` (`base` `COUNT`) and a feedback inline of `FLAG`. It holds no
 * outcome-only expression: a pre-condition and a branch rule are outside outcome processing.
 */
const sharedSection: string = sectionDocument("shared", [
  `  <qti-pre-condition>${greaterThan("ITEMREF.SCORE", "float", "0")}</qti-pre-condition>`,
  `  <qti-pre-condition>${greaterThan("SCORE", "float", "0")}</qti-pre-condition>`,
  `  <qti-pre-condition>${greaterThan("COUNT", "integer", "0")}</qti-pre-condition>`,
  '  <qti-branch-rule target="EXIT_SECTION"><qti-duration-gte><qti-variable identifier="PART.duration"/><qti-base-value base-type="duration">100</qti-base-value></qti-duration-gte></qti-branch-rule>',
  `  <qti-branch-rule target="EXIT_SECTION">${greaterThan("I2.SCORE", "float", "0")}</qti-branch-rule>`,
  '  <qti-rubric-block view="candidate">',
  "    <qti-content-body>",
  '      <p>Score <qti-printed-variable identifier="SCORE" base="COUNT"/></p>',
  '      <p><qti-feedback-inline outcome-identifier="FLAG" identifier="ok" show-hide="show">Well done.</qti-feedback-inline></p>',
  "    </qti-content-body>",
  "  </qti-rubric-block>",
  '  <qti-assessment-item-ref identifier="shared-item" href="../items/shared.xml"/>',
]);

/**
 * The section document no test reaches: one prefixed reference in a pre-condition.
 */
const lonelySection: string = sectionDocument("lonely", [
  `  <qti-pre-condition>${greaterThan("ITEMREF.SCORE", "float", "0")}</qti-pre-condition>`,
  '  <qti-assessment-item-ref identifier="lonely-item" href="../items/shared.xml"/>',
]);

/**
 * The manifest of `test-section-ref`, listing the two tests, the two section documents and the
 * items.
 */
const sectionRefManifest: string = manifestText("SECTION-REF", "3.0.0", [
  resourceOf("test-a", "imsqti_test_xmlv3p0", "rtest01.xml"),
  resourceOf("test-b", "imsqti_test_xmlv3p0", "test-b.xml"),
  resourceOf("shared", "imsqti_section_xmlv3p0", "sections/shared.xml"),
  resourceOf("lonely", "imsqti_section_xmlv3p0", "sections/lonely.xml"),
  resourceOf("item-a", "imsqti_item_xmlv3p0", "items/a1.xml"),
  resourceOf("item-b", "imsqti_item_xmlv3p0", "items/b1.xml"),
  resourceOf("item-i2", "imsqti_item_xmlv3p0", "items/i2.xml"),
  resourceOf("item-shared", "imsqti_item_xmlv3p0", "items/shared.xml"),
]);

/**
 * The hand-written parts of `test-include`: an inline fragment (`span`), a block fragment (`p`)
 * and an item-ref fragment, each a document root in the QTI namespace.
 */
const includeFragments: readonly Edit[] = [
  addExample("rtest01-fragment.xml", "qtiv3-examples/tests/rtest01-fragment.xml"),
  addExample("rtest01-set01.xml", "qtiv3-examples/tests/rtest01-set01.xml"),
  addExample("rtest01-set02.xml", "qtiv3-examples/tests/rtest01-set02.xml"),
  addExample("rtest01-set03.xml", "qtiv3-examples/tests/rtest01-set03.xml"),
  addText(
    "rtest01-span.xml",
    '<span xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0">an included span</span>\n',
  ),
  addText(
    "rtest01-para.xml",
    '<p xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0">an included paragraph</p>\n',
  ),
  addText(
    "rtest01-ref.xml",
    '<qti-assessment-item-ref xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="set04" href="rtest01-set02.xml"/>\n',
  ),
];

/**
 * The `xi:include` of a hand-written fragment.
 *
 * @param href - The fragment's file.
 * @returns The element's text.
 */
const include = (href: string): string => `<xi:include href="${href}" parse="xml"/>`;

/**
 * `rtest01.xml` with `xi:include` in a section, in a test rubric's and a test feedback's content
 * body, and (in `rtest01-set01.xml`) in an item body's `p` and `div`.
 */
const testIncludeEdits: readonly Edit[] = [
  ...includeFragments,
  replaceIn(
    "rtest01.xml",
    "<qti-assessment-test xmlns=",
    '<qti-assessment-test xmlns:xi="http://www.w3.org/2001/XInclude" xmlns=',
  ),
  replaceIn(
    "rtest01.xml",
    '    <qti-test-part identifier="P1"',
    [
      '    <qti-outcome-declaration identifier="FBOUT" cardinality="single" base-type="identifier"/>',
      '    <qti-rubric-block view="candidate">',
      `        <qti-content-body>${include("rtest01-para.xml")}</qti-content-body>`,
      "    </qti-rubric-block>",
      '    <qti-test-part identifier="P1"',
    ].join("\n"),
  ),
  replaceIn(
    "rtest01.xml",
    '<qti-assessment-item-ref identifier="set03" href="rtest01-set03.xml"/>',
    `<qti-assessment-item-ref identifier="set03" href="rtest01-set03.xml"/>\n            ${include("rtest01-ref.xml")}`,
  ),
  replaceIn(
    "rtest01.xml",
    "    </qti-test-part>",
    [
      "    </qti-test-part>",
      '    <qti-test-feedback identifier="FB" outcome-identifier="FBOUT" access="atEnd" show-hide="show">',
      `        <qti-content-body>${include("rtest01-para.xml")}</qti-content-body>`,
      "    </qti-test-feedback>",
    ].join("\n"),
  ),
  replaceIn(
    "rtest01-set01.xml",
    '<xi:include href="rtest01-fragment.xml" parse="xml"/>',
    [
      '<xi:include href="rtest01-fragment.xml" parse="xml"/>',
      `        <p>${include("rtest01-span.xml")}</p>`,
      `        <div>${include("rtest01-para.xml")}</div>`,
    ].join("\n"),
  ),
  { _tag: "cutTest", schemaversion: "3.0.0", test: "rtest01.xml" },
];

/**
 * A hand-written test whose one section selects adaptively, its four refs naming packaged files.
 */
const adaptiveTest: string = testDocument("ADAPTIVE", [
  '  <qti-test-part identifier="PART" navigation-mode="nonlinear" submission-mode="individual">',
  '    <qti-assessment-section identifier="SECTION" title="Section" visible="true">',
  "      <qti-adaptive-selection>",
  '        <qti-adaptive-engine-ref identifier="engine" href="adaptive/engine.xml"/>',
  '        <qti-adaptive-settings-ref identifier="settings" href="adaptive/settings.xml"/>',
  '        <qti-usagedata-ref identifier="usagedata" href="adaptive/usagedata.xml"/>',
  '        <qti-metadata-ref identifier="metadata" href="adaptive/metadata.xml"/>',
  "      </qti-adaptive-selection>",
  '      <qti-assessment-item-ref identifier="choice" href="choice.xml"/>',
  "    </qti-assessment-section>",
  "  </qti-test-part>",
]);

/**
 * The four files `test-adaptive`'s refs name, each a small well-formed document.
 */
const adaptiveFiles: readonly Edit[] = ["engine", "settings", "usagedata", "metadata"].map((name) =>
  addText(`adaptive/${name}.xml`, `<${name}>${name}</${name}>\n`),
);

/**
 * `basicFeedbackTest`'s test with its four items' content removed (`id-a360e0fa63e6` holds
 * MathML, which no language phase has landed), the items kept as stubs of the same identifiers.
 * The test gains a test rubric, part and section rubrics with and without `use`, a stylesheet, a
 * context declaration, a `during` feedback with a `title`, and its manifest the test resource's LOM
 * `language`. The test root states no language: reading 90 refuses an `xml:lang` on it.
 */
const testContentEdits: readonly Edit[] = [
  ...[
    ["id-53a79b001624/Example01-modalFeedback.xml", "id-53a79b001624"],
    ["id-692fc07cc3e2/Example05-feedbackBlock-adaptive.xml", "id-692fc07cc3e2"],
    ["id-a360e0fa63e6/Example03-feedbackBlock-solution.xml", "id-a360e0fa63e6"],
    ["id-b0dd9e732083/Example02-feedbackInline.xml", "id-b0dd9e732083"],
  ].map(([file, identifier]) => addText(file ?? "", stubItem(identifier ?? ""))),
  addText("styles/test.css", ".qti-test { margin: 0; }\n"),
  replaceIn(
    "assessment.xml",
    '<qti-outcome-declaration base-type="float" cardinality="single" identifier="TEST_total">',
    [
      '<qti-context-declaration identifier="CONTEXT" cardinality="single" base-type="string"/>',
      '    <qti-outcome-declaration base-type="float" cardinality="single" identifier="TEST_total">',
    ].join("\r\n"),
  ),
  replaceIn(
    "assessment.xml",
    '<qti-test-part submission-mode="simultaneous" navigation-mode="nonlinear" identifier="TP">',
    [
      '<qti-stylesheet href="styles/test.css" type="text/css"/>',
      '    <qti-rubric-block view="candidate" use="instructions">',
      "        <qti-content-body><p>Test instructions</p></qti-content-body>",
      "    </qti-rubric-block>",
      '    <qti-test-part submission-mode="simultaneous" navigation-mode="nonlinear" identifier="TP">',
      '        <qti-rubric-block view="candidate">',
      "            <qti-content-body><p>Part notes</p></qti-content-body>",
      "        </qti-rubric-block>",
    ].join("\r\n"),
  ),
  replaceIn(
    "assessment.xml",
    '<qti-assessment-item-ref identifier="id-53a79b001624" href="id-53a79b001624/Example01-modalFeedback.xml"/>',
    [
      '<qti-rubric-block view="candidate">',
      "                <qti-content-body><p>Section notes</p></qti-content-body>",
      "            </qti-rubric-block>",
      '            <qti-assessment-item-ref identifier="id-53a79b001624" href="id-53a79b001624/Example01-modalFeedback.xml"/>',
    ].join("\r\n"),
  ),
  replaceIn(
    "assessment.xml",
    'outcome-identifier="TEST_FEEDBACK" access="atEnd">',
    'outcome-identifier="TEST_FEEDBACK" access="atEnd" title="End of test">',
  ),
  replaceIn(
    "assessment.xml",
    "</qti-test-feedback>",
    [
      "</qti-test-feedback>",
      '    <qti-test-feedback identifier="TEST_FB_DURING" show-hide="show" outcome-identifier="TEST_FEEDBACK" access="during" title="Progress">',
      "        <qti-content-body>",
      '            <div>Score so far: <qti-printed-variable format="%.1f" identifier="TEST_total"/> <qti-feedback-inline outcome-identifier="s1FB" identifier="S1-FB-AllOK" show-hide="show">On track.</qti-feedback-inline></div>',
      "        </qti-content-body>",
      "    </qti-test-feedback>",
    ].join("\r\n"),
  ),
  replaceIn(
    "imsmanifest.xml",
    '<resource href="assessment.xml" type="imsqti_test_xmlv3p0" identifier="SPECTATUS-GENERATED-TEST">',
    [
      '<resource href="assessment.xml" type="imsqti_test_xmlv3p0" identifier="SPECTATUS-GENERATED-TEST">',
      "            <metadata>",
      "                <imsmd:lom>",
      "                    <imsmd:general>",
      "                        <imsmd:language>en</imsmd:language>",
      "                    </imsmd:general>",
      "                </imsmd:lom>",
      "            </metadata>",
    ].join("\n"),
  ),
  replaceIn(
    "imsmanifest.xml",
    '<file href="assessment.xml"/>',
    '<file href="assessment.xml"/>\n            <file href="styles/test.css"/>',
  ),
];

/**
 * The mathassess namespace `SineRule-001.xml` declares as `ma`, which the wildcard fixtures use as
 * their foreign namespace.
 */
const mathassessNamespace = "http://mathassess.qtitools.org/xsd/mathassess";

/**
 * The XInclude namespace, declared where a wildcard fixture uses `xi`.
 */
const xincludeNamespace = "http://www.w3.org/2001/XInclude";

/**
 * The XLink namespace, declared where a wildcard fixture uses `xlink`.
 */
const xlinkNamespace = "http://www.w3.org/1999/xlink";

/**
 * The item of `BBQsTest` that the operator fixtures are cut from: a `qti-custom-operator` with one
 * `qti-base-value` operand, in its template processing.
 */
const sineRuleItem = "id-bd44a757f562/SineRule-001.xml";

/**
 * The start tag of `sineRuleItem`'s one `qti-custom-operator`, without its closing `>`.
 */
const customOperatorStart =
  '<qti-custom-operator class="org.qtitools.mathassess.CasProcess" ma:syntax="text/x-maxima" ma:returnType="float"';

/**
 * The text that opens the operator's one operand, and the text that ends it, which the foreign
 * content goes before and after.
 */
const operandStart = '<qti-base-value base-type="string"><![CDATA[';

const operandEnd = "]]></qti-base-value>";

/**
 * Build the spec of a fixture cut from `sineRuleItem`: `edits` of the item, then the cut.
 *
 * @param name - The fixture's name.
 * @param edits - The edits of `sineRuleItem`.
 * @returns The spec.
 */
const overOperator = (name: string, edits: readonly Edit[]): FixtureSpec => {
  const cut = cutItem(name, "BBQsTest", sineRuleItem, "3.0.0");

  return { ...cut, edits: [...edits, ...cut.edits] };
};

/**
 * Build the edit that adds `text` after the operator's operand.
 *
 * @param text - The content that follows the operand inside the operator.
 * @returns The edit as plain data.
 */
const afterOperand = (text: string): Edit => replaceIn(sineRuleItem, operandEnd, operandEnd + text);

/**
 * Build the `ma:extension` that `operator-foreign-content` puts after the operand: foreign and
 * unqualified attributes, the four `xml:` attributes (one the XSD does not declare), and children
 * in no namespace, in the QTI namespace and in XInclude.
 *
 * @param inside - Further content, at the end of the extension.
 * @returns The element's text.
 */
const extension = (inside: string): string =>
  `<ma:extension ma:k="v" plain="1" xml:lang="en" xml:space="preserve" xml:id="x1" xml:foo="1">text<ma:inner/><p>para</p><qti-prompt>lax</qti-prompt><xi:include xmlns:xi="${xincludeNamespace}" href="inner.xml"/>${inside}</ma:extension>`;

/**
 * The `xi:include` that follows the extension: its fallback holds a QTI paragraph and an element
 * of no namespace.
 */
const includeWithFallback = `<xi:include xmlns:xi="${xincludeNamespace}" href="part.xml"><xi:fallback><p>fallback</p><foo xmlns="">local</foo></xi:fallback></xi:include>`;

/**
 * The edits of `operator-foreign-content`, and of `nested-root-in-foreign` with `inside` in the
 * extension. The two `xi:include` targets, `inner.xml` and `part.xml`, are added as package
 * entries beside `sineRuleItem` (decision 285): the reference census records every in-package
 * `xi:include/@href`, and the importer stores an include as written and never resolves it. File
 * edits apply before text edits and the cut, and the cut keeps every file its `href` scan finds.
 *
 * @param inside - Content at the end of the extension.
 * @returns The edits of `sineRuleItem`.
 */
const operatorForeignEdits = (inside: string): readonly Edit[] => [
  { _tag: "addFile", path: "id-bd44a757f562/inner.xml", source: { text: "<inner/>" } },
  { _tag: "addFile", path: "id-bd44a757f562/part.xml", source: { text: "<part/>" } },
  replaceIn(sineRuleItem, `${customOperatorStart}>`, `${customOperatorStart} xml:foo="1">`),
  afterOperand(extension(inside) + includeWithFallback),
];

/**
 * The item `fallback-3-0-1` is cut from, the one `html-<element>` fixtures use.
 */
const fallbackItem = bgChoiceItem;

/**
 * The response processing of {@link fallbackItem}, a template reference with no content.
 */
const fallbackResponseProcessing =
  '<qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct"/>';

/**
 * The edits of `fallback-3-0-1`: an `xi:include` with a fallback in the item body, and a response
 * condition testing a custom operator, with a foreign element after its operand, in the response
 * processing. The include's target, `items/part.xml`, is a package entry added beside the item
 * (decision 285): the reference census records every in-package `xi:include/@href`, and the
 * importer stores an include as written and never resolves it.
 */
const fallbackEdits: readonly Edit[] = [
  { _tag: "addFile", path: "items/part.xml", source: { text: "<part/>" } },
  replaceIn(
    fallbackItem,
    bgChoiceQuestion,
    `${bgChoiceQuestion}<xi:include xmlns:xi="${xincludeNamespace}" href="part.xml"><xi:fallback><p>fallback</p><ma:inner xmlns:ma="${mathassessNamespace}"/></xi:fallback></xi:include>`,
  ),
  replaceIn(
    fallbackItem,
    fallbackResponseProcessing,
    `${fallbackResponseProcessing.slice(0, -2)}><qti-response-condition><qti-response-if><qti-custom-operator class="org.example.Test"><qti-base-value base-type="boolean">true</qti-base-value><ma:extension xmlns:ma="${mathassessNamespace}" ma:k="v"/></qti-custom-operator></qti-response-if></qti-response-condition></qti-response-processing>`,
  ),
];

/**
 * The `ma:ext` that `lom-wildcard` adds to the manifest's `general`: a foreign attribute, the
 * four `xml:` attributes the schema reads, the ten XLink attributes and one it does not declare.
 */
const lomExtension =
  '<ma:ext ma:k="v" xml:id="m1" xml:space="preserve" xlink:type="simple" xlink:href="https://example.org/a" xlink:role="https://example.org/r" xlink:arcrole="https://example.org/ar" xlink:title=" t " xlink:show="new" xlink:actuate="onLoad" xlink:label="a" xlink:from="a" xlink:to="b" xlink:foo="1"/>';

/**
 * The edits of `lom-wildcard`, over `extmeta`'s: the extension in the manifest's `general`, a
 * foreign attribute and an `xlink:href` on its `lom`, and two extensions with a duplicate `xml:id`
 * and a bad `xml:space` in a `general` of the record.
 */
const lomWildcardEdits: readonly Edit[] = [
  ...extmetaEdits,
  replaceIn(
    "imsmanifest.xml",
    `<imsmd:lom>${CRLF}            <imsmd:general>`,
    `<imsmd:lom xmlns:ma="${mathassessNamespace}" xmlns:xlink="${xlinkNamespace}" ma:k="v" xlink:href="https://example.org/lom">${CRLF}            <imsmd:general>`,
  ),
  replaceIn(
    "imsmanifest.xml",
    `${CRLF}            </imsmd:general>${CRLF}            <imsmd:lifeCycle>`,
    `${CRLF}                ${lomExtension}${CRLF}            </imsmd:general>${CRLF}            <imsmd:lifeCycle>`,
  ),
  replaceIn(
    "meta/choice.xml",
    "    <educational>\n",
    `    <general xmlns:ma="${mathassessNamespace}"><ma:ext xml:id="r1" xml:space="bogus"/><ma:ext xml:id="r1"/></general>\n    <educational>\n`,
  ),
];

/**
 * Write one of `sharedStimulus`'s three items without its catalog content: its declarations, a
 * reference to the shared stimulus, the given body and the match-correct response processing.
 *
 * @param identifier - The item's identifier.
 * @param title - The item's title.
 * @param response - The response declaration's attributes and children.
 * @param stimulusRef - The stimulus ref's extra attributes, with a leading space.
 * @param body - The item body's children.
 * @returns The item's text.
 */
const stimulusItem = (
  identifier: string,
  title: string,
  response: string,
  stimulusRef: string,
  body: readonly string[],
): string =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<qti-assessment-item ${asiRoot} identifier="${identifier}" title="${title}" adaptive="false" time-dependent="false">`,
    response,
    '  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">',
    "    <qti-default-value><qti-value>0</qti-value></qti-default-value>",
    "  </qti-outcome-declaration>",
    '  <qti-outcome-declaration identifier="MAXSCORE" cardinality="single" base-type="float">',
    "    <qti-default-value><qti-value>1</qti-value></qti-default-value>",
    "  </qti-outcome-declaration>",
    `  <qti-assessment-stimulus-ref identifier="Stimulus1" href="passages/unbelievableNight.xml"${stimulusRef}/>`,
    "  <qti-item-body>",
    ...body,
    "  </qti-item-body>",
    "  <qti-response-processing>",
    "    <qti-response-condition>",
    "      <qti-response-if>",
    '        <qti-match><qti-variable identifier="RESPONSE"/><qti-correct identifier="RESPONSE"/></qti-match>',
    '        <qti-set-outcome-value identifier="SCORE"><qti-variable identifier="MAXSCORE"/></qti-set-outcome-value>',
    "      </qti-response-if>",
    "    </qti-response-condition>",
    "  </qti-response-processing>",
    "</qti-assessment-item>",
    "",
  ].join("\n");

/**
 * The edits of `stimulus-shared`: `sharedStimulus` with the two images its stimulus names but does
 * not hold added (copies of the two it holds, listed in its manifest), its catalog content (the
 * `qti-catalog-info` blocks and the `data-*` attributes) removed, and its three items written
 * without that content, one of whose stimulus refs has a `title`.
 */
const stimulusSharedEdits: readonly Edit[] = [
  {
    _tag: "copyFile",
    from: "passages/images/exemplarSection01_croc.png",
    to: "passages/images/apip_VE_IP_05_croc.png",
  },
  {
    _tag: "copyFile",
    from: "passages/images/exemplarSection01_flamingos.png",
    to: "passages/images/apip_VE_IP_05_flamingos.png",
  },
  addText(
    "exemplar06.xml",
    stimulusItem(
      "Item1",
      "Why did Anina call the flamingos",
      '  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="string"/>',
      ' title="An Unbelievable Night"',
      [
        '    <qti-extended-text-interaction expected-length="300" expected-lines="4" format="plain" max-strings="1" min-strings="1" response-identifier="RESPONSE">',
        "      <qti-prompt>Why did Anina call the flamingos?</qti-prompt>",
        "    </qti-extended-text-interaction>",
      ],
    ),
  ),
  addText(
    "exemplar04.xml",
    stimulusItem(
      "Item2",
      "Put the following sentences in order",
      [
        '  <qti-response-declaration identifier="RESPONSE" base-type="identifier" cardinality="ordered">',
        "    <qti-correct-response><qti-value>fourthSentence</qti-value></qti-correct-response>",
        "  </qti-response-declaration>",
      ].join("\n"),
      "",
      [
        '    <qti-order-interaction max-choices="5" min-choices="1" shuffle="false" orientation="vertical" response-identifier="RESPONSE">',
        "      <qti-prompt>Put the following sentences in the order in which they happened in the story.</qti-prompt>",
        '      <qti-simple-choice identifier="firstSentence">Anina saw the crocodile.</qti-simple-choice>',
        '      <qti-simple-choice identifier="secondSentence">The crocodile ate two flamingos.</qti-simple-choice>',
        '      <qti-simple-choice identifier="thirdSentence">Anina tried to explain the broken door to her parents.</qti-simple-choice>',
        '      <qti-simple-choice identifier="fourthSentence">Anina started to walk to the bathroom.</qti-simple-choice>',
        '      <qti-simple-choice identifier="fifthSentence">Anina ran to the bedroom and slammed the door.</qti-simple-choice>',
        "    </qti-order-interaction>",
      ],
    ),
  ),
  addText(
    "exemplar05.xml",
    stimulusItem(
      "Item3",
      "Where did the crocodile come from",
      [
        '  <qti-response-declaration identifier="RESPONSE" base-type="identifier" cardinality="single">',
        "    <qti-correct-response><qti-value>B</qti-value></qti-correct-response>",
        "  </qti-response-declaration>",
      ].join("\n"),
      "",
      [
        '    <div class="qti-layout-row">',
        '      <div class="qti-layout-col6">',
        '        <div class="qti-shared-stimulus"></div>',
        "      </div>",
        '      <div class="qti-layout-col6">',
        '        <qti-choice-interaction max-choices="1" shuffle="false" response-identifier="RESPONSE">',
        "          <qti-prompt>Where did the crocodile come from?</qti-prompt>",
        '          <qti-simple-choice identifier="A">the bathroom</qti-simple-choice>',
        '          <qti-simple-choice identifier="B">a magazine cover</qti-simple-choice>',
        '          <qti-simple-choice identifier="C">under the bed</qti-simple-choice>',
        '          <qti-simple-choice identifier="D">a nearby river</qti-simple-choice>',
        "        </qti-choice-interaction>",
        "      </div>",
        "    </div>",
      ],
    ),
  ),
  replaceIn(
    "passages/unbelievableNight.xml",
    '<span data-catalog-idref="c1234">Anina</span>',
    "Anina",
  ),
  replaceIn(
    "passages/unbelievableNight.xml",
    '  <qti-catalog-info> \n    <qti-catalog id="c1234">\n      <qti-card support="linguistic-guidance">\n        <qti-html-content>Anina is the name of a girl.</qti-html-content>\n      </qti-card>\n    </qti-catalog>\n  </qti-catalog-info> \n',
    "",
  ),
  replaceIn(
    "imsmanifest.xml",
    '<file href="passages/images/exemplarSection01_flamingos.png"/>',
    [
      '<file href="passages/images/exemplarSection01_flamingos.png"/>',
      '            <file href="passages/images/apip_VE_IP_05_croc.png"/>',
      '            <file href="passages/images/apip_VE_IP_05_flamingos.png"/>',
    ].join("\n"),
  ),
];

/**
 * `stimulus-shared` at 3.0.1: the manifest's `schemaversion` and the documents' schema location
 * move to 3.0.1; the stimulus root gains `tool-name`, `tool-version` and `label`; its body gains
 * `class`, `xml:lang`, an `xi:include` of a packaged fragment as a child of the body and, bare, an
 * interaction, a `qti-feedback-inline` and a `qti-template-inline` (goal 5.15).
 */
const stimulus301Edits: readonly Edit[] = [
  ...stimulusSharedEdits,
  addText(
    "passages/fragment.xml",
    '<p xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0">an included paragraph</p>\n',
  ),
  replaceIn(
    "imsmanifest.xml",
    "<schemaversion>3.0.0</schemaversion>",
    "<schemaversion>3.0.1</schemaversion>",
  ),
  replaceIn(
    "imsmanifest.xml",
    "</resources>",
    '    <resource identifier="Fragment1" type="imsqti_fragment_xmlv3p0" href="passages/fragment.xml">\n            <file href="passages/fragment.xml"/>\n        </resource>\n    </resources>',
  ),
  ...["exemplar06.xml", "exemplar04.xml", "exemplar05.xml"].map((file) =>
    replaceIn(file, "imsqti_asiv3p0_v1p0.xsd", "imsqti_asiv3p0p1_v1p0.xsd"),
  ),
  replaceIn(
    "passages/unbelievableNight.xml",
    "imsqti_stimulusv3p0_v1p0.xsd",
    "imsqti_stimulusv3p0p1_v1p0.xsd",
  ),
  replaceIn(
    "passages/unbelievableNight.xml",
    'identifier="Stimulus1" title="Common Stimulus" xml:lang="eng">',
    'identifier="Stimulus1" title="Common Stimulus" xml:lang="eng" label="Passage" tool-name="qti-pie" tool-version="1.0">',
  ),
  replaceIn(
    "passages/unbelievableNight.xml",
    "<qti-stimulus-body>",
    '<qti-stimulus-body class="passage" xml:lang="en">',
  ),
  replaceIn(
    "passages/unbelievableNight.xml",
    '<qti-assessment-stimulus \n\txmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"',
    '<qti-assessment-stimulus xmlns:xi="http://www.w3.org/2001/XInclude" \n\txmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"',
  ),
  replaceIn(
    "passages/unbelievableNight.xml",
    "    </div> <!-- /stimulus-wrapper -->",
    [
      '      <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">',
      '        <qti-simple-choice identifier="A">A</qti-simple-choice>',
      "      </qti-choice-interaction>",
      '      <p><qti-feedback-inline outcome-identifier="FB" identifier="done" show-hide="show">done</qti-feedback-inline> <qti-template-inline template-identifier="T" identifier="x" show-hide="show">x</qti-template-inline></p>',
      "    </div> <!-- /stimulus-wrapper -->",
    ].join("\n"),
  ),
  replaceIn(
    "passages/unbelievableNight.xml",
    "  </qti-stimulus-body>",
    '    <xi:include href="fragment.xml" parse="xml"/>\n  </qti-stimulus-body>',
  ),
];

/**
 * A hand-written test whose one item ref names the LTI link's file, the resource that holds it.
 */
const ltiTest: string = testDocument("LTI-TEST", [
  '  <qti-test-part identifier="PART" navigation-mode="linear" submission-mode="individual">',
  '    <qti-assessment-section identifier="SECTION" title="Section" visible="true">',
  '      <qti-assessment-item-ref identifier="video" href="links/streaming_video_experiment101.xml"/>',
  "    </qti-assessment-section>",
  "  </qti-test-part>",
]);

/**
 * The specs of {@link testNames}.
 */
const testSpecs: Record<(typeof testNames)[number], FixtureSpec> = {
  "stimulus-301": {
    edits: stimulus301Edits,
    member: sharedStimulusMember,
    name: "stimulus-301",
  },
  "stimulus-shared": {
    edits: stimulusSharedEdits,
    member: sharedStimulusMember,
    name: "stimulus-shared",
  },
  "test-adaptive": {
    edits: [
      addText("adaptive-test.xml", adaptiveTest),
      ...adaptiveFiles,
      { _tag: "cutTest", schemaversion: "3.0.0", test: "adaptive-test.xml" },
    ],
    member: simpleMember,
    name: "test-adaptive",
  },
  "test-content": {
    edits: testContentEdits,
    member: basicFeedbackMember,
    name: "test-content",
  },
  "test-include": {
    edits: testIncludeEdits,
    member: `${testsDirectory}/rtest01.xml`,
    name: "test-include",
  },
  "test-linear": {
    edits: testLinearEdits,
    member: `${testsDirectory}/rtest13.xml`,
    name: "test-linear",
  },
  "test-lti": overLti("test-lti", [
    ltiVersion301,
    addText("ltitest.xml", ltiTest),
    replaceIn(
      "imsmanifest.xml",
      '<resource identifier="experiment101" type="imslti_xmlv1p1">',
      '<resource identifier="ltitest" type="imsqti_test_xmlv3p0" href="ltitest.xml">\n            <file href="ltitest.xml"/>\n        </resource>\n        <resource identifier="experiment101" type="imslti_xmlv1p1" href="links/streaming_video_experiment101.xml">',
    ),
  ]),
  "test-mapping": {
    edits: testMappingEdits,
    member: `${testsDirectory}/rtest26.xml`,
    name: "test-mapping",
  },
  "test-section-ref": {
    edits: [
      addText("sections/shared.xml", sharedSection),
      addText("sections/lonely.xml", lonelySection),
      addText("items/a1.xml", stubItem("a1")),
      addText("items/b1.xml", stubItem("b1")),
      addText("items/i2.xml", stubItem("i2")),
      addText("items/shared.xml", stubItem("shared")),
      addText(
        "test-b.xml",
        sectionRefTest("TEST-B", sectionRefOutcomes, [
          '      <qti-assessment-item-ref identifier="ITEMREF" href="items/b1.xml"/>',
          '      <qti-assessment-item-ref identifier="I2" href="items/i2.xml"/>',
        ]),
      ),
      addText("imsmanifest.xml", sectionRefManifest),
      replaceIn(
        "rtest01.xml",
        '    <qti-test-part identifier="P1" navigation-mode="linear" submission-mode="individual">',
        [
          ...sectionRefOutcomes,
          '  <qti-outcome-declaration identifier="I2.SCORE" cardinality="single" base-type="float"/>',
          '    <qti-test-part identifier="PART" navigation-mode="linear" submission-mode="individual">',
        ].join("\n"),
      ),
      replaceIn(
        "rtest01.xml",
        '<qti-selection select="2"/>\n            <qti-assessment-item-ref identifier="set01" href="rtest01-set01.xml"/>\n            <qti-assessment-item-ref identifier="set02" href="rtest01-set02.xml"/>\n            <qti-assessment-item-ref identifier="set03" href="rtest01-set03.xml"/>',
        [
          '<qti-selection select="2"/>',
          '            <qti-assessment-item-ref identifier="ITEMREF" href="items/a1.xml"/>',
          '            <qti-assessment-section-ref identifier="S1" href="sections/shared.xml"/>',
        ].join("\n"),
      ),
    ],
    member: `${testsDirectory}/rtest01.xml`,
    name: "test-section-ref",
  },
  "test-selection": {
    edits: testSelectionEdits,
    member: `${testsDirectory}/rtest12.xml`,
    name: "test-selection",
  },
  "test-template-default": {
    edits: [
      addText("template-default-test.xml", templateDefaultTest),
      addText("items/trip.xml", stubItem("trip", [["SPEEDLIMIT", "integer"]])),
      { _tag: "cutTest", schemaversion: "3.0.0", test: "template-default-test.xml" },
    ],
    member: bpigMember,
    name: "test-template-default",
  },
};

/**
 * The spec of a negative, or of a restored-check or assembly fixture built the same way: the
 * positive `base` with `edits` after its own, under the fixture's name.
 *
 * The edits of a spec apply by kind (file edits, then text edits, then the cut), each kind in list
 * order, so the extra edits of a negative see the positive's result.
 *
 * @param name - The fixture's name.
 * @param base - The positive it edits.
 * @param edits - The edits that make the breach; none for a "(direct)" negative, whose spec is the
 *   positive's own under the negative's name.
 * @returns The spec, whose directory is named by the hash of exactly these values like any other.
 */
const negativeOver = (
  name:
    | (typeof negativeNames)[number]
    | (typeof restoredNames)[number]
    | (typeof assemblyNames)[number]
    | (typeof weightedNames)[number],
  base: (typeof testNames)[number],
  edits: readonly Edit[] = [],
): FixtureSpec => {
  const positive = testSpecs[base];

  return { edits: [...positive.edits, ...edits], member: positive.member, name };
};

/**
 * The spec of a negative over a loose test whose stub items are written by hand.
 *
 * A {@link LooseTestEdit} generates each stub from what the test names, so it declares every
 * variable the test names and writes a stub for every `href`, which no breach of a missing item or
 * an undeclared variable survives. This keeps the positive's text edits, writes the given stubs,
 * and cuts the test and what it reaches instead.
 *
 * @param name - The negative's name.
 * @param base - The loose positive it edits.
 * @param stubs - Each stub's `href` and text.
 * @param edits - The edits that make the breach.
 * @returns The spec.
 */
const negativeByHand = (
  name: (typeof negativeNames)[number],
  base: "test-linear" | "test-mapping",
  stubs: readonly (readonly [string, string])[],
  edits: readonly Edit[],
): FixtureSpec => {
  const positive = testSpecs[base];
  const directory = `${testsDirectory}/`;

  return {
    edits: [
      ...positive.edits.filter((edit) => edit._tag !== "looseTest"),
      ...stubs.map(([href, text]) => addText(href, text)),
      ...edits,
      {
        _tag: "cutTest",
        schemaversion: "3.0.0",
        test: positive.member.slice(directory.length),
      },
    ],
    member: positive.member,
    name,
  };
};

/**
 * The response processing of a stub that names its own `duration`, as a time-dependent item's
 * does.
 */
const durationProcessing = [
  "<qti-response-processing>",
  "    <qti-response-condition>",
  "      <qti-response-if>",
  '        <qti-gt><qti-variable identifier="duration"/><qti-base-value base-type="float">0</qti-base-value></qti-gt>',
  '        <qti-set-outcome-value identifier="SCORE"><qti-base-value base-type="float">1</qti-base-value></qti-set-outcome-value>',
  "      </qti-response-if>",
  "    </qti-response-condition>",
  "  </qti-response-processing>",
].join("\n");

/**
 * A hand-written time-dependent stub whose response processing names `duration`.
 *
 * @param identifier - The item's identifier and title.
 * @param outcomes - Each further outcome's identifier and base type, declared single.
 * @returns The item's text.
 */
const durationStub = (
  identifier: string,
  outcomes: readonly (readonly [string, string])[],
): string =>
  stubItem(identifier, outcomes)
    .replace('time-dependent="false"', 'time-dependent="true"')
    .replace(/<qti-response-processing [^>]*\/>/u, durationProcessing);

/**
 * The stubs of `test-linear`, written by hand: each declares only `RESPONSE` and `SCORE`.
 */
const linearStubs: readonly (readonly [string, string])[] = [
  ["item034.xml", stubItem("item034")],
  ["item160.xml", stubItem("item160")],
  ["item063.xml", stubItem("item063")],
  ["item347.xml", stubItem("item347")],
  ["item653.xml", stubItem("item653")],
  ["item656.xml", stubItem("item656")],
  ["switch.xml", stubItem("switch")],
  ["a1.xml", stubItem("A1")],
];

/**
 * The stubs of `test-mapping`, written by hand as its generated ones are: `item034` declares the
 * mapping's source `NOTA` and not `SCORE`, its target (reading 97), `I` is time-dependent and
 * declares `A.B`, and `J` declares nothing more (the spec's `time-dependent` and declarations of
 * the positive).
 *
 * @param overrides - Stub texts that replace the positive's, by `href`.
 * @returns Each stub's `href` and text.
 */
const mappingStubs = (
  overrides: Readonly<Record<string, string>> = {},
): readonly (readonly [string, string])[] =>
  (
    [
      ["item034.xml", stubItem("item034", [["NOTA", "float"]], false)],
      ["item160.xml", stubItem("item160")],
      ["item063.xml", stubItem("item063")],
      ["itemI.xml", durationStub("I", [["A.B", "float"]])],
      ["itemJ.xml", stubItem("J")],
      ["item434.xml", stubItem("item434")],
      ["item065.xml", stubItem("item065")],
      ["item365.xml", stubItem("item365")],
    ] as const
  ).map(([href, text]) => [href, overrides[href] ?? text]);

/**
 * `test-content`'s one test rubric content body, which most of its negatives edit.
 */
const testRubricBody = "<qti-content-body><p>Test instructions</p></qti-content-body>";

/**
 * The test resource's LOM `general`, as `test-content` writes it: a `language` alone.
 */
const testResourceGeneral =
  "<imsmd:general>\n                        <imsmd:language>en</imsmd:language>\n                    </imsmd:general>";

/**
 * `test-linear`'s test without any part: its test outcome and time limits are kept.
 */
const noPartTest: string = testDocument("RTEST-13", [
  '    <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>',
  '    <qti-time-limits max-time="3600" min-time="600" allow-late-submission="true"/>',
]);

/**
 * `stimulus-shared`'s stimulus document with its body emptied to whitespace.
 */
const emptyStimulus: string = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<qti-assessment-stimulus xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqti_stimulusv3p0_v1p0.xsd" identifier="Stimulus1" title="Common Stimulus" xml:lang="eng">',
  '  <qti-stylesheet href="stylesheets/unbelievable_night.css" type="text/css"/>',
  "  <qti-stimulus-body> </qti-stimulus-body>",
  "</qti-assessment-stimulus>",
  "",
].join("\n");

/**
 * The test `item-ref-to-stimulus` adds to `stimulus-shared`: one item ref whose `href` names the
 * stimulus document.
 */
const stimulusRefTest: string = testDocument("STIMULUS-TEST", [
  '  <qti-test-part identifier="PART" navigation-mode="linear" submission-mode="individual">',
  '    <qti-assessment-section identifier="SECTION" title="Section" visible="true">',
  '      <qti-assessment-item-ref identifier="ITEM" href="passages/unbelievableNight.xml"/>',
  "    </qti-assessment-section>",
  "  </qti-test-part>",
]);

/**
 * The fragment `stimulus-300-include` includes as a child of a 3.0.0 body, where that version
 * admits none, as `stimulus-301` does in its 3.0.1 one.
 */
const stimulusFragment =
  '<p xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0">an included paragraph</p>\n';

/**
 * A branch rule on `test-section-ref`'s first item ref, to a target.
 *
 * @param target - The rule's `target`.
 * @returns The item ref with the rule inside it.
 */
const branchingItemRef = (target: string): string =>
  [
    '<qti-assessment-item-ref identifier="ITEMREF" href="items/a1.xml">',
    `                <qti-branch-rule target="${target}">${greaterThan("SCORE", "float", "0")}</qti-branch-rule>`,
    "            </qti-assessment-item-ref>",
  ].join("\n");

/**
 * The specs of {@link negativeNames}, in the order of the spec's 4.15 rows within each positive.
 */
const negativeSpecs: Record<(typeof negativeNames)[number], FixtureSpec> = {
  "branch-backward": negativeOver("branch-backward", "test-linear", [
    replaceIn(
      "rtest13.xml",
      '<qti-branch-rule target="item656">',
      '<qti-branch-rule target="item034">',
    ),
  ]),
  "branch-exit-misspelled": negativeOver("branch-exit-misspelled", "test-linear", [
    replaceIn("rtest13.xml", 'target="EXIT_TEST"', 'target="EXIT_TESTS"'),
  ]),
  "branch-into-ref": negativeOver("branch-into-ref", "test-section-ref", [
    replaceIn(
      "rtest01.xml",
      '<qti-assessment-item-ref identifier="ITEMREF" href="items/a1.xml"/>',
      branchingItemRef("shared"),
    ),
  ]),
  "branch-part-to-item": negativeOver("branch-part-to-item", "test-linear", [
    replaceIn("rtest13.xml", 'target="EXIT_TEST"', 'target="item653"'),
  ]),
  "branch-replacement-target": negativeOver("branch-replacement-target", "test-selection", [
    replaceIn(
      "rtest12.xml",
      '<qti-assessment-item-ref identifier="item034" href="item034.xml" required="true"/>',
      [
        '<qti-assessment-item-ref identifier="item034" href="item034.xml" required="true">',
        `                <qti-branch-rule target="item063">${greaterThan("item034.SCORE", "float", "0")}</qti-branch-rule>`,
        "            </qti-assessment-item-ref>",
      ].join("\n"),
    ),
  ]),
  "branch-unknown-target": negativeOver("branch-unknown-target", "test-linear", [
    replaceIn("rtest13.xml", 'target="EXIT_TEST"', 'target="NOPE"'),
  ]),
  "duration-of-item-ref": negativeOver("duration-of-item-ref", "test-mapping"),
  "feedback-outcome-float": negativeOver("feedback-outcome-float", "test-content", [
    replaceIn(
      "assessment.xml",
      'outcome-identifier="TEST_FEEDBACK" access="during"',
      'outcome-identifier="PROGRESS" access="during"',
    ),
    replaceIn(
      "assessment.xml",
      '<qti-outcome-declaration base-type="identifier" cardinality="single" identifier="s1FB"/>',
      [
        '<qti-outcome-declaration base-type="identifier" cardinality="single" identifier="s1FB"/>',
        '    <qti-outcome-declaration base-type="float" cardinality="single" identifier="PROGRESS"/>',
      ].join("\r\n"),
    ),
  ]),
  "feedback-template": negativeOver("feedback-template", "test-content", [
    replaceIn(
      "assessment.xml",
      "<div>You have reached the end of the test.</div>",
      [
        "<div>You have reached the end of the test.</div>",
        '            <div><qti-template-inline template-identifier="T" identifier="x" show-hide="show">x</qti-template-inline></div>',
      ].join("\r\n"),
    ),
  ]),
  "include-text": negativeOver("include-text", "test-include", [
    replaceIn(
      "rtest01.xml",
      '<xi:include href="rtest01-ref.xml" parse="xml"/>',
      '<xi:include href="rtest01-ref.xml" parse="text"/>',
    ),
  ]),
  "include-xpointer": negativeOver("include-xpointer", "test-include", [
    replaceIn(
      "rtest01.xml",
      '<xi:include href="rtest01-ref.xml" parse="xml"/>',
      '<xi:include href="rtest01-ref.xml" parse="xml" xpointer="element(/1)"/>',
    ),
  ]),
  "instance-spelling-canonical": negativeOver("instance-spelling-canonical", "test-mapping"),
  "item-in-section": negativeOver("item-in-section", "test-linear", [
    replaceIn(
      "rtest13.xml",
      '<qti-assessment-section identifier="main" title="Main Section" visible="false">',
      [
        '<qti-assessment-section identifier="main" title="Main Section" visible="false">',
        '            <qti-assessment-item identifier="inline" title="inline" adaptive="false" time-dependent="false">',
        "                <qti-item-body><p>inline</p></qti-item-body>",
        "            </qti-assessment-item>",
      ].join("\n"),
    ),
  ]),
  "item-prefixed": negativeOver("item-prefixed", "test-mapping"),
  "item-ref-missing": negativeByHand("item-ref-missing", "test-linear", linearStubs, [
    replaceIn("rtest13.xml", 'href="item656.xml"', 'href="missing.xml"'),
  ]),
  "item-ref-to-stimulus": negativeOver("item-ref-to-stimulus", "stimulus-shared", [
    addText("stimulus-test.xml", stimulusRefTest),
    replaceIn(
      "imsmanifest.xml",
      "</resources>",
      [
        '        <resource identifier="StimulusTest" type="imsqti_test_xmlv3p0" href="stimulus-test.xml">',
        '            <file href="stimulus-test.xml"/>',
        "        </resource>",
        "    </resources>",
      ].join("\n"),
    ),
  ]),
  "mapping-target-twice": negativeOver("mapping-target-twice", "test-mapping", [
    replaceIn(
      "rtest26.xml",
      '<qti-variable-mapping source-identifier="NOTA" target-identifier="SCORE"/>',
      [
        '<qti-variable-mapping source-identifier="NOTA" target-identifier="SCORE"/>',
        '                <qti-variable-mapping source-identifier="NOTB" target-identifier="SCORE"/>',
      ].join("\n"),
    ),
  ]),
  "mapping-undeclared": negativeByHand("mapping-undeclared", "test-mapping", mappingStubs(), [
    replaceIn("rtest26.xml", 'source-identifier="NOTA"', 'source-identifier="NOPE"'),
  ]),
  "navigation-misspelled": negativeOver("navigation-misspelled", "test-linear", [
    replaceIn("rtest13.xml", 'navigation-mode="linear"', 'navigation-mode="Linear"'),
  ]),
  "part-no-section": negativeOver("part-no-section", "test-linear", [
    replaceIn(
      "rtest13.xml",
      "    </qti-test-part>",
      [
        "    </qti-test-part>",
        '    <qti-test-part identifier="RTEST-13-B" navigation-mode="linear" submission-mode="individual"/>',
      ].join("\n"),
    ),
  ]),
  "part-order": negativeOver("part-order", "test-linear", [
    replaceIn(
      "rtest13.xml",
      '<qti-item-session-control show-feedback="true" max-attempts="1" show-solution="false"/>',
      "",
    ),
    replaceIn(
      "rtest13.xml",
      '<qti-assessment-section identifier="sectionB" title="Section B" visible="true">',
      [
        '<qti-item-session-control show-feedback="true" max-attempts="1" show-solution="false"/>',
        '        <qti-assessment-section identifier="sectionB" title="Section B" visible="true">',
      ].join("\n"),
    ),
  ]),
  "precondition-number-correct": negativeOver("precondition-number-correct", "test-linear", [
    replaceIn(
      "rtest13.xml",
      '<qti-assessment-section identifier="sectionB" title="Section B" visible="true">',
      [
        '<qti-assessment-section identifier="sectionB" title="Section B" visible="true">',
        '            <qti-pre-condition><qti-gt><qti-number-correct/><qti-base-value base-type="integer">0</qti-base-value></qti-gt></qti-pre-condition>',
      ].join("\n"),
    ),
  ]),
  "prefixed-ambiguous": negativeOver("prefixed-ambiguous", "test-mapping", [
    replaceIn(
      "rtest26.xml",
      '<qti-assessment-item-ref identifier="J" href="itemJ.xml"/>',
      [
        '<qti-assessment-item-ref identifier="J" href="itemJ.xml">',
        '                <qti-variable-mapping source-identifier="K.SCORE" target-identifier="KSCORE"/>',
        "            </qti-assessment-item-ref>",
      ].join("\n"),
    ),
  ]),
  "prefixed-undeclared-variable": negativeByHand(
    "prefixed-undeclared-variable",
    "test-mapping",
    mappingStubs(),
    [
      replaceIn(
        "rtest26.xml",
        '<qti-variable identifier="item160.SCORE"/>',
        '<qti-variable identifier="I.NOPE"/>',
      ),
    ],
  ),
  "prefixed-unknown-ref": negativeOver("prefixed-unknown-ref", "test-mapping", [
    replaceIn(
      "rtest26.xml",
      '<qti-variable identifier="item160.SCORE"/>',
      '<qti-variable identifier="NOPE.SCORE"/>',
    ),
  ]),
  "rubric-empty-view": negativeOver("rubric-empty-view", "test-content", [
    replaceIn(
      "assessment.xml",
      '<qti-rubric-block view="candidate" use="instructions">\r\n        <qti-content-body><p>Test instructions</p>',
      '<qti-rubric-block view="" use="instructions">\r\n        <qti-content-body><p>Test instructions</p>',
    ),
  ]),
  "rubric-in-rubric": negativeOver("rubric-in-rubric", "test-content", [
    replaceIn(
      "assessment.xml",
      testRubricBody,
      '<qti-content-body><p>Test instructions</p><qti-rubric-block view="candidate"><qti-content-body><p>Nested</p></qti-content-body></qti-rubric-block></qti-content-body>',
    ),
  ]),
  "rubric-interaction": negativeOver("rubric-interaction", "test-content", [
    replaceIn(
      "assessment.xml",
      testRubricBody,
      '<qti-content-body><p>Test instructions <qti-text-entry-interaction response-identifier="RESPONSE"/></p></qti-content-body>',
    ),
  ]),
  "rubric-no-body": negativeOver("rubric-no-body", "test-content", [
    replaceIn("assessment.xml", testRubricBody, ""),
  ]),
  "rubric-printed-undeclared": negativeOver("rubric-printed-undeclared", "test-content", [
    replaceIn(
      "assessment.xml",
      testRubricBody,
      '<qti-content-body><p>Test instructions <qti-printed-variable identifier="NOPE"/></p></qti-content-body>',
    ),
  ]),
  "section-adaptive-and-selection": negativeOver(
    "section-adaptive-and-selection",
    "test-adaptive",
    [
      replaceIn(
        "adaptive-test.xml",
        "</qti-adaptive-selection>",
        '</qti-adaptive-selection>\n      <qti-selection select="1"/>',
      ),
    ],
  ),
  "section-feedback-undeclared": negativeOver("section-feedback-undeclared", "test-section-ref", [
    replaceIn(
      "test-b.xml",
      '  <qti-outcome-declaration identifier="FLAG" cardinality="single" base-type="identifier"/>\n',
      "",
    ),
  ]),
  "section-identifier-unknown": negativeOver("section-identifier-unknown", "test-mapping", [
    replaceIn("rtest26.xml", 'section-identifier="sectionA"', 'section-identifier="NOPE"'),
  ]),
  "section-prefixed-unresolved": negativeOver("section-prefixed-unresolved", "test-section-ref", [
    replaceIn(
      "test-b.xml",
      'identifier="ITEMREF" href="items/b1.xml"',
      'identifier="RENAMED" href="items/b1.xml"',
    ),
  ]),
  "section-printed-undeclared": negativeOver("section-printed-undeclared", "test-section-ref", [
    replaceIn(
      "test-b.xml",
      '  <qti-outcome-declaration identifier="COUNT" cardinality="single" base-type="integer"/>\n',
      "",
    ),
  ]),
  "section-ref-cycle": negativeOver("section-ref-cycle", "test-section-ref", [
    replaceIn(
      "sections/shared.xml",
      '<qti-assessment-item-ref identifier="shared-item" href="../items/shared.xml"/>',
      [
        '<qti-assessment-item-ref identifier="shared-item" href="../items/shared.xml"/>',
        '  <qti-assessment-section-ref identifier="SELF" href="shared.xml"/>',
      ].join("\n"),
    ),
  ]),
  "section-ref-identifier-clash": negativeOver("section-ref-identifier-clash", "test-section-ref", [
    replaceIn("sections/shared.xml", 'identifier="shared-item"', 'identifier="ITEMREF"'),
  ]),
  "section-ref-to-item": negativeOver("section-ref-to-item", "test-section-ref", [
    replaceIn(
      "rtest01.xml",
      '<qti-assessment-section-ref identifier="S1" href="sections/shared.xml"/>',
      '<qti-assessment-section-ref identifier="S1" href="items/i2.xml"/>',
    ),
  ]),
  "section-two-isc": negativeOver("section-two-isc", "test-linear", [
    replaceIn(
      "rtest13.xml",
      '<qti-item-session-control max-attempts="2"/>',
      '<qti-item-session-control max-attempts="2"/>\n            <qti-item-session-control max-attempts="3"/>',
    ),
  ]),
  "section-unprefixed-undeclared": negativeOver(
    "section-unprefixed-undeclared",
    "test-section-ref",
    [
      replaceIn(
        "test-b.xml",
        '  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>\n',
        "",
      ),
    ],
  ),
  "section-variable-in-test": negativeOver("section-variable-in-test", "test-section-ref"),
  "select-not-integer": negativeOver("select-not-integer", "test-selection", [
    replaceIn("rtest12.xml", '<qti-selection select="+2"/>', '<qti-selection select="2.5"/>'),
  ]),
  "select-over": negativeOver("select-over", "test-selection", [
    replaceIn("rtest12.xml", '<qti-selection select="+2"/>', '<qti-selection select="9"/>'),
  ]),
  "select-under-required": negativeOver("select-under-required", "test-selection", [
    replaceIn(
      "rtest12.xml",
      '<qti-assessment-item-ref identifier="item434" href="item434.xml"/>',
      '<qti-assessment-item-ref identifier="item434" href="item434.xml" required="true"/>',
    ),
    replaceIn(
      "rtest12.xml",
      '<qti-assessment-item-ref identifier="item065" href="item065.xml"/>',
      '<qti-assessment-item-ref identifier="item065" href="item065.xml" required="true"/>',
    ),
  ]),
  "stimulus-300-attributes": negativeOver("stimulus-300-attributes", "stimulus-shared", [
    replaceIn(
      "passages/unbelievableNight.xml",
      "<qti-stimulus-body>",
      '<qti-stimulus-body class="x">',
    ),
  ]),
  "stimulus-300-include": negativeOver("stimulus-300-include", "stimulus-shared", [
    addText("passages/fragment.xml", stimulusFragment),
    replaceIn(
      "imsmanifest.xml",
      '<file href="passages/stylesheets/unbelievable_night.css"/>',
      '<file href="passages/stylesheets/unbelievable_night.css"/>\n            <file href="passages/fragment.xml"/>',
    ),
    replaceIn(
      "passages/unbelievableNight.xml",
      '<qti-assessment-stimulus \n\txmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"',
      '<qti-assessment-stimulus xmlns:xi="http://www.w3.org/2001/XInclude" \n\txmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"',
    ),
    replaceIn(
      "passages/unbelievableNight.xml",
      "  </qti-stimulus-body>",
      '    <xi:include href="fragment.xml" parse="xml"/>\n  </qti-stimulus-body>',
    ),
  ]),
  "stimulus-body-empty": {
    edits: [
      ...stimulusSharedEdits.filter(
        (edit) => !(edit._tag === "ReplaceText" && edit.file === "passages/unbelievableNight.xml"),
      ),
      addText("passages/unbelievableNight.xml", emptyStimulus),
    ],
    member: sharedStimulusMember,
    name: "stimulus-body-empty",
  },
  "stimulus-missing-image": {
    edits: stimulusSharedEdits.filter(
      (edit) =>
        edit._tag !== "copyFile" &&
        !(edit._tag === "ReplaceText" && edit.file === "imsmanifest.xml"),
    ),
    member: sharedStimulusMember,
    name: "stimulus-missing-image",
  },
  "stimulus-ref-duplicate": negativeOver("stimulus-ref-duplicate", "stimulus-shared", [
    replaceIn(
      "exemplar06.xml",
      '<qti-assessment-stimulus-ref identifier="Stimulus1" href="passages/unbelievableNight.xml" title="An Unbelievable Night"/>',
      [
        '<qti-assessment-stimulus-ref identifier="Stimulus1" href="passages/unbelievableNight.xml" title="An Unbelievable Night"/>',
        '  <qti-assessment-stimulus-ref identifier="Stimulus1" href="passages/unbelievableNight.xml"/>',
      ].join("\n"),
    ),
  ]),
  "stimulus-ref-to-item": negativeOver("stimulus-ref-to-item", "stimulus-shared", [
    replaceIn(
      "exemplar06.xml",
      'href="passages/unbelievableNight.xml" title="An Unbelievable Night"',
      'href="exemplar04.xml" title="An Unbelievable Night"',
    ),
  ]),
  "stimulus-typed-test": negativeOver("stimulus-typed-test", "stimulus-shared", [
    replaceIn(
      "imsmanifest.xml",
      'identifier="Stimulus1" type="imsqti_stimulus_xmlv3p0"',
      'identifier="Stimulus1" type="imsqti_test_xmlv3p0"',
    ),
  ]),
  "template-default-type": negativeOver("template-default-type", "test-template-default", [
    replaceIn(
      "template-default-test.xml",
      '<qti-variable identifier="TRIP.SPEEDLIMIT"/>',
      '<qti-base-value base-type="string">fast</qti-base-value>',
    ),
  ]),
  "template-default-undeclared": negativeOver(
    "template-default-undeclared",
    "test-template-default",
    [
      replaceIn(
        "template-default-test.xml",
        'template-identifier="SPEED"',
        'template-identifier="NOPE"',
      ),
    ],
  ),
  "test-declares-duration": negativeOver("test-declares-duration", "test-linear", [
    replaceIn(
      "rtest13.xml",
      '<qti-time-limits max-time="3600" min-time="600" allow-late-submission="true"/>',
      [
        '<qti-outcome-declaration identifier="duration" cardinality="single" base-type="duration"/>',
        '    <qti-time-limits max-time="3600" min-time="600" allow-late-submission="true"/>',
      ].join("\n"),
    ),
  ]),
  "test-duplicate-identifier": negativeOver("test-duplicate-identifier", "test-linear", [
    replaceIn(
      "rtest13.xml",
      '<qti-assessment-item-ref identifier="item160" href="item160.xml">',
      '<qti-assessment-item-ref identifier="sectionA" href="item160.xml">',
    ),
  ]),
  "test-identifier-mismatch": negativeOver("test-identifier-mismatch", "test-content", [
    replaceIn(
      "imsmanifest.xml",
      testResourceGeneral,
      "<imsmd:general>\n                        <imsmd:identifier><imsmd:entry>OTHER-TEST</imsmd:entry></imsmd:identifier>\n                        <imsmd:language>en</imsmd:language>\n                    </imsmd:general>",
    ),
  ]),
  "test-lang-no-lom": negativeOver("test-lang-no-lom", "test-content", [
    replaceIn("assessment.xml", "<p>Part notes</p>", '<p xml:lang="en">Part notes</p>'),
    replaceIn(
      "imsmanifest.xml",
      testResourceGeneral,
      "<imsmd:general>\n                    </imsmd:general>",
    ),
  ]),
  "test-no-part": {
    edits: [
      addText("rtest13.xml", noPartTest),
      ...testSpecs["test-linear"].edits.filter(
        (edit) => !(edit._tag === "ReplaceText" && edit.file === "rtest13.xml"),
      ),
    ],
    member: testSpecs["test-linear"].member,
    name: "test-no-part",
  },
  "test-title-mismatch": negativeOver("test-title-mismatch", "test-content", [
    replaceIn(
      "imsmanifest.xml",
      testResourceGeneral,
      '<imsmd:general>\n                        <imsmd:title><imsmd:string language="en">Another Test</imsmd:string></imsmd:title>\n                        <imsmd:language>en</imsmd:language>\n                    </imsmd:general>',
    ),
  ]),
  "test-undeclared-variable": negativeOver("test-undeclared-variable", "test-linear", [
    replaceIn(
      "rtest13.xml",
      "</qti-assessment-test>",
      [
        "    <qti-outcome-processing>",
        setOutcome("SCORE", '<qti-variable identifier="NOPE"/>'),
        "    </qti-outcome-processing>",
        "</qti-assessment-test>",
      ].join("\n"),
    ),
  ]),
};

/**
 * `simple`'s one `img`, which `aria-source-role` wraps in a `picture`.
 */
const simpleImage = '<img src="images/sign.png" alt="NEVER LEAVE LUGGAGE UNATTENDED"/>';

/**
 * A `qti-pattern-match` whose `pattern` names `NOSUCH`, a variable no fixture declares, over a
 * string literal.
 */
const unresolvedPattern =
  '<qti-pattern-match pattern="{NOSUCH}"><qti-base-value base-type="string">x</qti-base-value></qti-pattern-match>';

/**
 * A rule that sets `SCORE` to 1, which both `pattern-unresolved-*` fixtures put under the pattern.
 */
const scoreOne =
  '<qti-set-outcome-value identifier="SCORE"><qti-base-value base-type="float">1</qti-base-value></qti-set-outcome-value>';

/**
 * The specs of {@link restoredNames}.
 */
const restoredSpecs: Record<(typeof restoredNames)[number], FixtureSpec> = {
  "aria-h1-role-button": overSimple("aria-h1-role-button", [
    replaceIn(
      "choice.xml",
      "<p>Look at the text in the picture.</p>",
      '<h1 role="button">Look at the text in the picture.</h1>',
    ),
  ]),
  "aria-source-role": overSimple("aria-source-role", [
    replaceIn(
      "choice.xml",
      simpleImage,
      `<picture><source srcset="images/sign.png" type="image/png" role="presentation"/>${simpleImage}</picture>`,
    ),
  ]),
  "lang-case-mismatch": overSimple("lang-case-mismatch", [
    replaceIn(
      "choice.xml",
      'adaptive="false" time-dependent="false">',
      'adaptive="false" time-dependent="false" xml:lang="en-GB">',
    ),
    {
      _tag: "InsertAfterLine",
      file: "imsmanifest.xml",
      line: simpleResourceTitleEnd,
      text: "                        <imsmd:language>en-gb</imsmd:language>",
    },
  ]),
  "pattern-unresolved-item": overSimple("pattern-unresolved-item", [
    replaceIn(
      "choice.xml",
      '<qti-response-processing template="https://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct.xml"/>',
      [
        "<qti-response-processing>",
        "        <qti-response-condition>",
        "            <qti-response-if>",
        `                ${unresolvedPattern}`,
        `                ${scoreOne}`,
        "            </qti-response-if>",
        "        </qti-response-condition>",
        "    </qti-response-processing>",
      ].join(CRLF),
    ),
  ]),
  "pattern-unresolved-test": negativeOver("pattern-unresolved-test", "test-linear", [
    replaceIn(
      "rtest13.xml",
      "    </qti-test-part>",
      [
        "    </qti-test-part>",
        "    <qti-outcome-processing>",
        "        <qti-outcome-condition>",
        "            <qti-outcome-if>",
        `                ${unresolvedPattern}`,
        `                ${scoreOne}`,
        "            </qti-outcome-if>",
        "        </qti-outcome-condition>",
        "    </qti-outcome-processing>",
      ].join("\n"),
    ),
  ]),
};

/**
 * The edit that places `test-section-ref`'s section document a second time in the first test's
 * part, under the section ref `S2`.
 */
const placeSectionTwice: Edit = replaceIn(
  "rtest01.xml",
  '<qti-assessment-section-ref identifier="S1" href="sections/shared.xml"/>',
  [
    '<qti-assessment-section-ref identifier="S1" href="sections/shared.xml"/>',
    '            <qti-assessment-section-ref identifier="S2" href="sections/shared.xml"/>',
  ].join("\n"),
);

/**
 * The specs of {@link assemblyNames}.
 */
const assemblySpecs: Record<(typeof assemblyNames)[number], FixtureSpec> = {
  "branch-backward-shuffled": negativeOver("branch-backward-shuffled", "test-linear", [
    replaceIn(
      "rtest13.xml",
      '<qti-item-session-control max-attempts="2"/>',
      '<qti-item-session-control max-attempts="2"/>\n            <qti-ordering shuffle="true"/>',
    ),
    replaceIn(
      "rtest13.xml",
      '<qti-branch-rule target="EXIT_TESTPART">',
      [
        `<qti-branch-rule target="item347">${greaterThan("item653.SCORE", "float", "1")}</qti-branch-rule>`,
        '                <qti-branch-rule target="EXIT_TESTPART">',
      ].join("\n"),
    ),
  ]),
  "branch-in-twice-placed-section": negativeOver(
    "branch-in-twice-placed-section",
    "test-section-ref",
    [
      placeSectionTwice,
      replaceIn(
        "sections/shared.xml",
        '<qti-assessment-item-ref identifier="shared-item" href="../items/shared.xml"/>',
        [
          '<qti-assessment-item-ref identifier="first-item" href="../items/shared.xml">',
          `    <qti-branch-rule target="shared-item">${greaterThan("SCORE", "float", "0")}</qti-branch-rule>`,
          "  </qti-assessment-item-ref>",
          '  <qti-assessment-item-ref identifier="shared-item" href="../items/shared.xml"/>',
        ].join("\n"),
      ),
    ],
  ),
  "branch-to-own-section": negativeOver("branch-to-own-section", "test-linear", [
    replaceIn(
      "rtest13.xml",
      '<qti-branch-rule target="item656">',
      '<qti-branch-rule target="sectionB">',
    ),
  ]),
  "section-doc-name-clash": negativeOver("section-doc-name-clash", "test-section-ref", [
    replaceIn("sections/shared.xml", 'identifier="shared-item"', 'identifier="shared"'),
  ]),
  "section-doc-twice": negativeOver("section-doc-twice", "test-section-ref", [placeSectionTwice]),
  "select-two-required": negativeOver("select-two-required", "test-selection", [
    replaceIn(
      "rtest12.xml",
      '<qti-assessment-item-ref identifier="item434" href="item434.xml"/>',
      '<qti-assessment-item-ref identifier="item434" href="item434.xml" required="true"/>',
    ),
    replaceIn(
      "rtest12.xml",
      '            <qti-assessment-item-ref identifier="item365" href="item365.xml"/>\n',
      "",
    ),
  ]),
};

/**
 * Set an outcome of `test-mapping` that it declares beside its own, in its outcome processing.
 *
 * @param name - The fixture's name.
 * @param declaration - The outcome's declaration.
 * @param outcome - The outcome it sets.
 * @param expression - The expression it sets it to.
 * @returns The spec.
 */
const weightedOver = (
  name: (typeof weightedNames)[number],
  declaration: string,
  outcome: string,
  expression: string,
): FixtureSpec =>
  negativeOver(name, "test-mapping", [
    replaceIn(
      "rtest26.xml",
      '    <qti-outcome-declaration identifier="TIMED" cardinality="single" base-type="float"/>',
      [
        '    <qti-outcome-declaration identifier="TIMED" cardinality="single" base-type="float"/>',
        `    ${declaration}`,
      ].join("\n"),
    ),
    replaceIn(
      "rtest26.xml",
      "    </qti-outcome-processing>",
      [setOutcome(outcome, expression), "    </qti-outcome-processing>"].join("\n"),
    ),
  ]);

/**
 * The weighted test variables a weighted fixture sets an outcome from: `rtest04.xml`'s, with a
 * `weight-identifier` and no `base-type`.
 */
const weightedVariables =
  '<qti-test-variables variable-identifier="SCORE" weight-identifier="WEIGHT"/>';

const weightedSpecs: Record<(typeof weightedNames)[number], FixtureSpec> = {
  "weighted-sum-float": weightedOver(
    "weighted-sum-float",
    '<qti-outcome-declaration identifier="WSUM" cardinality="single" base-type="float"/>',
    "WSUM",
    `<qti-sum>${weightedVariables}</qti-sum>`,
  ),
  "weighted-variables-integer": weightedOver(
    "weighted-variables-integer",
    '<qti-outcome-declaration identifier="NS" cardinality="multiple" base-type="integer"/>',
    "NS",
    weightedVariables,
  ),
};

/**
 * The `BPIG_22April` item that `cut-catalog-supports` is cut from: one catalog of two cards, the
 * first with two entries, referenced from a `span` in the interaction's prompt.
 */
const catalogSupportsItem = "items/CatalogWithMultipleSupports.xml";

/**
 * The edit that adds a card at the end of {@link catalogSupportsItem}'s one catalog.
 *
 * @param card - The card's text.
 * @returns The edit as plain data.
 */
const addCatalogCard = (card: string): TextEdit =>
  replaceIn(catalogSupportsItem, "</qti-catalog>", `${card}</qti-catalog>`);

/**
 * A `qti-catalog-info` of one catalog of one card, a linguistic guidance with html content.
 *
 * @param id - The catalog's `id`.
 * @param text - The card's text.
 * @returns The element's text.
 */
const guidanceCatalog = (id: string, text: string): string =>
  `<qti-catalog-info><qti-catalog id="${id}"><qti-card support="linguistic-guidance"><qti-html-content>${text}</qti-html-content></qti-card></qti-catalog></qti-catalog-info>`;

/**
 * The feedback block that `catalog-hosts` adds to {@link bgChoiceItem}, with a catalog that a
 * `data-catalog-idref` in its own content names.
 */
const catalogHostFeedback = `<qti-feedback-block outcome-identifier="FEEDBACK" identifier="fb" show-hide="show"><qti-content-body><p data-catalog-idref="cat-feedback">Wrong</p></qti-content-body>${guidanceCatalog("cat-feedback", "Wrong means not right.")}</qti-feedback-block>`;

/**
 * The template block of `catalog-hosts`, with a catalog of its own and a feedback block that has
 * one too.
 */
const catalogHostTemplate = `<qti-template-block template-identifier="T" identifier="tb"><qti-content-body><p data-catalog-idref="cat-template">Hint</p><qti-feedback-block outcome-identifier="FEEDBACK" identifier="tfb" show-hide="hide"><qti-content-body><p data-catalog-idref="cat-template-feedback">More</p></qti-content-body>${guidanceCatalog("cat-template-feedback", "More means extra.")}</qti-feedback-block></qti-content-body>${guidanceCatalog("cat-template", "A hint helps.")}</qti-template-block>`;

/**
 * The rubric block of `catalog-hosts`, whose template block holds a catalog.
 */
const catalogHostRubric = `<qti-rubric-block use="instructions" view="candidate"><qti-content-body><qti-template-block template-identifier="T" identifier="rtb" show-hide="hide"><qti-content-body><p data-catalog-idref="cat-rubric-template">Read</p></qti-content-body>${guidanceCatalog("cat-rubric-template", "To read is to look.")}</qti-template-block></qti-content-body></qti-rubric-block>`;

/**
 * The modal feedback of `catalog-hosts`, which follows the item's response processing.
 */
const catalogHostModal = `<qti-modal-feedback outcome-identifier="FEEDBACK" show-hide="show" identifier="mf"><qti-content-body><p data-catalog-idref="cat-modal">Done</p></qti-content-body>${guidanceCatalog("cat-modal", "Done means finished.")}</qti-modal-feedback>`;

/**
 * The files the cards of `card-files` name by `qti-file-href`, beside `simple`'s own
 * `images/sign.png`: a copy of it and a short video, each listed in the manifest.
 */
const cardFileEdits: readonly Edit[] = [
  { _tag: "copyFile", from: "images/sign.png", to: "images/sign-large.png" },
  {
    _tag: "addFile",
    path: "video/clip.mp4",
    source: { member: "QTI3_BPIG_Examples/items/images/bubble.mp4" },
  },
  replaceIn(
    "imsmanifest.xml",
    '<file href="images/sign.png"/>',
    [
      '<file href="images/sign.png"/>',
      '            <file href="images/sign-large.png"/>',
      '            <file href="video/clip.mp4"/>',
    ].join(CRLF),
  ),
];

/**
 * The edits that give `simple`'s item a catalog after its body, named by a `data-catalog-idref` on
 * its first paragraph.
 *
 * @param reference - The `data-catalog-idref` value.
 * @param catalog - The `qti-catalog-info` element's text.
 * @returns The edits, each of which must match exactly once.
 */
const simpleWithCatalog = (reference: string, catalog: string): readonly TextEdit[] => [
  replaceIn(
    "choice.xml",
    "<p>Look at the text in the picture.</p>",
    `<p data-catalog-idref="${reference}">Look at the text in the picture.</p>`,
  ),
  replaceIn("choice.xml", "</qti-item-body>", `</qti-item-body>${CRLF}    ${catalog}`),
];

/**
 * The specs of {@link catalogNames}.
 */
const catalogSpecs: Record<(typeof catalogNames)[number], FixtureSpec> = {
  "card-empty": {
    edits: [
      addCatalogCard('<qti-card support="spoken"/>'),
      { _tag: "cut", item: catalogSupportsItem, schemaversion: "3.0.1" },
    ],
    member: corpusMembers.BPIG_22April,
    name: "card-empty",
  },
  "card-files": overSimple("card-files", [
    ...cardFileEdits,
    ...simpleWithCatalog(
      "files1",
      [
        '<qti-catalog-info><qti-catalog id="files1">',
        '<qti-card support="sign-language"><qti-file-href mime-type="video/mp4">video/clip.mp4</qti-file-href><qti-file-href mime-type="image/png">images/sign.png</qti-file-href></qti-card>',
        '<qti-card support="long-description"><qti-html-content><p data-catalog-idref="files1">The sign.</p></qti-html-content><qti-file-href mime-type="image/png">images/sign-large.png</qti-file-href></qti-card>',
        '<qti-card support="ext:org.example-sign_1"><qti-card-entry default="1"><qti-file-href mime-type="video/mp4">video/clip.mp4</qti-file-href></qti-card-entry></qti-card>',
        "</qti-catalog></qti-catalog-info>",
      ].join(""),
    ),
  ]),
  "card-gap-inside": {
    edits: [
      replaceIn(
        "items/gap-match-example-1.xml",
        '<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>',
        '<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/><qti-outcome-declaration identifier="FEEDBACK" cardinality="single" base-type="identifier"/>',
      ),
      replaceIn(
        "items/gap-match-example-1.xml",
        "</blockquote>",
        `</blockquote><div><qti-feedback-block outcome-identifier="FEEDBACK" identifier="hint" show-hide="show"><qti-content-body><p data-catalog-idref="cat-gap">Hint</p></qti-content-body><qti-catalog-info><qti-catalog id="cat-gap"><qti-card support="linguistic-guidance"><qti-html-content><p>The season is <qti-gap identifier="G3"/>.</p></qti-html-content></qti-card></qti-catalog></qti-catalog-info></qti-feedback-block></div>`,
      ),
      { _tag: "cut", item: "items/gap-match-example-1.xml", schemaversion: "3.0.1" },
    ],
    member: corpusMembers.BPIG_22April,
    name: "card-gap-inside",
  },
  "card-qti-content": {
    edits: [
      replaceIn(
        catalogSupportsItem,
        '<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>',
        '<qti-response-declaration identifier="RESPONSE2" cardinality="single" base-type="identifier"/><qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/><qti-outcome-declaration identifier="SHOWN" cardinality="single" base-type="string"/>',
      ),
      addCatalogCard(
        '<qti-card support="additional-directions"><qti-html-content><p>Shown: <qti-printed-variable identifier="SHOWN"/></p><div><qti-choice-interaction response-identifier="RESPONSE2" max-choices="1"><qti-simple-choice identifier="yes">Yes</qti-simple-choice><qti-simple-choice identifier="no">No</qti-simple-choice></qti-choice-interaction></div></qti-html-content></qti-card>',
      ),
      { _tag: "cut", item: catalogSupportsItem, schemaversion: "3.0.1" },
    ],
    member: corpusMembers.BPIG_22April,
    name: "card-qti-content",
  },
  "catalog-300": {
    edits: [
      replaceIn(catalogSupportsItem, "imsqti_asiv3p0p1_v1p0.xsd", "imsqti_asiv3p0_v1p0.xsd"),
      { _tag: "cut", item: catalogSupportsItem, schemaversion: "3.0.0" },
    ],
    member: corpusMembers.BPIG_22April,
    name: "catalog-300",
  },
  "catalog-hosts": bgCopy("catalog-hosts", [
    replaceIn(
      bgChoiceItem,
      "</qti-outcome-declaration>",
      `</qti-outcome-declaration><qti-outcome-declaration base-type="identifier" cardinality="single" identifier="FEEDBACK"/>${templateDeclaration}`,
    ),
    replaceIn(
      bgChoiceItem,
      "</qti-choice-interaction>",
      `</qti-choice-interaction>${catalogHostFeedback}${catalogHostTemplate}${catalogHostRubric}`,
    ),
    replaceIn(bgChoiceItem, "</qti-assessment-item>", `${catalogHostModal}</qti-assessment-item>`),
  ]),
  "catalog-lang": overSimple("catalog-lang", [
    ...copySpecs["item-lang-en"].edits,
    ...simpleWithCatalog(
      "catalog1",
      '<qti-catalog-info><qti-catalog id="catalog1"><qti-card support="keyword-translation"><qti-card-entry xml:lang="es"><qti-html-content>preciso</qti-html-content></qti-card-entry><qti-card-entry xml:lang="de"><qti-html-content>genau</qti-html-content></qti-card-entry></qti-card><qti-card support="linguistic-guidance" xml:lang="es"><qti-html-content xml:lang="es">Preciso significa <span xml:lang="fr">exact</span>.</qti-html-content></qti-card></qti-catalog></qti-catalog-info>',
    ),
  ]),
  // The MIME type is not padded (decision 447): `MimeTypeDType` is an `xs:normalizedString`,
  // whose whitespace is replaced and never collapsed, so a space or a tab in it stays and reading
  // 135 refuses it. The other padded values (`id`, `default`, the href) are of types that collapse.
  "catalog-padded": overSimple(
    "catalog-padded",
    simpleWithCatalog(
      "catalog1",
      '<qti-catalog-info><qti-catalog id=" catalog1 "><qti-card support="sign-language"><qti-card-entry default=" true "><qti-file-href mime-type="image/png"> images/sign.png </qti-file-href></qti-card-entry></qti-card></qti-catalog></qti-catalog-info>',
    ),
  ),
  "cut-catalog-multiple": cutItem(
    "cut-catalog-multiple",
    "BPIG_22April",
    "items/MultipleCatalogs.xml",
    "3.0.1",
  ),
  "cut-catalog-nodes": cutItem(
    "cut-catalog-nodes",
    "BPIG_22April",
    "items/CatalogsAcrossContentNodes.xml",
    "3.0.1",
  ),
  "cut-catalog-reference": cutItem(
    "cut-catalog-reference",
    "BPIG_22April",
    "items/ReferencingCatalogContent.xml",
    "3.0.1",
  ),
  "cut-catalog-rubric": cutItem(
    "cut-catalog-rubric",
    "BPIG_22April",
    "items/rubric_block.xml",
    "3.0.1",
  ),
  "cut-catalog-supports": cutItem(
    "cut-catalog-supports",
    "BPIG_22April",
    catalogSupportsItem,
    "3.0.1",
  ),
  "entry-empty": {
    edits: [
      addCatalogCard('<qti-card support="spoken"><qti-card-entry xml:lang="en"/></qti-card>'),
      { _tag: "cut", item: catalogSupportsItem, schemaversion: "3.0.1" },
    ],
    member: corpusMembers.BPIG_22April,
    name: "entry-empty",
  },
};

/**
 * The item `testWithLti` carries its companion materials in, the one corpus item that has any.
 */
const companionItem = "elements.xml";

/**
 * The file and icon of {@link companionItem}'s digital material, which a cut keeps because the
 * item's `qti-file-href` and `qti-resource-icon` name them.
 */
const companionFileInfo =
  "<qti-file-href>links/periodicTable.xml</qti-file-href><qti-resource-icon>links/table.svg</qti-resource-icon>";

/**
 * The edit that adds `materials` to {@link companionItem}'s `qti-companion-materials-info`, ahead
 * of its one digital material (the schema orders calculators, rules, protractors, digital
 * materials and physical materials).
 *
 * @param materials - The elements to add, calculators, rules and protractors in that order.
 * @returns The edit as plain data.
 */
const companionBefore = (materials: string): TextEdit =>
  replaceIn(
    companionItem,
    "<qti-companion-materials-info>",
    `<qti-companion-materials-info>${materials}`,
  );

/**
 * The edit that adds `materials` at the end of {@link companionItem}'s
 * `qti-companion-materials-info`, after its one digital material.
 *
 * @param materials - The elements to add, digital materials then physical materials.
 * @returns The edit as plain data.
 */
const companionAfter = (materials: string): TextEdit =>
  replaceIn(
    companionItem,
    "</qti-companion-materials-info>",
    `${materials}</qti-companion-materials-info>`,
  );

/**
 * A `qti-calculator`.
 *
 * @param type - The `qti-calculator-type` text.
 * @param info - The `qti-calculator-info` element's text, or empty for none.
 * @returns The element's text.
 */
const companionCalculator = (type: string, info: string): string =>
  `<qti-calculator><qti-calculator-type>${type}</qti-calculator-type><qti-description>A ${type} calculator</qti-description>${info}</qti-calculator>`;

/**
 * A `qti-rule` of one rule system.
 *
 * @param system - `si` or `us`.
 * @param minimum - The `qti-minimum-length` text.
 * @param minor - The `qti-minor-increment` element's text, or empty for none.
 * @param major - The `qti-major-increment` element's text.
 * @returns The element's text.
 */
const companionRule = (
  system: "si" | "us",
  minimum: string,
  minor: string,
  major: string,
): string =>
  `<qti-rule><qti-description>A ${system} rule</qti-description><qti-rule-system-${system}><qti-minimum-length>${minimum}</qti-minimum-length>${minor}${major}</qti-rule-system-${system}></qti-rule>`;

/**
 * A `qti-protractor` of one increment system.
 *
 * @param system - `si` or `us`.
 * @param minor - The `qti-minor-increment` element's text, or empty for none.
 * @param major - The `qti-major-increment` element's text.
 * @returns The element's text.
 */
const companionProtractor = (system: "si" | "us", minor: string, major: string): string =>
  `<qti-protractor><qti-description>A ${system} protractor</qti-description><qti-increment-${system}>${minor}${major}</qti-increment-${system}></qti-protractor>`;

/**
 * A `qti-minor-increment` or `qti-major-increment`.
 *
 * @param kind - `minor` or `major`.
 * @param unit - The `unit` value.
 * @param value - The decimal text.
 * @returns The element's text.
 */
const companionIncrement = (kind: "major" | "minor", unit: string, value: string): string =>
  `<qti-${kind}-increment unit="${unit}">${value}</qti-${kind}-increment>`;

/**
 * The materials `companion-full` adds ahead of the digital material: one calculator of each type,
 * the last with a calculator info and its icon; SI and US rules, with and without a minor
 * increment, that name all eight linear units; SI and US protractors, likewise, that name all four
 * radial units.
 */
const companionFullFirst = [
  companionCalculator("basic", ""),
  companionCalculator("standard", ""),
  companionCalculator("scientific", ""),
  companionCalculator(
    "graphing",
    `<qti-calculator-info>${companionFileInfo}</qti-calculator-info>`,
  ),
  companionRule(
    "si",
    "30",
    companionIncrement("minor", "Millimeter", "1"),
    companionIncrement("major", "Centimeter", "10"),
  ),
  companionRule("si", "100", "", companionIncrement("major", "Meter", "0.5")),
  companionRule(
    "si",
    "1000",
    companionIncrement("minor", "Meter", "100"),
    companionIncrement("major", "Kilometer", "1"),
  ),
  companionRule(
    "us",
    "12",
    companionIncrement("minor", "Inch", "0.25"),
    companionIncrement("major", "Foot", "1"),
  ),
  companionRule("us", "36", "", companionIncrement("major", "Yard", "1")),
  companionRule(
    "us",
    "120",
    companionIncrement("minor", "Yard", "10"),
    companionIncrement("major", "Mile", "1"),
  ),
  companionProtractor(
    "si",
    companionIncrement("minor", "Radian", "0.1"),
    companionIncrement("major", "Radian", "1"),
  ),
  companionProtractor("si", "", companionIncrement("major", "Radian", "0.5")),
  companionProtractor(
    "us",
    companionIncrement("minor", "Second", "30"),
    companionIncrement("major", "Minute", "1"),
  ),
  companionProtractor("us", "", companionIncrement("major", "Degree", "5")),
].join("");

/**
 * The materials `companion-full` adds after the digital material: a second digital material with
 * only a file, and two physical materials.
 */
const companionFullLast =
  "<qti-digital-material><qti-file-href>links/periodicTable.xml</qti-file-href></qti-digital-material><qti-physical-material>Scratch paper</qti-physical-material><qti-physical-material>Coloured pencils</qti-physical-material>";

/**
 * The specs of {@link companionNames}.
 */
const companionSpecs: Record<(typeof companionNames)[number], FixtureSpec> = {
  "companion-301": {
    edits: [
      replaceIn(companionItem, "imsqti_asiv3p0_v1p0.xsd", "imsqti_asiv3p0p1_v1p0.xsd"),
      { _tag: "cut", item: companionItem, schemaversion: "3.0.1" },
    ],
    member: corpusMembers.testWithLti,
    name: "companion-301",
  },
  "companion-full": {
    edits: [
      companionBefore(companionFullFirst),
      companionAfter(companionFullLast),
      { _tag: "cut", item: companionItem, schemaversion: "3.0.0" },
    ],
    member: corpusMembers.testWithLti,
    name: "companion-full",
  },
  "companion-padded": {
    edits: [
      companionBefore(
        `<qti-rule><qti-description>A ruler&#9;of one metre</qti-description><qti-rule-system-si><qti-minimum-length> 30 </qti-minimum-length><qti-major-increment unit="Meter"> 1.5 </qti-major-increment></qti-rule-system-si></qti-rule>`,
      ),
      { _tag: "cut", item: companionItem, schemaversion: "3.0.0" },
    ],
    member: corpusMembers.testWithLti,
    name: "companion-padded",
  },
  "cut-companion": cutItem("cut-companion", "testWithLti", companionItem, "3.0.0"),
};

/**
 * The spec of an XML-path negative over a catalog or companion positive: the positive's edits,
 * then `edits`, which see its result (a spec's edits apply by kind, so the positive's cut still
 * applies last).
 *
 * @param name - The negative's name.
 * @param base - The positive it edits.
 * @param edits - The edits that make the breach.
 * @returns The spec.
 */
const catalogNegativeOver = (
  name: (typeof catalogNegativeNames)[number],
  base: (typeof catalogNames)[number] | (typeof companionNames)[number],
  edits: readonly Edit[],
): FixtureSpec => {
  const positive = { ...catalogSpecs, ...companionSpecs }[base];

  return { edits: [...positive.edits, ...edits], member: positive.member, name };
};

/**
 * The spec of an XML-path negative over `simple`, whose item gains one catalog `c1` holding
 * `cards`, named by its first paragraph.
 *
 * @param name - The negative's name.
 * @param cards - The `qti-card` elements of the catalog.
 * @param edits - Further edits, such as the files the cards name.
 * @returns The spec.
 */
const simpleCatalogNegative = (
  name: (typeof catalogNegativeNames)[number],
  cards: string,
  edits: readonly Edit[] = [],
): FixtureSpec =>
  overSimple(name, [
    ...edits,
    ...simpleWithCatalog(
      "c1",
      `<qti-catalog-info><qti-catalog id="c1">${cards}</qti-catalog></qti-catalog-info>`,
    ),
  ]);

/**
 * The edit that lists `files` in the manifest's one resource, after `images/sign.png`.
 *
 * @param files - The `href`s to list.
 * @returns The edit as plain data.
 */
const listFiles = (files: readonly string[]): TextEdit =>
  replaceIn(
    "imsmanifest.xml",
    '<file href="images/sign.png"/>',
    [
      '<file href="images/sign.png"/>',
      ...files.map((file) => `            <file href="${file}"/>`),
    ].join(CRLF),
  );

/**
 * A card holding one card file, as `simple`'s catalog negatives write it.
 *
 * @param attributes - The `qti-file-href` element's attributes, with their leading space.
 * @param href - The file's text.
 * @returns The `qti-card` element.
 */
const fileCard = (attributes: string, href: string): string =>
  `<qti-card support="sign-language"><qti-file-href${attributes}>${href}</qti-file-href></qti-card>`;

/**
 * A card of the given `support` holding html content only.
 *
 * @param support - The `support` value as written.
 * @returns The `qti-card` element.
 */
const textCard = (support: string): string =>
  `<qti-card support="${support}"><qti-html-content>Read aloud.</qti-html-content></qti-card>`;

/**
 * One rule system, `qti-rule-system-<system>`, with the minimum length 30 and the major increment
 * `1 Meter`.
 *
 * @param system - `si` or `us`.
 * @returns The element's text.
 */
const ruleOf = (system: string): string =>
  `<qti-rule-system-${system}><qti-minimum-length>30</qti-minimum-length><qti-major-increment unit="Meter">1</qti-major-increment></qti-rule-system-${system}>`;

/**
 * The specs of {@link catalogNegativeNames}. The catalog negatives that need a card the corpus
 * item lacks add it to `cut-catalog-supports`' one catalog; the file negatives are `simple` with
 * one card; the companion negatives add one material to `cut-companion`.
 *
 * - `catalog-no-id` and `catalog-id-twice` add a second catalog to the item's `qti-catalog-info`, so
 *   the one `data-catalog-idref` still names a catalog.
 * - `idref-html` names a `span`'s own `id`, `idref-missing` an `id` nothing holds.
 * - `card-file-missing` and `icon-missing` list the file in the manifest and leave it out of the
 *   package, so only the file's existence is broken; `card-file-undescribed` keeps the file in the
 *   package and out of the manifest.
 * - `card-interaction-in-modal` puts a `qti-text-entry-interaction` (with its response declaration)
 *   in the card of `catalog-hosts`' modal feedback (decision 309 A); `card-gap-outside` a `qti-gap`
 *   in a card with no gap match around it.
 * - `body-lang` is `catalog-lang` with an `xml:lang="es"` on the item body's first paragraph
 *   (decision 85).
 */
const catalogNegativeSpecs: Record<(typeof catalogNegativeNames)[number], FixtureSpec> = {
  "body-lang": catalogNegativeOver("body-lang", "catalog-lang", [
    replaceIn(
      "choice.xml",
      '<p data-catalog-idref="catalog1">Look',
      '<p xml:lang="es" data-catalog-idref="catalog1">Look',
    ),
  ]),
  "calculator-Basic": catalogNegativeOver("calculator-Basic", "cut-companion", [
    companionBefore(companionCalculator("Basic", "")),
  ]),
  "calculator-no-description": catalogNegativeOver("calculator-no-description", "cut-companion", [
    companionBefore(
      "<qti-calculator><qti-calculator-type>basic</qti-calculator-type></qti-calculator>",
    ),
  ]),
  "card-file-first": simpleCatalogNegative(
    "card-file-first",
    '<qti-card support="sign-language"><qti-file-href mime-type="image/png">images/sign.png</qti-file-href><qti-html-content>The sign.</qti-html-content></qti-card>',
  ),
  "card-file-missing": simpleCatalogNegative(
    "card-file-missing",
    fileCard(' mime-type="image/png"', "images/absent.png"),
    [listFiles(["images/absent.png"])],
  ),
  "card-file-no-type": simpleCatalogNegative("card-file-no-type", fileCard("", "images/sign.png")),
  "card-file-undescribed": simpleCatalogNegative(
    "card-file-undescribed",
    fileCard(' mime-type="image/png"', "images/unlisted.png"),
    [{ _tag: "copyFile", from: "images/sign.png", to: "images/unlisted.png" }],
  ),
  "card-gap-outside": catalogNegativeOver("card-gap-outside", "cut-catalog-supports", [
    addCatalogCard(
      '<qti-card support="spoken"><qti-html-content><p>The word <qti-gap identifier="G1"/>.</p></qti-html-content></qti-card>',
    ),
  ]),
  "card-interaction-in-modal": catalogNegativeOver("card-interaction-in-modal", "catalog-hosts", [
    replaceIn(
      bgChoiceItem,
      '<qti-outcome-declaration base-type="float"',
      '<qti-response-declaration identifier="RESPONSE2" cardinality="single" base-type="string"/><qti-outcome-declaration base-type="float"',
    ),
    replaceIn(
      bgChoiceItem,
      "<qti-html-content>Done means finished.</qti-html-content>",
      '<qti-html-content><p>Done: <qti-text-entry-interaction response-identifier="RESPONSE2"/></p></qti-html-content>',
    ),
  ]),
  "card-mixed": catalogNegativeOver("card-mixed", "cut-catalog-supports", [
    addCatalogCard(
      '<qti-card support="spoken"><qti-html-content>Read aloud.</qti-html-content><qti-card-entry xml:lang="en"><qti-html-content>Read aloud.</qti-html-content></qti-card-entry></qti-card>',
    ),
  ]),
  "catalog-empty": simpleCatalogNegative("catalog-empty", ""),
  "catalog-id-twice": catalogNegativeOver("catalog-id-twice", "cut-catalog-supports", [
    replaceIn(
      catalogSupportsItem,
      "</qti-catalog-info>",
      `<qti-catalog id="catalog1">${textCard("spoken")}</qti-catalog></qti-catalog-info>`,
    ),
  ]),
  "catalog-no-id": catalogNegativeOver("catalog-no-id", "cut-catalog-supports", [
    replaceIn(
      catalogSupportsItem,
      "</qti-catalog-info>",
      `<qti-catalog>${textCard("spoken")}</qti-catalog></qti-catalog-info>`,
    ),
  ]),
  "default-default": catalogNegativeOver("default-default", "cut-catalog-supports", [
    replaceIn(
      catalogSupportsItem,
      '<qti-card-entry xml:lang="es">',
      '<qti-card-entry xml:lang="es" default="yes">',
    ),
  ]),
  "default-twice": catalogNegativeOver("default-twice", "cut-catalog-supports", [
    replaceIn(
      catalogSupportsItem,
      '<qti-card-entry xml:lang="es">',
      '<qti-card-entry xml:lang="es" default="true">',
    ),
    replaceIn(
      catalogSupportsItem,
      '<qti-card-entry xml:lang="de">',
      '<qti-card-entry xml:lang="de" default="1">',
    ),
  ]),
  "html-twice": catalogNegativeOver("html-twice", "cut-catalog-supports", [
    addCatalogCard(
      '<qti-card support="spoken"><qti-html-content>Read aloud.</qti-html-content><qti-html-content>Read it twice.</qti-html-content></qti-card>',
    ),
  ]),
  "icon-missing": overSimple("icon-missing", [
    listFiles(["images/absent.svg"]),
    replaceIn(
      "choice.xml",
      "<qti-item-body>",
      "<qti-companion-materials-info><qti-digital-material><qti-file-href>images/sign.png</qti-file-href><qti-resource-icon>images/absent.svg</qti-resource-icon></qti-digital-material></qti-companion-materials-info><qti-item-body>",
    ),
  ]),
  "idref-html": catalogNegativeOver("idref-html", "cut-catalog-supports", [
    replaceIn(
      catalogSupportsItem,
      "accurate.</span>",
      'accurate.</span> <span id="html1" data-catalog-idref="html1">here</span>',
    ),
  ]),
  "idref-missing": catalogNegativeOver("idref-missing", "cut-catalog-supports", [
    replaceIn(
      catalogSupportsItem,
      "accurate.</span>",
      'accurate.</span> <span data-catalog-idref="nowhere">here</span>',
    ),
  ]),
  "increment-text": catalogNegativeOver("increment-text", "cut-companion", [
    companionBefore(companionRule("si", "30", "", companionIncrement("major", "Meter", "one"))),
  ]),
  "info-empty": overSimple("info-empty", [
    replaceIn("choice.xml", "</qti-item-body>", `</qti-item-body>${CRLF}    <qti-catalog-info/>`),
  ]),
  "physical-first": catalogNegativeOver("physical-first", "cut-companion", [
    companionBefore("<qti-physical-material>Scratch paper</qti-physical-material>"),
  ]),
  "rule-both-systems": catalogNegativeOver("rule-both-systems", "cut-companion", [
    companionBefore(
      `<qti-rule><qti-description>A rule of both systems</qti-description>${ruleOf("si")}${ruleOf("us")}</qti-rule>`,
    ),
  ]),
  "rule-system-SI": catalogNegativeOver("rule-system-SI", "cut-companion", [
    companionBefore(
      companionRule("si", "30", "", companionIncrement("major", "Meter", "1")).replaceAll(
        "qti-rule-system-si",
        "qti-rule-system-SI",
      ),
    ),
  ]),
  "support-case": catalogNegativeOver("support-case", "cut-catalog-supports", [
    addCatalogCard(textCard("Spoken")),
  ]),
  "support-ext-empty": catalogNegativeOver("support-ext-empty", "cut-catalog-supports", [
    addCatalogCard(textCard("ext:")),
  ]),
  "support-twice": catalogNegativeOver("support-twice", "cut-catalog-supports", [
    addCatalogCard(textCard("keyword-translation")),
  ]),
  "two-infos": catalogNegativeOver("two-infos", "cut-companion", [
    companionBefore(
      companionCalculator(
        "basic",
        `<qti-calculator-info>${companionFileInfo}</qti-calculator-info><qti-calculator-info>${companionFileInfo}</qti-calculator-info>`,
      ),
    ),
  ]),
  "unit-case": catalogNegativeOver("unit-case", "cut-companion", [
    companionBefore(companionRule("si", "30", "", companionIncrement("major", "meter", "1"))),
  ]),
};

/**
 * The edits of `test-selection-foreign`, over `test-selection`'s text edits: an `xml:lang` and one
 * `ma:ext` child, with its namespace declaration, on the first section's `qti-selection` and on
 * section C's `qti-ordering`. Both are strict attribute hosts (3.3 strict/a and strict/d): the
 * `xml:lang` is typed, the extension element foreign.
 */
const testSelectionForeignEdits: readonly Edit[] = [
  ...testSelectionTextEdits,
  replaceIn(
    "rtest12.xml",
    '<qti-selection select="2" with-replacement="true"/>',
    `<qti-selection select="2" with-replacement="true" xml:lang="en"><ma:ext xmlns:ma="${mathassessNamespace}"/></qti-selection>`,
  ),
  replaceIn(
    "rtest12.xml",
    '<qti-ordering shuffle="false"/>\n            <qti-assessment-item-ref identifier="item901"',
    `<qti-ordering shuffle="false" xml:lang="en"><ma:ext xmlns:ma="${mathassessNamespace}"/></qti-ordering>\n            <qti-assessment-item-ref identifier="item901"`,
  ),
  testSelectionLoose,
];

/**
 * The ten wildcard fixtures of phase 11 (spec W12), keyed by name.
 *
 * - `cut-custom-operator` is `SineRule-001.xml` unedited, a `qti-custom-operator` in its template
 *   processing.
 * - `operator-foreign-content` adds `xml:foo` to the operator and an `ma:extension` and an
 *   `xi:include` with a fallback after its operand. `nested-root-in-foreign` holds a
 *   `qti-response-processing` inside the extension.
 * - `fallback-3-0-1` is a 3.0.1 item with an `xi:include` fallback in its body and a custom operator
 *   with a foreign element in its response processing.
 * - Every `xi:include` target in these fixtures (`inner.xml` and `part.xml` beside
 *   `SineRule-001.xml`, `items/part.xml`) is a package entry (decision 285): the importer stores an
 *   include as written and never resolves it, and the reference census needs the target to exist.
 * - `lom-wildcard` is `extmeta` with foreign content and XLink attributes in LOM.
 * - The refusals: `operator-foreign-first` puts the foreign element before the operand,
 *   `unqualified-on-operator` an unqualified attribute on the operator, `strict-file-foreign` a
 *   foreign element in a file's `metadata`, and `qti-ns-under-operator` a `qti-foo` after the
 *   operand.
 */
const wildcardSpecs: Record<(typeof wildcardNames)[number], FixtureSpec> = {
  "cut-custom-operator": overOperator("cut-custom-operator", []),
  "fallback-3-0-1": {
    ...cutItem("fallback-3-0-1", "BPIG_22April", fallbackItem, "3.0.1"),
    edits: [...fallbackEdits, { _tag: "cut", item: fallbackItem, schemaversion: "3.0.1" }],
  },
  "lom-wildcard": overSimple("lom-wildcard", lomWildcardEdits),
  "nested-root-in-foreign": overOperator(
    "nested-root-in-foreign",
    operatorForeignEdits("<qti-response-processing/>"),
  ),
  "operator-foreign-content": overOperator("operator-foreign-content", operatorForeignEdits("")),
  "operator-foreign-first": overOperator("operator-foreign-first", [
    replaceIn(sineRuleItem, operandStart, `<ma:first/>${operandStart}`),
  ]),
  "qti-ns-under-operator": overOperator("qti-ns-under-operator", [afterOperand("<qti-foo/>")]),
  "strict-file-foreign": overSimple("strict-file-foreign", [
    replaceIn(
      "imsmanifest.xml",
      '<file href="images/sign.png"/>',
      `<file href="images/sign.png"><metadata><ma:ext xmlns:ma="${mathassessNamespace}"/></metadata></file>`,
    ),
  ]),
  "test-selection-foreign": {
    edits: testSelectionForeignEdits,
    member: `${testsDirectory}/rtest12.xml`,
    name: "test-selection-foreign",
  },
  "unqualified-on-operator": overOperator("unqualified-on-operator", [
    replaceIn(sineRuleItem, `${customOperatorStart}>`, `${customOperatorStart} foo="x">`),
  ]),
};

/**
 * The SSML namespace, which `speak` declares in an item body and the hooks of `ssml-hooks` bind
 * on the item root.
 */
const ssmlNamespace = "http://www.w3.org/2001/10/synthesis";

/**
 * The paragraph `simple`'s item body opens with, after which the SSML fixtures place their markup.
 */
const simpleOpeningParagraph = "<p>Look at the text in the picture.</p>";

/**
 * Build the edit that places markup in `simple`'s item body, after its opening paragraph.
 *
 * @param markup - The markup, ASCII like every edit.
 * @returns The edit as plain data.
 */
const afterOpeningParagraph = (markup: string): TextEdit =>
  replaceIn("choice.xml", simpleOpeningParagraph, `${simpleOpeningParagraph}${markup}`);

/**
 * Write one `speak` fragment in a paragraph, declaring the SSML namespace as `ssml` on itself.
 *
 * @param attributes - The attributes beyond the namespace declaration, `version` and `xml:lang`,
 *   each led by a space.
 * @param content - The fragment's content.
 * @returns A paragraph holding the fragment.
 */
const speakParagraph = (attributes: string, content: string): string =>
  `<p><ssml:speak xmlns:ssml="${ssmlNamespace}" version="1.1" xml:lang="en"${attributes}>${content}</ssml:speak></p>`;

/**
 * Build the edits that list languages in `simple`'s resource LOM, each as a `general.language`
 * after the title. The `document-lang` law (R26) asks every `xml:lang` form in an item, an SSML
 * `speak`'s and `lang`'s included, to be listed there, and `simple` lists none.
 *
 * @param tags - The language tags, in the order the LOM lists them.
 * @returns One edit for each, each of which must follow the one before it.
 */
const simpleLanguages = (tags: readonly string[]): readonly TextEdit[] =>
  tags.map((tag, index) => ({
    _tag: "InsertAfterLine",
    file: "imsmanifest.xml",
    line: simpleResourceTitleEnd + index,
    text: `                        <imsmd:language>${tag}</imsmd:language>`,
  }));

/**
 * Build an SSML fixture over `simple` that places one markup in the item body.
 *
 * @param name - The fixture's name.
 * @param markup - The markup placed after the item body's opening paragraph.
 * @param languages - The languages the markup's `xml:lang`s state, which the resource's LOM lists
 *   so that `document-lang` has nothing to refuse.
 * @returns The spec.
 */
const ssmlOverSimple = (
  name: string,
  markup: string,
  languages: readonly string[] = ["en"],
): FixtureSpec => overSimple(name, [...simpleLanguages(languages), afterOpeningParagraph(markup)]);

/**
 * `simple`'s first choice, which `ssml-hooks` extends with a `speak` in the default namespace.
 */
const simpleFirstChoice =
  '<qti-simple-choice identifier="ChoiceA">You must stay with your luggage at all times.</qti-simple-choice>';

/**
 * `simple`'s `xmlns:xsi` declaration, before which `ssml-hooks` binds the `ssml` prefix on the item
 * root so that its hooks need no declaration of their own.
 */
const simpleXsiDeclaration = 'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"';

/**
 * The item of `sharedStimulus` that holds the corpus's one SSML element.
 */
const ssmlCorpusItem = "exemplar06.xml";

/**
 * The reference to a stimulus that `ssml-corpus-sub` drops from {@link ssmlCorpusItem}.
 */
const ssmlCorpusStimulusRef =
  '<qti-assessment-stimulus-ref identifier="Stimulus1" href="passages/unbelievableNight.xml"/>';

/**
 * The `data-ssml` values of the `data-ssml` fixture: each member alone, all five, whitespace and
 * member order varied, an escaped member name, a repeated name and the two `rate` spellings. Each
 * is a value Data-SSML 1.0's schema admits (reading R7-a), so the importer accepts it.
 */
const dataSsmlValues = {
  all: '{"break":{"strength":"x-strong","time":"2s"},"phoneme":{"ph":"t@mA:toU","alphabet":"x-sampa","type":"default"},"prosody":{"rate":"slow"},"say-as":{"interpret-as":"ordinal"},"sub":{"alias":"World Wide Web"}}',
  break: '{"break":{"strength":"weak","time":"1s"}}',
  empty: "{}",
  escaped: '{"b\\u0072eak":{"time":"1s"}}',
  fast: '{"prosody":{"rate":"x-fast"}}',
  percent: '{"prosody":{"rate":"80%"}}',
  phoneme: '{"phoneme":{"ph":"t@mA:toU"}}',
  repeated: '{"break":{"strength":"weak"},"break":{"time":"1s"}}',
  sayAs: '{"say-as":{"interpret-as":"date"}}',
  spaced: ' \t{ "sub" : {"alias":"a"} , "break" : {"time":"1s"} }\n',
  sub: '{"sub":{"alias":"World Wide Web"}}',
} as const;

/**
 * The nine SSML and `data-ssml` positives of phase 7's stage N (spec 5.3), keyed by name. Every one
 * is accepted, so each is the package its source is with the markup in place.
 *
 * - `ssml-corpus-sub` is `sharedStimulus`'s `exemplar06.xml`, the one corpus item with SSML: an
 *   `ssml:sub` in the spoken card of its catalog, kept where the corpus has it.
 * - `ssml-hooks` binds `ssml` on the item root and places the twelve elements of the hook list in
 *   four hosts: `ssml:p`, `ssml:s`, `ssml:say-as`, `ssml:phoneme` and `ssml:sub` in a paragraph;
 *   `ssml:voice`, `ssml:emphasis`, `ssml:break` and `ssml:prosody` in a `span`; `ssml:audio` and a
 *   `ssml:mark` outside every `speak` in `qti-prompt`; and a `speak` that declares SSML as its
 *   default namespace in a `qti-simple-choice`.
 * - `ssml-speak` is a `speak` with its optional attributes, a comment and a processing instruction
 *   before its head, the head's `meta` in both forms, `metadata` and `lexicon` with every attribute
 *   and a `maxage` of `+5`, then a `w` with a bound `role`, a `lang`, a `lookup` of the lexicon, a
 *   `token` and the two marks `startmark` and `endmark` name.
 * - `ssml-voice` is a `voice` with every attribute, `voice`s with an empty `gender`, `age` and
 *   `variant` and with integers, an `audio` whose `maxage` is larger than any machine integer, an
 *   `emphasis`, a `break` and a padded `say-as`.
 * - `ssml-prosody` is a `prosody` for each value class of its attributes, `pitch="10 Hz"`, which the
 *   XSD's `.` admits, an `audio` with a `desc` and a `phoneme`.
 * - `ssml-nested` is `p > s > sub`, `s > token > say-as`, a `voice` in an `s`, an HTML `span` and a
 *   foreign element in an `s`, and `xml:space` on an `s`.
 * - `ssml-two-speaks` is two fragments that each define `mark name="a"` and name it in `startmark`,
 *   and a third whose `startmark` is `a b` beside `<mark name="a b"/>`: a mark is judged within its
 *   fragment, by its collapsed name.
 * - `data-ssml` is a `data-ssml` on a `p`, a `span`, a `div` and a `qti-rubric-block`, which declare
 *   it, holding {@link dataSsmlValues}.
 * - `data-ssml-custom` is `data-ssml="anything"` on a `li`, which does not declare it, so it is a
 *   custom `data-*` attribute with any text.
 */
const ssmlSpecs: Record<(typeof ssmlNames)[number], FixtureSpec> = {
  "data-ssml": ssmlOverSimple(
    "data-ssml",
    [
      `<p data-ssml='${dataSsmlValues.empty}'>one</p>`,
      `<p data-ssml='${dataSsmlValues.break}'>two</p>`,
      `<p data-ssml='${dataSsmlValues.phoneme}'>three</p>`,
      `<p data-ssml='${dataSsmlValues.sayAs}'>four</p>`,
      `<p data-ssml='${dataSsmlValues.sub}'>five</p>`,
      `<p data-ssml='${dataSsmlValues.all}'>six</p>`,
      `<p data-ssml='${dataSsmlValues.spaced}'>seven</p>`,
      `<p><span data-ssml='${dataSsmlValues.escaped}'>eight</span></p>`,
      `<p><span data-ssml='${dataSsmlValues.repeated}'>nine</span></p>`,
      `<div data-ssml='${dataSsmlValues.fast}'><p>ten</p></div>`,
      `<div data-ssml='${dataSsmlValues.percent}'><p>eleven</p></div>`,
      `<qti-rubric-block use="instructions" view="candidate" data-ssml='${dataSsmlValues.break}'><qti-content-body><p>twelve</p></qti-content-body></qti-rubric-block>`,
    ].join(""),
  ),
  "data-ssml-custom": ssmlOverSimple(
    "data-ssml-custom",
    '<ul><li data-ssml="anything">one</li><li data-ssml=\'{"not":"data-ssml"}\'>two</li></ul>',
  ),
  "ssml-corpus-sub": {
    ...cutItem("ssml-corpus-sub", "sharedStimulus", ssmlCorpusItem, "3.0.0"),
    edits: [
      // The item names a stimulus the cut does not keep, which `file-exists` and
      // `stimulus-ref-target` refuse, so the reference goes and the item keeps its body and its
      // catalog, where the corpus's `ssml:sub` stands.
      replaceIn(ssmlCorpusItem, ssmlCorpusStimulusRef, ""),
      { _tag: "cut", item: ssmlCorpusItem, schemaversion: "3.0.0" },
    ],
  },
  "ssml-hooks": overSimple("ssml-hooks", [
    ...simpleLanguages(["en"]),
    replaceIn(
      "choice.xml",
      simpleXsiDeclaration,
      `xmlns:ssml="${ssmlNamespace}" ${simpleXsiDeclaration}`,
    ),
    afterOpeningParagraph(
      [
        "<p>",
        "<ssml:p>a paragraph</ssml:p>",
        "<ssml:s>a sentence</ssml:s>",
        '<ssml:say-as interpret-as="characters">UK</ssml:say-as>',
        '<ssml:phoneme ph="t@mA:toU" alphabet="x-sampa">tomato</ssml:phoneme>',
        '<ssml:sub alias="World Wide Web">WWW</ssml:sub>',
        "</p>",
        "<p><span>",
        '<ssml:voice gender="female">a voice</ssml:voice>',
        '<ssml:emphasis level="strong">stress</ssml:emphasis>',
        '<ssml:break strength="weak"/>',
        '<ssml:prosody rate="slow">slowly</ssml:prosody>',
        "</span></p>",
      ].join(""),
    ),
    replaceIn(
      "choice.xml",
      prompt,
      '<qti-prompt>What does it say? <ssml:audio src="https://example.org/a.mp3">a sound</ssml:audio><ssml:mark name="free"/></qti-prompt>',
    ),
    replaceIn(
      "choice.xml",
      simpleFirstChoice,
      `<qti-simple-choice identifier="ChoiceA">You must stay with your luggage at all times.<speak xmlns="${ssmlNamespace}" version="1.1" xml:lang="en"><p><s>Stay.</s></p></speak></qti-simple-choice>`,
    ),
  ]),
  "ssml-nested": ssmlOverSimple(
    "ssml-nested",
    speakParagraph(
      "",
      [
        '<ssml:p><ssml:s>The <ssml:sub alias="World Wide Web">WWW</ssml:sub> is big.</ssml:s></ssml:p>',
        '<ssml:s><ssml:token><ssml:say-as interpret-as="cardinal">12</ssml:say-as></ssml:token> <span>html</span>',
        `<ma:extension xmlns:ma="${mathassessNamespace}"/></ssml:s>`,
        '<ssml:s><ssml:voice gender="male">a voice</ssml:voice></ssml:s>',
        '<ssml:s xml:space="preserve">  kept  </ssml:s>',
      ].join(""),
    ),
  ),
  "ssml-prosody": ssmlOverSimple(
    "ssml-prosody",
    speakParagraph(
      "",
      [
        '<ssml:prosody pitch="x-high">a</ssml:prosody>',
        '<ssml:prosody pitch="200Hz" range="+10Hz">b</ssml:prosody>',
        '<ssml:prosody pitch="10 Hz">c</ssml:prosody>',
        '<ssml:prosody pitch="-5%" range="+2st">d</ssml:prosody>',
        '<ssml:prosody contour="(0%,+20Hz) (50%,-10st) (100%,medium)">e</ssml:prosody>',
        '<ssml:prosody rate="1.5" duration="2s">f</ssml:prosody>',
        '<ssml:prosody rate="80%" volume="+6dB">g</ssml:prosody>',
        '<ssml:prosody rate="fast" volume="soft">h</ssml:prosody>',
        '<ssml:audio src="https://example.org/a.mp3"><ssml:desc xml:lang="en">a sound</ssml:desc>fallback</ssml:audio>',
        '<ssml:phoneme alphabet="ipa" ph="tomato" type="ruby">tomato</ssml:phoneme>',
      ].join(""),
    ),
  ),
  "ssml-speak": ssmlOverSimple(
    "ssml-speak",
    speakParagraph(
      ' xml:base="https://example.org/speech/" onlangfailure="ignorelang" startmark="s" endmark="e"',
      [
        "<!-- a comment --><?pi data?>",
        '<ssml:meta name="seeAlso" content="x"/>',
        '<ssml:meta http-equiv="Cache-Control" content="no-cache"/>',
        "<ssml:metadata/>",
        '<ssml:lexicon uri="https://example.org/lexicon.pls" xml:id="L" type="application/pls+xml" fetchtimeout="5s" maxage="+5" maxstale="3"/>',
        '<ssml:mark name="s"/>',
        '<ssml:w role="ssml:noun">word</ssml:w>',
        '<ssml:lang xml:lang="fr">oui</ssml:lang>',
        '<ssml:lookup ref="L">looked up</ssml:lookup>',
        "<ssml:token>token</ssml:token>",
        '<ssml:mark name="e"/>',
      ].join(""),
    ),
    ["en", "fr"],
  ),
  "ssml-two-speaks": ssmlOverSimple(
    "ssml-two-speaks",
    [
      speakParagraph(' startmark="a"', '<ssml:mark name="a"/>one'),
      speakParagraph(' startmark="a"', '<ssml:mark name="a"/>two'),
      speakParagraph(' startmark="a  b"', '<ssml:mark name="a b"/>three'),
    ].join(""),
  ),
  "ssml-voice": ssmlOverSimple(
    "ssml-voice",
    speakParagraph(
      "",
      [
        '<ssml:voice xml:lang="en" gender="female" age="30" variant="2" name="alice" languages="en-US" required="gender" ordering="gender age" onvoicefailure="keepexisting">a</ssml:voice>',
        '<ssml:voice gender="">b</ssml:voice>',
        '<ssml:voice age="">c</ssml:voice>',
        '<ssml:voice variant="">d</ssml:voice>',
        '<ssml:voice age="7" variant="12">e</ssml:voice>',
        '<ssml:audio src="https://example.org/a.mp3" maxage="99999999999999999999">f</ssml:audio>',
        '<ssml:emphasis level="reduced">g</ssml:emphasis>',
        '<ssml:break time="500ms" strength="medium"/>',
        '<ssml:say-as interpret-as=" date " format=" mdy " detail=" 1 ">h</ssml:say-as>',
      ].join(""),
    ),
  ),
};

/**
 * The tarball member of `pci_simple_example`, the corpus package of one item whose PCI names its
 * module by the `module` attribute. It is written out here because {@link zipMembers} is defined
 * after the specs that read it.
 */
const pciSimpleMember = "qtiv3-examples/packaging/pci-simple/pci_simple_example.zip";

/**
 * The tarball member of `pci_item_examples`, the corpus package of four items with PCIs and the
 * modules and configuration files they name.
 */
const pciItemsMember = "qtiv3-examples/packaging/pci/pci_item_examples.zip";

/**
 * The item of `pci_simple_example`, whose text the hand-written PCI positives replace.
 */
const pciSimpleItem = "measuring_ph.xml";

/**
 * Write the item of a hand-written PCI positive, in the corpus items' form.
 *
 * @param version - The version the item's schema location names.
 * @param declarations - The item's declarations, as written.
 * @param body - The content of the item body, as written.
 * @returns The item's text.
 */
const pciItemText = (
  version: CutEdit["schemaversion"],
  declarations: string,
  body: string,
): string =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
    `  xsi:schemaLocation="http://www.imsglobal.org/xsd/imsqtiasi_v3p0 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/${version === "3.0.0" ? "imsqti_asiv3p0_v1p0.xsd" : "imsqti_asiv3p0p1_v1p0.xsd"}"`,
    '  identifier="pci-item" title="A PCI" adaptive="false" time-dependent="false">',
    declarations,
    `  <qti-item-body>${body}</qti-item-body>`,
    "</qti-assessment-item>",
    "",
  ].join("\n");

/**
 * The spec of a hand-written PCI positive: `pci_simple_example` with its item replaced by one the
 * given declarations and body make, and its manifest at `version`.
 *
 * @param name - The fixture's name.
 * @param version - The version the manifest and the item declare.
 * @param declarations - The item's declarations, as written.
 * @param body - The content of the item body, as written.
 * @param files - Files to add to the package, each listed in the manifest after the corpus's own.
 * @returns The spec.
 */
const overPciSimple = (
  name: (typeof pciNames)[number] | (typeof pciNegativeNames)[number],
  version: CutEdit["schemaversion"],
  declarations: string,
  body: string,
  files: Readonly<Record<string, string>> = {},
): FixtureSpec => ({
  edits: [
    {
      _tag: "addFile",
      path: pciSimpleItem,
      source: { text: pciItemText(version, declarations, body) },
    },
    ...Object.entries(files).map(([file, text]): Edit => ({
      _tag: "addFile",
      path: file,
      source: { text },
    })),
    ...(version === "3.0.0"
      ? []
      : [
          replaceIn(
            "imsmanifest.xml",
            "<schemaversion>3.0.0</schemaversion>",
            "<schemaversion>3.0.1</schemaversion>",
          ),
        ]),
    ...Object.keys(files).map((file) =>
      replaceIn(
        "imsmanifest.xml",
        '<file href="vinegar.svg" />',
        `<file href="vinegar.svg" />\n            <file href="${file}" />`,
      ),
    ),
  ],
  member: pciSimpleMember,
  name,
});

/**
 * The attribute that gives the hand-written PCIs their type.
 */
const pciTypeAttribute = 'custom-interaction-type-identifier="urn-fdc-hmhco.com-pci-tapToReveal"';

/**
 * A PCI of the hand-written items with the given start-tag attributes, as written, for the
 * negatives that break the tag itself.
 *
 * @param attributes - The attributes of the start tag.
 * @param children - The PCI's children, as written.
 * @returns The element's text.
 */
const pciElement = (attributes: string, children: string): string =>
  `<qti-portable-custom-interaction ${attributes}>${children}</qti-portable-custom-interaction>`;

/**
 * A PCI of the hand-written items: bound to `response`, naming the module `tap` that the package
 * holds, with the given children.
 *
 * @param response - The response the PCI binds.
 * @param children - The PCI's children, as written.
 * @returns The element's text.
 */
const pciOf = (response: string, children: string): string =>
  pciElement(`response-identifier="${response}" module="tap" ${pciTypeAttribute}`, children);

/**
 * The declaration of an integer response `RESPONSE`, and of the `SCORE` outcome.
 */
const pciScored =
  '<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="integer"/><qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>';

/**
 * The file edits that keep only `kept` of `pci_item_examples`: every other file of the package is
 * deleted, and a manifest of one item resource and one `webcontent` resource of the module and
 * configuration files takes the corpus manifest's place.
 *
 * @param name - The fixture's name, which names the manifest.
 * @param item - The item the package keeps.
 * @param modules - The module and configuration files it keeps, listed in one resource.
 * @returns The edits, deletions first.
 */
const pciItemsKept = (name: string, item: string, modules: readonly string[]): readonly Edit[] => [
  ...[
    "ammonia.svg",
    "baking_soda.svg",
    "fractions1.xml",
    "fractions_deps.xml",
    "fractions_deps_2.xml",
    "measuring_ph.xml",
    "modules/hmh_co_com.js",
    "modules/hmh_co_com_fallback.json",
    "modules/lib/eve.js",
    "modules/lib/handlebars.min-latest.js",
    "modules/lib/jquery-2.2.2.min.js",
    "modules/module_resolution.js",
    "modules/shading.js",
    "modules/shading_deps.js",
    "modules/tap.js",
    "vinegar.svg",
  ]
    .filter((file) => file !== item && !modules.includes(file))
    .map((file): Edit => ({ _tag: "deleteFile", path: file })),
  {
    _tag: "addFile",
    path: "imsmanifest.xml",
    source: {
      text: manifestText(name, "3.0.0", [
        { files: [item], href: item, identifier: `${name}-item`, type: "imsqti_item_xmlv3p0" },
        {
          files: modules,
          href: modules[0] ?? item,
          identifier: `${name}-modules`,
          type: "webcontent",
        },
      ]),
    },
  },
];

/**
 * The edit that drops the custom `data-*` attributes of a corpus PCI's opening tag.
 *
 * @param file - The item the tag is in.
 * @param kept - The tag's lines up to the last attribute that stays, the first line the element's
 *   name.
 * @param data - The lines that carry the `data-*` attributes and the tag's end.
 * @param replacementKept - The lines that take `kept`'s place, when the edit changes them too.
 * @returns The edit as plain data.
 */
const withoutData = (
  file: string,
  kept: readonly string[],
  data: readonly string[],
  replacementKept: readonly string[] = kept,
): TextEdit => replaceIn(file, [...kept, ...data].join("\n"), `${replacementKept.join("\n")}>`);

/**
 * The lines of `fractions_deps.xml`'s two PCIs that `pci-modules` keeps and drops.
 */
const depsFirstKept = [
  '<qti-portable-custom-interaction custom-interaction-type-identifier="urn:fdc:hmhco.com:2019:pci:shading_deps"',
  '        response-identifier="EXAMPLE"',
] as const;

const depsFirstData = [
  '        data-controls="none" data-render="grid" data-selected="0.0,1.0" data-selected_color="green"',
  '        data-unselected_color="white" data-dimension1_initial="3" data-dimension2_initial="2" ',
  '        data-element_diameter="60" data-value="numShaded" data-active="0">',
] as const;

const depsSecondKept = [
  '<qti-portable-custom-interaction custom-interaction-type-identifier="urn:fdc:hmhco.com:2019:pci:shading_deps"',
  '        response-identifier="RESPONSE"',
] as const;

const depsSecondData = [
  '        data-controls="full" data-render="grid" data-selected_color="green"',
  '        data-unselected_color="white" data-dimension1_initial="2" data-dimension2_initial="2" ',
  '        data-element_diameter="60" data-value="numShaded" >',
] as const;

/**
 * The lines of `fractions_deps_2.xml`'s two PCIs that `pci-configurations` keeps and drops.
 */
const configurationsFirstKept = [
  '<qti-portable-custom-interaction custom-interaction-type-identifier="urn:fdc:hmhco.com:2019:pci:shading"',
  '        response-identifier="EXAMPLE"',
] as const;

const configurationsFirstData = [
  '        data-controls="none" data-render="grid" data-selected="0.0,1.0" data-selected_color="blue"',
  '        data-unselected_color="white" data-dimension1_initial="3" data-dimension2_initial="2" ',
  '        data-element_diameter="60" data-value="numShaded" data-active="0">',
] as const;

const configurationsSecondKept = [
  '<qti-portable-custom-interaction custom-interaction-type-identifier="urn:fdc:hmhco.com:2019:pci:shading" ',
  '        module="shadingD"',
  '        response-identifier="RESPONSE"',
] as const;

const configurationsSecondData = [
  '        data-controls="full" data-render="grid" data-selected_color="blue"',
  '        data-unselected_color="white" data-dimension1_initial="2" data-dimension2_initial="2" ',
  '        data-element_diameter="60" data-value="numShaded" >',
] as const;

/**
 * The edits that make the two correct responses of a `fractions_deps` item valid: the corpus writes
 * the `identifier` values `1` and `6`, which the identifier type refuses (it starts with no digit),
 * so a positive writes `N1` and `N6`, keeping the base type.
 *
 * @param file - The item, `fractions_deps.xml` or `fractions_deps_2.xml`.
 * @returns The two edits.
 */
const validCorrectResponses = (file: string): readonly TextEdit[] => [
  replaceIn(file, "<qti-value>1</qti-value>", "<qti-value>N1</qti-value>"),
  replaceIn(file, "<qti-value>6</qti-value>", "<qti-value>N6</qti-value>"),
];

/**
 * The edits of `pci-configurations`: `fractions_deps_2.xml` with its corpus PCIs' custom `data-*`
 * dropped, the first PCI given both module forms and the corpus's misspelt `XX` paths repaired,
 * the configuration attributes of its `qti-interaction-modules` written as `configurations`, and
 * its two `identifier` correct responses, which the corpus writes `1` and `6` and the identifier
 * type refuses, written `N1` and `N6` ({@link validCorrectResponses}).
 *
 * @param configurations - The attributes of the `qti-interaction-modules` start tag, as written.
 * @returns The edits, in the order the positive applies them.
 */
const pciConfigurationsEdits = (configurations: string): readonly Edit[] => [
  ...pciItemsKept("pci-configurations", "fractions_deps_2.xml", [
    "modules/hmh_co_com.js",
    "modules/hmh_co_com_fallback.json",
    "modules/shading_deps.js",
    "modules/lib/eve.js",
    "modules/lib/jquery-2.2.2.min.js",
  ]),
  withoutData("fractions_deps_2.xml", configurationsFirstKept, configurationsFirstData, [
    configurationsFirstKept[0],
    '        module="shadingD"',
    configurationsFirstKept[1],
  ]),
  withoutData("fractions_deps_2.xml", configurationsSecondKept, configurationsSecondData),
  replaceIn(
    "fractions_deps_2.xml",
    "the primary-configuration URL is deliberately incorrect to \n            demonstrate the use of fallback-configuration -->",
    "the primary-configuration and the secondary-configuration are files this package holds -->",
  ),
  replaceIn(
    "fractions_deps_2.xml",
    '<qti-interaction-modules primary-configuration="modules/hmh_co_comXX.js" fallback-configuration="modules/hmh_co_com.js">',
    `<qti-interaction-modules ${configurations}>`,
  ),
  replaceIn(
    "fractions_deps_2.xml",
    '<qti-interaction-module id="raphael"/>',
    '<qti-interaction-module id="raphael" fallback-path="modules/lib/raphael.js"/>',
  ),
  ...validCorrectResponses("fractions_deps_2.xml"),
];

/**
 * The attributes of `pci-configurations`' `qti-interaction-modules`: both configurations are files
 * the package holds and lists.
 */
const pciConfigurationFiles =
  'primary-configuration="modules/hmh_co_com.js" secondary-configuration="modules/hmh_co_com_fallback.json"';

/**
 * The edits of `pci-modules`: `fractions_deps.xml` with its corpus PCIs' custom `data-*` dropped,
 * in a package of the three module files it keeps, the handlebars file listed and `raphael.js`
 * absent, and its two `identifier` correct responses, which the corpus writes `1` and `6` and the
 * identifier type refuses, written `N1` and `N6` ({@link validCorrectResponses}).
 */
const pciModulesEdits: readonly Edit[] = [
  ...pciItemsKept("pci-modules", "fractions_deps.xml", [
    "modules/shading_deps.js",
    "modules/lib/eve.js",
    "modules/lib/handlebars.min-latest.js",
  ]),
  withoutData("fractions_deps.xml", depsFirstKept, depsFirstData),
  withoutData("fractions_deps.xml", depsSecondKept, depsSecondData),
  ...validCorrectResponses("fractions_deps.xml"),
];

/**
 * The specs of {@link pciNames}.
 */
const pciSpecs: Record<(typeof pciNames)[number], FixtureSpec> = {
  "custom-3-0-1": overPciSimple(
    "custom-3-0-1",
    "3.0.1",
    '<qti-response-declaration identifier="RESPONSE" cardinality="record"/>',
    '<div><qti-custom-interaction response-identifier="RESPONSE"/></div>',
  ),
  "pci-3-0-1": overPciSimple(
    "pci-3-0-1",
    "3.0.1",
    pciScored,
    pciOf(
      "RESPONSE",
      '<qti-interaction-markup><p>Tap</p></qti-interaction-markup><qti-context-variable identifier="QTI_CONTEXT"/><qti-stylesheet href="pci.css" type="text/css"/>',
    ),
    { "pci.css": "p { color: green; }\n" },
  ),
  "pci-catalog-3-0-1": overPciSimple(
    "pci-catalog-3-0-1",
    "3.0.1",
    pciScored,
    pciOf(
      "RESPONSE",
      '<qti-interaction-markup><p data-catalog-idref="tap-help">Tap</p></qti-interaction-markup><qti-catalog-info><qti-catalog id="tap-help"><qti-card support="linguistic-guidance"><qti-html-content><p>To tap is to touch lightly.</p></qti-html-content></qti-card></qti-catalog></qti-catalog-info>',
    ),
  ),
  "pci-configurations": {
    edits: pciConfigurationsEdits(pciConfigurationFiles),
    member: pciItemsMember,
    name: "pci-configurations",
  },
  "pci-context-3-0-1": overPciSimple(
    "pci-context-3-0-1",
    "3.0.1",
    `<qti-context-declaration identifier="QTI_CONTEXT" cardinality="record"/><qti-context-declaration identifier="LEVEL" cardinality="single" base-type="integer"/>${pciScored}`,
    pciOf(
      "RESPONSE",
      '<qti-interaction-markup><p>Tap</p></qti-interaction-markup><qti-context-variable identifier="QTI_CONTEXT"/><qti-context-variable identifier="LEVEL"/>',
    ),
  ),
  "pci-markup-content": overPciSimple(
    "pci-markup-content",
    "3.0.0",
    `${pciScored}<qti-outcome-declaration identifier="FEEDBACK" cardinality="single" base-type="identifier"/>${templateDeclaration}`,
    pciOf(
      "RESPONSE",
      '<qti-interaction-markup><p>Score <qti-printed-variable identifier="SCORE"/></p><qti-feedback-block outcome-identifier="FEEDBACK" identifier="fb" show-hide="show"><qti-content-body><p>Shown</p></qti-content-body></qti-feedback-block><p>See <qti-feedback-inline outcome-identifier="FEEDBACK" identifier="fi" show-hide="show">this</qti-feedback-inline></p><qti-template-block template-identifier="T" identifier="tb" show-hide="show"><qti-content-body><p>Block</p></qti-content-body></qti-template-block><p><qti-template-inline template-identifier="T" identifier="ti" show-hide="show">inline</qti-template-inline></p><template/><template/></qti-interaction-markup>',
    ),
  ),
  "pci-modules": {
    edits: pciModulesEdits,
    member: pciItemsMember,
    name: "pci-modules",
  },
  "pci-simple": {
    edits: [
      replaceIn(
        pciSimpleItem,
        '            data-toggle="true" data-tap-message="Tap to reveal the color of the solution"\n',
        "",
      ),
    ],
    member: pciSimpleMember,
    name: "pci-simple",
  },
  "pci-variables": overPciSimple(
    "pci-variables",
    "3.0.0",
    `<qti-context-declaration identifier="CTX" cardinality="single" base-type="integer"/><qti-response-declaration identifier="RECORD" cardinality="record"/><qti-response-declaration identifier="PICKED" cardinality="multiple" base-type="identifier"/><qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>${templateDeclaration}`,
    `${pciOf(
      "RECORD",
      '<qti-prompt><p>Tap</p></qti-prompt><qti-interaction-markup><p>Tap</p></qti-interaction-markup><qti-template-variable template-identifier="T"/><qti-context-variable identifier="CTX"/>',
    )}${pciOf("PICKED", "<qti-interaction-markup><p>Pick</p></qti-interaction-markup>")}`,
  ),
  "template-foreign": overPciSimple(
    "template-foreign",
    "3.0.0",
    pciScored,
    pciOf(
      "RESPONSE",
      '<qti-interaction-markup><p>Tap</p><template><x:widget xmlns:x="urn:example:widget" size="3"/></template></qti-interaction-markup>',
    ),
  ),
};

/**
 * The markup of the hand-written PCI negatives: one paragraph.
 */
const pciMarkup = "<qti-interaction-markup><p>Tap</p></qti-interaction-markup>";

/**
 * The module element of the hand-written PCI negatives: the `tap` module the package holds.
 */
const pciModuleTap =
  '<qti-interaction-modules><qti-interaction-module id="tap" primary-path="modules/tap.js"/></qti-interaction-modules>';

/**
 * The catalog of `pci-catalog-3-0-1`, which `pci-catalog-info-3-0-0` writes at 3.0.0.
 */
const pciCatalogInfo =
  '<qti-catalog-info><qti-catalog id="tap-help"><qti-card support="linguistic-guidance"><qti-html-content><p>To tap is to touch lightly.</p></qti-html-content></qti-card></qti-catalog></qti-catalog-info>';

/**
 * The specs of {@link pciNegativeNames}. Each is a hand-written positive of {@link pciNames} or a
 * cut of `pci_item_examples` with the one defect its name says.
 */
const pciNegativeSpecs: Record<(typeof pciNegativeNames)[number], FixtureSpec> = {
  "custom-3-0-0": overPciSimple(
    "custom-3-0-0",
    "3.0.0",
    '<qti-response-declaration identifier="RESPONSE" cardinality="record"/>',
    '<div><qti-custom-interaction response-identifier="RESPONSE"/></div>',
  ),
  "custom-attribute": overPciSimple(
    "custom-attribute",
    "3.0.1",
    '<qti-response-declaration identifier="RESPONSE" cardinality="record"/>',
    '<div><qti-custom-interaction response-identifier="RESPONSE" xmlns:x="urn:example:widget" x:mode="draw"/></div>',
  ),
  "pci-catalog-info-3-0-0": overPciSimple(
    "pci-catalog-info-3-0-0",
    "3.0.0",
    pciScored,
    pciOf("RESPONSE", `${pciMarkup}${pciCatalogInfo}`),
  ),
  "pci-configuration-missing": {
    edits: pciConfigurationsEdits(
      'primary-configuration="modules/hmh_co_comXX.js" secondary-configuration="modules/hmh_co_com_fallback.json"',
    ),
    member: pciItemsMember,
    name: "pci-configuration-missing",
  },
  "pci-context-builtin-3-0-0": overPciSimple(
    "pci-context-builtin-3-0-0",
    "3.0.0",
    pciScored,
    pciOf("RESPONSE", `${pciMarkup}<qti-context-variable identifier="QTI_CONTEXT"/>`),
  ),
  "pci-context-undeclared": overPciSimple(
    "pci-context-undeclared",
    "3.0.0",
    pciScored,
    pciOf("RESPONSE", `${pciMarkup}<qti-context-variable identifier="CTX"/>`),
  ),
  "pci-context-undeclared-3-0-1": overPciSimple(
    "pci-context-undeclared-3-0-1",
    "3.0.1",
    `<qti-context-declaration identifier="QTI_CONTEXT" cardinality="record"/>${pciScored}`,
    pciOf(
      "RESPONSE",
      `${pciMarkup}<qti-context-variable identifier="QTI_CONTEXT"/><qti-context-variable identifier="LEVEL"/>`,
    ),
  ),
  "pci-items-fallback": {
    edits: pciConfigurationsEdits(
      'primary-configuration="modules/hmh_co_com.js" fallback-configuration="modules/hmh_co_com_fallback.json"',
    ),
    member: pciItemsMember,
    name: "pci-items-fallback",
  },
  "pci-items-missing": {
    edits: [
      ...pciModulesEdits,
      replaceIn(
        "imsmanifest.xml",
        '      <file href="modules/lib/eve.js"/>\n',
        '      <file href="modules/lib/eve.js"/>\n      <file href="modules/lib/raphael.js"/>\n',
      ),
    ],
    member: pciItemsMember,
    name: "pci-items-missing",
  },
  "pci-items-unlisted": {
    edits: [
      ...pciModulesEdits,
      replaceIn(
        "imsmanifest.xml",
        '      <file href="modules/lib/handlebars.min-latest.js"/>\n',
        "",
      ),
    ],
    member: pciItemsMember,
    name: "pci-items-unlisted",
  },
  "pci-markup-order": overPciSimple(
    "pci-markup-order",
    "3.0.0",
    `${pciScored}${templateDeclaration}`,
    pciOf("RESPONSE", `<qti-template-variable template-identifier="T"/>${pciMarkup}`),
  ),
  "pci-markup-text": overPciSimple(
    "pci-markup-text",
    "3.0.0",
    pciScored,
    pciOf("RESPONSE", "<qti-interaction-markup>Tap</qti-interaction-markup>"),
  ),
  "pci-module-id-malformed": overPciSimple(
    "pci-module-id-malformed",
    "3.0.0",
    pciScored,
    pciOf(
      "RESPONSE",
      `<qti-interaction-modules><qti-interaction-module id="1shading" primary-path="modules/tap.js"/></qti-interaction-modules>${pciMarkup}`,
    ),
  ),
  "pci-module-malformed": overPciSimple(
    "pci-module-malformed",
    "3.0.0",
    pciScored,
    pciElement(`response-identifier="RESPONSE" module="1shading" ${pciTypeAttribute}`, pciMarkup),
  ),
  "pci-modules-after-markup": overPciSimple(
    "pci-modules-after-markup",
    "3.0.0",
    pciScored,
    pciOf("RESPONSE", `${pciMarkup}${pciModuleTap}`),
  ),
  "pci-modules-empty": overPciSimple(
    "pci-modules-empty",
    "3.0.0",
    pciScored,
    pciOf("RESPONSE", `<qti-interaction-modules/>${pciMarkup}`),
  ),
  "pci-nested": overPciSimple(
    "pci-nested",
    "3.0.0",
    `<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="integer"/><qti-response-declaration identifier="INNER" cardinality="single" base-type="integer"/><qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/><qti-outcome-declaration identifier="FEEDBACK" cardinality="single" base-type="identifier"/>`,
    pciOf(
      "RESPONSE",
      `<qti-interaction-markup><qti-feedback-block outcome-identifier="FEEDBACK" identifier="fb" show-hide="show"><qti-content-body>${pciOf("INNER", pciMarkup)}</qti-content-body></qti-feedback-block></qti-interaction-markup>`,
    ),
  ),
  "pci-no-markup": overPciSimple("pci-no-markup", "3.0.0", pciScored, pciOf("RESPONSE", "")),
  "pci-no-module": overPciSimple(
    "pci-no-module",
    "3.0.0",
    pciScored,
    pciElement(`response-identifier="RESPONSE" ${pciTypeAttribute}`, pciMarkup),
  ),
  "pci-no-type": overPciSimple(
    "pci-no-type",
    "3.0.0",
    pciScored,
    pciElement('response-identifier="RESPONSE" module="tap"', pciMarkup),
  ),
  "pci-path-malformed": overPciSimple(
    "pci-path-malformed",
    "3.0.0",
    pciScored,
    pciOf(
      "RESPONSE",
      `<qti-interaction-modules><qti-interaction-module id="tap" primary-path="modules/ta%zzp.js"/></qti-interaction-modules>${pciMarkup}`,
    ),
  ),
  "pci-prompt-late": overPciSimple(
    "pci-prompt-late",
    "3.0.0",
    pciScored,
    pciOf("RESPONSE", `${pciMarkup}<qti-prompt><p>Tap</p></qti-prompt>`),
  ),
  "pci-stylesheet-3-0-0": overPciSimple(
    "pci-stylesheet-3-0-0",
    "3.0.0",
    pciScored,
    pciOf("RESPONSE", `${pciMarkup}<qti-stylesheet href="pci.css" type="text/css"/>`),
    { "pci.css": "p { color: green; }\n" },
  ),
  "pci-template-undeclared": overPciSimple(
    "pci-template-undeclared",
    "3.0.0",
    pciScored,
    pciOf("RESPONSE", `${pciMarkup}<qti-template-variable template-identifier="T"/>`),
  ),
  "pci-two-markups": overPciSimple(
    "pci-two-markups",
    "3.0.0",
    pciScored,
    pciOf("RESPONSE", `${pciMarkup}${pciMarkup}`),
  ),
  "pci-two-modules": overPciSimple(
    "pci-two-modules",
    "3.0.0",
    pciScored,
    pciOf("RESPONSE", `${pciModuleTap}${pciModuleTap}${pciMarkup}`),
  ),
  "pci-type-malformed": overPciSimple(
    "pci-type-malformed",
    "3.0.0",
    pciScored,
    pciElement(
      'response-identifier="RESPONSE" module="tap" custom-interaction-type-identifier="a%zz"',
      pciMarkup,
    ),
  ),
  "template-outside": overPciSimple(
    "template-outside",
    "3.0.0",
    pciScored,
    pciOf("RESPONSE", `${pciMarkup}<template/>`),
  ),
};

/**
 * The edits of `doctype`: a document type declaration with a general entity, `org`, and an
 * `ATTLIST` default for `adaptive`, the attribute dropped from the root, and a reference to the
 * entity in the prompt. `data-entity` extends them.
 */
const doctypeEdits: readonly Edit[] = [
  {
    _tag: "InsertAfterLine",
    file: "choice.xml",
    line: 1,
    text: '<!DOCTYPE qti-assessment-item [<!ENTITY org "1EdTech &amp; friends"><!ATTLIST qti-assessment-item adaptive CDATA "false">]>',
  },
  replaceIn("choice.xml", ' adaptive="false"', ""),
  replaceIn("choice.xml", prompt, "<qti-prompt>What does it say? &org;</qti-prompt>"),
];

/**
 * `data_dash.xml` of `BPIG_22April`, the corpus's item with `data-*` attributes at 3.0.1.
 */
const dataDashItem = "items/data_dash.xml";

/**
 * `data-attributes.xml` of the corpus's `items.zip`, the corpus's item with `data-*` attributes at
 * 3.0.0.
 */
const dataAttributesItem = "data-attributes.xml";

/**
 * A `data-` name with `é` in it, which a latin1 edit writes as the two bytes of its UTF-8 form:
 * the escapes are `Ã` and `©`, the latin1 reading of U+00E9's bytes `C3 A9`.
 */
const dataAcute = "data-Ã©";

/**
 * The paragraph `data-custom` puts in `simple`'s item body, after the first, which holds the
 * names and values the class has to read: digits, `_`, `.` and `-` in names; and values that are
 * empty, that hold `<`, `&`, `"`, a tab and a line feed as character data, outer spaces and a
 * non-ASCII letter (the bytes of `é`, as {@link dataAcute}).
 */
const dataCustomValues = [
  '<p data-empty="" data-lt="a&lt;b" data-amp="a&amp;b" data-quot=\'say "x"\' data-quot-ref="say &quot;x&quot;"',
  ' data-tab="a&#9;b" data-newline="a&#10;b" data-padded="  x  " data-acute="cafÃ©"',
  ' data-n1="1" data-a_b="2" data-a.b="3" data-a-b="4" data-9="5" data-_="6">values</p>',
].join("");

/**
 * Ten names on one element, `data-k0` to `data-k9`.
 */
const dataTen = `<p ${Array.from({ length: 10 }, (_, index) => `data-k${String(index)}="${String(index)}"`).join(" ")}>ten</p>`;

/**
 * The eight `data-*` fixtures of phase 8's stage N (spec 5.3), keyed by name.
 *
 * - `cut-data-dash` is `BPIG_22April`'s `data_dash.xml`, cut: three custom names on a
 *   `qti-hottext-interaction`.
 * - `cut-data-attributes` is `items.zip`'s `data-attributes.xml`, cut: the same names on the
 *   `qti-hottext`s of its interaction. The item's `qti-rubric-block` has no `use`, which
 *   `rubric-block-use` refuses, so the edit adds `use="instructions"` (the rule the cut would
 *   otherwise break).
 * - `data-custom` is `simple` with custom names on the root (`data-qti-suppress-tts`, which no
 *   element declares), `p`, `img`, `qti-choice-interaction`, `qti-prompt` and `qti-simple-choice`;
 *   `data-prompt` on `p` and `data-ssml` on a `li`, declared names where an element declares them
 *   and custom where it does not; ten names on one element; and {@link dataCustomValues}.
 * - `data-entity` is `doctype` with `data-org="&org;"` on the prompt, the entity declared in the
 *   internal subset.
 * - `data-non-ascii` is `data-é="x"` on a `p`, a name with a non-ASCII letter, which the information
 *   model's pattern bars (reading 13).
 * - `data-uppercase` is `data-Group="g"` on `qti-choice-interaction`, `data-bare-prefix` is
 *   `data-="x"` on a `p`, and `data-item-body` is `data-x="1"` on `qti-item-body`.
 */
const dataSpecs: Record<(typeof dataNames)[number], FixtureSpec> = {
  "cut-data-attributes": {
    ...cutItem("cut-data-attributes", "items", dataAttributesItem, "3.0.0"),
    edits: [
      replaceIn(
        dataAttributesItem,
        '<qti-rubric-block view="candidate">',
        '<qti-rubric-block use="instructions" view="candidate">',
      ),
      { _tag: "cut", item: dataAttributesItem, schemaversion: "3.0.0" },
    ],
  },
  "cut-data-dash": cutItem("cut-data-dash", "BPIG_22April", dataDashItem, "3.0.1"),
  "data-bare-prefix": overSimple("data-bare-prefix", [
    replaceIn(
      "choice.xml",
      simpleOpeningParagraph,
      '<p data-="x">Look at the text in the picture.</p>',
    ),
  ]),
  "data-custom": overSimple("data-custom", [
    replaceIn(
      "choice.xml",
      ' time-dependent="false">',
      ' time-dependent="false" data-qti-suppress-tts="true">',
    ),
    replaceIn(
      "choice.xml",
      simpleOpeningParagraph,
      `<p data-prompt="p" data-a="1">Look at the text in the picture.</p>${dataCustomValues}${dataTen}<ul><li data-ssml="anything">one</li></ul>`,
    ),
    replaceIn(
      "choice.xml",
      '<img src="images/sign.png"',
      '<img data-img="i" src="images/sign.png"',
    ),
    replaceIn("choice.xml", 'max-choices="1">', 'max-choices="1" data-group="g">'),
    replaceIn("choice.xml", prompt, '<qti-prompt data-p="x">What does it say?</qti-prompt>'),
    replaceIn(
      "choice.xml",
      '<qti-simple-choice identifier="ChoiceA">',
      '<qti-simple-choice identifier="ChoiceA" data-c="a">',
    ),
  ]),
  "data-entity": overSimple("data-entity", [
    ...doctypeEdits,
    replaceIn(
      "choice.xml",
      "<qti-prompt>What does it say? &org;</qti-prompt>",
      '<qti-prompt data-org="&org;">What does it say? &org;</qti-prompt>',
    ),
  ]),
  "data-item-body": overSimple("data-item-body", [
    replaceIn("choice.xml", "<qti-item-body>", '<qti-item-body data-x="1">'),
  ]),
  "data-non-ascii": overSimple("data-non-ascii", [
    replaceIn(
      "choice.xml",
      simpleOpeningParagraph,
      `<p ${dataAcute}="x">Look at the text in the picture.</p>`,
    ),
  ]),
  "data-uppercase": overSimple("data-uppercase", [
    replaceIn("choice.xml", 'max-choices="1">', 'max-choices="1" data-Group="g">'),
  ]),
};

/**
 * The spec table: one row per {@link FixtureName}, so adding a name without its row does not
 * compile.
 *
 * Every variant is `simple` with string edits to its `choice.xml` (and, for `padded-text`, its
 * manifest), each written for the CRLF text of the original:
 *
 * - `doctype` declares a general entity and an `ATTLIST` default for `adaptive`, drops the attribute
 *   from the root and uses the entity in the prompt.
 * - `latin1` declares ISO-8859-1 and holds the byte 0x85 and a character reference to U+20AC.
 * - `external` declares an external subset that is never written and refers to `&undeclared;` in the
 *   prompt and the `alt` text.
 * - `utf16` declares UTF-16 and is written as a byte order mark and UTF-16 little endian.
 * - `windows-1252` declares that label and holds the byte 0x80, the euro there.
 * - `padded-attributes` is valid QTI whose seven `collapse`-type attribute values each carry one
 *   leading and one trailing space, with a tab character reference in a `replace`-type and a
 *   `preserve`-type attribute.
 * - `padded-text` is valid QTI whose manifest `collapse` leaf carries spaces and whose item gains a
 *   `replace` leaf holding a tab and a line feed.
 *
 * The eleven hand-edited packages are otherwise `simple`. Nine break one rule of the import
 * guards; `padded-identifier-value` and `comment-in-element` are admitted and round-trip:
 *
 * - `undeclared-response` points the interaction at `RESP`, which no declaration names.
 * - `choice-in-prompt` moves the first choice inside the prompt.
 * - `two-values-single` gives the single-cardinality default value a second `qti-value`.
 * - `bad-identifier-value` reads `Choice A` where an identifier is due. `padded-identifier-value`
 *   pads `ChoiceA` in a `qti-value`, which decision 157 reads as `ChoiceA` (outer whitespace
 *   removed for every non-string base type), so it imports and round-trips byte for byte.
 * - `choice-bounds` adds `min-choices="2"` beside `max-choices="1"`.
 * - `identifier-mismatch` and `title-mismatch` make the manifest's resource metadata disagree with
 *   the item (`choice2`, `Unattended Luggage 2`).
 * - `body-empty` replaces the item body's children with whitespace.
 * - `comment-in-element` puts a comment inside the first paragraph and a processing instruction
 *   inside `img`, which becomes `<img ...><?pi d?></img>`.
 * - `bad-template-uri` reads `a%zz` as the response-processing template, an invalid URI.
 *
 * `quoted-q` is phase 2's hand-broken package, `simple` with straight quotation marks around a `q`,
 * which the browser draws itself (the content guards' `q-punctuation`).
 *
 * `end-attempt` is phase 2's hand-written positive, the item `cut-text-entry` is cut from with its
 * text-entry interaction replaced by a `qti-end-attempt-interaction` and its response declaration
 * by a `boolean single` one, `HINT`, and its `map_response` template dropped, which would name a
 * response no longer declared. No corpus item holds an end-attempt interaction (spec 3.6).
 */
const specs: Record<FixtureName, FixtureSpec> = {
  ...cutSpecs,
  ...htmlSpecs,
  ...copySpecs,
  ...testSpecs,
  ...negativeSpecs,
  ...restoredSpecs,
  ...assemblySpecs,
  ...weightedSpecs,
  ...catalogSpecs,
  ...companionSpecs,
  ...catalogNegativeSpecs,
  ...pciSpecs,
  ...pciNegativeSpecs,
  ...wildcardSpecs,
  ...ssmlSpecs,
  ...dataSpecs,
  "bad-identifier-value": {
    edits: [
      replaceIn("choice.xml", "<qti-value>ChoiceA</qti-value>", "<qti-value>Choice A</qti-value>"),
    ],
    member: simpleMember,
    name: "bad-identifier-value",
  },
  "bad-template-uri": {
    edits: [
      replaceIn(
        "choice.xml",
        'template="https://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct.xml"',
        'template="a%zz"',
      ),
    ],
    member: simpleMember,
    name: "bad-template-uri",
  },
  "body-empty": {
    edits: [replaceIn("choice.xml", bodyChildren, " ")],
    member: simpleMember,
    name: "body-empty",
  },
  bytes: overSimple("bytes", [
    bytesManifestEdit(bytesResources),
    ...bytesFileEdits(bytesResources),
  ]),
  "bytes-webcontent-item": overSimple("bytes-webcontent-item", [
    bytesManifestEdit([
      ...bytesWithoutWebcontent,
      { href: "choice.xml", identifier: "r-webcontent", source: { text: "" }, type: "webcontent" },
    ]),
    ...bytesFileEdits(bytesWithoutWebcontent),
  ]),
  "choice-bounds": {
    edits: [replaceIn("choice.xml", 'max-choices="1"', 'min-choices="2" max-choices="1"')],
    member: simpleMember,
    name: "choice-bounds",
  },
  "choice-in-prompt": {
    edits: [
      replaceIn(
        "choice.xml",
        `</qti-prompt>\r\n            ${firstChoice}`,
        `${firstChoice}</qti-prompt>`,
      ),
    ],
    member: simpleMember,
    name: "choice-in-prompt",
  },
  "comment-in-element": {
    edits: [
      replaceIn(
        "choice.xml",
        "<p>Look at the text in the picture.</p>",
        "<p>Look at <!-- c -->the text in the picture.</p>",
      ),
      replaceIn(
        "choice.xml",
        'alt="NEVER LEAVE LUGGAGE UNATTENDED"/>',
        'alt="NEVER LEAVE LUGGAGE UNATTENDED"><?pi d?></img>',
      ),
    ],
    member: simpleMember,
    name: "comment-in-element",
  },
  csm: overSimple("csm", csmEdits),
  "csm-no-guid": overSimple("csm-no-guid", [
    ...csmEdits,
    replaceIn("imsmanifest.xml", resourceUriAndGuid, ""),
  ]),
  "csm-no-labelled-guid": overSimple("csm-no-labelled-guid", [
    ...csmEdits,
    replaceIn("imsmanifest.xml", resourceFloridaGuids, ""),
  ]),
  "csm-two-guids": overSimple("csm-two-guids", [
    ...csmEdits,
    replaceIn(
      "imsmanifest.xml",
      `<csmd:GUID>${csmGuids.resource[1][0]}</csmd:GUID>`,
      `<csmd:GUID>${csmGuids.resource[1][0]}</csmd:GUID>${CRLF}${" ".repeat(32)}<csmd:GUID>${csmGuids.spare}</csmd:GUID>`,
    ),
  ]),
  "csm-two-sets": overSimple("csm-two-sets", [
    ...csmEdits,
    replaceIn(
      "imsmanifest.xml",
      `</csmd:curriculumStandardsMetadataSet>${CRLF}                <imsmd:lom>`,
      `</csmd:curriculumStandardsMetadataSet>${CRLF}${atColumn(16, csmSet(' resourcePartId="choice-b"', "resource", csmGuids.second))}${CRLF}                <imsmd:lom>`,
    ),
  ]),
  doctype: {
    edits: doctypeEdits,
    member: simpleMember,
    name: "doctype",
  },
  "end-attempt": {
    edits: [
      replaceIn(
        bgTextEntryItem,
        '<qti-response-declaration identifier="RESPONSE" base-type="string" cardinality="single">\n  <qti-correct-response>\n   <qti-value>York</qti-value>\n  </qti-correct-response>\n  <qti-mapping default-value="0">\n   <qti-map-entry map-key="York" mapped-value="1" case-sensitive="true" />\n   <qti-map-entry map-key="york" mapped-value="0.5" />\n  </qti-mapping>\n </qti-response-declaration>',
        '<qti-response-declaration identifier="HINT" base-type="boolean" cardinality="single"/>',
      ),
      replaceIn(
        bgTextEntryItem,
        '<qti-text-entry-interaction response-identifier="RESPONSE" />',
        '<qti-end-attempt-interaction response-identifier="HINT" title="Hint"/>',
      ),
      replaceIn(
        bgTextEntryItem,
        ' <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/map_response" />\n',
        "",
      ),
      { _tag: "cut", item: bgTextEntryItem, schemaversion: "3.0.1" },
    ],
    member: corpusMembers.BPIG_22April,
    name: "end-attempt",
  },
  external: {
    edits: [
      {
        _tag: "InsertAfterLine",
        file: "choice.xml",
        line: 1,
        text: '<!DOCTYPE qti-assessment-item SYSTEM "item.dtd">',
      },
      replaceIn("choice.xml", prompt, "<qti-prompt>What does it say? &undeclared;</qti-prompt>"),
      replaceIn("choice.xml", altEnding, 'LUGGAGE &undeclared;"'),
    ],
    member: simpleMember,
    name: "external",
  },
  extmeta: overSimple("extmeta", extmetaEdits),
  "extmeta-hrefless": overSimple("extmeta-hrefless", [
    ...extmetaEdits,
    { _tag: "copyFile", from: "meta/choice.xml", to: "meta/choice2.xml" },
    replaceIn(
      "imsmanifest.xml",
      `<resource identifier="choice-meta"${recordAttributes}>${CRLF}            <file href="meta/choice.xml"/>`,
      `<resource identifier="choice-meta" type="resourcemetadata/xml">${CRLF}            <file href="meta/choice.xml"/>${CRLF}            <file href="meta/choice2.xml"/>`,
    ),
  ]),
  "extmeta-item-href": overSimple("extmeta-item-href", [
    ...extmetaEdits,
    replaceIn(
      "imsmanifest.xml",
      'type="imsqti_item_xmlv3p0" href="choice.xml"',
      'type="imsqti_item_xmlv3p0" href="meta/choice.xml"',
    ),
  ]),
  "extmeta-item-root": overSimple("extmeta-item-root", [
    ...extmetaManifestEdits,
    { _tag: "copyFile", from: "choice.xml", to: "meta/choice.xml" },
  ]),
  "extmeta-two-resources": overSimple("extmeta-two-resources", [
    ...extmetaEdits,
    addResources(recordResource("choice-meta2", recordAttributes, ["meta/choice.xml"])),
  ]),
  filelom: overSimple("filelom", filelomEdits),
  "filelom-qmd": overSimple("filelom-qmd", [
    ...filelomEdits,
    replaceIn(
      "imsmanifest.xml",
      fileMetadataEnd,
      `${continuingAt(16, qtiMetadata)}${CRLF}                </metadata>${CRLF}            </file>`,
    ),
  ]),
  "filelom-two-metadata": overSimple("filelom-two-metadata", [
    ...filelomEdits,
    replaceIn(
      "imsmanifest.xml",
      fileMetadataEnd,
      `</metadata>${CRLF}${atColumn(16, element("metadata", "", titledLom("Second metadata")))}${CRLF}            </file>`,
    ),
  ]),
  "identifier-mismatch": {
    edits: [
      replaceIn(
        "imsmanifest.xml",
        "<imsmd:entry>choice</imsmd:entry>",
        "<imsmd:entry>choice2</imsmd:entry>",
      ),
    ],
    member: simpleMember,
    name: "identifier-mismatch",
  },
  latin1: {
    edits: [
      declareEncoding("ISO-8859-1"),
      afterPicture("\u0085"),
      replaceIn("choice.xml", altEnding, 'LUGGAGE &#x20AC;"'),
    ],
    member: simpleMember,
    name: "latin1",
  },
  lomrest: overSimple("lomrest", lomrestEdits),
  "lomrest-exam": overSimple("lomrest-exam", [
    ...lomrestEdits,
    replaceIn(
      "imsmanifest.xml",
      "<imsmd:value>exercise</imsmd:value>",
      "<imsmd:value>exam</imsmd:value>",
    ),
  ]),
  "lomrest-self-assessment": overSimple("lomrest-self-assessment", [
    ...lomrestEdits,
    replaceIn(
      "imsmanifest.xml",
      "<imsmd:value>exercise</imsmd:value>",
      "<imsmd:value> self  assessment </imsmd:value>",
    ),
  ]),
  "lomrest-two-kinds": overSimple("lomrest-two-kinds", [
    ...lomrestEdits,
    addAfter("</imsmd:kind>", 24, mdVocabulary("kind", "requires")),
  ]),
  "lomrest-two-purposes": overSimple("lomrest-two-purposes", [
    ...lomrestEdits,
    addAfter("</imsmd:purpose>", 24, mdVocabulary("purpose", "idea")),
  ]),
  "lomrest-two-titles": overSimple("lomrest-two-titles", [
    ...lomrestEdits,
    addAfter(
      `Unattended Luggage</imsmd:string>${CRLF}${" ".repeat(24)}</imsmd:title>`,
      24,
      mdText("title", "Unattended Luggage, again"),
    ),
  ]),
  lti300: overLti("lti300", [ltiBasicType]),
  "lti300-as-301": overLti("lti300-as-301", [ltiBasicType, ltiVersion301]),
  lti301: overLti("lti301", [ltiVersion301]),
  nestedqmd: overSimple("nestedqmd", [takeQtiMetadataOut, putQtiMetadataIn(resourceLomEnd, 20)]),
  "nestedqmd-both": overSimple("nestedqmd-both", [putQtiMetadataIn(resourceLomEnd, 20)]),
  "nestedqmd-manifest-lom": overSimple("nestedqmd-manifest-lom", [
    takeQtiMetadataOut,
    putQtiMetadataIn(manifestLomEnd, 12),
  ]),
  outcome: overSimple("outcome", outcomeEdits),
  "outcome-title": overSimple("outcome-title", [
    ...outcomeEdits,
    replaceIn("testoutcome01.xml", 'identifier="SCORE"', 'identifier="SCORE" title="x"'),
  ]),
  "padded-attributes": {
    edits: [
      replaceIn("choice.xml", 'identifier="choice"', 'identifier=" choice "'),
      replaceIn("choice.xml", 'adaptive="false"', 'adaptive=" false "'),
      replaceIn("choice.xml", 'src="images/sign.png"', 'src=" images/sign.png "'),
      replaceIn("choice.xml", 'response-identifier="RESPONSE"', 'response-identifier=" RESPONSE "'),
      replaceIn("choice.xml", 'max-choices="1"', 'max-choices=" 1 "'),
      replaceIn("choice.xml", 'identifier="ChoiceA"', 'identifier=" ChoiceA "'),
      replaceIn(
        "choice.xml",
        'template="https://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct.xml"',
        'template=" https://www.imsglobal.org/question/qti_v3p0/rptemplates/match_correct.xml "',
      ),
      replaceIn("choice.xml", 'title="Unattended Luggage"', 'title="Unattended&#9;Luggage"'),
      replaceIn(
        "choice.xml",
        'alt="NEVER LEAVE LUGGAGE UNATTENDED"',
        'alt="NEVER&#9;LEAVE LUGGAGE UNATTENDED"',
      ),
    ],
    member: simpleMember,
    name: "padded-attributes",
  },
  "padded-identifier-value": {
    edits: [
      replaceIn("choice.xml", "<qti-value>ChoiceA</qti-value>", "<qti-value> ChoiceA </qti-value>"),
    ],
    member: simpleMember,
    name: "padded-identifier-value",
  },
  "padded-text": {
    edits: [
      replaceIn(
        "imsmanifest.xml",
        "<imsqti:timeDependent>false</imsqti:timeDependent>",
        "<imsqti:timeDependent> false </imsqti:timeDependent>",
      ),
      {
        _tag: "InsertAfterLine",
        file: "choice.xml",
        line: 13,
        text: '<qti-outcome-declaration identifier="NOTE" cardinality="single" base-type="string"><qti-default-value><qti-value>a&#9;b&#10;c</qti-value></qti-default-value></qti-outcome-declaration>',
      },
    ],
    member: simpleMember,
    name: "padded-text",
  },
  "quoted-q": {
    edits: [
      replaceIn(
        "choice.xml",
        "<p>Look at the text in the picture.</p>",
        '<p>Look at the "<q>text</q>" in the picture.</p>',
      ),
    ],
    member: simpleMember,
    name: "quoted-q",
  },
  resproc: overSimple("resproc", resprocEdits("imsqti_resprocessing_xmlv3p0")),
  "resproc-webcontent": overSimple("resproc-webcontent", resprocEdits("webcontent")),
  rtest01: overSimple("rtest01", rtest01Edits([], [])),
  "rtest01-choice-variable": overSimple(
    "rtest01-choice-variable",
    rtest01Edits(
      [],
      [
        rtest01DeclaringFirst(
          '<qti-outcome-declaration identifier="A1" cardinality="single" base-type="float"/>',
        ),
      ],
    ),
  ),
  "rtest01-cycle": overSimple(
    "rtest01-cycle",
    rtest01Edits(
      [],
      [
        replaceIn(
          `${rtest01Directory}/rtest01-fragment.xml`,
          "<qti-hottext-interaction",
          '<xi:include href="rtest01-fragment.xml"/><qti-hottext-interaction',
        ),
      ],
    ),
  ),
  "rtest01-fragment-context": overSimple(
    "rtest01-fragment-context",
    rtest01Edits(
      [rtest01Words],
      (["01", "02"] as const).map((set) =>
        rtest01IncludeAs(
          set,
          '<qti-hottext-interaction response-identifier="RESPONSE" max-choices="1"><xi:include href="rtest01-words.xml"/></qti-hottext-interaction>',
        ),
      ),
    ),
  ),
  "rtest01-fragment-identifier": overSimple(
    "rtest01-fragment-identifier",
    rtest01Edits(
      [],
      [rtest01IncludeAs("01", '<xi:include href="rtest01-fragment.xml#hottext" parse="xml"/>')],
    ),
  ),
  "rtest01-fragment-lang": overSimple(
    "rtest01-fragment-lang",
    rtest01Edits(
      [],
      [
        replaceIn(
          "imsmanifest.xml",
          `<file href="${rtest01Directory}/rtest01-set01.xml"/>`,
          `<metadata><lom xmlns="http://ltsc.ieee.org/xsd/LOM"><general><language>en</language></general></lom></metadata><file href="${rtest01Directory}/rtest01-set01.xml"/>`,
        ),
        replaceIn(`${rtest01Directory}/rtest01-fragment.xml`, "<div ", '<div xml:lang="fr" '),
      ],
    ),
  ),
  "rtest01-hottext-key": overSimple(
    "rtest01-hottext-key",
    rtest01Edits(
      [],
      [
        rtest01DeclaringFirst(
          '<qti-response-declaration identifier="OTHER" cardinality="single" base-type="identifier"/>',
        ),
        rtest01IncludeAs(
          "01",
          `<qti-hottext-interaction response-identifier="OTHER" max-choices="1"><p><qti-hottext identifier="A1">a</qti-hottext></p></qti-hottext-interaction>${rtest01Include}`,
        ),
      ],
    ),
  ),
  "rtest01-include-root": overSimple(
    "rtest01-include-root",
    rtest01Edits([], [rtest01IncludeAs("01", `<p>Read: ${rtest01Include}</p>`)]),
  ),
  "rtest01-include-target": overSimple(
    "rtest01-include-target",
    rtest01Edits(
      [],
      [rtest01IncludeAs("01", '<xi:include href="rtest01-missing.xml" parse="xml"/>')],
    ),
  ),
  "rtest01-rule-variable": overSimple(
    "rtest01-rule-variable",
    rtest01Edits(
      [rtest01Rules],
      [
        replaceIn(
          `${rtest01Directory}/rtest01-set01.xml`,
          '<qti-response-processing template=""/>',
          '<qti-response-processing><xi:include href="rtest01-rules.xml"/></qti-response-processing>',
        ),
      ],
    ),
  ),
  "rtest01-template-reference": overSimple(
    "rtest01-template-reference",
    rtest01Edits(
      [],
      [
        replaceIn(
          `${rtest01Directory}/rtest01-fragment.xml`,
          "</qti-hottext-interaction>",
          '</qti-hottext-interaction><p><qti-template-inline template-identifier="NONE" identifier="x" show-hide="show">t</qti-template-inline></p>',
        ),
      ],
    ),
  ),
  sharedMedia: { edits: [], member: sharedMediaMember, name: "sharedMedia" },
  simple: { edits: [], member: simpleMember, name: "simple" },
  "title-mismatch": {
    edits: [
      replaceIn(
        "imsmanifest.xml",
        "<imsmd:string>Unattended Luggage</imsmd:string>",
        "<imsmd:string>Unattended Luggage 2</imsmd:string>",
      ),
    ],
    member: simpleMember,
    name: "title-mismatch",
  },
  "two-values-single": {
    edits: [
      {
        _tag: "InsertAfterLine",
        file: "choice.xml",
        line: 11,
        text: "<qti-value>1</qti-value>",
      },
    ],
    member: simpleMember,
    name: "two-values-single",
  },
  "undeclared-response": {
    edits: [
      replaceIn(
        "choice.xml",
        '<qti-choice-interaction response-identifier="RESPONSE"',
        '<qti-choice-interaction response-identifier="RESP"',
      ),
    ],
    member: simpleMember,
    name: "undeclared-response",
  },
  usage3: overUsage("usage3"),
  "usage3-bad-context": overUsage(
    "usage3-bad-context",
    editFirstStatistic({ context: 'context="a%zz"' }),
  ),
  "usage3-bad-month": overUsage(
    "usage3-bad-month",
    editFirstStatistic({ lastUpdated: 'lastUpdated="2004-13-04"' }),
  ),
  "usage3-bad-name": overUsage("usage3-bad-name", editFirstStatistic({ name: 'name="1a"' })),
  "usage3-feb-30": overUsage(
    "usage3-feb-30",
    editFirstStatistic({ lastUpdated: 'lastUpdated="2004-02-30"' }),
  ),
  // `<value baseType="float"> 0.87 </value>`: decision 157 reads the float as 0.87, so the package
  // imports and round-trips byte for byte.
  "usage3-float-padded": overUsage(
    "usage3-float-padded",
    replaceIn("example.xml", "<value>0.87</value>", '<value baseType="float"> 0.87 </value>'),
  ),
  // `<value baseType="integer">0.87</value>`, outside a record: a `baseType` is no base type
  // there (reading 105), so the value is untyped text, and the package imports and round-trips.
  "usage3-integer-float": overUsage(
    "usage3-integer-float",
    replaceIn("example.xml", "<value>0.87</value>", '<value baseType="integer">0.87</value>'),
  ),
  "usage3-no-map-entry": overUsage(
    "usage3-no-map-entry",
    replaceIn("example.xml", firstMapEntries, ""),
  ),
  "usage3-no-target": overUsage(
    "usage3-no-target",
    replaceIn("example.xml", firstTargetAndValue, "<value>0.87</value>"),
  ),
  "usage3-ordinary-mapping": overUsage(
    "usage3-ordinary-mapping",
    replaceIn(
      "example.xml",
      "<value>0.87</value>",
      '<value>0.87</value>\n        <mapping lowerBound="1" upperBound="1" defaultValue="0"><mapEntry mapKey="d1" mappedValue="1"/></mapping>',
    ),
  ),
  "usage3-padded": overUsage(
    "usage3-padded",
    editFirstStatistic({ name: 'name=" AIS "' }),
    replaceIn("example.xml", 'mapKey="d1"', 'mapKey="a&#9;b"'),
    replaceIn(
      "example.xml",
      firstTargetAndValue,
      ['<targetObject identifier=" item1 "/>', "<value> 0.87 </value>"].join("\n        "),
    ),
  ),
  "usage3-two-values": overUsage(
    "usage3-two-values",
    replaceIn(
      "example.xml",
      "<value>0.87</value>",
      "<value>0.87</value>\n        <value>0.87</value>",
    ),
  ),
  "usage3-typed": overUsage("usage3-typed", ...usageTypedEdits),
  utf16: {
    edits: [declareEncoding("UTF-16"), { _tag: "EncodeUtf16", file: "choice.xml" }],
    member: simpleMember,
    name: "utf16",
  },
  variant: overSimple("variant", variantEdits()),
  "variant-301": overSimple("variant-301", variantEdits({ schemaversion: "3.0.1" })),
  "variant-bad-uri": overSimple(
    "variant-bad-uri",
    variantEdits({ children: drdWith(leaf("drd:hasAdaptation", "a%zz")) }),
  ),
  "variant-before-file": overSimple("variant-before-file", variantEdits({ beforeFile: true })),
  "variant-id-clash": overSimple("variant-id-clash", variantEdits({ identifier: "choice_es" })),
  "variant-no-metadata": overSimple("variant-no-metadata", variantEdits({ metadata: false })),
  "variant-no-resource": overSimple(
    "variant-no-resource",
    variantEdits({ identifierref: "nobody" }),
  ),
  "variant-padded": overSimple(
    "variant-padded",
    variantEdits({ children: paddedDrdChildren, identifier: " v1 " }),
  ),
  "variant-self-ref": overSimple("variant-self-ref", variantEdits({ identifierref: "choice" })),
  "variant-tactile": overSimple(
    "variant-tactile",
    variantEdits({
      children: [
        leaf("drd:accessMode", "tactile "),
        leaf("drd:adaptationType", "ext:stacked_translation"),
        leaf("drd:languageOfAdaptation", "es"),
      ],
    }),
  ),
  "variant-two-atinteroperable": overSimple(
    "variant-two-atinteroperable",
    variantEdits({
      children: drdWith(leaf("drd:atInteroperable", "true"), leaf("drd:atInteroperable", "false")),
    }),
  ),
  "variant-two-complexity": overSimple(
    "variant-two-complexity",
    variantEdits({
      children: drdWith(
        leaf("drd:educationalComplexityOfAdaptation", "enriched"),
        leaf("drd:educationalComplexityOfAdaptation", "simplified"),
      ),
    }),
  ),
  "windows-1252": {
    edits: [declareEncoding("windows-1252"), afterPicture("\u0080")],
    member: simpleMember,
    name: "windows-1252",
  },
};

/**
 * Look up the spec a fixture name stands for.
 *
 * @param name - A fixture name.
 * @returns Its spec, the same value every call.
 */
export const specOf = (name: FixtureName): FixtureSpec => specs[name];

/**
 * The four packages the importer refuses (a manifest outside the supported QTI 3 subset), which
 * the importer's tests still read, and which the package's `globalSetup` materializes once.
 */
export type RefusedPackage = "metaData" | "lti" | "CAT_Test01_Adaptive_EchoAdapt" | "sample_pci";

/**
 * Every package `materializePackage` accepts: the {@link RefusedPackage} base set, and `usageData`,
 * the published package whose usage-data documents the importer refuses.
 *
 * `usageData` stays out of {@link RefusedPackage} because that type is the `globalSetup` base set,
 * which a test pins to five keys.
 */
export type NamedPackage = RefusedPackage | "usageData";

/**
 * The tarball member of each {@link NamedPackage}.
 */
const refusedMembers: Record<NamedPackage, string> = {
  CAT_Test01_Adaptive_EchoAdapt: "qtiv3-examples/CAT/CAT_Test01_Adaptive_EchoAdapt.zip",
  lti: "qtiv3-examples/packaging/lti/lti.zip",
  metaData: "qtiv3-examples/packaging/metaData/metaData.zip",
  sample_pci: "qtiv3-examples/PCI/sample_pci.zip",
  usageData: "qtiv3-examples/packaging/usageData/usageData.zip",
};

/**
 * The tarball member of each zip {@link materializeCorpus} lists (28 of the tarball's 29 zips, the
 * QTI 2.2 archive left out), keyed by the zip's file name without `.zip`.
 */
export const zipMembers = {
  BBQsTest: "qtiv3-examples/packaging/BBQsTest/BBQsTest.zip",
  BPIG_22April: "QTI3_BPIG_Examples/BPIG_22April.zip",
  BegGuide_March2025: "QTI3_BeginnersGuide_Examples/BegGuide_March2025.zip",
  CASE: "qtiv3-examples/packaging/CASE/CASE.zip",
  CASEWithOutcome: "qtiv3-examples/packaging/CASEWithOutcome/CASEWithOutcome.zip",
  CAT_Test01_Adaptive_EchoAdapt: "qtiv3-examples/CAT/CAT_Test01_Adaptive_EchoAdapt.zip",
  basicFeedbackTest: "qtiv3-examples/packaging/basicFeedbackTest/basicFeedbackTest.zip",
  ccPackage: "qtiv3-examples/packaging/ccPackage/ccPackage.zip",
  englishBasicLevelV2: "qtiv3-examples/packaging/englishBasicLevelV2/englishBasicLevelV2.zip",
  englishHighLevelV2: "qtiv3-examples/packaging/englishHighLevelV2/englishHighLevelV2.zip",
  externalMetadata: "qtiv3-examples/packaging/externalMetadata/externalMetadata.zip",
  feedbackTest: "qtiv3-examples/packaging/feedbackTest/feedbackTest.zip",
  interactionMixSaxonyV3:
    "qtiv3-examples/packaging/interactionMixSaxonyV3/interactionMixSaxonyV3.zip",
  items: "qtiv3-examples/packaging/items/items.zip",
  lti: "qtiv3-examples/packaging/lti/lti.zip",
  maxfiles: "qtiv3-examples/packaging/maxfiles/maxfiles.zip",
  metaData: "qtiv3-examples/packaging/metaData/metaData.zip",
  pci_item_examples: "qtiv3-examples/packaging/pci/pci_item_examples.zip",
  pci_simple_example: "qtiv3-examples/packaging/pci-simple/pci_simple_example.zip",
  sample_pci: "qtiv3-examples/PCI/sample_pci.zip",
  "shared-vocabulary-imsmanifest":
    "qtiv3-examples/items/shared-vocabulary/shared-vocabulary-imsmanifest.zip",
  sharedMedia: "qtiv3-examples/packaging/sharedMedia/sharedMedia.zip",
  sharedStimulus: "qtiv3-examples/packaging/sharedStimulus/sharedStimulus.zip",
  simple: "qtiv3-examples/packaging/simple/simple.zip",
  svg: "qtiv3-examples/packaging/svg/svg.zip",
  testWithLti: "qtiv3-examples/packaging/testWithLti/testWithLti.zip",
  test_package_minfiles: "qtiv3-examples/packaging/test_package_minfiles/test_package_minfiles.zip",
  usageData: "qtiv3-examples/packaging/usageData/usageData.zip",
} as const;

/**
 * The name of one zip of the corpus, the key of its row in the table of members.
 */
export type ZipName = keyof typeof zipMembers;

/**
 * The one zip of the tarball the corpus leaves out: a QTI 2.2 items archive, not a QTI 3 package.
 */
const corpusExcludedMember = "qtiv2p2-examples/items/items.zip";

/**
 * The root every fixture directory lives under, relative to the test runner's working directory
 * (`packages/pantry`) unless the environment gives an absolute path.
 */
const fixturesRoot = Config.NonEmptyString("GR8DES_QTI_FIXTURES").pipe(
  Config.withDefault("work/fixtures"),
);

/**
 * The examples tarball, read from `GR8DES_QTI_EXAMPLES`, or else from the shared cache under
 * `HOME`.
 */
export const examplesTarball = Effect.gen(function* examplesTarball() {
  const configured = yield* Config.option(Config.NonEmptyString("GR8DES_QTI_EXAMPLES"));

  if (Option.isSome(configured)) {
    return configured.value;
  }

  const home = yield* Config.NonEmptyString("HOME");

  return `${home}/.cache/gr8des/qti3-examples/qti-examples-0a92fbb.tar.gz`;
});

/**
 * Collect a byte stream into text.
 *
 * @param bytes - A process's output stream.
 * @returns The whole stream decoded as UTF-8.
 */
const collect = (bytes: Stream.Stream<Uint8Array, PlatformError.PlatformError>) =>
  Stream.mkString(Stream.decodeText(bytes));

/**
 * Run `tar` or `unzip` to completion and return what it wrote to standard output.
 *
 * @param step - The command to run, which names the failure when it exits non-zero.
 * @param args - The command's arguments.
 * @returns The standard output, or an {@link ExamplesError} carrying the exit code and standard
 *   error.
 */
const run = Effect.fn("fixtures.run")(function* run(
  step: "tar" | "unzip",
  args: readonly string[],
) {
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
  const result = yield* Effect.scoped(
    Effect.gen(function* collectOutput() {
      const handle = yield* spawner.spawn(ChildProcess.make(step, args, { stdin: "ignore" }));

      return yield* Effect.all(
        {
          code: handle.exitCode,
          stderr: collect(handle.stderr),
          stdout: collect(handle.stdout),
        },
        { concurrency: "unbounded" },
      );
    }),
  );

  if (result.code !== ChildProcessSpawner.ExitCode(0)) {
    return yield* new ExamplesError({
      detail: `\`${step} ${args.join(" ")}\` exited ${result.code}: ${result.stderr.trim()}`,
      step,
    });
  }

  return result.stdout;
});

/**
 * List the tarball: its one top directory and every member under it.
 *
 * @param tarball - The path of the examples tarball.
 * @returns `top`, the tarball's single top-level directory, and `members`, every entry under it
 *   as a path relative to `top` (directories end in `/`), or an {@link ExamplesError}.
 */
const listTarball = Effect.fn("fixtures.listTarball")(function* listTarball(tarball: string) {
  const fs = yield* FileSystem.FileSystem;

  if (!(yield* fs.exists(tarball))) {
    return yield* new ExamplesError({
      detail: `the examples tarball is not at ${tarball}; fetch qti-examples-0a92fbb.tar.gz into ~/.cache/gr8des/qti3-examples/ or point GR8DES_QTI_EXAMPLES at it`,
      step: "missing",
    });
  }

  const entries = (yield* run("tar", ["-tzf", tarball])).split("\n").filter((line) => line !== "");
  const top = (entries[0] ?? "").replace(/\/$/u, "");
  const members = entries
    .filter((entry) => entry.startsWith(`${top}/`))
    .map((entry) => entry.slice(top.length + 1))
    .filter((member) => member !== "");

  return { members, top };
});

/**
 * Delete every Finder metadata file the extraction left in a package directory.
 *
 * @param pkg - The extracted package directory.
 * @returns Completes once no `.DS_Store` remains anywhere under `pkg`.
 */
const removeFinderMetadata = Effect.fn("fixtures.removeFinderMetadata")(
  function* removeFinderMetadata(pkg: string) {
    const fs = yield* FileSystem.FileSystem;
    const entries = yield* fs.readDirectory(pkg, { recursive: true });

    yield* Effect.forEach(
      entries.filter((entry) => entry === ".DS_Store" || entry.endsWith("/.DS_Store")),
      (entry) => fs.remove(`${pkg}/${entry}`),
      { discard: true },
    );
  },
);

/**
 * Replace the one occurrence of a string in text.
 *
 * @param text - The file's text.
 * @param edit - The edit naming `search` and `replacement`.
 * @returns `text` with `search` replaced; throws when `search` does not occur exactly once.
 */
const replaceOnce = (text: string, edit: Extract<TextEdit, { _tag: "ReplaceText" }>): string => {
  const first = text.indexOf(edit.search);
  const occurrences = text.split(edit.search).length - 1;

  if (first === -1 || occurrences !== 1) {
    throw new Error(
      `edit of ${edit.file}: ${JSON.stringify(edit.search)} occurs ${occurrences} times, and must occur exactly once; give the search enough surrounding text to be unique`,
    );
  }

  return text.slice(0, first) + edit.replacement + text.slice(first + edit.search.length);
};

/**
 * Insert a line after a numbered line of text.
 *
 * @param text - The file's text.
 * @param edit - The edit naming the 1-based `line` and the `text` to insert.
 * @returns `text` with the new line after line `line`; throws when `text` has no such line.
 */
const insertAfterLine = (
  text: string,
  edit: Extract<TextEdit, { _tag: "InsertAfterLine" }>,
): string => {
  let end = -1;

  for (let seen = 0; seen < edit.line; seen += 1) {
    end = text.indexOf("\n", end + 1);

    if (end === -1) {
      throw new Error(
        `edit of ${edit.file}: there is no line ${edit.line} to insert after, and the text ends a line with a line feed only after its first ${seen}`,
      );
    }
  }

  const terminator = text[end - 1] === "\r" ? "\r\n" : "\n";

  return text.slice(0, end + 1) + edit.text + terminator + text.slice(end + 1);
};

/**
 * Apply one edit to a file's text.
 *
 * @param text - The file's text.
 * @param edit - The edit to apply.
 * @returns The edited text; an `EncodeUtf16` edit leaves the text as it is, because it only changes
 *   how the bytes are written.
 */
const applyEdit = (text: string, edit: TextEdit): string =>
  Match.value(edit).pipe(
    Match.tag("ReplaceText", (replace) => replaceOnce(text, replace)),
    Match.tag("InsertAfterLine", (insert) => insertAfterLine(text, insert)),
    Match.tag("EncodeUtf16", () => text),
    Match.exhaustive,
  );

/**
 * Apply the edits that name one file to that file's bytes.
 *
 * The text is read as latin1 and written as latin1, so the bytes an edit does not touch survive
 * exactly. This is pure so a test can read each edit's effect without a tarball.
 *
 * @param original - The file's bytes as extracted.
 * @param edits - The edits that name this file, in order.
 * @returns The edited bytes. Throws, a defect, when an edit does not apply (a search that does not
 *   occur exactly once, a line that does not exist) or the text holds a character latin1 cannot
 *   write.
 */
export const editBytes = (original: Uint8Array, edits: readonly TextEdit[]): Uint8Array => {
  let text = Buffer.from(original).toString("latin1");

  for (const edit of edits) {
    text = applyEdit(text, edit);
  }

  if (edits.some((edit) => edit._tag === "EncodeUtf16")) {
    return Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(text, "utf16le")]);
  }

  if (/[\u{100}-\u{10FFFF}]/u.test(text)) {
    throw new Error(
      "an edit put a character above U+00FF into a file written as latin1; write it as a character reference, or add an EncodeUtf16 edit",
    );
  }

  return Buffer.from(text, "latin1");
};

/**
 * Whether an edit changes one file's text, as opposed to the package's file set or its cut.
 *
 * @param edit - Any edit.
 * @returns `true` for a {@link TextEdit}.
 */
const isTextEdit = (edit: Edit): edit is TextEdit =>
  edit._tag === "ReplaceText" || edit._tag === "InsertAfterLine" || edit._tag === "EncodeUtf16";

/**
 * Whether an edit changes the package's file set.
 *
 * @param edit - Any edit.
 * @returns `true` for a {@link FileEdit}.
 */
const isFileEdit = (edit: Edit): edit is FileEdit =>
  edit._tag === "addFile" || edit._tag === "copyFile" || edit._tag === "deleteFile";

/**
 * Apply a spec's text edits to the files they name, inside an extracted package directory.
 *
 * @param pkg - The extracted package directory.
 * @param edits - The spec's text edits.
 * @returns Completes once every named file has been rewritten once.
 */
const applyTextEdits = Effect.fn("fixtures.applyTextEdits")(function* applyTextEdits(
  pkg: string,
  edits: readonly TextEdit[],
) {
  const fs = yield* FileSystem.FileSystem;

  yield* Effect.forEach(
    new Set(edits.map((edit) => edit.file)),
    (file) =>
      Effect.gen(function* rewrite() {
        const original = yield* fs.readFile(`${pkg}/${file}`);

        yield* fs.writeFile(
          `${pkg}/${file}`,
          editBytes(
            original,
            edits.filter((edit) => edit.file === file),
          ),
        );
      }),
    { discard: true },
  );
});

/**
 * A reference that is not a path inside the package: it has a scheme, starts at the root or names
 * only a fragment.
 */
const externalReference = /^(?:[A-Za-z][A-Za-z0-9+.-]*:|\/|#)/u;

/**
 * Make an item's file name an XML `NCName`: every character outside letters, digits, `_`, `.` and
 * `-` becomes `_`, and a name that does not start with a letter or `_` gains a leading `_`.
 *
 * @param item - The item's path.
 * @returns The basename of `item` without its extension, as an `NCName`.
 */
const ncNameOf = (item: string): string => {
  const name = path.posix
    .basename(item, path.posix.extname(item))
    .replaceAll(/[^A-Za-z0-9_.-]/gu, "_");

  return /^[A-Za-z_]/u.test(name) ? name : `_${name}`;
};

/**
 * Extract one tarball member, as a file, into a directory.
 *
 * @param tarball - The examples tarball.
 * @param top - The tarball's top-level directory.
 * @param member - The member's path below `top`.
 * @param into - The directory the member lands in, as `<into>/<member>`.
 * @returns Completes once the file exists.
 */
const extractMember = Effect.fn("fixtures.extractMember")(function* extractMember(
  tarball: string,
  top: string,
  member: string,
  into: string,
) {
  const fs = yield* FileSystem.FileSystem;

  yield* fs.makeDirectory(into, { recursive: true });
  yield* run("tar", ["-xzf", tarball, "-C", into, "--strip-components", "1", `${top}/${member}`]);
});

/**
 * Write one file of a package, making its directories.
 *
 * @param file - The file's path.
 * @param bytes - The bytes to write.
 * @returns Completes once the file exists.
 */
const writeInto = Effect.fn("fixtures.writeInto")(function* writeInto(
  file: string,
  bytes: Uint8Array,
) {
  const fs = yield* FileSystem.FileSystem;

  yield* fs.makeDirectory(path.dirname(file), { recursive: true });
  yield* fs.writeFile(file, bytes);
});

/**
 * Write the minimal manifest of a cut: one `imsqti_item_xmlv3p0` resource of the item with a
 * `file` for each kept entry.
 *
 * @param edit - The cut.
 * @param kept - Every kept path, the item first.
 * @returns The manifest's text.
 */
const cutManifest = (edit: CutEdit, kept: readonly string[]): string => {
  const identifier = ncNameOf(edit.item);

  return manifestText(identifier, edit.schemaversion, [
    { files: kept, href: edit.item, identifier, type: "imsqti_item_xmlv3p0" },
  ]);
};

/**
 * Reduce an extracted package to the files in `kept` and a manifest, in place.
 *
 * The kept files keep their paths and bytes; every other entry is deleted.
 *
 * @param pkg - The extracted package directory.
 * @param tmp - The temporary directory that holds it, where the result is assembled.
 * @param kept - The paths to keep, each a file of `pkg`.
 * @param manifest - The text of the `imsmanifest.xml` that replaces the package's own.
 * @returns Completes once `pkg` holds only `kept` and the manifest.
 */
const keepOnly = Effect.fn("fixtures.keepOnly")(function* keepOnly(
  pkg: string,
  tmp: string,
  kept: readonly string[],
  manifest: string,
) {
  const fs = yield* FileSystem.FileSystem;
  const cut = `${tmp}/cut`;

  yield* Effect.forEach(
    kept,
    (file) =>
      Effect.gen(function* copyKept() {
        yield* fs.makeDirectory(path.posix.dirname(`${cut}/${file}`), { recursive: true });
        yield* fs.writeFile(`${cut}/${file}`, yield* fs.readFile(`${pkg}/${file}`));
      }),
    { discard: true },
  );
  yield* fs.writeFileString(`${cut}/imsmanifest.xml`, manifest);
  yield* fs.remove(pkg, { recursive: true });
  yield* fs.rename(cut, pkg);
});

/**
 * The item, section and stimulus refs of a QTI document, each with the resource type of the
 * document it names.
 */
const documentRefTypes: ReadonlyMap<string, string> = new Map([
  ["qti-assessment-item-ref", "imsqti_item_xmlv3p0"],
  ["qti-assessment-section-ref", "imsqti_section_xmlv3p0"],
  ["qti-assessment-stimulus-ref", "imsqti_stimulus_xmlv3p0"],
]);

/**
 * An item, section or stimulus ref start tag, with its attribute text.
 */
const documentRefPattern =
  /<(?<tag>qti-assessment-item-ref|qti-assessment-section-ref|qti-assessment-stimulus-ref)\b(?<attrs>[^>]*?)(?<self>\/?)>/gu;

/**
 * One `name="value"` or `name='value'` attribute of a start tag.
 */
const attributePattern =
  /(?<name>[A-Za-z_][\w:.-]*)\s*=\s*(?:"(?<double>[^"]*)"|'(?<single>[^']*)')/gu;

/**
 * One `qti-file-href` or `qti-resource-icon` element, whose text may name a file of the package
 * (the companion materials of an item name theirs so).
 */
const fileElementPattern =
  /<(?:qti-file-href|qti-resource-icon)(?:\s[^>]*)?>(?<text>[^<]*)<\/(?:qti-file-href|qti-resource-icon)>/gu;

/**
 * The attributes whose values may name a file of the package: `src`, `data`, `href`, `poster`,
 * `srcset`, `cite` and `altimg` (an `m:math`'s image fallback).
 */
const fileAttributePattern =
  /\s(?<name>src|data|href|poster|srcset|cite|altimg)\s*=\s*(?:"(?<double>[^"]*)"|'(?<single>[^']*)')/gu;

/**
 * Read XML's five predefined entities back out of an attribute value.
 *
 * @param text - An attribute value as written.
 * @returns The value the attribute holds.
 */
const unescapeAttribute = (text: string): string =>
  text
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&apos;", "'")
    .replaceAll("&amp;", "&");

/**
 * Read the attributes of a start tag's attribute text.
 *
 * @param attrs - The text between the tag's name and its closing `>`.
 * @returns Each attribute's value by name.
 */
const attributesOf = (attrs: string): ReadonlyMap<string, string> =>
  new Map(
    [...attrs.matchAll(attributePattern)].map((match) => [
      match.groups?.["name"] ?? "",
      unescapeAttribute(match.groups?.["double"] ?? match.groups?.["single"] ?? ""),
    ]),
  );

/**
 * The item, section and stimulus refs of a document's text.
 *
 * @param text - A QTI document, decoded as UTF-8.
 * @returns Each ref's resource `type`, its `identifier` (empty when absent) and its `href`, in
 *   document order.
 */
const refsOf = (text: string) =>
  [...text.matchAll(documentRefPattern)].flatMap((match) => {
    const attributes = attributesOf(match.groups?.["attrs"] ?? "");
    const href = attributes.get("href");
    const type = documentRefTypes.get(match.groups?.["tag"] ?? "");

    return href === undefined || href === "" || type === undefined
      ? []
      : [{ href, identifier: attributes.get("identifier") ?? "", type }];
  });

/**
 * One `xi:include` start tag, with its attribute text.
 */
const includePattern = /<xi:include\b(?<attrs>[^>]*?)\/?>/gu;

/**
 * The documents a QTI document's `xi:include` elements name, resolved against its folder.
 *
 * @param text - A QTI document, decoded as UTF-8.
 * @param documentPath - The document's path in the package.
 * @returns The resolved paths, each once, in document order. They are not checked for existence.
 */
const includesOf = (text: string, documentPath: string): string[] => {
  const folder = path.posix.dirname(documentPath);
  const targets = new Set<string>();

  for (const match of text.matchAll(includePattern)) {
    const href = attributesOf(match.groups?.["attrs"] ?? "").get("href") ?? "";
    const reference = href.replace(/[?#].*$/u, "");

    if (reference !== "" && !externalReference.test(reference)) {
      targets.add(path.posix.join(folder, reference));
    }
  }

  return [...targets];
};

/**
 * The relative file paths a document references, resolved against the document's folder.
 *
 * Item, section and stimulus refs name documents, not files, so their start tags are left out. The
 * text of a `qti-file-href` or a `qti-resource-icon` is a reference too.
 * A `srcset` value is a comma separated list of a URL and an optional descriptor each. Fragments
 * and queries are cut off, and a reference with a scheme, a leading `/` or only a fragment is not
 * a path inside the package.
 *
 * @param text - A QTI document, decoded as UTF-8.
 * @param documentPath - The document's path in the package.
 * @returns The resolved paths, each once: the element texts first, then the attribute values, each
 *   in document order. They are not checked for existence.
 */
const fileReferencesOf = (text: string, documentPath: string): string[] => {
  const folder = path.posix.dirname(documentPath);
  const paths = new Set<string>();

  for (const match of text.matchAll(fileElementPattern)) {
    const reference = (match.groups?.["text"] ?? "").trim().replace(/[?#].*$/u, "");

    if (reference !== "" && !externalReference.test(reference)) {
      paths.add(path.posix.join(folder, reference));
    }
  }

  for (const match of text.replaceAll(documentRefPattern, "").matchAll(fileAttributePattern)) {
    const value = unescapeAttribute(match.groups?.["double"] ?? match.groups?.["single"] ?? "");
    const references =
      match.groups?.["name"] === "srcset"
        ? value.split(",").map((candidate) => candidate.trim().split(/\s+/u)[0] ?? "")
        : [value];

    for (const raw of references) {
      const reference = raw.replace(/[?#].*$/u, "");

      if (reference !== "" && !externalReference.test(reference)) {
        paths.add(path.posix.join(folder, reference));
      }
    }
  }

  return [...paths];
};

/**
 * Cut an extracted package down to one item, in place.
 *
 * The files kept are the item and each file its `src`, `data`, `href`, `poster`, `srcset`, `cite`,
 * `altimg` and `longdesc` values name, read as {@link fileReferencesOf} reads a test document's
 * (relative paths only, resolved from the item's directory, and only when the package holds the
 * file). Every other entry is deleted, the kept files keep their paths, and a fresh
 * `imsmanifest.xml` replaces the package's own. The cut is a function of the package and the edit
 * alone, so the directory it makes is named by the same hash as every other fixture.
 *
 * @param pkg - The extracted package directory.
 * @param tmp - The temporary directory that holds it, where the cut is assembled.
 * @param edit - The cut.
 * @returns Completes once `pkg` holds only the item, its files and the manifest.
 */
const cutPackage = Effect.fn("fixtures.cutPackage")(function* cutPackage(
  pkg: string,
  tmp: string,
  edit: CutEdit,
) {
  const fs = yield* FileSystem.FileSystem;
  const item = yield* fs.readFile(`${pkg}/${edit.item}`);
  const kept = [edit.item];

  for (const resolved of fileReferencesOf(Buffer.from(item).toString("utf-8"), edit.item)) {
    if (
      !resolved.startsWith("..") &&
      !kept.includes(resolved) &&
      (yield* fs.exists(`${pkg}/${resolved}`)) &&
      (yield* fs.stat(`${pkg}/${resolved}`)).type === "File"
    ) {
      kept.push(resolved);
    }
  }

  yield* keepOnly(pkg, tmp, kept, cutManifest(edit, kept));
});

/**
 * Give each name an identifier that no earlier one has, by adding `-2`, `-3` and so on.
 *
 * @param names - The wanted `NCName`s, in order.
 * @returns One distinct `NCName` per name, in order.
 */
const distinctNames = (names: readonly string[]): string[] => {
  const used = new Set<string>();

  return names.map((name) => {
    let candidate = name;

    for (let count = 2; used.has(candidate); count += 1) {
      candidate = `${name}-${count}`;
    }

    used.add(candidate);

    return candidate;
  });
};

/**
 * Whether a path is a file of an extracted package.
 *
 * @param pkg - The extracted package directory.
 * @param file - A path inside it.
 * @returns `true` for a file that exists.
 */
const isPackageFile = Effect.fn("fixtures.isPackageFile")(function* isPackageFile(
  pkg: string,
  file: string,
) {
  const fs = yield* FileSystem.FileSystem;

  return (
    !file.startsWith("..") &&
    (yield* fs.exists(`${pkg}/${file}`)) &&
    (yield* fs.stat(`${pkg}/${file}`)).type === "File"
  );
});

/**
 * Cut an extracted package down to one test and what it reaches, in place.
 *
 * The documents kept are the test and, transitively, every document an item, section or stimulus
 * ref of a kept document names (resolved from that document's folder, and only when the package
 * holds the file). The files kept are the ones those documents reference. Every other entry is
 * deleted, and a fresh `imsmanifest.xml` of one resource per kept document, with each referenced
 * file listed under the resource whose document references it, replaces the package's own.
 *
 * @param pkg - The extracted package directory.
 * @param tmp - The temporary directory that holds it, where the cut is assembled.
 * @param edit - The cut.
 * @returns Completes once `pkg` holds only the kept entries and the manifest.
 */
const cutTestPackage = Effect.fn("fixtures.cutTestPackage")(function* cutTestPackage(
  pkg: string,
  tmp: string,
  edit: CutTestEdit,
) {
  const fs = yield* FileSystem.FileSystem;
  const documents: { path: string; type: string }[] = [
    { path: edit.test, type: "imsqti_test_xmlv3p0" },
  ];
  const files: string[][] = [];

  for (let at = 0; at < documents.length; at += 1) {
    const document = documents[at];

    if (document === undefined) {
      continue;
    }

    const text = yield* fs.readFileString(`${pkg}/${document.path}`);
    const folder = path.posix.dirname(document.path);

    for (const ref of refsOf(text)) {
      const resolved = path.posix.join(folder, ref.href.replace(/[?#].*$/u, ""));

      if (
        !documents.some((known) => known.path === resolved) &&
        (yield* isPackageFile(pkg, resolved))
      ) {
        documents.push({ path: resolved, type: ref.type });
      }
    }

    const included = includesOf(text, document.path);

    for (const target of included) {
      if (
        !documents.some((known) => known.path === target) &&
        (yield* isPackageFile(pkg, target))
      ) {
        documents.push({ path: target, type: "imsqti_fragment_xmlv3p0" });
      }
    }

    files[at] = [];

    for (const reference of fileReferencesOf(text, document.path)) {
      if (!included.includes(reference) && (yield* isPackageFile(pkg, reference))) {
        files[at]?.push(reference);
      }
    }
  }

  const identifiers = distinctNames(documents.map((document) => ncNameOf(document.path)));
  const resources = documents.map((document, at): ManifestResource => ({
    files: [...new Set([document.path, ...(files[at] ?? [])])],
    href: document.path,
    identifier: identifiers[at] ?? "",
    type: document.type,
  }));

  yield* keepOnly(
    pkg,
    tmp,
    [...new Set(resources.flatMap((resource) => resource.files))],
    manifestText(ncNameOf(edit.test), edit.schemaversion, resources),
  );
});

/**
 * The variables a loose test names for each of its item refs.
 *
 * Every attribute value, but an `href` or a schema location, of the form `<identifier>.<VAR>` or
 * `<identifier>.<N>.<VAR>` over an item ref's identifier names `VAR` for it, and so does the
 * `source-identifier` of a `qti-variable-mapping` inside the item ref. When two item refs'
 * identifiers both begin a value (`J` and `J.K` for `J.K.SCORE`), the longer names it; a value that
 * is itself an item ref's identifier (`J.K`) names no variable. `duration` is the test's own name
 * for an item's duration, not a declared variable: it makes the item's stub time-dependent.
 * `RESPONSE` and `SCORE` are always there, but for `SCORE` of an item whose ref holds a mapping
 * that targets it.
 *
 * @param test - The test document's text.
 * @returns For each distinct item `href`, the first ref's identifier, whether it declares `SCORE`,
 *   whether any ref names its `duration` and the variables of every ref that names that `href`,
 *   besides `RESPONSE` and `SCORE`.
 */
const stubsOf = (test: string) => {
  const refs = [...test.matchAll(documentRefPattern)].flatMap((match) => {
    if (match.groups?.["tag"] !== "qti-assessment-item-ref") {
      return [];
    }

    const attributes = attributesOf(match.groups["attrs"] ?? "");
    const identifier = attributes.get("identifier");
    const href = attributes.get("href");

    if (identifier === undefined || href === undefined) {
      return [];
    }

    const mapped: string[] = [];
    let targetsScore = false;

    if (match.groups["self"] !== "/") {
      const start = (match.index ?? 0) + match[0].length;
      const end = test.indexOf("</qti-assessment-item-ref>", start);

      for (const mapping of test
        .slice(start, end === -1 ? test.length : end)
        .matchAll(/<qti-variable-mapping\b(?<attrs>[^>]*?)\/?>/gu)) {
        const mappingAttributes = attributesOf(mapping.groups?.["attrs"] ?? "");
        const source = mappingAttributes.get("source-identifier");

        if (source !== undefined) {
          mapped.push(source);
        }

        if (mappingAttributes.get("target-identifier") === "SCORE") {
          targetsScore = true;
        }
      }
    }

    return [{ href, identifier, mapped, targetsScore }];
  });
  const values = [...test.matchAll(attributePattern)]
    .filter((match) => !["href", "xsi:schemaLocation"].includes(match.groups?.["name"] ?? ""))
    .map((match) => unescapeAttribute(match.groups?.["double"] ?? match.groups?.["single"] ?? ""));
  const identifiers = refs.map((ref) => ref.identifier);
  const owner = (value: string): string | undefined =>
    identifiers
      .filter((identifier) => value.startsWith(`${identifier}.`))
      .toSorted((left, right) => right.length - left.length)[0];
  const stubs = new Map<
    string,
    { identifier: string; scored: boolean; timed: boolean; variables: Set<string> }
  >();

  for (const ref of refs) {
    const stub = stubs.get(ref.href) ?? {
      identifier: ref.identifier,
      scored: true,
      timed: false,
      variables: new Set<string>(),
    };

    if (ref.targetsScore) {
      stub.scored = false;
    }

    for (const mapped of ref.mapped) {
      stub.variables.add(mapped);
    }

    for (const value of values) {
      const prefix = `${ref.identifier}.`;

      if (
        value.startsWith(prefix) &&
        !identifiers.includes(value) &&
        owner(value) === ref.identifier
      ) {
        const variable = value.slice(prefix.length).replace(/^\d+\./u, "");

        if (variable === "duration") {
          stub.timed = true;
        } else if (variable !== "") {
          stub.variables.add(variable);
        }
      }
    }

    stubs.set(ref.href, stub);
  }

  return [...stubs].map(([href, stub]) => ({
    href,
    identifier: stub.identifier,
    scored: stub.scored,
    timed: stub.timed,
    variables: [...stub.variables].filter(
      (variable) => variable !== "RESPONSE" && variable !== "SCORE",
    ),
  }));
};

/**
 * The response processing of a time-dependent stub: it names `duration`, the built-in variable
 * only a time-dependent item has.
 */
const timedProcessing = [
  "<qti-response-processing>",
  "        <qti-response-condition>",
  "            <qti-response-if>",
  '                <qti-gt><qti-variable identifier="duration"/><qti-base-value base-type="float">0</qti-base-value></qti-gt>',
  '                <qti-set-outcome-value identifier="SCORE"><qti-base-value base-type="float">1</qti-base-value></qti-set-outcome-value>',
  "            </qti-response-if>",
  "        </qti-response-condition>",
  "    </qti-response-processing>",
].join("\n");

/**
 * Package one loose test with a generated stub item per distinct item `href`, in place.
 *
 * Each stub is `simple`'s `choice.xml` with its identifier and title set to the item ref's
 * identifier, its picture paragraph removed (a stub names no file) and one further float single
 * outcome declaration for each variable {@link stubsOf} names. A fresh `imsmanifest.xml` of the
 * test's resource and one item resource per stub replaces the package's own.
 *
 * @param pkg - The extracted package directory, holding the loose test at its root.
 * @param tmp - The temporary directory that holds it.
 * @param tarball - The examples tarball, which `simple` is extracted from.
 * @param top - The tarball's top-level directory.
 * @param edit - The edit.
 * @returns Completes once `pkg` holds only the test, its stubs and the manifest.
 */
const packageLooseTest = Effect.fn("fixtures.packageLooseTest")(function* packageLooseTest(
  pkg: string,
  tmp: string,
  tarball: string,
  top: string,
  edit: LooseTestEdit,
) {
  const fs = yield* FileSystem.FileSystem;
  const testPath = path.posix.basename(edit.test);
  const test = yield* fs.readFileString(`${pkg}/${testPath}`);
  const scratch = `${tmp}/loose-template`;

  yield* extractMember(tarball, top, simpleMember, scratch);
  yield* run("unzip", [
    "-q",
    "-o",
    `${scratch}/${simpleMember}`,
    "choice.xml",
    "-d",
    `${scratch}/zip`,
  ]);

  const template = yield* fs.readFileString(`${scratch}/zip/choice.xml`);
  const stubs = stubsOf(test);
  const identifiers = distinctNames(stubs.map((stub) => ncNameOf(stub.identifier)));

  yield* Effect.forEach(
    stubs,
    (stub) =>
      writeInto(
        `${pkg}/${path.posix.normalize(stub.href)}`,
        new TextEncoder().encode(
          template
            .replace(
              'identifier="choice" title="Unattended Luggage"',
              `identifier="${escapeAttribute(stub.identifier)}" title="${escapeAttribute(stub.identifier)}"`,
            )
            .replace(/<p>\s*<img [^>]*\/>\s*<\/p>\s*/u, "")
            .replace(
              /[ \t]*<qti-outcome-declaration identifier="SCORE"[\s\S]*?<\/qti-outcome-declaration>\r?\n/u,
              stub.scored ? "$&" : "",
            )
            .replace(
              'time-dependent="false"',
              stub.timed ? 'time-dependent="true"' : 'time-dependent="false"',
            )
            .replace(/<qti-response-processing [^>]*\/>/u, stub.timed ? timedProcessing : "$&")
            .replace(
              "    <qti-item-body>",
              [
                ...stub.variables.map(
                  (variable) =>
                    `    <qti-outcome-declaration identifier="${escapeAttribute(variable)}" cardinality="single" base-type="float"/>\n`,
                ),
                "    <qti-item-body>",
              ].join(""),
            ),
        ),
      ),
    { discard: true },
  );

  const hrefs = stubs.map((stub) => path.posix.normalize(stub.href));

  yield* keepOnly(
    pkg,
    tmp,
    [testPath, ...hrefs],
    manifestText(ncNameOf(testPath), edit.schemaversion, [
      {
        files: [testPath],
        href: testPath,
        identifier: ncNameOf(testPath),
        type: "imsqti_test_xmlv3p0",
      },
      ...hrefs.map((href, at): ManifestResource => ({
        files: [href],
        href,
        identifier: identifiers[at] ?? "",
        type: "imsqti_item_xmlv3p0",
      })),
    ]),
  );
});

/**
 * Apply one file-set edit inside an extracted package directory.
 *
 * @param pkg - The extracted package directory.
 * @param tmp - The build's temporary directory, where a source's tarball member is extracted.
 * @param tarball - The examples tarball.
 * @param top - The tarball's top-level directory.
 * @param index - The edit's place in the list, which names its scratch directory.
 * @param edit - The edit.
 * @returns Completes once the package holds the edit's result.
 */
const applyFileEdit = Effect.fn("fixtures.applyFileEdit")(function* applyFileEdit(
  pkg: string,
  tmp: string,
  tarball: string,
  top: string,
  index: number,
  edit: FileEdit,
) {
  const fs = yield* FileSystem.FileSystem;

  if (edit._tag === "deleteFile") {
    return yield* fs.remove(`${pkg}/${edit.path}`);
  }

  if (edit._tag === "copyFile") {
    yield* fs.makeDirectory(path.dirname(`${pkg}/${edit.to}`), { recursive: true });

    return yield* fs.copyFile(`${pkg}/${edit.from}`, `${pkg}/${edit.to}`);
  }

  const { source } = edit;
  const scratch = `${tmp}/edit-${index}`;

  if ("text" in source) {
    return yield* writeInto(`${pkg}/${edit.path}`, new TextEncoder().encode(source.text));
  }

  if ("member" in source) {
    yield* extractMember(tarball, top, source.member, scratch);

    return yield* writeInto(
      `${pkg}/${edit.path}`,
      yield* fs.readFile(`${scratch}/${source.member}`),
    );
  }

  yield* extractMember(tarball, top, source.zip, scratch);
  yield* run("unzip", [
    "-q",
    "-o",
    `${scratch}/${source.zip}`,
    source.path,
    "-d",
    `${scratch}/zip`,
  ]);

  return yield* writeInto(
    `${pkg}/${edit.path}`,
    yield* fs.readFile(`${scratch}/zip/${source.path}`),
  );
});

/**
 * Extract and derive a spec's package into `<tmp>/pkg`.
 *
 * The recipe is `tar` of the one member, then `unzip` of it when it is a zip (a loose member is
 * placed as `<tmp>/pkg/<basename>` instead), deletion of `.DS_Store`, the spec's file edits in list
 * order, its text edits, then its cut, all inside the temporary directory so nothing is visible
 * under the
 * root yet.
 *
 * @param spec - The fixture's spec.
 * @param tarball - The examples tarball.
 * @param tmp - The fresh temporary directory to work in.
 * @returns Completes once `<tmp>/pkg` holds the finished package.
 */
const build = Effect.fn("fixtures.build")(function* build(
  spec: FixtureSpec,
  tarball: string,
  tmp: string,
) {
  const fs = yield* FileSystem.FileSystem;
  const { top } = yield* listTarball(tarball);

  yield* extractMember(tarball, top, spec.member, `${tmp}/src`);

  if (spec.member.endsWith(".zip")) {
    yield* run("unzip", ["-q", "-o", `${tmp}/src/${spec.member}`, "-d", `${tmp}/pkg`]);
  } else {
    yield* fs.makeDirectory(`${tmp}/pkg`);
    yield* fs.copyFile(
      `${tmp}/src/${spec.member}`,
      `${tmp}/pkg/${spec.member.slice(spec.member.lastIndexOf("/") + 1)}`,
    );
  }

  yield* removeFinderMetadata(`${tmp}/pkg`);
  yield* Effect.forEach(
    spec.edits.filter(isFileEdit),
    (edit, index) => applyFileEdit(`${tmp}/pkg`, tmp, tarball, top, index, edit),
    { discard: true },
  );
  yield* applyTextEdits(`${tmp}/pkg`, spec.edits.filter(isTextEdit));

  for (const edit of spec.edits) {
    if (edit._tag === "cut") {
      yield* cutPackage(`${tmp}/pkg`, tmp, edit);
    } else if (edit._tag === "cutTest") {
      yield* cutTestPackage(`${tmp}/pkg`, tmp, edit);
    } else if (edit._tag === "looseTest") {
      yield* packageLooseTest(`${tmp}/pkg`, tmp, tarball, top, edit);
    }
  }
});

/**
 * Return a materialized path, making it first when it is absent.
 *
 * A materialized path is immutable and appears only by one `rename`:
 *
 * - A present target is returned and nothing is written.
 * - An absent target is built in a fresh `<root>/.tmp-<random>/`, then `<tmp>/pkg` is `rename`d into
 *   place as the target. The loser of two concurrent builds sees its `rename` fail, because the
 *   target appeared in the meantime. `ENOTEMPTY`, what macOS answers for a rename onto a non-empty
 *   directory, reaches Effect as reason `Unknown` rather than `AlreadyExists`, so the failure is
 *   not told apart by its reason: whenever the target exists after a failed `rename` the build lost
 *   the race, and returns the target.
 * - The temporary directory is removed when the build ends, whichever way it ends.
 *
 * Nothing under the root is written outside a `.tmp-*` directory, and there is no marker, lock or
 * sweeper: the name holds the hash of the transform, so a changed transform is a new directory.
 *
 * @param entry - The name of the directory under the root.
 * @param make - Builds the result into `<tmp>/pkg`, given the examples tarball and `tmp`.
 * @returns `<root>/<entry>`.
 */
const materializeInto = Effect.fn("fixtures.materializeInto")(function* materializeInto<E, R>(
  entry: string,
  make: (tarball: string, tmp: string) => Effect.Effect<void, E, R>,
) {
  const fs = yield* FileSystem.FileSystem;
  const root = yield* Effect.orDie(fixturesRoot);
  const target = `${root}/${entry}`;

  if (yield* fs.exists(target)) {
    return target;
  }

  const tarball = yield* Effect.orDie(examplesTarball);

  yield* fs.makeDirectory(root, { recursive: true });
  yield* Effect.gen(function* buildAndRename() {
    const tmp = yield* fs.makeTempDirectoryScoped({ directory: root, prefix: ".tmp-" });

    yield* make(tarball, tmp);
    yield* fs
      .rename(`${tmp}/pkg`, target)
      .pipe(
        Effect.catch((error) =>
          fs
            .exists(target)
            .pipe(Effect.flatMap((present) => (present ? Effect.void : Effect.fail(error)))),
        ),
      );
  }).pipe(Effect.scoped);

  return target;
});

/**
 * Return a spec's materialized directory, making it first when it is absent.
 *
 * @param spec - The fixture's spec.
 * @returns The directory `<root>/<name>-<hash12>`, built as {@link materializeInto} says.
 */
export const materializeSpec = (spec: FixtureSpec) =>
  materializeInto(`${spec.name}-${hash12(spec)}`, (tarball, tmp) => build(spec, tarball, tmp));

/**
 * Materialize a named fixture and return its directory.
 *
 * @param name - One of {@link fixtureNames}.
 * @returns `<root>/<name>-<hash12(specOf(name))>`, extracted on first use and never rewritten.
 */
export const materialize = (
  name: FixtureName,
): Effect.Effect<
  string,
  PlatformError.PlatformError | ExamplesError,
  FileSystem.FileSystem | ChildProcessSpawner.ChildProcessSpawner
> => materializeSpec(specOf(name));

/**
 * Materialize one of the {@link NamedPackage}s the importer refuses.
 *
 * @param pkg - The package's name.
 * @returns `<root>/<pkg>-<hash12>`, a no-edit spec over the package's tarball member.
 */
export const materializePackage = (
  pkg: NamedPackage,
): Effect.Effect<
  string,
  PlatformError.PlatformError | ExamplesError,
  FileSystem.FileSystem | ChildProcessSpawner.ChildProcessSpawner
> => materializeSpec({ edits: [], member: refusedMembers[pkg], name: pkg });

/**
 * Materialize every package of the examples tarball.
 *
 * The corpus is each zip of the tarball but {@link corpusExcludedMember}, listed from the tarball,
 * each a no-edit spec named by the zip's file name without `.zip`.
 *
 * @returns Each package's name, directory and tarball member, in tarball order.
 */
export const materializeCorpus = Effect.fn("fixtures.materializeCorpus")(
  function* materializeCorpus() {
    const tarball = yield* Effect.orDie(examplesTarball);
    const { members } = yield* listTarball(tarball);

    return yield* Effect.forEach(
      members.filter((member) => member.endsWith(".zip") && member !== corpusExcludedMember),
      (member) => {
        const name = member.slice(member.lastIndexOf("/") + 1, -".zip".length);

        return materializeSpec({ edits: [], member, name }).pipe(
          Effect.map((dir) => ({ dir, member, name })),
        );
      },
      { concurrency: 4 },
    );
  },
);

/**
 * Materialize one corpus zip as a file, without extracting it.
 *
 * The member is extracted by `tar` into a temporary directory and `rename`d into place as built,
 * so the file is byte for byte the tarball's member.
 *
 * @param name - The zip's name, the file name of its tarball member without `.zip`.
 * @returns The file `<root>/<name>.zip-<hash12>/<name>.zip`, extracted on first use and never
 *   rewritten. The hash is {@link transformHash} of `{ name: "zip", member, edits: [] }`.
 */
export const materializeZip = (
  name: ZipName,
): Effect.Effect<
  string,
  PlatformError.PlatformError | ExamplesError,
  FileSystem.FileSystem | ChildProcessSpawner.ChildProcessSpawner
> => {
  const member = zipMembers[name];

  return materializeInto(
    `${name}.zip-${hash12({ edits: [], member, name: "zip" })}`,
    Effect.fn("fixtures.buildZip")(function* buildZip(tarball, tmp) {
      const fs = yield* FileSystem.FileSystem;
      const { top } = yield* listTarball(tarball);

      yield* extractMember(tarball, top, member, `${tmp}/src`);
      yield* fs.makeDirectory(`${tmp}/pkg`);
      yield* fs.rename(`${tmp}/src/${member}`, `${tmp}/pkg/${name}.zip`);
    }),
  ).pipe(Effect.map((dir) => `${dir}/${name}.zip`));
};

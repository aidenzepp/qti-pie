/* oxlint-disable unicorn/throw-new-error -- Schema.TaggedError is a schema class factory. */
import { createHash } from "node:crypto";
import path from "node:path";
import { Config, Effect, FileSystem, Match, Option, Schema, Stream } from "effect";
import type { PlatformError } from "effect";
import { ChildProcess, ChildProcessSpawner } from "effect/process";
import type { Uuid } from "@bjornpagen/grizzle";

/**
 * The version of this module's own extraction code, one of the four inputs of every fixture's hash.
 *
 * A fix-forward of the materializer that changes what any directory holds bumps it, so the
 * corrected directories appear beside the old ones under new names instead of replacing them.
 */
export const FIXTURES_VERSION = "2" as const;

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
 * `href`, `poster`, `srcset`, `cite` or `longdesc`, deletes every other entry and
 * writes a manifest of one `imsqti_item_xmlv3p0` resource declaring `schemaversion`. It applies
 * after the {@link FileEdit}s and {@link TextEdit}s of its spec, once the package is extracted.
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
 * `poster`, `srcset`, `cite` or `longdesc`, and deletes every other entry. It writes a manifest
 * declaring `schemaversion` with one resource per kept document under its real type
 * (`imsqti_test_xmlv3p0`, `imsqti_section_xmlv3p0`, `imsqti_item_xmlv3p0`,
 * `imsqti_stimulus_xmlv3p0`), each referenced file listed under the resource whose document
 * references it. It applies after the {@link FileEdit}s and {@link TextEdit}s of its spec.
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
 * `SCORE` (float, single) and every other variable the test prefixes with that identifier or names
 * in a `qti-variable-mapping` `source-identifier` inside that item ref, as a float single outcome.
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
  "shared-vocabulary-imsmanifest":
    "qtiv3-examples/items/shared-vocabulary/shared-vocabulary-imsmanifest.zip",
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
 * The names of phase 5's 63 negative fixtures: each a data-only edit set over one of
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
  "item-duration-in-item",
  "item-duration-not-timed",
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
  "section-empty",
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
 * The names of the 12 cut MathML positives of phase 6 (spec 4.11's first table): each a cut of one
 * corpus item that carries `m:math`, `math-alttext` and `math-class` with the one vocabulary of a
 * later phase edited out.
 */
const mathmlNames = [
  "math-mathml",
  "math-stat2",
  "math-calc5",
  "math-solution",
  "math-template-block",
  "math-alttext",
  "math-polynomials",
  "math-order",
  "math-associate",
  "math-either-or",
  "math-inline-choice",
  "math-class",
] as const;

/**
 * The names `materialize` accepts: `simple`, its seven variants and the eleven hand-edited
 * packages, each the same package with the edits of its row in the spec table, `sharedMedia`, the
 * examples' shared-media package unedited, `quoted-q`, phase 2's hand-broken package,
 * `end-attempt`, phase 2's hand-written positive, the 19 cut items of {@link cutNames}, the 40
 * hand-written HTML positives of {@link htmlElements}, the 14 XML copies of {@link copyNames}, and
 * the packaging phase's metadata and content cuts with their negatives, and the 11 positive
 * fixtures of phase 5's tests, sections and stimuli ({@link testNames}), and its 63 negatives
 * ({@link negativeNames}), the ten wildcard fixtures of {@link wildcardNames} and the 12 cut MathML
 * positives of {@link mathmlNames}.
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
  ...mathmlNames,
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
 * The set under the manifest `metadata`, which `csm` adds after the manifest `lom` (line 47).
 */
const manifestCsmSet: Lines = csmSet(
  ' resourceLabel="Package (QTI 3.0)"',
  "package",
  csmGuids.manifest,
);

/**
 * The set under the resource `metadata`, which `csm` adds after the resource `lom` (line 91).
 */
const resourceCsmSet: Lines = csmSet(' resourcePartId="choice"', "resource", csmGuids.resource);

/**
 * The edits of `csm`: the declaration and one set under each `metadata`, each after its `lom`. The
 * manifest `metadata` closes at column 4 and the resource's at column 12.
 */
const csmEdits: readonly Edit[] = [
  declareCsmd,
  replaceIn(
    "imsmanifest.xml",
    `</imsmd:lom>${CRLF}    </metadata>`,
    `</imsmd:lom>${CRLF}${atColumn(8, manifestCsmSet)}${CRLF}    </metadata>`,
  ),
  replaceIn(
    "imsmanifest.xml",
    `</imsmd:lom>${CRLF}            </metadata>`,
    `</imsmd:lom>${CRLF}${atColumn(16, resourceCsmSet)}${CRLF}            </metadata>`,
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
const sharedStimulusMember = "qtiv3-examples/packaging/sharedStimulus/sharedStimulus.zip";

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
 * @returns The item's text.
 */
const stubItem = (
  identifier: string,
  outcomes: readonly (readonly [string, string])[] = [],
): string =>
  [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<qti-assessment-item ${asiRoot} identifier="${identifier}" title="${identifier}" adaptive="false" time-dependent="false">`,
    '  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/>',
    '  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>',
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
 * resolving reading, `J.K` with `SCORE`.
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
      '            <qti-assessment-item-ref identifier="I" href="itemI.xml"/>',
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
 * context declaration, a `during` feedback with a `title` and `xml:lang`, and its manifest the test
 * resource's LOM `language`.
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
    'title="Simple Feedback Test" identifier="SPECTATUS-GENERATED-TEST">',
    'title="Simple Feedback Test" identifier="SPECTATUS-GENERATED-TEST" xml:lang="en">',
  ),
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
    '<file href="passages/stylesheets/unbelievable_night.css"/>',
    '<file href="passages/stylesheets/unbelievable_night.css"/>\n            <file href="passages/fragment.xml"/>',
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
      '<resource identifier="ltitest" type="imsqti_test_xmlv3p0" href="ltitest.xml">\n            <file href="ltitest.xml"/>\n        </resource>\n        <resource identifier="experiment101" type="imslti_xmlv1p1">',
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
 * The spec of a negative: the positive `base` with `edits` after its own, under the negative's
 * name.
 *
 * The edits of a spec apply by kind (file edits, then text edits, then the cut), each kind in list
 * order, so the extra edits of a negative see the positive's result.
 *
 * @param name - The negative's name.
 * @param base - The positive it edits.
 * @param edits - The edits that make the breach; none for a "(direct)" negative, whose spec is the
 *   positive's own under the negative's name.
 * @returns The spec, whose directory is named by the hash of exactly these values like any other.
 */
const negativeOver = (
  name: (typeof negativeNames)[number],
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
 * A hand-written stub whose response processing names `duration`.
 *
 * @param identifier - The item's identifier and title.
 * @param outcomes - Each further outcome's identifier and base type, declared single.
 * @param timed - Whether the item declares `time-dependent="true"`.
 * @returns The item's text.
 */
const durationStub = (
  identifier: string,
  outcomes: readonly (readonly [string, string])[],
  timed: boolean,
): string =>
  stubItem(identifier, outcomes)
    .replace('time-dependent="false"', `time-dependent="${timed}"`)
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
 * mapping's source `NOTA`, `I` is time-dependent and declares `A.B`, and `J` declares nothing more
 * (the spec's `time-dependent` and declarations of the positive).
 *
 * @param overrides - Stub texts that replace the positive's, by `href`.
 * @returns Each stub's `href` and text.
 */
const mappingStubs = (
  overrides: Readonly<Record<string, string>> = {},
): readonly (readonly [string, string])[] =>
  (
    [
      ["item034.xml", stubItem("item034", [["NOTA", "float"]])],
      ["item160.xml", stubItem("item160")],
      ["item063.xml", stubItem("item063")],
      ["itemI.xml", durationStub("I", [["A.B", "float"]], true)],
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
  "item-duration-in-item": negativeByHand(
    "item-duration-in-item",
    "test-mapping",
    mappingStubs({ "itemJ.xml": durationStub("J", [], false) }),
    [],
  ),
  "item-duration-not-timed": negativeByHand(
    "item-duration-not-timed",
    "test-mapping",
    mappingStubs({ "itemI.xml": stubItem("I", [["A.B", "float"]]) }),
    [],
  ),
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
  "section-empty": negativeOver("section-empty", "test-linear", [
    replaceIn(
      "rtest13.xml",
      "    </qti-test-part>",
      [
        '        <qti-assessment-section identifier="bare" title="Bare" visible="true">',
        '            <qti-rubric-block view="candidate">',
        "                <qti-content-body><p>Only a rubric</p></qti-content-body>",
        "            </qti-rubric-block>",
        "        </qti-assessment-section>",
        "    </qti-test-part>",
      ].join("\n"),
    ),
  ]),
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
 * The item `math-alttext` is cut from, its path in `BPIG_22April`.
 */
const alttextItem = "items/qti3-choice-aria-mathml-catalog.xml";

/**
 * The item `math-class` is cut from, its path in `shared-vocabulary-imsmanifest`.
 */
const classItem = "Items/Item_QTI3_RichardTake2_01/inline_choice_qti3.xml";

/**
 * The `qti-catalog-info` of `qti3-choice-aria-mathml-catalog.xml`, the lines {@link mathmlSpecs}
 * removes from `math-alttext` (the catalog is phase 9's, and its `data-reading-type` phase 8's).
 */
const alttextCatalog = [
  "<qti-catalog-info>",
  '    <qti-catalog id="cat01">',
  '      <qti-card support="glossary-on-screen">',
  "        <qti-html-content>",
  "          <p>inspect (someone or something) in detail to determine their nature or condition</p>",
  "        </qti-html-content>",
  "      </qti-card>",
  '      <qti-card support="keyword-translation">',
  '        <qti-card-entry xml:lang="es">',
  "          <qti-html-content>",
  "            <p>inspeccionar, revisar, examinar</p>",
  "          </qti-html-content>",
  "        </qti-card-entry>",
  "      </qti-card>",
  "    </qti-catalog>",
  '    <qti-catalog id="cat02">',
  '      <qti-card support="spoken">',
  '        <qti-card-entry data-reading-type="computer-read-aloud">',
  "          <qti-html-content>",
  "            <p>Two surveyors, designated Ah and Pea, stand some distance apart on",
  "            the south bank of a river, looking at a tree, designated Tea, that is on the ",
  "            north bank of the river. Points Ah, Pea, and Tea form a triangle.",
  "            At points Ah and Pea, there are two parallel sight lines pointing",
  "            North and forming angles outside of the triangle. At point Pea, ",
  "            angle Tea Pea A is fifty-three degrees. The adjacent angle between Pea Tea",
  "            and the northern sight line is thirty-seven degrees. At point A, angle Tea-Ah-Pea ",
  "            is not labeled, and the adjacent angle formed between A Tea and that northern sight ",
  "            line is thirty-two degrees. </p>",
  "          </qti-html-content>",
  "        </qti-card-entry>",
  "      </qti-card>",
  "    </qti-catalog>",
  "  </qti-catalog-info>",
].join("\n");

/**
 * The specs of {@link mathmlNames}, each the cut of the item spec 4.11's table names under the
 * version it gives (`BPIG_22April` items are 3.0.1, the others 3.0.0).
 *
 * - `math-alttext` also has the catalog, the two `data-catalog-idref` attributes and its
 *   `data-reading-type` removed, edits that apply before the cut.
 * - `math-class` has the `data-prompt` of its inline choice interaction removed.
 */
const mathmlSpecs: Record<(typeof mathmlNames)[number], FixtureSpec> = {
  "math-alttext": {
    ...cutItem("math-alttext", "BPIG_22April", alttextItem, "3.0.1"),
    edits: [
      replaceIn(alttextItem, alttextCatalog, ""),
      replaceIn(alttextItem, '<span data-catalog-idref="cat01">Examine</span>', "Examine"),
      replaceIn(alttextItem, ' data-catalog-idref="cat02"', ""),
      { _tag: "cut", item: alttextItem, schemaversion: "3.0.1" },
    ],
  },
  "math-associate": cutItem(
    "math-associate",
    "BBQsTest",
    "id-200e2c3f7d76/matching-associate-trigDeriv.xml",
    "3.0.0",
  ),
  "math-calc5": cutItem("math-calc5", "BPIG_22April", "items/mc_calc5.xml", "3.0.1"),
  "math-class": {
    ...cutItem("math-class", "shared-vocabulary-imsmanifest", classItem, "3.0.0"),
    edits: [
      replaceIn(classItem, ' data-prompt="Select an Answer"', ""),
      { _tag: "cut", item: classItem, schemaversion: "3.0.0" },
    ],
  },
  "math-either-or": cutItem("math-either-or", "BBQsTest", "id-5c1b1e2d56bd/either-or.xml", "3.0.0"),
  "math-inline-choice": cutItem("math-inline-choice", "items", "inline_choice_math.xml", "3.0.0"),
  "math-mathml": cutItem("math-mathml", "BPIG_22April", "items/MathML.xml", "3.0.1"),
  "math-order": cutItem("math-order", "BBQsTest", "id-e475c3c922f6/order-maths.xml", "3.0.0"),
  "math-polynomials": cutItem(
    "math-polynomials",
    "BBQsTest",
    "id-371b0f88774a/MultipleChoice-choice-polynomials.xml",
    "3.0.0",
  ),
  "math-solution": cutItem(
    "math-solution",
    "BPIG_22April",
    "items/Example03-feedbackBlock-solution.xml",
    "3.0.1",
  ),
  "math-stat2": cutItem("math-stat2", "BPIG_22April", "items/stat2.xml", "3.0.1"),
  "math-template-block": cutItem(
    "math-template-block",
    "BPIG_22April",
    "items/Example04-feedbackBlock-templateBlock.xml",
    "3.0.1",
  ),
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
  ...wildcardSpecs,
  ...mathmlSpecs,
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
      `</csmd:curriculumStandardsMetadataSet>${CRLF}            </metadata>`,
      `</csmd:curriculumStandardsMetadataSet>${CRLF}${atColumn(16, csmSet(' resourcePartId="choice-b"', "resource", csmGuids.second))}${CRLF}            </metadata>`,
    ),
  ]),
  doctype: {
    edits: [
      {
        _tag: "InsertAfterLine",
        file: "choice.xml",
        line: 1,
        text: '<!DOCTYPE qti-assessment-item [<!ENTITY org "1EdTech &amp; friends"><!ATTLIST qti-assessment-item adaptive CDATA "false">]>',
      },
      replaceIn("choice.xml", ' adaptive="false"', ""),
      replaceIn("choice.xml", prompt, "<qti-prompt>What does it say? &org;</qti-prompt>"),
    ],
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
 * The attributes whose values may name a file of the package: `src`, `data`, `href`, `poster`,
 * `srcset` and `cite`.
 */
const fileAttributePattern =
  /\s(?<name>src|data|href|poster|srcset|cite)\s*=\s*(?:"(?<double>[^"]*)"|'(?<single>[^']*)')/gu;

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
 * The relative file paths a document references, resolved against the document's folder.
 *
 * Item, section and stimulus refs name documents, not files, so their start tags are left out.
 * A `srcset` value is a comma separated list of a URL and an optional descriptor each. Fragments
 * and queries are cut off, and a reference with a scheme, a leading `/` or only a fragment is not
 * a path inside the package.
 *
 * @param text - A QTI document, decoded as UTF-8.
 * @param documentPath - The document's path in the package.
 * @returns The resolved paths, each once, in document order. They are not checked for existence.
 */
const fileReferencesOf = (text: string, documentPath: string): string[] => {
  const folder = path.posix.dirname(documentPath);
  const paths = new Set<string>();

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
 * The files kept are the item and each file its `src`, `data`, `href`, `poster`, `srcset`, `cite`
 * and `longdesc` values name, read as {@link fileReferencesOf} reads a test document's (relative
 * paths only, resolved from the item's directory, and only when the package holds the file). Every
 * other entry is deleted, the kept files keep their paths, and a fresh `imsmanifest.xml` replaces
 * the package's own. The cut is a function of the package and the edit alone, so the directory it
 * makes is named by the same hash as every other fixture.
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

    files[at] = [];

    for (const reference of fileReferencesOf(text, document.path)) {
      if (yield* isPackageFile(pkg, reference)) {
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
 * `RESPONSE` and `SCORE` are always there.
 *
 * @param test - The test document's text.
 * @returns For each distinct item `href`, the first ref's identifier, whether any ref names its
 *   `duration` and the variables of every ref that names that `href`, besides `RESPONSE` and
 *   `SCORE`.
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

    if (match.groups["self"] !== "/") {
      const start = (match.index ?? 0) + match[0].length;
      const end = test.indexOf("</qti-assessment-item-ref>", start);

      for (const mapping of test
        .slice(start, end === -1 ? test.length : end)
        .matchAll(/<qti-variable-mapping\b(?<attrs>[^>]*?)\/?>/gu)) {
        const source = attributesOf(mapping.groups?.["attrs"] ?? "").get("source-identifier");

        if (source !== undefined) {
          mapped.push(source);
        }
      }
    }

    return [{ href, identifier, mapped }];
  });
  const values = [...test.matchAll(attributePattern)]
    .filter((match) => !["href", "xsi:schemaLocation"].includes(match.groups?.["name"] ?? ""))
    .map((match) => unescapeAttribute(match.groups?.["double"] ?? match.groups?.["single"] ?? ""));
  const identifiers = refs.map((ref) => ref.identifier);
  const owner = (value: string): string | undefined =>
    identifiers
      .filter((identifier) => value.startsWith(`${identifier}.`))
      .toSorted((left, right) => right.length - left.length)[0];
  const stubs = new Map<string, { identifier: string; timed: boolean; variables: Set<string> }>();

  for (const ref of refs) {
    const stub = stubs.get(ref.href) ?? {
      identifier: ref.identifier,
      timed: false,
      variables: new Set<string>(),
    };

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

/**
 * A well-formed UUID derived from a readable label, so a fixture names its nodes and declarations
 * and the rows still carry the `Uuid` the schema asks for.
 */
export const uuidOf = (label: string): Uuid => {
  const hex = createHash("sha1").update(label).digest("hex");

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
};

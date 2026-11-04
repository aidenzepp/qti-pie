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
export const FIXTURES_VERSION = "1" as const;

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
 * It keeps the item file `item` and the files that item references, deletes every other entry and
 * writes a manifest of one `imsqti_item_xmlv3p0` resource declaring `schemaversion`. It applies
 * after the {@link FileEdit}s and {@link TextEdit}s of its spec, once the package is extracted.
 */
export interface CutEdit {
  readonly _tag: "cut";
  readonly item: string;
  readonly schemaversion: "3.0.0" | "3.0.1";
}

/**
 * One edit of a fixture: a {@link TextEdit} of one file's text, a {@link FileEdit} of the file
 * set, or the {@link CutEdit} that reduces the package to one item.
 *
 * A spec's file edits apply first, in list order, so a text edit can name a file an `addFile` or
 * `copyFile` made; its text edits then apply file by file, as {@link TextEdit} says; its cut
 * applies last.
 */
export type Edit = TextEdit | FileEdit | CutEdit;

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
 * The names `materialize` accepts: `simple`, its seven variants and the eleven hand-edited
 * packages, each the same package with the edits of its row in the spec table, `sharedMedia`, the
 * examples' shared-media package unedited, `quoted-q`, phase 2's hand-broken package,
 * `end-attempt`, phase 2's hand-written positive, the 19 cut items of {@link cutNames}, the 40
 * hand-written HTML positives of {@link htmlElements}, the 14 XML copies of {@link copyNames}, and
 * the packaging phase's metadata and content cuts with their negatives.
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
 * @returns The spec, named `html-<element>`.
 */
const htmlItem = (element: string, use: string): FixtureSpec => ({
  edits: [
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
    `<p>This is a True/False question? <object data="images/x.png" type="image/png"><param name="n" value="v" valuetype="DATA"/></object></p>`,
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
 * The edits of `extmeta` that put the record in `meta/choice.xml`: the published file, with the
 * two `xml:lang="en"` attributes it carries (on `jacs` and `Mathematics`) taken out, because `xml:`
 * attributes are the one family the importer does not model.
 */
const extmetaRecordEdits: readonly Edit[] = [
  { _tag: "addFile", path: "meta/choice.xml", source: externalRecord },
  replaceIn("meta/choice.xml", '<string xml:lang="en">jacs<', "<string>jacs<"),
  replaceIn("meta/choice.xml", '<string xml:lang="en">Mathematics<', "<string>Mathematics<"),
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
const zipMembers = {
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
 * (`packages/qti`) unless the environment gives an absolute path.
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
 * The attributes of an item whose values may name a file of the package: `src`, `href`, `data` and
 * `poster`. The item is read with a plain regular expression over its text, not with `readXml`: a
 * match that is not a file (text or a comment that reads `src="x"`) names no entry of the package
 * and is dropped, so the cut keeps exactly the files the item can reach.
 */
const referencePattern =
  /\s(?:src|href|data|poster)\s*=\s*(?:"(?<double>[^"]*)"|'(?<single>[^']*)')/gu;

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
 * Escape text for an XML attribute value written in double quotes.
 */
const escapeAttribute = (text: string): string =>
  text.replaceAll("&", "&amp;").replaceAll('"', "&quot;").replaceAll("<", "&lt;");

/**
 * Write the minimal manifest of a cut: the QTI 3 content-package namespaces, `QTI Package` and the
 * edit's `schemaversion`, no LOM, and one `imsqti_item_xmlv3p0` resource of the item with a `file`
 * for each kept entry.
 *
 * @param edit - The cut.
 * @param kept - Every kept path, the item first.
 * @returns The manifest's text.
 */
const cutManifest = (edit: CutEdit, kept: readonly string[]): string => {
  const identifier = ncNameOf(edit.item);

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1"',
    '  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
    '  xsi:schemaLocation="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1 https://purl.imsglobal.org/spec/qti/v3p0/schema/xsd/imsqtiv3p0_imscpv1p2_v1p0.xsd"',
    `  identifier="MANIFEST-${identifier}">`,
    "  <metadata>",
    "    <schema>QTI Package</schema>",
    `    <schemaversion>${edit.schemaversion}</schemaversion>`,
    "  </metadata>",
    "  <organizations/>",
    "  <resources>",
    `    <resource identifier="${identifier}" type="imsqti_item_xmlv3p0" href="${escapeAttribute(edit.item)}">`,
    ...kept.map((file) => `      <file href="${escapeAttribute(file)}"/>`),
    "    </resource>",
    "  </resources>",
    "</manifest>",
    "",
  ].join("\n");
};

/**
 * Cut an extracted package down to one item, in place.
 *
 * The files kept are the item and each file its `src`, `href`, `data` and `poster` values name
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
  const itemDirectory = path.posix.dirname(edit.item);
  const kept = [edit.item];

  for (const match of Buffer.from(item).toString("latin1").matchAll(referencePattern)) {
    const reference = (match.groups?.["double"] ?? match.groups?.["single"] ?? "").replace(
      /[?#].*$/u,
      "",
    );

    if (reference === "" || externalReference.test(reference)) {
      continue;
    }

    const resolved = path.posix.join(itemDirectory, reference);

    if (
      !resolved.startsWith("..") &&
      !kept.includes(resolved) &&
      (yield* fs.exists(`${pkg}/${resolved}`)) &&
      (yield* fs.stat(`${pkg}/${resolved}`)).type === "File"
    ) {
      kept.push(resolved);
    }
  }

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
  yield* fs.writeFileString(`${cut}/imsmanifest.xml`, cutManifest(edit, kept));
  yield* fs.remove(pkg, { recursive: true });
  yield* fs.rename(cut, pkg);
});

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
 * @returns Each package's name and directory, in tarball order.
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
          Effect.map((dir) => ({ dir, name })),
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

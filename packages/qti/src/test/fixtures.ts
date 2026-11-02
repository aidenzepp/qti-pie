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
 *
 * The file edits are {@link FileEdit}; {@link CutEdit} is the one edit that names no file.
 */
export type FileEdit =
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
 * The edit that turns an extracted package into a minimal package of one item.
 *
 * It keeps the item file `item` and the files that item references, deletes every other entry and
 * writes a manifest of one `imsqti_item_xmlv3p0` resource declaring `schemaversion`. It applies
 * after the {@link FileEdit}s of its spec, once the package is extracted.
 */
export interface CutEdit {
  readonly _tag: "cut";
  readonly item: string;
  readonly schemaversion: "3.0.0" | "3.0.1";
}

/**
 * Any edit a {@link FixtureSpec} may list: a {@link FileEdit} or the {@link CutEdit}.
 */
export type Edit = FileEdit | CutEdit;

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
 * (`adaptive-zero-feedback`) and five admitted.
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
] as const;

/**
 * The names `materialize` accepts: `simple`, its seven variants and the eleven hand-broken
 * packages, each the same package with the edits of its row in the spec table, `sharedMedia`, the
 * examples' shared-media package unedited, `quoted-q`, phase 2's hand-broken package,
 * `end-attempt`, phase 2's hand-written positive, the 19 cut items of {@link cutNames}, the 40
 * hand-written HTML positives of {@link htmlElements} and the 12 XML copies of
 * {@link copyNames}.
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
const replaceIn = (file: string, search: string, replacement: string): FileEdit => ({
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
const declareEncoding = (label: string): FileEdit =>
  replaceIn("choice.xml", 'encoding="UTF-8"', `encoding="${label}"`);

/**
 * Build the `ReplaceText` edit that appends a character to the sentence on `choice.xml`'s line 15,
 * so the character lands inside the item body's first paragraph.
 *
 * @param character - The character to insert after `picture.`.
 * @returns The edit as plain data.
 */
const afterPicture = (character: string): FileEdit =>
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
const bgCopy = (name: string, edits: readonly FileEdit[]): FixtureSpec => ({
  edits: [...edits, { _tag: "cut", item: bgChoiceItem, schemaversion: "3.0.1" }],
  member: corpusMembers.BPIG_22April,
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
 * The edits of `adaptive-one-feedback` and `adaptive-zero-feedback`: the choice interaction of
 * {@link bgChoiceItem} goes in the content body of a feedback block, the `FEEDBACK` outcome the
 * block reads is declared, and the root writes `adaptive`, which the item does not.
 *
 * @param adaptive - The root's `adaptive`, an `xs:boolean` spelling.
 * @returns The edits, each of which must match exactly once.
 */
const feedbackWrapped = (adaptive: string): readonly FileEdit[] => [
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
};

/**
 * The item of `BPIG_22April` that `cut-text-entry` is cut from, which `end-attempt` edits before
 * it cuts it.
 */
const bgTextEntryItem = "items/BG010.xml";

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
 * The eleven hand-broken packages each break one rule of the import guards and are otherwise
 * `simple`:
 *
 * - `undeclared-response` points the interaction at `RESP`, which no declaration names.
 * - `choice-in-prompt` moves the first choice inside the prompt.
 * - `two-values-single` gives the single-cardinality default value a second `qti-value`.
 * - `bad-identifier-value` reads `Choice A` where an identifier is due, and `padded-identifier-value`
 *   reads `ChoiceA`, which only the identifier pattern refuses.
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
  utf16: {
    edits: [declareEncoding("UTF-16"), { _tag: "EncodeUtf16", file: "choice.xml" }],
    member: simpleMember,
    name: "utf16",
  },
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
 * the importer's tests still read.
 */
export type RefusedPackage = "metaData" | "lti" | "CAT_Test01_Adaptive_EchoAdapt" | "sample_pci";

/**
 * The tarball member of each {@link RefusedPackage}.
 */
const refusedMembers: Record<RefusedPackage, string> = {
  CAT_Test01_Adaptive_EchoAdapt: "qtiv3-examples/CAT/CAT_Test01_Adaptive_EchoAdapt.zip",
  lti: "qtiv3-examples/packaging/lti/lti.zip",
  metaData: "qtiv3-examples/packaging/metaData/metaData.zip",
  sample_pci: "qtiv3-examples/PCI/sample_pci.zip",
};

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
const examplesTarball = Effect.gen(function* examplesTarball() {
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
const replaceOnce = (text: string, edit: Extract<FileEdit, { _tag: "ReplaceText" }>): string => {
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
  edit: Extract<FileEdit, { _tag: "InsertAfterLine" }>,
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
const applyEdit = (text: string, edit: FileEdit): string =>
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
export const editBytes = (original: Uint8Array, edits: readonly FileEdit[]): Uint8Array => {
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
 * Apply a spec's file edits to the files they name, inside an extracted package directory.
 *
 * @param pkg - The extracted package directory.
 * @param edits - The spec's edit list; a {@link CutEdit} in it is left for {@link cutPackage}.
 * @returns Completes once every named file has been rewritten once.
 */
const applyEdits = Effect.fn("fixtures.applyEdits")(function* applyEdits(
  pkg: string,
  edits: readonly Edit[],
) {
  const fs = yield* FileSystem.FileSystem;
  const fileEdits = edits.filter((edit) => edit._tag !== "cut");

  yield* Effect.forEach(
    new Set(fileEdits.map((edit) => edit.file)),
    (file) =>
      Effect.gen(function* rewrite() {
        const original = yield* fs.readFile(`${pkg}/${file}`);

        yield* fs.writeFile(
          `${pkg}/${file}`,
          editBytes(
            original,
            fileEdits.filter((edit) => edit.file === file),
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
 * Extract and derive a spec's package into `<tmp>/pkg`.
 *
 * The recipe is `tar` of the one zip member, `unzip` of it, deletion of `.DS_Store`, then the
 * spec's file edits and its cut, all inside the temporary directory so nothing is visible under the
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

  yield* fs.makeDirectory(`${tmp}/src`);
  yield* run("tar", [
    "-xzf",
    tarball,
    "-C",
    `${tmp}/src`,
    "--strip-components",
    "1",
    `${top}/${spec.member}`,
  ]);
  yield* run("unzip", ["-q", "-o", `${tmp}/src/${spec.member}`, "-d", `${tmp}/pkg`]);
  yield* removeFinderMetadata(`${tmp}/pkg`);
  yield* applyEdits(`${tmp}/pkg`, spec.edits);

  for (const edit of spec.edits) {
    if (edit._tag === "cut") {
      yield* cutPackage(`${tmp}/pkg`, tmp, edit);
    }
  }
});

/**
 * Return a spec's materialized directory, making it first when it is absent.
 *
 * A materialized directory is immutable and appears only by one `rename`:
 *
 * - A present target is returned and nothing is written.
 * - An absent target is built in a fresh `<root>/.tmp-<random>/`, then `rename`d into place. The
 *   loser of two concurrent builds sees its `rename` fail, because the target appeared in the
 *   meantime. `ENOTEMPTY`, what macOS answers for a rename onto a non-empty directory, reaches
 *   Effect as reason `Unknown` rather than `AlreadyExists`, so the failure is not told apart by its
 *   reason: whenever the target exists after a failed `rename` the build lost the race, and returns
 *   the target.
 * - The temporary directory is removed when the build ends, whichever way it ends.
 *
 * Nothing under the root is written outside a `.tmp-*` directory, and there is no marker, lock or
 * sweeper: the name holds the hash of the transform, so a changed transform is a new directory.
 *
 * @param spec - The fixture's spec.
 * @returns The directory `<root>/<name>-<hash12>`.
 */
const materializeSpec = Effect.fn("fixtures.materializeSpec")(function* materializeSpec(
  spec: FixtureSpec,
) {
  const fs = yield* FileSystem.FileSystem;
  const root = yield* Effect.orDie(fixturesRoot);
  const target = `${root}/${spec.name}-${hash12(spec)}`;

  if (yield* fs.exists(target)) {
    return target;
  }

  const tarball = yield* Effect.orDie(examplesTarball);

  yield* fs.makeDirectory(root, { recursive: true });
  yield* Effect.gen(function* buildAndRename() {
    const tmp = yield* fs.makeTempDirectoryScoped({ directory: root, prefix: ".tmp-" });

    yield* build(spec, tarball, tmp);
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
 * Materialize one of the packages the importer refuses.
 *
 * @param pkg - The package's name.
 * @returns `<root>/<pkg>-<hash12>`, a no-edit spec over the package's tarball member.
 */
export const materializePackage = (
  pkg: RefusedPackage,
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

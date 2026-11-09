/**
 * Slice G's attribute readings judged on whole packages by the law oracle
 * (`#pantry/test/oracle.ts`): each input of the review that the readings now refuse is refused
 * under the law and rule its reading names, and the nearest valid input breaks no law.
 *
 * Oracle: the law oracle reads the composed grammar's domains and uses through `admissionOf` and
 * `requiredOf`, so a grammar reading needs no oracle code of its own; these cases check that a
 * package reaches the reading, from the reader through the shredder and the folds:
 *
 * - Reading 120, `qti-index`'s `n` at least 1 where it is a number (information model §5.72);
 * - Reading 123, `bdo`'s `dir` required and never `auto` (§5.11);
 * - Readings 124 and 125, a media URL that holds something other than spaces (§5.9.1, §5.135.1,
 *   §5.163.2, §5.166.1, §5.166.9; the HTML Standard's `srcset`);
 * - Reading 129, `lang`, `xml:lang` and `srclang` BCP 47 language tags (§5.15.3, §4.1.4, §5.163.3;
 *   XML 1.0 §2.12);
 * - Readings 132, 161 and 171, a printed variable's `format` a printf format string over the listed
 *   codes, `d` among them, of any number of conversions (§2.3.4; C11 §7.21.6.1; PR #46, comments
 *   6701102861 and 6722164084);
 * - Reading 2, MathML's `number` with no `+` and `cn`'s `base` a positive integer (MathML 3 §2.1.5.1,
 *   §4.2.1.3).
 */
import { assert, describe, it } from "@effect/vitest";
import { Effect, Result } from "effect";
import { composed } from "#pantry/grammar/compose.ts";
import type { PackageFile } from "#pantry/package/read.ts";
import { judge, lawsOf, ruleOf, shownBreach } from "#pantry/test/oracle.ts";
import type { Breach, Judgment, LawName, OracleRule } from "#pantry/test/oracle.ts";

/**
 * The composed grammar every case judges by.
 */
const grammar = Result.getOrThrow(composed());

/**
 * The tables the laws read, derived from {@link grammar} once.
 */
const laws = lawsOf(grammar);

/**
 * The QTI 3 ASI namespace, of every item element.
 */
const asi = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * The MathML namespace.
 */
const mathml = "http://www.w3.org/1998/Math/MathML";

/**
 * The media files the base package holds, which the media cases' URLs name.
 */
const media = ["a.mp3", "a.png", "a.vtt", "p.png", "v.mp4"] as const;

/**
 * Write the base manifest: one item resource that lists the item and every media file.
 *
 * @returns The manifest's text.
 */
const manifest = (): string =>
  `<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="M">
  <metadata><schema>QTI Package</schema><schemaversion>3.0.1</schemaversion></metadata>
  <organizations/>
  <resources><resource identifier="R" type="imsqti_item_xmlv3p0" href="item.xml"><file href="item.xml"/>${media.map((file) => `<file href="${file}"/>`).join("")}</resource></resources>
</manifest>`;

/**
 * The base item: one choice interaction bound to an identifier response, scored by matching it,
 * with an ordered outcome a `qti-index` reads and a body that later cases edit.
 */
const item = `<qti-assessment-item xmlns="${asi}" identifier="item" title="Item" time-dependent="false" xml:lang="en">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response><qti-value>A</qti-value></qti-correct-response>
  </qti-response-declaration>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>
  <qti-item-body>
    <p id="intro">Pick one.</p>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="A">A</qti-simple-choice>
      <qti-simple-choice identifier="B">B</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>
  <qti-response-processing>
    <qti-response-condition>
      <qti-response-if>
        <qti-match><qti-variable identifier="RESPONSE"/><qti-correct identifier="RESPONSE"/></qti-match>
        <qti-set-outcome-value identifier="SCORE"><qti-base-value base-type="float">1</qti-base-value></qti-set-outcome-value>
      </qti-response-if>
    </qti-response-condition>
  </qti-response-processing>
</qti-assessment-item>`;

/**
 * Build the base package with its item edited, each file's text encoded as UTF-8, as
 * `readPackage` returns one.
 *
 * @param text - The item's text.
 * @returns The entries, sorted by path.
 */
const packageOf = (text: string): readonly PackageFile[] =>
  Object.entries({
    "imsmanifest.xml": manifest(),
    "item.xml": text,
    ...Object.fromEntries(media.map((file) => [file, "media"])),
  })
    .map(([path, held]): PackageFile => ({
      bytes: new TextEncoder().encode(held),
      kind: path === "imsmanifest.xml" ? "manifest" : "file",
      path,
    }))
    .toSorted((left, right) => (left.path < right.path ? -1 : 1));

/**
 * Replace one passage of a text, failing when the text does not hold it, so a case never tests an
 * edit that did not happen.
 *
 * @param text - The text.
 * @param passage - The passage to replace.
 * @param replacement - What replaces it.
 * @returns The edited text.
 */
const edit = (text: string, passage: string, replacement: string): string => {
  assert.include(text, passage, "the edit's passage is in the text");

  return text.replace(passage, replacement);
};

/**
 * Replace one passage of the base item.
 *
 * @param passage - The passage to replace.
 * @param replacement - What replaces it.
 * @returns The edited item.
 */
const withItem = (passage: string, replacement: string): string => edit(item, passage, replacement);

/**
 * Edit the base item's body: put content after its first paragraph.
 *
 * @param content - The content, as written.
 * @returns The edited item.
 */
const withBody = (content: string): string =>
  withItem(`<p id="intro">Pick one.</p>`, `<p id="intro">Pick one.</p>${content}`);

/**
 * Edit the base item's response processing: set the score from an expression.
 *
 * @param expression - The expression, as written.
 * @returns The edited item.
 */
const withScore = (expression: string): string =>
  withItem(
    `<qti-set-outcome-value identifier="SCORE"><qti-base-value base-type="float">1</qti-base-value></qti-set-outcome-value>`,
    `<qti-set-outcome-value identifier="SCORE">${expression}</qti-set-outcome-value>`,
  );

/**
 * Judge the base package with its item edited, and read its breaches.
 *
 * @param text - The item's text.
 * @returns The breaches; a codec refusal fails the case.
 */
const breachesOf = (text: string) =>
  judge(packageOf(text), grammar, laws).pipe(
    Effect.map((judgment: Judgment): readonly Breach[] =>
      judgment._tag === "Judged"
        ? judgment.breaches
        : assert.fail(`the codec refused the package: ${judgment.rule}, ${judgment.detail}`),
    ),
  );

/**
 * Write breaches as lines, for an assertion's message.
 *
 * @param breaches - The breaches.
 * @returns One line per breach.
 */
const shown = (breaches: readonly Breach[]): string =>
  breaches.map((breach) => shownBreach(breach, grammar)).join("\n");

/**
 * One input a reading refuses: the item, the law and rule it is refused under, and the lexical
 * form the breach names, for a value domain's breach.
 */
interface Refused {
  readonly law: LawName;
  readonly lexical?: string;
  readonly name: string;
  readonly rule: OracleRule;
  readonly text: string;
}

/**
 * The inputs the readings refuse, each one edit from the base item.
 */
const refused: readonly Refused[] = [
  {
    law: "value domain",
    lexical: "0",
    name: 'reading 120: <qti-index n="0">',
    rule: "attribute-lexical",
    text: withScore(
      `<qti-index n="0"><qti-ordered><qti-base-value base-type="float">1</qti-base-value></qti-ordered></qti-index>`,
    ),
  },
  {
    law: "AL3 required",
    name: "reading 123: <bdo>x</bdo>",
    rule: "required-attribute",
    text: withBody("<p><bdo>x</bdo></p>"),
  },
  {
    law: "value domain",
    lexical: "auto",
    name: 'reading 123: <bdo dir="auto">',
    rule: "attribute-lexical",
    text: withBody(`<p><bdo dir="auto">x</bdo></p>`),
  },
  {
    law: "value domain",
    lexical: " ",
    name: 'reading 124: <video><source src=" "/></video>',
    rule: "attribute-lexical",
    text: withBody(`<video><source src=" "/></video>`),
  },
  {
    law: "value domain",
    lexical: "",
    name: 'reading 124: <audio src="">',
    rule: "attribute-lexical",
    text: withBody(`<audio src=""/>`),
  },
  {
    law: "value domain",
    lexical: "  ",
    name: 'reading 124: <video poster="  ">',
    rule: "attribute-lexical",
    text: withBody(`<video src="v.mp4" poster="  "/>`),
  },
  {
    law: "value domain",
    lexical: " ",
    name: 'reading 124: <picture><source srcset=" "/>',
    rule: "attribute-lexical",
    text: withBody(`<p><picture><source srcset=" "/><img src="a.png" alt="a"/></picture></p>`),
  },
  {
    law: "value domain",
    lexical: "\t",
    name: 'reading 125: <track src="&#9;">',
    rule: "attribute-lexical",
    text: withBody(`<video src="v.mp4"><track src="&#9;" srclang="en"/></video>`),
  },
  {
    law: "value domain",
    lexical: "en_US x",
    name: 'reading 129: <p lang="en_US x">',
    rule: "attribute-lexical",
    text: withBody(`<p lang="en_US x">x</p>`),
  },
  {
    law: "value domain",
    lexical: "english language",
    name: 'reading 129: <track srclang="english language">',
    rule: "attribute-lexical",
    text: withBody(`<video src="v.mp4"><track src="a.vtt" srclang="english language"/></video>`),
  },
  {
    law: "value domain",
    lexical: "",
    name: 'reading 129: <track srclang="">',
    rule: "attribute-lexical",
    text: withBody(`<video src="v.mp4"><track src="a.vtt" srclang=""/></video>`),
  },
  {
    law: "value domain",
    lexical: "",
    name: 'reading 129: <qti-assessment-item xml:lang="">',
    rule: "attribute-lexical",
    text: withItem(`xml:lang="en"`, `xml:lang=""`),
  },
  {
    law: "value domain",
    lexical: "en_US",
    name: `reading 129: <math><mi xml:lang="en_US">, under MathML's skip wildcard`,
    rule: "attribute-lexical",
    text: withBody(`<p><math xmlns="${mathml}"><mi xml:lang="en_US">x</mi></math></p>`),
  },
  {
    law: "value domain",
    lexical: "%q",
    name: 'reading 132: <qti-printed-variable format="%q">',
    rule: "attribute-lexical",
    text: withBody(`<p><qti-printed-variable identifier="SCORE" format="%q"/></p>`),
  },
  {
    law: "value domain",
    lexical: "+0.5",
    name: 'reading 2: <m:mstyle scriptsizemultiplier="+0.5">',
    rule: "attribute-lexical",
    text: withBody(
      `<p><m:math xmlns:m="${mathml}"><m:mstyle scriptsizemultiplier="+0.5"><m:mi>x</m:mi></m:mstyle></m:math></p>`,
    ),
  },
  {
    law: "value domain",
    lexical: "+10",
    name: 'reading 2: <m:cn base="+10">',
    rule: "attribute-lexical",
    text: withBody(`<p><m:math xmlns:m="${mathml}"><m:cn base="+10">10</m:cn></m:math></p>`),
  },
];

/**
 * The nearest valid inputs, each one edit from the base item.
 */
const accepted: readonly { readonly name: string; readonly text: string }[] = [
  {
    name: 'reading 120: <qti-index n="2">',
    text: withScore(
      `<qti-index n="2"><qti-ordered><qti-base-value base-type="float">1</qti-base-value><qti-base-value base-type="float">2</qti-base-value></qti-ordered></qti-index>`,
    ),
  },
  {
    name: 'reading 120: <qti-index n="N">, N an integer outcome',
    text: edit(
      withScore(
        `<qti-index n="N"><qti-ordered><qti-base-value base-type="float">1</qti-base-value></qti-ordered></qti-index>`,
      ),
      `<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>`,
      `<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/><qti-outcome-declaration identifier="N" cardinality="single" base-type="integer"/>`,
    ),
  },
  { name: 'reading 123: <bdo dir="rtl">', text: withBody(`<p><bdo dir="rtl">x</bdo></p>`) },
  {
    name: "readings 124, 125 and 129: media with URLs around spaces and a track's language",
    text: withBody(
      `<video src=" v.mp4 " poster="p.png"><track src="a.vtt" srclang="en-GB"/></video><video><source src="v.mp4"/></video><audio src="a.mp3"/><p><picture><source srcset="a.png"/><img src="a.png" alt="a"/></picture></p>`,
    ),
  },
  {
    name: "reading 129: an empty xml:lang and lang on a paragraph, and a grandfathered tag",
    text: withBody(`<p xml:lang="" lang="">x</p><p lang="i-klingon" xml:lang=" en-GB ">y</p>`),
  },
  {
    name: 'reading 132: <qti-printed-variable format="%.2f">, text around a conversion, and a format of none',
    text: withBody(
      `<p><qti-printed-variable identifier="SCORE" format="%.2f"/> <qti-printed-variable identifier="SCORE" format="Score: %i%%"/> <qti-printed-variable identifier="SCORE" format="100%%"/></p>`,
    ),
  },
  {
    name: 'reading 161: <qti-printed-variable format="%i of %i">, two conversions of one value, and several',
    text: withBody(
      `<p><qti-printed-variable identifier="SCORE" format="%i of %i"/> <qti-printed-variable identifier="SCORE" format="%%%e%%%G"/> <qti-printed-variable identifier="SCORE" format="%i, %.2f and %#x"/></p>`,
    ),
  },
  {
    name: 'reading 171: <qti-printed-variable format="%d">, and a format of d beside i',
    text: withBody(
      `<p><qti-printed-variable identifier="SCORE" format="%d"/> <qti-printed-variable identifier="SCORE" format="%d %d"/> <qti-printed-variable identifier="SCORE" format="%i of %d"/></p>`,
    ),
  },
  {
    name: "reading 2: scriptsizemultiplier -0.5 and .5, and cn bases 16 and ' 2 '",
    text: withBody(
      `<p><m:math xmlns:m="${mathml}"><m:mstyle scriptsizemultiplier="-0.5"><m:mstyle scriptsizemultiplier=".5"><m:mi>x</m:mi></m:mstyle></m:mstyle></m:math><m:math xmlns:m="${mathml}"><m:apply><m:plus/><m:cn base="16">FF</m:cn><m:cn base=" 2 ">10</m:cn></m:apply></m:math></p>`,
    ),
  },
];

describe("slice G's readings, on whole packages", () => {
  it.effect("the base item breaks no law", () =>
    Effect.gen(function* baseItem() {
      const breaches = yield* breachesOf(item);

      assert.deepStrictEqual(breaches, [], shown(breaches));
    }),
  );

  for (const { law, lexical, name, rule, text } of refused) {
    it.effect(`${name} is refused under ${rule}`, () =>
      Effect.gen(function* refusedInput() {
        const breaches = yield* breachesOf(text);

        assert.isTrue(
          breaches.some(
            (breach) =>
              breach.law === law &&
              ruleOf(breach.law) === rule &&
              (lexical === undefined || breach.keys["lexical"] === lexical),
          ),
          shown(breaches),
        );
      }),
    );
  }

  for (const { name, text } of accepted) {
    it.effect(`${name} breaks no law`, () =>
      Effect.gen(function* acceptedInput() {
        const breaches = yield* breachesOf(text);

        assert.deepStrictEqual(breaches, [], shown(breaches));
      }),
    );
  }
});

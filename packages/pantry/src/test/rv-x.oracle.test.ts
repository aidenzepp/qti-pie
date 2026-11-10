/**
 * Lane X's attribute readings judged on whole packages by the law oracle
 * (`#pantry/test/oracle.ts`): each input the readings refuse is refused under the law and rule its
 * reading names, and the nearest valid input breaks no law.
 *
 * Oracle: the law oracle reads the composed grammar's domains, uses and admissions through
 * `admissionOf` and `requiredOf`, and the codec refuses an attribute its element admits under no
 * name, so a grammar reading needs no oracle code of its own; these cases check that a package
 * reaches the reading, from the reader through the shredder and the folds:
 *
 * - Reading 9, the Schematron's ARIA role rules (ASI binding §5.3.1): no `role` on a `source`, and an
 *   `h1`'s `role` is `heading`, `tab` or `presentation`;
 * - Reading 135, a MIME type is RFC 2045's type and subtype (information model §7.25, §5.1.2,
 *   §5.135.2; RFC 2045 §5.1), on an `a`, an `object`, a `source` and the upload interaction's
 *   list;
 * - Reading 136, a `default` shape carries `coords` (the XSD's `use="required"`, and the information
 *   model's multiplicity [1], §5.67.5).
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
 * The media files the base package holds, which the cases' URLs name.
 */
const media = ["a.png", "a.svg", "v.mp4"] as const;

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
 * The base item's choice interaction, which the hotspot and upload cases replace.
 */
const choiceInteraction = `<qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="A">A</qti-simple-choice>
      <qti-simple-choice identifier="B">B</qti-simple-choice>
    </qti-choice-interaction>`;

/**
 * The base item: one choice interaction bound to an identifier response, scored by matching it,
 * with a body that later cases edit.
 */
const item = `<qti-assessment-item xmlns="${asi}" identifier="item" title="Item" time-dependent="false" xml:lang="en">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response><qti-value>A</qti-value></qti-correct-response>
  </qti-response-declaration>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>
  <qti-item-body>
    <p id="intro">Pick one.</p>
    ${choiceInteraction}
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
 * `readEntries` returns one.
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
 * Edit the base item's body: put content after its first paragraph.
 *
 * @param content - The content, as written.
 * @returns The edited item.
 */
const withBody = (content: string): string =>
  edit(item, `<p id="intro">Pick one.</p>`, `<p id="intro">Pick one.</p>${content}`);

/**
 * Replace the base item's choice interaction with a hotspot interaction over `a.png` holding the
 * choices given.
 *
 * @param choices - The hotspot choices, as written.
 * @returns The edited item.
 */
const withHotspots = (choices: string): string =>
  edit(
    item,
    choiceInteraction,
    `<qti-hotspot-interaction response-identifier="RESPONSE" max-choices="1"><object data="a.png" type="image/png"/>${choices}</qti-hotspot-interaction>`,
  );

/**
 * Replace the base item's choice interaction with an upload interaction bound to a file response,
 * its `type` as written.
 *
 * @param type - The interaction's `type`.
 * @returns The edited item.
 */
const withUpload = (type: string): string =>
  edit(
    edit(
      edit(
        item,
        choiceInteraction,
        `<qti-upload-interaction response-identifier="FILE" type="${type}"/>`,
      ),
      `<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>`,
      `<qti-response-declaration identifier="FILE" cardinality="single" base-type="file"/><qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>`,
    ),
    `<qti-match><qti-variable identifier="RESPONSE"/><qti-correct identifier="RESPONSE"/></qti-match>`,
    `<qti-is-null><qti-variable identifier="FILE"/></qti-is-null>`,
  );

/**
 * Judge the base package with its item edited.
 *
 * @param text - The item's text.
 * @returns The judgment.
 */
const judged = (text: string): Effect.Effect<Judgment> => judge(packageOf(text), grammar, laws);

/**
 * Write breaches as lines, for an assertion's message.
 *
 * @param breaches - The breaches.
 * @returns One line per breach.
 */
const shown = (breaches: readonly Breach[]): string =>
  breaches.map((breach) => shownBreach(breach, grammar)).join("\n");

/**
 * Write a judgment as text, for an assertion's message: the codec's refusal, or the breaches.
 *
 * @param judgment - The judgment.
 * @returns The text.
 */
const shownJudgment = (judgment: Judgment): string =>
  judgment._tag === "Judged"
    ? shown(judgment.breaches)
    : `codec: ${judgment.rule}, ${judgment.detail}`;

/**
 * One input a reading refuses: the item, the law and rule it is refused under, and the lexical
 * form the breach names, for a value domain's breach; a `codec` case is refused before any law,
 * by the codec's rule.
 */
type Refused =
  | {
      readonly _tag: "law";
      readonly law: LawName;
      readonly lexical?: string;
      readonly name: string;
      readonly rule: OracleRule;
      readonly text: string;
    }
  | { readonly _tag: "codec"; readonly name: string; readonly rule: string; readonly text: string };

/**
 * The inputs the readings refuse, each one edit from the base item.
 */
const refused: readonly Refused[] = [
  {
    _tag: "codec",
    name: 'reading 9: <video><source src="v.mp4" role="img"/></video>',
    rule: "attribute-admission",
    text: withBody(`<video><source src="v.mp4" role="img"/></video>`),
  },
  {
    _tag: "law",
    law: "value domain",
    lexical: "button",
    name: 'reading 9: <h1 role="button">',
    rule: "attribute-lexical",
    text: withBody(`<h1 role="button">x</h1>`),
  },
  {
    _tag: "law",
    law: "value domain",
    lexical: "Heading",
    name: 'reading 9: <h1 role="Heading">, compared as written',
    rule: "attribute-lexical",
    text: withBody(`<h1 role="Heading">x</h1>`),
  },
  {
    _tag: "law",
    law: "value domain",
    lexical: "image /png",
    name: 'reading 135: <a type="image /png">',
    rule: "attribute-lexical",
    text: withBody(`<p><a href="a.png" type="image /png">a</a></p>`),
  },
  {
    _tag: "law",
    law: "value domain",
    lexical: " image/png",
    name: 'reading 135: <object type=" image/png">',
    rule: "attribute-lexical",
    text: withBody(`<p><object data="a.png" type=" image/png"/></p>`),
  },
  {
    _tag: "law",
    law: "value domain",
    lexical: "video/mp4\u007F",
    name: 'reading 135: <source type="video/mp4&#127;">',
    rule: "attribute-lexical",
    text: withBody(`<video><source src="v.mp4" type="video/mp4&#127;"/></video>`),
  },
  {
    _tag: "law",
    law: "value domain",
    lexical: "image/png\ttext/plain\u007F",
    name: 'reading 135: <qti-upload-interaction type="image/png&#9;text/plain&#127;">',
    rule: "attribute-lexical",
    text: withUpload("image/png&#9;text/plain&#127;"),
  },
  {
    _tag: "law",
    law: "AL3 required",
    name: 'reading 136: <qti-hotspot-choice shape="default"/>, no coords',
    rule: "required-attribute",
    text: withHotspots(
      `<qti-hotspot-choice identifier="A" shape="rect" coords="0,0,1,1"/><qti-hotspot-choice identifier="B" shape="default"/>`,
    ),
  },
];

/**
 * The nearest valid inputs, each one edit from the base item.
 */
const accepted: readonly { readonly name: string; readonly text: string }[] = [
  {
    name: "reading 9: an h1 of each of its three roles, an h2 a button, and a source with no role",
    text: withBody(
      `<h1 role="heading">x</h1><h1 role="tab">y</h1><h1 role="presentation">z</h1><h1>w</h1><h2 role="button">v</h2><video><source src="v.mp4" type="video/mp4"/></video>`,
    ),
  },
  {
    name: "reading 135: MIME types of both cases, with a suffix, and an upload list between spaces",
    text: withBody(
      `<p><a href="a.png" type="IMAGE/PNG">a</a><object data="a.svg" type="image/svg+xml"/></p>`,
    ),
  },
  {
    name: 'reading 135: <qti-upload-interaction type=" image/png  text/plain ">',
    text: withUpload(" image/png  text/plain "),
  },
  {
    name: 'reading 136: <qti-hotspot-choice shape="default" coords="0,0,1">, last',
    text: withHotspots(
      `<qti-hotspot-choice identifier="A" shape="rect" coords="0,0,1,1"/><qti-hotspot-choice identifier="B" shape="default" coords="0,0,1"/>`,
    ),
  },
];

describe("lane X's readings, on whole packages", () => {
  it.effect("the base item breaks no law", () =>
    Effect.gen(function* baseItem() {
      const judgment = yield* judged(item);

      assert.isTrue(
        judgment._tag === "Judged" && judgment.breaches.length === 0,
        shownJudgment(judgment),
      );
    }),
  );

  for (const refusal of refused) {
    it.effect(`${refusal.name} is refused under ${refusal.rule}`, () =>
      Effect.gen(function* refusedInput() {
        const judgment = yield* judged(refusal.text);
        if (refusal._tag === "codec") {
          assert.isTrue(
            judgment._tag === "CodecRefusal" && judgment.rule === refusal.rule,
            shownJudgment(judgment),
          );

          return;
        }

        assert.isTrue(
          judgment._tag === "Judged" &&
            judgment.breaches.some(
              (breach) =>
                breach.law === refusal.law &&
                ruleOf(breach.law) === refusal.rule &&
                (refusal.lexical === undefined || breach.keys["lexical"] === refusal.lexical),
            ),
          shownJudgment(judgment),
        );
      }),
    );
  }

  for (const { name, text } of accepted) {
    it.effect(`${name} breaks no law`, () =>
      Effect.gen(function* acceptedInput() {
        const judgment = yield* judged(text);

        assert.isTrue(
          judgment._tag === "Judged" && judgment.breaches.length === 0,
          shownJudgment(judgment),
        );
      }),
    );
  }
});

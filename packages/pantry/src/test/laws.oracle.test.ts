import { NodeServices } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { boolean, element, int } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Formatter, Option } from "effect";
import { inject } from "vitest";
import { foldGrammarOf, shredGrammarOf } from "#pantry/model/composed.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { fold } from "#pantry/model/folds.ts";
import type { FoldedAttribute, FoldedNode, FoldedRows } from "#pantry/model/folds.ts";
import { shred } from "#pantry/model/shred.ts";
import type { NodeId } from "#pantry/model/xdm.ts";
import { readPackage } from "#pantry/package/read.ts";
import {
  contentLawOf,
  documentBreaches,
  explain,
  boundBroken,
  judge,
  lawNames,
  ruleOf,
  verdictOf,
} from "#pantry/test/oracle.ts";
import type { Breach, Judgment, LawName, OracleRule } from "#pantry/test/oracle.ts";
import {
  asi,
  base,
  breachesOf,
  contextPci,
  edit,
  grammar,
  item,
  itemResource,
  judged,
  laws,
  manifestOf,
  refusedBy,
  shown,
  test,
  withItem,
} from "#pantry/test/probe.ts";
import { mathmlNamespace } from "#pantry/vocab/namespaces.ts";
import { readXml } from "@qti-pie/crust/read.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard, never a budget. Measured 2026-11-07: 79.8 s at a load average of 68 to
 * 108, its slowest test.
 */
const testTimeoutMs = 600_000;

/**
 * The fixtures the global setup materializes; `simple` is one the importer accepts today.
 */
const fixtures = inject("fixtures");

/**
 * One package that breaks one law: the law it breaks and the rule that law keeps.
 */
interface LawCase {
  readonly files: Readonly<Record<string, string>>;
  readonly law: LawName;
  readonly name: string;
  readonly rule: OracleRule;
}

/**
 * The breaches of "Feedback outcome type" among a judgment's.
 *
 * @param breaches - The breaches.
 * @returns Those of that law.
 */
const testFeedbackTyped = (breaches: readonly Breach[]) =>
  breaches.filter(({ law }) => law === "Feedback outcome type");

/**
 * Write a package whose test declares one outcome and names it from a `qti-test-feedback`.
 *
 * @param outcome - The outcome's identifier.
 * @param baseType - The outcome's base type, of single cardinality; null declares no outcome, as a
 *   built-in session variable's name has none.
 * @returns The package.
 */
const testFeedbackPackage = (outcome: string, baseType: string | null) => ({
  "imsmanifest.xml": manifestOf(
    `${itemResource}<resource identifier="RT" type="imsqti_test_xmlv3p0" href="test.xml"><file href="test.xml"/></resource>`,
  ),
  "item.xml": item,
  "test.xml": edit(
    edit(
      test,
      "</qti-test-part>",
      `</qti-test-part><qti-test-feedback access="during" outcome-identifier="${outcome}" show-hide="show" identifier="F"><qti-content-body><p>Seen.</p></qti-content-body></qti-test-feedback>`,
    ),
    '<qti-test-part identifier="P"',
    `${baseType === null ? "" : `<qti-outcome-declaration identifier="${outcome}" cardinality="single" base-type="${baseType}"/>`}<qti-test-part identifier="P"`,
  ),
});

/**
 * Write a package whose test declares one outcome, of single cardinality, before its test part.
 *
 * @param outcome - The outcome's identifier.
 * @param baseType - The outcome's base type.
 * @returns The package.
 */
const testOutcomePackage = (outcome: string, baseType: string) => ({
  "imsmanifest.xml": manifestOf(
    `${itemResource}<resource identifier="RT" type="imsqti_test_xmlv3p0" href="test.xml"><file href="test.xml"/></resource>`,
  ),
  "item.xml": item,
  "test.xml": edit(
    test,
    '<qti-test-part identifier="P"',
    `<qti-outcome-declaration identifier="${outcome}" cardinality="single" base-type="${baseType}"/><qti-test-part identifier="P"`,
  ),
});

/**
 * Judge a package whose test declares one outcome, and decide whether "Reserved type" refuses it.
 *
 * @param identifier - The outcome's identifier.
 * @param baseType - The outcome's base type.
 * @returns Whether a breach of the law is among the judgment's, with every breach for a message.
 */
const testOutcome = (identifier: string, baseType: string) =>
  judged(testOutcomePackage(identifier, baseType)).pipe(
    Effect.map((judgment) => {
      const breaches = breachesOf(judgment);

      return {
        breaches: shown(breaches),
        held: breaches.some(({ law }) => law === "Reserved type"),
      };
    }),
  );

/**
 * Write a package whose tests each declare the outcome the section document's rubric names, in the
 * base type given for them, and reach that document through a section ref; the rubric names it from
 * a `qti-feedback-inline`.
 *
 * @param baseTypes - Each test's base type for the outcome, of single cardinality; null declares no
 *   outcome, as a built-in session variable's name has none.
 * @param outcome - The outcome's identifier.
 * @returns The package.
 */
const sectionFeedbackPackage = (baseTypes: readonly (string | null)[], outcome = "FLAG") => ({
  "imsmanifest.xml": manifestOf(
    `${itemResource}<resource identifier="RS" type="imsqti_section_xmlv3p0" href="section.xml"><file href="section.xml"/></resource>${baseTypes
      .map(
        (_, at) =>
          `<resource identifier="RT${String(at)}" type="imsqti_test_xmlv3p0" href="test${String(at)}.xml"><file href="test${String(at)}.xml"/></resource>`,
      )
      .join("")}`,
  ),
  "item.xml": item,
  "section.xml": `<qti-assessment-section xmlns="${asi}" identifier="SS" title="Shared" visible="true"><qti-rubric-block view="candidate"><qti-content-body><p><qti-feedback-inline outcome-identifier="${outcome}" identifier="ok" show-hide="show">Well done.</qti-feedback-inline></p></qti-content-body></qti-rubric-block><qti-assessment-item-ref identifier="J" href="item.xml"/></qti-assessment-section>`,
  ...Object.fromEntries(
    baseTypes.map((baseType, at) => [
      `test${String(at)}.xml`,
      edit(
        edit(
          test,
          "</qti-assessment-section>",
          `<qti-assessment-section-ref identifier="R" href="section.xml"/></qti-assessment-section>`,
        ),
        '<qti-test-part identifier="P"',
        `${baseType === null ? "" : `<qti-outcome-declaration identifier="${outcome}" cardinality="single" base-type="${baseType}"/>`}<qti-test-part identifier="P"`,
      ),
    ]),
  ),
});

/**
 * The breaches of "Item duration" among a judgment's.
 *
 * @param breaches - The breaches.
 * @returns Those of that law.
 */
const itemDurationBreaches = (breaches: readonly Breach[]) =>
  breaches.filter(({ law }) => law === "Item duration");

/**
 * Write a package whose test reads `variable` into a float outcome from its outcome processing,
 * over an item that is, or is not, time dependent.
 *
 * @param variable - The test-level variable reference the test reads.
 * @param timeDependent - The item's `time-dependent`.
 * @returns The package.
 */
const durationReadPackage = (variable: string, timeDependent: boolean) => ({
  "imsmanifest.xml": manifestOf(
    `${itemResource}<resource identifier="RT" type="imsqti_test_xmlv3p0" href="test.xml"><file href="test.xml"/></resource>`,
  ),
  "item.xml": edit(item, 'time-dependent="false"', `time-dependent="${String(timeDependent)}"`),
  "test.xml": edit(
    edit(
      test,
      "</qti-test-part>",
      `</qti-test-part><qti-outcome-processing><qti-set-outcome-value identifier="TIMED"><qti-variable identifier="${variable}"/></qti-set-outcome-value></qti-outcome-processing>`,
    ),
    '<qti-test-part identifier="P"',
    `<qti-outcome-declaration identifier="TIMED" cardinality="single" base-type="float"/><qti-test-part identifier="P"`,
  ),
});

/**
 * The packages that break each law the oracle reads from documents, one case per law.
 */
const lawCases: readonly LawCase[] = [
  {
    files: {
      ...base,
      "item.xml": edit(
        edit(
          item,
          `<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>`,
          "",
        ),
        "<qti-response-processing>",
        `<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/><qti-response-processing>`,
      ),
    },
    law: "N5 Follow",
    name: "an outcome declaration after the item body",
    rule: "ordering",
  },
  {
    files: withItem(
      `<p id="intro">Pick one.</p>`,
      `<qti-hottext-interaction response-identifier="RESPONSE"><p>Type <qti-text-entry-interaction response-identifier="RESPONSE"/></p></qti-hottext-interaction>`,
    ),
    law: "N6 ancestry",
    name: "a text entry inside a hottext interaction",
    rule: "ancestry-ban",
  },
  {
    files: withItem(
      `<qti-simple-choice identifier="A">A</qti-simple-choice>
      <qti-simple-choice identifier="B">B</qti-simple-choice>`,
      "",
    ),
    law: "N7 Last",
    name: "a choice interaction without a choice",
    rule: "child-set",
  },
  {
    files: withItem(
      `<qti-correct-response><qti-value>A</qti-value></qti-correct-response>`,
      `<qti-correct-response><qti-value>A</qti-value></qti-correct-response><qti-correct-response><qti-value>B</qti-value></qti-correct-response>`,
    ),
    law: "N5 Follow",
    name: "a response declaration with two correct responses",
    rule: "ordering",
  },
  {
    files: withItem(
      `<p id="intro">Pick one.</p>`,
      `<p id="intro">Pick one.</p><qti-match-interaction response-identifier="RESPONSE" max-associations="1"><qti-simple-match-set><qti-simple-associable-choice identifier="M" match-max="1">M</qti-simple-associable-choice></qti-simple-match-set></qti-match-interaction>`,
    ),
    law: "N7 Counted",
    name: "a match interaction with one match set",
    rule: "child-set",
  },
  {
    files: withItem(
      `<p id="intro">Pick one.</p>`,
      `<p id="intro">Pick one.</p><table><colgroup span="2"><col/></colgroup><tr><td>x</td></tr></table>`,
    ),
    law: "N7 barred by",
    name: "a column group with a span and a column",
    rule: "child-set",
  },
  {
    files: withItem(
      `<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>`,
      `<qti-outcome-declaration identifier="SCORE" base-type="float"/>`,
    ),
    law: "AL3 required",
    name: "an outcome declaration without a cardinality",
    rule: "required-attribute",
  },
  {
    files: withItem(`max-choices="1"`, `max-choices="one"`),
    law: "value domain",
    name: "a count that is no integer",
    rule: "attribute-lexical",
  },
  {
    files: withItem(`<p id="intro">`, `<p id="intro" aria-labelledby="nowhere">`),
    law: "Idref target",
    name: "an IDREF naming no id",
    rule: "idref-target",
  },
];

/**
 * The packages that break each overlay and package law, one case per law.
 */
const overlayCases: readonly LawCase[] = [
  {
    files: withItem(
      `cardinality="single" base-type="identifier"`,
      `cardinality="single" base-type="float"`,
    ),
    law: "BindingFit",
    name: "a choice interaction bound to a float",
    rule: "binding-fit",
  },
  {
    files: withItem(`max-choices="1"`, `max-choices="1" min-choices="2"`),
    law: "Choice bounds",
    name: "a minimum above the maximum",
    rule: "choice-bounds",
  },
  {
    files: withItem(
      `<p id="intro">Pick one.</p>`,
      `<p id="intro">Pick <qti-feedback-inline outcome-identifier="NOWHERE" identifier="F" show-hide="show">well</qti-feedback-inline>.</p>`,
    ),
    law: "Feedback reference",
    name: "feedback naming no outcome",
    rule: "feedback-ref",
  },
  {
    files: withItem(
      `<qti-variable identifier="RESPONSE"/><qti-correct identifier="RESPONSE"/>`,
      `<qti-variable identifier="RESPONSE"/>`,
    ),
    law: "Arity",
    name: "a match of one operand",
    rule: "P2",
  },
  {
    files: withItem(`<qti-correct identifier="RESPONSE"/>`, `<qti-correct identifier="NOWHERE"/>`),
    law: "Variable declared",
    name: "processing naming no variable",
    rule: "P8",
  },
  {
    files: withItem(
      `base-type="identifier">
    <qti-correct-response><qti-value>A</qti-value></qti-correct-response>`,
      `base-type="file">
    <qti-correct-response><qti-value>A</qti-value></qti-correct-response><qti-mapping default-value="0"><qti-map-entry map-key="A" mapped-value="1"/></qti-mapping>`,
    ),
    law: "MappableBaseType",
    name: "a mapping of files",
    rule: "mapping-base-type",
  },
  {
    files: {
      ...base,
      "imsmanifest.xml": manifestOf(
        edit(itemResource, `type="imsqti_item_xmlv3p0"`, `type="imsqti_item_xmlv9"`),
      ),
    },
    law: "value domain",
    name: "a resource type no version admits (spec reading 67: its version's enumeration)",
    rule: "attribute-lexical",
  },
  {
    files: {
      ...base,
      "imsmanifest.xml": manifestOf(
        edit(itemResource, `type="imsqti_item_xmlv3p0"`, `type="imsqti_test_xmlv3p0"`),
      ),
    },
    law: "RootOfType",
    name: "an item listed as a test",
    rule: "root-type-reverse",
  },
  {
    files: { ...base, "notes.txt": "unlisted" },
    law: "File listed",
    name: "an entry no file lists",
    rule: "file-listed",
  },
  {
    files: {
      ...base,
      "imsmanifest.xml": manifestOf(edit(itemResource, `<file href="item.xml"/>`, "")),
    },
    law: "Href listed",
    name: "a resource href none of its files lists",
    rule: "href-listed",
  },
  {
    files: {
      "imsmanifest.xml": manifestOf(itemResource),
    },
    law: "Document entry",
    name: "a listed document that is no entry",
    rule: "entry-kind",
  },
  {
    files: {
      ...base,
      "imsmanifest.xml": manifestOf(edit(itemResource, `identifier="R"`, `identifier="M"`)),
    },
    law: "Manifest id space",
    name: "a resource named as its manifest",
    rule: "manifest-id-space",
  },
  {
    files: {
      ...base,
      "imsmanifest.xml": manifestOf(
        edit(
          itemResource,
          `<file href="item.xml"/>`,
          `<metadata><lom xmlns="http://ltsc.ieee.org/xsd/LOM"><general><identifier><catalog>c</catalog><entry>other</entry></identifier></general></lom></metadata><file href="item.xml"/>`,
        ),
      ),
    },
    law: "LomObjectIdentifier",
    name: "a record naming another item",
    rule: "lom-identifier",
  },
  {
    files: {
      "imsmanifest.xml": manifestOf(
        `${itemResource}<resource identifier="RT" type="imsqti_test_xmlv3p0" href="test.xml"><file href="test.xml"/></resource>`,
      ),
      "item.xml": item,
      "test.xml": edit(test, `select="1"`, `select="3"`),
    },
    law: "Selection bound",
    name: "a section selecting more than it holds",
    rule: "selection-bounds",
  },
  {
    files: withItem("<qti-value>A</qti-value>", '<qti-value base-type="identifier">A</qti-value>'),
    law: "Value cardinality",
    name: "a single variable's value that writes a base-type, as only a record's field does",
    rule: "value-cardinality",
  },
  {
    files: withItem(
      `<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>`,
      `<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/><qti-outcome-declaration identifier="TALLY" cardinality="record"><qti-default-value><qti-value field-identifier="count">1</qti-value></qti-default-value></qti-outcome-declaration>`,
    ),
    law: "Value cardinality",
    name: "a record's field that writes no base-type",
    rule: "value-cardinality",
  },
  {
    files: {
      "imsmanifest.xml": manifestOf(
        `${itemResource}<resource identifier="RG" type="imsqti_item_xmlv3p0" href="ghost.xml"><file href="ghost.xml"/></resource><resource identifier="RT" type="imsqti_test_xmlv3p0" href="test.xml"><file href="test.xml"/></resource>`,
      ),
      "item.xml": item,
      "test.xml": edit(
        edit(test, `select="1"`, `select="2"`),
        `<qti-assessment-item-ref identifier="I" href="item.xml"/>`,
        `<qti-assessment-item-ref identifier="I" href="item.xml"/><qti-assessment-item-ref identifier="G" href="ghost.xml"/>`,
      ),
    },
    law: "Item ref target",
    name: "an item ref to an item resource whose file the package does not hold",
    rule: "item-ref-target",
  },
];

describe("the base packages", () => {
  it.effect("an item and its manifest break no law", () =>
    Effect.gen(function* baseItem() {
      const judgment = yield* judged(base);
      const breaches = breachesOf(judgment);

      assert.deepStrictEqual(breaches, [], shown(breaches));
      assert.deepStrictEqual(judgment._tag === "Judged" ? judgment.documents : [], [
        "imsmanifest.xml",
        "item.xml",
      ]);
    }),
  );

  it.effect("a test, its item and their manifest break no law", () =>
    Effect.gen(function* baseTest() {
      const breaches = breachesOf(
        yield* judged({
          "imsmanifest.xml": manifestOf(
            `${itemResource}<resource identifier="RT" type="imsqti_test_xmlv3p0" href="test.xml"><file href="test.xml"/></resource>`,
          ),
          "item.xml": item,
          "test.xml": test,
        }),
      );

      assert.deepStrictEqual(breaches, [], shown(breaches));
    }),
  );
});

/**
 * Replace the base item's choice interaction with a hotspot interaction over an image.
 *
 * @param choices - The interaction's hotspot choices, as written.
 * @returns The base package with the item edited.
 */
const hotspots = (choices: string) =>
  withItem(
    `<qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="A">A</qti-simple-choice>
      <qti-simple-choice identifier="B">B</qti-simple-choice>
    </qti-choice-interaction>`,
    `<qti-hotspot-interaction response-identifier="RESPONSE" max-choices="1"><object data="a.png" type="image/png"/>${choices}</qti-hotspot-interaction>`,
  );

/**
 * The base item's choice interaction, as written.
 */
const choiceInteraction = `<qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-simple-choice identifier="A">A</qti-simple-choice>
      <qti-simple-choice identifier="B">B</qti-simple-choice>
    </qti-choice-interaction>`;

/**
 * A graphic gap match interaction over an image, with one associable hotspot.
 *
 * @param area - The hotspot's `shape` and `coords`, as written.
 * @returns The interaction.
 */
const graphicGapMatch = (area: string): string =>
  `<qti-graphic-gap-match-interaction response-identifier="RESPONSE"><object data="a.png" type="image/png"/><qti-gap-img identifier="G" match-max="1"><object data="g.png" type="image/png"/></qti-gap-img><qti-associable-hotspot identifier="H" match-max="1" ${area}/></qti-graphic-gap-match-interaction>`;

/**
 * A portable custom interaction that passes one template variable to its module (§7.38.1).
 *
 * @param identifier - The template variable it names.
 * @returns The interaction.
 */
const templatePci = (identifier: string): string =>
  `<qti-portable-custom-interaction response-identifier="RESPONSE" module="m" custom-interaction-type-identifier="t"><qti-interaction-modules><qti-interaction-module id="m" primary-path="m.js"/></qti-interaction-modules><qti-template-variable template-identifier="${identifier}"/><qti-interaction-markup/></qti-portable-custom-interaction>`;

/**
 * The base item's paragraph with inline feedback on an outcome.
 *
 * @param outcome - The outcome the feedback names.
 * @returns The paragraph.
 */
const feedback = (outcome: string): string =>
  `<p id="intro">Pick <qti-feedback-inline outcome-identifier="${outcome}" identifier="F" show-hide="show">well</qti-feedback-inline>.</p>`;

/**
 * The base item's paragraph followed by an extended text interaction bound to `TEXT`.
 *
 * @param bounds - The interaction's `min-strings` and `max-strings`, as written.
 * @returns The content.
 */
const extended = (bounds: string): string =>
  `<p id="intro">Pick one.</p><qti-extended-text-interaction response-identifier="TEXT" ${bounds}/>`;

describe("the information model's rules RD found unowned (unowned-readings.md §13)", () => {
  it.effect(
    "Binding cardinality: a most of 2 or 0 binds a multiple response, and a single one breaks it",
    () =>
      Effect.gen(function* bindingCardinality() {
        const two = yield* refusedBy("Binding cardinality", [`max-choices="1"`, `max-choices="2"`]);
        const zero = yield* refusedBy("Binding cardinality", [
          `max-choices="1"`,
          `max-choices="0"`,
        ]);
        const multiple = yield* refusedBy(
          "Binding cardinality",
          [`max-choices="1"`, `max-choices="2"`],
          [
            `cardinality="single" base-type="identifier"`,
            `cardinality="multiple" base-type="identifier"`,
          ],
        );
        const one = yield* refusedBy("Binding cardinality");

        assert.isTrue(two.held, two.breaches);
        assert.isTrue(zero.held, zero.breaches);
        assert.isFalse(multiple.held, multiple.breaches);
        assert.isFalse(one.held, one.breaches);
      }),
  );

  it.effect("Feedback outcome type: a feedback element names an identifier outcome", () =>
    Effect.gen(function* feedbackType() {
      const float = yield* refusedBy("Feedback outcome type", [
        `<p id="intro">Pick one.</p>`,
        feedback("SCORE"),
      ]);
      const identifier = yield* refusedBy(
        "Feedback outcome type",
        [`<p id="intro">Pick one.</p>`, feedback("FEEDBACK")],
        [
          `<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>`,
          `<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/><qti-outcome-declaration identifier="FEEDBACK" cardinality="single" base-type="identifier"/>`,
        ],
      );
      const builtIn = yield* refusedBy("Feedback outcome type", [
        `<p id="intro">Pick one.</p>`,
        feedback("completionStatus"),
      ]);

      const numAttempts = yield* refusedBy("Feedback outcome type", [
        `<p id="intro">Pick one.</p>`,
        feedback("numAttempts"),
      ]);
      const duration = yield* refusedBy("Feedback outcome type", [
        `<p id="intro">Pick one.</p>`,
        feedback("duration"),
      ]);

      assert.isTrue(float.held, float.breaches);
      assert.isFalse(identifier.held, identifier.breaches);
      assert.isFalse(builtIn.held, builtIn.breaches);
      assert.isTrue(numAttempts.held, numAttempts.breaches);
      assert.isTrue(duration.held, duration.breaches);
    }),
  );

  it.effect(
    "Reserved type: SCORE and MAXSCORE are a float in an item (§2.2.2.3: 'Items that declare ... SCORE MUST be a float'), of any base type in a test, and PASSED a boolean in both",
    () =>
      Effect.gen(function* reservedType() {
        const score = `<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>`;
        const itemOutcome = (identifier: string, baseType: string) =>
          refusedBy("Reserved type", [
            score,
            `<qti-outcome-declaration identifier="${identifier}" cardinality="single" base-type="${baseType}"/>`,
          ]);

        const itemScore = yield* itemOutcome("SCORE", "integer");
        const itemMaxScore = yield* itemOutcome("MAXSCORE", "integer");
        const itemPassed = yield* itemOutcome("PASSED", "integer");
        const itemFloat = yield* itemOutcome("SCORE", "float");
        const testScore = yield* testOutcome("SCORE", "integer");
        const testMaxScore = yield* testOutcome("MAXSCORE", "integer");
        const testFloat = yield* testOutcome("SCORE", "float");
        const testPassed = yield* testOutcome("PASSED", "integer");
        const testBoolean = yield* testOutcome("PASSED", "boolean");

        assert.isTrue(itemScore.held, itemScore.breaches);
        assert.isTrue(itemMaxScore.held, itemMaxScore.breaches);
        assert.isTrue(itemPassed.held, itemPassed.breaches);
        assert.isFalse(itemFloat.held, itemFloat.breaches);
        assert.isFalse(testScore.held, testScore.breaches);
        assert.isFalse(testMaxScore.held, testMaxScore.breaches);
        assert.isFalse(testFloat.held, testFloat.breaches);
        assert.isTrue(testPassed.held, testPassed.breaches);
        assert.isFalse(testBoolean.held, testBoolean.breaches);
      }),
  );

  it.effect(
    "Item duration: a test reads the duration of an item that is not time dependent, and a part's or a section's is its own",
    () =>
      Effect.gen(function* testItemDuration() {
        const untimed = itemDurationBreaches(
          breachesOf(yield* judged(durationReadPackage("I.duration", false))),
        );
        const timed = itemDurationBreaches(
          breachesOf(yield* judged(durationReadPackage("I.duration", true))),
        );
        const part = itemDurationBreaches(
          breachesOf(yield* judged(durationReadPackage("P.duration", false))),
        );
        const section = itemDurationBreaches(
          breachesOf(yield* judged(durationReadPackage("S.duration", false))),
        );

        assert.strictEqual(untimed.length, 1, shown(untimed));
        assert.strictEqual(timed.length, 0, shown(timed));
        assert.strictEqual(part.length, 0, shown(part));
        assert.strictEqual(section.length, 0, shown(section));
      }),
  );

  it.effect("Feedback outcome type: a test's feedback names an identifier outcome", () =>
    Effect.gen(function* testFeedbackType() {
      const float = testFeedbackTyped(
        breachesOf(yield* judged(testFeedbackPackage("PROGRESS", "float"))),
      );
      const identifier = testFeedbackTyped(
        breachesOf(yield* judged(testFeedbackPackage("FEEDBACK", "identifier"))),
      );

      const numAttempts = testFeedbackTyped(
        breachesOf(yield* judged(testFeedbackPackage("numAttempts", null))),
      );
      const duration = testFeedbackTyped(
        breachesOf(yield* judged(testFeedbackPackage("duration", null))),
      );
      const completionStatus = testFeedbackTyped(
        breachesOf(yield* judged(testFeedbackPackage("completionStatus", null))),
      );

      assert.strictEqual(float.length, 1, shown(float));
      assert.strictEqual(identifier.length, 0, shown(identifier));
      assert.strictEqual(numAttempts.length, 1, shown(numAttempts));
      assert.strictEqual(duration.length, 1, shown(duration));
      assert.strictEqual(completionStatus.length, 0, shown(completionStatus));
    }),
  );

  it.effect(
    "Feedback outcome type: a section document's feedback names an identifier outcome of each test that reaches it",
    () =>
      Effect.gen(function* sectionFeedbackType() {
        const float = testFeedbackTyped(
          breachesOf(yield* judged(sectionFeedbackPackage(["float"]))),
        );
        const identifier = testFeedbackTyped(
          breachesOf(yield* judged(sectionFeedbackPackage(["identifier"]))),
        );
        const both = testFeedbackTyped(
          breachesOf(yield* judged(sectionFeedbackPackage(["identifier", "float"]))),
        );

        const numAttempts = testFeedbackTyped(
          breachesOf(yield* judged(sectionFeedbackPackage([null], "numAttempts"))),
        );
        const duration = testFeedbackTyped(
          breachesOf(yield* judged(sectionFeedbackPackage([null], "duration"))),
        );
        const completionStatus = testFeedbackTyped(
          breachesOf(yield* judged(sectionFeedbackPackage([null], "completionStatus"))),
        );

        assert.strictEqual(float.length, 1, shown(float));
        assert.strictEqual(identifier.length, 0, shown(identifier));
        assert.strictEqual(both.length, 1, shown(both));
        assert.strictEqual(numAttempts.length, 1, shown(numAttempts));
        assert.strictEqual(duration.length, 1, shown(duration));
        assert.strictEqual(completionStatus.length, 0, shown(completionStatus));
      }),
  );

  it.effect(
    "Template variable type: a choice or template element names an identifier template variable, and a PCI's template variable may name any",
    () =>
      Effect.gen(function* templateType() {
        const outcome = `<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>`;
        const declared = (cardinality: string, baseType: string): readonly [string, string] => [
          outcome,
          `${outcome}<qti-template-declaration identifier="T" cardinality="${cardinality}" base-type="${baseType}"/>`,
        ];
        const choice = [
          `<qti-simple-choice identifier="A">A</qti-simple-choice>`,
          `<qti-simple-choice identifier="A" template-identifier="T" show-hide="show">A</qti-simple-choice>`,
        ] as const;
        const inline = [
          `<p id="intro">Pick one.</p>`,
          `<p id="intro">Pick <qti-template-inline template-identifier="T" identifier="ti" show-hide="show">one</qti-template-inline>.</p>`,
        ] as const;
        const pci = [choiceInteraction, `${choiceInteraction}${templatePci("T")}`] as const;

        const integer = yield* refusedBy(
          "Template variable type",
          declared("single", "integer"),
          choice,
        );
        const ordered = yield* refusedBy(
          "Template variable type",
          declared("ordered", "identifier"),
          inline,
        );
        const single = yield* refusedBy(
          "Template variable type",
          declared("single", "identifier"),
          choice,
        );
        const multiple = yield* refusedBy(
          "Template variable type",
          declared("multiple", "identifier"),
          choice,
        );
        const variable = yield* refusedBy(
          "Template variable type",
          declared("single", "integer"),
          pci,
        );

        assert.isTrue(integer.held, integer.breaches);
        assert.isTrue(ordered.held, ordered.breaches);
        assert.isFalse(single.held, single.breaches);
        assert.isFalse(multiple.held, multiple.breaches);
        assert.isFalse(variable.held, variable.breaches);
      }),
  );

  it.effect(
    "Choice bounds: min-strings above a non-zero max-strings breaks it, and 0 bounds nothing",
    () =>
      Effect.gen(function* strings() {
        const declared = [
          `<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>`,
          `<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/><qti-response-declaration identifier="TEXT" cardinality="multiple" base-type="string"/>`,
        ] as const;
        const above = yield* refusedBy("Choice bounds", declared, [
          `<p id="intro">Pick one.</p>`,
          extended(`max-strings="2" min-strings="3"`),
        ]);
        const unbounded = yield* refusedBy("Choice bounds", declared, [
          `<p id="intro">Pick one.</p>`,
          extended(`max-strings="0" min-strings="3"`),
        ]);
        const within = yield* refusedBy("Choice bounds", declared, [
          `<p id="intro">Pick one.</p>`,
          extended(`max-strings="3" min-strings="2"`),
        ]);

        assert.isTrue(above.held, above.breaches);
        assert.isFalse(unbounded.held, unbounded.breaches);
        assert.isFalse(within.held, within.breaches);
      }),
  );

  it.effect("Graphic gap match default hotspot: its hotspots have no default", () =>
    Effect.gen(function* graphicDefault() {
      const fallback = yield* refusedBy("Graphic gap match default hotspot", [
        choiceInteraction,
        graphicGapMatch(`shape="default"`),
      ]);
      const rect = yield* refusedBy("Graphic gap match default hotspot", [
        choiceInteraction,
        graphicGapMatch(`shape="rect" coords="0,0,1,1"`),
      ]);

      assert.isTrue(fallback.held, fallback.breaches);
      assert.isFalse(rect.held, rect.breaches);
    }),
  );

  it.effect("Context variable reference: a PCI reads QTI_CONTEXT or a declared context", () =>
    Effect.gen(function* contextVariable() {
      const nowhere = yield* refusedBy("Context variable reference", [
        choiceInteraction,
        contextPci("NOWHERE"),
      ]);
      const context = yield* refusedBy("Context variable reference", [
        choiceInteraction,
        contextPci("QTI_CONTEXT"),
      ]);

      assert.isTrue(nowhere.held, nowhere.breaches);
      assert.isFalse(context.held, context.breaches);
    }),
  );
});

describe("each law, on a package that breaks it", () => {
  for (const { files, law, name, rule } of [...lawCases, ...overlayCases]) {
    it.effect(`${law} refuses ${name} under ${rule}`, () =>
      Effect.gen(function* breaks() {
        const breaches = breachesOf(yield* judged(files));

        assert.isTrue(
          breaches.some((breach) => breach.law === law && ruleOf(breach.law) === rule),
          shown(breaches),
        );
      }),
    );
  }

  it.effect(
    "a resource type outside its version's enumeration is explained by the values that version admits",
    () =>
      // Oracle: the content-packaging XSD's enumeration of cp:resource's type, which the value
      // domain keeps (spec reading 67): the explanation names the attribute, the version and each
      // admitted value, not the compiled pattern.
      Effect.gen(function* enumerated() {
        const breaches = breachesOf(
          yield* judged({
            ...base,
            "imsmanifest.xml": manifestOf(
              edit(itemResource, `type="imsqti_item_xmlv3p0"`, `type="imsqti_item_xmlv9"`),
            ),
          }),
        );
        const domain = breaches.find(({ law }) => law === "value domain");
        const text = domain === undefined ? "" : explain(domain.law, domain.keys, grammar);

        assert.match(
          text,
          /^type: "imsqti_item_xmlv9" is not among the \d+ values of cp:resource@type in 3\.0\.[01]: imsqti_test_xmlv3p0, /u,
          shown(breaches),
        );
        assert.include(text, "imsqti_item_xmlv3p0");
        assert.notInclude(text, "^(?:");
      }),
  );

  it.effect(
    "two data-* names on a kind that admits the class break no law: AL1 admits the class, and AL2 masks it",
    () =>
      Effect.gen(function* openMask() {
        const breaches = breachesOf(
          yield* judged(withItem(`<p id="intro">`, `<p id="intro" data-a="1" data-b="2">`)),
        );

        assert.deepStrictEqual(breaches, [], shown(breaches));
      }),
  );

  it.effect(
    "the default hotspot law reads the last element: whitespace after it does not count",
    () =>
      Effect.gen(function* defaultHotspot() {
        const last = breachesOf(
          yield* judged(
            hotspots(
              `<qti-hotspot-choice identifier="A" shape="rect" coords="0,0,1,1"/><qti-hotspot-choice identifier="B" shape="default"/>`,
            ),
          ),
        );
        const spaced = breachesOf(
          yield* judged(
            hotspots(
              `<qti-hotspot-choice identifier="A" shape="rect" coords="0,0,1,1"/><qti-hotspot-choice identifier="B" shape="default"/>\n`,
            ),
          ),
        );
        const first = breachesOf(
          yield* judged(
            hotspots(
              `<qti-hotspot-choice identifier="B" shape="default"/><qti-hotspot-choice identifier="A" shape="rect" coords="0,0,1,1"/>`,
            ),
          ),
        );

        assert.isFalse(
          last.some(({ law }) => law === "default hotspot last slot"),
          shown(last),
        );
        assert.isFalse(
          spaced.some(({ law }) => law === "default hotspot last slot"),
          shown(spaced),
        );
        assert.isTrue(
          first.some(
            ({ law }) => law === "default hotspot last slot" && ruleOf(law) === "hotspot-default",
          ),
          shown(first),
        );
      }),
  );

  it.effect(
    "Declaration key: two declarations without an identifier share none, and AL3 refuses each",
    () =>
      Effect.gen(function* unnamedDeclarations() {
        const breaches = breachesOf(
          yield* judged(
            withItem(
              `<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>`,
              `<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/><qti-outcome-declaration cardinality="single" base-type="float"/><qti-outcome-declaration cardinality="single" base-type="float"/>`,
            ),
          ),
        );

        assert.deepStrictEqual(
          breaches.map(({ keys, law }) => [law, keys["kind"]]),
          [
            ["AL3 required", "qti-outcome-declaration"],
            ["AL3 required", "qti-outcome-declaration"],
          ],
          shown(breaches),
        );
      }),
  );

  it.effect(
    "DocumentId key: two ids outside their domain are no ids, and only the value domain refuses each",
    () =>
      Effect.gen(function* invalidIds() {
        const breaches = breachesOf(
          yield* judged(
            withItem(`<p id="intro">Pick one.</p>`, `<p id="">Pick one.</p><p id="">Twice.</p>`),
          ),
        );

        assert.deepStrictEqual(
          breaches.map(({ keys, law }) => [law, keys["name"]]),
          [
            ["value domain", "id"],
            ["value domain", "id"],
          ],
          shown(breaches),
        );
      }),
  );
});

describe("open names and attribute entity references", () => {
  it.effect("two data-* names and an entity reference in an attribute value break no law", () =>
    Effect.gen(function* openRows() {
      const files = withItem(`<p id="intro">`, `<p id="intro" data-a="1" data-b="&org;">`);
      const judgment = yield* judged({
        ...files,
        "item.xml": `<!DOCTYPE qti-assessment-item SYSTEM "qti.dtd">\n${files["item.xml"]}`,
      });
      const breaches = breachesOf(judgment);
      const xml = yield* Effect.orDie(
        readXml(
          new TextEncoder().encode(
            `<!DOCTYPE p SYSTEM "qti.dtd"><p xmlns="${asi}" data-b="&org;"/>`,
          ),
        ),
      );

      assert.deepStrictEqual(breaches, [], shown(breaches));
      assert.isTrue(
        xml.root.attributes.some(({ references }) => references.length > 0),
        "crust keeps an undeclared reference unexpanded, so the item holds an AttributeEntity row",
      );
    }),
  );
});

/**
 * Shred, fold and judge one document under 3.0.0, as the oracle judges a document its package
 * lists, without the manifest's version decode.
 *
 * @param text - The document's text.
 * @returns The laws its rows break, once each.
 */
const documentLaws = (text: string) =>
  Effect.gen(function* judgedDocument() {
    const xml = yield* Effect.orDie(readXml(new TextEncoder().encode(text)));
    const tree = yield* Effect.orDie(shred(xml, "3.0.0", shredGrammarOf(grammar)));
    const rows = yield* Effect.orDie(
      Effect.fromResult(
        fold(
          tree,
          (index): NodeId => `00000000-0000-4000-8000-${index.toString(16).padStart(12, "0")}`,
          foldGrammarOf(grammar),
        ),
      ),
    );

    return [...new Set(documentBreaches("imsmanifest.xml", rows, laws).map(({ law }) => law))];
  });

/**
 * A manifest whose `schemaversion` is written as given.
 *
 * @param schemaversion - The element as written.
 * @returns The manifest's text.
 */
const versionedManifest = (schemaversion: string): string =>
  `<manifest xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1" identifier="m"><metadata><schema>QTI Package</schema>${schemaversion}</metadata><organizations/><resources/></manifest>`;

describe("TextDomain, on each simple-content element's string value", () => {
  it.effect("an empty or blank schemaversion breaks its domain, and 3.0.0 does not", () =>
    Effect.gen(function* schemaversion() {
      assert.include(yield* documentLaws(versionedManifest("<schemaversion/>")), "TextDomain");
      assert.include(
        yield* documentLaws(versionedManifest("<schemaversion>   </schemaversion>")),
        "TextDomain",
      );
      assert.notInclude(
        yield* documentLaws(versionedManifest("<schemaversion>3.0.0</schemaversion>")),
        "TextDomain",
      );
    }),
  );

  it.effect("an empty drd:hazard breaks its union domain", () =>
    Effect.gen(function* hazard() {
      const breaches = breachesOf(
        yield* judged({
          ...base,
          "imsmanifest.xml": manifestOf(
            edit(
              itemResource,
              `<file href="item.xml"/>`,
              `<metadata><lom xmlns="http://ltsc.ieee.org/xsd/LOM"><general><hazard xmlns="http://www.imsglobal.org/xsd/qti/qtiv3p0/imsafa3p0drd_v1p0"/></general></lom></metadata><file href="item.xml"/>`,
            ),
          ),
        }),
      );

      assert.isTrue(
        breaches.some(({ keys, law }) => law === "TextDomain" && keys["kind"] === "drd:hazard"),
        shown(breaches),
      );
    }),
  );
});

/**
 * The base package, its item resource carrying a LOM record whose general identifier entry is as
 * given.
 *
 * @param entry - The entry's text.
 * @returns The package's files.
 */
const itemRecord = (entry: string) => ({
  ...base,
  "imsmanifest.xml": manifestOf(
    edit(
      itemResource,
      `<file href="item.xml"/>`,
      `<metadata><lom xmlns="http://ltsc.ieee.org/xsd/LOM"><general><identifier><catalog>c</catalog><entry>${entry}</entry></identifier></general></lom></metadata><file href="item.xml"/>`,
    ),
  ),
});

/**
 * A package of the base item and test, the test resource carrying a LOM record whose general
 * identifier entry is as given.
 *
 * @param entry - The entry's text.
 * @returns The package's files.
 */
const testRecordOf = (entry: string) => ({
  "imsmanifest.xml": manifestOf(
    `${itemResource}<resource identifier="RT" type="imsqti_test_xmlv3p0" href="test.xml"><metadata><lom xmlns="http://ltsc.ieee.org/xsd/LOM"><general><identifier><catalog>c</catalog><entry>${entry}</entry></identifier></general></lom></metadata><file href="test.xml"/></resource>`,
  ),
  "item.xml": item,
  "test.xml": test,
});

describe("the LOM record of a test", () => {
  it.effect(
    "names the test document: a matching entry breaks no law, another entry breaks it",
    () =>
      Effect.gen(function* testRecord() {
        const named = breachesOf(yield* judged(testRecordOf(" T ")));
        const other = breachesOf(yield* judged(testRecordOf("other")));

        assert.deepStrictEqual(named, [], shown(named));
        assert.isTrue(
          other.some(({ law }) => law === "LomObjectIdentifier"),
          shown(other),
        );
      }),
  );
});

describe("the LOM record of an item", () => {
  it.effect("an entry that names the item with whitespace around it names it", () =>
    Effect.gen(function* padded() {
      const named = breachesOf(yield* judged(itemRecord("\n    item\n  ")));
      const other = breachesOf(yield* judged(itemRecord("\n    other\n  ")));

      assert.deepStrictEqual(named, [], shown(named));
      assert.isTrue(
        other.some(({ law }) => law === "LomObjectIdentifier"),
        shown(other),
      );
    }),
  );
});

describe("the codec's refusals", () => {
  it.effect("a manifest of another schema version is not-qti3", () =>
    Effect.gen(function* notQti3() {
      const judgment = yield* judged({
        ...base,
        "imsmanifest.xml": manifestOf(itemResource, "2.2"),
      });

      assert.deepStrictEqual(verdictOf(judgment), { rule: "not-qti3", verdict: "refused" });
    }),
  );

  it.effect(
    "a choice outside its interaction is unmodeled-vocabulary: its parent admits no foreign element in its namespace",
    () =>
      Effect.gen(function* outside() {
        const judgment = yield* judged(
          withItem(
            "<qti-item-body>",
            '<qti-item-body><qti-simple-choice identifier="X">X</qti-simple-choice>',
          ),
        );

        assert.deepStrictEqual(verdictOf(judgment), {
          rule: "unmodeled-vocabulary",
          verdict: "refused",
        });
      }),
  );

  it.effect("an element no vocabulary names is unmodeled-vocabulary", () =>
    Effect.gen(function* unmodeled() {
      const judgment = yield* judged(withItem("<qti-item-body>", "<qti-item-body><nowhere/>"));

      assert.deepStrictEqual(verdictOf(judgment), {
        rule: "unmodeled-vocabulary",
        verdict: "refused",
      });
    }),
  );

  it.effect(
    "a data-* name on a kind whose type admits no undeclared attribute is attribute-admission, before any row exists",
    () =>
      Effect.gen(function* closedKind() {
        const judgment = yield* judged(
          withItem(
            `<qti-outcome-declaration identifier="SCORE"`,
            `<qti-outcome-declaration data-a="1" identifier="SCORE"`,
          ),
        );

        assert.strictEqual(judgment._tag, "CodecRefusal");
        assert.deepStrictEqual(verdictOf(judgment), {
          rule: "attribute-admission",
          verdict: "refused",
        });
      }),
  );

  it.effect("a document that is not well-formed is well-formedness", () =>
    Effect.gen(function* malformed() {
      const judgment = yield* judged({ ...base, "item.xml": "<qti-assessment-item>" });

      assert.deepStrictEqual(verdictOf(judgment), { rule: "well-formedness", verdict: "refused" });
    }),
  );
});

describe("the content references", () => {
  it("every attribute ContentReference reads names the rule its refusal keeps", () => {
    const unruled = [
      ...new Set(
        grammar.references.contentReference.rows
          .filter(({ attribute, kind }) => Option.isNone(contentLawOf(kind, attribute)))
          .map(({ attribute, kind }) => `${kind}@${attribute}`),
      ),
    ];

    assert.isAbove(grammar.references.contentReference.rows.length, 0, "the relation has rows");
    assert.deepStrictEqual(unruled, []);
  });
});

/**
 * A double domain bounded below at 1.0 by one facet, every form matching its pattern.
 *
 * @param facet - The facet.
 * @returns The domain.
 */
const bounded = (facet: "minExclusive" | "minInclusive") => ({
  bound: Option.some({ facet, value: 1 }),
  enumeration: [],
  handle: facet,
  identity: Option.none(),
  pattern: "^.*$",
  primitive: "double" as const,
  qualified: Option.none(),
});

/**
 * Decide whether some breach is a bound breach whose explanation names a facet.
 *
 * @param breaches - The breaches.
 * @param name - The facet's name.
 * @returns Whether one is.
 */
const facet = (breaches: readonly Breach[], name: string): boolean =>
  breaches.some(
    ({ keys, law }) =>
      law === "Double bound" &&
      ruleOf(law) === "attribute-lexical" &&
      explain(law, keys, grammar).includes(name),
  );

/**
 * Decide whether a form breaks a one-facet double domain's bound.
 *
 * @param bound - The facet.
 * @param form - The lexical form.
 * @returns Whether the form's value lies outside it.
 */
const breaks = (bound: "minExclusive" | "minInclusive", form: string): boolean =>
  Option.isSome(boundBroken(bounded(bound), form));

describe("the residual facets of a value domain", () => {
  it("each lower bound refuses the values outside it, and NaN fails every bound", () => {
    assert.deepStrictEqual(
      ["0", "1", "1E0", " 2 ", "INF", "-INF", "NaN"].map((form) => [
        breaks("minInclusive", form),
        breaks("minExclusive", form),
      ]),
      [
        [true, true],
        [false, true],
        [false, true],
        [false, false],
        [false, false],
        [true, true],
        [true, true],
      ],
    );
  });

  it.effect("a double below its minInclusive or at its minExclusive breaks its bound", () =>
    Effect.gen(function* doubles() {
      const minInclusive = breachesOf(
        yield* judged(
          withItem(
            `<p id="intro">Pick one.</p>`,
            `<p id="intro">Pick one.</p><qti-slider-interaction response-identifier="RESPONSE" lower-bound="-1" upper-bound="10"/>`,
          ),
        ),
      );
      const minExclusive = breachesOf(
        yield* judged(
          withItem(
            `<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>`,
            `<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float" normal-maximum="0"/>`,
          ),
        ),
      );
      assert.isTrue(facet(minInclusive, "minInclusive"), shown(minInclusive));
      assert.isTrue(facet(minExclusive, "minExclusive"), shown(minExclusive));
    }),
  );
});

describe("explain", () => {
  it("is total over every law: each names its rule and explains a breach with no keys", () => {
    for (const law of lawNames) {
      assert.isString(ruleOf(law), law);
      assert.isString(explain(law, {}, grammar), law);
    }

    assert.strictEqual(new Set(lawNames).size, lawNames.length, "each law is named once");
  });

  it.effect("a Follow breach lists what its parent's content model admits next", () =>
    Effect.gen(function* follow() {
      const breaches = breachesOf(
        yield* judged(
          withItem(
            `<qti-correct-response><qti-value>A</qti-value></qti-correct-response>`,
            `<qti-correct-response><qti-value>A</qti-value></qti-correct-response><qti-correct-response><qti-value>B</qti-value></qti-correct-response>`,
          ),
        ),
      );
      const found = breaches.find(({ law }) => law === "N5 Follow");

      assert.isDefined(found, shown(breaches));
      assert.include(
        found === undefined ? "" : explain(found.law, found.keys, grammar),
        "qti-mapping",
        "the declaration's model admits a mapping after its correct response",
      );
    }),
  );
});

describe("verdictOf", () => {
  it("accepts a package no law refuses, and names the first-ranked breach's rule otherwise", () => {
    const breach: Breach = { document: "", keys: {}, law: "N5 Follow" };

    assert.deepStrictEqual(verdictOf({ _tag: "Judged", breaches: [], documents: [] }), {
      verdict: "accepted",
    });
    assert.deepStrictEqual(
      verdictOf({
        _tag: "Judged",
        breaches: [breach, { ...breach, law: "N5 admitted" }],
        documents: [],
      }),
      { rule: "ordering", verdict: "refused" },
    );
  });
  it("names the rule the catalog's precedence ranks first, whatever order the breaches are listed in", () => {
    // Oracle: the law catalog's precedence, the order the database names a refusal by: of the
    // breaches below, Document entry's entry-kind ranks first, a path's listing before the root it
    // lists (reading 93), then RootOfType's root-type-reverse, File exists's, N5 Follow's ordering
    // and AL1 admission's attribute-admission. Bound: every order of the five, 120.
    const listed: readonly LawName[] = [
      "AL1 admission",
      "N5 Follow",
      "File exists",
      "RootOfType",
      "Document entry",
    ];
    const orders = (rest: readonly LawName[]): readonly (readonly LawName[])[] =>
      rest.length === 0
        ? [[]]
        : rest.flatMap((law, at) =>
            orders([...rest.slice(0, at), ...rest.slice(at + 1)]).map((tail) => [law, ...tail]),
          );
    const all = orders(listed);

    assert.lengthOf(all, 120);
    for (const order of all) {
      assert.deepStrictEqual(
        verdictOf({
          _tag: "Judged",
          breaches: order.map((law) => ({ document: "", keys: {}, law })),
          documents: [],
        }),
        { rule: "entry-kind", verdict: "refused" },
        order.join(", "),
      );
    }
  });
});

/**
 * Shred and fold a document, as the oracle does.
 *
 * @param text - The document, read as a 3.0.1 item.
 * @returns Its folded rows.
 */
const foldedText = (text: string) =>
  Effect.gen(function* folded() {
    const xml = yield* Effect.orDie(readXml(new TextEncoder().encode(text)));
    const tree = yield* Effect.orDie(shred(xml, "3.0.1", shredGrammarOf(grammar)));

    return yield* Effect.orDie(
      Effect.fromResult(
        fold(
          tree,
          (index): NodeId => `00000000-0000-4000-8000-${index.toString(16).padStart(12, "0")}`,
          foldGrammarOf(grammar),
        ),
      ),
    );
  });

/**
 * Shred and fold the base item, as the oracle does.
 */
const foldedItem = foldedText(item);

/**
 * Replace the node rows that a test tampers with, keeping every other row.
 *
 * @param rows - The folded rows.
 * @param change - The replacement of a node row, or the row itself to keep it.
 * @returns The rows with the node rows changed.
 */
const tamperNodes = (
  rows: FoldedRows<Composed>,
  change: (node: FoldedNode<Composed>, index: number) => FoldedNode<Composed>,
): FoldedRows<Composed> => ({ ...rows, nodes: rows.nodes.map(change) });

/**
 * Replace the attribute rows that a test tampers with, keeping every other row.
 *
 * @param rows - The folded rows.
 * @param change - The replacement of an attribute row, or the row itself to keep it.
 * @returns The rows with the attribute rows changed.
 */
const tamperAttributes = (
  rows: FoldedRows<Composed>,
  change: (attribute: FoldedAttribute<Composed>, index: number) => FoldedAttribute<Composed>,
): FoldedRows<Composed> => ({ ...rows, attributes: rows.attributes.map(change) });

/**
 * Name the laws a document's rows break.
 *
 * @param rows - The rows.
 * @returns The laws, once each.
 */
const lawsBroken = (rows: FoldedRows<Composed>): readonly string[] => [
  ...new Set(documentBreaches("item.xml", rows, laws).map(({ law }) => law)),
];

/**
 * Decide whether an attribute row is the base item's response declaration's `identifier`, the row
 * the AL1 mutations rewrite.
 *
 * @param attribute - The row.
 * @returns Whether it is that row.
 */
const declared = (attribute: FoldedAttribute<Composed>): boolean =>
  attribute.kind === "qti-response-declaration" && attribute.name === "identifier";

/**
 * Move a node row under another, at the slot after the other's last child.
 *
 * @param node - The node row.
 * @param parent - Its new parent's row.
 * @returns The node row with its parent and slot changed.
 */
const under = (node: FoldedNode<Composed>, parent: FoldedNode<Composed>): FoldedNode<Composed> => ({
  ...node,
  at: parent.children,
  parent: parent.id,
});

/**
 * Decide whether a node row is a child of its document node.
 *
 * @param rows - The document's rows.
 * @param node - The node row.
 * @returns Whether its parent is the document node.
 */
const topLevel = (rows: FoldedRows<Composed>, node: FoldedNode<Composed>): boolean =>
  node.start > 0n && node.parent === rows.document.node;

/**
 * Change one node row of a document, the first that a test selects.
 *
 * @param rows - The rows.
 * @param select - Whether a row is the one to change.
 * @param change - Its replacement.
 * @returns The rows with that row changed.
 */
const tamperFirst = (
  rows: FoldedRows<Composed>,
  select: (node: FoldedNode<Composed>) => boolean,
  change: (node: FoldedNode<Composed>) => FoldedNode<Composed>,
): FoldedRows<Composed> => {
  const target = rows.nodes.find(select);

  return tamperNodes(rows, (node) => (node === target ? change(node) : node));
};

/**
 * Whether a node row is a leaf below the document node.
 *
 * @param node - The row.
 * @returns Whether it has no children.
 */
const leaf = (node: FoldedNode<Composed>): boolean => node.start > 0n && node.children === 0n;

/**
 * Whether a node row is a later sibling below the document node.
 *
 * @param node - The row.
 * @returns Whether it has a predecessor.
 */
const later = (node: FoldedNode<Composed>): boolean => node.start > 0n && node.at > 0n;

/**
 * Whether a node row is a parent below the document node.
 *
 * @param node - The row.
 * @returns Whether it has children.
 */
const parentOf = (node: FoldedNode<Composed>): boolean => node.children > 0n && node.start > 0n;

/**
 * The URIs a namespace class is judged against an ASI parent or element: none, the ASI namespace
 * itself, and another.
 */
const uris = ["", asi, "urn:other"] as const;

describe("the foreign namespace classes, every class against every URI", () => {
  it.effect("a foreign element's class breaks its law exactly off the diagonal", () =>
    Effect.gen(function* elementClass() {
      const rows = yield* foldedItem;
      const target = rows.nodes.find((node) => node.kind === "p");
      const kinds = ["no-namespace-element", "own-namespace-element", "foreign-element"] as const;

      assert.isDefined(target, "the item holds a p under its body");
      for (const [row, kind] of kinds.entries()) {
        for (const [column, uri] of uris.entries()) {
          const tampered: FoldedRows<Composed> = {
            ...tamperNodes(rows, (node) => (node === target ? { ...node, kind } : node)),
            openElementNames: [
              ...rows.openElementNames,
              { local: "x", namespace: uri, node: target?.id ?? rows.document.node },
            ],
          };

          assert.strictEqual(
            lawsBroken(tampered).includes("Foreign element class"),
            row !== column,
            `${kind} with the namespace ${JSON.stringify(uri)}`,
          );
        }
      }
    }),
  );

  it.effect("an open attribute's class breaks its law exactly off the diagonal", () =>
    Effect.gen(function* attributeClass() {
      const rows = yield* foldedItem;
      const target = rows.attributes.find(
        (attribute) => attribute.kind === "qti-assessment-item" && attribute.name === "title",
      );
      const classes = ["no-namespace", "own-namespace", "foreign"] as const;

      assert.isDefined(target, "the item carries a title");
      for (const [row, name] of classes.entries()) {
        for (const [column, uri] of uris.entries()) {
          const tampered: FoldedRows<Composed> = {
            ...tamperAttributes(rows, (attribute) =>
              attribute === target ? { ...attribute, name } : attribute,
            ),
            openNames: [
              ...rows.openNames,
              {
                attribute: target?.id ?? rows.document.node,
                local: "a",
                uri,
              },
            ],
          };

          assert.strictEqual(
            lawsBroken(tampered).includes("Foreign attribute class"),
            row !== column,
            `${name} with the namespace ${JSON.stringify(uri)}`,
          );
        }
      }
    }),
  );

  it.effect(
    "an open attribute's data- name breaks its law exactly where reading 13's language refuses it: every class and host against every name",
    () =>
      // Oracle: the specification as a checker, reading 13: a `data-*` name is `data-` and one or
      // more lower-case ASCII letters, digits, `_`, `.` or `-` (the information model's pattern,
      // section 7.11, held with its prose, which bars upper case), and a no-namespace name
      // beginning `data-` on an element that is not foreign is never `no-namespace`; on a foreign
      // element it is.
      // Bound: 2 classes, 2 hosts and 9 names, 36 rows.
      Effect.gen(function* dataName() {
        const rows = yield* foldedText(edit(item, `<p id="intro">`, `<p data-x="1" id="intro">`));
        const target = rows.attributes.find((attribute) => attribute.name === "data-*");
        const host = rows.nodes.find(({ id }) => id === target?.node);
        const language = /^data-[a-z0-9_.-]+$/u;
        const names = [
          "data-x",
          "data-é",
          "data-x·y",
          "data-1",
          "data-A",
          "data-xY",
          "data-éA",
          "data-",
          "x-data",
        ] as const;

        assert.isDefined(target, "the item carries a data-* attribute");
        assert.isDefined(host, "the data-* attribute has a host");
        for (const name of ["data-*", "no-namespace"] as const) {
          for (const kind of [host?.kind ?? "div", "foreign-element"] as const) {
            for (const local of names) {
              const tampered: FoldedRows<Composed> = {
                ...tamperNodes(
                  tamperAttributes(rows, (attribute) =>
                    attribute === target ? { ...attribute, name } : attribute,
                  ),
                  (node) => (node === host ? { ...node, kind } : node),
                ),
                openNames: rows.openNames.map((open) =>
                  open.attribute === target?.id ? { ...open, local } : open,
                ),
              };
              const expected =
                name === "data-*"
                  ? !language.test(local)
                  : kind !== "foreign-element" && local.startsWith("data-");

              assert.strictEqual(
                lawsBroken(tampered).includes("AL4 data name"),
                expected,
                `${name} ${local} on ${kind}`,
              );
            }
          }
        }
      }),
  );

  it.effect(
    "an open attribute breaks the declared data name law exactly when a data-* name is one its element declares: every class and host against every name",
    () =>
      // Oracle: the specification as a checker, goal part E: a data- name QTI declares on an
      // element is that attribute, never a custom one; `p` declares `data-catalog-idref` and
      // `data-ssml`, `qti-assessment-item` declares neither, and a name no element declares is
      // custom anywhere. Only a `data-*` name is held to it.
      // Bound: 2 classes, 3 hosts and 4 names, 24 rows.
      Effect.gen(function* declaredDataName() {
        const rows = yield* foldedText(edit(item, `<p id="intro">`, `<p data-x="1" id="intro">`));
        const target = rows.attributes.find((attribute) => attribute.name === "data-*");
        const host = rows.nodes.find(({ id }) => id === target?.node);
        const declaredNames = new Set(["data-catalog-idref", "data-ssml"]);

        assert.isDefined(target, "the item carries a data-* attribute");
        assert.isDefined(host, "the data-* attribute has a host");
        for (const name of ["data-*", "no-namespace"] as const) {
          for (const kind of [
            host?.kind ?? "div",
            "qti-assessment-item",
            "foreign-element",
          ] as const) {
            for (const local of ["data-catalog-idref", "data-ssml", "data-x", "data-é"] as const) {
              const tampered: FoldedRows<Composed> = {
                ...tamperNodes(
                  tamperAttributes(rows, (attribute) =>
                    attribute === target ? { ...attribute, name } : attribute,
                  ),
                  (node) => (node === host ? { ...node, kind } : node),
                ),
                openNames: rows.openNames.map((open) =>
                  open.attribute === target?.id ? { ...open, local } : open,
                ),
              };

              assert.strictEqual(
                lawsBroken(tampered).includes("AL4 declared data name"),
                name === "data-*" && kind === host?.kind && declaredNames.has(local),
                `${name} ${local} on ${kind}`,
              );
            }
          }
        }
      }),
  );
});

describe("the tree laws, on the named corruptions of trees.md §7", () => {
  it.effect("each corruption is refused by the law its variant names, and the tree by none", () =>
    Effect.gen(function* corruptions() {
      const rows = yield* foldedItem;
      const startOf = rows.nodes.find(later)?.start ?? 0n;
      const named = {
        childOutsideParent: tamperFirst(rows, parentOf, (node) => ({
          ...node,
          end: node.end + 1n,
        })),
        gapBetweenSiblings: tamperFirst(rows, later, (node) => ({
          ...node,
          start: node.start + 1n,
        })),
        overlappingSiblings: tamperFirst(rows, later, (node) => ({
          ...node,
          start: node.start - 1n,
        })),
        secondRoot: tamperFirst(rows, later, (node) => ({ ...node, parent: node.id })),
        startTaken: tamperFirst(
          rows,
          (node) => node.start > startOf,
          (node) => ({ ...node, start: startOf }),
        ),
        wrongSize: tamperFirst(rows, leaf, (node) => ({ ...node, end: node.end + 1n })),
      };

      for (const law of [
        "T1 document order",
        "T2 root",
        "T3 first child",
        "T4 next sibling",
        "T5 last child",
        "T6 nonempty and leaf",
      ]) {
        assert.notInclude(lawsBroken(rows), law, "the folded tree breaks no tree law");
      }

      assert.include(lawsBroken(named.childOutsideParent), "T5 last child", "childOutsideParent");
      assert.include(lawsBroken(named.gapBetweenSiblings), "T4 next sibling", "gapBetweenSiblings");
      assert.include(
        lawsBroken(named.overlappingSiblings),
        "T4 next sibling",
        "overlappingSiblings",
      );
      assert.include(lawsBroken(named.secondRoot), "T2 root", "secondRoot");
      assert.include(lawsBroken(named.startTaken), "T1 document order", "startTaken");
      assert.include(lawsBroken(named.wrongSize), "T6 nonempty and leaf", "wrongSize");
    }),
  );
});

describe("the fold laws, on rows the folds did not write", () => {
  it.effect("the base item's folded rows break no law", () =>
    Effect.gen(function* untouched() {
      const rows = yield* foldedItem;

      assert.deepStrictEqual(lawsBroken(rows), []);
    }),
  );

  it.effect(
    "N1: the document node's parentAncestry is empty and its nearestKind its own kind",
    () =>
      Effect.gen(function* sentinel() {
        const rows = yield* foldedItem;
        const flagged = tamperNodes(rows, (node) =>
          node.start === 0n ? { ...node, parentAncestry: new Set(["int"]) } : node,
        );
        const misnamed = tamperNodes(rows, (node) =>
          node.start === 0n ? { ...node, nearestKind: "qti-assessment-item" } : node,
        );
        const moved = tamperNodes(rows, (node) => (node.start === 0n ? { ...node, at: 1n } : node));

        assert.include(lawsBroken(flagged), "N1 sentinel");
        assert.include(lawsBroken(misnamed), "N1 sentinel");
        assert.include(lawsBroken(moved), "N1 sentinel", "the document node sits at slot 0");
      }),
  );

  it.effect("the Node key: a second row with one id is refused, and distinct ids are not", () =>
    Effect.gen(function* nodeKey() {
      const rows = yield* foldedItem;
      const [, second] = rows.nodes;
      const twice = tamperNodes(rows, (node, index) =>
        second !== undefined && index === 2 ? { ...node, id: second.id } : node,
      );

      assert.isDefined(second, "the item has a second node");
      assert.notInclude(lawsBroken(rows), "Node key");
      assert.include(lawsBroken(twice), "Node key");
    }),
  );

  it.effect(
    "T3: a two-node cycle of parent links ends, breaking the first-child law and its new parents' mirrors",
    () =>
      Effect.gen(function* cycle() {
        const rows = yield* foldedItem;
        const [a, b] = rows.nodes.filter(
          (node) => !topLevel(rows, node) && node.start > 0n && laws.elements.has(node.kind),
        );
        const tampered = tamperNodes(rows, (node) => {
          if (a !== undefined && b !== undefined && node.id === a.id) {
            return under(node, b);
          }

          return a !== undefined && b !== undefined && node.id === b.id ? under(node, a) : node;
        });
        const broken = lawsBroken(tampered);

        assert.isDefined(b, "the item has two elements below its root");
        assert.include(broken, "T3 first child");
        assert.include(broken, "N2 mirrors", "each sits past its new parent's last slot");
      }),
  );

  it.effect("T3: a copy of the parent's kind that is not the parent's", () =>
    Effect.gen(function* rank() {
      const rows = yield* foldedItem;
      const tampered = tamperNodes(rows, (node, index) =>
        index === 2 ? { ...node, parentKind: "qti-item-body" } : node,
      );

      assert.include(lawsBroken(tampered), "T3 first child");
    }),
  );

  it.effect("T3: each field of the merged parent copy that is not the parent's", () =>
    Effect.gen(function* parentCopy() {
      const rows = yield* foldedItem;
      const target = rows.nodes.find(
        (node) => node.start > 0n && node.at > 0n && node.parent !== rows.document.node,
      );
      const other: NodeId = "00000000-0000-4000-8000-0000000fffff";
      const copies: readonly (readonly [
        string,
        (node: FoldedNode<Composed>) => FoldedNode<Composed>,
      ])[] = [
        ["document", (node) => ({ ...node, document: other })],
        ["version", (node) => ({ ...node, version: node.version === "3.0.0" ? "3.0.1" : "3.0.0" })],
        ["parentKind", (node) => ({ ...node, parentKind: "qti-item-body" })],
        ["parentStart", (node) => ({ ...node, parentStart: node.parentStart + 1n })],
        [
          "parentAncestry",
          (node) => ({
            ...node,
            parentAncestry: node.parentAncestry.union(new Set(["test"] as const)),
          }),
        ],
        ["parentNearest", (node) => ({ ...node, parentNearest: other })],
        [
          "parentNearestKind",
          (node) => ({
            ...node,
            parentNearestKind:
              node.parentNearestKind === "qti-item-body" ? "qti-assessment-item" : "qti-item-body",
          }),
        ],
      ];

      assert.isDefined(target, "the item has a later child below its root");
      for (const [field, change] of copies) {
        assert.include(
          lawsBroken(tamperNodes(rows, (node) => (node === target ? change(node) : node))),
          "T3 first child",
          field,
        );
      }
    }),
  );

  it.effect("AL1: each field of the owner copy that is not the owner's", () =>
    Effect.gen(function* ownerCopy() {
      const rows = yield* foldedItem;
      const target = rows.attributes.at(0);
      const copies: readonly (readonly [
        string,
        (attribute: FoldedAttribute<Composed>) => FoldedAttribute<Composed>,
      ])[] = [
        ["kind", (attribute) => ({ ...attribute, kind: "qti-item-body" })],
        [
          "version",
          (attribute) => ({
            ...attribute,
            version: attribute.version === "3.0.0" ? "3.0.1" : "3.0.0",
          }),
        ],
        [
          "document",
          (attribute) => ({ ...attribute, document: "00000000-0000-4000-8000-0000000fffff" }),
        ],
      ];

      assert.isDefined(target, "the item carries an attribute");
      for (const [field, change] of copies) {
        assert.include(
          lawsBroken(
            tamperAttributes(rows, (attribute) =>
              attribute === target ? change(attribute) : attribute,
            ),
          ),
          "AL1 owner",
          field,
        );
      }
    }),
  );

  it.effect("every fold's first slot is its monoid's identity", () =>
    Effect.gen(function* identity() {
      const rows = yield* foldedItem;
      const first = (change: (node: FoldedNode<Composed>) => FoldedNode<Composed>) =>
        lawsBroken(tamperNodes(rows, (node) => (topLevel(rows, node) ? change(node) : node)));
      const attrs = tamperAttributes(rows, (attribute) =>
        attribute.at === 0n ? { ...attribute, attrsWas: new Set([0]) } : attribute,
      );

      assert.include(
        first((node) => ({ ...node, was: 1 })),
        "N5 first slot",
        "was",
      );
      assert.include(
        first((node) => ({ ...node, elementsWas: 1n })),
        "N5 first slot",
        "elementsWas",
      );
      assert.include(lawsBroken(attrs), "N5 first slot", "attrsWas");
      assert.include(lawsBroken(attrs), "AL2 fold");
    }),
  );

  it.effect("E1: a string value that is not its children's characters", () =>
    Effect.gen(function* stringValue() {
      const rows = yield* foldedItem;
      const tampered = tamperFirst(
        rows,
        (node) => node.stringValue !== "",
        (node) => ({ ...node, stringValue: `${node.stringValue}x` }),
      );

      assert.notInclude(lawsBroken(rows), "E1 derived");
      assert.include(lawsBroken(tampered), "E1 derived");
    }),
  );

  it.effect("N5: a child its parent does not admit", () =>
    Effect.gen(function* unadmitted() {
      const rows = yield* foldedItem;
      const tampered = tamperFirst(
        rows,
        (node) => node.kind === "p",
        (node) => ({ ...node, kind: "qti-simple-choice" }),
      );

      assert.include(lawsBroken(tampered), "N5 admitted");
    }),
  );

  it.effect("N5: a copy of the predecessor's state that is not its state", () =>
    Effect.gen(function* predecessor() {
      const rows = yield* foldedItem;
      const tampered = tamperNodes(rows, (node) =>
        node.at === 1n &&
        rows.nodes.some((parent) => parent.id === node.parent && topLevel(rows, parent))
          ? { ...node, was: 9 }
          : node,
      );

      assert.include(lawsBroken(tampered), "N5 fold");
    }),
  );

  it.effect("N7: an end value that is not the last child's fold", () =>
    Effect.gen(function* lastSlot() {
      const rows = yield* foldedItem;
      const tampered = tamperNodes(rows, (node) =>
        topLevel(rows, node) ? { ...node, childState: node.childState + 1 } : node,
      );

      assert.include(lawsBroken(tampered), "N7 last slot");
    }),
  );

  it.effect("N8: a nearest interaction that is not the parent's", () =>
    Effect.gen(function* nearest() {
      const rows = yield* foldedItem;
      const tampered = tamperNodes(rows, (node) =>
        node.kind === "qti-simple-choice" ? { ...node, nearest: node.id } : node,
      );

      assert.include(lawsBroken(tampered), "N8 nearest");
    }),
  );

  it.effect("AL2: a closed name held twice on one element", () =>
    Effect.gen(function* distinct() {
      const rows = yield* foldedItem;
      const [first] = rows.attributes;
      const tampered = tamperAttributes(rows, (attribute) =>
        first !== undefined && attribute.node === first.node && attribute.at === 1n
          ? { ...attribute, name: first.name }
          : attribute,
      );

      assert.include(lawsBroken(tampered), "AL2 distinct");
    }),
  );

  it.effect("AL1: a cell AttributeAdmission does not hold, on rows shred did not write", () =>
    Effect.gen(function* admission() {
      const rows = yield* foldedItem;
      const renamed = tamperAttributes(rows, (attribute) =>
        declared(attribute) ? { ...attribute, name: "href" } : attribute,
      );
      const opened = tamperAttributes(rows, (attribute) =>
        declared(attribute) ? { ...attribute, name: "data-*" } : attribute,
      );

      assert.include(lawsBroken(renamed), "AL1 admission");
      assert.include(lawsBroken(opened), "AL1 admission");
    }),
  );
});

/**
 * The base item with a MathML expression in its paragraph whose annotation holds one foreign
 * element, `{urn:w}widget`, under `annotation-xml`'s lax wildcard.
 */
const annotatedItem = edit(
  item,
  `<p id="intro">Pick one.</p>`,
  `<p id="intro">Pick <math xmlns="http://www.w3.org/1998/Math/MathML"><semantics><mi>x</mi><annotation-xml encoding="application/x-widget"><widget xmlns="urn:w"/></annotation-xml></semantics></math>.</p>`,
);

describe("MathML foreign element, on rows the codec did not write", () => {
  it.effect(
    "a foreign element named in the MathML namespace breaks it, and an m:mi inside m:math does not",
    () =>
      Effect.gen(function* mathmlForeign() {
        const xml = yield* Effect.orDie(readXml(new TextEncoder().encode(annotatedItem)));
        const tree = yield* Effect.orDie(shred(xml, "3.0.1", shredGrammarOf(grammar)));
        const rows = yield* Effect.orDie(
          Effect.fromResult(
            fold(
              tree,
              (index): NodeId => `00000000-0000-4000-8000-${index.toString(16).padStart(12, "0")}`,
              foldGrammarOf(grammar),
            ),
          ),
        );
        const renamed: FoldedRows<Composed> = {
          ...rows,
          openElementNames: rows.openElementNames.map((row) => ({
            ...row,
            local: "mi",
            namespace: mathmlNamespace,
          })),
        };

        assert.deepStrictEqual(lawsBroken(rows), [], "m:mi inside m:math, and the widget");
        assert.strictEqual(
          rows.openElementNames.length,
          1,
          "the widget is the one foreign element",
        );
        assert.include(lawsBroken(renamed), "MathML foreign element", "the widget named m:mi");
      }),
  );
});

describe("the fixtures the importer accepts today", () => {
  it.effect("simple breaks no law", () =>
    Effect.gen(function* simple() {
      const files = yield* readPackage(fixtures.simple);
      const breaches = breachesOf(yield* judge(files, grammar, laws));

      assert.deepStrictEqual(breaches, [], shown(breaches));
    }).pipe(Effect.provide(NodeServices.layer)),
  );
});

/**
 * Reading 14, restated by the operator on 2026-11-05: a text-entry interaction's
 * `response-identifier` and `string-identifier` are `xs:IDREF`s, and a response declaration's
 * `identifier` is an `xs:ID`, as the XSD types them.
 */
const textEntryItem = (stringIdentifier: string) =>
  withItem(
    `<p id="intro">Pick one.</p>`,
    `<p id="intro">Pick one. <qti-text-entry-interaction response-identifier="TYPED" string-identifier="${stringIdentifier}"/></p>`,
  );

const typedDeclarations = `<qti-response-declaration identifier="TYPED" cardinality="single" base-type="string"/><qti-response-declaration identifier="SPELLED" cardinality="single" base-type="string"/>`;

const withDeclarations = (files: Readonly<Record<string, string>>) => ({
  ...files,
  "item.xml": edit(
    files["item.xml"] ?? "",
    `<qti-outcome-declaration identifier="SCORE"`,
    `${typedDeclarations}<qti-outcome-declaration identifier="SCORE"`,
  ),
});

describe("reading 14: text-entry references are IDREFs, response identifiers IDs", () => {
  it.effect("references that name response declarations break no reference or id law", () =>
    Effect.gen(function* resolved() {
      const breaches = breachesOf(yield* judged(withDeclarations(textEntryItem("SPELLED"))));

      assert.deepStrictEqual(
        breaches.filter(
          ({ law }) => ruleOf(law) === "idref-target" || ruleOf(law) === "document-key",
        ),
        [],
        shown(breaches),
      );
    }),
  );

  it.effect("a string-identifier naming no id breaks Idref target", () =>
    Effect.gen(function* dangling() {
      const breaches = breachesOf(yield* judged(withDeclarations(textEntryItem("NOWHERE"))));

      assert.include(
        breaches.map(({ law }) => `${law} ${ruleOf(law)}`),
        "Idref target idref-target",
        shown(breaches),
      );
    }),
  );
});

/**
 * The SSML namespace's declaration, which the SSML cases write on each `speak`.
 */
const ssmlNamespace = `xmlns:ssml="http://www.w3.org/2001/10/synthesis"`;

/**
 * The MathML namespace's declaration, which the MathML cases write on each `math`.
 */
const mathNamespace = `xmlns:m="http://www.w3.org/1998/Math/MathML"`;

/**
 * The XML Schema instance namespace's declaration, which the `xsi:type` cases write in place.
 */
const xsiNamespace = `xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"`;

/**
 * Place SSML in the base item's body: one `speak` fragment, or several, after its paragraph.
 *
 * @param fragments - Each fragment's attributes beyond `version` and `xml:lang`, and its content.
 * @returns The base package with the item edited.
 */
const withSpeech = (...fragments: readonly (readonly [string, string])[]) =>
  withItem(
    `<p id="intro">Pick one.</p>`,
    `<p id="intro">Pick one.</p>${fragments
      .map(
        ([attributes, content]) =>
          `<p><ssml:speak ${ssmlNamespace} version="1.1" xml:lang="en"${attributes}>${content}</ssml:speak></p>`,
      )
      .join("")}`,
  );

/**
 * Place MathML in the base item's body, after its paragraph.
 *
 * @param content - The `math` element's content.
 * @returns The base package with the item edited.
 */
const withMath = (content: string) =>
  withItem(
    `<p id="intro">Pick one.</p>`,
    `<p id="intro">Pick one.</p><p><m:math ${mathNamespace}>${content}</m:math></p>`,
  );

/**
 * Replace the base item's response processing's score with an expression.
 *
 * @param expression - The expression, as written.
 * @returns The base package with the item edited.
 */
const withScore = (expression: string) =>
  withItem(`<qti-base-value base-type="float">1</qti-base-value>`, expression);

/**
 * Packages valid under readings 2, 3, 9, 39, 41, 42, 43, 47, 83 and R7-a, each of which the
 * readings' laws must leave alone: the base package with one valid use of what a law judges.
 */
const unownedValid: readonly {
  readonly files: Readonly<Record<string, string>>;
  readonly name: string;
}[] = [
  { files: withSpeech(["", "hi"]), name: "reading 39: speak version 1.1" },
  {
    files: withItem(
      `<p id="intro">Pick one.</p>`,
      `<p id="intro">Pick one.</p><p><ssml:speak ${ssmlNamespace} version=" 1.1 " xml:lang="en">hi</ssml:speak></p>`,
    ),
    name: "reading 39: version 1.1 with outer whitespace, which NMTOKEN's collapse reads as 1.1",
  },
  {
    files: withSpeech(["", `<ssml:meta name="seeAlso" content="x"/>hi`]),
    name: "reading 41: meta with name",
  },
  {
    files: withSpeech(["", `<ssml:meta http-equiv="Cache-Control" content="no-cache"/>hi`]),
    name: "reading 41: meta with http-equiv",
  },
  {
    files: withSpeech(["", `<ssml:voice gender="female">hi</ssml:voice>`]),
    name: "reading 43: voice with an SSML attribute",
  },
  {
    files: withSpeech(["", `<ssml:voice xml:lang="en">hi</ssml:voice>`]),
    name: "reading 43: voice with only xml:lang, which fragment removal keeps",
  },
  {
    files: withSpeech(["", `<ssml:prosody rate="slow">hi</ssml:prosody>`]),
    name: "reading 43: prosody with rate",
  },
  {
    files: withSpeech(["", `<ssml:voice languages="en-US fr:ca">hi</ssml:voice>`]),
    name: "reading 42: language ranges with an accent",
  },
  {
    files: withSpeech(["", `<ssml:voice languages="">hi</ssml:voice>`]),
    name: "reading 42: the empty string",
  },
  {
    files: withSpeech(["", `<ssml:voice languages="und-Latn zxxa un ux">hi</ssml:voice>`]),
    name: "reading 42: ranges that only begin like und or zxx",
  },
  {
    files: withSpeech(["", `<ssml:mark name="a"/>x<ssml:mark name="a"/>`]),
    name: "reading 3: one mark name twice, which no trim names",
  },
  {
    files: withSpeech([` startmark="a"`, `x<ssml:mark name="a"/>y`]),
    name: "reading 3: startmark naming the fragment's one mark of its name",
  },
  {
    files: withSpeech(
      [` endmark="a"`, `<ssml:mark name="a"/>x`],
      [` startmark=" a "`, `<ssml:mark name="a"/>y`],
    ),
    name: "reading 3: two fragments each with mark a, each trimmed at its own",
  },
  {
    files: withSpeech([
      "",
      `<ssml:lexicon uri="https://example.org/lexicon.pls" xml:id="L"/><ssml:lookup ref="L">y</ssml:lookup>`,
    ]),
    name: "reading 3: lookup naming its fragment's lexicon",
  },
  {
    files: withSpeech(["", `<ssml:s><ssml:voice gender="female">hi</ssml:voice></ssml:s>`]),
    name: "reading 43: a voice inside an s, where no token or w restricts it",
  },
  {
    files: withSpeech(["", `<ssml:s xml:space="preserve">hi</ssml:s>`]),
    name: "reading 43: xml:space on an s",
  },
  {
    files: withSpeech(["", `<ssml:voice gender="">hi</ssml:voice>`]),
    name: "reading 43: a voice whose gender is empty, which the XSD's union admits",
  },
  {
    files: withSpeech(["", `<ssml:prosody pitch="10 Hz">hi</ssml:prosody>`]),
    name: "reading 43: a prosody pitch of a number and a unit, which the XSD's union admits",
  },
  {
    files: withSpeech([
      "",
      `<ssml:audio src="https://example.org/a.mp3" maxage="99999999999999999999">hi</ssml:audio>`,
    ]),
    name: "reading 43: an audio maxage beyond any machine integer, which its integer domain, unbounded, admits",
  },
  ...[
    ["w", "x:noun", ` xmlns:x="urn:x"`],
    ["token", "x:noun", ` xmlns:x="urn:x"`],
    ["token", "noun xml:lang", ""],
    ["w", "noun", ""],
    ["token", "  noun \n verb  ", ""],
  ].map(([tag, role, declaration]) => ({
    files: withSpeech(["", `<ssml:${tag} role="${role}"${declaration}>hi</ssml:${tag}>`]),
    name: `reading 83: an ssml:${tag} role of ${JSON.stringify(role)}${declaration === "" ? "" : " with its prefix bound"}, whose prefixes each resolve`,
  })),
  ...[
    ["a valid value", `<p id="intro" data-ssml='{"break":{"strength":"weak"}}'>Pick one.</p>`],
    [
      "a name written twice, which RFC 8259 admits",
      `<p id="intro" data-ssml='{"break":{"strength":"weak"},"break":{"time":"1s"}}'>Pick one.</p>`,
    ],
    [
      "an escaped name and members in any order",
      `<p id="intro" data-ssml='{ "sub" : {"alias":"a"}, "b\\u0072eak" : {"time":"1s"} }'>Pick one.</p>`,
    ],
    [
      "any text on an li, which does not declare it, so it is a custom data-* attribute",
      `<p id="intro">Pick one.</p><ul><li data-ssml="not json">a</li></ul>`,
    ],
  ].map(([what, body]) => ({
    files: withItem(`<p id="intro">Pick one.</p>`, body ?? ""),
    name: `R7-a: data-ssml holding ${what}, which Data-SSML admits`,
  })),
  {
    files: withMath(
      `<m:piecewise><m:piece><m:cn>1</m:cn><m:true/></m:piece><m:otherwise><m:cn>2</m:cn></m:otherwise><m:piece><m:cn>3</m:cn><m:false/></m:piece></m:piecewise>`,
    ),
    name: "reading 2: one otherwise between pieces (the RelaxNG's interleave)",
  },
  { files: withMath(`<m:piecewise/>`), name: "reading 2: an empty piecewise" },
  {
    files: withMath(
      `<m:apply><m:diff/><m:bvar><m:degree><m:cn>2</m:cn></m:degree><m:ci>x</m:ci></m:bvar><m:ci>f</m:ci></m:apply>`,
    ),
    name: "reading 2: bvar with its degree first",
  },
  {
    files: withMath(
      `<m:apply><m:sin/><m:ci>x</m:ci></m:apply><m:apply><m:minus/><m:ci>x</m:ci></m:apply><m:apply><m:minus/><m:ci>x</m:ci><m:ci>y</m:ci></m:apply><m:apply><m:root/><m:degree><m:cn>3</m:cn></m:degree><m:ci>x</m:ci></m:apply>`,
    ),
    name: "reading 2: unary sin, minus of one and of two, root with its degree",
  },
  {
    files: withMath(
      `<m:apply><m:grad/><m:bvar><m:ci>x</m:ci></m:bvar><m:bvar><m:ci>y</m:ci></m:bvar><m:apply><m:times/><m:ci>x</m:ci><m:ci>y</m:ci></m:apply></m:apply>`,
    ),
    name: "reading 2: grad with bound variables, as MathML 3 §4.4.4.5's example writes it",
  },
  {
    files: withMath(
      `<m:apply><m:moment/><m:degree><m:cn>3</m:cn></m:degree><m:momentabout><m:mean/></m:momentabout><m:cn>6</m:cn><m:cn>4</m:cn><m:cn>2</m:cn><m:cn>2</m:cn><m:cn>5</m:cn></m:apply>`,
    ),
    name: "reading 2: moment of five arguments, as MathML 3 §4.4.8.6's example writes it",
  },
  {
    files: withMath(
      `<m:apply><m:log/><m:logbase><m:cn>2</m:cn></m:logbase><m:ci>x</m:ci></m:apply>`,
    ),
    name: "R6-head-qualifiers: log with its logbase",
  },
  {
    files: withMath(
      `<m:apply><m:apply><m:ci>f</m:ci></m:apply><m:degree><m:cn>2</m:cn></m:degree><m:ci>x</m:ci></m:apply>`,
    ),
    name: "R6-head-qualifiers: a degree beside an apply, which is no built-in operator",
  },
  {
    files: withMath(
      `<m:apply><m:int/><m:bvar><m:ci>x</m:ci></m:bvar><m:interval><m:ci>a</m:ci><m:ci>b</m:ci></m:interval><m:condition><m:ci>c</m:ci></m:condition><m:ci>x</m:ci></m:apply>`,
    ),
    name: "R6-head-qualifiers: int with the qualifiers every binding application shares",
  },
  {
    files: withMath(`<m:cn type="rational">1<m:sep/>2</m:cn>`),
    name: "reading 2: a rational cn of two parts",
  },
  { files: withMath(`<m:cn base="16">FF</m:cn>`), name: "reading 2: a cn read in base 16" },
  {
    files: withMath(`<m:cn type="hexdouble">7ff8000000000000</m:cn>`),
    name: "R6-hexdouble: a hexdouble of sixteen digits",
  },
  {
    files: withMath(`<m:cn type="constant">&#960;</m:cn>`),
    name: "reading 2: a cn of type constant, which is text",
  },
  {
    files: withMath(`<m:cn base="40">ZZ</m:cn>`),
    name: "reading 2: a cn whose base lies beyond the alphabet, where the digits are application specific",
  },
  {
    files: withMath(
      `<m:maction actiontype="toggle" selection="2"><m:mi>a</m:mi><m:mi>b</m:mi></m:maction>`,
    ),
    name: "reading 2: an maction whose selection names its second of two children",
  },
  {
    files: withMath(`<m:maction actiontype="toggle"><m:mi>a</m:mi></m:maction>`),
    name: "reading 2: an maction with no selection over one child",
  },
  {
    files: withMath(`<m:apply><m:plus/><m:ci id="a">x</m:ci><m:share src="#a"/></m:apply>`),
    name: "reading 2: a share naming an id beside it, which no element dominates itself through",
  },
  {
    files: withMath(`<m:share src="imsmanifest.xml#a"/>`),
    name: "reading 103: a share naming a packaged file, which is no fragment of this document",
  },
  {
    files: withMath(
      `<m:mtable><m:mtr><m:mtd><m:maligngroup/><m:mi>a</m:mi></m:mtd></m:mtr></m:mtable>`,
    ),
    name: "reading 2: an alignment group first in its cell",
  },
  {
    files: withMath(
      `<m:mtable><m:mtr><m:mtd><m:mrow dir="ltr"><m:maligngroup/><m:mi>a</m:mi></m:mrow></m:mtd></m:mtr></m:mtable>`,
    ),
    name: "reading 2: an alignment group under an mrow that changes no direction",
  },
  {
    files: withMath(
      `<m:mtable><m:mtr><m:mtd><m:maction actiontype="toggle"><m:mi>a</m:mi><m:mrow><m:mi>b</m:mi><m:maligngroup/></m:mrow></m:maction></m:mtd></m:mtr></m:mtable>`,
    ),
    name: "reading 2: an alignment group in an maction's child that is not selected",
  },
  {
    files: withMath(`<m:mrow><m:maligngroup/><m:mi>a</m:mi></m:mrow>`),
    name: "reading 2: an alignment group outside a table cell",
  },
  {
    files: {
      ...base,
      "item.xml": edit(
        edit(
          item,
          `<qti-outcome-declaration identifier="SCORE"`,
          `<qti-response-declaration identifier="SLIDER" cardinality="single" base-type="float"/><qti-outcome-declaration identifier="SCORE"`,
        ),
        `<p id="intro">Pick one.</p>`,
        `<p id="intro">Pick one.</p><qti-slider-interaction response-identifier="SLIDER" lower-bound="0" upper-bound="10"/>`,
      ),
    },
    name: "reading 9: a slider whose bounds are in order",
  },
  {
    files: withScore(`<qti-null ${xsiNamespace} xsi:type="EmptyPrimitiveTypeDType"/>`),
    name: "reading 47: xsi:type naming the declared type",
  },
  {
    files: withScore(
      `<qti-null ${xsiNamespace} xmlns:q="${asi}" xsi:type="q:EmptyPrimitiveTypeDType"/>`,
    ),
    name: "reading 47: xsi:type naming the declared type through a bound prefix",
  },
];

/**
 * Packages that break readings 2, 3, 9, 39, 41, 42, 43, 47, 83 and R7-a, each named by the law that
 * refuses it and the rule that law keeps.
 */
const unownedBroken: readonly LawCase[] = [
  {
    files: withItem(
      `<p id="intro">Pick one.</p>`,
      `<p id="intro">Pick one.</p><p><ssml:speak ${ssmlNamespace} version="1.0" xml:lang="en">hi</ssml:speak></p>`,
    ),
    law: "value domain",
    name: "reading 39: speak version 1.0",
    rule: "attribute-lexical",
  },
  {
    files: withSpeech(["", `<ssml:meta name="seeAlso" http-equiv="Cache-Control" content="x"/>hi`]),
    law: "AL5 attribute count",
    name: "reading 41: meta with both name and http-equiv",
    rule: "attribute-count",
  },
  {
    files: withSpeech(["", `<ssml:meta content="x"/>hi`]),
    law: "AL5 attribute count",
    name: "reading 41: meta with neither",
    rule: "attribute-count",
  },
  {
    files: withSpeech(["", `<ssml:voice>hi</ssml:voice>`]),
    law: "AL5 attribute count",
    name: "reading 43: a bare voice",
    rule: "attribute-count",
  },
  {
    files: withSpeech(["", `<ssml:prosody>hi</ssml:prosody>`]),
    law: "AL5 attribute count",
    name: "reading 43: a bare prosody",
    rule: "attribute-count",
  },
  {
    files: withSpeech(["", `<ssml:voice xmlns:f="urn:f" f:x="1">hi</ssml:voice>`]),
    law: "AL5 attribute count",
    name: "reading 43: a voice whose one attribute fragment removal drops",
    rule: "attribute-count",
  },
  {
    files: withSpeech(["", `<ssml:voice languages="und">hi</ssml:voice>`]),
    law: "value domain",
    name: "reading 42: und",
    rule: "attribute-lexical",
  },
  {
    files: withSpeech(["", `<ssml:voice languages="en ZXX">hi</ssml:voice>`]),
    law: "value domain",
    name: "reading 42: zxx in any case",
    rule: "attribute-lexical",
  },
  {
    files: withSpeech(["", `<ssml:voice languages="en:und">hi</ssml:voice>`]),
    law: "value domain",
    name: "reading 42: und as an accent",
    rule: "attribute-lexical",
  },
  {
    files: withSpeech(["", `<ssml:voice languages="en_US">hi</ssml:voice>`]),
    law: "value domain",
    name: "reading 42: a token that is no language range",
    rule: "attribute-lexical",
  },
  {
    files: withSpeech(["", `<ssml:voice languages="abcdefghi">hi</ssml:voice>`]),
    law: "value domain",
    name: "reading 42: a first subtag of nine letters",
    rule: "attribute-lexical",
  },
  {
    files: withSpeech([` startmark="b"`, `x<ssml:mark name="a"/>`]),
    law: "SSML trim mark",
    name: "reading 3: startmark naming no mark",
    rule: "ssml-fragment",
  },
  {
    files: withSpeech([` endmark="a"`, `<ssml:mark name="a"/>x<ssml:mark name="a"/>`]),
    law: "SSML trim mark",
    name: "reading 3: endmark naming a mark defined twice",
    rule: "ssml-fragment",
  },
  {
    files: withSpeech(["", `<ssml:mark name="a"/>x`], [` startmark="a"`, "y"]),
    law: "SSML trim mark",
    name: "reading 3: startmark naming another fragment's mark",
    rule: "ssml-fragment",
  },
  {
    files: withSpeech(
      ["", `<ssml:lexicon uri="https://example.org/lexicon.pls" xml:id="L"/>x`],
      ["", `<ssml:lookup ref="L">y</ssml:lookup>`],
    ),
    law: "SSML lexicon reference",
    name: "reading 3: lookup naming another fragment's lexicon",
    rule: "ssml-fragment",
  },
  {
    files: withSpeech(["", `<ssml:p xml:id="P">x</ssml:p><ssml:lookup ref="P">y</ssml:lookup>`]),
    law: "SSML lexicon reference",
    name: "reading 3: lookup naming an id that is no lexicon's",
    rule: "ssml-fragment",
  },
  {
    files: withMath(
      `<m:piecewise><m:otherwise><m:cn>1</m:cn></m:otherwise><m:otherwise><m:cn>2</m:cn></m:otherwise></m:piecewise>`,
    ),
    law: "N5 Follow",
    name: "reading 2: piecewise with two otherwise",
    rule: "ordering",
  },
  {
    files: withMath(`<m:apply><m:forall/><m:bvar/><m:ci>x</m:ci></m:apply>`),
    law: "N7 Last",
    name: "reading 2: an empty bvar",
    rule: "child-set",
  },
  {
    files: withMath(
      `<m:apply><m:forall/><m:bvar><m:ci>x</m:ci><m:ci>y</m:ci></m:bvar><m:ci>x</m:ci></m:apply>`,
    ),
    law: "N5 Follow",
    name: "reading 2: bvar with two variables",
    rule: "ordering",
  },
  {
    files: withMath(
      `<m:apply><m:diff/><m:bvar><m:ci>x</m:ci><m:degree><m:cn>2</m:cn></m:degree><m:degree><m:cn>3</m:cn></m:degree></m:bvar><m:ci>f</m:ci></m:apply>`,
    ),
    law: "N5 Follow",
    name: "reading 2: bvar with two degrees",
    rule: "ordering",
  },
  {
    files: withMath(`<m:apply><m:sin/><m:cn>1</m:cn><m:cn>2</m:cn></m:apply>`),
    law: "MathML arity",
    name: "reading 2: sin of two arguments",
    rule: "math-arity",
  },
  {
    files: withMath(`<m:apply><m:sin/></m:apply>`),
    law: "MathML arity",
    name: "reading 2: sin of none",
    rule: "math-arity",
  },
  {
    files: withMath(`<m:apply><m:divide/><m:ci>x</m:ci></m:apply>`),
    law: "MathML arity",
    name: "reading 2: divide of one",
    rule: "math-arity",
  },
  {
    files: withMath(`<m:apply><m:minus/><m:ci>x</m:ci><m:ci>y</m:ci><m:ci>z</m:ci></m:apply>`),
    law: "MathML arity",
    name: "reading 2: minus of three",
    rule: "math-arity",
  },
  {
    files: withMath(
      `<m:apply><m:sin/><m:logbase><m:cn>2</m:cn></m:logbase><m:ci>x</m:ci></m:apply>`,
    ),
    law: "MathML head qualifier",
    name: "R6-head-qualifiers: sin with a logbase",
    rule: "admission",
  },
  {
    files: withMath(`<m:cn type="rational">12</m:cn>`),
    law: "MathML cn form",
    name: "reading 2: a rational cn of one part",
    rule: "attribute-lexical",
  },
  {
    files: withMath(`<m:cn type="hexdouble">7ff8</m:cn>`),
    law: "MathML cn form",
    name: "R6-hexdouble: a hexdouble of four digits",
    rule: "attribute-lexical",
  },
  {
    files: withMath(`<m:cn type="integer">abc</m:cn>`),
    law: "MathML cn form",
    name: "reading 2: an integer cn of letters",
    rule: "attribute-lexical",
  },
  {
    files: withMath(
      `<m:maction actiontype="toggle" selection="3"><m:mi>a</m:mi><m:mi>b</m:mi></m:maction>`,
    ),
    law: "MathML maction selection",
    name: "reading 2: an maction whose selection names a third of two children",
    rule: "union-count",
  },
  {
    files: withMath(
      `<m:mtable><m:mtr><m:mtd><m:mfrac><m:mrow><m:maligngroup/><m:mi>a</m:mi></m:mrow><m:mi>b</m:mi></m:mfrac></m:mtd></m:mtr></m:mtable>`,
    ),
    law: "MathML align placement",
    name: "reading 2: an alignment group under an mfrac in a table cell",
    rule: "admission",
  },
  {
    files: withMath(
      `<m:mtable><m:mtr><m:mtd><m:mrow dir="rtl"><m:maligngroup/><m:mi>a</m:mi></m:mrow></m:mtd></m:mtr></m:mtable>`,
    ),
    law: "MathML align placement",
    name: "reading 2: an alignment group under an mrow that changes the direction",
    rule: "admission",
  },
  {
    files: withMath(
      `<m:mtable><m:mtr><m:mtd><m:mi>a</m:mi><m:maligngroup/><m:mi>b</m:mi></m:mtd></m:mtr></m:mtable>`,
    ),
    law: "MathML align first",
    name: "reading 2: a cell whose first complete element is no alignment group",
    rule: "ordering",
  },
  {
    files: withMath(`<m:share src="#nowhere"/>`),
    law: "Idref target",
    name: "reading 2: a share whose fragment names no id of its document",
    rule: "idref-target",
  },
  {
    files: withMath(`<m:apply id="a"><m:plus/><m:share src="#a"/><m:cn>1</m:cn></m:apply>`),
    law: "MathML share cycle",
    name: "reading 2: a share inside the element it names",
    rule: "document-key",
  },
  {
    files: withMath(
      `<m:apply id="a"><m:plus/><m:share src="#b"/></m:apply><m:apply id="b"><m:plus/><m:share src="#a"/></m:apply>`,
    ),
    law: "MathML share cycle",
    name: "reading 2: two applies each holding a share of the other",
    rule: "document-key",
  },
  {
    files: withScore(
      `<qti-null ${xsiNamespace} xmlns:xs="http://www.w3.org/2001/XMLSchema" xsi:type="xs:anyType"/>`,
    ),
    law: "XsiType derived",
    name: "reading 47: xsi:type naming a base of the declared type",
    rule: "xsi-type",
  },
  {
    files: withScore(`<qti-null ${xsiNamespace} xsi:type="ValueDType"/>`),
    law: "XsiType derived",
    name: "reading 47: xsi:type naming a type not derived from the declared one",
    rule: "xsi-type",
  },
  {
    files: {
      ...base,
      "item.xml": edit(
        edit(
          item,
          `<qti-outcome-declaration identifier="SCORE"`,
          `<qti-response-declaration identifier="SLIDER" cardinality="single" base-type="float"/><qti-outcome-declaration identifier="SCORE"`,
        ),
        `<p id="intro">Pick one.</p>`,
        `<p id="intro">Pick one.</p><qti-slider-interaction response-identifier="SLIDER" lower-bound="10" upper-bound="0"/>`,
      ),
    },
    law: "Slider bounds",
    name: "reading 9: a slider whose upper bound is below its lower",
    rule: "slider-bounds",
  },
];

/**
 * Packages whose `xsi:type` breaks XML Schema's clause 4.1 or 4.2 (a value that is no QName in
 * scope, or one that names no type), or whose SSML `role` item names a prefix nothing binds, which
 * shred cannot represent: the codec refuses them before any law reads a row (shred's
 * `type-unresolved`, `type-unknown` and `prefix-unbound`; the reason is shred's own test's to
 * assert, and the bound twins in the valid cases show the prefix is the cause).
 */
const unownedCodec: readonly {
  readonly files: Readonly<Record<string, string>>;
  readonly name: string;
}[] = [
  {
    files: withScore(`<qti-null ${xsiNamespace} xsi:type="NoSuchDType"/>`),
    name: "reading 47: xsi:type naming no type",
  },
  {
    files: withScore(`<qti-null ${xsiNamespace} xsi:type="q:EmptyPrimitiveTypeDType"/>`),
    name: "reading 47: xsi:type whose prefix is unbound",
  },
  {
    files: {
      ...base,
      "imsmanifest.xml": edit(
        manifestOf(itemResource),
        "<schemaversion>3.0.1</schemaversion>",
        `<schemaversion ${xsiNamespace} xsi:type="v">3.0.1</schemaversion>`,
      ),
    },
    name: "reading 47: xsi:type on an element of an anonymous type, naming no type (case 130)",
  },
  ...["w", "token"].flatMap((tag) => [
    {
      files: withSpeech(["", `<ssml:${tag} role="x:noun">hi</ssml:${tag}>`]),
      name: `reading 83: an ssml:${tag} role item whose prefix is unbound`,
    },
    {
      files: withSpeech(["", `<ssml:${tag} role="noun y:verb">hi</ssml:${tag}>`]),
      name: `reading 83: an ssml:${tag} role whose second item's prefix is unbound`,
    },
  ]),
];

/**
 * R7-a's refused values: a closed `data-ssml` that Data-SSML 1.0 does not admit (an unknown name, a
 * value of the wrong type, a value outside an enumeration, text that is not JSON). The importer
 * refuses them under `attribute-lexical` and the oracle must agree, the oracle with its own reader
 * (`src/test/oracle-laws/data-ssml.ts`), written from the schema apart from the importer's
 * (`src/vocab/data-ssml.ts`), which the purity guard keeps it from reading;
 * `src/vocab/data-ssml.test.ts` pins the same values.
 */
const unownedDataSsml: readonly {
  readonly files: Readonly<Record<string, string>>;
  readonly name: string;
}[] = [
  ["an unknown name", `{"brk":{}}`],
  ["a value of the wrong type", `{"break":{"time":2}}`],
  ["a value outside an enumeration", `{"break":{"strength":"loud"}}`],
  ["text that is not JSON", `not json`],
].map(([what, value]) => ({
  files: withItem(
    `<p id="intro">Pick one.</p>`,
    `<p id="intro" data-ssml='${value ?? ""}'>Pick one.</p>`,
  ),
  name: `R7-a: data-ssml holding ${what}`,
}));

describe("the unowned readings 2, 3, 9, 39, 41, 42, 43, 47, 83 and R7-a", () => {
  for (const { files, name } of unownedValid) {
    it.effect(`no law refuses ${name}`, () =>
      Effect.gen(function* valid() {
        const breaches = breachesOf(yield* judged(files));

        assert.deepStrictEqual(breaches, [], shown(breaches));
      }),
    );
  }

  for (const { files, name } of unownedCodec) {
    it.effect(`the codec refuses ${name} under unmodeled-vocabulary`, () =>
      Effect.gen(function* codec() {
        assert.deepStrictEqual(verdictOf(yield* judged(files)), {
          rule: "unmodeled-vocabulary",
          verdict: "refused",
        });
      }),
    );
  }

  for (const { files, name } of unownedDataSsml) {
    it.effect(`the codec refuses ${name} under attribute-lexical`, () =>
      Effect.gen(function* dataSsml() {
        const judgment = yield* judged(files);

        assert.strictEqual(judgment._tag, "CodecRefusal");
        assert.deepStrictEqual(verdictOf(judgment), {
          rule: "attribute-lexical",
          verdict: "refused",
        });
      }),
    );
  }

  for (const { files, law, name, rule } of unownedBroken) {
    it.effect(`${law} refuses ${name} under ${rule}`, () =>
      Effect.gen(function* broken() {
        const breaches = breachesOf(yield* judged(files));

        assert.isTrue(
          breaches.some((breach) => breach.law === law && ruleOf(breach.law) === rule),
          shown(breaches),
        );
      }),
    );
  }
});

describe("the laws the information model states, read as it states them (readings 74 to 80)", () => {
  it.effect(
    "a default hotspot followed by whitespace or a comment is last among its elements",
    () =>
      Effect.gen(function* lastElement() {
        for (const after of ["\n", "<!-- c -->"]) {
          const breaches = breachesOf(
            yield* judged(
              hotspots(
                `<qti-hotspot-choice identifier="A" shape="rect" coords="0,0,1,1"/><qti-hotspot-choice identifier="B" shape="default" coords="0,0,1,1"/>${after}`,
              ),
            ),
          );

          assert.isFalse(
            breaches.some(({ law }) => law === "default hotspot last slot"),
            shown(breaches),
          );
        }
      }),
  );

  it.effect("feedback and a printed variable may name the built-in outcome completionStatus", () =>
    Effect.gen(function* builtIn() {
      const breaches = breachesOf(
        yield* judged(
          withItem(
            `<p id="intro">Pick one.</p>`,
            `<p id="intro">Pick one. <qti-feedback-inline outcome-identifier="completionStatus" identifier="completed" show-hide="show">Done</qti-feedback-inline> <qti-printed-variable identifier="completionStatus"/></p>`,
          ),
        ),
      );

      assert.deepStrictEqual(breaches, [], shown(breaches));
    }),
  );

  it.effect("a printed variable may not name a built-in response variable", () =>
    Effect.gen(function* responseBuiltIn() {
      const breaches = breachesOf(
        yield* judged(
          withItem(
            `<p id="intro">Pick one.</p>`,
            `<p id="intro">Pick one. <qti-printed-variable identifier="numAttempts"/></p>`,
          ),
        ),
      );

      assert.isTrue(
        breaches.some(({ law }) => law === "Printed variable reference"),
        shown(breaches),
      );
    }),
  );
});

/**
 * How long one case of the generated laws below may run: one package judged.
 */
const lawCaseHang = Duration.seconds(30);

/**
 * Write an item whose body holds the given interactions after the given declarations, with no
 * processing.
 *
 * @param declarations - The declarations, as written.
 * @param body - The item body's content, as written.
 * @returns The package of the item and its manifest.
 */
const itemWith = (declarations: string, body: string) => ({
  "imsmanifest.xml": manifestOf(itemResource),
  "item.xml": `<qti-assessment-item xmlns="${asi}" identifier="item" title="Item" time-dependent="false">${declarations}<qti-item-body>${body}</qti-item-body></qti-assessment-item>`,
});

/**
 * Select the breaches of one law.
 *
 * @param breaches - The breaches.
 * @param law - The law.
 * @returns Those of the law.
 */
const ofLaw = (breaches: readonly Breach[], law: LawName): readonly Breach[] =>
  breaches.filter((breach) => breach.law === law);

/**
 * One case of reading 18's and 67's bounds: an interaction kind, its number of choices, and its
 * `min-choices` and `max-choices`, each unwritten or a count.
 */
interface BoundCase {
  readonly choices: number;
  readonly kind:
    | "qti-choice-interaction"
    | "qti-graphic-order-interaction"
    | "qti-order-interaction";
  readonly max: number | undefined;
  readonly min: number | undefined;
}

/**
 * Draw a count attribute: unwritten, or 0 to 4.
 */
const countGen: Gen<number | undefined> = (source) =>
  source.draw(boolean) ? source.draw(int(0, 4)) : undefined;

/**
 * Draw a bound case: every kind, 1 to 3 choices, and every pair of counts, a space of 3 × 3 × 6 ×
 * 6 = 324 cases.
 */
const boundCase: Gen<BoundCase> = (source) => ({
  choices: source.draw(int(1, 3)),
  kind: source.draw(
    element([
      "qti-order-interaction",
      "qti-graphic-order-interaction",
      "qti-choice-interaction",
    ] as const),
  ),
  max: source.draw(countGen),
  min: source.draw(countGen),
});

/**
 * Write a bound case as an item: the interaction bound to an ordered or multiple identifier
 * response, its choices, and its counts.
 *
 * @param bound - The case.
 * @returns The package.
 */
const boundItem = ({ choices, kind, max, min }: BoundCase) => {
  const counts = [
    ...(min === undefined ? [] : [`min-choices="${String(min)}"`]),
    ...(max === undefined ? [] : [`max-choices="${String(max)}"`]),
  ].join(" ");
  const ids = Array.from({ length: choices }, (_, at) => `C${String(at)}`);
  const inner =
    kind === "qti-graphic-order-interaction"
      ? `<object data="a.png" type="image/png"/>${ids.map((id) => `<qti-hotspot-choice identifier="${id}" shape="rect" coords="0,0,1,1"/>`).join("")}`
      : ids.map((id) => `<qti-simple-choice identifier="${id}">${id}</qti-simple-choice>`).join("");
  const cardinality = kind === "qti-choice-interaction" ? "multiple" : "ordered";

  return itemWith(
    `<qti-response-declaration identifier="RESPONSE" cardinality="${cardinality}" base-type="identifier"/>`,
    `<${kind} response-identifier="RESPONSE" ${counts}>${inner}</${kind}>`,
  );
};

/**
 * Reading 18's and 67's bounds, restated from the information model: an order interaction's
 * counts bind only where `min-choices` is written, and then `min-choices` is at most the choices
 * and a written `max-choices` from `min-choices` to the choices, 0 a count like any other
 * (§5.97.2, §5.97.3, §5.61.1, §5.61.2); a choice interaction's `min-choices` is at most a
 * `max-choices` that is not 0, which "imposes no restriction" (§5.30.2, §5.30.3), each unwritten
 * count read as its XSD default (0 and 1), and its choices bound nothing.
 *
 * @param bound - The case.
 * @returns How many of its counts break the bounds.
 */
const boundsBroken = ({ choices, kind, max, min }: BoundCase): number => {
  if (kind === "qti-choice-interaction") {
    // An unwritten count reads its XSD default: `min-choices` 0, `max-choices` 1.
    const most = max ?? 1;

    return most !== 0 && (min ?? 0) > most ? 1 : 0;
  }

  if (min === undefined) {
    return 0;
  }

  return [max !== undefined && min > max, min > choices, max !== undefined && max > choices].filter(
    Boolean,
  ).length;
};

/**
 * Write a manifest resource that lists one file as its href.
 *
 * @param identifier - The resource's identifier.
 * @param type - Its type.
 * @param href - The file.
 * @returns The resource, as written.
 */
const resourceOf = (identifier: string, type: string, href: string): string =>
  `<resource identifier="${identifier}" type="${type}" href="${href}"><file href="${href}"/></resource>`;

/**
 * Write a package whose test holds one section that includes `s.xml` with the given attributes on
 * its `xi:include`, beside its one item ref.
 *
 * @param attributes - The include's attributes beside `href`, as written.
 * @returns The package.
 */
const includingTest = (attributes: string) => ({
  "imsmanifest.xml": manifestOf(
    `${resourceOf("RT", "imsqti_test_xmlv3p0", "test.xml")}${itemResource}`,
  ),
  "item.xml": `<qti-assessment-item xmlns="${asi}" identifier="item" title="Item" time-dependent="false"/>`,
  "test.xml": `<qti-assessment-test xmlns="${asi}" xmlns:xi="http://www.w3.org/2001/XInclude" identifier="T" title="Test"><qti-test-part identifier="P" navigation-mode="linear" submission-mode="individual"><qti-assessment-section identifier="S" title="Section" visible="true"><qti-assessment-item-ref identifier="I" href="item.xml"/><xi:include href="s.xml" ${attributes}/></qti-assessment-section></qti-test-part></qti-assessment-test>`,
});

describe("the laws readings 18, 74, 85 and 92 state, over generated packages", () => {
  it.effect(
    "Choice bounds: an order interaction's counts as reading 18 bounds them, a choice interaction's as reading 76 does",
    (ctx) =>
      searched(
        ctx,
        exhaust(
          {
            box: "every case of 3 interaction kinds, 1 to 3 choices, and a min-choices and a max-choices each unwritten or 0 to 4",
            caseHang: lawCaseHang,
            coverage: requiredInSpace<"held" | "broken" | "zero most" | "beyond choices">([
              "held",
              "broken",
              "zero most",
              "beyond choices",
            ]),
            generator: boundCase,
            limit: 324,
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "readings 18 and 76, the information model's §5.97.2, §5.97.3, §5.61.1, §5.61.2, §5.30.2 and §5.30.3 restated as boundsBroken",
            },
            suite: "oracle/choice-bounds-reading-18",
          },
          (bound, c) =>
            Effect.gen(function* bounds() {
              const expected = boundsBroken(bound);
              c.note(expected === 0 ? "held" : "broken");
              if (bound.max === 0 && bound.min !== undefined) {
                c.note("zero most");
              }

              if (Math.max(bound.min ?? 0, bound.max ?? 0) > bound.choices) {
                c.note("beyond choices");
              }

              const breaches = ofLaw(breachesOf(yield* judged(boundItem(bound))), "Choice bounds");

              assert.strictEqual(breaches.length, expected, shown(breaches));
            }),
        ),
      ),
    testTimeoutMs,
  );

  it.effect(
    "Binding unique: an item breaks it exactly once for each interaction past the first that binds a response",
    (ctx) =>
      searched(
        ctx,
        exhaust(
          {
            box: "every list of 1 to 3 interactions, each binding R0, declared, or R1, not",
            caseHang: lawCaseHang,
            coverage: requiredInSpace<"unique" | "shared" | "undeclared shared">([
              "unique",
              "shared",
              "undeclared shared",
            ]),
            // Each of up to three interactions binds one of two responses, R0 declared and R1 not.
            generator: (source) =>
              Array.from({ length: source.draw(int(1, 3)) }, () => source.draw(int(0, 1))),
            limit: 20,
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "reading 92, §2.2.2.2: a response n interactions bind breaks it n − 1 times",
            },
            suite: "oracle/binding-unique",
          },
          (bound, c) =>
            Effect.gen(function* unique() {
              const counts = [0, 1].map((at) => bound.filter((held) => held === at).length);
              const expected = counts.reduce((sum, count) => sum + Math.max(0, count - 1), 0);
              c.note(expected === 0 ? "unique" : "shared");
              if ((counts[1] ?? 0) > 1) {
                c.note("undeclared shared");
              }

              const body = bound
                .map(
                  (at) =>
                    `<qti-choice-interaction response-identifier="R${String(at)}" max-choices="1"><qti-simple-choice identifier="A">A</qti-simple-choice></qti-choice-interaction>`,
                )
                .join("");
              const breaches = ofLaw(
                breachesOf(
                  yield* judged(
                    itemWith(
                      `<qti-response-declaration identifier="R0" cardinality="single" base-type="identifier"/>`,
                      body,
                    ),
                  ),
                ),
                "Binding unique",
              );

              // Oracle: reading 92, "Each response variable declared may be bound to one and only
              // one interaction" (§2.2.2.2): a response named by n interactions breaks it n − 1
              // times, declared or not.
              assert.strictEqual(breaches.length, expected, shown(breaches));
            }),
        ),
      ),
    testTimeoutMs,
  );

  it.effect(
    "Binding cardinality: a select point interaction whose max-choices, or its default 0, is not 1 binds a multiple response",
    (ctx) =>
      searched(
        ctx,
        exhaust(
          {
            box: "every cardinality of single and multiple by every max-choices of unwritten, 0, 1 and 2",
            caseHang: lawCaseHang,
            coverage: requiredInSpace<"bound" | "unbound" | "default">([
              "bound",
              "unbound",
              "default",
            ]),
            generator: (source) => ({
              cardinality: source.draw(element(["single", "multiple"] as const)),
              max: source.draw(element([undefined, 0, 1, 2] as const)),
            }),
            limit: 8,
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "reading 92, §5.128.2, an unwritten max-choices read as its XSD default, 0",
            },
            suite: "oracle/binding-cardinality-select-point",
          },
          ({ cardinality, max }, c) =>
            Effect.gen(function* selectPoint() {
              // Oracle: reading 92, §5.128.2: "If max-choices is greater than 1 (or 0) then the
              // interaction must be bound to a response with multiple cardinality", an unwritten
              // max-choices read as its XSD default, 0.
              const most = max ?? 0;
              const broken = (most === 0 || most > 1) && cardinality === "single";
              c.note(broken ? "bound" : "unbound");
              if (max === undefined) {
                c.note("default");
              }

              const breaches = ofLaw(
                breachesOf(
                  yield* judged(
                    itemWith(
                      `<qti-response-declaration identifier="R" cardinality="${cardinality}" base-type="point"/>`,
                      `<qti-select-point-interaction response-identifier="R"${max === undefined ? "" : ` max-choices="${String(max)}"`}><object data="a.png" type="image/png"/></qti-select-point-interaction>`,
                    ),
                  ),
                ),
                "Binding cardinality",
              );

              assert.strictEqual(breaches.length, broken ? 1 : 0, shown(breaches));
            }),
        ),
      ),
    testTimeoutMs,
  );

  it.effect(
    "DocumentId key: a context declaration's identifier is one of its document's IDs (reading 74)",
    (ctx) =>
      searched(
        ctx,
        exhaust(
          {
            box: "every context identifier of X, intro and RESPONSE",
            caseHang: lawCaseHang,
            coverage: requiredInSpace<"distinct" | "element id" | "response id">([
              "distinct",
              "element id",
              "response id",
            ]),
            generator: (source) => source.draw(element(["X", "intro", "RESPONSE"] as const)),
            limit: 3,
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "reading 74, §5.34.1 and §7.43: a context identifier shares no value with an xs:ID of its document",
            },
            suite: "oracle/document-id-context",
          },
          (context, c) =>
            Effect.gen(function* contextIds() {
              // Oracle: reading 74: a context's identifier is a UniqueIdentifier, "unique within
              // the scope of the instance" (§5.34.1, §7.43), so it shares no value with an element
              // id or a response declaration's identifier, each an xs:ID.
              const situations = {
                RESPONSE: "response id",
                X: "distinct",
                intro: "element id",
              } as const;
              c.note(situations[context]);

              const breaches = ofLaw(
                breachesOf(
                  yield* judged(
                    itemWith(
                      `<qti-context-declaration identifier="${context}" cardinality="single" base-type="identifier"/><qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/>`,
                      `<p id="intro">Pick one.</p><qti-choice-interaction response-identifier="RESPONSE" max-choices="1"><qti-simple-choice identifier="A">A</qti-simple-choice></qti-choice-interaction>`,
                    ),
                  ),
                ),
                "DocumentId key",
              );

              assert.strictEqual(breaches.length, context === "X" ? 0 : 1, shown(breaches));
            }),
        ),
      ),
    testTimeoutMs,
  );

  it.effect(
    "Inclusion cycle: a package breaks it exactly when its section refs and includes lead some document back to itself",
    (ctx) =>
      searched(
        ctx,
        exhaust(
          {
            box: "every graph of a test and two section documents, each of its 6 edges absent, a section ref or an include",
            caseHang: lawCaseHang,
            coverage: requiredInSpace<"acyclic" | "cyclic" | "self" | "shared target" | "include">([
              "acyclic",
              "cyclic",
              "self",
              "shared target",
              "include",
            ]),
            // A test and two section documents; each of the three may reference each section,
            // through a section ref or an include: 3^6 = 729 graphs, each edge absent, a ref or
            // an include.
            generator: (source) => Array.from({ length: 6 }, () => source.draw(int(0, 2))),
            limit: 729,
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "reading 85's rule as a naive reachability over the case's references",
            },
            suite: "oracle/inclusion-cycle",
          },
          (edges, c) =>
            Effect.gen(function* cycles() {
              const documents = ["test.xml", "s0.xml", "s1.xml"] as const;
              const targets = ["s0.xml", "s1.xml"] as const;
              const from = (at: number) => documents[Math.floor(at / 2)] ?? "";
              const to = (at: number) => targets[at % 2] ?? "";
              const held = edges.flatMap((kind, at) => (kind === 0 ? [] : [{ at, kind }]));
              // Oracle: the reading's rule turned into a checker, a naive reachability: some
              // document reaches itself through one or more references.
              const targetsOf = (path: string) =>
                held.filter(({ at }) => from(at) === path).map(({ at }) => to(at));
              const reaches = (start: string): boolean => {
                const seen = new Set<string>();
                const pending = targetsOf(start);
                for (let at = pending.pop(); at !== undefined; at = pending.pop()) {
                  if (at === start) {
                    return true;
                  }

                  if (!seen.has(at)) {
                    seen.add(at);
                    pending.push(...targetsOf(at));
                  }
                }

                return false;
              };
              const cyclic = documents.some(reaches);
              c.note(cyclic ? "cyclic" : "acyclic");
              if (held.some(({ at }) => from(at) === to(at))) {
                c.note("self");
              }

              if (new Set(held.map(({ at }) => to(at))).size < held.length) {
                c.note("shared target");
              }

              if (held.some(({ kind }) => kind === 2)) {
                c.note("include");
              }

              const parts = (path: string) =>
                held
                  .filter(({ at }) => from(at) === path)
                  .map(({ at, kind }) =>
                    kind === 1
                      ? `<qti-assessment-section-ref identifier="ref${String(at)}" href="${to(at)}"/>`
                      : `<xi:include href="${to(at)}"/>`,
                  )
                  .join("");
              const section = (path: string, identifier: string) =>
                `<qti-assessment-section xmlns="${asi}" xmlns:xi="http://www.w3.org/2001/XInclude" identifier="${identifier}" title="Section" visible="true"><qti-assessment-item-ref identifier="I${identifier}" href="item.xml"/>${parts(path)}</qti-assessment-section>`;
              const breaches = ofLaw(
                breachesOf(
                  yield* judged({
                    "imsmanifest.xml": manifestOf(
                      [
                        resourceOf("RT", "imsqti_test_xmlv3p0", "test.xml"),
                        resourceOf("R0", "imsqti_section_xmlv3p0", "s0.xml"),
                        resourceOf("R1", "imsqti_section_xmlv3p0", "s1.xml"),
                        itemResource,
                      ].join(""),
                    ),
                    "item.xml": `<qti-assessment-item xmlns="${asi}" identifier="item" title="Item" time-dependent="false"/>`,
                    "s0.xml": section("s0.xml", "S0"),
                    "s1.xml": section("s1.xml", "S1"),
                    "test.xml": `<qti-assessment-test xmlns="${asi}" xmlns:xi="http://www.w3.org/2001/XInclude" identifier="T" title="Test"><qti-test-part identifier="P" navigation-mode="linear" submission-mode="individual"><qti-assessment-section identifier="S" title="Section" visible="true"><qti-assessment-item-ref identifier="IT" href="item.xml"/>${parts("test.xml")}</qti-assessment-section></qti-test-part></qti-assessment-test>`,
                  }),
                ),
                "Inclusion cycle",
              );

              assert.strictEqual(breaches.length > 0, cyclic, shown(breaches));
              // Each reported chain is a cycle of the graph: every step a reference, and the last
              // leading back to the first.
              for (const breach of breaches) {
                const chain = (breach.keys["chain"] ?? "").split(" ");
                for (const [at, path] of chain.entries()) {
                  assert.include(targetsOf(path), chain[(at + 1) % chain.length], shown([breach]));
                }
              }
            }),
        ),
      ),
    testTimeoutMs,
  );

  it.effect(
    "default hotspot last slot: a hotspot choice's default stands last, an associable hotspot's anywhere (reading 80)",
    (ctx) =>
      searched(
        ctx,
        exhaust(
          {
            box: "every case of 3 interaction kinds, 1 to 3 hotspots, and the default at none of them or at any one",
            caseHang: lawCaseHang,
            coverage: requiredInSpace<"last" | "not last" | "associable" | "none">([
              "last",
              "not last",
              "associable",
              "none",
            ]),
            generator: (source) => {
              const count = source.draw(int(1, 3));

              return {
                at: source.draw(int(-1, count - 1)),
                count,
                kind: source.draw(
                  element([
                    "qti-hotspot-interaction",
                    "qti-graphic-order-interaction",
                    "qti-graphic-associate-interaction",
                  ] as const),
                ),
              };
            },
            limit: 27,
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "reading 80, §5.67, §5.68.6, §5.7 and §5.59.4: a hotspot choice's default stands last, an associable hotspot's anywhere",
            },
            suite: "oracle/default-hotspot-reading-80",
          },
          ({ at, count, kind }, c) =>
            Effect.gen(function* defaultHotspot() {
              // Oracle: reading 80: "The default hotspot, if defined, must appear last" of the
              // HotspotChoice class and the hotspot interaction's choices (§5.67, §5.68.6), and
              // nothing of the AssociableHotspot class (§5.7, §5.59.4).
              const associable = kind === "qti-graphic-associate-interaction";
              const broken = !associable && at >= 0 && at !== count - 1;
              if (at < 0) {
                c.note("none");
              } else if (associable) {
                c.note("associable");
              } else {
                c.note(broken ? "not last" : "last");
              }

              const choice = associable ? "qti-associable-hotspot" : "qti-hotspot-choice";
              const spots = Array.from(
                { length: count },
                (_, held) =>
                  `<${choice} identifier="H${String(held)}" ${held === at ? `shape="default"` : `shape="rect" coords="0,0,1,1"`}${associable ? ` match-max="1"` : ""}/>`,
              ).join("");
              const cardinality = {
                "qti-graphic-associate-interaction": "multiple",
                "qti-graphic-order-interaction": "ordered",
                "qti-hotspot-interaction": "single",
              }[kind];
              const breaches = ofLaw(
                breachesOf(
                  yield* judged(
                    itemWith(
                      `<qti-response-declaration identifier="R" cardinality="${cardinality}" base-type="${associable ? "pair" : "identifier"}"/>`,
                      `<${kind} response-identifier="R"><object data="a.png" type="image/png"/>${spots}</${kind}>`,
                    ),
                  ),
                ),
                "default hotspot last slot",
              );

              assert.strictEqual(breaches.length, broken ? 1 : 0, shown(breaches));
            }),
        ),
      ),
    testTimeoutMs,
  );

  it.effect(
    'reading 85: an xi:include\'s xpointer is refused by the codec, and parse="text" by its value domain',
    () =>
      Effect.gen(function* xpointer() {
        const pointed = yield* judged(includingTest(`xpointer="element(/1)"`));
        const text = breachesOf(yield* judged(includingTest(`parse="text"`)));
        const plain = breachesOf(yield* judged(includingTest(`parse="xml"`)));

        assert.deepInclude(
          pointed._tag === "CodecRefusal"
            ? [pointed.rule]
            : breachesOf(pointed).map(({ law }) => law),
          "attribute-admission",
        );
        assert.isTrue(
          text.some(({ keys, law }) => law === "value domain" && keys["name"] === "parse"),
          shown(text),
        );
        assert.isFalse(
          plain.some(({ keys, law }) => law === "value domain" && keys["name"] === "parse"),
          shown(plain),
        );
      }),
  );
});

/**
 * One case of the package hrefs' box: the item resource's `href`, an extra file the web content
 * resource lists beside `a.png`, and the web content resource's dependency, if any.
 */
interface HrefCase {
  readonly dependency: "R" | "W" | undefined;
  readonly file: string;
  readonly href: string;
}

/**
 * The package hrefs' box: an item href plain, with launch parameters, with a fragment or with a
 * dot segment; an extra file listed twice, absent, percent-encoded, external by a scheme or by a
 * leading `/`, or with a dot segment; and no dependency, one on the item, or one on itself.
 */
const hrefCases: Gen<HrefCase> = (source) => ({
  dependency: source.draw(element(["R", "W", undefined] as const)),
  file: source.draw(
    element([
      "a.png",
      "missing.png",
      "a%20b.png",
      "http://x.org/a.png",
      "/a.png",
      "img/./a.png",
    ] as const),
  ),
  href: source.draw(element(["item.xml", "item.xml?x=1", "item.xml#f", "./item.xml"] as const)),
});

/**
 * Write a package hrefs' case: the item resource `R` at its href, listing `item.xml`, and a web
 * content resource `W` listing `a.png` and the case's file, with its dependency.
 *
 * @param input - The case.
 * @returns The package.
 */
const hrefPackage = (input: HrefCase) => ({
  "a.png": "png",
  "imsmanifest.xml": manifestOf(
    `<resource identifier="R" type="imsqti_item_xmlv3p0" href="${input.href}"><file href="item.xml"/></resource><resource identifier="W" type="webcontent"><file href="a.png"/><file href="${input.file}"/>${input.dependency === undefined ? "" : `<dependency identifierref="${input.dependency}"/>`}</resource>`,
  ),
  "item.xml": item,
});

/**
 * The breaches of each package law a case's reading names, counted by hand from the sources:
 * CP 1.2 §6.6.2 and reading 102 (an href's launch parameters and fragment are not its path; every
 * href resolves before a law reads it, so `./item.xml` names `item.xml`, `a%20b.png` names
 * `a b.png` and `img/./a.png` names `img/a.png`, neither an entry; a scheme or a leading `/` is
 * external), InterchangePackage (b) (a listed in-package file is an entry) and §6.11.5 B ii (a
 * dependency names a sibling, never its own resource). Nothing in the box is a stated limit.
 *
 * @param input - The case.
 * @returns Each law's expected count.
 */
const hrefExpected = (input: HrefCase) => ({
  "File exists": ["missing.png", "a%20b.png", "img/./a.png"].includes(input.file) ? 1 : 0,
  "Href form": 0,
  "Href listed": 0,
  "Self dependency": input.dependency === "W" ? 1 : 0,
});

describe("the package hrefs reading 102 and IMS Content Packaging 1.2 state, over generated packages", () => {
  it.effect(
    "Href form, File exists, Href listed and Self dependency: a package breaks each exactly as its sources count",
    (ctx) =>
      // Oracle: the specification as a checker, each law's count read off the case by hand from
      // CP 1.2 §6.6.2, InterchangePackage (b), §6.11.5 B ii and reading 102 (`hrefExpected`).
      // Bound: every case of 4 item hrefs, 6 extra files and 3 dependencies, 72.
      searched(
        ctx,
        exhaust(
          {
            box: "every case of 4 item hrefs, 6 extra files and 3 dependencies",
            caseHang: lawCaseHang,
            coverage: requiredInSpace<"held" | "params" | "outside" | "missing" | "self">([
              "held",
              "params",
              "outside",
              "missing",
              "self",
            ]),
            generator: hrefCases,
            limit: 100,
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "CP 1.2 §6.6.2, InterchangePackage (b), §6.11.5 B ii and reading 102, by hand",
            },
            suite: "oracle/package-hrefs-reading-102",
          },
          (input, c) =>
            Effect.gen(function* hrefLaws() {
              const expected = hrefExpected(input);
              const breaches = breachesOf(yield* judged(hrefPackage(input)));

              c.note(Object.values(expected).every((count) => count === 0) ? "held" : "outside");
              if (input.href.includes("?") || input.href.includes("#")) {
                c.note("params");
              }

              if (expected["File exists"] === 1) {
                c.note("missing");
              }

              if (expected["Self dependency"] === 1) {
                c.note("self");
              }

              for (const [law, count] of Object.entries(expected)) {
                const found = breaches.filter((breach) => breach.law === law);

                assert.strictEqual(found.length, count, `${law}\n${shown(breaches)}`);
              }
            }),
        ),
      ),
    testTimeoutMs,
  );
});

/**
 * One case of the references' box: the item's path, whether the paragraph that holds its one `img`
 * holds an `xml:base`, and the `img`'s `src`.
 */
interface ReferenceCase {
  readonly base: boolean;
  readonly path: "item.xml" | "items/item.xml";
  readonly src: string;
}

/**
 * The references' box: an item at the root or below it, with or without an `xml:base` on its
 * paragraph, whose `img`
 * names `a.png` plainly, padded or with a media fragment, a file no entry holds, a dot segment, an
 * external URI, or its own document by a fragment.
 */
const referenceCases: Gen<ReferenceCase> = (source) => ({
  base: source.draw(boolean),
  path: source.draw(element(["item.xml", "items/item.xml"] as const)),
  src: source.draw(
    element([
      "a.png",
      " a.png ",
      "a.png#t=1",
      "missing.png",
      "../a.png",
      "http://x.org/a.png",
      "#top",
    ] as const),
  ),
});

/**
 * Write a references' case: the item at its path, listed with `a.png` and `items/a.png`, both
 * entries, so every file the case names that the package holds is listed.
 *
 * @param input - The case.
 * @returns The package.
 */
const referencePackage = (input: ReferenceCase) => ({
  "a.png": "png",
  "imsmanifest.xml": manifestOf(
    `<resource identifier="R" type="imsqti_item_xmlv3p0" href="${input.path}"><file href="${input.path}"/><file href="a.png"/><file href="items/a.png"/></resource>`,
  ),
  "items/a.png": "png",
  [input.path]: `<qti-assessment-item xmlns="${asi}" identifier="item" title="Item" time-dependent="false"><qti-item-body><p${input.base ? ' xml:base="x/"' : ""}><img src="${input.src}" alt="a"/></p></qti-item-body></qti-assessment-item>`,
});

/**
 * Each law's count over a references' case, read off by hand from InterchangePackage (d) and
 * readings 102 and 103: with no `xml:base`, `../a.png` names `a.png` from `items/` (RFC 3986
 * §5.2.4) and climbs above the package root from the root, external; under the paragraph's
 * `xml:base="x/"`, every relative value resolves below `x/`, where no entry is, but `../a.png`,
 * which climbs back to the document's directory and names an entry; `missing.png` resolves to no
 * entry ("File exists"); an external URI and the document's own fragment name nothing to check.
 * Nothing in the box is a stated limit.
 *
 * @param input - The case.
 * @returns Each law's expected count.
 */
const referenceExpected = (input: ReferenceCase) => {
  const resolves = !["http://x.org/a.png", "#top"].includes(input.src);
  const missing = input.base ? input.src !== "../a.png" : input.src === "missing.png";

  return {
    "File exists": resolves && missing ? 1 : 0,
    "Href form": 0,
  };
};

describe("the references reading 103's census names, over generated packages", () => {
  it.effect(
    "File exists and Href form: a document's references break each exactly as InterchangePackage (d) and readings 102 and 103 count",
    (ctx) =>
      // Oracle: the specification as a checker, each law's count read off the case by hand
      // (`referenceExpected`), over `img@src`, a uri attribute of the grammar's census.
      // Bound: every case of 2 item paths, 2 bases and 7 values, 28.
      searched(
        ctx,
        exhaust(
          {
            box: "every case of 2 item paths, 2 bases and 7 values",
            caseHang: lawCaseHang,
            coverage: requiredInSpace<"held" | "missing" | "outside" | "base">([
              "held",
              "missing",
              "outside",
              "base",
            ]),
            generator: referenceCases,
            limit: 40,
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "InterchangePackage (d) and readings 102 and 103, by hand",
            },
            suite: "oracle/references-reading-103",
          },
          (input, c) =>
            Effect.gen(function* referenceLaws() {
              const expected = referenceExpected(input);
              const breaches = breachesOf(yield* judged(referencePackage(input)));

              c.note(expected["File exists"] + expected["Href form"] === 0 ? "held" : "outside");
              if (expected["File exists"] === 1) {
                c.note("missing");
              }

              if (input.base && expected["File exists"] > 0) {
                c.note("base");
              }

              for (const [law, count] of Object.entries(expected)) {
                const found = breaches.filter((breach) => breach.law === law);

                assert.strictEqual(found.length, count, `${law}\n${shown(breaches)}`);
              }
            }),
        ),
      ),
    testTimeoutMs,
  );
});

/**
 * The hrefs the stimulus ref box writes: the stimulus document, a listed file that is no document,
 * a file no entry holds, and an external URI.
 */
const stimulusHrefs = ["s.xml", "a.png", "missing.xml", "http://x.org/s.xml"] as const;

/**
 * Write a stimulus ref case: an item that refers to a stimulus by the case's href, beside the
 * stimulus `s.xml` and the file `a.png`, both listed.
 *
 * @param href - The stimulus ref's href.
 * @returns The package.
 */
const stimulusPackage = (href: string) => ({
  "a.png": "png",
  "imsmanifest.xml": manifestOf(
    `<resource identifier="R" type="imsqti_item_xmlv3p0" href="item.xml"><file href="item.xml"/><file href="a.png"/></resource><resource identifier="S" type="imsqti_stimulus_xmlv3p0" href="s.xml"><file href="s.xml"/></resource>`,
  ),
  "item.xml": `<qti-assessment-item xmlns="${asi}" identifier="item" title="Item" time-dependent="false"><qti-assessment-stimulus-ref identifier="st" href="${href}"/><qti-item-body><p>Read it.</p></qti-item-body></qti-assessment-item>`,
  "s.xml": `<qti-assessment-stimulus xmlns="${asi}" identifier="s" title="Stimulus"><qti-stimulus-body><p>A stimulus.</p></qti-stimulus-body></qti-assessment-stimulus>`,
});

describe("the stimulus refs the UP audit's B5 resolves, over generated packages", () => {
  it.effect(
    "Stimulus ref target: a stimulus ref breaks it exactly when its href resolves in the package to no stimulus document",
    (ctx) =>
      // Oracle: the specification as a checker, the information model §7.6 (info.txt:67012,
      // :67066) read by hand: `s.xml` is the stimulus; `a.png` is a listed file of no stimulus;
      // `missing.xml` names no entry, so File exists breaks too; an external href is not resolved.
      // Bound: every one of the 4 hrefs.
      searched(
        ctx,
        exhaust(
          {
            box: "every one of s.xml, a.png, missing.xml and an http: URI",
            caseHang: lawCaseHang,
            coverage: requiredInSpace<"held" | "broken">(["held", "broken"]),
            generator: (source) => source.draw(element(stimulusHrefs)),
            limit: 10,
            literal: Formatter.format,
            oracle: { kind: "specification", name: "the information model §7.6, by hand" },
            suite: "oracle/stimulus-ref-target",
          },
          (href, c) =>
            Effect.gen(function* stimulusTarget() {
              const breaches = breachesOf(yield* judged(stimulusPackage(href)));
              const expected = {
                "File exists": href === "missing.xml" ? 1 : 0,
                "Stimulus ref target": href === "a.png" || href === "missing.xml" ? 1 : 0,
              };

              c.note(expected["Stimulus ref target"] === 0 ? "held" : "broken");
              for (const [law, count] of Object.entries(expected)) {
                const found = breaches.filter((breach) => breach.law === law);

                assert.strictEqual(found.length, count, `${law}\n${shown(breaches)}`);
              }
            }),
        ),
      ),
    testTimeoutMs,
  );
});

/**
 * The fragments the in-place differential includes, each its own document's text: a division
 * holding a hottext interaction (the corpus's `rtest01-fragment.xml`, cut down), a text entry
 * interaction alone, a paragraph holding a gap, a plain paragraph and a response rule.
 */
const inPlaceFragments = {
  gap: `<p xmlns="${asi}">a <qti-gap identifier="G1"/> b</p>`,
  hottext: `<div xmlns="${asi}"><qti-hottext-interaction response-identifier="RESPONSE" max-choices="1"><p><qti-hottext identifier="H1">a</qti-hottext></p></qti-hottext-interaction></div>`,
  rule: `<qti-response-condition xmlns="${asi}"><qti-response-if><qti-is-null><qti-variable identifier="RESPONSE"/></qti-is-null><qti-set-outcome-value identifier="SCORE"><qti-base-value base-type="float">0</qti-base-value></qti-set-outcome-value></qti-response-if></qti-response-condition>`,
  text: `<p xmlns="${asi}">plain text</p>`,
  textEntry: `<qti-text-entry-interaction xmlns="${asi}" response-identifier="TEXT"/>`,
} as const;

/**
 * The places the differential includes each fragment at, each an item body with `{}` where the
 * include stands: the body itself, a simple choice's flow, a gap match's text and a paragraph.
 */
const inPlacePositions = {
  body: "{}",
  choice: `<qti-choice-interaction response-identifier="CHOICE" max-choices="1"><qti-simple-choice identifier="A">a {}</qti-simple-choice><qti-simple-choice identifier="B">b</qti-simple-choice></qti-choice-interaction>`,
  gapMatch: `<qti-gap-match-interaction response-identifier="RESPONSE" max-associations="1"><qti-gap-text identifier="W" match-max="1">w</qti-gap-text><p>x</p>{}</qti-gap-match-interaction>`,
  paragraph: "<p>see {}</p>",
} as const;

/**
 * Write an item whose body is a position with `{}` replaced, declaring the responses every
 * fragment and position binds.
 *
 * @param body - The body's content.
 * @param responseBase - The base type of `RESPONSE`.
 * @returns The item's text.
 */
const inPlaceItem = (body: string, responseBase: string): string =>
  `<qti-assessment-item xmlns="${asi}" xmlns:xi="http://www.w3.org/2001/XInclude" identifier="I" title="Item" time-dependent="false"><qti-response-declaration identifier="RESPONSE" cardinality="${responseBase === "directedPair" ? "multiple" : "single"}" base-type="${responseBase}"/><qti-response-declaration identifier="TEXT" cardinality="single" base-type="string"/><qti-response-declaration identifier="CHOICE" cardinality="single" base-type="identifier"/><qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/><qti-item-body>${body}</qti-item-body></qti-assessment-item>`;

/**
 * Every fragment at every position, the differential's cases.
 */
const inPlaceCases = (() => {
  const fragments = [
    "gap",
    "hottext",
    "rule",
    "text",
    "textEntry",
  ] as const satisfies readonly (keyof typeof inPlaceFragments)[];
  const positions = [
    "body",
    "choice",
    "gapMatch",
    "paragraph",
  ] as const satisfies readonly (keyof typeof inPlacePositions)[];
  const [first, ...rest] = fragments.flatMap((fragment) =>
    positions.map((position) => ({ fragment, position })),
  );
  if (first === undefined) {
    throw new Error("The in-place tables are empty; they name five fragments and four positions.");
  }

  return [first, ...rest] as const;
})();

/**
 * Read the laws a judgment names, or its codec refusal's rule.
 *
 * @param judgment - The judgment.
 * @returns The laws.
 */
const lawsOfJudgment = (judgment: Judgment): ReadonlySet<string> =>
  judgment._tag === "Judged"
    ? new Set(judgment.breaches.map(({ law }) => law))
    : new Set([`codec ${judgment.rule}`]);

/**
 * Write a hottext interaction bound to `RESPONSE` holding an include.
 *
 * @param include - The include, as written.
 * @returns The interaction.
 */
const interaction = (include: string): string =>
  `<qti-hottext-interaction response-identifier="RESPONSE" max-choices="1">${include}</qti-hottext-interaction>`;

/**
 * The resource of an included fragment, `f.xml`.
 */
const fragmentResource = resourceOf("F", "imsqti_fragment_xmlv3p0", "f.xml");

describe("reading 117: an included fragment judged in place", () => {
  it.effect(
    "the item that includes a fragment breaks exactly the laws its merged document breaks, and Include root exactly where the merged document's root is out of place",
    (ctx) =>
      searched(
        ctx,
        exhaust(
          {
            box: "every fragment of 5 at every position of 4",
            caseHang: lawCaseHang,
            coverage: requiredInSpace<"accepted" | "broken in place" | "out of place">([
              "accepted",
              "broken in place",
              "out of place",
            ]),
            generator: (source) => source.draw(element(inPlaceCases)),
            limit: 20,
            literal: Formatter.format,
            oracle: {
              kind: "second-implementation",
              name: "the merged document, spliced as text (XInclude's result infoset), judged alone",
            },
            suite: "oracle/in-place",
          },
          ({ fragment, position }, c) =>
            Effect.gen(function* inPlaceCase() {
              const text = inPlaceFragments[fragment];
              const body = inPlacePositions[position];
              const responseBase = position === "gapMatch" ? "directedPair" : "identifier";
              const included = yield* judged({
                "f.xml": text,
                "imsmanifest.xml": manifestOf(`${itemResource}${fragmentResource}`),
                "item.xml": inPlaceItem(
                  body.replace("{}", '<xi:include href="f.xml"/>'),
                  responseBase,
                ),
              });
              const merged = yield* judged({
                "imsmanifest.xml": manifestOf(itemResource),
                "item.xml": inPlaceItem(body.replace("{}", text), responseBase),
              });
              const placed = lawsOfJudgment(included);
              const whole = lawsOfJudgment(merged);

              if (placed.has("Include root")) {
                c.note("out of place");
                // The merged document's root stands where its parent admits it nowhere: the codec
                // or N5 refuses it there.
                assert.isTrue(
                  [...whole].some(
                    (law) =>
                      law.startsWith("codec") || law === "N5 admitted" || law === "N5 Follow",
                  ),
                  `${fragment} at ${position}: ${[...whole].join(", ")}`,
                );
              } else {
                c.note(placed.size === 0 ? "accepted" : "broken in place");
                assert.deepStrictEqual(placed, whole, `${fragment} at ${position}`);
              }
            }),
        ),
      ),
    testTimeoutMs,
  );

  it.effect(
    "names each include law by its own variant: no listed target, an absent file under File exists alone, a fragment identifier, two interactions, a chain back to itself, a fragment's hottext that repeats its item's or names its item's variable, and a fragment's template and feedback references its item does not declare, a fragment's language its item's record does not list, and a rule fragment's variable its item does not declare",
    (ctx) =>
      searched(
        ctx,
        exhaust(
          {
            box: "the eleven named variants and the valid package beside them",
            caseHang: lawCaseHang,
            coverage: requiredInSpace<"held" | "broken">(["held", "broken"]),
            generator: (source) =>
              source.draw(
                element([
                  "valid",
                  "missing",
                  "external",
                  "fragment identifier",
                  "two interactions",
                  "cycle",
                  "hottext key",
                  "choice variable",
                  "template reference",
                  "feedback reference",
                  "fragment language",
                  "rule variable",
                ] as const),
              ),
            limit: 12,
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "readings 85, 104, 115 and 117 (XInclude 1.0 §3.1, information model §2.12 and §5.132.1, the metadata binding §2.7.1.3), by hand",
            },
            suite: "oracle/include-laws",
          },
          (variant, c) =>
            Effect.gen(function* includeLaws() {
              const hottexts = `<p xmlns="${asi}"><qti-hottext identifier="H1">a</qti-hottext></p>`;
              const packages = {
                "choice variable": {
                  "f.xml": hottexts.replace('identifier="H1"', 'identifier="SCORE"'),
                  "imsmanifest.xml": manifestOf(`${itemResource}${fragmentResource}`),
                  "item.xml": inPlaceItem(interaction('<xi:include href="f.xml"/>'), "identifier"),
                },
                cycle: {
                  "f.xml": `<div xmlns="${asi}" xmlns:xi="http://www.w3.org/2001/XInclude"><xi:include href="f.xml"/></div>`,
                  "imsmanifest.xml": manifestOf(`${itemResource}${fragmentResource}`),
                  "item.xml": inPlaceItem('<xi:include href="f.xml"/>', "identifier"),
                },
                external: {
                  "imsmanifest.xml": manifestOf(itemResource),
                  "item.xml": inPlaceItem(
                    '<xi:include href="https://example.org/f.xml"/>',
                    "identifier",
                  ),
                },
                "feedback reference": {
                  "f.xml": `<p xmlns="${asi}"><qti-feedback-inline outcome-identifier="NONE" identifier="x" show-hide="show">f</qti-feedback-inline></p>`,
                  "imsmanifest.xml": manifestOf(`${itemResource}${fragmentResource}`),
                  "item.xml": inPlaceItem('<xi:include href="f.xml"/>', "identifier"),
                },
                "fragment identifier": {
                  "f.xml": hottexts,
                  "imsmanifest.xml": manifestOf(`${itemResource}${fragmentResource}`),
                  "item.xml": inPlaceItem(
                    interaction('<xi:include href="f.xml?a=1#x"/>'),
                    "identifier",
                  ),
                },
                "fragment language": {
                  "f.xml": `<p xmlns="${asi}" xml:lang="fr">texte</p>`,
                  "imsmanifest.xml": manifestOf(
                    `${itemResource.replace(
                      "<file",
                      '<metadata><lom xmlns="http://ltsc.ieee.org/xsd/LOM"><general><language>en</language></general></lom></metadata><file',
                    )}${fragmentResource}`,
                  ),
                  "item.xml": inPlaceItem('<xi:include href="f.xml"/>', "identifier"),
                },
                "hottext key": {
                  "f.xml": hottexts,
                  "imsmanifest.xml": manifestOf(`${itemResource}${fragmentResource}`),
                  "item.xml": inPlaceItem(
                    interaction(
                      '<p><qti-hottext identifier="H1">b</qti-hottext></p><xi:include href="f.xml"/>',
                    ),
                    "identifier",
                  ),
                },
                missing: {
                  "imsmanifest.xml": manifestOf(itemResource),
                  "item.xml": inPlaceItem('<xi:include href="f.xml"/>', "identifier"),
                },
                "rule variable": {
                  "f.xml": `<qti-response-condition xmlns="${asi}"><qti-response-if><qti-is-null><qti-variable identifier="RESPONSE"/></qti-is-null><qti-set-outcome-value identifier="NOPE"><qti-base-value base-type="float">0</qti-base-value></qti-set-outcome-value></qti-response-if></qti-response-condition>`,
                  "imsmanifest.xml": manifestOf(`${itemResource}${fragmentResource}`),
                  "item.xml": inPlaceItem("<p>x</p>", "identifier").replace(
                    "</qti-item-body>",
                    '</qti-item-body><qti-response-processing><xi:include href="f.xml"/></qti-response-processing>',
                  ),
                },
                "template reference": {
                  "f.xml": `<p xmlns="${asi}"><qti-template-inline template-identifier="NONE" identifier="x" show-hide="show">t</qti-template-inline></p>`,
                  "imsmanifest.xml": manifestOf(`${itemResource}${fragmentResource}`),
                  "item.xml": inPlaceItem('<xi:include href="f.xml"/>', "identifier"),
                },
                "two interactions": {
                  "f.xml": hottexts,
                  "imsmanifest.xml": manifestOf(`${itemResource}${fragmentResource}`),
                  "item.xml": inPlaceItem(
                    `${interaction('<xi:include href="f.xml"/>')}${interaction('<xi:include href="f.xml"/>').replace("RESPONSE", "TEXT")}`,
                    "identifier",
                  ),
                },
                valid: {
                  "f.xml": hottexts,
                  "imsmanifest.xml": manifestOf(`${itemResource}${fragmentResource}`),
                  "item.xml": inPlaceItem(interaction('<xi:include href="f.xml"/>'), "identifier"),
                },
              };
              const expected: Readonly<Record<typeof variant, LawName | undefined>> = {
                "choice variable": "Choice not variable",
                cycle: "Inclusion cycle",
                external: undefined,
                "feedback reference": "Feedback reference",
                "fragment identifier": "Include fragment identifier",
                "fragment language": "Document lang",
                "hottext key": "Choice identifier key",
                // An href naming a file the package does not hold is "File exists"'s alone, which
                // the import's SitePath refuses as its row is inserted (reading 115).
                missing: "File exists",
                "rule variable": "Variable declared",
                "template reference": "Template reference",
                "two interactions": "Fragment context",
                valid: undefined,
              };
              const breaches = breachesOf(yield* judged(packages[variant]));
              const law = expected[variant];
              c.note(law === undefined ? "held" : "broken");

              if (law === undefined) {
                assert.lengthOf(breaches, 0, shown(breaches));
              } else {
                assert.isAbove(ofLaw(breaches, law).length, 0, `${variant}\n${shown(breaches)}`);
              }
            }),
        ),
      ),
    testTimeoutMs,
  );
});

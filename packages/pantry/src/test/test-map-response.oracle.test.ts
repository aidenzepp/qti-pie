/**
 * A test's dotted map response and dotted correct (decisions 429 and 430; spec reading 164): a
 * test's outcome processing that names an item's variable through its item ref, `I.RESPONSE`,
 * reads the item's declaration. A `qti-map-response` there must name a response variable whose
 * declaration holds a `qti-mapping` (information model §7.22: "This expression looks up the value
 * of a response variable and then transforms it using the associated mapping, which must have been
 * declared"), and a `qti-correct` must name a response variable (§7.10: "This expression looks up
 * the declaration of a response variable"). So a dotted map response whose response declares no
 * mapping, or that reads a built-in response, is refused under "Mapped response" (P27), and either
 * expression naming the item's outcome `I.SCORE` under "Variable kind" alone; a dotted map response
 * of a mapped response, a dotted correct of a response, and an item's own unprefixed map response
 * of its mapped response are accepted.
 *
 * A dotted map response point reads its point response's area mapping the same way (decision 431;
 * information model §6.9.46: "transforms it using the associated areaMapping"), and a map response
 * of a built-in response variable, an item's `numAttempts` or a test's `duration`, reads a mapping
 * no declaration holds: each is refused under "Mapped response", and a dotted map response point of
 * an area-mapped point response is accepted.
 *
 * Each case is judged twice: by the law oracle over the package as written, and by the schema's own
 * laws over the import's rows on the host (`#pantry/test/host-judge.ts`), the first broken law's
 * rule by precedence. The two verdicts must be one, and both the case's.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Option } from "effect";
import { ruleOfLaws } from "#pantry/import/refusal.ts";
import { readProgram } from "#pantry/import/program.ts";
import { readPackage } from "#pantry/package/read.ts";
import { Qti } from "#pantry/qti/schema.ts";
import { scopedPackage } from "#pantry/test/gen/every-relation.ts";
import { hostRowsOf, judge } from "#pantry/test/host-judge.ts";
import { judgedLaws } from "#pantry/test/judged-laws.ts";
import { oracleVerdict } from "#pantry/test/oracle-verdict.ts";
import { edit, item, itemResource, manifestOf, test } from "#pantry/test/probe.ts";

/**
 * Every law the host judges, read once.
 */
const laws = judgedLaws(Qti);

/**
 * The test's resource beside the item's.
 */
const testResource = `<resource identifier="T" type="imsqti_test_xmlv3p0" href="test.xml"><file href="test.xml"/><dependency identifierref="R"/></resource>`;

/**
 * The base item's response with a mapping of its one correct choice.
 */
const mapped = edit(
  item,
  "</qti-correct-response>",
  `</qti-correct-response>
    <qti-mapping default-value="0"><qti-map-entry map-key="A" mapped-value="1"/></qti-mapping>`,
);

/**
 * The base item with a second response, `POINT`, of base type point, bound to no interaction.
 */
const pointed = edit(
  item,
  `<qti-outcome-declaration identifier="SCORE"`,
  `<qti-response-declaration identifier="POINT" cardinality="single" base-type="point"/>
  <qti-outcome-declaration identifier="SCORE"`,
);

/**
 * {@link pointed} with an area mapping of its point response.
 */
const areaMapped = edit(
  pointed,
  `base-type="point"/>`,
  `base-type="point">
    <qti-area-mapping default-value="0"><qti-area-map-entry shape="circle" coords="10,10,5" mapped-value="1"/></qti-area-mapping>
  </qti-response-declaration>`,
);

/**
 * Write the base test with an outcome `TOTAL` its outcome processing sets from an expression.
 *
 * @param processing - The outcome processing's rules, as written.
 * @returns The test's text.
 */
const testWith = (processing: string): string =>
  edit(
    edit(
      test,
      `title="Test">`,
      `title="Test">
  <qti-outcome-declaration identifier="TOTAL" cardinality="single" base-type="float"/>`,
    ),
    "</qti-test-part>",
    `</qti-test-part>
  <qti-outcome-processing>${processing}</qti-outcome-processing>`,
  );

/**
 * Set `TOTAL` from a map response of a name.
 *
 * @param identifier - The name the map response writes.
 * @returns The outcome processing's rule.
 */
const mapResponseOf = (identifier: string): string =>
  `<qti-set-outcome-value identifier="TOTAL"><qti-map-response identifier="${identifier}"/></qti-set-outcome-value>`;

/**
 * Set `TOTAL` from a map response point of a name.
 *
 * @param identifier - The name the map response point writes.
 * @returns The outcome processing's rule.
 */
const mapResponsePointOf = (identifier: string): string =>
  `<qti-set-outcome-value identifier="TOTAL"><qti-map-response-point identifier="${identifier}"/></qti-set-outcome-value>`;

/**
 * Set `TOTAL` where the correct value of a name is null.
 *
 * @param identifier - The name the correct writes.
 * @returns The outcome processing's rule.
 */
const correctOf = (identifier: string): string =>
  `<qti-outcome-condition><qti-outcome-if><qti-is-null><qti-correct identifier="${identifier}"/></qti-is-null><qti-set-outcome-value identifier="TOTAL"><qti-base-value base-type="float">1</qti-base-value></qti-set-outcome-value></qti-outcome-if></qti-outcome-condition>`;

/**
 * One case: what it is, its item and test, and the rule both judges must give, `accepted` where
 * they accept it.
 */
interface MapResponseCase {
  readonly item: string;
  readonly name: string;
  readonly rule: string;
  readonly test: Option.Option<string>;
}

/**
 * The cases: the refusals of decisions 429, 430 and 431, and their controls.
 */
const cases: readonly MapResponseCase[] = [
  {
    item: mapped,
    name: "a dotted map response of a mapped response",
    rule: "accepted",
    test: Option.some(testWith(mapResponseOf("I.RESPONSE"))),
  },
  {
    item,
    name: "a dotted map response of a response with no mapping",
    rule: "P27",
    test: Option.some(testWith(mapResponseOf("I.RESPONSE"))),
  },
  {
    item: mapped,
    name: "a dotted map response of an outcome",
    rule: "variable-kind",
    test: Option.some(testWith(mapResponseOf("I.SCORE"))),
  },
  {
    item: mapped,
    name: "a dotted map response of a built-in response, which has no mapping",
    rule: "P27",
    test: Option.some(testWith(mapResponseOf("I.numAttempts"))),
  },
  {
    item,
    name: "a dotted correct of a response",
    rule: "accepted",
    test: Option.some(testWith(correctOf("I.RESPONSE"))),
  },
  {
    item,
    name: "a dotted correct of an outcome",
    rule: "variable-kind",
    test: Option.some(testWith(correctOf("I.SCORE"))),
  },
  {
    item: edit(
      mapped,
      `<qti-base-value base-type="float">1</qti-base-value></qti-set-outcome-value>`,
      `<qti-map-response identifier="RESPONSE"/></qti-set-outcome-value>`,
    ),
    name: "an item's unprefixed map response of its mapped response",
    rule: "accepted",
    test: Option.none(),
  },
  {
    item: areaMapped,
    name: "a dotted map response point of an area-mapped point response",
    rule: "accepted",
    test: Option.some(testWith(mapResponsePointOf("I.POINT"))),
  },
  {
    item: pointed,
    name: "a dotted map response point of a point response with no area mapping",
    rule: "P27",
    test: Option.some(testWith(mapResponsePointOf("I.POINT"))),
  },
  {
    item: edit(
      item,
      `<qti-base-value base-type="float">1</qti-base-value></qti-set-outcome-value>`,
      `<qti-map-response identifier="numAttempts"/></qti-set-outcome-value>`,
    ),
    name: "an item's unprefixed map response of its built-in numAttempts, which has no mapping",
    rule: "P27",
    test: Option.none(),
  },
  {
    item,
    name: "a test's unprefixed map response of its built-in duration, which has no mapping",
    rule: "P27",
    test: Option.some(testWith(mapResponseOf("duration"))),
  },
];

/**
 * A case's package: the manifest, the item, and the test where the case has one.
 *
 * @param drawn - The case.
 * @returns The package's entries.
 */
const entriesOf = (drawn: MapResponseCase): ReadonlyMap<string, Uint8Array> =>
  new Map(
    Object.entries({
      "imsmanifest.xml": manifestOf(
        Option.match(drawn.test, {
          onNone: () => itemResource,
          onSome: () => `${itemResource}${testResource}`,
        }),
      ),
      "item.xml": drawn.item,
      ...Option.match(drawn.test, { onNone: () => ({}), onSome: (text) => ({ "test.xml": text }) }),
    }).map(([path, text]) => [path, new TextEncoder().encode(text)] as const),
  );

layer(NodeServices.layer, { excludeTestServices: true })("a test's dotted map response", (it) => {
  it.effect(
    "refuses a dotted map response of no mapped response and a dotted correct of no response, the law oracle and the import's rows alike",
    () =>
      Effect.gen(function* allCases() {
        const verdicts = yield* Effect.all(
          cases.map((drawn) =>
            Effect.scoped(
              Effect.gen(function* oneCase() {
                const dir = yield* scopedPackage(entriesOf(drawn));
                const verdict = yield* oracleVerdict(yield* readPackage(dir));
                const program = yield* readProgram(dir);
                const { broken } = judge(hostRowsOf(program.inputs), laws);
                const [first, ...rest] = broken.map(({ law }) => law);
                const host =
                  first === undefined
                    ? "accepted"
                    : Option.getOrElse(ruleOfLaws([first, ...rest]), () => "unnamed");
                const oracle = verdict.kind === "accepted" ? ["accepted"] : [...verdict.rules];

                return { host, name: drawn.name, oracle };
              }),
            ),
          ),
        );

        assert.deepStrictEqual(
          verdicts,
          cases.map(({ name, rule }) => ({ host: rule, name, oracle: [rule] })),
        );
      }),
  );
});

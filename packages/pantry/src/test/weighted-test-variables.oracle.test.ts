/**
 * A weighted `qti-test-variables` that writes no `base-type` is float (decision 434; spec reading
 * 167): information model §7.39.5, "When a weighting is specified the result of the expression
 * always has base-type float". So setting an integer multiple outcome from one is refused under
 * "Set type" (P20), and a `qti-gcd` of one under "Operand fit" (P23), while `rtest04.xml`'s
 * weighted sum into a float outcome, `test-mapping`'s weighted section sum and an unweighted test
 * variables with no `base-type`, still `unknown` (decision 435 (b5)), are accepted.
 *
 * Each case is judged twice: by the law oracle over the package as written, and by the schema's own
 * laws over the import's rows on the host (`#pantry/test/host-judge.ts`), the first broken law's
 * rule by precedence. The two verdicts must be one, and both the case's. The fixtures of
 * {@link weightedNames} and `test-mapping` are materialized; the rest are written here.
 */
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { ConfigProvider, Effect, FileSystem, Option } from "effect";
import { ruleOfLaws } from "#pantry/import/refusal.ts";
import { readProgram } from "#pantry/import/program.ts";
import { readPackage } from "#pantry/package/read.ts";
import { Qti } from "#pantry/qti/schema.ts";
import { materialize, weightedNames } from "#pantry/test/fixtures.ts";
import type { FixtureName } from "#pantry/test/fixtures.ts";
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
 * The directory every fixture root is made under: the package's gitignored `work/`.
 */
const workDirectory = path.resolve(import.meta.dirname, "../../work");

/**
 * The test's resource beside the item's.
 */
const testResource = `<resource identifier="T" type="imsqti_test_xmlv3p0" href="test.xml"><file href="test.xml"/><dependency identifierref="R"/></resource>`;

/**
 * Write the base test with an outcome it declares and its outcome processing sets from an
 * expression.
 *
 * @param declaration - The outcome's declaration attributes, its identifier `OUT`'s beside.
 * @param expression - The expression `OUT` is set to.
 * @returns The test's text.
 */
const testSetting = (declaration: string, expression: string): string =>
  edit(
    edit(
      test,
      `title="Test">`,
      `title="Test">
  <qti-outcome-declaration identifier="OUT" ${declaration}/>`,
    ),
    "</qti-test-part>",
    `</qti-test-part>
  <qti-outcome-processing><qti-set-outcome-value identifier="OUT">${expression}</qti-set-outcome-value></qti-outcome-processing>`,
  );

/**
 * One case: what it is, its package (a fixture's name or a test written beside the base item), and
 * the rule both judges must give, `accepted` where they accept it.
 */
interface WeightedCase {
  readonly name: string;
  readonly rule: string;
  readonly source: { readonly fixture: FixtureName } | { readonly test: string };
}

/**
 * The cases: decision 434's two refusals and their controls.
 */
const cases: readonly WeightedCase[] = [
  {
    name: "rtest04's weighted sum into a float single outcome",
    rule: "accepted",
    source: { fixture: "weighted-sum-float" },
  },
  {
    name: "a weighted test variables into an integer multiple outcome",
    rule: "P20",
    source: { fixture: "weighted-variables-integer" },
  },
  {
    name: "test-mapping's weighted section sum into a float single outcome",
    rule: "accepted",
    source: { fixture: "test-mapping" },
  },
  {
    name: "a gcd of a weighted test variables",
    rule: "P23",
    source: {
      test: testSetting(
        `cardinality="single" base-type="integer"`,
        `<qti-gcd><qti-test-variables variable-identifier="RAW" weight-identifier="W"/></qti-gcd>`,
      ),
    },
  },
  {
    name: "a gcd of an unweighted test variables, unknown",
    rule: "accepted",
    source: {
      test: testSetting(
        `cardinality="single" base-type="integer"`,
        `<qti-gcd><qti-test-variables variable-identifier="RAW"/></qti-gcd>`,
      ),
    },
  },
  {
    name: "an unweighted test variables into an integer multiple outcome, unknown",
    rule: "accepted",
    source: {
      test: testSetting(
        `cardinality="multiple" base-type="integer"`,
        `<qti-test-variables variable-identifier="RAW"/>`,
      ),
    },
  },
];

/**
 * A written case's package: the manifest, the base item and the test.
 *
 * @param text - The test's text.
 * @returns The package's entries.
 */
const entriesOf = (text: string): ReadonlyMap<string, Uint8Array> =>
  new Map(
    Object.entries({
      "imsmanifest.xml": manifestOf(`${itemResource}${testResource}`),
      "item.xml": item,
      "test.xml": text,
    }).map(([file, content]) => [file, new TextEncoder().encode(content)] as const),
  );

/**
 * Materialize a fixture in a root of its own.
 *
 * @param name - The fixture's name.
 * @returns Its directory.
 */
const fixtureDirectory = Effect.fn("weighted.fixtureDirectory")(function* fixtureDirectory(
  name: FixtureName,
) {
  const fs = yield* FileSystem.FileSystem;

  yield* fs.makeDirectory(workDirectory, { recursive: true });

  const root = yield* fs.makeTempDirectoryScoped({
    directory: workDirectory,
    prefix: "weighted-oracle-",
  });

  return yield* materialize(name).pipe(
    Effect.provide(
      ConfigProvider.layerAdd(ConfigProvider.fromUnknown({ GR8DES_QTI_FIXTURES: root }), {
        asPrimary: true,
      }),
    ),
  );
});

layer(NodeServices.layer, { excludeTestServices: true })(
  "a weighted qti-test-variables with no base-type",
  (it) => {
    it.effect("names both weighted fixtures among the cases", () =>
      Effect.sync(() => {
        assert.includeMembers(
          cases.flatMap(({ source }) => ("fixture" in source ? [source.fixture] : [])),
          [...weightedNames],
        );
      }),
    );

    it.effect(
      "types a weighted test variables with no base-type float, the law oracle and the import's rows alike",
      () =>
        Effect.gen(function* allCases() {
          const verdicts = yield* Effect.all(
            cases.map((drawn) =>
              Effect.scoped(
                Effect.gen(function* oneCase() {
                  const dir =
                    "fixture" in drawn.source
                      ? yield* fixtureDirectory(drawn.source.fixture)
                      : yield* scopedPackage(entriesOf(drawn.source.test));
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
  },
);

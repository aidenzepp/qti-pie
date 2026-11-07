/**
 * The cells an alignment group is first in (MathML 3 §3.5.5.2), judged twice: the law oracle's
 * `contentOfCell` reads a nested `m:mtd`, empty or not, as another cell's, and the schema's own
 * laws over the import's rows (`#pantry/test/host-judge.ts`) read it the same way, so a group after
 * an empty nested cell is no later than first in its own. The two verdicts must be one.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Formatter, Option } from "effect";
import { ruleOfLaws } from "#pantry/import/refusal.ts";
import { readProgram } from "#pantry/import/program.ts";
import { readPackage } from "#pantry/package/read.ts";
import { Qti } from "#pantry/qti/schema.ts";
import { scopedPackage } from "#pantry/test/gen/every-relation.ts";
import { hostRowsOf, judge } from "#pantry/test/host-judge.ts";
import { judgedLaws } from "#pantry/test/key-copies.ts";
import { oracleVerdict } from "#pantry/test/oracle-verdict.ts";
import { base, edit, item, packageOf } from "#pantry/test/probe.ts";

const laws = judgedLaws(Qti.statements);

/**
 * The base package with a formula in its item body.
 *
 * @param formula - The `m:math` element's markup.
 * @returns The package's files by path.
 */
const withFormula = (formula: string) => ({
  ...base,
  "item.xml": edit(
    edit(
      item,
      `<qti-assessment-item xmlns=`,
      `<qti-assessment-item xmlns:m="http://www.w3.org/1998/Math/MathML" xmlns=`,
    ),
    `<p id="intro">Pick one.</p>`,
    `<p id="intro">Pick one.</p>${formula}`,
  ),
});

/**
 * Wrap a cell's content in a one-cell table in a formula.
 *
 * @param content - What the `m:mtd` holds.
 * @returns The `m:math` element.
 */
const inCell = (content: string): string =>
  `<m:math><m:mtable><m:mtr><m:mtd>${content}</m:mtd></m:mtr></m:mtable></m:math>`;

/**
 * One case: a cell's content and the rule both judges refuse it under, or none when both accept.
 */
const cases: readonly (readonly [name: string, content: string, rule: string])[] = [
  [
    "an empty cell nested before a group",
    `<m:mtable><m:mtr><m:mtd/></m:mtr></m:mtable><m:maligngroup/><m:mi>b</m:mi>`,
    "accepted",
  ],
  [
    "a full cell nested before a group",
    `<m:mtable><m:mtr><m:mtd><m:mi>a</m:mi></m:mtd></m:mtr></m:mtable><m:maligngroup/><m:mi>b</m:mi>`,
    "accepted",
  ],
  [
    "a group in a nested cell",
    `<m:mtable><m:mtr><m:mtd><m:maligngroup/><m:mi>a</m:mi></m:mtd></m:mtr></m:mtable><m:mi>b</m:mi>`,
    "accepted",
  ],
  ["a leaf before a group", `<m:mi>a</m:mi><m:maligngroup/><m:mi>b</m:mi>`, "ordering"],
  [
    "an empty row nested before a group",
    `<m:mtable><m:mtr/></m:mtable><m:maligngroup/><m:mi>b</m:mi>`,
    "ordering",
  ],
];

layer(NodeServices.layer, { excludeTestServices: true })(
  "a nested m:mtd is another cell's",
  (it) => {
    it.effect(
      "reads the cells a group is first in alike, the law oracle and the import's rows",
      () =>
        Effect.gen(function* everyCase() {
          for (const [name, content, expected] of cases) {
            const files = withFormula(inCell(content));
            const verdict = yield* oracleVerdict(packageOf(files));
            const hostRule = yield* Effect.scoped(
              Effect.gen(function* oneCase() {
                const entries = new Map(
                  Object.entries(files).map(
                    ([path, text]) => [path, new TextEncoder().encode(text)] as const,
                  ),
                );
                const dir = yield* scopedPackage(entries);
                yield* readPackage(dir);

                const program = yield* readProgram(dir);
                const { broken } = judge(hostRowsOf(program.inputs), laws);
                const [first, ...rest] = broken.map(({ law }) => law);

                return {
                  names: broken.map(({ law }) => Formatter.format(law)).join("; ") || "no law",
                  rule:
                    first === undefined
                      ? "accepted"
                      : Option.getOrElse(ruleOfLaws([first, ...rest]), () => "unnamed"),
                };
              }),
            );
            const rules = verdict.kind === "accepted" ? new Set(["accepted"]) : verdict.rules;
            assert.deepStrictEqual(
              [...rules],
              [expected],
              `${name}: the oracle gives ${Formatter.format([...rules])}`,
            );
            assert.strictEqual(
              hostRule.rule,
              expected,
              `${name}: the import's rows give ${hostRule.rule} (${hostRule.names})`,
            );
          }
        }),
    );
  },
);

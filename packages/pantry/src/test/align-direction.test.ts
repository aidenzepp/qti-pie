/**
 * A MathML formula's direction starts at its `m:math` (spec reading 148): `ltr` unless the `math`
 * element writes `rtl`, whatever an HTML ancestor's `dir` says. The law oracle
 * (`#pantry/test/oracle.ts` `inheritedDirectionOf`) and the schema's own laws over the import's
 * rows (the builder's `reading.owns`, `#pantry/import/overlays/mathml-align.ts`) must give the
 * alignment cases below one verdict each.
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
import { judgedLaws } from "#pantry/test/key-copies.ts";
import { oracleVerdict } from "#pantry/test/oracle-verdict.ts";
import { base, edit, item } from "#pantry/test/probe.ts";

const laws = judgedLaws(Qti.statements);

/**
 * The base item with a formula in its body: an HTML wrapper writing `wrapper` (none for no
 * wrapper), then an `m:math` writing `math`, and one cell holding an `mrow` that writes `row`
 * around an `maligngroup`.
 */
const packageOf = (wrapper: string, math: string, row: string) => {
  const formula = `<m:math${math}><m:mtable><m:mtr><m:mtd><m:mrow${row}><m:maligngroup/><m:mi>a</m:mi></m:mrow></m:mtd></m:mtr></m:mtable></m:math>`;
  const body = wrapper === "" ? formula : `<div${wrapper}>${formula}</div>`;
  const namespaced = edit(
    item,
    "<qti-assessment-item ",
    `<qti-assessment-item xmlns:m="http://www.w3.org/1998/Math/MathML" `,
  );

  return {
    ...base,
    "item.xml": edit(
      namespaced,
      `<p id="intro">Pick one.</p>`,
      `<p id="intro">Pick one.</p>${body}`,
    ),
  };
};

/**
 * The audit's cases: each with the verdict both judges give it.
 */
const cases: readonly {
  readonly name: string;
  readonly files: ReturnType<typeof packageOf>;
  readonly accepted: boolean;
}[] = [
  {
    accepted: true,
    files: packageOf(' dir="rtl"', "", ' dir="ltr"'),
    name: "alignDirRtlHtml",
  },
  {
    accepted: true,
    files: packageOf(' dir="auto"', "", ' dir="ltr"'),
    name: "alignDirAutoHtml",
  },
  {
    accepted: false,
    files: packageOf("", ' dir="rtl"', ' dir="ltr"'),
    name: "alignMathDirRtl",
  },
  {
    // The HTML `rtl` is not read, so the `mrow` changes the formula's `ltr` to `rtl` and its group
    // leaves its cell: refused by both judges. The audit's case was accepted only because the
    // HTML `rtl` passed through.
    accepted: false,
    files: packageOf(' dir="rtl"', "", ' dir="rtl"'),
    name: "alignDirRtlHtmlRtl",
  },
  {
    accepted: true,
    files: packageOf("", ' dir="rtl"', ' dir="rtl"'),
    name: "alignMathDirRtlRowRtl",
  },
  {
    accepted: false,
    files: packageOf(' dir="rtl"', ' dir="auto"', ' dir="ltr"'),
    name: "alignDirAutoInsideRtlMath",
  },
];

layer(NodeServices.layer, { excludeTestServices: true })("a formula's direction", (it) => {
  it.effect("starts at its m:math, in the law oracle and the import's rows alike", () =>
    Effect.gen(function* run() {
      for (const { accepted, files, name } of cases) {
        const verdict = yield* Effect.scoped(
          Effect.gen(function* oneCase() {
            const dir = yield* scopedPackage(
              new Map(
                Object.entries(files).map(([path, text]) => [path, new TextEncoder().encode(text)]),
              ),
            );
            const oracle = yield* oracleVerdict(yield* readPackage(dir));
            const program = yield* readProgram(dir);
            const { broken } = judge(hostRowsOf(program.inputs), laws);
            const [first, ...rest] = broken.map(({ law }) => law);

            return {
              host:
                first === undefined
                  ? "accepted"
                  : Option.getOrElse(ruleOfLaws([first, ...rest]), () => "unnamed"),
              oracle: oracle.kind === "accepted" ? new Set(["accepted"]) : oracle.rules,
            };
          }),
        );
        assert.strictEqual(verdict.host === "accepted", accepted, `${name}: the import's rows`);
        assert.strictEqual(verdict.oracle.has("accepted"), accepted, `${name}: the law oracle`);
      }
    }),
  );
});

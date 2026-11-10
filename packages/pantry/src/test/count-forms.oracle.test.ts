/**
 * A count's value, read by XML Schema 1.1 Part 2's lexical mapping on both sides (lane NIL's NS5):
 * each form of the box written as the every-relation item's choice interaction's `max-choices` or
 * `min-choices`, its response single or multiple. `0`, `+0`, `-0` and `00` all read 0 (§3.3.13's
 * lexical space and §3.3.20: nonNegativeInteger admits a `-` before a zero), `+1` and ` 1` read 1,
 * and `-1` reads none, which the value domain refuses alone.
 *
 * Oracle: the specification as a checker, §3.3.20's map by hand (`expected`), against both
 * implementations of it: the law oracle's (`integerOf` after `typedValueOf`, its verdict), and the
 * import's (`countValueOf`, its LeastCount and MostCount rows, and the laws its rows break on the
 * host). A most of 0 under a single response is refused by "Binding cardinality" (reading 92: a
 * most of 0 binds no limit, so the response must be multiple), and a most of 1 is accepted.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Array as Arr, Duration, Effect, Formatter, Option, pipe } from "effect";
import { readProgram } from "#pantry/import/program.ts";
import { ruleOfLaws } from "#pantry/import/refusal.ts";
import { readPackage } from "#pantry/package/read.ts";
import { Qti } from "#pantry/test/qti.ts";
import { everyRelationPackage, scopedPackage } from "#pantry/test/gen/every-relation.ts";
import type { PackageEntries } from "#pantry/test/gen/every-relation.ts";
import { hostRowsOf, judge } from "#pantry/test/host-judge.ts";
import { judgedLaws } from "#pantry/test/judged-laws.ts";
import { oracleVerdict } from "#pantry/test/oracle-verdict.ts";

/**
 * The forms of the box, each with the value §3.3.20 gives it, none for a form outside
 * nonNegativeInteger's value space.
 */
const valued = [
  ["0", 0n],
  ["+0", 0n],
  ["-0", 0n],
  ["00", 0n],
  ["+1", 1n],
  ["-1", undefined],
  [" 1", 1n],
] as const;

/**
 * {@link valued}, by form.
 */
const expected: ReadonlyMap<string, bigint | undefined> = new Map(valued);

/**
 * One case: a form, the count it is written as, and the response's cardinality.
 */
interface FormCase {
  readonly cardinality: "multiple" | "single";
  readonly count: "max-choices" | "min-choices";
  readonly form: string;
}

/**
 * Every case of the box: 7 forms × 2 counts × 2 cardinalities, 28 in all.
 */
const formCases: Gen<FormCase> = (source) => ({
  cardinality: source.draw(element(["single", "multiple"] as const)),
  count: source.draw(element(["max-choices", "min-choices"] as const)),
  form: source.draw(
    element(
      pipe(
        valued,
        Arr.map(([form]) => form),
      ),
    ),
  ),
});

/**
 * The every-relation item's choice interaction's counts, and its response's declaration.
 */
const written = {
  counts: 'max-choices="1" min-choices="0"',
  response: '<qti-response-declaration identifier="RESPONSE" cardinality="single"',
} as const;

/**
 * The every-relation item.
 */
const itemPath = "items/item.xml";

/**
 * Write a case's package: the every-relation package with the case's form as the item's choice
 * interaction's count, the other count as written there, and its response of the case's
 * cardinality.
 *
 * @param drawn - The case.
 * @returns The package's entries.
 */
const packageOf = (drawn: FormCase): PackageEntries => {
  const entries = everyRelationPackage({ choices: 2, hotspots: 1, hottexts: 1 });
  const text = new TextDecoder().decode(entries.get(itemPath));
  assert.lengthOf(text.split(written.counts), 2, "the choice interaction's counts");
  assert.lengthOf(text.split(written.response), 2, "the bound response's declaration");

  const counts =
    drawn.count === "max-choices"
      ? `max-choices="${drawn.form}" min-choices="0"`
      : `max-choices="1" min-choices="${drawn.form}"`;
  const edited = text
    .replace(written.counts, () => counts)
    .replace(written.response, () =>
      written.response.replace('cardinality="single"', `cardinality="${drawn.cardinality}"`),
    );

  return new Map([...entries, [itemPath, new TextEncoder().encode(edited)]]);
};

/**
 * The rules a case is refused under, by §3.3.20's map and reading 92: the value domain's where the
 * form has no value, and Binding cardinality's where a single response binds a most of 0; else
 * none.
 *
 * @param drawn - The case.
 * @returns The rules, empty where the case is accepted.
 */
const rulesOf = (drawn: FormCase): ReadonlySet<string> => {
  const value = expected.get(drawn.form);
  if (value === undefined) {
    return new Set(["attribute-lexical"]);
  }

  return drawn.count === "max-choices" && value === 0n && drawn.cardinality === "single"
    ? new Set(["binding-fit"])
    : new Set();
};

/**
 * Whether a count row is a choice interaction's, the one element of the item the case edits.
 *
 * @param row - The row.
 * @param row.kind - Its element's kind.
 * @returns Whether it is.
 */
const choice = (row: { readonly kind: string }): boolean => row.kind === "qti-choice-interaction";

/**
 * Every law the host judges, read once.
 */
const laws = judgedLaws(Qti);

/**
 * A situation the box must reach.
 */
type Situation = "accepted" | "binding cardinality" | "no value" | "signed zero";

layer(NodeServices.layer, { excludeTestServices: true })("a count's value", (it) => {
  it.effect(
    "reads each form of a count by §3.3.20's map, in the law oracle and in the import alike",
    (ctx) =>
      // Oracle: XML Schema 1.1 Part 2 §3.3.13 and §3.3.20 by hand, and reading 92. Bound: the
      // seven forms, as the most or the least, under a single or a multiple response: 28 packages.
      searched(
        ctx,
        exhaust(
          {
            box: "0, +0, -0, 00, +1, -1 and ' 1' as max-choices or min-choices, under a single or a multiple response",
            caseHang: Duration.minutes(2),
            coverage: requiredInSpace<Situation>([
              "accepted",
              "binding cardinality",
              "no value",
              "signed zero",
            ]),
            generator: formCases,
            limit: 28,
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "XML Schema 1.1 Part 2 §3.3.20's lexical mapping by hand, and reading 92",
            },
            suite: "test/count-forms",
          },
          (drawn, c) =>
            Effect.scoped(
              Effect.gen(function* oneCase() {
                const rules = rulesOf(drawn);
                c.note(rules.has("binding-fit") ? "binding cardinality" : "accepted");
                if (expected.get(drawn.form) === undefined) {
                  c.note("no value");
                }

                if (drawn.form === "-0" || drawn.form === "+0") {
                  c.note("signed zero");
                }

                const dir = yield* scopedPackage(packageOf(drawn));
                const verdict = yield* oracleVerdict(yield* readPackage(dir));
                const program = yield* readProgram(dir);
                const label = Formatter.format(drawn);

                assert.deepStrictEqual(
                  verdict.kind === "accepted" ? [] : [...verdict.rules].toSorted(),
                  [...rules].toSorted(),
                  `${label}: the law oracle`,
                );

                const { broken } = judge(hostRowsOf(program.inputs), laws);
                const [first, ...rest] = broken.map(({ law }) => law);
                const rule =
                  first === undefined
                    ? Option.none()
                    : Option.orElse(ruleOfLaws([first, ...rest]), () => Option.some("unnamed"));
                assert.deepStrictEqual(
                  Option.toArray(rule),
                  [...rules],
                  `${label}: the import's rows break ${broken.map(({ law }) => Formatter.format(law)).join("; ") || "no law"}`,
                );

                const value = expected.get(drawn.form);
                const counted =
                  drawn.count === "max-choices"
                    ? [...program.inputs.MostCount.values()]
                        .filter(choice)
                        .map(({ most, mostValue }) => [most, mostValue] as const)
                    : [...program.inputs.LeastCount.values()]
                        .filter(choice)
                        .map(({ least, leastValue }) => [least, leastValue] as const);
                const collapsed = drawn.form.trim();
                assert.strictEqual(
                  counted.some(([form, integer]) => form === collapsed && integer === value),
                  value !== undefined,
                  `${label}: the import's row of the count, ${Formatter.format(counted)}`,
                );
              }),
            ),
        ),
      ),
    600_000,
  );
});

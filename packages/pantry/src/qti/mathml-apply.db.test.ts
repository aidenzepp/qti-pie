/**
 * The apply laws on the lease, PostgreSQL itself the judge (testing doctrine, rule 3): the laws
 * "MathML arity" and "MathML head qualifier", which only the database can judge, since the host
 * evaluator cannot read an application's arity (decision 416, F10).
 *
 * - **Whole packages through the importer:** each case is one edit of the `m:math` a formula item
 *   holds, a fixture of the MathML base item ({@link formulaSpec}). A refused one is refused under
 *   its law and its rule, in the origin of the `ImportRefused` the importer raises, and the law
 *   oracle (`#pantry/test/oracle.ts`) predicts the same law and rule with no database. An accepted
 *   one commits, as the oracle predicts. The expected laws and rules are those the free fixtures
 *   pin (`#pantry/test/fixtures.mathml.ts`).
 * - **A direct row:** an application whose count of arguments disagrees with its argument rows is
 *   judged by a direct SQL writer, as `qti/declarations.db.test.ts` does: the family's foreign key,
 *   which grizzle defers, set immediate once the rows are in, is SQLSTATE 23503 and its name; the
 *   same application beside the rows its count states is accepted.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Layer, Result } from "effect";
import { describe } from "vitest";
import { composed } from "#pantry/grammar/compose.ts";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { importPackage } from "#pantry/import/package.ts";
import { ImportRefused } from "#pantry/import/refusal.ts";
import { readPackage } from "#pantry/package/read.ts";
import { MathApply, MathArgument } from "#pantry/qti/mathml-apply.ts";
import {
  assertVerdict,
  constraintDescribed,
  judged,
  loginSession,
  statedInserts,
} from "#pantry/test/direct-sql.ts";
import type { Stated } from "#pantry/test/direct-sql.ts";
import { materializeSpec } from "#pantry/test/fixtures.ts";
import type { FixtureSpec } from "#pantry/test/fixtures.ts";
import { mathmlSpecOf } from "#pantry/test/fixtures.mathml.ts";
import { judge, lawsOf, verdictOf } from "#pantry/test/oracle.ts";
import { authorLayerHookTimeoutMs, hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";

/**
 * The spec of a formula item: the MathML base item the free fixtures are cut from, with the
 * formula in its prompt replaced by `block`.
 *
 * @param name - The fixture's name, which names its directory.
 * @param block - The `m:math` element's text, in the `m` prefix the base item declares.
 * @returns The spec; the edit that places the formula is the one fixture `math-apply-binary-one`
 *   makes, which the spec of this one takes as it is but for its text.
 */
const formulaSpec = (name: string, block: string): FixtureSpec => {
  const base = mathmlSpecOf("math-apply-binary-one");
  const edits = base.edits.map((edit) =>
    edit._tag === "ReplaceText" && edit.search === "<qti-prompt>"
      ? { ...edit, replacement: `<qti-prompt>${block}` }
      : edit,
  );

  assert.lengthOf(
    base.edits.filter((edit) => edit._tag === "ReplaceText" && edit.search === "<qti-prompt>"),
    1,
    "the base fixture places its formula by one edit at <qti-prompt>",
  );

  return { ...base, edits, name };
};

/**
 * The formulas the laws refuse, one edit each, with the law and the rule the free fixtures pin.
 */
const refusals = [
  {
    block: "<m:math><m:apply><m:sin/><m:ci>x</m:ci><m:ci>y</m:ci></m:apply></m:math>",
    law: "MathML arity",
    name: "a unary operator with two arguments, apply(sin, ci, ci)",
    rule: "math-arity",
    spec: "apply-sin-ci-ci",
  },
  {
    block: "<m:math><m:apply><m:selector/></m:apply></m:math>",
    law: "MathML arity",
    name: "a selector with no argument, apply(selector)",
    rule: "math-arity",
    spec: "apply-selector",
  },
  {
    block: "<m:math><m:apply><m:partialdiff/><m:ci>f</m:ci></m:apply></m:math>",
    law: "MathML arity",
    name: "a partial differential with one argument, apply(partialdiff, ci)",
    rule: "math-arity",
    spec: "apply-partialdiff-ci",
  },
  {
    block:
      "<m:math><m:apply><m:sin/><m:logbase><m:cn>2</m:cn></m:logbase><m:ci>x</m:ci></m:apply></m:math>",
    law: "MathML head qualifier",
    name: "a logbase beside sin, apply(sin, logbase, ci)",
    rule: "admission",
    spec: "apply-sin-logbase-ci",
  },
] as const;

/**
 * The formulas the laws accept, one edit each.
 */
const acceptances = [
  {
    block:
      "<m:math><m:apply><m:log/><m:logbase><m:cn>2</m:cn></m:logbase><m:ci>x</m:ci></m:apply></m:math>",
    name: "a logbase beside log, apply(log, logbase, ci)",
    spec: "apply-log-logbase-ci",
  },
  {
    block:
      "<m:math><m:apply><m:apply><m:ci>f</m:ci></m:apply><m:degree><m:cn>2</m:cn></m:degree><m:ci>x</m:ci></m:apply></m:math>",
    name: "a degree after an application's head, apply(apply(ci), degree, ci)",
    spec: "apply-apply-degree-ci",
  },
  {
    block:
      "<m:math><m:apply><m:moment/><m:degree><m:cn>3</m:cn></m:degree><m:momentabout><m:mean/></m:momentabout><m:cn>6</m:cn><m:cn>4</m:cn><m:cn>2</m:cn><m:cn>2</m:cn><m:cn>5</m:cn></m:apply></m:math>",
    name: "the REC's moment example, five arguments beside its qualifiers",
    spec: "apply-moment-rec",
  },
] as const;

/**
 * The node of the application the direct cases write.
 */
const applicationNode = "00000000-0000-4000-8000-0000000000a1";

/**
 * The document the direct cases' rows name, which holds none of them.
 */
const strayDocument = "00000000-0000-4000-8000-0000000000ff";

/**
 * The facts of an application of `divide`, a binary operator, to two arguments, whose
 * `arguments` field states a count, and the argument rows it holds.
 *
 * @param stated - The count the application states of its arguments, which the writer derives from
 *   the argument rows where none is given.
 * @param members - The argument rows written beside it.
 * @returns The facts, in writing order; every other field is lawful and the operator's arity is
 *   two.
 */
const applied = (stated: bigint | undefined, members: number): readonly Stated[] => {
  const lawful = {
    document: strayDocument,
    elementChildren: 3n,
    elements: 0n,
    kind: "m:apply",
    nearest: strayDocument,
    node: applicationNode,
    operator: "m:divide",
    owned: 0n,
    parent: strayDocument,
    start: 1n,
    version: "3.0.1",
  };

  return [
    { fact: stated === undefined ? lawful : { ...lawful, arguments: stated }, relation: MathApply },
    ...Array.from({ length: members }, (_, at): Stated => ({
      fact: {
        document: strayDocument,
        kind: "m:ci",
        nearest: strayDocument,
        node: `00000000-0000-4000-8000-0000000000b${String(at + 1)}`,
        parent: applicationNode,
        start: BigInt(at + 2),
        version: "3.0.1",
      },
      relation: MathArgument,
    })),
  ];
};

describe.skipIf(!hasLease)(
  "qti/mathml-apply.db.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: authorLayerHookTimeoutMs,
    })("the apply laws, judged by PostgreSQL", (it) => {
      for (const { block, law, name, rule, spec } of refusals) {
        it.effect(`refuses ${name} under ${law}, as the law oracle predicts`, () =>
          // Oracle: the specification as a checker (MathML 3 §4.3.4 and §4.4's syntax tables,
          // reading 2 and R6-head-qualifiers): the free fixtures' law and rule for the formula,
          // which the law oracle predicts as well.
          Effect.gen(function* refusedApply() {
            const dir = yield* materializeSpec(formulaSpec(`p6n-27-${spec}`, block));
            const grammar = Result.getOrThrow(composed());
            const judgment = yield* judge(yield* readPackage(dir), grammar, lawsOf(grammar));
            const refused = yield* Effect.flip(importPackage(dir));

            assert.isTrue(
              judgment._tag === "Judged" && judgment.breaches.some((breach) => breach.law === law),
              `${name}: the oracle's breaches name ${law}`,
            );
            assert.deepStrictEqual(verdictOf(judgment), { rule, verdict: "refused" }, name);
            assert.isTrue(refused instanceof ImportRefused, `${name}: ${refused._tag}`);

            if (refused instanceof ImportRefused) {
              assert.strictEqual(refused.rule, rule, name);
              assert.strictEqual(refused.origin._tag, "Database", name);
              assert.isTrue(
                refused.origin._tag === "Database" &&
                  refused.origin.laws.some((refusedLaw) => refusedLaw.name === law),
                `${name}: the database's laws name ${law}`,
              );
            }
          }),
        );
      }

      for (const { block, name, spec } of acceptances) {
        it.effect(`accepts ${name}, as the law oracle predicts`, () =>
          // Oracle: the specification as a checker (MathML 3 §4.4.2.11, §4.4.7.7 and §4.4.8.6,
          // reading R6-head-qualifiers), and the law oracle's verdict on the same package.
          Effect.gen(function* acceptedApply() {
            const dir = yield* materializeSpec(formulaSpec(`p6n-27-${spec}`, block));
            const grammar = Result.getOrThrow(composed());
            const judgment = yield* judge(yield* readPackage(dir), grammar, lawsOf(grammar));
            const imported = yield* Effect.result(importPackage(dir));

            assert.deepStrictEqual(verdictOf(judgment), { verdict: "accepted" }, name);
            assert.isTrue(
              imported._tag === "Success",
              `${name}: ${imported._tag === "Failure" ? imported.failure.message : "accepted"}`,
            );
          }),
        );
      }

      it.effect(
        "refuses an application whose argument count disagrees with its argument rows, by the family's foreign key",
        () =>
          // Oracle: the information model: an application's `arguments` is the count of its
          // argument rows (E1 derived), a family `MathApply.arguments` counts, whose foreign key
          // from the owner to the member at its last slot grizzle defers.
          // Bound: `divide`, whose arity of two the count satisfies, so the arity check holds in
          // every case; the application states two arguments beside none, one and two argument
          // rows, and the foreign key is set immediate once the rows are in.
          Effect.gen(function* argumentCount() {
            const client = yield* loginSession;
            const family = yield* constraintDescribed(
              client,
              "math_apply",
              "foreign key MathApply(node, pred(arguments))%",
            );

            for (const members of [0, 1]) {
              assertVerdict(
                yield* judged(client, statedInserts(applied(2n, members)), [family]),
                family,
                true,
                `two stated, ${String(members)} rows`,
                "23503",
              );
            }

            assertVerdict(
              yield* judged(client, statedInserts(applied(2n, 2)), [family]),
              family,
              false,
              "two stated, two rows",
            );
            assertVerdict(
              yield* judged(client, statedInserts(applied(undefined, 2)), [family]),
              family,
              false,
              "two derived from two rows",
            );
          }),
      );
    });
  },
);

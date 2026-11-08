/**
 * The cn law on the lease, PostgreSQL itself the judge (testing doctrine, rule 3): the law
 * "MathML cn form", which holds the content of an `m:cn` to the form its `type` implies, in its
 * `base`, and which names a wrong count of parts too since p6n-36 (decision 360).
 *
 * Each case is one edit of the `m:math` a formula item holds, a fixture of the MathML base item
 * ({@link formulaSpec}), through the importer: a refused one is refused under its law and its
 * rule, in the origin of the `ImportRefused` the importer raises, and the law oracle
 * (`#pantry/test/oracle.ts`) predicts the same law and rule with no database. An accepted one
 * commits, as the oracle predicts. The expected law and rule are those the free fixtures pin
 * (`#pantry/test/fixtures.mathml.ts`, `math-cn-rational-one` and `math-hexdouble-short`).
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
 * @returns The spec; the edit that places the formula is the one fixture `math-cn-rational-one`
 *   makes, which the spec of this one takes as it is but for its text.
 */
const formulaSpec = (name: string, block: string): FixtureSpec => {
  const base = mathmlSpecOf("math-cn-rational-one");
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
 * The numbers the law refuses, one edit each, with the law and the rule the free fixtures pin.
 */
const refusals = [
  {
    block: '<m:math><m:cn type="rational">12</m:cn></m:math>',
    name: "a rational of one part",
    spec: "cn-rational-one-part",
  },
  {
    block: '<m:math><m:cn type="rational">1<m:sep/>2<m:sep/>3</m:cn></m:math>',
    name: "a rational of three parts",
    spec: "cn-rational-three-parts",
  },
  {
    block: '<m:math><m:cn type="hexdouble">7ff8</m:cn></m:math>',
    name: "a hexdouble of four digits",
    spec: "cn-hexdouble-short",
  },
] as const;

/**
 * The numbers the law accepts, one edit each.
 */
const acceptances = [
  {
    block: '<m:math><m:cn type="rational">1<m:sep/>2</m:cn></m:math>',
    name: "a rational of two parts",
    spec: "cn-rational-two-parts",
  },
  {
    block: '<m:math><m:cn base="16">FF</m:cn></m:math>',
    name: "an integer in base 16",
    spec: "cn-base-16",
  },
  {
    block: '<m:math><m:cn type="hexdouble">7ff8000000000000</m:cn></m:math>',
    name: "a hexdouble of sixteen digits",
    spec: "cn-hexdouble-long",
  },
] as const;

/**
 * The law every refused case is refused under, and its rule.
 */
const law = "MathML cn form";

/**
 * The rule of the law.
 */
const rule = "attribute-lexical";

describe.skipIf(!hasLease)(
  "qti/mathml-cn.db.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
      timeout: authorLayerHookTimeoutMs,
    })("the cn law, judged by PostgreSQL", (it) => {
      for (const { block, name, spec } of refusals) {
        it.effect(`refuses ${name} under ${law}, as the law oracle predicts`, () =>
          // Oracle: the specification as a checker (MathML 3 §4.2.1: the parts a `type` lists, split
          // at `m:sep`, each in its form's lexical space; reading R6-hexdouble), the free
          // fixtures' law and rule, which the law oracle predicts as well.
          Effect.gen(function* refusedCn() {
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
          // Oracle: the specification as a checker (MathML 3 §4.2.1: a rational is two integers,
          // digits read in the `base`; a hexdouble is sixteen hexadecimal digits), and the law
          // oracle's verdict on the same package.
          Effect.gen(function* acceptedCn() {
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
    });
  },
);

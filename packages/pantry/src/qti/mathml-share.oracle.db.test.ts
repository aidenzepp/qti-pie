/**
 * The share laws on the lease, PostgreSQL itself the judge (testing doctrine, rule 3): the law
 * "MathML share cycle", and "Idref target" over an `m:share`, over whole packages through the
 * importer and over direct rows.
 *
 * - **Whole packages through the importer:** each case is a formula in the prompt of the MathML base
 *   item. A fixture of the free tables (`#pantry/test/fixtures.mathml.ts`) is used as it stands,
 *   and its expected law and rule are the ones its table row states; the cases no fixture covers
 *   are specs of this file ({@link formulaSpec}). A refused one is refused under its law and its
 *   rule, in the origin of the `ImportRefused` the importer raises, and the law oracle
 *   (`#pantry/test/oracle.ts`) predicts the same law and rule with no database. A dangling share is
 *   refused by "Idref target" alone (decision 428 (2)). An accepted one commits, as the oracle
 *   predicts.
 * - **A direct row:** a `MathRank` row whose rank is not below its parent's is refused by its
 *   `E1_derived` check, and the lawful rank is accepted.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Layer, Result } from "effect";
import { describe } from "vitest";
import { composed } from "#pantry/grammar/compose.ts";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { importDir } from "#pantry/test/import-dir.ts";
import type { LawName } from "#pantry/import/refusal.ts";
import { readEntries } from "#pantry/package/read.ts";
import { MathRank } from "#pantry/qti/mathml-share.ts";
import { assertVerdict, judged, loginSession, statedInserts } from "#pantry/test/direct-sql.ts";
import type { Stated } from "#pantry/test/direct-sql.ts";
import { materializeSpec } from "#pantry/test/fixtures.ts";
import type { FixtureSpec } from "#pantry/test/fixtures.ts";
import { materializeMathml, mathmlNegatives, mathmlSpecOf } from "#pantry/test/fixtures.mathml.ts";
import type { MathmlFixtureName } from "#pantry/test/fixtures.mathml.ts";
import { judge, lawsOf, verdictOf } from "#pantry/test/oracle.ts";
import { hasLease, leaseTestTimeoutMs } from "#pantry/test/settings.ts";
import type { Rule } from "#pantry/import/rules.ts";
import { ImportRefused } from "#pantry/import/rules.ts";

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
 * The law a free negative fixture is expected to be refused under, and its rule.
 */
interface NegativeVerdict {
  readonly law: LawName;
  readonly rule: Rule;
}

/**
 * The law and the rule a free negative fixture is expected to be refused under, as its table row
 * states them.
 *
 * @param name - The negative fixture's name.
 * @returns Its law and rule; a name no negative has fails the case.
 */
const negativeOf = (name: MathmlFixtureName): NegativeVerdict => {
  const found = mathmlNegatives.find((negative) => negative.name === name);

  if (found === undefined || found.law === "codec") {
    return assert.fail(`${name} is no negative of a law`);
  }

  return { law: found.law, rule: found.rule };
};

/**
 * The formulas the laws refuse, with the law and the rule each is refused under, and the one law
 * the database names where it is the only one.
 */
const refusals = [
  {
    ...negativeOf("math-share-dangling"),
    alone: true,
    dir: () => materializeMathml("math-share-dangling"),
    name: 'a share to "#nowhere"',
  },
  {
    ...negativeOf("math-share-cycle"),
    alone: false,
    dir: () => materializeMathml("math-share-cycle"),
    name: "an apply that holds a share of itself, apply id=a(plus, share src=#a, cn)",
  },
  {
    alone: false,
    dir: () =>
      materializeSpec(
        formulaSpec(
          "p6n-28-share-two-apply-cycle",
          '<m:math><m:apply id="a"><m:plus/><m:share src="#b"/><m:cn>1</m:cn></m:apply><m:apply id="b"><m:plus/><m:share src="#a"/><m:cn>1</m:cn></m:apply></m:math>',
        ),
      ),
    law: "MathML share cycle",
    name: "two applies that each hold a share of the other",
    rule: "document-key",
  },
] as const;

/**
 * The formulas the laws accept.
 */
const acceptances = [
  {
    dir: () =>
      materializeSpec(
        formulaSpec(
          "p6n-28-share-sibling",
          '<m:math><m:apply><m:plus/><m:ci id="a">x</m:ci><m:share src="#a"/></m:apply></m:math>',
        ),
      ),
    name: "a share of a sibling, apply(plus, ci id=a, share src=#a)",
  },
  {
    dir: () => materializeMathml("math-share-crossdoc"),
    name: "a share to a packaged file",
  },
] as const;

/**
 * The node of the rank row the direct cases write.
 */
const rankNode = "00000000-0000-4000-8000-0000000000a1";

/**
 * The document the direct cases' rows name, which holds none of them.
 */
const strayDocument = "00000000-0000-4000-8000-0000000000ff";

/**
 * The name PostgreSQL gives `E1_derived`'s check, which grizzle writes in snake case.
 */
const derivedCheck = "e_1_derived";

/**
 * The facts of a rank row of an element under a parent of rank 5.
 *
 * @param kind - The element's kind.
 * @param rank - The element's dominance rank.
 * @returns The facts; every field is lawful.
 */
const ranked = (kind: string, rank: bigint): readonly Stated[] => [
  {
    fact: {
      document: strayDocument,
      kind,
      nearest: strayDocument,
      node: rankNode,
      parent: strayDocument,
      parentRank: 5n,
      rank,
      start: 2n,
      version: "3.0.1",
    },
    relation: MathRank,
  },
];

describe.skipIf(!hasLease)(
  "qti/mathml-share.db.test.ts, on the lease",
  { timeout: leaseTestTimeoutMs },
  () => {
    layer(Layer.mergeAll(AuthorAppLayer, NodeServices.layer), {
      excludeTestServices: true,
    })("the share laws, judged by PostgreSQL", (it) => {
      for (const { alone, dir, law, name, rule } of refusals) {
        it.effect(`refuses ${name} under ${law}, as the law oracle predicts`, () =>
          // Oracle: the specification as a checker (MathML 3 §4.2.7: "An element may not dominate
          // itself"; a share's src names an id of its document, reading 2): the free fixtures' law
          // and rule for the formula, which the law oracle predicts as well.
          Effect.gen(function* refusedShare() {
            const package_ = yield* dir();
            const grammar = Result.getOrThrow(composed());
            const judgment = yield* judge(yield* readEntries(package_), grammar, lawsOf(grammar));
            const refused = yield* Effect.flip(importDir(package_));

            assert.isTrue(
              judgment._tag === "Judged" && judgment.breaches.some((breach) => breach.law === law),
              `${name}: the oracle's breaches name ${law}`,
            );
            assert.deepStrictEqual(verdictOf(judgment), { rule, verdict: "refused" }, name);
            assert.isTrue(refused instanceof ImportRefused, `${name}: ${refused._tag}`);

            if (refused instanceof ImportRefused) {
              assert.strictEqual(refused.rules[0], rule, name);
              assert.strictEqual(refused.origin._tag, "Database", name);
              assert.isTrue(
                refused.origin._tag === "Database" &&
                  refused.origin.laws.some((refusedLaw) => refusedLaw.name === law),
                `${name}: the database's laws name ${law}`,
              );

              if (alone && refused.origin._tag === "Database") {
                assert.deepStrictEqual(
                  [...new Set(refused.origin.laws.map((refusedLaw) => refusedLaw.name))],
                  [law],
                  `${name}: refused by ${law} alone (decision 428 (2))`,
                );
              }
            }
          }),
        );
      }

      for (const { dir, name } of acceptances) {
        it.effect(`accepts ${name}, as the law oracle predicts`, () =>
          // Oracle: the specification as a checker (MathML 3 §4.2.7, reading 2 and 103), and the
          // law oracle's verdict on the same package.
          Effect.gen(function* acceptedShare() {
            const package_ = yield* dir();
            const grammar = Result.getOrThrow(composed());
            const judgment = yield* judge(yield* readEntries(package_), grammar, lawsOf(grammar));
            const imported = yield* Effect.result(importDir(package_));

            assert.deepStrictEqual(verdictOf(judgment), { verdict: "accepted" }, name);
            assert.isTrue(
              imported._tag === "Success",
              `${name}: ${imported._tag === "Failure" ? imported.failure.message : "accepted"}`,
            );
          }),
        );
      }

      it.effect(
        "refuses a rank that is not below its parent's by E1_derived, and accepts a lower one and an m:math's own",
        () =>
          // Oracle: MathML 3 §4.2.7 as the module states it: "each element holds a rank above each
          // of its children's", so a child's rank is below its parent's, except an `m:math`, the
          // root of a tree, whose parent rank states nothing.
          // Bound: under a parent of rank 5, an `m:mi` of rank 5 and of rank 6, refused, and of rank
          // 4, accepted; an `m:math` of rank 9, accepted.
          Effect.gen(function* rankOrder() {
            const client = yield* loginSession;

            for (const [label, kind, rank, refused] of [
              ["a rank equal to its parent's", "m:mi", 5n, true],
              ["a rank above its parent's", "m:mi", 6n, true],
              ["a rank below its parent's", "m:mi", 4n, false],
              ["an m:math above its parent's rank", "m:math", 9n, false],
            ] as const) {
              assertVerdict(
                yield* judged(client, statedInserts(ranked(kind, rank))),
                derivedCheck,
                refused,
                label,
              );
            }
          }).pipe(Effect.scoped),
      );
    });
  },
);

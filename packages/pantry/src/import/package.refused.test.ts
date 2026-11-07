/**
 * `refusedLaws` of `#pantry/import/package.ts` against grizzle's own statement of an
 * `invariant-rejected` outcome's `refused` (`Refused`, grizzle-engine `types/changeset`): `every`
 * names every law a stated row breaks, in the schema's canonical order, and `first` only the first
 * CHECK PostgreSQL tried, for a row the ChangeSet does not state.
 *
 * Oracle: that contract, read against the import. The import states every row it writes, so an
 * `every` refusal's laws are the laws the rule is chosen among, kept whole and in grizzle's order,
 * and a `first` refusal is a disagreement between grizzle and PostgreSQL: a defect that names the
 * package and each law, never a refusal of the package.
 *
 * Bound: every non-empty list of distinct laws drawn from three, one of each law kind the import's
 * refusals most often name (a row check, a primary key and a text pattern), in every order: 15
 * lists under each of the 2 kinds, 30 cases, exhausted.
 */
import type { Law, Refused } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Cause, Effect, Exit } from "effect";
import { refusedLaws } from "#pantry/import/package.ts";
import { lawIdentity } from "#pantry/import/refusal.ts";

/**
 * The laws the lists are drawn from.
 */
const laws: readonly Law[] = [
  { kind: "check", name: "Node_well_formed", relation: "Node" },
  { fields: ["id"], kind: "primaryKey", relation: "Package" },
  { flags: "u", kind: "pattern", source: "^[a-z]+$" },
];

/**
 * Every non-empty list of distinct laws of `pool`, in every order.
 *
 * @param pool - The laws.
 * @returns The lists.
 */
const listsOf = (pool: readonly Law[]): readonly (readonly [Law, ...Law[]])[] =>
  pool.flatMap((law, at) => {
    const rest = pool.filter((_, other) => other !== at);

    return [[law] as const, ...listsOf(rest).map((tail) => [law, ...tail] as const)];
  });

/**
 * The package the refusals are of.
 */
const packageId = "00000000-0000-4000-8000-000000000001";

describe("refusedLaws, against grizzle's every and first", () => {
  const lists = listsOf(laws);

  it("draws every list of the bound: 15 of three laws", () => {
    assert.strictEqual(lists.length, 15);
  });

  it.effect("keeps an every refusal's laws whole and in grizzle's order", () =>
    Effect.gen(function* everyRefusal() {
      for (const list of lists) {
        const refused: Refused = { kind: "every", laws: list };

        assert.deepStrictEqual(yield* refusedLaws(refused, packageId), list);
      }
    }),
  );

  it.effect("dies on a first refusal, naming the package and each law, and refuses nothing", () =>
    Effect.gen(function* firstRefusal() {
      for (const list of lists) {
        const refused: Refused = { kind: "first", laws: list };
        const exit = yield* Effect.exit(refusedLaws(refused, packageId));

        assert.isTrue(
          Exit.isFailure(exit) && Cause.hasDies(exit.cause) && !Cause.hasFails(exit.cause),
          "a first refusal dies, and is no refusal of the package",
        );

        const defect = Exit.isFailure(exit) ? Cause.squash(exit.cause) : undefined;
        assert.instanceOf(defect, Error);

        const message = defect instanceof Error ? defect.message : "";
        assert.include(message, packageId);
        for (const law of list) {
          assert.include(message, lawIdentity(law));
        }
      }
    }),
  );
});

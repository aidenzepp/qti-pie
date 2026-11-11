/**
 * The refusal of a level above `Qti` (`#pantry/import/above.ts`): an `invariant-rejected`
 * outcome whose every law one level above states is `RefusedAbove`, named by that level and the
 * law's own name; any set holding a `Qti` law, a law of pantry's own levels, or laws of two levels,
 * is left to the law table.
 */
import type { Law } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Array as Arr, Formatter, Option, pipe } from "effect";
import { aboveRefusalOf } from "#pantry/import/above.ts";
import { checkNameOf } from "#pantry/import/refusal.ts";
import { qtiOwnLevels } from "#pantry/qti/schema.ts";

/**
 * A law of `level` as grizzle reports it to a Db over `Qti`: the level's check named `name`, over
 * `relation`.
 *
 * @param level - The level above `Qti` that states the check.
 * @param relation - The relation the check is over.
 * @param name - The check's name.
 * @returns The `above` law.
 */
const aboveCheck = (level: string, relation: string, name: string): Law => ({
  kind: "above",
  law: { kind: "check", name, relation },
  level,
});

/**
 * Each law of a refusal as an outcome's `refused` holds it, the law as the schema states it.
 *
 * @param laws - The laws.
 * @returns The refused laws.
 */
const refusedLaws = (
  laws: Arr.NonEmptyReadonlyArray<Law>,
): Arr.NonEmptyReadonlyArray<{ readonly law: Law }> =>
  pipe(
    laws,
    Arr.map((law) => ({ law })),
  );

describe("the refusal of a level above Qti", () => {
  it("names the level and its first check's name when every law is a check of the Cdn level", () => {
    const origin = aboveCheck("Cdn", "CdnUrl", "CdnOrigin");
    const data = aboveCheck("Cdn", "CdnUrl", "CdnData");
    const refused = aboveRefusalOf(
      { kind: "every", laws: refusedLaws([origin, data, origin]) },
      { kind: "unreported" },
    );

    assert.isTrue(Option.isSome(refused));
    if (Option.isNone(refused)) {
      return;
    }

    assert.strictEqual(refused.value._tag, "RefusedAbove");
    assert.strictEqual(refused.value.level, "Cdn");
    assert.strictEqual(refused.value.rule, "CdnOrigin");
    assert.deepStrictEqual(refused.value.rules, ["CdnOrigin", "CdnData"]);
    assert.strictEqual(refused.value.origin._tag, "Database");
    if (refused.value.origin._tag !== "Database") {
      return;
    }

    assert.strictEqual(refused.value.origin.kind, "every");
    assert.deepStrictEqual(refused.value.origin.laws, [
      { text: Formatter.format(origin) },
      { text: Formatter.format(data) },
      { text: Formatter.format(origin) },
    ]);
    assert.lengthOf(refused.value.origin.sources, 1);
    assert.strictEqual(refused.value.origin.witness, "unreported");
  });

  it("leaves a set that holds a Qti law to the law table, so the rule names Qti", () => {
    const qtiCheck: Law = {
      kind: "check",
      name: checkNameOf("AL1 admission"),
      relation: "Attribute",
    };

    assert.isTrue(
      Option.isNone(
        aboveRefusalOf(
          { kind: "some", laws: refusedLaws([aboveCheck("Cdn", "CdnUrl", "CdnOrigin"), qtiCheck]) },
          { kind: "unreported" },
        ),
      ),
    );
  });

  it("leaves laws of two levels to the law table, since no one level names the refusal", () => {
    assert.isTrue(
      Option.isNone(
        aboveRefusalOf(
          {
            kind: "some",
            laws: refusedLaws([
              aboveCheck("Cdn", "CdnUrl", "CdnOrigin"),
              aboveCheck("Delivery", "Session", "Open"),
            ]),
          },
          { kind: "unreported" },
        ),
      ),
    );
  });

  it("leaves a law grizzle reports above at either of pantry's own levels to the law table", () => {
    // Oracle: decision 499: a law at `Qti` or at the `QtiQueries` level over it is `Qti`'s, so the
    // refusal names the level `Qti`. Bound: each of the two own levels, by the name grizzle
    // reports an `above` law's level under; residual: none.
    for (const { name } of qtiOwnLevels()) {
      assert.isTrue(
        Option.isNone(
          aboveRefusalOf(
            { kind: "every", laws: refusedLaws([aboveCheck(name, "Attribute", "AL1_admission")]) },
            { kind: "unreported" },
          ),
        ),
        name,
      );
    }
  });
});

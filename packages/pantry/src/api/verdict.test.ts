/**
 * The refusal an app reads (`#pantry/api/verdict.ts`): each importer refusal mapped to its
 * {@link Refusal} case, its level, rule, detail and origin kept.
 */
import { assert, describe, it } from "@effect/vitest";
import { RefusedAbove } from "#pantry/import/above.ts";
import { ImportRefused } from "#pantry/import/refusal.ts";
import { readerOrigin } from "#pantry/package/refusal-origin.ts";
import { refusalOf } from "#pantry/api/verdict.ts";
import type { Refusal } from "#pantry/api/verdict.ts";

describe("refusalOf", () => {
  it("maps an ImportRefused to the qti case at level Qti, with its rule, detail and origin", () => {
    const refused = new ImportRefused({
      detail: "the package holds no imsmanifest.xml",
      origin: readerOrigin,
      rule: "manifest-root",
    });
    const expected: Refusal = {
      detail: "the package holds no imsmanifest.xml",
      kind: "qti",
      level: "Qti",
      origin: { _tag: "Reader" },
      rule: "manifest-root",
    };

    assert.deepStrictEqual(refusalOf(refused), expected);
  });

  it("maps a RefusedAbove to the above case, with its level, rule, detail and origin", () => {
    const origin = {
      _tag: "Database",
      laws: [{ identity: "check cdn-origin" }],
      sources: ["the Cdn level, which states these laws above Qti"],
      witness: "unreported",
    } as const;
    const refused = new RefusedAbove({
      detail: "cdn-origin: check cdn-origin",
      level: "Cdn",
      origin,
      rule: "cdn-origin",
    });
    const expected: Refusal = {
      detail: "cdn-origin: check cdn-origin",
      kind: "above",
      level: "Cdn",
      origin: {
        _tag: "Database",
        laws: [{ identity: "check cdn-origin" }],
        sources: ["the Cdn level, which states these laws above Qti"],
        witness: "unreported",
      },
      rule: "cdn-origin",
    };

    assert.deepStrictEqual(refusalOf(refused), expected);
  });
});

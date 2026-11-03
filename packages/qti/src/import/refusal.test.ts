import { assert, it } from "@effect/vitest";
import { isMappedLaw, ruleOfLaw } from "#qti/import/refusal.ts";
import type { ImportLaw } from "#qti/import/refusal.ts";

it("sends a contract no row names to value-lexical, unmapped", () => {
  const law: ImportLaw = { contract: "NoSuchContract", kind: "contract" };

  assert.strictEqual(ruleOfLaw(law), "value-lexical");
  assert.isFalse(isMappedLaw(law));
});

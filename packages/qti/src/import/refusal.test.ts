import { assert, it } from "@effect/vitest";
import { ImportRefused, isMappedLaw, ruleOfError, ruleOfLaw } from "#qti/import/refusal.ts";
import type { ImportLaw } from "#qti/import/refusal.ts";

it("sends a contract no row names to value-lexical, unmapped", () => {
  const law: ImportLaw = { contract: "NoSuchContract", kind: "contract" };

  assert.strictEqual(ruleOfLaw(law), "value-lexical");
  assert.isFalse(isMappedLaw(law));
});

it("passes an ImportRefused through ruleOfError as itself", () => {
  const refused = new ImportRefused({
    detail: "the max-choices attribute of qti-choice-interaction is not a non-negative integer",
    rule: "attribute-lexical",
  });

  assert.strictEqual(ruleOfError(refused), refused);
});

/**
 * The refusal module's law names: loading it builds no schema, and a refusal names its rule from
 * the committed dictionary and the law table alone (GOAL "Architecture direction" 1, criterion 5).
 *
 * This file imports only `#pantry/import/refusal.ts` and `#pantry/qti/schema.ts`: the fixture
 * `#pantry/test/qti.ts` builds the schema when it loads.
 */
import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";
import { ruleOfLaw } from "#pantry/import/refusal.ts";
import type { RefusalLaw } from "#pantry/import/refusal.ts";
import { qtiBuilt } from "#pantry/qti/schema.ts";

describe("the refusal's law names", () => {
  it("build nothing when the module loads", () => {
    // Oracle: criterion 5, the entry builds nothing at load. Vitest gives each test file its own
    // module graph, so only this file's imports ran before this assertion.
    assert.isFalse(qtiBuilt());
  });

  it("name a check law's rule without building the schema", () => {
    // Oracle: `vocab/laws.ts`'s table, where "Item ref target" is refused under the rule
    // `item-ref-target`; a check law is named by its own name, so its LawId is not read.
    const refused: RefusalLaw = {
      by: { kind: "constraint", name: "Item_ref_target" },
      id: "planted",
      law: { kind: "check", name: "Item_ref_target", relation: "ItemRefTarget" },
    };

    assert.deepStrictEqual(ruleOfLaw(refused), Option.some("item-ref-target"));
    assert.isFalse(qtiBuilt());
  });
});

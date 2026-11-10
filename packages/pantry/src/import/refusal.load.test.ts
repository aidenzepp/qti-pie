/**
 * The refusal module's law tables: loading it builds no schema, and a refusal still names its rule
 * once the tables are built on first use (GOAL "Architecture direction" 1, criterion 5).
 *
 * This file imports only `#pantry/import/refusal.ts` and `#pantry/qti/schema.ts`: the fixture
 * `#pantry/test/qti.ts` builds the schema when it loads.
 */
import { assert, describe, it } from "@effect/vitest";
import type { Law } from "@bjornpagen/grizzle";
import { Option } from "effect";
import { ruleOfLaws } from "#pantry/import/refusal.ts";
import { qtiBuilt } from "#pantry/qti/schema.ts";

describe("the refusal's law tables", () => {
  it("build nothing when the module loads", () => {
    // Oracle: criterion 5, the entry builds nothing at load. Vitest gives each test file its own
    // module graph, so only this file's imports ran before this assertion.
    assert.isFalse(qtiBuilt());
  });

  it("name a check law's rule", () => {
    // Oracle: `vocab/laws.ts`'s table, where "Item ref target" is refused under the rule
    // `item-ref-target`; a check law is named by its own name.
    const law: Law = { kind: "check", name: "Item_ref_target", relation: "ItemRefTarget" };

    assert.deepStrictEqual(ruleOfLaws([law]), Option.some("item-ref-target"));
  });
});

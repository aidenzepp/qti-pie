/**
 * The import roster's name lists: loading `#pantry/import/roster.ts` builds no schema, and the
 * written names are read from the schema on first call and kept (GOAL "Architecture direction" 1,
 * criterion 5).
 *
 * This file imports only `#pantry/import/roster.ts` and `#pantry/qti/schema.ts`: the fixture
 * `#pantry/test/qti.ts` builds the schema when it loads.
 */
import { assert, describe, it } from "@effect/vitest";
import { writtenNamesOf } from "#pantry/import/roster.ts";
import { qtiBuilt } from "#pantry/qti/schema.ts";

describe("the import roster", () => {
  it("builds nothing when the module loads", () => {
    // Oracle: criterion 5, the entry builds nothing at load. Vitest gives each test file its own
    // module graph, so only this file's imports ran before this assertion.
    assert.isFalse(qtiBuilt());
  });

  it("reads the written names on first call and keeps them", () => {
    // Oracle: the two roots, `Node` and `Package`, are stored relations no ordered family nests,
    // so an import writes each directly; a memoized list is one array on every call.
    const names = writtenNamesOf();

    assert.isNotEmpty(names);
    assert.include(names, "Node");
    assert.include(names, "Package");
    assert.strictEqual(writtenNamesOf(), names);
  });
});

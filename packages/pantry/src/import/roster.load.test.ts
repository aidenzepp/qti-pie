/**
 * The import roster's name lists: loading `#pantry/import/roster.ts` builds no schema, since its
 * names are committed constants the type checker holds to the schema (GOAL "Architecture
 * direction" 1, criterion 5).
 *
 * This file imports only `#pantry/import/roster.ts` and `#pantry/qti/schema.ts`: the fixture
 * `#pantry/test/qti.ts` builds the schema when it loads.
 */
import { assert, describe, it } from "@effect/vitest";
import { writtenNames } from "#pantry/import/roster.ts";
import { qtiBuilt } from "#pantry/qti/schema.ts";

describe("the import roster", () => {
  it("builds nothing when the module loads", () => {
    // Oracle: criterion 5, the entry builds nothing at load. Vitest gives each test file its own
    // module graph, so only this file's imports ran before this assertion.
    assert.isFalse(qtiBuilt());
  });

  it("lists the written names without building the schema", () => {
    // Oracle: the two roots, `Node` and `Package`, are stored relations no ordered family nests,
    // so an import writes each directly.
    assert.include(writtenNames, "Node");
    assert.include(writtenNames, "Package");
    assert.isFalse(qtiBuilt());
  });
});

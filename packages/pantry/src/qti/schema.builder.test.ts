/**
 * The `Qti` builder: loading `#pantry/qti/schema.ts` composes no schema, the first call of `qti()`
 * builds it, and every later call returns that one value (GOAL O1).
 */
import { schemaNameOf } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { qti, qtiBuilt } from "#pantry/qti/schema.ts";

describe("qti()", () => {
  it("builds the schema on its first call and returns that value on every call", () => {
    // Oracle: GOAL O1, "the same options give the same schema value"; with no options, every
    // call. Vitest gives each test file its own module graph, so nothing here called it before.
    assert.isFalse(qtiBuilt());

    const built = qti();

    assert.strictEqual(qti(), built);
    assert.strictEqual(qti({}), built);
    assert.isTrue(qtiBuilt());
  });

  it("names the schema qti, the PostgreSQL schema its level installs into", () => {
    // Oracle: GOAL G2, `schemaNameOf(Qti)` is `qti`.
    assert.strictEqual(schemaNameOf(qti()), "qti");
  });
});

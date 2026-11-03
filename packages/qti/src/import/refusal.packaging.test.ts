import { assert, describe, it } from "@effect/vitest";
import { ruleOfLaw } from "#qti/import/refusal.ts";

describe("the QtiMetadata host law is named by its relation", () => {
  it("keeps the QtiMetadata host law on qti-metadata-host", () => {
    assert.strictEqual(
      ruleOfLaw({ field: "host", kind: "alternatives", relation: "QtiMetadata" }),
      "qti-metadata-host",
    );
  });
});

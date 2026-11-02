import { assert, describe, it } from "@effect/vitest";
import { isMappedLaw, refusalOfLaw, ruleOfLaw } from "#qti/import/refusal.ts";
import type { ImportLaw, ImportWitness } from "#qti/import/refusal.ts";

const nodeLaw: ImportLaw = { field: "kind", kind: "alternatives", relation: "Node" };

const witness: ImportWitness = { kind: "key", relation: "Node", values: { id: "n1" } };

const kinds =
  (kind: string) =>
  (id: string): string | undefined =>
    id === "n1" ? kind : undefined;

describe("the Node alternatives law is named by its witness's kind", () => {
  it("names qti-metadata-host for a qmd:qtiMetadata witness", () => {
    assert.strictEqual(
      refusalOfLaw(nodeLaw, witness, kinds("qmd:qtiMetadata")).rule,
      "qti-metadata-host",
    );
    assert.isTrue(isMappedLaw(nodeLaw, "qmd:qtiMetadata"));
  });

  it("files any other kind under admission, unmapped", () => {
    assert.strictEqual(
      refusalOfLaw(nodeLaw, witness, kinds("qti-simple-choice")).rule,
      "admission",
    );
    assert.isFalse(isMappedLaw(nodeLaw, "qti-simple-choice"));
  });

  it("files a withheld witness under admission", () => {
    assert.strictEqual(
      refusalOfLaw(nodeLaw, { kind: "withheld" }, kinds("qmd:qtiMetadata")).rule,
      "admission",
    );
  });

  it("files the law alone under admission", () => {
    assert.strictEqual(ruleOfLaw(nodeLaw), "admission");
  });

  it("keeps the QtiMetadata host law on qti-metadata-host", () => {
    assert.strictEqual(
      ruleOfLaw({ field: "host", kind: "alternatives", relation: "QtiMetadata" }),
      "qti-metadata-host",
    );
  });
});

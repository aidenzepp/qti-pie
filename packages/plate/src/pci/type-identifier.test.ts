import { assert, describe, it } from "@effect/vitest";
import { factoryFor } from "#plate/pci/type-identifier.ts";

describe("factoryFor", () => {
  it("[pci-01] factoryFor: an exact match wins (R7)", () => {
    assert.deepStrictEqual(factoryFor("urn:example:tap", ["urn:example:grid", "urn:example:tap"]), {
      kind: "exact",
      typeIdentifier: "urn:example:tap",
    });
    assert.deepStrictEqual(factoryFor("urn:example:tap", ["urn:example:tap"]), {
      kind: "exact",
      typeIdentifier: "urn:example:tap",
    });
  });

  it("[pci-01] factoryFor: no match and one registered factory serves it with the written value kept (R7)", () => {
    assert.deepStrictEqual(factoryFor("urn-example-tap", ["urn:example:tap"]), {
      kind: "only",
      typeIdentifier: "urn:example:tap",
      written: "urn-example-tap",
    });
    assert.deepStrictEqual(factoryFor("urn:example:tap:1.0", ["urn:example:tap"]), {
      kind: "only",
      typeIdentifier: "urn:example:tap",
      written: "urn:example:tap:1.0",
    });
    assert.deepStrictEqual(factoryFor("urn:example:tapp", ["urn:example:tap"]), {
      kind: "only",
      typeIdentifier: "urn:example:tap",
      written: "urn:example:tapp",
    });
  });

  it("[pci-01] factoryFor: no match and two or no factories is none (R7)", () => {
    assert.deepStrictEqual(factoryFor("urn:example:tap", ["urn:example:a", "urn:example:b"]), {
      kind: "none",
    });
    assert.deepStrictEqual(factoryFor("urn:example:tap", []), { kind: "none" });
  });
});

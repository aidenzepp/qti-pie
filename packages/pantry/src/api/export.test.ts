/**
 * The public export programs' module (`#pantry/api/export.ts`), without the database: what it
 * exports at run time, and the `DocumentNotFound` failure `readDocument` raises. What the programs
 * read from a stored package is the front-door witness's (`#pantry/api/front-door.db.test.ts`).
 */
import { assert, describe, it } from "@effect/vitest";
import * as api from "#pantry/api/export.ts";
import { DocumentNotFound } from "#pantry/api/export.ts";

describe("#pantry/api/export.ts", () => {
  it("exports exactly the two programs and the error at run time", () => {
    assert.deepStrictEqual(Object.keys(api).toSorted(), [
      "DocumentNotFound",
      "exportPackage",
      "readDocument",
    ]);
  });
});

describe("DocumentNotFound", () => {
  const packageId = "0b6a3f5e-6d3c-4c8e-9a51-1f2e3d4c5b6a";
  const path = "items/choice.xml";
  const error = new DocumentNotFound({ packageId, path });

  it("carries its tag and the package id and path it was asked for", () => {
    assert.strictEqual(error._tag, "DocumentNotFound");
    assert.strictEqual(error.packageId, packageId);
    assert.strictEqual(error.path, path);
  });

  it("names the package id and the path in its message", () => {
    assert.include(error.message, packageId);
    assert.include(error.message, JSON.stringify(path));
  });
});

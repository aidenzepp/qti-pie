import { assert } from "@effect/vitest";
import { readFileSync } from "node:fs";
import { describe, it } from "vitest";

describe("db/layer.ts, without a database", () => {
  it("reads the migrations snapshot from disk, never as a module", () => {
    const source = readFileSync(new URL("layer.ts", import.meta.url), "utf-8");

    assert.notInclude(source, "import snapshot");
    assert.notMatch(source, /^import .*snapshot\.json/mu);
  });
});

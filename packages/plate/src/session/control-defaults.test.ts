import { assert, describe, it } from "@effect/vitest";
import { sessionControlDefaults } from "#plate/session/control-defaults.ts";
import { sourceModules, valueClosure } from "#plate/test/imports.ts";
import * as vocabulary from "#plate/vocabulary.ts";

describe("sessionControlDefaults", () => {
  it("is the very value vocabulary.ts exports", () => {
    assert.strictEqual(vocabulary.sessionControlDefaults, sessionControlDefaults);
  });

  it("reaches session/control.ts without vocabulary.ts, so the browser modules load none of its tables", () => {
    const closure = valueClosure(sourceModules(), ["src/session/control.ts"]);

    assert.include(closure, "src/session/control-defaults.ts");
    assert.notInclude(closure, "src/vocabulary.ts");
  });
});

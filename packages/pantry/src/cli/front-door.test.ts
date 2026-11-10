import { readFileSync } from "node:fs";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";

/**
 * The folder of the command modules, `src/cli`.
 */
const cliRoot = import.meta.dirname;

/**
 * Read the specifiers of every dynamic `import("…")` a command module makes, the loads that run
 * when its handler does.
 *
 * @param module - The command module's file name in `src/cli`.
 * @returns The specifiers, in source order.
 */
const dynamicImportsOf = (module: string): readonly string[] =>
  [
    ...readFileSync(path.join(cliRoot, module), "utf-8").matchAll(
      /\bimport\(\s*["'](?<specifier>[^"']+)["']\s*\)/gu,
    ),
  ].map(({ groups }) => groups?.["specifier"] ?? "");

describe("the commands' front door", () => {
  it.each(["import.ts", "roundtrip.ts"])(
    "%s loads the public import programs, never the importer's own",
    (module) => {
      const loaded = dynamicImportsOf(module);

      assert.include(loaded, "#pantry/api/import.ts");
      assert.notInclude(loaded, "#pantry/import/package.ts");
      assert.notInclude(loaded, "#pantry/import/preview.ts");
    },
  );

  it.each(["export.ts", "roundtrip.ts"])("%s loads the public export program", (module) => {
    assert.include(dynamicImportsOf(module), "#pantry/api/export.ts");
  });
});

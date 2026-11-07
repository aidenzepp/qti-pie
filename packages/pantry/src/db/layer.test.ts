/**
 * No module of the package imports a migration artifact as a module: the snapshot grizzle compiles
 * a login against is read from disk (`#pantry/db/layer.ts` reads `#migrations/qti/snapshot.json`
 * with `readFileString` at the path `import.meta.resolve` gives), so evaluating a module never
 * parses its megabytes and no bundle carries it.
 *
 * Oracle: a search of every TypeScript module of `src` for a static, type-only or dynamic import,
 * or a re-export, of a `#migrations/` specifier, this file's planted cases aside.
 * `import.meta.resolve` only names a path, and is no import.
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";

/**
 * The package's `src` folder.
 */
const sourceRoot = path.resolve(import.meta.dirname, "..");

/**
 * Find the migration artifacts a module's text imports: each `#migrations/` specifier of an
 * `import … from`, an `export … from`, a bare `import`, an `import(…)` call or an `import(…)` type.
 *
 * @param text - The module's text.
 * @returns The specifiers, in order.
 */
const migrationImports = (text: string): readonly string[] =>
  [
    ...text.matchAll(
      /\b(?:from\s*|import\s*\(\s*|^[ \t]*import\s+)["'](?<specifier>#migrations\/[^"']+)["']/gmu,
    ),
  ].map(({ groups }) => groups?.["specifier"] ?? "");

describe("db/layer.ts, without a database", () => {
  it("imports no migration artifact as a module anywhere in src, the snapshot read from disk", () => {
    const imported = readdirSync(sourceRoot, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".ts"))
      .map((entry) => path.join(entry.parentPath, entry.name))
      .filter((file) => file !== import.meta.filename)
      .flatMap((file) =>
        migrationImports(readFileSync(file, "utf-8")).map(
          (specifier) => `${path.relative(sourceRoot, file)}: ${specifier}`,
        ),
      );

    assert.deepStrictEqual(imported, []);
  });

  it("finds a planted import of the snapshot in each form, and no path import.meta.resolve names", () => {
    // Oracle: the rule above, on the named cases. Wild: the static import a module once had, a
    // dynamic import inside the layer's effect, a type-only import and a re-export. Live: the
    // layer's own resolution of the snapshot's path, which reads no module.
    assert.deepStrictEqual(
      migrationImports(
        [
          'import snapshot from "#migrations/qti/snapshot.json" with { type: "json" };',
          'const read = Effect.promise(() => import("#migrations/qti/snapshot.json"));',
          'import type { Snapshot } from "#migrations/qti/types.ts";',
          'export { fingerprint } from "#migrations/qti/fingerprint.ts";',
          'const at = fileURLToPath(import.meta.resolve("#migrations/qti/snapshot.json"));',
        ].join("\n"),
      ),
      [
        "#migrations/qti/snapshot.json",
        "#migrations/qti/snapshot.json",
        "#migrations/qti/types.ts",
        "#migrations/qti/fingerprint.ts",
      ],
    );
  });
});

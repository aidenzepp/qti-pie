/**
 * The import's read, held to evaluate no schema module: the dry run's whole program
 * (`#pantry/import/preview.ts`), which reads a package, shreds its documents and builds every row
 * the import writes, imports no module that builds a relation, a law or the schema, so it starts
 * without building `Qti`.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { moduleImports } from "#pantry/test/module-imports.ts";

/**
 * The `src` folder, where `#pantry/<x>` resolves to `src/<x>`.
 */
const sourceRoot = path.resolve(import.meta.dirname, "..");

/**
 * The prefix of the schema's modules: each builds relations, laws or the schema when it loads.
 */
const schemaPrefix = "#pantry/qti/";

/**
 * The modules under {@link schemaPrefix} that build no relation, law or schema, so loading one
 * evaluates no part of `Qti`: the representation's stated limits, which the row builders and the
 * schema share.
 */
const dataModules: ReadonlySet<string> = new Set(["#pantry/qti/limits.ts"]);

/**
 * Test whether a specifier names a schema module: one under {@link schemaPrefix} that is no
 * {@link dataModules} module.
 *
 * @param specifier - A module specifier.
 * @returns Whether loading it evaluates part of the schema.
 */
const isSchemaModule = (specifier: string): boolean =>
  specifier.startsWith(schemaPrefix) && !dataModules.has(specifier);

/**
 * Find every import of a schema module in the modules an entry reaches: through each static value
 * import and each dynamic `import("#pantry/…")`, never a statement that is wholly `import type`,
 * which loads nothing, and never into a schema module, whose own imports are the schema's.
 *
 * @param entry - The entry's path relative to `src`.
 * @param read - Reads a module's text by its path relative to `src`.
 * @returns Each import of a schema module as `module: specifier`, sorted.
 */
const schemaReads = (entry: string, read: (file: string) => string): readonly string[] => {
  const seen = new Set<string>();
  const found = new Set<string>();
  const unread = [entry];

  while (unread.length > 0) {
    const file = unread.pop() ?? entry;

    if (!seen.has(file)) {
      seen.add(file);

      for (const { form, specifier } of moduleImports(read(file))) {
        if (form !== "type" && specifier.startsWith("#pantry/")) {
          if (isSchemaModule(specifier)) {
            found.add(`${file}: ${specifier}`);
          } else {
            unread.push(specifier.slice("#pantry/".length));
          }
        }
      }
    }
  }

  return [...found].toSorted();
};

/**
 * Read a module's text by its path relative to `src`.
 *
 * @param file - The module's path relative to `src`.
 * @returns Its text.
 */
const readSourceModule = (file: string): string =>
  readFileSync(path.join(sourceRoot, file), "utf-8");

describe("the import's read", () => {
  it("evaluates no schema module", () => {
    // Oracle: the module graph itself, read by the one reader of a module's imports. Bound: every
    // module the dry run loads, the static and the dynamic imports of each.
    assert.deepStrictEqual(
      schemaReads("import/preview.ts", readSourceModule),
      [],
      "A module of the import's read imports a schema module, so the read evaluates Qti: read the term from vocab/terms/, the relation by its name (import/roster.ts), or the reader's rule from import/rules.ts instead.",
    );
  });

  it("finds a planted schema import of every form, and none through a type, a data module or the schema itself", () => {
    // Oracle: the rule as its comment states it, on a planted graph. Live: a value import and a
    // dynamic import of a schema module, one behind a module the entry reaches. Stale: a type-only
    // import of a schema module and a value import of the data module. Wild: a schema module's own
    // import of another, which the read never reaches but through the first.
    const planted = new Map([
      [
        "import/preview.ts",
        [
          'import { readProgram } from "#pantry/import/program.ts";',
          'import type { Node } from "#pantry/qti/node.ts";',
        ].join("\n"),
      ],
      [
        "import/program.ts",
        [
          'import { integerForm } from "#pantry/qti/limits.ts";',
          'import { testKind } from "#pantry/qti/tests.ts";',
          'const load = () => import("#pantry/qti/own.ts");',
        ].join("\n"),
      ],
      ["qti/tests.ts", 'import { Node } from "#pantry/qti/node.ts";'],
    ]);

    assert.deepStrictEqual(
      schemaReads("import/preview.ts", (file) => planted.get(file) ?? ""),
      ["import/program.ts: #pantry/qti/own.ts", "import/program.ts: #pantry/qti/tests.ts"],
    );
  });
});

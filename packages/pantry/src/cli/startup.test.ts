import { readFileSync } from "node:fs";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";

/**
 * The `src` folder, where `#pantry/<x>` resolves to `src/<x>`.
 */
const sourceRoot = path.resolve(import.meta.dirname, "..");

/**
 * The prefixes and package that a module the command line starts with must never import, so that
 * `--help` does not pay for the database, the importer, the exporter or grizzle (spec D7).
 */
const startupForbidden = [
  "#pantry/db/",
  "#pantry/import/",
  "#pantry/export/",
  "#pantry/qti/",
  "@bjornpagen/grizzle",
];

/**
 * The author login, whose workload (the export scan) grizzle's builders build when the module is
 * evaluated: the dry run never needs it, and the database layer loads it only once its settings
 * resolve, so neither may reach it statically.
 */
const loginForbidden = ["#pantry/qti/logins.ts"];

/**
 * Read a module's text from the tree.
 */
const readSource = (file: string): string => readFileSync(file, "utf-8");

/**
 * One import or re-export of a source module, as it is written.
 */
interface StaticImport {
  readonly specifier: string;
  readonly text: string;
}

/**
 * Every static, non-type import of `source`: `import … from "x"`, a bare `import "x"`, and
 * `export … from "x"`, each over any number of lines.
 *
 * A dynamic `import(…)` is not counted, nor is a statement that is wholly `import type` or
 * `export type`. A mixed `import { type A, b }` is counted, because `b` is a value.
 *
 * @param source - The text of a TypeScript module.
 * @returns The statements, in source order.
 */
export const staticImports = (source: string): readonly StaticImport[] => {
  const withoutComments = source
    .replaceAll(/\/\*[\s\S]*?\*\//gu, "")
    .replaceAll(/^\s*\/\/.*$/gmu, "");
  const statements = withoutComments.matchAll(
    /^[ \t]*(?:import\s*["'](?<bare>[^"']+)["']|(?:import|export)\b(?!\s*\()[^;]*?\bfrom\s*["'](?<named>[^"']+)["'])/gmu,
  );

  return [...statements]
    .filter(([text]) => !/^\s*(?:import|export)\s+type\b/u.test(text))
    .map(({ 0: text, groups }) => ({
      specifier: groups?.["bare"] ?? groups?.["named"] ?? "",
      text: text.trim(),
    }));
};

/**
 * The modules a module reaches through static `#pantry/` imports, and the first import that names a
 * forbidden module.
 *
 * @param entry - The absolute path of the module to start from.
 * @param forbidden - The specifier prefixes no module of the graph may import.
 * @param read - Reads a module's text.
 * @returns Each offending module and import, as `module: import`.
 */
export const forbiddenImports = (
  entry: string,
  forbidden: readonly string[],
  read: (file: string) => string,
): readonly string[] => {
  const seen = new Set<string>();
  const offences: string[] = [];
  const pending = [entry];

  while (pending.length > 0) {
    const file = pending.pop() ?? entry;

    if (seen.has(file)) {
      continue;
    }

    seen.add(file);

    for (const { specifier, text } of staticImports(read(file))) {
      if (forbidden.some((prefix) => specifier.startsWith(prefix))) {
        offences.push(`${path.relative(sourceRoot, file)}: ${text.replaceAll(/\s+/gu, " ")}`);
      } else if (specifier.startsWith("#pantry/")) {
        pending.push(path.join(sourceRoot, specifier.slice("#pantry/".length)));
      }
    }
  }

  return offences;
};

describe("staticImports", () => {
  it("counts a multi-line named import", () => {
    const found = staticImports(
      'import {\n  a,\n  b,\n} from "#pantry/db/layer.ts";\nconst c = 1;\n',
    );

    assert.deepStrictEqual(
      found.map(({ specifier }) => specifier),
      ["#pantry/db/layer.ts"],
    );
  });

  it("counts a bare side-effect import", () => {
    const found = staticImports('import "#pantry/export/package.ts";\n');

    assert.deepStrictEqual(
      found.map(({ specifier }) => specifier),
      ["#pantry/export/package.ts"],
    );
  });

  it("counts a re-export from a module", () => {
    const found = staticImports('export { a } from "#pantry/import/package.ts";\n');

    assert.strictEqual(found.length, 1);
  });

  it("does not count a multi-line import type", () => {
    const found = staticImports(
      'import type {\n  A,\n  B,\n} from "#pantry/db/layer.ts";\nexport type { C } from "#pantry/db/layer.ts";\n',
    );

    assert.deepStrictEqual(found, []);
  });

  it("counts a mixed import with an inline type", () => {
    const found = staticImports('import { type A, b } from "#pantry/db/layer.ts";\n');

    assert.strictEqual(found.length, 1);
  });

  it("does not count a dynamic import", () => {
    const found = staticImports(
      'const load = () => import("#pantry/db/layer.ts");\nawait Effect.promise(() => import("#pantry/export/package.ts"));\n',
    );

    assert.deepStrictEqual(found, []);
  });

  it("does not count an import written inside a comment", () => {
    const found = staticImports(
      '/* import { a } from "#pantry/db/layer.ts"; */\n// import "#pantry/db/layer.ts";\n',
    );

    assert.deepStrictEqual(found, []);
  });
});

describe("forbiddenImports", () => {
  it("follows static imports and names the module and the import", () => {
    const files = {
      [path.join(sourceRoot, "a.ts")]: 'import { b } from "#pantry/b.ts";\n',
      [path.join(sourceRoot, "b.ts")]: 'import {\n  x,\n} from "@bjornpagen/grizzle";\n',
    };
    const offences = forbiddenImports(
      path.join(sourceRoot, "a.ts"),
      ["@bjornpagen/grizzle"],
      (file) => Object.entries(files).find(([name]) => name === file)?.[1] ?? "",
    );

    assert.strictEqual(offences.length, 1);
    assert.include(offences[0], "b.ts");
    assert.include(offences[0], "@bjornpagen/grizzle");
  });
});

describe("the command line's startup graph", () => {
  it("reaches no database, importer, exporter, schema or grizzle module statically", () => {
    const offences = forbiddenImports(
      path.join(sourceRoot, "cli.ts"),
      startupForbidden,
      readSource,
    );

    assert.deepStrictEqual(offences, []);
  });
});

describe("the author login's place in the graph", () => {
  it("is not reached statically from the dry run's read", () => {
    const offences = forbiddenImports(
      path.join(sourceRoot, "import", "preview.ts"),
      loginForbidden,
      readSource,
    );

    assert.deepStrictEqual(offences, []);
  });

  it("is not reached statically from the database layer, which loads it once its settings resolve", () => {
    const offences = forbiddenImports(
      path.join(sourceRoot, "db", "layer.ts"),
      loginForbidden,
      readSource,
    );

    assert.deepStrictEqual(offences, []);
  });
});

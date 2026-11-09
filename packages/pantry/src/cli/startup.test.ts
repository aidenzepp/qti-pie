import { readFileSync } from "node:fs";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { moduleImports } from "#pantry/test/module-imports.ts";
import type { ModuleImport } from "#pantry/test/module-imports.ts";

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
 * This package's own install's author login, whose workload (the export scan) grizzle's builders
 * build when the module is evaluated (`#pantry/qti/own-login.ts`): the dry run never needs it, and
 * the database layer loads it only once its settings resolve, so neither may reach it statically.
 */
const loginForbidden = ["#pantry/qti/own-login.ts"];

/**
 * `@effect/platform-node`'s barrel, which loads every module of the package, the Redis client's 648
 * among them: `db/layer.ts` loaded 1,605 modules through it and loads 772 with its module imported
 * by path (measured on 2026-11-06). Production imports each module it needs by its own path, such
 * as `@effect/platform-node/NodeFileSystem`, which the package's `./*` export allows.
 */
const nodePlatformBarrel = "@effect/platform-node";

/**
 * The modules production starts from: the command line, and the grizzle configuration every
 * `grizzle` command reads.
 */
const productionEntries = [
  path.join(sourceRoot, "cli.ts"),
  path.resolve(sourceRoot, "..", "grizzle.config.ts"),
];

/**
 * Read a module's text from the tree.
 */
const readSource = (file: string): string => readFileSync(file, "utf-8");

/**
 * Read the imports of a module that bring a value in when it loads: its static imports and
 * re-exports, not a statement that is wholly `import type` or `export type`, nor an `import(…)`.
 *
 * @param source - The text of a TypeScript module.
 * @returns The imports, in source order.
 */
const staticImports = (source: string): readonly ModuleImport[] =>
  moduleImports(source).filter(({ form }) => form === "value");

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
        offences.push(`${path.relative(sourceRoot, file)}: ${text}`);
      } else if (specifier.startsWith("#pantry/")) {
        pending.push(path.join(sourceRoot, specifier.slice("#pantry/".length)));
      }
    }
  }

  return offences;
};

/**
 * Every module a set of entries reaches: through each static, non-type import, and through each
 * dynamic `import("#pantry/…")`, which is how the command handlers load the engine and the
 * database layer loads the author login. A type written `import("#pantry/…")` is followed too, so
 * the set errs toward more modules, never fewer.
 *
 * @param entries - The absolute paths of the modules to start from.
 * @param read - Reads a module's text.
 * @returns The absolute path of every module reached, the entries included.
 */
const reachedModules = (
  entries: readonly string[],
  read: (file: string) => string,
): ReadonlySet<string> => {
  const seen = new Set<string>();
  const pending = [...entries];

  while (pending.length > 0) {
    const file = pending.pop() ?? "";

    if (seen.has(file)) {
      continue;
    }

    seen.add(file);

    for (const { form, specifier } of moduleImports(read(file))) {
      if (form !== "type" && specifier.startsWith("#pantry/")) {
        pending.push(path.join(sourceRoot, specifier.slice("#pantry/".length)));
      }
    }
  }

  return seen;
};

/**
 * Every static, non-type import of exactly `specifier` in a set of modules, not of a subpath of it.
 *
 * @param modules - The absolute paths of the modules.
 * @param specifier - The specifier.
 * @param read - Reads a module's text.
 * @returns Each offending module and import, as `module: import`.
 */
const importsOf = (
  modules: Iterable<string>,
  specifier: string,
  read: (file: string) => string,
): readonly string[] =>
  [...modules].flatMap((file) =>
    staticImports(read(file))
      .filter((found) => found.specifier === specifier)
      .map(({ text }) => `${path.relative(sourceRoot, file)}: ${text}`),
  );

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

describe("reachedModules", () => {
  it("follows a static and a dynamic import, never a type import, and finds an exact barrel import", () => {
    const files = {
      [path.join(sourceRoot, "a.ts")]:
        'import { b } from "#pantry/b.ts";\nimport type { C } from "#pantry/c.ts";\n',
      [path.join(sourceRoot, "b.ts")]: 'const load = () => import("#pantry/d.ts");\n',
      [path.join(sourceRoot, "c.ts")]: "",
      [path.join(sourceRoot, "d.ts")]:
        'import { NodeFileSystem } from "@effect/platform-node";\nimport * as NodePath from "@effect/platform-node/NodePath";\n',
    };
    const read = (file: string) => Object.entries(files).find(([name]) => name === file)?.[1] ?? "";
    const modules = reachedModules([path.join(sourceRoot, "a.ts")], read);

    assert.deepStrictEqual([...modules].map((file) => path.relative(sourceRoot, file)).toSorted(), [
      "a.ts",
      "b.ts",
      "d.ts",
    ]);
    assert.deepStrictEqual(importsOf(modules, nodePlatformBarrel, read), [
      'd.ts: import { NodeFileSystem } from "@effect/platform-node"',
    ]);
  });
});

describe("the production graph", () => {
  it("imports @effect/platform-node's modules by path, never the barrel that loads the Redis client", () => {
    const modules = reachedModules(productionEntries, readSource);

    // The walk reaches each module that uses the platform; the database layer only through the
    // command handlers' dynamic imports.
    for (const file of ["cli/run.ts", "db/layer.ts", "../grizzle.config.ts"]) {
      assert.isTrue(modules.has(path.resolve(sourceRoot, file)), file);
    }

    assert.deepStrictEqual(importsOf(modules, nodePlatformBarrel, readSource), []);
  });
});

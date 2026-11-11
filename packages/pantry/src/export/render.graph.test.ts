/**
 * What an app that writes documents loads with `documentXml` (`#pantry/export/render.ts`), the one
 * export it imports at run time: the modules render.ts reaches by its imports that bring a value in
 * and their bytes, which every cold instance of such an app reads and evaluates before its first
 * page. Writing a document reads each element's name off its kind's handle
 * (`#pantry/model/names.ts`), so the graph holds neither the vocabulary inventory nor the grammar's
 * closed relations, whose builders every composition runs.
 */
import { readFileSync, realpathSync } from "node:fs";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { Schema } from "effect";
import { moduleImports } from "#pantry/test/module-imports.ts";

/**
 * Pantry's folder, whose `package.json` maps `#pantry/*` to `src/*`.
 */
const pantryRoot = path.resolve(import.meta.dirname, "..", "..");

/**
 * The entry: the module the app imports `documentXml` from.
 */
const entry = path.join(pantryRoot, "src", "export", "render.ts");

/**
 * The parts of a workspace package's manifest the walk resolves through: its name, the subpaths
 * its `exports` lists, and its own `#<package>/*` aliases.
 */
const Manifest = Schema.fromJsonString(
  Schema.Struct({
    exports: Schema.Record(Schema.String, Schema.String),
    imports: Schema.Record(Schema.String, Schema.String),
    name: Schema.String,
  }),
);

/**
 * A workspace package as the walk resolves it: its folder and its manifest.
 */
interface WorkspacePackage {
  readonly manifest: typeof Manifest.Type;
  readonly root: string;
}

/**
 * Read a workspace package's manifest.
 *
 * @param root - The package's folder.
 * @returns The package.
 */
const workspacePackage = (root: string): WorkspacePackage => ({
  manifest: Schema.decodeUnknownSync(Manifest)(
    readFileSync(path.join(root, "package.json"), "utf-8"),
  ),
  root,
});

/**
 * The workspace packages render.ts may reach, each read as Node resolves it: pantry, and crust,
 * whose writer it ends with, through pantry's link to it.
 */
const packages: readonly WorkspacePackage[] = [
  workspacePackage(pantryRoot),
  workspacePackage(realpathSync(path.join(pantryRoot, "node_modules", "@qti-pie", "crust"))),
];

/**
 * Resolve a specifier as Node does for the workspace's own source: a `#…` alias through the
 * importing package's `imports`, and a workspace package's subpath through that package's
 * `exports`. A specifier of any other package is outside the walk.
 *
 * @param specifier - The specifier.
 * @param importer - The absolute path of the module that names it.
 * @returns The absolute path of the module, or none for another package's.
 */
const resolved = (specifier: string, importer: string): string | undefined => {
  if (specifier.startsWith("#")) {
    const owner = packages.find(({ root }) => importer.startsWith(`${root}${path.sep}`));
    const alias = Object.entries(owner?.manifest.imports ?? {}).find(([pattern]) =>
      specifier.startsWith(pattern.replace("*", "")),
    );

    assert.isDefined(owner, `${importer} is in no workspace package`);
    assert.isDefined(alias, `${importer} names ${specifier}, which no alias of its package maps`);

    return path.join(owner.root, alias[1].replace("*", specifier.slice(alias[0].indexOf("*"))));
  }

  const target = packages.find(
    ({ manifest }) => specifier === manifest.name || specifier.startsWith(`${manifest.name}/`),
  );

  if (target === undefined) {
    return undefined;
  }

  const subpath = target.manifest.exports[`.${specifier.slice(target.manifest.name.length)}`];

  assert.isDefined(subpath, `${importer} names ${specifier}, which its package does not export`);

  return path.join(target.root, subpath);
};

/**
 * One module of the graph: its bytes, and the module that first named it, for the chain a failure
 * prints.
 */
interface Reached {
  readonly bytes: number;
  readonly from: string | undefined;
}

/**
 * Walk the workspace modules an entry loads: through each import that brings a value in, a mixed
 * `import { type A, b }` and an `import { type A }` among them, since Node loads the module of
 * both, and through each `import("…")`, so the graph errs toward more modules, never fewer. A
 * statement that is wholly `import type` or `export type` loads nothing.
 *
 * @param start - The absolute path of the entry.
 * @param read - Reads a module's text.
 * @returns Each module reached, the entry included.
 */
const walk = (start: string, read: (file: string) => string): ReadonlyMap<string, Reached> => {
  const reached = new Map<string, Reached>();
  const pending: [file: string, from: string | undefined][] = [[start, undefined]];

  for (let next = pending.pop(); next !== undefined; next = pending.pop()) {
    const [file, from] = next;

    if (!reached.has(file)) {
      const source = read(file);

      reached.set(file, { bytes: Buffer.byteLength(source), from });

      for (const { form, specifier } of moduleImports(source)) {
        const target = form === "type" ? undefined : resolved(specifier, file);

        if (target !== undefined) {
          pending.push([target, file]);
        }
      }
    }
  }

  return reached;
};

/**
 * Spell the chain of imports by which the walk first reached a module.
 *
 * @param reached - The walk.
 * @param file - The module.
 * @returns The chain from the entry, each module relative to pantry's folder or crust's.
 */
const chainTo = (reached: ReadonlyMap<string, Reached>, file: string): string => {
  const chain = [file];

  for (let from = reached.get(file)?.from; from !== undefined; from = reached.get(from)?.from) {
    chain.unshift(from);
  }

  return chain.map((module) => path.relative(pantryRoot, module)).join(" -> ");
};

/**
 * The modules render.ts must not reach, relative to pantry's `src`: the vocabulary inventory, and
 * the grammar's closed relations, which every composition builds and every module that composes
 * reaches, so no module that reaches them is in the graph either.
 */
const forbidden = [/^vocab\/inventory\//u, /^grammar\/closed\.ts$/u];

/**
 * The bytes of source render.ts may load, crust's included, about 3% above the 154,819 it loaded
 * when its names stopped reading the inventory (2026-11-11), down from 244,154. Measured by this
 * walk, which Node's own load of render.ts matched module for module.
 */
const byteBudget = 160_000;

/**
 * Judge a walk from render.ts: each forbidden module it reaches, by the chain that reaches it, and
 * a total over the budget.
 *
 * @param reached - The walk.
 * @returns Each offence, empty when the graph keeps the rules.
 */
const offences = (reached: ReadonlyMap<string, Reached>): readonly string[] => {
  const total = [...reached.values()].reduce((sum, { bytes }) => sum + bytes, 0);
  const source = path.join(pantryRoot, "src");

  return [
    ...[...reached.keys()]
      .filter((file) => forbidden.some((rule) => rule.test(path.relative(source, file))))
      .map((file) => `reaches ${chainTo(reached, file)}`),
    ...(total > byteBudget
      ? [`loads ${total} bytes in ${reached.size} modules, over the budget of ${byteBudget}`]
      : []),
  ];
};

/**
 * Read a module's text from the tree.
 *
 * @param file - The module's absolute path.
 * @returns Its text.
 */
const readSource = (file: string): string => readFileSync(file, "utf-8");

describe("render.ts's module graph", () => {
  it("reaches neither the vocabulary inventory nor the closed relations, within its byte budget", () => {
    assert.deepStrictEqual(offences(walk(entry, readSource)), []);
  });

  it("is caught reaching the inventory again through a planted import, and not through a type", () => {
    // Oracle: the tree as written, with one line planted in model/names.ts, the module whose
    // 634-entry table the inventory fed. A value import loads the 50 KB roster module; a wholly
    // type-only import of it loads nothing.
    const names = path.join(pantryRoot, "src", "model", "names.ts");
    const planted = (line: string) => (file: string) =>
      file === names ? `${line}\n${readSource(file)}` : readSource(file);
    const caught = offences(
      walk(
        entry,
        planted('import { vocabularies } from "#pantry/vocab/inventory/vocabularies.ts";'),
      ),
    );

    assert.lengthOf(caught, 2);
    assert.strictEqual(
      caught[0],
      "reaches src/export/render.ts -> src/model/names.ts -> src/vocab/inventory/vocabularies.ts",
    );
    assert.match(caught[1] ?? "", /^loads \d+ bytes in \d+ modules, over the budget of 160000$/u);
    assert.deepStrictEqual(
      offences(
        walk(
          entry,
          planted('import type { vocabularies } from "#pantry/vocab/inventory/vocabularies.ts";'),
        ),
      ),
      [],
    );
  });
});

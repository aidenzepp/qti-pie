/**
 * The shadcn registry (`registry.json`, issue m3g-05): the file is well formed, every file its one
 * item lists exists, the item's code imports only what a host that installed it resolves, and its
 * sheet brings in plate's sheet without setting a theme token. The in-page cases that render the
 * item's components sit in `src/registry/qti-pie.dom.test.tsx`.
 */
import { existsSync, readFileSync, realpathSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { assert, describe, it } from "@effect/vitest";
import { Schema } from "effect";
import { readImports } from "#plate/test/imports.ts";

/**
 * The URL of `registry.json`, at the package's root.
 */
const registryUrl = new URL("../registry.json", import.meta.url);

/**
 * The package's root directory, which every file the registry lists must stay under.
 */
const packageRoot = realpathSync(fileURLToPath(new URL("../", import.meta.url)));

/**
 * The twelve `type` values shadcn's registry accepts for an item and for a file, from the registry
 * schema's list.
 *
 * @see https://ui.shadcn.com/docs/registry/registry-json
 */
const registryTypes: readonly string[] = [
  "registry:base",
  "registry:block",
  "registry:component",
  "registry:font",
  "registry:lib",
  "registry:hook",
  "registry:ui",
  "registry:page",
  "registry:file",
  "registry:style",
  "registry:theme",
  "registry:item",
];

/**
 * The types of file whose entry must name a `target`: shadcn cannot place them from the host's
 * aliases.
 */
const targetRequired: ReadonlySet<string> = new Set(["registry:file", "registry:page"]);

/**
 * One entry of an item's `files`.
 */
const RegistryFile = Schema.Struct({
  path: Schema.String,
  target: Schema.optionalKey(Schema.String),
  type: Schema.String,
});

/**
 * One registry item, with the properties these cases read.
 */
const RegistryItem = Schema.Struct({
  dependencies: Schema.Array(Schema.String),
  description: Schema.String,
  docs: Schema.String,
  files: Schema.Array(RegistryFile),
  name: Schema.String,
  registryDependencies: Schema.optionalKey(Schema.Array(Schema.String)),
  title: Schema.String,
  type: Schema.String,
});

/**
 * The registry file, with the properties these cases read.
 */
const Registry = Schema.Struct({
  $schema: Schema.String,
  homepage: Schema.String,
  items: Schema.Array(RegistryItem),
  name: Schema.String,
});

/**
 * Read and decode `registry.json`, once per case, so a file that is missing or malformed fails only
 * the cases that read it.
 *
 * @returns The registry.
 */
const readRegistry = (): typeof Registry.Type =>
  Schema.decodeUnknownSync(Registry)(JSON.parse(readFileSync(registryUrl, "utf-8")));

/**
 * Read the one item the registry declares, failing the case when it declares another number.
 *
 * @returns The item.
 */
const readItem = (): typeof RegistryItem.Type => {
  const { items } = readRegistry();
  const [item] = items;

  assert.lengthOf(items, 1);
  assert.isDefined(item);

  return item;
};

/**
 * Read the text of a file an item lists, by its path relative to the registry file.
 *
 * @param path The `path` of a `files` entry.
 * @returns The file's text.
 */
const readListed = (path: string): string => readFileSync(new URL(path, registryUrl), "utf-8");

/**
 * Find the entry of the item's files that has a `path` ending in an extension.
 *
 * @param item The item.
 * @param extension The extension, with its dot.
 * @returns The one entry.
 */
const entryEnding = (
  item: typeof RegistryItem.Type,
  extension: string,
): typeof RegistryFile.Type => {
  const matching = item.files.filter(({ path }) => path.endsWith(extension));
  const [entry] = matching;

  assert.lengthOf(matching, 1, extension);
  assert.isDefined(entry);

  return entry;
};

/**
 * Strip the comments of a stylesheet, so a scan reads only what the sheet declares: a comment may
 * name `:root` or a token without setting one.
 *
 * @param css The stylesheet's text.
 * @returns The text without its `/* … *\/` comments.
 */
const withoutComments = (css: string): string => css.replaceAll(/\/\*[\s\S]*?\*\//gu, "");

describe("the shadcn registry", () => {
  it("[m3g-05] registry.json names shadcn's registry schema and one item, qti-pie", () => {
    const registry = readRegistry();
    const item = readItem();

    assert.strictEqual(registry.$schema, "https://ui.shadcn.com/schema/registry.json");
    assert.strictEqual(registry.name, "qti-pie");
    assert.isNotEmpty(registry.homepage);
    assert.strictEqual(item.name, "qti-pie");
    assert.strictEqual(item.type, "registry:block");
    assert.isNotEmpty(item.title);
    assert.isNotEmpty(item.description);
  });

  it("[m3g-05] the item's docs say to import the sheet once and that plate is not published yet", () => {
    const { docs } = readItem();

    assert.include(docs, "styles/qti-pie.css");
    assert.match(docs, /once/iu);
    assert.match(docs, /not (?:yet )?published/iu);
    assert.include(docs, "@qti-pie/plate");
  });

  it("[m3g-05] every file the item lists exists, with a type from the registry's list", () => {
    const { files } = readItem();

    assert.isNotEmpty(files);
    for (const { path, type } of files) {
      const url = new URL(path, registryUrl);

      assert.isTrue(existsSync(url), path);
      assert.isTrue(statSync(url).isFile(), path);
      assert.isTrue(
        realpathSync(fileURLToPath(url)).startsWith(`${packageRoot}/`),
        `${path} stays under packages/plate`,
      );
      assert.include(registryTypes, type, path);
    }
  });

  it("[m3g-05] every registry:file entry has a target", () => {
    const item = readItem();

    for (const { path, target, type } of item.files) {
      if (targetRequired.has(type)) {
        assert.isDefined(target, path);
        assert.isNotEmpty(target, path);
      }
    }

    const sheet = entryEnding(item, ".css");
    const component = entryEnding(item, ".tsx");

    assert.strictEqual(sheet.type, "registry:file");
    assert.strictEqual(sheet.target, "~/styles/qti-pie.css");
    assert.strictEqual(component.type, "registry:component");
    assert.strictEqual(component.target, "@components/qti-pie.tsx");
  });

  it("[m3g-05] the item depends on @qti-pie/plate and on nothing plate does not ship", () => {
    const item = readItem();

    assert.deepStrictEqual(item.dependencies, ["@qti-pie/plate"]);
    assert.deepStrictEqual(item.registryDependencies ?? [], []);
  });

  it("[m3g-05] the item's code imports only what a host resolves", () => {
    const component = entryEnding(readItem(), ".tsx");
    const { imports, unreadable } = readImports(readListed(component.path));

    assert.deepStrictEqual(unreadable, []);
    assert.deepStrictEqual([...new Set(imports.map(({ specifier }) => specifier))].toSorted(), [
      "@qti-pie/plate/react",
      "react",
    ]);
  });

  it("[m3g-05] the item's sheet brings in plate's sheet and sets no token", () => {
    const sheet = entryEnding(readItem(), ".css");
    const css = withoutComments(readListed(sheet.path));

    assert.include(css, '@import "@qti-pie/plate/styles.css";');
    assert.notMatch(css, /:root/u);
    assert.notMatch(css, /(?:^|[\s;{])--[\w-]+\s*:/u);
  });
});

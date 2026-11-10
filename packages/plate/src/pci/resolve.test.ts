import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";
import { resolvePciModules } from "#plate/pci/resolve.ts";
import type { ModuleRoute, PciModules, PciNotice } from "#plate/pci/resolve.ts";
import { readImports, sourceModules } from "#plate/test/imports.ts";

/**
 * The default primary configuration's path, the schema's default for `primary-configuration`.
 */
const defaultPrimary = "modules/module_resolution.js";

/**
 * The default secondary configuration's path, the schema's default for `secondary-configuration`.
 */
const defaultSecondary = "modules/fallback_module_resolution.js";

/**
 * A module as `qti-interaction-module` writes it, by `id` with its two optional paths.
 *
 * @param id The module's `id`.
 * @param paths Its `primary-path` and `fallback-path`, each absent when not given.
 * @returns The module's facts.
 */
const listed = (
  id: string,
  paths: { readonly primary?: string; readonly fallback?: string } = {},
): PciModules["modules"][number] => ({
  fallbackPath: Option.fromNullishOr(paths.fallback),
  id,
  primaryPath: Option.fromNullishOr(paths.primary),
});

/**
 * The module facts of one PCI, every field absent unless given.
 *
 * @param facts The facts written.
 * @returns The facts, the rest absent.
 */
const pci = (
  facts: {
    readonly module?: string;
    readonly primaryConfiguration?: string;
    readonly secondaryConfiguration?: string;
    readonly modules?: readonly PciModules["modules"][number][];
  } = {},
): PciModules => ({
  module: Option.fromNullishOr(facts.module),
  modules: facts.modules ?? [],
  primaryConfiguration: Option.fromNullishOr(facts.primaryConfiguration),
  secondaryConfiguration: Option.fromNullishOr(facts.secondaryConfiguration),
});

/**
 * A package's files as an in-memory map, read by path.
 *
 * @param files The files' texts by path.
 * @returns The reader `resolvePciModules` takes.
 */
const filesOf =
  (files: Readonly<Record<string, string>>) =>
  (path: string): Option.Option<string> =>
    Option.fromNullishOr(files[path]);

/**
 * A manifest that lists exactly the given paths.
 *
 * @param paths The listed paths.
 * @returns The predicate `resolvePciModules` takes.
 */
const listing =
  (paths: readonly string[]) =>
  (path: string): boolean =>
    paths.includes(path);

/**
 * A manifest that lists every path.
 *
 * @returns True.
 */
const listsEverything = (): boolean => true;

/**
 * Write a configuration file's text.
 *
 * @param paths Its `paths`.
 * @param waitSeconds Its `waitSeconds`, absent when not given.
 * @returns The JSON text.
 */
const configuration = (paths: Readonly<Record<string, string>>, waitSeconds?: number): string =>
  JSON.stringify(waitSeconds === undefined ? { paths } : { paths, waitSeconds });

/**
 * The route of one module among a resolution's routes.
 *
 * @param routes The routes.
 * @param id The module's id.
 * @returns The route, failing the test when there is none.
 */
const routeOf = (routes: readonly ModuleRoute[], id: string): ModuleRoute => {
  const route = routes.find((candidate) => candidate.id === id);

  assert.isDefined(route, `no route for ${id}`);

  return route;
};

/**
 * The route of a module whose both locations resolve, with the default waits.
 *
 * @param id The module's id.
 * @param primary The primary URL.
 * @param fallback The fallback URL, none when not given.
 * @returns The route.
 */
const route = (id: string, primary: string, fallback?: string): ModuleRoute => ({
  fallback: Option.fromNullishOr(fallback),
  id,
  primary: Option.some(primary),
  waitSeconds: { fallback: 7, primary: 7 },
});

describe("resolvePciModules", () => {
  it("[pci-01] module with the default primary configuration resolves to its path plus .js", () => {
    const resolution = resolvePciModules(
      pci({ module: "tap" }),
      filesOf({ [defaultPrimary]: configuration({ tap: "modules/tap" }) }),
      listsEverything,
    );

    assert.deepStrictEqual(resolution.entry, Option.some("tap"));
    assert.deepStrictEqual(resolution.routes, [route("tap", "modules/tap.js")]);
    assert.deepStrictEqual(resolution.notices, []);
  });

  it("[pci-01] a per-module primary-path wins over the configuration, and a fallback-path is the fallback", () => {
    const resolution = resolvePciModules(
      pci({
        module: "xx",
        modules: [listed("xx", { fallback: "modules/good", primary: "modules/xx" })],
      }),
      filesOf({
        [defaultPrimary]: configuration({ xx: "modules/from-configuration" }),
        [defaultSecondary]: configuration({ xx: "modules/from-secondary" }),
      }),
      listsEverything,
    );

    assert.deepStrictEqual(resolution.routes, [route("xx", "modules/xx.js", "modules/good.js")]);
    assert.deepStrictEqual(resolution.notices, []);
  });

  it("[pci-01] a location already ending in .js is never doubled (R1)", () => {
    const resolution = resolvePciModules(
      pci({
        module: "shading",
        modules: [
          listed("shading", { fallback: "modules/shade.js", primary: "modules/shading.js" }),
        ],
      }),
      filesOf({}),
      listsEverything,
    );

    assert.deepStrictEqual(resolution.routes, [
      route("shading", "modules/shading.js", "modules/shade.js"),
    ]);
  });

  it("[pci-01] a per-interaction primary-configuration replaces the default, and the secondary gives the fallbacks", () => {
    const resolution = resolvePciModules(
      pci({
        module: "grid",
        modules: [listed("grid"), listed("util")],
        primaryConfiguration: "modules/a.js",
        secondaryConfiguration: "modules/b.js",
      }),
      filesOf({
        [defaultPrimary]: configuration({
          grid: "modules/default-grid",
          util: "modules/default-util",
        }),
        [defaultSecondary]: configuration({ grid: "modules/default-grid-fallback" }),
        "modules/a.js": configuration({ grid: "modules/a-grid", util: "modules/a-util" }),
        "modules/b.js": configuration({ grid: "modules/b-grid", util: "modules/b-util" }),
      }),
      listsEverything,
    );

    assert.deepStrictEqual(resolution.routes, [
      route("grid", "modules/a-grid.js", "modules/b-grid.js"),
      route("util", "modules/a-util.js", "modules/b-util.js"),
    ]);
    assert.deepStrictEqual(resolution.notices, []);
  });

  it("[pci-01] two PCIs in one item resolve one module id to two versions independently", () => {
    const files = filesOf({
      [defaultPrimary]: configuration({ jquery: "modules/jquery-shared" }),
    });
    const first = resolvePciModules(
      pci({
        module: "first",
        modules: [
          listed("first", { primary: "modules/first" }),
          listed("jquery", { primary: "modules/jquery-1" }),
        ],
      }),
      files,
      listsEverything,
    );
    const second = resolvePciModules(
      pci({
        module: "second",
        modules: [
          listed("second", { primary: "modules/second" }),
          listed("jquery", { primary: "modules/jquery-2" }),
        ],
      }),
      files,
      listsEverything,
    );

    assert.deepStrictEqual(
      routeOf(first.routes, "jquery").primary,
      Option.some("modules/jquery-1.js"),
    );
    assert.deepStrictEqual(
      routeOf(second.routes, "jquery").primary,
      Option.some("modules/jquery-2.js"),
    );
  });

  it("[pci-01] without module, every listed module is routed and the entry is none (R6)", () => {
    const resolution = resolvePciModules(
      pci({
        modules: [
          listed("one", { primary: "modules/one" }),
          listed("two", { primary: "modules/two" }),
          listed("three", { primary: "modules/three" }),
          listed("four", { primary: "modules/four" }),
        ],
      }),
      filesOf({}),
      listsEverything,
    );

    assert.deepStrictEqual(resolution.entry, Option.none());
    assert.deepStrictEqual(
      resolution.routes.map((candidate) => candidate.id),
      ["one", "two", "three", "four"],
    );
    assert.deepStrictEqual(resolution.notices, []);
  });

  it("[pci-01] waitSeconds comes from each configuration, 7 when absent, 0 kept (R3)", () => {
    const timed = resolvePciModules(
      pci({ module: "slow" }),
      filesOf({
        [defaultPrimary]: configuration({ slow: "modules/slow" }, 15),
        [defaultSecondary]: configuration({ slow: "modules/slow-fallback" }),
      }),
      listsEverything,
    );
    const untimed = resolvePciModules(
      pci({ module: "slow" }),
      filesOf({
        [defaultPrimary]: configuration({ slow: "modules/slow" }, 0),
        [defaultSecondary]: configuration({ slow: "modules/slow-fallback" }, 0),
      }),
      listsEverything,
    );

    assert.deepStrictEqual(routeOf(timed.routes, "slow").waitSeconds, { fallback: 7, primary: 15 });
    assert.deepStrictEqual(routeOf(untimed.routes, "slow").waitSeconds, {
      fallback: 0,
      primary: 0,
    });
  });

  it("[pci-01] an absent default configuration contributes nothing and no notice (R2)", () => {
    const resolution = resolvePciModules(pci({ module: "lonely" }), filesOf({}), listsEverything);

    assert.deepStrictEqual(resolution.routes, [
      {
        fallback: Option.none(),
        id: "lonely",
        primary: Option.none(),
        waitSeconds: { fallback: 7, primary: 7 },
      },
    ]);
    assert.deepStrictEqual(resolution.notices, [{ id: "lonely", kind: "pci-module-unresolved" }]);
  });

  it("[pci-01] a configuration that is not a JSON object with paths gives pci-configuration-invalid (R2)", () => {
    const cases: readonly (readonly [string, string])[] = [
      ["not JSON", "define({ paths: {} });"],
      ["a JSON array", "[]"],
      ["an object without paths", JSON.stringify({ waitSeconds: 7 })],
      ["an object whose paths is a string", JSON.stringify({ paths: "modules/x" })],
    ];

    for (const [name, text] of cases) {
      const resolution = resolvePciModules(
        pci({ module: "x", modules: [listed("x", { primary: "modules/x" })] }),
        filesOf({ [defaultPrimary]: text, "modules/second.js": text }),
        listsEverything,
      );

      assert.deepStrictEqual(
        resolution.notices,
        [{ file: defaultPrimary, kind: "pci-configuration-invalid" }],
        name,
      );
      assert.deepStrictEqual(resolution.routes, [route("x", "modules/x.js")], name);
    }

    const secondary = resolvePciModules(
      pci({ module: "x", secondaryConfiguration: "modules/second.js" }),
      filesOf({ [defaultPrimary]: configuration({ x: "modules/x" }), "modules/second.js": "[]" }),
      listsEverything,
    );

    assert.deepStrictEqual(secondary.notices, [
      { file: "modules/second.js", kind: "pci-configuration-invalid" },
    ]);
  });

  it("[pci-01] a module with no primary location gives pci-module-unresolved (R4)", () => {
    const resolution = resolvePciModules(
      pci({
        modules: [
          listed("routed", { primary: "modules/routed" }),
          listed("stranded", { fallback: "modules/spare" }),
        ],
      }),
      filesOf({}),
      listsEverything,
    );

    assert.deepStrictEqual(resolution.notices, [{ id: "stranded", kind: "pci-module-unresolved" }]);
    assert.deepStrictEqual(routeOf(resolution.routes, "stranded"), {
      fallback: Option.some("modules/spare.js"),
      id: "stranded",
      primary: Option.none(),
      waitSeconds: { fallback: 7, primary: 7 },
    });
  });

  it("[pci-01] an unlisted package path is kept with pci-module-unlisted; a non-https absolute URL is dropped with pci-module-insecure (R5)", () => {
    const resolution = resolvePciModules(
      pci({
        modules: [
          listed("local", { fallback: "modules/unlisted", primary: "modules/listed" }),
          listed("remote", {
            fallback: "http://cdn.example/remote",
            primary: "https://cdn.example/remote",
          }),
          listed("odd", { primary: "ftp://cdn.example/odd" }),
        ],
      }),
      filesOf({}),
      listing(["modules/listed.js"]),
    );
    const expected: readonly PciNotice[] = [
      { id: "local", kind: "pci-module-unlisted", location: "modules/unlisted.js" },
      { id: "remote", kind: "pci-module-insecure", location: "http://cdn.example/remote.js" },
      { id: "odd", kind: "pci-module-insecure", location: "ftp://cdn.example/odd.js" },
      { id: "odd", kind: "pci-module-unresolved" },
    ];

    assert.deepStrictEqual(resolution.routes, [
      route("local", "modules/listed.js", "modules/unlisted.js"),
      route("remote", "https://cdn.example/remote.js"),
      {
        fallback: Option.none(),
        id: "odd",
        primary: Option.none(),
        waitSeconds: { fallback: 7, primary: 7 },
      },
    ]);
    assert.deepStrictEqual(resolution.notices, expected);
  });

  it("[pci-01] type-identifier.ts value-imports nothing, and resolve.ts is value-imported by no module, so no browser module reaches it", () => {
    const modules = sourceModules();
    const typeIdentifier = modules.get("src/pci/type-identifier.ts");

    assert.isDefined(typeIdentifier);
    assert.deepStrictEqual(
      readImports(typeIdentifier).imports.filter((declaration) => !declaration.typeOnly),
      [],
    );
    assert.deepStrictEqual(
      [...modules].flatMap(([path, source]) =>
        !path.endsWith(".test.ts") &&
        readImports(source).imports.some(
          (declaration) =>
            declaration.specifier === "#plate/pci/resolve.ts" && !declaration.typeOnly,
        )
          ? [path]
          : [],
      ),
      [],
    );
  });
});

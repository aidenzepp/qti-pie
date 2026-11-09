import { readFileSync } from "node:fs";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Schema } from "effect";
import * as plate from "#plate/index.ts";
import { PartlessTestDefect } from "#plate/navigation.ts";
import * as packageEntry from "#plate/package/index.ts";
import { acceptPackageForTest } from "#plate/package/open.ts";
import { brandRedacted } from "#plate/payload.ts";
import {
  missingModule,
  readImports,
  resolvePlate,
  sourceModules,
  unreadable,
  valueClosure,
} from "#plate/test/imports.ts";
import {
  acceptForTest,
  acceptMarkedTest,
  acceptSectionForTest,
  acceptStimulusForTest,
  acceptTestForTest,
} from "#plate/validate/verdict.ts";

/**
 * Why an import crosses the core boundary: it loads a forbidden specifier, it loads a `#plate/`
 * TypeScript module that is not in the module map, or the reader could not classify its
 * declaration. Another `#plate/` file, such as the generated tables' JSON, imports nothing, so the
 * walk ends there.
 */
type Reason = "forbidden" | typeof missingModule | typeof unreadable;

/**
 * One import that crosses the core boundary.
 */
interface Crossing {
  /**
   * The line its declaration starts on, from 1; 0 for a root that is not in the module map.
   */
  readonly line: number;
  /**
   * The module that makes it, by path under the package.
   */
  readonly module: string;
  readonly reason: Reason;
  /**
   * The specifier it loads; empty for a declaration the reader could not classify.
   */
  readonly specifier: string;
}

/**
 * The specifiers the core may not load (rules `b454bdf7` and `6f47762b`, and the composition ruling
 * `a9d04969` points 1 and 5, so the `"."` and `"./package"` entries stay callable anywhere): the
 * dev playground, the example hosts, the conformance ledger, test support, the Node-only corpus
 * reader, every Node built-in, the HTML parser the tests use, the browser drivers, the test runner
 * by package (`vitest`, every `@vitest/` package, `@effect/vitest` and `vite-plus`, so a re-export
 * under another name, such as vite-plus's in-page context re-exporting `vitest/browser`, cannot
 * route around the list), the QTI database package and grizzle. One that ends in `/` or `:`
 * forbids every specifier it begins; any other forbids itself and its subpaths.
 */
const forbiddenSpecifiers: readonly string[] = [
  "#plate/dev/",
  "#plate/hosts/",
  "#plate/ledger/",
  "#plate/test/",
  "#plate/document/corpus.ts",
  "node:",
  "parse5",
  "playwright",
  "playwright-core",
  "vitest",
  "@vitest/",
  "@effect/vitest",
  "vite-plus",
  "@qti-pie/pantry",
  "@bjornpagen/grizzle",
];

/**
 * Whether the core may not load a specifier.
 *
 * @param specifier The specifier, as written.
 * @returns Whether one of {@link forbiddenSpecifiers} forbids it.
 */
const isForbidden = (specifier: string): boolean =>
  forbiddenSpecifiers.some((forbidden) =>
    /[/:]$/u.test(forbidden)
      ? specifier.startsWith(forbidden)
      : specifier === forbidden || specifier.startsWith(`${forbidden}/`),
  );

/**
 * Scan the modules the roots reach for imports that cross the core boundary. The walk follows
 * every declaration that loads a module: `import … from`, a bare `import "…"`, `export … from`,
 * and a mixed `import { type A, b }`, but not `import type` or `export type`, and never a dynamic
 * `import(…)`. `#plate/<x>` resolves to `src/<x>`.
 *
 * @param modules The modules' sources, by path under the package (`src/<x>`).
 * @param roots The paths to start from.
 * @returns Every crossing, by module in walk order and then by line.
 */
const crossings = (
  modules: ReadonlyMap<string, string>,
  roots: readonly string[],
): readonly Crossing[] =>
  valueClosure(modules, roots).flatMap((module): readonly Crossing[] => {
    const source = modules.get(module);

    if (source === undefined) {
      return roots.includes(module)
        ? [{ line: 0, module, reason: missingModule, specifier: module }]
        : [];
    }

    const { imports, unreadable: lines } = readImports(source);
    const found = [
      ...imports.flatMap(({ line, specifier, typeOnly }): readonly Crossing[] => {
        const target = resolvePlate(specifier);

        if (typeOnly) {
          return [];
        }

        if (isForbidden(specifier)) {
          return [{ line, module, reason: "forbidden", specifier }];
        }

        return target === undefined || !target.endsWith(".ts") || modules.has(target)
          ? []
          : [{ line, module, reason: missingModule, specifier }];
      }),
      ...lines.map((line): Crossing => ({ line, module, reason: unreadable, specifier: "" })),
    ];

    return found.toSorted((left, right) => left.line - right.line);
  });

/**
 * Scan an in-memory module map from `src/a.ts`.
 *
 * @param modules The modules, by path under the package.
 * @returns The crossings the closure from `src/a.ts` holds.
 */
const scan = (modules: Readonly<Record<string, string>>): readonly Crossing[] =>
  crossings(new Map(Object.entries(modules)), ["src/a.ts"]);

describe("the core boundary's scanner", () => {
  it("reports b.ts when a.ts imports #plate/b.ts and b.ts imports node:fs/promises", () => {
    assert.deepStrictEqual(
      scan({
        "src/a.ts": 'import { b } from "#plate/b.ts";\n',
        "src/b.ts": 'import { readFile } from "node:fs/promises";\n',
      }),
      [{ line: 1, module: "src/b.ts", reason: "forbidden", specifier: "node:fs/promises" }],
    );
  });

  it("follows export … from and a mixed import { type A, b }, and neither import type nor a dynamic import(…)", () => {
    assert.deepStrictEqual(
      scan({
        "src/a.ts": [
          'import type { T } from "#plate/t.ts";',
          'import { type A, b } from "#plate/b.ts";',
          'export { c } from "#plate/c.ts";',
          'export const lazy = () => import("node:fs");',
          "",
        ].join("\n"),
        "src/b.ts": 'import "parse5";\n',
        "src/c.ts": 'export * from "@qti-pie/pantry";\n',
        "src/t.ts": 'import { readFileSync } from "node:fs";\n',
      }),
      [
        { line: 1, module: "src/b.ts", reason: "forbidden", specifier: "parse5" },
        { line: 1, module: "src/c.ts", reason: "forbidden", specifier: "@qti-pie/pantry" },
      ],
    );
  });

  it("reports a core module that imports vite-plus's browser provider or its in-page context", () => {
    assert.deepStrictEqual(
      scan({
        "src/a.ts": [
          'import { playwright } from "vite-plus/test/browser-playwright";',
          'import { server } from "vite-plus/test/browser/context";',
          "",
        ].join("\n"),
      }),
      [
        {
          line: 1,
          module: "src/a.ts",
          reason: "forbidden",
          specifier: "vite-plus/test/browser-playwright",
        },
        {
          line: 2,
          module: "src/a.ts",
          reason: "forbidden",
          specifier: "vite-plus/test/browser/context",
        },
      ],
    );
  });

  it("reports a core module that imports the test runner under another package's name", () => {
    assert.deepStrictEqual(
      scan({
        "src/a.ts": [
          'import { page } from "vitest/browser";',
          'import { it } from "@effect/vitest";',
          "",
        ].join("\n"),
      }),
      [
        { line: 1, module: "src/a.ts", reason: "forbidden", specifier: "vitest/browser" },
        { line: 2, module: "src/a.ts", reason: "forbidden", specifier: "@effect/vitest" },
      ],
    );
  });

  it("forbids each listed specifier and its subpaths, and nothing else", () => {
    const forbidden = [
      "#plate/dev/serve.ts",
      "#plate/hosts/html.ts",
      "#plate/ledger/view.ts",
      "#plate/test/imports.ts",
      "#plate/document/corpus.ts",
      "node:fs",
      "node:http",
      "parse5",
      "parse5/dist/index.js",
      "@qti-pie/pantry",
      "@bjornpagen/grizzle/schema",
      "playwright",
      "playwright/test",
      "playwright-core",
      "playwright-core/lib/server",
    ];
    const allowed = [
      "effect",
      "@qti-pie/crust",
      "#plate/document/read.ts",
      "#plate/testing.ts",
      "#plate/devices.ts",
      "parse5-extra",
    ];

    assert.deepStrictEqual([...forbidden, ...allowed].filter(isForbidden), forbidden);
  });

  it("forbids the test runner by package: vitest, every @vitest/ package, @effect/vitest and vite-plus, each with its subpaths", () => {
    const forbidden = [
      "vitest",
      "vitest/browser",
      "@vitest/browser",
      "@vitest/browser-playwright",
      "@effect/vitest",
      "vite-plus",
      "vite-plus/test",
      "vite-plus/test/browser-playwright",
      "vite-plus/test/browser/context",
    ];
    const allowed = ["effect", "#plate/model/item.ts"];

    assert.deepStrictEqual([...forbidden, ...allowed].filter(isForbidden), forbidden);
  });

  it("reports a module the map does not hold and a declaration it cannot read", () => {
    assert.deepStrictEqual(
      scan({ "src/a.ts": 'import { b } from "#plate/b.ts";\nimport { from "x";\n' }),
      [
        { line: 1, module: "src/a.ts", reason: missingModule, specifier: "#plate/b.ts" },
        { line: 2, module: "src/a.ts", reason: unreadable, specifier: "" },
      ],
    );
  });
});

/**
 * The package's sources, tests included, by path under the package.
 */
const modules = sourceModules();

/**
 * Every module the public surface reaches through declarations that load a module.
 */
const closure = valueClosure(modules, ["src/index.ts"]);

/**
 * List the exports of both public entries, `src/index.ts` and `src/package/index.ts`, that are one
 * of some named values, by its own name or under any other.
 *
 * @param named The values, by the name each is declared with.
 * @returns `<entry>.<name>` for each name an entry exports one of them under, empty when neither
 *   exports one.
 */
const exportedAmong = (named: ReadonlyMap<string, unknown>): readonly string[] => {
  const values = new Set(named.values());

  const surfaces: readonly (readonly [string, object])[] = [
    ["index", plate],
    ["package", packageEntry],
  ];

  return surfaces.flatMap(([entry, surface]) =>
    Object.entries(surface).flatMap(([name, value]) =>
      named.has(name) || values.has(value) ? [`${entry}.${name}`] : [],
    ),
  );
};

/**
 * The committed JSON modules the serving entry may load, each with what reads it while a host
 * serves items. Any other JSON its closure reaches is a table serving never reads, loaded and
 * parsed on every cold start for nothing.
 */
const servedTables = {
  "src/model/blocks.generated.json":
    "the block names of XML Schema Part 2, which model/regex.ts reads to check a pattern facet",
  "src/validate/tables.generated.json": "the XSD tables, which open checks a document by",
} satisfies Readonly<Record<string, string>>;

/**
 * List the committed JSON modules the roots reach that {@link servedTables} does not name.
 *
 * @param sources The modules' sources, by path under the package (`src/<x>`).
 * @param roots The paths to start from.
 * @returns Each such JSON module, in the order the walk first reached it.
 */
const unservedTables = (
  sources: ReadonlyMap<string, string>,
  roots: readonly string[],
): readonly string[] =>
  valueClosure(sources, roots).filter(
    (module) => module.endsWith(".json") && !Object.hasOwn(servedTables, module),
  );

/**
 * The parts of `package.json` this witness reads.
 */
const Manifest = Schema.Struct({
  dependencies: Schema.Record(Schema.String, Schema.String),
  devDependencies: Schema.Record(Schema.String, Schema.String),
  exports: Schema.Record(Schema.String, Schema.String),
});

/**
 * Read plate's `package.json`, once per case, so a manifest that does not decode fails only the
 * cases that read it.
 *
 * @returns The parts of the manifest {@link Manifest} names.
 */
const readManifest = (): typeof Manifest.Type =>
  Schema.decodeUnknownSync(Manifest)(
    JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf-8")),
  );

describe("the core, from src/index.ts", () => {
  it("loads no dev playground, example host, ledger, test support, corpus reader, Node built-in, parse5, playwright, playwright-core, the test runner (vitest, any @vitest/ package, @effect/vitest, vite-plus), pantry or grizzle", () => {
    assert.deepStrictEqual(crossings(modules, ["src/index.ts"]), []);
  });

  it("reaches more than ten modules, render, score and open among them", () => {
    assert.isAbove(closure.length, 10);
    assert.includeMembers(
      [...closure],
      ["src/render.ts", "src/score.ts", "src/validate/open.ts", "src/document/read.ts"],
    );
  });

  it("exports from neither entry a test seam, brand constructor or defect, under any name (ledger security note)", () => {
    // The seams that make an accepted root, an `AcceptedPackage` or a `Redacted` without `check`,
    // `openPackage` or `redact`, and the defect no accepted test can raise.
    const seams: ReadonlyMap<string, unknown> = new Map<string, unknown>([
      ["acceptForTest", acceptForTest],
      ["acceptPackageForTest", acceptPackageForTest],
      ["acceptSectionForTest", acceptSectionForTest],
      ["acceptStimulusForTest", acceptStimulusForTest],
      ["acceptTestForTest", acceptTestForTest],
      ["brandRedacted", brandRedacted],
      ["PartlessTestDefect", PartlessTestDefect],
    ]);

    assert.includeMembers(Object.keys(plate), ["open", "redact"]);
    assert.includeMembers(Object.keys(packageEntry), ["openPackage"]);
    assert.deepStrictEqual(exportedAmong(seams), []);
  });

  it("exports no marked-test seam, openPackage's constructor of an accepted test it marked, under any name (ledger D9-15)", () => {
    // `acceptMarkedTest` brands an `AcceptedTest` without `check`, so only `openPackage` calls it.
    assert.deepStrictEqual(exportedAmong(new Map([["acceptMarkedTest", acceptMarkedTest]])), []);
  });

  it("publishes src/index.ts and src/package/index.ts as the exports map's only script modules", () => {
    assert.deepStrictEqual(
      Object.entries(readManifest().exports).filter(([, target]) => /\.[cm]?[jt]s$/u.test(target)),
      [
        [".", "./src/index.ts"],
        ["./package", "./src/package/index.ts"],
      ],
    );
  });

  it.effect(
    "resolves @qti-pie/plate/package through the exports map to the package entry, which exports openPackage alone",
    () =>
      Effect.gen(function* packageSelfImport() {
        const surface = yield* Effect.promise(() => import("@qti-pie/plate/package"));

        assert.deepStrictEqual(Object.keys(surface), ["openPackage"]);
        assert.strictEqual(surface.openPackage, packageEntry.openPackage);
      }),
  );

  it("loads from src/package/index.ts, the package entry, none of what the core may not load", () => {
    assert.deepStrictEqual(crossings(modules, ["src/package/index.ts"]), []);
  });

  it('loads from the serving entry, the exports map\'s ".", no committed JSON but the XSD tables and the block table', () => {
    const entry = readManifest().exports["."]?.replace(/^\.\//u, "") ?? "";

    assert.strictEqual(entry, "src/index.ts");
    assert.deepStrictEqual(unservedTables(modules, [entry]), []);
    // The package tables are the package entry's alone.
    assert.includeMembers(
      [...valueClosure(modules, ["src/package/index.ts"])],
      ["src/package/tables.generated.json"],
    );
  });

  it("refuses the package tables on the serving entry once it re-exports openPackage (the plant)", () => {
    const planted = new Map(modules);
    planted.set(
      "src/index.ts",
      `${modules.get("src/index.ts") ?? ""}\nexport { openPackage } from "#plate/package/open.ts";\n`,
    );

    assert.deepStrictEqual(unservedTables(planted, ["src/index.ts"]), [
      "src/package/tables.generated.json",
    ]);
  });

  it("holds playwright-core and playwright at exactly 1.64.1 and @vitest/browser-playwright at exactly 5.1.0 among the devDependencies, never the dependencies", () => {
    const { dependencies, devDependencies } = readManifest();

    assert.strictEqual(devDependencies["playwright-core"], "1.64.1");
    assert.strictEqual(devDependencies["playwright"], "1.64.1");
    assert.strictEqual(devDependencies["@vitest/browser-playwright"], "5.1.0");
    assert.notProperty(dependencies, "playwright-core");
    assert.notProperty(dependencies, "playwright");
    assert.notProperty(dependencies, "@vitest/browser-playwright");
  });
});

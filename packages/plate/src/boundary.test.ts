import { readFileSync } from "node:fs";
import { assert, describe, it } from "@effect/vitest";
import { Schema } from "effect";
import * as plate from "#plate/index.ts";
import { PartlessTestDefect } from "#plate/navigation.ts";
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
 * `a9d04969` points 1 and 5, so the one `"."` entry stays callable anywhere): the dev playground,
 * the example hosts, the conformance ledger, test support, the Node-only corpus reader, every Node
 * built-in, the HTML parser the tests use, the browser drivers, the test runner by package
 * (`vitest`, every `@vitest/` package, `@effect/vitest` and `vite-plus`, so a re-export under
 * another name, such as vite-plus's in-page context re-exporting `vitest/browser`, cannot route
 * around the list), the QTI database package and grizzle. One that ends in `/` or `:` forbids every
 * specifier it begins; any other forbids itself and its subpaths.
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

  it("exports no test seam, brand constructor or defect, under any name (ledger security note)", () => {
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
    const values = new Set(seams.values());
    const exported = Object.entries(plate);

    assert.includeMembers(
      exported.map(([name]) => name),
      ["open", "redact"],
    );
    assert.deepStrictEqual(
      exported.flatMap(([name, value]) => (seams.has(name) || values.has(value) ? [name] : [])),
      [],
    );
  });

  it("publishes src/index.ts as the exports map's only script module", () => {
    assert.deepStrictEqual(
      Object.entries(readManifest().exports).filter(([, target]) => /\.[cm]?[jt]s$/u.test(target)),
      [[".", "./src/index.ts"]],
    );
  });

  it("holds playwright-core and playwright at exactly 1.64.1 and @vitest/browser-playwright at exactly 5.0.1 among the devDependencies, never the dependencies", () => {
    const { dependencies, devDependencies } = readManifest();

    assert.strictEqual(devDependencies["playwright-core"], "1.64.1");
    assert.strictEqual(devDependencies["playwright"], "1.64.1");
    assert.strictEqual(devDependencies["@vitest/browser-playwright"], "5.0.1");
    assert.notProperty(dependencies, "playwright-core");
    assert.notProperty(dependencies, "playwright");
    assert.notProperty(dependencies, "@vitest/browser-playwright");
  });
});

import { randomUUID } from "node:crypto";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { brotliCompressSync, constants, gzipSync } from "node:zlib";
import { afterAll, assert, beforeAll, describe, it } from "@effect/vitest";
import { ConfigProvider, Effect, Result, Schema } from "effect";
import { minifySync, transformSync } from "vite/rolldown/utils";
import {
  loadBaseline,
  runtimeEntry,
  runtimeSize,
  RuntimeSizeSchema,
  runtimeSizeText,
  sizeJump,
} from "#plate/ledger/runtime-size.ts";
import type {
  Baseline,
  ModuleSize,
  RuntimeSize,
  RuntimeSizeFailed,
} from "#plate/ledger/runtime-size.ts";
import { sourceModules, valueClosure } from "#plate/test/imports.ts";

/**
 * The scratch folder this run owns, under the package's git-ignored `work/`. Its name is new for
 * each run, so two runs at once never share or remove each other's files.
 */
const scratch = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "work",
  `runtime-size-test-${randomUUID()}`,
);

/**
 * The runtime's 14 controllers, one module `src/interactions/<kind>.dom.ts` each.
 */
const controllerKinds = [
  "associate",
  "drawing",
  "gap-match",
  "graphic-associate",
  "graphic-gap-match",
  "graphic-order",
  "hotspot",
  "hottext",
  "match",
  "media",
  "order",
  "portable-custom",
  "position-object",
  "select-point",
] as const;

/**
 * Measure a module map, failing the test with the measurement's message when it cannot.
 *
 * @param modules The modules' sources, by path under the package.
 * @param entry The module to measure from.
 * @returns The measurement.
 */
const measured = (modules: ReadonlyMap<string, string>, entry = "src/a.ts"): RuntimeSize => {
  const result = runtimeSize(modules, entry);

  if (Result.isFailure(result)) {
    return assert.fail(result.failure.message);
  }

  return result.success;
};

/**
 * Measure a module map that cannot be measured, failing the test when it can.
 *
 * @param modules The modules' sources, by path under the package.
 * @param entry The module to measure from.
 * @returns The failure the measurement reports.
 */
const failed = (
  modules: ReadonlyMap<string, string>,
  entry: string = runtimeEntry,
): RuntimeSizeFailed => {
  const result = runtimeSize(modules, entry);

  if (Result.isSuccess(result)) {
    return assert.fail("The measurement succeeded where it should have failed.");
  }

  return result.failure;
};

/**
 * Measure one module as the whole runtime.
 *
 * @param source The module's TypeScript source.
 * @returns The measurement of a runtime whose entry is `src/a.ts`.
 */
const measuredAlone = (source: string): RuntimeSize =>
  measured(new Map([["src/a.ts", source]]), "src/a.ts");

/**
 * A module row whose three figures are chosen, for the tests of the jump and the text.
 *
 * @param module The module's path.
 * @param gzip Its gzip size, which the jump compares.
 * @returns The row.
 */
const row = (module: string, gzip: number): ModuleSize => ({
  brotli: gzip,
  gzip,
  minified: gzip * 3,
  module,
});

/**
 * A measurement whose total gzip size is chosen, with a single module of that size unless modules
 * are given.
 *
 * @param gzip The total gzip size.
 * @param modules The module rows.
 * @returns The measurement.
 */
const sized = (
  gzip: number,
  modules: readonly ModuleSize[] = [row("src/a.ts", gzip)],
): RuntimeSize => ({
  entry: "src/a.ts",
  modules,
  packages: [],
  total: { brotli: gzip, gzip, minified: gzip * 3 },
});

/**
 * The file an earlier run left, as the tests of the jump name it.
 */
const earlier = "work/old/runtime-size.json";

/**
 * A baseline an earlier run left.
 *
 * @param size The earlier run's measurement.
 * @returns The baseline.
 */
const given = (size: RuntimeSize): Baseline => ({ kind: "given", path: earlier, size });

/**
 * Decide a jump from a baseline total to a current total, each a single module.
 *
 * @param before The baseline's total gzip size.
 * @param after The current total gzip size.
 * @returns The jump.
 */
const between = (before: number, after: number) => sizeJump(given(sized(before)), sized(after));

/**
 * Text shared by three modules that compress well together: a table of keys and sentences.
 */
const sharedTable = Array.from(
  { length: 40 },
  (_, index) =>
    `  if (input === "key-${String(index)}") { return "the value for key ${String(index)} in the shared table"; }`,
).join("\n");

/**
 * One module that holds {@link sharedTable} under its own name.
 *
 * @param name The name it exports.
 * @param imports The modules it imports for their effects.
 * @returns The module's source.
 */
const tableModule = (name: string, imports: readonly string[] = []): string =>
  [
    ...imports.map((specifier) => `import "${specifier}";`),
    `export const ${name} = (input: string): string => {`,
    sharedTable,
    '  return "";',
    "};",
    "",
  ].join("\n");

/**
 * A module that exports a long list of words, which no compressor reduces to the same size at every
 * level, built from a fixed sequence so the same call gives the same module.
 *
 * @param name The name it exports.
 * @param first The first entry, to give a module its own text.
 * @param imports The modules it imports for their effects.
 * @returns The module's source.
 */
const listModule = (name: string, first: string, imports: readonly string[] = []): string => {
  const words = ["choice", "match", "order", "hotspot", "associate", "drawing", "gap", "media"];
  let seed = 7;
  const entries = Array.from({ length: 300 }, () => {
    seed = (seed * 1_103_515_245 + 12_345) % 2_147_483_648;

    return JSON.stringify(`${words[seed % words.length] ?? ""}-${String(seed % 97)}`);
  });

  return [
    ...imports.map((specifier) => `import "${specifier}";`),
    `export const ${name} = [${JSON.stringify(first)}, ${entries.join(", ")}];`,
    "",
  ].join("\n");
};

/**
 * Compile and minify a module with the tools the measurement names, as an oracle for its figures.
 *
 * @param file The module's path.
 * @param source Its TypeScript source.
 * @returns Its minified JavaScript.
 */
const minifiedBy = (file: string, source: string): string =>
  minifySync(
    file,
    transformSync(file, source, { lang: "ts", typescript: { onlyRemoveTypeImports: true } }).code,
    { compress: true, mangle: true },
  ).code;

/**
 * The bytes brotli at quality 11 compresses a piece of code to, as the documented method counts.
 *
 * @param code Minified JavaScript.
 * @returns The compressed size.
 */
const brotliBytes = (code: string): number =>
  brotliCompressSync(code, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).byteLength;

/**
 * The bytes gzip at level 9 compresses a piece of code to, as the documented method counts.
 *
 * @param code Minified JavaScript.
 * @returns The compressed size.
 */
const gzipBytes = (code: string): number => gzipSync(code, { level: 9 }).byteLength;

/**
 * Decode a value as a measurement, as `loadBaseline` decodes the file an earlier run wrote.
 */
const decodeSize = Schema.decodeUnknownResult(RuntimeSizeSchema);

/**
 * Read the setting that names the baseline from a configuration.
 *
 * @param setting The configuration's values.
 * @returns The baseline it names.
 */
const baselineFrom = (setting: Readonly<Record<string, string>>) =>
  loadBaseline.pipe(Effect.provide(ConfigProvider.layer(ConfigProvider.fromUnknown(setting))));

/**
 * Write a file under {@link scratch}.
 *
 * @param name The file's name.
 * @param text Its text.
 * @returns The file's absolute path.
 */
const written = (name: string, text: string): string => {
  const file = path.join(scratch, name);

  writeFileSync(file, text);

  return file;
};

beforeAll(() => {
  mkdirSync(scratch, { recursive: true });
});

afterAll(() => {
  rmSync(scratch, { force: true, recursive: true });
});

describe("ledger/runtime-size.ts", () => {
  it("[runtime-size] measures the runtime from src/runtime.dom.ts: the entry, its contract and the 14 controllers, each once, in path order", () => {
    const modules = sourceModules();
    const result = runtimeSize(modules);

    assert.isTrue(Result.isSuccess(result));

    const size = Result.getOrUndefined(result);

    assert.strictEqual(size?.entry, runtimeEntry);
    assert.strictEqual(runtimeEntry, "src/runtime.dom.ts");

    const listed = size?.modules.map((measure) => measure.module) ?? [];

    for (const expected of [
      runtimeEntry,
      "src/runtime/contract.dom.ts",
      ...controllerKinds.map((kind) => `src/interactions/${kind}.dom.ts`),
    ]) {
      assert.strictEqual(listed.filter((module) => module === expected).length, 1, expected);
    }

    assert.deepStrictEqual(listed, valueClosure(modules, [runtimeEntry]).toSorted());

    for (const measure of size?.modules ?? []) {
      assert.isAbove(measure.minified, 0, measure.module);
      assert.isAbove(measure.gzip, 0, measure.module);
      assert.isAbove(measure.brotli, 0, measure.module);
    }

    assert.isAbove(size?.total.minified ?? 0, 0);
    assert.isAbove(size?.total.gzip ?? 0, 0);
    assert.isAbove(size?.total.brotli ?? 0, 0);
  });

  it("[runtime-size] a module reached only through import type is not measured", () => {
    const size = measured(
      new Map([
        ["src/a.ts", 'import type { T } from "#plate/b.ts";\nexport const a: T = "a";\n'],
        ["src/b.ts", 'export type T = string;\nexport const b = "b";\n'],
      ]),
    );

    assert.deepStrictEqual(
      size.modules.map((measure) => measure.module),
      ["src/a.ts"],
    );
  });

  it("[runtime-size] comments, whitespace and type annotations cost nothing", () => {
    const padded = [
      "// a header comment",
      "",
      "",
      "export interface Shape {",
      "  readonly n: number;",
      "}",
      "",
      "/** The count. */",
      "export const n: number = 1; // note",
      "",
      "",
      "",
    ].join("\n");
    const annotated = measuredAlone(padded);
    const plain = measuredAlone("export const n = 1;");

    assert.deepStrictEqual(annotated.modules, plain.modules);
    assert.deepStrictEqual(annotated.total, plain.total);
    assert.isAbove(plain.total.minified, 0);
  });

  it("[runtime-size] the total's minified bytes are the sum of the modules', and one stream compresses no worse than the parts", () => {
    const size = measured(
      new Map([
        ["src/a.ts", tableModule("a", ["#plate/b.ts", "#plate/c.ts"])],
        ["src/b.ts", tableModule("b")],
        ["src/c.ts", tableModule("c")],
      ]),
    );
    const sum = (figure: "brotli" | "gzip" | "minified"): number =>
      size.modules.reduce((total, measure) => total + measure[figure], 0);

    assert.lengthOf(size.modules, 3);
    assert.strictEqual(size.total.minified, sum("minified"));
    assert.isAtMost(size.total.gzip, sum("gzip"));
    assert.isAtMost(size.total.brotli, sum("brotli"));
    assert.isBelow(size.total.gzip, sum("gzip"));
    assert.isBelow(size.total.brotli, sum("brotli"));
  });

  it("[runtime-size] a module's figures are its UTF-8 bytes, gzip at level 9 and brotli at quality 11, and the total's are of one stream joined by a line feed", () => {
    const sources = {
      "src/a.ts": listModule("a", "first", ["#plate/b.ts"]),
      "src/b.ts": listModule("b", "é, which takes two bytes in UTF-8"),
    };
    const size = measured(new Map(Object.entries(sources)));
    const codes = Object.entries(sources).map(([file, source]) => minifiedBy(file, source));

    assert.notStrictEqual(Buffer.byteLength(codes[1] ?? ""), (codes[1] ?? "").length);
    assert.deepStrictEqual(
      size.modules,
      codes.map((code, index) => ({
        brotli: brotliBytes(code),
        gzip: gzipBytes(code),
        minified: Buffer.byteLength(code),
        module: index === 0 ? "src/a.ts" : "src/b.ts",
      })),
    );
    assert.deepStrictEqual(size.total, {
      brotli: brotliBytes(codes.join("\n")),
      gzip: gzipBytes(codes.join("\n")),
      minified: codes.reduce((sum, code) => sum + Buffer.byteLength(code), 0),
    });
  });

  it("[runtime-size] a runtime of one module totals that module's figures", () => {
    const size = measuredAlone(tableModule("a"));

    assert.deepStrictEqual(size.modules, [{ ...size.total, module: "src/a.ts" }]);
  });

  it("[runtime-size] a value import of a bare package is listed, not measured; a type-only one is not listed", () => {
    const listed = measured(
      new Map([["src/a.ts", 'import { Option } from "effect";\nexport const a = Option;\n']]),
    );

    assert.deepStrictEqual(listed.packages, ["effect"]);
    assert.deepStrictEqual(
      listed.modules.map((measure) => measure.module),
      ["src/a.ts"],
    );

    const typeOnly = measured(
      new Map([
        [
          "src/a.ts",
          'import type { Option } from "effect";\nexport const a: Option<string> = undefined;\n',
        ],
      ]),
    );

    assert.deepStrictEqual(typeOnly.packages, []);

    const several = measured(
      new Map([
        [
          "src/a.ts",
          [
            'import { readFileSync } from "node:fs";',
            'import { Option } from "effect";',
            'import type { Shape } from "shapes";',
            'import "#plate/b.ts";',
            "export const a = [Option, readFileSync];",
            "",
          ].join("\n"),
        ],
        [
          "src/b.ts",
          'import { Option } from "effect";\nimport { some } from "effect/Option";\nexport const b = [Option, some];\n',
        ],
      ]),
    );

    assert.deepStrictEqual(several.packages, ["effect", "effect/Option", "node:fs"]);
  });

  it("[runtime-size] a reachable module missing from the map fails RuntimeSizeFailed naming it", () => {
    const failure = failed(
      new Map([["src/a.ts", 'import "#plate/gone.ts";\nexport const a = 1;\n']]),
      "src/a.ts",
    );

    assert.strictEqual(failure._tag, "RuntimeSizeFailed");
    assert.strictEqual(failure.module, "src/gone.ts");
    assert.strictEqual(failure.reason, "missing");
    assert.include(failure.message, "src/gone.ts");

    const noEntry = failed(new Map());

    assert.strictEqual(noEntry.module, runtimeEntry);
    assert.strictEqual(noEntry.reason, "missing");
  });

  it("[runtime-size] a module that does not compile fails RuntimeSizeFailed naming it and what the compiler said", () => {
    const failure = failed(new Map([["src/a.ts", "export const n: = 1;\n"]]), "src/a.ts");

    assert.strictEqual(failure.module, "src/a.ts");
    assert.strictEqual(failure.reason, "transform");
    assert.include(failure.detail, "Unexpected token");
    assert.notInclude(failure.detail, "\u001B");
    assert.include(failure.message, "src/a.ts does not compile as TypeScript");
  });

  it("[runtime-size] a JSON module the runtime imports is measured as the object it becomes", () => {
    const size = measured(
      new Map([
        [
          "src/a.ts",
          'import table from "#plate/table.json" with { type: "json" };\nexport const a = table;\n',
        ],
        ["src/table.json", '{\n  "kinds": [ "choice", "match" ],\n  "count": 2\n}\n'],
      ]),
    );

    assert.deepStrictEqual(
      size.modules.map((measure) => measure.module),
      ["src/a.ts", "src/table.json"],
    );
    assert.isAbove(size.modules[1]?.minified ?? 0, 0);
    assert.deepStrictEqual(size.packages, []);

    const broken = failed(
      new Map([
        [
          "src/a.ts",
          'import table from "#plate/table.json" with { type: "json" };\nexport const a = table;\n',
        ],
        ["src/table.json", "{ not json"],
      ]),
      "src/a.ts",
    );

    assert.strictEqual(broken.module, "src/table.json");
    assert.strictEqual(broken.reason, "transform");
    assert.include(broken.message, "src/table.json is not valid JSON");
  });

  it("[runtime-size] the same sources measure the same twice, and the JSON round-trips", () => {
    const modules = sourceModules();
    const first = measured(modules, runtimeEntry);
    const second = measured(modules, runtimeEntry);

    assert.deepStrictEqual(first, second);

    const text = JSON.stringify(Schema.encodeSync(RuntimeSizeSchema)(first));

    assert.deepStrictEqual(Schema.decodeUnknownSync(RuntimeSizeSchema)(JSON.parse(text)), first);
  });

  it("[runtime-size] the schema refuses a missing field, a negative figure and a fractional one", () => {
    const size = sized(100);

    assert.isTrue(Result.isSuccess(decodeSize(size)));
    assert.isTrue(Result.isFailure(decodeSize({ ...size, entry: undefined })));
    assert.isTrue(Result.isFailure(decodeSize({ ...size, total: { ...size.total, gzip: -1 } })));
    assert.isTrue(Result.isFailure(decodeSize({ ...size, total: { ...size.total, gzip: 1.5 } })));
    assert.isTrue(
      Result.isFailure(decodeSize({ ...size, modules: [{ ...row("src/a.ts", 1), brotli: "1" }] })),
    );
    assert.isTrue(Result.isFailure(decodeSize("not a measurement")));
  });

  it("[runtime-size] flags growth of more than 5,000 B gzip, or of more than 15 percent", () => {
    const bytes = between(40_000, 45_001);

    assert.isTrue(bytes.flagged);
    assert.isTrue(bytes.line.startsWith("Runtime size: JUMP:"));
    assert.include(bytes.line, "45,001 B gzip");
    assert.include(bytes.line, "+5,001 B, +12.5% since work/old/runtime-size.json");

    const percent = between(10_000, 11_600);

    assert.isTrue(percent.flagged);
    assert.isTrue(percent.line.startsWith("Runtime size: JUMP:"));
    assert.include(percent.line, "+1,600 B, +16.0% since work/old/runtime-size.json");
  });

  it("[runtime-size] does not flag growth at or under both lines, or a shrink, and says so", () => {
    const cases = [
      { after: 45_000, before: 40_000, change: "+5,000 B, +12.5%" },
      { after: 11_500, before: 10_000, change: "+1,500 B, +15.0%" },
      { after: 4000, before: 10_000, change: "-6,000 B, -60.0%" },
      { after: 10_000, before: 10_000, change: "+0 B, +0.0%" },
    ] as const;

    for (const { after, before, change } of cases) {
      const jump = between(before, after);

      assert.isFalse(jump.flagged, change);
      assert.isTrue(jump.line.endsWith("no jump."), change);
      assert.include(jump.line, `(${change} since work/old/runtime-size.json)`, change);
      assert.isTrue(jump.line.startsWith(`Runtime size: ${after.toLocaleString("en-US")} B gzip`));
    }
  });

  it("[runtime-size] a flagged line names at most three modules that grew most, largest first, counting a new module whole", () => {
    const before = sized(10_000, [row("src/a.ts", 10_000), row("src/e.ts", 900)]);
    const after = sized(16_000, [
      row("src/a.ts", 12_500),
      row("src/b.ts", 3000),
      row("src/c.ts", 400),
      row("src/d.ts", 50),
      row("src/e.ts", 100),
    ]);
    const jump = sizeJump(given(before), after);

    assert.isTrue(jump.flagged);
    assert.include(
      jump.line,
      "; grew most: src/b.ts +3,000 B, src/a.ts +2,500 B, src/c.ts +400 B.",
    );
    assert.notInclude(jump.line, "src/d.ts");
    assert.notInclude(jump.line, "src/e.ts");
    assert.isTrue(jump.line.endsWith("src/c.ts +400 B."));
  });

  it("[runtime-size] a baseline of zero bytes is flagged by its growth and states no percent", () => {
    const jump = between(0, 100);

    assert.isTrue(jump.flagged);
    assert.include(jump.line, "(+100 B since work/old/runtime-size.json)");
    assert.notInclude(jump.line, "%");
  });

  it("[runtime-size] no baseline, or an unreadable one, is never flagged and says why", () => {
    const current = sized(14_210);
    const none = sizeJump({ kind: "none" }, current);

    assert.isFalse(none.flagged);
    assert.strictEqual(
      none.line,
      "Runtime size: 14,210 B gzip over 1 module; no baseline given, so no comparison.",
    );

    const unreadable = sizeJump(
      { kind: "unreadable", path: "work/gone/runtime-size.json" },
      {
        ...current,
        modules: [row("src/a.ts", 7000), row("src/b.ts", 7210)],
      },
    );

    assert.isFalse(unreadable.flagged);
    assert.strictEqual(
      unreadable.line,
      "Runtime size: 14,210 B gzip over 2 modules; the baseline work/gone/runtime-size.json could not be read, so no comparison.",
    );
  });

  it.effect(
    "[runtime-size] loadBaseline reads PLATE_RUNTIME_SIZE_BASELINE: absent, a missing file, a file an earlier run wrote",
    () =>
      Effect.gen(function* baselines() {
        const size = measuredAlone(tableModule("a"));

        assert.deepStrictEqual(yield* baselineFrom({}), { kind: "none" });
        assert.deepStrictEqual(yield* baselineFrom({ PLATE_RUNTIME_SIZE_BASELINE: "" }), {
          kind: "none",
        });

        const missing = path.join(scratch, "missing", "runtime-size.json");

        assert.deepStrictEqual(yield* baselineFrom({ PLATE_RUNTIME_SIZE_BASELINE: missing }), {
          kind: "unreadable",
          path: missing,
        });

        const file = written(
          "earlier.json",
          JSON.stringify(Schema.encodeSync(RuntimeSizeSchema)(size)),
        );

        assert.deepStrictEqual(yield* baselineFrom({ PLATE_RUNTIME_SIZE_BASELINE: file }), {
          kind: "given",
          path: file,
          size,
        });

        const relative = path.join("work", path.basename(scratch), "earlier.json");

        assert.deepStrictEqual(yield* baselineFrom({ PLATE_RUNTIME_SIZE_BASELINE: relative }), {
          kind: "given",
          path: relative,
          size,
        });
      }),
  );

  it.effect(
    "[runtime-size] loadBaseline reads a file that is not a measurement as unreadable",
    () =>
      Effect.gen(function* undecodable() {
        const cases = [
          written("not-json.json", "this is not JSON"),
          written("wrong-shape.json", JSON.stringify({ entry: "src/a.ts" })),
          written(
            "negative.json",
            JSON.stringify({ ...sized(100), total: { brotli: 1, gzip: -1, minified: 1 } }),
          ),
        ];

        for (const file of cases) {
          assert.deepStrictEqual(yield* baselineFrom({ PLATE_RUNTIME_SIZE_BASELINE: file }), {
            kind: "unreadable",
            path: file,
          });
        }
      }),
  );

  it("[runtime-size] runtimeSizeText lists every module, the total, the packages and the jump's line", () => {
    const size: RuntimeSize = {
      entry: "src/a.ts",
      modules: [
        { brotli: 350, gzip: 400, minified: 1000, module: "src/a.ts" },
        { brotli: 2100, gzip: 2400, minified: 6500, module: "src/b.ts" },
      ],
      packages: [],
      total: { brotli: 2300, gzip: 2700, minified: 7500 },
    };
    const jump = sizeJump({ kind: "none" }, size);

    assert.strictEqual(
      runtimeSizeText(size, jump),
      [
        "module | minified (B) | gzip (B) | brotli (B)",
        "src/a.ts | 1,000 | 400 | 350",
        "src/b.ts | 6,500 | 2,400 | 2,100",
        "total | 7,500 | 2,700 | 2,300",
        "packages: none",
        jump.line,
        "",
      ].join("\n"),
    );

    const withPackages = runtimeSizeText({ ...size, packages: ["effect", "node:fs"] }, jump);

    assert.include(withPackages.split("\n"), "packages: effect, node:fs");
    assert.isTrue(withPackages.endsWith(`${jump.line}\n`));
  });
});

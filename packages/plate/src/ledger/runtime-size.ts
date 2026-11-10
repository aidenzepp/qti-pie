/**
 * The browser runtime's size, measured module by module, and how it changed since an earlier run:
 * the figures the ledger command publishes beside the ledger as `runtime-size.json` and
 * `runtime-size.txt`, and the one line it prints about them (acceptance criterion 11).
 *
 * Size is information, never a gate. Nothing here fails a build or sets an exit code: a size and a
 * jump are only reported, and the one failure, {@link RuntimeSizeFailed}, means a runtime module
 * could not be read or compiled, so there is nothing to measure.
 *
 * The method uses no bundler. {@link runtimeSize} reads the modules `valueClosure` reaches from
 * `src/runtime.dom.ts` through value imports, the walk the browser boundary test also uses, so the
 * measurement and that test agree on what the runtime loads. It turns each module's TypeScript into
 * JavaScript with `transformSync` and minifies the result with `minifySync` (oxc's compiler and
 * minifier, both from `vite/rolldown/utils`, with `compress` and `mangle` on), then counts the
 * minified bytes, the gzip bytes at level 9 and the brotli bytes at quality 11. A module's figures
 * are those three. The runtime's total minified bytes are the sum of the modules'; its total gzip
 * and brotli are of the modules' minified code joined in path order by one line feed and compressed
 * as one stream, so they approximate one bundle. Each module keeps its own import declarations,
 * which a bundler would resolve away. A bare package the runtime loads, such as `effect`, is
 * listed by name and not measured, so a runtime that starts pulling in a library is visible.
 *
 * Earlier phases measured bundles with esbuild, so their numbers do not compare with these: the
 * first run of this command is its own baseline.
 *
 * @module
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { stripVTControlCharacters } from "node:util";
import { brotliCompressSync, constants, gzipSync } from "node:zlib";
import { Config, Effect, Option, Result, Schema } from "effect";
import { minifySync, transformSync } from "vite/rolldown/utils";
import { readImports, resolvePlate, valueClosure } from "#plate/test/imports.ts";

/**
 * The module the measurement starts from: the browser runtime's entry.
 */
export const runtimeEntry = "src/runtime.dom.ts";

/**
 * One module's size.
 */
export interface ModuleSize {
  /**
   * The module's path under the package, such as `src/interactions/match.dom.ts`.
   */
  readonly module: string;

  /**
   * The bytes of its minified JavaScript.
   */
  readonly minified: number;

  /**
   * The bytes of its minified JavaScript compressed with gzip at level 9.
   */
  readonly gzip: number;

  /**
   * The bytes of its minified JavaScript compressed with brotli at quality 11.
   */
  readonly brotli: number;
}

/**
 * The browser runtime's size: each module the entry loads, and the whole.
 */
export interface RuntimeSize {
  /**
   * The module the measurement started from.
   */
  readonly entry: string;

  /**
   * Each module the entry loads through value imports, entry included, once, in path order.
   */
  readonly modules: readonly ModuleSize[];

  /**
   * The sizes of the whole runtime: `minified` is the sum of the modules', and `gzip` and `brotli`
   * are of their minified code joined in path order by one line feed and compressed as one stream.
   */
  readonly total: {
    readonly minified: number;
    readonly gzip: number;
    readonly brotli: number;
  };

  /**
   * The specifiers the runtime loads that are not `#plate/` modules, such as `effect`, sorted and
   * not measured.
   */
  readonly packages: readonly string[];
}

/**
 * A size in bytes: a whole number, never negative.
 */
const Bytes = Schema.Int.check(Schema.isGreaterThanOrEqualTo(0));

/**
 * The Schema of {@link RuntimeSize}, the shape of `runtime-size.json`, which `loadBaseline` reads
 * back as the next run's baseline.
 */
export const RuntimeSizeSchema: Schema.Codec<RuntimeSize> = Schema.Struct({
  entry: Schema.String,
  modules: Schema.Array(
    Schema.Struct({ brotli: Bytes, gzip: Bytes, minified: Bytes, module: Schema.String }),
  ),
  packages: Schema.Array(Schema.String),
  total: Schema.Struct({ brotli: Bytes, gzip: Bytes, minified: Bytes }),
});

/**
 * A runtime module could not be measured: a module the entry loads is not among the sources, or
 * the compiler or the minifier refused it. `reason` says which, and `detail` what the tool said.
 */
// oxlint-disable-next-line unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown.
export class RuntimeSizeFailed extends Schema.TaggedError<RuntimeSizeFailed>()(
  "RuntimeSizeFailed",
  {
    detail: Schema.String,
    module: Schema.String,
    reason: Schema.Literals(["missing", "transform", "minify"]),
  },
) {
  /**
   * The module, what is wrong with it, the tool's own words, and the repair.
   */
  override get message(): string {
    const problem = {
      minify: "could not be minified",
      missing: "is not among the package's sources",
      transform: this.module.endsWith(".json")
        ? "is not valid JSON"
        : "does not compile as TypeScript",
    } as const;
    const repair = {
      minify: "Fix what it reports",
      missing: "Restore the file, or remove the value import that reaches it",
      transform: "Fix the error it reports",
    } as const;

    return [
      `Cannot measure the browser runtime: ${this.module} ${problem[this.reason]}.`,
      this.detail,
      `${repair[this.reason]}, then run the command again.`,
    ].join("\n");
  }
}

/**
 * Write what a compiler or minifier reported as plain text: its message, without the terminal
 * colours it wraps the source frame in.
 *
 * @param problem One error from `transformSync` or `minifySync`.
 * @returns The message, trimmed, with its source frame.
 */
const describeProblem = (problem: { readonly message: string }): string =>
  stripVTControlCharacters(problem.message).trim();

/**
 * Turn one module into minified JavaScript.
 *
 * TypeScript source is compiled with `onlyRemoveTypeImports`, as `verbatimModuleSyntax` has the
 * package's own compiler do, so `import { type A } from "x"` stays a load of `x`, the load that
 * `valueClosure` counts. A JSON module becomes `export default <its text>`, the object a bundler
 * makes of it.
 *
 * @param module The module's path under the package.
 * @param source Its source.
 * @returns The minified JavaScript; {@link RuntimeSizeFailed} when the compiler or the minifier
 *   reports an error.
 */
const minifiedCode = (module: string, source: string): Result.Result<string, RuntimeSizeFailed> => {
  const json = module.endsWith(".json");
  const file = json ? `${module}.js` : module;
  const compiled = transformSync(file, json ? `export default ${source.trim()};` : source, {
    lang: json ? "js" : "ts",
    typescript: { onlyRemoveTypeImports: true },
  });
  const [broken] = compiled.errors;

  if (broken !== undefined) {
    return Result.fail(
      new RuntimeSizeFailed({ detail: describeProblem(broken), module, reason: "transform" }),
    );
  }

  const minified = minifySync(file, compiled.code, { compress: true, mangle: true });
  const [refused] = minified.errors;

  return refused === undefined
    ? Result.succeed(minified.code)
    : Result.fail(
        new RuntimeSizeFailed({ detail: describeProblem(refused), module, reason: "minify" }),
      );
};

/**
 * The three sizes of a module or of the whole runtime.
 */
type Counts = Omit<ModuleSize, "module">;

/**
 * Count a piece of minified JavaScript three ways.
 *
 * @param code The minified JavaScript.
 * @returns Its UTF-8 bytes, and its bytes under gzip at level 9 and brotli at quality 11.
 */
const countBytes = (code: string): Counts => ({
  brotli: brotliCompressSync(code, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).byteLength,
  gzip: gzipSync(code, { level: 9 }).byteLength,
  minified: Buffer.byteLength(code),
});

/**
 * Measure the browser runtime: every module `entry` loads through value imports, each compiled,
 * minified and compressed alone, and the runtime's total.
 *
 * A module reached only through `import type` or `export type` is not measured. A value import of
 * anything but a `#plate/` module is listed under `packages` and not measured. A module reached
 * as a JSON file is measured as the object it becomes.
 *
 * @param modules The modules' sources, by path under the package (`src/<x>`), as `sourceModules`
 *   reads them.
 * @param entry The module to start from, {@link runtimeEntry} by default.
 * @returns The measurement; {@link RuntimeSizeFailed} naming the first module in path order that is
 *   not among `modules`, or that the compiler or the minifier refuses.
 */
export const runtimeSize = (
  modules: ReadonlyMap<string, string>,
  entry: string = runtimeEntry,
): Result.Result<RuntimeSize, RuntimeSizeFailed> => {
  const measures: ModuleSize[] = [];
  const codes: string[] = [];
  const packages = new Set<string>();

  for (const module of valueClosure(modules, [entry]).toSorted()) {
    const source = modules.get(module);

    if (source === undefined) {
      return Result.fail(
        new RuntimeSizeFailed({
          detail:
            module === entry
              ? "It is the entry the measurement starts from."
              : `It is reached from ${entry} through value imports.`,
          module,
          reason: "missing",
        }),
      );
    }

    const code = minifiedCode(module, source);

    if (Result.isFailure(code)) {
      return Result.fail(code.failure);
    }

    codes.push(code.success);
    measures.push({ module, ...countBytes(code.success) });

    for (const declaration of readImports(source).imports) {
      if (!declaration.typeOnly && resolvePlate(declaration.specifier) === undefined) {
        packages.add(declaration.specifier);
      }
    }
  }

  const whole = countBytes(codes.join("\n"));

  return Result.succeed({
    entry,
    modules: measures,
    packages: [...packages].toSorted(),
    total: {
      brotli: whole.brotli,
      gzip: whole.gzip,
      minified: measures.reduce((sum, measure) => sum + measure.minified, 0),
    },
  });
};

/**
 * The earlier measurement the new one is compared with, or why there is none.
 */
export type Baseline =
  | {
      /**
       * `PLATE_RUNTIME_SIZE_BASELINE` is not set.
       */
      readonly kind: "none";
    }
  | {
      /**
       * The file `PLATE_RUNTIME_SIZE_BASELINE` names could not be read, or does not hold a
       * measurement.
       */
      readonly kind: "unreadable";
      readonly path: string;
    }
  | {
      /**
       * The measurement an earlier run wrote to the file `PLATE_RUNTIME_SIZE_BASELINE` names.
       */
      readonly kind: "given";
      readonly path: string;
      readonly size: RuntimeSize;
    };

/**
 * The package directory, `packages/plate`, which a relative `PLATE_RUNTIME_SIZE_BASELINE` is read
 * from, wherever the process was started.
 */
const packageDirectory = path.resolve(import.meta.dirname, "..", "..");

/**
 * Decode the text of a `runtime-size.json`.
 */
const decodeBaselineFile = Schema.decodeUnknownEffect(Schema.fromJsonString(RuntimeSizeSchema));

/**
 * Read the baseline: the `runtime-size.json` an earlier run wrote, which
 * `PLATE_RUNTIME_SIZE_BASELINE` names by a path, read from the package directory when relative. The
 * setting absent or empty means there is no baseline. A file that is missing, cannot be read or
 * does not hold a measurement is `unreadable`, never a failure, because size is information and a
 * stale path must not stop the ledger.
 */
export const loadBaseline: Effect.Effect<Baseline, Config.ConfigError> = Effect.gen(
  function* loadBaselineSetting() {
    const setting = yield* Config.option(Config.NonEmptyString("PLATE_RUNTIME_SIZE_BASELINE"));

    if (Option.isNone(setting)) {
      return { kind: "none" } as const;
    }

    const named = setting.value;

    return yield* Effect.tryPromise(() =>
      readFile(path.resolve(packageDirectory, named), "utf-8"),
    ).pipe(
      Effect.flatMap(decodeBaselineFile),
      Effect.match({
        onFailure: (): Baseline => ({ kind: "unreadable", path: named }),
        onSuccess: (size): Baseline => ({ kind: "given", path: named, size }),
      }),
    );
  },
).pipe(Effect.withSpan("loadBaseline"));

/**
 * How the runtime's size compares with the baseline, in one line, and whether that is a jump.
 */
export interface SizeJump {
  /**
   * Whether the total gzip size grew by more than {@link jumpBytes} bytes or more than
   * {@link jumpPercent} percent since the baseline. A shrink, no baseline and an unreadable one
   * are never a jump.
   */
  readonly flagged: boolean;

  /**
   * The plain line the ledger command prints, starting `Runtime size:`; a jump's reads `JUMP:` and
   * names the modules that grew most.
   */
  readonly line: string;
}

/**
 * The growth of the total gzip size, in bytes, beyond which a size is a jump.
 */
const jumpBytes = 5000;

/**
 * The growth of the total gzip size, in percent of the baseline's, beyond which a size is a jump.
 */
const jumpPercent = 15;

/**
 * How many modules a jump's line names.
 */
const namedModules = 3;

/**
 * Writes whole numbers with a comma between thousands, whatever the host's locale.
 */
const numbers = new Intl.NumberFormat("en-US");

/**
 * Writes a percentage with one decimal place and a comma between thousands, whatever the host's
 * locale.
 */
const percentages = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
  minimumFractionDigits: 1,
});

/**
 * Write a count of bytes with its thousands grouped.
 *
 * @param bytes The count.
 * @returns It as `14,210`.
 */
const grouped = (bytes: number): string => numbers.format(bytes);

/**
 * Write a change with its sign.
 *
 * @param change The change.
 * @param text The change's magnitude, as text.
 * @returns `+` or `-` before the text; zero counts as `+`.
 */
const signed = (change: number, text: string): string => `${change < 0 ? "-" : "+"}${text}`;

/**
 * Write how many modules, in the singular for one.
 *
 * @param count The count.
 * @returns It as `1 module` or `18 modules`.
 */
const modulesOf = (count: number): string => `${grouped(count)} module${count === 1 ? "" : "s"}`;

/**
 * Find the modules whose gzip size grew most since the baseline.
 *
 * @param before The baseline's measurement.
 * @param after The current measurement.
 * @returns At most {@link namedModules} modules that grew, largest growth first and path order
 *   among equals, each with its growth; a module new since the baseline counts its whole size.
 */
const grewMost = (before: RuntimeSize, after: RuntimeSize): readonly string[] => {
  const earlier = new Map(before.modules.map((measure) => [measure.module, measure.gzip]));

  return after.modules
    .map((measure) => ({
      growth: measure.gzip - (earlier.get(measure.module) ?? 0),
      module: measure.module,
    }))
    .filter(({ growth }) => growth > 0)
    .toSorted((left, right) => right.growth - left.growth)
    .slice(0, namedModules)
    .map(({ growth, module }) => `${module} +${grouped(growth)} B`);
};

/**
 * Compare the runtime's size with the baseline and say so in plain terms.
 *
 * A jump is growth of the total gzip size by more than 5,000 bytes, or by more than 15 percent,
 * since the baseline; the comparison is of whole bytes, so growth of exactly 5,000 bytes or 15
 * percent is not one. Size is information: the result is a line to read, never a verdict that
 * stops anything.
 *
 * @param baseline What the new measurement is compared with.
 * @param current The new measurement.
 * @returns Whether it is a jump, and the line that says what was compared and what changed.
 */
export const sizeJump = (baseline: Baseline, current: RuntimeSize): SizeJump => {
  const total = `${grouped(current.total.gzip)} B gzip over ${modulesOf(current.modules.length)}`;

  if (baseline.kind === "none") {
    return { flagged: false, line: `Runtime size: ${total}; no baseline given, so no comparison.` };
  }

  if (baseline.kind === "unreadable") {
    return {
      flagged: false,
      line: `Runtime size: ${total}; the baseline ${baseline.path} could not be read, so no comparison.`,
    };
  }

  const before = baseline.size.total.gzip;
  const growth = current.total.gzip - before;
  const flagged = growth > jumpBytes || growth * 100 > before * jumpPercent;
  const percent =
    before === 0
      ? ""
      : `, ${signed(growth, `${percentages.format((Math.abs(growth) * 100) / before)}%`)}`;
  const change = `${signed(growth, `${grouped(Math.abs(growth))} B`)}${percent} since ${baseline.path}`;

  if (!flagged) {
    return { flagged, line: `Runtime size: ${total} (${change}); no jump.` };
  }

  const grew = grewMost(baseline.size, current);

  return {
    flagged,
    line: `Runtime size: JUMP: ${total} (${change})${grew.length === 0 ? "" : `; grew most: ${grew.join(", ")}`}.`,
  };
};

/**
 * Write one row of the size table.
 *
 * @param name The row's first cell.
 * @param figures The row's three sizes.
 * @returns The row, its cells separated by ` | `.
 */
const tableRow = (name: string, figures: Counts): string =>
  [name, grouped(figures.minified), grouped(figures.gzip), grouped(figures.brotli)].join(" | ");

/**
 * Write the size table, the text of `runtime-size.txt`: one row for each module with its minified,
 * gzip and brotli bytes, the total row, the packages the runtime loads, and the jump's line.
 *
 * @param size The measurement.
 * @param jump How it compares with the baseline.
 * @returns The lines, each ending in a line feed; `packages: none` when the runtime loads none.
 */
export const runtimeSizeText = (size: RuntimeSize, jump: SizeJump): string =>
  [
    "module | minified (B) | gzip (B) | brotli (B)",
    ...size.modules.map((measure) => tableRow(measure.module, measure)),
    tableRow("total", size.total),
    `packages: ${size.packages.length === 0 ? "none" : size.packages.join(", ")}`,
    jump.line,
  ]
    .map((line) => `${line}\n`)
    .join("");

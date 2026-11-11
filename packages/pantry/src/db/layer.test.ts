/**
 * `AuthorAppLayer` with no database: built from the committed served file and released at once,
 * and no production module imports a migration artifact as a module.
 *
 * The layer reads the author login's served file from disk (`#pantry/db/served.ts` resolves
 * `#migrations/qti/served/author_app.json` with `import.meta.resolve`, and `#pantry/db/layer.ts`
 * reads it with `readFileString`), so evaluating a production module parses none of its megabytes
 * and no bundle carries it. grizzle's `DbLayer.make` loads the file's workloads and compiles
 * nothing, and its pool opens no session until a `Db` asks for one. Test support may import the
 * snapshot as a module: a probe's compile reads it (`#pantry/test/served-members.ts`), and only a
 * test evaluates it.
 *
 * Oracle: grizzle's `served` and `DbLayer.make`, which refuse a file of another login at stage
 * `config`, beside `ServedLoadError` for a file that cannot be read or is no JSON; and a search of
 * every production module of `src` (no test, no test support under `src/test/`) for a static,
 * type-only or dynamic import, or a re-export, of a `#migrations/` specifier.
 * `import.meta.resolve` only names a path, and is no import.
 */
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it, layer } from "@effect/vitest";
import { Cause, ConfigProvider, Effect, Exit, FileSystem } from "effect";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";

/**
 * The package's `src` folder.
 */
const sourceRoot = path.resolve(import.meta.dirname, "..");

/**
 * The CA the layer is given. grizzle reads it as PEM text when the layer is built and hands it to
 * TLS only when a session connects, which no session here does.
 */
const unusedCa = "an unused CA: this layer is built and released without connecting\n";

/**
 * Find the migration artifacts a module's text imports: each `#migrations/` specifier of an
 * `import … from`, an `export … from`, a bare `import`, an `import(…)` call or an `import(…)` type.
 *
 * @param text - The module's text.
 * @returns The specifiers, in order.
 */
const migrationImports = (text: string): readonly string[] =>
  [
    ...text.matchAll(
      /\b(?:from\s*|import\s*\(\s*|^[ \t]*import\s+)["'](?<specifier>#migrations\/[^"']+)["']/gmu,
    ),
  ].map(({ groups }) => groups?.["specifier"] ?? "");

/**
 * Test whether a module of `src` is on the production path: neither a test nor test support.
 *
 * @param file - The module's path relative to `src`.
 * @returns Whether a production module may evaluate it.
 */
const isProduction = (file: string): boolean =>
  !file.endsWith(".test.ts") && !file.startsWith(`test${path.sep}`);

layer(NodeServices.layer)("db/layer.ts, built from the committed served file", (test) => {
  test.effect("builds the author login's layer with no database, compiling nothing", () =>
    // Oracle: grizzle itself, `served` and `DbLayer.make`, which refuse a file of another login
    // with `OpenError` at stage `config`, and the layer's own `ServedLoadError` for a file it
    // cannot read or decode, such as a git-lfs pointer.
    // Bound: the one login and its committed served file; residual none.
    Effect.gen(function* layerBuilds() {
      const fs = yield* FileSystem.FileSystem;
      // A folder of this run's own, so a concurrent run of the suite never rewrites the CA this one
      // reads.
      const scratch = yield* scratchDirectory("layer-served-");
      const home = `${scratch}/home`;
      const state = `${scratch}/state`;
      yield* fs.makeDirectory(`${state}/tls`, { recursive: true });
      yield* fs.makeDirectory(home, { recursive: true });
      yield* fs.writeFileString(`${state}/tls/ca.crt`, unusedCa);

      const exit = yield* Effect.provide(Effect.void, AuthorAppLayer).pipe(
        Effect.provide(
          ConfigProvider.layer(
            ConfigProvider.fromUnknown({
              GR8DES_PG_PORT: "1",
              GRIZZLE_PG_STATE: state,
              HOME: home,
            }),
          ),
        ),
        Effect.exit,
      );

      assert.isTrue(Exit.isSuccess(exit), Exit.isFailure(exit) ? Cause.pretty(exit.cause) : "");
    }).pipe(Effect.scoped),
  );
});

describe("db/layer.ts, read from disk", () => {
  it("imports no migration artifact as a module anywhere on the production path", () => {
    const imported = readdirSync(sourceRoot, { recursive: true, withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith(".ts"))
      .map((entry) => path.relative(sourceRoot, path.join(entry.parentPath, entry.name)))
      .filter(isProduction)
      .flatMap((file) =>
        migrationImports(readFileSync(path.join(sourceRoot, file), "utf-8")).map(
          (specifier) => `${file}: ${specifier}`,
        ),
      );

    assert.deepStrictEqual(imported, []);
  });

  it("finds a planted import of a migration artifact in each form on the production path, and none in test support", () => {
    // Oracle: the rule above, on the named cases. Wild: a static import of the served file, a
    // dynamic import of the snapshot inside a layer's effect, a type-only import and a re-export.
    // Live: the served file's path as `#pantry/db/served.ts` resolves it, which reads no module.
    assert.deepStrictEqual(
      migrationImports(
        [
          'import file from "#migrations/qti/served/author_app.json" with { type: "json" };',
          'const read = Effect.promise(() => import("#migrations/qti/snapshot.json"));',
          'import type { Snapshot } from "#migrations/qti/types.ts";',
          'export { fingerprint } from "#migrations/qti/fingerprint.ts";',
          'const at = fileURLToPath(import.meta.resolve("#migrations/qti/served/author_app.json"));',
        ].join("\n"),
      ),
      [
        "#migrations/qti/served/author_app.json",
        "#migrations/qti/snapshot.json",
        "#migrations/qti/types.ts",
        "#migrations/qti/fingerprint.ts",
      ],
    );
    // A planted read on the production path counts, and the same read in a test or in test support
    // does not.
    assert.deepStrictEqual(
      [
        path.join("db", "layer.ts"),
        path.join("import", "package.ts"),
        path.join("db", "layer.test.ts"),
        path.join("test", "served-members.ts"),
      ].map(isProduction),
      [true, true, false, false],
    );
  });
});

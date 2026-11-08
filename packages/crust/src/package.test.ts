import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem, Schema } from "effect";

/**
 * The parts of crust's manifest the dependency rules read: its runtime dependencies, and its
 * development ones, which nothing that depends on crust installs.
 */
const PackageJson = Schema.fromJsonString(
  Schema.Struct({
    dependencies: Schema.Record(Schema.String, Schema.String),
    devDependencies: Schema.Record(Schema.String, Schema.String),
  }),
);

/**
 * The one testing library crust's tests draw their cases from, vendored as pantry's is, and the
 * specifier both packages name it by (the orchestrator's ruling of 2026-11-05: a devDependency
 * only, so crust's runtime dependencies stay `effect` and `saxes`).
 */
const testingLibrary = {
  name: "@grizzle/testing",
  specifier: "file:../../vendor/grizzle-testing-0.0.0.tgz",
} as const;

/**
 * An import of the testing library in a module's text: a static or dynamic import, or an export,
 * whose specifier is the library or one of its subpaths.
 */
const importsTestingLibrary = /(?:from|import\s*\(?)\s*["']@grizzle\/testing(?:\/[^"']*)?["']/u;

/**
 * Whether a file under `src/` is a runtime module: TypeScript that is neither a test nor test
 * support under `src/test/`.
 *
 * @param file - The file's path relative to `src/`.
 * @returns Whether code that depends on crust may load it.
 */
const isRuntimeModule = (file: string): boolean =>
  file.endsWith(".ts") && !file.endsWith(".test.ts") && !file.startsWith("test/");

layer(NodeServices.layer, { excludeTestServices: true })("crust package manifest", (it) => {
  it.effect("production dependencies are exactly effect and saxes", () =>
    Effect.gen(function* dependenciesArePinned() {
      const fileSystem = yield* FileSystem.FileSystem;
      const text = yield* fileSystem.readFileString(`${import.meta.dirname}/../package.json`);
      const manifest = yield* Schema.decodeUnknownEffect(PackageJson)(text);

      assert.deepEqual(Object.keys(manifest.dependencies).toSorted(), ["effect", "saxes"]);
    }),
  );

  it.effect(
    "names the testing library as a devDependency only, by pantry's specifier, and no runtime module imports it",
    () =>
      // Oracle: the manifest and the source tree as written. A runtime module that imported the
      // library would load it in every package that depends on crust, which devDependencies do
      // not install there.
      Effect.gen(function* testingIsDevelopmentOnly() {
        const fileSystem = yield* FileSystem.FileSystem;
        const root = `${import.meta.dirname}/..`;
        const manifest = yield* Schema.decodeUnknownEffect(PackageJson)(
          yield* fileSystem.readFileString(`${root}/package.json`),
        );
        const pantry = yield* Schema.decodeUnknownEffect(PackageJson)(
          yield* fileSystem.readFileString(`${root}/../pantry/package.json`),
        );

        assert.strictEqual(manifest.devDependencies[testingLibrary.name], testingLibrary.specifier);
        assert.strictEqual(pantry.devDependencies[testingLibrary.name], testingLibrary.specifier);
        assert.isFalse(Object.hasOwn(manifest.dependencies, testingLibrary.name));

        const files = yield* fileSystem.readDirectory(`${root}/src`, { recursive: true });
        const runtime = files.filter(isRuntimeModule);
        const importing: string[] = [];
        for (const file of runtime) {
          if (importsTestingLibrary.test(yield* fileSystem.readFileString(`${root}/src/${file}`))) {
            importing.push(file);
          }
        }

        // The pattern finds the library where test support imports it, so its silence on the
        // runtime modules is a finding, not a pattern that matches nothing.
        assert.include(files, "test/trees.ts");
        assert.isTrue(
          importsTestingLibrary.test(yield* fileSystem.readFileString(`${root}/src/test/trees.ts`)),
        );
        assert.isAbove(runtime.length, 0);
        assert.deepStrictEqual(importing, []);
      }),
  );
});

import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { ConfigProvider, Effect, FileSystem } from "effect";
import { hash12, materialize, specOf } from "#qti/test/fixtures.ts";

/**
 * The directory every test root is made under: the package's gitignored `work/`.
 */
const workDirectory = path.resolve(import.meta.dirname, "../../work");

/**
 * Run `use` against a fresh, empty fixtures root that exists only for the call.
 *
 * The root is a new directory under `work/`, handed to the materializer through
 * `ConfigProvider.fromUnknown` over the host environment (so `HOME`, which locates the
 * default tarball, still resolves), and removed when the call ends, whether it passed or
 * failed. Every test owns its root, so one test's truncated file or half-run race can never
 * be what another test reads.
 *
 * @param use - The test body; receives the root it must expect everything under.
 * @param settings - Further `Config` values for the call, such as `GR8DES_QTI_EXAMPLES`.
 * @returns The effect that creates the root, runs `use` and removes the root.
 */
const inFreshRoot = <A, E, R>(
  use: (root: string) => Effect.Effect<A, E, R>,
  settings: Record<string, string> = {},
) =>
  Effect.gen(function* useFreshRoot() {
    const fs = yield* FileSystem.FileSystem;

    yield* fs.makeDirectory(workDirectory, { recursive: true });

    const root = yield* fs.makeTempDirectoryScoped({
      directory: workDirectory,
      prefix: "fixtures-test-",
    });
    const config = ConfigProvider.layerAdd(
      ConfigProvider.fromUnknown({ ...settings, GR8DES_QTI_FIXTURES: root }),
      { asPrimary: true },
    );

    return yield* use(root).pipe(Effect.provide(config));
  }).pipe(Effect.scoped);

layer(NodeServices.layer, { excludeTestServices: true })(
  "test/fixtures.ts content fixtures",
  (it) => {
    it.effect(
      "sharedMedia materializes the four files of the shared-media package and nothing else",
      () =>
        inFreshRoot((root) =>
          Effect.gen(function* sharedMediaPackage() {
            const fs = yield* FileSystem.FileSystem;
            const dir = yield* materialize("sharedMedia");
            const entries = yield* fs.readDirectory(dir, { recursive: true });
            const files: string[] = [];

            for (const entry of entries) {
              if ((yield* fs.stat(`${dir}/${entry}`)).type === "File") {
                files.push(entry);
              }
            }

            assert.strictEqual(dir, `${root}/sharedMedia-${hash12(specOf("sharedMedia"))}`);
            assert.deepStrictEqual(files.toSorted(), [
              "example/graphic_order.xml",
              "example/hotspot.xml",
              "example/ukair.png",
              "imsmanifest.xml",
            ]);
            assert.deepStrictEqual(specOf("sharedMedia").edits, []);
          }),
        ),
    );
  },
);

import path from "node:path";
import { NodeChildProcessSpawner, NodeServices } from "@effect/platform-node";
import { assert, describe, it, layer } from "@effect/vitest";
import { Effect, FileSystem, Layer, Option } from "effect";
import { Digest } from "effect/crypto";
import { settings } from "#pantry/test/settings.ts";
import { vpFmt } from "#pantry/test/vp-fmt.ts";
import { loadModels, renderModels } from "#pantry/vocab/derive/models.ts";
import { checkCache } from "#pantry/vocab/derive/sources.ts";
import type { XsdSourceMissing } from "#pantry/vocab/derive/sources.ts";

/**
 * The package folder, `packages/pantry`, which the committed leaf and `vp fmt` are relative to.
 */
const packageRoot = path.resolve(import.meta.dirname, "../../..");

/**
 * The committed leaf this suite regenerates.
 */
const leafPath = "src/vocab/inventory/models.ts";

/**
 * Why the cache-gated suite cannot run here: the cache's missing files, or `None` when every pinned
 * XSD is present.
 */
const absence = await Effect.runPromise(
  checkCache().pipe(
    Effect.as(Option.none<XsdSourceMissing>()),
    Effect.catchTag("XsdSourceMissing", (missing) => Effect.succeed(Option.some(missing))),
    Effect.provide(NodeServices.layer),
  ),
);

/**
 * The timeout, in milliseconds, of the regeneration, which reads both versions' schemas, derives
 * their models and formats the leaf through `vp fmt`: a hang guard.
 */
const regenerateTimeoutMs = 900_000;

/**
 * The layers the regeneration runs on: the file system, the digest the source reads check, and the
 * process spawner `vp fmt` runs through.
 */
const SuiteLayer = Layer.mergeAll(
  NodeServices.layer,
  Digest.layerWebCrypto,
  NodeChildProcessSpawner.layer.pipe(Layer.provide(NodeServices.layer)),
);

if (Option.isSome(absence)) {
  it("derives the content-model IR from the pinned XSDs", (context) => {
    context.skip(`the XSD cache is incomplete: ${absence.value.message}`);
  });
}

// A committed-leaf guard, as the served and verdict files are: it runs at merge time, under
// GR8DES_CORPUS=1, beside the corpus witness, and out of the default run.
describe.skipIf(Option.isSome(absence) || !settings.corpusRequested)(
  "vocab/derive/models.ts over the pinned XSDs",
  () => {
    layer(SuiteLayer, { timeout: regenerateTimeoutMs })("from the cache", (cached) => {
      cached.effect(
        `regenerates ${leafPath} byte for byte after vp fmt`,
        () =>
          Effect.gen(function* regenerate() {
            const fs = yield* FileSystem.FileSystem;
            const derived = yield* vpFmt(renderModels(yield* loadModels()), leafPath);

            assert.strictEqual(derived, yield* fs.readFileString(`${packageRoot}/${leafPath}`));
          }),
        regenerateTimeoutMs,
      );
    });
  },
);

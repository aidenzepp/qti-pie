/**
 * The author login compiled as every startup compiles it, with no database: `AuthorAppLayer` built
 * and released at once over the committed snapshot. Building a `DbLayer` compiles every program of
 * the login's workloads for every role it runs on, the compilation `grizzle generate` runs
 * (grizzle's README, "Deploying"), and its pool opens no session until a `Db` asks for one. The
 * import's write program is one of those programs (`importWork`), and its compilation runs
 * grizzle's write filler over every family of the schema, so a value the filler cannot fill
 * anywhere in `Qti` fails here, in the free suite, before any database or corpus run (R87).
 */
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Cause, ConfigProvider, Effect, Exit, FileSystem } from "effect";
import { AuthorAppLayer } from "#pantry/db/layer.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";

/**
 * The CA the layer is given. grizzle reads it as PEM text when the layer is built and hands it to
 * TLS only when a session connects, which no session here does.
 */
const unusedCa = "an unused CA: this layer is built and released without connecting\n";

/**
 * How long building the layer may take: the schema's artifacts are computed twice, for the base and
 * for the author role, about 50 s each under load (measured 2026-11-06). Measured 2026-11-07:
 * 205.8 s at a load average of 75, under V8 coverage, and 82.6 s at 63 to 73 without it.
 */
const buildTimeoutMs = 900_000;

layer(NodeServices.layer)("qti/logins.ts, compiled as the layer compiles it", (it) => {
  it.effect(
    "builds the author login's layer, compiling every workload program, the import's write program among them, for the author role",
    () =>
      // Oracle: grizzle itself, `DbLayer.make`'s startup compilation, which refuses a program that
      // does not compile with `OpenError` and its `CompileError`, and compares nothing with the
      // snapshot (grizzle `cda0ac8b`).
      // Bound: the one login, its one role and its four programs; residual none.
      Effect.gen(function* layerBuilds() {
        const fs = yield* FileSystem.FileSystem;
        // A folder of this run's own, so a concurrent run of the suite never rewrites the CA this
        // one reads.
        const scratch = yield* scratchDirectory("logins-compile-");
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
    { timeout: buildTimeoutMs },
  );
});

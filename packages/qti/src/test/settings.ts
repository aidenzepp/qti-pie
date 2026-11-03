import { Config, Effect, Option } from "effect";

/**
 * The named lease database, when one is held; `Option.none()` otherwise.
 */
export const leaseDatabase = Config.option(Config.String("GR8DES_PG_DATABASE"));

/**
 * Whether `GR8DES_CORPUS=1` asks for the 1EdTech corpus tests.
 */
export const corpusRequested = Config.String("GR8DES_CORPUS").pipe(
  Config.withDefault(""),
  Config.map((value) => value === "1"),
);

/**
 * Both settings, resolved once at load through the default provider.
 */
export const settings = Effect.runSync(Config.all({ corpusRequested, leaseDatabase }));

/**
 * Whether this run holds a lease, so the database suites may run.
 */
export const hasLease = Option.isSome(settings.leaseDatabase);

/**
 * The timeout, in milliseconds, for each test of a lease suite that writes.
 *
 * The first law-checked write of a pool pays the backend's first call of the
 * schema's law functions, measured at 5.4 to 5.7 s with 85 armed handles (the
 * `repair1-21` row of `docs/grizzle-findings.md`), past vitest's 5 s default.
 * Raise it only on a measurement recorded in that row, never to make a run
 * pass. A lease suite that only reads keeps vitest's default.
 */
export const leaseTestTimeoutMs = 60_000;

/**
 * The timeout, in milliseconds, for the `layer` hook that builds `AuthorAppLayer`.
 *
 * The hook decodes the 120 MB migrations snapshot and compiles the login, and with no
 * `timeout` option it falls to vitest's 10 s `hookTimeout`, which the parallel leased full suite
 * exceeded under load averages of 8 to 15 on 14 CPUs (merges `8b3f2a65`, `1a3d4f4c`, `998fe309`
 * and `655ddd9f`). Measured on 2026-11-02 at `0f151af` with the snapshot at 120,065,687 bytes
 * and no database: five quiet builds had a median of 7.35 s, and six concurrent builds, one per
 * test file that builds the layer, had a maximum of 9.29 s at load averages of 4 to 6, each
 * process peaking near 1.5 GB resident. The budget is the larger of twice that maximum
 * (18.6 s) and 20 s, the floor being twice the default.
 * Raise it only on a new measurement recorded here, never to make a run pass.
 */
export const authorLayerHookTimeoutMs = 20_000;

/**
 * The timeout, in milliseconds, for the `layer` hook that builds `AuthorAppLayer` beside a
 * `FixtureRowsLayer`.
 *
 * The hook builds `AuthorAppLayer` and a `FixtureRowsLayer` that reads 11 fixtures through
 * `rowsOfPackage` (`rules.packaging.test.ts`) or its own fixture set (`content-a.test.ts`), and
 * with no `timeout` option it fell to vitest's 10 s `hookTimeout`, which both files exceeded: the
 * first alone on a lease, the second under the leased full suite. Measured on 2026-11-03 at
 * `68964ce` on a lease: five quiet runs per file had a median of 9.43 s for
 * `rules.packaging.test.ts` and 9.26 s for `content-a.test.ts`, and six concurrent runs per file
 * had a maximum of 10.50 s (`content-a.test.ts`; 10.28 s for the other) at load averages of 9 to 11.
 * The budget is the larger of twice that maximum (21 s) and 20 s, the floor being twice the
 * default. Raise it only on a new measurement recorded here, never to make a run pass.
 */
export const fixtureRowsLayerHookTimeoutMs = 21_000;

/**
 * The timeout, in milliseconds, for one test that spawns the CLI as a child process.
 *
 * Such a test pays Node's start and the module graph of `cli.ts`, not the snapshot, and vitest's
 * 5 s default was exceeded by the parallel leased full suite under load averages of 8 to 15 on 14
 * CPUs (merges `8b3f2a65`, `1a3d4f4c`, `998fe309` and `655ddd9f`). Measured on 2026-11-02 at
 * `0f151af`: fifteen quiet spawns had a median of 3.8 s, and spawns beside six concurrent
 * layer builds had a maximum of 4.5 s at load averages of 4 to 6. The budget is the larger of
 * twice that maximum (9 s) and 10 s, the floor being twice the default.
 * A test file whose handlers load the engine loads it first in a `beforeAll` under
 * `engineLoadHookTimeoutMs`, so no test pays that load.
 * Raise it only on a new measurement recorded here, never to make a run pass.
 */
export const cliProcessTestTimeoutMs = 10_000;

/**
 * The timeout, in milliseconds, for the hook that loads the engine once per CLI test file.
 *
 * Since `p14-u2a` the command handlers import the engine (`#qti/db/layer.ts` and the import and
 * export modules) when they run, about 5.3 s alone, and vitest's 10 s `hookTimeout` is not enough
 * beside the parallel CLI set: 13 concurrent loads took 15.5 to 15.8 s at load averages of 9 to 26.
 * Measured on 2026-11-03 at `fd586ee`, from `packages/qti`: thirteen concurrent runs (vitest's
 * default worker count on 14 CPUs, `availableParallelism() - 1`) of one process that imports the
 * six modules `preloadEngine` imports took 12412, 12548, 12579, 12583, 12583, 12606, 12607, 12619,
 * 12559, 12673, 12703, 12741 and 12644 ms, a maximum of 12741 ms, at a one-minute load average of
 * 27.9 before and 30.4 after. The budget is the larger of twice that maximum (25.5 s) and 20 s,
 * rounded up to the next second.
 * Raise it only on a new measurement recorded here, never to make a run pass.
 */
export const engineLoadHookTimeoutMs = 26_000;

/**
 * The timeout, in milliseconds, for the one test that materializes the 19 `cut-*` fixtures and
 * renders each to the oracle's bytes.
 *
 * `global-setup.ts` materializes only `simple` and four packages, so this test cuts and writes
 * the 19 items itself, and vitest's 5 s default was exceeded under load (a fresh tree timed out at
 * 5033 ms at a load average of 20.6; that figure is censored by the timeout, so the true time was
 * longer). Measured on 2026-11-02 at `8a2decc`, with no `cut-*` directory in the fixtures root:
 * three cold runs alone took 2902, 2821 and 2699 ms at load averages of 8.75, 8.37 and 8.53, and
 * six concurrent cold runs, each with its own fixtures root, took 3265, 3279, 3289, 3289, 3343 and
 * 3249 ms at a load average of 8.1. The budget is the larger of twice the maximum (3343 ms, so
 * 6.7 s) and 10 s, the floor being twice the default, rounded up to the next second.
 * Raise it only on a new measurement recorded here, never to make a run pass.
 */
export const cutItemRenderTestTimeoutMs = 10_000;

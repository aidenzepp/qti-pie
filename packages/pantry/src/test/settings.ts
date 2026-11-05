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
 * The longest lease test on trunk a1d5af1 is the export round trip, at 24,095 ms
 * (gt-w3, 2026-11-04: 21,385, 22,160 and 24,095 ms in three runs of the lease
 * files, load 6.5 to 132). The value is twice that, rounded up to the next 1,000,
 * the rule `authorLayerHookTimeoutMs` uses. Raise it only on a new measurement
 * recorded here, never to make a run pass. A lease suite that only reads keeps
 * vitest's default.
 */
export const leaseTestTimeoutMs = 49_000;

/**
 * The timeout, in milliseconds, for the `layer` hook that builds `AuthorAppLayer`.
 *
 * The hook decodes the 120 MB migrations snapshot and compiles the login, and with no
 * `timeout` option it falls to vitest's 10 s `hookTimeout`, which the parallel leased full suite
 * exceeded under load averages of 8 to 15 on 14 CPUs (merges `8b3f2a65`, `1a3d4f4c`, `998fe309`
 * and `655ddd9f`). Measured on 2026-11-02 at `ae520e6` with the snapshot at 120,065,687 bytes
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
 * `922fe9b` on a lease: five quiet runs per file had a median of 9.43 s for
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
 * `ae520e6`: fifteen quiet spawns had a median of 3.8 s, and spawns beside six concurrent
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
 * Since `p14-u2a` the command handlers import the engine (`#pantry/db/layer.ts` and the import and
 * export modules) when they run, about 5.3 s alone, and vitest's 10 s `hookTimeout` is not enough
 * beside the parallel CLI set: 13 concurrent loads took 15.5 to 15.8 s at load averages of 9 to 26.
 * Measured on 2026-11-03 at `fd586ee`, from `packages/pantry`: thirteen concurrent runs (vitest's
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
 * longer). Measured on 2026-11-02 at `d2ee380`, with no `cut-*` directory in the fixtures root:
 * three cold runs alone took 2902, 2821 and 2699 ms at load averages of 8.75, 8.37 and 8.53, and
 * six concurrent cold runs, each with its own fixtures root, took 3265, 3279, 3289, 3289, 3343 and
 * 3249 ms at a load average of 8.1. The budget is the larger of twice the maximum (3343 ms, so
 * 6.7 s) and 10 s, the floor being twice the default, rounded up to the next second.
 * Raise it only on a new measurement recorded here, never to make a run pass.
 */
export const cutItemRenderTestTimeoutMs = 10_000;

/**
 * The timeout, in milliseconds, for each spawn of `scripts/seed-sql.ts` that a test makes; a test
 * that spawns it more than once takes this times its number of spawns.
 *
 * Each spawn loads the whole Qti schema, which the CLI start `cliProcessTestTimeoutMs` measures
 * does not. Measured on 2026-11-03 at `a776f20`, from `packages/pantry`, with the printed seed read
 * to its end: three serial spawns alone took 642, 635 and 673 ms at a one-minute load average of
 * 20.4 before and after, and three runs of 13 concurrent spawns (vitest's default worker count on
 * 14 CPUs, `availableParallelism() - 1`) took 1640 to 1740 ms (maximum 1740 ms), 1399 to 1461 ms
 * and 1498 to 1596 ms, at load averages of 20.4, 20.4 and 20.1 before and 20.4, 20.1 and 20.1
 * after. The budget is the larger of twice the concurrent maximum (3.5 s) and 10 s, the floor being
 * twice the default, rounded up to the next second. Raise it only on a new measurement recorded
 * here, never to make a run pass.
 */
export const seedSqlProcessTestTimeoutMs = 10_000;

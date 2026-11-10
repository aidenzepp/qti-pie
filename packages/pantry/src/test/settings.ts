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
 * Whether `GR8DES_GENETIC=1` asks for the genetic searches' long budget, beside the bounded one
 * every free run spends.
 */
export const geneticRequested = Config.String("GR8DES_GENETIC").pipe(
  Config.withDefault(""),
  Config.map((value) => value === "1"),
);

/**
 * The settings, resolved once at load through the default provider.
 */
export const settings = Effect.runSync(
  Config.all({ corpusRequested, geneticRequested, leaseDatabase }),
);

/**
 * Whether this run holds a lease, so the database suites may run.
 */
export const hasLease = Option.isSome(settings.leaseDatabase);

/**
 * The timeout, in milliseconds, for each test of a lease suite that writes.
 *
 * The longest lease test on trunk a1d5af1 is the export round trip, at 24,095 ms
 * (gt-w3, 2026-11-04: 21,385, 22,160 and 24,095 ms in three runs of the lease
 * files, load 6.5 to 132). The value is twice that, rounded up to the next 1,000.
 * Raise it only on a new measurement recorded here, never to make a run pass. A
 * lease suite that only reads keeps the database project's timeout.
 *
 * A probe login's layer (`#pantry/test/served-members.ts` `servedProbe`), which
 * compiles the login's workloads in process, runs under the database project's
 * `hookTimeout`: its compile took 4.8 s on 2026-11-10 at a load average of 19 to
 * 25, on grizzle eb56d58.
 */
export const leaseTestTimeoutMs = 49_000;

/**
 * The timeout, in milliseconds, for the export's page-size test
 * (`#pantry/export/package.db.test.ts`), which exports every accepted package three times: whole,
 * then in pages of 1 and of 7 `Node` rows, so one `documentScan.page` call per row at size 1.
 *
 * Measured at qti-pie 5a61bc92 on grizzle b927d999, 2026-11-09: 211,019 ms on the lease at a load
 * average of about 27 to 36. grizzle's PORT-Q1 measured the same test at page size 1 served and in
 * process, 30.1 s and 29.5 s, the same 3,380 flights and 60,089 statements, so serving the
 * workload costs it nothing. The value is twice the measurement, rounded up to the next 1,000, the
 * rule `leaseTestTimeoutMs` uses. Raise it only on a new measurement recorded here.
 */
export const exportPageSizesTestTimeoutMs = 423_000;

/**
 * The timeout, in milliseconds, for one test that spawns the CLI as a child process.
 *
 * Such a test pays Node's start and the module graph of `cli.ts`. Measured 2026-11-07: 3.0 s at a
 * load average of 63 to 73, the slowest CLI process test of the free project. The budget is the
 * larger of twice that and 10 s, twice vitest's 5 s default, which the parallel leased suite
 * exceeded under load averages of 8 to 15 (merges `8b3f2a65`, `1a3d4f4c`, `998fe309` and
 * `655ddd9f`). A test file whose handlers load the engine loads it first in a `beforeAll` under
 * `engineLoadHookTimeoutMs`, so no test pays that load. Raise it only on a new measurement recorded
 * here, never to make a run pass.
 */
export const cliProcessTestTimeoutMs = 10_000;

/**
 * The timeout, in milliseconds, for the hook that loads the engine once per CLI test file: the
 * modules `#pantry/test/cli.ts`'s `preloadEngine` imports, which the command handlers import when
 * they run.
 *
 * Measured 2026-11-07: 36.9 s at a load average of 80 to 83, `cli/import.test.ts`'s hook beside one
 * other suite, which the budget is over twice. Nine concurrent loads of the five modules took 4.2
 * to 4.6 s on 2026-11-10 at a load average of 19 to 22, on grizzle eb56d58. Raise it only on a new
 * measurement recorded here, never to make a run pass.
 */
export const engineLoadHookTimeoutMs = 97_000;

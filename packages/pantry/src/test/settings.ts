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
 * files, load 6.5 to 132). The value is twice that, rounded up to the next 1,000,
 * the rule `probeLayerHookTimeoutMs` uses. Raise it only on a new measurement
 * recorded here, never to make a run pass. A lease suite that only reads keeps
 * vitest's default.
 */
export const leaseTestTimeoutMs = 49_000;

/**
 * The timeout, in milliseconds, for the export's page-size test
 * (`#pantry/export/package.db.test.ts`), which exports every accepted package three times: whole,
 * then in pages of 1 and of 7 `Node` rows, so one `documentScan.page` call per row at size 1.
 *
 * Measured at qti-pie 5a61bc92 on grizzle b927d999, alone on a quiet cluster, 2026-11-09:
 * 211,019 ms. Under the served workload each page is its own call, against about 24 s for the
 * whole export round trip before it. The value is twice the measurement, rounded up to the next
 * 1,000, the rule `leaseTestTimeoutMs` uses. Raise it only on a new measurement recorded here.
 */
export const exportPageSizesTestTimeoutMs = 423_000;

/**
 * The timeout, in milliseconds, for the `layer` hook that builds a probe of the author login
 * (`#pantry/test/served-members.ts` `servedProbe`). grizzle's `compileServed` compiles the login's
 * workloads with the probe's members in process, the compile `grizzle generate` runs, so the hook
 * is CPU-bound and slows with the machine's load. `AuthorAppLayer` itself compiles nothing: it
 * loads the committed served file, and its hook runs under the database project's `hookTimeout`.
 *
 * The nearest measurement is of `AuthorAppLayer` when its `DbLayer` compiled every program of the
 * login's workloads, the compile a probe's layer runs now. Measured 2026-11-07 at `4e82dde5`, the
 * snapshot at 21,856,162 bytes, on the lease with the other lanes running: a cold build, the first
 * in its process as each lease file's hook is, took 32.1 s at a load average of 31 to 36, and 31.3,
 * 25.0, 14.5 and 12.7 s at a load average of 28 to 33. The value is twice the slowest, rounded up
 * to the next 1,000. A measurement of the probe's own hook is owed after the repin. Raise it only
 * on a new measurement recorded here, never to make a run pass.
 */
export const probeLayerHookTimeoutMs = 65_000;

/**
 * The timeout, in milliseconds, for one test that spawns the CLI as a child process.
 *
 * Such a test pays Node's start and the module graph of `cli.ts`, not the snapshot, and vitest's
 * 5 s default was exceeded by the parallel leased full suite under load averages of 8 to 15 on 14
 * CPUs (merges `8b3f2a65`, `1a3d4f4c`, `998fe309` and `655ddd9f`). Measured on 2026-11-02 at
 * `ae520e6`: fifteen quiet spawns had a median of 3.8 s, and spawns beside six concurrent
 * layer builds had a maximum of 4.5 s at load averages of 4 to 6. The budget is the larger of
 * twice that maximum (9 s) and 10 s, the floor being twice the default. Measured 2026-11-07: 3.0 s
 * at a load average of 63 to 73, the slowest CLI process test of the free project.
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
 * Measured on 2026-11-04 at `0f3e8e4` (grizzle trunk), from `packages/pantry`: three batches of
 * thirteen concurrent runs (vitest's default worker count on 14 CPUs, `availableParallelism() - 1`)
 * of one process that imports the six modules `preloadEngine` imported then. Batch 1 took 22328,
 * 22477, 22507, 22925, 22874, 22928, 22735, 22402, 22445, 23119, 22230, 22696 and 22438 ms at a
 * one-minute load average of 119.6 before and 105.7 after. Batch 2 took 26114, 26314, 26108, 26539,
 * 26527, 26273, 26278, 26006, 26575, 26013, 25572, 26055 and 25194 ms at 105.7 before and 107.2
 * after. Batch 3 took 26744, 26963, 26263, 26243, 26812, 26878, 26923, 26880, 26130, 26925, 26937,
 * 26081 and 27104 ms at 107.2 before and 102.5 after. The maximum is 27104 ms. A batch at the
 * lowest load sampled (21.1 in 20 minutes; the batch started at 25.8 and ended at 28.1) took 8137
 * to 8343 ms. The budget is the larger of twice the maximum (54.2 s) and 20 s, rounded up to the
 * next second.
 *
 * Since Q5's CLI fix (2026-11-05) `preloadEngine` imports four modules, not six, and the
 * measurements above are of the six. Q5's re-measurement of the four, batch 2, had a maximum of
 * 37.3 s at load averages of 34 to 45, which this rule turns into 75 s.
 *
 * After W5's cutover (2026-11-06, measured by seat Q5.18) the four modules load the new grammar
 * installation, schema and import program. Three batches of nine concurrent processes (this
 * machine's `availableParallelism() - 1`, 10 CPUs) took 41401 to 44313 ms at one-minute load
 * averages of 40.7 to 43.2, 42232 to 45512 ms at 43.2 to 43.8, and 45546 to 48499 ms at 43.8 to
 * 46.8, each process near 1 GB resident. The maximum is 48499 ms, and the rule gives 97 s. Per
 * module, at a load near 44: `install.ts` 16.5 to 22.1 s, `import/write.ts` 8.8 s, `qti/schema.ts`
 * 6.3 s, grizzle 3.4 s and `refusal.ts` 1.0 to 4.9 s.
 *
 * `import/write.ts`'s 8.8 s was not its own maps (30 ms and 3 MB, measured alone on 2026-11-06 by
 * seat PS) but the author role it imported: `qti/schema.ts` (1.6 s, 63 MB) and `role(...)` in
 * `qti/roles.ts` (2.0 s, 271 MB) at a load of 27. Since `changeSetOf` takes the role from its
 * caller, the five modules `preloadEngine` imports load neither. Three batches of nine concurrent
 * processes then took 17442 to 17694 ms at one-minute load averages of 21.5 to 23.4, 12749 to 13229
 * ms at 22.3 to 23.4, and 11972 to 12361 ms at 21.7 to 22.3, each process 597 to 691 MB resident.
 * The rule gives 36 s for that maximum, but at half Q5.18's load, so the budget stays at Q5.18's
 * measurement. Measured 2026-11-07: 36.9 s at a load average of 80 to 83, `cli/import.test.ts`'s
 * hook beside one other suite, which the budget is over twice.
 * Raise it only on a new measurement recorded here, never to make a run pass.
 */
export const engineLoadHookTimeoutMs = 97_000;

import { Config, Effect, Option } from "effect";

/**
 * The named lease database, when one is held; `Option.none()` otherwise.
 */
const leaseDatabase = Config.option(Config.String("GR8DES_PG_DATABASE"));

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
 * The timeout, in milliseconds, for each test of a lease suite that writes: a hang guard. A lease
 * suite that only reads keeps the database project's timeout.
 */
export const leaseTestTimeoutMs = 49_000;

/**
 * The timeout, in milliseconds, for one test that spawns the CLI as a child process: a hang guard.
 * A test file whose handlers load the engine loads it first in a `beforeAll` under
 * `engineLoadHookTimeoutMs`, so no test pays that load.
 */
export const cliProcessTestTimeoutMs = 10_000;

/**
 * The timeout, in milliseconds, for the hook that loads the engine once per CLI test file, the
 * modules `#pantry/test/cli.ts`'s `preloadEngine` imports, which the command handlers import when
 * they run: a hang guard.
 */
export const engineLoadHookTimeoutMs = 97_000;

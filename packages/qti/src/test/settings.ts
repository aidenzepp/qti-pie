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

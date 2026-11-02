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

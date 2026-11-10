/**
 * The factor a test's absolute time bound scales by on a machine slower than the laptop class the
 * bounds are readings of.
 *
 * A wall-clock or CPU-time bound in a test is a product bound on that laptop class. Another
 * machine, such as the GitHub runner, sets `PLATE_TIMING_SCALE` and each bound is multiplied by it.
 * No timing test is skipped, and a growth ratio is never scaled: a ratio compares two runs on the
 * same machine, so the machine's speed cancels.
 *
 * @module
 */
import { Config, Effect, Schema } from "effect";

/**
 * The scale: `PLATE_TIMING_SCALE`, 1 when unset. It is a finite number above 0; any other value is
 * a `ConfigError`, so a misspelt setting fails the run rather than being guessed.
 */
export const scaleOf: Config.Config<number> = Config.schema(
  Schema.FiniteFromString.check(Schema.isGreaterThan(0)),
  "PLATE_TIMING_SCALE",
).pipe(Config.withDefault(1));

/**
 * Read the scale from the host environment.
 *
 * @returns The scale.
 * @throws {Config.ConfigError} The error of {@link scaleOf}, when `PLATE_TIMING_SCALE` is set to something
 *   other than a positive number.
 */
export const timingScale = (): number => Effect.runSync(scaleOf);

/**
 * Scale an absolute time bound by {@link timingScale}.
 *
 * @param ms The bound, in milliseconds, on the laptop class the readings assume.
 * @returns The bound on this machine, in milliseconds.
 */
export const scaledMs = (ms: number): number => ms * timingScale();

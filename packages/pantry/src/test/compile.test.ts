/**
 * Witnesses that every statement of the `Qti` schema and every login's program compiles, with no
 * database. It runs grizzle's own check, which runs `compileSchema` over the schema and compiles
 * every program of every login, and reads what it prints. A statement grizzle refuses ("does not
 * compile") fails here, in the free suite, instead of waiting for a regenerate or a leased run.
 *
 * Its bound is the one schema, every login and every program. Drift between the schema and
 * `snapshot.json` ("an ungenerated change", "is not the one snapshot.json records") is not a
 * compile failure and passes: `src/qti/logins.test.ts` owns that state.
 *
 * It spawns `grizzle check` (`#pantry/test/grizzle-check.ts`) because grizzle exports no compile
 * function to this package.
 */
import { assert, it } from "@effect/vitest";
import { Effect } from "effect";
import { grizzleCheck } from "#pantry/test/grizzle-check.ts";

/**
 * How long the check may take. Measured wall time of `pnpm exec grizzle check`: 8.2 s at load 11,
 * 14.7 s at load 47 (refused at the schema), 22.1 s at load 50 (a full compile to drift).
 * Measured 2026-11-07: 33.9 s at a load average of 68 to 116; the same day, 48.3 s while the load
 * rose from 35 to 123.
 */
const checkTimeoutMs = 300_000;

it.effect(
  "grizzle check reaches the end of compilation: no statement or program of Qti does not compile",
  () =>
    Effect.gen(function* compiles() {
      const { code, output } = yield* grizzleCheck("grizzle.config.ts");
      const lines = output.split("\n");

      // Oracle: grizzle's `compileSchema` and program compilation, as `grizzle check` runs them.
      // Bound: the one schema, every login and every program; residual none.
      assert.isTrue(code === 0 || code === 1, `grizzle check exited ${String(code)}:\n${output}`);
      assert.isTrue(
        lines.some((line) => line.startsWith("Qti: ")),
        `grizzle check printed no Qti line:\n${output}`,
      );
      assert.deepStrictEqual(
        lines.filter((line) => line.includes("does not compile")),
        [],
      );
    }),
  checkTimeoutMs,
);

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
 * It spawns `grizzle check` because grizzle exports no compile function to this package: the
 * engine's compiler is no declared dependency of pantry, and the CLI is the supported way in.
 */
import { spawn } from "node:child_process";
import path from "node:path";
import { assert, it } from "@effect/vitest";
import { Effect } from "effect";

/**
 * The package directory, where `grizzle.config.ts` lives and where grizzle is run from.
 */
const packageDirectory = path.resolve(import.meta.dirname, "..", "..");

/**
 * How long the check may take. Measured wall time of `pnpm exec grizzle check`: 8.2 s at load 11,
 * 14.7 s at load 47 (refused at the schema), 22.1 s at load 50 (a full compile to drift).
 * Measured 2026-11-07: 33.9 s at a load average of 68 to 116; the same day, 48.3 s while the load
 * rose from 35 to 123.
 */
const checkTimeoutMs = 300_000;

/**
 * Run `pnpm exec grizzle check grizzle.config.ts` in the package directory and collect how it
 * ended. grizzle prints its findings on standard error, so both streams are read together.
 *
 * @returns The exit code, and everything the process wrote.
 */
const grizzleCheck = Effect.callback<
  { readonly code: number | null; readonly output: string },
  Error
>((resume) => {
  const child = spawn("pnpm", ["exec", "grizzle", "check", "grizzle.config.ts"], {
    cwd: packageDirectory,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const chunks: Buffer[] = [];

  child.stdout.on("data", (chunk: Buffer) => {
    chunks.push(chunk);
  });
  child.stderr.on("data", (chunk: Buffer) => {
    chunks.push(chunk);
  });
  child.on("error", (error) => {
    resume(Effect.fail(error));
  });
  child.on("close", (code) => {
    resume(Effect.succeed({ code, output: Buffer.concat(chunks).toString("utf-8") }));
  });

  return Effect.sync(() => {
    child.kill();
  });
});

it.effect(
  "grizzle check reaches the end of compilation: no statement or program of Qti does not compile",
  () =>
    Effect.gen(function* compiles() {
      const { code, output } = yield* grizzleCheck;
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

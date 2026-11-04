import { spawn } from "node:child_process";
import path from "node:path";
import { assert, it } from "@effect/vitest";
import { Effect } from "effect";
import { cliProcessTestTimeoutMs } from "#pantry/test/settings.ts";

/**
 * The program's entry point.
 */
const entry = path.resolve(import.meta.dirname, "..", "cli.ts");

/**
 * Run `node src/cli.ts --help` with standard output a pipe whose read end is destroyed right after
 * the spawn, before the child's first write, and collect how the child ended.
 *
 * @returns The exit code, and what the child wrote to standard error.
 */
const helpIntoClosedPipe = Effect.callback<
  { readonly code: number | null; readonly stderr: string },
  Error
>((resume) => {
  const child = spawn(process.execPath, [entry, "--help"], {
    stdio: ["ignore", "pipe", "pipe"],
  });
  const chunks: Buffer[] = [];

  child.stdout.destroy();
  child.stderr.on("data", (chunk: Buffer) => {
    chunks.push(chunk);
  });
  child.on("error", (error) => {
    resume(Effect.fail(error));
  });
  child.on("close", (code) => {
    resume(Effect.succeed({ code, stderr: Buffer.concat(chunks).toString("utf-8") }));
  });

  return Effect.sync(() => {
    child.kill();
  });
});

it.effect(
  "a closed standard output ends the run with exit 0 and nothing on standard error",
  () =>
    Effect.gen(function* closedStdout() {
      const { code, stderr } = yield* helpIntoClosedPipe;

      assert.notInclude(stderr, "EPIPE");
      assert.notMatch(stderr, /^\s+at /mu);
      assert.strictEqual(stderr, "");
      assert.strictEqual(code, 0);
    }),
  cliProcessTestTimeoutMs,
);

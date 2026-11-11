/**
 * Grizzle's own check run in a child process, and the configuration files it reads, as the free
 * suite's compile witnesses use them: `src/test/compile.test.ts` over `grizzle.config.ts`, each CDN
 * rule's test (`src/levels/cdn-*.test.ts`) over an installation whose top level is the `Cdn` level,
 * the package-media level's (`src/levels/media.test.ts`) over one whose top level is the `Media`
 * level, and `src/qti/limits.test.ts` over a probe schema of its own.
 *
 * The witnesses spawn `grizzle check` because grizzle exports no compile function to this package:
 * the engine's compiler is no declared dependency of pantry, and the CLI is the supported way in.
 */
import { spawn } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { Effect } from "effect";

/**
 * The package directory, where `grizzle.config.ts` lives, where grizzle is run from and where the
 * committed migrations live.
 */
const packageDirectory = path.resolve(import.meta.dirname, "..", "..");

/**
 * How one `grizzle check` ended: its exit code, and everything it wrote on either stream.
 */
export interface CheckRun {
  readonly code: number | null;
  readonly output: string;
}

/**
 * Run `pnpm exec grizzle check <config>` in the package directory and collect how it ended.
 * grizzle prints its findings on standard error, so both streams are read together; interrupting
 * the effect kills the process.
 *
 * @param config - The configuration file, a path from the package directory or an absolute one.
 * @returns The exit code, and everything the process wrote; fails with the error spawning it gives.
 */
export const grizzleCheck = (config: string) =>
  Effect.callback<CheckRun, Error>((resume) => {
    const child = spawn("pnpm", ["exec", "grizzle", "check", config], {
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

/**
 * Write a configuration file into its own folder under the package's `work/`, which is removed
 * when the scope closes. A file there imports this package's modules through its `#pantry/*`
 * aliases, as `grizzle.config.ts` does.
 *
 * @param folder - The folder's name under `work/`, one per configuration, so checks running at once
 *   never share one.
 * @param text - The configuration's source, given the folder's path.
 * @returns The configuration file's path.
 */
export const writtenConfig = (folder: string, text: (directory: string) => string) => {
  const directory = path.join(packageDirectory, "work", folder);

  return Effect.acquireRelease(
    Effect.tryPromise(async () => {
      await mkdir(directory, { recursive: true });
      const file = path.join(directory, "grizzle.config.ts");
      await writeFile(file, text(directory));

      return file;
    }),
    () => Effect.promise(() => rm(directory, { force: true, recursive: true })),
  );
};

/**
 * Write the configuration of an installation whose top level is the `Cdn` level over `Qti` for
 * one origin, with the author's login and the committed migrations, as `grizzle.config.ts`
 * configures `Qti`, through {@link writtenConfig}.
 *
 * @param folder - The folder's name under `work/`, one per test file, so files running at once
 *   never share one.
 * @param origin - The origin the level is built for.
 * @returns The configuration file's path.
 */
export const writtenCdnConfig = (folder: string, origin: string) =>
  writtenConfig(
    folder,
    () => `import { defineConfig } from "@bjornpagen/grizzle";
import { Effect } from "effect";
import { connectionServices, migrationConnection } from "#pantry/db/connection.ts";
import { singleCdn } from "#pantry/levels/cdn.ts";
import { authorLogin } from "#pantry/qti/logins.ts";
import { qti } from "#pantry/qti/schema.ts";

const connection = await Effect.runPromise(
  migrationConnection.pipe(Effect.provide(connectionServices)),
);

export default defineConfig({
  connection: () => connection,
  logins: [authorLogin(qti())],
  migrations: ${JSON.stringify(path.join(packageDirectory, "migrations"))},
  schemas: [singleCdn(qti(), { origin: ${JSON.stringify(origin)} })],
});
`,
  );

/**
 * Write the configuration of an installation whose top level is the `Media` level over `Qti` for
 * one roster, with the author's login and the committed migrations, as `grizzle.config.ts`
 * configures `Qti`, through {@link writtenConfig}.
 *
 * @param folder - The folder's name under `work/`, one per test file, so files running at once
 *   never share one.
 * @param media - The roster the level is built for, each extension with its media type.
 * @returns The configuration file's path.
 */
export const writtenMediaConfig = (folder: string, media: Readonly<Record<string, string>>) =>
  writtenConfig(
    folder,
    () => `import { defineConfig } from "@bjornpagen/grizzle";
import { Effect } from "effect";
import { connectionServices, migrationConnection } from "#pantry/db/connection.ts";
import { packageMedia } from "#pantry/levels/media.ts";
import { authorLogin } from "#pantry/qti/logins.ts";
import { qti } from "#pantry/qti/schema.ts";

const connection = await Effect.runPromise(
  migrationConnection.pipe(Effect.provide(connectionServices)),
);

export default defineConfig({
  connection: () => connection,
  logins: [authorLogin(qti())],
  migrations: ${JSON.stringify(path.join(packageDirectory, "migrations"))},
  schemas: [packageMedia(qti(), { media: ${JSON.stringify(media)} })],
});
`,
  );

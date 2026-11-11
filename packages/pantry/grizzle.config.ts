import { readFileSync } from "node:fs";
import { defineConfig } from "@bjornpagen/grizzle";
import type { MigrationConnectionConfig } from "@bjornpagen/grizzle";
import { Console, Effect, FileSystem, PlatformError } from "effect";
import { migrationConnection } from "#pantry/db/connection.ts";
import { AuthorApp } from "#pantry/qti/logins.ts";
import { Qti } from "#pantry/qti/schema.ts";

/**
 * The file system the migration identity's connection reads the cluster's CA through
 * (`#pantry/db/connection.ts`): `readFileString`, read synchronously, so that building the
 * connection finishes under `Effect.runSync`, since grizzle calls `connection` synchronously and
 * Node's (`NodeFileSystem`) reads a file only asynchronously. Building the connection reads no
 * other file, so every other operation fails, as `FileSystem.layerNoop` leaves it.
 */
const synchronousFiles = FileSystem.layerNoop({
  readFileString: (path) =>
    Effect.try({
      catch: (cause) =>
        PlatformError.systemError({
          _tag: "Unknown",
          cause,
          method: "readFileString",
          module: "FileSystem",
          pathOrDescriptor: path,
        }),
      try: () => readFileSync(path, "utf-8"),
    }),
});

/**
 * Build the migration identity's connection to the cluster from its settings and CA
 * (`#pantry/db/connection.ts`), each time grizzle asks for it. Only `grizzle migrate` and `grizzle
 * drift` ask, so `generate`, `check` and `names` read no setting of the cluster's and no CA, and
 * run where no cluster's state folder is. Only `migrate` and `drift` read the password, at each
 * connection attempt, running `GR8DES_PG_PASSWORD_COMMAND` where it is set.
 *
 * Grizzle calls it synchronously and refuses one that throws without quoting what it threw (its
 * `ConnectionRefused`, "connection threw"), so a setting or a CA this cannot read is written to
 * standard error first: the message names the variable or the file, and the repair.
 *
 * @returns The connection. Throws where a setting is missing or malformed or the CA is unreadable.
 * @see https://github.com/bjornpagen/grizzle/blob/eb56d58bb3191b6645f1334dc55f63c7a73c2dc4/packages/grizzle/src/cli/connection.ts#L41-L59
 */
const connection = (): MigrationConnectionConfig =>
  Effect.runSync(
    migrationConnection.pipe(
      Effect.provide(synchronousFiles),
      Effect.tapError((failure) => Console.error(failure.message)),
    ),
  );

/**
 * The grizzle configuration every `grizzle` command of this package names: `Qti` alone, with no
 * package-media level, whatever install `GR8DES_QTI_INSTALL` names for the runtime, since an
 * install's migrations are its own config's to generate; its one login; the committed migrations;
 * and the migration identity's connection to the local cluster.
 */
export default defineConfig({
  connection,
  logins: [AuthorApp],
  migrations: "migrations",
  schemas: [Qti],
});

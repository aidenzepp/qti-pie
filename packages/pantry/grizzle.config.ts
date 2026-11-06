import { defineConfig } from "@bjornpagen/grizzle";
import { NodeFileSystem } from "@effect/platform-node";
import { Effect } from "effect";
import { migrationConnection } from "#pantry/db/connection.ts";
import { AuthorApp } from "#pantry/qti/logins.ts";
import { Qti } from "#pantry/qti/schema.ts";

/**
 * The grizzle configuration every `grizzle` command of this package names: the `Qti` schema, its
 * one login, the committed migrations, and the migration identity's connection to the local
 * cluster.
 *
 * Loading it reads the cluster's settings and CA (`#pantry/db/connection.ts`), since grizzle's
 * transport takes the CA as text, so every command, `generate` and `check` among them, needs the
 * cluster's state folder; only `migrate` and `drift` read the password, at each connection attempt.
 */
export default defineConfig({
  connection: await Effect.runPromise(
    migrationConnection.pipe(Effect.provide(NodeFileSystem.layer)),
  ),
  logins: [AuthorApp],
  migrations: "migrations",
  schemas: [Qti],
});

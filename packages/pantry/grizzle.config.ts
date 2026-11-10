import { defineConfig } from "@bjornpagen/grizzle";
import { Effect } from "effect";
import { connectionServices, migrationConnection } from "#pantry/db/connection.ts";
import { authorLogin } from "#pantry/qti/logins.ts";
import { qti } from "#pantry/qti/schema.ts";

/**
 * The migration identity's connection, built once from the cluster's settings and CA when this
 * module loads. grizzle calls `connection` only for `migrate` and `drift`; the CA is still read at
 * load, since grizzle takes the connection synchronously and the CA's read is an Effect.
 */
const connection = await Effect.runPromise(
  migrationConnection.pipe(Effect.provide(connectionServices)),
);

/**
 * The grizzle configuration every `grizzle` command of this package names: the `Qti` schema, its
 * one login, the committed migrations, and the migration identity's connection to the local
 * cluster.
 *
 * Loading it reads the cluster's settings and CA (`#pantry/db/connection.ts`), since grizzle's
 * transport takes the CA as text, so every command, `generate` and `check` among them, needs the
 * cluster's state folder; only `migrate` and `drift` read the password, at each connection attempt,
 * running `GR8DES_PG_PASSWORD_COMMAND` where it is set.
 */
export default defineConfig({
  connection: () => connection,
  logins: [authorLogin(qti())],
  migrations: "migrations",
  schemas: [qti()],
});

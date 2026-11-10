import { defineConfig } from "@bjornpagen/grizzle";
import type { MigrationConnectionConfig } from "@bjornpagen/grizzle";
import { Console, Effect, Option } from "effect";
import { migrationConnection } from "#pantry/db/connection.ts";
import { authorAppOf } from "#pantry/qti/logins.ts";
import { qtiSchema } from "#pantry/qti/schema.ts";

/**
 * This package's own `Qti`, with no single-CDN policy: the schema the committed migrations install,
 * whatever install `GR8DES_QTI_INSTALL` names for the runtime, since an install's migrations are
 * its own config's to generate.
 */
const ownQti = qtiSchema(Option.none());

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
 * @see https://github.com/bjornpagen/grizzle/blob/1685e15c8f245dace46ddf6a75765dd2e060b218/packages/grizzle/src/cli/connection.ts#L41-L59
 */
const connection = (): MigrationConnectionConfig =>
  Effect.runSync(
    migrationConnection.pipe(Effect.tapError((failure) => Console.error(failure.message))),
  );

/**
 * The grizzle configuration every `grizzle` command of this package names: this package's own
 * `Qti` schema, its one login, the committed migrations, and the migration identity's connection
 * to the local cluster.
 */
export default defineConfig({
  connection,
  logins: [authorAppOf(ownQti)],
  migrations: "migrations",
  schemas: [ownQti],
});

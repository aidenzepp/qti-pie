/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */

/**
 * Where this package connects: grizzle's local development cluster by default, reached as
 * scripts/db.sh reaches it, or the PostgreSQL 19 server its settings name, by the migration
 * identity (`grizzle migrate`, through grizzle.config.ts) and by a login (its `DbLayer`,
 * src/db/layer.ts).
 */
import net from "node:net";
import { CredentialError } from "@bjornpagen/grizzle";
import type { DbConnection, MigrationConnectionConfig, Transport } from "@bjornpagen/grizzle";
import { Config, Effect, FileSystem, Option, Redacted, Schema } from "effect";
import pg from "pg";

/**
 * The server's CA certificate could not be read: the file `GR8DES_PG_CA` names, or, where it is
 * unset, the local cluster's, whose state folder is missing or was never initialised.
 */
export class ClusterConfigError extends Schema.TaggedError<ClusterConfigError>()(
  "ClusterConfigError",
  { path: Schema.String, setting: Schema.Literals(["GRIZZLE_PG_STATE", "GR8DES_PG_CA"]) },
) {
  /**
   * The unreadable file and how to supply it, by the setting that named it.
   */
  override get message(): string {
    return this.setting === "GR8DES_PG_CA"
      ? `Cannot read the database's CA certificate at ${this.path}, the file GR8DES_PG_CA names. Set GR8DES_PG_CA to a readable PEM file, such as the certificate bundle of the server's RDS region, or unset it to use the local cluster's.`
      : `Cannot read the local database's CA certificate at ${this.path}. Start the cluster from the grizzle clone (\`pnpm pg:init\`, and \`pnpm pg start\` after a reboot), set GRIZZLE_PG_STATE to the folder that holds its tls/ca.crt, or set GR8DES_PG_CA to another server's CA file.`;
  }
}

/**
 * A database name scripts/db.sh accepts: 1 to 63 lowercase letters, digits or underscores, not
 * starting with a digit, the rule at the top of that script.
 *
 * PostgreSQL folds an unquoted name to lowercase and truncates one past 63 bytes, so `db.sh
 * create`, which writes the name unquoted, would make another database than the one a connection
 * names as written.
 *
 * @see https://www.postgresql.org/docs/current/sql-syntax-lexical.html#SQL-SYNTAX-IDENTIFIERS
 */
const DatabaseName = Schema.String.check(
  Schema.isPattern(/^[a-z_][a-z0-9_]{0,62}$/u, {
    message:
      "Use 1 to 63 lowercase letters, digits or underscores, not starting with a digit, so that scripts/db.sh creates the database this connection names",
  }),
);

/**
 * A folder setting whose default is a path under the home folder: the variable's value, else
 * `HOME` with `below` appended.
 *
 * @param name - The variable.
 * @param below - The default's path under the home folder.
 * @returns The folder.
 */
const underHome = (name: string, below: string): Config.Config<string> =>
  Config.all({ home: Config.String("HOME"), set: Config.option(Config.String(name)) }).pipe(
    Config.map(({ home, set }) => Option.getOrElse(set, () => `${home}/${below}`)),
  );

/**
 * The database a connection names, as `GR8DES_PG_DATABASE` gives it, `gr8des_qti` by default.
 */
const database = Config.schema(DatabaseName, "GR8DES_PG_DATABASE").pipe(
  Config.withDefault("gr8des_qti"),
);

/**
 * The CA file a connection verifies the server against, and the setting that named it: the file
 * `GR8DES_PG_CA` names, else `tls/ca.crt` in the local cluster's state folder, which
 * `GRIZZLE_PG_STATE` names (`~/.local/var/grizzle/pg19rc1` by default, where grizzle's `pnpm
 * pg:init` makes it).
 */
const caFile = Config.all({
  set: Config.option(Config.String("GR8DES_PG_CA")),
  state: underHome("GRIZZLE_PG_STATE", ".local/var/grizzle/pg19rc1"),
}).pipe(
  Config.map(({ set, state }) =>
    Option.match(set, {
      onNone: () => ({ path: `${state}/tls/ca.crt`, setting: "GRIZZLE_PG_STATE" as const }),
      onSome: (path) => ({ path, setting: "GR8DES_PG_CA" as const }),
    }),
  ),
);

/**
 * The cluster's settings, read from the same variables with the same defaults as the block at the
 * top of scripts/db.sh; change one, change both. An empty variable takes its default, as the
 * script's `:=` does. Every default is the local cluster's; setting them reaches another server.
 *
 * - `ca` is the CA file, {@link caFile}.
 * - `migrationRole` is the migration identity, `GR8DES_PG_MIGRATION_ROLE`: the role that owns the
 *   database and so every schema `grizzle migrate` installs. By default it is `grizzle_dev`, the
 *   role grizzle's `pnpm pg:init` creates on the development cluster, which owns every database
 *   scripts/db.sh creates.
 * - `secrets` is the folder of the logins' password files, `~/.local/var/gr8des/<database>` by
 *   default, where `scripts/db.sh migrate` writes them.
 */
const localCluster = Config.all({
  ca: caFile,
  database,
  host: Config.String("GR8DES_PG_HOST").pipe(Config.withDefault("localhost")),
  migrationRole: Config.String("GR8DES_PG_MIGRATION_ROLE").pipe(Config.withDefault("grizzle_dev")),
  port: Config.Port("GR8DES_PG_PORT").pipe(Config.withDefault(5433)),
  secrets: database.pipe(
    Config.flatMap((name) => underHome("GR8DES_PG_SECRETS", `.local/var/gr8des/${name}`)),
  ),
});

/**
 * The bound, in milliseconds, of one connection attempt to the cluster and of the one
 * CancelRequest an interrupted statement sends.
 *
 * Grizzle states no number of its own. This is the budget grizzle 48256f8 fixed for every session
 * it opened, the bound every lease run of this package has passed under.
 *
 * @see https://github.com/bjornpagen/grizzle/blob/48256f8d61484d18aea2023f2d6fb54d07d46abf/packages/grizzle/src/adapter/pool/budgets.ts
 */
const connectTimeoutMs = 5000;

/**
 * The variable the migration identity's password is read from, which `scripts/db.sh migrate`
 * exports from the cluster's state folder for the one `grizzle migrate` it runs.
 */
const migrationPasswordSetting = "GR8DES_PG_MIGRATION_PASSWORD";

/**
 * A connection to the cluster, without its password, the migration identity's role, and the folder
 * its logins' password files are in.
 */
interface ClusterConnection {
  readonly connection: Omit<DbConnection, "password">;
  readonly migrationRole: string;
  readonly secrets: string;
}

/**
 * Read the cluster's settings and its CA, as every connection to it is built from them: TCP to the
 * host and port, verify-full TLS against the CA file, whose server certificate must name the host
 * (grizzle's development CA names `localhost`, `127.0.0.1` and `::1`), and node-postgres as the
 * driver.
 *
 * It fails with Effect's `ConfigError` for a missing or malformed setting, before any file is read,
 * and with a {@link ClusterConfigError} when the CA is unreadable.
 */
const clusterConnection = Effect.gen(function* clusterConnection() {
  const fs = yield* FileSystem.FileSystem;
  const cluster = yield* localCluster;
  const ca = yield* fs
    .readFileString(cluster.ca.path)
    .pipe(Effect.mapError(() => new ClusterConfigError(cluster.ca)));
  const transport: Transport = {
    ca,
    host: cluster.host,
    kind: "sslRequest",
    open: () => new net.Socket(),
    port: cluster.port,
    servername: cluster.host,
  };
  const result: ClusterConnection = {
    connection: { connectTimeoutMs, database: cluster.database, driver: pg, transport },
    migrationRole: cluster.migrationRole,
    secrets: cluster.secrets,
  };

  return result;
});

/**
 * The migration identity's connection to the cluster, the `connection` of grizzle.config.ts.
 *
 * Its password is read from `GR8DES_PG_MIGRATION_PASSWORD` at each connection attempt, never when
 * the connection is built, so `grizzle generate`, `check` and `names`, which never connect, need no
 * password. A missing password fails the attempt with grizzle's `CredentialError`, whose cause is
 * Effect's `ConfigError` naming the variable.
 *
 * Building it fails as {@link loginConnection} does: with Effect's `ConfigError` for a missing or
 * malformed setting, and with a {@link ClusterConfigError} when the CA is unreadable.
 */
export const migrationConnection = clusterConnection.pipe(
  Effect.map(({ connection, migrationRole }): MigrationConnectionConfig => ({
    ...connection,
    password: Config.Redacted(migrationPasswordSetting).pipe(
      Effect.mapError((cause) => new CredentialError({ cause })),
    ),
    role: migrationRole,
  })),
  Effect.withSpan("db.migrationConnection"),
);

/**
 * Build a login's connection to the cluster, for its `DbLayer`: the cluster's connection with
 * the password scripts/db.sh gave the login, read from `<GR8DES_PG_SECRETS>/<login>.password` at
 * each connection attempt.
 *
 * A missing password file is not found here: it fails each connection attempt with grizzle's
 * `CredentialError`.
 *
 * @param login - The login's PostgreSQL role, `<schema>__<login>`, which names its password file.
 * @returns The connection, which fails to build with Effect's `ConfigError` for a missing or
 *   malformed setting, before any file is read, and with a {@link ClusterConfigError} when the CA
 *   is unreadable.
 */
export const loginConnection = Effect.fn("db.loginConnection")(function* loginConnection(
  login: string,
) {
  const fs = yield* FileSystem.FileSystem;
  const { connection, secrets } = yield* clusterConnection;
  const result: DbConnection = {
    ...connection,
    password: fs.readFileString(`${secrets}/${login}.password`).pipe(
      Effect.map((text) => Redacted.make(text.trim())),
      Effect.mapError((cause) => new CredentialError({ cause })),
    ),
  };

  return result;
});

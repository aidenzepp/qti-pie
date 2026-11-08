/**
 * Where this package connects: grizzle's local development cluster, reached as scripts/db.sh
 * reaches it, by the migration identity (`grizzle migrate`, through grizzle.config.ts) and by a
 * login (its `DbLayer`, src/db/layer.ts).
 */
import net from "node:net";
import { CredentialError } from "@bjornpagen/grizzle";
import type { DbConnection, MigrationConnectionConfig, Transport } from "@bjornpagen/grizzle";
import { Config, Effect, FileSystem, Option, Redacted, Schema } from "effect";
import pg from "pg";

/**
 * The development cluster's CA certificate could not be read, so the cluster is not set up for this
 * user: its state folder is missing or was never initialised.
 */
export class ClusterConfigError extends Schema.TaggedError<ClusterConfigError>()(
  "ClusterConfigError",
  { path: Schema.String, setting: Schema.Literal("GRIZZLE_PG_STATE") },
) {
  /**
   * The missing file and the two ways to supply it.
   */
  override get message(): string {
    return `Cannot read the local database's CA certificate at ${this.path}. Start the cluster from the grizzle clone (\`pnpm pg:init\`, and \`pnpm pg start\` after a reboot), or set ${this.setting} to the folder that holds its tls/ca.crt.`;
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
 * The local cluster's settings, read from the same variables with the same defaults as the block at
 * the top of scripts/db.sh; change one, change both. An empty variable takes its default, as the
 * script's `:=` does.
 *
 * - `grizzleState` is the cluster's state folder, `~/.local/var/grizzle/pg19rc1` by default, where
 *   grizzle's `pnpm pg:init` makes it.
 * - `secrets` is the folder of the logins' password files, `~/.local/var/gr8des/<database>` by
 *   default, where `scripts/db.sh migrate` writes them.
 */
const localCluster = Config.all({
  database,
  grizzleState: underHome("GRIZZLE_PG_STATE", ".local/var/grizzle/pg19rc1"),
  host: Config.String("GR8DES_PG_HOST").pipe(Config.withDefault("localhost")),
  port: Config.Port("GR8DES_PG_PORT").pipe(Config.withDefault(5433)),
  secrets: database.pipe(
    Config.flatMap((name) => underHome("GR8DES_PG_SECRETS", `.local/var/gr8des/${name}`)),
  ),
});

/**
 * The bound, in milliseconds, of one connection attempt to the local cluster and of the one
 * CancelRequest an interrupted statement sends.
 *
 * Grizzle states no number of its own. This is the budget grizzle 48256f8 fixed for every session
 * it opened, the bound every lease run of this package has passed under.
 *
 * @see https://github.com/bjornpagen/grizzle/blob/48256f8d61484d18aea2023f2d6fb54d07d46abf/packages/grizzle/src/adapter/pool/budgets.ts
 */
const connectTimeoutMs = 5000;

/**
 * The migration identity: the role grizzle's `pnpm pg:init` creates on the development cluster,
 * which owns every database scripts/db.sh creates and so every schema `grizzle migrate` installs.
 */
const migrationRole = "grizzle_dev";

/**
 * The variable the migration identity's password is read from, which `scripts/db.sh migrate`
 * exports from the cluster's state folder for the one `grizzle migrate` it runs.
 */
const migrationPasswordSetting = "GR8DES_PG_MIGRATION_PASSWORD";

/**
 * A connection to the local cluster, without its password, and the folder its logins' password
 * files are in.
 */
interface ClusterConnection {
  readonly connection: Omit<DbConnection, "password">;
  readonly secrets: string;
}

/**
 * Read the local cluster's settings and its CA, as every connection to it is built from them: TCP
 * to the host and port, verify-full TLS against grizzle's development CA, whose server certificate
 * names the host (`localhost`, `127.0.0.1` and `::1`), and node-postgres as the driver.
 *
 * It fails with Effect's `ConfigError` for a missing or malformed setting, before any file is read,
 * and with a {@link ClusterConfigError} when the CA is unreadable.
 */
const clusterConnection = Effect.gen(function* clusterConnection() {
  const fs = yield* FileSystem.FileSystem;
  const cluster = yield* localCluster;
  const caPath = `${cluster.grizzleState}/tls/ca.crt`;
  const ca = yield* fs
    .readFileString(caPath)
    .pipe(
      Effect.mapError(() => new ClusterConfigError({ path: caPath, setting: "GRIZZLE_PG_STATE" })),
    );
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
    secrets: cluster.secrets,
  };

  return result;
});

/**
 * The migration identity's connection to the local cluster, the `connection` of grizzle.config.ts.
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
  Effect.map(({ connection }): MigrationConnectionConfig => ({
    ...connection,
    password: Config.Redacted(migrationPasswordSetting).pipe(
      Effect.mapError((cause) => new CredentialError({ cause })),
    ),
    role: migrationRole,
  })),
  Effect.withSpan("db.migrationConnection"),
);

/**
 * Build a login's connection to the local cluster, for its `DbLayer`: the cluster's connection with
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

/**
 * Where this package connects: grizzle's local development cluster by default, reached as
 * scripts/db.sh reaches it, or the PostgreSQL 19 server its settings name, by the migration
 * identity (`grizzle migrate`, through grizzle.config.ts) and by a login (its `DbLayer`,
 * src/db/layer.ts).
 */
import { readFileSync } from "node:fs";
import net from "node:net";
import type { MigrationConnectionConfig } from "@bjornpagen/grizzle";
import { CredentialError } from "@bjornpagen/grizzle/runtime";
import type { DbConnection, Transport } from "@bjornpagen/grizzle/runtime";
import * as NodeChildProcessSpawner from "@effect/platform-node/NodeChildProcessSpawner";
import * as NodeFileSystem from "@effect/platform-node/NodeFileSystem";
import * as NodePath from "@effect/platform-node/NodePath";
import { Config, Effect, FileSystem, Layer, Option, Redacted, Schema, Stream } from "effect";
import { ChildProcess, ChildProcessSpawner } from "effect/process";
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
 * The password command `GR8DES_PG_PASSWORD_COMMAND` names exited with a code other than 0 for a
 * role, so it gave no password: the cause of the connection attempt's `CredentialError`.
 */
export class PasswordCommandFailed extends Schema.TaggedError<PasswordCommandFailed>()(
  "PasswordCommandFailed",
  { command: Schema.String, exitCode: Schema.Number, role: Schema.String },
) {
  /**
   * The command, the role it was run for, its exit code, and how to see why.
   */
  override get message(): string {
    return `The password command ${this.command} exited with code ${String(this.exitCode)} for the role ${this.role}, so the connection attempt has no password. Run it by hand with ${this.role} as its one argument to see why, or unset GR8DES_PG_PASSWORD_COMMAND to read the local passwords.`;
  }
}

/**
 * The password command `GR8DES_PG_PASSWORD_COMMAND` names exited with 0 for a role and printed
 * nothing but whitespace, so it gave no password: the cause of the connection attempt's
 * `CredentialError`.
 */
export class PasswordCommandSilent extends Schema.TaggedError<PasswordCommandSilent>()(
  "PasswordCommandSilent",
  { command: Schema.String, role: Schema.String },
) {
  /**
   * The command, the role it was run for, and what it must print.
   */
  override get message(): string {
    return `The password command ${this.command} printed no password for the role ${this.role}. It must print the role's password on standard output; check that it is signed in, by running it by hand with ${this.role} as its one argument.`;
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
 * The executable that gives each role its password, `GR8DES_PG_PASSWORD_COMMAND`, none where it is
 * unset or empty, as scripts/db.sh reads it. Where it is set, it replaces both local sources: the
 * migration identity's `GR8DES_PG_MIGRATION_PASSWORD` and each login's password file.
 */
const passwordCommand = Config.option(Config.String("GR8DES_PG_PASSWORD_COMMAND")).pipe(
  Config.map(Option.filter((command) => command !== "")),
);

/**
 * The bound, in milliseconds, of one connection attempt to the cluster and of the one
 * CancelRequest an interrupted statement sends, for the migration identity and every login alike.
 *
 * Grizzle states no number of its own: every `DbConnection` carries the caller's
 * `connectTimeoutMs`, and an attempt that has not read its password, connected, finished TLS and
 * authenticated within it fails with `ConnectTimedOut`. 5,000 ms is this package's choice. An
 * attempt is one password read and a few round trips (TCP, the SSLRequest, the TLS handshake,
 * startup and authentication), so the bound stands well above a reachable server's answer, and a
 * server that never answers fails the command within seconds rather than holding it.
 *
 * @see https://github.com/bjornpagen/grizzle/blob/1685e15c8f245dace46ddf6a75765dd2e060b218/packages/grizzle/src/adapter/types/layer.ts#L70-L87
 * @see https://github.com/bjornpagen/grizzle/blob/1685e15c8f245dace46ddf6a75765dd2e060b218/README.md#connecting
 */
const connectTimeoutMs = 5000;

/**
 * The variable the migration identity's password is read from, which `scripts/db.sh migrate`
 * exports from the cluster's state folder for the one `grizzle migrate` it runs.
 */
const migrationPasswordSetting = "GR8DES_PG_MIGRATION_PASSWORD";

/**
 * A connection to the cluster, without its password, the migration identity's role, the folder its
 * logins' password files are in, and the source of a role's password where the settings name one
 * for every role: the password command, run once per connection attempt.
 */
interface ClusterConnection {
  readonly commandPassword: Option.Option<(role: string) => DbConnection["password"]>;
  readonly connection: Omit<DbConnection, "password">;
  readonly migrationRole: string;
  readonly secrets: string;
}

/**
 * The Node services a password command runs under: the child process spawner, with the file system
 * and path services it reads.
 */
const commandServices = NodeChildProcessSpawner.layer.pipe(
  Layer.provide(Layer.mergeAll(NodeFileSystem.layer, NodePath.layer)),
);

/**
 * Run the password command for one role, as one connection attempt asks for its password: the
 * executable itself, never a shell, with the role's name as its one argument, its standard input
 * and error the process's own, so a sign-in it runs can prompt and report, and its standard output,
 * trimmed, the password. It runs as a child of this Node process, so the attempt's password needs
 * no service of its caller's, as grizzle's `password` Effect takes none.
 *
 * It fails with grizzle's `CredentialError`, whose cause is the spawn's `PlatformError` (no such
 * executable, or one that may not be run), a {@link PasswordCommandFailed} for an exit code other
 * than 0, or a {@link PasswordCommandSilent} for an output of whitespace alone. Interrupting the
 * attempt, as its connect timeout does, ends the command with it.
 *
 * @param command - The executable, `GR8DES_PG_PASSWORD_COMMAND`.
 * @param role - The PostgreSQL role the password is for.
 * @returns The password.
 */
const runPasswordCommand = (command: string, role: string): DbConnection["password"] =>
  Effect.gen(function* passwordCommandRun() {
    const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
    const handle = yield* spawner.spawn(
      ChildProcess.make(command, [role], { stderr: "inherit", stdin: "inherit", stdout: "pipe" }),
    );
    const { exitCode, output } = yield* Effect.all(
      { exitCode: handle.exitCode, output: Stream.mkString(Stream.decodeText(handle.stdout)) },
      { concurrency: "unbounded" },
    );
    const password = output.trim();
    if (exitCode !== ChildProcessSpawner.ExitCode(0)) {
      return yield* new PasswordCommandFailed({ command, exitCode, role });
    }

    if (password === "") {
      return yield* new PasswordCommandSilent({ command, role });
    }

    return Redacted.make(password);
  }).pipe(
    Effect.scoped,
    Effect.provide(commandServices),
    Effect.mapError((cause) => new CredentialError({ cause })),
    Effect.withSpan("db.passwordCommand", { attributes: { role } }),
  );

/**
 * Read the cluster's settings and its CA, as every connection to it is built from them: TCP to the
 * host and port, verify-full TLS against the CA file, whose server certificate must name the host
 * (grizzle's development CA names `localhost`, `127.0.0.1` and `::1`), and node-postgres as the
 * driver.
 *
 * The CA is read synchronously, so building the connection needs no service and runs under
 * `Effect.runSync`: grizzle calls the config's migration connection synchronously
 * (`GrizzleConfig.connection`, `() => MigrationConnectionConfig`), and its transport takes the CA
 * as text, while Effect's `FileSystem` (`@effect/platform-node`'s `NodeFileSystem`) reads a file
 * only asynchronously.
 *
 * It fails with Effect's `ConfigError` for a missing or malformed setting, before any file is read,
 * and with a {@link ClusterConfigError} when the CA is unreadable.
 *
 * @see https://github.com/bjornpagen/grizzle/blob/1685e15c8f245dace46ddf6a75765dd2e060b218/packages/grizzle/src/adapter/types/config.ts#L41-L45
 */
const clusterConnection = Effect.gen(function* clusterConnection() {
  const cluster = yield* localCluster;
  const command = yield* passwordCommand;
  const ca = yield* Effect.try({
    catch: () => new ClusterConfigError(cluster.ca),
    try: () => readFileSync(cluster.ca.path, "utf-8"),
  });
  const transport: Transport = {
    ca,
    host: cluster.host,
    kind: "sslRequest",
    open: () => new net.Socket(),
    port: cluster.port,
    servername: cluster.host,
  };
  const result: ClusterConnection = {
    commandPassword: command.pipe(
      Option.map((executable) => (role: string) => runPasswordCommand(executable, role)),
    ),
    connection: { connectTimeoutMs, database: cluster.database, driver: pg, transport },
    migrationRole: cluster.migrationRole,
    secrets: cluster.secrets,
  };

  return result;
});

/**
 * The migration identity's connection to the cluster, which the `connection` of grizzle.config.ts
 * builds when `grizzle migrate` or `grizzle drift` calls it: `grizzle generate`, `check` and
 * `names` never call it, so they read no setting of the cluster's and no CA. It needs no service,
 * so the config runs it with `Effect.runSync`.
 *
 * Its password is read at each connection attempt, never when the connection is built: from the
 * password command where `GR8DES_PG_PASSWORD_COMMAND` names one, run for the migration role, else
 * from `GR8DES_PG_MIGRATION_PASSWORD`. A missing password fails the attempt with grizzle's
 * `CredentialError`, whose cause is the command's failure or Effect's `ConfigError` naming the
 * variable.
 *
 * Building it fails as {@link loginConnection} does: with Effect's `ConfigError` for a missing or
 * malformed setting, and with a {@link ClusterConfigError} when the CA is unreadable.
 */
export const migrationConnection = clusterConnection.pipe(
  Effect.map(({ commandPassword, connection, migrationRole }): MigrationConnectionConfig => ({
    ...connection,
    password: Option.match(commandPassword, {
      onNone: () =>
        Config.Redacted(migrationPasswordSetting).pipe(
          Effect.mapError((cause) => new CredentialError({ cause })),
        ),
      onSome: (passwordOf) => passwordOf(migrationRole),
    }),
    role: migrationRole,
  })),
  Effect.withSpan("db.migrationConnection"),
);

/**
 * Read the cluster's settings and its CA, and give from them each login's connection to the
 * cluster, for its `DbLayer`: the cluster's connection with the login's password at each
 * connection attempt, from the password command where `GR8DES_PG_PASSWORD_COMMAND` names one, run
 * for the login's role, else the one scripts/db.sh gave the login, read from
 * `<GR8DES_PG_SECRETS>/<role>.password`. `<role>` is the PostgreSQL role grizzle installs for the
 * login (`roleNameOf`), the one `scripts/db.sh migrate` sets the password on and names the file
 * after.
 *
 * The caller names the login by its role, `roleNameOf(login)`: the served login's
 * (`@bjornpagen/grizzle/runtime`, read from its served file) for the runtime's layer, or an
 * authoring login's for a test, so this module reads no login of grizzle's.
 *
 * A missing password, a password file absent or a command that fails, is not found here: it fails
 * each connection attempt with grizzle's `CredentialError`.
 *
 * It fails with Effect's `ConfigError` for a missing or malformed setting, before any file is read,
 * and with a {@link ClusterConfigError} when the CA is unreadable.
 *
 * @see https://github.com/bjornpagen/grizzle/blob/1685e15c8f245dace46ddf6a75765dd2e060b218/packages/engine/src/program/names.ts#L61-L76
 */
export const loginConnection = Effect.gen(function* loginConnection() {
  const fs = yield* FileSystem.FileSystem;
  const { commandPassword, connection, secrets } = yield* clusterConnection;

  return (role: string): DbConnection => ({
    ...connection,
    password: Option.match(commandPassword, {
      onNone: () =>
        fs.readFileString(`${secrets}/${role}.password`).pipe(
          Effect.map((text) => Redacted.make(text.trim())),
          Effect.mapError((cause) => new CredentialError({ cause })),
        ),
      onSome: (passwordOf) => passwordOf(role),
    }),
  });
}).pipe(Effect.withSpan("db.loginConnection"));

/**
 * The services building a login's connection reads: the file system its logins' password files are
 * read from. The migration identity's connection reads none, and a password command needs none of
 * the caller's: it runs as a child of this Node process. `AuthorAppLayer` (src/db/layer.ts)
 * provides it, and so does an install outside this package that builds a login's connection here.
 */
export const connectionServices = NodeFileSystem.layer;

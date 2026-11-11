/**
 * Where this package connects: grizzle's local development cluster by default, reached as
 * scripts/db.sh reaches it, or the PostgreSQL 19 server its settings name, by the migration
 * identity (`grizzle migrate`, through grizzle.config.ts) and by a login (its `DbLayer`,
 * src/cli/layer.ts).
 */
import net from "node:net";
import type { MigrationConnectionConfig } from "@bjornpagen/grizzle";
import { CredentialError } from "@bjornpagen/grizzle/runtime";
import type { DbConnection, Transport } from "@bjornpagen/grizzle/runtime";
import * as NodeChildProcessSpawner from "@effect/platform-node/NodeChildProcessSpawner";
import * as NodeFileSystem from "@effect/platform-node/NodeFileSystem";
import * as NodePath from "@effect/platform-node/NodePath";
import {
  Config,
  Duration,
  Effect,
  FileSystem,
  Layer,
  Option,
  Redacted,
  Ref,
  Schema,
  Stream,
} from "effect";
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
 * role, so it gave no password, whatever it printed: the failure of building the runtime's login
 * connection, which runs it before any attempt (`primedLoginConnection`), and the cause of a
 * connection attempt's `CredentialError`.
 *
 * Its message names the command, the role and the exit code, and says how to see why, as
 * {@link ClusterConfigError}'s names its remedy: the command line prints a failure's message.
 */
export class PasswordCommandFailed extends Schema.TaggedError<PasswordCommandFailed>()(
  "PasswordCommandFailed",
  { command: Schema.String, exitCode: Schema.Number, role: Schema.String },
) {
  /**
   * The command, the role it was run for, its exit code, and how to see why it failed.
   */
  override get message(): string {
    return `The password command ${this.command} exited with code ${String(this.exitCode)} for the role ${this.role}, so the connection has no password. Run it by hand with ${this.role} as its one argument to see why it fails, and sign in if it asks you to; or unset GR8DES_PG_PASSWORD_COMMAND to use the local cluster's passwords.`;
  }
}

/**
 * The password command `GR8DES_PG_PASSWORD_COMMAND` names exited with 0 for a role and printed
 * nothing but whitespace, so it gave no password: failing as {@link PasswordCommandFailed} does.
 */
export class PasswordCommandSilent extends Schema.TaggedError<PasswordCommandSilent>()(
  "PasswordCommandSilent",
  { command: Schema.String, role: Schema.String },
) {
  /**
   * The command, the role it was run for, and what it must print.
   */
  override get message(): string {
    return `The password command ${this.command} exited with code 0 for the role ${this.role} but printed no password on standard output. GR8DES_PG_PASSWORD_COMMAND must print the role's password; run it by hand with ${this.role} as its one argument to check that it is signed in.`;
  }
}

/**
 * The password command `GR8DES_PG_PASSWORD_COMMAND` names was still running for a role when its
 * bound, `GR8DES_PG_PASSWORD_COMMAND_TIMEOUT`, passed, so it was killed and gave no password:
 * failing as {@link PasswordCommandFailed} does.
 */
export class PasswordCommandTimedOut extends Schema.TaggedError<PasswordCommandTimedOut>()(
  "PasswordCommandTimedOut",
  { command: Schema.String, role: Schema.String, timeout: Schema.String },
) {
  /**
   * The command, the role it was run for, its bound, and how to give it longer.
   */
  override get message(): string {
    return `The password command ${this.command} did not finish within ${this.timeout} for the role ${this.role}, so it was stopped and the connection has no password. Give GR8DES_PG_PASSWORD_COMMAND_TIMEOUT a longer limit, such as '2 minutes', if its sign-in needs more time, or run it by hand with ${this.role} as its one argument to see where it waits.`;
  }
}

/**
 * The password command `GR8DES_PG_PASSWORD_COMMAND` names could not be run to its end for a role:
 * no executable is at the path, it may not be run, or its output or exit could not be read, as the
 * spawner's `PlatformError` says. Failing as {@link PasswordCommandFailed} does.
 */
export class PasswordCommandNotRun extends Schema.TaggedError<PasswordCommandNotRun>()(
  "PasswordCommandNotRun",
  { command: Schema.String, reason: Schema.String, role: Schema.String },
) {
  /**
   * The command, the role it was run for, the spawner's reason, and what the setting must name.
   */
  override get message(): string {
    return `The password command ${this.command} could not be run for the role ${this.role}: ${this.reason}. Set GR8DES_PG_PASSWORD_COMMAND to the path of an executable that prints a role's password; it runs without a shell, so the setting names one file and holds no arguments.`;
  }
}

/**
 * Every way the password command gives no password.
 */
export type PasswordCommandError =
  | PasswordCommandFailed
  | PasswordCommandNotRun
  | PasswordCommandSilent
  | PasswordCommandTimedOut;

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
 * The local cluster's state folder, which `GRIZZLE_PG_STATE` names (`~/.local/var/grizzle/pg19rc1`
 * by default, where grizzle's `pnpm pg:init` makes it): it holds the cluster's CA, `tls/ca.crt`,
 * and the migration identity's password, `<role>.password`, which scripts/db.sh reads.
 */
export const clusterState = underHome("GRIZZLE_PG_STATE", ".local/var/grizzle/pg19rc1");

/**
 * The CA file a connection verifies the server against, and the setting that named it: the file
 * `GR8DES_PG_CA` names, else `tls/ca.crt` in the local cluster's state folder
 * ({@link clusterState}).
 */
const caFile = Config.all({
  set: Config.option(Config.String("GR8DES_PG_CA")),
  state: clusterState,
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
 * The bound, in milliseconds, of a connection attempt's network part, for the migration identity
 * and every login alike: TCP, the SSLRequest, the TLS handshake, startup and authentication, and
 * the one CancelRequest an interrupted statement sends.
 *
 * Grizzle states no number of its own: every `DbConnection` carries the caller's
 * `connectTimeoutMs`, and an attempt that has not read its password, connected, finished TLS and
 * authenticated within it fails with `ConnectTimedOut`. 5,000 ms is this package's choice. It
 * stands well above a reachable server's few round trips, and a server that never answers fails
 * the command within seconds rather than holding it. A password command's run is not part of it:
 * {@link connectTimeoutMsOf} adds the command's own bound.
 *
 * @see https://github.com/bjornpagen/grizzle/blob/eb56d58bb3191b6645f1334dc55f63c7a73c2dc4/packages/grizzle/src/adapter/types/layer.ts#L71-L88
 * @see https://github.com/bjornpagen/grizzle/blob/eb56d58bb3191b6645f1334dc55f63c7a73c2dc4/README.md#connecting
 */
const networkTimeoutMs = 5000;

/**
 * The greatest `connectTimeoutMs` grizzle accepts, 2,147,483,647, the largest delay Node's timers
 * keep.
 *
 * @see https://github.com/bjornpagen/grizzle/blob/999facc69571db35dc9878d47f2d82ba95c41456/packages/grizzle/src/adapter/types/layer.ts#L61-L78
 */
const greatestConnectTimeoutMs = 2_147_483_647;

/**
 * A password command's bound: a positive duration whose milliseconds, added to
 * {@link networkTimeoutMs}, stay within {@link greatestConnectTimeoutMs}.
 */
const PasswordCommandTimeout = Schema.DurationFromString.check(
  Schema.makeFilter(
    (timeout: Duration.Duration) =>
      Duration.isPositive(timeout) &&
      Duration.toMillis(timeout) <= greatestConnectTimeoutMs - networkTimeoutMs,
    {
      message:
        "Use a positive duration of at most 24 days, such as '90 seconds' or '2 minutes', so the connect timeout it adds to stays within what Node's timers keep",
    },
  ),
);

/**
 * The password command and its bound, where `GR8DES_PG_PASSWORD_COMMAND` names one.
 */
interface PasswordCommand {
  readonly command: string;
  readonly timeout: Duration.Duration;
}

/**
 * The executable that gives each role its password, `GR8DES_PG_PASSWORD_COMMAND`, none where it is
 * unset or empty, as scripts/db.sh reads it, with the bound of one run of it,
 * `GR8DES_PG_PASSWORD_COMMAND_TIMEOUT`, 60 seconds where it is unset or empty. Where the command is
 * set, it replaces both local sources: the migration identity's `GR8DES_PG_MIGRATION_PASSWORD` and
 * each login's password file.
 *
 * The bound is long enough for a sign-in the command runs to prompt and be answered by hand.
 * scripts/db.sh puts none on its own runs: it runs the command before it starts psql, so no
 * connect timeout covers it there.
 */
export const passwordCommandSetting: Config.Config<Option.Option<PasswordCommand>> = Config.all({
  command: Config.option(Config.String("GR8DES_PG_PASSWORD_COMMAND")),
  timeout: Config.schema(PasswordCommandTimeout, "GR8DES_PG_PASSWORD_COMMAND_TIMEOUT").pipe(
    Config.withDefault(Duration.seconds(60)),
  ),
}).pipe(
  Config.map(({ command, timeout }) =>
    command.pipe(
      Option.filter((executable) => executable !== ""),
      Option.map((executable) => ({ command: executable, timeout })),
    ),
  ),
);

/**
 * The bound, in milliseconds, of one connection attempt: {@link networkTimeoutMs}, plus the
 * password command's own bound where one is set, since every attempt that runs the command waits
 * for it.
 *
 * Grizzle's `connectTimeoutMs` covers the password Effect too: node-postgres starts its connect
 * timer before TCP and asks for the password only when the server does, within the same timer. So
 * the command's run gets its own bound and the attempt's network part keeps its 5,000 ms. The cost
 * is the longer wait, where a command is set, for a server that never answers and for a
 * CancelRequest, which the same number bounds.
 *
 * @param command - The password command, if any.
 * @returns The attempt's `connectTimeoutMs`, a whole number of milliseconds.
 * @see https://github.com/bjornpagen/grizzle/blob/999facc69571db35dc9878d47f2d82ba95c41456/packages/grizzle/src/adapter/types/layer.ts#L61-L78
 */
const connectTimeoutMsOf = (command: Option.Option<PasswordCommand>): number =>
  Option.match(command, {
    onNone: () => networkTimeoutMs,
    onSome: ({ timeout }) => networkTimeoutMs + Math.ceil(Duration.toMillis(timeout)),
  });

/**
 * The variable the migration identity's password is read from, which `scripts/db.sh migrate`
 * exports from the cluster's state folder for the one `grizzle migrate` it runs.
 */
const migrationPasswordSetting = "GR8DES_PG_MIGRATION_PASSWORD";

/**
 * A connection to the cluster, without its password, the migration identity's role, the folder its
 * logins' password files are in, and the password command that gives every role its password where
 * the settings name one.
 */
interface ClusterConnection {
  readonly command: Option.Option<PasswordCommand>;
  readonly connection: Omit<DbConnection, "password">;
  readonly migrationRole: string;
  readonly secrets: string;
}

/**
 * How long a password command that is being stopped has to exit after SIGTERM before its process
 * group is sent SIGKILL, so one that ignores SIGTERM cannot hold its run open past its bound.
 */
const commandKillGrace = Duration.seconds(1);

/**
 * The Node services a password command runs under: the child process spawner, with the file system
 * and path services it reads.
 */
const commandServices = NodeChildProcessSpawner.layer.pipe(
  Layer.provide(Layer.mergeAll(NodeFileSystem.layer, NodePath.layer)),
);

/**
 * Run the password command once for one role: the executable itself, never a shell, with the
 * role's name as its one argument, its standard input and error the process's own, so a sign-in
 * it runs can prompt and report, and its standard output, trimmed, the password. It runs as a child
 * of this Node process, so it needs no service of its caller's, as grizzle's `password` Effect
 * takes none.
 *
 * The command's bound is its own: past it, the run's scope closes, which sends the command's
 * process group SIGTERM, then SIGKILL after {@link commandKillGrace}, and the run fails. Nothing
 * else stops it: grizzle runs an attempt's password Effect detached from the attempt
 * (`Effect.runPromiseWith`), so an attempt that times out or is interrupted leaves the command to
 * this bound.
 *
 * It fails with a {@link PasswordCommandNotRun} where the spawner cannot run it or read its output
 * or exit, a {@link PasswordCommandFailed} for an exit code other than 0, whatever it printed, a
 * {@link PasswordCommandSilent} for an output of whitespace alone, and a
 * {@link PasswordCommandTimedOut} once its bound passes.
 *
 * @param passwordCommand - The command and its bound.
 * @param passwordCommand.command - The executable, `GR8DES_PG_PASSWORD_COMMAND`.
 * @param passwordCommand.timeout - The bound, `GR8DES_PG_PASSWORD_COMMAND_TIMEOUT`.
 * @param role - The PostgreSQL role the password is for.
 * @returns The password.
 * @see https://github.com/bjornpagen/grizzle/blob/999facc69571db35dc9878d47f2d82ba95c41456/packages/grizzle/src/adapter/wire/session.ts#L391-L410
 */
const runPasswordCommand = (
  { command, timeout }: PasswordCommand,
  role: string,
): Effect.Effect<Redacted.Redacted, PasswordCommandError> =>
  Effect.gen(function* passwordCommandRun() {
    const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
    const handle = yield* spawner.spawn(
      ChildProcess.make(command, [role], {
        forceKillAfter: commandKillGrace,
        stderr: "inherit",
        stdin: "inherit",
        stdout: "pipe",
      }),
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
    Effect.catchTag("PlatformError", (cause) =>
      Effect.fail(new PasswordCommandNotRun({ command, reason: cause.message, role })),
    ),
    Effect.timeoutOrElse({
      duration: timeout,
      orElse: () =>
        Effect.fail(
          new PasswordCommandTimedOut({ command, role, timeout: Duration.format(timeout) }),
        ),
    }),
    Effect.provide(commandServices),
    Effect.withSpan("db.passwordCommand", { attributes: { role } }),
  );

/**
 * The password of a connection attempt from the password command: a run of it for the role, whose
 * failure fails the attempt with grizzle's `CredentialError`.
 *
 * @param passwordCommand - The command and its bound.
 * @param role - The PostgreSQL role the password is for.
 * @returns The attempt's password Effect.
 */
const attemptPassword = (
  passwordCommand: PasswordCommand,
  role: string,
): Effect.Effect<Redacted.Redacted, CredentialError> =>
  runPasswordCommand(passwordCommand, role).pipe(
    Effect.mapError((cause) => new CredentialError({ cause })),
  );

/**
 * Run the password command for a login's role before any connection attempt, and give the
 * password Effect its attempts read: the password that run printed, for the first attempt, then a
 * run of its own for each later one.
 *
 * The run here is the one the caller waits for, outside every attempt, so a sign-in it runs by
 * hand is bounded by the command's bound alone, and its failure is this package's own error as it
 * is. In an attempt the same failure is only the cause of grizzle's failure at stage `acquire`,
 * whose message says no more than that the password Effect failed. Each later attempt runs the
 * command again, so a credential that expires, such as an RDS IAM token, is new for each session.
 *
 * @param passwordCommand - The command and its bound.
 * @param role - The login's PostgreSQL role.
 * @returns The password Effect, once the first run has given a password; fails as
 *   {@link runPasswordCommand} does.
 */
const primedPassword = Effect.fnUntraced(function* primedPassword(
  passwordCommand: PasswordCommand,
  role: string,
) {
  const first = yield* runPasswordCommand(passwordCommand, role);
  const waiting = yield* Ref.make(Option.some(first));
  const password: DbConnection["password"] = Ref.getAndSet(waiting, Option.none()).pipe(
    Effect.flatMap((primed) =>
      Option.match(primed, {
        onNone: () => attemptPassword(passwordCommand, role),
        onSome: (printed) => Effect.succeed(printed),
      }),
    ),
  );

  return password;
});

/**
 * Read the cluster's settings and its CA, as every connection to it is built from them: TCP to the
 * host and port, verify-full TLS against the CA file, whose server certificate must name the host
 * (grizzle's development CA names `localhost`, `127.0.0.1` and `::1`), node-postgres as the driver,
 * and the connect timeout {@link connectTimeoutMsOf} gives the settings' password command.
 *
 * The CA is read through Effect's `FileSystem`, whichever the caller provides: Node's
 * (`NodeFileSystem.layer`) for a login's connection, and for the migration identity's a
 * synchronous one of grizzle.config.ts's own, since grizzle calls the config's connection
 * synchronously (`GrizzleConfig.connection`, `() => MigrationConnectionConfig`) and its transport
 * takes the CA as text, while `NodeFileSystem` reads a file only asynchronously.
 *
 * It fails with Effect's `ConfigError` for a missing or malformed setting, before any file is read,
 * and with a {@link ClusterConfigError} when the CA is unreadable.
 *
 * @see https://github.com/bjornpagen/grizzle/blob/eb56d58bb3191b6645f1334dc55f63c7a73c2dc4/packages/grizzle/src/adapter/types/config.ts#L41-L45
 */
const clusterConnection = Effect.gen(function* clusterConnection() {
  const fs = yield* FileSystem.FileSystem;
  const cluster = yield* localCluster;
  const command = yield* passwordCommandSetting;
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
    command,
    connection: {
      connectTimeoutMs: connectTimeoutMsOf(command),
      database: cluster.database,
      driver: pg,
      transport,
    },
    migrationRole: cluster.migrationRole,
    secrets: cluster.secrets,
  };

  return result;
});

/**
 * The migration identity's connection to the cluster, which the `connection` of grizzle.config.ts
 * builds when `grizzle migrate` or `grizzle drift` calls it: `grizzle generate`, `check` and
 * `names` never call it, so they read no setting of the cluster's and no CA. It reads the CA
 * through `FileSystem`, which the config provides as a synchronous read, so that it runs under
 * `Effect.runSync`.
 *
 * Its password is read at each connection attempt, never when the connection is built: from the
 * password command where `GR8DES_PG_PASSWORD_COMMAND` names one, run for the migration role, else
 * from `GR8DES_PG_MIGRATION_PASSWORD`. A missing password fails the attempt with grizzle's
 * `CredentialError`, whose cause is the command's failure ({@link PasswordCommandError}) or
 * Effect's `ConfigError` naming the variable.
 *
 * Building it fails with Effect's `ConfigError` for a missing or malformed setting, and with a
 * {@link ClusterConfigError} when the CA is unreadable.
 */
export const migrationConnection = clusterConnection.pipe(
  Effect.map(({ command, connection, migrationRole }): MigrationConnectionConfig => ({
    ...connection,
    password: Option.match(command, {
      onNone: () =>
        Config.Redacted(migrationPasswordSetting).pipe(
          Effect.mapError((cause) => new CredentialError({ cause })),
        ),
      onSome: (passwordCommand) => attemptPassword(passwordCommand, migrationRole),
    }),
    role: migrationRole,
  })),
  Effect.withSpan("db.migrationConnection"),
);

/**
 * The password a login's connection reads at each attempt where no password command is set: the
 * one scripts/db.sh gave the login, in `<GR8DES_PG_SECRETS>/<role>.password`, trimmed, failing the
 * attempt with grizzle's `CredentialError` where the file is absent.
 *
 * @param fs - The file system it is read from.
 * @param secrets - The folder of the logins' password files.
 * @param role - The login's PostgreSQL role, which names the file.
 * @returns The attempt's password Effect.
 */
const filePassword = (
  fs: FileSystem.FileSystem,
  secrets: string,
  role: string,
): Effect.Effect<Redacted.Redacted, CredentialError> =>
  fs.readFileString(`${secrets}/${role}.password`).pipe(
    Effect.map((text) => Redacted.make(text.trim())),
    Effect.mapError((cause) => new CredentialError({ cause })),
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
 * (`@bjornpagen/grizzle/runtime`, read from its served file) or an authoring login's for a test,
 * so this module reads no login of grizzle's.
 *
 * A missing password, a password file absent or a command that fails, is not found here: it fails
 * each connection attempt with grizzle's `CredentialError`, whose cause is the command's
 * {@link PasswordCommandError}. {@link primedLoginConnection} finds a failing command before any
 * attempt.
 *
 * It fails with Effect's `ConfigError` for a missing or malformed setting, before any file is read,
 * and with a {@link ClusterConfigError} when the CA is unreadable.
 *
 * @see https://github.com/bjornpagen/grizzle/blob/eb56d58bb3191b6645f1334dc55f63c7a73c2dc4/packages/engine/src/program/names.ts#L61-L76
 */
export const loginConnection = Effect.gen(function* loginConnection() {
  const fs = yield* FileSystem.FileSystem;
  const { command, connection, secrets } = yield* clusterConnection;

  return (role: string): DbConnection => ({
    ...connection,
    password: Option.match(command, {
      onNone: () => filePassword(fs, secrets, role),
      onSome: (passwordCommand) => attemptPassword(passwordCommand, role),
    }),
  });
}).pipe(Effect.withSpan("db.loginConnection"));

/**
 * Read the cluster's settings and its CA, and give from them the Effect that builds a login's
 * connection as {@link loginConnection} does, except where `GR8DES_PG_PASSWORD_COMMAND` names a
 * command: building the connection then runs it once for the login's role, before any attempt,
 * and fails with its {@link PasswordCommandError}; the first attempt reads that run's password,
 * and each later attempt runs the command again ({@link primedPassword}). `AuthorAppLayer`
 * (src/cli/layer.ts) builds the runtime's connection with it, so a failing command fails the
 * layer's build with the command's own error, whose message the command line prints.
 *
 * It fails as {@link loginConnection} does.
 */
export const primedLoginConnection = Effect.gen(function* primedLoginConnection() {
  const fs = yield* FileSystem.FileSystem;
  const { command, connection, secrets } = yield* clusterConnection;

  return (role: string): Effect.Effect<DbConnection, PasswordCommandError> =>
    Option.match(command, {
      onNone: () => Effect.succeed({ ...connection, password: filePassword(fs, secrets, role) }),
      onSome: (passwordCommand) =>
        primedPassword(passwordCommand, role).pipe(
          Effect.map((password): DbConnection => ({ ...connection, password })),
        ),
    });
}).pipe(Effect.withSpan("db.primedLoginConnection"));

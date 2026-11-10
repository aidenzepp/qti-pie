/**
 * The local cluster's two connections against scripts/db.sh, whose `GR8DES_PG_*` block and
 * database-name rule are the specification: each setting's named variants carry the value or the
 * refusal that script gives them, and every combination of them is exhausted.
 */
import net from "node:net";
import { fileURLToPath } from "node:url";
import {
  login,
  relation,
  role as worldRole,
  roleNameOf,
  schema,
  uuid,
  wholeEntriesOf,
} from "@bjornpagen/grizzle";
import type { AnyLogin, DbConnection } from "@bjornpagen/grizzle";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { element } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import {
  ConfigProvider,
  Duration,
  Effect,
  FileSystem,
  Formatter,
  Option,
  Redacted,
  Result,
} from "effect";
import pg from "pg";
import {
  ClusterConfigError,
  loginConnection,
  migrationConnection,
  PasswordCommandFailed,
  PasswordCommandSilent,
} from "#pantry/db/connection.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard, never a budget. Measured 2026-11-07: 7.9 s at a load average of 75, under
 * V8 coverage, its slowest test.
 */
const testTimeoutMs = 60_000;

/**
 * The folder each run's scratch `HOME` and state folders are made in, the package's git-ignored
 * `work/`.
 */
const work = fileURLToPath(new URL("../../work/", import.meta.url));

/**
 * The one relation of a scratch installation, which its root holds and every role reads.
 */
const Probe = relation("Probe", { id: uuid }, ["id"]);

/**
 * A scratch installation's root.
 */
const ProbeRoot = schema("ConnectionProbe", { Probe }, []);

/**
 * A level over the scratch root, with nothing of its own.
 */
const ProbeLevel = schema.extend(ProbeRoot, "ConnectionLevel", {}, []);

/**
 * The scratch installation's login over its root, the one whose connection the settings' cases
 * build.
 */
const rootLogin = login(ProbeRoot, "app", [
  worldRole(ProbeRoot, "reader", wholeEntriesOf(ProbeRoot)),
]);

/**
 * Two logins of one name, by the level each is over: the scratch root's, and one over the level
 * above it. grizzle names a login's PostgreSQL role by the level it is over (README, "Levels"), so
 * the two roles differ, and the level's spells nothing of the root's name.
 *
 * @see https://github.com/bjornpagen/grizzle/blob/1685e15c8f245dace46ddf6a75765dd2e060b218/README.md#levels
 */
const loginsByLevel: Readonly<Record<"level" | "root", AnyLogin>> = {
  level: login(ProbeLevel, "app", [worldRole(ProbeLevel, "reader", wholeEntriesOf(ProbeRoot))]),
  root: rootLogin,
};

/**
 * The root login's installed role, which names the password file its connection reads.
 */
const loginRole = roleNameOf(rootLogin);

/**
 * The root login's connection, built from the settings a case provides.
 */
const rootConnection = loginConnection.pipe(
  Effect.map((connectionOf) => connectionOf(roleNameOf(rootLogin))),
);

/**
 * The migration identity's password, as `scripts/db.sh migrate` exports it.
 */
const migrationPassword = "the migration identity's password";

/**
 * One named variant of a setting: the text the environment holds for it, if any, and the value
 * scripts/db.sh resolves it to, or none where the script refuses it.
 */
interface Variant<V> {
  readonly name: string;
  readonly text: Option.Option<string>;
  readonly value: Option.Option<V>;
}

/**
 * Construct the variant of a setting whose variable is unset.
 *
 * @param value - The default the script gives it.
 * @returns The variant.
 */
const unset = <V>(value: V): Variant<V> => ({
  name: "unset",
  text: Option.none(),
  value: Option.some(value),
});

/**
 * Construct a variant of a setting the script keeps.
 *
 * @param name - What the variant is, as a failing case prints it.
 * @param text - The environment's text.
 * @param value - The value the script resolves the text to.
 * @returns The variant.
 */
const kept = <V>(name: string, text: string, value: V): Variant<V> => ({
  name,
  text: Option.some(text),
  value: Option.some(value),
});

/**
 * Construct a variant of a setting the script refuses.
 *
 * @param name - What the variant is, as a failing case prints it.
 * @param text - The environment's text.
 * @returns The variant.
 */
const refused = <V>(name: string, text: string): Variant<V> => ({
  name,
  text: Option.some(text),
  value: Option.none(),
});

/**
 * `GR8DES_PG_HOST`: unset or empty is `localhost` (the script's `:=`), and any other text is the
 * host as written.
 */
const hosts = [
  unset("localhost"),
  kept("empty", "", "localhost"),
  kept("an IP address", "127.0.0.1", "127.0.0.1"),
  kept("another name", "db.test", "db.test"),
] as const;

/**
 * `GR8DES_PG_PORT`: unset or empty is 5433, an integer from 1 to 65535 is itself, and every other
 * text is refused.
 */
const ports = [
  unset(5433),
  kept("empty", "", 5433),
  kept("server B", "5435", 5435),
  kept("the least port", "1", 1),
  kept("the greatest port", "65535", 65_535),
  refused<number>("not a number", "x"),
  refused<number>("zero", "0"),
  refused<number>("past the greatest port", "65536"),
  refused<number>("a fraction", "54.3"),
  refused<number>("negative", "-1"),
] as const;

/**
 * `GR8DES_PG_DATABASE`: unset or empty is `gr8des_qti`, and a name is kept exactly when it is 1 to
 * 63 lowercase letters, digits or underscores, not starting with a digit.
 */
const databases = [
  unset("gr8des_qti"),
  kept("empty", "", "gr8des_qti"),
  kept("the swarm's", "gr8des_qti_swarm", "gr8des_qti_swarm"),
  kept("one underscore", "_", "_"),
  kept("63 bytes", "a".repeat(63), "a".repeat(63)),
  refused<string>("an uppercase letter", "Gr8des_qti"),
  refused<string>("a leading digit", "8des"),
  refused<string>("64 bytes", "a".repeat(64)),
  refused<string>("a hyphen", "gr8-des"),
] as const;

/**
 * Where the CA is: the default state folder under `HOME`, a `GRIZZLE_PG_STATE` that holds
 * `tls/ca.crt`, or one that does not.
 */
const states = ["the default under HOME", "set, with a CA", "set, without a CA"] as const;

/**
 * Where the login's password file is: the default folder under `HOME`, named by the database, or a
 * `GR8DES_PG_SECRETS`.
 */
const secretFolders = ["the default under HOME", "set"] as const;

/**
 * One case of the box: a variant of each setting.
 */
interface Settings {
  readonly database: Variant<string>;
  readonly host: Variant<string>;
  readonly port: Variant<number>;
  readonly secrets: (typeof secretFolders)[number];
  readonly state: (typeof states)[number];
}

/**
 * What a case reaches: both connections built, a setting refused, or the CA missing.
 */
type Reached = "built" | "malformed" | "no CA";

/**
 * The scratch folders a run reads: `HOME`, with the default CA and a password file for every
 * database name the script keeps, and the folders `GRIZZLE_PG_STATE` and `GR8DES_PG_SECRETS` name.
 */
interface Scratch {
  readonly caFile: string;
  readonly home: string;
  readonly secrets: string;
  readonly stateWith: string;
  readonly stateWithout: string;
}

/**
 * The CA text under `HOME`'s default state folder.
 */
const homeCa = "the CA under HOME";

/**
 * The CA text in the state folder `GRIZZLE_PG_STATE` names.
 */
const stateCa = "the CA in GRIZZLE_PG_STATE";

/**
 * The CA text in the file `GR8DES_PG_CA` names.
 */
const namedCa = "the CA GR8DES_PG_CA names";

/**
 * The password in the folder `GR8DES_PG_SECRETS` names, written with the surrounding whitespace the
 * reader trims.
 */
const secretsPassword = "the password in GR8DES_PG_SECRETS";

/**
 * The password in a database's default folder under `HOME`.
 *
 * @param database - The database the folder is named by.
 * @returns The password.
 */
const homePassword = (database: string): string => `the password for ${database}`;

/**
 * Write the scratch folders of one run into a temporary folder of `work/` that the scope removes.
 *
 * @returns The folders.
 */
const scratchFolders = Effect.gen(function* scratchFolders() {
  const fs = yield* FileSystem.FileSystem;
  const root = yield* fs.makeTempDirectoryScoped({ directory: work, prefix: "db-connection-" });
  const scratch: Scratch = {
    caFile: `${root}/server-ca.pem`,
    home: `${root}/home`,
    secrets: `${root}/secrets`,
    stateWith: `${root}/state-with`,
    stateWithout: `${root}/state-without`,
  };

  yield* fs.makeDirectory(`${scratch.home}/.local/var/grizzle/pg19rc1/tls`, { recursive: true });
  yield* fs.writeFileString(`${scratch.home}/.local/var/grizzle/pg19rc1/tls/ca.crt`, homeCa);
  yield* fs.makeDirectory(`${scratch.stateWith}/tls`, { recursive: true });
  yield* fs.writeFileString(`${scratch.stateWith}/tls/ca.crt`, stateCa);
  yield* fs.makeDirectory(scratch.stateWithout, { recursive: true });
  yield* fs.writeFileString(scratch.caFile, namedCa);
  yield* fs.makeDirectory(scratch.secrets, { recursive: true });
  yield* fs.writeFileString(`${scratch.secrets}/${loginRole}.password`, `  ${secretsPassword}  \n`);

  for (const database of databases) {
    if (Option.isSome(database.value)) {
      const folder = `${scratch.home}/.local/var/gr8des/${database.value.value}`;

      yield* fs.makeDirectory(folder, { recursive: true });
      yield* fs.writeFileString(
        `${folder}/${loginRole}.password`,
        `${homePassword(database.value.value)}\n`,
      );
    }
  }

  return scratch;
});

/**
 * The variables a case's environment holds: `HOME` always, and each other where the case sets it.
 */
interface Environment {
  GR8DES_PG_CA?: string;
  GR8DES_PG_DATABASE?: string;
  GR8DES_PG_HOST?: string;
  GR8DES_PG_MIGRATION_PASSWORD?: string;
  GR8DES_PG_MIGRATION_ROLE?: string;
  GR8DES_PG_PORT?: string;
  GR8DES_PG_SECRETS?: string;
  GRIZZLE_PG_STATE?: string;
  HOME: string;
}

/**
 * The environment of a case, each setting set only where its variant holds text.
 *
 * @param settings - The case.
 * @param scratch - The run's folders.
 * @returns The variables, `HOME` and the migration password always among them.
 */
const environmentOf = (settings: Settings, scratch: Scratch): Environment => {
  const environment: Environment = {
    GR8DES_PG_MIGRATION_PASSWORD: migrationPassword,
    HOME: scratch.home,
  };
  const texts = [
    ["GR8DES_PG_DATABASE", settings.database.text],
    ["GR8DES_PG_HOST", settings.host.text],
    ["GR8DES_PG_PORT", settings.port.text],
  ] as const;

  for (const [name, text] of texts) {
    if (Option.isSome(text)) {
      environment[name] = text.value;
    }
  }

  if (settings.state === "set, with a CA") {
    environment.GRIZZLE_PG_STATE = scratch.stateWith;
  }

  if (settings.state === "set, without a CA") {
    environment.GRIZZLE_PG_STATE = scratch.stateWithout;
  }

  if (settings.secrets === "set") {
    environment.GR8DES_PG_SECRETS = scratch.secrets;
  }

  return environment;
};

/**
 * The password commands a case names, by what each does: print a role's password with whitespace
 * around it, exit 3, print only whitespace, or print one from a path that holds a space and a
 * semicolon, which a shell would split; and two settings that name no executable.
 */
const commandScripts = [
  { file: "failing.sh", text: "#!/bin/sh\nprintf 'partial'\nexit 3\n", variant: "failing" },
  {
    file: "printing.sh",
    text: "#!/bin/sh\nprintf '  password of %s  \\n' \"$1\"\n",
    variant: "printing",
  },
  { file: "silent.sh", text: "#!/bin/sh\nprintf '   \\n'\n", variant: "silent" },
  {
    file: "pass word; echo shell.sh",
    text: "#!/bin/sh\nprintf 'spaced password of %s' \"$1\"\n",
    variant: "spaced",
  },
] as const;

/**
 * Each variant of `GR8DES_PG_PASSWORD_COMMAND`: unset or empty, which leave the local passwords,
 * one of {@link commandScripts}, a path no file is at, and shell text, which names no executable.
 */
const commandVariants = [
  "unset",
  "empty",
  "printing",
  "failing",
  "silent",
  "spaced",
  "missing",
  "shell text",
] as const;

/**
 * What a password command case reaches: a local password, a command's password, or each way a
 * command fails.
 */
type CommandReached = "command" | "exited" | "local" | "not run" | "silent";

/**
 * The password a connection authenticates with, as grizzle reads it for one attempt.
 *
 * @param password - The connection's password.
 * @returns The password's text.
 */
const passwordText = (password: DbConnection["password"]) =>
  (Redacted.isRedacted(password) ? Effect.succeed(password) : password).pipe(
    Effect.map(Redacted.value),
  );

layer(NodeServices.layer)("db/connection.ts, under scripts/db.sh's settings", (it) => {
  it.effect(
    "build both connections exactly as scripts/db.sh resolves the settings, refuse what it refuses before reading a file, and name a missing CA: every host, port, database, CA folder and secrets folder variant, exhausted",
    (ctx) =>
      Effect.gen(function* everySetting() {
        const scratch = yield* scratchFolders;

        return yield* searched(
          ctx,
          exhaust(
            {
              box: "every combination of 4 host, 10 port and 9 database variants, 3 CA folders and 2 secrets folders",
              caseHang: Duration.seconds(10),
              coverage: requiredInSpace<Reached>(["built", "malformed", "no CA"]),
              generator: (source): Settings => ({
                database: source.draw(element(databases)),
                host: source.draw(element(hosts)),
                port: source.draw(element(ports)),
                secrets: source.draw(element(secretFolders)),
                state: source.draw(element(states)),
              }),
              limit: 2160,
              literal: Formatter.format,
              oracle: { kind: "specification", name: "scripts/db.sh's GR8DES_PG_* block" },
              suite: "db/connection/settings",
            },
            (settings, c) =>
              Effect.gen(function* oneCase() {
                const provider = ConfigProvider.layer(
                  ConfigProvider.fromUnknown(environmentOf(settings, scratch)),
                );
                const built = yield* Effect.all({
                  login: rootConnection,
                  migration: migrationConnection,
                }).pipe(Effect.result, Effect.provide(provider));
                const malformed = [
                  ...(Option.isNone(settings.port.value) ? ["GR8DES_PG_PORT"] : []),
                  ...(Option.isNone(settings.database.value) ? ["GR8DES_PG_DATABASE"] : []),
                ];

                if (malformed.length > 0) {
                  c.note("malformed");
                  assert.isTrue(Result.isFailure(built));

                  const failure = Result.isFailure(built) ? built.failure : undefined;

                  assert.strictEqual(
                    Object.getOwnPropertyDescriptor(failure, "_tag")?.value,
                    "ConfigError",
                  );
                  assert.isTrue(
                    malformed.some((name) => String(failure?.message).includes(name)),
                    String(failure?.message),
                  );

                  return;
                }

                if (settings.state === "set, without a CA") {
                  c.note("no CA");

                  const failure = Result.isFailure(built) ? built.failure : undefined;

                  assert.instanceOf(failure, ClusterConfigError);
                  assert.strictEqual(
                    failure instanceof ClusterConfigError ? failure.path : undefined,
                    `${scratch.stateWithout}/tls/ca.crt`,
                  );

                  return;
                }

                c.note("built");
                assert.isTrue(Result.isSuccess(built));

                if (Result.isFailure(built)) {
                  return;
                }

                const host = Option.getOrThrow(settings.host.value);
                const database = Option.getOrThrow(settings.database.value);
                const { login: loginSide, migration } = built.success;

                for (const connection of [loginSide, migration]) {
                  assert.strictEqual(connection.driver, pg);
                  assert.strictEqual(connection.database, database);
                  assert.strictEqual(connection.transport.kind, "sslRequest");
                  assert.strictEqual(connection.transport.host, host);
                  assert.strictEqual(connection.transport.servername, host);
                  assert.strictEqual(
                    connection.transport.port,
                    Option.getOrThrow(settings.port.value),
                  );
                  assert.strictEqual(
                    connection.transport.ca,
                    settings.state === "set, with a CA" ? stateCa : homeCa,
                  );
                  assert.isTrue(
                    Number.isInteger(connection.connectTimeoutMs) &&
                      connection.connectTimeoutMs >= 1 &&
                      connection.connectTimeoutMs <= 2_147_483_647,
                  );

                  const socket = connection.transport.open();

                  assert.instanceOf(socket, net.Socket);
                  socket.destroy();
                }

                assert.notProperty(loginSide, "role");
                assert.strictEqual(migration.role, "grizzle_dev");
                assert.strictEqual(
                  yield* passwordText(loginSide.password).pipe(Effect.provide(provider)),
                  settings.secrets === "set" ? secretsPassword : homePassword(database),
                );
                assert.strictEqual(
                  yield* passwordText(migration.password).pipe(Effect.provide(provider)),
                  migrationPassword,
                );
              }),
          ),
        );
      }),
    testTimeoutMs,
  );

  it.effect(
    "fail a connection attempt, never the build, with grizzle's CredentialError when its password is missing: the login's file present or absent, and the migration password set, empty or unset, exhausted",
    (ctx) =>
      Effect.gen(function* missingPasswords() {
        const scratch = yield* scratchFolders;

        return yield* searched(
          ctx,
          exhaust(
            {
              box: "the login's password file present or absent, by the variable that names its folder, and the migration password set, empty or unset",
              caseHang: Duration.seconds(10),
              coverage: requiredInSpace<"login refused" | "migration refused" | "read">([
                "login refused",
                "migration refused",
                "read",
              ]),
              generator: (source) => ({
                file: source.draw(element(["present", "absent"] as const)),
                migration: source.draw(element(["set", "empty", "unset"] as const)),
              }),
              limit: 6,
              literal: Formatter.format,
              oracle: { kind: "specification", name: "scripts/db.sh migrate's password files" },
              suite: "db/connection/passwords",
            },
            ({ file, migration }, c) =>
              Effect.gen(function* oneCase() {
                const environment: Environment = {
                  GR8DES_PG_SECRETS: file === "present" ? scratch.secrets : scratch.stateWithout,
                  HOME: scratch.home,
                };

                if (migration !== "unset") {
                  environment.GR8DES_PG_MIGRATION_PASSWORD =
                    migration === "set" ? migrationPassword : "";
                }

                const provider = ConfigProvider.layer(ConfigProvider.fromUnknown(environment));
                const loginSide = yield* rootConnection.pipe(Effect.provide(provider));
                const migrationSide = yield* migrationConnection.pipe(Effect.provide(provider));
                const loginPassword = yield* passwordText(loginSide.password).pipe(
                  Effect.result,
                  Effect.provide(provider),
                );
                const migrationRead = yield* passwordText(migrationSide.password).pipe(
                  Effect.result,
                  Effect.provide(provider),
                );

                if (file === "present") {
                  c.note("read");
                  assert.deepStrictEqual(loginPassword, Result.succeed(secretsPassword));
                } else {
                  c.note("login refused");
                  assert.isTrue(Result.isFailure(loginPassword));
                  assert.strictEqual(
                    Result.isFailure(loginPassword) ? loginPassword.failure._tag : undefined,
                    "CredentialError",
                  );
                }

                if (migration === "set") {
                  assert.deepStrictEqual(migrationRead, Result.succeed(migrationPassword));
                } else {
                  c.note("migration refused");

                  const failure = Result.isFailure(migrationRead)
                    ? migrationRead.failure
                    : undefined;

                  assert.strictEqual(failure?._tag, "CredentialError");
                  assert.include(String(failure?.cause), "GR8DES_PG_MIGRATION_PASSWORD");
                }
              }),
          ),
        );
      }),
  );

  it.effect(
    "verify against the file GR8DES_PG_CA names and migrate as GR8DES_PG_MIGRATION_ROLE, each the local cluster's where unset or empty, and name an unreadable CA file by its setting: every CA and role variant, exhausted",
    (ctx) =>
      Effect.gen(function* serverSettings() {
        const scratch = yield* scratchFolders;
        const cas = [
          unset<Option.Option<string>>(Option.none()),
          kept("empty", "", Option.none<string>()),
          kept("a file", scratch.caFile, Option.some(namedCa)),
          refused<Option.Option<string>>("a missing file", `${scratch.caFile}.missing`),
        ] as const;
        const roles = [
          unset("grizzle_dev"),
          kept("empty", "", "grizzle_dev"),
          kept("another role", "qti_migrator", "qti_migrator"),
        ] as const;

        return yield* searched(
          ctx,
          exhaust(
            {
              box: "every combination of 4 CA and 3 migration role variants",
              caseHang: Duration.seconds(10),
              coverage: requiredInSpace<"built" | "named" | "unreadable">([
                "built",
                "named",
                "unreadable",
              ]),
              generator: (source) => ({
                ca: source.draw(element(cas)),
                role: source.draw(element(roles)),
              }),
              limit: 12,
              literal: Formatter.format,
              oracle: { kind: "specification", name: "scripts/db.sh's GR8DES_PG_* block" },
              suite: "db/connection/server",
            },
            ({ ca, role }, c) =>
              Effect.gen(function* oneCase() {
                const environment: Environment = {
                  GR8DES_PG_MIGRATION_PASSWORD: migrationPassword,
                  HOME: scratch.home,
                };

                if (Option.isSome(ca.text)) {
                  environment.GR8DES_PG_CA = ca.text.value;
                }

                if (Option.isSome(role.text)) {
                  environment.GR8DES_PG_MIGRATION_ROLE = role.text.value;
                }

                const built = yield* Effect.all({
                  login: rootConnection,
                  migration: migrationConnection,
                }).pipe(
                  Effect.result,
                  Effect.provide(ConfigProvider.layer(ConfigProvider.fromUnknown(environment))),
                );

                if (Option.isNone(ca.value)) {
                  c.note("unreadable");

                  const failure = Result.isFailure(built) ? built.failure : undefined;

                  assert.instanceOf(failure, ClusterConfigError);
                  assert.deepStrictEqual(
                    failure instanceof ClusterConfigError
                      ? { path: failure.path, setting: failure.setting }
                      : undefined,
                    { path: `${scratch.caFile}.missing`, setting: "GR8DES_PG_CA" },
                  );
                  assert.include(failure.message, "GR8DES_PG_CA");

                  return;
                }

                c.note("built");
                if (Option.isSome(ca.value.value)) {
                  c.note("named");
                }

                assert.isTrue(Result.isSuccess(built));

                if (Result.isFailure(built)) {
                  return;
                }

                for (const connection of [built.success.login, built.success.migration]) {
                  assert.strictEqual(
                    connection.transport.ca,
                    Option.getOrElse(ca.value.value, () => homeCa),
                  );
                }

                assert.strictEqual(built.success.migration.role, Option.getOrThrow(role.value));
                assert.notProperty(built.success.login, "role");
              }),
          ),
        );
      }),
  );
  it.effect(
    "runs GR8DES_PG_PASSWORD_COMMAND, never a shell, with the role as its one argument at each connection attempt of either connection, its output trimmed the password, in place of both local passwords, and fails the attempt with CredentialError when it exits otherwise than 0, prints no password or names no executable: every variant, exhausted",
    (ctx) =>
      Effect.gen(function* passwordCommands() {
        const fs = yield* FileSystem.FileSystem;
        const scratch = yield* scratchFolders;
        for (const { file, text } of commandScripts) {
          yield* fs.writeFileString(`${scratch.secrets}/${file}`, text);
          yield* fs.chmod(`${scratch.secrets}/${file}`, 0o755);
        }

        return yield* searched(
          ctx,
          exhaust(
            {
              box: "every variant of the password command, for the migration identity and for the login",
              caseHang: Duration.seconds(10),
              coverage: requiredInSpace<CommandReached>([
                "command",
                "exited",
                "local",
                "not run",
                "silent",
              ]),
              generator: (source) => ({
                side: source.draw(element(["migration", "login"] as const)),
                variant: source.draw(element(commandVariants)),
              }),
              limit: commandVariants.length * 2,
              literal: Formatter.format,
              oracle: {
                kind: "specification",
                name: "GR8DES_PG_PASSWORD_COMMAND as scripts/db.sh and the edullm sign-in run it",
              },
              suite: "db/connection/password-command",
            },
            ({ side, variant }, c) =>
              Effect.gen(function* oneCase() {
                const environment: Environment & { GR8DES_PG_PASSWORD_COMMAND?: string } = {
                  GR8DES_PG_MIGRATION_PASSWORD: migrationPassword,
                  GR8DES_PG_SECRETS: scratch.secrets,
                  HOME: scratch.home,
                };
                const role = side === "migration" ? "grizzle_dev" : loginRole;
                if (variant === "empty") {
                  environment.GR8DES_PG_PASSWORD_COMMAND = "";
                }

                if (variant === "missing") {
                  environment.GR8DES_PG_PASSWORD_COMMAND = `${scratch.secrets}/no-such-command`;
                }

                if (variant === "shell text") {
                  environment.GR8DES_PG_PASSWORD_COMMAND = `echo ${role}`;
                }

                const script = commandScripts.find((named) => named.variant === variant);
                if (script !== undefined) {
                  environment.GR8DES_PG_PASSWORD_COMMAND = `${scratch.secrets}/${script.file}`;
                }

                const provider = ConfigProvider.layer(ConfigProvider.fromUnknown(environment));
                const password =
                  side === "migration"
                    ? (yield* migrationConnection.pipe(Effect.provide(provider))).password
                    : (yield* rootConnection.pipe(Effect.provide(provider))).password;
                const read = yield* passwordText(password).pipe(
                  Effect.result,
                  Effect.provide(provider),
                );

                if (variant === "unset" || variant === "empty") {
                  c.note("local");
                  assert.deepStrictEqual(
                    read,
                    Result.succeed(side === "migration" ? migrationPassword : secretsPassword),
                  );

                  return;
                }

                if (variant === "printing" || variant === "spaced") {
                  c.note("command");
                  assert.deepStrictEqual(
                    read,
                    Result.succeed(
                      variant === "printing" ? `password of ${role}` : `spaced password of ${role}`,
                    ),
                  );

                  return;
                }

                const failure = Result.isFailure(read) ? read.failure : undefined;

                assert.strictEqual(failure?._tag, "CredentialError", variant);

                const cause: unknown = failure?.cause;
                if (variant === "failing") {
                  c.note("exited");
                  assert.instanceOf(cause, PasswordCommandFailed);
                  assert.deepStrictEqual(
                    cause instanceof PasswordCommandFailed
                      ? { exitCode: cause.exitCode, role: cause.role }
                      : undefined,
                    { exitCode: 3, role },
                  );

                  return;
                }

                if (variant === "silent") {
                  c.note("silent");
                  assert.instanceOf(cause, PasswordCommandSilent);

                  return;
                }

                c.note("not run");
                assert.notInstanceOf(cause, PasswordCommandFailed);
                assert.notInstanceOf(cause, PasswordCommandSilent);
              }),
          ),
        );
      }),
  );

  it.effect(
    "reads a login's password, from its file or from the password command, for the role grizzle installs for the login: a login over the root and one of the same name over a level, each by file and by command, exhausted",
    (ctx) =>
      Effect.gen(function* passwordsByRole() {
        const fs = yield* FileSystem.FileSystem;
        const scratch = yield* scratchFolders;
        const [, printing] = commandScripts;

        yield* fs.writeFileString(`${scratch.secrets}/${printing.file}`, printing.text);
        yield* fs.chmod(`${scratch.secrets}/${printing.file}`, 0o755);
        for (const each of Object.values(loginsByLevel)) {
          const role = roleNameOf(each);

          yield* fs.writeFileString(`${scratch.secrets}/${role}.password`, `password of ${role}\n`);
        }

        return yield* searched(
          ctx,
          exhaust(
            {
              box: "a login over the root and one of the same name over a level, each by its password file and by the password command",
              caseHang: Duration.seconds(10),
              coverage: requiredInSpace<"command" | "file">(["command", "file"]),
              generator: (source) => ({
                at: source.draw(element(["root", "level"] as const)),
                from: source.draw(element(["file", "command"] as const)),
              }),
              limit: 4,
              literal: Formatter.format,
              oracle: {
                kind: "specification",
                name: "grizzle's roleNameOf, the role scripts/db.sh migrate gives each login its password for",
              },
              suite: "db/connection/login-roles",
            },
            ({ at, from }, c) =>
              Effect.gen(function* oneCase() {
                const each = loginsByLevel[at];
                const role = roleNameOf(each);
                const environment: Environment & { GR8DES_PG_PASSWORD_COMMAND?: string } = {
                  GR8DES_PG_SECRETS: scratch.secrets,
                  HOME: scratch.home,
                };
                if (from === "command") {
                  environment.GR8DES_PG_PASSWORD_COMMAND = `${scratch.secrets}/${printing.file}`;
                }

                c.note(from);

                const provider = ConfigProvider.layer(ConfigProvider.fromUnknown(environment));
                const connectionOf = yield* loginConnection.pipe(Effect.provide(provider));
                const read = yield* passwordText(connectionOf(roleNameOf(each)).password).pipe(
                  Effect.result,
                  Effect.provide(provider),
                );

                assert.deepStrictEqual(read, Result.succeed(`password of ${role}`), role);
              }),
          ),
        );
      }),
  );
});

/**
 * The local cluster's two connections against scripts/db.sh, whose `GR8DES_PG_*` block and
 * database-name rule are the specification: each setting's named variants carry the value or the
 * refusal that script gives them, and every combination of them is exhausted.
 */
import net from "node:net";
import { fileURLToPath } from "node:url";
import type { DbConnection } from "@bjornpagen/grizzle";
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
import { ClusterConfigError, loginConnection, migrationConnection } from "#pantry/db/connection.ts";

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
 * The login whose password file the login connection reads.
 */
const login = "qti__author_app";

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
  yield* fs.makeDirectory(scratch.secrets, { recursive: true });
  yield* fs.writeFileString(`${scratch.secrets}/${login}.password`, `  ${secretsPassword}  \n`);

  for (const database of databases) {
    if (Option.isSome(database.value)) {
      const folder = `${scratch.home}/.local/var/gr8des/${database.value.value}`;

      yield* fs.makeDirectory(folder, { recursive: true });
      yield* fs.writeFileString(
        `${folder}/${login}.password`,
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
  GR8DES_PG_DATABASE?: string;
  GR8DES_PG_HOST?: string;
  GR8DES_PG_MIGRATION_PASSWORD?: string;
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
                  login: loginConnection(login),
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
                const loginSide = yield* loginConnection(login).pipe(Effect.provide(provider));
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
});

/**
 * What scripts/db.sh sends psql and what it reports, with no database: a stub psql in place of
 * `GRIZZLE_PG_BIN`'s, which records the password and the connection string each connection is
 * given and connects nowhere, and stub password commands, held to the meaning src/db/connection.ts
 * gives `GR8DES_PG_PASSWORD_COMMAND`.
 */
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, FileSystem, Stream } from "effect";
import { ChildProcess, ChildProcessSpawner } from "effect/process";
import { scratchDirectory } from "#pantry/test/scratch.ts";

/**
 * The package folder, `packages/pantry`, which scripts/db.sh runs from.
 */
const packageRoot = path.resolve(import.meta.dirname, "..", "..");

/**
 * A psql that appends the password and the connection string it was given to `psql.log` beside
 * its folder, and prints nothing, as a query that finds no row does.
 */
const stubPsql = `#!/bin/sh
printf 'PGPASSWORD=%s %s\\n' "$PGPASSWORD" "$6" >> "$(dirname "$0")/../psql.log"
`;

/**
 * The variables of the process the tests run in that scripts/db.sh or the grizzle config reads,
 * removed from each run, so only a case's own settings reach it. `HOME` stays, for corepack's
 * pnpm; every default the script derives from it is set.
 */
const cleared = {
  GR8DES_GRIZZLE_CONFIG: undefined,
  GR8DES_PG_CA: undefined,
  GR8DES_PG_DATABASE: undefined,
  GR8DES_PG_HOST: undefined,
  GR8DES_PG_MIGRATION_PASSWORD: undefined,
  GR8DES_PG_MIGRATION_ROLE: undefined,
  GR8DES_PG_PASSWORD_COMMAND: undefined,
  GR8DES_PG_PASSWORD_COMMAND_TIMEOUT: undefined,
  GR8DES_PG_PORT: undefined,
} as const;

/**
 * A case's scratch folder, with the stub psql in `bin/`, a CA file that only exists, an empty
 * cluster state folder and an empty secrets folder.
 */
const scriptScratch = Effect.gen(function* scriptScratch() {
  const fs = yield* FileSystem.FileSystem;
  const root = yield* scratchDirectory("db-script-");
  const bin = `${root}/bin`;
  const state = `${root}/state`;

  yield* fs.makeDirectory(bin);
  yield* fs.makeDirectory(state);
  yield* fs.writeFileString(`${bin}/psql`, stubPsql);
  yield* fs.chmod(`${bin}/psql`, 0o755);
  yield* fs.writeFileString(`${root}/ca.crt`, "a CA that is only read by psql, which is a stub\n");

  /**
   * The lines the stub psql logged, one per connection, none where it never ran.
   */
  const psqlRuns = fs.readFileString(`${root}/psql.log`).pipe(
    Effect.map((text) => text.split("\n").filter((line) => line !== "")),
    Effect.orElseSucceed((): readonly string[] => []),
  );

  /**
   * Write an executable password command into the scratch folder.
   *
   * @param name - Its file name.
   * @param body - Its shell text after the `#!/bin/sh` line.
   * @returns Its path.
   */
  const command = Effect.fn("test.dbScript.command")(function* command(name: string, body: string) {
    const file = `${root}/${name}`;

    yield* fs.writeFileString(file, `#!/bin/sh\n${body}\n`);
    yield* fs.chmod(file, 0o755);

    return file;
  });

  return {
    ca: `${root}/ca.crt`,
    command,
    environment: {
      ...cleared,
      GR8DES_PG_SECRETS: `${root}/secrets`,
      GRIZZLE_PG_BIN: bin,
      GRIZZLE_PG_STATE: state,
    },
    psqlRuns,
    state,
  };
});

/**
 * Run scripts/db.sh with one subcommand under the environment given, and collect how it ended.
 *
 * @param subcommand - `create`, `migrate`, `drop` or `check-clear`.
 * @param environment - The variables set or removed for the run.
 * @returns The exit code and what the script wrote to standard error and standard output.
 */
const runScript = Effect.fn("test.dbScript.run")(function* runScript(
  subcommand: string,
  environment: Readonly<Record<string, string | undefined>>,
) {
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;

  return yield* Effect.scoped(
    Effect.gen(function* collect() {
      const handle = yield* spawner.spawn(
        ChildProcess.make(path.join(packageRoot, "scripts", "db.sh"), [subcommand], {
          cwd: packageRoot,
          env: environment,
          extendEnv: true,
          stdin: "ignore",
        }),
      );

      return yield* Effect.all(
        {
          code: handle.exitCode.pipe(Effect.map((code): number => code)),
          stderr: Stream.mkString(Stream.decodeText(handle.stderr)),
          stdout: Stream.mkString(Stream.decodeText(handle.stdout)),
        },
        { concurrency: "unbounded" },
      );
    }),
  ).pipe(Effect.orDie);
});

/**
 * The password commands whose run gives no password, by the shell text after `#!/bin/sh`, and the
 * exit code the script must report: a run that exits otherwise than 0 is refused whatever it
 * printed, as src/db/connection.ts's `PasswordCommandFailed` refuses it, and one that exits 0 with
 * nothing but whitespace as its `PasswordCommandSilent` does.
 */
const refusedCommands = [
  {
    body: "printf 'half a password'\nexit 3",
    exitCode: 3,
    name: "exits 3 after printing part of a password",
  },
  {
    body: "echo 'error: not signed in'\nexit 1",
    exitCode: 1,
    name: "exits 1 with an error on standard output",
  },
  { body: "printf '  \\n'", exitCode: 0, name: "exits 0 printing only whitespace" },
] as const;

layer(NodeServices.layer, { excludeTestServices: true })(
  "scripts/db.sh, its password command and its CA, with no database",
  (it) => {
    for (const refused of refusedCommands) {
      it.effect(
        `refuses a password command that ${refused.name}, naming its exit code, the command and the role, and starts no psql: create, drop and check-clear`,
        () =>
          Effect.gen(function* refusedCommand() {
            const scratch = yield* scriptScratch;
            const command = yield* scratch.command("password.sh", refused.body);
            const environment = {
              ...scratch.environment,
              GR8DES_PG_CA: scratch.ca,
              GR8DES_PG_PASSWORD_COMMAND: command,
            };

            for (const [subcommand, code] of [
              ["create", 1],
              ["drop", 1],
              ["check-clear", 2],
            ] as const) {
              const run = yield* runScript(subcommand, environment);

              assert.strictEqual(run.code, code, `${subcommand}: ${run.stderr}`);
              assert.include(
                run.stderr,
                `The password command ${command} exited with code ${refused.exitCode} for the role grizzle_dev`,
              );
              assert.include(run.stderr, "GR8DES_PG_PASSWORD_COMMAND");
              assert.notInclude(run.stdout, "half a password");
              assert.notInclude(run.stderr, "half a password");
            }

            assert.deepStrictEqual(yield* scratch.psqlRuns, []);
          }),
      );
    }

    it.effect(
      "sends psql the password a command prints, trimmed, on every connection, verifying against GR8DES_PG_CA",
      () =>
        Effect.gen(function* printedPassword() {
          const scratch = yield* scriptScratch;
          const command = yield* scratch.command(
            "password.sh",
            `[ "$1" = grizzle_dev ] || exit 9\nprintf '  the-password \\n'`,
          );
          const run = yield* runScript("create", {
            ...scratch.environment,
            GR8DES_PG_CA: scratch.ca,
            GR8DES_PG_PASSWORD_COMMAND: command,
          });

          assert.strictEqual(run.code, 0, run.stderr);
          assert.strictEqual(run.stdout, "gr8des_qti: created\n");

          const runs = yield* scratch.psqlRuns;

          assert.lengthOf(runs, 2);

          for (const line of runs) {
            assert.isTrue(line.startsWith("PGPASSWORD=the-password "), line);
            assert.include(line, `sslrootcert=${scratch.ca}`);
          }
        }),
    );

    it.effect(
      "names the local cluster's CA as GRIZZLE_PG_STATE's where GR8DES_PG_CA is unset or empty, and as GR8DES_PG_CA's where it is set: grizzle migrate's report and psql's CA",
      () =>
        Effect.gen(function* missingCa() {
          const scratch = yield* scriptScratch;
          const command = yield* scratch.command("password.sh", "echo the-password");
          const local = `${scratch.state}/tls/ca.crt`;
          const named = `${scratch.state}/named.crt`;

          for (const ca of [undefined, ""]) {
            const run = yield* runScript("migrate", {
              ...scratch.environment,
              GR8DES_PG_CA: ca,
              GR8DES_PG_PASSWORD_COMMAND: command,
            });

            assert.notStrictEqual(run.code, 0);
            assert.include(
              run.stderr,
              `Cannot read the local database's CA certificate at ${local}.`,
            );
            assert.include(run.stderr, "pnpm pg:init");
            assert.notInclude(run.stderr, "the file GR8DES_PG_CA names");

            yield* runScript("create", {
              ...scratch.environment,
              GR8DES_PG_CA: ca,
              GR8DES_PG_PASSWORD_COMMAND: command,
            });
          }

          const runs = yield* scratch.psqlRuns;

          assert.lengthOf(runs, 4);

          for (const line of runs) {
            assert.include(line, `sslrootcert=${local}`);
          }

          const run = yield* runScript("migrate", {
            ...scratch.environment,
            GR8DES_PG_CA: named,
            GR8DES_PG_PASSWORD_COMMAND: command,
          });

          assert.notStrictEqual(run.code, 0);
          assert.include(run.stderr, `${named}, the file GR8DES_PG_CA names`);
        }),
    );
  },
);

/**
 * Witnesses that each committed served file, `migrations/<schema>/served/<login>.json`, is the file
 * `grizzle generate` writes for its login from the schema and the workloads in source, with no
 * database and no cluster. The author login's `DbLayer` (`#pantry/cli/layer.ts`) and every database
 * test serve the committed file and compile nothing, so a schema or workload change committed
 * without `grizzle generate` fails here, in the free suite, instead of running stale SQL there.
 *
 * The compile is grizzle's `compileServed` over each login `grizzle.config.ts` configures, under
 * the `snapshot.json` committed beside its file: the one compile `grizzle generate` commits and
 * `grizzle check` holds the committed file to. It yields the file's JSON value, parsed from the
 * text grizzle writes, and grizzle writes a served file as the one canonical text of its value (RFC
 * 8785, keys sorted). Both sides are parsed from such a text, so they reorder their keys alike, and
 * their `JSON.stringify` texts are equal exactly when their values are.
 *
 * Its bound is every file in a `served/` folder under `migrations/`, held to {@link configured},
 * which mirrors `grizzle.config.ts`'s `logins`. Residual: a change that moves `snapshot.json` and
 * nothing a served file holds, which a compile under the committed snapshot cannot see; `grizzle
 * check` refuses it as an ungenerated change in the integration checks (AGENTS.md, Workflow).
 *
 * It compiles in process rather than spawning `grizzle check`: loading `grizzle.config.ts` reads
 * the cluster's CA (`#pantry/cli/connection.ts`), and this witness needs neither the cluster nor
 * its state folder.
 *
 * @see https://github.com/bjornpagen/grizzle/blob/b927d9995ecf254230da725c65357a420b392b91/packages/grizzle/src/adapter/public/compile.ts#L30-L61
 * @see https://github.com/bjornpagen/grizzle/blob/b927d9995ecf254230da725c65357a420b392b91/packages/grizzle/src/cli/check.ts#L274-L320
 */
import path from "node:path";
import type { AnyLogin } from "@bjornpagen/grizzle";
import { compileServed } from "@bjornpagen/grizzle/compile";
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it, layer } from "@effect/vitest";
import { Effect, FileSystem, Schema } from "effect";
import { servedPath } from "#pantry/db/served.ts";
import { AuthorApp } from "#pantry/qti/logins.ts";

/**
 * The package's `migrations` folder, which `grizzle.config.ts` names and grizzle lays out as
 * `<schema>/snapshot.json` beside `<schema>/served/<login>.json`.
 */
const migrationsDirectory = path.resolve(import.meta.dirname, "..", "..", "migrations");

/**
 * The logins `grizzle.config.ts` configures, each with the folder of its schema under
 * {@link migrationsDirectory}: the author application over `Qti`. The config cannot be imported
 * here, since loading it reads the cluster's CA, so this list mirrors its `logins`, and the folder
 * scan holds the committed served files to it.
 */
const configured: readonly { readonly login: AnyLogin; readonly schema: string }[] = [
  { login: AuthorApp, schema: "qti" },
];

/**
 * How long one login's compile and comparison may take, the compile nearly all of it: 3.7 s on an
 * idle 8-core machine. On that machine beside 150 busy loops, Measured 2026-11-10: 80.3 s at a load
 * average of 63.7 to 151.4, and 74.3 s at a load average of 77.2 to 151.4; the constant is over
 * twice the slowest.
 */
const servedTimeoutMs = 200_000;

/**
 * The text of a committed migration file, read as the JSON value it holds.
 */
const JsonText = Schema.fromJsonString(Schema.Json);

/**
 * A committed migration file could not be read or is no JSON. The usual cause is a checkout made
 * without git-lfs, which leaves a pointer file where the committed file belongs.
 */
class CommittedFileError extends Schema.TaggedError<CommittedFileError>()("CommittedFileError", {
  path: Schema.String,
  reason: Schema.Unknown,
}) {
  /**
   * The file, why that is likely, and the command that fixes it.
   */
  override get message(): string {
    return `Cannot read the committed migration file ${this.path} as JSON. Without git-lfs a committed migration file checks out as a pointer file: run \`git lfs pull\` in this checkout.`;
  }
}

/**
 * Read a committed migration file as the JSON value it holds.
 *
 * @param file - The file's absolute path.
 * @returns Its value, or a {@link CommittedFileError} when it cannot be read or is no JSON.
 */
const readCommitted = Effect.fnUntraced(function* readCommitted(file: string) {
  const fs = yield* FileSystem.FileSystem;

  return yield* fs.readFileString(file).pipe(
    Effect.flatMap(Schema.decodeUnknownEffect(JsonText)),
    Effect.mapError((reason) => new CommittedFileError({ path: file, reason })),
  );
});

/**
 * Find where two JSON texts first differ.
 *
 * @param compiled - The text of the value grizzle compiles.
 * @param committed - The text of the value the committed file holds.
 * @returns The offset of the first character they differ at, the shorter's length where it is the
 *   start of the other, or none where they are equal.
 */
const partingOffset = (compiled: string, committed: string): number | undefined => {
  if (compiled === committed) {
    return undefined;
  }

  let at = 0;
  while (at < compiled.length && compiled[at] === committed[at]) {
    at += 1;
  }

  return at;
};

/**
 * Quote a JSON text around an offset for a failure message: up to 80 characters each side of it.
 *
 * @param text - The JSON text.
 * @param at - The offset.
 * @returns The excerpt, as a JSON string.
 */
const excerpt = (text: string, at: number): string =>
  JSON.stringify(text.slice(Math.max(0, at - 80), at + 80));

/**
 * Read a planted file as the witness reads a committed one, and write its value again.
 *
 * @param json - The planted file's text.
 * @returns The `JSON.stringify` text of its value.
 */
const textOf = (json: string): string => JSON.stringify(Schema.decodeUnknownSync(JsonText)(json));

layer(NodeServices.layer)("the committed served files", (live) => {
  live.effect("holds a served file for each configured login, and none for another", () =>
    Effect.gen(function* servedFiles() {
      const fs = yield* FileSystem.FileSystem;
      const entries = yield* fs.readDirectory(migrationsDirectory, { recursive: true });
      const committed = entries
        .filter((entry) => path.basename(path.dirname(entry)) === "served")
        .toSorted();

      // Oracle: grizzle's layout, `<schema>/served/<login>.json`, one per configured login.
      // Bound: every folder named `served` under `migrations/`; residual none.
      assert.deepStrictEqual(
        committed,
        configured
          .map(({ login, schema }) => path.join(schema, "served", `${login.name}.json`))
          .toSorted(),
        `the served files under ${migrationsDirectory} are not one per login of grizzle.config.ts: list a new login in \`configured\` here, or run \`pnpm exec grizzle generate\` in packages/pantry, which removes the file of a login the config no longer lists`,
      );
      assert.include(
        configured.map(({ login, schema }) =>
          path.join(migrationsDirectory, schema, "served", `${login.name}.json`),
        ),
        servedPath,
        "the file the author login's DbLayer serves is one this witness compiles",
      );
    }),
  );

  for (const { login, schema } of configured) {
    const file = path.join(schema, "served", `${login.name}.json`);

    live.effect(
      `holds ${file} as grizzle generate compiles login ${login.name} under ${schema}/snapshot.json`,
      () =>
        Effect.gen(function* servedMatches() {
          const snapshot = yield* readCommitted(
            path.join(migrationsDirectory, schema, "snapshot.json"),
          );
          const committed = JSON.stringify(
            yield* readCommitted(path.join(migrationsDirectory, file)),
          );
          const compiled = JSON.stringify(yield* compileServed(login, snapshot, login.workload));
          const at = partingOffset(compiled, committed);

          // Oracle: grizzle's `compileServed`, the compile `grizzle generate` writes the file from.
          // Bound: the login's whole file; residual a change that moves snapshot.json alone.
          assert.isUndefined(
            at,
            at === undefined
              ? ""
              : `migrations/${file} is not the served file grizzle generate writes for login ${login.name}: their JSON parts at character ${String(at)}, where the compile reads ${excerpt(compiled, at)} and the committed file ${excerpt(committed, at)}. Run \`pnpm fix\`, then \`pnpm exec grizzle generate\` in packages/pantry, and commit what it writes.`,
          );
        }),
      servedTimeoutMs,
    );
  }
});

describe("the served file comparison", () => {
  it("finds where planted files part, and nothing where they hold one value", () => {
    // Oracle: the comparison's rule on the named cases. Live: one canonical text parsed twice,
    // whose integer keys `JSON.parse` moves ahead of the rest alike. Wild: a changed leaf, a key
    // the committed side lacks, and a longer array.
    const file = '{"10":0,"2":0,"a":[1,{"b":"x"}],"c":true}';

    assert.strictEqual(textOf(file), '{"2":0,"10":0,"a":[1,{"b":"x"}],"c":true}');
    assert.isUndefined(partingOffset(textOf(file), textOf(file)));
    assert.deepStrictEqual(
      [
        '{"10":0,"2":0,"a":[1,{"b":"y"}],"c":true}',
        '{"10":0,"2":0,"a":[1,{"b":"x"}]}',
        '{"10":0,"2":0,"a":[1,{"b":"x"},2],"c":true}',
      ].map((committed) => partingOffset(textOf(file), textOf(committed))),
      [27, 31, 30],
    );
  });
});

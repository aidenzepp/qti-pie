/**
 * The entry's startup: importing `@qti-pie/pantry` in a fresh Node process, from an empty working
 * folder with no `GR8DES_*` variable, succeeds and builds no schema, and the entry's static graph
 * reaches neither the command line, the database connection nor a module that waits at load (GOAL
 * criterion 5, spec U13). A library an app imports must load without side effects.
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it, layer } from "@effect/vitest";
import { Effect, FileSystem, Stream } from "effect";
import { ChildProcess, ChildProcessSpawner } from "effect/process";
import { fileScratchDirectory } from "#pantry/test/scratch.ts";
import { cliProcessTestTimeoutMs } from "#pantry/test/settings.ts";
import { valueImports } from "#pantry/test/module-imports.ts";

/**
 * The `src` folder, where `#pantry/<x>` resolves to `src/<x>`.
 */
const sourceRoot = import.meta.dirname;

/**
 * The folder this file owns under `work/`, removed after its last test: it holds the empty working
 * folder and the script the child process runs. The script sits inside `packages/pantry`, so Node
 * resolves both the package's own name and its `#pantry/*` imports for it.
 */
const scratch = fileScratchDirectory("index-startup-");

/**
 * The prefixes no module of the entry's static graph may import: the command line, and the two
 * modules that open and serve the database connection.
 */
const entryForbidden = [
  "#pantry/cli.ts",
  "#pantry/cli/",
  "#pantry/db/connection.ts",
  "#pantry/db/layer.ts",
];

/**
 * A statement of a module that waits at load: `await …`, `for await (…)`, or a declaration whose
 * value starts with `await`, at the start of a line.
 *
 * The repository's formatter indents every line inside a function, class or block, so a statement
 * that starts a line unindented is at the module's top level. A declaration may break before its
 * `await`, so the space after `=` spans lines.
 */
const topLevelAwait = /^(?:export\s+)?(?:(?:const|let|var)\s+[^=;]+=\s*)?(?:for\s+)?await\b/mu;

/**
 * Report whether a module's text waits at load.
 *
 * @param source - The text of a TypeScript module.
 * @returns Whether a statement outside any comment awaits at the module's top level.
 */
const awaitsAtLoad = (source: string): boolean =>
  topLevelAwait.test(source.replaceAll(/\/\*[\s\S]*?\*\//gu, "").replaceAll(/^\s*\/\/.*$/gmu, ""));

/**
 * List every module the entry reaches through the `#pantry/` imports that bring a value in when it
 * loads (`#pantry/test/module-imports.ts` `valueImports`).
 *
 * @param entry - The absolute path of the module to start from.
 * @param read - Reads a module's text.
 * @returns Each module reached, the entry included, with the specifiers it imports.
 */
const staticGraph = (
  entry: string,
  read: (file: string) => string,
): ReadonlyMap<string, readonly string[]> => {
  const graph = new Map<string, readonly string[]>();
  const pending = [entry];

  while (pending.length > 0) {
    const file = pending.pop() ?? entry;

    if (!graph.has(file)) {
      const specifiers = valueImports(read(file)).map(({ specifier }) => specifier);

      graph.set(file, specifiers);
      pending.push(
        ...specifiers
          .filter((specifier) => specifier.startsWith("#pantry/"))
          .map((specifier) => path.join(sourceRoot, specifier.slice("#pantry/".length))),
      );
    }
  }

  return graph;
};

/**
 * Read a module's text from the tree.
 *
 * @param file - The module's absolute path.
 * @returns Its text.
 */
const readSource = (file: string): string => readFileSync(file, "utf-8");

/**
 * This process's environment without its `GR8DES_*` variables, so the child reads none.
 */
const childEnv: Readonly<Record<string, string>> = Object.fromEntries(
  Object.entries(process.env).filter(
    (entry): entry is [string, string] => !entry[0].startsWith("GR8DES_") && entry[1] !== undefined,
  ),
);

/**
 * Write a script that imports the public entry, then the schema module, and prints whether the
 * schema is built; run it in a fresh Node process from an empty folder; and remove both after.
 *
 * @returns The exit code, and what the child wrote to standard output and standard error.
 */
const importEntryInChild = Effect.fn("index.startup.test.importEntryInChild")(
  function* importEntryInChild() {
    const fs = yield* FileSystem.FileSystem;
    const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
    const cwd = path.join(scratch, "empty");
    const script = path.join(scratch, "startup.mjs");

    yield* fs.makeDirectory(cwd);
    yield* fs.writeFileString(
      script,
      [
        'import "@qti-pie/pantry";',
        'import { qtiBuilt } from "#pantry/qti/schema.ts";',
        "",
        "console.log(qtiBuilt());",
        "",
      ].join("\n"),
    );

    return yield* Effect.scoped(
      Effect.gen(function* collect() {
        const handle = yield* spawner.spawn(
          ChildProcess.make(process.execPath, [script], { cwd, env: childEnv, stdin: "ignore" }),
        );

        return yield* Effect.all(
          {
            code: handle.exitCode,
            stderr: Stream.mkString(Stream.decodeText(handle.stderr)),
            stdout: Stream.mkString(Stream.decodeText(handle.stdout)),
          },
          { concurrency: "unbounded" },
        );
      }),
    ).pipe(
      Effect.ensuring(
        Effect.ignore(
          Effect.all([fs.remove(script), fs.remove(cwd, { force: true, recursive: true })]),
        ),
      ),
      Effect.orDie,
    );
  },
);

describe("awaitsAtLoad", () => {
  it("finds a top-level await, a for await and a declaration that awaits, across a line break", () => {
    for (const source of [
      "await load();\n",
      "for await (const line of lines) {\n  print(line);\n}\n",
      "export const value = await load();\n",
      "const { a } =\n  await load();\n",
    ]) {
      assert.isTrue(awaitsAtLoad(source), source);
    }
  });

  it("finds no await inside a function, an arrow or a comment", () => {
    for (const source of [
      "async function load() {\n  await read();\n}\n",
      "const load = async () => await read();\n",
      "// await load();\n/* await load(); */\n",
    ]) {
      assert.isFalse(awaitsAtLoad(source), source);
    }
  });
});

layer(NodeServices.layer, { excludeTestServices: true })("the public entry's startup", (live) => {
  live.effect(
    "imports in a fresh process, from an empty folder with no GR8DES_ variable, and builds no schema",
    () =>
      Effect.gen(function* importsClean() {
        const { code, stderr, stdout } = yield* importEntryInChild();

        assert.strictEqual(code, ChildProcessSpawner.ExitCode(0), stderr);
        assert.strictEqual(stdout.trim(), "false");
      }),
    cliProcessTestTimeoutMs,
  );
});

describe("the public entry's static graph", () => {
  it("reaches no command-line, connection or database-layer module statically", () => {
    const graph = staticGraph(path.join(sourceRoot, "index.ts"), readSource);
    const offences = [...graph].flatMap(([file, specifiers]) =>
      specifiers
        .filter((specifier) => entryForbidden.some((prefix) => specifier.startsWith(prefix)))
        .map((specifier) => `${path.relative(sourceRoot, file)}: ${specifier}`),
    );

    // The walk reaches the schema and a program, so an empty result is not an empty graph.
    for (const file of ["qti/schema.ts", "api/import.ts"]) {
      assert.isTrue(graph.has(path.join(sourceRoot, file)), file);
    }

    assert.deepStrictEqual(offences, []);
  });

  it("reaches no module that awaits at load", () => {
    const waiting = [...staticGraph(path.join(sourceRoot, "index.ts"), readSource).keys()]
      .filter((file) => awaitsAtLoad(readSource(file)))
      .map((file) => path.relative(sourceRoot, file));

    assert.deepStrictEqual(waiting, []);
  });
});

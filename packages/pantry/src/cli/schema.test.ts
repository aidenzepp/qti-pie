import fs from "node:fs";
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { Effect, Exit, Schema } from "effect";
import { captureCli, spawnCli } from "#pantry/test/cli.ts";

/**
 * The package folder, `packages/pantry`, where `schema/` and `scripts/` are.
 */
const packageRoot = path.resolve(import.meta.dirname, "..", "..");

/**
 * The environment of a run. `schema` reads no configuration, so the database points at nothing.
 */
const env = {
  GR8DES_PG_PORT: "1",
  GRIZZLE_PG_STATE: path.join(packageRoot, "work", "cli-schema", "state"),
  HOME: path.join(packageRoot, "work", "cli-schema", "home"),
} as const;

/**
 * What `JSON.parse` returns, checked to be an object keyed by strings.
 */
const parseObject = (text: string): Readonly<Record<string, Schema.Json>> =>
  Schema.decodeUnknownSync(Schema.Record(Schema.String, Schema.Json))(JSON.parse(text));

/**
 * The property names that hold a count, a size in bytes or an exit code.
 */
const countProperties = new Set(["bytes", "differing", "exit_code", "relations", "rows"]);

/**
 * Whether a value is a JSON object, which is not an array.
 */
const isObject = Schema.is(Schema.Record(Schema.String, Schema.Json));

/**
 * Every property schema in a document, found anywhere in it, whose key is one of `countProperties`.
 */
const countSchemas = (node: Schema.Json): readonly Schema.Json[] => {
  if (Array.isArray(node)) {
    return node.flatMap(countSchemas);
  }

  if (!isObject(node)) {
    return [];
  }

  return Object.entries(node).flatMap(([key, value]) => {
    const nested = countSchemas(value);

    if (key !== "properties" || !isObject(value)) {
      return nested;
    }

    return [
      ...Object.entries(value)
        .filter(([property]) => countProperties.has(property))
        .map(([, schema]) => schema),
      ...nested,
    ];
  });
};

/**
 * The names `qti schema` lists: the keys of the document it prints with no argument.
 */
const listedNames = Effect.gen(function* listNames() {
  const { stdout } = yield* captureCli(["schema"], { env });

  return Object.keys(parseObject(stdout));
});

layer(NodeServices.layer, { excludeTestServices: true })("qti schema, database-free", (it) => {
  it.effect("lists the envelopes of every command and the error", () =>
    Effect.gen(function* listsEnvelopes() {
      const names = yield* listedNames;

      for (const name of ["error", "export", "import", "roundtrip"]) {
        assert.include(names, name);
      }
    }),
  );

  it.effect("each committed file decodes to what qti schema prints, in draft 2020-12", () =>
    Effect.gen(function* committedFiles() {
      for (const name of yield* listedNames) {
        const { exit, stdout } = yield* captureCli(["schema", name], { env });
        const committed = parseObject(
          fs.readFileSync(path.join(packageRoot, "schema", `${name}.json`), "utf-8"),
        );

        assert.isTrue(Exit.isSuccess(exit));
        assert.deepStrictEqual(committed, parseObject(stdout));
        assert.strictEqual(
          parseObject(stdout)["$schema"],
          "https://json-schema.org/draft/2020-12/schema",
        );
      }
    }),
  );

  it.effect(
    "every count, size and exit code in a document is an integer, never the string NaN",
    () =>
      Effect.gen(function* countsAreIntegers() {
        for (const name of yield* listedNames) {
          const { stdout } = yield* captureCli(["schema", name], { env });
          const counts = countSchemas(parseObject(stdout));

          assert.isAbove(counts.length, 0, name);

          for (const count of counts) {
            assert.isTrue(isObject(count) && count["type"] === "integer", name);
          }
        }
      }),
  );

  it.effect("with no argument prints one document keyed by those names", () =>
    Effect.gen(function* keyedDocument() {
      const { stdout } = yield* captureCli(["schema"], { env });
      const all = parseObject(stdout);

      for (const name of Object.keys(all)) {
        const one = yield* captureCli(["schema", name], { env });

        assert.deepStrictEqual(all[name], parseObject(one.stdout));
      }
    }),
  );

  it.effect("an unknown name is a usage error that names the valid names", () =>
    Effect.gen(function* unknownName() {
      const names = yield* listedNames;
      const { code, stderr, stdout } = yield* spawnCli(["schema", "frobnicate"], { env });

      assert.strictEqual(code, 2);
      assert.strictEqual(stdout, "");

      for (const name of names) {
        assert.include(stderr, name);
      }
    }),
  );

  it.effect("scripts/anc.sh schema exits 0 with JSON on standard output", () =>
    Effect.gen(function* ancProbe() {
      const { spawnSync } = yield* Effect.promise(() => import("node:child_process"));
      const result = spawnSync(path.join(packageRoot, "scripts", "anc.sh"), ["schema"], {
        encoding: "utf-8",
        stdio: ["ignore", "pipe", "pipe"],
      });

      assert.strictEqual(result.status, 0);
      assert.deepStrictEqual(Object.keys(parseObject(result.stdout)), yield* listedNames);
    }),
  );
});

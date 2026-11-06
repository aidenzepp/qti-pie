import { randomUUID } from "node:crypto";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterAll, assert, beforeAll, describe, it } from "@effect/vitest";
import { ConfigProvider, Console, Effect } from "effect";
import { cacheTags, caches } from "#plate/test/caches.ts";

/**
 * The scratch folder this run owns, under the package's git-ignored `work/`. Its name is new for
 * each run, so two runs at once never share or remove each other's files.
 */
const scratch = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "work",
  `caches-test-${randomUUID()}`,
);

/**
 * A home folder that holds no `.cache/gr8des`, so every cache is missing below it.
 */
const emptyHome = path.join(scratch, "empty-home");

/**
 * A home folder where every cache's path exists, as an empty directory or an empty file.
 */
const fullHome = path.join(scratch, "full-home");

/**
 * An existing folder that `PLATE_CORPUS_DIR` names, standing in for the corpus root.
 */
const corpusFolder = path.join(scratch, "corpus");

/**
 * The tags whose cache is one file; every other cache is a directory.
 */
const fileTags = new Set(["conformance-text", "xsd-datatypes", "web-features"]);

/**
 * The tags in the order {@link caches} declares them.
 */
const tagOrder = [
  "corpus",
  "qti-xsd",
  "rptemplates",
  "conformance-text",
  "xsd-datatypes",
  "web-features",
];

/**
 * Run an effect with a provider over `env` alone, never the host environment.
 *
 * @param env The settings the provider holds.
 * @returns The effect, reading only `env`.
 */
const under =
  (env: Record<string, string>) =>
  <A, E>(effect: Effect.Effect<A, E>): Effect.Effect<A, E> =>
    effect.pipe(Effect.provide(ConfigProvider.layer(ConfigProvider.fromUnknown(env))));

/**
 * Run {@link cacheTags} with a provider over `env` and a console that keeps its error lines.
 *
 * @param env The settings the provider holds.
 * @returns The tags, and every line `cacheTags` printed, in order.
 */
const tagsUnder = (env: Record<string, string>) => {
  const lines: string[] = [];
  const console: Console.Console = {
    ...globalThis.console,
    error: (...args: readonly unknown[]) => {
      lines.push(args.join(" "));
    },
  };

  return cacheTags.pipe(
    Effect.provideService(Console.Console, console),
    under(env),
    Effect.map((tags) => ({ lines, tags })),
  );
};

beforeAll(() => {
  mkdirSync(emptyHome, { recursive: true });
  mkdirSync(corpusFolder, { recursive: true });
});

afterAll(() => {
  rmSync(scratch, { force: true, recursive: true });
});

describe("test/caches.ts", () => {
  it.effect("an empty home skips every cache's tag, and each description names its path", () =>
    Effect.gen(function* emptyHomeSkips() {
      const { lines, tags } = yield* tagsUnder({ HOME: emptyHome });
      const paths = yield* Effect.all(caches.map((cache) => cache.path)).pipe(
        under({ HOME: emptyHome }),
      );

      assert.deepStrictEqual(
        tags.map((tag) => tag.name),
        tagOrder,
      );
      assert.deepStrictEqual(
        tags.map((tag) => tag.skip),
        tagOrder.map(() => true),
      );

      for (const [index, tag] of tags.entries()) {
        const cache = caches[index];
        const at = paths[index];

        assert.isDefined(cache);
        assert.isDefined(at);
        assert.isTrue(at.startsWith(emptyHome), at);
        assert.include(tag.description, at, tag.name);
        assert.include(tag.description, cache.variable, tag.name);
      }

      assert.lengthOf(lines, tagOrder.length);

      for (const [index, line] of lines.entries()) {
        assert.isTrue(line.startsWith("plate: "), line);
        assert.include(line, `tagged ${tagOrder[index]}`, line);
        assert.include(line, "PLATE_REQUIRE_CACHES=1", line);
      }
    }),
  );

  it.effect("PLATE_REQUIRE_CACHES=1 skips no tag, and says the tests will fail", () =>
    Effect.gen(function* requiredRuns() {
      const { lines, tags } = yield* tagsUnder({ HOME: emptyHome, PLATE_REQUIRE_CACHES: "1" });

      assert.deepStrictEqual(
        tags.map((tag) => tag.name),
        tagOrder,
      );
      assert.deepStrictEqual(
        tags.map((tag) => tag.skip),
        tagOrder.map(() => false),
      );
      assert.lengthOf(lines, tagOrder.length);

      for (const line of lines) {
        assert.include(line, "will fail", line);
      }
    }),
  );

  it.effect("a home where every cache's path exists skips no tag and prints nothing", () =>
    Effect.gen(function* fullHomeRuns() {
      const paths = yield* Effect.all(caches.map((cache) => cache.path)).pipe(
        under({ HOME: fullHome }),
      );

      yield* Effect.sync(() => {
        for (const [index, at] of paths.entries()) {
          if (fileTags.has(caches[index]?.tag ?? "")) {
            mkdirSync(path.dirname(at), { recursive: true });
            writeFileSync(at, "");
          } else {
            mkdirSync(at, { recursive: true });
          }
        }
      });

      const { lines, tags } = yield* tagsUnder({ HOME: fullHome });

      assert.deepStrictEqual(
        tags.map((tag) => tag.name),
        tagOrder,
      );
      assert.deepStrictEqual(
        tags.map((tag) => tag.skip),
        tagOrder.map(() => false),
      );
      assert.deepStrictEqual(lines, []);
    }),
  );

  it.effect("PLATE_CORPUS_DIR naming an existing folder runs only the corpus tag", () =>
    Effect.gen(function* corpusRelocated() {
      const { lines, tags } = yield* tagsUnder({
        HOME: emptyHome,
        PLATE_CORPUS_DIR: corpusFolder,
      });

      assert.deepStrictEqual(
        tags.map((tag) => [tag.name, tag.skip]),
        tagOrder.map((name) => [name, name !== "corpus"]),
      );
      assert.lengthOf(lines, tagOrder.length - 1);
    }),
  );

  it.effect("a PLATE_REQUIRE_CACHES that is not a boolean fails with a ConfigError", () =>
    Effect.gen(function* malformedRequired() {
      const error = yield* Effect.flip(
        tagsUnder({ HOME: emptyHome, PLATE_REQUIRE_CACHES: "maybe" }),
      );

      assert.strictEqual(error._tag, "ConfigError");
    }),
  );
});

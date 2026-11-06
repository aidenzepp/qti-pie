import { randomUUID } from "node:crypto";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterAll, assert, beforeAll, describe, it } from "@effect/vitest";
import { ConfigProvider, Console, Effect } from "effect";
import type { CacheTag } from "#plate/test/caches.ts";
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
 * Construct a function that runs an effect with a provider over `env` alone, never the host
 * environment.
 *
 * @param env The settings the provider holds.
 * @returns A function that gives its effect, reading only `env`.
 */
const under =
  (env: Record<string, string>) =>
  <A, E>(effect: Effect.Effect<A, E>): Effect.Effect<A, E> =>
    effect.pipe(Effect.provide(ConfigProvider.layer(ConfigProvider.fromUnknown(env))));

/**
 * Make every cache's path exist under `home`, as an empty directory or an empty file.
 *
 * @param home The home folder.
 * @returns An effect that creates the paths; running it again changes nothing.
 */
const fill = (home: string) =>
  Effect.gen(function* fillHome() {
    const paths = yield* Effect.all(caches.map((cache) => cache.path)).pipe(under({ HOME: home }));

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
  });

/**
 * A tag's `skip`, or `"absent"` when the tag has no `skip` key, so an assertion tells a missing
 * key from one that holds a value.
 *
 * @param tag The tag.
 * @returns `"absent"`, or the value of the tag's own `skip` key.
 */
const skipOf = (tag: CacheTag): CacheTag["skip"] | "absent" =>
  Object.hasOwn(tag, "skip") ? tag.skip : "absent";

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
        tags.map(skipOf),
        tagOrder.map(() => true as const),
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

  it.effect("PLATE_REQUIRE_CACHES=1 gives no tag a skip key, and says the tests will fail", () =>
    Effect.gen(function* requiredRuns() {
      const { lines, tags } = yield* tagsUnder({ HOME: emptyHome, PLATE_REQUIRE_CACHES: "1" });

      assert.deepStrictEqual(
        tags.map((tag) => tag.name),
        tagOrder,
      );
      assert.deepStrictEqual(
        tags.map(skipOf),
        tagOrder.map(() => "absent" as const),
      );
      assert.lengthOf(lines, tagOrder.length);

      for (const line of lines) {
        assert.include(line, "will fail", line);
      }
    }),
  );

  it.effect(
    "a home where every cache's path exists gives no tag a skip key and prints nothing",
    () =>
      Effect.gen(function* fullHomeRuns() {
        yield* fill(fullHome);

        const { lines, tags } = yield* tagsUnder({ HOME: fullHome });

        assert.deepStrictEqual(
          tags.map((tag) => tag.name),
          tagOrder,
        );
        assert.deepStrictEqual(
          tags.map(skipOf),
          tagOrder.map(() => "absent" as const),
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
        tags.map((tag) => [tag.name, skipOf(tag)] as const),
        tagOrder.map((name) => [name, name === "corpus" ? "absent" : true] as const),
      );
      assert.lengthOf(lines, tagOrder.length - 1);
    }),
  );

  it.effect("a missing cache's skip survives the merge of a test's two tags in either order", () =>
    Effect.gen(function* mergedSkip() {
      yield* fill(fullHome);

      const { tags } = yield* tagsUnder({
        HOME: fullHome,
        PLATE_CORPUS_DIR: path.join(scratch, "no-corpus"),
      });
      const corpus = tags.find((tag) => tag.name === "corpus");
      const xsd = tags.find((tag) => tag.name === "qti-xsd");

      assert.isDefined(corpus);
      assert.isDefined(xsd);
      // vitest 5.0.1 merges a test's tag definitions in the order the test lists them, each
      // over the last (Object.assign, dist/chunks/run.C5UmxDPh.js:2611-2620).
      assert.strictEqual({ ...corpus, ...xsd }.skip, true);
      assert.strictEqual({ ...xsd, ...corpus }.skip, true);
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

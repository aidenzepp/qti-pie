import { randomUUID } from "node:crypto";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterAll, assert, beforeAll, describe, it } from "@effect/vitest";
import { ConfigProvider, Console, Effect } from "effect";
import type { CacheTag } from "#plate/test/caches.ts";
import { cacheTags, caches } from "#plate/test/caches.ts";
import { xsdDirectory } from "#plate/test/xsd.ts";
import type { XsdPath } from "#plate/test/xsd-layout.ts";
import { xsdPaths } from "#plate/test/xsd-layout.ts";

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
 * The tags whose cache is one file. A cache that lists its files is those files under its
 * directory, and every other cache is a directory.
 */
const fileTags = new Set(["conformance-text", "xsd-datatypes", "web-features"]);

/**
 * The Results Reporting XSD's path under the XSD cache.
 */
const resultsXsd: XsdPath = "imsqti_resultv3p0_v1p0.xsd";

/**
 * A table file that is neither the Results XSD nor a file it imports, and the table's last, so a
 * cache whose probe stopped at its first file would not see it missing.
 */
const lastXsd: XsdPath = "xlink/xlink.xsd";

/**
 * The tags in the order {@link caches} declares them.
 */
const tagOrder = [
  "corpus",
  "qti-xsd",
  "results-xsd",
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
 * Make an empty file at a path, and the folders above it.
 *
 * @param at The file's path.
 */
const touch = (at: string): void => {
  mkdirSync(path.dirname(at), { recursive: true });
  writeFileSync(at, "");
};

/**
 * Make every cache's path exist under `home`: each file a cache lists, as an empty file under its
 * directory, and otherwise its path, as an empty directory or an empty file.
 *
 * @param home The home folder.
 * @returns An effect that creates the paths; running it again changes nothing.
 */
const fill = (home: string) =>
  Effect.gen(function* fillHome() {
    const paths = yield* Effect.all(caches.map((cache) => cache.path)).pipe(under({ HOME: home }));

    yield* Effect.sync(() => {
      for (const [index, at] of paths.entries()) {
        const cache = caches[index];

        if (cache?.files !== undefined) {
          for (const file of cache.files) {
            touch(path.join(at, file));
          }
        } else if (fileTags.has(cache?.tag ?? "")) {
          touch(at);
        } else {
          mkdirSync(at, { recursive: true });
        }
      }
    });
  });

/**
 * Make a home folder under the scratch folder whose XSD cache holds the given table files, each
 * as an empty file at its path, and which holds no other cache.
 *
 * @param name The home folder's name under the scratch folder.
 * @param files The table files to make.
 * @returns The home folder, and its XSD cache.
 */
const xsdHome = (name: string, files: readonly XsdPath[]) =>
  Effect.gen(function* makeXsdHome() {
    const home = path.join(scratch, name);
    const directory = yield* xsdDirectory.pipe(under({ HOME: home }));

    yield* Effect.sync(() => {
      mkdirSync(directory, { recursive: true });

      for (const file of files) {
        touch(path.join(directory, file));
      }
    });

    return { directory, home };
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
 * The `skip` of the `qti-xsd` and `results-xsd` tags, as {@link skipOf} gives it.
 *
 * @param tags The unit run's tags.
 * @returns Each of the two tags' `skip`, by name.
 */
const xsdSkips = (tags: readonly CacheTag[]) =>
  Object.fromEntries(
    tags
      .filter((tag) => tag.name === "qti-xsd" || tag.name === "results-xsd")
      .map((tag) => [tag.name, skipOf(tag)] as const),
  );

/**
 * The notices printed for one tag.
 *
 * @param lines Every line {@link cacheTags} printed.
 * @param tag The tag's name.
 * @returns The lines that name the tests carrying that tag.
 */
const noticesOf = (lines: readonly string[], tag: string): readonly string[] =>
  lines.filter((line) => line.includes(`tagged ${tag} `));

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

  it.effect(
    "the Results XSD tag skips when every table file but the Results XSD is present, with one notice naming it, and PLATE_REQUIRE_CACHES=1 skips neither tag",
    () =>
      Effect.gen(function* resultsMissing() {
        const { directory, home } = yield* xsdHome(
          "no-results-home",
          xsdPaths.filter((file) => file !== resultsXsd),
        );
        const { lines, tags } = yield* tagsUnder({ HOME: home });
        const required = yield* tagsUnder({ HOME: home, PLATE_REQUIRE_CACHES: "1" });
        const notices = noticesOf(lines, "results-xsd");

        assert.deepStrictEqual(xsdSkips(tags), { "qti-xsd": "absent", "results-xsd": true });
        assert.deepStrictEqual(noticesOf(lines, "qti-xsd"), []);
        assert.lengthOf(notices, 1);
        assert.isTrue(notices[0]?.startsWith("plate: "), notices[0]);
        assert.include(notices[0], `${path.join(directory, resultsXsd)} is missing`);
        assert.deepStrictEqual(xsdSkips(required.tags), {
          "qti-xsd": "absent",
          "results-xsd": "absent",
        });
      }),
  );

  it.effect(
    "the Results XSD tag runs while a missing table file that is not the Results XSD skips qti-xsd, whose notice names that file",
    () =>
      Effect.gen(function* tableFileMissing() {
        const { directory, home } = yield* xsdHome(
          "no-xlink-home",
          xsdPaths.filter((file) => file !== lastXsd),
        );
        const { lines, tags } = yield* tagsUnder({ HOME: home });
        const notices = noticesOf(lines, "qti-xsd");

        assert.deepStrictEqual(xsdSkips(tags), { "qti-xsd": true, "results-xsd": "absent" });
        assert.lengthOf(notices, 1);
        assert.include(notices[0], `${path.join(directory, lastXsd)} is missing`);
        assert.deepStrictEqual(noticesOf(lines, "results-xsd"), []);
      }),
  );

  it.effect("the Results XSD tag and qti-xsd run when every table file is present", () =>
    Effect.gen(function* everyFile() {
      const { home } = yield* xsdHome("every-xsd-home", xsdPaths);
      const { lines, tags } = yield* tagsUnder({ HOME: home });

      assert.deepStrictEqual(xsdSkips(tags), { "qti-xsd": "absent", "results-xsd": "absent" });
      assert.deepStrictEqual(noticesOf(lines, "qti-xsd"), []);
      assert.deepStrictEqual(noticesOf(lines, "results-xsd"), []);
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

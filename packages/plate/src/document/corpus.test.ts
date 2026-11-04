import { randomUUID } from "node:crypto";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterAll, assert, beforeAll, describe, it } from "@effect/vitest";
import { ConfigProvider, Effect } from "effect";
import { corpusRoot, readCorpusFile } from "#plate/document/corpus.ts";

/**
 * The scratch folder this run owns, under the package's git-ignored `work/`. Its name is new for
 * each run, so two runs at once never share or remove each other's files.
 */
const scratch = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "work",
  `corpus-test-${randomUUID()}`,
);

/**
 * The corpus root the tests create, holding `a.xml`.
 */
const presentRoot = path.join(scratch, "root");

/**
 * A corpus root no test creates.
 */
const missingRoot = path.join(scratch, "missing");

/**
 * The text of the `a.xml` inside {@link presentRoot}.
 */
const inside = "<inside/>";

/**
 * Provide an environment that holds only `values` to an effect.
 *
 * @param values The environment the provider reads.
 * @returns A function that runs an effect under that environment.
 */
const withEnvironment =
  (values: Record<string, string>) =>
  <A, E>(effect: Effect.Effect<A, E>): Effect.Effect<A, E> =>
    effect.pipe(Effect.provide(ConfigProvider.layer(ConfigProvider.fromUnknown(values))));

beforeAll(() => {
  mkdirSync(presentRoot, { recursive: true });
  writeFileSync(path.join(presentRoot, "a.xml"), inside);
  // A real file beside the root, so the escape test proves a refusal by path, not by absence.
  writeFileSync(path.join(scratch, "a.xml"), "<outside/>");
});

afterAll(() => {
  rmSync(scratch, { force: true, recursive: true });
});

describe("document/corpus.ts", () => {
  it.effect("the root defaults to the extraction directory under HOME", () =>
    Effect.gen(function* defaultRoot() {
      const root = yield* corpusRoot.pipe(withEnvironment({ HOME: "/home/reader" }));

      assert.strictEqual(
        root,
        "/home/reader/.cache/gr8des/qti3-examples/qti-examples-0a92fbbb6d2e620a1f7fad19977be4c418246bc0",
      );
    }),
  );

  it.effect("a missing root fails with CorpusMissing, naming the root", () =>
    Effect.gen(function* missing() {
      const error = yield* Effect.flip(
        readCorpusFile("x.xml").pipe(withEnvironment({ PLATE_CORPUS_DIR: missingRoot })),
      );

      assert.strictEqual(error._tag, "CorpusMissing");

      if (error._tag === "CorpusMissing") {
        assert.strictEqual(error.root, missingRoot);
      }
    }),
  );

  it.effect(
    "the extraction command's find line ends in an escaped semicolon, as a shell needs",
    () =>
      Effect.gen(function* findLine() {
        const error = yield* Effect.flip(
          readCorpusFile("x.xml").pipe(withEnvironment({ PLATE_CORPUS_DIR: missingRoot })),
        );

        assert.strictEqual(error._tag, "CorpusMissing");

        if (error._tag === "CorpusMissing") {
          const find = error.command.split("\n").find((line) => line.startsWith("find "));

          assert.isDefined(find);
          assert.isTrue(find?.endsWith(" \\;"), find);
        }
      }),
  );

  it.effect("a file under the root comes back as its bytes", () =>
    Effect.gen(function* present() {
      const bytes = yield* readCorpusFile("a.xml").pipe(
        withEnvironment({ PLATE_CORPUS_DIR: presentRoot }),
      );

      assert.strictEqual(new TextDecoder().decode(bytes), inside);
    }),
  );

  it.effect("a path that leaves the root fails with CorpusFileUnreadable", () =>
    Effect.gen(function* escapes() {
      const error = yield* Effect.flip(
        readCorpusFile("../a.xml").pipe(withEnvironment({ PLATE_CORPUS_DIR: presentRoot })),
      );

      assert.strictEqual(error._tag, "CorpusFileUnreadable");

      if (error._tag === "CorpusFileUnreadable") {
        assert.strictEqual(error.path, "../a.xml");
      }
    }),
  );

  it.effect("a file the root does not hold fails with CorpusFileUnreadable", () =>
    Effect.gen(function* absent() {
      const error = yield* Effect.flip(
        readCorpusFile("b.xml").pipe(withEnvironment({ PLATE_CORPUS_DIR: presentRoot })),
      );

      assert.strictEqual(error._tag, "CorpusFileUnreadable");
    }),
  );
});

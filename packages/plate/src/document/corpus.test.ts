import { randomUUID } from "node:crypto";
import { mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterAll, assert, beforeAll, describe, it } from "@effect/vitest";
import { ConfigProvider, Effect } from "effect";
import { corpusDocuments, corpusRoot, readCorpusFile } from "#plate/document/corpus.ts";

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
 * The members {@link presentRoot} holds, in JavaScript's default string order: an upper-case name
 * sorts before a lower-case one. The root also holds a file outside the set beside each kind of
 * member: `f.txt`, `qtiv2p2-examples/c.xml` and the directory `d.xml/`.
 */
const presentMembers = ["X.zip.d/g.xml", "a.xml", "d.xml/e.xml", "sub/qtiv2p2-examples/b.xml"];

/**
 * Reading and walking the whole corpus takes well under a second here; the bound leaves room for a
 * slow disk without letting a hung read stall the run.
 */
const corpusTimeoutMs = 60_000;

/**
 * Every regular `.xml` file under `root`, outside the root's own `qtiv2p2-examples/`, found by a
 * walk of one directory at a time, independent of the walk `corpusDocuments` makes.
 *
 * @param root The corpus root.
 * @param relative The directory under `root` to walk, as a POSIX path; empty for the root itself.
 * @returns The files' POSIX paths relative to `root`, in the order the walk met them.
 */
const walk = (root: string, relative = ""): readonly string[] =>
  readdirSync(path.join(root, relative), { withFileTypes: true }).flatMap((entry) => {
    const child = relative === "" ? entry.name : `${relative}/${entry.name}`;

    if (entry.isDirectory()) {
      return child === "qtiv2p2-examples" ? [] : walk(root, child);
    }

    return entry.isFile() && entry.name.endsWith(".xml") ? [child] : [];
  });

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

  for (const member of presentMembers.filter((name) => name !== "a.xml")) {
    mkdirSync(path.dirname(path.join(presentRoot, member)), { recursive: true });
    writeFileSync(path.join(presentRoot, member), inside);
  }

  mkdirSync(path.join(presentRoot, "qtiv2p2-examples"));
  writeFileSync(path.join(presentRoot, "qtiv2p2-examples", "c.xml"), inside);
  writeFileSync(path.join(presentRoot, "f.txt"), inside);
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

  it.effect("the document set is every .xml file outside the root's qtiv2p2-examples, sorted", () =>
    Effect.gen(function* fixtureSet() {
      const documents = yield* corpusDocuments.pipe(
        withEnvironment({ PLATE_CORPUS_DIR: presentRoot }),
      );

      assert.deepStrictEqual(documents, presentMembers);
    }),
  );

  it.effect(
    "the corpus's document set equals an independent walk, holds no directory and is sorted",
    () =>
      Effect.gen(function* corpusSet() {
        const root = yield* corpusRoot;
        const documents = yield* corpusDocuments;

        assert.deepStrictEqual(documents, walk(root).toSorted());
        assert.deepStrictEqual(documents, documents.toSorted());
        assert.include(documents, "qtiv3-examples/CAT/test.xml");
        assert.include(documents, "QTI3_BPIG_Examples/items/BG007.xml");
        assert.isFalse(documents.some((member) => member.startsWith("qtiv2p2-examples/")));
        assert.isFalse(documents.some((member) => statSync(path.join(root, member)).isDirectory()));
      }),
    { tags: ["corpus"], timeout: corpusTimeoutMs },
  );

  it.effect("the document set of a missing root fails with CorpusMissing, naming the root", () =>
    Effect.gen(function* missingSet() {
      const error = yield* Effect.flip(
        corpusDocuments.pipe(withEnvironment({ PLATE_CORPUS_DIR: missingRoot })),
      );

      assert.strictEqual(error._tag, "CorpusMissing");

      if (error._tag === "CorpusMissing") {
        assert.strictEqual(error.root, missingRoot);
      }
    }),
  );
});

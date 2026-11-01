import path from "node:path";
import { NodeChildProcessSpawner, NodeFileSystem, NodePath } from "@effect/platform-node";
import { assert, beforeAll, layer } from "@effect/vitest";
import { Effect, FileSystem, Layer } from "effect";
import { comparePackage, renderReport } from "#qti/export/compare.ts";
import { materialize } from "#qti/test/fixtures.ts";

/**
 * What every test here runs on: the file system the comparison and the fixture materializer need,
 * and the process spawner `xmllint` and the materializer's `tar` and `unzip` need.
 */
const TestLayer = NodeChildProcessSpawner.layer.pipe(
  Layer.provideMerge(Layer.mergeAll(NodeFileSystem.layer, NodePath.layer)),
);

/**
 * The directory every scratch directory is made under: the package's gitignored `work/`.
 */
const workDirectory = path.resolve(import.meta.dirname, "../../work");

/**
 * The directory `materialize("simple")` returned, set once by `beforeAll`.
 */
let SIMPLE = "";

/**
 * The directory `materialize("latin1")` returned, set once by `beforeAll`.
 */
let LATIN1 = "";

beforeAll(() =>
  Effect.gen(function* materializeFixtures() {
    SIMPLE = yield* materialize("simple");
    LATIN1 = yield* materialize("latin1");
  }).pipe(Effect.provide(TestLayer)),
);

layer(TestLayer, { excludeTestServices: true })("export/compare.ts, database-free", (it) => {
  it.effect("comparing simple with itself is all equal", () =>
    Effect.gen(function* compareSelf() {
      const report = yield* comparePackage(SIMPLE, SIMPLE);

      assert.deepStrictEqual(report, [
        { outcome: { kind: "canonical-equal" }, path: "choice.xml" },
        { outcome: { kind: "byte-identical" }, path: "images/sign.png" },
        { outcome: { kind: "canonical-equal" }, path: "imsmanifest.xml" },
      ]);
      assert.isTrue(renderReport(report).endsWith("\nall equal"));
    }),
  );

  it.effect(
    "the report renders one line per entry and a last line that counts the differences",
    () =>
      Effect.gen(function* renderMixed() {
        const text = renderReport([
          { outcome: { kind: "canonical-equal" }, path: "a.xml" },
          { outcome: { at: "missing", kind: "differs" }, path: "b.png" },
          { outcome: { kind: "byte-identical" }, path: "c.png" },
        ]);

        assert.strictEqual(
          text,
          "a.xml: canonical-equal\nb.png: differs at missing\nc.png: byte-identical\n1 differ",
        );
        yield* Effect.void;
      }),
  );

  it.effect("comparing simple with the latin1 fixture reports choice.xml as differing", () =>
    Effect.gen(function* compareLatin1() {
      const report = yield* comparePackage(SIMPLE, LATIN1);
      const outcome = (entry: string) => report.find((item) => item.path === entry)?.outcome;

      assert.strictEqual(outcome("choice.xml")?.kind, "differs");
      assert.strictEqual(outcome("imsmanifest.xml")?.kind, "canonical-equal");
      assert.strictEqual(outcome("images/sign.png")?.kind, "byte-identical");
      assert.isTrue(renderReport(report).endsWith("\n1 differ"));
    }),
  );

  it.effect("a sign.png with one byte changed differs at that byte offset", () =>
    Effect.gen(function* compareChangedPng() {
      const fs = yield* FileSystem.FileSystem;

      yield* fs.makeDirectory(workDirectory, { recursive: true });

      const parent = yield* fs.makeTempDirectoryScoped({
        directory: workDirectory,
        prefix: "export-compare-test-",
      });
      const copy = `${parent}/package`;

      yield* fs.copy(SIMPLE, copy);

      const png = yield* fs.readFile(`${copy}/images/sign.png`);
      const changed = Uint8Array.from(png);

      changed[1234] = ((changed[1234] ?? 0) + 1) % 256;
      yield* fs.writeFile(`${copy}/images/sign.png`, changed);

      const report = yield* comparePackage(SIMPLE, copy);

      assert.deepStrictEqual(report.find((item) => item.path === "images/sign.png")?.outcome, {
        at: "byte 1234",
        kind: "differs",
      });
      assert.strictEqual(report.filter((item) => item.outcome.kind === "differs").length, 1);
    }),
  );

  it.effect("an entry missing from the export differs at missing", () =>
    Effect.gen(function* compareMissing() {
      const fs = yield* FileSystem.FileSystem;

      yield* fs.makeDirectory(workDirectory, { recursive: true });

      const parent = yield* fs.makeTempDirectoryScoped({
        directory: workDirectory,
        prefix: "export-compare-test-",
      });
      const copy = `${parent}/package`;

      yield* fs.copy(SIMPLE, copy);
      yield* fs.remove(`${copy}/images/sign.png`);

      const report = yield* comparePackage(SIMPLE, copy);

      assert.deepStrictEqual(report.find((item) => item.path === "images/sign.png")?.outcome, {
        at: "missing",
        kind: "differs",
      });
    }),
  );
});

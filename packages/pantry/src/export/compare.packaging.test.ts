import path from "node:path";
import { NodeChildProcessSpawner, NodeFileSystem, NodePath } from "@effect/platform-node";
import { assert, beforeAll, layer } from "@effect/vitest";
import { Effect, FileSystem, Layer } from "effect";
import { comparePackage } from "#pantry/export/compare.ts";
import type { Report } from "#pantry/export/compare.ts";
import { manifestRows } from "#pantry/import/manifest.ts";
import { Rows } from "#pantry/import/tree.ts";
import { listPackage, readEntry } from "#pantry/package/read.ts";
import { materialize } from "#pantry/test/fixtures.ts";
import type { FixtureName } from "#pantry/test/fixtures.ts";
import { readXml } from "@qti-pie/crust/read.ts";

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
 * The packages the import and the comparison must agree on, in the order the spec's 4.12 lists
 * them.
 */
const agreeing: readonly FixtureName[] = [
  "simple",
  "lomrest",
  "csm",
  "filelom",
  "nestedqmd",
  "extmeta",
  "variant",
  "variant-padded",
  "usage3",
  "usage3-typed",
  "usage3-padded",
  "outcome",
  "lti301",
  "lti300",
];

/**
 * The directories `materialize` returned, by name, set once by `beforeAll`.
 */
const directories = new Map<FixtureName, string>();

beforeAll(() =>
  Effect.gen(function* materializeFixtures() {
    for (const name of new Set<FixtureName>([...agreeing, "bytes"])) {
      directories.set(name, yield* materialize(name));
    }
  }).pipe(Effect.provide(TestLayer), Effect.scoped),
);

/**
 * The materialized directory of a fixture.
 */
const directoryOf = (name: FixtureName): string => {
  const directory = directories.get(name);

  assert.isDefined(directory, `fixture ${name} is materialized`);

  return directory ?? "";
};

/**
 * Copy a fixture under `work/` into a scope-owned directory, so a test may change the copy and
 * never the immutable fixture.
 */
const copyOf = Effect.fn("compare.packaging.copyOf")(function* copyOf(name: FixtureName) {
  const fs = yield* FileSystem.FileSystem;

  yield* fs.makeDirectory(workDirectory, { recursive: true });

  const parent = yield* fs.makeTempDirectoryScoped({
    directory: workDirectory,
    prefix: "compare-packaging-test-",
  });
  const copy = `${parent}/package`;

  yield* fs.copy(directoryOf(name), copy);

  return copy;
});

/**
 * Append one line feed to a file of a copy.
 */
const appendLineFeed = Effect.fn("compare.packaging.appendLineFeed")(function* appendLineFeed(
  copy: string,
  entry: string,
) {
  const fs = yield* FileSystem.FileSystem;
  const bytes = yield* fs.readFile(`${copy}/${entry}`);

  yield* fs.writeFile(`${copy}/${entry}`, Uint8Array.from([...bytes, 10]));
});

/**
 * The outcome kind a report holds for a path.
 */
const kindAt = (report: Report, entry: string): string | undefined =>
  report.find((item) => item.path === entry)?.outcome.kind;

/**
 * The paths a report holds that differ.
 */
const differing = (report: Report): readonly string[] =>
  report.filter((item) => item.outcome.kind === "differs").map((item) => item.path);

layer(TestLayer, { excludeTestServices: true })("export/compare.ts, packaging entries", (it) => {
  it.effect("a record rewritten by the export compares canonically", () =>
    Effect.gen(function* compareRecord() {
      const copy = yield* copyOf("extmeta");

      yield* appendLineFeed(copy, "meta/choice.xml");

      const report = yield* comparePackage(directoryOf("extmeta"), copy);

      assert.strictEqual(kindAt(report, "meta/choice.xml"), "canonical-equal");
      assert.deepStrictEqual(differing(report), []);
    }).pipe(Effect.scoped),
  );

  it.effect("a usage-data file rewritten by the export compares canonically", () =>
    Effect.gen(function* compareUsage() {
      const copy = yield* copyOf("usage3");

      yield* appendLineFeed(copy, "example.xml");

      const report = yield* comparePackage(directoryOf("usage3"), copy);

      assert.strictEqual(kindAt(report, "example.xml"), "canonical-equal");
      assert.deepStrictEqual(differing(report), []);
    }).pipe(Effect.scoped),
  );

  it.effect("an outcome document compares canonically", () =>
    Effect.gen(function* compareOutcome() {
      const copy = yield* copyOf("outcome");

      yield* appendLineFeed(copy, "testoutcome01.xml");

      const report = yield* comparePackage(directoryOf("outcome"), copy);

      assert.strictEqual(kindAt(report, "testoutcome01.xml"), "canonical-equal");
      assert.deepStrictEqual(differing(report), []);
    }).pipe(Effect.scoped),
  );

  it.effect("bytes compared with itself: stored files byte-identical, documents canonical", () =>
    Effect.gen(function* compareBytesSelf() {
      const dir = directoryOf("bytes");
      const report = yield* comparePackage(dir, dir);

      assert.strictEqual(kindAt(report, "fragments/rtest01-fragment.xml"), "byte-identical");
      assert.strictEqual(kindAt(report, "meta/other.xml"), "byte-identical");
      assert.strictEqual(kindAt(report, "app/launch.xml"), "byte-identical");
      assert.strictEqual(kindAt(report, "choice.xml"), "canonical-equal");
      assert.strictEqual(kindAt(report, "imsmanifest.xml"), "canonical-equal");
    }),
  );

  it.effect("a fragment with one line feed appended differs at its length, alone", () =>
    Effect.gen(function* compareFragment() {
      const fs = yield* FileSystem.FileSystem;
      const copy = yield* copyOf("bytes");
      const entry = "fragments/rtest01-fragment.xml";
      const { length } = yield* fs.readFile(`${directoryOf("bytes")}/${entry}`);

      yield* appendLineFeed(copy, entry);

      const report = yield* comparePackage(directoryOf("bytes"), copy);

      assert.deepStrictEqual(report.find((item) => item.path === entry)?.outcome, {
        at: `byte ${length}`,
        kind: "differs",
      });
      assert.deepStrictEqual(differing(report), [entry]);
    }).pipe(Effect.scoped),
  );

  it.effect("a record resource with no href compares its one file canonically", () =>
    Effect.gen(function* compareHrefless() {
      const fs = yield* FileSystem.FileSystem;
      const first = yield* copyOf("extmeta");
      const second = yield* copyOf("extmeta");
      const withHref = 'type="resourcemetadata/xml" href="meta/choice.xml"';

      for (const copy of [first, second]) {
        const manifest = yield* fs.readFileString(`${copy}/imsmanifest.xml`);

        assert.isTrue(manifest.includes(withHref), "the record resource names its href");
        yield* fs.writeFileString(
          `${copy}/imsmanifest.xml`,
          manifest.replace(withHref, 'type="resourcemetadata/xml"'),
        );
      }

      yield* appendLineFeed(second, "meta/choice.xml");

      const report = yield* comparePackage(first, second);

      assert.strictEqual(kindAt(report, "meta/choice.xml"), "canonical-equal");
      assert.deepStrictEqual(differing(report), []);
    }).pipe(Effect.scoped),
  );

  for (const name of agreeing) {
    it.effect(
      `${name}: an entry compares canonically exactly when the import makes it a document`,
      () =>
        Effect.gen(function* compareAgreement() {
          const dir = directoryOf(name);
          const rows = yield* manifestRows(
            dir,
            yield* listPackage(dir),
            yield* readXml(yield* readEntry(dir, "imsmanifest.xml")),
            Rows.empty(),
          );
          const rewritten = new Set([
            "imsmanifest.xml",
            ...rows.documents.map((document) => document.path),
          ]);
          const report = yield* comparePackage(dir, dir);

          assert.deepStrictEqual(
            report
              .filter((item) => item.outcome.kind === "canonical-equal")
              .map((item) => item.path),
            report.filter((item) => rewritten.has(item.path)).map((item) => item.path),
          );
          assert.deepStrictEqual(
            report
              .filter((item) => item.outcome.kind === "byte-identical")
              .map((item) => item.path),
            report.filter((item) => !rewritten.has(item.path)).map((item) => item.path),
          );
          assert.strictEqual(
            report.length,
            report.filter((item) => item.outcome.kind !== "differs").length,
          );
        }),
    );
  }
});

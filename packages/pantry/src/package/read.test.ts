import path from "node:path";
import { NodeChildProcessSpawner, NodeFileSystem, NodePath } from "@effect/platform-node";
import { assert, beforeAll, layer } from "@effect/vitest";
import { Effect, FileSystem, Layer } from "effect";
import { listPackage, PackageReadError, readEntry, readPackage } from "#pantry/package/read.ts";
import { ZipRefusal } from "#pantry/package/zip.ts";
import { materialize, materializeZip } from "#pantry/test/fixtures.ts";

/**
 * What every test here runs on: the file system `listPackage`, `readEntry` and the fixture
 * materializer need, and the process spawner and path service the materializer's `tar` and
 * `unzip` need.
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
 * Assert that reading `entry` from `dir` is refused as an `entry-path` {@link PackageReadError}
 * that carries `dir` and `entry` as passed.
 *
 * @param dir - The package directory.
 * @param entry - The entry path handed to `readEntry`.
 */
const assertEntryRefused = Effect.fn("test.assertEntryRefused")(function* assertEntryRefused(
  dir: string,
  entry: string,
) {
  const failure = yield* Effect.flip(readEntry(dir, entry));

  assert.instanceOf(failure, PackageReadError);
  assert.strictEqual(failure.rule, "entry-path");
  assert.strictEqual(failure.dir, dir);
  assert.strictEqual(failure.path, entry);
});

/**
 * Make a package under `workDirectory` with a manifest at its root, a file `outside.txt` beside it
 * and a link `up` from the package to the folder that holds both, in a scratch directory the
 * surrounding scope removes.
 *
 * @returns The package directory.
 */
const makeLinkedPackage = Effect.fn("test.makeLinkedPackage")(function* makeLinkedPackage() {
  const fs = yield* FileSystem.FileSystem;

  yield* fs.makeDirectory(workDirectory, { recursive: true });

  const parent = yield* fs.makeTempDirectoryScoped({
    directory: workDirectory,
    prefix: "package-read-test-",
  });
  const dir = `${parent}/package`;

  yield* fs.makeDirectory(dir);
  yield* fs.writeFileString(`${dir}/imsmanifest.xml`, "<manifest/>");
  yield* fs.writeFileString(`${parent}/outside.txt`, "outside");
  yield* fs.symlink(parent, `${dir}/up`);

  return dir;
});

beforeAll(() =>
  Effect.gen(function* materializeSimple() {
    SIMPLE = yield* materialize("simple");
  }).pipe(Effect.provide(TestLayer)),
);

layer(TestLayer, { excludeTestServices: true })("package/read.ts", (it) => {
  it.effect("a directory with no imsmanifest.xml at its root is refused as manifest-root", () =>
    Effect.gen(function* listWithoutManifest() {
      const fs = yield* FileSystem.FileSystem;

      yield* fs.makeDirectory(workDirectory, { recursive: true });

      const dir = yield* fs.makeTempDirectoryScoped({
        directory: workDirectory,
        prefix: "package-read-test-",
      });

      yield* fs.makeDirectory(`${dir}/nested`);
      yield* fs.writeFileString(`${dir}/nested/imsmanifest.xml`, "<manifest/>");

      const failure = yield* Effect.flip(listPackage(dir));

      assert.instanceOf(failure, PackageReadError);
      assert.strictEqual(failure.rule, "manifest-root");
      assert.strictEqual(failure.dir, dir);
    }).pipe(Effect.scoped),
  );

  it.effect("readEntry refuses an absolute entry path", () =>
    assertEntryRefused(SIMPLE, path.resolve(SIMPLE, "choice.xml")),
  );

  it.effect("readEntry refuses a .. segment even when the path resolves inside", () =>
    assertEntryRefused(SIMPLE, "images/../choice.xml"),
  );

  it.effect("readEntry refuses a directory", () => assertEntryRefused(SIMPLE, "images"));

  it.effect("readEntry refuses a file reached through a link that leaves the package", () =>
    Effect.gen(function* refuseDirectoryLink() {
      yield* assertEntryRefused(yield* makeLinkedPackage(), "up/outside.txt");
    }).pipe(Effect.scoped),
  );

  it.effect("a corpus zip read from its bytes gives the entries its path gives", () =>
    Effect.gen(function* readZipBytes() {
      const fs = yield* FileSystem.FileSystem;
      const file = yield* materializeZip("simple");
      const source = { bytes: yield* fs.readFile(file), name: "simple.zip" };
      const fromPath = yield* readPackage(file);

      assert.isAbove(fromPath.length, 1);
      assert.deepStrictEqual(yield* readPackage(source), fromPath);
      assert.deepStrictEqual(yield* listPackage(source), yield* listPackage(file));

      for (const entry of fromPath) {
        assert.deepStrictEqual(yield* readEntry(source, entry.path), entry.bytes);
      }
    }),
  );

  it.effect("bytes that are not a zip are refused under the rule a path to them is", () =>
    Effect.gen(function* refuseNotZipBytes() {
      const fs = yield* FileSystem.FileSystem;

      yield* fs.makeDirectory(workDirectory, { recursive: true });

      const dir = yield* fs.makeTempDirectoryScoped({
        directory: workDirectory,
        prefix: "package-read-test-",
      });
      const bytes = new TextEncoder().encode("<manifest/> is not a zip archive");
      const file = `${dir}/broken.zip`;

      yield* fs.writeFile(file, bytes);

      const fromPath = yield* Effect.flip(readPackage(file));
      const fromBytes = yield* Effect.flip(readPackage({ bytes, name: "broken.zip" }));

      assert.instanceOf(fromPath, ZipRefusal);
      assert.instanceOf(fromBytes, ZipRefusal);
      assert.strictEqual(fromBytes._tag, fromPath._tag);
      assert.strictEqual(fromBytes.rule, fromPath.rule);
    }).pipe(Effect.scoped),
  );
});

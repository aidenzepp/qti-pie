import { createHash } from "node:crypto";
import path from "node:path";
import { NodeChildProcessSpawner, NodeFileSystem, NodePath } from "@effect/platform-node";
import { assert, beforeAll, layer } from "@effect/vitest";
import { Effect, FileSystem, Layer } from "effect";
import { listPackage, PackageReadError, readEntry } from "#qti/package/read.ts";
import { materialize } from "#qti/test/fixtures.ts";

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
 * Hash bytes the way the spec quotes `sign.png`.
 *
 * @param bytes - The bytes to hash.
 * @returns The 64 lower-case hex digits of their sha256.
 */
const sha256 = (bytes: Uint8Array): string => createHash("sha256").update(bytes).digest("hex");

beforeAll(() =>
  Effect.gen(function* materializeSimple() {
    SIMPLE = yield* materialize("simple");
  }).pipe(Effect.provide(TestLayer)),
);

layer(TestLayer, { excludeTestServices: true })("package/read.ts", (it) => {
  it.effect("listPackage(simple) names its three files in order, the manifest marked", () =>
    Effect.gen(function* listSimple() {
      const entries = yield* listPackage(SIMPLE);

      assert.deepStrictEqual(entries, [
        { kind: "file", path: "choice.xml" },
        { kind: "file", path: "images/sign.png" },
        { kind: "manifest", path: "imsmanifest.xml" },
      ]);
    }),
  );

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

  it.effect("readEntry(simple, images/sign.png) returns the 4029 bytes the tarball holds", () =>
    Effect.gen(function* readSign() {
      const bytes = yield* readEntry(SIMPLE, "images/sign.png");

      assert.strictEqual(bytes.length, 4029);
      assert.isTrue(sha256(bytes).startsWith("3ca00b7cf97dea89"));
    }),
  );
});

import { createHash } from "node:crypto";
import path from "node:path";
import { NodeChildProcessSpawner, NodeFileSystem, NodePath } from "@effect/platform-node";
import { assert, beforeAll, layer } from "@effect/vitest";
import { Effect, FileSystem, Layer } from "effect";
import { listPackage, PackageReadError, readEntry, readPackage } from "#pantry/package/read.ts";
import { recordOf } from "#pantry/package/record.ts";
import { writeZip, ZipRefusal } from "#pantry/package/zip.ts";
import type { ZipEntry } from "#pantry/package/zip.ts";
import { materialize, materializeZip } from "#pantry/test/fixtures.ts";

/**
 * What every test here runs on: the file system `readPackage` and the fixture materializers need,
 * and the process spawner and path service the materializers' `tar` and `unzip` need.
 */
const TestLayer = NodeChildProcessSpawner.layer.pipe(
  Layer.provideMerge(Layer.mergeAll(NodeFileSystem.layer, NodePath.layer)),
);

/**
 * The directory every scratch directory is made under: the package's gitignored `work/`.
 */
const workDirectory = path.resolve(import.meta.dirname, "../../work");

/**
 * The two fixtures read in both forms.
 */
const NAMES = ["simple", "sharedMedia"] as const;

/**
 * Each fixture's directory form and zip form, set once by `beforeAll`.
 */
const FORMS = new Map<(typeof NAMES)[number], { readonly dir: string; readonly zip: string }>();

/**
 * One mebibyte, the unit `zip.ts` states its budgets in.
 */
const MIB = 1024 * 1024;

/**
 * A manifest entry for the archives the budget tests write.
 */
const MANIFEST: ZipEntry = {
  bytes: new TextEncoder().encode("<manifest/>"),
  path: "imsmanifest.xml",
};

/**
 * Look up a fixture's two forms.
 *
 * @param name - The fixture.
 * @returns Its directory and its zip.
 */
const formsOf = (name: (typeof NAMES)[number]): { readonly dir: string; readonly zip: string } => {
  const forms = FORMS.get(name);

  assert.isDefined(forms, `beforeAll did not materialize ${name}`);

  return forms;
};

/**
 * Hash bytes the way the spec quotes `sign.png`.
 *
 * @param bytes - The bytes to hash.
 * @returns The 64 lower-case hex digits of their sha256.
 */
const sha256 = (bytes: Uint8Array): string => createHash("sha256").update(bytes).digest("hex");

/**
 * Make the central directory of an archive `writeZip` wrote declare a size for some entries, as
 * both their stored size and their size, so a budget can be passed without writing the bytes.
 *
 * @param archive - The archive, which has no comment.
 * @param names - The entries whose records are changed.
 * @param size - The size to declare for each.
 * @returns A copy with those records changed.
 */
const declareSize = (archive: Uint8Array, names: readonly string[], size: number): Uint8Array => {
  const copy = Buffer.from(archive);
  const end = copy.length - 22;
  let at = copy.readUInt32LE(end + 16);

  while (at < end) {
    const nameLength = copy.readUInt16LE(at + 28);

    if (names.includes(copy.toString("utf-8", at + 46, at + 46 + nameLength))) {
      copy.writeUInt32LE(size, at + 20);
      copy.writeUInt32LE(size, at + 24);
    }

    at += 46 + nameLength + copy.readUInt16LE(at + 30) + copy.readUInt16LE(at + 32);
  }

  return copy;
};

/**
 * Write archive bytes to a file named `a.zip` in a scratch directory the surrounding scope removes.
 *
 * @param bytes - The archive.
 * @returns The file's path.
 */
const writeScratch = Effect.fn("test.writeScratch")(function* writeScratch(bytes: Uint8Array) {
  const fs = yield* FileSystem.FileSystem;

  yield* fs.makeDirectory(workDirectory, { recursive: true });

  const dir = yield* fs.makeTempDirectoryScoped({
    directory: workDirectory,
    prefix: "record-test-",
  });
  const file = `${dir}/a.zip`;

  yield* fs.writeFile(file, bytes);

  return file;
});

beforeAll(() =>
  Effect.gen(function* materializeForms() {
    for (const name of NAMES) {
      FORMS.set(name, { dir: yield* materialize(name), zip: yield* materializeZip(name) });
    }
  }).pipe(Effect.provide(TestLayer)),
);

layer(TestLayer, { excludeTestServices: true })("package/record.ts", (it) => {
  it.effect("the record of simple holds its three entries at 0 to 2, bytes as base64", () =>
    Effect.gen(function* recordSimple() {
      const rows = recordOf(yield* readPackage(formsOf("simple").dir));

      assert.deepStrictEqual(
        rows.map(({ at, kind, path: entry }) => ({ at, kind, path: entry })),
        [
          { at: 0n, kind: "file", path: "choice.xml" },
          { at: 1n, kind: "file", path: "images/sign.png" },
          { at: 2n, kind: "manifest", path: "imsmanifest.xml" },
        ],
      );

      const sign = rows.find((row) => row.path === "images/sign.png");

      assert.isDefined(sign, "the record of simple has no images/sign.png row");
      assert.strictEqual(sign.byteLength, 4029n);
      assert.isTrue(sha256(Uint8Array.fromBase64(sign.content)).startsWith("3ca00b7cf97dea89"));
    }),
  );

  for (const name of NAMES) {
    it.effect(`${name}: the directory and the zip give identical records`, () =>
      Effect.gen(function* compareForms() {
        const { dir, zip } = formsOf(name);
        const rows = recordOf(yield* readPackage(dir));

        assert.isAbove(rows.length, 2);
        assert.deepStrictEqual(recordOf(yield* readPackage(zip)), rows);
        assert.deepStrictEqual(
          rows.map(({ kind, path: entry }) => ({ kind, path: entry })),
          yield* listPackage(dir),
        );

        for (const row of rows) {
          const bytes = yield* readEntry(dir, row.path);

          assert.strictEqual(row.byteLength, BigInt(bytes.length));
          assert.deepStrictEqual(Uint8Array.fromBase64(row.content), bytes);
        }
      }),
    );
  }

  it.effect("readPackage of a zip past a budget is refused before an entry is read", () =>
    Effect.gen(function* refuseBudgets() {
      const one: ZipEntry = { bytes: new Uint8Array([0x78]), path: "big.bin" };
      const five = ["a", "b", "c", "d", "e"].map((stem): ZipEntry => ({
        ...one,
        path: `${stem}.bin`,
      }));
      const cases = [
        {
          archive: writeZip([
            MANIFEST,
            ...Array.from({ length: 10_000 }, (_, index): ZipEntry => ({
              bytes: new Uint8Array(),
              path: `f/${String(index).padStart(5, "0")}`,
            })),
          ]),
          entry: undefined,
          feature: "entries, past the limit of 10000",
        },
        {
          archive: declareSize(writeZip([MANIFEST, one]), ["big.bin"], 64 * MIB + 1),
          entry: "big.bin",
          feature: "bytes for one entry",
        },
        {
          archive: writeZip([MANIFEST, { bytes: new Uint8Array(2 * MIB), path: "zeros.bin" }]),
          entry: "zeros.bin",
          feature: "times its stored size",
        },
        {
          archive: declareSize(
            writeZip([MANIFEST, ...five]),
            five.map((entry) => entry.path),
            60 * MIB,
          ),
          entry: undefined,
          feature: "bytes for one package",
        },
      ];

      for (const { archive, entry, feature } of cases) {
        const file = yield* writeScratch(archive);
        const failure = yield* Effect.flip(readPackage(file));

        assert.instanceOf(failure, ZipRefusal);
        assert.strictEqual(failure.rule, "zip-format");
        assert.strictEqual(failure.entry, entry ?? file);
        assert.include(failure.feature, feature);
      }
    }).pipe(Effect.scoped),
  );

  it.effect("a listed file reached through a link that leaves the package is entry-path", () =>
    Effect.gen(function* refuseEscape() {
      const fs = yield* FileSystem.FileSystem;

      yield* fs.makeDirectory(workDirectory, { recursive: true });

      const parent = yield* fs.makeTempDirectoryScoped({
        directory: workDirectory,
        prefix: "record-test-",
      });
      const dir = `${parent}/package`;

      yield* fs.makeDirectory(dir);
      yield* fs.makeDirectory(`${parent}/elsewhere`);
      yield* fs.writeFileString(`${dir}/imsmanifest.xml`, "<manifest/>");
      yield* fs.writeFileString(`${parent}/elsewhere/outside.txt`, "outside");
      yield* fs.symlink(`${parent}/elsewhere`, `${dir}/up`);

      const failure = yield* Effect.flip(readPackage(dir));

      assert.instanceOf(failure, PackageReadError);
      assert.strictEqual(failure.rule, "entry-path");
      assert.strictEqual(failure.path, "up/outside.txt");
    }).pipe(Effect.scoped),
  );
});

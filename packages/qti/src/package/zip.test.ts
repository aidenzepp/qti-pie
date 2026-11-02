import { deflateRawSync, crc32 } from "node:zlib";
import path from "node:path";
import { NodeChildProcessSpawner, NodeFileSystem, NodePath } from "@effect/platform-node";
import { assert, beforeAll, layer } from "@effect/vitest";
import { Effect, FileSystem, Layer } from "effect";
import { listPackage, readEntry } from "#qti/package/read.ts";
import { readZip, ZipRefusal } from "#qti/package/zip.ts";
import { materialize, materializeZip } from "#qti/test/fixtures.ts";

/**
 * What every test here runs on: the file system `readZip` needs, and the process spawner and path
 * service the fixture materializers need.
 */
const TestLayer = NodeChildProcessSpawner.layer.pipe(
  Layer.provideMerge(Layer.mergeAll(NodeFileSystem.layer, NodePath.layer)),
);

/**
 * The directory every scratch directory is made under: the package's gitignored `work/`.
 */
const workDirectory = path.resolve(import.meta.dirname, "../../work");

/**
 * The `simple` zip of the corpus, set once by `beforeAll`.
 */
let SIMPLE_ZIP = "";

/**
 * The directory `materialize("simple")` returned, set once by `beforeAll`.
 */
let SIMPLE_DIR = "";

/**
 * One entry the test emitter writes. Every field but `bytes` and `name` is a knob that makes the
 * archive wrong in one named way.
 *
 * `size` replaces both sizes in the central directory only. `name` is raw bytes when the test
 * needs a name that is not UTF-8.
 */
interface EmitEntry {
  readonly bytes: Uint8Array;
  readonly crc?: number;
  readonly externalAttributes?: number;
  readonly flags?: number;
  readonly method?: number;
  readonly name: Uint8Array | string;
  readonly size?: number;
}

/**
 * The archive-wide knobs of the emitter: a ZIP64 locator record before the end record, and a
 * number of bytes cut from the end of the finished archive.
 */
interface EmitOptions {
  readonly truncate?: number;
  readonly zip64Locator?: boolean;
}

/**
 * Assemble a zip archive from bytes: local headers, central directory and end record, every entry
 * stored (method 0) unless a knob says otherwise.
 *
 * @param entries - The entries, in the order written.
 * @param options - The archive-wide knobs.
 * @returns The archive.
 */
const emitZip = (entries: readonly EmitEntry[], options: EmitOptions = {}): Uint8Array => {
  const locals: Buffer[] = [];
  const centrals: Buffer[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = Buffer.from(entry.name);
    const flags = entry.flags ?? 0;
    const method = entry.method ?? 0;
    const crc = entry.crc ?? crc32(entry.bytes);
    const local = Buffer.alloc(30);

    local.writeUInt32LE(0x04_03_4b_50, 0);
    local.writeUInt16LE(20, 4);
    local.writeUInt16LE(flags, 6);
    local.writeUInt16LE(method, 8);
    local.writeUInt16LE(0, 10);
    local.writeUInt16LE(0x21, 12);
    local.writeUInt32LE(crc, 14);
    local.writeUInt32LE(entry.bytes.length, 18);
    local.writeUInt32LE(entry.bytes.length, 22);
    local.writeUInt16LE(name.length, 26);
    local.writeUInt16LE(0, 28);

    const central = Buffer.alloc(46);

    central.writeUInt32LE(0x02_01_4b_50, 0);
    central.writeUInt16LE(20, 4);
    central.writeUInt16LE(20, 6);
    central.writeUInt16LE(flags, 8);
    central.writeUInt16LE(method, 10);
    central.writeUInt16LE(0, 12);
    central.writeUInt16LE(0x21, 14);
    central.writeUInt32LE(crc, 16);
    central.writeUInt32LE(entry.size ?? entry.bytes.length, 20);
    central.writeUInt32LE(entry.size ?? entry.bytes.length, 24);
    central.writeUInt16LE(name.length, 28);
    central.writeUInt32LE(entry.externalAttributes ?? 0, 38);
    central.writeUInt32LE(offset, 42);

    locals.push(local, name, Buffer.from(entry.bytes));
    centrals.push(central, name);
    offset += local.length + name.length + entry.bytes.length;
  }

  const directory = Buffer.concat(centrals);
  const locator = Buffer.alloc(options.zip64Locator === true ? 20 : 0);

  if (options.zip64Locator === true) {
    locator.writeUInt32LE(0x07_06_4b_50, 0);
  }

  const end = Buffer.alloc(22);

  end.writeUInt32LE(0x06_05_4b_50, 0);
  end.writeUInt16LE(entries.length, 8);
  end.writeUInt16LE(entries.length, 10);
  end.writeUInt32LE(directory.length, 12);
  end.writeUInt32LE(offset, 16);

  const whole = Buffer.concat([...locals, directory, locator, end]);

  return whole.subarray(0, whole.length - (options.truncate ?? 0));
};

/**
 * Set the uncompressed size of the last entry in the central directory of an archive made by
 * `emitZip` with one deflated entry, because the emitter writes the stored length for both sizes.
 *
 * @param archive - The archive.
 * @param size - The true uncompressed size of its last entry.
 * @returns A copy with the size patched in the last central record.
 */
const patchUncompressedSize = (archive: Uint8Array, size: number): Uint8Array => {
  const copy = Buffer.from(archive);
  const end = copy.length - 22;
  const directory = copy.readUInt32LE(end + 16);
  let at = directory;
  let last = directory;

  while (at < end) {
    last = at;
    at += 46 + copy.readUInt16LE(at + 28) + copy.readUInt16LE(at + 30) + copy.readUInt16LE(at + 32);
  }

  copy.writeUInt32LE(size, last + 24);

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

  const dir = yield* fs.makeTempDirectoryScoped({ directory: workDirectory, prefix: "zip-test-" });
  const file = `${dir}/a.zip`;

  yield* fs.writeFile(file, bytes);

  return file;
});

/**
 * Read `simple` back from its directory form: every entry's path and bytes.
 *
 * @returns The entries of `materialize("simple")`.
 */
const simpleFiles = Effect.fn("test.simpleFiles")(function* simpleFiles() {
  const listed = yield* listPackage(SIMPLE_DIR);

  return yield* Effect.all(
    listed.map((entry) =>
      readEntry(SIMPLE_DIR, entry.path).pipe(Effect.map((bytes) => ({ bytes, path: entry.path }))),
    ),
  );
});

/**
 * Assert that `readZip` of `bytes` is refused under `rule`, naming `entry`, with a feature that
 * mentions `feature`.
 *
 * @param bytes - The archive.
 * @param rule - The expected rule.
 * @param entry - The expected archive entry; `undefined` for an archive-level refusal, which names
 *   the zip file.
 * @param feature - A phrase the refusal's feature must contain.
 */
const assertRefused = Effect.fn("test.assertRefused")(function* assertRefused(
  bytes: Uint8Array,
  rule: ZipRefusal["rule"],
  entry: string | undefined,
  feature: string,
) {
  const file = yield* writeScratch(bytes);
  const failure = yield* Effect.flip(readZip(file));

  assert.instanceOf(failure, ZipRefusal);
  assert.strictEqual(failure.rule, rule);
  assert.strictEqual(failure.entry, entry ?? file);
  assert.include(failure.feature, feature);
});

const MANIFEST: EmitEntry = { bytes: Buffer.from("<manifest/>"), name: "imsmanifest.xml" };

beforeAll(() =>
  Effect.gen(function* materializeSimple() {
    SIMPLE_ZIP = yield* materializeZip("simple");
    SIMPLE_DIR = yield* materialize("simple");
  }).pipe(Effect.provide(TestLayer)),
);

layer(TestLayer, { excludeTestServices: true })("package/zip.ts readZip", (it) => {
  it.effect("simple.zip lists exactly the three files, with the bytes of the directory form", () =>
    Effect.gen(function* readSimple() {
      const entries = yield* readZip(SIMPLE_ZIP);

      assert.deepStrictEqual(
        entries.map((entry) => entry.path),
        ["choice.xml", "images/sign.png", "imsmanifest.xml"],
      );
      assert.deepStrictEqual(entries, yield* simpleFiles());
    }),
  );

  it.effect("a stored re-zip with directory entries reads back to the same bytes", () =>
    Effect.gen(function* readStored() {
      const files = yield* simpleFiles();
      const archive = emitZip([
        { bytes: new Uint8Array(), externalAttributes: 0x10, name: "images/" },
        ...files.map((file) => ({ bytes: file.bytes, name: file.path })),
        { bytes: new Uint8Array(), name: "empty-dir/" },
      ]);
      const entries = yield* readZip(yield* writeScratch(archive));

      assert.deepStrictEqual(entries, files);
    }).pipe(Effect.scoped),
  );

  it.effect("a deflated entry is inflated and its CRC-32 checked", () =>
    Effect.gen(function* readDeflated() {
      const bytes = Buffer.from("deflate me ".repeat(100));
      const archive = emitZip([
        MANIFEST,
        { bytes: deflateRawSync(bytes), crc: crc32(bytes), method: 8, name: "big.txt" },
      ]);
      // The emitter writes the deflated length as both sizes; the uncompressed size is the
      // reader's to learn from the stream, so patch the central directory's size to be true.
      const entries = yield* readZip(
        yield* writeScratch(patchUncompressedSize(archive, bytes.length)),
      );

      assert.deepStrictEqual(
        entries.find((entry) => entry.path === "big.txt")?.bytes,
        new Uint8Array(bytes),
      );
    }).pipe(Effect.scoped),
  );

  it.effect("a CP437 name (byte 0x82, bit 11 clear) is listed as its decoded name", () =>
    Effect.gen(function* readCp437() {
      const archive = emitZip([
        { bytes: Buffer.from("x"), name: Buffer.from([0x63, 0x61, 0x66, 0x82]) },
        MANIFEST,
      ]);
      const entries = yield* readZip(yield* writeScratch(archive));

      assert.deepStrictEqual(
        entries.map((entry) => entry.path),
        ["café", "imsmanifest.xml"],
      );
      assert.deepStrictEqual(entries[0]?.bytes, new Uint8Array(Buffer.from("x")));
    }).pipe(Effect.scoped),
  );

  it.effect("a UTF-8 name (bit 11 set) is listed as written", () =>
    Effect.gen(function* readUtf8() {
      const archive = emitZip([
        { bytes: Buffer.from("x"), flags: 0x8_00, name: "café.xml" },
        MANIFEST,
      ]);
      const entries = yield* readZip(yield* writeScratch(archive));

      assert.deepStrictEqual(
        entries.map((entry) => entry.path),
        ["café.xml", "imsmanifest.xml"],
      );
    }).pipe(Effect.scoped),
  );

  it.effect("a method other than stored or deflate is refused as zip-format", () =>
    assertRefused(
      emitZip([MANIFEST, { bytes: Buffer.from("x"), method: 12, name: "a.bz2" }]),
      "zip-format",
      "a.bz2",
      "compression method 12",
    ).pipe(Effect.scoped),
  );

  it.effect("an encrypted entry is refused as zip-format", () =>
    assertRefused(
      emitZip([MANIFEST, { bytes: Buffer.from("x"), flags: 1, name: "secret.xml" }]),
      "zip-format",
      "secret.xml",
      "encrypted",
    ).pipe(Effect.scoped),
  );

  it.effect("a ZIP64 locator is refused as zip-format", () =>
    assertRefused(
      emitZip([MANIFEST], { zip64Locator: true }),
      "zip-format",
      undefined,
      "ZIP64",
    ).pipe(Effect.scoped),
  );

  it.effect("an entry whose size is 0xFFFFFFFF is refused as zip-format", () =>
    assertRefused(
      emitZip([MANIFEST, { bytes: Buffer.from("x"), name: "huge.bin", size: 0xff_ff_ff_ff }]),
      "zip-format",
      "huge.bin",
      "ZIP64",
    ).pipe(Effect.scoped),
  );

  it.effect("a truncated archive is refused as zip-format", () =>
    assertRefused(
      emitZip([MANIFEST], { truncate: 10 }),
      "zip-format",
      undefined,
      "end-of-central-directory",
    ).pipe(Effect.scoped),
  );

  it.effect("bytes that are not an archive are refused as zip-format", () =>
    assertRefused(
      Buffer.from("this is not a zip file at all"),
      "zip-format",
      undefined,
      "end-of-central-directory",
    ).pipe(Effect.scoped),
  );

  it.effect("a CRC-32 mismatch is refused as zip-format", () =>
    assertRefused(
      emitZip([MANIFEST, { bytes: Buffer.from("x"), crc: 1, name: "bad.xml" }]),
      "zip-format",
      "bad.xml",
      "CRC-32",
    ).pipe(Effect.scoped),
  );

  it.effect("an absolute, parent or backslash name is refused as href-path", () =>
    Effect.gen(function* refusePaths() {
      yield* assertRefused(
        emitZip([MANIFEST, { bytes: Buffer.from("x"), name: "/etc/passwd" }]),
        "href-path",
        "/etc/passwd",
        "absolute",
      );
      yield* assertRefused(
        emitZip([MANIFEST, { bytes: Buffer.from("x"), name: "a/../../b.xml" }]),
        "href-path",
        "a/../../b.xml",
        "..",
      );
      yield* assertRefused(
        emitZip([MANIFEST, { bytes: Buffer.from("x"), name: "a\\b.xml" }]),
        "href-path",
        "a\\b.xml",
        "backslash",
      );
    }).pipe(Effect.scoped),
  );

  it.effect("no imsmanifest.xml at the root is refused as manifest-root", () =>
    assertRefused(
      emitZip([{ bytes: Buffer.from("<manifest/>"), name: "pkg/imsmanifest.xml" }]),
      "manifest-root",
      "imsmanifest.xml",
      "no imsmanifest.xml",
    ).pipe(Effect.scoped),
  );

  it.effect("two entries named imsmanifest.xml are refused as manifest-root", () =>
    assertRefused(
      emitZip([MANIFEST, MANIFEST]),
      "manifest-root",
      "imsmanifest.xml",
      "more than one",
    ).pipe(Effect.scoped),
  );
});

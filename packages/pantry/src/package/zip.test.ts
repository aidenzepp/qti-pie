import { deflateRawSync, crc32 } from "node:zlib";
import path from "node:path";
import { NodeChildProcessSpawner, NodeFileSystem, NodePath } from "@effect/platform-node";
import { assert, beforeAll, layer } from "@effect/vitest";
import { Effect, FileSystem, Layer } from "effect";
import { listPackage, PackageReadError, readEntry } from "#pantry/package/read.ts";
import { readZip, writeZip, ZipRefusal } from "#pantry/package/zip.ts";
import { materialize, materializeCorpus, materializeZip } from "#pantry/test/fixtures.ts";
import type { ZipName } from "#pantry/test/fixtures.ts";

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
 * needs a name that is not UTF-8. `at` writes no local header or data for the entry and points its
 * central record at that offset.
 */
interface EmitEntry {
  readonly at?: number;
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
    central.writeUInt32LE(entry.at ?? offset, 42);

    centrals.push(central, name);

    if (entry.at === undefined) {
      locals.push(local, name, Buffer.from(entry.bytes));
      offset += local.length + name.length + entry.bytes.length;
    }
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

  it.effect("more than 10000 central records are refused naming the archive", () =>
    assertRefused(
      emitZip([
        MANIFEST,
        ...Array.from({ length: 10_000 }, (_, index) => ({
          bytes: new Uint8Array(),
          name: `f/${String(index + 1).padStart(5, "0")}`,
        })),
      ]),
      "zip-format",
      undefined,
      "entries, past the limit of 10000",
    ).pipe(Effect.scoped),
  );

  it.effect("an entry that declares more than 64 MiB is refused naming the entry", () =>
    assertRefused(
      patchUncompressedSize(
        emitZip([
          MANIFEST,
          { bytes: deflateRawSync(Buffer.from("text ".repeat(200))), method: 8, name: "bomb.xml" },
        ]),
        4_294_967_294,
      ),
      "zip-format",
      "bomb.xml",
      "bytes for one entry",
    ).pipe(Effect.scoped),
  );

  it.effect("an entry that declares over 100 times its stored size is refused", () =>
    Effect.gen(function* refuseRatio() {
      const zeros = Buffer.alloc(2 * 1024 * 1024);
      const archive = emitZip([
        MANIFEST,
        { bytes: deflateRawSync(zeros), crc: crc32(zeros), method: 8, name: "zeros.bin" },
      ]);

      yield* assertRefused(
        patchUncompressedSize(archive, zeros.length),
        "zip-format",
        "zeros.bin",
        "times its stored size",
      );
    }).pipe(Effect.scoped),
  );

  it.effect("the same ratio within the 1 MiB allowance reads back to its bytes", () =>
    Effect.gen(function* readAllowed() {
      const zeros = Buffer.alloc(1024 * 1024);
      const archive = emitZip([
        MANIFEST,
        { bytes: deflateRawSync(zeros), crc: crc32(zeros), method: 8, name: "zeros.bin" },
      ]);
      const entries = yield* readZip(
        yield* writeScratch(patchUncompressedSize(archive, zeros.length)),
      );

      assert.deepStrictEqual(
        entries.find((entry) => entry.path === "zeros.bin")?.bytes,
        new Uint8Array(zeros),
      );
    }).pipe(Effect.scoped),
  );

  it.effect("sizes that sum past 256 MiB are refused naming the archive", () =>
    assertRefused(
      emitZip([
        MANIFEST,
        ...["a", "b", "c", "d", "e"].map((name) => ({
          bytes: Buffer.from("x"),
          name: `${name}.bin`,
          size: 60 * 1024 * 1024,
        })),
      ]),
      "zip-format",
      undefined,
      "bytes for one package",
    ).pipe(Effect.scoped),
  );

  it.effect("two central records naming one local entry are refused as an overlap", () =>
    Effect.gen(function* refuseRepeat() {
      const payload = Buffer.from("<a>some bytes</a>");
      const manifestLength = 30 + MANIFEST.name.length + MANIFEST.bytes.length;

      yield* assertRefused(
        emitZip([
          MANIFEST,
          { bytes: payload, name: "a.xml" },
          { at: manifestLength, bytes: payload, name: "b.xml" },
        ]),
        "zip-format",
        "b.xml",
        "overlaps the data of a.xml",
      );
    }).pipe(Effect.scoped),
  );

  it.effect("a record whose range starts inside another entry's data is refused", () =>
    Effect.gen(function* refuseInside() {
      const payload = Buffer.from("<b>inner entry</b>");
      const inner = emitZip([{ bytes: payload, name: "b.xml" }]).subarray(
        0,
        30 + "b.xml".length + payload.length,
      );
      const manifestLength = 30 + MANIFEST.name.length + MANIFEST.bytes.length;

      yield* assertRefused(
        emitZip([
          MANIFEST,
          { bytes: inner, name: "a.xml" },
          { at: manifestLength + 30 + "a.xml".length, bytes: payload, name: "b.xml" },
        ]),
        "zip-format",
        "b.xml",
        "overlaps the data of a.xml",
      );
    }).pipe(Effect.scoped),
  );
});

/**
 * The 28 QTI 3 zips of the examples tarball, by the name `materializeZip` takes.
 */
const CORPUS_ZIPS: readonly ZipName[] = [
  "BBQsTest",
  "BPIG_22April",
  "BegGuide_March2025",
  "CASE",
  "CASEWithOutcome",
  "CAT_Test01_Adaptive_EchoAdapt",
  "basicFeedbackTest",
  "ccPackage",
  "englishBasicLevelV2",
  "englishHighLevelV2",
  "externalMetadata",
  "feedbackTest",
  "interactionMixSaxonyV3",
  "items",
  "lti",
  "maxfiles",
  "metaData",
  "pci_item_examples",
  "pci_simple_example",
  "sample_pci",
  "shared-vocabulary-imsmanifest",
  "sharedMedia",
  "sharedStimulus",
  "simple",
  "svg",
  "testWithLti",
  "test_package_minfiles",
  "usageData",
];

layer(TestLayer, { excludeTestServices: true })("package/read.ts over a .zip", (it) => {
  it.effect("listPackage of a zip equals listPackage of the directory, entry for entry", () =>
    Effect.gen(function* listBoth() {
      assert.deepStrictEqual(yield* listPackage(SIMPLE_ZIP), yield* listPackage(SIMPLE_DIR));
    }),
  );

  it.effect("readEntry of images/sign.png gives the same 4029 bytes from both forms", () =>
    Effect.gen(function* readBoth() {
      const fromZip = yield* readEntry(SIMPLE_ZIP, "images/sign.png");

      assert.strictEqual(fromZip.length, 4029);
      assert.deepStrictEqual(fromZip, yield* readEntry(SIMPLE_DIR, "images/sign.png"));
    }),
  );

  it.effect("readEntry of a path the zip lacks is an entry-path refusal", () =>
    Effect.gen(function* readMissing() {
      const failure = yield* Effect.flip(readEntry(SIMPLE_ZIP, "nope.xml"));

      if (!(failure instanceof PackageReadError)) {
        assert.fail(`expected a PackageReadError, got ${failure._tag}`);
      }

      assert.strictEqual(failure.rule, "entry-path");
    }),
  );

  it.effect("a zip with no imsmanifest.xml at its root is a PackageReadError, manifest-root", () =>
    Effect.gen(function* listNoManifest() {
      const file = yield* writeScratch(
        emitZip([{ bytes: Buffer.from("<manifest/>"), name: "pkg/imsmanifest.xml" }]),
      );
      const failure = yield* Effect.flip(listPackage(file));

      if (!(failure instanceof PackageReadError)) {
        assert.fail(`expected a PackageReadError, got ${failure._tag}`);
      }

      assert.strictEqual(failure.rule, "manifest-root");
    }).pipe(Effect.scoped),
  );

  it.effect("every other ZipRefusal flows out of both functions as itself", () =>
    Effect.gen(function* refuseBoth() {
      const file = yield* writeScratch(
        emitZip([MANIFEST, { bytes: Buffer.from("x"), name: "../escape.xml" }]),
      );

      for (const failure of [
        yield* Effect.flip(listPackage(file)),
        yield* Effect.flip(readEntry(file, "imsmanifest.xml")),
      ]) {
        if (!(failure instanceof ZipRefusal)) {
          assert.fail(`expected a ZipRefusal, got ${failure._tag}`);
        }

        assert.strictEqual(failure.rule, "href-path");
      }
    }).pipe(Effect.scoped),
  );

  it.effect("the corpus list names exactly the zips materializeCorpus returns", () =>
    Effect.gen(function* compareNames() {
      const corpus = yield* materializeCorpus();

      assert.deepStrictEqual(
        corpus.map((member) => member.name).toSorted(),
        CORPUS_ZIPS.toSorted(),
      );
    }),
  );

  it.effect(
    "the 28 corpus zips read whole: 546 file entries, no directory, no cap refusing one",
    () =>
      Effect.gen(function* readCorpus() {
        let files = 0;

        for (const name of CORPUS_ZIPS) {
          const zip = yield* materializeZip(name);
          const entries = yield* listPackage(zip);

          assert.isTrue(
            entries.some((entry) => entry.kind === "manifest" && entry.path === "imsmanifest.xml"),
            name,
          );
          assert.isFalse(
            entries.some((entry) => entry.path.endsWith("/")),
            name,
          );
          files += entries.length;
        }

        assert.strictEqual(CORPUS_ZIPS.length, 28);
        assert.strictEqual(files, 546);
      }),
    { timeout: 120_000 },
  );
});

/**
 * What a test's own header parser reads from one central directory record.
 */
interface WrittenRecord {
  readonly date: number;
  readonly flags: number;
  readonly method: number;
  readonly name: string;
  readonly time: number;
}

/**
 * What {@link parseHeaders} reads: the central records and the count of local headers found.
 */
interface WrittenHeaders {
  readonly locals: number;
  readonly records: readonly WrittenRecord[];
}

/**
 * Read every central directory record of an archive and count its local headers, without
 * `readZip`, so a test checks the container's fields independently of the reader.
 *
 * @param bytes - The archive.
 * @returns The central records and the number of local file headers found at the offsets they name.
 */
const parseHeaders = (bytes: Uint8Array): WrittenHeaders => {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const end = bytes.byteLength - 22;
  const count = view.getUint16(end + 10, true);
  const records: WrittenRecord[] = [];
  let locals = 0;
  let at = view.getUint32(end + 16, true);

  for (let index = 0; index < count; index += 1) {
    const nameLength = view.getUint16(at + 28, true);

    records.push({
      date: view.getUint16(at + 14, true),
      flags: view.getUint16(at + 8, true),
      method: view.getUint16(at + 10, true),
      name: new TextDecoder().decode(bytes.subarray(at + 46, at + 46 + nameLength)),
      time: view.getUint16(at + 12, true),
    });

    if (view.getUint32(view.getUint32(at + 42, true), true) === 0x04_03_4b_50) {
      locals += 1;
    }

    at += 46 + nameLength + view.getUint16(at + 30, true) + view.getUint16(at + 32, true);
  }

  return { locals, records };
};

layer(TestLayer, { excludeTestServices: true })("package/zip.ts writeZip", (it) => {
  it.effect("readZip of writeZip of the simple zip lists the same entries with equal bytes", () =>
    Effect.gen(function* roundTrip() {
      const original = yield* readZip(SIMPLE_ZIP);
      const rewritten = yield* readZip(yield* writeScratch(writeZip(original)));

      assert.isAbove(original.length, 1);
      assert.deepStrictEqual(
        rewritten.map((entry) => ({ bytes: [...entry.bytes], path: entry.path })),
        original.map((entry) => ({ bytes: [...entry.bytes], path: entry.path })),
      );
    }).pipe(Effect.scoped),
  );

  it.effect("the container has no directory entry, bit 11 on every entry and the fixed stamp", () =>
    Effect.gen(function* inspect() {
      const original = yield* readZip(SIMPLE_ZIP);
      const { locals, records } = parseHeaders(writeZip(original));

      assert.strictEqual(records.length, original.length);
      assert.strictEqual(locals, original.length);
      assert.deepStrictEqual(
        records.map((record) => record.name),
        original.map((entry) => entry.path),
      );

      for (const record of records) {
        assert.isFalse(record.name.endsWith("/"), record.name);
        assert.strictEqual(record.flags, 0x8_00, record.name);
        // 1980-01-01 is DOS date 0x0021 (year 0, month 1, day 1); 00:00:00 is time 0.
        assert.strictEqual(record.date, 0x00_21, record.name);
        assert.strictEqual(record.time, 0, record.name);
      }
    }),
  );

  it.effect("a 10-byte entry is stored and a 1000-byte one is deflated", () =>
    Effect.gen(function* methods() {
      const small = new Uint8Array(10).fill(97);
      const large = new Uint8Array(1000).fill(98);
      const archive = writeZip([
        { bytes: Buffer.from("<m/>"), path: "imsmanifest.xml" },
        { bytes: small, path: "small.txt" },
        { bytes: large, path: "large.txt" },
      ]);
      const byName = new Map(parseHeaders(archive).records.map((record) => [record.name, record]));

      assert.strictEqual(byName.get("imsmanifest.xml")?.method, 0);
      assert.strictEqual(byName.get("small.txt")?.method, 0);
      assert.strictEqual(byName.get("large.txt")?.method, 8);

      const read = yield* readZip(yield* writeScratch(archive));

      assert.deepStrictEqual(read.find((entry) => entry.path === "large.txt")?.bytes, large);
      assert.deepStrictEqual(read.find((entry) => entry.path === "small.txt")?.bytes, small);
    }).pipe(Effect.scoped),
  );

  it.effect("non-ASCII names round trip under bit 11", () =>
    Effect.gen(function* names() {
      const archive = writeZip([
        { bytes: Buffer.from("<m/>"), path: "imsmanifest.xml" },
        { bytes: Buffer.from("é"), path: "images/café-日本.txt" },
      ]);
      const read = yield* readZip(yield* writeScratch(archive));

      assert.deepStrictEqual(
        read.map((entry) => entry.path),
        ["images/café-日本.txt", "imsmanifest.xml"],
      );
    }).pipe(Effect.scoped),
  );
});

/**
 * The package container, checked as properties: `readZip`, and `listPackage` and `readPackage`
 * over a `.zip`, against a model of what a package archive is; `writeZip` against the reader; and
 * the corpus's zips against their directory forms.
 *
 * The model is an independent reading of the two specifications a package archive answers to, not
 * of `zip.ts`: PKWARE's APPNOTE 6.3.10 (4.3.7 local file header, 4.3.9 data descriptor, 4.3.12
 * central directory header, 4.3.16 end of central directory record, 4.4.4 general purpose bit
 * flags, 4.4.5 compression methods, 4.4.15 external attributes, Appendix D code page 437) and IMS
 * Content Packaging 1.2 (the package interchange file holds `imsmanifest.xml` at its root, once),
 * with `readZip`'s documented budgets (10,000 entries, 64 MiB an entry, 100 times an entry's
 * stored size past 1 MiB, 256 MiB a package). The archives are written by this file's own emitter,
 * field by field from the APPNOTE's layouts, never by `writeZip`.
 */
import { crc32, deflateRawSync } from "node:zlib";
import path from "node:path";
import { isDeepStrictEqual } from "node:util";
import { NodeChildProcessSpawner, NodeFileSystem, NodePath } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { drawn, explore } from "@grizzle/testing/explore";
import { required } from "@grizzle/testing/features";
import { array, boolean, bytes, constant, element, int, map, weighted } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { keep, swarm, swarmChoice } from "@grizzle/testing/swarm";
import type { Swarm } from "@grizzle/testing/swarm";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, FileSystem, Formatter, Layer, Result } from "effect";
import { listPackage, PackageReadError, readEntry, readPackage } from "#pantry/package/read.ts";
import type { Entry, PackageFile } from "#pantry/package/read.ts";
import { packageBudget, readZip, writeZip, ZipRefusal } from "#pantry/package/zip.ts";
import type { ZipBudget, ZipEntry } from "#pantry/package/zip.ts";
import { materializeCorpus, materializeZip, zipMembers } from "#pantry/test/fixtures.ts";
import type { ZipName } from "#pantry/test/fixtures.ts";

/**
 * The file system the readers need, and the process spawner and path service the fixture
 * materializers need.
 */
const TestLayer = NodeChildProcessSpawner.layer.pipe(
  Layer.provideMerge(Layer.mergeAll(NodeFileSystem.layer, NodePath.layer)),
);

/**
 * The package's gitignored `work/`, under which every scratch directory is made.
 */
const workDirectory = path.resolve(import.meta.dirname, "../../work");

/**
 * How long one case may run before the search reports it hung: a case writes one archive of at
 * most a few kilobytes and reads it back.
 */
const caseHang = Duration.seconds(30);

const MANIFEST = "imsmanifest.xml";

const MIB = 1024 * 1024;

/**
 * How an archive spells its names: UTF-8 under general purpose bit 11, or code page 437 without
 * it (APPNOTE 4.4.4, Appendix D).
 */
type Coding = "utf-8" | "cp437";

/**
 * The letters a name's segments are drawn from, per coding, beside ASCII. Each non-ASCII letter of
 * the code page 437 alphabet is listed with its byte from APPNOTE Appendix D: é 0x82, ü 0x81, ñ
 * 0xA4. 日 is in no code page 437 cell, so it is drawn only under UTF-8.
 */
const LETTERS: Readonly<Record<Coding, readonly [string, ...string[]]>> = {
  cp437: ["a", "b", "é", "ü", "ñ"],
  "utf-8": ["a", "b", "é", "ü", "日"],
};

/**
 * The code page 437 bytes of the non-ASCII letters above, read from the code page, not from
 * `zip.ts`'s table.
 */
const CP437_BYTES: ReadonlyMap<string, number> = new Map([
  ["é", 0x82],
  ["ü", 0x81],
  ["ñ", 0xa4],
]);

/**
 * A name's bytes under a coding.
 */
const nameBytes = (name: string, coding: Coding): Uint8Array =>
  coding === "utf-8"
    ? new TextEncoder().encode(name)
    : Uint8Array.from(
        Array.from(name, (char) => CP437_BYTES.get(char) ?? char.codePointAt(0) ?? 0),
      );

/**
 * One file of a sketched archive. `deflate` stores it under method 8 (RFC 1951) rather than 0;
 * `descriptor` sets bit 3 and writes its CRC-32 and sizes in a data descriptor after the data,
 * leaving them zero in the local header; `localExtra` and `centralExtra` are extra-field lengths,
 * which the two headers need not share.
 */
interface FileSketch {
  readonly bytes: Uint8Array;
  readonly centralExtra: number;
  readonly deflate: boolean;
  readonly descriptor: boolean;
  readonly localExtra: number;
  readonly path: string;
}

/**
 * A directory entry, in one of the three forms APPNOTE gives one: a name ending `/`, the MS-DOS
 * directory attribute 0x10 under host 0, or a Unix directory mode under host 3 (4.4.2, 4.4.15).
 */
interface DirectorySketch {
  readonly form: "dos" | "slash" | "unix";
  readonly path: string;
}

/**
 * The faults an archive may carry, each a named way it breaks one rule, and `none`, the floor: a
 * case carries at most one, so the model never has to guess which of two faults a reader reports.
 */
const FAULTS = [
  "none",
  "not-zip",
  "truncated",
  "zip64-locator",
  "count-marker",
  "split-disk",
  "count-budget",
  "package-budget",
  "no-manifest",
  "nested-manifest",
  "two-manifests",
  "duplicate-name",
  "method",
  "encrypted",
  "strong-encryption",
  "zip64-size",
  "absolute-name",
  "drive-name",
  "parent-name",
  "backslash-name",
  "stray-offset",
  "shared-offset",
  "nested-offset",
  "ratio-budget",
  "declared-size",
  "inflate",
  "crc",
] as const;

type FaultKind = (typeof FAULTS)[number];

/**
 * What a valid archive may also hold, which the swarm weighs beside the faults: directory entries,
 * data descriptors, an archive comment, and extra fields.
 */
const ALLOWANCES = ["directory", "descriptor", "comment", "extra"] as const;

type Knob = FaultKind | (typeof ALLOWANCES)[number];

/**
 * What a case is noted for reaching: its fault, what it holds, and how its files are written.
 */
type Reached = Knob | "deflated" | "stored" | "cp437" | "overlap-target-first";

/**
 * What a case is: a valid archive of `files` and `directories`, in that write order, its names in
 * `coding`, with an archive comment, and the one fault applied to it. A fault on an entry names
 * it by its index in `files`; `amount` is the fault's own number (a method code, bytes cut, a count
 * or a declared size) and `bytes` the replacement of a `not-zip` file.
 */
interface ArchiveSketch {
  readonly amount: number;
  readonly bytes: Uint8Array;
  readonly coding: Coding;
  readonly comment: string;
  readonly directories: readonly DirectorySketch[];
  readonly fault: FaultKind;
  readonly files: readonly FileSketch[];
  readonly target: number;
}

/**
 * A name of up to two directory segments and a base, each segment one to three letters of the
 * coding, the base ending `-<index>` so no two files of a case share a path by construction.
 */
const pathOf = (coding: Coding, index: number): Gen<string> => {
  const segment = map(array(element(LETTERS[coding]), { max: 3, min: 1 }), (letters) =>
    letters.join(""),
  );

  return (source) => {
    const directories = source.draw(array(segment, { max: 2, min: 0 }));

    return [...directories, `${source.draw(segment)}-${index}`].join("/");
  };
};

/**
 * Bytes around the 64-byte line `writeZip` stores below, or a run of zeros that deflates far.
 */
const contentOf: Gen<Uint8Array> = weighted([
  [3, bytes({ max: 80, min: 0 })],
  [1, map(int(0, 4000), (length) => new Uint8Array(length))],
]);

const fileOf =
  (coding: Coding, index: number, knobs: Swarm<Knob>): Gen<FileSketch> =>
  (source) => ({
    bytes: source.draw(contentOf),
    centralExtra: source.draw(keep(knobs, "extra")) ? source.draw(int(1, 8)) : 0,
    deflate: source.draw(boolean),
    descriptor: source.draw(keep(knobs, "descriptor")),
    localExtra: source.draw(keep(knobs, "extra")) ? source.draw(int(1, 8)) : 0,
    path: source.draw(pathOf(coding, index)),
  });

/**
 * Each fault's own number: a method APPNOTE 4.4.5 names that is neither stored (0) nor deflated
 * (8); a cut of one byte to the whole end record; an entry count just past 10,000; a declared size
 * a bomb's length past 1 MiB; which of the three 32-bit fields holds ZIP64's
 * 0xFFFFFFFF.
 */
const AMOUNTS: Readonly<Record<FaultKind, Gen<number>>> = {
  "absolute-name": constant(0),
  "backslash-name": constant(0),
  "count-budget": int(10_001, 10_003),
  "count-marker": constant(0),
  crc: constant(0),
  "declared-size": constant(0),
  "drive-name": constant(0),
  "duplicate-name": constant(0),
  encrypted: constant(0),
  inflate: constant(0),
  method: element([1, 2, 3, 4, 5, 6, 9, 10, 12, 14, 18, 19, 93, 95, 96, 97, 98, 99]),
  "nested-manifest": constant(0),
  "nested-offset": constant(0),
  "no-manifest": constant(0),
  none: constant(0),
  "not-zip": constant(0),
  "package-budget": constant(0),
  "parent-name": constant(0),
  "ratio-budget": int(MIB + 1, 2 * MIB),
  "shared-offset": constant(0),
  "split-disk": constant(0),
  "stray-offset": constant(0),
  "strong-encryption": constant(0),
  truncated: int(1, 22),
  "two-manifests": constant(0),
  "zip64-locator": constant(0),
  "zip64-size": int(0, 2),
};

/**
 * Bytes that hold no end record, because no byte is 0x50 (`P`), the first byte of its signature.
 */
const notZip: Gen<Uint8Array> = map(array(int(0, 0x4f), { max: 64, min: 0 }), (values) =>
  Uint8Array.from(values),
);

/**
 * An archive with one fault or none, drawn under a swarm of the faults and allowances: each case
 * turns a lopsided subset on, and `none` is the floor when every fault is off.
 */
const archiveOf: Gen<ArchiveSketch> = (source) => {
  const knobs = source.draw(swarm<Knob>([...FAULTS, ...ALLOWANCES]));
  const fault = source.draw(swarmChoice(knobs, FAULTS));
  const coding = source.draw(element(["utf-8", "cp437"] as const));
  const others = source.draw(int(1, 4));
  const manifestAt = source.draw(int(0, others));
  const files = Array.from({ length: others + 1 }, (_, index) => {
    const file = source.draw(fileOf(coding, index, knobs));

    return index === manifestAt ? { ...file, path: MANIFEST } : file;
  });
  const forms = source.draw(
    array(element(["slash", "dos", "unix"] as const), {
      max: source.draw(keep(knobs, "directory")) ? 3 : 0,
      min: 0,
    }),
  );
  const named = files.flatMap((file, index) => (file.path === MANIFEST ? [] : [index]));
  const eligible = fault.endsWith("-name") ? named : [...files.keys()];
  const target = eligible[source.draw(int(0, eligible.length - 1))] ?? 0;

  return {
    amount: source.draw(AMOUNTS[fault]),
    bytes: fault === "not-zip" ? source.draw(notZip) : new Uint8Array(),
    coding,
    comment: source.draw(keep(knobs, "comment"))
      ? `kept${"x".repeat(source.draw(int(0, 30)))}`
      : "",
    directories: forms.map((form, index) => ({
      form,
      path: form === "slash" ? `dir-${index}/` : `dir-${index}`,
    })),
    fault,
    files,
    // A shared or nested offset points a later record at the first file's local header or into its
    // data, so its data span stays inside the archive and only the overlap is wrong.
    target: fault === "shared-offset" || fault === "nested-offset" ? Math.max(1, target) : target,
  };
};

/**
 * One record as the emitter writes it: the fields both headers carry, whether it has a local
 * header of its own (`local: false` writes none, for a record that points elsewhere), and the
 * offset its central record names, from its own local offset and every record's.
 */
interface Emitted {
  readonly centralExtra: number;
  readonly crc: number;
  readonly data: Uint8Array;
  readonly descriptor: boolean;
  readonly external: number;
  readonly flags: number;
  readonly local: boolean;
  readonly localExtra: number;
  readonly madeBy: number;
  readonly method: number;
  readonly name: Uint8Array;
  readonly offset: (own: number, locals: readonly number[]) => number;
  readonly size: number;
  readonly storedSize: number;
}

/**
 * The end record's fields a fault may change.
 */
interface EndRecord {
  readonly comment: string;
  readonly count: number;
  readonly disk: number;
  readonly locator: boolean;
}

/**
 * The external attributes of each directory form: MS-DOS's directory bit, none, or the Unix mode
 * `drwxr-xr-x` (0o40755, 0x41ED) in the high half.
 */
const EXTERNAL: Readonly<Record<DirectorySketch["form"], number>> = {
  dos: 0x10,
  slash: 0,
  unix: 0x41_ed * 0x1_00_00,
};

/**
 * The records of a sketch's valid archive, before its fault.
 */
const recordsOf = (sketch: ArchiveSketch): Emitted[] => {
  const utf8Flag = sketch.coding === "utf-8" ? 0x8_00 : 0;
  const files = sketch.files.map((file): Emitted => {
    const data = file.deflate ? new Uint8Array(deflateRawSync(file.bytes)) : file.bytes;

    return {
      centralExtra: file.centralExtra,
      crc: crc32(file.bytes),
      data,
      descriptor: file.descriptor,
      external: 0,
      flags: utf8Flag + (file.descriptor ? 0x8 : 0),
      local: true,
      localExtra: file.localExtra,
      madeBy: 20,
      method: file.deflate ? 8 : 0,
      name: nameBytes(file.path, sketch.coding),
      offset: (own) => own,
      size: file.bytes.length,
      storedSize: data.length,
    };
  });
  const directories = sketch.directories.map((directory): Emitted => ({
    centralExtra: 0,
    crc: 0,
    data: new Uint8Array(),
    descriptor: false,
    external: EXTERNAL[directory.form],
    flags: utf8Flag,
    local: true,
    localExtra: 0,
    madeBy: directory.form === "unix" ? 3 * 0x1_00 + 20 : 20,
    method: 0,
    name: nameBytes(directory.path, sketch.coding),
    offset: (own) => own,
    size: 0,
    storedSize: 0,
  }));

  return [...files, ...directories];
};

/**
 * One local header (APPNOTE 4.3.7), its name, extra field and data, and its data descriptor
 * (4.3.9) when bit 3 defers the CRC-32 and sizes to one.
 */
const localPart = (record: Emitted): readonly Buffer[] => {
  const header = Buffer.alloc(30);

  header.writeUInt32LE(0x04_03_4b_50, 0);
  header.writeUInt16LE(20, 4);
  header.writeUInt16LE(record.flags, 6);
  header.writeUInt16LE(record.method, 8);
  header.writeUInt16LE(0x21, 12);
  header.writeUInt32LE(record.descriptor ? 0 : record.crc, 14);
  header.writeUInt32LE(record.descriptor ? 0 : record.storedSize, 18);
  header.writeUInt32LE(record.descriptor ? 0 : record.size, 22);
  header.writeUInt16LE(record.name.length, 26);
  header.writeUInt16LE(record.localExtra, 28);

  const descriptor = Buffer.alloc(record.descriptor ? 16 : 0);

  if (record.descriptor) {
    descriptor.writeUInt32LE(0x08_07_4b_50, 0);
    descriptor.writeUInt32LE(record.crc, 4);
    descriptor.writeUInt32LE(record.data.length, 8);
    descriptor.writeUInt32LE(record.size, 12);
  }

  return [
    header,
    Buffer.from(record.name),
    Buffer.alloc(record.localExtra),
    Buffer.from(record.data),
    descriptor,
  ];
};

/**
 * One central directory header (APPNOTE 4.3.12) with its name and extra field.
 */
const centralPart = (record: Emitted, offset: number): readonly Buffer[] => {
  const header = Buffer.alloc(46);

  header.writeUInt32LE(0x02_01_4b_50, 0);
  header.writeUInt16LE(record.madeBy, 4);
  header.writeUInt16LE(20, 6);
  header.writeUInt16LE(record.flags, 8);
  header.writeUInt16LE(record.method, 10);
  header.writeUInt16LE(0x21, 14);
  header.writeUInt32LE(record.crc, 16);
  header.writeUInt32LE(record.storedSize, 20);
  header.writeUInt32LE(record.size, 24);
  header.writeUInt16LE(record.name.length, 28);
  header.writeUInt16LE(record.centralExtra, 30);
  header.writeUInt32LE(record.external, 38);
  header.writeUInt32LE(offset, 42);

  return [header, Buffer.from(record.name), Buffer.alloc(record.centralExtra)];
};

/**
 * The bytes of an archive: every local part, the central directory, an optional ZIP64 end locator
 * (APPNOTE 4.3.15), and the end record (4.3.16) with its comment.
 */
const emit = (records: readonly Emitted[], end: EndRecord): Uint8Array => {
  const locals: number[] = [];
  const localParts: Buffer[] = [];
  let offset = 0;

  for (const record of records) {
    locals.push(offset);

    if (record.local) {
      const part = localPart(record);

      localParts.push(...part);
      offset += part.reduce((sum, piece) => sum + piece.length, 0);
    }
  }

  const central = Buffer.concat(
    records.flatMap((record, index) =>
      centralPart(record, record.offset(locals[index] ?? 0, locals)),
    ),
  );
  const locator = Buffer.alloc(end.locator ? 20 : 0);

  if (end.locator) {
    locator.writeUInt32LE(0x07_06_4b_50, 0);
  }

  const comment = Buffer.from(end.comment, "latin1");
  const record = Buffer.alloc(22);

  record.writeUInt32LE(0x06_05_4b_50, 0);
  record.writeUInt16LE(end.disk, 4);
  record.writeUInt16LE(end.count, 8);
  record.writeUInt16LE(end.count, 10);
  record.writeUInt32LE(central.length, 12);
  record.writeUInt32LE(offset, 16);
  record.writeUInt16LE(comment.length, 20);

  return Buffer.concat([...localParts, central, locator, record, comment]);
};

/**
 * What a fault is applied to: the case, its valid records, its end record, and the record it
 * targets with that record's path.
 */
interface Faulting {
  readonly end: EndRecord;
  readonly records: readonly Emitted[];
  readonly sketch: ArchiveSketch;
  readonly target: Emitted;
  readonly targetPath: string;
}

/**
 * The archive with its target record's fields changed.
 */
const withTarget = (faulting: Faulting, fields: Partial<Emitted>): Uint8Array =>
  emit(
    faulting.records.map((record, index) =>
      index === faulting.sketch.target ? { ...record, ...fields } : record,
    ),
    faulting.end,
  );

/**
 * The archive with its target record renamed.
 */
const renamed = (faulting: Faulting, name: string): Uint8Array =>
  withTarget(faulting, { name: nameBytes(name, faulting.sketch.coding) });

/**
 * The archive with one more record at a local header of its own: the target's fields, one stored
 * byte, and `name`.
 */
const withTwin = (faulting: Faulting, name: string): Uint8Array =>
  emit(
    [
      ...faulting.records,
      {
        ...faulting.target,
        crc: crc32(Uint8Array.of(0x74)),
        data: Uint8Array.of(0x74),
        descriptor: false,
        flags: faulting.target.flags - (faulting.target.descriptor ? 0x8 : 0),
        method: 0,
        name: nameBytes(name, faulting.sketch.coding),
        size: 1,
        storedSize: 1,
      },
    ],
    { ...faulting.end, count: faulting.records.length + 1 },
  );

/**
 * The archive with the root manifest's record renamed by `rename`, or dropped where it gives none.
 */
const withManifest = (faulting: Faulting, rename: (record: Emitted) => readonly Emitted[]) => {
  const records = faulting.records.flatMap((record, index) =>
    faulting.sketch.files[index]?.path === MANIFEST ? rename(record) : [record],
  );

  return emit(records, { ...faulting.end, count: records.length });
};

/**
 * Five records with no local header that each declare 60 MiB, stored and uncompressed alike: each
 * is under the entry budget and its ratio is one, and together they pass 256 MiB.
 */
const withBudgetPhantoms = (faulting: Faulting): Uint8Array =>
  emit(
    [
      ...faulting.records,
      ...Array.from({ length: 5 }, (_, index): Emitted => ({
        ...faulting.target,
        local: false,
        name: nameBytes(`budget-${index}`, faulting.sketch.coding),
        offset: () => 0,
        size: 60 * MIB,
        storedSize: 60 * MIB,
      })),
    ],
    { ...faulting.end, count: faulting.records.length + 5 },
  );

/**
 * The target replaced by an honest bomb: `amount` zero bytes past 1 MiB, deflated more than a
 * hundredfold, with its true size and CRC-32 declared, so only the ratio budget refuses it.
 */
const withBomb = (faulting: Faulting): Uint8Array => {
  const zeros = new Uint8Array(faulting.sketch.amount);
  const data = new Uint8Array(deflateRawSync(zeros));

  return withTarget(faulting, {
    crc: crc32(zeros),
    data,
    descriptor: false,
    flags: faulting.target.flags - (faulting.target.descriptor ? 0x8 : 0),
    method: 8,
    size: zeros.length,
    storedSize: data.length,
  });
};

/**
 * The first file's data replaced by the target's whole local part, stored, and the target's
 * central record pointed at it: every header parses and every CRC-32 holds, and only the target's
 * range lying inside the first file's data is wrong.
 */
const withNestedRecord = (faulting: Faulting): Uint8Array => {
  const [first, ...rest] = faulting.records;

  if (first === undefined) {
    return emit(faulting.records, faulting.end);
  }

  const embedded = Buffer.concat(localPart(faulting.target));
  const host: Emitted = {
    ...first,
    crc: crc32(embedded),
    data: embedded,
    descriptor: false,
    flags: first.flags - (first.descriptor ? 0x8 : 0),
    method: 0,
    size: embedded.length,
    storedSize: embedded.length,
  };
  const dataStart = (locals: readonly number[]) =>
    (locals[0] ?? 0) + 30 + first.name.length + first.localExtra;

  return emit(
    [host, ...rest].map((record, index) =>
      index === faulting.sketch.target
        ? { ...record, offset: (_own: number, locals: readonly number[]) => dataStart(locals) }
        : record,
    ),
    faulting.end,
  );
};

/**
 * The archive grown to `amount` records, past 10,000, by empty stored files of their own: a valid
 * archive in every other respect, so only the entry budget refuses it.
 */
const withFiller = (faulting: Faulting): Uint8Array => {
  const filler = Array.from(
    { length: faulting.sketch.amount - faulting.records.length },
    (_, index): Emitted => ({
      ...faulting.target,
      centralExtra: 0,
      crc: 0,
      data: new Uint8Array(),
      descriptor: false,
      flags: faulting.target.flags - (faulting.target.descriptor ? 0x8 : 0),
      localExtra: 0,
      method: 0,
      name: nameBytes(`count-${index}`, faulting.sketch.coding),
      offset: (own) => own,
      size: 0,
      storedSize: 0,
    }),
  );

  return emit([...faulting.records, ...filler], { ...faulting.end, count: faulting.sketch.amount });
};

/**
 * How each fault breaks a valid archive, as bytes.
 */
const FAULTED: Readonly<Record<FaultKind, (faulting: Faulting) => Uint8Array>> = {
  "absolute-name": (faulting) => renamed(faulting, `/${faulting.targetPath}`),
  "backslash-name": (faulting) => renamed(faulting, `${faulting.targetPath}\\x`),
  "count-budget": withFiller,
  "count-marker": (faulting) => emit(faulting.records, { ...faulting.end, count: 0xff_ff }),
  crc: (faulting) => withTarget(faulting, { crc: (faulting.target.crc + 1) % 0x1_00_00_00_00 }),
  "declared-size": (faulting) => withTarget(faulting, { size: faulting.target.size + 1 }),
  "drive-name": (faulting) => renamed(faulting, `C:${faulting.targetPath}`),
  "duplicate-name": (faulting) => withTwin(faulting, faulting.targetPath),
  encrypted: (faulting) => withTarget(faulting, { flags: faulting.target.flags + 0x1 }),
  inflate: (faulting) =>
    withTarget(faulting, { data: Uint8Array.of(0xff), method: 8, storedSize: 1 }),
  method: (faulting) => withTarget(faulting, { method: faulting.sketch.amount }),
  "nested-manifest": (faulting) =>
    withManifest(faulting, (record) => [
      { ...record, name: nameBytes(`pkg/${MANIFEST}`, faulting.sketch.coding) },
    ]),
  "nested-offset": withNestedRecord,
  "no-manifest": (faulting) => withManifest(faulting, () => []),
  none: (faulting) => emit(faulting.records, faulting.end),
  "not-zip": (faulting) => faulting.sketch.bytes,
  "package-budget": withBudgetPhantoms,
  "parent-name": (faulting) => renamed(faulting, `../${faulting.targetPath}`),
  "ratio-budget": withBomb,
  "shared-offset": (faulting) => withTarget(faulting, { offset: (_own, locals) => locals[0] ?? 0 }),
  "split-disk": (faulting) => emit(faulting.records, { ...faulting.end, disk: 1 }),
  "stray-offset": (faulting) => withTarget(faulting, { offset: (own) => own + 1 }),
  "strong-encryption": (faulting) => withTarget(faulting, { flags: faulting.target.flags + 0x40 }),
  truncated: (faulting) => {
    // Cut the comment and at least one byte of the end record, so no end record is whole.
    const whole = emit(faulting.records, faulting.end);

    return whole.subarray(0, whole.length - faulting.end.comment.length - faulting.sketch.amount);
  },
  "two-manifests": (faulting) => withTwin(faulting, MANIFEST),
  "zip64-locator": (faulting) => emit(faulting.records, { ...faulting.end, locator: true }),
  "zip64-size": (faulting) =>
    withTarget(
      faulting,
      [{ storedSize: 0xff_ff_ff_ff }, { size: 0xff_ff_ff_ff }, { offset: () => 0xff_ff_ff_ff }][
        faulting.sketch.amount
      ] ?? {},
    ),
};

/**
 * A sketch's archive bytes: its valid records with its fault applied.
 */
const archiveBytes = (sketch: ArchiveSketch): Uint8Array => {
  const records = recordsOf(sketch);
  const end = { comment: sketch.comment, count: records.length, disk: 0, locator: false };
  const target = records[sketch.target] ?? records[0];

  return target === undefined
    ? emit(records, end)
    : FAULTED[sketch.fault]({
        end,
        records,
        sketch,
        target,
        targetPath: sketch.files[sketch.target]?.path ?? "",
      });
};

/**
 * Where a refusal points: the archive itself, or one entry by its decoded name.
 */
type Concerned = Readonly<{ kind: "archive" }> | Readonly<{ kind: "entry"; path: string }>;

/**
 * What the model says a reader must do with an archive: list its files, sorted by UTF-16 code unit
 * with every directory entry dropped, or refuse it under a rule, naming what it concerns.
 */
type Verdict =
  | Readonly<{ entries: readonly ZipEntry[]; kind: "accepted" }>
  | Readonly<{ concerned: Concerned; kind: "refused"; rule: ZipRefusal["rule"] }>;

const byCodeUnit = (left: string, right: string): number => {
  if (left === right) {
    return 0;
  }

  return left < right ? -1 : 1;
};

const archiveRefused: Verdict = {
  concerned: { kind: "archive" },
  kind: "refused",
  rule: "zip-format",
};

const entryRefused = (rule: ZipRefusal["rule"], at: string): Verdict => ({
  concerned: { kind: "entry", path: at },
  kind: "refused",
  rule,
});

/**
 * The model, fault by fault: the rule each fault breaks and what its refusal concerns.
 */
const VERDICTS: Readonly<
  Record<FaultKind, (sketch: ArchiveSketch, targetPath: string) => Verdict>
> = {
  "absolute-name": (_sketch, at) => entryRefused("href-path", `/${at}`),
  "backslash-name": (_sketch, at) => entryRefused("href-path", `${at}\\x`),
  "count-budget": () => archiveRefused,
  "count-marker": () => archiveRefused,
  crc: (_sketch, at) => entryRefused("zip-format", at),
  "declared-size": (_sketch, at) => entryRefused("zip-format", at),
  "drive-name": (_sketch, at) => entryRefused("href-path", `C:${at}`),
  "duplicate-name": (_sketch, at) => entryRefused("zip-format", at),
  encrypted: (_sketch, at) => entryRefused("zip-format", at),
  inflate: (_sketch, at) => entryRefused("zip-format", at),
  method: (_sketch, at) => entryRefused("zip-format", at),
  "nested-manifest": () => entryRefused("manifest-root", MANIFEST),
  // A record inside the first file's data overlaps it, and lies after it by offset.
  "nested-offset": (_sketch, at) => entryRefused("zip-format", at),
  "no-manifest": () => entryRefused("manifest-root", MANIFEST),
  none: (sketch) => ({
    entries: sketch.files
      .map((file) => ({ bytes: file.bytes, path: file.path }))
      .toSorted((left, right) => byCodeUnit(left.path, right.path)),
    kind: "accepted",
  }),
  "not-zip": () => archiveRefused,
  "package-budget": () => archiveRefused,
  "parent-name": (_sketch, at) => entryRefused("href-path", `../${at}`),
  "ratio-budget": (_sketch, at) => entryRefused("zip-format", at),
  // Two records at one local header: the later of the two by name overlaps the earlier's data.
  "shared-offset": (sketch, at) => {
    const first = sketch.files[0]?.path ?? "";

    return entryRefused("zip-format", byCodeUnit(first, at) < 0 ? at : first);
  },
  "split-disk": () => archiveRefused,
  "stray-offset": (_sketch, at) => entryRefused("zip-format", at),
  "strong-encryption": (_sketch, at) => entryRefused("zip-format", at),
  truncated: () => archiveRefused,
  "two-manifests": () => entryRefused("manifest-root", MANIFEST),
  "zip64-locator": () => archiveRefused,
  "zip64-size": (_sketch, at) => entryRefused("zip-format", at),
};

const verdictOf = (sketch: ArchiveSketch): Verdict =>
  VERDICTS[sketch.fault](sketch, sketch.files[sketch.target]?.path ?? "");

/**
 * Write a case's archive under `directory` and return its path.
 */
const scratchArchive = (directory: string, archive: Uint8Array) =>
  Effect.gen(function* writeArchive() {
    const fs = yield* FileSystem.FileSystem;
    const file = `${directory}/case.zip`;

    yield* fs.writeFile(file, archive);

    return file;
  });

/**
 * A scratch directory under `work/`, removed with the test's scope.
 */
const scratchDirectory = (prefix: string) =>
  Effect.gen(function* makeScratch() {
    const fs = yield* FileSystem.FileSystem;

    yield* fs.makeDirectory(workDirectory, { recursive: true });

    return yield* fs.makeTempDirectoryScoped({ directory: workDirectory, prefix });
  });

/**
 * What a case reached: its fault, each allowance it holds, how its files are written.
 */
const reachedBy = (sketch: ArchiveSketch): readonly Reached[] => [
  sketch.fault,
  ...(sketch.directories.length > 0 ? ["directory" as const] : []),
  ...(sketch.files.some((file) => file.descriptor) ? ["descriptor" as const] : []),
  ...(sketch.comment.length > 0 ? ["comment" as const] : []),
  ...(sketch.files.some((file) => file.localExtra + file.centralExtra > 0)
    ? ["extra" as const]
    : []),
  sketch.files.some((file) => file.deflate) ? "deflated" : "stored",
  ...(sketch.coding === "cp437" ? ["cp437" as const] : []),
  // Which record of an overlapping pair a reader must name depends on their names' order, so the
  // order where the moved record sorts first is a situation of its own.
  ...(sketch.fault === "shared-offset" &&
  byCodeUnit(sketch.files[sketch.target]?.path ?? "", sketch.files[0]?.path ?? "") < 0
    ? ["overlap-target-first" as const]
    : []),
];

/**
 * A reader's outcome in the model's terms, or `outside` for a failure that is no container rule's,
 * which no model verdict equals.
 */
const observed = (
  outcome: Result.Result<readonly ZipEntry[], unknown>,
  file: string,
): Verdict | Readonly<{ failure: string; kind: "outside" }> => {
  if (Result.isSuccess(outcome)) {
    return { entries: outcome.success, kind: "accepted" };
  }

  const { failure } = outcome;

  if (failure instanceof ZipRefusal) {
    return {
      concerned:
        failure.entry === file ? { kind: "archive" } : { kind: "entry", path: failure.entry },
      kind: "refused",
      rule: failure.rule,
    };
  }

  // listPackage and readPackage give a zip's manifest-root refusal as their own.
  if (failure instanceof PackageReadError && failure.rule === "manifest-root") {
    return entryRefused("manifest-root", failure.path);
  }

  return { failure: String(failure), kind: "outside" };
};

/**
 * `readPackage`'s files as `readZip`'s entries.
 */
const asEntries = Result.map((files: readonly PackageFile[]): readonly ZipEntry[] =>
  files.map((file) => ({ bytes: file.bytes, path: file.path })),
);

/**
 * `listPackage`'s entries as `readZip`'s, with no bytes, beside a verdict with its bytes dropped.
 */
const asListed = Result.map((entries: readonly Entry[]): readonly ZipEntry[] =>
  entries.map((entry) => ({ bytes: new Uint8Array(), path: entry.path })),
);

/**
 * `readEntry`'s bytes as no entries: only a refused archive's outcome is compared.
 */
const asNoEntries = Result.map((): readonly ZipEntry[] => []);

const listedVerdict = (verdict: Verdict): Verdict =>
  verdict.kind === "accepted"
    ? {
        ...verdict,
        entries: verdict.entries.map((entry) => ({ bytes: new Uint8Array(), path: entry.path })),
      }
    : verdict;

describe("package/zip.ts readZip, and package/read.ts over a .zip", () => {
  it.effect(
    "every reader gives the container model's verdict on an archive with one fault or none",
    (ctx) =>
      searched(
        ctx,
        Effect.gen(function* searchArchives() {
          const directory = yield* scratchDirectory("zip-law-");

          return yield* explore(
            {
              caseHang,
              concurrency: 1,
              coverage: required<Reached>(
                [...FAULTS, ...ALLOWANCES, "deflated", "stored", "cp437"],
                {
                  cases: 2000,
                  sense: notesOnly,
                },
              ),
              draw: drawn(archiveOf),
              kept: [],
              literal: Formatter.format,
              oracle: {
                kind: "second-implementation",
                name: "the container model (verdictOf), an independent reading of APPNOTE 6.3.10 and IMS CP 1.2",
              },
              runs: 400,
              shrink: completeShrink,
              steerEvery: 16,
              suite: "pantry/package/zip-container",
            },
            (sketch, c) =>
              Effect.gen(function* checkArchive() {
                c.noteAll(reachedBy(sketch));

                const file = yield* scratchArchive(directory, archiveBytes(sketch));
                const expected = verdictOf(sketch);

                assert.deepStrictEqual(
                  observed(yield* Effect.result(readZip(file, packageBudget)), file),
                  expected,
                );
                assert.deepStrictEqual(
                  observed(asEntries(yield* Effect.result(readPackage(file))), file),
                  expected,
                );
                assert.deepStrictEqual(
                  observed(asListed(yield* Effect.result(listPackage(file))), file),
                  listedVerdict(expected),
                );

                // readEntry: an accepted archive's entry by its path, a path it lacks as
                // entry-path, and a refused archive's refusal as itself.
                if (expected.kind === "accepted") {
                  for (const entry of expected.entries) {
                    assert.deepStrictEqual(yield* readEntry(file, entry.path), entry.bytes);
                  }

                  const absent = yield* Effect.flip(readEntry(file, "absent.xml"));

                  assert.instanceOf(absent, PackageReadError);
                  assert.strictEqual(absent.rule, "entry-path");
                } else {
                  assert.deepStrictEqual(
                    observed(asNoEntries(yield* Effect.result(readEntry(file, MANIFEST))), file),
                    expected,
                  );
                }
              }),
          );
        }).pipe(Effect.scoped, Effect.provide(TestLayer)),
      ),
    { timeout: 300_000 },
  );
});

/**
 * A bound drawn small (doctrine rule 10), and half the time at the archive's own value or one
 * either side of it, so that each bound is met exactly, passed by one and missed by one.
 */
const boundNear =
  (own: number, most: number): Gen<number> =>
  (source) =>
    source.draw(boolean)
      ? Math.max(0, own + source.draw(element([0, -1, 1] as const)))
      : source.draw(int(0, most));

/**
 * A valid archive, its fault dropped, and the budget it is read under: production's
 * {@link packageBudget} one case in five, otherwise small bounds drawn near the archive's own record
 * count, file sizes and total.
 */
const budgetCaseOf: Gen<Readonly<{ archive: ArchiveSketch; budget: ZipBudget }>> = (source) => {
  const archive: ArchiveSketch = { ...source.draw(archiveOf), fault: "none" };
  const records = recordsOf(archive);
  const sizes = records.slice(0, archive.files.length).map((record) => record.size);
  const size = sizes[source.draw(int(0, sizes.length - 1))] ?? 0;
  const total = sizes.reduce((sum, each) => sum + each, 0);
  const small: Gen<ZipBudget> = (inner) => ({
    entries: Math.max(1, inner.draw(boundNear(records.length, 8))),
    entryBytes: inner.draw(boundNear(size, 120)),
    packageBytes: inner.draw(boundNear(total, 400)),
    ratio: inner.draw(int(1, 12)),
    ratioAllowance: inner.draw(boundNear(size, 120)),
  });

  return {
    archive,
    budget: source.draw(
      weighted<ZipBudget>([
        [1, constant(packageBudget)],
        [4, small],
      ]),
    ),
  };
};

type BudgetBreach = "count" | "entry-bytes" | "ratio" | "package-bytes";

/**
 * The budget rules a valid archive breaks, each with what its refusal names: more records than
 * `entries` (the archive, checked before anything else), a file past `entryBytes` or past `ratio`
 * times its stored size beyond `ratioAllowance` (that file), and files past `packageBytes` between
 * them (the archive). The stored sizes are the emitter's.
 */
const breachesOf = (
  archive: ArchiveSketch,
  budget: ZipBudget,
): readonly (readonly [BudgetBreach, Verdict])[] => {
  const records = recordsOf(archive);

  if (records.length > budget.entries) {
    return [["count", archiveRefused]];
  }

  const files = records.slice(0, archive.files.length).map((record, index) => ({
    path: archive.files[index]?.path ?? "",
    size: record.size,
    stored: record.storedSize,
  }));
  const total = files.reduce((sum, file) => sum + file.size, 0);

  return [
    ...files
      .filter((file) => file.size > budget.entryBytes)
      .map((file) => ["entry-bytes", entryRefused("zip-format", file.path)] as const),
    ...files
      .filter((file) => file.size > Math.max(budget.ratioAllowance, budget.ratio * file.stored))
      .map((file) => ["ratio", entryRefused("zip-format", file.path)] as const),
    ...(total > budget.packageBytes ? [["package-bytes", archiveRefused] as const] : []),
  ];
};

describe("package/zip.ts readZip under a drawn budget", () => {
  it.effect(
    "accepts a valid archive within the budget, and refuses one past it naming what breaks it",
    (ctx) =>
      searched(
        ctx,
        Effect.gen(function* searchBudgets() {
          const directory = yield* scratchDirectory("zip-budget-");

          return yield* explore(
            {
              caseHang,
              concurrency: 1,
              coverage: required<BudgetBreach | "within" | "production">(
                ["count", "entry-bytes", "ratio", "package-bytes", "within", "production"],
                { cases: 1000, sense: notesOnly },
              ),
              draw: drawn(budgetCaseOf),
              kept: [],
              literal: Formatter.format,
              oracle: {
                kind: "second-implementation",
                name: "the budget model (breachesOf) of readZip's documented budgets, and the container model within them",
              },
              runs: 300,
              shrink: completeShrink,
              steerEvery: 16,
              suite: "pantry/package/zip-budget",
            },
            ({ archive, budget }, c) =>
              Effect.gen(function* checkBudget() {
                const breaches = breachesOf(archive, budget);

                c.noteAll(breaches.map(([breach]) => breach));

                if (breaches.length === 0) {
                  c.note("within");
                }

                if (budget === packageBudget) {
                  c.note("production");
                }

                const file = yield* scratchArchive(directory, archiveBytes(archive));
                const outcome = observed(yield* Effect.result(readZip(file, budget)), file);

                // With several breaches the contract names one of them, never which.
                if (breaches.length === 0) {
                  assert.deepStrictEqual(outcome, verdictOf(archive));
                } else {
                  assert.isTrue(
                    breaches.some(([, verdict]) => isDeepStrictEqual(verdict, outcome)),
                    `${Formatter.format(outcome)} is none of ${Formatter.format(breaches)}`,
                  );
                }
              }),
          );
        }).pipe(Effect.scoped, Effect.provide(TestLayer)),
      ),
    { timeout: 300_000 },
  );
});

/**
 * Entries `writeZip` takes: the manifest and up to four files at distinct UTF-8 paths, their bytes
 * around the 64-byte line it stores below.
 */
const entriesOf: Gen<readonly ZipEntry[]> = (source) => {
  const others = source.draw(int(0, 4));

  return [
    { bytes: source.draw(contentOf), path: MANIFEST },
    ...Array.from({ length: others }, (_, index) => ({
      bytes: source.draw(contentOf),
      path: source.draw(pathOf("utf-8", index)),
    })),
  ];
};

/**
 * What this file's own header walk reads from one central directory record of an archive.
 */
interface WrittenRecord {
  readonly date: number;
  readonly flags: number;
  readonly local: boolean;
  readonly method: number;
  readonly name: string;
  readonly time: number;
}

/**
 * Walk an archive's central directory from its end record, without `readZip`, so the container
 * `writeZip` writes is checked independently of the reader. `local` says a local header's signature
 * stands at the offset the record names.
 */
const centralRecords = (archive: Uint8Array): readonly WrittenRecord[] => {
  const view = Buffer.from(archive);
  const end = view.length - 22;
  const records: WrittenRecord[] = [];
  let at = view.readUInt32LE(end + 16);

  for (let index = 0; index < view.readUInt16LE(end + 10); index += 1) {
    const nameLength = view.readUInt16LE(at + 28);

    records.push({
      date: view.readUInt16LE(at + 14),
      flags: view.readUInt16LE(at + 8),
      local: view.readUInt32LE(view.readUInt32LE(at + 42)) === 0x04_03_4b_50,
      method: view.readUInt16LE(at + 10),
      name: view.toString("utf-8", at + 46, at + 46 + nameLength),
      time: view.readUInt16LE(at + 12),
    });
    at += 46 + nameLength + view.readUInt16LE(at + 30) + view.readUInt16LE(at + 32);
  }

  return records;
};

describe("package/zip.ts writeZip", () => {
  it.effect(
    "readZip reads back what writeZip wrote, in a container of its documented shape",
    (ctx) =>
      searched(
        ctx,
        Effect.gen(function* searchWritten() {
          const directory = yield* scratchDirectory("zip-write-");

          return yield* explore(
            {
              caseHang,
              concurrency: 1,
              coverage: required<"deflated" | "stored" | "several">(
                ["deflated", "stored", "several"],
                {
                  cases: 500,
                  sense: notesOnly,
                },
              ),
              draw: drawn(entriesOf),
              kept: [],
              literal: Formatter.format,
              oracle: {
                kind: "second-implementation",
                name: "this file's own central directory walk against writeZip's documented container, and readZip ∘ writeZip = the entries by path",
              },
              runs: 200,
              shrink: completeShrink,
              steerEvery: 16,
              suite: "pantry/package/zip-write",
            },
            (entries, c) =>
              Effect.gen(function* checkWritten() {
                const archive = writeZip(entries);
                const records = centralRecords(archive);

                c.noteAll(
                  entries.map((entry) => (entry.bytes.length < 64 ? "stored" : "deflated")),
                );
                if (entries.length > 2) {
                  c.note("several");
                }

                // The documented container: one record and one local header per entry, in the order
                // given, UTF-8 names under bit 11, the fixed 1980-01-01 00:00:00 stamp, entries under
                // 64 bytes stored and the rest deflated, no directory entry.
                assert.deepStrictEqual(
                  records,
                  entries.map((entry) => ({
                    date: 0x00_21,
                    flags: 0x8_00,
                    local: true,
                    method: entry.bytes.length < 64 ? 0 : 8,
                    name: entry.path,
                    time: 0,
                  })),
                );
                assert.deepStrictEqual(
                  yield* readZip(yield* scratchArchive(directory, archive), packageBudget),
                  entries.toSorted((left, right) => byCodeUnit(left.path, right.path)),
                );
              }),
          );
        }).pipe(Effect.scoped, Effect.provide(TestLayer)),
      ),
    { timeout: 300_000 },
  );
});

/**
 * Whether a corpus package's name is a row of the fixtures' table of zip members, which
 * `materializeZip` takes.
 */
const isZipName = (name: string): name is ZipName => Object.hasOwn(zipMembers, name);

/**
 * Whether a path is a macOS Finder `.DS_Store`, which the fixtures' recipe deletes after `unzip`.
 */
const isFinderFile = (at: string): boolean => at === ".DS_Store" || at.endsWith("/.DS_Store");

/**
 * A package's files with their bytes as plain `Uint8Array`s.
 */
const plain = (files: readonly PackageFile[]): readonly PackageFile[] =>
  files.map((file) => ({ ...file, bytes: Uint8Array.from(file.bytes) }));

describe("package/read.ts over the corpus", () => {
  it.effect(
    "every corpus zip, written by a third-party archiver, reads the files and bytes of its directory form",
    () =>
      Effect.gen(function* compareForms() {
        let files = 0;

        for (const { dir, name } of yield* materializeCorpus()) {
          if (!isZipName(name)) {
            assert.fail(`the corpus zip ${name} has no row in the fixtures' zipMembers`);
          }

          const zip = yield* materializeZip(name);
          const fromDirectory = yield* readPackage(dir);

          // The directory form is Info-ZIP's `unzip` of the same member with every `.DS_Store`
          // deleted (fixtures.ts), so it is a second reader of the archive. The forms' byte
          // containers differ (a Buffer from the file system, a Uint8Array from the inflater), and
          // the contract is their bytes.
          const fromZip = yield* readPackage(zip);

          assert.deepStrictEqual(
            plain(fromZip).filter((entry) => !isFinderFile(entry.path)),
            plain(fromDirectory),
            name,
          );
          assert.deepStrictEqual(
            (yield* listPackage(zip)).filter((entry) => !isFinderFile(entry.path)),
            yield* listPackage(dir),
            name,
          );
          assert.isTrue(
            fromDirectory.some((entry) => entry.kind === "manifest" && entry.path === MANIFEST),
            name,
          );

          // readPackage's contract: its entries are listPackage's, each with readEntry's bytes.
          for (const entry of fromDirectory) {
            assert.deepStrictEqual(
              Uint8Array.from(yield* readEntry(dir, entry.path)),
              Uint8Array.from(entry.bytes),
              `${name}/${entry.path}`,
            );
          }

          files += fromZip.length;
        }

        // The examples tarball is pinned by its digest, so its zips' file count is a fact of the
        // input: 546, one of them a `.DS_Store`. A zip the corpus lost, or one it gained, moves it.
        assert.strictEqual(files, 546);
      }).pipe(Effect.provide(TestLayer)),
    { timeout: 300_000 },
  );
});

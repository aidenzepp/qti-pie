/**
 * The zip container search's genome (lane GEN-B): a zip archive as an intention, field by field,
 * never as bytes, and the renderer that writes it, the edits that breed it, the cuts that reduce
 * it and the features it shows.
 *
 * An intention states each entry's name, coding, data, method and flags, the values its headers
 * declare where they are drawn wrong on purpose (the CRC-32, the sizes, a local name unlike the
 * central one), the host and external attributes its central header carries, its extra field and
 * whether a data descriptor follows its data; and the archive's own parts: the order of its central
 * records, extra central records that point at another entry's local header (an overlap), bytes
 * before the first local header, bytes between the central directory and the end record, the
 * ZIP64 structures, the disk numbers and the end record's comment. The renderer writes each field
 * at its place in the layouts of PKWARE's APPNOTE 6.3.10 (4.3.7 local file header, 4.3.9 data
 * descriptor, 4.3.12 central directory header, 4.3.14 and 4.3.15 the ZIP64 end record and its
 * locator, 4.3.16 the end record, 4.5.3 the ZIP64 extended information extra field), so an edit of
 * the intention is an edit of the archive a reader sees, and a reduction cuts whole parts.
 */
import { crc32, deflateRawSync } from "node:zlib";
import { Option } from "effect";
import type { Source } from "@grizzle/testing/source";
import { below, oneOf } from "#pantry/test/gen/genetic/engine.ts";
import type { Edited } from "#pantry/test/gen/genetic/engine.ts";

/**
 * A generator on the choice stream.
 */
type Gen<A> = (source: Source) => A;

/**
 * The compression methods an entry is written with: stored (0), deflated (8), and bzip2's number
 * (12) over deflated bytes, a method the package reader does not read.
 */
export type Method = 0 | 8 | 12;

/**
 * The extra field an entry's headers carry: none, one block of an id no reader knows, or the ZIP64
 * extended information block (APPNOTE 4.5.3) with the sizes the headers mark `0xFFFFFFFF`.
 */
export type Extra = "none" | "unknown" | "zip64";

/**
 * One entry as intended: its name and whether its bit 11 flags it UTF-8 (`utf8Flag`), its data, how
 * it is written, and the fields drawn wrong on purpose.
 *
 * - `declared`: the size both headers declare, when it is not the data's own.
 * - `stored`: how far the compressed size both headers declare is off the data's, 0 for right.
 * - `crc`: whether both headers carry the data's CRC-32 or a wrong one.
 * - `localName`: the name the local header carries, when it is not the central one.
 * - `host`: the central header's version-made-by host byte (0 MS-DOS, 3 Unix, 19 OS X).
 * - `external`: the central header's external file attributes.
 */
export interface EntryIntent {
  readonly crc: "right" | "wrong";
  readonly data: Uint8Array;
  readonly declared: number | undefined;
  readonly descriptor: boolean;
  readonly encrypted: boolean;
  readonly external: number;
  readonly extra: Extra;
  readonly host: number;
  readonly localName: string | undefined;
  readonly method: Method;
  readonly name: string;
  readonly stored: number;
  readonly utf8Flag: boolean;
}

/**
 * The ZIP64 structures an archive carries: none; a ZIP64 end record and its locator (APPNOTE
 * 4.3.14, 4.3.15); the record alone, after the central directory; the locator alone; or the end
 * record's entry count marked `0xFFFF`, which says the count is in a ZIP64 record.
 */
export type Zip64 = "none" | "record-and-locator" | "record" | "locator" | "count-marker";

/**
 * An extra central record: a second name for the local header of the entry at index `of`, so two
 * records share one entry's bytes.
 */
export interface Alias {
  readonly name: string;
  readonly of: number;
}

/**
 * An archive as intended: its entries in local order, the order of their central records, the
 * aliases appended to the central directory, and the archive's own parts. The offsets every header
 * states are from the start of the archive proper, so a `prefix` is bytes the offsets leave out, as
 * a self-extractor's stub is.
 */
export interface ZipIntent {
  readonly aliases: readonly Alias[];
  readonly cdDisk: number;
  readonly centralOrder: "local" | "reversed";
  readonly comment: Uint8Array;
  readonly disk: number;
  readonly entries: readonly EntryIntent[];
  readonly gap: Uint8Array;
  readonly prefix: Uint8Array;
  /**
   * Bytes after the end record's comment, which its comment length leaves out.
   */
  readonly trailing: Uint8Array;
  readonly zip64: Zip64;
}

/**
 * The bytes of a string as UTF-8.
 */
const encoder = new TextEncoder();

/**
 * The bytes of a text.
 *
 * @param text - The text.
 * @returns Its UTF-8 bytes.
 */
export const utf8 = (text: string): Uint8Array => encoder.encode(text);

/**
 * The signatures of the APPNOTE's records, as their bytes: local header, central header, end
 * record, ZIP64 end record, ZIP64 locator and data descriptor.
 */
export const signatures = {
  central: Uint8Array.of(0x50, 0x4b, 0x01, 0x02),
  descriptor: Uint8Array.of(0x50, 0x4b, 0x07, 0x08),
  end: Uint8Array.of(0x50, 0x4b, 0x05, 0x06),
  local: Uint8Array.of(0x50, 0x4b, 0x03, 0x04),
  zip64Locator: Uint8Array.of(0x50, 0x4b, 0x06, 0x07),
  zip64Record: Uint8Array.of(0x50, 0x4b, 0x06, 0x06),
} as const;

/**
 * The package manifest's name.
 */
export const manifestName = "imsmanifest.xml";

/**
 * One MiB.
 */
const mib = 1024 * 1024;

/**
 * The names an entry is drawn among: the manifest and its case variant, plain files, directories
 * by a trailing slash, nested paths, the names a package path refuses (a `..` segment, an absolute
 * path, a drive letter, a backslash), non-ASCII names in two and four UTF-8 bytes, and the
 * manifest's name as a directory.
 */
export const names = [
  manifestName,
  "a.txt",
  "b.xml",
  "d/",
  "d/c.xml",
  "IMSMANIFEST.XML",
  "../x.xml",
  "/abs.xml",
  "C:x.xml",
  "a\\b.xml",
  "é.xml",
  "𝔸.xml",
  `${manifestName}/`,
] as const;

/**
 * The sizes a header declares in place of the data's own, at the edges of the documented budgets
 * (`readZip`'s: 64 MiB an entry, 100 times its stored size past 1 MiB, 256 MiB a package): 0, the
 * ratio allowance and one past it, a size between 63 and 64 MiB, the entry bound and one past it,
 * and a quarter of the package bound and one past it.
 */
export const declaredSizes = [
  0,
  mib,
  mib + 1,
  63 * mib + 512 * 1024,
  64 * mib,
  64 * mib + 1,
  64 * mib + 4096,
] as const;

/**
 * The external attributes an entry is drawn among: none, the MS-DOS directory bit (APPNOTE 4.4.15),
 * a Unix directory mode and a Unix file mode in the high half, a symbolic link's mode, and the DOS
 * bit beside a file mode.
 */
export const externals = [
  0, 0x10,
  // A Unix directory, 0o040755, in the high half.
  0x41_ed_00_00,
  // A Unix file, 0o100644.
  0x81_a4_00_00,
  // A symbolic link, 0o120777.
  0xa1_ff_00_00,
  // A Unix file with the MS-DOS directory bit.
  0x81_a4_00_10,
] as const;

/**
 * The hosts a central header names: MS-DOS, Unix and OS X (APPNOTE 4.4.2.2).
 */
export const hosts = [0, 3, 19] as const;

/**
 * The bytes the archive's free parts are drawn among: none, plain bytes, each record signature, a
 * signature followed by a few bytes, and a stub as a self-extractor's prefix begins.
 */
export const fillers: readonly [Uint8Array, ...Uint8Array[]] = [
  new Uint8Array(0),
  utf8("JUNK"),
  signatures.zip64Record,
  signatures.zip64Locator,
  signatures.central,
  signatures.local,
  signatures.end,
  Uint8Array.of(...signatures.end, 0, 0, 0, 0, 1, 0, 1, 0),
  utf8("MZ\u0000\u0000PE-stub"),
];

/**
 * The comments the end record carries: none, a short one, one of 70 bytes, and one holding an end
 * record's signature with the fields of an empty archive after it, which a reader searching back
 * from the end meets before the real record.
 */
export const comments: readonly [Uint8Array, ...Uint8Array[]] = [
  new Uint8Array(0),
  utf8("x"),
  utf8("c".repeat(70)),
  Uint8Array.of(...utf8("pre"), ...signatures.end, ...new Uint8Array(18)),
];

/**
 * The bytes after the end record's comment: none, one, and more than the 65,535 a comment can
 * hold, past which no reader searching back from the end finds the end record (APPNOTE 4.3.16).
 */
export const trailers: readonly [Uint8Array, ...Uint8Array[]] = [
  new Uint8Array(0),
  utf8("X"),
  new Uint8Array(70_000).fill(0x2a),
];

/**
 * The data an entry holds: empty, short text, text past the writer's 64-byte storing threshold,
 * and bytes that compress poorly.
 */
export const datas: readonly [Uint8Array, ...Uint8Array[]] = [
  new Uint8Array(0),
  utf8("<manifest/>"),
  utf8("hello"),
  utf8("x".repeat(63)),
  utf8("y".repeat(64)),
  utf8("z".repeat(300)),
  Uint8Array.from({ length: 97 }, (_, at) => (at * 151 + 7) % 256),
];

/**
 * An entry with every field right: stored or deflated by its size, its name flagged UTF-8, made on
 * MS-DOS with no attributes.
 *
 * @param name - The entry's name.
 * @param data - Its data.
 * @returns The entry.
 */
export const plainEntry = (name: string, data: Uint8Array): EntryIntent => ({
  crc: "right",
  data,
  declared: undefined,
  descriptor: false,
  encrypted: false,
  external: 0,
  extra: "none",
  host: 0,
  localName: undefined,
  method: data.length >= 64 ? 8 : 0,
  name,
  stored: 0,
  utf8Flag: true,
});

/**
 * An archive of the given entries with every archive part plain.
 *
 * @param entries - The entries, in local order.
 * @returns The archive.
 */
export const plainArchive = (entries: readonly EntryIntent[]): ZipIntent => ({
  aliases: [],
  cdDisk: 0,
  centralOrder: "local",
  comment: new Uint8Array(0),
  disk: 0,
  entries,
  gap: new Uint8Array(0),
  prefix: new Uint8Array(0),
  trailing: new Uint8Array(0),
  zip64: "none",
});

/**
 * A little-endian writer of the fixed fields of one record.
 */
class Fields {
  private readonly bytes: number[] = [];

  /**
   * Append a 16-bit field.
   *
   * @param value - The value, below 65,536.
   * @returns The writer.
   */
  u16(value: number): this {
    this.bytes.push(value % 256, Math.floor(value / 256) % 256);

    return this;
  }

  /**
   * Append a 32-bit field.
   *
   * @param value - The value, below 2³².
   * @returns The writer.
   */
  u32(value: number): this {
    return this.u16(value % 0x1_00_00).u16(Math.floor(value / 0x1_00_00) % 0x1_00_00);
  }

  /**
   * Append a 64-bit field.
   *
   * @param value - The value, a safe integer.
   * @returns The writer.
   */
  u64(value: number): this {
    return this.u32(value % 0x1_00_00_00_00).u32(Math.floor(value / 0x1_00_00_00_00));
  }

  /**
   * Append raw bytes.
   *
   * @param raw - The bytes.
   * @returns The writer.
   */
  raw(raw: Uint8Array): this {
    this.bytes.push(...raw);

    return this;
  }

  /**
   * The bytes written.
   *
   * @returns The bytes.
   */
  done(): Uint8Array {
    return Uint8Array.from(this.bytes);
  }
}

/**
 * The value a 32-bit size field holds when the real value is in the ZIP64 extra field.
 */
const zip64Marker = 0xff_ff_ff_ff;

/**
 * The fixed timestamp every header carries: 1980-01-01 00:00:00 in MS-DOS form.
 */
const dosDate = 0x00_21;

/**
 * One entry as its headers write it: its compressed bytes, and every field both headers share.
 */
interface Written {
  readonly compressed: Uint8Array;
  readonly crc: number;
  readonly entry: EntryIntent;
  readonly extra: Uint8Array;
  readonly flags: number;
  readonly size: number;
  readonly storedSize: number;
}

/**
 * Work out an entry's header fields from its intention.
 *
 * @param entry - The entry.
 * @returns Its written fields.
 */
const writtenOf = (entry: EntryIntent): Written => {
  const compressed = entry.method === 0 ? entry.data : new Uint8Array(deflateRawSync(entry.data));
  const right = crc32(entry.data);
  const size = entry.declared ?? entry.data.length;
  const storedSize = Math.max(0, compressed.length + entry.stored);
  const extras: Readonly<Record<Extra, Uint8Array>> = {
    none: new Uint8Array(0),
    unknown: new Fields().u16(0xca_fe).u16(4).u32(0x01_02_03_04).done(),
    zip64: new Fields().u16(0x00_01).u16(16).u64(size).u64(storedSize).done(),
  };
  const extra = extras[entry.extra];

  return {
    compressed,
    crc: entry.crc === "right" ? right : (right + 1) % 0x1_00_00_00_00,
    entry,
    extra,
    flags:
      (entry.encrypted ? 0x1 : 0) + (entry.descriptor ? 0x8 : 0) + (entry.utf8Flag ? 0x8_00 : 0),
    size,
    storedSize,
  };
};

/**
 * Write one entry's local header, its data, and its data descriptor where it has one.
 *
 * @param entry - The entry's written fields.
 * @returns The bytes.
 */
const localOf = (entry: Written): Uint8Array => {
  const zip64 = entry.entry.extra === "zip64";
  const deferred = entry.entry.descriptor;
  const sizeField = (size: number): number => {
    if (deferred) {
      return 0;
    }

    return zip64 ? zip64Marker : size;
  };
  const name = utf8(entry.entry.localName ?? entry.entry.name);
  const padding = Math.max(0, entry.storedSize - entry.compressed.length);

  return new Fields()
    .raw(signatures.local)
    .u16(20)
    .u16(entry.flags)
    .u16(entry.entry.method)
    .u16(0)
    .u16(dosDate)
    .u32(deferred ? 0 : entry.crc)
    .u32(sizeField(entry.storedSize))
    .u32(sizeField(entry.size))
    .u16(name.length)
    .u16(entry.extra.length)
    .raw(name)
    .raw(entry.extra)
    .raw(entry.compressed.subarray(0, entry.storedSize))
    .raw(new Uint8Array(padding))
    .raw(
      deferred
        ? new Fields()
            .raw(signatures.descriptor)
            .u32(entry.crc)
            .u32(entry.storedSize)
            .u32(entry.size)
            .done()
        : new Uint8Array(0),
    )
    .done();
};

/**
 * An archive as written: its bytes, and where its records are: the central directory's end and the
 * end record's start, in file coordinates, and the local entry each central record points at.
 */
export interface Rendered {
  readonly bytes: Uint8Array;
  readonly directoryEnd: number;
  readonly endAt: number;
  readonly records: readonly number[];
}

/**
 * Write an archive's bytes from its intention.
 *
 * @param intent - The archive.
 * @returns Its bytes and where its records are.
 */
export const render = (intent: ZipIntent): Rendered => {
  const written = intent.entries.map(writtenOf);
  const body = new Fields();
  const offsets: number[] = [];
  let at = 0;
  for (const entry of written) {
    const local = localOf(entry);
    offsets.push(at);
    body.raw(local);
    at += local.length;
  }

  const central = new Fields();
  const order = intent.entries.map((_, index) => index);
  const records = [
    ...(intent.centralOrder === "local" ? order : order.toReversed()).map((index) => ({
      index,
      name: undefined,
    })),
    ...intent.aliases.flatMap(({ name, of }) => (of < written.length ? [{ index: of, name }] : [])),
  ];
  for (const record of records) {
    const entry = written[record.index];
    if (entry !== undefined) {
      const zip64 = entry.entry.extra === "zip64";
      const name = utf8(record.name ?? entry.entry.name);
      central
        .raw(signatures.central)
        .u16(entry.entry.host * 256 + 20)
        .u16(20)
        .u16(entry.flags)
        .u16(entry.entry.method)
        .u16(0)
        .u16(dosDate)
        .u32(entry.crc)
        .u32(zip64 ? zip64Marker : entry.storedSize)
        .u32(zip64 ? zip64Marker : entry.size)
        .u16(name.length)
        .u16(entry.extra.length)
        .u16(0)
        .u16(0)
        .u16(0)
        .u32(entry.entry.external)
        .u32(offsets[record.index] ?? 0)
        .raw(name)
        .raw(entry.extra);
    }
  }

  const directory = central.done();
  const directoryOffset = at;
  const recordOffset = directoryOffset + directory.length + intent.gap.length;
  const zip64Record = new Fields()
    .raw(signatures.zip64Record)
    .u64(44)
    .u16(45)
    .u16(45)
    .u32(intent.disk)
    .u32(intent.cdDisk)
    .u64(records.length)
    .u64(records.length)
    .u64(directory.length)
    .u64(directoryOffset)
    .done();
  const locator = new Fields()
    .raw(signatures.zip64Locator)
    .u32(intent.cdDisk)
    .u64(recordOffset)
    .u32(1)
    .done();
  const tail = new Fields()
    .raw(
      intent.zip64 === "record-and-locator" || intent.zip64 === "record"
        ? zip64Record
        : new Uint8Array(0),
    )
    .raw(
      intent.zip64 === "record-and-locator" || intent.zip64 === "locator"
        ? locator
        : new Uint8Array(0),
    )
    .raw(signatures.end)
    .u16(intent.disk)
    .u16(intent.cdDisk)
    .u16(intent.zip64 === "count-marker" ? 0xff_ff : records.length % 0x1_00_00)
    .u16(intent.zip64 === "count-marker" ? 0xff_ff : records.length % 0x1_00_00)
    .u32(directory.length)
    .u32(directoryOffset)
    .u16(intent.comment.length)
    .raw(intent.comment)
    .done();

  const bytes = Uint8Array.from([
    ...intent.prefix,
    ...body.done(),
    ...directory,
    ...intent.gap,
    ...tail,
    ...intent.trailing,
  ]);

  return {
    bytes,
    directoryEnd: intent.prefix.length + directoryOffset + directory.length,
    endAt: bytes.length - 22 - intent.comment.length - intent.trailing.length,
    records: records.flatMap(({ index }) => (index < written.length ? [index] : [])),
  };
};

/**
 * Write bytes as a report shows them: as text where every byte is printable ASCII, as hex where
 * not.
 *
 * @param raw - The bytes.
 * @returns The text.
 */
const shownBytes = (raw: Uint8Array): string => {
  if (raw.length === 0) {
    return '""';
  }

  if (raw.length > 256) {
    return `${String(raw.length)} bytes from 0x${Buffer.from(raw.subarray(0, 8)).toString("hex")}`;
  }

  return [...raw].every((byte) => byte >= 0x20 && byte < 0x7f)
    ? JSON.stringify(new TextDecoder().decode(raw))
    : `0x${Buffer.from(raw).toString("hex")}`;
};

/**
 * An entry's fields a report names where they are not plain.
 */
const reportedFields = [
  "crc",
  "declared",
  "descriptor",
  "encrypted",
  "external",
  "extra",
  "host",
  "localName",
  "stored",
  "utf8Flag",
] as const satisfies readonly (keyof EntryIntent)[];

/**
 * Write an archive as the text a report shows: its intention, the bytes of each part as text where
 * they are text and as hex where not.
 *
 * @param intent - The archive.
 * @returns The text.
 */
export const shownIntent = (intent: ZipIntent): string => {
  const plain = plainEntry("", new Uint8Array(0));

  return [
    ...intent.entries.map((entry, index) => {
      const fields = reportedFields
        .filter((key) => entry[key] !== plain[key])
        .map((key) => `${key}=${String(entry[key])}`);

      return `entry ${String(index)} ${JSON.stringify(entry.name)} method ${String(entry.method)} data ${shownBytes(entry.data)}${fields.length === 0 ? "" : ` ${fields.join(" ")}`}`;
    }),
    ...intent.aliases.map(({ name, of }) => `alias ${JSON.stringify(name)} of entry ${String(of)}`),
    `central order ${intent.centralOrder}, zip64 ${intent.zip64}, disk ${String(intent.disk)}, cd disk ${String(intent.cdDisk)}, prefix ${shownBytes(intent.prefix)}, gap ${shownBytes(intent.gap)}, comment ${shownBytes(intent.comment)}, trailing ${shownBytes(intent.trailing)}`,
  ].join("\n");
};

/**
 * The edits of a zip intention, each named.
 */
export const zipOperators = [
  "insert-entry",
  "delete-entry",
  "swap-entries",
  "crossover",
  "entry-field",
  "archive-field",
  "alias",
  "splice-signature",
] as const;

/**
 * One edit.
 */
export type ZipOperator = (typeof zipOperators)[number];

/**
 * The entry fields an `entry-field` edit draws among.
 */
const entryFields = [
  "name",
  "utf8Flag",
  "data",
  "method",
  "encrypted",
  "descriptor",
  "crc",
  "declared",
  "stored",
  "host",
  "external",
  "extra",
  "localName",
] as const;

/**
 * One entry field's edits: each draws the field's new value for an entry.
 */
const fieldEdits: Readonly<
  Record<(typeof entryFields)[number], (entry: EntryIntent) => Gen<EntryIntent>>
> = {
  crc: (entry) => () => ({ ...entry, crc: entry.crc === "right" ? "wrong" : "right" }),
  data: (entry) => (source) => ({ ...entry, data: source.draw(oneOf(datas)) ?? entry.data }),
  declared: (entry) => (source) => ({
    ...entry,
    declared:
      source.draw(below(4)) === 0
        ? undefined
        : source.draw(oneOf([...declaredSizes, entry.data.length + 1])),
  }),
  descriptor: (entry) => () => ({ ...entry, descriptor: !entry.descriptor }),
  encrypted: (entry) => () => ({ ...entry, encrypted: !entry.encrypted }),
  external: (entry) => (source) => ({ ...entry, external: source.draw(oneOf(externals)) ?? 0 }),
  extra: (entry) => (source) => ({
    ...entry,
    extra: source.draw(oneOf(["none", "unknown", "zip64"] as const)) ?? "none",
  }),
  host: (entry) => (source) => ({ ...entry, host: source.draw(oneOf(hosts)) ?? 0 }),
  localName: (entry) => (source) => ({
    ...entry,
    localName: entry.localName === undefined ? source.draw(oneOf(names)) : undefined,
  }),
  method: (entry) => (source) => ({
    ...entry,
    method: source.draw(oneOf([0, 8, 12] as const)) ?? 0,
  }),
  name: (entry) => (source) => ({ ...entry, name: source.draw(oneOf(names)) ?? entry.name }),
  stored: (entry) => (source) => ({ ...entry, stored: source.draw(oneOf([0, -1, 1, 4096])) ?? 0 }),
  utf8Flag: (entry) => () => ({ ...entry, utf8Flag: !entry.utf8Flag }),
};

/**
 * The archive parts an `archive-field` edit draws among.
 */
const archiveFields = [
  "cdDisk",
  "centralOrder",
  "comment",
  "disk",
  "gap",
  "prefix",
  "trailing",
  "zip64",
] as const;

/**
 * Draw one archive part's new value.
 *
 * @param intent - The archive.
 * @param field - The part.
 * @returns The generator of the edited archive.
 */
const editedPart =
  (intent: ZipIntent, field: (typeof archiveFields)[number]): Gen<ZipIntent> =>
  (source) => {
    switch (field) {
      case "cdDisk": {
        return { ...intent, cdDisk: intent.cdDisk === 0 ? 1 : 0 };
      }
      case "disk": {
        return { ...intent, disk: intent.disk === 0 ? 1 : 0 };
      }
      case "centralOrder": {
        return { ...intent, centralOrder: intent.centralOrder === "local" ? "reversed" : "local" };
      }
      case "comment": {
        return { ...intent, comment: source.draw(oneOf(comments)) ?? intent.comment };
      }
      case "gap": {
        return { ...intent, gap: source.draw(oneOf(fillers)) ?? intent.gap };
      }
      case "prefix": {
        return { ...intent, prefix: source.draw(oneOf(fillers)) ?? intent.prefix };
      }
      case "trailing": {
        return { ...intent, trailing: source.draw(oneOf(trailers)) ?? intent.trailing };
      }
      case "zip64": {
        return {
          ...intent,
          zip64:
            source.draw(
              oneOf(["none", "record-and-locator", "record", "locator", "count-marker"] as const),
            ) ?? "none",
        };
      }
      default: {
        return field satisfies never;
      }
    }
  };

/**
 * Splice a byte string into another at a drawn place.
 *
 * @param into - The bytes spliced into.
 * @param piece - The bytes spliced in.
 * @returns The generator of the spliced bytes.
 */
const spliced =
  (into: Uint8Array, piece: Uint8Array): Gen<Uint8Array> =>
  (source) => {
    const at = source.draw(below(into.length + 1));

    return Uint8Array.from([...into.subarray(0, at), ...piece, ...into.subarray(at)]);
  };

/**
 * Rebuild an archive with one entry replaced.
 *
 * @param intent - The archive.
 * @param index - The entry's index.
 * @param entry - The new entry.
 * @returns The archive.
 */
const withEntryAt = (intent: ZipIntent, index: number, entry: EntryIntent): ZipIntent => ({
  ...intent,
  entries: intent.entries.map((held, at) => (at === index ? entry : held)),
});

/**
 * The edits of each operator: the edited archive and a note, none where the archive has no site.
 */
const edits: Readonly<
  Record<ZipOperator, (intent: ZipIntent, mate: ZipIntent) => Gen<Option.Option<Edited<ZipIntent>>>>
> = {
  alias: (intent) => (source) => {
    const of = source.draw(below(intent.entries.length));
    const name = source.draw(oneOf(names)) ?? "alias.txt";

    return intent.entries.length === 0
      ? Option.none()
      : Option.some({
          genome: { ...intent, aliases: [...intent.aliases, { name, of }] },
          note: `alias ${name} of entry ${String(of)}`,
        });
  },
  "archive-field": (intent) => (source) => {
    const field = source.draw(oneOf(archiveFields)) ?? "gap";

    return Option.some({
      genome: source.draw(editedPart(intent, field)),
      note: `archive-field ${field}`,
    });
  },
  crossover: (intent, mate) => (source) => {
    if (mate.entries.length === 0) {
      return Option.none();
    }

    const cut = source.draw(below(intent.entries.length + 1));
    const from = source.draw(below(mate.entries.length));

    return Option.some({
      genome: {
        ...intent,
        aliases: intent.aliases.filter(({ of }) => of < cut),
        entries: [...intent.entries.slice(0, cut), ...mate.entries.slice(from)],
      },
      note: `crossover at ${String(cut)} from the mate's entry ${String(from)}`,
    });
  },
  "delete-entry": (intent) => (source) => {
    const index = source.draw(below(intent.entries.length));

    return intent.entries.length === 0
      ? Option.none()
      : Option.some({
          genome: {
            ...intent,
            aliases: intent.aliases
              .filter(({ of }) => of !== index)
              .map((alias) => ({
                ...alias,
                of: alias.of > index ? alias.of - 1 : alias.of,
              })),
            entries: intent.entries.filter((_, at) => at !== index),
          },
          note: `delete-entry ${String(index)}`,
        });
  },
  "entry-field": (intent) => (source) => {
    const index = source.draw(below(intent.entries.length));
    const entry = intent.entries[index];
    const field = source.draw(oneOf(entryFields)) ?? "crc";

    return entry === undefined
      ? Option.none()
      : Option.some({
          genome: withEntryAt(intent, index, source.draw(fieldEdits[field](entry))),
          note: `entry-field ${field} of entry ${String(index)}`,
        });
  },
  "insert-entry": (intent) => (source) => {
    const name = source.draw(oneOf(names)) ?? "a.txt";
    const data = source.draw(oneOf(datas)) ?? new Uint8Array(0);
    const at = source.draw(below(intent.entries.length + 1));

    return Option.some({
      genome: {
        ...intent,
        aliases: intent.aliases.map((alias) => ({
          ...alias,
          of: alias.of >= at ? alias.of + 1 : alias.of,
        })),
        entries: [
          ...intent.entries.slice(0, at),
          plainEntry(name, data),
          ...intent.entries.slice(at),
        ],
      },
      note: `insert-entry ${name} at ${String(at)}`,
    });
  },
  "splice-signature": (intent) => (source) => {
    const piece = source.draw(oneOf(Object.values(signatures))) ?? signatures.end;
    const place = source.draw(oneOf(["comment", "gap", "data"] as const)) ?? "comment";
    if (place === "data") {
      const index = source.draw(below(intent.entries.length));
      const entry = intent.entries[index];

      return entry === undefined
        ? Option.none()
        : Option.some({
            genome: withEntryAt(intent, index, {
              ...entry,
              data: source.draw(spliced(entry.data, piece)),
            }),
            note: `splice-signature into entry ${String(index)}'s data`,
          });
    }

    return Option.some({
      genome: { ...intent, [place]: source.draw(spliced(intent[place], piece)) },
      note: `splice-signature into the ${place}`,
    });
  },
  "swap-entries": (intent) => (source) => {
    if (intent.entries.length < 2) {
      return Option.none();
    }

    const left = source.draw(below(intent.entries.length));
    const right =
      (left + 1 + source.draw(below(intent.entries.length - 1))) % intent.entries.length;
    const swapped = intent.entries.map((entry, at) => {
      if (at === left) {
        return intent.entries[right] ?? entry;
      }

      return at === right ? (intent.entries[left] ?? entry) : entry;
    });

    return Option.some({
      genome: { ...intent, aliases: [], entries: swapped },
      note: `swap-entries ${String(left)} and ${String(right)}`,
    });
  },
};

/**
 * The edits the engine breeds by: one operator drawn uniformly, retried a few times where it finds
 * no site.
 *
 * @param intent - The parent.
 * @param mate - The second parent a crossover takes entries from.
 * @returns The generator of the edit, none where no drawn operator had a site.
 */
export const zipMutation =
  (intent: ZipIntent, mate: ZipIntent): Gen<Option.Option<Edited<ZipIntent>>> =>
  (source) => {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const operator = source.draw(oneOf(zipOperators)) ?? "entry-field";
      const edited = source.draw(edits[operator](intent, mate));
      if (Option.isSome(edited)) {
        return edited;
      }
    }

    return Option.none();
  };

/**
 * The intentions one cut smaller, largest cut first: each entry dropped, each alias dropped, each
 * archive part set plain, then each entry field set plain.
 *
 * @param intent - The archive.
 * @returns The smaller archives.
 */
export const smallerZip = (intent: ZipIntent): readonly ZipIntent[] => {
  const plain = plainArchive([]);
  const entries = [...intent.entries.keys()].map((index) => ({
    ...intent,
    aliases: intent.aliases
      .filter(({ of }) => of !== index)
      .map((alias) => ({ ...alias, of: alias.of > index ? alias.of - 1 : alias.of })),
    entries: intent.entries.filter((_, at) => at !== index),
  }));
  const aliases = intent.aliases.map((_, index) => ({
    ...intent,
    aliases: intent.aliases.filter((__, at) => at !== index),
  }));
  const parts = (["comment", "gap", "prefix", "trailing"] as const).flatMap((part) =>
    intent[part].length === 0 ? [] : [{ ...intent, [part]: plain[part] }],
  );
  const flags = [
    ...(intent.zip64 === "none" ? [] : [{ ...intent, zip64: "none" as const }]),
    ...(intent.disk === 0 ? [] : [{ ...intent, disk: 0 }]),
    ...(intent.cdDisk === 0 ? [] : [{ ...intent, cdDisk: 0 }]),
    ...(intent.centralOrder === "local" ? [] : [{ ...intent, centralOrder: "local" as const }]),
  ];
  const fields = intent.entries.flatMap((entry, index) => {
    const base = plainEntry(entry.name, entry.data);

    return [...reportedFields, "method" as const]
      .filter((key) => entry[key] !== base[key])
      .map((key) => withEntryAt(intent, index, { ...entry, [key]: base[key] }));
  });

  return [...entries, ...aliases, ...parts, ...flags, ...fields];
};

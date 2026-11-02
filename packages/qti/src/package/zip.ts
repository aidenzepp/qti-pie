/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */

/**
 * The package's own ZIP reader: `readZip` lists a `.zip` file's entries as paths and bytes, over
 * `node:zlib`, with no dependency (the phase-4 spec's 4.13, Q7).
 *
 * The central directory is the truth for names, sizes, CRC-32 values and methods; the local
 * headers are read only to find where each entry's data starts, so an entry that carries a data
 * descriptor needs no special path. The sizes the central directory declares are checked against
 * budgets before any entry is inflated, so an archive that expands past them is refused at the cost
 * of reading its directory.
 */
import { crc32, inflateRawSync } from "node:zlib";
import { Effect, FileSystem, Schema } from "effect";
import type { PlatformError } from "effect";

/**
 * A zip archive cannot be read as a package, under the named rule.
 *
 * `entry` is the archive entry concerned and `feature` the part of the format that was refused.
 * A refusal about the archive as a whole names the zip file in `entry`.
 */
export class ZipRefusal extends Schema.TaggedError<ZipRefusal>()("ZipRefusal", {
  entry: Schema.String,
  feature: Schema.String,
  rule: Schema.Literals(["manifest-root", "href-path", "zip-format"]),
}) {
  /**
   * What was refused, in one sentence.
   */
  override get message(): string {
    return `The zip entry ${this.entry} was refused under the ${this.rule} rule: ${this.feature}`;
  }
}

/**
 * One file of a zip archive: its path and its uncompressed bytes.
 */
export interface ZipEntry {
  readonly bytes: Uint8Array;
  readonly path: string;
}

/**
 * The file name that marks an archive as a QTI package, looked for at the archive root only.
 */
const MANIFEST = "imsmanifest.xml";

/**
 * The end-of-central-directory record's signature, `PK\x05\x06`, as a little-endian number.
 */
const END_SIGNATURE = 0x06_05_4b_50;

/**
 * The central directory file header's signature, `PK\x01\x02`.
 */
const CENTRAL_SIGNATURE = 0x02_01_4b_50;

/**
 * The local file header's signature, `PK\x03\x04`.
 */
const LOCAL_SIGNATURE = 0x04_03_4b_50;

/**
 * The ZIP64 end-of-central-directory locator's signature, `PK\x06\x07`.
 */
const ZIP64_LOCATOR_SIGNATURE = 0x07_06_4b_50;

/**
 * The ZIP64 end-of-central-directory record's signature, `PK\x06\x06`.
 */
const ZIP64_RECORD_SIGNATURE = 0x06_06_4b_50;

/**
 * The fixed length of the end record, the locator, a central header and a local header.
 */
const END_LENGTH = 22;

const LOCATOR_LENGTH = 20;

const CENTRAL_LENGTH = 46;

const LOCAL_LENGTH = 30;

/**
 * The longest comment the end record can carry, which bounds how far back its signature is sought.
 */
const MAX_COMMENT = 0xff_ff;

/**
 * The value a 32-bit size or offset field holds when the real value is in a ZIP64 record.
 */
const ZIP64_MARKER = 0xff_ff_ff_ff;

/**
 * General-purpose flag bit 0: the entry is encrypted.
 */
const FLAG_ENCRYPTED = 0x1;

/**
 * General-purpose flag bit 6: strong encryption.
 */
const FLAG_STRONG_ENCRYPTION = 0x40;

/**
 * General-purpose flag bit 11: the name and comment are UTF-8.
 */
const FLAG_UTF8 = 0x8_00;

/**
 * The compression methods read: 0 stores, 8 deflates (RFC 1951).
 */
const METHOD_STORED = 0;

const METHOD_DEFLATE = 8;

/**
 * The MS-DOS directory attribute (bit 4 of the external attributes' low byte) and the Unix file
 * type of a directory (`S_IFDIR` 0o040000, as the mode's top four bits).
 */
const DOS_DIRECTORY = 0x10;

const UNIX_DIRECTORY_TYPE = 4;

/**
 * The most central records an archive may hold, directory entries included. The corpus's largest
 * archive has 99.
 */
const MAX_ENTRIES = 10_000;

/**
 * The most bytes one file may declare uncompressed. The corpus's largest file is 5,251,725 bytes.
 */
const MAX_ENTRY_SIZE = 64 * 1024 * 1024;

/**
 * The most bytes the files of one archive may declare uncompressed, summed. The corpus's largest
 * package is 11,018,253 bytes.
 */
const MAX_PACKAGE_SIZE = 256 * 1024 * 1024;

/**
 * How many times its stored size an entry may declare, once past {@link RATIO_ALLOWANCE}. The
 * corpus's highest ratio is 27.95 (a 6,148-byte `.DS_Store`) and 3.61 for any entry of 64 KiB or
 * more; deflate itself reaches about 1,032.
 */
const MAX_RATIO = 100;

/**
 * The bytes any entry may declare whatever its stored size, so a small, well-compressed file is not
 * refused for its ratio.
 */
const RATIO_ALLOWANCE = 1024 * 1024;

/**
 * The upper half (0x80 to 0xFF) of code page 437, transcribed from the ZIP APPNOTE (version 6.3.10,
 * Appendix D, section D.1, "Code Page 437"), one character per byte in order. The lower half is
 * ASCII, so a name's bytes below 0x80 are their own code points.
 */
const CP437_HIGH =
  "ÇüéâäàåçêëèïîìÄÅ" +
  "ÉæÆôöòûùÿÖÜ¢£¥₧ƒ" +
  "áíóúñÑªº¿⌐¬½¼¡«»" +
  "░▒▓│┤╡╢╖╕╣║╗╝╜╛┐" +
  "└┴┬├─┼╞╟╚╔╩╦╠═╬╧" +
  "╨╤╥╙╘╒╓╫╪┘┌█▄▌▐▀" +
  "αßΓπΣσµτΦΘΩδ∞φε∩" +
  "≡±≥≤⌠⌡÷≈°∙·√ⁿ²■ ";

/**
 * Code page 437 as 256 characters: ASCII below 0x80, {@link CP437_HIGH} from 0x80.
 */
const CP437: readonly string[] = [
  ...Array.from({ length: 128 }, (_, code) => String.fromCodePoint(code)),
  // oxlint-disable-next-line typescript/no-misused-spread -- every character of the table is one BMP code point, so the spread yields exactly the 128 bytes 0x80 to 0xFF.
  ...CP437_HIGH,
];

/**
 * What the central directory says about one entry.
 */
interface CentralRecord {
  readonly crc: number;
  readonly directory: boolean;
  readonly method: number;
  readonly name: string;
  readonly offset: number;
  readonly size: number;
  readonly storedSize: number;
}

/**
 * Where the central directory is, from the end record.
 */
interface Directory {
  readonly count: number;
  readonly end: number;
  readonly offset: number;
}

/**
 * Whether a flag bit is set, without a bitwise operator.
 *
 * @param flags - The flag field.
 * @param bit - One power of two.
 * @returns Whether `flags` has `bit`.
 */
const hasFlag = (flags: number, bit: number): boolean => Math.floor(flags / bit) % 2 === 1;

/**
 * Decode an entry's name: UTF-8 when general-purpose bit 11 is set, otherwise code page 437.
 *
 * @param bytes - The name's bytes.
 * @param flags - The entry's general-purpose flags.
 * @returns The name.
 */
const decodeName = (bytes: Uint8Array, flags: number): string =>
  hasFlag(flags, FLAG_UTF8)
    ? new TextDecoder("utf-8").decode(bytes)
    : Array.from(bytes, (byte) => CP437[byte] ?? "").join("");

/**
 * Why a name cannot be a package path, or `undefined` when it can.
 *
 * @param name - A decoded entry name.
 * @returns The refused feature, as a sentence fragment.
 */
const unsafeName = (name: string): string | undefined => {
  if (name.startsWith("/") || /^[A-Za-z]:/u.test(name)) {
    return "the name is an absolute path, and a package entry's path is relative to the package root";
  }

  if (name.includes("\\")) {
    return "the name holds a backslash, which a package path does not use as a separator";
  }

  return name.split("/").includes("..")
    ? "the name holds a .. segment, which would leave the package root"
    : undefined;
};

/**
 * Fail with a {@link ZipRefusal}.
 *
 * @param rule - The rule refused under.
 * @param entry - The entry concerned, or the zip file for the archive as a whole.
 * @param feature - What was refused.
 * @returns A failed effect.
 */
const refuse = (
  rule: ZipRefusal["rule"],
  entry: string,
  feature: string,
): Effect.Effect<never, ZipRefusal> => Effect.fail(new ZipRefusal({ entry, feature, rule }));

/**
 * Whether an entry is a directory: a name ending `/`, the MS-DOS directory attribute, or a
 * Unix directory mode when the entry was made on Unix.
 *
 * @param name - The decoded name.
 * @param versionMadeBy - The central header's version-made-by field.
 * @param attributes - The external file attributes.
 * @returns Whether the entry is a directory.
 */
const isDirectory = (name: string, versionMadeBy: number, attributes: number): boolean => {
  const unixMode = Math.floor(attributes / 0x1_00_00);
  const madeOnUnix = Math.floor(versionMadeBy / 0x1_00) === 3;

  return (
    name.endsWith("/") ||
    hasFlag(attributes, DOS_DIRECTORY) ||
    (madeOnUnix && Math.floor(unixMode / 0x10_00) === UNIX_DIRECTORY_TYPE)
  );
};

/**
 * Find the end record and the central directory it points at.
 *
 * @param archive - The zip file's path, naming refusals.
 * @param view - The whole file.
 * @returns Where the central directory is, or a {@link ZipRefusal} for a file that is not a zip, is
 *   split across disks or uses ZIP64.
 */
const locateDirectory = Effect.fn("package.locateDirectory")(function* locateDirectory(
  archive: string,
  view: DataView,
): Effect.fn.Return<Directory, ZipRefusal> {
  const malformed = (feature: string) => refuse("zip-format", archive, feature);
  const length = view.byteLength;
  let end = -1;

  for (let at = length - END_LENGTH; at >= 0 && at >= length - END_LENGTH - MAX_COMMENT; at -= 1) {
    if (
      view.getUint32(at, true) === END_SIGNATURE &&
      at + END_LENGTH + view.getUint16(at + 20, true) <= length
    ) {
      end = at;
      break;
    }
  }

  if (end < 0) {
    return yield* malformed(
      "the file is not a zip archive: it has no end-of-central-directory record",
    );
  }

  const count = view.getUint16(end + 10, true);
  const size = view.getUint32(end + 12, true);
  const offset = view.getUint32(end + 16, true);
  const zip64 =
    (end >= LOCATOR_LENGTH &&
      view.getUint32(end - LOCATOR_LENGTH, true) === ZIP64_LOCATOR_SIGNATURE) ||
    (offset + size + 4 <= end && view.getUint32(offset + size, true) === ZIP64_RECORD_SIGNATURE) ||
    count === 0xff_ff ||
    size === ZIP64_MARKER ||
    offset === ZIP64_MARKER;

  if (zip64) {
    return yield* malformed(
      "the archive uses ZIP64, which is not read: it has a ZIP64 end-of-central-directory locator or record",
    );
  }

  if (view.getUint16(end + 4, true) !== 0 || view.getUint16(end + 6, true) !== 0) {
    return yield* malformed(
      "the archive is split across disks, and only a single-file archive is read",
    );
  }

  if (offset + size > end) {
    return yield* malformed("the central directory does not parse: it runs past the end record");
  }

  return { count, end, offset };
});

/**
 * Read one central directory header and refuse what is not read.
 *
 * @param archive - The zip file's path, naming refusals.
 * @param bytes - The whole file.
 * @param view - The same bytes.
 * @param at - Where the header starts.
 * @param limit - Where the central directory ends.
 * @returns The record and the offset after the header, or a {@link ZipRefusal}.
 */
const readRecord = Effect.fn("package.readRecord")(function* readRecord(
  archive: string,
  bytes: Uint8Array,
  view: DataView,
  at: number,
  limit: number,
): Effect.fn.Return<{ readonly next: number; readonly record: CentralRecord }, ZipRefusal> {
  if (at + CENTRAL_LENGTH > limit || view.getUint32(at, true) !== CENTRAL_SIGNATURE) {
    return yield* refuse(
      "zip-format",
      archive,
      "the central directory does not parse: a file header is missing or cut short",
    );
  }

  const flags = view.getUint16(at + 8, true);
  const nameLength = view.getUint16(at + 28, true);
  const next =
    at +
    CENTRAL_LENGTH +
    nameLength +
    view.getUint16(at + 30, true) +
    view.getUint16(at + 32, true);

  if (next > limit) {
    return yield* refuse(
      "zip-format",
      archive,
      "the central directory does not parse: a file header runs past the end",
    );
  }

  const name = decodeName(
    bytes.subarray(at + CENTRAL_LENGTH, at + CENTRAL_LENGTH + nameLength),
    flags,
  );
  const storedSize = view.getUint32(at + 20, true);
  const size = view.getUint32(at + 24, true);
  const offset = view.getUint32(at + 42, true);
  const method = view.getUint16(at + 10, true);

  if (storedSize === ZIP64_MARKER || size === ZIP64_MARKER || offset === ZIP64_MARKER) {
    return yield* refuse(
      "zip-format",
      name,
      "the entry's size or offset is 0xFFFFFFFF, so it lives in a ZIP64 record, which is not read",
    );
  }

  if (hasFlag(flags, FLAG_ENCRYPTED) || hasFlag(flags, FLAG_STRONG_ENCRYPTION)) {
    return yield* refuse(
      "zip-format",
      name,
      "the entry is encrypted, and an encrypted entry is not read",
    );
  }

  if (method !== METHOD_STORED && method !== METHOD_DEFLATE) {
    return yield* refuse(
      "zip-format",
      name,
      `compression method ${method} is not read: an entry is stored or deflated (RFC 1951)`,
    );
  }

  const unsafe = unsafeName(name);

  if (unsafe !== undefined) {
    return yield* refuse("href-path", name, unsafe);
  }

  return {
    next,
    record: {
      crc: view.getUint32(at + 16, true),
      directory: isDirectory(name, view.getUint16(at + 4, true), view.getUint32(at + 38, true)),
      method,
      name,
      offset,
      size,
      storedSize,
    },
  };
});

/**
 * Compare two names by UTF-16 code unit.
 *
 * @param left - One name.
 * @param right - Another.
 * @returns A negative number, zero or a positive number.
 */
const byName = (left: CentralRecord, right: CentralRecord): number => {
  if (left.name === right.name) {
    return 0;
  }

  return left.name < right.name ? -1 : 1;
};

/**
 * Check a sorted file listing for a duplicate name and for the manifest at the root.
 *
 * @param files - The non-directory records, sorted by name.
 * @returns Nothing, or a {@link ZipRefusal}.
 */
const checkListing = Effect.fn("package.checkListing")(function* checkListing(
  files: readonly CentralRecord[],
): Effect.fn.Return<void, ZipRefusal> {
  const duplicate = files.find(
    (record, index) => index > 0 && files[index - 1]?.name === record.name,
  );

  if (duplicate?.name === MANIFEST) {
    yield* refuse("manifest-root", MANIFEST, "the archive has more than one imsmanifest.xml");
  }

  if (duplicate !== undefined) {
    yield* refuse("zip-format", duplicate.name, "the archive holds two entries with this name");
  }

  if (!files.some((record) => record.name === MANIFEST)) {
    yield* refuse(
      "manifest-root",
      MANIFEST,
      "the archive has no imsmanifest.xml at its root, and a package keeps its manifest in its top directory",
    );
  }
});

/**
 * Where one file's data lies in the archive, from its local header.
 *
 * @param view - The whole file.
 * @param record - The entry's central directory record.
 * @param limit - Where the central directory starts; no entry's data may reach it.
 * @returns The data's `start` and the `end` of the entry's stored bytes, or a {@link ZipRefusal}.
 */
const dataSpan = Effect.fn("package.dataSpan")(function* dataSpan(
  view: DataView,
  record: CentralRecord,
  limit: number,
): Effect.fn.Return<{ readonly end: number; readonly start: number }, ZipRefusal> {
  const broken = (feature: string) => refuse("zip-format", record.name, feature);

  if (
    record.offset + LOCAL_LENGTH > limit ||
    view.getUint32(record.offset, true) !== LOCAL_SIGNATURE
  ) {
    return yield* broken("its local header does not parse");
  }

  const start =
    record.offset +
    LOCAL_LENGTH +
    view.getUint16(record.offset + 26, true) +
    view.getUint16(record.offset + 28, true);

  if (start + record.storedSize > limit) {
    return yield* broken("its data runs past the central directory");
  }

  return { end: start + record.storedSize, start };
});

/**
 * Refuse a listing whose declared sizes pass a budget, before any entry is read.
 *
 * The first file past {@link MAX_ENTRY_SIZE} or past its ratio bound is refused, then a sum past
 * {@link MAX_PACKAGE_SIZE}.
 *
 * @param archive - The zip file's path, which names the refusal about the whole archive.
 * @param files - The non-directory records.
 * @returns Nothing, or a {@link ZipRefusal}.
 */
const checkBudget = Effect.fn("package.checkBudget")(function* checkBudget(
  archive: string,
  files: readonly CentralRecord[],
): Effect.fn.Return<void, ZipRefusal> {
  const large = files.find((record) => record.size > MAX_ENTRY_SIZE);

  if (large !== undefined) {
    yield* refuse(
      "zip-format",
      large.name,
      `it declares ${large.size} bytes for one entry, past the limit of ${MAX_ENTRY_SIZE}`,
    );
  }

  const ratio = files.find(
    (record) => record.size > Math.max(RATIO_ALLOWANCE, MAX_RATIO * record.storedSize),
  );

  if (ratio !== undefined) {
    yield* refuse(
      "zip-format",
      ratio.name,
      `it declares ${ratio.size} bytes from ${ratio.storedSize} stored, more than ${MAX_RATIO} times its stored size and past ${RATIO_ALLOWANCE} bytes`,
    );
  }

  const total = files.reduce((sum, record) => sum + record.size, 0);

  if (total > MAX_PACKAGE_SIZE) {
    yield* refuse(
      "zip-format",
      archive,
      `the files declare ${total} bytes for one package, past the limit of ${MAX_PACKAGE_SIZE}`,
    );
  }
});

/**
 * Refuse files whose stored ranges overlap, before any entry is read.
 *
 * A range runs from the local header to the end of the stored data, so two records naming one
 * local entry overlap, and so does a record that points into another's data. A data descriptor
 * lies after the range.
 *
 * @param view - The whole file.
 * @param files - The non-directory records.
 * @param limit - Where the central directory starts.
 * @returns Each file's span, keyed by name, or a {@link ZipRefusal}.
 */
const checkSpans = Effect.fn("package.checkSpans")(function* checkSpans(
  view: DataView,
  files: readonly CentralRecord[],
  limit: number,
): Effect.fn.Return<
  ReadonlyMap<string, { readonly end: number; readonly start: number }>,
  ZipRefusal
> {
  const spans = new Map<string, { readonly end: number; readonly start: number }>();

  for (const record of files) {
    spans.set(record.name, yield* dataSpan(view, record, limit));
  }

  const ordered = files.toSorted(
    (left, right) => left.offset - right.offset || (left.name < right.name ? -1 : 1),
  );
  let previous: CentralRecord | undefined;

  for (const record of ordered) {
    const before = previous === undefined ? undefined : spans.get(previous.name);

    if (previous !== undefined && before !== undefined && record.offset < before.end) {
      yield* refuse(
        "zip-format",
        record.name,
        `its range overlaps the data of ${previous.name}, so two entries would share bytes`,
      );
    }

    previous = record;
  }

  return spans;
});

/**
 * Read one entry's bytes and verify its CRC-32.
 *
 * @param bytes - The whole file.
 * @param record - The entry's central directory record.
 * @param span - Where the entry's stored bytes lie.
 * @param remaining - How many bytes of the package's budget are left; the inflate stops there.
 * @returns The uncompressed bytes, or a {@link ZipRefusal}.
 */
const readData = Effect.fn("package.readData")(function* readData(
  bytes: Uint8Array,
  record: CentralRecord,
  span: { readonly end: number; readonly start: number },
  remaining: number,
): Effect.fn.Return<Uint8Array, ZipRefusal> {
  const broken = (feature: string) => refuse("zip-format", record.name, feature);

  const stored = bytes.subarray(span.start, span.end);

  if (record.method === METHOD_STORED && record.storedSize !== record.size) {
    return yield* broken("its stored size and its size differ");
  }

  const data =
    record.method === METHOD_STORED
      ? new Uint8Array(stored)
      : yield* Effect.try({
          catch: () =>
            new ZipRefusal({
              entry: record.name,
              feature: "its deflated data does not inflate",
              rule: "zip-format",
            }),
          try: () => {
            const inflated = inflateRawSync(stored, {
              maxOutputLength: Math.max(Math.min(record.size, remaining), 1),
            });

            return new Uint8Array(inflated.buffer, inflated.byteOffset, inflated.byteLength);
          },
        });

  if (data.length !== record.size) {
    return yield* broken("its data does not have the size the central directory gives");
  }

  if (crc32(data) !== record.crc) {
    return yield* broken("its CRC-32 does not match its data, so the archive is corrupt");
  }

  return data;
});

/**
 * Parse an archive and return every file's bytes.
 *
 * @param archive - The zip file's path, which names archive-level refusals.
 * @param bytes - The whole file.
 * @returns The listing sorted by path, or a {@link ZipRefusal}.
 */
const parseZip = Effect.fn("package.parseZip")(function* parseZip(
  archive: string,
  bytes: Uint8Array,
): Effect.fn.Return<readonly ZipEntry[], ZipRefusal> {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const { count, end, offset } = yield* locateDirectory(archive, view);

  if (count > MAX_ENTRIES) {
    yield* refuse(
      "zip-format",
      archive,
      `the archive has ${count} entries, past the limit of ${MAX_ENTRIES}`,
    );
  }

  const records: CentralRecord[] = [];
  let at = offset;

  for (let index = 0; index < count; index += 1) {
    const read = yield* readRecord(archive, bytes, view, at, end);

    records.push(read.record);
    at = read.next;
  }

  const files = records.filter((record) => !record.directory).toSorted(byName);

  yield* checkListing(files);

  yield* checkBudget(archive, files);

  const spans = yield* checkSpans(view, files, offset);
  const entries: ZipEntry[] = [];
  let remaining = MAX_PACKAGE_SIZE;

  for (const record of files) {
    const span = spans.get(record.name);

    if (span === undefined) {
      return yield* refuse("zip-format", record.name, "its local header was not found");
    }

    const data = yield* readData(bytes, record, span, remaining);

    remaining -= data.length;
    entries.push({ bytes: data, path: record.name });
  }

  return entries;
});

/**
 * Read a zip file's entries.
 *
 * Names are UTF-8 when the entry's bit 11 is set and code page 437 otherwise. Directory entries are
 * dropped. Stored and deflated entries are read, and every entry's CRC-32 is checked against the
 * central directory. The listing is sorted by UTF-16 code unit, so it is the same on every host.
 *
 * @param path - The zip file.
 * @returns The files as {@link ZipEntry} values. A {@link ZipRefusal} names the entry and the
 *   feature: `zip-format` for another method, encryption, ZIP64, an archive that does not parse, a
 *   CRC-32 mismatch, more than 10,000 entries, a file declaring over 64 MiB or over 100 times its
 *   stored size (past 1 MiB), files declaring over 256 MiB between them, or two files whose stored
 *   ranges overlap; `href-path` for an absolute name or one with a `..` segment or a backslash;
 *   `manifest-root` for no `imsmanifest.xml` at the root or two of them. A missing file is a
 *   `PlatformError`.
 */
export const readZip = Effect.fn("package.readZip")(function* readZip(
  path: string,
): Effect.fn.Return<
  readonly ZipEntry[],
  ZipRefusal | PlatformError.PlatformError,
  FileSystem.FileSystem
> {
  const fs = yield* FileSystem.FileSystem;

  return yield* parseZip(path, yield* fs.readFile(path));
});

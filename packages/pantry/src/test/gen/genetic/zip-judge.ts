/* oxlint-disable unicorn/throw-new-error -- Schema.TaggedError is a schema class factory. */
/**
 * The zip container search's judge (lane GEN-B): the package reader (`readZip`) and writer
 * (`writeZip`) of `#pantry/package/zip.ts` against Python's `zipfile`, a reader that shares no code
 * with them, run once per round over every archive of the round.
 *
 * Python reads the container: where the central directory and each entry are, the names each
 * entry's bit 11 decodes, the sizes, the CRC-32 values, and each entry's data or why it cannot be
 * read. The package reader's contract adds what a package archive is beside a zip file
 * (`readZip`'s documentation, IMS Content Packaging 1.2 and APPNOTE 6.3.10): {@link expectedOf}
 * states that policy over Python's reading and the archive's intention, each refusal class with the
 * source that makes the reader refuse what Python reads ({@link recorded}). A verdict the policy
 * does not predict is a disagreement: a bug of the reader, or of this judge, which a reduction then
 * shows.
 *
 * The writer's archives are judged by Python too: every entry back with its name and bytes, and the
 * header fields the writer's documentation fixes (APPNOTE 4.4.2 and 4.4.3's version fields, the
 * MS-DOS host, the UTF-8 flag, the 1980-01-01 timestamp, the storing threshold).
 */
import { createHash } from "node:crypto";
import { Config, Effect, FileSystem, Schema, Stream } from "effect";
import { ChildProcess, ChildProcessSpawner } from "effect/process";
import { packageBudget, readZip } from "#pantry/package/zip.ts";
import type { ZipEntry } from "#pantry/package/zip.ts";
import { manifestName, signatures } from "#pantry/test/gen/genetic/zip-archive.ts";
import type { Rendered, ZipIntent } from "#pantry/test/gen/genetic/zip-archive.ts";

/**
 * Python's report could not be read: a line that is no JSON of the shape the script writes, or a
 * process that wrote no line for an archive.
 */
export class PythonUnreadable extends Schema.TaggedError<PythonUnreadable>()("PythonUnreadable", {
  report: Schema.String,
}) {
  /**
   * What Python wrote, and what to check.
   */
  override get message(): string {
    return `python3's zipfile report could not be read: ${this.report.slice(0, 400)}. Check that python3 runs and that the script under work/ is the judge's.`;
  }
}

/**
 * The `python3` executable: `PYTHON3` when set, else `python3` on `PATH`.
 */
const pythonPath = Config.String("PYTHON3").pipe(Config.withDefault("python3"));

/**
 * Whether `python3` runs and imports `zipfile`, so the judge can read archives.
 */
export const pythonRuns = Effect.scoped(
  Effect.gen(function* probePython() {
    const python = yield* pythonPath;
    const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
    const handle = yield* spawner.spawn(
      ChildProcess.make(python, ["-I", "-c", "import zipfile"], { stdin: "ignore" }),
    );

    return (yield* handle.exitCode) === ChildProcessSpawner.ExitCode(0);
  }),
).pipe(Effect.orElseSucceed(() => false));

/**
 * The script Python runs, written into the run's scratch folder: for each archive named on its
 * command line, one JSON line of what `zipfile` reads, each entry with its data's SHA-256 or the
 * error reading it raised.
 */
export const pythonScript = `import hashlib, json, sys, zipfile
for path in sys.argv[1:]:
    try:
        archive = zipfile.ZipFile(path)
    except Exception as error:
        print(json.dumps({"error": type(error).__name__ + ": " + str(error), "ok": False}))
        continue
    infos = []
    for info in archive.infolist():
        try:
            data = archive.read(info)
            read = {"length": len(data), "sha": hashlib.sha256(data).hexdigest()}
        except Exception as error:
            read = {"error": type(error).__name__ + ": " + str(error)}
        infos.append({
            "crc": info.CRC, "csize": info.compress_size, "date": list(info.date_time),
            "dir": info.is_dir(), "external": info.external_attr, "extract": info.extract_version,
            "flags": info.flag_bits, "method": info.compress_type, "name": info.filename,
            "offset": info.header_offset, "read": read, "size": info.file_size,
            "system": info.create_system,
        })
    print(json.dumps({"infos": infos, "ok": True}))
`;

/**
 * What Python read of one entry: its central record's fields and its data, or the error reading
 * it raised.
 */
export interface PythonInfo {
  readonly crc: number;
  readonly csize: number;
  readonly date: readonly number[];
  readonly dir: boolean;
  readonly external: number;
  readonly extract: number;
  readonly flags: number;
  readonly method: number;
  readonly name: string;
  readonly offset: number;
  readonly read: { readonly length: number; readonly sha: string } | { readonly error: string };
  readonly size: number;
  readonly system: number;
}

/**
 * What Python read of one archive: its entries, or the error opening it raised.
 */
export type PythonView =
  | { readonly infos: readonly PythonInfo[]; readonly ok: true }
  | { readonly error: string; readonly ok: false };

/**
 * Read archives with Python's `zipfile`, one process for all of them.
 *
 * @param script - The path of {@link pythonScript}, written by the caller.
 * @param paths - The archives.
 * @returns One view per archive, in order.
 */
export const pythonRead = Effect.fn("test.geneticZip.pythonRead")(function* pythonRead(
  script: string,
  paths: readonly string[],
) {
  if (paths.length === 0) {
    return [];
  }

  const python = yield* Effect.orDie(pythonPath);
  const spawner = yield* ChildProcessSpawner.ChildProcessSpawner;
  const report = yield* Effect.scoped(
    Effect.gen(function* collectReport() {
      const handle = yield* spawner.spawn(
        ChildProcess.make(python, ["-I", script, ...paths], { stdin: "ignore" }),
      );

      return yield* Effect.all(
        {
          code: handle.exitCode,
          stderr: Stream.mkString(Stream.decodeText(handle.stderr)),
          stdout: Stream.mkString(Stream.decodeText(handle.stdout)),
        },
        { concurrency: "unbounded" },
      );
    }),
  ).pipe(Effect.orDie);
  const lines = report.stdout.split("\n").filter((line) => line !== "");
  if (lines.length !== paths.length) {
    return yield* new PythonUnreadable({ report: `${report.stdout}${report.stderr}` });
  }

  return yield* Effect.forEach(
    lines,
    (line) =>
      Effect.try({
        catch: () => new PythonUnreadable({ report: line }),
        try: (): PythonView => JSON.parse(line),
      }),
    { concurrency: 1 },
  );
});

/**
 * A class of the package reader's refusals, as its feature says, or the classes {@link expectedOf}
 * predicts:
 *
 * - `no-end`: no end record; `structure`: a record that does not parse where the offsets say;
 * - `zip64`, `split`, `encrypted`, `method`: what the reader documents it does not read;
 * - `name`: a name no package path is (`href-path`);
 * - `duplicate`, `manifest-duplicate`, `manifest-missing`: the listing;
 * - `budget-entries`, `budget-entry`, `budget-ratio`, `budget-package`: the documented budgets;
 * - `overlap`: two files sharing one local entry's bytes; `content`: data that is not what its record
 *   says.
 */
export type RefusalClass =
  | "budget-entries"
  | "budget-entry"
  | "budget-package"
  | "budget-ratio"
  | "content"
  | "duplicate"
  | "encrypted"
  | "manifest-duplicate"
  | "manifest-missing"
  | "method"
  | "name"
  | "no-end"
  | "overlap"
  | "split"
  | "structure"
  | "zip64";

/**
 * The reader's features, as its refusals word them, each with its class.
 */
const featureClasses: readonly (readonly [RegExp, RefusalClass])[] = [
  [/no end-of-central-directory record/u, "no-end"],
  [/uses ZIP64|lives in a ZIP64 record/u, "zip64"],
  [/split across disks/u, "split"],
  [/entries, past the limit/u, "budget-entries"],
  [/bytes for one entry, past the limit/u, "budget-entry"],
  [/times its stored size/u, "budget-ratio"],
  [/for one package, past the limit/u, "budget-package"],
  [/is encrypted/u, "encrypted"],
  [/compression method/u, "method"],
  [/more than one imsmanifest\.xml/u, "manifest-duplicate"],
  [/no imsmanifest\.xml at its root/u, "manifest-missing"],
  [/two entries with this name/u, "duplicate"],
  [/range overlaps/u, "overlap"],
  [/absolute path|holds a backslash|holds a \.\. segment/u, "name"],
  [
    /stored size and its size differ|does not inflate|does not have the size|CRC-32 does not match/u,
    "content",
  ],
  [/does not parse|was not found|runs past the central directory/u, "structure"],
];

/**
 * What the package reader said of one archive: its files, or its refusal's rule, class and entry.
 */
export type PantryVerdict =
  | {
      readonly entries: readonly { readonly path: string; readonly sha: string }[];
      readonly kind: "accepted";
    }
  | {
      readonly class: RefusalClass | "unclassed";
      readonly entry: string;
      readonly feature: string;
      readonly kind: "refused";
      readonly rule: string;
    };

/**
 * The SHA-256 of bytes, as hex.
 *
 * @param bytes - The bytes.
 * @returns The digest.
 */
export const shaOf = (bytes: Uint8Array): string =>
  createHash("sha256").update(bytes).digest("hex");

/**
 * Read an archive with the package reader under the production budgets.
 *
 * @param path - The archive.
 * @returns The verdict; a file that cannot be read is a defect of the test.
 */
export const pantryRead = Effect.fn("test.geneticZip.pantryRead")(function* pantryRead(
  path: string,
) {
  return yield* readZip(path, packageBudget).pipe(
    Effect.map((entries): PantryVerdict => ({
      entries: entries.map(({ bytes, path: name }) => ({ path: name, sha: shaOf(bytes) })),
      kind: "accepted",
    })),
    Effect.catchTag("ZipRefusal", (refusal) =>
      Effect.succeed<PantryVerdict>({
        class:
          featureClasses.find(([pattern]) => pattern.test(refusal.feature))?.[1] ?? "unclassed",
        entry: refusal.entry,
        feature: refusal.feature,
        kind: "refused",
        rule: refusal.rule,
      }),
    ),
    Effect.orDie,
  );
});

/**
 * Why the package reader refuses what Python reads, or reads what Python refuses, each class with
 * its source. These are the reader's documented policy, which {@link expectedOf} states; a
 * difference outside them is unrecorded, a disagreement.
 */
export const recorded = {
  budgets:
    "readZip's documented budgets: 10,000 entries, 64 MiB an entry, 100 times an entry's stored size past 1 MiB, 256 MiB a package; Python has none",
  deflate:
    "RFC 1951 3.2.3: a deflate stream ends with its final block's end-of-block code, so a compressed size that cuts it short holds no whole stream, which readZip refuses; Python returns the bytes once it has the uncompressed size",
  directory:
    "APPNOTE 4.4.15: the external attributes' low byte is the MS-DOS attribute byte, and a Unix host's high half its mode, so an entry with the MS-DOS directory bit or, made on Unix, a directory mode is a directory, which the reader drops; Python's is_dir reads only the trailing slash",
  duplicate:
    "readZip: two entries of one name are refused, since a package path names one file; Python keeps the last",
  end: "APPNOTE 4.3.16: the end record is the last whose comment ends within the file; Python takes the last end-record signature whatever its comment length says, so where the two differ the archive is undecided",
  localName:
    "zip.ts: the central directory is the truth for names, and a local header is read only for where its data starts; Python refuses a local name unlike the central one",
  manifest:
    "IMS Content Packaging 1.2: the package interchange file holds imsmanifest.xml at its root, once; Python reads any archive",
  name: "APPNOTE 4.4.17.1: a stored path MUST NOT hold a drive letter or a leading slash, and its separators are forward slashes; readZip refuses a .. segment too (href-path); Python reads the name as written",
  prefix:
    "APPNOTE 4.4.16 and 4.4.24: the offsets are from the start of the disk, so an archive whose offsets leave out leading bytes does not parse where they say; Python finds the leading bytes and moves every offset",
  size: "APPNOTE 4.4.9: the uncompressed size is the file's, so data that inflates to another size is not what its record says, which readZip refuses; Python checks the CRC-32 alone",
  split:
    "APPNOTE 4.4.19 and 4.4.20: a disk number that is not 0 says the archive spans disks, which readZip does not read; Python reads a single file whatever the end record's disk fields say",
  stored:
    "APPNOTE 4.4.5, method 0: a stored file is not compressed, so its compressed and uncompressed sizes are one; readZip refuses two, where Python reads the uncompressed size's bytes",
  unread:
    "readZip: ZIP64, encryption and a method other than stored and deflated are not read; Python reads ZIP64 and bzip2",
} as const;

/**
 * The budgets as `readZip` documents them, restated from its contract, not read from `zip.ts`.
 */
const budgets = {
  entries: 10_000,
  entryBytes: 64 * 1024 * 1024,
  packageBytes: 256 * 1024 * 1024,
  ratio: 100,
  ratioAllowance: 1024 * 1024,
} as const;

/**
 * Whether a name is no package path: absolute, with a drive letter, with a backslash, or with a
 * `..` segment.
 *
 * @param name - The decoded name.
 * @returns Whether the reader refuses it under `href-path`.
 */
const unsafeName = (name: string): boolean =>
  name.startsWith("/") ||
  /^[A-Za-z]:/u.test(name) ||
  name.includes("\\") ||
  name.split("/").includes("..");

/**
 * Whether an entry is a directory as APPNOTE 4.4.15 reads its attributes ({@link recorded}'s
 * `directory`): a trailing slash, the MS-DOS directory bit, or a Unix directory mode on a Unix
 * host.
 *
 * @param info - Python's reading of the entry.
 * @returns Whether it is.
 */
const isDirectory = (info: PythonInfo): boolean =>
  info.name.endsWith("/") ||
  Math.floor(info.external / 0x10) % 2 === 1 ||
  (info.system === 3 && Math.floor(info.external / 0x1_00_00 / 0x10_00) % 0x10 === 4);

/**
 * The class a Python read error is: an overlap, a local header that does not parse, the encryption
 * or method the reader does not read, a local name unlike the central one ({@link recorded}'s
 * `localName`, no refusal), or data unlike its record.
 *
 * @param error - The error.
 * @returns The class, or `undefined` for the local name.
 */
const readErrorClass = (error: string): RefusalClass | undefined => {
  // Python's overlap test is a zip bomb heuristic over every record, directories included, so the
  // reader's own overlap, two files sharing one local entry, is read from the layout instead.
  if (/Overlapped entries|File name in directory/u.test(error)) {
    return undefined;
  }

  if (/Bad magic number for file header|Truncated file header/u.test(error)) {
    return "structure";
  }

  if (/encrypted/u.test(error)) {
    return "encrypted";
  }

  return /compression method/u.test(error) ? "method" : "content";
};

/**
 * What the reader must say of one archive: its files, one of the refusals that apply, or nothing,
 * where APPNOTE's end record is one Python does not read from (`undecided`).
 */
export type Expected =
  | {
      readonly entries: readonly { readonly path: string; readonly sha: string }[];
      readonly kind: "accept";
    }
  | { readonly kind: "undecided" }
  | {
      readonly classes: ReadonlySet<RefusalClass>;
      readonly kind: "refuse";
      /**
       * Each class that applies with the fact that makes it apply, as `class (fact)`.
       */
      readonly reasons: readonly string[];
    };

/**
 * Compare two paths by UTF-16 code unit, as the reader sorts its listing.
 *
 * @param left - One path.
 * @param right - Another.
 * @returns A negative number, zero or a positive number.
 */
const byPath = (left: string, right: string): number => {
  if (left === right) {
    return 0;
  }

  return left < right ? -1 : 1;
};

/**
 * Compare bytes with a signature at an offset.
 *
 * @param bytes - The archive.
 * @param at - The offset.
 * @param signature - The signature's bytes.
 * @returns Whether they are there.
 */
const signedAt = (bytes: Uint8Array, at: number, signature: Uint8Array): boolean =>
  at >= 0 && signature.every((byte, index) => bytes[at + index] === byte);

/**
 * The 16-bit little-endian field at an offset.
 *
 * @param bytes - The archive.
 * @param at - The offset.
 * @returns The value, 0 past the end.
 */
const u16At = (bytes: Uint8Array, at: number): number =>
  (bytes[at] ?? 0) + 256 * (bytes[at + 1] ?? 0);

/**
 * The end record APPNOTE 4.3.16 makes of an archive: the last end-record signature in its final
 * 65,557 bytes whose comment, as its length field says, ends within the file. A signature whose
 * comment would run past the end is no end record.
 *
 * @param bytes - The archive.
 * @returns Its offset, -1 for none.
 */
const appnoteEnd = (bytes: Uint8Array): number => {
  for (let at = bytes.length - 22; at >= 0 && at >= bytes.length - 22 - 0xff_ff; at -= 1) {
    if (signedAt(bytes, at, signatures.end) && at + 22 + u16At(bytes, at + 20) <= bytes.length) {
      return at;
    }
  }

  return -1;
};

/**
 * The end record Python's `zipfile` takes (`_EndRecData`): the last 22 bytes when they are an end
 * record with no comment, else the last end-record signature in the final 65,557 bytes, its
 * comment length unchecked.
 *
 * @param bytes - The archive.
 * @returns Its offset, -1 for none.
 */
const pythonEnd = (bytes: Uint8Array): number => {
  const last = bytes.length - 22;
  if (signedAt(bytes, last, signatures.end) && u16At(bytes, last + 20) === 0) {
    return last;
  }

  for (let at = last; at >= 0 && at >= bytes.length - 22 - 0xff_ff; at -= 1) {
    if (signedAt(bytes, at, signatures.end)) {
      return at;
    }
  }

  return -1;
};

/**
 * Collects the refusal classes that apply to an archive, each with the facts that make it apply.
 */
class Refusals {
  private readonly held = new Map<RefusalClass, Set<string>>();

  /**
   * Record a class.
   *
   * @param cls - The class.
   * @param origin - The fact that makes it apply.
   */
  add(cls: RefusalClass, origin: string): void {
    this.held.set(cls, new Set([...(this.held.get(cls) ?? []), origin]));
  }

  /**
   * Whether any class applies.
   *
   * @returns Whether one does.
   */
  any(): boolean {
    return this.held.size > 0;
  }

  /**
   * The expectation of a refusal under the classes recorded.
   *
   * @returns The expectation.
   */
  expected(): Expected {
    return {
      classes: new Set(this.held.keys()),
      kind: "refuse",
      reasons: [...this.held]
        .flatMap(([cls, origins]) => [...origins].map((origin) => `${cls} (${origin})`))
        .toSorted(),
    };
  }
}

/**
 * The 32-bit little-endian field at an offset.
 *
 * @param bytes - The archive.
 * @param at - The offset.
 * @returns The value, 0 past the end.
 */
const u32At = (bytes: Uint8Array, at: number): number =>
  u16At(bytes, at) + 0x1_00_00 * u16At(bytes, at + 2);

/**
 * Record the classes the end record in use and the archive's own parts make apply: ZIP64 where
 * APPNOTE 4.3.6's layout puts its structures (a ZIP64 end record where the central directory the
 * end record states ends, a locator just before the end record, a field marked for ZIP64, and,
 * for the rendered end record, the intention's ZIP64 extra fields), disk numbers, bytes the
 * offsets leave out, and a central directory that does not end where the end record starts
 * (APPNOTE 4.3.6 puts the end record right after it, ZIP64's structures aside, which are
 * refused).
 *
 * @param intent - The archive.
 * @param bytes - Its bytes.
 * @param end - Where the end record in use starts.
 * @param own - Whether that is the rendered end record, so the intention's own parts apply.
 * @param refusals - The classes so far.
 */
const containerClasses = (
  intent: ZipIntent,
  bytes: Uint8Array,
  end: number,
  own: boolean,
  refusals: Refusals,
): void => {
  const count = u16At(bytes, end + 10);
  const size = u32At(bytes, end + 12);
  const offset = u32At(bytes, end + 16);
  if (
    (own && intent.entries.some(({ extra }) => extra === "zip64")) ||
    count === 0xff_ff ||
    size === 0xff_ff_ff_ff ||
    offset === 0xff_ff_ff_ff ||
    signedAt(bytes, end - 20, signatures.zip64Locator) ||
    (offset + size + 4 <= end && signedAt(bytes, offset + size, signatures.zip64Record))
  ) {
    refusals.add("zip64", "zip64 structures");
  }

  if (count > budgets.entries) {
    refusals.add("budget-entries", "the end record's count");
  }

  if (u16At(bytes, end + 4) !== 0 || u16At(bytes, end + 6) !== 0) {
    refusals.add("split", "disk numbers");
  }

  if (own && intent.prefix.length > 0) {
    refusals.add("structure", "leading bytes");
  }

  if (offset + size > end) {
    refusals.add("structure", "directory past the end record");
  } else if (offset + size < end) {
    refusals.add("structure", "bytes before the end record");
  }
};

/**
 * One central record as the policy reads it: Python's reading, and the local entry the record
 * points at, undefined for an end record other than the rendered one.
 */
interface CentralRead {
  readonly entry: number | undefined;
  readonly info: PythonInfo;
}

/**
 * Record the classes each central record makes apply: a name no package path is, encryption, a
 * method that is not read, and the entry count.
 *
 * @param records - The records.
 * @param refusals - The classes so far.
 */
const recordClasses = (records: readonly CentralRead[], refusals: Refusals): void => {
  if (records.length > budgets.entries) {
    refusals.add("budget-entries", "count");
  }

  for (const { info } of records) {
    if (unsafeName(info.name)) {
      refusals.add("name", "name");
    }

    if (Math.floor(info.flags / 0x1) % 2 === 1 || Math.floor(info.flags / 0x40) % 2 === 1) {
      refusals.add("encrypted", "flags");
    }

    if (info.method !== 0 && info.method !== 8) {
      refusals.add("method", "method");
    }
  }
};

/**
 * Record the classes the files' listing and declared sizes make apply: a duplicate name, the
 * manifest missing or held twice, and each budget.
 *
 * @param files - The records that are no directory, sorted by name.
 * @param refusals - The classes so far.
 */
const listingClasses = (files: readonly CentralRead[], refusals: Refusals): void => {
  const duplicate = files.find(({ info }, at) => at > 0 && files[at - 1]?.info.name === info.name);
  if (duplicate !== undefined) {
    refusals.add(
      duplicate.info.name === manifestName ? "manifest-duplicate" : "duplicate",
      "listing",
    );
  }

  if (!files.some(({ info }) => info.name === manifestName)) {
    refusals.add("manifest-missing", "listing");
  }

  for (const { info } of files) {
    if (info.size > budgets.entryBytes) {
      refusals.add("budget-entry", "declared size");
    }

    if (info.size > Math.max(budgets.ratioAllowance, budgets.ratio * info.csize)) {
      refusals.add("budget-ratio", "declared size");
    }
  }

  if (files.reduce((sum, { info }) => sum + info.size, 0) > budgets.packageBytes) {
    refusals.add("budget-package", "declared sizes");
  }
};

/**
 * Whether an entry's intention says its data is not what its record says: a wrong CRC-32, a
 * compressed size that cuts its deflate stream short, bzip2's number over deflated bytes, or a
 * declared size not the data's. Bytes after a whole deflate stream are no fault: both readers stop
 * at its end.
 *
 * @param intended - The entry.
 * @returns Whether it does.
 */
const intendedWrong = (intended: ZipIntent["entries"][number]): boolean =>
  intended.crc === "wrong" ||
  (intended.method === 8 && intended.stored < 0) ||
  intended.method === 12 ||
  (intended.declared !== undefined && intended.declared !== intended.data.length);

/**
 * Record the classes the files' data makes apply: two files sharing a local entry, a stored entry
 * of two sizes, data of another size than its record's, and each error Python's read raised; an
 * entry Python left unread for its local name or an overlap is judged by its intention.
 *
 * @param intent - The archive.
 * @param files - The records that are no directory.
 * @param refusals - The classes so far.
 */
const dataClasses = (
  intent: ZipIntent,
  files: readonly CentralRead[],
  refusals: Refusals,
): void => {
  if (
    files.some(
      ({ entry }, at) =>
        entry !== undefined && files.findIndex((held) => held.entry === entry) !== at,
    )
  ) {
    refusals.add("overlap", "two files share a local entry");
  }

  for (const { entry, info } of files) {
    if (info.method === 0 && info.csize !== info.size) {
      refusals.add("content", "stored sizes");
    }

    if ("length" in info.read && info.read.length !== info.size) {
      refusals.add("content", "inflated size");
    }

    const cut = intent.entries[entry ?? -1];
    if (cut !== undefined && cut.method === 8 && cut.stored < 0) {
      refusals.add("content", "deflate stream cut short");
    }

    if ("error" in info.read) {
      const cls = readErrorClass(info.read.error);
      const intended = intent.entries[entry ?? -1];
      if (cls !== undefined) {
        refusals.add(cls, "python read");
      } else if (intended !== undefined && intendedWrong(intended)) {
        refusals.add("content", "intended data");
      }
    }
  }
};

/**
 * State what the reader must say of an archive: the refusals its policy makes over Python's
 * reading and the intention's facts Python does not show, or, where none applies, every file
 * Python reads, sorted by name, with its data.
 *
 * Python reads the records from the archive with its own parts plain (`clean`: no leading bytes,
 * no bytes before the end record, no ZIP64 structures, no disk numbers, no comment, nothing after
 * it), the records
 * the reader reads through the offsets the archive states; those parts are the intention's
 * classes. Where a comment holds an end-record signature, the end record is APPNOTE 4.3.16's
 * ({@link appnoteEnd}): where it is the rendered one, the clean reading holds; where it is the
 * comment's and Python takes it too, Python's reading of the archive itself holds; where Python
 * takes another, no reading is the policy's, and the archive is undecided.
 *
 * @param input - The archive.
 * @param input.clean - What Python read of the archive with its own parts plain.
 * @param input.intent - Its intention.
 * @param input.python - What Python read of the archive itself.
 * @param input.rendered - Its bytes and where its renderer put its records.
 * @returns The expectation.
 */
export const expectedOf = (input: {
  readonly clean: PythonView;
  readonly intent: ZipIntent;
  readonly python: PythonView;
  readonly rendered: Rendered;
}): Expected => {
  const { clean, intent, python, rendered } = input;
  const refusals = new Refusals();
  const end = appnoteEnd(rendered.bytes);
  const own = end === rendered.endAt;
  if (end < 0 || (!own && end !== pythonEnd(rendered.bytes))) {
    return end < 0
      ? { classes: new Set(["no-end"]), kind: "refuse", reasons: ["no-end (no end record)"] }
      : { kind: "undecided" };
  }

  containerClasses(intent, rendered.bytes, end, own, refusals);

  const view = own ? clean : python;
  if (!view.ok) {
    refusals.add("structure", "python refuses the records");

    return refusals.expected();
  }

  const records = view.infos.map((info, at) => ({
    entry: own ? rendered.records[at] : undefined,
    info,
  }));
  recordClasses(records, refusals);

  const files = records
    .filter(({ info }) => !isDirectory(info))
    .toSorted((left, right) => byPath(left.info.name, right.info.name));
  listingClasses(files, refusals);
  dataClasses(intent, files, refusals);

  return refusals.any()
    ? refusals.expected()
    : {
        entries: files.map(({ entry, info }) => ({
          path: info.name,
          sha:
            "sha" in info.read
              ? info.read.sha
              : shaOf(intent.entries[entry ?? -1]?.data ?? new Uint8Array(0)),
        })),
        kind: "accept",
      };
};

/**
 * The intention Python reads an archive's records from: the same entries and central records, its
 * own parts plain, so the offsets it states are where its records are.
 *
 * @param intent - The archive.
 * @returns The plain archive.
 */
export const cleanOf = (intent: ZipIntent): ZipIntent => ({
  ...intent,
  cdDisk: 0,
  comment: new Uint8Array(0),
  disk: 0,
  gap: new Uint8Array(0),
  prefix: new Uint8Array(0),
  trailing: new Uint8Array(0),
  zip64: "none",
});

/**
 * The rule each refusal class is named by.
 *
 * @param cls - The class.
 * @returns The rule.
 */
const ruleOf = (cls: RefusalClass): string => {
  if (cls === "name") {
    return "href-path";
  }

  return cls === "manifest-duplicate" || cls === "manifest-missing"
    ? "manifest-root"
    : "zip-format";
};

/**
 * One disagreement: what the reader said, what the policy over Python's reading says, and its kind.
 */
export interface ZipDisagreement {
  readonly expected: string;
  readonly got: string;
  readonly kind: string;
}

/**
 * Compare the reader's verdict with the expectation.
 *
 * @param got - The reader's verdict.
 * @param expected - What it must be.
 * @returns The disagreement, none when the verdict is one the expectation allows.
 */
export const comparedZip = (
  got: PantryVerdict,
  expected: Expected,
): ZipDisagreement | undefined => {
  if (expected.kind === "undecided") {
    return undefined;
  }

  const shownExpected =
    expected.kind === "accept"
      ? `accept ${JSON.stringify(expected.entries.map(({ path, sha }) => `${path}:${sha.slice(0, 8)}`))}`
      : `refuse ${expected.reasons.join("; ")}`;
  const shownGot =
    got.kind === "accepted"
      ? `accepted ${JSON.stringify(got.entries.map(({ path, sha }) => `${path}:${sha.slice(0, 8)}`))}`
      : `refused ${got.rule} ${got.class} at ${got.entry}: ${got.feature}`;
  if (got.kind === "accepted" && expected.kind === "accept") {
    const same =
      got.entries.length === expected.entries.length &&
      got.entries.every(
        ({ path, sha }, at) =>
          expected.entries[at]?.path === path && expected.entries[at]?.sha === sha,
      );

    return same
      ? undefined
      : { expected: shownExpected, got: shownGot, kind: "accepted other files" };
  }

  if (got.kind === "accepted" && expected.kind === "refuse") {
    return {
      expected: shownExpected,
      got: shownGot,
      kind: `accepted where ${expected.reasons.join("; ")} applies`,
    };
  }

  if (got.kind === "refused" && expected.kind === "accept") {
    return { expected: shownExpected, got: shownGot, kind: `refused ${got.class} where it reads` };
  }

  if (got.kind === "refused" && expected.kind === "refuse") {
    const allowed =
      got.class !== "unclassed" &&
      expected.classes.has(got.class) &&
      ruleOf(got.class) === got.rule;

    return allowed
      ? undefined
      : {
          expected: shownExpected,
          got: shownGot,
          kind: `refused ${got.class} where ${expected.reasons.join("; ")} applies`,
        };
  }

  return undefined;
};

/**
 * Judge archives written by `writeZip`: Python must read every entry back with its name and bytes,
 * and each header with the fields the writer documents: version needed at least 2.0 for a deflated
 * entry and 1.0 for a stored one (APPNOTE 4.4.3.2), the MS-DOS host (version made by 2.0, host 0),
 * the UTF-8 flag alone, the 1980-01-01 00:00:00 timestamp, and deflate from 64 bytes up; and the
 * package reader must read back the entries it was given, sorted by path.
 *
 * @param entries - The entries written, in order.
 * @param python - What Python read of the archive.
 * @param pantry - What the package reader read of it.
 * @returns The disagreements, each a field and what it held.
 */
export const writerDisagreements = (
  entries: readonly ZipEntry[],
  python: PythonView,
  pantry: PantryVerdict,
): readonly string[] => {
  if (!python.ok) {
    return [`python refused the written archive: ${python.error}`];
  }

  const found: string[] = [];
  if (python.infos.length !== entries.length) {
    found.push(`python read ${String(python.infos.length)} entries of ${String(entries.length)}`);
  }

  for (const [at, entry] of entries.entries()) {
    const info = python.infos[at];
    if (info !== undefined) {
      const deflated = entry.bytes.length >= 64;
      const checks: readonly (readonly [string, boolean, unknown])[] = [
        ["name", info.name === entry.path, info.name],
        ["data", "sha" in info.read && info.read.sha === shaOf(entry.bytes), info.read],
        ["extract version", info.extract >= (deflated ? 20 : 10), info.extract],
        ["host", info.system === 0, info.system],
        ["flags", info.flags === 0x8_00, info.flags],
        ["timestamp", JSON.stringify(info.date) === "[1980,1,1,0,0,0]", info.date],
        ["method", info.method === (deflated ? 8 : 0), info.method],
        ["external attributes", info.external === 0, info.external],
      ];
      for (const [field, holds, held] of checks) {
        if (!holds) {
          found.push(`entry ${entry.path}'s ${field} is ${JSON.stringify(held)}`);
        }
      }
    }
  }

  const sorted = entries
    .map(({ bytes, path }) => ({ path, sha: shaOf(bytes) }))
    .toSorted((left, right) => byPath(left.path, right.path));
  if (pantry.kind === "refused") {
    found.push(`the package reader refused it: ${pantry.feature}`);
  } else if (JSON.stringify(pantry.entries) !== JSON.stringify(sorted)) {
    found.push(
      `the package reader read back ${JSON.stringify(pantry.entries.map(({ path }) => path))}`,
    );
  }

  return found;
};

/**
 * Write the Python script into a folder.
 *
 * @param folder - The folder, the run's own.
 * @returns The script's path.
 */
export const writeScript = Effect.fn("test.geneticZip.writeScript")(function* writeScript(
  folder: string,
) {
  const fs = yield* FileSystem.FileSystem;
  yield* fs.makeDirectory(folder, { recursive: true });
  yield* fs.writeFileString(`${folder}/judge.py`, pythonScript);

  return `${folder}/judge.py`;
});

/**
 * The feature families the search reports a residual for.
 */
export const zipFamilies = ["archive", "entry", "verdict"] as const;

/**
 * A feature: its family, then what it names.
 */
export type ZipFeature = `${(typeof zipFamilies)[number]}:${string}`;

/**
 * Name a feature's family.
 *
 * @param feature - The feature.
 * @returns Its family.
 */
export const zipFamilyOf = (feature: ZipFeature): string => feature.slice(0, feature.indexOf(":"));

/**
 * Class a declared size at the grain the budgets branch at.
 *
 * @param declared - The size.
 * @param data - The data's own size.
 * @returns Its class.
 */
const sizeClass = (declared: number, data: number): string => {
  const mib = 1024 * 1024;
  if (declared === data + 1) {
    return "data+1";
  }

  if (declared <= mib) {
    return declared === mib ? "1MiB" : "under-1MiB";
  }

  if (declared < 64 * mib) {
    return declared < 63 * mib ? "1-63MiB" : "63-64MiB";
  }

  return declared === 64 * mib ? "64MiB" : "past-64MiB";
};

/**
 * Class a byte string by its first record signature, or its length.
 *
 * @param raw - The bytes.
 * @returns Its class.
 */
const bytesClass = (raw: Uint8Array): string => {
  const named = Object.entries(signatures).find(([, signature]) =>
    signature.every((byte, index) => raw[index] === byte),
  );
  if (named !== undefined) {
    return `starts-${named[0]}`;
  }

  if (raw.length === 0) {
    return "empty";
  }

  return raw.includes(0x50) ? "holds-PK" : `plain-${String(Math.min(raw.length, 9))}`;
};

/**
 * The kind of an entry's name: a name two entries hold, the manifest, a directory by its slash, a
 * name no package path is, or a file.
 *
 * @param name - The name.
 * @param counts - How many entries hold each name.
 * @returns The kind.
 */
const entryKindOf = (name: string, counts: ReadonlyMap<string, number>): string => {
  if ((counts.get(name) ?? 0) > 1) {
    return "duplicate";
  }

  if (name === manifestName) {
    return "manifest";
  }

  if (name.endsWith("/")) {
    return "dir-slash";
  }

  return unsafeName(name) ? "unsafe" : "file";
};

/**
 * The fields of an entry that are not plain, each with its state at the grain the reader
 * branches at.
 *
 * @param entry - The entry.
 * @returns Each field and its state.
 */
const entryStates = (
  entry: ZipIntent["entries"][number],
): readonly (readonly [string, string])[] => {
  const states: (readonly [string, string])[] = [];
  const state = (field: string, held: boolean, value: () => string): void => {
    if (held) {
      states.push([field, value()]);
    }
  };
  state("utf8Flag", !entry.utf8Flag, () => "off");
  state("method", entry.method !== (entry.data.length >= 64 ? 8 : 0), () => String(entry.method));
  state("encrypted", entry.encrypted, () => "set");
  state("descriptor", entry.descriptor, () => "set");
  state("crc", entry.crc === "wrong", () => "wrong");
  state("declared", entry.declared !== undefined, () =>
    sizeClass(entry.declared ?? 0, entry.data.length),
  );
  state("stored", entry.stored !== 0, () => String(entry.stored));
  state("host", entry.host !== 0, () => String(entry.host));
  state("external", entry.external !== 0, () => `0x${entry.external.toString(16)}`);
  state("extra", entry.extra !== "none", () => entry.extra);
  state("localName", entry.localName !== undefined, () => "other");

  return states;
};

/**
 * The archive's own parts that are not plain, each with its state.
 *
 * @param intent - The archive.
 * @returns Each part and its state.
 */
const archiveStates = (intent: ZipIntent): readonly (readonly [string, string])[] =>
  (
    [
      ["zip64", intent.zip64 === "none" ? undefined : intent.zip64],
      ["disk", intent.disk === 0 ? undefined : String(intent.disk)],
      ["cdDisk", intent.cdDisk === 0 ? undefined : String(intent.cdDisk)],
      ["centralOrder", intent.centralOrder === "local" ? undefined : intent.centralOrder],
      ["aliases", intent.aliases.length === 0 ? undefined : "some"],
      ["gap", intent.gap.length === 0 ? undefined : bytesClass(intent.gap)],
      ["prefix", intent.prefix.length === 0 ? undefined : bytesClass(intent.prefix)],
      ["comment", intent.comment.length === 0 ? undefined : bytesClass(intent.comment)],
      [
        "trailing",
        intent.trailing.length === 0 ? undefined : String(Math.min(intent.trailing.length, 65_536)),
      ],
    ] as const
  ).flatMap(([part, value]) => (value === undefined ? [] : [[part, value] as const]));

/**
 * The features one judged archive shows: each entry's kind with each of its fields that is not
 * plain, each archive part that is not plain, each beside the reader's verdict, and the pair of
 * the reader's verdict and Python's.
 *
 * @param intent - The archive.
 * @param got - The reader's verdict.
 * @param python - What Python read.
 * @returns The features.
 */
export const zipFeaturesOf = (
  intent: ZipIntent,
  got: PantryVerdict,
  python: PythonView,
): ReadonlySet<ZipFeature> => {
  const verdict = got.kind === "accepted" ? "accepted" : got.class;
  const found = new Set<ZipFeature>([
    `verdict:${verdict} python-${python.ok ? "read" : "refused"}`,
  ]);
  const counts = new Map<string, number>();
  for (const { name } of intent.entries) {
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  for (const entry of intent.entries) {
    const kind = entryKindOf(entry.name, counts);
    const off = entryStates(entry);
    if (off.length === 0) {
      found.add(`entry:${kind} plain ${verdict}`);
    }

    for (const [field, value] of off) {
      found.add(`entry:${kind} ${field}=${value} ${verdict}`);
    }
  }

  for (const [part, value] of archiveStates(intent)) {
    found.add(`archive:${part}=${value} ${verdict}`);
  }

  return found;
};

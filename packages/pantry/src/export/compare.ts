/**
 * The comparison of an export with the record it was made from (fin.md P7, D6): every entry the
 * import read, by path, against the entry the export wrote at that path.
 *
 * An entry's bytes are compared first, and byte equality is reported as `byte-identical`. Where the
 * bytes differ, the entry is held to canonical equality: an entry that is well-formed XML on both
 * sides is equal when its Canonical XML 1.0 forms, comments kept, are (`canonical-equal`), which is
 * what an export of a rebuilt document promises; an entry that is not XML on either side has its
 * bytes as its canonical form, so it differs. The record and the export are each a set of entries
 * keyed by path, so an entry only the export writes, and a path either side holds twice, differ
 * too.
 */
import { Array as Arr, Effect, Option } from "effect";
import type { FileSystem, PlatformError } from "effect";
import { readEntries } from "#pantry/package/read.ts";
import type { PackageReadError } from "#pantry/package/read.ts";
import type { ZipEntry, ZipRefusal } from "#pantry/package/zip.ts";
import { canonicalize } from "@qti-pie/crust/canonical.ts";
import { readXml } from "@qti-pie/crust/read.ts";

/**
 * What comparing one path found.
 *
 * `byte-identical` is an entry whose bytes the export wrote back exactly, and `canonical-equal` an
 * XML entry whose bytes differ but whose canonical forms agree. `differs` says where in `at`:
 * `missing` for an entry the export lacks, `extra` for one only the export writes, `repeated` for a
 * path either side holds twice, otherwise `byte <offset>` and, for an XML entry, `, line <n>` with
 * both canonical lines, `ends` for a side whose form has no line `<n>`.
 */
export type Outcome =
  | { kind: "canonical-equal" }
  | { kind: "byte-identical" }
  | { kind: "differs"; at: string };

/**
 * The comparison of an export with its record: one outcome per path of the record, in the record's
 * order, then one per path only the export writes, in the export's order.
 */
export type Report = readonly { path: string; outcome: Outcome }[];

/**
 * What can stop a comparison of two package directories or zips: a directory that is not a package,
 * a zip the container rules refuse, or the file system.
 */
type CompareError = PackageReadError | ZipRefusal | PlatformError.PlatformError;

/**
 * Find the first offset at which two byte strings differ.
 *
 * @param left - One byte string.
 * @param right - The other.
 * @returns The first index where they differ, the shorter length when one is a prefix of the
 *   other, or `undefined` when they are equal.
 */
const firstDifference = (left: Uint8Array, right: Uint8Array): number | undefined => {
  const shared = Math.min(left.length, right.length);

  for (let offset = 0; offset < shared; offset += 1) {
    if (left[offset] !== right[offset]) {
      return offset;
    }
  }

  return left.length === right.length ? undefined : shared;
};

/**
 * Quote a form's line for {@link describeCanonical}, or say the form ends before it, which an empty
 * line does not: `""` is a line that holds nothing.
 *
 * @param lines - The form's lines.
 * @param at - The line's index.
 * @returns The line as JSON, or `ends` when the form has no such line.
 */
const lineAt = (lines: readonly string[], at: number): string =>
  Option.match(Arr.get(lines, at), {
    onNone: () => "ends",
    onSome: (text) => JSON.stringify(text),
  });

/**
 * Describe where two canonical forms first differ: the byte offset and the first differing line of
 * each, or `ends` for a form that has no such line.
 *
 * @param recorded - The record's canonical form.
 * @param exported - The export's canonical form.
 * @param offset - The first differing byte offset.
 * @returns The `at` text.
 */
const describeCanonical = (recorded: Uint8Array, exported: Uint8Array, offset: number): string => {
  const decoder = new TextDecoder();
  const left = decoder.decode(recorded).split("\n");
  const right = decoder.decode(exported).split("\n");
  const line = left.findIndex((text, index) => text !== right[index]);
  const at = line === -1 ? left.length : line;

  return `byte ${String(offset)}, line ${String(at + 1)}: record ${lineAt(left, at)}, export ${lineAt(right, at)}`;
};

/**
 * Canonicalize an entry when it is well-formed XML.
 *
 * An entry crust's reader refuses, for its charset, its prolog, an entity reference or its
 * well-formedness, is no XML document, and none is its canonical form.
 *
 * @param bytes - The entry's bytes.
 * @returns Its Canonical XML 1.0 form with comments, or none for bytes that are not an XML
 *   document.
 * @see {@link https://www.w3.org/TR/xml-c14n/ | Canonical XML 1.0}
 */
const canonicalOf = (bytes: Uint8Array) =>
  Effect.option(Effect.map(readXml(bytes), (document) => canonicalize(document)));

/**
 * Compare one entry the record and the export both hold.
 *
 * @param recorded - The bytes the import read.
 * @param exported - The bytes the export wrote.
 * @returns `byte-identical` for equal bytes; otherwise `canonical-equal` or a canonical `differs`
 *   when both are XML documents, and a byte `differs` when either is not.
 */
const compareEntry = Effect.fnUntraced(function* compareEntry(
  recorded: Uint8Array,
  exported: Uint8Array,
): Effect.fn.Return<Outcome> {
  const offset = firstDifference(recorded, exported);
  if (offset === undefined) {
    return { kind: "byte-identical" };
  }

  const left = yield* canonicalOf(recorded);
  const right = yield* canonicalOf(exported);
  if (left._tag === "None" || right._tag === "None") {
    return { at: `byte ${String(offset)}`, kind: "differs" };
  }

  const canonical = firstDifference(left.value, right.value);

  return canonical === undefined
    ? { kind: "canonical-equal" }
    : { at: describeCanonical(left.value, right.value, canonical), kind: "differs" };
});

/**
 * A list of entries keyed by path: each path's bytes, and the paths the list holds more than once.
 */
interface Keyed {
  readonly bytes: ReadonlyMap<string, Uint8Array>;
  readonly repeated: ReadonlySet<string>;
}

/**
 * Key a list of entries by path, keeping the first of a repeated path and naming it repeated.
 *
 * @param entries - The entries, in their order.
 * @returns The entries by path, in first-occurrence order, and the repeated paths.
 */
const keyedByPath = (entries: readonly ZipEntry[]): Keyed => {
  const bytes = new Map<string, Uint8Array>();
  const repeated = new Set<string>();
  for (const { bytes: content, path } of entries) {
    if (bytes.has(path)) {
      repeated.add(path);
    } else {
      bytes.set(path, content);
    }
  }

  return { bytes, repeated };
};

/**
 * Compare an export with the record of the package it was made from.
 *
 * Each path of the record is looked up in the export: a path the export lacks differs at
 * `missing`, and any other is compared by {@link compareEntry}. Then each path only the export
 * writes differs at `extra`. A path either side holds twice differs at `repeated` and is compared
 * no further, so the report is one outcome per path.
 *
 * @param record - The entries the import read, in listing order: the `Entry` family's bytes.
 * @param exported - The entries the export wrote, in the order it wrote them.
 * @returns One outcome per path, the record's paths first.
 */
export const compareRecord = Effect.fn("compare.compareRecord")(function* compareRecord(
  record: readonly ZipEntry[],
  exported: readonly ZipEntry[],
): Effect.fn.Return<Report> {
  const recorded = keyedByPath(record);
  const written = keyedByPath(exported);
  const report: { path: string; outcome: Outcome }[] = [];
  for (const [path, bytes] of recorded.bytes) {
    const counterpart = written.bytes.get(path);
    if (recorded.repeated.has(path) || written.repeated.has(path)) {
      report.push({ outcome: { at: "repeated", kind: "differs" }, path });
      continue;
    }

    const outcome: Outcome =
      counterpart === undefined
        ? { at: "missing", kind: "differs" }
        : yield* compareEntry(bytes, counterpart);
    report.push({ outcome, path });
  }

  for (const path of written.bytes.keys()) {
    if (!recorded.bytes.has(path)) {
      report.push({
        outcome: { at: written.repeated.has(path) ? "repeated" : "extra", kind: "differs" },
        path,
      });
    }
  }

  yield* Effect.annotateCurrentSpan({
    differing: report.filter(({ outcome }) => outcome.kind === "differs").length,
    entries: report.length,
  });

  return report;
});

/**
 * Compare an export directory or zip with the package directory or zip it was made from.
 *
 * Both sides are read whole by `readEntries`, so a directory and a zip of the same files compare
 * alike; the source's entries are the record its import wrote (`recordOf`), and the export's are
 * compared with them by {@link compareRecord}.
 *
 * @param sourceDir - The source package directory, or its `.zip` file.
 * @param exportDir - The export directory, or its `.zip` file.
 * @returns One outcome per path; or a `PackageReadError` when either side has no manifest at its
 *   root, a `ZipRefusal`, or the file system's error.
 */
export const comparePackage = Effect.fn("compare.comparePackage")(function* comparePackage(
  sourceDir: string,
  exportDir: string,
): Effect.fn.Return<Report, CompareError, FileSystem.FileSystem> {
  yield* Effect.annotateCurrentSpan({ exportDir, sourceDir });

  return yield* compareRecord(yield* readEntries(sourceDir), yield* readEntries(exportDir));
});

/**
 * Render a report as text: a line `<path>: <kind>[ at <where>]` for each path, then `all equal`
 * or `<n> differ`.
 *
 * @param report - The report to render.
 * @returns The lines joined by line feeds, with no trailing line feed.
 */
export const renderReport = (report: Report): string => {
  const lines = report.map(({ outcome, path }) =>
    outcome.kind === "differs" ? `${path}: differs at ${outcome.at}` : `${path}: ${outcome.kind}`,
  );
  const differing = report.filter(({ outcome }) => outcome.kind === "differs").length;

  return [...lines, differing === 0 ? "all equal" : `${String(differing)} differ`].join("\n");
};

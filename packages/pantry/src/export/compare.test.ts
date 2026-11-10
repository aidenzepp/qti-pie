import path from "node:path";
import { NodeChildProcessSpawner, NodeFileSystem, NodePath } from "@effect/platform-node";
import { assert, layer } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { element } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Array as Arr, Duration, Effect, FileSystem, Formatter, Layer } from "effect";
import { compareRecord, comparePackage, renderReport } from "#pantry/export/compare.ts";
import type { Outcome } from "#pantry/export/compare.ts";
import { readEntries } from "#pantry/package/read.ts";
import { writeZip } from "#pantry/package/zip.ts";
import type { ZipEntry } from "#pantry/package/zip.ts";
import { materialize, materializeZip } from "#pantry/test/fixtures.ts";
import { canonicalize } from "@qti-pie/crust/canonical.ts";
import { readXml } from "@qti-pie/crust/read.ts";
import type { FixtureName } from "#pantry/test/fixtures.ts";

/**
 * What every test here runs on: the file system the comparison reads packages through, and the
 * process spawner the fixture materializer's `tar` and `unzip` need.
 */
const TestLayer = NodeChildProcessSpawner.layer.pipe(
  Layer.provideMerge(Layer.mergeAll(NodeFileSystem.layer, NodePath.layer)),
);

/**
 * The directory every scratch file is made under: the package's gitignored `work/`.
 */
const workDirectory = path.resolve(import.meta.dirname, "../../work");

/**
 * The fixture packages the comparison is checked over: `simple` and its charset and DOCTYPE
 * variants, between them every charset family the import reads (UTF-8, UTF-16 with a byte order
 * mark, ISO-8859-1, windows-1252) and both a DOCTYPE and an undeclared external entity, and the
 * examples' `sharedMedia`.
 */
const fixtures = [
  "simple",
  "sharedMedia",
  "latin1",
  "utf16",
  "windows-1252",
  "doctype",
  "external",
] as const satisfies readonly FixtureName[];

/**
 * A package the variants are built over: a fixture directory, or the examples' `svg` zip, which
 * holds an SVG image among its XML entries.
 */
type Source = (typeof fixtures)[number] | "svg.zip";

/**
 * The named ways an export can depart from its record, one entry at a time, each with the outcome
 * its construction fixes:
 *
 * - `same`: the export is the record, so every entry is `byte-identical`;
 * - `trailingNewline`: a line feed after the entry's last byte, which Canonical XML drops after the
 *   document element, so an XML entry is `canonical-equal` and any other differs at its length;
 * - `appendedComment`: a comment after the entry's last byte, which Canonical XML with comments keeps
 *   as a last line, so an XML entry differs at its canonical form's length, on the line after its
 *   last, and any other at its length;
 * - `flippedByte` and `flippedNextByte`: one byte of a non-XML entry changed at its middle, or just
 *   after, so at an even and an odd offset, which differs there;
 * - `truncated`: an XML entry cut to its first half, no XML document, which differs where it ends;
 * - `replacedByXml`: a non-XML entry written as the package's manifest, which differs at the first
 *   byte the two do not share;
 * - `missing`: the entry left out of the export, which differs at `missing`;
 * - `repeated`: the entry written twice, and `recordRepeated`: the entry read twice, each of which
 *   differs at `repeated`;
 * - `extra`: an entry the record does not hold written beside the rest, which differs at `extra`.
 */
type Variant =
  | "same"
  | "trailingNewline"
  | "appendedComment"
  | "flippedByte"
  | "flippedNextByte"
  | "truncated"
  | "replacedByXml"
  | "missing"
  | "repeated"
  | "recordRepeated"
  | "extra";

/**
 * One case of the comparison's space: a package, the entry a variant edits (none for `same` and
 * `extra`), and the variant.
 */
interface CompareCase {
  readonly path: string;
  readonly source: Source;
  readonly variant: Variant;
}

/**
 * The path the `extra` variant writes, which no fixture holds.
 */
const extraPath = "q5-16/extra.bin";

/**
 * The comment the `appendedComment` variant writes after an entry.
 */
const comment = "<!--q5.16-->";

/**
 * Test whether an entry is an XML document by its name: the fixtures' documents are `.xml` and
 * `.svg` files, and every other entry is an image.
 *
 * @param entry - The entry's path.
 * @returns Whether the entry is XML.
 */
const isXmlPath = (entry: string): boolean => entry.endsWith(".xml") || entry.endsWith(".svg");

/**
 * Append ASCII text to an entry in the code units of its charset: UTF-16 by its byte order mark,
 * little- or big-endian, and one byte per character otherwise, as every other fixture charset
 * writes ASCII.
 *
 * @param bytes - The entry's bytes.
 * @param text - The ASCII text to append.
 * @returns The bytes with the text after the last one.
 */
const appended = (bytes: Uint8Array, text: string): Uint8Array => {
  const codes = Array.from(text, (character) => character.codePointAt(0) ?? 0);
  if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    return Uint8Array.from([...bytes, ...codes.flatMap((code) => [code, 0])]);
  }

  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    return Uint8Array.from([...bytes, ...codes.flatMap((code) => [0, code])]);
  }

  return Uint8Array.from([...bytes, ...codes]);
};

/**
 * Change one byte of an entry.
 *
 * @param bytes - The entry's bytes.
 * @param offset - The byte to change.
 * @returns The bytes with that one moved up by one, modulo 256.
 */
const flipped = (bytes: Uint8Array, offset: number): Uint8Array => {
  const changed = Uint8Array.from(bytes);
  changed[offset] = ((changed[offset] ?? 0) + 1) % 256;

  return changed;
};

/**
 * Find where two byte strings first differ, as the harness reads them.
 *
 * @param left - One byte string.
 * @param right - The other.
 * @returns The first offset whose bytes differ, or the shorter length.
 */
const differenceOf = (left: Uint8Array, right: Uint8Array): number => {
  const at = left.findIndex((byte, offset) => byte !== right[offset]);

  return at === -1 || at >= right.length ? Math.min(left.length, right.length) : at;
};

/**
 * The bytes a variant writes for the entry it edits.
 *
 * @param entry - The entry as read.
 * @param variant - The variant.
 * @param manifest - The package's manifest bytes, which `replacedByXml` writes.
 * @returns The entries written at the entry's path: none, one or two.
 */
const editedOf = (entry: ZipEntry, variant: Variant, manifest: Uint8Array): readonly ZipEntry[] => {
  const middle = Math.floor(entry.bytes.length / 2);
  const at = (bytes: Uint8Array): readonly ZipEntry[] => [{ bytes, path: entry.path }];
  switch (variant) {
    case "trailingNewline": {
      return at(appended(entry.bytes, "\n"));
    }
    case "appendedComment": {
      return at(appended(entry.bytes, comment));
    }
    case "flippedByte": {
      return at(flipped(entry.bytes, middle));
    }
    case "flippedNextByte": {
      return at(flipped(entry.bytes, middle + 1));
    }
    case "truncated": {
      return at(entry.bytes.slice(0, middle));
    }
    case "replacedByXml": {
      return at(manifest);
    }
    case "missing": {
      return [];
    }
    case "repeated": {
      return [entry, entry];
    }
    case "same":
    case "recordRepeated":
    case "extra": {
      return [entry];
    }
    default: {
      return variant satisfies never;
    }
  }
};

/**
 * Build a case's record and export from the package as read.
 *
 * @param read - The package's entries as read.
 * @param edited - The case.
 * @returns The record the comparison reads, holding the edited entry twice under
 *   `recordRepeated`, and the entries the case's export writes.
 */
const variantOf = (read: readonly ZipEntry[], edited: CompareCase) => {
  const manifest =
    read.find((entry) => entry.path === "imsmanifest.xml")?.bytes ?? new Uint8Array();
  const record = read.flatMap((entry) =>
    entry.path === edited.path && edited.variant === "recordRepeated" ? [entry, entry] : [entry],
  );
  const exported = [
    ...read.flatMap((entry) =>
      entry.path === edited.path ? editedOf(entry, edited.variant, manifest) : [entry],
    ),
    ...(edited.variant === "extra" ? [{ bytes: Uint8Array.of(1, 2, 3), path: extraPath }] : []),
  ];

  return { exported, manifest, record };
};

/**
 * Check an outcome against one `differs` place.
 *
 * @param at - The place the outcome must name.
 * @returns A check that holds of a `differs` outcome at exactly `at`.
 */
const differsAt =
  (at: string) =>
  (outcome: Outcome | undefined): boolean =>
    outcome?.kind === "differs" && outcome.at === at;

/**
 * The outcome a case's construction fixes for the entry it edits.
 *
 * @param entry - The edited entry as read; the empty entry for `same` and `extra`.
 * @param edited - The case.
 * @param manifest - The package's manifest bytes.
 * @returns A check of the edited entry's outcome. An XML entry's appended comment is placed by
 *   crust's canonical form of the entry, which the comparison's form extends by one line.
 */
const expectedOf = Effect.fnUntraced(function* expectedOf(
  entry: Uint8Array,
  edited: CompareCase,
  manifest: Uint8Array,
): Effect.fn.Return<(outcome: Outcome | undefined) => boolean, unknown> {
  const { length } = entry;
  const middle = Math.floor(length / 2);
  const xml = isXmlPath(edited.path);
  switch (edited.variant) {
    case "same": {
      return (outcome) => outcome?.kind === "byte-identical";
    }
    case "trailingNewline": {
      return xml
        ? (outcome) => outcome?.kind === "canonical-equal"
        : differsAt(`byte ${String(length)}`);
    }
    case "appendedComment": {
      if (!xml) {
        return differsAt(`byte ${String(length)}`);
      }

      const canonical = canonicalize(yield* readXml(entry));
      const lines = new TextDecoder().decode(canonical).split("\n").length;

      return differsAt(
        `byte ${String(canonical.length)}, line ${String(lines + 1)}: record ends, export ${JSON.stringify(comment)}`,
      );
    }
    case "flippedByte": {
      return differsAt(`byte ${String(middle)}`);
    }
    case "flippedNextByte": {
      return differsAt(`byte ${String(middle + 1)}`);
    }
    case "truncated": {
      return differsAt(`byte ${String(middle)}`);
    }
    case "replacedByXml": {
      return differsAt(`byte ${String(differenceOf(entry, manifest))}`);
    }
    case "missing":
    case "repeated":
    case "extra": {
      return differsAt(edited.variant);
    }
    case "recordRepeated": {
      return differsAt("repeated");
    }
    default: {
      return edited.variant satisfies never;
    }
  }
});

/**
 * The variants that edit one entry of a package, by whether the entry is XML: a byte is changed,
 * and the entry replaced by the manifest, only where no XML reading could make the change
 * canonical, and an entry is truncated only where it is XML.
 *
 * @param entry - The entry's path.
 * @returns The variants that apply to it.
 */
const entryVariants = (entry: string): readonly Variant[] => [
  "trailingNewline",
  "appendedComment",
  ...(isXmlPath(entry)
    ? (["truncated"] as const)
    : (["flippedByte", "flippedNextByte", "replacedByXml"] as const)),
  "missing",
  "repeated",
  "recordRepeated",
];

/**
 * Read every package the cases are built over.
 *
 * @returns Each package's entries as read, by its name.
 */
const recordsOf = Effect.gen(function* recordsOf() {
  const directories = yield* Effect.all(
    fixtures.map((name) =>
      materialize(name).pipe(Effect.map((dir): readonly [Source, string] => [name, dir])),
    ),
  );
  const svg = yield* materializeZip("svg");
  const sources: readonly (readonly [Source, string])[] = [...directories, ["svg.zip", svg]];

  return new Map(
    yield* Effect.all(
      sources.map(([name, dir]) =>
        readEntries(dir).pipe(
          Effect.map((record): readonly [Source, readonly ZipEntry[]] => [name, record]),
        ),
      ),
    ),
  );
});

layer(TestLayer, { excludeTestServices: true })("export/compare.ts", (it) => {
  it.effect(
    "reports every named variant of an export of every fixture as its construction fixes, and every other entry byte-identical",
    (ctx) =>
      Effect.gen(function* everyVariant() {
        const records = yield* recordsOf;
        const cases: CompareCase[] = [];
        for (const [source, record] of records) {
          cases.push(
            { path: "", source, variant: "same" },
            { path: extraPath, source, variant: "extra" },
          );
          for (const entry of record) {
            for (const variant of entryVariants(entry.path)) {
              cases.push({ path: entry.path, source, variant });
            }
          }
        }

        const [first] = cases;
        if (first === undefined) {
          assert.fail("the fixtures hold no entry");
        }

        // Oracle: the specification as a checker: the record's bytes, and Canonical XML 1.0 with
        // comments, which drops whitespace after the document element and keeps a comment there,
        // so each variant's outcome is fixed by how it was built ({@link expectedOf}).
        // Bound: exhaustive, every entry of the seven fixture packages and the svg zip under every
        // variant that applies to it.
        yield* searched(
          ctx,
          exhaust(
            {
              box: "every entry of 8 packages under each applicable variant",
              caseHang: Duration.minutes(1),
              coverage: requiredInSpace<Variant | "xml" | "binary">([
                "same",
                "trailingNewline",
                "appendedComment",
                "flippedByte",
                "flippedNextByte",
                "truncated",
                "replacedByXml",
                "missing",
                "repeated",
                "recordRepeated",
                "extra",
                "xml",
                "binary",
              ]),
              generator: element([first, ...cases.slice(1)]),
              limit: 1000,
              literal: Formatter.format,
              oracle: {
                kind: "specification",
                name: "the record's bytes and Canonical XML 1.0 with comments",
              },
              suite: "export/compare-variants",
            },
            (edited, c) =>
              Effect.gen(function* variant() {
                c.note(edited.variant);
                if (edited.path !== "" && edited.path !== extraPath) {
                  c.note(isXmlPath(edited.path) ? "xml" : "binary");
                }

                const read = records.get(edited.source) ?? [];
                const { exported, manifest, record } = variantOf(read, edited);
                const report = yield* compareRecord(record, exported);
                const paths = Arr.dedupe(read.map((entry) => entry.path));
                const expected = edited.variant === "extra" ? [...paths, extraPath] : paths;
                const entry = read.find((item) => item.path === edited.path)?.bytes;
                const holds = yield* expectedOf(entry ?? new Uint8Array(), edited, manifest);

                assert.deepStrictEqual(
                  report.map((item) => item.path),
                  expected,
                );
                for (const item of report) {
                  const edits = item.path === edited.path || edited.variant === "same";
                  assert.isTrue(
                    edits ? holds(item.outcome) : item.outcome.kind === "byte-identical",
                    `${edited.source} ${edited.variant}: ${item.path} ${Formatter.format(item.outcome)}`,
                  );
                }
              }),
          ),
        );
      }),
  );

  it.effect("a package directory and a zip of its entries compare byte-identical both ways", () =>
    Effect.gen(function* directoryAndZip() {
      const fs = yield* FileSystem.FileSystem;
      const simple = yield* materialize("simple");
      const record = yield* readEntries(simple);

      yield* fs.makeDirectory(workDirectory, { recursive: true });

      const parent = yield* fs.makeTempDirectoryScoped({
        directory: workDirectory,
        prefix: "export-compare-test-",
      });
      const zip = `${parent}/simple.zip`;

      yield* fs.writeFile(zip, writeZip(record));

      for (const report of [
        yield* comparePackage(simple, zip),
        yield* comparePackage(zip, simple),
      ]) {
        assert.deepStrictEqual(
          report,
          record.map((entry) => ({ outcome: { kind: "byte-identical" }, path: entry.path })),
        );
      }
    }).pipe(Effect.scoped),
  );

  it.effect(
    "the report renders one line per entry and a last line that counts the differences",
    () =>
      Effect.sync(() => {
        const text = renderReport([
          { outcome: { kind: "canonical-equal" }, path: "a.xml" },
          { outcome: { at: "missing", kind: "differs" }, path: "b.png" },
          { outcome: { kind: "byte-identical" }, path: "c.png" },
        ]);

        assert.strictEqual(
          text,
          "a.xml: canonical-equal\nb.png: differs at missing\nc.png: byte-identical\n1 differ",
        );
        assert.strictEqual(
          renderReport([{ outcome: { kind: "byte-identical" }, path: "c.png" }]),
          "c.png: byte-identical\nall equal",
        );
      }),
  );
});

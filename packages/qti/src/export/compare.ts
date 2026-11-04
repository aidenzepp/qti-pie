import { Effect, FileSystem } from "effect";
import type { PlatformError } from "effect";
import type { ChildProcessSpawner } from "effect/process";
import { listPackage, readEntry } from "#qti/package/read.ts";
import type { PackageReadError } from "#qti/package/read.ts";
import type { ZipRefusal } from "#qti/package/zip.ts";
import { recordTypes, soleFileTypes } from "#qti/import/record.ts";
import { collapse } from "#qti/import/tree.ts";
import { rootOfType } from "#qti/schema/seed/root-of-type.ts";
import { canonicalize } from "@qti-pie/crust/canonical.ts";
import type { ReaderRefusal, WellFormednessError } from "@qti-pie/crust/errors.ts";
import { xmllintC14n } from "#qti/xml/oracle.ts";
import type { OracleError } from "#qti/xml/oracle.ts";
import { readXml } from "@qti-pie/crust/read.ts";
import type { Child, Element, XmlDocument } from "@qti-pie/crust/tree.ts";

/**
 * What comparing one entry found.
 *
 * `canonical-equal` is an XML file whose canonical forms agree and `byte-identical` any other file
 * whose bytes agree. `differs` says where in `at`: `missing` for an entry the export lacks,
 * otherwise `byte <offset>` and, for an XML file, `, line <n>` with both canonical lines.
 */
export type Outcome =
  | { kind: "canonical-equal" }
  | { kind: "byte-identical" }
  | { kind: "differs"; at: string };

/**
 * The comparison of a package's export with its source: one outcome per source entry, in
 * `listPackage` order.
 */
export type Report = readonly { path: string; outcome: Outcome }[];

/**
 * What can stop a comparison: a directory that is not a package, a file that cannot be read, an
 * XML file that cannot be parsed, or the oracle refusing a file.
 */
type CompareError =
  | PackageReadError
  | ZipRefusal
  | PlatformError.PlatformError
  | OracleError
  | WellFormednessError
  | ReaderRefusal;

/**
 * What the comparison needs from its host.
 */
type CompareContext = FileSystem.FileSystem | ChildProcessSpawner.ChildProcessSpawner;

/**
 * The namespace of the manifest's elements.
 */
const cpNamespace = "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1";

/**
 * The resource types of the documents the export writes from a tree: the types the seed names a
 * root for.
 */
const documentTypes: ReadonlySet<string> = new Set(rootOfType.map((row) => row.type));

/**
 * The resource types whose one `file` is a document when the resource has no `href`: the import's
 * record types and its sole-file types.
 */
const soleFileDocumentTypes: ReadonlySet<string> = new Set([...recordTypes, ...soleFileTypes]);

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
 * Describe where two canonical texts first differ: the byte offset and the first differing line of
 * each.
 *
 * @param source - The source's canonical form.
 * @param exported - The export's canonical form.
 * @param offset - The first differing byte offset.
 * @returns The `at` text.
 */
const describeCanonical = (source: Uint8Array, exported: Uint8Array, offset: number): string => {
  const decoder = new TextDecoder();
  const left = decoder.decode(source).split("\n");
  const right = decoder.decode(exported).split("\n");
  const line = left.findIndex((text, index) => text !== right[index]);
  const at = line === -1 ? left.length : line;

  return `byte ${offset}, line ${at + 1}: source ${JSON.stringify(left[at] ?? "")}, export ${JSON.stringify(right[at] ?? "")}`;
};

/**
 * Whether an element or anything below it holds an entity reference, in content or in an
 * attribute value.
 *
 * @param element - The element to search.
 * @returns `true` when one is found.
 */
const holdsReference = (element: Element): boolean =>
  element.attributes.some((attribute) => attribute.references.length > 0) ||
  element.children.some((child: Child) =>
    child.kind === "entityRef" ? true : child.kind === "element" && holdsReference(child),
  );

/**
 * The element children of `element` in the manifest namespace with local name `local`.
 *
 * @param element - The parent.
 * @param local - The local name.
 * @returns The children in document order.
 */
const childrenNamed = (element: Element, local: string): readonly Element[] =>
  element.children.filter(
    (child): child is Element =>
      child.kind === "element" && child.namespace === cpNamespace && child.local === local,
  );

/**
 * The collapsed value of an element's attribute that has no namespace.
 *
 * @param element - The element.
 * @param local - The attribute's local name.
 * @returns The value, or `undefined` when the attribute is absent.
 */
const attributeOf = (element: Element, local: string): string | undefined => {
  const value = element.attributes.find(
    (attribute) => attribute.namespace === "" && attribute.local === local,
  )?.value;

  return value === undefined ? undefined : collapse(value);
};

/**
 * The entries the export writes from a tree, which are the import's documents.
 *
 * A resource with an `href` adds it when its type is one the seed's `rootOfType` names. A resource
 * with no `href` adds the `href` of its only `file` when it has exactly one and its type is in
 * {@link soleFileDocumentTypes}. Every other entry is stored as bytes, so it is written back as it
 * was read.
 *
 * @param manifest - The source manifest.
 * @returns The paths, each as the import reads it after whitespace collapse.
 */
const rewrittenEntries = (manifest: XmlDocument): ReadonlySet<string> => {
  const paths = new Set<string>();

  for (const container of childrenNamed(manifest.root, "resources")) {
    for (const resource of childrenNamed(container, "resource")) {
      const type = resource.attributes.find(
        (attribute) => attribute.namespace === "" && attribute.local === "type",
      )?.value;
      const href = attributeOf(resource, "href");

      if (type === undefined) {
        continue;
      }

      if (href !== undefined) {
        if (documentTypes.has(type)) {
          paths.add(href);
        }

        continue;
      }

      const files = childrenNamed(resource, "file").map((file) => attributeOf(file, "href"));
      const [only, ...rest] = files;

      if (soleFileDocumentTypes.has(type) && rest.length === 0 && only !== undefined) {
        paths.add(only);
      }
    }
  }

  return paths;
};

/**
 * Compare one XML entry canonically.
 *
 * With no entity reference on either side the oracle's canonical forms are compared; with one,
 * the oracle cannot see the exception, so the package's own canonicalizer's forms are.
 *
 * @param source - The source package directory.
 * @param exported - The export directory.
 * @param path - The entry path.
 * @returns The outcome.
 */
const compareXml = Effect.fn("compare.compareXml")(function* compareXml(
  source: string,
  exported: string,
  path: string,
): Effect.fn.Return<Outcome, CompareError, CompareContext> {
  const left = yield* readXml(yield* readEntry(source, path));
  const right = yield* readXml(yield* readEntry(exported, path));
  const external = holdsReference(left.root) || holdsReference(right.root);
  const canonical = (
    document: XmlDocument,
    dir: string,
  ): Effect.Effect<Uint8Array, CompareError, CompareContext> =>
    external ? Effect.succeed(canonicalize(document)) : xmllintC14n(`${dir}/${path}`);
  const leftBytes = yield* canonical(left, source);
  const rightBytes = yield* canonical(right, exported);
  const offset = firstDifference(leftBytes, rightBytes);

  return offset === undefined
    ? { kind: "canonical-equal" }
    : { at: describeCanonical(leftBytes, rightBytes, offset), kind: "differs" };
});

/**
 * Compare one non-XML entry byte for byte.
 *
 * @param source - The source package directory.
 * @param exported - The export directory.
 * @param path - The entry path.
 * @returns The outcome.
 */
const compareBytes = Effect.fn("compare.compareBytes")(function* compareBytes(
  source: string,
  exported: string,
  path: string,
): Effect.fn.Return<Outcome, CompareError, CompareContext> {
  const offset = firstDifference(yield* readEntry(source, path), yield* readEntry(exported, path));

  return offset === undefined
    ? { kind: "byte-identical" }
    : { at: `byte ${offset}`, kind: "differs" };
});

/**
 * Compare an export directory with the package it was made from.
 *
 * Every entry of the source is looked up in the export. The manifest and every entry the export
 * writes from a tree ({@link rewrittenEntries}: the QTI, record, usage-data and outcome documents)
 * compare canonically; every other entry, a stored file, compares byte for byte. An entry the
 * export lacks differs at `missing`. Entries only the export has are not reported.
 *
 * @param sourceDir - The source package directory.
 * @param exportDir - The export directory.
 * @returns One outcome per source entry in listing order, a `PackageReadError` when the source has
 *   no manifest or names an href outside the package, or the read, parse and oracle errors.
 */
export const comparePackage = Effect.fn("compare.comparePackage")(function* comparePackage(
  sourceDir: string,
  exportDir: string,
): Effect.fn.Return<Report, CompareError, CompareContext> {
  const fs = yield* FileSystem.FileSystem;
  const entries = yield* listPackage(sourceDir);
  const manifest = yield* readXml(yield* readEntry(sourceDir, "imsmanifest.xml"));
  const documents = rewrittenEntries(manifest);

  const report: { path: string; outcome: Outcome }[] = [];

  for (const entry of entries) {
    if (!(yield* fs.exists(`${exportDir}/${entry.path}`))) {
      report.push({ outcome: { at: "missing", kind: "differs" }, path: entry.path });
      continue;
    }

    const outcome =
      entry.kind === "manifest" || documents.has(entry.path)
        ? yield* compareXml(sourceDir, exportDir, entry.path)
        : yield* compareBytes(sourceDir, exportDir, entry.path);

    report.push({ outcome, path: entry.path });
  }

  return report;
});

/**
 * Render a report as text: a line `<path>: <kind>[ at <where>]` for each entry, then `all equal`
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

  return [...lines, differing === 0 ? "all equal" : `${differing} differ`].join("\n");
};

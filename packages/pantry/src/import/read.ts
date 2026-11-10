/**
 * The import's read, before the database: a package directory or `.zip` file in, the package as the
 * import writes it out, every file read once and every document it names parsed once (plan W5,
 * Q5.15; the W5 amendment's C19).
 *
 * The package is read whole (`readEntries`), its manifest is decoded and its schema version read,
 * and the manifest is shredded. The documents it names are the (href, type) pairs of its resources
 * whose type `RootOfType` maps (spec reading 93, `namedDocuments`), and each path one names that an
 * entry holds is shredded once, in the version the manifest declares: the manifest's path is the
 * manifest's alone, no resource's document (reading 146). A named href no entry holds is shredded
 * as nothing: the record's laws refuse it in the database (`entry-kind`). Each document's
 * references are then resolved as the import resolves them (`referenceRowsOf`), so the package
 * names every path the import writes a `ReferencePath` or a `TextReferencePath` of.
 *
 * {@link readPackage} judges no law: what it refuses is what the reader, the container and the codec
 * refuse, and every law is the database's, met when `importPackage` (`#pantry/import/package.ts`)
 * writes the package. Nothing here reaches the author login (`#pantry/qti/own-login.ts`), whose
 * workload grizzle builds when that module is evaluated.
 */
import { Array as Arr, Brand, Effect, Option, Order } from "effect";
import type { FileSystem, PlatformError } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import type { XmlDocument } from "@qti-pie/crust/tree.ts";
import { grammar, versions } from "#pantry/grammar/install.ts";
import {
  namedDocuments,
  referenceCensus,
  referenceRowsOf,
  rowsOf as packageRowsOf,
} from "#pantry/import/overlays/package.ts";
import { packageNameOf } from "#pantry/import/record.ts";
import { ruleOfError } from "#pantry/import/rules.ts";
import type { ImportRefused } from "#pantry/import/rules.ts";
import type { ListedDocument } from "#pantry/import/write.ts";
import { shredGrammarOf } from "#pantry/model/composed.ts";
import { shred, versionOf } from "#pantry/model/shred.ts";
import type { NodeId } from "#pantry/model/xdm.ts";
import { PackageReadError, readEntries } from "#pantry/package/read.ts";
import type { PackageFile } from "#pantry/package/read.ts";
import { recordOf } from "#pantry/package/record.ts";
import { cpNamespace } from "#pantry/vocab/namespaces.ts";
import { manifestPath } from "#pantry/vocab/terms/package.ts";

/**
 * A file's path from the package root, `/`-separated, as the reader names an entry
 * (`imsmanifest.xml`, `items/media/a b.png`).
 *
 * The brand is plate's `PackagePath` (`#plate/model/url.ts`), `Brand.Branded<string,
 * "PackagePath">`, stated here because pantry depends on no plate: one Effect brand of one key is
 * one type, so a path of a {@link QtiPackage} keys plate's `assets` as it is. plate's `isPackagePath`
 * holds a path to no empty first segment and no `.` or `..` segment, and every path of a package
 * the import accepted meets it: the reader refuses an absolute path and a `..` segment
 * (`#pantry/package/zip.ts` `unsafeEntryPath`), a resolved path holds no dot segment ("E1 derived",
 * `resolvedPathPattern` of `#pantry/qti/package.ts`), and every entry but the manifest is the
 * resolved path of a file the manifest lists ("File listed"). A zip may name an entry with a `.`
 * segment, which no href resolves to, so a package that holds one is refused there.
 */
export type PackagePath = Brand.Branded<string, "PackagePath">;

/**
 * Brand an entry's path or a resolved path as a {@link PackagePath}, with no check of its own: the
 * reader and the resolver give the path, and the database holds it ({@link PackagePath}).
 */
const packagePath = Brand.nominal<PackagePath>();

/**
 * A package as the import writes it: what {@link readPackage} read, before the database.
 *
 * - `name`: the last segment of the directory or zip file it was read from (`packageNameOf`), the
 *   name its `Package` row takes.
 * - `manifest`: the manifest, `imsmanifest.xml` at the package root, shredded, of the document type
 *   `manifest`.
 * - `documents`: every other document its resources name that an entry holds, one per path, in the
 *   manifest's order, each shredded once, of the type its resource names (readings 93 and 162).
 * - `files`: every entry, in listing order (sorted by path), each as a `File` whose `name` is its
 *   path and whose bytes are the entry's, read once: the bytes the import stores as the entry's
 *   `content`. Its `type` is empty, since the reader knows no media type; a package-media install's
 *   policy gives an extension's.
 * - `referenced`: every path a reference of a document resolves to in the package, the attributes of
 *   the reference census and the texts of the text census alike: exactly the paths of the
 *   `ReferencePath` and `TextReferencePath` rows the import writes.
 */
export interface QtiPackage {
  readonly documents: readonly ListedDocument[];
  readonly files: ReadonlyMap<PackagePath, File>;
  readonly manifest: ListedDocument;
  readonly name: string;
  readonly referenced: ReadonlySet<PackagePath>;
}

/**
 * The ids of a document's provisional rows, read only for what its rows name (the hrefs and types
 * the manifest's resources name, the paths its references resolve to) before the package's ids are
 * minted: one distinct uuid per number `flatten` gives, since the builder groups each attribute
 * under its node's id.
 *
 * @param index - The number of a node or an attribute.
 * @returns A uuid that spells the number.
 */
const provisionalIdOf = (index: number): NodeId =>
  `00000000-0000-4000-8000-${index.toString(16).padStart(12, "0")}`;

/**
 * Find the schema version a manifest declares: the text of the first `schemaversion` under its
 * first `metadata`, where its root is the content package's `manifest`.
 *
 * @param manifest - The manifest crust read.
 * @returns The version as written, none when the manifest declares none.
 */
export const declaredVersionOf = (manifest: XmlDocument): Option.Option<string> => {
  const { root } = manifest;
  if (root.namespace !== cpNamespace || root.local !== "manifest") {
    return Option.none();
  }

  const metadata = root.children.find(
    (child) => child.kind === "element" && child.local === "metadata",
  );
  const version =
    metadata?.kind === "element"
      ? metadata.children.find(
          (child) => child.kind === "element" && child.local === "schemaversion",
        )
      : undefined;

  return version?.kind === "element"
    ? Option.some(
        version.children.map((child) => (child.kind === "text" ? child.value : "")).join(""),
      )
    : Option.none();
};

/**
 * Read and shred one document of the package.
 *
 * @param file - Its entry.
 * @param version - The version the manifest declares.
 * @returns Its tree; the reader's or the codec's refusal.
 */
const shredFile = (file: PackageFile, version: (typeof versions)[number]) =>
  Effect.flatMap(readXml(file.bytes), (xml) => shred(xml, version, shredGrammarOf(grammar)));

/**
 * Choose the type a path's document is read as, of the types its resources name it under (spec
 * readings 93 and 162): the first, in the manifest's order, whose `RootOfType` pair holds the
 * root's kind, and the first of all where none does. Every other type's href then names no document
 * of its type, which "Document entry" refuses; and `RootOfType` refuses a root only where no type
 * its resources name bears it out, whatever order they are listed in. The sort is stable, so the
 * types the root bears out come first, each group in the manifest's order.
 *
 * @param types - The types, in the manifest's order.
 * @param rootKind - The kind of the document's root.
 * @returns The type.
 */
const documentTypeOf = <T extends string>(
  types: Arr.NonEmptyReadonlyArray<T>,
  rootKind: string,
): T =>
  Arr.headNonEmpty(
    Arr.sortWith(
      types,
      (type) => Option.isNone(grammar.package.rootOfType.lookup({ root: rootKind, type })),
      Order.Boolean,
    ),
  );

/**
 * Read the package at `dir` and list its documents, one per path: the manifest, and each other
 * document its resources name that an entry holds, in the manifest's order, each shredded once.
 *
 * @param dir - The package directory or `.zip` file.
 * @returns The entries, the manifest and the other documents; the reader's, the container's or
 *   the codec's refusal.
 */
const listDocuments = Effect.fn("import.listDocuments")(function* listDocuments(dir: string) {
  const entries = yield* readEntries(dir);
  const manifestEntry = entries.find(({ kind }) => kind === "manifest");
  if (manifestEntry === undefined) {
    return yield* new PackageReadError({ dir, path: manifestPath, rule: "manifest-root" });
  }

  const manifestXml = yield* readXml(manifestEntry.bytes);
  const version = yield* Effect.fromResult(versionOf(versions, declaredVersionOf(manifestXml)));
  const manifestTree = yield* shred(manifestXml, version, shredGrammarOf(grammar));
  const byPath = new Map(entries.map((entry) => [entry.path, entry] as const));
  const named = namedDocuments(
    packageRowsOf(manifestTree, { idOf: provisionalIdOf, package: provisionalIdOf(0) }),
  );
  // A path is one document, of one type (reading 93): the manifest's, `manifest`, read before any
  // resource names a path (reading 146), else the type its root bears out among those resources
  // name it under (reading 162). Another type's href, the manifest's path's included, then names
  // no document of its type, which "Document entry" refuses, and the document is read once and
  // judged where its sites place it.
  const pairs = [...named.values()];
  const manifest: ListedDocument = {
    documentType: "manifest",
    path: manifestEntry.path,
    tree: manifestTree,
  };
  const documents = new Map<string, ListedDocument>();
  for (const [at, { path, type }] of pairs.entries()) {
    const entry = byPath.get(path);
    if (entry !== undefined && path !== manifest.path && !documents.has(path)) {
      const tree = yield* shredFile(entry, version);
      const others = pairs.slice(at + 1).flatMap((pair) => (pair.path === path ? [pair.type] : []));
      documents.set(path, {
        documentType: documentTypeOf([type, ...others], tree.root.kind),
        path,
        tree,
      });
    }
  }

  return { documents: [...documents.values()], entries, manifest };
});

/**
 * Whether an error is a refusal of the package, as opposed to the platform's failure to read it.
 *
 * @param error - The error.
 * @returns Whether it is a `ReadRefusal` of `#pantry/import/refusal.ts`.
 */
const isReadRefusal = <E extends { readonly _tag: string }>(
  error: E,
): error is Exclude<E, PlatformError.PlatformError> => error._tag !== "PlatformError";

/**
 * Resolve every reference of a package's documents as the import resolves it
 * (`referenceRowsOf`, the one builder of the `ReferencePath` and `TextReferencePath` rows), and
 * keep the paths of those that resolve in the package. A resolved path names no id, so the
 * provisional ids give the import's paths.
 *
 * @param documents - The package's documents, the manifest among them.
 * @returns Every path a reference resolves to, each once.
 */
const referencedOf = (documents: readonly ListedDocument[]): ReadonlySet<PackagePath> =>
  new Set(
    documents.flatMap(({ path, tree }) => {
      const rows = referenceRowsOf(
        tree,
        { idOf: provisionalIdOf, package: provisionalIdOf(0), path },
        referenceCensus,
      );

      return [...rows.ReferencePath.values(), ...rows.TextReferencePath.values()].map((row) =>
        packagePath(row.path),
      );
    }),
  );

/**
 * Read the package at `dir` as the import writes it: every entry read once, the manifest and each
 * document its resources name shredded once, and every reference resolved ({@link QtiPackage}).
 * `importPackage` (`#pantry/import/package.ts`) writes the value it returns, and reads nothing of
 * the directory again.
 *
 * @param dir - The package directory or `.zip` file.
 * @returns The package. Fails with `ImportRefused` naming the rule the reader, the container or the
 *   codec refused the package under, and with the platform's error when the package cannot be read.
 */
export const readPackage = Effect.fn("import.readPackage")(function* readPackage(
  dir: string,
): Effect.fn.Return<
  QtiPackage,
  ImportRefused | PlatformError.PlatformError,
  FileSystem.FileSystem
> {
  const { documents, entries, manifest } = yield* listDocuments(dir).pipe(
    Effect.catchIf(isReadRefusal, (refusal) => Effect.fail(ruleOfError(refusal))),
  );
  const referenced = referencedOf([manifest, ...documents]);
  const files = new Map(
    recordOf(entries).map(
      ({ content, path }) => [packagePath(path), new File([content], path)] as const,
    ),
  );

  yield* Effect.annotateCurrentSpan({
    documents: documents.length + 1,
    entries: files.size,
    referenced: referenced.size,
  });

  return { documents, files, manifest, name: packageNameOf(dir), referenced };
});

/**
 * The import's parse, before any id is minted: a package's entries read once, the manifest and each
 * document it names shredded once, and every reference resolved, into one {@link ParsedPackage}
 * (plan W5, Q5.15; the W5 amendment's C19).
 *
 * The package is read whole (`readPackage` of `#pantry/package/read.ts`), its manifest is decoded
 * and its schema version read, and the manifest is shredded. The documents it names are the
 * (href, type) pairs of its resources whose type `RootOfType` maps (spec reading 93,
 * `namedDocuments`), and each path one names that an entry holds is shredded once, in the version
 * the manifest declares: the manifest's path is the manifest's alone, no resource's document
 * (reading 146). A named href no entry holds is shredded as nothing: the record's laws refuse it in
 * the database (`entry-kind`). Each document's references are then resolved as the import resolves
 * them (`referenceRowsOf`), so the parsed package names every path the import writes a
 * `ReferencePath` or a `TextReferencePath` of.
 *
 * Every {@link PackageSource} becomes a parsed package here ({@link parsedOf}), and a parsed
 * package becomes itself, so the import (`#pantry/import/package.ts`) and the dry run
 * (`#pantry/import/preview.ts`) build from one representation whatever they were given. The parse
 * judges no law: what it refuses is what the reader, the container and the codec refuse. Nothing
 * here reaches the author login (`#pantry/qti/logins.ts` `authorLogin`), whose workload grizzle
 * builds on its first call.
 */
import { Array as Arr, Data, Effect, Option, Order } from "effect";
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
import { PackageReadError, readPackage, sourceNameOf } from "#pantry/package/read.ts";
import type { EntrySource, PackageFile } from "#pantry/package/read.ts";
import { recordOf } from "#pantry/package/record.ts";
import { cpNamespace } from "#pantry/vocab/namespaces.ts";
import { manifestPath } from "#pantry/vocab/terms/package.ts";

/**
 * A package read and parsed once, as the import writes it: every entry's bytes, every document it
 * writes a `Document` row of, and every path a reference of those documents resolves to.
 *
 * An app parses a package with `parsePackage` (`#pantry/api/import.ts`), reads its files, and
 * passes the same value to `importPackage` or `previewPackage`, which read nothing of the package
 * again, so the bytes an app reads are the bytes the import stores. Only the parse constructs one,
 * so its documents are always the shreds of its files.
 *
 * - `name`: the name its `Package` row takes, the last segment of the path it was read from or the
 *   archive's name (`packageNameOf`).
 * - `files`: every entry, by its path from the package root (`items/media/a b.png`), in listing
 *   order, sorted by path. Each is a `File` whose `name` is that path and whose bytes are the
 *   entry's, the bytes the import stores as the entry's `content`, and whose `type` is empty: the
 *   reader knows no media type. A `File` cannot change its bytes, so the documents stay the shreds
 *   of the files.
 * - `documents`: the manifest, `imsmanifest.xml`, then every other document its resources name that
 *   an entry holds, one per path, in the manifest's order, each shredded once, of the type its
 *   resources name (readings 93 and 162). A document's `path` and `documentType` are what its
 *   `Document` row holds; its `tree` is internal and changes with pantry.
 * - `referenced`: every path a reference of a document resolves to in the package, the attributes of
 *   the reference census and the texts of the text census alike: exactly the `path`s of the
 *   `ReferencePath` and `TextReferencePath` rows the import writes. A path no entry holds is one of
 *   them too, and the import refuses the package for it.
 */
export class ParsedPackage extends Data.TaggedClass("ParsedPackage")<{
  readonly documents: readonly ListedDocument[];
  readonly files: ReadonlyMap<string, File>;
  readonly name: string;
  readonly referenced: ReadonlySet<string>;
}> {}

/**
 * A package to import or preview: a directory or a `.zip` file by its path, a zip archive's bytes
 * under the archive's name ({@link EntrySource}), or a {@link ParsedPackage}, which every other
 * kind is parsed into and which is not read again.
 */
export type PackageSource = EntrySource | ParsedPackage;

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
 * Read the package at `source` and list its documents, one per path: the manifest, then each other
 * document its resources name that an entry holds, in the manifest's order, each shredded once.
 *
 * @param source - The package directory, `.zip` file or zip archive's bytes.
 * @returns The entries and the documents; the reader's, the container's or the codec's refusal.
 */
const listDocuments = Effect.fn("import.listDocuments")(function* listDocuments(
  source: EntrySource,
) {
  const files = yield* readPackage(source);
  const manifest = files.find(({ kind }) => kind === "manifest");
  if (manifest === undefined) {
    return yield* new PackageReadError({
      dir: sourceNameOf(source),
      path: manifestPath,
      rule: "manifest-root",
    });
  }

  const manifestXml = yield* readXml(manifest.bytes);
  const version = yield* Effect.fromResult(versionOf(versions, declaredVersionOf(manifestXml)));
  const manifestTree = yield* shred(manifestXml, version, shredGrammarOf(grammar));
  const byPath = new Map(files.map((file) => [file.path, file] as const));
  const named = namedDocuments(
    packageRowsOf(manifestTree, { idOf: provisionalIdOf, package: provisionalIdOf(0) }),
  );
  // A path is one document, of one type (reading 93): the manifest's, `manifest`, read before any
  // resource names a path (reading 146), else the type its root bears out among those resources
  // name it under (reading 162). Another type's href, the manifest's path's included, then names
  // no document of its type, which "Document entry" refuses, and the document is read once and
  // judged where its sites place it.
  const pairs = [...named.values()];
  const documents = new Map<string, ListedDocument>([
    [manifest.path, { documentType: "manifest", path: manifest.path, tree: manifestTree }],
  ]);
  for (const [at, { path, type }] of pairs.entries()) {
    const file = byPath.get(path);
    if (file !== undefined && !documents.has(path)) {
      const tree = yield* shredFile(file, version);
      const others = pairs.slice(at + 1).flatMap((pair) => (pair.path === path ? [pair.type] : []));
      documents.set(path, {
        documentType: documentTypeOf([type, ...others], tree.root.kind),
        path,
        tree,
      });
    }
  }

  return { documents: [...documents.values()], files };
});

/**
 * Whether an error is a refusal of the package, as opposed to the platform's failure to read it.
 *
 * @param error - The error.
 * @returns Whether it is a `ReadRefusal` of `#pantry/import/rules.ts`.
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
const referencedOf = (documents: readonly ListedDocument[]): ReadonlySet<string> =>
  new Set(
    documents.flatMap(({ path, tree }) => {
      const rows = referenceRowsOf(
        tree,
        { idOf: provisionalIdOf, package: provisionalIdOf(0), path },
        referenceCensus,
      );

      return [...rows.ReferencePath.values(), ...rows.TextReferencePath.values()].map(
        (row) => row.path,
      );
    }),
  );

/**
 * Parse a package once into a {@link ParsedPackage}: a parsed package is itself, read again from
 * nothing; any other source has every entry read once, the manifest and each document its
 * resources name shredded once, and every reference resolved.
 *
 * @param source - The package directory, `.zip` file or zip archive's bytes, or a package already
 *   parsed. The parsed package's name is the last segment of its path or its archive's name.
 * @returns The parsed package. Fails with `ImportRefused` naming the rule the reader, the container
 *   or the codec refused the package under, and with the platform's error when the package cannot
 *   be read.
 */
export const parsedOf = Effect.fn("import.parsedOf")(function* parsedOf(
  source: PackageSource,
): Effect.fn.Return<
  ParsedPackage,
  ImportRefused | PlatformError.PlatformError,
  FileSystem.FileSystem
> {
  if (source instanceof ParsedPackage) {
    return source;
  }

  const { documents, files } = yield* listDocuments(source).pipe(
    Effect.catchIf(isReadRefusal, (refusal) => Effect.fail(ruleOfError(refusal))),
  );
  const referenced = referencedOf(documents);

  yield* Effect.annotateCurrentSpan({
    documents: documents.length,
    entries: files.length,
    referenced: referenced.size,
    source: sourceNameOf(source),
  });

  return new ParsedPackage({
    documents,
    files: new Map(
      recordOf(files).map(({ content, path }) => [path, new File([content], path)] as const),
    ),
    name: packageNameOf(sourceNameOf(source)),
    referenced,
  });
});

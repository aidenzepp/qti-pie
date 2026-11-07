/**
 * The import's steps before the database: read the package once, shred each document it names,
 * mint the ids, and build every row (plan W5, Q5.15; the W5 amendment's C19).
 *
 * The package is read whole (`readPackage`), its manifest is decoded and its schema version read,
 * and the manifest is shredded. The documents it names are the (href, type) pairs of its resources
 * whose type `RootOfType` maps (spec reading 93, `namedDocuments`), and each path one names that an
 * entry holds is shredded once, in the version the manifest declares: the manifest's path is the
 * manifest's alone, no resource's document (reading 146). A named href no entry holds is shredded
 * as nothing: the record's laws refuse it in the database (`entry-kind`). Then one id is minted per
 * package, node and attribute ({@link nodeIdsOf}), and the rows are built: each document's tree,
 * its document layer's flat rows, every overlay's, and the package's record.
 *
 * Both the import (`#pantry/import/package.ts`) and the dry run (`#pantry/import/preview.ts`) read
 * through {@link readProgram}, so a dry run reads exactly what an import writes. Nothing here
 * reaches the author login (`#pantry/qti/logins.ts`), whose workload grizzle builds when that
 * module is evaluated.
 */
import type { Uuid } from "@bjornpagen/grizzle";
import { Effect, Option } from "effect";
import type { FileSystem, PlatformError } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import type { XmlDocument } from "@qti-pie/crust/tree.ts";
import { grammar, versions } from "#pantry/grammar/install.ts";
import { overlayRowsOf, unionsOf } from "#pantry/import/overlays/index.ts";
import { namedDocuments, rowsOf as packageRowsOf } from "#pantry/import/overlays/package.ts";
import type { InstanceMember } from "#pantry/import/overlays/tests.ts";
import { packageNameOf, packageRecordOf } from "#pantry/import/record.ts";
import { dataSsmlFaultIn } from "#pantry/vocab/data-ssml.ts";
import { ImportRefused, ruleOfError } from "#pantry/import/refusal.ts";
import { documentLayerNames } from "#pantry/import/roster.ts";
import { documentRowsOf, nodeIdsOf, rootInsertOf } from "#pantry/import/write.ts";
import type {
  DocumentLayerRows,
  ListedDocument,
  NodeIds,
  NodeMember,
  NodeRoot,
  PackageInputs,
} from "#pantry/import/write.ts";
import { shredGrammarOf } from "#pantry/model/composed.ts";
import { readerOrigin } from "#pantry/package/refusal-origin.ts";
import { shred, versionOf } from "#pantry/model/shred.ts";
import type { NodeId } from "#pantry/model/xdm.ts";
import { PackageReadError, readPackage } from "#pantry/package/read.ts";
import type { PackageFile } from "#pantry/package/read.ts";
import { manifestPath } from "#pantry/qti/package.ts";
import { cpNamespace } from "#pantry/vocab/namespaces.ts";

/**
 * One document of the package as the import writes it: as listed, and under its ids.
 */
export interface ProgramDocument {
  readonly ids: NodeIds;
  readonly listed: ListedDocument;
}

/**
 * Everything one import writes, before the database: the package's entries as read, its documents
 * shredded and listed under their ids, and every input of its ChangeSet.
 */
export interface ImportProgram {
  readonly documents: readonly ProgramDocument[];
  readonly files: readonly PackageFile[];
  readonly inputs: PackageInputs;
  readonly packageId: Uuid;
}

/**
 * The ids of the manifest's provisional rows, read only for the hrefs and types its resources name
 * before the package's ids are minted: one distinct uuid per number `flatten` gives, since the
 * builder groups each attribute under its node's id.
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
 * Read and shred one document of the package, and judge its `data-ssml` values.
 *
 * A `data-ssml` is judged here, not by the database: the database holds it as text and does not
 * re-prove its form (spec reading R7-a), so a value Data-SSML 1.0 does not admit is refused under
 * `attribute-lexical`, the rule of a value its domain refuses.
 *
 * @param file - Its entry.
 * @param version - The version the manifest declares.
 * @returns Its tree; the reader's, the codec's or the `data-ssml` refusal.
 */
const shredFile = (file: PackageFile, version: (typeof versions)[number]) =>
  Effect.flatMap(
    Effect.flatMap(readXml(file.bytes), (xml) => shred(xml, version, shredGrammarOf(grammar))),
    (tree) => {
      const fault = dataSsmlFaultIn(tree);

      return fault === undefined
        ? Effect.succeed(tree)
        : Effect.fail(
            new ImportRefused({
              detail: `${file.path} at ${fault.path}: ${fault.detail}`,
              origin: readerOrigin,
              rule: "attribute-lexical",
            }),
          );
    },
  );

/**
 * Read the package at `dir` and list its documents, one per path: the manifest, then each other
 * document its resources name that an entry holds, in the manifest's order, each shredded once.
 *
 * @param dir - The package directory or `.zip` file.
 * @returns The entries and the documents; the reader's, the container's or the codec's refusal.
 */
const listDocuments = Effect.fn("import.listDocuments")(function* listDocuments(dir: string) {
  const files = yield* readPackage(dir);
  const manifest = files.find(({ kind }) => kind === "manifest");
  if (manifest === undefined) {
    return yield* new PackageReadError({ dir, path: manifestPath, rule: "manifest-root" });
  }

  const manifestXml = yield* readXml(manifest.bytes);
  const version = yield* Effect.fromResult(versionOf(versions, declaredVersionOf(manifestXml)));
  const manifestTree = yield* shred(manifestXml, version, shredGrammarOf(grammar));
  const byPath = new Map(files.map((file) => [file.path, file] as const));
  const named = namedDocuments(
    packageRowsOf(manifestTree, { idOf: provisionalIdOf, package: provisionalIdOf(0) }),
  );
  // A path is one document, of one type (reading 93): the manifest's, `none`, read before any
  // resource names a path (reading 146), else the first type a resource names it under. A second
  // type's href, the manifest's path's included, then names no document of its type, which
  // "Document entry" refuses alone, and the document is read once and judged where its sites
  // place it.
  const documents = new Map<string, ListedDocument>([
    [manifest.path, { path: manifest.path, resourceType: "none", tree: manifestTree }],
  ]);
  for (const { path, type } of named.values()) {
    const file = byPath.get(path);
    if (file !== undefined && !documents.has(path)) {
      documents.set(path, { path, resourceType: type, tree: yield* shredFile(file, version) });
    }
  }

  return { documents: [...documents.values()], files };
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
 * Read the package at `dir` as an import writes it: its entries, its documents shredded, their ids
 * minted, and every input of its ChangeSet built, each a keyed set.
 *
 * A key two builders give two different rows is a defect of the builders, and dies as the
 * `OverlayConflict` that names it.
 *
 * @param dir - The package directory or `.zip` file.
 * @param mint - Draws each fresh uuid, for tests. Defaults to `crypto.randomUUID`.
 * @returns The program. Fails with `ImportRefused` naming the rule the reader, the container or the
 *   codec refused the package under, and with the platform's error when the package cannot be read.
 */
export const readProgram = Effect.fn("import.readProgram")(function* readProgram(
  dir: string,
  mint?: () => NodeId,
): Effect.fn.Return<
  ImportProgram,
  ImportRefused | PlatformError.PlatformError,
  FileSystem.FileSystem
> {
  const { documents, files } = yield* listDocuments(dir).pipe(
    Effect.catchIf(isReadRefusal, (refusal) => Effect.fail(ruleOfError(refusal))),
  );
  const draw = mint ?? ((): NodeId => crypto.randomUUID());
  const ids = nodeIdsOf(
    documents,
    files.map(({ path }) => path),
    draw,
  );
  const placed = documents.flatMap((listed, at) => {
    const held = ids.documents[at];

    return held === undefined ? [] : [{ ids: held, listed }];
  });
  const overlays = yield* Effect.orDie(Effect.fromResult(overlayRowsOf(placed, draw)));
  const layers = placed.map(({ ids: held, listed }) => documentRowsOf(listed, held));
  const layer = yield* Effect.orDie(
    Effect.fromResult(unionsOf<DocumentLayerRows>(documentLayerNames, layers)),
  );
  const roots = new Map<string, NodeRoot>(
    placed.map(({ ids: held, listed }) => {
      const root = rootInsertOf(listed.tree, held);

      return [root.id, root] as const;
    }),
  );
  const record = packageRecordOf({ files, id: ids.package, name: packageNameOf(dir) });

  yield* Effect.annotateCurrentSpan({ documents: placed.length, entries: files.length });

  return {
    documents: placed,
    files,
    inputs: {
      ...overlays,
      ...layer,
      Node: roots,
      Package: new Map([[record.id, record]]),
    },
    packageId: ids.package,
  };
});

/**
 * Count the rows a program writes, relation by relation, each nested member under its own
 * relation: a tree's nodes, attributes, declarations and their families, an attribute's and a
 * text's typed double, an identity text's IDREF tokens, a cell's `headers` tokens, a table cell's
 * leaves, a `tolerance`'s values, an assembly's instances, a record's entries.
 *
 * @param program - The program.
 * @returns Each relation's number of rows, zero for a relation whose keyed set is empty.
 */
export const rowCountsOf = (program: ImportProgram): ReadonlyMap<string, number> => {
  const counts = new Map<string, number>();
  const add = (relation: string, n: number): void => {
    counts.set(relation, (counts.get(relation) ?? 0) + n);
  };
  const { Instance, Node, Package, ...flat } = program.inputs;

  for (const [relation, rows] of Object.entries(flat)) {
    add(relation, rows.size);
  }

  for (const text of flat.IdentityText.values()) {
    add("TextIdref", text.idrefs.length);
  }

  for (const headers of flat.CellHeaders.values()) {
    add("HeaderToken", headers.tokens.length);
  }

  for (const cell of flat.MathCell.values()) {
    add("CellLeaf", cell.leaves.length);
  }

  for (const tolerance of flat.Tolerance.values()) {
    add("ToleranceToken", tolerance.tokens.length);
  }

  for (const reference of flat.AssembledReference.values()) {
    add("ReferenceSegment", reference.segments.length);
  }

  const instances: InstanceMember[] = [...Instance.values()];
  for (let instance = instances.pop(); instance !== undefined; instance = instances.pop()) {
    add("Instance", 1);
    instances.push(...instance.children);
  }

  for (const record of Package.values()) {
    add("Package", 1);
    add("Entry", record.entries.length);
  }

  const stack: NodeMember[] = [...Node.values()];
  for (let node = stack.pop(); node !== undefined; node = stack.pop()) {
    add("Node", 1);
    add("Namespace", node.namespaces.length);
    add("TextDoubleValue", node.doubleValue.length);
    add("Attribute", node.attributes.length);
    for (const attribute of node.attributes) {
      add("AttributeEntity", attribute.entities.length);
      add("DoubleValue", attribute.doubleValue.length);
      add("Idref", attribute.idrefs.length);
      add("OpenAttributeName", attribute.openName.length);
    }

    stack.push(...node.children);
  }

  return counts;
};

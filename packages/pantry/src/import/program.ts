/**
 * The import's steps after its parse and before the database: mint the ids of a parsed package
 * (`#pantry/import/parsed.ts`) and build every row it writes (plan W5, Q5.15; the W5 amendment's
 * C19).
 *
 * Every source is parsed first (`parsedOf`), and a parsed package is not parsed again. Then one id
 * is minted per package, node and attribute ({@link nodeIdsOf}), and the rows are built: each
 * document's tree, its document layer's flat rows, every overlay's, and the package's record, each
 * entry's content the bytes the parsed package holds.
 *
 * Both the import (`#pantry/import/package.ts`) and the dry run (`#pantry/import/preview.ts`) build
 * through {@link readProgram}, so a dry run builds exactly what an import writes. Nothing here
 * reaches the author login (`#pantry/qti/logins.ts` `authorLogin`), whose workload grizzle builds
 * on its first call.
 */
import type { Uuid } from "@bjornpagen/grizzle";
import { Effect } from "effect";
import type { FileSystem, PlatformError } from "effect";
import { overlayRowsOf, unionsOf } from "#pantry/import/overlays/index.ts";
import type { InstanceMember } from "#pantry/import/overlays/tests.ts";
import { parsedOf } from "#pantry/import/parsed.ts";
import type { PackageSource } from "#pantry/import/parsed.ts";
import { packageRecordOf } from "#pantry/import/record.ts";
import { documentLayer } from "#pantry/import/roster.ts";
import type { ImportRefused } from "#pantry/import/rules.ts";
import { documentRowsOf, nodeIdsOf, rootInsertOf } from "#pantry/import/write.ts";
import type { NodeMember, NodeRoot, PackageInputs, PlacedDocument } from "#pantry/import/write.ts";
import type { NodeId } from "#pantry/model/xdm.ts";

/**
 * One document of the package as the import writes it: as listed, and under its ids.
 */
export type ProgramDocument = PlacedDocument;

/**
 * Everything one import writes, before the database: the package's files as parsed, its documents
 * listed under their ids, and every input of its ChangeSet.
 */
export interface ImportProgram {
  readonly documents: readonly ProgramDocument[];
  readonly files: ReadonlyMap<string, File>;
  readonly inputs: PackageInputs;
  readonly packageId: Uuid;
}

/**
 * Build what an import of the package at `source` writes: the package parsed ({@link parsedOf}),
 * unless it is a parsed package already, its ids minted, and every input of its ChangeSet built,
 * each a keyed set. Each call mints its own ids, so one parsed package built twice is two
 * programs, every id fresh.
 *
 * A key two builders give two different rows is a defect of the builders, and dies as the
 * `OverlayConflict` that names it.
 *
 * @param source - The package directory, `.zip` file or zip archive's bytes, or a parsed package,
 *   which is not read again.
 * @param mint - Draws each fresh uuid. Defaults to `crypto.randomUUID`; a test passes its own.
 * @returns The program. Fails with `ImportRefused` naming the rule the reader, the container or the
 *   codec refused the package under, and with the platform's error when the package cannot be read.
 */
export const readProgram = Effect.fn("import.readProgram")(function* readProgram(
  source: PackageSource,
  mint: () => NodeId = () => crypto.randomUUID(),
): Effect.fn.Return<
  ImportProgram,
  ImportRefused | PlatformError.PlatformError,
  FileSystem.FileSystem
> {
  const { documents, files, name } = yield* parsedOf(source);
  const ids = nodeIdsOf(documents, files.keys(), mint);
  const placed = ids.documents;
  const overlays = yield* Effect.orDie(Effect.fromResult(overlayRowsOf(placed, mint)));
  const layers = placed.map(({ ids: held, listed }) => documentRowsOf(listed, held));
  const layer = yield* Effect.orDie(Effect.fromResult(unionsOf(documentLayer, layers)));
  const roots = new Map<string, NodeRoot>(
    placed.map(({ ids: held, listed }) => {
      const root = rootInsertOf(listed.tree, held);

      return [root.id, root] as const;
    }),
  );
  // A `File` gives its bytes only as a promise, and one held in memory never rejects.
  const contents = yield* Effect.all(
    [...files].map(([path, file]) =>
      Effect.map(
        Effect.promise(() => file.bytes()),
        (bytes) => ({ bytes, path }),
      ),
    ),
  );
  const record = packageRecordOf({ files: contents, id: ids.package, name });

  yield* Effect.annotateCurrentSpan({ documents: placed.length, entries: files.size, name });

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
 * relation: a tree's nodes, attributes, declarations and their families, an identity text's IDREF
 * tokens, a cell's `headers` tokens, a table cell's leaves, a `tolerance`'s values, an assembly's
 * instances, a record's entries.
 *
 * @param program - The program.
 * @returns Each relation's number of rows, zero for a relation whose keyed set is empty.
 */
export const rowCountsOf = (program: ImportProgram): ReadonlyMap<string, number> => {
  const counted: (readonly [relation: string, n: number])[] = [];
  const add = (relation: string, n: number): void => {
    counted.push([relation, n]);
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
    add("Attribute", node.attributes.length);
    for (const attribute of node.attributes) {
      add("AttributeEntity", attribute.entities.length);
      add("Idref", attribute.idrefs.length);
      add("OpenAttributeName", attribute.openName.length);
    }

    stack.push(...node.children);
  }

  return new Map(
    [...Map.groupBy(counted, ([relation]) => relation)].map(
      ([relation, ns]) => [relation, ns.reduce((sum, [, n]) => sum + n, 0)] as const,
    ),
  );
};

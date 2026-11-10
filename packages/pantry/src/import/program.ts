/**
 * The import's steps after its read and before the database: mint the ids of a package
 * `readPackage` read (`#pantry/import/read.ts`) and build every row it writes (plan W5, Q5.15; the
 * W5 amendment's C19).
 *
 * One id is minted per package, node and attribute ({@link nodeIdsOf}), and the rows are built from
 * the documents the read shredded: each document's tree, its document layer's flat rows, every
 * overlay's, and the package's record, each entry's content the bytes the read holds. Nothing is
 * read from the package's directory again.
 *
 * The import (`#pantry/import/package.ts`) and the dry run (`#pantry/import/preview.ts`) build
 * through {@link programOf}, so a dry run builds exactly what an import writes. Nothing here
 * reaches the author login (`#pantry/qti/own-login.ts`), whose workload grizzle builds when that
 * module is evaluated.
 */
import type { Uuid } from "@bjornpagen/grizzle";
import { Effect } from "effect";
import type { FileSystem, PlatformError } from "effect";
import { overlayRowsOf, unionsOf } from "#pantry/import/overlays/index.ts";
import type { InstanceMember } from "#pantry/import/overlays/tests.ts";
import { readPackage } from "#pantry/import/read.ts";
import type { QtiPackage } from "#pantry/import/read.ts";
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
 * Everything one import writes, before the database: the package's documents listed under their
 * ids, and every input of its ChangeSet.
 */
export interface ImportProgram {
  readonly documents: readonly ProgramDocument[];
  readonly inputs: PackageInputs;
  readonly packageId: Uuid;
}

/**
 * Build what an import of a package writes: its ids minted, the manifest first and then each other
 * document, and every input of its ChangeSet built, each a keyed set. Each call mints its own ids,
 * so one package built twice is two programs, every id fresh.
 *
 * A key two builders give two different rows is a defect of the builders, and dies as the
 * `OverlayConflict` that names it.
 *
 * @param pkg - The package, as `readPackage` read it.
 * @param mint - Draws each fresh uuid. Defaults to `crypto.randomUUID`; a test passes its own.
 * @returns The program.
 */
export const programOf = Effect.fn("import.programOf")(function* programOf(
  pkg: QtiPackage,
  mint: () => NodeId = () => crypto.randomUUID(),
): Effect.fn.Return<ImportProgram> {
  const ids = nodeIdsOf([pkg.manifest, ...pkg.documents], pkg.files.keys(), mint);
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
  // A `File` holds its bytes in a Blob, which gives them only as a promise; one held in memory
  // never rejects.
  const files = yield* Effect.all(
    [...pkg.files].map(([path, file]) =>
      Effect.map(
        Effect.promise(() => file.bytes()),
        (bytes) => ({ bytes, path }),
      ),
    ),
  );
  const record = packageRecordOf({ files, id: ids.package, name: pkg.name });

  yield* Effect.annotateCurrentSpan({ documents: placed.length, entries: files.length });

  return {
    documents: placed,
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
 * Read the package at `dir` and build what an import of it writes: `readPackage`, then
 * {@link programOf}. The dry run and the tests that judge the import's rows read a package this way.
 *
 * @param dir - The package directory or `.zip` file.
 * @param mint - Draws each fresh uuid. Defaults to `crypto.randomUUID`; a test passes its own.
 * @returns The program. Fails with `ImportRefused` naming the rule the reader, the container or the
 *   codec refused the package under, and with the platform's error when the package cannot be read.
 */
export const readProgram = Effect.fn("import.readProgram")(function* readProgram(
  dir: string,
  mint: () => NodeId = () => crypto.randomUUID(),
): Effect.fn.Return<
  ImportProgram,
  ImportRefused | PlatformError.PlatformError,
  FileSystem.FileSystem
> {
  return yield* programOf(yield* readPackage(dir), mint);
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

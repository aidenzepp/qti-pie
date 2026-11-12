/**
 * The import's steps after its read and before the database: place each document of a package
 * `readPackage` read (`#pantry/import/read.ts`) and build every row it writes (plan W5, Q5.15; the
 * W5 amendment's C19).
 *
 * Nothing is minted: every row is keyed by the package's own identity, its manifest identifier,
 * each document's path and each node's position in its document. Each document is flattened and
 * folded once ({@link nodeIdsOf}); the rows are built from those views: each document's tree, its
 * document layer's flat rows, every overlay's, and the package's record, each entry's content the
 * bytes the read holds. Nothing is read from the package's directory again, and one package built
 * twice is one set of rows.
 *
 * {@link importRowsOf} gives an application the rows to write with its own grizzle `Db`; the
 * import (`#pantry/import/package.ts`) writes them through it, and the dry run
 * (`#pantry/import/preview.ts`) counts them, both through {@link programOf}, so a dry run builds
 * exactly what an import writes. Nothing here reaches `Qti` or the author login
 * (`#pantry/qti/schema.ts`, `#pantry/qti/logins.ts`), which are built when their modules are
 * evaluated.
 */
import { Effect } from "effect";
import type { FileSystem, PlatformError } from "effect";
import { keyTextOf } from "#pantry/import/key-text.ts";
import { overlayRowsOf, unionsOf } from "#pantry/import/overlays/index.ts";
import { readPackage } from "#pantry/import/read.ts";
import type { QtiPackage } from "#pantry/import/read.ts";
import { packageRecordOf } from "#pantry/import/record.ts";
import { documentLayer } from "#pantry/import/roster.ts";
import type { ImportRefused } from "#pantry/import/rules.ts";
import { documentRowsOf, nodeIdsOf, packageFactsOf, rootInsertOf } from "#pantry/import/write.ts";
import type { NodeRoot, PackageInputs, PlacedDocument } from "#pantry/import/write.ts";

/**
 * One document of the package as the import writes it: as listed, where it stands in its package,
 * and its view.
 */
export type ProgramDocument = PlacedDocument;

/**
 * Everything one import writes, before the database: the package's documents, each where it stands
 * in its package, every input of its ChangeSet, and the package's manifest identifier, the key
 * every row holds.
 */
export interface ImportProgram {
  readonly documents: readonly ProgramDocument[];
  readonly inputs: PackageInputs;
  readonly package: QtiPackage["identifier"];
}

/**
 * Build what an import of a package writes: the manifest first and then each other document placed
 * in the package, and every input of its ChangeSet built, each a keyed set. It is deterministic:
 * one package built twice is one program.
 *
 * A key two builders give two different rows is a defect of the builders, and dies as the
 * `OverlayConflict` that names it.
 *
 * @param pkg - The package, as `readPackage` read it.
 * @returns The program.
 */
export const programOf = Effect.fn("import.programOf")(function* programOf(
  pkg: QtiPackage,
): Effect.fn.Return<ImportProgram> {
  const placed = nodeIdsOf(pkg.identifier, [pkg.manifest, ...pkg.documents], pkg.files.keys());
  const overlays = yield* Effect.orDie(Effect.fromResult(overlayRowsOf(placed)));
  const layers = placed.map(documentRowsOf);
  const layer = yield* Effect.orDie(Effect.fromResult(unionsOf(documentLayer, layers)));
  const roots = new Map<string, NodeRoot>(
    placed.map(
      ({ ids, view }) => [keyTextOf(ids.package, ids.path), rootInsertOf(view, ids)] as const,
    ),
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
  const record = packageRecordOf({ files, identifier: pkg.identifier });

  yield* Effect.annotateCurrentSpan({ documents: placed.length, entries: files.length });

  return {
    documents: placed,
    inputs: {
      ...overlays,
      ...layer,
      Entry: record.entries,
      Node: roots,
      Package: new Map([[keyTextOf(pkg.identifier), record.package]]),
    },
    package: pkg.identifier,
  };
});

/**
 * The rows one package is written as, in the shape the import's write program takes them
 * (`importWrite` of `#pantry/qti/logins.ts`): `insert`, one array of rows per relation an import
 * writes, and `package`, the manifest identifier its `Package` row is keyed by.
 */
export interface ImportRows {
  readonly insert: ReturnType<typeof packageFactsOf>;
  readonly package: QtiPackage["identifier"];
}

/**
 * Build the rows a package `readPackage` read is written as ({@link programOf}), for an application
 * to write with its own grizzle `Db`, in its own transaction:
 *
 * ```ts
 * const rows = yield * importRowsOf(pkg);
 * const outcome = yield * db.workload.importWrite.apply({ insert: rows.insert }, {});
 * ```
 *
 * It opens no database and judges no law: every law is the database's, and a refusal is grizzle's
 * `invariant-rejected` outcome, whose laws the law table names (`lawNameOf` and `rulesOf` of
 * `#pantry/import/refusal.ts`). It mints nothing, so one package built twice is the same rows, and
 * written twice is grizzle's `no-change`.
 *
 * @param pkg - The package, as `readPackage` read it.
 * @returns The rows and the package's manifest identifier.
 */
export const importRowsOf = Effect.fn("import.importRowsOf")(function* importRowsOf(
  pkg: QtiPackage,
): Effect.fn.Return<ImportRows> {
  const program = yield* programOf(pkg);

  return { insert: packageFactsOf(program.inputs), package: program.package };
});

/**
 * Read the package at `dir` and build what an import of it writes: `readPackage`, then
 * {@link programOf}. The dry run and the tests that judge the import's rows read a package this way.
 *
 * @param dir - The package directory or `.zip` file.
 * @returns The program. Fails with `ImportRefused` naming the rule the reader, the container, the
 *   codec or the manifest identifier refused the package under, and with the platform's error when
 *   the package cannot be read.
 */
export const readProgram = Effect.fn("import.readProgram")(function* readProgram(
  dir: string,
): Effect.fn.Return<
  ImportProgram,
  ImportRefused | PlatformError.PlatformError,
  FileSystem.FileSystem
> {
  return yield* programOf(yield* readPackage(dir));
});

/**
 * A tree's row as an insert nests it: its children at its count field `children`.
 */
interface Nested {
  readonly children: readonly Nested[];
}

/**
 * Count the rows of trees as their inserts nest them: each root and every row below it.
 *
 * @param roots - The trees' roots.
 * @returns The number of rows.
 */
const treeSizeOf = (roots: Iterable<Nested>): number => {
  let size = 0;
  const stack = [...roots];
  for (let row = stack.pop(); row !== undefined; row = stack.pop()) {
    size += 1;
    stack.push(...row.children);
  }

  return size;
};

/**
 * Count the rows a program writes, relation by relation, each nested member under its own
 * relation: a tree's nodes, an attribute's IDREF tokens, an identity text's IDREF tokens, a cell's
 * `headers` tokens, a table cell's leaves, a `tolerance`'s values, a reference's segments, an
 * assembly's instances.
 *
 * @param program - The program.
 * @returns Each relation's number of rows, zero for a relation whose keyed set is empty.
 */
export const rowCountsOf = (program: ImportProgram): ReadonlyMap<string, number> => {
  const counted: (readonly [relation: string, n: number])[] = [];
  const add = (relation: string, n: number): void => {
    counted.push([relation, n]);
  };
  const { Instance, Node, ...flat } = program.inputs;

  for (const [relation, rows] of Object.entries(flat)) {
    add(relation, rows.size);
  }

  for (const attribute of flat.Attribute.values()) {
    add("Idref", attribute.idrefs.length);
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

  add("Instance", treeSizeOf(Instance.values()));
  add("Node", treeSizeOf(Node.values()));

  return new Map(
    [...Map.groupBy(counted, ([relation]) => relation)].map(
      ([relation, ns]) => [relation, ns.reduce((sum, [, n]) => sum + n, 0)] as const,
    ),
  );
};

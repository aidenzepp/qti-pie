/**
 * The importer's reading of an external metadata record: the rows of the record, whose root is a
 * `lom:lom`. The file a `resourcemetadata/xml` resource names is {@link recordFile}'s, in
 * `record.ts`.
 *
 * The record is a tree, so {@link treeRows} writes its nodes and `attributeRows` its shared
 * attributes (`xml:lang` on a `lom:string` today); the arm rows of its LOM and of the curriculum
 * standards sets it holds come from the builders the manifest module exports. The record is outside
 * the object identifier and title rows of an item resource.
 */
import type { AnyRelation, Fact, Uuid } from "@bjornpagen/grizzle";
import { Effect } from "effect";
import { attributeRows } from "#pantry/import/attributes.ts";
import { csmSetRows, lomSubtreeRows } from "#pantry/import/manifest.ts";
import { elementChildren, qmdLeafRows } from "#pantry/import/leaf.ts";
import type { ImportRefused } from "#pantry/import/refusal.ts";
import { Rows, treeRows } from "#pantry/import/tree.ts";
import type { NodeIndex, UnmodeledVocabulary } from "#pantry/import/tree.ts";
import { ManifestIdentifier, PackagePath } from "#pantry/schema/contracts.ts";
import { Document } from "#pantry/schema/document.ts";
import * as md from "#pantry/schema/metadata.ts";
import { Edge } from "#pantry/schema/node.ts";
import type { SchemaVersionHandle } from "#pantry/schema/node.ts";
import type { XmlDocument } from "@qti-pie/crust/tree.ts";

/**
 * What the caller knows about an external metadata record: the package that lists it, where, the
 * resource that names it and that resource's type, and the schema version of the package.
 */
export interface ExternalInput {
  readonly package: Uuid;
  readonly path: string;
  readonly resource: string;
  readonly resourceType: string;
  readonly version: SchemaVersionHandle;
}

/**
 * Write the rows of an external metadata record: its tree, its `Document` row, its record of LOM,
 * the record's shared attributes (`attributeRows`) and the rows of the QTI metadata and curriculum
 * standards sets it holds.
 *
 * The record has no identifier and no title row of the document, and none of the resource's own
 * `ResourceLomIdentified` and `ResourceLomTitled`.
 *
 * @param doc - The decoded record.
 * @param input - Where its package lists it.
 * @param rows - The rows so far.
 * @returns The rows with this record's added and the node index of its tree;
 *   `UnmodeledVocabulary` for any element or attribute the registries do not model; `ImportRefused`
 *   under `attribute-lexical` for a closed shared-attribute value outside its roster.
 */
export const externalRows = Effect.fn("import.externalRows")(function* externalRows(
  doc: XmlDocument,
  input: ExternalInput,
  rows: Rows,
): Effect.fn.Return<{ rows: Rows; nodes: NodeIndex }, ImportRefused | UnmodeledVocabulary> {
  const documentId = crypto.randomUUID();
  const resource = ManifestIdentifier(input.resource);
  const tree = yield* treeRows(
    doc,
    {
      charset: doc.charset,
      id: documentId,
      kind: "document",
      root: "externalLom",
      version: input.version,
    },
    rows,
  );
  const { nodes } = tree;
  const attributed = yield* attributeRows(doc.root, nodes, documentId, tree.rows);
  const positions = new Map(Rows.of(attributed, Edge).map((edge) => [edge.child, edge.position]));
  let built = Rows.add(attributed, Document, [
    {
      id: documentId,
      package: input.package,
      path: PackagePath(input.path),
      resource,
      resourceType: input.resourceType,
      root: "externalLom",
      version: input.version,
    },
  ]);
  const add = <R extends AnyRelation>(relation: R, facts: readonly Fact<R>[]): void => {
    built = Rows.add(built, relation, facts);
  };

  const { root } = doc;
  const lom = nodes.get(root);
  if (lom === undefined || lom.kind !== "lom:lom") {
    return { nodes, rows: built };
  }

  add(md.Lom, [{ id: lom.id, owner: "external", package: input.package }]);
  add(md.ExternalLom, [{ document: documentId, lom: lom.id, package: input.package, resource }]);
  built = lomSubtreeRows(
    built,
    { nodes, positions },
    root,
    {
      grandparentKind: undefined,
      id: lom.id,
      kind: lom.kind,
      position: positions.get(lom.id) ?? 0n,
    },
    {
      findings: {
        entries: [],
        hasGeneral: false,
        hasIdentifier: false,
        hasTitle: false,
        languages: new Set(),
        titles: [],
      },
      lom: lom.id,
      owner: "external",
    },
  );

  for (const child of elementChildren(root)) {
    const node = nodes.get(child);
    if (node?.kind === "qmd:qtiMetadata") {
      add(md.QtiMetadata, [{ host: "externalLom", id: node.id, package: input.package, resource }]);
      add(md.QtiMetadataInExternalLom, [
        { id: node.id, lom: lom.id, package: input.package, resource },
      ]);
      built = yield* qmdLeafRows(built, nodes, child, node.id);
    } else if (node?.kind === "csmd:curriculumStandardsMetadataSet") {
      built = csmSetRows(built, nodes, child, lom.id);
    }
  }

  return { nodes, rows: built };
});

/**
 * The outcome document's rows: the document itself, whose root is a `qti-outcome-declaration`, the
 * declaration that root is with its default value, and the `OutcomeDocument` row that binds the
 * declaration to the document and to the identifier both carry.
 */
import { Effect, Option } from "effect";
import { semanticRows } from "#qti/import/item.ts";
import type { ItemInput } from "#qti/import/item.ts";
import { kindOf, Rows, treeRows, UnmodeledVocabulary, withParents } from "#qti/import/tree.ts";
import type { ImportRefused } from "#qti/import/refusal.ts";
import type { ItemRefusal, NodeIndex } from "#qti/import/tree.ts";
import { ManifestIdentifier, PackagePath } from "#qti/schema/contracts.ts";
import { Declaration } from "#qti/schema/declaration.ts";
import { Document, DocumentIdentifier } from "#qti/schema/document.ts";
import { Edge } from "#qti/schema/node.ts";
import { OutcomeDocument } from "#qti/schema/outcome.ts";

/**
 * Write the rows of an outcome document: its tree, its `Document` row with the identifier row, the
 * root declaration with its arms, default value and values, and the `OutcomeDocument` row.
 *
 * The root's `identifier` is held twice, as `Declaration.identifier` and as
 * `DocumentIdentifier.value`, and `OutcomeDocument` binds them. The declaration is read once, by
 * the item module's declaration builder, which processes every attribute through `typedAttribute`;
 * the document's identifier is the one that builder collapsed. An outcome document has no title.
 *
 * @param input - The decoded document and where its package lists it, in the item importer's shape.
 * @param rows - The rows so far.
 * @returns The rows with this document's added, the node index of its tree and the document's id,
 *   which is the tree's and the root declaration's; `UnmodeledVocabulary` for a root that is not
 *   `qti-outcome-declaration` in the ASI namespace, naming it, and for any element or attribute the
 *   registries do not model, a `qti-match-table` or `qti-interpolation-table` child among them;
 *   `ItemRefusal` as the item builder raises it for a binding no declaration answers;
 *   `ImportRefused` as the item builder raises it for an attribute outside its lexical space.
 */
export const outcomeRows = Effect.fn("import.outcomeRows")(function* outcomeRows(
  input: ItemInput,
  rows: Rows,
): Effect.fn.Return<
  { rows: Rows; nodes: NodeIndex; documentId: string },
  ImportRefused | ItemRefusal | UnmodeledVocabulary
> {
  const { doc, packageId, version } = input;
  const { root } = doc;
  if (Option.getOrUndefined(kindOf(root, Option.none())) !== "qti-outcome-declaration") {
    return yield* new UnmodeledVocabulary({
      kind: "element",
      name: root.qname,
      parent: Option.none(),
    });
  }

  const documentId = crypto.randomUUID();
  const tree = yield* treeRows(
    doc,
    { charset: doc.charset, id: documentId, kind: "document", root: "outcomes", version },
    rows,
  );
  const { nodes } = tree;
  const positions = new Map(Rows.of(tree.rows, Edge).map((edge) => [edge.child, edge.position]));
  const declared = yield* semanticRows(
    Rows.add(tree.rows, Document, [
      {
        id: documentId,
        package: packageId,
        path: PackagePath(input.path),
        resource: ManifestIdentifier(input.resource),
        resourceType: input.resourceType,
        root: "outcomes",
        version,
      },
    ]),
    { adaptive: "false", documentId, nodes, positions, rootId: documentId },
    withParents(root, Option.none()),
  );

  const identifier = Rows.of(declared.rows, Declaration).find(
    (declaration) => declaration.id === documentId,
  )?.identifier;
  if (identifier === undefined) {
    return yield* Effect.die(new Error("The outcome document's root declaration has no row."));
  }

  const built = Rows.add(declared.rows, DocumentIdentifier, [
    {
      document: documentId,
      package: packageId,
      resource: ManifestIdentifier(input.resource),
      root: "outcomes",
      value: identifier,
    },
  ]);

  return {
    documentId,
    nodes,
    rows: Rows.add(built, OutcomeDocument, [
      { declaration: documentId, document: documentId, identifier },
    ]),
  };
});

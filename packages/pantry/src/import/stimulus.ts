/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shape` is the tool column the rows carry; the shape here is which of the two tool attributes the root wrote, not a structure. */

/**
 * The stimulus document's rows: a `qti-assessment-stimulus` root, its tool and label rows, its
 * body, and the shared attribute, HTML and content rows of the body's tree. This module is the
 * entry the package importer routes that root to.
 *
 * A stimulus declares no variable, so the body's interactions, feedback and templates are stored
 * bare (goal 5.15, E4): no `InteractionBinding` and no reference row is written, and none is
 * refused as `binding-declared`.
 */
import type { Uuid } from "@bjornpagen/grizzle";
import { Effect, Option } from "effect";
import { attributeRows } from "#pantry/import/attributes.ts";
import { contentRows } from "#pantry/import/content.ts";
import { htmlRows } from "#pantry/import/html.ts";
import { includeRows } from "#pantry/import/include.ts";
import { unboundChoiceRows } from "#pantry/import/item.ts";
import type { ItemInput } from "#pantry/import/item.ts";
import type { ImportRefused } from "#pantry/import/refusal.ts";
import { attributeReader, unboundInteractionRows } from "#pantry/import/interactions.ts";
import { requiredAttribute } from "#pantry/import/required.ts";
import {
  collapse,
  ItemRefusal,
  kindOf,
  Rows,
  treeRows,
  UnmodeledVocabulary,
  withParents,
} from "#pantry/import/tree.ts";
import type { NodeIndex } from "#pantry/import/tree.ts";
import {
  ManifestIdentifier,
  PackagePath,
  ToolName,
  ToolVersion,
} from "#pantry/schema/contracts.ts";
import { Document, DocumentIdentifier, DocumentTitle } from "#pantry/schema/document.ts";
import {
  AssessmentItemLabel,
  ItemTool,
  ItemToolBoth,
  ItemToolName,
  ItemToolVersion,
} from "#pantry/schema/item.ts";
import { AssessmentStimulus, StimulusBody } from "#pantry/schema/stimulus.ts";

/**
 * One fact of an optional-value relation where the attribute was written, none where it was not.
 */
const written = <Value, Made>(value: Option.Option<Value>, make: (own: Value) => Made): Made[] =>
  Option.match(value, { onNone: () => [], onSome: (own) => [make(own)] });

/**
 * The tool row of a stimulus root and the arm that holds the strings it wrote, as the attribute
 * reader read them; none when it wrote neither `tool-name` nor `tool-version`.
 */
const toolRows = (
  rows: Rows,
  tree: Uuid,
  name: Option.Option<string>,
  version: Option.Option<string>,
): Rows => {
  if (Option.isSome(name) && Option.isSome(version)) {
    return Rows.add(
      Rows.add(rows, ItemTool, [{ root: "stimulus", shape: "both", tree }]),
      ItemToolBoth,
      [{ toolName: ToolName(name.value), toolVersion: ToolVersion(version.value), tree }],
    );
  }

  if (Option.isSome(name)) {
    return Rows.add(
      Rows.add(rows, ItemTool, [{ root: "stimulus", shape: "nameOnly", tree }]),
      ItemToolName,
      [{ toolName: ToolName(name.value), tree }],
    );
  }

  return Option.isSome(version)
    ? Rows.add(
        Rows.add(rows, ItemTool, [{ root: "stimulus", shape: "versionOnly", tree }]),
        ItemToolVersion,
        [{ toolVersion: ToolVersion(version.value), tree }],
      )
    : rows;
};

/**
 * Write the rows of a stimulus document: its tree, its `Document` row with the identifier and title
 * rows, the root with its tool and label rows, the body, and the shared attribute, HTML, include,
 * interaction and content rows of the tree. The interactions and their choices are written bare, as
 * `unboundChoiceRows` and `unboundInteractionRows` write them, and each `xi:include` as
 * `includeRows` writes it, so every node of the tree has its arm.
 *
 * `identifier` and `title` are required and read with their inventory classes; `label`,
 * `tool-name` and `tool-version` are optional and a row is written only for one the source wrote.
 * The body carries its document's schema version, which the refusal of a 3.0.1-only attribute on a
 * 3.0.0 body selects on.
 *
 * @param input - The decoded stimulus and where its package lists it.
 * @param rows - The rows so far.
 * @returns The rows with this document's added, the node index of its tree and the document's id,
 *   which is the tree's; `UnmodeledVocabulary` for a root that is not `qti-assessment-stimulus`,
 *   naming it, and for any element or attribute the registries do not model; `ItemRefusal`
 *   (`required-attribute`) for a required attribute the source omits; `ImportRefused` for a value
 *   outside its roster.
 */
export const stimulusRows = Effect.fn("import.stimulusRows")(function* stimulusRows(
  input: ItemInput,
  rows: Rows,
): Effect.fn.Return<
  { rows: Rows; nodes: NodeIndex; documentId: Uuid },
  ImportRefused | UnmodeledVocabulary | ItemRefusal
> {
  const { doc, packageId, version } = input;
  const { root } = doc;
  if (Option.getOrUndefined(kindOf(root, Option.none())) !== "qti-assessment-stimulus") {
    return yield* new UnmodeledVocabulary({
      kind: "element",
      name: root.qname,
      parent: Option.none(),
    });
  }

  const documentId = crypto.randomUUID();
  const tree = yield* treeRows(
    doc,
    { charset: doc.charset, id: documentId, kind: "document", root: "stimulus", version },
    rows,
  );
  const { nodes } = tree;
  const rootNode = nodes.get(root);
  if (rootNode === undefined) {
    return yield* new ItemRefusal({
      detail: "The document's root element has no node.",
      rule: "binding-declared",
    });
  }

  let built = Rows.add(tree.rows, Document, [
    {
      id: documentId,
      package: packageId,
      path: PackagePath(input.path),
      resource: ManifestIdentifier(input.resource),
      resourceType: input.resourceType,
      root: "stimulus",
      version,
    },
  ]);
  const common = {
    document: documentId,
    package: packageId,
    resource: ManifestIdentifier(input.resource),
    root: "stimulus",
  } as const;
  const attributes = attributeReader(built, root, rootNode);
  const identifier = yield* requiredAttribute(root, "identifier", attributes.read("identifier"));
  const title = yield* requiredAttribute(root, "title", attributes.read("title"));
  const label = attributes.read("label");
  const toolName = attributes.read("tool-name");
  const toolVersion = attributes.read("tool-version");
  built = Rows.add(attributes.rows(), DocumentIdentifier, [{ ...common, value: identifier }]);
  built = Rows.add(built, DocumentTitle, [{ ...common, collapsed: collapse(title), value: title }]);
  built = Rows.add(built, AssessmentStimulus, [{ id: rootNode.id }]);
  built = Rows.add(
    built,
    AssessmentItemLabel,
    written(label, (value) => ({
      node: rootNode.id,
      root: "stimulus",
      tree: documentId,
      value,
      version,
    })),
  );
  built = toolRows(built, documentId, toolName, toolVersion);

  for (const node of nodes.values()) {
    if (node.kind === "qti-stimulus-body") {
      built = Rows.add(built, StimulusBody, [{ id: node.id, version }]);
    }
  }

  built = yield* attributeRows(root, nodes, documentId, built);
  built = yield* htmlRows(root, nodes, built);
  built = yield* includeRows(root, nodes, built);
  built = yield* unboundChoiceRows(built, withParents(root, Option.none()), nodes);
  built = yield* unboundInteractionRows(root, nodes, documentId, built);
  built = yield* contentRows(root, nodes, documentId, "stimulus", new Map(), built);

  return { documentId, nodes, rows: built };
});

/**
 * The rows of a response processing template document: the document, its `qti-response-processing`
 * root, the `template` attributes the root carries, and the processing tree under it.
 *
 * A template document's processing is its tree's root, so it has a `ResponseProcessing` row of root
 * kind `rptemplate` and no `ResponseProcessingItem` row, and the document has no `identifier` or
 * `title` row: the root carries neither. Every variable the template names is a parameter the
 * document using it supplies, so each reference becomes a `TemplateParameterRef`.
 *
 * The package importer sends a document here by the root kind its resource type maps to
 * (`RootOfType`), never by the type string. `imsqti_rptemplate_xmlv3p0` maps to `rptemplate` today;
 * `imsqti_resprocessing_xmlv3p0` is phase 4's row, and under dispatch by root it reaches this
 * builder with no edit here.
 *
 * @module
 */
import { Effect, Option } from "effect";
import { processingRows } from "#qti/import/processing.ts";
import type { ProcessingRefused } from "#qti/import/processing.ts";
import { kindOf, Rows, treeRows, typedAttribute, UnmodeledVocabulary } from "#qti/import/tree.ts";
import type { NodeIndex } from "#qti/import/tree.ts";
import { emptyEnvironment } from "#qti/processing/env.ts";
import { Document } from "#qti/schema/document.ts";
import type { AttributeNameHandle, SchemaVersionHandle } from "#qti/schema/node.ts";
import {
  ResponseProcessing,
  ResponseProcessingTemplate,
  ResponseProcessingTemplateLocation,
} from "#qti/schema/processing.ts";
import type { XmlDocument } from "#qti/xml/tree.ts";

/**
 * What {@link rptemplateRows} needs to know about the document beside its tree: the same as an
 * item's.
 */
export interface RptemplateInput {
  readonly doc: XmlDocument;
  readonly packageId: string;
  readonly path: string;
  readonly resource: string;
  readonly resourceType: string;
  readonly version: SchemaVersionHandle;
}

/**
 * Write the rows of a response processing template document.
 *
 * The document's id is a fresh uuid and is the tree's id, as an item's is. The `template` and
 * `template-location` attributes of the root are collapsed, and the root's rows are written beside
 * the `ResponseProcessing` arm; the tree under it is checked and written in `template` mode with no
 * declaration, so every reference not built in is a template parameter.
 *
 * @param input - The decoded template document and where its package lists it.
 * @param rows - The rows so far.
 * @returns The rows with this document's added, the node index of its tree and the document's id,
 *   which is the tree's; `UnmodeledVocabulary` for a root that is not `qti-response-processing` in
 *   the ASI namespace, naming it, and for any element or attribute the registries do not model;
 *   `ProcessingRefused` for a tree the processing checker refuses.
 */
export const rptemplateRows = Effect.fn("import.rptemplateRows")(function* rptemplateRows(
  input: RptemplateInput,
  rows: Rows,
): Effect.fn.Return<
  { rows: Rows; nodes: NodeIndex; documentId: string },
  ProcessingRefused | UnmodeledVocabulary
> {
  const { doc, packageId, version } = input;
  const { root } = doc;
  if (Option.getOrUndefined(kindOf(root, Option.none())) !== "qti-response-processing") {
    return yield* new UnmodeledVocabulary({
      kind: "element",
      name: root.qname,
      parent: Option.none(),
    });
  }

  const documentId = crypto.randomUUID();
  const tree = yield* treeRows(
    doc,
    { charset: doc.charset, id: documentId, kind: "document", root: "rptemplate", version },
    rows,
  );
  const { nodes } = tree;
  const rootNode = nodes.get(root);
  if (rootNode === undefined) {
    return yield* new UnmodeledVocabulary({
      kind: "element",
      name: root.qname,
      parent: Option.none(),
    });
  }

  let built = Rows.add(tree.rows, Document, [
    {
      id: documentId,
      package: packageId,
      path: input.path,
      resource: input.resource,
      resourceType: input.resourceType,
      root: "rptemplate",
      version,
    },
  ]);
  built = Rows.add(built, ResponseProcessing, [{ id: rootNode.id, rootKind: "rptemplate" }]);

  const collapsed = (name: AttributeNameHandle): Option.Option<string> => {
    const attribute = root.attributes.find(
      (candidate) => candidate.namespace === "" && candidate.local === name,
    );
    if (attribute === undefined) {
      return Option.none();
    }

    const typed = typedAttribute(
      built,
      rootNode.id,
      rootNode.kind,
      name,
      attribute.value,
      "collapse",
    );
    built = typed.rows;

    return Option.some(typed.value);
  };
  const template = collapsed("template");
  const location = collapsed("template-location");
  built = Rows.add(
    built,
    ResponseProcessingTemplate,
    Option.match(template, {
      onNone: () => [],
      onSome: (uri) => [{ node: rootNode.id, uri }],
    }),
  );
  built = Rows.add(
    built,
    ResponseProcessingTemplateLocation,
    Option.match(location, {
      onNone: () => [],
      onSome: (uri) => [{ node: rootNode.id, uri }],
    }),
  );

  built = yield* processingRows(
    {
      document: documentId,
      env: emptyEnvironment("template"),
      language: "response",
      mode: "template",
      nodes,
      root,
      rootKind: "rptemplate",
      tree: documentId,
      version,
    },
    built,
  );

  return { documentId, nodes, rows: built };
});

/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */

/**
 * The importer's reading of an external metadata record: the file a `resourcemetadata/xml`
 * resource names, and the rows of the record, whose root is a `lom:lom`.
 *
 * The record is a tree, so {@link treeRows} writes its nodes; the arm rows of its LOM and of the
 * curriculum standards sets it holds come from the builders the manifest module exports. The
 * record is outside the object identifier and title rows of an item resource.
 */
import type { AnyRelation, Fact } from "@bjornpagen/grizzle";
import { Effect, Option, Schema } from "effect";
import { csmSetRows, lomSubtreeRows } from "#qti/import/manifest.ts";
import { collapse, replace, Rows, treeRows } from "#qti/import/tree.ts";
import type { NodeIndex, UnmodeledVocabulary } from "#qti/import/tree.ts";
import { Document } from "#qti/schema/document.ts";
import * as md from "#qti/schema/metadata.ts";
import { Edge } from "#qti/schema/node.ts";
import type { SchemaVersionHandle } from "#qti/schema/node.ts";
import type { Element, XmlDocument } from "#qti/xml/tree.ts";

/**
 * An external metadata file could not be recorded.
 *
 * `detail` says which record was left unnamed.
 */
export class ExternalRefusal extends Schema.TaggedError<ExternalRefusal>()("ExternalRefusal", {
  detail: Schema.String,
  rule: Schema.Literals(["record-unnamed"]),
}) {}

/**
 * Name the file that holds an external metadata record: the resource's `href`, else its one file.
 *
 * @param resource - The resource's `href` and the `href` of each file it lists.
 * @returns The path of the record, or `ExternalRefusal` when the resource has no `href` and does
 *   not list exactly one file.
 */
export const recordFile = (resource: {
  readonly files: readonly string[];
  readonly href: Option.Option<string>;
}): Effect.Effect<string, ExternalRefusal> => {
  if (Option.isSome(resource.href)) {
    return Effect.succeed(resource.href.value);
  }

  const [only, ...rest] = resource.files;
  if (only !== undefined && rest.length === 0) {
    return Effect.succeed(only);
  }

  return Effect.fail(
    new ExternalRefusal({
      detail: `the resource has no href and lists ${resource.files.length} files, so no file is named as its record; give it an href or list exactly one file`,
      rule: "record-unnamed",
    }),
  );
};

/**
 * What the caller knows about an external metadata record: the package that lists it, where, the
 * resource that names it and that resource's type, and the schema version of the package.
 */
export interface ExternalInput {
  readonly package: string;
  readonly path: string;
  readonly resource: string;
  readonly resourceType: string;
  readonly version: SchemaVersionHandle;
}

/**
 * The element children of `element`, whatever their namespace.
 */
const elementChildren = (element: Element): readonly Element[] =>
  element.children.filter((child): child is Element => child.kind === "element");

/**
 * The character content of a leaf as read: its text and entity-reference children joined, an
 * entity reference by its lexical form `&name;`.
 */
const contentOf = (element: Element): string =>
  element.children
    .map((child) => {
      if (child.kind === "text") {
        return child.value;
      }

      return child.kind === "entityRef" ? `&${child.name};` : "";
    })
    .join("");

/**
 * The `qmd:` leaves of a QTI metadata record, each with its arm and the whitespace class of its
 * content: the four booleans collapse, the enumerations and tool strings are kept as read.
 */
const qmdLeaves = {
  "qmd:composite": { arm: md.QmdComposite, class: "collapse" },
  "qmd:feedbackType": { arm: md.QmdFeedbackType, class: "preserve" },
  "qmd:interactionType": { arm: md.QmdInteractionType, class: "preserve" },
  "qmd:itemTemplate": { arm: md.QmdItemTemplate, class: "collapse" },
  "qmd:scoringMode": { arm: md.QmdScoringMode, class: "preserve" },
  "qmd:solutionAvailable": { arm: md.QmdSolutionAvailable, class: "collapse" },
  "qmd:timeDependent": { arm: md.QmdTimeDependent, class: "collapse" },
  "qmd:toolName": { arm: md.QmdToolName, class: "preserve" },
  "qmd:toolVendor": { arm: md.QmdToolVendor, class: "preserve" },
  "qmd:toolVersion": { arm: md.QmdToolVersion, class: "preserve" },
} as const;

/**
 * Whether `kind` is one of {@link qmdLeaves}.
 */
const isQmdLeaf = (kind: string): kind is keyof typeof qmdLeaves => kind in qmdLeaves;

/**
 * Write one arm row per leaf of a `qmd:qtiMetadata` element, and the rows of its portable custom
 * interaction context.
 *
 * @param rows - The rows so far.
 * @param nodes - The node of every element.
 * @param qmd - The `qmd:qtiMetadata` element.
 * @param qtiMetadata - Its node id.
 * @returns The rows with the leaves' added.
 */
const qmdLeafRows = (rows: Rows, nodes: NodeIndex, qmd: Element, qtiMetadata: string): Rows => {
  let built = rows;
  const add = <R extends AnyRelation>(relation: R, facts: readonly Fact<R>[]): void => {
    built = Rows.add(built, relation, facts);
  };

  for (const leaf of elementChildren(qmd)) {
    const found = nodes.get(leaf);
    if (found === undefined) {
      continue;
    }

    const content = contentOf(leaf);
    if (found.kind === "qmd:portableCustomInteractionContext") {
      add(md.QmdPortableCustomInteractionContext, [{ id: found.id, qtiMetadata }]);
      for (const part of elementChildren(leaf)) {
        const partNode = nodes.get(part);
        const value = replace(contentOf(part));
        if (partNode?.kind === "qmd:customTypeIdentifier") {
          add(md.QmdCustomTypeIdentifier, [{ context: found.id, id: partNode.id, value }]);
        } else if (partNode?.kind === "qmd:interactionKind") {
          add(md.QmdInteractionKind, [{ context: found.id, id: partNode.id, value }]);
        }
      }
    } else if (isQmdLeaf(found.kind)) {
      const spec = qmdLeaves[found.kind];
      const value = spec.class === "collapse" ? collapse(content) : content;
      // SAFETY: the leaf's column pattern judges the value at commit, which is the importer's refusal for it.
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
      add(spec.arm, [{ id: found.id, qtiMetadata, value }] as never);
    }
  }

  return built;
};

/**
 * Write the rows of an external metadata record: its tree, its `Document` row, its record of LOM
 * and the rows of the QTI metadata and curriculum standards sets it holds.
 *
 * The record has no identifier and no title row of the document, and none of the resource's own
 * `ResourceLomIdentified` and `ResourceLomTitled`.
 *
 * @param doc - The decoded record.
 * @param input - Where its package lists it.
 * @param rows - The rows so far.
 * @returns The rows with this record's added and the node index of its tree;
 *   `UnmodeledVocabulary` for any element or attribute the registries do not model.
 */
export const externalRows = Effect.fn("import.externalRows")(function* externalRows(
  doc: XmlDocument,
  input: ExternalInput,
  rows: Rows,
): Effect.fn.Return<{ rows: Rows; nodes: NodeIndex }, UnmodeledVocabulary> {
  const documentId = crypto.randomUUID();
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
  const positions = new Map(Rows.of(tree.rows, Edge).map((edge) => [edge.child, edge.position]));
  let built = Rows.add(tree.rows, Document, [
    {
      id: documentId,
      package: input.package,
      path: input.path,
      resource: input.resource,
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
  add(md.ExternalLom, [
    { document: documentId, lom: lom.id, package: input.package, resource: input.resource },
  ]);
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
      findings: { entries: [], hasIdentifier: false, hasTitle: false, titles: [] },
      lom: lom.id,
      owner: "external",
    },
  );

  for (const child of elementChildren(root)) {
    const node = nodes.get(child);
    if (node?.kind === "qmd:qtiMetadata") {
      add(md.QtiMetadata, [
        { host: "externalLom", id: node.id, package: input.package, resource: input.resource },
      ]);
      add(md.QtiMetadataInExternalLom, [
        { id: node.id, lom: lom.id, package: input.package, resource: input.resource },
      ]);
      built = qmdLeafRows(built, nodes, child, node.id);
    } else if (node?.kind === "csmd:curriculumStandardsMetadataSet") {
      built = csmSetRows(built, nodes, child, lom.id);
    }
  }

  return { nodes, rows: built };
});

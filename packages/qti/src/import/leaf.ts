/**
 * What the importer's readers of an element tree share: the element children and the character
 * content of a leaf, a leaf's content under its whitespace class, and the rows of the leaves of a
 * `qmd:qtiMetadata`, whether the record sits in a manifest or in an external file.
 */
import type { AnyRelation, Fact } from "@bjornpagen/grizzle";
import { collapse, replace, Rows } from "#qti/import/tree.ts";
import type { NodeIndex } from "#qti/import/tree.ts";
import * as md from "#qti/schema/metadata.ts";
import type { Element } from "#qti/xml/tree.ts";

/**
 * The element children of `element`, whatever their namespace.
 */
export const elementChildren = (element: Element): readonly Element[] =>
  element.children.filter((child): child is Element => child.kind === "element");

/**
 * The character content of a leaf as read: its `text`, `ws` and `entityRef` children joined, an
 * entity reference by its lexical form `&name;`; comments, processing instructions and elements
 * contribute nothing.
 */
export const contentOf = (element: Element): string =>
  element.children
    .map((child) => {
      if (child.kind === "text") {
        return child.value;
      }

      return child.kind === "entityRef" ? `&${child.name};` : "";
    })
    .join("");

/**
 * A leaf's content under its class: as read, with tab, line feed and carriage return turned to
 * spaces, or collapsed.
 */
export const classed = (value: string, whiteSpace: "collapse" | "preserve" | "replace"): string => {
  if (whiteSpace === "collapse") {
    return collapse(value);
  }

  return whiteSpace === "replace" ? replace(value) : value;
};

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
export const qmdLeafRows = (
  rows: Rows,
  nodes: NodeIndex,
  qmd: Element,
  qtiMetadata: string,
): Rows => {
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
      const value = classed(content, spec.class);
      // SAFETY: the leaf's column pattern judges the value at commit, which is the importer's refusal for it.
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
      add(spec.arm, [{ id: found.id, qtiMetadata, value }] as never);
    }
  }

  return built;
};

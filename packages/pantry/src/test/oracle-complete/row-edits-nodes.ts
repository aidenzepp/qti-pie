/**
 * The mutations of the law oracle's laws over a document's node rows and their character-data arms
 * (§1.3, §1.4), each an edit of the every-relation package's folded rows at a target drawn among
 * those the rows hold, judged by `documentBreaches` (`src/test/complete.oracle.test.ts`).
 *
 * The folds write every field these laws read, so no package text breaks one. Each edit changes
 * one field, drops one row or repeats one, at a node no law ahead of the edit's own reads it at: an
 * element of mixed content for a string value, a character run outside an interaction for a kind
 * or a parent's kind.
 */
import { element, int } from "@grizzle/testing/gen";
import type { Composed } from "#pantry/model/composed.ts";
import type { FoldedNode, FoldedRows } from "#pantry/model/folds.ts";
import {
  changeDrawn,
  droppedDrawn,
  editingRows,
  isElementNode,
  withNodes,
} from "#pantry/test/oracle-complete/mutation.ts";
import type { Mutation } from "#pantry/test/oracle-complete/mutation.ts";

/**
 * A document's folded rows.
 */
type Rows = FoldedRows<Composed>;

/**
 * A node row of them.
 */
type Node = FoldedNode<Composed>;

/**
 * The every-relation item, whose folded rows most edits change.
 */
const item = "items/item.xml";

/**
 * The every-relation stimulus, whose rows hold the package's doctype and processing instruction.
 */
const stimulus = "items/stimulus.xml";

/**
 * The kinds of mixed content whose string value no domain judges: an edit of it breaks only the
 * value's derivation.
 */
const mixed: ReadonlySet<string> = new Set(["div", "p", "span"]);

/**
 * The element kinds no interaction is and that admit no text, under which a text stands
 * unadmitted: a table's body, a declaration and a mapping.
 */
const unadmittedParents = ["tbody", "qti-response-declaration", "qti-mapping"] as const;

/**
 * Schema versions no grammar holds: QTI 2.2's, a version string short of three parts, and one past
 * every pinned version. N4 refuses each.
 */
const strayVersions = ["2.2.0", "3.0", "9.9.9"] as const;

/**
 * Element kinds no composition names: QTI 2's item root, which QTI 3 renamed, and a made-up one. N4
 * refuses each as a parent's kind.
 */
const strayKinds = ["assessmentItem", "no-such-kind"] as const;

/**
 * Whether a node is character data: a text or a whitespace run.
 *
 * @param node - The node.
 * @returns Whether it is.
 */
const isCharacters = (node: Node): boolean => node.kind === "text" || node.kind === "ws";

/**
 * Whether a node is character data whose parent is no interaction: its nearest interaction is its
 * parent's, so N8 reads no change of its parent's kind.
 *
 * @param node - The node.
 * @returns Whether it is.
 */
const isLooseCharacters = (node: Node): boolean =>
  isCharacters(node) && node.nearest === node.parentNearest;

/**
 * The parents whose last two children are a character run then an element: moving the element
 * onto the run's slot repeats a slot and leaves every state copy as it was, since a run steps no
 * content automaton.
 *
 * @param rows - The rows.
 * @returns Each such parent with its last child.
 */
const runThenElement = (rows: Rows): readonly { readonly last: Node; readonly parent: Node }[] =>
  rows.nodes.flatMap((parent) => {
    const childAt = (at: bigint) =>
      rows.nodes.find((child) => child.parent === parent.id && child.start > 0n && child.at === at);
    const last = childAt(parent.children - 1n);
    const before = childAt(parent.children - 2n);

    return parent.children >= 2n &&
      last !== undefined &&
      !isCharacters(last) &&
      before !== undefined &&
      isCharacters(before)
      ? [{ last, parent }]
      : [];
  });

/**
 * Each law's mutation, by law.
 */
export const nodeEdits = {
  // Document (§1.4): the Document row keyed by a node that is no document node.
  Document: editingRows(item, (rows) => (source) => {
    const member = rows.nodes[source.draw(int(1, rows.nodes.length - 1))];
    if (member === undefined) {
      throw new Error("the base's rows hold no node past the document node");
    }

    return { ...rows, document: { ...rows.document, node: member.id } };
  }),
  // E1 derived (E1): a mixed element's string value other than its children's characters.
  "E1 derived": editingRows(item, (rows) => (source) => {
    const suffix = source.draw(element(["x", " ", "&amp;"]));

    return withNodes(
      rows,
      source.draw(
        changeDrawn(
          rows.nodes,
          (node) => mixed.has(node.kind) && node.stringValue !== "",
          (node) => ({ ...node, stringValue: `${node.stringValue}${suffix}` }),
        ),
      ),
    );
  }),
  // N1 one document node (N1): one or two more rows of the document node, at its start 0.
  "N1 one document node": editingRows(item, (rows) => (source) => {
    const [documentNode] = rows.nodes;
    if (documentNode === undefined) {
      throw new Error("the base's rows hold no document node");
    }

    const copies = Array.from({ length: source.draw(int(1, 2)) }, () => documentNode);

    return withNodes(rows, [...rows.nodes, ...copies]);
  }),
  // N2 key (N2): a parent's last element moved onto the slot of the character run before it, the
  // parent's count of its children one less, so two members hold one slot.
  "N2 key": editingRows("section.xml", (rows) => (source) => {
    const sites = runThenElement(rows);
    const site = sites[source.draw(int(0, sites.length - 1))];
    if (site === undefined) {
      throw new Error("the base's rows hold no character run before a last element");
    }

    return withNodes(
      rows,
      rows.nodes.map((node) => {
        if (node.id === site.parent.id) {
          return { ...node, children: node.children - 1n };
        }

        return node.id === site.last.id ? { ...node, at: node.at - 1n } : node;
      }),
    );
  }),
  // N4 kinds (N4): a character run of a version no grammar holds, or under a kind none names.
  "N4 kinds": editingRows(item, (rows) => (source) => {
    const field = source.draw(element(["version", "parentKind"] as const));
    const stray = source.draw(element(field === "version" ? strayVersions : strayKinds));

    return withNodes(
      rows,
      source.draw(
        changeDrawn(rows.nodes, isLooseCharacters, (node) =>
          field === "version"
            ? {
                ...node,
                // SAFETY: N4 refuses a version outside the SchemaVersion roster, which the row's
                // type excludes; the stray value is one of strayVersions, none a pinned version.
                // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
                version: stray as Node["version"],
              }
            : {
                ...node,
                // SAFETY: N4 refuses a parent kind outside the NodeKind roster, which the row's
                // type excludes; the stray value is one of strayKinds, none a composed kind.
                // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
                parentKind: stray as Node["parentKind"],
              },
        ),
      ),
    );
  }),
  // N5 admitted (N5): a text whose parent's kind admits no text.
  "N5 admitted": editingRows(item, (rows) => (source) => {
    const parentKind = source.draw(element(unadmittedParents));

    return withNodes(
      rows,
      source.draw(
        changeDrawn(
          rows.nodes,
          (node) => node.kind === "text" && isLooseCharacters(node),
          (node) => ({ ...node, parentKind }),
        ),
      ),
    );
  }),
  // N7 last slot (N7): a mixed element's element count other than its last child's fold.
  "N7 last slot": editingRows(item, (rows) => (source) => {
    const delta = BigInt(source.draw(int(1, 3)));

    return withNodes(
      rows,
      source.draw(
        changeDrawn(
          rows.nodes,
          (node) => mixed.has(node.kind) && node.children > 0n,
          (node) => ({ ...node, elementChildren: node.elementChildren + delta }),
        ),
      ),
    );
  }),
  // N8 nearest (N8): an element's nearest interaction other than its parent's: itself.
  "N8 nearest": editingRows(
    item,
    (rows, grammar) => (source) =>
      withNodes(
        rows,
        source.draw(
          changeDrawn(
            rows.nodes,
            (node) => isElementNode(grammar, node) && node.nearest !== node.id,
            (node) => ({ ...node, nearest: node.id }),
          ),
        ),
      ),
  ),
  // comment arm (§1.4): the item's comment node with no Comment row, or a Comment row for a text.
  "comment arm": editingRows(item, (rows) => (source) => {
    if (source.draw(element(["drop", "add"] as const)) === "drop") {
      return { ...rows, comments: source.draw(droppedDrawn(rows.comments)) };
    }

    const text = rows.texts[source.draw(int(0, rows.texts.length - 1))];
    if (text === undefined) {
      throw new Error("the base's rows hold no text");
    }

    return { ...rows, comments: [...rows.comments, { node: text.node, value: "c" }] };
  }),
  // doctype arm (§1.4): the stimulus's doctype node with no Doctype row, or a Doctype row for its
  // comment.
  "doctype arm": editingRows(stimulus, (rows) => (source) => {
    if (source.draw(element(["drop", "add"] as const)) === "drop") {
      return { ...rows, doctypes: source.draw(droppedDrawn(rows.doctypes)) };
    }

    const comment = rows.comments[source.draw(int(0, rows.comments.length - 1))];
    if (comment === undefined) {
      throw new Error("the base's rows hold no comment");
    }

    return { ...rows, doctypes: [...rows.doctypes, { node: comment.node, value: "d" }] };
  }),
  // entityRef arm (§1.4): an EntityRef row for a text, which no entity reference node is.
  "entityRef arm": editingRows(item, (rows) => (source) => {
    const text = rows.texts[source.draw(int(0, rows.texts.length - 1))];
    if (text === undefined) {
      throw new Error("the base's rows hold no text");
    }

    const name = source.draw(element(["passage", "amp", "x"]));

    return { ...rows, entityRefs: [...rows.entityRefs, { name, node: text.node }] };
  }),
  // pi arm (§1.4): the stimulus's processing instruction with no Pi row, or a Pi row for its
  // comment.
  "pi arm": editingRows(stimulus, (rows) => (source) => {
    if (source.draw(element(["drop", "add"] as const)) === "drop") {
      return { ...rows, pis: source.draw(droppedDrawn(rows.pis)) };
    }

    const comment = rows.comments[source.draw(int(0, rows.comments.length - 1))];
    if (comment === undefined) {
      throw new Error("the base's rows hold no comment");
    }

    return {
      ...rows,
      pis: [...rows.pis, { data: "", node: comment.node, target: "every-relation" }],
    };
  }),
  // text arm (§1.4): a text node with no Text row, drawn among the texts no m:cn holds. A cn's
  // text emptied is refused by "MathML cn form" (an empty part is no number of its type, spec
  // reading 2), a law the oracle raises ahead of text-copy, and that law is not weakened
  // (decision 355): the arm proves text-copy alone, so it leaves a cn's text to the cn form arm.
  "text arm": editingRows(item, (rows) => (source) => {
    const kindOf = new Map(rows.nodes.map((node) => [node.id, node] as const));
    const candidates = rows.texts.filter(
      (text) => kindOf.get(kindOf.get(text.node)?.parent ?? text.node)?.kind !== "m:cn",
    );
    const dropped = source.draw(droppedDrawn(candidates));

    return {
      ...rows,
      texts: rows.texts.filter((text) => !candidates.includes(text) || dropped.includes(text)),
    };
  }),
  // ws arm (§1.4): a whitespace node with no Whitespace row.
  "ws arm": editingRows(item, (rows) => (source) => ({
    ...rows,
    whitespace: source.draw(droppedDrawn(rows.whitespace)),
  })),
} as const satisfies Readonly<Record<string, Mutation>>;

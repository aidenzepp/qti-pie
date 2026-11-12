/**
 * The mutations of the law oracle's laws over a document's attribute, name and character-data rows
 * (§1.3 to §1.5), each an edit of the every-relation package's folded rows at a target drawn among
 * those the rows hold, judged by `documentBreaches` (`src/test/complete.oracle.test.ts`).
 *
 * These laws hold the rows the folds and the codec write to the tree they come from, so no package
 * text breaks one; each edit is the smallest that does: one count, one copy, one row dropped or one
 * row repeated, and no field another law reads ahead of the edit's own. An attribute is a set
 * member keyed by its name, an open-class one by its expanded name, so no edit draws a slot.
 */
import { element, int } from "@grizzle/testing/gen";
import {
  changeDrawn,
  editingRows,
  isElementNode,
  withNodes,
} from "#pantry/test/oracle-complete/mutation.ts";
import type { Mutation } from "#pantry/test/oracle-complete/mutation.ts";

/**
 * The every-relation item, whose folded rows most edits change.
 */
const item = "items/item.xml";

/**
 * The every-relation stimulus, whose rows hold the package's attribute entity, processing
 * instruction and doctype.
 */
const stimulus = "items/stimulus.xml";

/**
 * The lead division's optional attributes, which no law but the attribute laws reads: dropping or
 * renaming one breaks no reference, bound or required attribute.
 */
const optional: ReadonlySet<string> = new Set([
  "aria-labelledby",
  "aria-valuemax",
  "aria-valuemin",
  "label",
]);

/**
 * Each law's mutation, by law.
 */
export const rowEdits = {
  // AL1 admission (AL1): an optional attribute of the lead division named by a closed name its
  // kind admits nowhere.
  "AL1 admission": editingRows(item, (rows) => (source) => {
    const name = source.draw(element(["max-choices", "shuffle", "response-identifier"] as const));

    return {
      ...rows,
      attributes: source.draw(
        changeDrawn(
          rows.attributes,
          (attribute) => optional.has(attribute.name),
          (attribute) => ({ ...attribute, name }),
        ),
      ),
    };
  }),
  // AL2 count (AL2): an element's count of its attributes one more or one fewer than its rows.
  "AL2 count": editingRows(item, (rows, grammar) => (source) => {
    const delta = source.draw(element([1n, -1n]));

    return withNodes(
      rows,
      source.draw(
        changeDrawn(
          rows.nodes,
          (node) => isElementNode(grammar, node) && (delta > 0n || node.attributes > 0n),
          (node) => ({ ...node, attributes: node.attributes + delta }),
        ),
      ),
    );
  }),
  // AL2 fold (AL2): an element's names holding a position none of its closed attributes is at, the
  // end of its counted family's fold.
  "AL2 fold": editingRows(item, (rows, grammar) => (source) => {
    const position = 900 + source.draw(int(0, 9));

    return withNodes(
      rows,
      source.draw(
        changeDrawn(
          rows.nodes,
          (node) => isElementNode(grammar, node),
          (node) => ({ ...node, attrs: new Set([...node.attrs, position]) }),
        ),
      ),
    );
  }),
  // AL4 data name (AL4): a `data-*` attribute's name outside reading 13's language: an upper-case
  // letter in it, or nothing after the prefix.
  "AL4 data name": editingRows(item, (rows) => (source) => {
    const names = rows.openAttributes.filter((open) => open.class === "data-*");
    const target = names[source.draw(int(0, names.length - 1))];
    if (target === undefined) {
      throw new Error("the base's rows hold no data-* attribute");
    }

    const local = source.draw(element(["data-A", "data-xY", "data-"] as const));

    return {
      ...rows,
      openAttributes: rows.openAttributes.map((open) =>
        open === target ? { ...open, local } : open,
      ),
    };
  }),
  // AL4 declared data name (AL4): a `data-*` attribute whose name is one its element declares: the
  // item's own `data-*` attribute renamed to a declared name of a paragraph's governor.
  "AL4 declared data name": editingRows(item, (rows) => (source) => {
    const names = rows.openAttributes.filter((open) => open.class === "data-*");
    const target = names[source.draw(int(0, names.length - 1))];
    if (target === undefined) {
      throw new Error("the base's rows hold no data-* attribute");
    }

    const local = source.draw(element(["data-catalog-idref", "data-ssml"] as const));

    return {
      ...rows,
      openAttributes: rows.openAttributes.map((open) =>
        open === target ? { ...open, local } : open,
      ),
    };
  }),
  // AL4 open name key (AL4): a second row of an open-class attribute's expanded name on its
  // element, its `OpenAttribute` key `(package, path, start, uri, local)`.
  "AL4 open name key": editingRows(item, (rows) => (source) => {
    const open = rows.openAttributes[source.draw(int(0, rows.openAttributes.length - 1))];
    if (open === undefined) {
      throw new Error("the base's rows hold no open-class attribute");
    }

    return {
      ...rows,
      openAttributes: [...rows.openAttributes, { ...open, lexical: `${open.lexical}x` }],
    };
  }),
  // Attribute prefix (AL1): an optional attribute of no namespace written with a prefix.
  "Attribute prefix": editingRows(item, (rows) => (source) => {
    const prefix = source.draw(element(["x", "aria", "ns1"]));

    return {
      ...rows,
      attributes: source.draw(
        changeDrawn(
          rows.attributes,
          (attribute) => optional.has(attribute.name),
          (attribute) => ({ ...attribute, prefix }),
        ),
      ),
    };
  }),
  // AttributeEntity owner (§1.4): the stimulus's attribute entity reference owned by no attribute
  // row: at a position past every node, or under a name its element carries no attribute of.
  "AttributeEntity owner": editingRows(stimulus, (rows) => (source) => {
    const owner =
      source.draw(element(["position", "name"] as const)) === "position"
        ? { start: BigInt(rows.nodes.length) }
        : { name: "max-choices" as const };

    return {
      ...rows,
      attributeEntities: rows.attributeEntities.map((entity) => ({ ...entity, ...owner })),
    };
  }),
  // N7 empty family (N7): a childless node's end values other than the fold's identity.
  "N7 empty family": editingRows(item, (rows) => (source) => {
    const field = source.draw(element(["childState", "elementChildren"] as const));
    const value = 1 + source.draw(int(0, 3));

    return withNodes(
      rows,
      source.draw(
        changeDrawn(
          rows.nodes,
          (node) => node.kind === "ws" || node.kind === "text",
          (node) =>
            field === "childState"
              ? { ...node, childState: value }
              : { ...node, elementChildren: BigInt(value) },
        ),
      ),
    );
  }),
  // Namespace family (§1.4): an element's count of its namespace declarations other than its
  // rows.
  "Namespace family": editingRows(item, (rows, grammar) => (source) => {
    const delta = source.draw(element([1n, 2n]));

    return withNodes(
      rows,
      source.draw(
        changeDrawn(
          rows.nodes,
          (node) => isElementNode(grammar, node),
          (node) => ({ ...node, namespaces: node.namespaces + delta }),
        ),
      ),
    );
  }),
} as const satisfies Readonly<Record<string, Mutation>>;

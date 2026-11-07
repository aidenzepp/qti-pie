/**
 * The mutations of the law oracle's laws over a document's attribute, name and character-data rows
 * (§1.3 to §1.5), each an edit of the every-relation package's folded rows at a target drawn among
 * those the rows hold, judged by `documentBreaches` (`src/test/complete.oracle.test.ts`).
 *
 * These laws hold the rows the folds and the codec write to the tree they come from, so no package
 * text breaks one; each edit is the smallest that does: one count, one copy, one row dropped or one
 * row repeated, and no field another law reads ahead of the edit's own.
 */
import { element, int } from "@grizzle/testing/gen";
import { openClasses } from "#pantry/grammar/kinds.ts";
import type { AttributeId, NodeId } from "#pantry/model/xdm.ts";
import {
  changeDrawn,
  droppedDrawn,
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
 * Ids no row of a document holds: a node's or an attribute's, by the folds' own numbering past
 * every row the base holds.
 */
const freshIds = [
  "00000000-0000-4000-8001-00000000fffe",
  "00000000-0000-4000-8001-00000000ffff",
] as const satisfies readonly NodeId[];

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
  // AL2 fold (AL2): an attribute's fold of its element's names holding a position no name of its
  // element is at.
  "AL2 fold": editingRows(item, (rows) => (source) => ({
    ...rows,
    attributes: source.draw(
      changeDrawn(
        rows.attributes,
        () => true,
        (attribute) => ({
          ...attribute,
          derived: { attrs: new Set([...attribute.derived.attrs, 999]) },
        }),
      ),
    ),
  })),
  // AL2 last slot (AL2): an element's names holding a position its last attribute's fold does not.
  "AL2 last slot": editingRows(item, (rows, grammar) => (source) => {
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
  // AL4 open name key (AL4): a second row of an open-class attribute's exact name on its element.
  "AL4 open name key": editingRows(item, (rows) => (source) => {
    const open = rows.openNames[source.draw(int(0, rows.openNames.length - 1))];
    const attribute = rows.attributes.find(({ id }) => id === open?.attribute);
    if (open === undefined || attribute === undefined) {
      throw new Error("the base's rows hold no open-class attribute");
    }

    const id: AttributeId = `${attribute.id}-repeated`;

    return {
      ...rows,
      attributes: [...rows.attributes, { ...attribute, at: attribute.at + 100n, id }],
      openNames: [...rows.openNames, { ...open, attribute: id }],
    };
  }),
  // AL4 open names (AL4): an open-class attribute's exact name missing, or a closed attribute
  // given one.
  "AL4 open names": editingRows(item, (rows) => (source) => {
    if (source.draw(element(["drop", "add"] as const)) === "drop") {
      return { ...rows, openNames: source.draw(droppedDrawn(rows.openNames)) };
    }

    const closed = rows.attributes.filter(({ name }) => !openClasses.some((open) => open === name));
    const attribute = closed[source.draw(int(0, closed.length - 1))];
    if (attribute === undefined) {
      throw new Error("the base's rows hold no closed attribute");
    }

    return {
      ...rows,
      openNames: [...rows.openNames, { attribute: attribute.id, local: "x", uri: "" }],
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
  // row.
  "AttributeEntity owner": editingRows(stimulus, (rows) => (source) => {
    const id = source.draw(element(freshIds));

    return {
      ...rows,
      attributeEntities: rows.attributeEntities.map((entity) => ({ ...entity, attribute: id })),
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

/**
 * The arm rows of the MathML nodes of a tree (spec MA09, part 1).
 *
 * Every MathML node has an arm row of its own kind, which the composition's `mirrors` law from
 * `Node` demands: the thin `{ id }` row for most kinds, `MathmlMaction` with its `actiontype`, and
 * `MathmlCbytes` with its base64 value. The builder takes the shape of a `contentRows` builder, so
 * `contentRows` dispatches to it for every MathML kind under every host, item, stimulus or test.
 *
 * @module
 */
import { Effect } from "effect";
import type { Relation, uuid } from "@bjornpagen/grizzle";
import { attributeReader } from "#pantry/import/interactions.ts";
import type { NodeRef } from "#pantry/import/interactions.ts";
import { requiredAttribute } from "#pantry/import/required.ts";
import type { ItemRefusal } from "#pantry/import/tree.ts";
import { Rows } from "#pantry/import/tree.ts";
import { MathmlCbytesValue } from "#pantry/schema/contracts.ts";
import { MathmlCbytes } from "#pantry/schema/mathml/attributes.ts";
import { arms, MathmlMaction } from "#pantry/schema/mathml/arms.ts";
import type { Element } from "@qti-pie/crust/tree.ts";

/**
 * A relation of one `id` column that no attribute adds to.
 */
type ThinRelation = Relation<string, { readonly id: typeof uuid }, readonly ["id"]>;

/**
 * The thin arm of each MathML kind that has no column but its id, by handle: every arm but
 * `MathmlMaction`'s, and `m:cbytes`, which has no entry in `arms`.
 */
const thinArms: ReadonlyMap<string, ThinRelation> = new Map<string, ThinRelation>(
  Object.entries(arms).filter(([handle]) => handle !== "m:maction"),
);

/**
 * The text of an element's own text children, concatenated, with every XML space removed
 * (spec 4.7): the base64 an `m:cbytes` holds.
 */
const cbytesOf = (element: Element): string =>
  element.children
    .flatMap((child) => (child.kind === "text" ? [child.value] : []))
    .join("")
    .replaceAll(/[ \t\n\r]/gu, "");

/**
 * Write the arm row of a MathML node.
 *
 * `m:maction` reads its `actiontype` as written and is refused when it has none (spec 4.11,
 * `math-maction-bare`); `m:cbytes` holds its text with the XML spaces removed, while the text
 * nodes themselves keep the spelling the walk wrote. An element under `m:annotation-xml` is
 * phase 11's, so this builder writes nothing for it and refuses nothing.
 *
 * @param rows - The rows so far.
 * @param element - The MathML element.
 * @param node - The node the walk made of `element`.
 * @returns The rows with the node's arm row; `ItemRefusal` (`required-attribute`) for an
 *   `m:maction` with no `actiontype`.
 */
export const mathmlRows = Effect.fn("import.mathmlRows")(function* mathmlRows(
  rows: Rows,
  element: Element,
  node: NodeRef,
): Effect.fn.Return<Rows, ItemRefusal> {
  if (node.kind === "m:maction") {
    const attributes = attributeReader(rows, element, node);
    const actiontype = yield* requiredAttribute(
      element,
      "actiontype",
      attributes.read("actiontype"),
    );

    return Rows.add(attributes.rows(), MathmlMaction, [{ actiontype, id: node.id }]);
  }

  if (node.kind === "m:cbytes") {
    return Rows.add(rows, MathmlCbytes, [
      { id: node.id, value: MathmlCbytesValue(cbytesOf(element)) },
    ]);
  }

  const thin = thinArms.get(node.kind);

  return thin === undefined ? rows : Rows.add(rows, thin, [{ id: node.id }]);
});

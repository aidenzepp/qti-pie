/**
 * The arm rows and the attribute rows of the MathML nodes of a tree.
 *
 * Every MathML node has an arm row of its own kind, which the composition's `mirrors` law from
 * `Node` demands: the thin `{ id }` row for most kinds, `MathmlMaction` with its `actiontype`, and
 * `MathmlCbytes` with its base64 value. The builder takes the shape of a `contentRows` builder, so
 * `contentRows` dispatches to it for every MathML kind under every host, item, stimulus or test.
 *
 * Every no-namespace attribute of a MathML node is written here and nowhere else (phase 2's shared
 * pass leaves a MathML element out), by the home the seeded matrix `MathmlAttributeType` gives its
 * `(kind, attribute)` pair: `id` as `DocumentId` and `HtmlId` rows, `xref` as an `AttributeIdref`
 * row, `m:maction/@actiontype` in its arm, and every other attribute as one row of the family the
 * matrix names.
 *
 * @module
 */
import { Effect, Option } from "effect";
import type { Relation, Uuid, uuid } from "@bjornpagen/grizzle";
import { attributeReader } from "#pantry/import/interactions.ts";
import type { NodeRef } from "#pantry/import/interactions.ts";
import { judgedLater } from "#pantry/import/judged.ts";
import type { ImportRefused } from "#pantry/import/refusal.ts";
import { requiredAttribute } from "#pantry/import/required.ts";
import type { ItemRefusal } from "#pantry/import/tree.ts";
import { closedOf, Rows } from "#pantry/import/tree.ts";
import { AttributeIdref } from "#pantry/schema/attributes.ts";
import {
  EmbedSourceUri,
  HyperlinkUri,
  MathmlBaseValue,
  MathmlCbytesValue,
  MathmlCdValue,
  MathmlCdgroupValue,
  MathmlDefinitionUrlValue,
  MathmlIndexValue,
  MathmlNameValue,
  MathmlNargsValue,
  MathmlPositionValue,
  MathmlScriptlevelValue,
  MathmlSelectionValue,
  MathmlShiftValue,
  MathmlSpanValue,
  MathmlSrcValue,
} from "#pantry/schema/contracts.ts";
import {
  MathmlBooleanValue,
  MathmlClosureValue,
  MathmlColumnalignstyleValue,
  MathmlDirValue,
  MathmlDisplayValue,
  MathmlEdgeValue,
  MathmlFontstyleValue,
  MathmlFontweightValue,
  MathmlFormValue,
  MathmlGroupAlignmentValue,
  MathmlIndentalignLineValue,
  MathmlIndentalignValue,
  MathmlInfixlinebreakstyleValue,
  MathmlLinebreakValue,
  MathmlLinebreakstyleValue,
  MathmlLinestyleValue,
  MathmlLocationValue,
  MathmlLongdivstyleValue,
  MathmlMathvariantValue,
  MathmlMspaceLinebreakValue,
  MathmlOccurrenceValue,
  MathmlOrderValue,
  MathmlOverflowValue,
  MathmlSideValue,
  MathmlVerticalalignValue,
} from "#pantry/schema/content/rosters.ts";
import { DocumentId, HtmlId } from "#pantry/schema/document.ts";
import { familyRelation, MathmlCbytes } from "#pantry/schema/mathml/attributes.ts";
import { arms, MathmlMaction } from "#pantry/schema/mathml/arms.ts";
import { AttributeName } from "#pantry/schema/node.ts";
import { attributeTypeOf } from "#pantry/schema/seed/mathml-attribute-type.ts";
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
 * The text of an element's own text children, concatenated, with every XML space removed: the
 * base64 an `m:cbytes` holds.
 */
const cbytesOf = (element: Element): string =>
  element.children
    .flatMap((child) => (child.kind === "text" ? [child.value] : []))
    .join("")
    .replaceAll(/[ \t\n\r]/gu, "");

/**
 * Write the arm row of a MathML node.
 *
 * `m:maction` reads its `actiontype` as written and is refused when it has none
 * (`math-maction-bare`); `m:cbytes` holds its text with the XML spaces removed, while the text
 * nodes themselves keep the spelling the walk wrote. An element under `m:annotation-xml` is
 * phase 11's, so this builder writes nothing for it and refuses nothing.
 *
 * @param rows - The rows so far.
 * @param element - The MathML element.
 * @param node - The node the walk made of `element`.
 * @returns The rows with the node's arm row; `ItemRefusal` (`required-attribute`) for an
 *   `m:maction` with no `actiontype`.
 */
const armRows = Effect.fn("import.mathmlArmRows")(function* armRows(
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

/**
 * How the value of one family's attribute becomes its column's value.
 */
type Narrow = (value: string, where: string) => Effect.Effect<string, ImportRefused>;

/**
 * The narrowing of a roster family: the value must be one of the roster's handles.
 */
const rosterOf =
  (roster: { readonly handles: readonly string[] }): Narrow =>
  (value, where) =>
    closedOf(roster.handles, value, "attribute-lexical", where);

/**
 * The narrowing of a contract family: the value through the contract, which judges it at commit.
 */
// oxlint-disable-next-line typescript/no-unnecessary-type-parameters -- `Text` is the contract's column type; the call site names it by inference.
const contractOf =
  <Text extends string>(contract: (value: Text) => string): Narrow =>
  (value) =>
    Effect.succeed(contract(judgedLater<Text>(value)));

/**
 * The narrowing of each roster and contract family, by `MathmlValueType` handle. A pattern family
 * and the string family have none here: their values go through `judgedLater`, judged by the
 * column's pattern at commit.
 */
const narrowings: ReadonlyMap<string, Narrow> = new Map<string, Narrow>([
  ["base", contractOf(MathmlBaseValue)],
  ["boolean", rosterOf(MathmlBooleanValue)],
  ["cd", contractOf(MathmlCdValue)],
  ["cdgroup", contractOf(MathmlCdgroupValue)],
  ["closure", rosterOf(MathmlClosureValue)],
  ["columnalignstyle", rosterOf(MathmlColumnalignstyleValue)],
  ["definition-url", contractOf(MathmlDefinitionUrlValue)],
  ["dir", rosterOf(MathmlDirValue)],
  ["display", rosterOf(MathmlDisplayValue)],
  ["edge", rosterOf(MathmlEdgeValue)],
  ["embed-source", contractOf(EmbedSourceUri)],
  ["fontstyle", rosterOf(MathmlFontstyleValue)],
  ["fontweight", rosterOf(MathmlFontweightValue)],
  ["form", rosterOf(MathmlFormValue)],
  ["group-alignment", rosterOf(MathmlGroupAlignmentValue)],
  ["href", contractOf(HyperlinkUri)],
  ["indentalign", rosterOf(MathmlIndentalignValue)],
  ["indentalign-line", rosterOf(MathmlIndentalignLineValue)],
  ["index", contractOf(MathmlIndexValue)],
  ["infixlinebreakstyle", rosterOf(MathmlInfixlinebreakstyleValue)],
  ["linebreak", rosterOf(MathmlLinebreakValue)],
  ["linebreakstyle", rosterOf(MathmlLinebreakstyleValue)],
  ["linestyle", rosterOf(MathmlLinestyleValue)],
  ["location", rosterOf(MathmlLocationValue)],
  ["longdivstyle", rosterOf(MathmlLongdivstyleValue)],
  ["mathvariant", rosterOf(MathmlMathvariantValue)],
  ["mspace-linebreak", rosterOf(MathmlMspaceLinebreakValue)],
  ["name", contractOf(MathmlNameValue)],
  ["nargs", contractOf(MathmlNargsValue)],
  ["occurrence", rosterOf(MathmlOccurrenceValue)],
  ["order", rosterOf(MathmlOrderValue)],
  ["overflow", rosterOf(MathmlOverflowValue)],
  ["position", contractOf(MathmlPositionValue)],
  ["scriptlevel", contractOf(MathmlScriptlevelValue)],
  ["selection", contractOf(MathmlSelectionValue)],
  ["shift", contractOf(MathmlShiftValue)],
  ["side", rosterOf(MathmlSideValue)],
  ["span", contractOf(MathmlSpanValue)],
  ["src", contractOf(MathmlSrcValue)],
  ["verticalalign", rosterOf(MathmlVerticalalignValue)],
]);

/**
 * The narrowing of a pattern or string family: the value as read, for the column's pattern to
 * judge at commit.
 */
const judgedNarrow: Narrow = (value) => Effect.succeed(judgedLater<string>(value));

/**
 * Write the rows of every no-namespace attribute of a MathML node.
 *
 * A node's `actiontype` is its arm's, written with the arm. Every other attribute's value is
 * processed by its leaf entry's whitespace class, with an `AttributeLexical` row when processing
 * changed it, and then written by its home: `id` and `xref` as above, anything else as one row of
 * the family the matrix names for the pair, narrowed by that family's class.
 *
 * @param rows - The rows so far, with the node's arm row.
 * @param element - The MathML element.
 * @param node - The node the walk made of `element`.
 * @param documentId - The id of the document, which is also its tree's.
 * @returns The rows with the node's attribute rows; `ImportRefused` (`attribute-lexical`) for a
 *   value outside a roster family's roster.
 */
const attributeFacts = Effect.fn("import.mathmlAttributes")(function* attributeFacts(
  rows: Rows,
  element: Element,
  node: NodeRef,
  documentId: Uuid,
): Effect.fn.Return<Rows, ImportRefused> {
  const reader = attributeReader(rows, element, node);
  const written: { name: (typeof AttributeName.handles)[number]; value: string }[] = [];
  for (const { local, namespace } of element.attributes) {
    const name = AttributeName.handles.find((known) => known === local);
    if (namespace === "" && !(node.kind === "m:maction" && local === "actiontype")) {
      const read = name === undefined ? Option.none() : reader.read(name);
      if (name === undefined || Option.isNone(read)) {
        return yield* Effect.die(
          new Error(`the walk let ${local} of ${node.kind} through, and its registry has no name`),
        );
      }

      written.push({ name, value: read.value });
    }
  }

  let built = reader.rows();
  for (const { name, value } of written) {
    if (name === "id") {
      built = Rows.add(built, DocumentId, [{ document: documentId, holder: "htmlId", id: value }]);
      built = Rows.add(built, HtmlId, [
        { attribute: name, document: documentId, id: value, kind: node.kind, node: node.id },
      ]);
    } else if (name === "xref") {
      built = Rows.add(built, AttributeIdref, [
        { attribute: name, document: documentId, node: node.id, position: 0n, target: value },
      ]);
    } else {
      const type = attributeTypeOf.get(`${node.kind} ${name}`);
      const relation = type === undefined ? undefined : familyRelation.get(type);
      if (type === undefined || relation === undefined) {
        return yield* Effect.die(
          new Error(`the walk let ${name} of ${node.kind} through, and the matrix has no family`),
        );
      }

      const narrowed = yield* (narrowings.get(type) ?? judgedNarrow)(
        value,
        `the ${name} attribute of ${node.kind}`,
      );
      built = Rows.add(built, relation, [
        { attribute: name, kind: node.kind, node: node.id, value: narrowed },
      ]);
    }
  }

  return built;
});

/**
 * Write the arm row and the attribute rows of a MathML node.
 *
 * `m:maction` reads its `actiontype` as written and is refused when it has none
 * (`math-maction-bare`); `m:cbytes` holds its text with the XML spaces removed, while the text
 * nodes themselves keep the spelling the walk wrote. Every other no-namespace attribute is one row
 * of the family its pair's home in the matrix names (see {@link attributeFacts}). An element under
 * `m:annotation-xml` is phase 11's, so this builder writes nothing for it and refuses nothing.
 *
 * @param rows - The rows so far.
 * @param element - The MathML element.
 * @param node - The node the walk made of `element`.
 * @param documentId - The id of the document, which is also its tree's.
 * @returns The rows with the node's arm and attribute rows; `ItemRefusal` (`required-attribute`)
 *   for an `m:maction` with no `actiontype`; `ImportRefused` (`attribute-lexical`) for a value
 *   outside a roster family's roster.
 */
export const mathmlRows = Effect.fn("import.mathmlRows")(function* mathmlRows(
  rows: Rows,
  element: Element,
  node: NodeRef,
  documentId: Uuid,
): Effect.fn.Return<Rows, ItemRefusal | ImportRefused> {
  const armed = yield* armRows(rows, element, node);

  return yield* attributeFacts(armed, element, node, documentId);
});

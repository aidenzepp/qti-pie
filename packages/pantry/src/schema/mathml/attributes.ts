/**
 * The MathML type matrix and the 25 roster families (spec 4.5, part 1). Inert until the composition
 * (p6-21) merges it into `qti.ts`.
 *
 * Every MathML attribute value is a row of one family relation, and the family a `(kind,
 * attribute)` pair belongs to is fixed by its XSD type, never by its element (`values.ts`). The
 * seeded matrix `MathmlAttributeType` names that one family for each pair, is contained in
 * `AttributeAdmission`, and is read-only to every role. Each family relation is phase 2's family
 * shape (`src/schema/attributes.ts`: node, kind, attribute and value) with `attribute` in the key,
 * and two statements bind it: its `(node, kind)` is contained in `Node`, and its `(kind,
 * attribute)` is contained in the matrix rows whose type is its own handle, so a row holds only
 * where the matrix says the pair has that type (the one-selector containment, probed at p6-1).
 *
 * The class and dir exclusions and the capacities belong to p6-22. The pattern, contract and string
 * families and `MathmlCbytes` are p6-16's.
 */
import type { AnyRelation } from "@bjornpagen/grizzle";
import { closedId, contained, on, relation, select, uuid } from "@bjornpagen/grizzle";

import { AttributeAdmission } from "#pantry/schema/attributes.ts";
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
  MathmlIndentalignValue,
  MathmlIndentalignLineValue,
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
  MathmlValueType,
} from "#pantry/schema/content/rosters.ts";
import { AttributeName, Node, NodeKind } from "#pantry/schema/node.ts";

/**
 * The type of each MathML `(kind, attribute)` pair: the one family whose relation holds its values.
 * Seeded and read-only to every role.
 */
export const MathmlAttributeType = relation(
  "MathmlAttributeType",
  { attribute: closedId(AttributeName), kind: closedId(NodeKind), type: closedId(MathmlValueType) },
  ["kind", "attribute"],
);

/**
 * The `boolean` family: a roster-typed attribute value of a MathML element, by node and attribute.
 */
export const MathmlBoolean = relation(
  "MathmlBoolean",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(MathmlBooleanValue),
  },
  ["node", "attribute"],
);

/**
 * The `closure` family: a roster-typed attribute value of a MathML element, by node and attribute.
 */
export const MathmlClosure = relation(
  "MathmlClosure",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(MathmlClosureValue),
  },
  ["node", "attribute"],
);

/**
 * The `columnalignstyle` family: a roster-typed attribute value of a MathML element, by node and
 * attribute.
 */
export const MathmlColumnalignstyle = relation(
  "MathmlColumnalignstyle",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(MathmlColumnalignstyleValue),
  },
  ["node", "attribute"],
);

/**
 * The `dir` family: a roster-typed attribute value of a MathML element, by node and attribute.
 */
export const MathmlDir = relation(
  "MathmlDir",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(MathmlDirValue),
  },
  ["node", "attribute"],
);

/**
 * The `display` family: a roster-typed attribute value of a MathML element, by node and attribute.
 */
export const MathmlDisplay = relation(
  "MathmlDisplay",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(MathmlDisplayValue),
  },
  ["node", "attribute"],
);

/**
 * The `edge` family: a roster-typed attribute value of a MathML element, by node and attribute.
 */
export const MathmlEdge = relation(
  "MathmlEdge",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(MathmlEdgeValue),
  },
  ["node", "attribute"],
);

/**
 * The `fontstyle` family: a roster-typed attribute value of a MathML element, by node and
 * attribute.
 */
export const MathmlFontstyle = relation(
  "MathmlFontstyle",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(MathmlFontstyleValue),
  },
  ["node", "attribute"],
);

/**
 * The `fontweight` family: a roster-typed attribute value of a MathML element, by node and
 * attribute.
 */
export const MathmlFontweight = relation(
  "MathmlFontweight",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(MathmlFontweightValue),
  },
  ["node", "attribute"],
);

/**
 * The `form` family: a roster-typed attribute value of a MathML element, by node and attribute.
 */
export const MathmlForm = relation(
  "MathmlForm",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(MathmlFormValue),
  },
  ["node", "attribute"],
);

/**
 * The `group-alignment` family: a roster-typed attribute value of a MathML element, by node and
 * attribute.
 */
export const MathmlGroupAlignment = relation(
  "MathmlGroupAlignment",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(MathmlGroupAlignmentValue),
  },
  ["node", "attribute"],
);

/**
 * The `indentalign` family: a roster-typed attribute value of a MathML element, by node and
 * attribute.
 */
export const MathmlIndentalign = relation(
  "MathmlIndentalign",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(MathmlIndentalignValue),
  },
  ["node", "attribute"],
);

/**
 * The `indentalign-line` family: a roster-typed attribute value of a MathML element, by node and
 * attribute.
 */
export const MathmlIndentalignLine = relation(
  "MathmlIndentalignLine",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(MathmlIndentalignLineValue),
  },
  ["node", "attribute"],
);

/**
 * The `infixlinebreakstyle` family: a roster-typed attribute value of a MathML element, by node and
 * attribute.
 */
export const MathmlInfixlinebreakstyle = relation(
  "MathmlInfixlinebreakstyle",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(MathmlInfixlinebreakstyleValue),
  },
  ["node", "attribute"],
);

/**
 * The `linebreak` family: a roster-typed attribute value of a MathML element, by node and
 * attribute.
 */
export const MathmlLinebreak = relation(
  "MathmlLinebreak",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(MathmlLinebreakValue),
  },
  ["node", "attribute"],
);

/**
 * The `linebreakstyle` family: a roster-typed attribute value of a MathML element, by node and
 * attribute.
 */
export const MathmlLinebreakstyle = relation(
  "MathmlLinebreakstyle",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(MathmlLinebreakstyleValue),
  },
  ["node", "attribute"],
);

/**
 * The `linestyle` family: a roster-typed attribute value of a MathML element, by node and
 * attribute.
 */
export const MathmlLinestyle = relation(
  "MathmlLinestyle",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(MathmlLinestyleValue),
  },
  ["node", "attribute"],
);

/**
 * The `location` family: a roster-typed attribute value of a MathML element, by node and attribute.
 */
export const MathmlLocation = relation(
  "MathmlLocation",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(MathmlLocationValue),
  },
  ["node", "attribute"],
);

/**
 * The `longdivstyle` family: a roster-typed attribute value of a MathML element, by node and
 * attribute.
 */
export const MathmlLongdivstyle = relation(
  "MathmlLongdivstyle",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(MathmlLongdivstyleValue),
  },
  ["node", "attribute"],
);

/**
 * The `mathvariant` family: a roster-typed attribute value of a MathML element, by node and
 * attribute.
 */
export const MathmlMathvariant = relation(
  "MathmlMathvariant",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(MathmlMathvariantValue),
  },
  ["node", "attribute"],
);

/**
 * The `mspace-linebreak` family: a roster-typed attribute value of a MathML element, by node and
 * attribute.
 */
export const MathmlMspaceLinebreak = relation(
  "MathmlMspaceLinebreak",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(MathmlMspaceLinebreakValue),
  },
  ["node", "attribute"],
);

/**
 * The `occurrence` family: a roster-typed attribute value of a MathML element, by node and
 * attribute.
 */
export const MathmlOccurrence = relation(
  "MathmlOccurrence",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(MathmlOccurrenceValue),
  },
  ["node", "attribute"],
);

/**
 * The `order` family: a roster-typed attribute value of a MathML element, by node and attribute.
 */
export const MathmlOrder = relation(
  "MathmlOrder",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(MathmlOrderValue),
  },
  ["node", "attribute"],
);

/**
 * The `overflow` family: a roster-typed attribute value of a MathML element, by node and attribute.
 */
export const MathmlOverflow = relation(
  "MathmlOverflow",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(MathmlOverflowValue),
  },
  ["node", "attribute"],
);

/**
 * The `side` family: a roster-typed attribute value of a MathML element, by node and attribute.
 */
export const MathmlSide = relation(
  "MathmlSide",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(MathmlSideValue),
  },
  ["node", "attribute"],
);

/**
 * The `verticalalign` family: a roster-typed attribute value of a MathML element, by node and
 * attribute.
 */
export const MathmlVerticalalign = relation(
  "MathmlVerticalalign",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: closedId(MathmlVerticalalignValue),
  },
  ["node", "attribute"],
);

/**
 * The type matrix and the roster families, by relation name.
 */
export const relations = {
  MathmlAttributeType,
  MathmlBoolean,
  MathmlClosure,
  MathmlColumnalignstyle,
  MathmlDir,
  MathmlDisplay,
  MathmlEdge,
  MathmlFontstyle,
  MathmlFontweight,
  MathmlForm,
  MathmlGroupAlignment,
  MathmlIndentalign,
  MathmlIndentalignLine,
  MathmlInfixlinebreakstyle,
  MathmlLinebreak,
  MathmlLinebreakstyle,
  MathmlLinestyle,
  MathmlLocation,
  MathmlLongdivstyle,
  MathmlMathvariant,
  MathmlMspaceLinebreak,
  MathmlOccurrence,
  MathmlOrder,
  MathmlOverflow,
  MathmlSide,
  MathmlVerticalalign,
};

/**
 * The statements over these relations: the matrix's own containment, then two for each family.
 */
export const rules = [
  contained(
    on(MathmlAttributeType, "kind", "attribute"),
    on(AttributeAdmission, "kind", "attribute"),
  ),
  contained(on(MathmlBoolean, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlBoolean, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "boolean" }), "kind", "attribute"),
  ),
  contained(on(MathmlClosure, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlClosure, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "closure" }), "kind", "attribute"),
  ),
  contained(on(MathmlColumnalignstyle, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlColumnalignstyle, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "columnalignstyle" }), "kind", "attribute"),
  ),
  contained(on(MathmlDir, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlDir, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "dir" }), "kind", "attribute"),
  ),
  contained(on(MathmlDisplay, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlDisplay, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "display" }), "kind", "attribute"),
  ),
  contained(on(MathmlEdge, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlEdge, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "edge" }), "kind", "attribute"),
  ),
  contained(on(MathmlFontstyle, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlFontstyle, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "fontstyle" }), "kind", "attribute"),
  ),
  contained(on(MathmlFontweight, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlFontweight, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "fontweight" }), "kind", "attribute"),
  ),
  contained(on(MathmlForm, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlForm, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "form" }), "kind", "attribute"),
  ),
  contained(on(MathmlGroupAlignment, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlGroupAlignment, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "group-alignment" }), "kind", "attribute"),
  ),
  contained(on(MathmlIndentalign, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlIndentalign, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "indentalign" }), "kind", "attribute"),
  ),
  contained(on(MathmlIndentalignLine, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlIndentalignLine, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "indentalign-line" }), "kind", "attribute"),
  ),
  contained(on(MathmlInfixlinebreakstyle, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlInfixlinebreakstyle, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "infixlinebreakstyle" }), "kind", "attribute"),
  ),
  contained(on(MathmlLinebreak, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlLinebreak, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "linebreak" }), "kind", "attribute"),
  ),
  contained(on(MathmlLinebreakstyle, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlLinebreakstyle, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "linebreakstyle" }), "kind", "attribute"),
  ),
  contained(on(MathmlLinestyle, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlLinestyle, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "linestyle" }), "kind", "attribute"),
  ),
  contained(on(MathmlLocation, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlLocation, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "location" }), "kind", "attribute"),
  ),
  contained(on(MathmlLongdivstyle, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlLongdivstyle, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "longdivstyle" }), "kind", "attribute"),
  ),
  contained(on(MathmlMathvariant, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlMathvariant, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "mathvariant" }), "kind", "attribute"),
  ),
  contained(on(MathmlMspaceLinebreak, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlMspaceLinebreak, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "mspace-linebreak" }), "kind", "attribute"),
  ),
  contained(on(MathmlOccurrence, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlOccurrence, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "occurrence" }), "kind", "attribute"),
  ),
  contained(on(MathmlOrder, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlOrder, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "order" }), "kind", "attribute"),
  ),
  contained(on(MathmlOverflow, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlOverflow, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "overflow" }), "kind", "attribute"),
  ),
  contained(on(MathmlSide, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlSide, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "side" }), "kind", "attribute"),
  ),
  contained(on(MathmlVerticalalign, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlVerticalalign, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "verticalalign" }), "kind", "attribute"),
  ),
] as const;

/**
 * The family relation of each `MathmlValueType` handle, as far as declared: the 25 roster families
 * here, the rest added by p6-16.
 */
export const familyRelation: ReadonlyMap<string, AnyRelation> = new Map<string, AnyRelation>([
  ["boolean", MathmlBoolean],
  ["closure", MathmlClosure],
  ["columnalignstyle", MathmlColumnalignstyle],
  ["dir", MathmlDir],
  ["display", MathmlDisplay],
  ["edge", MathmlEdge],
  ["fontstyle", MathmlFontstyle],
  ["fontweight", MathmlFontweight],
  ["form", MathmlForm],
  ["group-alignment", MathmlGroupAlignment],
  ["indentalign", MathmlIndentalign],
  ["indentalign-line", MathmlIndentalignLine],
  ["infixlinebreakstyle", MathmlInfixlinebreakstyle],
  ["linebreak", MathmlLinebreak],
  ["linebreakstyle", MathmlLinebreakstyle],
  ["linestyle", MathmlLinestyle],
  ["location", MathmlLocation],
  ["longdivstyle", MathmlLongdivstyle],
  ["mathvariant", MathmlMathvariant],
  ["mspace-linebreak", MathmlMspaceLinebreak],
  ["occurrence", MathmlOccurrence],
  ["order", MathmlOrder],
  ["overflow", MathmlOverflow],
  ["side", MathmlSide],
  ["verticalalign", MathmlVerticalalign],
]);

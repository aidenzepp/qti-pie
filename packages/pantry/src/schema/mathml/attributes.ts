/**
 * The MathML type matrix and the 67 attribute families, with `MathmlCbytes` (spec 4.5, parts 1 and
 * 2). Inert until the composition (p6-21) merges it into `qti.ts`.
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
 * The 25 roster families come first, then the 26 pattern, 15 contract and 1 string family, each a
 * `value` typed by its pattern, its contract or the tautology string. The class and dir exclusions
 * and the capacities belong to p6-22.
 */
import type { AnyRelation } from "@bjornpagen/grizzle";
import { closedId, contained, on, relation, select, str, uuid } from "@bjornpagen/grizzle";

import { AttributeAdmission } from "#pantry/schema/attributes.ts";
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
import * as patterns from "#pantry/schema/patterns.ts";

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
 * The `align` family: an anchored-pattern attribute value of a MathML element, by node and
 * attribute.
 */
export const MathmlAlign = relation(
  "MathmlAlign",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: str.regex(patterns.mathmlAlign),
  },
  ["node", "attribute"],
);

/**
 * The `alignmentscope` family: an anchored-pattern attribute value of a MathML element, by node and
 * attribute.
 */
export const MathmlAlignmentscope = relation(
  "MathmlAlignmentscope",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: str.regex(patterns.mathmlAlignmentscope),
  },
  ["node", "attribute"],
);

/**
 * The `altimg-valign` family: an anchored-pattern attribute value of a MathML element, by node and
 * attribute.
 */
export const MathmlAltimgValign = relation(
  "MathmlAltimgValign",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: str.regex(patterns.mathmlAltimgValign),
  },
  ["node", "attribute"],
);

/**
 * The `background` family: an anchored-pattern attribute value of a MathML element, by node and
 * attribute.
 */
export const MathmlBackground = relation(
  "MathmlBackground",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: str.regex(patterns.mathmlBackground),
  },
  ["node", "attribute"],
);

/**
 * The `base` family: a contract-typed attribute value of a MathML element, by node and attribute.
 */
export const MathmlBase = relation(
  "MathmlBase",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: MathmlBaseValue,
  },
  ["node", "attribute"],
);

/**
 * The `cd` family: a contract-typed attribute value of a MathML element, by node and attribute.
 */
export const MathmlCd = relation(
  "MathmlCd",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: MathmlCdValue,
  },
  ["node", "attribute"],
);

/**
 * The `cdgroup` family: a contract-typed attribute value of a MathML element, by node and
 * attribute.
 */
export const MathmlCdgroup = relation(
  "MathmlCdgroup",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: MathmlCdgroupValue,
  },
  ["node", "attribute"],
);

/**
 * The `character` family: an anchored-pattern attribute value of a MathML element, by node and
 * attribute.
 */
export const MathmlCharacter = relation(
  "MathmlCharacter",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: str.regex(patterns.mathmlCharacter),
  },
  ["node", "attribute"],
);

/**
 * The `charspacing` family: an anchored-pattern attribute value of a MathML element, by node and
 * attribute.
 */
export const MathmlCharspacing = relation(
  "MathmlCharspacing",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: str.regex(patterns.mathmlCharspacing),
  },
  ["node", "attribute"],
);

/**
 * The `class` family: an anchored-pattern attribute value of a MathML element, by node and
 * attribute.
 */
export const MathmlClass = relation(
  "MathmlClass",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: str.regex(patterns.mathmlClass),
  },
  ["node", "attribute"],
);

/**
 * The `color` family: an anchored-pattern attribute value of a MathML element, by node and
 * attribute.
 */
export const MathmlColor = relation(
  "MathmlColor",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: str.regex(patterns.mathmlColor),
  },
  ["node", "attribute"],
);

/**
 * The `columnalign` family: an anchored-pattern attribute value of a MathML element, by node and
 * attribute.
 */
export const MathmlColumnalign = relation(
  "MathmlColumnalign",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: str.regex(patterns.mathmlColumnalign),
  },
  ["node", "attribute"],
);

/**
 * The `columnwidth` family: an anchored-pattern attribute value of a MathML element, by node and
 * attribute.
 */
export const MathmlColumnwidth = relation(
  "MathmlColumnwidth",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: str.regex(patterns.mathmlColumnwidth),
  },
  ["node", "attribute"],
);

/**
 * The `crossout` family: an anchored-pattern attribute value of a MathML element, by node and
 * attribute.
 */
export const MathmlCrossout = relation(
  "MathmlCrossout",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: str.regex(patterns.mathmlCrossout),
  },
  ["node", "attribute"],
);

/**
 * The `definition-url` family: a contract-typed attribute value of a MathML element, by node and
 * attribute.
 */
export const MathmlDefinitionUrl = relation(
  "MathmlDefinitionUrl",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: MathmlDefinitionUrlValue,
  },
  ["node", "attribute"],
);

/**
 * The `embed-source` family: a contract-typed attribute value of a MathML element, by node and
 * attribute.
 */
export const MathmlEmbedSource = relation(
  "MathmlEmbedSource",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: EmbedSourceUri,
  },
  ["node", "attribute"],
);

/**
 * The `framespacing` family: an anchored-pattern attribute value of a MathML element, by node and
 * attribute.
 */
export const MathmlFramespacing = relation(
  "MathmlFramespacing",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: str.regex(patterns.mathmlFramespacing),
  },
  ["node", "attribute"],
);

/**
 * The `group-alignment-list` family: an anchored-pattern attribute value of a MathML element, by
 * node and attribute.
 */
export const MathmlGroupAlignmentList = relation(
  "MathmlGroupAlignmentList",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: str.regex(patterns.mathmlGroupAlignmentList),
  },
  ["node", "attribute"],
);

/**
 * The `group-alignment-list-list` family: an anchored-pattern attribute value of a MathML element,
 * by node and attribute.
 */
export const MathmlGroupAlignmentListList = relation(
  "MathmlGroupAlignmentListList",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: str.regex(patterns.mathmlGroupAlignmentListList),
  },
  ["node", "attribute"],
);

/**
 * The `href` family: a contract-typed attribute value of a MathML element, by node and attribute.
 */
export const MathmlHref = relation(
  "MathmlHref",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: HyperlinkUri,
  },
  ["node", "attribute"],
);

/**
 * The `indentshift-line` family: an anchored-pattern attribute value of a MathML element, by node
 * and attribute.
 */
export const MathmlIndentshiftLine = relation(
  "MathmlIndentshiftLine",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: str.regex(patterns.mathmlIndentshiftLine),
  },
  ["node", "attribute"],
);

/**
 * The `index` family: a contract-typed attribute value of a MathML element, by node and attribute.
 */
export const MathmlIndex = relation(
  "MathmlIndex",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: MathmlIndexValue,
  },
  ["node", "attribute"],
);

/**
 * The `length` family: an anchored-pattern attribute value of a MathML element, by node and
 * attribute.
 */
export const MathmlLength = relation(
  "MathmlLength",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: str.regex(patterns.mathmlLength),
  },
  ["node", "attribute"],
);

/**
 * The `length-list` family: an anchored-pattern attribute value of a MathML element, by node and
 * attribute.
 */
export const MathmlLengthList = relation(
  "MathmlLengthList",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: str.regex(patterns.mathmlLengthList),
  },
  ["node", "attribute"],
);

/**
 * The `line-thickness` family: an anchored-pattern attribute value of a MathML element, by node and
 * attribute.
 */
export const MathmlLineThickness = relation(
  "MathmlLineThickness",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: str.regex(patterns.mathmlLineThickness),
  },
  ["node", "attribute"],
);

/**
 * The `linestyle-list` family: an anchored-pattern attribute value of a MathML element, by node and
 * attribute.
 */
export const MathmlLinestyleList = relation(
  "MathmlLinestyleList",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: str.regex(patterns.mathmlLinestyleList),
  },
  ["node", "attribute"],
);

/**
 * The `mathsize` family: an anchored-pattern attribute value of a MathML element, by node and
 * attribute.
 */
export const MathmlMathsize = relation(
  "MathmlMathsize",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: str.regex(patterns.mathmlMathsize),
  },
  ["node", "attribute"],
);

/**
 * The `maxsize` family: an anchored-pattern attribute value of a MathML element, by node and
 * attribute.
 */
export const MathmlMaxsize = relation(
  "MathmlMaxsize",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: str.regex(patterns.mathmlMaxsize),
  },
  ["node", "attribute"],
);

/**
 * The `mpadded-length` family: an anchored-pattern attribute value of a MathML element, by node and
 * attribute.
 */
export const MathmlMpaddedLength = relation(
  "MathmlMpaddedLength",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: str.regex(patterns.mathmlMpaddedLength),
  },
  ["node", "attribute"],
);

/**
 * The `name` family: a contract-typed attribute value of a MathML element, by node and attribute.
 */
export const MathmlName = relation(
  "MathmlName",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: MathmlNameValue,
  },
  ["node", "attribute"],
);

/**
 * The `nargs` family: a contract-typed attribute value of a MathML element, by node and attribute.
 */
export const MathmlNargs = relation(
  "MathmlNargs",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: MathmlNargsValue,
  },
  ["node", "attribute"],
);

/**
 * The `number` family: an anchored-pattern attribute value of a MathML element, by node and
 * attribute.
 */
export const MathmlNumber = relation(
  "MathmlNumber",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: str.regex(patterns.mathmlNumber),
  },
  ["node", "attribute"],
);

/**
 * The `position` family: a contract-typed attribute value of a MathML element, by node and
 * attribute.
 */
export const MathmlPosition = relation(
  "MathmlPosition",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: MathmlPositionValue,
  },
  ["node", "attribute"],
);

/**
 * The `rowalign` family: an anchored-pattern attribute value of a MathML element, by node and
 * attribute.
 */
export const MathmlRowalign = relation(
  "MathmlRowalign",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: str.regex(patterns.mathmlRowalign),
  },
  ["node", "attribute"],
);

/**
 * The `scriptlevel` family: a contract-typed attribute value of a MathML element, by node and
 * attribute.
 */
export const MathmlScriptlevel = relation(
  "MathmlScriptlevel",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: MathmlScriptlevelValue,
  },
  ["node", "attribute"],
);

/**
 * The `selection` family: a contract-typed attribute value of a MathML element, by node and
 * attribute.
 */
export const MathmlSelection = relation(
  "MathmlSelection",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: MathmlSelectionValue,
  },
  ["node", "attribute"],
);

/**
 * The `shift` family: a contract-typed attribute value of a MathML element, by node and attribute.
 */
export const MathmlShift = relation(
  "MathmlShift",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: MathmlShiftValue,
  },
  ["node", "attribute"],
);

/**
 * The `span` family: a contract-typed attribute value of a MathML element, by node and attribute.
 */
export const MathmlSpan = relation(
  "MathmlSpan",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: MathmlSpanValue,
  },
  ["node", "attribute"],
);

/**
 * The `src` family: a contract-typed attribute value of a MathML element, by node and attribute.
 */
export const MathmlSrc = relation(
  "MathmlSrc",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: MathmlSrcValue,
  },
  ["node", "attribute"],
);

/**
 * The `string` family: a string attribute value of a MathML element, by node and attribute.
 */
export const MathmlString = relation(
  "MathmlString",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: str.regex(patterns.xsString, patterns.xsStringFlags),
  },
  ["node", "attribute"],
);

/**
 * The `table-width` family: an anchored-pattern attribute value of a MathML element, by node and
 * attribute.
 */
export const MathmlTableWidth = relation(
  "MathmlTableWidth",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: str.regex(patterns.mathmlTableWidth),
  },
  ["node", "attribute"],
);

/**
 * The `unsigned-integer` family: an anchored-pattern attribute value of a MathML element, by node
 * and attribute.
 */
export const MathmlUnsignedInteger = relation(
  "MathmlUnsignedInteger",
  {
    attribute: closedId(AttributeName),
    kind: closedId(NodeKind),
    node: uuid,
    value: str.regex(patterns.mathmlUnsignedInteger),
  },
  ["node", "attribute"],
);

/**
 * The arm of `m:cbytes`: its text with every XML space removed, which is base64 (spec 4.7). The
 * containment into `Node` is bound by the composition's one `mirrors` per kind.
 */
export const MathmlCbytes = relation("MathmlCbytes", { id: uuid, value: MathmlCbytesValue }, [
  "id",
]);

/**
 * The arm of each MathML kind that has one, by `NodeKind` handle, for the composition's `nodeArms`.
 */
export const contentArms = { "m:cbytes": MathmlCbytes };

/**
 * The type matrix and the 67 attribute families, by relation name.
 */
export const relations = {
  MathmlAlign,
  MathmlAlignmentscope,
  MathmlAltimgValign,
  MathmlAttributeType,
  MathmlBackground,
  MathmlBase,
  MathmlBoolean,
  MathmlCd,
  MathmlCdgroup,
  MathmlCharacter,
  MathmlCharspacing,
  MathmlClass,
  MathmlClosure,
  MathmlColor,
  MathmlColumnalign,
  MathmlColumnalignstyle,
  MathmlColumnwidth,
  MathmlCrossout,
  MathmlDefinitionUrl,
  MathmlDir,
  MathmlDisplay,
  MathmlEdge,
  MathmlEmbedSource,
  MathmlFontstyle,
  MathmlFontweight,
  MathmlForm,
  MathmlFramespacing,
  MathmlGroupAlignment,
  MathmlGroupAlignmentList,
  MathmlGroupAlignmentListList,
  MathmlHref,
  MathmlIndentalign,
  MathmlIndentalignLine,
  MathmlIndentshiftLine,
  MathmlIndex,
  MathmlInfixlinebreakstyle,
  MathmlLength,
  MathmlLengthList,
  MathmlLineThickness,
  MathmlLinebreak,
  MathmlLinebreakstyle,
  MathmlLinestyle,
  MathmlLinestyleList,
  MathmlLocation,
  MathmlLongdivstyle,
  MathmlMathsize,
  MathmlMathvariant,
  MathmlMaxsize,
  MathmlMpaddedLength,
  MathmlMspaceLinebreak,
  MathmlName,
  MathmlNargs,
  MathmlNumber,
  MathmlOccurrence,
  MathmlOrder,
  MathmlOverflow,
  MathmlPosition,
  MathmlRowalign,
  MathmlScriptlevel,
  MathmlSelection,
  MathmlShift,
  MathmlSide,
  MathmlSpan,
  MathmlSrc,
  MathmlString,
  MathmlTableWidth,
  MathmlUnsignedInteger,
  MathmlVerticalalign,
};

/**
 * The statements over these relations: the matrix's own containment, then two for each of the 67
 * families.
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
  contained(on(MathmlAlign, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlAlign, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "align" }), "kind", "attribute"),
  ),
  contained(on(MathmlAlignmentscope, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlAlignmentscope, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "alignmentscope" }), "kind", "attribute"),
  ),
  contained(on(MathmlAltimgValign, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlAltimgValign, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "altimg-valign" }), "kind", "attribute"),
  ),
  contained(on(MathmlBackground, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlBackground, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "background" }), "kind", "attribute"),
  ),
  contained(on(MathmlBase, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlBase, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "base" }), "kind", "attribute"),
  ),
  contained(on(MathmlCd, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlCd, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "cd" }), "kind", "attribute"),
  ),
  contained(on(MathmlCdgroup, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlCdgroup, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "cdgroup" }), "kind", "attribute"),
  ),
  contained(on(MathmlCharacter, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlCharacter, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "character" }), "kind", "attribute"),
  ),
  contained(on(MathmlCharspacing, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlCharspacing, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "charspacing" }), "kind", "attribute"),
  ),
  contained(on(MathmlClass, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlClass, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "class" }), "kind", "attribute"),
  ),
  contained(on(MathmlColor, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlColor, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "color" }), "kind", "attribute"),
  ),
  contained(on(MathmlColumnalign, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlColumnalign, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "columnalign" }), "kind", "attribute"),
  ),
  contained(on(MathmlColumnwidth, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlColumnwidth, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "columnwidth" }), "kind", "attribute"),
  ),
  contained(on(MathmlCrossout, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlCrossout, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "crossout" }), "kind", "attribute"),
  ),
  contained(on(MathmlDefinitionUrl, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlDefinitionUrl, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "definition-url" }), "kind", "attribute"),
  ),
  contained(on(MathmlEmbedSource, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlEmbedSource, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "embed-source" }), "kind", "attribute"),
  ),
  contained(on(MathmlFramespacing, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlFramespacing, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "framespacing" }), "kind", "attribute"),
  ),
  contained(on(MathmlGroupAlignmentList, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlGroupAlignmentList, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "group-alignment-list" }), "kind", "attribute"),
  ),
  contained(on(MathmlGroupAlignmentListList, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlGroupAlignmentListList, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "group-alignment-list-list" }), "kind", "attribute"),
  ),
  contained(on(MathmlHref, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlHref, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "href" }), "kind", "attribute"),
  ),
  contained(on(MathmlIndentshiftLine, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlIndentshiftLine, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "indentshift-line" }), "kind", "attribute"),
  ),
  contained(on(MathmlIndex, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlIndex, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "index" }), "kind", "attribute"),
  ),
  contained(on(MathmlLength, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlLength, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "length" }), "kind", "attribute"),
  ),
  contained(on(MathmlLengthList, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlLengthList, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "length-list" }), "kind", "attribute"),
  ),
  contained(on(MathmlLineThickness, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlLineThickness, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "line-thickness" }), "kind", "attribute"),
  ),
  contained(on(MathmlLinestyleList, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlLinestyleList, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "linestyle-list" }), "kind", "attribute"),
  ),
  contained(on(MathmlMathsize, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlMathsize, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "mathsize" }), "kind", "attribute"),
  ),
  contained(on(MathmlMaxsize, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlMaxsize, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "maxsize" }), "kind", "attribute"),
  ),
  contained(on(MathmlMpaddedLength, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlMpaddedLength, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "mpadded-length" }), "kind", "attribute"),
  ),
  contained(on(MathmlName, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlName, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "name" }), "kind", "attribute"),
  ),
  contained(on(MathmlNargs, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlNargs, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "nargs" }), "kind", "attribute"),
  ),
  contained(on(MathmlNumber, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlNumber, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "number" }), "kind", "attribute"),
  ),
  contained(on(MathmlPosition, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlPosition, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "position" }), "kind", "attribute"),
  ),
  contained(on(MathmlRowalign, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlRowalign, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "rowalign" }), "kind", "attribute"),
  ),
  contained(on(MathmlScriptlevel, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlScriptlevel, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "scriptlevel" }), "kind", "attribute"),
  ),
  contained(on(MathmlSelection, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlSelection, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "selection" }), "kind", "attribute"),
  ),
  contained(on(MathmlShift, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlShift, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "shift" }), "kind", "attribute"),
  ),
  contained(on(MathmlSpan, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlSpan, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "span" }), "kind", "attribute"),
  ),
  contained(on(MathmlSrc, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlSrc, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "src" }), "kind", "attribute"),
  ),
  contained(on(MathmlString, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlString, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "string" }), "kind", "attribute"),
  ),
  contained(on(MathmlTableWidth, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlTableWidth, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "table-width" }), "kind", "attribute"),
  ),
  contained(on(MathmlUnsignedInteger, "node", "kind"), on(Node, "id", "kind")),
  contained(
    on(MathmlUnsignedInteger, "kind", "attribute"),
    on(select(MathmlAttributeType, { type: "unsigned-integer" }), "kind", "attribute"),
  ),
] as const;

/**
 * The family relation of each of the 67 `MathmlValueType` handles.
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
  ["align", MathmlAlign],
  ["alignmentscope", MathmlAlignmentscope],
  ["altimg-valign", MathmlAltimgValign],
  ["background", MathmlBackground],
  ["base", MathmlBase],
  ["cd", MathmlCd],
  ["cdgroup", MathmlCdgroup],
  ["character", MathmlCharacter],
  ["charspacing", MathmlCharspacing],
  ["class", MathmlClass],
  ["color", MathmlColor],
  ["columnalign", MathmlColumnalign],
  ["columnwidth", MathmlColumnwidth],
  ["crossout", MathmlCrossout],
  ["definition-url", MathmlDefinitionUrl],
  ["embed-source", MathmlEmbedSource],
  ["framespacing", MathmlFramespacing],
  ["group-alignment-list", MathmlGroupAlignmentList],
  ["group-alignment-list-list", MathmlGroupAlignmentListList],
  ["href", MathmlHref],
  ["indentshift-line", MathmlIndentshiftLine],
  ["index", MathmlIndex],
  ["length", MathmlLength],
  ["length-list", MathmlLengthList],
  ["line-thickness", MathmlLineThickness],
  ["linestyle-list", MathmlLinestyleList],
  ["mathsize", MathmlMathsize],
  ["maxsize", MathmlMaxsize],
  ["mpadded-length", MathmlMpaddedLength],
  ["name", MathmlName],
  ["nargs", MathmlNargs],
  ["number", MathmlNumber],
  ["position", MathmlPosition],
  ["rowalign", MathmlRowalign],
  ["scriptlevel", MathmlScriptlevel],
  ["selection", MathmlSelection],
  ["shift", MathmlShift],
  ["span", MathmlSpan],
  ["src", MathmlSrc],
  ["string", MathmlString],
  ["table-width", MathmlTableWidth],
  ["unsigned-integer", MathmlUnsignedInteger],
]);

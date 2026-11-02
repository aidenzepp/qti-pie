/**
 * The table, list, disclosure, figure, ruby and break elements of the HTML profile (spec 4.8, unit
 * V05): 20 arms.
 *
 * An arm carries a column only for an own attribute that is required, and none of these has one: an
 * own optional attribute is a row of its own relation. `headers` of `td` and `th` is a row of
 * `AttributeIdref`, not of this module. The global families and ARIA belong to `attributes.ts` and
 * `aria.ts`, and appear on no arm here. The arms' containments into `Node` are expanded by
 * `alternatives` in the composed schema, not written here.
 */
import { capacity, contained, on, relation, select, str, uuid, within } from "@bjornpagen/grizzle";
import * as node from "#qti/schema/node.ts";
import * as patterns from "#qti/schema/patterns.ts";

/**
 * A `br` element.
 */
export const Br = relation("Br", { id: uuid }, ["id"]);

/**
 * A `caption` element.
 */
export const Caption = relation("Caption", { id: uuid }, ["id"]);

/**
 * A `col` element; its optional attributes are rows of their own relations.
 */
export const Col = relation("Col", { id: uuid }, ["id"]);

/**
 * A `colgroup` element; its optional attributes are rows of their own relations.
 */
export const Colgroup = relation("Colgroup", { id: uuid }, ["id"]);

/**
 * A `details` element; its optional attributes are rows of their own relations.
 */
export const Details = relation("Details", { id: uuid }, ["id"]);

/**
 * A `dl` element.
 */
export const Dl = relation("Dl", { id: uuid }, ["id"]);

/**
 * A `figcaption` element.
 */
export const Figcaption = relation("Figcaption", { id: uuid }, ["id"]);

/**
 * A `figure` element.
 */
export const Figure = relation("Figure", { id: uuid }, ["id"]);

/**
 * A `hr` element.
 */
export const Hr = relation("Hr", { id: uuid }, ["id"]);

/**
 * An `ol` element.
 */
export const Ol = relation("Ol", { id: uuid }, ["id"]);

/**
 * A `rtc` element.
 */
export const Rtc = relation("Rtc", { id: uuid }, ["id"]);

/**
 * A `ruby` element.
 */
export const Ruby = relation("Ruby", { id: uuid }, ["id"]);

/**
 * A `table` element; its optional attributes are rows of their own relations.
 */
export const Table = relation("Table", { id: uuid }, ["id"]);

/**
 * A `tbody` element.
 */
export const Tbody = relation("Tbody", { id: uuid }, ["id"]);

/**
 * A `td` element; its optional attributes are rows of their own relations.
 */
export const Td = relation("Td", { id: uuid }, ["id"]);

/**
 * A `tfoot` element.
 */
export const Tfoot = relation("Tfoot", { id: uuid }, ["id"]);

/**
 * A `th` element; its optional attributes are rows of their own relations.
 */
export const Th = relation("Th", { id: uuid }, ["id"]);

/**
 * A `thead` element.
 */
export const Thead = relation("Thead", { id: uuid }, ["id"]);

/**
 * A `tr` element.
 */
export const Tr = relation("Tr", { id: uuid }, ["id"]);

/**
 * An `ul` element.
 */
export const Ul = relation("Ul", { id: uuid }, ["id"]);

/**
 * A `table` element's `summary`, when written.
 */
export const TableSummary = relation(
  "TableSummary",
  { node: uuid, value: str.regex(patterns.xsString, patterns.xsStringFlags) },
  ["node"],
);

/**
 * A `col` element's `span`, when written.
 */
export const ColSpan = relation(
  "ColSpan",
  { node: uuid, value: str.regex(patterns.positiveInteger) },
  ["node"],
);

/**
 * A `colgroup` element's `span`, when written.
 */
export const ColgroupSpan = relation(
  "ColgroupSpan",
  { node: uuid, value: str.regex(patterns.positiveInteger) },
  ["node"],
);

/**
 * A `details` element's `open`, when written.
 */
export const DetailsOpen = relation(
  "DetailsOpen",
  { node: uuid, value: str.regex(patterns.xsBoolean) },
  ["node"],
);

/**
 * A `td` element's `scope`, when written.
 */
export const TdScope = relation("TdScope", { node: uuid, value: str.regex(patterns.scope) }, [
  "node",
]);

/**
 * A `td` element's `abbr`, when written.
 */
export const TdAbbr = relation(
  "TdAbbr",
  { node: uuid, value: str.regex(patterns.xsString, patterns.xsStringFlags) },
  ["node"],
);

/**
 * A `td` element's `axis`, when written.
 */
export const TdAxis = relation(
  "TdAxis",
  { node: uuid, value: str.regex(patterns.xsString, patterns.xsStringFlags) },
  ["node"],
);

/**
 * A `td` element's `rowspan`, when written.
 */
export const TdRowspan = relation(
  "TdRowspan",
  { node: uuid, value: str.regex(patterns.positiveInteger) },
  ["node"],
);

/**
 * A `td` element's `colspan`, when written.
 */
export const TdColspan = relation(
  "TdColspan",
  { node: uuid, value: str.regex(patterns.positiveInteger) },
  ["node"],
);

/**
 * A `td` element's `align`, when written.
 */
export const TdAlign = relation("TdAlign", { node: uuid, value: str.regex(patterns.align) }, [
  "node",
]);

/**
 * A `td` element's `valign`, when written.
 */
export const TdValign = relation("TdValign", { node: uuid, value: str.regex(patterns.valign) }, [
  "node",
]);

/**
 * A `th` element's `scope`, when written.
 */
export const ThScope = relation("ThScope", { node: uuid, value: str.regex(patterns.scope) }, [
  "node",
]);

/**
 * A `th` element's `abbr`, when written.
 */
export const ThAbbr = relation(
  "ThAbbr",
  { node: uuid, value: str.regex(patterns.xsString, patterns.xsStringFlags) },
  ["node"],
);

/**
 * A `th` element's `axis`, when written.
 */
export const ThAxis = relation(
  "ThAxis",
  { node: uuid, value: str.regex(patterns.xsString, patterns.xsStringFlags) },
  ["node"],
);

/**
 * A `th` element's `rowspan`, when written.
 */
export const ThRowspan = relation(
  "ThRowspan",
  { node: uuid, value: str.regex(patterns.positiveInteger) },
  ["node"],
);

/**
 * A `th` element's `colspan`, when written.
 */
export const ThColspan = relation(
  "ThColspan",
  { node: uuid, value: str.regex(patterns.positiveInteger) },
  ["node"],
);

/**
 * A `th` element's `align`, when written.
 */
export const ThAlign = relation("ThAlign", { node: uuid, value: str.regex(patterns.align) }, [
  "node",
]);

/**
 * A `th` element's `valign`, when written.
 */
export const ThValign = relation("ThValign", { node: uuid, value: str.regex(patterns.valign) }, [
  "node",
]);

/**
 * The arms, keyed by their `NodeKind` handles.
 */
export const arms = {
  br: Br,
  caption: Caption,
  col: Col,
  colgroup: Colgroup,
  details: Details,
  dl: Dl,
  figcaption: Figcaption,
  figure: Figure,
  hr: Hr,
  ol: Ol,
  rtc: Rtc,
  ruby: Ruby,
  table: Table,
  tbody: Tbody,
  td: Td,
  tfoot: Tfoot,
  th: Th,
  thead: Thead,
  tr: Tr,
  ul: Ul,
};

/**
 * The relations of this module, as schema members.
 */
export const relations = {
  Br,
  Caption,
  Col,
  ColSpan,
  Colgroup,
  ColgroupSpan,
  Details,
  DetailsOpen,
  Dl,
  Figcaption,
  Figure,
  Hr,
  Ol,
  Rtc,
  Ruby,
  Table,
  TableSummary,
  Tbody,
  Td,
  TdAbbr,
  TdAlign,
  TdAxis,
  TdColspan,
  TdRowspan,
  TdScope,
  TdValign,
  Tfoot,
  Th,
  ThAbbr,
  ThAlign,
  ThAxis,
  ThColspan,
  ThRowspan,
  ThScope,
  ThValign,
  Thead,
  Tr,
  Ul,
};

/**
 * The statements over this module's relations. An optional attribute belongs to its arm. The
 * capacities count a selected child kind of the parent: a table holds at most one `caption`,
 * `thead` and `tfoot`; a `details` holds one `summary`; a `colgroup` that writes `span` holds
 * no `col` (spec 4.8, rule 12).
 */
export const rules = [
  contained(on(TableSummary, "node"), on(Table, "id")),
  contained(on(ColSpan, "node"), on(Col, "id")),
  contained(on(ColgroupSpan, "node"), on(Colgroup, "id")),
  contained(on(DetailsOpen, "node"), on(Details, "id")),
  contained(on(TdScope, "node"), on(Td, "id")),
  contained(on(TdAbbr, "node"), on(Td, "id")),
  contained(on(TdAxis, "node"), on(Td, "id")),
  contained(on(TdRowspan, "node"), on(Td, "id")),
  contained(on(TdColspan, "node"), on(Td, "id")),
  contained(on(TdAlign, "node"), on(Td, "id")),
  contained(on(TdValign, "node"), on(Td, "id")),
  contained(on(ThScope, "node"), on(Th, "id")),
  contained(on(ThAbbr, "node"), on(Th, "id")),
  contained(on(ThAxis, "node"), on(Th, "id")),
  contained(on(ThRowspan, "node"), on(Th, "id")),
  contained(on(ThColspan, "node"), on(Th, "id")),
  contained(on(ThAlign, "node"), on(Th, "id")),
  contained(on(ThValign, "node"), on(Th, "id")),
  capacity(on(Table, "id"), {
    from: on(select(node.Edge, { childKind: "caption" }), "parent"),
    within: within(0n, 1n),
  }),
  capacity(on(Table, "id"), {
    from: on(select(node.Edge, { childKind: "thead" }), "parent"),
    within: within(0n, 1n),
  }),
  capacity(on(Table, "id"), {
    from: on(select(node.Edge, { childKind: "tfoot" }), "parent"),
    within: within(0n, 1n),
  }),
  capacity(on(Details, "id"), {
    from: on(select(node.Edge, { childKind: "summary" }), "parent"),
    within: within(1n, 1n),
  }),
  capacity(on(ColgroupSpan, "node"), {
    from: on(select(node.Edge, { childKind: "col" }), "parent"),
    within: within(0n, 0n),
  }),
] as const;

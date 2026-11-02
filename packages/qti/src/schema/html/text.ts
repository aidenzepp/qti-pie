/**
 * The text, flow and phrasing elements of the HTML profile (spec 4.8, unit V04): 46 arms.
 *
 * An arm carries a column only for an own attribute that is required; an own optional attribute is
 * a row of its own relation. The global families and ARIA belong to `attributes.ts` and
 * `aria.ts`, and appear on no arm here. The arms' containments into `Node` are expanded by
 * `alternatives` in the composed schema, not written here.
 */
import { contained, on, relation, str, uuid } from "@bjornpagen/grizzle";
import * as patterns from "#qti/schema/patterns.ts";

/**
 * An `a` element: `href` is an `xs:anyURI`, judged on the collapsed value, and required.
 */
export const A = relation("A", { href: str.regex(patterns.anyUri), id: uuid }, ["id"]);

/**
 * An `abbr` element.
 */
export const Abbr = relation("Abbr", { id: uuid }, ["id"]);

/**
 * An `acronym` element.
 */
export const Acronym = relation("Acronym", { id: uuid }, ["id"]);

/**
 * An `address` element.
 */
export const Address = relation("Address", { id: uuid }, ["id"]);

/**
 * An `article` element.
 */
export const Article = relation("Article", { id: uuid }, ["id"]);

/**
 * An `aside` element.
 */
export const Aside = relation("Aside", { id: uuid }, ["id"]);

/**
 * A `b` element.
 */
export const B = relation("B", { id: uuid }, ["id"]);

/**
 * A `bdi` element.
 */
export const Bdi = relation("Bdi", { id: uuid }, ["id"]);

/**
 * A `bdo` element; its optional attributes are rows of their own relations.
 */
export const Bdo = relation("Bdo", { id: uuid }, ["id"]);

/**
 * A `big` element.
 */
export const Big = relation("Big", { id: uuid }, ["id"]);

/**
 * A `blockquote` element; its optional attributes are rows of their own relations.
 */
export const Blockquote = relation("Blockquote", { id: uuid }, ["id"]);

/**
 * A `cite` element.
 */
export const Cite = relation("Cite", { id: uuid }, ["id"]);

/**
 * A `code` element.
 */
export const Code = relation("Code", { id: uuid }, ["id"]);

/**
 * A `dd` element.
 */
export const Dd = relation("Dd", { id: uuid }, ["id"]);

/**
 * A `dfn` element.
 */
export const Dfn = relation("Dfn", { id: uuid }, ["id"]);

/**
 * A `div` element.
 */
export const Div = relation("Div", { id: uuid }, ["id"]);

/**
 * A `dt` element.
 */
export const Dt = relation("Dt", { id: uuid }, ["id"]);

/**
 * An `em` element.
 */
export const Em = relation("Em", { id: uuid }, ["id"]);

/**
 * A `footer` element.
 */
export const Footer = relation("Footer", { id: uuid }, ["id"]);

/**
 * An `h1` element.
 */
export const H1 = relation("H1", { id: uuid }, ["id"]);

/**
 * A `h2` element.
 */
export const H2 = relation("H2", { id: uuid }, ["id"]);

/**
 * A `h3` element.
 */
export const H3 = relation("H3", { id: uuid }, ["id"]);

/**
 * A `h4` element.
 */
export const H4 = relation("H4", { id: uuid }, ["id"]);

/**
 * A `h5` element.
 */
export const H5 = relation("H5", { id: uuid }, ["id"]);

/**
 * A `h6` element.
 */
export const H6 = relation("H6", { id: uuid }, ["id"]);

/**
 * A `header` element.
 */
export const Header = relation("Header", { id: uuid }, ["id"]);

/**
 * An `i` element.
 */
export const I = relation("I", { id: uuid }, ["id"]);

/**
 * A `kbd` element.
 */
export const Kbd = relation("Kbd", { id: uuid }, ["id"]);

/**
 * A `label` element.
 */
export const Label = relation("Label", { id: uuid }, ["id"]);

/**
 * A `li` element.
 */
export const Li = relation("Li", { id: uuid }, ["id"]);

/**
 * A `nav` element.
 */
export const Nav = relation("Nav", { id: uuid }, ["id"]);

/**
 * A `pre` element.
 */
export const Pre = relation("Pre", { id: uuid }, ["id"]);

/**
 * A `q` element; its optional attributes are rows of their own relations.
 */
export const Q = relation("Q", { id: uuid }, ["id"]);

/**
 * A `rb` element.
 */
export const Rb = relation("Rb", { id: uuid }, ["id"]);

/**
 * A `rp` element.
 */
export const Rp = relation("Rp", { id: uuid }, ["id"]);

/**
 * A `rt` element.
 */
export const Rt = relation("Rt", { id: uuid }, ["id"]);

/**
 * A `samp` element.
 */
export const Samp = relation("Samp", { id: uuid }, ["id"]);

/**
 * A `section` element.
 */
export const Section = relation("Section", { id: uuid }, ["id"]);

/**
 * A `small` element.
 */
export const Small = relation("Small", { id: uuid }, ["id"]);

/**
 * A `span` element.
 */
export const Span = relation("Span", { id: uuid }, ["id"]);

/**
 * A `strong` element.
 */
export const Strong = relation("Strong", { id: uuid }, ["id"]);

/**
 * A `sub` element.
 */
export const Sub = relation("Sub", { id: uuid }, ["id"]);

/**
 * A `summary` element.
 */
export const Summary = relation("Summary", { id: uuid }, ["id"]);

/**
 * A `sup` element.
 */
export const Sup = relation("Sup", { id: uuid }, ["id"]);

/**
 * A `tt` element.
 */
export const Tt = relation("Tt", { id: uuid }, ["id"]);

/**
 * A `var` element.
 */
export const Var = relation("Var", { id: uuid }, ["id"]);

/**
 * An `a` element's `type`, when written.
 */
export const AType = relation("AType", { node: uuid, value: str.regex(patterns.mimeType) }, [
  "node",
]);

/**
 * An `bdo` element's `title`, when written.
 */
export const BdoTitle = relation(
  "BdoTitle",
  { node: uuid, value: str.regex(patterns.xsString, patterns.xsStringFlags) },
  ["node"],
);

/**
 * An `blockquote` element's `cite`, when written.
 */
export const BlockquoteCite = relation(
  "BlockquoteCite",
  { node: uuid, value: str.regex(patterns.anyUri) },
  ["node"],
);

/**
 * An `q` element's `cite`, when written.
 */
export const QCite = relation("QCite", { node: uuid, value: str.regex(patterns.anyUri) }, ["node"]);

/**
 * The arms, keyed by their `NodeKind` handles.
 */
export const arms = {
  a: A,
  abbr: Abbr,
  acronym: Acronym,
  address: Address,
  article: Article,
  aside: Aside,
  b: B,
  bdi: Bdi,
  bdo: Bdo,
  big: Big,
  blockquote: Blockquote,
  cite: Cite,
  code: Code,
  dd: Dd,
  dfn: Dfn,
  div: Div,
  dt: Dt,
  em: Em,
  footer: Footer,
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  h5: H5,
  h6: H6,
  header: Header,
  i: I,
  kbd: Kbd,
  label: Label,
  li: Li,
  nav: Nav,
  pre: Pre,
  q: Q,
  rb: Rb,
  rp: Rp,
  rt: Rt,
  samp: Samp,
  section: Section,
  small: Small,
  span: Span,
  strong: Strong,
  sub: Sub,
  summary: Summary,
  sup: Sup,
  tt: Tt,
  var: Var,
};

/**
 * The relations of this module, as schema members.
 */
export const relations = {
  A,
  AType,
  Abbr,
  Acronym,
  Address,
  Article,
  Aside,
  B,
  Bdi,
  Bdo,
  BdoTitle,
  Big,
  Blockquote,
  BlockquoteCite,
  Cite,
  Code,
  Dd,
  Dfn,
  Div,
  Dt,
  Em,
  Footer,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Header,
  I,
  Kbd,
  Label,
  Li,
  Nav,
  Pre,
  Q,
  QCite,
  Rb,
  Rp,
  Rt,
  Samp,
  Section,
  Small,
  Span,
  Strong,
  Sub,
  Summary,
  Sup,
  Tt,
  Var,
};

/**
 * The statements over this module's relations: an optional attribute belongs to its arm.
 */
export const rules = [
  contained(on(AType, "node"), on(A, "id")),
  contained(on(BdoTitle, "node"), on(Bdo, "id")),
  contained(on(BlockquoteCite, "node"), on(Blockquote, "id")),
  contained(on(QCite, "node"), on(Q, "id")),
] as const;

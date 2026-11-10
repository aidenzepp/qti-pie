/**
 * MathML validity (I-18, issue m3e-05b): the structural rules of the MathML 3 Recommendation that
 * the reading "MathML validity is the MathML 3 Recommendation" (`docs/spec-readings.md`, reading 2)
 * enforces where they are unambiguous, checked over the tree `#plate/content/mathml.ts` builds, so
 * an item whose MathML breaks one is refused by `open` and MathML that keeps every rule opens
 * accepted exactly as issue m3e-05 left it.
 *
 * The rules checked, each one line of the reading's first list, with the section of MathML 3 the
 * refusal's detail names:
 *
 * 1. `bvar` holds one annotated variable and at most one `degree`, in either order (§4.2.6.2);
 *    `piecewise` holds at most one `otherwise` (§4.4.1.9).
 * 2. In `apply`, `bind`, `lambda`, `set`, `list`, `vector`, `matrix` and `matrixrow`, an `interval`
 *    that a qualifier follows is a qualifier, otherwise an argument; this only shapes rule 10's
 *    count.
 * 3. `annotation-xml` holds no text other than white space (§5.2.3).
 * 4. A `semantics` that stands where a content expression does has a content expression as its first
 *    child; a bound variable's has `ci` or another `semantics` (§5.2.1).
 * 5. `math` is the one root: no `math` inside another, foreign content included (§2.2).
 * 6. The notation types of §2.1.5.1 over the XSD's: no `+` in `length`, `columnspan`, `rowspan`,
 *    `selection`, `position`, `shift`, `index` and `scriptsizemultiplier`, white space collapsed;
 *    `scriptlevel` keeps its sign; `cn`'s `base` is a positive decimal integer without a sign
 *    (§4.2.1.3).
 * 7. `mscarries` is not the last child of an `mstack` or `mlongdiv` (§3.6.5.1).
 * 8. A `bind` holds at least one `bvar` (§4.2.6.1).
 * 9. Qualifiers in the order `bvar`, `lowlimit`, `uplimit`, `interval`, `condition`,
 *    `domainofapplication`, `degree`, `momentabout`, `logbase` (§4.3.3), and a `condition` only
 *    after a `bvar` (§4.3.3.1).
 * 10. `selector` takes at least one argument, `partialdiff` without a `bvar` two, and each operator its
 *     class's count under an `apply` that holds no qualifier but its own (§4.1.5, §4.3.4.5,
 *     §4.3.4.6; the refusal names the operator's own section); `moment` is excluded.
 * 11. An `maction`'s `selection` names one of its children (§3.7.1.1).
 * 12. An `maligngroup` inside a table cell stands only where §3.5.5.2 lets it, and the cell's first
 *     complete element is a group.
 * 13. A `share`'s `#id` names an element, and no element dominates itself (§4.2.7).
 * 14. `cn`'s content has the form its `type` implies, split at `sep`, digits read in `base` 2 to 36
 *     (§4.2.1); a `hexdouble` holds exactly 16 hexadecimal digits in either case (R6-hexdouble).
 * 15. `xref` names an `id` (§2.1.6).
 * 16. An element whose RelaxNG content is `empty` admits white-space text and nothing else (§2, "The
 *     RelaxNG Schema is normative").
 *
 * Three rows close the bypasses the security review of the render issue found
 * (`aidenzepp/qti-pie#201`), by refusal, since the render is issue m3e-05's and this module reads
 * the tree only: the subtree holds MathML 3's elements and nothing else outside `annotation-xml`
 * (Appendix A, the RelaxNG, whose `anyElement` stands only in `annotation-xml`), so no descendant
 * reaches the page as an HTML element of its local name; a URL-bearing attribute (`href`, `src`,
 * `altimg`, `definitionURL`, `cdbase`) is refused where the body path's scheme filter
 * (`classifyUrl` in `#plate/model/url.ts`) would drop it, and kept as written where it keeps it;
 * and `style` is refused, as the body path refuses it on an HTML element (`unknown-attribute`).
 * The body path drops a bad URL with a notice and keeps the element; the refusal here is the
 * stricter handling, the only one a module that does not render can give.
 *
 * Not checked, as the reading records them as limits: `indenttarget` as a reference, the cells a
 * `rowspan` or `columnspan` covers, a space inside an `mpadded` length, `mglyph`'s `src` and `alt`
 * as required, and every rule that turns on what an expression means (a `sum`'s or `product`'s
 * last argument, the coordinate names of `divergence`, `grad`, `curl` and `laplacian`,
 * `definitionURL` and `cd` naming a definition). Two further limits are this module's own: the ids
 * a `share` or an `xref` may name are the island's, the `math` element's own tree and the body
 * content of its `annotation-xml`s, since the tree carries no other element of the document, so a
 * reference into another island is refused; and a `math` nested inside another body module's
 * content within an `annotation-xml` is not seen through that module's node.
 *
 * Every refusal carries the rule `value-type`, the rule the content walk gives a value that does
 * not fit its type, at the `math` element's own path, since the kit resolves only elements the
 * document holds and `normalise` may have rewritten the tree; its detail names the broken rule's
 * `section`, the offending `element`'s local name, its 1-based `position` among its parent's
 * element children, and, for an attribute rule, the `attribute`. A document with several defects
 * is refused once, at the first in document order.
 *
 * This is a browser module, reached through `#plate/content/mathml.ts`, so it value-imports from
 * `effect` only `Option` (ruling OD-6).
 *
 * @module
 * @see https://www.w3.org/TR/MathML3/
 */
import { Option } from "effect";
import type { MathAnnotationXml, MathChild, MathElement, MathNode } from "#plate/content/mathml.ts";
import type { ReaderKit } from "#plate/interactions/contract.ts";
import type { BodyNode } from "#plate/model/item.ts";
import { classifyUrl } from "#plate/model/url.ts";
import type { UrlContext } from "#plate/model/url.ts";
import type { Refusal } from "#plate/validate/refusal.ts";

/**
 * A MathML element of the tree, with an `annotation-xml`'s content as body nodes.
 */
type Element = MathElement<BodyNode>;

/**
 * An `annotation-xml` of the tree.
 */
type Annotation = MathAnnotationXml<BodyNode>;

/**
 * An element child of the tree: a MathML element or an `annotation-xml`.
 */
type ElementChild = Annotation | Element;

/**
 * The facts a refusal names: the broken rule's section, the offending element and its position,
 * and the attribute at fault where one is.
 */
export interface MathDefect {
  readonly attribute?: string;
  readonly element: string;
  readonly position: number;
  readonly section: string;
}

/**
 * The presentation elements of MathML 3 (chapter 3), `semantics` and its annotations (chapter 5)
 * among them.
 */
const presentationElements: readonly string[] = [
  "math",
  "mi",
  "mn",
  "mo",
  "mtext",
  "mspace",
  "ms",
  "mglyph",
  "mrow",
  "mfrac",
  "msqrt",
  "mroot",
  "mstyle",
  "merror",
  "mpadded",
  "mphantom",
  "mfenced",
  "menclose",
  "msub",
  "msup",
  "msubsup",
  "munder",
  "mover",
  "munderover",
  "mmultiscripts",
  "mprescripts",
  "none",
  "mtable",
  "mtr",
  "mlabeledtr",
  "mtd",
  "maligngroup",
  "malignmark",
  "mstack",
  "mlongdiv",
  "msgroup",
  "msrow",
  "mscarries",
  "mscarry",
  "msline",
  "maction",
  "semantics",
  "annotation",
  "annotation-xml",
];

/**
 * The operator and constant elements of Content MathML (§4.4), each of RelaxNG content `empty`.
 */
const contentOperators: readonly string[] = [
  "inverse",
  "compose",
  "ident",
  "domain",
  "codomain",
  "image",
  "quotient",
  "factorial",
  "divide",
  "max",
  "min",
  "minus",
  "plus",
  "power",
  "rem",
  "times",
  "root",
  "gcd",
  "and",
  "or",
  "xor",
  "not",
  "implies",
  "forall",
  "exists",
  "abs",
  "conjugate",
  "arg",
  "real",
  "imaginary",
  "lcm",
  "floor",
  "ceiling",
  "eq",
  "neq",
  "gt",
  "lt",
  "geq",
  "leq",
  "equivalent",
  "approx",
  "factorof",
  "int",
  "diff",
  "partialdiff",
  "divergence",
  "grad",
  "curl",
  "laplacian",
  "union",
  "intersect",
  "in",
  "notin",
  "subset",
  "prsubset",
  "notsubset",
  "notprsubset",
  "setdiff",
  "card",
  "cartesianproduct",
  "sum",
  "product",
  "limit",
  "tendsto",
  "exp",
  "ln",
  "log",
  "sin",
  "cos",
  "tan",
  "sec",
  "csc",
  "cot",
  "sinh",
  "cosh",
  "tanh",
  "sech",
  "csch",
  "coth",
  "arcsin",
  "arccos",
  "arctan",
  "arccosh",
  "arccot",
  "arccoth",
  "arccsc",
  "arccsch",
  "arcsec",
  "arcsech",
  "arcsinh",
  "arctanh",
  "mean",
  "sdev",
  "variance",
  "median",
  "mode",
  "moment",
  "determinant",
  "transpose",
  "selector",
  "vectorproduct",
  "scalarproduct",
  "outerproduct",
  "integers",
  "reals",
  "rationals",
  "naturalnumbers",
  "complexes",
  "primes",
  "exponentiale",
  "imaginaryi",
  "notanumber",
  "true",
  "false",
  "emptyset",
  "pi",
  "eulergamma",
  "infinity",
];

/**
 * The Content MathML elements that hold content (§4.2, §4.3 and the containers of §4.4), the
 * deprecated `reln`, `fn` and `declare` among them.
 */
const contentContainers: readonly string[] = [
  "cn",
  "ci",
  "csymbol",
  "cs",
  "apply",
  "bind",
  "bvar",
  "share",
  "cerror",
  "cbytes",
  "sep",
  "piecewise",
  "piece",
  "otherwise",
  "lambda",
  "domainofapplication",
  "condition",
  "lowlimit",
  "uplimit",
  "degree",
  "momentabout",
  "logbase",
  "interval",
  "set",
  "list",
  "vector",
  "matrix",
  "matrixrow",
  "reln",
  "fn",
  "declare",
];

/**
 * Every element MathML 3 defines, by local name: the one set the tree may hold outside an
 * `annotation-xml`.
 */
const mathmlElements: ReadonlySet<string> = new Set([
  ...presentationElements,
  ...contentOperators,
  ...contentContainers,
]);

/**
 * The Content MathML elements, which a content expression is one of: a `semantics` in a content
 * position has one as its first child.
 */
const contentElements: ReadonlySet<string> = new Set([
  ...contentOperators,
  ...contentContainers,
  "semantics",
]);

/**
 * The content elements whose children are content expressions, so a `semantics` directly inside
 * one stands where a content expression does.
 */
const contentPositions: ReadonlySet<string> = new Set([
  "apply",
  "bind",
  "piece",
  "otherwise",
  "lambda",
  "domainofapplication",
  "condition",
  "lowlimit",
  "uplimit",
  "degree",
  "momentabout",
  "logbase",
  "interval",
  "set",
  "list",
  "vector",
  "matrix",
  "matrixrow",
  "cerror",
  "reln",
  "fn",
  "declare",
]);

/**
 * The elements whose RelaxNG content is `empty`: the presentation ones the reading lists, `sep`,
 * `share`, and every operator and constant.
 */
const emptyElements: ReadonlySet<string> = new Set([
  "mspace",
  "mglyph",
  "none",
  "mprescripts",
  "malignmark",
  "maligngroup",
  "msline",
  "sep",
  "share",
  ...contentOperators,
]);

/**
 * The qualifiers of §4.3.3 in the order it states, `interval` among them where a qualifier follows
 * it (rule 2).
 */
const qualifierOrder: readonly string[] = [
  "bvar",
  "lowlimit",
  "uplimit",
  "interval",
  "condition",
  "domainofapplication",
  "degree",
  "momentabout",
  "logbase",
];

/**
 * The qualifiers that are never arguments, `interval` left out.
 */
const plainQualifiers: ReadonlySet<string> = new Set(
  qualifierOrder.filter((name) => name !== "interval"),
);

/**
 * An operator's argument count under `apply`, by its class (§4.3.4.5, §4.3.4.6), the qualifiers
 * its own syntax table lists (R6-head-qualifiers), and the section of that table.
 */
interface Arity {
  readonly max: number;
  readonly min: number;
  readonly own: readonly string[];
  readonly section: string;
}

/**
 * The unary operators (§4.3.4.6, "Unary operators take a single argument"), each with its section.
 * `moment` is left out: the Recommendation's own example (§4.4.8.6) applies it to five arguments.
 */
const unaryOperators: readonly (readonly [string, string])[] = [
  ["inverse", "4.4.1.2"],
  ["ident", "4.4.1.5"],
  ["domain", "4.4.1.6"],
  ["codomain", "4.4.1.7"],
  ["image", "4.4.1.8"],
  ["factorial", "4.4.2.2"],
  ["not", "4.4.2.16"],
  ["abs", "4.4.2.20"],
  ["conjugate", "4.4.2.21"],
  ["arg", "4.4.2.22"],
  ["real", "4.4.2.23"],
  ["imaginary", "4.4.2.24"],
  ["floor", "4.4.2.26"],
  ["ceiling", "4.4.2.27"],
  ["divergence", "4.4.4.4"],
  ["grad", "4.4.4.5"],
  ["curl", "4.4.4.6"],
  ["laplacian", "4.4.4.7"],
  ["card", "4.4.5.12"],
  ...["sin", "cos", "tan", "sec", "csc", "cot"].map((name) => [name, "4.4.7.1"] as const),
  ...["arcsin", "arccos", "arctan", "arcsec", "arccsc", "arccot"].map(
    (name) => [name, "4.4.7.2"] as const,
  ),
  ...["sinh", "cosh", "tanh", "sech", "csch", "coth"].map((name) => [name, "4.4.7.3"] as const),
  ...["arcsinh", "arccosh", "arctanh", "arcsech", "arccsch", "arccoth"].map(
    (name) => [name, "4.4.7.4"] as const,
  ),
  ["exp", "4.4.7.5"],
  ["ln", "4.4.7.6"],
  ["log", "4.4.7.7"],
  ["determinant", "4.4.9.4"],
  ["transpose", "4.4.9.5"],
];

/**
 * The binary operators (§4.3.4.5, "Binary operators take two arguments"), each with its section.
 */
const binaryOperators: readonly (readonly [string, string])[] = [
  ["quotient", "4.4.2.1"],
  ["divide", "4.4.2.3"],
  ["power", "4.4.2.8"],
  ["rem", "4.4.2.9"],
  ["implies", "4.4.2.17"],
  ["neq", "4.4.3.2"],
  ["equivalent", "4.4.3.7"],
  ["approx", "4.4.3.8"],
  ["factorof", "4.4.3.9"],
  ["in", "4.4.5.5"],
  ["notin", "4.4.5.6"],
  ["notsubset", "4.4.5.9"],
  ["notprsubset", "4.4.5.10"],
  ["setdiff", "4.4.5.11"],
  ["tendsto", "4.4.6.4"],
  ["vectorproduct", "4.4.9.7"],
  ["scalarproduct", "4.4.9.8"],
  ["outerproduct", "4.4.9.9"],
  ["partialdiff", "4.4.4.3"],
];

/**
 * The qualifiers each head's syntax table lists (R6-head-qualifiers): `degree` beside `root`,
 * `diff`, `partialdiff` and `moment`, `momentabout` beside `moment`, `logbase` beside `log`.
 */
const ownQualifiers: ReadonlyMap<string, readonly string[]> = new Map([
  ["diff", ["degree"]],
  ["log", ["logbase"]],
  ["moment", ["degree", "momentabout"]],
  ["partialdiff", ["degree"]],
  ["root", ["degree"]],
]);

/**
 * Each operator's arity, by local name: the unary and binary classes, `minus` (§4.4.2.6) and `root`
 * (§4.4.2.11) with one argument or two, and `selector` with one or more (§4.4.9.6).
 */
const arities: ReadonlyMap<string, Arity> = new Map(
  [
    ...unaryOperators.map(([name, section]) => [name, { max: 1, min: 1, section }] as const),
    ...binaryOperators.map(([name, section]) => [name, { max: 2, min: 2, section }] as const),
    ["minus", { max: 2, min: 1, section: "4.4.2.6" }] as const,
    ["root", { max: 2, min: 1, section: "4.4.2.11" }] as const,
    ["selector", { max: Infinity, min: 1, section: "4.4.9.6" }] as const,
  ].map(([name, arity]): readonly [string, Arity] => [
    name,
    { ...arity, own: ownQualifiers.get(name) ?? [] },
  ]),
);

/**
 * The form a part of a `cn`'s content takes (§4.2.1).
 */
type CnForm = "double" | "hexdouble" | "integer" | "real";

/**
 * What a `cn`'s `type` implies for its content, part by part (§4.2.1; R6-hexdouble); every other
 * type is text.
 */
const cnForms: ReadonlyMap<string, readonly CnForm[]> = new Map<string, readonly CnForm[]>([
  ["complex-cartesian", ["real", "real"]],
  ["complex-polar", ["real", "real"]],
  ["double", ["double"]],
  ["e-notation", ["real", "integer"]],
  ["hexdouble", ["hexdouble"]],
  ["integer", ["integer"]],
  ["rational", ["integer", "integer"]],
  ["real", ["real"]],
]);

/**
 * The notation types of §2.1.5.1 over the attributes the reading names, each the pattern of its
 * collapsed value: `unsigned-integer` for `length`, `positive-integer` for the spans, `selection`
 * and `index`, `integer` for `position` and `shift`, and `number` for `scriptsizemultiplier`.
 */
const notationAttributes: ReadonlyMap<string, RegExp> = new Map([
  ["columnspan", /^0*[1-9][0-9]*$/u],
  ["index", /^0*[1-9][0-9]*$/u],
  ["length", /^[0-9]+$/u],
  ["position", /^-?[0-9]+$/u],
  ["rowspan", /^0*[1-9][0-9]*$/u],
  ["scriptsizemultiplier", /^-?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)$/u],
  ["selection", /^0*[1-9][0-9]*$/u],
  ["shift", /^-?[0-9]+$/u],
]);

/**
 * The URL-bearing attributes of MathML 3 and the body path's context each is read in: `href`
 * (§2.1.6), `altimg` (§2.2.1), `src` (`mglyph` §3.2.1.2, `annotation` §5.2.2), `definitionURL`
 * (§4.2.3) and `cdbase` (§4.2.3.2).
 */
const urlAttributes: ReadonlyMap<string, UrlContext> = new Map([
  ["altimg", "resource"],
  ["cdbase", "link"],
  ["definitionURL", "link"],
  ["href", "link"],
  ["src", "resource"],
]);

/**
 * The elements the group of §3.5.5.2 passes through on its way to its cell, besides an `mrow` or
 * `mstyle` that changes no direction and the selected child of an `maction`.
 */
const transparentToGroups: ReadonlySet<string> = new Set(["mphantom", "mfenced", "semantics"]);

/**
 * Collapse white space as the XSD collapses it: trimmed, runs of white space one space.
 *
 * @param value The value as written.
 * @returns The collapsed value.
 */
const collapsed = (value: string): string => value.trim().replaceAll(/\s+/gu, " ");

/**
 * Read an attribute of the tree, collapsed, none when the element writes none.
 *
 * @param node The element.
 * @param name The attribute's local name.
 * @returns Its collapsed value.
 */
const attributeOf = (node: ElementChild, name: string): Option.Option<string> =>
  Option.map(
    Option.fromUndefinedOr(node.attributes.find((attribute) => attribute.name === name)),
    ({ value }) => collapsed(value),
  );

/**
 * Report whether a child is an element or an `annotation-xml`, not text.
 *
 * @param child The child.
 * @returns Whether it counts among the element children.
 */
const isElementChild = (child: MathChild<BodyNode>): child is ElementChild => child.kind !== "text";

/**
 * The element children of an element, in document order.
 *
 * @param node The element.
 * @returns Its children that are not text.
 */
const elementChildren = (node: Element): readonly ElementChild[] =>
  node.children.filter(isElementChild);

/**
 * The local name of an element child.
 *
 * @param child The child.
 * @returns `annotation-xml` for an annotation, else the element's local name.
 */
const localOf = (child: ElementChild): string =>
  child.kind === "annotation-xml" ? "annotation-xml" : child.local;

/**
 * Report whether a child is a MathML element of one local name.
 *
 * @param child The child.
 * @param local The local name.
 * @returns Whether it is an element so named.
 */
const named = (child: MathChild<BodyNode>, local: string): child is Element =>
  child.kind === "element" && child.local === local;

/**
 * The text of an element's text children, collapsed.
 *
 * @param node The element.
 * @returns Its own text, collapsed.
 */
const ownText = (node: Element): string =>
  collapsed(node.children.map((child) => (child.kind === "text" ? child.text : "")).join(""));

/**
 * The place of an element in the walk: the element itself and its 1-based position among its
 * parent's element children.
 */
interface Placed<N> {
  readonly node: N;
  readonly position: number;
}

/**
 * Place an element's element children.
 *
 * @param node The parent.
 * @returns Each element child with its position.
 */
const placedChildren = (node: Element): readonly Placed<ElementChild>[] =>
  elementChildren(node).map((child, index) => ({ node: child, position: index + 1 }));

/**
 * Construct a defect.
 *
 * @param section The section of MathML 3 the rule is in.
 * @param element The offending element's local name.
 * @param position Its position among its parent's element children.
 * @param attribute The attribute at fault, when one is.
 * @returns The defect.
 */
const defect = (
  section: string,
  element: string,
  position: number,
  attribute?: string,
): MathDefect =>
  attribute === undefined
    ? { element, position, section }
    : { attribute, element, position, section };

/**
 * The first defect among several checks, each run only until one gives a defect.
 *
 * @param checks The checks, in order.
 * @returns The first defect.
 */
const firstOf = (
  checks: readonly (() => Option.Option<MathDefect>)[],
): Option.Option<MathDefect> => {
  for (const check of checks) {
    const found = check();
    if (Option.isSome(found)) {
      return found;
    }
  }

  return Option.none();
};

/**
 * The ids of the island: each `id` on a MathML element of the tree, with its element, and each on a
 * body element of an `annotation-xml`'s content, with none.
 */
interface Ids {
  readonly elements: ReadonlyMap<string, Element>;
  readonly known: ReadonlySet<string>;
}

/**
 * Collect the ids of the body nodes an `annotation-xml` holds, at any depth through body elements.
 *
 * @param nodes The body nodes.
 * @param into The set to add to.
 */
const collectBodyIds = (nodes: readonly BodyNode[], into: Set<string>): void => {
  for (const node of nodes) {
    if (node.kind === "element") {
      const id = node.attributes.find((attribute) => attribute.name === "id");
      if (id !== undefined) {
        into.add(collapsed(id.value));
      }

      collectBodyIds(node.children, into);
    }
  }
};

/**
 * Collect the ids of the island.
 *
 * @param root The `math` element.
 * @returns The ids.
 */
const idsOf = (root: Element): Ids => {
  const elements = new Map<string, Element>();
  const known = new Set<string>();
  const visit = (node: Element): void => {
    Option.map(attributeOf(node, "id"), (id) => {
      known.add(id);
      elements.set(id, node);
    });
    for (const child of node.children) {
      if (child.kind === "element") {
        visit(child);
      } else if (child.kind === "annotation-xml") {
        collectBodyIds(child.content, known);
      }
    }
  };
  visit(root);

  return { elements, known };
};

/**
 * The fragment a `share`'s `href` names, none when it is not a same-document reference.
 *
 * @param share The `share`.
 * @returns The id after `#`.
 */
const shareTarget = (share: Element): Option.Option<string> =>
  Option.flatMap(attributeOf(share, "href"), (href) =>
    href.startsWith("#") ? Option.some(href.slice(1)) : Option.none(),
  );

/**
 * Report whether an element dominates a `share` (§4.2.7): the share is reachable from it through
 * children and through the targets of the shares below it.
 *
 * @param from The element.
 * @param share The share.
 * @param ids The island's ids.
 * @returns Whether `from` dominates the share, so the share's target dominating it is a cycle.
 */
const dominates = (from: Element, share: Element, ids: Ids): boolean => {
  const seen = new Set<Element>();
  const pending: Element[] = [from];

  while (pending.length > 0) {
    const node = pending.pop();
    if (node === undefined || seen.has(node)) {
      continue;
    }

    seen.add(node);
    if (node === share) {
      return true;
    }

    for (const child of node.children) {
      if (child.kind === "element") {
        pending.push(child);
      }
    }
    if (node.local === "share") {
      Option.map(
        Option.flatMap(shareTarget(node), (id) => Option.fromUndefinedOr(ids.elements.get(id))),
        (target) => pending.push(target),
      );
    }
  }

  return false;
};

/**
 * Check `bvar` (rule 1): one annotated variable, at most one `degree`.
 *
 * @param node The `bvar`.
 * @param position Its position.
 * @returns The defect.
 */
const checkBvar = (node: Element, position: number): Option.Option<MathDefect> => {
  const children = placedChildren(node);
  const degrees = children.filter(({ node: child }) => named(child, "degree"));
  const variables = children.filter(({ node: child }) => !named(child, "degree"));
  const [, second] = degrees;
  const [, extra] = variables;

  if (second !== undefined) {
    return Option.some(defect("4.2.6.2", "degree", second.position));
  }

  if (extra !== undefined) {
    return Option.some(defect("4.2.6.2", localOf(extra.node), extra.position));
  }

  return variables.length === 0 ? Option.some(defect("4.2.6.2", "bvar", position)) : Option.none();
};

/**
 * Check `piecewise` (rule 1): at most one `otherwise`.
 *
 * @param node The `piecewise`.
 * @returns The defect.
 */
const checkPiecewise = (node: Element): Option.Option<MathDefect> =>
  Option.map(
    Option.fromUndefinedOr(
      placedChildren(node).filter(({ node: child }) => named(child, "otherwise"))[1],
    ),
    ({ position }) => defect("4.4.1.9", "otherwise", position),
  );

/**
 * Check `bind` (rule 8): at least one `bvar`.
 *
 * @param node The `bind`.
 * @param position Its position.
 * @returns The defect.
 */
const checkBind = (node: Element, position: number): Option.Option<MathDefect> =>
  node.children.some((child) => named(child, "bvar"))
    ? Option.none()
    : Option.some(defect("4.2.6.1", "bind", position));

/**
 * Tell which element children of an `apply` or `bind`, after its head, are qualifiers (rule 2): the
 * plain qualifiers, and an `interval` that a qualifier follows.
 *
 * @param rest The element children after the head.
 * @returns For each, whether it is a qualifier.
 */
const qualifierFlags = (rest: readonly Placed<ElementChild>[]): readonly boolean[] => {
  const flags: boolean[] = [];
  let qualifierFollows = false;

  for (const placed of rest.toReversed()) {
    const local = localOf(placed.node);
    const isQualifier: boolean =
      plainQualifiers.has(local) || (local === "interval" && qualifierFollows);
    flags.unshift(isQualifier);
    qualifierFollows ||= isQualifier;
  }

  return flags;
};

/**
 * Check the qualifiers of an `apply` or `bind` (rule 9): in §4.3.3's order, the offending one the
 * first that a qualifier of an earlier rank follows, and a `condition` only after a `bvar`.
 *
 * @param rest The element children after the head.
 * @param flags Which of them are qualifiers.
 * @returns The defect.
 */
const checkQualifierOrder = (
  rest: readonly Placed<ElementChild>[],
  flags: readonly boolean[],
): Option.Option<MathDefect> => {
  const qualifiers = rest.flatMap(({ node, position }, index) =>
    flags[index] === true ? [{ position, rank: qualifierOrder.indexOf(localOf(node)) }] : [],
  );
  let boundVariable = false;

  for (const [index, { position, rank }] of qualifiers.entries()) {
    const local = qualifierOrder[rank] ?? "";
    if (qualifiers.slice(index + 1).some((later) => later.rank < rank)) {
      return Option.some(defect("4.3.3", local, position));
    }

    if (local === "condition" && !boundVariable) {
      return Option.some(defect("4.3.3.1", local, position));
    }

    boundVariable ||= local === "bvar";
  }

  return Option.none();
};

/**
 * Check an `apply`'s argument count (rule 10): its operator's class, under an `apply` that holds no
 * qualifier but the operator's own.
 *
 * @param node The `apply`.
 * @param position Its position.
 * @param rest The element children after the operator.
 * @param flags Which of them are qualifiers.
 * @returns The defect.
 */
const checkArity = (
  node: Element,
  position: number,
  rest: readonly Placed<ElementChild>[],
  flags: readonly boolean[],
): Option.Option<MathDefect> => {
  const [head] = elementChildren(node);
  const arity = head === undefined ? undefined : arities.get(localOf(head));
  if (arity === undefined) {
    return Option.none();
  }

  const qualifiers = rest.filter((_, index) => flags[index] === true);
  if (qualifiers.some(({ node: child }) => !arity.own.includes(localOf(child)))) {
    return Option.none();
  }

  const count = rest.length - qualifiers.length;

  return count >= arity.min && count <= arity.max
    ? Option.none()
    : Option.some(defect(arity.section, "apply", position));
};

/**
 * Check `maction` (rule 11): `selection`, 1 when absent, names one of its children.
 *
 * @param node The `maction`.
 * @param position Its position.
 * @returns The defect.
 */
const checkMaction = (node: Element, position: number): Option.Option<MathDefect> => {
  const children = elementChildren(node).length;
  const selection = Option.getOrElse(attributeOf(node, "selection"), () => "1");
  const selected = /^[0-9]+$/u.test(selection) ? Number(selection) : Number.NaN;

  return children === 0 || selected > children
    ? Option.some(defect("3.7.1.1", "maction", position))
    : Option.none();
};

/**
 * Check an `mstack` or `mlongdiv` (rule 7): `mscarries` is not its last element child.
 *
 * @param node The `mstack` or `mlongdiv`.
 * @returns The defect.
 */
const checkCarries = (node: Element): Option.Option<MathDefect> => {
  const last = placedChildren(node).at(-1);

  return last !== undefined && named(last.node, "mscarries")
    ? Option.some(defect("3.6.5.1", "mscarries", last.position))
    : Option.none();
};

/**
 * Check a `semantics` (rule 4) by where it stands: in a content position its first child is a
 * content expression; in a `bvar`, `ci` or another `semantics`.
 *
 * @param node The `semantics`.
 * @param position Its position.
 * @param parent The parent's local name, none for the `math` element.
 * @returns The defect.
 */
const checkSemantics = (
  node: Element,
  position: number,
  parent: string | undefined,
): Option.Option<MathDefect> => {
  if (parent === undefined) {
    return Option.none();
  }

  const [first] = elementChildren(node);
  const local = first === undefined ? "" : localOf(first);
  const fits =
    parent === "bvar"
      ? local === "ci" || local === "semantics"
      : !contentPositions.has(parent) || contentElements.has(local);

  return fits ? Option.none() : Option.some(defect("5.2.1", "semantics", position));
};

/**
 * Split a `cn`'s content into parts at its `sep` children (§4.2.1), each part's text collapsed,
 * and unjudged when it holds an element other than `sep`.
 *
 * @param node The `cn`.
 * @returns Its parts.
 */
const cnParts = (node: Element): readonly { readonly judged: boolean; readonly text: string }[] => {
  const parts: { judged: boolean; text: string }[] = [];
  let current = { judged: true, text: "" };

  for (const child of node.children) {
    if (named(child, "sep")) {
      parts.push(current);
      current = { judged: true, text: "" };
    } else if (child.kind === "text") {
      current.text += child.text;
    } else {
      current.judged = false;
    }
  }
  parts.push(current);

  return parts.map(({ judged, text }) => ({ judged, text: collapsed(text) }));
};

/**
 * The pattern of a `cn` part's form over its collapsed text (§4.2.1; R6-hexdouble): a hexdouble is
 * sixteen hexadecimal digits, a double the `xs:double` lexical space, an integer an optional sign
 * and digits of the base, a real those digits with at most one point.
 *
 * @param form The form.
 * @param base The base, read from `base`.
 * @returns The pattern, none for an integer or real whose base is outside 2 to 36.
 */
const cnPattern = (form: CnForm, base: number): Option.Option<RegExp> => {
  if (form === "hexdouble") {
    return Option.some(/^[0-9A-Fa-f]{16}$/u);
  }

  if (form === "double") {
    return Option.some(
      /^(?:[+-]?(?:[0-9]+(?:\.[0-9]*)?|\.[0-9]+)(?:[Ee][+-]?[0-9]+)?|[+-]?INF|NaN)$/u,
    );
  }

  if (!Number.isInteger(base) || base < 2 || base > 36) {
    return Option.none();
  }

  const last = String.fromCodePoint(86 + base);
  const digit = base <= 10 ? `[0-${String(base - 1)}]` : `[0-9a-${last}A-${last.toUpperCase()}]`;

  return Option.some(
    new RegExp(
      form === "integer"
        ? `^[+-]?${digit}+$`
        : `^[+-]?(?:${digit}+(?:\\.${digit}*)?|\\.${digit}+)$`,
      "u",
    ),
  );
};

/**
 * Check a `cn` (rule 14): its content has the form its `type` implies, part by part.
 *
 * @param node The `cn`.
 * @param position Its position.
 * @returns The defect.
 */
const checkCn = (node: Element, position: number): Option.Option<MathDefect> => {
  const forms = cnForms.get(Option.getOrElse(attributeOf(node, "type"), () => "real"));
  if (forms === undefined) {
    return Option.none();
  }

  const parts = cnParts(node);
  if (parts.length !== forms.length) {
    return Option.some(defect("4.2.1", "cn", position));
  }

  const base = Option.getOrElse(attributeOf(node, "base"), () => "10");
  const radix = /^[0-9]+$/u.test(base) ? Number(base) : Number.NaN;
  const wrong = parts.some(
    ({ judged, text }, index) =>
      judged &&
      Option.exists(cnPattern(forms[index] ?? "real", radix), (pattern) => !pattern.test(text)),
  );

  return wrong ? Option.some(defect("4.2.1", "cn", position)) : Option.none();
};

/**
 * Check an element's attributes: `style` (refused as the body path refuses it), a URL the body
 * path's scheme filter would drop, a notation-typed value outside §2.1.5.1, and `cn`'s `base`.
 *
 * @param node The element.
 * @param position Its position.
 * @returns The defect.
 */
const checkAttributes = (node: ElementChild, position: number): Option.Option<MathDefect> => {
  const local = localOf(node);

  for (const { name, value } of node.attributes) {
    if (name === "style") {
      return Option.some(defect("2.1.6", local, position, name));
    }

    const context = urlAttributes.get(name);
    if (context !== undefined && classifyUrl(context, value).kind === "dropped") {
      return Option.some(defect("2.1.6", local, position, name));
    }

    const notation = notationAttributes.get(name);
    if (notation !== undefined && !notation.test(collapsed(value))) {
      return Option.some(defect("2.1.5.1", local, position, name));
    }

    if (local === "cn" && name === "base" && !/^0*[1-9][0-9]*$/u.test(collapsed(value))) {
      return Option.some(defect("4.2.1.3", local, position, name));
    }
  }

  return Option.none();
};

/**
 * The direction in effect at an element: its own `dir` when `ltr` or `rtl`, else the inherited
 * one, `ltr` at the `math` element (§2.2.1, §3.1.5.1).
 *
 * @param node The element.
 * @param inherited The direction its parent passes it.
 * @returns The direction below it.
 */
const directionAt = (node: ElementChild, inherited: "ltr" | "rtl"): "ltr" | "rtl" => {
  const written = attributeOf(node, "dir");

  return Option.isSome(written) && (written.value === "ltr" || written.value === "rtl")
    ? written.value
    : inherited;
};

/**
 * One ancestor on the way from a cell down to a group: the element, the direction it inherits, and
 * the position of the child the path continues through.
 */
interface Step {
  readonly inherited: "ltr" | "rtl";
  readonly node: Element;
  readonly through: number;
}

/**
 * Tell whether a step on the way down from a cell lets an alignment group through (§3.5.5.2).
 *
 * @param step The step.
 * @returns Whether a group below it still stands in the cell.
 */
const letsThrough = ({ inherited, node, through }: Step): boolean => {
  if (node.local === "mrow" || node.local === "mstyle") {
    return directionAt(node, inherited) === inherited;
  }

  if (node.local === "maction") {
    const selection = Option.getOrElse(attributeOf(node, "selection"), () => "1");

    return /^[0-9]+$/u.test(selection) && Number(selection) === through;
  }

  return transparentToGroups.has(node.local);
};

/**
 * The groups of a cell and where each stands, and the cell's complete elements.
 */
interface CellContent {
  readonly groups: readonly { readonly position: number; readonly stopper: string | undefined }[];
  readonly leaves: readonly ElementChild[];
}

/**
 * Collect a cell's alignment groups, each with the first element between it and the cell that
 * stops it (none where it stands), and its complete elements, in document order. A nested `mtd` is
 * another cell's and is not entered; a group under an unselected `maction` child is not judged.
 *
 * @param cell The `mtd`.
 * @param inherited The direction the cell inherits.
 * @returns What the cell holds.
 */
const contentOfCell = (cell: Element, inherited: "ltr" | "rtl"): CellContent => {
  const groups: { position: number; stopper: string | undefined }[] = [];
  const leaves: ElementChild[] = [];
  const visit = (parent: Element, direction: "ltr" | "rtl", path: readonly Step[]): void => {
    for (const { node, position } of placedChildren(parent)) {
      if (named(node, "mtd")) {
        continue;
      }

      const steps = path.map((step, index) =>
        index === path.length - 1 ? { ...step, through: position } : step,
      );
      if (named(node, "maligngroup")) {
        const shown = steps.every((step) => step.node.local !== "maction" || letsThrough(step));
        if (shown) {
          groups.push({ position, stopper: steps.find((step) => !letsThrough(step))?.node.local });
        }
      }

      if (node.kind === "annotation-xml" || elementChildren(node).length === 0) {
        leaves.push(node);
      } else {
        visit(node, directionAt(node, direction), [
          ...steps,
          { inherited: direction, node, through: 0 },
        ]);
      }
    }
  };
  visit(cell, directionAt(cell, inherited), []);

  return { groups, leaves };
};

/**
 * Check a table cell (rule 12): each group below it stands where §3.5.5.2 lets it, and, where a
 * group stands, the cell's first complete element is a group.
 *
 * @param cell The `mtd`.
 * @param position Its position.
 * @param inherited The direction it inherits.
 * @returns The defect.
 */
const checkCell = (
  cell: Element,
  position: number,
  inherited: "ltr" | "rtl",
): Option.Option<MathDefect> => {
  const { groups, leaves } = contentOfCell(cell, inherited);
  const stopped = groups.find(({ stopper }) => stopper !== undefined);
  if (stopped !== undefined) {
    return Option.some(defect("3.5.5.2", "maligngroup", stopped.position));
  }

  const [first] = leaves;

  return groups.some(({ stopper }) => stopper === undefined) &&
    first !== undefined &&
    !named(first, "maligngroup")
    ? Option.some(defect("3.5.5.2", "mtd", position))
    : Option.none();
};

/**
 * Check the body nodes an `annotation-xml` holds (rules 3 and 5): no text other than white space
 * directly inside it, and no `math` at any depth through body elements.
 *
 * @param annotation The `annotation-xml`.
 * @param position Its position.
 * @returns The defect.
 */
const checkAnnotation = (annotation: Annotation, position: number): Option.Option<MathDefect> => {
  if (annotation.content.some((node) => node.kind === "text" && node.text.trim() !== "")) {
    return Option.some(defect("5.2.3", "annotation-xml", position));
  }

  const nestedMath = (nodes: readonly BodyNode[]): Option.Option<MathDefect> => {
    const elements = nodes.filter((node) => node.kind === "element" || node.kind === "content");

    for (const [index, node] of elements.entries()) {
      if (node.kind === "content" && node.element === "math") {
        return Option.some(defect("2.2", "math", index + 1));
      }

      if (node.kind === "element") {
        const below = nestedMath(node.children);
        if (Option.isSome(below)) {
          return below;
        }
      }
    }

    return Option.none();
  };

  return nestedMath(annotation.content);
};

/**
 * Walk one element of the tree and everything below it, in document order, giving the first
 * defect.
 *
 * @param node The element.
 * @param position Its position among its parent's element children.
 * @param parent The parent's local name, none for the `math` element.
 * @param inherited The direction the parent passes it.
 * @param ids The island's ids.
 * @returns The first defect at or below the element.
 */
const walk = (
  node: Element,
  position: number,
  parent: string | undefined,
  inherited: "ltr" | "rtl",
  ids: Ids,
): Option.Option<MathDefect> => {
  const children = placedChildren(node);
  const [, ...rest] = children;
  const flags = qualifierFlags(rest);
  const own = firstOf([
    () =>
      mathmlElements.has(node.local)
        ? Option.none()
        : Option.some(defect("A.2", node.local, position)),
    () =>
      parent !== undefined && node.local === "math"
        ? Option.some(defect("2.2", "math", position))
        : Option.none(),
    () => checkAttributes(node, position),
    () =>
      emptyElements.has(node.local) && (children.length > 0 || ownText(node) !== "")
        ? Option.some(defect("2", node.local, position))
        : Option.none(),
    () =>
      Option.isSome(attributeOf(node, "xref")) &&
      !Option.exists(attributeOf(node, "xref"), (id) => ids.known.has(id))
        ? Option.some(defect("2.1.6", node.local, position, "xref"))
        : Option.none(),
    () => {
      switch (node.local) {
        case "apply": {
          return firstOf([
            () => checkQualifierOrder(rest, flags),
            () => checkArity(node, position, rest, flags),
          ]);
        }
        case "bind": {
          return firstOf([() => checkBind(node, position), () => checkQualifierOrder(rest, flags)]);
        }
        case "bvar": {
          return checkBvar(node, position);
        }
        case "cn": {
          return checkCn(node, position);
        }
        case "maction": {
          return checkMaction(node, position);
        }
        case "mlongdiv":
        case "mstack": {
          return checkCarries(node);
        }
        case "mtd": {
          return checkCell(node, position, inherited);
        }
        case "piecewise": {
          return checkPiecewise(node);
        }
        case "semantics": {
          return checkSemantics(node, position, parent);
        }
        case "share": {
          return Option.match(shareTarget(node), {
            onNone: () => Option.none(),
            onSome: (id) => {
              const target = ids.elements.get(id);

              return target === undefined || dominates(target, node, ids)
                ? Option.some(defect("4.2.7", "share", position))
                : Option.none();
            },
          });
        }
        default: {
          return Option.none();
        }
      }
    },
  ]);
  if (Option.isSome(own)) {
    return own;
  }

  const direction = directionAt(node, inherited);
  for (const { node: child, position: at } of children) {
    const below =
      child.kind === "annotation-xml"
        ? firstOf([() => checkAttributes(child, at), () => checkAnnotation(child, at)])
        : walk(child, at, node.local, direction, ids);
    if (Option.isSome(below)) {
      return below;
    }
  }

  return Option.none();
};

/**
 * Find the first defect of a `math` element's tree, in document order, by the rules this module
 * lists.
 *
 * @param tree The `math` element as `#plate/content/mathml.ts`'s `parse` built it.
 * @returns The first defect, none when the tree keeps every rule.
 */
const defectOf = (tree: MathNode): Option.Option<MathDefect> =>
  walk(tree, 1, undefined, "ltr", idsOf(tree));

/**
 * Check a `math` element's tree against the MathML 3 Recommendation's structural rules (I-18, issue
 * m3e-05b) and give the refusal for the first defect, if any: the rule `value-type` at the `math`
 * element's path, its detail the defect's `section`, `element`, `position` and, for an attribute
 * rule, `attribute`.
 *
 * @param tree The `math` element as `parse` built it, `mfenced` already rewritten.
 * @param read The kit the element is read with, whose `refusal` constructs the refusal.
 * @param path The `math` element's path.
 * @returns The refusal, none when the tree keeps every rule.
 */
export const checkMathml = (
  tree: MathNode,
  read: ReaderKit,
  path: string,
): Option.Option<Refusal> =>
  Option.map(defectOf(tree), ({ attribute, element, position, section }) => {
    const facts = { element, position: String(position), section };

    return read.refusal(
      "value-type",
      path,
      attribute === undefined ? facts : { ...facts, attribute },
    );
  });

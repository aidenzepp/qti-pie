/**
 * The MathML 3 vocabulary: the 193 elements of the MathML 3 XSD that the ASI XSDs import, in the
 * MathML namespace, with the attribute names they introduce, their registry rows, their admission
 * rows, their attribute wildcard and the rules of MathML these rows do not state.
 *
 * The source is the XSD (DESIGN D12): the derived inventory `inventory/mathml.ts`, which
 * `node src/vocab/derive/derive.ts mathml` prints from `mathml/mathml3.xsd` and the four documents
 * it includes. Spec reading 2 makes the MathML 3 RelaxNG schema and the Recommendation's prose the
 * measure of validity; how they differ from the XSD is recorded as unknown in {@link gaps}.
 *
 * Handles are the element names prefixed `m:`, as `xi:include` is prefixed, because several local
 * names (`set`, `list`, `max`, `min`, `sum`, `abs`, …) are also QTI or HTML names. The kinds are
 * in the order of the XSD's documents: the common document's 4 (`m:math`, `m:annotation`,
 * `m:annotation-xml`, `m:semantics`), then presentation's 40, content's 140 and strict content's 9,
 * each in document order; the inventory lists them by handle.
 *
 * Admission, the same in both schema versions, reads each kind's inventory entry by the rules of
 * `kinds/asi.ts`:
 *
 * - A kind's element children are its entry's `children`, each once. Every child the MathML XSD
 *   references is a MathML kind, and no MathML content model references a QTI or HTML element.
 * - The content type adds the character kinds: a mixed type adds `text`, `ws`, `entityRef`, `comment`
 *   and `pi`; an element-only type `ws`, `comment` and `pi`; an empty type `comment` and `pi`.
 *   `m:cbytes` has simple content, base64 text alone, so it adds a mixed type's five.
 *   `m:annotation-xml`'s content is one element of any namespace (an `xs:any` wildcard), so it is
 *   element-only, though no named child is admitted under it ({@link gaps}).
 * - `m:math` is admitted under every host whose inventory entry references the ASI XSDs' `m3:math`
 *   ({@link mathHostRows}). Over today's composition that is 63 kinds, the HTML and ASI hosts. The
 *   XSD's hosts are 61 elements in 34 content types, in 3.0.0 and 3.0.1 alike, and five of those
 *   (element, type) pairs ({@link pendingHosts}) are kinds the test vocabulary adds, whose rows the
 *   same function gives once that vocabulary is composed.
 */
import { Array as Arr, Option, Order } from "effect";

import { inventory } from "#pantry/schema/content/xsd-inventory.ts";
import type { InventoryEntry, InventoryLeaf } from "#pantry/schema/content/xsd-inventory.ts";
import type {
  AdmissionRow,
  RegistryRow,
  SchemaVersionHandle,
} from "#pantry/schema/kinds/generic.ts";
import { mathmlInventory } from "#pantry/vocab/inventory/mathml.ts";
import type { WildcardStatement } from "#pantry/vocab/open.ts";

/**
 * The MathML namespace, which every MathML element is in.
 */
export const namespace = "http://www.w3.org/1998/Math/MathML";

/**
 * The MathML kinds, in append-only order: the XSD's documents', which `mathml.test.ts` checks
 * against the deriver's reading of them.
 */
export const kinds = [
  "m:math",
  "m:annotation",
  "m:annotation-xml",
  "m:semantics",
  "m:mi",
  "m:mn",
  "m:mo",
  "m:mtext",
  "m:mspace",
  "m:ms",
  "m:mglyph",
  "m:msline",
  "m:none",
  "m:mprescripts",
  "m:malignmark",
  "m:maligngroup",
  "m:mrow",
  "m:mfrac",
  "m:msqrt",
  "m:mroot",
  "m:mstyle",
  "m:merror",
  "m:mpadded",
  "m:mphantom",
  "m:mfenced",
  "m:menclose",
  "m:msub",
  "m:msup",
  "m:msubsup",
  "m:munder",
  "m:mover",
  "m:munderover",
  "m:mmultiscripts",
  "m:mtable",
  "m:mlabeledtr",
  "m:mtr",
  "m:mtd",
  "m:mstack",
  "m:mlongdiv",
  "m:msgroup",
  "m:msrow",
  "m:mscarries",
  "m:mscarry",
  "m:maction",
  "m:bvar",
  "m:sep",
  "m:domainofapplication",
  "m:condition",
  "m:uplimit",
  "m:lowlimit",
  "m:degree",
  "m:momentabout",
  "m:logbase",
  "m:piecewise",
  "m:piece",
  "m:otherwise",
  "m:reln",
  "m:fn",
  "m:declare",
  "m:interval",
  "m:inverse",
  "m:ident",
  "m:domain",
  "m:codomain",
  "m:image",
  "m:ln",
  "m:log",
  "m:moment",
  "m:lambda",
  "m:compose",
  "m:quotient",
  "m:divide",
  "m:minus",
  "m:power",
  "m:rem",
  "m:root",
  "m:factorial",
  "m:abs",
  "m:conjugate",
  "m:arg",
  "m:real",
  "m:imaginary",
  "m:floor",
  "m:ceiling",
  "m:exp",
  "m:max",
  "m:min",
  "m:plus",
  "m:times",
  "m:gcd",
  "m:lcm",
  "m:and",
  "m:or",
  "m:xor",
  "m:not",
  "m:implies",
  "m:equivalent",
  "m:forall",
  "m:exists",
  "m:eq",
  "m:gt",
  "m:lt",
  "m:geq",
  "m:leq",
  "m:neq",
  "m:approx",
  "m:factorof",
  "m:tendsto",
  "m:int",
  "m:diff",
  "m:partialdiff",
  "m:divergence",
  "m:grad",
  "m:curl",
  "m:laplacian",
  "m:set",
  "m:list",
  "m:union",
  "m:intersect",
  "m:cartesianproduct",
  "m:in",
  "m:notin",
  "m:notsubset",
  "m:notprsubset",
  "m:setdiff",
  "m:subset",
  "m:prsubset",
  "m:card",
  "m:sum",
  "m:product",
  "m:limit",
  "m:sin",
  "m:cos",
  "m:tan",
  "m:sec",
  "m:csc",
  "m:cot",
  "m:sinh",
  "m:cosh",
  "m:tanh",
  "m:sech",
  "m:csch",
  "m:coth",
  "m:arcsin",
  "m:arccos",
  "m:arctan",
  "m:arccosh",
  "m:arccot",
  "m:arccoth",
  "m:arccsc",
  "m:arccsch",
  "m:arcsec",
  "m:arcsech",
  "m:arcsinh",
  "m:arctanh",
  "m:mean",
  "m:sdev",
  "m:variance",
  "m:median",
  "m:mode",
  "m:vector",
  "m:matrix",
  "m:matrixrow",
  "m:determinant",
  "m:transpose",
  "m:selector",
  "m:vectorproduct",
  "m:scalarproduct",
  "m:outerproduct",
  "m:integers",
  "m:reals",
  "m:rationals",
  "m:naturalnumbers",
  "m:complexes",
  "m:primes",
  "m:emptyset",
  "m:exponentiale",
  "m:imaginaryi",
  "m:notanumber",
  "m:true",
  "m:false",
  "m:pi",
  "m:eulergamma",
  "m:infinity",
  "m:cn",
  "m:ci",
  "m:csymbol",
  "m:apply",
  "m:bind",
  "m:share",
  "m:cerror",
  "m:cbytes",
  "m:cs",
] as const;

/**
 * A MathML kind's handle.
 */
export type MathmlKind = (typeof kinds)[number];

/**
 * The attribute names these kinds introduce, in first-appearance order over the kinds and each
 * kind's attribute rows: the 111 of MathML's 129 names that today's roster does not hold. The other
 * 18 (`id`, `class`, `href`, `dir`, `width`, …) are the shared names the HTML, ASI and packaging
 * vocabularies declare first; an attribute name is one handle whatever kind admits it.
 */
export const attributes = [
  "display",
  "maxwidth",
  "overflow",
  "altimg",
  "altimg-width",
  "altimg-height",
  "altimg-valign",
  "alttext",
  "cdgroup",
  "mathcolor",
  "mathbackground",
  "scriptlevel",
  "displaystyle",
  "scriptsizemultiplier",
  "scriptminsize",
  "infixlinebreakstyle",
  "decimalpoint",
  "accent",
  "accentunder",
  "alignmentscope",
  "bevelled",
  "charalign",
  "charspacing",
  "close",
  "columnalign",
  "columnlines",
  "columnspacing",
  "columnspan",
  "columnwidth",
  "crossout",
  "denomalign",
  "depth",
  "edge",
  "equalcolumns",
  "equalrows",
  "fence",
  "form",
  "frame",
  "framespacing",
  "groupalign",
  "indentalign",
  "indentalignfirst",
  "indentalignlast",
  "indentshift",
  "indentshiftfirst",
  "indentshiftlast",
  "indenttarget",
  "largeop",
  "leftoverhang",
  "length",
  "linebreak",
  "linebreakmultchar",
  "linebreakstyle",
  "lineleading",
  "linethickness",
  "location",
  "longdivstyle",
  "lquote",
  "lspace",
  "mathsize",
  "mathvariant",
  "maxsize",
  "minlabelspacing",
  "minsize",
  "movablelimits",
  "mslinethickness",
  "notation",
  "numalign",
  "position",
  "rightoverhang",
  "rowalign",
  "rowlines",
  "rowspacing",
  "rquote",
  "rspace",
  "selection",
  "separator",
  "separators",
  "shift",
  "side",
  "stackalign",
  "stretchy",
  "subscriptshift",
  "superscriptshift",
  "symmetric",
  "xref",
  "style",
  "other",
  "mode",
  "macros",
  "cd",
  "definitionURL",
  "fontfamily",
  "fontweight",
  "fontstyle",
  "fontsize",
  "color",
  "background",
  "veryverythinmathspace",
  "verythinmathspace",
  "thinmathspace",
  "mediummathspace",
  "thickmathspace",
  "verythickmathspace",
  "veryverythickmathspace",
  "voffset",
  "actiontype",
  "nargs",
  "occurrence",
  "closure",
  "order",
] as const;

/**
 * The attribute names a kind's inventory entry declares, each once, in declaration order.
 *
 * Every kind has an entry, which `mathml.test.ts` proves, so the empty list is never read.
 *
 * @param kind - The kind.
 * @returns The names.
 */
const attributeNamesOf = (kind: MathmlKind): readonly string[] =>
  Option.match(Option.fromNullishOr(mathmlInventory[kind]), {
    onNone: () => [],
    onSome: (entry) => Arr.dedupe(entry.attributes.map((row) => row.name)),
  });

/**
 * The registry row of a kind: its local name, the MathML namespace, no parent kind, and the
 * attribute names its entry declares.
 *
 * @param kind - The kind.
 * @returns The row.
 */
const rowOf = (kind: MathmlKind): RegistryRow => ({
  attributes: attributeNamesOf(kind),
  local: kind.slice("m:".length),
  namespace,
  parent: Option.none(),
});

/**
 * The registry row of each MathML kind. No handle is dotted: `m:semantics`, the one element
 * declared more than once, has one kind ({@link gaps}).
 */
export const registry: Readonly<Record<MathmlKind, RegistryRow>> = {
  "m:abs": rowOf("m:abs"),
  "m:and": rowOf("m:and"),
  "m:annotation": rowOf("m:annotation"),
  "m:annotation-xml": rowOf("m:annotation-xml"),
  "m:apply": rowOf("m:apply"),
  "m:approx": rowOf("m:approx"),
  "m:arccos": rowOf("m:arccos"),
  "m:arccosh": rowOf("m:arccosh"),
  "m:arccot": rowOf("m:arccot"),
  "m:arccoth": rowOf("m:arccoth"),
  "m:arccsc": rowOf("m:arccsc"),
  "m:arccsch": rowOf("m:arccsch"),
  "m:arcsec": rowOf("m:arcsec"),
  "m:arcsech": rowOf("m:arcsech"),
  "m:arcsin": rowOf("m:arcsin"),
  "m:arcsinh": rowOf("m:arcsinh"),
  "m:arctan": rowOf("m:arctan"),
  "m:arctanh": rowOf("m:arctanh"),
  "m:arg": rowOf("m:arg"),
  "m:bind": rowOf("m:bind"),
  "m:bvar": rowOf("m:bvar"),
  "m:card": rowOf("m:card"),
  "m:cartesianproduct": rowOf("m:cartesianproduct"),
  "m:cbytes": rowOf("m:cbytes"),
  "m:ceiling": rowOf("m:ceiling"),
  "m:cerror": rowOf("m:cerror"),
  "m:ci": rowOf("m:ci"),
  "m:cn": rowOf("m:cn"),
  "m:codomain": rowOf("m:codomain"),
  "m:complexes": rowOf("m:complexes"),
  "m:compose": rowOf("m:compose"),
  "m:condition": rowOf("m:condition"),
  "m:conjugate": rowOf("m:conjugate"),
  "m:cos": rowOf("m:cos"),
  "m:cosh": rowOf("m:cosh"),
  "m:cot": rowOf("m:cot"),
  "m:coth": rowOf("m:coth"),
  "m:cs": rowOf("m:cs"),
  "m:csc": rowOf("m:csc"),
  "m:csch": rowOf("m:csch"),
  "m:csymbol": rowOf("m:csymbol"),
  "m:curl": rowOf("m:curl"),
  "m:declare": rowOf("m:declare"),
  "m:degree": rowOf("m:degree"),
  "m:determinant": rowOf("m:determinant"),
  "m:diff": rowOf("m:diff"),
  "m:divergence": rowOf("m:divergence"),
  "m:divide": rowOf("m:divide"),
  "m:domain": rowOf("m:domain"),
  "m:domainofapplication": rowOf("m:domainofapplication"),
  "m:emptyset": rowOf("m:emptyset"),
  "m:eq": rowOf("m:eq"),
  "m:equivalent": rowOf("m:equivalent"),
  "m:eulergamma": rowOf("m:eulergamma"),
  "m:exists": rowOf("m:exists"),
  "m:exp": rowOf("m:exp"),
  "m:exponentiale": rowOf("m:exponentiale"),
  "m:factorial": rowOf("m:factorial"),
  "m:factorof": rowOf("m:factorof"),
  "m:false": rowOf("m:false"),
  "m:floor": rowOf("m:floor"),
  "m:fn": rowOf("m:fn"),
  "m:forall": rowOf("m:forall"),
  "m:gcd": rowOf("m:gcd"),
  "m:geq": rowOf("m:geq"),
  "m:grad": rowOf("m:grad"),
  "m:gt": rowOf("m:gt"),
  "m:ident": rowOf("m:ident"),
  "m:image": rowOf("m:image"),
  "m:imaginary": rowOf("m:imaginary"),
  "m:imaginaryi": rowOf("m:imaginaryi"),
  "m:implies": rowOf("m:implies"),
  "m:in": rowOf("m:in"),
  "m:infinity": rowOf("m:infinity"),
  "m:int": rowOf("m:int"),
  "m:integers": rowOf("m:integers"),
  "m:intersect": rowOf("m:intersect"),
  "m:interval": rowOf("m:interval"),
  "m:inverse": rowOf("m:inverse"),
  "m:lambda": rowOf("m:lambda"),
  "m:laplacian": rowOf("m:laplacian"),
  "m:lcm": rowOf("m:lcm"),
  "m:leq": rowOf("m:leq"),
  "m:limit": rowOf("m:limit"),
  "m:list": rowOf("m:list"),
  "m:ln": rowOf("m:ln"),
  "m:log": rowOf("m:log"),
  "m:logbase": rowOf("m:logbase"),
  "m:lowlimit": rowOf("m:lowlimit"),
  "m:lt": rowOf("m:lt"),
  "m:maction": rowOf("m:maction"),
  "m:maligngroup": rowOf("m:maligngroup"),
  "m:malignmark": rowOf("m:malignmark"),
  "m:math": rowOf("m:math"),
  "m:matrix": rowOf("m:matrix"),
  "m:matrixrow": rowOf("m:matrixrow"),
  "m:max": rowOf("m:max"),
  "m:mean": rowOf("m:mean"),
  "m:median": rowOf("m:median"),
  "m:menclose": rowOf("m:menclose"),
  "m:merror": rowOf("m:merror"),
  "m:mfenced": rowOf("m:mfenced"),
  "m:mfrac": rowOf("m:mfrac"),
  "m:mglyph": rowOf("m:mglyph"),
  "m:mi": rowOf("m:mi"),
  "m:min": rowOf("m:min"),
  "m:minus": rowOf("m:minus"),
  "m:mlabeledtr": rowOf("m:mlabeledtr"),
  "m:mlongdiv": rowOf("m:mlongdiv"),
  "m:mmultiscripts": rowOf("m:mmultiscripts"),
  "m:mn": rowOf("m:mn"),
  "m:mo": rowOf("m:mo"),
  "m:mode": rowOf("m:mode"),
  "m:moment": rowOf("m:moment"),
  "m:momentabout": rowOf("m:momentabout"),
  "m:mover": rowOf("m:mover"),
  "m:mpadded": rowOf("m:mpadded"),
  "m:mphantom": rowOf("m:mphantom"),
  "m:mprescripts": rowOf("m:mprescripts"),
  "m:mroot": rowOf("m:mroot"),
  "m:mrow": rowOf("m:mrow"),
  "m:ms": rowOf("m:ms"),
  "m:mscarries": rowOf("m:mscarries"),
  "m:mscarry": rowOf("m:mscarry"),
  "m:msgroup": rowOf("m:msgroup"),
  "m:msline": rowOf("m:msline"),
  "m:mspace": rowOf("m:mspace"),
  "m:msqrt": rowOf("m:msqrt"),
  "m:msrow": rowOf("m:msrow"),
  "m:mstack": rowOf("m:mstack"),
  "m:mstyle": rowOf("m:mstyle"),
  "m:msub": rowOf("m:msub"),
  "m:msubsup": rowOf("m:msubsup"),
  "m:msup": rowOf("m:msup"),
  "m:mtable": rowOf("m:mtable"),
  "m:mtd": rowOf("m:mtd"),
  "m:mtext": rowOf("m:mtext"),
  "m:mtr": rowOf("m:mtr"),
  "m:munder": rowOf("m:munder"),
  "m:munderover": rowOf("m:munderover"),
  "m:naturalnumbers": rowOf("m:naturalnumbers"),
  "m:neq": rowOf("m:neq"),
  "m:none": rowOf("m:none"),
  "m:not": rowOf("m:not"),
  "m:notanumber": rowOf("m:notanumber"),
  "m:notin": rowOf("m:notin"),
  "m:notprsubset": rowOf("m:notprsubset"),
  "m:notsubset": rowOf("m:notsubset"),
  "m:or": rowOf("m:or"),
  "m:otherwise": rowOf("m:otherwise"),
  "m:outerproduct": rowOf("m:outerproduct"),
  "m:partialdiff": rowOf("m:partialdiff"),
  "m:pi": rowOf("m:pi"),
  "m:piece": rowOf("m:piece"),
  "m:piecewise": rowOf("m:piecewise"),
  "m:plus": rowOf("m:plus"),
  "m:power": rowOf("m:power"),
  "m:primes": rowOf("m:primes"),
  "m:product": rowOf("m:product"),
  "m:prsubset": rowOf("m:prsubset"),
  "m:quotient": rowOf("m:quotient"),
  "m:rationals": rowOf("m:rationals"),
  "m:real": rowOf("m:real"),
  "m:reals": rowOf("m:reals"),
  "m:reln": rowOf("m:reln"),
  "m:rem": rowOf("m:rem"),
  "m:root": rowOf("m:root"),
  "m:scalarproduct": rowOf("m:scalarproduct"),
  "m:sdev": rowOf("m:sdev"),
  "m:sec": rowOf("m:sec"),
  "m:sech": rowOf("m:sech"),
  "m:selector": rowOf("m:selector"),
  "m:semantics": rowOf("m:semantics"),
  "m:sep": rowOf("m:sep"),
  "m:set": rowOf("m:set"),
  "m:setdiff": rowOf("m:setdiff"),
  "m:share": rowOf("m:share"),
  "m:sin": rowOf("m:sin"),
  "m:sinh": rowOf("m:sinh"),
  "m:subset": rowOf("m:subset"),
  "m:sum": rowOf("m:sum"),
  "m:tan": rowOf("m:tan"),
  "m:tanh": rowOf("m:tanh"),
  "m:tendsto": rowOf("m:tendsto"),
  "m:times": rowOf("m:times"),
  "m:transpose": rowOf("m:transpose"),
  "m:true": rowOf("m:true"),
  "m:union": rowOf("m:union"),
  "m:uplimit": rowOf("m:uplimit"),
  "m:variance": rowOf("m:variance"),
  "m:vector": rowOf("m:vector"),
  "m:vectorproduct": rowOf("m:vectorproduct"),
  "m:xor": rowOf("m:xor"),
};

/**
 * The schema versions the MathML rows hold in: both, since both ASI XSDs import the same MathML
 * XSD.
 */
const versions = ["3.0.0", "3.0.1"] as const satisfies readonly SchemaVersionHandle[];

/**
 * The kinds whose type has simple content, character data alone: `m:cbytes`, whose base64 text
 * the XSD types `m:base64`. `mathml.test.ts` checks the list against the XSD.
 */
export const simpleContent: readonly MathmlKind[] = ["m:cbytes"];

/**
 * The kinds whose content is an element wildcard: `m:annotation-xml`, whose `xs:any` admits one
 * element of any namespace, processed lax. `mathml.test.ts` checks the list against the XSD.
 */
export const wildcardContent: readonly MathmlKind[] = ["m:annotation-xml"];

/**
 * The character kinds a type admits, by its content: the rules of `kinds/asi.ts`, with simple
 * content admitting what mixed content does.
 */
const characterKinds = {
  elements: ["ws", "comment", "pi"],
  empty: ["comment", "pi"],
  text: ["text", "ws", "entityRef", "comment", "pi"],
} as const;

/**
 * The character kinds a kind admits.
 *
 * @param kind - The kind.
 * @param entry - Its inventory entry.
 * @returns The `text`, `ws`, `entityRef`, `comment` and `pi` rows its content type admits.
 */
const characterKindsOf = (kind: MathmlKind, entry: InventoryEntry): readonly string[] => {
  if (entry.mixed || simpleContent.includes(kind)) {
    return characterKinds.text;
  }

  return entry.children.length > 0 || wildcardContent.includes(kind)
    ? characterKinds.elements
    : characterKinds.empty;
};

/**
 * The children each MathML kind admits: its entry's element children, each once, then its
 * character kinds.
 *
 * @param kind - The kind.
 * @returns The child kinds.
 */
const childrenOf = (kind: MathmlKind): readonly string[] =>
  Option.match(Option.fromNullishOr(mathmlInventory[kind]), {
    onNone: () => [],
    onSome: (entry) => [
      ...Arr.dedupe(entry.children.map((child) => child.name)),
      ...characterKindsOf(kind, entry),
    ],
  });

/**
 * The name the ASI XSDs give `m:math` in their content models, through their `m3` prefix.
 */
export const asiMathName = "m3:math";

/**
 * The admission rows that put `m:math` under every host an inventory holds: each entry whose
 * children reference {@link asiMathName}, under both versions.
 *
 * Public so that a composition that adds hosts, such as the test vocabulary's, admits `m:math`
 * under them by the same rule.
 *
 * @param hosts - The inventory to read the hosts from.
 * @returns One row per host and version, in the inventory's order.
 */
export const mathHostRows = (hosts: InventoryLeaf): readonly AdmissionRow[] =>
  Object.values(hosts)
    .filter((entry) => entry.children.some((child) => child.name === asiMathName))
    .flatMap((entry) =>
      versions.map((version) => ({ child: "m:math", parent: entry.handle, version })),
    );

/**
 * The XSD's hosts of `m:math` that are no kind of today's composition: the (element, type) pairs
 * whose kinds the test vocabulary adds. `mathml.test.ts` checks that these and today's hosts are
 * the 61 elements in 34 content types the XSD gives.
 */
export const pendingHosts = [
  { element: "qti-content-body", type: "TestFeedbackFlowContentBodyDType" },
  { element: "qti-content-body", type: "TestRubricBlockContentBodyDType" },
  { element: "qti-html-content", type: "HTMLContentDType" },
  { element: "qti-interaction-markup", type: "InteractionMarkupDType" },
  { element: "qti-stimulus-body", type: "StimulusBodyDType" },
] as const;

/**
 * The MathML admission rows: under each MathML kind its children, in both versions, then
 * `m:math` under each host of today's composition.
 */
export const admission: readonly AdmissionRow[] = [
  ...kinds.flatMap((parent) =>
    versions.flatMap((version) => childrenOf(parent).map((child) => ({ child, parent, version }))),
  ),
  ...mathHostRows(inventory),
];

/**
 * The MathML kinds that hold no attribute wildcard: the 11 whose types reference no `CommonAtt`,
 * the attribute group that holds the XSD's one `xs:anyAttribute`.
 */
const unwildcarded: ReadonlySet<MathmlKind> = new Set<MathmlKind>([
  "m:sep",
  "m:domainofapplication",
  "m:condition",
  "m:uplimit",
  "m:lowlimit",
  "m:degree",
  "m:momentabout",
  "m:logbase",
  "m:reln",
  "m:fn",
  "m:declare",
]);

/**
 * The attribute wildcard of the MathML elements, in `open.ts`'s shape: `CommonAtt`'s
 * `xs:anyAttribute namespace="##other" processContents="skip"`, which admits an attribute in any
 * namespace but MathML's own, and none in no namespace, without validating it. 182 of the 193
 * elements hold it; `open.ts`'s `openNameOf` reads their foreign attributes as open names.
 * `mathml.test.ts` derives the statement from the XSD.
 */
export const wildcards = [
  {
    elements: Arr.sort(
      kinds.flatMap((kind) => (unwildcarded.has(kind) ? [] : [kind.slice("m:".length)])),
      Order.String,
    ),
    namespace,
    versions,
    wildcard: { namespaces: "other", processing: "skip" },
  },
] as const satisfies readonly WildcardStatement[];

/**
 * A rule of MathML 3 the MathML rows do not state: what it is, and the decision that leaves it.
 */
export interface Gap {
  readonly decision: string;
  readonly rule: string;
}

/**
 * The rules of MathML 3 these rows do not state, recorded so the composition and the verdicts can
 * name them.
 */
export const gaps = {
  "annotation-xml": {
    decision: "spec reading 30; open element content (D2)",
    rule: "`m:annotation-xml` holds one element of any namespace under a lax wildcard, QTI elements included. No named child is admitted under it here: its element is open content, which the open vocabulary reads.",
  },
  "attribute-values": {
    decision: "the value domains, when MathML is composed",
    rule: "An attribute row records its declared type and whitespace class. An inline type is recorded as its base (`xs:token` for the enumerations), `list` or `union`, so the enumerated values and the patterns of the named MathML types (`m:length`, `m:color`, …) are read from the XSD when the value domains are derived.",
  },
  order: {
    decision: "D3 and D4",
    rule: "Child order is not stated. D3 ports only today's rank rules, and D4 defers content MathML's ordering: `m:apply` and `m:bind` read an operator, then `m:bvar`s, then qualifiers, then operands, which no rank interval expresses. The inventory records each child's bounds.",
  },
  relaxng: {
    decision: "D12",
    rule: "The XSD is the source. How the MathML 3 RelaxNG schema and the Recommendation's prose, which spec reading 2 makes normative, differ from it is unknown, beyond the six content models the XSD marks as altered: `annotation-xml` (for libxml), `apply.content`, the `interval` qualifier of `DomainQ`, `minus`, `root` and `ContExp`.",
  },
  "semantics-context": {
    decision: "one kind per element",
    rule: "`m:semantics` is declared three times. Under `m:bvar` (the group `semantics-ci`) its first child is `m:ci` or another `m:semantics`; the kind admits the common declaration's children everywhere, so that narrowing is not stated.",
  },
} as const satisfies Readonly<Record<string, Gap>>;

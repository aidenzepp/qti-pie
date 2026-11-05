/* oxlint-disable unicorn/throw-new-error -- Schema.TaggedError is a schema class factory. */
/**
 * Open attribute names: the attributes no closed `AttributeName` handle names, which an element's
 * attribute wildcard admits without a declaration to validate them (fin.md, D2).
 *
 * A closed name comes first: an attribute the element's kind admits under a closed handle is that
 * handle, wherever its spelling also fits an open class. Only an attribute the kind does not admit
 * closed is read here, and it is open when the element's wildcard admits it unvalidated. It then
 * takes one of the roster's open-class handles ({@link openClasses}), kept beside its exact name
 * ({@link XdmOpenName}):
 *
 * - `data-*`, an attribute in no namespace whose name begins `data-`, which must then match spec
 *   reading 13 ({@link dataName});
 * - `lax`, any other attribute in no namespace;
 * - `foreign`, an attribute in a namespace, with its prefix and namespace name.
 *
 * Where a wildcard admits them is read from the pinned XSDs ({@link wildcards}). QTI 3.0.1's
 * no-namespace attributes are admitted on the 127 elements whose types inherit
 * `extensionAnyTypeLax.Attr`, and QTI 3.0.0's on the 126 of them its own `dataExtension.*.Attr`
 * groups reach. An open name keeps its lexical form only ({@link openLexical}).
 */
import { Option, Result, Schema } from "effect";
import type { Attribute, Element } from "@qti-pie/crust/tree.ts";
import type { openClasses } from "#pantry/grammar/kinds.ts";
import type { XdmOpenName } from "#pantry/model/xdm.ts";
import { xsString, xsStringFlags } from "#pantry/schema/patterns.ts";

/**
 * An open name this module reads: an {@link XdmOpenName} whose tag is one of the `AttributeName`
 * roster's {@link openClasses}, so a tag the roster does not hold fails to compile here.
 */
type OpenName = Extract<XdmOpenName, { readonly _tag: (typeof openClasses)[number] }>;

/**
 * The language of a `data-*` attribute's name, which is in no namespace: `data-`, then one or more
 * lower-case ASCII letters, digits, `_`, `.` or `-`.
 *
 * It follows the information model's prose, which bars upper-case letters, and sets aside the
 * looser pattern the information model gives beside it, the XSD's wildcard and the Schematron's
 * prefix test (reading 13 of `docs/spec-readings.md`). A no-namespace name that begins `data-` and
 * breaks it is refused, never read as `lax`.
 */
export const dataName = /^data-[a-z0-9_.-]+$/u;

/**
 * The lexical definition every open attribute's value is read under: any text, with the
 * whitespace the reader's attribute-value normalization left, as `xs:anySimpleType`.
 *
 * No declaration governs an open name, so no typed value is derived from it and the lexical form
 * is the whole record (fin.md, D2).
 */
export const openLexical = {
  datatype: "xs:anySimpleType",
  flags: xsStringFlags,
  pattern: xsString,
  whiteSpace: "preserve",
} as const;

/**
 * An element type's attribute wildcard: the namespaces whose undeclared attributes it admits, and
 * how a schema processor validates one it admits.
 *
 * `any` admits every attribute, in no namespace or any. `other` admits an attribute in a namespace
 * other than the element's own, never one in no namespace. `lax` validates an admitted attribute
 * against a declaration when the schemas hold one and lets it through otherwise, `strict` refuses
 * it without one, and `skip` never validates it.
 *
 * @see {@link https://www.w3.org/TR/xmlschema-1/#Wildcards | XML Schema 1.0, Wildcards}
 */
export interface Wildcard {
  readonly namespaces: "any" | "other";
  readonly processing: "lax" | "skip" | "strict";
}

/**
 * The wildcard `extensionAnyTypeLax.Attr` holds in 3.0.1 and the `dataExtension.*.Attr` groups hold
 * in 3.0.0.
 */
const anyLax = { namespaces: "any", processing: "lax" } as const satisfies Wildcard;

/**
 * The wildcard `extensionNamespaceLax.Attr` holds in 3.0.1, the `extension.Custom*.Attr` groups in
 * 3.0.0, and XInclude's two types.
 */
const otherLax = { namespaces: "other", processing: "lax" } as const satisfies Wildcard;

/**
 * The wildcard `extensionNamespaceStrict.Attr` holds in 3.0.1 and `extension.Ordering.Attr` and
 * `extension.Selection.Attr` hold in 3.0.0.
 */
const otherStrict = { namespaces: "other", processing: "strict" } as const satisfies Wildcard;

/**
 * The QTI namespace, which the ASI XSDs' elements, HTML's included, are in.
 */
const asiNamespace = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * The XInclude namespace, which `w3/XInclude.xsd`'s two elements are in.
 */
const xincludeNamespace = "http://www.w3.org/2001/XInclude";

/**
 * One wildcard the elements of one namespace hold, stated once with the schema versions it holds
 * in.
 */
export interface WildcardStatement {
  /**
   * The elements' local names, in code-point order. Every type an element is declared with holds
   * the same wildcard, so every kind of it does.
   */
  readonly elements: readonly string[];
  readonly namespace: string;
  readonly versions: readonly string[];
  readonly wildcard: Wildcard;
}

/**
 * The attribute wildcards of the elements of the ASI XSDs (`imsqti_asiv3p0_v1p0.xsd` for 3.0.0,
 * `imsqti_asiv3p0p1_v1p0.xsd` for 3.0.1) and of the XInclude XSD both import, each element stated
 * once per version. An element no statement names holds no wildcard and admits no open name.
 *
 * An element's wildcard is its type's: the wildcard the type or its derivation step holds itself or
 * through its attribute groups, joined for an extension with its base type's, the union taking the
 * step's processing (XML Schema 1.0, §3.4.2). `open.test.ts` derives these statements from the
 * pinned XSDs.
 *
 * The metadata and content-packaging XSDs hold no wildcard; MathML's and SSML's elements are their
 * own vocabularies' to state, in this shape.
 */
export const wildcards = [
  {
    elements: [
      "a",
      "abbr",
      "acronym",
      "address",
      "article",
      "aside",
      "audio",
      "b",
      "bdi",
      "bdo",
      "big",
      "blockquote",
      "br",
      "caption",
      "cite",
      "code",
      "col",
      "colgroup",
      "dd",
      "details",
      "dfn",
      "div",
      "dl",
      "dt",
      "em",
      "figcaption",
      "figure",
      "footer",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "header",
      "hr",
      "i",
      "img",
      "kbd",
      "label",
      "li",
      "nav",
      "object",
      "ol",
      "p",
      "picture",
      "pre",
      "q",
      "qti-assessment-item",
      "qti-assessment-item-ref",
      "qti-assessment-section",
      "qti-assessment-section-ref",
      "qti-assessment-stimulus",
      "qti-assessment-stimulus-ref",
      "qti-assessment-test",
      "qti-associable-hotspot",
      "qti-associate-interaction",
      "qti-card-entry",
      "qti-choice-interaction",
      "qti-custom-interaction",
      "qti-drawing-interaction",
      "qti-end-attempt-interaction",
      "qti-extended-text-interaction",
      "qti-feedback-block",
      "qti-feedback-inline",
      "qti-gap",
      "qti-gap-img",
      "qti-gap-match-interaction",
      "qti-gap-text",
      "qti-graphic-associate-interaction",
      "qti-graphic-gap-match-interaction",
      "qti-graphic-order-interaction",
      "qti-hotspot-choice",
      "qti-hotspot-interaction",
      "qti-hottext",
      "qti-hottext-interaction",
      "qti-html-content",
      "qti-inline-choice",
      "qti-inline-choice-interaction",
      "qti-label",
      "qti-match-interaction",
      "qti-media-interaction",
      "qti-modal-feedback",
      "qti-order-interaction",
      "qti-portable-custom-interaction",
      "qti-position-object-interaction",
      "qti-position-object-stage",
      "qti-prompt",
      "qti-rubric-block",
      "qti-select-point-interaction",
      "qti-simple-associable-choice",
      "qti-simple-choice",
      "qti-simple-match-set",
      "qti-slider-interaction",
      "qti-template-block",
      "qti-template-inline",
      "qti-test-feedback",
      "qti-test-part",
      "qti-text-entry-interaction",
      "qti-upload-interaction",
      "rb",
      "rp",
      "rt",
      "rtc",
      "ruby",
      "samp",
      "section",
      "small",
      "source",
      "span",
      "strong",
      "sub",
      "summary",
      "sup",
      "table",
      "tbody",
      "td",
      "tfoot",
      "th",
      "thead",
      "tr",
      "track",
      "tt",
      "ul",
      "var",
      "video",
    ],
    namespace: asiNamespace,
    versions: ["3.0.0", "3.0.1"],
    wildcard: anyLax,
  },
  {
    elements: ["qti-stimulus-body"],
    namespace: asiNamespace,
    versions: ["3.0.1"],
    wildcard: anyLax,
  },
  {
    elements: ["qti-custom-operator"],
    namespace: asiNamespace,
    versions: ["3.0.0", "3.0.1"],
    wildcard: otherLax,
  },
  {
    elements: ["qti-ordering", "qti-selection"],
    namespace: asiNamespace,
    versions: ["3.0.0", "3.0.1"],
    wildcard: otherStrict,
  },
  {
    elements: ["fallback", "include"],
    namespace: xincludeNamespace,
    versions: ["3.0.0", "3.0.1"],
    wildcard: otherLax,
  },
] as const satisfies readonly WildcardStatement[];

/**
 * A schema version the wildcards are stated under.
 */
export type WildcardVersion = (typeof wildcards)[number]["versions"][number];

/**
 * The key of an element under a schema version: the version, a space, and the element's expanded
 * name in Clark notation, `{namespace}local`. No version holds a space, so no two keys collide.
 *
 * @param version - The schema version.
 * @param element - The element's namespace name and local name.
 * @returns Its key in {@link stated}.
 */
const keyOf = (version: WildcardVersion, element: Pick<Element, "local" | "namespace">): string =>
  `${version} {${element.namespace}}${element.local}`;

/**
 * The wildcard of each element under each version a statement names it in.
 */
const stated: ReadonlyMap<string, Wildcard> = new Map(
  wildcards.flatMap(({ elements, namespace, versions, wildcard }) =>
    versions.flatMap((version) =>
      elements.map((local) => [keyOf(version, { local, namespace }), wildcard] as const),
    ),
  ),
);

/**
 * Look up the attribute wildcard an element holds in a schema version.
 *
 * @param version - The version of the element's document.
 * @param element - The element's namespace name and local name.
 * @returns Its wildcard, or `None` when it admits only the attributes its type declares.
 */
export const wildcardOf = (
  version: WildcardVersion,
  element: Pick<Element, "local" | "namespace">,
): Option.Option<Wildcard> => Option.fromNullishOr(stated.get(keyOf(version, element)));

/**
 * The namespace of the attributes `xml.xsd` declares.
 */
const xmlNamespace = "http://www.w3.org/XML/1998/namespace";

/**
 * The namespace of XML Schema's built-in instance attributes.
 */
const xsiNamespace = "http://www.w3.org/2001/XMLSchema-instance";

/**
 * The XML-namespace attributes `w3/xml.xsd` declares globally, the only global attribute
 * declarations the pinned XSDs hold. A `lax` or `strict` wildcard validates each against its
 * declaration, so under either none is an open name: it is the closed handle `xml:<name>` or it is
 * refused.
 */
const xmlDeclared: ReadonlySet<string> = new Set(["base", "id", "lang", "space"]);

/**
 * XML Schema's four built-in `xsi:` attributes. A schema processor holds their declarations
 * everywhere and checks them before any wildcard, so none is ever an open name.
 *
 * @see {@link https://www.w3.org/TR/xmlschema-1/#cvc-complex-type | XML Schema 1.0, Element Locally Valid (Complex Type), clause 3}
 */
const xsiBuiltins: ReadonlySet<string> = new Set([
  "nil",
  "noNamespaceSchemaLocation",
  "schemaLocation",
  "type",
]);

/**
 * The reasons an attribute no closed handle names is not an open name either.
 *
 * - `closed-element`: the element holds no wildcard.
 * - `outside-namespaces`: its wildcard is `other`, and the attribute is in no namespace or in the
 *   element's own.
 * - `declared`: a schema declares the attribute, so a processor validates it rather than letting it
 *   through; the model reads it only as a closed name, and the kind admits none by it.
 * - `strict`: its wildcard validates strictly, and no schema declares the attribute.
 * - `data-name`: its name begins `data-` and breaks {@link dataName}.
 */
export const openNameRefusals = [
  "closed-element",
  "outside-namespaces",
  "declared",
  "strict",
  "data-name",
] as const;

/**
 * A reason an attribute is not an open name.
 */
export type OpenNameRefusal = (typeof openNameRefusals)[number];

/**
 * An attribute its element's kind does not admit under a closed name, and that its element's
 * wildcard does not admit as an open name.
 *
 * `attribute` is the attribute's qualified name as written and `namespace` its namespace name,
 * empty for none; `element` is the element's local name.
 */
export class OpenNameRefused extends Schema.TaggedError<OpenNameRefused>()("OpenNameRefused", {
  attribute: Schema.String,
  element: Schema.String,
  namespace: Schema.String,
  reason: Schema.Literals(openNameRefusals),
}) {
  /**
   * What the element admits beyond its declared attributes, and how to change the attribute so
   * the document is read.
   */
  override get message(): string {
    const { attribute, element, namespace } = this;
    const where = namespace === "" ? "in no namespace" : `in the namespace ${namespace}`;
    const messages: Readonly<Record<OpenNameRefusal, string>> = {
      "closed-element": `${element} admits no attribute beyond those it declares, and ${attribute} is not one of them. Remove ${attribute}, or rename it to an attribute ${element} declares.`,
      "data-name": `${attribute} is not a valid data-* attribute name: after "data-", QTI allows one or more lower-case ASCII letters, digits, "_", "." and "-" (spec reading 13). Rename it in lower case.`,
      declared: `${attribute} is declared by a schema, so ${element} admits it only as that declaration types it, and the model has no attribute ${attribute} on ${element}. The document may still be valid: this is a gap in the model's vocabulary, so report it with the document.`,
      "outside-namespaces": `${element} admits an attribute it does not declare only in a namespace other than its own, and ${attribute} is ${namespace === "" ? "in no namespace" : `in ${element}'s own namespace, ${namespace}`}. Remove ${attribute}, or give it a prefix bound to a namespace of its own.`,
      strict: `${element} admits an attribute it does not declare only when a schema declares it, and no schema the model reads declares ${attribute} ${where}. Remove ${attribute}.`,
    };

    return messages[this.reason];
  }
}

/**
 * Whether a no-namespace attribute's name is a valid `data-*` name.
 *
 * @param local - The attribute's local name.
 * @returns Whether it matches {@link dataName}, which proves its `data-` prefix.
 */
const isDataName = (local: string): local is `data-${string}` => dataName.test(local);

/**
 * Read an attribute that its element's kind does not admit under a closed name as an open name.
 *
 * The attribute is open when the wildcard admits its namespace and lets it through unvalidated:
 * under `skip`, or under `lax` when no schema declares it. Its class then follows from its name, as
 * the module comment states.
 *
 * @param element - The element the attribute is on: its namespace name, which an `other` wildcard
 *   excludes, and its local name, which a refusal names.
 * @param wildcard - The element's wildcard, `None` when it holds none ({@link wildcardOf}).
 * @param attribute - The attribute's name as the reader resolved it; never a namespace declaration,
 *   which is no attribute.
 * @returns The attribute's open name, or an {@link OpenNameRefused} giving the reason it is none.
 */
export const openNameOf = (
  element: Pick<Element, "local" | "namespace">,
  wildcard: Option.Option<Wildcard>,
  attribute: Pick<Attribute, "local" | "namespace" | "prefix" | "qname">,
): Result.Result<OpenName, OpenNameRefused> => {
  const { local, namespace, prefix } = attribute;
  const refuse = (reason: OpenNameRefusal): Result.Result<never, OpenNameRefused> =>
    Result.fail(
      new OpenNameRefused({
        attribute: attribute.qname,
        element: element.local,
        namespace,
        reason,
      }),
    );

  if (namespace === xsiNamespace && xsiBuiltins.has(local)) {
    return refuse("declared");
  }

  if (Option.isNone(wildcard)) {
    return refuse("closed-element");
  }

  const { namespaces, processing } = wildcard.value;

  if (namespaces === "other" && (namespace === "" || namespace === element.namespace)) {
    return refuse("outside-namespaces");
  }

  if (processing !== "skip" && namespace === xmlNamespace && xmlDeclared.has(local)) {
    return refuse("declared");
  }

  if (processing === "strict") {
    return refuse("strict");
  }

  if (namespace !== "") {
    return Result.succeed({ _tag: "foreign", local, prefix, uri: namespace });
  }

  if (isDataName(local)) {
    return Result.succeed({ _tag: "data-*", local });
  }

  return local.startsWith("data-") ? refuse("data-name") : Result.succeed({ _tag: "lax", local });
};

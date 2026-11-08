/* oxlint-disable unicorn/throw-new-error -- Schema.TaggedError is a schema class factory. */
/**
 * The open vocabulary: what the element and attribute wildcards admit without a declaration to
 * validate it (fin.md, D2), and the `xml:` and `xsi:` attributes every schema processor knows.
 *
 * Every wildcard's reach is the leaf's: the content-model IR's `any` particles
 * (`src/vocab/inventory/models.ts`) and the attribute wildcards
 * (`src/vocab/inventory/attributes.ts`), each a namespace constraint and a processing as the pinned
 * XSDs write them. A constraint admits namespace classes ({@link namespaceClassesUnder}): a name in
 * no namespace, in the wildcard's target namespace, which is its element's, or in another.
 *
 * **Open attribute names.** A closed name comes first: an attribute the element's kind admits under
 * a closed `AttributeName` handle is that handle, wherever its spelling also fits an open class.
 * Only an attribute the kind does not admit closed is read here ({@link openClassOf}), as one of
 * the roster's open-class handles ({@link openClasses}), kept beside its exact name
 * ({@link OpenName}):
 *
 * - `data-*`, an attribute in no namespace whose name begins `data-`, which must then match spec
 *   reading 13 ({@link dataName});
 * - `no-namespace`, any other attribute in no namespace;
 * - `own-namespace`, an attribute in its element's namespace;
 * - `foreign`, an attribute in another namespace.
 *
 * Which kinds admit which classes is the admission relation's to say: {@link attributesUnder} reads
 * an attribute wildcard as the classes its constraint admits, unless it is `strict`, and
 * {@link foreignAttributes} gives a foreign element `xs:anyType`'s. So a class a wildcard refuses
 * is refused by the law, and the Foreign attribute class law ties a stored name's class to its
 * namespace. An open name keeps its lexical form only, read as `xs:anySimpleType` with its
 * whitespace preserved (`openAttribute` of `src/vocab/inventory/attributes.ts`).
 *
 * **Foreign elements.** An element a wildcard admits and no declaration names is a foreign element,
 * whose kind is its namespace class (`foreignKinds` of `src/grammar/kinds.ts`), so the content law
 * refuses a class its parent's wildcard refuses; the Foreign element class law ties a stored
 * element's class to its namespace. A wildcard never reads spec reading 6's roots as their kinds
 * ({@link foreignRoots}).
 *
 * **The `xml:` and `xsi:` names** are closed names wherever an element carries them, never open
 * names (fin.md, D2's refinement). `xml.xsd` is a known schema, so the four names it declares are
 * admitted on every kind whose attribute wildcard admits the XML namespace, and on every foreign
 * kind: with `xml.xsd`'s types where the wildcard validates them, and as free text where it skips
 * them. XML Schema's four instance attributes ({@link xsiAttributes}) are admitted on every element
 * kind with their built-in types (spec reading 47). The composition (`src/grammar/compose.ts`)
 * derives those admission rows, since they need every vocabulary's element names.
 */
import { Match, Option, Result, Schema } from "effect";
import type { Attribute } from "@qti-pie/crust/tree.ts";
import { openClasses } from "#pantry/grammar/kinds.ts";
import { globalAttributes, openAttribute } from "#pantry/vocab/inventory/attributes.ts";
import type {
  AttributeWildcard,
  GlobalAttributeDeclaration,
  Processing,
} from "#pantry/vocab/inventory/types.ts";
import {
  nameless,
  namespaceClassesUnder,
  namespaceClassOf,
  namespaceNameOf,
  vocabularyNamespaces,
  xmlNamespace,
  xsiNamespace,
  xsNamespace,
} from "#pantry/vocab/namespaces.ts";
import type { NamespaceClass, NamespaceName, NamespaceOfKind } from "#pantry/vocab/namespaces.ts";

/**
 * An `AttributeName` handle that stands for a class of open names: `data-*`, `foreign`,
 * `no-namespace` or `own-namespace`.
 */
export type OpenClass = (typeof openClasses)[number];

/**
 * An attribute no closed handle names, read as an open name: its class and its name (fin.md, D2). A
 * name in no namespace keeps its local name; one in a namespace its local name, prefix and
 * namespace name, which the Foreign attribute class law ties to its class: `own-namespace` exactly
 * when it is its element's namespace, `foreign` exactly when it is another.
 */
export type OpenName =
  | { readonly _tag: "data-*"; readonly local: string }
  | {
      readonly _tag: "foreign";
      readonly local: string;
      readonly prefix: string;
      readonly uri: string;
    }
  | { readonly _tag: "no-namespace"; readonly local: string }
  | {
      readonly _tag: "own-namespace";
      readonly local: string;
      readonly prefix: string;
      readonly uri: string;
    };

/**
 * The language of a `data-*` attribute's name, which is in no namespace: `data-`, then one or more
 * lower-case ASCII letters, digits, `_`, `.` or `-`.
 *
 * It follows the information model's prose, which bars upper-case letters, and sets aside the
 * looser pattern the information model gives beside it, the XSD's wildcard and the Schematron's
 * prefix test (reading 13 of `docs/spec-readings.md`). A no-namespace name that begins `data-` and
 * breaks it is refused, never read as `no-namespace`.
 */
export const dataName = /^data-[a-z0-9_.-]+$/u;

/**
 * The global elements spec reading 6 keeps foreign inside wildcard content, by kind: QTI's
 * document roots (an item, a section, a stimulus, a test and an outcome declaration), its two
 * processing roots, and the content package's manifest. A wildcard never reads one of them as its
 * kind, so under a `lax` wildcard each is a foreign element.
 */
export const foreignRoots: ReadonlySet<string> = new Set([
  "cp:manifest",
  "qti-assessment-item",
  "qti-assessment-section",
  "qti-assessment-stimulus",
  "qti-assessment-test",
  "qti-outcome-declaration",
  "qti-outcome-processing",
  "qti-response-processing",
]);

/**
 * The schema sets QTI 3.0 validates its documents against (spec reading 81), each by the
 * vocabularies, named as `src/vocab/inventory/vocabularies.ts` names them, whose global element
 * declarations it holds: its root XSD's and those of every XSD that one imports, transitively.
 *
 * - `asi`: an item, section, stimulus or test, an outcome declaration and a response-processing
 *   template, each validated against the full ASI XSD of its version (spec reading 24), which
 *   imports `xml.xsd`, XInclude, MathML 3 and SSML 1.1 (`imsqti_asiv3p0_v1p0.xsd` and
 *   `imsqti_asiv3p0p1_v1p0.xsd`, lines 12 to 15).
 * - `cp`: a manifest, validated against the content-packaging XSD of its version, which imports
 *   `xml.xsd`, LOM, the curriculum standards metadata, the QTI metadata and the content-packaging
 *   extension (`imsqtiv3p0_imscpv1p2_v1p0.xsd` and `imsqtiv3p0p1_imscpv1p2_v1p0.xsd`, lines 12 to
 *   16), which imports XLink and the AfA DRD (`cpext/` lines 10 and 11).
 * - `lom`: an external LOM metadata file (`resourcemetadata/xml`), validated against the loose LOM
 *   binding, which imports nothing.
 * - `ud`: a usage-data file (`qtiusagedata/xml`), validated against the usage-data XSD, which imports
 *   nothing.
 *
 * `xml.xsd` and XLink declare attributes only, so no set lists them.
 */
export const schemaSets = {
  asi: ["asi", "mathml", "ssml", "xi"],
  cp: ["cp", "cpx", "csmd", "drd", "lom", "qmd"],
  lom: ["lom"],
  ud: ["ud"],
} as const satisfies Readonly<Record<string, readonly string[]>>;

/**
 * Each vocabulary's name, by its namespace's URI.
 */
const vocabularyOf: ReadonlyMap<string, string> = new Map(
  Object.entries(vocabularyNamespaces).map(([name, { namespace }]) => [namespace, name] as const),
);

/**
 * Find the vocabulary a kind's elements are in.
 *
 * @param namespace - The kind's namespace.
 * @returns Its vocabulary's name, or none for a namespace no vocabulary is in, for no namespace,
 *   which none is in, and for a kind that names no element.
 */
const vocabularyIn = (namespace: NamespaceOfKind): Option.Option<string> =>
  namespace._tag === "in" ? Option.fromNullishOr(vocabularyOf.get(namespace.uri)) : Option.none();

/**
 * Whether an element of a namespace stands in documents assessed against a schema set: an element
 * of a vocabulary in those of each set that lists its vocabulary, and a foreign element, of no
 * vocabulary's namespace or of a foreign kind, which names no element, in those of every set (spec
 * reading 81).
 *
 * @param namespace - The element's namespace, or its kind's.
 * @param members - The vocabularies the set lists.
 * @returns Whether its documents may be assessed against the set.
 */
const standsIn = (namespace: NamespaceOfKind, members: readonly string[]): boolean =>
  Option.match(vocabularyIn(namespace), {
    onNone: () => true,
    onSome: (vocabulary) => members.includes(vocabulary),
  });

/**
 * Whether the schema set of every document an element of `parent`'s namespace stands in may hold
 * a component of `child`'s namespace: some set lists both vocabularies. An element of no
 * vocabulary's namespace, a foreign element, stands in documents of every set (spec reading 81).
 *
 * @param parent - The element's namespace, or its kind's.
 * @param child - The component's namespace, or its kind's.
 * @returns Whether a set the element's documents are assessed against lists the component's
 *   vocabulary.
 */
const sharesSet = (parent: NamespaceOfKind, child: NamespaceOfKind): boolean =>
  Option.match(vocabularyIn(child), {
    // A component of no vocabulary's namespace, or of a kind that names no element, is in no
    // schema set.
    onNone: () => false,
    onSome: (other) =>
      Object.values(schemaSets).some(
        (set: readonly string[]) => set.includes(other) && standsIn(parent, set),
      ),
  });

/**
 * Whether a `lax` or `strict` element wildcard of a kind reads an element another vocabulary
 * declares globally as that declaration (spec reading 81): when a schema set a document holding the
 * kind is validated against holds the declaration. XML Schema finds a wildcard's element by its
 * top-level declaration in the schema the document is assessed against, and only there (Part 1,
 * section 3.10.4, Item Valid (Wildcard), clauses 1 and 2; section 3.3.4, Schema-Validity
 * Assessment (Element), clause 1.1.1.3.2). So under a `lax` wildcard an element whose declaration
 * the set lacks is a foreign element, and under a `strict` one it stands only as
 * {@link typeAvailable} says.
 *
 * A kind of a vocabulary stands in the documents of every set that lists its vocabulary, LOM's in
 * a manifest and in an external LOM file, and a kind of none, a foreign element, in documents of
 * every set. One grammar serves all of a kind's documents, so its wildcards read a declaration any
 * of those sets holds: reading 81 states that limit.
 *
 * @param parent - The namespace of the wildcard's kind.
 * @param child - The namespace of the globally declared element's kind.
 * @returns Whether the wildcard reads the element as its declaration.
 * @see {@link https://www.w3.org/TR/2004/REC-xmlschema-1-20041028/#cvc-wildcard | XML Schema Part 1, 3.10.4 Item Valid (Wildcard)}
 */
export const wildcardReads = (parent: NamespaceOfKind, child: NamespaceOfKind): boolean =>
  sharesSet(parent, child);

/**
 * Whether an element a `lax` or `strict` wildcard holds with no global declaration of its
 * document's schema set may be assessed against the type its `xsi:type` names (spec readings 60
 * and 72): XML Schema's own types, built-in and `xs:anyType`, and the types of a schema set its
 * parent's documents are assessed against. XML Schema assesses such an element strictly against
 * that type (Part 1, section 3.3.4, Schema-Validity Assessment (Element), clause 1.2; section
 * 3.10.1, `strict`: "or the item must have an xsi:type"). Where the `xsi:type` resolves to no type
 * there, a `strict` wildcard refuses the element and a `lax` one assesses it against nothing.
 *
 * @param parent - The namespace of the wildcard's kind, or of the element that holds the wildcard.
 * @param type - The namespace of the type the `xsi:type` names.
 * @returns Whether the type is one the element's document is assessed against.
 * @see {@link https://www.w3.org/TR/2004/REC-xmlschema-1-20041028/#cvc-assess-elt | XML Schema Part 1, 3.3.4 Schema-Validity Assessment (Element)}
 */
export const typeAvailable = (parent: NamespaceOfKind, type: NamespaceName): boolean =>
  (type._tag === "in" && type.uri === xsNamespace) || sharesSet(parent, type);

/**
 * One attribute a schema declares globally, which a kind admits under its closed handle: its
 * handle, its value type and that type's domain, as the derived leaf states them.
 */
export type GlobalAttribute = GlobalAttributeDeclaration;

/**
 * The XML-namespace attributes `w3/xml.xsd` declares globally, as it declares them (fin.md, D2's
 * refinement). A `lax` or `strict` wildcard validates each against its declaration, so these are
 * the types a kind under either admits them with ({@link xmlAttributesUnder}).
 *
 * They are not the only global attribute declarations the pinned XSDs hold: `xlink/xlink.xsd`
 * declares ten more (lines 29 to 105), which the content-packaging extension imports
 * (`cpext/imsqtiv3p0p1_cpextv1p2_v1p0.xsd` line 10), {@link xlinkAttributes}; and XML Schema
 * itself declares the four `xsi:` names, {@link xsiAttributes}.
 */
export const xmlAttributes: readonly GlobalAttribute[] = globalAttributes.filter(({ name }) =>
  name.startsWith("xml:"),
);

/**
 * XLink's ten global attributes, as `xlink/xlink.xsd` declares them (lines 29 to 105): `type`,
 * `show` and `actuate` enumerations, `href` an `xs:anyURI`, `role` and `arcrole` an `xs:anyURI` of
 * at least one character, `title` an `xs:string`, and `label`, `from` and `to` an `xs:NCName`. Only
 * the content-packaging set imports them ({@link attributeSchemaSets}), so a kind admits them under
 * their closed handles only where its documents are assessed against that set (C30 of
 * `docs/research/up.md`).
 */
export const xlinkAttributes: readonly GlobalAttribute[] = globalAttributes.filter(({ name }) =>
  name.startsWith("xlink:"),
);

/**
 * The schema sets ({@link schemaSets}) whose documents are assessed against each attribute-only
 * schema's global declarations, because the set's root XSD imports it: `xml.xsd` by the ASI XSDs
 * (lines 12 to 15) and the content-packaging XSDs (lines 12 to 16), and XLink by the
 * content-packaging extension the content-packaging XSDs import. The loose LOM binding and the
 * usage-data XSD import neither.
 */
export const attributeSchemaSets = {
  xlink: ["cp"],
  xml: ["asi", "cp"],
} as const satisfies Readonly<Record<string, readonly (keyof typeof schemaSets)[]>>;

/**
 * Whether an element of a namespace may carry an attribute-only schema's global attributes under
 * their closed handles: some schema set its documents are assessed against imports the schema. An
 * element of a vocabulary stands in the documents of every set that lists the vocabulary, and one
 * of no vocabulary's namespace, a foreign element, in documents of every set (spec reading 81), so
 * one grammar serves all of them and admits the declarations any of those sets holds: reading 81's
 * limit, for attributes as for elements.
 *
 * @param host - The namespace of the element's kind.
 * @param schema - The attribute-only schema.
 * @returns Whether a set the element's documents are assessed against imports it.
 */
export const holdsGlobals = (
  host: NamespaceOfKind,
  schema: keyof typeof attributeSchemaSets,
): boolean => {
  const imports: readonly string[] = attributeSchemaSets[schema];

  return Object.entries(schemaSets).some(
    ([set, members]: readonly [string, readonly string[]]) =>
      imports.includes(set) && standsIn(host, members),
  );
};

/**
 * Global attributes as a `skip` wildcard admits them: unvalidated, so each value is read under the
 * open type, while the name keeps its closed handle.
 *
 * @param declared - The global attributes.
 * @returns Them, each under the open type.
 */
const unvalidated = (declared: readonly GlobalAttribute[]): readonly GlobalAttribute[] =>
  declared.map(({ name }) => ({ ...openAttribute, name }));

/**
 * The `xml:` attributes a kind admits under an attribute wildcard that admits the XML namespace, by
 * the wildcard's processing.
 *
 * Under `lax` and `strict` a processor validates each name against its global declaration, so its
 * value has `xml.xsd`'s type ({@link xmlAttributes}). Under `skip`, which MathML's 182 wildcards
 * hold, it validates none, so its value is free text. Under all three the name is the closed handle
 * `xml:<name>`, never an open `foreign` name (fin.md, D2).
 *
 * @see {@link https://www.w3.org/TR/xmlschema-1/#Wildcard_details | XML Schema 1.0, The Wildcard Schema Component}
 */
const xmlAttributesUnder: Readonly<Record<Processing, readonly GlobalAttribute[]>> = {
  lax: xmlAttributes,
  skip: unvalidated(xmlAttributes),
  strict: xmlAttributes,
};

/**
 * XLink's attributes a kind admits under an attribute wildcard that admits XLink's namespace, by
 * the wildcard's processing, as {@link xmlAttributesUnder} reads `xml.xsd`'s.
 */
const xlinkAttributesUnder: Readonly<Record<Processing, readonly GlobalAttribute[]>> = {
  lax: xlinkAttributes,
  skip: unvalidated(xlinkAttributes),
  strict: xlinkAttributes,
};

/**
 * XML Schema's four built-in instance attributes, as the derived leaf states XML Schema 1.0 Part 1,
 * 3.2.7's declarations of them.
 *
 * A schema processor holds their declarations everywhere and assesses them before any wildcard,
 * skip included, so every element kind admits all four, in both versions, as closed attributes
 * (spec reading 47), and none is ever an open name. The rules that tie `xsi:type` to the declared
 * type and `xsi:nil` to a nillable declaration are not stated by these rows.
 *
 * @see {@link https://www.w3.org/TR/xmlschema-1/#xsi_type | XML Schema 1.0, 2.6 Schema-Related Markup in Documents Being Validated}
 */
export const xsiAttributes: readonly GlobalAttribute[] = globalAttributes.filter(({ name }) =>
  name.startsWith("xsi:"),
);

/**
 * The local names of global attributes, their prefix removed.
 *
 * @param declared - The attributes, each named `<prefix>:<local>`.
 * @returns Their local names.
 */
const localsOf = (declared: readonly GlobalAttribute[]): ReadonlySet<string> =>
  new Set(declared.map(({ name }) => name.slice(name.indexOf(":") + 1)));

/**
 * The local names of {@link xmlAttributes}, in the XML namespace.
 */
const xmlDeclared = localsOf(xmlAttributes);

/**
 * The local names of {@link xsiAttributes}, in XML Schema's instance namespace.
 */
const xsiDeclared = localsOf(xsiAttributes);

/**
 * Whether a no-namespace attribute's name is a valid `data-*` name.
 *
 * @param local - The attribute's local name.
 * @returns Whether it matches {@link dataName}, which proves its `data-` prefix.
 */
const isDataName = (local: string): local is `data-${string}` => dataName.test(local);

/**
 * The reasons a name no closed handle names cannot be an open name, whatever its element admits.
 *
 * - `declared`: `xml.xsd` or XML Schema itself declares it, an `xml:` or `xsi:` name, so it is read
 *   only under its closed handle.
 * - `data-name`: it is in no namespace and begins `data-`, but breaks {@link dataName}.
 */
export const openClassRefusals = ["declared", "data-name"] as const;

/**
 * A reason {@link openClassOf} refuses a name.
 */
export type OpenClassRefusal = (typeof openClassRefusals)[number];

/**
 * An attribute name no closed handle names that is no open name either, whatever its element
 * admits: one a schema declares, or a `data-` name that breaks {@link dataName}.
 *
 * `attribute` is the attribute's qualified name as written and `namespace` its namespace name,
 * empty for none; `element` is the element's local name.
 */
export class OpenClassRefused extends Schema.TaggedError<OpenClassRefused>()("OpenClassRefused", {
  attribute: Schema.String,
  element: Schema.String,
  namespace: Schema.String,
  reason: Schema.Literals(openClassRefusals),
}) {
  /**
   * Why the name is read under no class, and how to change the attribute so the document is read.
   */
  override get message(): string {
    const { attribute, element } = this;
    const messages: Readonly<Record<OpenClassRefusal, string>> = {
      "data-name": `${attribute} is not a valid data-* attribute name: after "data-", QTI allows one or more lower-case ASCII letters, digits, "_", "." and "-" (spec reading 13). Rename it in lower case.`,
      declared: `${attribute} is declared by a schema the model reads, so the model reads it only under its own name, and it has no attribute ${attribute} on ${element}. The document may still be valid: this is a gap in the model's vocabulary, so report it with the document.`,
    };

    return messages[this.reason];
  }
}

/**
 * The element an attribute is on, as {@link openClassOf} reads it: its namespace name, as crust's
 * tree spells it, which a name in its own namespace is classed against; its local name, which a
 * refusal names; and whether it is a foreign element, whose names in no namespace are never
 * `data-*`.
 */
export interface AttributeHost {
  readonly foreign: boolean;
  readonly local: string;
  readonly namespace: string;
}

/**
 * Classify an attribute name that no closed handle names (review R6): the codec's half of open
 * names, beside the admission that `AttributeAdmission` states for each class.
 *
 * In a namespace it is classed by {@link namespaceClassOf} against its element's namespace, the
 * target namespace of every wildcard its element holds: `own-namespace` in that namespace and
 * `foreign` in another, but for a name `xml.xsd` or XML Schema declares. In no namespace it is
 * `data-*` when it matches {@link dataName}, refused when it begins `data-` and does not (spec
 * reading 13), and `no-namespace` otherwise; on a foreign element, whose markup is no HTML, it is
 * `no-namespace`
 * whatever its name. Which classes a kind admits is the admission relation's to say, so a class
 * the element's wildcard refuses is refused there, not here.
 *
 * @param attribute - The attribute's name as the reader resolved it; never a namespace declaration.
 * @param element - The element it is on.
 * @returns Its open name, or an {@link OpenClassRefused}.
 */
export const openClassOf = (
  attribute: Pick<Attribute, "local" | "namespace" | "prefix" | "qname">,
  element: AttributeHost,
): Result.Result<OpenName, OpenClassRefused> => {
  const { local, namespace, prefix } = attribute;
  const refuse = (reason: OpenClassRefusal): Result.Result<never, OpenClassRefused> =>
    Result.fail(
      new OpenClassRefused({
        attribute: attribute.qname,
        element: element.local,
        namespace,
        reason,
      }),
    );

  if (
    (namespace === xsiNamespace && xsiDeclared.has(local)) ||
    (namespace === xmlNamespace && xmlDeclared.has(local))
  ) {
    return refuse("declared");
  }

  return Match.value(
    namespaceClassOf(namespaceNameOf(namespace), namespaceNameOf(element.namespace)),
  ).pipe(
    Match.when("own", () =>
      Result.succeed<OpenName>({ _tag: "own-namespace", local, prefix, uri: namespace }),
    ),
    Match.when("other", () =>
      Result.succeed<OpenName>({ _tag: "foreign", local, prefix, uri: namespace }),
    ),
    Match.when("absent", () => {
      if (element.foreign || !local.startsWith("data-")) {
        return Result.succeed<OpenName>({ _tag: "no-namespace", local });
      }

      return isDataName(local)
        ? Result.succeed<OpenName>({ _tag: "data-*", local })
        : refuse("data-name");
    }),
    Match.exhaustive,
  );
};

/**
 * The open classes an attribute that no closed handle names takes, by its namespace class
 * ({@link openClassOf}): in no namespace `data-*` or `no-namespace`, by its name; in its element's
 * own namespace `own-namespace`; in another `foreign`.
 */
const openClassesIn: Readonly<Record<NamespaceClass, readonly OpenClass[]>> = {
  absent: ["data-*", "no-namespace"],
  other: ["foreign"],
  own: ["own-namespace"],
};

/**
 * Admit an open class, its values read as free text: the open type, under the class's handle.
 *
 * @param name - The class's handle.
 * @returns Its admission.
 */
const openAs = (name: OpenClass): GlobalAttribute => ({ ...openAttribute, name });

/**
 * The attributes an attribute wildcard adds to the kinds of the element that holds it, beside those
 * its kinds declare, as its namespace constraint and processing read them (XML Schema 1.0 Part 1,
 * §3.10.4 and §3.4.4, clause 3.1):
 *
 * - The `xml:` names `xml.xsd` declares, where the constraint admits the XML namespace, which is
 *   never a target namespace (`other`), and a schema set the element's documents are assessed
 *   against imports `xml.xsd` ({@link holdsGlobals}): under `lax` and `strict` validated against
 *   `xml.xsd`'s declarations, so with their types; under `skip` unvalidated, so as free text under
 *   their closed handles.
 * - XLink's ten names the same way, where the constraint admits XLink's namespace, likewise never a
 *   target namespace, and a set the element's documents are assessed against imports XLink: the
 *   content-packaging set's.
 * - The open classes of every namespace class the constraint admits ({@link namespaceClassesUnder}),
 *   as free text, unless it is `strict`, which lets through no attribute that no schema declares,
 *   and no schema declares one of an open class.
 *
 * @param wildcard - The wildcard's namespace constraint and processing, as the leaf states them.
 * @param host - The namespace of the kind of the element that holds it.
 * @returns The attributes, the `xml:` names first, then XLink's, then the classes in roster order.
 */
export const attributesUnder = (
  { namespace, processing }: Pick<AttributeWildcard, "namespace" | "processing">,
  host: NamespaceOfKind,
): readonly GlobalAttribute[] => {
  const classes = namespaceClassesUnder[namespace];
  const other = classes.includes("other");
  const xml = other && holdsGlobals(host, "xml") ? xmlAttributesUnder[processing] : [];
  const xlink = other && holdsGlobals(host, "xlink") ? xlinkAttributesUnder[processing] : [];
  const open =
    processing === "strict"
      ? []
      : openClasses.filter((name) => classes.some((held) => openClassesIn[held].includes(name)));

  return [...xml, ...xlink, ...open.map(openAs)];
};

/**
 * The attribute wildcard of `xs:anyType`, the type XML Schema assesses a foreign element against
 * when a `lax` or `skip` wildcard admits it with no declaration: every namespace, `lax` (XML
 * Schema 1.0 Part 1, §3.4.7).
 */
const anyTypeWildcard = { namespace: "##any", processing: "lax" } as const satisfies Pick<
  AttributeWildcard,
  "namespace" | "processing"
>;

/**
 * The attributes every foreign kind admits: those {@link anyTypeWildcard} adds, but `data-*`, the
 * class of HTML's custom data names, which a foreign element's markup is not ({@link openClassOf}
 * reads its names in no namespace as `no-namespace`). A foreign kind names no element, so a
 * foreign element stands in documents of every schema set, and admits `xml.xsd`'s and XLink's
 * names with their types ({@link holdsGlobals}).
 */
export const foreignAttributes: readonly GlobalAttribute[] = attributesUnder(
  anyTypeWildcard,
  nameless,
).filter(({ name }) => name !== "data-*");

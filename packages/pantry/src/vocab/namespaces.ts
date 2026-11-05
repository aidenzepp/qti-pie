/**
 * The namespace names the vocabularies are read in, each stated once, the prefix each
 * vocabulary's kind handles carry (review R14), and the classes a wildcard sorts namespace names
 * into.
 *
 * A vocabulary's handles are its elements' local names behind its handle prefix (`m:mi`,
 * `ssml:p`), the ASI vocabulary's alone unprefixed. The prefix is the handle's, never the one an
 * XSD or a document binds: the ASI XSDs write MathML as `m3:` and SSML as `ssml11:`, and a
 * document may bind any prefix, while a handle names the element by its namespace.
 */
import { Option } from "effect";
import type { NamespaceConstraint } from "#pantry/vocab/inventory/types.ts";

/**
 * The XML Schema namespace, which every XSD construct and every built-in simple type is in.
 */
export const xsNamespace = "http://www.w3.org/2001/XMLSchema";

/**
 * XML Schema's instance namespace, of `xsi:type`, `xsi:nil`, `xsi:schemaLocation` and
 * `xsi:noNamespaceSchemaLocation`.
 */
export const xsiNamespace = "http://www.w3.org/2001/XMLSchema-instance";

/**
 * The namespace the `xml` prefix is bound to without a declaration, of the attributes `xml.xsd`
 * declares.
 */
export const xmlNamespace = "http://www.w3.org/XML/1998/namespace";

/**
 * The namespace of namespace declarations, which the reader gives every `xmlns` attribute.
 */
export const xmlnsNamespace = "http://www.w3.org/2000/xmlns/";

/**
 * The XLink namespace, of the `xlink:` attributes the content-packaging extension declares.
 */
export const xlinkNamespace = "http://www.w3.org/1999/xlink";

/**
 * The namespace of each vocabulary the pinned XSDs declare, with the prefix its kind handles carry,
 * in composition order.
 */
export const vocabularyNamespaces = {
  asi: { namespace: "http://www.imsglobal.org/xsd/imsqtiasi_v3p0", prefix: "" },
  cp: { namespace: "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1", prefix: "cp:" },
  cpx: {
    namespace: "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_extensionv1p2",
    prefix: "cpx:",
  },
  csmd: { namespace: "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscsmd_v1p1", prefix: "csmd:" },
  drd: { namespace: "http://www.imsglobal.org/xsd/qti/qtiv3p0/imsafa3p0drd_v1p0", prefix: "drd:" },
  lom: { namespace: "http://ltsc.ieee.org/xsd/LOM", prefix: "lom:" },
  mathml: { namespace: "http://www.w3.org/1998/Math/MathML", prefix: "m:" },
  qmd: { namespace: "http://www.imsglobal.org/xsd/imsqti_metadata_v3p0", prefix: "qmd:" },
  ssml: { namespace: "http://www.w3.org/2001/10/synthesis", prefix: "ssml:" },
  ud: { namespace: "http://www.imsglobal.org/xsd/imsqti_usagedata_v3p0", prefix: "ud:" },
  xi: { namespace: "http://www.w3.org/2001/XInclude", prefix: "xi:" },
} as const satisfies Readonly<
  Record<string, { readonly namespace: string; readonly prefix: string }>
>;

/**
 * A vocabulary the pinned XSDs declare.
 */
export type VocabularyName = keyof typeof vocabularyNamespaces;

/**
 * The QTI namespace, which the ASI XSDs' elements, HTML's included, are in.
 */
export const asiNamespace = vocabularyNamespaces.asi.namespace;

/**
 * The MathML namespace.
 */
export const mathmlNamespace = vocabularyNamespaces.mathml.namespace;

/**
 * The SSML namespace, which the core profile's chameleon include gives every SSML element.
 */
export const ssmlNamespace = vocabularyNamespaces.ssml.namespace;

/**
 * The XInclude namespace, of `xi:include` and `xi:fallback`.
 */
export const xincludeNamespace = vocabularyNamespaces.xi.namespace;

/**
 * The namespace of the content-packaging XSDs' elements.
 */
export const cpNamespace = vocabularyNamespaces.cp.namespace;

/**
 * The namespace of the QTI metadata XSD's elements.
 */
export const qtiMetadataNamespace = vocabularyNamespaces.qmd.namespace;

/**
 * The namespaces QTI 2's published XSDs declare, each the `targetNamespace` of one of them: items,
 * sections and tests in `imsqti_v2p0`, `imsqti_v2p1` and `imsqti_v2p2`, then the 2.1 and 2.2
 * metadata, results reporting and usage data. A document whose root is in one is a QTI 2 document,
 * which no QTI 3 schema reads, so shred refuses it as `not-qti3` before it reads a name (spec
 * reading 80). QTI 3.0's own namespaces are disjoint from these; a root in any other namespace QTI
 * 3.0 does not declare is not QTI 2 and is refused as an unknown name.
 *
 * @see {@link https://www.imsglobal.org/xsd/imsqti_v2p2.xsd | QTI 2.2 ASI XSD, `targetNamespace` (line 3)}
 * @see {@link https://www.imsglobal.org/xsd/imsqti_usagedata_v2p2.xsd | QTI 2.2 usage data XSD, `targetNamespace` (line 3)}
 */
export const qti2Namespaces: ReadonlySet<string> = new Set([
  "http://www.imsglobal.org/xsd/imsqti_v2p0",
  "http://www.imsglobal.org/xsd/imsqti_v2p1",
  "http://www.imsglobal.org/xsd/imsqti_v2p2",
  "http://www.imsglobal.org/xsd/imsqti_metadata_v2p1",
  "http://www.imsglobal.org/xsd/imsqti_metadata_v2p2",
  "http://www.imsglobal.org/xsd/imsqti_result_v2p1",
  "http://www.imsglobal.org/xsd/imsqti_result_v2p2",
  "http://www.imsglobal.org/xsd/imsqti_usagedata_v2p1",
  "http://www.imsglobal.org/xsd/imsqti_usagedata_v2p2",
]);

/**
 * The handle prefix of each namespace a vocabulary is in.
 */
const prefixes: ReadonlyMap<string, string> = new Map(
  Object.values(vocabularyNamespaces).map(({ namespace, prefix }) => [namespace, prefix] as const),
);

/**
 * The handle prefix of a namespace.
 *
 * @param namespace - A namespace name.
 * @returns The prefix its handles carry, or `None` when no vocabulary is in it.
 */
export const handlePrefixOf = (namespace: string): Option.Option<string> =>
  Option.fromNullishOr(prefixes.get(namespace));

/**
 * The classes of namespace name XML Schema's wildcards tell apart, relative to a wildcard's target
 * namespace, the target namespace of the schema document it is written in (XML Schema 1.0 Part 1,
 * §3.10.2): `absent`, no namespace; `own`, the target namespace; `other`, any other, the XML
 * namespace among them, since no schema document has it as its target namespace but `xml.xsd`,
 * which declares no wildcard.
 *
 * Every namespace constraint the pinned XSDs write is `##any`, `##other` or `##local`
 * ({@link namespaceClassesUnder}), and those three tell no namespace apart from another of its
 * class, so a class is all a wildcard reads of a name. A list of namespace names would need a
 * class for each, and the IR refuses to read one (`src/vocab/derive/models.ts`).
 */
export const namespaceClasses = ["absent", "own", "other"] as const;

/**
 * A class of namespace name, relative to a wildcard's target namespace.
 */
export type NamespaceClass = (typeof namespaceClasses)[number];

/**
 * Class a namespace name against a wildcard's target namespace.
 *
 * Every wildcard the IR holds is written in the schema of the element that holds it, in that
 * element's namespace (`src/vocab/derive/models.ts` refuses a model that breaks it), so the target
 * namespace is the namespace name of the element whose content or attributes the wildcard admits.
 * When the target namespace is absent, `own` is empty: a name in no namespace is `absent`.
 *
 * @param namespace - The namespace name of an element or attribute, empty for none.
 * @param target - The wildcard's target namespace, empty when absent.
 * @returns Its class.
 */
export const namespaceClassOf = (namespace: string, target: string): NamespaceClass => {
  if (namespace === "") {
    return "absent";
  }

  return namespace === target ? "own" : "other";
};

/**
 * The classes each namespace constraint admits (XML Schema 1.0 Part 1, §3.10.2 and §3.10.4,
 * Wildcard allows Namespace Name): `##any` every name; `##other` the pair of not and the target
 * namespace, so neither a name in the target namespace nor one in none (clause 2.3); `##local` the
 * set of absent alone.
 *
 * @see {@link https://www.w3.org/TR/xmlschema-1/#cvc-wildcard-namespace | XML Schema 1.0, Wildcard allows Namespace Name}
 */
export const namespaceClassesUnder: Readonly<
  Record<NamespaceConstraint, readonly NamespaceClass[]>
> = {
  "##any": namespaceClasses,
  "##local": ["absent"],
  "##other": ["other"],
};

/**
 * Decide whether a namespace constraint admits a namespace name, whatever the wildcard's
 * processing.
 *
 * @param constraint - The wildcard's namespace constraint.
 * @param target - Its target namespace, the namespace name of the element that holds it.
 * @param namespace - The namespace name of the element or attribute, empty for none.
 * @returns Whether the constraint admits it.
 */
export const admitsNamespace = (
  constraint: NamespaceConstraint,
  target: string,
  namespace: string,
): boolean => namespaceClassesUnder[constraint].includes(namespaceClassOf(namespace, target));

/**
 * The wildcard seed tables: the hosts that carry an element or an attribute wildcard, the
 * namespaces each wildcard excludes, the global declarations a wildcard's content is typed by,
 * and the schema set each root is judged against.
 *
 * Data only. Each export is an array of plain rows typed by roster handles, in the form of
 * `binding-fit.ts`; the relations that seed from them (`WildcardHost`, `AttributeWildcard`,
 * `WildcardExclusion`, `AttributeExclusion`, `GlobalElement`, `GlobalAttribute`, `RootSchemaSet`)
 * and the rows `Admission` and `AttributeAdmission` derive from them are other units'. The
 * derivation lives in `wildcard.test.ts`, which reads the QTI schema documents from the shared
 * cache, follows each schema set's imports from its root documents, and asserts every row below
 * equal to what the documents declare (the hosts and their policies, the global elements and
 * attributes, the three `xlink` rosters), the namespace exclusions equal to the policy rules of
 * the spec's 4.3, and the MathML exclusion rows apart from them as the Recommendation's. No
 * derivation lives anywhere else.
 *
 * The host kinds of phases that have not landed (the selection and ordering classes, the
 * companion materials, the custom interaction, the `template` content, MathML and SSML) have no row
 * here: each joins its host table rows in its own unit, and the test names them on its pending-join
 * list until then.
 */
import type {
  NamespacePolicyHandle,
  ProcessContentsHandle,
  SchemaSetHandle,
} from "#pantry/schema/content/rosters.ts";
import type { AttributeNameHandle, NodeKindHandle, RootKindHandle } from "#pantry/schema/node.ts";

/**
 * A host row of `WildcardHost` and `AttributeWildcard`: the kind, what its wildcard admits and the
 * namespace `##other` is relative to.
 */
export interface WildcardHostRow {
  readonly host: NodeKindHandle;
  readonly policy: NamespacePolicyHandle;
  readonly process: ProcessContentsHandle;
  readonly target: string;
}

/**
 * A host and a namespace its wildcard refuses, a row of `WildcardExclusion` and
 * `AttributeExclusion`.
 */
export interface HostNamespaceRow {
  readonly host: NodeKindHandle;
  readonly namespace: string;
}

/**
 * A declaration of a schema set: a global element or attribute and the set that declares it, a row
 * of `GlobalElement` and `GlobalAttribute`.
 */
export interface GlobalRow {
  readonly local: string;
  readonly namespace: string;
  readonly set: SchemaSetHandle;
}

/**
 * The schema set a root kind is judged against, a row of `RootSchemaSet`.
 */
export interface RootSchemaSetRow {
  readonly root: RootKindHandle;
  readonly set: SchemaSetHandle;
}

/**
 * An attribute a wildcard host admits as typed, a row for `AttributeAdmission`.
 */
export interface WildcardAttributeAdmissionRow {
  readonly attribute: AttributeNameHandle;
  readonly kind: NodeKindHandle;
}

/**
 * The namespaces the tables name, by the prefix this repository gives each: the target namespaces
 * of the schema documents, `xml` for `w3/xml.xsd`'s, `xlink` for `w3/xlink.xsd`'s, the
 * `xmlns` namespace declarations live in, and `xsi` for XML Schema's instance namespace.
 */
export const namespaces = {
  asi: "http://www.imsglobal.org/xsd/imsqtiasi_v3p0",
  cp: "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_v1p1",
  cpx: "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscp_extensionv1p2",
  csmd: "http://www.imsglobal.org/xsd/qti/qtiv3p0/imscsmd_v1p1",
  drd: "http://www.imsglobal.org/xsd/qti/qtiv3p0/imsafa3p0drd_v1p0",
  lom: "http://ltsc.ieee.org/xsd/LOM",
  mathml: "http://www.w3.org/1998/Math/MathML",
  qmd: "http://www.imsglobal.org/xsd/imsqti_metadata_v3p0",
  ssml: "http://www.w3.org/2001/10/synthesis",
  ud: "http://www.imsglobal.org/xsd/imsqti_usagedata_v3p0",
  xi: "http://www.w3.org/2001/XInclude",
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/",
  xsi: "http://www.w3.org/2001/XMLSchema-instance",
} as const;

/**
 * The rows of one namespace and set from their local names.
 *
 * @param set - The schema set that declares them.
 * @param namespace - Their namespace.
 * @param names - The local names.
 * @returns One row per name.
 */
const locals = (
  set: SchemaSetHandle,
  namespace: string,
  names: readonly string[],
): readonly GlobalRow[] => names.map((local) => ({ local, namespace, set }));

/**
 * The element wildcard hosts: 42 kinds the model has whose type carries an `xs:any`, then
 * `foreign`, which admits any namespace and judges none of it.
 */
export const wildcardHost: readonly WildcardHostRow[] = [
  { host: "qti-custom-operator", policy: "other", process: "lax", target: namespaces.asi },
  { host: "cp:metadata.file", policy: "other", process: "strict", target: namespaces.cp },
  { host: "lom:lom", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:general", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:identifier", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:structure", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:aggregationLevel", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:lifeCycle", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:status", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:contribute", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:role", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:date", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:metaMetadata", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:technical", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:requirement", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:orComposite", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:type", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:name", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:duration", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:rights", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:cost", policy: "other", process: "lax", target: namespaces.lom },
  {
    host: "lom:copyrightAndOtherRestrictions",
    policy: "other",
    process: "lax",
    target: namespaces.lom,
  },
  { host: "lom:educational", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:interactivityType", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:learningResourceType", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:interactivityLevel", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:semanticDensity", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:intendedEndUserRole", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:context", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:difficulty", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:typicalLearningTime", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:classification", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:purpose", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:taxonPath", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:taxon", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:relation", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:kind", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:resource", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:annotation", policy: "other", process: "lax", target: namespaces.lom },
  { host: "drd:accessForAllResource", policy: "other", process: "strict", target: namespaces.drd },
  { host: "xi:include", policy: "otherOrLocal", process: "lax", target: namespaces.xi },
  { host: "xi:fallback", policy: "otherOrLocal", process: "lax", target: namespaces.xi },
  { host: "foreign", policy: "any", process: "lax", target: "" },
];

/**
 * The attribute wildcard hosts: 65 kinds the model has whose type carries a lax
 * `xs:anyAttribute`, then `foreign`. The strict attribute wildcards of the selection and ordering
 * classes, and the skipped ones of MathML, are other units'.
 */
export const attributeWildcard: readonly WildcardHostRow[] = [
  { host: "qti-custom-operator", policy: "other", process: "lax", target: namespaces.asi },
  { host: "lom:lom", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:general", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:identifier", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:catalog", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:entry", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:title", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:string", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:language", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:description", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:keyword", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:coverage", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:structure", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:source", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:value", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:lifeCycle", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:version", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:status", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:contribute", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:role", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:entity", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:date", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:dateTime", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:metaMetadata", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:metadataschema", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:technical", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:format", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:size", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:location", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:requirement", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:orComposite", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:type", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:name", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:minimumVersion", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:maximumVersion", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:installationRemarks", policy: "other", process: "lax", target: namespaces.lom },
  {
    host: "lom:otherPlatformRequirements",
    policy: "other",
    process: "lax",
    target: namespaces.lom,
  },
  { host: "lom:duration", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:duration.string", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:rights", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:cost", policy: "other", process: "lax", target: namespaces.lom },
  {
    host: "lom:copyrightAndOtherRestrictions",
    policy: "other",
    process: "lax",
    target: namespaces.lom,
  },
  { host: "lom:educational", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:interactivityType", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:learningResourceType", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:interactivityLevel", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:semanticDensity", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:intendedEndUserRole", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:context", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:typicalAgeRange", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:difficulty", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:typicalLearningTime", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:classification", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:purpose", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:taxonPath", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:source.langString", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:taxon", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:id", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:entry.langString", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:relation", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:kind", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:resource", policy: "other", process: "lax", target: namespaces.lom },
  { host: "lom:annotation", policy: "other", process: "lax", target: namespaces.lom },
  { host: "xi:include", policy: "other", process: "lax", target: namespaces.xi },
  { host: "xi:fallback", policy: "other", process: "lax", target: namespaces.xi },
  { host: "foreign", policy: "any", process: "lax", target: "" },
];

/**
 * The namespaces an element wildcard refuses: for `##other` its target namespace and no
 * namespace, for `##other ##local` its target namespace, for `##any` none. Every host also refuses
 * the MathML namespace, the last block: the MathML Recommendation, not any XSD, excludes `m:*`
 * from foreign content (reading 2, decision 110), and a MathML element with a kind is never
 * stored as `foreign`.
 */
export const wildcardExclusion: readonly HostNamespaceRow[] = [
  { host: "qti-custom-operator", namespace: namespaces.asi },
  { host: "qti-custom-operator", namespace: "" },
  { host: "cp:metadata.file", namespace: namespaces.cp },
  { host: "cp:metadata.file", namespace: "" },
  { host: "lom:lom", namespace: namespaces.lom },
  { host: "lom:lom", namespace: "" },
  { host: "lom:general", namespace: namespaces.lom },
  { host: "lom:general", namespace: "" },
  { host: "lom:identifier", namespace: namespaces.lom },
  { host: "lom:identifier", namespace: "" },
  { host: "lom:structure", namespace: namespaces.lom },
  { host: "lom:structure", namespace: "" },
  { host: "lom:aggregationLevel", namespace: namespaces.lom },
  { host: "lom:aggregationLevel", namespace: "" },
  { host: "lom:lifeCycle", namespace: namespaces.lom },
  { host: "lom:lifeCycle", namespace: "" },
  { host: "lom:status", namespace: namespaces.lom },
  { host: "lom:status", namespace: "" },
  { host: "lom:contribute", namespace: namespaces.lom },
  { host: "lom:contribute", namespace: "" },
  { host: "lom:role", namespace: namespaces.lom },
  { host: "lom:role", namespace: "" },
  { host: "lom:date", namespace: namespaces.lom },
  { host: "lom:date", namespace: "" },
  { host: "lom:metaMetadata", namespace: namespaces.lom },
  { host: "lom:metaMetadata", namespace: "" },
  { host: "lom:technical", namespace: namespaces.lom },
  { host: "lom:technical", namespace: "" },
  { host: "lom:requirement", namespace: namespaces.lom },
  { host: "lom:requirement", namespace: "" },
  { host: "lom:orComposite", namespace: namespaces.lom },
  { host: "lom:orComposite", namespace: "" },
  { host: "lom:type", namespace: namespaces.lom },
  { host: "lom:type", namespace: "" },
  { host: "lom:name", namespace: namespaces.lom },
  { host: "lom:name", namespace: "" },
  { host: "lom:duration", namespace: namespaces.lom },
  { host: "lom:duration", namespace: "" },
  { host: "lom:rights", namespace: namespaces.lom },
  { host: "lom:rights", namespace: "" },
  { host: "lom:cost", namespace: namespaces.lom },
  { host: "lom:cost", namespace: "" },
  { host: "lom:copyrightAndOtherRestrictions", namespace: namespaces.lom },
  { host: "lom:copyrightAndOtherRestrictions", namespace: "" },
  { host: "lom:educational", namespace: namespaces.lom },
  { host: "lom:educational", namespace: "" },
  { host: "lom:interactivityType", namespace: namespaces.lom },
  { host: "lom:interactivityType", namespace: "" },
  { host: "lom:learningResourceType", namespace: namespaces.lom },
  { host: "lom:learningResourceType", namespace: "" },
  { host: "lom:interactivityLevel", namespace: namespaces.lom },
  { host: "lom:interactivityLevel", namespace: "" },
  { host: "lom:semanticDensity", namespace: namespaces.lom },
  { host: "lom:semanticDensity", namespace: "" },
  { host: "lom:intendedEndUserRole", namespace: namespaces.lom },
  { host: "lom:intendedEndUserRole", namespace: "" },
  { host: "lom:context", namespace: namespaces.lom },
  { host: "lom:context", namespace: "" },
  { host: "lom:difficulty", namespace: namespaces.lom },
  { host: "lom:difficulty", namespace: "" },
  { host: "lom:typicalLearningTime", namespace: namespaces.lom },
  { host: "lom:typicalLearningTime", namespace: "" },
  { host: "lom:classification", namespace: namespaces.lom },
  { host: "lom:classification", namespace: "" },
  { host: "lom:purpose", namespace: namespaces.lom },
  { host: "lom:purpose", namespace: "" },
  { host: "lom:taxonPath", namespace: namespaces.lom },
  { host: "lom:taxonPath", namespace: "" },
  { host: "lom:taxon", namespace: namespaces.lom },
  { host: "lom:taxon", namespace: "" },
  { host: "lom:relation", namespace: namespaces.lom },
  { host: "lom:relation", namespace: "" },
  { host: "lom:kind", namespace: namespaces.lom },
  { host: "lom:kind", namespace: "" },
  { host: "lom:resource", namespace: namespaces.lom },
  { host: "lom:resource", namespace: "" },
  { host: "lom:annotation", namespace: namespaces.lom },
  { host: "lom:annotation", namespace: "" },
  { host: "drd:accessForAllResource", namespace: namespaces.drd },
  { host: "drd:accessForAllResource", namespace: "" },
  { host: "xi:include", namespace: namespaces.xi },
  { host: "xi:fallback", namespace: namespaces.xi },
  { host: "qti-custom-operator", namespace: namespaces.mathml },
  { host: "cp:metadata.file", namespace: namespaces.mathml },
  { host: "lom:lom", namespace: namespaces.mathml },
  { host: "lom:general", namespace: namespaces.mathml },
  { host: "lom:identifier", namespace: namespaces.mathml },
  { host: "lom:structure", namespace: namespaces.mathml },
  { host: "lom:aggregationLevel", namespace: namespaces.mathml },
  { host: "lom:lifeCycle", namespace: namespaces.mathml },
  { host: "lom:status", namespace: namespaces.mathml },
  { host: "lom:contribute", namespace: namespaces.mathml },
  { host: "lom:role", namespace: namespaces.mathml },
  { host: "lom:date", namespace: namespaces.mathml },
  { host: "lom:metaMetadata", namespace: namespaces.mathml },
  { host: "lom:technical", namespace: namespaces.mathml },
  { host: "lom:requirement", namespace: namespaces.mathml },
  { host: "lom:orComposite", namespace: namespaces.mathml },
  { host: "lom:type", namespace: namespaces.mathml },
  { host: "lom:name", namespace: namespaces.mathml },
  { host: "lom:duration", namespace: namespaces.mathml },
  { host: "lom:rights", namespace: namespaces.mathml },
  { host: "lom:cost", namespace: namespaces.mathml },
  { host: "lom:copyrightAndOtherRestrictions", namespace: namespaces.mathml },
  { host: "lom:educational", namespace: namespaces.mathml },
  { host: "lom:interactivityType", namespace: namespaces.mathml },
  { host: "lom:learningResourceType", namespace: namespaces.mathml },
  { host: "lom:interactivityLevel", namespace: namespaces.mathml },
  { host: "lom:semanticDensity", namespace: namespaces.mathml },
  { host: "lom:intendedEndUserRole", namespace: namespaces.mathml },
  { host: "lom:context", namespace: namespaces.mathml },
  { host: "lom:difficulty", namespace: namespaces.mathml },
  { host: "lom:typicalLearningTime", namespace: namespaces.mathml },
  { host: "lom:classification", namespace: namespaces.mathml },
  { host: "lom:purpose", namespace: namespaces.mathml },
  { host: "lom:taxonPath", namespace: namespaces.mathml },
  { host: "lom:taxon", namespace: namespaces.mathml },
  { host: "lom:relation", namespace: namespaces.mathml },
  { host: "lom:kind", namespace: namespaces.mathml },
  { host: "lom:resource", namespace: namespaces.mathml },
  { host: "lom:annotation", namespace: namespaces.mathml },
  { host: "drd:accessForAllResource", namespace: namespaces.mathml },
  { host: "xi:include", namespace: namespaces.mathml },
  { host: "xi:fallback", namespace: namespaces.mathml },
  { host: "foreign", namespace: namespaces.mathml },
];

/**
 * The namespaces an attribute wildcard refuses: the `xmlns` namespace on every host, and no
 * namespace and the target namespace on a `##other` host.
 */
export const attributeExclusion: readonly HostNamespaceRow[] = [
  { host: "qti-custom-operator", namespace: namespaces.xmlns },
  { host: "qti-custom-operator", namespace: namespaces.asi },
  { host: "qti-custom-operator", namespace: "" },
  { host: "lom:lom", namespace: namespaces.xmlns },
  { host: "lom:lom", namespace: namespaces.lom },
  { host: "lom:lom", namespace: "" },
  { host: "lom:general", namespace: namespaces.xmlns },
  { host: "lom:general", namespace: namespaces.lom },
  { host: "lom:general", namespace: "" },
  { host: "lom:identifier", namespace: namespaces.xmlns },
  { host: "lom:identifier", namespace: namespaces.lom },
  { host: "lom:identifier", namespace: "" },
  { host: "lom:catalog", namespace: namespaces.xmlns },
  { host: "lom:catalog", namespace: namespaces.lom },
  { host: "lom:catalog", namespace: "" },
  { host: "lom:entry", namespace: namespaces.xmlns },
  { host: "lom:entry", namespace: namespaces.lom },
  { host: "lom:entry", namespace: "" },
  { host: "lom:title", namespace: namespaces.xmlns },
  { host: "lom:title", namespace: namespaces.lom },
  { host: "lom:title", namespace: "" },
  { host: "lom:string", namespace: namespaces.xmlns },
  { host: "lom:string", namespace: namespaces.lom },
  { host: "lom:string", namespace: "" },
  { host: "lom:language", namespace: namespaces.xmlns },
  { host: "lom:language", namespace: namespaces.lom },
  { host: "lom:language", namespace: "" },
  { host: "lom:description", namespace: namespaces.xmlns },
  { host: "lom:description", namespace: namespaces.lom },
  { host: "lom:description", namespace: "" },
  { host: "lom:keyword", namespace: namespaces.xmlns },
  { host: "lom:keyword", namespace: namespaces.lom },
  { host: "lom:keyword", namespace: "" },
  { host: "lom:coverage", namespace: namespaces.xmlns },
  { host: "lom:coverage", namespace: namespaces.lom },
  { host: "lom:coverage", namespace: "" },
  { host: "lom:structure", namespace: namespaces.xmlns },
  { host: "lom:structure", namespace: namespaces.lom },
  { host: "lom:structure", namespace: "" },
  { host: "lom:source", namespace: namespaces.xmlns },
  { host: "lom:source", namespace: namespaces.lom },
  { host: "lom:source", namespace: "" },
  { host: "lom:value", namespace: namespaces.xmlns },
  { host: "lom:value", namespace: namespaces.lom },
  { host: "lom:value", namespace: "" },
  { host: "lom:lifeCycle", namespace: namespaces.xmlns },
  { host: "lom:lifeCycle", namespace: namespaces.lom },
  { host: "lom:lifeCycle", namespace: "" },
  { host: "lom:version", namespace: namespaces.xmlns },
  { host: "lom:version", namespace: namespaces.lom },
  { host: "lom:version", namespace: "" },
  { host: "lom:status", namespace: namespaces.xmlns },
  { host: "lom:status", namespace: namespaces.lom },
  { host: "lom:status", namespace: "" },
  { host: "lom:contribute", namespace: namespaces.xmlns },
  { host: "lom:contribute", namespace: namespaces.lom },
  { host: "lom:contribute", namespace: "" },
  { host: "lom:role", namespace: namespaces.xmlns },
  { host: "lom:role", namespace: namespaces.lom },
  { host: "lom:role", namespace: "" },
  { host: "lom:entity", namespace: namespaces.xmlns },
  { host: "lom:entity", namespace: namespaces.lom },
  { host: "lom:entity", namespace: "" },
  { host: "lom:date", namespace: namespaces.xmlns },
  { host: "lom:date", namespace: namespaces.lom },
  { host: "lom:date", namespace: "" },
  { host: "lom:dateTime", namespace: namespaces.xmlns },
  { host: "lom:dateTime", namespace: namespaces.lom },
  { host: "lom:dateTime", namespace: "" },
  { host: "lom:metaMetadata", namespace: namespaces.xmlns },
  { host: "lom:metaMetadata", namespace: namespaces.lom },
  { host: "lom:metaMetadata", namespace: "" },
  { host: "lom:metadataschema", namespace: namespaces.xmlns },
  { host: "lom:metadataschema", namespace: namespaces.lom },
  { host: "lom:metadataschema", namespace: "" },
  { host: "lom:technical", namespace: namespaces.xmlns },
  { host: "lom:technical", namespace: namespaces.lom },
  { host: "lom:technical", namespace: "" },
  { host: "lom:format", namespace: namespaces.xmlns },
  { host: "lom:format", namespace: namespaces.lom },
  { host: "lom:format", namespace: "" },
  { host: "lom:size", namespace: namespaces.xmlns },
  { host: "lom:size", namespace: namespaces.lom },
  { host: "lom:size", namespace: "" },
  { host: "lom:location", namespace: namespaces.xmlns },
  { host: "lom:location", namespace: namespaces.lom },
  { host: "lom:location", namespace: "" },
  { host: "lom:requirement", namespace: namespaces.xmlns },
  { host: "lom:requirement", namespace: namespaces.lom },
  { host: "lom:requirement", namespace: "" },
  { host: "lom:orComposite", namespace: namespaces.xmlns },
  { host: "lom:orComposite", namespace: namespaces.lom },
  { host: "lom:orComposite", namespace: "" },
  { host: "lom:type", namespace: namespaces.xmlns },
  { host: "lom:type", namespace: namespaces.lom },
  { host: "lom:type", namespace: "" },
  { host: "lom:name", namespace: namespaces.xmlns },
  { host: "lom:name", namespace: namespaces.lom },
  { host: "lom:name", namespace: "" },
  { host: "lom:minimumVersion", namespace: namespaces.xmlns },
  { host: "lom:minimumVersion", namespace: namespaces.lom },
  { host: "lom:minimumVersion", namespace: "" },
  { host: "lom:maximumVersion", namespace: namespaces.xmlns },
  { host: "lom:maximumVersion", namespace: namespaces.lom },
  { host: "lom:maximumVersion", namespace: "" },
  { host: "lom:installationRemarks", namespace: namespaces.xmlns },
  { host: "lom:installationRemarks", namespace: namespaces.lom },
  { host: "lom:installationRemarks", namespace: "" },
  { host: "lom:otherPlatformRequirements", namespace: namespaces.xmlns },
  { host: "lom:otherPlatformRequirements", namespace: namespaces.lom },
  { host: "lom:otherPlatformRequirements", namespace: "" },
  { host: "lom:duration", namespace: namespaces.xmlns },
  { host: "lom:duration", namespace: namespaces.lom },
  { host: "lom:duration", namespace: "" },
  { host: "lom:duration.string", namespace: namespaces.xmlns },
  { host: "lom:duration.string", namespace: namespaces.lom },
  { host: "lom:duration.string", namespace: "" },
  { host: "lom:rights", namespace: namespaces.xmlns },
  { host: "lom:rights", namespace: namespaces.lom },
  { host: "lom:rights", namespace: "" },
  { host: "lom:cost", namespace: namespaces.xmlns },
  { host: "lom:cost", namespace: namespaces.lom },
  { host: "lom:cost", namespace: "" },
  { host: "lom:copyrightAndOtherRestrictions", namespace: namespaces.xmlns },
  { host: "lom:copyrightAndOtherRestrictions", namespace: namespaces.lom },
  { host: "lom:copyrightAndOtherRestrictions", namespace: "" },
  { host: "lom:educational", namespace: namespaces.xmlns },
  { host: "lom:educational", namespace: namespaces.lom },
  { host: "lom:educational", namespace: "" },
  { host: "lom:interactivityType", namespace: namespaces.xmlns },
  { host: "lom:interactivityType", namespace: namespaces.lom },
  { host: "lom:interactivityType", namespace: "" },
  { host: "lom:learningResourceType", namespace: namespaces.xmlns },
  { host: "lom:learningResourceType", namespace: namespaces.lom },
  { host: "lom:learningResourceType", namespace: "" },
  { host: "lom:interactivityLevel", namespace: namespaces.xmlns },
  { host: "lom:interactivityLevel", namespace: namespaces.lom },
  { host: "lom:interactivityLevel", namespace: "" },
  { host: "lom:semanticDensity", namespace: namespaces.xmlns },
  { host: "lom:semanticDensity", namespace: namespaces.lom },
  { host: "lom:semanticDensity", namespace: "" },
  { host: "lom:intendedEndUserRole", namespace: namespaces.xmlns },
  { host: "lom:intendedEndUserRole", namespace: namespaces.lom },
  { host: "lom:intendedEndUserRole", namespace: "" },
  { host: "lom:context", namespace: namespaces.xmlns },
  { host: "lom:context", namespace: namespaces.lom },
  { host: "lom:context", namespace: "" },
  { host: "lom:typicalAgeRange", namespace: namespaces.xmlns },
  { host: "lom:typicalAgeRange", namespace: namespaces.lom },
  { host: "lom:typicalAgeRange", namespace: "" },
  { host: "lom:difficulty", namespace: namespaces.xmlns },
  { host: "lom:difficulty", namespace: namespaces.lom },
  { host: "lom:difficulty", namespace: "" },
  { host: "lom:typicalLearningTime", namespace: namespaces.xmlns },
  { host: "lom:typicalLearningTime", namespace: namespaces.lom },
  { host: "lom:typicalLearningTime", namespace: "" },
  { host: "lom:classification", namespace: namespaces.xmlns },
  { host: "lom:classification", namespace: namespaces.lom },
  { host: "lom:classification", namespace: "" },
  { host: "lom:purpose", namespace: namespaces.xmlns },
  { host: "lom:purpose", namespace: namespaces.lom },
  { host: "lom:purpose", namespace: "" },
  { host: "lom:taxonPath", namespace: namespaces.xmlns },
  { host: "lom:taxonPath", namespace: namespaces.lom },
  { host: "lom:taxonPath", namespace: "" },
  { host: "lom:source.langString", namespace: namespaces.xmlns },
  { host: "lom:source.langString", namespace: namespaces.lom },
  { host: "lom:source.langString", namespace: "" },
  { host: "lom:taxon", namespace: namespaces.xmlns },
  { host: "lom:taxon", namespace: namespaces.lom },
  { host: "lom:taxon", namespace: "" },
  { host: "lom:id", namespace: namespaces.xmlns },
  { host: "lom:id", namespace: namespaces.lom },
  { host: "lom:id", namespace: "" },
  { host: "lom:entry.langString", namespace: namespaces.xmlns },
  { host: "lom:entry.langString", namespace: namespaces.lom },
  { host: "lom:entry.langString", namespace: "" },
  { host: "lom:relation", namespace: namespaces.xmlns },
  { host: "lom:relation", namespace: namespaces.lom },
  { host: "lom:relation", namespace: "" },
  { host: "lom:kind", namespace: namespaces.xmlns },
  { host: "lom:kind", namespace: namespaces.lom },
  { host: "lom:kind", namespace: "" },
  { host: "lom:resource", namespace: namespaces.xmlns },
  { host: "lom:resource", namespace: namespaces.lom },
  { host: "lom:resource", namespace: "" },
  { host: "lom:annotation", namespace: namespaces.xmlns },
  { host: "lom:annotation", namespace: namespaces.lom },
  { host: "lom:annotation", namespace: "" },
  { host: "xi:include", namespace: namespaces.xmlns },
  { host: "xi:include", namespace: namespaces.xi },
  { host: "xi:include", namespace: "" },
  { host: "xi:fallback", namespace: namespaces.xmlns },
  { host: "xi:fallback", namespace: namespaces.xi },
  { host: "xi:fallback", namespace: "" },
  { host: "foreign", namespace: namespaces.xmlns },
];

/**
 * The global declarations stored as foreign content, opaque to the model (decision 99): the seven
 * ASI roots and processing roots, and every global of the manifest and LOM sets. They are in no
 * `globalElement` row, so a wildcard does not refuse them as declared.
 */
export const opaqueGlobals: readonly GlobalRow[] = [
  { local: "qti-assessment-item", namespace: namespaces.asi, set: "asi" },
  { local: "qti-assessment-section", namespace: namespaces.asi, set: "asi" },
  { local: "qti-assessment-stimulus", namespace: namespaces.asi, set: "asi" },
  { local: "qti-assessment-test", namespace: namespaces.asi, set: "asi" },
  { local: "qti-outcome-declaration", namespace: namespaces.asi, set: "asi" },
  { local: "qti-outcome-processing", namespace: namespaces.asi, set: "asi" },
  { local: "qti-response-processing", namespace: namespaces.asi, set: "asi" },
  { local: "manifest", namespace: namespaces.cp, set: "manifest" },
  { local: "variant", namespace: namespaces.cpx, set: "manifest" },
  { local: "curriculumStandardsMetadataSet", namespace: namespaces.csmd, set: "manifest" },
  { local: "accessForAllResource", namespace: namespaces.drd, set: "manifest" },
  { local: "accessMode", namespace: namespaces.drd, set: "manifest" },
  { local: "accessModeAdapted", namespace: namespaces.drd, set: "manifest" },
  { local: "adaptationDetail", namespace: namespaces.drd, set: "manifest" },
  { local: "adaptationMediaType", namespace: namespaces.drd, set: "manifest" },
  { local: "adaptationType", namespace: namespaces.drd, set: "manifest" },
  { local: "apiInteroperable", namespace: namespaces.drd, set: "manifest" },
  { local: "atInteroperable", namespace: namespaces.drd, set: "manifest" },
  { local: "controlFlexibility", namespace: namespaces.drd, set: "manifest" },
  { local: "displayTransformability", namespace: namespaces.drd, set: "manifest" },
  { local: "educationalComplexityOfAdaptation", namespace: namespaces.drd, set: "manifest" },
  { local: "educationalLevelOfAdaptation", namespace: namespaces.drd, set: "manifest" },
  { local: "hasAdaptation", namespace: namespaces.drd, set: "manifest" },
  { local: "hazard", namespace: namespaces.drd, set: "manifest" },
  { local: "isAdaptationOf", namespace: namespaces.drd, set: "manifest" },
  { local: "isFullAdaptationOf", namespace: namespaces.drd, set: "manifest" },
  { local: "isPartialAdaptationOf", namespace: namespaces.drd, set: "manifest" },
  { local: "languageOfAdaptation", namespace: namespaces.drd, set: "manifest" },
  { local: "lom", namespace: namespaces.lom, set: "manifest" },
  { local: "qtiMetadata", namespace: namespaces.qmd, set: "manifest" },
  { local: "lom", namespace: namespaces.lom, set: "lom" },
];

/**
 * The global elements wildcard content is typed by, per schema set: each set's declared elements
 * less `opaqueGlobals`.
 */
export const globalElement: readonly GlobalRow[] = [
  ...locals("asi", namespaces.asi, [
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
    "template",
    "tfoot",
    "th",
    "thead",
    "tr",
    "track",
    "tt",
    "ul",
    "var",
    "video",
  ]),
  ...locals("asi", namespaces.mathml, [
    "abs",
    "and",
    "annotation",
    "annotation-xml",
    "apply",
    "approx",
    "arccos",
    "arccosh",
    "arccot",
    "arccoth",
    "arccsc",
    "arccsch",
    "arcsec",
    "arcsech",
    "arcsin",
    "arcsinh",
    "arctan",
    "arctanh",
    "arg",
    "bind",
    "bvar",
    "card",
    "cartesianproduct",
    "cbytes",
    "ceiling",
    "cerror",
    "ci",
    "cn",
    "codomain",
    "complexes",
    "compose",
    "condition",
    "conjugate",
    "cos",
    "cosh",
    "cot",
    "coth",
    "cs",
    "csc",
    "csch",
    "csymbol",
    "curl",
    "declare",
    "degree",
    "determinant",
    "diff",
    "divergence",
    "divide",
    "domain",
    "domainofapplication",
    "emptyset",
    "eq",
    "equivalent",
    "eulergamma",
    "exists",
    "exp",
    "exponentiale",
    "factorial",
    "factorof",
    "false",
    "floor",
    "fn",
    "forall",
    "gcd",
    "geq",
    "grad",
    "gt",
    "ident",
    "image",
    "imaginary",
    "imaginaryi",
    "implies",
    "in",
    "infinity",
    "int",
    "integers",
    "intersect",
    "interval",
    "inverse",
    "lambda",
    "laplacian",
    "lcm",
    "leq",
    "limit",
    "list",
    "ln",
    "log",
    "logbase",
    "lowlimit",
    "lt",
    "maction",
    "maligngroup",
    "malignmark",
    "math",
    "matrix",
    "matrixrow",
    "max",
    "mean",
    "median",
    "menclose",
    "merror",
    "mfenced",
    "mfrac",
    "mglyph",
    "mi",
    "min",
    "minus",
    "mlabeledtr",
    "mlongdiv",
    "mmultiscripts",
    "mn",
    "mo",
    "mode",
    "moment",
    "momentabout",
    "mover",
    "mpadded",
    "mphantom",
    "mprescripts",
    "mroot",
    "mrow",
    "ms",
    "mscarries",
    "mscarry",
    "msgroup",
    "msline",
    "mspace",
    "msqrt",
    "msrow",
    "mstack",
    "mstyle",
    "msub",
    "msubsup",
    "msup",
    "mtable",
    "mtd",
    "mtext",
    "mtr",
    "munder",
    "munderover",
    "naturalnumbers",
    "neq",
    "none",
    "not",
    "notanumber",
    "notin",
    "notprsubset",
    "notsubset",
    "or",
    "otherwise",
    "outerproduct",
    "partialdiff",
    "pi",
    "piece",
    "piecewise",
    "plus",
    "power",
    "primes",
    "product",
    "prsubset",
    "quotient",
    "rationals",
    "real",
    "reals",
    "reln",
    "rem",
    "root",
    "scalarproduct",
    "sdev",
    "sec",
    "sech",
    "selector",
    "sep",
    "set",
    "setdiff",
    "share",
    "sin",
    "sinh",
    "subset",
    "sum",
    "tan",
    "tanh",
    "tendsto",
    "times",
    "transpose",
    "true",
    "union",
    "uplimit",
    "variance",
    "vector",
    "vectorproduct",
    "xor",
  ]),
  ...locals("asi", namespaces.ssml, [
    "audio",
    "break",
    "desc",
    "emphasis",
    "lang",
    "lookup",
    "mark",
    "p",
    "phoneme",
    "prosody",
    "s",
    "say-as",
    "speak",
    "sub",
    "token",
    "voice",
    "w",
  ]),
  ...locals("asi", namespaces.xi, ["fallback", "include"]),
  ...locals("usagedata", namespaces.ud, ["usageData"]),
];

/**
 * The global attributes each schema set declares: the four of `w3/xml.xsd` in the ASI and manifest
 * sets, and the ten of `w3/xlink.xsd` in the manifest set; then, in every set, the four of XML
 * Schema's instance namespace (`xsi:type`, `xsi:nil`, `xsi:schemaLocation` and
 * `xsi:noNamespaceSchemaLocation`), which are XML Schema's own, declared in every schema (XML
 * Schema Part 1, 3.2.7), not by any cached XSD.
 */
export const globalAttribute: readonly GlobalRow[] = [
  { local: "lang", namespace: namespaces.xml, set: "asi" },
  { local: "space", namespace: namespaces.xml, set: "asi" },
  { local: "base", namespace: namespaces.xml, set: "asi" },
  { local: "id", namespace: namespaces.xml, set: "asi" },
  { local: "actuate", namespace: namespaces.xlink, set: "manifest" },
  { local: "arcrole", namespace: namespaces.xlink, set: "manifest" },
  { local: "from", namespace: namespaces.xlink, set: "manifest" },
  { local: "href", namespace: namespaces.xlink, set: "manifest" },
  { local: "label", namespace: namespaces.xlink, set: "manifest" },
  { local: "role", namespace: namespaces.xlink, set: "manifest" },
  { local: "show", namespace: namespaces.xlink, set: "manifest" },
  { local: "title", namespace: namespaces.xlink, set: "manifest" },
  { local: "to", namespace: namespaces.xlink, set: "manifest" },
  { local: "type", namespace: namespaces.xlink, set: "manifest" },
  { local: "lang", namespace: namespaces.xml, set: "manifest" },
  { local: "space", namespace: namespaces.xml, set: "manifest" },
  { local: "base", namespace: namespaces.xml, set: "manifest" },
  { local: "id", namespace: namespaces.xml, set: "manifest" },
  { local: "type", namespace: namespaces.xsi, set: "asi" },
  { local: "nil", namespace: namespaces.xsi, set: "asi" },
  { local: "schemaLocation", namespace: namespaces.xsi, set: "asi" },
  { local: "noNamespaceSchemaLocation", namespace: namespaces.xsi, set: "asi" },
  { local: "type", namespace: namespaces.xsi, set: "manifest" },
  { local: "nil", namespace: namespaces.xsi, set: "manifest" },
  { local: "schemaLocation", namespace: namespaces.xsi, set: "manifest" },
  { local: "noNamespaceSchemaLocation", namespace: namespaces.xsi, set: "manifest" },
  { local: "type", namespace: namespaces.xsi, set: "lom" },
  { local: "nil", namespace: namespaces.xsi, set: "lom" },
  { local: "schemaLocation", namespace: namespaces.xsi, set: "lom" },
  { local: "noNamespaceSchemaLocation", namespace: namespaces.xsi, set: "lom" },
  { local: "type", namespace: namespaces.xsi, set: "usagedata" },
  { local: "nil", namespace: namespaces.xsi, set: "usagedata" },
  { local: "schemaLocation", namespace: namespaces.xsi, set: "usagedata" },
  { local: "noNamespaceSchemaLocation", namespace: namespaces.xsi, set: "usagedata" },
];

/**
 * The schema set each root kind is judged against.
 */
export const rootSchemaSet: readonly RootSchemaSetRow[] = [
  { root: "item", set: "asi" },
  { root: "test", set: "asi" },
  { root: "section", set: "asi" },
  { root: "stimulus", set: "asi" },
  { root: "rptemplate", set: "asi" },
  { root: "outcomes", set: "asi" },
  { root: "manifest", set: "manifest" },
  { root: "externalLom", set: "lom" },
  { root: "usagedata", set: "usagedata" },
];

/**
 * The schema sets an attribute wildcard host can appear in: `qti-custom-operator` only in the ASI
 * documents, the `lom:` hosts in a LOM document and in a manifest's embedded LOM, `xi:include` and
 * `xi:fallback` in the ASI documents and in the foreign content of a manifest, and `foreign` in all
 * of them.
 *
 * @param host - The attribute wildcard host.
 * @returns The sets whose global attributes can reach an element of the host.
 */
const setsOf = (host: NodeKindHandle): readonly SchemaSetHandle[] => {
  if (host === "foreign") {
    return ["asi", "lom", "manifest", "usagedata"];
  }

  if (host.startsWith("lom:")) {
    return ["lom", "manifest"];
  }

  return host.startsWith("xi:") ? ["asi", "manifest"] : ["asi"];
};

/**
 * The handle `AttributeName` gives each declared global attribute whose namespace a lax attribute
 * wildcard can admit: the four `xml.xsd` names and the ten `xlink.xsd` names. The `xsi` names are
 * not here (R1-7): the walk judges them apart from any admission row.
 */
const typedNames: readonly {
  readonly attribute: AttributeNameHandle;
  readonly local: string;
  readonly namespace: string;
}[] = [
  { attribute: "xml:lang", local: "lang", namespace: namespaces.xml },
  { attribute: "xml:space", local: "space", namespace: namespaces.xml },
  { attribute: "xml:base", local: "base", namespace: namespaces.xml },
  { attribute: "xml:id", local: "id", namespace: namespaces.xml },
  { attribute: "xlink:actuate", local: "actuate", namespace: namespaces.xlink },
  { attribute: "xlink:arcrole", local: "arcrole", namespace: namespaces.xlink },
  { attribute: "xlink:from", local: "from", namespace: namespaces.xlink },
  { attribute: "xlink:href", local: "href", namespace: namespaces.xlink },
  { attribute: "xlink:label", local: "label", namespace: namespaces.xlink },
  { attribute: "xlink:role", local: "role", namespace: namespaces.xlink },
  { attribute: "xlink:show", local: "show", namespace: namespaces.xlink },
  { attribute: "xlink:title", local: "title", namespace: namespaces.xlink },
  { attribute: "xlink:to", local: "to", namespace: namespaces.xlink },
  { attribute: "xlink:type", local: "type", namespace: namespaces.xlink },
];

/**
 * The attributes an attribute wildcard host admits as typed, derived from the three tables above:
 * for each `attributeWildcard` host, each `globalAttribute` row whose set the host can appear in
 * (`setsOf`) and whose namespace the host's `attributeExclusion` rows do not refuse, as the one row
 * `(host, prefixed name)`. A host whose lax `xs:anyAttribute` admits a namespace types every
 * attribute the sets declare in it, so `xml:lang` and the other three `xml.xsd` names are typed on
 * every host and `foreign`, and the ten `xlink` names, which only the manifest set declares, on
 * every host that can appear in a manifest: the `lom:` hosts, `xi:include`, `xi:fallback` and
 * `foreign`. `qti-custom-operator` appears only in the ASI documents, where `xlink` is no declared
 * name, so it holds the four `xml` rows alone and a qualified name its policy refuses (`asi:foo`)
 * stays refused. The `xsi` names get no row (R1-7), whatever set declares them.
 */
export const wildcardAttributeAdmission: readonly WildcardAttributeAdmissionRow[] =
  attributeWildcard.flatMap(({ host }) => {
    const refused = new Set(
      attributeExclusion.filter((row) => row.host === host).map((row) => row.namespace),
    );
    const sets = setsOf(host);

    return typedNames
      .filter(
        ({ local, namespace }) =>
          !refused.has(namespace) &&
          globalAttribute.some(
            (row) => row.namespace === namespace && row.local === local && sets.includes(row.set),
          ),
      )
      .map(({ attribute }) => ({ attribute, kind: host }));
  });

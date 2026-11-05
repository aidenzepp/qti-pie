/**
 * The closed relations of a content package's manifest: the resource types a `cp:resource` may
 * name, the schema versions each one holds in, and the root kind of the documents each one lists
 * (fin.md §17, "qti-pie, erased").
 *
 * A text whose legal values are fixed is a roster, so a resource's `type` is a `ResourceType`
 * handle, spelled exactly as its lexical form, which is how the attribute's lexical form derives
 * its code. `ResourceTypeOf` and `RootOfType` are rows of those handles, and grizzle packs each
 * into a constant with no table.
 */
import { closed, inVersions } from "#pantry/grammar/closed.ts";

/**
 * The resource types, each stated once with the schema versions it holds in: the `xs:enumeration`
 * of `ResourceDType`'s `type` attribute in each version's content-packaging XSD
 * (`imsqtiv3p0_imscpv1p2_v1p0.xsd` and `imsqtiv3p0p1_imscpv1p2_v1p0.xsd`). 3.0.0 lists 19 and 3.0.1
 * lists 20: they share 18, `imsbasiclti_xmlv1p3` is 3.0.0's only, and `imslti_xmlv1p1` and
 * `imsltia_xmlv1p0` are 3.0.1's only.
 *
 * The statements fix the roster's code order, so a type a later version introduces is a new
 * statement at the end and appends its handles.
 */
const statements = [
  {
    types: [
      "imsqti_test_xmlv3p0",
      "imsqti_section_xmlv3p0",
      "imsqti_item_xmlv3p0",
      "imsqti_resprocessing_xmlv3p0",
      "imsqti_outcomes_xmlv3p0",
      "imsqti_stimulus_xmlv3p0",
      "imsqti_fragment_xmlv3p0",
      "imsqti_rptemplate_xmlv3p0",
      "associatedcontent/learning-application-resource",
      "webcontent",
      "controlfile",
      "resourcemetadata/xml",
      "resourceextmetadata/xml",
      "qtiusagedata/xml",
      "pls",
      "css2",
      "css3",
      "extension",
    ],
    versions: ["3.0.0", "3.0.1"],
  },
  { types: ["imsbasiclti_xmlv1p3"], versions: ["3.0.0"] },
  { types: ["imslti_xmlv1p1", "imsltia_xmlv1p0"], versions: ["3.0.1"] },
] as const;

/**
 * A handle of the `ResourceType` roster: a resource type some schema version admits.
 */
export type ResourceTypeHandle = (typeof statements)[number]["types"][number];

/**
 * A schema version the resource types are stated under.
 */
type StatedVersion = (typeof statements)[number]["versions"][number];

/**
 * The `ResourceType` roster in code order: every type any version admits, once, 21 in all. A type
 * that two versions share is one handle, because a version is a key digit of `ResourceTypeOf`
 * (fin.md P4), never part of a handle.
 */
export const resourceTypes: readonly ResourceTypeHandle[] = statements.flatMap(
  ({ types }) => types,
);

/**
 * The `RootKind` roster in code order: what a document tree's root element is. `manifest` is the
 * root of a package's manifest, which no resource type lists, so `RootOfType` never names it.
 */
export const rootKinds = [
  "item",
  "test",
  "section",
  "stimulus",
  "rptemplate",
  "outcomes",
  "usagedata",
  "manifest",
  "externalLom",
] as const;

/**
 * A handle of the `RootKind` roster.
 */
export type RootKindHandle = (typeof rootKinds)[number];

/**
 * The resource type each QTI document root is listed under: one row per type that lists a document
 * the model reads, so the response-processing template root has two, `imsqti_rptemplate_xmlv3p0`
 * and `imsqti_resprocessing_xmlv3p0`. A type with no row (`webcontent`, `imsqti_fragment_xmlv3p0`
 * and the rest) lists files, not documents.
 */
const roots = [
  { root: "item", type: "imsqti_item_xmlv3p0" },
  { root: "test", type: "imsqti_test_xmlv3p0" },
  { root: "section", type: "imsqti_section_xmlv3p0" },
  { root: "stimulus", type: "imsqti_stimulus_xmlv3p0" },
  { root: "rptemplate", type: "imsqti_rptemplate_xmlv3p0" },
  { root: "outcomes", type: "imsqti_outcomes_xmlv3p0" },
  { root: "usagedata", type: "qtiusagedata/xml" },
  { root: "externalLom", type: "resourcemetadata/xml" },
  { root: "rptemplate", type: "imsqti_resprocessing_xmlv3p0" },
] as const satisfies readonly {
  readonly root: RootKindHandle;
  readonly type: ResourceTypeHandle;
}[];

/**
 * Construct `ResourceTypeOf`, the set of (version, type) pairs a resource may carry: 39 rows, the
 * law on a `Resource`'s (version, type) cell (`resource-type`).
 *
 * The `SchemaVersion` roster belongs to the kinds generator, so its handles arrive as the version
 * field's code space, and a stated version that the roster lacks has no code.
 *
 * @param versions - The `SchemaVersion` handles in code order.
 * @returns The set over version × type, or an `OutsideCodeSpace` naming a stated version that
 *   `versions` does not hold.
 */
export const resourceTypeOf = (versions: readonly StatedVersion[]) =>
  closed({
    key: [
      { name: "version", values: versions },
      { name: "type", values: resourceTypes },
    ],
    name: "ResourceTypeOf",
    payload: [],
    rows: statements.flatMap(({ types, versions: holding }) =>
      inVersions(
        holding,
        types.map((type) => ({ type })),
      ),
    ),
  });

/**
 * `RootOfType`, the function from a resource type to the root kind of the documents it lists: 9
 * rows over the 21 types, the law on a `Document`'s (resource type, root kind) cell
 * (`root-type-reverse`). A type absent from it lists no document.
 */
export const rootOfType = closed({
  key: [{ name: "type", values: resourceTypes }],
  name: "RootOfType",
  payload: [{ name: "root", values: rootKinds }],
  rows: roots,
});

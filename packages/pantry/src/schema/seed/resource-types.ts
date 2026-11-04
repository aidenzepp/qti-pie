/**
 * The resource type vocabulary of a QTI content package, one row per (version, type).
 */
import type { SchemaVersionHandle } from "#pantry/schema/node.ts";

const commonTypes = [
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
] as const;

/**
 * The resource types of each schema version: the 19 values of the XSD 3.0 enumeration and the 20
 * of XSD 3.0.1, per `docs/research/42cb4cdb.md` section 3.7. The XSD is the enforced value space;
 * `imsbasiclti_xmlv1p3` is 3.0.0 only, `imslti_xmlv1p1` and `imsltia_xmlv1p0` are 3.0.1 only.
 */
export const resourceTypes: readonly {
  readonly type: string;
  readonly version: SchemaVersionHandle;
}[] = [
  ...commonTypes.map((type) => ({ type, version: "3.0.0" as const })),
  { type: "imsbasiclti_xmlv1p3", version: "3.0.0" },
  ...commonTypes.map((type) => ({ type, version: "3.0.1" as const })),
  { type: "imslti_xmlv1p1", version: "3.0.1" },
  { type: "imsltia_xmlv1p0", version: "3.0.1" },
];

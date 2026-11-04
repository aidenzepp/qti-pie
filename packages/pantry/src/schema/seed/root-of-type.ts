/**
 * Which root element kind a QTI resource type names.
 */
import type { RootKindHandle } from "#qti/schema/node.ts";

/**
 * The resource type of each QTI document root.
 */
export const rootOfType: readonly { readonly root: RootKindHandle; readonly type: string }[] = [
  { root: "item", type: "imsqti_item_xmlv3p0" },
  { root: "test", type: "imsqti_test_xmlv3p0" },
  { root: "section", type: "imsqti_section_xmlv3p0" },
  { root: "stimulus", type: "imsqti_stimulus_xmlv3p0" },
  { root: "rptemplate", type: "imsqti_rptemplate_xmlv3p0" },
  { root: "outcomes", type: "imsqti_outcomes_xmlv3p0" },
  { root: "usagedata", type: "qtiusagedata/xml" },
  { root: "externalLom", type: "resourcemetadata/xml" },
  { root: "rptemplate", type: "imsqti_resprocessing_xmlv3p0" },
];

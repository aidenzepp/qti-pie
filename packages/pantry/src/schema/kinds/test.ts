/**
 * The test vocabulary: the 26 kinds of the spec's 3.3, in the ASI namespace.
 *
 * The 23 element names and three dotted handles, `qti-rubric-block.test`,
 * `qti-content-body.testRubric` and `qti-content-body.testFeedback`, under phase 1's rule that a
 * kind is a content model. The dotted spellings follow `asi.ts`'s (`qti-content-body.rubric`).
 *
 * `kinds` is in the XSD document order of the types, from
 * `grep -n 'complexType name=' imsqti_asiv3p0p1_v1p0.xsd` over the cached XSD
 * (`~/.cache/gr8des/qti3/xsd/`); the four `AdaptiveHrefDType` elements, one type, follow their
 * declaration order in `AdaptiveSelectionDType`. Each kind's registry `attributes` list is empty
 * here: the schema slice of its heading fills its kinds' (the spec's 4.2). `attributes` is empty
 * for the same reason: the 21 names the test kinds introduce are declared by the heading slices
 * with the rows that carry them, and the other 17 names the M4 types declare are already declared
 * by earlier vocabularies.
 *
 * `admission` is `admissionOf(testInventory, typed)`, the same rows in both versions: the
 * 3.0.0 stimulus-body deltas are `xi:include` and its attributes, which later slices add, and
 * `m3:math` has no handle. `typed` maps the multi-type children of the test hosts to their dotted
 * handles, in the `element|host` form `asi.ts` keeps for its own.
 */
import { Option } from "effect";

import { testInventory } from "#pantry/schema/content/inventory/test.ts";
import { admissionOf } from "#pantry/schema/kinds/asi.ts";
import type { RegistryRow } from "#pantry/schema/kinds/generic.ts";

const namespace = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * The test kinds, in append-only order; each handle is the element name, a dotted handle for the
 * element a second type also names.
 */
export const kinds = [
  "qti-adaptive-selection",
  "qti-assessment-item-ref",
  "qti-assessment-section",
  "qti-assessment-stimulus",
  "qti-assessment-test",
  "qti-branch-rule",
  "qti-pre-condition",
  "qti-ordering",
  "qti-selection",
  "qti-stimulus-body",
  "qti-template-default",
  "qti-test-feedback",
  "qti-content-body.testFeedback",
  "qti-test-part",
  "qti-rubric-block.test",
  "qti-content-body.testRubric",
  "qti-adaptive-engine-ref",
  "qti-adaptive-settings-ref",
  "qti-usagedata-ref",
  "qti-metadata-ref",
  "qti-assessment-section-ref",
  "qti-assessment-stimulus-ref",
  "qti-item-session-control",
  "qti-time-limits",
  "qti-variable-mapping",
  "qti-weight",
] as const;

/**
 * The attribute names these kinds introduce that their landed headings have filled.
 *
 * A name is declared with the first registry row that carries it. Each heading slice (p5-16 to
 * p5-19) inserts the new names its kinds carry when it fills their rows, in alphabetical order;
 * p5-19 adds `access`, which completes the 21.
 */
export const attributes = [
  "access",
  "allow-comment",
  "allow-late-submission",
  "allow-review",
  "allow-skipping",
  "category",
  "keep-together",
  "max-attempts",
  "max-time",
  "min-time",
  "navigation-mode",
  "select",
  "show-feedback",
  "show-solution",
  "source-identifier",
  "submission-mode",
  "target",
  "target-identifier",
  "validate-responses",
  "visible",
  "with-replacement",
] as const;

/**
 * The registry row of each test kind, with no attributes yet.
 */
export const registry: Readonly<Record<(typeof kinds)[number], RegistryRow>> = {
  "qti-adaptive-engine-ref": {
    attributes: ["identifier", "href"],
    local: "qti-adaptive-engine-ref",
    namespace,
    parent: Option.none(),
  },
  "qti-adaptive-selection": {
    attributes: [],
    local: "qti-adaptive-selection",
    namespace,
    parent: Option.none(),
  },
  "qti-adaptive-settings-ref": {
    attributes: ["identifier", "href"],
    local: "qti-adaptive-settings-ref",
    namespace,
    parent: Option.none(),
  },
  "qti-assessment-item-ref": {
    attributes: ["identifier", "required", "fixed", "class", "href", "category"],
    local: "qti-assessment-item-ref",
    namespace,
    parent: Option.none(),
  },
  "qti-assessment-section": {
    attributes: ["identifier", "required", "fixed", "title", "class", "visible", "keep-together"],
    local: "qti-assessment-section",
    namespace,
    parent: Option.none(),
  },
  "qti-assessment-section-ref": {
    attributes: ["identifier", "class", "href"],
    local: "qti-assessment-section-ref",
    namespace,
    parent: Option.none(),
  },
  "qti-assessment-stimulus": {
    attributes: ["identifier", "title", "label", "xml:lang", "tool-name", "tool-version"],
    local: "qti-assessment-stimulus",
    namespace,
    parent: Option.none(),
  },
  "qti-assessment-stimulus-ref": {
    attributes: ["identifier", "href", "title"],
    local: "qti-assessment-stimulus-ref",
    namespace,
    parent: Option.none(),
  },
  "qti-assessment-test": {
    attributes: ["identifier", "title", "class", "xml:lang", "tool-name", "tool-version"],
    local: "qti-assessment-test",
    namespace,
    parent: Option.none(),
  },
  "qti-branch-rule": {
    attributes: ["target"],
    local: "qti-branch-rule",
    namespace,
    parent: Option.none(),
  },
  "qti-content-body.testFeedback": {
    attributes: [],
    local: "qti-content-body",
    namespace,
    parent: Option.some("qti-test-feedback"),
  },
  "qti-content-body.testRubric": {
    attributes: [],
    local: "qti-content-body",
    namespace,
    parent: Option.some("qti-rubric-block.test"),
  },
  "qti-item-session-control": {
    attributes: [
      "max-attempts",
      "show-feedback",
      "allow-review",
      "show-solution",
      "allow-comment",
      "allow-skipping",
      "validate-responses",
    ],
    local: "qti-item-session-control",
    namespace,
    parent: Option.none(),
  },
  "qti-metadata-ref": {
    attributes: ["identifier", "href"],
    local: "qti-metadata-ref",
    namespace,
    parent: Option.none(),
  },
  "qti-ordering": {
    attributes: ["shuffle"],
    local: "qti-ordering",
    namespace,
    parent: Option.none(),
  },
  "qti-pre-condition": {
    attributes: [],
    local: "qti-pre-condition",
    namespace,
    parent: Option.none(),
  },
  "qti-rubric-block.test": {
    attributes: [
      "role",
      "aria-controls",
      "aria-describedby",
      "aria-flowto",
      "aria-label",
      "aria-labelledby",
      "aria-level",
      "aria-live",
      "aria-orientation",
      "aria-owns",
      "aria-hidden",
      "aria-activedescendant",
      "aria-atomic",
      "aria-autocomplete",
      "aria-busy",
      "aria-checked",
      "aria-disabled",
      "aria-expanded",
      "aria-haspopup",
      "aria-invalid",
      "aria-multiline",
      "aria-multiselectable",
      "aria-posinset",
      "aria-pressed",
      "aria-readonly",
      "aria-relevant",
      "aria-required",
      "aria-selected",
      "aria-setsize",
      "aria-sort",
      "aria-valuemax",
      "aria-valuemin",
      "aria-valuenow",
      "aria-valuetext",
      "aria-modal",
      "aria-current",
      "aria-placeholder",
      "aria-colcount",
      "aria-rowcount",
      "aria-colindex",
      "aria-rowindex",
      "aria-colspan",
      "aria-rowspan",
      "aria-keyshortcuts",
      "aria-roledescription",
      "aria-errormessage",
      "aria-details",
      "id",
      "class",
      "lang",
      "xml:lang",
      "label",
      "xml:base",
      "dir",
      "data-catalog-idref",
      "data-qti-suppress-tts",
      "data-ssml",
      "view",
      "use",
    ],
    local: "qti-rubric-block",
    namespace,
    parent: Option.some("qti-assessment-test"),
  },
  "qti-selection": {
    attributes: ["select", "with-replacement"],
    local: "qti-selection",
    namespace,
    parent: Option.none(),
  },
  "qti-stimulus-body": {
    attributes: [
      "role",
      "aria-controls",
      "aria-describedby",
      "aria-flowto",
      "aria-label",
      "aria-labelledby",
      "aria-level",
      "aria-live",
      "aria-orientation",
      "aria-owns",
      "aria-hidden",
      "aria-activedescendant",
      "aria-atomic",
      "aria-autocomplete",
      "aria-busy",
      "aria-checked",
      "aria-disabled",
      "aria-expanded",
      "aria-haspopup",
      "aria-invalid",
      "aria-multiline",
      "aria-multiselectable",
      "aria-posinset",
      "aria-pressed",
      "aria-readonly",
      "aria-relevant",
      "aria-required",
      "aria-selected",
      "aria-setsize",
      "aria-sort",
      "aria-valuemax",
      "aria-valuemin",
      "aria-valuenow",
      "aria-valuetext",
      "aria-modal",
      "aria-current",
      "aria-placeholder",
      "aria-colcount",
      "aria-rowcount",
      "aria-colindex",
      "aria-rowindex",
      "aria-colspan",
      "aria-rowspan",
      "aria-keyshortcuts",
      "aria-roledescription",
      "aria-errormessage",
      "aria-details",
      "id",
      "class",
      "lang",
      "xml:lang",
      "label",
      "dir",
      "data-catalog-idref",
      "data-qti-suppress-tts",
    ],
    local: "qti-stimulus-body",
    namespace,
    parent: Option.none(),
  },
  "qti-template-default": {
    attributes: ["template-identifier"],
    local: "qti-template-default",
    namespace,
    parent: Option.none(),
  },
  "qti-test-feedback": {
    attributes: ["access", "outcome-identifier", "show-hide", "identifier", "title"],
    local: "qti-test-feedback",
    namespace,
    parent: Option.none(),
  },
  "qti-test-part": {
    attributes: ["identifier", "title", "class", "navigation-mode", "submission-mode"],
    local: "qti-test-part",
    namespace,
    parent: Option.none(),
  },
  "qti-time-limits": {
    attributes: ["min-time", "max-time", "allow-late-submission"],
    local: "qti-time-limits",
    namespace,
    parent: Option.none(),
  },
  "qti-usagedata-ref": {
    attributes: ["identifier", "href"],
    local: "qti-usagedata-ref",
    namespace,
    parent: Option.none(),
  },
  "qti-variable-mapping": {
    attributes: ["source-identifier", "target-identifier"],
    local: "qti-variable-mapping",
    namespace,
    parent: Option.none(),
  },
  "qti-weight": {
    attributes: ["identifier", "value"],
    local: "qti-weight",
    namespace,
    parent: Option.none(),
  },
};

/**
 * The multi-type children of the test hosts, keyed `element|host`: a rubric block under a test,
 * a part or a section is the test's, its content body is the test rubric's, and the content body
 * of a test feedback is the test feedback's.
 */
const typed = new Map<string, string>([
  ["qti-content-body|qti-rubric-block.test", "qti-content-body.testRubric"],
  ["qti-content-body|qti-test-feedback", "qti-content-body.testFeedback"],
  ["qti-rubric-block|qti-assessment-section", "qti-rubric-block.test"],
  ["qti-rubric-block|qti-assessment-test", "qti-rubric-block.test"],
  ["qti-rubric-block|qti-test-part", "qti-rubric-block.test"],
]);

/**
 * The test admission rows, the same for both versions.
 */
export const admission = admissionOf(testInventory, typed);

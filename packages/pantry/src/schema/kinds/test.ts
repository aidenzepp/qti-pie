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
 * here: the schema slice of its heading fills its kinds' (the spec's 4.2). `attributes` names the
 * 21 attribute names the test kinds introduce, in first-appearance order over the roster; the
 * other 17 names the M4 types declare are already declared by earlier vocabularies.
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
 * The attribute names these kinds introduce, in first-appearance order over the roster.
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
    attributes: [],
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
    attributes: [],
    local: "qti-adaptive-settings-ref",
    namespace,
    parent: Option.none(),
  },
  "qti-assessment-item-ref": {
    attributes: [],
    local: "qti-assessment-item-ref",
    namespace,
    parent: Option.none(),
  },
  "qti-assessment-section": {
    attributes: [],
    local: "qti-assessment-section",
    namespace,
    parent: Option.none(),
  },
  "qti-assessment-section-ref": {
    attributes: [],
    local: "qti-assessment-section-ref",
    namespace,
    parent: Option.none(),
  },
  "qti-assessment-stimulus": {
    attributes: [],
    local: "qti-assessment-stimulus",
    namespace,
    parent: Option.none(),
  },
  "qti-assessment-stimulus-ref": {
    attributes: [],
    local: "qti-assessment-stimulus-ref",
    namespace,
    parent: Option.none(),
  },
  "qti-assessment-test": {
    attributes: [],
    local: "qti-assessment-test",
    namespace,
    parent: Option.none(),
  },
  "qti-branch-rule": {
    attributes: [],
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
    attributes: [],
    local: "qti-item-session-control",
    namespace,
    parent: Option.none(),
  },
  "qti-metadata-ref": {
    attributes: [],
    local: "qti-metadata-ref",
    namespace,
    parent: Option.none(),
  },
  "qti-ordering": {
    attributes: [],
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
    attributes: [],
    local: "qti-rubric-block",
    namespace,
    parent: Option.some("qti-assessment-test"),
  },
  "qti-selection": {
    attributes: [],
    local: "qti-selection",
    namespace,
    parent: Option.none(),
  },
  "qti-stimulus-body": {
    attributes: [],
    local: "qti-stimulus-body",
    namespace,
    parent: Option.none(),
  },
  "qti-template-default": {
    attributes: [],
    local: "qti-template-default",
    namespace,
    parent: Option.none(),
  },
  "qti-test-feedback": {
    attributes: [],
    local: "qti-test-feedback",
    namespace,
    parent: Option.none(),
  },
  "qti-test-part": {
    attributes: [],
    local: "qti-test-part",
    namespace,
    parent: Option.none(),
  },
  "qti-time-limits": {
    attributes: [],
    local: "qti-time-limits",
    namespace,
    parent: Option.none(),
  },
  "qti-usagedata-ref": {
    attributes: [],
    local: "qti-usagedata-ref",
    namespace,
    parent: Option.none(),
  },
  "qti-variable-mapping": {
    attributes: [],
    local: "qti-variable-mapping",
    namespace,
    parent: Option.none(),
  },
  "qti-weight": {
    attributes: [],
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

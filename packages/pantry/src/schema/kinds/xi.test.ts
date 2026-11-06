import { assert, describe, it } from "@effect/vitest";
import * as xi from "#pantry/schema/kinds/xi.ts";
import * as asi from "#pantry/schema/kinds/asi.ts";
import { NodeKind } from "#pantry/schema/node.ts";
import { explicitAdmission } from "#pantry/schema/seed/admission.ts";

/**
 * The hosts of `xi:include` in the 3.0.0 ASI XSD, as handles: the elements of the types that
 * `xihosts.py` lists for `imsqti_asiv3p0_v1p0.xsd` (41 types, 77 elements; the spec's 3.6, command
 * `cd ~/.cache/gr8des/qti3/xsd && python3 -I <xihosts.py> imsqti_asiv3p0_v1p0.xsd`), a multi-typed
 * element as its dotted handle. `qti-interaction-markup`, the 77th element, has no handle yet.
 */
const hosts300 = [
  "a",
  "abbr",
  "acronym",
  "address",
  "article",
  "aside",
  "b",
  "big",
  "caption",
  "cite",
  "code",
  "dd",
  "dfn",
  "div",
  "dt",
  "em",
  "figcaption",
  "footer",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "i",
  "kbd",
  "label",
  "li",
  "nav",
  "object",
  "p",
  "pre",
  "q",
  "qti-assessment-section",
  "qti-content-body.feedback",
  "qti-content-body.modal",
  "qti-content-body.rubric",
  "qti-content-body.rubricTemplate",
  "qti-content-body.template",
  "qti-content-body.testFeedback",
  "qti-content-body.testRubric",
  "qti-feedback-inline",
  "qti-gap-match-interaction",
  "qti-gap-text",
  "qti-hottext",
  "qti-hottext-interaction",
  "qti-inline-choice",
  "qti-item-body",
  "qti-label",
  "qti-outcome-else",
  "qti-outcome-else-if",
  "qti-outcome-if",
  "qti-outcome-processing",
  "qti-outcome-processing-fragment",
  "qti-prompt",
  "qti-response-else",
  "qti-response-else-if",
  "qti-response-if",
  "qti-response-processing",
  "qti-response-processing-fragment",
  "qti-simple-associable-choice",
  "qti-simple-choice",
  "qti-template-inline",
  "qti-template-inline.rubric",
  "samp",
  "section",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "td",
  "th",
  "tt",
  "var",
] as const;

/**
 * The hosts of `xi:include` in the 3.0.1 ASI XSD: the 3.0.0 hosts and `qti-stimulus-body`
 * (`StimulusBodyDType`, the one type 3.0.0 lacks), from the same command over
 * `imsqti_asiv3p0p1_v1p0.xsd` (42 types, 78 elements, 77 handles).
 */
const hosts301 = [
  "a",
  "abbr",
  "acronym",
  "address",
  "article",
  "aside",
  "b",
  "big",
  "caption",
  "cite",
  "code",
  "dd",
  "dfn",
  "div",
  "dt",
  "em",
  "figcaption",
  "footer",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "i",
  "kbd",
  "label",
  "li",
  "nav",
  "object",
  "p",
  "pre",
  "q",
  "qti-assessment-section",
  "qti-content-body.feedback",
  "qti-content-body.modal",
  "qti-content-body.rubric",
  "qti-content-body.rubricTemplate",
  "qti-content-body.template",
  "qti-content-body.testFeedback",
  "qti-content-body.testRubric",
  "qti-feedback-inline",
  "qti-gap-match-interaction",
  "qti-gap-text",
  "qti-hottext",
  "qti-hottext-interaction",
  "qti-inline-choice",
  "qti-item-body",
  "qti-label",
  "qti-outcome-else",
  "qti-outcome-else-if",
  "qti-outcome-if",
  "qti-outcome-processing",
  "qti-outcome-processing-fragment",
  "qti-prompt",
  "qti-response-else",
  "qti-response-else-if",
  "qti-response-if",
  "qti-response-processing",
  "qti-response-processing-fragment",
  "qti-simple-associable-choice",
  "qti-simple-choice",
  "qti-stimulus-body",
  "qti-template-inline",
  "qti-template-inline.rubric",
  "samp",
  "section",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "td",
  "th",
  "tt",
  "var",
] as const;

const pinned = { "3.0.0": hosts300, "3.0.1": hosts301 } as const;

/**
 * The parents of every composed row that admits `xi:include` in a version, sorted.
 */
const hostsOf = (version: "3.0.0" | "3.0.1"): readonly string[] =>
  explicitAdmission
    .filter((row) => row.version === version && row.child === "xi:include")
    .map((row) => row.parent)
    .toSorted();

describe("xi:include admission", () => {
  it("pins 76 hosts in 3.0.0 and 77 in 3.0.1, each a handle of the roster, once", () => {
    assert.strictEqual(hosts300.length, 76);
    assert.strictEqual(hosts301.length, 77);
    for (const version of ["3.0.0", "3.0.1"] as const) {
      assert.strictEqual(new Set(pinned[version]).size, pinned[version].length, version);
      for (const host of pinned[version]) {
        assert.isTrue(NodeKind.handles.includes(host), `${version} ${host}`);
      }
    }
  });

  it("admits it under exactly the XSD hosts of each version, and xi:fallback", () => {
    for (const version of ["3.0.0", "3.0.1"] as const) {
      assert.deepStrictEqual(
        hostsOf(version),
        [...pinned[version], "xi:fallback"].toSorted(),
        version,
      );
    }
  });

  it("admits it under qti-stimulus-body in 3.0.1 and not in 3.0.0", () => {
    assert.isTrue(hostsOf("3.0.1").includes("qti-stimulus-body"));
    assert.isFalse(hostsOf("3.0.0").includes("qti-stimulus-body"));
  });

  it("holds no row the processing composition already holds", () => {
    const held = new Set(asi.admission.map((row) => `${row.version}|${row.parent}|${row.child}`));
    for (const row of xi.admission) {
      assert.isFalse(held.has(`${row.version}|${row.parent}|${row.child}`), JSON.stringify(row));
    }
  });
});

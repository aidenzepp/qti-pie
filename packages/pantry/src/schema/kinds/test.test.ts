import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";
import type { Element } from "@qti-pie/crust/tree.ts";
import { kindOf } from "#pantry/import/tree.ts";
import { testInventory } from "#pantry/schema/content/inventory/test.ts";
import { expressionKinds } from "#pantry/schema/kinds/asi.ts";
import * as test from "#pantry/schema/kinds/test.ts";
import * as node from "#pantry/schema/node.ts";
import { nodeArms } from "#pantry/schema/qti.ts";
import { admission, registries } from "#pantry/schema/seed/admission.ts";

const namespace = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * The 26 handles of the spec's 3.3, in the XSD document order of their types: the order of
 * `grep -n 'complexType name=' imsqti_asiv3p0p1_v1p0.xsd`, the four `AdaptiveHrefDType` elements
 * in their declaration order.
 */
const handles = [
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
 * The 21 attribute names the spec's 3.5 lists as new: the phase's final list, reached when p5-19
 * lands.
 */
const names = [
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
 * The names the landed heading slices declare in `test.attributes`, alphabetical and a subset of
 * `names`: p5-16's `category`, `keep-together`, `navigation-mode`, `submission-mode` and
 * `visible`, and p5-17's `allow-comment`, `allow-late-submission`, `allow-review`,
 * `allow-skipping`, `max-attempts`, `max-time`, `min-time`, `select`, `show-feedback`,
 * `show-solution`, `validate-responses` and `with-replacement`. p5-18 inserts `source-identifier`,
 * `target` and `target-identifier`; p5-19 `access`, so `declared` equals `names`.
 */
const declared: readonly string[] = [
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
];

const mixed = ["text", "ws", "comment", "pi", "entityRef"];

/**
 * The 54 element children of `TestRubricBlockContentBodyDType` and
 * `TestFeedbackFlowContentBodyDType`: the `HTMLFlow` choice of the XSD, each element with a kind.
 */
const flow = [
  "p",
  "img",
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
  "cite",
  "code",
  "details",
  "dfn",
  "div",
  "dl",
  "em",
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
  "kbd",
  "label",
  "nav",
  "object",
  "ol",
  "picture",
  "pre",
  "q",
  "ruby",
  "samp",
  "section",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "table",
  "tt",
  "ul",
  "var",
  "video",
];

const generic = ["ws", "comment", "pi"];

/**
 * The children each host admits, from the content models of `imsqti_asiv3p0p1_v1p0.xsd` (the
 * spec's 3.4); every list is the same in both versions. `xi:include` is absent from the section
 * and the stimulus body: p5-22 adds it, p5-32 adds the 3.0.1 stimulus body's attributes.
 */
const expected: Readonly<Record<(typeof handles)[number], readonly string[]>> = {
  "qti-adaptive-engine-ref": ["comment", "pi"],
  "qti-adaptive-selection": [
    ...generic,
    "qti-adaptive-engine-ref",
    "qti-adaptive-settings-ref",
    "qti-usagedata-ref",
    "qti-metadata-ref",
  ],
  "qti-adaptive-settings-ref": ["comment", "pi"],
  "qti-assessment-item-ref": [
    ...generic,
    "qti-pre-condition",
    "qti-branch-rule",
    "qti-item-session-control",
    "qti-time-limits",
    "qti-variable-mapping",
    "qti-weight",
    "qti-template-default",
  ],
  "qti-assessment-section": [
    ...generic,
    "qti-pre-condition",
    "qti-branch-rule",
    "qti-item-session-control",
    "qti-time-limits",
    "qti-adaptive-selection",
    "qti-selection",
    "qti-ordering",
    "qti-rubric-block.test",
    "qti-assessment-item-ref",
    "qti-assessment-section",
    "qti-assessment-section-ref",
  ],
  "qti-assessment-section-ref": ["comment", "pi"],
  "qti-assessment-stimulus": [
    ...generic,
    "qti-stylesheet",
    "qti-stimulus-body",
    "qti-catalog-info",
  ],
  "qti-assessment-stimulus-ref": ["comment", "pi"],
  "qti-assessment-test": [
    ...generic,
    "qti-context-declaration",
    "qti-outcome-declaration",
    "qti-time-limits",
    "qti-stylesheet",
    "qti-rubric-block.test",
    "qti-test-part",
    "qti-outcome-processing",
    "qti-test-feedback",
  ],
  "qti-branch-rule": [...generic, ...expressionKinds],
  "qti-content-body.testFeedback": [...mixed, ...flow],
  "qti-content-body.testRubric": [...mixed, ...flow],
  "qti-item-session-control": ["comment", "pi"],
  "qti-metadata-ref": ["comment", "pi"],
  "qti-ordering": ["comment", "pi"],
  "qti-pre-condition": [...generic, ...expressionKinds],
  "qti-rubric-block.test": [
    ...generic,
    "qti-stylesheet",
    "qti-content-body.testRubric",
    "qti-catalog-info",
    "qti-printed-variable",
  ],
  "qti-selection": ["comment", "pi"],
  "qti-stimulus-body": [
    ...generic,
    "p",
    "address",
    "article",
    "aside",
    "audio",
    "blockquote",
    "div",
    "dl",
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
    "nav",
    "ol",
    "pre",
    "section",
    "table",
    "ul",
    "video",
  ],
  "qti-template-default": [...generic, ...expressionKinds],
  "qti-test-feedback": [
    ...generic,
    "qti-stylesheet",
    "qti-content-body.testFeedback",
    "qti-catalog-info",
  ],
  "qti-test-part": [
    ...generic,
    "qti-pre-condition",
    "qti-branch-rule",
    "qti-item-session-control",
    "qti-time-limits",
    "qti-rubric-block.test",
    "qti-assessment-section",
    "qti-assessment-section-ref",
    "qti-test-feedback",
  ],
  "qti-time-limits": ["comment", "pi"],
  "qti-usagedata-ref": ["comment", "pi"],
  "qti-variable-mapping": ["comment", "pi"],
  "qti-weight": ["comment", "pi"],
};

const childrenOf = (version: string, parent: string): readonly string[] =>
  admission
    .filter((row) => row.version === version && row.parent === parent)
    .map((row) => row.child)
    .toSorted();

const element = (local: string): Element => ({
  attributes: [],
  children: [],
  kind: "element",
  local,
  namespace,
  prefix: "",
  qname: local,
});

describe("the test kinds", () => {
  it("lists the 26 handles in XSD document order", () => {
    assert.deepStrictEqual([...test.kinds], [...handles]);
  });

  it("follows xi's handles in NodeKind, and the declared names are in AttributeName", () => {
    const roster = node.NodeKind.handles;
    const at = roster.indexOf("xi:fallback");
    assert.deepStrictEqual(roster.slice(at + 1), [...handles]);
    assert.deepStrictEqual([...test.attributes], [...declared]);
    assert.deepStrictEqual([...declared], [...declared].toSorted());
    for (const name of declared) {
      assert.include(names, name);
      assert.include(node.AttributeName.handles, name);
    }
  });

  it("registers one row per kind, its attributes the inventory's, and the dotted parents", () => {
    for (const handle of handles) {
      const row = test.registry[handle];
      assert.strictEqual(row.namespace, namespace, handle);

      const entry = testInventory[handle];
      assert.isDefined(entry, handle);

      const wanted = entry?.attributes.map((attribute) => attribute.name);
      assert.deepStrictEqual(new Set(row.attributes), new Set(wanted), handle);
      assert.strictEqual(row.attributes.length, new Set(row.attributes).size, handle);

      assert.isTrue(
        registries.some((registry) => handle in registry),
        handle,
      );
    }
    assert.deepStrictEqual(
      test.registry["qti-rubric-block.test"].parent,
      Option.some("qti-assessment-test"),
    );
    assert.deepStrictEqual(
      test.registry["qti-content-body.testRubric"].parent,
      Option.some("qti-rubric-block.test"),
    );
    assert.deepStrictEqual(
      test.registry["qti-content-body.testFeedback"].parent,
      Option.some("qti-test-feedback"),
    );

    const dotted = new Set(handles.filter((handle) => handle.includes(".")));
    for (const handle of handles) {
      assert.strictEqual(Option.isSome(test.registry[handle].parent), dotted.has(handle), handle);
    }
  });

  it("resolves qti-rubric-block by the parent's kind", () => {
    const rubric = element("qti-rubric-block");
    for (const parent of [
      "qti-assessment-test",
      "qti-test-part",
      "qti-assessment-section",
    ] as const) {
      assert.deepStrictEqual(
        kindOf(rubric, Option.some(parent)),
        Option.some("qti-rubric-block.test"),
        parent,
      );
    }
    assert.deepStrictEqual(kindOf(rubric, Option.some("div")), Option.some("qti-rubric-block"));
    assert.deepStrictEqual(kindOf(rubric, Option.none()), Option.some("qti-rubric-block"));
  });

  it("resolves qti-content-body to its two test handles under their parents", () => {
    const body = element("qti-content-body");
    assert.deepStrictEqual(
      kindOf(body, Option.some("qti-rubric-block.test")),
      Option.some("qti-content-body.testRubric"),
    );
    assert.deepStrictEqual(
      kindOf(body, Option.some("qti-test-feedback")),
      Option.some("qti-content-body.testFeedback"),
    );
    assert.deepStrictEqual(
      kindOf(body, Option.some("qti-rubric-block")),
      Option.some("qti-content-body.rubric"),
    );
  });

  it("admits per host exactly the children of the XSD content models, in both versions", () => {
    for (const version of ["3.0.0", "3.0.1"]) {
      for (const handle of handles) {
        assert.deepStrictEqual(
          childrenOf(version, handle),
          expected[handle].toSorted(),
          `${version} ${handle}`,
        );
      }
    }
  });

  it("holds the 64 expressions under the pre-condition, branch rule and template default", () => {
    assert.strictEqual(expressionKinds.length, 64);
    for (const host of ["qti-pre-condition", "qti-branch-rule", "qti-template-default"]) {
      assert.strictEqual(childrenOf("3.0.1", host).length, 67, host);
    }
  });

  it("admits the declarations and the outcome processing under a test", () => {
    for (const version of ["3.0.0", "3.0.1"]) {
      const kids = childrenOf(version, "qti-assessment-test");
      assert.include(kids, "qti-context-declaration");
      assert.include(kids, "qti-outcome-declaration");
    }
  });

  it("reaches qti-feedback-inline through the test feedback body's HTML children", () => {
    for (const version of ["3.0.0", "3.0.1"]) {
      assert.include(childrenOf(version, "qti-content-body.testFeedback"), "p");
      assert.include(childrenOf(version, "p"), "qti-feedback-inline");
    }
  });

  it("gives the stimulus body the same element children in both versions", () => {
    assert.deepStrictEqual(
      childrenOf("3.0.0", "qti-stimulus-body"),
      childrenOf("3.0.1", "qti-stimulus-body"),
    );
  });

  it("admits the item's qti-assessment-stimulus-ref in both versions", () => {
    for (const version of ["3.0.0", "3.0.1"]) {
      assert.include(childrenOf(version, "qti-assessment-item"), "qti-assessment-stimulus-ref");
    }
  });

  it("arms every new handle", () => {
    for (const handle of handles) {
      assert.property(nodeArms, handle);
    }
  });
});

import { assert, describe, it } from "@effect/vitest";
import * as asi from "#pantry/schema/kinds/asi.ts";
import * as node from "#pantry/schema/node.ts";
import { admissionByVersion } from "#pantry/schema/seed/admission.ts";

/**
 * The 64 expression handles of the spec's 3.3 table A.
 */
const expressions = [
  "qti-and",
  "qti-any-n",
  "qti-base-value",
  "qti-container-size",
  "qti-contains",
  "qti-correct",
  "qti-custom-operator",
  "qti-default",
  "qti-delete",
  "qti-divide",
  "qti-duration-gte",
  "qti-duration-lt",
  "qti-equal",
  "qti-equal-rounded",
  "qti-field-value",
  "qti-gcd",
  "qti-gt",
  "qti-gte",
  "qti-index",
  "qti-inside",
  "qti-integer-divide",
  "qti-integer-modulus",
  "qti-integer-to-float",
  "qti-is-null",
  "qti-lcm",
  "qti-lt",
  "qti-lte",
  "qti-map-response",
  "qti-map-response-point",
  "qti-match",
  "qti-math-constant",
  "qti-math-operator",
  "qti-max",
  "qti-member",
  "qti-min",
  "qti-multiple",
  "qti-not",
  "qti-null",
  "qti-number-correct",
  "qti-number-incorrect",
  "qti-number-presented",
  "qti-number-responded",
  "qti-number-selected",
  "qti-or",
  "qti-ordered",
  "qti-outcome-maximum",
  "qti-outcome-minimum",
  "qti-pattern-match",
  "qti-power",
  "qti-product",
  "qti-random",
  "qti-random-float",
  "qti-random-integer",
  "qti-repeat",
  "qti-round",
  "qti-round-to",
  "qti-stats-operator",
  "qti-string-match",
  "qti-substring",
  "qti-subtract",
  "qti-sum",
  "qti-test-variables",
  "qti-truncate",
  "qti-variable",
];

/**
 * The 25 rule and processing handles of the spec's 3.3 table B, `qti-response-processing` aside.
 */
const rules = [
  "qti-response-condition",
  "qti-response-if",
  "qti-response-else-if",
  "qti-response-else",
  "qti-set-outcome-value",
  "qti-lookup-outcome-value",
  "qti-exit-response",
  "qti-response-processing-fragment",
  "qti-outcome-processing",
  "qti-outcome-condition",
  "qti-outcome-if",
  "qti-outcome-else-if",
  "qti-outcome-else",
  "qti-exit-test",
  "qti-outcome-processing-fragment",
  "qti-template-processing",
  "qti-template-condition",
  "qti-template-if",
  "qti-template-else-if",
  "qti-template-else",
  "qti-set-template-value",
  "qti-set-default-value",
  "qti-set-correct-response",
  "qti-template-constraint",
  "qti-exit-template",
];

/**
 * The 25 attribute names of the spec's 3.9 that the M0 roster does not hold.
 */
const attributeNames = [
  "min",
  "max",
  "class",
  "definition",
  "tolerance-mode",
  "tolerance",
  "include-lower-bound",
  "include-upper-bound",
  "rounding-mode",
  "figures",
  "n",
  "shape",
  "coords",
  "name",
  "section-identifier",
  "include-category",
  "exclude-category",
  "outcome-identifier",
  "weight-identifier",
  "pattern",
  "step",
  "number-repeats",
  "case-sensitive",
  "substring",
  "variable-identifier",
];

/**
 * The 20 expression kinds outside `NumericLogic1toManyDType`'s choice.
 */
const nonNumeric = new Set([
  "qti-and",
  "qti-any-n",
  "qti-contains",
  "qti-duration-gte",
  "qti-duration-lt",
  "qti-equal",
  "qti-equal-rounded",
  "qti-gt",
  "qti-gte",
  "qti-inside",
  "qti-is-null",
  "qti-lt",
  "qti-lte",
  "qti-match",
  "qti-member",
  "qti-not",
  "qti-or",
  "qti-pattern-match",
  "qti-string-match",
  "qti-substring",
]);

/**
 * The 20 kinds of the empty XSD type.
 */
const emptyKinds = [
  "qti-correct",
  "qti-default",
  "qti-map-response",
  "qti-map-response-point",
  "qti-math-constant",
  "qti-null",
  "qti-number-correct",
  "qti-number-incorrect",
  "qti-number-presented",
  "qti-number-responded",
  "qti-number-selected",
  "qti-outcome-maximum",
  "qti-outcome-minimum",
  "qti-random-float",
  "qti-random-integer",
  "qti-test-variables",
  "qti-variable",
  "qti-exit-response",
  "qti-exit-test",
  "qti-exit-template",
];

const generic = ["ws", "comment", "pi"];

const mixed = ["text", "ws", "entityRef", "comment", "pi"];

/**
 * The children `parent` admits under one version, sorted.
 */
const childrenOf = (parent: string): readonly string[] =>
  admissionByVersion("3.0.0")
    .filter((row) => row.parent === parent)
    .map((row) => row.child)
    .toSorted();

const sorted = (names: readonly string[]): readonly string[] => names.toSorted();

describe("kinds/asi processing rows", () => {
  it("declares the 89 processing handles in NodeKind and the 25 names in AttributeName", () => {
    const handles: readonly string[] = node.NodeKind.handles;
    const attributes: readonly string[] = node.AttributeName.handles;
    assert.deepStrictEqual(
      [...expressions, ...rules].filter((handle) => !handles.includes(handle)),
      [],
    );
    assert.deepStrictEqual(
      attributeNames.filter((name) => !attributes.includes(name)),
      [],
    );
    assert.deepStrictEqual(
      ["xi:include", "xi:fallback"].filter((handle) => !handles.includes(handle)),
      [],
    );
    assert.deepStrictEqual(
      ["parse", "xpointer", "encoding", "accept", "accept-language"].filter(
        (name) => !attributes.includes(name),
      ),
      [],
    );
  });

  it("gives every processing handle a registry row", () => {
    assert.deepStrictEqual(
      [...expressions, ...rules].filter((handle) => !(handle in asi.registry)),
      [],
    );
    assert.deepStrictEqual(asi.registry["qti-custom-operator"].attributes, ["class", "definition"]);
    assert.deepStrictEqual(asi.registry["qti-response-processing"].attributes, [
      "template",
      "template-location",
    ]);
  });

  it("admits under qti-sum exactly the 44 numeric expressions", () => {
    const numeric = expressions.filter((kind) => !nonNumeric.has(kind));
    assert.strictEqual(numeric.length, 44);
    assert.deepStrictEqual(childrenOf("qti-sum"), sorted([...numeric, ...generic]));
  });

  it("admits under each empty kind exactly comment and pi", () => {
    for (const kind of emptyKinds) {
      assert.deepStrictEqual(childrenOf(kind), ["comment", "pi"], kind);
    }
    assert.deepStrictEqual(childrenOf("qti-correct"), ["comment", "pi"]);
  });

  it("admits under qti-base-value exactly the mixed content", () => {
    assert.deepStrictEqual(childrenOf("qti-base-value"), sorted(mixed));
  });

  it("admits under qti-template-if the expressions and five template rules, never the constraint", () => {
    assert.deepStrictEqual(
      childrenOf("qti-template-if"),
      sorted([
        ...expressions,
        "qti-set-template-value",
        "qti-exit-template",
        "qti-template-condition",
        "qti-set-default-value",
        "qti-set-correct-response",
        ...generic,
      ]),
    );
    assert.isTrue(childrenOf("qti-template-processing").includes("qti-template-constraint"));
    assert.isFalse(childrenOf("qti-template-else").includes("qti-template-constraint"));
    assert.isFalse(childrenOf("qti-template-else-if").includes("qti-template-constraint"));
  });

  it("admits under qti-response-processing its three generic children and the six rules", () => {
    assert.deepStrictEqual(
      childrenOf("qti-response-processing"),
      sorted([
        "xi:include",
        "qti-response-condition",
        "qti-response-processing-fragment",
        "qti-set-outcome-value",
        "qti-exit-response",
        "qti-lookup-outcome-value",
        ...generic,
      ]),
    );
  });

  it("admits qti-template-processing under qti-assessment-item", () => {
    assert.isTrue(childrenOf("qti-assessment-item").includes("qti-template-processing"));
  });

  it("admits xi:include under the ten response and outcome rule hosts and no other processing host", () => {
    const hosts = [...expressions, ...rules, "qti-response-processing"].filter((host) =>
      childrenOf(host).includes("xi:include"),
    );
    assert.deepStrictEqual(
      hosts.toSorted(),
      [
        "qti-response-processing",
        "qti-response-if",
        "qti-response-else-if",
        "qti-response-else",
        "qti-response-processing-fragment",
        "qti-outcome-processing",
        "qti-outcome-if",
        "qti-outcome-else-if",
        "qti-outcome-else",
        "qti-outcome-processing-fragment",
      ].toSorted(),
    );
  });

  it("appends 4,032 rows per version for the 90 processing hosts", () => {
    const hosts = new Set([...expressions, ...rules, "qti-response-processing"]);
    for (const version of ["3.0.0", "3.0.1"] as const) {
      const rows = asi.admission.filter((row) => row.version === version);
      const appended = rows.filter(
        (row) =>
          (hosts.has(row.parent) &&
            !(row.parent === "qti-response-processing" && generic.includes(row.child))) ||
          (row.parent === "qti-assessment-item" && row.child === "qti-template-processing"),
      );
      assert.strictEqual(appended.length, 4032, version);
    }
  });
});

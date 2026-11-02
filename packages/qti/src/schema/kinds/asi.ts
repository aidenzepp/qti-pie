/**
 * The ASI vocabulary: the QTI assessment-item kinds of the first round trip, in the ASI namespace.
 */
import { Option } from "effect";

import type { AdmissionRow, RegistryRow, SchemaVersionHandle } from "#qti/schema/kinds/generic.ts";

const namespace = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * The expression kinds of the processing vocabulary: table A of the spec's 3.3, alphabetical.
 */
export const expressionKinds = [
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
] as const;

/**
 * The rule and processing kinds, `qti-response-processing` (the M0 kind) aside: table B of the
 * spec's 3.3, in table order.
 */
export const ruleKinds = [
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
] as const;

/**
 * The ASI kinds, in append-only order; each handle is the element's local name.
 */
export const kinds = [
  "qti-assessment-item",
  "qti-response-declaration",
  "qti-outcome-declaration",
  "qti-correct-response",
  "qti-default-value",
  "qti-value",
  "qti-item-body",
  "qti-choice-interaction",
  "qti-prompt",
  "qti-simple-choice",
  "qti-response-processing",
  ...expressionKinds,
  ...ruleKinds,
] as const;

/**
 * The attribute names these kinds introduce, in first-appearance order over the roster.
 */
export const attributes = [
  "identifier",
  "title",
  "adaptive",
  "time-dependent",
  "cardinality",
  "base-type",
  "view",
  "interpretation",
  "long-interpretation",
  "normal-maximum",
  "normal-minimum",
  "mastery-value",
  "external-scored",
  "variable-identifier-ref",
  "field-identifier",
  "response-identifier",
  "shuffle",
  "max-choices",
  "min-choices",
  "orientation",
  "data-min-selections-message",
  "data-max-selections-message",
  "fixed",
  "template-identifier",
  "show-hide",
  "template",
  "template-location",
  // The processing vocabulary's own names (the spec's 3.9, in first-appearance order).
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
] as const;

const row = (local: (typeof kinds)[number], own: readonly string[]): RegistryRow => ({
  attributes: own,
  local,
  namespace,
  parent: Option.none(),
});

/**
 * The registry row of each ASI kind.
 */
export const registry: Readonly<Record<(typeof kinds)[number], RegistryRow>> = {
  "qti-and": row("qti-and", []),
  "qti-any-n": row("qti-any-n", ["min", "max"]),
  "qti-assessment-item": row("qti-assessment-item", [
    "identifier",
    "title",
    "adaptive",
    "time-dependent",
  ]),
  "qti-base-value": row("qti-base-value", ["base-type"]),
  "qti-choice-interaction": row("qti-choice-interaction", [
    "response-identifier",
    "shuffle",
    "max-choices",
    "min-choices",
    "orientation",
    "data-min-selections-message",
    "data-max-selections-message",
  ]),
  "qti-container-size": row("qti-container-size", []),
  "qti-contains": row("qti-contains", []),
  "qti-correct": row("qti-correct", ["identifier"]),
  "qti-correct-response": row("qti-correct-response", ["interpretation"]),
  "qti-custom-operator": row("qti-custom-operator", ["class", "definition"]),
  "qti-default": row("qti-default", ["identifier"]),
  "qti-default-value": row("qti-default-value", ["interpretation"]),
  "qti-delete": row("qti-delete", []),
  "qti-divide": row("qti-divide", []),
  "qti-duration-gte": row("qti-duration-gte", []),
  "qti-duration-lt": row("qti-duration-lt", []),
  "qti-equal": row("qti-equal", [
    "tolerance-mode",
    "tolerance",
    "include-lower-bound",
    "include-upper-bound",
  ]),
  "qti-equal-rounded": row("qti-equal-rounded", ["rounding-mode", "figures"]),
  "qti-exit-response": row("qti-exit-response", []),
  "qti-exit-template": row("qti-exit-template", []),
  "qti-exit-test": row("qti-exit-test", []),
  "qti-field-value": row("qti-field-value", ["field-identifier"]),
  "qti-gcd": row("qti-gcd", []),
  "qti-gt": row("qti-gt", []),
  "qti-gte": row("qti-gte", []),
  "qti-index": row("qti-index", ["n"]),
  "qti-inside": row("qti-inside", ["shape", "coords"]),
  "qti-integer-divide": row("qti-integer-divide", []),
  "qti-integer-modulus": row("qti-integer-modulus", []),
  "qti-integer-to-float": row("qti-integer-to-float", []),
  "qti-is-null": row("qti-is-null", []),
  "qti-item-body": row("qti-item-body", []),
  "qti-lcm": row("qti-lcm", []),
  "qti-lookup-outcome-value": row("qti-lookup-outcome-value", ["identifier"]),
  "qti-lt": row("qti-lt", []),
  "qti-lte": row("qti-lte", []),
  "qti-map-response": row("qti-map-response", ["identifier"]),
  "qti-map-response-point": row("qti-map-response-point", ["identifier"]),
  "qti-match": row("qti-match", []),
  "qti-math-constant": row("qti-math-constant", ["name"]),
  "qti-math-operator": row("qti-math-operator", ["name"]),
  "qti-max": row("qti-max", []),
  "qti-member": row("qti-member", []),
  "qti-min": row("qti-min", []),
  "qti-multiple": row("qti-multiple", []),
  "qti-not": row("qti-not", []),
  "qti-null": row("qti-null", []),
  "qti-number-correct": row("qti-number-correct", [
    "section-identifier",
    "include-category",
    "exclude-category",
  ]),
  "qti-number-incorrect": row("qti-number-incorrect", [
    "section-identifier",
    "include-category",
    "exclude-category",
  ]),
  "qti-number-presented": row("qti-number-presented", [
    "section-identifier",
    "include-category",
    "exclude-category",
  ]),
  "qti-number-responded": row("qti-number-responded", [
    "section-identifier",
    "include-category",
    "exclude-category",
  ]),
  "qti-number-selected": row("qti-number-selected", [
    "section-identifier",
    "include-category",
    "exclude-category",
  ]),
  "qti-or": row("qti-or", []),
  "qti-ordered": row("qti-ordered", []),
  "qti-outcome-condition": row("qti-outcome-condition", []),
  "qti-outcome-declaration": row("qti-outcome-declaration", [
    "identifier",
    "base-type",
    "cardinality",
    "view",
    "interpretation",
    "long-interpretation",
    "normal-maximum",
    "normal-minimum",
    "mastery-value",
    "external-scored",
    "variable-identifier-ref",
  ]),
  "qti-outcome-else": row("qti-outcome-else", []),
  "qti-outcome-else-if": row("qti-outcome-else-if", []),
  "qti-outcome-if": row("qti-outcome-if", []),
  "qti-outcome-maximum": row("qti-outcome-maximum", [
    "section-identifier",
    "include-category",
    "exclude-category",
    "outcome-identifier",
    "weight-identifier",
  ]),
  "qti-outcome-minimum": row("qti-outcome-minimum", [
    "section-identifier",
    "include-category",
    "exclude-category",
    "outcome-identifier",
    "weight-identifier",
  ]),
  "qti-outcome-processing": row("qti-outcome-processing", []),
  "qti-outcome-processing-fragment": row("qti-outcome-processing-fragment", []),
  "qti-pattern-match": row("qti-pattern-match", ["pattern"]),
  "qti-power": row("qti-power", []),
  "qti-product": row("qti-product", []),
  "qti-prompt": row("qti-prompt", []),
  "qti-random": row("qti-random", []),
  "qti-random-float": row("qti-random-float", ["min", "max"]),
  "qti-random-integer": row("qti-random-integer", ["min", "max", "step"]),
  "qti-repeat": row("qti-repeat", ["number-repeats"]),
  "qti-response-condition": row("qti-response-condition", []),
  "qti-response-declaration": row("qti-response-declaration", [
    "identifier",
    "base-type",
    "cardinality",
  ]),
  "qti-response-else": row("qti-response-else", []),
  "qti-response-else-if": row("qti-response-else-if", []),
  "qti-response-if": row("qti-response-if", []),
  "qti-response-processing": row("qti-response-processing", ["template", "template-location"]),
  "qti-response-processing-fragment": row("qti-response-processing-fragment", []),
  "qti-round": row("qti-round", []),
  "qti-round-to": row("qti-round-to", ["rounding-mode", "figures"]),
  "qti-set-correct-response": row("qti-set-correct-response", ["identifier"]),
  "qti-set-default-value": row("qti-set-default-value", ["identifier"]),
  "qti-set-outcome-value": row("qti-set-outcome-value", ["identifier"]),
  "qti-set-template-value": row("qti-set-template-value", ["identifier"]),
  "qti-simple-choice": row("qti-simple-choice", [
    "identifier",
    "fixed",
    "template-identifier",
    "show-hide",
  ]),
  "qti-stats-operator": row("qti-stats-operator", ["name"]),
  "qti-string-match": row("qti-string-match", ["case-sensitive", "substring"]),
  "qti-substring": row("qti-substring", ["case-sensitive"]),
  "qti-subtract": row("qti-subtract", []),
  "qti-sum": row("qti-sum", []),
  "qti-template-condition": row("qti-template-condition", []),
  "qti-template-constraint": row("qti-template-constraint", []),
  "qti-template-else": row("qti-template-else", []),
  "qti-template-else-if": row("qti-template-else-if", []),
  "qti-template-if": row("qti-template-if", []),
  "qti-template-processing": row("qti-template-processing", []),
  "qti-test-variables": row("qti-test-variables", [
    "section-identifier",
    "include-category",
    "exclude-category",
    "variable-identifier",
    "weight-identifier",
    "base-type",
  ]),
  "qti-truncate": row("qti-truncate", []),
  "qti-value": row("qti-value", ["field-identifier", "base-type"]),
  "qti-variable": row("qti-variable", ["identifier", "weight-identifier"]),
};

const versions = ["3.0.0", "3.0.1"] as const satisfies readonly SchemaVersionHandle[];

const elementOnly = ["ws", "comment", "pi"] as const;

const mixed = ["text", "ws", "entityRef", "comment", "pi"] as const;

/**
 * The children each ASI kind admits, by content type: the spec's 3.6 and 4.3. The element-only
 * hosts add whitespace, comments and instructions; the mixed hosts add character data and entity
 * references; `qti-value` is simple content; `qti-response-processing` admits only the generic
 * rows here and takes its element children from `processingChildren`.
 */
const children: Readonly<Partial<Record<(typeof kinds)[number], readonly string[]>>> = {
  "qti-assessment-item": [
    "qti-response-declaration",
    "qti-outcome-declaration",
    "qti-item-body",
    "qti-response-processing",
    ...elementOnly,
  ],
  "qti-choice-interaction": ["qti-prompt", "qti-simple-choice", ...elementOnly],
  "qti-correct-response": ["qti-value", ...elementOnly],
  "qti-default-value": ["qti-value", ...elementOnly],
  "qti-item-body": ["qti-choice-interaction", "p", ...elementOnly],
  "qti-outcome-declaration": ["qti-default-value", ...elementOnly],
  "qti-prompt": ["p", "img", ...mixed],
  "qti-response-declaration": ["qti-default-value", "qti-correct-response", ...elementOnly],
  "qti-response-processing": elementOnly,
  "qti-simple-choice": ["p", "img", ...mixed],
  "qti-value": mixed,
};

/**
 * The expression kinds with no operand: the 17 empty ones and `qti-base-value`, which is simple
 * content (3.3 D).
 */
const operandless: ReadonlySet<string> = new Set([
  "qti-base-value",
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
]);

/**
 * The expression kinds `qti-sum` excludes: the boolean-valued ones outside
 * `NumericLogic1toManyDType`'s choice (3.3 A).
 */
const nonNumeric: ReadonlySet<string> = new Set([
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
 * The 44 expression kinds of `NumericLogic1toManyDType`'s choice.
 */
const numericKinds: readonly string[] = expressionKinds.filter((kind) => !nonNumeric.has(kind));

/**
 * The six rule children of each processing language: the response and outcome rules admit
 * `xi:include`, the template rules `qti-template-constraint` (3.3 D).
 */
const responseRules = [
  "xi:include",
  "qti-response-condition",
  "qti-response-processing-fragment",
  "qti-set-outcome-value",
  "qti-exit-response",
  "qti-lookup-outcome-value",
] as const;

const outcomeRules = [
  "qti-lookup-outcome-value",
  "qti-outcome-processing-fragment",
  "qti-set-outcome-value",
  "xi:include",
  "qti-exit-test",
  "qti-outcome-condition",
] as const;

const templateRules = [
  "qti-set-template-value",
  "qti-exit-template",
  "qti-template-condition",
  "qti-set-default-value",
  "qti-set-correct-response",
  "qti-template-constraint",
] as const;

/**
 * The template rules the three template branches admit: `qti-template-constraint` is admitted by
 * `qti-template-processing` alone (the goal's 4.15).
 */
const templateBranchRules = templateRules.filter((kind) => kind !== "qti-template-constraint");

const conditionChildren = (
  prefix: "outcome" | "response" | "template",
): readonly [string, string, string] => [
  `qti-${prefix}-if`,
  `qti-${prefix}-else-if`,
  `qti-${prefix}-else`,
];

/**
 * The element children of each M3 host, from the XSD content models (the spec's 3.3 D): an
 * expression with operands admits the 64 expressions, `qti-sum` the 44 numeric ones, a rule that
 * takes one expression the 64, an `if` or `else-if` branch the 64 and its language's six rules,
 * an `else` branch and a processing container the six, a condition its three branches.
 */
const elementChildren = {
  ...Object.fromEntries(
    expressionKinds
      .filter((kind) => !operandless.has(kind) && kind !== "qti-sum")
      .map((kind) => [kind, expressionKinds] as const),
  ),
  "qti-lookup-outcome-value": expressionKinds,
  "qti-outcome-condition": conditionChildren("outcome"),
  "qti-outcome-else": outcomeRules,
  "qti-outcome-else-if": [...expressionKinds, ...outcomeRules],
  "qti-outcome-if": [...expressionKinds, ...outcomeRules],
  "qti-outcome-processing": outcomeRules,
  "qti-outcome-processing-fragment": outcomeRules,
  "qti-response-condition": conditionChildren("response"),
  "qti-response-else": responseRules,
  "qti-response-else-if": [...expressionKinds, ...responseRules],
  "qti-response-if": [...expressionKinds, ...responseRules],
  "qti-response-processing": responseRules,
  "qti-response-processing-fragment": responseRules,
  "qti-set-correct-response": expressionKinds,
  "qti-set-default-value": expressionKinds,
  "qti-set-outcome-value": expressionKinds,
  "qti-set-template-value": expressionKinds,
  "qti-sum": numericKinds,
  "qti-template-condition": conditionChildren("template"),
  "qti-template-constraint": expressionKinds,
  "qti-template-else": templateBranchRules,
  "qti-template-else-if": [...expressionKinds, ...templateBranchRules],
  "qti-template-if": [...expressionKinds, ...templateBranchRules],
  "qti-template-processing": templateRules,
} satisfies Readonly<Record<string, readonly string[]>>;

/**
 * The kinds that admit no child but comments and instructions: the 20 empty ones (3.3 D).
 */
const emptyKinds = [
  ...[...operandless].filter((kind) => kind !== "qti-base-value"),
  "qti-exit-response",
  "qti-exit-test",
  "qti-exit-template",
] as const;

/**
 * The children of every M3 host by the content-type rule of phase-1's 4.3: the element children,
 * the generic rows of each host class, and the one element `qti-assessment-item` gains.
 */
const processingChildren = {
  ...Object.fromEntries(
    Object.entries(elementChildren).map(([host, kids]) => [
      host,
      host === "qti-response-processing" ? kids : [...kids, ...elementOnly],
    ]),
  ),
  "qti-assessment-item": ["qti-template-processing"],
  "qti-base-value": mixed,
  ...Object.fromEntries(emptyKinds.map((host) => [host, ["comment", "pi"]] as const)),
} satisfies Readonly<Record<string, readonly string[]>>;

/**
 * The ASI admission rows, the same for both versions: the first round trip's, then the 4,032 rows
 * per version of the 90 processing hosts.
 */
export const admission: readonly AdmissionRow[] = [children, processingChildren].flatMap(
  (byParent) =>
    Object.entries(byParent).flatMap(([parent, kids]) =>
      versions.flatMap((version) => kids.map((child) => ({ child, parent, version }))),
    ),
);

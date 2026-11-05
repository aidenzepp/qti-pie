/**
 * Child-expression multiplicity of the 64 expression kinds, in three seeded tables.
 *
 * `operatorArity` states the least number of child expressions a kind admits and `operatorArityMax`
 * the most; a kind with no upper bound has no row in `operatorArityMax` and a row in
 * `operatorArityUnbounded` instead, so the two partition the 64. The rows are transcribed from the
 * output below (`docs/goals/qti/phase-3.md`, table A). The output is printed by the vocabulary
 * deriver's `arity` target, run from `packages/pantry` as `node src/vocab/derive/derive.ts arity`,
 * in the form of the spec's 3.6 derivation, over the ASI 3.0 XSD: for each of the 18 leaves and 46
 * operators of `qti-response-processing`'s content, the sum of its child-expression `minOccurs`,
 * and the sum of their `maxOccurs` where every child is bounded, else `*`. `qti-repeat` has min 1
 * (goal 4.14), `qti-base-value` min 0 and max 0, and `qti-sum` min 1 and no max. `derive.test.ts`
 * checks that the three tables and the block below equal the deriver's output.
 *
 * ```text
 * qti-base-value           min=0 max=0
 * qti-variable             min=0 max=0
 * qti-default              min=0 max=0
 * qti-correct              min=0 max=0
 * qti-map-response         min=0 max=0
 * qti-map-response-point   min=0 max=0
 * qti-math-constant        min=0 max=0
 * qti-null                 min=0 max=0
 * qti-random-integer       min=0 max=0
 * qti-random-float         min=0 max=0
 * qti-number-correct       min=0 max=0
 * qti-number-incorrect     min=0 max=0
 * qti-number-presented     min=0 max=0
 * qti-number-responded     min=0 max=0
 * qti-number-selected      min=0 max=0
 * qti-outcome-minimum      min=0 max=0
 * qti-outcome-maximum      min=0 max=0
 * qti-test-variables       min=0 max=0
 * qti-and                  min=1 max=*
 * qti-or                   min=1 max=*
 * qti-not                  min=1 max=1
 * qti-any-n                min=1 max=*
 * qti-match                min=2 max=2
 * qti-equal                min=2 max=2
 * qti-equal-rounded        min=2 max=2
 * qti-gt                   min=2 max=2
 * qti-gte                  min=2 max=2
 * qti-lt                   min=2 max=2
 * qti-lte                  min=2 max=2
 * qti-duration-lt          min=2 max=2
 * qti-duration-gte         min=2 max=2
 * qti-member               min=2 max=2
 * qti-contains             min=2 max=2
 * qti-delete               min=2 max=2
 * qti-substring            min=2 max=2
 * qti-string-match         min=2 max=2
 * qti-pattern-match        min=1 max=1
 * qti-inside               min=1 max=1
 * qti-multiple             min=0 max=*
 * qti-ordered              min=0 max=*
 * qti-repeat               min=1 max=*
 * qti-container-size       min=1 max=1
 * qti-is-null              min=1 max=1
 * qti-random               min=1 max=1
 * qti-index                min=1 max=1
 * qti-field-value          min=1 max=1
 * qti-sum                  min=1 max=*
 * qti-product              min=1 max=*
 * qti-subtract             min=2 max=2
 * qti-divide               min=2 max=2
 * qti-power                min=2 max=2
 * qti-integer-divide       min=2 max=2
 * qti-integer-modulus      min=2 max=2
 * qti-integer-to-float     min=1 max=1
 * qti-round                min=1 max=1
 * qti-truncate             min=1 max=1
 * qti-round-to             min=1 max=1
 * qti-min                  min=1 max=*
 * qti-max                  min=1 max=*
 * qti-gcd                  min=1 max=*
 * qti-lcm                  min=1 max=*
 * qti-math-operator        min=1 max=*
 * qti-stats-operator       min=1 max=1
 * qti-custom-operator      min=0 max=*
 * ```
 */
import type { NodeKindHandle } from "#pantry/schema/node.ts";

/**
 * The fewest child expressions each expression kind admits, in the order of the output above.
 */
export const operatorArity: readonly { readonly kind: NodeKindHandle; readonly min: bigint }[] = [
  { kind: "qti-base-value", min: 0n },
  { kind: "qti-variable", min: 0n },
  { kind: "qti-default", min: 0n },
  { kind: "qti-correct", min: 0n },
  { kind: "qti-map-response", min: 0n },
  { kind: "qti-map-response-point", min: 0n },
  { kind: "qti-math-constant", min: 0n },
  { kind: "qti-null", min: 0n },
  { kind: "qti-random-integer", min: 0n },
  { kind: "qti-random-float", min: 0n },
  { kind: "qti-number-correct", min: 0n },
  { kind: "qti-number-incorrect", min: 0n },
  { kind: "qti-number-presented", min: 0n },
  { kind: "qti-number-responded", min: 0n },
  { kind: "qti-number-selected", min: 0n },
  { kind: "qti-outcome-minimum", min: 0n },
  { kind: "qti-outcome-maximum", min: 0n },
  { kind: "qti-test-variables", min: 0n },
  { kind: "qti-and", min: 1n },
  { kind: "qti-or", min: 1n },
  { kind: "qti-not", min: 1n },
  { kind: "qti-any-n", min: 1n },
  { kind: "qti-match", min: 2n },
  { kind: "qti-equal", min: 2n },
  { kind: "qti-equal-rounded", min: 2n },
  { kind: "qti-gt", min: 2n },
  { kind: "qti-gte", min: 2n },
  { kind: "qti-lt", min: 2n },
  { kind: "qti-lte", min: 2n },
  { kind: "qti-duration-lt", min: 2n },
  { kind: "qti-duration-gte", min: 2n },
  { kind: "qti-member", min: 2n },
  { kind: "qti-contains", min: 2n },
  { kind: "qti-delete", min: 2n },
  { kind: "qti-substring", min: 2n },
  { kind: "qti-string-match", min: 2n },
  { kind: "qti-pattern-match", min: 1n },
  { kind: "qti-inside", min: 1n },
  { kind: "qti-multiple", min: 0n },
  { kind: "qti-ordered", min: 0n },
  { kind: "qti-repeat", min: 1n },
  { kind: "qti-container-size", min: 1n },
  { kind: "qti-is-null", min: 1n },
  { kind: "qti-random", min: 1n },
  { kind: "qti-index", min: 1n },
  { kind: "qti-field-value", min: 1n },
  { kind: "qti-sum", min: 1n },
  { kind: "qti-product", min: 1n },
  { kind: "qti-subtract", min: 2n },
  { kind: "qti-divide", min: 2n },
  { kind: "qti-power", min: 2n },
  { kind: "qti-integer-divide", min: 2n },
  { kind: "qti-integer-modulus", min: 2n },
  { kind: "qti-integer-to-float", min: 1n },
  { kind: "qti-round", min: 1n },
  { kind: "qti-truncate", min: 1n },
  { kind: "qti-round-to", min: 1n },
  { kind: "qti-min", min: 1n },
  { kind: "qti-max", min: 1n },
  { kind: "qti-gcd", min: 1n },
  { kind: "qti-lcm", min: 1n },
  { kind: "qti-math-operator", min: 1n },
  { kind: "qti-stats-operator", min: 1n },
  { kind: "qti-custom-operator", min: 0n },
];

/**
 * The most child expressions each bounded expression kind admits: the kinds of the output above
 * with a finite `max`.
 */
export const operatorArityMax: readonly { readonly kind: NodeKindHandle; readonly max: bigint }[] =
  [
    { kind: "qti-base-value", max: 0n },
    { kind: "qti-variable", max: 0n },
    { kind: "qti-default", max: 0n },
    { kind: "qti-correct", max: 0n },
    { kind: "qti-map-response", max: 0n },
    { kind: "qti-map-response-point", max: 0n },
    { kind: "qti-math-constant", max: 0n },
    { kind: "qti-null", max: 0n },
    { kind: "qti-random-integer", max: 0n },
    { kind: "qti-random-float", max: 0n },
    { kind: "qti-number-correct", max: 0n },
    { kind: "qti-number-incorrect", max: 0n },
    { kind: "qti-number-presented", max: 0n },
    { kind: "qti-number-responded", max: 0n },
    { kind: "qti-number-selected", max: 0n },
    { kind: "qti-outcome-minimum", max: 0n },
    { kind: "qti-outcome-maximum", max: 0n },
    { kind: "qti-test-variables", max: 0n },
    { kind: "qti-not", max: 1n },
    { kind: "qti-match", max: 2n },
    { kind: "qti-equal", max: 2n },
    { kind: "qti-equal-rounded", max: 2n },
    { kind: "qti-gt", max: 2n },
    { kind: "qti-gte", max: 2n },
    { kind: "qti-lt", max: 2n },
    { kind: "qti-lte", max: 2n },
    { kind: "qti-duration-lt", max: 2n },
    { kind: "qti-duration-gte", max: 2n },
    { kind: "qti-member", max: 2n },
    { kind: "qti-contains", max: 2n },
    { kind: "qti-delete", max: 2n },
    { kind: "qti-substring", max: 2n },
    { kind: "qti-string-match", max: 2n },
    { kind: "qti-pattern-match", max: 1n },
    { kind: "qti-inside", max: 1n },
    { kind: "qti-container-size", max: 1n },
    { kind: "qti-is-null", max: 1n },
    { kind: "qti-random", max: 1n },
    { kind: "qti-index", max: 1n },
    { kind: "qti-field-value", max: 1n },
    { kind: "qti-subtract", max: 2n },
    { kind: "qti-divide", max: 2n },
    { kind: "qti-power", max: 2n },
    { kind: "qti-integer-divide", max: 2n },
    { kind: "qti-integer-modulus", max: 2n },
    { kind: "qti-integer-to-float", max: 1n },
    { kind: "qti-round", max: 1n },
    { kind: "qti-truncate", max: 1n },
    { kind: "qti-round-to", max: 1n },
    { kind: "qti-stats-operator", max: 1n },
  ];

/**
 * The expression kinds with no upper bound on their child expressions: the kinds of the output
 * above whose `max` is `*`. They and `operatorArityMax` partition `operatorArity`.
 */
export const operatorArityUnbounded: readonly { readonly kind: NodeKindHandle }[] = [
  { kind: "qti-and" },
  { kind: "qti-or" },
  { kind: "qti-any-n" },
  { kind: "qti-multiple" },
  { kind: "qti-ordered" },
  { kind: "qti-repeat" },
  { kind: "qti-sum" },
  { kind: "qti-product" },
  { kind: "qti-min" },
  { kind: "qti-max" },
  { kind: "qti-gcd" },
  { kind: "qti-lcm" },
  { kind: "qti-math-operator" },
  { kind: "qti-custom-operator" },
];

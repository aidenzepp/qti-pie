/**
 * The references family of the item model: the kind rules of `qti-variable`, `qti-correct`,
 * `qti-base-value`, `qti-map-response` and `qti-map-response-point`, and the unlanded rule of each
 * kind the family has not landed (`qti-default`, `qti-null`, `qti-random-integer` and
 * `qti-random-float`), which its slice (`p7-10`) and M3.b-2 replace.
 *
 * It value-imports only `#plate/model/expression.ts`, so the registry in
 * `#plate/model/expressions/read.ts` may import it without a cycle.
 *
 * @module
 */
import { acceptsAnyOperands, singleOf, unlandedRule } from "#plate/model/expression.ts";
import type { FamilyRules, KindRule } from "#plate/model/expression.ts";

/**
 * The result type of a kind that reads a declaration: the declaration's type, which the caller
 * passes in its attributes, unknown where it passes none.
 *
 * @param _operands The operands' types; the kind has none.
 * @param attributes The type of the declaration the kind names.
 * @returns The declaration's type.
 */
const declared: KindRule["resultType"] = (_operands, attributes) => ({
  baseType: attributes.baseType ?? "unknown",
  cardinality: attributes.cardinality ?? "unknown",
});

/**
 * The rule of `qti-variable`: the type of the variable it names, a response, an outcome, a
 * template or context variable, or a built-in, whose value it reads.
 *
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#ExpVariable
 */
const variableRule: KindRule = {
  declaration: { attribute: "identifier", expected: "variable" },
  operandsAccept: acceptsAnyOperands,
  references: [],
  resultType: declared,
};

/**
 * The rule of `qti-correct`: the type of the response it names, whose correct response it reads.
 *
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#ExpCorrect
 */
const correctRule: KindRule = {
  declaration: { attribute: "identifier", expected: "response" },
  operandsAccept: acceptsAnyOperands,
  references: [],
  resultType: declared,
};

/**
 * The rule of `qti-base-value`: a single value of its `base-type`, which the caller passes in its
 * attributes.
 *
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#ExpBaseValue
 */
const baseValueRule: KindRule = {
  operandsAccept: acceptsAnyOperands,
  references: [],
  resultType: (_operands, attributes) => singleOf(attributes.baseType ?? "unknown"),
};

/**
 * The rule of `qti-map-response`: a single float, the mapped value of the response it names.
 *
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#ExpMapResponse
 */
const mapResponseRule: KindRule = {
  declaration: { attribute: "identifier", expected: "response" },
  operandsAccept: acceptsAnyOperands,
  references: [],
  resultType: () => singleOf("float"),
};

/**
 * The rule of `qti-map-response-point`: a single float, the mapped value of the point response it
 * names.
 *
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#ExpMapResponsePoint
 */
const mapResponsePointRule: KindRule = {
  declaration: { attribute: "identifier", expected: "response" },
  operandsAccept: acceptsAnyOperands,
  references: [],
  resultType: () => singleOf("float"),
};

/**
 * The references family's kind rules by kind: M1's five, and the unlanded rule for each kind the
 * family has not landed.
 */
export const referencesRules: FamilyRules<
  | "base-value"
  | "correct"
  | "default"
  | "map-response"
  | "map-response-point"
  | "null"
  | "random-float"
  | "random-integer"
  | "variable"
> = {
  "base-value": baseValueRule,
  correct: correctRule,
  default: unlandedRule,
  "map-response": mapResponseRule,
  "map-response-point": mapResponsePointRule,
  null: unlandedRule,
  "random-float": unlandedRule,
  "random-integer": unlandedRule,
  variable: variableRule,
};

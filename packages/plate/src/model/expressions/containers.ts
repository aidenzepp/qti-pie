/**
 * The containers family of the item model: the kind rule of `qti-is-null`, and the unlanded rule
 * of each kind the family has not landed (`qti-multiple`, `qti-ordered`, `qti-repeat`,
 * `qti-container-size`, `qti-index`, `qti-member`, `qti-delete`, `qti-contains`, `qti-random` and
 * `qti-field-value`), which its slice (`p7-08`) and later ones replace.
 *
 * It value-imports only `#plate/model/expression.ts`, so the registry in
 * `#plate/model/expressions/read.ts` may import it without a cycle.
 *
 * @module
 */
import { acceptsAnyOperands, singleOf, unlandedRule } from "#plate/model/expression.ts";
import type { FamilyRules, KindRule } from "#plate/model/expression.ts";

/**
 * The rule of `qti-is-null`: a single boolean, of an operand of any type.
 *
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#OpIsNull
 */
const isNullRule: KindRule = {
  operandsAccept: acceptsAnyOperands,
  references: [],
  resultType: () => singleOf("boolean"),
};

/**
 * The containers family's kind rules by kind: M1's `is-null`, and the unlanded rule for each kind
 * the family has not landed.
 */
export const containersRules: FamilyRules<
  | "container-size"
  | "contains"
  | "delete"
  | "field-value"
  | "index"
  | "is-null"
  | "member"
  | "multiple"
  | "ordered"
  | "random"
  | "repeat"
> = {
  "container-size": unlandedRule,
  contains: unlandedRule,
  delete: unlandedRule,
  "field-value": unlandedRule,
  index: unlandedRule,
  "is-null": isNullRule,
  member: unlandedRule,
  multiple: unlandedRule,
  ordered: unlandedRule,
  random: unlandedRule,
  repeat: unlandedRule,
};

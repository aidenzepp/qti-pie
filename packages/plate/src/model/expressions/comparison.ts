/**
 * The comparison family of the item model: the kind rules of `qti-match` and `qti-equal`, and the
 * unlanded rule of each kind the family has not landed (`qti-gt`, `qti-gte`, `qti-lt`, `qti-lte`,
 * `qti-duration-lt` and `qti-duration-gte`), which its slice (`p7-03`) replaces.
 *
 * It value-imports only `#plate/model/expression.ts`, so the registry in
 * `#plate/model/expressions/read.ts` may import it without a cycle.
 *
 * @module
 */
import {
  acceptsAnyOperands,
  everyOperand,
  singleOf,
  unlandedRule,
} from "#plate/model/expression.ts";
import type { FamilyRules, KindRule } from "#plate/model/expression.ts";

/**
 * The rule of `qti-match`: a single boolean. It judges no operand yet: the qti package's rule, two
 * operands of one type and no duration, lands with the family's slice (`p7-03`), so the model
 * refuses nothing new before then.
 *
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#OpMatch
 */
const matchRule: KindRule = {
  operandsAccept: acceptsAnyOperands,
  references: [],
  resultType: () => singleOf("boolean"),
};

/**
 * The rule of `qti-equal`: a single boolean, of "two sub-expressions which must both have single
 * cardinality and have a numerical base-type" (`info-compact.txt:11415`). Numerical is integer or
 * float, never duration, as the qti package reads it, so each operand of another type is a
 * mismatch that accepts `integer` and `float`, `single`.
 *
 * Its `tolerance` may name a variable, but a reference there is not checked and the facet entry
 * arrives with the family's slice (`p7-03`), when the modes that read it run.
 *
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#OpEqual
 */
const equalRule: KindRule = {
  operandsAccept: everyOperand(["integer", "float"], ["single"]),
  references: [],
  resultType: () => singleOf("boolean"),
};

/**
 * The comparison family's kind rules by kind: M1's `match` and `equal`, and the unlanded rule for
 * each kind the family has not landed.
 */
export const comparisonRules: FamilyRules<
  "duration-gte" | "duration-lt" | "equal" | "gt" | "gte" | "lt" | "lte" | "match"
> = {
  "duration-gte": unlandedRule,
  "duration-lt": unlandedRule,
  equal: equalRule,
  gt: unlandedRule,
  gte: unlandedRule,
  lt: unlandedRule,
  lte: unlandedRule,
  match: matchRule,
};

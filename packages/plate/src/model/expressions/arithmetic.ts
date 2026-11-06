/**
 * The arithmetic family of the item model: the kind rules and reader specs of `qti-sum`,
 * `qti-product`, `qti-subtract`, `qti-divide`, `qti-min` and `qti-max`. The family has landed no
 * kind yet, so each kind has the unlanded rule and the stub reader spec; its slice (`p7-04`)
 * replaces each with the kind's rule and reader spec.
 *
 * It value-imports only `#plate/model/expression.ts`, and names the registry's reader types with
 * `import type` only, so the registry in `#plate/model/expressions/read.ts` may import it without a
 * cycle.
 *
 * @module
 */
import { unlandedRule } from "#plate/model/expression.ts";
import type { FamilyRules } from "#plate/model/expression.ts";
import type { FamilyReaders, UnlandedReader } from "#plate/model/expressions/read.ts";

/**
 * The arithmetic family's kind rules by kind: the unlanded rule for each.
 */
export const arithmeticRules: FamilyRules<
  "divide" | "max" | "min" | "product" | "subtract" | "sum"
> = {
  divide: unlandedRule,
  max: unlandedRule,
  min: unlandedRule,
  product: unlandedRule,
  subtract: unlandedRule,
  sum: unlandedRule,
};

/**
 * The reader spec of each kind the family has not landed: the stub, which marks the kind's element
 * at its path and reads nothing in it.
 */
const unlanded: UnlandedReader = { _tag: "unlanded" };

/**
 * The arithmetic family's reader specs by kind: the stub for each.
 */
export const arithmeticReaders: FamilyReaders<
  "divide" | "max" | "min" | "product" | "subtract" | "sum"
> = {
  divide: unlanded,
  max: unlanded,
  min: unlanded,
  product: unlanded,
  subtract: unlanded,
  sum: unlanded,
};

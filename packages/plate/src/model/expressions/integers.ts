/**
 * The integers family of the item model: the kind rules and reader specs of `qti-integer-divide`,
 * `qti-integer-modulus`, `qti-integer-to-float`, `qti-gcd` and `qti-lcm`. The family has landed no
 * kind yet, so each kind has the unlanded rule and the stub reader spec; its slice (`p7-05`)
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
 * The integers family's kind rules by kind: the unlanded rule for each.
 */
export const integersRules: FamilyRules<
  "gcd" | "integer-divide" | "integer-modulus" | "integer-to-float" | "lcm"
> = {
  gcd: unlandedRule,
  "integer-divide": unlandedRule,
  "integer-modulus": unlandedRule,
  "integer-to-float": unlandedRule,
  lcm: unlandedRule,
};

/**
 * The reader spec of each kind the family has not landed: the stub, which marks the kind's element
 * at its path and reads nothing in it.
 */
const unlanded: UnlandedReader = { _tag: "unlanded" };

/**
 * The integers family's reader specs by kind: the stub for each.
 */
export const integersReaders: FamilyReaders<
  "gcd" | "integer-divide" | "integer-modulus" | "integer-to-float" | "lcm"
> = {
  gcd: unlanded,
  "integer-divide": unlanded,
  "integer-modulus": unlanded,
  "integer-to-float": unlanded,
  lcm: unlanded,
};

/**
 * The functions family of the item model: the kind rules and reader specs of `qti-math-operator`,
 * `qti-math-constant`, `qti-stats-operator` and `qti-power`. The family has landed no kind yet, so
 * each kind has the unlanded rule and the stub reader spec; its slice (`p7-07`) replaces each with
 * the kind's rule and reader spec.
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
 * The functions family's kind rules by kind: the unlanded rule for each.
 */
export const functionsRules: FamilyRules<
  "math-constant" | "math-operator" | "power" | "stats-operator"
> = {
  "math-constant": unlandedRule,
  "math-operator": unlandedRule,
  power: unlandedRule,
  "stats-operator": unlandedRule,
};

/**
 * The reader spec of each kind the family has not landed: the stub, which marks the kind's element
 * at its path and reads nothing in it.
 */
const unlanded: UnlandedReader = { _tag: "unlanded" };

/**
 * The functions family's reader specs by kind: the stub for each.
 */
export const functionsReaders: FamilyReaders<
  "math-constant" | "math-operator" | "power" | "stats-operator"
> = {
  "math-constant": unlanded,
  "math-operator": unlanded,
  power: unlanded,
  "stats-operator": unlanded,
};

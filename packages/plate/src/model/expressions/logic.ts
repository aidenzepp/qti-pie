/**
 * The logic family of the item model: the kind rules and reader specs of `qti-and`, `qti-or`,
 * `qti-not` and `qti-any-n`. The family has landed no kind yet, so each kind has the unlanded rule
 * and the stub reader spec; its slice (`p7-02`) replaces each with the kind's rule and reader spec.
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
 * The logic family's kind rules by kind: the unlanded rule for each.
 */
export const logicRules: FamilyRules<"and" | "any-n" | "not" | "or"> = {
  and: unlandedRule,
  "any-n": unlandedRule,
  not: unlandedRule,
  or: unlandedRule,
};

/**
 * The reader spec of each kind the family has not landed: the stub, which marks the kind's element
 * at its path and reads nothing in it.
 */
const unlanded: UnlandedReader = { _tag: "unlanded" };

/**
 * The logic family's reader specs by kind: the stub for each.
 */
export const logicReaders: FamilyReaders<"and" | "any-n" | "not" | "or"> = {
  and: unlanded,
  "any-n": unlanded,
  not: unlanded,
  or: unlanded,
};

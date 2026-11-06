/**
 * The text family of the item model: the kind rules and reader specs of `qti-string-match`,
 * `qti-substring`, `qti-pattern-match`, `qti-inside` and `qti-custom-operator`. The family has
 * landed no kind yet, so each kind has the unlanded rule and the stub reader spec; its slice
 * (`p7-09`) replaces each with the kind's rule and reader spec.
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
 * The text family's kind rules by kind: the unlanded rule for each.
 */
export const textRules: FamilyRules<
  "custom-operator" | "inside" | "pattern-match" | "string-match" | "substring"
> = {
  "custom-operator": unlandedRule,
  inside: unlandedRule,
  "pattern-match": unlandedRule,
  "string-match": unlandedRule,
  substring: unlandedRule,
};

/**
 * The reader spec of each kind the family has not landed: the stub, which marks the kind's element
 * at its path and reads nothing in it.
 */
const unlanded: UnlandedReader = { _tag: "unlanded" };

/**
 * The text family's reader specs by kind: the stub for each.
 */
export const textReaders: FamilyReaders<
  "custom-operator" | "inside" | "pattern-match" | "string-match" | "substring"
> = {
  "custom-operator": unlanded,
  inside: unlanded,
  "pattern-match": unlanded,
  "string-match": unlanded,
  substring: unlanded,
};

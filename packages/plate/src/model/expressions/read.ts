/**
 * The registry of the item model's expressions: every kind's rule, by kind, from the ten families
 * under `#plate/model/expressions/`.
 *
 * The model, the validator and the engine read a kind through its entry here in place of a case
 * per kind, so a family lands a kind by replacing its entries in its own files. It value-imports
 * the ten families, which import only `#plate/model/expression.ts`, so the value imports point one
 * way: from the item model and the validator to here, and from here to the families.
 *
 * @module
 */
import type { ExpressionKind, FamilyRules } from "#plate/model/expression.ts";
import { arithmeticRules } from "#plate/model/expressions/arithmetic.ts";
import { comparisonRules } from "#plate/model/expressions/comparison.ts";
import { containersRules } from "#plate/model/expressions/containers.ts";
import { functionsRules } from "#plate/model/expressions/functions.ts";
import { integersRules } from "#plate/model/expressions/integers.ts";
import { logicRules } from "#plate/model/expressions/logic.ts";
import { referencesRules } from "#plate/model/expressions/references.ts";
import { roundingRules } from "#plate/model/expressions/rounding.ts";
import { testRules } from "#plate/model/expressions/test.ts";
import { textRules } from "#plate/model/expressions/text.ts";

/**
 * Every kind's rule: the ten families' tables in one, keyed by {@link ExpressionKind}. Its type
 * requires an entry for each of the 64 kinds, so a kind no family holds fails the type check.
 */
export const kindRules: FamilyRules<ExpressionKind> = {
  ...arithmeticRules,
  ...comparisonRules,
  ...containersRules,
  ...functionsRules,
  ...integersRules,
  ...logicRules,
  ...referencesRules,
  ...roundingRules,
  ...testRules,
  ...textRules,
};

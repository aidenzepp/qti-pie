/**
 * The containers family of the item model: the kind rule and reader spec of `qti-is-null`, and the
 * unlanded rule and stub reader spec of each kind the family has not landed (`qti-multiple`,
 * `qti-ordered`, `qti-repeat`, `qti-container-size`, `qti-index`, `qti-member`, `qti-delete`,
 * `qti-contains`, `qti-random` and `qti-field-value`), which its slice (`p7-08`) and later ones
 * replace.
 *
 * It value-imports only `effect` and `#plate/model/expression.ts`, and names the registry's reader
 * types with `import type` only, so the registry in `#plate/model/expressions/read.ts` may import
 * it without a cycle.
 *
 * @module
 */
import { Effect } from "effect";
import { acceptsAnyOperands, singleOf, unlandedRule } from "#plate/model/expression.ts";
import type { FamilyRules, KindRule } from "#plate/model/expression.ts";
import type { FamilyReaders, ReaderSpec, UnlandedReader } from "#plate/model/expressions/read.ts";

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

/**
 * The reader spec of `qti-is-null`: its one operand, and no attribute.
 */
const isNullReader: ReaderSpec<"is-null"> = {
  _tag: "generic",
  arity: "one",
  attributes: () => Effect.succeed((operands) => ({ kind: "is-null", operands })),
};

/**
 * The reader spec of each kind the family has not landed: the stub, which marks the kind's element
 * at its path and reads nothing in it.
 */
const unlanded: UnlandedReader = { _tag: "unlanded" };

/**
 * The containers family's reader specs by kind: M1's `is-null`, and the stub for each kind the
 * family has not landed.
 */
export const containersReaders: FamilyReaders<
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
  "container-size": unlanded,
  contains: unlanded,
  delete: unlanded,
  "field-value": unlanded,
  index: unlanded,
  "is-null": isNullReader,
  member: unlanded,
  multiple: unlanded,
  ordered: unlanded,
  random: unlanded,
  repeat: unlanded,
};

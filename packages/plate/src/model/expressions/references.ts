/**
 * The references family of the item model: the kind rules and reader specs of `qti-variable`,
 * `qti-correct`, `qti-base-value`, `qti-map-response`, `qti-map-response-point`, `qti-default` and
 * `qti-null`, and the unlanded rule and stub reader spec of the two kinds the family has not landed
 * (`qti-random-integer` and `qti-random-float`), which M3.b-2 replaces.
 *
 * It value-imports only `effect`, `#plate/model/expression.ts`, the leaf
 * `#plate/model/attributes.ts`, `#plate/model/values.ts` and `#plate/vocabulary.ts`, and names the
 * registry's reader types with `import type` only, so the registry in
 * `#plate/model/expressions/read.ts` may import it without a cycle.
 *
 * @module
 */
import { Effect, Option } from "effect";
import {
  enumerated,
  identifierAttribute,
  identifierOf,
  pathOf,
  refusal,
  textOf,
  typed,
  valueOf,
} from "#plate/model/attributes.ts";
import { acceptsAnyOperands, singleOf, unlandedRule } from "#plate/model/expression.ts";
import type { FamilyRules, KindRule } from "#plate/model/expression.ts";
import type { FamilyReaders, ReaderSpec, UnlandedReader } from "#plate/model/expressions/read.ts";
import { isModelled, parseElementText } from "#plate/model/values.ts";
import { baseTypes } from "#plate/vocabulary.ts";

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
 * The rule of `qti-default`: the type of the variable it names, a response, an outcome, a template
 * or context variable, or a built-in, whose declared default value it reads. The declaration facet
 * types it as that declaration and has the validator refuse a name no variable has (P8) and the
 * walks mark one the engine does not hold, as for `qti-variable`.
 *
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#ExpDefault
 */
const defaultRule: KindRule = {
  declaration: { attribute: "identifier", expected: "variable" },
  operandsAccept: acceptsAnyOperands,
  references: [],
  resultType: declared,
};

/**
 * The rule of `qti-null`: a NULL "treated as if it is of any desired base-type", so any base type
 * of a cardinality unknown, which every operand rule and every check of a type accepts. The qti
 * package types it the same (`resultTypes` in `packages/pantry/src/processing/types.ts`).
 *
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#AbstractAttribute_ExpressionGroup_qti-null
 */
const nullRule: KindRule = {
  operandsAccept: acceptsAnyOperands,
  references: [],
  resultType: () => ({ baseType: "any", cardinality: "unknown" }),
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
 * The references family's kind rules by kind: the rule of each of its seven landed kinds, and the
 * unlanded rule for each kind the family has not landed.
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
  default: defaultRule,
  "map-response": mapResponseRule,
  "map-response-point": mapResponsePointRule,
  null: nullRule,
  "random-float": unlandedRule,
  "random-integer": unlandedRule,
  variable: variableRule,
};

/**
 * The reader spec of `qti-variable`: no operand, its `identifier`, and its optional
 * `weight-identifier`, which is held and which an item's processing never evaluates.
 */
const variableReader: ReaderSpec<"variable"> = {
  _tag: "generic",
  arity: "none",
  attributes: (context, element) =>
    Effect.map(
      identifierAttribute(context.walk, element, "identifier"),
      (identifier) => (operands) => ({
        identifier,
        kind: "variable",
        operands,
        weightIdentifier: Option.map(valueOf(element, "weight-identifier"), identifierOf),
      }),
    ),
};

/**
 * The reader spec of `qti-correct`: no operand, and its `identifier`.
 */
const correctReader: ReaderSpec<"correct"> = {
  _tag: "generic",
  arity: "none",
  attributes: (context, element) =>
    Effect.map(
      identifierAttribute(context.walk, element, "identifier"),
      (identifier) => (operands) => ({ identifier, kind: "correct", operands }),
    ),
};

/**
 * The reader spec of `qti-map-response`: no operand, and its `identifier`.
 */
const mapResponseReader: ReaderSpec<"map-response"> = {
  _tag: "generic",
  arity: "none",
  attributes: (context, element) =>
    Effect.map(
      identifierAttribute(context.walk, element, "identifier"),
      (identifier) => (operands) => ({ identifier, kind: "map-response", operands }),
    ),
};

/**
 * The reader spec of `qti-map-response-point`: no operand, and its `identifier`.
 */
const mapResponsePointReader: ReaderSpec<"map-response-point"> = {
  _tag: "generic",
  arity: "none",
  attributes: (context, element) =>
    Effect.map(
      identifierAttribute(context.walk, element, "identifier"),
      (identifier) => (operands) => ({ identifier, kind: "map-response-point", operands }),
    ),
};

/**
 * The reader spec of `qti-default`: no operand, and its `identifier`.
 */
const defaultReader: ReaderSpec<"default"> = {
  _tag: "generic",
  arity: "none",
  attributes: (context, element) =>
    Effect.map(
      identifierAttribute(context.walk, element, "identifier"),
      (identifier) => (operands) => ({ identifier, kind: "default", operands }),
    ),
};

/**
 * The reader spec of `qti-null`: no operand, and no attribute.
 */
const nullReader: ReaderSpec<"null"> = {
  _tag: "generic",
  arity: "none",
  attributes: () => Effect.succeed((operands) => ({ kind: "null", operands })),
};

/**
 * The reader spec of `qti-base-value`: its `base-type` and its text, typed as that base type. A
 * base type the value model does not hold, `duration` or `file`, is the mark
 * `base-type="<type>"` at its path, and builds nothing.
 *
 * Its read fails with `value-type` for text outside the base type's lexical space, at the
 * element's path. A document the validator refuses first can also fail it with
 * `missing-attribute` for an absent `base-type` and `attribute-type` for one outside its values.
 */
const baseValueReader: ReaderSpec<"base-value"> = {
  _tag: "custom",
  read: (context, element) =>
    Effect.gen(function* readBaseValue() {
      const baseType = yield* enumerated(context.walk, element, "base-type", baseTypes);
      if (Option.isNone(baseType)) {
        return yield* Effect.fail(
          refusal(context.walk, "missing-attribute", pathOf(context.walk, element), {
            attribute: "base-type",
            element: element.local,
          }),
        );
      }

      if (!isModelled(baseType.value)) {
        return yield* context.unread(element, `base-type="${baseType.value}"`);
      }

      const single = yield* typed(
        context.walk,
        pathOf(context.walk, element),
        parseElementText(baseType.value, textOf(element)),
      );

      return Option.some({
        kind: "base-value",
        operands: [],
        value: {
          baseType: baseType.value,
          cardinality: "single",
          values: Option.toArray(single),
        },
      });
    }),
};

/**
 * The reader spec of each kind the family has not landed: the stub, which marks the kind's element
 * at its path and reads nothing in it.
 */
const unlanded: UnlandedReader = { _tag: "unlanded" };

/**
 * The references family's reader specs by kind: the spec of each of its seven landed kinds, and
 * the stub for each kind the family has not landed.
 */
export const referencesReaders: FamilyReaders<
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
  "base-value": baseValueReader,
  correct: correctReader,
  default: defaultReader,
  "map-response": mapResponseReader,
  "map-response-point": mapResponsePointReader,
  null: nullReader,
  "random-float": unlanded,
  "random-integer": unlanded,
  variable: variableReader,
};

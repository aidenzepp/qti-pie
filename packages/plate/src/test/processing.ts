/**
 * Test support for response processing: the one builder of the evaluator's {@link Scope}, an
 * evaluator a test passes as an expression's `evaluate`, the operand that gives a value as written
 * ({@link operandOf}), the hand-built item documents the expression families' tests share, with
 * their model build, their run and their refusals, and the type invariant every family's tests
 * keep ({@link assertKindType}).
 *
 * A family test builds a `Scope` only through {@link scopeOf}, never as a literal, so a field the
 * engine adds to it changes this file alone. It is not a browser module: it reads the item model
 * and the validator, which import Effect.
 *
 * @module
 */
import { assert } from "@effect/vitest";
import { Effect, Option } from "effect";
import { attr, doc, el, text } from "#plate/document/source.ts";
import type { SourceAttribute, SourceDocument, SourceElement } from "#plate/document/source.ts";
import { evaluateExpression, runRules } from "#plate/engine/evaluate.ts";
import type { EngineFailure, Evaluate, Scope, Variables } from "#plate/engine/evaluate.ts";
import { drawStream } from "#plate/engine/random.ts";
import type { Draw } from "#plate/engine/random.ts";
import type {
  Expression,
  ExpressionKind,
  ExpressionType,
  ResultAttributes,
} from "#plate/model/expression.ts";
import { kindRules } from "#plate/model/expressions/read.ts";
import type { Item } from "#plate/model/item.ts";
import { buildItem } from "#plate/model/item.ts";
import { outcomeDefaults } from "#plate/model/record.ts";
import type { Value } from "#plate/model/values.ts";
import { checkRules } from "#plate/validate/rules.ts";
import type { Refusal } from "#plate/validate/refusal.ts";
import { tables } from "#plate/validate/tables.ts";

/**
 * The location every item document built here carries.
 */
export const processingLocation = "items/processing.xml";

/**
 * Construct the evaluator's context for an item, the variables of an attempt and a stream.
 *
 * @param item The item, whose declarations the evaluators read.
 * @param variables The variables of the attempt.
 * @param draw The stream its random kinds draw from; `drawStream("test")`, fresh, when none is
 *   given.
 * @returns The scope.
 */
export const scopeOf = (item: Item, variables: Variables, draw?: Draw): Scope => ({
  draw: draw ?? drawStream("test"),
  item,
  variables,
});

/**
 * Give the value of an expression in a scope through the engine's dispatcher, as the `evaluate` an
 * evaluator receives does, so a test may call a family's evaluator directly.
 *
 * @param expression The expression.
 * @param scope The item and the variables of the attempt.
 * @returns The expression's value, or the first failure of its evaluation.
 */
export const evaluateIn: Evaluate = (expression, scope) =>
  evaluateExpression(expression, scope.item, scope.variables, scope.draw);

/**
 * Construct the `qti-base-value` operand that gives a value, so a family test passes any value,
 * NULL included, to the evaluator it calls.
 *
 * @param value The value.
 * @returns The operand.
 */
export const operandOf = (value: Value): Expression => ({
  kind: "base-value",
  operands: [],
  value,
});

/**
 * Construct a response declaration.
 *
 * @param identifier Its `identifier`.
 * @param baseType Its `base-type`, as written, so a test may declare one the value model does not
 *   hold.
 * @param cardinality Its `cardinality`, as written: `single` unless another is given.
 * @param children Its children, such as a `qti-correct-response` or a `qti-mapping`.
 * @returns The `qti-response-declaration`.
 */
export const responseDeclaration = (
  identifier: string,
  baseType: string,
  cardinality = "single",
  children: readonly SourceElement[] = [],
): SourceElement =>
  el(
    "qti-response-declaration",
    [attr("base-type", baseType), attr("cardinality", cardinality), attr("identifier", identifier)],
    children,
  );

/**
 * Construct an outcome declaration.
 *
 * @param identifier Its `identifier`.
 * @param baseType Its `base-type`, as written, so a test may declare one the value model does not
 *   hold.
 * @param cardinality Its `cardinality`, as written: `single` unless another is given.
 * @param children Its children, such as a `qti-default-value`.
 * @returns The `qti-outcome-declaration`.
 */
export const outcomeDeclaration = (
  identifier: string,
  baseType: string,
  cardinality = "single",
  children: readonly SourceElement[] = [],
): SourceElement =>
  el(
    "qti-outcome-declaration",
    [attr("base-type", baseType), attr("cardinality", cardinality), attr("identifier", identifier)],
    children,
  );

/**
 * Construct an expression element of a kind: `qti-<kind>` with its attributes and operands.
 *
 * @param kind The expression's kind.
 * @param attributes Its attributes.
 * @param operands Its operand expressions, in order.
 * @returns The element.
 */
export const expressionElement = (
  kind: ExpressionKind,
  attributes: readonly SourceAttribute[] = [],
  operands: readonly SourceElement[] = [],
): SourceElement => el(`qti-${kind}`, attributes, operands);

/**
 * Construct a `qti-base-value`.
 *
 * @param baseType Its `base-type`, as written.
 * @param written Its value as written.
 * @returns The element.
 */
export const baseValueElement = (baseType: string, written: string): SourceElement =>
  el("qti-base-value", [attr("base-type", baseType)], [text(written)]);

/**
 * Construct a `qti-variable`.
 *
 * @param identifier The variable it reads.
 * @returns The element.
 */
export const variableElement = (identifier: string): SourceElement =>
  el("qti-variable", [attr("identifier", identifier)]);

/**
 * Construct a `qti-set-outcome-value`.
 *
 * @param identifier The outcome it sets.
 * @param expression The expression whose value it sets.
 * @returns The rule.
 */
export const setOutcomeElement = (identifier: string, expression: SourceElement): SourceElement =>
  el("qti-set-outcome-value", [attr("identifier", identifier)], [expression]);

/**
 * Construct an item document with declarations and inline response processing, at
 * {@link processingLocation}, its body empty.
 *
 * @param declarations Its response and outcome declarations, in document order.
 * @param rules The rules of its `qti-response-processing`, in order.
 * @returns The item as a source document.
 */
export const processingItem = (
  declarations: readonly SourceElement[],
  rules: readonly SourceElement[],
): SourceDocument =>
  doc(
    processingLocation,
    el(
      "qti-assessment-item",
      [
        attr("identifier", "processing"),
        attr("time-dependent", "false"),
        attr("title", "Processing"),
      ],
      [...declarations, el("qti-item-body"), el("qti-response-processing", [], rules)],
    ),
  );

/**
 * Build an item document's model and run its response processing over the given responses, as one
 * attempt does: the outcomes start at their defaults and `numAttempts` is 1.
 *
 * @param document The item document.
 * @param responses The responses, by identifier, each a value of its declaration's type.
 * @returns The variables after the rules run, or none when the model holds no processing, as for an
 *   item whose processing it marks; or the model's refusal, or the engine's first failure.
 */
export const processed = (
  document: SourceDocument,
  responses: Variables["responses"],
): Effect.Effect<Option.Option<Variables>, EngineFailure | Refusal> =>
  Effect.gen(function* runProcessing() {
    const item = yield* buildItem(document);
    if (Option.isNone(item.processing)) {
      return Option.none();
    }

    const before: Variables = { numAttempts: 1n, outcomes: outcomeDefaults(item), responses };
    const after = yield* Effect.fromResult(runRules(item.processing.value, item, before));

    return Option.some(after);
  });

/**
 * Check an item document's rules and reduce each refusal to what a test asserts.
 *
 * @param document The item document.
 * @returns One entry per refusal, in the order `checkRules` gives them: its rule, its path (or its
 *   location's kind when it has none) and its detail.
 */
export const refusalsOf = (
  document: SourceDocument,
): readonly {
  readonly detail: Refusal["detail"];
  readonly path: string;
  readonly rule: Refusal["rule"];
}[] =>
  checkRules(document, tables).map((refusal) => ({
    detail: refusal.detail,
    path: refusal.location.kind === "path" ? refusal.location.path : refusal.location.kind,
    rule: refusal.rule,
  }));

/**
 * Assert the type invariant of an expression family: a value an expression gave has the type its
 * kind's rule gives (`kindRules` in `#plate/model/expressions/read.ts`), its base type and its
 * cardinality those of `resultType` over the operands' types and the attributes. So the model's
 * typing and the evaluators cannot drift apart. A NULL keeps the type of the expression that gave
 * it, so it is held to the same type. A base type of `any` or `unknown`, or a cardinality of
 * `unknown`, says nothing, so any value's holds it.
 *
 * @param value The value the expression gave.
 * @param kind The expression's kind.
 * @param operands The types of its operands, in order.
 * @param attributes Its result attributes, as the caller of `resultType` fills them in: none
 *   unless given.
 */
export const assertKindType = (
  value: Value,
  kind: ExpressionKind,
  operands: readonly ExpressionType[],
  attributes: ResultAttributes = {},
): void => {
  const expected = kindRules[kind].resultType(operands, attributes);
  const given: ExpressionType = {
    baseType:
      expected.baseType === "any" || expected.baseType === "unknown"
        ? expected.baseType
        : value.baseType,
    cardinality: expected.cardinality === "unknown" ? expected.cardinality : value.cardinality,
  };

  assert.deepStrictEqual(given, expected, `qti-${kind} gave a value of another type than its rule`);
};

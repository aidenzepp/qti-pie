/**
 * The containers family of the engine: the evaluators of `qti-is-null`, `qti-multiple`,
 * `qti-ordered`, `qti-repeat`, `qti-container-size`, `qti-index`, `qti-member`, `qti-delete` and
 * `qti-contains`, and the stub markers of `qti-random` and `qti-field-value`.
 *
 * A container's values are compared one single at a time as `qti-match` compares two single
 * values (`match` in `#plate/model/values.ts`): of one base type, a `pair` in either order. A
 * container emptied or built of nothing is NULL, since NULL is a value with no values at any
 * cardinality.
 *
 * A container `qti-multiple`, `qti-ordered` or `qti-repeat` builds is held to `containerSizeBound`
 * (`#plate/engine/numbers.ts`, the principle of the operator's ruling `afb7e648`): one of more than
 * 1,000,000 values is the NULL of its base type and cardinality, found before it is built, so a
 * `number-repeats` of 2147483647 cannot hang scoring. The other kinds build no container larger
 * than an operand, and no container as written or stored is held to the bound.
 *
 * It value-imports only engine leaves, `#plate/model/values.ts` and `effect`'s `Option` and
 * `Result`, and reads the evaluator's types from `#plate/engine/evaluate.ts` as types, so the
 * dispatcher's table may import it without a cycle.
 *
 * @module
 */
import { Option, Result } from "effect";
import type { Evaluate, Evaluator, FamilyTable, Scope } from "#plate/engine/evaluate.ts";
import type { EngineFailure } from "#plate/engine/failures.ts";
import { booleanOf, integerValue, withinContainerBound } from "#plate/engine/numbers.ts";
import { referenceInteger } from "#plate/engine/refs.ts";
import type { Expression } from "#plate/model/expression.ts";
import { isNull, match, nullOf } from "#plate/model/values.ts";
import type { ModelledBaseType, Single, Value } from "#plate/model/values.ts";

/**
 * Give the value of a `qti-is-null`: a single boolean, whether the operand is NULL.
 *
 * @param expression The `qti-is-null`.
 * @param scope The item and the variables of the attempt.
 * @param evaluate The evaluator, which gives the operand's value.
 * @returns The single boolean, or the operand's failure.
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#OpIsNull
 */
const evaluateIsNull: Evaluator<"is-null"> = (expression, scope, evaluate) => {
  const [operand] = expression.operands;

  return Result.map(evaluate(operand, scope), (value) => booleanOf(isNull(value)));
};

/**
 * Evaluate every operand, left to right; the first failure is the result.
 *
 * @param operands The operands.
 * @param scope The item and the variables of the attempt.
 * @param evaluate The evaluator, which gives each operand's value.
 * @returns The operands' values in order, or the first operand's failure.
 */
const valuesOf = (
  operands: readonly Expression[],
  scope: Scope,
  evaluate: Evaluate,
): Result.Result<Value[], EngineFailure> =>
  Result.all(operands.map((operand) => evaluate(operand, scope)));

/**
 * Give the base type of a container built from values: the first value's that is not NULL, else
 * the first value's, since a NULL keeps the type of the expression that gave it. A container of no
 * operand has no base type to keep; its rule types it `any`, and its NULL is a string's, as
 * `qti-custom-operator`'s untyped NULL is.
 *
 * @param values The values, in order.
 * @returns The base type.
 */
const baseOf = (values: readonly Value[]): ModelledBaseType =>
  (values.find((value) => !isNull(value)) ?? values[0])?.baseType ?? "string";

/**
 * Give how many values some values hold together: one for a single value, each value of a
 * container, and none for a NULL.
 *
 * @param values The values.
 * @returns Their count.
 */
const sizeOf = (values: readonly Value[]): number => {
  let size = 0;
  for (const value of values) {
    size += value.values.length;
  }

  return size;
};

/**
 * Add the values' values to a container's, in order, one at a time, never as `push(...values)`,
 * whose spread throws a `RangeError` for a large container even within the bound.
 *
 * @param held The container's values so far, which it extends.
 * @param values The values to add, in order.
 */
const appendTo = (held: Single[], values: readonly Value[]): void => {
  for (const value of values) {
    for (const single of value.values) {
      held.push(single);
    }
  }
};

/**
 * Give the container of a cardinality that holds the values' values in order: a single value adds
 * itself, a container adds each of its values, and a NULL adds nothing, so the container is NULL
 * when every value is or there is none. One that would hold more than 1,000,000 values is NULL,
 * found from the values' sizes before it is built.
 *
 * @param cardinality The container's cardinality.
 * @param values The values, in order.
 * @returns The container, of the values' base type ({@link baseOf}).
 */
const containerOf = (cardinality: "multiple" | "ordered", values: readonly Value[]): Value => {
  if (!withinContainerBound(BigInt(sizeOf(values)))) {
    return nullOf(baseOf(values), cardinality);
  }

  const held: Single[] = [];
  appendTo(held, values);

  return { baseType: baseOf(values), cardinality, values: held };
};

/**
 * Construct the single value that holds one single.
 *
 * @param single The single.
 * @returns The value, of the single's base type.
 */
const singleValueOf = (single: Single): Value => ({
  baseType: single.baseType,
  cardinality: "single",
  values: [single],
});

/**
 * Report whether two singles are the same value, as `qti-match` compares two single values: of one
 * base type and equal, a `pair` in either order.
 *
 * @param left One single.
 * @param right The other single.
 * @returns Whether they are the same value.
 */
const same = (left: Single, right: Single): boolean =>
  match(singleValueOf(left), singleValueOf(right));

/**
 * Give the value of a `qti-multiple`: a multiple container of its operands' values, a multiple
 * operand's added one by one and a NULL one ignored; NULL when there is no operand or every one is
 * NULL, and when it would hold more than 1,000,000 values. Applied to A, B and {C,D} it gives
 * {A,B,C,D}.
 *
 * @param expression The `qti-multiple`.
 * @param scope The item and the variables of the attempt.
 * @param evaluate The evaluator, which gives each operand's value.
 * @returns The container, or the first operand's failure.
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#OpMultiple
 */
const evaluateMultiple: Evaluator<"multiple"> = (expression, scope, evaluate) =>
  Result.map(valuesOf(expression.operands, scope, evaluate), (values) =>
    containerOf("multiple", values),
  );

/**
 * Give the value of a `qti-ordered`: an ordered container of its operands' values, an ordered
 * operand's added in order and a NULL one ignored; NULL when there is no operand or every one is
 * NULL, so it never gives an empty container, and when it would hold more than 1,000,000 values.
 *
 * @param expression The `qti-ordered`.
 * @param scope The item and the variables of the attempt.
 * @param evaluate The evaluator, which gives each operand's value.
 * @returns The container, or the first operand's failure.
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#OpOrdered
 */
const evaluateOrdered: Evaluator<"ordered"> = (expression, scope, evaluate) =>
  Result.map(valuesOf(expression.operands, scope, evaluate), (values) =>
    containerOf("ordered", values),
  );

/**
 * Give the value of a `qti-repeat`: an ordered container filled by evaluating each operand in turn
 * and adding its values, a NULL one ignored, `number-repeats` times in all; NULL when every operand
 * is NULL, when `number-repeats` is below 1 or names a variable that holds NULL, and when the
 * container would hold more than 1,000,000 values.
 *
 * `number-repeats` is resolved first, then the operands are evaluated once, left to right; the
 * first failure is the result. That pass runs even when `number-repeats` is below 1, so the NULL
 * keeps the operands' base type. Its values are then added `number-repeats` times, one at a time.
 *
 * Evaluating once is exact only while no operand kind is random: an operand's value depends only on
 * the scope, which a pass does not change, so every pass would give the first pass's values.
 * `qti-random`, `qti-random-integer` and `qti-random-float` are unlanded, so the reader marks any
 * processing that holds one. M3.b-2 (P7T-01), which lands them, must evaluate the operands once per
 * pass again, under a budget on the passes, for the information model fills the container pass by
 * pass. Until then one evaluation is what keeps a costly operand, such as a product of two
 * 500,000-bit integers, from being computed a million times, though the container stays within
 * the bound.
 *
 * The bound is checked before any value is added: the pass's size times `number-repeats` past the
 * bound gives NULL, and a pass that gives no value gives NULL at once, however many passes
 * `number-repeats` asks for, which keeps a nested `qti-repeat` of nothing from running a million
 * passes a million times. The running size is checked again before each pass is added. That
 * cannot fail while one pass's values are repeated; it is the check per-pass evaluation needs, for
 * a pass whose size is known only once it has run.
 *
 * @param expression The `qti-repeat`.
 * @param scope The item and the variables of the attempt.
 * @param evaluate The evaluator, which gives each operand's value.
 * @returns The container, or the first failure of `number-repeats` or an operand.
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#OpRepeat
 */
const evaluateRepeat: Evaluator<"repeat"> = (expression, scope, evaluate) =>
  Result.gen(function* repeatOperands() {
    const repeats = yield* referenceInteger(scope.variables, expression.numberRepeats);
    const pass = yield* valuesOf(expression.operands, scope, evaluate);
    const count = Option.getOrElse(repeats, () => 0n);
    const unset = nullOf(baseOf(pass), "ordered");
    const passSize = sizeOf(pass);
    if (count < 1n || passSize === 0 || !withinContainerBound(BigInt(passSize) * count)) {
      return unset;
    }

    const held: Single[] = [];
    for (let added = 0n; added < count; added += 1n) {
      if (!withinContainerBound(BigInt(held.length + passSize))) {
        return unset;
      }

      appendTo(held, pass);
    }

    return { baseType: baseOf(pass), cardinality: "ordered", values: held };
  });

/**
 * Give the value of a `qti-container-size`: a single integer, the number of values its operand
 * holds, repeats counted; 0 for NULL.
 *
 * @param expression The `qti-container-size`.
 * @param scope The item and the variables of the attempt.
 * @param evaluate The evaluator, which gives the operand's value.
 * @returns The single integer, or the operand's failure.
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#OpContainerSize
 */
const evaluateContainerSize: Evaluator<"container-size"> = (expression, scope, evaluate) => {
  const [operand] = expression.operands;

  return Result.map(evaluate(operand, scope), (value) => integerValue(BigInt(value.values.length)));
};

/**
 * Give the value of a `qti-index`: a single value of its operand's base type, the `n`th value of
 * the container, counting from 1; NULL when the operand is NULL, when `n` is below 1 or beyond the
 * container's size (9.20), and when `n` names a variable that holds NULL.
 *
 * `n` is resolved first, then the operand is evaluated; the first failure is the result.
 *
 * @param expression The `qti-index`.
 * @param scope The item and the variables of the attempt.
 * @param evaluate The evaluator, which gives the operand's value.
 * @returns The single value, or the first failure of `n` or the operand.
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#OpIndex
 */
const evaluateIndex: Evaluator<"index"> = (expression, scope, evaluate) =>
  Result.gen(function* pickIndex() {
    const n = yield* referenceInteger(scope.variables, expression.n);
    const [operand] = expression.operands;
    const container = yield* evaluate(operand, scope);
    const picked = n.pipe(
      Option.flatMap((position) =>
        position >= 1n && position <= BigInt(container.values.length)
          ? Option.fromUndefinedOr(container.values[Number(position) - 1])
          : Option.none(),
      ),
    );

    return Option.match(picked, {
      onNone: () => nullOf(container.baseType, "single"),
      onSome: (single): Value => ({
        baseType: container.baseType,
        cardinality: "single",
        values: [single],
      }),
    });
  });

/**
 * Evaluate the two operands of a kind that relates them, left to right; the first failure is the
 * result.
 *
 * @param operands The two operands.
 * @param scope The item and the variables of the attempt.
 * @param evaluate The evaluator, which gives each operand's value.
 * @returns The two values, or the first operand's failure.
 */
const pairOf = (
  [first, second]: readonly [Expression, Expression],
  scope: Scope,
  evaluate: Evaluate,
): Result.Result<readonly [Value, Value], EngineFailure> =>
  Result.all([evaluate(first, scope), evaluate(second, scope)] as const);

/**
 * Report whether a container holds a single value: whether one of its values matches it, as
 * `qti-match` compares two single values.
 *
 * @param container The container.
 * @param value The single value.
 * @returns Whether the container holds it; false when the value is not a single one.
 */
const holds = (container: Value, value: Value): boolean =>
  container.values.some((held) => match(value, singleValueOf(held)));

/**
 * Give the value of a `qti-member`: a single boolean, whether the container its second operand
 * gives holds the value its first gives; NULL when either is NULL.
 *
 * @param expression The `qti-member`.
 * @param scope The item and the variables of the attempt.
 * @param evaluate The evaluator, which gives each operand's value.
 * @returns The single boolean, or the first operand's failure.
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#OpMember
 */
const evaluateMember: Evaluator<"member"> = (expression, scope, evaluate) =>
  Result.map(pairOf(expression.operands, scope, evaluate), ([value, container]) =>
    isNull(value) || isNull(container)
      ? nullOf("boolean", "single")
      : booleanOf(holds(container, value)),
  );

/**
 * Give the value of a `qti-delete`: the container its second operand gives, of the same base type
 * and cardinality, with every value that matches the value its first gives removed, so applied to
 * A and {B,A,C,A} it gives {B,C}; NULL when either is NULL, and when no value is left.
 *
 * @param expression The `qti-delete`.
 * @param scope The item and the variables of the attempt.
 * @param evaluate The evaluator, which gives each operand's value.
 * @returns The container, or the first operand's failure.
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#OpDelete
 */
const evaluateDelete: Evaluator<"delete"> = (expression, scope, evaluate) =>
  Result.map(pairOf(expression.operands, scope, evaluate), ([value, container]): Value => ({
    baseType: container.baseType,
    cardinality: container.cardinality,
    values: isNull(value)
      ? []
      : container.values.filter((held) => !match(value, singleValueOf(held))),
  }));

/**
 * Report whether a container holds every value of another, repeats counted: each value of the part
 * pairs with its own matching value of the container, so {A,B,C} holds {C,A} and not {B,B}, and
 * {A,B,B,C} holds {B,B}.
 *
 * @param container The container's values.
 * @param part The other container's values.
 * @returns Whether the container holds them all.
 */
const holdsAll = (container: readonly Single[], part: readonly Single[]): boolean => {
  const unmatched = [...container];

  return part.every((single) => {
    const index = unmatched.findIndex((held) => same(single, held));
    if (index === -1) {
      return false;
    }

    unmatched.splice(index, 1);

    return true;
  });
};

/**
 * Report whether a sequence holds another as a contiguous run (9.16): the part's values, in order
 * and with nothing between them, start at some value of the sequence, so [A,B,C] holds [B,C] and
 * not [C,A] or [A,C].
 *
 * @param sequence The ordered container's values.
 * @param part The other container's values.
 * @returns Whether the sequence holds the run.
 */
const holdsRun = (sequence: readonly Single[], part: readonly Single[]): boolean =>
  sequence.some(
    (_, start) =>
      start + part.length <= sequence.length &&
      part.every((single, offset) => {
        const held = sequence[start + offset];

        return held !== undefined && same(single, held);
      }),
  );

/**
 * Give the value of a `qti-contains`: a single boolean, whether the container its first operand
 * gives contains the one its second gives; NULL when either is NULL. An ordered first operand
 * contains a contiguous run of its values ({@link holdsRun}); any other, its values without regard
 * to order, repeats counted ({@link holdsAll}).
 *
 * @param expression The `qti-contains`.
 * @param scope The item and the variables of the attempt.
 * @param evaluate The evaluator, which gives each operand's value.
 * @returns The single boolean, or the first operand's failure.
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#OpContains
 */
const evaluateContains: Evaluator<"contains"> = (expression, scope, evaluate) =>
  Result.map(pairOf(expression.operands, scope, evaluate), ([container, part]) => {
    if (isNull(container) || isNull(part)) {
      return nullOf("boolean", "single");
    }

    return booleanOf(
      container.cardinality === "ordered"
        ? holdsRun(container.values, part.values)
        : holdsAll(container.values, part.values),
    );
  });

/**
 * The containers family's evaluators by kind, and the stub marker for `random` and `field-value`
 * (ruling R2), which the dispatcher in `#plate/engine/evaluate.ts` never reaches on a checked item.
 */
export const containersEvaluators: FamilyTable<
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
  "container-size": evaluateContainerSize,
  contains: evaluateContains,
  delete: evaluateDelete,
  "field-value": "unlanded",
  index: evaluateIndex,
  "is-null": evaluateIsNull,
  member: evaluateMember,
  multiple: evaluateMultiple,
  ordered: evaluateOrdered,
  random: "unlanded",
  repeat: evaluateRepeat,
};

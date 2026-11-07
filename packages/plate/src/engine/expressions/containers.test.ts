import { assert, describe, it } from "@effect/vitest";
import { Result } from "effect";
import type { Evaluate, Variables } from "#plate/engine/evaluate.ts";
import { containersEvaluators } from "#plate/engine/expressions/containers.ts";
import type { Expression, ExpressionType, IntOrIdentifier } from "#plate/model/expression.ts";
import { nullOf } from "#plate/model/values.ts";
import type { Single, Value } from "#plate/model/values.ts";
import { bg007Item, integer } from "#plate/test/fixtures.ts";
import { assertKindType, evaluateIn, operandOf, scopeOf } from "#plate/test/processing.ts";

/**
 * The variables of an attempt with no response and no outcome.
 */
const none: Variables = { outcomes: {}, responses: {} };

/**
 * Construct a value of base type identifier.
 *
 * @param cardinality Its cardinality.
 * @param names Its identifiers, in order; none for NULL.
 * @returns The value.
 */
const identifiers = (cardinality: Value["cardinality"], ...names: readonly string[]): Value => ({
  baseType: "identifier",
  cardinality,
  values: names.map((value) => ({ baseType: "identifier", value })),
});

/**
 * Construct a single identifier value.
 *
 * @param name The identifier.
 * @returns The value.
 */
const one = (name: string): Value => identifiers("single", name);

/**
 * Construct a multiple container of identifiers.
 *
 * @param names Its identifiers; none for NULL.
 * @returns The value.
 */
const bag = (...names: readonly string[]): Value => identifiers("multiple", ...names);

/**
 * Construct an ordered container of identifiers.
 *
 * @param names Its identifiers, in order; none for NULL.
 * @returns The value.
 */
const list = (...names: readonly string[]): Value => identifiers("ordered", ...names);

/**
 * Construct a single boolean value.
 *
 * @param held The boolean.
 * @returns The value.
 */
const truth = (held: boolean): Value => ({
  baseType: "boolean",
  cardinality: "single",
  values: [{ baseType: "boolean", value: held }],
});

/**
 * The single boolean NULL.
 */
const unknown: Value = nullOf("boolean", "single");

/**
 * Give the type an operand of a value has, as the validator would type it.
 *
 * @param value The value.
 * @returns Its base type and cardinality.
 */
const typeOf = (value: Value): ExpressionType => ({
  baseType: value.baseType,
  cardinality: value.cardinality,
});

/**
 * Construct an integer literal of `n` or `number-repeats`.
 *
 * @param value The integer.
 * @returns The literal.
 */
const literal = (value: bigint): IntOrIdentifier => ({ _tag: "literal", value });

/**
 * Construct a reference to a variable from `n` or `number-repeats`.
 *
 * @param identifier The variable's identifier.
 * @returns The reference.
 */
const ref = (identifier: string): IntOrIdentifier => ({ _tag: "ref", identifier });

/**
 * The variables of an attempt whose outcomes hold the given values.
 *
 * @param outcomes The outcomes, by identifier.
 * @returns The variables.
 */
const holding = (outcomes: Variables["outcomes"]): Variables => ({ outcomes, responses: {} });

/**
 * Give the value of a containers expression of `qti-base-value` operands through the engine's
 * dispatcher, after checking that it succeeded and holds the type its kind's rule gives over its
 * operands' types (the family's type invariant).
 *
 * @param expression The expression, each operand a `qti-base-value`.
 * @param variables The variables of the attempt.
 * @returns Its value.
 */
const evaluated = (expression: Expression, variables: Variables = none): Value => {
  const result = evaluateIn(expression, scopeOf(bg007Item, variables));
  assert.isTrue(Result.isSuccess(result), `qti-${expression.kind} failed`);

  const value = Result.getOrThrow(result);
  const operands: readonly Expression[] = expression.operands;
  assertKindType(
    value,
    expression.kind,
    operands.map((operand) =>
      operand.kind === "base-value"
        ? typeOf(operand.value)
        : { baseType: "unknown", cardinality: "unknown" },
    ),
  );

  return value;
};

/**
 * Construct a `qti-multiple` of values.
 *
 * @param values Its operands' values.
 * @returns The expression.
 */
const multipleOf = (...values: readonly Value[]): Expression => ({
  kind: "multiple",
  operands: values.map(operandOf),
});

/**
 * Construct a `qti-ordered` of values.
 *
 * @param values Its operands' values.
 * @returns The expression.
 */
const orderedOf = (...values: readonly Value[]): Expression => ({
  kind: "ordered",
  operands: values.map(operandOf),
});

/**
 * Construct a `qti-repeat` of values.
 *
 * @param numberRepeats Its `number-repeats`.
 * @param first Its first operand's value.
 * @param rest Its other operands' values.
 * @returns The expression.
 */
const repeatOf = (
  numberRepeats: IntOrIdentifier,
  first: Value,
  ...rest: readonly Value[]
): Expression => ({
  kind: "repeat",
  numberRepeats,
  operands: [operandOf(first), ...rest.map(operandOf)],
});

/**
 * Construct a `qti-container-size` of a value.
 *
 * @param value Its operand's value.
 * @returns The expression.
 */
const sizeOf = (value: Value): Expression => ({
  kind: "container-size",
  operands: [operandOf(value)],
});

/**
 * Construct a `qti-index` of a value.
 *
 * @param n Its `n`.
 * @param value Its operand's value.
 * @returns The expression.
 */
const indexOf = (n: IntOrIdentifier, value: Value): Expression => ({
  kind: "index",
  n,
  operands: [operandOf(value)],
});

/**
 * Construct an expression of a kind that takes two operands.
 *
 * @param kind The kind.
 * @param left Its first operand's value.
 * @param right Its second operand's value.
 * @returns The expression.
 */
const pairOf = (kind: "contains" | "delete" | "member", left: Value, right: Value): Expression => ({
  kind,
  operands: [operandOf(left), operandOf(right)],
});

describe("the containers family's evaluators", () => {
  it("[I-9a] give qti-multiple's container, flattening a multiple operand and skipping NULL ones, and NULL when it holds nothing", () => {
    assert.deepStrictEqual(
      evaluated(multipleOf(one("A"), one("B"), bag("C", "D"))),
      bag("A", "B", "C", "D"),
    );
    assert.deepStrictEqual(
      evaluated(multipleOf(bag(), one("A"), identifiers("single"), one("A"))),
      bag("A", "A"),
      "a NULL operand is ignored and a repeat is kept",
    );
    assert.deepStrictEqual(evaluated(multipleOf(bag(), identifiers("single"))), bag());
    assert.deepStrictEqual(evaluated(multipleOf()), nullOf("string", "multiple"));
  });

  it("[I-9a] give qti-ordered's container in order, flattening an ordered operand and skipping NULL ones, and NULL when it holds nothing", () => {
    assert.deepStrictEqual(
      evaluated(orderedOf(one("B"), list("C", "A"), identifiers("single"), one("B"))),
      list("B", "C", "A", "B"),
    );
    assert.deepStrictEqual(evaluated(orderedOf(list(), identifiers("single"))), list());
    assert.deepStrictEqual(evaluated(orderedOf()), nullOf("string", "ordered"));
  });

  it("[I-9a] give qti-repeat's operands number-repeats times, by literal and by a variable, and NULL below 1 (reading 21)", () => {
    assert.deepStrictEqual(
      evaluated(repeatOf(literal(2n), one("A"), list("B", "C"), list())),
      list("A", "B", "C", "A", "B", "C"),
    );
    assert.deepStrictEqual(
      evaluated(repeatOf(ref("n"), one("A")), holding({ n: integer(3n) })),
      list("A", "A", "A"),
      "the corpus's number-repeats names the variable n",
    );
    assert.deepStrictEqual(evaluated(repeatOf(literal(1n), one("A"))), list("A"));
    assert.deepStrictEqual(evaluated(repeatOf(literal(0n), one("A"))), list());
    assert.deepStrictEqual(evaluated(repeatOf(literal(-2n), one("A"))), list());
    assert.deepStrictEqual(
      evaluated(repeatOf(ref("n"), one("A")), holding({ n: integer(0n) })),
      list(),
      "a variable below 1 gives NULL",
    );
    assert.deepStrictEqual(
      evaluated(repeatOf(ref("n"), one("A")), holding({ n: nullOf("integer", "single") })),
      list(),
      "a variable that holds NULL gives NULL",
    );
    assert.deepStrictEqual(evaluated(repeatOf(literal(3n), list(), identifiers("single"))), list());
  });

  it("[I-9a] fail qti-repeat and qti-index whose reference names a variable the attempt holds no value of", () => {
    const repeated = evaluateIn(repeatOf(ref("n"), one("A")), scopeOf(bg007Item, none));
    const indexed = evaluateIn(indexOf(ref("i"), list("A")), scopeOf(bg007Item, none));

    assert.deepStrictEqual(
      Result.isFailure(repeated) ? repeated.failure._tag : "succeeded",
      "UnknownIdentifierError",
    );
    assert.deepStrictEqual(
      Result.isFailure(indexed) ? indexed.failure._tag : "succeeded",
      "UnknownIdentifierError",
    );
  });

  it("[I-9a] give qti-container-size's count, repeats counted, and 0 for NULL", () => {
    assert.deepStrictEqual(evaluated(sizeOf(bag("A", "B", "B"))), integer(3n));
    assert.deepStrictEqual(evaluated(sizeOf(list("A"))), integer(1n));
    assert.deepStrictEqual(evaluated(sizeOf(bag())), integer(0n));
    assert.deepStrictEqual(evaluated(sizeOf(list())), integer(0n));
  });

  it("[I-9a] give qti-index's nth value from 1, by literal and by a variable, and NULL for n beyond the size, n of 0 or below, and a NULL operand (9.20)", () => {
    const letters = list("A", "B", "C");

    assert.deepStrictEqual(evaluated(indexOf(literal(1n), letters)), one("A"));
    assert.deepStrictEqual(evaluated(indexOf(literal(3n), letters)), one("C"));
    assert.deepStrictEqual(
      evaluated(indexOf(ref("i"), letters), holding({ i: integer(2n) })),
      one("B"),
      "the corpus's n names the variable i",
    );
    assert.deepStrictEqual(evaluated(indexOf(literal(2n), bag("A", "B"))), one("B"));
    assert.deepStrictEqual(evaluated(indexOf(literal(4n), letters)), identifiers("single"));
    assert.deepStrictEqual(evaluated(indexOf(literal(0n), letters)), identifiers("single"));
    assert.deepStrictEqual(evaluated(indexOf(literal(-1n), letters)), identifiers("single"));
    assert.deepStrictEqual(
      evaluated(indexOf(literal(2_147_483_647n), letters)),
      identifiers("single"),
      "xs:int's greatest n",
    );
    assert.deepStrictEqual(
      evaluated(indexOf(ref("i"), letters), holding({ i: integer(-3n) })),
      identifiers("single"),
    );
    assert.deepStrictEqual(
      evaluated(indexOf(ref("i"), letters), holding({ i: nullOf("integer", "single") })),
      identifiers("single"),
    );
    assert.deepStrictEqual(evaluated(indexOf(literal(1n), list())), identifiers("single"));
  });

  it("[I-9a] give qti-member's truth, a pair matching in either order, and NULL when either operand is NULL", () => {
    assert.deepStrictEqual(evaluated(pairOf("member", one("B"), bag("A", "B"))), truth(true));
    assert.deepStrictEqual(evaluated(pairOf("member", one("C"), list("A", "B"))), truth(false));
    assert.deepStrictEqual(
      evaluated(
        pairOf(
          "member",
          {
            baseType: "pair",
            cardinality: "single",
            values: [{ baseType: "pair", value: ["B", "A"] }],
          },
          {
            baseType: "pair",
            cardinality: "multiple",
            values: [{ baseType: "pair", value: ["A", "B"] }],
          },
        ),
      ),
      truth(true),
    );
    assert.deepStrictEqual(evaluated(pairOf("member", identifiers("single"), bag("A"))), unknown);
    assert.deepStrictEqual(evaluated(pairOf("member", one("A"), bag())), unknown);
  });

  it("[I-9a] give qti-delete's container without every instance of its first operand, NULL when emptied or either operand is NULL", () => {
    assert.deepStrictEqual(
      evaluated(pairOf("delete", one("A"), list("B", "A", "C", "A"))),
      list("B", "C"),
    );
    assert.deepStrictEqual(evaluated(pairOf("delete", one("D"), bag("B", "C"))), bag("B", "C"));
    assert.deepStrictEqual(evaluated(pairOf("delete", one("A"), bag("A", "A"))), bag());
    assert.deepStrictEqual(evaluated(pairOf("delete", identifiers("single"), bag("A"))), bag());
    assert.deepStrictEqual(evaluated(pairOf("delete", one("A"), list())), list());
  });

  it("[I-9a] give qti-contains on multiple containers counting repeats, and on ordered ones as a contiguous run (9.16)", () => {
    const cases: readonly (readonly [Value, Value, boolean])[] = [
      [bag("A", "B", "C"), bag("C", "A"), true],
      [bag("A", "B", "C"), bag("B", "B"), false],
      [bag("A", "B", "B", "C"), bag("B", "B"), true],
      [bag("A", "B"), bag("A", "B", "C"), false],
      [list("A", "B", "C"), list("B", "C"), true],
      [list("A", "B", "C"), list("C", "A"), false],
      [list("A", "B", "C"), list("A", "C"), false],
      [list("A", "B", "C"), list("A", "B", "C"), true],
      [list("A", "B", "A", "B", "C"), list("A", "B", "C"), true],
      [list("A", "B"), list("B", "C"), false],
    ];

    for (const [container, part, expected] of cases) {
      assert.deepStrictEqual(
        evaluated(pairOf("contains", container, part)),
        truth(expected),
        `${container.cardinality} ${container.values.map((single) => String(single.value)).join(",")} and ${part.values.map((single) => String(single.value)).join(",")}`,
      );
    }

    assert.deepStrictEqual(evaluated(pairOf("contains", bag(), bag("A"))), unknown);
    assert.deepStrictEqual(evaluated(pairOf("contains", list("A"), list())), unknown);
  });
});

/**
 * Construct a container of one identifier, `A`, held a number of times, built without spreading
 * its values, as a container of a million values must be.
 *
 * @param cardinality Its cardinality.
 * @param size How many values it holds.
 * @returns The value.
 */
const sized = (cardinality: "multiple" | "ordered", size: number): Value => ({
  baseType: "identifier",
  cardinality,
  values: Array.from({ length: size }, (): Single => ({ baseType: "identifier", value: "A" })),
});

/**
 * Assert that a value is a NULL of a type, checking that it holds no value before comparing it, so
 * a container of a million values fails with its size, not a diff of its values.
 *
 * @param value The value.
 * @param expected The NULL it must be.
 */
const assertUnset = (value: Value, expected: Value): void => {
  assert.strictEqual(value.values.length, 0, "the value holds values");
  assert.deepStrictEqual(value, expected);
};

describe("the containers family's bound on a computed container (operator ruling afb7e648)", () => {
  it("[I-9a] qti-multiple and qti-ordered keep a container of exactly 1,000,000 values and give the NULL of their base type and cardinality for one of 1,000,001", () => {
    const bagged = evaluated(multipleOf(sized("multiple", 999_999), one("B")));
    const listed = evaluated(orderedOf(one("B"), sized("ordered", 999_999)));

    assert.strictEqual(bagged.values.length, 1_000_000);
    assert.deepStrictEqual(bagged.values.at(-1), { baseType: "identifier", value: "B" });
    assert.strictEqual(listed.values.length, 1_000_000);
    assert.deepStrictEqual(listed.values[0], { baseType: "identifier", value: "B" });
    assertUnset(evaluated(multipleOf(sized("multiple", 1_000_000), one("B"))), bag());
    assertUnset(evaluated(orderedOf(one("B"), sized("ordered", 1_000_000))), list());
    assertUnset(
      evaluated(multipleOf(sized("multiple", 600_000), sized("multiple", 400_001))),
      bag(),
    );
  });

  it("[I-9a] qti-repeat keeps exactly 1,000,000 values and gives the ordered NULL past them", () => {
    const kept = evaluated(repeatOf(literal(1_000_000n), one("A")));

    assert.strictEqual(kept.values.length, 1_000_000);
    assert.isTrue(
      kept.values.every((single) => single.baseType === "identifier" && single.value === "A"),
      "every value is A",
    );
    assertUnset(evaluated(repeatOf(literal(1_000_001n), one("A"))), list());
    assertUnset(evaluated(repeatOf(literal(500_001n), one("A"), list("B"))), list());
  });

  it("[I-9a] qti-repeat evaluates its operands once and repeats that pass's values, so an operand whose later values would grow past 1,000,000 is never evaluated again", () => {
    const { repeat } = containersEvaluators;
    assert.notStrictEqual(repeat, "unlanded", "qti-repeat is landed");
    if (repeat === "unlanded") {
      return;
    }

    let evaluations = 0;
    const growing: Evaluate = () => {
      evaluations += 1;

      return Result.succeed(evaluations === 1 ? one("A") : sized("ordered", 600_000));
    };
    const repeated = repeat(
      { kind: "repeat", numberRepeats: literal(3n), operands: [operandOf(one("A"))] },
      scopeOf(bg007Item, none),
      growing,
    );
    assert.isTrue(Result.isSuccess(repeated), "qti-repeat failed");

    const value = Result.getOrThrow(repeated);
    assert.deepStrictEqual(value, list("A", "A", "A"));
    assertKindType(value, "repeat", [typeOf(one("A"))]);
    assert.strictEqual(evaluations, 1, "the operand was evaluated once, not once per pass");
  });
});

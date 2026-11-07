import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { attr, el, text } from "#plate/document/source.ts";
import type { SourceDocument, SourceElement } from "#plate/document/source.ts";
import type { ExpressionType } from "#plate/model/expression.ts";
import { nullOf } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";
import { integer } from "#plate/test/fixtures.ts";
import {
  assertKindType,
  baseValueElement,
  expressionElement,
  outcomeDeclaration,
  processed,
  processingItem,
  setOutcomeElement,
  variableElement,
} from "#plate/test/processing.ts";

/**
 * How long, in milliseconds, a crafted item's processing may take here: half the default test
 * timeout of 5,000 ms. Without the bounds each takes minutes, or exhausts memory.
 */
const quickly = 2500;

/**
 * The type of a single integer.
 */
const singleInteger: ExpressionType = { baseType: "integer", cardinality: "single" };

/**
 * The type of a single identifier.
 */
const singleIdentifier: ExpressionType = { baseType: "identifier", cardinality: "single" };

/**
 * The type of an ordered container of identifiers.
 */
const orderedIdentifiers: ExpressionType = { baseType: "identifier", cardinality: "ordered" };

/**
 * Construct an integer outcome declaration with a default value.
 *
 * @param identifier Its `identifier`.
 * @param written Its default value, as written.
 * @returns The `qti-outcome-declaration`.
 */
const integerOutcome = (identifier: string, written: string): SourceElement =>
  outcomeDeclaration(identifier, "integer", "single", [
    el("qti-default-value", [], [el("qti-value", [], [text(written)])]),
  ]);

/**
 * Construct a `qti-repeat` element.
 *
 * @param numberRepeats Its `number-repeats`, as written.
 * @param operand Its one operand.
 * @returns The element.
 */
const repeatElement = (numberRepeats: string, operand: SourceElement): SourceElement =>
  expressionElement("repeat", [attr("number-repeats", numberRepeats)], [operand]);

/**
 * Construct the `qti-base-value` of the identifier `A`.
 *
 * @returns The element.
 */
const letter = (): SourceElement => baseValueElement("identifier", "A");

/**
 * Run an item's response processing over no response, and give one outcome's value after it and
 * how long the run took, in milliseconds.
 *
 * @param document The item document.
 * @param identifier The outcome.
 * @returns The outcome's value and the run's duration.
 */
const runFor = (document: SourceDocument, identifier: string) =>
  Effect.gen(function* runProcessing() {
    const started = performance.now();
    const after = yield* processed(document, {});
    const elapsed = performance.now() - started;
    assert.isTrue(Option.isSome(after), "the processing ran");

    const value: Value = Option.getOrThrow(
      Option.flatMapNullishOr(after, (variables) => variables.outcomes[identifier]),
    );

    return { elapsed, value };
  });

/**
 * Construct an item whose processing sets the ordered identifier outcome `OUT` to one expression,
 * beside an identifier outcome `EMPTY` that holds NULL and an integer outcome `n` of a value.
 *
 * @param expression The expression element.
 * @param n The value of `n`, as written.
 * @returns The item document.
 */
const repeatItem = (expression: SourceElement, n = "1"): SourceDocument =>
  processingItem(
    [
      outcomeDeclaration("OUT", "identifier", "ordered"),
      outcomeDeclaration("EMPTY", "identifier"),
      integerOutcome("n", n),
    ],
    [setOutcomeElement("OUT", expression)],
  );

/**
 * Construct an item whose processing sets `SCORE`, 2 by default, to its own square in a number of
 * rules, one after another.
 *
 * @param rules How many rules square `SCORE`.
 * @returns The item document.
 */
const squaringItem = (rules: number): SourceDocument =>
  processingItem(
    [integerOutcome("SCORE", "2")],
    Array.from({ length: rules }, () =>
      setOutcomeElement(
        "SCORE",
        expressionElement("product", [], [variableElement("SCORE"), variableElement("SCORE")]),
      ),
    ),
  );

describe("the evaluator's bounds on a crafted item's processing (operator ruling afb7e648)", () => {
  it.effect(
    "[I-9a] an item that squares SCORE in 40 rules gives the integer NULL, quickly, and squared in 19 rules SCORE is exact",
    () =>
      Effect.gen(function* squares() {
        const squared = yield* runFor(squaringItem(40), "SCORE");

        assert.deepStrictEqual(squared.value, nullOf("integer", "single"));
        assertKindType(squared.value, "product", [singleInteger, singleInteger]);
        assert.isBelow(squared.elapsed, quickly);

        const exact = yield* runFor(squaringItem(19), "SCORE");
        assert.deepStrictEqual(exact.value, integer(2n ** 524_288n), "2^524288 has 524,289 bits");
      }),
  );

  it.effect(
    '[I-9a] qti-repeat with number-repeats="2147483647", or naming a variable of 10^30, gives the ordered NULL quickly',
    () =>
      Effect.gen(function* repeatsLong() {
        for (const [numberRepeats, n] of [
          ["2147483647", "1"],
          ["n", "1000000000000000000000000000000"],
        ] as const) {
          const repeated = yield* runFor(
            repeatItem(repeatElement(numberRepeats, letter()), n),
            "OUT",
          );

          assert.deepStrictEqual(repeated.value, nullOf("identifier", "ordered"), numberRepeats);
          assertKindType(repeated.value, "repeat", [singleIdentifier]);
          assert.isBelow(repeated.elapsed, quickly, numberRepeats);
        }
      }),
  );

  it.effect(
    '[I-9a] qti-repeat with number-repeats="1000000" over a product of two literals near 500,000 bits evaluates the product once: it finishes quickly and holds 1,000,000 equal values',
    () =>
      Effect.gen(function* repeatsCostly() {
        const left = 2n ** 499_999n + 1n;
        const right = 2n ** 499_999n + 3n;
        const repeated = yield* runFor(
          processingItem(
            [outcomeDeclaration("OUT", "integer", "ordered")],
            [
              setOutcomeElement(
                "OUT",
                repeatElement(
                  "1000000",
                  expressionElement(
                    "product",
                    [],
                    [
                      baseValueElement("integer", left.toString()),
                      baseValueElement("integer", right.toString()),
                    ],
                  ),
                ),
              ),
            ],
          ),
          "OUT",
        );

        assert.isBelow(repeated.elapsed, quickly);
        assertKindType(repeated.value, "repeat", [singleInteger]);

        const { values } = repeated.value;
        const [first] = values;
        assert.deepStrictEqual(first, { baseType: "integer", value: left * right });
        assert.strictEqual(values.length, 1_000_000);
        assert.isTrue(
          values.every((single) => single === first),
          "every value is the one value the product gave, so it was evaluated once",
        );
      }),
  );

  it.effect(
    "[I-9a] qti-repeat whose operand gives no value gives the ordered NULL quickly, however many passes it asks for, nested too",
    () =>
      Effect.gen(function* repeatsNothing() {
        const empty = variableElement("EMPTY");

        for (const [expression, operand] of [
          [repeatElement("2147483647", empty), singleIdentifier],
          [repeatElement("1000000", repeatElement("1000000", empty)), orderedIdentifiers],
        ] as const) {
          const repeated = yield* runFor(repeatItem(expression), "OUT");

          assert.deepStrictEqual(repeated.value, nullOf("identifier", "ordered"));
          assertKindType(repeated.value, "repeat", [operand]);
          assert.isBelow(repeated.elapsed, quickly);
        }
      }),
  );

  it.effect(
    "[I-9a] a nested qti-repeat keeps exactly 1,000,000 values and gives the ordered NULL past them",
    () =>
      Effect.gen(function* repeatsNested() {
        const kept = yield* runFor(
          repeatItem(repeatElement("1000", repeatElement("1000", letter()))),
          "OUT",
        );
        assert.strictEqual(kept.value.values.length, 1_000_000);
        assertKindType(kept.value, "repeat", [orderedIdentifiers]);

        const past = yield* runFor(
          repeatItem(repeatElement("1001", repeatElement("1000", letter()))),
          "OUT",
        );
        assert.strictEqual(past.value.values.length, 0, "1,001,000 values are past the bound");
        assert.deepStrictEqual(past.value, nullOf("identifier", "ordered"));
        assertKindType(past.value, "repeat", [orderedIdentifiers]);
      }),
  );

  it.effect(
    "[I-9a] an integer as written past the bound, a literal or a declared default, is read and stored exactly",
    () =>
      Effect.gen(function* storesWritten() {
        const big = 2n ** 1_000_000n;
        const written = yield* runFor(
          processingItem(
            [outcomeDeclaration("OUT", "integer"), integerOutcome("BIG", big.toString())],
            [setOutcomeElement("OUT", baseValueElement("integer", (big * 3n).toString()))],
          ),
          "OUT",
        );
        assert.deepStrictEqual(written.value, integer(big * 3n));

        const declared = yield* runFor(
          processingItem(
            [outcomeDeclaration("OUT", "integer"), integerOutcome("BIG", big.toString())],
            [setOutcomeElement("OUT", variableElement("BIG"))],
          ),
          "OUT",
        );
        assert.deepStrictEqual(declared.value, integer(big));
      }),
  );
});

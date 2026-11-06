import { assert, describe, it } from "@effect/vitest";
import { Result } from "effect";
import type { Variables } from "#plate/engine/evaluate.ts";
import { UnknownIdentifierError } from "#plate/engine/failures.ts";
import { variableValue } from "#plate/engine/refs.ts";
import type { Value } from "#plate/model/values.ts";

/**
 * A single identifier response value.
 */
const answer: Value = {
  baseType: "identifier",
  cardinality: "single",
  values: [{ baseType: "identifier", value: "A" }],
};

/**
 * A single float outcome value.
 */
const score: Value = {
  baseType: "float",
  cardinality: "single",
  values: [{ baseType: "float", value: 0.75 }],
};

/**
 * The variables of an attempt with a response `RESPONSE`, an outcome `SCORE` and no attempt count.
 */
const variables: Variables = { outcomes: { SCORE: score }, responses: { RESPONSE: answer } };

/**
 * Give the failure a Result holds, after checking that it failed.
 *
 * @param result The Result `variableValue` returned.
 * @returns Its failure.
 */
const failureOf = <A, E>(result: Result.Result<A, E>): E => {
  assert.isTrue(Result.isFailure(result));

  return Result.getOrThrow(Result.flip(result));
};

describe("variableValue", () => {
  it("reads a response", () => {
    assert.deepStrictEqual(Result.getOrThrow(variableValue(variables, "RESPONSE")), answer);
  });

  it("reads an outcome", () => {
    assert.deepStrictEqual(Result.getOrThrow(variableValue(variables, "SCORE")), score);
  });

  it("reads numAttempts from the attempt count, as a single integer", () => {
    assert.deepStrictEqual(
      Result.getOrThrow(variableValue({ ...variables, numAttempts: 3n }, "numAttempts")),
      { baseType: "integer", cardinality: "single", values: [{ baseType: "integer", value: 3n }] },
    );
  });

  it("reads an outcome named numAttempts before the attempt count", () => {
    const declared: Variables = {
      ...variables,
      numAttempts: 3n,
      outcomes: { ...variables.outcomes, numAttempts: score },
    };

    assert.deepStrictEqual(Result.getOrThrow(variableValue(declared, "numAttempts")), score);
  });

  for (const identifier of ["MISSING", "numAttempts", "constructor"]) {
    it(`fails for ${identifier}, which the record holds no value of`, () => {
      const failure = failureOf(variableValue(variables, identifier));

      assert.instanceOf(failure, UnknownIdentifierError);
      assert.deepStrictEqual(
        {
          _tag: failure._tag,
          holder: failure.holder,
          identifier: failure.identifier,
          role: failure.role,
        },
        { _tag: "UnknownIdentifierError", holder: "record", identifier, role: "variable" },
      );
    });
  }
});

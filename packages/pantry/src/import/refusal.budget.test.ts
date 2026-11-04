import { CompileError, ExecutionFailure } from "@bjornpagen/grizzle";
import type { CompileBound } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Option, Schema } from "effect";
import { ImportRefused, budgetRefusalOf } from "#pantry/import/refusal.ts";

/**
 * Grizzle exports no constructor for an `ExecutionFailure`, and the schema of its `reason` accepts
 * a `CompileError` only as an instance (an object literal fails to decode: `Expected CompileError
 * at ["reason"]`), so the failure is built by decoding a `CompileError` made by the engine's own
 * factory.
 */
const refusedFor = (bound: CompileBound) =>
  Schema.decodeUnknownSync(ExecutionFailure)({
    _tag: "ExecutionFailure",
    reason: CompileError.make({
      _tag: "ResourceBound",
      at: { label: "ChangeSet", path: [], site: undefined },
      bound,
    }),
  });

describe("budgetRefusalOf", () => {
  it("maps a refused sqlBytes budget to program-budget, naming needed and limit", () => {
    const refusal = budgetRefusalOf(
      refusedFor({ budget: "sqlBytes", kind: "budget", limit: 1_048_576, needed: 1_608_527 }),
    );

    assert.isTrue(Option.isSome(refusal));

    if (Option.isSome(refusal)) {
      assert.instanceOf(refusal.value, ImportRefused);
      assert.strictEqual(refusal.value.rule, "program-budget");
      assert.include(refusal.value.detail, "1608527");
      assert.include(refusal.value.detail, "1048576");
      assert.include(refusal.value.detail, "sqlBytes");
    }
  });

  it("maps any other budget kind to program-budget too", () => {
    const refusal = budgetRefusalOf(
      refusedFor({ budget: "nodes", kind: "budget", limit: 10, needed: 11 }),
    );

    assert.isTrue(Option.isSome(refusal));
  });

  it("maps a bound of another kind to nothing", () => {
    assert.isTrue(Option.isNone(budgetRefusalOf(refusedFor({ kind: "nesting", limit: 8 }))));
  });

  it("maps an ExecutionFailure whose reason is a ServerError to nothing", () => {
    const failure = Schema.decodeUnknownSync(ExecutionFailure)({
      _tag: "ExecutionFailure",
      reason: {
        _tag: "ServerError",
        column: undefined,
        constraint: undefined,
        dataType: undefined,
        detail: undefined,
        hint: undefined,
        message: "boom",
        schema: undefined,
        sqlstate: "XX000",
        table: undefined,
      },
    });

    assert.isTrue(Option.isNone(budgetRefusalOf(failure)));
  });
});

import { CompileError, ExecutionFailure } from "@bjornpagen/grizzle";
import type { CompileBound, ServerError } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";
import { ImportRefused, budgetRefusalOf } from "#pantry/import/refusal.ts";

/**
 * An `ExecutionFailure` built with `new` over a `CompileError` the engine's own factory made, for
 * a bound the compiler refused.
 */
const refusedFor = (bound: CompileBound) =>
  new ExecutionFailure({
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
    const report = {
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
    };

    // SAFETY: Grizzle exports `ServerError` as a type only (`adapter/public/errors.ts:58`; findings
    // row 21), and its `sqlstate` is a branded `Sqlstate` with no public parse
    // (`engine/src/core/sqlstate.ts:5`). The plain fields of the class at
    // `adapter/errors/failures.ts:34-44` stand for it: the code under test reads only `_tag`.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
    const failure = new ExecutionFailure({ reason: report as ServerError });

    assert.isTrue(Option.isNone(budgetRefusalOf(failure)));
  });
});

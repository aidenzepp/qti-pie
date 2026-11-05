import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Order } from "effect";
import { closed, dictionary, inVersions } from "#pantry/grammar/closed.ts";

/**
 * The two schema versions, the first key digit of every versioned relation.
 */
const versions = ["3.0.0", "3.0.1"] as const;

/**
 * Construct a code space of numbers, each its own code.
 *
 * @param size - The number of values.
 * @returns The values 0 to `size` − 1.
 */
const codes = (size: number): readonly number[] => Array.from({ length: size }, (_, code) => code);

/**
 * A stand-in for the `NodeKind` roster at today's size, K = 363. The sizes depend on how many
 * handles a roster has, not on their names.
 */
const kinds = Array.from({ length: 363 }, (_, code) => `kind-${code}`);

/**
 * The payload codes of an `Order` cell: 14 ranks and the unranked interval [0, ∞].
 */
const ranks = codes(15);

/**
 * The key of `Order` and of its key set: (version, parent, child).
 */
const orderKey = [
  { name: "version", values: versions },
  { name: "parent", values: kinds },
  { name: "child", values: kinds },
] as const;

/**
 * Construct a set over a square of two equal code spaces, for the bit-string cap.
 *
 * @param size - Each side's number of values.
 * @returns The set, with no rows, or the reason it has no constant.
 */
const square = (size: number) =>
  closed({
    key: [
      { name: "row", values: codes(size) },
      { name: "column", values: codes(size) },
    ],
    name: "Square",
    payload: [],
    rows: [],
  });

describe("the string of cells", () => {
  it.effect("Order at K = 363 is 263,538 cells of 4 bits, 131,777 bytes", () =>
    Effect.gen(function* orderSize() {
      const order = yield* Effect.fromResult(
        closed({
          key: orderKey,
          name: "Order",
          payload: [{ name: "rank", values: ranks }],
          rows: [{ child: "kind-1", parent: "kind-0", rank: 3, version: "3.0.1" }],
        }),
      );

      assert.strictEqual(order.cells, 263_538);
      assert.strictEqual(order.width, 4);
      assert.strictEqual(order.bytes, 131_777);
    }),
  );

  it.effect("a set over the same key is one bit a cell, 32,951 bytes", () =>
    Effect.gen(function* admittedSize() {
      const admitted = yield* Effect.fromResult(
        closed({
          key: orderKey,
          name: "Admitted",
          payload: [],
          rows: [{ child: "kind-1", parent: "kind-0", version: "3.0.0" }],
        }),
      );

      assert.strictEqual(admitted.cells, 263_538);
      assert.strictEqual(admitted.width, 1);
      assert.strictEqual(admitted.bytes, 32_951);
    }),
  );

  it.effect("a 16th payload code takes a fifth bit, since a cell also holds absent", () =>
    Effect.gen(function* widthStep() {
      const widths = yield* Effect.forEach([1, 3, 4, 15, 16], (size) =>
        Effect.fromResult(
          closed({
            key: [{ name: "kind", values: kinds }],
            name: "Width",
            payload: [{ name: "code", values: codes(size) }],
            rows: [],
          }),
        ).pipe(Effect.map(({ width }) => width)),
      );

      assert.deepStrictEqual(widths, [1, 2, 3, 4, 5]);
    }),
  );

  it.effect("payload fields multiply into one payload space", () =>
    Effect.gen(function* payloadProduct() {
      const relation = yield* Effect.fromResult(
        closed({
          key: [{ name: "kind", values: kinds }],
          name: "Pair",
          payload: [
            { name: "low", values: [0, 1, 2] },
            { name: "high", values: [0, 1, 2, 3, 4] },
          ],
          rows: [],
        }),
      );

      assert.strictEqual(relation.cells, 363);
      assert.strictEqual(relation.width, 4);
    }),
  );
});

describe("the refusals", () => {
  it.effect("refuses two rows at one key and names the key", () =>
    Effect.gen(function* collision() {
      const failure = yield* Effect.flip(
        Effect.fromResult(
          closed({
            key: orderKey,
            name: "Order",
            payload: [{ name: "rank", values: ranks }],
            rows: [
              { child: "kind-1", parent: "kind-0", rank: 0, version: "3.0.0" },
              { child: "kind-1", parent: "kind-0", rank: 2, version: "3.0.0" },
            ],
          }),
        ),
      );

      assert.strictEqual(failure._tag, "KeyCollision");
      assert.include(
        failure.message,
        "Order states two rows at (version 3.0.0, parent kind-0, child kind-1)",
      );
    }),
  );

  it.effect("refuses a set that states one row twice", () =>
    Effect.gen(function* repeatedRow() {
      const row = { child: "kind-2", parent: "kind-0", version: "3.0.1" } as const;
      const failure = yield* Effect.flip(
        Effect.fromResult(
          closed({ key: orderKey, name: "Admitted", payload: [], rows: [row, row] }),
        ),
      );

      assert.strictEqual(failure._tag, "KeyCollision");
    }),
  );

  it.effect("refuses a key value or a payload value outside its field's code space", () =>
    Effect.gen(function* outside() {
      const key = yield* Effect.flip(
        Effect.fromResult(
          closed({
            key: orderKey,
            name: "Order",
            payload: [{ name: "rank", values: ranks }],
            rows: [{ child: "kind-363", parent: "kind-0", rank: 0, version: "3.0.0" }],
          }),
        ),
      );
      const payload = yield* Effect.flip(
        Effect.fromResult(
          closed({
            key: orderKey,
            name: "Order",
            payload: [{ name: "rank", values: ranks }],
            rows: [{ child: "kind-1", parent: "kind-0", rank: 15, version: "3.0.0" }],
          }),
        ),
      );

      assert.include(key.message, "Order has a row whose child is kind-363");
      assert.include(payload.message, "Order has a row whose rank is 15");
    }),
  );

  it.effect("refuses a code space that lists a value twice", () =>
    Effect.gen(function* repeatedValue() {
      const failure = yield* Effect.flip(
        Effect.fromResult(
          closed({
            key: [{ name: "version", values: ["3.0.0", "3.0.1", "3.0.0"] }],
            name: "Versions",
            payload: [],
            rows: [],
          }),
        ),
      );

      assert.strictEqual(failure._tag, "RepeatedValue");
      assert.include(failure.message, "Versions's field version lists 3.0.0 twice");
    }),
  );

  it.effect("refuses a string of cells longer than one PostgreSQL bit string", () =>
    Effect.gen(function* beyond() {
      const under = yield* Effect.fromResult(square(46_340));
      const over = yield* Effect.flip(Effect.fromResult(square(46_341)));

      assert.strictEqual(under.cells, 2_147_395_600);
      assert.strictEqual(over._tag, "BeyondConstant");
      assert.include(over.message, "needs 2147488281 bits");
    }),
  );
});

describe("lookup", () => {
  it.effect("finds the row at a key, and none where no row is", () =>
    Effect.gen(function* lookups() {
      const row = { child: "kind-7", parent: "kind-3", rank: 5, version: "3.0.1" } as const;
      const order = yield* Effect.fromResult(
        closed({
          key: orderKey,
          name: "Order",
          payload: [{ name: "rank", values: ranks }],
          rows: [row],
        }),
      );

      assert.deepStrictEqual(
        order.lookup({ child: "kind-7", parent: "kind-3", version: "3.0.1" }),
        Option.some(row),
      );
      assert.isTrue(
        Option.isNone(order.lookup({ child: "kind-7", parent: "kind-3", version: "3.0.0" })),
      );
      assert.isTrue(
        Option.isNone(order.lookup({ child: "kind-7", parent: "no-such-kind", version: "3.0.1" })),
      );
    }),
  );

  it.effect("an open-typed payload is coded by its distinct values, ascending", () =>
    Effect.gen(function* openPayload() {
      const unbounded = 9_223_372_036_854_775_807n;
      const rows = [
        { kind: "kind-0", max: 2n },
        { kind: "kind-1", max: 0n },
        { kind: "kind-2", max: unbounded },
        { kind: "kind-3", max: 2n },
      ];
      const max = dictionary(
        rows.map((row) => row.max),
        Order.BigInt,
      );
      const arity = yield* Effect.fromResult(
        closed({
          key: [{ name: "kind", values: kinds }],
          name: "OperatorArity",
          payload: [{ name: "max", values: max }],
          rows,
        }),
      );

      assert.deepStrictEqual(max, [0n, 2n, unbounded]);
      assert.strictEqual(arity.width, 2);
      assert.deepStrictEqual(
        arity.lookup({ kind: "kind-2" }).pipe(Option.map((found) => found.max)),
        Option.some(unbounded),
      );
    }),
  );
});

describe("inVersions", () => {
  it.effect("states a rule once for each version it holds in", () =>
    Effect.gen(function* versioned() {
      const rows = inVersions(versions, [
        { child: "kind-1", parent: "kind-0" },
        { child: "kind-2", parent: "kind-0" },
      ]);
      const admitted = yield* Effect.fromResult(
        closed({ key: orderKey, name: "Admitted", payload: [], rows }),
      );

      assert.deepStrictEqual(rows, [
        { child: "kind-1", parent: "kind-0", version: "3.0.0" },
        { child: "kind-2", parent: "kind-0", version: "3.0.0" },
        { child: "kind-1", parent: "kind-0", version: "3.0.1" },
        { child: "kind-2", parent: "kind-0", version: "3.0.1" },
      ]);
      assert.isTrue(
        Option.isSome(admitted.lookup({ child: "kind-2", parent: "kind-0", version: "3.0.1" })),
      );
    }),
  );
});

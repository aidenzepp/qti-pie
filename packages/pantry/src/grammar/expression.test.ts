import { NodeServices } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { Array as Arr, Effect, Layer, Option, Order } from "effect";
import { Digest } from "effect/crypto";
import {
  bindingFit,
  mappableBaseType,
  operatorArity,
  recordBindingFit,
  unbounded,
} from "#pantry/grammar/expression.ts";
import { BaseType, TypedCardinality } from "#pantry/schema/declaration.ts";
import { NodeKind } from "#pantry/schema/node.ts";
import * as bindingSeed from "#pantry/schema/seed/binding-fit.ts";
import * as mappableSeed from "#pantry/schema/seed/mappable-base-type.ts";
import * as aritySeed from "#pantry/schema/seed/operator-arity.ts";
import * as recordSeed from "#pantry/schema/seed/record-binding-fit.ts";
import { arityOf, loadSchema } from "#pantry/vocab/derive/derive.ts";
import type { ArityRow } from "#pantry/vocab/derive/derive.ts";
import { checkCache } from "#pantry/vocab/derive/sources.ts";
import type { XsdSourceMissing } from "#pantry/vocab/derive/sources.ts";

/**
 * Today's composition: the `NodeKind`, `BaseType` and typed cardinality rosters, K = 363.
 */
const rosters = {
  baseTypes: BaseType.handles,
  cardinalities: TypedCardinality.handles,
  kinds: NodeKind.handles,
};

/**
 * Why the XSD-gated test cannot run here: the cache's missing files, or `None` when all 14 pinned
 * XSDs are present. Any other failure of the check fails the file's load.
 */
const absence = await Effect.runPromise(
  checkCache().pipe(
    Effect.as(Option.none<XsdSourceMissing>()),
    Effect.catchTag("XsdSourceMissing", (missing) => Effect.succeed(Option.some(missing))),
    Effect.provide(NodeServices.layer),
  ),
);

/**
 * The timeout, in milliseconds, for the test that reads and indexes the two ASI XSDs.
 *
 * They are 18 MB each. Measured on 2026-11-05 on a 10-CPU M2 Max at load averages of 10 to 11,
 * with other suites running: three runs took 2.5 to 3.0 s. The budget is the larger of twice that
 * maximum (6 s) and 20 s, the floor being twice vitest's default hook timeout, as `derive.test.ts`
 * budgets the same reads. Raise it only on a new measurement recorded here, never to make a run
 * pass.
 */
const xsdTestTimeoutMs = 20_000;

/**
 * Rows ordered by kind, which the seeds and the generators list in different orders.
 */
const byKind = Order.mapInput(Order.String, (row: { readonly kind: string }) => row.kind);

/**
 * Write each row of a binding set as one string, for comparing two sets in any order.
 *
 * @param rows - The rows, each a kind, a base type and a cardinality.
 * @returns One `kind baseType cardinality` line per row, sorted.
 */
const bindingLines = (
  rows: readonly {
    readonly baseType: string;
    readonly cardinality: string;
    readonly kind: string;
  }[],
): readonly string[] =>
  rows.map(({ baseType, cardinality, kind }) => `${kind} ${baseType} ${cardinality}`).toSorted();

/**
 * Convert a row the vocabulary deriver reads from the XSD into an `OperatorArity` row: an
 * unbounded maximum, `None` there, is {@link unbounded} here.
 *
 * @param row - The deriver's row.
 * @returns The row as `OperatorArity` states it.
 */
const arityRowOf = (row: ArityRow) => ({
  kind: row.kind,
  max: Option.match(row.max, { onNone: () => unbounded, onSome: BigInt }),
  min: BigInt(row.min),
});

describe("OperatorArity", () => {
  it.effect("is one function, kind → (min, max), of 363 cells of 4 bits", () =>
    Effect.gen(function* arityConstant() {
      const arity = yield* Effect.fromResult(operatorArity(rosters));
      const [min, max] = arity.payload;

      assert.strictEqual(arity.rows.length, 64);
      assert.deepStrictEqual(min.values, [0n, 1n, 2n]);
      assert.deepStrictEqual(max.values, [0n, 1n, 2n, unbounded]);
      assert.strictEqual(arity.cells, 363);
      assert.strictEqual(arity.width, 4);
      assert.strictEqual(arity.bytes, 190);
    }),
  );

  it.effect("reproduces the 64, 50 and 14 rows of seed/operator-arity.ts", () =>
    Effect.gen(function* aritySeedRows() {
      const { rows } = yield* Effect.fromResult(operatorArity(rosters));
      const bounded = rows.filter((row) => row.max !== unbounded);
      const open = rows.filter((row) => row.max === unbounded);

      assert.deepStrictEqual([rows.length, bounded.length, open.length], [64, 50, 14]);
      assert.deepStrictEqual(
        Arr.sort(
          rows.map(({ kind, min }) => ({ kind, min })),
          byKind,
        ),
        Arr.sort(aritySeed.operatorArity, byKind),
      );
      assert.deepStrictEqual(
        Arr.sort(
          bounded.map(({ kind, max }) => ({ kind, max })),
          byKind,
        ),
        Arr.sort(aritySeed.operatorArityMax, byKind),
      );
      assert.deepStrictEqual(
        Arr.sort(
          open.map(({ kind }) => ({ kind })),
          byKind,
        ),
        Arr.sort(aritySeed.operatorArityUnbounded, byKind),
      );
    }),
  );

  it.effect("reads an unbounded maximum as a value that every count lies under", () =>
    Effect.gen(function* unboundedValue() {
      const arity = yield* Effect.fromResult(operatorArity(rosters));
      const admits = (kind: string, children: bigint) =>
        arity
          .lookup({ kind })
          .pipe(Option.exists(({ max, min }) => min <= children && children <= max));

      assert.deepStrictEqual(
        arity.lookup({ kind: "qti-sum" }),
        Option.some({ kind: "qti-sum", max: unbounded, min: 1n }),
      );
      assert.deepStrictEqual(
        arity.lookup({ kind: "qti-repeat" }),
        Option.some({ kind: "qti-repeat", max: unbounded, min: 1n }),
      );
      assert.deepStrictEqual(
        arity.lookup({ kind: "qti-base-value" }),
        Option.some({ kind: "qti-base-value", max: 0n, min: 0n }),
      );
      assert.deepStrictEqual(
        [admits("qti-sum", 0n), admits("qti-sum", 1n), admits("qti-sum", 1_000_000n)],
        [false, true, true],
      );
      assert.deepStrictEqual(
        [admits("qti-not", 0n), admits("qti-not", 1n), admits("qti-not", 2n)],
        [false, true, false],
      );
      assert.isTrue(Option.isNone(arity.lookup({ kind: "qti-assessment-item" })));
    }),
  );

  it.effect("refuses a composition that holds no code for an expression kind", () =>
    Effect.gen(function* missingKind() {
      const failure = yield* Effect.flip(
        Effect.fromResult(
          operatorArity({ kinds: NodeKind.handles.filter((kind) => kind !== "qti-sum") }),
        ),
      );

      assert.strictEqual(failure._tag, "OutsideCodeSpace");
      assert.include(failure.message, "OperatorArity has a row whose kind is qti-sum");
    }),
  );
});

if (Option.isSome(absence)) {
  it("derives OperatorArity's rows from the ASI 3.0 and 3.0.1 XSDs", (context) => {
    context.skip(`the XSD cache is incomplete: ${absence.value.message}`);
  });
}

describe.skipIf(Option.isSome(absence))("OperatorArity over the pinned XSDs", () => {
  it.effect(
    "equals the arity the deriver reads from the ASI 3.0 and 3.0.1 XSDs",
    () =>
      Effect.gen(function* derivedArity() {
        const { rows } = yield* Effect.fromResult(operatorArity(rosters));
        const versions = yield* Effect.forEach(
          ["imsqti_asiv3p0_v1p0.xsd", "imsqti_asiv3p0p1_v1p0.xsd"] as const,
          (path) =>
            Effect.flatMap(loadSchema(path), (schema) => Effect.fromResult(arityOf(schema))),
          { concurrency: "unbounded" },
        );

        for (const derived of versions) {
          assert.deepStrictEqual(Arr.sort(derived.map(arityRowOf), byKind), Arr.sort(rows, byKind));
        }
      }).pipe(Effect.provide(Layer.mergeAll(NodeServices.layer, Digest.layerWebCrypto))),
    xsdTestTimeoutMs,
  );
});

describe("BindingFit", () => {
  it.effect("is a set over base type × cardinality × kind, 11,979 bits at K = 363", () =>
    Effect.gen(function* bindingConstant() {
      const fit = yield* Effect.fromResult(bindingFit(rosters));

      assert.strictEqual(fit.cells, 11_979);
      assert.strictEqual(fit.width, 1);
      assert.strictEqual(fit.bytes, 1506);
    }),
  );

  it.effect("reproduces the 40 rows of seed/binding-fit.ts", () =>
    Effect.gen(function* bindingSeedRows() {
      const { rows } = yield* Effect.fromResult(bindingFit(rosters));

      assert.strictEqual(rows.length, 40);
      assert.deepStrictEqual(
        bindingLines(rows),
        bindingLines(
          bindingSeed.bindingFit.map(({ baseType, cardinality, interactionKind }) => ({
            baseType,
            cardinality,
            kind: interactionKind,
          })),
        ),
      );
    }),
  );

  it.effect("holds a choice interaction's identifier binding and refuses a float one", () =>
    Effect.gen(function* bindingLookups() {
      const fit = yield* Effect.fromResult(bindingFit(rosters));

      assert.isTrue(
        Option.isSome(
          fit.lookup({
            baseType: "identifier",
            cardinality: "multiple",
            kind: "qti-choice-interaction",
          }),
        ),
      );
      assert.isTrue(
        Option.isNone(
          fit.lookup({ baseType: "float", cardinality: "single", kind: "qti-choice-interaction" }),
        ),
      );
    }),
  );

  it.effect("refuses a composition whose cardinalities lack one a row names", () =>
    Effect.gen(function* missingCardinality() {
      const failure = yield* Effect.flip(
        Effect.fromResult(bindingFit({ ...rosters, cardinalities: ["single", "multiple"] })),
      );

      assert.strictEqual(failure._tag, "OutsideCodeSpace");
      assert.include(failure.message, "BindingFit has a row whose cardinality is ordered");
    }),
  );
});

describe("RecordBindingFit", () => {
  it.effect("reproduces the 2 rows of seed/record-binding-fit.ts, 363 bits", () =>
    Effect.gen(function* recordRows() {
      const fit = yield* Effect.fromResult(recordBindingFit(rosters));

      assert.deepStrictEqual(
        Arr.sort(fit.rows, byKind),
        Arr.sort(
          recordSeed.recordBindingFit.map(({ interactionKind }) => ({ kind: interactionKind })),
          byKind,
        ),
      );
      assert.strictEqual(fit.cells, 363);
      assert.strictEqual(fit.width, 1);
      assert.isTrue(Option.isNone(fit.lookup({ kind: "qti-choice-interaction" })));
    }),
  );
});

describe("MappableBaseType", () => {
  it.effect("reproduces the 9 rows of seed/mappable-base-type.ts, 11 bits", () =>
    Effect.gen(function* mappableRows() {
      const mappable = yield* Effect.fromResult(mappableBaseType(rosters));

      assert.deepStrictEqual(
        mappable.rows.map(({ baseType }) => baseType).toSorted(),
        mappableSeed.mappableBaseType.map(({ baseType }) => baseType).toSorted(),
      );
      assert.strictEqual(mappable.rows.length, 9);
      assert.strictEqual(mappable.cells, 11);
      assert.strictEqual(mappable.width, 1);
      assert.isTrue(Option.isNone(mappable.lookup({ baseType: "duration" })));
      assert.isTrue(Option.isNone(mappable.lookup({ baseType: "file" })));
    }),
  );
});

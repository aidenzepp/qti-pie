/**
 * The budget meter of grizzle's compiler, read from outside.
 *
 * Grizzle exposes no size of a compiled program, so `scripts/measure.ts` and the import's budget
 * test read what each compilation's budget meter was charged. This file is the one mechanism for
 * both: {@link watchMeters} keeps every meter a compilation makes while a scope is open, and
 * {@link measure} compiles one program and reports what its own meter was charged.
 */
import { createRequire } from "node:module";
import nodePath from "node:path";
import { pathToFileURL } from "node:url";
import { Effect, Predicate } from "effect";

/**
 * The compiler's SQL ceiling in bytes (`docs/research/d8105349.md` section 22): the limit of a
 * compilation's own meter, which tells that meter from the meters of the artifacts' lowering.
 */
export const SQL_BYTES_CEILING = 1_048_576;

/**
 * The budgets a compilation is metered against, in the order grizzle's meter reports them.
 */
export const BUDGETS = ["nodes", "fields", "sqlBytes", "params", "variants"] as const;

export type Budget = (typeof BUDGETS)[number];

/**
 * A budget meter of grizzle's engine, which the compiler charges and which answers what each
 * budget allows and how much of it has been charged.
 */
export interface Meter {
  readonly limit: (budget: Budget) => number;
  readonly used: (budget: Budget) => number;
}

/**
 * What a charge answers: whether the meter took it.
 */
interface Charged {
  readonly ok: boolean;
}

type Charging = (this: Meter, ...args: unknown[]) => Charged;

/**
 * The two methods of a meter that charge it.
 */
interface MeterPrototype {
  charge: Charging;
  chargeSql: Charging;
}

/**
 * The engine file that holds the meter class.
 */
interface EngineBudget {
  readonly BudgetMeter: { readonly prototype: MeterPrototype };
}

const isEngineBudget = (value: unknown): value is EngineBudget =>
  Predicate.hasProperty(value, "BudgetMeter") &&
  Predicate.hasProperty(value.BudgetMeter, "prototype") &&
  Predicate.hasProperty(value.BudgetMeter.prototype, "charge") &&
  Predicate.hasProperty(value.BudgetMeter.prototype, "chargeSql");

/**
 * What a compilation was charged on its own meter, and the refusal when it failed.
 */
export interface Measured {
  readonly charged: Readonly<Record<Budget, number>>;
  readonly refusal: string | undefined;
}

/**
 * Wrap the budget meter of grizzle's engine, for as long as the scope is open, so every meter a
 * compilation makes is kept.
 *
 * The class is imported from the engine's own file, which is the instance the compiler uses, and
 * its two charging methods remember the meter they ran on. Closing the scope puts the two original
 * methods back.
 *
 * @returns The set that holds each meter a charge ran on.
 */
export const watchMeters = Effect.gen(function* watchesMeters() {
  const grizzle = createRequire(import.meta.url).resolve("@bjornpagen/grizzle");
  const engine = createRequire(grizzle).resolve("@bjornpagen/grizzle-engine");
  const budget: unknown = yield* Effect.promise(
    () => import(pathToFileURL(nodePath.join(nodePath.dirname(engine), "core", "budget.js")).href),
  );
  if (!isEngineBudget(budget)) {
    return yield* Effect.die(new Error("grizzle's engine exports no BudgetMeter to watch"));
  }

  const meters = new Set<Meter>();
  const { prototype } = budget.BudgetMeter;
  const originals = { charge: prototype.charge, chargeSql: prototype.chargeSql };

  return yield* Effect.acquireRelease(
    Effect.sync(() => {
      for (const method of ["charge", "chargeSql"] as const) {
        const original = originals[method];
        prototype[method] = function charged(this: Meter, ...args: unknown[]) {
          meters.add(this);

          return original.apply(this, args);
        };
      }

      return meters;
    }),
    () =>
      Effect.sync(() => {
        prototype.charge = originals.charge;
        prototype.chargeSql = originals.chargeSql;
      }),
  );
});

/**
 * Compile `program` and report what its compilation was charged.
 *
 * @param compile - Compiles one program, as the caller's database does.
 * @param meters - The set {@link watchMeters} returned, cleared before the compilation.
 * @param program - The program to compile.
 * @returns What the compilation's own meter was charged, and the refusal when it failed.
 */
export const measure = <Program>(
  compile: (program: Program) => Effect.Effect<void, unknown>,
  meters: Set<Meter>,
  program: Program,
): Effect.Effect<Measured> =>
  Effect.gen(function* measures() {
    meters.clear();

    const result = yield* Effect.result(compile(program));
    const charged: Record<Budget, number> = {
      fields: 0,
      nodes: 0,
      params: 0,
      sqlBytes: 0,
      variants: 0,
    };
    for (const meter of meters) {
      // The compilation's own meter holds the compiler's SQL ceiling; the artifacts' lowering
      // meters have no limit on SQL.
      if (meter.limit("sqlBytes") === SQL_BYTES_CEILING) {
        for (const budget of BUDGETS) {
          charged[budget] = Math.max(charged[budget], meter.used(budget));
        }
      }
    }
    if (result._tag === "Success") {
      return { charged, refusal: undefined };
    }

    return {
      charged,
      refusal: Predicate.hasProperty(result.failure, "message")
        ? String(result.failure.message)
        : String(result.failure),
    };
  });

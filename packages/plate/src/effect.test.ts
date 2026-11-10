import { assert, describe, expectTypeOf, it } from "@effect/vitest";
import { Predicate } from "effect";
import type { Effect } from "effect";
import * as plateEffect from "#plate/effect.ts";
import * as configurationModule from "#plate/effect/configuration.ts";
import * as operations from "#plate/effect/operations.ts";
import * as randomness from "#plate/effect/randomness.ts";
import * as schemas from "#plate/effect/schemas.ts";
import * as session from "#plate/effect/session.ts";
import * as plate from "#plate/index.ts";

/**
 * The `./effect` entry's exports, by name.
 */
const entry: ReadonlyMap<string, unknown> = new Map(Object.entries(plateEffect));

/**
 * The public entry's exports, by name.
 */
const plain: ReadonlyMap<string, unknown> = new Map(Object.entries(plate));

/**
 * The names of the public entry's function values, its error classes included.
 */
const plainFunctions = [...plain].flatMap(([name, value]) =>
  Predicate.isFunction(value) ? [name] : [],
);

/**
 * The function values of `.` that `./effect` does not export under their own names, each with its
 * reason. A name is added only with its reason; none is excluded today.
 */
const excluded: ReadonlyMap<string, string> = new Map();

/**
 * The names whose `./effect` value is the Effect version of the plain function of that name: the
 * mirrors in `src/effect/operations.ts` and the session lifecycle in `src/effect/session.ts`. Every
 * other function `./effect` takes from `.` is the plain value itself.
 */
const mirrors = [
  "acceptedItem",
  "advance",
  "allowedIntents",
  "begin",
  "checkResponses",
  "current",
  "decode",
  "decodeRedacted",
  "decodeSession",
  "encodeRedacted",
  "encodeSession",
  "itemView",
  "navigationState",
  "permits",
  "redact",
  "render",
  "renderNavigation",
  "renderStatus",
  "restore",
  "results",
  "score",
  "startTest",
] as const;

/**
 * The name of one mirror.
 */
type Mirror = (typeof mirrors)[number];

/**
 * Any Effect, whatever it succeeds with, fails with or requires.
 */
type AnyEffect = Effect.Effect<unknown, unknown, unknown>;

/**
 * The exports of the modules under `src/effect/` that `./effect` re-exports, as name and value.
 */
const effectModuleExports: readonly (readonly [string, unknown])[] = [
  configurationModule,
  operations,
  randomness,
  schemas,
  session,
].flatMap((module) => Object.entries(module));

describe("the ./effect entry", () => {
  it("[mirrored or excluded] exports every function value of . under its name, or names it among the exclusions with its reason", () => {
    assert.isAbove(plainFunctions.length, mirrors.length);
    assert.deepStrictEqual(
      plainFunctions.filter((name) => !entry.has(name) && !excluded.has(name)),
      [],
    );
    assert.deepStrictEqual(
      [...excluded].flatMap(([name, reason]) =>
        plainFunctions.includes(name) && !entry.has(name) && reason.trim() !== "" ? [] : [name],
      ),
      [],
    );
  });

  it("[mirrored or excluded] replaces exactly the pinned mirrors, each the value of src/effect/operations.ts or src/effect/session.ts, and keeps every other function of . as the plain value itself", () => {
    const replaced = plainFunctions.filter(
      (name) => entry.has(name) && entry.get(name) !== plain.get(name),
    );
    const mirrorSources = { ...operations, ...session };

    assert.sameMembers(replaced, [...mirrors]);
    assert.deepStrictEqual(
      mirrors.filter((name) => entry.get(name) !== mirrorSources[name]),
      [],
    );
  });

  it("[mirrored or excluded] each mirror returns an Effect, and a plain function that cannot fail returns none (pnpm check proves it)", () => {
    type Built = ReturnType<typeof plateEffect.h>;

    expectTypeOf<{
      readonly [Name in Mirror]: ReturnType<(typeof plateEffect)[Name]>;
    }>().toExtend<Readonly<Record<Mirror, AnyEffect>>>();
    // @ts-expect-error The control: `h` builds a node, so the pin above can fail.
    expectTypeOf<Built>().toExtend<AnyEffect>();
  });

  it("[mirrored or excluded] gives Configuration another meaning: the service, whose service type is the plain Configuration type and ConfigurationSchema's", () => {
    assert.strictEqual(plateEffect.Configuration.key, "@qti-pie/plate/effect/Configuration");
    expectTypeOf<
      (typeof plateEffect.Configuration)["Service"]
    >().toEqualTypeOf<plate.Configuration>();
    expectTypeOf<
      typeof plateEffect.ConfigurationSchema.Type
    >().toEqualTypeOf<plate.Configuration>();
  });

  it("re-exports every export of the src/effect/ modules as the same value, and nothing that is in neither . nor one of them", () => {
    const known = new Set([...plain.keys(), ...effectModuleExports.map(([name]) => name)]);

    assert.deepStrictEqual(
      effectModuleExports.flatMap(([name, value]) => (entry.get(name) === value ? [] : [name])),
      [],
    );
    assert.deepStrictEqual(
      [...entry.keys()].filter((name) => !known.has(name)),
      [],
    );
  });
});

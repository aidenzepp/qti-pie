import { assert, describe, it } from "@effect/vitest";
import type { Option } from "effect";
import type { ItemRecord } from "#plate/model/record.ts";
import type { Value } from "#plate/model/values.ts";
import * as session from "#plate/session/session.ts";
import type { Intent, Responses, SessionItem, Step, TestSession } from "#plate/session/session.ts";
import { readImports, sourceModules } from "#plate/test/imports.ts";

/**
 * Whether two types are the same type, not merely assignable to each other: `true` only when the
 * checker treats `A` and `B` as identical.
 */
type Equals<A, B> =
  // oxlint-disable-next-line typescript/no-unnecessary-type-parameters -- each `T` must stay an unresolved type parameter inside its function type, so the conditional compares `A` and `B` by identity rather than by assignability.
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

/**
 * The six intents, by kind; `tsc` refuses this line when {@link Intent} gains or loses one.
 */
const intentKinds: Equals<
  Intent["kind"],
  "end-part" | "go" | "next" | "previous" | "submit-item" | "submit-part"
> = true;

/**
 * A step's responses are optional and are {@link Responses}; `tsc` refuses this line when they
 * part.
 */
const stepResponses: Equals<Step["responses"], Responses | undefined> = true;

/**
 * An item's first outcomes are optional and keyed as its record's outcomes are.
 */
const firstOutcomes: Equals<
  SessionItem["firstOutcomes"],
  Option.Option<ItemRecord["outcomes"]>
> = true;

/**
 * The stored seed is a string, always present: the host's, or the one `startTest` drew.
 */
const seed: Equals<TestSession["seed"], string> = true;

/**
 * The shuffle seed is optional, the configuration's when it had one.
 */
const shuffleSeed: Equals<TestSession["shuffleSeed"], Option.Option<string>> = true;

/**
 * The test's outcomes map an identifier to a value, as an item's do, and the runs that set them
 * are counted.
 */
const testOutcomes: Equals<
  Pick<TestSession, "outcomeRuns" | "outcomes">,
  { readonly outcomeRuns: number; readonly outcomes: Readonly<Record<string, Value>> }
> = true;

/**
 * An item's template defaults are optional and map an identifier to a value.
 */
const templateDefaults: Equals<
  SessionItem["templateDefaults"],
  Option.Option<Readonly<Record<string, Value>>>
> = true;

/**
 * Responses map an identifier to a value.
 */
const responses: Equals<Responses, Readonly<Record<string, Value>>> = true;

describe("the test session's types", () => {
  it("are the shapes the session codec and the transitions rely on", () => {
    assert.isTrue(
      intentKinds &&
        stepResponses &&
        firstOutcomes &&
        seed &&
        shuffleSeed &&
        testOutcomes &&
        templateDefaults &&
        responses,
    );
  });

  it("are plain types: the module exports no value and imports only types", () => {
    const source = sourceModules().get("src/session/session.ts") ?? "";
    const { imports, unreadable } = readImports(source);

    assert.deepStrictEqual(Object.keys(session), []);
    assert.deepStrictEqual(unreadable, []);
    assert.deepStrictEqual(
      imports.filter((declaration) => !declaration.typeOnly).map(({ specifier }) => specifier),
      [],
    );
  });
});

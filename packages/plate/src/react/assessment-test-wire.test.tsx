/**
 * The React test-server wire as the contract types it and `assessment-test-provider.tsx` stubs it:
 * a hook called outside an `AssessmentTestProvider` fails with `NoAssessmentTestProvider` naming
 * the hook, `fetchTransport` gives an `AssessmentTestTransport` whose requests fail the way the
 * layer's other stubs fail, and `AssessmentTestServerOptions` carries the host's session naming and
 * clock.
 */
import { assert, describe, expectTypeOf, it } from "@effect/vitest";
import { Effect } from "effect";
import type { SavedResponsesJson } from "#plate/codec/session.ts";
import type { ItemViewPayloadSchema } from "#plate/codec/view.ts";
import type {
  AssessmentTestServerOptions,
  AssessmentTestTransport,
  ItemViewPayload,
  Posted,
} from "#plate/react/contract.tsx";
import {
  fetchTransport,
  NoAssessmentTestProvider,
  NotImplemented,
} from "#plate/react/assessment-test-provider.tsx";

describe("NoAssessmentTestProvider", () => {
  it("is a tagged error whose message names the hook", () => {
    const error = new NoAssessmentTestProvider({ hook: "useCurrentItem" });

    assert.strictEqual(error._tag, "NoAssessmentTestProvider");
    assert.include(error.message, "useCurrentItem");
    assert.include(error.message, "AssessmentTestProvider");
  });
});

describe("fetchTransport", () => {
  it.effect("gives a transport whose view rejects with NotImplemented naming m3g-06", () =>
    Effect.gen(function* viewRejects() {
      const transport = fetchTransport("/test");
      const rejected = yield* Effect.flip(Effect.tryPromise(() => transport.view()));

      assert.instanceOf(rejected.cause, NotImplemented);
      assert.strictEqual(rejected.cause.issue, "m3g-06");
    }),
  );
});

describe("AssessmentTestServerOptions", () => {
  it("names the session from the request and takes the clock", () => {
    expectTypeOf<AssessmentTestServerOptions["sessionOf"]>().toEqualTypeOf<
      (request: Request) => string
    >();
    expectTypeOf<AssessmentTestServerOptions["now"]>().toEqualTypeOf<(() => Date) | undefined>();
  });
});

describe("ItemViewPayload", () => {
  it("[W0-AN.2] ItemViewPayload carries disabled, values and an optional posted", () => {
    expectTypeOf<ItemViewPayload["disabled"]>().toEqualTypeOf<boolean>();
    expectTypeOf<ItemViewPayload["values"]>().toEqualTypeOf<SavedResponsesJson>();
    expectTypeOf<ItemViewPayload["posted"]>().toEqualTypeOf<
      Readonly<Record<string, readonly string[]>> | undefined
    >();
  });

  it("[W0-AN.2] the view codec's Schema type is the contract's ItemViewPayload", () => {
    expectTypeOf<typeof ItemViewPayloadSchema.Type>().toEqualTypeOf<ItemViewPayload>();
  });
});

describe("AssessmentTestTransport", () => {
  it("[W0-AN.2] the transport's view is typed to the wire", () => {
    expectTypeOf<ReturnType<AssessmentTestTransport["view"]>>().toEqualTypeOf<Promise<Posted>>();
  });
});

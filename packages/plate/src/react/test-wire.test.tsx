/**
 * The React test-server wire as the contract types it and `test-provider.tsx` stubs it: a hook
 * called outside a `TestProvider` fails with `NoTestProvider` naming the hook, `fetchTransport`
 * gives a `TestTransport` whose requests fail the way the layer's other stubs fail, and
 * `TestServerOptions` carries the host's session naming and clock.
 */
import { assert, describe, expectTypeOf, it } from "@effect/vitest";
import { Effect } from "effect";
import type { TestServerOptions } from "#plate/react/contract.tsx";
import { fetchTransport, NoTestProvider, NotImplemented } from "#plate/react/test-provider.tsx";

describe("NoTestProvider", () => {
  it("is a tagged error whose message names the hook", () => {
    const error = new NoTestProvider({ hook: "useCurrentItem" });

    assert.strictEqual(error._tag, "NoTestProvider");
    assert.include(error.message, "useCurrentItem");
    assert.include(error.message, "TestProvider");
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

describe("TestServerOptions", () => {
  it("names the session from the request and takes the clock", () => {
    expectTypeOf<TestServerOptions["sessionOf"]>().toEqualTypeOf<(request: Request) => string>();
    expectTypeOf<TestServerOptions["now"]>().toEqualTypeOf<(() => Date) | undefined>();
  });
});

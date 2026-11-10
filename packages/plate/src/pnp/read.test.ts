import { assert, describe, it } from "@effect/vitest";
import { Cause, Effect, Exit } from "effect";
import { PnpNotImplemented, readPnp } from "#plate/pnp/read.ts";

describe("readPnp, a stub", () => {
  it.effect("dies with PnpNotImplemented for any bytes, naming issue m4-01, and never fails", () =>
    Effect.gen(function* stubDies() {
      const exit = yield* Effect.exit(readPnp(new TextEncoder().encode("<accessForAllUser/>")));
      if (Exit.isSuccess(exit)) {
        assert.fail("readPnp succeeded");
      }

      const defect = Cause.squash(exit.cause);
      if (!(defect instanceof PnpNotImplemented)) {
        assert.fail("readPnp did not die with PnpNotImplemented");
      }

      assert.isFalse(Cause.hasFails(exit.cause));
      assert.include(defect.message, "m4-01");
    }),
  );
});

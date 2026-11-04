import { Effect } from "effect";

/**
 * Run `effect` with Node's `Buffer` removed from the global scope, then put it back.
 *
 * Crust runs in browsers, which have no `Buffer`, so a test that wants to prove a code path works
 * there runs that path under this. The global is restored whether `effect` succeeds, fails or is
 * interrupted. Build any input that needs `Buffer` or a Node service before entering it.
 */
export const withoutBuffer = <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
  Effect.acquireUseRelease(
    Effect.sync(() => {
      const saved = Object.getOwnPropertyDescriptor(globalThis, "Buffer");
      Reflect.deleteProperty(globalThis, "Buffer");

      return saved;
    }),
    () => effect,
    (saved) =>
      Effect.sync(() => {
        if (saved !== undefined) {
          Object.defineProperty(globalThis, "Buffer", saved);
        }
      }),
  );

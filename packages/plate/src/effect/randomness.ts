/**
 * The randomness the `./effect` operations draw from: {@link Randomness}, with {@link drawnSeed}.
 *
 * `drawnSeed` is the Effect counterpart of `drawSeed` (`#plate/seed.ts`): the same format, drawn
 * from a service a host or a test can replace, where the plain function reads
 * `crypto.getRandomValues` directly. plate draws no instance: the host names every one. Nothing
 * outside `src/effect/` imports this module.
 *
 * @module
 */
import { Context, Effect } from "effect";
import { SecureRandom } from "effect/crypto";

/**
 * The source of every random byte the `./effect` operations draw: a reference of Effect's
 * `SecureRandom` service shape, keyed `@qti-pie/plate/effect/Randomness`.
 *
 * It is a `Context.Reference`, not a required service, so it adds nothing to an operation's
 * requirements: an operation runs with no layer and draws from the default, which takes bytes from
 * `crypto.getRandomValues`, as `#plate/seed.ts` does, which a browser gives in every context. The
 * default draws at most 65,536 bytes a call, the `getRandomValues` limit, beyond which the draw
 * dies; plate draws 16. A host or a test replaces it with `Effect.provideService(Randomness,
 * SecureRandom.make(source))`, whose `source` returns a fresh array of exactly the size it is asked
 * for.
 *
 * `SecureRandom` is `@stability unstable` in Effect. Effect is pinned to 4.1.2, and the gate pull
 * request of a re-pin runs `randomness.test.ts`, which pins the seed's format under the default and
 * under a fixed byte source.
 */
export const Randomness = Context.Reference<SecureRandom.SecureRandom["Service"]>(
  "@qti-pie/plate/effect/Randomness",
  { defaultValue: () => SecureRandom.make((size) => crypto.getRandomValues(new Uint8Array(size))) },
);

/**
 * The number of random bytes a drawn seed holds: 16, so 128 bits, as `drawSeed`'s.
 */
const seedBytes = 16;

/**
 * Write bytes as lowercase hex, two digits a byte.
 *
 * @param bytes The bytes to write.
 * @returns Twice as many lowercase hex digits as there are bytes.
 */
const lowercaseHex = (bytes: Uint8Array): string =>
  Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");

/**
 * Draw a fresh seed through {@link Randomness}: 16 bytes written as 32 lowercase hex digits, the
 * format of `drawSeed` (`#plate/seed.ts`).
 *
 * A seed keys every value template and response processing draw, so it is a secret: it never goes
 * into a span attribute, a log or a recorded failure.
 */
export const drawnSeed: Effect.Effect<string> = Randomness.use((random) =>
  Effect.map(random.randomBytes(seedBytes), lowercaseHex),
);

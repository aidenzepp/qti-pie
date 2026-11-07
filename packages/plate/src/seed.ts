/**
 * Draw a seed when the host gives none: {@link drawSeed}.
 *
 * This is the one place plate draws a seed, at a boundary, as `render` draws an instance: `begin`
 * and `startTest` call it when the host passes no seed, and `score` when it starts an item with no
 * record. The engine never calls it: it takes the seed it is given. The module imports nothing;
 * `crypto` is the global Web Crypto object, which Node and every browser page give.
 *
 * @module
 */

/**
 * The number of random bytes a drawn seed holds: 16, so 128 bits.
 */
const seedBytes = 16;

/**
 * Draw a fresh seed: 16 bytes from `crypto.getRandomValues`, written as 32 lowercase hex digits.
 *
 * A seed keys every value template and response processing draw (the HMAC-SHA-256 stream of
 * `#plate/engine/random.ts`), so it is the secret behind them: 128 random bits leave nothing to
 * guess. `crypto.randomUUID` is not used, because a browser gives it only in a secure context, and
 * the session modules run in pages.
 *
 * @example
 *   drawSeed(); // "3f9c0a1be47d52c6908e1f2a7b3d4c5e", another every call
 *
 * @returns 32 lowercase hex digits.
 */
export const drawSeed = (): string =>
  Array.from(crypto.getRandomValues(new Uint8Array(seedBytes)), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");

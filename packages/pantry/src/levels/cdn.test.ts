/**
 * The single-CDN level's builder: `singleCdn` extends its base with a level named `Cdn`, once per
 * base and origin, and `CdnOptions` admits only an origin as the URL Standard serializes it.
 */
import { schemaNameOf } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Exit, Schema } from "effect";
import { CdnOptions, singleCdn } from "#pantry/levels/cdn.ts";
import { qti } from "#pantry/qti/schema.ts";

/**
 * The origin the tests build the level for.
 */
const origin = "https://cdn.example.com/";

/**
 * Decode an origin with the level's options schema.
 *
 * @param candidate - The origin to decode.
 * @returns The decode's exit.
 */
const decodeOrigin = (candidate: string) =>
  Schema.decodeUnknownExit(CdnOptions)({ origin: candidate });

describe("singleCdn", () => {
  it("names the level cdn, the PostgreSQL schema it installs into", () => {
    // Oracle: spec U12, `schema.extend(base, "Cdn", ...)`; GOAL G2, each level is its own
    // PostgreSQL schema, named for the level.
    assert.strictEqual(schemaNameOf(singleCdn(qti(), { origin })), "cdn");
  });

  it("gives the same level for the same base and origin", () => {
    // Oracle: spec U12, "memoized by base and origin".
    assert.strictEqual(singleCdn(qti(), { origin }), singleCdn(qti(), { origin }));
  });
});

describe("CdnOptions", () => {
  it("admits an https origin with the root path", () => {
    assert.isTrue(Exit.isSuccess(decodeOrigin(origin)));
  });

  it("refuses an http origin and an origin without its root path", () => {
    // Oracle: #55's CdnOrigin (`src/db/install.ts`): an `https://` origin and one slash after it.
    assert.isTrue(Exit.isFailure(decodeOrigin("http://cdn.example.com/")));
    assert.isTrue(Exit.isFailure(decodeOrigin("https://cdn.example.com")));
  });
});

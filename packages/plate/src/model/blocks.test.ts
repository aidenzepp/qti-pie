import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { assert, describe, it } from "@effect/vitest";
import { Config, Effect, Result } from "effect";
import committed from "#plate/model/blocks.generated.json" with { type: "json" };
import { blocks, generateBlocks, xsdPart2CachePath, xsdPart2Sha256 } from "#plate/model/blocks.ts";
import { checkAllowlist, sourceModules } from "#plate/test/imports.ts";

/**
 * Where XML Schema 1.0 Part 2 is cached under `HOME`.
 */
const xsdPart2Path = Config.String("HOME").pipe(
  Config.map((home) => `${home}/${xsdPart2CachePath}`),
);

/**
 * The cached Recommendation's bytes.
 */
const xsdPart2Bytes = Effect.gen(function* readXsdPart2() {
  const path = yield* xsdPart2Path;

  return yield* Effect.tryPromise(() => readFile(path));
});

/**
 * Reading the 644 KB Recommendation and its table stays well under this, even on a busy machine.
 */
const generateTimeoutMs = 30_000;

describe("model/blocks.ts", () => {
  it.effect(
    "the committed table is what the generator reads from the cached Recommendation",
    () =>
      Effect.gen(function* regenerateNoDiff() {
        const html = new TextDecoder().decode(yield* xsdPart2Bytes);
        const generated = yield* Effect.fromResult(generateBlocks(html));

        assert.deepStrictEqual(generated, committed);
      }),
    generateTimeoutMs,
  );

  it.effect("the cached Recommendation is the one the table was generated from", () =>
    Effect.gen(function* xsdPart2Digest() {
      const bytes = yield* xsdPart2Bytes;

      assert.strictEqual(
        xsdPart2Sha256,
        "980de872aa2c50013d5202176eb85eef3f183a7df635fdcb6b4aa34c1c12eb72",
      );
      assert.strictEqual(createHash("sha256").update(bytes).digest("hex"), xsdPart2Sha256);
    }),
  );

  it("BasicLatin is U+0000 to U+007F", () => {
    assert.deepStrictEqual(blocks.get("BasicLatin"), [{ first: 0x00_00, last: 0x00_7f }]);
  });

  it("Specials, listed twice, keeps both ranges", () => {
    assert.deepStrictEqual(blocks.get("Specials"), [
      { first: 0xfe_ff, last: 0xfe_ff },
      { first: 0xff_f0, last: 0xff_fd },
    ]);
  });

  it("there are 85 rows over 84 distinct names", () => {
    assert.strictEqual(committed.length, 85);
    assert.strictEqual([...blocks.values()].flat().length, 85);
    assert.strictEqual(blocks.size, 84);
  });

  it("the generator refuses a text with no IsBlock production", () => {
    const refused = generateBlocks("<html><body><p>Not the Recommendation.</p></body></html>");

    assert.isTrue(Result.isFailure(refused) && refused.failure.reason === "production");
  });

  it("blocks.ts's imports pass the browser allowlist with it as a root", () => {
    const table = readFileSync(
      new URL(import.meta.resolve("#plate/model/blocks.generated.json")),
      "utf-8",
    );
    // `sourceModules` reads only `.ts` files; the table is JSON and imports nothing.
    const modules = new Map([...sourceModules(), ["src/model/blocks.generated.json", table]]);

    assert.deepStrictEqual(checkAllowlist(modules, ["src/model/blocks.ts"]), []);
  });
});

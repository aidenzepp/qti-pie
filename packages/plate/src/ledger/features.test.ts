import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import {
  confPath,
  exclusions,
  families,
  features,
  generateFeatures,
} from "#plate/ledger/features.ts";

/**
 * The conformance text's bytes, read from the cache under `HOME`.
 */
const confBytes = Effect.gen(function* readConf() {
  const path = yield* confPath;

  return yield* Effect.tryPromise(() => readFile(path));
});

/**
 * The conformance text, decoded as UTF-8.
 */
const confText = confBytes.pipe(Effect.map((bytes) => new TextDecoder().decode(bytes)));

/**
 * How many Appendix A rows each family has, the goal's baseline.
 */
const familyCounts = { A: 58, I: 22, M: 10, P: 13, Q: 23, S: 10, T: 14 } as const;

describe("ledger/features.ts", () => {
  it.effect("the committed file has the 150 rows the generator reads from conf.txt", () =>
    Effect.gen(function* regenerateNoDiff() {
      const generated = generateFeatures(yield* confText);

      assert.lengthOf(features, 150);
      assert.deepStrictEqual(features, generated);
    }),
  );

  it.effect("conf.txt is the conformance text the file was generated from", () =>
    Effect.gen(function* confDigest() {
      const bytes = yield* confBytes;

      assert.strictEqual(
        createHash("sha256").update(bytes).digest("hex"),
        "5400bd7d41a3a35f0e265422366b383f661cd5abc6b13357315df5d86e905a80",
      );
    }),
  );

  it("each family has the goal's count of rows", () => {
    const counts = Object.fromEntries(
      families.map((family) => [family, features.filter((row) => row.family === family).length]),
    );

    assert.deepStrictEqual(counts, familyCounts);
    assert.lengthOf(features, 150);
  });

  it("every excluded ID is a row of the file", () => {
    const ids = new Set(features.map((row) => row.id));

    for (const exclusion of exclusions) {
      assert.isTrue(ids.has(exclusion.id), exclusion.id);
    }
  });

  it("every ID is a family letter, a number and an optional suffix letter", () => {
    for (const row of features) {
      assert.match(row.id, /^[QITSAPM]-[0-9]+[a-z]?$/u);
    }
  });
});

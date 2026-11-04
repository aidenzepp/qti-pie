import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { ConfigProvider, Effect } from "effect";
import { browserSupport } from "#plate/ledger/browser-support.ts";
import { readWebFeatures, webFeaturesPath, webFeaturesSha256 } from "#plate/test/baseline.ts";
import type { WebFeatures } from "#plate/test/baseline.ts";

/**
 * A home folder that holds no `.cache/gr8des`, under the package's git-ignored `work/`. Nothing
 * creates it, so no cache can be found below it.
 */
const noCache = path.resolve(import.meta.dirname, "..", "..", "work", "no-cache");

/**
 * The data's entry for a feature id, when the id names a feature rather than a moved or split one.
 *
 * @param data The decoded web-features data.
 * @param id A web-features feature id.
 * @returns The entry, or `undefined` when the data holds no feature by that id.
 */
const featureEntry = (data: WebFeatures, id: string) => {
  const entry = data.features[id];

  return entry?.kind === "feature" ? entry : undefined;
};

/**
 * The note status that stands for each baseline below the floor.
 */
const noteStatus = { false: "limited", low: "low" } as const;

describe("test/baseline.ts", () => {
  it.effect("the cached data is web-features 3.45.0, the digest the floor is pinned to", () =>
    Effect.gen(function* dataDigest() {
      const file = yield* webFeaturesPath;
      const bytes = yield* Effect.tryPromise(() => readFile(file));

      assert.strictEqual(createHash("sha256").update(bytes).digest("hex"), webFeaturesSha256);
    }),
  );

  it.effect("the data decodes, with each compatibility key's own baseline", () =>
    Effect.gen(function* decodes() {
      const data = yield* readWebFeatures;
      const has = featureEntry(data, "has");
      const accentColor = featureEntry(data, "accent-color");

      assert.isDefined(has);
      assert.isDefined(accentColor);
      assert.include(has?.compat_features ?? [], "css.selectors.has");
      assert.strictEqual(has?.status.by_compat_key?.["css.selectors.has"]?.baseline, "high");
      assert.strictEqual(
        accentColor?.status.by_compat_key?.["css.properties.accent-color"]?.baseline,
        false,
      );
    }),
  );

  it.effect("the data decodes its moved and split ids", () =>
    Effect.gen(function* redirects() {
      const data = yield* readWebFeatures;
      const kinds = new Set(Object.values(data.features).map((entry) => entry.kind));

      assert.deepStrictEqual([...kinds].toSorted(), ["feature", "moved", "split"]);
    }),
  );

  it.effect("a home with no cache fails with WebFeaturesUnreadable, naming the file", () =>
    Effect.gen(function* noCacheFails() {
      const error = yield* Effect.flip(
        readWebFeatures.pipe(
          Effect.provide(ConfigProvider.layer(ConfigProvider.fromUnknown({ HOME: noCache }))),
        ),
      );

      assert.strictEqual(error._tag, "WebFeaturesUnreadable");

      if (error._tag === "WebFeaturesUnreadable") {
        assert.isTrue(error.path.endsWith("web-features-data.json"), error.path);
        assert.isTrue(error.path.startsWith(noCache), error.path);
      }
    }),
  );

  it.effect("every browser-support row names a feature below the floor, by its own baseline", () =>
    Effect.gen(function* notesBelowFloor() {
      const data = yield* readWebFeatures;

      for (const row of browserSupport) {
        const entry = featureEntry(data, row.feature);

        assert.isDefined(entry, `web-features 3.45.0 holds no feature ${row.feature}`);

        const baseline = entry?.status.baseline;

        assert.notStrictEqual(baseline, "high", `${row.feature} is at the floor; drop its row`);
        assert.strictEqual(
          row.status,
          baseline === false ? noteStatus.false : noteStatus.low,
          row.feature,
        );
      }
    }),
  );
});

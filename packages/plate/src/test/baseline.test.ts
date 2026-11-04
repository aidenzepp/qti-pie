import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { ConfigProvider, Effect, Option } from "effect";
import { browserSupport } from "#plate/ledger/browser-support.ts";
import type { SupportNote } from "#plate/ledger/browser-support.ts";
import {
  bcdKeys,
  checkFloor,
  readWebFeatures,
  webFeaturesPath,
  webFeaturesSha256,
} from "#plate/test/baseline.ts";
import type { FloorViolation, WebFeatures } from "#plate/test/baseline.ts";
import { scanSheet, uses } from "#plate/test/css.ts";
import type { Use } from "#plate/test/css.ts";

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

/**
 * Scan an in-memory stylesheet and hold its uses to the floor in the pinned data.
 *
 * @param css The stylesheet's text.
 * @param notes The note rows the check reads.
 * @returns The violations `checkFloor` reports.
 */
const floorOf = Effect.fnUntraced(function* floorOf(css: string, notes: readonly SupportNote[]) {
  const sheet = yield* scanSheet(css);
  const data = yield* readWebFeatures;

  return checkFloor(uses(sheet), data, notes);
});

/**
 * The note row that admits `accent-color`, whose baseline is `false` in web-features 3.45.0.
 */
const accentColorNote: SupportNote = {
  degrade: "The browser's own accent colour draws the control.",
  feature: "accent-color",
  status: "limited",
};

/**
 * A use, for the key mapping's cases.
 *
 * @param kind The kind of feature.
 * @param name The feature's name.
 * @param property The declaration's property, for a `value` use.
 * @returns The use.
 */
const use = (kind: Use["kind"], name: string, property?: string): Use => ({
  kind,
  name,
  property: Option.fromUndefinedOr(property),
});

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

  it("bcdKeys maps each kind of use to its keys, px and an unmapped function to none", () => {
    const cases: readonly (readonly [Use, readonly string[]])[] = [
      [use("property", "Clip-Path"), ["css.properties.clip-path"]],
      [use("value", "grid", "display"), ["css.properties.display.grid"]],
      [use("selector", "child"), ["css.selectors.child"]],
      [use("pseudo-class", "focus-visible"), ["css.selectors.focus-visible"]],
      [use("pseudo-element", "before"), ["css.selectors.before"]],
      [use("at-rule", "media"), ["css.at-rules.media"]],
      [use("media-feature", "forced-colors"), ["css.at-rules.media.forced-colors"]],
      [use("function", "inset"), ["css.types.basic-shape.inset"]],
      [use("function", "oklch"), ["css.types.color.oklch"]],
      [use("unit", "lh"), ["css.types.length.lh"]],
      [use("unit", "%"), ["css.types.percentage"]],
      [use("unit", "px"), []],
      [use("function", "repeat"), []],
      [use("unit", "fr"), []],
    ];

    for (const [input, keys] of cases) {
      assert.deepStrictEqual(bcdKeys(input), keys, `${input.kind} ${input.name}`);
    }
  });

  it.effect(
    "a sheet of widely available features holds the floor, inset mapped and px allowed",
    () =>
      Effect.gen(function* holdsFloor() {
        const violations = yield* floorOf(
          ":where(a:has(:checked)) { color: color-mix(in oklab, red 50%, blue); clip-path: inset(50%); width: 1px; font: inherit }",
          [],
        );

        assert.deepStrictEqual(violations, []);
      }),
  );

  it.effect("accent-color is below the floor without its note row, and holds it with one", () =>
    Effect.gen(function* accentColor() {
      const css = "a { accent-color: red }";
      const expected: FloorViolation = {
        feature: Option.some("accent-color"),
        key: "css.properties.accent-color",
        kind: "below-floor",
      };

      assert.deepStrictEqual(yield* floorOf(css, []), [expected]);
      assert.deepStrictEqual(yield* floorOf(css, [accentColorNote]), []);
    }),
  );

  it.effect("::marker is below the floor", () =>
    Effect.gen(function* marker() {
      const expected: FloorViolation = {
        feature: Option.some("marker"),
        key: "css.selectors.marker",
        kind: "below-floor",
      };

      assert.deepStrictEqual(yield* floorOf("a::marker { color: red }", []), [expected]);
    }),
  );

  it.effect("an invented property is an unknown key", () =>
    Effect.gen(function* unknownKey() {
      const expected: FloorViolation = {
        feature: Option.none(),
        key: "css.properties.made-up-property",
        kind: "unknown-key",
      };

      assert.deepStrictEqual(yield* floorOf("a { made-up-property: 1px }", []), [expected]);
    }),
  );

  it.effect("an invented function is unmapped", () =>
    Effect.gen(function* unmapped() {
      const expected: FloorViolation = { feature: Option.none(), key: "made-up", kind: "unmapped" };

      assert.deepStrictEqual(yield* floorOf("a { width: made-up(1px) }", []), [expected]);
    }),
  );

  it.effect("a note row no use reaches is stale", () =>
    Effect.gen(function* staleNote() {
      const expected: FloorViolation = {
        feature: Option.some("accent-color"),
        key: "",
        kind: "stale-note",
      };

      assert.deepStrictEqual(yield* floorOf("a { color: red }", [accentColorNote]), [expected]);
    }),
  );
});

/**
 * The stylesheets' floor check and the pinned web-features data it reads.
 *
 * The floor is Baseline widely available, read from web-features 3.45.0's `data.json`, cached
 * outside the repository at `~/.cache/gr8des/renderer-research/web/web-features-data.json` and
 * pinned by its digest, {@link webFeaturesSha256}. {@link bcdKeys} maps each use the CSS scanner
 * reads to its browser-compat-data keys, and {@link checkFloor} holds those keys to the floor.
 * Test support: only tests import it, and nothing here fetches or writes the data.
 *
 * @module
 */
/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown. */
import { readFile } from "node:fs/promises";
import { Config, Effect, Option, Schema } from "effect";
import type { SupportNote } from "#plate/ledger/browser-support.ts";
import type { Use } from "#plate/test/css.ts";

/**
 * Where the web-features data is cached:
 * `.cache/gr8des/renderer-research/web/web-features-data.json` under `HOME`.
 */
export const webFeaturesPath: Config.Config<string> = Config.String("HOME").pipe(
  Config.map((home) => `${home}/.cache/gr8des/renderer-research/web/web-features-data.json`),
);

/**
 * The sha256 of web-features 3.45.0's `data.json`, the data the floor is read from. Refreshing
 * the data is a deliberate edit of this constant, together with the cached file.
 */
export const webFeaturesSha256 = "bcda8f1fd702fd2c7cc71779d35430022cf57b56dcd9415f3bb8ee14486eb3b4";

/**
 * A Baseline status: `high` (widely available), `low` (newly available), or `false` (limited).
 */
const Baseline = Schema.Literals(["high", "low", false]);

/**
 * A feature id's entry: a feature, with the compatibility keys it lists and their baselines, or an
 * id that `moved` to another feature or was `split` into several.
 */
const Entry = Schema.Union([
  Schema.Struct({
    compat_features: Schema.optionalKey(Schema.Array(Schema.String)),
    kind: Schema.Literal("feature"),
    status: Schema.Struct({
      baseline: Baseline,
      by_compat_key: Schema.optionalKey(
        Schema.Record(Schema.String, Schema.Struct({ baseline: Baseline })),
      ),
    }),
  }),
  Schema.Struct({ kind: Schema.Literals(["moved", "split"]) }),
]);

/**
 * The Schema of the web-features data, reduced to what the floor needs: `features`, from feature
 * id to its {@link Entry}. Every other key, at any depth, is ignored.
 */
// oxlint-disable-next-line eslint/no-redeclare -- `WebFeatures` is the Schema and the type of the data under one name, the interface the phase's slice list fixes, so a decoder and a signature read as one thing.
export const WebFeatures = Schema.Struct({
  features: Schema.Record(Schema.String, Entry),
});

/**
 * The web-features data, as {@link WebFeatures} decodes it.
 */
export type WebFeatures = typeof WebFeatures.Type;

/**
 * The failure of a read that finds no readable web-features data at {@link webFeaturesPath}.
 */
export class WebFeaturesUnreadable extends Schema.TaggedError<WebFeaturesUnreadable>()(
  "WebFeaturesUnreadable",
  { path: Schema.String },
) {
  /**
   * The path tried and the two ways to supply the data.
   */
  override get message(): string {
    return `Cannot read ${this.path}. Fetch web-features 3.45.0's data.json (npm package web-features@3.45.0) there, or set HOME to the home folder that holds .cache/gr8des.`;
  }
}

/**
 * Decode the text of a web-features `data.json`.
 */
const decodeWebFeatures = Schema.decodeUnknownEffect(Schema.fromJsonString(WebFeatures));

/**
 * Read and decode the cached web-features data.
 *
 * Fails with {@link WebFeaturesUnreadable} when no file can be read at {@link webFeaturesPath},
 * with a `SchemaError` when the file is not JSON of the {@link WebFeatures} shape, and with a
 * `ConfigError` when `HOME` is not set. It does not check the digest; the floor's test does.
 */
export const readWebFeatures: Effect.Effect<
  WebFeatures,
  WebFeaturesUnreadable | Schema.SchemaError | Config.ConfigError
> = Effect.gen(function* readWebFeatures() {
  const path = yield* webFeaturesPath;

  yield* Effect.annotateCurrentSpan("webFeatures.path", path);

  const text = yield* Effect.tryPromise({
    catch: () => new WebFeaturesUnreadable({ path }),
    try: () => readFile(path, "utf-8"),
  });

  return yield* decodeWebFeatures(text);
}).pipe(Effect.withSpan("readWebFeatures"));

/**
 * The closed table of value functions and units the floor maps, each to its compatibility keys.
 *
 * It holds the functions and units the package's stylesheets use and no others (the Mind's ruling,
 * task `e29d65c9`), so a function or unit missing from it fails the floor as `unmapped`. Adding a
 * row is a deliberate edit, made with the stylesheet rule that needs it. `px` maps to no key, as
 * web-features 3.45.0 holds none for it: the table's one explicit allowance.
 */
const valueTypeKeys = {
  function: new Map<string, readonly string[]>([
    ["calc", ["css.types.calc"]],
    ["color-mix", ["css.types.color.color-mix"]],
    ["counter", ["css.types.counter"]],
    ["inset", ["css.types.basic-shape.inset"]],
    ["oklch", ["css.types.color.oklch"]],
    ["var", ["css.types.var"]],
  ]),
  unit: new Map<string, readonly string[]>([
    ["%", ["css.types.percentage"]],
    ["ch", ["css.types.length.ch"]],
    ["em", ["css.types.length.em"]],
    ["lh", ["css.types.length.lh"]],
    ["px", []],
    ["rem", ["css.types.length.rem"]],
  ]),
};

/**
 * Map one use the scanner reads to the browser-compat-data keys the floor holds it to.
 *
 * A property is `css.properties.<property>`, and a keyword in its value
 * `css.properties.<property>.<keyword>`, with the property in lowercase; a selector kind, a
 * pseudo-class or a pseudo-element is `css.selectors.<name>`; an at-rule is `css.at-rules.<name>`;
 * a media feature is `css.at-rules.media.<feature>`; a value function or unit goes through the
 * closed {@link valueTypeKeys} table.
 *
 * @param use A use, from `uses` in `src/test/css.ts`.
 * @returns The use's keys: none for `px`, and none for a function or unit the table does not hold,
 *   which the floor reports as `unmapped`.
 */
export const bcdKeys = (use: Use): readonly string[] => {
  switch (use.kind) {
    case "property": {
      return [`css.properties.${use.name.toLowerCase()}`];
    }
    case "value": {
      return Option.match(use.property, {
        onNone: () => [],
        onSome: (property) => [`css.properties.${property.toLowerCase()}.${use.name}`],
      });
    }
    case "selector":
    case "pseudo-class":
    case "pseudo-element": {
      return [`css.selectors.${use.name}`];
    }
    case "at-rule": {
      return [`css.at-rules.${use.name}`];
    }
    case "media-feature": {
      return [`css.at-rules.media.${use.name}`];
    }
    case "function":
    case "unit": {
      return valueTypeKeys[use.kind].get(use.name) ?? [];
    }
    default: {
      return use.kind satisfies never;
    }
  }
};

/**
 * One way a stylesheet's uses miss the floor, Baseline widely available.
 */
export interface FloorViolation {
  /**
   * The web-features feature id: the feature that lists the key, for `below-floor`; the note
   * row's feature, for `stale-note`; none otherwise.
   */
  readonly feature: Option.Option<string>;
  /**
   * The compatibility key; the function or unit's name, for `unmapped`; empty, for `stale-note`,
   * which no key reaches.
   */
  readonly key: string;
  /**
   * What is wrong: a key no feature lists (`unknown-key`); a key below `high` whose feature has no
   * note row (`below-floor`); a note row no key reaches (`stale-note`); or a value function or unit
   * the closed table does not map (`unmapped`).
   */
  readonly kind: "unknown-key" | "below-floor" | "stale-note" | "unmapped";
}

/**
 * Where the data puts one compatibility key: the feature that lists it and the key's own baseline.
 */
interface Listing {
  readonly baseline: typeof Baseline.Type;
  readonly feature: string;
}

/**
 * Index every compatibility key the data lists, with its own status, to its feature.
 *
 * No `css.*` key is listed by two features in web-features 3.45.0; were one listed twice, the
 * first listing would stand. A key listed without its own status in `by_compat_key` is left out,
 * so the floor finds it unknown rather than guess its baseline.
 *
 * @param data The web-features data.
 * @returns Each listed key, to its feature and its baseline.
 */
const listings = (data: WebFeatures): ReadonlyMap<string, Listing> => {
  const index = new Map<string, Listing>();
  for (const [feature, entry] of Object.entries(data.features)) {
    if (entry.kind === "feature") {
      for (const key of entry.compat_features ?? []) {
        const baseline = entry.status.by_compat_key?.[key]?.baseline;
        if (baseline !== undefined && !index.has(key)) {
          index.set(key, { baseline, feature });
        }
      }
    }
  }

  return index;
};

/**
 * Decide whether the closed table maps a use's value function or unit.
 *
 * @param use A use.
 * @returns `false` for a function or unit the table does not hold; `true` for every other use.
 */
const mapped = (use: Use): boolean =>
  (use.kind !== "function" && use.kind !== "unit") || valueTypeKeys[use.kind].has(use.name);

/**
 * Hold a stylesheet's uses to the floor, Baseline widely available, in the pinned data.
 *
 * Each key is indexed to the feature whose `compat_features` lists it, and its baseline is that
 * feature's `status.by_compat_key[key]`. `high` passes; `low` or `false` passes only when a note
 * row names the feature. A key no feature lists is unknown, except a value keyword's key, which is
 * dropped, so `font: inherit` adds nothing. A note row whose feature no key reaches is stale.
 *
 * @param uses The stylesheet's uses, from `uses(scanSheet(…))`; duplicates are removed.
 * @param data The web-features data, from {@link readWebFeatures}.
 * @param notes The browser-support note's rows.
 * @returns The violations: every `unknown-key` and `below-floor` in the order its key first
 *   appears, then every `unmapped` function or unit, then every `stale-note` in the note's order.
 *   None means the stylesheet holds the floor.
 */
export const checkFloor = (
  uses: readonly Use[],
  data: WebFeatures,
  notes: readonly SupportNote[],
): readonly FloorViolation[] => {
  const index = listings(data);
  const noted = new Set(notes.map((note) => note.feature));
  const keys = new Map<string, Use["kind"]>();
  const unmapped = new Set<string>();
  for (const use of uses) {
    if (!mapped(use)) {
      unmapped.add(use.name);
    }

    for (const key of bcdKeys(use)) {
      if (!keys.has(key)) {
        keys.set(key, use.kind);
      }
    }
  }

  const reached = new Set<string>();
  const violations: FloorViolation[] = [];
  for (const [key, kind] of keys) {
    const listing = index.get(key);
    if (listing === undefined) {
      if (kind !== "value") {
        violations.push({ feature: Option.none(), key, kind: "unknown-key" });
      }
    } else {
      reached.add(listing.feature);
      if (listing.baseline !== "high" && !noted.has(listing.feature)) {
        violations.push({ feature: Option.some(listing.feature), key, kind: "below-floor" });
      }
    }
  }

  return [
    ...violations,
    ...[...unmapped].map((name): FloorViolation => ({
      feature: Option.none(),
      key: name,
      kind: "unmapped",
    })),
    ...notes
      .filter((note) => !reached.has(note.feature))
      .map((note): FloorViolation => ({
        feature: Option.some(note.feature),
        key: "",
        kind: "stale-note",
      })),
  ];
};

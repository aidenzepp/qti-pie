/**
 * The pinned web-features data the stylesheets' floor check reads.
 *
 * The floor is Baseline widely available, read from web-features 3.45.0's `data.json`, cached
 * outside the repository at `~/.cache/gr8des/renderer-research/web/web-features-data.json` and
 * pinned by its digest, {@link webFeaturesSha256}. Test support: only tests import it, and nothing
 * here fetches or writes the data.
 *
 * @module
 */
/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown. */
import { readFile } from "node:fs/promises";
import { Config, Effect, Schema } from "effect";

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

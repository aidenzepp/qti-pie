/**
 * The Schema of the supports a host hands `render` and `redact`, for the server and the
 * boundaries: {@link SupportsSchema} checks a value a host built, such as one cast from untyped
 * code or assembled from a PNP, before it reaches a render.
 *
 * It lives apart from `#plate/supports.ts` because `render` value-imports `noSupports` from there,
 * and a browser module value-imports from `effect` only `Option`, `Array`, `pipe`, `Data` and
 * `Result` (ruling OD-6, held by `src/browser.test.ts`). No browser module imports this file, so
 * Schema stays out of the browser bundle.
 *
 * @module
 */
import { Schema } from "effect";
import { catalogSupports, toolPreferences } from "#plate/supports.ts";
import type { Supports } from "#plate/supports.ts";

/**
 * A finite number above 0: a time multiplier, a number of minutes or a magnification.
 */
const Positive = Schema.Finite.check(Schema.isGreaterThan(0));

/**
 * The additional testing time: a multiplier, fixed minutes, or unlimited.
 */
const AdditionalTestingTime = Schema.Union([
  Schema.Struct({ factor: Positive, kind: Schema.Literal("multiplier") }),
  Schema.Struct({ kind: Schema.Literal("minutes"), minutes: Positive }),
  Schema.Struct({ kind: Schema.Literal("unlimited") }),
]);

/**
 * A catalog support: a predefined name, or an `ext:` extension.
 */
const CatalogSupport = Schema.Union([
  Schema.Literals(catalogSupports),
  Schema.TemplateLiteral(["ext:", Schema.String]),
]);

/**
 * The text and background colours, each as written.
 */
const TextAppearance = Schema.Struct({
  backgroundColor: Schema.Option(Schema.String),
  fontColor: Schema.Option(Schema.String),
});

/**
 * The checks of a {@link Supports}: every field present, each catalog support predefined or
 * `ext:`, each tool one of the PNP's, each factor, number of minutes and magnification a finite
 * number above 0. A value it decodes is the value it was given.
 */
export const SupportsSchema: Schema.Codec<Supports> = Schema.Struct({
  additionalTestingTime: Schema.Option(AdditionalTestingTime),
  answerMasking: Schema.Boolean,
  catalog: Schema.ReadonlySet(CatalogSupport),
  display: Schema.Struct({
    invertDisplayPolarity: Schema.Boolean,
    keywordEmphasis: Schema.Boolean,
    languageOfInterface: Schema.Option(Schema.String),
    layoutSingleColumn: Schema.Boolean,
    magnification: Schema.Option(Positive),
    textAppearance: Schema.Option(TextAppearance),
  }),
  readAloud: Schema.Option(Schema.Literals(["computer-read-aloud", "screen-reader"])),
  suppressTts: Schema.Boolean,
  tools: Schema.ReadonlySet(Schema.Literals(toolPreferences)),
});

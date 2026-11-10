/**
 * The Schemas of the supports a host hands `render` and `redact`, for the server and the
 * boundaries: {@link SupportsSchema} checks a value a host built, such as one cast from untyped
 * code or assembled from a PNP, before it reaches a render, and {@link PnpSupportsSchema} checks
 * the wider value `readPnp` reads.
 *
 * It lives apart from `#plate/supports.ts` because `render` value-imports `noSupports` from there,
 * and a browser module value-imports from `effect` only `Option`, `Array`, `pipe`, `Data` and
 * `Result` (ruling OD-6, held by `src/browser.test.ts`). No browser module imports this file, so
 * Schema stays out of the browser bundle.
 *
 * @module
 */
import { Schema } from "effect";
import {
  brailleDeliveryModes,
  brailleGrades,
  brailleTypes,
  calculatorTypes,
  catalogSupports,
  genericFontFaces,
  hazardAvoidances,
  inputRequirementValues,
  languageFeatures,
  linkIndications,
  mathTypes,
  pnpFeatures,
  restrictionTypes,
  toolPreferences,
  typingEchoes,
} from "#plate/supports.ts";
import type { PnpSupports, Supports } from "#plate/supports.ts";

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
 * The fields of a {@link Supports}, which {@link SupportsSchema} checks and
 * {@link PnpSupportsSchema} widens.
 */
const supportsFields = {
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
};

/**
 * The checks of a {@link Supports}: every field present, each catalog support predefined or
 * `ext:`, each tool one of the PNP's, each factor, number of minutes and magnification a finite
 * number above 0. A value it decodes is the value it was given.
 */
export const SupportsSchema: Schema.Codec<Supports> = Schema.Struct(supportsFields);

/**
 * A value outside a PNP vocabulary: `ext:` followed by one or more non-space characters.
 */
const PnpExtension = Schema.TemplateLiteral(["ext:", Schema.String]).check(
  Schema.isPattern(/^ext:\S+$/u),
);

/**
 * A value of a PNP vocabulary, or an `ext:` extension of it.
 *
 * @param values The vocabulary's values.
 * @returns The Schema of a value or an extension.
 */
const extensible = <const Values extends readonly string[]>(values: Values) =>
  Schema.Union([Schema.Literals(values), PnpExtension]);

/**
 * A PNP feature, by the schema's local name.
 */
const PnpFeature = Schema.Literals(pnpFeatures);

/**
 * An optional colour or language, as written.
 */
const Written = Schema.Option(Schema.String);

/**
 * The checks of a {@link PnpSupports}: the checks of {@link SupportsSchema}, and every PNP-only
 * field present, each feature one of the PNP's, each vocabulary value the schema's spelling or an
 * `ext:` value where the vocabulary takes one. A value it decodes is the value it was given, the
 * contract's fields and the PNP's alike.
 */
export const PnpSupportsSchema: Schema.Codec<PnpSupports> = Schema.Struct({
  ...supportsFields,
  atStart: Schema.ReadonlySet(PnpFeature),
  braille: Schema.Option(
    Schema.Struct({
      brailleType: Schema.Option(extensible(brailleTypes)),
      deliveryMode: extensible(brailleDeliveryModes),
      grade: Schema.Literals(brailleGrades),
      language: Written,
      mathType: Schema.Option(extensible(mathTypes)),
    }),
  ),
  breaks: Schema.Boolean,
  features: Schema.ReadonlySet(PnpFeature),
  hazards: Schema.ReadonlySet(extensible(hazardAvoidances)),
  ignored: Schema.Array(Schema.String),
  inputRequirements: Schema.ReadonlySet(extensible(inputRequirementValues)),
  invertedColors: Schema.Option(Schema.Struct({ background: Written, foreground: Written })),
  languages: Schema.ReadonlyMap(Schema.Literals(languageFeatures), Schema.String),
  longDescriptionVisible: Schema.Boolean,
  optional: Schema.ReadonlySet(PnpFeature),
  prohibited: Schema.ReadonlySet(PnpFeature),
  spoken: Schema.Option(
    Schema.Struct({
      linkIndication: Schema.Option(Schema.Literals(linkIndications)),
      pitch: Schema.Finite,
      readingType: Schema.Literals(["computer-read-aloud", "screen-reader"]),
      restrictions: Schema.ReadonlySet(extensible(restrictionTypes)),
      speechRate: Schema.Finite,
      typingEcho: Schema.Option(Schema.Literals(typingEchoes)),
      volume: Schema.Finite,
    }),
  ),
  text: Schema.Option(
    Schema.Struct({
      colorTheme: Written,
      fontNames: Schema.Array(Schema.String),
      fontSize: Schema.Option(
        Schema.Struct({ kind: Schema.Literals(["factor", "points"]), value: Schema.Finite }),
      ),
      genericFontFace: Schema.Option(Schema.Literals(genericFontFaces)),
      letterSpacing: Schema.Option(Schema.Finite),
      lineHeight: Schema.Option(Schema.Finite),
      lineSpacing: Schema.Option(Schema.Finite),
      uniformFontSizing: Schema.Boolean,
      wordSpacing: Schema.Option(Schema.Finite),
      wordWrapping: Schema.Boolean,
    }),
  ),
  toolSettings: Schema.Struct({
    calculatorType: Schema.Option(extensible(calculatorTypes)),
    highlightColor: Written,
  }),
});

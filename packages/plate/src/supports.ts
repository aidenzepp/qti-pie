/**
 * The accessibility supports a host enables for one candidate, which `render` and `redact` take as
 * their `supports` option: {@link Supports}, and {@link noSupports}, every support off.
 *
 * Two layers live here. The catalog layer names the supports whose catalog content an item holds
 * dormant until one is enabled: the fifteen predefined names of QTI's card `support` vocabulary
 * and its `ext:` extensions. The delivery layer holds the preferences a Personal Needs and
 * Preferences document gives, which is a separate AfA PNP 3.0 document QTI never references: the
 * additional testing time, answer masking, read-aloud, the display preferences, the tools, and the
 * preferences a renderer reads to choose and show catalog content (the braille preferences, the
 * sign language, the keyword translation's language, breaks, and whether a long description shows
 * visually). A host fills it from a PNP, from a testing program's choice for every candidate, or by
 * hand; plate reads no PNP here.
 *
 * Beside the contract, {@link PnpSupports} widens it with the preferences a PNP gives that no
 * renderer reads yet, as `readPnp` reads them, and {@link noPnpSupports} sets none of them. When a
 * renderer comes to read one of those preferences, it moves into {@link Supports}.
 *
 * Nothing reads it yet: every content module is a stub, so each value renders and redacts the same
 * HTML. This is a browser module, value-importing from `effect` only `Option`; the Schemas that
 * check a host-supplied value are `SupportsSchema` and `PnpSupportsSchema` in
 * `#plate/codec/supports.ts`, on the Schema side.
 *
 * @module
 */
import { Option } from "effect";

/**
 * The predefined catalog supports, the card `support` vocabulary of QTI's information model in its
 * own order: a `qti-card` names one of these or an `ext:` extension, and its content stays dormant
 * until a host enables that support.
 *
 * @see https://www.imsglobal.org/spec/qti/v3p0/info, the SupportEnum vocabulary ("an extensible
 *   enumerated vocabulary. Extending the vocabulary makes use of a naming convention").
 */
export const catalogSupports = [
  "additional-directions",
  "audio-description",
  "braille",
  "glossary-on-screen",
  "high-contrast",
  "keyboard-directions",
  "keyword-translation",
  "linguistic-guidance",
  "long-description",
  "sign-language",
  "simplified-language-portions",
  "simplified-graphics",
  "spoken",
  "tactile",
  "transcript",
] as const;

/**
 * A predefined catalog support.
 */
export type CatalogSupport = (typeof catalogSupports)[number];

/**
 * A catalog support outside the predefined vocabulary, named by the `ext:` convention.
 */
export type ExtensionSupport = `ext:${string}`;

/**
 * The on-screen tools a PNP can ask for, by their AfA PNP 3.0 names: conformance rows A-12, A-18,
 * A-27, A-31, A-32, A-33, A-39, A-43 and A-45, and the dictionary.
 */
export const toolPreferences = [
  "calculator-on-screen",
  "dictionary-on-screen",
  "homophone-checker-on-screen",
  "line-reader",
  "note-taking-on-screen",
  "outliner-on-screen",
  "peer-interaction-on-screen",
  "spell-checker-on-screen",
  "thesaurus-on-screen",
  "visual-organizer-on-screen",
] as const;

/**
 * An on-screen tool a PNP can ask for.
 */
export type ToolPreference = (typeof toolPreferences)[number];

/**
 * The additional testing time a candidate is allowed (A-6): the time limits multiplied by a
 * factor, extended by a number of minutes, or lifted. It extends both the displayed and the
 * enforced timer.
 */
export type AdditionalTestingTime =
  | { readonly factor: number; readonly kind: "multiplier" }
  | { readonly kind: "minutes"; readonly minutes: number }
  | { readonly kind: "unlimited" };

/**
 * The spoken support's reading type: a screen reader the candidate brings (A-40a), or the delivery
 * system reading content aloud (A-40b).
 */
export type ReadingType = "computer-read-aloud" | "screen-reader";

/**
 * The text and background colours a candidate chose (A-42a), each as a CSS colour, none for the
 * default.
 */
export interface TextAppearance {
  readonly backgroundColor: Option.Option<string>;
  readonly fontColor: Option.Option<string>;
}

/**
 * The display preferences of the A family a PNP gives.
 */
export interface DisplayPreferences {
  /**
   * Whether the presentation colours are inverted (A-20).
   */
  readonly invertDisplayPolarity: boolean;
  /**
   * Whether text of the class `qti-keyword-emphasis` is given more emphasis (A-23).
   */
  readonly keywordEmphasis: boolean;
  /**
   * The language of the interface's own text, as a BCP 47 tag (A-25), none for the configuration's
   * locale.
   */
  readonly languageOfInterface: Option.Option<string>;
  /**
   * Whether content is laid out in a single column where it can be (A-26).
   */
  readonly layoutSingleColumn: boolean;
  /**
   * The magnification factor (A-30a), none for no magnification.
   */
  readonly magnification: Option.Option<number>;
  /**
   * The text and background colours (A-42a), none for the defaults.
   */
  readonly textAppearance: Option.Option<TextAppearance>;
}

/**
 * The supports a host enables for one candidate: the catalog supports whose dormant content
 * shows, and the PNP's delivery preferences.
 */
export interface Supports {
  readonly additionalTestingTime: Option.Option<AdditionalTestingTime>;
  /**
   * Whether a Choice's choices start covered, each uncovered by the candidate (A-8).
   */
  readonly answerMasking: boolean;
  /**
   * The braille support's preferences, none when the braille support is off; a card entry's
   * `data-braille-type` is matched against its braille type.
   */
  readonly braille: Option.Option<BraillePreferences>;
  /**
   * `environment`'s `breaks`.
   */
  readonly breaks: boolean;
  /**
   * The catalog supports enabled, predefined or `ext:`: a card naming one shows its content.
   */
  readonly catalog: ReadonlySet<CatalogSupport | ExtensionSupport>;
  readonly display: DisplayPreferences;
  /**
   * The language of `keyword-translation`, its `xml:lang` as written, none when the feature is
   * off or names none; a keyword-translation card entry's `xml:lang` is matched against it.
   */
  readonly keywordTranslationLanguage: Option.Option<string>;
  /**
   * Whether `long-description` is shown rather than hidden visually: the negation of its
   * `hide-visually`, which defaults to true.
   */
  readonly longDescriptionVisible: boolean;
  /**
   * The spoken support's reading type, none when the spoken support is off.
   */
  readonly readAloud: Option.Option<ReadingType>;
  /**
   * The sign language chosen, `sign-language`'s `xml:lang` as written (a BCP 47 tag such as
   * `ase`), none when the feature is off or names none; a sign-language card entry's `xml:lang` is
   * matched against it.
   */
  readonly signLanguage: Option.Option<string>;
  /**
   * Whether text-to-speech is suppressed for the whole item, as `data-qti-suppress-tts` suppresses
   * it for the content it marks (A-40f).
   */
  readonly suppressTts: boolean;
  readonly tools: ReadonlySet<ToolPreference>;
}

/**
 * Every support off: no catalog support, no preference, no tool. `render` and `redact` read an
 * absent `supports` option as this value, and catalog content stays dormant under it.
 */
export const noSupports: Supports = {
  additionalTestingTime: Option.none(),
  answerMasking: false,
  braille: Option.none(),
  breaks: false,
  catalog: new Set(),
  display: {
    invertDisplayPolarity: false,
    keywordEmphasis: false,
    languageOfInterface: Option.none(),
    layoutSingleColumn: false,
    magnification: Option.none(),
    textAppearance: Option.none(),
  },
  keywordTranslationLanguage: Option.none(),
  longDescriptionVisible: false,
  readAloud: Option.none(),
  signLanguage: Option.none(),
  suppressTts: false,
  tools: new Set(),
};

/**
 * A value outside an AfA PNP 3.0 vocabulary, named by the `ext:` convention: `ext:` followed by
 * one or more non-space characters, the guide's spelling (row 2), wider than the schema's pattern,
 * which refuses a hyphen.
 */
export type PnpExtension = `ext:${string}`;

/**
 * The feature elements an AfA PNP 3.0 profile may hold, by the schema's local names, the three
 * sets excluded: the names a profile assigns and a set names.
 */
export const pnpFeatures = [
  "additional-directions",
  "additional-testing-time",
  "alternative-text",
  "answer-masking",
  "audio-description",
  "braille",
  "calculator-on-screen",
  "captions",
  "dictionary-on-screen",
  "encouragement",
  "environment",
  "glossary-on-screen",
  "hazard-avoidance",
  "high-contrast",
  "homophone-checker-on-screen",
  "input-requirements",
  "invert-display-polarity",
  "item-translation",
  "keyboard-directions",
  "keyword-emphasis",
  "keyword-translation",
  "language-of-interface",
  "layout-single-column",
  "line-reader",
  "linguistic-guidance",
  "long-description",
  "magnification",
  "note-taking-on-screen",
  "outliner-on-screen",
  "peer-interaction-on-screen",
  "sign-language",
  "simplified-graphics",
  "simplified-language-portions",
  "spell-checker-on-screen",
  "spoken",
  "tactile",
  "text-appearance",
  "thesaurus-on-screen",
  "transcript",
  "visual-organizer-on-screen",
] as const;

/**
 * A PNP feature, by the schema's local name (`spell-checker-on-screen`, never the guide's
 * `spell-checker`).
 */
export type PnpFeature = (typeof pnpFeatures)[number];

/**
 * The `hazard-avoidance` values the schema enumerates; the guide lists two of them (row 4).
 */
export const hazardAvoidances = [
  "flashing",
  "motion-simulation",
  "olfactory-hazard",
  "sound",
] as const;

/**
 * A hazard the candidate avoids.
 */
export type HazardAvoidance = (typeof hazardAvoidances)[number] | PnpExtension;

/**
 * The `input-requirements` values: the schema's `full-keyboard-control` and `full-mouse-control`,
 * and the guide's `full-switch-control` and `full-touchscreen-control` (row 5).
 */
export const inputRequirementValues = [
  "full-keyboard-control",
  "full-mouse-control",
  "full-switch-control",
  "full-touchscreen-control",
] as const;

/**
 * A way of controlling the delivery that the candidate requires.
 */
export type InputRequirement = (typeof inputRequirementValues)[number] | PnpExtension;

/**
 * The `restriction-type` values of `spoken`, in the schema's spelling: the guide's
 * `skip-chemical-equations` reads as `skip-chemistry-equations` (row 6).
 */
export const restrictionTypes = [
  "directions-only",
  "skip-chemistry-equations",
  "skip-math-equations",
  "unrestricted",
  "word-by-word",
] as const;

/**
 * A restriction on what the spoken support reads.
 */
export type RestrictionType = (typeof restrictionTypes)[number] | PnpExtension;

/**
 * The `braille-type` values, in the schema's spelling: the guide's `ubae` reads as `ebae`
 * (row 12).
 */
export const brailleTypes = ["ebae", "ueb"] as const;

/**
 * The braille code of text.
 */
export type BrailleType = (typeof brailleTypes)[number] | PnpExtension;

/**
 * The `delivery-mode` values of `braille`; `refreshable` is the schema's default.
 */
export const brailleDeliveryModes = ["embossed", "refreshable"] as const;

/**
 * How braille reaches the candidate.
 */
export type BrailleDeliveryMode = (typeof brailleDeliveryModes)[number] | PnpExtension;

/**
 * The `grade` values of `braille`; 2 is the schema's default.
 */
export const brailleGrades = [1, 2, 3] as const;

/**
 * A braille grade.
 */
export type BrailleGrade = (typeof brailleGrades)[number];

/**
 * The `math-type` values of `braille`.
 */
export const mathTypes = ["nemeth", "ueb"] as const;

/**
 * The braille code of mathematics.
 */
export type MathType = (typeof mathTypes)[number] | PnpExtension;

/**
 * The `link-indication` values of `spoken`.
 */
export const linkIndications = ["different-voice", "none", "sound-effect", "speak-link"] as const;

/**
 * How the spoken support marks a link.
 */
export type LinkIndication = (typeof linkIndications)[number];

/**
 * The `typing-echo` values of `spoken`.
 */
export const typingEchoes = ["characters", "characters-and-words", "none", "words"] as const;

/**
 * What the spoken support echoes as the candidate types.
 */
export type TypingEcho = (typeof typingEchoes)[number];

/**
 * The `generic-font-face` values of `text-appearance`'s `font-face`, `sans serif` with its space.
 */
export const genericFontFaces = [
  "cursive",
  "fantasy",
  "monospaced",
  "sans serif",
  "serif",
] as const;

/**
 * The generic family of the candidate's font.
 */
export type GenericFontFace = (typeof genericFontFaces)[number];

/**
 * The `calculator-type` values of `calculator-on-screen`.
 */
export const calculatorTypes = ["basic", "graphing", "scientific", "standard"] as const;

/**
 * A kind of on-screen calculator.
 */
export type CalculatorType = (typeof calculatorTypes)[number] | PnpExtension;

/**
 * The features whose `xml:lang` {@link PnpSupports.languages} keeps: `language-of-interface`'s
 * goes to {@link DisplayPreferences.languageOfInterface}, `keyword-translation`'s to
 * {@link Supports.keywordTranslationLanguage} and `sign-language`'s to
 * {@link Supports.signLanguage}.
 */
export const languageFeatures = ["item-translation"] as const;

/**
 * A feature that names a language.
 */
export type LanguageFeature = (typeof languageFeatures)[number];

/**
 * The `braille` feature's preferences, with the schema's defaults where the document says nothing.
 */
export interface BraillePreferences {
  readonly brailleType: Option.Option<BrailleType>;
  readonly deliveryMode: BrailleDeliveryMode;
  readonly grade: BrailleGrade;
  /**
   * The braille's language, the element's `xml:lang` as written.
   */
  readonly language: Option.Option<string>;
  readonly mathType: Option.Option<MathType>;
}

/**
 * The `spoken` feature's preferences, with the schema's defaults where the document says nothing.
 */
export interface SpokenPreferences {
  readonly linkIndication: Option.Option<LinkIndication>;
  /**
   * The pitch, 0.5 by default.
   */
  readonly pitch: number;
  readonly readingType: ReadingType;
  readonly restrictions: ReadonlySet<RestrictionType>;
  /**
   * The speech rate, 180 by default.
   */
  readonly speechRate: number;
  readonly typingEcho: Option.Option<TypingEcho>;
  /**
   * The volume, 0.5 by default.
   */
  readonly volume: number;
}

/**
 * A `font-size` as the document gives it: the schema's points (default 12.0) or the guide's
 * factor "relative to the base font size" (row 10). A value under 4 is a factor, any other is
 * points, since no readable text is 3 points tall and no candidate asks for text 4 times the base.
 */
export interface FontSize {
  readonly kind: "factor" | "points";
  readonly value: number;
}

/**
 * The `text-appearance` feature's preferences beyond the colours {@link Supports} carries.
 *
 * `colorTheme` is the guide's `color-theme`, which the schema lacks (row 1), so it has no
 * vocabulary and is the value as written. `letterSpacing` is the number as written, in pixels
 * (row 11). `lineSpacing`, `lineHeight` and `wordSpacing` are the numbers as written.
 */
export interface TextPreferences {
  readonly colorTheme: Option.Option<string>;
  /**
   * The `font-name` values of `font-face`, in order.
   */
  readonly fontNames: readonly string[];
  readonly fontSize: Option.Option<FontSize>;
  readonly genericFontFace: Option.Option<GenericFontFace>;
  readonly letterSpacing: Option.Option<number>;
  readonly lineHeight: Option.Option<number>;
  readonly lineSpacing: Option.Option<number>;
  readonly uniformFontSizing: boolean;
  readonly wordSpacing: Option.Option<number>;
  readonly wordWrapping: boolean;
}

/**
 * The colours of `invert-display-polarity`, each as written.
 */
export interface PolarityColors {
  readonly background: Option.Option<string>;
  readonly foreground: Option.Option<string>;
}

/**
 * The settings of the on-screen tools that take one: `calculator-on-screen`'s `calculator-type`,
 * and `line-reader`'s `highlight-color` as written.
 */
export interface ToolSettings {
  readonly calculatorType: Option.Option<CalculatorType>;
  readonly highlightColor: Option.Option<string>;
}

/**
 * The supports a PNP asks for: the contract's {@link Supports}, every field of it as the PNP sets
 * it, and the preferences a PNP gives that no renderer reads yet. A `PnpSupports` is a `Supports`,
 * so a host passes it to `render` and `redact` as it is, and they read only the contract's fields.
 *
 * A feature the profile assigns and names in no set is active; `prohibit-set` wins over an
 * assignment, so a prohibited feature is in `prohibited` and in no other field. Every vocabulary
 * value is in the schema's spelling, each of the guide's read as its schema counterpart.
 */
export interface PnpSupports extends Supports {
  /**
   * The features of `activate-at-initialization-set`, or of the guide's
   * `activate-at-initiation-set` (row 7).
   */
  readonly atStart: ReadonlySet<PnpFeature>;
  /**
   * Every feature the profile assigns and does not prohibit, the features the contract has no
   * field for (`captions`, `alternative-text`, `item-translation`, `encouragement`) included.
   */
  readonly features: ReadonlySet<PnpFeature>;
  readonly hazards: ReadonlySet<HazardAvoidance>;
  /**
   * The elements of the profile that were read past, each as `{namespace}local`: every element in
   * a namespace that is not a PNP namespace, and every PNP element no feature is named by.
   */
  readonly ignored: readonly string[];
  readonly inputRequirements: ReadonlySet<InputRequirement>;
  readonly invertedColors: Option.Option<PolarityColors>;
  /**
   * The `xml:lang` of each language feature, as written.
   */
  readonly languages: ReadonlyMap<LanguageFeature, string>;
  /**
   * The features of `activate-as-option-set`.
   */
  readonly optional: ReadonlySet<PnpFeature>;
  /**
   * The features of `prohibit-set`.
   */
  readonly prohibited: ReadonlySet<PnpFeature>;
  readonly spoken: Option.Option<SpokenPreferences>;
  readonly text: Option.Option<TextPreferences>;
  readonly toolSettings: ToolSettings;
}

/**
 * Every support off and no PNP preference given: {@link noSupports} with every PNP-only field
 * empty, the value `readPnp` reads from an empty profile.
 */
export const noPnpSupports: PnpSupports = {
  ...noSupports,
  atStart: new Set(),
  features: new Set(),
  hazards: new Set(),
  ignored: [],
  inputRequirements: new Set(),
  invertedColors: Option.none(),
  languages: new Map(),
  optional: new Set(),
  prohibited: new Set(),
  spoken: Option.none(),
  text: Option.none(),
  toolSettings: { calculatorType: Option.none(), highlightColor: Option.none() },
};

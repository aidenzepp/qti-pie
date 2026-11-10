/**
 * The accessibility supports a host enables for one candidate, which `render` and `redact` take as
 * their `supports` option: {@link Supports}, and {@link noSupports}, every support off.
 *
 * Two layers live here. The catalog layer names the supports whose catalog content an item holds
 * dormant until one is enabled: the fifteen predefined names of QTI's card `support` vocabulary
 * and its `ext:` extensions. The delivery layer holds the preferences a Personal Needs and
 * Preferences document gives, which is a separate AfA PNP 3.0 document QTI never references: the
 * additional testing time, answer masking, read-aloud, the display preferences and the tools. A
 * host fills it from a PNP, from a testing program's choice for every candidate, or by hand;
 * plate reads no PNP here.
 *
 * Nothing reads it yet: every content module is a stub, so each value renders and redacts the same
 * HTML. This is a browser module, value-importing from `effect` only `Option`; the Schema that
 * checks a host-supplied value is `SupportsSchema` in `#plate/codec/supports.ts`, on the Schema
 * side.
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
   * The catalog supports enabled, predefined or `ext:`: a card naming one shows its content.
   */
  readonly catalog: ReadonlySet<CatalogSupport | ExtensionSupport>;
  readonly display: DisplayPreferences;
  /**
   * The spoken support's reading type, none when the spoken support is off.
   */
  readonly readAloud: Option.Option<ReadingType>;
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
  catalog: new Set(),
  display: {
    invertDisplayPolarity: false,
    keywordEmphasis: false,
    languageOfInterface: Option.none(),
    layoutSingleColumn: false,
    magnification: Option.none(),
    textAppearance: Option.none(),
  },
  readAloud: Option.none(),
  suppressTts: false,
  tools: new Set(),
};

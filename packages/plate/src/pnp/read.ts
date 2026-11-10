/**
 * The Personal Needs and Preferences reader: {@link readPnp} reads an AfA PNP 3.0 document, a
 * single profile or a bulk record file, into the {@link Supports} a host passes `render` and
 * `redact`, widened to {@link PnpSupports} with what a PNP says beyond the contract.
 *
 * It reads tolerantly: every example the AfA PNP guide gives reads, including the twelve points
 * where the guide and the schema disagree (see {@link readPnp}), and only a document that cannot be
 * read at all fails, with {@link InvalidPnp} saying why. The XSD lends its element and attribute
 * names and nothing else: no document is validated against it.
 *
 * It runs on the server, beside `open`: it reads through crust's adapter, and a browser module
 * never imports it.
 *
 * @module
 */
import { Effect, Option, Schema } from "effect";
import { readSource } from "#plate/document/read.ts";
import type { SourceElement } from "#plate/document/source.ts";
import { xmlNamespace } from "#plate/document/source.ts";
import { catalogSupports, noSupports, toolPreferences } from "#plate/supports.ts";
import type {
  CatalogSupport,
  DisplayPreferences,
  ReadingType,
  Supports,
  ToolPreference,
} from "#plate/supports.ts";
import type { Refusal } from "#plate/validate/refusal.ts";

/**
 * Which record of a PNP document to read, when the document holds more than one: the record of an
 * appointment, of a person, or of both. With neither, the document must hold one record.
 */
export interface PnpSelector {
  /**
   * The appointment whose record is read: one of the record's `appointment-id` values, or of its
   * `assignment-id` values, the guide's spelling (row 9).
   */
  readonly appointmentId?: string;
  /**
   * The person, by `sourcedId`, whose record is read: the record's `person-sourced-id` text.
   */
  readonly personSourcedId?: string;
}

/**
 * A PNP document `readPnp` cannot read into supports: its bytes are not readable XML
 * (`unreadable`), it is not a PNP document (`not-a-pnp`), the selector matches more than one
 * record (`ambiguous-record`), or it matches none (`unknown-record`). `detail` says what was found.
 */
// oxlint-disable-next-line unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown.
export class InvalidPnp extends Schema.TaggedError<InvalidPnp>()("InvalidPnp", {
  detail: Schema.String,
  reason: Schema.Literals(["unreadable", "not-a-pnp", "ambiguous-record", "unknown-record"]),
}) {
  /**
   * The reason, what was found, and what to change.
   */
  override get message(): string {
    return `The PNP document cannot be read into supports (${this.reason}): ${this.detail}. Pass the bytes of one AfA PNP 3.0 document, with a selector that names exactly one of its records.`;
  }
}

/**
 * The `braille` feature's preferences, with the schema's defaults where the document says nothing.
 *
 * `brailleType` is `ebae`, `ueb` or an `ext:` value; the guide's `ubae` reads as `ebae` (row 12).
 */
export interface BraillePreferences {
  readonly brailleType: Option.Option<string>;
  /**
   * `refreshable` (the default), `embossed` or an `ext:` value.
   */
  readonly deliveryMode: string;
  /**
   * The grade, 1, 2 (the default) or 3.
   */
  readonly grade: number;
  /**
   * The braille's language, the element's `xml:lang`.
   */
  readonly language: Option.Option<string>;
  /**
   * `nemeth`, `ueb` or an `ext:` value.
   */
  readonly mathType: Option.Option<string>;
}

/**
 * The `spoken` feature's preferences, with the schema's defaults where the document says nothing.
 *
 * `restrictions` holds the `restriction-type` values as written, except that the guide's
 * `skip-chemical-equations` reads as the schema's `skip-chemistry-equations` (row 6).
 */
export interface SpokenPreferences {
  readonly linkIndication: Option.Option<string>;
  /**
   * The pitch, 0.5 by default.
   */
  readonly pitch: number;
  readonly readingType: ReadingType;
  readonly restrictions: ReadonlySet<string>;
  /**
   * The speech rate, 180 by default.
   */
  readonly speechRate: number;
  readonly typingEcho: Option.Option<string>;
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
 * `colorTheme` is the guide's `color-theme`, which the schema lacks (row 1). `letterSpacing` is
 * the number as written, in pixels (row 11). `lineSpacing`, `lineHeight` and `wordSpacing` are
 * the numbers as written.
 */
export interface TextPreferences {
  readonly colorTheme: Option.Option<string>;
  /**
   * The `font-name` values of `font-face`, in order.
   */
  readonly fontNames: readonly string[];
  readonly fontSize: Option.Option<FontSize>;
  readonly genericFontFace: Option.Option<string>;
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
 * The settings of the on-screen tools that take one: `calculator-on-screen`'s `calculator-type`
 * and `line-reader`'s `highlight-color`, each as written.
 */
export interface ToolSettings {
  readonly calculatorType: Option.Option<string>;
  readonly highlightColor: Option.Option<string>;
}

/**
 * What {@link readPnp} reads: the contract's {@link Supports}, every field of it as the PNP sets
 * it, and what the PNP says that the contract has no field for. A `PnpSupports` is a `Supports`,
 * so a host passes it to `render` and `redact` as it is.
 *
 * Feature names are the schema's local names (`spell-checker-on-screen`, never the guide's
 * `spell-checker`). A feature the profile assigns and names in no set is active, the campaign's
 * default; `prohibit-set` wins over an assignment, so a prohibited feature is in `prohibited` and
 * in no other field.
 */
export interface PnpSupports extends Supports {
  /**
   * The features of `activate-at-initialization-set`, or of the guide's
   * `activate-at-initiation-set` (row 7).
   */
  readonly atStart: ReadonlySet<string>;
  readonly braille: Option.Option<BraillePreferences>;
  /**
   * `environment`'s `breaks`.
   */
  readonly breaks: boolean;
  /**
   * Every feature the profile assigns and does not prohibit, by schema name, the features the
   * contract has no field for (`captions`, `alternative-text`, `item-translation`,
   * `encouragement`) included.
   */
  readonly features: ReadonlySet<string>;
  /**
   * The `hazard-avoidance` values: any of the four the schema enumerates (the guide lists two,
   * row 4), or an `ext:` value.
   */
  readonly hazards: ReadonlySet<string>;
  /**
   * The elements of the profile that were read past, each as `{namespace}local`: every element in
   * a namespace that is not a PNP namespace, and every PNP element no feature is named by.
   */
  readonly ignored: readonly string[];
  /**
   * The `input-requirements` values: the schema's two, the guide's `full-switch-control` and
   * `full-touchscreen-control` (row 5), or an `ext:` value.
   */
  readonly inputRequirements: ReadonlySet<string>;
  readonly invertedColors: Option.Option<PolarityColors>;
  /**
   * The `xml:lang` of `item-translation`, `keyword-translation` and `sign-language`, by feature.
   * `language-of-interface` goes to `display.languageOfInterface`.
   */
  readonly languages: ReadonlyMap<string, string>;
  /**
   * Whether `long-description` is shown rather than hidden visually: the negation of its
   * `hide-visually`, which defaults to true.
   */
  readonly longDescriptionVisible: boolean;
  /**
   * The features of `activate-as-option-set`.
   */
  readonly optional: ReadonlySet<string>;
  /**
   * The features of `prohibit-set`.
   */
  readonly prohibited: ReadonlySet<string>;
  readonly spoken: Option.Option<SpokenPreferences>;
  readonly text: Option.Option<TextPreferences>;
  readonly toolSettings: ToolSettings;
}

/**
 * The namespaces a PNP element may be in: the schema's, the guide's two (row 3), and none.
 */
const pnpNamespaces: ReadonlySet<string> = new Set([
  "http://www.imsglobal.org/xsd/qti/qtiv3p0/imsafa3p0pnp_v1p0",
  "http://www.imsglobal.org/xsd/qtiv3p0/imsafa3p0pnp_v1p0",
  "http://www.imsglobal.org/xsd//qti/qti3p0/imsafa3p0pnp_v1p0",
  "",
]);

/**
 * The guide's spellings of element names, each with the schema's name it reads as: the sets
 * (row 7), the tools (row 8) and the bulk id (row 9).
 */
const elementSpellings: ReadonlyMap<string, string> = new Map([
  ["activate-at-initiation-set", "activate-at-initialization-set"],
  ["assignment-id", "appointment-id"],
  ["homophone-checker", "homophone-checker-on-screen"],
  ["spell-checker", "spell-checker-on-screen"],
]);

/**
 * The guide's spellings of values, each with the schema's value it reads as: the chemistry
 * restriction (row 6) and the braille type (row 12).
 */
const valueSpellings: ReadonlyMap<string, string> = new Map([
  ["skip-chemical-equations", "skip-chemistry-equations"],
  ["ubae", "ebae"],
]);

/**
 * The feature elements a profile may hold, by schema name, the three sets excluded. An `ext:`
 * value anywhere is any `ext:` followed by one or more non-space characters (row 2), so no value
 * is filtered by the schema's pattern.
 */
const featureNames: ReadonlySet<string> = new Set([
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
]);

/**
 * The three sets' schema names, each with the field of {@link PnpSupports} it fills.
 */
const setNames: ReadonlyMap<string, "atStart" | "optional" | "prohibited"> = new Map([
  ["activate-as-option-set", "optional"],
  ["activate-at-initialization-set", "atStart"],
  ["prohibit-set", "prohibited"],
]);

/**
 * The features whose `xml:lang` {@link PnpSupports.languages} keeps.
 */
const languageFeatures: readonly string[] = [
  "item-translation",
  "keyword-translation",
  "sign-language",
];

/**
 * A `font-size` under this value is a factor; any other is points.
 */
const fontSizeFactorLimit = 4;

/**
 * The location every PNP document is read under, since `readPnp` takes bytes alone.
 */
const location = "pnp";

/**
 * Decide whether an element is a PNP element: one in a PNP namespace, by schema name.
 *
 * @param element The element.
 * @returns Whether its namespace is one of {@link pnpNamespaces}.
 */
const isPnp = (element: SourceElement): boolean => pnpNamespaces.has(element.namespace);

/**
 * Name an element as `{namespace}local`, as {@link PnpSupports.ignored} and a refusal's detail
 * spell it.
 *
 * @param element The element.
 * @returns Its full name.
 */
const fullName = (element: SourceElement): string => `{${element.namespace}}${element.local}`;

/**
 * Read a PNP element's name in the schema's spelling, the guide's spellings mapped.
 *
 * @param element The element.
 * @returns The schema's local name.
 */
const schemaName = (element: SourceElement): string =>
  elementSpellings.get(element.local) ?? element.local;

/**
 * Read a value in the schema's spelling, trimmed, the guide's spellings mapped.
 *
 * @param value The value as written.
 * @returns The schema's value.
 */
const schemaValue = (value: string): string => {
  const trimmed = value.trim();

  return valueSpellings.get(trimmed) ?? trimmed;
};

/**
 * List an element's PNP element children.
 *
 * @param element The element.
 * @returns Its element children in a PNP namespace, in order.
 */
const pnpChildren = (element: SourceElement): readonly SourceElement[] =>
  element.children.flatMap((child) => (child.kind === "element" && isPnp(child) ? [child] : []));

/**
 * Find an element's PNP children of one schema name.
 *
 * @param element The element.
 * @param name The schema name.
 * @returns The children so named, in order.
 */
const childrenNamed = (element: SourceElement, name: string): readonly SourceElement[] =>
  pnpChildren(element).filter((child) => schemaName(child) === name);

/**
 * Find an element's first PNP child of one schema name.
 *
 * @param element The element.
 * @param name The schema name.
 * @returns The first child so named.
 */
const childNamed = (element: SourceElement, name: string): Option.Option<SourceElement> =>
  Option.fromNullishOr(childrenNamed(element, name)[0]);

/**
 * Read an element's text: its text children joined, in the schema's spelling.
 *
 * @param element The element.
 * @returns The text, trimmed.
 */
const textOf = (element: SourceElement): string =>
  schemaValue(element.children.map((child) => (child.kind === "text" ? child.text : "")).join(""));

/**
 * Read the text of an element's first child of one schema name.
 *
 * @param element The element.
 * @param name The child's schema name.
 * @returns The child's text, none without the child.
 */
const childText = (element: SourceElement, name: string): Option.Option<string> =>
  Option.map(childNamed(element, name), textOf);

/**
 * Read the texts of every child of one schema name, as a set.
 *
 * @param element The element.
 * @param name The children's schema name.
 * @returns The children's texts, the empty ones dropped.
 */
const childTexts = (element: SourceElement, name: string): ReadonlySet<string> =>
  new Set(
    childrenNamed(element, name)
      .map(textOf)
      .filter((value) => value !== ""),
  );

/**
 * Read an attribute of an element in no namespace, or in the XML namespace for `xml:lang`.
 *
 * @param element The element.
 * @param local The attribute's local name.
 * @param namespace The attribute's namespace, none by default.
 * @returns The value, trimmed, none without the attribute.
 */
const attributeOf = (
  element: SourceElement,
  local: string,
  namespace = "",
): Option.Option<string> =>
  Option.fromNullishOr(
    element.attributes.find(
      (attribute) => attribute.local === local && attribute.namespace === namespace,
    ),
  ).pipe(Option.map((attribute) => attribute.value.trim()));

/**
 * Read an element's `xml:lang`.
 *
 * @param element The element.
 * @returns The language tag as written, none without the attribute.
 */
const langOf = (element: SourceElement): Option.Option<string> =>
  attributeOf(element, "lang", xmlNamespace);

/**
 * Read a number as XML Schema writes a float or an integer; anything else, `NaN` and the
 * infinities included, is no number.
 *
 * @param value The text.
 * @returns The finite number, none for any other text.
 */
const numberOf = (value: string): Option.Option<number> => {
  const trimmed = value.trim();
  const parsed = Number(trimmed);

  return trimmed !== "" && Number.isFinite(parsed) ? Option.some(parsed) : Option.none();
};

/**
 * Read a positive finite number, the only magnification, factor or number of minutes the
 * `SupportsSchema` admits.
 *
 * @param value The text.
 * @returns The number when it is above 0, none otherwise.
 */
const positiveOf = (value: string): Option.Option<number> =>
  Option.filter(numberOf(value), (parsed) => parsed > 0);

/**
 * Read an XML Schema boolean: `true` or `1` is true, `false` or `0` is false.
 *
 * @param value The text.
 * @returns The boolean, none for any other text.
 */
const booleanOf = (value: string): Option.Option<boolean> => {
  const trimmed = value.trim();

  if (trimmed === "true" || trimmed === "1") {
    return Option.some(true);
  }

  return trimmed === "false" || trimmed === "0" ? Option.some(false) : Option.none();
};

/**
 * Read the text of a child of one schema name as a number.
 *
 * @param element The element.
 * @param name The child's schema name.
 * @returns The number, none without the child or a number in it.
 */
const childNumber = (element: SourceElement, name: string): Option.Option<number> =>
  Option.flatMap(childText(element, name), numberOf);

/**
 * The features of a profile, by schema name, each with its elements in order: one element for
 * most features, several for `hazard-avoidance`, `input-requirements` and `language-of-interface`
 * (read as 0..* whatever the schema says of each, so a document that repeats one still reads).
 */
type Assigned = ReadonlyMap<string, readonly SourceElement[]>;

/**
 * What one pass over a profile's children finds: the features, the three sets, and the names
 * read past.
 */
interface Scan {
  readonly assigned: Assigned;
  readonly ignored: readonly string[];
  readonly sets: Readonly<Record<"atStart" | "optional" | "prohibited", ReadonlySet<string>>>;
}

/**
 * Scan a profile's children: sort each into a feature, a set, or the ignored.
 *
 * @param pnp The `access-for-all-pnp` element.
 * @returns What it holds.
 */
const scan = (pnp: SourceElement): Scan => {
  const assigned = new Map<string, SourceElement[]>();
  const ignored: string[] = [];
  const sets = {
    atStart: new Set<string>(),
    optional: new Set<string>(),
    prohibited: new Set<string>(),
  };

  for (const child of pnp.children) {
    if (child.kind !== "element") {
      continue;
    }

    const name = schemaName(child);
    const set = setNames.get(name);

    if (!isPnp(child)) {
      ignored.push(fullName(child));
    } else if (set !== undefined) {
      for (const member of pnpChildren(child)) {
        sets[set].add(schemaName(member));
      }
    } else if (featureNames.has(name)) {
      assigned.set(name, [...(assigned.get(name) ?? []), child]);
    } else {
      ignored.push(fullName(child));
    }
  }

  return { assigned, ignored, sets };
};

/**
 * Read `additional-testing-time`: `time-multiplier`, `fixed-minutes` or `unlimited`, the first
 * found; a multiplier or a number of minutes that is not a positive number reads as no time.
 *
 * @param element The feature element.
 * @returns The additional testing time.
 */
const additionalTestingTimeOf = (element: SourceElement): Supports["additionalTestingTime"] => {
  const multiplier = Option.flatMap(childText(element, "time-multiplier"), positiveOf);

  if (Option.isSome(multiplier)) {
    return Option.some({ factor: multiplier.value, kind: "multiplier" });
  }

  const minutes = Option.flatMap(childText(element, "fixed-minutes"), positiveOf);

  if (Option.isSome(minutes)) {
    return Option.some({ kind: "minutes", minutes: minutes.value });
  }

  return Option.isSome(childNamed(element, "unlimited"))
    ? Option.some({ kind: "unlimited" })
    : Option.none();
};

/**
 * Read `braille`'s preferences, with the schema's defaults.
 *
 * @param element The feature element.
 * @returns The preferences.
 */
const brailleOf = (element: SourceElement): BraillePreferences => ({
  brailleType: childText(element, "braille-type"),
  deliveryMode: Option.getOrElse(childText(element, "delivery-mode"), () => "refreshable"),
  grade: Option.getOrElse(childNumber(element, "grade"), () => 2),
  language: langOf(element),
  mathType: childText(element, "math-type"),
});

/**
 * Read `spoken`'s preferences, with the schema's defaults; a `reading-type` that is not
 * `computer-read-aloud` is the default `screen-reader`.
 *
 * @param element The feature element.
 * @returns The preferences.
 */
const spokenOf = (element: SourceElement): SpokenPreferences => ({
  linkIndication: childText(element, "link-indication"),
  pitch: Option.getOrElse(childNumber(element, "pitch"), () => 0.5),
  readingType: Option.contains(childText(element, "reading-type"), "computer-read-aloud")
    ? "computer-read-aloud"
    : "screen-reader",
  restrictions: childTexts(element, "restriction-type"),
  speechRate: Option.getOrElse(childNumber(element, "speech-rate"), () => 180),
  typingEcho: childText(element, "typing-echo"),
  volume: Option.getOrElse(childNumber(element, "volume"), () => 0.5),
});

/**
 * Read `text-appearance`'s preferences beyond its colours.
 *
 * @param element The feature element.
 * @returns The preferences.
 */
const textPreferencesOf = (element: SourceElement): TextPreferences => {
  const fontFace = childNamed(element, "font-face");

  return {
    colorTheme: childText(element, "color-theme"),
    fontNames: Option.match(fontFace, {
      onNone: () => [],
      onSome: (face) => childrenNamed(face, "font-name").map(textOf),
    }),
    fontSize: Option.map(childNumber(element, "font-size"), (value) => ({
      kind: value < fontSizeFactorLimit ? "factor" : "points",
      value,
    })),
    genericFontFace: fontFace.pipe(Option.flatMap((face) => childText(face, "generic-font-face"))),
    letterSpacing: childNumber(element, "letter-spacing"),
    lineHeight: childNumber(element, "line-height"),
    lineSpacing: childNumber(element, "line-spacing"),
    uniformFontSizing: Option.isSome(childNamed(element, "uniform-font-sizing")),
    wordSpacing: childNumber(element, "word-spacing"),
    wordWrapping: Option.isSome(childNamed(element, "word-wrapping")),
  };
};

/**
 * Read `magnification`: `all-content`'s `zoom-amount`, else `text`'s, else `non-text`'s, the
 * first that is a positive number.
 *
 * @param element The feature element.
 * @returns The magnification factor.
 */
const magnificationOf = (element: SourceElement): Option.Option<number> =>
  Option.firstSomeOf(
    ["all-content", "text", "non-text"].map((name) =>
      Option.flatMap(childNamed(element, name), (zoom) =>
        Option.flatMap(attributeOf(zoom, "zoom-amount"), positiveOf),
      ),
    ),
  );

/**
 * Build the {@link PnpSupports} of a scanned profile: a feature in `prohibit-set` sets nothing.
 *
 * @param found What the scan found.
 * @returns The supports.
 */
const supportsOf = ({ assigned, ignored, sets }: Scan): PnpSupports => {
  const features = new Set([...assigned.keys()].filter((name) => !sets.prohibited.has(name)));
  const elementsOf = (name: string): readonly SourceElement[] =>
    features.has(name) ? (assigned.get(name) ?? []) : [];
  const firstOf = (name: string): Option.Option<SourceElement> =>
    Option.fromNullishOr(elementsOf(name)[0]);
  const textAppearance = firstOf("text-appearance");
  const display: DisplayPreferences = {
    invertDisplayPolarity: features.has("invert-display-polarity"),
    keywordEmphasis: features.has("keyword-emphasis"),
    languageOfInterface: Option.firstSomeOf(elementsOf("language-of-interface").map(langOf)),
    layoutSingleColumn: features.has("layout-single-column"),
    magnification: Option.flatMap(firstOf("magnification"), magnificationOf),
    textAppearance: textAppearance.pipe(
      Option.flatMap((element) => {
        const backgroundColor = childText(element, "background-color");
        const fontColor = childText(element, "font-color");

        return Option.isSome(backgroundColor) || Option.isSome(fontColor)
          ? Option.some({ backgroundColor, fontColor })
          : Option.none();
      }),
    ),
  };

  return {
    additionalTestingTime: Option.flatMap(
      firstOf("additional-testing-time"),
      additionalTestingTimeOf,
    ),
    answerMasking: features.has("answer-masking"),
    atStart: sets.atStart,
    braille: Option.map(firstOf("braille"), brailleOf),
    breaks: Option.getOrElse(
      Option.flatMap(firstOf("environment"), (environment) =>
        Option.flatMap(childText(environment, "breaks"), booleanOf),
      ),
      () => false,
    ),
    catalog: new Set(
      catalogSupports.filter((support): support is CatalogSupport => features.has(support)),
    ),
    display,
    features,
    hazards: new Set(
      elementsOf("hazard-avoidance")
        .map(textOf)
        .filter((value) => value !== ""),
    ),
    ignored,
    inputRequirements: new Set(
      elementsOf("input-requirements")
        .map(textOf)
        .filter((value) => value !== ""),
    ),
    invertedColors: Option.map(firstOf("invert-display-polarity"), (element) => ({
      background: attributeOf(element, "background"),
      foreground: attributeOf(element, "foreground"),
    })),
    languages: new Map(
      languageFeatures.flatMap((name): readonly (readonly [string, string])[] =>
        Option.match(Option.flatMap(firstOf(name), langOf), {
          onNone: () => [],
          onSome: (lang) => [[name, lang]],
        }),
      ),
    ),
    longDescriptionVisible: Option.getOrElse(
      Option.flatMap(firstOf("long-description"), (element) =>
        Option.flatMap(attributeOf(element, "hide-visually"), booleanOf),
      ).pipe(Option.map((hidden) => !hidden)),
      () => false,
    ),
    optional: sets.optional,
    prohibited: sets.prohibited,
    readAloud: Option.map(firstOf("spoken"), (element) => spokenOf(element).readingType),
    spoken: Option.map(firstOf("spoken"), spokenOf),
    suppressTts: noSupports.suppressTts,
    text: textAppearance.pipe(Option.map(textPreferencesOf)),
    toolSettings: {
      calculatorType: Option.flatMap(firstOf("calculator-on-screen"), (element) =>
        attributeOf(element, "calculator-type"),
      ),
      highlightColor: Option.flatMap(firstOf("line-reader"), (element) =>
        attributeOf(element, "highlight-color"),
      ),
    },
    tools: new Set(toolPreferences.filter((tool): tool is ToolPreference => features.has(tool))),
  };
};

/**
 * One record of a bulk file: its ids and its profile.
 */
interface PnpRecord {
  /**
   * Its `appointment-id` values, the guide's `assignment-id` included.
   */
  readonly appointmentIds: readonly string[];
  readonly personSourcedId: string;
  /**
   * Its `access-for-all-pnp`; a record without one reads as an empty profile.
   */
  readonly profile: Option.Option<SourceElement>;
}

/**
 * Read a bulk file's records.
 *
 * @param records The `access-for-all-pnp-records` element.
 * @returns Its records, in order.
 */
const recordsOf = (records: SourceElement): readonly PnpRecord[] =>
  childrenNamed(records, "access-for-all-pnp-record").map((record) => ({
    appointmentIds: childrenNamed(record, "appointment-id").map(textOf),
    personSourcedId: Option.getOrElse(childText(record, "person-sourced-id"), () => ""),
    profile: childNamed(record, "access-for-all-pnp"),
  }));

/**
 * Spell a record's ids for a refusal's detail.
 *
 * @param record The record.
 * @returns Its person and appointments.
 */
const describeRecord = (record: PnpRecord): string =>
  record.appointmentIds.length === 0
    ? `person ${record.personSourcedId}`
    : `person ${record.personSourcedId} (appointments ${record.appointmentIds.join(", ")})`;

/**
 * Spell a selector for a refusal's detail.
 *
 * @param selector The selector.
 * @returns What it names, or that it names nothing.
 */
const describeSelector = (selector: PnpSelector): string => {
  const parts = [
    ...(selector.personSourcedId === undefined ? [] : [`person ${selector.personSourcedId}`]),
    ...(selector.appointmentId === undefined ? [] : [`appointment ${selector.appointmentId}`]),
  ];

  return parts.length === 0 ? "no selector" : parts.join(" and ");
};

/**
 * Choose the one record a selector names: with neither id, the file's one record.
 *
 * @param records The file's records.
 * @param selector Which to read.
 * @returns The record, or `ambiguous-record` or `unknown-record` naming the ids the file holds.
 */
const selectRecord = (
  records: readonly PnpRecord[],
  selector: PnpSelector,
): Effect.Effect<PnpRecord, InvalidPnp> => {
  const matching = records.filter(
    (record) =>
      (selector.personSourcedId === undefined ||
        record.personSourcedId === selector.personSourcedId) &&
      (selector.appointmentId === undefined ||
        record.appointmentIds.includes(selector.appointmentId)),
  );
  const [first] = matching;
  const held =
    records.length === 0
      ? "the document holds no record"
      : `the document holds ${records.map(describeRecord).join("; ")}`;

  if (first === undefined) {
    return Effect.fail(
      new InvalidPnp({
        detail: `${describeSelector(selector)} matches no record; ${held}`,
        reason: "unknown-record",
      }),
    );
  }

  return matching.length === 1
    ? Effect.succeed(first)
    : Effect.fail(
        new InvalidPnp({
          detail: `${describeSelector(selector)} matches ${matching.length} records; ${held}`,
          reason: "ambiguous-record",
        }),
      );
};

/**
 * Turn the reader's refusal into `unreadable`, with the reader's reason.
 *
 * @param refusal The adapter's refusal.
 * @returns The `InvalidPnp`.
 */
const unreadable = (refusal: Refusal): InvalidPnp => {
  const facts = Object.values(refusal.detail).join("; ");
  const where =
    refusal.location.kind === "position"
      ? ` at line ${refusal.location.line}, column ${refusal.location.column}`
      : "";

  return new InvalidPnp({
    detail: `the bytes are not readable XML (${refusal.rule}${where}): ${facts}`,
    reason: "unreadable",
  });
};

/**
 * Find the profile a document holds: the root profile, or the selected record's.
 *
 * @param root The document's root.
 * @param selector Which record to read.
 * @returns The `access-for-all-pnp` element, none for a record without one.
 */
const profileOf = (
  root: SourceElement,
  selector: PnpSelector,
): Effect.Effect<Option.Option<SourceElement>, InvalidPnp> => {
  if (!isPnp(root)) {
    return Effect.fail(
      new InvalidPnp({
        detail: `the root element is ${fullName(root)}, which is in no AfA PNP 3.0 namespace`,
        reason: "not-a-pnp",
      }),
    );
  }

  switch (root.local) {
    case "access-for-all-pnp": {
      return Effect.succeed(Option.some(root));
    }
    case "access-for-all-pnp-records": {
      return Effect.map(selectRecord(recordsOf(root), selector), (record) => record.profile);
    }
    default: {
      return Effect.fail(
        new InvalidPnp({
          detail: `the root element is ${fullName(root)}, not access-for-all-pnp or access-for-all-pnp-records`,
          reason: "not-a-pnp",
        }),
      );
    }
  }
};

/**
 * Read a PNP document into the supports it asks for.
 *
 * The document is a single `access-for-all-pnp` profile or an `access-for-all-pnp-records` bulk
 * file, in the schema's namespace, either of the guide's, or none (row 3). It is read tolerantly,
 * the guide's spellings beside the schema's: `color-theme` is read (row 1); an `ext:` value is
 * any `ext:` followed by non-space characters (row 2); all four hazards and both extra input
 * requirements read (rows 4, 5); `skip-chemical-equations`, `activate-at-initiation-set`,
 * `spell-checker`, `homophone-checker`, `assignment-id` and `ubae` read as their schema
 * counterparts (rows 6 to 9, 12); a `font-size` under 4 is a factor, otherwise points (row 10);
 * `letter-spacing` is pixels (row 11). A feature assigned and in no set is active; `prohibit-set`
 * wins over an assignment. An element in another namespace is ignored and counted. Nothing is
 * validated against the XSD. A field the PNP does not set takes `noSupports`' value, and the
 * result satisfies `SupportsSchema`.
 *
 * In a bulk file, the record is chosen by `personSourcedId` and `appointmentId` (either or both);
 * with neither, a file of one record reads that record, and one of several fails.
 *
 * @param bytes The document's bytes.
 * @param selector Which of its records to read, when it holds more than one.
 * @returns The supports; {@link InvalidPnp} when the bytes are not readable XML (`unreadable`,
 *   with the reader's reason), the root is not a PNP root (`not-a-pnp`, naming it), or the
 *   selector names several records (`ambiguous-record`) or none (`unknown-record`), each naming
 *   the ids the file holds.
 */
export const readPnp = Effect.fn("plate.readPnp")(function* readPnp(
  bytes: Uint8Array,
  selector: PnpSelector = {},
): Effect.fn.Return<PnpSupports, InvalidPnp> {
  const source = yield* readSource(location, bytes).pipe(Effect.mapError(unreadable));
  const profile = yield* profileOf(source.root, selector);
  const found = Option.match(profile, {
    onNone: (): Scan => ({
      assigned: new Map(),
      ignored: [],
      sets: { atStart: new Set(), optional: new Set(), prohibited: new Set() },
    }),
    onSome: scan,
  });

  yield* Effect.annotateCurrentSpan({
    "pnp.features": found.assigned.size,
    "pnp.ignored": found.ignored.length,
  });

  return supportsOf(found);
});

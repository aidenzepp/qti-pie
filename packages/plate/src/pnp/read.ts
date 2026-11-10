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
  noSupports,
  pnpFeatures,
  restrictionTypes,
  toolPreferences,
  typingEchoes,
} from "#plate/supports.ts";
import type {
  BraillePreferences,
  CatalogSupport,
  DisplayPreferences,
  LanguageFeature,
  PnpExtension,
  PnpFeature,
  PnpSupports,
  SpokenPreferences,
  Supports,
  TextPreferences,
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
 * The reasons a PNP document cannot be read, which {@link InvalidPnp} names.
 */
const invalidReasons = ["unreadable", "not-a-pnp", "ambiguous-record", "unknown-record"] as const;

/**
 * The ids of one record of a bulk file, as {@link InvalidPnp.records} lists them: the person's
 * `sourcedId` and every `appointment-id` of the record, the guide's `assignment-id` included.
 */
const RecordIds = Schema.Struct({
  appointmentIds: Schema.Array(Schema.String),
  personSourcedId: Schema.String,
});

/**
 * What a caller changes to get each reason past: one sentence per reason, so only a reason a
 * selector can settle mentions one.
 */
const remedies: Readonly<Record<(typeof invalidReasons)[number], string>> = {
  "ambiguous-record":
    "Pass a selector with personSourcedId, appointmentId or both that names exactly one of the records listed.",
  "not-a-pnp":
    "Pass the bytes of an AfA PNP 3.0 document, whose root is access-for-all-pnp or access-for-all-pnp-records in the PNP namespace or in none.",
  "unknown-record":
    "Pass a selector whose personSourcedId and appointmentId name one of the records listed.",
  unreadable:
    "Repair what the rule names, or pass the bytes of a well-formed XML document in an encoding the reader supports.",
};

/**
 * What a caller changes when a bulk file holds no record, which no selector can settle.
 */
const emptyBulkRemedy =
  "Pass a bulk file that holds at least one access-for-all-pnp-record, or the bytes of one access-for-all-pnp profile.";

/**
 * A PNP document `readPnp` cannot read into supports: its bytes are not readable XML
 * (`unreadable`), it is not a PNP document (`not-a-pnp`), the selector matches more than one
 * record (`ambiguous-record`), or it matches none (`unknown-record`).
 *
 * `detail` says what was found: for `unreadable`, the reader's own rule and what it found, for
 * the two record reasons the ids the file holds. `records` carries those ids as data, the
 * records of a bulk file in order, and is empty for a reason that names no record and for a bulk
 * file that holds none.
 */
// oxlint-disable-next-line unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown.
export class InvalidPnp extends Schema.TaggedError<InvalidPnp>()("InvalidPnp", {
  detail: Schema.String,
  reason: Schema.Literals(invalidReasons),
  records: Schema.Array(RecordIds).pipe(Schema.withConstructorDefault(Effect.succeed([]))),
}) {
  /**
   * The reason, what was found, and what to change, which depends on the reason.
   */
  override get message(): string {
    const remedy =
      this.reason === "unknown-record" && this.records.length === 0
        ? emptyBulkRemedy
        : remedies[this.reason];

    return `The PNP document cannot be read into supports (${this.reason}): ${this.detail}. ${remedy}`;
  }
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
 * The guide's spellings of values, by the element whose text each is a spelling of, each with the
 * schema's value it reads as: `restriction-type`'s chemistry restriction (row 6) and
 * `braille-type`'s braille type (row 12).
 *
 * A spelling is the guide's for that element's vocabulary alone, so the same text anywhere else
 * (a `person-sourced-id` or a `font-name` of `ubae`) is read as written.
 */
const valueSpellings: ReadonlyMap<string, ReadonlyMap<string, string>> = new Map([
  ["braille-type", new Map([["ubae", "ebae"]])],
  ["restriction-type", new Map([["skip-chemical-equations", "skip-chemistry-equations"]])],
]);

/**
 * The contract's {@link pnpFeatures}, for lookup. An `ext:` value anywhere is any `ext:` followed
 * by one or more non-space characters (row 2), so no value is filtered by the schema's pattern.
 */
const featureNames: ReadonlySet<string> = new Set(pnpFeatures);

/**
 * The three sets' schema names, each with the field of {@link PnpSupports} it fills.
 */
const setNames: ReadonlyMap<string, "atStart" | "optional" | "prohibited"> = new Map([
  ["activate-as-option-set", "optional"],
  ["activate-at-initialization-set", "atStart"],
  ["prohibit-set", "prohibited"],
]);

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
 * Decide whether a schema name names a PNP feature.
 *
 * @param name The schema name.
 * @returns Whether it is one of {@link pnpFeatures}.
 */
const isFeature = (name: string): name is PnpFeature => featureNames.has(name);

/**
 * Read a value as one of a vocabulary's values.
 *
 * @param values The vocabulary.
 * @param value The value, in the schema's spelling.
 * @returns The vocabulary's value, none for a value outside it.
 */
const memberOf = <Value extends number | string>(
  values: readonly Value[],
  value: number | string,
): Option.Option<Value> => Option.fromNullishOr(values.find((member) => member === value));

/**
 * Decide whether a value is an `ext:` extension: `ext:` followed by one or more non-space
 * characters (row 2).
 *
 * @param value The value.
 * @returns Whether it is one.
 */
const isExtension = (value: string): value is PnpExtension => /^ext:\S+$/u.test(value);

/**
 * Read a value as one of a vocabulary's values or an `ext:` extension of it.
 *
 * @param values The vocabulary.
 * @param value The value, in the schema's spelling.
 * @returns The value, none for one that is neither.
 */
const extensibleOf = <Value extends string>(
  values: readonly Value[],
  value: string,
): Option.Option<PnpExtension | Value> =>
  isExtension(value) ? Option.some(value) : memberOf(values, value);

/**
 * Read values as a set of a vocabulary's values and `ext:` extensions.
 *
 * @param values The vocabulary.
 * @param texts The values, in the schema's spelling.
 * @returns The values that are one or the other.
 */
const extensibleSet = <Value extends string>(
  values: readonly Value[],
  texts: Iterable<string>,
): ReadonlySet<PnpExtension | Value> =>
  new Set([...texts].flatMap((text) => Option.toArray(extensibleOf(values, text))));

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
 * Read an element's text: its text children joined and trimmed, in the schema's spelling where
 * {@link valueSpellings} gives the guide's spelling for this element.
 *
 * @param element The element.
 * @returns The text, trimmed.
 */
const textOf = (element: SourceElement): string => {
  const text = element.children
    .map((child) => (child.kind === "text" ? child.text : ""))
    .join("")
    .trim();

  return valueSpellings.get(schemaName(element))?.get(text) ?? text;
};

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
 * The lexical forms of XML Schema's `decimal`, `integer` and `double` that have a finite value: an
 * optional sign, digits with an optional fraction, and an optional exponent, between XML
 * whitespace.
 *
 * `Number` alone reads more than that, `0x1E` as 30 and `0b11` as 3 among it, so the text is
 * checked against this form before `Number` converts it.
 *
 * @see https://www.w3.org/TR/xmlschema-2/#double
 */
const numberForm = /^[\t\n\r ]*[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?[\t\n\r ]*$/u;

/**
 * Read a number as XML Schema writes a float or an integer; anything else is no number: a
 * hexadecimal, binary or octal literal, `INF`, `NaN`, and a value beyond the double range.
 *
 * @param value The text.
 * @returns The finite number, none for any other text.
 */
const numberOf = (value: string): Option.Option<number> => {
  const parsed = Number(value);

  return numberForm.test(value) && Number.isFinite(parsed) ? Option.some(parsed) : Option.none();
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
type Assigned = ReadonlyMap<PnpFeature, readonly SourceElement[]>;

/**
 * What one pass over a profile's children finds: the features, the three sets, and the names
 * read past.
 */
interface Scan {
  readonly assigned: Assigned;
  readonly ignored: readonly string[];
  readonly sets: Readonly<Record<"atStart" | "optional" | "prohibited", ReadonlySet<PnpFeature>>>;
}

/**
 * Scan a profile's children: sort each into a feature, a set, or the ignored.
 *
 * @param pnp The `access-for-all-pnp` element.
 * @returns What it holds.
 */
const scan = (pnp: SourceElement): Scan => {
  const assigned = new Map<PnpFeature, SourceElement[]>();
  const ignored: string[] = [];
  const sets = {
    atStart: new Set<PnpFeature>(),
    optional: new Set<PnpFeature>(),
    prohibited: new Set<PnpFeature>(),
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
      for (const member of pnpChildren(child).map(schemaName).filter(isFeature)) {
        sets[set].add(member);
      }
    } else if (isFeature(name)) {
      const elements = assigned.get(name);

      if (elements === undefined) {
        assigned.set(name, [child]);
      } else {
        elements.push(child);
      }
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
  brailleType: Option.flatMap(childText(element, "braille-type"), (value) =>
    extensibleOf(brailleTypes, value),
  ),
  deliveryMode: Option.getOrElse(
    Option.flatMap(childText(element, "delivery-mode"), (value) =>
      extensibleOf(brailleDeliveryModes, value),
    ),
    () => "refreshable",
  ),
  grade: Option.getOrElse(
    Option.flatMap(childNumber(element, "grade"), (value) => memberOf(brailleGrades, value)),
    () => 2,
  ),
  language: langOf(element),
  mathType: Option.flatMap(childText(element, "math-type"), (value) =>
    extensibleOf(mathTypes, value),
  ),
});

/**
 * Read `spoken`'s preferences, with the schema's defaults; a `reading-type` that is not
 * `computer-read-aloud` is the default `screen-reader`.
 *
 * @param element The feature element.
 * @returns The preferences.
 */
const spokenOf = (element: SourceElement): SpokenPreferences => ({
  linkIndication: Option.flatMap(childText(element, "link-indication"), (value) =>
    memberOf(linkIndications, value),
  ),
  pitch: Option.getOrElse(childNumber(element, "pitch"), () => 0.5),
  readingType: Option.contains(childText(element, "reading-type"), "computer-read-aloud")
    ? "computer-read-aloud"
    : "screen-reader",
  restrictions: extensibleSet(restrictionTypes, childTexts(element, "restriction-type")),
  speechRate: Option.getOrElse(childNumber(element, "speech-rate"), () => 180),
  typingEcho: Option.flatMap(childText(element, "typing-echo"), (value) =>
    memberOf(typingEchoes, value),
  ),
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
    genericFontFace: fontFace.pipe(
      Option.flatMap((face) => childText(face, "generic-font-face")),
      Option.flatMap((value) => memberOf(genericFontFaces, value)),
    ),
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
 * Stand in for the element of a feature that a set makes active and the profile does not assign:
 * an element with no attributes and no children, which reads as the feature with every setting at
 * the Schema's default.
 *
 * @param name The feature's schema name.
 * @returns The empty element.
 */
const unsetElement = (name: PnpFeature): SourceElement => ({
  attributes: [],
  children: [],
  kind: "element",
  local: name,
  namespace: "",
});

/**
 * Build the {@link PnpSupports} of a scanned profile, by ruling D17 on the three sets.
 *
 * A feature is active when `activate-at-initialization-set` names it, or when the profile assigns
 * it and `activate-as-option-set` does not name it; a feature in the option set alone is
 * available to the candidate and off at start, so only {@link PnpSupports.optional} holds it.
 * `prohibit-set` wins over both sets and over an assignment: a prohibited feature is in
 * {@link PnpSupports.prohibited} and in no other field. Every other field is the settings of the
 * active features, a feature the profile does not assign reading with the Schema's defaults.
 *
 * @param scanned What the scan found.
 * @returns The supports.
 */
const supportsOf = (scanned: Scan): PnpSupports => {
  const { assigned, ignored, sets } = scanned;
  const atStart = sets.atStart.difference(sets.prohibited);
  const optional = sets.optional.difference(sets.prohibited);
  const features = atStart.union(
    new Set(assigned.keys()).difference(sets.optional).difference(sets.prohibited),
  );
  const elementsOf = (name: PnpFeature): readonly SourceElement[] =>
    features.has(name) ? (assigned.get(name) ?? [unsetElement(name)]) : [];
  const firstOf = (name: PnpFeature): Option.Option<SourceElement> =>
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
    atStart,
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
    hazards: extensibleSet(hazardAvoidances, elementsOf("hazard-avoidance").map(textOf)),
    ignored,
    inputRequirements: extensibleSet(
      inputRequirementValues,
      elementsOf("input-requirements").map(textOf),
    ),
    invertedColors: Option.map(firstOf("invert-display-polarity"), (element) => ({
      background: attributeOf(element, "background"),
      foreground: attributeOf(element, "foreground"),
    })),
    keywordTranslationLanguage: Option.flatMap(firstOf("keyword-translation"), langOf),
    languages: new Map(
      languageFeatures.flatMap((name): readonly (readonly [LanguageFeature, string])[] =>
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
    optional,
    prohibited: sets.prohibited,
    readAloud: Option.map(firstOf("spoken"), (element) => spokenOf(element).readingType),
    signLanguage: Option.flatMap(firstOf("sign-language"), langOf),
    spoken: Option.map(firstOf("spoken"), spokenOf),
    suppressTts: noSupports.suppressTts,
    text: textAppearance.pipe(Option.map(textPreferencesOf)),
    toolSettings: {
      calculatorType: Option.flatMap(firstOf("calculator-on-screen"), (element) =>
        Option.flatMap(attributeOf(element, "calculator-type"), (value) =>
          extensibleOf(calculatorTypes, value),
        ),
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
 * Take the ids of a record, as {@link InvalidPnp.records} lists them.
 *
 * @param record The record.
 * @returns Its person and appointment ids.
 */
const idsOf = (record: PnpRecord): InvalidPnp["records"][number] => ({
  appointmentIds: record.appointmentIds,
  personSourcedId: record.personSourcedId,
});

/**
 * Spell a record's ids for a refusal's detail.
 *
 * @param record The record's ids.
 * @returns Its person and appointments.
 */
const describeRecord = (record: InvalidPnp["records"][number]): string =>
  record.appointmentIds.length === 0
    ? `person ${record.personSourcedId}`
    : `person ${record.personSourcedId} (appointments ${record.appointmentIds.join(", ")})`;

/**
 * Spell what a selector matched for a refusal's detail: the ids it names and how many records
 * carry them, or that no selector was given and so every record matched.
 *
 * @param selector The selector.
 * @param count How many records it matched.
 * @returns The sentence clause.
 */
const describeMatches = (selector: PnpSelector, count: number): string => {
  const named = [
    ...(selector.personSourcedId === undefined ? [] : [`person ${selector.personSourcedId}`]),
    ...(selector.appointmentId === undefined ? [] : [`appointment ${selector.appointmentId}`]),
  ];

  return named.length === 0
    ? `no selector was given, so all ${count} records match`
    : `${named.join(" and ")} matches ${count === 0 ? "no record" : `${count} records`}`;
};

/**
 * Choose the one record a selector names: with neither id, the file's one record.
 *
 * A file that holds no record fails as `unknown-record` whatever the selector, since no selector
 * could name one.
 *
 * @param records The file's records.
 * @param selector Which to read.
 * @returns The record, or `ambiguous-record` or `unknown-record` naming the ids the file holds,
 *   which {@link InvalidPnp.records} also carries.
 */
const selectRecord = (
  records: readonly PnpRecord[],
  selector: PnpSelector,
): Effect.Effect<PnpRecord, InvalidPnp> => {
  const held = records.map(idsOf);

  if (records.length === 0) {
    return Effect.fail(
      new InvalidPnp({ detail: "the document holds no record", reason: "unknown-record" }),
    );
  }

  const matching = records.filter(
    (record) =>
      (selector.personSourcedId === undefined ||
        record.personSourcedId === selector.personSourcedId) &&
      (selector.appointmentId === undefined ||
        record.appointmentIds.includes(selector.appointmentId)),
  );
  const [first] = matching;
  const detail = `${describeMatches(selector, matching.length)}; the document holds ${held.map(describeRecord).join("; ")}`;

  if (first === undefined) {
    return Effect.fail(new InvalidPnp({ detail, reason: "unknown-record", records: held }));
  }

  return matching.length === 1
    ? Effect.succeed(first)
    : Effect.fail(new InvalidPnp({ detail, reason: "ambiguous-record", records: held }));
};

/**
 * Turn the reader's refusal into `unreadable`, naming the shared reader's own rule.
 *
 * The rule is `readerRule` when the reader refused the input (`unsupported-encoding`, `nul`,
 * `element-depth` and the rest of crust's `ReaderRefusal` rules), and `not-well-formed` when the
 * parser did, with its line and column.
 *
 * @param refusal The adapter's refusal.
 * @returns The `InvalidPnp`.
 */
const unreadable = (refusal: Refusal): InvalidPnp => {
  const facts = Object.values(refusal.detail).join("; ");
  const rule = Option.getOrElse(refusal.readerRule, () => refusal.rule);
  const where =
    refusal.location.kind === "position"
      ? ` at line ${refusal.location.line}, column ${refusal.location.column}`
      : "";

  return new InvalidPnp({
    detail: `the bytes are not readable XML (${rule}${where}): ${facts}`,
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
 * requirements read (rows 4, 5); `activate-at-initiation-set`, `spell-checker`,
 * `homophone-checker` and `assignment-id` read as their schema counterparts (rows 7 to 9), and
 * `skip-chemical-equations` and `ubae` do in `restriction-type` and `braille-type`, the elements
 * their rows name (rows 6, 12), and nowhere else, so a `person-sourced-id` or a `font-name` of
 * `ubae` is read as written; a `font-size` under 4 is a factor, otherwise points (row 10);
 * `letter-spacing` is pixels (row 11). A number is XML Schema's lexical form of a float or an
 * integer, so `0x1E` is no number. An element in another namespace is ignored and counted.
 * Nothing is validated against the XSD, but a value outside its vocabulary (neither one of the
 * contract's values nor an `ext:` extension where the vocabulary takes one), and a set member
 * that names no feature, reads as absent, so the result keeps the contract's types. A field the
 * PNP does not set takes `noPnpSupports`' value, and the result satisfies `PnpSupportsSchema`.
 *
 * The three sets follow ruling D17, per AfA PNP 3.0. A feature named in
 * `activate-at-initialization-set` is active at start, with or without an element of its own, and
 * a feature without one reads with the Schema's defaults. A feature named in
 * `activate-as-option-set` and not in the at-start set is available to the candidate but off at
 * start: it is in `optional`, and no other field reads it, its element's settings included. A
 * feature the profile assigns and names in no set is active. `prohibit-set` wins over both sets
 * and over an assignment: a prohibited feature is in `prohibited` and in no other field. So
 * `features` holds the active features, and `atStart` and `optional` hold the names of their
 * sets that are not prohibited, a feature in both sets being active and in both.
 *
 * In a bulk file, the record is chosen by `personSourcedId` and `appointmentId` (either or both);
 * with neither, a file of one record reads that record, and one of several fails.
 *
 * @param bytes The document's bytes.
 * @param selector Which of its records to read, when it holds more than one.
 * @returns The supports; {@link InvalidPnp} when the bytes are not readable XML (`unreadable`,
 *   naming the reader's own rule), the root is not a PNP root (`not-a-pnp`, naming it), the
 *   selector names several records (`ambiguous-record`), or it names none or the file holds none
 *   (`unknown-record`); the two record reasons name the ids the file holds, in `detail` and in
 *   `records`, and each reason names its own remedy.
 */
export const readPnp = Effect.fn("plate.readPnp")(function* readPnp(
  bytes: Uint8Array,
  selector: PnpSelector = {},
): Effect.fn.Return<PnpSupports, InvalidPnp> {
  const source = yield* readSource(location, bytes).pipe(Effect.mapError(unreadable));
  const profile = yield* profileOf(source.root, selector);
  const supports = supportsOf(
    Option.match(profile, {
      onNone: (): Scan => ({
        assigned: new Map(),
        ignored: [],
        sets: { atStart: new Set(), optional: new Set(), prohibited: new Set() },
      }),
      onSome: scan,
    }),
  );

  yield* Effect.annotateCurrentSpan({
    "pnp.features": supports.features.size,
    "pnp.ignored": supports.ignored.length,
    "pnp.optional": supports.optional.size,
  });

  return supports;
});

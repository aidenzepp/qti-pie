/**
 * The speech plan: one model of what a speech engine speaks for a tree of content, read from both
 * of QTI's SSML carriers (A-3a, inline SSML 1.1 elements; A-3b, the `data-ssml` attribute), with
 * `data-qti-suppress-tts` deciding which reading types each segment is withheld from, and a PLS
 * lexicon's aliases applied (A-35).
 *
 * A browser speech engine (the Web Speech API) speaks plain text with a language and a rate and
 * commits to no SSML, so a {@link SpeechSegment} carries the text to speak beside the written text,
 * keeps a `phoneme` and a prosody `rate` as data for an engine that can use them, and turns a
 * `break` into a pause segment. The read-aloud engine (issue m4-04) consumes the plan; nothing
 * here touches the DOM.
 *
 * A browser module: it value-imports from `effect` only `Option` and `Result`, no Schema and no
 * server module, so the runtime bundle may load it. The Data-SSML value is therefore read by a
 * decoder of this module's own that mirrors the binding `#plate/validate/data-ssml.ts` holds in
 * Schema, so the two agree on what decodes.
 *
 * @module
 */
import { Option, Result } from "effect";
import type { SourceChild, SourceElement } from "#plate/document/source.ts";
import { ssmlNamespace, xmlNamespace } from "#plate/document/source.ts";
import type { ReadingType } from "#plate/supports.ts";

/**
 * A pause between segments: SSML's `break`, by `strength` (`medium` when the carrier gives none)
 * and, when given, a `time` in CSS's time format (`250ms`, `3s`), as written.
 */
export interface SpeechPause {
  readonly strength: string;
  readonly time: Option.Option<string>;
}

/**
 * A pronunciation an engine that takes phonemes speaks in place of the text: SSML's `phoneme`, the
 * string `ph` in the `alphabet` named, as written (`ipa`, `x-sampa`, or none when the carrier
 * gives none).
 */
export interface SpeechPhoneme {
  readonly alphabet: Option.Option<string>;
  readonly ph: string;
}

/**
 * One run of speech: the text as the candidate sees it, the text an engine speaks for it, and what
 * applies to it.
 *
 * A text segment has a non-empty `written`; its `spoken` is a `sub`'s alias, the written text
 * spelled out with spaces for `say-as` `characters`, or the written text itself, with a lexicon's
 * aliases substituted (see {@link speechPlan}). A pause segment has empty `written` and `spoken`
 * and carries its `pause`. `suppressed` names the reading types the nearest ancestor's
 * `data-qti-suppress-tts` withholds the segment from, empty when none applies. `lang` is the
 * nearest `xml:lang`, which the Web Speech API takes as the utterance's language. `rate` is the
 * nearest prosody rate as written (`slow`, `fast`, a percentage), `phoneme` the nearest phoneme,
 * and `sayAs` the nearest `say-as` interpretation (`characters`, `date`, `telephone`, …), each
 * none where no carrier gives one.
 */
export interface SpeechSegment {
  readonly lang: Option.Option<string>;
  readonly pause: Option.Option<SpeechPause>;
  readonly phoneme: Option.Option<SpeechPhoneme>;
  readonly rate: Option.Option<string>;
  readonly sayAs: Option.Option<string>;
  readonly spoken: string;
  readonly suppressed: ReadonlySet<ReadingType>;
  readonly written: string;
}

/**
 * What a speech engine speaks for a tree: its segments in document order.
 */
export interface SpeechPlan {
  readonly segments: readonly SpeechSegment[];
}

/**
 * One lexeme of a lexicon that a plain-text engine can apply: the `grapheme` spellings it matches
 * and the `alias` spoken in place of any of them.
 */
export interface LexiconEntry {
  readonly alias: string;
  readonly graphemes: readonly string[];
}

/**
 * A PLS 1.0 pronunciation lexicon as plain data, the value `readLexicon` returns: its `alphabet`
 * and `xml:lang` as written, and its alias entries in document order. A lexeme with only
 * `phoneme` children has no entry, since the plan substitutes text and an engine that takes
 * phonemes takes them through {@link SpeechSegment.phoneme}.
 */
export interface Lexicon {
  readonly alphabet: Option.Option<string>;
  readonly entries: readonly LexiconEntry[];
  readonly lang: Option.Option<string>;
}

/**
 * The speech functions a carrier gives one element, as the walk composes them: each one is the
 * value of the carrier nearest the text, or none.
 */
interface Functions {
  readonly alias: Option.Option<string>;
  readonly pause: Option.Option<SpeechPause>;
  readonly phoneme: Option.Option<SpeechPhoneme>;
  readonly rate: Option.Option<string>;
  readonly sayAs: Option.Option<string>;
}

/**
 * No function given.
 */
const noFunctions: Functions = {
  alias: Option.none(),
  pause: Option.none(),
  phoneme: Option.none(),
  rate: Option.none(),
  sayAs: Option.none(),
};

/**
 * What the walk carries down the tree: the nearest `xml:lang`, the nearest prosody rate, and the
 * reading types the nearest `data-qti-suppress-tts` withholds content from.
 */
interface Context {
  readonly lang: Option.Option<string>;
  readonly rate: Option.Option<string>;
  readonly suppressed: ReadonlySet<ReadingType>;
}

/**
 * The context at the root: no language, no rate, nothing suppressed.
 */
const rootContext: Context = {
  lang: Option.none(),
  rate: Option.none(),
  suppressed: new Set(),
};

/**
 * The reading types each `data-qti-suppress-tts` value withholds content from: `all` is both.
 */
const suppressions: ReadonlyMap<string, ReadonlySet<ReadingType>> = new Map([
  ["all", new Set<ReadingType>(["computer-read-aloud", "screen-reader"])],
  ["computer-read-aloud", new Set<ReadingType>(["computer-read-aloud"])],
  ["screen-reader", new Set<ReadingType>(["screen-reader"])],
]);

/**
 * The SSML elements whose content no engine speaks: `meta`, `metadata` and `lexicon` describe the
 * fragment, and `desc` describes an `audio` source for a non-speech rendering (SSML 1.1 §3.3.3).
 * Every other SSML element's text is spoken.
 */
const unspoken: ReadonlySet<string> = new Set(["desc", "lexicon", "meta", "metadata"]);

/**
 * The five properties a Data-SSML object may hold, each a speech function (`DataSSMLDType`).
 */
const functionNames: ReadonlySet<string> = new Set([
  "break",
  "phoneme",
  "prosody",
  "say-as",
  "sub",
]);

/**
 * The `strength` values a `break` takes (SSML 1.1 §3.2.3; Data-SSML `BreakDType`).
 */
const breakStrengths: ReadonlySet<string> = new Set([
  "medium",
  "none",
  "strong",
  "weak",
  "x-strong",
  "x-weak",
]);

/**
 * The `alphabet` values a Data-SSML `phoneme` takes.
 */
const phonemeAlphabets: ReadonlySet<string> = new Set(["ipa", "x-sampa"]);

/**
 * The `type` values a Data-SSML `phoneme` takes.
 */
const phonemeTypes: ReadonlySet<string> = new Set(["default", "ruby"]);

/**
 * The `interpret-as` values a Data-SSML `say-as` takes.
 */
const interpretations: ReadonlySet<string> = new Set([
  "cardinal",
  "characters",
  "date",
  "ordinal",
  "telephone",
  "time",
]);

/**
 * A character that makes a Data-SSML NormalizedString (`time`, `rate`) fail: a tab, line feed or
 * carriage return.
 */
const unnormalized = /[\t\n\r]/u;

/**
 * The `strength` a `break` has when its carrier gives none (SSML 1.1 §3.2.3).
 */
const defaultStrength = "medium";

/**
 * Report whether a child is an element.
 *
 * @param child A child of a source element.
 * @returns Whether `child` is an element.
 */
const isElement = (child: SourceChild): child is SourceElement => child.kind === "element";

/**
 * Report whether an element is an inline SSML element.
 *
 * @param element The element.
 * @returns Whether it is in the SSML namespace.
 */
const isSsml = (element: SourceElement): boolean => element.namespace === ssmlNamespace;

/**
 * Read an attribute of an element: in no namespace, or in the namespace given.
 *
 * @param element The element.
 * @param local The attribute's local name.
 * @param namespace The attribute's namespace, none by default.
 * @returns The value as written, none without the attribute.
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
  ).pipe(Option.map((attribute) => attribute.value));

/**
 * Report whether a text is whitespace only, so a run between elements is not a segment.
 *
 * @param value The text.
 * @returns Whether it holds no character but XML whitespace.
 */
const isBlank = (value: string): boolean => value.trim() === "";

/**
 * Read the text content of an element: every text run under it, in order, but for the content of
 * an {@link unspoken} SSML element.
 *
 * @param element The element.
 * @returns The text, joined.
 */
const textOf = (element: SourceElement): string =>
  element.children
    .map((child) => {
      if (child.kind === "text") {
        return child.text;
      }

      return child.kind === "element" && !(isSsml(child) && unspoken.has(child.local))
        ? textOf(child)
        : "";
    })
    .join("");

/**
 * A JSON object as `JSON.parse` gives one, before the binding's definitions are read from it. This
 * module is the parsing boundary of a `data-ssml` value in the browser, where Schema is not loaded
 * (ruling OD-6), so its values stay unparsed until {@link definitionOf} reads them.
 */
// oxlint-disable-next-line anti-slop/no-unsafe-dictionary-type -- `JSON.parse` gives any value, and `decodeDataSsml` is the check that parses it, in a browser module that loads no Schema.
type JsonObject = Readonly<Record<string, unknown>>;

/**
 * Report whether a parsed JSON value is an object that is not an array.
 *
 * @param value The value.
 * @returns Whether it is an object.
 */
// oxlint-disable-next-line anti-slop/no-unknown-parameters, anti-slop/no-runtime-typeof -- `JSON.parse` gives any value, and this is the first check that parses it, in a browser module that loads no Schema.
const isObject = (value: unknown): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * The properties of a decoded Data-SSML definition, by name.
 */
type Definition = ReadonlyMap<string, string>;

/**
 * Read one property of a Data-SSML object as a definition: an object whose every key is one of
 * those listed and whose every value is a string.
 *
 * @param object The Data-SSML object.
 * @param name The property.
 * @param keys The properties the definition declares.
 * @returns The properties present, or none when the value is no object, a key is unlisted or a
 *   value is not a string.
 */
const definitionOf = (
  object: JsonObject,
  name: string,
  keys: readonly string[],
): Option.Option<Definition> => {
  const value = object[name];

  if (!isObject(value)) {
    return Option.none();
  }

  const properties = new Map<string, string>();

  for (const [key, property] of Object.entries(value)) {
    // oxlint-disable-next-line anti-slop/no-runtime-typeof -- The property is a parsed JSON value, and this is the check that parses it as the binding's string.
    if (!keys.includes(key) || typeof property !== "string") {
      return Option.none();
    }

    properties.set(key, property);
  }

  return Option.some(properties);
};

/**
 * Report whether an optional enumerated property, when present, is one of its values.
 *
 * @param definition The definition's properties.
 * @param key The property.
 * @param values The enumeration.
 * @returns Whether the property is absent or listed.
 */
const enumerated = (
  definition: ReadonlyMap<string, string>,
  key: string,
  values: ReadonlySet<string>,
): boolean => {
  const property = definition.get(key);

  return property === undefined || values.has(property);
};

/**
 * Report whether an optional NormalizedString property, when present, holds no tab, line feed or
 * carriage return.
 *
 * @param definition The definition's properties.
 * @param key The property.
 * @returns Whether the property is absent or normalized.
 */
const normalized = (definition: ReadonlyMap<string, string>, key: string): boolean => {
  const property = definition.get(key);

  return property === undefined || !unnormalized.test(property);
};

/**
 * Read one of a Data-SSML object's five properties: absent, or a definition that decodes to a
 * function value, or one that does not decode.
 *
 * @param object The Data-SSML object.
 * @param name The property (`break`, `phoneme`, `prosody`, `say-as` or `sub`).
 * @param keys The properties its definition declares.
 * @param build Turn a definition of only those keys into the function's value, none when it
 *   lacks a required property or holds a value outside an enumeration.
 * @returns Some of the value (none of it when the property is absent), or none when the property
 *   is present and does not decode.
 */
const readFunction = <Value>(
  object: JsonObject,
  name: string,
  keys: readonly string[],
  build: (definition: Definition) => Option.Option<Value>,
): Option.Option<Option.Option<Value>> =>
  name in object
    ? Option.map(Option.flatMap(definitionOf(object, name, keys), build), Option.some)
    : Option.some(Option.none());

/**
 * Decode a `data-ssml` value as the Data-SSML binding defines it: one JSON object of up to five
 * properties, `break`, `phoneme`, `prosody`, `say-as` and `sub`, each an object of only the
 * properties the binding declares for it, with the string type and the enumeration each takes.
 * This mirrors the Schema in `#plate/validate/data-ssml.ts`, which a browser module cannot load.
 *
 * @param value The attribute's value.
 * @returns The functions it gives, or none when it does not decode.
 */
const decodeDataSsml = (value: string): Option.Option<Functions> => {
  // oxlint-disable-next-line anti-slop/no-unknown-returns -- `JSON.parse` gives any value, and `isObject` is the first check that parses it.
  const parsed = Result.getOrUndefined(Result.try((): unknown => JSON.parse(value)));

  if (!isObject(parsed) || !Object.keys(parsed).every((key) => functionNames.has(key))) {
    return Option.none();
  }

  return Option.all({
    alias: readFunction(parsed, "sub", ["alias"], (definition) =>
      Option.fromNullishOr(definition.get("alias")),
    ),
    pause: readFunction(parsed, "break", ["strength", "time"], (definition) =>
      enumerated(definition, "strength", breakStrengths) && normalized(definition, "time")
        ? Option.some({
            strength: definition.get("strength") ?? defaultStrength,
            time: Option.fromNullishOr(definition.get("time")),
          })
        : Option.none(),
    ),
    phoneme: readFunction(parsed, "phoneme", ["alphabet", "ph", "type"], (definition) =>
      enumerated(definition, "alphabet", phonemeAlphabets) &&
      enumerated(definition, "type", phonemeTypes)
        ? Option.map(Option.fromNullishOr(definition.get("ph")), (ph) => ({
            alphabet: Option.fromNullishOr(definition.get("alphabet")),
            ph,
          }))
        : Option.none(),
    ),
    rate: Option.map(
      readFunction(parsed, "prosody", ["rate"], (definition) =>
        normalized(definition, "rate")
          ? Option.some(Option.fromNullishOr(definition.get("rate")))
          : Option.none(),
      ),
      Option.flatten,
    ),
    sayAs: readFunction(parsed, "say-as", ["interpret-as"], (definition) =>
      Option.filter(Option.fromNullishOr(definition.get("interpret-as")), (interpretAs) =>
        interpretations.has(interpretAs),
      ),
    ),
  });
};

/**
 * Read the function an inline SSML element carries: `sub`'s alias, `say-as`'s interpretation,
 * `phoneme`'s pronunciation, `prosody`'s rate, or `break`'s pause. An element that lacks the
 * attribute its function needs (a `sub` with no `alias`, a `phoneme` with no `ph`, a `say-as` with
 * no `interpret-as`) carries none, and its text is spoken as written.
 *
 * @param element The element, in the SSML namespace.
 * @returns The functions, {@link noFunctions} for any other SSML element.
 */
const inlineFunctions = (element: SourceElement): Functions => {
  switch (element.local) {
    case "break": {
      return {
        ...noFunctions,
        pause: Option.some({
          strength: Option.getOrElse(attributeOf(element, "strength"), () => defaultStrength),
          time: attributeOf(element, "time"),
        }),
      };
    }
    case "phoneme": {
      return {
        ...noFunctions,
        phoneme: Option.map(attributeOf(element, "ph"), (ph) => ({
          alphabet: attributeOf(element, "alphabet"),
          ph,
        })),
      };
    }
    case "prosody": {
      return { ...noFunctions, rate: attributeOf(element, "rate") };
    }
    case "say-as": {
      return { ...noFunctions, sayAs: attributeOf(element, "interpret-as") };
    }
    case "sub": {
      return { ...noFunctions, alias: attributeOf(element, "alias") };
    }
    default: {
      return noFunctions;
    }
  }
};

/**
 * Compose the functions of an element's two carriers: the inline element's own function wins over
 * the `data-ssml` one for the same function, since it is the carrier nearer the text.
 *
 * @param element The element.
 * @returns Its functions.
 */
const functionsOf = (element: SourceElement): Functions => {
  const json = Option.getOrElse(
    Option.flatMap(attributeOf(element, "data-ssml"), decodeDataSsml),
    () => noFunctions,
  );
  const inline = isSsml(element) ? inlineFunctions(element) : noFunctions;

  return {
    alias: Option.orElse(inline.alias, () => json.alias),
    pause: Option.orElse(inline.pause, () => json.pause),
    phoneme: Option.orElse(inline.phoneme, () => json.phoneme),
    rate: Option.orElse(inline.rate, () => json.rate),
    sayAs: Option.orElse(inline.sayAs, () => json.sayAs),
  };
};

/**
 * The grapheme segmenter `say-as` `characters` spells a text out with, so a character of several
 * code points (a letter and its combining mark) is one spoken character.
 */
const graphemes = new Intl.Segmenter(undefined, { granularity: "grapheme" });

/**
 * Spell a text out as `say-as` `characters` speaks it: each grapheme that is not whitespace,
 * separated by spaces.
 *
 * @param written The text.
 * @returns The characters, spaced.
 */
const spelledOut = (written: string): string =>
  [...graphemes.segment(written)]
    .map(({ segment }) => segment)
    .filter((character) => !isBlank(character))
    .join(" ");

/**
 * Derive the text an engine speaks for a written text under some functions: a `sub`'s alias, else
 * the text spelled out for `say-as` `characters`, else the text itself.
 *
 * @param written The written text.
 * @param functions The functions that apply.
 * @returns The spoken text.
 */
const spokenOf = (written: string, functions: Functions): string =>
  Option.getOrElse(functions.alias, () =>
    Option.contains(functions.sayAs, "characters") ? spelledOut(written) : written,
  );

/**
 * Construct the segments of one element under its context: a pause for a `break`, one segment for
 * an element whose function replaces its text (`sub`, `say-as`, `phoneme`), else a segment per
 * text run and the segments of each child element, with a `data-ssml` pause after the element's
 * content.
 *
 * @param element The element.
 * @param outer The context above it.
 * @returns Its segments, in document order.
 */
const segmentsOf = (element: SourceElement, outer: Context): readonly SpeechSegment[] => {
  if (isSsml(element) && unspoken.has(element.local)) {
    return [];
  }

  const functions = functionsOf(element);
  const context: Context = {
    lang: Option.orElse(attributeOf(element, "lang", xmlNamespace), () => outer.lang),
    rate: Option.orElse(functions.rate, () => outer.rate),
    suppressed: Option.getOrElse(
      Option.flatMap(attributeOf(element, "data-qti-suppress-tts"), (value) =>
        Option.fromNullishOr(suppressions.get(value)),
      ),
      () => outer.suppressed,
    ),
  };
  const pause: readonly SpeechSegment[] = Option.match(functions.pause, {
    onNone: () => [],
    onSome: (value) => [
      {
        lang: context.lang,
        pause: Option.some(value),
        phoneme: Option.none(),
        rate: Option.none(),
        sayAs: Option.none(),
        spoken: "",
        suppressed: context.suppressed,
        written: "",
      },
    ],
  });
  const replaces =
    Option.isSome(functions.alias) ||
    Option.isSome(functions.sayAs) ||
    Option.isSome(functions.phoneme);

  if (replaces) {
    const written = textOf(element);

    return [
      ...(written === "" && Option.isNone(functions.alias)
        ? []
        : [
            {
              lang: context.lang,
              pause: Option.none(),
              phoneme: functions.phoneme,
              rate: context.rate,
              sayAs: functions.sayAs,
              spoken: spokenOf(written, functions),
              suppressed: context.suppressed,
              written,
            },
          ]),
      ...pause,
    ];
  }

  return [
    ...element.children.flatMap((child): readonly SpeechSegment[] => {
      if (isElement(child)) {
        return segmentsOf(child, context);
      }

      return child.kind === "text" && !isBlank(child.text)
        ? [
            {
              lang: context.lang,
              pause: Option.none(),
              phoneme: Option.none(),
              rate: context.rate,
              sayAs: Option.none(),
              spoken: child.text,
              suppressed: context.suppressed,
              written: child.text,
            },
          ]
        : [];
    }),
    ...pause,
  ];
};

/**
 * Escape a grapheme for a regular expression.
 *
 * @param grapheme The grapheme as written.
 * @returns The grapheme with its metacharacters escaped.
 */
const escaped = (grapheme: string): string => grapheme.replaceAll(/[$()*+.?[\\\]^{|}]/gu, "\\$&");

/**
 * Construct the substitution a lexicon makes in a spoken text: one pass that replaces each
 * whole-word, case-sensitive grapheme match with its alias, the longest graphemes matched first, so
 * no alias is itself re-matched.
 *
 * @param lexicon The lexicon.
 * @returns The substitution, the identity for a lexicon with no entry.
 */
const substitutionOf = (lexicon: Lexicon): ((spoken: string) => string) => {
  const aliases = new Map(
    lexicon.entries.flatMap((entry) =>
      entry.graphemes
        .filter((grapheme) => grapheme !== "")
        .map((grapheme): readonly [string, string] => [grapheme, entry.alias]),
    ),
  );

  if (aliases.size === 0) {
    return (spoken) => spoken;
  }

  const alternatives = [...aliases.keys()]
    .toSorted((left, right) => right.length - left.length)
    .map(escaped)
    .join("|");
  const pattern = new RegExp(`(?<![\\p{L}\\p{N}])(?:${alternatives})(?![\\p{L}\\p{N}])`, "gu");

  return (spoken) => spoken.replaceAll(pattern, (match) => aliases.get(match) ?? match);
};

/**
 * Read a tree of content into the speech plan an engine speaks (A-3a, A-3b, A-35).
 *
 * Both carriers read into the same segments: an inline SSML 1.1 element (`sub`, `say-as`,
 * `phoneme`, `prosody`, `break`, and the elements that only hold text) and a `data-ssml` JSON
 * value on any element. Only the structural fields of {@link SourceElement} are read (namespace,
 * local name, attributes' names and values, children), so the browser runtime can hand it a tree
 * mapped from the DOM.
 *
 * The defaults where the readings are silent:
 *
 * - An SSML element outside any `speak` is read into the plan as one inside is; no fragment rule
 *   applies to it (those are `checkSpeak`'s).
 * - A `data-ssml` value that does not decode as Data-SSML JSON is left out of the plan, and its
 *   element's text is spoken as written, because the validator already reports it.
 * - When an element carries both an inline SSML function and a `data-ssml` one for the same function,
 *   the inline element nearer the text wins. An element whose function replaces its text (`sub`,
 *   `say-as`, `phoneme`) is one segment of its whole text content, whatever carriers its
 *   descendants hold.
 * - A lexicon alias replaces a whole-word, case-sensitive grapheme match in `spoken` only; a match is
 *   whole where no letter or digit adjoins it, and `written` keeps the text as the candidate sees
 *   it.
 * - A `data-ssml` `break` is a pause after its element's content; an inline `break`, an empty
 *   element, is a pause where it stands.
 * - `data-qti-suppress-tts` on the nearest ancestor decides a segment's `suppressed`; a value other
 *   than `computer-read-aloud`, `screen-reader` and `all` carries nothing, so the next ancestor
 *   decides.
 * - A text run that is whitespace only is no segment. The content of `meta`, `metadata`, `lexicon`
 *   and `desc` is not spoken.
 *
 * @param root The tree to read, an item body or any element of it.
 * @param lexicon The lexicon whose aliases the spoken text takes, none by default.
 * @returns The plan: the segments in document order.
 */
export const speechPlan = (root: SourceElement, lexicon?: Lexicon): SpeechPlan => {
  const segments = segmentsOf(root, rootContext);

  if (lexicon === undefined) {
    return { segments };
  }

  const substitute = substitutionOf(lexicon);

  return {
    segments: segments.map((segment) => ({ ...segment, spoken: substitute(segment.spoken) })),
  };
};

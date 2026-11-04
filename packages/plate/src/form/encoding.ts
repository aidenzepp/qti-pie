/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown. */

/**
 * The one mapping between QTI values and form entries: the name each response posts under, the
 * entries a value encodes to, the value posted entries decode to, and which posted entries belong
 * to this item instance.
 *
 * Entries carry QTI's lexical forms, so a value's form is {@link format}'s and its reading is
 * {@link parseLexical}'s, with the allowances a posted form needs: a number is trimmed, and a
 * string's line breaks are a textarea's.
 */
import { Array, Effect, Option, Schema } from "effect";
import { format, parseLexical } from "#plate/model/values.ts";
import type { Single, Value } from "#plate/model/values.ts";

/**
 * One posted form entry, as `FormData` holds it: a name and a string or file value.
 */
export type Entry = readonly [name: string, value: string | Blob];

/**
 * The base types a phase-1 interaction posts: Choice's `identifier`, and Text Entry's and
 * Extended Text's `string`, `integer` and `float`.
 */
const postedBaseTypes = ["identifier", "string", "integer", "float"] as const;

/**
 * A base type a phase-1 interaction posts.
 */
export type PostedBaseType = (typeof postedBaseTypes)[number];

/**
 * Report whether a phase-1 interaction can post values of a base type.
 *
 * @param baseType A declaration's base type.
 * @returns Whether `baseType` is a {@link PostedBaseType}.
 */
export const isPosted = (baseType: string): baseType is PostedBaseType =>
  postedBaseTypes.some((name) => name === baseType);

/**
 * How one response travels through the form: the entry name it posts under, from
 * {@link entryName}, and the base type and cardinality of its declaration.
 */
export interface Binding {
  readonly baseType: PostedBaseType;
  readonly cardinality: Value["cardinality"];
  readonly name: string;
}

/**
 * Settings for {@link decode}.
 */
export interface DecodeOptions {
  /**
   * The number base an integer is written in, Text Entry's `base`; 10 when absent.
   */
  readonly base?: number;
}

/**
 * Why posted entries do not decode to a value of their binding.
 */
const malformedReasons = ["single-many", "number", "identifier", "file"] as const;

/**
 * Why posted entries do not decode to a value of their binding.
 */
type MalformedReason = (typeof malformedReasons)[number];

/**
 * What each {@link MalformedReason} asks the poster to change.
 */
const remedies = {
  file: "is a file, but this response takes text; post text, not a file",
  identifier:
    "is not an identifier; post a choice's identifier, an NCName such as choiceA, as the form gives it",
  number:
    "is not a number; post digits in the interaction's base with an optional sign, or a finite decimal such as 2.5 or 1E3",
  "single-many": "was posted more than once, but its response takes one value; post it once",
} satisfies Record<MalformedReason, string>;

/**
 * The failure of decoding posted entries: they are not a value of their binding, for the reason
 * given.
 */
export class Malformed extends Schema.TaggedError<Malformed>()("Malformed", {
  entry: Schema.String,
  reason: Schema.Literals(malformedReasons),
}) {
  /**
   * The entry name and what to post instead, in one line.
   */
  override get message(): string {
    return `The form entry ${JSON.stringify(this.entry)} ${remedies[this.reason]}.`;
  }
}

/**
 * Name the form entry a response posts under in one item instance.
 *
 * The OD-2 placeholder: changing the wire name is this one edit.
 *
 * @param instance The item instance key, a lowercase UUID.
 * @param response The response declaration's identifier.
 * @returns `<instance>.<response>`.
 */
export const entryName = (instance: string, response: string): string => `${instance}.${response}`;

/**
 * Encode a value as the entries a form posts for it.
 *
 * @param value The response's value.
 * @param binding The response's binding, which names the entries.
 * @returns No entries for NULL, one for a `single`, and one for each value of a `multiple` or
 *   `ordered`, in order, all under the binding's name and in {@link format}'s lexical form.
 */
export const encode = (value: Value, binding: Binding): readonly Entry[] =>
  value.values.map((single) => [binding.name, format(single)]);

/**
 * Read a posted number in a base: an optional sign and digits, where `a` to `z` in either case are
 * the digits from 10.
 *
 * @param text The trimmed text.
 * @param base The number base.
 * @returns The number, or none when a digit is outside the base or the number is not a safe
 *   integer.
 */
const readInteger = (text: string, base: number): Option.Option<number> => {
  const sign = text.startsWith("-") || text.startsWith("+") ? text.slice(0, 1) : "";
  const digits = text.slice(sign.length);
  const inBase = Array.fromIterable(digits).every((digit) => Number.parseInt(digit, 36) < base);
  const magnitude = digits !== "" && inBase ? Number.parseInt(digits, base) : Number.NaN;
  const number = sign === "-" ? -magnitude : magnitude;

  return Number.isSafeInteger(number) ? Option.some(number) : Option.none();
};

/**
 * Read one posted string as a value of a base type.
 *
 * Empty text is no value. A number is trimmed first, so blank text is no value too.
 *
 * @param baseType The binding's base type.
 * @param text The posted string.
 * @param base The number base of an integer.
 * @returns The value, none for empty text, or the reason the text is not a value.
 */
const readPosted = (
  baseType: PostedBaseType,
  text: string,
  base: number,
): Effect.Effect<Option.Option<Single>, MalformedReason> => {
  const lexical = baseType === "integer" || baseType === "float" ? text.trim() : text;
  if (lexical === "") {
    return Effect.succeedNone;
  }

  if (baseType === "string") {
    return Effect.succeedSome({ baseType, value: lexical.replaceAll(/\r\n?/gu, "\n") });
  }

  if (baseType === "identifier") {
    return parseLexical(baseType, lexical).pipe(
      Effect.mapError((): MalformedReason => "identifier"),
      Effect.map(Option.some),
    );
  }

  const decimal =
    baseType === "integer" ? Option.map(readInteger(lexical, base), String) : Option.some(lexical);

  return Effect.fromOption(decimal).pipe(
    Effect.flatMap((number) => parseLexical(baseType, number)),
    Effect.filterOrFail((single) => single.baseType !== "float" || Number.isFinite(single.value)),
    Effect.mapError((): MalformedReason => "number"),
    Effect.map(Option.some),
  );
};

/**
 * Decode the entries a form posted as a value of one binding.
 *
 * Only the entries named for the binding are read. No entry, or one empty entry, is NULL. A
 * number is trimmed, then read as an integer in `base` or as a finite decimal with an optional
 * exponent; `INF` and `NaN` are refused. An identifier must be an NCName. A string has CRLF and
 * a lone CR turned into LF, as a textarea's value has, so a value holds LF line breaks only.
 *
 * @param entries The posted entries.
 * @param binding The response's binding.
 * @param options The number base of an integer.
 * @returns The value, or {@link Malformed}: `file` for a file, `single-many` for two entries of a
 *   `single`, and `number` or `identifier` for text outside the base type's lexical space.
 */
export const decode = (
  entries: readonly Entry[],
  binding: Binding,
  options: DecodeOptions = {},
): Effect.Effect<Value, Malformed> => {
  const posted = entries.filter(([name]) => name === binding.name).map(([, value]) => value);
  const texts = posted.filter((value): value is string => typeof value === "string");
  const malformed = (reason: MalformedReason) => new Malformed({ entry: binding.name, reason });

  if (texts.length < posted.length) {
    return Effect.fail(malformed("file"));
  }

  if (binding.cardinality === "single" && texts.length > 1) {
    return Effect.fail(malformed("single-many"));
  }

  return Effect.all(
    texts.map((text) => readPosted(binding.baseType, text, options.base ?? 10)),
  ).pipe(
    Effect.mapError(malformed),
    Effect.map((values) => ({
      baseType: binding.baseType,
      cardinality: binding.cardinality,
      values: Array.getSomes(values),
    })),
  );
};

/**
 * Posted entries split by owner.
 */
export interface Partition {
  /**
   * Entries named for this item instance.
   */
  readonly own: readonly Entry[];
  /**
   * Entries named for another item instance.
   */
  readonly foreign: readonly Entry[];
  /**
   * Every other entry: the host's own fields, which the core ignores.
   */
  readonly host: readonly Entry[];
}

/**
 * An entry name an item instance gives: a UUID, a dot, then the rest of the name.
 */
const instanceName =
  /^(?<key>[\dA-Fa-f]{8}-[\dA-Fa-f]{4}-[\dA-Fa-f]{4}-[\dA-Fa-f]{4}-[\dA-Fa-f]{12})\./u;

/**
 * Split posted entries into this instance's, other instances', and the host's.
 *
 * @param entries The posted entries, in order.
 * @param instance This item instance's key.
 * @returns The entries in posted order, by owner: a name `<uuid>.<anything>` is this instance's
 *   when the UUID is `instance` and a foreign instance's otherwise; every other name is a host
 *   field.
 */
export const partition = (entries: readonly Entry[], instance: string): Partition => {
  const owner = ([name]: Entry): keyof Partition => {
    const key = instanceName.exec(name)?.groups?.["key"];
    if (key === undefined) {
      return "host";
    }

    return key === instance ? "own" : "foreign";
  };

  return {
    foreign: entries.filter((entry) => owner(entry) === "foreign"),
    host: entries.filter((entry) => owner(entry) === "host"),
    own: entries.filter((entry) => owner(entry) === "own"),
  };
};

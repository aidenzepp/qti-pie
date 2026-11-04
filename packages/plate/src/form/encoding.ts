/**
 * The one mapping between QTI values and form entries: the name each response posts under, the
 * entries a value encodes to, the value posted entries decode to, and which posted entries belong
 * to this item instance.
 *
 * Entries carry QTI's lexical forms, so a value's form is {@link format}'s and its reading is
 * {@link parseLexical}'s, with the allowances a posted form needs: a number is trimmed, and a
 * string's line breaks are a textarea's.
 */
import { Array, Data, Option, Result } from "effect";
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
   * The number base an integer is written in, Text Entry's `base`, an integer from 2 to 36; 10
   * when absent. In any other base no text is an integer.
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
export class Malformed extends Data.TaggedError("Malformed")<{
  readonly entry: string;
  readonly reason: MalformedReason;
}> {
  /**
   * The entry name and what to post instead, in one line.
   */
  override get message(): string {
    return `The form entry ${JSON.stringify(this.entry)} ${remedies[this.reason]}.`;
  }
}

/**
 * The requirements an instance token meets, in the order {@link checkInstance} checks them.
 *
 * - `non-empty`: it holds at least one character.
 * - `characters`: every character is an ASCII letter, a digit, `_`, `.`, `:` or `-`, which an `id`,
 *   an IDREFS list and a form entry name all take, and none of which is whitespace.
 * - `id-boundary`: it does not end in `-` and holds no `--`. The renderer's ids are
 *   `<instance>-<segment>-…` (`scopedId`) and an authored id is `<instance>--<id>` (`authoredId`),
 *   so a token that broke this would let one instance's part id equal another's authored id: `ab-`
 *   with `status` and `ab` with an authored `status` both give `ab--status`.
 */
export const instanceRequirements = ["non-empty", "characters", "id-boundary"] as const;

/**
 * A requirement an instance token meets: one of {@link instanceRequirements}.
 */
export type InstanceRequirement = (typeof instanceRequirements)[number];

/**
 * The characters an instance token is made of: ASCII letters, digits, `_`, `.`, `:` and `-`.
 */
const tokenCharacters = /^[\w.:-]*$/u;

/**
 * Whether a token meets each requirement, one check per requirement.
 */
const meets: Readonly<Record<InstanceRequirement, (token: string) => boolean>> = {
  characters: (token) => tokenCharacters.test(token),
  "id-boundary": (token) => !token.endsWith("-") && !token.includes("--"),
  "non-empty": (token) => token !== "",
};

/**
 * Check an instance token: an opaque token, unique per page, that scopes an item instance's ids
 * and entry names.
 *
 * A lowercase UUID passes, as do React's `useId()` forms `_r_1_` (React 19.2 and later) and `:r1:`
 * (React 18 and 19.0); React 19.1's `«r1»` does not, so its caller passes a token of their own.
 *
 * @example
 *   checkInstance("_r_1_"); // Option.none()
 *   checkInstance("ab-"); // Option.some("id-boundary")
 *
 * @param token The token an author passes as the instance.
 * @returns The first of {@link instanceRequirements} the token breaks, or none when it meets them
 *   all.
 */
export const checkInstance = (token: string): Option.Option<InstanceRequirement> =>
  Array.findFirst(instanceRequirements, (requirement) => !meets[requirement](token));

/**
 * Name the form entry a response posts under in one item instance.
 *
 * The OD-2 placeholder: changing the wire name is this one edit.
 *
 * @param instance The item instance token, one {@link checkInstance} passes, such as a lowercase
 *   UUID.
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
 * The prefix `BigInt` takes to read a magnitude in each base it reads.
 */
const bigIntPrefixes: ReadonlyMap<number, string> = new Map([
  [2, "0b"],
  [8, "0o"],
  [10, ""],
  [16, "0x"],
]);

/**
 * The most digits {@link readByHalves} folds as a float: 36^10 − 1 is below 2^53, so the fold is
 * exact in every base up to 36.
 */
const leafLength = 10;

/**
 * Read the magnitude of digits in a base `BigInt` does not read, by halves: the high half times
 * the base to the length of the low half, plus the low half.
 *
 * The time is subquadratic in the number of digits, because each level of halving does a few
 * multiplications of its own size, and the powers of the base it needs are computed once. A
 * per-digit `total * base + digit` loop over bigints is quadratic: it took 433 ms on 100,000 base-7
 * digits.
 *
 * @param digits The value of each digit, most significant first, each below `base`.
 * @param base The number base, from 2 to 36.
 * @returns The magnitude the digits name.
 */
const readByHalves = (digits: readonly number[], base: number): bigint => {
  const radix = BigInt(base);
  const powers = new Map<number, bigint>();
  const power = (exponent: number): bigint => {
    const known = powers.get(exponent) ?? radix ** BigInt(exponent);
    powers.set(exponent, known);

    return known;
  };

  const read = (start: number, end: number): bigint => {
    if (end - start <= leafLength) {
      let total = 0;
      for (const digit of digits.slice(start, end)) {
        total = total * base + digit;
      }

      return BigInt(total);
    }

    const middle = start + Math.ceil((end - start) / 2);

    return read(start, middle) * power(end - middle) + read(middle, end);
  };

  return read(0, digits.length);
};

/**
 * Read a posted integer in a base, exactly and at any size: an optional sign, then one or more
 * ASCII digits below the base, where `a` to `z` in either case are the digits from 10.
 *
 * Bases 2, 8, 10 and 16 are read by `BigInt`, and every other base by {@link readByHalves}.
 * `BigInt` reads only digits this check has admitted, so it never throws.
 *
 * @param text The trimmed text.
 * @param base The number base.
 * @returns The integer, or none when the base is not an integer from 2 to 36, there are no digits,
 *   or a digit is outside the base.
 */
const readInteger = (text: string, base: number): Option.Option<bigint> => {
  const sign = text.startsWith("-") || text.startsWith("+") ? text.slice(0, 1) : "";
  const digits = text.slice(sign.length);
  const values = Array.fromIterable(digits).map((digit) => Number.parseInt(digit, 36));
  const inBase = values.every((value) => value < base);
  if (!Number.isInteger(base) || base < 2 || base > 36 || digits === "" || !inBase) {
    return Option.none();
  }

  const prefix = bigIntPrefixes.get(base);
  const magnitude = prefix === undefined ? readByHalves(values, base) : BigInt(prefix + digits);

  return Option.some(sign === "-" ? -magnitude : magnitude);
};

/**
 * The reason a posted number is refused, whichever step refuses it.
 *
 * @returns `number`.
 */
const notANumber = (): MalformedReason => "number";

/**
 * Read one posted string as a value of a base type.
 *
 * Empty text is no value. A number is trimmed first, so blank text is no value too. An integer is
 * read exactly in `base`, then its decimal digits take the value model's one path, so a posted
 * integer is the value the same digits are in content. A float is the value model's reading of the
 * text; it is non-finite only for `INF`, `-INF` and `NaN`, which a posted form refuses.
 *
 * @param baseType The binding's base type.
 * @param text The posted string.
 * @param base The number base of an integer, from 2 to 36.
 * @returns The value, none for empty text, or the reason the text is not a value.
 */
const readPosted = (
  baseType: PostedBaseType,
  text: string,
  base: number,
): Result.Result<Option.Option<Single>, MalformedReason> => {
  const lexical = baseType === "integer" || baseType === "float" ? text.trim() : text;
  if (lexical === "") {
    return Result.succeedNone;
  }

  if (baseType === "string") {
    return Result.succeedSome({ baseType, value: lexical.replaceAll(/\r\n?/gu, "\n") });
  }

  if (baseType === "identifier") {
    return parseLexical(baseType, lexical).pipe(
      Result.mapError((): MalformedReason => "identifier"),
      Result.map(Option.some),
    );
  }

  const decimal =
    baseType === "integer" ? Option.map(readInteger(lexical, base), String) : Option.some(lexical);

  return Result.fromOption(decimal, notANumber).pipe(
    Result.flatMap((number) => Result.mapError(parseLexical(baseType, number), notANumber)),
    Result.filterOrFail(
      (single) => single.baseType !== "float" || Number.isFinite(single.value),
      notANumber,
    ),
    Result.map(Option.some),
  );
};

/**
 * Decode the entries a form posted as a value of one binding.
 *
 * Only the entries named for the binding are read. No entry, or one empty entry, is NULL. A number
 * is trimmed, then read as an integer in `base` or as a decimal with an optional exponent. A posted
 * integer is exact at any size, in every base from 2 to 36, and in a base other than 2, 8, 10 or 16
 * it is read in time subquadratic in its digits. A posted float follows the value model's lexical
 * rules, as content does, so a decimal beyond the largest double reads as the largest finite double
 * of its sign; only `INF`, `-INF` and `NaN`, which the value model reads as non-finite, are
 * refused. An identifier must be an NCName. A string has CRLF and a lone CR turned into LF, as a
 * textarea's value has, so a value holds LF line breaks only.
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
): Result.Result<Value, Malformed> => {
  const posted = entries.filter(([name]) => name === binding.name).map(([, value]) => value);
  const texts = posted.filter((value): value is string => typeof value === "string");
  const malformed = (reason: MalformedReason) => new Malformed({ entry: binding.name, reason });

  if (texts.length < posted.length) {
    return Result.fail(malformed("file"));
  }

  if (binding.cardinality === "single" && texts.length > 1) {
    return Result.fail(malformed("single-many"));
  }

  return Result.all(
    texts.map((text) => readPosted(binding.baseType, text, options.base ?? 10)),
  ).pipe(
    Result.mapError(malformed),
    Result.map((values) => ({
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
 * An entry name another item instance gives when its token is the UUID `render` draws: a UUID, a
 * dot, then the rest of the name.
 */
const drawnInstanceName =
  /^[\dA-Fa-f]{8}-[\dA-Fa-f]{4}-[\dA-Fa-f]{4}-[\dA-Fa-f]{4}-[\dA-Fa-f]{12}\./u;

/**
 * Split posted entries into this instance's, other instances', and the host's.
 *
 * Only a drawn token has a shape, so a UUID is the one other instance this can recognise; another
 * instance with a token of its own posts what reads as host fields here.
 *
 * @param entries The posted entries, in order.
 * @param instance This item instance's token, any that {@link checkInstance} passes.
 * @returns The entries in posted order, by owner: a name beginning `<instance>.` is this
 *   instance's; else a name `<uuid>.<anything>` is a foreign instance's; every other name is a
 *   host field.
 */
export const partition = (entries: readonly Entry[], instance: string): Partition => {
  const prefix = `${instance}.`;
  const owner = ([name]: Entry): keyof Partition => {
    if (name.startsWith(prefix)) {
      return "own";
    }

    return drawnInstanceName.test(name) ? "foreign" : "host";
  };

  return {
    foreign: entries.filter((entry) => owner(entry) === "foreign"),
    host: entries.filter((entry) => owner(entry) === "host"),
    own: entries.filter((entry) => owner(entry) === "own"),
  };
};

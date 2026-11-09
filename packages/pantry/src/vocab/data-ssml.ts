/**
 * Read a `data-ssml` value into the rows the database judges it by (spec reading 177, over R7-a):
 * the members of one JSON object, in the order written, each an object of string properties, each
 * property's name and decoded value in the order written. The database holds those rows to
 * Data-SSML 1.0's JSON Schema (`#pantry/qti/data-ssml.ts`, law "Data SSML"): which members and
 * properties it lists, the enumerated and the normalized values, and the required properties.
 * This module judges none of that. It reads the JSON, which grizzle cannot state as a pattern (one
 * pattern for the language needs about 4,400 positions where grizzle admits 4,096,
 * `docs/grizzle-findings.md`), and a value that is not one JSON object of objects of strings has
 * no rows, so the database refuses its attribute under "Data SSML", which requires every closed
 * `data-ssml` to have them.
 *
 * The value is read as written, as RFC 8259 reads it, one grammar for the text. A name written
 * twice in one object is kept twice (RFC 8259 §4: names "SHOULD be unique"), each value its own
 * row, which `JSON.parse` cannot do, since it keeps the last. {@link dataSsmlMembers} is the
 * schema's table, which the database installs as closed relations. The module is pure.
 *
 * @see {@link https://www.imsglobal.org/spec/qti/v3p0/datassml/ | IMS Data-SSML 1.0, 3.4 JSON Schema}
 */
import { Option } from "effect";

/**
 * One property of a `data-ssml` member as written: its name and its value, each decoded.
 */
export interface SsmlPropertyText {
  readonly name: string;
  readonly value: string;
}

/**
 * One member of a `data-ssml` object as written: its decoded name and its properties, in order.
 */
export interface SsmlMemberText {
  readonly name: string;
  readonly properties: readonly SsmlPropertyText[];
}

/**
 * What a property's string may be: any string, an enumerated value, or a normalized string, whose
 * decoded value holds no tab, line feed or carriage return.
 */
export type Domain =
  | { readonly kind: "enumeration"; readonly values: readonly string[] }
  | { readonly kind: "normalized" }
  | { readonly kind: "string" };

/**
 * One property of a member: its name, its domain and whether the schema requires it.
 */
export interface Property {
  readonly domain: Domain;
  readonly name: string;
  readonly required: boolean;
}

/**
 * The members of a `data-ssml` object and the properties each admits, from the schema (§3.4,
 * "NORMATIVE"): `break` (`strength`, `time`), `phoneme` (`ph`, required, `alphabet`, `type`),
 * `prosody` (`rate`), `say-as` (`interpret-as`, required) and `sub` (`alias`, required). `time` and
 * `rate` are normalized strings in the schema's OAS3 form (Appendix C, and the information model's
 * `RateUnion`), over the prose's percentage.
 */
export const dataSsmlMembers: ReadonlyMap<string, readonly Property[]> = new Map([
  [
    "break",
    [
      {
        domain: {
          kind: "enumeration",
          values: ["none", "x-weak", "weak", "medium", "strong", "x-strong"],
        },
        name: "strength",
        required: false,
      },
      { domain: { kind: "normalized" }, name: "time", required: false },
    ],
  ],
  [
    "phoneme",
    [
      { domain: { kind: "string" }, name: "ph", required: true },
      {
        domain: { kind: "enumeration", values: ["ipa", "x-sampa"] },
        name: "alphabet",
        required: false,
      },
      {
        domain: { kind: "enumeration", values: ["default", "ruby"] },
        name: "type",
        required: false,
      },
    ],
  ],
  ["prosody", [{ domain: { kind: "normalized" }, name: "rate", required: false }]],
  [
    "say-as",
    [
      {
        domain: {
          kind: "enumeration",
          values: ["date", "time", "telephone", "characters", "cardinal", "ordinal"],
        },
        name: "interpret-as",
        required: true,
      },
    ],
  ],
  ["sub", [{ domain: { kind: "string" }, name: "alias", required: true }]],
]);

/**
 * The escapes JSON writes with a single letter (RFC 8259 §7), by that letter.
 */
const letterEscapes: ReadonlyMap<string, string> = new Map([
  ['"', '"'],
  ["\\", "\\"],
  ["/", "/"],
  ["b", "\b"],
  ["f", "\f"],
  ["n", "\n"],
  ["r", "\r"],
  ["t", "\t"],
]);

/**
 * A step of the reader: the value read and the offset just after it, or none where the text breaks
 * RFC 8259's grammar or the shape a `data-ssml` value has.
 */
type Step<T> = Option.Option<{ readonly next: number; readonly value: T }>;

/**
 * Return the offset of the first character at or after `at` that is not JSON whitespace.
 */
const skipSpace = (text: string, at: number): number => {
  let next = at;
  while (text[next] === " " || text[next] === "\t" || text[next] === "\n" || text[next] === "\r") {
    next += 1;
  }

  return next;
};

/**
 * Read the JSON string whose opening quote is at `start`, decoding its escapes into the string it
 * denotes: a `\u` escape is one UTF-16 code unit, so a lone surrogate or a NUL is held as such.
 */
const readString = (text: string, start: number): Step<string> => {
  const pieces: string[] = [];
  let at = start + 1;
  let from = at;
  while (at < text.length) {
    const unit = text.codePointAt(at) ?? 0;
    if (unit === 0x22) {
      pieces.push(text.slice(from, at));

      return Option.some({ next: at + 1, value: pieces.join("") });
    }

    if (unit < 0x20) {
      return Option.none();
    }

    if (unit === 0x5c) {
      pieces.push(text.slice(from, at));

      const letter = text[at + 1] ?? "";
      const simple = letterEscapes.get(letter);
      const hex = text.slice(at + 2, at + 6);
      if (simple !== undefined) {
        pieces.push(simple);
        at += 2;
      } else if (letter === "u" && /^[0-9A-Fa-f]{4}$/u.test(hex)) {
        pieces.push(String.fromCodePoint(Number.parseInt(hex, 16)));
        at += 6;
      } else {
        return Option.none();
      }

      from = at;
    } else {
      at += 1;
    }
  }

  return Option.none();
};

/**
 * Read one JSON object whose `{` is at `open`, each pair's name decoded and its value read by
 * `value` from the offset just after the colon and its whitespace.
 *
 * @param text - The whole value.
 * @param open - The offset of the object's `{`.
 * @param value - The reader of one pair's value, none where the value is not of its shape.
 * @returns The pairs in the order written, and the offset after the `}`; none where the text is no
 *   such object.
 */
const readObject = <T>(
  text: string,
  open: number,
  value: (at: number) => Step<T>,
): Step<readonly { readonly name: string; readonly value: T }[]> => {
  const pairs: { readonly name: string; readonly value: T }[] = [];
  let at = skipSpace(text, open + 1);
  if (text[at] === "}") {
    return Option.some({ next: at + 1, value: pairs });
  }

  for (;;) {
    if (text[at] !== '"') {
      return Option.none();
    }

    const name = readString(text, at);
    if (Option.isNone(name)) {
      return Option.none();
    }

    const colon = skipSpace(text, name.value.next);
    if (text[colon] !== ":") {
      return Option.none();
    }

    const read = value(skipSpace(text, colon + 1));
    if (Option.isNone(read)) {
      return Option.none();
    }

    pairs.push({ name: name.value.value, value: read.value.value });

    const separator = skipSpace(text, read.value.next);
    if (text[separator] === "}") {
      return Option.some({ next: separator + 1, value: pairs });
    }

    if (text[separator] !== ",") {
      return Option.none();
    }

    at = skipSpace(text, separator + 1);
  }
};

/**
 * Read a JSON string at `at`.
 */
const stringAt =
  (text: string) =>
  (at: number): Step<string> =>
    text[at] === '"' ? readString(text, at) : Option.none();

/**
 * Read a JSON object at `at` whose every value is a string.
 */
const propertiesAt =
  (text: string) =>
  (at: number): Step<readonly { readonly name: string; readonly value: string }[]> =>
    text[at] === "{" ? readObject(text, at, stringAt(text)) : Option.none();

/**
 * Read a `data-ssml` value as written into its members and their properties.
 *
 * @param text - The attribute's lexical form.
 * @returns The members in the order written, each with its properties in order; none where the
 *   text is not one JSON object whose every value is an object of strings, with nothing but
 *   whitespace around it.
 */
export const dataSsmlOf = (text: string): Option.Option<readonly SsmlMemberText[]> => {
  const open = skipSpace(text, 0);
  if (text[open] !== "{") {
    return Option.none();
  }

  return readObject(text, open, propertiesAt(text)).pipe(
    Option.filter(({ next }) => skipSpace(text, next) === text.length),
    Option.map(({ value }) => value.map(({ name, value: properties }) => ({ name, properties }))),
  );
};

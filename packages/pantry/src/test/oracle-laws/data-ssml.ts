/**
 * The law oracle's own reader of a `data-ssml` value, written from Data-SSML 1.0's JSON Schema
 * (section 3.4.5, Definitions, and Appendix C1.1) as spec reading R7-a states it, and not from the
 * importer's reader (`src/vocab/data-ssml.ts`) or the database's law over its rows (spec reading
 * 177), so that the two judges of the value are independent: a defect in one gives a verdict the
 * other does not repeat.
 *
 * The technique differs on purpose. The text is tokenized whole under RFC 8259's grammar, the
 * tokens are read into lists of `[name, value]` pairs that keep every duplicate (`JSON.parse` keeps
 * only the last), and the schema's tables, written below as data, judge the decoded names and
 * values. A name written twice is admitted and each of its values judged (RFC 8259 section 4:
 * names "SHOULD be unique").
 *
 * The module imports only `effect`.
 *
 * @see {@link https://www.imsglobal.org/sites/default/files/spec/qti/v3/data-ssml_infobind/imsqtiv3p0_datassml_v1p0_InfoBind.html#JSOND | IMS Data-SSML 1.0, 3.4 Description of the JSON Schema}
 */
import { Option } from "effect";

/**
 * What a property's string may be, in the schema's own terms.
 */
type Allowed =
  /**
   * Any string (`"type": "string"`).
   */
  | { readonly kind: "any" }
  /**
   * One of the schema's `enum` values.
   */
  | { readonly kind: "enum"; readonly values: readonly string[] }
  /**
   * A model primitive NormalizedString (Appendix C): the decoded value holds no tab, line feed or
   * carriage return.
   */
  | { readonly kind: "normalized" };

/**
 * One root property's object: the properties it may hold and the ones it must.
 */
interface Definition {
  readonly properties: ReadonlyMap<string, Allowed>;
  readonly required: readonly string[];
}

const anyString: Allowed = { kind: "any" };

const normalizedString: Allowed = { kind: "normalized" };

const enumeration = (...values: readonly string[]): Allowed => ({ kind: "enum", values });

/**
 * The schema's definitions of the root's five properties.
 *
 * - `BreakDType`, section 3.4.5.1: `strength` (`StrengthEnum`) and `time` (NormalizedString).
 * - `PhonemeDType`, 3.4.5.3: `ph` required, `alphabet` and `type` enumerated.
 * - `ProsodyDType`, 3.4.5.4: `rate`, whose OAS3 form is `anyOf` its enumeration and any string, so
 *   any NormalizedString (Appendix C).
 * - `SayAsDType`, 3.4.5.5: `interpret-as`, required and enumerated.
 * - `SubDType`, 3.4.5.6: `alias`, required.
 *
 * `DataSSMLDType`, 3.4.5.2, is the root: these five, none required, and `additionalProperties`
 * false at every level.
 */
const members: ReadonlyMap<string, Definition> = new Map([
  [
    "break",
    {
      properties: new Map([
        ["strength", enumeration("medium", "none", "strong", "weak", "x-strong", "x-weak")],
        ["time", normalizedString],
      ]),
      required: [],
    },
  ],
  [
    "phoneme",
    {
      properties: new Map([
        ["alphabet", enumeration("ipa", "x-sampa")],
        ["ph", anyString],
        ["type", enumeration("default", "ruby")],
      ]),
      required: ["ph"],
    },
  ],
  [
    "prosody",
    {
      properties: new Map([["rate", normalizedString]]),
      required: [],
    },
  ],
  [
    "say-as",
    {
      properties: new Map([
        [
          "interpret-as",
          enumeration("cardinal", "characters", "date", "ordinal", "telephone", "time"),
        ],
      ]),
      required: ["interpret-as"],
    },
  ],
  [
    "sub",
    {
      properties: new Map([["alias", anyString]]),
      required: ["alias"],
    },
  ],
]);

/**
 * One lexical token of a JSON text (RFC 8259 section 2).
 */
type Token =
  | { readonly kind: "punctuation"; readonly mark: Mark }
  | { readonly kind: "scalar" }
  | { readonly kind: "string"; readonly text: string };

/**
 * A parsed value, reduced to what the schema distinguishes.
 */
type Value =
  | { readonly kind: "object"; readonly pairs: readonly Pair[] }
  | { readonly kind: "other" }
  | { readonly kind: "string"; readonly text: string };

/**
 * A member of an object as written, a repeated name kept.
 */
type Pair = readonly [name: string, value: Value];

const whitespace = new Set([" ", "\t", "\n", "\r"]);

const escapes: ReadonlyMap<string, string> = new Map([
  ['"', '"'],
  ["\\", "\\"],
  ["/", "/"],
  ["b", "\b"],
  ["f", "\f"],
  ["n", "\n"],
  ["r", "\r"],
  ["t", "\t"],
]);

type Mark = "," | ":" | "[" | "]" | "{" | "}";

const marks: ReadonlySet<string> = new Set<Mark>([",", ":", "[", "]", "{", "}"]);

const isMark = (unit: string): unit is Mark => marks.has(unit);

/**
 * RFC 8259 section 6's number: `-? (0 | [1-9][0-9]*) (. [0-9]+)? ([eE] [+-]? [0-9]+)?`.
 */
const numberAt = /-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/uy;

const literalAt = /true|false|null/uy;

const hexAt = /[0-9A-Fa-f]{4}/uy;

/**
 * Read the string whose opening quote sits at `from`.
 *
 * @returns The decoded text and the index past the closing quote, or `undefined` when the string
 *   is not one (an unescaped control character, an unknown escape, a bad `\u`, no closing quote).
 */
const stringAt = (
  text: string,
  from: number,
): { readonly end: number; readonly text: string } | undefined => {
  const units: string[] = [];
  let at = from + 1;
  while (at < text.length) {
    const unit = text.charAt(at);
    if (unit === '"') {
      return { end: at + 1, text: units.join("") };
    }

    if ((unit.codePointAt(0) ?? 0) < 0x20) {
      return undefined;
    }

    if (unit !== "\\") {
      units.push(unit);
      at += 1;
      continue;
    }

    const escape = text.charAt(at + 1);
    const plain = escapes.get(escape);
    if (plain !== undefined) {
      units.push(plain);
      at += 2;
      continue;
    }

    if (escape !== "u") {
      return undefined;
    }

    hexAt.lastIndex = at + 2;
    const digits = hexAt.exec(text);
    if (digits === null) {
      return undefined;
    }

    // A `\u` escape is one UTF-16 code unit, so an escaped surrogate pair joins into one
    // character when the units are joined.
    units.push(String.fromCodePoint(Number.parseInt(digits[0], 16)));
    at += 6;
  }

  return undefined;
};

/**
 * Split a whole text into tokens, or `undefined` when some part of it is no token.
 */
const tokenize = (text: string): readonly Token[] | undefined => {
  const tokens: Token[] = [];
  let at = 0;
  while (at < text.length) {
    const unit = text.charAt(at);
    if (whitespace.has(unit)) {
      at += 1;
    } else if (isMark(unit)) {
      tokens.push({ kind: "punctuation", mark: unit });
      at += 1;
    } else if (unit === '"') {
      const read = stringAt(text, at);
      if (read === undefined) {
        return undefined;
      }

      tokens.push({ kind: "string", text: read.text });
      at = read.end;
    } else {
      numberAt.lastIndex = at;
      literalAt.lastIndex = at;
      const scalar = numberAt.exec(text) ?? literalAt.exec(text);
      if (scalar === null) {
        return undefined;
      }

      tokens.push({ kind: "scalar" });
      at += scalar[0].length;
    }
  }

  return tokens;
};

/**
 * What the reader expects of the next token.
 */
type Want = "colon" | "end" | "follow" | "name" | "nameOrClose" | "value" | "valueOrClose";

/**
 * An array or object still open.
 */
interface Open {
  readonly array: boolean;
  name: string;
  readonly pairs: Pair[];
}

/**
 * The reader's place in the grammar: what is open, what comes next, and the finished value.
 */
interface Reading {
  readonly stack: Open[];
  result: Value | undefined;
  want: Want;
}

/**
 * Hand a finished value to what encloses it, or make it the result.
 */
const finish = (reading: Reading, value: Value): void => {
  const top = reading.stack.at(-1);
  if (top === undefined) {
    reading.result = value;
    reading.want = "end";

    return;
  }

  if (!top.array) {
    top.pairs.push([top.name, value]);
  }

  reading.want = "follow";
};

/**
 * Close the innermost container and finish it as a value.
 */
const close = (reading: Reading, top: Open): void => {
  reading.stack.pop();
  finish(reading, top.array ? { kind: "other" } : { kind: "object", pairs: top.pairs });
};

/**
 * Read a token where a value, or an array's closing bracket, may stand.
 */
const readValue = (reading: Reading, token: Token): boolean => {
  const mark = token.kind === "punctuation" ? token.mark : undefined;
  if (token.kind === "string") {
    finish(reading, { kind: "string", text: token.text });
  } else if (token.kind === "scalar") {
    finish(reading, { kind: "other" });
  } else if (mark === "{") {
    reading.stack.push({ array: false, name: "", pairs: [] });
    reading.want = "nameOrClose";
  } else if (mark === "[") {
    reading.stack.push({ array: true, name: "", pairs: [] });
    reading.want = "valueOrClose";
  } else if (mark === "]" && reading.want === "valueOrClose") {
    const top = reading.stack.at(-1);
    if (top === undefined) {
      return false;
    }

    close(reading, top);
  } else {
    return false;
  }

  return true;
};

/**
 * Read a token where an object's name, or its closing brace, may stand.
 */
const readName = (reading: Reading, token: Token): boolean => {
  const top = reading.stack.at(-1);
  if (top === undefined) {
    return false;
  }

  if (token.kind === "string") {
    top.name = token.text;
    reading.want = "colon";

    return true;
  }

  if (reading.want === "nameOrClose" && token.kind === "punctuation" && token.mark === "}") {
    close(reading, top);

    return true;
  }

  return false;
};

/**
 * Read a token after a value inside a container: a comma, or the container's closing mark.
 */
const readFollow = (reading: Reading, token: Token): boolean => {
  const top = reading.stack.at(-1);
  if (top === undefined || token.kind !== "punctuation") {
    return false;
  }

  if (token.mark === ",") {
    reading.want = top.array ? "value" : "name";

    return true;
  }

  if (token.mark === (top.array ? "]" : "}")) {
    close(reading, top);

    return true;
  }

  return false;
};

/**
 * Read one token, `false` when the grammar does not admit it here.
 */
const read = (reading: Reading, token: Token): boolean => {
  if (reading.want === "colon") {
    reading.want = "value";

    return token.kind === "punctuation" && token.mark === ":";
  }

  if (reading.want === "value" || reading.want === "valueOrClose") {
    return readValue(reading, token);
  }

  if (reading.want === "name" || reading.want === "nameOrClose") {
    return readName(reading, token);
  }

  return reading.want === "follow" && readFollow(reading, token);
};

/**
 * Read tokens into one value under RFC 8259's grammar (section 2: one value, nothing after it).
 * Containers open on an explicit stack, so the nesting depth is bounded by memory and not by the
 * call stack.
 */
const valueOf = (tokens: readonly Token[]): Value | undefined => {
  const reading: Reading = { result: undefined, stack: [], want: "value" };
  for (const token of tokens) {
    if (!read(reading, token)) {
      return undefined;
    }
  }

  return reading.want === "end" ? reading.result : undefined;
};

/**
 * Whether a decoded string is admitted by what the schema allows of the property.
 */
const admits = (allowed: Allowed, text: string): boolean => {
  if (allowed.kind === "enum") {
    return allowed.values.includes(text);
  }

  return allowed.kind === "any" || !/[\t\n\r]/u.test(text);
};

/**
 * The path of the first breach in one root property's value, in the order the text writes it.
 */
const breachInMember = (name: string, definition: Definition, value: Value): string | undefined => {
  const at = `$.${name}`;
  if (value.kind !== "object") {
    return at;
  }

  for (const [property, written] of value.pairs) {
    const allowed = definition.properties.get(property);
    if (allowed === undefined || written.kind !== "string" || !admits(allowed, written.text)) {
      return `${at}.${property}`;
    }
  }

  const present = new Set(value.pairs.map(([property]) => property));
  const absent = definition.required.find((property) => !present.has(property));

  return absent === undefined ? undefined : `${at}.${absent}`;
};

/**
 * Judge a `data-ssml` value as written.
 *
 * @param text - The attribute's lexical form.
 * @returns The JSON path of what Data-SSML 1.0 does not admit (`$` for the root and for text that
 *   is not one JSON object), or none when it admits the value.
 */
export const dataSsmlBreachOf = (text: string): Option.Option<string> => {
  const tokens = tokenize(text);
  const root = tokens === undefined ? undefined : valueOf(tokens);
  if (root === undefined || root.kind !== "object") {
    return Option.some("$");
  }

  for (const [name, value] of root.pairs) {
    const definition = members.get(name);
    const breach = definition === undefined ? `$.${name}` : breachInMember(name, definition, value);
    if (breach !== undefined) {
      return Option.some(breach);
    }
  }

  return Option.none();
};

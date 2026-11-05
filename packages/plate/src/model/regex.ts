/**
 * The XSD-regex translator: an XML Schema 1.0 regular expression, the language of `pattern-mask`,
 * read by Appendix F's grammar and written as a JavaScript expression with the `v` flag.
 *
 * XML Schema anchors every expression at both ends and treats `^` and `$` as ordinary characters,
 * so the translation is `^(?:…)$` with any `^` or `$` of the pattern escaped. Its escapes keep
 * XML Schema's meanings, which JavaScript's differ from: `\s` is the four XML whitespace
 * characters (JavaScript's `\s` also takes U+00A0, U+FEFF and the `Zs` spaces), `\d` is every
 * decimal digit (`\p{Nd}`), and `\w` is everything but punctuation, separators and others. The `v`
 * flag gives class subtraction (`[a-z-[aeiou]]` is `[[a-z]--[aeiou]]`) and matches by code point.
 * Every character the translation writes is a letter, a digit or a `\u{…}` escape, so no
 * character of the pattern is read by JavaScript's own syntax.
 *
 * Anything outside the grammar is refused with its position, never approximated: back-references,
 * lazy and possessive quantifiers, `(?…)` groups, unbalanced brackets and parentheses, and escapes
 * Appendix F does not define. A block escape (`\p{IsBasicLatin}`) is refused as an unknown block:
 * the translator knows no block names. `{` and `}` are metacharacters, as Appendix F's definition
 * of a metacharacter and XML Schema 1.1 say, though production [10] omits them, so an unescaped
 * `{` that opens no repetition count is refused.
 *
 * Two readings follow later standards than XML Schema 1.0 names (reading R-f, provisional): a
 * category escape takes the Unicode version the engine ships rather than Unicode 3.1, as Appendix F
 * encourages, and `\i` and `\c` take XML 1.0 (Fifth Edition)'s name characters, from
 * {@link nameStartClass} and {@link nameClass}, with the colon added.
 *
 * The module is pure and synchronous, a browser module.
 *
 * @module
 * @see https://www.w3.org/TR/2004/REC-xmlschema-2-20041028/#regexs
 * @see https://www.w3.org/TR/xmlschema11-2/#regexs
 */
import { Data, Result } from "effect";
import { nameClass, nameStartClass } from "#plate/model/values.ts";

/**
 * The failure of reading a pattern as an XML Schema regular expression: the pattern, the index of
 * the character the grammar refuses (in UTF-16 code units, so `pattern.slice(position)` starts at
 * it; the opening bracket or parenthesis for one never closed), and the reason, which names what to
 * change.
 */
export class RegexRefused extends Data.TaggedError("RegexRefused")<{
  readonly pattern: string;
  readonly position: number;
  readonly reason: string;
}> {
  /**
   * The pattern, the position and the reason, in one line.
   */
  override get message(): string {
    return `The pattern ${JSON.stringify(this.pattern)} is not an XML Schema regular expression at position ${this.position}: ${this.reason}.`;
  }
}

/**
 * A pattern being read: its characters, by code point, and the index of the next one.
 */
interface Reader {
  /**
   * The pattern's characters, one code point each.
   */
  readonly chars: readonly string[];
  /**
   * The UTF-16 index of each character, and the pattern's length after the last.
   */
  readonly offsets: readonly number[];
  readonly pattern: string;
  /**
   * The index, in {@link Reader.chars}, of the next character to read.
   */
  at: number;
}

/**
 * What an escape names: one character, which can end a range, or a class, which cannot.
 */
type Escape =
  | { readonly codePoint: number; readonly kind: "character" }
  | { readonly kind: "class"; readonly source: string };

/**
 * An inclusive range of code points.
 */
interface CodeRange {
  readonly first: number;
  readonly last: number;
}

/**
 * The characters the translation writes as themselves; every other character is a `\u{…}` escape.
 */
const plainCharacter = /^[0-9A-Za-z]$/u;

/**
 * Write one code point as the translation spells it, valid inside and outside a `v`-flag class.
 *
 * @param codePoint The code point.
 * @returns The character itself when it is an ASCII letter or digit, otherwise `\u{…}`.
 */
const literal = (codePoint: number): string => {
  const character = String.fromCodePoint(codePoint);

  return plainCharacter.test(character)
    ? character
    : `\\u{${codePoint.toString(16).toUpperCase()}}`;
};

/**
 * Write a range of code points as a member of a `v`-flag class.
 *
 * @param range The range.
 * @returns One character when the range holds one, otherwise `first-last`.
 */
const rangeSource = (range: CodeRange): string =>
  range.first === range.last
    ? literal(range.first)
    : `${literal(range.first)}-${literal(range.last)}`;

/**
 * One atom of a `u`-flag class body: a `\u{…}` escape or one character.
 */
const bodyAtom = /\\u\{(?<hex>[0-9A-Fa-f]+)\}|[\s\S]/gu;

/**
 * Read a `u`-flag class body into ranges of code points.
 *
 * {@link nameStartClass} and {@link nameClass} are written for a `u`-flag class, where a leading
 * `-` is a literal dash; a `v`-flag class refuses an unescaped `-`, so the body is read into
 * ranges and written again by {@link rangeSource}.
 *
 * @param body The class body: characters, `\u{…}` escapes and `a-b` ranges.
 * @returns Its ranges, in order.
 */
const rangesOf = (body: string): readonly CodeRange[] => {
  const atoms = Array.from(body.matchAll(bodyAtom), (match) => {
    const hex = match.groups?.["hex"];

    return {
      codePoint: hex === undefined ? (match[0].codePointAt(0) ?? 0) : Number.parseInt(hex, 16),
      text: match[0],
    };
  });
  const ranges: CodeRange[] = [];
  let next = 0;

  for (const [index, first] of atoms.entries()) {
    const last = atoms[index + 2];
    const range = index >= next && atoms[index + 1]?.text === "-" && last !== undefined;

    if (index >= next) {
      ranges.push({ first: first.codePoint, last: range ? last.codePoint : first.codePoint });
      next = index + (range ? 3 : 1);
    }
  }

  return ranges;
};

/**
 * Write a class body from ranges and the colon, which XML 1.0's name characters include and the
 * NCName classes leave out.
 *
 * @param body A `u`-flag class body from `#plate/model/values.ts`.
 * @returns The `v`-flag class body of its ranges and `:`.
 */
const nameBody = (body: string): string =>
  [...rangesOf(body), { first: 0x3a, last: 0x3a }].map(rangeSource).join("");

/**
 * The class body of XML Schema's `\i`: XML 1.0 (Fifth Edition)'s `NameStartChar`, colon included.
 */
const initialNameBody = nameBody(nameStartClass);

/**
 * The class body of XML Schema's `\c`: XML 1.0 (Fifth Edition)'s `NameChar`, colon included.
 */
const nameCharacterBody = nameBody(nameClass);

/**
 * The class body of XML Schema's `\s`: space, tab, line feed and carriage return, and no other.
 */
const spaceBody = [0x09, 0x0a, 0x0d, 0x20].map(literal).join("");

/**
 * The class of punctuation, separators and others, whose complement is XML Schema's `\w`.
 */
const nonWordBody = String.raw`\p{General_Category=P}\p{General_Category=Z}\p{General_Category=C}`;

/**
 * XML Schema's wildcard `.`: any character but a line feed or a carriage return.
 */
const wildcard = `[^${literal(0x0a)}${literal(0x0d)}]`;

/**
 * The single character escapes, by the character after the backslash, and the code point each
 * names: `\n`, `\r` and `\t`, and each metacharacter, `|`, `-` and `^` escaped as itself.
 */
const singleCharacterEscapes: ReadonlyMap<string, number> = new Map([
  ["n", 0x0a],
  ["r", 0x0d],
  ["t", 0x09],
  ...Array.from("\\|.?*+(){}-[]^", (character): [string, number] => [
    character,
    character.codePointAt(0) ?? 0,
  ]),
]);

/**
 * The multi-character escapes, by the letter after the backslash, and the translation of each.
 */
const multiCharacterEscapes: ReadonlyMap<string, string> = new Map([
  ["s", `[${spaceBody}]`],
  ["S", `[^${spaceBody}]`],
  ["i", `[${initialNameBody}]`],
  ["I", `[^${initialNameBody}]`],
  ["c", `[${nameCharacterBody}]`],
  ["C", `[^${nameCharacterBody}]`],
  ["d", String.raw`\p{General_Category=Nd}`],
  ["D", String.raw`\P{General_Category=Nd}`],
  ["w", `[^${nonWordBody}]`],
  ["W", `[${nonWordBody}]`],
]);

/**
 * The General_Category values a category escape names (Appendix F, productions [28] to [35]).
 * JavaScript's `General_Category` takes each of them as a value alias.
 */
const categories: ReadonlySet<string> = new Set([
  "L",
  "Lu",
  "Ll",
  "Lt",
  "Lm",
  "Lo",
  "M",
  "Mn",
  "Mc",
  "Me",
  "N",
  "Nd",
  "Nl",
  "No",
  "P",
  "Pc",
  "Pd",
  "Ps",
  "Pe",
  "Pi",
  "Pf",
  "Po",
  "Z",
  "Zs",
  "Zl",
  "Zp",
  "S",
  "Sm",
  "Sc",
  "Sk",
  "So",
  "C",
  "Cc",
  "Cf",
  "Co",
  "Cn",
]);

/**
 * A block escape's property: `Is` and a block name (Appendix F, production [36]).
 */
const blockProperty = /^Is[-0-9A-Za-z]+$/u;

/**
 * Refuse the pattern at a character.
 *
 * @param reader The pattern being read.
 * @param at The character's index in {@link Reader.chars}.
 * @param reason What is wrong there, and what to change.
 * @returns The refusal, with the character's UTF-16 index.
 */
const refuse = (reader: Reader, at: number, reason: string): Result.Result<never, RegexRefused> =>
  Result.fail(
    new RegexRefused({
      pattern: reader.pattern,
      position: reader.offsets[at] ?? reader.pattern.length,
      reason,
    }),
  );

/**
 * Read the run of decimal digits that starts at a character.
 *
 * @param reader The pattern being read.
 * @param from The index of the first character to read.
 * @returns The digits, empty when the character is not one.
 */
const digitsFrom = (reader: Reader, from: number): string => {
  let end = from;

  while (/^[0-9]$/u.test(reader.chars[end] ?? "")) {
    end += 1;
  }

  return reader.chars.slice(from, end).join("");
};

/**
 * Say why an escape is not one Appendix F defines, and what to write instead.
 *
 * @param letter The character after the backslash.
 * @returns The reason.
 */
const undefinedEscape = (letter: string): string => {
  if (/^[1-9]$/u.test(letter)) {
    return `\\${letter} is a back-reference, which XML Schema regular expressions do not have; write out the text it would repeat`;
  }

  if (letter === "k") {
    return String.raw`\k is a named back-reference, which XML Schema regular expressions do not have; write out the text it would repeat`;
  }

  return /^[0-9A-Za-z]$/u.test(letter)
    ? `\\${letter} is not an escape XML Schema defines; use \\n, \\r, \\t, \\s, \\S, \\i, \\I, \\c, \\C, \\d, \\D, \\w, \\W, \\p{…}, \\P{…}, or a backslash before one of . \\ ? * + { } ( ) [ ] | - ^`
    : `\\${letter} is not an escape XML Schema defines; write ${letter} without the backslash`;
};

/**
 * Read a category escape, `\p{…}` or `\P{…}`, whose backslash is the next character.
 *
 * @param reader The pattern being read.
 * @param negated Whether the escape is `\P`, the complement.
 * @returns The class the escape names, or the refusal of an unknown category or block.
 */
const categoryEscape = (reader: Reader, negated: boolean): Result.Result<Escape, RegexRefused> => {
  const start = reader.at;
  const letter = negated ? "P" : "p";

  if (reader.chars[start + 2] !== "{") {
    return refuse(
      reader,
      start,
      `\\${letter} takes a category in braces, such as \\${letter}{Lu}; write \\${letter}{…}`,
    );
  }

  const close = reader.chars.indexOf("}", start + 3);

  if (close === -1) {
    return refuse(reader, start, `\\${letter}{ is never closed; end the category with }`);
  }

  const property = reader.chars.slice(start + 3, close).join("");

  if (categories.has(property)) {
    reader.at = close + 1;

    return Result.succeed({
      kind: "class",
      source: `\\${letter}{General_Category=${property}}`,
    });
  }

  return refuse(
    reader,
    start,
    blockProperty.test(property)
      ? `${property} names a Unicode block, which this translator does not know; match its characters with a category escape or a character range`
      : `${JSON.stringify(property)} is not a category XML Schema names; use one of ${[...categories].join(", ")}`,
  );
};

/**
 * Read an escape whose backslash is the next character.
 *
 * @param reader The pattern being read.
 * @returns The character or class it names, or the refusal of an escape Appendix F does not define.
 */
const escape = (reader: Reader): Result.Result<Escape, RegexRefused> => {
  const start = reader.at;
  const letter = reader.chars[start + 1];

  if (letter === undefined) {
    return refuse(
      reader,
      start,
      String.raw`the pattern ends in a lone \; write \\ to match a backslash`,
    );
  }

  const codePoint = singleCharacterEscapes.get(letter);

  if (codePoint !== undefined) {
    reader.at = start + 2;

    return Result.succeed({ codePoint, kind: "character" });
  }

  const source = multiCharacterEscapes.get(letter);

  if (source !== undefined) {
    reader.at = start + 2;

    return Result.succeed({ kind: "class", source });
  }

  return letter === "p" || letter === "P"
    ? categoryEscape(reader, letter === "P")
    : refuse(reader, start, undefinedEscape(letter));
};

/**
 * Read one character or escape of a class: the start or end of a range, or a class escape.
 *
 * @param reader The pattern being read, at a character that is not `-`, `[` or `]`.
 * @returns What it names.
 */
const classCharacter = (reader: Reader): Result.Result<Escape, RegexRefused> => {
  const character = reader.chars[reader.at] ?? "";

  if (character === "\\") {
    return escape(reader);
  }

  reader.at += 1;

  return Result.succeed({ codePoint: character.codePointAt(0) ?? 0, kind: "character" });
};

/**
 * Read one member of a class: a character, a range `s-e`, or a class escape.
 *
 * @param reader The pattern being read, at a character that is not `-`, `[` or `]`.
 * @returns The member as a `v`-flag class member.
 */
const classMember = (reader: Reader): Result.Result<string, RegexRefused> =>
  Result.gen(function* readClassMember() {
    const start = reader.at;
    const first = yield* classCharacter(reader);

    if (first.kind === "class") {
      return first.source;
    }

    const dash = reader.at;
    const end = reader.chars[dash + 1];

    if (reader.chars[dash] !== "-" || end === undefined || end === "]" || end === "[") {
      return literal(first.codePoint);
    }

    if (end === "-") {
      return yield* refuse(
        reader,
        dash + 1,
        String.raw`a range cannot end in an unescaped -; write \- to end it at a dash`,
      );
    }

    reader.at = dash + 1;

    const last = yield* classCharacter(reader);

    if (last.kind === "class") {
      return yield* refuse(
        reader,
        dash + 1,
        "a range ends in one character, and this escape names a class; end the range in a character, or put the escape outside the range",
      );
    }

    if (last.codePoint < first.codePoint) {
      return yield* refuse(
        reader,
        start,
        "this range runs from a higher code point to a lower one; write its lower end first",
      );
    }

    return rangeSource({ first: first.codePoint, last: last.codePoint });
  });

/**
 * Read a character group, the inside of `[…]`: a positive or negative group, and a subtraction
 * `-[…]` at its end.
 *
 * Appendix F reads `-` as a character only at the start or end of a group, and `^` as negation
 * only first; every other `-` is a range's or a subtraction's.
 *
 * @param reader The pattern being read, after the `[`.
 * @returns The group as a `v`-flag class, `[…]`; the reader stops at the closing `]` or at the
 *   end of the pattern, which the caller refuses.
 */
const characterGroup = (reader: Reader): Result.Result<string, RegexRefused> =>
  Result.gen(function* readCharacterGroup() {
    const negation = reader.chars[reader.at] === "^" ? "^" : "";
    const members: string[] = [];

    reader.at += negation.length;

    while (reader.at < reader.chars.length && reader.chars[reader.at] !== "]") {
      const { at } = reader;
      const character = reader.chars[at];
      const next = reader.chars[at + 1];

      if (character === "[") {
        return yield* refuse(
          reader,
          at,
          String.raw`a [ inside a class is written \[; a subtraction is written -[…] at the end of the class`,
        );
      }

      if (character === "-" && next === "[") {
        if (members.length === 0) {
          return yield* refuse(
            reader,
            at,
            String.raw`-[…] subtracts a class from the characters before it, and there are none; put characters before the -, or write \- to match a dash`,
          );
        }

        reader.at = at + 1;

        // oxlint-disable-next-line eslint/no-use-before-define -- `characterGroup` and `classExpression` are mutually recursive, as a subtraction's class nests; the call runs only after both are defined.
        const subtrahend = yield* classExpression(reader);

        if (reader.at < reader.chars.length && reader.chars[reader.at] !== "]") {
          return yield* refuse(
            reader,
            reader.at,
            "a subtraction -[…] ends its class; close the class with ] straight after it",
          );
        }

        return `[[${negation}${members.join("")}]--${subtrahend}]`;
      }

      if (character === "-") {
        if (members.length > 0 && next !== "]") {
          return yield* refuse(
            reader,
            at,
            String.raw`a - inside a class starts it, ends it, joins the two ends of a range or begins a subtraction -[…]; write \- to match a dash`,
          );
        }

        reader.at = at + 1;
        members.push(literal(0x2d));
      } else {
        members.push(yield* classMember(reader));
      }
    }

    if (members.length === 0 && reader.at < reader.chars.length) {
      return yield* refuse(
        reader,
        reader.at,
        String.raw`a class holds at least one character, range or escape; write \[ and \] to match the brackets themselves`,
      );
    }

    return `[${negation}${members.join("")}]`;
  });

/**
 * Read a character class expression, `[…]`, whose `[` is the next character.
 *
 * @param reader The pattern being read.
 * @returns The class as a `v`-flag class.
 */
const classExpression = (reader: Reader): Result.Result<string, RegexRefused> =>
  Result.gen(function* readClassExpression() {
    const open = reader.at;

    reader.at += 1;

    const source = yield* characterGroup(reader);

    if (reader.chars[reader.at] !== "]") {
      return yield* refuse(
        reader,
        open,
        String.raw`this [ is never closed; end the class with ], or write \[ to match a bracket`,
      );
    }

    reader.at += 1;

    return source;
  });

/**
 * Read a parenthesised group, `(…)`, whose `(` is the next character.
 *
 * @param reader The pattern being read.
 * @returns The group as a non-capturing group; XML Schema's groups capture nothing a match reads.
 */
const group = (reader: Reader): Result.Result<string, RegexRefused> =>
  Result.gen(function* readGroup() {
    const open = reader.at;

    reader.at += 1;

    if (reader.chars[reader.at] === "?") {
      return yield* refuse(
        reader,
        reader.at,
        "(? opens a group XML Schema does not have (non-capturing, look-around, named or with flags); write a plain (…) group",
      );
    }

    // oxlint-disable-next-line eslint/no-use-before-define -- `group` and `regularExpression` are mutually recursive, as groups nest; the call runs only after both are defined.
    const inner = yield* regularExpression(reader);

    if (reader.chars[reader.at] !== ")") {
      return yield* refuse(
        reader,
        open,
        String.raw`this ( is never closed; close the group with ), or write \( to match a parenthesis`,
      );
    }

    reader.at += 1;

    return `(?:${inner})`;
  });

/**
 * Read an atom: a normal character, a class, an escape, the wildcard or a group.
 *
 * @param reader The pattern being read, at a character that is not `|` or `)`.
 * @returns The atom's translation.
 */
const atom = (reader: Reader): Result.Result<string, RegexRefused> => {
  const { at } = reader;
  const character = reader.chars[at] ?? "";

  switch (character) {
    case "(": {
      return group(reader);
    }
    case "[": {
      return classExpression(reader);
    }
    case "\\": {
      return Result.map(escape(reader), (named) =>
        named.kind === "character" ? literal(named.codePoint) : named.source,
      );
    }
    case ".": {
      reader.at += 1;

      return Result.succeed(wildcard);
    }
    case "?":
    case "*":
    case "+":
    case "{": {
      return refuse(
        reader,
        at,
        `${character} repeats what comes before it, and nothing does here; write \\${character} to match it`,
      );
    }
    case "}":
    case "]": {
      return refuse(
        reader,
        at,
        `${character} closes nothing here; write \\${character} to match it`,
      );
    }
    default: {
      reader.at += 1;

      return Result.succeed(literal(character.codePointAt(0) ?? 0));
    }
  }
};

/**
 * Read an optional quantifier: `?`, `*`, `+`, `{n}`, `{n,}` or `{n,m}`.
 *
 * The counts are read as decimal integers of any size, written back without leading zeros, and
 * compared exactly: `{n,m}` needs n at most m.
 *
 * @param reader The pattern being read, after an atom.
 * @returns The quantifier's translation, empty when none follows.
 */
const quantifier = (reader: Reader): Result.Result<string, RegexRefused> => {
  const { at } = reader;
  const character = reader.chars[at];

  if (character === "?" || character === "*" || character === "+") {
    reader.at += 1;

    return Result.succeed(character);
  }

  if (character !== "{") {
    return Result.succeed("");
  }

  const least = digitsFrom(reader, at + 1);
  const afterLeast = at + 1 + least.length;
  const bounded = reader.chars[afterLeast] !== ",";
  const most = bounded ? least : digitsFrom(reader, afterLeast + 1);
  const close = bounded ? afterLeast : afterLeast + 1 + most.length;

  if (least === "" || reader.chars[close] !== "}") {
    return refuse(
      reader,
      at,
      String.raw`a { after an atom opens a repetition count; write {n}, {n,} or {n,m} in whole numbers, or \{ to match a brace`,
    );
  }

  if (most !== "" && BigInt(least) > BigInt(most)) {
    return refuse(
      reader,
      at,
      `the repetition count {${least},${most}} has its least above its most; write the smaller number first`,
    );
  }

  reader.at = close + 1;

  if (bounded) {
    return Result.succeed(`{${BigInt(least)}}`);
  }

  return Result.succeed(most === "" ? `{${BigInt(least)},}` : `{${BigInt(least)},${BigInt(most)}}`);
};

/**
 * Read a piece: an atom and its optional quantifier, which no second quantifier may follow.
 *
 * @param reader The pattern being read, at a character that is not `|` or `)`.
 * @returns The piece's translation.
 */
const piece = (reader: Reader): Result.Result<string, RegexRefused> =>
  Result.gen(function* readPiece() {
    const source = yield* atom(reader);
    const count = yield* quantifier(reader);
    const next = reader.chars[reader.at];

    if (count === "" || next === undefined) {
      return source + count;
    }

    if (next === "?" || next === "+") {
      return yield* refuse(
        reader,
        reader.at,
        `a quantifier followed by ${next} is ${next === "?" ? "lazy" : "possessive"}, which XML Schema does not have; remove the ${next}, or write \\${next} to match it`,
      );
    }

    if (next === "*" || next === "{") {
      return yield* refuse(
        reader,
        reader.at,
        "a quantifier cannot follow another; put the repeated piece in a group, (…), and quantify the group",
      );
    }

    return source + count;
  });

/**
 * Read a regular expression: branches separated by `|`, each a run of pieces.
 *
 * @param reader The pattern being read.
 * @returns The translation; the reader stops at a `)` or at the end of the pattern.
 */
const regularExpression = (reader: Reader): Result.Result<string, RegexRefused> =>
  Result.gen(function* readRegularExpression() {
    const branches: string[] = [];
    let pieces: string[] = [];

    while (reader.at < reader.chars.length && reader.chars[reader.at] !== ")") {
      if (reader.chars[reader.at] === "|") {
        branches.push(pieces.join(""));
        pieces = [];
        reader.at += 1;
      } else {
        pieces.push(yield* piece(reader));
      }
    }

    branches.push(pieces.join(""));

    return branches.join("|");
  });

/**
 * Compile a translation with the `v` flag.
 *
 * The translation is valid ECMAScript by construction; an engine that still refuses it (one
 * without the `v` flag, or with a limit on repetition counts) fails as a refusal at the start of
 * the pattern, carrying the engine's message, so no exception leaves the translator.
 *
 * @param pattern The pattern, for the refusal.
 * @param source The translation.
 * @returns The expression, or the engine's refusal.
 */
const compile = (pattern: string, source: string): Result.Result<RegExp, RegexRefused> =>
  Result.try({
    catch: (error) =>
      new RegexRefused({
        pattern,
        position: 0,
        reason: `this engine cannot compile its translation (${String(error)}); use an engine with the v flag, or lower the pattern's repetition counts`,
      }),
    try: () => new RegExp(source, "v"),
  });

/**
 * Translate an XML Schema regular expression into a JavaScript expression that matches the same
 * strings: the whole pattern, anchored at both ends, with the `v` flag.
 *
 * @example
 *   translate("[0-9.]{0,6}"); // an expression that takes "12.5" and refuses "1234567"
 *
 * @param pattern The pattern as the attribute holds it, such as a `pattern-mask` value.
 * @returns The expression, or {@link RegexRefused} at the first character Appendix F's grammar
 *   refuses.
 */
export const translate = (pattern: string): Result.Result<RegExp, RegexRefused> => {
  const chars: string[] = [];
  const offsets: number[] = [];
  let offset = 0;

  // A string iterates by code point, so a character outside the Basic Multilingual Plane is one.
  for (const character of pattern) {
    chars.push(character);
    offsets.push(offset);
    offset += character.length;
  }

  offsets.push(offset);

  const reader: Reader = { at: 0, chars, offsets, pattern };

  return Result.flatMap(regularExpression(reader), (body) =>
    reader.at < chars.length
      ? refuse(
          reader,
          reader.at,
          String.raw`this ) closes no group; remove it, or write \) to match a parenthesis`,
        )
      : compile(pattern, `^(?:${body})$`),
  );
};

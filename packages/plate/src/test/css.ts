/**
 * A reader for the restricted CSS this package writes, `src/styles.css` and
 * `src/dev/playground.css`, as `vp fmt` formats them.
 *
 * Test support, not a general CSS parser: it reads style rules, and style rules inside `@media` or
 * `@supports` one level deep, and fails on everything else, so a later check never runs over a
 * sheet the scanner silently dropped part of. Only tests import it.
 */
/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown. */
import { Effect, Option, Result, Schema } from "effect";

/**
 * One declaration of a style rule.
 */
export interface Declaration {
  /**
   * Whether the declaration ends in `!important`.
   */
  readonly important: boolean;
  /**
   * The property name as written.
   */
  readonly property: string;
  /**
   * The value, trimmed, without `!important`, with every run of white space outside a string
   * written as one space and none just inside a parenthesis.
   */
  readonly value: string;
}

/**
 * One style rule, with the conditional block that holds it.
 */
export interface StyleRule {
  /**
   * The enclosing `@media` or `@supports` rule, written `@media <prelude>` or
   * `@supports <prelude>` with its name in lowercase and its prelude normalised as a selector is;
   * empty at the top level.
   */
  readonly conditions: readonly string[];
  /**
   * The declarations, in source order.
   */
  readonly declarations: readonly Declaration[];
  /**
   * The selector list split on its top-level commas, each normalised: every run of white space
   * outside a string is one space, and no space remains just inside a parenthesis.
   */
  readonly selectors: readonly string[];
}

/**
 * A scanned stylesheet.
 */
export interface Sheet {
  /**
   * The style rules, in source order.
   */
  readonly rules: readonly StyleRule[];
}

/**
 * What the scanner refuses: a block inside a style rule or a conditional block inside a conditional
 * block, an at-rule other than `@media` and `@supports`, a declaration outside any rule, and an
 * unmatched brace, parenthesis, bracket, quote or comment.
 */
export const constructs = ["nesting", "at-rule", "declaration-outside-rule", "unbalanced"] as const;

/**
 * A construct the scanner refuses.
 */
export type Construct = (typeof constructs)[number];

/**
 * How to rewrite each refused construct so the scanner reads it.
 */
const remedies = {
  "at-rule":
    "is an at-rule the scanner does not read. Remove it, or write the styling as style rules at the top level or inside one @media or @supports block",
  "declaration-outside-rule":
    "is not inside a style rule with a selector. Put every declaration inside a rule, as `selector { property: value; }`, with no empty entry in its selector list",
  nesting:
    "is nested where the scanner reads only `property: value` declarations. Write it as a rule of its own, at the top level or directly inside one @media or @supports block",
  unbalanced:
    "is never matched. Close every brace, parenthesis, bracket, quote and comment the sheet opens, and open every one it closes",
} satisfies Record<Construct, string>;

/**
 * The scanner met CSS it does not read.
 *
 * `detail` is the at-rule's name with its `@`, the nested selector or text, the stray declaration,
 * or the unmatched character.
 */
export class CssUnsupported extends Schema.TaggedError<CssUnsupported>()("CssUnsupported", {
  construct: Schema.Literals(constructs),
  detail: Schema.String,
}) {
  /**
   * The construct and what to change.
   */
  override get message(): string {
    return `The stylesheet's ${JSON.stringify(this.detail)} ${remedies[this.construct]}.`;
  }
}

/**
 * Pairs each closing character with the one that opens it.
 */
const openers = new Map([
  [")", "("],
  ["]", "["],
  ["}", "{"],
]);

/**
 * CSS white space: space, tab, line feed, carriage return and form feed.
 */
const spaces: ReadonlySet<string> = new Set([" ", "\t", "\n", "\r", "\f"]);

/**
 * Decide whether a character opens a string.
 *
 * @param character One character.
 * @returns Whether `character` is a double or single quote.
 */
const isQuote = (character: string): boolean => character === '"' || character === "'";

/**
 * Find the end of the string that opens at `start`, a backslash escaping the character after it.
 *
 * @param text The text.
 * @param start The position of the opening quote.
 * @returns The position just after the closing quote, or none when the string is never closed.
 */
const stringEnd = (text: string, start: number): number | undefined => {
  const quote = text.charAt(start);
  let position = start + 1;
  while (position < text.length) {
    const character = text.charAt(position);
    if (character === quote) {
      return position + 1;
    }

    position += character === "\\" ? 2 : 1;
  }

  return undefined;
};

/**
 * The refusal of an unmatched character.
 *
 * @param detail The unmatched character.
 * @returns The failure.
 */
const unbalanced = (detail: string): Result.Result<never, CssUnsupported> =>
  Result.fail(new CssUnsupported({ construct: "unbalanced", detail }));

/**
 * Remove every comment outside a string.
 *
 * @param text The stylesheet.
 * @returns The stylesheet without comments, or the refusal of an unterminated string or comment.
 */
const dropComments = (text: string): Result.Result<string, CssUnsupported> => {
  let kept = "";
  let position = 0;
  while (position < text.length) {
    const character = text.charAt(position);
    if (isQuote(character)) {
      const end = stringEnd(text, position);
      if (end === undefined) {
        return unbalanced(character);
      }

      kept += text.slice(position, end);
      position = end;
    } else if (character === "\\") {
      kept += text.slice(position, position + 2);
      position += 2;
    } else if (text.startsWith("/*", position)) {
      const close = text.indexOf("*/", position + 2);
      if (close === -1) {
        return unbalanced("/*");
      }

      position = close + 2;
    } else {
      kept += character;
      position += 1;
    }
  }

  return Result.succeed(kept);
};

/**
 * Check that every brace, parenthesis and bracket outside a string is matched, in order.
 *
 * @param text The stylesheet without comments, every string closed.
 * @returns Nothing, or the refusal naming the first character left unmatched: an opener left open,
 *   or a closer with nothing open.
 */
const checkBalance = (text: string): Result.Result<void, CssUnsupported> => {
  const open: string[] = [];
  let position = 0;
  while (position < text.length) {
    const character = text.charAt(position);
    if (isQuote(character)) {
      position = stringEnd(text, position) ?? text.length;
    } else if (character === "\\") {
      position += 2;
    } else {
      const opener = openers.get(character);
      if ("([{".includes(character)) {
        open.push(character);
      } else if (opener !== undefined) {
        const top = open.pop();
        if (top !== opener) {
          return unbalanced(top ?? character);
        }
      }

      position += 1;
    }
  }

  const left = open.at(-1);

  return left === undefined ? Result.void : unbalanced(left);
};

/**
 * Find the first of some characters that sits outside every string, parenthesis and bracket.
 *
 * @param text The text, balanced.
 * @param start Where to start.
 * @param end Where to stop looking.
 * @param stops The characters to find.
 * @returns The position of the first stop character, or `end` when there is none before it.
 */
const boundary = (text: string, start: number, end: number, stops: string): number => {
  let depth = 0;
  let position = start;
  while (position < end) {
    const character = text.charAt(position);
    if (isQuote(character)) {
      position = stringEnd(text, position) ?? end;
    } else if (character === "\\") {
      position += 2;
    } else {
      if (depth === 0 && stops.includes(character)) {
        return position;
      }

      if (character === "(" || character === "[") {
        depth += 1;
      } else if (character === ")" || character === "]") {
        depth -= 1;
      }

      position += 1;
    }
  }

  return end;
};

/**
 * Find the brace that closes the block opening at `open`.
 *
 * @param text The text, balanced.
 * @param open The position of the block's `{`.
 * @returns The position of the matching `}`.
 */
const blockEnd = (text: string, open: number): number => {
  let depth = 0;
  let position = open;
  while (position < text.length) {
    const character = text.charAt(position);
    if (isQuote(character)) {
      position = stringEnd(text, position) ?? text.length;
    } else if (character === "\\") {
      position += 2;
    } else {
      if (character === "{") {
        depth += 1;
      } else if (character === "}") {
        depth -= 1;
        if (depth === 0) {
          return position;
        }
      }

      position += 1;
    }
  }

  return text.length;
};

/**
 * Normalise a selector, a condition's prelude or a value: every run of white space outside a
 * string becomes one space, none remains at either end or just inside a parenthesis, and a string
 * stays as written.
 *
 * @param text The text as written.
 * @returns The normalised text.
 */
const normalise = (text: string): string => {
  let written = "";
  let afterOpen = false;
  let space = false;
  let position = 0;
  while (position < text.length) {
    const character = text.charAt(position);
    if (spaces.has(character)) {
      space = true;
      position += 1;
    } else {
      if (space && written !== "" && !afterOpen && character !== ")") {
        written += " ";
      }

      space = false;
      const end = isQuote(character)
        ? (stringEnd(text, position) ?? text.length)
        : position + (character === "\\" ? 2 : 1);
      written += text.slice(position, end);
      afterOpen = character === "(";
      position = end;
    }
  }

  return written;
};

/**
 * Split a list on its commas outside every string, parenthesis and bracket, normalising each
 * entry.
 *
 * @param text The list as written.
 * @returns The entries, in order.
 */
const splitList = (text: string): readonly string[] => {
  const entries: string[] = [];
  let start = 0;
  for (;;) {
    const comma = boundary(text, start, text.length, ",");
    entries.push(normalise(text.slice(start, comma)));
    if (comma === text.length) {
      return entries;
    }

    start = comma + 1;
  }
};

/**
 * Read an at-rule's name from its prelude.
 *
 * @param prelude The at-rule's prelude, trimmed, beginning with `@`.
 * @returns The name with its `@`, as written.
 */
const atRuleName = (prelude: string): string => /^@[\w-]*/u.exec(prelude)?.[0] ?? "@";

/**
 * Read the end of a declaration's value: `!important`, outside any string, since a string ends in
 * its quote.
 */
const importantSuffix = /\s*!\s*important$/iu;

/**
 * Read the declarations of a style rule's block.
 *
 * @param text The stylesheet, balanced.
 * @param start The position after the block's `{`.
 * @param end The position of the block's `}`.
 * @returns The declarations in order, or the refusal of a nested block, an at-rule or text that is
 *   not a declaration.
 */
const readDeclarations = (
  text: string,
  start: number,
  end: number,
): Result.Result<readonly Declaration[], CssUnsupported> => {
  const declarations: Declaration[] = [];
  let position = start;
  for (;;) {
    const stop = boundary(text, position, end, "{;");
    const segment = text.slice(position, stop).trim();
    if (segment.startsWith("@")) {
      return Result.fail(new CssUnsupported({ construct: "at-rule", detail: atRuleName(segment) }));
    }

    const colon = boundary(segment, 0, segment.length, ":");
    const property = segment.slice(0, colon).trim();
    if (
      text.charAt(stop) === "{" ||
      (segment !== "" && (property === "" || colon === segment.length))
    ) {
      return Result.fail(new CssUnsupported({ construct: "nesting", detail: normalise(segment) }));
    }

    if (segment !== "") {
      const value = normalise(segment.slice(colon + 1));
      const important = importantSuffix.test(value);
      declarations.push({
        important,
        property,
        value: important ? value.replace(importantSuffix, "") : value,
      });
    }

    if (stop === end) {
      return Result.succeed(declarations);
    }

    position = stop + 1;
  }
};

/**
 * Read the style rules from `start` to `end`: the whole sheet, or one conditional block's body.
 *
 * @param text The stylesheet, balanced.
 * @param start Where to start.
 * @param end Where to stop: the text's end, or the position of the block's `}`.
 * @param conditions The enclosing conditional block, written with its name, or none at the top
 *   level.
 * @returns The rules in order, or the refusal of the first construct the scanner does not read.
 */
const readRules = (
  text: string,
  start: number,
  end: number,
  conditions: readonly string[],
): Result.Result<readonly StyleRule[], CssUnsupported> =>
  Result.gen(function* readRuleList() {
    const rules: StyleRule[] = [];
    let position = start;
    for (;;) {
      const stop = boundary(text, position, end, "{;");
      const prelude = text.slice(position, stop).trim();
      if (stop === end && prelude === "") {
        return rules;
      }

      if (prelude.startsWith("@")) {
        const name = atRuleName(prelude);
        const conditional = ["@media", "@supports"].includes(name.toLowerCase());
        if (!conditional || text.charAt(stop) !== "{") {
          return yield* Result.fail(new CssUnsupported({ construct: "at-rule", detail: name }));
        }

        const condition = `${name.toLowerCase()} ${normalise(prelude.slice(name.length))}`.trim();
        if (conditions.length > 0) {
          return yield* Result.fail(
            new CssUnsupported({ construct: "nesting", detail: condition }),
          );
        }

        const close = blockEnd(text, stop);
        rules.push(...(yield* readRules(text, stop + 1, close, [condition])));
        position = close + 1;
      } else if (text.charAt(stop) === "{") {
        const close = blockEnd(text, stop);
        const selectors = splitList(prelude);
        if (selectors.includes("")) {
          const detail =
            prelude === "" ? normalise(text.slice(stop + 1, close)) : normalise(prelude);

          return yield* Result.fail(
            new CssUnsupported({ construct: "declaration-outside-rule", detail: detail || "{}" }),
          );
        }

        const declarations = yield* readDeclarations(text, stop + 1, close);
        rules.push({ conditions, declarations, selectors });
        position = close + 1;
      } else {
        return yield* Result.fail(
          new CssUnsupported({
            construct: "declaration-outside-rule",
            detail: prelude === "" ? ";" : normalise(prelude),
          }),
        );
      }
    }
  });

/**
 * Scan a stylesheet this package writes into its style rules.
 *
 * It drops comments outside strings, reads style rules and their declarations, and reads `@media`
 * and `@supports` blocks one level deep that hold style rules. It fails closed: anything it does
 * not read is a `CssUnsupported`, never a rule silently dropped.
 *
 * @param text The stylesheet, as `vp fmt` writes it.
 * @returns The sheet's style rules in source order, or `CssUnsupported` naming the first construct
 *   it does not read: a block inside a style rule or a conditional block inside a conditional block
 *   (`nesting`), any at-rule but `@media` and `@supports` (`at-rule`), a declaration outside any
 *   rule (`declaration-outside-rule`), or an unmatched brace, parenthesis, bracket, quote or
 *   comment (`unbalanced`).
 */
export const scanSheet = (text: string): Effect.Effect<Sheet, CssUnsupported> =>
  Effect.fromResult(
    Result.gen(function* readSheet() {
      const css = yield* dropComments(text);
      yield* checkBalance(css);

      const rules = yield* readRules(css, 0, css.length, []);

      return { rules };
    }),
  );

/**
 * One attribute test of a compound, `[name]` or `[name<operator>value]`.
 */
export interface AttributeTest {
  /**
   * The case flag after the value, `i` or `s`, when the test has one.
   */
  readonly flag: Option.Option<string>;
  /**
   * The attribute's name, unescaped.
   */
  readonly name: string;
  /**
   * The operator, `=`, `~=`, `|=`, `^=`, `$=` or `*=`, when the test compares a value.
   */
  readonly operator: Option.Option<string>;
  /**
   * The value compared, unquoted and unescaped, when the test compares one.
   */
  readonly value: Option.Option<string>;
}

/**
 * One pseudo-class of a compound.
 */
export interface PseudoClass {
  /**
   * The name, in lowercase, without its colon.
   */
  readonly name: string;
  /**
   * The argument of `:where`, `:is`, `:not` or `:has` split on its top-level commas, each
   * normalised as `StyleRule.selectors` are; empty for every other pseudo-class.
   */
  readonly selectors: readonly string[];
}

/**
 * One compound selector: the simple selectors between two combinators.
 */
export interface Compound {
  /**
   * The attribute tests, in order.
   */
  readonly attributes: readonly AttributeTest[];
  /**
   * The class names, unescaped, in order.
   */
  readonly classes: readonly string[];
  /**
   * The ID names, unescaped, in order.
   */
  readonly ids: readonly string[];
  /**
   * The pseudo-classes, in order.
   */
  readonly pseudoClasses: readonly PseudoClass[];
  /**
   * The pseudo-element names, in lowercase, without their colons, in order.
   */
  readonly pseudoElements: readonly string[];
  /**
   * The type selector, or `*` for the universal selector, when the compound has one.
   */
  readonly type: Option.Option<string>;
}

/**
 * What a stylesheet uses, for the floor check.
 */
export interface Use {
  /**
   * The kind of feature.
   */
  readonly kind:
    | "property"
    | "value"
    | "selector"
    | "pseudo-class"
    | "pseudo-element"
    | "at-rule"
    | "media-feature"
    | "function"
    | "unit";
  /**
   * The feature's name.
   */
  readonly name: string;
  /**
   * The declaration's property, for a `value` use.
   */
  readonly property: Option.Option<string>;
}

/**
 * One `var()` reference in a value.
 */
export interface VarReference {
  /**
   * The fallback after the reference's first comma, trimmed and normalised, when it has one.
   */
  readonly fallback: Option.Option<string>;
  /**
   * The custom property's name.
   */
  readonly name: string;
}

/**
 * A name read from the text, unescaped, and the position just after it.
 */
interface Read {
  /**
   * The position just after what was read.
   */
  readonly end: number;
  /**
   * What was read, unescaped.
   */
  readonly value: string;
}

/**
 * Decide whether a character starts a name: a letter, an underscore or a non-ASCII character.
 *
 * @param character One character, or the empty string past the end.
 * @returns Whether `character` can start a name.
 */
const isNameStart = (character: string): boolean =>
  /^[A-Za-z_]$/u.test(character) || (character.codePointAt(0) ?? 0) >= 0x80;

/**
 * Decide whether a character continues a name: a name start, a digit or a hyphen.
 *
 * @param character One character, or the empty string past the end.
 * @returns Whether `character` can continue a name.
 */
const isNameCharacter = (character: string): boolean =>
  isNameStart(character) || /^[\d-]$/u.test(character);

/**
 * Decide whether a character is a decimal digit.
 *
 * @param character One character, or the empty string past the end.
 * @returns Whether `character` is `0` to `9`.
 */
const isDigit = (character: string): boolean => /^\d$/u.test(character);

/**
 * Decide whether a backslash at `position` starts an escape: one not followed by a line feed or the
 * end of the text.
 *
 * @param text The text.
 * @param position The position to look at.
 * @returns Whether an escape starts at `position`.
 */
const isEscape = (text: string, position: number): boolean =>
  text.charAt(position) === "\\" &&
  position + 1 < text.length &&
  text.charAt(position + 1) !== "\n";

/**
 * Read the escape at `position`: up to six hexadecimal digits and one white space after them, or
 * any other single character.
 *
 * @param text The text.
 * @param position The position of the backslash.
 * @returns The character the escape stands for, and the position after it.
 */
const readEscape = (text: string, position: number): Read => {
  let end = position + 1;
  let hex = "";
  while (hex.length < 6 && /^[\dA-Fa-f]$/u.test(text.charAt(end))) {
    hex += text.charAt(end);
    end += 1;
  }

  if (hex === "") {
    return { end: end + 1, value: text.charAt(end) };
  }

  const code = Number.parseInt(hex, 16);
  const valid = code > 0 && code <= 0x10_ff_ff && (code < 0xd8_00 || code > 0xdf_ff);

  return {
    end: spaces.has(text.charAt(end)) ? end + 1 : end,
    value: valid ? String.fromCodePoint(code) : "\uFFFD",
  };
};

/**
 * Decide whether an identifier starts at `position`.
 *
 * @param text The text.
 * @param position The position to look at.
 * @returns Whether a name start, an escape, or a hyphen before either or before another hyphen,
 *   sits at `position`.
 */
const startsIdentifier = (text: string, position: number): boolean => {
  const first = text.charAt(position);
  if (first === "-") {
    const second = text.charAt(position + 1);

    return second === "-" || isNameStart(second) || isEscape(text, position + 1);
  }

  return isNameStart(first) || isEscape(text, position);
};

/**
 * Read the name characters and escapes from `start`.
 *
 * @param text The text.
 * @param start Where the name starts.
 * @returns The name, unescaped, and the position after it.
 */
const readName = (text: string, start: number): Read => {
  let value = "";
  let position = start;
  while (position < text.length) {
    if (isEscape(text, position)) {
      const escape = readEscape(text, position);
      value += escape.value;
      position = escape.end;
    } else if (isNameCharacter(text.charAt(position))) {
      value += text.charAt(position);
      position += 1;
    } else {
      break;
    }
  }

  return { end: position, value };
};

/**
 * Read the string that opens at `start`, without its quotes and unescaped.
 *
 * @param text The text.
 * @param start The position of the opening quote.
 * @returns The string's content, and the position after its closing quote.
 */
const readString = (text: string, start: number): Read => {
  const quote = text.charAt(start);
  let value = "";
  let position = start + 1;
  while (position < text.length && text.charAt(position) !== quote) {
    if (text.charAt(position) !== "\\") {
      value += text.charAt(position);
      position += 1;
    } else if (text.charAt(position + 1) === "\n") {
      position += 2;
    } else {
      const escape = readEscape(text, position);
      value += escape.value;
      position = escape.end;
    }
  }

  return { end: position + 1, value };
};

/**
 * Skip white space.
 *
 * @param text The text.
 * @param start Where to start.
 * @returns The position of the first character at or after `start` that is not white space.
 */
const skipSpaces = (text: string, start: number): number => {
  let position = start;
  while (spaces.has(text.charAt(position))) {
    position += 1;
  }

  return position;
};

/**
 * A combinator, named as the floor check names it.
 */
type Combinator = "descendant" | "child" | "next-sibling" | "subsequent-sibling";

/**
 * The combinators written with a character; white space alone is `descendant`.
 */
const combinatorNames: ReadonlyMap<string, Combinator> = new Map([
  [">", "child"],
  ["+", "next-sibling"],
  ["~", "subsequent-sibling"],
]);

/**
 * The characters a combinator is written with, white space included.
 */
const combinatorCharacters = " >+~";

/**
 * A selector split at its combinators.
 */
interface SplitSelector {
  /**
   * The combinators, left to right; a relative selector's leading combinator is first.
   */
  readonly combinators: readonly Combinator[];
  /**
   * Each compound's text, left to right.
   */
  readonly segments: readonly string[];
}

/**
 * Split a selector into its compounds' text and the combinators between them.
 *
 * @param selector One selector, normalised or not; a relative selector's leading combinator is
 *   kept.
 * @returns Each compound's text and each combinator.
 */
const splitCompounds = (selector: string): SplitSelector => {
  const text = normalise(selector);
  const combinators: Combinator[] = [];
  const segments: string[] = [];
  let start = 0;
  for (;;) {
    const stop = boundary(text, start, text.length, combinatorCharacters);
    if (stop > start) {
      segments.push(text.slice(start, stop));
    }

    if (stop === text.length) {
      return { combinators, segments };
    }

    let combinator: Combinator = "descendant";
    let position = stop;
    while (position < text.length && combinatorCharacters.includes(text.charAt(position))) {
      combinator = combinatorNames.get(text.charAt(position)) ?? combinator;
      position += 1;
    }

    combinators.push(combinator);
    start = position;
  }
};

/**
 * The pseudo-classes whose argument is a selector list.
 */
const logical: ReadonlySet<string> = new Set(["has", "is", "not", "where"]);

/**
 * The pseudo-elements CSS 2 wrote with one colon, read as pseudo-elements either way.
 */
const legacyPseudoElements: ReadonlySet<string> = new Set([
  "after",
  "before",
  "first-letter",
  "first-line",
]);

/**
 * The attribute operators, each before any it is a suffix of.
 */
const attributeOperators = ["~=", "|=", "^=", "$=", "*=", "="] as const;

/**
 * Read an attribute test's text, between its brackets.
 *
 * @param content The text inside the brackets.
 * @returns The attribute test.
 */
const readAttribute = (content: string): AttributeTest => {
  const name = readName(content, skipSpaces(content, 0));
  const at = skipSpaces(content, name.end);
  const operator = attributeOperators.find((candidate) => content.startsWith(candidate, at));
  if (operator === undefined) {
    return { flag: Option.none(), name: name.value, operator: Option.none(), value: Option.none() };
  }

  const start = skipSpaces(content, at + operator.length);
  const value = isQuote(content.charAt(start))
    ? readString(content, start)
    : readName(content, start);
  const flag = readName(content, skipSpaces(content, value.end)).value.toLowerCase();

  return {
    flag: flag === "" ? Option.none() : Option.some(flag),
    name: name.value,
    operator: Option.some(operator),
    value: Option.some(value.value),
  };
};

/**
 * Read one compound's text into its simple selectors.
 *
 * @param text The compound's text, with no combinator in it outside parentheses and brackets.
 * @returns The compound.
 */
const readCompound = (text: string): Compound => {
  const attributes: AttributeTest[] = [];
  const classes: string[] = [];
  const ids: string[] = [];
  const pseudoClasses: PseudoClass[] = [];
  const pseudoElements: string[] = [];
  let type: Option.Option<string> = Option.none();
  let position = 0;
  while (position < text.length) {
    const character = text.charAt(position);
    if (character === "." || character === "#") {
      const name = readName(text, position + 1);
      (character === "." ? classes : ids).push(name.value);
      position = name.end;
    } else if (character === "[") {
      const close = boundary(text, position + 1, text.length, "]");
      attributes.push(readAttribute(text.slice(position + 1, close)));
      position = close + 1;
    } else if (character === ":") {
      const element = text.charAt(position + 1) === ":";
      const name = readName(text, position + (element ? 2 : 1));
      const lowercase = name.value.toLowerCase();
      const close =
        text.charAt(name.end) === "(" ? boundary(text, name.end + 1, text.length, ")") : name.end;
      if (element || legacyPseudoElements.has(lowercase)) {
        pseudoElements.push(lowercase);
      } else {
        const argument = text.slice(name.end + 1, close);
        pseudoClasses.push({
          name: lowercase,
          selectors: logical.has(lowercase) ? splitList(argument) : [],
        });
      }

      position = close === name.end ? close : close + 1;
    } else if (character === "*") {
      type = Option.some("*");
      position += 1;
    } else if (startsIdentifier(text, position)) {
      const name = readName(text, position);
      type = Option.some(name.value);
      position = name.end;
    } else {
      position += 1;
    }
  }

  return { attributes, classes, ids, pseudoClasses, pseudoElements, type };
};

/**
 * Read a selector's compounds.
 *
 * It does not descend: a caller reads the selectors of a `:where`, `:is`, `:not` or `:has` by
 * calling `compounds` on each entry of that pseudo-class's `selectors`.
 *
 * @param selector One selector, normalised or not.
 * @returns One compound per compound selector, left to right, the combinators (white space, `>`,
 *   `+` and `~`) dropped.
 */
export const compounds = (selector: string): readonly Compound[] =>
  splitCompounds(selector).segments.map(readCompound);

/**
 * Build one use.
 *
 * @param kind The kind of feature.
 * @param name The feature's name.
 * @param property The declaration's property, for a `value` use.
 * @returns The use.
 */
const use = (
  kind: Use["kind"],
  name: string,
  property: Option.Option<string> = Option.none(),
): Use => ({ kind, name, property });

/**
 * Read what a selector uses, at any depth.
 *
 * @param selector One selector.
 * @returns A `selector` use per combinator and per kind of simple selector each compound holds
 *   (`type`, `universal`, `class`, `id`, `attribute`), and each pseudo-class and pseudo-element by
 *   name, descending into the selectors of `:where`, `:is`, `:not` and `:has`.
 */
const selectorUses = (selector: string): readonly Use[] => {
  const { combinators, segments } = splitCompounds(selector);

  return [
    ...combinators.map((combinator) => use("selector", combinator)),
    ...segments.map(readCompound).flatMap((compound) => [
      ...Option.match(compound.type, {
        onNone: () => [],
        onSome: (type) => [use("selector", type === "*" ? "universal" : "type")],
      }),
      ...(compound.classes.length > 0 ? [use("selector", "class")] : []),
      ...(compound.ids.length > 0 ? [use("selector", "id")] : []),
      ...(compound.attributes.length > 0 ? [use("selector", "attribute")] : []),
      ...compound.pseudoClasses.flatMap((pseudoClass) => [
        use("pseudo-class", pseudoClass.name),
        ...pseudoClass.selectors.flatMap(selectorUses),
      ]),
      ...compound.pseudoElements.map((name) => use("pseudo-element", name)),
    ]),
  ];
};

/**
 * The characters that sign a number.
 */
const signs: ReadonlySet<string> = new Set(["+", "-"]);

/**
 * Decide whether a number starts at `position`: a digit, or a decimal point before one, after an
 * optional sign.
 *
 * @param text The text.
 * @param position The position to look at.
 * @returns Whether a number starts at `position`.
 */
const startsNumber = (text: string, position: number): boolean => {
  const at = signs.has(text.charAt(position)) ? position + 1 : position;

  return isDigit(text.charAt(at)) || (text.charAt(at) === "." && isDigit(text.charAt(at + 1)));
};

/**
 * Find the end of the number that starts at `start`: its sign, digits, fraction and exponent.
 *
 * @param text The text.
 * @param start Where the number starts.
 * @returns The position after the number, where its unit starts if it has one.
 */
const numberEnd = (text: string, start: number): number => {
  const digits = (from: number): number => {
    let position = from;
    while (isDigit(text.charAt(position))) {
      position += 1;
    }

    return position;
  };

  let position = digits(signs.has(text.charAt(start)) ? start + 1 : start);
  if (text.charAt(position) === "." && isDigit(text.charAt(position + 1))) {
    position = digits(position + 1);
  }

  if (text.charAt(position).toLowerCase() === "e") {
    const exponent = signs.has(text.charAt(position + 1)) ? position + 2 : position + 1;
    if (isDigit(text.charAt(exponent))) {
      position = digits(exponent);
    }
  }

  return position;
};

/**
 * Read what a declaration's value uses.
 *
 * @param declaration The declaration.
 * @returns Each function name before a `(`, each unit after a number, and each other identifier
 *   outside strings that is not a custom property name, as a `value` use for the declaration's
 *   property, in order; names in lowercase.
 */
const valueUses = (declaration: Declaration): readonly Use[] => {
  const text = declaration.value;
  const found: Use[] = [];
  let position = 0;
  while (position < text.length) {
    const character = text.charAt(position);
    if (isQuote(character)) {
      position = stringEnd(text, position) ?? text.length;
    } else if (character === "#") {
      position = readName(text, position + 1).end;
    } else if (startsNumber(text, position)) {
      const end = numberEnd(text, position);
      const unit = text.charAt(end) === "%" ? { end: end + 1, value: "%" } : readName(text, end);
      if (unit.value !== "") {
        found.push(use("unit", unit.value.toLowerCase()));
      }

      position = unit.end;
    } else if (startsIdentifier(text, position)) {
      const name = readName(text, position);
      const lowercase = name.value.toLowerCase();
      if (text.charAt(name.end) === "(") {
        found.push(use("function", lowercase));

        const raw = lowercase === "url" && !isQuote(text.charAt(skipSpaces(text, name.end + 1)));
        position = raw ? boundary(text, name.end + 1, text.length, ")") + 1 : name.end + 1;
      } else {
        if (!name.value.startsWith("--")) {
          found.push(use("value", lowercase, Option.some(declaration.property)));
        }

        position = name.end;
      }
    } else {
      position += character === "\\" ? 2 : 1;
    }
  }

  return found;
};

/**
 * Read the features one parenthesised group of a `@media` prelude names.
 *
 * @param group The text inside the group's parentheses.
 * @returns The feature before a colon (`forced-colors` in `forced-colors: active`), or each bare
 *   identifier of a range or boolean test (`width` in `400px <= width`, `hover`); none for a group
 *   that holds another group, whose groups are read on their own.
 */
const groupFeatures = (group: string): readonly string[] => {
  const names: string[] = [];
  let position = 0;
  while (position < group.length) {
    const character = group.charAt(position);
    if (character === "(") {
      return [];
    }

    if (character === ":") {
      return names;
    }

    if (startsNumber(group, position)) {
      const end = numberEnd(group, position);
      position = group.charAt(end) === "%" ? end + 1 : readName(group, end).end;
    } else if (startsIdentifier(group, position)) {
      const name = readName(group, position);
      if (group.charAt(name.end) === "(") {
        position = boundary(group, name.end + 1, group.length, ")") + 1;
      } else {
        names.push(name.value.toLowerCase());
        position = name.end;
      }
    } else {
      position += 1;
    }
  }

  return names;
};

/**
 * Read what a rule's condition uses.
 *
 * @param condition The condition, written `@media <prelude>` or `@supports <prelude>`.
 * @returns The `at-rule` use (`media`, `supports`) and, for `@media`, each `media-feature` its
 *   prelude names.
 */
const conditionUses = (condition: string): readonly Use[] => {
  const name = atRuleName(condition);
  const atRule = name.slice(1).toLowerCase();
  const prelude = condition.slice(name.length);
  const features: string[] = [];
  if (atRule === "media") {
    for (let position = 0; position < prelude.length; position += 1) {
      if (prelude.charAt(position) === "(" && !isNameCharacter(prelude.charAt(position - 1))) {
        const close = boundary(prelude, position + 1, prelude.length, ")");
        features.push(...groupFeatures(prelude.slice(position + 1, close)));
      }
    }
  }

  return [use("at-rule", atRule), ...features.map((feature) => use("media-feature", feature))];
};

/**
 * Read what a scanned stylesheet uses, for the floor check.
 *
 * For each rule: each declaration's `property`; in its value, each keyword (`value`, with the
 * property), `function` and `unit`; for each selector, at any depth, a `selector` use per kind of
 * simple selector and per combinator, and each `pseudo-class` and `pseudo-element`; for each
 * condition, its `at-rule` and each `media-feature` a `@media` prelude names.
 *
 * @param sheet The scanned stylesheet.
 * @returns The uses, rule by rule; a use may repeat, and the floor check removes duplicates.
 */
export const uses = (sheet: Sheet): readonly Use[] =>
  sheet.rules.flatMap((rule) => [
    ...rule.declarations.flatMap((declaration) => [
      use("property", declaration.property),
      ...valueUses(declaration),
    ]),
    ...rule.selectors.flatMap(selectorUses),
    ...rule.conditions.flatMap(conditionUses),
  ]);

/**
 * Read every `var()` reference in a value.
 *
 * @param value A declaration's value.
 * @returns Every reference in the order its `var(` appears, so one nested in another's fallback
 *   follows the reference that holds it; each with its custom property's name and, when it has a
 *   comma, its fallback, trimmed and normalised.
 */
export const varReferences = (value: string): readonly VarReference[] => {
  const references: VarReference[] = [];
  let position = 0;
  while (position < value.length) {
    const character = value.charAt(position);
    if (isQuote(character)) {
      position = stringEnd(value, position) ?? value.length;
    } else if (startsIdentifier(value, position)) {
      const name = readName(value, position);
      if (name.value.toLowerCase() === "var" && value.charAt(name.end) === "(") {
        const close = boundary(value, name.end + 1, value.length, ")");
        const comma = boundary(value, name.end + 1, close, ",");
        references.push({
          fallback:
            comma === close ? Option.none() : Option.some(normalise(value.slice(comma + 1, close))),
          name: normalise(value.slice(name.end + 1, comma)),
        });
        position = name.end + 1;
      } else {
        position = name.end;
      }
    } else {
      position += character === "\\" ? 2 : 1;
    }
  }

  return references;
};

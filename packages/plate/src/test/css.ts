/**
 * A reader for the restricted CSS this package writes, `src/styles.css` and
 * `src/dev/playground.css`, as `vp fmt` formats them.
 *
 * Test support, not a general CSS parser: it reads style rules, and style rules inside `@media` or
 * `@supports` one level deep, and fails on everything else, so a later check never runs over a
 * sheet the scanner silently dropped part of. Only tests import it.
 */
/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown. */
import { Effect, Result, Schema } from "effect";

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

/**
 * The dev playground's theme box: reading a pasted shadcn/ui theme, its `:root` and `.dark` blocks
 * of custom properties, into declarations the server re-serialises instead of echoing the paste.
 *
 * Dev playground code outside the core: nothing reachable from `src/index.ts` imports it.
 */
/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown. */
import { Effect, Result, Schema } from "effect";

/**
 * One custom property declaration of a theme: its name, `--` and the rest, and its value, trimmed.
 */
export type ThemeDeclaration = readonly [name: string, value: string];

/**
 * A theme: the declarations of its `:root` block and of its `.dark` block, each in source order.
 */
export interface Theme {
  /**
   * The `.dark` block's declarations; empty when the paste had no `.dark` block.
   */
  readonly dark: readonly ThemeDeclaration[];
  /**
   * The `:root` block's declarations; empty when the paste had no `:root` block.
   */
  readonly light: readonly ThemeDeclaration[];
}

/**
 * The theme with no declarations, which leaves every token at its fallback.
 */
export const emptyTheme: Theme = { dark: [], light: [] };

/**
 * Why a paste is refused: it is larger than 32 KiB, holds a selector or at-rule other than one
 * `:root` and one `.dark` block, declares something other than a custom property, has a value the
 * box does not accept, or leaves a brace, quote or comment unmatched.
 */
export const refusalCauses = [
  "too-large",
  "selector",
  "declaration",
  "value",
  "unbalanced",
] as const;

/**
 * A reason the theme box refuses a paste.
 */
export type RefusalCause = (typeof refusalCauses)[number];

/**
 * The largest paste the box reads, in UTF-8 bytes: 32 KiB.
 */
const sizeLimit = 32 * 1024;

/**
 * The longest value the box accepts, in characters.
 */
const valueLimit = 512;

/**
 * The most characters of the paste a refusal quotes.
 */
const detailLimit = 80;

/**
 * The first 80 characters of a text, counted in code points (the `u` flag), so a quote never ends
 * inside a surrogate pair.
 */
const firstCharacters = new RegExp(`^[\\s\\S]{0,${detailLimit}}`, "u");

/**
 * A value of 1 to 512 characters, counted in code points (the `u` flag).
 */
const valueLength = new RegExp(`^[\\s\\S]{1,${valueLimit}}$`, "u");

/**
 * What each refusal asks the person pasting to change, after the quoted part.
 */
const remedies = {
  declaration:
    "is not a custom property. Declare only custom properties, written `--` followed by letters, digits, `_` or `-`, as `--name: value;`",
  selector:
    "is not a `:root` or `.dark` block. Paste only the `:root` and `.dark` blocks, each once, with no other selector or at-rule",
  "too-large": `is more than the ${sizeLimit} bytes (32 KiB) the box reads. Paste only the \`:root\` and \`.dark\` blocks of custom properties`,
  unbalanced:
    "is never matched. Close every brace, quote and comment the theme opens, and open every brace it closes",
  value: `marks a value the box refuses. Give each custom property a value that is not empty, has at most ${valueLimit} characters, and holds none of \`;\`, \`{\`, \`}\`, \`<\`, \`>\`, \`\\\`, \`/*\`, \`@\` or \`!important\`, no \`url()\`, \`src()\`, \`image()\` or \`image-set()\` call, and no quoted string that crosses a line`,
} satisfies Record<RefusalCause, string>;

/**
 * The theme box refused a paste.
 *
 * `detail` quotes only the offending part, at most 80 characters, never the paste: the size in
 * bytes, the selector or at-rule name, the property name, the forbidden token (or the property
 * name when the value is empty, too long or holds a string that crosses a line), or the unmatched
 * character.
 */
export class ThemeRefused extends Schema.TaggedError<ThemeRefused>()("ThemeRefused", {
  cause: Schema.Literals(refusalCauses),
  detail: Schema.String,
}) {
  /**
   * The refused part and what to change.
   */
  override get message(): string {
    return `The pasted theme's ${JSON.stringify(this.detail)} ${remedies[this.cause]}.`;
  }
}

/**
 * A custom property name: `--` followed by ASCII letters, digits, `_` or `-`.
 */
const customProperty = /^--[\w-]+$/u;

/**
 * The tokens a value may not hold, matched in any letter case: the earliest in a value is the one a
 * refusal quotes. `url(`, `src(`, `image(` and `image-set(` (with its `-webkit-` prefix) fetch,
 * `@` and `!important` change the cascade, and the rest could end the declaration, the block or
 * the page's `<style>` element.
 */
const forbiddenToken = /;|\{|\}|<|>|\\|\/\*|@|!\s*important|url\(|src\(|image\(|image-set\(/iu;

/**
 * The selectors the box reads, each at most once.
 */
const selectors: ReadonlySet<string> = new Set([":root", ".dark"]);

/**
 * One block of the paste, its body split into declarations.
 */
interface Block {
  /**
   * The body's declarations, split on `;` outside strings, each trimmed, none empty.
   */
  readonly declarations: readonly string[];
  /**
   * The block's selector, `:root` or `.dark`.
   */
  readonly selector: string;
}

/**
 * One block of the paste, each declaration split into its name and value.
 */
interface NamedBlock {
  /**
   * The declarations, in source order.
   */
  readonly declarations: readonly ThemeDeclaration[];
  /**
   * The block's selector, `:root` or `.dark`.
   */
  readonly selector: string;
}

/**
 * Build a refusal, quoting at most 80 characters of the offending part with its white space runs
 * written as one space.
 *
 * @param cause Why the paste is refused.
 * @param detail The offending part.
 * @returns The failure.
 */
const refuse = (cause: RefusalCause, detail: string): Result.Result<never, ThemeRefused> =>
  Result.fail(
    new ThemeRefused({
      cause,
      detail: firstCharacters.exec(detail.replaceAll(/\s+/gu, " ").trim())?.[0] ?? "",
    }),
  );

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
 * Find where the next token starts outside strings: past a whole string, or past an escaped
 * character, or one character on. Strings are closed once the paste passed `stripComments`.
 *
 * @param text The paste without comments.
 * @param position A position outside any string.
 * @returns The position after the token at `position`.
 */
const nextToken = (text: string, position: number): number => {
  const character = text.charAt(position);
  if (isQuote(character)) {
    return stringEnd(text, position) ?? text.length;
  }

  return position + (character === "\\" ? 2 : 1);
};

/**
 * A line break, which ends a CSS string: LF, CR or form feed, each of which CSS Syntax 3's input
 * preprocessing reads as LF.
 */
const lineBreak = /[\n\r\f]/u;

/**
 * An escape inside a string: a backslash and the character after it, with CR LF taken as the one
 * line break preprocessing makes of it.
 */
const escaped = /\\(?:\r\n|[\s\S])/gu;

/**
 * Decide whether a value holds a string that crosses a line: a string with a line break that no
 * backslash escapes. CSS Syntax 3 ("consume a string token") ends a string at such a break and
 * makes it a bad string, so the declaration is invalid; an escaped line break continues the string
 * and does not cross a line.
 *
 * @param value A value, its strings closed.
 * @returns Whether a string in `value` crosses a line.
 */
const crossesLine = (value: string): boolean => {
  let position = 0;
  while (position < value.length) {
    const end = nextToken(value, position);
    if (
      isQuote(value.charAt(position)) &&
      lineBreak.test(value.slice(position, end).replaceAll(escaped, ""))
    ) {
      return true;
    }

    position = end;
  }

  return false;
};

/**
 * Check that every brace, quote and comment is matched, and write each comment as one space so it
 * still separates what it stood between.
 *
 * @param text The paste.
 * @returns The paste without comments, or the refusal of the first unmatched character.
 */
const stripComments = (text: string): Result.Result<string, ThemeRefused> => {
  let kept = "";
  let depth = 0;
  let position = 0;
  while (position < text.length) {
    const character = text.charAt(position);
    if (isQuote(character)) {
      const end = stringEnd(text, position);
      if (end === undefined) {
        return refuse("unbalanced", character);
      }

      kept += text.slice(position, end);
      position = end;
    } else if (character === "\\") {
      kept += text.slice(position, position + 2);
      position += 2;
    } else if (text.startsWith("/*", position)) {
      const close = text.indexOf("*/", position + 2);
      if (close === -1) {
        return refuse("unbalanced", "/*");
      }

      kept += " ";
      position = close + 2;
    } else {
      if (character === "{") {
        depth += 1;
      } else if (character === "}") {
        if (depth === 0) {
          return refuse("unbalanced", "}");
        }

        depth -= 1;
      }

      kept += character;
      position += 1;
    }
  }

  return depth === 0 ? Result.succeed(kept) : refuse("unbalanced", "{");
};

/**
 * Find the first `{` outside strings at or after `from`.
 *
 * @param text The paste without comments.
 * @param from Where to start, outside any string.
 * @returns The brace's position, or none.
 */
const blockStart = (text: string, from: number): number | undefined => {
  let position = from;
  while (position < text.length) {
    if (text.charAt(position) === "{") {
      return position;
    }

    position = nextToken(text, position);
  }

  return undefined;
};

/**
 * Find the `}` that closes the block opening at `open`.
 *
 * @param text The paste without comments, every brace matched.
 * @param open The position of the block's `{`.
 * @returns The position of its `}`.
 */
const blockEnd = (text: string, open: number): number => {
  let depth = 0;
  let position = open;
  while (position < text.length) {
    const character = text.charAt(position);
    if (character === "{") {
      depth += 1;
    } else if (character === "}") {
      depth -= 1;
      if (depth === 0) {
        return position;
      }
    }

    position = nextToken(text, position);
  }

  return text.length;
};

/**
 * Split a block's body on its `;` outside strings, so a `;` inside quotes stays in its value.
 *
 * @param body The body, between the block's braces.
 * @returns The declarations, trimmed, without empty ones.
 */
const splitDeclarations = (body: string): readonly string[] => {
  const declarations: string[] = [];
  let start = 0;
  let position = 0;
  while (position <= body.length) {
    if (position === body.length || body.charAt(position) === ";") {
      const declaration = body.slice(start, position).trim();
      if (declaration !== "") {
        declarations.push(declaration);
      }

      start = position + 1;
      position += 1;
    } else {
      position = nextToken(body, position);
    }
  }

  return declarations;
};

/**
 * Read the paste's blocks, refusing a selector other than `:root` or `.dark`, either one twice,
 * text outside a block, and an at-rule at the top level or inside a block.
 *
 * @param text The paste without comments.
 * @returns The blocks in source order.
 */
const readBlocks = (text: string): Result.Result<readonly Block[], ThemeRefused> => {
  const blocks: Block[] = [];
  const seen = new Set<string>();
  let position = 0;
  let open = blockStart(text, position);
  while (open !== undefined) {
    const selector = text.slice(position, open).trim();
    if (!selectors.has(selector) || seen.has(selector)) {
      return refuse("selector", selector === "" ? "{" : selector);
    }

    const close = blockEnd(text, open);
    const declarations = splitDeclarations(text.slice(open + 1, close));
    const atRule = declarations.find((declaration) => declaration.startsWith("@"));
    if (atRule !== undefined) {
      return refuse("selector", /^@[\w-]*/u.exec(atRule)?.[0] ?? atRule);
    }

    seen.add(selector);
    blocks.push({ declarations, selector });
    position = close + 1;
    open = blockStart(text, position);
  }

  const rest = text.slice(position).trim();

  return rest === "" ? Result.succeed(blocks) : refuse("selector", rest);
};

/**
 * Split each declaration into its name and value, refusing one with no `:` or whose name is not a
 * custom property.
 *
 * @param blocks The paste's blocks.
 * @returns The blocks in source order, each declaration as its name and trimmed value.
 */
const readNames = (
  blocks: readonly Block[],
): Result.Result<readonly NamedBlock[], ThemeRefused> => {
  const named: NamedBlock[] = [];
  for (const { declarations, selector } of blocks) {
    const pairs: ThemeDeclaration[] = [];
    for (const declaration of declarations) {
      const colon = declaration.indexOf(":");
      if (colon === -1) {
        return refuse("declaration", declaration);
      }

      const name = declaration.slice(0, colon).trim();
      if (!customProperty.test(name)) {
        return refuse("declaration", name);
      }

      pairs.push([name, declaration.slice(colon + 1).trim()]);
    }

    named.push({ declarations: pairs, selector });
  }

  return Result.succeed(named);
};

/**
 * Check one value: not empty, at most 512 characters, holding no forbidden token, and holding no
 * string that crosses a line.
 *
 * @param declaration The declaration whose value to check.
 * @returns Nothing, or the refusal quoting the earliest forbidden token, or the property's name when
 *   the value is empty, too long or holds a string that crosses a line.
 */
const checkValue = ([name, value]: ThemeDeclaration): Result.Result<void, ThemeRefused> => {
  if (!valueLength.test(value)) {
    return refuse("value", name);
  }

  const token = forbiddenToken.exec(value);
  if (token !== null) {
    return refuse("value", token[0]);
  }

  return crossesLine(value) ? refuse("value", name) : Result.void;
};

/**
 * Pick one block's declarations.
 *
 * @param named The paste's blocks.
 * @param selector `:root` or `.dark`.
 * @returns That block's declarations, or none when the paste had no such block.
 */
const declarationsOf = (
  named: readonly NamedBlock[],
  selector: string,
): readonly ThemeDeclaration[] =>
  named.find((block) => block.selector === selector)?.declarations ?? [];

/**
 * Read a pasted theme: one `:root` block and one `.dark` block of custom property declarations,
 * either one optional, with comments between.
 *
 * The checks run in order, each over the whole paste: the size in UTF-8 bytes (`too-large`); every
 * brace, quote and comment matched (`unbalanced`); then, with comments dropped, the blocks and
 * at-rules (`selector`), the declarations' names (`declaration`) and their values (`value`).
 *
 * @param text The paste.
 * @returns The theme, its values trimmed and otherwise as written, or the first refusal.
 */
export const parseTheme = (text: string): Effect.Effect<Theme, ThemeRefused> =>
  Effect.fromResult(
    Result.gen(function* readTheme() {
      const size = new TextEncoder().encode(text).length;
      if (size > sizeLimit) {
        return yield* refuse("too-large", `${size} bytes`);
      }

      const css = yield* stripComments(text);
      const blocks = yield* readBlocks(css);
      const named = yield* readNames(blocks);
      for (const { declarations } of named) {
        for (const declaration of declarations) {
          yield* checkValue(declaration);
        }
      }

      return { dark: declarationsOf(named, ".dark"), light: declarationsOf(named, ":root") };
    }),
  ).pipe(Effect.withSpan("parseTheme"));

/**
 * Write one block: `<selector> {`, then one `<name>: <value>;` line per declaration indented by two
 * spaces, then `}`, each line ending in a newline.
 *
 * @param selector The block's selector.
 * @param declarations Its declarations, in order.
 * @returns The block's text.
 */
const block = (selector: string, declarations: readonly ThemeDeclaration[]): string =>
  `${selector} {\n${declarations.map(([name, value]) => `  ${name}: ${value};\n`).join("")}}\n`;

/**
 * Write a theme's blocks, `:root` first, then `.dark`, leaving out a block with no declarations and
 * separating the rest with one blank line.
 *
 * This is the text the theme box shows: `parseTheme(themeText(theme))` gives `theme` back.
 *
 * @param theme An accepted theme.
 * @returns The blocks' text, or `""` for the empty theme.
 */
export const themeText = (theme: Theme): string =>
  (
    [
      [":root", theme.light],
      [".dark", theme.dark],
    ] as const
  )
    .filter(([, declarations]) => declarations.length > 0)
    .map(([selector, declarations]) => block(selector, declarations))
    .join("\n");

/**
 * The dev playground's host CSS: the theme's blocks, then the colour schemes, then the page's font
 * and colours on those tokens, so the browser's own colours follow the theme.
 *
 * `.dark` takes `color-scheme: dark` only when the theme has `.dark` declarations, so with no
 * `.dark` block ticking Dark changes nothing.
 *
 * @param theme An accepted theme.
 * @returns The CSS, its blocks separated by one blank line.
 */
export const themeCss = (theme: Theme): string =>
  [
    themeText(theme),
    block(":root", [["color-scheme", "light"]]),
    theme.dark.length === 0 ? "" : block(".dark", [["color-scheme", "dark"]]),
    block("html", [["font-family", "var(--font-sans, system-ui, sans-serif)"]]),
    block("body", [
      ["background-color", "var(--background, Canvas)"],
      ["color", "var(--foreground, CanvasText)"],
    ]),
  ]
    .filter((text) => text !== "")
    .join("\n");

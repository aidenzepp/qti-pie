import { Effect, Option } from "effect";
import { ReaderRefusal, WellFormednessError } from "#qti/xml/errors.ts";
import type { XmlDeclaration } from "#qti/xml/tree.ts";

/**
 * The type and the default value of one declared attribute.
 *
 * `type` is the type keyword (`CDATA`, `ID`, `NMTOKENS`, `NOTATION`, ...) or, for an enumeration,
 * the parenthesized list as written. `default` is the value the declaration supplies, with its
 * character references, the five predefined entity references and the general entities declared
 * before the list expanded, any other entity reference left as written, and its white space
 * normalized (XML 1.0 section 3.3.3); `#REQUIRED` and `#IMPLIED` supply none.
 */
export interface AttlistEntry {
  readonly default: Option.Option<string>;
  readonly type: string;
}

/**
 * What the prolog of a document says, read before any of the body is parsed.
 *
 * `entities` holds the internal general entities by name, each as its replacement text: character
 * references expanded, general-entity references as written; a parameter-entity reference inside a
 * value is refused. An external or unparsed entity is not in it. `attlists` holds the declared
 * attributes of each element by name. Both stop growing at the first parameter-entity reference
 * the lexer cannot read, unless the document is `standalone`.
 * `bodyStart` is the offset of the first character that the prolog does not account for.
 */
export interface Prolog {
  readonly attlists: ReadonlyMap<string, ReadonlyMap<string, AttlistEntry>>;
  readonly bodyStart: number;
  readonly declaration: Option.Option<XmlDeclaration>;
  readonly doctype: Option.Option<string>;
  readonly entities: ReadonlyMap<string, string>;
  /**
   * The characters of replacement text opened so far, counted as `charge` counts them, so the
   * substitution of the body continues the same count.
   */
  readonly expanded: number;
  /**
   * True when the DOCTYPE names a `SYSTEM` or `PUBLIC` identifier. The external subset is never
   * fetched.
   */
  readonly externalSubset: boolean;
  readonly standalone: boolean;
}

/**
 * The characters that may start an XML name (XML 1.0 section 2.3, `NameStartChar`), as the inside
 * of a `u`-mode character class.
 */
export const NAME_START = String.raw`:A-Z_a-z\u00C0-\u00D6\u00D8-\u00F6\u00F8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD\u{10000}-\u{EFFFF}`;

/**
 * The characters that may continue an XML name (`NameChar`), as the inside of a `u`-mode character
 * class.
 */
export const NAME_CHAR = String.raw`${NAME_START}\-.0-9\u00B7\u0300-\u036F\u203F\u2040`;

/**
 * An XML name, without anchors, for building the patterns below.
 */
const NAME = String.raw`[${NAME_START}][${NAME_CHAR}]*`;

/**
 * White space that XML allows between tokens: space, tab, carriage return and line feed.
 */
const SPACE = /[ \t\r\n]+/uy;

/**
 * One XML name at the read position.
 */
const NAME_AT = new RegExp(NAME, "uy");

/**
 * A parenthesized list of names or name tokens separated by `|` (`Enumeration` and `NotationType`).
 */
const ENUMERATION = new RegExp(
  String.raw`\([ \t\r\n]*[${NAME_CHAR}]+(?:[ \t\r\n]*\|[ \t\r\n]*[${NAME_CHAR}]+)*[ \t\r\n]*\)`,
  "uy",
);

/**
 * The keyword after `<!` of each markup declaration the internal subset may hold.
 */
const DECLARATION_KEYWORD = new RegExp(
  String.raw`<!(ENTITY|ATTLIST|ELEMENT|NOTATION)(?![${NAME_CHAR}])`,
  "uy",
);

/**
 * The rest of a markup declaration through its closing `>`, which a quoted literal can contain.
 */
const DECLARATION_REST = /(?:[^"'>]|"[^"]*"|'[^']*')*>/uy;

/**
 * Each construct that can appear inside an entity value: a hexadecimal or decimal character
 * reference, a general-entity reference, a parameter-entity reference (which a value refuses), or a
 * bare `&` or `%`.
 */
const ENTITY_VALUE_TOKEN = new RegExp(
  String.raw`&#x([0-9A-Fa-f]+);|&#([0-9]+);|&(${NAME});|%(${NAME});|[&%]`,
  "gu",
);

/**
 * Each construct that can appear inside an attribute default that needs work: a character
 * reference, an entity reference, or a bare `&` or `<`.
 */
const DEFAULT_TOKEN = new RegExp(String.raw`&#x([0-9A-Fa-f]+);|&#([0-9]+);|&(${NAME});|[&<]`, "gu");

/**
 * Each place in replacement text where a general entity is referenced, with the comments,
 * processing instructions and CDATA sections that hide a reference consumed as one match.
 */
const REFERENCE_OR_HIDDEN = new RegExp(
  String.raw`<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!\[CDATA\[[\s\S]*?\]\]>|&(${NAME});`,
  "gu",
);

/**
 * The line break forms XML 1.0 section 2.11 folds to one line feed.
 */
const LINE_BREAK = /\r\n|[\n\r]/gu;

/**
 * The entities every XML processor knows, by name, with their characters (XML 1.0 section 4.6).
 */
const PREDEFINED: ReadonlyMap<string, string> = new Map([
  ["amp", "&"],
  ["apos", "'"],
  ["gt", ">"],
  ["lt", "<"],
  ["quot", '"'],
]);

/**
 * The attribute types other than an enumeration (`StringType`, `TokenizedType` and `NOTATION`).
 */
const ATTRIBUTE_TYPES: ReadonlySet<string> = new Set([
  "CDATA",
  "ENTITIES",
  "ENTITY",
  "ID",
  "IDREF",
  "IDREFS",
  "NMTOKEN",
  "NMTOKENS",
  "NOTATION",
]);

/**
 * A read position in some text: the document, or the replacement text of a parameter entity that is
 * used as markup.
 *
 * `offset` moves as the lexer reads. `anchor` is the offset in `source` where a failure is reported
 * when `text` is a replacement text, the reference that brought it in; it is `None` for the
 * document, where `offset` is already a position in `source`.
 */
interface Cursor {
  readonly anchor: Option.Option<number>;
  offset: number;
  readonly source: string;
  readonly text: string;
}

/**
 * The most replacement texts that may be open at once, one inside another. It is `xmllint`'s depth.
 */
export const EXPANSION_DEPTH = 20;

/**
 * The characters a document may open through entity references, and how many it has opened.
 *
 * `expanded` grows as `charge` is called; `limit` is fixed when the budget is made.
 */
export interface ExpansionBudget {
  expanded: number;
  readonly limit: number;
}

/**
 * The characters of replacement text a document may open before it is refused as amplification.
 */
const EXPANSION_ALLOWED = 1_000_000;

/**
 * How many times the document's own length may be opened, once past `EXPANSION_ALLOWED`.
 */
const EXPANSION_FACTOR = 5;

/**
 * The cost of one reference beyond its text, so that a million references to an empty entity are
 * bounded too.
 */
const EXPANSION_REFERENCE_COST = 20;

/**
 * A fresh budget for a document of `textLength` characters, at the same limit libxml2 sets: the
 * larger of one million characters and five times the document.
 *
 * @param textLength - The length of the whole document text.
 * @param expanded - The characters already counted, when a later stage continues the count.
 */
export const expansionBudget = (textLength: number, expanded = 0): ExpansionBudget => ({
  expanded,
  limit: Math.max(EXPANSION_ALLOWED, EXPANSION_FACTOR * textLength),
});

/**
 * Count one opened replacement text against `budget`, and say why it is refused if it is.
 *
 * @returns The refusal when `depth` is past `EXPANSION_DEPTH` or the budget is spent, else `None`.
 */
const overBudget = (
  budget: ExpansionBudget,
  length: number,
  depth: number,
  name: string,
): Option.Option<ReaderRefusal> => {
  budget.expanded += length + EXPANSION_REFERENCE_COST;
  if (depth > EXPANSION_DEPTH) {
    return Option.some(
      new ReaderRefusal({
        detail: `The entity "${name}" is opened ${depth} levels deep, past the limit of ${EXPANSION_DEPTH}. Declare the entity's value in fewer, flatter steps, or write the text out.`,
        rule: "entity-expansion",
      }),
    );
  }

  if (budget.expanded > budget.limit) {
    return Option.some(
      new ReaderRefusal({
        detail: `The entity "${name}" brings the replacement text opened by the document's entity references to ${budget.expanded} characters, past the limit of ${budget.limit}. Declare the entity's value in fewer, flatter steps, or write the text out.`,
        rule: "entity-expansion",
      }),
    );
  }

  return Option.none();
};

/**
 * Count one opened replacement text against `budget`.
 *
 * Each call adds `length` and a fixed cost per reference to `budget.expanded`.
 *
 * @param budget - The document's budget.
 * @param length - The length of the replacement text being opened.
 * @param depth - How many replacement texts are open, this one included.
 * @param name - The entity, for the refusal.
 * @returns Nothing; fails with a refusal under rule `entity-expansion` when the depth or the
 *   budget is exceeded.
 */
export const charge = (
  budget: ExpansionBudget,
  length: number,
  depth: number,
  name: string,
): Effect.Effect<void, ReaderRefusal> => {
  const refusal = overBudget(budget, length, depth, name);

  return Option.isSome(refusal) ? Effect.fail(refusal.value) : Effect.void;
};

/**
 * What the internal subset has declared so far, and whether reading it has stopped.
 *
 * `bound` holds `&name` and `%name` for every entity declared, internal or external, because the
 * first declaration of a name is binding (XML 1.0 section 4.2). `stopped` is set at the first
 * parameter-entity reference that cannot be read (section 5.1).
 */
interface Tables {
  readonly attlists: Map<string, Map<string, AttlistEntry>>;
  readonly bound: Set<string>;
  readonly budget: ExpansionBudget;
  readonly entities: Map<string, string>;
  readonly parameters: Map<string, string>;
  readonly standalone: boolean;
  stopped: boolean;
}

/**
 * The offset and text of a quoted literal's content, for reporting a failure inside it.
 */
interface Literal {
  readonly content: string;
  readonly start: number;
}

/**
 * Find the line and column, both starting at 1 as `saxes` counts them, of `offset` in `source`.
 *
 * A column counts code points and `\r\n`, a lone `\r` and `\n` each end a line.
 *
 * @param source - The text the offset lies in.
 * @param offset - A position in `source`, possibly its length.
 * @returns The 1-based line and column of the character at `offset`.
 */
const positionOf = (source: string, offset: number) => {
  const before = source.slice(0, offset);
  let line = 1;
  let lineStart = 0;
  for (const lineBreak of before.matchAll(LINE_BREAK)) {
    line += 1;
    lineStart = lineBreak.index + lineBreak[0].length;
  }

  const codePoints = before.slice(lineStart).match(/./gsu)?.length ?? 0;

  return { column: codePoints + 1, line };
};

/**
 * Describe the text at the read position for an error message.
 *
 * @param cursor - The read position.
 * @returns The next few characters quoted, or a phrase for the end of the text.
 */
const found = (cursor: Cursor): string => {
  const next = cursor.text.slice(cursor.offset, cursor.offset + 12);

  return next === "" ? "the end of the text" : JSON.stringify(next);
};

/**
 * Build the well-formedness error for a failure at `offset`, or at the reference that brought a
 * replacement text in.
 *
 * @param cursor - The read position, which says whether `offset` is a position in the document.
 * @param message - What the lexer expected and what it found.
 * @param offset - Where the failure lies in `cursor.text`; the read position by default.
 * @returns An error with the line and column to report; no substitution precedes the prolog.
 */
const failure = (
  cursor: Cursor,
  message: string,
  offset: number = cursor.offset,
): WellFormednessError => {
  const where = Option.getOrElse(cursor.anchor, () => offset);

  return new WellFormednessError({
    afterSubstitution: false,
    ...positionOf(cursor.source, where),
    message,
  });
};

/**
 * Read `pattern` at the read position and advance past it when it matches.
 *
 * @param cursor - The read position.
 * @param pattern - A sticky expression.
 * @returns The matched text, or `None` and no movement.
 */
const consume = (cursor: Cursor, pattern: RegExp): Option.Option<string> => {
  pattern.lastIndex = cursor.offset;
  const match = pattern.exec(cursor.text);
  if (match === null) {
    return Option.none();
  }

  cursor.offset = pattern.lastIndex;

  return Option.some(match[0]);
};

/**
 * Advance past `token` when it is next.
 *
 * @param cursor - The read position.
 * @param token - The exact text to take.
 * @returns Whether the token was there.
 */
const take = (cursor: Cursor, token: string): boolean => {
  if (!cursor.text.startsWith(token, cursor.offset)) {
    return false;
  }

  cursor.offset += token.length;

  return true;
};

/**
 * Advance past any white space.
 *
 * @param cursor - The read position.
 * @returns Whether there was any.
 */
const skipSpace = (cursor: Cursor): boolean => Option.isSome(consume(cursor, SPACE));

/**
 * Advance past `token`, which must be next.
 *
 * @param cursor - The read position.
 * @param token - The exact text that must come next.
 * @param context - The construct being read, for the message.
 * @returns Nothing; fails when the token is absent.
 */
const expect = Effect.fnUntraced(function* expectToken(
  cursor: Cursor,
  token: string,
  context: string,
): Effect.fn.Return<void, WellFormednessError> {
  if (!take(cursor, token)) {
    yield* failure(cursor, `${context}: expected "${token}", found ${found(cursor)}.`);
  }
});

/**
 * Advance past required white space.
 *
 * @param cursor - The read position.
 * @param context - The construct being read, for the message.
 * @returns Nothing; fails when there is none.
 */
const expectSpace = Effect.fnUntraced(function* expectWhiteSpace(
  cursor: Cursor,
  context: string,
): Effect.fn.Return<void, WellFormednessError> {
  if (!skipSpace(cursor)) {
    yield* failure(cursor, `${context}: expected white space, found ${found(cursor)}.`);
  }
});

/**
 * Read an XML name.
 *
 * @param cursor - The read position.
 * @param context - What the name names, for the message.
 * @returns The name; fails when none starts here.
 */
const readName = Effect.fnUntraced(function* readXmlName(
  cursor: Cursor,
  context: string,
): Effect.fn.Return<string, WellFormednessError> {
  const name = consume(cursor, NAME_AT);
  if (Option.isNone(name)) {
    return yield* failure(cursor, `${context}: expected a name, found ${found(cursor)}.`);
  }

  return name.value;
});

/**
 * Read a literal in single or double quotes, which can hold the other quote and any markup.
 *
 * @param cursor - The read position.
 * @param context - The construct being read, for the message.
 * @returns The content between the quotes and its offset; fails when no quoted literal is next or
 *   its closing quote is missing.
 */
const readQuoted = Effect.fnUntraced(function* readQuotedLiteral(
  cursor: Cursor,
  context: string,
): Effect.fn.Return<Literal, WellFormednessError> {
  const quote = cursor.text[cursor.offset];
  if (quote !== '"' && quote !== "'") {
    return yield* failure(cursor, `${context}: expected a quoted literal, found ${found(cursor)}.`);
  }

  const start = cursor.offset + 1;
  const end = cursor.text.indexOf(quote, start);
  if (end === -1) {
    return yield* failure(cursor, `${context}: the literal that starts here is not closed.`);
  }

  cursor.offset = end + 1;

  return { content: cursor.text.slice(start, end), start };
});

/**
 * Advance past an external identifier (`SYSTEM "uri"` or `PUBLIC "id" "uri"`) when one is next.
 *
 * @param cursor - The read position.
 * @param context - The construct being read, for the message.
 * @returns Whether an identifier was there; fails when one is malformed.
 */
const skipExternalId = Effect.fnUntraced(function* skipExternalIdentifier(
  cursor: Cursor,
  context: string,
): Effect.fn.Return<boolean, WellFormednessError> {
  const system = take(cursor, "SYSTEM");
  if (!system && !take(cursor, "PUBLIC")) {
    return false;
  }

  yield* expectSpace(cursor, context);
  yield* readQuoted(cursor, context);
  if (!system) {
    yield* expectSpace(cursor, context);
    yield* readQuoted(cursor, context);
  }

  return true;
});

/**
 * Advance past a comment, which cannot hold `--` or end in `-` (XML 1.0 section 2.5).
 *
 * @param cursor - The read position, at `<!--`.
 * @returns Nothing; fails when the comment is not closed or holds `--`.
 */
const skipComment = Effect.fnUntraced(function* skipCommentMarkup(
  cursor: Cursor,
): Effect.fn.Return<void, WellFormednessError> {
  const start = cursor.offset + "<!--".length;
  const end = cursor.text.indexOf("-->", start);
  if (end === -1) {
    yield* failure(cursor, "comment: the comment that starts here is not closed.");
  }

  const body = cursor.text.slice(start, end);
  if (body.includes("--") || body.endsWith("-")) {
    yield* failure(cursor, 'comment: "--" may not appear inside a comment.', start);
  }

  cursor.offset = end + "-->".length;
});

/**
 * Advance past a processing instruction.
 *
 * @param cursor - The read position, at `<?`.
 * @returns Nothing; fails when it has no target name or is not closed.
 */
const skipInstruction = Effect.fnUntraced(function* skipProcessingInstruction(
  cursor: Cursor,
): Effect.fn.Return<void, WellFormednessError> {
  cursor.offset += "<?".length;
  yield* readName(cursor, "processing instruction");

  const end = cursor.text.indexOf("?>", cursor.offset);
  if (end === -1) {
    yield* failure(cursor, "processing instruction: the instruction is not closed.");
  }

  cursor.offset = end + "?>".length;
});

/**
 * Advance past the rest of a markup declaration without reading it.
 *
 * @param cursor - The read position, just after the declaration's keyword.
 * @returns Nothing; fails when no closing `>` follows outside quotes.
 */
const skipDeclaration = Effect.fnUntraced(function* skipDeclarationRest(
  cursor: Cursor,
): Effect.fn.Return<void, WellFormednessError> {
  if (Option.isNone(consume(cursor, DECLARATION_REST))) {
    yield* failure(cursor, "declaration: the declaration that starts here is not closed.");
  }
});

/**
 * Tell whether a code point may appear in an XML document (`Char`, XML 1.0 section 2.2).
 *
 * @param code - A code point.
 * @returns True for tab, line feed, carriage return and the allowed ranges.
 */
const isXmlCharacter = (code: number): boolean =>
  code === 0x9 ||
  code === 0xa ||
  code === 0xd ||
  (code >= 0x20 && code <= 0xd7_ff) ||
  (code >= 0xe0_00 && code <= 0xff_fd) ||
  (code >= 0x1_00_00 && code <= 0x10_ff_ff);

/**
 * Turn a character reference into its character.
 *
 * @param cursor - The read position, for the message's line.
 * @param token - The `RegExp` match for `&#x...;` or `&#...;`, groups 1 and 2.
 * @param offset - Where the reference lies in `cursor.text`.
 * @returns The character; fails when it is not one XML allows.
 */
const characterOf = Effect.fnUntraced(function* characterOfReference(
  cursor: Cursor,
  token: RegExpExecArray,
  offset: number,
): Effect.fn.Return<string, WellFormednessError> {
  const [reference, hex, decimal] = token;
  const code = hex === undefined ? Number(decimal) : Number.parseInt(hex, 16);
  if (!isXmlCharacter(code)) {
    return yield* failure(
      cursor,
      `character reference: "${reference}" does not name a character XML 1.0 allows.`,
      offset,
    );
  }

  return String.fromCodePoint(code);
});

/**
 * Rebuild the content of a literal by replacing each token `pattern` finds and normalizing the text
 * between them.
 *
 * @param literal - The literal's content and offset.
 * @param pattern - A global expression for the tokens to replace.
 * @param normalize - What to do to the text between tokens.
 * @param replace - Gives the replacement for a token, given its match and its offset in the text.
 * @returns The rebuilt content.
 */
const expandLiteral = Effect.fnUntraced(function* expandLiteralContent<E>(
  literal: Literal,
  pattern: RegExp,
  normalize: (text: string) => string,
  replace: (token: RegExpExecArray, offset: number) => Effect.Effect<string, E>,
): Effect.fn.Return<string, E> {
  const pieces: string[] = [];
  let from = 0;
  for (const token of literal.content.matchAll(pattern)) {
    pieces.push(
      normalize(literal.content.slice(from, token.index)),
      yield* replace(token, literal.start + token.index),
    );
    from = token.index + token[0].length;
  }
  pieces.push(normalize(literal.content.slice(from)));

  return pieces.join("");
});

/**
 * Compute the replacement text of an entity value (XML 1.0 section 4.5): character references
 * expanded, general-entity references left as written.
 *
 * A parameter-entity reference inside the value is an error when the entity was read, because a
 * markup declaration of the internal subset forbids one (section 2.8, "PEs in Internal Subset").
 * One that was not read stops the subset (section 5.1) and leaves the returned text incomplete; in
 * a `standalone` document it is an error instead, because every entity such a document uses is
 * declared in it.
 *
 * @param tables - The subset's declarations; `stopped` is set when a reference cannot be read.
 * @param cursor - The read position, for failures.
 * @param literal - The entity value's literal.
 * @returns The replacement text.
 */
const expandEntityValue = (tables: Tables, cursor: Cursor, literal: Literal) =>
  expandLiteral(
    literal,
    ENTITY_VALUE_TOKEN,
    (text) => text.replaceAll(LINE_BREAK, "\n"),
    Effect.fnUntraced(function* replaceEntityToken(
      token: RegExpExecArray,
      offset: number,
    ): Effect.fn.Return<string, WellFormednessError> {
      const [whole, hex, decimal, general, parameter] = token;
      if (hex !== undefined || decimal !== undefined) {
        return yield* characterOf(cursor, token, offset);
      }

      if (general !== undefined) {
        return whole;
      }

      if (parameter === undefined) {
        return yield* failure(
          cursor,
          `entity value: "${whole}" must be written as a reference, "&#${whole === "&" ? "38" : "37"};".`,
          offset,
        );
      }

      if (tables.parameters.has(parameter)) {
        return yield* failure(
          cursor,
          `entity value: the parameter-entity reference "%${parameter};" is not allowed inside a markup declaration of the internal subset (XML 1.0 section 2.8, "PEs in Internal Subset"). Write the value without it, or "&#37;" for a literal percent sign.`,
          offset,
        );
      }

      if (tables.standalone) {
        return yield* failure(
          cursor,
          `entity value: the parameter entity "${parameter}" is not declared before this reference, and a standalone document declares every entity it uses.`,
          offset,
        );
      }

      tables.stopped = true;

      return "";
    }),
  );

/**
 * Compute the value an attribute declaration supplies: character references, the five predefined
 * entity references and the general entities declared so far expanded, other entity references
 * left as written, and each literal tab and line break turned into a space (XML 1.0 sections 3.3.3
 * and 4.4.5).
 *
 * A declared entity's replacement text is processed by the same rules, recursively, and each one
 * opened is charged against the subset's budget. A replacement text holding a `<` or a bare `&`
 * is refused (the well-formedness constraint "No `<` in Attribute Values"), at the reference.
 *
 * @param tables - The subset's declarations and budget.
 * @param cursor - The read position, for failures.
 * @param literal - The default's literal, or a replacement text being expanded.
 * @param depth - How many replacement texts are open, `literal`'s own excluded.
 * @param at - The offset to report failures at, when `literal` is a replacement text.
 * @returns The default value.
 */
const expandDefault = (
  tables: Tables,
  cursor: Cursor,
  literal: Literal,
  depth = 0,
  at: Option.Option<number> = Option.none(),
): Effect.Effect<string, WellFormednessError | ReaderRefusal> =>
  expandLiteral(
    literal,
    DEFAULT_TOKEN,
    (text) => text.replaceAll(/\r\n|[\t\n\r]/gu, " "),
    Effect.fnUntraced(function* replaceDefaultToken(
      token: RegExpExecArray,
      offset: number,
    ): Effect.fn.Return<string, WellFormednessError | ReaderRefusal> {
      const [whole, hex, decimal, entity] = token;
      const where = Option.getOrElse(at, () => offset);
      if (hex !== undefined || decimal !== undefined) {
        return yield* characterOf(cursor, token, where);
      }

      if (entity === undefined) {
        return yield* failure(
          cursor,
          `attribute default: "${whole}" cannot appear in a default value; write "&#${whole === "&" ? "38" : "60"};".`,
          where,
        );
      }

      const predefined = PREDEFINED.get(entity);
      if (predefined !== undefined) {
        return predefined;
      }

      const replacement = tables.entities.get(entity);
      if (replacement === undefined) {
        return whole;
      }

      yield* charge(tables.budget, replacement.length, depth + 1, entity);

      return yield* expandDefault(
        tables,
        cursor,
        { content: replacement, start: where },
        depth + 1,
        Option.some(where),
      );
    }),
  );

/**
 * Advance past the rest of an external entity declaration, whose identifier says where the entity
 * lives and which the lexer never fetches; a general entity may also be unparsed (`NDATA`).
 *
 * @param cursor - The read position, after the entity's name.
 * @param parameter - Whether the declaration is of a parameter entity, which cannot be unparsed.
 * @returns Nothing; fails when neither a quoted value nor an external identifier is there.
 */
const skipExternalEntity = Effect.fnUntraced(function* skipExternalEntityDeclaration(
  cursor: Cursor,
  parameter: boolean,
): Effect.fn.Return<void, WellFormednessError> {
  const context = "entity declaration";
  const external = yield* skipExternalId(cursor, context);
  if (!external) {
    yield* failure(
      cursor,
      `${context}: expected a quoted value, "SYSTEM" or "PUBLIC", found ${found(cursor)}.`,
    );
  }

  skipSpace(cursor);
  if (!parameter && take(cursor, "NDATA")) {
    yield* expectSpace(cursor, context);
    yield* readName(cursor, context);
    skipSpace(cursor);
  }

  yield* expect(cursor, ">", context);
});

/**
 * Read an `<!ENTITY>` declaration and table it: a general entity in `entities`, a parameter entity
 * in `parameters`, unless its name already has a declaration or it is external.
 *
 * @param tables - The subset's declarations.
 * @param cursor - The read position, just after `<!ENTITY`.
 * @returns Nothing; fails when the declaration is malformed.
 */
const lexEntity = Effect.fnUntraced(function* lexEntityDeclaration(
  tables: Tables,
  cursor: Cursor,
): Effect.fn.Return<void, WellFormednessError> {
  const context = "entity declaration";
  yield* expectSpace(cursor, context);

  const parameter = take(cursor, "%");
  if (parameter) {
    yield* expectSpace(cursor, context);
  }

  const name = yield* readName(cursor, context);
  yield* expectSpace(cursor, context);

  const key = `${parameter ? "%" : "&"}${name}`;
  if (cursor.text[cursor.offset] === '"' || cursor.text[cursor.offset] === "'") {
    const literal = yield* readQuoted(cursor, context);
    skipSpace(cursor);
    yield* expect(cursor, ">", context);

    const value = yield* expandEntityValue(tables, cursor, literal);
    if (!tables.stopped && !tables.bound.has(key)) {
      (parameter ? tables.parameters : tables.entities).set(name, value);
    }
  } else {
    yield* skipExternalEntity(cursor, parameter);
  }

  tables.bound.add(key);
});

/**
 * Read an attribute's type: a keyword, `NOTATION` with its names, or an enumeration.
 *
 * @param cursor - The read position, at the type.
 * @returns The keyword, or the enumeration as written; fails when it is none of the types.
 */
const lexAttributeType = Effect.fnUntraced(function* lexAttributeTypeDeclaration(
  cursor: Cursor,
): Effect.fn.Return<string, WellFormednessError> {
  const context = "attribute-list declaration";
  const enumeration = consume(cursor, ENUMERATION);
  if (Option.isSome(enumeration)) {
    return enumeration.value;
  }

  const start = cursor.offset;
  const keyword = yield* readName(cursor, `${context}, attribute type`);
  if (!ATTRIBUTE_TYPES.has(keyword)) {
    return yield* failure(
      cursor,
      `${context}: "${keyword}" is not an attribute type; use CDATA, ID, IDREF, IDREFS, ENTITY, ENTITIES, NMTOKEN, NMTOKENS, NOTATION or an enumeration.`,
      start,
    );
  }

  if (keyword === "NOTATION") {
    yield* expectSpace(cursor, context);
    if (Option.isNone(consume(cursor, ENUMERATION))) {
      return yield* failure(
        cursor,
        `${context}: expected the parenthesized notation names, found ${found(cursor)}.`,
      );
    }
  }

  return keyword;
});

/**
 * Read an attribute's default declaration.
 *
 * @param cursor - The read position, at the default declaration.
 * @returns The default value, or `None` for `#REQUIRED` and `#IMPLIED`; fails when it is none of
 *   the four forms.
 */
const lexAttributeDefault = Effect.fnUntraced(function* lexAttributeDefaultDeclaration(
  tables: Tables,
  cursor: Cursor,
): Effect.fn.Return<Option.Option<string>, WellFormednessError | ReaderRefusal> {
  const context = "attribute-list declaration";
  if (take(cursor, "#REQUIRED") || take(cursor, "#IMPLIED")) {
    return Option.none();
  }

  if (take(cursor, "#FIXED")) {
    yield* expectSpace(cursor, context);
  } else if (cursor.text[cursor.offset] !== '"' && cursor.text[cursor.offset] !== "'") {
    return yield* failure(
      cursor,
      `${context}: expected "#REQUIRED", "#IMPLIED", "#FIXED" or a quoted default value, found ${found(cursor)}.`,
    );
  }

  return Option.some(yield* expandDefault(tables, cursor, yield* readQuoted(cursor, context)));
});

/**
 * Read an `<!ATTLIST>` declaration and table each attribute under its element, unless the element
 * already declares an attribute of that name.
 *
 * @param tables - The subset's declarations.
 * @param cursor - The read position, just after `<!ATTLIST`.
 * @returns Nothing; fails when the declaration is malformed.
 */
const lexAttlist = Effect.fnUntraced(function* lexAttlistDeclaration(
  tables: Tables,
  cursor: Cursor,
): Effect.fn.Return<void, WellFormednessError | ReaderRefusal> {
  const context = "attribute-list declaration";
  yield* expectSpace(cursor, context);

  const element = yield* readName(cursor, `${context}, element name`);
  for (;;) {
    const spaced = skipSpace(cursor);
    if (take(cursor, ">")) {
      return;
    }

    if (!spaced) {
      yield* failure(cursor, `${context}: expected white space or ">", found ${found(cursor)}.`);
    }

    const name = yield* readName(cursor, `${context}, attribute name`);
    yield* expectSpace(cursor, context);

    const type = yield* lexAttributeType(cursor);
    yield* expectSpace(cursor, context);

    const entry = { default: yield* lexAttributeDefault(tables, cursor), type };
    const attributes = tables.attlists.get(element) ?? new Map<string, AttlistEntry>();
    tables.attlists.set(element, attributes);
    if (!attributes.has(name)) {
      attributes.set(name, entry);
    }
  }
});

/**
 * Find the general entities that refer to themselves, directly or through others.
 *
 * A reference counts where the parser that follows would act on it, so one inside a comment, a
 * processing instruction or a CDATA section of a replacement text does not (XML 1.0 section 4.4,
 * well-formedness constraint "No Recursion").
 *
 * @param entities - The general entities by name, each as its replacement text.
 * @returns The names along the first cycle found, ending where it began, or `None`.
 */
const findCycle = (entities: ReadonlyMap<string, string>): Option.Option<readonly string[]> => {
  const cleared = new Set<string>();
  for (const root of entities.keys()) {
    if (cleared.has(root)) {
      continue;
    }

    const path: string[] = [root];
    const onPath = new Set<string>(path);
    const frames: Iterator<RegExpExecArray>[] = [
      (entities.get(root) ?? "").matchAll(REFERENCE_OR_HIDDEN),
    ];
    while (frames.length > 0) {
      const step = frames.at(-1)?.next();
      if (step === undefined || step.done === true) {
        frames.pop();

        const finished = path.pop();
        if (finished !== undefined) {
          onPath.delete(finished);
          cleared.add(finished);
        }

        continue;
      }

      const [, name] = step.value;
      if (name === undefined) {
        continue;
      }

      if (onPath.has(name)) {
        return Option.some([...path.slice(path.indexOf(name)), name]);
      }

      const replacement = entities.get(name);
      if (replacement !== undefined && !cleared.has(name)) {
        path.push(name);
        onPath.add(name);
        frames.push(replacement.matchAll(REFERENCE_OR_HIDDEN));
      }
    }
  }

  return Option.none();
};

/**
 * Read a `%name;` reference between the declarations of a subset.
 *
 * A parameter entity that was not read stops the subset unless the document is `standalone` (XML
 * 1.0 section 5.1).
 *
 * @param tables - The subset's declarations.
 * @param cursor - The read position, at the `%`.
 * @param active - The parameter entities whose replacement text is being lexed, so one that names
 *   itself through a `&#37;` is refused instead of looping.
 * @returns The name and replacement text of the parameter entity to lex as more of the subset, or
 *   `None` when it was not read or the subset has stopped; fails when the reference is malformed or
 *   the parameter entity refers to itself.
 */
const readParameterReference = Effect.fnUntraced(function* readParameterEntityReference(
  tables: Tables,
  cursor: Cursor,
  active: ReadonlySet<string>,
): Effect.fn.Return<
  Option.Option<{ name: string; replacement: string }>,
  WellFormednessError | ReaderRefusal
> {
  cursor.offset += "%".length;
  const name = yield* readName(cursor, "parameter-entity reference");
  yield* expect(cursor, ";", "parameter-entity reference");

  const replacement = tables.parameters.get(name);
  if (tables.stopped) {
    return Option.none();
  }

  if (replacement === undefined) {
    tables.stopped = !tables.standalone;

    return Option.none();
  }

  if (active.has(name)) {
    return yield* new ReaderRefusal({
      detail: `The parameter entity "${name}" refers to itself, which XML 1.0 forbids (well-formedness constraint "No Recursion"). Remove the reference from its replacement text.`,
      rule: "entity-cycle",
    });
  }

  return Option.some({ name, replacement });
});

/**
 * Read the keyword that follows `<!` in a markup declaration of the internal subset.
 *
 * @param cursor - The read position, at `<` of something that is not a comment or an instruction.
 * @returns The consumed `<!ENTITY`, `<!ATTLIST`, `<!ELEMENT` or `<!NOTATION`; fails when the text is
 *   none of them.
 */
const readDeclarationKeyword = Effect.fnUntraced(function* readSubsetDeclarationKeyword(
  cursor: Cursor,
): Effect.fn.Return<string, WellFormednessError> {
  const keyword = consume(cursor, DECLARATION_KEYWORD);
  if (Option.isNone(keyword)) {
    return yield* failure(
      cursor,
      `internal subset: expected a markup declaration, a comment, a processing instruction or a parameter-entity reference, found ${found(cursor)}.`,
    );
  }

  return keyword.value;
});

/**
 * Read one comment, processing instruction or markup declaration of the internal subset.
 *
 * `ELEMENT` and `NOTATION` declarations are skipped, and so is every `ENTITY` and `ATTLIST`
 * declaration after the subset stopped (XML 1.0 section 5.1).
 *
 * @param tables - The subset's declarations.
 * @param cursor - The read position, at a `<`.
 * @returns Nothing; fails when the markup is malformed.
 */
const lexMarkup = Effect.fnUntraced(function* lexSubsetMarkup(
  tables: Tables,
  cursor: Cursor,
): Effect.fn.Return<void, WellFormednessError | ReaderRefusal> {
  if (cursor.text.startsWith("<!--", cursor.offset)) {
    yield* skipComment(cursor);
  } else if (cursor.text.startsWith("<?", cursor.offset)) {
    yield* skipInstruction(cursor);
  } else {
    const keyword = yield* readDeclarationKeyword(cursor);
    if (tables.stopped || keyword.endsWith("ELEMENT") || keyword.endsWith("NOTATION")) {
      yield* skipDeclaration(cursor);
    } else if (keyword.endsWith("ENTITY")) {
      yield* lexEntity(tables, cursor);
    } else {
      yield* lexAttlist(tables, cursor);
    }
  }
});

/**
 * Read the markup of an internal subset up to its closing `]` or the end of the text, and the
 * markup of each parameter entity it uses between declarations.
 *
 * @param tables - The subset's declarations.
 * @param cursor - The read position, after `[` or at the start of a replacement text.
 * @param active - The parameter entities whose replacement text is being lexed.
 * @returns Nothing; the cursor rests at the `]` or the end.
 */
const lexSubset: (
  tables: Tables,
  cursor: Cursor,
  active: ReadonlySet<string>,
) => Effect.Effect<void, WellFormednessError | ReaderRefusal> = Effect.fnUntraced(
  function* lexSubsetRun(
    tables: Tables,
    cursor: Cursor,
    active: ReadonlySet<string>,
  ): Effect.fn.Return<void, WellFormednessError | ReaderRefusal> {
    for (;;) {
      skipSpace(cursor);

      const next = cursor.text[cursor.offset];
      if (next === undefined || next === "]") {
        return;
      }

      if (next === "%") {
        const start = cursor.offset;
        const used = yield* readParameterReference(tables, cursor, active);
        if (Option.isSome(used)) {
          const inside: Cursor = {
            anchor: Option.some(Option.getOrElse(cursor.anchor, () => start)),
            offset: 0,
            source: cursor.source,
            text: used.value.replacement,
          };
          yield* charge(
            tables.budget,
            used.value.replacement.length,
            active.size + 1,
            used.value.name,
          );
          yield* lexSubset(tables, inside, new Set([...active, used.value.name]));
          if (inside.offset < inside.text.length) {
            yield* failure(
              inside,
              `parameter-entity reference: the replacement text of "${used.value.name}" has ${found(inside)} where markup was expected.`,
            );
          }
        }
      } else {
        yield* lexMarkup(tables, cursor);
      }
    }
  },
);

/**
 * Read a `<!DOCTYPE>` declaration, its internal subset into `tables`.
 *
 * @param tables - The subset's declarations, filled as the subset is read.
 * @param cursor - The read position, at `<!DOCTYPE`.
 * @returns The declaration's text whole and whether it names an external identifier; fails when it
 *   is malformed.
 */
const lexDoctype = Effect.fnUntraced(function* lexDoctypeDeclaration(
  tables: Tables,
  cursor: Cursor,
): Effect.fn.Return<
  { doctype: string; externalSubset: boolean },
  WellFormednessError | ReaderRefusal
> {
  const context = "document type declaration";
  const start = cursor.offset;
  cursor.offset += "<!DOCTYPE".length;
  yield* expectSpace(cursor, context);
  yield* readName(cursor, context);
  skipSpace(cursor);

  const externalSubset = yield* skipExternalId(cursor, context);
  skipSpace(cursor);
  if (take(cursor, "[")) {
    yield* lexSubset(tables, cursor, new Set());
    yield* expect(cursor, "]", "internal subset");
    skipSpace(cursor);
  }

  yield* expect(cursor, ">", context);

  return { doctype: cursor.text.slice(start, cursor.offset), externalSubset };
});

/**
 * Read one pseudo-attribute of the XML declaration, `name="value"` or `name='value'`.
 *
 * @param cursor - The read position, after the previous pseudo-attribute.
 * @param name - The pseudo-attribute's name.
 * @returns The value as written, or `None` when the pseudo-attribute is absent; fails when it
 *   starts but is malformed.
 */
const lexPseudoAttribute = Effect.fnUntraced(function* lexPseudoAttributeDeclaration(
  cursor: Cursor,
  name: string,
): Effect.fn.Return<Option.Option<string>, WellFormednessError> {
  const context = "XML declaration";
  const before = cursor.offset;
  const spaced = skipSpace(cursor);
  if (!cursor.text.startsWith(name, cursor.offset)) {
    cursor.offset = before;

    return Option.none();
  }

  if (!spaced) {
    return yield* failure(cursor, `${context}: expected white space before "${name}".`);
  }

  cursor.offset += name.length;
  skipSpace(cursor);
  yield* expect(cursor, "=", context);
  skipSpace(cursor);

  const value = yield* readQuoted(cursor, `${context}, ${name}`);
  if (name === "standalone" && value.content !== "yes" && value.content !== "no") {
    return yield* failure(
      cursor,
      `${context}: standalone must be "yes" or "no", found ${JSON.stringify(value.content)}.`,
      value.start,
    );
  }

  return Option.some(value.content);
});

/**
 * Read the XML declaration when the text starts with one.
 *
 * `<?xml-stylesheet ...?>` and a declaration that is not first are processing instructions, not
 * declarations, and are left for the parser that follows.
 *
 * @param cursor - The read position, at the start of the text.
 * @returns The declaration's three fields as written, or `None`; fails when it is malformed.
 */
const lexDeclaration = Effect.fnUntraced(function* lexXmlDeclaration(
  cursor: Cursor,
): Effect.fn.Return<Option.Option<XmlDeclaration>, WellFormednessError> {
  if (!/^<\?xml[ \t\r\n]/u.test(cursor.text)) {
    return Option.none();
  }

  cursor.offset = "<?xml".length;
  const version = yield* lexPseudoAttribute(cursor, "version");
  if (Option.isNone(version)) {
    return yield* failure(cursor, `XML declaration: expected version, found ${found(cursor)}.`);
  }

  const encoding = yield* lexPseudoAttribute(cursor, "encoding");
  const standalone = yield* lexPseudoAttribute(cursor, "standalone");
  skipSpace(cursor);
  yield* expect(cursor, "?>", "XML declaration");

  return Option.some({ encoding, standalone, version: version.value });
});

/**
 * Advance past the white space, comments and processing instructions of the prolog.
 *
 * @param cursor - The read position.
 * @returns Nothing; fails when a comment or processing instruction is malformed.
 */
const skipMisc = Effect.fnUntraced(function* skipMiscMarkup(
  cursor: Cursor,
): Effect.fn.Return<void, WellFormednessError> {
  for (;;) {
    skipSpace(cursor);
    if (cursor.text.startsWith("<!--", cursor.offset)) {
      yield* skipComment(cursor);
    } else if (cursor.text.startsWith("<?", cursor.offset)) {
      yield* skipInstruction(cursor);
    } else {
      return;
    }
  }
});

/**
 * Lex the prolog of an XML document: the XML declaration, the document type declaration with its
 * internal subset, and where the body starts.
 *
 * Nothing after the document type declaration is read. The internal subset is read as XML 1.0
 * section 4.5 and 5.1 describe: entity values are expanded at declaration (a parameter-entity
 * reference inside one is refused, section 2.8), the first declaration of
 * a name binds, and reading stops at the first parameter-entity reference that was not read unless
 * the declaration says `standalone="yes"`. An external subset is recorded and never fetched.
 *
 * @param text - The decoded document text.
 * @returns The prolog; fails with a well-formedness error carrying the line and column of a
 *   malformed declaration or subset, or with a refusal under rule `entity-cycle` for a general
 *   entity that refers to itself.
 * @see {@link https://www.w3.org/TR/2008/REC-xml-20081126/#sec-prolog-dtd XML 1.0, section 2.8}
 * @see {@link https://www.w3.org/TR/2008/REC-xml-20081126/#intern-replacement XML 1.0, section 4.5}
 * @see {@link https://www.w3.org/TR/2008/REC-xml-20081126/#proc-types XML 1.0, section 5.1}
 */
export const lexProlog = Effect.fnUntraced(function* lexPrologText(
  text: string,
): Effect.fn.Return<Prolog, WellFormednessError | ReaderRefusal> {
  const cursor: Cursor = { anchor: Option.none(), offset: 0, source: text, text };
  const declaration = yield* lexDeclaration(cursor);
  const standalone = Option.exists(declaration, (read) => Option.contains(read.standalone, "yes"));
  const tables: Tables = {
    attlists: new Map(),
    bound: new Set(),
    budget: expansionBudget(text.length),
    entities: new Map(),
    parameters: new Map(),
    standalone,
    stopped: false,
  };
  yield* skipMisc(cursor);

  const doctype = text.startsWith("<!DOCTYPE", cursor.offset)
    ? Option.some(yield* lexDoctype(tables, cursor))
    : Option.none();
  const cycle = findCycle(tables.entities);
  if (Option.isSome(cycle)) {
    return yield* new ReaderRefusal({
      detail: `The general entity "${cycle.value[0]}" refers to itself (${cycle.value.join(" -> ")}), which XML 1.0 forbids (well-formedness constraint "No Recursion"). Remove one of the references from the internal subset.`,
      rule: "entity-cycle",
    });
  }

  return {
    attlists: tables.attlists,
    bodyStart: cursor.offset,
    declaration,
    doctype: doctype.pipe(Option.map((read) => read.doctype)),
    entities: tables.entities,
    expanded: tables.budget.expanded,
    externalSubset: Option.exists(doctype, (read) => read.externalSubset),
    standalone,
  };
});

/**
 * The document text with its general entities substituted, and the question `p1-09` asks of it.
 *
 * `body` is the whole text: the prolog and the DOCTYPE verbatim, then the body with each declared
 * entity reference replaced. `afterSubstitution` says whether a substitution precedes an offset
 * into `body`, so a reader knows when a line and column no longer match the source.
 */
export interface Substituted {
  readonly afterSubstitution: (offset: number) => boolean;
  readonly body: string;
}

/**
 * How a quote of replacement text is written inside an attribute value literal.
 */
const ATTRIBUTE_QUOTES: ReadonlyMap<string, string> = new Map([
  ['"', "&#34;"],
  ["'", "&#39;"],
]);

/**
 * A reference to a general entity, `&name;`, sticky.
 */
const REFERENCE_AT = new RegExp(`&(${NAME});`, "uy");

/**
 * Where a markup run that substitution does not touch ends: the end of a comment, a processing
 * instruction or a CDATA section that starts at `offset`, or `offset` itself when none does.
 */
const hiddenEnd = (text: string, offset: number): number => {
  for (const [open, close] of [
    ["<!--", "-->"],
    ["<?", "?>"],
    ["<![CDATA[", "]]>"],
  ] as const) {
    if (text.startsWith(open, offset)) {
      const end = text.indexOf(close, offset + open.length);

      return end === -1 ? text.length : end + close.length;
    }
  }

  return offset;
};

/**
 * One reference to a declared, non-predefined entity at `offset`: its replacement text and the
 * offset after its `;`, or none.
 */
const declaredReferenceAt = (
  text: string,
  offset: number,
  entities: ReadonlyMap<string, string>,
): Option.Option<{ readonly end: number; readonly name: string; readonly replacement: string }> => {
  REFERENCE_AT.lastIndex = offset;
  const match = REFERENCE_AT.exec(text);
  const name = match?.[1];
  if (match === null || name === undefined || PREDEFINED.has(name)) {
    return Option.none();
  }

  const replacement = entities.get(name);

  return replacement === undefined
    ? Option.none()
    : Option.some({ end: offset + match[0].length, name, replacement });
};

/**
 * Substitute the declared general entities of `prolog` into `text`.
 *
 * The prolog and the DOCTYPE stay verbatim at the front, so an offset into the result is an offset
 * into the text a parser reads. From `bodyStart` on, each reference to a declared entity other
 * than the five predefined ones is replaced, and the replacement text is rescanned: in element
 * content it goes in as written, so markup in it is parsed as markup; inside an attribute value
 * literal it goes in with both quotes written as character references, so it cannot end the
 * literal. Comments, processing instructions and CDATA sections, undeclared names and character
 * references are left as written. Each replacement text opened is charged against the budget the
 * prolog began, so nesting past `EXPANSION_DEPTH` or amplification past its limit is refused.
 *
 * @returns The substituted text; fails with a refusal under rule `entity-expansion` when the
 *   references open too much.
 * @see {@link https://www.w3.org/TR/2008/REC-xml-20081126/#entproc XML 1.0, section 4.4}
 */
export const substitute = (
  text: string,
  prolog: Prolog,
): Effect.Effect<Substituted, ReaderRefusal> =>
  Effect.suspend(() => {
    const { bodyStart, entities } = prolog;
    const budget = expansionBudget(text.length, prolog.expanded);
    const opened = { refusal: Option.none<ReaderRefusal>() };
    let first = Option.none<number>();
    let body = text.slice(0, bodyStart);
    const noteSubstitution = (length: number) => {
      if (Option.isNone(first)) {
        first = Option.some(length === 0 ? body.length : body.length + 1);
      }
    };

    const open = (length: number, depth: number, name: string): boolean => {
      opened.refusal = overBudget(budget, length, depth, name);

      return Option.isNone(opened.refusal);
    };

    const expandAttribute = (source: string, depth: number): string => {
      let result = "";
      let offset = 0;
      while (offset < source.length && Option.isNone(opened.refusal)) {
        const reference =
          source[offset] === "&" ? declaredReferenceAt(source, offset, entities) : Option.none();
        if (Option.isSome(reference)) {
          const { name, replacement } = reference.value;
          if (open(replacement.length, depth + 1, name)) {
            result += expandAttribute(replacement, depth + 1);
          }

          offset = reference.value.end;
        } else {
          const char = source[offset];
          result += ATTRIBUTE_QUOTES.get(char ?? "") ?? char;
          offset += 1;
        }
      }

      return result;
    };

    const scanTag = (source: string, start: number, depth: number): number => {
      let offset = start + 1;
      body += "<";
      while (offset < source.length && Option.isNone(opened.refusal)) {
        const char = source[offset];
        if (char === ">") {
          body += ">";

          return offset + 1;
        }

        if (char === '"' || char === "'") {
          body += char;
          offset += 1;
          while (
            offset < source.length &&
            source[offset] !== char &&
            Option.isNone(opened.refusal)
          ) {
            const reference =
              source[offset] === "&"
                ? declaredReferenceAt(source, offset, entities)
                : Option.none();
            if (Option.isSome(reference)) {
              const { name, replacement } = reference.value;
              noteSubstitution(replacement.length);
              if (open(replacement.length, depth + 1, name)) {
                body += expandAttribute(replacement, depth + 1);
              }

              offset = reference.value.end;
            } else {
              body += source[offset];
              offset += 1;
            }
          }
          if (offset < source.length) {
            body += char;
            offset += 1;
          }
        } else {
          body += char;
          offset += 1;
        }
      }

      return offset;
    };

    const scanContent = (source: string, depth: number): void => {
      let offset = 0;
      while (offset < source.length && Option.isNone(opened.refusal)) {
        const hidden = hiddenEnd(source, offset);
        if (hidden > offset) {
          body += source.slice(offset, hidden);
          offset = hidden;
        } else if (source[offset] === "<") {
          offset = scanTag(source, offset, depth);
        } else if (source[offset] === "&") {
          const reference = declaredReferenceAt(source, offset, entities);
          if (Option.isSome(reference)) {
            const { name, replacement } = reference.value;
            noteSubstitution(replacement.length);
            if (open(replacement.length, depth + 1, name)) {
              scanContent(replacement, depth + 1);
            }

            offset = reference.value.end;
          } else {
            body += "&";
            offset += 1;
          }
        } else {
          const next = source.slice(offset).search(/[<&]/u);
          const end = next === -1 ? source.length : offset + next;
          body += source.slice(offset, end);
          offset = end;
        }
      }
    };

    scanContent(text.slice(bodyStart), 0);

    if (Option.isSome(opened.refusal)) {
      return Effect.fail(opened.refusal.value);
    }

    return Effect.succeed({
      afterSubstitution: (offset: number) =>
        Option.exists(first, (threshold) => offset >= threshold),
      body,
    });
  });

/**
 * The translation of an XML Schema pattern facet's regular expression (Part 2, Appendix F) into a
 * JavaScript `v`-flag expression, for `xsi-facets.ts`. A pure module: an expression it does not
 * read, a block escape other than `\p{IsBasicLatin}` or a construct outside the grammar, has no
 * translation, and the caller leaves the type unjudged.
 */
import { Option } from "effect";
import { ncNameContinuation, ncNameStart } from "#pantry/schema/patterns.ts";

/**
 * The XML space characters, as `\s` stands for them in XML Schema's regular expressions.
 */
const xmlSpace = "\\x20\\t\\n\\r";

/**
 * The characters that need a backslash inside a `v`-flag character class.
 */
const classSpecials = /[()[\]{}/\-\\|&!#$%*+,.:;<=>?@^`~]/u;

/**
 * An XML Schema category or block escape body, as a `v`-flag class member, or `undefined` for a
 * block this translation does not read. Only `IsBasicLatin` is.
 */
const propertyOf = (negated: boolean, name: string): string | undefined => {
  if (name === "IsBasicLatin") {
    return negated ? "[^\\x00-\\x7F]" : "[\\x00-\\x7F]";
  }

  return /^[A-Z][a-z]?$/u.test(name) ? `\\${negated ? "P" : "p"}{${name}}` : undefined;
};

/**
 * One escape of XML Schema's regular expressions that stands for a set of characters, as a `v`-flag
 * class operand, or `undefined` when `letter` is not such an escape.
 */
const setEscape = (letter: string): string | undefined =>
  new Map([
    ["s", `[${xmlSpace}]`],
    ["S", `[^${xmlSpace}]`],
    ["i", `[${ncNameStart}:]`],
    ["I", `[^${ncNameStart}:]`],
    ["c", `[${ncNameContinuation}:]`],
    ["C", `[^${ncNameContinuation}:]`],
    ["d", "\\p{Nd}"],
    ["D", "\\P{Nd}"],
    ["w", "[^\\p{P}\\p{Z}\\p{C}]"],
    ["W", "[\\p{P}\\p{Z}\\p{C}]"],
  ]).get(letter);

/**
 * A single-character escape of XML Schema's regular expressions: the character it stands for.
 */
const characterEscape = (letter: string): string | undefined => {
  const control = new Map([
    ["n", "\n"],
    ["r", "\r"],
    ["t", "\t"],
  ]).get(letter);

  if (control !== undefined) {
    return control;
  }

  return "\\|.-^?*+{}()[]".includes(letter) ? letter : undefined;
};

/**
 * A character as a `v`-flag class member.
 */
const escapeInClass = (character: string): string =>
  classSpecials.test(character) ? `\\${character}` : character;

/**
 * A character as a `v`-flag expression atom.
 */
const escapeOutside = (character: string): string =>
  /[\\^$.|?*+()[\]{}/]/u.test(character) ? `\\${character}` : character;

/**
 * A reader of one XML Schema regular expression, which produces a JavaScript `v`-flag expression
 * from it.
 */
class PatternReader {
  position = 0;
  readonly source: string;

  constructor(source: string) {
    this.source = source;
  }

  /**
   * The character class that starts at `[`, or `undefined` when it holds something outside the
   * translation.
   */
  readClass(): string | undefined {
    this.position += 1;

    const negated = this.source[this.position] === "^";
    let members = "";
    let subtraction = "";

    if (negated) {
      this.position += 1;
    }

    for (;;) {
      const char = this.source[this.position];

      if (char === undefined) {
        return undefined;
      }

      if (char === "]") {
        this.position += 1;
        break;
      }

      if (char === "-" && this.source[this.position + 1] === "[") {
        this.position += 1;

        const inner = this.readClass();

        if (inner === undefined || this.source[this.position] !== "]") {
          return undefined;
        }

        subtraction = `--${inner}`;
        continue;
      }

      const member = this.readMember();

      if (member === undefined) {
        return undefined;
      }

      members += member;
    }

    const positive = `[${members}]`;

    if (negated) {
      return subtraction === "" ? `[^${members}]` : `[[^${members}]${subtraction}]`;
    }

    return subtraction === "" ? positive : `[${members}${subtraction}]`;
  }

  /**
   * One member of a class: a character, a range, or an escape that stands for a set.
   */
  readMember(): string | undefined {
    const first = this.readAtom();

    if (first === undefined) {
      return undefined;
    }

    if (
      first.character !== undefined &&
      this.source[this.position] === "-" &&
      this.source[this.position + 1] !== "]" &&
      this.source[this.position + 1] !== "["
    ) {
      this.position += 1;

      const last = this.readAtom();

      return last?.character === undefined
        ? undefined
        : `${escapeInClass(first.character)}-${escapeInClass(last.character)}`;
    }

    return (
      first.set ?? (first.character === undefined ? undefined : escapeInClass(first.character))
    );
  }

  /**
   * One character, or one escape, of a class: the character it is, or the set it stands for.
   */
  readAtom(): { readonly character?: string; readonly set?: string } | undefined {
    const char = this.source[this.position];

    if (char === undefined || char === "[") {
      return undefined;
    }

    this.position += 1;

    if (char !== "\\") {
      return { character: char };
    }

    return this.readEscape();
  }

  /**
   * The escape that follows a backslash.
   */
  readEscape(): { readonly character?: string; readonly set?: string } | undefined {
    const letter = this.source[this.position];

    if (letter === undefined) {
      return undefined;
    }

    this.position += 1;

    if (letter === "p" || letter === "P") {
      const close = this.source.indexOf("}", this.position);

      if (this.source[this.position] !== "{" || close === -1) {
        return undefined;
      }

      const set = propertyOf(letter === "P", this.source.slice(this.position + 1, close));

      this.position = close + 1;

      return set === undefined ? undefined : { set };
    }

    const set = setEscape(letter);

    if (set !== undefined) {
      return { set };
    }

    const character = characterEscape(letter);

    return character === undefined ? undefined : { character };
  }

  /**
   * The whole expression, or `undefined` when it holds something outside the translation.
   */
  readAll(): string | undefined {
    let out = "";

    while (this.position < this.source.length) {
      const char = this.source[this.position] ?? "";

      if (char === "[") {
        const set = this.readClass();

        if (set === undefined) {
          return undefined;
        }

        out += set;
      } else if (char === "\\") {
        this.position += 1;

        const atom = this.readEscape();

        if (atom === undefined) {
          return undefined;
        }

        out += atom.set ?? escapeOutside(atom.character ?? "");
      } else if (char === "{") {
        const close = this.source.indexOf("}", this.position);
        const body = this.source.slice(this.position + 1, close);

        if (close === -1 || !/^[0-9]+(?:,[0-9]*)?$/u.test(body)) {
          return undefined;
        }

        out += `{${body}}`;
        this.position = close + 1;
      } else {
        this.position += 1;

        if ("()|?*+".includes(char)) {
          out += char;
        } else {
          out += char === "." ? "[^\\n\\r]" : escapeOutside(char);
        }
      }
    }

    return out;
  }
}

/**
 * The compiled `v`-flag translation of an XML Schema pattern facet's regular expression, anchored
 * as the facet matches the whole value, or `undefined` when the expression holds a construct this
 * translation does not read. XML Schema's `.` is any character but a line end, `\s` is the four XML
 * space characters, `\i` and `\c` are the name start and name characters with the colon, and a
 * subtraction `[a-[b]]` is `[a--[b]]`.
 */
export const compilePattern = (source: string): RegExp | undefined => {
  const body = new PatternReader(source).readAll();
  const compile = Option.liftThrowable((text: string) => new RegExp(`^(?:${text})$`, "v"));

  return body === undefined ? undefined : Option.getOrUndefined(compile(body));
};

/**
 * Whether an element, or a value, is valid against a local type: XML Schema Part 1, Element Locally
 * Valid (Type), 3.3.4, and Part 2's String Valid, 3.14.4, for the types decision 222 reaches. A
 * type derived from the type an element is declared with is accepted when the element is valid
 * against it, the attributes the derived type adds are judged against its attribute uses and its
 * attribute wildcard (decision 227 (a)), and, on lax foreign content, a simple type that resolves
 * is judged the same way. A pure module over the tables of `seed/xsi.ts`; the `xsi:type` judge of
 * `xsi.ts` calls it and nothing else does.
 *
 * Two known model limits shape it, both stated for pantry and plate alike in reading 50 (decision
 * 227 while reading 50 is not on the base):
 *
 * - L-1: a complex `xsi:type` on lax foreign content is not checked against that type, because that
 *   needs a general XML Schema validator. `validLocal` is not called for it, and the caller accepts
 *   it unchecked.
 * - L-2: `xs:ENTITY` is not verified. The value must be an NCName, as `xs:NCName`, but whether it
 *   names an unparsed entity the DTD declares (String Valid clause 2.1, 3.14.4) is not checked,
 *   because this base reads no DTD declaration.
 *
 * L-3 (a simple type outside the judged lexical spaces) is gone: every built-in datatype of Part 2
 * is judged by its lexical space (decision 228, F-2). What a value is not checked for, and what
 * leaves a type unjudged (`covers` false, so `validValue` accepts it unchecked), is recorded here:
 *
 * - `xs:QName` and `xs:NOTATION` are judged by their lexical form, a QName. Whether the prefix is
 *   bound, and whether the notation is declared, depend on the namespace context of the value and
 *   on the schema's notations, which `validValue` is not given.
 * - A bound facet (`minInclusive` and the three others) on a date, time or duration type is not
 *   applied: those types are only partially ordered, and no schema document of the four sets states
 *   one. A type that states one is unjudged, as is one whose `enumeration` is on such a type.
 * - A pattern facet whose XML Schema regular expression this module's translation does not read (a
 *   block escape other than `\p{IsBasicLatin}`, or a construct outside the grammar) leaves its type
 *   unjudged.
 *
 * The tables hold no row for a built-in datatype's facets or lexical space, so each is written
 * here. A type is looked up in the table block of one schema set and version, as the document says
 * which it is; `covers`, which has no document, holds when every block that has the type judges it.
 * `xs:ID` uniqueness is the ID pass's, not `validValue`'s: only an element of simple type
 * `validLocal` judges also refuses an `xs:ID` the document already holds.
 */
import { Option } from "effect";
import type { Element } from "@qti-pie/crust/tree.ts";
import { collapse, replace } from "#pantry/import/tree.ts";
import type { WhiteSpace } from "#pantry/import/tree.ts";
import {
  anyUri,
  ncNameContinuation,
  ncNameStart,
  xsDecimal,
  xsDouble,
  xsInteger,
} from "#pantry/schema/patterns.ts";
import type { SchemaSetHandle } from "#pantry/schema/content/rosters.ts";
import type { SchemaVersionHandle } from "#pantry/schema/kinds/generic.ts";
import type {
  AttributeUseRow,
  GlobalAttributeTypeRow,
  ProcessContents,
  SimpleFacetRow,
  SimpleMemberRow,
  TypeAttributeWildcardRow,
  TypeDerivationRow,
  TypeKey,
} from "#pantry/schema/seed/xsi.ts";
import {
  attributeUse,
  globalAttributeType,
  simpleFacet,
  simpleMember,
  typeAttributeWildcard,
  typeDerivation,
  typeNamespaces,
} from "#pantry/schema/seed/xsi.ts";

/**
 * The namespace of the `xsi` attributes.
 */
const xsiNamespace = "http://www.w3.org/2001/XMLSchema-instance";

/**
 * The namespace an XML namespace declaration's attribute node is in.
 */
const xmlnsNamespace = "http://www.w3.org/2000/xmlns/";

/**
 * The four `xsi` attributes a simple type's element may carry (Element Locally Valid (Type), 3.3.4,
 * clause 3.1).
 */
const xsiNames: ReadonlySet<string> = new Set([
  "type",
  "nil",
  "schemaLocation",
  "noNamespaceSchemaLocation",
]);

/**
 * The key of a type: its expanded name, or the path of the declaration that holds it.
 */
const keyOf = (type: TypeKey): string =>
  "anonymous" in type ? `!${type.anonymous}` : `{${type.namespace}}${type.local}`;

/**
 * A type for a message.
 */
const describe = (type: TypeKey): string =>
  "anonymous" in type ? `the anonymous type ${type.anonymous}` : `{${type.namespace}}${type.local}`;

/**
 * Whether `type` is the XML Schema built-in `local`.
 */
const isBuiltin = (type: TypeKey, local: string): boolean =>
  "local" in type && type.namespace === typeNamespaces.xs && type.local === local;

/**
 * The key of an attribute or element name.
 */
const nameKey = (namespace: string, local: string): string => `{${namespace}}${local}`;

/**
 * The rows of one schema set and version, by type.
 */
interface Tables {
  readonly derivations: ReadonlyMap<string, TypeDerivationRow>;
  readonly facets: ReadonlyMap<string, readonly SimpleFacetRow[]>;
  readonly globals: ReadonlyMap<string, GlobalAttributeTypeRow>;
  readonly members: ReadonlyMap<string, readonly SimpleMemberRow[]>;
  readonly uses: ReadonlyMap<string, readonly AttributeUseRow[]>;
  readonly wildcards: ReadonlyMap<string, TypeAttributeWildcardRow>;
}

/**
 * The rows that belong to a schema set and version.
 */
interface Keyed {
  readonly set: SchemaSetHandle;
  readonly version: SchemaVersionHandle;
}

/**
 * Append `row` to the list `map` holds for `key`.
 */
const append = <A>(map: Map<string, A[]>, key: string, row: A): void => {
  const list = map.get(key);

  if (list === undefined) {
    map.set(key, [row]);
  } else {
    list.push(row);
  }
};

/**
 * The block of a schema set and version.
 */
const blockOf = (row: Keyed): string => `${row.set}/${row.version}`;

/**
 * The tables of every schema set and version, by `<set>/<version>`.
 */
const blocks: ReadonlyMap<string, Tables> = (() => {
  const names = new Set<string>(
    [...typeDerivation, ...attributeUse, ...simpleFacet, ...simpleMember].map(blockOf),
  );
  const built = new Map<string, Tables>();

  for (const name of names) {
    const here = (row: Keyed): boolean => blockOf(row) === name;
    const derivations = new Map<string, TypeDerivationRow>();
    const facets = new Map<string, SimpleFacetRow[]>();
    const globals = new Map<string, GlobalAttributeTypeRow>();
    const members = new Map<string, SimpleMemberRow[]>();
    const uses = new Map<string, AttributeUseRow[]>();
    const wildcards = new Map<string, TypeAttributeWildcardRow>();

    for (const row of typeDerivation.filter(here)) {
      derivations.set(keyOf(row.type), row);
    }

    for (const row of simpleFacet.filter(here)) {
      append(facets, keyOf(row.type), row);
    }

    for (const row of simpleMember.filter(here)) {
      append(members, keyOf(row.type), row);
    }

    for (const row of attributeUse.filter(here)) {
      append(uses, keyOf(row.type), row);
    }

    for (const row of typeAttributeWildcard.filter(here)) {
      wildcards.set(keyOf(row.type), row);
    }

    for (const row of globalAttributeType.filter(here)) {
      globals.set(nameKey(row.namespace, row.local), row);
    }

    for (const list of members.values()) {
      list.sort((left, right) => left.position - right.position);
    }

    built.set(name, { derivations, facets, globals, members, uses, wildcards });
  }

  return built;
})();

/**
 * The tables of a schema set and version, empty when the tables hold none.
 */
const tablesOf = (set: SchemaSetHandle, version: SchemaVersionHandle): Tables =>
  blocks.get(`${set}/${version}`) ?? {
    derivations: new Map(),
    facets: new Map(),
    globals: new Map(),
    members: new Map(),
    uses: new Map(),
    wildcards: new Map(),
  };

/**
 * XML's NCName production, with no length bound.
 */
const ncNameSource = `[${ncNameStart}][${ncNameContinuation}]*`;

/**
 * Part 2's `xs:language` pattern, with no bound on the number of subtags.
 */
const languagePattern = /^[a-zA-Z]{1,8}(?:-[a-zA-Z0-9]{1,8})*$/u;

/**
 * XML's NCName production, with no length bound.
 */
const ncNamePattern = new RegExp(`^${ncNameSource}$`, "u");

/**
 * XML's Name production, with no length bound.
 */
const namePattern = new RegExp(`^[${ncNameStart}:][${ncNameContinuation}:]*$`, "u");

/**
 * XML's Nmtoken production, with no length bound.
 */
const nmtokenPattern = new RegExp(`^[${ncNameContinuation}:]+$`, "u");

/**
 * Namespaces in XML's QName production, with no length bound.
 */
const qNamePattern = new RegExp(`^(?:${ncNameSource}:)?${ncNameSource}$`, "u");

/**
 * `xs:integer`'s lexical space.
 */
const integerPattern = new RegExp(xsInteger, "u");

/**
 * `xs:decimal`'s lexical space.
 */
const decimalPattern = new RegExp(xsDecimal, "u");

/**
 * `xs:float`'s and `xs:double`'s lexical space.
 */
const doublePattern = new RegExp(xsDouble, "u");

/**
 * `xs:anyURI`'s lexical space, as `patterns.anyUri` states it.
 */
const anyUriPattern = new RegExp(anyUri, "u");

/**
 * `xs:boolean`'s lexical space.
 */
const booleanPattern = /^(?:true|false|1|0)$/u;

/**
 * `xs:duration`'s lexical space (Part 2, 3.2.6.1): at least one component, and a `T` only before
 * at least one time component.
 */
const durationPattern =
  /^-?P(?=[0-9]|T[0-9])(?:[0-9]+Y)?(?:[0-9]+M)?(?:[0-9]+D)?(?:T(?=[0-9])(?:[0-9]+H)?(?:[0-9]+M)?(?:[0-9]+(?:\.[0-9]+)?S)?)?$/u;

/**
 * `xs:hexBinary`'s lexical space: an even number of hexadecimal digits.
 */
const hexBinaryPattern = /^(?:[0-9A-Fa-f]{2})*$/u;

/**
 * `xs:base64Binary`'s lexical space (Part 2, 3.2.16.1): the Base64Binary production, whose spaces
 * the collapse leaves single.
 */
const base64Pattern = (() => {
  const b64 = "[A-Za-z0-9+/]";
  const b16 = "[AEIMQUYcgkosw048]";
  const b04 = "[AQgw]";
  const s64 = `${b64} ?`;

  return new RegExp(
    `^(?:(?:${s64}){4})*(?:(?:${s64}){3}${b64}|(?:${s64}){2}${b16} ?=|${s64}${b04} ?= ?=)?$`,
    "u",
  );
})();

/**
 * The year of a date, with an optional sign: four or more digits, no leading zero past four.
 */
const yearSource = "(?<year>-?(?:[1-9][0-9]{3,}|0[0-9]{3}))";

/**
 * The time zone a date or time may end with: `Z`, or an offset of at most 14 hours.
 */
const zoneSource = "(?:Z|[+\\-](?:(?:0[0-9]|1[0-3]):[0-5][0-9]|14:00))?";

/**
 * The month, day and time parts of the date and time types, by group name.
 */
const monthSource = "(?<month>0[1-9]|1[0-2])";

const daySource = "(?<day>[0-9]{2})";

const timeSource =
  "(?<hour>[0-9]{2}):(?<minute>[0-9]{2}):(?<second>[0-9]{2})(?<fraction>\\.[0-9]+)?";

/**
 * Whether the Gregorian calendar year written `year` is a leap year. Year 1 BCE is `-0001`, which
 * is year 0 of the astronomical count.
 */
const isLeap = (year: string): boolean => {
  const count = BigInt(year);
  const astronomical = count < 0n ? count + 1n : count;

  return (astronomical % 4n === 0n && astronomical % 100n !== 0n) || astronomical % 400n === 0n;
};

/**
 * How many days the month has, 29 for February when `year` is absent.
 */
const daysIn = (month: number, year: string | undefined): number => {
  if (month === 2) {
    return year === undefined || isLeap(year) ? 29 : 28;
  }

  return [4, 6, 9, 11].includes(month) ? 30 : 31;
};

/**
 * What a date or time pattern's named groups say is wrong, or `null`: the year is not `0000`, the
 * day exists in the month, and the time is a time of day, `24:00:00` being the end of a day.
 */
const partsDetail = (groups: Readonly<Record<string, string | undefined>>): string | null => {
  const { day, fraction, hour, minute, month, second, year } = groups;

  if (year !== undefined && /^-?0000$/u.test(year)) {
    return "the year 0000 is not allowed";
  }

  if (day !== undefined) {
    const last = daysIn(month === undefined ? 12 : Number(month), month === undefined ? "0" : year);

    if (Number(day) < 1 || Number(day) > last) {
      return `the day ${day} does not exist in the month`;
    }
  }

  if (hour !== undefined) {
    const endOfDay =
      hour === "24" && minute === "00" && second === "00" && /^(?:\.0+)?$/u.test(fraction ?? "");

    if (!endOfDay && (Number(hour) > 23 || Number(minute) > 59 || Number(second) > 59)) {
      return "it is not a time of day";
    }
  }

  return null;
};

/**
 * The date and time datatypes of Part 2, 3.2.7 to 3.2.14, by local name, with their lexical form.
 * A year-less month and day (`gMonthDay`) takes 29 days in February, and `gDay` 31 days.
 */
const temporalPatterns: ReadonlyMap<string, RegExp> = new Map(
  [
    ["dateTime", `${yearSource}-${monthSource}-${daySource}T${timeSource}${zoneSource}`],
    ["date", `${yearSource}-${monthSource}-${daySource}${zoneSource}`],
    ["time", `${timeSource}${zoneSource}`],
    ["gYearMonth", `${yearSource}-${monthSource}${zoneSource}`],
    ["gYear", `${yearSource}${zoneSource}`],
    ["gMonthDay", `--${monthSource}-${daySource}${zoneSource}`],
    ["gDay", `---${daySource}${zoneSource}`],
    ["gMonth", `--${monthSource}${zoneSource}`],
  ].map(([local = "", source = ""]) => [local, new RegExp(`^${source}$`, "u")]),
);

/**
 * The first reason `text` is outside the lexical space of the date or time datatype `local`, or
 * `null`.
 */
const temporalDetail = (local: string, text: string): string | null => {
  const match = temporalPatterns.get(local)?.exec(text);

  if (match === null || match === undefined) {
    return `it is not a ${local}`;
  }

  return partsDetail(match.groups ?? {});
};

/**
 * The value range of each integer type of XML Schema Part 2, 3.3.13 to 3.3.25, inclusive on both
 * ends where one exists.
 */
const integerRanges: ReadonlyMap<string, { readonly max?: bigint; readonly min?: bigint }> =
  new Map([
    ["integer", {}],
    ["nonPositiveInteger", { max: 0n }],
    ["negativeInteger", { max: -1n }],
    ["long", { max: 2n ** 63n - 1n, min: -(2n ** 63n) }],
    ["int", { max: 2n ** 31n - 1n, min: -(2n ** 31n) }],
    ["short", { max: 32_767n, min: -32_768n }],
    ["byte", { max: 127n, min: -128n }],
    ["nonNegativeInteger", { min: 0n }],
    ["unsignedLong", { max: 2n ** 64n - 1n, min: 0n }],
    ["unsignedInt", { max: 2n ** 32n - 1n, min: 0n }],
    ["unsignedShort", { max: 65_535n, min: 0n }],
    ["unsignedByte", { max: 255n, min: 0n }],
    ["positiveInteger", { min: 1n }],
  ]);

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
const compilePattern = (source: string): RegExp | undefined => {
  const body = new PatternReader(source).readAll();
  const compile = Option.liftThrowable((text: string) => new RegExp(`^(?:${text})$`, "v"));

  return body === undefined ? undefined : Option.getOrUndefined(compile(body));
};

/**
 * The text of an element: its character data, with an undeclared entity reference as written.
 */
const textOf = (element: Element): string =>
  element.children
    .map((child) => {
      if (child.kind === "text") {
        return child.value;
      }

      return child.kind === "entityRef" ? `&${child.name};` : "";
    })
    .join("");

/**
 * The text stripped of its leading and trailing XML space characters.
 */
const trimXml = (text: string): string => text.replaceAll(/^[ \t\n\r]+|[ \t\n\r]+$/gu, "");

/**
 * The value space a facet is read in: which facets apply, and how two values compare.
 */
type Family =
  | "base64"
  | "boolean"
  | "decimal"
  | "float"
  | "hex"
  | "integer"
  | "list"
  | "string"
  | "temporal"
  | "union";

/**
 * What a check of a normalized value is given besides the value.
 */
interface Context {
  readonly ids: ReadonlySet<string>;
  /**
   * Whether an `xs:ID` the document already holds is refused.
   */
  readonly unique: boolean;
}

/**
 * A simple type this module judges completely: its value space, its whiteSpace and its check of a
 * value already normalized by that whiteSpace, `null` when the value is valid, else the reason it
 * is not.
 */
interface Judge {
  readonly check: (value: string, context: Context) => string | null;
  readonly family: Family;
  readonly whiteSpace: WhiteSpace;
}

/**
 * Apply a whiteSpace to a lexical value.
 */
const normalizeWith = (whiteSpace: WhiteSpace, text: string): string => {
  if (whiteSpace === "collapse") {
    return collapse(text);
  }

  return whiteSpace === "replace" ? replace(text) : text;
};

/**
 * The reason a lexical value is not valid for a judge, or `null`: normalize, then check.
 */
const judged = (judge: Judge, raw: string, context: Context): string | null =>
  judge.check(normalizeWith(judge.whiteSpace, raw), context);

/**
 * `null` when `text` matches `pattern`, else `reason`.
 */
const matching = (pattern: RegExp, text: string, reason: string): string | null =>
  pattern.test(text) ? null : reason;

/**
 * A judge of a built-in datatype that checks the lexical space only.
 */
const lexical = (
  family: Family,
  whiteSpace: WhiteSpace,
  check: (text: string, context: Context) => string | null,
): Judge => ({ check, family, whiteSpace });

/**
 * Why `text` is not an NCName, or `null`.
 */
const ncNameDetail = (text: string): string | null =>
  matching(ncNamePattern, text, "it is not an NCName");

/**
 * The judge of a list type whose items are judged by `item`.
 */
const listJudge = (item: Judge, minimumItems: number): Judge => ({
  check: (value, context) => {
    const items = value === "" ? [] : value.split(" ");

    if (items.length < minimumItems) {
      return "it has no item";
    }

    for (const [position, text] of items.entries()) {
      const detail = judged(item, text, context);

      if (detail !== null) {
        return `item ${position + 1} "${text}": ${detail}`;
      }
    }

    return null;
  },
  family: "list",
  whiteSpace: "collapse",
});

/**
 * The judge of a union type: valid for the first member that judges it valid.
 */
const unionJudge = (members: readonly Judge[]): Judge => ({
  check: (value, context) =>
    members.some((member) => judged(member, value, context) === null)
      ? null
      : "it is valid for none of the members of the union",
  family: "union",
  whiteSpace: "preserve",
});

/**
 * The built-in datatypes that are not integers, by local name, as judges. The lists are in
 * `builtinLists`.
 */
const plainBuiltins: ReadonlyMap<string, Judge> = new Map<string, Judge>([
  ["anySimpleType", lexical("string", "preserve", () => null)],
  ["string", lexical("string", "preserve", () => null)],
  ["normalizedString", lexical("string", "replace", () => null)],
  ["token", lexical("string", "collapse", () => null)],
  [
    "boolean",
    lexical("boolean", "collapse", (text) => matching(booleanPattern, text, "it is not a boolean")),
  ],
  [
    "decimal",
    lexical("decimal", "collapse", (text) => matching(decimalPattern, text, "it is not a decimal")),
  ],
  [
    "float",
    lexical("float", "collapse", (text) => matching(doublePattern, text, "it is not a float")),
  ],
  [
    "double",
    lexical("float", "collapse", (text) => matching(doublePattern, text, "it is not a double")),
  ],
  [
    "duration",
    lexical("temporal", "collapse", (text) =>
      matching(durationPattern, text, "it is not a duration"),
    ),
  ],
  ...[...temporalPatterns.keys()].map(
    (local) =>
      [local, lexical("temporal", "collapse", (text) => temporalDetail(local, text))] as const,
  ),
  [
    "hexBinary",
    lexical("hex", "collapse", (text) => matching(hexBinaryPattern, text, "it is not hexBinary")),
  ],
  [
    "base64Binary",
    lexical("base64", "collapse", (text) =>
      matching(base64Pattern, text, "it is not base64Binary"),
    ),
  ],
  [
    "anyURI",
    lexical("string", "collapse", (text) => matching(anyUriPattern, text, "it is not an anyURI")),
  ],
  [
    "QName",
    lexical("string", "collapse", (text) => matching(qNamePattern, text, "it is not a QName")),
  ],
  [
    "NOTATION",
    lexical("string", "collapse", (text) => matching(qNamePattern, text, "it is not a QName")),
  ],
  [
    "language",
    lexical("string", "collapse", (text) =>
      matching(languagePattern, text, "it is not a language tag"),
    ),
  ],
  [
    "Name",
    lexical("string", "collapse", (text) => matching(namePattern, text, "it is not an XML Name")),
  ],
  [
    "NMTOKEN",
    lexical("string", "collapse", (text) =>
      matching(nmtokenPattern, text, "it is not an XML Nmtoken"),
    ),
  ],
  ["NCName", lexical("string", "collapse", ncNameDetail)],
  ["ENTITY", lexical("string", "collapse", ncNameDetail)],
  [
    "ID",
    lexical(
      "string",
      "collapse",
      (text, { ids, unique }) =>
        ncNameDetail(text) ??
        (unique && ids.has(text) ? "the document already holds that ID" : null),
    ),
  ],
  [
    "IDREF",
    lexical(
      "string",
      "collapse",
      (text, { ids }) =>
        ncNameDetail(text) ?? (ids.has(text) ? null : "no element of the document has that ID"),
    ),
  ],
  ...[...integerRanges].map(
    ([local, range]) =>
      [
        local,
        lexical("integer", "collapse", (text) => {
          if (!integerPattern.test(text)) {
            return "it is not an integer";
          }

          const value = BigInt(text);

          return (range.min !== undefined && value < range.min) ||
            (range.max !== undefined && value > range.max)
            ? "it is outside the value range"
            : null;
        }),
      ] as const,
  ),
]);

/**
 * The three built-in list types, with the built-in type of their items.
 */
const builtinLists: ReadonlyMap<string, string> = new Map([
  ["ENTITIES", "ENTITY"],
  ["IDREFS", "IDREF"],
  ["NMTOKENS", "NMTOKEN"],
]);

/**
 * The judge of a built-in datatype of XML Schema Part 2, or `undefined` for a name that is none.
 */
const builtinJudge = (local: string): Judge | undefined => {
  const plain = plainBuiltins.get(local);
  const itemName = builtinLists.get(local);
  const item = itemName === undefined ? undefined : plainBuiltins.get(itemName);

  return plain ?? (item === undefined ? undefined : listJudge(item, 1));
};

/**
 * One check of a normalized value by a facet: `null` when it holds, else why not.
 */
type Check = (value: string) => string | null;

/**
 * The number of characters of a value, as XML Schema's `length` facets count them.
 */
const characters = (value: string): number => [...value.matchAll(/./gsu)].length;

/**
 * What `length`, `minLength` and `maxLength` count in a value of a family: the items of a list,
 * the octets of binary data, otherwise characters. `undefined` for a family they do not apply to.
 */
const measure = (family: Family): ((value: string) => number) | undefined => {
  if (family === "list") {
    return (value) => (value === "" ? 0 : value.split(" ").length);
  }

  if (family === "hex") {
    return (value) => value.length / 2;
  }

  if (family === "base64") {
    return (value) => {
      const digits = value.replaceAll(" ", "");
      const padding = /=*$/u.exec(digits)?.[0].length ?? 0;

      return (digits.length / 4) * 3 - padding;
    };
  }

  return family === "string" ? characters : undefined;
};

/**
 * The check of a `length`, `minLength` or `maxLength` facet.
 */
const lengthCheck = (
  facet: "length" | "maxLength" | "minLength",
  limit: number,
  count: (value: string) => number,
): Check => {
  if (facet === "length") {
    return (value) => (count(value) === limit ? null : `its length is not ${limit}`);
  }

  if (facet === "minLength") {
    return (value) => (count(value) >= limit ? null : `it is shorter than ${limit}`);
  }

  return (value) => (count(value) <= limit ? null : `it is longer than ${limit}`);
};

/**
 * A number of the value space of `xs:float` or `xs:double`, `xs:decimal` or `xs:integer` as a
 * JavaScript number: `INF` and `-INF` are infinite, and `NaN` is `NaN`, which no bound holds for.
 */
const numberOf = (text: string): number => {
  if (text === "INF") {
    return Number.POSITIVE_INFINITY;
  }

  return text === "-INF" ? Number.NEGATIVE_INFINITY : Number(text);
};

/**
 * The check of a bound facet, in the integer family by `BigInt` and in the others by `Number`.
 */
const boundCheck = (
  facet: "maxExclusive" | "maxInclusive" | "minExclusive" | "minInclusive",
  family: "decimal" | "float" | "integer",
  bound: string,
): Check | undefined => {
  if (family === "integer" && !integerPattern.test(bound)) {
    return undefined;
  }

  const holds = <A extends bigint | number>(value: A, limit: A): boolean => {
    if (facet === "minInclusive") {
      return value >= limit;
    }

    if (facet === "maxInclusive") {
      return value <= limit;
    }

    return facet === "minExclusive" ? value > limit : value < limit;
  };

  if (family === "integer") {
    const limit = BigInt(bound);

    return (value) => (holds(BigInt(value), limit) ? null : `it breaks ${facet} ${bound}`);
  }

  const limit = numberOf(bound);

  return (value) => (holds(numberOf(value), limit) ? null : `it breaks ${facet} ${bound}`);
};

/**
 * The significant digits of a decimal or integer lexical value: how many digits it has before and
 * after the decimal point once leading and trailing zeros are dropped.
 */
const digitsOf = (value: string) => {
  const [whole = "", part = ""] = value.replace(/^[+-]/u, "").split(".");
  const integer = whole.replace(/^0+/u, "");
  const fraction = part.replace(/0+$/u, "");

  return { fraction: fraction.length, total: Math.max(1, integer.length + fraction.length) };
};

/**
 * The check of `totalDigits` or `fractionDigits`.
 */
const digitsCheck =
  (facet: "fractionDigits" | "totalDigits", limit: number): Check =>
  (value) => {
    const digits = digitsOf(value);

    if (facet === "totalDigits") {
      return digits.total <= limit ? null : `it has more than ${limit} digits`;
    }

    return digits.fraction <= limit ? null : `it has more than ${limit} fraction digits`;
  };

/**
 * A value in the form two values of a family are compared in, or `undefined` for a family whose
 * values this module does not compare.
 */
const canonical = (family: Family, text: string): string | undefined => {
  if (family === "integer") {
    return integerPattern.test(text) ? BigInt(text).toString() : text;
  }

  if (family === "decimal") {
    const [whole = "", part = ""] = text.replace(/^[+-]/u, "").split(".");
    const integer = whole.replace(/^0+/u, "") || "0";
    const fraction = part.replace(/0+$/u, "");
    const sign = text.startsWith("-") && (integer !== "0" || fraction !== "") ? "-" : "";

    return `${sign}${integer}.${fraction}`;
  }

  if (family === "float") {
    const value = numberOf(text);

    return Number.isNaN(value) ? "NaN" : String(value === 0 ? 0 : value);
  }

  if (family === "boolean") {
    return text === "1" || text === "true" ? "true" : "false";
  }

  if (family === "hex") {
    return text.toUpperCase();
  }

  if (family === "base64") {
    return text.replaceAll(" ", "");
  }

  return family === "temporal" ? undefined : text;
};

/**
 * What the facets of one restriction add up to: checks of a normalized value, the patterns, of
 * which one must match, and the enumerated values, of which one must equal the value.
 */
interface Collected {
  readonly checks: Check[];
  readonly enumeration: string[];
  readonly patterns: RegExp[];
}

/**
 * Add one facet to what a restriction states, or return `false` when it is a facet this module does
 * not apply to the family.
 */
const addFacet = (
  into: Collected,
  { facet, value }: SimpleFacetRow,
  family: Family,
  whiteSpace: WhiteSpace,
): boolean => {
  const count = measure(family);

  if (facet === "whiteSpace") {
    return true;
  }

  if (facet === "enumeration") {
    const listed = canonical(family, normalizeWith(whiteSpace, value));

    if (listed !== undefined) {
      into.enumeration.push(listed);
    }

    return listed !== undefined;
  }

  if (facet === "pattern") {
    const pattern = compilePattern(value);

    if (pattern !== undefined) {
      into.patterns.push(pattern);
    }

    return pattern !== undefined;
  }

  if (facet === "length" || facet === "minLength" || facet === "maxLength") {
    if (count === undefined || Number.isNaN(Number(value))) {
      return false;
    }

    into.checks.push(lengthCheck(facet, Number(value), count));

    return true;
  }

  if (facet === "totalDigits" || facet === "fractionDigits") {
    if ((family !== "decimal" && family !== "integer") || Number.isNaN(Number(value))) {
      return false;
    }

    into.checks.push(digitsCheck(facet, Number(value)));

    return true;
  }

  const check =
    family === "decimal" || family === "float" || family === "integer"
      ? boundCheck(facet, family, normalizeWith(whiteSpace, value))
      : undefined;

  if (check !== undefined) {
    into.checks.push(check);
  }

  return check !== undefined;
};

/**
 * The checks that the facets one restriction states make of a normalized value of `family`, or
 * `undefined` when a facet is one this module does not apply to the family.
 */
const stepChecks = (
  rows: readonly SimpleFacetRow[],
  family: Family,
  whiteSpace: WhiteSpace,
): readonly Check[] | undefined => {
  const collected: Collected = { checks: [], enumeration: [], patterns: [] };

  if (!rows.every((row) => addFacet(collected, row, family, whiteSpace))) {
    return undefined;
  }

  const { checks, enumeration, patterns } = collected;

  if (enumeration.length > 0) {
    checks.push((value) =>
      enumeration.includes(canonical(family, value) ?? value)
        ? null
        : "it is none of the enumerated values",
    );
  }

  if (patterns.length > 0) {
    checks.push((value) =>
      patterns.some((pattern) => pattern.test(value)) ? null : "it matches no pattern",
    );
  }

  return checks;
};

/**
 * The judge of a restriction of the type `base` judges, by the facets the restriction states, or
 * `undefined` when one of them is not applied.
 */
const restrictedJudge = (base: Judge, rows: readonly SimpleFacetRow[]): Judge | undefined => {
  const stated = rows.find((row) => row.facet === "whiteSpace")?.value;
  const whiteSpace =
    stated === "preserve" || stated === "replace" || stated === "collapse"
      ? stated
      : base.whiteSpace;
  const checks = stepChecks(rows, base.family, whiteSpace);

  if (checks === undefined) {
    return undefined;
  }

  return {
    check: (value, context) => {
      const detail = base.check(value, context);

      if (detail !== null) {
        return detail;
      }

      for (const check of checks) {
        const found = check(value);

        if (found !== null) {
          return found;
        }
      }

      return null;
    },
    family: base.family,
    whiteSpace,
  };
};

/**
 * The judge of a simple type built from its derivation, the judges of the types it derives from
 * given by `judgeMember`.
 */
const judgeDerived = (
  tables: Tables,
  type: TypeKey,
  judgeMember: (member: TypeKey) => Judge | undefined,
): Judge | undefined => {
  if ("local" in type && type.namespace === typeNamespaces.xs) {
    return builtinJudge(type.local);
  }

  const key = keyOf(type);
  const row = tables.derivations.get(key);

  if (row === undefined || row.variety !== "simple") {
    return undefined;
  }

  const members = tables.members.get(key) ?? [];

  if (row.method === "restriction") {
    const base = judgeMember(row.base);

    return base === undefined ? undefined : restrictedJudge(base, tables.facets.get(key) ?? []);
  }

  if (row.method === "list") {
    const item = members[0] === undefined ? undefined : judgeMember(members[0].member);

    return item === undefined ? undefined : listJudge(item, 0);
  }

  const judgesOfMembers = members.map((member) => judgeMember(member.member));

  return members.length === 0 || judgesOfMembers.some((member) => member === undefined)
    ? undefined
    : unionJudge(judgesOfMembers.filter((member) => member !== undefined));
};

/**
 * The simple types already judged, by block and type key.
 */
const judges = new Map<string, Judge | undefined>();

/**
 * The judge of a simple type in a block, built from its derivation, or `undefined` when this module
 * cannot judge its values completely. `trail` holds the types on the way, so a derivation that
 * loops is unjudged.
 */
const judgeIn = (
  tables: Tables,
  block: string,
  type: TypeKey,
  trail: readonly string[] = [],
): Judge | undefined => {
  const key = keyOf(type);
  const cacheKey = `${block}\u0000${key}`;

  if (judges.has(cacheKey)) {
    return judges.get(cacheKey);
  }

  const judge = judgeDerived(tables, type, (member) =>
    trail.includes(keyOf(member)) ? undefined : judgeIn(tables, block, member, [...trail, key]),
  );

  judges.set(cacheKey, judge);

  return judge;
};

/**
 * Whether a block holds a type: XML Schema's own are in every block.
 */
const holds = (tables: Tables, type: TypeKey): boolean =>
  ("local" in type && type.namespace === typeNamespaces.xs) || tables.derivations.has(keyOf(type));

/**
 * Whether this module judges a simple type's values completely: every built-in datatype of XML
 * Schema Part 2 and every simple type derived from one by restriction, list or union whose facets
 * it applies, in every schema set and version that holds the type. `validValue` accepts a value of
 * any other type unchecked, and `validLocal` checks the attributes and children of an element of
 * one and accepts its value unchecked.
 *
 * @param type - The type.
 * @returns Whether `validValue` checks a value of `type`.
 */
export const covers = (type: TypeKey): boolean => {
  const present = [...blocks].filter(([, tables]) => holds(tables, type));

  return (
    present.length > 0 &&
    present.every(([block, tables]) => judgeIn(tables, block, type) !== undefined)
  );
};

/**
 * The detail of a value that is not in a simple type's value space, naming the clause.
 */
const valueDetail = (value: string, type: TypeKey, reason: string, clause: string): string =>
  `${clause}: the value "${value}" is not valid for ${describe(type)}: ${reason} (XML Schema Part 1, 3.14.4, String Valid)`;

/**
 * The reason `value` is outside the value space of `type` in a block, or `null` when it is inside
 * or when `type` is not judged.
 */
const valueReason = (
  value: string,
  type: TypeKey,
  set: SchemaSetHandle,
  version: SchemaVersionHandle,
  context: Context,
): string | null => {
  const block = `${set}/${version}`;
  const judge = judgeIn(tablesOf(set, version), block, type);

  return judge === undefined ? null : judged(judge, value, context);
};

/**
 * Whether `value` is in the value space of the simple type `type` (XML Schema Part 2, and Part 1,
 * String Valid, 3.14.4), after the type's whiteSpace normalizes it: the lexical space of the
 * primitive type at the root of the derivation, then every facet along it, nearest first. A list
 * has each item judged by its item type, and a union is valid when a member judges it valid. A
 * value of a type `covers` is false for, and of a complex type, is accepted unchecked.
 *
 * @param value - The lexical value, as written.
 * @param type - The simple type.
 * @param set - The schema set whose tables hold `type`.
 * @param version - The schema version.
 * @param ids - The ID values the document holds, for `xs:IDREF`.
 * @returns `None` when the value is valid, else a detail naming the clause it breaks.
 */
export const validValue = (
  value: string,
  type: TypeKey,
  set: SchemaSetHandle,
  version: SchemaVersionHandle,
  ids: ReadonlySet<string>,
): Option.Option<string> => {
  const reason = valueReason(value, type, set, version, { ids, unique: false });

  return Option.fromNullishOr(
    reason === null
      ? null
      : valueDetail(value, type, reason, "XML Schema Part 1, 3.2.4, Attribute Locally Valid"),
  );
};

/**
 * The detail of Element Locally Valid (Type), clause 3, that `element` breaks as a simple type's,
 * or `null` when its attributes and children are the ones clause 3 allows.
 */
const simpleContentDetail = (element: Element, type: TypeKey): string | null => {
  const stray = element.attributes.find(
    (attribute) =>
      attribute.namespace !== xmlnsNamespace &&
      !(attribute.namespace === xsiNamespace && xsiNames.has(attribute.local)),
  );

  if (stray !== undefined) {
    return `XML Schema Part 1, 3.3.4, Element Locally Valid (Type) clause 3.1: the element of simple type ${describe(type)} carries the attribute ${stray.qname}`;
  }

  if (element.children.some((child) => child.kind === "element")) {
    return `XML Schema Part 1, 3.3.4, Element Locally Valid (Type) clause 3.2: the element of simple type ${describe(type)} has an element child`;
  }

  return null;
};

/**
 * The detail of Element Locally Valid (Complex Type), clause 4, when `element` lacks an attribute
 * `type` requires and `declared` does not hold, else `null`.
 */
const complexUseDetail = (
  tables: Tables,
  element: Element,
  type: TypeKey,
  declared: TypeKey | undefined,
): string | null => {
  const own = new Set(
    (declared === undefined ? [] : (tables.uses.get(keyOf(declared)) ?? [])).map((use) =>
      nameKey(use.namespace, use.local),
    ),
  );
  const missing = (tables.uses.get(keyOf(type)) ?? []).find(
    (use) =>
      use.required &&
      !own.has(nameKey(use.namespace, use.local)) &&
      !element.attributes.some(
        (attribute) => attribute.namespace === use.namespace && attribute.local === use.local,
      ),
  );

  return missing === undefined
    ? null
    : `XML Schema Part 1, 3.4.4, Element Locally Valid (Complex Type) clause 4: the element lacks the attribute ${missing.local} that type ${describe(type)} requires`;
};

/**
 * What admits an attribute a derived complex type adds: one of its attribute uses, with the type of
 * the attribute's value, or its attribute wildcard, with how the wildcard processes what it admits.
 */
export type AddedBy =
  | { readonly attributeType: TypeKey; readonly kind: "use" }
  | { readonly kind: "wildcard"; readonly process: ProcessContents };

/**
 * An attribute a derived complex type adds to the element, as it is written.
 */
export interface AddedAttribute {
  readonly by: AddedBy;
  readonly local: string;
  readonly namespace: string;
  readonly prefix: string;
  readonly value: string;
}

/**
 * Whether an attribute wildcard's namespace constraint admits a namespace (Part 1, 3.10.4):
 * `##any`, `##other` (a namespace that is present and not the target), or a list, whose
 * `##targetNamespace` is the target and `##local` is no namespace.
 */
const wildcardAdmits = (wildcard: TypeAttributeWildcardRow, namespace: string): boolean => {
  if (wildcard.namespaces === "##any") {
    return true;
  }

  if (wildcard.namespaces === "##other") {
    return namespace !== "" && namespace !== wildcard.target;
  }

  return wildcard.namespaces.split(/\s+/u).some((token) => {
    if (token === "##targetNamespace") {
      return namespace === wildcard.target;
    }

    return token === "##local" ? namespace === "" : token === namespace;
  });
};

/**
 * The added attributes of an element, in a block's tables.
 */
const addedIn = (
  tables: Tables,
  element: Element,
  type: TypeKey,
  declared: TypeKey | undefined,
): readonly AddedAttribute[] => {
  const held = new Set(
    (declared === undefined ? [] : (tables.uses.get(keyOf(declared)) ?? [])).map((use) =>
      nameKey(use.namespace, use.local),
    ),
  );
  const uses = tables.uses.get(keyOf(type)) ?? [];
  const wildcard = tables.wildcards.get(keyOf(type));
  const added: AddedAttribute[] = [];

  for (const attribute of element.attributes) {
    const { local, namespace, prefix, value } = attribute;
    const use = uses.find(
      (candidate) => candidate.namespace === namespace && candidate.local === local,
    );
    const written = { local, namespace, prefix, value };

    if (
      namespace === xmlnsNamespace ||
      (namespace === xsiNamespace && xsiNames.has(local)) ||
      held.has(nameKey(namespace, local))
    ) {
      continue;
    }

    if (use !== undefined) {
      added.push({ ...written, by: { attributeType: use.attributeType, kind: "use" } });
    } else if (wildcard !== undefined && wildcardAdmits(wildcard, namespace)) {
      added.push({ ...written, by: { kind: "wildcard", process: wildcard.process } });
    }
  }

  return added;
};

/**
 * The attributes of `element` that a complex `type` derived from `declared` adds: every attribute
 * but namespace declarations, the four `xsi` names declared in every schema and the attribute uses
 * `declared` holds, that an attribute use of `type` admits (`by` `use`) or, failing that, `type`'s
 * attribute wildcard admits (`by` `wildcard`). An attribute neither admits is left out, for the
 * tree walk to refuse.
 *
 * @param element - The element.
 * @param type - The complex type its `xsi:type` names.
 * @param declared - The type the element is declared with, or `undefined`.
 * @param set - The schema set.
 * @param version - The schema version.
 * @returns The added attributes, in document order.
 */
export const addedAttributes = (
  element: Element,
  type: TypeKey,
  declared: TypeKey | undefined,
  set: SchemaSetHandle,
  version: SchemaVersionHandle,
): readonly AddedAttribute[] => {
  const tables = tablesOf(set, version);

  return addedIn(tables, element, type, declared);
};

/**
 * The detail of Attribute Locally Valid (3.2.4) that one added attribute breaks, or `null`: by a
 * use, its value must be valid for the use's type; by a wildcard under `lax`, for the global
 * declaration's type when the set has one and otherwise it is accepted (not assessed, 3.10.4);
 * under `skip` it is accepted, and under `strict` it must have a declaration and be valid for it.
 */
const addedDetail = (
  attribute: AddedAttribute,
  tables: Tables,
  set: SchemaSetHandle,
  version: SchemaVersionHandle,
  type: TypeKey,
  ids: ReadonlySet<string>,
): string | null => {
  const clause = `XML Schema Part 1, 3.4.4, Element Locally Valid (Complex Type) clause 3, the attribute ${nameKey(attribute.namespace, attribute.local)} of type ${describe(type)}`;
  const context = { ids, unique: false };
  const { by } = attribute;

  if (by.kind === "use") {
    const reason = valueReason(attribute.value, by.attributeType, set, version, context);

    return reason === null ? null : valueDetail(attribute.value, by.attributeType, reason, clause);
  }

  if (by.process === "skip") {
    return null;
  }

  const declaration = tables.globals.get(nameKey(attribute.namespace, attribute.local));

  if (declaration === undefined) {
    return by.process === "strict"
      ? `${clause}: the attribute wildcard is strict and no global attribute declaration names it`
      : null;
  }

  const reason = valueReason(attribute.value, declaration.type, set, version, context);

  return reason === null ? null : valueDetail(attribute.value, declaration.type, reason, clause);
};

/**
 * The detail of a complex type's attribute rules that `element` breaks, or `null`.
 */
const complexDetail = (
  tables: Tables,
  element: Element,
  type: TypeKey,
  declared: TypeKey | undefined,
  set: SchemaSetHandle,
  version: SchemaVersionHandle,
  ids: ReadonlySet<string>,
): string | null => {
  const missing = complexUseDetail(tables, element, type, declared);

  if (missing !== null) {
    return missing;
  }

  for (const attribute of addedIn(tables, element, type, declared)) {
    const detail = addedDetail(attribute, tables, set, version, type, ids);

    if (detail !== null) {
      return detail;
    }
  }

  return null;
};

/**
 * Whether `element` is valid against `type`, the type its `xsi:type` names (XML Schema Part 1,
 * 3.3.4, Element Locally Valid (Type)).
 *
 * `xs:anyType` is valid. A simple type allows no attribute but the four `xsi` ones and no element
 * child, and, when `covers(type)`, its text, trimmed and normalized by the type's `whiteSpace`,
 * must be in its value space (an `xs:ID` the document already holds is refused). A complex type
 * derived from `declared` has the content type of `declared`, which the kind's own content check
 * judges, so what is checked here is the attributes: each one `type` requires and `declared` does
 * not hold is present, and each one `addedAttributes` finds is valid (clause 3, Attribute Locally
 * Valid, 3.2.4): by an attribute use, valid for its type; by a wildcard under `lax`, valid for the
 * global declaration the set holds, and under `strict` there must be one.
 *
 * @param element - The element.
 * @param type - The type its `xsi:type` names, resolved by the caller.
 * @param declared - The type the element is declared with, or `undefined`.
 * @param set - The schema set whose tables hold the types.
 * @param version - The schema version.
 * @param ids - The ID values the document holds, for `xs:ID` and `xs:IDREF`.
 * @returns `None` when the element is valid, else a detail naming the clause it breaks.
 */
export const validLocal = (
  element: Element,
  type: TypeKey,
  declared: TypeKey | undefined,
  set: SchemaSetHandle,
  version: SchemaVersionHandle,
  ids: ReadonlySet<string>,
): Option.Option<string> => {
  if (isBuiltin(type, "anyType")) {
    return Option.none();
  }

  const tables = tablesOf(set, version);
  const variety = isBuiltin(type, "anySimpleType")
    ? "simple"
    : tables.derivations.get(keyOf(type))?.variety;

  if (variety === "complex") {
    return Option.fromNullishOr(complexDetail(tables, element, type, declared, set, version, ids));
  }

  const judge = variety === "simple" ? judgeIn(tables, `${set}/${version}`, type) : undefined;
  const content = variety === "simple" ? simpleContentDetail(element, type) : null;

  if (content !== null || judge === undefined) {
    return Option.fromNullishOr(content);
  }

  const value = trimXml(textOf(element));
  const reason = judged(judge, value, { ids, unique: true });

  return Option.fromNullishOr(
    reason === null
      ? null
      : valueDetail(
          normalizeWith(judge.whiteSpace, value),
          type,
          reason,
          "XML Schema Part 1, 3.3.4, Element Locally Valid (Type) clause 3.3",
        ),
  );
};

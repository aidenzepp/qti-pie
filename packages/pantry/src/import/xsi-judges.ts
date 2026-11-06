/**
 * The judges of the built-in datatypes of XML Schema Part 2 and of the list and union types built
 * from them: what a simple type is checked with, its value space (`Family`), its whiteSpace and its
 * check of a value that whiteSpace has normalized. `xsi-facets.ts` restricts a judge by facets and
 * `xsi-types.ts` builds one for each type of the tables. A pure module.
 */
import { collapse, replace } from "#pantry/import/whitespace.ts";
import type { WhiteSpace } from "#pantry/import/whitespace.ts";
import {
  anyUriPattern,
  base64Pattern,
  booleanPattern,
  decimalPattern,
  doublePattern,
  durationPattern,
  hexBinaryPattern,
  integerPattern,
  integerRanges,
  languagePattern,
  namePattern,
  ncNamePattern,
  nmtokenPattern,
  qNamePattern,
  temporalDetail,
  temporalPatterns,
} from "#pantry/import/xsi-lexical.ts";

/**
 * The value space a facet is read in: which facets apply, and how two values compare.
 */
export type Family =
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
export interface Context {
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
export interface Judge {
  readonly check: (value: string, context: Context) => string | null;
  readonly family: Family;
  readonly whiteSpace: WhiteSpace;
}

/**
 * Apply a whiteSpace to a lexical value.
 */
export const normalizeWith = (whiteSpace: WhiteSpace, text: string): string => {
  if (whiteSpace === "collapse") {
    return collapse(text);
  }

  return whiteSpace === "replace" ? replace(text) : text;
};

/**
 * The reason a lexical value is not valid for a judge, or `null`: normalize, then check.
 */
export const judged = (judge: Judge, raw: string, context: Context): string | null =>
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
export const listJudge = (item: Judge, minimumItems: number): Judge => ({
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
export const unionJudge = (members: readonly Judge[]): Judge => ({
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
export const builtinJudge = (local: string): Judge | undefined => {
  const plain = plainBuiltins.get(local);
  const itemName = builtinLists.get(local);
  const item = itemName === undefined ? undefined : plainBuiltins.get(itemName);

  return plain ?? (item === undefined ? undefined : listJudge(item, 1));
};

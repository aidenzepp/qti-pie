/**
 * The lexical forms of QTI's base types as a value's text writes them (lane OL), for the law
 * oracle's producers of `Typed value` and `Literal lexical`: the one language per base type the
 * schema judges a `qti-value`'s and a `qti-base-value`'s text by (`#pantry/qti/expression-types.ts`
 * `BaseTypePattern`), restated from its sources.
 *
 * - Integer, float and duration, identifier and uri: the value domains the grammar compiles for
 *   `xs:integer` (reading 45), `xs:double` (§8.13: durations "are represented using the
 *   'xsd:double' datatype"), `IdentifierDType` and `xs:anyURI` (reading 71), each absorbing the
 *   whitespace its type collapses;
 * - Boolean: `true` or `false` (reading 34), outer whitespace formatting (reading 7);
 * - Point: two integers, one whitespace character between them (§8.13);
 * - Pair and directed pair: two NCNames, one whitespace character between them (§8.13);
 * - String, file and the null object none: any text (reading 7: a string's whitespace is its
 *   value's).
 */
import { Result } from "effect";
import type { ComposedGrammar } from "#pantry/grammar/compose.ts";
import { compile, patternFlags } from "#pantry/grammar/domains.ts";
import { builtinDomainOf } from "#pantry/vocab/derive/domains.ts";

/**
 * An NCName's first character: XML 1.0's `NameStartChar` without the colon, as a class body.
 *
 * @see {@link https://www.w3.org/TR/xml/#NT-NameStartChar | XML 1.0, NameStartChar}
 */
const ncStart =
  "A-Z_a-z\\u{C0}-\\u{D6}\\u{D8}-\\u{F6}\\u{F8}-\\u{2FF}\\u{370}-\\u{37D}\\u{37F}-\\u{1FFF}\\u{200C}-\\u{200D}\\u{2070}-\\u{218F}\\u{2C00}-\\u{2FEF}\\u{3001}-\\u{D7FF}\\u{F900}-\\u{FDCF}\\u{FDF0}-\\u{FFFD}\\u{10000}-\\u{EFFFF}";

/**
 * An NCName's later characters: XML 1.0's `NameChar` without the colon.
 *
 * @see {@link https://www.w3.org/TR/xml/#NT-NameChar | XML 1.0, NameChar}
 */
const ncChar = `\\-.0-9\\u{B7}\\u{300}-\\u{36F}\\u{203F}-\\u{2040}${ncStart}`;

/**
 * The patterns of the base types no value domain states.
 */
const ownPatterns: ReadonlyMap<string, string> = new Map([
  ["boolean", "^[\\t\\n\\r ]*(?:true|false)[\\t\\n\\r ]*$"],
  [
    "directedPair",
    `^[\\t\\n\\r ]*[${ncStart}][${ncChar}]*[\\t\\n\\r ][${ncStart}][${ncChar}]*[\\t\\n\\r ]*$`,
  ],
  [
    "pair",
    `^[\\t\\n\\r ]*[${ncStart}][${ncChar}]*[\\t\\n\\r ][${ncStart}][${ncChar}]*[\\t\\n\\r ]*$`,
  ],
  ["point", "^[\\t\\n\\r ]*[+\\-]?[0-9]+[\\t\\n\\r ][+\\-]?[0-9]+[\\t\\n\\r ]*$"],
]);

/**
 * The value domain whose pattern each base type's values take.
 */
const domainOf: ReadonlyMap<string, string> = new Map([
  ["duration", "xs:double"],
  ["float", "xs:double"],
  ["identifier", "IdentifierDType"],
  ["integer", "xs:integer"],
  ["uri", "xs:anyURI"],
]);

/**
 * The compiled language of each base type, by grammar.
 */
const languages = new WeakMap<ComposedGrammar, ReadonlyMap<string, RegExp>>();

/**
 * Compile each judged base type's language over a grammar's value domains, once.
 *
 * @param grammar - The composed grammar.
 * @returns Each base type's pattern; a base type absent here holds any text.
 * @throws {Error} When the grammar compiles none of the domains {@link domainOf} names, a vocabulary
 *   defect.
 */
const languagesOf = (grammar: ComposedGrammar): ReadonlyMap<string, RegExp> => {
  const known = languages.get(grammar);
  if (known !== undefined) {
    return known;
  }

  const compiled = new Map<string, RegExp>(
    [...ownPatterns].map(([baseType, pattern]) => [baseType, new RegExp(pattern, "u")]),
  );
  for (const [baseType, handle] of domainOf) {
    const domain = grammar.attributes.domains.find((held) => held.handle === handle);
    if (domain === undefined) {
      throw new Error(
        `The grammar compiles no value domain ${handle}, the domain of a ${baseType} value. Compose a grammar that holds it.`,
      );
    }

    compiled.set(baseType, new RegExp(domain.pattern, patternFlags));
  }

  languages.set(grammar, compiled);

  return compiled;
};

/**
 * Decide whether a value's text is a lexical form of its base type.
 *
 * @param grammar - The composed grammar.
 * @param baseType - The base type.
 * @param text - The text, as its element's string value writes it.
 * @returns Whether it is one; a base type with no language, string, file or none, holds any text.
 */
export const typedValueHolds = (
  grammar: ComposedGrammar,
  baseType: string,
  text: string,
): boolean => languagesOf(grammar).get(baseType)?.test(text) ?? true;

/**
 * An NCName, `xs:NCName` as the value domains compile it: the name a bare variable reference
 * spells once collapsed (Namespaces in XML 1.0, §3).
 */
export const ncNameForm = new RegExp(
  Result.getOrThrowWith(
    Result.flatMap(builtinDomainOf("NCName"), (domain) => compile(domain, "exact")),
    (unread) => unread,
  ).pattern,
  patternFlags,
);

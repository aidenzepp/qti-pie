/**
 * The codec reads a QName's whitespace as XML Schema's `collapse` does and as nothing else does:
 * the host's {@link collapse}, the law oracle's two collapses and a literal statement of XML's
 * white space agree on every text of a box, and both sites that read a QName through the host's
 * collapse, {@link unboundPrefixesOf} and shred's `xsi:type`, read each text of the box as the
 * stated collapse gives it.
 *
 * Oracle: the specification as a checker. XML 1.0 (Fifth Edition), production [3]: `S ::= (#x20 |
 * #x9 | #xD | #xA)+`. XSD 1.1 Part 2, §4.3.6: "replace: All occurrences of #x9 (tab), #xA (line
 * feed) and #xD (carriage return) are replaced with #x20 (space)"; "collapse: After the processing
 * implied by replace, contiguous sequences of #x20's are collapsed to a single #x20, and any #x20
 * at the start or end of the string is then removed." No other character is white space to either,
 * so a no-break space (U+00A0), an ideographic space (U+3000) and a byte order mark (U+FEFF), each
 * of which `String.prototype.trim` strips, stay; and a QName padded with one is no QName.
 *
 * Bound: every text of length 0 to 4 over {@link alphabet}, 22,621 texts: XML's four white space
 * characters, the characters a QName is made of (a letter, the colon, a letter outside ASCII), the
 * characters `trim` takes for white space and XML does not (U+00A0, U+3000, U+FEFF), one neither
 * takes for it (U+0085, NEL, which XML 1.1 alone ends a line with), and one that is no name
 * character (`?`). The shortest text `trim` misreads is one character long, and the shortest padded
 * QName with a prefix four, so the box holds both.
 */
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { array, element, map } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Option, Result } from "effect";
import { readXml } from "@qti-pie/crust/read.ts";
import { composed } from "#pantry/grammar/compose.ts";
import { collapse, qNamePartsOf, unboundPrefixesOf } from "#pantry/grammar/domains.ts";
import { shredGrammarOf } from "#pantry/model/composed.ts";
import { shred } from "#pantry/model/shred.ts";
import { collapsed } from "#pantry/test/oracle-view.ts";
import { oracleValueOf } from "#pantry/test/resolution.ts";
import { xsiNamespace } from "#pantry/vocab/namespaces.ts";

/**
 * The characters the box draws on, each once.
 */
const alphabet = [
  " ",
  "\t",
  "\n",
  "\r",
  "a",
  ":",
  "é",
  "\u0085",
  "\u00A0",
  "\u3000",
  "\uFEFF",
  "?",
] as const;

/**
 * Every text over {@link alphabet} of length 0 to a bound.
 *
 * @param longest - The longest text drawn.
 * @returns The generator.
 */
const textsUpTo = (longest: number) =>
  map(array(element(alphabet), { max: longest, min: 0 }), (characters) => characters.join(""));

/**
 * What a text of the box exercises: whether `String.prototype.trim`, after XML's runs are merged,
 * reads it as §4.3.6 does, and whether its stated collapse is a QName.
 */
type CollapseSituation = "no QName" | "QName" | "trim agrees" | "trim departs";

/**
 * What an `xsi:type` of the box exercises: whether its stated collapse is a QName whose prefix is
 * in scope, and whether `trim` reads it otherwise.
 */
type TypeSituation = "in scope" | "not in scope" | "trim departs";

/**
 * Collapse a text as both sites did before XSD's collapse replaced it: XML's runs merged, then
 * `String.prototype.trim`, which strips every Unicode space separator and U+FEFF too.
 *
 * @param text - The text.
 * @returns The text, trimmed.
 */
const trimmed = (text: string): string => text.replaceAll(/[\t\n\r ]+/gu, " ").trim();

/**
 * XML's white space, production [3] of XML 1.0: `S ::= (#x20 | #x9 | #xD | #xA)+`, by code point.
 */
const xmlS: ReadonlySet<number> = new Set([0x20, 0x9, 0xd, 0xa]);

/**
 * Collapse a text as XSD 1.1 Part 2, §4.3.6 states it, step by step: each #x9, #xA and #xD, the
 * characters of {@link xmlS} that are not #x20, replaced with #x20; each contiguous sequence of
 * #x20 collapsed to one; and a #x20 at the start or end then removed.
 *
 * @param text - The text.
 * @returns The text as `collapse` normalizes it.
 */
const statedCollapse = (text: string): string => {
  const replaced = Array.from(text, (character) =>
    xmlS.has(character.codePointAt(0) ?? -1) ? " " : character,
  );
  const merged = replaced.filter((character, at) => character !== " " || replaced[at - 1] !== " ");
  const start = merged[0] === " " ? 1 : 0;
  const end = merged.length > start && merged.at(-1) === " " ? merged.length - 1 : merged.length;

  return merged.slice(start, end).join("");
};

/**
 * The prefixes the box's texts are read with as bound: none, so every prefix a QName has is one
 * {@link unboundPrefixesOf} names.
 *
 * @returns False.
 */
const nothingBound = (): boolean => false;

/**
 * The prefixes a QName domain's value names unbound, read from the stated collapse: each QName the
 * collapsed value holds (a list's items split at its spaces), its prefix where it has one, each
 * once.
 *
 * @param list - Whether the domain is a list of QNames.
 * @param text - The value as written.
 * @returns The prefixes, in order.
 */
const statedPrefixes = (list: boolean, text: string): readonly string[] => {
  const form = statedCollapse(text);

  return [
    ...new Set(
      (list ? form.split(" ") : [form]).flatMap((name) =>
        Option.match(qNamePartsOf(name), {
          onNone: () => [],
          onSome: ({ prefix }) => (prefix === "" ? [] : [prefix]),
        }),
      ),
    ),
  ];
};

/**
 * The prefixes the box's root binds for its `xsi:type`: the default namespace and `a`.
 */
const typeScope: ReadonlySet<string> = new Set(["", "a"]);

/**
 * Write a text of the box as a JavaScript string literal with every character outside printable
 * ASCII escaped, so a counterexample's no-break space reads as one and not as a space.
 *
 * @param text - The text.
 * @returns The literal.
 */
const shown = (text: string): string =>
  JSON.stringify(text).replaceAll(
    /[^\u0020-\u007E]/gu,
    (character) =>
      `\\u${(character.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, "0")}`,
  );

/**
 * The grammar shred reads through.
 */
const shredGrammar = shredGrammarOf(Result.getOrThrow(composed()));

/**
 * Write a text as an attribute value that reads back as it is: each tab, line feed and carriage
 * return as a character reference, which attribute-value normalization keeps (XML 1.0, §3.3.3).
 *
 * @param text - The text.
 * @returns The attribute value as written.
 */
const attributeText = (text: string): string =>
  text.replaceAll("\t", "&#9;").replaceAll("\n", "&#10;").replaceAll("\r", "&#13;");

describe("the host's collapse and the QName sites that read through it", () => {
  it("are told from String.prototype.trim by the box, at its shortest texts", () => {
    // Oracle: the planted defect, `trimmed`, beside §4.3.6's statement; the texts of one
    // character that part them are the three `trim` strips and XML does not.
    const parted = [...alphabet].filter((text) => trimmed(text) !== statedCollapse(text));

    assert.deepStrictEqual(parted, ["\u00A0", "\u3000", "\uFEFF"]);
  });

  it.effect(
    "read every text of the box as §4.3.6 collapses it: the host's collapse, the oracle's two, and unboundPrefixesOf for a QName and a list of QNames",
    (ctx) =>
      // Oracle: the specification as a checker, XML 1.0 production [3] and XSD 1.1 Part 2 §4.3.6,
      // written above as statedCollapse; unboundPrefixesOf's reading follows from the stated
      // collapse, never from the code under test.
      // Bound: every text of length 0 to 4 over the twelve characters of the alphabet, 22,621.
      searched(
        ctx,
        exhaust(
          {
            box: "every text of length 0 to 4 over space, tab, line feed, carriage return, a, colon, é, U+0085, U+00A0, U+3000, U+FEFF and ?",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace<CollapseSituation>([
              "trim agrees",
              "trim departs",
              "QName",
              "no QName",
            ]),
            generator: textsUpTo(4),
            limit: 22_621,
            literal: shown,
            oracle: {
              kind: "specification",
              name: "XML 1.0 production [3] S and XSD 1.1 Part 2 §4.3.6 collapse",
            },
            suite: "model/collapse",
          },
          (text: string, c) =>
            Effect.sync(() => {
              const stated = statedCollapse(text);
              c.note(trimmed(text) === stated ? "trim agrees" : "trim departs");
              c.note(Option.isSome(qNamePartsOf(stated)) ? "QName" : "no QName");

              assert.strictEqual(collapse(text), stated, "the host's collapse");
              assert.strictEqual(collapsed(text), stated, "the oracle's collapsed");
              assert.strictEqual(
                oracleValueOf(text, "collapse"),
                stated,
                "the oracle's oracleValueOf",
              );
              for (const qualified of ["QName", "QNames"] as const) {
                assert.deepStrictEqual(
                  unboundPrefixesOf(qualified, text, nothingBound),
                  statedPrefixes(qualified === "QNames", text),
                  `unboundPrefixesOf, ${qualified}`,
                );
              }
            }),
        ),
      ),
  );

  it.effect(
    "shred refuses an xsi:type as type-unresolved exactly where §4.3.6's collapse leaves no QName in scope, every text of the box to length 3",
    (ctx) =>
      // Oracle: the specification as a checker, statedCollapse, then the QName's prefix in the
      // root's scope (XML Schema 1.0 Part 1 §3.3.4 clause 4.1, §3.15.3).
      // Bound: every text of length 0 to 3 over the alphabet, 1,885, each one document shredded; a
      // padded text of length 1 to 3 holds every pad around an unprefixed name, and a padded
      // prefixed name is shred.oracle.test.ts's.
      searched(
        ctx,
        exhaust(
          {
            box: "every text of length 0 to 3 over space, tab, line feed, carriage return, a, colon, é, U+0085, U+00A0, U+3000, U+FEFF and ?, as a root's xsi:type",
            caseHang: Duration.seconds(10),
            coverage: requiredInSpace<TypeSituation>(["in scope", "not in scope", "trim departs"]),
            generator: textsUpTo(3),
            limit: 1885,
            literal: shown,
            oracle: {
              kind: "specification",
              name: "XSD 1.1 Part 2 §4.3.6 collapse, then XML Schema 1.0 Part 1 §3.3.4 clause 4.1",
            },
            suite: "model/collapse-xsi-type",
          },
          (text: string, c) =>
            Effect.gen(function* readType() {
              const stated = statedCollapse(text);
              const inScope = Option.match(qNamePartsOf(stated), {
                onNone: () => false,
                onSome: ({ prefix }) => typeScope.has(prefix),
              });
              c.note(inScope ? "in scope" : "not in scope");
              if (trimmed(text) !== stated) {
                c.note("trim departs");
              }

              const bytes = new TextEncoder().encode(
                `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" xmlns:a="urn:a" xmlns:xsi="${xsiNamespace}" xsi:type="${attributeText(text)}"/>`,
              );
              const document = yield* Effect.orDie(readXml(bytes));
              const outcome = yield* Effect.result(shred(document, "3.0.1", shredGrammar));

              assert.strictEqual(
                Result.isFailure(outcome) &&
                  outcome.failure._tag === "UnmodeledVocabulary" &&
                  outcome.failure.reason === "type-unresolved",
                !inScope,
                "type-unresolved exactly where the stated collapse is no QName in scope",
              );
            }),
        ),
      ),
  );
});

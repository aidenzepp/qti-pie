/**
 * The value-domain compiler's laws, each against an oracle that is not the compiler:
 *
 * - **The whitespace fold (spec-alignment §9.6).** XML Schema Part 2, 4.3.6, written here as a
 *   five-line normalization, is the oracle: a raw form is in a domain iff its normalization is in
 *   the domain's exact language. Searched over every definition the leaf resolves, on forms drawn
 *   from each definition's own language and perturbed by named whitespace variants.
 * - **The translation of XSD regular expressions.** `xmllint`, the XSD's own validator, judges every
 *   pattern facet the pinned XSDs state, each as the one facet of an `xs:string` restriction, on
 *   words of the pattern and their mutants.
 * - **Integer intervals.** `bigint` comparison, over every interval of a small box, exhausted.
 * - **`xs:date`.** A naive calendar: the Gregorian month lengths and leap rule.
 * - **The name tables.** XML 1.0 (Second Edition)'s Appendix B, read from the cached specification.
 * - **The shared syntax.** PostgreSQL's and JavaScript's regular expression grammars, turned into a
 *   checker of the subset both read.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it } from "@effect/vitest";
import { drawn, exhaust, explore } from "@grizzle/testing/explore";
import { required, requiredInSpace } from "@grizzle/testing/features";
import { element, int, weighted } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { floorSeed } from "@grizzle/testing/random";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { sample } from "@grizzle/testing/source";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, FileSystem, Formatter, Option, Result } from "effect";
import { Digest } from "effect/crypto";
import {
  anyUriPattern,
  baseChar,
  combiningChar,
  compile,
  extender,
  ideographic,
  languageOf,
  patternFlags,
  translatePattern,
  xmlDigit,
} from "#pantry/grammar/domains.ts";
import type { CodeRange, CodeSet, Reading, Regex } from "#pantry/grammar/domains.ts";
import {
  attributeDeclarations,
  globalAttributes,
  openAttribute,
  textTypes,
} from "#pantry/vocab/inventory/attributes.ts";
import { scratchDirectory } from "#pantry/test/scratch.ts";
import { builtinDomainOf } from "#pantry/vocab/derive/domains.ts";
import type { Domain, Facet } from "#pantry/vocab/inventory/types.ts";
import { OracleLayer, xmllintValidate } from "#pantry/xml/oracle.ts";

/**
 * Every distinct definition the leaf resolves, once each with a declaration it types: the leaf
 * states each definition once and its declarations share it.
 */
const leafDomains: readonly { readonly domain: Domain; readonly where: string }[] = [
  ...new Map(
    [
      ...attributeDeclarations.map(({ domain, kind, name }) => ({
        domain,
        where: `${kind}@${name}`,
      })),
      ...textTypes.map(({ domain, kind }) => ({ domain, where: `${kind} text` })),
      ...globalAttributes.map(({ domain, name }) => ({ domain, where: name })),
      { domain: openAttribute.domain, where: "open name" },
    ].map((entry) => [entry.domain, entry] as const),
  ).values(),
];

/**
 * `xs:anyURI`'s built-in domain as the derivation gives it: reading 71's pattern
 * ({@link anyUriPattern}), its value collapsed.
 */
const anyUriDomain: Domain = Result.getOrThrow(builtinDomainOf("anyURI"));

/**
 * Research seat AU's 131 test vectors (`docs/research/anyuri.md`, §4), each a collapsed value and
 * the verdict reading 71 gives it: RFC 2396 and RFC 2732 judged rule by rule.
 */
const anyUriVectors: readonly (readonly [value: string, valid: boolean])[] = [
  ["", true],
  ["a", true],
  ["images/sign.png", true],
  ["https://x/y.png", true],
  ["ok/path?q#f", true],
  ["#", true],
  ["#f", true],
  ["../a/./b", true],
  ["urn:isbn:0451450523", true],
  ["mailto:a@b.example", true],
  ["x:'quoted'", true],
  ["http://192.0.2.16:80/", true],
  ["http://u:p@h:1/", true],
  ["not a uri", true],
  ["http://example.com/a b", true],
  ["http://example.com/ä", true],
  ["http://usér@höst/", true],
  ["a{b}|c", true],
  ['a<b>"c\\d^e`f', true],
  ["http://a b/", true],
  ["ht tp://x", false],
  ["%41", true],
  ["http://example.com/a%20b", true],
  ["a%zz", false],
  ["a%", false],
  ["a%4", false],
  ["%zz", false],
  ["100%", false],
  ["http://h%41/", true],
  ["http://h%/", false],
  ["a#b#c", false],
  ["a:b#c#d", false],
  ["##", false],
  ["1a:b", false],
  ["a:b", true],
  ["a+b.c-d:x", true],
  ["h%74tp://x", false],
  ["./a:b", true],
  ["a/b:c", true],
  ["a?b:c", true],
  ["foo:", false],
  ["about:", false],
  ["foo:#f", false],
  ["foo:?q", true],
  ["foo:/", true],
  ["foo://", true],
  ["?", false],
  ["?q", false],
  ["?q#f", false],
  ["?#", false],
  ["a?", true],
  ["#[x]", true],
  ["a#[x]", true],
  ["a#xpointer(/a[1])", true],
  ["a?[", true],
  ["p?a[0]=1", true],
  ["http://h/p?a[]=1", true],
  ["http://h/p?a=[1]#[2]", true],
  ["foo:a[b]", true],
  ["urn:x:a[1]", true],
  ["foo:?[x]", true],
  ["mailto:a@b?subject=[x]", true],
  ["foo:[x]", false],
  ["foo:/a[b]", false],
  ["http://h/[x]", false],
  ["a/[x]", false],
  ["[x]", false],
  ["a[b", false],
  ["/a]b", false],
  ["http://h[x]/", false],
  ["http://[a]@h/", false],
  ["http://h:/", true],
  ["http://a:/", true],
  ["http://h:80/", true],
  ["http://h:abc/", true],
  ["http://a:b/", true],
  ["http://h:8 0/", true],
  ["http://h:80:90/", true],
  ["http://a@b@c/", true],
  ["http://@/", true],
  ["http://:80/", true],
  ["http:///p", true],
  ["http://", true],
  ["//", true],
  ["///", true],
  ["//h:abc/", true],
  ["/a//b", true],
  ["a//b", true],
  ["http://h:99999999999999999999/", true],
  ["http://1.2.3.4x/", true],
  ["http://999.1.1.1/", true],
  ["http://-a-/", true],
  ["http://[::1]/", true],
  ["http://[::1]:/", true],
  ["http://[::1]:80/", true],
  ["http://u@[::1]:80/p", true],
  ["//[::1]/", true],
  ["http://[2001:db8::7]/c=GB", true],
  ["http://[::1", false],
  ["http://[::1]x/", false],
  ["http://[::1]:abc/", false],
  ["http://[v1.x]/", false],
  ["http://[v1.fe]/", false],
  ["http://[V7.a:b]/", false],
  ["http://[v.x]/", false],
  ["http://[]/", false],
  ["http://[zz]/", false],
  ["http://[xyz]/", false],
  ["http://[ ]/", false],
  ["http://[::1 ]/", false],
  ["http://[a#b]/", false],
  ["http://[[]/", false],
  ["http://[%41]/", false],
  ["http://[1.2.3.4]/", false],
  ["http://[1]/", true],
  ["http://[1:2]/", true],
  ["http://[1:2:3:4:5:6:7:8:9]/", true],
  ["http://[12345::]/", false],
  ["http://[1::2::3]/", false],
  ["http://[1:2:3:4:5:6:7:8]/", true],
  ["http://[1:2:3:4:5:6:7::]/", true],
  ["http://[::]/", true],
  ["http://[::13.1.68.3]/", true],
  ["http://[::FFFF:129.144.52.38]/", true],
  ["http://[1::1.2.3.4]/", true],
  ["http://[1:2:3:4:5::1.2.3.4]/", true],
  ["http://[1:2:3:4:5:6::1.2.3.4]/", false],
  ["http://[::999.1.1.1]/", false],
  ["http://[::ffff:999.1.1.1]/", true],
  ["http://[::ffff:01.2.3.4]/", true],
  ["http://[0:0:0:0:0:0:13.1.68.3]/", true],
];

/**
 * Definitions no pinned XSD states, under each class, whose languages hold what the leaf's do not:
 * a space inside a word, and a class that holds a tab but no space. Over the leaf alone the
 * `replace` fold is observable nowhere (every pinned `replace` language that holds a space already
 * holds the three breaks), so a fold that did nothing would pass; these make it seen.
 */
const syntheticDomains: readonly { readonly domain: Domain; readonly where: string }[] = (
  [
    ["replace", "a b"],
    ["replace", "[^ ]+"],
    ["replace", String.raw`x\sy`],
    ["collapse", "a b( c)*"],
    ["preserve", "a b"],
    ["collapse", anyUriPattern],
    ["collapse", " ?a"],
    ["collapse", "( a)*b"],
    ["collapse", "([ x]|y)+z"],
  ] as const
).map(([whiteSpace, pattern]) => ({
  domain: {
    _tag: "atomic",
    builtin: "string",
    facets: [{ facet: "whiteSpace", value: whiteSpace }],
    patterns: [[pattern]],
    primitive: "string",
  },
  where: `synthetic ${whiteSpace} ${pattern}`,
}));

/**
 * The definitions the fold is searched over, a non-empty list to draw from: the leaf's, then the
 * synthetic ones.
 */
const leafChoices = ((): readonly [
  (typeof leafDomains)[number],
  ...(typeof leafDomains)[number][],
] => {
  const [first, ...rest] = [...leafDomains, ...syntheticDomains];
  if (first === undefined) {
    return [{ domain: openAttribute.domain, where: "open name" }];
  }

  return [first, ...rest];
})();

/**
 * Compile a definition to a host regex, failing the test that reads it when it does not compile.
 *
 * @param domain - The definition.
 * @param reading - How its whitespace is read.
 * @returns The regex.
 */
const regexOf = (domain: Domain, reading: Reading): RegExp =>
  new RegExp(Result.getOrThrow(compile(domain, reading)).pattern, patternFlags);

/**
 * The host regexes of each definition, by definition and reading, compiled once.
 */
const regexes = new Map<Domain, Map<Reading, RegExp>>();

/**
 * The cached host regex of a definition.
 *
 * @param domain - The definition.
 * @param reading - How its whitespace is read.
 * @returns The regex.
 */
const cachedRegex = (domain: Domain, reading: Reading): RegExp => {
  const byReading = regexes.get(domain) ?? new Map<Reading, RegExp>();
  const known = byReading.get(reading) ?? regexOf(domain, reading);
  byReading.set(reading, known);
  regexes.set(domain, byReading);

  return known;
};

/**
 * The whitespace class a definition states, as the leaf's `whiteSpace` facet in force gives it; a
 * union has none of its own.
 *
 * @param domain - The definition.
 * @returns Its class.
 */
const classOf = (domain: Domain): "collapse" | "preserve" | "replace" | "union" => {
  const stated = domain.facets.find(({ facet }) => facet === "whiteSpace")?.value;

  return stated === "collapse" || stated === "preserve" || stated === "replace" ? stated : "union";
};

/**
 * XML Schema Part 2, 4.3.6: `preserve` keeps a value, `replace` turns each tab, line feed and
 * carriage return into a space, and `collapse` also makes each run of spaces one and drops a space
 * at either end. Only `#x20` is trimmed, never another Unicode space (`String.prototype.trim` would
 * strip a no-break space too, which XSD keeps).
 *
 * @param raw - The value as written.
 * @param whiteSpace - The class.
 * @returns The normalized value.
 */
const normalized = (raw: string, whiteSpace: string): string => {
  if (whiteSpace === "preserve") {
    return raw;
  }

  const replaced = raw.replaceAll(/[\t\n\r]/gu, " ");

  return whiteSpace === "replace"
    ? replaced
    : replaced.replaceAll(/ +/gu, " ").replaceAll(/^ | $/gu, "");
};

/**
 * Whether XML Schema accepts a raw form under a definition, by the oracle: an atomic or list
 * definition's exact language must hold the form once normalized by the definition's own class,
 * and a union's holds it when one member's does (Part 1, 3.14.4, each member normalizing as it
 * reads).
 *
 * @param domain - The definition.
 * @param raw - The form as written.
 * @returns Whether it is valid.
 */
const xsdAccepts = (domain: Domain, raw: string): boolean =>
  domain._tag === "union"
    ? domain.members.some((member) => xsdAccepts(member, raw))
    : cachedRegex(domain, "exact").test(normalized(raw, classOf(domain)));

/**
 * Draw one character of a set, near the start of one of its runs, where the boundaries are.
 *
 * @param set - The set.
 * @returns The generator.
 */
const characterOf =
  (set: CodeSet): Gen<string> =>
  (source) => {
    const [lo, hi] = set[source.draw(int(0, set.length - 1))] ?? [0x61, 0x61];

    return String.fromCodePoint(source.draw(int(lo, Math.min(hi, lo + 40))));
  };

/**
 * Draw a word of a language tree: every set a character of it, every repetition a few times past
 * its least. A tree holds no intersection, which the compiler builds as its product, so every word
 * drawn is in the language.
 *
 * @param tree - The tree.
 * @returns The generator.
 */
const wordOf =
  (tree: Regex): Gen<string> =>
  (source) => {
    switch (tree._tag) {
      case "chars": {
        return source.draw(characterOf(tree.set));
      }
      case "seq": {
        return tree.parts.map((part) => source.draw(wordOf(part))).join("");
      }
      case "alt": {
        const [first, ...rest] = tree.arms;

        return first === undefined
          ? ""
          : source.draw(wordOf(source.draw(element([first, ...rest]))));
      }
      case "repeat": {
        const extra = Option.match(tree.max, {
          onNone: () => 3,
          onSome: (most) => Math.min(3, most - tree.min),
        });
        const times = source.draw(int(tree.min, tree.min + extra));

        return Array.from({ length: times }, () => source.draw(wordOf(tree.body))).join("");
      }
      default: {
        return tree satisfies never;
      }
    }
  };

/**
 * A run of one to three XML whitespace characters.
 */
const whitespaceRun: Gen<string> = (source) =>
  Array.from({ length: source.draw(int(1, 3)) }, () =>
    source.draw(element([" ", "\t", "\n", "\r"])),
  ).join("");

/**
 * Characters that are wild at a domain's edges: XML's whitespace, a no-break space, a name
 * character outside the Second Edition's tables, a combining mark, a supplementary character.
 */
const wildCharacters = [
  " ",
  "\t",
  "\n",
  "\r",
  " ",
  "Ⰰ",
  "ஃ",
  "̀",
  "\u{1F600}",
  "-",
  "+",
  ".",
  "0",
] as const;

/**
 * The named variants a raw form is drawn as (doctrine rule 6), each from a word of the language:
 * the word itself; outer whitespace; each space a run; each space a tab, line feed or carriage
 * return; a whitespace character inside; a character doubled; a wild character inside.
 */
const variants = ["as-is", "outer", "runs", "breaks", "inner", "doubled", "wild"] as const;

/**
 * A raw form: a definition of the leaf, the member whose language it is drawn from, and one
 * variant of one of its words.
 */
interface RawCase {
  readonly raw: string;
  readonly variant: (typeof variants)[number];
  readonly where: string;
  readonly domain: Domain;
}

/**
 * Spell a value for a failure's message, every character outside printable ASCII as its code point.
 *
 * @param value - The value.
 * @returns Its spelling.
 */
const spelled = (value: string): string =>
  JSON.stringify(
    Array.from(value, String)
      .map((point) =>
        /^[\u0021-\u007E]$/u.test(point)
          ? point
          : `\\u{${(point.codePointAt(0) ?? 0).toString(16)}}`,
      )
      .join(""),
  );

/**
 * Insert a string at a drawn place of another.
 *
 * @param word - The word.
 * @param inserted - What goes in.
 * @returns The generator.
 */
const insertedInto =
  (word: string, inserted: string): Gen<string> =>
  (source) => {
    const points = Array.from(word, String);
    const at = source.draw(int(0, points.length));

    return [...points.slice(0, at), inserted, ...points.slice(at)].join("");
  };

/**
 * Draw a raw form of a leaf definition.
 */
const rawCase: Gen<RawCase> = (source) => {
  const { domain, where } = source.draw(element(leafChoices));
  const members = domain._tag === "union" ? domain.members : [domain];
  const [head, ...tail] = members;
  const member = head === undefined ? domain : source.draw(element([head, ...tail]));
  const word = source.draw(wordOf(Result.getOrThrow(languageOf(member))));
  const variant = source.draw(
    weighted([
      [2, () => "as-is" as const],
      [3, () => "outer" as const],
      [3, () => "runs" as const],
      [2, () => "breaks" as const],
      [2, () => "inner" as const],
      [1, () => "doubled" as const],
      [1, () => "wild" as const],
    ]),
  );
  const raw = ((): string => {
    switch (variant) {
      case "as-is": {
        return word;
      }
      case "outer": {
        return `${source.draw(whitespaceRun)}${word}${source.draw(whitespaceRun)}`;
      }
      case "runs": {
        return word.replaceAll(" ", () => source.draw(whitespaceRun));
      }
      case "breaks": {
        return word.replaceAll(" ", () => source.draw(element(["\t", "\n", "\r"])));
      }
      case "inner": {
        return source.draw(insertedInto(word, source.draw(whitespaceRun)));
      }
      case "doubled": {
        const points = Array.from(word, String);
        const at = source.draw(int(0, Math.max(0, points.length - 1)));

        return [...points.slice(0, at + 1), ...points.slice(at)].join("");
      }
      case "wild": {
        return source.draw(insertedInto(word, source.draw(element(wildCharacters))));
      }
      default: {
        return variant satisfies never;
      }
    }
  })();

  return { domain, raw, variant, where };
};

/**
 * The features the fold's search steers by: (the definition's class, the verdict), so each class
 * is seen both accepting and refusing.
 */
const foldFeatures = [
  "collapse accepted",
  "collapse refused",
  "replace accepted",
  "replace refused",
  "preserve accepted",
  "preserve refused",
  "union accepted",
  "union refused",
  "synthetic accepted",
  "synthetic refused",
] as const;

/**
 * A collapsed `xs:token` restricted by one pattern.
 *
 * @param pattern - The XSD pattern.
 * @returns The definition.
 */
const collapsedToken = (pattern: string): Domain => ({
  _tag: "atomic",
  builtin: "token",
  facets: [{ facet: "whiteSpace", value: "collapse" }],
  patterns: [[pattern]],
  primitive: "string",
});

/**
 * Whether a collapsed `xs:token` restricted by one pattern compiles.
 *
 * @param pattern - The XSD pattern.
 * @returns Whether its domain folds.
 */
const folds = (pattern: string) => Result.isSuccess(compile(collapsedToken(pattern), "xsd"));

describe("The whitespace fold", () => {
  it.effect(
    "accepts a raw form exactly when its XSD normalization is in the domain's exact language, over every definition the leaf resolves",
    (ctx) =>
      searched(
        ctx,
        explore(
          {
            caseHang: Duration.minutes(1),
            concurrency: 1,
            coverage: required(foldFeatures, { cases: 600, sense: notesOnly }),
            draw: drawn(rawCase),
            kept: [],
            literal: Formatter.format,
            runs: 6000,
            shrink: completeShrink,
            steerEvery: 32,
            suite: "grammar/domains/fold",
          },
          (drawnCase, c) =>
            Effect.sync(() => {
              const expected = xsdAccepts(drawnCase.domain, drawnCase.raw);
              const verdict = cachedRegex(drawnCase.domain, "xsd").test(drawnCase.raw);
              const group = drawnCase.where.startsWith("synthetic")
                ? "synthetic"
                : classOf(drawnCase.domain);
              c.note(verdict ? (`${group} accepted` as const) : (`${group} refused` as const));

              assert.strictEqual(
                verdict,
                expected,
                `${drawnCase.where} (${drawnCase.variant}) ${spelled(drawnCase.raw)}`,
              );
            }),
        ),
      ),
    120_000,
  );

  it("refuses to fold exactly the collapsed languages in which two spaces that do not merge may stand together, and refuses as empty those whose every word begins or ends with a space", () => {
    for (const pattern of ["a  b", "a[ x][ y]b", "a( )( )b"]) {
      assert.isFalse(folds(pattern), `the pattern ${JSON.stringify(pattern)} under collapse`);
    }

    for (const pattern of [" ?a", "a ?", "( a)*", "a[ b]*c", "([ x]|y)+z"]) {
      assert.isTrue(folds(pattern), `the pattern ${JSON.stringify(pattern)} under collapse`);
    }

    // Every word of these begins or ends with a space, which collapsing never yields, so the
    // narrowed core holds no word and the definition is refused as holding no value.
    for (const pattern of [" a", "a ", "( a)+"]) {
      const compiled = compile(collapsedToken(pattern), "xsd");
      assert.isTrue(
        Result.isFailure(compiled) &&
          compiled.failure._tag === "UnreadDefinition" &&
          compiled.failure.detail.includes("holds no value"),
        `the pattern ${JSON.stringify(pattern)} under collapse`,
      );
    }
  });
});

/**
 * Every pattern facet the leaf's definitions state, each once.
 *
 * @param domain - A definition.
 * @returns Its patterns and its members' and item's.
 */
const patternsOf = (domain: Domain): readonly string[] => [
  ...domain.patterns.flat(),
  ...(domain._tag === "list" ? patternsOf(domain.item) : []),
  ...(domain._tag === "union" ? domain.members.flatMap(patternsOf) : []),
];

/**
 * The distinct pattern facets of the pinned XSDs, as the leaf states them: every pattern of its
 * domains but `anyURI`'s lexical pattern ({@link anyUriPattern}), which the derivation states for
 * the primitive (spec reading 71) and no XSD writes. Its oracles are research seat AU's vectors
 * and the RFC 2396 interpreter (`src/vocab/derive/domains.test.ts`); xmllint is none, since
 * libxml2 2.9.13's regular expressions depart from it, admitting `ab]`, which its relative-segment
 * class excludes.
 */
const leafPatterns = [...new Set(leafDomains.flatMap(({ domain }) => patternsOf(domain)))].filter(
  (pattern) => pattern !== anyUriPattern,
);

/**
 * A definition with one pattern facet over `xs:string`, whitespace preserved: the language of the
 * pattern alone.
 *
 * @param pattern - The XSD pattern.
 * @returns The definition.
 */
const patternDomain = (pattern: string): Domain => ({
  _tag: "atomic",
  builtin: "string",
  facets: [{ facet: "whiteSpace", value: "preserve" }],
  patterns: [[pattern]],
  primitive: "string",
});

/**
 * Escape a value for an XML attribute between double quotes, tab, line feed and carriage return as
 * character references, so the parser's attribute-value normalization leaves them for the
 * validator.
 *
 * @param value - The value.
 * @returns Its spelling.
 */
const attributeText = (value: string): string =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll('"', "&quot;")
    .replaceAll("\t", "&#9;")
    .replaceAll("\n", "&#10;")
    .replaceAll("\r", "&#13;");

/**
 * Whether a code point is an XML character, one an attribute value may hold (XML 1.0, `Char`).
 *
 * @param point - The code point.
 * @returns Whether it is.
 */
const isXmlCharacter = (point: number): boolean =>
  point === 0x9 ||
  point === 0xa ||
  point === 0xd ||
  (point >= 0x20 && point <= 0xd7_ff) ||
  (point >= 0xe0_00 && point <= 0xff_fd) ||
  (point >= 0x1_00_00 && point <= 0x10_ff_ff);

/**
 * The mutants of a word: each character deleted, a wild character inserted at each end and in the
 * middle, and each character replaced by the next code point.
 *
 * @param word - The word.
 * @returns The mutants.
 */
const mutantsOf = (word: string): readonly string[] => {
  const points = Array.from(word, String);
  const middle = Math.floor(points.length / 2);

  return [
    ...points.map((_, at) => [...points.slice(0, at), ...points.slice(at + 1)].join("")),
    ...wildCharacters.flatMap((wild) => [
      `${wild}${word}`,
      `${word}${wild}`,
      [...points.slice(0, middle), wild, ...points.slice(middle)].join(""),
    ]),
    ...points.map((point, at) =>
      [
        ...points.slice(0, at),
        String.fromCodePoint((point.codePointAt(0) ?? 0x61) + 1),
        ...points.slice(at + 1),
      ].join(""),
    ),
  ].filter((mutant) =>
    Array.from(mutant, String).every((point) => isXmlCharacter(point.codePointAt(0) ?? 0)),
  );
};

/**
 * Whether `xmllint` can be run here.
 */
const hasXmllint = await Effect.runPromise(
  Effect.gen(function* findXmllint() {
    const fs = yield* FileSystem.FileSystem;

    return (
      (yield* fs.exists("/usr/bin/xmllint")) || (yield* fs.exists("/opt/homebrew/bin/xmllint"))
    );
  }).pipe(Effect.provide(NodeServices.layer)),
);

describe.skipIf(!hasXmllint)("The translation of XSD regular expressions", () => {
  it.effect(
    "matches every pattern facet of the pinned XSDs exactly as xmllint does, on its words and their mutants",
    () =>
      Effect.gen(function* translationAgrees() {
        const fs = yield* FileSystem.FileSystem;
        const directory = yield* scratchDirectory("domains-translation-");

        const probes = leafPatterns.flatMap((pattern, index) => {
          const words = sample(
            wordOf(Result.getOrThrow(languageOf(patternDomain(pattern)))),
            floorSeed(`translation ${pattern}`),
            10,
          );

          return [...new Set([...words, ...words.flatMap(mutantsOf), ""])].map((value) => ({
            index,
            pattern,
            value,
          }));
        });
        const schema = [
          '<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">',
          '  <xs:element name="r"><xs:complexType><xs:sequence><xs:any processContents="strict" minOccurs="0" maxOccurs="unbounded"/></xs:sequence></xs:complexType></xs:element>',
          ...leafPatterns.map(
            (pattern, index) =>
              `  <xs:element name="p${index}"><xs:complexType><xs:attribute name="v"><xs:simpleType><xs:restriction base="xs:string"><xs:pattern value="${attributeText(pattern)}"/></xs:restriction></xs:simpleType></xs:attribute></xs:complexType></xs:element>`,
          ),
          "</xs:schema>",
          "",
        ].join("\n");
        const instance = [
          "<r>",
          ...probes.map(({ index, value }) => `<p${index} v="${attributeText(value)}"/>`),
          "</r>",
          "",
        ].join("\n");
        yield* fs.writeFileString(`${directory}/patterns.xsd`, schema);
        yield* fs.writeFileString(`${directory}/probes.xml`, instance);
        yield* fs.writeFileString(
          `${directory}/catalog.xml`,
          '<?xml version="1.0"?>\n<catalog xmlns="urn:oasis:names:tc:entity:xmlns:xml:catalog"/>\n',
        );

        const [verdict] = yield* xmllintValidate({
          catalog: `${directory}/catalog.xml`,
          paths: [`${directory}/probes.xml`],
          schema: `${directory}/patterns.xsd`,
        });
        const refusedLines = new Set(
          verdict?._tag === "Invalid"
            ? verdict.messages
                .filter(({ attribute }) => Option.contains(attribute, "v"))
                .map(({ line }) => line)
            : [],
        );
        const translated = new Map(
          leafPatterns.map((pattern) => [
            pattern,
            new RegExp(Result.getOrThrow(translatePattern(pattern)), patternFlags),
          ]),
        );
        const disagreements = probes.flatMap(({ pattern, value }, at) => {
          const xmllint = !refusedLines.has(at + 2);
          const ours = translated.get(pattern)?.test(value) ?? false;

          return xmllint === ours
            ? []
            : [
                `${JSON.stringify(pattern)} on ${JSON.stringify(value)}: xmllint ${xmllint ? "accepts" : "refuses"}`,
              ];
        });

        assert.isAbove(probes.length, leafPatterns.length * 10);
        assert.deepStrictEqual(disagreements, []);
      }).pipe(Effect.scoped, Effect.provide(OracleLayer), Effect.provide(NodeServices.layer)),
    120_000,
  );

  it("refuses the patterns XSD's grammar does not define, and the blocks this reader has no range for", () => {
    for (const pattern of [
      "[]",
      "a{",
      "(a",
      "a)",
      "[a-[b]c]",
      "\\p{IsArmenian}",
      "\\q",
      "[z-a]",
      "*a",
    ]) {
      const read = translatePattern(pattern);

      assert.isTrue(Result.isFailure(read) && read.failure._tag === "UnreadPattern", pattern);
    }
  });
});

/**
 * An `xs:integer` definition with bounds, read exactly.
 *
 * @param bounds - Its bound facets.
 * @returns The definition.
 */
const integerDomain = (bounds: readonly Facet[]): Domain => ({
  _tag: "atomic",
  builtin: "integer",
  facets: [
    { facet: "whiteSpace", value: "collapse" },
    { facet: "fractionDigits", value: "0" },
    ...bounds,
  ],
  patterns: [[String.raw`[\-+]?[0-9]+`]],
  primitive: "decimal",
});

/**
 * The lexical forms of a whole number: plain, with a plus, with leading zeros, and zero's minus.
 *
 * @param value - The number.
 * @returns Its forms.
 */
const formsOf = (value: bigint): readonly string[] => {
  const magnitude = (value < 0n ? -value : value).toString();
  const unsigned = value === 0n ? ["", "+", "-"] : ["", "+"];
  const signs = value < 0n ? ["-"] : unsigned;

  return signs.flatMap((sign) => [`${sign}${magnitude}`, `${sign}00${magnitude}`]);
};

/**
 * Name an interval's shape for the search's features.
 *
 * @param members - How many values of the box it holds.
 * @param lo - Its lower bound.
 * @param hi - Its upper bound.
 * @returns `empty`, `bounded`, `unbounded` or `half-open`.
 */
const intervalKindOf = (
  members: number,
  lo: Option.Option<unknown>,
  hi: Option.Option<unknown>,
): "bounded" | "empty" | "half-open" | "unbounded" => {
  if (members === 0) {
    return "empty";
  }

  if (Option.isSome(lo) === Option.isSome(hi)) {
    return Option.isSome(lo) ? "bounded" : "unbounded";
  }

  return "half-open";
};

/**
 * A bound of the box: none, or a whole number from -11 to 11, inclusive or exclusive.
 */
type Bound = Option.Option<{ readonly exclusive: boolean; readonly value: bigint }>;

describe("Integer intervals", () => {
  it.effect(
    "read a value as in the interval exactly when bigint comparison puts it there, every interval of bounds -11 to 11 and every value -120 to 120, exhausted",
    (ctx) =>
      searched(
        ctx,
        exhaust(
          {
            caseHang: Duration.minutes(1),
            coverage: requiredInSpace<"bounded" | "empty" | "half-open" | "unbounded">([
              "bounded",
              "half-open",
              "unbounded",
              "empty",
            ]),
            generator: (source) => {
              const bound = (): Bound =>
                source.draw(int(0, 1)) === 0
                  ? Option.none()
                  : Option.some({
                      exclusive: source.draw(int(0, 1)) === 1,
                      value: BigInt(source.draw(int(-11, 11))),
                    });

              return { hi: bound(), lo: bound() };
            },
            limit: 2209,
            literal: Formatter.format,
            suite: "grammar/domains/integer",
          },
          ({ hi, lo }, c) =>
            Effect.sync(() => {
              const facets = [
                ...Option.toArray(
                  lo.pipe(
                    Option.map(({ exclusive, value }): Facet => ({
                      facet: exclusive ? "minExclusive" : "minInclusive",
                      value: String(value),
                    })),
                  ),
                ),
                ...Option.toArray(
                  hi.pipe(
                    Option.map(({ exclusive, value }): Facet => ({
                      facet: exclusive ? "maxExclusive" : "maxInclusive",
                      value: String(value),
                    })),
                  ),
                ),
              ];
              const inBox = (value: bigint) =>
                Option.match(lo, {
                  onNone: () => true,
                  onSome: (bound) => (bound.exclusive ? value > bound.value : value >= bound.value),
                }) &&
                Option.match(hi, {
                  onNone: () => true,
                  onSome: (bound) => (bound.exclusive ? value < bound.value : value <= bound.value),
                });
              const values = Array.from({ length: 241 }, (_, at) => BigInt(at - 120));
              const members = values.filter(inBox);
              c.note(intervalKindOf(members.length, lo, hi));

              const compiled = compile(integerDomain(facets), "exact");
              if (members.length === 0) {
                assert.isTrue(Result.isFailure(compiled));

                return;
              }

              const regex = new RegExp(Result.getOrThrow(compiled).pattern, patternFlags);
              for (const value of values) {
                for (const form of formsOf(value)) {
                  assert.strictEqual(regex.test(form), inBox(value), form);
                }
              }

              for (const wild of ["", "+", "-", "1.0", "1e2", " 1", "0x1", "١"]) {
                assert.isFalse(regex.test(wild), wild);
              }
            }),
        ),
      ),
    120_000,
  );

  it("read the bounds of the wide built-ins exactly at their edges: int, long, unsignedLong", () => {
    for (const [lo, hi] of [
      [-2_147_483_648n, 2_147_483_647n],
      [-9_223_372_036_854_775_808n, 9_223_372_036_854_775_807n],
      [0n, 18_446_744_073_709_551_615n],
    ] as const) {
      const regex = regexOf(
        integerDomain([
          { facet: "minInclusive", value: String(lo) },
          { facet: "maxInclusive", value: String(hi) },
        ]),
        "exact",
      );
      for (const edge of [lo, hi]) {
        for (const delta of [-11n, -10n, -1n, 0n, 1n, 9n, 10n, 100n]) {
          const value = edge + delta;
          for (const form of formsOf(value)) {
            assert.strictEqual(regex.test(form), value >= lo && value <= hi, form);
          }
        }
      }
    }
  });
});

/**
 * Whether a year, month and day is a date of the Gregorian calendar, by arithmetic: no year zero,
 * months 1 to 12, and each month's length, February's 29 in a leap year.
 *
 * @param year - The year.
 * @param month - The month.
 * @param day - The day.
 * @returns Whether the date exists.
 */
const isDate = (year: bigint, month: number, day: number): boolean => {
  const leap = (year % 4n === 0n && year % 100n !== 0n) || year % 400n === 0n;
  const lengths = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

  return year !== 0n && month >= 1 && month <= 12 && day >= 1 && day <= (lengths[month - 1] ?? 0);
};

describe("xs:date", () => {
  it("reads a date as valid exactly when the calendar holds it, every month 00 to 13 and day 00 to 32 of 26 years, with and without a timezone", () => {
    const regex = regexOf(
      {
        _tag: "atomic",
        builtin: "date",
        facets: [{ facet: "whiteSpace", value: "collapse" }],
        patterns: [],
        primitive: "date",
      },
      "exact",
    );
    const years = [
      "0000",
      "0001",
      "0004",
      "0100",
      "0400",
      "0800",
      "1000",
      "1600",
      "1700",
      "1900",
      "1996",
      "2000",
      "2023",
      "2024",
      "2100",
      "2400",
      "9996",
      "9999",
      "10000",
      "10400",
      "12000",
      "99996",
      "100000",
      "-0001",
      "-0004",
      "-2000",
    ];
    let checked = 0;
    for (const year of years) {
      for (let month = 0; month <= 13; month += 1) {
        for (let day = 0; day <= 32; day += 1) {
          const lexical = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const valid = isDate(BigInt(year), month, day);
          for (const zone of ["", "Z", "+14:00", "-13:59", "+00:00"]) {
            assert.strictEqual(regex.test(`${lexical}${zone}`), valid, `${lexical}${zone}`);
            checked += 1;
          }
        }
      }
    }

    for (const wild of [
      "2023-1-01",
      "023-01-01",
      "2023-01-01+14:01",
      "2023-01-01+15:00",
      "2023-01-01z",
      "02023-01-01",
      "2023-01-01T00:00",
    ]) {
      assert.isFalse(regex.test(wild), wild);
    }

    assert.strictEqual(checked, 26 * 14 * 33 * 5);
  });
});

/**
 * The cached XML 1.0 (Second Edition), `~/.cache/gr8des/xml-2e/REC-xml-20001006.html`, and its
 * SHA-256 as fetched on 2026-11-05 from `https://www.w3.org/TR/2000/REC-xml-20001006`.
 */
const secondEdition = {
  path: `${process.env["HOME"] ?? ""}/.cache/gr8des/xml-2e/REC-xml-20001006.html`,
  sha256: "e5350fb462ada6babfc43d72263a955bddf78605180457c6e006886f60a89b67",
} as const;

/**
 * Whether the Second Edition is cached.
 */
const specCached = await Effect.runPromise(
  Effect.gen(function* findSpec() {
    const fs = yield* FileSystem.FileSystem;

    return yield* fs.exists(secondEdition.path);
  }).pipe(Effect.provide(NodeServices.layer)),
);

describe.skipIf(!specCached)("The name tables", () => {
  it.effect(
    "are XML 1.0 (Second Edition)'s BaseChar, Ideographic, CombiningChar, Digit and Extender, as Appendix B lists them",
    () =>
      Effect.gen(function* tablesAreTheSpecs() {
        const fs = yield* FileSystem.FileSystem;
        const bytes = yield* fs.readFile(secondEdition.path);
        const digest = yield* Digest.Digest;
        assert.strictEqual(yield* digest.digestHex(Digest.sha256, bytes), secondEdition.sha256);

        const text = new TextDecoder().decode(bytes);
        const tableOf = (name: string): readonly CodeRange[] => {
          const start = text.indexOf(`name="NT-${name}"`);
          const end = text.indexOf("</tr>", start);

          return [
            ...text
              .slice(start, end)
              .replaceAll(/<[^>]+>/gu, "")
              .matchAll(/#x(?<lo>[0-9A-Fa-f]+)(?:-#x(?<hi>[0-9A-Fa-f]+))?/gu),
          ].map(({ groups }): CodeRange => [
            Number.parseInt(groups?.["lo"] ?? "", 16),
            Number.parseInt(groups?.["hi"] ?? groups?.["lo"] ?? "", 16),
          ]);
        };

        assert.deepStrictEqual(baseChar, tableOf("BaseChar"));
        assert.deepStrictEqual(ideographic, tableOf("Ideographic"));
        assert.deepStrictEqual(combiningChar, tableOf("CombiningChar"));
        assert.deepStrictEqual(xmlDigit, tableOf("Digit"));
        assert.deepStrictEqual(extender, tableOf("Extender"));
      }).pipe(Effect.provide(Digest.layerWebCrypto), Effect.provide(NodeServices.layer)),
  );
});

/**
 * PostgreSQL's largest repetition count, `RE_DUP_MAX`.
 */
const duplicateMax = 255;

/**
 * What one escape of a pattern takes: how many characters past its backslash, and each way it
 * leaves the shared syntax.
 */
interface EscapeReading {
  readonly length: number;
  readonly problems: readonly string[];
}

/**
 * Read one escape of a pattern: `\uXXXX`, a letter escape of a line break or tab, or an escape of
 * a metacharacter of the place it stands in.
 *
 * @param points - The pattern's code points.
 * @param at - Where its backslash stands.
 * @param inClass - Whether it stands inside a bracket expression.
 * @returns How many characters past the backslash it takes, and how it leaves the shared syntax.
 */
const escapeAt = (points: readonly string[], at: number, inClass: boolean): EscapeReading => {
  const next = points[at + 1] ?? "";
  if (next === "u") {
    return {
      length: 5,
      problems: /^[0-9A-F]{4}$/u.test(points.slice(at + 2, at + 6).join(""))
        ? []
        : [`a \\u not of four hex digits at ${at}`],
    };
  }

  const meta = inClass ? /[\\\]^\-[]/u : /[\\^$.|?*+()[\]{}]/u;

  return {
    length: 1,
    problems: /[tnr]/u.test(next) || meta.test(next) ? [] : [`the escape \\${next} at ${at}`],
  };
};

/**
 * Check a pattern against the syntax PostgreSQL's advanced regular expressions and JavaScript's
 * `u`-flag regular expressions share: a bracket expression holds code points, ranges and escapes
 * of a code point; outside one, an escape is of a metacharacter or a code point; a group is
 * `(?:`, never a lookaround, which grizzle's `str.regex` grammar refuses (`scalar/regex/parse.ts`);
 * a quantifier's counts are at most 255; and no `.`, no class shorthand, no backreference, no `\x`
 * and no `\u{…}`.
 *
 * @param pattern - The pattern.
 * @returns Each way it leaves the shared syntax.
 */
const outsideSharedSyntax = (pattern: string): readonly string[] => {
  const problems: string[] = [];
  const points = Array.from(pattern, String);
  let inClass = false;
  for (let at = 0; at < points.length; at += 1) {
    const point = points[at] ?? "";
    if (point === "\\") {
      const escape = escapeAt(points, at, inClass);
      problems.push(...escape.problems);
      at += escape.length;
    } else if (inClass) {
      inClass = point !== "]";
    } else if (point === "[") {
      inClass = true;
      if (points[at + 1] === "]") {
        problems.push(`an empty class at ${at}`);
      }
    } else if (point === ".") {
      problems.push(`a . at ${at}`);
    } else if (point === "(" && points[at + 1] === "?") {
      if (points[at + 2] !== ":") {
        problems.push(`a group (?${points[at + 2] ?? ""} at ${at}`);
      }
    } else if (point === "(") {
      problems.push(`a capturing group at ${at}`);
    } else if (point === "{") {
      const close = points.indexOf("}", at);
      const counts = points
        .slice(at + 1, close)
        .join("")
        .split(",")
        .filter((count) => count !== "")
        .map(Number);
      if (counts.some((count) => count > duplicateMax)) {
        problems.push(`a repetition count above ${duplicateMax} at ${at}`);
      }
    }
  }

  return problems;
};

describe("The shared syntax", () => {
  it("writes every domain the leaf resolves, under both readings, in the syntax PostgreSQL and JavaScript share", () => {
    const problems = leafDomains.flatMap(({ domain, where }) =>
      (["xsd", "exact"] as const).flatMap((reading) => {
        const { pattern } = Result.getOrThrow(compile(domain, reading));
        assert.instanceOf(new RegExp(pattern, patternFlags), RegExp);

        return outsideSharedSyntax(pattern).map((problem) => `${where} (${reading}): ${problem}`);
      }),
    );

    assert.isAbove(leafDomains.length, 150);
    assert.deepStrictEqual(problems, []);
  });
});

describe("xs:anyURI", () => {
  it("reads each of AU's vectors as reading 71 does, and as written with whitespace XSD collapses away", () => {
    const regex = cachedRegex(anyUriDomain, "xsd");
    const disagreements = anyUriVectors.flatMap(([value, valid]) =>
      [value, ` ${value}`, `\t${value}\n `, value.replaceAll(" ", " \r\n ")].flatMap((raw) =>
        regex.test(raw) === valid
          ? []
          : [`${spelled(raw)}: reading 71 ${valid ? "admits" : "refuses"} it`],
      ),
    );

    assert.strictEqual(anyUriVectors.length, 131);
    assert.deepStrictEqual(disagreements, []);
  });
});

/**
 * The enumeration values the box below draws from: one in each whitespace situation XML Schema
 * Part 2 §4.3.6 tells apart, plain, inner single space, leading space, inner double space and a
 * tab.
 */
const enumerationValues = ["a", "a b", " a", "a  b", "a\tb"] as const;

/**
 * Whether a value can be a value's normalized form under a whitespace class (XML Schema Part 2,
 * §4.3.6 whiteSpace): under `preserve` every value; under `replace` none holding a tab, line feed
 * or carriage return, which become spaces; under `collapse` neither those nor a leading, trailing
 * or repeated space, which collapse away.
 *
 * @param value - The value.
 * @param whiteSpace - The class.
 * @returns Whether some lexical form normalizes to it.
 */
const normalizedForm = (
  value: string,
  whiteSpace: "collapse" | "preserve" | "replace",
): boolean => {
  switch (whiteSpace) {
    case "preserve": {
      return true;
    }
    case "replace": {
      return !/[\t\n\r]/u.test(value);
    }
    case "collapse": {
      return !/[\t\n\r]/u.test(value) && value === value.trim() && !value.includes("  ");
    }
    default: {
      return whiteSpace satisfies never;
    }
  }
};

describe("An enumeration's reachable values", () => {
  it("compile exactly when one value can be a normalized form, every non-empty subset of 5 values under each whitespace class", () => {
    // Oracle: the specification as a checker, XML Schema Part 2 §4.3.6: a value no lexical form
    // normalizes to is never the value, so an enumeration of only such values admits nothing.
    // Bound: every non-empty subset of enumerationValues (31) under each class (3), 93 cases.
    const disagreements: string[] = [];
    for (const whiteSpace of ["preserve", "replace", "collapse"] as const) {
      for (let mask = 1; mask < 2 ** enumerationValues.length; mask += 1) {
        const values = enumerationValues.filter((_, at) => Math.floor(mask / 2 ** at) % 2 === 1);
        const compiled = compile(
          {
            _tag: "atomic",
            builtin: "string",
            facets: [
              { facet: "whiteSpace", value: whiteSpace },
              ...values.map((value): Facet => ({ facet: "enumeration", value })),
            ],
            patterns: [],
            primitive: "string",
          },
          "xsd",
        );
        const reachable = values.some((value) => normalizedForm(value, whiteSpace));
        const refused = Result.isFailure(compiled)
          ? compiled.failure._tag === "UnreadDefinition" &&
            compiled.failure.detail.startsWith("an enumeration none of whose values")
          : false;
        if (refused === reachable || (Result.isFailure(compiled) && !refused)) {
          disagreements.push(
            `${whiteSpace} ${JSON.stringify(values)}: ${Result.isFailure(compiled) ? compiled.failure.message : "compiled"}`,
          );
        }
      }
    }

    assert.deepStrictEqual(disagreements, []);
  });
});

/**
 * The length facets an exhaustive case states: each of `length`, `minLength` and `maxLength`
 * absent or a count from 0 to 3, consistent or not.
 */
interface LengthCase {
  readonly lengths: Readonly<Partial<Record<"length" | "maxLength" | "minLength", number>>>;
  readonly variety: "atomic" | "list";
}

/**
 * Whether a count is one every length facet of a case admits, as XML Schema Part 2 reads each facet
 * on its own (4.3.1.3, 4.3.2.3 and 4.3.3.3): the length equals `length`, is at least `minLength`
 * and at most `maxLength`.
 *
 * @param lengths - The case's length facets.
 * @param count - A length, in characters or list items.
 * @returns Whether every facet admits it.
 */
const lengthHolds = (lengths: LengthCase["lengths"], count: number): boolean =>
  (lengths.length === undefined || count === lengths.length) &&
  (lengths.minLength === undefined || count >= lengths.minLength) &&
  (lengths.maxLength === undefined || count <= lengths.maxLength);

describe("Length facets", () => {
  it.effect(
    "admit exactly the values of a length every length facet admits, and none where no length is admitted, never writing a quantifier whose least passes its most: every combination of length, minLength and maxLength, each absent or 0 to 3, on a string and on a list of NMTOKENs, exhausted",
    (ctx) =>
      // Oracle: the specification as a checker, XML Schema Part 2 4.3.1.3 to 4.3.3.3, each facet a
      // condition on a value's length (`lengthHolds`), every facet holding; JavaScript's regular
      // expression compiler, which refuses a quantifier such as `{3,2}`, as PostgreSQL's does.
      // The cases need not satisfy 4.3.1.4 or 4.3.2.4: the deriver refuses those, and the compiler
      // must read the facets it is given as the language they state, an empty one included.
      // Bound: 5^3 combinations under each of the 2 varieties, 250 cases, each judged on every
      // length 0 to 4.
      searched(
        ctx,
        exhaust(
          {
            caseHang: Duration.minutes(1),
            coverage: requiredInSpace<"admitted" | "crossed" | "list" | "length outside">([
              "admitted",
              "crossed",
              "length outside",
              "list",
            ]),
            generator: (source): LengthCase => {
              const variety = source.draw(element(["atomic", "list"] as const));
              const lengths: Partial<Record<"length" | "maxLength" | "minLength", number>> = {};
              for (const name of ["length", "minLength", "maxLength"] as const) {
                const count = source.draw(int(0, 4));
                if (count > 0) {
                  lengths[name] = count - 1;
                }
              }

              return { lengths, variety };
            },
            limit: 250,
            literal: Formatter.format,
            suite: "grammar/domains/lengths",
          },
          ({ lengths, variety }, c) =>
            Effect.sync(() => {
              const facets = (["length", "minLength", "maxLength"] as const).flatMap(
                (name): readonly Facet[] => {
                  const held = lengths[name];

                  return held === undefined ? [] : [{ facet: name, value: String(held) }];
                },
              );
              const domain: Domain =
                variety === "atomic"
                  ? {
                      _tag: "atomic",
                      builtin: "string",
                      facets: [{ facet: "whiteSpace", value: "preserve" }, ...facets],
                      patterns: [],
                      primitive: "string",
                    }
                  : {
                      _tag: "list",
                      facets: [{ facet: "whiteSpace", value: "collapse" }, ...facets],
                      item: Result.getOrThrow(builtinDomainOf("NMTOKEN")),
                      patterns: [],
                    };
              const counts = [0, 1, 2, 3, 4];
              const admitted = counts.filter((count) => lengthHolds(lengths, count));
              if (variety === "list") {
                c.note("list");
              }

              if (
                lengths.minLength !== undefined &&
                lengths.maxLength !== undefined &&
                lengths.minLength > lengths.maxLength
              ) {
                c.note("crossed");
              }

              const { length: exact, ...bounds } = lengths;
              if (exact !== undefined && !lengthHolds(bounds, exact)) {
                c.note("length outside");
              }

              const compiled = compile(domain, "exact");
              if (admitted.length === 0) {
                assert.isTrue(
                  Result.isFailure(compiled) &&
                    compiled.failure._tag === "UnreadDefinition" &&
                    compiled.failure.detail.includes("holds no value"),
                  `${Formatter.format(lengths)} admits no length, and compiled`,
                );

                return;
              }

              c.note("admitted");

              const regex = new RegExp(Result.getOrThrow(compiled).pattern, patternFlags);

              for (const count of counts) {
                const value =
                  variety === "atomic"
                    ? "a".repeat(count)
                    : Array.from({ length: count }, () => "a").join(" ");
                assert.strictEqual(
                  regex.test(value),
                  lengthHolds(lengths, count),
                  `${Formatter.format(lengths)} on ${JSON.stringify(value)}`,
                );
              }
            }),
        ),
      ),
    120_000,
  );
});

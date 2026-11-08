import { assert, describe, it } from "@effect/vitest";
import { drawn, explore } from "@grizzle/testing/explore";
import { noCoverage } from "@grizzle/testing/features";
import { array, element, weighted } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { completeShrink } from "@grizzle/testing/shrink";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Formatter, Result } from "effect";
import { anyUriPattern, patternFlags, translatePattern } from "#pantry/grammar/domains.ts";
import { builtinDomainOf } from "#pantry/vocab/derive/domains.ts";

/**
 * The timeout, in milliseconds, that this file's slower tests state, each itself or through its
 * describe: a hang guard, never a budget. Measured 2026-11-07: 3.2 s at a load average of 63 to 73,
 * its slowest test.
 */
const testTimeoutMs = 60_000;

/**
 * The anyURI pattern as the schema reads it: {@link anyUriPattern} through the one translation of
 * XSD's regular expressions, so the vectors and the interpreter judge what the runtime matches.
 */
const anyUri = new RegExp(Result.getOrThrow(translatePattern(anyUriPattern)), patternFlags);

/**
 * A parser over a string: from a start position, every position a match can end at.
 */
type Parser = (text: string, at: number) => ReadonlySet<number>;

/**
 * One character a predicate admits.
 *
 * @param admits - The predicate.
 * @returns The parser.
 */
const ch =
  (admits: (character: string) => boolean): Parser =>
  (text, at) =>
    at < text.length && admits(text.charAt(at)) ? new Set([at + 1]) : new Set();

/**
 * One of some characters.
 *
 * @param characters - The characters.
 * @returns The parser.
 */
const oneOf = (characters: string): Parser => ch((character) => characters.includes(character));

/**
 * A literal.
 *
 * @param literal - The text.
 * @returns The parser.
 */
const lit =
  (literal: string): Parser =>
  (text, at) =>
    text.startsWith(literal, at) ? new Set([at + literal.length]) : new Set();

/**
 * Any of some parsers.
 *
 * @param parsers - The alternatives.
 * @returns The parser.
 */
const alt =
  (...parsers: readonly Parser[]): Parser =>
  (text, at) =>
    new Set(parsers.flatMap((parser) => [...parser(text, at)]));

/**
 * Some parsers in sequence.
 *
 * @param parsers - The parsers.
 * @returns The parser.
 */
const seq =
  (...parsers: readonly Parser[]): Parser =>
  (text, at) => {
    let positions: ReadonlySet<number> = new Set([at]);

    for (const parser of parsers) {
      positions = new Set([...positions].flatMap((from) => [...parser(text, from)]));
    }

    return positions;
  };

/**
 * A parser repeated between bounds.
 *
 * @param parser - The parser.
 * @param min - The fewest repetitions.
 * @param max - The most, `Infinity` for unbounded.
 * @returns The parser.
 */
const rep =
  (parser: Parser, min = 0, max = Number.POSITIVE_INFINITY): Parser =>
  (text, at) => {
    const ends = new Set<number>(min === 0 ? [at] : []);
    let frontier: ReadonlySet<number> = new Set([at]);

    for (let count = 1; count <= max && frontier.size > 0; count += 1) {
      const next = new Set([...frontier].flatMap((from) => [...parser(text, from)]));
      const fresh = count >= min ? [...next].filter((end) => !ends.has(end)) : [...next];

      if (count >= min) {
        for (const end of next) {
          ends.add(end);
        }
      }

      frontier = new Set(max === Number.POSITIVE_INFINITY ? fresh : [...next]);
    }

    return ends;
  };

/**
 * A parser or nothing.
 *
 * @param parser - The parser.
 * @returns The parser.
 */
const opt = (parser: Parser): Parser => rep(parser, 0, 1);

/**
 * Whether XLink 1.0, section 5.4, escapes a code point: every non-ASCII one, and RFC 2396, section
 * 2.4.3's excluded characters but `#`, `%`, `[` and `]`.
 *
 * @param point - The code point.
 * @returns Whether it is escaped.
 */
const disallowed = (point: number): boolean =>
  point > 0x7f ||
  point <= 0x1f ||
  point === 0x7f ||
  point === 0x20 ||
  '<>"{}|\\^`'.includes(String.fromCodePoint(point));

/**
 * Escape a value as XLink 1.0, section 5.4, does: each disallowed character as the `%HH` of its
 * UTF-8 bytes.
 *
 * @param value - The value.
 * @returns The escaped value.
 */
const xlinkEscape = (value: string): string =>
  Array.from(value.matchAll(/./gsu), ([character = ""]) =>
    disallowed(character.codePointAt(0) ?? 0)
      ? [...new TextEncoder().encode(character)]
          .map((byte) => `%${byte.toString(16).toUpperCase().padStart(2, "0")}`)
          .join("")
      : character,
  ).join("");

/**
 * The groups before a dotted IPv4 tail: the text before it, without the colon that ends a group,
 * but keeping a `::` that ends it.
 *
 * @param head - The text before the dotted part, its last colon included.
 * @returns The groups' text.
 */
const headOf = (head: string): string => (head.endsWith("::") ? head : head.slice(0, -1));

/**
 * The colon-separated groups of one side of a `::`.
 *
 * @param part - The side.
 * @returns Its groups, none for an empty side.
 */
const groupsOf = (part: string): readonly string[] => (part === "" ? [] : part.split(":"));

/**
 * Whether a group is one to four hexadecimal digits.
 *
 * @param group - The group.
 * @returns Whether it is.
 */
const isHexGroup = (group: string): boolean => /^[0-9A-Fa-f]{1,4}$/u.test(group);

/**
 * RFC 2373, section 2.2's three text forms of an IPv6 address, checked as the prose states them:
 * `::` stands for one or more zero groups, and a dotted part's octets are 0 to 255 in 1 to 3
 * digits.
 *
 * @param text - The candidate.
 * @returns Whether it is one.
 */
const ipv6Prose = (text: string): boolean => {
  const dotted =
    /^(?<head>.*:)(?<a>[0-9]{1,3})\.(?<b>[0-9]{1,3})\.(?<c>[0-9]{1,3})\.(?<d>[0-9]{1,3})$/su.exec(
      text,
    );
  const v4 = dotted?.groups !== undefined;

  if (dotted?.groups !== undefined) {
    const { a, b, c, d } = dotted.groups;

    if ([a, b, c, d].some((octet) => Number(octet) > 255)) {
      return false;
    }
  }

  const head = dotted?.groups === undefined ? text : headOf(dotted.groups["head"] ?? "");
  const parts = head.split("::");
  const extra = v4 ? 2 : 0;

  if (parts.length > 2) {
    return false;
  }

  if (parts.length === 1) {
    const held = groupsOf(parts[0] ?? "");

    return held.every(isHexGroup) && held.length + extra === 8;
  }

  const held = [...groupsOf(parts[0] ?? ""), ...groupsOf(parts[1] ?? "")];

  return held.every(isHexGroup) && held.length + extra <= 7;
};

/**
 * An IPv6 address as RFC 2373's prose gives its text forms ({@link ipv6Prose}), as a parser: every
 * end a prefix of the rest that is one can stop at.
 *
 * @param text - The text.
 * @param at - Where the address starts.
 * @returns The ends.
 */
const ipv6Text: Parser = (text, at) =>
  new Set(
    Array.from({ length: text.length - at }, (_, offset) => at + offset + 1).filter((end) =>
      ipv6Prose(text.slice(at, end)),
    ),
  );

/**
 * RFC 2396, Appendix A, with RFC 2732, section 3's three changes, transliterated rule by rule: the
 * reference interpreter of spec reading 71, written apart from the pattern under test.
 */
const uriReference: Parser = (() => {
  const alpha = ch((character) => /^[A-Za-z]$/u.test(character));
  const digit = ch((character) => /^[0-9]$/u.test(character));
  const alphanum = alt(alpha, digit);
  const hex = ch((character) => /^[0-9A-Fa-f]$/u.test(character));
  const escaped = seq(lit("%"), hex, hex);
  const mark = oneOf("-_.!~*'()");
  const unreserved = alt(alphanum, mark);
  const reserved = oneOf(";/?:@&=+$,[]");
  const uric = alt(reserved, unreserved, escaped);
  const pchar = alt(unreserved, escaped, oneOf(":@&=+$,"));
  const segment = seq(rep(pchar), rep(seq(lit(";"), rep(pchar))));
  const pathSegments = seq(segment, rep(seq(lit("/"), segment)));
  const d13 = rep(digit, 1, 3);
  const ipv4 = seq(d13, lit("."), d13, lit("."), d13, lit("."), d13);
  const toplabel = alt(alpha, seq(alpha, rep(alt(alphanum, lit("-"))), alphanum));
  const domainlabel = alt(alphanum, seq(alphanum, rep(alt(alphanum, lit("-"))), alphanum));
  const hostname = seq(rep(seq(domainlabel, lit("."))), toplabel, opt(lit(".")));
  const hex4 = rep(hex, 1, 4);
  const hexseq = seq(hex4, rep(seq(lit(":"), hex4)));
  const hexpart = alt(hexseq, seq(hexseq, lit("::"), opt(hexseq)), seq(lit("::"), opt(hexseq)));
  const ipv6Rule = seq(hexpart, opt(seq(lit(":"), ipv4)));
  const ipv6Reference = seq(lit("["), alt(ipv6Rule, ipv6Text), lit("]"));
  const host = alt(hostname, ipv4, ipv6Reference);
  const hostport = seq(host, opt(seq(lit(":"), rep(digit))));
  const userinfo = rep(alt(unreserved, escaped, oneOf(";:&=+$,")));
  const server = opt(seq(opt(seq(userinfo, lit("@"))), hostport));
  const regName = rep(alt(unreserved, escaped, oneOf("$,;:@&=+")), 1);
  const authority = alt(server, regName);
  const scheme = seq(alpha, rep(alt(alpha, digit, oneOf("+-."))));
  const relSegment = rep(alt(unreserved, escaped, oneOf(";@&=+$,")), 1);
  const absPath = seq(lit("/"), pathSegments);
  const netPath = seq(lit("//"), authority, opt(absPath));
  const relPath = seq(relSegment, opt(absPath));
  const uricNoSlash = alt(unreserved, escaped, oneOf(";?:@&=+$,"));
  const opaquePart = seq(uricNoSlash, rep(uric));
  const hierPart = seq(alt(netPath, absPath), opt(seq(lit("?"), rep(uric))));
  const relativeUri = seq(alt(netPath, absPath, relPath), opt(seq(lit("?"), rep(uric))));
  const absoluteUri = seq(scheme, lit(":"), alt(hierPart, opaquePart));

  return seq(opt(alt(absoluteUri, relativeUri)), opt(seq(lit("#"), rep(uric))));
})();

/**
 * Whether a collapsed value is in `xs:anyURI`'s lexical space, by the interpreter.
 *
 * @param value - The value.
 * @returns Whether it is.
 */
const specified = (value: string): boolean => {
  const escapedValue = xlinkEscape(value);

  return uriReference(escapedValue, 0).has(escapedValue.length);
};

/**
 * The 131 vectors of the anyURI research (`docs/research/anyuri.md`), each with the verdict the
 * reading's grammar gives by hand: the table oracle.
 */
const vectors: readonly (readonly [value: string, valid: boolean, note: string])[] = [
  // basics
  ["", true, "empty reference (RFC 2396 4.2)"],
  ["a", true, "one-segment relative path"],
  ["images/sign.png", true, "relative path"],
  ["https://x/y.png", true, "absolute"],
  ["ok/path?q#f", true, "path, query, fragment"],
  ["#", true, "empty fragment"],
  ["#f", true, "fragment only"],
  ["../a/./b", true, "dot segments"],
  ["urn:isbn:0451450523", true, "opaque"],
  ["mailto:a@b.example", true, "opaque"],
  ["x:'quoted'", true, "opaque with marks"],
  ["http://192.0.2.16:80/", true, "IPv4 host, port"],
  ["http://u:p@h:1/", true, "userinfo, port"],
  // characters XLink escapes
  ["not a uri", true, "spaces escape to %20"],
  ["http://example.com/a b", true, "space in path"],
  ["http://example.com/ä", true, "non-ASCII in path"],
  ["http://usér@höst/", true, "non-ASCII in userinfo and host"],
  ["a{b}|c", true, "unwise characters escape"],
  ['a<b>"c\\d^e`f', true, "delims and unwise escape"],
  ["http://a b/", true, "space in host (reg_name)"],
  ["ht tp://x", false, "space in scheme: escaped, then ':' in a relative first segment"],
  // percent
  ["%41", true, "escaped"],
  ["http://example.com/a%20b", true, "escaped"],
  ["a%zz", false, "% not followed by two hex digits"],
  ["a%", false, "lone %"],
  ["a%4", false, "% and one hex digit"],
  ["%zz", false, "% not followed by two hex digits"],
  ["100%", false, "trailing %"],
  ["http://h%41/", true, "escaped in host"],
  ["http://h%/", false, "lone % in host"],
  // number sign
  ["a#b#c", false, "second #"],
  ["a:b#c#d", false, "second #"],
  ["##", false, "second #"],
  // scheme
  ["1a:b", false, "scheme must start with a letter; ':' in first relative segment"],
  ["a:b", true, "opaque"],
  ["a+b.c-d:x", true, "scheme characters"],
  ["h%74tp://x", false, "% in scheme"],
  ["./a:b", true, "colon after the first segment"],
  ["a/b:c", true, "colon in a later segment"],
  ["a?b:c", true, "colon in query"],
  // nothing after the scheme (RFC 2396 has no empty path; RFC 3986 D.2 added it)
  ["foo:", false, "absoluteURI needs hier_part or a non-empty opaque_part"],
  ["about:", false, "as foo:"],
  ["foo:#f", false, "as foo:, with a fragment"],
  ["foo:?q", true, "opaque_part starting with ?"],
  ["foo:/", true, "abs_path"],
  ["foo://", true, "net_path, empty server"],
  // a query with no path (RFC 2396 relativeURI needs a path)
  ["?", false, "relativeURI needs net_path, abs_path or rel_path"],
  ["?q", false, "as ?"],
  ["?q#f", false, "as ?"],
  ["?#", false, "as ?"],
  ["a?", true, "empty query after a path"],
  // square brackets (RFC 2732 adds them to reserved, so to uric)
  ["#[x]", true, "fragment is *uric"],
  ["a#[x]", true, "fragment is *uric"],
  ["a#xpointer(/a[1])", true, "XPointer-style fragment"],
  ["a?[", true, "query is *uric"],
  ["p?a[0]=1", true, "query is *uric"],
  ["http://h/p?a[]=1", true, "query is *uric"],
  ["http://h/p?a=[1]#[2]", true, "query and fragment"],
  ["foo:a[b]", true, "opaque_part: *uric after the first character"],
  ["urn:x:a[1]", true, "opaque_part"],
  ["foo:?[x]", true, "opaque_part starting with ?"],
  ["mailto:a@b?subject=[x]", true, "opaque_part"],
  ["foo:[x]", false, "uric_no_slash excludes ["],
  ["foo:/a[b]", false, "pchar excludes ["],
  ["http://h/[x]", false, "pchar excludes ["],
  ["a/[x]", false, "pchar excludes ["],
  ["[x]", false, "rel_segment excludes ["],
  ["a[b", false, "rel_segment excludes ["],
  ["/a]b", false, "pchar excludes ]"],
  ["http://h[x]/", false, "brackets only around a whole host"],
  ["http://[a]@h/", false, "userinfo excludes ["],
  // authority: RFC 2396's reg_name admits ":" and "@" anywhere
  ["http://h:/", true, "port = *digit; also reg_name"],
  ["http://a:/", true, "as above"],
  ["http://h:80/", true, "port"],
  ["http://h:abc/", true, "reg_name 'h:abc'"],
  ["http://a:b/", true, "reg_name 'a:b'"],
  ["http://h:8 0/", true, "reg_name 'h:8%200'"],
  ["http://h:80:90/", true, "reg_name"],
  ["http://a@b@c/", true, "reg_name"],
  ["http://@/", true, "reg_name '@'"],
  ["http://:80/", true, "reg_name ':80'"],
  ["http:///p", true, "empty server"],
  ["http://", true, "empty server"],
  ["//", true, "net_path, empty server"],
  ["///", true, "abs_path"],
  ["//h:abc/", true, "relative net_path, reg_name"],
  ["/a//b", true, "empty segment"],
  ["a//b", true, "empty segment"],
  ["http://h:99999999999999999999/", true, "port = *digit, unbounded"],
  ["http://1.2.3.4x/", true, "reg_name"],
  ["http://999.1.1.1/", true, "reg_name"],
  ["http://-a-/", true, "reg_name"],
  // IP literals
  ["http://[::1]/", true, "IPv6"],
  ["http://[::1]:/", true, "IPv6, empty port"],
  ["http://[::1]:80/", true, "IPv6, port"],
  ["http://u@[::1]:80/p", true, "userinfo, IPv6, port"],
  ["//[::1]/", true, "relative net_path, IPv6"],
  ["http://[2001:db8::7]/c=GB", true, "IPv6"],
  ["http://[::1", false, "unclosed"],
  ["http://[::1]x/", false, "junk after the literal"],
  ["http://[::1]:abc/", false, "port digits only after a literal"],
  ["http://[v1.x]/", false, "IPvFuture is RFC 3986's, not RFC 2732's"],
  ["http://[v1.fe]/", false, "IPvFuture"],
  ["http://[V7.a:b]/", false, "IPvFuture"],
  ["http://[v.x]/", false, "IPvFuture without a version"],
  ["http://[]/", false, "empty literal"],
  ["http://[zz]/", false, "not hex"],
  ["http://[xyz]/", false, "not hex"],
  ["http://[ ]/", false, "space in literal"],
  ["http://[::1 ]/", false, "space in literal"],
  ["http://[a#b]/", false, "# in literal"],
  ["http://[[]/", false, "[ in literal"],
  ["http://[%41]/", false, "escaped in literal"],
  ["http://[1.2.3.4]/", false, "IPv4 alone is not an IPv6address"],
  ["http://[1]/", true, "RFC 2373 Appendix B: hexseq of one hex4"],
  ["http://[1:2]/", true, "Appendix B: hexseq"],
  ["http://[1:2:3:4:5:6:7:8:9]/", true, "Appendix B: hexseq has no count"],
  ["http://[12345::]/", false, "hex4 is at most four digits"],
  ["http://[1::2::3]/", false, "one :: only"],
  ["http://[1:2:3:4:5:6:7:8]/", true, "preferred form"],
  ["http://[1:2:3:4:5:6:7::]/", true, ":: for one group"],
  ["http://[::]/", true, "unspecified"],
  ["http://[::13.1.68.3]/", true, "RFC 2373 2.2 example; Appendix B cannot derive it"],
  ["http://[::FFFF:129.144.52.38]/", true, "RFC 2373 2.2 example"],
  ["http://[1::1.2.3.4]/", true, "2.2 compressed form with IPv4"],
  ["http://[1:2:3:4:5::1.2.3.4]/", true, "2.2: :: for one group"],
  ["http://[1:2:3:4:5:6::1.2.3.4]/", false, "nine pieces; Appendix B cannot derive it"],
  ["http://[::999.1.1.1]/", false, "2.2 needs 8-bit values; Appendix B cannot derive ::d.d.d.d"],
  ["http://[::ffff:999.1.1.1]/", true, "Appendix B: IPv4address is 1*3DIGIT"],
  ["http://[::ffff:01.2.3.4]/", true, "Appendix B: leading zero"],
  ["http://[0:0:0:0:0:0:13.1.68.3]/", true, "RFC 2373 2.2 example"],
];

/**
 * The tokens a fuzzed value is drawn from: those that matter to the grammar, IP literals and
 * escapes among them.
 */
const tokens = [
  "a",
  "Z",
  "v",
  "0",
  "1",
  "9",
  "f",
  "-",
  ".",
  "_",
  "~",
  "!",
  "$",
  "&",
  "'",
  "(",
  ")",
  "*",
  "+",
  ",",
  ";",
  "=",
  ":",
  "@",
  "/",
  "?",
  "#",
  "[",
  "]",
  "%",
  "%4",
  "%41",
  "%zz",
  "é",
  "{",
  "|",
  "::",
  "1.2.3.4",
  "255",
  "256",
  "http:",
  "//",
  "ffff",
  "v1.",
  "[::1]",
  "]:",
  ":80",
] as const;

/**
 * The tokens of a fuzzed IP literal.
 */
const ipTokens = [
  "1",
  "ff",
  "ffff",
  "12345",
  ":",
  "::",
  ".",
  "1.2.3.4",
  "255.0.0.1",
  "999",
  "x",
  "0",
  "01",
] as const;

/**
 * A collapsed candidate: a run of grammar tokens, or a bracketed IP literal between a scheme or
 * authority start and a tail, a third of the time.
 */
const candidate: Gen<string> = weighted([
  [2, (source) => source.draw(array(element(tokens), { max: 12, min: 0 })).join("")],
  [
    1,
    (source) =>
      `${source.draw(element(["http://", "//", "a:", "http://u@", "x://"]))}[${source
        .draw(array(element(ipTokens), { max: 10, min: 0 }))
        .join("")}]${source.draw(element(["", "/", ":", ":8", "/p?q", "#f", "x", "]"]))}`,
  ],
]);

describe("vocab/derive/domains.ts, xs:anyURI", () => {
  it("gives each vector the verdict reading 71's grammar gives by hand", () => {
    const wrong = vectors.filter(([value, valid]) => anyUri.test(value) !== valid);

    if (wrong.length > 0) {
      throw new Error(`the pattern departs from the table: ${Formatter.format(wrong)}`);
    }
  });

  it.effect(
    "agrees with the RFC 2396 and RFC 2732 interpreter on every fuzzed value",
    (ctx) =>
      searched(
        ctx,
        explore(
          {
            caseHang: Duration.minutes(1),
            concurrency: 1,
            coverage: noCoverage,
            draw: drawn(candidate),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "an interpreter of RFC 2396's and RFC 2732's URI-reference grammar (specified), not the pattern",
            },
            runs: 4000,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "vocab/domains-anyuri",
          },
          (value) =>
            Effect.sync(() => {
              if (anyUri.test(value) !== specified(value)) {
                throw new Error(
                  `the pattern ${anyUri.test(value) ? "admits" : "refuses"} ${JSON.stringify(value)}, which the grammar ${specified(value) ? "admits" : "refuses"}`,
                );
              }
            }),
        ),
      ),
    testTimeoutMs,
  );

  it("is the lexical pattern of the anyURI built-in's domain, which collapses its value", () => {
    assert.deepStrictEqual(Result.getOrThrow(builtinDomainOf("anyURI")), {
      _tag: "atomic",
      builtin: "anyURI",
      facets: [{ facet: "whiteSpace", value: "collapse" }],
      patterns: [[anyUriPattern]],
      primitive: "anyURI",
    });
  });
});

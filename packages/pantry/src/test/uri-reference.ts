/**
 * The law oracle's own recogniser of RFC 3986's `URI-reference` (spec reading 131): Appendix A's
 * collected ABNF, rule by rule, run as a grammar, not as a regular expression. Namespaces in XML
 * 1.0 (Third Edition) §3 asks a namespace declaration's normalized value to be "either a URI
 * reference … or an empty string", and its §2.1 names RFC 3986, so the oracle's "Namespace name"
 * law reads this recogniser, and `NamespaceUri`'s pattern (`#pantry/qti/chardata.ts`) is judged
 * against it in `chardata.oracle.test.ts`, never against itself.
 *
 * Each rule maps a text and a start offset to every offset one of its derivations ends at, so an
 * alternation keeps every branch and a repetition every count, as ABNF's own semantics does: no
 * branch is tried first and none is pruned. A quoted string matches without regard to ASCII case
 * (RFC 5234 §2.3), which RFC 3986 relies on for `"v"` in `IPvFuture`; every other literal it quotes
 * holds no letter. A character outside US-ASCII matches no terminal, since RFC 3986's grammar is
 * over US-ASCII alone (§2).
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc3986#appendix-A | RFC 3986, Appendix A}
 * @see {@link https://www.rfc-editor.org/rfc/rfc5234#section-2.3 | RFC 5234, §2.3 Terminal Values}
 * @see {@link https://www.w3.org/TR/xml-names/#ns-decl | Namespaces in XML 1.0, §3}
 */

/**
 * A grammar rule: every offset a derivation of it from `at` ends at.
 */
type Rule = (text: string, at: number) => ReadonlySet<number>;

/**
 * No end: a rule that does not match.
 */
const none: ReadonlySet<number> = new Set();

/**
 * A terminal: one character whose code is within one of the ranges, as ABNF's `%x41-5A`.
 *
 * @param ranges - The inclusive code ranges.
 * @returns The rule.
 */
const range =
  (...ranges: readonly (readonly [number, number])[]): Rule =>
  (text, at) => {
    const code = text.codePointAt(at) ?? -1;

    return at < text.length && ranges.some(([low, high]) => code >= low && code <= high)
      ? new Set([at + 1])
      : none;
  };

/**
 * Fold a text's ASCII capitals to small letters, and nothing else: ABNF's case-insensitivity is
 * US-ASCII's (RFC 5234 §2.3), so no other character folds.
 *
 * @param text - The text.
 * @returns The text with each of `A` to `Z` as its small letter.
 */
const asciiLower = (text: string): string =>
  text.replaceAll(/[A-Z]/gu, (capital) => capital.toLowerCase());

/**
 * A quoted string, matched without regard to ASCII case (RFC 5234 §2.3).
 *
 * @param word - The string.
 * @returns The rule.
 */
const quoted =
  (word: string): Rule =>
  (text, at) =>
    at + word.length <= text.length &&
    asciiLower(text.slice(at, at + word.length)) === asciiLower(word)
      ? new Set([at + word.length])
      : none;

/**
 * Concatenation: each rule from every end of the one before.
 *
 * @param rules - The rules, in order.
 * @returns The rule.
 */
const sequence =
  (...rules: readonly Rule[]): Rule =>
  (text, at) => {
    let ends: ReadonlySet<number> = new Set([at]);
    for (const rule of rules) {
      ends = new Set([...ends].flatMap((end) => [...rule(text, end)]));
    }

    return ends;
  };

/**
 * Alternation, `/`: every end of every branch.
 *
 * @param rules - The branches.
 * @returns The rule.
 */
const either =
  (...rules: readonly Rule[]): Rule =>
  (text, at) =>
    new Set(rules.flatMap((rule) => [...rule(text, at)]));

/**
 * Repetition, `<min>*<max>element`: every end of `min` to `max` matches in a row. Past `min`, an
 * offset already reached is not followed again, so a rule that matches empty still ends.
 *
 * @param rule - The element.
 * @param min - The least count.
 * @param max - The greatest count, unbounded by default.
 * @returns The rule.
 */
const repeat =
  (rule: Rule, min: number, max = Number.POSITIVE_INFINITY): Rule =>
  (text, at) => {
    const ends = new Set<number>(min === 0 ? [at] : []);
    let frontier: ReadonlySet<number> = new Set([at]);
    for (let count = 1; count <= max && frontier.size > 0; count += 1) {
      const reached = new Set([...frontier].flatMap((end) => [...rule(text, end)]));
      frontier = count < min ? reached : new Set([...reached].filter((end) => !ends.has(end)));
      if (count >= min) {
        for (const end of reached) {
          ends.add(end);
        }
      }
    }

    return ends;
  };

/**
 * An optional element, `[ element ]`.
 *
 * @param rules - The element's concatenation.
 * @returns The rule.
 */
const optional = (...rules: readonly Rule[]): Rule => repeat(sequence(...rules), 0, 1);

/**
 * `ALPHA = %x41-5A / %x61-7A`, RFC 5234 Appendix B.1.
 */
const alpha = range([0x41, 0x5a], [0x61, 0x7a]);

/**
 * `DIGIT = %x30-39`, RFC 5234 Appendix B.1.
 */
const digit = range([0x30, 0x39]);

/**
 * `HEXDIG = DIGIT / "A" / "B" / "C" / "D" / "E" / "F"`, RFC 5234 Appendix B.1, each letter of
 * either case.
 */
const hexdig = either(digit, ...["A", "B", "C", "D", "E", "F"].map(quoted));

/**
 * `unreserved = ALPHA / DIGIT / "-" / "." / "_" / "~"`.
 */
const unreserved = either(alpha, digit, ...["-", ".", "_", "~"].map(quoted));

/**
 * `sub-delims = "!" / "$" / "&" / "'" / "(" / ")" / "*" / "+" / "," / ";" / "="`.
 */
const subDelims = either(...["!", "$", "&", "'", "(", ")", "*", "+", ",", ";", "="].map(quoted));

/**
 * `pct-encoded = "%" HEXDIG HEXDIG`.
 */
const pctEncoded = sequence(quoted("%"), hexdig, hexdig);

/**
 * `pchar = unreserved / pct-encoded / sub-delims / ":" / "@"`.
 */
const pchar = either(unreserved, pctEncoded, subDelims, quoted(":"), quoted("@"));

/**
 * `scheme = ALPHA *( ALPHA / DIGIT / "+" / "-" / "." )`.
 */
const scheme = sequence(
  alpha,
  repeat(either(alpha, digit, quoted("+"), quoted("-"), quoted(".")), 0),
);

/**
 * `userinfo = *( unreserved / pct-encoded / sub-delims / ":" )`.
 */
const userinfo = repeat(either(unreserved, pctEncoded, subDelims, quoted(":")), 0);

/**
 * `dec-octet = DIGIT / %x31-39 DIGIT / "1" 2DIGIT / "2" %x30-34 DIGIT / "25" %x30-35`.
 */
const decOctet = either(
  digit,
  sequence(range([0x31, 0x39]), digit),
  sequence(quoted("1"), digit, digit),
  sequence(quoted("2"), range([0x30, 0x34]), digit),
  sequence(quoted("25"), range([0x30, 0x35])),
);

/**
 * `IPv4address = dec-octet "." dec-octet "." dec-octet "." dec-octet`.
 */
const ipv4Address = sequence(
  decOctet,
  quoted("."),
  decOctet,
  quoted("."),
  decOctet,
  quoted("."),
  decOctet,
);

/**
 * `h16 = 1*4HEXDIG`.
 */
const h16 = repeat(hexdig, 1, 4);

/**
 * `h16 ":"`, the unit IPv6address repeats.
 */
const h16Colon = sequence(h16, quoted(":"));

/**
 * `ls32 = ( h16 ":" h16 ) / IPv4address`.
 */
const ls32 = either(sequence(h16, quoted(":"), h16), ipv4Address);

/**
 * `"::"`, the elision of IPv6address.
 */
const elided = quoted("::");

/**
 * `IPv6address, its nine alternatives in the Appendix's order`.
 */
const ipv6Address = either(
  sequence(repeat(h16Colon, 6, 6), ls32),
  sequence(elided, repeat(h16Colon, 5, 5), ls32),
  sequence(optional(h16), elided, repeat(h16Colon, 4, 4), ls32),
  sequence(optional(repeat(h16Colon, 0, 1), h16), elided, repeat(h16Colon, 3, 3), ls32),
  sequence(optional(repeat(h16Colon, 0, 2), h16), elided, repeat(h16Colon, 2, 2), ls32),
  sequence(optional(repeat(h16Colon, 0, 3), h16), elided, h16, quoted(":"), ls32),
  sequence(optional(repeat(h16Colon, 0, 4), h16), elided, ls32),
  sequence(optional(repeat(h16Colon, 0, 5), h16), elided, h16),
  sequence(optional(repeat(h16Colon, 0, 6), h16), elided),
);

/**
 * `IPvFuture = "v" 1*HEXDIG "." 1*( unreserved / sub-delims / ":" )`.
 */
const ipvFuture = sequence(
  quoted("v"),
  repeat(hexdig, 1),
  quoted("."),
  repeat(either(unreserved, subDelims, quoted(":")), 1),
);

/**
 * `IP-literal = "[" ( IPv6address / IPvFuture ) "]"`.
 */
const ipLiteral = sequence(quoted("["), either(ipv6Address, ipvFuture), quoted("]"));

/**
 * `reg-name = *( unreserved / pct-encoded / sub-delims )`.
 */
const regName = repeat(either(unreserved, pctEncoded, subDelims), 0);

/**
 * `host = IP-literal / IPv4address / reg-name`.
 */
const host = either(ipLiteral, ipv4Address, regName);

/**
 * `port = *DIGIT`.
 */
const port = repeat(digit, 0);

/**
 * `authority = [ userinfo "@" ] host [ ":" port ]`.
 */
const authority = sequence(optional(userinfo, quoted("@")), host, optional(quoted(":"), port));

/**
 * `segment = *pchar`.
 */
const segment = repeat(pchar, 0);

/**
 * `segment-nz = 1*pchar`.
 */
const segmentNz = repeat(pchar, 1);

/**
 * `segment-nz-nc = 1*( unreserved / pct-encoded / sub-delims / "@" )`.
 */
const segmentNzNc = repeat(either(unreserved, pctEncoded, subDelims, quoted("@")), 1);

/**
 * `*( "/" segment )`, the tail every path but path-empty ends with.
 */
const slashSegments = repeat(sequence(quoted("/"), segment), 0);

/**
 * `path-abempty = *( "/" segment )`.
 */
const pathAbempty = slashSegments;

/**
 * `path-absolute = "/" [ segment-nz *( "/" segment ) ]`.
 */
const pathAbsolute = sequence(quoted("/"), optional(segmentNz, slashSegments));

/**
 * `path-noscheme = segment-nz-nc *( "/" segment )`.
 */
const pathNoscheme = sequence(segmentNzNc, slashSegments);

/**
 * `path-rootless = segment-nz *( "/" segment )`.
 */
const pathRootless = sequence(segmentNz, slashSegments);

/**
 * `path-empty = 0<pchar>`.
 */
const pathEmpty = repeat(pchar, 0, 0);

/**
 * `query = *( pchar / "/" / "?" )`.
 */
const query = repeat(either(pchar, quoted("/"), quoted("?")), 0);

/**
 * `fragment = *( pchar / "/" / "?" )`.
 */
const fragment = repeat(either(pchar, quoted("/"), quoted("?")), 0);

/**
 * `hier-part = "//" authority path-abempty / path-absolute / path-rootless / path-empty`.
 */
const hierPart = either(
  sequence(quoted("//"), authority, pathAbempty),
  pathAbsolute,
  pathRootless,
  pathEmpty,
);

/**
 * `URI = scheme ":" hier-part [ "?" query ] [ "#" fragment ]`.
 */
const uri = sequence(
  scheme,
  quoted(":"),
  hierPart,
  optional(quoted("?"), query),
  optional(quoted("#"), fragment),
);

/**
 * `relative-part = "//" authority path-abempty / path-absolute / path-noscheme / path-empty`.
 */
const relativePart = either(
  sequence(quoted("//"), authority, pathAbempty),
  pathAbsolute,
  pathNoscheme,
  pathEmpty,
);

/**
 * `relative-ref = relative-part [ "?" query ] [ "#" fragment ]`.
 */
const relativeRef = sequence(
  relativePart,
  optional(quoted("?"), query),
  optional(quoted("#"), fragment),
);

/**
 * `URI-reference = URI / relative-ref`.
 */
const uriReference = either(uri, relativeRef);

/**
 * The texts already judged, since a package declares few namespace names many times.
 */
const judged = new Map<string, boolean>();

/**
 * Decide whether a text is an RFC 3986 `URI-reference`, the whole text one derivation of it.
 *
 * @param text - The text, a namespace declaration's normalized value.
 * @returns Whether some derivation of `URI-reference` spans it; the empty text is one, a
 *   `relative-ref` of an empty path.
 */
export const isUriReference = (text: string): boolean => {
  const held = judged.get(text);
  if (held !== undefined) {
    return held;
  }

  const spans = uriReference(text, 0).has(text.length);
  judged.set(text, spans);

  return spans;
};

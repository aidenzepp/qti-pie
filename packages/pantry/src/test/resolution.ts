/**
 * The law oracle's resolver of an href in a package (readings 102 and 103), for tests only: a
 * second implementation of RFC 3986's reference resolution, written from the RFC's own algorithms
 * and never from the importer's (`#pantry/import/overlays/package.ts` `resolveIn`), so the two are
 * a differential. No import path reaches it, which `src/grammar/purity.test.ts` holds.
 *
 * It resolves as the RFC states it, over text: the document's path is embedded in an absolute base
 * URI below a package root of its own ({@link resolve}); each `xml:base` in scope, outermost first,
 * and then the href are read as RFC 3986's relative references, the percent-encodings of unreserved
 * characters decoded first (§6.2.2.2, so `%2E` is a `.`), their paths merged with the base's
 * (§5.2.3) and their dot segments removed by the five rules of §5.2.4; a result outside the package
 * root is external, and one inside it is its path, each segment percent-decoded as UTF-8 by a
 * decoder of its own (§2.1, §2.5).
 *
 * What it shares with the importer is the reading, not the code: the order in which an href is
 * judged external, its own document's or under a stated limit, which reading 102 states.
 *
 * @see {@link https://www.rfc-editor.org/rfc/rfc3986#section-5.2 | RFC 3986, §5.2}
 */

/**
 * The whitespace class an href's attribute type reads its value under (XML Schema Part 2, §4.3.6).
 */
export type OracleWhiteSpace = "collapse" | "preserve" | "replace";

/**
 * The stated limits an href meets (reading 102), named as the importer's are.
 */
export type OracleLimit =
  | "backslash"
  | "colon"
  | "control"
  | "octets"
  | "percent"
  | "separator"
  | "srcset";

/**
 * How an href resolves: in the package to a path, outside it, to its own document, or under a
 * limit.
 */
export type OracleResolution =
  | { readonly path: string; readonly scope: "entry" }
  | { readonly scope: "document" | "external" }
  | { readonly limit: OracleLimit; readonly scope: "unresolved" };

/**
 * The XML whitespace characters (XML 1.0, production S).
 */
const xmlSpace: ReadonlySet<string> = new Set([" ", "\t", "\n", "\r"]);

/**
 * Read a value by its whitespace class and set aside the spaces around it: `collapse` joins its
 * runs of non-whitespace with one space each, `replace` writes each tab, line feed and carriage
 * return as a space, and `preserve` keeps the inside as written.
 *
 * @param lexical - The attribute's lexical form.
 * @param whiteSpace - The class.
 * @returns The value.
 */
export const oracleValueOf = (lexical: string, whiteSpace: OracleWhiteSpace): string => {
  // oxlint-disable-next-line typescript/no-misused-spread -- XML Schema's whitespace step reads a value character by character (Part 2, 4.3.6), its code points, which spreading the string yields.
  const characters = [...lexical];
  if (whiteSpace === "collapse") {
    const words: string[] = [];
    let word = "";
    for (const character of characters) {
      if (xmlSpace.has(character)) {
        if (word !== "") {
          words.push(word);
        }

        word = "";
      } else {
        word += character;
      }
    }
    if (word !== "") {
      words.push(word);
    }

    return words.join(" ");
  }

  const read =
    whiteSpace === "replace"
      ? characters.map((character) => (xmlSpace.has(character) ? " " : character))
      : characters;
  let first = 0;
  let last = read.length;
  while (first < last && xmlSpace.has(read[first] ?? "")) {
    first += 1;
  }
  while (last > first && xmlSpace.has(read[last - 1] ?? "")) {
    last -= 1;
  }

  return read.slice(first, last).join("");
};

/**
 * Whether a character is an ASCII letter, RFC 3986's `ALPHA`.
 *
 * @param c - The character.
 * @returns Whether it is.
 */
const isAlpha = (c: string): boolean => (c >= "a" && c <= "z") || (c >= "A" && c <= "Z");

/**
 * Whether a character is an ASCII digit, RFC 3986's `DIGIT`.
 *
 * @param c - The character.
 * @returns Whether it is.
 */
const isDigit = (c: string): boolean => c >= "0" && c <= "9";

/**
 * Whether a character is a hexadecimal digit, RFC 3986's `HEXDIG`, of either case.
 *
 * @param c - The character.
 * @returns Whether it is.
 */
const isHex = (c: string): boolean =>
  isDigit(c) || (c >= "a" && c <= "f") || (c >= "A" && c <= "F");

/**
 * Whether an href begins with a scheme (RFC 3986, §3.1): `ALPHA *( ALPHA / DIGIT / "+" / "-" /
 * "." ) ":"`, read character by character.
 *
 * @param value - The href.
 * @returns Whether it does.
 */
const hasScheme = (value: string): boolean => {
  if (!isAlpha(value.charAt(0))) {
    return false;
  }

  for (const c of value.slice(1)) {
    if (c === ":") {
      return true;
    }

    if (!(isAlpha(c) || isDigit(c) || c === "+" || c === "-" || c === ".")) {
      return false;
    }
  }

  return false;
};

/**
 * A relative reference's parts (RFC 3986, Appendix B, its regular expression with no scheme): an
 * authority after `//`, a path, and what follows them.
 */
interface Relative {
  readonly authority: boolean;
  readonly path: string;
}

/**
 * Parse an href with no scheme by RFC 3986's Appendix B.
 *
 * @param value - The href.
 * @returns Its authority's presence and its path.
 */
const relativeOf = (value: string): Relative => {
  const parts = /^(?<authority>\/\/[^/?#]*)?(?<path>[^?#]*)/su.exec(value)?.groups;

  return { authority: parts?.["authority"] !== undefined, path: parts?.["path"] ?? "" };
};

/**
 * Name the limit a written path meets, read character by character: a `%` not followed by two
 * hexadecimal digits (RFC 3986, §2.1), a backslash, a tab, line feed or carriage return, or a `:`
 * in its first segment (§4.2, `path-noscheme`).
 *
 * @param path - The path of a relative reference.
 * @returns The limit, or none.
 */
const limitOfPath = (path: string): OracleLimit | undefined => {
  // oxlint-disable-next-line typescript/no-misused-spread -- RFC 3986 reads a reference character by character, so a percent sign and its two digits are three code points, which spreading the string yields.
  const characters = [...path];
  for (const [at, c] of characters.entries()) {
    if (c === "%" && !(isHex(characters[at + 1] ?? "") && isHex(characters[at + 2] ?? ""))) {
      return "percent";
    }
  }

  if (characters.includes("\\")) {
    return "backslash";
  }

  if (characters.some((c) => c === "\t" || c === "\n" || c === "\r")) {
    return "control";
  }

  const slash = path.indexOf("/");

  return (slash === -1 ? path : path.slice(0, slash)).includes(":") ? "colon" : undefined;
};

/**
 * The unreserved characters (RFC 3986, §2.3), whose percent-encoding is the character itself.
 *
 * @param byte - An octet.
 * @returns Whether it encodes `ALPHA`, `DIGIT`, `-`, `.`, `_` or `~`.
 */
const isUnreserved = (byte: number): boolean => {
  const c = String.fromCodePoint(byte);

  return isAlpha(c) || isDigit(c) || c === "-" || c === "." || c === "_" || c === "~";
};

/**
 * Decode the percent-encodings of unreserved characters (RFC 3986, §6.2.2.2), leaving every other
 * percent-encoding as written.
 *
 * @param text - A path whose every `%` starts a percent-encoding.
 * @returns The path, normalized.
 */
const normalized = (text: string): string => {
  let out = "";
  for (let at = 0; at < text.length; at += 1) {
    const c = text.charAt(at);
    const byte = c === "%" ? Number.parseInt(text.slice(at + 1, at + 3), 16) : Number.NaN;
    if (c === "%" && isUnreserved(byte)) {
      out += String.fromCodePoint(byte);
      at += 2;
    } else {
      out += c;
    }
  }

  return out;
};

/**
 * Merge a relative path with its base's (RFC 3986, §5.2.3, for a base with a path): the base's path
 * up to and including its last `/`, then the reference's.
 *
 * @param base - The base's path.
 * @param path - The reference's path.
 * @returns The merged path.
 */
const merge = (base: string, path: string): string =>
  `${base.slice(0, base.lastIndexOf("/") + 1)}${path}`;

/**
 * Remove the dot segments of a path by RFC 3986's §5.2.4, its five rules over an input buffer and
 * an output buffer, as written there.
 *
 * @param path - The path.
 * @returns The path with no dot segment.
 */
export const removeDotSegments = (path: string): string => {
  let input = path;
  let output = "";
  while (input !== "") {
    if (input.startsWith("../")) {
      input = input.slice(3);
    } else if (input.startsWith("./")) {
      input = input.slice(2);
    } else if (input.startsWith("/./")) {
      input = `/${input.slice(3)}`;
    } else if (input === "/.") {
      input = "/";
    } else if (input.startsWith("/../") || input === "/..") {
      input = `/${input.slice(input === "/.." ? 3 : 4)}`;
      output = output.slice(0, Math.max(0, output.lastIndexOf("/")));
    } else if (input === "." || input === "..") {
      input = "";
    } else {
      const next = input.indexOf("/", input.startsWith("/") ? 1 : 0);
      const segment = next === -1 ? input : input.slice(0, next);
      output += segment;
      input = input.slice(segment.length);
    }
  }

  return output;
};

/**
 * Percent-encode a name for a URI's path (RFC 3986, §2.1 and §3.3): every UTF-8 octet of a
 * character outside `pchar`'s unreserved characters, sub-delims, `:` and `@` as `%HH`.
 *
 * @param name - A segment of an entry's path.
 * @returns The segment as a URI writes it.
 */
const encodedName = (name: string): string =>
  [...new TextEncoder().encode(name)]
    .map((byte) => {
      const c = String.fromCodePoint(byte);

      return byte < 0x80 && (isUnreserved(byte) || "!$&'()*+,;=:@".includes(c))
        ? c
        : `%${byte.toString(16).toUpperCase().padStart(2, "0")}`;
    })
    .join("");

/**
 * The length of the UTF-8 sequence a lead octet starts (RFC 3629, §4: `UTF8-1` to `UTF8-4`), 0 for
 * an octet no sequence starts with.
 *
 * @param lead - The octet.
 * @returns The sequence's length in octets.
 */
const sequenceLength = (lead: number): number => {
  if (lead < 0x80) {
    return 1;
  }

  if (lead >= 0xc2 && lead <= 0xdf) {
    return 2;
  }

  if (lead >= 0xe0 && lead <= 0xef) {
    return 3;
  }

  return lead >= 0xf0 && lead <= 0xf4 ? 4 : 0;
};

/**
 * The least code point a sequence of each length encodes, so a longer spelling is refused as no
 * shortest form (RFC 3629, §3).
 */
const leastOfLength: readonly number[] = [0, 0, 0x80, 0x8_00, 0x1_00_00];

/**
 * Read the code point one UTF-8 sequence encodes, by arithmetic over its octets' values: the lead
 * octet's low bits, then six bits of each continuation octet, `0x80` to `0xBF`.
 *
 * @param octets - The sequence's octets, its lead first.
 * @returns The code point, or none for a sequence that is not shortest-form UTF-8 of a scalar
 *   value.
 */
const codePointOf = (octets: readonly number[]): number | undefined => {
  const [lead = 0, ...trails] = octets;
  let point = octets.length === 1 ? lead : lead % 2 ** (7 - octets.length);
  for (const trail of trails) {
    if (trail < 0x80 || trail > 0xbf) {
      return undefined;
    }

    point = point * 64 + (trail - 0x80);
  }

  const least = leastOfLength[octets.length] ?? 0;

  return point < least || point > 0x10_ff_ff || (point >= 0xd8_00 && point <= 0xdf_ff)
    ? undefined
    : point;
};

/**
 * Decode UTF-8 octets strictly (RFC 3629, §3 and §4): each sequence its shortest form, no
 * surrogate, nothing above U+10FFFF, nothing cut short.
 *
 * @param octets - The octets.
 * @returns The text, or none for octets that are no UTF-8.
 */
const utf8Of = (octets: readonly number[]): string | undefined => {
  let text = "";
  for (let at = 0; at < octets.length;) {
    const length = sequenceLength(octets[at] ?? 0);
    const point =
      length === 0 || at + length > octets.length
        ? undefined
        : codePointOf(octets.slice(at, at + length));
    if (point === undefined) {
      return undefined;
    }

    text += String.fromCodePoint(point);
    at += length;
  }

  return text;
};

/**
 * Percent-decode a segment of a resolved path: its percent-encodings to octets, its other
 * characters to their UTF-8 octets, the whole read back as UTF-8.
 *
 * @param segment - The segment.
 * @returns The name, or the limit it meets.
 */
const decodedOf = (
  segment: string,
): { readonly limit: OracleLimit } | { readonly name: string } => {
  const octets: number[] = [];
  // oxlint-disable-next-line typescript/no-misused-spread -- a segment is decoded character by character (RFC 3986, 2.1), each code point or one percent-encoded octet, which spreading the string yields.
  const characters = [...segment];
  for (let at = 0; at < characters.length; at += 1) {
    const c = characters[at] ?? "";
    if (c === "%") {
      octets.push(Number.parseInt(`${characters[at + 1] ?? ""}${characters[at + 2] ?? ""}`, 16));
      at += 2;
    } else {
      octets.push(...new TextEncoder().encode(c));
    }
  }

  const name = utf8Of(octets);
  if (name === undefined) {
    return { limit: "octets" };
  }

  return name.includes("/") || name.includes("\u0000") ? { limit: "separator" } : { name };
};

/**
 * The base the next reference resolves against: a path of the oracle's absolute base URI, or the
 * outside of the package, or a base under a limit.
 */
type OracleBase =
  | { readonly _tag: "path"; readonly path: string }
  | { readonly _tag: "external" }
  | { readonly _tag: "unresolved"; readonly limit: OracleLimit };

/**
 * Resolve one relative reference's path against a base, as text.
 *
 * @param value - The reference, read by its whitespace class.
 * @param base - The base.
 * @param root - The package root's path in the oracle's base URI.
 * @returns The target's path within the base URI, or the reason there is none.
 */
const targetOf = (
  value: string,
  base: OracleBase,
  root: string,
): OracleBase | { readonly _tag: "document" } => {
  if (hasScheme(value)) {
    return { _tag: "external" };
  }

  const relative = relativeOf(value);
  if (relative.authority || relative.path.startsWith("/")) {
    return { _tag: "external" };
  }

  if (relative.path === "") {
    return { _tag: "document" };
  }

  if (base._tag !== "path") {
    return base;
  }

  const limit = limitOfPath(relative.path);
  if (limit !== undefined) {
    return { _tag: "unresolved", limit };
  }

  const path = removeDotSegments(merge(base.path, normalized(relative.path)));

  return path.startsWith(root) ? { _tag: "path", path } : { _tag: "external" };
};

/**
 * Resolve an href of a document in a package (readings 102 and 103).
 *
 * The document's path is embedded in an absolute path whose package root lies below as many
 * segments as the inputs hold characters, each named with a backslash, which no written path the
 * oracle resolves may hold, so no `..` can climb past them and come back into the package.
 *
 * @param input - What the href is read with.
 * @param input.document - The document's path in its package.
 * @param input.bases - The `xml:base` values in scope, outermost first, as written.
 * @param input.value - The href, read by its whitespace class.
 * @returns Its resolution.
 */
export const resolve = (input: {
  readonly bases: readonly string[];
  readonly document: string;
  readonly value: string;
}): OracleResolution => {
  const size = input.value.length + input.bases.reduce((sum, base) => sum + base.length, 0);
  const root = `/${"\\/".repeat(size + 1)}\\package/`;
  let base: OracleBase = {
    _tag: "path",
    path: `${root}${input.document.split("/").map(encodedName).join("/")}`,
  };
  for (const written of input.bases) {
    const next = targetOf(oracleValueOf(written, "collapse"), base, root);
    base = next._tag === "document" ? base : next;
  }

  const target = targetOf(input.value, base, root);
  if (target._tag === "document" || target._tag === "external") {
    return { scope: target._tag };
  }

  if (target._tag === "unresolved") {
    return { limit: target.limit, scope: "unresolved" };
  }

  const names: string[] = [];
  for (const segment of target.path.slice(root.length).split("/")) {
    const decoded = decodedOf(segment);
    if ("limit" in decoded) {
      return { limit: decoded.limit, scope: "unresolved" };
    }

    names.push(decoded.name);
  }

  return { path: names.join("/"), scope: "entry" };
};

/**
 * Resolve a census attribute's value (reading 102): as any href, but a `srcset` whose value holds a
 * comma or inner whitespace is unresolved under the `srcset` limit unless it is external.
 *
 * @param input - What the href is read with.
 * @param input.document - The document's path.
 * @param input.bases - The `xml:base` values in scope, outermost first.
 * @param input.lexical - The attribute's lexical form.
 * @param input.whiteSpace - Its type's whitespace class.
 * @param input.srcset - Whether the attribute is a `srcset`.
 * @returns Its resolution.
 */
export const resolveAttribute = (input: {
  readonly bases: readonly string[];
  readonly document: string;
  readonly lexical: string;
  readonly srcset: boolean;
  readonly whiteSpace: OracleWhiteSpace;
}): OracleResolution => {
  const value = oracleValueOf(input.lexical, input.whiteSpace);
  const resolution = resolve({ bases: input.bases, document: input.document, value });

  return input.srcset &&
    resolution.scope !== "external" &&
    // oxlint-disable-next-line typescript/no-misused-spread -- a comma and the XML space characters are single BMP code points, so testing code points finds each.
    [...value].some((c) => c === "," || xmlSpace.has(c))
    ? { limit: "srcset", scope: "unresolved" }
    : resolution;
};

/**
 * The path an href's row is compared by (reading 102): the entry path it resolves to in the
 * package, and otherwise its path as read, its query and fragment aside.
 *
 * @param resolution - Its resolution.
 * @param value - Its value, read by its whitespace class.
 * @returns The path.
 */
export const comparedPath = (resolution: OracleResolution, value: string): string =>
  resolution.scope === "entry" ? resolution.path : (/^[^?#]*/su.exec(value)?.[0] ?? "");

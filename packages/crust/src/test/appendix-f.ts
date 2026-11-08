/* oxlint-disable unicorn/text-encoding-identifier-case -- The oracle spells the XML encoding labels (`UTF-8`, `UTF-16LE`) as XML 1.0 section 4.3.3 and IANA spell them, and passes WHATWG's lower-case names to `TextDecoder` as the Encoding Standard spells them. */
/**
 * An independent reading of how XML 1.0 decodes a document's bytes, for the tests that hold
 * `#crust/decode.ts` to it: Appendix F.1's table transcribed as the specification prints it, `##`
 * notation and all, section 4.3.3's rules for which encoding a document is in, RFC 2781 and Unicode
 * 16.0 section 3.10 for the UTF-16 schemes, and the platform's fatal `TextDecoder` (the WHATWG
 * Encoding Standard) as the second implementation of each decoding. It shares no code with
 * `decode.ts`: it finds the row by matching the printed patterns, reads the declaration by
 * decoding the whole document in the row's reading and matching XML 1.0's productions, and names
 * labels by its own table.
 */
import { Result } from "effect";
import type { ReaderRefusal } from "#crust/errors.ts";

/**
 * What the oracle says a document's bytes read as: the label and the text, or a refusal by its
 * rule.
 */
export type Reading =
  | { readonly _tag: "read"; readonly label: string; readonly text: string }
  | { readonly _tag: "refused"; readonly rule: ReaderRefusal["rule"] };

/**
 * A refusal, the failure of a step of the oracle's reading.
 */
type Refused = Extract<Reading, { readonly _tag: "refused" }>;

/**
 * Build the refusal under `rule`.
 *
 * @param rule - The rule.
 * @returns The refusal, as a failed step.
 */
const refused = (rule: Refused["rule"]): Result.Result<string, Refused> =>
  Result.fail({ _tag: "refused", rule });

/**
 * How a row of the table is read: in no way here (UCS-4 and EBCDIC, which no decoder of the
 * platform reads), as UTF-16 with a byte order mark, as UTF-16BE or UTF-16LE with none, or one
 * byte per ASCII character, after the UTF-8 mark or with none.
 */
type RowReading =
  | { readonly kind: "unreadable" }
  | { readonly kind: "utf16 mark"; readonly order: "utf-16be" | "utf-16le" }
  | { readonly kind: "utf16 pattern"; readonly order: "utf-16be" | "utf-16le" }
  | { readonly kind: "utf8 mark" }
  | { readonly kind: "ascii" };

/**
 * One row of XML 1.0 Appendix F.1's table: its pattern as printed, its encoding as the table names
 * it, and how the oracle reads it.
 */
export interface TableRow {
  readonly encoding: string;
  readonly pattern: string;
  readonly reading: RowReading;
}

/**
 * XML 1.0 (Fifth Edition) Appendix F.1's table, row for row, its patterns and encodings as printed:
 * first the rows "With a Byte Order Mark", then those "Without a Byte Order Mark". "The notation
 *
 * ## is used to denote any byte value except that two consecutive ##s cannot be both 00." A
 *
 * Document no pattern matches is the table's "Other": "UTF-8 without an encoding declaration, or
 * else the data stream is mislabeled".
 *
 * @see {@link https://www.w3.org/TR/2008/REC-xml-20081126/#sec-guessing-no-ext-info | XML 1.0 (Fifth Edition), Appendix F.1}
 */
export const appendixF = [
  {
    encoding: "UCS-4, big-endian machine (1234 order)",
    pattern: "00 00 FE FF",
    reading: { kind: "unreadable" },
  },
  {
    encoding: "UCS-4, little-endian machine (4321 order)",
    pattern: "FF FE 00 00",
    reading: { kind: "unreadable" },
  },
  {
    encoding: "UCS-4, unusual octet order (2143)",
    pattern: "00 00 FF FE",
    reading: { kind: "unreadable" },
  },
  {
    encoding: "UCS-4, unusual octet order (3412)",
    pattern: "FE FF 00 00",
    reading: { kind: "unreadable" },
  },
  {
    encoding: "UTF-16, big-endian",
    pattern: "FE FF ## ##",
    reading: { kind: "utf16 mark", order: "utf-16be" },
  },
  {
    encoding: "UTF-16, little-endian",
    pattern: "FF FE ## ##",
    reading: { kind: "utf16 mark", order: "utf-16le" },
  },
  { encoding: "UTF-8", pattern: "EF BB BF", reading: { kind: "utf8 mark" } },
  {
    encoding: "UCS-4 or other encoding with a 32-bit code unit (1234)",
    pattern: "00 00 00 3C",
    reading: { kind: "unreadable" },
  },
  {
    encoding: "UCS-4 or other encoding with a 32-bit code unit (4321)",
    pattern: "3C 00 00 00",
    reading: { kind: "unreadable" },
  },
  {
    encoding: "UCS-4 or other encoding with a 32-bit code unit (2143)",
    pattern: "00 00 3C 00",
    reading: { kind: "unreadable" },
  },
  {
    encoding: "UCS-4 or other encoding with a 32-bit code unit (3412)",
    pattern: "00 3C 00 00",
    reading: { kind: "unreadable" },
  },
  {
    encoding: "UTF-16BE or big-endian ISO-10646-UCS-2 or other encoding with a 16-bit code unit",
    pattern: "00 3C 00 3F",
    reading: { kind: "utf16 pattern", order: "utf-16be" },
  },
  {
    encoding: "UTF-16LE or little-endian ISO-10646-UCS-2 or other encoding with a 16-bit code unit",
    pattern: "3C 00 3F 00",
    reading: { kind: "utf16 pattern", order: "utf-16le" },
  },
  {
    encoding: "UTF-8, ISO 646, ASCII, some part of ISO 8859, Shift-JIS, EUC, ...",
    pattern: "3C 3F 78 6D",
    reading: { kind: "ascii" },
  },
  {
    encoding: "EBCDIC (in some flavor)",
    pattern: "4C 6F A7 94",
    reading: { kind: "unreadable" },
  },
] as const satisfies readonly TableRow[];

/**
 * A pattern of the table, as printed.
 */
export type Pattern = (typeof appendixF)[number]["pattern"];

/**
 * Test whether a printed pattern matches the opening of `bytes`: each hexadecimal pair the byte at
 * its place, and `## ##` any two bytes that are not both `00`, a byte past the end being none.
 *
 * @param pattern - The pattern as printed.
 * @param bytes - The document.
 * @returns Whether the pattern matches.
 */
export const matches = (pattern: string, bytes: Uint8Array): boolean => {
  const tokens = pattern.split(" ");
  const wild = tokens.map((token, at) => (token === "##" ? at : -1)).filter((at) => at !== -1);
  const exact = tokens.every(
    (token, at) => token === "##" || bytes[at] === Number.parseInt(token, 16),
  );

  return exact && (wild.length === 0 || wild.some((at) => (bytes[at] ?? 1) !== 0));
};

/**
 * Find the row of the table a document is in: the one row whose pattern matches it, none for the
 * table's "Other".
 *
 * @param bytes - The document.
 * @returns The row; fails the test when two rows match, which the table's `##` rule rules out.
 */
export const rowOf = (bytes: Uint8Array): (typeof appendixF)[number] | undefined => {
  const found = appendixF.filter(({ pattern }) => matches(pattern, bytes));
  if (found.length > 1) {
    throw new Error(
      `Appendix F.1's patterns ${found.map(({ pattern }) => pattern).join(", ")} all match`,
    );
  }

  return found[0];
};

/**
 * What a label names, by the oracle's own table of the labels its cases declare: one of the
 * encodings XML 1.0 section 4.3.3 names or IANA registers under that name, matched without regard
 * to case. `whatwg` names a label the platform's decoder reads under that very name, `remapped`
 * one whose WHATWG decoder serves another encoding (`ISO-8859-9` is decoded as `windows-1254`),
 * and `unknown` one no decoder serves.
 */
type Named =
  | "UTF-8"
  | "UTF-16"
  | "UTF-16BE"
  | "UTF-16LE"
  | "ISO-8859-1"
  | "US-ASCII"
  | "whatwg"
  | "remapped"
  | "unknown";

/**
 * The labels the oracle's cases declare, lower-cased, with what each names.
 */
const labelNames: ReadonlyMap<string, Named> = new Map<string, Named>([
  ["utf-8", "UTF-8"],
  ["utf-16", "UTF-16"],
  ["utf-16be", "UTF-16BE"],
  ["utf-16le", "UTF-16LE"],
  ["iso-8859-1", "ISO-8859-1"],
  ["latin1", "ISO-8859-1"],
  ["us-ascii", "US-ASCII"],
  ["windows-1252", "whatwg"],
  ["iso-8859-9", "remapped"],
  ["x-no-such-encoding", "unknown"],
]);

/**
 * The labels the oracle knows, as a case may spell them: each of {@link labelNames} once, in some
 * letter case.
 */
export const knownLabels: readonly [string, ...string[]] = [
  "UTF-8",
  "utf-8",
  "UTF-16",
  "utf-16",
  "UTF-16BE",
  "UTF-16LE",
  "utf-16le",
  "ISO-8859-1",
  "Latin1",
  "US-ASCII",
  "windows-1252",
  "ISO-8859-9",
  "x-no-such-encoding",
];

/**
 * Name a label by the oracle's table.
 *
 * @param label - The label as spelled.
 * @returns What it names; fails the test for a label outside the table.
 */
const namedBy = (label: string): Named => {
  const named = labelNames.get(label.toLowerCase());
  if (named === undefined) {
    throw new Error(`the oracle has no entry for the label ${label}`);
  }

  return named;
};

/**
 * The XML declaration's `encoding`, by XML 1.0's productions: [23] XMLDecl opens with `<?xml`, [24]
 * VersionInfo is S `version` Eq and a quoted [26] VersionNum (`1.` and digits), and [80]
 * EncodingDecl is S `encoding` Eq and a quoted [81] EncName; [25] Eq is S? `=` S? and [3] S is
 * runs of space, tab, carriage return and line feed.
 */
const xmlDecl =
  /^<\?xml[\t\n\r ]+version[\t\n\r ]*=[\t\n\r ]*(?:"1\.[0-9]+"|'1\.[0-9]+')[\t\n\r ]+encoding[\t\n\r ]*=[\t\n\r ]*(?:"(?<double>[A-Za-z][A-Za-z0-9._-]*)"|'(?<single>[A-Za-z][A-Za-z0-9._-]*)')/u;

/**
 * Read the bytes one to one as code points, as ISO-8859-1 and ASCII are defined.
 *
 * @param bytes - The bytes.
 * @returns The text.
 */
const codePoints = (bytes: Uint8Array): string =>
  Array.from(bytes, (byte) => String.fromCodePoint(byte)).join("");

/**
 * Decode with the platform's fatal decoder, keeping any byte order mark as U+FEFF.
 *
 * @param name - The WHATWG encoding name.
 * @param bytes - The bytes.
 * @returns The text, or a `decode` refusal when the bytes are malformed in it.
 */
const fatal = (name: string, bytes: Uint8Array): Result.Result<string, Refused> =>
  Result.mapError(
    Result.try(() => new TextDecoder(name, { fatal: true, ignoreBOM: true }).decode(bytes)),
    (): Refused => ({ _tag: "refused", rule: "decode" }),
  );

/**
 * Decode an ASCII-reading body under the label the document is read as, by the oracle's table.
 *
 * @param named - What the label names.
 * @param body - The bytes after any mark.
 * @returns The text, or the refusal.
 */
const asciiBody = (named: Named, body: Uint8Array): Result.Result<string, Refused> => {
  switch (named) {
    case "UTF-8": {
      return fatal("utf-8", body);
    }
    case "ISO-8859-1": {
      return Result.succeed(codePoints(body));
    }
    case "US-ASCII": {
      return body.some((byte) => byte >= 0x80)
        ? refused("decode")
        : Result.succeed(codePoints(body));
    }
    case "whatwg": {
      return fatal("windows-1252", body);
    }
    case "remapped":
    case "unknown": {
      return refused("unsupported-encoding");
    }
    case "UTF-16":
    case "UTF-16BE":
    case "UTF-16LE": {
      return refused("encoding-mismatch");
    }
    default: {
      return named satisfies never;
    }
  }
};

/**
 * Read a document's bytes as XML 1.0 section 4.3.3 and Appendix F say.
 *
 * The row decides the reading. UCS-4 and EBCDIC are refused as `unsupported-encoding`, an encoding
 * the processor "is unable to process". A UTF-16 mark is UTF-16, whose label is `UTF-16`, since
 * "The terms "UTF-8" and "UTF-16" in this specification do not apply to related character
 * encodings, including but not limited to UTF-16BE, UTF-16LE", under which an initial `FE FF` or
 * `FF FE` is U+FEFF, a character (Unicode 16.0 section 3.10, D96 and D97; RFC 2781 sections 4.1 and
 * 4.2). `<?` in UTF-16 with no mark is UTF-16BE or UTF-16LE in that order, the one label the row
 * reads, since UTF-16 "MUST" begin with the mark; and with no encoding declaration it would be
 * UTF-8, which "an entity which begins with neither a Byte Order Mark nor an encoding declaration"
 * must use. The UTF-8 mark is UTF-8. Anything else is read one byte per ASCII character, as the
 * label it declares or as UTF-8, and is no UTF-16. A label the bytes rule out is "a fatal error for
 * an entity including an encoding declaration to be presented to the XML processor in an encoding
 * other than that named in the declaration", refused as `encoding-mismatch`. The body is decoded
 * fatally, and text holding U+0000 is refused (section 2.2).
 *
 * @param bytes - The document.
 * @returns The reading.
 * @see {@link https://www.w3.org/TR/2008/REC-xml-20081126/#charencoding | XML 1.0 (Fifth Edition), section 4.3.3}
 */
export const readingOf = (bytes: Uint8Array): Reading => {
  const reading = rowOf(bytes)?.reading ?? { kind: "ascii" };
  if (reading.kind === "unreadable") {
    return { _tag: "refused", rule: "unsupported-encoding" };
  }

  const markLength = { ascii: 0, "utf16 mark": 2, "utf16 pattern": 0, "utf8 mark": 3 }[
    reading.kind
  ];
  const body = bytes.subarray(markLength);
  const head =
    reading.kind === "ascii" || reading.kind === "utf8 mark"
      ? codePoints(body)
      : new TextDecoder(reading.order).decode(body);
  const groups = xmlDecl.exec(head)?.groups;
  const declared = groups?.["double"] ?? groups?.["single"];
  const label =
    declared ??
    { ascii: "UTF-8", "utf16 mark": "UTF-16", "utf16 pattern": "UTF-8", "utf8 mark": "UTF-8" }[
      reading.kind
    ];
  const named = namedBy(label);
  const decoded = ((): Result.Result<string, Refused> => {
    switch (reading.kind) {
      case "utf16 mark": {
        return named === "UTF-16" ? fatal(reading.order, body) : refused("encoding-mismatch");
      }
      case "utf16 pattern": {
        return named === (reading.order === "utf-16be" ? "UTF-16BE" : "UTF-16LE")
          ? fatal(reading.order, body)
          : refused("encoding-mismatch");
      }
      case "utf8 mark": {
        return named === "UTF-8" ? fatal("utf-8", body) : refused("encoding-mismatch");
      }
      case "ascii": {
        return asciiBody(named, body);
      }
      default: {
        return reading satisfies never;
      }
    }
  })();

  return Result.match(decoded, {
    onFailure: (refusal): Reading => refusal,
    onSuccess: (text): Reading =>
      text.includes("\0") ? { _tag: "refused", rule: "nul" } : { _tag: "read", label, text },
  });
};

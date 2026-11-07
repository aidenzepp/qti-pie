/* oxlint-disable unicorn/text-encoding-identifier-case -- The tests spell the XML encoding labels (`UTF-8`, `US-ASCII`) the declarations under test carry. */
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { element, int } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Duration, Effect, Formatter, Result } from "effect";
import { decode } from "#crust/decode.ts";
import type { ReaderRefusal } from "#crust/errors.ts";
import { ascii, bytesOf, declared } from "#crust/test/bytes.ts";
import { withoutBuffer } from "#crust/test/without-buffer.ts";

/**
 * Builds a UTF-16 document of the Basic Multilingual Plane `text` with its byte order mark, in the
 * byte order named.
 */
const utf16 = (text: string, order: "be" | "le"): Uint8Array => {
  const littleEndian = order === "le";
  const view = new DataView(new ArrayBuffer(text.length * 2));

  for (let index = 0; index < text.length; index += 1) {
    view.setUint16(index * 2, text.codePointAt(index) ?? 0, littleEndian);
  }

  return bytesOf(littleEndian ? [0xff, 0xfe] : [0xfe, 0xff], [...new Uint8Array(view.buffer)]);
};

/**
 * Builds a UTF-16 document of the Basic Multilingual Plane `text` without a byte order mark, in the
 * byte order named.
 */
const utf16Bare = (text: string, order: "be" | "le"): Uint8Array => utf16(text, order).subarray(2);

/**
 * The byte order marks of XML 1.0 section 4.3.3, with the `TextDecoder` encoding and the label
 * each selects.
 */
const marks = [
  { bytes: [0xef, 0xbb, 0xbf], encoding: "utf-8", label: "UTF-8" },
  { bytes: [0xfe, 0xff], encoding: "utf-16be", label: "UTF-16" },
  { bytes: [0xff, 0xfe], encoding: "utf-16le", label: "UTF-16" },
] as const;

/**
 * Every near byte order mark, each once: a mark with any one of its bytes replaced by any byte
 * value (the mark itself among them), and each proper prefix of a mark.
 */
const nearMarkPrefixes: readonly (readonly number[])[] = [
  ...new Map(
    marks
      .flatMap(({ bytes }) => [
        ...bytes.flatMap((_, at) =>
          Array.from({ length: 256 }, (__, value) =>
            bytes.map((byte, index) => (index === at ? value : byte)),
          ),
        ),
        ...bytes.slice(1).map((_, length) => bytes.slice(0, length + 1)),
      ])
      .map((prefix) => [prefix.join(" "), prefix] as const),
  ).values(),
];

/**
 * The bodies a near mark opens: ASCII, and text with a two-byte UTF-8 character.
 */
const nearMarkBodies = [ascii("<a/>"), bytesOf(ascii("<a>"), [0xc3, 0xa9], ascii("</a>"))].map(
  (body) => [...body],
);

/**
 * What decoding a document gives: its label and text, or a refusal.
 */
type MarkReading =
  | { readonly _tag: "read"; readonly label: string; readonly text: string }
  | { readonly _tag: "refused" };

/**
 * Read a document with no XML declaration as XML 1.0 section 4.3.3 says, through the platform's
 * fatal decoders: a whole mark selects its encoding and is not text, and anything else is UTF-8,
 * every byte of it text. Text holding U+0000 or an unpaired surrogate is refused (section 2.2).
 *
 * @param bytes - The document.
 * @returns The label and text, or a refusal.
 */
const markReading = (bytes: Uint8Array): MarkReading => {
  const mark = marks.find(({ bytes: held }) => held.every((byte, index) => bytes[index] === byte));
  const encoding = mark?.encoding ?? "utf-8";
  const decoded = Result.try(() =>
    new TextDecoder(encoding, { fatal: true, ignoreBOM: true }).decode(
      bytes.subarray(mark?.bytes.length ?? 0),
    ),
  );

  return Result.match(decoded, {
    onFailure: (): MarkReading => ({ _tag: "refused" }),
    onSuccess: (text): MarkReading =>
      text.includes("\0") || /\p{Cs}/u.test(text)
        ? { _tag: "refused" }
        : { _tag: "read", label: mark?.label ?? "UTF-8", text },
  });
};

/**
 * Spell bytes in hexadecimal, for a failure's message.
 *
 * @param bytes - The bytes.
 * @returns Each byte as two upper-case digits, spaced.
 */
const hexOf = (bytes: readonly number[]): string =>
  bytes.map((byte) => byte.toString(16).toUpperCase().padStart(2, "0")).join(" ");

/**
 * Decodes `input` and returns the refusal it raised, failing the test when `input` decodes.
 */
const refusalOf = (input: Uint8Array): Effect.Effect<ReaderRefusal> =>
  decode(input).pipe(
    Effect.match({
      onFailure: (refusal) => refusal,
      onSuccess: (decoded) => assert.fail(`expected a refusal, decoded ${JSON.stringify(decoded)}`),
    }),
  );

describe("decode refuses what it cannot decode faithfully", () => {
  it.effect("a label WHATWG remaps, naming the label", () =>
    Effect.gen(function* refusesRemappedLabel() {
      const refusal = yield* refusalOf(declared("ISO-8859-9", ascii("x")));

      assert.strictEqual(refusal.rule, "decode");
      assert.include(refusal.detail, "ISO-8859-9");
    }),
  );

  it.effect("a label no decoder knows, naming the label", () =>
    Effect.gen(function* refusesUnknownLabel() {
      const refusal = yield* refusalOf(declared("no-such-charset", ascii("x")));

      assert.strictEqual(refusal.rule, "decode");
      assert.include(refusal.detail, "no-such-charset");
    }),
  );

  it.effect("a US-ASCII document holding a byte at or above 0x80", () =>
    Effect.gen(function* refusesHighAscii() {
      const refusal = yield* refusalOf(declared("US-ASCII", [0xe9]));

      assert.strictEqual(refusal.rule, "decode");
      assert.include(refusal.detail, "US-ASCII");
    }),
  );

  it.effect("a declared UTF-16 with no byte order mark", () =>
    Effect.gen(function* refusesBareUtf16() {
      const refusal = yield* refusalOf(declared("UTF-16", ascii("x")));

      assert.strictEqual(refusal.rule, "bare-utf16");
    }),
  );

  it.effect("a declared UTF-16 that Appendix F found an order for, but without a mark", () =>
    Effect.gen(function* refusesUnmarkedUtf16() {
      const refusal = yield* refusalOf(
        utf16Bare('<?xml version="1.0" encoding="UTF-16"?><a>x</a>', "le"),
      );

      assert.strictEqual(refusal.rule, "bare-utf16");
    }),
  );

  it.effect("a declared UTF-16LE whose bytes are not UTF-16", () =>
    Effect.gen(function* refusesNonUtf16() {
      const refusal = yield* refusalOf(declared("UTF-16LE", ascii("x")));

      assert.strictEqual(refusal.rule, "decode");
      assert.include(refusal.detail, "UTF-16LE");
    }),
  );

  it.effect("malformed UTF-8", () =>
    Effect.gen(function* refusesMalformedUtf8() {
      const refusal = yield* refusalOf(declared("UTF-8", [0xff]));

      assert.strictEqual(refusal.rule, "decode");
    }),
  );

  it.effect("malformed UTF-8 in a document that declares no encoding", () =>
    Effect.gen(function* refusesMalformedDefaultUtf8() {
      const refusal = yield* refusalOf(bytesOf(ascii("<a>"), [0xc3], ascii("</a>")));

      assert.strictEqual(refusal.rule, "decode");
    }),
  );

  it.effect("a UTF-16 document cut in the middle of a code unit", () =>
    Effect.gen(function* refusesTruncatedUtf16() {
      const refusal = yield* refusalOf(utf16("<a/>", "le").subarray(0, -1));

      assert.strictEqual(refusal.rule, "decode");
    }),
  );

  it.effect("a NUL in the decoded text", () =>
    Effect.gen(function* refusesNul() {
      const refusal = yield* refusalOf(declared("UTF-8", [0x00]));

      assert.strictEqual(refusal.rule, "nul");
      assert.include(refusal.detail, "U+0000");
    }),
  );

  it.effect("a NUL that a single-byte label decodes", () =>
    Effect.gen(function* refusesLatin1Nul() {
      const refusal = yield* refusalOf(declared("ISO-8859-1", [0x00]));

      assert.strictEqual(refusal.rule, "nul");
    }),
  );
});

/**
 * The ways a lone surrogate reaches `decode`: as a UTF-16 code unit under a byte order mark, or
 * under a declared byte order with no mark, in either order, and as the three bytes CESU-8 writes
 * for it.
 */
const loneForms = [
  "UTF-16LE marked",
  "UTF-16BE marked",
  "UTF-16LE declared",
  "UTF-16BE declared",
  "CESU-8",
] as const;

/**
 * Where the surrogate stands in the root's text: alone, before a letter, after one, or twice, so a
 * leading surrogate is never followed by a trailing one.
 */
const lonePlaces = ["alone", "before a letter", "after a letter", "doubled"] as const;

/**
 * One case of the box: a form, a place and a surrogate code unit.
 */
interface LoneSurrogate {
  readonly form: (typeof loneForms)[number];
  readonly place: (typeof lonePlaces)[number];
  readonly unit: number;
}

/**
 * Every lone surrogate in every form and place: 5 forms, 4 places, 2,048 code units.
 */
const loneSurrogate: Gen<LoneSurrogate> = (source) => ({
  form: source.draw(element(loneForms)),
  place: source.draw(element(lonePlaces)),
  unit: source.draw(int(0xd8_00, 0xdf_ff)),
});

/**
 * The size of {@link loneSurrogate}'s box.
 */
const LONE_SURROGATES = loneForms.length * lonePlaces.length * 0x8_00;

/**
 * The document that carries a case: `<a>`, the surrogate where the case puts it, `</a>`.
 *
 * @param lone - The case.
 * @returns Its bytes.
 */
const loneDocument = ({ form, place, unit }: LoneSurrogate): Uint8Array => {
  const surrogate = String.fromCodePoint(unit);
  const body = {
    "after a letter": `b${surrogate}`,
    alone: surrogate,
    "before a letter": `${surrogate}b`,
    doubled: `${surrogate}${surrogate}`,
  }[place];
  // The three bytes CESU-8 writes for the unit: 1110xxxx 10xxxxxx 10xxxxxx.
  const cesu = [
    0xe0 + Math.floor(unit / 0x10_00),
    0x80 + (Math.floor(unit / 0x40) % 0x40),
    0x80 + (unit % 0x40),
  ];
  const documents: Readonly<Record<LoneSurrogate["form"], () => Uint8Array>> = {
    "CESU-8": () =>
      bytesOf(
        ascii("<a>"),
        {
          "after a letter": [0x62, ...cesu],
          alone: cesu,
          "before a letter": [...cesu, 0x62],
          doubled: [...cesu, ...cesu],
        }[place],
        ascii("</a>"),
      ),
    "UTF-16BE declared": () =>
      utf16Bare(`<?xml version="1.0" encoding="UTF-16BE"?><a>${body}</a>`, "be"),
    "UTF-16BE marked": () => utf16(`<a>${body}</a>`, "be"),
    "UTF-16LE declared": () =>
      utf16Bare(`<?xml version="1.0" encoding="UTF-16LE"?><a>${body}</a>`, "le"),
    "UTF-16LE marked": () => utf16(`<a>${body}</a>`, "le"),
  };

  return documents[form]();
};

describe("decode refuses every lone surrogate under decode", () => {
  it.effect(
    `for every surrogate code unit in every form and place, exhausted: ${String(LONE_SURROGATES)} documents`,
    (ctx) =>
      // Oracle: the WHATWG Encoding Standard. Its decoders emit scalar values only (§4.1, process
      // an item), the UTF-8 decoder errs on a surrogate's bytes (§8.1.1) and the shared UTF-16
      // decoder on a lone surrogate (§14.2.1, steps 6.7 and 8). decode runs each fatally, so every
      // one is refused as `decode`, before decode.ts would have to look for a surrogate itself.
      searched(
        ctx,
        exhaust(
          {
            box: "every surrogate code unit, in 5 forms and 4 places",
            caseHang: Duration.minutes(1),
            coverage: requiredInSpace<(typeof loneForms)[number] | (typeof lonePlaces)[number]>([
              ...loneForms,
              ...lonePlaces,
            ]),
            generator: loneSurrogate,
            limit: LONE_SURROGATES,
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "the WHATWG Encoding Standard's fatal decoders, §4.1, §8.1.1 and §14.2.1",
            },
            suite: "crust/decode/lone-surrogates",
          },
          (lone, c) =>
            Effect.gen(function* refusesLone() {
              c.note(lone.form);
              c.note(lone.place);

              const refusal = yield* refusalOf(loneDocument(lone));

              assert.strictEqual(refusal.rule, "decode", Formatter.format(lone));
            }),
        ),
      ).pipe(
        Effect.tap((done) =>
          Effect.sync(() => {
            assert.strictEqual(done.cases, LONE_SURROGATES);
          }),
        ),
      ),
    120_000,
  );
});

describe("decode reads the label and the bytes", () => {
  it.effect("admits windows-1252 under its own decoder, and keeps the label as read", () =>
    Effect.gen(function* admitsWindows1252() {
      const decoded = yield* decode(declared("windows-1252", [0x80]));

      assert.strictEqual(decoded.label, "windows-1252");
      assert.include(decoded.text, "<a>€</a>");
    }),
  );

  it.effect("decodes ISO-8859-1 byte for byte, 0x85 included", () =>
    Effect.gen(function* decodesLatin1() {
      const decoded = yield* decode(declared("ISO-8859-1", [0x85, 0xe9]));

      assert.strictEqual(decoded.label, "ISO-8859-1");
      assert.include(decoded.text, "<a>\u0085é</a>");
    }),
  );

  it.effect("keeps a label alias as spelled, quotes and letter case included", () =>
    Effect.gen(function* keepsAliasSpelling() {
      const decoded = yield* decode(
        bytesOf(ascii("<?xml version='1.0' encoding='Latin1'?><a>"), [0xe9], ascii("</a>")),
      );

      assert.strictEqual(decoded.label, "Latin1");
      assert.include(decoded.text, "<a>é</a>");
    }),
  );

  it.effect("decodes US-ASCII when every byte is below 0x80", () =>
    Effect.gen(function* decodesAscii() {
      const decoded = yield* decode(declared("US-ASCII", ascii("plain")));

      assert.strictEqual(decoded.label, "US-ASCII");
      assert.include(decoded.text, "<a>plain</a>");
    }),
  );

  it.effect("strips a UTF-8 byte order mark and labels the document UTF-8", () =>
    Effect.gen(function* stripsUtf8Bom() {
      const decoded = yield* decode(bytesOf([0xef, 0xbb, 0xbf], ascii("<a/>")));

      assert.strictEqual(decoded.label, "UTF-8");
      assert.strictEqual(decoded.text, "<a/>");
    }),
  );

  it.effect("strips only the first of two UTF-8 byte order marks", () =>
    Effect.gen(function* stripsOneBom() {
      const decoded = yield* decode(bytesOf([0xef, 0xbb, 0xbf, 0xef, 0xbb, 0xbf], ascii("<a/>")));

      assert.strictEqual(decoded.text, `${String.fromCodePoint(0xfe_ff)}<a/>`);
    }),
  );

  it.effect(
    "drops a byte order mark only when the whole mark opens the document, and loses no byte of any near one",
    () =>
      // Oracle: the specification as a checker, XML 1.0 section 4.3.3 and Appendix F (a document
      // opened by `EF BB BF` is UTF-8, by `FE FF` or `FF FE` UTF-16 in that order, the mark not
      // part of its text; any other is read as UTF-8 here, having no declaration), with the
      // platform's fatal `TextDecoder` as a second implementation of each decoding.
      // Bound: exhaustive over the near marks: each mark with any one of its bytes replaced by
      // any of the 256 values, and each mark's proper prefixes, before each of two bodies.
      Effect.gen(function* nearMarks() {
        const wrong: string[] = [];
        for (const prefix of nearMarkPrefixes) {
          for (const body of nearMarkBodies) {
            const bytes = bytesOf(prefix, body);
            const expected = markReading(bytes);
            const read = yield* decode(bytes).pipe(
              Effect.match({
                onFailure: (): MarkReading => ({ _tag: "refused" }),
                onSuccess: ({ label, text }): MarkReading => ({ _tag: "read", label, text }),
              }),
            );

            if (JSON.stringify(read) !== JSON.stringify(expected)) {
              wrong.push(
                `${hexOf(prefix)} before ${hexOf(body)}: read ${JSON.stringify(read)}, expected ${JSON.stringify(expected)}`,
              );
            }
          }
        }

        assert.strictEqual(wrong.slice(0, 8).join("\n"), "");
        assert.strictEqual(nearMarkPrefixes.length, 1790, "the box holds every near mark once");
      }),
  );

  it.effect("decodes UTF-8 without a declaration and labels it UTF-8", () =>
    Effect.gen(function* defaultsToUtf8() {
      const decoded = yield* decode(bytesOf(ascii("<a>"), [0xc3, 0xa9], ascii("</a>")));

      assert.strictEqual(decoded.label, "UTF-8");
      assert.strictEqual(decoded.text, "<a>é</a>");
    }),
  );

  it.effect("decodes UTF-16 by its byte order mark, in either order, and labels it UTF-16", () =>
    Effect.gen(function* decodesUtf16() {
      for (const order of ["be", "le"] as const) {
        const decoded = yield* decode(utf16("<a>é€</a>", order));

        assert.strictEqual(decoded.label, "UTF-16");
        assert.strictEqual(decoded.text, "<a>é€</a>");
      }
    }),
  );

  it.effect("decodes UTF-16LE and UTF-16BE without a mark, keeping the label as spelled", () =>
    Effect.gen(function* decodesBareUtf16() {
      for (const [label, order] of [
        ["UTF-16LE", "le"],
        ["UTF-16BE", "be"],
      ] as const) {
        const text = `<?xml version="1.0" encoding="${label}"?><a>é€</a>`;
        const decoded = yield* decode(utf16Bare(text, order));

        assert.strictEqual(decoded.label, label);
        assert.strictEqual(decoded.text, text);
      }
    }),
  );

  it.effect("decodes by the byte order Appendix F detects when the label names the other", () =>
    Effect.gen(function* decodesByDetectedOrder() {
      const text = '<?xml version="1.0" encoding="UTF-16LE"?><a>x</a>';
      const decoded = yield* decode(utf16Bare(text, "be"));

      assert.strictEqual(decoded.label, "UTF-16LE");
      assert.strictEqual(decoded.text, text);
    }),
  );

  it.effect("reads the encoding from the declaration at the start, not from later text", () =>
    Effect.gen(function* readsOnlyTheDeclaration() {
      const decoded = yield* decode(
        bytesOf(ascii('<?xml version="1.0"?><!-- encoding="ISO-8859-9" --><a/>')),
      );

      assert.strictEqual(decoded.label, "UTF-8");
    }),
  );
});

/**
 * Decode `bytes` with `Buffer` removed, first checking the removal took.
 */
const decodeWithoutBuffer = (bytes: Uint8Array) =>
  withoutBuffer(
    Effect.gen(function* decodesWithoutBuffer() {
      assert.isFalse("Buffer" in globalThis);

      return yield* decode(bytes);
    }),
  );

describe("decode runs without Node's Buffer", () => {
  it.effect("an ISO-8859-1 body of a million bytes", () =>
    Effect.gen(function* decodesLargeLatin1() {
      const bytes = declared("ISO-8859-1", Array.from<number>({ length: 1_048_576 }).fill(0xe9));
      const decoded = yield* decodeWithoutBuffer(bytes);

      assert.strictEqual(decoded.text.length, bytes.length);
      assert.isTrue(decoded.text.endsWith("é</a>"));
    }),
  );
});

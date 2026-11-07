/* oxlint-disable unicorn/text-encoding-identifier-case, unicorn/prefer-code-point -- The tests spell the XML encoding labels (`UTF-8`, `UTF-16LE`) the declarations under test carry, and the UTF-16 writer works in code units, as `encode.ts` does. */
/**
 * `decode` held to XML 1.0's own account of which encoding a document is in: section 4.3.3 and
 * Appendix F.1, read independently by `#crust/test/appendix-f.ts`, with the platform's fatal
 * `TextDecoder` as the second implementation of each decoding, and crust's write-and-read cycle
 * held to the same account.
 */
import { assert, describe, it } from "@effect/vitest";
import { exhaust } from "@grizzle/testing/explore";
import { requiredInSpace } from "@grizzle/testing/features";
import { element } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { searched } from "@grizzle/testing/vitest";
import { Effect, Formatter, Result } from "effect";
import { decode } from "#crust/decode.ts";
import { encode } from "#crust/encode.ts";
import { readXml } from "#crust/read.ts";
import { knownLabels, readingOf } from "#crust/test/appendix-f.ts";
import type { Reading } from "#crust/test/appendix-f.ts";
import { caseHang, GENERATED_TIMEOUT_MS } from "#crust/test/trees.ts";

/**
 * The byte orders of UCS-4 Appendix F.1 names, as the order the four bytes of a code unit are
 * written in, most significant first being 1234.
 */
const ucs4Orders = {
  "1234": [3, 2, 1, 0],
  "2143": [2, 3, 0, 1],
  "3412": [1, 0, 3, 2],
  "4321": [0, 1, 2, 3],
} as const;

/**
 * Write each UTF-16 code unit of `text` as `shifts.length` bytes, the unit's byte of each shift in
 * the order given: one byte, two in either order, or four in any of UCS-4's. The cases' texts are
 * of the Basic Multilingual Plane, where a code unit is a code point, a lone surrogate included.
 *
 * @param text - The text, each code unit within the width.
 * @param shifts - For each byte written, the unit's byte it is, 0 the least significant.
 * @returns The bytes.
 */
const unitBytes = (text: string, shifts: readonly number[]): readonly number[] =>
  Array.from({ length: text.length }, (_, at) => text.charCodeAt(at)).flatMap((unit) =>
    shifts.map((shift) => Math.floor(unit / 0x1_00 ** shift) % 0x1_00),
  );

/**
 * How a case writes its document: the bytes it opens with (a byte order mark, EBCDIC's `<?xm`, or
 * none), how it writes each character, and a code unit its own encoding does not hold.
 */
interface Writing {
  readonly invalid: readonly number[];
  readonly opening: readonly number[];
  readonly units: (text: string) => readonly number[];
}

/**
 * Build a writing that writes each code point as one unit of `shifts.length` bytes.
 *
 * @param shifts - For each byte written, the unit's byte it is.
 * @param marked - Whether it opens with U+FEFF written so.
 * @returns The writing, whose invalid unit is a lone surrogate written so.
 */
const unitWriting = (shifts: readonly number[], marked: boolean): Writing => ({
  invalid: unitBytes("\uD800", shifts),
  opening: marked ? unitBytes("\uFEFF", shifts) : [],
  units: (text) => unitBytes(text, shifts),
});

/**
 * Write `text` as UTF-8.
 */
const utf8 = (text: string): readonly number[] => [...new TextEncoder().encode(text)];

/**
 * The ways a case writes its document: each encoding Appendix F.1's table names, with the mark and
 * without, and one byte per character, the declared label deciding what the reader makes of it.
 */
const openingNames = [
  "EBCDIC",
  "UCS-4 1234",
  "UCS-4 1234 marked",
  "UCS-4 2143",
  "UCS-4 2143 marked",
  "UCS-4 3412",
  "UCS-4 3412 marked",
  "UCS-4 4321",
  "UCS-4 4321 marked",
  "UTF-16BE",
  "UTF-16BE marked",
  "UTF-16LE",
  "UTF-16LE marked",
  "UTF-8",
  "UTF-8 marked",
  "single bytes",
] as const;

/**
 * One way of writing a document.
 */
type Opening = (typeof openingNames)[number];

/**
 * Each way of writing. An invalid unit is 0x80 where a byte is a unit, which no UTF-8 sequence
 * opens with.
 */
const openings: Readonly<Record<Opening, Writing>> = {
  EBCDIC: {
    invalid: [0x80],
    opening: [0x4c, 0x6f, 0xa7, 0x94],
    units: (text) => unitBytes(text, [0]),
  },
  "UCS-4 1234": unitWriting(ucs4Orders["1234"], false),
  "UCS-4 1234 marked": unitWriting(ucs4Orders["1234"], true),
  "UCS-4 2143": unitWriting(ucs4Orders["2143"], false),
  "UCS-4 2143 marked": unitWriting(ucs4Orders["2143"], true),
  "UCS-4 3412": unitWriting(ucs4Orders["3412"], false),
  "UCS-4 3412 marked": unitWriting(ucs4Orders["3412"], true),
  "UCS-4 4321": unitWriting(ucs4Orders["4321"], false),
  "UCS-4 4321 marked": unitWriting(ucs4Orders["4321"], true),
  "UTF-16BE": unitWriting([1, 0], false),
  "UTF-16BE marked": unitWriting([1, 0], true),
  "UTF-16LE": unitWriting([0, 1], false),
  "UTF-16LE marked": unitWriting([0, 1], true),
  "UTF-8": { invalid: [0x80], opening: [], units: utf8 },
  "UTF-8 marked": { invalid: [0x80], opening: [0xef, 0xbb, 0xbf], units: utf8 },
  "single bytes": { invalid: [0x80], opening: [], units: (text) => unitBytes(text, [0]) },
};

/**
 * What opens the document's text: no XML declaration, one that names no encoding, or one naming a
 * label the oracle knows.
 */
const declarations = ["no declaration", "no encoding", ...knownLabels] as const;

/**
 * The root's content: an ASCII letter, a letter beyond ASCII, U+0000, or a code unit the writing's
 * own encoding does not hold (a lone surrogate written as a unit, or, one byte per unit, 0x80,
 * which no UTF-8 sequence opens with), so a body is valid UTF-8 or it is not.
 */
const bodies = ["ascii", "beyond ascii", "nul", "invalid unit"] as const;

/**
 * One case of the box.
 */
interface Detection {
  readonly body: (typeof bodies)[number];
  readonly declaration: (typeof declarations)[number];
  readonly opening: Opening;
}

/**
 * Every case: each way of writing, each declaration or none, each body.
 */
const detection: Gen<Detection> = (source) => ({
  body: source.draw(element(bodies)),
  declaration: source.draw(element(declarations)),
  opening: source.draw(element(openingNames)),
});

/**
 * The size of {@link detection}'s box.
 */
const DETECTIONS = openingNames.length * declarations.length * bodies.length;

/**
 * The prolog of each declaration that names no label: none, and one that names no encoding.
 */
const fixedProlog: ReadonlyMap<string, string> = new Map([
  ["no declaration", ""],
  ["no encoding", '<?xml version="1.0"?>'],
]);

/**
 * Write a case's document: its opening, the declaration, `<a>`, the body and `</a>`.
 *
 * @param detected - The case.
 * @param detected.body - The body.
 * @param detected.declaration - The declaration, or none.
 * @param detected.opening - How it is written.
 * @returns The bytes.
 */
const documentOf = ({ body, declaration, opening }: Detection): Uint8Array => {
  const writing = openings[opening];
  const prolog = fixedProlog.get(declaration) ?? `<?xml version="1.0" encoding="${declaration}"?>`;
  const inner = {
    ascii: writing.units("x"),
    "beyond ascii": writing.units("é"),
    "invalid unit": writing.invalid,
    nul: writing.units("\0"),
  }[body];

  return Uint8Array.from([
    ...writing.opening,
    ...writing.units(`${prolog}<a>`),
    ...inner,
    ...writing.units("</a>"),
  ]);
};

/**
 * What `decode` made of a document, in the oracle's terms.
 *
 * @param bytes - The document.
 * @returns The reading.
 */
const decoded = (bytes: Uint8Array): Effect.Effect<Reading> =>
  decode(bytes).pipe(
    Effect.match({
      onFailure: ({ rule }): Reading => ({ _tag: "refused", rule }),
      onSuccess: ({ label, text }): Reading => ({ _tag: "read", label, text }),
    }),
  );

describe("decode reads the encoding XML 1.0 section 4.3.3 and Appendix F give a document", () => {
  it.effect(
    `for every opening of the table, every declaration or none and every body, exhausted: ${String(DETECTIONS)} documents, each read document written in its own label and read back in it`,
    (ctx) => {
      const outcomes = new Map<string, number>();

      return (
        // Oracle: the specification as a checker (`#crust/test/appendix-f.ts`), XML 1.0 section
        // 4.3.3 and Appendix F.1 transcribed as printed, with Unicode 16.0 section 3.10 and RFC 2781
        // for the UTF-16 schemes, and the platform's fatal TextDecoder as a second decoder.
        // Bound: every way of writing of {@link openings} (each of the table's encodings, with and
        // without a mark), each of the 15 declarations, each of the 4 bodies.
        searched(
          ctx,
          exhaust(
            {
              box: "every opening of Appendix F.1's table, with and without a mark, under each declaration or none, around each body",
              caseHang,
              coverage: requiredInSpace<Opening | (typeof bodies)[number]>([
                ...openingNames,
                ...bodies,
              ]),
              generator: detection,
              limit: DETECTIONS,
              literal: Formatter.format,
              oracle: {
                kind: "specification",
                name: "XML 1.0 (Fifth Edition) section 4.3.3 and Appendix F.1, Unicode 16.0 section 3.10, RFC 2781, and the fatal TextDecoder",
              },
              suite: "crust/decode/detection",
            },
            (detected, c) =>
              Effect.gen(function* readsAsTheSpecificationSays() {
                c.note(detected.opening);
                c.note(detected.body);

                const bytes = documentOf(detected);
                const expected = readingOf(bytes);
                const outcome = expected._tag === "read" ? "read" : expected.rule;
                outcomes.set(outcome, (outcomes.get(outcome) ?? 0) + 1);

                assert.deepStrictEqual(yield* decoded(bytes), expected, Formatter.format(detected));

                if (expected._tag === "refused") {
                  return;
                }

                // The cycle: the tree written in the label it was read as reads back as that label
                // and that tree, and its bytes read so by the oracle too.
                const tree = yield* readXml(bytes);
                const written = yield* Effect.result(encode(tree, tree.charset));
                if (Result.isFailure(written)) {
                  assert.strictEqual(written.failure.where, "label", Formatter.format(detected));

                  return;
                }

                const again = readingOf(written.success);
                assert.deepStrictEqual(
                  again._tag === "read" ? again.label : again,
                  tree.charset,
                  `${Formatter.format(detected)}: crust's bytes in ${tree.charset}`,
                );
                assert.deepStrictEqual(
                  yield* readXml(written.success),
                  tree,
                  Formatter.format(detected),
                );
              }),
          ),
        ).pipe(
          Effect.tap((done) =>
            Effect.sync(() => {
              assert.strictEqual(done.cases, DETECTIONS);
              assert.deepStrictEqual(
                [...outcomes.keys()].toSorted(),
                ["decode", "encoding-mismatch", "nul", "read"],
                "the box reaches every reading and every refusal",
              );
            }),
          ),
        )
      );
    },
    GENERATED_TIMEOUT_MS,
  );
});

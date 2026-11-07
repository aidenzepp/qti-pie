/* oxlint-disable unicorn/text-encoding-identifier-case, unicorn/prefer-code-point -- The tests spell the XML encoding labels (`UTF-8`, `UTF-16LE`) the declarations under test carry, and the UTF-16 writer works in code units, as `encode.ts` does. */
/**
 * `decode` held to XML 1.0's own account of which encoding a document is in: section 4.3.3 and
 * Appendix F.1, read independently by `#crust/test/appendix-f.ts`, with the platform's fatal
 * `TextDecoder` as the second implementation of each decoding, and crust's write-and-read cycle
 * held to the same account. Two boxes exhaust the table's openings; a search draws the rest, and
 * tells a past defect, kept as the table it decoded by, apart from `decode`.
 */
import { assert, describe, it } from "@effect/vitest";
import { drawn, exhaust, explore } from "@grizzle/testing/explore";
import { required, requiredInSpace } from "@grizzle/testing/features";
import { array, boolean, element, int } from "@grizzle/testing/gen";
import type { Gen } from "@grizzle/testing/gen";
import { notesOnly } from "@grizzle/testing/sense";
import { completeShrink } from "@grizzle/testing/shrink";
import { keep, swarm, swarmChoice } from "@grizzle/testing/swarm";
import type { Swarm } from "@grizzle/testing/swarm";
import { searched } from "@grizzle/testing/vitest";
import { Effect, Formatter, Result } from "effect";
import type { Decoded } from "#crust/decode.ts";
import { appendixRows, decode, decodeBy } from "#crust/decode.ts";
import type { ReaderRefusal } from "#crust/errors.ts";
import { encode } from "#crust/encode.ts";
import { readXml } from "#crust/read.ts";
import { appendixF, knownLabels, readingOf, rowOf } from "#crust/test/appendix-f.ts";
import type { Pattern, Reading } from "#crust/test/appendix-f.ts";
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
 * The byte values Appendix F.1's patterns are printed in, and one byte none of them is. `decode`
 * compares an opening byte only for equality with a pattern's, so the one byte outside the table's
 * own, `41`, stands for every other.
 */
const tableBytes = [
  0x00, 0x3c, 0x3f, 0x41, 0x4c, 0x6d, 0x6f, 0x78, 0x94, 0xa7, 0xbb, 0xbf, 0xef, 0xfe, 0xff,
] as const;

/**
 * The declarations a near case writes: none, one naming no encoding, the writing's own label, and
 * another.
 */
const nearDeclarations = ["no declaration", "no encoding", "own label", "another label"] as const;

/**
 * The bodies a near case writes, as raw bytes between `<a>` and `</a>`: a pair that is valid UTF-8
 * (`C3 A9`, `é`) and a pair that is not (`80 80`), each also a whole UTF-16 code unit, so the body
 * keeps a UTF-16 writing's units aligned.
 */
const nearBodies = { "invalid UTF-8": [0x80, 0x80], "valid UTF-8": [0xc3, 0xa9] } as const;

/**
 * The label each writing names itself by, UTF-8 for those no decoder here reads.
 */
const ownLabels: Readonly<Record<Opening, string>> = {
  EBCDIC: "UTF-8",
  "UCS-4 1234": "UTF-8",
  "UCS-4 1234 marked": "UTF-8",
  "UCS-4 2143": "UTF-8",
  "UCS-4 2143 marked": "UTF-8",
  "UCS-4 3412": "UTF-8",
  "UCS-4 3412 marked": "UTF-8",
  "UCS-4 4321": "UTF-8",
  "UCS-4 4321 marked": "UTF-8",
  "UTF-16BE": "UTF-16BE",
  "UTF-16BE marked": "UTF-16",
  "UTF-16LE": "UTF-16LE",
  "UTF-16LE marked": "UTF-16",
  "UTF-8": "UTF-8",
  "UTF-8 marked": "UTF-8",
  "single bytes": "ISO-8859-1",
};

/**
 * One near case: a writing's document with one of its first four bytes replaced.
 */
interface Near {
  readonly body: keyof typeof nearBodies;
  readonly declaration: (typeof nearDeclarations)[number];
  readonly opening: Opening;
  readonly place: number;
  readonly value: (typeof tableBytes)[number];
}

/**
 * Every near case: each writing, declaration and body, with each of its first four bytes replaced
 * by each byte of {@link tableBytes}, its own value among them.
 */
const near: Gen<Near> = (source) => ({
  body: source.draw(element(["valid UTF-8", "invalid UTF-8"] as const)),
  declaration: source.draw(element(nearDeclarations)),
  opening: source.draw(element(openingNames)),
  place: source.draw(int(0, 3)),
  value: source.draw(element(tableBytes)),
});

/**
 * The size of {@link near}'s box.
 */
const NEARS = openingNames.length * nearDeclarations.length * 2 * 4 * tableBytes.length;

/**
 * Write a near case's document: the writing's opening, its declaration, `<a>`, the raw body and
 * `</a>`, then the byte at `place` replaced by `value`.
 *
 * @param nearby - The case.
 * @returns The bytes.
 */
const nearDocument = (nearby: Near): Uint8Array => {
  const writing = openings[nearby.opening];
  const own = ownLabels[nearby.opening];
  const prologs: Readonly<Record<Near["declaration"], string>> = {
    "another label": `<?xml version="1.0" encoding="${own === "UTF-8" ? "UTF-16LE" : "UTF-8"}"?>`,
    "no declaration": "",
    "no encoding": '<?xml version="1.0"?>',
    "own label": `<?xml version="1.0" encoding="${own}"?>`,
  };
  const prolog = prologs[nearby.declaration];
  const bytes = Uint8Array.from([
    ...writing.opening,
    ...writing.units(`${prolog}<a>`),
    ...nearBodies[nearby.body],
    ...writing.units("</a>"),
  ]);
  bytes[nearby.place] = nearby.value;

  return bytes;
};

/**
 * A decoder of a document's bytes, as `decode` is.
 */
type Decoder = (bytes: Uint8Array) => Effect.Effect<Decoded, ReaderRefusal>;

/**
 * What a decoder made of a document, in the oracle's terms.
 *
 * @param bytes - The document.
 * @param decoder - The decoder, `decode` unless a planted one is judged.
 * @returns The reading.
 */
const decoded = (bytes: Uint8Array, decoder: Decoder = decode): Effect.Effect<Reading> =>
  decoder(bytes).pipe(
    Effect.match({
      onFailure: ({ rule }): Reading => ({ _tag: "refused", rule }),
      onSuccess: ({ label, text }): Reading => ({ _tag: "read", label, text }),
    }),
  );

/**
 * The rows of the table whose documents open with a UTF-16 byte order mark.
 */
const utf16Marks = appendixRows.filter((row) => row._tag === "Decodable" && row.mark === 2);

/**
 * The planted bugs, each `decode` with its table changed as one past defect or plausible slip had
 * it, which the search must tell apart from `decode`. 9c54f934^ had no row for `<?` in UTF-16
 * without a byte order mark: it read `3C 00 3F 00` and `00 3C 00 3F` as UTF-8, found no
 * declaration, and refused the document for the U+0000 its bytes hold. The other tries the UTF-16
 * marks before UCS-4's, so `FF FE 00 00`, little-endian UCS-4's mark, reads as UTF-16 (the rows'
 * own order, `#crust/decode.ts`).
 */
const planted = {
  "9c54f934^, no row for UTF-16 without a mark": decodeBy(
    appendixRows.filter((row) => row._tag === "Unsupported" || row.mark > 0),
  ),
  "the UTF-16 marks tried before UCS-4's": decodeBy([
    ...utf16Marks,
    ...appendixRows.filter((row) => !utf16Marks.includes(row)),
  ]),
} as const satisfies Readonly<Record<string, Decoder>>;

/**
 * One planted bug's name.
 */
type PlantedName = keyof typeof planted;

/**
 * The planted bugs' names, in a list.
 */
const PLANTED_LIST = [
  "9c54f934^, no row for UTF-16 without a mark",
  "the UTF-16 marks tried before UCS-4's",
] as const satisfies readonly PlantedName[];

/**
 * What a search case's swarm turns on or off: an XML declaration, its parts and spellings, the
 * kinds of character in the body, and damage to the written bytes.
 */
type Feature =
  | "ASCII"
  | "C1 control"
  | "astral"
  | "beyond ASCII"
  | "byte damage"
  | "declaration"
  | "label case"
  | "lone surrogate"
  | "nul"
  | "single quotes"
  | "standalone"
  | "white space";

/**
 * Every feature, the swarm's order.
 */
const FEATURES = [
  "declaration",
  "label case",
  "single quotes",
  "standalone",
  "white space",
  "ASCII",
  "beyond ASCII",
  "C1 control",
  "astral",
  "lone surrogate",
  "nul",
  "byte damage",
] as const satisfies readonly Feature[];

/**
 * The kinds of character a body draws, ASCII first, the floor a swarm that turns every kind off
 * falls to.
 */
const characterKinds = [
  "ASCII",
  "beyond ASCII",
  "C1 control",
  "astral",
  "lone surrogate",
  "nul",
] as const satisfies readonly Feature[];

/**
 * The characters of each kind: markup and white space among ASCII's; Latin-1 letters, the euro
 * sign windows-1252 holds at 0x80, a letter beyond Latin-1, U+FEFF and the noncharacter U+FFFE;
 * C1 controls, which ISO-8859-1 holds and windows-1252 reads otherwise; the edges of the
 * supplementary planes; each edge of each surrogate range, written alone; and U+0000.
 */
const charactersOf: Readonly<
  Record<(typeof characterKinds)[number], readonly [string, ...string[]]>
> = {
  ASCII: ["a", "<", "&", " ", "\n"],
  "C1 control": ["\u0080", "\u0085", "\u009F"],
  astral: ["\u{10000}", "😀", "\u{10FFFF}"],
  "beyond ASCII": ["é", "ÿ", "€", "日", "\uFEFF", "\uFFFE"],
  "lone surrogate": ["\uD800", "\uDBFF", "\uDC00", "\uDFFF"],
  nul: ["\0"],
};

/**
 * The bytes damage writes: U+0000's, a byte no UTF-8 sequence opens with, the openings of a
 * two-byte sequence, of a surrogate's encoding and of the last plane's, and a byte no UTF-8 holds.
 */
const damageBytes = [0x00, 0x80, 0xc3, 0xed, 0xf4, 0xff] as const;

/**
 * Damage to a document's bytes: none, its last byte dropped, a byte appended, or one of the bytes
 * after the root's start tag replaced, so the declaration names a label the oracle's table holds.
 */
type Damage =
  | { readonly kind: "appended"; readonly value: number }
  | { readonly kind: "dropped" }
  | { readonly kind: "none" }
  | { readonly kind: "replaced"; readonly place: number; readonly value: number };

/**
 * One search case: how the document is written, its XML declaration as text, its body and the
 * damage done to its bytes.
 */
interface Drawn {
  readonly body: string;
  readonly damage: Damage;
  readonly opening: Opening;
  readonly prolog: string;
}

/**
 * Spell a label in letter cases the draw picks, one per letter.
 *
 * @param label - The label.
 * @returns The generator.
 */
const recased =
  (label: string): Gen<string> =>
  (source) =>
    label.replaceAll(/[A-Za-z]/gu, (letter) =>
      source.draw(boolean) ? letter.toUpperCase() : letter.toLowerCase(),
    );

/**
 * Draw an XML declaration under a swarm, as text: none when the swarm leaves it out; else
 * [23] XMLDecl with [24] VersionInfo, perhaps [80] EncodingDecl naming a label the oracle knows,
 * perhaps in other letter cases, and perhaps [32] SDDecl, its [3] S and [25] Eq spaced and its
 * values quoted as the swarm turns on.
 *
 * @param on - The swarm.
 * @returns The generator.
 */
const prologUnder =
  (on: Swarm<Feature>): Gen<string> =>
  (source) => {
    if (!source.draw(keep(on, "declaration"))) {
      return "";
    }

    const spaced = source.draw(keep(on, "white space"));
    const space = (): string => (spaced ? source.draw(element([" ", "\t", "\r\n", "\n  "])) : " ");
    const eq = (): string => (spaced ? source.draw(element(["=", " = ", "\t=\n"])) : "=");
    const quote = (): string =>
      source.draw(keep(on, "single quotes")) ? source.draw(element(['"', "'"])) : '"';
    const quoted = (value: string): string => {
      const mark = quote();

      return `${mark}${value}${mark}`;
    };
    const label = source.draw(element(knownLabels));
    const encoding = source.draw(boolean)
      ? `${space()}encoding${eq()}${quoted(source.draw(keep(on, "label case")) ? source.draw(recased(label)) : label)}`
      : "";
    const standalone = source.draw(keep(on, "standalone"))
      ? `${space()}standalone${eq()}${quoted(source.draw(element(["yes", "no"])))}`
      : "";

    return `<?xml${space()}version${eq()}${quoted(source.draw(element(["1.0", "1.1"])))}${encoding}${standalone}${spaced ? source.draw(element(["", " "])) : ""}?>`;
  };

/**
 * Draw damage under a swarm: none when the swarm leaves it out.
 *
 * @param on - The swarm.
 * @returns The generator.
 */
const damageUnder =
  (on: Swarm<Feature>): Gen<Damage> =>
  (source) => {
    if (!source.draw(keep(on, "byte damage"))) {
      return { kind: "none" };
    }

    const kind = source.draw(element(["appended", "dropped", "replaced"] as const));
    if (kind === "dropped") {
      return { kind };
    }

    const value = source.draw(element([...damageBytes, ...tableBytes]));

    return kind === "appended" ? { kind, value } : { kind, place: source.draw(int(0, 63)), value };
  };

/**
 * Draw one character of a body under a swarm: a kind it turns on, then a character of that kind.
 *
 * @param on - The swarm.
 * @returns The generator.
 */
const characterUnder =
  (on: Swarm<Feature>): Gen<string> =>
  (source) =>
    source.draw(element(charactersOf[source.draw(swarmChoice(on, characterKinds))]));

/**
 * Draw a search case under its own swarm: the swarm first, so each case explores a corner where
 * some features are absent and the rest combine.
 */
const searchCase: Gen<Drawn> = (source) => {
  const on = source.draw(swarm(FEATURES));

  return {
    body: source.draw(array(characterUnder(on), { max: 6, min: 0 })).join(""),
    damage: source.draw(damageUnder(on)),
    opening: source.draw(element(openingNames)),
    prolog: source.draw(prologUnder(on)),
  };
};

/**
 * Write a search case's document: its opening, the declaration, `<a>`, the body and `</a>`, then
 * the damage done.
 *
 * @param drawnCase - The case.
 * @returns The bytes.
 */
const searchDocument = (drawnCase: Drawn): Uint8Array => {
  const writing = openings[drawnCase.opening];
  const head = [...writing.opening, ...writing.units(`${drawnCase.prolog}<a>`)];
  const bytes = [...head, ...writing.units(`${drawnCase.body}</a>`)];
  const { damage } = drawnCase;
  switch (damage.kind) {
    case "appended": {
      return Uint8Array.from([...bytes, damage.value]);
    }
    case "dropped": {
      return Uint8Array.from(bytes.slice(0, -1));
    }
    case "none": {
      return Uint8Array.from(bytes);
    }
    case "replaced": {
      const place = head.length + (damage.place % (bytes.length - head.length));

      return Uint8Array.from(bytes, (byte, at) => (at === place ? damage.value : byte));
    }
    default: {
      return damage satisfies never;
    }
  }
};

/**
 * A situation a search case notes: how the oracle reads it, the row of the table it is in, and
 * each planted bug told apart.
 */
type Situation = `caught: ${PlantedName}` | Pattern | "Other" | "read" | ReaderRefusal["rule"];

/**
 * Every situation the search requires: each reading and refusal `decode` gives, each row of the
 * table it reads, and each planted bug told apart.
 */
const situations: readonly [Situation, ...Situation[]] = [
  "read",
  "decode",
  "encoding-mismatch",
  "nul",
  "unsupported-encoding",
  "00 3C 00 3F",
  "3C 00 3F 00",
  "3C 3F 78 6D",
  "EF BB BF",
  "FE FF ## ##",
  "FF FE ## ##",
  "Other",
  ...PLANTED_LIST.map((name): Situation => `caught: ${name}`),
];

/**
 * How many cases the search draws.
 */
const SEARCHED = 3000;

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
                ["decode", "encoding-mismatch", "nul", "read", "unsupported-encoding"],
                "the box reaches every reading and every refusal",
              );
            }),
          ),
        )
      );
    },
    GENERATED_TIMEOUT_MS,
  );

  it.effect(
    `for every opening one byte away from a pattern of the table, exhausted: ${String(NEARS)} documents, each read as the table says`,
    (ctx) =>
      // Oracle: Appendix F.1 transcribed as printed (`#crust/test/appendix-f.ts`), section 4.3.3 and
      // the fatal TextDecoder, as above. Bound: each way of writing, each of 4 declarations and 2
      // bodies, with each of its first four bytes replaced by each of the table's 14 byte values
      // and one byte outside them, which stands for the rest: so every row's pattern is met, and
      // each byte of it is met wrong.
      searched(
        ctx,
        exhaust(
          {
            box: "every writing's document with one of its first four bytes replaced by a byte of the table or one outside it, under 4 declarations and 2 bodies",
            caseHang,
            coverage: requiredInSpace<Pattern | "Other">([
              "Other",
              ...appendixF.map(({ pattern }) => pattern),
            ]),
            generator: near,
            limit: NEARS,
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "XML 1.0 (Fifth Edition) Appendix F.1 as printed, section 4.3.3, and the fatal TextDecoder",
            },
            suite: "crust/decode/appendix-f",
          },
          (nearby, c) =>
            Effect.gen(function* readsAsTheTableSays() {
              const bytes = nearDocument(nearby);
              c.note(rowOf(bytes)?.pattern ?? "Other");

              assert.deepStrictEqual(
                yield* decoded(bytes),
                readingOf(bytes),
                Formatter.format(nearby),
              );
            }),
        ),
      ).pipe(
        Effect.tap((done) =>
          Effect.sync(() => {
            assert.strictEqual(done.cases, NEARS);
          }),
        ),
      ),
    GENERATED_TIMEOUT_MS,
  );

  it.effect(
    `for ${String(SEARCHED)} documents drawn under a swarm, each read as the oracle reads it, and each planted bug told apart`,
    (ctx) =>
      // Oracle: Appendix F.1 transcribed as printed (`#crust/test/appendix-f.ts`), section 4.3.3 and
      // the fatal TextDecoder, as above. Bound: 3,000 documents, each in one of the 16 writings,
      // perhaps opening with an XML declaration naming one of 13 labels in any letter case, its
      // white space, quotes and standalone drawn, around a body of up to 6 characters of 6 kinds
      // (astral and lone surrogates among them), perhaps with one byte dropped, appended or
      // replaced.
      searched(
        ctx,
        explore(
          {
            caseHang,
            concurrency: 1,
            coverage: required<Situation>(situations, { cases: 600, sense: notesOnly }),
            draw: drawn(searchCase),
            kept: [],
            literal: Formatter.format,
            oracle: {
              kind: "specification",
              name: "XML 1.0 (Fifth Edition) Appendix F.1 as printed, section 4.3.3, and the fatal TextDecoder",
            },
            runs: SEARCHED,
            shrink: completeShrink,
            steerEvery: 16,
            suite: "crust/decode/search",
          },
          (drawnCase, c) =>
            Effect.gen(function* readsAsTheOracleSays() {
              const bytes = searchDocument(drawnCase);
              const expected = readingOf(bytes);
              c.note(expected._tag === "read" ? "read" : expected.rule);
              c.note(rowOf(bytes)?.pattern ?? "Other");

              assert.deepStrictEqual(yield* decoded(bytes), expected, Formatter.format(drawnCase));

              for (const name of PLANTED_LIST) {
                const slipped = yield* decoded(bytes, planted[name]);
                if (Formatter.format(slipped) !== Formatter.format(expected)) {
                  c.note(`caught: ${name}`);
                }
              }
            }),
        ),
      ),
    GENERATED_TIMEOUT_MS,
  );
});

import { readFileSync } from "node:fs";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { readSource } from "#plate/document/read.ts";
import { attr, el, text, xmlNamespace } from "#plate/document/source.ts";
import { speechPlan } from "#plate/speech/plan.ts";
import type { Lexicon } from "#plate/speech/plan.ts";
import { plsNamespace, readLexicon } from "#plate/speech/pls.ts";
import type { InvalidLexicon } from "#plate/speech/pls.ts";
import type { Refusal } from "#plate/validate/refusal.ts";

/**
 * Read a fixture of `fixtures/m4/speech` as bytes.
 *
 * @param name The file's name under the directory.
 * @returns The file's bytes.
 */
const fixture = (name: string): Uint8Array =>
  new Uint8Array(readFileSync(new URL(`../../fixtures/m4/speech/${name}`, import.meta.url)));

/**
 * Encode a string as UTF-8 bytes.
 *
 * @param value The string.
 * @returns Its bytes.
 */
const utf8 = (value: string): Uint8Array => new TextEncoder().encode(value);

/**
 * Construct the bytes of a PLS document with the lexemes given, in `xml:lang` `en` unless another
 * is given.
 *
 * @param lexemes The markup of the lexemes.
 * @param lang The lexicon's `xml:lang`.
 * @returns The document's bytes.
 */
const lexiconBytes = (lexemes: string, lang = "en"): Uint8Array =>
  utf8(
    `<?xml version="1.0" encoding="UTF-8"?><lexicon version="1.0" xmlns="${plsNamespace}" alphabet="ipa" xml:lang="${lang}">${lexemes}</lexicon>`,
  );

/**
 * Read a lexicon, failing the test when the reader refuses it.
 *
 * @param bytes The document's bytes.
 * @returns The lexicon read.
 */
const read = (bytes: Uint8Array): Effect.Effect<Lexicon> => readLexicon(bytes).pipe(Effect.orDie);

/**
 * Read a lexicon, failing the test when the reader accepts it.
 *
 * @param bytes The document's bytes.
 * @returns The refusal.
 */
const refuse = (bytes: Uint8Array): Effect.Effect<InvalidLexicon> =>
  readLexicon(bytes).pipe(
    Effect.flip,
    Effect.mapError(() => new Error("readLexicon accepted the document")),
    Effect.orDie,
  );

/**
 * Read a document through the adapter `readLexicon` reads through, failing the test when the
 * adapter accepts it, so a test names the rule the adapter gives rather than one of its own.
 *
 * @param bytes The document's bytes.
 * @returns The adapter's refusal.
 */
const adapterRefusal = (bytes: Uint8Array): Effect.Effect<Refusal> =>
  readSource("lexicon", bytes).pipe(
    Effect.flip,
    Effect.mapError(() => new Error("the adapter accepted the document")),
    Effect.orDie,
  );

/**
 * Take the remedy out of an `InvalidLexicon` message: the sentence that follows its `detail`.
 *
 * @param refusal The refusal.
 * @returns The remedy.
 */
const remedyOf = (refusal: InvalidLexicon): string => {
  const marker = `${refusal.detail}. `;

  return refusal.message.slice(refusal.message.indexOf(marker) + marker.length);
};

/**
 * Construct a `lexeme` of one grapheme and the pronunciation children given.
 *
 * @param grapheme The grapheme.
 * @param pronunciations The markup of the `alias` and `phoneme` children, in order.
 * @returns The lexeme's markup.
 */
const lexeme = (grapheme: string, pronunciations: string): string =>
  `<lexeme><grapheme>${grapheme}</grapheme>${pronunciations}</lexeme>`;

describe("readLexicon", () => {
  it.effect(
    "[A-35] a PLS lexicon reads into alias entries the plan applies to the spoken text only",
    () =>
      Effect.gen(function* lexiconIntoPlan() {
        const lexicon = yield* read(fixture("lexicon.pls"));

        assert.deepStrictEqual(lexicon, {
          alphabet: Option.some("ipa"),
          entries: [
            { alias: "Question and Test Interoperability", graphemes: ["QTI"] },
            { alias: "the plate renderer", graphemes: ["plate", "Plate"] },
            { alias: "Doctor", graphemes: ["Dr."] },
          ],
          lang: Option.some("en-GB"),
        });

        const plan = speechPlan(
          el("p", [], [text("QTI on plate, not plates. Ask Dr. Plate; tomato.")]),
          lexicon,
        );

        assert.deepStrictEqual(
          plan.segments.map(({ spoken, written }) => ({ spoken, written })),
          [
            {
              spoken:
                "Question and Test Interoperability on the plate renderer, not plates. Ask Doctor the plate renderer; tomato.",
              written: "QTI on plate, not plates. Ask Dr. Plate; tomato.",
            },
          ],
        );
      }),
  );

  it.effect("[A-35] bytes that are not XML and XML that is not a lexicon are InvalidLexicon", () =>
    Effect.gen(function* invalid() {
      const unreadable = yield* refuse(new TextEncoder().encode("<lexicon><lexeme></lexicon>"));

      assert.strictEqual(unreadable.reason, "unreadable");
      assert.include(unreadable.detail, "line 1");
      assert.include(unreadable.message, "unreadable");

      const notXml = yield* refuse(
        new TextEncoder().encode("QTI: Question and Test Interoperability"),
      );

      assert.strictEqual(notXml.reason, "unreadable");

      const notLexicon = yield* refuse(fixture("not-a-lexicon.xml"));

      assert.strictEqual(notLexicon.reason, "not-a-lexicon");
      assert.include(notLexicon.detail, "{urn:example:words}catalogue");
      assert.include(notLexicon.message, "not-a-lexicon");
      assert.include(notLexicon.message, "http://www.w3.org/2005/01/pronunciation-lexicon");

      const wrongNamespace = yield* refuse(
        new TextEncoder().encode('<lexicon xmlns="urn:example:words" version="1.0"/>'),
      );

      assert.strictEqual(wrongNamespace.reason, "not-a-lexicon");
      assert.include(wrongNamespace.detail, "urn:example:words");
    }),
  );

  it.effect("[A-35] two lexemes writing one grapheme: the first in document order wins", () =>
    Effect.gen(function* firstWins() {
      const lexicon = yield* read(
        lexiconBytes(
          lexeme("QTI", "<alias>first</alias>") +
            lexeme("QTI", "<alias>second</alias>") +
            lexeme("plate", "<alias>kept</alias>"),
        ),
      );
      const plan = speechPlan(el("p", [], [text("QTI and plate")]), lexicon);

      assert.deepStrictEqual(
        plan.segments.map(({ spoken }) => spoken),
        ["first and kept"],
      );
      assert.deepStrictEqual(
        lexicon.entries.map(({ alias }) => alias),
        ["first", "second", "kept"],
      );
    }),
  );

  it.effect(
    "[A-35] the preferred pronunciation is the one marked prefer, phoneme or alias, else the first",
    () =>
      Effect.gen(function* preferred() {
        const lexicon = yield* read(
          lexiconBytes(
            lexeme(
              "g1",
              '<alias>a</alias><phoneme prefer="true">təˈmɑːtəʊ</phoneme><alias>b</alias>',
            ) +
              lexeme("g2", '<alias>a</alias><alias prefer="true">b</alias>') +
              lexeme("g3", "<phoneme>təˈmɑːtəʊ</phoneme><alias>a</alias>") +
              lexeme("g4", "<alias>a</alias><phoneme>təˈmɑːtəʊ</phoneme>") +
              lexeme("g5", '<alias prefer="true">a</alias><alias prefer="true">b</alias>') +
              lexeme(
                "g6",
                '<alias>a</alias><alias prefer="false">b</alias><phoneme prefer="true">x</phoneme>',
              ) +
              lexeme("g7", '<alias prefer="true">a</alias><phoneme prefer="true">x</phoneme>'),
          ),
        );

        assert.deepStrictEqual(lexicon.entries, [
          { alias: "b", graphemes: ["g2"] },
          { alias: "a", graphemes: ["g4"] },
          { alias: "a", graphemes: ["g5"] },
          { alias: "a", graphemes: ["g7"] },
        ]);
      }),
  );

  it.effect(
    "[A-35] an unreadable lexicon names crust's own rule and its position, and the message gives the unreadable remedy",
    () =>
      Effect.gen(function* unreadableRules() {
        const malformed = utf8("<lexicon><lexeme></lexicon>");
        const refusal = yield* adapterRefusal(malformed);
        const invalid = yield* refuse(malformed);

        assert.strictEqual(invalid.reason, "unreadable");
        assert.notInclude(invalid.detail, "reader-refused");
        assert.strictEqual(refusal.location.kind, "position");
        assert.include(invalid.detail, refusal.rule);

        if (refusal.location.kind === "position") {
          assert.include(
            invalid.detail,
            `line ${refusal.location.line}, column ${refusal.location.column}`,
          );
        }

        const refused: readonly (readonly [string, Uint8Array])[] = [
          [
            "unsupported-encoding",
            utf8('<?xml version="1.0" encoding="x-no-such-encoding"?><lexicon/>'),
          ],
          [
            "nul",
            new Uint8Array([
              ...utf8('<?xml version="1.0" encoding="UTF-8"?><lexicon>'),
              0,
              ...utf8("</lexicon>"),
            ]),
          ],
          ["element-depth", utf8("<x>".repeat(257) + "</x>".repeat(257))],
        ];

        for (const [name, document] of refused) {
          const adapter = yield* adapterRefusal(document);
          const unreadable = yield* refuse(document);
          const readerRule = Option.getOrElse(adapter.readerRule, () => "");

          assert.strictEqual(readerRule, name);
          assert.strictEqual(unreadable.reason, "unreadable", name);
          assert.include(unreadable.detail, readerRule, name);
          assert.notInclude(unreadable.detail, "reader-refused", name);
          assert.include(unreadable.message, readerRule, name);
        }

        const notLexicon = yield* refuse(fixture("not-a-lexicon.xml"));

        assert.notStrictEqual(remedyOf(invalid), remedyOf(notLexicon));
        assert.isTrue(invalid.message.endsWith(remedyOf(invalid)));
        assert.include(remedyOf(invalid), "well-formed");
        assert.notInclude(remedyOf(invalid), plsNamespace);
      }),
  );

  it.effect(
    "[A-35] a document that is not a lexicon gets the not-a-lexicon remedy, naming the root found",
    () =>
      Effect.gen(function* notLexicons() {
        const unreadable = yield* refuse(utf8("<lexicon><lexeme></lexicon>"));
        const catalogue = yield* refuse(fixture("not-a-lexicon.xml"));
        const wrongNamespace = yield* refuse(
          utf8('<lexicon xmlns="urn:example:words" version="1.0"/>'),
        );

        assert.strictEqual(catalogue.reason, "not-a-lexicon");
        assert.include(catalogue.detail, "{urn:example:words}catalogue");
        assert.strictEqual(wrongNamespace.reason, "not-a-lexicon");
        assert.include(wrongNamespace.detail, "{urn:example:words}lexicon");

        for (const refusal of [catalogue, wrongNamespace]) {
          assert.include(remedyOf(refusal), plsNamespace);
          assert.notInclude(remedyOf(refusal), "well-formed");
          assert.notStrictEqual(remedyOf(refusal), remedyOf(unreadable));
          assert.isTrue(refusal.message.endsWith(remedyOf(refusal)));
        }
      }),
  );

  it.effect("[A-35] the lexicon's language is carried and does not filter the plan", () =>
    Effect.gen(function* languageCarried() {
      const lexicon = yield* read(
        lexiconBytes(lexeme("QTI", "<alias>Question and Test Interoperability</alias>"), "fr"),
      );
      const plan = speechPlan(el("p", [attr("lang", "en", xmlNamespace)], [text("QTI")]), lexicon);

      assert.deepStrictEqual(lexicon.lang, Option.some("fr"));
      assert.deepStrictEqual(
        plan.segments.map(({ lang, spoken }) => ({ lang, spoken })),
        [{ lang: Option.some("en"), spoken: "Question and Test Interoperability" }],
      );
    }),
  );
});

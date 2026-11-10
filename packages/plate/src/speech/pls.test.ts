import { readFileSync } from "node:fs";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { el, text } from "#plate/document/source.ts";
import { speechPlan } from "#plate/speech/plan.ts";
import type { Lexicon } from "#plate/speech/plan.ts";
import { readLexicon } from "#plate/speech/pls.ts";
import type { InvalidLexicon } from "#plate/speech/pls.ts";

/**
 * Read a fixture of `fixtures/m4/speech` as bytes.
 *
 * @param name The file's name under the directory.
 * @returns The file's bytes.
 */
const fixture = (name: string): Uint8Array =>
  new Uint8Array(readFileSync(new URL(`../../fixtures/m4/speech/${name}`, import.meta.url)));

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
});

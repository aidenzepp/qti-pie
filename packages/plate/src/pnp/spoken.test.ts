import { readFileSync } from "node:fs";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { readPnp } from "#plate/pnp/read.ts";
import type { PnpSupports } from "#plate/supports.ts";

/**
 * The AfA PNP 3.0 schema's namespace, which every profile built here is in.
 */
const pnpNamespace = "http://www.imsglobal.org/xsd/qti/qtiv3p0/imsafa3p0pnp_v1p0";

/**
 * Read `fixtures/m5/pnp-spoken.xml` as bytes.
 *
 * @returns The file's bytes.
 */
const spokenFixture = (): Uint8Array =>
  new Uint8Array(readFileSync(new URL("../../fixtures/m5/pnp-spoken.xml", import.meta.url)));

/**
 * Read a profile, failing the test when the reader refuses it.
 *
 * @param children The profile's children, as XML text.
 * @returns The supports read.
 */
const readProfile = (children: string): Effect.Effect<PnpSupports> =>
  readPnp(
    new TextEncoder().encode(
      `<access-for-all-pnp xmlns="${pnpNamespace}">${children}</access-for-all-pnp>`,
    ),
  ).pipe(Effect.orDie);

describe("readPnp's spoken and braille preferences", () => {
  it.effect("[A-40c] [A-40d] [A-40e] the spoken preferences reach PnpSupports.spoken", () =>
    Effect.gen(function* spokenPreferences() {
      const pnp = yield* readPnp(spokenFixture()).pipe(Effect.orDie);
      const spoken = Option.getOrElse(pnp.spoken, () =>
        assert.fail("the profile's spoken is read"),
      );

      assert.deepStrictEqual(spoken.restrictions, new Set(["skip-math-equations"]));
      assert.strictEqual(spoken.speechRate, 270);
      assert.strictEqual(spoken.pitch, 0.75);
      assert.strictEqual(spoken.volume, 0.9);
      assert.deepStrictEqual(spoken.linkIndication, Option.some("speak-link"));
      assert.deepStrictEqual(spoken.typingEcho, Option.some("words"));
      assert.strictEqual(spoken.readingType, "computer-read-aloud");
      assert.deepStrictEqual(pnp.readAloud, Option.some("computer-read-aloud"));
    }),
  );

  it.effect(
    "[A-40c] [A-40d] [A-40e] a spoken feature that sets nothing reads the PNP's defaults",
    () =>
      Effect.gen(function* spokenDefaults() {
        const pnp = yield* readProfile("<spoken/>");
        const spoken = Option.getOrElse(pnp.spoken, () =>
          assert.fail("the profile's spoken is read"),
        );

        assert.strictEqual(spoken.speechRate, 180);
        assert.strictEqual(spoken.pitch, 0.5);
        assert.strictEqual(spoken.volume, 0.5);
        assert.strictEqual(spoken.readingType, "screen-reader");
        assert.deepStrictEqual(spoken.restrictions, new Set());
        assert.isTrue(Option.isNone(spoken.linkIndication));
        assert.isTrue(Option.isNone(spoken.typingEcho));
      }),
  );

  it.effect("[A-40c] several restrictions, and an ext: restriction, all reach restrictions", () =>
    Effect.gen(function* severalRestrictions() {
      const pnp = yield* readProfile(
        "<spoken><reading-type>computer-read-aloud</reading-type>" +
          "<restriction-type>word-by-word</restriction-type>" +
          "<restriction-type>skip-chemistry-equations</restriction-type>" +
          "<restriction-type>ext:slow-reveal</restriction-type></spoken>",
      );
      const spoken = Option.getOrElse(pnp.spoken, () =>
        assert.fail("the profile's spoken is read"),
      );

      assert.deepStrictEqual(
        spoken.restrictions,
        new Set(["word-by-word", "skip-chemistry-equations", "ext:slow-reveal"]),
      );
    }),
  );

  it.effect("[A-40d] [A-40e] every link indication and typing echo reaches spoken", () =>
    Effect.gen(function* indicationsAndEchoes() {
      for (const indication of ["speak-link", "different-voice", "sound-effect", "none"] as const) {
        const pnp = yield* readProfile(
          `<spoken><link-indication>${indication}</link-indication></spoken>`,
        );

        assert.deepStrictEqual(
          pnp.spoken.pipe(Option.flatMap((spoken) => spoken.linkIndication)),
          Option.some(indication),
          indication,
        );
      }

      for (const echo of ["characters", "words", "characters-and-words", "none"] as const) {
        const pnp = yield* readProfile(`<spoken><typing-echo>${echo}</typing-echo></spoken>`);

        assert.deepStrictEqual(
          pnp.spoken.pipe(Option.flatMap((spoken) => spoken.typingEcho)),
          Option.some(echo),
          echo,
        );
      }
    }),
  );

  it.effect("[A-10b] braille preferences reach Supports.braille", () =>
    Effect.gen(function* braillePreferences() {
      const pnp = yield* readPnp(spokenFixture()).pipe(Effect.orDie);
      const braille = Option.getOrElse(pnp.braille, () =>
        assert.fail("the profile's braille is read"),
      );

      assert.deepStrictEqual(braille.brailleType, Option.some("ueb"));
      assert.strictEqual(braille.grade, 1);
      assert.deepStrictEqual(braille.mathType, Option.some("nemeth"));
      assert.strictEqual(braille.deliveryMode, "refreshable");
      assert.isTrue(pnp.catalog.has("braille"));
    }),
  );
});

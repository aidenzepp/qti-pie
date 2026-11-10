import { readFileSync } from "node:fs";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Schema } from "effect";
import { PnpSupportsSchema, SupportsSchema } from "#plate/codec/supports.ts";
import { readPnp } from "#plate/pnp/read.ts";
import type { InvalidPnp, PnpSelector } from "#plate/pnp/read.ts";
import { noSupports } from "#plate/supports.ts";
import type { PnpSupports, Supports } from "#plate/supports.ts";

/**
 * The schema's namespace, the guide's two, and none: the four every PNP element may be in.
 */
const namespaces = [
  "http://www.imsglobal.org/xsd/qti/qtiv3p0/imsafa3p0pnp_v1p0",
  "http://www.imsglobal.org/xsd/qtiv3p0/imsafa3p0pnp_v1p0",
  "http://www.imsglobal.org/xsd//qti/qti3p0/imsafa3p0pnp_v1p0",
  "",
] as const;

/**
 * Read a fixture of `fixtures/m4` as bytes.
 *
 * @param name The file's name under the directory.
 * @returns The file's bytes.
 */
const fixture = (name: string): Uint8Array =>
  new Uint8Array(readFileSync(new URL(`../../fixtures/m4/${name}`, import.meta.url)));

/**
 * Encode a document's text as bytes.
 *
 * @param xml The document.
 * @returns Its UTF-8 bytes.
 */
const bytes = (xml: string): Uint8Array => new TextEncoder().encode(xml);

/**
 * Wrap profile children in a root in the schema's namespace.
 *
 * @param children The profile's children, as XML text.
 * @param namespace The root's namespace, the schema's by default; `""` declares none.
 * @returns The document's bytes.
 */
const profile = (children: string, namespace: string = namespaces[0]): Uint8Array =>
  bytes(
    `<access-for-all-pnp${namespace === "" ? "" : ` xmlns="${namespace}"`}>${children}</access-for-all-pnp>`,
  );

/**
 * Read a document, failing the test when the reader refuses it.
 *
 * @param document The document's bytes.
 * @param selector The record to read.
 * @returns The supports read.
 */
const read = (document: Uint8Array, selector?: PnpSelector): Effect.Effect<PnpSupports> =>
  readPnp(document, selector).pipe(Effect.orDie);

/**
 * Read a document, failing the test when the reader accepts it.
 *
 * @param document The document's bytes.
 * @param selector The record to read.
 * @returns The refusal.
 */
const refuse = (document: Uint8Array, selector?: PnpSelector): Effect.Effect<InvalidPnp> =>
  readPnp(document, selector).pipe(
    Effect.flip,
    Effect.mapError(() => new Error("readPnp accepted the document")),
    Effect.orDie,
  );

/**
 * Project what `readPnp` read onto the contract's fields, which `SupportsSchema` checks.
 *
 * @param pnp The supports read.
 * @returns The same value with only `Supports`' fields.
 */
const supportsOf = (pnp: PnpSupports): Supports => ({
  additionalTestingTime: pnp.additionalTestingTime,
  answerMasking: pnp.answerMasking,
  braille: pnp.braille,
  breaks: pnp.breaks,
  catalog: pnp.catalog,
  display: pnp.display,
  keywordTranslationLanguage: pnp.keywordTranslationLanguage,
  longDescriptionVisible: pnp.longDescriptionVisible,
  readAloud: pnp.readAloud,
  signLanguage: pnp.signLanguage,
  suppressTts: pnp.suppressTts,
  tools: pnp.tools,
});

describe("readPnp", () => {
  it.effect("[pnp] a schema-shaped profile reads every feature into Supports", () =>
    Effect.gen(function* everyFeature() {
      const pnp = yield* read(fixture("pnp-profile.xml"));

      assert.deepStrictEqual(
        pnp.additionalTestingTime,
        Option.some({ factor: 1.5, kind: "multiplier" }),
      );
      assert.isTrue(pnp.answerMasking);
      assert.deepStrictEqual(
        pnp.catalog,
        new Set([
          "additional-directions",
          "audio-description",
          "braille",
          "glossary-on-screen",
          "high-contrast",
          "keyboard-directions",
          "keyword-translation",
          "linguistic-guidance",
          "long-description",
          "sign-language",
          "simplified-graphics",
          "simplified-language-portions",
          "spoken",
          "tactile",
          "transcript",
        ]),
      );
      assert.deepStrictEqual(pnp.display, {
        invertDisplayPolarity: true,
        keywordEmphasis: true,
        languageOfInterface: Option.some("de"),
        layoutSingleColumn: true,
        magnification: Option.some(2),
        textAppearance: Option.some({
          backgroundColor: Option.some("#fffff0"),
          fontColor: Option.some("#101010"),
        }),
      });
      assert.deepStrictEqual(pnp.readAloud, Option.some("computer-read-aloud"));
      assert.isFalse(pnp.suppressTts);
      assert.deepStrictEqual(
        pnp.tools,
        new Set([
          "calculator-on-screen",
          "dictionary-on-screen",
          "homophone-checker-on-screen",
          "line-reader",
          "note-taking-on-screen",
          "outliner-on-screen",
          "peer-interaction-on-screen",
          "spell-checker-on-screen",
          "thesaurus-on-screen",
          "visual-organizer-on-screen",
        ]),
      );

      assert.deepStrictEqual(
        pnp.braille,
        Option.some({
          brailleType: Option.some("ueb"),
          deliveryMode: "embossed",
          grade: 1,
          language: Option.some("en"),
          mathType: Option.some("nemeth"),
        }),
      );
      assert.isTrue(pnp.breaks);
      assert.isTrue(pnp.features.has("captions"));
      assert.isTrue(pnp.features.has("alternative-text"));
      assert.isTrue(pnp.features.has("item-translation"));
      assert.isFalse(pnp.features.has("encouragement"));
      assert.deepStrictEqual(pnp.hazards, new Set(["flashing", "motion-simulation"]));
      assert.deepStrictEqual(pnp.ignored, []);
      assert.deepStrictEqual(pnp.inputRequirements, new Set(["full-keyboard-control"]));
      assert.deepStrictEqual(
        pnp.invertedColors,
        Option.some({ background: Option.some("#000000"), foreground: Option.some("#ffffff") }),
      );
      assert.deepStrictEqual(pnp.languages, new Map([["item-translation", "fr"]]));
      assert.deepStrictEqual(pnp.keywordTranslationLanguage, Option.some("es"));
      assert.deepStrictEqual(pnp.signLanguage, Option.some("ase"));
      assert.isTrue(pnp.longDescriptionVisible);
      assert.deepStrictEqual(pnp.optional, new Set(["calculator-on-screen", "line-reader"]));
      assert.deepStrictEqual(pnp.atStart, new Set(["spoken"]));
      assert.deepStrictEqual(pnp.prohibited, new Set(["encouragement"]));
      assert.deepStrictEqual(
        pnp.spoken,
        Option.some({
          linkIndication: Option.some("speak-link"),
          pitch: 0.4,
          readingType: "computer-read-aloud",
          restrictions: new Set(["skip-math-equations"]),
          speechRate: 160,
          typingEcho: Option.some("words"),
          volume: 0.8,
        }),
      );
      assert.deepStrictEqual(
        pnp.text,
        Option.some({
          colorTheme: Option.none(),
          fontNames: ["Plate Sans", "Plate Serif"],
          fontSize: Option.some({ kind: "points", value: 18 }),
          genericFontFace: Option.some("sans serif"),
          letterSpacing: Option.some(1),
          lineHeight: Option.some(24),
          lineSpacing: Option.some(1.5),
          uniformFontSizing: true,
          wordSpacing: Option.some(2),
          wordWrapping: true,
        }),
      );
      assert.deepStrictEqual(pnp.toolSettings, {
        calculatorType: Option.some("scientific"),
        highlightColor: Option.some("#ffff00"),
      });
    }),
  );

  it.effect("[pnp] each guide spelling of the 12 rows reads as its schema meaning", () =>
    Effect.gen(function* guideSpellings() {
      const guide = yield* read(fixture("pnp-guide-spellings.xml"));
      const schema = yield* read(
        bytes(`<access-for-all-pnp-records xmlns="${namespaces[0]}">
  <access-for-all-pnp-record>
    <person-sourced-id source-system="sis.example">person-300</person-sourced-id>
    <appointment-id>assignment-7</appointment-id>
    <access-for-all-pnp>
      <hazard-avoidance>flashing</hazard-avoidance>
      <hazard-avoidance>sound</hazard-avoidance>
      <hazard-avoidance>olfactory-hazard</hazard-avoidance>
      <hazard-avoidance>motion-simulation</hazard-avoidance>
      <hazard-avoidance>ext:iowa-reading</hazard-avoidance>
      <input-requirements>full-switch-control</input-requirements>
      <input-requirements>full-touchscreen-control</input-requirements>
      <spoken><restriction-type>skip-chemistry-equations</restriction-type></spoken>
      <braille><braille-type>ebae</braille-type></braille>
      <spell-checker-on-screen/>
      <homophone-checker-on-screen/>
      <text-appearance>
        <color-theme>yellow-blue</color-theme>
        <font-size>1.6</font-size>
        <letter-spacing>2</letter-spacing>
      </text-appearance>
      <activate-at-initialization-set><spoken/><spell-checker-on-screen/></activate-at-initialization-set>
    </access-for-all-pnp>
  </access-for-all-pnp-record>
</access-for-all-pnp-records>`),
      );

      assert.deepStrictEqual(guide, schema);

      // Row 9: the guide's `assignment-id` selects the record as an appointment id.
      const byAssignment = yield* read(fixture("pnp-guide-spellings.xml"), {
        appointmentId: "assignment-7",
      });

      assert.deepStrictEqual(byAssignment, guide);

      // Rows 2 and 4: every hazard, and an `ext:` value with a hyphen.
      assert.deepStrictEqual(
        guide.hazards,
        new Set(["flashing", "sound", "olfactory-hazard", "motion-simulation", "ext:iowa-reading"]),
      );
      // Row 5: the guide's two extra input requirements.
      assert.deepStrictEqual(
        guide.inputRequirements,
        new Set(["full-switch-control", "full-touchscreen-control"]),
      );
      // Row 6: one value under the schema's spelling.
      assert.deepStrictEqual(
        guide.spoken.pipe(Option.map((spoken) => spoken.restrictions)),
        Option.some(new Set(["skip-chemistry-equations"])),
      );
      // Row 7: both set names read.
      assert.deepStrictEqual(guide.atStart, new Set(["spoken", "spell-checker-on-screen"]));
      // Row 8: the tool names of the guide are the schema's tools.
      assert.deepStrictEqual(
        guide.tools,
        new Set(["homophone-checker-on-screen", "spell-checker-on-screen"]),
      );
      // Row 12: `ubae` is `ebae`.
      assert.deepStrictEqual(
        guide.braille.pipe(Option.map((braille) => braille.brailleType)),
        Option.some(Option.some("ebae")),
      );
      // Rows 1, 10 and 11: color-theme is read, a font-size under 4 is a factor, letter-spacing is
      // pixels.
      assert.deepStrictEqual(
        guide.text,
        Option.some({
          colorTheme: Option.some("yellow-blue"),
          fontNames: [],
          fontSize: Option.some({ kind: "factor", value: 1.6 }),
          genericFontFace: Option.none(),
          letterSpacing: Option.some(2),
          lineHeight: Option.none(),
          lineSpacing: Option.none(),
          uniformFontSizing: false,
          wordSpacing: Option.none(),
          wordWrapping: false,
        }),
      );
    }),
  );

  it.effect("[pnp] the three namespaces and no namespace all read", () =>
    Effect.gen(function* everyNamespace() {
      const children =
        '<answer-masking/><high-contrast/><spoken><reading-type>screen-reader</reading-type></spoken><magnification><all-content zoom-amount="1.5"/></magnification>';
      const first = yield* read(profile(children, namespaces[0]));
      const rest = yield* Effect.all(
        namespaces.slice(1).map((namespace) => read(profile(children, namespace))),
      );

      assert.isTrue(first.answerMasking);
      assert.deepStrictEqual(first.catalog, new Set(["high-contrast", "spoken"]));
      assert.deepStrictEqual(first.readAloud, Option.some("screen-reader"));
      assert.deepStrictEqual(first.display.magnification, Option.some(1.5));
      assert.deepStrictEqual(first.ignored, []);
      assert.strictEqual(rest.length, 3);

      for (const other of rest) {
        assert.deepStrictEqual(other, first);
      }
    }),
  );

  it.effect("[pnp] an empty profile is noSupports", () =>
    Effect.gen(function* emptyProfile() {
      const pnp = yield* read(profile(""));

      assert.deepStrictEqual(supportsOf(pnp), noSupports);
      assert.deepStrictEqual(pnp.features, new Set());
      assert.deepStrictEqual(pnp.ignored, []);
      assert.deepStrictEqual(pnp.prohibited, new Set());
      assert.isTrue(Option.isNone(pnp.braille));
      assert.isTrue(Option.isNone(pnp.spoken));
      assert.isTrue(Option.isNone(pnp.text));
      assert.isFalse(pnp.breaks);
      assert.isFalse(pnp.longDescriptionVisible);
    }),
  );

  it.effect("[pnp] a bulk file selects by personSourcedId and appointmentId", () =>
    Effect.gen(function* bulk() {
      const document = fixture("pnp-bulk.xml");

      const byPerson = yield* read(document, { personSourcedId: "person-100" });

      assert.isTrue(byPerson.answerMasking);
      assert.isFalse(byPerson.catalog.has("high-contrast"));

      const byAppointment = yield* read(document, { appointmentId: "appointment-3" });

      assert.isFalse(byAppointment.answerMasking);
      assert.isTrue(byAppointment.catalog.has("high-contrast"));

      const byBoth = yield* read(document, {
        appointmentId: "appointment-2",
        personSourcedId: "person-200",
      });

      assert.deepStrictEqual(byBoth, byAppointment);

      const ambiguous = yield* refuse(document);

      assert.strictEqual(ambiguous.reason, "ambiguous-record");
      assert.include(ambiguous.detail, "person-100");
      assert.include(ambiguous.detail, "person-200");
      assert.include(ambiguous.message, "ambiguous-record");

      const unknown = yield* refuse(document, { personSourcedId: "person-999" });

      assert.strictEqual(unknown.reason, "unknown-record");
      assert.include(unknown.detail, "person-999");
      assert.include(unknown.detail, "person-100");

      const mismatched = yield* refuse(document, {
        appointmentId: "appointment-1",
        personSourcedId: "person-200",
      });

      assert.strictEqual(mismatched.reason, "unknown-record");

      const single = yield* read(
        bytes(`<access-for-all-pnp-records xmlns="${namespaces[0]}">
  <access-for-all-pnp-record>
    <person-sourced-id source-system="sis.example">person-1</person-sourced-id>
    <access-for-all-pnp><tactile/></access-for-all-pnp>
  </access-for-all-pnp-record>
</access-for-all-pnp-records>`),
      );

      assert.deepStrictEqual(single.catalog, new Set(["tactile"]));
    }),
  );

  it.effect(
    "[pnp] prohibit-set removes a feature the profile also assigns, and the sets are read",
    () =>
      Effect.gen(function* sets() {
        const pnp = yield* read(
          profile(
            "<captions/><transcript/><spoken/><answer-masking/><calculator-on-screen/>" +
              "<activate-as-option-set><calculator-on-screen/></activate-as-option-set>" +
              "<activate-at-initialization-set><spoken/></activate-at-initialization-set>" +
              "<prohibit-set><captions/><answer-masking/><braille/></prohibit-set>",
          ),
        );

        assert.deepStrictEqual(pnp.optional, new Set(["calculator-on-screen"]));
        assert.deepStrictEqual(pnp.atStart, new Set(["spoken"]));
        assert.deepStrictEqual(pnp.prohibited, new Set(["captions", "answer-masking", "braille"]));
        assert.deepStrictEqual(
          pnp.features,
          new Set(["transcript", "spoken", "calculator-on-screen"]),
        );
        assert.deepStrictEqual(pnp.catalog, new Set(["transcript", "spoken"]));
        assert.isFalse(pnp.answerMasking);
        assert.deepStrictEqual(pnp.readAloud, Option.some("screen-reader"));
        assert.deepStrictEqual(pnp.tools, new Set(["calculator-on-screen"]));
      }),
  );

  it.effect("[pnp] a foreign-namespace element is ignored and counted", () =>
    Effect.gen(function* foreign() {
      const pnp = yield* read(
        profile(
          '<high-contrast/><x:note xmlns:x="urn:example:notes">A proctor note</x:note><tactile/>',
        ),
      );

      assert.deepStrictEqual(pnp.ignored, ["{urn:example:notes}note"]);
      assert.deepStrictEqual(pnp.catalog, new Set(["high-contrast", "tactile"]));
    }),
  );

  it.effect(
    "[pnp] bytes that are not XML, and XML that is not a PNP, are InvalidPnp with the reason",
    () =>
      Effect.gen(function* invalid() {
        const unreadable = yield* refuse(
          bytes("<access-for-all-pnp><captions></access-for-all-pnp>"),
        );

        assert.strictEqual(unreadable.reason, "unreadable");
        assert.include(unreadable.detail, "line 1");
        assert.include(unreadable.message, "unreadable");

        const notXml = yield* refuse(bytes("supports: captions"));

        assert.strictEqual(notXml.reason, "unreadable");

        const notPnp = yield* refuse(
          bytes('<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0"/>'),
        );

        assert.strictEqual(notPnp.reason, "not-a-pnp");
        assert.include(notPnp.detail, "qti-assessment-item");
        assert.include(notPnp.detail, "http://www.imsglobal.org/xsd/imsqtiasi_v3p0");

        const wrongNamespace = yield* refuse(
          bytes('<access-for-all-pnp xmlns="urn:example:not-pnp"/>'),
        );

        assert.strictEqual(wrongNamespace.reason, "not-a-pnp");
        assert.include(wrongNamespace.detail, "urn:example:not-pnp");
      }),
  );

  it.effect("[pnp] the Supports Schema round-trips readPnp's output", () =>
    Effect.gen(function* roundTrip() {
      const encode = Schema.encodeUnknownSync(SupportsSchema);
      const decode = Schema.decodeUnknownSync(SupportsSchema);

      for (const name of ["pnp-profile.xml", "pnp-guide-spellings.xml"]) {
        const supports = supportsOf(yield* read(fixture(name)));

        assert.deepStrictEqual(decode(encode(supports)), supports, name);
      }

      const bulk = supportsOf(
        yield* read(fixture("pnp-bulk.xml"), { personSourcedId: "person-100" }),
      );

      assert.deepStrictEqual(decode(encode(bulk)), bulk);

      const empty = supportsOf(yield* read(profile("")));

      assert.deepStrictEqual(decode(encode(empty)), empty);
    }),
  );

  it.effect("[pnp] what readPnp reads satisfies PnpSupportsSchema, as read", () =>
    Effect.gen(function* pnpSchema() {
      const decode = Schema.decodeUnknownSync(PnpSupportsSchema);

      for (const name of ["pnp-profile.xml", "pnp-guide-spellings.xml"]) {
        const pnp = yield* read(fixture(name));

        assert.deepStrictEqual(decode(pnp), pnp, name);
      }

      const empty = yield* read(profile(""));

      assert.deepStrictEqual(decode(empty), empty);
    }),
  );
});

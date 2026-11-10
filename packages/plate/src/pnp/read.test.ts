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
 * Fresh documents the set and spelling cases share, written for these tests and copying nothing
 * from 1EdTech.
 */
const documents = {
  atStartOnly: profile(
    "<activate-at-initiation-set><spoken/><spell-checker/><answer-masking/></activate-at-initiation-set>",
    namespaces[1],
  ),
  optionOnly: profile(
    '<answer-masking/><spoken/><captions/><calculator-on-screen calculator-type="scientific"/>' +
      "<additional-testing-time><time-multiplier>2</time-multiplier></additional-testing-time>" +
      "<activate-as-option-set><additional-testing-time/><answer-masking/><calculator-on-screen/><captions/><spoken/></activate-as-option-set>",
  ),
  prohibitedOverSets: profile(
    '<spoken/><calculator-on-screen calculator-type="scientific"/><spell-checker-on-screen/><line-reader/>' +
      "<activate-at-initialization-set><spoken/><spell-checker-on-screen/></activate-at-initialization-set>" +
      "<activate-as-option-set><calculator-on-screen/><line-reader/></activate-as-option-set>" +
      "<prohibit-set><spoken/><calculator-on-screen/></prohibit-set>",
  ),
  ubaeRecords: bytes(`<access-for-all-pnp-records xmlns="${namespaces[0]}">
  <access-for-all-pnp-record>
    <person-sourced-id>ubae</person-sourced-id>
    <appointment-id>ubae</appointment-id>
    <access-for-all-pnp>
      <text-appearance><font-face><font-name>ubae</font-name></font-face></text-appearance>
    </access-for-all-pnp>
  </access-for-all-pnp-record>
  <access-for-all-pnp-record>
    <person-sourced-id>ebae</person-sourced-id>
    <access-for-all-pnp><tactile/></access-for-all-pnp>
  </access-for-all-pnp-record>
  <access-for-all-pnp-record>
    <person-sourced-id>skip-chemical-equations</person-sourced-id>
    <access-for-all-pnp><transcript/></access-for-all-pnp>
  </access-for-all-pnp-record>
</access-for-all-pnp-records>`),
};

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
 * Take the remedy of a refusal's message: what follows the detail it names.
 *
 * @param refusal The refusal.
 * @returns The sentence that says what to change.
 */
const remedy = (refusal: InvalidPnp): string =>
  refusal.message.slice(refusal.message.indexOf(refusal.detail) + refusal.detail.length);

/**
 * Project what `readPnp` read onto the contract's fields, which `SupportsSchema` checks.
 *
 * @param pnp The supports read.
 * @returns The same value with only `Supports`' fields.
 */
const supportsOf = (pnp: PnpSupports): Supports => ({
  additionalTestingTime: pnp.additionalTestingTime,
  answerMasking: pnp.answerMasking,
  catalog: pnp.catalog,
  display: pnp.display,
  readAloud: pnp.readAloud,
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
      assert.deepStrictEqual(
        pnp.languages,
        new Map([
          ["item-translation", "fr"],
          ["keyword-translation", "es"],
          ["sign-language", "ase"],
        ]),
      );
      assert.isTrue(pnp.longDescriptionVisible);
      assert.deepStrictEqual(pnp.optional, new Set(["dictionary-on-screen"]));
      assert.isFalse(pnp.features.has("dictionary-on-screen"));
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
        assert.deepStrictEqual(pnp.features, new Set(["transcript", "spoken"]));
        assert.deepStrictEqual(pnp.catalog, new Set(["transcript", "spoken"]));
        assert.isFalse(pnp.answerMasking);
        assert.deepStrictEqual(pnp.readAloud, Option.some("screen-reader"));
        assert.deepStrictEqual(pnp.tools, new Set());
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

  it.effect(
    "[pnp] a feature named only in activate-as-option-set is optional and off at start (ruling D17)",
    () =>
      Effect.gen(function* optionSet() {
        const named = yield* read(
          profile("<activate-as-option-set><calculator-on-screen/></activate-as-option-set>"),
        );

        assert.deepStrictEqual(named.optional, new Set(["calculator-on-screen"]));
        assert.deepStrictEqual(named.tools, new Set());
        assert.deepStrictEqual(named.features, new Set());
        assert.deepStrictEqual(named.atStart, new Set());

        const assigned = yield* read(documents.optionOnly);

        assert.deepStrictEqual(
          assigned.optional,
          new Set([
            "additional-testing-time",
            "answer-masking",
            "calculator-on-screen",
            "captions",
            "spoken",
          ]),
        );
        assert.deepStrictEqual(assigned.features, new Set());
        assert.deepStrictEqual(assigned.atStart, new Set());
        assert.deepStrictEqual(assigned.tools, new Set());
        assert.deepStrictEqual(assigned.catalog, new Set());
        assert.isFalse(assigned.answerMasking);
        assert.isTrue(Option.isNone(assigned.readAloud));
        assert.isTrue(Option.isNone(assigned.spoken));
        assert.isTrue(Option.isNone(assigned.additionalTestingTime));
        assert.isTrue(Option.isNone(assigned.toolSettings.calculatorType));
        assert.deepStrictEqual(supportsOf(assigned), noSupports);
      }),
  );

  it.effect("[pnp] a feature named in activate-at-initiation-set is active at start", () =>
    Effect.gen(function* atStart() {
      const guide = yield* read(documents.atStartOnly);

      assert.deepStrictEqual(
        guide.atStart,
        new Set(["answer-masking", "spell-checker-on-screen", "spoken"]),
      );
      assert.deepStrictEqual(guide.readAloud, Option.some("screen-reader"));
      assert.deepStrictEqual(
        guide.spoken,
        Option.some({
          linkIndication: Option.none(),
          pitch: 0.5,
          readingType: "screen-reader",
          restrictions: new Set(),
          speechRate: 180,
          typingEcho: Option.none(),
          volume: 0.5,
        }),
      );
      assert.isTrue(guide.answerMasking);
      assert.deepStrictEqual(guide.catalog, new Set(["spoken"]));
      assert.deepStrictEqual(guide.tools, new Set(["spell-checker-on-screen"]));
      assert.deepStrictEqual(
        guide.features,
        new Set(["answer-masking", "spell-checker-on-screen", "spoken"]),
      );
      assert.deepStrictEqual(guide.optional, new Set());

      const schema = yield* read(
        profile(
          "<activate-at-initialization-set><spoken/><spell-checker-on-screen/><answer-masking/></activate-at-initialization-set>",
        ),
      );

      assert.deepStrictEqual(schema, guide);

      const both = yield* read(
        profile(
          "<activate-at-initialization-set><spoken/></activate-at-initialization-set>" +
            "<activate-as-option-set><spoken/></activate-as-option-set>",
        ),
      );

      assert.deepStrictEqual(both.readAloud, Option.some("screen-reader"));
      assert.deepStrictEqual(both.atStart, new Set(["spoken"]));
      assert.deepStrictEqual(both.optional, new Set(["spoken"]));
    }),
  );

  it.effect(
    "[pnp] prohibit-set wins over the at-start and the option set: off and not optional",
    () =>
      Effect.gen(function* prohibitedWins() {
        const pnp = yield* read(documents.prohibitedOverSets);

        assert.deepStrictEqual(pnp.prohibited, new Set(["calculator-on-screen", "spoken"]));
        assert.deepStrictEqual(pnp.atStart, new Set(["spell-checker-on-screen"]));
        assert.deepStrictEqual(pnp.optional, new Set(["line-reader"]));
        assert.deepStrictEqual(pnp.features, new Set(["spell-checker-on-screen"]));
        assert.deepStrictEqual(pnp.tools, new Set(["spell-checker-on-screen"]));
        assert.deepStrictEqual(pnp.catalog, new Set());
        assert.isTrue(Option.isNone(pnp.readAloud));
        assert.isTrue(Option.isNone(pnp.spoken));
        assert.isTrue(Option.isNone(pnp.toolSettings.calculatorType));
      }),
  );

  it.effect("[pnp] a person-sourced-id or font name spelled ubae is read as written", () =>
    Effect.gen(function* ubaeText() {
      const byPerson = yield* read(documents.ubaeRecords, { personSourcedId: "ubae" });

      assert.deepStrictEqual(
        byPerson.text.pipe(Option.map((text) => text.fontNames)),
        Option.some(["ubae"]),
      );
      assert.isFalse(byPerson.catalog.has("tactile"));

      const byAppointment = yield* read(documents.ubaeRecords, { appointmentId: "ubae" });

      assert.deepStrictEqual(byAppointment, byPerson);

      const other = yield* read(documents.ubaeRecords, { personSourcedId: "ebae" });

      assert.deepStrictEqual(other.catalog, new Set(["tactile"]));

      const chemical = yield* read(documents.ubaeRecords, {
        personSourcedId: "skip-chemical-equations",
      });

      assert.deepStrictEqual(chemical.catalog, new Set(["transcript"]));

      const unknown = yield* refuse(documents.ubaeRecords, { personSourcedId: "uebe" });

      assert.strictEqual(unknown.reason, "unknown-record");
      assert.include(unknown.detail, "ubae");
      assert.include(unknown.detail, "ebae");
    }),
  );

  it.effect(
    "[pnp] the guide's value spellings read as the schema's in the element each row names",
    () =>
      Effect.gen(function* scopedSpellings() {
        const pnp = yield* read(
          profile(
            "<braille><braille-type>ubae</braille-type></braille>" +
              "<spoken>" +
              "<restriction-type>skip-chemical-equations</restriction-type>" +
              "<restriction-type>skip-math-equations</restriction-type>" +
              "</spoken>" +
              "<text-appearance><font-face><font-name>ubae</font-name><font-name>skip-chemical-equations</font-name></font-face></text-appearance>",
          ),
        );

        assert.deepStrictEqual(
          pnp.braille.pipe(Option.map((braille) => braille.brailleType)),
          Option.some(Option.some("ebae")),
        );
        assert.deepStrictEqual(
          pnp.spoken.pipe(Option.map((spoken) => spoken.restrictions)),
          Option.some(new Set(["skip-chemistry-equations", "skip-math-equations"])),
        );
        assert.deepStrictEqual(
          pnp.text.pipe(Option.map((text) => text.fontNames)),
          Option.some(["ubae", "skip-chemical-equations"]),
        );

        const crossed = yield* read(
          profile(
            "<braille><braille-type>skip-chemical-equations</braille-type></braille>" +
              "<spoken><restriction-type>ubae</restriction-type></spoken>",
          ),
        );

        assert.deepStrictEqual(
          crossed.braille.pipe(Option.map((braille) => braille.brailleType)),
          Option.some(Option.none()),
        );
        assert.deepStrictEqual(
          crossed.spoken.pipe(Option.map((spoken) => spoken.restrictions)),
          Option.some(new Set()),
        );
      }),
  );

  it.effect("[pnp] encouragement, unprohibited, reads as a feature", () =>
    Effect.gen(function* encouragement() {
      const given = yield* read(profile("<encouragement/>"));

      assert.deepStrictEqual(given.features, new Set(["encouragement"]));
      assert.deepStrictEqual(given.prohibited, new Set());
      assert.deepStrictEqual(supportsOf(given), noSupports);

      const prohibited = yield* read(
        profile("<encouragement/><prohibit-set><encouragement/></prohibit-set>"),
      );

      assert.deepStrictEqual(prohibited.features, new Set());
      assert.deepStrictEqual(prohibited.prohibited, new Set(["encouragement"]));
    }),
  );

  it.effect("[pnp] fixed-minutes and unlimited read into additionalTestingTime", () =>
    Effect.gen(function* testingTime() {
      const minutes = yield* read(
        profile(
          "<additional-testing-time><fixed-minutes>30</fixed-minutes></additional-testing-time>",
        ),
      );

      assert.deepStrictEqual(
        minutes.additionalTestingTime,
        Option.some({ kind: "minutes", minutes: 30 }),
      );

      const unlimited = yield* read(
        profile("<additional-testing-time><unlimited/></additional-testing-time>"),
      );

      assert.deepStrictEqual(unlimited.additionalTestingTime, Option.some({ kind: "unlimited" }));

      for (const unread of [
        "<time-multiplier>0</time-multiplier>",
        "<fixed-minutes>0</fixed-minutes>",
        "<fixed-minutes>-5</fixed-minutes>",
        "<fixed-minutes>soon</fixed-minutes>",
        "",
      ]) {
        const none = yield* read(
          profile(`<additional-testing-time>${unread}</additional-testing-time>`),
        );

        assert.isTrue(Option.isNone(none.additionalTestingTime), unread);
      }
    }),
  );

  it.effect("[pnp] a feature that gives no setting reads with the Schema's defaults", () =>
    Effect.gen(function* defaults() {
      const pnp = yield* read(
        profile(
          "<braille/><spoken/><text-appearance/><long-description/><environment/><invert-display-polarity/><calculator-on-screen/><line-reader/>",
        ),
      );

      assert.deepStrictEqual(
        pnp.braille,
        Option.some({
          brailleType: Option.none(),
          deliveryMode: "refreshable",
          grade: 2,
          language: Option.none(),
          mathType: Option.none(),
        }),
      );
      assert.deepStrictEqual(pnp.readAloud, Option.some("screen-reader"));
      assert.deepStrictEqual(
        pnp.spoken,
        Option.some({
          linkIndication: Option.none(),
          pitch: 0.5,
          readingType: "screen-reader",
          restrictions: new Set(),
          speechRate: 180,
          typingEcho: Option.none(),
          volume: 0.5,
        }),
      );
      assert.deepStrictEqual(
        pnp.text,
        Option.some({
          colorTheme: Option.none(),
          fontNames: [],
          fontSize: Option.none(),
          genericFontFace: Option.none(),
          letterSpacing: Option.none(),
          lineHeight: Option.none(),
          lineSpacing: Option.none(),
          uniformFontSizing: false,
          wordSpacing: Option.none(),
          wordWrapping: false,
        }),
      );
      assert.isTrue(Option.isNone(pnp.display.textAppearance));
      assert.isFalse(pnp.longDescriptionVisible);
      assert.isFalse(pnp.breaks);
      assert.isTrue(pnp.display.invertDisplayPolarity);
      assert.deepStrictEqual(
        pnp.invertedColors,
        Option.some({ background: Option.none(), foreground: Option.none() }),
      );
      assert.deepStrictEqual(pnp.toolSettings, {
        calculatorType: Option.none(),
        highlightColor: Option.none(),
      });
      assert.deepStrictEqual(pnp.tools, new Set(["calculator-on-screen", "line-reader"]));

      const outside = yield* read(
        profile(
          "<braille><delivery-mode>glowing</delivery-mode><grade>4</grade></braille><spoken><reading-type>telepathy</reading-type></spoken>",
        ),
      );

      assert.deepStrictEqual(
        outside.braille.pipe(Option.map((braille) => [braille.deliveryMode, braille.grade])),
        Option.some(["refreshable", 2]),
      );
      assert.deepStrictEqual(outside.readAloud, Option.some("screen-reader"));
    }),
  );

  it.effect("[pnp] an empty bulk file fails unknown-record and names no selector", () =>
    Effect.gen(function* emptyBulk() {
      const empty = bytes(`<access-for-all-pnp-records xmlns="${namespaces[0]}"/>`);
      const refusal = yield* refuse(empty);

      assert.strictEqual(refusal.reason, "unknown-record");
      assert.include(refusal.detail, "holds no record");
      assert.notInclude(refusal.detail, "selector");
      assert.notInclude(refusal.message, "selector");
      assert.deepStrictEqual(refusal.records, []);

      const asked = yield* refuse(empty, { personSourcedId: "person-1" });

      assert.strictEqual(asked.reason, "unknown-record");
      assert.strictEqual(asked.detail, refusal.detail);
    }),
  );

  it.effect(
    "[pnp] each InvalidPnp reason names its own remedy, and the record ids sit in a field",
    () =>
      Effect.gen(function* remedies() {
        const bulk = fixture("pnp-bulk.xml");
        const unreadable = yield* refuse(
          bytes("<access-for-all-pnp><captions></access-for-all-pnp>"),
        );
        const notPnp = yield* refuse(bytes('<qti-assessment-item xmlns="urn:example:item"/>'));
        const ambiguous = yield* refuse(bulk);
        const unknown = yield* refuse(bulk, { personSourcedId: "person-999" });
        const empty = yield* refuse(
          bytes(`<access-for-all-pnp-records xmlns="${namespaces[0]}"/>`),
        );

        assert.include(remedy(unreadable), "well-formed");
        assert.include(remedy(notPnp), "access-for-all-pnp");
        assert.include(remedy(ambiguous), "selector");
        assert.include(remedy(unknown), "selector");
        assert.include(remedy(empty), "access-for-all-pnp-record");

        for (const refusal of [unreadable, notPnp, empty]) {
          assert.notInclude(remedy(refusal), "selector", refusal.reason);
        }

        assert.strictEqual(
          new Set([unreadable, notPnp, ambiguous, unknown, empty].map(remedy)).size,
          5,
        );

        const held = [
          { appointmentIds: ["appointment-1"], personSourcedId: "person-100" },
          { appointmentIds: ["appointment-2", "appointment-3"], personSourcedId: "person-200" },
        ];

        assert.deepStrictEqual(ambiguous.records, held);
        assert.deepStrictEqual(unknown.records, held);
        assert.deepStrictEqual(unreadable.records, []);
        assert.deepStrictEqual(notPnp.records, []);
        assert.include(ambiguous.detail, "appointment-3");
      }),
  );

  it.effect("[pnp] a document the reader refuses fails unreadable with the reader's own rule", () =>
    Effect.gen(function* readerRules() {
      const malformed = yield* refuse(bytes("<access-for-all-pnp><captions></access-for-all-pnp>"));

      assert.strictEqual(malformed.reason, "unreadable");
      assert.include(malformed.detail, "not-well-formed");
      assert.include(malformed.detail, "line 1");

      const refused: readonly (readonly [string, Uint8Array])[] = [
        [
          "unsupported-encoding",
          bytes('<?xml version="1.0" encoding="no-such-charset"?><access-for-all-pnp/>'),
        ],
        [
          "nul",
          new Uint8Array([
            ...bytes('<?xml version="1.0" encoding="UTF-8"?><access-for-all-pnp>'),
            0,
            ...bytes("</access-for-all-pnp>"),
          ]),
        ],
        ["element-depth", bytes("<x>".repeat(257) + "</x>".repeat(257))],
      ];

      for (const [rule, document] of refused) {
        const refusal = yield* refuse(document);

        assert.strictEqual(refusal.reason, "unreadable", rule);
        assert.include(refusal.detail, rule);
        assert.notInclude(refusal.detail, "reader-refused", rule);
        assert.include(refusal.message, rule);
      }
    }),
  );

  it.effect("[pnp] a number is read as XML Schema writes it, so 0x1E is not 30 minutes", () =>
    Effect.gen(function* numbers() {
      const hex = yield* read(
        profile(
          "<additional-testing-time><fixed-minutes>0x1E</fixed-minutes></additional-testing-time>" +
            "<spoken><pitch>0x1E</pitch></spoken>" +
            '<magnification><all-content zoom-amount="0x1E"/></magnification>',
        ),
      );

      // The Schema admits only a positive number of minutes, so an unreadable value is no time.
      assert.isTrue(Option.isNone(hex.additionalTestingTime));
      assert.deepStrictEqual(
        hex.spoken.pipe(Option.map((spoken) => spoken.pitch)),
        Option.some(0.5),
      );
      assert.isTrue(Option.isNone(hex.display.magnification));

      for (const text of ["0x1E", "0b11", "0o17", "Infinity", "INF", "NaN", "1_0", "1,5", ""]) {
        const none = yield* read(
          profile(
            `<additional-testing-time><time-multiplier>${text}</time-multiplier></additional-testing-time>`,
          ),
        );

        assert.isTrue(Option.isNone(none.additionalTestingTime), text);
      }

      for (const [text, factor] of [
        ["+1.5", 1.5],
        [".5", 0.5],
        ["2.", 2],
        ["1.5E1", 15],
        ["  3  ", 3],
      ] as const) {
        const some = yield* read(
          profile(
            `<additional-testing-time><time-multiplier>${text}</time-multiplier></additional-testing-time>`,
          ),
        );

        assert.deepStrictEqual(
          some.additionalTestingTime,
          Option.some({ factor, kind: "multiplier" }),
          text,
        );
      }
    }),
  );

  it.effect(
    "[pnp] every result of the set, spelling and default cases satisfies PnpSupportsSchema",
    () =>
      Effect.gen(function* everyResult() {
        const decode = Schema.decodeUnknownSync(PnpSupportsSchema);

        for (const [name, document, selector] of [
          ["optionOnly", documents.optionOnly, undefined],
          ["atStartOnly", documents.atStartOnly, undefined],
          ["prohibitedOverSets", documents.prohibitedOverSets, undefined],
          ["ubae by person", documents.ubaeRecords, { personSourcedId: "ubae" }],
          ["ubae by appointment", documents.ubaeRecords, { appointmentId: "ubae" }],
          [
            "defaults",
            profile("<braille/><spoken/><text-appearance/><invert-display-polarity/>"),
            undefined,
          ],
          [
            "minutes",
            profile(
              "<additional-testing-time><fixed-minutes>30</fixed-minutes></additional-testing-time>",
            ),
            undefined,
          ],
          [
            "unlimited",
            profile("<additional-testing-time><unlimited/></additional-testing-time>"),
            undefined,
          ],
          ["encouragement", profile("<encouragement/>"), undefined],
        ] as const) {
          const pnp = yield* read(document, selector);

          assert.deepStrictEqual(decode(pnp), pnp, name);
        }
      }),
  );

  it.effect("[pnp] a profile that repeats one feature 10,000 times reads in bounded time", () =>
    Effect.gen(function* repeated() {
      const hazards = ["flashing", "sound", "ext:iowa-reading", "olfactory-hazard"] as const;
      const children = Array.from({ length: 2500 }, () => hazards)
        .flat()
        .map((hazard) => `<hazard-avoidance>${hazard}</hazard-avoidance>`)
        .join("");

      assert.strictEqual(children.split("<hazard-avoidance>").length - 1, 10_000);

      const started = performance.now();
      const pnp = yield* read(profile(children));
      const elapsed = performance.now() - started;

      assert.deepStrictEqual(pnp.hazards, new Set(hazards));
      assert.deepStrictEqual(pnp.features, new Set(["hazard-avoidance"]));
      assert.deepStrictEqual(pnp.ignored, []);
      assert.isBelow(elapsed, 1000);
    }),
  );
});

import { readFileSync } from "node:fs";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import {
  acceptedItem,
  configure,
  noSupports,
  open,
  readPnp,
  redact,
  render,
} from "#plate/index.ts";
import type { PnpSupports, Supports, ToolPreference } from "#plate/index.ts";
import { m5Claims } from "#plate/ledger/claims/m5.ts";

/**
 * The AfA PNP 3.0 schema's namespace, which every profile built here is in.
 */
const pnpNamespace = "http://www.imsglobal.org/xsd/qti/qtiv3p0/imsafa3p0pnp_v1p0";

/**
 * The instance token every render here passes, so two renders of one item differ only by what the
 * supports change.
 */
const instance = "q1";

/**
 * The seven on-screen tools of rows A-18, A-31, A-32, A-33, A-39, A-43 and A-45, which the
 * profile needs no setting for.
 */
const sevenTools = [
  "homophone-checker-on-screen",
  "note-taking-on-screen",
  "outliner-on-screen",
  "peer-interaction-on-screen",
  "spell-checker-on-screen",
  "thesaurus-on-screen",
  "visual-organizer-on-screen",
] as const satisfies readonly ToolPreference[];

/**
 * The rows area m5's claims name, in Appendix A's order: the nine tool rows, hazard avoidance,
 * input requirements, item translation, the language of the interface and activate-as-option.
 */
const claimedRows: string[] = [
  "A-12",
  "A-16",
  "A-18",
  "A-19",
  "A-21",
  "A-25",
  "A-27",
  "A-31",
  "A-32",
  "A-33",
  "A-39",
  "A-43",
  "A-45",
  "A-46",
];

/**
 * A single Choice of three colours bound to `RESPONSE`, the item every render here shows: plate
 * writes its controls as native radio buttons.
 */
const choiceItem = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="m5-10-choice" title="Colours" adaptive="false" time-dependent="false">
  <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
    <qti-correct-response><qti-value>B</qti-value></qti-correct-response>
  </qti-response-declaration>
  <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>
  <qti-item-body>
    <qti-choice-interaction response-identifier="RESPONSE" max-choices="1">
      <qti-prompt>Which colour is listed second?</qti-prompt>
      <qti-simple-choice identifier="A">Red</qti-simple-choice>
      <qti-simple-choice identifier="B">Green</qti-simple-choice>
      <qti-simple-choice identifier="C">Blue</qti-simple-choice>
    </qti-choice-interaction>
  </qti-item-body>
  <qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct.xml"/>
</qti-assessment-item>`;

/**
 * Read a fixture of `fixtures/m5` as bytes.
 *
 * @param name The file's name under the directory.
 * @returns The file's bytes.
 */
const fixture = (name: string): Uint8Array =>
  new Uint8Array(readFileSync(new URL(`../../fixtures/m5/${name}`, import.meta.url)));

/**
 * Encode a document's text as bytes.
 *
 * @param xml The document.
 * @returns Its UTF-8 bytes.
 */
const bytes = (xml: string): Uint8Array => new TextEncoder().encode(xml);

/**
 * Wrap profile children in an `access-for-all-pnp` root in the schema's namespace.
 *
 * @param children The profile's children, as XML text.
 * @returns The document's bytes.
 */
const profile = (children: string): Uint8Array =>
  bytes(`<access-for-all-pnp xmlns="${pnpNamespace}">${children}</access-for-all-pnp>`);

/**
 * Read a document, failing the test when the reader refuses it.
 *
 * @param document The document's bytes.
 * @returns The supports read.
 */
const read = (document: Uint8Array): Effect.Effect<PnpSupports> =>
  readPnp(document).pipe(Effect.orDie);

/**
 * Open {@link choiceItem}, redact it and render it under supports, as a host does.
 *
 * @param supports The supports the redaction and the render both take.
 * @returns The item's HTML.
 */
const renderChoice = Effect.fnUntraced(function* renderChoice(supports: Supports) {
  const verdict = yield* open("items/choice.xml", bytes(choiceItem));
  const accepted = Option.getOrElse(acceptedItem(verdict), () =>
    assert.fail(`the Choice item is ${verdict.verdict}, not accepted`),
  );
  const configuration = yield* configure({});
  const redacted = redact(accepted, undefined, configuration, { supports });
  const rendered = yield* Effect.fromResult(
    render(redacted, configuration, { instance, supports }),
  );

  return rendered.html;
});

describe("readPnp's tool preferences", () => {
  it.effect("[A-12] the calculator preference reaches tools with its type", () =>
    Effect.gen(function* calculator() {
      const pnp = yield* read(fixture("pnp-tools.xml"));

      assert.isTrue(pnp.tools.has("calculator-on-screen"));
      assert.deepStrictEqual(pnp.toolSettings.calculatorType, Option.some("graphing"));
      assert.isTrue(
        pnp.atStart.has("calculator-on-screen"),
        "the fixture names the calculator in the at-start set too, which leaves its type read",
      );
    }),
  );

  it.effect(
    "[A-12] every calculator type the AfA PNP names reaches calculatorType, an ext: type kept",
    () =>
      Effect.gen(function* calculatorTypes() {
        for (const type of ["basic", "standard", "scientific", "graphing", "ext:cas"]) {
          const pnp = yield* read(profile(`<calculator-on-screen calculator-type="${type}"/>`));

          assert.deepStrictEqual(pnp.tools, new Set(["calculator-on-screen"]), type);
          assert.deepStrictEqual(pnp.toolSettings.calculatorType, Option.some(type), type);
        }

        const untyped = yield* read(profile("<calculator-on-screen/>"));

        assert.deepStrictEqual(untyped.tools, new Set(["calculator-on-screen"]));
        assert.isTrue(Option.isNone(untyped.toolSettings.calculatorType));
      }),
  );

  it.effect(
    "[A-18] [A-31] [A-32] [A-33] [A-39] [A-43] [A-45] each assigned on-screen tool reaches tools",
    () =>
      Effect.gen(function* sevenOnScreenTools() {
        const pnp = yield* read(fixture("pnp-tools.xml"));

        for (const tool of sevenTools) {
          assert.isTrue(pnp.tools.has(tool), tool);
        }

        assert.deepStrictEqual(
          pnp.tools,
          new Set<ToolPreference>(["calculator-on-screen", "line-reader", ...sevenTools]),
          "the fixture assigns nine tools and no dictionary, so nothing else is added",
        );
        assert.deepStrictEqual(pnp.ignored, [], "the reader reads every element the fixture holds");

        for (const tool of sevenTools) {
          const alone = yield* read(profile(`<${tool}/>`));

          assert.deepStrictEqual(alone.tools, new Set([tool]), tool);
        }
      }),
  );

  it.effect("[A-27] the line reader reaches tools with its highlight colour", () =>
    Effect.gen(function* lineReader() {
      const pnp = yield* read(fixture("pnp-tools.xml"));

      assert.isTrue(pnp.tools.has("line-reader"));
      assert.deepStrictEqual(pnp.toolSettings.highlightColor, Option.some("#ffff00"));
      assert.isTrue(
        pnp.atStart.has("line-reader"),
        "the fixture names the line reader in the at-start set too, which leaves its colour read",
      );

      const uncoloured = yield* read(profile("<line-reader/>"));

      assert.deepStrictEqual(uncoloured.tools, new Set(["line-reader"]));
      assert.isTrue(Option.isNone(uncoloured.toolSettings.highlightColor));
    }),
  );

  it.effect("[A-16] hazard avoidance reaches hazards, extensions kept", () =>
    Effect.gen(function* hazards() {
      const pnp = yield* read(fixture("pnp-tools.xml"));

      assert.deepStrictEqual(pnp.hazards, new Set(["flashing", "ext:strobe"]));
    }),
  );

  it.effect("[A-19] input requirements reach inputRequirements", () =>
    Effect.gen(function* inputRequirements() {
      const pnp = yield* read(fixture("pnp-tools.xml"));

      assert.deepStrictEqual(pnp.inputRequirements, new Set(["full-switch-control"]));
    }),
  );

  it.effect("[A-21] the item-translation language reaches languages", () =>
    Effect.gen(function* itemTranslation() {
      const pnp = yield* read(fixture("pnp-tools.xml"));

      assert.strictEqual(pnp.languages.get("item-translation"), "es");
      assert.deepStrictEqual(
        pnp.languages,
        new Map([["item-translation", "es"]]),
        "the language of the interface is not an item translation",
      );
      assert.isTrue(pnp.features.has("item-translation"));
    }),
  );

  it.effect(
    "[A-25] the language of interface reaches display.languageOfInterface, and plate's own text stays English",
    () =>
      Effect.gen(function* languageOfInterface() {
        const pnp = yield* read(fixture("pnp-tools.xml"));
        const plain = yield* renderChoice(noSupports);
        const asked = yield* renderChoice(pnp);
        const refused = yield* Effect.flip(configure({ locale: "fr" }));

        assert.deepStrictEqual(pnp.display.languageOfInterface, Option.some("fr"));
        assert.strictEqual(asked, plain);
        assert.include(asked, 'lang="en"');
        assert.deepStrictEqual(refused.field, Option.some("locale"));
        assert.include(refused.allowed, '"en"', "English is the one locale plate writes in");
      }),
  );
});

describe("plate's render under a PNP's preferences", () => {
  it.effect("[A-19] rendering an item with input requirements set changes nothing", () =>
    Effect.gen(function* inputRequirementsRender() {
      const pnp = yield* read(fixture("pnp-tools.xml"));
      const plain = yield* renderChoice(noSupports);
      const asked = yield* renderChoice(pnp);

      assert.deepStrictEqual(pnp.inputRequirements, new Set(["full-switch-control"]));
      assert.strictEqual(asked, plain);
      assert.lengthOf(
        [...asked.matchAll(/<input\b[^>]*\btype="radio"/gu)],
        3,
        "the three choices are native radio buttons whatever the PNP asks",
      );
    }),
  );

  it.effect(
    "[A-12] [A-16] [A-18] [A-21] [A-27] [A-31] [A-32] [A-33] [A-39] [A-43] [A-45] rendering with the tools, hazards and translation set writes the HTML noSupports writes",
    () =>
      Effect.gen(function* rendersNoTool() {
        const pnp = yield* read(fixture("pnp-tools.xml"));
        const plain = yield* renderChoice(noSupports);
        const asked = yield* renderChoice(pnp);

        assert.strictEqual(pnp.tools.size, 9);
        assert.strictEqual(pnp.hazards.size, 2);
        assert.isTrue(pnp.languages.has("item-translation"));
        assert.strictEqual(asked, plain);
      }),
  );
});

describe("area m5's claims", () => {
  it("[A-12] [A-16] [A-18] [A-19] [A-21] [A-25] [A-27] [A-31] [A-32] [A-33] [A-39] [A-43] [A-45] [A-46] every claim of area m5 names one of this issue's rows and states a source", () => {
    assert.deepStrictEqual(
      m5Claims.map((claim) => claim.id),
      claimedRows,
    );

    for (const claim of m5Claims) {
      assert.isAbove(claim.source.trim().length, 0, `${claim.id} states a source`);
    }
  });
});

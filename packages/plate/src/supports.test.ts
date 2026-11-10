import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result, Schema } from "effect";
import { PnpSupportsSchema, SupportsSchema } from "#plate/codec/supports.ts";
import { configure } from "#plate/configuration.ts";
import { attr, doc, el, mathmlNamespace, text } from "#plate/document/source.ts";
import { buildItem } from "#plate/model/item.ts";
import { redact, render } from "#plate/render.ts";
import { catalogSupports, noPnpSupports, noSupports, toolPreferences } from "#plate/supports.ts";
import type { PnpSupports, Supports } from "#plate/supports.ts";
import { acceptForTest } from "#plate/validate/verdict.ts";

/**
 * A supports value with every field on: every predefined catalog support and one extension, every
 * tool, each display preference set, an `ext:` braille type.
 */
const everySupport: Supports = {
  additionalTestingTime: Option.some({ factor: 1.5, kind: "multiplier" }),
  answerMasking: true,
  braille: Option.some({
    brailleType: Option.some("ext:sample-braille"),
    deliveryMode: "embossed",
    grade: 1,
    language: Option.some("en"),
    mathType: Option.some("nemeth"),
  }),
  breaks: true,
  catalog: new Set([...catalogSupports, "ext:sample-support"]),
  display: {
    invertDisplayPolarity: true,
    keywordEmphasis: true,
    languageOfInterface: Option.some("es"),
    layoutSingleColumn: true,
    magnification: Option.some(2),
    textAppearance: Option.some({
      backgroundColor: Option.some("#000000"),
      fontColor: Option.some("#ffffff"),
    }),
  },
  keywordTranslationLanguage: Option.some("es"),
  longDescriptionVisible: true,
  readAloud: Option.some("computer-read-aloud"),
  signLanguage: Option.some("ase"),
  suppressTts: true,
  tools: new Set(toolPreferences),
};

/**
 * A PNP supports value with every PNP-only field set: {@link everySupport} widened with each
 * preference a PNP gives beyond the contract, an `ext:` value in every extensible vocabulary.
 */
const everyPnpSupport: PnpSupports = {
  ...everySupport,
  atStart: new Set(["spoken"]),
  features: new Set(["captions", "encouragement", "spoken"]),
  hazards: new Set(["flashing", "ext:sample-hazard"]),
  ignored: ["{urn:example:notes}note"],
  inputRequirements: new Set(["full-switch-control"]),
  invertedColors: Option.some({ background: Option.some("#000000"), foreground: Option.none() }),
  languages: new Map([["item-translation", "fr"]]),
  optional: new Set(["calculator-on-screen"]),
  prohibited: new Set(["captions"]),
  spoken: Option.some({
    linkIndication: Option.some("speak-link"),
    pitch: 0.4,
    readingType: "computer-read-aloud",
    restrictions: new Set(["skip-chemistry-equations", "ext:sample-restriction"]),
    speechRate: 160,
    typingEcho: Option.some("words"),
    volume: 0.8,
  }),
  text: Option.some({
    colorTheme: Option.some("yellow-blue"),
    fontNames: ["Plate Sans"],
    fontSize: Option.some({ kind: "factor", value: 1.6 }),
    genericFontFace: Option.some("sans serif"),
    letterSpacing: Option.some(2),
    lineHeight: Option.none(),
    lineSpacing: Option.some(1.5),
    uniformFontSizing: true,
    wordSpacing: Option.none(),
    wordWrapping: false,
  }),
  toolSettings: {
    calculatorType: Option.some("graphing"),
    highlightColor: Option.some("#ffff00"),
  },
};

describe("noSupports", () => {
  it("names the fifteen predefined catalog supports", () => {
    assert.strictEqual(catalogSupports.length, 15);
    assert.strictEqual(new Set(catalogSupports).size, 15);
  });

  it("holds every predefined support and every preference off", () => {
    for (const support of catalogSupports) {
      assert.isFalse(noSupports.catalog.has(support), support);
    }

    assert.strictEqual(noSupports.catalog.size, 0);
    assert.strictEqual(noSupports.tools.size, 0);
    assert.isTrue(Option.isNone(noSupports.additionalTestingTime));
    assert.isFalse(noSupports.answerMasking);
    assert.isTrue(Option.isNone(noSupports.braille));
    assert.isFalse(noSupports.breaks);
    assert.isTrue(Option.isNone(noSupports.keywordTranslationLanguage));
    assert.isFalse(noSupports.longDescriptionVisible);
    assert.isTrue(Option.isNone(noSupports.readAloud));
    assert.isTrue(Option.isNone(noSupports.signLanguage));
    assert.isFalse(noSupports.suppressTts);
    assert.deepStrictEqual(noSupports.display, {
      invertDisplayPolarity: false,
      keywordEmphasis: false,
      languageOfInterface: Option.none(),
      layoutSingleColumn: false,
      magnification: Option.none(),
      textAppearance: Option.none(),
    });
  });
});

describe("SupportsSchema", () => {
  it("decodes noSupports and a value with every field on, as given", () => {
    const decode = Schema.decodeUnknownResult(SupportsSchema);

    assert.deepStrictEqual(decode(noSupports), Result.succeed(noSupports));
    assert.deepStrictEqual(decode(everySupport), Result.succeed(everySupport));
  });

  it("decodes the PNP preferences a renderer reads, as given", () => {
    const preferences: Supports = {
      ...noSupports,
      braille: Option.some({
        brailleType: Option.some("ueb"),
        deliveryMode: "refreshable",
        grade: 2,
        language: Option.some("en"),
        mathType: Option.none(),
      }),
      breaks: true,
      keywordTranslationLanguage: Option.some("es"),
      longDescriptionVisible: true,
      signLanguage: Option.some("ase"),
    };

    assert.deepStrictEqual(
      Schema.decodeUnknownResult(SupportsSchema)(preferences),
      Result.succeed(preferences),
    );
  });

  it("refuses a catalog support neither predefined nor `ext:`, and a time factor that is not positive", () => {
    const decode = Schema.decodeUnknownResult(SupportsSchema);

    assert.isTrue(Result.isFailure(decode({ ...noSupports, catalog: new Set(["glossary"]) })));
    assert.isTrue(
      Result.isFailure(
        decode({
          ...noSupports,
          additionalTestingTime: Option.some({ factor: 0, kind: "multiplier" }),
        }),
      ),
    );
  });
});

describe("PnpSupportsSchema", () => {
  it("decodes noPnpSupports and a value with every PNP field set, as given", () => {
    const decode = Schema.decodeUnknownResult(PnpSupportsSchema);

    assert.deepStrictEqual(decode(noPnpSupports), Result.succeed(noPnpSupports));
    assert.deepStrictEqual(decode(everyPnpSupport), Result.succeed(everyPnpSupport));
  });

  it("refuses a misspelt hazard, a feature outside the PNP's names, and a bare `ext:`", () => {
    const decode = Schema.decodeUnknownResult(PnpSupportsSchema);

    assert.isTrue(Result.isFailure(decode({ ...everyPnpSupport, hazards: new Set(["flasing"]) })));
    assert.isTrue(
      Result.isFailure(decode({ ...everyPnpSupport, features: new Set(["spell-checker"]) })),
    );
    assert.isTrue(Result.isFailure(decode({ ...everyPnpSupport, hazards: new Set(["ext:"]) })));
  });

  it("holds noSupports' contract fields and every PNP preference off", () => {
    const { atStart, features, hazards, ignored, inputRequirements, languages } = noPnpSupports;

    assert.deepStrictEqual(Schema.decodeUnknownSync(SupportsSchema)(noPnpSupports), noSupports);
    assert.deepStrictEqual(
      [
        atStart.size,
        features.size,
        hazards.size,
        ignored.length,
        inputRequirements.size,
        languages.size,
      ],
      [0, 0, 0, 0, 0, 0],
    );
  });
});

describe("the supports option", () => {
  it.effect(
    "is accepted by redact and render, and changes only what a landed module reads of them",
    () =>
      Effect.gen(function* sameHtml() {
        const configuration = yield* configure({});
        const item = yield* Effect.fromResult(
          buildItem(
            doc(
              "item.xml",
              el(
                "qti-assessment-item",
                [attr("identifier", "item"), attr("title", "Item")],
                [
                  el(
                    "qti-item-body",
                    [],
                    [
                      el("p", [], [text("Read the passage."), el("math", [], [], mathmlNamespace)]),
                      el("qti-rubric-block", [
                        attr("use", "instructions"),
                        attr("view", "candidate"),
                      ]),
                    ],
                  ),
                ],
              ),
            ),
          ),
        );
        const accepted = acceptForTest(item);
        const plain = redact(accepted, undefined, configuration);
        const supported = redact(accepted, undefined, configuration, { supports: everySupport });

        assert.deepStrictEqual(supported, plain);

        const without = yield* Effect.fromResult(render(plain, configuration, { instance: "q1" }));
        const withSupports = yield* Effect.fromResult(
          render(supported, configuration, { instance: "q1", supports: everySupport }),
        );
        const withNone = yield* Effect.fromResult(
          render(plain, configuration, { instance: "q1", supports: noSupports }),
        );

        assert.strictEqual(
          withSupports.html.replace(
            ' style="font-size: 200%; color: #ffffff; background-color: #000000"',
            "",
          ),
          without.html,
        );
        assert.strictEqual(withNone.html, without.html);
      }),
  );
});

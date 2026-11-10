import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result, Schema } from "effect";
import { SupportsSchema } from "#plate/codec/supports.ts";
import { configure } from "#plate/configuration.ts";
import { attr, doc, el, mathmlNamespace, text } from "#plate/document/source.ts";
import { buildItem } from "#plate/model/item.ts";
import { redact, render } from "#plate/render.ts";
import { catalogSupports, noSupports, toolPreferences } from "#plate/supports.ts";
import type { Supports } from "#plate/supports.ts";
import { acceptForTest } from "#plate/validate/verdict.ts";

/**
 * A supports value with every field on: every predefined catalog support and one extension, every
 * tool, each display preference set.
 */
const everySupport: Supports = {
  additionalTestingTime: Option.some({ factor: 1.5, kind: "multiplier" }),
  answerMasking: true,
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
  readAloud: Option.some("computer-read-aloud"),
  suppressTts: true,
  tools: new Set(toolPreferences),
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
    assert.isTrue(Option.isNone(noSupports.readAloud));
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

describe("the supports option", () => {
  it.effect(
    "is accepted by redact and render, and changes nothing while every content module is a stub",
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

        assert.strictEqual(withSupports.html, without.html);
        assert.strictEqual(withNone.html, without.html);
      }),
  );
});

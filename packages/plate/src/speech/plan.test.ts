import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";
import { attr, el, ssmlNamespace, text } from "#plate/document/source.ts";
import type { SourceAttribute, SourceChild, SourceElement } from "#plate/document/source.ts";
import { speechPlan } from "#plate/speech/plan.ts";
import type { Lexicon, SpeechSegment } from "#plate/speech/plan.ts";
import { checkAllowlist, sourceModules } from "#plate/test/imports.ts";

/**
 * The namespace the item's HTML-like elements stand in for a test: QTI's, as `el` gives by default.
 */
const html = (
  local: string,
  attributes: readonly SourceAttribute[] = [],
  children: readonly SourceChild[] = [],
): SourceElement => el(local, attributes, children);

/**
 * Construct an inline SSML element.
 *
 * @param local The element's local name.
 * @param attributes The element's attributes.
 * @param children The element's children.
 * @returns The element in the SSML namespace.
 */
const ssml = (
  local: string,
  attributes: readonly SourceAttribute[] = [],
  children: readonly SourceChild[] = [],
): SourceElement => el(local, attributes, children, ssmlNamespace);

/**
 * Construct a `data-ssml` attribute holding a JSON value.
 *
 * @param value The Data-SSML value, as JSON text.
 * @returns The attribute.
 */
const dataSsml = (value: string): SourceAttribute => attr("data-ssml", value);

/**
 * Construct a text segment with every optional field empty, overridden where a test says.
 *
 * @param written The visible text.
 * @param spoken The text to speak, the written text by default.
 * @param rest The fields that differ from the defaults.
 * @returns The segment.
 */
const segment = (
  written: string,
  spoken: string = written,
  rest: Partial<SpeechSegment> = {},
): SpeechSegment => ({
  lang: Option.none(),
  pause: Option.none(),
  phoneme: Option.none(),
  rate: Option.none(),
  sayAs: Option.none(),
  spoken,
  suppressed: new Set(),
  written,
  ...rest,
});

describe("speechPlan", () => {
  it("[A-3b] a data-ssml sub reads into one segment with the alias spoken", () => {
    const span = html(
      "span",
      [dataSsml('{"sub":{"alias":"World Wide Web Consortium"}}')],
      [text("W3C")],
    );

    assert.deepStrictEqual(speechPlan(html("p", [], [span])).segments, [
      segment("W3C", "World Wide Web Consortium"),
    ]);
  });

  it("[A-3a] an inline ssml:sub reads into the same segment as its data-ssml twin", () => {
    const inline = html(
      "p",
      [],
      [ssml("sub", [attr("alias", "World Wide Web Consortium")], [text("W3C")])],
    );
    const json = html(
      "p",
      [],
      [html("span", [dataSsml('{"sub":{"alias":"World Wide Web Consortium"}}')], [text("W3C")])],
    );

    assert.deepStrictEqual(speechPlan(inline), speechPlan(json));
    assert.deepStrictEqual(speechPlan(inline).segments, [
      segment("W3C", "World Wide Web Consortium"),
    ]);
  });

  it("[A-3a] [A-3b] say-as characters spells the text out in both carriers", () => {
    const inline = html(
      "p",
      [],
      [ssml("say-as", [attr("interpret-as", "characters")], [text("QTI")])],
    );
    const json = html(
      "p",
      [],
      [html("span", [dataSsml('{"say-as":{"interpret-as":"characters"}}')], [text("QTI")])],
    );
    const expected = [segment("QTI", "Q T I", { sayAs: Option.some("characters") })];

    assert.deepStrictEqual(speechPlan(inline).segments, expected);
    assert.deepStrictEqual(speechPlan(json).segments, expected);
  });

  it("[A-3b] a break is a pause segment and a prosody rate rides on its segment", () => {
    const paused = speechPlan(
      html(
        "p",
        [],
        [text("Wait"), html("span", [dataSsml('{"break":{"time":"500ms"}}')], []), text("here")],
      ),
    );

    assert.deepStrictEqual(paused.segments, [
      segment("Wait"),
      segment("", "", { pause: Option.some({ strength: "medium", time: Option.some("500ms") }) }),
      segment("here"),
    ]);

    const inlineBreak = speechPlan(
      html("p", [], [ssml("break", [attr("strength", "x-strong")], [])]),
    );

    assert.deepStrictEqual(inlineBreak.segments, [
      segment("", "", { pause: Option.some({ strength: "x-strong", time: Option.none() }) }),
    ]);

    const slow = speechPlan(
      html("p", [], [html("span", [dataSsml('{"prosody":{"rate":"slow"}}')], [text("Slowly")])]),
    );

    assert.deepStrictEqual(slow.segments, [
      segment("Slowly", "Slowly", { rate: Option.some("slow") }),
    ]);
  });

  it("[A-3a] a phoneme keeps the written text spoken and carries ph and alphabet", () => {
    const plan = speechPlan(
      html(
        "p",
        [],
        [ssml("phoneme", [attr("ph", "təˈmɑːtəʊ"), attr("alphabet", "ipa")], [text("tomato")])],
      ),
    );

    assert.deepStrictEqual(plan.segments, [
      segment("tomato", "tomato", {
        phoneme: Option.some({ alphabet: Option.some("ipa"), ph: "təˈmɑːtəʊ" }),
      }),
    ]);
  });

  it("[A-3a] [A-3b] data-qti-suppress-tts marks its content suppressed for its reading type", () => {
    const plan = speechPlan(
      html(
        "div",
        [],
        [
          html(
            "div",
            [attr("data-qti-suppress-tts", "screen-reader")],
            [html("p", [], [text("Screen")])],
          ),
          html("div", [attr("data-qti-suppress-tts", "all")], [text("Both")]),
          html("p", [], [text("Open")]),
        ],
      ),
    );

    assert.deepStrictEqual(plan.segments, [
      segment("Screen", "Screen", { suppressed: new Set(["screen-reader"]) }),
      segment("Both", "Both", { suppressed: new Set(["computer-read-aloud", "screen-reader"]) }),
      segment("Open"),
    ]);

    const nearest = speechPlan(
      html(
        "div",
        [attr("data-qti-suppress-tts", "all")],
        [html("span", [attr("data-qti-suppress-tts", "computer-read-aloud")], [text("Inner")])],
      ),
    );

    assert.deepStrictEqual(nearest.segments, [
      segment("Inner", "Inner", { suppressed: new Set(["computer-read-aloud"]) }),
    ]);
  });

  it("[A-3b] a data-ssml value that does not decode is left out and the text is spoken as written", () => {
    const values = [
      "not json",
      '{"sub":{"alias":"x"},"speak":{}}',
      '{"sub":{}}',
      '{"sub":{"alias":"x","lang":"en"}}',
      '{"say-as":{"interpret-as":"money"}}',
      '{"break":{"strength":"loud"}}',
      "[]",
    ];

    for (const value of values) {
      assert.deepStrictEqual(
        speechPlan(html("p", [], [html("span", [dataSsml(value)], [text("W3C")])])).segments,
        [segment("W3C")],
        value,
      );
    }
  });

  it("[A-3a] [A-3b] the inline function nearer the text wins over its data-ssml twin, and functions compose", () => {
    const nearer = speechPlan(
      html(
        "p",
        [],
        [
          ssml(
            "sub",
            [attr("alias", "inner"), dataSsml('{"sub":{"alias":"outer"}}')],
            [text("W3C")],
          ),
        ],
      ),
    );

    assert.deepStrictEqual(nearer.segments, [segment("W3C", "inner")]);

    const whole = speechPlan(
      html(
        "p",
        [],
        [
          html(
            "span",
            [dataSsml('{"sub":{"alias":"outer"}}')],
            [text("W"), html("b", [], [text("3")]), text("C")],
          ),
        ],
      ),
    );

    assert.deepStrictEqual(whole.segments, [segment("W3C", "outer")]);

    const composed = speechPlan(
      html(
        "p",
        [],
        [
          html(
            "span",
            [dataSsml('{"phoneme":{"ph":"ˈsiː"},"prosody":{"rate":"fast"},"sub":{"alias":"sea"}}')],
            [text("C")],
          ),
        ],
      ),
    );

    assert.deepStrictEqual(composed.segments, [
      segment("C", "sea", {
        phoneme: Option.some({ alphabet: Option.none(), ph: "ˈsiː" }),
        rate: Option.some("fast"),
      }),
    ]);
  });

  it("[A-3a] a speak fragment's xml:lang rides on its segments, and meta, metadata, lexicon and desc are not spoken", () => {
    const plan = speechPlan(
      html(
        "p",
        [],
        [
          ssml(
            "speak",
            [attr("version", "1.1"), attr("lang", "en-GB", "http://www.w3.org/XML/1998/namespace")],
            [
              ssml("meta", [attr("name", "seeAlso"), attr("content", "x")], []),
              ssml("metadata", [], [text("not spoken")]),
              ssml("lexicon", [attr("uri", "words.pls")], []),
              text("Spoken "),
              ssml(
                "audio",
                [attr("src", "a.mp3")],
                [ssml("desc", [], [text("a bell")]), text("fallback")],
              ),
            ],
          ),
        ],
      ),
    );

    assert.deepStrictEqual(plan.segments, [
      segment("Spoken ", "Spoken ", { lang: Option.some("en-GB") }),
      segment("fallback", "fallback", { lang: Option.some("en-GB") }),
    ]);
  });

  it("[A-35] a lexicon alias replaces a whole-word, case-sensitive grapheme match in spoken only", () => {
    const lexicon: Lexicon = {
      alphabet: Option.none(),
      entries: [
        { alias: "Question and Test Interoperability", graphemes: ["QTI"] },
        { alias: "the plate renderer", graphemes: ["plate"] },
      ],
      lang: Option.none(),
    };
    const plan = speechPlan(
      html("p", [], [text("QTI on plate, not plates or Plate; qti.")]),
      lexicon,
    );

    assert.deepStrictEqual(plan.segments, [
      segment(
        "QTI on plate, not plates or Plate; qti.",
        "Question and Test Interoperability on the plate renderer, not plates or Plate; qti.",
      ),
    ]);
  });

  it("[A-3a] [A-3b] plan.ts keeps the browser rule", () => {
    assert.deepStrictEqual(checkAllowlist(sourceModules(), ["src/speech/plan.ts"]), []);
  });
});

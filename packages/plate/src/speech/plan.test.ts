import { isDeepStrictEqual } from "node:util";
import { assert, describe, it } from "@effect/vitest";
import { Option, Result } from "effect";
import { attr, el, ssmlNamespace, text } from "#plate/document/source.ts";
import type { SourceAttribute, SourceChild, SourceElement } from "#plate/document/source.ts";
import { speechPlan } from "#plate/speech/plan.ts";
import type { Lexicon, LexiconEntry, SpeechSegment } from "#plate/speech/plan.ts";
import { checkAllowlist, sourceModules } from "#plate/test/imports.ts";
import { decodeDataSsml } from "#plate/validate/data-ssml.ts";

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

/**
 * Construct a lexicon of alias entries, with no alphabet and no language.
 *
 * @param entries The entries, in document order.
 * @returns The lexicon.
 */
const lexiconOf = (...entries: readonly LexiconEntry[]): Lexicon => ({
  alphabet: Option.none(),
  entries,
  lang: Option.none(),
});

/**
 * Report whether the plan reads a function from a `data-ssml` value: whether the plan of a span
 * that holds `W3C` and carries the value differs from the text spoken as written.
 *
 * @param value The attribute's value.
 * @returns Whether the plan reads a function.
 */
const readsFunction = (value: string): boolean =>
  !isDeepStrictEqual(
    speechPlan(html("p", [], [html("span", [dataSsml(value)], [text("W3C")])])).segments,
    [segment("W3C")],
  );

/**
 * The `strength` values of the Data-SSML binding's `BreakDType`, from the binding.
 */
const strengths = ["none", "x-weak", "weak", "medium", "strong", "x-strong"];

/**
 * The `alphabet` values of the binding's `PhonemeDType`, from the binding.
 */
const alphabets = ["ipa", "x-sampa"];

/**
 * The `type` values of the binding's `PhonemeDType`, from the binding.
 */
const types = ["default", "ruby"];

/**
 * The `interpret-as` values of the binding's `SayAsDType`, from the binding.
 */
const interpretations = ["cardinal", "characters", "date", "ordinal", "telephone", "time"];

/**
 * Data-SSML values the binding admits, each giving the plan a function it can show: every
 * property of the five functions, every value of each enumeration, and the spellings JSON allows.
 */
const admitted: readonly string[] = [
  ...strengths.map((strength) => `{"break":{"strength":"${strength}"}}`),
  '{"break":{"strength":"strong","time":"250ms"}}',
  '{"break":{"time":"3s"}}',
  '{"break":{}}',
  ...alphabets.flatMap((alphabet) =>
    types.map((type) => `{"phoneme":{"alphabet":"${alphabet}","ph":"x","type":"${type}"}}`),
  ),
  '{"phoneme":{"ph":"x"}}',
  '{"phoneme":{"ph":""}}',
  '{"prosody":{"rate":"slow"}}',
  '{"prosody":{"rate":"+10%"}}',
  '{"prosody":{"rate":""}}',
  ...interpretations.map((interpretation) => `{"say-as":{"interpret-as":"${interpretation}"}}`),
  '{"sub":{"alias":"x"}}',
  '{"sub":{"alias":""}}',
  '{"sub":{"alias":"a\\tb"}}',
  ' {"sub":{"alias":"x"}} ',
  '{"su\\u0062":{"alias":"x"}}',
  '{"sub":{"alias":"a"},"sub":{"alias":"b"}}',
  '{"break":{"strength":"weak","time":"1s"},"phoneme":{"alphabet":"ipa","ph":"x","type":"ruby"},"prosody":{"rate":"fast"},"say-as":{"interpret-as":"characters"},"sub":{"alias":"x"}}',
];

/**
 * Values the binding refuses, each a way to fail it: bad JSON, a value that is no object, a
 * property or definition key it does not define, a missing required property, a value of the
 * wrong JSON type, a tab, line feed or carriage return in a NormalizedString, a value outside an
 * enumeration, and one bad function beside good ones.
 */
const refused: readonly string[] = [
  "",
  "not json",
  "{",
  '{"sub":{"alias":"x"}',
  "{'sub':{}}",
  '{"break":{"time":"1\ts"}}',
  "[]",
  '[{"sub":{"alias":"x"}}]',
  '"sub"',
  "3",
  "null",
  "true",
  '{"speak":{}}',
  '{"sub":{"alias":"x"},"speak":{}}',
  '{"__proto__":{}}',
  '{"sub":{"alias":"x","lang":"en"}}',
  '{"break":{"strength":"weak","pitch":"high"}}',
  '{"sub":{"alias":"x","__proto__":"y"}}',
  '{"sub":{}}',
  '{"phoneme":{"alphabet":"ipa"}}',
  '{"say-as":{}}',
  '{"sub":{"alias":1}}',
  '{"sub":{"alias":null}}',
  '{"sub":"x"}',
  '{"sub":[]}',
  '{"sub":null}',
  '{"phoneme":{"ph":true}}',
  '{"break":{"time":5}}',
  '{"break":{"time":"1\\ts"}}',
  '{"break":{"time":"1\\ns"}}',
  '{"prosody":{"rate":"fast\\r"}}',
  '{"break":{"strength":"loud"}}',
  '{"break":{"strength":"Medium"}}',
  '{"phoneme":{"alphabet":"sampa","ph":"x"}}',
  '{"phoneme":{"ph":"x","type":"other"}}',
  '{"say-as":{"interpret-as":"money"}}',
  '{"sub":{"alias":"x"},"break":{"strength":"loud"}}',
];

describe("speechPlan", () => {
  it("[A-3a] [A-3b] the carrier nearest the text wins in a nested tree", () => {
    const outer = html(
      "span",
      [dataSsml('{"sub":{"alias":"World Wide Web Consortium"}}')],
      [text("the "), ssml("sub", [attr("alias", "W three C")], [text("W3C")]), text(" site")],
    );

    assert.deepStrictEqual(speechPlan(html("p", [], [outer])).segments, [
      segment("the ", "World Wide Web Consortium"),
      segment("W3C", "W three C"),
      segment(" site"),
    ]);

    const mirror = html(
      "p",
      [],
      [
        ssml(
          "sub",
          [attr("alias", "outer")],
          [html("span", [dataSsml('{"sub":{"alias":"inner"}}')], [text("W3C")])],
        ),
      ],
    );

    assert.deepStrictEqual(speechPlan(mirror).segments, [segment("W3C", "inner")]);
  });

  it("[A-3a] [A-3b] a carrier that holds a nearer one speaks its alias once and spells out or pronounces each of its own runs", () => {
    const wrapped = html(
      "p",
      [],
      [
        html(
          "span",
          [dataSsml('{"sub":{"alias":"outer"}}')],
          [
            html("b", [], [text("x "), ssml("sub", [attr("alias", "inner")], [text("I")])]),
            text(" y"),
          ],
        ),
      ],
    );

    assert.deepStrictEqual(speechPlan(wrapped).segments, [
      segment("x ", "outer"),
      segment("I", "inner"),
      segment(" y"),
    ]);

    const spelled = html(
      "p",
      [],
      [
        ssml(
          "say-as",
          [attr("interpret-as", "characters")],
          [text("QT"), ssml("sub", [attr("alias", "eye")], [text("I")]), text("QT")],
        ),
      ],
    );
    const characters = { sayAs: Option.some("characters") };

    assert.deepStrictEqual(speechPlan(spelled).segments, [
      segment("QT", "Q T", characters),
      segment("I", "eye"),
      segment("QT", "Q T", characters),
    ]);

    const pronounced = html(
      "p",
      [],
      [
        ssml(
          "phoneme",
          [attr("ph", "ˈtɛst")],
          [text("a "), ssml("sub", [attr("alias", "b")], [text("B")]), text(" c")],
        ),
      ],
    );
    const phoneme = { phoneme: Option.some({ alphabet: Option.none(), ph: "ˈtɛst" }) };

    assert.deepStrictEqual(speechPlan(pronounced).segments, [
      segment("a ", "a ", phoneme),
      segment("B", "b"),
      segment(" c", " c", phoneme),
    ]);
  });

  it("[A-3b] data-ssml on an SSML element is not a carrier", () => {
    const value = dataSsml('{"sub":{"alias":"x"}}');

    assert.deepStrictEqual(speechPlan(html("div", [], [ssml("p", [value], [text("Hello")])])), {
      segments: [segment("Hello")],
    });
    assert.deepStrictEqual(speechPlan(html("div", [], [html("p", [value], [text("Hello")])])), {
      segments: [segment("Hello", "x")],
    });
  });

  it("[A-35] [A-3a] a lexicon alias applies after a sub alias", () => {
    const lexicon = lexiconOf({
      alias: "Question and Test Interoperability",
      graphemes: ["QTI"],
    });
    const plan = speechPlan(
      html("p", [], [ssml("sub", [attr("alias", "QTI")], [text("Q.T.I.")])]),
      lexicon,
    );

    assert.deepStrictEqual(plan.segments, [
      segment("Q.T.I.", "Question and Test Interoperability"),
    ]);

    const writtenOnly = speechPlan(
      html("p", [], [ssml("sub", [attr("alias", "QTI")], [text("Q.T.I.")])]),
      lexiconOf({ alias: "never", graphemes: ["Q.T.I."] }),
    );

    assert.deepStrictEqual(writtenOnly.segments, [segment("Q.T.I.", "QTI")]);
  });

  it("[A-35] [A-3a] [A-3b] say-as characters is spelled out, then substituted", () => {
    const spelled = html(
      "p",
      [],
      [ssml("say-as", [attr("interpret-as", "characters")], [text("QTI")])],
    );
    const characters = { sayAs: Option.some("characters") };

    assert.deepStrictEqual(
      speechPlan(spelled, lexiconOf({ alias: "spelled", graphemes: ["Q T I"] })).segments,
      [segment("QTI", "spelled", characters)],
    );
    assert.deepStrictEqual(
      speechPlan(spelled, lexiconOf({ alias: "never", graphemes: ["QTI"] })).segments,
      [segment("QTI", "Q T I", characters)],
    );
  });

  it("[A-35] [A-3a] a phoneme segment keeps its phoneme while its spoken text is substituted", () => {
    const plan = speechPlan(
      html("p", [], [ssml("phoneme", [attr("ph", "x")], [text("QTI")])]),
      lexiconOf({ alias: "Question and Test Interoperability", graphemes: ["QTI"] }),
    );

    assert.deepStrictEqual(plan.segments, [
      segment("QTI", "Question and Test Interoperability", {
        phoneme: Option.some({ alphabet: Option.none(), ph: "x" }),
      }),
    ]);
  });

  it("[A-3b] the plan's Data-SSML decoder agrees with the Schema binding over a table of values", () => {
    assert.isAtLeast(admitted.length + refused.length, 25);

    for (const value of [...admitted, ...refused]) {
      assert.strictEqual(readsFunction(value), Result.isSuccess(decodeDataSsml(value)), value);
    }

    for (const value of admitted) {
      assert.isTrue(Result.isSuccess(decodeDataSsml(value)), `the binding admits ${value}`);
    }

    for (const value of refused) {
      assert.isTrue(Result.isFailure(decodeDataSsml(value)), `the binding refuses ${value}`);
    }
  });

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

  it("[A-40f] data-qti-suppress-tts marks its content suppressed for its reading type", () => {
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

  it("plan.ts keeps the browser rule", () => {
    assert.deepStrictEqual(checkAllowlist(sourceModules(), ["src/speech/plan.ts"]), []);
  });
});

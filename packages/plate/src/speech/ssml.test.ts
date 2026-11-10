import { assert, describe, it } from "@effect/vitest";
import {
  attr,
  el,
  qtiNamespace,
  ssmlNamespace,
  text,
  xmlNamespace,
} from "#plate/document/source.ts";
import type { SourceAttribute, SourceChild, SourceElement } from "#plate/document/source.ts";
import { checkSpeak } from "#plate/speech/ssml.ts";
import type { SpeakRule } from "#plate/speech/ssml.ts";

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
 * Construct a `speak` fragment that conforms but for what a test adds: version `1.1` and an
 * `xml:lang`.
 *
 * @param children The fragment's children.
 * @param attributes Attributes beside the two, the version overridden when given.
 * @returns The fragment.
 */
const speak = (
  children: readonly SourceChild[],
  attributes: readonly SourceAttribute[] = [],
): SourceElement =>
  ssml(
    "speak",
    [
      ...(attributes.some((attribute) => attribute.local === "version")
        ? []
        : [attr("version", "1.1")]),
      attr("lang", "en", xmlNamespace),
      ...attributes,
    ],
    children,
  );

/**
 * The rules of a fragment's problems, in the order reported.
 *
 * @param fragment The fragment.
 * @returns Its rule codes.
 */
const rulesOf = (fragment: SourceElement): readonly SpeakRule[] =>
  checkSpeak(fragment).map((problem) => problem.rule);

/**
 * Construct a fragment holding one `voice` with a `languages` value.
 *
 * @param languages The value as written.
 * @returns The fragment.
 */
const voice = (languages: string): SourceElement =>
  speak([ssml("voice", [attr("languages", languages)], [text("Hello")])]);

/**
 * The step a path spells an SSML element with.
 *
 * @param local The element's local name.
 * @returns `{<namespace>}<local>`.
 */
const step = (local: string): string => `{${ssmlNamespace}}${local}`;

describe("checkSpeak", () => {
  it("[A-3a] a speak fragment whose version is not 1.1 has the version problem", () => {
    const problems = checkSpeak(speak([text("Hello")], [attr("version", "1.0")]));

    assert.deepStrictEqual(
      problems.map(({ path, rule }) => ({ path, rule })),
      [{ path: step("speak"), rule: "version" }],
    );
    assert.include(problems[0]?.detail, "1.0");
    assert.deepStrictEqual(rulesOf(speak([text("Hello")])), []);
    assert.deepStrictEqual(
      rulesOf(ssml("speak", [attr("lang", "en", xmlNamespace)], [text("Hello")])),
      ["version"],
    );
  });

  it("[A-3a] meta, metadata and lexicon after other content have the order problem", () => {
    const late = speak([text("Hello"), ssml("lexicon", [attr("uri", "words.pls")], [])]);

    assert.deepStrictEqual(
      checkSpeak(late).map(({ path, rule }) => ({ path, rule })),
      [{ path: `${step("speak")}/${step("lexicon")}`, rule: "order" }],
    );
    assert.deepStrictEqual(
      rulesOf(
        speak([
          text("\n  "),
          ssml("meta", [attr("name", "seeAlso"), attr("content", "x")], []),
          text("Hello"),
        ]),
      ),
      [],
    );
    assert.deepStrictEqual(
      rulesOf(
        speak([
          ssml("metadata", [], []),
          ssml("p", [], [text("Hello")]),
          ssml("metadata", [], []),
          ssml("lexicon", [attr("uri", "words.pls")], []),
        ]),
      ),
      ["order", "order"],
    );
    assert.deepStrictEqual(
      rulesOf(speak([el("note", [], [text("foreign")]), ssml("metadata", [], []), text("Hello")])),
      [],
    );
  });

  it("[A-3a] a meta with both or neither of name and http-equiv has the meta problem", () => {
    const both = ssml(
      "meta",
      [attr("name", "seeAlso"), attr("http-equiv", "Cache-Control"), attr("content", "x")],
      [],
    );
    const neither = ssml("meta", [attr("content", "x")], []);
    const one = ssml("meta", [attr("http-equiv", "Cache-Control"), attr("content", "x")], []);

    assert.deepStrictEqual(rulesOf(speak([both, text("Hello")])), ["meta"]);
    assert.deepStrictEqual(rulesOf(speak([neither, text("Hello")])), ["meta"]);
    assert.deepStrictEqual(rulesOf(speak([one, text("Hello")])), []);
    assert.deepStrictEqual(
      checkSpeak(speak([both, text("Hello")]))[0]?.path,
      `${step("speak")}/${step("meta")}`,
    );
  });

  it("[A-3a] voice languages refuses und, zxx and the asterisk in any case", () => {
    assert.deepStrictEqual(rulesOf(voice("und")), ["languages"]);
    assert.deepStrictEqual(rulesOf(voice("ZXX")), ["languages"]);
    assert.deepStrictEqual(rulesOf(voice("en-*")), ["languages"]);
    assert.deepStrictEqual(rulesOf(voice("en und-Latn")), ["languages"]);
    assert.deepStrictEqual(rulesOf(voice("en:US:x")), ["languages"]);
    assert.deepStrictEqual(rulesOf(voice("en:US fr")), []);
    assert.deepStrictEqual(rulesOf(voice("")), []);
    assert.deepStrictEqual(rulesOf(voice("zh-Hant-TW:CN")), []);
    assert.deepStrictEqual(checkSpeak(voice("und"))[0]?.path, `${step("speak")}/${step("voice")}`);
  });

  it("[A-3a] a voice or prosody with no attribute that survives fragment removal has the attribute problem; a token holding voice has token-voice", () => {
    const bare = ssml("voice", [attr("label", "x", qtiNamespace)], [text("Hello")]);

    assert.deepStrictEqual(rulesOf(speak([bare])), ["attribute"]);
    assert.deepStrictEqual(rulesOf(speak([ssml("prosody", [], [text("Hello")])])), ["attribute"]);
    assert.deepStrictEqual(
      rulesOf(speak([ssml("prosody", [attr("lang", "en", xmlNamespace)], [text("Hello")])])),
      [],
    );
    assert.deepStrictEqual(
      rulesOf(speak([ssml("voice", [attr("gender", "female")], [text("Hello")])])),
      [],
    );

    const tokenVoice = speak([
      ssml("w", [], [ssml("voice", [attr("gender", "female")], [text("Hello")])]),
    ]);

    assert.deepStrictEqual(
      checkSpeak(tokenVoice).map(({ path, rule }) => ({ path, rule })),
      [{ path: `${step("speak")}/${step("w")}/${step("voice")}`, rule: "token-voice" }],
    );
    assert.deepStrictEqual(
      rulesOf(
        speak([ssml("token", [], [ssml("voice", [attr("gender", "female")], [text("Hello")])])]),
      ),
      ["token-voice"],
    );
    assert.deepStrictEqual(
      rulesOf(
        speak([ssml("voice", [attr("gender", "female")], [ssml("token", [], [text("Hello")])])]),
      ),
      [],
    );
  });

  it("[A-3a] marks resolve per fragment and compare collapsed", () => {
    const first = speak([ssml("mark", [attr("name", "a")], []), text("One")]);
    const second = speak([ssml("mark", [attr("name", "a")], []), text("Two")]);

    assert.deepStrictEqual([...rulesOf(first), ...rulesOf(second)], []);

    const crossing = speak(
      [ssml("mark", [attr("name", "a")], []), text("One")],
      [attr("startmark", "b")],
    );

    assert.deepStrictEqual(
      checkSpeak(crossing).map(({ path, rule }) => ({ path, rule })),
      [{ path: step("speak"), rule: "mark" }],
    );
    assert.deepStrictEqual(
      rulesOf(
        speak([ssml("mark", [attr("name", "a b")], []), text("One")], [attr("startmark", "a  b")]),
      ),
      [],
    );
    assert.deepStrictEqual(
      rulesOf(
        speak(
          [
            ssml("mark", [attr("name", "a")], []),
            ssml("p", [], [ssml("mark", [attr("name", " a")], [])]),
          ],
          [attr("endmark", "a")],
        ),
      ),
      ["mark"],
    );
    assert.deepStrictEqual(
      rulesOf(
        speak([ssml("mark", [attr("name", "a")], []), ssml("mark", [attr("name", "a")], [])]),
      ),
      [],
    );
  });
});

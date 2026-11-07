/**
 * The law oracle's own reader of `data-ssml` (`src/test/oracle-laws/data-ssml.ts`), judged against
 * Data-SSML 1.0's JSON Schema (section 3.4.5, spec reading R7-a) case by case, and against the
 * importer's checker (`#pantry/vocab/data-ssml.ts`) over a generated box. Only this test reads
 * both; the reader itself never imports the checker.
 */
import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";
import { dataSsmlBreachOf } from "#pantry/test/oracle-laws/data-ssml.ts";
import { dataSsmlFaultOf } from "#pantry/vocab/data-ssml.ts";

/**
 * A specification case: the text, and the path of its breach, or none when it is admitted.
 */
type Case = readonly [text: string, breach: Option.Option<string>];

const admitted = (text: string): Case => [text, Option.none()];

const refused = (text: string, path: string): Case => [text, Option.some(path)];

// Section 3.4.5: the root is an object of the five members, each an object of its own properties,
// every property a string; `ph`, `interpret-as` and `alias` required; four enumerations; `time`
// and `rate` normalized strings; a repeated name admitted (RFC 8259 section 4), each value judged.
const specification: readonly Case[] = [
  admitted("{}"),
  admitted(' \t\r\n{ \n"break" : { "strength" : "weak" , "time" : "2s" } }\r\n'),
  admitted('{"break":{}}'),
  admitted('{"break":{"strength":"x-strong","time":"250ms"}}'),
  admitted('{"phoneme":{"ph":"tə","alphabet":"ipa","type":"ruby"}}'),
  admitted('{"prosody":{"rate":"120%"}}'),
  admitted('{"prosody":{"rate":"x-fast"}}'),
  admitted('{"say-as":{"interpret-as":"telephone"}}'),
  admitted('{"sub":{"alias":"world wide web"}}'),
  admitted(
    '{"break":{},"phoneme":{"ph":"x"},"prosody":{},"say-as":{"interpret-as":"date"},"sub":{"alias":"a"}}',
  ),
  admitted('{"\\u0062reak":{"strength":"\\u006dedium"}}'),
  admitted('{"sub":{"alias":"\\ud83d\\ude00 \\"quoted\\" \\\\ \\/ \\b\\f\\n\\r\\t"}}'),
  admitted('{"break":{"strength":"weak","strength":"strong"}}'),
  admitted('{"break":{"time":"1s"},"break":{"strength":"none"}}'),
  refused("", "$"),
  refused("not json", "$"),
  refused("[]", "$"),
  refused('"break"', "$"),
  refused("null", "$"),
  refused('{"break":{}} trailing', "$"),
  refused('{"break":{}}{"break":{}}', "$"),
  refused('{"break":{},}', "$"),
  refused("{'break':{}}", "$"),
  refused('{"break":{"time":01}}', "$"),
  refused('{"sub":{"alias":"a\nb"}}', "$"),
  refused('{"sub":{"alias":"\\ud83"}}', "$"),
  refused('{"unknown":{}}', "$.unknown"),
  refused('{"break":"loud"}', "$.break"),
  refused('{"break":[]}', "$.break"),
  refused('{"break":null}', "$.break"),
  refused('{"break":{"time":5}}', "$.break.time"),
  refused('{"break":{"time":null}}', "$.break.time"),
  refused('{"break":{"strength":"loud"}}', "$.break.strength"),
  refused('{"break":{"strength":"Weak"}}', "$.break.strength"),
  refused('{"break":{"strength":"weak","strength":"loud"}}', "$.break.strength"),
  refused('{"break":{"loud":"yes"}}', "$.break.loud"),
  refused('{"break":{"time":"1\\ts"}}', "$.break.time"),
  refused('{"prosody":{"rate":"fast\\n"}}', "$.prosody.rate"),
  refused('{"prosody":{"rate":"a\\rb"}}', "$.prosody.rate"),
  refused('{"phoneme":{}}', "$.phoneme.ph"),
  refused('{"phoneme":{"alphabet":"ipa"}}', "$.phoneme.ph"),
  refused('{"phoneme":{"ph":"x","alphabet":"sampa"}}', "$.phoneme.alphabet"),
  refused('{"phoneme":{"ph":"x","type":"plain"}}', "$.phoneme.type"),
  refused('{"say-as":{}}', "$.say-as.interpret-as"),
  refused('{"say-as":{"interpret-as":"currency"}}', "$.say-as.interpret-as"),
  refused('{"sub":{}}', "$.sub.alias"),
  refused('{"sub":{"alias":["a"]}}', "$.sub.alias"),
  refused('{"break":{},"sub":{}}', "$.sub.alias"),
];

describe("the law oracle's Data-SSML reader, on the specification", () => {
  it("judges each specification case with its expected path or none", () => {
    for (const [text, expected] of specification) {
      assert.deepStrictEqual(dataSsmlBreachOf(text), expected, JSON.stringify(text));
    }
  });

  it("reads a deeply nested value without exhausting the call stack", () => {
    const depth = 100_000;
    const nested = `{"break":{"time":${"[".repeat(depth)}${"]".repeat(depth)}}}`;
    assert.deepStrictEqual(dataSsmlBreachOf(nested), Option.some("$.break.time"));
    assert.deepStrictEqual(dataSsmlBreachOf(`{"break":${"[".repeat(depth)}`), Option.some("$"));
  });
});

/**
 * Every property any member lists, with a value its schema admits.
 */
const properties: readonly (readonly [name: string, valid: string])[] = [
  ["strength", "strong"],
  ["time", "1s"],
  ["ph", "x"],
  ["alphabet", "ipa"],
  ["type", "ruby"],
  ["rate", "slow"],
  ["interpret-as", "date"],
  ["alias", "a"],
];

const memberNames = ["break", "phoneme", "prosody", "say-as", "sub"] as const;

/**
 * Spell a string with a `\u` escape for each of its characters.
 */
const escaped = (text: string): string =>
  Array.from(text, (c) => `\\u${(c.codePointAt(0) ?? 0).toString(16).padStart(4, "0")}`).join("");

/**
 * The box: every member x every property (the five members hold three of them each at most, so
 * most pairs are foreign) x five values (admitted, out of enumeration, the admitted one escaped, a
 * decoded tab, a number) x five shapes (alone, a repeated name with the admitted value first and
 * second, both names escaped, a repeated member). Then the foreign names the schema lists nowhere.
 */
const box = (): readonly string[] => {
  const texts: string[] = [];
  for (const member of memberNames) {
    for (const [property, valid] of properties) {
      const values = [`"${valid}"`, '"bogus"', `"${escaped(valid)}"`, '"a\\tb"', "7"];
      for (const value of values) {
        const alone = `{"${property}":${value}}`;
        texts.push(
          `{"${member}":${alone}}`,
          `{"${member}":{"${property}":"${valid}","${property}":${value}}}`,
          `{"${member}":{"${property}":${value},"${property}":"${valid}"}}`,
          `{"${escaped(member)}":{"${escaped(property)}":${value}}}`,
          `{"${member}":${alone},"${member}":{}}`,
        );
      }
    }
  }

  texts.push(
    '{"unknown":{}}',
    '{"break":{},"unknown":{}}',
    '{"break":{"strength":"weak","unknown":"x"}}',
    `{"${escaped("unknown")}":{}}`,
    '{"":{}}',
    '{"break":{"":"x"}}',
  );

  return texts;
};

/**
 * The box's size: 5 members x 8 properties x 5 values x 5 shapes, and the six foreign texts.
 */
const boxSize = 5 * 8 * 5 * 5 + 6;

describe("the law oracle's Data-SSML reader, against the importer's checker", () => {
  it("agrees with the checker on every text of the box, and the box has both verdicts", () => {
    const texts = box();
    assert.strictEqual(texts.length, boxSize);
    let admits = 0;
    for (const text of texts) {
      const oracle = Option.isNone(dataSsmlBreachOf(text));
      assert.strictEqual(oracle, dataSsmlFaultOf(text) === undefined, text);
      admits += oracle ? 1 : 0;
    }

    assert.isAbove(admits, 0);
    assert.isBelow(admits, texts.length);
  });

  it("agrees with the checker on every specification case", () => {
    for (const [text, expected] of specification) {
      assert.strictEqual(Option.isNone(expected), dataSsmlFaultOf(text) === undefined, text);
    }
  });
});

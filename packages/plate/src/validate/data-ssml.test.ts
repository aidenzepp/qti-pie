import { assert, describe, it } from "@effect/vitest";
import { Result } from "effect";
import { decodeDataSsml } from "#plate/validate/data-ssml.ts";
import type { DataSsmlProblem } from "#plate/validate/data-ssml.ts";

/**
 * Decode a value and give the problem its decoding names, or none for a value that decodes.
 *
 * @param value The `data-ssml` value, as the XML reader gives it.
 * @returns The problem, or `"none"`.
 */
const problemOf = (value: string): DataSsmlProblem | "none" =>
  Result.match(decodeDataSsml(value), {
    onFailure: ({ problem }) => problem,
    onSuccess: () => "none",
  });

describe("decodeDataSsml", () => {
  it("align-54 Data-SSML P3: decodes the binding's five examples (§4.1.3), each to its property", () => {
    assert.deepStrictEqual(
      [
        '{"say-as":{"interpret-as":"characters"}}',
        '{"phoneme":{"alphabet":"ipa","ph":"ˈrɛdɪŋ"}}',
        '{"sub":{"alias":"messenger RNA"}}',
        '{"break":{"time":"250ms"}}',
        '{"prosody":{"rate":"slow"}}',
      ].map((value) => Result.getOrUndefined(decodeDataSsml(value))),
      [
        { "say-as": { "interpret-as": "characters" } },
        { phoneme: { alphabet: "ipa", ph: "ˈrɛdɪŋ" } },
        { sub: { alias: "messenger RNA" } },
        { break: { time: "250ms" } },
        { prosody: { rate: "slow" } },
      ],
    );
  });

  it("align-54 Data-SSML P3: decodes an empty object, every property of every definition, and JSON around which spaces stand", () => {
    assert.deepStrictEqual(
      [
        "{}",
        ' { "break" : { "strength" : "x-weak", "time" : "3s" } } ',
        '{"phoneme":{"alphabet":"x-sampa","ph":"r\\"\\\\EdIN","type":"ruby"},"prosody":{"rate":"80%"},"say-as":{"interpret-as":"telephone"},"sub":{"alias":"A"}}',
      ].map(problemOf),
      ["none", "none", "none"],
    );
  });

  it("align-54 Data-SSML P3: names a value that is not JSON json", () => {
    assert.deepStrictEqual(["hello", "", "{sub:{}}", '{"sub":{"alias":"a"}'].map(problemOf), [
      "json",
      "json",
      "json",
      "json",
    ]);
  });

  it("align-54 Data-SSML P3: names a property the binding does not define name, at the root and inside a definition (§4.2)", () => {
    assert.deepStrictEqual(
      ['{"speak":{}}', '{"sub":{"alias":"a","lang":"en"}}', '{"break":{"duration":"1s"}}'].map(
        problemOf,
      ),
      ["name", "name", "name"],
    );
  });

  it("align-54 Data-SSML P3: names a value of the wrong JSON type, a value that is not an object and a missing required property type", () => {
    assert.deepStrictEqual(
      [
        '{"sub":{"alias":3}}',
        '{"break":"weak"}',
        '{"break":{"strength":1}}',
        "42",
        "[]",
        "null",
        '"hello"',
        '{"sub":{}}',
        '{"phoneme":{"alphabet":"ipa"}}',
        '{"say-as":{}}',
      ].map(problemOf),
      ["type", "type", "type", "type", "type", "type", "type", "type", "type", "type"],
    );
  });

  it("align-54 Data-SSML P3: names a string outside its property's enumeration value", () => {
    assert.deepStrictEqual(
      [
        '{"break":{"strength":"loud"}}',
        '{"phoneme":{"ph":"x","alphabet":"arpabet"}}',
        '{"phoneme":{"ph":"x","type":"plain"}}',
        '{"say-as":{"interpret-as":"spell-out"}}',
        '{"say-as":{"interpret-as":"Characters"}}',
      ].map(problemOf),
      ["value", "value", "value", "value", "value"],
    );
  });
});

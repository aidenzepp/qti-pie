/**
 * The rows the importer reads a `data-ssml` value into (`#pantry/vocab/data-ssml.ts`), and the law
 * the database holds them to ("Data SSML", spec reading 177, restated on the host by
 * `#pantry/test/data-ssml-law.ts`): what Data-SSML 1.0's JSON Schema admits, and the refusal of a
 * package that holds a value it does not.
 */
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it, layer } from "@effect/vitest";
import { Effect, Option, Schema } from "effect";
import { dataSsmlOf } from "#pantry/vocab/data-ssml.ts";
import { previewPackage } from "#pantry/import/preview.ts";
import { readProgram } from "#pantry/import/program.ts";
import { ImportRefused } from "#pantry/import/refusal.ts";
import { breaksDataSsml } from "#pantry/test/data-ssml-law.ts";
import { materializeSpec } from "#pantry/test/fixtures.ts";
import type { FixtureSpec } from "#pantry/test/fixtures.ts";

// Data-SSML 1.0 §3.4 (normative): the members `break`, `phoneme`, `prosody`, `say-as` and `sub`,
// each an object of the properties the schema lists, each a string, with `ph`, `interpret-as` and
// `alias` present and `strength`, `alphabet`, `type` and `interpret-as` enumerated; `time` and
// `rate` are normalized strings. A repeated name is admitted (R7-a, RFC 8259 §4: names "SHOULD be
// unique"), so such texts are judged by hand, not by the reader.
// Oracle: `JSON.parse`, then the schema's tables restated below, which judge the decoded names and
// values, so every JSON spelling is read as RFC 8259 reads it.
const normalized = Schema.String.check(Schema.isPattern(/^[^\t\n\r]*$/u));

const DataSsml = Schema.Struct({
  break: Schema.optionalKey(
    Schema.Struct({
      strength: Schema.optionalKey(
        Schema.Literals(["none", "x-weak", "weak", "medium", "strong", "x-strong"]),
      ),
      time: Schema.optionalKey(normalized),
    }),
  ),
  phoneme: Schema.optionalKey(
    Schema.Struct({
      alphabet: Schema.optionalKey(Schema.Literals(["ipa", "x-sampa"])),
      ph: Schema.String,
      type: Schema.optionalKey(Schema.Literals(["default", "ruby"])),
    }),
  ),
  prosody: Schema.optionalKey(Schema.Struct({ rate: Schema.optionalKey(normalized) })),
  "say-as": Schema.optionalKey(
    Schema.Struct({
      "interpret-as": Schema.Literals([
        "date",
        "time",
        "telephone",
        "characters",
        "cardinal",
        "ordinal",
      ]),
    }),
  ),
  sub: Schema.optionalKey(Schema.Struct({ alias: Schema.String })),
});

const decodes = Schema.decodeUnknownOption(Schema.fromJsonString(DataSsml));

const reads = (text: string): boolean =>
  Option.isSome(decodes(text, { onExcessProperty: "error" }));

const admitted = [
  "{}",
  " \t\r\n{ \n} ",
  '{"break":{}}',
  '{"break":{"time":"2s"}}',
  '{"sub":{"alias":"Froyd"}}',
  '{ "break" : { "strength" : "x-strong" } }',
  '{"phoneme":{"type":"ruby","ph":"a"}}',
  '{"phoneme":{"ph":"t&#x259;","alphabet":"x-sampa","type":"default"}}',
  '{"prosody":{}}',
  '{"prosody":{"rate":"80%"}}',
  '{"say-as":{"interpret-as":"telephone"}}',
  '{"break":{"strength":"none","time":"1s"},"sub":{"alias":"a"},"prosody":{"rate":"fast"}}',
  '{"say-as":{"interpret-as":"date"},"phoneme":{"ph":"x"},"break":{"time":"1s"}}',
  ...["none", "x-weak", "weak", "medium", "strong", "x-strong"].map(
    (strength) => `{"break":{"strength":"${strength}"}}`,
  ),
  ...["date", "time", "telephone", "characters", "cardinal", "ordinal"].map(
    (value) => `{"say-as":{"interpret-as":"${value}"}}`,
  ),
  // Every spelling of a name or an enumerated value, either hex case, and `/` as `\/`.
  '{"\\u0062reak":{"strength":"x-w\\u0065ak"}}',
  '{"b\\u0072eak":{"str\\u0065ngth":"x\\u002dweak","tim\\u0065":"1s"}}',
  '{"say\\u002das":{"interpret\\u002Das":"d\\u0061te"}}',
  '{"say\\u002Das":{"interpret-as":"\\u0074\\u0069\\u006D\\u0065"}}',
  '{"phoneme":{"ph":"a\\/b\\u0041","alphabet":"\\u0069pa","type":"r\\u0075by"}}',
  // A string is any JSON string, escapes of any kind, and raw characters beyond ASCII.
  '{"sub":{"alias":"\\"\\\\\\/\\b\\f\\n\\r\\t\\u0000\\ud800\\uDC00é😀"}}',
  '{"phoneme":{"ph":""}}',
  // A time or rate holds any other control, and escapes that only look like them.
  '{"break":{"time":"\\u000b\\u000C\\u0085\\b\\f"}}',
  '{"prosody":{"rate":"\\u0008\\u0010 \\u1009\\u0109\\u0a09\\u000f\\ua00A"}}',
];

const refused = [
  "",
  "x",
  " ",
  "[]",
  "[{}]",
  "null",
  '"x"',
  "{",
  "{} x",
  "{}{}",
  "{'sub':{}}",
  '{"break":{},}',
  '{,"break":{}}',
  '{"break":{}"sub":{"alias":"a"}}',
  '{"break" {}}',
  '{"brk":{}}',
  '{"Break":{}}',
  '{"break ":{}}',
  '{"b\\ureak":{}}',
  '{"b\\u00072eak":{}}',
  '{"b\\u0072\\u0065a":{}}',
  '{"say_as":{"interpret-as":"date"}}',
  '{"break":{"pitch":"x"}}',
  '{"break":"x"}',
  '{"break":null}',
  '{"break":[]}',
  '{"break":{"time":2}}',
  '{"break":{"time":null}}',
  '{"break":{"strength":["weak"]}}',
  '{"break":{"strength":"loud"}}',
  '{"break":{"strength":"Weak"}}',
  '{"break":{"strength":""}}',
  '{"break":{"strength":"x-weak "}}',
  '{"break":{"strength":"x\\u002dweaK"}}',
  '{"break":{"time":"2\ts"}}',
  '{"break":{"time":"2\\ts"}}',
  '{"break":{"time":"2\\ns"}}',
  '{"break":{"time":"2\\rs"}}',
  ...["0009", "000a", "000A", "000d", "000D"].map((code) => `{"break":{"time":"1\\u${code}s"}}`),
  '{"prosody":{"rate":"a\\u000Ab"}}',
  '{"prosody":{"rate":"a\\u000db"}}',
  '{"prosody":{"rate":"a\\tb"}}',
  '{"prosody":{"pitch":"high"}}',
  '{"phoneme":{}}',
  '{"phoneme":{"alphabet":"ipa"}}',
  '{"phoneme":{"ph":1}}',
  '{"phoneme":{"ph":"x","alphabet":"ipa2"}}',
  '{"phoneme":{"ph":"x","type":"other"}}',
  '{"phoneme":{"type":"ruby"}}',
  '{"say-as":{}}',
  '{"say-as":{"interpret-as":"currency"}}',
  '{"say-as":{"interpret-as":"date","format":"mdy"}}',
  '{"say-as":{"interpretAs":"date"}}',
  '{"sub":{}}',
  '{"sub":{"alias":1}}',
  '{"sub":{"alias":"a","extra":"b"}}',
  '{"sub":{"alias":"a",}}',
  '{"sub":{"alias":"a"}',
  '{"sub":{"alias":"raw\ttab"}}',
  '{"sub":{"alias":"raw\nline"}}',
  '{"sub":{"alias":"\\x"}}',
  '{"sub":{"alias":"\\u12"}}',
  '{"sub":{"alias":"\\uZZZZ"}}',
  '{"sub":{"alias":"unterminated}}',
  '{"sub":{"alias":\'a\'}}',
  '{"sub":{"alias":tru}}',
  '{"sub":{"alias":"a"}} x',
  "﻿{}",
];

// JSON.parse keeps the last of a repeated name, so these texts are judged by hand: each value
// of a repeated name is judged, so the name is admitted when every value is.
const repeated = [
  '{"sub":{"alias":"a","alias":"b"}}',
  '{"break":{"time":"1s","time":"2s"}}',
  '{"break":{},"break":{"strength":"weak"}}',
  '{"b\\u0072eak":{},"break":{}}',
  '{"phoneme":{"ph":"x","ph":"y","type":"ruby","type":"default"}}',
];

const repeatedRefused = [
  '{"sub":{"alias":"a","alias":1}}',
  '{"sub":{"alias":"a"},"sub":{}}',
  '{"break":{"strength":"weak","strength":"loud"}}',
  '{"break":{"time":"1s","time":"2\\ts"}}',
];

describe("dataSsmlOf and the law over its rows", () => {
  it("admits what Data-SSML 1.0 admits and refuses what it does not, every JSON spelling, against an independent reader", () => {
    for (const text of [...admitted, ...refused]) {
      assert.strictEqual(reads(text), admitted.includes(text), `oracle: ${text}`);
    }

    const wrong = [
      ...[...admitted, ...repeated].filter(breaksDataSsml),
      ...[...refused, ...repeatedRefused].filter((text) => !breaksDataSsml(text)),
    ];

    assert.deepStrictEqual(wrong, []);
  });

  it("reads each member and property in the order written, a repeated name twice, each value decoded", () => {
    assert.deepStrictEqual(
      dataSsmlOf('{"b\\u0072eak":{"time":"1s","time":"2s"},"brk":{"x":"\\u0041"}}'),
      Option.some([
        {
          name: "break",
          properties: [
            { name: "time", value: "1s" },
            { name: "time", value: "2s" },
          ],
        },
        { name: "brk", properties: [{ name: "x", value: "A" }] },
      ]),
    );
  });

  it("reads no rows from a text that is no JSON object of objects of strings, and leaves the schema to the law", () => {
    // The grammar is the reader's: a text, a member or a value of no such shape has no rows.
    for (const text of [
      "x",
      "[]",
      '{"break":"x"}',
      '{"sub":{"alias":1}}',
      '{"sub":{"alias":"a"}} x',
    ]) {
      assert.isTrue(Option.isNone(dataSsmlOf(text)), text);
    }

    // The schema is the law's: an unknown member or property, a value outside its list and a
    // missing required property are read as written, and the law refuses them.
    for (const text of [
      '{"brk":{}}',
      '{"break":{"pitch":"x"}}',
      '{"break":{"strength":"loud"}}',
      '{"phoneme":{"type":"ruby"}}',
    ]) {
      assert.isTrue(Option.isSome(dataSsmlOf(text)), text);
      assert.isTrue(breaksDataSsml(text), text);
    }
  });
});

/**
 * `simple`'s item with its first paragraph's `data-ssml` set to a value.
 */
const withDataSsml = (name: string, value: string): FixtureSpec => ({
  edits: [
    {
      _tag: "ReplaceText",
      file: "choice.xml",
      replacement: `<p data-ssml='${value}'>Look at the text in the picture.</p>`,
      search: "<p>Look at the text in the picture.</p>",
    },
  ],
  member: "qtiv3-examples/packaging/simple/simple.zip",
  name,
});

layer(NodeServices.layer, { excludeTestServices: true })("the import of a data-ssml", (suite) => {
  suite.effect(
    "accepts a package whose data-ssml Data-SSML 1.0 admits, and keeps it as written",
    () =>
      // Oracle: the schema's own `break` member in an irregular spelling (a `\u0072` for the `r`,
      // JSON whitespace around every token), held as the text the document wrote under the closed
      // `data-ssml` name, the one the importer judges.
      Effect.gen(function* accepted() {
        const written = '{ "b\\u0072eak" : { "strength" : "x-strong" } }';
        const dir = yield* materializeSpec(withDataSsml("data-ssml-valid", written));
        const program = yield* readProgram(dir);
        const held = program.documents.flatMap(({ listed }) =>
          listed.tree.root.children.flatMap((child) =>
            child._tag === "element" || child._tag === "foreign-element" ? [child] : [],
          ),
        );
        const lexicals = JSON.stringify(held);

        assert.isAbove(program.documents.length, 0);
        assert.include(lexicals, JSON.stringify(written).slice(1, -1));
        assert.include(lexicals, '"handle":"data-ssml"');
      }),
  );

  suite.effect(
    "refuses a package whose data-ssml is an unknown name, a wrong type or outside its enumeration",
    () =>
      // Oracle: Data-SSML 1.0's JSON Schema, §3.4, as a checker: each text is one it refuses, the
      // package is refused as `attribute-lexical`, the rule of a value its domain refuses.
      Effect.gen(function* refusedPackages() {
        const values = [
          '{"brk":{}}',
          '{"break":{"time":2}}',
          '{"break":{"strength":"loud"}}',
          "not json",
        ];
        for (const [at, value] of values.entries()) {
          const dir = yield* materializeSpec(
            withDataSsml(`data-ssml-refused-${String(at)}`, value),
          );
          const error = yield* Effect.flip(previewPackage(dir));

          assert.instanceOf(error, ImportRefused, value);
          assert.strictEqual(
            error instanceof ImportRefused ? error.rules[0] : undefined,
            "attribute-lexical",
          );
        }
      }),
  );
});

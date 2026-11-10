import { assert, describe, it } from "@effect/vitest";
import { Option, Result, Schema } from "effect";
import { ResponseValueSchema } from "#plate/codec/values.ts";
import { fromPciJson, toPciJson } from "#plate/pci/json.ts";
import type { PciJson, PciJsonDeclared, PciJsonRefused } from "#plate/pci/json.ts";
import { nullOf, nullRecord } from "#plate/model/values.ts";
import type {
  ModelledBaseType,
  RecordValue,
  ResponseValue,
  Single,
  Value,
} from "#plate/model/values.ts";
import { checkAllowlist, sourceModules, valueClosure } from "#plate/test/imports.ts";
import type { BaseType, Cardinality } from "#plate/vocabulary.ts";

/**
 * Declare a response by its cardinality and, when it has one, its base type.
 *
 * @param cardinality The declaration's cardinality.
 * @param baseType The declaration's base type, none for a record.
 * @returns The declaration {@link fromPciJson} reads against.
 */
const declare = (cardinality: Cardinality, baseType?: BaseType): PciJsonDeclared =>
  baseType === undefined
    ? { baseType: Option.none(), cardinality }
    : { baseType: Option.some(baseType), cardinality };

/**
 * Read JSON that must fit its declaration.
 *
 * @param json The JSON to read.
 * @param declared The declaration to read it against.
 * @returns The value read; the test fails when the JSON is refused.
 */
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- the tests hand the reader any JSON, as a PCI does.
const readOk = (json: unknown, declared: PciJsonDeclared): ResponseValue => {
  const result = fromPciJson(json, declared);

  if (Result.isFailure(result)) {
    return assert.fail(
      `${JSON.stringify(json)} was refused as ${result.failure.reason} at ${result.failure.path}`,
    );
  }

  return result.success;
};

/**
 * Read JSON that must not fit its declaration.
 *
 * @param json The JSON to read.
 * @param declared The declaration to read it against.
 * @returns The refusal; the test fails when the JSON is read.
 */
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- the tests hand the reader any JSON, as a PCI does.
const refusal = (json: unknown, declared: PciJsonDeclared): PciJsonRefused => {
  const result = fromPciJson(json, declared);

  if (Result.isSuccess(result)) {
    return assert.fail(`${JSON.stringify(json)} was read as ${JSON.stringify(result.success)}`);
  }

  return result.failure;
};

/**
 * Construct a value for a test.
 *
 * @param baseType The value's base type.
 * @param cardinality The value's cardinality.
 * @param singles Its values.
 * @returns The value.
 */
const valueOf = (
  baseType: ModelledBaseType,
  cardinality: Value["cardinality"],
  singles: readonly Single[],
): Value => ({ baseType, cardinality, values: singles });

/**
 * Construct identifier values for a test.
 *
 * @param names The identifiers, in order.
 * @returns One identifier value for each name.
 */
const identifiers = (...names: readonly string[]): readonly Single[] =>
  names.map((name) => ({ baseType: "identifier", value: name }));

/**
 * One value of each modelled base type, with the Appendix C JSON that carries it.
 */
const samples: readonly { readonly json: PciJson; readonly single: Single }[] = [
  {
    json: { base: { identifier: "choiceA" } },
    single: { baseType: "identifier", value: "choiceA" },
  },
  { json: { base: { boolean: true } }, single: { baseType: "boolean", value: true } },
  { json: { base: { integer: -42 } }, single: { baseType: "integer", value: -42n } },
  { json: { base: { float: 2.5 } }, single: { baseType: "float", value: 2.5 } },
  {
    json: { base: { string: "hello, world" } },
    single: { baseType: "string", value: "hello, world" },
  },
  { json: { base: { point: [102, -113] } }, single: { baseType: "point", value: [102n, -113n] } },
  { json: { base: { pair: ["A", "B"] } }, single: { baseType: "pair", value: ["A", "B"] } },
  {
    json: { base: { directedPair: ["source", "target"] } },
    single: { baseType: "directedPair", value: ["source", "target"] },
  },
  { json: { base: { duration: "PT90S" } }, single: { baseType: "duration", value: 90 } },
  {
    json: { base: { uri: "https://example.org/a?b=c" } },
    single: { baseType: "uri", value: "https://example.org/a?b=c" },
  },
];

/**
 * Read a JSON duration that must fit.
 *
 * @param text What a PCI wrote under `duration`.
 * @returns The seconds it names; the test fails when the text is refused or reads as another type.
 */
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- the tests hand the reader any JSON, as a PCI does.
const durationOf = (text: unknown): number => {
  const value = readOk({ base: { duration: text } }, declare("single", "duration"));

  return value.cardinality === "record" || value.values[0]?.baseType !== "duration"
    ? assert.fail(`${JSON.stringify(text)} did not read as a duration`)
    : value.values[0].value;
};

/**
 * An object that holds itself, as a structured clone can carry one.
 */
interface Loop {
  self?: Loop;
}

/**
 * Report whether two numbers are the same double, negative zero and NaN included.
 *
 * @param left One number.
 * @param right The other number.
 * @returns Whether `Object.is` holds them the same.
 */
const sameDouble = (left: number, right: number): boolean => Object.is(left, right);

describe("[pci-02] the Appendix C JSON binding", () => {
  it("[pci-02] every modelled base type round-trips as a single value", () => {
    assert.deepStrictEqual(
      samples.map(({ single }) => single.baseType),
      [
        "identifier",
        "boolean",
        "integer",
        "float",
        "string",
        "point",
        "pair",
        "directedPair",
        "duration",
        "uri",
      ],
    );

    for (const { json, single } of samples) {
      const value = valueOf(single.baseType, "single", [single]);
      const declared = declare("single", single.baseType);
      const written = toPciJson(value);

      assert.deepStrictEqual(written, json, `${single.baseType} writes as Appendix C`);
      assert.deepStrictEqual(readOk(written, declared), value, `${single.baseType} reads back`);
      assert.deepStrictEqual(
        // oxlint-disable-next-line unicorn/prefer-structured-clone -- the JSON goes through text, as the hidden input carries it, which a clone would not exercise.
        readOk(JSON.parse(JSON.stringify(written)), declared),
        value,
        `${single.baseType} survives JSON text`,
      );
    }
  });

  it("[pci-02] multiple and ordered values write list and read back by the declared cardinality", () => {
    const json: PciJson = { list: { identifier: ["A", "B"] } };

    assert.deepStrictEqual(
      readOk(json, declare("ordered", "identifier")),
      valueOf("identifier", "ordered", identifiers("A", "B")),
    );
    assert.deepStrictEqual(
      readOk(json, declare("multiple", "identifier")),
      valueOf("identifier", "multiple", identifiers("A", "B")),
    );

    assert.deepStrictEqual(
      toPciJson(valueOf("identifier", "ordered", identifiers("A", "B"))),
      json,
    );
    assert.deepStrictEqual(
      toPciJson(valueOf("identifier", "multiple", identifiers("A", "B"))),
      json,
    );

    const repeated = valueOf("identifier", "multiple", identifiers("A", "A", "B"));

    assert.deepStrictEqual(toPciJson(repeated), { list: { identifier: ["A", "A", "B"] } });
    assert.deepStrictEqual(
      readOk(toPciJson(repeated), declare("multiple", "identifier")),
      repeated,
      "a multiple value keeps its repeats",
    );

    for (const { single } of samples) {
      for (const cardinality of ["multiple", "ordered"] as const) {
        const value = valueOf(single.baseType, cardinality, [single, single]);

        assert.deepStrictEqual(
          readOk(toPciJson(value), declare(cardinality, single.baseType)),
          value,
          `a ${cardinality} ${single.baseType} list round-trips`,
        );
      }
    }
  });

  it("[pci-02] a record writes its fields and reads them back, a NULL field dropped (J5)", () => {
    const record: RecordValue = {
      cardinality: "record",
      fields: [
        { identifier: "count", value: { baseType: "integer", value: 3n } },
        { identifier: "label", value: { baseType: "string", value: "three" } },
        { identifier: "spot", value: { baseType: "point", value: [1n, 2n] } },
        { identifier: "ratio", value: { baseType: "float", value: 0.5 } },
        { identifier: "wait", value: { baseType: "duration", value: 90 } },
      ],
    };
    const json: PciJson = {
      record: [
        { base: { integer: 3 }, name: "count" },
        { base: { string: "three" }, name: "label" },
        { base: { point: [1, 2] }, name: "spot" },
        { base: { float: 0.5 }, name: "ratio" },
        { base: { duration: "PT90S" }, name: "wait" },
      ],
    };

    assert.deepStrictEqual(toPciJson(record), json);
    assert.deepStrictEqual(readOk(json, declare("record")), record);

    const everyType: RecordValue = {
      cardinality: "record",
      fields: samples.map(({ single }) => ({ identifier: `f-${single.baseType}`, value: single })),
    };

    assert.strictEqual(everyType.fields.length, 10);
    assert.deepStrictEqual(
      readOk(
        // oxlint-disable-next-line unicorn/prefer-structured-clone -- the JSON goes through text, as the hidden input carries it, which a clone would not exercise.
        JSON.parse(JSON.stringify(toPciJson(everyType))),
        declare("record"),
      ),
      everyType,
      "a record holds a field of each modelled base type, through JSON text",
    );

    assert.deepStrictEqual(
      readOk(
        {
          record: [
            { base: { integer: 3 }, name: "count" },
            { base: null, name: "skipped" },
            { base: { string: "" }, name: "blank" },
            { base: { string: "three" }, name: "label" },
          ],
        },
        declare("record"),
      ),
      {
        cardinality: "record",
        fields: [
          { identifier: "count", value: { baseType: "integer", value: 3n } },
          { identifier: "label", value: { baseType: "string", value: "three" } },
        ],
      },
      "a NULL field, an empty string included, is no field",
    );

    assert.deepStrictEqual(
      readOk({ record: [{ base: null, name: "skipped" }] }, declare("record")),
      nullRecord,
      "a record of NULL fields is NULL",
    );
  });

  it("[pci-02] every NULL form, and undefined, reads as NULL; NULL writes the declared form (J4)", () => {
    const nulls: readonly (readonly [unknown, PciJsonDeclared, ResponseValue])[] = [
      [{ base: null }, declare("single", "identifier"), nullOf("identifier", "single")],
      [{ list: null }, declare("multiple", "integer"), nullOf("integer", "multiple")],
      [{ list: { integer: [] } }, declare("multiple", "integer"), nullOf("integer", "multiple")],
      [{ list: null }, declare("ordered", "pair"), nullOf("pair", "ordered")],
      [{ list: { pair: [] } }, declare("ordered", "pair"), nullOf("pair", "ordered")],
      [{ record: null }, declare("record"), nullRecord],
      [{ record: [] }, declare("record"), nullRecord],
      [{ base: { string: "" } }, declare("single", "string"), nullOf("string", "single")],
      [undefined, declare("single", "float"), nullOf("float", "single")],
      [undefined, declare("multiple", "float"), nullOf("float", "multiple")],
      [undefined, declare("ordered", "float"), nullOf("float", "ordered")],
      [undefined, declare("record"), nullRecord],
    ];

    for (const [json, declared, value] of nulls) {
      assert.deepStrictEqual(readOk(json, declared), value, JSON.stringify(json) ?? "undefined");
    }

    assert.deepStrictEqual(toPciJson(nullOf("identifier", "single")), { base: null });
    assert.deepStrictEqual(toPciJson(nullOf("identifier", "multiple")), { list: null });
    assert.deepStrictEqual(toPciJson(nullOf("identifier", "ordered")), { list: null });
    assert.deepStrictEqual(toPciJson(nullRecord), { record: null });
  });

  it("[pci-02] a duration writes PT<seconds>S and reads the day-time and week forms (J1)", () => {
    assert.deepStrictEqual(
      toPciJson(valueOf("duration", "single", [{ baseType: "duration", value: 90 }])),
      { base: { duration: "PT90S" } },
    );
    assert.strictEqual(durationOf("P1DT1H"), 90_000);
    assert.strictEqual(durationOf("P2W"), 1_209_600);
    assert.strictEqual(durationOf("PT1.5S"), 1.5);
    assert.strictEqual(durationOf("PT1M"), 60);
    assert.strictEqual(durationOf("PT1H30M"), 5400);
    assert.strictEqual(durationOf("P1DT2H3M4.5S"), 93_784.5);
    assert.strictEqual(durationOf("P0D"), 0);
    assert.strictEqual(durationOf("P3D"), 259_200);

    for (const seconds of [0, 1.5, 3600, 1e21, 1e-7, -5, -0, Infinity, -Infinity, Number.NaN]) {
      const written = toPciJson(
        valueOf("duration", "single", [{ baseType: "duration", value: seconds }]),
      );
      const text = "base" in written ? written.base?.["duration"] : undefined;

      assert.match(String(text), /^PT.+S$/u, `${String(seconds)} writes PT<seconds>S`);
      assert.isTrue(
        sameDouble(durationOf(text), seconds),
        `${String(seconds)} reads back from ${JSON.stringify(text)}`,
      );
    }
  });

  it("[pci-02] a duration with years or months is refused as duration-calendar (J1)", () => {
    const declared = declare("single", "duration");

    for (const text of ["P1Y", "P1M", "P1Y2M", "P1Y2M3DT4H5M6S", "P2M10D"]) {
      assert.deepStrictEqual(
        refusal({ base: { duration: text } }, declared),
        { path: "$.base.duration", reason: "duration-calendar" },
        text,
      );
    }

    assert.deepStrictEqual(
      refusal({ list: { duration: ["PT1S", "P1Y"] } }, declare("ordered", "duration")),
      { path: "$.list.duration[1]", reason: "duration-calendar" },
    );
    assert.isTrue(Result.isSuccess(fromPciJson({ base: { duration: "PT1M" } }, declared)));

    for (const text of ["P", "PT", "P1DT", "1D", "P1.5D", "PT1.5M", "P1W2D", "90", "pt1s", ""]) {
      assert.deepStrictEqual(
        refusal({ base: { duration: text } }, declared),
        { path: "$.base.duration", reason: "malformed" },
        JSON.stringify(text),
      );
    }

    assert.deepStrictEqual(refusal({ base: { duration: 90 } }, declared), {
      path: "$.base.duration",
      reason: "malformed",
    });
  });

  it("[pci-02] the wrong base type or cardinality is refused with its path (J6)", () => {
    assert.deepStrictEqual(refusal({ base: { string: "x" } }, declare("single", "integer")), {
      path: "$.base.string",
      reason: "base-type-mismatch",
    });
    assert.deepStrictEqual(refusal({ list: { string: ["x"] } }, declare("ordered", "identifier")), {
      path: "$.list.string",
      reason: "base-type-mismatch",
    });
    assert.deepStrictEqual(refusal({ base: { float: 1 } }, declare("single", "integer")), {
      path: "$.base.float",
      reason: "base-type-mismatch",
    });
    for (const json of [{ base: { identifier: "A" } }, { base: null }, undefined]) {
      assert.deepStrictEqual(
        refusal(json, declare("single")),
        { path: "$", reason: "base-type-mismatch" },
        "a declaration with no base type holds nothing, so the declaration is refused, at the root",
      );
    }
    assert.deepStrictEqual(refusal({ base: { bogus: 1 } }, declare("single", "integer")), {
      path: "$.base.bogus",
      reason: "base-type-mismatch",
    });
    assert.deepStrictEqual(
      refusal({ list: { string: [] } }, declare("multiple", "identifier")),
      { path: "$.list.string", reason: "base-type-mismatch" },
      "an empty list still names a base type, which must be the declared one",
    );

    assert.deepStrictEqual(
      refusal({ base: { identifier: "A" } }, declare("multiple", "identifier")),
      {
        path: "$.base",
        reason: "cardinality-mismatch",
      },
    );
    assert.deepStrictEqual(refusal({ base: null }, declare("ordered", "identifier")), {
      path: "$.base",
      reason: "cardinality-mismatch",
    });
    assert.deepStrictEqual(
      refusal({ list: { identifier: ["A"] } }, declare("single", "identifier")),
      {
        path: "$.list",
        reason: "cardinality-mismatch",
      },
    );
    assert.deepStrictEqual(refusal({ list: null }, declare("single", "identifier")), {
      path: "$.list",
      reason: "cardinality-mismatch",
    });
    assert.deepStrictEqual(refusal({ record: [] }, declare("single", "identifier")), {
      path: "$.record",
      reason: "cardinality-mismatch",
    });
    assert.deepStrictEqual(refusal({ base: { identifier: "A" } }, declare("record")), {
      path: "$.base",
      reason: "cardinality-mismatch",
    });
    assert.deepStrictEqual(refusal({ list: null }, declare("record")), {
      path: "$.list",
      reason: "cardinality-mismatch",
    });
  });

  it("[pci-02] an integer that is not a safe integer is refused (J6)", () => {
    const integer = declare("single", "integer");
    const point = declare("single", "point");

    for (const number of [1.5, 2 ** 60, 2 ** 53, -(2 ** 53), Number.NaN, Infinity]) {
      assert.deepStrictEqual(
        refusal({ base: { integer: number } }, integer),
        { path: "$.base.integer", reason: "number-unsafe" },
        String(number),
      );
    }

    assert.deepStrictEqual(readOk({ base: { integer: Number.MAX_SAFE_INTEGER } }, integer), {
      baseType: "integer",
      cardinality: "single",
      values: [{ baseType: "integer", value: 9_007_199_254_740_991n }],
    });
    assert.deepStrictEqual(
      refusal({ list: { integer: [1, 1.5] } }, declare("ordered", "integer")),
      { path: "$.list.integer[1]", reason: "number-unsafe" },
    );
    assert.deepStrictEqual(refusal({ base: { point: [1.5, 2] } }, point), {
      path: "$.base.point[0]",
      reason: "number-unsafe",
    });
    assert.deepStrictEqual(refusal({ base: { point: [1, 2 ** 60] } }, point), {
      path: "$.base.point[1]",
      reason: "number-unsafe",
    });

    assert.deepStrictEqual(refusal({ base: { integer: "5" } }, integer), {
      path: "$.base.integer",
      reason: "malformed",
    });

    const beyond = toPciJson(
      valueOf("integer", "single", [{ baseType: "integer", value: 2n ** 60n + 1n }]),
    );

    assert.deepStrictEqual(
      refusal(beyond, integer),
      { path: "$.base.integer", reason: "number-unsafe" },
      "an integer past the safe range writes as its nearest double, which the reader refuses",
    );
  });

  it("[pci-02] intOrIdentifier and file are refused (J2, J3)", () => {
    const file = { data: "AAEC", mime: "application/octet-stream", name: "a.bin" };

    for (const payload of [3, "x"]) {
      assert.deepStrictEqual(
        refusal({ base: { intOrIdentifier: payload } }, declare("single", "integer")),
        { path: "$.base.intOrIdentifier", reason: "base-type-mismatch" },
      );
    }

    assert.deepStrictEqual(
      refusal({ list: { intOrIdentifier: [1] } }, declare("multiple", "identifier")),
      { path: "$.list.intOrIdentifier", reason: "base-type-mismatch" },
    );
    assert.deepStrictEqual(
      refusal({ record: [{ base: { intOrIdentifier: 3 }, name: "a" }] }, declare("record")),
      { path: "$.record[0].base.intOrIdentifier", reason: "base-type-mismatch" },
    );

    assert.deepStrictEqual(refusal({ base: { file } }, declare("single", "identifier")), {
      path: "$.base.file",
      reason: "file-unmodelled",
    });
    assert.deepStrictEqual(refusal({ list: { file: [file] } }, declare("multiple", "identifier")), {
      path: "$.list.file",
      reason: "file-unmodelled",
    });
    assert.deepStrictEqual(
      refusal(
        {
          record: [
            { base: null, name: "a" },
            { base: { file }, name: "b" },
          ],
        },
        declare("record"),
      ),
      { path: "$.record[1].base.file", reason: "file-unmodelled" },
    );

    for (const json of [{ base: { file } }, { base: null }, undefined]) {
      assert.deepStrictEqual(refusal(json, declare("single", "file")), {
        path: "$",
        reason: "file-unmodelled",
      });
    }
  });

  it("[pci-02] a malformed value is refused as malformed with its path", () => {
    const single = declare("single", "identifier");
    const ordered = declare("ordered", "string");
    const record = declare("record");
    const cases: readonly (readonly [unknown, PciJsonDeclared, string])[] = [
      [{ base: 3 }, single, "$.base"],
      [{ list: { identifier: "A" } }, declare("multiple", "identifier"), "$.list.identifier"],
      [{ record: [{ base: null }] }, record, "$.record[0].name"],
      [null, single, "$"],
      ["A", single, "$"],
      [[], single, "$"],
      [3, single, "$"],
      [{}, single, "$"],
      [{ base: null, list: null }, single, "$"],
      [{ foo: 1 }, single, "$.foo"],
      [{ base: {} }, single, "$.base"],
      [{ base: { identifier: "A", string: "b" } }, single, "$.base"],
      [{ base: { identifier: null } }, single, "$.base.identifier"],
      [{ base: { identifier: "1bad" } }, single, "$.base.identifier"],
      [{ base: { identifier: "" } }, single, "$.base.identifier"],
      [{ base: { boolean: "true" } }, declare("single", "boolean"), "$.base.boolean"],
      [{ base: { float: "1.5" } }, declare("single", "float"), "$.base.float"],
      [{ base: { string: "a\u0000b" } }, declare("single", "string"), "$.base.string"],
      [{ base: { uri: "a\uFFFEb" } }, declare("single", "uri"), "$.base.uri"],
      [{ base: { point: [1] } }, declare("single", "point"), "$.base.point"],
      [{ base: { point: [1, "2"] } }, declare("single", "point"), "$.base.point[1]"],
      [{ base: { point: "1 2" } }, declare("single", "point"), "$.base.point"],
      [{ base: { pair: ["A", "B", "C"] } }, declare("single", "pair"), "$.base.pair"],
      [{ base: { pair: ["A", 2] } }, declare("single", "pair"), "$.base.pair[1]"],
      [
        { base: { directedPair: ["A", "2b"] } },
        declare("single", "directedPair"),
        "$.base.directedPair[1]",
      ],
      [{ base: null, list: null }, declare("multiple", "identifier"), "$"],
      [{ list: { identifier: null } }, declare("multiple", "identifier"), "$.list.identifier"],
      [{ list: {} }, declare("multiple", "identifier"), "$.list"],
      [{ list: 3 }, declare("multiple", "identifier"), "$.list"],
      [
        { list: { identifier: ["A", null] } },
        declare("multiple", "identifier"),
        "$.list.identifier[1]",
      ],
      [
        { list: { identifier: ["A", "x y"] } },
        declare("multiple", "identifier"),
        "$.list.identifier[1]",
      ],
      [{ list: { string: ["a", ""] } }, ordered, "$.list.string[1]"],
      [{ record: {} }, record, "$.record"],
      [{ record: [3] }, record, "$.record[0]"],
      [{ record: [{ base: null, name: 3 }] }, record, "$.record[0].name"],
      [{ record: [{ base: null, name: "1bad" }] }, record, "$.record[0].name"],
      [{ record: [{ name: "a" }] }, record, "$.record[0].base"],
      [{ record: [{ base: 3, name: "a" }] }, record, "$.record[0].base"],
      [{ record: [{ base: {}, name: "a" }] }, record, "$.record[0].base"],
      [{ record: [{ base: null, extra: 1, name: "a" }] }, record, "$.record[0].extra"],
      [
        {
          record: [
            { base: { integer: 1 }, name: "a" },
            { base: null, name: "a" },
          ],
        },
        record,
        "$.record[1].name",
      ],
      [{ record: [{ base: { integer: null }, name: "a" }] }, record, "$.record[0].base.integer"],
    ];

    for (const [json, declared, path] of cases) {
      assert.deepStrictEqual(
        refusal(json, declared),
        { path, reason: "malformed" },
        JSON.stringify(json),
      );
    }
  });

  it("[pci-02] a hostile value is refused where it stands, never thrown or followed", () => {
    const loop: Loop = {};
    loop.self = loop;

    const sparse: string[] = [];
    sparse[1] = "A";

    const inherited: unknown = Object.create({ base: null, name: "a" });

    const ordered = declare("ordered", "identifier");
    const record = declare("record");
    const cases: readonly (readonly [unknown, PciJsonDeclared, string])[] = [
      [() => 1, declare("single", "integer"), "$"],
      [1n, declare("single", "integer"), "$"],
      [Symbol("response"), declare("single", "integer"), "$"],
      [{ base: { integer: loop } }, declare("single", "integer"), "$.base.integer"],
      [{ base: { integer: () => 1 } }, declare("single", "integer"), "$.base.integer"],
      [{ base: { integer: 1n } }, declare("single", "integer"), "$.base.integer"],
      [{ base: { string: Symbol("text") } }, declare("single", "string"), "$.base.string"],
      [{ list: { identifier: sparse } }, ordered, "$.list.identifier[0]"],
      [{ list: { identifier: ["A", loop] } }, ordered, "$.list.identifier[1]"],
      [{ record: [{ base: null, name: "a", self: loop }] }, record, "$.record[0].self"],
      [{ record: [inherited] }, record, "$.record[0].name"],
      [{ record: [{ base: inherited, name: "a" }] }, record, "$.record[0].base"],
    ];

    for (const [json, declared, path] of cases) {
      assert.deepStrictEqual(refusal(json, declared), { path, reason: "malformed" }, path);
    }
  });

  it("[pci-02] a directedPair keeps source first and a pair keeps its written order", () => {
    for (const baseType of ["pair", "directedPair"] as const) {
      const declared = declare("single", baseType);

      assert.deepStrictEqual(readOk({ base: { [baseType]: ["A", "B"] } }, declared), {
        baseType,
        cardinality: "single",
        values: [{ baseType, value: ["A", "B"] }],
      });
      assert.deepStrictEqual(readOk({ base: { [baseType]: ["B", "A"] } }, declared), {
        baseType,
        cardinality: "single",
        values: [{ baseType, value: ["B", "A"] }],
      });
      assert.deepStrictEqual(
        toPciJson(valueOf(baseType, "single", [{ baseType, value: ["B", "A"] }])),
        { base: { [baseType]: ["B", "A"] } },
      );
    }
  });

  it("[pci-02] every value read is one the session codec accepts", () => {
    const accepted = Schema.is(ResponseValueSchema);
    const inputs: readonly (readonly [unknown, PciJsonDeclared])[] = [
      ...samples.map(({ json, single }): readonly [unknown, PciJsonDeclared] => [
        json,
        declare("single", single.baseType),
      ]),
      [{ list: { integer: [1, 2, 3] } }, declare("multiple", "integer")],
      [{ list: { string: ["a", "b"] } }, declare("ordered", "string")],
      [{ base: { string: "" } }, declare("single", "string")],
      [{ base: { float: Number.NaN } }, declare("single", "float")],
      [
        {
          record: [
            { base: { integer: 1 }, name: "a" },
            { base: null, name: "b" },
          ],
        },
        declare("record"),
      ],
      [undefined, declare("record")],
    ];

    for (const [json, declared] of inputs) {
      assert.isTrue(accepted(readOk(json, declared)), JSON.stringify(json) ?? "undefined");
    }
  });

  it("[pci-02] the module value-imports nothing the browser rule forbids", () => {
    const modules = sourceModules();
    const roots = ["src/pci/json.ts"];

    assert.isTrue(modules.has("src/pci/json.ts"), "the module exists");
    assert.deepStrictEqual(checkAllowlist(modules, roots), []);
    assert.deepStrictEqual(
      valueClosure(modules, roots).filter(
        (path) => path.startsWith("src/codec/") || path === "src/vocabulary.ts",
      ),
      [],
      "no Schema module and no vocabulary table enters the frame bundle",
    );
  });
});

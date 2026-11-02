import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it, layer } from "@effect/vitest";
import { Effect, FileSystem } from "effect";
import { emptyEnvironment, environmentOf, withDeclarations } from "#qti/processing/env.ts";
import type { DeclarationEntry, Environment } from "#qti/processing/env.ts";
import {
  expressionKinds,
  numerical,
  resultType,
  resultTypes,
  unify,
} from "#qti/processing/types.ts";
import type { EffectiveType } from "#qti/processing/types.ts";
import { readXml } from "#qti/xml/read.ts";

/**
 * The 64 expression kinds of section 3.3 table A, by name: the oracle `resultType` must be total
 * over.
 */
const tableA = [
  "qti-and",
  "qti-any-n",
  "qti-base-value",
  "qti-container-size",
  "qti-contains",
  "qti-correct",
  "qti-custom-operator",
  "qti-default",
  "qti-delete",
  "qti-divide",
  "qti-duration-gte",
  "qti-duration-lt",
  "qti-equal",
  "qti-equal-rounded",
  "qti-field-value",
  "qti-gcd",
  "qti-gt",
  "qti-gte",
  "qti-index",
  "qti-inside",
  "qti-integer-divide",
  "qti-integer-modulus",
  "qti-integer-to-float",
  "qti-is-null",
  "qti-lcm",
  "qti-lt",
  "qti-lte",
  "qti-map-response",
  "qti-map-response-point",
  "qti-match",
  "qti-math-constant",
  "qti-math-operator",
  "qti-max",
  "qti-member",
  "qti-min",
  "qti-multiple",
  "qti-not",
  "qti-null",
  "qti-number-correct",
  "qti-number-incorrect",
  "qti-number-presented",
  "qti-number-responded",
  "qti-number-selected",
  "qti-or",
  "qti-ordered",
  "qti-outcome-maximum",
  "qti-outcome-minimum",
  "qti-pattern-match",
  "qti-power",
  "qti-product",
  "qti-random",
  "qti-random-float",
  "qti-random-integer",
  "qti-repeat",
  "qti-round",
  "qti-round-to",
  "qti-stats-operator",
  "qti-string-match",
  "qti-substring",
  "qti-subtract",
  "qti-sum",
  "qti-test-variables",
  "qti-truncate",
  "qti-variable",
];

const single = (baseType: EffectiveType["baseType"]): EffectiveType => ({
  baseType,
  cardinality: "single",
});

describe("resultType", () => {
  it("is defined for every one of table A's 64 kinds and no other", () => {
    assert.deepStrictEqual(expressionKinds.toSorted(), tableA.toSorted());
    assert.deepStrictEqual(Object.keys(resultTypes).toSorted(), tableA.toSorted());
    assert.strictEqual(tableA.length, 64);
  });

  it("types the boolean family boolean single", () => {
    const boolean = single("boolean");
    for (const kind of [
      "qti-and",
      "qti-or",
      "qti-not",
      "qti-any-n",
      "qti-match",
      "qti-equal",
      "qti-equal-rounded",
      "qti-gt",
      "qti-gte",
      "qti-lt",
      "qti-lte",
      "qti-duration-lt",
      "qti-duration-gte",
      "qti-member",
      "qti-contains",
      "qti-substring",
      "qti-string-match",
      "qti-pattern-match",
      "qti-inside",
      "qti-is-null",
    ] as const) {
      assert.deepStrictEqual(resultType(kind, [], {}), boolean, kind);
    }
  });

  it("types qti-sum integer over integers and float once a float joins", () => {
    assert.deepStrictEqual(
      resultType("qti-sum", [single("integer"), single("integer")], {}),
      single("integer"),
    );
    assert.deepStrictEqual(
      resultType("qti-sum", [single("integer"), single("float")], {}),
      single("float"),
    );
    assert.deepStrictEqual(
      resultType("qti-sum", [{ baseType: "integer", cardinality: "multiple" }], {}),
      single("integer"),
    );
  });

  it("types qti-divide and qti-power float", () => {
    const integers = [single("integer"), single("integer")];
    assert.deepStrictEqual(resultType("qti-divide", integers, {}), single("float"));
    assert.deepStrictEqual(resultType("qti-power", integers, {}), single("float"));
  });

  it("types the rounding family integer", () => {
    assert.deepStrictEqual(resultType("qti-round", [single("float")], {}), single("integer"));
    assert.deepStrictEqual(resultType("qti-truncate", [single("float")], {}), single("integer"));
  });

  it("types qti-math-operator by its operator name", () => {
    const operand = [single("float")];
    assert.deepStrictEqual(
      resultType("qti-math-operator", operand, { name: "signum" }),
      single("integer"),
    );
    assert.deepStrictEqual(
      resultType("qti-math-operator", operand, { name: "floor" }),
      single("integer"),
    );
    assert.deepStrictEqual(
      resultType("qti-math-operator", operand, { name: "ceil" }),
      single("integer"),
    );
    assert.deepStrictEqual(
      resultType("qti-math-operator", operand, { name: "ln" }),
      single("float"),
    );
  });

  it("types containers from their operands", () => {
    assert.deepStrictEqual(resultType("qti-multiple", [single("integer"), single("integer")], {}), {
      baseType: "integer",
      cardinality: "multiple",
    });
    assert.deepStrictEqual(resultType("qti-ordered", [single("string")], {}), {
      baseType: "string",
      cardinality: "ordered",
    });
    assert.deepStrictEqual(
      resultType(
        "qti-delete",
        [single("identifier"), { baseType: "identifier", cardinality: "multiple" }],
        {},
      ),
      { baseType: "identifier", cardinality: "multiple" },
    );
  });

  it("types qti-null as any, with no cardinality", () => {
    assert.deepStrictEqual(resultType("qti-null", [], {}), {
      baseType: "any",
      cardinality: "unknown",
    });
  });
});

describe("the lattice", () => {
  it("joins any away and keeps unknown", () => {
    assert.strictEqual(unify(single("any"), single("integer")).baseType, "integer");
    assert.strictEqual(unify(single("unknown"), single("integer")).baseType, "unknown");
  });

  it("calls only integer and float numerical", () => {
    assert.strictEqual(numerical(single("integer")), true);
    assert.strictEqual(numerical(single("float")), true);
    assert.strictEqual(numerical(single("duration")), false);
  });
});

/**
 * The committed trees, relative to `packages/qti`, where the tests run.
 */
const validDirectory = "src/processing/fixtures/valid";

/**
 * Read a committed fixture and build its `item` mode environment.
 */
const environmentOfFixture = (name: string) =>
  Effect.gen(function* environmentOfFile() {
    const fs = yield* FileSystem.FileSystem;
    const document = yield* readXml(yield* fs.readFile(path.join(validDirectory, `${name}.xml`)));

    return environmentOf(document, "item");
  });

/**
 * The part of a declaration entry that a fixture's attributes fix, as `[kind, type]`.
 */
const typeOfDeclaration = (env: Environment, identifier: string) => {
  const entry = env.declarations.get(identifier);

  return entry === undefined
    ? undefined
    : [entry.kind, entry.type.baseType, entry.type.cardinality];
};

layer(NodeServices.layer, { excludeTestServices: true })("processing/env.ts", (suite) => {
  suite.effect("holds every declaration of template.xml by identifier", () =>
    Effect.gen(function* templateDeclarations() {
      const env = yield* environmentOfFixture("template");
      assert.deepStrictEqual([...env.declarations.keys()].toSorted(), [
        "A",
        "CTX",
        "M",
        "N",
        "RESPONSE",
        "SCORE",
      ]);
      assert.deepStrictEqual(typeOfDeclaration(env, "CTX"), ["context", "integer", "single"]);
      assert.deepStrictEqual(typeOfDeclaration(env, "RESPONSE"), ["response", "integer", "single"]);
      assert.deepStrictEqual(typeOfDeclaration(env, "SCORE"), ["outcome", "float", "single"]);
      assert.deepStrictEqual(typeOfDeclaration(env, "A"), ["template", "integer", "single"]);
      assert.deepStrictEqual(typeOfDeclaration(env, "N"), ["template", "integer", "single"]);
      assert.strictEqual(env.declarations.get("A")?.paramVariable, true);
      assert.strictEqual(env.declarations.get("N")?.paramVariable, false);
      assert.strictEqual(env.declarations.get("N")?.mathVariable, false);
      assert.strictEqual(env.mode, "item");
    }),
  );

  suite.effect("holds the four built-ins of item mode, QTI_CONTEXT a record", () =>
    Effect.gen(function* builtIns() {
      const env = yield* environmentOfFixture("template");
      assert.deepStrictEqual([...env.builtIns.keys()].toSorted(), [
        "QTI_CONTEXT",
        "completionStatus",
        "duration",
        "numAttempts",
      ]);
      assert.deepStrictEqual(env.builtIns.get("completionStatus"), {
        baseType: "identifier",
        cardinality: "single",
      });
      assert.deepStrictEqual(env.builtIns.get("numAttempts"), {
        baseType: "integer",
        cardinality: "single",
      });
      assert.deepStrictEqual(env.builtIns.get("duration"), {
        baseType: "float",
        cardinality: "single",
      });
      assert.deepStrictEqual(env.builtIns.get("QTI_CONTEXT"), {
        baseType: "unknown",
        cardinality: "record",
      });
    }),
  );

  suite.effect("reads the mapping and table children of response-mapped.xml", () =>
    Effect.gen(function* mappedFlags() {
      const env = yield* environmentOfFixture("response-mapped");
      const flags = (identifier: string) => {
        const entry = env.declarations.get(identifier);

        return entry === undefined
          ? undefined
          : {
              areaMapping: entry.areaMapping,
              interpolationTable: entry.interpolationTable,
              mapping: entry.mapping,
              matchTable: entry.matchTable,
            };
      };
      const none = {
        areaMapping: false,
        interpolationTable: false,
        mapping: false,
        matchTable: false,
      };
      assert.deepStrictEqual(flags("RESPONSE"), { ...none, mapping: true });
      assert.deepStrictEqual(flags("SPOT"), { ...none, areaMapping: true });
      assert.deepStrictEqual(flags("LEVEL"), { ...none, matchTable: true });
      assert.deepStrictEqual(flags("GRADE"), { ...none, interpolationTable: true });
      assert.deepStrictEqual(flags("SCORE"), none);
      assert.deepStrictEqual(typeOfDeclaration(env, "SPOT"), ["response", "point", "single"]);
      assert.deepStrictEqual(typeOfDeclaration(env, "LEVEL"), ["outcome", "string", "single"]);
    }),
  );
});

/**
 * A float outcome entry named `identifier`.
 */
const entry = (identifier: string): DeclarationEntry => ({
  areaMapping: false,
  identifier,
  interpolationTable: false,
  kind: "outcome",
  mapping: false,
  matchTable: false,
  mathVariable: false,
  paramVariable: false,
  type: { baseType: "float", cardinality: "single" },
});

describe("emptyEnvironment and withDeclarations", () => {
  it("holds no declaration in template mode", () => {
    const env = emptyEnvironment("template");
    assert.strictEqual(env.mode, "template");
    assert.strictEqual(env.declarations.size, 0);
  });

  it("holds the built-ins of the mode and none of the declarations in test mode", () => {
    const env = emptyEnvironment("test");
    assert.strictEqual(env.declarations.size, 0);
    assert.deepStrictEqual([...env.builtIns.keys()].toSorted(), [
      "QTI_CONTEXT",
      "completionStatus",
      "duration",
      "numAttempts",
    ]);
  });

  it("adds entries by identifier and leaves the argument unchanged", () => {
    const base = emptyEnvironment("test");
    const extended = withDeclarations(withDeclarations(base, [entry("A"), entry("B")]), [
      { ...entry("A"), kind: "template" },
    ]);
    assert.strictEqual(base.declarations.size, 0);
    assert.deepStrictEqual([...extended.declarations.keys()].toSorted(), ["A", "B"]);
    assert.strictEqual(extended.declarations.get("A")?.kind, "template");
    assert.strictEqual(extended.mode, "test");
  });
});

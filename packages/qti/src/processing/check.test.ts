import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it, layer } from "@effect/vitest";
import { Effect, FileSystem, Option } from "effect";
import type { Language, ProcessingAst } from "#qti/processing/ast.ts";
import { checkProcessing } from "#qti/processing/check.ts";
import type {
  TypedAst,
  TypedExpression,
  TypedRuleNode,
  Unresolved,
} from "#qti/processing/check.ts";
import { parseProcessing } from "#qti/processing/parse.ts";
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
import type { Element } from "#qti/xml/tree.ts";

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

/**
 * The `qti-<language>-processing` child of an item root, or the root itself for `outcome`.
 */
const processingRoot = (root: Element, name: string): Element => {
  if (name === "outcome") {
    return root;
  }

  const local = `qti-${name === "response-mapped" ? "response" : name}-processing`;
  const found = root.children.find((c) => c.kind === "element" && c.local === local);

  return found?.kind === "element" ? found : assert.fail(`no ${local} in ${name}.xml`);
};

const languageOf = (name: string): Language => {
  if (name === "outcome") {
    return "outcome";
  }

  return name === "template" ? "template" : "response";
};

/**
 * Read a committed fixture and parse its processing tree, with the item mode environment of its own
 * document.
 */
const parseValid = (name: string) =>
  Effect.gen(function* parseValidFile() {
    const fs = yield* FileSystem.FileSystem;
    const document = yield* readXml(yield* fs.readFile(path.join(validDirectory, `${name}.xml`)));
    const ast = yield* parseProcessing(processingRoot(document.root, name), languageOf(name));

    return { ast, document };
  });

/**
 * Parse a response processing tree written as a string.
 */
const parseBody = (body: string) =>
  Effect.gen(function* parseBodyText() {
    const text = `<qti-response-processing xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0">${body}</qti-response-processing>`;
    const document = yield* readXml(new TextEncoder().encode(text));

    return yield* parseProcessing(document.root, "response");
  });

/**
 * The result of a check that must be `ok`.
 */
const okOf = (ast: ProcessingAst, env: Environment) => {
  const result = checkProcessing(ast, env);

  return result._tag === "ok"
    ? result
    : assert.fail(`refused ${result.rule} at ${result.kind} ${result.position.path.join("/")}`);
};

/**
 * A typed expression and its operands, in document order.
 */
const withOperands = (node: TypedExpression): readonly TypedExpression[] => [
  node,
  ...node.operands.flatMap((operand) => withOperands(operand)),
];

/**
 * Whether an expression is of a kind named by a string; the processing kinds are not yet in the
 * node kind type.
 */
const isKind = (node: TypedExpression, kind: string): boolean => node.kind === kind;

/**
 * Every typed expression of a typed tree, in document order, each before its operands.
 */
const expressionsOfRule = (node: TypedRuleNode): readonly TypedExpression[] => [
  ...Option.match(node.expression, { onNone: () => [], onSome: withOperands }),
  ...node.branches.flatMap((branch) => expressionsOfRule(branch)),
  ...node.rules.flatMap((child) => expressionsOfRule(child)),
];

const expressionsOf = (typed: TypedAst): readonly TypedExpression[] =>
  typed.rules.flatMap((rule) => (rule.kind === "xi:include" ? [] : expressionsOfRule(rule)));

const typeOfKind = (typed: TypedAst, kind: string): readonly string[] =>
  expressionsOf(typed)
    .filter((e) => isKind(e, kind))
    .map((e) => `${e.type.baseType}/${e.type.cardinality}`);

/**
 * An outcome declaration of a base type and single cardinality.
 */
const outcomeOf = (identifier: string, baseType: EffectiveType["baseType"]): DeclarationEntry => ({
  areaMapping: false,
  identifier,
  interpolationTable: false,
  kind: "outcome",
  mapping: false,
  matchTable: false,
  mathVariable: false,
  paramVariable: false,
  type: { baseType, cardinality: "single" },
});

/**
 * The test environment `outcome.xml` is typed under.
 */
const testEnvironment = withDeclarations(emptyEnvironment("test"), [
  outcomeOf("TOTAL", "float"),
  outcomeOf("MAXTOTAL", "float"),
  outcomeOf("COUNT", "integer"),
  outcomeOf("PASSED", "boolean"),
]);

/**
 * The reason and identifier of each unresolved entry, in order.
 */
const summary = (unresolved: readonly Unresolved[]) =>
  unresolved.map((u) => [u.reason, u.identifier]);

layer(NodeServices.layer, { excludeTestServices: true })("processing/check.ts", (suite) => {
  suite.effect(
    "checks response.xml ok, unresolved only at the custom operator and the record field",
    () =>
      Effect.gen(function* checkResponse() {
        const { ast, document } = yield* parseValid("response");
        const result = okOf(ast, environmentOf(document, "item"));
        assert.deepStrictEqual(summary(result.unresolved), [
          ["custom-operator", "com.example.Operator"],
          ["untyped-variable", "level"],
        ]);
      }),
  );

  suite.effect("checks template.xml and response-mapped.xml ok with nothing unresolved", () =>
    Effect.gen(function* checkTemplateAndMapped() {
      for (const name of ["template", "response-mapped"]) {
        const { ast, document } = yield* parseValid(name);
        assert.deepStrictEqual(okOf(ast, environmentOf(document, "item")).unresolved, []);
      }
    }),
  );

  suite.effect("checks outcome.xml ok under the test environment, and unresolved without it", () =>
    Effect.gen(function* checkOutcome() {
      const { ast } = yield* parseValid("outcome");
      assert.deepStrictEqual(okOf(ast, testEnvironment).unresolved, []);
      assert.deepStrictEqual(summary(okOf(ast, emptyEnvironment("test")).unresolved), [
        ["untyped-variable", "TOTAL"],
        ["untyped-variable", "TOTAL"],
      ]);
    }),
  );

  suite.effect("types response.xml's operators from their operands", () =>
    Effect.gen(function* typeResponse() {
      const { ast, document } = yield* parseValid("response");
      const { typed } = okOf(ast, environmentOf(document, "item"));
      assert.deepStrictEqual(typeOfKind(typed, "qti-sum"), ["float/single", "integer/single"]);
      assert.deepStrictEqual(typeOfKind(typed, "qti-divide"), ["float/single"]);
      assert.deepStrictEqual(typeOfKind(typed, "qti-round"), ["integer/single"]);
      assert.deepStrictEqual(typeOfKind(typed, "qti-math-operator"), [
        "float/single",
        "integer/single",
      ]);
      assert.deepStrictEqual(typeOfKind(typed, "qti-multiple"), [
        "identifier/multiple",
        "float/multiple",
        "identifier/multiple",
        "string/multiple",
      ]);
      assert.deepStrictEqual(typeOfKind(typed, "qti-null"), ["any/unknown", "any/unknown"]);
      assert.deepStrictEqual(typeOfKind(typed, "qti-custom-operator"), ["unknown/unknown"]);
    }),
  );

  suite.effect("types a reference by its declaration and a built-in by its mode", () =>
    Effect.gen(function* typeReferences() {
      const { ast, document } = yield* parseValid("response");
      const { typed } = okOf(ast, environmentOf(document, "item"));
      const variables = expressionsOf(typed)
        .filter((e) => isKind(e, "qti-variable"))
        .map(
          (e) =>
            `${e.attributes.get("identifier")?.processed}:${e.type.baseType}/${e.type.cardinality}`,
        );
      assert.include(variables, "RESPONSE:identifier/single");
      assert.include(variables, "BAG:identifier/multiple");
      assert.include(variables, "SCORE:float/single");
      assert.include(variables, "QTI_CONTEXT:unknown/record");
      assert.deepStrictEqual(typeOfKind(typed, "qti-correct"), ["identifier/single"]);
      assert.deepStrictEqual(typeOfKind(typed, "qti-default"), ["float/single"]);
    }),
  );

  suite.effect("accepts qti-null beside an integer as an operand of qti-match", () =>
    Effect.gen(function* nullBesideInteger() {
      const ast = yield* parseBody(
        `<qti-set-outcome-value identifier="X"><qti-match><qti-null/><qti-base-value base-type="integer">1</qti-base-value></qti-match></qti-set-outcome-value>`,
      );
      const result = okOf(ast, emptyEnvironment("item"));
      assert.deepStrictEqual(result.unresolved, []);
      assert.deepStrictEqual(typeOfKind(result.typed, "qti-match"), ["boolean/single"]);

      const match = expressionsOf(result.typed).find((e) => isKind(e, "qti-match"));
      assert.deepStrictEqual(
        match?.operands.map((o) => `${o.type.baseType}/${o.type.cardinality}`),
        ["any/unknown", "integer/single"],
      );
    }),
  );

  suite.effect("checks response.xml in template mode ok, every variable reference unresolved", () =>
    Effect.gen(function* checkTemplateMode() {
      const { ast } = yield* parseValid("response");
      const { unresolved } = okOf(ast, emptyEnvironment("template"));
      const references = new Set(
        unresolved.filter((u) => u.reason === "template-parameter").map((u) => u.identifier),
      );
      assert.deepStrictEqual([...references].toSorted(), [
        "BAG",
        "COUNT",
        "FLAG",
        "NOTE",
        "RESPONSE",
        "SCORE",
        "SPOT",
        "TAKEN",
      ]);
      assert.deepStrictEqual(
        [
          ...new Set(
            unresolved.filter((u) => u.reason !== "template-parameter").map((u) => u.reason),
          ),
        ].toSorted(),
        ["custom-operator", "untyped-variable"],
      );
    }),
  );

  suite.effect("records a reference in a mixed-union attribute the same way", () =>
    Effect.gen(function* checkAttributeReference() {
      const ast = yield* parseBody(
        `<qti-set-outcome-value identifier="X"><qti-equal-rounded rounding-mode="decimalPlaces" figures="N"><qti-base-value base-type="float">1</qti-base-value><qti-base-value base-type="float">1</qti-base-value></qti-equal-rounded></qti-set-outcome-value>`,
      );
      assert.deepStrictEqual(summary(okOf(ast, emptyEnvironment("item")).unresolved), [
        ["untyped-variable", "N"],
      ]);
      assert.deepStrictEqual(summary(okOf(ast, emptyEnvironment("template")).unresolved), [
        ["template-parameter", "N"],
      ]);

      const declared = withDeclarations(emptyEnvironment("item"), [outcomeOf("N", "integer")]);
      assert.deepStrictEqual(okOf(ast, declared).unresolved, []);
    }),
  );
});

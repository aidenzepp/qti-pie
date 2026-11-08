import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { attr, el, text } from "#plate/document/source.ts";
import type { SourceElement } from "#plate/document/source.ts";
import type { Variables } from "#plate/engine/evaluate.ts";
import type { Expression } from "#plate/model/expression.ts";
import { kindRules } from "#plate/model/expressions/read.ts";
import { buildItem } from "#plate/model/item.ts";
import { float, integer } from "#plate/test/fixtures.ts";
import {
  assertKindType,
  baseValueElement,
  evaluateIn,
  expressionElement,
  outcomeDeclaration,
  processed,
  processingItem,
  refusalsOf,
  responseDeclaration,
  scopeOf,
  setOutcomeElement,
  variableElement,
} from "#plate/test/processing.ts";

/**
 * The path of the rule that sets `OUT` in an item {@link outItem} builds.
 */
const setOut = "qti-assessment-item/qti-response-processing/qti-set-outcome-value";

/**
 * Construct an item whose processing sets the outcome `OUT` to one expression, beside a single
 * identifier response `RESPONSE` and a single point response `POINT`. The outcome's type is not
 * the model's to judge in inline processing, so one declaration serves every kind.
 *
 * @param expression The expression element.
 * @returns The item document.
 */
const outItem = (expression: SourceElement) =>
  processingItem(
    [
      responseDeclaration("RESPONSE", "identifier"),
      responseDeclaration("POINT", "point"),
      outcomeDeclaration("OUT", "float"),
    ],
    [setOutcomeElement("OUT", expression)],
  );

/**
 * Build an item whose processing sets `OUT` to one expression, and give the expression it reads.
 *
 * @param expression The expression element.
 * @returns The expression the rule tree holds, none when the processing is none.
 */
const readOut = (expression: SourceElement) =>
  buildItem(outItem(expression)).pipe(
    Effect.map((built) =>
      built.processing.pipe(
        Option.flatMap((tree) => Option.fromUndefinedOr(tree[0])),
        Option.flatMap((rule) =>
          rule.kind === "set-outcome" ? Option.some(rule.expression) : Option.none(),
        ),
      ),
    ),
  );

describe("the references family's reader specs", () => {
  it.effect(
    "read qti-variable, qti-correct, qti-map-response and qti-map-response-point by their identifier, trimmed, as before the registry",
    () =>
      Effect.gen(function* readsIdentifiers() {
        const read = {
          correct: yield* readOut(expressionElement("correct", [attr("identifier", " RESPONSE ")])),
          mapResponse: yield* readOut(
            expressionElement("map-response", [attr("identifier", "RESPONSE")]),
          ),
          mapResponsePoint: yield* readOut(
            expressionElement("map-response-point", [attr("identifier", "\tPOINT\n")]),
          ),
          variable: yield* readOut(variableElement(" RESPONSE")),
        };
        const expected: Readonly<Record<keyof typeof read, Option.Option<Expression>>> = {
          correct: Option.some({ identifier: "RESPONSE", kind: "correct", operands: [] }),
          mapResponse: Option.some({ identifier: "RESPONSE", kind: "map-response", operands: [] }),
          mapResponsePoint: Option.some({
            identifier: "POINT",
            kind: "map-response-point",
            operands: [],
          }),
          variable: Option.some({
            identifier: "RESPONSE",
            kind: "variable",
            operands: [],
            weightIdentifier: Option.none(),
          }),
        };

        assert.deepStrictEqual(read, expected);
      }),
  );

  it.effect("read a qti-variable's weight-identifier, trimmed", () =>
    Effect.gen(function* readsWeight() {
      const read = yield* readOut(
        expressionElement("variable", [
          attr("identifier", "RESPONSE"),
          attr("weight-identifier", " WEIGHT "),
        ]),
      );

      assert.deepStrictEqual(
        read,
        Option.some<Expression>({
          identifier: "RESPONSE",
          kind: "variable",
          operands: [],
          weightIdentifier: Option.some("WEIGHT"),
        }),
      );
    }),
  );

  it.effect("read a qti-base-value's text as its base type, as before the registry", () =>
    Effect.gen(function* readsBaseValues() {
      const read = {
        float: yield* readOut(baseValueElement("float", " 2.5 ")),
        integer: yield* readOut(baseValueElement("integer", "7")),
      };

      assert.deepStrictEqual(read, {
        float: Option.some<Expression>({ kind: "base-value", operands: [], value: float(2.5) }),
        integer: Option.some<Expression>({
          kind: "base-value",
          operands: [],
          value: integer(7n),
        }),
      });
    }),
  );

  it.effect(
    "[I-9a] read a qti-base-value of base-type duration as its seconds, and refuse an ISO 8601 duration as value-type",
    () =>
      Effect.gen(function* readsDuration() {
        const read = yield* readOut(baseValueElement("duration", " 90.5 "));
        const refusal = yield* Effect.flip(
          buildItem(outItem(baseValueElement("duration", "PT1M30.5S"))),
        );

        assert.deepStrictEqual(
          read,
          Option.some<Expression>({
            kind: "base-value",
            operands: [],
            value: {
              baseType: "duration",
              cardinality: "single",
              values: [{ baseType: "duration", value: 90.5 }],
            },
          }),
        );
        assert.strictEqual(refusal.rule, "value-type");
        assert.deepStrictEqual(refusal.location, {
          kind: "path",
          path: `${setOut}/qti-base-value`,
        });
      }),
  );

  it.effect('mark a qti-base-value of base-type="file" at its path', () =>
    Effect.gen(function* marksFile() {
      const built = yield* buildItem(outItem(baseValueElement("file", "upload.txt")));

      assert.deepStrictEqual(built.processing, Option.none());
      assert.deepStrictEqual(built.unsupported, [
        { feature: 'base-type="file"', path: `${setOut}/qti-base-value`, shown: "mark" },
      ]);
    }),
  );

  it.effect("refuse a qti-base-value outside its lexical space as value-type at its path", () =>
    Effect.gen(function* refusesBaseValue() {
      const refusal = yield* Effect.flip(buildItem(outItem(baseValueElement("integer", "abc"))));

      assert.strictEqual(refusal.rule, "value-type");
      assert.deepStrictEqual(refusal.location, {
        kind: "path",
        path: `${setOut}/qti-base-value`,
      });
    }),
  );

  it.effect("mark a qti-variable that holds an operand at its path, as no operand fits it", () =>
    Effect.gen(function* marksVariableWithOperand() {
      const built = yield* buildItem(
        outItem(
          expressionElement(
            "variable",
            [attr("identifier", "RESPONSE")],
            [baseValueElement("integer", "1")],
          ),
        ),
      );

      assert.deepStrictEqual(built.processing, Option.none());
      assert.deepStrictEqual(built.unsupported, [
        { feature: "qti-variable", path: `${setOut}/qti-variable`, shown: "mark" },
      ]);
    }),
  );
});

/**
 * Construct a single template declaration.
 *
 * @param identifier Its `identifier`.
 * @param baseType Its `base-type`.
 * @param children Its children, such as a `qti-default-value`; none by default.
 * @returns The `qti-template-declaration`.
 */
const templateDeclaration = (
  identifier: string,
  baseType: string,
  children: readonly SourceElement[] = [],
): SourceElement =>
  el(
    "qti-template-declaration",
    [attr("base-type", baseType), attr("cardinality", "single"), attr("identifier", identifier)],
    children,
  );

/**
 * Construct a `qti-default` of a variable.
 *
 * @param identifier The variable it names, as written.
 * @returns The element.
 */
const defaultElement = (identifier: string): SourceElement =>
  expressionElement("default", [attr("identifier", identifier)]);

/**
 * Construct an item whose processing sets the float outcome `SCORE` to one expression.
 *
 * @param expression The expression element.
 * @param declarations The declarations beside `SCORE`'s, in document order after it.
 * @returns The item document.
 */
const scoreItem = (expression: SourceElement, declarations: readonly SourceElement[] = []) =>
  processingItem(
    [outcomeDeclaration("SCORE", "float"), ...declarations],
    [setOutcomeElement("SCORE", expression)],
  );

describe("the references family's qti-default and qti-null", () => {
  it.effect(
    "[I-9a] read a qti-default by its identifier, trimmed, and a qti-null, with processing some",
    () =>
      Effect.gen(function* readsDefaultAndNull() {
        const read = {
          default: yield* readOut(defaultElement(" OUT\n")),
          null: yield* readOut(expressionElement("null")),
        };

        assert.deepStrictEqual(read, {
          default: Option.some<Expression>({ identifier: "OUT", kind: "default", operands: [] }),
          null: Option.some<Expression>({ kind: "null", operands: [] }),
        });
      }),
  );

  it("[I-9a] refuse a qti-default that names no declared variable as undeclared-variable (P8)", () => {
    assert.deepStrictEqual(refusalsOf(scoreItem(defaultElement("NOPE"))), [
      {
        detail: { element: "qti-default", expected: "variable", identifier: "NOPE" },
        path: `${setOut}/qti-default`,
        rule: "undeclared-variable",
      },
    ]);
  });

  it.effect(
    "[I-5] [I-9a] run a qti-default that names a template variable, giving its declared default, with no mark",
    () =>
      Effect.gen(function* runsTemplateDefault() {
        const document = scoreItem(defaultElement("T"), [
          templateDeclaration("T", "float", [
            el("qti-default-value", [], [el("qti-value", [], [text("2.5")])]),
          ]),
        ]);
        const built = yield* buildItem(document);
        const after = yield* processed(document, {});

        assert.deepStrictEqual(refusalsOf(document), []);
        assert.deepStrictEqual(built.unsupported, []);
        assert.deepStrictEqual(
          after.pipe(Option.map((variables) => variables.outcomes["SCORE"])),
          Option.some(float(2.5)),
        );
      }),
  );

  it("[I-9a] refuse a qti-default of a string outcome set into the float SCORE as expression-type (P20)", () => {
    assert.deepStrictEqual(
      refusalsOf(scoreItem(defaultElement("LABEL"), [outcomeDeclaration("LABEL", "string")])),
      [
        {
          detail: {
            element: "qti-set-outcome-value",
            expressionBaseType: "string",
            expressionCardinality: "single",
            identifier: "SCORE",
            outcomeBaseType: "float",
            outcomeCardinality: "single",
          },
          path: setOut,
          rule: "expression-type",
        },
      ],
    );
  });

  it.effect(
    "[I-9a] type a qti-null as any base type, so it is refused nothing set into the float SCORE or as a qti-and operand, and builds with processing some",
    () =>
      Effect.gen(function* typesNull() {
        const nullElement = expressionElement("null");
        const documents = [
          scoreItem(nullElement),
          processingItem(
            [outcomeDeclaration("PASSED", "boolean")],
            [
              setOutcomeElement(
                "PASSED",
                expressionElement("and", [], [nullElement, baseValueElement("boolean", "true")]),
              ),
            ],
          ),
        ];

        assert.deepStrictEqual(kindRules.null.resultType([], {}), {
          baseType: "any",
          cardinality: "unknown",
        });
        for (const document of documents) {
          const built = yield* buildItem(document);

          assert.deepStrictEqual(refusalsOf(document), []);
          assert.isTrue(Option.isSome(built.processing), "the processing runs");
          assert.deepStrictEqual(built.unsupported, []);
        }
      }),
  );
});

/**
 * The declarations of the items {@link readRandom} builds: a float outcome `OUT` the expression
 * sets, the integer outcomes `LOW`, `HIGH` and `BY`, and the float outcomes `FLOOR` and `CEILING`,
 * which a random kind's attributes may name.
 */
const randomDeclarations: readonly SourceElement[] = [
  outcomeDeclaration("OUT", "float"),
  outcomeDeclaration("LOW", "integer"),
  outcomeDeclaration("HIGH", "integer"),
  outcomeDeclaration("BY", "integer"),
  outcomeDeclaration("FLOOR", "float"),
  outcomeDeclaration("CEILING", "float"),
];

/**
 * Build an item whose processing sets `OUT` to one random kind beside
 * {@link randomDeclarations}, and give the expression it reads and the item.
 *
 * @param expression The expression element.
 * @returns The expression the rule tree holds, none when the processing is none, and the item.
 */
const readRandom = (expression: SourceElement) =>
  buildItem(processingItem(randomDeclarations, [setOutcomeElement("OUT", expression)])).pipe(
    Effect.map((built) => ({
      built,
      read: built.processing.pipe(
        Option.flatMap((tree) => Option.fromUndefinedOr(tree[0])),
        Option.flatMap((rule) =>
          rule.kind === "set-outcome" ? Option.some(rule.expression) : Option.none(),
        ),
      ),
    })),
  );

/**
 * The variables of an attempt in which the outcomes {@link randomDeclarations} declares hold a
 * value each.
 */
const randomVariables: Variables = {
  outcomes: {
    BY: integer(2n),
    CEILING: float(4.5),
    FLOOR: float(1.5),
    HIGH: integer(9n),
    LOW: integer(3n),
    OUT: float(0),
  },
  responses: {},
};

describe("the references family's qti-random-integer and qti-random-float", () => {
  it.effect(
    "[I-9a] read a qti-random-integer and a qti-random-float with their defaults: min 0 and step 1, and min 0",
    () =>
      Effect.gen(function* readsDefaults() {
        const integerRead = yield* readRandom(
          expressionElement("random-integer", [attr("max", " 10 ")]),
        );
        const floatRead = yield* readRandom(
          expressionElement("random-float", [attr("max", "2.5")]),
        );

        assert.deepStrictEqual(
          integerRead.read,
          Option.some<Expression>({
            kind: "random-integer",
            max: { _tag: "literal", value: 10n },
            min: { _tag: "literal", value: 0n },
            operands: [],
            step: { _tag: "literal", value: 1n },
          }),
        );
        assert.deepStrictEqual(
          floatRead.read,
          Option.some<Expression>({
            kind: "random-float",
            max: { _tag: "literal", value: 2.5 },
            min: { _tag: "literal", value: 0 },
            operands: [],
          }),
        );
        assert.deepStrictEqual(
          [...integerRead.built.unsupported, ...floatRead.built.unsupported],
          [],
        );
      }),
  );

  it.effect(
    "[I-9a] read each attribute of a qti-random-integer and a qti-random-float that names a variable as a reference, and its evaluator agrees with its rule",
    () =>
      Effect.gen(function* readsReferences() {
        const integerRead = yield* readRandom(
          expressionElement("random-integer", [
            attr("max", "HIGH"),
            attr("min", "LOW"),
            attr("step", "BY"),
          ]),
        );
        const floatRead = yield* readRandom(
          expressionElement("random-float", [attr("max", "CEILING"), attr("min", "FLOOR")]),
        );

        assert.deepStrictEqual(
          integerRead.read,
          Option.some<Expression>({
            kind: "random-integer",
            max: { _tag: "ref", identifier: "HIGH" },
            min: { _tag: "ref", identifier: "LOW" },
            operands: [],
            step: { _tag: "ref", identifier: "BY" },
          }),
        );
        assert.deepStrictEqual(
          floatRead.read,
          Option.some<Expression>({
            kind: "random-float",
            max: { _tag: "ref", identifier: "CEILING" },
            min: { _tag: "ref", identifier: "FLOOR" },
            operands: [],
          }),
        );

        for (const { built, read } of [integerRead, floatRead]) {
          const expression = Option.getOrThrow(read);
          const value = evaluateIn(expression, scopeOf(built, randomVariables));

          assert.isTrue(Result.isSuccess(value), `qti-${expression.kind} failed`);
          assertKindType(Result.getOrThrow(value), expression.kind, []);
        }
      }),
  );

  it("[I-9a] type a qti-random-integer as a single integer and a qti-random-float as a single float", () => {
    assert.deepStrictEqual(
      {
        float: kindRules["random-float"].resultType([], {}),
        integer: kindRules["random-integer"].resultType([], {}),
      },
      {
        float: { baseType: "float", cardinality: "single" },
        integer: { baseType: "integer", cardinality: "single" },
      },
    );
  });
});

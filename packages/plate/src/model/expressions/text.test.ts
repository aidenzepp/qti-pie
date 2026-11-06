/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shape` is the QTI attribute of `qti-inside` and names an area's geometry, not a structure. */
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { attr, el, text } from "#plate/document/source.ts";
import type { SourceElement } from "#plate/document/source.ts";
import type { Expression, Rule } from "#plate/model/expression.ts";
import { buildItem } from "#plate/model/item.ts";
import type { Value } from "#plate/model/values.ts";
import {
  assertKindType,
  baseValueElement,
  expressionElement,
  outcomeDeclaration,
  processed,
  processingItem,
  refusalsOf,
  responseDeclaration,
  setOutcomeElement,
  variableElement,
} from "#plate/test/processing.ts";

/**
 * The path of the `qti-response-processing` of an item {@link processingItem} builds.
 */
const processing = "qti-assessment-item/qti-response-processing";

/**
 * The path of the rule that sets `PASSED` in an item {@link passedItem} builds.
 */
const setPassed = `${processing}/qti-set-outcome-value`;

/**
 * The type of a single string operand.
 */
const singleString = { baseType: "string", cardinality: "single" } as const;

/**
 * Construct an item whose processing sets the boolean outcome `PASSED` to one expression.
 *
 * @param expression The expression element.
 * @param declarations The declarations beside `PASSED`'s, in document order after it.
 * @returns The item document.
 */
const passedItem = (expression: SourceElement, declarations: readonly SourceElement[] = []) =>
  processingItem(
    [outcomeDeclaration("PASSED", "boolean"), ...declarations],
    [setOutcomeElement("PASSED", expression)],
  );

/**
 * Construct a `qti-base-value` of a string.
 *
 * @param written The string, as written.
 * @returns The element.
 */
const stringElement = (written: string): SourceElement => baseValueElement("string", written);

/**
 * Construct a single boolean value.
 *
 * @param value The boolean.
 * @returns The value.
 */
const truth = (value: boolean): Value => ({
  baseType: "boolean",
  cardinality: "single",
  values: [{ baseType: "boolean", value }],
});

/**
 * Construct the `qti-base-value` expression of a string, as the reader reads
 * {@link stringElement}.
 *
 * @param value The string.
 * @returns The expression.
 */
const stringExpression = (value: string): Expression => ({
  kind: "base-value",
  operands: [],
  value: { baseType: "string", cardinality: "single", values: [{ baseType: "string", value }] },
});

/**
 * Construct a string outcome declaration with a default value.
 *
 * @param identifier Its `identifier`.
 * @param written Its default value, as written.
 * @returns The `qti-outcome-declaration`.
 */
const stringOutcome = (identifier: string, written: string): SourceElement =>
  outcomeDeclaration(identifier, "string", "single", [
    el("qti-default-value", [], [el("qti-value", [], [text(written)])]),
  ]);

/**
 * Construct a `qti-pattern-match` of one operand.
 *
 * @param pattern Its `pattern`, as written.
 * @param operand Its operand.
 * @returns The element.
 */
const patternElement = (pattern: string, operand: SourceElement): SourceElement =>
  expressionElement("pattern-match", [attr("pattern", pattern)], [operand]);

/**
 * Construct a `qti-inside` of one operand.
 *
 * @param area Its `shape` and its `coords`, as written.
 * @param area.coords Its `coords`.
 * @param area.shape Its `shape`.
 * @param operand Its operand.
 * @returns The element.
 */
const insideElement = (
  area: { readonly coords: string; readonly shape: string },
  operand: SourceElement,
): SourceElement =>
  expressionElement("inside", [attr("coords", area.coords), attr("shape", area.shape)], [operand]);

/**
 * Construct a single point value.
 *
 * @param x Its x coordinate.
 * @param y Its y coordinate.
 * @returns The value.
 */
const at = (x: bigint, y: bigint): Value => ({
  baseType: "point",
  cardinality: "single",
  values: [{ baseType: "point", value: [x, y] }],
});

/**
 * Build an item and run its processing with the given responses, as one attempt does.
 *
 * @param expression The expression `PASSED` is set to.
 * @param declarations The declarations beside `PASSED`'s.
 * @param responses The responses, by identifier; none unless given.
 * @returns The value of `PASSED` after the run.
 */
const passedAfter = (
  expression: SourceElement,
  declarations: readonly SourceElement[] = [],
  responses: Readonly<Record<string, Value>> = {},
) =>
  Effect.gen(function* runPassed() {
    const after = yield* processed(passedItem(expression, declarations), responses);
    assert.isTrue(Option.isSome(after), "the processing ran");

    return Option.getOrThrow(
      Option.flatMapNullishOr(after, (variables) => variables.outcomes["PASSED"]),
    );
  });

describe("the text family's reader specs and kind rules", () => {
  it.effect(
    "[I-9a] build a qti-string-match and a qti-substring with their attributes and run each to the type its rule gives",
    () =>
      Effect.gen(function* buildsStringKinds() {
        const stringMatch = expressionElement(
          "string-match",
          [attr("case-sensitive", "false"), attr("substring", "true")],
          [stringElement("New York"), stringElement("YORK")],
        );
        const substring = expressionElement(
          "substring",
          [attr("case-sensitive", "true")],
          [stringElement("York"), stringElement("New York")],
        );
        const built = yield* buildItem(
          passedItem(expressionElement("and", [], [stringMatch, substring])),
        );

        assert.deepStrictEqual(built.unsupported, []);

        const expected: Rule = {
          expression: {
            kind: "and",
            operands: [
              {
                caseSensitive: false,
                kind: "string-match",
                operands: [stringExpression("New York"), stringExpression("YORK")],
                substring: true,
              },
              {
                caseSensitive: true,
                kind: "substring",
                operands: [stringExpression("York"), stringExpression("New York")],
              },
            ],
          },
          identifier: "PASSED",
          kind: "set-outcome",
        };

        assert.deepStrictEqual(built.processing, Option.some([expected]));

        for (const [expression, kind] of [
          [stringMatch, "string-match"],
          [substring, "substring"],
        ] as const) {
          const passed = yield* passedAfter(expression);

          assert.deepStrictEqual(passed, truth(true), kind);
          assertKindType(passed, kind, [singleString, singleString]);
        }
      }),
  );

  it.effect("[I-9a] read qti-string-match's substring as false when it is absent", () =>
    Effect.gen(function* readsSubstringDefault() {
      const built = yield* buildItem(
        passedItem(
          expressionElement(
            "string-match",
            [attr("case-sensitive", "true")],
            [stringElement("a"), stringElement("a")],
          ),
        ),
      );
      const [rule] = Option.getOrElse(built.processing, () => []);
      const expression = rule?.kind === "set-outcome" ? rule.expression : undefined;

      assert.deepStrictEqual(
        expression?.kind === "string-match" ? expression.substring : "not read",
        false,
      );
    }),
  );

  it("[I-9a] refuse each operand of qti-string-match, qti-substring and qti-pattern-match that is not a single string, and of qti-inside that is not a point (expression-type, P23)", () => {
    const integerOne = baseValueElement("integer", "1");
    const cases: readonly (readonly [SourceElement, string, string, string, string])[] = [
      [
        expressionElement(
          "string-match",
          [attr("case-sensitive", "true")],
          [stringElement("a"), integerOne],
        ),
        "2",
        "integer",
        "string",
        "single",
      ],
      [
        expressionElement(
          "substring",
          [attr("case-sensitive", "true")],
          [integerOne, stringElement("a")],
        ),
        "1",
        "integer",
        "string",
        "single",
      ],
      [patternElement("[0-9]+", integerOne), "1", "integer", "string", "single"],
      [
        insideElement({ coords: "0,0,10,10", shape: "rect" }, stringElement("1 1")),
        "1",
        "string",
        "point",
        "multiple ordered single",
      ],
    ];

    for (const [
      expression,
      operand,
      expressionBaseType,
      acceptsBaseTypes,
      acceptsCardinalities,
    ] of cases) {
      assert.deepStrictEqual(
        refusalsOf(passedItem(expression)),
        [
          {
            detail: {
              acceptsBaseTypes,
              acceptsCardinalities,
              check: "operand",
              element: expression.local,
              expressionBaseType,
              expressionCardinality: "single",
              operand,
            },
            path: `${setPassed}/${expression.local}`,
            rule: "expression-type",
          },
        ],
        expression.local,
      );
    }
  });

  it.effect("[I-9a] run a qti-pattern-match anchored at both ends, its pattern a literal", () =>
    Effect.gen(function* runsAnchoredPattern() {
      const whole = yield* passedAfter(patternElement("[0-9]+", stringElement("123")));
      const part = yield* passedAfter(patternElement("[0-9]+", stringElement("a123")));

      assert.deepStrictEqual(whole, truth(true));
      assert.deepStrictEqual(part, truth(false));
      for (const passed of [whole, part]) {
        assertKindType(passed, "pattern-match", [singleString]);
      }
    }),
  );

  it.effect(
    "[I-9a] mark a qti-pattern-match whose literal pattern is no XML Schema regular expression pattern, and run none (§5.3, readings 55 and 58)",
    () =>
      Effect.gen(function* marksRefusedPattern() {
        const document = passedItem(patternElement("a(b", stringElement("ab")));
        const built = yield* buildItem(document);

        assert.deepStrictEqual(refusalsOf(document), []);
        assert.deepStrictEqual(built.processing, Option.none());
        assert.deepStrictEqual(built.unsupported, [
          { feature: "pattern", path: `${setPassed}/qti-pattern-match`, shown: "mark" },
        ]);
      }),
  );

  it.effect(
    "[I-9a] run a qti-pattern-match whose {name} pattern names a string outcome variable with that variable's value",
    () =>
      Effect.gen(function* runsReferencedPattern() {
        const expression = patternElement("{DIGITS}", stringElement("42"));
        const digits = stringOutcome("DIGITS", "[0-9]+");
        const letters = stringOutcome("DIGITS", "[a-z]+");

        assert.deepStrictEqual(refusalsOf(passedItem(expression, [digits])), []);

        const built = yield* buildItem(passedItem(expression, [digits]));
        const [rule] = Option.getOrElse(built.processing, () => []);
        const read = rule?.kind === "set-outcome" ? rule.expression : undefined;

        assert.deepStrictEqual(read?.kind === "pattern-match" ? read.pattern : undefined, {
          _tag: "ref",
          identifier: "DIGITS",
        });
        assert.deepStrictEqual(yield* passedAfter(expression, [digits]), truth(true));
        assert.deepStrictEqual(yield* passedAfter(expression, [letters]), truth(false));
      }),
  );

  it("[I-9a] refuse a qti-pattern-match whose {name} pattern names an integer outcome variable or a response variable (expression-type, P24)", () => {
    const integerOutcome = outcomeDeclaration("COUNT", "integer");
    const response = responseDeclaration("RESPONSE", "string");

    for (const [name, declaration] of [
      ["COUNT", integerOutcome],
      ["RESPONSE", response],
    ] as const) {
      assert.deepStrictEqual(
        refusalsOf(passedItem(patternElement(`{${name}}`, stringElement("1")), [declaration])),
        [
          {
            detail: {
              attribute: "pattern",
              check: "reference",
              element: "qti-pattern-match",
              expectedBaseType: "string",
              identifier: name,
            },
            path: `${setPassed}/qti-pattern-match`,
            rule: "expression-type",
          },
        ],
        name,
      );
    }
  });

  it.effect(
    "[I-9a] read a braced pattern name that names no variable as its literal text, never P8: ruling R1's agreement difference with pantry's P8; the text {NOPE} is no regular expression (reading 58), so it marks pattern",
    () =>
      Effect.gen(function* readsUnnamedBraces() {
        const document = passedItem(patternElement("{NOPE}", stringElement("{NOPE}")));
        const built = yield* buildItem(document);

        assert.deepStrictEqual(refusalsOf(document), []);
        assert.deepStrictEqual(built.processing, Option.none());
        assert.deepStrictEqual(built.unsupported, [
          { feature: "pattern", path: `${setPassed}/qti-pattern-match`, shown: "mark" },
        ]);
      }),
  );

  it.effect(
    "[I-9a] mark a qti-pattern-match whose {name} pattern names a template variable variable:<id> and run none",
    () =>
      Effect.gen(function* marksTemplatePattern() {
        const document = passedItem(patternElement("{T}", stringElement("1")), [
          el("qti-template-declaration", [
            attr("base-type", "string"),
            attr("cardinality", "single"),
            attr("identifier", "T"),
          ]),
        ]);
        const built = yield* buildItem(document);

        assert.deepStrictEqual(refusalsOf(document), []);
        assert.deepStrictEqual(built.processing, Option.none());
        assert.deepStrictEqual(built.unsupported, [
          {
            feature: "qti-template-declaration",
            path: "qti-assessment-item/qti-template-declaration",
            shown: "mark",
          },
          { feature: "variable:T", path: processing, shown: "mark" },
        ]);
      }),
  );

  it.effect(
    "[I-9a] build a qti-inside with its shape and coords, and run it over a point response, its boundary held (readings 52 and 59)",
    () =>
      Effect.gen(function* runsInside() {
        const expression = insideElement(
          { coords: "184,78,244,112", shape: "rect" },
          variableElement("RESPONSE"),
        );
        const declarations = [responseDeclaration("RESPONSE", "point")];
        const built = yield* buildItem(passedItem(expression, declarations));
        const [rule] = Option.getOrElse(built.processing, () => []);
        const read = rule?.kind === "set-outcome" ? rule.expression : undefined;

        assert.deepStrictEqual(built.unsupported, []);
        assert.deepStrictEqual(
          read?.kind === "inside" ? { coords: read.coords, shape: read.shape } : undefined,
          { coords: [184, 78, 244, 112], shape: "rect" },
        );

        const held = yield* passedAfter(expression, declarations, { RESPONSE: at(216n, 90n) });
        const edge = yield* passedAfter(expression, declarations, { RESPONSE: at(244n, 112n) });
        const outside = yield* passedAfter(expression, declarations, { RESPONSE: at(10n, 10n) });

        assert.deepStrictEqual(held, truth(true));
        assert.deepStrictEqual(edge, truth(true));
        assert.deepStrictEqual(outside, truth(false));
        for (const passed of [held, edge, outside]) {
          assertKindType(passed, "inside", [{ baseType: "point", cardinality: "single" }]);
        }
      }),
  );

  it.effect(
    "[I-9a] mark a qti-inside with a % coordinate area-coords-percent, as qti-map-response-point marks one, and run none",
    () =>
      Effect.gen(function* marksPercentInside() {
        const document = passedItem(
          insideElement({ coords: "10%,20,30,40", shape: "rect" }, variableElement("RESPONSE")),
          [responseDeclaration("RESPONSE", "point")],
        );
        const built = yield* buildItem(document);

        assert.deepStrictEqual(refusalsOf(document), []);
        assert.deepStrictEqual(built.processing, Option.none());
        assert.deepStrictEqual(built.unsupported, [
          { feature: "area-coords-percent", path: `${setPassed}/qti-inside`, shown: "mark" },
        ]);
      }),
  );

  it.effect(
    "[I-9a] mark a qti-custom-operator qti-custom-operator, read none of its foreign content, and still run its processing, the operator NULL (9.21)",
    () =>
      Effect.gen(function* runsCustomOperator() {
        const custom = expressionElement(
          "custom-operator",
          [
            attr("class", "com.example.Marker"),
            attr("definition", "https://example.com/marker"),
            attr("mode", "strict", "https://example.com/ns"),
          ],
          [
            stringElement("essay"),
            el("setting", [attr("name", "rubric")], [], "https://example.com/ns"),
          ],
        );
        const document = passedItem(expressionElement("is-null", [], [custom]));
        const built = yield* buildItem(document);
        const [rule] = Option.getOrElse(built.processing, () => []);
        const isNull = rule?.kind === "set-outcome" ? rule.expression : undefined;
        const read = isNull?.kind === "is-null" ? isNull.operands[0] : undefined;

        assert.deepStrictEqual(refusalsOf(document), []);
        assert.deepStrictEqual(built.unsupported, [
          {
            feature: "qti-custom-operator",
            path: `${setPassed}/qti-is-null/qti-custom-operator`,
            shown: "mark",
          },
        ]);
        assert.deepStrictEqual(
          read?.kind === "custom-operator"
            ? { class: read.class, definition: read.definition, operands: read.operands.length }
            : undefined,
          {
            class: Option.some("com.example.Marker"),
            definition: Option.some("https://example.com/marker"),
            operands: 1,
          },
        );
        assert.deepStrictEqual(
          yield* passedAfter(expressionElement("is-null", [], [custom])),
          truth(true),
        );
      }),
  );

  it("[I-9a] judge no operand of a qti-custom-operator", () => {
    assert.deepStrictEqual(
      refusalsOf(
        passedItem(
          expressionElement(
            "is-null",
            [],
            [
              expressionElement(
                "custom-operator",
                [],
                [baseValueElement("integer", "1"), stringElement("a")],
              ),
            ],
          ),
        ),
      ),
      [],
    );
  });
});

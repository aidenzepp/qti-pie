import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { attr, doc, el, text } from "#plate/document/source.ts";
import type { SourceDocument, SourceElement } from "#plate/document/source.ts";
import type { Expression, TemplateBranch, TemplateRule } from "#plate/model/expression.ts";
import { buildItem } from "#plate/model/item.ts";
import type { UnsupportedFeature } from "#plate/model/item.ts";
import type { Value } from "#plate/model/values.ts";
import { integer } from "#plate/test/fixtures.ts";

/**
 * The path of the template processing, which every path in these tests starts with.
 */
const processing = "qti-assessment-item/qti-template-processing";

/**
 * The marks every item {@link templated} builds carries until P7T-04 removes them (spec D3): one
 * per template declaration, then the template processing's.
 */
const templateMarks: readonly UnsupportedFeature[] = [
  ...[1, 2].map((position): UnsupportedFeature => ({
    feature: "qti-template-declaration",
    path: `qti-assessment-item/qti-template-declaration[${position}]`,
    shown: "mark",
  })),
  { feature: "qti-template-processing", path: processing, shown: "mark" },
];

/**
 * Construct an item whose template processing holds some rules, beside the template variables `T`
 * and `U` (single integers), the response `RESPONSE` (a single integer) and the outcome `SCORE` (a
 * single float).
 *
 * @param rules The children of the `qti-template-processing`.
 * @returns The document at `items/test.xml`.
 */
const templated = (rules: readonly SourceElement[]): SourceDocument =>
  doc(
    "items/test.xml",
    el(
      "qti-assessment-item",
      [attr("identifier", "item"), attr("title", "Item")],
      [
        el("qti-response-declaration", [
          attr("base-type", "integer"),
          attr("cardinality", "single"),
          attr("identifier", "RESPONSE"),
        ]),
        el("qti-outcome-declaration", [
          attr("base-type", "float"),
          attr("cardinality", "single"),
          attr("identifier", "SCORE"),
        ]),
        ...["T", "U"].map((identifier) =>
          el("qti-template-declaration", [
            attr("base-type", "integer"),
            attr("cardinality", "single"),
            attr("identifier", identifier),
          ]),
        ),
        el("qti-template-processing", [], rules),
        el("qti-item-body"),
      ],
    ),
  );

/**
 * Construct a `qti-base-value` of an integer.
 *
 * @param value The integer, as written.
 * @returns The expression element.
 */
const integerElement = (value: string): SourceElement =>
  el("qti-base-value", [attr("base-type", "integer")], [text(value)]);

/**
 * Construct a `qti-base-value` of a boolean.
 *
 * @param value The boolean, as written.
 * @returns The expression element.
 */
const booleanElement = (value: "false" | "true"): SourceElement =>
  el("qti-base-value", [attr("base-type", "boolean")], [text(value)]);

/**
 * Construct a `qti-variable`.
 *
 * @param identifier The variable it reads.
 * @returns The expression element.
 */
const variableElement = (identifier: string): SourceElement =>
  el("qti-variable", [attr("identifier", identifier)]);

/**
 * Construct a rule element that names its target and holds some operands, such as a
 * `qti-set-template-value`.
 *
 * @param local The rule's name.
 * @param identifier The variable it sets.
 * @param operands Its children.
 * @returns The rule element.
 */
const setting = (
  local: string,
  identifier: string,
  ...operands: readonly SourceElement[]
): SourceElement => el(local, [attr("identifier", identifier)], operands);

/**
 * A single boolean.
 *
 * @param value The boolean.
 * @returns The value.
 */
const boolean = (value: boolean): Value => ({
  baseType: "boolean",
  cardinality: "single",
  values: [{ baseType: "boolean", value }],
});

/**
 * The expression a `qti-base-value` of an integer reads as.
 *
 * @param value The integer.
 * @returns The expression.
 */
const integerOf = (value: bigint): Expression => ({
  kind: "base-value",
  operands: [],
  value: integer(value),
});

/**
 * The expression a `qti-base-value` of a boolean reads as.
 *
 * @param value The boolean.
 * @returns The expression.
 */
const booleanOf = (value: boolean): Expression => ({
  kind: "base-value",
  operands: [],
  value: boolean(value),
});

/**
 * The expression a `qti-variable` reads as.
 *
 * @param identifier The variable it reads.
 * @returns The expression.
 */
const variableOf = (identifier: string): Expression => ({
  identifier,
  kind: "variable",
  operands: [],
  weightIdentifier: Option.none(),
});

/**
 * Construct a branch of a template condition.
 *
 * @param when Its condition.
 * @param then The rules it runs.
 * @returns The branch.
 */
const branch = (when: Expression, then: readonly TemplateRule[]): TemplateBranch => ({
  // oxlint-disable-next-line unicorn/no-thenable -- `then` is the branch's rule list, the name section 0.5 of the phase-8 slice list fixes; it is an array, never a function.
  then,
  when,
});

/**
 * Construct the rule that sets the template variable `T`.
 *
 * @param value The integer it sets.
 * @returns The rule.
 */
const setT = (value: bigint): TemplateRule => ({
  expression: integerOf(value),
  identifier: "T",
  kind: "set-template-value",
});

describe("templateRules", () => {
  it.effect(
    "[I-5] reads qti-set-template-value, qti-set-correct-response and qti-set-default-value into their target and expression",
    () =>
      Effect.gen(function* readsSettingRules() {
        const built = yield* buildItem(
          templated([
            setting("qti-set-template-value", "T", integerElement("3")),
            setting("qti-set-correct-response", "RESPONSE", variableElement("T")),
            setting("qti-set-default-value", "SCORE", integerElement("0")),
          ]),
        );

        assert.deepStrictEqual(
          built.templateProcessing,
          Option.some([
            setT(3n),
            { expression: variableOf("T"), identifier: "RESPONSE", kind: "set-correct-response" },
            { expression: integerOf(0n), identifier: "SCORE", kind: "set-default-value" },
          ]),
        );
        assert.deepStrictEqual(built.unsupported, templateMarks);
      }),
  );

  it.effect(
    "[I-5] reads a qti-template-condition into its branches in order and its qti-template-else as otherwise",
    () =>
      Effect.gen(function* readsCondition() {
        const built = yield* buildItem(
          templated([
            el(
              "qti-template-condition",
              [],
              [
                el(
                  "qti-template-if",
                  [],
                  [
                    booleanElement("false"),
                    setting("qti-set-template-value", "T", integerElement("1")),
                  ],
                ),
                el(
                  "qti-template-else-if",
                  [],
                  [
                    booleanElement("true"),
                    setting("qti-set-template-value", "T", integerElement("2")),
                    el("qti-exit-template"),
                  ],
                ),
                el(
                  "qti-template-else",
                  [],
                  [
                    el(
                      "qti-template-condition",
                      [],
                      [el("qti-template-if", [], [booleanElement("true")])],
                    ),
                    setting("qti-set-template-value", "T", integerElement("3")),
                  ],
                ),
              ],
            ),
          ]),
        );

        assert.deepStrictEqual(
          built.templateProcessing,
          Option.some<readonly TemplateRule[]>([
            {
              branches: [
                branch(booleanOf(false), [setT(1n)]),
                branch(booleanOf(true), [setT(2n), { kind: "exit-template" }]),
              ],
              kind: "template-condition",
              otherwise: Option.some([
                {
                  branches: [branch(booleanOf(true), [])],
                  kind: "template-condition",
                  otherwise: Option.none(),
                },
                setT(3n),
              ]),
            },
          ]),
        );
        assert.deepStrictEqual(built.unsupported, templateMarks);
      }),
  );

  it.effect(
    "[I-5] reads a qti-template-constraint into its expression and a qti-exit-template into an exit, in document order",
    () =>
      Effect.gen(function* readsConstraintAndExit() {
        const built = yield* buildItem(
          templated([
            setting("qti-set-template-value", "T", integerElement("4")),
            el(
              "qti-template-constraint",
              [],
              [el("qti-match", [], [variableElement("T"), integerElement("4")])],
            ),
            el("qti-exit-template"),
            setting("qti-set-template-value", "U", integerElement("5")),
          ]),
        );

        assert.deepStrictEqual(
          built.templateProcessing,
          Option.some<readonly TemplateRule[]>([
            setT(4n),
            {
              expression: { kind: "match", operands: [variableOf("T"), integerOf(4n)] },
              kind: "template-constraint",
            },
            { kind: "exit-template" },
            { expression: integerOf(5n), identifier: "U", kind: "set-template-value" },
          ]),
        );
      }),
  );

  it.effect(
    "[I-5] reads an empty qti-template-processing as template processing with no rule",
    () =>
      Effect.gen(function* readsEmpty() {
        const built = yield* buildItem(templated([]));

        assert.deepStrictEqual(built.templateProcessing, Option.some([]));
      }),
  );

  it.effect(
    "[I-5] reads template processing as none when a rule element is not a template rule, marking it by its name",
    () =>
      Effect.gen(function* marksForeignRule() {
        const cases: readonly {
          readonly element: SourceElement;
          readonly feature: string;
          readonly path: string;
        }[] = [
          {
            element: setting("qti-set-outcome-value", "SCORE", integerElement("1")),
            feature: "qti-set-outcome-value",
            path: `${processing}/qti-set-outcome-value`,
          },
          {
            element: el("qti-template-if", [], [booleanElement("true")]),
            feature: "qti-template-if",
            path: `${processing}/qti-template-if`,
          },
          {
            element: el("rule", [], [], "urn:example:foreign"),
            feature: "{urn:example:foreign}rule",
            path: `${processing}/{urn:example:foreign}rule`,
          },
        ];

        for (const { element, feature, path } of cases) {
          const built = yield* buildItem(
            templated([setting("qti-set-template-value", "T", integerElement("1")), element]),
          );

          assert.deepStrictEqual(built.templateProcessing, Option.none(), feature);
          assert.deepStrictEqual(
            built.unsupported,
            [...templateMarks, { feature, path, shown: "mark" }],
            feature,
          );
        }
      }),
  );

  it.effect(
    "[I-5] reads template processing as none when an expression in it is a kind the registry has not landed, marking the kind at its path",
    () =>
      Effect.gen(function* marksUnlandedKind() {
        const built = yield* buildItem(
          templated([
            el(
              "qti-template-condition",
              [],
              [
                el(
                  "qti-template-if",
                  [],
                  [
                    booleanElement("true"),
                    setting(
                      "qti-set-template-value",
                      "T",
                      el(
                        "qti-field-value",
                        [attr("field-identifier", "f")],
                        [variableElement("U")],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ]),
        );

        assert.deepStrictEqual(built.templateProcessing, Option.none());
        assert.deepStrictEqual(built.unsupported, [
          ...templateMarks,
          {
            feature: "qti-field-value",
            path: `${processing}/qti-template-condition/qti-template-if/qti-set-template-value/qti-field-value`,
            shown: "mark",
          },
        ]);
      }),
  );

  it.effect(
    "[I-5] reads a template rule of a malformed shape as a response rule of that shape reads: marked, and template processing none",
    () =>
      Effect.gen(function* marksMalformed() {
        const condition = `${processing}/qti-template-condition`;
        const cases: readonly {
          readonly element: SourceElement;
          readonly path: string;
          readonly feature: string;
        }[] = [
          {
            element: setting("qti-set-template-value", "T"),
            feature: "qti-set-template-value",
            path: `${processing}/qti-set-template-value[2]`,
          },
          {
            element: setting(
              "qti-set-template-value",
              "T",
              integerElement("1"),
              integerElement("2"),
            ),
            feature: "qti-set-template-value",
            path: `${processing}/qti-set-template-value[2]`,
          },
          {
            element: el("qti-template-constraint"),
            feature: "qti-template-constraint",
            path: `${processing}/qti-template-constraint`,
          },
          {
            element: el("qti-template-condition", [], [el("qti-template-if")]),
            feature: "qti-template-if",
            path: `${condition}/qti-template-if`,
          },
          {
            element: el(
              "qti-template-condition",
              [],
              [
                el("qti-template-if", [], [booleanElement("true")]),
                setting("qti-set-template-value", "T", integerElement("1")),
              ],
            ),
            feature: "qti-set-template-value",
            path: `${condition}/qti-set-template-value`,
          },
        ];

        for (const { element, feature, path } of cases) {
          const built = yield* buildItem(
            templated([setting("qti-set-template-value", "T", integerElement("1")), element]),
          );

          assert.deepStrictEqual(built.templateProcessing, Option.none(), path);
          assert.deepStrictEqual(
            built.unsupported,
            [...templateMarks, { feature, path, shown: "mark" }],
            path,
          );
        }
      }),
  );

  it.effect(
    "[I-5] still refuses a value outside its lexical space in template processing as value-type at its path",
    () =>
      Effect.gen(function* refusesBadValue() {
        const refusal = yield* Effect.flip(
          buildItem(templated([setting("qti-set-template-value", "T", integerElement("abc"))])),
        );

        assert.strictEqual(refusal.rule, "value-type");
        assert.deepStrictEqual(refusal.location, {
          kind: "path",
          path: `${processing}/qti-set-template-value/qti-base-value`,
        });
      }),
  );
});

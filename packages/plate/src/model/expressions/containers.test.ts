import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { attr, el, text } from "#plate/document/source.ts";
import type { SourceElement } from "#plate/document/source.ts";
import type { Expression } from "#plate/model/expression.ts";
import { buildItem } from "#plate/model/item.ts";
import { nullOf } from "#plate/model/values.ts";
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
 * The path of the rule that sets `OUT` in an item {@link outItem} builds.
 */
const setOut = `${processing}/qti-set-outcome-value`;

/**
 * The base types `qti-member` and `qti-contains` accept, as a refusal's detail words them: every
 * base type but `duration`.
 */
const notDuration = "identifier boolean integer float string point pair directedPair file uri";

/**
 * Construct an item whose processing sets the outcome `OUT` to one expression.
 *
 * @param baseType `OUT`'s base type.
 * @param cardinality `OUT`'s cardinality.
 * @param expression The expression element.
 * @param declarations The declarations beside `OUT`'s, in document order after it.
 * @returns The item document.
 */
const outItem = (
  baseType: string,
  cardinality: string,
  expression: SourceElement,
  declarations: readonly SourceElement[] = [],
) =>
  processingItem(
    [outcomeDeclaration("OUT", baseType, cardinality), ...declarations],
    [setOutcomeElement("OUT", expression)],
  );

/**
 * Construct a `qti-base-value` of an identifier.
 *
 * @param name The identifier.
 * @returns The element.
 */
const identifierElement = (name: string): SourceElement => baseValueElement("identifier", name);

/**
 * Construct an integer outcome declaration with a default value.
 *
 * @param identifier Its `identifier`.
 * @param written Its default value, as written.
 * @returns The `qti-outcome-declaration`.
 */
const integerOutcome = (identifier: string, written: string): SourceElement =>
  outcomeDeclaration(identifier, "integer", "single", [
    el("qti-default-value", [], [el("qti-value", [], [text(written)])]),
  ]);

/**
 * Construct the `qti-base-value` expression of an identifier, as the reader reads
 * {@link identifierElement}.
 *
 * @param name The identifier.
 * @returns The expression.
 */
const identifierExpression = (name: string): Expression => ({
  kind: "base-value",
  operands: [],
  value: {
    baseType: "identifier",
    cardinality: "single",
    values: [{ baseType: "identifier", value: name }],
  },
});

/**
 * Construct a value of base type identifier.
 *
 * @param cardinality Its cardinality.
 * @param names Its identifiers, in order; none for NULL.
 * @returns The value.
 */
const identifiers = (cardinality: Value["cardinality"], ...names: readonly string[]): Value => ({
  baseType: "identifier",
  cardinality,
  values: names.map((value) => ({ baseType: "identifier", value })),
});

/**
 * The single boolean value of a truth.
 *
 * @param held The truth.
 * @returns The value.
 */
const truth = (held: boolean): Value => ({
  baseType: "boolean",
  cardinality: "single",
  values: [{ baseType: "boolean", value: held }],
});

/**
 * Construct the `qti-custom-operator` an item's processing may hold, whose value plate never knows
 * (9.21).
 *
 * @returns The element.
 */
const customElement = (): SourceElement =>
  expressionElement("custom-operator", [attr("class", "x")]);

/**
 * Construct a `qti-base-value` of an integer.
 *
 * @param written The integer, as written.
 * @returns The element.
 */
const integerElement = (written: string): SourceElement => baseValueElement("integer", written);

/**
 * The declarations of the item {@link runItem} builds: a multiple identifier response `RESPONSE`,
 * the integer outcomes `i` (2) and `n` (2) the corpus's `qti-index` and `qti-repeat` name, and one
 * outcome per expression it sets.
 */
const runDeclarations: readonly SourceElement[] = [
  responseDeclaration("RESPONSE", "identifier", "multiple"),
  integerOutcome("i", "2"),
  integerOutcome("n", "2"),
  outcomeDeclaration("BUILT", "identifier", "multiple"),
  outcomeDeclaration("SEQUENCE", "identifier", "ordered"),
  outcomeDeclaration("REPEATED", "identifier", "ordered"),
  outcomeDeclaration("SIZE", "integer"),
  outcomeDeclaration("PICKED", "identifier"),
  outcomeDeclaration("CHOSEN", "identifier"),
  outcomeDeclaration("HELD", "boolean"),
  outcomeDeclaration("LEFT", "identifier", "multiple"),
  outcomeDeclaration("PART", "boolean"),
  outcomeDeclaration("EMPTY", "boolean"),
];

/**
 * An item whose processing holds every landed containers kind, reading the response and the
 * variables `i` and `n`.
 */
const runItem = processingItem(runDeclarations, [
  setOutcomeElement(
    "BUILT",
    expressionElement("multiple", [], [identifierElement("A"), variableElement("RESPONSE")]),
  ),
  setOutcomeElement(
    "SEQUENCE",
    expressionElement("ordered", [], [identifierElement("C"), identifierElement("A")]),
  ),
  setOutcomeElement(
    "REPEATED",
    expressionElement(
      "repeat",
      [attr("number-repeats", "n")],
      [identifierElement("A"), identifierElement("B")],
    ),
  ),
  setOutcomeElement("SIZE", expressionElement("container-size", [], [variableElement("RESPONSE")])),
  setOutcomeElement(
    "PICKED",
    expressionElement(
      "index",
      [attr("n", "i")],
      [expressionElement("ordered", [], [identifierElement("C"), identifierElement("D")])],
    ),
  ),
  setOutcomeElement("CHOSEN", expressionElement("random", [], [variableElement("RESPONSE")])),
  setOutcomeElement(
    "HELD",
    expressionElement("member", [], [identifierElement("B"), variableElement("RESPONSE")]),
  ),
  setOutcomeElement(
    "LEFT",
    expressionElement("delete", [], [identifierElement("B"), variableElement("RESPONSE")]),
  ),
  setOutcomeElement(
    "PART",
    expressionElement(
      "contains",
      [],
      [
        variableElement("RESPONSE"),
        expressionElement("multiple", [], [identifierElement("B"), identifierElement("B")]),
      ],
    ),
  ),
  setOutcomeElement(
    "EMPTY",
    expressionElement(
      "is-null",
      [],
      [expressionElement("delete", [], [identifierElement("Z"), variableElement("RESPONSE")])],
    ),
  ),
]);

describe("the containers family's reader specs and kind rules", () => {
  it.effect(
    "[I-9a] build an item whose inline processing holds qti-repeat, qti-index and qti-random, their operands, references and literals read, with processing some",
    () =>
      Effect.gen(function* buildsContainers() {
        const built = yield* buildItem(
          processingItem(
            [
              outcomeDeclaration("REPEATED", "identifier", "ordered"),
              outcomeDeclaration("PICKED", "identifier"),
              outcomeDeclaration("CHOSEN", "identifier"),
              integerOutcome("n", "2"),
            ],
            [
              setOutcomeElement(
                "REPEATED",
                expressionElement(
                  "repeat",
                  [attr("number-repeats", "n")],
                  [identifierElement("A"), expressionElement("ordered")],
                ),
              ),
              setOutcomeElement(
                "PICKED",
                expressionElement(
                  "index",
                  [attr("n", " 2 ")],
                  [expressionElement("multiple", [], [identifierElement("B")])],
                ),
              ),
              setOutcomeElement(
                "CHOSEN",
                expressionElement(
                  "random",
                  [],
                  [expressionElement("ordered", [], [identifierElement("C")])],
                ),
              ),
            ],
          ),
        );

        assert.deepStrictEqual(
          built.processing,
          Option.some([
            {
              expression: {
                kind: "repeat",
                numberRepeats: { _tag: "ref", identifier: "n" },
                operands: [identifierExpression("A"), { kind: "ordered", operands: [] }],
              },
              identifier: "REPEATED",
              kind: "set-outcome",
            },
            {
              expression: {
                kind: "index",
                n: { _tag: "literal", value: 2n },
                operands: [{ kind: "multiple", operands: [identifierExpression("B")] }],
              },
              identifier: "PICKED",
              kind: "set-outcome",
            },
            {
              expression: {
                kind: "random",
                operands: [{ kind: "ordered", operands: [identifierExpression("C")] }],
              },
              identifier: "CHOSEN",
              kind: "set-outcome",
            },
          ]),
        );
        assert.deepStrictEqual(built.unsupported, []);
      }),
  );

  it.effect(
    "[I-9a] run every landed containers kind in an item's processing, reading i and n as the corpus does",
    () =>
      Effect.gen(function* runsContainers() {
        assert.deepStrictEqual(refusalsOf(runItem), []);

        const after = yield* processed(runItem, {
          RESPONSE: identifiers("multiple", "B", "C", "B"),
        });
        assert.isTrue(Option.isSome(after), "the processing ran");

        const outcome = (identifier: string): Value =>
          Option.getOrThrow(
            Option.flatMapNullishOr(after, (variables) => variables.outcomes[identifier]),
          );
        const response = { baseType: "identifier", cardinality: "multiple" } as const;
        const single = { baseType: "identifier", cardinality: "single" } as const;
        const ordered = { baseType: "identifier", cardinality: "ordered" } as const;

        assert.deepStrictEqual(outcome("BUILT"), identifiers("multiple", "A", "B", "C", "B"));
        assertKindType(outcome("BUILT"), "multiple", [single, response]);
        assert.deepStrictEqual(outcome("SEQUENCE"), identifiers("ordered", "C", "A"));
        assertKindType(outcome("SEQUENCE"), "ordered", [single, single]);
        assert.deepStrictEqual(outcome("REPEATED"), identifiers("ordered", "A", "B", "A", "B"));
        assertKindType(outcome("REPEATED"), "repeat", [single, single]);
        assert.deepStrictEqual(outcome("SIZE"), {
          baseType: "integer",
          cardinality: "single",
          values: [{ baseType: "integer", value: 3n }],
        });
        assertKindType(outcome("SIZE"), "container-size", [response]);
        assert.deepStrictEqual(outcome("PICKED"), identifiers("single", "D"));
        assertKindType(outcome("PICKED"), "index", [ordered]);
        // `processed` runs under the default stream, `drawStream("", "")`, and CHOSEN takes the
        // run's first draw, 0xaa7855e1. `drawBelow` among RESPONSE's 3 members keeps its low 2
        // bits, 1, so qti-random picks the member at position 1 (from 0) of B, C, B: C.
        assert.deepStrictEqual(outcome("CHOSEN"), identifiers("single", "C"));
        assertKindType(outcome("CHOSEN"), "random", [response]);
        assert.deepStrictEqual(outcome("HELD"), truth(true));
        assertKindType(outcome("HELD"), "member", [single, response]);
        assert.deepStrictEqual(outcome("LEFT"), identifiers("multiple", "C"));
        assertKindType(outcome("LEFT"), "delete", [single, response]);
        assert.deepStrictEqual(outcome("PART"), truth(true));
        assertKindType(outcome("PART"), "contains", [response, response]);
        assert.deepStrictEqual(outcome("EMPTY"), truth(false));
      }),
  );

  it.effect(
    "[I-9a] run the containers kinds over a NULL response: container-size 0, member and contains NULL, delete and random NULL",
    () =>
      Effect.gen(function* runsOverNull() {
        const after = yield* processed(runItem, { RESPONSE: identifiers("multiple") });
        const outcome = (identifier: string): Value =>
          Option.getOrThrow(
            Option.flatMapNullishOr(after, (variables) => variables.outcomes[identifier]),
          );

        assert.deepStrictEqual(outcome("BUILT"), identifiers("multiple", "A"));
        assert.deepStrictEqual(outcome("SIZE"), {
          baseType: "integer",
          cardinality: "single",
          values: [{ baseType: "integer", value: 0n }],
        });
        assert.deepStrictEqual(outcome("HELD"), {
          baseType: "boolean",
          cardinality: "single",
          values: [],
        });
        assert.deepStrictEqual(outcome("LEFT"), identifiers("multiple"));
        assert.deepStrictEqual(outcome("CHOSEN"), identifiers("single"));
        assert.deepStrictEqual(outcome("PART"), {
          baseType: "boolean",
          cardinality: "single",
          values: [],
        });
        assert.deepStrictEqual(outcome("EMPTY"), truth(true));
      }),
  );

  it.effect(
    "[I-9a] score an item whose container holds a qti-custom-operator's untyped value beside a typed operand: the container is NULL, so the typed outcome it sets holds its NULL and score never fails (9.21, §4.5)",
    () =>
      Effect.gen(function* scoresUntypedContainers() {
        const cases: readonly (readonly [string, Value, SourceElement])[] = [
          [
            "qti-multiple, as the audit found it",
            nullOf("float", "multiple"),
            expressionElement("multiple", [], [customElement(), integerElement("1")]),
          ],
          [
            "qti-index of a qti-ordered, as the audit found it",
            nullOf("float", "single"),
            expressionElement(
              "index",
              [attr("n", "1")],
              [expressionElement("ordered", [], [customElement(), integerElement("1")])],
            ),
          ],
          [
            "qti-ordered",
            nullOf("float", "ordered"),
            expressionElement("ordered", [], [integerElement("1"), customElement()]),
          ],
          [
            "qti-repeat",
            nullOf("float", "ordered"),
            expressionElement(
              "repeat",
              [attr("number-repeats", "2")],
              [customElement(), integerElement("1")],
            ),
          ],
          [
            "qti-delete of a qti-multiple",
            nullOf("float", "multiple"),
            expressionElement(
              "delete",
              [],
              [
                integerElement("1"),
                expressionElement("multiple", [], [customElement(), integerElement("2")]),
              ],
            ),
          ],
          [
            "qti-multiple of a qti-sum",
            nullOf("float", "multiple"),
            expressionElement(
              "multiple",
              [],
              [
                expressionElement("sum", [], [customElement(), integerElement("1")]),
                integerElement("2"),
              ],
            ),
          ],
        ];

        for (const [label, unset, expression] of cases) {
          const document = outItem(unset.baseType, unset.cardinality, expression);
          const built = yield* buildItem(document);
          const ran = yield* Effect.result(processed(document, {}));

          assert.deepStrictEqual(refusalsOf(document), [], label);
          assert.deepStrictEqual(
            built.unsupported.map((mark) => mark.feature),
            ["qti-custom-operator"],
            label,
          );
          assert.isTrue(Option.isSome(built.processing), `${label}: the processing runs`);
          assert.deepStrictEqual(
            ran.pipe(
              Result.map((after) =>
                Option.flatMapNullishOr(after, (variables) => variables.outcomes["OUT"]),
              ),
            ),
            Result.succeed(Option.some(unset)),
            label,
          );
        }
      }),
  );

  it("[I-9a] refuse each operand of the containers kinds of a type the kind does not accept, the first setting the base type (expression-type, P23)", () => {
    const declarations = [
      responseDeclaration("BAG", "identifier", "multiple"),
      responseDeclaration("LIST", "identifier", "ordered"),
      responseDeclaration("WORDS", "string", "multiple"),
    ];
    const cases: readonly (readonly [
      string,
      string,
      SourceElement,
      readonly (readonly [string, string, string, string, string])[],
    ])[] = [
      [
        "identifier",
        "multiple",
        expressionElement("multiple", [], [identifierElement("A"), variableElement("LIST")]),
        [["2", "identifier", "ordered", "identifier", "single multiple"]],
      ],
      [
        "identifier",
        "multiple",
        expressionElement(
          "multiple",
          [],
          [identifierElement("A"), baseValueElement("string", "B")],
        ),
        [["2", "string", "single", "identifier", "single multiple"]],
      ],
      [
        "identifier",
        "ordered",
        expressionElement("ordered", [], [variableElement("BAG"), identifierElement("A")]),
        [["1", "identifier", "multiple", "any", "single ordered"]],
      ],
      [
        "identifier",
        "ordered",
        expressionElement(
          "repeat",
          [attr("number-repeats", "2")],
          [variableElement("LIST"), variableElement("WORDS")],
        ),
        [["2", "string", "multiple", "identifier", "single ordered"]],
      ],
      [
        "integer",
        "single",
        expressionElement("container-size", [], [identifierElement("A")]),
        [["1", "identifier", "single", "any", "multiple ordered"]],
      ],
      [
        "identifier",
        "single",
        expressionElement("index", [attr("n", "1")], [identifierElement("A")]),
        [["1", "identifier", "single", "any", "multiple ordered"]],
      ],
      [
        "identifier",
        "single",
        expressionElement("random", [], [identifierElement("A")]),
        [["1", "identifier", "single", "any", "multiple ordered"]],
      ],
      [
        "boolean",
        "single",
        expressionElement("member", [], [variableElement("BAG"), variableElement("LIST")]),
        [["1", "identifier", "multiple", notDuration, "single"]],
      ],
      [
        "boolean",
        "single",
        expressionElement("member", [], [identifierElement("A"), variableElement("WORDS")]),
        [["2", "string", "multiple", "identifier", "multiple ordered"]],
      ],
      [
        "boolean",
        "single",
        expressionElement(
          "member",
          [],
          [baseValueElement("duration", "1"), variableElement("BAG")],
        ),
        [["1", "duration", "single", notDuration, "single"]],
      ],
      [
        "identifier",
        "single",
        expressionElement("delete", [], [identifierElement("A"), identifierElement("B")]),
        [["2", "identifier", "single", "identifier", "multiple ordered"]],
      ],
      [
        "boolean",
        "single",
        expressionElement("contains", [], [variableElement("BAG"), variableElement("LIST")]),
        [["2", "identifier", "ordered", "identifier", "multiple"]],
      ],
      [
        "boolean",
        "single",
        expressionElement("contains", [], [identifierElement("A"), variableElement("WORDS")]),
        [
          ["1", "identifier", "single", notDuration, "multiple ordered"],
          ["2", "string", "multiple", "identifier", "multiple ordered"],
        ],
      ],
    ];

    for (const [baseType, cardinality, expression, mismatches] of cases) {
      assert.deepStrictEqual(
        refusalsOf(outItem(baseType, cardinality, expression, declarations)),
        mismatches.map(
          ([operand, expressionBaseType, expressionCardinality, acceptsBaseTypes, accepted]) => ({
            detail: {
              acceptsBaseTypes,
              acceptsCardinalities: accepted,
              check: "operand",
              element: expression.local,
              expressionBaseType,
              expressionCardinality,
              operand,
            },
            path: `${setOut}/${expression.local}`,
            rule: "expression-type",
          }),
        ),
        expression.local,
      );
    }
  });

  it("[I-9a] accept operands whose types the containers kinds take, a qti-delete of a duration among them as the qti package does", () => {
    const declarations = [
      responseDeclaration("BAG", "identifier", "multiple"),
      responseDeclaration("LIST", "identifier", "ordered"),
      responseDeclaration("TIMES", "duration", "multiple"),
    ];
    const cases: readonly (readonly [string, string, SourceElement])[] = [
      [
        "identifier",
        "multiple",
        expressionElement("multiple", [], [variableElement("BAG"), identifierElement("A")]),
      ],
      ["integer", "single", expressionElement("container-size", [], [variableElement("LIST")])],
      [
        "identifier",
        "single",
        expressionElement("index", [attr("n", "1")], [variableElement("BAG")]),
      ],
      ["identifier", "single", expressionElement("random", [], [variableElement("BAG")])],
      ["identifier", "single", expressionElement("random", [], [variableElement("LIST")])],
      [
        "boolean",
        "single",
        expressionElement("contains", [], [variableElement("LIST"), variableElement("LIST")]),
      ],
      [
        "boolean",
        "single",
        expressionElement(
          "is-null",
          [],
          [
            expressionElement(
              "delete",
              [],
              [baseValueElement("duration", "1"), variableElement("TIMES")],
            ),
          ],
        ),
      ],
    ];

    for (const [baseType, cardinality, expression] of cases) {
      assert.deepStrictEqual(
        refusalsOf(outItem(baseType, cardinality, expression, declarations)),
        [],
        expression.local,
      );
    }
  });

  it("[I-9a] refuse an n or a number-repeats that names a string outcome variable (expression-type, P24) or no variable (undeclared-variable, P8)", () => {
    const string = [outcomeDeclaration("WORD", "string")];
    const cases: readonly (readonly [string, string, SourceElement])[] = [
      [
        "identifier",
        "single",
        expressionElement(
          "index",
          [attr("n", "WORD")],
          [expressionElement("ordered", [], [identifierElement("A")])],
        ),
      ],
      [
        "identifier",
        "ordered",
        expressionElement("repeat", [attr("number-repeats", "WORD")], [identifierElement("A")]),
      ],
    ];

    for (const [baseType, cardinality, expression] of cases) {
      const attribute = expression.local === "qti-index" ? "n" : "number-repeats";

      assert.deepStrictEqual(
        refusalsOf(outItem(baseType, cardinality, expression, string)),
        [
          {
            detail: {
              attribute,
              check: "reference",
              element: expression.local,
              expectedBaseType: "integer",
              identifier: "WORD",
            },
            path: `${setOut}/${expression.local}`,
            rule: "expression-type",
          },
        ],
        `${expression.local} names a string variable`,
      );
      assert.deepStrictEqual(
        refusalsOf(outItem(baseType, cardinality, expression)),
        [
          {
            detail: {
              attribute,
              element: expression.local,
              expected: "variable",
              identifier: "WORD",
            },
            path: `${setOut}/${expression.local}`,
            rule: "undeclared-variable",
          },
        ],
        `${expression.local} names no variable`,
      );
    }
  });

  it.effect(
    "[I-9a] reads a qti-field-value of a record response, its field-identifier with its outer whitespace gone, and keeps the processing with no mark",
    () =>
      Effect.gen(function* readsFieldValue() {
        const built = yield* buildItem(
          outItem(
            "string",
            "single",
            expressionElement(
              "field-value",
              [attr("field-identifier", " stringValue ")],
              [variableElement("ANSWER")],
            ),
            [
              el("qti-response-declaration", [
                attr("cardinality", "record"),
                attr("identifier", "ANSWER"),
              ]),
            ],
          ),
        );

        assert.deepStrictEqual(built.unsupported, []);
        assert.deepStrictEqual(
          built.processing,
          Option.some([
            {
              expression: {
                fieldIdentifier: "stringValue",
                kind: "field-value",
                operands: [
                  {
                    identifier: "ANSWER",
                    kind: "variable",
                    operands: [],
                    weightIdentifier: Option.none(),
                  },
                ],
              },
              identifier: "OUT",
              kind: "set-outcome",
            },
          ]),
        );
      }),
  );

  it("[I-9a] refuses a qti-field-value of a single identifier at the qti-field-value, its operand not a record (P23)", () => {
    assert.deepStrictEqual(
      refusalsOf(
        outItem(
          "identifier",
          "single",
          expressionElement(
            "field-value",
            [attr("field-identifier", "f")],
            [variableElement("RESPONSE")],
          ),
          [responseDeclaration("RESPONSE", "identifier")],
        ),
      ),
      [
        {
          detail: {
            acceptsBaseTypes: "any",
            acceptsCardinalities: "record",
            check: "operand",
            element: "qti-field-value",
            expressionBaseType: "identifier",
            expressionCardinality: "single",
            operand: "1",
          },
          path: `${setOut}/qti-field-value`,
          rule: "expression-type",
        },
      ],
    );
  });
});

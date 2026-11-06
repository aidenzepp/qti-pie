import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { attr, doc, el, entity, text } from "#plate/document/source.ts";
import type { SourceAttribute, SourceChild, SourceElement } from "#plate/document/source.ts";
import { growthFactor, growthLimit, growthRatio } from "#plate/test/growth.ts";
import { checkRules } from "#plate/validate/rules.ts";
import { tables } from "#plate/validate/tables.ts";

/**
 * The location every hand-built item in these tests carries.
 */
const location = "items/rules.xml";

/**
 * Construct a hand-built item from its declarations, its body's children and what follows the body.
 *
 * @param declarations The item's declarations, in document order.
 * @param body The children of its `qti-item-body`.
 * @param after The root's children after the body, such as a `qti-response-processing`.
 * @returns The item as a source document.
 */
const item = (
  declarations: readonly SourceElement[],
  body: readonly SourceElement[],
  after: readonly SourceElement[] = [],
) =>
  doc(
    location,
    el(
      "qti-assessment-item",
      [attr("identifier", "rules"), attr("title", "Rules"), attr("time-dependent", "false")],
      [...declarations, el("qti-item-body", [], body), ...after],
    ),
  );

/**
 * Construct a response declaration.
 *
 * @param identifier Its `identifier`.
 * @param cardinality Its `cardinality`.
 * @param baseType Its `base-type`, none when absent.
 * @param children Its children, such as a `qti-correct-response` or a `qti-mapping`.
 * @returns The declaration.
 */
const response = (
  identifier: string,
  cardinality: string,
  baseType?: string,
  children: readonly SourceElement[] = [],
): SourceElement =>
  el(
    "qti-response-declaration",
    [
      attr("identifier", identifier),
      attr("cardinality", cardinality),
      ...(baseType === undefined ? [] : [attr("base-type", baseType)]),
    ],
    children,
  );

/**
 * Construct a single outcome declaration, of base type float unless another is given.
 *
 * @param identifier Its `identifier`.
 * @param baseType Its `base-type`.
 * @param children Its children, such as a `qti-default-value` or a `qti-match-table`.
 * @returns The declaration.
 */
const outcome = (
  identifier: string,
  baseType = "float",
  children: readonly SourceElement[] = [],
): SourceElement =>
  el(
    "qti-outcome-declaration",
    [attr("identifier", identifier), attr("cardinality", "single"), attr("base-type", baseType)],
    children,
  );

/**
 * Construct a value container, such as a `qti-correct-response`, holding one `qti-value` per text.
 *
 * @param local The container's local name.
 * @param written The text of each `qti-value`, as written.
 * @returns The container.
 */
const values = (local: string, ...written: readonly string[]): SourceElement =>
  el(
    local,
    [],
    written.map((value) => el("qti-value", [], [text(value)])),
  );

/**
 * Construct a `qti-mapping` with one entry per key, each mapped to 1.
 *
 * @param keys The `map-key` of each entry, as written.
 * @returns The mapping.
 */
const mapping = (...keys: readonly string[]): SourceElement =>
  el(
    "qti-mapping",
    [attr("default-value", "0")],
    keys.map((key) => el("qti-map-entry", [attr("map-key", key), attr("mapped-value", "1")])),
  );

/**
 * Construct a `qti-area-mapping` of the circle `102,113,16`, mapped to 1.
 *
 * @returns The area mapping.
 */
const areaMapping = (): SourceElement =>
  el(
    "qti-area-mapping",
    [attr("default-value", "0")],
    [
      el("qti-area-map-entry", [
        attr("coords", "102,113,16"),
        attr("mapped-value", "1"),
        attr("shape", "circle"),
      ]),
    ],
  );

/**
 * Construct a `qti-response-processing`, from a built-in template's name or from inline rules.
 *
 * @param template The template's name after the purl prefix, none for inline processing.
 * @param rules Its inline rules.
 * @returns The processing element.
 */
const processing = (template?: string, rules: readonly SourceElement[] = []): SourceElement =>
  el(
    "qti-response-processing",
    template === undefined
      ? []
      : [attr("template", `https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/${template}.xml`)],
    rules,
  );

/**
 * Construct an inline rule that sets `SCORE` to an expression.
 *
 * @param expression The expression.
 * @returns The `qti-set-outcome-value`.
 */
const setScore = (expression: SourceElement): SourceElement =>
  el("qti-set-outcome-value", [attr("identifier", "SCORE")], [expression]);

/**
 * Construct a Choice with the given choice identifiers.
 *
 * @param responseIdentifier Its `response-identifier`.
 * @param choices The identifiers of its `qti-simple-choice` children.
 * @returns The interaction.
 */
const choice = (responseIdentifier: string, choices: readonly string[] = ["A", "B"]) =>
  el(
    "qti-choice-interaction",
    [attr("response-identifier", responseIdentifier)],
    choices.map((identifier) => el("qti-simple-choice", [attr("identifier", identifier)])),
  );

/**
 * Construct an interaction with only its `response-identifier` and any further attributes.
 *
 * @param local The interaction's local name.
 * @param responseIdentifier Its `response-identifier`.
 * @param attributes Its further attributes.
 * @returns The interaction.
 */
const interaction = (
  local: string,
  responseIdentifier: string,
  attributes: readonly SourceAttribute[] = [],
): SourceElement => el(local, [attr("response-identifier", responseIdentifier), ...attributes]);

/**
 * An item whose paragraph holds an Inline Choice of two choices bound to `RESPONSE`.
 *
 * @param cardinality The declaration's cardinality.
 * @param baseType The declaration's base type.
 * @returns The item.
 */
const inlineChoiceItem = (cardinality: string, baseType: string) =>
  item(
    [response("RESPONSE", cardinality, baseType)],
    [
      el(
        "p",
        [],
        [
          el(
            "qti-inline-choice-interaction",
            [attr("response-identifier", "RESPONSE")],
            [
              el("qti-inline-choice", [attr("identifier", "A")], [text("Ant")]),
              el("qti-inline-choice", [attr("identifier", "B")], [text("Bee")]),
            ],
          ),
        ],
      ),
    ],
  );

/**
 * Construct an item whose float `SCORE` holds a match table with one entry.
 *
 * @param target The entry's `target-value`, as written.
 * @returns The item.
 */
const matchTable = (target: string) =>
  item(
    [
      outcome("SCORE", "float", [
        el(
          "qti-match-table",
          [],
          [el("qti-match-table-entry", [attr("source-value", "1"), attr("target-value", target)])],
        ),
      ]),
    ],
    [],
  );

/**
 * Construct a variable declaration of any kind, such as a template or a context declaration.
 *
 * @param local The declaration's local name, such as `qti-template-declaration`.
 * @param identifier Its `identifier`.
 * @param cardinality Its `cardinality`.
 * @param baseType Its `base-type`, none when absent.
 * @returns The declaration.
 */
const declaration = (
  local: string,
  identifier: string,
  cardinality: string,
  baseType?: string,
): SourceElement =>
  el(local, [
    attr("identifier", identifier),
    attr("cardinality", cardinality),
    ...(baseType === undefined ? [] : [attr("base-type", baseType)]),
  ]);

/**
 * Construct a `qti-base-value`.
 *
 * @param baseType Its `base-type`.
 * @param value Its text.
 * @returns The expression.
 */
const baseValue = (baseType: string, value: string): SourceElement =>
  el("qti-base-value", [attr("base-type", baseType)], [text(value)]);

/**
 * Construct an expression that reads a variable by its identifier, such as a `qti-variable`.
 *
 * @param identifier The identifier it names.
 * @param local The expression's local name.
 * @returns The expression.
 */
const variable = (identifier: string, local = "qti-variable"): SourceElement =>
  el(local, [attr("identifier", identifier)]);

/**
 * Construct a `qti-is-null` of a variable.
 *
 * @param identifier The variable's identifier.
 * @returns The expression.
 */
const isNull = (identifier: string): SourceElement => el("qti-is-null", [], [variable(identifier)]);

/**
 * Construct a `qti-equal` of its operands, in its default exact mode.
 *
 * @param operands Its operands.
 * @returns The expression.
 */
const equal = (...operands: readonly SourceElement[]): SourceElement =>
  el("qti-equal", [], operands);

/**
 * Construct a `qti-map-response-point` of a response.
 *
 * @param identifier The response's identifier.
 * @returns The expression.
 */
const mapPoint = (identifier: string): SourceElement =>
  variable(identifier, "qti-map-response-point");

/**
 * Construct a point response declaration with an area mapping.
 *
 * @param identifier Its `identifier`.
 * @param cardinality Its `cardinality`.
 * @returns The declaration.
 */
const pointResponse = (identifier: string, cardinality = "single"): SourceElement =>
  response(identifier, cardinality, "point", [areaMapping()]);

/**
 * Construct an inline rule that sets an outcome to an expression.
 *
 * @param identifier The outcome's identifier.
 * @param expression The expression.
 * @returns The `qti-set-outcome-value`.
 */
const setOutcome = (identifier: string, expression: SourceElement): SourceElement =>
  el("qti-set-outcome-value", [attr("identifier", identifier)], [expression]);

/**
 * Construct an inline rule that looks an operand up in an outcome's table.
 *
 * @param identifier The outcome's identifier.
 * @param operand The operand.
 * @returns The `qti-lookup-outcome-value`.
 */
const lookup = (identifier: string, operand: SourceElement): SourceElement =>
  el("qti-lookup-outcome-value", [attr("identifier", identifier)], [operand]);

/**
 * Construct an item whose float `SCORE` holds a lookup table with one entry, and whose inline
 * processing looks an operand up in it.
 *
 * @param table The table's local name, `qti-match-table` or `qti-interpolation-table`.
 * @param operand The lookup's operand.
 * @param declarations The item's declarations before `SCORE`, such as the response the operand
 *   reads.
 * @returns The item.
 */
const lookupItem = (
  table: string,
  operand: SourceElement,
  declarations: readonly SourceElement[] = [],
) =>
  item(
    [
      ...declarations,
      outcome("SCORE", "float", [
        el(
          table,
          [],
          [el(`${table}-entry`, [attr("source-value", "1"), attr("target-value", "1")])],
        ),
      ]),
    ],
    [],
    [processing(undefined, [lookup("SCORE", operand)])],
  );

/**
 * Construct a `qti-template-processing` holding template rules.
 *
 * @param rules Its rules.
 * @returns The processing element.
 */
const templateProcessing = (...rules: readonly SourceElement[]): SourceElement =>
  el("qti-template-processing", [], rules);

/**
 * Construct a template rule that sets a response's correct response to the identifier `A`.
 *
 * @param identifier The response it names, as written.
 * @returns The `qti-set-correct-response`.
 */
const setCorrect = (identifier: string): SourceElement =>
  el("qti-set-correct-response", [attr("identifier", identifier)], [baseValue("identifier", "A")]);

/**
 * Reduce refusals to what a test asserts: the rule, the path and the detail.
 *
 * @param source The document to check.
 * @returns One entry per refusal, in the order `checkRules` gives them.
 */
const judged = (source: ReturnType<typeof item>) =>
  checkRules(source, tables).map((refusal) => {
    assert.strictEqual(refusal.document, location);
    assert.isTrue(Option.isNone(refusal.suggestion));
    assert.isTrue(Option.isNone(refusal.readerRule));

    return {
      detail: refusal.detail,
      path: refusal.location.kind === "path" ? refusal.location.path : refusal.location.kind,
      rule: refusal.rule,
    };
  });

/**
 * Check an item whose inline processing sets its float `SCORE` to an expression.
 *
 * @param expression The expression.
 * @returns The refusals, reduced.
 */
const settingScore = (expression: SourceElement) =>
  judged(item([outcome("SCORE")], [], [processing(undefined, [setScore(expression)])]));

/**
 * Check an item whose inline processing sets its float `SCORE` from a `qti-map-response-point` of
 * `RESPONSE`.
 *
 * @param declared The `RESPONSE` declaration.
 * @returns The refusals, reduced.
 */
const mappingPoints = (declared: SourceElement) =>
  judged(
    item(
      [declared, outcome("SCORE")],
      [],
      [processing(undefined, [setScore(mapPoint("RESPONSE"))])],
    ),
  );

/**
 * Check an item whose inline processing sets the boolean `PASSED` from a `qti-equal`, beside a
 * multiple integer `RESPONSE` an operand may read.
 *
 * @param operands The `qti-equal`'s operands.
 * @returns The refusals, reduced.
 */
const comparing = (...operands: readonly SourceElement[]) =>
  judged(
    item(
      [response("RESPONSE", "multiple", "integer"), outcome("PASSED", "boolean")],
      [],
      [processing(undefined, [setOutcome("PASSED", equal(...operands))])],
    ),
  );

/**
 * The path of a `div` directly inside the body's `qti-custom-interaction`: a global QTI element
 * that the custom interaction's `lax` wildcard admits, so the structural walk checks it by its
 * table.
 */
const laxDiv = "qti-assessment-item/qti-item-body/qti-custom-interaction/div";

/**
 * Construct an item whose body holds a `qti-custom-interaction` bound to its declared
 * `RESPONSE` around the given content.
 *
 * @param declarations The declarations after `RESPONSE`'s.
 * @param content The custom interaction's children.
 * @returns The item.
 */
const inCustomInteraction = (
  declarations: readonly SourceElement[],
  content: readonly SourceChild[],
) =>
  item(
    [response("RESPONSE", "single", "identifier"), ...declarations],
    [el("qti-custom-interaction", [attr("response-identifier", "RESPONSE")], content)],
  );

describe("checkRules", () => {
  describe("undeclared-response", () => {
    it("[I-1] refuses an interaction naming RESP2 when only RESPONSE is declared", () => {
      assert.deepStrictEqual(
        judged(item([response("RESPONSE", "single", "identifier")], [choice("RESP2")])),
        [
          {
            detail: { response: "RESP2" },
            path: "qti-assessment-item/qti-item-body/qti-choice-interaction/@response-identifier",
            rule: "undeclared-response",
          },
        ],
      );
    });

    it("[I-1] accepts an interaction naming its declared RESPONSE", () => {
      assert.deepStrictEqual(
        judged(item([response("RESPONSE", "single", "identifier")], [choice("RESPONSE")])),
        [],
      );
    });

    it("[I-1] reads identifiers as NCNames, with their outer whitespace collapsed", () => {
      assert.deepStrictEqual(
        judged(item([response(" RESPONSE", "single", "identifier")], [choice("RESPONSE\n")])),
        [],
      );
    });
    it("[I-1] does not resolve a response-identifier that only an attribute wildcard admits", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [response("RESPONSE", "single", "identifier")],
            [el("p", [attr("response-identifier", "RESP2")]), choice("RESPONSE")],
          ),
        ),
        [],
      );
    });
  });

  describe("duplicate-identifier", () => {
    it("[I-1] refuses the second of two declarations named SCORE", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [response("RESPONSE", "single", "identifier"), outcome("SCORE"), outcome("SCORE")],
            [choice("RESPONSE")],
          ),
        ),
        [
          {
            detail: { identifier: "SCORE" },
            path: "qti-assessment-item/qti-outcome-declaration[2]/@identifier",
            rule: "duplicate-identifier",
          },
        ],
      );
    });

    it("[I-1] refuses a response and an outcome declaration sharing an identifier", () => {
      assert.deepStrictEqual(
        judged(item([response("SCORE", "single", "identifier"), outcome("SCORE")], [])),
        [
          {
            detail: { identifier: "SCORE" },
            path: "qti-assessment-item/qti-outcome-declaration/@identifier",
            rule: "duplicate-identifier",
          },
        ],
      );
    });

    it("[I-1] refuses the second of two choices named A", () => {
      assert.deepStrictEqual(
        judged(
          item([response("RESPONSE", "single", "identifier")], [choice("RESPONSE", ["A", "A"])]),
        ),
        [
          {
            detail: { identifier: "A" },
            path: "qti-assessment-item/qti-item-body/qti-choice-interaction/qti-simple-choice[2]/@identifier",
            rule: "duplicate-identifier",
          },
        ],
      );
    });

    it("[I-1] accepts distinct declarations, and the same choice identifier in two interactions", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [
              response("RESPONSE", "single", "identifier"),
              response("RESPONSE2", "multiple", "identifier"),
              outcome("SCORE"),
            ],
            [choice("RESPONSE", ["A", "B"]), choice("RESPONSE2", ["A", "B"])],
          ),
        ),
        [],
      );
    });
  });

  describe("binding", () => {
    it("[I-1] refuses a Choice bound to a string declaration", () => {
      assert.deepStrictEqual(
        judged(item([response("RESPONSE", "single", "string")], [choice("RESPONSE")])),
        [
          {
            detail: {
              baseType: "string",
              cardinality: "single",
              interaction: "qti-choice-interaction",
              response: "RESPONSE",
            },
            path: "qti-assessment-item/qti-item-body/qti-choice-interaction",
            rule: "binding",
          },
        ],
      );
    });

    it("[I-1] accepts a Choice bound to a multiple identifier declaration", () => {
      assert.deepStrictEqual(
        judged(item([response("RESPONSE", "multiple", "identifier")], [choice("RESPONSE")])),
        [],
      );
    });

    it("[I-1] refuses a Text Entry bound to a multiple declaration", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [response("RESPONSE", "multiple", "string")],
            [el("p", [], [interaction("qti-text-entry-interaction", "RESPONSE")])],
          ),
        ),
        [
          {
            detail: {
              baseType: "string",
              cardinality: "multiple",
              interaction: "qti-text-entry-interaction",
              response: "RESPONSE",
            },
            path: "qti-assessment-item/qti-item-body/p/qti-text-entry-interaction",
            rule: "binding",
          },
        ],
      );
    });

    it("[I-1] accepts a Text Entry bound to a record declaration, which phase 1 shows as a notice", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [response("RESPONSE", "record")],
            [el("p", [], [interaction("qti-text-entry-interaction", "RESPONSE")])],
          ),
        ),
        [],
      );
    });

    it("[Q-12] refuses an Inline Choice bound to a multiple identifier or a single string declaration", () => {
      for (const [cardinality, baseType] of [
        ["multiple", "identifier"],
        ["single", "string"],
      ] as const) {
        assert.deepStrictEqual(
          judged(inlineChoiceItem(cardinality, baseType)),
          [
            {
              detail: {
                baseType,
                cardinality,
                interaction: "qti-inline-choice-interaction",
                response: "RESPONSE",
              },
              path: "qti-assessment-item/qti-item-body/p/qti-inline-choice-interaction",
              rule: "binding",
            },
          ],
          `${cardinality} ${baseType}`,
        );
      }
    });

    it("[Q-12] accepts an Inline Choice bound to a single identifier declaration", () => {
      assert.deepStrictEqual(judged(inlineChoiceItem("single", "identifier")), []);
    });

    it("[I-1] reads the declaration the interaction names, not any declaration in the item", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [response("CHOICE", "single", "identifier"), response("TEXT", "single", "integer")],
            [choice("TEXT"), el("p", [], [interaction("qti-text-entry-interaction", "CHOICE")])],
          ),
        ),
        [
          {
            detail: {
              baseType: "integer",
              cardinality: "single",
              interaction: "qti-choice-interaction",
              response: "TEXT",
            },
            path: "qti-assessment-item/qti-item-body/qti-choice-interaction",
            rule: "binding",
          },
          {
            detail: {
              baseType: "identifier",
              cardinality: "single",
              interaction: "qti-text-entry-interaction",
              response: "CHOICE",
            },
            path: "qti-assessment-item/qti-item-body/p/qti-text-entry-interaction",
            rule: "binding",
          },
        ],
      );
    });
  });

  describe("max-strings (reading 19)", () => {
    it("[I-1] refuses an Extended Text bound to a multiple declaration without max-strings", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [response("RESPONSE", "multiple", "string")],
            [interaction("qti-extended-text-interaction", "RESPONSE")],
          ),
        ),
        [
          {
            detail: { attribute: "max-strings", element: "qti-extended-text-interaction" },
            path: "qti-assessment-item/qti-item-body/qti-extended-text-interaction",
            rule: "missing-attribute",
          },
        ],
      );
    });

    it('[I-1] accepts an Extended Text bound to a multiple declaration with max-strings="2"', () => {
      assert.deepStrictEqual(
        judged(
          item(
            [response("RESPONSE", "multiple", "string")],
            [interaction("qti-extended-text-interaction", "RESPONSE", [attr("max-strings", "2")])],
          ),
        ),
        [],
      );
    });
  });

  describe("template-requirements", () => {
    const processingPath = "qti-assessment-item/qti-response-processing";

    it("refuses match_correct when RESPONSE declares no correct response", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [response("RESPONSE", "single", "identifier"), outcome("SCORE")],
            [choice("RESPONSE")],
            [processing("match_correct")],
          ),
        ),
        [
          {
            detail: {
              child: "qti-correct-response",
              declaration: "qti-response-declaration",
              element: "qti-response-processing",
              identifier: "RESPONSE",
              template: "match_correct",
            },
            path: processingPath,
            rule: "template-requirements",
          },
        ],
      );
    });

    it("accepts match_correct with a correct response and a float SCORE", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [
              response("RESPONSE", "single", "identifier", [values("qti-correct-response", "A")]),
              outcome("SCORE"),
            ],
            [choice("RESPONSE")],
            [processing("match_correct")],
          ),
        ),
        [],
      );
    });

    it("accepts match_correct when template processing sets RESPONSE's correct response", () => {
      for (const identifier of ["RESPONSE", " RESPONSE "]) {
        assert.deepStrictEqual(
          judged(
            item(
              [
                response("RESPONSE", "single", "identifier"),
                outcome("SCORE"),
                templateProcessing(setCorrect(identifier)),
              ],
              [choice("RESPONSE")],
              [processing("match_correct")],
            ),
          ),
          [],
          JSON.stringify(identifier),
        );
      }
    });

    it("accepts match_correct when a template condition's branch sets RESPONSE's correct response", () => {
      const branch = el(
        "qti-template-condition",
        [],
        [el("qti-template-if", [], [baseValue("boolean", "true"), setCorrect("RESPONSE")])],
      );

      assert.deepStrictEqual(
        judged(
          item(
            [
              response("RESPONSE", "single", "identifier"),
              outcome("SCORE"),
              templateProcessing(branch),
            ],
            [choice("RESPONSE")],
            [processing("match_correct")],
          ),
        ),
        [],
      );
    });

    it("refuses match_correct when template processing sets another response's correct response", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [
              response("RESPONSE", "single", "identifier"),
              response("OTHER", "single", "identifier"),
              outcome("SCORE"),
              templateProcessing(setCorrect("OTHER")),
            ],
            [choice("RESPONSE")],
            [processing("match_correct")],
          ),
        ),
        [
          {
            detail: {
              child: "qti-correct-response",
              declaration: "qti-response-declaration",
              element: "qti-response-processing",
              identifier: "RESPONSE",
              template: "match_correct",
            },
            path: processingPath,
            rule: "template-requirements",
          },
        ],
      );
    });

    it("refuses map_response with no qti-mapping though template processing sets RESPONSE's correct response", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [
              response("RESPONSE", "single", "identifier"),
              outcome("SCORE"),
              templateProcessing(setCorrect("RESPONSE")),
            ],
            [choice("RESPONSE")],
            [processing("map_response")],
          ),
        ),
        [
          {
            detail: {
              child: "qti-mapping",
              declaration: "qti-response-declaration",
              element: "qti-response-processing",
              identifier: "RESPONSE",
              template: "map_response",
            },
            path: processingPath,
            rule: "template-requirements",
          },
        ],
      );
    });

    it("refuses map_response when SCORE is an integer", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [
              response("RESPONSE", "single", "identifier", [mapping("A")]),
              outcome("SCORE", "integer"),
            ],
            [choice("RESPONSE")],
            [processing("map_response")],
          ),
        ),
        [
          {
            detail: {
              baseType: "float",
              declaration: "qti-outcome-declaration",
              element: "qti-response-processing",
              identifier: "SCORE",
              template: "map_response",
            },
            path: processingPath,
            rule: "template-requirements",
          },
        ],
      );
    });

    it("accepts map_response with a mapped RESPONSE and a float SCORE", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [response("RESPONSE", "single", "identifier", [mapping("A")]), outcome("SCORE")],
            [choice("RESPONSE")],
            [processing("map_response")],
          ),
        ),
        [],
      );
    });

    it("refuses no CC2_* template whose tree needs what the item does not provide (Q6)", () => {
      const correct = values("qti-correct-response", "A");
      const cases = [
        {
          declarations: [
            response("RESPONSE", "single", "identifier", [correct]),
            outcome("SCORE"),
            outcome("MAXSCORE"),
            outcome("FEEDBACK", "identifier"),
          ],
          template: "CC2_map_response",
          unmet: "RESPONSE's qti-mapping",
        },
        {
          declarations: [
            response("RESPONSE", "single", "identifier", [correct, mapping("A")]),
            outcome("SCORE", "integer"),
            outcome("MAXSCORE"),
            outcome("FEEDBACK", "identifier"),
          ],
          template: "CC2_map_response",
          unmet: "a float SCORE",
        },
        {
          declarations: [
            response("RESPONSE", "single", "identifier", [correct]),
            outcome("SCORE", "integer"),
          ],
          template: "CC2_match",
          unmet: "a float SCORE",
        },
        {
          declarations: [
            response("RESPONSE", "single", "identifier", [correct]),
            outcome("SCORE"),
            outcome("MAXSCORE", "integer"),
            outcome("FEEDBACKBASIC", "identifier"),
          ],
          template: "CC2_match_basic",
          unmet: "a SCORE of MAXSCORE's type",
        },
      ] as const;

      for (const { declarations, template, unmet } of cases) {
        assert.deepStrictEqual(
          judged(item(declarations, [choice("RESPONSE")], [processing(template)])),
          [],
          `${template}, lacking ${unmet}`,
        );
      }
    });

    it("refuses an inline qti-map-response of a response with no qti-mapping, at its path", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [response("RESPONSE", "single", "identifier"), outcome("SCORE")],
            [choice("RESPONSE")],
            [
              processing(undefined, [
                setScore(el("qti-map-response", [attr("identifier", "RESPONSE")])),
              ]),
            ],
          ),
        ),
        [
          {
            detail: {
              child: "qti-mapping",
              declaration: "qti-response-declaration",
              element: "qti-map-response",
              identifier: "RESPONSE",
            },
            path: `${processingPath}/qti-set-outcome-value/qti-map-response`,
            rule: "template-requirements",
          },
        ],
      );
    });

    it("accepts an inline qti-map-response of a response with a qti-mapping", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [response("RESPONSE", "single", "identifier", [mapping("A")]), outcome("SCORE")],
            [choice("RESPONSE")],
            [
              processing(undefined, [
                setScore(el("qti-map-response", [attr("identifier", "RESPONSE")])),
              ]),
            ],
          ),
        ),
        [],
      );
    });

    describe("an inline qti-map-response-point", () => {
      /**
       * The refusal of an inline `qti-map-response-point` of `RESPONSE`, which is not a point
       * response holding a `qti-area-mapping`.
       */
      const pointRefused = {
        detail: {
          baseType: "point",
          child: "qti-area-mapping",
          declaration: "qti-response-declaration",
          element: "qti-map-response-point",
          identifier: "RESPONSE",
        },
        path: `${processingPath}/qti-set-outcome-value/qti-map-response-point`,
        rule: "template-requirements" as const,
      };

      it("refuses one of a point response with no qti-area-mapping, at its path", () => {
        assert.deepStrictEqual(mappingPoints(response("RESPONSE", "single", "point")), [
          pointRefused,
        ]);
      });

      it("refuses one of an identifier response, though it holds a qti-area-mapping", () => {
        assert.deepStrictEqual(
          mappingPoints(response("RESPONSE", "single", "identifier", [areaMapping()])),
          [pointRefused],
        );
      });

      it("accepts one of a multiple point response with a qti-area-mapping", () => {
        assert.deepStrictEqual(mappingPoints(pointResponse("RESPONSE", "multiple")), []);
      });
    });
  });

  describe("value-type", () => {
    const declarationPath = "qti-assessment-item/qti-response-declaration";

    it("[I-1] refuses an integer qti-value of abc at that qti-value's path", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [response("RESPONSE", "single", "integer", [values("qti-correct-response", "abc")])],
            [],
          ),
        ),
        [
          {
            detail: { baseType: "integer", lexical: "abc" },
            path: `${declarationPath}/qti-correct-response/qti-value`,
            rule: "value-type",
          },
        ],
      );
    });

    it("[I-1] accepts an integer qti-value of ' 3 ', its outer whitespace trimmed (reading 7)", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [response("RESPONSE", "single", "integer", [values("qti-correct-response", " 3 ")])],
            [],
          ),
        ),
        [],
      );
    });

    it("[I-1] refuses an identifier qti-value of 1", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [
              response("RESPONSE", "multiple", "identifier", [
                values("qti-default-value", "A", "1"),
              ]),
            ],
            [],
          ),
        ),
        [
          {
            detail: { baseType: "identifier", lexical: "1" },
            path: `${declarationPath}/qti-default-value/qti-value[2]`,
            rule: "value-type",
          },
        ],
      );
    });

    it("[I-1] accepts a point qti-value of '1 2', two integer coordinates", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [response("RESPONSE", "single", "point", [values("qti-correct-response", "1 2")])],
            [],
          ),
        ),
        [],
      );
    });

    it("[I-1] refuses a point qti-value of 102, one coordinate, at that qti-value's path", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [response("RESPONSE", "single", "point", [values("qti-correct-response", "102")])],
            [],
          ),
        ),
        [
          {
            detail: { baseType: "point", lexical: "102" },
            path: `${declarationPath}/qti-correct-response/qti-value`,
            rule: "value-type",
          },
        ],
      );
    });

    it("[I-1] does not refuse a qti-value in a record declaration", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [response("RESPONSE", "record", undefined, [values("qti-default-value", "abc")])],
            [],
          ),
        ),
        [],
      );
    });

    it("[I-1] refuses a boolean qti-value of 1 (reading 34)", () => {
      assert.deepStrictEqual(
        judged(item([outcome("PASSED", "boolean", [values("qti-default-value", "1")])], [])),
        [
          {
            detail: { baseType: "boolean", lexical: "1" },
            path: "qti-assessment-item/qti-outcome-declaration/qti-default-value/qti-value",
            rule: "value-type",
          },
        ],
      );
    });

    it("reads a qti-base-value under its own base-type", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [outcome("SCORE")],
            [],
            [
              processing(undefined, [
                setScore(el("qti-base-value", [attr("base-type", "float")], [text("one")])),
              ]),
            ],
          ),
        ),
        [
          {
            detail: { baseType: "float", lexical: "one" },
            path: "qti-assessment-item/qti-response-processing/qti-set-outcome-value/qti-base-value",
            rule: "value-type",
          },
        ],
      );
    });

    describe("a match table entry's target-value (reading 8)", () => {
      it('[I-1] accepts target-value="0.5" under a float outcome', () => {
        assert.deepStrictEqual(judged(matchTable("0.5")), []);
      });

      it('[I-1] refuses target-value="float", a base-type name, under a float outcome', () => {
        assert.deepStrictEqual(judged(matchTable("float")), [
          {
            detail: { baseType: "float", lexical: "float" },
            path: "qti-assessment-item/qti-outcome-declaration/qti-match-table/qti-match-table-entry/@target-value",
            rule: "value-type",
          },
        ]);
      });
    });

    describe("a map entry's map-key (reading 7)", () => {
      const keyPath = `${declarationPath}/qti-mapping/qti-map-entry/@map-key`;

      it('[I-1] refuses map-key="abc" under an integer response', () => {
        assert.deepStrictEqual(
          judged(item([response("RESPONSE", "single", "integer", [mapping("abc")])], [])),
          [
            {
              detail: { baseType: "integer", lexical: "abc" },
              path: keyPath,
              rule: "value-type",
            },
          ],
        );
      });

      it('[I-1] accepts map-key=" York" under a string response, its space part of the value', () => {
        assert.deepStrictEqual(
          judged(item([response("RESPONSE", "single", "string", [mapping(" York")])], [])),
          [],
        );
      });

      it('[I-1] leaves map-key=" 3" under an integer response to padded-attribute, not value-type', () => {
        assert.deepStrictEqual(
          judged(item([response("RESPONSE", "single", "integer", [mapping(" 3")])], [])),
          [],
        );
      });
    });
  });

  describe("undeclared-variable", () => {
    const rulePath = "qti-assessment-item/qti-response-processing/qti-set-outcome-value";

    it('refuses an inline qti-variable identifier="NOPE" at its path', () => {
      assert.deepStrictEqual(
        judged(item([outcome("SCORE")], [], [processing(undefined, [setScore(variable("NOPE"))])])),
        [
          {
            detail: { element: "qti-variable", expected: "variable", identifier: "NOPE" },
            path: `${rulePath}/qti-variable`,
            rule: "undeclared-variable",
          },
        ],
      );
    });

    it("accepts a qti-variable of the built-in duration and of a declared template variable", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [outcome("SCORE"), declaration("qti-template-declaration", "T", "single", "float")],
            [],
            [processing(undefined, [setScore(variable("duration")), setScore(variable("T"))])],
          ),
        ),
        [],
      );
    });

    it("accepts a qti-variable of the built-in QTI_CONTEXT and of a declared context variable", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [
              outcome("PASSED", "boolean"),
              declaration("qti-context-declaration", "CONTEXT", "single", "string"),
            ],
            [],
            [
              processing(undefined, [
                setOutcome("PASSED", isNull("QTI_CONTEXT")),
                setOutcome("PASSED", isNull("CONTEXT")),
              ]),
            ],
          ),
        ),
        [],
      );
    });

    it('refuses qti-set-outcome-value identifier="NOPE" at its path', () => {
      assert.deepStrictEqual(
        judged(
          item(
            [outcome("SCORE")],
            [],
            [processing(undefined, [setOutcome("NOPE", baseValue("float", "1"))])],
          ),
        ),
        [
          {
            detail: { element: "qti-set-outcome-value", expected: "outcome", identifier: "NOPE" },
            path: rulePath,
            rule: "undeclared-variable",
          },
        ],
      );
    });

    it("refuses a qti-correct that names an outcome, not a response", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [outcome("SCORE")],
            [],
            [processing(undefined, [setScore(variable("SCORE", "qti-correct"))])],
          ),
        ),
        [
          {
            detail: { element: "qti-correct", expected: "response", identifier: "SCORE" },
            path: `${rulePath}/qti-correct`,
            rule: "undeclared-variable",
          },
        ],
      );
    });

    /**
     * The refusal of a `qti-map-response-point` that names no response.
     *
     * @param identifier The identifier it names.
     * @returns The refusal, reduced.
     */
    const undeclaredPoint = (identifier: string) => ({
      detail: { element: "qti-map-response-point", expected: "response", identifier },
      path: `${rulePath}/qti-map-response-point`,
      rule: "undeclared-variable" as const,
    });

    describe("a qti-map-response-point", () => {
      it('refuses one of identifier="NOPE" at its path', () => {
        assert.deepStrictEqual(settingScore(mapPoint("NOPE")), [undeclaredPoint("NOPE")]);
      });

      it("refuses one that names an outcome, not a response", () => {
        assert.deepStrictEqual(settingScore(mapPoint("SCORE")), [undeclaredPoint("SCORE")]);
      });

      it("accepts one of a declared point response", () => {
        assert.deepStrictEqual(
          judged(
            item(
              [pointResponse("RESPONSE"), outcome("SCORE")],
              [],
              [processing(undefined, [setScore(mapPoint("RESPONSE"))])],
            ),
          ),
          [],
        );
      });
    });
  });

  describe("expression-type", () => {
    const rulePath = "qti-assessment-item/qti-response-processing/qti-set-outcome-value";

    /**
     * The refusal of setting the float `SCORE` from an expression of another type.
     *
     * @param baseType The expression's base type.
     * @returns The refusal, reduced.
     */
    const scoreRefused = (baseType: string) => ({
      detail: {
        element: "qti-set-outcome-value",
        expressionBaseType: baseType,
        expressionCardinality: "single",
        identifier: "SCORE",
        outcomeBaseType: "float",
        outcomeCardinality: "single",
      },
      path: rulePath,
      rule: "expression-type" as const,
    });

    it('refuses setting a float SCORE from a qti-base-value of base-type="integer"', () => {
      assert.deepStrictEqual(settingScore(baseValue("integer", "1")), [scoreRefused("integer")]);
    });

    it('accepts setting it from a qti-base-value of base-type="float"', () => {
      assert.deepStrictEqual(settingScore(baseValue("float", "1")), []);
    });

    it("refuses setting it from numAttempts, an integer", () => {
      assert.deepStrictEqual(settingScore(variable("numAttempts")), [scoreRefused("integer")]);
    });

    it("accepts setting it from duration, a float in an item (reading 29)", () => {
      assert.deepStrictEqual(settingScore(variable("duration")), []);
    });

    it("neither types nor refuses an expression that holds a qti-sum, outside the eight", () => {
      assert.deepStrictEqual(
        settingScore(el("qti-sum", [], [baseValue("integer", "1"), baseValue("integer", "2")])),
        [],
      );
    });

    describe("a qti-map-response-point, a single float", () => {
      it("accepts setting the float SCORE from one", () => {
        assert.deepStrictEqual(
          judged(
            item(
              [pointResponse("RESPONSE"), outcome("SCORE")],
              [],
              [processing(undefined, [setScore(mapPoint("RESPONSE"))])],
            ),
          ),
          [],
        );
      });

      it("refuses setting an integer outcome from one", () => {
        assert.deepStrictEqual(
          judged(
            item(
              [pointResponse("RESPONSE"), outcome("HITS", "integer")],
              [],
              [processing(undefined, [setOutcome("HITS", mapPoint("RESPONSE"))])],
            ),
          ),
          [
            {
              detail: {
                element: "qti-set-outcome-value",
                expressionBaseType: "float",
                expressionCardinality: "single",
                identifier: "HITS",
                outcomeBaseType: "integer",
                outcomeCardinality: "single",
              },
              path: rulePath,
              rule: "expression-type",
            },
          ],
        );
      });
    });

    describe("a qti-equal, a single boolean", () => {
      it("accepts setting a boolean outcome from one of an integer and a float", () => {
        assert.deepStrictEqual(
          judged(
            item(
              [outcome("PASSED", "boolean")],
              [],
              [
                processing(undefined, [
                  setOutcome("PASSED", equal(baseValue("integer", "1"), baseValue("float", "1.0"))),
                ]),
              ],
            ),
          ),
          [],
        );
      });

      it("refuses setting the float SCORE from one", () => {
        assert.deepStrictEqual(
          settingScore(equal(baseValue("integer", "1"), baseValue("float", "1.0"))),
          [scoreRefused("boolean")],
        );
      });
    });

    describe("a qti-equal operand, a single integer or float", () => {
      const equalPath = `${rulePath}/qti-equal`;

      /**
       * The refusal of a `qti-equal` operand of another type.
       *
       * @param operand The operand's position, from 1.
       * @param baseType Its base type.
       * @param cardinality Its cardinality.
       * @returns The refusal, reduced.
       */
      const operandRefused = (operand: string, baseType: string, cardinality: string) => ({
        detail: {
          element: "qti-equal",
          expressionBaseType: baseType,
          expressionCardinality: cardinality,
          operand,
        },
        path: equalPath,
        rule: "expression-type" as const,
      });

      it("refuses a string operand, at the qti-equal", () => {
        assert.deepStrictEqual(comparing(baseValue("integer", "1"), baseValue("string", "1")), [
          operandRefused("2", "string", "single"),
        ]);
      });

      it("refuses a multiple operand, at the qti-equal", () => {
        assert.deepStrictEqual(comparing(variable("RESPONSE"), baseValue("integer", "1")), [
          operandRefused("1", "integer", "multiple"),
        ]);
      });

      it("accepts an integer and a float operand", () => {
        assert.deepStrictEqual(comparing(baseValue("integer", "1"), baseValue("float", "1")), []);
      });

      it("accepts an operand that holds a qti-sum, untyped", () => {
        assert.deepStrictEqual(
          comparing(el("qti-sum", [], [baseValue("string", "1")]), baseValue("integer", "1")),
          [],
        );
      });
    });

    it("compares a record outcome by cardinality alone", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [response("RESPONSE", "record"), declaration("qti-outcome-declaration", "R", "record")],
            [],
            [
              processing(undefined, [
                setOutcome("R", variable("RESPONSE")),
                setOutcome("R", baseValue("float", "1")),
              ]),
            ],
          ),
        ),
        [
          {
            detail: {
              element: "qti-set-outcome-value",
              expressionBaseType: "float",
              expressionCardinality: "single",
              identifier: "R",
              outcomeBaseType: "",
              outcomeCardinality: "record",
            },
            path: `${rulePath}[2]`,
            rule: "expression-type",
          },
        ],
      );
    });

    describe("a lookup operand (reading 28)", () => {
      it("refuses a float operand under a match table, at the qti-lookup-outcome-value", () => {
        assert.deepStrictEqual(judged(lookupItem("qti-match-table", baseValue("float", "1.5"))), [
          {
            detail: {
              element: "qti-lookup-outcome-value",
              expressionBaseType: "float",
              expressionCardinality: "single",
              identifier: "SCORE",
              reading: "28",
              table: "qti-match-table",
            },
            path: "qti-assessment-item/qti-response-processing/qti-lookup-outcome-value",
            rule: "expression-type",
          },
        ]);
      });

      it("accepts an integer operand under a match table", () => {
        assert.deepStrictEqual(
          judged(lookupItem("qti-match-table", baseValue("integer", "1"))),
          [],
        );
      });

      it("accepts a float operand under an interpolation table", () => {
        assert.deepStrictEqual(
          judged(lookupItem("qti-interpolation-table", baseValue("float", "1.5"))),
          [],
        );
      });

      it("refuses a qti-map-response-point operand, a float, under a match table", () => {
        assert.deepStrictEqual(
          judged(lookupItem("qti-match-table", mapPoint("RESPONSE"), [pointResponse("RESPONSE")])),
          [
            {
              detail: {
                element: "qti-lookup-outcome-value",
                expressionBaseType: "float",
                expressionCardinality: "single",
                identifier: "SCORE",
                reading: "28",
                table: "qti-match-table",
              },
              path: "qti-assessment-item/qti-response-processing/qti-lookup-outcome-value",
              rule: "expression-type",
            },
          ],
        );
      });

      it("accepts a qti-map-response-point operand under an interpolation table", () => {
        assert.deepStrictEqual(
          judged(
            lookupItem("qti-interpolation-table", mapPoint("RESPONSE"), [
              pointResponse("RESPONSE"),
            ]),
          ),
          [],
        );
      });

      it("refuses a qti-equal operand, a boolean, under an interpolation table", () => {
        assert.deepStrictEqual(
          judged(
            lookupItem(
              "qti-interpolation-table",
              equal(baseValue("integer", "1"), baseValue("integer", "1")),
            ),
          ),
          [
            {
              detail: {
                element: "qti-lookup-outcome-value",
                expressionBaseType: "boolean",
                expressionCardinality: "single",
                identifier: "SCORE",
                reading: "28",
                table: "qti-interpolation-table",
              },
              path: "qti-assessment-item/qti-response-processing/qti-lookup-outcome-value",
              rule: "expression-type",
            },
          ],
        );
      });

      it("accepts an operand that holds a qti-sum, untyped", () => {
        assert.deepStrictEqual(
          judged(
            lookupItem(
              "qti-match-table",
              el("qti-sum", [], [baseValue("float", "1"), baseValue("float", "2")]),
            ),
          ),
          [],
        );
      });
    });
  });

  describe("a lookup's outcome", () => {
    const lookupPath = "qti-assessment-item/qti-response-processing/qti-lookup-outcome-value";

    it("refuses a lookup that names no outcome declaration, as undeclared-variable", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [outcome("SCORE")],
            [],
            [processing(undefined, [lookup("NOPE", baseValue("integer", "1"))])],
          ),
        ),
        [
          {
            detail: {
              element: "qti-lookup-outcome-value",
              expected: "outcome",
              identifier: "NOPE",
            },
            path: lookupPath,
            rule: "undeclared-variable",
          },
        ],
      );
    });

    it("refuses a lookup whose outcome holds no lookup table, as template-requirements", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [outcome("SCORE")],
            [],
            [processing(undefined, [lookup("SCORE", baseValue("integer", "1"))])],
          ),
        ),
        [
          {
            detail: {
              child: "qti-match-table or qti-interpolation-table",
              declaration: "qti-outcome-declaration",
              element: "qti-lookup-outcome-value",
              identifier: "SCORE",
            },
            path: lookupPath,
            rule: "template-requirements",
          },
        ],
      );
    });

    it("accepts an integer operand under an interpolation table", () => {
      assert.deepStrictEqual(
        judged(lookupItem("qti-interpolation-table", baseValue("integer", "1"))),
        [],
      );
    });

    it("accepts a lookup that names the built-in completionStatus", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [outcome("SCORE")],
            [],
            [processing(undefined, [lookup("completionStatus", baseValue("integer", "1"))])],
          ),
        ),
        [],
      );
    });
  });

  describe("lax wildcard content (reading 57)", () => {
    it("[I-1] refuses a Choice in a div in a custom interaction bound to an undeclared response", () => {
      assert.deepStrictEqual(judged(inCustomInteraction([], [el("div", [], [choice("VENDOR")])])), [
        {
          detail: { response: "VENDOR" },
          path: `${laxDiv}/qti-choice-interaction/@response-identifier`,
          rule: "undeclared-response",
        },
      ]);
    });

    it("[I-1] accepts that Choice bound to a declared response", () => {
      assert.deepStrictEqual(
        judged(
          inCustomInteraction(
            [response("VENDOR", "single", "identifier")],
            [el("div", [], [choice("VENDOR")])],
          ),
        ),
        [],
      );
    });

    it("[I-1] refuses the second of two choices named A in that Choice", () => {
      assert.deepStrictEqual(
        judged(
          inCustomInteraction(
            [response("VENDOR", "single", "identifier")],
            [el("div", [], [choice("VENDOR", ["A", "A"])])],
          ),
        ),
        [
          {
            detail: { identifier: "A" },
            path: `${laxDiv}/qti-choice-interaction/qti-simple-choice[2]/@identifier`,
            rule: "duplicate-identifier",
          },
        ],
      );
    });

    it("passes over a Choice directly in a custom interaction, which the walk does not check", () => {
      assert.deepStrictEqual(judged(inCustomInteraction([], [choice("VENDOR")])), []);
    });

    it("gives no refusal for an item whose custom interaction holds an unexpanded entity", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [response("RESPONSE", "single", "identifier")],
            [
              choice("VENDOR"),
              el(
                "qti-custom-interaction",
                [attr("response-identifier", "RESPONSE")],
                [entity("widget")],
              ),
            ],
          ),
        ),
        [],
      );
    });
  });

  describe("what the rules do not judge", () => {
    /**
     * 1EdTech's `match_correct` response-processing template, as its own document's root.
     */
    const matchCorrect = processing(undefined, [
      el(
        "qti-response-condition",
        [],
        [
          el(
            "qti-response-if",
            [],
            [
              el("qti-match", [], [variable("RESPONSE"), variable("RESPONSE", "qti-correct")]),
              setScore(baseValue("float", "1")),
            ],
          ),
          el("qti-response-else", [], [setScore(baseValue("float", "0"))]),
        ],
      ),
    ]);

    it("gives no refusal for a processing root, which phase 1 leaves unchecked", () => {
      assert.deepStrictEqual(judged(doc(location, matchCorrect)), []);
    });

    it("still refuses the same processing inside an item with no declarations", () => {
      assert.deepStrictEqual(
        judged(item([], [], [matchCorrect])).map((refused) => refused.rule),
        [
          "undeclared-variable",
          "undeclared-variable",
          "undeclared-variable",
          "undeclared-variable",
        ],
      );
    });

    it("gives no refusal for an item whose correct response holds an unexpanded entity", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [
              response("RESPONSE", "single", "identifier", [
                el("qti-correct-response", [], [el("qti-value", [], [entity("choiceA")])]),
              ]),
            ],
            [],
          ),
        ),
        [],
      );
    });

    it("gives no refusal for an item whose response-identifier holds an unexpanded entity", () => {
      assert.deepStrictEqual(
        judged(
          item([], [el("qti-choice-interaction", [attr("response-identifier", "&r;", "", ["r"])])]),
        ),
        [],
      );
    });

    it("does not read a Choice inside an element of another namespace as QTI", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [response("RESPONSE", "single", "identifier")],
            [el("widget", [], [choice("VENDOR")], "https://vendor.example/widgets")],
          ),
        ),
        [],
      );
    });

    it("still refuses the same Choice directly in the body", () => {
      assert.deepStrictEqual(
        judged(item([response("RESPONSE", "single", "identifier")], [choice("VENDOR")])),
        [
          {
            detail: { response: "VENDOR" },
            path: "qti-assessment-item/qti-item-body/qti-choice-interaction/@response-identifier",
            rule: "undeclared-response",
          },
        ],
      );
    });
  });
});

/**
 * The spaces between the two letters of the shorter identifier the growth check reads, before it
 * reads one with {@link growthFactor} times as many.
 */
const fewerSpaces = 4000;

/**
 * The growth check and its control read identifiers of 32,000 spaces three times each. A quadratic
 * read took several seconds of that, past vitest's default of 5 s, and a failing check should
 * report its ratio, not a timeout.
 */
const growthTimeoutMs = 60_000;

/**
 * Construct an identifier of two letters with a run of spaces between them, the input on which a
 * backtracking trim tries every position of the run and scans the rest of it from each.
 *
 * @param spaces The spaces between the letters.
 * @returns The identifier.
 */
const spacedIdentifier = (spaces: number): string => `a${" ".repeat(spaces)}b`;

/**
 * Construct an item whose response declaration and Choice both name an identifier.
 *
 * @param identifier The identifier.
 * @returns The item.
 */
const namingItem = (identifier: string) =>
  item([response(identifier, "single", "identifier")], [choice(identifier)]);

/**
 * The outer-whitespace pattern the rules read identifiers with before `p1-g17`: its second branch
 * matches at every position of an inner run of whitespace and fails at the letter after it, so a
 * trim with it takes time quadratic in the run.
 */
const backtrackingTrim = /^[\t\n\r ]+|[\t\n\r ]+$/gu;

describe("reading an identifier", () => {
  it.effect(
    "[I-1] reads 8 times the spaces inside an identifier in under 32 times the time",
    () =>
      Effect.gen(function* readsInLinearTime() {
        const fewer = namingItem(spacedIdentifier(fewerSpaces));
        const more = namingItem(spacedIdentifier(fewerSpaces * growthFactor));
        assert.deepStrictEqual(judged(more), []);

        const growth = yield* growthRatio(
          () => {
            checkRules(fewer, tables);
          },
          () => {
            checkRules(more, tables);
          },
        );
        assert.isBelow(
          growth,
          growthLimit,
          `8 times the spaces took ${growth.toFixed(1)} times as long`,
        );
      }),
    growthTimeoutMs,
  );

  it.effect(
    "control: a backtracking trim of the same identifiers fails the growth check",
    () =>
      Effect.gen(function* quadraticControl() {
        const fewer = spacedIdentifier(fewerSpaces);
        const more = spacedIdentifier(fewerSpaces * growthFactor);
        assert.strictEqual(fewer.replaceAll(backtrackingTrim, ""), fewer);

        const growth = yield* growthRatio(
          () => {
            fewer.replaceAll(backtrackingTrim, "");
          },
          () => {
            more.replaceAll(backtrackingTrim, "");
          },
        );
        assert.isAtLeast(
          growth,
          growthLimit,
          `8 times the spaces took ${growth.toFixed(1)} times as long`,
        );
      }),
    growthTimeoutMs,
  );
});

import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { attr, doc, el, entity, text } from "#plate/document/source.ts";
import type {
  SourceAttribute,
  SourceChild,
  SourceDocument,
  SourceElement,
} from "#plate/document/source.ts";
import { growthFactor, growthLimit, growthRatio } from "#plate/test/growth.ts";
import { singleOf } from "#plate/model/expression.ts";
import type { ExpressionType, ReferenceEntry } from "#plate/model/expression.ts";
import { checkRules, processingRefusals, referenceRefusals } from "#plate/validate/rules.ts";
import type { PrefixedTyper } from "#plate/validate/rules.ts";
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
 * Make a hand-built item time dependent: its root's `time-dependent`, `false` in every
 * {@link item}, becomes `true`, so the item has the built-in `duration` to read.
 *
 * @param source The item.
 * @returns The same item, time dependent.
 */
const timed = (source: SourceDocument): SourceDocument =>
  doc(source.location, {
    ...source.root,
    attributes: source.root.attributes.map((attribute) =>
      attribute.local === "time-dependent" ? attr("time-dependent", "true") : attribute,
    ),
  });

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
 * Construct an Inline Choice with the given choice identifiers, each choice's text its identifier.
 *
 * @param responseIdentifier Its `response-identifier`.
 * @param choices The identifiers of its `qti-inline-choice` children.
 * @returns The interaction.
 */
const inlineChoice = (responseIdentifier: string, choices: readonly string[] = ["A", "B"]) =>
  el(
    "qti-inline-choice-interaction",
    [attr("response-identifier", responseIdentifier)],
    choices.map((identifier) =>
      el("qti-inline-choice", [attr("identifier", identifier)], [text(identifier)]),
    ),
  );

/**
 * An item whose paragraph holds an Inline Choice of two choices bound to `RESPONSE`.
 *
 * @param cardinality The declaration's cardinality.
 * @param baseType The declaration's base type.
 * @returns The item.
 */
const inlineChoiceItem = (cardinality: string, baseType: string) =>
  item([response("RESPONSE", cardinality, baseType)], [el("p", [], [inlineChoice("RESPONSE")])]);

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
 * Construct a `qti-field-value` of a record operand: the last expression kind to land (M3.b-4), so
 * it stays untyped through M3.b-1 and pins what an untyped expression does.
 *
 * @param operand The record it reads a field of.
 * @returns The expression.
 */
const fieldValue = (operand: SourceElement): SourceElement =>
  el("qti-field-value", [attr("field-identifier", "score")], [operand]);

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
 * Construct a template rule that sets a template variable to an expression.
 *
 * @param identifier The template variable's identifier.
 * @param expression The expression.
 * @returns The `qti-set-template-value`.
 */
const setTemplate = (identifier: string, expression: SourceElement): SourceElement =>
  el("qti-set-template-value", [attr("identifier", identifier)], [expression]);

/**
 * Construct a `qti-is-null` of an expression, a single boolean of an operand of any type, so a
 * case can read a variable of any type into a boolean template variable.
 *
 * @param operand The expression.
 * @returns The `qti-is-null`.
 */
const nullOf = (operand: SourceElement): SourceElement => el("qti-is-null", [], [operand]);

/**
 * Construct a `qti-any-n` over one boolean operand, with its `min` and `max` as written.
 *
 * @param min Its `min`.
 * @param max Its `max`.
 * @returns The expression.
 */
const anyNOf = (min: string, max: string): SourceElement =>
  el("qti-any-n", [attr("min", min), attr("max", max)], [baseValue("boolean", "true")]);

/**
 * Construct a `qti-printed-variable`.
 *
 * @param identifier Its `identifier`, as written.
 * @param attributes Its other attributes, such as `base` and `index`, as written.
 * @returns The printed variable.
 */
const printed = (
  identifier: string,
  attributes: Readonly<Record<string, string>> = {},
): SourceElement =>
  el("qti-printed-variable", [
    attr("identifier", identifier),
    ...Object.entries(attributes).map(([local, value]) => attr(local, value)),
  ]);

/**
 * Construct the attributes that show an element when a template variable matches it.
 *
 * @param template The `template-identifier`, as written.
 * @returns Its `show-hide` and `template-identifier`.
 */
const shownBy = (template: string): readonly SourceAttribute[] => [
  attr("show-hide", "show"),
  attr("template-identifier", template),
];

/**
 * The refusal of a read template processing may not make (P26).
 *
 * @param path The reading element's path.
 * @param facts The detail's facts besides `check`: the element, the identifier, the kind of
 *   variable it names and, for a read through a reference attribute, the attribute.
 * @returns The refusal, reduced.
 */
const templateRead = (path: string, facts: Readonly<Record<string, string>>) => ({
  detail: { check: "template-read", ...facts },
  path,
  rule: "expression-type" as const,
});

/**
 * Construct a `qti-variable` weighted by `W`.
 *
 * @param identifier The variable it reads.
 * @returns The expression.
 */
const weighted = (identifier: string): SourceElement =>
  el("qti-variable", [attr("identifier", identifier), attr("weight-identifier", "W")]);

/**
 * The refusal of a weighted `qti-variable` that a rule holds as its expression (reading 23).
 *
 * @param rulePath The rule's path.
 * @returns The refusal, reduced.
 */
const weightPlaced = (rulePath: string) => ({
  detail: { attribute: "weight-identifier", element: "qti-variable", reading: "23" },
  path: `${rulePath}/qti-variable/@weight-identifier`,
  rule: "expression-placement" as const,
});

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
 * Construct an item, not time dependent, whose inline processing sets one outcome to an expression.
 *
 * @param declarations The item's declarations.
 * @param target The identifier of the outcome the processing sets.
 * @param expression The expression.
 * @returns The item.
 */
const settingOutcome = (
  declarations: readonly SourceElement[],
  target: string,
  expression: SourceElement,
) => item(declarations, [], [processing(undefined, [setOutcome(target, expression)])]);

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
 * Construct a branch of a response condition: its condition, then a rule that sets the
 * float `SCORE`.
 *
 * @param local The branch's local name, `qti-response-if` or `qti-response-else-if`.
 * @param condition Its condition.
 * @returns The branch.
 */
const responseBranch = (local: string, condition: SourceElement): SourceElement =>
  el(local, [], [condition, setScore(baseValue("float", "1"))]);

/**
 * Check an item whose inline processing holds one `qti-response-condition`, beside a single
 * identifier `RESPONSE` a condition may read and a float `SCORE` each branch sets.
 *
 * @param branches The condition's branches, in document order.
 * @returns The refusals, reduced.
 */
const branching = (...branches: readonly SourceElement[]) =>
  judged(
    item(
      [response("RESPONSE", "single", "identifier"), outcome("SCORE")],
      [],
      [processing(undefined, [el("qti-response-condition", [], branches)])],
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

    it("[Q-12] refuses the second of two inline choices named A", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [response("RESPONSE", "single", "identifier")],
            [el("p", [], [inlineChoice("RESPONSE", ["A", "B", "A"])])],
          ),
        ),
        [
          {
            detail: { identifier: "A" },
            path: "qti-assessment-item/qti-item-body/p/qti-inline-choice-interaction/qti-inline-choice[3]/@identifier",
            rule: "duplicate-identifier",
          },
        ],
      );
    });

    it("[Q-12] accepts the same inline choice identifier in two Inline Choices", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [
              response("RESPONSE", "single", "identifier"),
              response("RESPONSE2", "single", "identifier"),
            ],
            [el("p", [], [inlineChoice("RESPONSE"), inlineChoice("RESPONSE2")])],
          ),
        ),
        [],
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

    it("refuses map_response when SCORE is a record, which has no float base type", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [
              response("RESPONSE", "single", "identifier", [mapping("A")]),
              declaration("qti-outcome-declaration", "SCORE", "record"),
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
            declaration("qti-outcome-declaration", "SCORE", "record"),
            outcome("MAXSCORE"),
            outcome("FEEDBACK", "identifier"),
          ],
          template: "CC2_map_response",
          unmet: "a float SCORE",
        },
        {
          declarations: [
            response("RESPONSE", "single", "identifier", [correct]),
            declaration("qti-outcome-declaration", "SCORE", "record"),
          ],
          template: "CC2_match",
          unmet: "a float SCORE",
        },
        {
          declarations: [
            response("RESPONSE", "single", "identifier", [correct]),
            outcome("SCORE"),
            declaration("qti-outcome-declaration", "MAXSCORE", "record"),
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

    it("[I-9a] accepts a qti-variable of the built-in duration in a time-dependent item and of a declared template variable, and refuses the duration in an item that is not (item-duration)", () => {
      const reading = item(
        [outcome("SCORE"), declaration("qti-template-declaration", "T", "single", "float")],
        [],
        [processing(undefined, [setScore(variable("duration")), setScore(variable("T"))])],
      );

      assert.deepStrictEqual(
        [judged(timed(reading)), judged(reading)],
        [
          [],
          [
            {
              detail: {
                check: "untimed-duration",
                element: "qti-variable",
                identifier: "duration",
              },
              path: `${rulePath}[1]/qti-variable`,
              rule: "undeclared-variable",
            },
          ],
        ],
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

    describe("the built-in duration, which only a time-dependent item has (item-duration)", () => {
      /**
       * A `qti-any-n` whose `min` names `duration`, a reference attribute of base type integer,
       * over one boolean operand.
       */
      const anyN = el(
        "qti-any-n",
        [attr("min", "duration"), attr("max", "1")],
        [baseValue("boolean", "true")],
      );

      /**
       * The refusal of a `qti-variable` that reads `duration` in an item that is not time
       * dependent.
       */
      const untimedRead = {
        detail: { check: "untimed-duration", element: "qti-variable", identifier: "duration" },
        path: `${rulePath}/qti-variable`,
        rule: "undeclared-variable" as const,
      };

      /**
       * The refusal of {@link anyN}'s `min`, which names `duration`, in an item that is not time
       * dependent.
       */
      const untimedNamed = {
        detail: {
          attribute: "min",
          check: "untimed-duration",
          element: "qti-any-n",
          identifier: "duration",
        },
        path: `${rulePath}/qti-any-n`,
        rule: "undeclared-variable" as const,
      };

      /**
       * The refusal of {@link anyN}'s `min`, which names a built-in, no template or outcome variable
       * (P24), whether the item is time dependent or not.
       */
      const builtInNamed = {
        detail: {
          attribute: "min",
          check: "reference",
          element: "qti-any-n",
          expectedBaseType: "integer",
          identifier: "duration",
        },
        path: `${rulePath}/qti-any-n`,
        rule: "expression-type" as const,
      };

      it("[I-9a] refuses a qti-variable of duration in an item that is not time dependent (item-duration)", () => {
        assert.deepStrictEqual(
          judged(settingOutcome([outcome("SCORE")], "SCORE", variable("duration"))),
          [untimedRead],
        );
      });

      it("[I-9a] refuses qti-any-n's min naming duration in an item that is not time dependent, and as no template or outcome variable (item-duration, P24)", () => {
        assert.deepStrictEqual(
          judged(settingOutcome([outcome("PASSED", "boolean")], "PASSED", anyN)),
          [untimedNamed, builtInNamed],
        );
      });

      it("[I-9a] accepts a qti-variable of duration in a time-dependent item", () => {
        assert.deepStrictEqual(
          judged(timed(settingOutcome([outcome("SCORE")], "SCORE", variable("duration")))),
          [],
        );
      });

      it("[I-9a] refuses qti-any-n's min naming duration in a time-dependent item only as no template or outcome variable (P24)", () => {
        assert.deepStrictEqual(
          judged(timed(settingOutcome([outcome("PASSED", "boolean")], "PASSED", anyN))),
          [builtInNamed],
        );
      });

      it("[I-9a] accepts a declared outcome named duration, read by a qti-variable and by qti-any-n's min, in an item timed or not", () => {
        const declared = item(
          [
            outcome("duration", "integer"),
            outcome("HITS", "integer"),
            outcome("PASSED", "boolean"),
          ],
          [],
          [
            processing(undefined, [
              setOutcome("HITS", variable("duration")),
              setOutcome("PASSED", anyN),
            ]),
          ],
        );

        assert.deepStrictEqual([judged(timed(declared)), judged(declared)], [[], []]);
      });
    });
  });

  describe("expression-placement (reading 23)", () => {
    it("[I-9a] refuses a weighted variable in an item's response processing as expression-placement at its weight-identifier, and accepts it unweighted (pantry P12, VariableWeightInTest)", () => {
      const declared = [outcome("SCORE"), outcome("W")];

      assert.deepStrictEqual(
        [
          judged(settingOutcome(declared, "SCORE", weighted("W"))),
          judged(settingOutcome(declared, "SCORE", variable("W"))),
        ],
        [[weightPlaced("qti-assessment-item/qti-response-processing/qti-set-outcome-value")], []],
      );
    });

    it("[I-9a] refuses a weighted variable in an item's template processing the same way (pantry P12)", () => {
      const declared = [declaration("qti-template-declaration", "F", "single", "float")];

      assert.deepStrictEqual(
        [
          judged(item(declared, [], [templateProcessing(setTemplate("F", weighted("F")))])),
          judged(item(declared, [], [templateProcessing(setTemplate("F", variable("F")))])),
        ],
        [[weightPlaced("qti-assessment-item/qti-template-processing/qti-set-template-value")], []],
      );
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

    it("[I-9a] accepts setting it from duration, a float in a time-dependent item (reading 29), and refuses no type in an item that is not, only the read (item-duration)", () => {
      const setting = item(
        [outcome("SCORE")],
        [],
        [processing(undefined, [setScore(variable("duration"))])],
      );

      assert.deepStrictEqual(
        [judged(timed(setting)), judged(setting)],
        [
          [],
          [
            {
              detail: {
                check: "untimed-duration",
                element: "qti-variable",
                identifier: "duration",
              },
              path: `${rulePath}/qti-variable`,
              rule: "undeclared-variable",
            },
          ],
        ],
      );
    });

    it("neither types nor refuses an expression that holds a qti-field-value, not yet landed", () => {
      assert.deepStrictEqual(settingScore(fieldValue(variable("QTI_CONTEXT"))), []);
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
          acceptsBaseTypes: "integer float",
          acceptsCardinalities: "single",
          check: "operand",
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

      it("accepts an operand that holds a qti-field-value, untyped", () => {
        assert.deepStrictEqual(
          comparing(fieldValue(variable("QTI_CONTEXT")), baseValue("integer", "1")),
          [],
        );
      });

      it("refuses only the string operand beside an untyped one (ruling R3)", () => {
        assert.deepStrictEqual(
          judged(
            item(
              [outcome("LABEL", "string"), outcome("PASSED", "boolean")],
              [],
              [
                processing(undefined, [
                  setOutcome(
                    "PASSED",
                    equal(fieldValue(variable("QTI_CONTEXT")), variable("LABEL")),
                  ),
                ]),
              ],
            ),
          ),
          [operandRefused("2", "string", "single")],
        );
      });

      it("[I-5] refuses a string operand in template processing too (P23)", () => {
        assert.deepStrictEqual(
          judged(
            item(
              [
                declaration("qti-template-declaration", "SAME", "single", "boolean"),
                templateProcessing(
                  el(
                    "qti-set-template-value",
                    [attr("identifier", "SAME")],
                    [equal(baseValue("integer", "1"), baseValue("string", "1"))],
                  ),
                ),
              ],
              [],
            ),
          ),
          [
            {
              ...operandRefused("2", "string", "single"),
              path: "qti-assessment-item/qti-template-processing/qti-set-template-value/qti-equal",
            },
          ],
        );
      });
    });

    it("does not type a qti-match that holds an untyped operand (ruling R3)", () => {
      assert.deepStrictEqual(
        settingScore(
          el("qti-match", [], [fieldValue(variable("QTI_CONTEXT")), baseValue("string", "a")]),
        ),
        [],
      );
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

      it("accepts an operand that holds a qti-field-value, untyped", () => {
        assert.deepStrictEqual(
          judged(lookupItem("qti-match-table", fieldValue(variable("QTI_CONTEXT")))),
          [],
        );
      });
    });

    describe("a response condition (P21)", () => {
      const conditionPath = "qti-assessment-item/qti-response-processing/qti-response-condition";

      /**
       * A single boolean condition: `RESPONSE` matches the identifier `A`.
       */
      const matching = el("qti-match", [], [variable("RESPONSE"), baseValue("identifier", "A")]);

      /**
       * The refusal of a branch whose condition is a single value of another base type.
       *
       * @param local The branch's local name.
       * @param baseType The condition's base type.
       * @returns The refusal, reduced.
       */
      const conditionRefused = (local: string, baseType: string) => ({
        detail: {
          check: "condition",
          element: local,
          expressionBaseType: baseType,
          expressionCardinality: "single",
        },
        path: `${conditionPath}/${local}`,
        rule: "expression-type" as const,
      });

      it('[I-9a] refuses a qti-response-if whose condition is a qti-base-value of base-type="integer" (P21)', () => {
        assert.deepStrictEqual(
          branching(responseBranch("qti-response-if", baseValue("integer", "1"))),
          [conditionRefused("qti-response-if", "integer")],
        );
      });

      it('[I-9a] refuses a qti-response-else-if whose condition is a qti-base-value of base-type="integer" (P21)', () => {
        assert.deepStrictEqual(
          branching(
            responseBranch("qti-response-if", matching),
            responseBranch("qti-response-else-if", baseValue("integer", "1")),
          ),
          [conditionRefused("qti-response-else-if", "integer")],
        );
      });

      it("[I-9a] accepts a qti-match condition, a single boolean (P21)", () => {
        assert.deepStrictEqual(
          branching(
            responseBranch("qti-response-if", matching),
            responseBranch("qti-response-else-if", matching),
          ),
          [],
        );
      });

      it("[I-9a] accepts a condition that holds a kind not yet landed, untyped (P21, ruling R3)", () => {
        assert.deepStrictEqual(
          branching(responseBranch("qti-response-if", fieldValue(variable("QTI_CONTEXT")))),
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

    it("[I-9a] refuses a lookup that targets the built-in completionStatus, which only a qti-set-outcome-value sets, as undeclared-variable (pantry P9, info.txt:8488)", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [outcome("SCORE")],
            [],
            [processing(undefined, [lookup("completionStatus", baseValue("integer", "1"))])],
          ),
        ),
        [
          {
            detail: {
              check: "built-in-target",
              element: "qti-lookup-outcome-value",
              identifier: "completionStatus",
              source: "info.txt:8488",
            },
            path: "qti-assessment-item/qti-response-processing/qti-lookup-outcome-value",
            rule: "undeclared-variable",
          },
        ],
      );
      assert.deepStrictEqual(
        judged(
          item(
            [outcome("SCORE")],
            [],
            [
              processing(undefined, [
                setOutcome("completionStatus", baseValue("identifier", "completed")),
              ]),
            ],
          ),
        ),
        [],
      );
    });
  });

  describe("template processing", () => {
    const rulePath = "qti-assessment-item/qti-template-processing/qti-set-template-value";

    /**
     * The declarations every case below may read or set: a single identifier `RESPONSE` with a
     * mapping, a single point `POINT` with an area mapping, a float `SCORE` and an integer `COUNT`
     * outcome, the template variables `B` (single boolean), `N` (single integer), `F` (single
     * float) and `M` (multiple integer), and the string context variable `CONTEXT`.
     */
    const declared = [
      declaration("qti-context-declaration", "CONTEXT", "single", "string"),
      response("RESPONSE", "single", "identifier", [mapping("A")]),
      pointResponse("POINT"),
      outcome("SCORE"),
      outcome("COUNT", "integer"),
      declaration("qti-template-declaration", "B", "single", "boolean"),
      declaration("qti-template-declaration", "N", "single", "integer"),
      declaration("qti-template-declaration", "F", "single", "float"),
      declaration("qti-template-declaration", "M", "multiple", "integer"),
    ];

    /**
     * Check an item with {@link declared}'s declarations whose template processing holds the given
     * rules.
     *
     * @param rules The template rules, in document order.
     * @returns The refusals, reduced.
     */
    const templated = (...rules: readonly SourceElement[]) =>
      judged(item([...declared, templateProcessing(...rules)], []));

    it("[I-5] refuses a qti-map-response of a response in a template rule (P26)", () => {
      assert.deepStrictEqual(
        templated(setTemplate("F", variable("RESPONSE", "qti-map-response"))),
        [
          templateRead(`${rulePath}/qti-map-response`, {
            element: "qti-map-response",
            identifier: "RESPONSE",
            variableKind: "response",
          }),
        ],
      );
    });

    it("[I-5] refuses qti-any-n's max naming an outcome in a template rule (P26)", () => {
      assert.deepStrictEqual(templated(setTemplate("B", anyNOf("1", "COUNT"))), [
        templateRead(`${rulePath}/qti-any-n`, {
          attribute: "max",
          element: "qti-any-n",
          identifier: "COUNT",
          variableKind: "outcome",
        }),
      ]);
    });

    it("[I-5] refuses a qti-variable, a qti-correct and a qti-default naming a response, an outcome or numAttempts in a template rule, as P26 alone", () => {
      const reads = [
        ["RESPONSE", "response"],
        ["SCORE", "outcome"],
        ["numAttempts", "built-in"],
      ] as const;
      for (const local of ["qti-variable", "qti-correct", "qti-default"]) {
        for (const [identifier, variableKind] of reads) {
          assert.deepStrictEqual(
            templated(setTemplate("B", nullOf(variable(identifier, local)))),
            [
              templateRead(`${rulePath}/qti-is-null/${local}`, {
                element: local,
                identifier,
                variableKind,
              }),
            ],
            `${local} of ${identifier}`,
          );
        }
      }
    });

    it("[I-5] refuses a qti-map-response-point of a mapped response in a template rule as P26, not P27", () => {
      assert.deepStrictEqual(templated(setTemplate("F", mapPoint("POINT"))), [
        templateRead(`${rulePath}/qti-map-response-point`, {
          element: "qti-map-response-point",
          identifier: "POINT",
          variableKind: "response",
        }),
      ]);
    });

    it("[I-5] refuses qti-any-n's min and qti-repeat's number-repeats naming a response in a template rule as P26, not P24", () => {
      const repeat = el(
        "qti-repeat",
        [attr("number-repeats", "RESPONSE")],
        [baseValue("integer", "1")],
      );

      assert.deepStrictEqual(
        templated(setTemplate("B", anyNOf("RESPONSE", "1")), setTemplate("B", nullOf(repeat))),
        [
          templateRead(`${rulePath}[1]/qti-any-n`, {
            attribute: "min",
            element: "qti-any-n",
            identifier: "RESPONSE",
            variableKind: "response",
          }),
          templateRead(`${rulePath}[2]/qti-is-null/qti-repeat`, {
            attribute: "number-repeats",
            element: "qti-repeat",
            identifier: "RESPONSE",
            variableKind: "response",
          }),
        ],
      );
    });

    it("[I-5] refuses qti-any-n's min naming a float or a multiple template variable where a single integer is needed (P24)", () => {
      assert.deepStrictEqual(
        templated(setTemplate("B", anyNOf("F", "1")), setTemplate("B", anyNOf("M", "1"))),
        ["F", "M"].map((identifier, index) => ({
          detail: {
            attribute: "min",
            check: "reference",
            element: "qti-any-n",
            expectedBaseType: "integer",
            identifier,
          },
          path: `${rulePath}[${index + 1}]/qti-any-n`,
          rule: "expression-type",
        })),
      );
    });

    it("[I-5] refuses qti-any-n's min and a qti-variable naming nothing in a template rule (P8)", () => {
      assert.deepStrictEqual(
        templated(
          setTemplate("B", anyNOf("NOPE", "1")),
          setTemplate("B", nullOf(variable("NOPE"))),
        ),
        [
          {
            detail: {
              attribute: "min",
              element: "qti-any-n",
              expected: "variable",
              identifier: "NOPE",
            },
            path: `${rulePath}[1]/qti-any-n`,
            rule: "undeclared-variable",
          },
          {
            detail: { element: "qti-variable", expected: "variable", identifier: "NOPE" },
            path: `${rulePath}[2]/qti-is-null/qti-variable`,
            rule: "undeclared-variable",
          },
        ],
      );
    });

    it("[I-5] refuses a qti-set-template-value, a qti-set-correct-response and a qti-set-default-value whose expression is not their variable's type, with the variable's kind (P20)", () => {
      const processingPath = "qti-assessment-item/qti-template-processing";

      assert.deepStrictEqual(
        templated(
          setTemplate("N", baseValue("float", "1.5")),
          el(
            "qti-set-correct-response",
            [attr("identifier", "RESPONSE")],
            [baseValue("integer", "1")],
          ),
          el("qti-set-default-value", [attr("identifier", "SCORE")], [baseValue("integer", "1")]),
        ),
        (
          [
            ["qti-set-template-value", "N", "float", "integer", "template"],
            ["qti-set-correct-response", "RESPONSE", "integer", "identifier", "response"],
            ["qti-set-default-value", "SCORE", "integer", "float", "outcome"],
          ] as const
        ).map(([element, identifier, expressionBaseType, outcomeBaseType, targetKind]) => ({
          detail: {
            element,
            expressionBaseType,
            expressionCardinality: "single",
            identifier,
            outcomeBaseType,
            outcomeCardinality: "single",
            targetKind,
          },
          path: `${processingPath}/${element}`,
          rule: "expression-type",
        })),
      );
    });

    it("[I-5] refuses a qti-set-template-value naming nothing, a response or a built-in, a qti-set-correct-response naming an outcome and a qti-set-default-value naming a template variable (pantry P8, DeclaredRefKind)", () => {
      const processingPath = "qti-assessment-item/qti-template-processing";

      assert.deepStrictEqual(
        templated(
          setTemplate("NOPE", baseValue("integer", "1")),
          setTemplate("RESPONSE", baseValue("identifier", "A")),
          setTemplate("numAttempts", baseValue("integer", "1")),
          el("qti-set-correct-response", [attr("identifier", "SCORE")], [baseValue("float", "1")]),
          el("qti-set-default-value", [attr("identifier", "N")], [baseValue("integer", "1")]),
        ),
        (
          [
            ["qti-set-template-value[1]", "qti-set-template-value", "NOPE", "template"],
            ["qti-set-template-value[2]", "qti-set-template-value", "RESPONSE", "template"],
            ["qti-set-template-value[3]", "qti-set-template-value", "numAttempts", "template"],
            ["qti-set-correct-response", "qti-set-correct-response", "SCORE", "response"],
            ["qti-set-default-value", "qti-set-default-value", "N", "response outcome"],
          ] as const
        ).map(([step, element, identifier, expected]) => ({
          detail: { element, expected, identifier },
          path: `${processingPath}/${step}`,
          rule: "undeclared-variable",
        })),
      );
    });

    it("[I-5] accepts a qti-set-template-value of a template variable, a qti-set-correct-response of a response and a qti-set-default-value of a response and of an outcome", () => {
      assert.deepStrictEqual(
        templated(
          setTemplate("N", baseValue("integer", "1")),
          setCorrect("RESPONSE"),
          el(
            "qti-set-default-value",
            [attr("identifier", "RESPONSE")],
            [baseValue("identifier", "A")],
          ),
          el("qti-set-default-value", [attr("identifier", "SCORE")], [baseValue("float", "1")]),
        ),
        [],
      );
    });

    it("[I-5] refuses a template condition's branches and a template constraint over a value that is not a single boolean (P21)", () => {
      const processingPath = "qti-assessment-item/qti-template-processing";
      const condition = el(
        "qti-template-condition",
        [],
        [
          el(
            "qti-template-if",
            [],
            [baseValue("integer", "1"), setTemplate("N", baseValue("integer", "1"))],
          ),
          el(
            "qti-template-else-if",
            [],
            [variable("F"), setTemplate("N", baseValue("integer", "2"))],
          ),
        ],
      );

      assert.deepStrictEqual(
        templated(condition, el("qti-template-constraint", [], [variable("M")])),
        (
          [
            ["qti-template-condition/", "qti-template-if", "integer", "single"],
            ["qti-template-condition/", "qti-template-else-if", "float", "single"],
            ["", "qti-template-constraint", "integer", "multiple"],
          ] as const
        ).map(([within, element, expressionBaseType, expressionCardinality]) => ({
          detail: {
            check: "condition",
            element,
            expressionBaseType,
            expressionCardinality,
          },
          path: `${processingPath}/${within}${element}`,
          rule: "expression-type",
        })),
      );
    });

    it("[I-5] accepts template rules that read a template variable, QTI_CONTEXT, a declared context variable and a template variable's default", () => {
      assert.deepStrictEqual(
        templated(
          setTemplate("N", variable("N")),
          setTemplate("B", anyNOf("N", "N")),
          setTemplate("B", nullOf(variable("QTI_CONTEXT"))),
          setTemplate("B", nullOf(variable("CONTEXT"))),
          setTemplate("F", variable("F", "qti-default")),
          el("qti-template-constraint", [], [variable("B")]),
          setCorrect("RESPONSE"),
        ),
        [],
      );
    });
  });

  describe("a printed variable's references (pantry printed-variable-ref, R37 and R39)", () => {
    const bodyPath = "qti-assessment-item/qti-item-body/p";

    /**
     * The declarations every case below may name: a single identifier `RESPONSE`, the string
     * context variable `CONTEXT`, a float `SCORE` and an integer `COUNT` outcome, and the template
     * variables `N` (single integer), `F` (single float) and `M` (multiple integer).
     */
    const declared = [
      declaration("qti-context-declaration", "CONTEXT", "single", "string"),
      response("RESPONSE", "single", "identifier"),
      outcome("SCORE"),
      outcome("COUNT", "integer"),
      declaration("qti-template-declaration", "N", "single", "integer"),
      declaration("qti-template-declaration", "F", "single", "float"),
      declaration("qti-template-declaration", "M", "multiple", "integer"),
    ];

    /**
     * Check an item with {@link declared}'s declarations whose body holds one paragraph of the
     * given printed variables.
     *
     * @param variables The printed variables, in document order.
     * @returns The refusals, reduced.
     */
    const printing = (...variables: readonly SourceElement[]) =>
      judged(item(declared, [el("p", [], variables)]));

    it("[I-5] refuses a printed variable whose identifier, base or index names nothing the item declares or builds in, at that attribute (pantry printed-variable-ref)", () => {
      assert.deepStrictEqual(
        printing(
          printed("NOPE"),
          printed("SCORE", { base: "RADIX" }),
          printed("M", { index: "POSITION" }),
        ),
        (
          [
            ["1", "identifier", "NOPE"],
            ["2", "base", "RADIX"],
            ["3", "index", "POSITION"],
          ] as const
        ).map(([position, attribute, identifier]) => ({
          detail: {
            attribute,
            element: "qti-printed-variable",
            expected: "outcome template",
            identifier,
          },
          path: `${bodyPath}/qti-printed-variable[${position}]/@${attribute}`,
          rule: "undeclared-variable",
        })),
      );
    });

    it("[I-5] refuses a printed variable whose identifier names a response or a context variable, the built-ins numAttempts, duration and QTI_CONTEXT among them, with its kind and no base type (pantry printed-variable-ref, PrintedVariableRefKind; Mind amendment 1)", () => {
      assert.deepStrictEqual(
        printing(
          printed("RESPONSE"),
          printed("CONTEXT"),
          printed("numAttempts"),
          printed("duration"),
          printed("QTI_CONTEXT"),
        ),
        (
          [
            ["1", "RESPONSE", "response"],
            ["2", "CONTEXT", "context"],
            ["3", "numAttempts", "response"],
            ["4", "duration", "response"],
            ["5", "QTI_CONTEXT", "context"],
          ] as const
        ).map(([position, identifier, variableKind]) => ({
          detail: {
            attribute: "identifier",
            check: "reference",
            element: "qti-printed-variable",
            identifier,
            source: "info.txt:70296",
            variableKind,
          },
          path: `${bodyPath}/qti-printed-variable[${position}]/@identifier`,
          rule: "expression-type",
        })),
      );
    });

    it("[I-5] refuses a printed variable's index naming a float or the built-in response numAttempts, and its base naming a multiple integer, a response or the built-in identifier completionStatus, where a single integer outcome or template variable is needed (pantry printed-variable-ref, PrintedVariableVarRefType; Mind amendment 1)", () => {
      assert.deepStrictEqual(
        printing(
          printed("M", { index: "F" }),
          printed("SCORE", { base: "M" }),
          printed("COUNT", { base: "RESPONSE" }),
          printed("M", { index: "numAttempts" }),
          printed("COUNT", { base: "completionStatus" }),
        ),
        (
          [
            ["1", "index", "F"],
            ["2", "base", "M"],
            ["3", "base", "RESPONSE"],
            ["4", "index", "numAttempts"],
            ["5", "base", "completionStatus"],
          ] as const
        ).map(([position, attribute, identifier]) => ({
          detail: {
            attribute,
            check: "reference",
            element: "qti-printed-variable",
            expectedBaseType: "integer",
            identifier,
          },
          path: `${bodyPath}/qti-printed-variable[${position}]/@${attribute}`,
          rule: "expression-type",
        })),
      );
    });

    it("[I-5] accepts a printed variable of an outcome or a template variable of any type, the built-in outcome completionStatus among them, a base or index naming a single integer outcome or template variable, and a base or index written as an integer (Mind amendment 1)", () => {
      assert.deepStrictEqual(
        printing(
          printed("SCORE", { format: "%.1f" }),
          printed("completionStatus"),
          printed("F"),
          printed(" M "),
          printed("M", { index: "N" }),
          printed("COUNT", { base: "COUNT", format: "%i" }),
          printed("N", { base: " 16 ", format: "%i" }),
          printed("M", { index: "-1" }),
        ),
        [],
      );
    });

    it("[I-5] does not judge a printed variable in a stimulus, which declares no variable", () => {
      assert.deepStrictEqual(
        checkRules(
          doc(
            location,
            el(
              "qti-assessment-stimulus",
              [attr("identifier", "stimulus"), attr("title", "Stimulus")],
              [el("qti-stimulus-body", [], [el("p", [], [printed("NOPE")])])],
            ),
          ),
          tables,
        ),
        [],
      );
    });
  });

  describe("a template-identifier (pantry template-ref: TemplateContentRefType and ChoiceTemplateRefType; OD-P8-11, OD-P8-19)", () => {
    const bodyPath = "qti-assessment-item/qti-item-body";

    /**
     * The declarations every case below may name: the responses its interactions bind, a float
     * `SCORE` outcome, and the template variables `SHOWN` (single identifier), `PICKS` (multiple
     * identifier) and `F` (single float).
     */
    const declared = [
      response("RESPONSE", "multiple", "identifier"),
      response("INLINE", "single", "identifier"),
      response("GAPS", "multiple", "directedPair"),
      response("HOT", "multiple", "identifier"),
      outcome("SCORE"),
      declaration("qti-template-declaration", "SHOWN", "single", "identifier"),
      declaration("qti-template-declaration", "PICKS", "multiple", "identifier"),
      declaration("qti-template-declaration", "F", "single", "float"),
    ];

    /**
     * Check an item with {@link declared}'s declarations whose body holds every kind of element
     * below, each naming the same template variable: a simple choice, an inline choice, a template
     * inline, a template block, a template block in a rubric block, a gap text and a hottext.
     *
     * @param template The `template-identifier` each element carries, as written.
     * @returns The refusals, reduced.
     */
    const naming = (template: string) =>
      judged(
        item(declared, [
          el(
            "qti-choice-interaction",
            [attr("response-identifier", "RESPONSE")],
            [el("qti-simple-choice", [attr("identifier", "A"), ...shownBy(template)], [text("A")])],
          ),
          el(
            "p",
            [],
            [
              el(
                "qti-inline-choice-interaction",
                [attr("response-identifier", "INLINE")],
                [
                  el(
                    "qti-inline-choice",
                    [attr("identifier", "B"), ...shownBy(template)],
                    [text("B")],
                  ),
                ],
              ),
              el(
                "qti-template-inline",
                [attr("identifier", "TI"), ...shownBy(template)],
                [text("inline")],
              ),
            ],
          ),
          el(
            "qti-template-block",
            [attr("identifier", "TB"), ...shownBy(template)],
            [el("qti-content-body", [], [el("p", [], [text("block")])])],
          ),
          el(
            "qti-rubric-block",
            [attr("view", "candidate")],
            [
              el(
                "qti-content-body",
                [],
                [
                  el(
                    "qti-template-block",
                    [attr("identifier", "TR"), ...shownBy(template)],
                    [el("qti-content-body", [], [el("p", [], [text("rubric")])])],
                  ),
                ],
              ),
            ],
          ),
          el(
            "qti-gap-match-interaction",
            [attr("response-identifier", "GAPS")],
            [
              el(
                "qti-gap-text",
                [attr("identifier", "G"), attr("match-max", "1"), ...shownBy(template)],
                [text("gap")],
              ),
              el("p", [], [el("qti-gap", [attr("identifier", "GAP")])]),
            ],
          ),
          el(
            "qti-hottext-interaction",
            [attr("response-identifier", "HOT")],
            [
              el(
                "p",
                [],
                [el("qti-hottext", [attr("identifier", "H"), ...shownBy(template)], [text("hot")])],
              ),
            ],
          ),
        ]),
      );

    /**
     * Each element {@link naming} names a template variable on, in document order: its path under
     * the body, its local name and the line of QTI's information model that types its
     * `template-identifier`.
     */
    const named = [
      ["qti-choice-interaction/qti-simple-choice", "qti-simple-choice", "info.txt:42466"],
      ["p/qti-inline-choice-interaction/qti-inline-choice", "qti-inline-choice", "info.txt:31973"],
      ["p/qti-template-inline", "qti-template-inline", "info.txt:46462"],
      ["qti-template-block", "qti-template-block", "info.txt:45053"],
      [
        "qti-rubric-block/qti-content-body/qti-template-block",
        "qti-template-block",
        "info.txt:45053",
      ],
      ["qti-gap-match-interaction/qti-gap-text", "qti-gap-text", "info.txt:28161"],
      ["qti-hottext-interaction/p/qti-hottext", "qti-hottext", "info.txt:30039"],
    ] as const;

    it("[I-5] refuses a choice, a template inline and a template block, in a rubric block too, whose template-identifier names nothing the item declares, at that attribute (pantry template-ref; OD-P8-11)", () => {
      assert.deepStrictEqual(
        naming("NOPE"),
        named.map(([path, element]) => ({
          detail: {
            attribute: "template-identifier",
            element,
            expected: "template",
            identifier: "NOPE",
          },
          path: `${bodyPath}/${path}/@template-identifier`,
          rule: "undeclared-variable",
        })),
      );
    });

    it("[I-5] refuses each of them naming a float template variable or an outcome, where an identifier template variable, single or multiple, is needed; a simple choice too, which the qti package does not check (pantry TemplateContentRefType and ChoiceTemplateRefType; OD-P8-11, OD-P8-19, G-R2, pending)", () => {
      for (const identifier of ["F", "SCORE"]) {
        assert.deepStrictEqual(
          naming(identifier),
          named.map(([path, element, line]) => ({
            detail: {
              attribute: "template-identifier",
              check: "reference",
              element,
              expectedBaseType: "identifier",
              expectedCardinalities: "single multiple",
              identifier,
              source: line,
            },
            path: `${bodyPath}/${path}/@template-identifier`,
            rule: "expression-type",
          })),
          identifier,
        );
      }
    });

    it("[I-5] accepts each of them naming an identifier template variable of single or of multiple cardinality, as written with outer whitespace", () => {
      for (const identifier of ["SHOWN", "PICKS", " SHOWN "]) {
        assert.deepStrictEqual(naming(identifier), [], identifier);
      }
    });

    it("[I-5] does not judge a template block in a stimulus, which declares no variable", () => {
      assert.deepStrictEqual(
        checkRules(
          doc(
            location,
            el(
              "qti-assessment-stimulus",
              [attr("identifier", "stimulus"), attr("title", "Stimulus")],
              [
                el(
                  "qti-stimulus-body",
                  [],
                  [
                    el(
                      "qti-template-block",
                      [attr("identifier", "TB"), ...shownBy("NOPE")],
                      [el("qti-content-body", [], [el("p", [], [text("block")])])],
                    ),
                  ],
                ),
              ],
            ),
          ),
          tables,
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
 * A reference facet built for the producer's tests, by element: no landed kind declares a
 * reference attribute yet, so each family's own entries arrive with its slice.
 */
const referenceFacets = {
  "qti-equal": [
    { attribute: "tolerance", baseType: "float", checked: false, field: "tolerance", list: true },
  ],
  "qti-pattern-match": [
    { attribute: "pattern", baseType: "string", checked: true, field: "pattern", list: false },
  ],
  "qti-round-to": [
    { attribute: "figures", baseType: "integer", checked: true, field: "figures", list: false },
  ],
} as const satisfies Record<string, readonly ReferenceEntry[]>;

/**
 * The declarations a reference attribute in the producer's tests may name, by identifier: a single
 * integer response, a single string and a single integer outcome, and a single integer template
 * variable.
 */
const referenced: ReadonlyMap<string, SourceElement> = new Map([
  ["RESPONSE", response("RESPONSE", "single", "integer")],
  ["LABEL", outcome("LABEL", "string")],
  ["COUNT", outcome("COUNT", "integer")],
  ["T", declaration("qti-template-declaration", "T", "single", "integer")],
]);

/**
 * The path of the expression the producer's tests judge.
 */
const referringPath =
  "qti-assessment-item/qti-response-processing/qti-set-outcome-value/expression";

/**
 * Judge one reference attribute of an expression with the test's reference facet, beside the
 * declarations {@link referenced} lists.
 *
 * @param local The expression's local name, which picks its facet entries.
 * @param attribute The attribute's name.
 * @param value The attribute's value, as written.
 * @returns The refusals, reduced to their rule and detail, each at the expression's path.
 */
const referring = (local: keyof typeof referenceFacets, attribute: string, value: string) =>
  referenceRefusals(
    item([...referenced.values()], []),
    { element: el(local, [attr(attribute, value)]), parent: Option.none(), path: referringPath },
    referenceFacets[local],
    referenced,
  ).map((refusal) => {
    assert.deepStrictEqual(refusal.location, { kind: "path", path: referringPath });

    return { detail: refusal.detail, rule: refusal.rule };
  });

/**
 * The refusal of a reference attribute that names no variable (P8).
 *
 * @param attribute The attribute.
 * @param identifier The name it holds.
 * @returns The refusal, reduced.
 */
const undeclared = (attribute: string, identifier: string) => ({
  detail: { attribute, element: "qti-round-to", expected: "variable", identifier },
  rule: "undeclared-variable" as const,
});

/**
 * The refusal of a reference attribute that names a variable of another kind or type (P24).
 *
 * @param element The expression's local name.
 * @param attribute The attribute.
 * @param expectedBaseType The base type the attribute holds.
 * @param identifier The name it holds.
 * @returns The refusal, reduced.
 */
const mistyped = (
  element: string,
  attribute: string,
  expectedBaseType: string,
  identifier: string,
) => ({
  detail: { attribute, check: "reference", element, expectedBaseType, identifier },
  rule: "expression-type" as const,
});

describe("referenceRefusals", () => {
  it("[I-9a] gives nothing for a literal", () => {
    assert.deepStrictEqual(referring("qti-round-to", "figures", "3"), []);
  });

  it("[I-9a] refuses a name no variable has as undeclared-variable, with the attribute (P8)", () => {
    assert.deepStrictEqual(referring("qti-round-to", "figures", "NOPE"), [
      undeclared("figures", "NOPE"),
    ]);
  });

  it("[I-9a] reads INF in an integer attribute as a name, refused when it names nothing (P8, ruling R4)", () => {
    assert.deepStrictEqual(referring("qti-round-to", "figures", "INF"), [
      undeclared("figures", "INF"),
    ]);
  });

  it("[I-9a] refuses a string outcome named for an integer attribute (P24)", () => {
    assert.deepStrictEqual(referring("qti-round-to", "figures", "LABEL"), [
      mistyped("qti-round-to", "figures", "integer", "LABEL"),
    ]);
  });

  it("[I-9a] refuses a response variable named for an integer attribute (P24)", () => {
    assert.deepStrictEqual(referring("qti-round-to", "figures", "RESPONSE"), [
      mistyped("qti-round-to", "figures", "integer", "RESPONSE"),
    ]);
  });

  it("[I-9a] gives nothing for an integer outcome or an integer template variable", () => {
    assert.deepStrictEqual(
      [referring("qti-round-to", "figures", "COUNT"), referring("qti-round-to", "figures", "T")],
      [[], []],
    );
  });

  it("[I-9a] gives nothing for an unchecked attribute that names nothing", () => {
    assert.deepStrictEqual(referring("qti-equal", "tolerance", "NOPE 0.1"), []);
  });

  it("[I-9a] reads a braced name that names nothing as literal text (ruling R1)", () => {
    assert.deepStrictEqual(referring("qti-pattern-match", "pattern", "{NOPE}"), []);
  });

  it("[I-9a] refuses a braced name in a string attribute that names a response (P24)", () => {
    assert.deepStrictEqual(referring("qti-pattern-match", "pattern", "{RESPONSE}"), [
      mistyped("qti-pattern-match", "pattern", "string", "RESPONSE"),
    ]);
  });
});

/**
 * The location of the hand-built test {@link scoringTest} builds.
 */
const testLocation = "tests/rules.xml";

/**
 * Construct a hand-built test with declarations, one part, one section and the item ref `ITEM1`,
 * whose outcome processing holds the given rules.
 *
 * @param declarations The test's declarations, in document order.
 * @param rules The rules of its `qti-outcome-processing`.
 * @returns The test as a source document.
 */
const ruledTest = (
  declarations: readonly SourceElement[],
  rules: readonly SourceElement[],
): SourceDocument =>
  doc(
    testLocation,
    el(
      "qti-assessment-test",
      [attr("identifier", "T"), attr("title", "Test")],
      [
        ...declarations,
        el(
          "qti-test-part",
          [
            attr("identifier", "P"),
            attr("navigation-mode", "linear"),
            attr("submission-mode", "individual"),
          ],
          [
            el(
              "qti-assessment-section",
              [attr("identifier", "S"), attr("title", "S"), attr("visible", "true")],
              [
                el("qti-assessment-item-ref", [
                  attr("href", "items/ITEM1.xml"),
                  attr("identifier", "ITEM1"),
                ]),
              ],
            ),
          ],
        ),
        el("qti-outcome-processing", [], rules),
      ],
    ),
  );

/**
 * Construct a hand-built test with a float `SCORE`, one part, one section and the item ref
 * `ITEM1`, whose outcome processing sets `SCORE` to an expression.
 *
 * @param expression The expression.
 * @returns The test as a source document.
 */
const scoringTest = (expression: SourceElement): SourceDocument =>
  ruledTest([outcome("SCORE")], [setScore(expression)]);

/**
 * The path of a rule of a {@link ruledTest}'s outcome processing.
 *
 * @param local The rule's local name.
 * @returns Its path, as a refusal's location writes it.
 */
const outcomeRulePath = (local: string): string =>
  `qti-assessment-test/qti-outcome-processing/${local}`;

/**
 * Construct a typer that gives one prefixed read a type and every other name `unknown`.
 *
 * @param name The prefixed read it types.
 * @param baseType The base type it gives that read, single.
 * @returns The typer.
 */
const typing =
  (name: string, baseType: "float" | "integer" | "string"): PrefixedTyper =>
  (read) =>
    read === name ? singleOf(baseType) : { baseType: "unknown", cardinality: "unknown" };

/**
 * The typer a test checked alone passes: every prefixed read `unknown`, which satisfies every rule.
 *
 * @returns The type `unknown`.
 */
const unknownTyping: PrefixedTyper = () => ({ baseType: "unknown", cardinality: "unknown" });

/**
 * Check a test with {@link processingRefusals} under a typer.
 *
 * @param source The test.
 * @param typePrefixed The typer of its prefixed reads.
 * @param templateDefaultType The typer of its template defaults' targets, none for every default
 *   unless given.
 * @param reaching For a section, the test it is judged under, none unless given.
 * @returns The refusals, reduced to their rule, path and detail.
 */
const processed = (
  source: SourceDocument,
  typePrefixed: PrefixedTyper,
  templateDefaultType?: (templateDefault: SourceElement) => Option.Option<ExpressionType>,
  reaching?: SourceDocument,
) =>
  processingRefusals(
    source,
    tables,
    typePrefixed,
    templateDefaultType,
    Option.fromUndefinedOr(reaching),
  ).map((refusal) => ({
    detail: refusal.detail,
    path: refusal.location.kind === "path" ? refusal.location.path : refusal.location.kind,
    rule: refusal.rule,
  }));

/**
 * Construct a hand-built section document `S` with the item ref `ITEM1`, whose pre-condition is an
 * expression.
 *
 * @param condition The pre-condition's expression.
 * @returns The section as a source document.
 */
const conditionedSection = (condition: SourceElement): SourceDocument =>
  doc(
    "tests/section.xml",
    el(
      "qti-assessment-section",
      [attr("identifier", "S"), attr("title", "S"), attr("visible", "true")],
      [
        el("qti-pre-condition", [], [condition]),
        el("qti-assessment-item-ref", [
          attr("href", "items/ITEM1.xml"),
          attr("identifier", "ITEM1"),
        ]),
      ],
    ),
  );

/**
 * Construct a `qti-gt` of a variable over the float 1, whose operands must each be a single integer
 * or float.
 *
 * @param identifier The variable's name.
 * @returns The expression.
 */
const greaterThanOne = (identifier: string): SourceElement =>
  el("qti-gt", [], [variable(identifier), baseValue("float", "1")]);

/**
 * Construct a {@link scoringTest} that sets `SCORE` to itself rounded to `ITEM1.N` decimal places,
 * a prefixed read in a reference attribute.
 *
 * @returns The test.
 */
const roundedByItem = (): SourceDocument =>
  scoringTest(
    el(
      "qti-round-to",
      [attr("figures", "ITEM1.N"), attr("rounding-mode", "decimalPlaces")],
      [variable("SCORE")],
    ),
  );

/**
 * A template default of `ITEM1`'s template variable `T` to the string `x`.
 */
const stringDefault = el(
  "qti-template-default",
  [attr("template-identifier", "T")],
  [baseValue("string", "x")],
);

/**
 * A hand-built test with a float `SCORE`, one part, one section and the item ref `ITEM1`, which
 * holds {@link stringDefault}.
 */
const defaultingTest = doc(
  testLocation,
  el(
    "qti-assessment-test",
    [attr("identifier", "T"), attr("title", "Test")],
    [
      outcome("SCORE"),
      el(
        "qti-test-part",
        [
          attr("identifier", "P"),
          attr("navigation-mode", "linear"),
          attr("submission-mode", "individual"),
        ],
        [
          el(
            "qti-assessment-section",
            [attr("identifier", "S"), attr("title", "S"), attr("visible", "true")],
            [
              el(
                "qti-assessment-item-ref",
                [attr("href", "items/ITEM1.xml"), attr("identifier", "ITEM1")],
                [stringDefault],
              ),
            ],
          ),
        ],
      ),
    ],
  ),
);

/**
 * Construct a typer of template defaults' targets that gives {@link stringDefault}'s a single type.
 *
 * @param baseType The base type it gives that target.
 * @returns The typer.
 */
const defaultTyping =
  (baseType: "integer" | "string") =>
  (templateDefault: SourceElement): Option.Option<ExpressionType> =>
    templateDefault === stringDefault ? Option.some(singleOf(baseType)) : Option.none();

/**
 * Check a {@link ruledTest} whose outcome processing sets `SCORE` to an expression that names a
 * test outcome, under a typer that types the name a float, as a package would type a prefixed read.
 *
 * @param identifier The outcome's identifier, which the test declares.
 * @param local The naming expression's local name, such as `qti-map-response`.
 * @returns The refusals.
 */
const namingResponse = (identifier: string, local: string) =>
  processed(
    ruledTest([outcome("SCORE"), outcome(identifier)], [setScore(variable(identifier, local))]),
    typing(identifier, "float"),
  );

/**
 * The refusal of a {@link namingResponse} test: its expression names no response.
 *
 * @param identifier The name the expression gives.
 * @param local The expression's local name.
 * @returns The one refusal, reduced as {@link processed} reduces it.
 */
const noResponse = (identifier: string, local: string) => [
  {
    detail: { element: local, expected: "response", identifier },
    path: `${outcomeRulePath("qti-set-outcome-value")}/${local}`,
    rule: "undeclared-variable",
  },
];

/**
 * Check a {@link ruledTest} that declares a context variable and sets it with a
 * `qti-set-outcome-value`, under a typer that types the name a float.
 *
 * @param identifier The context variable's identifier.
 * @returns The refusals.
 */
const settingContext = (identifier: string) =>
  processed(
    ruledTest(
      [declaration("qti-context-declaration", identifier, "single", "float"), outcome("SCORE")],
      [setOutcome(identifier, baseValue("float", "1"))],
    ),
    typing(identifier, "float"),
  );

/**
 * Check a {@link ruledTest} that declares the float outcome `A.B` whole and sets `SCORE` to its
 * `qti-variable` and to its `qti-default`.
 *
 * @param typePrefixed The typer of its prefixed reads.
 * @returns The refusals.
 */
const readingWhole = (typePrefixed: PrefixedTyper) =>
  processed(
    ruledTest(
      [outcome("SCORE"), outcome("A.B")],
      [setScore(variable("A.B")), setScore(variable("A.B", "qti-default"))],
    ),
    typePrefixed,
  );

/**
 * Check a {@link ruledTest} that looks `I1.SCORE`, a prefixed read, up with an operand.
 *
 * @param operand The lookup's operand.
 * @param typePrefixed The typer of its prefixed reads, every one `unknown` unless given.
 * @returns The refusals.
 */
const lookingUpDotted = (operand: SourceElement, typePrefixed: PrefixedTyper = unknownTyping) =>
  processed(ruledTest([outcome("SCORE")], [lookup("I1.SCORE", operand)]), typePrefixed);

/**
 * Check a {@link ruledTest} that sets a boolean `PASSED` to a `qti-pattern-match` of a string.
 *
 * @param pattern The match's `pattern`.
 * @param typePrefixed The typer of its prefixed reads.
 * @returns The refusals.
 */
const matchingPattern = (pattern: string, typePrefixed: PrefixedTyper) =>
  processed(
    ruledTest(
      [outcome("PASSED", "boolean")],
      [
        setOutcome(
          "PASSED",
          el("qti-pattern-match", [attr("pattern", pattern)], [baseValue("string", "x")]),
        ),
      ],
    ),
    typePrefixed,
  );

describe("processingRefusals", () => {
  it("[T-9] judges a template default against the template variable it sets where the caller types it, and judges none it is not given (pantry P20, templateOf)", () => {
    assert.deepStrictEqual(
      [
        processed(defaultingTest, unknownTyping, defaultTyping("integer")),
        processed(defaultingTest, unknownTyping, defaultTyping("string")),
        processed(defaultingTest, unknownTyping),
      ],
      [
        [
          {
            detail: {
              element: "qti-template-default",
              expressionBaseType: "string",
              expressionCardinality: "single",
              identifier: "T",
              outcomeBaseType: "integer",
              outcomeCardinality: "single",
              targetKind: "template",
            },
            path: "qti-assessment-test/qti-test-part/qti-assessment-section/qti-assessment-item-ref/qti-template-default",
            rule: "expression-type",
          },
        ],
        [],
        [],
      ],
    );
  });

  it("[T-9] types a prefixed read with the typer it is given, so a string ITEM1.SCORE cannot set a float SCORE (pantry P20)", () => {
    assert.deepStrictEqual(
      [
        processed(scoringTest(variable("ITEM1.SCORE")), typing("ITEM1.SCORE", "string")),
        processed(scoringTest(variable("ITEM1.SCORE")), typing("ITEM1.SCORE", "float")),
      ],
      [
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
            path: "qti-assessment-test/qti-outcome-processing/qti-set-outcome-value",
            rule: "expression-type",
          },
        ],
        [],
      ],
    );
  });

  it("[T-9] judges a prefixed name in a reference attribute by the type the typer gives it (pantry P24)", () => {
    assert.deepStrictEqual(
      [
        processed(roundedByItem(), typing("ITEM1.N", "string")),
        processed(roundedByItem(), typing("ITEM1.N", "integer")),
      ],
      [
        [
          {
            detail: {
              attribute: "figures",
              check: "reference",
              element: "qti-round-to",
              expectedBaseType: "integer",
              identifier: "ITEM1.N",
            },
            path: "qti-assessment-test/qti-outcome-processing/qti-set-outcome-value/qti-round-to",
            rule: "expression-type",
          },
        ],
        [],
      ],
    );
  });

  it("[T-9] gives nothing for an item, whose processing checkRules judges, and checkRules nothing for a test", () => {
    const undeclaredItem = item(
      [outcome("SCORE")],
      [],
      [processing(undefined, [setScore(variable("NOPE"))])],
    );
    const undeclaredTest = scoringTest(variable("NOPE"));

    assert.deepStrictEqual(
      [
        processingRefusals(undeclaredItem, tables, typing("NOPE", "float")).length,
        checkRules(undeclaredItem, tables).map((refusal) => refusal.rule),
        checkRules(undeclaredTest, tables).length,
        processingRefusals(undeclaredTest, tables, typing("NOPE", "float")).map(
          (refusal) => refusal.rule,
        ),
      ],
      [0, ["undeclared-variable"], 0, ["undeclared-variable"]],
    );
  });

  it("[T-9] refuses an unprefixed map-response in a test, which names a test outcome and no response, as undeclared-variable expecting a response, and accepts a prefixed one in a test alone (pantry P27)", () => {
    const rulePath = "qti-assessment-test/qti-outcome-processing/qti-set-outcome-value";

    assert.deepStrictEqual(
      [
        processed(scoringTest(variable("SCORE", "qti-map-response")), unknownTyping),
        processed(scoringTest(mapPoint("SCORE")), unknownTyping),
        processed(scoringTest(variable("ITEM1.RESPONSE", "qti-map-response")), unknownTyping),
      ],
      [
        [
          {
            detail: { element: "qti-map-response", expected: "response", identifier: "SCORE" },
            path: `${rulePath}/qti-map-response`,
            rule: "undeclared-variable",
          },
        ],
        [
          {
            detail: {
              element: "qti-map-response-point",
              expected: "response",
              identifier: "SCORE",
            },
            path: `${rulePath}/qti-map-response-point`,
            rule: "undeclared-variable",
          },
        ],
        [],
      ],
    );
  });

  it("[T-9] judges a section document under a test that reaches it when given one: NOPE refused as undeclared-variable, a prefixed read by the reaching test's typer, the test's SCORE accepted, and with none every name unknown, as the section alone", () => {
    const reaching = scoringTest(baseValue("float", "1"));
    const conditionPath = "qti-assessment-section/qti-pre-condition";

    assert.deepStrictEqual(
      [
        processed(conditionedSection(variable("NOPE")), unknownTyping, undefined, reaching),
        processed(
          conditionedSection(greaterThanOne("ITEM1.STR")),
          typing("ITEM1.STR", "string"),
          undefined,
          reaching,
        ),
        processed(conditionedSection(greaterThanOne("SCORE")), unknownTyping, undefined, reaching),
        processed(conditionedSection(variable("NOPE")), unknownTyping),
        processed(conditionedSection(greaterThanOne("ITEM1.STR")), typing("ITEM1.STR", "string")),
      ],
      [
        [
          {
            detail: { element: "qti-variable", expected: "variable", identifier: "NOPE" },
            path: `${conditionPath}/qti-variable`,
            rule: "undeclared-variable",
          },
        ],
        [
          {
            detail: {
              acceptsBaseTypes: "integer float",
              acceptsCardinalities: "single",
              check: "operand",
              element: "qti-gt",
              expressionBaseType: "string",
              expressionCardinality: "single",
              operand: "1",
            },
            path: `${conditionPath}/qti-gt`,
            rule: "expression-type",
          },
        ],
        [],
        [],
        [],
      ],
    );
  });

  it("[T-9] refuses a qti-base-value in a test's outcome processing or a section's pre-condition whose text is outside its base type as value-type, and accepts one inside it (pantry P7)", () => {
    const section = (written: string): SourceDocument =>
      doc(
        "tests/section.xml",
        el(
          "qti-assessment-section",
          [attr("identifier", "S"), attr("title", "S"), attr("visible", "true")],
          [
            el("qti-pre-condition", [], [baseValue("boolean", written)]),
            el("qti-assessment-item-ref", [
              attr("href", "items/ITEM1.xml"),
              attr("identifier", "ITEM1"),
            ]),
          ],
        ),
      );

    assert.deepStrictEqual(
      [
        processed(scoringTest(baseValue("float", "abc")), unknownTyping),
        processed(section("maybe"), unknownTyping),
        processed(scoringTest(baseValue("float", "1.5")), unknownTyping),
        processed(section("true"), unknownTyping),
      ],
      [
        [
          {
            detail: { baseType: "float", lexical: "abc" },
            path: "qti-assessment-test/qti-outcome-processing/qti-set-outcome-value/qti-base-value",
            rule: "value-type",
          },
        ],
        [
          {
            detail: { baseType: "boolean", lexical: "maybe" },
            path: "qti-assessment-section/qti-pre-condition/qti-base-value",
            rule: "value-type",
          },
        ],
        [],
        [],
      ],
    );
  });

  it("[T-9] leaves an item's run unchanged: a dotted name the item does not declare stays undeclared-variable (reading 37)", () => {
    assert.deepStrictEqual(settingScore(variable("ITEM1.SCORE")), [
      {
        detail: { element: "qti-variable", expected: "variable", identifier: "ITEM1.SCORE" },
        path: "qti-assessment-item/qti-response-processing/qti-set-outcome-value/qti-variable",
        rule: "undeclared-variable",
      },
    ]);
  });

  it("[T-9] refuses a qti-map-response or a qti-correct of a dotted outcome the test declares whole, a whole name of another kind, as undeclared-variable expecting a response, as their undotted forms are (reading 37; pantry P8, P27)", () => {
    assert.deepStrictEqual(
      [
        namingResponse("A.B", "qti-map-response"),
        namingResponse("A.B", "qti-correct"),
        namingResponse("A", "qti-map-response"),
        namingResponse("A", "qti-correct"),
      ],
      [
        noResponse("A.B", "qti-map-response"),
        noResponse("A.B", "qti-correct"),
        noResponse("A", "qti-map-response"),
        noResponse("A", "qti-correct"),
      ],
    );
  });

  it("[T-9] refuses a qti-set-outcome-value of a dotted context variable the test declares whole, a whole name of another kind, as undeclared-variable expecting an outcome, as its undotted form is (reading 37; pantry P8)", () => {
    assert.deepStrictEqual(
      [settingContext("C.X"), settingContext("C")],
      ["C.X", "C"].map((identifier) => [
        {
          detail: { element: "qti-set-outcome-value", expected: "outcome", identifier },
          path: outcomeRulePath("qti-set-outcome-value"),
          rule: "undeclared-variable",
        },
      ]),
    );
  });

  it("[T-9] reads a whole name of another kind's own declaration where any variable may be named: a qti-variable and a qti-default of A.B are accepted, typed by A.B's declaration and not by the typer (reading 37)", () => {
    assert.deepStrictEqual(
      [readingWhole(unknownTyping), readingWhole(typing("A.B", "string"))],
      [[], []],
    );
  });

  it("[T-9] refuses the lookup operand of a dotted target the typer answers when it is not a single integer, float or duration, with no table (reading 28; pantry P22, checkLookup)", () => {
    assert.deepStrictEqual(
      [
        lookingUpDotted(baseValue("string", "x")),
        lookingUpDotted(baseValue("string", "x"), typing("I1.SCORE", "float")),
        lookingUpDotted(baseValue("integer", "1")),
        lookingUpDotted(baseValue("float", "1.5")),
      ],
      [
        [
          {
            detail: {
              element: "qti-lookup-outcome-value",
              expressionBaseType: "string",
              expressionCardinality: "single",
              identifier: "I1.SCORE",
              reading: "28",
            },
            path: outcomeRulePath("qti-lookup-outcome-value"),
            rule: "expression-type",
          },
        ],
        [
          {
            detail: {
              element: "qti-lookup-outcome-value",
              expressionBaseType: "string",
              expressionCardinality: "single",
              identifier: "I1.SCORE",
              reading: "28",
            },
            path: outcomeRulePath("qti-lookup-outcome-value"),
            rule: "expression-type",
          },
        ],
        [],
        [],
      ],
    );
  });

  it("[T-9] keeps the lookup operand of a declared table outcome judged against its table, beside a lookup operand of a dotted target (reading 28)", () => {
    const tabled = outcome("SCORE", "float", [
      el(
        "qti-match-table",
        [],
        [el("qti-match-table-entry", [attr("source-value", "1"), attr("target-value", "2")])],
      ),
    ]);

    assert.deepStrictEqual(
      [
        processed(ruledTest([tabled], [lookup("SCORE", baseValue("float", "1.5"))]), unknownTyping),
        processed(ruledTest([tabled], [lookup("SCORE", baseValue("integer", "1"))]), unknownTyping),
      ],
      [
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
            path: outcomeRulePath("qti-lookup-outcome-value"),
            rule: "expression-type",
          },
        ],
        [],
      ],
    );
  });

  it("[T-9] judges a braced prefixed name the typer types as a reference: an integer {I1.N} is P24 at qti-pattern-match's pattern, a string {I1.STR} is accepted, and under the unknown typer both stay literal text (ruling R1; pantry P24, checkAttributeReference)", () => {
    assert.deepStrictEqual(
      [
        matchingPattern("{I1.N}", typing("I1.N", "integer")),
        matchingPattern("{I1.STR}", typing("I1.STR", "string")),
        matchingPattern("{I1.N}", unknownTyping),
        matchingPattern("{I1.STR}", unknownTyping),
      ],
      [
        [
          {
            detail: {
              attribute: "pattern",
              check: "reference",
              element: "qti-pattern-match",
              expectedBaseType: "string",
              identifier: "I1.N",
            },
            path: `${outcomeRulePath("qti-set-outcome-value")}/qti-pattern-match`,
            rule: "expression-type",
          },
        ],
        [],
        [],
        [],
      ],
    );
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

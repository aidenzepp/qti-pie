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
import type { CollectedTyper, PrefixedTyper } from "#plate/validate/rules.ts";
import { tables } from "#plate/validate/tables.ts";
import { check } from "#plate/validate/verdict.ts";

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
 * Construct a `qti-field-value` of a record operand: a single whose base type is the field's, which
 * the rules leave unknown, so it satisfies every rule that takes a single.
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
 * Judge an item that declares the record responses `REC` and `OTHER`, the float `SCORE` and the
 * boolean `SAME`, whose response processing is the rules given.
 *
 * @param rules The rules of its `qti-response-processing`, in order.
 * @returns The refusals, reduced.
 */
const overRecords = (rules: readonly SourceElement[]) =>
  judged(
    item(
      [
        response("REC", "record"),
        response("OTHER", "record"),
        outcome("SCORE"),
        outcome("SAME", "boolean"),
      ],
      [],
      [processing(undefined, rules)],
    ),
  );

/**
 * Construct a field of a record value: a `qti-value` with the attributes given.
 *
 * @param attributes Its attributes, such as `field-identifier` and `base-type`.
 * @param written Its text, as written.
 * @returns The `qti-value`.
 */
const field = (attributes: readonly SourceAttribute[], written: string): SourceElement =>
  el("qti-value", attributes, [text(written)]);

/**
 * Check an item whose record response `RESPONSE` holds a `qti-default-value` of the fields given.
 *
 * @param fields The default's `qti-value` children.
 * @param baseType The declaration's own `base-type`, none when absent.
 * @returns The refusals, reduced.
 */
const recordDefault = (fields: readonly SourceElement[], baseType?: string) =>
  judged(
    item([response("RESPONSE", "record", baseType, [el("qti-default-value", [], fields)])], []),
  );

/**
 * Construct the reduced refusal of a record field that lacks an attribute its record requires
 * (`info.txt:73046`).
 *
 * @param attribute The attribute it lacks, `field-identifier` or `base-type`.
 * @param path The missing attribute's path.
 * @returns The refusal, as {@link judged} reduces it.
 */
const missingField = (attribute: string, path: string) => ({
  detail: { attribute, element: "qti-value", source: "info.txt:73046" },
  path,
  rule: "missing-attribute" as const,
});

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

/**
 * Construct a Text Entry bound to `responseIdentifier` whose `string-identifier` names
 * `stringIdentifier`.
 *
 * @param responseIdentifier Its `response-identifier`.
 * @param stringIdentifier Its `string-identifier`.
 * @param local The interaction's local name, a Text Entry unless an Extended Text is given.
 * @returns The interaction.
 */
const capturing = (
  responseIdentifier: string,
  stringIdentifier: string,
  local = "qti-text-entry-interaction",
): SourceElement =>
  interaction(local, responseIdentifier, [attr("string-identifier", stringIdentifier)]);

/**
 * Construct an Associate whose `max-associations` is written as given, over two associable choices.
 *
 * @param maxAssociations Its `max-associations`, as written.
 * @returns The interaction.
 */
const associating = (maxAssociations: string): SourceElement =>
  el(
    "qti-associate-interaction",
    [attr("response-identifier", "RESPONSE"), attr("max-associations", maxAssociations)],
    ["A", "B"].map((identifier) =>
      el("qti-simple-associable-choice", [attr("identifier", identifier), attr("match-max", "1")]),
    ),
  );

/**
 * Construct a Gap Match bound to `RESPONSE` with one gap text and the given number of gaps in a
 * paragraph, as the research probe `a92r_gapmatch_single_2gaps` writes it.
 *
 * @param gaps How many `qti-gap`s the paragraph holds.
 * @returns The interaction.
 */
const gapMatch = (gaps: number): SourceElement =>
  el(
    "qti-gap-match-interaction",
    [attr("response-identifier", "RESPONSE")],
    [
      el("qti-gap-text", [attr("identifier", "W"), attr("match-max", "1")], [text("w")]),
      el(
        "p",
        [],
        Array.from({ length: gaps }, (_, index) =>
          el("qti-gap", [attr("identifier", `G${index}`)]),
        ),
      ),
    ],
  );

/**
 * Construct an item whose body holds a Portable Custom Interaction bound to its declared
 * `RESPONSE`, which binds the context variables it names.
 *
 * @param declarations The declarations after `RESPONSE`'s.
 * @param contextVariables The identifier each `qti-context-variable` names.
 * @returns The item.
 */
const portable = (declarations: readonly SourceElement[], contextVariables: readonly string[]) =>
  item(
    [response("RESPONSE", "single", "string"), ...declarations],
    [
      el(
        "qti-portable-custom-interaction",
        [
          attr("custom-interaction-type-identifier", "urn:example:pci"),
          attr("module", "pci"),
          attr("response-identifier", "RESPONSE"),
        ],
        [
          ...contextVariables.map((identifier) =>
            el("qti-context-variable", [attr("identifier", identifier)]),
          ),
          el("qti-interaction-markup", [], [el("div")]),
        ],
      ),
    ],
  );

/**
 * Construct an interaction bound to a response, with its counts and its children.
 *
 * @param local The interaction's local name.
 * @param responseIdentifier Its `response-identifier`.
 * @param attributes Its further attributes, its counts among them.
 * @param children Its children.
 * @returns The interaction.
 */
const counting = (
  local: string,
  responseIdentifier: string,
  attributes: readonly SourceAttribute[],
  children: readonly SourceElement[] = [],
): SourceElement =>
  el(local, [attr("response-identifier", responseIdentifier), ...attributes], children);

/**
 * Construct a Media interaction bound to `PLAYS` with its counts, over one `audio`.
 *
 * @param attributes Its counts.
 * @returns The interaction.
 */
const media = (attributes: readonly SourceAttribute[]): SourceElement =>
  counting(
    "qti-media-interaction",
    "PLAYS",
    [attr("autostart", "false"), ...attributes],
    [el("audio", [attr("src", "media/sound.mp3")])],
  );

/**
 * Construct an Order over the given number of simple choices, each choice's identifier prefixed by
 * its response's, so two Orders of one item give none twice (reading 104, E19).
 *
 * @param choices How many `qti-simple-choice`s it holds.
 * @param attributes Its counts.
 * @param responseIdentifier Its `response-identifier`, `ORDER` unless another is given.
 * @returns The interaction.
 */
const order = (
  choices: number,
  attributes: readonly SourceAttribute[],
  responseIdentifier = "ORDER",
): SourceElement =>
  counting(
    "qti-order-interaction",
    responseIdentifier,
    attributes,
    Array.from({ length: choices }, (_, index) =>
      el(
        "qti-simple-choice",
        [attr("identifier", `${responseIdentifier}-C${index}`)],
        [text(`c${index}`)],
      ),
    ),
  );

/**
 * An item whose body holds a Graphic Order of two hotspots over one image, bound to `RESPONSE`.
 *
 * @param cardinality The declaration's cardinality.
 * @param baseType The declaration's base type, none when absent.
 * @returns The item.
 */
const graphicOrderItem = (cardinality: string, baseType?: string) =>
  item(
    [response("RESPONSE", cardinality, baseType)],
    [
      counting(
        "qti-graphic-order-interaction",
        "RESPONSE",
        [],
        [
          el("img", [
            attr("alt", "A map"),
            attr("height", "100"),
            attr("src", "images/map.png"),
            attr("width", "100"),
          ]),
          ...["H1", "H2"].map((identifier) =>
            el("qti-hotspot-choice", [
              attr("coords", "10,10,5"),
              attr("identifier", identifier),
              attr("shape", "circle"),
            ]),
          ),
        ],
      ),
    ],
  );

/**
 * Construct a count pair's refusal.
 *
 * @param path The path it points at.
 * @param element The element whose pair it is.
 * @param least The least count, then its value.
 * @param most The most count, then its value.
 * @param reading The reading that settles it.
 * @returns The refusal, as {@link judged} reduces it.
 */
const pairRefusal = (
  path: string,
  element: string,
  [least, leastValue]: readonly [string, string],
  [most, mostValue]: readonly [string, string],
  reading = "76",
) => ({
  detail: { check: "count-pair", element, least, leastValue, most, mostValue, reading },
  path,
  rule: "count-range" as const,
});

/**
 * Construct a pooled choice's `duplicate-identifier` refusal, a gap's included (reading 104 as
 * amended, E19).
 *
 * @param path The repeated `identifier` attribute's path.
 * @param choiceClass The refused choice's class.
 * @param identifier The identifier it repeats.
 * @param otherClass The earlier choice's class, when it differs.
 * @returns The refusal, as {@link judged} reduces it.
 */
const repeated = (path: string, choiceClass: string, identifier: string, otherClass?: string) => ({
  detail:
    otherClass === undefined
      ? { class: choiceClass, identifier, reading: "104" }
      : { class: choiceClass, identifier, otherClass, reading: "104" },
  path,
  rule: "duplicate-identifier" as const,
});

/**
 * Construct a Gap Match bound to `PAIRS` over the given gap texts and gaps.
 *
 * @param texts The identifier of each `qti-gap-text`.
 * @param gaps The identifier of each `qti-gap`, in one paragraph.
 * @returns The interaction.
 */
const gapping = (texts: readonly string[], gaps: readonly string[]): SourceElement =>
  el(
    "qti-gap-match-interaction",
    [attr("response-identifier", "PAIRS")],
    [
      ...texts.map((identifier) =>
        el("qti-gap-text", [attr("identifier", identifier), attr("match-max", "1")], [text("w")]),
      ),
      el(
        "p",
        [],
        gaps.map((identifier) => el("qti-gap", [attr("identifier", identifier)])),
      ),
    ],
  );

/**
 * Give a hand-built item's root further attributes, such as reading 128's tool attributes.
 *
 * @param source The item.
 * @param attributes The attributes its root gains, after its own.
 * @returns The same item, its root carrying them.
 */
const rooted = (source: SourceDocument, attributes: readonly SourceAttribute[]): SourceDocument =>
  doc(source.location, { ...source.root, attributes: [...source.root.attributes, ...attributes] });

/**
 * An `audio` whose caption `track` carries a `label`, a kind whose label asks for its tool
 * (reading 128).
 */
const captioned = el(
  "audio",
  [attr("src", "media/sound.mp3")],
  [
    el("track", [
      attr("src", "media/en.vtt"),
      attr("kind", "captions"),
      attr("srclang", "en"),
      attr("label", "English"),
    ]),
  ],
);

/**
 * Construct the `label-tool` refusal at an item root (reading 128, E31a).
 *
 * @param attribute The tool attributes the root lacks, space-separated.
 * @param labelled The path of the first labelled element.
 * @returns The refusal, as {@link judged} reduces it.
 */
const labelTool = (attribute: string, labelled: string) => ({
  detail: {
    attribute,
    check: "label-tool",
    element: "qti-assessment-item",
    labelled,
    reading: "128",
  },
  path: "qti-assessment-item",
  rule: "missing-attribute" as const,
});

/**
 * Construct a `qti-template-block` shown by the template variable `T`, its content body holding
 * the given children.
 *
 * @param children The children of its `qti-content-body`.
 * @returns The template block.
 */
const templateBlock = (children: readonly SourceElement[]): SourceElement =>
  el(
    "qti-template-block",
    [attr("identifier", "SHOWN"), ...shownBy("T")],
    [el("qti-content-body", [], children)],
  );

/**
 * Construct a table of one row: a `th` whose `id` is `H` and a `td` with the given `headers`.
 *
 * @param headers The `td`'s `headers`, as written.
 * @param nested The children of the `td` after its text, such as a nested table.
 * @returns The table.
 */
const headed = (headers: string, nested: readonly SourceElement[] = []): SourceElement =>
  el(
    "table",
    [],
    [
      el(
        "tbody",
        [],
        [
          el(
            "tr",
            [],
            [
              el("th", [attr("id", "H")], [text("Head")]),
              el("td", [attr("headers", headers)], [text("Cell"), ...nested]),
            ],
          ),
        ],
      ),
    ],
  );

/**
 * Construct the `headers` refusal of a `td` (reading 126, E29).
 *
 * @param path The `td`'s path.
 * @param value Its `headers`, as written.
 * @param token The token at fault.
 * @returns The refusal, as {@link judged} reduces it.
 */
const badHeaders = (path: string, value: string, token: string) => ({
  detail: {
    attribute: "headers",
    check: "headers",
    element: "td",
    reading: "126",
    token,
    value,
  },
  path: `${path}/@headers`,
  rule: "attribute-type" as const,
});

/**
 * Construct a paragraph that holds a `q` between two texts.
 *
 * @param before The text before the `q`.
 * @param inside The `q`'s text.
 * @param after The text after it.
 * @returns The paragraph.
 */
const quoting = (before: string, inside: string, after: string): SourceElement =>
  el("p", [], [text(before), el("q", [], [text(inside)]), text(after)]);

/**
 * Construct a feedback element that shows when an outcome holds `A`.
 *
 * @param local The feedback element's local name.
 * @param outcomeIdentifier Its `outcome-identifier`, as written.
 * @param children Its children.
 * @returns The feedback element.
 */
const feedback = (
  local: string,
  outcomeIdentifier: string,
  children: readonly SourceChild[] = [text("Well done.")],
): SourceElement =>
  el(
    local,
    [
      attr("outcome-identifier", outcomeIdentifier),
      attr("identifier", "A"),
      attr("show-hide", "show"),
    ],
    children,
  );

/**
 * Construct an item that declares the identifier response `RESPONSE`, the float outcome `SCORE`,
 * the identifier outcome `FEEDBACK` and the identifier template variable `T`, and whose body holds
 * a feedback block naming an outcome.
 *
 * @param outcomeIdentifier The feedback block's `outcome-identifier`, as written.
 * @returns The item.
 */
const feedbackItem = (outcomeIdentifier: string) =>
  item(
    [
      response("RESPONSE", "single", "identifier"),
      outcome("SCORE"),
      outcome("FEEDBACK", "identifier"),
      declaration("qti-template-declaration", "T", "single", "identifier"),
    ],
    [feedback("qti-feedback-block", outcomeIdentifier)],
  );

/**
 * The refusal of a feedback element whose `outcome-identifier` names no outcome of the item
 * (reading 77).
 *
 * @param element The feedback element's local name.
 * @param path The `outcome-identifier` attribute's path.
 * @param identifier The name it gives.
 * @returns The refusal, as {@link judged} reduces it.
 */
const noOutcome = (element: string, path: string, identifier: string) => ({
  detail: {
    attribute: "outcome-identifier",
    element,
    expected: "outcome",
    identifier,
    reading: "77",
  },
  path,
  rule: "undeclared-variable" as const,
});

/**
 * The refusal of a feedback element whose `outcome-identifier` names an outcome that is not a
 * single or multiple identifier (reading 77).
 *
 * @param element The feedback element's local name.
 * @param path The `outcome-identifier` attribute's path.
 * @param identifier The outcome it names.
 * @param type The outcome's base type and cardinality.
 * @returns The refusal, as {@link judged} reduces it.
 */
const feedbackType = (
  element: string,
  path: string,
  identifier: string,
  type: { readonly baseType: string; readonly cardinality: string },
) => ({
  detail: { ...type, check: "feedback-outcome", element, identifier, reading: "77" },
  path,
  rule: "expression-type" as const,
});

/**
 * Check an item whose one response declaration maps the keys given.
 *
 * @param cardinality The declaration's `cardinality`.
 * @param baseType The declaration's `base-type`, as written.
 * @param keys The `map-key` of each entry, as written.
 * @returns The refusals, reduced.
 */
const mapped = (cardinality: string, baseType: string, ...keys: readonly string[]) =>
  judged(item([response("RESPONSE", cardinality, baseType, [mapping(...keys)])], []));

/**
 * Check an item whose float outcome `SCORE` carries the attributes given.
 *
 * @param attributes The declaration's further attributes, such as `mastery-value`.
 * @returns The refusals, reduced.
 */
const mastered = (attributes: Readonly<Record<string, string>>) =>
  judged(
    item(
      [
        el("qti-outcome-declaration", [
          attr("identifier", "SCORE"),
          attr("cardinality", "single"),
          attr("base-type", "float"),
          ...Object.entries(attributes).map(([local, value]) => attr(local, value)),
        ]),
      ],
      [],
    ),
  );

/**
 * The refusal of a `mastery-value` outside a written bound.
 *
 * @param value The `mastery-value`, as written.
 * @param bound `least` for a `normal-minimum`, `greatest` for a `normal-maximum`.
 * @param written The bound, as written.
 * @returns The refusal, as {@link judged} reduces it.
 */
const outOfRange = (value: string, bound: "greatest" | "least", written: string) => ({
  detail: {
    attribute: "mastery-value",
    [bound]: written,
    check: "mastery-range",
    element: "qti-outcome-declaration",
    reading: "9",
    value,
  },
  path: "qti-assessment-item/qti-outcome-declaration/@mastery-value",
  rule: "attribute-type" as const,
});

/**
 * Construct a template rule that sets a variable, a correct response or a default to an expression.
 *
 * @param local The rule's local name.
 * @param identifier The variable it names, as written.
 * @param expression The expression.
 * @returns The rule.
 */
const settingRule = (local: string, identifier: string, expression: SourceElement): SourceElement =>
  el(local, [attr("identifier", identifier)], [expression]);

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
            detail: { class: "qti-simple-choice", identifier: "A", reading: "104" },
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
            detail: { class: "qti-inline-choice", identifier: "A", reading: "104" },
            path: "qti-assessment-item/qti-item-body/p/qti-inline-choice-interaction/qti-inline-choice[3]/@identifier",
            rule: "duplicate-identifier",
          },
        ],
      );
    });

    it("align-54 choice identifiers E19: refuses the same inline choice identifiers in two Inline Choices, each at the second (reading 104)", () => {
      const second = "qti-assessment-item/qti-item-body/p/qti-inline-choice-interaction[2]";

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
        ["A", "B"].map((identifier, index) => ({
          detail: { class: "qti-inline-choice", identifier, reading: "104" },
          path: `${second}/qti-inline-choice[${index + 1}]/@identifier`,
          rule: "duplicate-identifier",
        })),
      );
    });

    it("[I-1] accepts distinct declarations, and distinct choice identifiers across two interactions", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [
              response("RESPONSE", "single", "identifier"),
              response("RESPONSE2", "multiple", "identifier"),
              outcome("SCORE"),
            ],
            [choice("RESPONSE", ["A", "B"]), choice("RESPONSE2", ["C", "D"])],
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

    it("[I-1] accepts a Text Entry bound to a record declaration, which renders as the string control", () => {
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

  describe("align-54 bindings by name: a graphic order interaction binds identifier, ordered; an order interaction's binding is not refused", () => {
    const body = "qti-assessment-item/qti-item-body";

    it("align-54 bindings by name e3bc2c3d: refuses a Graphic Order bound to a single identifier, a multiple identifier, an ordered string or a record, as binding (§5.61, info.txt:29186)", () => {
      for (const [cardinality, baseType] of [
        ["single", "identifier"],
        ["multiple", "identifier"],
        ["ordered", "string"],
        ["record", undefined],
      ] as const) {
        assert.deepStrictEqual(
          judged(graphicOrderItem(cardinality, baseType)),
          [
            {
              detail: {
                baseType: baseType ?? "",
                cardinality,
                interaction: "qti-graphic-order-interaction",
                response: "RESPONSE",
              },
              path: `${body}/qti-graphic-order-interaction`,
              rule: "binding",
            },
          ],
          `${cardinality} ${baseType ?? "(no base type)"}`,
        );
      }
    });

    it("align-54 bindings by name e3bc2c3d: accepts a Graphic Order bound to an ordered identifier (§5.61, info.txt:29186)", () => {
      assert.deepStrictEqual(judged(graphicOrderItem("ordered", "identifier")), []);
    });

    it("align-54 bindings by name e3bc2c3d: accepts an Order bound to a single identifier, and one bound to an ordered string, since only non-normative §2.4.1.2 states its binding (the operator's ruling)", () => {
      for (const [cardinality, baseType] of [
        ["single", "identifier"],
        ["ordered", "string"],
      ] as const) {
        assert.deepStrictEqual(
          judged(item([response("RESPONSE", cardinality, baseType)], [order(2, [], "RESPONSE")])),
          [],
          `${cardinality} ${baseType}`,
        );
      }
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

  describe("align-54 bindings: a string-identifier, reading 92's bindings and a gap match bound single", () => {
    const body = "qti-assessment-item/qti-item-body";

    it("align-54 bindings D3a: refuses a Text Entry whose string-identifier names no declaration, as undeclared-response at the attribute (reading 14)", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [response("RESPONSE", "single", "float")],
            [el("p", [], [capturing("RESPONSE", "TEXT")])],
          ),
        ),
        [
          {
            detail: {
              attribute: "string-identifier",
              element: "qti-text-entry-interaction",
              identifier: "TEXT",
              reading: "14",
              response: "TEXT",
            },
            path: `${body}/p/qti-text-entry-interaction/@string-identifier`,
            rule: "undeclared-response",
          },
        ],
      );
    });

    it("align-54 bindings D3a: refuses a string-identifier naming a single float, and an Extended Text's naming a multiple string, as binding string-binding (reading 14)", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [
              response("RESPONSE", "single", "float"),
              response("NOTES", "single", "float"),
              response("LINES", "multiple", "string"),
              response("ESSAY", "single", "string"),
            ],
            [
              el("p", [], [capturing("RESPONSE", "NOTES")]),
              capturing("ESSAY", "LINES", "qti-extended-text-interaction"),
            ],
          ),
        ),
        [
          {
            detail: {
              baseType: "float",
              cardinality: "single",
              check: "string-binding",
              interaction: "qti-text-entry-interaction",
              reading: "14",
              response: "NOTES",
            },
            path: `${body}/p/qti-text-entry-interaction`,
            rule: "binding",
          },
          {
            detail: {
              baseType: "string",
              cardinality: "multiple",
              check: "string-binding",
              interaction: "qti-extended-text-interaction",
              reading: "14",
              response: "LINES",
            },
            path: `${body}/qti-extended-text-interaction`,
            rule: "binding",
          },
        ],
      );
    });

    it("align-54 bindings D3a: refuses a string-identifier naming its own response-identifier, as binding bound-once at the string-identifier (reading 14)", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [response("RESPONSE", "single", "string")],
            [el("p", [], [capturing("RESPONSE", "RESPONSE")])],
          ),
        ),
        [
          {
            detail: {
              attribute: "string-identifier",
              check: "bound-once",
              interaction: "qti-text-entry-interaction",
              reading: "14",
              response: "RESPONSE",
            },
            path: `${body}/p/qti-text-entry-interaction/@string-identifier`,
            rule: "binding",
          },
        ],
      );
    });

    it("align-54 bindings D3a: accepts a Text Entry and an Extended Text bound to numbers, each capturing its text in a single string of its own", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [
              response("RESPONSE", "single", "float"),
              response("TEXT", "single", "string"),
              response("COUNT", "single", "integer"),
              response("WRITTEN", "single", "string"),
            ],
            [
              el("p", [], [capturing("RESPONSE", "TEXT")]),
              capturing("COUNT", "WRITTEN", "qti-extended-text-interaction"),
            ],
          ),
        ),
        [],
      );
    });

    it('align-54 bindings E11a: refuses a Choice of max-choices="2" and one of max-choices="0" bound single, as binding count-cardinality (reading 92)', () => {
      assert.deepStrictEqual(
        judged(
          item(
            [
              response("RESPONSE", "single", "identifier"),
              response("RESPONSE2", "single", "identifier"),
            ],
            [
              interaction("qti-choice-interaction", "RESPONSE", [attr("max-choices", "2")]),
              interaction("qti-choice-interaction", "RESPONSE2", [attr("max-choices", "0")]),
            ],
          ),
        ),
        [
          {
            detail: {
              attribute: "max-choices",
              check: "count-cardinality",
              count: "2",
              interaction: "qti-choice-interaction",
              reading: "92",
              response: "RESPONSE",
            },
            path: `${body}/qti-choice-interaction[1]`,
            rule: "binding",
          },
          {
            detail: {
              attribute: "max-choices",
              check: "count-cardinality",
              count: "0",
              interaction: "qti-choice-interaction",
              reading: "92",
              response: "RESPONSE2",
            },
            path: `${body}/qti-choice-interaction[2]`,
            rule: "binding",
          },
        ],
      );
    });

    it('align-54 bindings E11a: refuses an Associate of max-associations="2" bound single, as binding count-cardinality (reading 92)', () => {
      assert.deepStrictEqual(
        judged(item([response("RESPONSE", "single", "pair")], [associating("2")])),
        [
          {
            detail: {
              attribute: "max-associations",
              check: "count-cardinality",
              count: "2",
              interaction: "qti-associate-interaction",
              reading: "92",
              response: "RESPONSE",
            },
            path: `${body}/qti-associate-interaction`,
            rule: "binding",
          },
        ],
      );
    });

    it("align-54 bindings E11a: reads an unwritten count as its XSD default, 1 for a Choice and 0 for a Select Point (reading 92)", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [response("RESPONSE", "single", "identifier"), response("POINT", "single", "point")],
            [
              interaction("qti-choice-interaction", "RESPONSE"),
              interaction("qti-select-point-interaction", "POINT"),
            ],
          ),
        ),
        [
          {
            detail: {
              attribute: "max-choices",
              check: "count-cardinality",
              count: "0",
              interaction: "qti-select-point-interaction",
              reading: "92",
              response: "POINT",
            },
            path: `${body}/qti-select-point-interaction`,
            rule: "binding",
          },
        ],
      );
    });

    it('align-54 bindings E11a: accepts max-choices="2" and max-associations="2" bound multiple, and max-choices="1" bound single', () => {
      assert.deepStrictEqual(
        judged(
          item(
            [
              response("RESPONSE", "multiple", "pair"),
              response("CHOICE", "multiple", "identifier"),
              response("ONE", "single", "identifier"),
            ],
            [
              associating("2"),
              interaction("qti-choice-interaction", "CHOICE", [attr("max-choices", "2")]),
              interaction("qti-choice-interaction", "ONE", [attr("max-choices", "1")]),
            ],
          ),
        ),
        [],
      );
    });

    it("align-54 bindings E11a: refuses a response bound by two interactions, as binding bound-once at the second binding, a string-identifier's among them (reading 92)", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [
              response("RESPONSE", "single", "identifier"),
              response("NUMBER", "single", "integer"),
              response("TEXT", "single", "string"),
            ],
            [
              choice("RESPONSE"),
              choice("RESPONSE", ["C", "D"]),
              el(
                "p",
                [],
                [capturing("NUMBER", "TEXT"), interaction("qti-text-entry-interaction", "TEXT")],
              ),
            ],
          ),
        ),
        [
          {
            detail: {
              attribute: "response-identifier",
              check: "bound-once",
              interaction: "qti-choice-interaction",
              reading: "92",
              response: "RESPONSE",
            },
            path: `${body}/qti-choice-interaction[2]/@response-identifier`,
            rule: "binding",
          },
          {
            detail: {
              attribute: "response-identifier",
              check: "bound-once",
              interaction: "qti-text-entry-interaction",
              reading: "92",
              response: "TEXT",
            },
            path: `${body}/p/qti-text-entry-interaction[2]/@response-identifier`,
            rule: "binding",
          },
        ],
      );
    });

    it("align-54 bindings E11a: refuses a PCI's qti-context-variable naming no context variable, as undeclared-variable context-variable (reading 92)", () => {
      assert.deepStrictEqual(judged(portable([outcome("LOCALE")], ["LOCALE"])), [
        {
          detail: {
            check: "context-variable",
            element: "qti-context-variable",
            identifier: "LOCALE",
            reading: "92",
          },
          path: `${body}/qti-portable-custom-interaction/qti-context-variable`,
          rule: "undeclared-variable",
        },
      ]);
    });

    it("align-54 bindings E11a: accepts a PCI's qti-context-variable naming a declared context variable or the built-in QTI_CONTEXT", () => {
      assert.deepStrictEqual(
        judged(
          portable(
            [
              el("qti-context-declaration", [
                attr("identifier", "LOCALE"),
                attr("cardinality", "single"),
                attr("base-type", "string"),
              ]),
            ],
            ["LOCALE", "QTI_CONTEXT"],
          ),
        ),
        [],
      );
    });

    it("align-54 bindings P7: refuses a Gap Match bound single over two gaps, as binding gap-match-single (the operator's ruling)", () => {
      assert.deepStrictEqual(
        judged(item([response("RESPONSE", "single", "directedPair")], [gapMatch(2)])),
        [
          {
            detail: {
              check: "gap-match-single",
              gaps: "2",
              interaction: "qti-gap-match-interaction",
              response: "RESPONSE",
            },
            path: `${body}/qti-gap-match-interaction`,
            rule: "binding",
          },
        ],
      );
    });

    it("align-54 bindings P7: accepts a Gap Match bound single over one gap, and one bound multiple over two", () => {
      assert.deepStrictEqual(
        judged(item([response("RESPONSE", "single", "directedPair")], [gapMatch(1)])),
        [],
      );
      assert.deepStrictEqual(
        judged(item([response("RESPONSE", "multiple", "directedPair")], [gapMatch(2)])),
        [],
      );
    });

    it("align-54 bindings E39b: does not judge the binding of a declaration with no base-type and a cardinality other than record, which E39a refuses (reading 158)", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [response("RESPONSE", "single"), response("TEXT", "single")],
            [
              choice("RESPONSE"),
              el("p", [], [interaction("qti-inline-choice-interaction", "TEXT")]),
            ],
          ),
        ),
        [],
      );
    });
  });

  describe("align-54 counts: a least count at most its most, five pairs, and an order interaction's counts", () => {
    const body = "qti-assessment-item/qti-item-body";

    it("align-54 counts E2: refuses each of the five pairs with its least above its most, as count-range count-pair at the most (reading 76)", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [
              response("CHOICE", "multiple", "identifier"),
              response("PAIRS", "multiple", "pair"),
              response("ESSAY", "single", "string"),
              response("PLAYS", "single", "integer"),
            ],
            [
              counting("qti-choice-interaction", "CHOICE", [
                attr("max-choices", "2"),
                attr("min-choices", "3"),
              ]),
              counting(
                "qti-associate-interaction",
                "PAIRS",
                [attr("max-associations", "2"), attr("min-associations", "3")],
                [
                  el("qti-simple-associable-choice", [
                    attr("identifier", "A"),
                    attr("match-max", "1"),
                    attr("match-min", "2"),
                  ]),
                  el("qti-simple-associable-choice", [
                    attr("identifier", "B"),
                    attr("match-max", "1"),
                  ]),
                ],
              ),
              counting("qti-extended-text-interaction", "ESSAY", [
                attr("max-strings", "2"),
                attr("min-strings", "3"),
              ]),
              media([attr("max-plays", "2"), attr("min-plays", "3")]),
            ],
          ),
        ),
        [
          pairRefusal(
            `${body}/qti-choice-interaction/@max-choices`,
            "qti-choice-interaction",
            ["min-choices", "3"],
            ["max-choices", "2"],
          ),
          pairRefusal(
            `${body}/qti-associate-interaction/@max-associations`,
            "qti-associate-interaction",
            ["min-associations", "3"],
            ["max-associations", "2"],
          ),
          pairRefusal(
            `${body}/qti-associate-interaction/qti-simple-associable-choice[1]/@match-max`,
            "qti-simple-associable-choice",
            ["match-min", "2"],
            ["match-max", "1"],
          ),
          pairRefusal(
            `${body}/qti-extended-text-interaction/@max-strings`,
            "qti-extended-text-interaction",
            ["min-strings", "3"],
            ["max-strings", "2"],
          ),
          pairRefusal(
            `${body}/qti-media-interaction/@max-plays`,
            "qti-media-interaction",
            ["min-plays", "3"],
            ["max-plays", "2"],
          ),
        ],
      );
    });

    it("align-54 counts E2: reads an unwritten most as its XSD default, refused at the element (reading 76)", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [response("CHOICE", "single", "identifier"), response("PAIRS", "single", "pair")],
            [
              counting("qti-choice-interaction", "CHOICE", [attr("min-choices", "2")]),
              counting("qti-associate-interaction", "PAIRS", [attr("min-associations", "2")]),
            ],
          ),
        ),
        [
          pairRefusal(
            `${body}/qti-choice-interaction`,
            "qti-choice-interaction",
            ["min-choices", "2"],
            ["max-choices", "1"],
          ),
          pairRefusal(
            `${body}/qti-associate-interaction`,
            "qti-associate-interaction",
            ["min-associations", "2"],
            ["max-associations", "1"],
          ),
        ],
      );
    });

    it("align-54 counts E2: exempts a most of 0, written or the XSD's default, which sets no limit (reading 76)", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [
              response("CHOICE", "multiple", "identifier"),
              response("POINTS", "multiple", "point"),
              response("ESSAY", "single", "string"),
              response("PLAYS", "single", "integer"),
            ],
            [
              counting("qti-choice-interaction", "CHOICE", [
                attr("max-choices", "0"),
                attr("min-choices", "3"),
              ]),
              counting("qti-select-point-interaction", "POINTS", [attr("min-choices", "2")]),
              counting("qti-extended-text-interaction", "ESSAY", [
                attr("max-strings", "0"),
                attr("min-strings", "3"),
              ]),
              media([attr("min-plays", "5")]),
            ],
          ),
        ),
        [],
      );
    });

    it("align-54 counts E2: accepts a least at or below its most", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [
              response("CHOICE", "multiple", "identifier"),
              response("PAIRS", "multiple", "pair"),
              response("PLAYS", "single", "integer"),
            ],
            [
              counting("qti-choice-interaction", "CHOICE", [
                attr("max-choices", "2"),
                attr("min-choices", "2"),
              ]),
              counting(
                "qti-associate-interaction",
                "PAIRS",
                [attr("max-associations", "3"), attr("min-associations", "1")],
                [
                  el("qti-simple-associable-choice", [
                    attr("identifier", "A"),
                    attr("match-max", "1"),
                    attr("match-min", "1"),
                  ]),
                  el("qti-simple-associable-choice", [
                    attr("identifier", "B"),
                    attr("match-max", "2"),
                  ]),
                ],
              ),
              media([attr("max-plays", "2"), attr("min-plays", "1")]),
            ],
          ),
        ),
        [],
      );
    });

    it("align-54 counts D4a: refuses an Order's or a Graphic Order's min-choices, and a max-choices beside it, above its number of choices, as count-range choice-count (reading 18)", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [
              response("ORDER", "ordered", "identifier"),
              response("HOTSPOTS", "ordered", "identifier"),
            ],
            [
              order(3, [attr("max-choices", "5"), attr("min-choices", "4")]),
              counting(
                "qti-graphic-order-interaction",
                "HOTSPOTS",
                [attr("min-choices", "3")],
                [
                  el("img", [
                    attr("alt", "A map"),
                    attr("height", "100"),
                    attr("src", "images/map.png"),
                    attr("width", "100"),
                  ]),
                  ...["H1", "H2"].map((identifier) =>
                    el("qti-hotspot-choice", [
                      attr("coords", "10,10,5"),
                      attr("identifier", identifier),
                      attr("shape", "circle"),
                    ]),
                  ),
                ],
              ),
            ],
          ),
        ),
        [
          {
            detail: {
              attribute: "min-choices",
              check: "choice-count",
              choices: "3",
              reading: "18",
              value: "4",
            },
            path: `${body}/qti-order-interaction/@min-choices`,
            rule: "count-range",
          },
          {
            detail: {
              attribute: "max-choices",
              check: "choice-count",
              choices: "3",
              reading: "18",
              value: "5",
            },
            path: `${body}/qti-order-interaction/@max-choices`,
            rule: "count-range",
          },
          {
            detail: {
              attribute: "min-choices",
              check: "choice-count",
              choices: "2",
              reading: "18",
              value: "3",
            },
            path: `${body}/qti-graphic-order-interaction/@min-choices`,
            rule: "count-range",
          },
        ],
      );
    });

    it('align-54 counts D4a: refuses an Order\'s max-choices="0", and one below its min-choices, beside a written min-choices, as count-range count-pair with no 0 exemption (reading 18)', () => {
      assert.deepStrictEqual(
        judged(
          item(
            [
              response("ORDER", "ordered", "identifier"),
              response("ORDER2", "ordered", "identifier"),
            ],
            [
              order(3, [attr("max-choices", "0"), attr("min-choices", "2")]),
              order(3, [attr("max-choices", "2"), attr("min-choices", "3")], "ORDER2"),
            ],
          ),
        ),
        [
          pairRefusal(
            `${body}/qti-order-interaction[1]/@max-choices`,
            "qti-order-interaction",
            ["min-choices", "2"],
            ["max-choices", "0"],
            "18",
          ),
          pairRefusal(
            `${body}/qti-order-interaction[2]/@max-choices`,
            "qti-order-interaction",
            ["min-choices", "3"],
            ["max-choices", "2"],
            "18",
          ),
        ],
      );
    });

    it("align-54 counts D4a: reads no max-choices without a min-choices beside it, and accepts counts within the choices (reading 18)", () => {
      for (const counts of [
        [attr("max-choices", "9")],
        [attr("max-choices", "0")],
        [attr("max-choices", "3"), attr("min-choices", "2")],
        [attr("max-choices", "3"), attr("min-choices", "3")],
      ]) {
        assert.deepStrictEqual(
          judged(item([response("ORDER", "ordered", "identifier")], [order(3, counts)])),
          [],
        );
      }
    });

    it("align-54 counts D3a: accepts an Extended Text bound to a multiple float response whose string-identifier names a multiple string, the cardinality of its own response (rule 5b8ee08b)", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [response("NUMBERS", "multiple", "float"), response("TEXTS", "multiple", "string")],
            [
              counting("qti-extended-text-interaction", "NUMBERS", [
                attr("max-strings", "2"),
                attr("string-identifier", "TEXTS"),
              ]),
            ],
          ),
        ),
        [],
      );
    });

    it("align-54 counts D3a: refuses a multiple string beside a single binding, and a single string beside a multiple one, as binding string-binding (reading 14)", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [
              response("ESSAY", "single", "float"),
              response("LINES", "multiple", "string"),
              response("NUMBERS", "multiple", "float"),
              response("TEXT", "single", "string"),
            ],
            [
              capturing("ESSAY", "LINES", "qti-extended-text-interaction"),
              counting("qti-extended-text-interaction", "NUMBERS", [
                attr("max-strings", "2"),
                attr("string-identifier", "TEXT"),
              ]),
            ],
          ),
        ),
        [
          {
            detail: {
              baseType: "string",
              cardinality: "multiple",
              check: "string-binding",
              interaction: "qti-extended-text-interaction",
              reading: "14",
              response: "LINES",
            },
            path: `${body}/qti-extended-text-interaction[1]`,
            rule: "binding",
          },
          {
            detail: {
              baseType: "string",
              cardinality: "single",
              check: "string-binding",
              interaction: "qti-extended-text-interaction",
              reading: "14",
              response: "TEXT",
            },
            path: `${body}/qti-extended-text-interaction[2]`,
            rule: "binding",
          },
        ],
      );
    });
  });

  describe("align-54 choice identifiers: a choice identifier names one choice of the pooled classes and no item variable", () => {
    const body = "qti-assessment-item/qti-item-body";

    /**
     * Construct the choice-variable refusal of a simple choice of the body's Choice that names a
     * variable or a built-in (reading 104, E19).
     *
     * @param identifier The identifier the choice gives.
     * @returns The refusal, as {@link judged} reduces it.
     */
    const namesVariable = (identifier: string) => ({
      detail: {
        check: "choice-variable",
        class: "qti-simple-choice",
        identifier,
        reading: "104",
      },
      path: `${body}/qti-choice-interaction/qti-simple-choice/@identifier`,
      rule: "duplicate-identifier" as const,
    });

    const pairs = response("PAIRS", "multiple", "directedPair");

    it("align-54 choice identifiers E19: refuses one identifier on two simple choices of two Choices, at the second (reading 104)", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [
              response("RESPONSE", "single", "identifier"),
              response("RESPONSE2", "single", "identifier"),
            ],
            [choice("RESPONSE", ["A", "B"]), choice("RESPONSE2", ["C", "A"])],
          ),
        ),
        [
          repeated(
            `${body}/qti-choice-interaction[2]/qti-simple-choice[2]/@identifier`,
            "qti-simple-choice",
            "A",
          ),
        ],
      );
    });

    it("align-54 choice identifiers E19: refuses a gap text sharing a simple choice's identifier, two classes of one pool", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [response("RESPONSE", "single", "identifier"), pairs],
            [choice("RESPONSE", ["A", "B"]), gapping(["A"], ["G"])],
          ),
        ),
        [
          repeated(
            `${body}/qti-gap-match-interaction/qti-gap-text/@identifier`,
            "qti-gap-text",
            "A",
            "qti-simple-choice",
          ),
        ],
      );
    });

    it("align-54 choice identifiers E19: refuses a hottext sharing an inline choice's identifier", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [response("RESPONSE", "single", "identifier"), response("HOT", "single", "identifier")],
            [
              el("p", [], [inlineChoice("RESPONSE", ["A", "B"])]),
              el(
                "qti-hottext-interaction",
                [attr("response-identifier", "HOT")],
                [el("p", [], [el("qti-hottext", [attr("identifier", "B")], [text("b")])])],
              ),
            ],
          ),
        ),
        [
          repeated(
            `${body}/qti-hottext-interaction/p/qti-hottext/@identifier`,
            "qti-hottext",
            "B",
            "qti-inline-choice",
          ),
        ],
      );
    });

    it("align-54 choice identifiers E19: refuses an associable hotspot sharing a gap img's identifier", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [pairs],
            [
              el(
                "qti-graphic-gap-match-interaction",
                [attr("response-identifier", "PAIRS")],
                [
                  el("img", [attr("src", "images/map.png"), attr("alt", "A map")]),
                  el(
                    "qti-gap-img",
                    [attr("identifier", "H"), attr("match-max", "1")],
                    [el("img", [attr("src", "images/pin.png"), attr("alt", "A pin")])],
                  ),
                  el("qti-associable-hotspot", [
                    attr("identifier", "H"),
                    attr("shape", "circle"),
                    attr("coords", "10,10,5"),
                    attr("match-max", "1"),
                  ]),
                ],
              ),
            ],
          ),
        ),
        [
          repeated(
            `${body}/qti-graphic-gap-match-interaction/qti-associable-hotspot/@identifier`,
            "qti-associable-hotspot",
            "H",
            "qti-gap-img",
          ),
        ],
      );
    });

    it("align-54 choice identifiers E19: refuses a choice named as a response, as choice-variable (reading 104)", () => {
      assert.deepStrictEqual(
        judged(
          item([response("RESPONSE", "single", "identifier")], [choice("RESPONSE", ["RESPONSE"])]),
        ),
        [namesVariable("RESPONSE")],
      );
    });

    it("align-54 choice identifiers E19: refuses a choice named as an outcome, as choice-variable (reading 104)", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [response("RESPONSE", "single", "identifier"), outcome("SCORE")],
            [choice("RESPONSE", ["SCORE"])],
          ),
        ),
        [namesVariable("SCORE")],
      );
    });

    it("align-54 choice identifiers E19: refuses a choice named as the built-in numAttempts, as choice-variable (reading 104)", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [response("RESPONSE", "single", "identifier")],
            [choice("RESPONSE", ["numAttempts"])],
          ),
        ),
        [namesVariable("numAttempts")],
      );
    });

    it("align-54 R3 gap pool F1: refuses a gap sharing a gap text's identifier, at the gap, the second in document order (reading 104 as amended)", () => {
      assert.deepStrictEqual(judged(item([pairs], [gapping(["G"], ["G"])])), [
        repeated(
          `${body}/qti-gap-match-interaction/p/qti-gap/@identifier`,
          "qti-gap",
          "G",
          "qti-gap-text",
        ),
      ]);
    });

    it("align-54 R3 gap pool F1: refuses an inline choice sharing an earlier gap's identifier, at the inline choice, across two interactions (reading 104 as amended)", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [pairs, response("RESPONSE", "single", "identifier")],
            [gapping(["W"], ["A"]), el("p", [], [inlineChoice("RESPONSE", ["A", "B"])])],
          ),
        ),
        [
          repeated(
            `${body}/p/qti-inline-choice-interaction/qti-inline-choice[1]/@identifier`,
            "qti-inline-choice",
            "A",
            "qti-gap",
          ),
        ],
      );
    });

    it("align-54 R3 gap pool F1: refuses a gap named as a declared response, as choice-variable alone (reading 104 as amended)", () => {
      assert.deepStrictEqual(judged(item([pairs], [gapping(["W"], ["PAIRS"])])), [
        {
          detail: {
            check: "choice-variable",
            class: "qti-gap",
            identifier: "PAIRS",
            reading: "104",
          },
          path: `${body}/qti-gap-match-interaction/p/qti-gap/@identifier`,
          rule: "duplicate-identifier" as const,
        },
      ]);
    });

    it("align-54 choice identifiers E19: refuses two gaps sharing an identifier, at the second (reading 104)", () => {
      assert.deepStrictEqual(judged(item([pairs], [gapping(["W"], ["G", "G"])])), [
        repeated(`${body}/qti-gap-match-interaction/p/qti-gap[2]/@identifier`, "qti-gap", "G"),
      ]);
    });
  });

  describe("align-54 body content: a label names its tool, no interaction in a template block, headers, q", () => {
    const body = "qti-assessment-item/qti-item-body";

    it("align-54 body content E31a: refuses a track's label in an item whose root lacks tool-name, as missing-attribute label-tool at the root (reading 128)", () => {
      assert.deepStrictEqual(judged(rooted(item([], [captioned]), [attr("tool-version", "1.0")])), [
        labelTool("tool-name", `${body}/audio/track`),
      ]);
    });

    it("align-54 body content E31a: gives one refusal for an item that labels two elements, naming the first and both tools (reading 128)", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [response("RESPONSE", "single", "identifier")],
            [
              el("p", [attr("label", "stem")], [text("Listen.")]),
              captioned,
              el(
                "qti-choice-interaction",
                [attr("response-identifier", "RESPONSE"), attr("label", "choices")],
                [el("qti-simple-choice", [attr("identifier", "A")], [text("A")])],
              ),
            ],
          ),
        ),
        [labelTool("tool-name tool-version", `${body}/p`)],
      );
    });

    it("align-54 body content E31a: accepts a labelled track beside both tools on the root, and a printed variable's label, which asks for none (reading 128)", () => {
      const tools = [attr("tool-name", "Authoring"), attr("tool-version", "1.0")];

      assert.deepStrictEqual(judged(rooted(item([], [captioned]), tools)), []);
      assert.deepStrictEqual(
        judged(
          item(
            [outcome("SCORE")],
            [
              el(
                "p",
                [],
                [el("qti-printed-variable", [attr("identifier", "SCORE"), attr("label", "Score")])],
              ),
            ],
          ),
        ),
        [],
      );
    });

    const templated = declaration("qti-template-declaration", "T", "single", "identifier");

    it("align-54 body content E37: refuses an interaction at depth two of a qti-template-block, and one deeper, as misplaced-element (reading 143)", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [
              response("RESPONSE", "single", "identifier"),
              response("TYPED", "single", "string"),
              templated,
            ],
            [
              templateBlock([
                choice("RESPONSE"),
                el(
                  "p",
                  [],
                  [el("qti-text-entry-interaction", [attr("response-identifier", "TYPED")])],
                ),
              ]),
            ],
          ),
        ),
        [
          {
            detail: {
              element: "qti-choice-interaction",
              reading: "143",
              requires: "outside a qti-template-block",
            },
            path: `${body}/qti-template-block/qti-content-body/qti-choice-interaction`,
            rule: "misplaced-element",
          },
          {
            detail: {
              element: "qti-text-entry-interaction",
              reading: "143",
              requires: "outside a qti-template-block",
            },
            path: `${body}/qti-template-block/qti-content-body/p/qti-text-entry-interaction`,
            rule: "misplaced-element",
          },
        ],
      );
    });

    it("align-54 body content E37: accepts an inline interaction in a template inline's span (reading 143)", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [response("TYPED", "single", "string"), templated],
            [
              el(
                "p",
                [],
                [
                  el(
                    "qti-template-inline",
                    [attr("identifier", "SHOWN"), ...shownBy("T")],
                    [
                      el(
                        "span",
                        [],
                        [el("qti-text-entry-interaction", [attr("response-identifier", "TYPED")])],
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
        [],
      );
    });

    const cell = `${body}/table/tbody/tr/td`;

    it("align-54 body content E29: refuses a headers token naming no th, and one written twice, as attribute-type headers (reading 126)", () => {
      assert.deepStrictEqual(judged(item([], [headed("H NONE")])), [
        badHeaders(cell, "H NONE", "NONE"),
      ]);
      assert.deepStrictEqual(judged(item([], [headed("H  H")])), [badHeaders(cell, "H  H", "H")]);
    });

    it("align-54 body content E29: refuses a nested table's cell naming the enclosing table's th, and accepts a cell naming its own (reading 126)", () => {
      assert.deepStrictEqual(judged(item([], [headed("H", [headed("H")])])), []);
      assert.deepStrictEqual(
        judged(
          item(
            [],
            [
              headed("H", [
                el(
                  "table",
                  [],
                  [
                    el(
                      "tbody",
                      [],
                      [el("tr", [], [el("td", [attr("headers", "H")], [text("Inner")])])],
                    ),
                  ],
                ),
              ]),
            ],
          ),
        ),
        [badHeaders(`${cell}/table/tbody/tr/td`, "H", "H")],
      );
    });

    /**
     * Construct the `quotation` refusal of the paragraph's `q` (reading 127, E30).
     *
     * @param mark The quotation mark.
     * @param side Where it stands against the `q`.
     * @returns The refusal, as {@link judged} reduces it.
     */
    const quoted = (mark: string, side: string) => ({
      detail: { check: "quotation", element: "q", mark, reading: "127", side },
      path: `${body}/p/q`,
      rule: "text-not-allowed" as const,
    });

    it("align-54 body content E30: refuses quotation marks around a q, once, at the first side (reading 127)", () => {
      assert.deepStrictEqual(judged(item([], [quoting("He said “", "x", "”.")])), [
        quoted("“", "before"),
      ]);
      assert.deepStrictEqual(judged(item([], [quoting("He said ", "x", "» then")])), [
        quoted("»", "after"),
      ]);
      assert.deepStrictEqual(judged(item([], [quoting("He said ", '"x', " then")])), [
        quoted('"', "start"),
      ]);
      assert.deepStrictEqual(judged(item([], [quoting("He said ", "x‘", " then")])), [
        quoted("‘", "end"),
      ]);
    });

    it("align-54 body content E30: accepts an apostrophe beside a q, a space between a mark and a q, and a mark inside it (reading 127)", () => {
      assert.deepStrictEqual(judged(item([], [quoting("the students’", "x", "' then")])), []);
      assert.deepStrictEqual(judged(item([], [quoting("He said “ ", "a “b” c", " ”")])), []);
    });
  });

  describe("align-54 references and declarations: feedback names an outcome; repeated map keys and record fields; the mastery range", () => {
    const body = "qti-assessment-item/qti-item-body";
    const declarationPath = "qti-assessment-item/qti-response-declaration";
    const blockOutcome = `${body}/qti-feedback-block/@outcome-identifier`;
    const singleFloat = { baseType: "float", cardinality: "single" };

    it("align-54 references and declarations E3a: refuses a feedback block naming a response, a template variable or nothing, as undeclared-variable expecting an outcome (reading 77)", () => {
      assert.deepStrictEqual(judged(feedbackItem("RESPONSE")), [
        noOutcome("qti-feedback-block", blockOutcome, "RESPONSE"),
      ]);
      assert.deepStrictEqual(judged(feedbackItem("T")), [
        noOutcome("qti-feedback-block", blockOutcome, "T"),
      ]);
      assert.deepStrictEqual(judged(feedbackItem("NOTHING")), [
        noOutcome("qti-feedback-block", blockOutcome, "NOTHING"),
      ]);
    });

    it("align-54 references and declarations E3a: refuses feedback naming the built-in numAttempts, a response, as undeclared-variable expecting an outcome (reading 77)", () => {
      assert.deepStrictEqual(judged(feedbackItem("numAttempts")), [
        noOutcome("qti-feedback-block", blockOutcome, "numAttempts"),
      ]);
    });

    it("align-54 references and declarations E3a: refuses a feedback block, a feedback inline and a modal feedback naming a float outcome, as expression-type feedback-outcome (reading 77)", () => {
      assert.deepStrictEqual(judged(feedbackItem("SCORE")), [
        feedbackType("qti-feedback-block", blockOutcome, "SCORE", singleFloat),
      ]);
      assert.deepStrictEqual(
        judged(
          item(
            [outcome("SCORE")],
            [el("p", [], [feedback("qti-feedback-inline", "SCORE")])],
            [
              feedback("qti-modal-feedback", "SCORE", [
                el("qti-content-body", [], [el("p", [], [text("Well done.")])]),
              ]),
            ],
          ),
        ),
        [
          feedbackType(
            "qti-feedback-inline",
            `${body}/p/qti-feedback-inline/@outcome-identifier`,
            "SCORE",
            singleFloat,
          ),
          feedbackType(
            "qti-modal-feedback",
            "qti-assessment-item/qti-modal-feedback/@outcome-identifier",
            "SCORE",
            singleFloat,
          ),
        ],
      );
    });

    it("align-54 references and declarations E3a: refuses feedback naming an ordered identifier outcome, as expression-type feedback-outcome (reading 77)", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [declaration("qti-outcome-declaration", "SEEN", "ordered", "identifier")],
            [feedback("qti-feedback-block", "SEEN")],
          ),
        ),
        [
          feedbackType("qti-feedback-block", blockOutcome, "SEEN", {
            baseType: "identifier",
            cardinality: "ordered",
          }),
        ],
      );
    });

    it("align-54 references and declarations E3a: accepts feedback naming a single or multiple identifier outcome, and the built-in completionStatus", () => {
      assert.deepStrictEqual(judged(feedbackItem("FEEDBACK")), []);
      assert.deepStrictEqual(judged(feedbackItem("completionStatus")), []);
      assert.deepStrictEqual(
        judged(
          item(
            [declaration("qti-outcome-declaration", "SEEN", "multiple", "identifier")],
            [feedback("qti-feedback-block", "SEEN")],
          ),
        ),
        [],
      );
    });

    /**
     * The refusal of a map entry whose key repeats an earlier entry's.
     *
     * @param position The repeating entry's position among the mapping's entries.
     * @param key Its `map-key`, as written.
     * @param baseType The base type the keys were compared in, empty when compared as written.
     * @param reading The reading that settles it.
     * @returns The refusal, as {@link judged} reduces it.
     */
    const repeatedKey = (position: number, key: string, baseType: string, reading: string) => ({
      detail: { baseType, check: "map-key", key, reading },
      path: `${declarationPath}/qti-mapping/qti-map-entry[${String(position)}]`,
      rule: "duplicate-identifier" as const,
    });

    it("align-54 references and declarations B5b: refuses 1 and 01 in an integer mapping, and +1 after them, each at the repeating entry (reading 98)", () => {
      assert.deepStrictEqual(mapped("single", "integer", "1", "01", "+1"), [
        repeatedKey(2, "01", "integer", "98"),
        repeatedKey(3, "+1", "integer", "98"),
      ]);
    });

    it("align-54 references and declarations B5b: refuses A B and B A in a pair mapping, and accepts them in a directed pair mapping (reading 98)", () => {
      assert.deepStrictEqual(mapped("multiple", "pair", "A B", "B A"), [
        repeatedKey(2, "B A", "pair", "98"),
      ]);
      assert.deepStrictEqual(mapped("multiple", "directedPair", "A B", "B A"), []);
    });

    it("align-54 references and declarations B5b: refuses 1e400 and 2e400, 1e400 and INF, and 0 and -0 in a float mapping, compared by their doubles (reading 154)", () => {
      assert.deepStrictEqual(mapped("single", "float", "1e400", "2e400"), [
        repeatedKey(2, "2e400", "float", "154"),
      ]);
      assert.deepStrictEqual(mapped("single", "float", "1e400", "INF"), [
        repeatedKey(2, "INF", "float", "154"),
      ]);
      assert.deepStrictEqual(mapped("single", "float", "0", "-0"), [
        repeatedKey(2, "-0", "float", "154"),
      ]);
    });

    it("align-54 references and declarations B5b: refuses a key written twice under a base type that spells nothing, compared as written, and accepts 1 and 01 there (reading 160)", () => {
      assert.deepStrictEqual(mapped("single", " string ", "a", "a"), [
        repeatedKey(2, "a", "", "160"),
      ]);
      assert.deepStrictEqual(mapped("single", " integer ", "1", "01"), []);
    });

    it("align-54 references and declarations B5b: accepts York and york in a string mapping, and 1 and 2 in an integer mapping (reading 98)", () => {
      assert.deepStrictEqual(mapped("single", "string", "York", "york"), []);
      assert.deepStrictEqual(mapped("single", "integer", "1", "2"), []);
    });

    const fieldNamed = attr("field-identifier", "n");
    const integerField = attr("base-type", "integer");

    it("align-54 references and declarations B7: refuses a record value writing a field twice, as duplicate-identifier field at the second (reading 158)", () => {
      assert.deepStrictEqual(
        recordDefault([
          field([fieldNamed, integerField], "5"),
          field([fieldNamed, integerField], "6"),
        ]),
        [
          {
            detail: { check: "field", field: "n", reading: "158" },
            path: `${declarationPath}/qti-default-value/qti-value[2]`,
            rule: "duplicate-identifier",
          },
        ],
      );
    });

    it("align-54 references and declarations B7: accepts one field in a record's correct response and again in its default value, each its own record value", () => {
      const fields = [field([fieldNamed, integerField], "5")];

      assert.deepStrictEqual(
        judged(
          item(
            [
              response("RESPONSE", "record", undefined, [
                el("qti-correct-response", [], fields),
                el("qti-default-value", [], fields),
              ]),
            ],
            [],
          ),
        ),
        [],
      );
    });

    it("align-54 references and declarations E42a: refuses a mastery-value below a written normal-minimum and one above a written normal-maximum, as attribute-type mastery-range (reading 9)", () => {
      assert.deepStrictEqual(mastered({ "mastery-value": "-1", "normal-minimum": "0" }), [
        outOfRange("-1", "least", "0"),
      ]);
      assert.deepStrictEqual(mastered({ "mastery-value": "11", "normal-maximum": "1E1" }), [
        outOfRange("11", "greatest", "1E1"),
      ]);
    });

    it("align-54 references and declarations E42a: accepts a mastery-value within its written bounds or on one, and leaves one with no normal-minimum written to the version's floor (reading 149)", () => {
      assert.deepStrictEqual(
        mastered({ "mastery-value": "0.5", "normal-maximum": "1", "normal-minimum": "0" }),
        [],
      );
      assert.deepStrictEqual(
        mastered({ "mastery-value": "1", "normal-maximum": "1", "normal-minimum": "1" }),
        [],
      );
      assert.deepStrictEqual(mastered({ "mastery-value": "-1" }), []);
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

    describe("a record declaration's qti-value (info.txt:73046)", () => {
      const named = attr("field-identifier", "n");
      const integer = attr("base-type", "integer");

      it("[I-1] a record value names its field: one with no base-type is refused missing-attribute at its @base-type (pantry drops its missing arm)", () => {
        assert.deepStrictEqual(recordDefault([field([named], "5")]), [
          missingField("base-type", `${declarationPath}/qti-default-value/qti-value/@base-type`),
        ]);
      });

      it("[I-1] a record value names its field: one with no field-identifier is refused missing-attribute at its @field-identifier (pantry's RecordFieldIdentifier)", () => {
        assert.deepStrictEqual(
          recordDefault([field([named, integer], "5"), field([integer], "6")]),
          [
            missingField(
              "field-identifier",
              `${declarationPath}/qti-default-value/qti-value[2]/@field-identifier`,
            ),
          ],
        );
      });

      it("[I-1] a record value names its field: a record outcome's default is judged as a response's", () => {
        assert.deepStrictEqual(
          judged(
            item(
              [
                el(
                  "qti-outcome-declaration",
                  [attr("identifier", "R"), attr("cardinality", "record")],
                  [el("qti-default-value", [], [field([integer], "5")])],
                ),
              ],
              [],
            ),
          ),
          [
            missingField(
              "field-identifier",
              "qti-assessment-item/qti-outcome-declaration/qti-default-value/qti-value/@field-identifier",
            ),
          ],
        );
      });

      it("[I-1] a record value names its field: an integer field of x is refused value-type, under its own base-type", () => {
        assert.deepStrictEqual(recordDefault([field([named, integer], "x")]), [
          {
            detail: { baseType: "integer", lexical: "x" },
            path: `${declarationPath}/qti-default-value/qti-value`,
            rule: "value-type",
          },
        ]);
      });

      it("[I-1] accepts a field with field-identifier, base-type and a fitting text, trimmed (reading 7)", () => {
        assert.deepStrictEqual(
          recordDefault([
            field([named, integer], " 5 "),
            field([attr("field-identifier", "s"), attr("base-type", "string")], "abc"),
          ]),
          [],
        );
      });

      it('[I-1] accepts a record declaration that carries base-type="string" itself', () => {
        assert.deepStrictEqual(recordDefault([field([named, integer], "5")], "string"), []);
      });
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

    it("[I-9a] align-54 untimed duration D7: accepts a qti-variable of the built-in duration and of a declared template variable, in a time-dependent item and in one that is not (reading 150)", () => {
      const reading = item(
        [outcome("SCORE"), declaration("qti-template-declaration", "T", "single", "float")],
        [],
        [processing(undefined, [setScore(variable("duration")), setScore(variable("T"))])],
      );

      assert.deepStrictEqual([judged(timed(reading)), judged(reading)], [[], []]);
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

    describe("the built-in duration, which an item has whether it is time dependent or not (reading 150)", () => {
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

      it("[I-9a] align-54 untimed duration D7: accepts a qti-variable of duration in an item that is not time dependent", () => {
        assert.deepStrictEqual(
          judged(settingOutcome([outcome("SCORE")], "SCORE", variable("duration"))),
          [],
        );
      });

      it("[I-9a] align-54 untimed duration D7: refuses qti-any-n's min naming duration in an item that is not time dependent only as no template or outcome variable (P24)", () => {
        assert.deepStrictEqual(
          judged(settingOutcome([outcome("PASSED", "boolean")], "PASSED", anyN)),
          [builtInNamed],
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

    it("[I-9a] align-54 untimed duration D7: accepts setting it from duration, a float in an item time dependent or not (readings 29 and 150)", () => {
      const setting = item(
        [outcome("SCORE")],
        [],
        [processing(undefined, [setScore(variable("duration"))])],
      );

      assert.deepStrictEqual([judged(timed(setting)), judged(setting)], [[], []]);
    });

    it("accepts setting the float SCORE from a qti-field-value of QTI_CONTEXT, a single of unknown base type", () => {
      assert.deepStrictEqual(settingScore(fieldValue(variable("QTI_CONTEXT"))), []);
    });

    it("refuses a qti-field-value of a single string at the qti-field-value, its operand not a record (P23)", () => {
      assert.deepStrictEqual(settingScore(fieldValue(baseValue("string", "a"))), [
        {
          detail: {
            acceptsBaseTypes: "any",
            acceptsCardinalities: "record",
            check: "operand",
            element: "qti-field-value",
            expressionBaseType: "string",
            expressionCardinality: "single",
            operand: "1",
          },
          path: `${rulePath}/qti-field-value`,
          rule: "expression-type",
        },
      ]);
    });

    describe("a record operand (P23)", () => {
      it("refuses a qti-sum of a record response at the qti-sum", () => {
        assert.deepStrictEqual(overRecords([setScore(el("qti-sum", [], [variable("REC")]))]), [
          {
            detail: {
              acceptsBaseTypes: "integer float",
              acceptsCardinalities: "multiple ordered single",
              check: "operand",
              element: "qti-sum",
              expressionBaseType: "",
              expressionCardinality: "record",
              operand: "1",
            },
            path: `${rulePath}/qti-sum`,
            rule: "expression-type",
          },
        ]);
      });

      it("refuses setting the float SCORE from a record response", () => {
        assert.deepStrictEqual(overRecords([setScore(variable("REC"))]), [
          {
            detail: {
              element: "qti-set-outcome-value",
              expressionBaseType: "",
              expressionCardinality: "record",
              identifier: "SCORE",
              outcomeBaseType: "float",
              outcomeCardinality: "single",
            },
            path: rulePath,
            rule: "expression-type",
          },
        ]);
      });

      it("accepts a qti-is-null of a record response and a qti-match of two", () => {
        assert.deepStrictEqual(
          overRecords([
            setOutcome("SAME", isNull("REC")),
            setOutcome("SAME", el("qti-match", [], [variable("REC"), variable("OTHER")])),
          ]),
          [],
        );
      });
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

      it("accepts a qti-field-value operand, a single of unknown base type", () => {
        assert.deepStrictEqual(
          comparing(fieldValue(variable("QTI_CONTEXT")), baseValue("integer", "1")),
          [],
        );
      });

      it("refuses only the string operand beside a qti-field-value, whose base type is unknown", () => {
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

    it("types a qti-match of a qti-field-value a single boolean, so it refuses setting the float SCORE from one", () => {
      assert.deepStrictEqual(
        settingScore(
          el("qti-match", [], [fieldValue(variable("QTI_CONTEXT")), baseValue("string", "a")]),
        ),
        [scoreRefused("boolean")],
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

      it("accepts a qti-field-value operand under a match table, whose base type is unknown", () => {
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

      it("[I-9a] accepts a qti-field-value condition, a single of unknown base type (P21)", () => {
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

    it("[I-9a] align-54 built-ins by kind E22a: accepts a lookup that targets the built-in completionStatus, as it accepts a qti-set-outcome-value of it: each sets an outcome, which the built-in stands as (reading 111)", () => {
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

  describe("align-54 built-ins by kind: a built-in is named as the kind of variable it stands as (reading 111)", () => {
    const responsePath = "qti-assessment-item/qti-response-processing";
    const templatePath = "qti-assessment-item/qti-template-processing";

    it("align-54 built-ins by kind E22a: accepts a qti-correct of the built-in responses numAttempts and duration", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [outcome("B", "boolean")],
            [],
            [
              processing(undefined, [
                setOutcome("B", nullOf(variable("numAttempts", "qti-correct"))),
                setOutcome("B", nullOf(variable("duration", "qti-correct"))),
              ]),
            ],
          ),
        ),
        [],
      );
    });

    it("align-54 built-ins by kind E22a: accepts a template qti-set-default-value of completionStatus and of numAttempts, and a qti-set-correct-response of numAttempts", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [outcome("SCORE")],
            [],
            [
              templateProcessing(
                settingRule(
                  "qti-set-default-value",
                  "completionStatus",
                  baseValue("identifier", "completed"),
                ),
                settingRule("qti-set-default-value", "numAttempts", baseValue("integer", "1")),
                settingRule("qti-set-correct-response", "numAttempts", baseValue("integer", "1")),
              ),
            ],
          ),
        ),
        [],
      );
    });

    it("align-54 built-ins by kind E22a: types a built-in a template rule sets as the built-in, refusing a float default of numAttempts as expression-type with the kind response (P20)", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [outcome("SCORE")],
            [],
            [
              templateProcessing(
                settingRule("qti-set-default-value", "numAttempts", baseValue("float", "1.5")),
              ),
            ],
          ),
        ),
        [
          {
            detail: {
              element: "qti-set-default-value",
              expressionBaseType: "float",
              expressionCardinality: "single",
              identifier: "numAttempts",
              outcomeBaseType: "integer",
              outcomeCardinality: "single",
              targetKind: "response",
            },
            path: `${templatePath}/qti-set-default-value`,
            rule: "expression-type",
          },
        ],
      );
    });

    it("align-54 built-ins by kind E22a: still refuses a qti-map-response of numAttempts and a qti-map-response-point of duration, as template-requirements: a built-in declares no mapping (P27)", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [outcome("SCORE")],
            [],
            [
              processing(undefined, [
                setScore(variable("numAttempts", "qti-map-response")),
                setScore(mapPoint("duration")),
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
              identifier: "numAttempts",
            },
            path: `${responsePath}/qti-set-outcome-value[1]/qti-map-response`,
            rule: "template-requirements",
          },
          {
            detail: {
              baseType: "point",
              child: "qti-area-mapping",
              declaration: "qti-response-declaration",
              element: "qti-map-response-point",
              identifier: "duration",
            },
            path: `${responsePath}/qti-set-outcome-value[2]/qti-map-response-point`,
            rule: "template-requirements",
          },
        ],
      );
    });

    it("align-54 built-ins by kind E22a: still refuses a qti-set-correct-response of the built-in outcome completionStatus and a qti-set-outcome-value of the built-in response numAttempts, as undeclared-variable", () => {
      assert.deepStrictEqual(
        judged(
          item(
            [outcome("SCORE")],
            [],
            [
              templateProcessing(
                settingRule(
                  "qti-set-correct-response",
                  "completionStatus",
                  baseValue("identifier", "completed"),
                ),
              ),
              processing(undefined, [setOutcome("numAttempts", baseValue("integer", "1"))]),
            ],
          ),
        ),
        [
          {
            detail: {
              element: "qti-set-correct-response",
              expected: "response",
              identifier: "completionStatus",
            },
            path: `${templatePath}/qti-set-correct-response`,
            rule: "undeclared-variable",
          },
          {
            detail: {
              element: "qti-set-outcome-value",
              expected: "outcome",
              identifier: "numAttempts",
            },
            path: `${responsePath}/qti-set-outcome-value`,
            rule: "undeclared-variable",
          },
        ],
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
            detail: { class: "qti-simple-choice", identifier: "A", reading: "104" },
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
 * The refusal of a {@link namingResponse} test: its expression names no response, and the test,
 * which declares none, is the declarer.
 *
 * @param identifier The name the expression gives.
 * @param local The expression's local name.
 * @returns The one refusal, reduced as {@link processed} reduces it.
 */
const noResponse = (identifier: string, local: string) => [
  {
    detail: { declarer: "test", element: local, expected: "response", identifier },
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

/**
 * The typer of {@link weightedReads}: `ITEM1.INT` an integer, `ITEM1.FLT` a float and
 * `ITEM1.RESPONSE` an identifier, each single, and every other name `unknown`.
 *
 * @param read The prefixed read.
 * @returns Its type.
 */
const itemTyping: PrefixedTyper = (read) =>
  Option.match(
    Option.fromUndefinedOr(
      new Map<string, ExpressionType["baseType"]>([
        ["ITEM1.FLT", "float"],
        ["ITEM1.INT", "integer"],
        ["ITEM1.RESPONSE", "identifier"],
      ]).get(read),
    ),
    {
      onNone: () => ({ baseType: "unknown", cardinality: "unknown" }),
      onSome: singleOf,
    },
  );

/**
 * Construct a `qti-variable` weighted by the weight `W`.
 *
 * @param identifier The name it reads.
 * @returns The expression.
 */
const weightedVariable = (identifier: string): SourceElement =>
  el("qti-variable", [attr("identifier", identifier), attr("weight-identifier", "W")]);

/**
 * Check a {@link ruledTest} with the float `F`, the integer `N` and `K` and the boolean `B` whose
 * outcome processing sets one of them to an expression, under a typer.
 *
 * @param target The outcome it sets.
 * @param expression The expression.
 * @param typePrefixed The typer of its prefixed reads, {@link itemTyping} unless given.
 * @returns The refusals.
 */
const weightedReads = (
  target: "B" | "F" | "N",
  expression: SourceElement,
  typePrefixed: PrefixedTyper = itemTyping,
) =>
  processed(
    ruledTest(
      [outcome("F"), outcome("N", "integer"), outcome("K", "integer"), outcome("B", "boolean")],
      [setOutcome(target, expression)],
    ),
    typePrefixed,
  );

/**
 * The refusal of a {@link weightedReads} test that sets the integer `N` to a single float.
 */
const floatIntoN = [
  {
    detail: {
      element: "qti-set-outcome-value",
      expressionBaseType: "float",
      expressionCardinality: "single",
      identifier: "N",
      outcomeBaseType: "integer",
      outcomeCardinality: "single",
    },
    path: outcomeRulePath("qti-set-outcome-value"),
    rule: "expression-type",
  },
];

/**
 * Check a {@link ruledTest} with the float multiple `ALL` and the float single `SUM` whose outcome
 * processing sets one of them from an unweighted `qti-test-variables` of `PTS` with no
 * `base-type`, `SUM` through `qti-sum`, every prefixed read `unknown`.
 *
 * @param target The outcome it sets.
 * @param typeCollected The typer of a collection's base type, none unless given.
 * @returns The refusals, reduced to their rule, path and detail.
 */
const collectedReads = (target: "ALL" | "SUM", typeCollected?: CollectedTyper) => {
  const collection = el("qti-test-variables", [attr("variable-identifier", "PTS")]);

  return processingRefusals(
    ruledTest(
      [
        el("qti-outcome-declaration", [
          attr("identifier", "ALL"),
          attr("cardinality", "multiple"),
          attr("base-type", "float"),
        ]),
        outcome("SUM"),
      ],
      [setOutcome(target, target === "ALL" ? collection : el("qti-sum", [], [collection]))],
    ),
    tables,
    unknownTyping,
    undefined,
    Option.none(),
    typeCollected,
  ).map((refusal) => ({
    detail: refusal.detail,
    path: refusal.location.kind === "path" ? refusal.location.path : refusal.location.kind,
    rule: refusal.rule,
  }));
};

/**
 * A collected typer that gives every collection an integer, as items that declare it integer do.
 *
 * @returns The base type `integer`.
 */
const integerTyping: CollectedTyper = () => "integer";

/**
 * A collected typer that gives every collection a float, as an item that declares it float does.
 *
 * @returns The base type `float`.
 */
const floatTyping: CollectedTyper = () => "float";

/**
 * The refusal of a {@link collectedReads} test that sets its target from an integer collection.
 *
 * @param target The outcome it sets.
 * @returns The refusal, an integer of the target's cardinality into a float.
 */
const integerInto = (target: "ALL" | "SUM") => [
  {
    detail: {
      element: "qti-set-outcome-value",
      expressionBaseType: "integer",
      expressionCardinality: target === "ALL" ? "multiple" : "single",
      identifier: target,
      outcomeBaseType: "float",
      outcomeCardinality: target === "ALL" ? "multiple" : "single",
    },
    path: outcomeRulePath("qti-set-outcome-value"),
    rule: "expression-type",
  },
];

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

  it("[T-9] weighted read is a float: a weighted ITEM1.INT, an integer item variable read through its prefix, sets the float F and is refused setting the integer N, which the unweighted read sets (G-R3 198, pantry P20)", () => {
    assert.deepStrictEqual(
      [
        weightedReads("F", weightedVariable("ITEM1.INT")),
        weightedReads("N", weightedVariable("ITEM1.INT")),
        weightedReads("N", variable("ITEM1.INT")),
      ],
      [[], floatIntoN, []],
    );
  });

  it("[T-9] weighted read is a float only of an integer read through its prefix: a weighted ITEM1.FLT stays a float, a weighted ITEM1.RESPONSE keeps identifier, a weighted K the test declares keeps integer, and under the unknown typer a weighted read stays unknown (G-R3 186 and 198)", () => {
    const matched = el(
      "qti-match",
      [],
      [weightedVariable("ITEM1.RESPONSE"), baseValue("identifier", "A")],
    );

    assert.deepStrictEqual(
      [
        weightedReads("F", weightedVariable("ITEM1.FLT")),
        weightedReads("N", weightedVariable("ITEM1.FLT")),
        weightedReads("B", matched),
        weightedReads("N", weightedVariable("K")),
        weightedReads("N", weightedVariable("ITEM1.INT"), unknownTyping),
      ],
      [[], floatIntoN, [], [], []],
    );
  });

  it("[T-9] collection typed from the items: an integer PTS collected with no base-type is refused setting the float multiple ALL and, summed, the float SUM, a float PTS sets both, and with no collected typer the collection is unknown and sets both (G-R3 199, pantry P20)", () => {
    assert.deepStrictEqual(
      [
        collectedReads("ALL", integerTyping),
        collectedReads("SUM", integerTyping),
        collectedReads("ALL", floatTyping),
        collectedReads("SUM", floatTyping),
        collectedReads("ALL"),
        collectedReads("SUM"),
      ],
      [integerInto("ALL"), integerInto("SUM"), [], [], [], []],
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
            detail: {
              declarer: "test",
              element: "qti-map-response",
              expected: "response",
              identifier: "SCORE",
            },
            path: `${rulePath}/qti-map-response`,
            rule: "undeclared-variable",
          },
        ],
        [
          {
            detail: {
              declarer: "test",
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
            detail: {
              declarer: "test",
              element: "qti-variable",
              expected: "variable",
              identifier: "NOPE",
            },
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

  it("[T-9] names the test as the declarer of a name nothing answers in a test's outcome processing or in a section document a test reaches: its qti-variable of NOPE, its qti-round-to's figures of NOPE, the section's pre-condition over NOPE, and a qti-map-response of the test outcome A.B it declares whole", () => {
    const reaching = scoringTest(baseValue("float", "1"));

    assert.deepStrictEqual(
      [
        processed(scoringTest(variable("NOPE")), unknownTyping),
        processed(
          scoringTest(
            el(
              "qti-round-to",
              [attr("figures", "NOPE"), attr("rounding-mode", "decimalPlaces")],
              [variable("SCORE")],
            ),
          ),
          unknownTyping,
        ),
        processed(conditionedSection(variable("NOPE")), unknownTyping, undefined, reaching),
        namingResponse("A.B", "qti-map-response"),
      ],
      [
        [
          {
            detail: {
              declarer: "test",
              element: "qti-variable",
              expected: "variable",
              identifier: "NOPE",
            },
            path: `${outcomeRulePath("qti-set-outcome-value")}/qti-variable`,
            rule: "undeclared-variable",
          },
        ],
        [
          {
            detail: {
              attribute: "figures",
              declarer: "test",
              element: "qti-round-to",
              expected: "variable",
              identifier: "NOPE",
            },
            path: `${outcomeRulePath("qti-set-outcome-value")}/qti-round-to`,
            rule: "undeclared-variable",
          },
        ],
        [
          {
            detail: {
              declarer: "test",
              element: "qti-variable",
              expected: "variable",
              identifier: "NOPE",
            },
            path: "qti-assessment-section/qti-pre-condition/qti-variable",
            rule: "undeclared-variable",
          },
        ],
        noResponse("A.B", "qti-map-response"),
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
          detail: {
            declarer: "test",
            element: "qti-set-outcome-value",
            expected: "outcome",
            identifier,
          },
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
 * What one refusal reduces to in these tests: its rule, its path and its detail.
 */
type Judged = ReturnType<typeof judged>[number];

/**
 * Check a document whole, as `open` does, and reduce a refusing verdict's refusals as
 * {@link judged} does. A test's declarations are judged by the test model's builder, which no rule
 * of `processingRefusals` runs, so only the whole check reaches a test outcome's default value.
 *
 * @param source The document.
 * @returns The refusals, reduced; empty for an accepting verdict.
 */
const verdictRefusals = (source: SourceDocument): readonly Judged[] => {
  const verdict = check(source, tables, Option.none());
  assert.notStrictEqual(verdict.verdict, "unchecked");

  return verdict.verdict === "refused"
    ? verdict.refusals.map((refusal) => ({
        detail: refusal.detail,
        path: refusal.location.kind === "path" ? refusal.location.path : refusal.location.kind,
        rule: refusal.rule,
      }))
    : [];
};

/**
 * Construct a rule that sets the boolean outcome `PASSED` to a `qti-base-value` of base type
 * boolean.
 *
 * @param written The value's text, as written.
 * @returns The `qti-set-outcome-value`.
 */
const setPassed = (written: string): SourceElement =>
  el("qti-set-outcome-value", [attr("identifier", "PASSED")], [baseValue("boolean", written)]);

/**
 * One place plate reads a boolean value's text, with the path a refusal of it is at.
 */
interface BooleanPlace {
  /**
   * Judge a document that holds the value at this place.
   */
  readonly judge: (written: string) => readonly Judged[];
  /**
   * The place, as a case's title names it.
   */
  readonly name: string;
  /**
   * The path of the value's element.
   */
  readonly path: string;
  /**
   * The feature tag a case at this place carries, with its space: `[I-1]` where it judges a
   * response declaration, else none.
   */
  readonly tag: string;
}

/**
 * The five places a boolean `qti-value` or `qti-base-value` is read from its text: an item's
 * response and template declarations and its response processing, and a test's outcome
 * declaration and outcome processing.
 */
const booleanPlaces: readonly BooleanPlace[] = [
  {
    judge: (written) =>
      judged(
        item(
          [response("RESPONSE", "single", "boolean", [values("qti-correct-response", written)])],
          [],
        ),
      ),
    name: "a response's qti-correct-response",
    path: "qti-assessment-item/qti-response-declaration/qti-correct-response/qti-value",
    tag: "[I-1] ",
  },
  {
    judge: (written) =>
      judged(
        item(
          [
            el(
              "qti-template-declaration",
              [
                attr("identifier", "T"),
                attr("cardinality", "single"),
                attr("base-type", "boolean"),
              ],
              [values("qti-default-value", written)],
            ),
          ],
          [],
        ),
      ),
    name: "a template's qti-default-value",
    path: "qti-assessment-item/qti-template-declaration/qti-default-value/qti-value",
    tag: "",
  },
  {
    judge: (written) =>
      judged(
        item([outcome("PASSED", "boolean")], [], [processing(undefined, [setPassed(written)])]),
      ),
    name: "response processing's qti-base-value",
    path: "qti-assessment-item/qti-response-processing/qti-set-outcome-value/qti-base-value",
    tag: "",
  },
  {
    judge: (written) =>
      verdictRefusals(
        ruledTest([outcome("PASSED", "boolean", [values("qti-default-value", written)])], []),
      ),
    name: "a test outcome's qti-default-value",
    path: "qti-assessment-test/qti-outcome-declaration/qti-default-value/qti-value",
    tag: "",
  },
  {
    judge: (written) =>
      processed(ruledTest([outcome("PASSED", "boolean")], [setPassed(written)]), unknownTyping),
    name: "a test's outcome processing's qti-base-value",
    path: "qti-assessment-test/qti-outcome-processing/qti-set-outcome-value/qti-base-value",
    tag: "",
  },
];

describe("a boolean qti-value or qti-base-value is true or false (reading 34)", () => {
  for (const place of booleanPlaces) {
    for (const lexical of ["1", "0", "TRUE"]) {
      it(`${place.tag}refuses the boolean value text '${lexical}' in ${place.name} as value-type`, () => {
        assert.deepStrictEqual(place.judge(lexical), [
          { detail: { baseType: "boolean", lexical }, path: place.path, rule: "value-type" },
        ]);
      });
    }

    it(`${place.tag}accepts the boolean value text ' true ' in ${place.name}, its outer whitespace trimmed (reading 7)`, () => {
      assert.deepStrictEqual(place.judge(" true "), []);
    });
  }
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

describe("align-54 body content: a name that is no NCName gets its value refusal alone", () => {
  it("align-54 body content E40a: gives a declaration identifier that spells no NCName only its value refusal, and the bindings and reads that name it theirs (reading 152)", () => {
    const refused = verdictRefusals(
      item(
        [
          response("1a", "single", "identifier"),
          response("1a", "single", "identifier"),
          outcome("SCORE"),
        ],
        [choice("1a")],
        [processing(undefined, [setScore(variable("2b"))])],
      ),
    );

    assert.deepStrictEqual(
      refused.map(({ path, rule }) => [rule, path]),
      [
        ["attribute-type", "qti-assessment-item/qti-response-declaration[1]/@identifier"],
        ["attribute-type", "qti-assessment-item/qti-response-declaration[2]/@identifier"],
        [
          "attribute-type",
          "qti-assessment-item/qti-item-body/qti-choice-interaction/@response-identifier",
        ],
        [
          "attribute-type",
          "qti-assessment-item/qti-response-processing/qti-set-outcome-value/qti-variable/@identifier",
        ],
      ],
    );
  });

  it("align-54 body content E40a: does not judge a value's type under a declaration whose cardinality spells nothing (reading 158)", () => {
    const counted = el(
      "qti-outcome-declaration",
      [attr("identifier", "N"), attr("cardinality", "many"), attr("base-type", "integer")],
      [values("qti-default-value", "x")],
    );

    assert.deepStrictEqual(
      verdictRefusals(item([counted], [])).map(({ path, rule }) => [rule, path]),
      [["attribute-type", "qti-assessment-item/qti-outcome-declaration/@cardinality"]],
    );
  });
});

/**
 * The path of the `span` {@link spoken} writes.
 */
const spokenSpan = "qti-assessment-item/qti-item-body/p/span";

/**
 * Construct an item whose paragraph holds a `span` with the given `data-ssml`.
 *
 * @param value The `span`'s `data-ssml`, as the XML reader gives it.
 * @returns The item.
 */
const spoken = (value: string): SourceDocument =>
  item(
    [],
    [
      el(
        "p",
        [],
        [text("Our word is "), el("span", [attr("data-ssml", value)], [text("mRNA")]), text(".")],
      ),
    ],
  );

/**
 * Construct the `data-ssml` refusal of {@link spoken}'s `span` (the operator's P3).
 *
 * @param problem The problem its decoding names.
 * @returns The refusal, as {@link judged} reduces it.
 */
const badSsml = (problem: string): Judged => ({
  detail: { attribute: "data-ssml", check: "data-ssml", element: "span", problem },
  path: `${spokenSpan}/@data-ssml`,
  rule: "attribute-type",
});

describe("align-54 Data-SSML: a data-ssml value is Data-SSML JSON (the operator's P3)", () => {
  it('align-54 Data-SSML P3: refuses data-ssml="hello", which is not JSON, as attribute-type data-ssml with problem json at the attribute', () => {
    assert.deepStrictEqual(judged(spoken("hello")), [badSsml("json")]);
  });

  it("align-54 Data-SSML P3: refuses an unknown property, a value of the wrong type and a value outside its list, each as attribute-type data-ssml with its problem", () => {
    assert.deepStrictEqual(
      [
        '{"speak":{"alias":"messenger RNA"}}',
        '{"sub":{"alias":3}}',
        '{"say-as":{"interpret-as":"spell-out"}}',
      ].map((value) => judged(spoken(value))),
      [[badSsml("name")], [badSsml("type")], [badSsml("value")]],
    );
  });

  it("align-54 Data-SSML P3: accepts a data-ssml that is Data-SSML JSON, keeping the span's data-ssml mark", () => {
    const source = spoken('{"sub":{"alias":"messenger RNA"}}');
    const verdict = check(source, tables, Option.none());

    assert.deepStrictEqual(judged(source), []);
    assert.deepStrictEqual(
      verdict.verdict === "accepted-with-unsupported" && verdict.kind === "item"
        ? verdict.accepted.unsupported
        : verdict.verdict,
      [{ feature: "data-ssml", path: spokenSpan, shown: "mark" }],
    );
  });

  it("align-54 Data-SSML P3: does not judge a data-ssml an attribute wildcard admits on a kind that does not declare it (rule 5b8ee08b)", () => {
    const listed = item(
      [],
      [el("ul", [], [el("li", [attr("data-ssml", "hello")], [text("mRNA")])])],
    );

    assert.deepStrictEqual(judged(listed), []);
    assert.deepStrictEqual(verdictRefusals(listed), []);
  });
});

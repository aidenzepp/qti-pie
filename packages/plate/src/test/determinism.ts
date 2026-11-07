/**
 * Criterion 7's fixture: one hand-built templated item, its source, the seed and instance it runs
 * under, and what it gives there, pinned, so the same template values, HTML and outcomes can be
 * asserted on every run in Node (`src/engine/determinism.test.ts`) and in Chromium's and WebKit's
 * pages.
 *
 * {@link determinismItem} is the model `open` builds from {@link determinismXml}, written as a
 * literal so a page, which cannot run `open`, loads it. Its template processing draws an integer
 * under a `qti-template-constraint` that restarts under {@link determinismSeed}, draws a float and
 * takes its `qti-math-operator` `sin`, draws in a `qti-and` operand after a false one, and holds a
 * draw in a `qti-template-condition` branch not taken, so the values pin spec §4.2's operand order:
 * every operand evaluated left to right, a condition's branches until the first true one. It sets
 * the correct response and the template variable that shows one template block and one choice
 * and hides another of each. Its body prints three template values. Its response processing scores
 * the template-visible choice from a template value and draws an outcome.
 *
 * {@link observe} drives a record through the browser entries only (`redactItem`, `render`,
 * `runAttempt`), and {@link startRecord} starts one with `firstAttempt`, so a page runs the same
 * steps as Node.
 *
 * {@link determinismTest} is a hand-built test that delivers the item as `ITEM1`, and
 * {@link determinismScope} its test scope after the item's pinned attempt, both literals a page
 * loads. Its outcome processing draws an integer, then draws in the second branch of a condition
 * whose first branch, not taken, holds a draw, and reads the item's `SCORE` through its item ref.
 * {@link observeOutcomes} runs it as runs 1 and 2 of a session through `runOutcomes`, each from the
 * stream `outcomeLabel` keys by the seed, and {@link pinnedOutcomeDraws} pins what it gives under
 * {@link determinismSeed}.
 *
 * {@link pickerRef} is an item ref with two drawing template defaults, `LOW` and `HIGH`, over
 * {@link pickerItem}, a templated item whose template processing reads them: it draws `PICK`
 * between them and sets `SPAN` to their difference. {@link observeDefaults} evaluates the defaults
 * through `evaluateTemplateDefaults` from the stream `defaultLabel` keys by the seed for the
 * session's first item, then starts the item with them through `firstAttempt`, and
 * {@link pinnedDefaultDraws} pins what it gives under {@link determinismSeed}.
 *
 * Test support only, loadable in a page: it value-imports only browser modules and, from `effect`,
 * only `Option` and `Result`.
 *
 * @module
 */
import { Option, Result } from "effect";
import type { Configuration } from "#plate/configuration.ts";
import type { UnknownPart } from "#plate/emit/parts.ts";
import type { PartSwapRefused } from "#plate/emit/swap.ts";
import { firstAttempt, runAttempt } from "#plate/engine/attempt.ts";
import type { EngineFailure } from "#plate/engine/evaluate.ts";
import { runOutcomes } from "#plate/engine/outcome.ts";
import { defaultLabel, drawStream, outcomeLabel } from "#plate/engine/random.ts";
import type { TestScope } from "#plate/engine/scope.ts";
import { evaluateTemplateDefaults } from "#plate/engine/template.ts";
import type { Expression, Rule, TemplateRule } from "#plate/model/expression.ts";
import type {
  BodyNode,
  Item,
  OutcomeDeclaration,
  PrintedVariable,
  SimpleChoice,
  TemplateDeclaration,
  TemplateVisibility,
} from "#plate/model/item.ts";
import { startingValue } from "#plate/model/record.ts";
import type { ItemRecord } from "#plate/model/record.ts";
import type { ItemRef, Test } from "#plate/model/test.ts";
import type { ModelledBaseType, Value } from "#plate/model/values.ts";
import { redactItem } from "#plate/payload.ts";
import { render } from "#plate/render.ts";
import type { InvalidInstance, OutputTooLarge } from "#plate/render.ts";
import { float, integer } from "#plate/test/fixtures.ts";

/**
 * The location the fixture's document carries, as `open` takes it and the model holds it.
 */
export const determinismLocation = "items/determinism.xml";

/**
 * The seed every pinned value is drawn under. Under it the constraint `N >= 5` fails on the first
 * pass (N = 2) and the run restarts once.
 */
export const determinismSeed = "alpha";

/**
 * A second seed, under which the template values differ from the pinned ones.
 */
export const otherSeed = "omega";

/**
 * The instance every record and render of the fixture uses.
 */
export const determinismInstance = "det";

/**
 * The configuration every render of the fixture uses, a plain literal of the defaults, so a page
 * loads it without the configuration's Schema.
 */
export const determinismConfiguration: Configuration = {
  allowComment: false,
  allowReview: true,
  allowSkipping: true,
  assetBase: "",
  headingLevel: 2,
  locale: "en",
  maxAttempts: 1,
  outputBudget: 16_777_216,
  showFeedback: false,
  showSolution: false,
  validateResponses: false,
};

/**
 * Construct a single identifier value.
 *
 * @param value The identifier.
 * @returns The value holding it.
 */
const identifier = (value: string): Value => ({
  baseType: "identifier",
  cardinality: "single",
  values: [{ baseType: "identifier", value }],
});

/**
 * Construct a single boolean value.
 *
 * @param value The boolean.
 * @returns The value holding it.
 */
const boolean = (value: boolean): Value => ({
  baseType: "boolean",
  cardinality: "single",
  values: [{ baseType: "boolean", value }],
});

/**
 * The one response the attempt gives: the choice `B`, which the template variable `CHOICE` shows.
 */
export const determinismResponses: ItemRecord["responses"] = { RESPONSE: identifier("B") };

/**
 * The fixture's document, hand-built (rule `3ad87993`). Its body is written with no whitespace
 * between elements, so the model holds no text between them.
 */
export const determinismXml = `<?xml version="1.0" encoding="UTF-8"?>
<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="determinism" title="Determinism" time-dependent="false" xml:lang="en">
  <qti-response-declaration identifier="RESPONSE" base-type="identifier" cardinality="single"/>
  <qti-outcome-declaration identifier="SCORE" base-type="float" cardinality="single"/>
  <qti-outcome-declaration identifier="DRAWN" base-type="integer" cardinality="single"/>
  <qti-template-declaration identifier="N" base-type="integer" cardinality="single">
    <qti-default-value><qti-value>0</qti-value></qti-default-value>
  </qti-template-declaration>
  <qti-template-declaration identifier="X" base-type="float" cardinality="single"/>
  <qti-template-declaration identifier="S" base-type="float" cardinality="single"/>
  <qti-template-declaration identifier="BOTH" base-type="boolean" cardinality="single"/>
  <qti-template-declaration identifier="M" base-type="integer" cardinality="single"/>
  <qti-template-declaration identifier="CHOICE" base-type="identifier" cardinality="single"/>
  <qti-template-processing>
    <qti-set-template-value identifier="N">
      <qti-random-integer min="1" max="9"/>
    </qti-set-template-value>
    <qti-template-constraint>
      <qti-gte>
        <qti-variable identifier="N"/>
        <qti-base-value base-type="integer">5</qti-base-value>
      </qti-gte>
    </qti-template-constraint>
    <qti-set-template-value identifier="X">
      <qti-random-float min="0" max="10"/>
    </qti-set-template-value>
    <qti-set-template-value identifier="S">
      <qti-math-operator name="sin">
        <qti-variable identifier="X"/>
      </qti-math-operator>
    </qti-set-template-value>
    <qti-set-template-value identifier="BOTH">
      <qti-and>
        <qti-base-value base-type="boolean">false</qti-base-value>
        <qti-gte>
          <qti-random-integer min="0" max="99"/>
          <qti-base-value base-type="integer">0</qti-base-value>
        </qti-gte>
      </qti-and>
    </qti-set-template-value>
    <qti-template-condition>
      <qti-template-if>
        <qti-lt>
          <qti-variable identifier="N"/>
          <qti-base-value base-type="integer">0</qti-base-value>
        </qti-lt>
        <qti-set-template-value identifier="M">
          <qti-random-integer min="0" max="99"/>
        </qti-set-template-value>
      </qti-template-if>
      <qti-template-else>
        <qti-set-template-value identifier="M">
          <qti-random-integer min="100" max="199"/>
        </qti-set-template-value>
      </qti-template-else>
    </qti-template-condition>
    <qti-set-template-value identifier="CHOICE">
      <qti-base-value base-type="identifier">B</qti-base-value>
    </qti-set-template-value>
    <qti-set-correct-response identifier="RESPONSE">
      <qti-variable identifier="CHOICE"/>
    </qti-set-correct-response>
  </qti-template-processing>
  <qti-item-body><p>N is <qti-printed-variable identifier="N"/>, M is <qti-printed-variable identifier="M"/> and the sine of X is <qti-printed-variable identifier="S"/>.</p><qti-template-block template-identifier="CHOICE" identifier="B" show-hide="show"><qti-content-body><p>Block B is shown.</p></qti-content-body></qti-template-block><qti-template-block template-identifier="CHOICE" identifier="C" show-hide="show"><qti-content-body><p>Block C is hidden.</p></qti-content-body></qti-template-block><qti-choice-interaction response-identifier="RESPONSE" max-choices="1"><qti-prompt>Pick the choice CHOICE names.</qti-prompt><qti-simple-choice identifier="A">Always shown</qti-simple-choice><qti-simple-choice identifier="B" template-identifier="CHOICE" show-hide="show">Shown by CHOICE</qti-simple-choice><qti-simple-choice identifier="C" template-identifier="CHOICE" show-hide="show">Hidden by CHOICE</qti-simple-choice></qti-choice-interaction></qti-item-body>
  <qti-response-processing>
    <qti-response-condition>
      <qti-response-if>
        <qti-match>
          <qti-variable identifier="RESPONSE"/>
          <qti-correct identifier="RESPONSE"/>
        </qti-match>
        <qti-set-outcome-value identifier="SCORE">
          <qti-sum>
            <qti-base-value base-type="float">1</qti-base-value>
            <qti-variable identifier="S"/>
          </qti-sum>
        </qti-set-outcome-value>
      </qti-response-if>
      <qti-response-else>
        <qti-set-outcome-value identifier="SCORE">
          <qti-base-value base-type="float">0</qti-base-value>
        </qti-set-outcome-value>
      </qti-response-else>
    </qti-response-condition>
    <qti-set-outcome-value identifier="DRAWN">
      <qti-random-integer min="1" max="6"/>
    </qti-set-outcome-value>
  </qti-response-processing>
</qti-assessment-item>
`;

/**
 * Construct a `qti-base-value`.
 *
 * @param value Its value.
 * @returns The expression.
 */
const baseValue = (value: Value): Expression => ({ kind: "base-value", operands: [], value });

/**
 * Construct a `qti-variable` with no `weight-identifier`.
 *
 * @param name The variable's identifier.
 * @returns The expression.
 */
const variable = (name: string): Expression => ({
  identifier: name,
  kind: "variable",
  operands: [],
  weightIdentifier: Option.none(),
});

/**
 * Construct a `qti-random-integer` from literal bounds, its `step` 1 as when absent.
 *
 * @param min Its `min`.
 * @param max Its `max`.
 * @returns The expression.
 */
const randomInteger = (min: bigint, max: bigint): Expression => ({
  kind: "random-integer",
  max: { _tag: "literal", value: max },
  min: { _tag: "literal", value: min },
  operands: [],
  step: { _tag: "literal", value: 1n },
});

/**
 * Construct a `qti-set-template-value`.
 *
 * @param name The template variable it sets.
 * @param expression Its expression.
 * @returns The rule.
 */
const setTemplate = (name: string, expression: Expression): TemplateRule => ({
  expression,
  identifier: name,
  kind: "set-template-value",
});

/**
 * Construct an outcome declaration of single cardinality with no default and no reporting
 * attribute.
 *
 * @param name Its identifier.
 * @param baseType Its base type.
 * @returns The declaration.
 */
const outcomeDeclaration = (name: string, baseType: ModelledBaseType): OutcomeDeclaration => ({
  baseType,
  cardinality: "single",
  defaultValue: Option.none(),
  identifier: name,
  interpretation: Option.none(),
  longInterpretation: Option.none(),
  lookupTable: Option.none(),
  masteryValue: Option.none(),
  normalMaximum: Option.none(),
  normalMinimum: Option.none(),
  view: Option.none(),
});

/**
 * Construct a template declaration of single cardinality, neither a parameter nor a math variable.
 *
 * @param name Its identifier.
 * @param baseType Its base type.
 * @param defaultValue Its `qti-default-value`, none by default.
 * @returns The declaration.
 */
const templateDeclaration = (
  name: string,
  baseType: ModelledBaseType,
  defaultValue: Option.Option<Value> = Option.none(),
): TemplateDeclaration => ({
  baseType,
  cardinality: "single",
  defaultValue,
  identifier: name,
  mathVariable: false,
  paramVariable: false,
});

/**
 * The path of the item body.
 */
const bodyPath = "qti-assessment-item/qti-item-body";

/**
 * Construct a `qti-printed-variable` of the body's first paragraph with every attribute at its
 * default.
 *
 * @param name The template variable it prints.
 * @param position Its position among the paragraph's printed variables, from 1.
 * @returns The body node.
 */
const printed = (name: string, position: number): PrintedVariable => ({
  base: { _tag: "literal", value: 10n },
  delimiter: ";",
  field: Option.none(),
  format: Option.none(),
  identifier: name,
  index: Option.none(),
  kind: "printed-variable",
  mappingIndicator: "=",
  path: `${bodyPath}/p/qti-printed-variable[${position}]`,
  powerForm: false,
});

/**
 * Construct a paragraph holding one run of text.
 *
 * @param path Its path.
 * @param words Its text.
 * @returns The body node.
 */
const paragraph = (path: string, words: string): BodyNode => ({
  attributes: [],
  children: [{ kind: "text", text: words }],
  kind: "element",
  path,
  tag: "p",
});

/**
 * The visibility `CHOICE` gives: shown when it matches the part's identifier.
 */
const shownByChoice: TemplateVisibility = { showHide: "show", templateIdentifier: "CHOICE" };

/**
 * Construct a `qti-template-block` shown by `CHOICE`, holding one paragraph.
 *
 * @param name Its identifier, which `CHOICE` is matched against.
 * @param position Its position among the body's template blocks, from 1.
 * @param words Its paragraph's text.
 * @returns The body node.
 */
const templateBlock = (name: string, position: number, words: string): BodyNode => {
  const path = `${bodyPath}/qti-template-block[${position}]`;

  return {
    content: [paragraph(`${path}/qti-content-body/p`, words)],
    identifier: name,
    kind: "template-block",
    path,
    responses: [],
    templateVisibility: shownByChoice,
  };
};

/**
 * Construct a `qti-simple-choice` holding one run of text, not fixed.
 *
 * @param name Its identifier.
 * @param words Its text.
 * @param templateVisibility Its template visibility, none for a choice always shown.
 * @returns The choice.
 */
const choice = (
  name: string,
  words: string,
  templateVisibility: Option.Option<TemplateVisibility>,
): SimpleChoice => ({
  content: [{ kind: "text", text: words }],
  fixed: false,
  identifier: name,
  templateVisibility,
});

/**
 * The template rules of {@link determinismXml}, as the model reads them.
 */
const templateRules: readonly TemplateRule[] = [
  setTemplate("N", randomInteger(1n, 9n)),
  {
    expression: { kind: "gte", operands: [variable("N"), baseValue(integer(5n))] },
    kind: "template-constraint",
  },
  setTemplate("X", {
    kind: "random-float",
    max: { _tag: "literal", value: 10 },
    min: { _tag: "literal", value: 0 },
    operands: [],
  }),
  setTemplate("S", { kind: "math-operator", name: "sin", operands: [variable("X")] }),
  setTemplate("BOTH", {
    kind: "and",
    operands: [
      baseValue(boolean(false)),
      { kind: "gte", operands: [randomInteger(0n, 99n), baseValue(integer(0n))] },
    ],
  }),
  {
    branches: [
      {
        // oxlint-disable-next-line unicorn/no-thenable -- `then` is the template branch's rule list, the name the item model fixes; it is an array, never a function.
        then: [setTemplate("M", randomInteger(0n, 99n))],
        when: { kind: "lt", operands: [variable("N"), baseValue(integer(0n))] },
      },
    ],
    kind: "template-condition",
    otherwise: Option.some([setTemplate("M", randomInteger(100n, 199n))]),
  },
  setTemplate("CHOICE", baseValue(identifier("B"))),
  { expression: variable("CHOICE"), identifier: "RESPONSE", kind: "set-correct-response" },
];

/**
 * The fixture item: the model `open` builds from {@link determinismXml}, written by hand so a page
 * can load it.
 */
export const determinismItem: Item = {
  body: [
    {
      attributes: [],
      children: [
        { kind: "text", text: "N is " },
        printed("N", 1),
        { kind: "text", text: ", M is " },
        printed("M", 2),
        { kind: "text", text: " and the sine of X is " },
        printed("S", 3),
        { kind: "text", text: "." },
      ],
      kind: "element",
      path: `${bodyPath}/p`,
      tag: "p",
    },
    templateBlock("B", 1, "Block B is shown."),
    templateBlock("C", 2, "Block C is hidden."),
    {
      ariaLabel: Option.none(),
      ariaLabelledby: Option.none(),
      cardinality: "single",
      choices: [
        choice("A", "Always shown", Option.none()),
        choice("B", "Shown by CHOICE", Option.some(shownByChoice)),
        choice("C", "Hidden by CHOICE", Option.some(shownByChoice)),
      ],
      class: "",
      kind: "choice",
      maxChoices: 1n,
      messages: { max: Option.none(), min: Option.none() },
      minChoices: 0n,
      orientation: Option.none(),
      path: `${bodyPath}/qti-choice-interaction`,
      prompt: Option.some([{ kind: "text", text: "Pick the choice CHOICE names." }]),
      response: "RESPONSE",
      shuffle: false,
    },
  ],
  document: determinismLocation,
  identifier: "determinism",
  lang: Option.some("en"),
  outcomes: new Map([
    ["SCORE", outcomeDeclaration("SCORE", "float")],
    ["DRAWN", outcomeDeclaration("DRAWN", "integer")],
  ]),
  processing: Option.some([
    {
      branches: [
        {
          // oxlint-disable-next-line unicorn/no-thenable -- `then` is the branch's rule list, the name the item model fixes; it is an array, never a function.
          then: [
            {
              expression: {
                kind: "sum",
                operands: [baseValue(float(1)), variable("S")],
              },
              identifier: "SCORE",
              kind: "set-outcome",
            },
          ],
          when: {
            kind: "match",
            operands: [
              variable("RESPONSE"),
              { identifier: "RESPONSE", kind: "correct", operands: [] },
            ],
          },
        },
      ],
      kind: "condition",
      otherwise: Option.some([
        { expression: baseValue(float(0)), identifier: "SCORE", kind: "set-outcome" },
      ]),
    },
    { expression: randomInteger(1n, 6n), identifier: "DRAWN", kind: "set-outcome" },
  ]),
  responses: new Map([
    [
      "RESPONSE",
      {
        areaMapping: Option.none(),
        baseType: "identifier",
        cardinality: "single",
        correct: Option.none(),
        defaultValue: Option.none(),
        identifier: "RESPONSE",
        mapping: Option.none(),
      },
    ],
  ]),
  templateProcessing: Option.some(templateRules),
  templates: new Map([
    ["N", templateDeclaration("N", "integer", Option.some(integer(0n)))],
    ["X", templateDeclaration("X", "float")],
    ["S", templateDeclaration("S", "float")],
    ["BOTH", templateDeclaration("BOTH", "boolean")],
    ["M", templateDeclaration("M", "integer")],
    ["CHOICE", templateDeclaration("CHOICE", "identifier")],
  ]),
  title: "Determinism",
  unsupported: [],
};

/**
 * What one run of the fixture gives: the record's template values, the HTML `render` writes for
 * `redactItem(item, record)`, and the outcomes after the attempt answers
 * {@link determinismResponses}.
 */
export interface Observed {
  readonly html: string;
  readonly outcomes: ItemRecord["outcomes"];
  readonly templates: ItemRecord["templates"];
}

/**
 * What the fixture gives under {@link determinismSeed} and {@link determinismInstance}, pinned.
 *
 * `S` is plate's FDLIBM `sin` of `X`, asserted exactly; `SCORE` is `1 + S`, since the response is
 * the correct one template processing set. Block C and choice C are absent from the HTML, hidden by
 * `CHOICE`.
 */
export const pinned: Observed = {
  html: [
    '<qti-assessment-item data-mode="answering" id="det-item" lang="en" data-slot="item">',
    "<p>N is 7, M is 122 and the sine of X is -0.7273852312608226.</p>",
    "<p>Block B is shown.</p>",
    '<fieldset data-mode="answering" data-slot="choice-interaction">',
    '<legend data-slot="choice-interaction-prompt">Pick the choice CHOICE names.</legend>',
    '<ul data-slot="choice-interaction-choices">',
    '<li data-slot="choice-interaction-choice">',
    '<input aria-labelledby="det-RESPONSE-label-0" data-slot="choice-interaction-control" id="det-RESPONSE-control-0" name="det.RESPONSE" type="radio" value="A">',
    '<label data-slot="choice-interaction-label" for="det-RESPONSE-control-0" id="det-RESPONSE-label-0">',
    '<span aria-hidden="true" data-slot="choice-interaction-indicator"></span>Always shown</label></li>',
    '<li data-slot="choice-interaction-choice">',
    '<input aria-labelledby="det-RESPONSE-label-1" data-slot="choice-interaction-control" id="det-RESPONSE-control-1" name="det.RESPONSE" type="radio" value="B">',
    '<label data-slot="choice-interaction-label" for="det-RESPONSE-control-1" id="det-RESPONSE-label-1">',
    '<span aria-hidden="true" data-slot="choice-interaction-indicator"></span>Shown by CHOICE</label></li>',
    "</ul></fieldset></qti-assessment-item>",
  ].join(""),
  outcomes: {
    DRAWN: integer(1n),
    SCORE: float(0.27261476873917745),
    completionStatus: identifier("unknown"),
  },
  templates: {
    BOTH: boolean(false),
    CHOICE: identifier("B"),
    M: integer(122n),
    N: integer(7n),
    S: float(-0.7273852312608226),
    X: float(5.4686814341246945),
  },
};

/**
 * Start the fixture's first record with `firstAttempt`, under {@link determinismInstance}.
 *
 * @param seed The seed its template processing draws under, {@link determinismSeed} by default.
 * @returns The record, or template processing's first failure.
 */
export const startRecord = (
  seed: string = determinismSeed,
): Result.Result<ItemRecord, EngineFailure> =>
  firstAttempt(determinismItem, { instance: determinismInstance, seed });

/**
 * Run the fixture from a record through the browser entries: `redactItem` and `render` for its
 * HTML, under {@link determinismConfiguration} and {@link determinismInstance} with no values, then
 * `runAttempt` answering {@link determinismResponses} for its outcomes.
 *
 * @param record The record the attempt starts from, as {@link startRecord} gives it.
 * @returns What the run gives, or the first failure of a step.
 */
export const observe = (
  record: ItemRecord,
): Result.Result<
  Observed,
  EngineFailure | InvalidInstance | OutputTooLarge | PartSwapRefused | UnknownPart
> =>
  Result.gen(function* observeFixture() {
    const rendered = yield* render(redactItem(determinismItem, record), determinismConfiguration, {
      instance: determinismInstance,
    });
    const after = yield* runAttempt(determinismItem, record, determinismResponses);

    return { html: rendered.html, outcomes: after.outcomes, templates: record.templates };
  });

/**
 * The item ref through which {@link determinismTest} delivers {@link determinismItem}.
 */
const itemRef = "ITEM1";

/**
 * Construct a `qti-variable` that reads one of the fixture item's variables through its item ref.
 *
 * @param name The item's variable.
 * @returns The expression.
 */
const itemVariable = (name: string): Expression => variable(`${itemRef}.${name}`);

/**
 * Construct a `qti-set-outcome-value`.
 *
 * @param name The outcome it sets.
 * @param expression Its expression.
 * @returns The rule.
 */
const setOutcome = (name: string, expression: Expression): Rule => ({
  expression,
  identifier: name,
  kind: "set-outcome",
});

/**
 * The fixture test, as much of it as `runOutcomes` reads: its outcomes `DRAWN` and `BONUS`, single
 * integers, and `TOTAL`, a single float, none with a default, and its outcome processing. That
 * draws `DRAWN` from 1 to 100; then runs a condition whose first branch, `ITEM1.SCORE` below 0, is
 * not taken and holds a draw, and whose second, `ITEM1.SCORE` at least 0.25, is taken and draws
 * `BONUS` from 100 to 199; then sets `TOTAL` to `ITEM1.SCORE` plus `BONUS`. So the values pin the
 * order of a run's draws: its rules in order, a condition's branches until the first true one.
 * Written by hand (rule `3ad87993`) as a literal, so a page loads it.
 */
export const determinismTest: Pick<Test, "outcomeProcessing" | "outcomes"> = {
  outcomeProcessing: {
    kind: "runs",
    rules: [
      setOutcome("DRAWN", randomInteger(1n, 100n)),
      {
        branches: [
          {
            // oxlint-disable-next-line unicorn/no-thenable -- `then` is the branch's rule list, the name the item model fixes; it is an array, never a function.
            then: [setOutcome("BONUS", randomInteger(0n, 99n))],
            when: { kind: "lt", operands: [itemVariable("SCORE"), baseValue(float(0))] },
          },
          {
            // oxlint-disable-next-line unicorn/no-thenable -- `then` is the branch's rule list, the name the item model fixes; it is an array, never a function.
            then: [setOutcome("BONUS", randomInteger(100n, 199n))],
            when: { kind: "gte", operands: [itemVariable("SCORE"), baseValue(float(0.25))] },
          },
        ],
        kind: "condition",
        otherwise: Option.none(),
      },
      setOutcome("TOTAL", { kind: "sum", operands: [itemVariable("SCORE"), variable("BONUS")] }),
    ],
  },
  outcomes: new Map([
    ["DRAWN", outcomeDeclaration("DRAWN", "integer")],
    ["BONUS", outcomeDeclaration("BONUS", "integer")],
    ["TOTAL", outcomeDeclaration("TOTAL", "float")],
  ]),
};

/**
 * The test scope of {@link determinismTest} after its item's pinned attempt: one part `P1` and one
 * section `S1`, each holding `ITEM1`, which delivers {@link determinismItem}, presented and with one
 * attempt processed. Its record holds {@link pinned}'s template values and outcomes, the responses
 * {@link determinismResponses} and the correct response the item's template processing set, so
 * `ITEM1.SCORE` reads {@link pinned}'s `SCORE`. The scope declares the test's outcomes and holds no
 * time, which the test's processing does not read.
 */
export const determinismScope: TestScope = {
  declared: new Set(determinismTest.outcomes.keys()),
  duration: Option.none(),
  items: [
    {
      categories: [],
      declarations: {
        outcomes: determinismItem.outcomes,
        responses: determinismItem.responses,
        templates: determinismItem.templates,
      },
      mappings: new Map(),
      numAttempts: 1,
      presented: true,
      record: {
        correct: { RESPONSE: identifier("B") },
        defaults: {},
        outcomes: pinned.outcomes,
        responses: determinismResponses,
        templates: pinned.templates,
      },
      ref: itemRef,
      unheld: new Map(),
      weights: new Map(),
    },
  ],
  parts: new Map([["P1", [itemRef]]]),
  sections: new Map([["S1", [itemRef]]]),
};

/**
 * What {@link determinismTest}'s outcome processing gives as runs 1 and 2 of a session: the test's
 * outcomes after each run, in run order.
 */
export type OutcomeDraws = readonly [
  Readonly<Record<string, Value>>,
  Readonly<Record<string, Value>>,
];

/**
 * What {@link observeOutcomes} gives under {@link determinismSeed} and {@link determinismInstance},
 * pinned. Each run starts from the outcomes' starting values and draws from its own stream, so run
 * 2 differs from run 1 only in its draws. `TOTAL` is {@link pinned}'s `SCORE` plus `BONUS`.
 */
export const pinnedOutcomeDraws: OutcomeDraws = [
  { BONUS: integer(129n), DRAWN: integer(22n), TOTAL: float(129.27261476873917) },
  { BONUS: integer(128n), DRAWN: integer(56n), TOTAL: float(128.27261476873917) },
];

/**
 * Run {@link determinismTest}'s outcome processing as runs 1 and 2 of a session under
 * {@link determinismInstance}, through `runOutcomes` over {@link determinismScope}: run `n` draws
 * from a fresh `drawStream(seed, outcomeLabel(determinismInstance, n))`, the stream a session's run
 * `n` draws from.
 *
 * @param seed The processing seed the runs' streams are keyed by, {@link determinismSeed} by
 *   default.
 * @returns The outcomes after each run, or the first run's failure.
 */
export const observeOutcomes = (
  seed: string = determinismSeed,
): Result.Result<OutcomeDraws, EngineFailure> =>
  Result.gen(function* observeOutcomeDraws() {
    const first = yield* runOutcomes(
      determinismTest,
      determinismScope,
      drawStream(seed, outcomeLabel(determinismInstance, 1)),
    );
    const second = yield* runOutcomes(
      determinismTest,
      determinismScope,
      drawStream(seed, outcomeLabel(determinismInstance, 2)),
    );

    return [first, second] as const;
  });

/**
 * The instance of the record a session starts for its first item: the session's instance
 * {@link determinismInstance}, a `.` and the item's sequence index, 1.
 */
export const pickerInstance = `${determinismInstance}.1`;

/**
 * The templated item {@link pickerRef} delivers, hand-built (rule `3ad87993`) as a literal so a page
 * loads it. Its single integers `LOW` and `HIGH` declare defaults 1 and 2, which the item ref's
 * template defaults replace; `PICK` and `SPAN` declare none. Its template processing reads `LOW`
 * and `HIGH` before any rule sets them: it draws `PICK` from `LOW` to `HIGH`, the bounds named by
 * reference, then sets `SPAN` to `HIGH` minus `LOW`. It declares no response or outcome and has no
 * body or response processing.
 */
export const pickerItem: Item = {
  body: [],
  document: "items/picker.xml",
  identifier: "picker",
  lang: Option.some("en"),
  outcomes: new Map(),
  processing: Option.none(),
  responses: new Map(),
  templateProcessing: Option.some([
    setTemplate("PICK", {
      kind: "random-integer",
      max: { _tag: "ref", identifier: "HIGH" },
      min: { _tag: "ref", identifier: "LOW" },
      operands: [],
      step: { _tag: "literal", value: 1n },
    }),
    setTemplate("SPAN", { kind: "subtract", operands: [variable("HIGH"), variable("LOW")] }),
  ]),
  templates: new Map([
    ["LOW", templateDeclaration("LOW", "integer", Option.some(integer(1n)))],
    ["HIGH", templateDeclaration("HIGH", "integer", Option.some(integer(2n)))],
    ["PICK", templateDeclaration("PICK", "integer")],
    ["SPAN", templateDeclaration("SPAN", "integer")],
  ]),
  title: "Picker",
  unsupported: [],
};

/**
 * The item ref through which a test delivers {@link pickerItem} first in its sequence, as much of
 * it as the template defaults need: its identifier and two drawing template defaults, in document
 * order, `LOW` from 1 to 9 and then `HIGH` from 10 to 99. Both draw from the one stream an item
 * ref's defaults share, so `LOW` takes its first draw and `HIGH` its second.
 */
export const pickerRef: Pick<ItemRef, "identifier" | "templateDefaults"> = {
  identifier: "PICKER",
  templateDefaults: [
    { expression: randomInteger(1n, 9n), templateIdentifier: "LOW" },
    { expression: randomInteger(10n, 99n), templateIdentifier: "HIGH" },
  ],
};

/**
 * The test scope {@link pickerRef}'s defaults are evaluated over, as a session presents its first
 * item: one part `P1` and one section `S1`, each holding `PICKER`, whose item
 * {@link pickerItem} is not yet presented, has no attempt processed, and holds the record
 * `fresh` starts. It declares {@link determinismTest}'s outcomes and holds no time, as a template
 * default's scope holds none.
 */
export const pickerScope: TestScope = {
  declared: new Set(determinismTest.outcomes.keys()),
  duration: Option.none(),
  items: [
    {
      categories: [],
      declarations: {
        outcomes: pickerItem.outcomes,
        responses: pickerItem.responses,
        templates: pickerItem.templates,
      },
      mappings: new Map(),
      numAttempts: 0,
      presented: false,
      record: {
        correct: {},
        defaults: {},
        outcomes: { completionStatus: identifier("not_attempted") },
        responses: {},
        templates: {},
      },
      ref: pickerRef.identifier,
      unheld: new Map(),
      weights: new Map(),
    },
  ],
  parts: new Map([["P1", [pickerRef.identifier]]]),
  sections: new Map([["S1", [pickerRef.identifier]]]),
};

/**
 * {@link determinismTest}'s outcomes as a session holds them before any outcome processing runs:
 * each at its starting value. {@link pickerRef}'s defaults are evaluated over them.
 */
const startingOutcomes: Readonly<Record<string, Value>> = Object.fromEntries(
  Array.from(determinismTest.outcomes, ([name, outcome]) => [name, startingValue(outcome)]),
);

/**
 * What {@link pickerRef}'s template defaults give as a session presents {@link pickerItem}: the
 * defaults `evaluateTemplateDefaults` gives, and the template values `firstAttempt` starts from
 * them.
 */
export interface DefaultDraws {
  readonly defaults: Readonly<Record<string, Value>>;
  readonly templates: ItemRecord["templates"];
}

/**
 * What {@link observeDefaults} gives under {@link determinismSeed}, pinned. `LOW` and `HIGH` are the
 * defaults' draws, which the template values hold in place of the declared 1 and 2; `PICK` is drawn
 * between them and `SPAN` is their difference.
 */
export const pinnedDefaultDraws: DefaultDraws = {
  defaults: { HIGH: integer(54n), LOW: integer(4n) },
  templates: { HIGH: integer(54n), LOW: integer(4n), PICK: integer(23n), SPAN: integer(50n) },
};

/**
 * Evaluate {@link pickerRef}'s template defaults and start {@link pickerItem} with them, as a
 * session does for the first item of its sequence under {@link determinismInstance}: the defaults
 * through `evaluateTemplateDefaults`, over {@link determinismTest}'s outcomes at their starting
 * values and {@link pickerScope}, from a fresh `drawStream(seed, defaultLabel(determinismInstance,
 * 1))`; then the item through `firstAttempt` under {@link pickerInstance}, from those defaults.
 *
 * @param seed The processing seed the defaults' stream and the item's template processing are
 *   keyed by, {@link determinismSeed} by default.
 * @returns The defaults and the template values, or the first failure.
 */
export const observeDefaults = (
  seed: string = determinismSeed,
): Result.Result<DefaultDraws, EngineFailure> =>
  Result.gen(function* observeDefaultDraws() {
    const defaults = yield* evaluateTemplateDefaults(
      pickerRef.templateDefaults,
      determinismTest,
      startingOutcomes,
      pickerScope,
      drawStream(seed, defaultLabel(determinismInstance, 1)),
    );
    const record = yield* firstAttempt(pickerItem, {
      instance: pickerInstance,
      seed,
      templateDefaults: defaults,
    });

    return { defaults, templates: record.templates };
  });

import { readFile } from "node:fs/promises";
import { assert, describe, it } from "@effect/vitest";
import { Config, ConfigProvider, Data, Duration, Effect, Option } from "effect";
import { configure } from "#plate/configuration.ts";
import { readCorpusFile } from "#plate/document/corpus.ts";
import { readSource } from "#plate/document/read.ts";
import {
  attr,
  doc,
  el,
  entity,
  text,
  qtiNamespace,
  xincludeNamespace,
  xmlNamespace,
} from "#plate/document/source.ts";
import type {
  SourceAttribute,
  SourceChild,
  SourceDocument,
  SourceElement,
} from "#plate/document/source.ts";
import { runAttempt } from "#plate/engine/attempt.ts";
import { runRules } from "#plate/engine/evaluate.ts";
import { validateChoice } from "#plate/interactions/choice.ts";
import { message } from "#plate/messages.ts";
import type { IntegerOrRef, TemplateRule } from "#plate/model/expression.ts";
import { buildItem } from "#plate/model/item.ts";
import type {
  AreaMapping,
  BodyNode,
  Branch,
  ChoiceInteraction,
  Expression,
  ExtendedTextInteraction,
  InlineChoiceInteraction,
  Item,
  RecordDeclaration,
  Rule,
  TemplateDeclaration,
  TemplateVisibility,
  TextEntryInteraction,
  UnheldDeclaration,
  UnsupportedFeature,
} from "#plate/model/item.ts";
import { fresh } from "#plate/model/record.ts";
import type { RecordValue, Value } from "#plate/model/values.ts";
import { rptemplatesDirectory } from "#plate/test/caches.ts";
import { float, integer } from "#plate/test/fixtures.ts";
import { acceptedOf, openCorpus } from "#plate/test/sweep.ts";
import { checkRules } from "#plate/validate/rules.ts";
import { tables } from "#plate/validate/tables.ts";
import { acceptedItem, check } from "#plate/validate/verdict.ts";
import { growthFactor, growthLimit, growthRatio } from "#plate/test/growth.ts";

/**
 * The path of the item root, which every path in these tests starts with.
 */
const root = "qti-assessment-item";

/**
 * The path of the item body.
 */
const body = `${root}/qti-item-body`;

/**
 * Construct a declaration with its three attributes.
 *
 * @param local `qti-response-declaration` or `qti-outcome-declaration`.
 * @param identifier The declared identifier.
 * @param baseType The `base-type` value.
 * @param cardinality The `cardinality` value.
 * @param children The declaration's children, none by default.
 * @returns The declaration element.
 */
const declaration = (
  local: "qti-outcome-declaration" | "qti-response-declaration",
  identifier: string,
  baseType: string,
  cardinality: string,
  children: readonly SourceChild[] = [],
): SourceElement =>
  el(
    local,
    [attr("base-type", baseType), attr("cardinality", cardinality), attr("identifier", identifier)],
    children,
  );

/**
 * Construct a container of `qti-value` children, such as `qti-correct-response`.
 *
 * @param local The container's name.
 * @param values Each value's text.
 * @returns The container element.
 */
const values = (local: string, ...texts: readonly string[]): SourceElement =>
  el(
    local,
    [],
    texts.map((value) => el("qti-value", [], [text(value)])),
  );

/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shape` is the QTI attribute of `qti-area-map-entry` and names an area's geometry, not a structure. */
/**
 * Construct a `qti-area-map-entry`.
 *
 * @param shape The `shape` value.
 * @param coords The `coords` value, as written.
 * @param mappedValue The `mapped-value` value.
 * @returns The entry element.
 */
const areaEntry = (shape: string, coords: string, mappedValue: string): SourceElement =>
  el("qti-area-map-entry", [
    attr("coords", coords),
    attr("mapped-value", mappedValue),
    attr("shape", shape),
  ]);

/**
 * Construct a `qti-area-mapping` of the circle `102,113,16`, mapped to 1, and then a rect whose
 * third coordinate is written as given, mapped to 0.5.
 *
 * @param attributes The mapping's attributes.
 * @param rectRight The rect's third coordinate, as written.
 * @returns The mapping element.
 */
const areaMapping = (attributes: readonly SourceAttribute[], rectRight: string): SourceElement =>
  el("qti-area-mapping", attributes, [
    areaEntry("circle", "102,113,16", "1"),
    areaEntry("rect", `0,0,${rectRight},40`, "0.5"),
  ]);
/* oxlint-enable anti-slop/no-shape-in-symbol-names */

/**
 * Construct a `qti-simple-choice` holding only text.
 *
 * @param identifier The choice's identifier.
 * @param label The choice's text.
 * @returns The choice element.
 */
const choice = (identifier: string, label: string): SourceElement =>
  el("qti-simple-choice", [attr("identifier", identifier)], [text(label)]);

/**
 * Construct a `qti-response-processing` that names a built-in template by its purl URI.
 *
 * @param name The template's file name, with or without `.xml`.
 * @returns The processing element.
 */
const template = (name: string): SourceElement =>
  el("qti-response-processing", [
    attr("template", `https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/${name}`),
  ]);

/**
 * Construct a `qti-set-outcome-value` of `SCORE` to a float base value.
 *
 * @param value The base value's text.
 * @returns The rule element.
 */
const setScore = (value: string): SourceElement =>
  el(
    "qti-set-outcome-value",
    [attr("identifier", "SCORE")],
    [el("qti-base-value", [attr("base-type", "float")], [text(value)])],
  );

/**
 * `match_correct`'s rules as the template's text gives them, written inline.
 *
 * @returns The inline processing element.
 */
const matchCorrectBlock = (): SourceElement =>
  el(
    "qti-response-processing",
    [],
    [
      el(
        "qti-response-condition",
        [],
        [
          el(
            "qti-response-if",
            [],
            [
              el(
                "qti-match",
                [],
                [
                  el("qti-variable", [attr("identifier", "RESPONSE")]),
                  el("qti-correct", [attr("identifier", "RESPONSE")]),
                ],
              ),
              setScore("1"),
            ],
          ),
          el("qti-response-else", [], [setScore("0")]),
        ],
      ),
    ],
  );

/**
 * Construct an item document from its parts.
 *
 * @param parts The root's extra attributes, the declarations, the body's children and what follows
 *   the body.
 * @returns The document at `items/test.xml`.
 */
const item = (parts: {
  readonly after?: readonly SourceElement[];
  readonly attributes?: readonly SourceAttribute[];
  readonly body: readonly SourceChild[];
  readonly declarations: readonly SourceElement[];
}): SourceDocument =>
  doc(
    "items/test.xml",
    el(
      root,
      [attr("identifier", "item"), attr("title", "Item"), ...(parts.attributes ?? [])],
      [...parts.declarations, el("qti-item-body", [], parts.body), ...(parts.after ?? [])],
    ),
  );

/**
 * Construct an item document whose response processing is one rule, beside the identifier outcome
 * `STATUS`.
 *
 * @param rule The rule.
 * @returns The document at `items/test.xml`.
 */
const statusItem = (rule: SourceElement): SourceDocument =>
  item({
    after: [el("qti-response-processing", [], [rule])],
    body: [],
    declarations: [declaration("qti-outcome-declaration", "STATUS", "identifier", "single")],
  });

/**
 * Construct an item document whose response processing is one rule, beside the identifier outcome
 * `STATUS` and a single identifier template variable named `completionStatus`.
 *
 * @param rule The rule.
 * @returns The document at `items/test.xml`.
 */
const statusTemplateItem = (rule: SourceElement): SourceDocument =>
  item({
    after: [el("qti-response-processing", [], [rule])],
    body: [],
    declarations: [
      declaration("qti-outcome-declaration", "STATUS", "identifier", "single"),
      el("qti-template-declaration", [
        attr("base-type", "identifier"),
        attr("cardinality", "single"),
        attr("identifier", "completionStatus"),
      ]),
    ],
  });

/**
 * A BG007-shaped item: an identifier `RESPONSE` whose correct response is `true`, a float `SCORE`
 * with default 1, and a two-choice interaction with `max-choices="1"`.
 *
 * @param processing The item's response processing.
 * @returns The document at `items/BG007.xml`.
 */
const bg007 = (processing: SourceElement): SourceDocument =>
  doc(
    "items/BG007.xml",
    el(
      root,
      [
        attr("identifier", "beginnersguide007"),
        attr("title", "BG true false example "),
        attr("lang", "en-US", xmlNamespace),
      ],
      [
        declaration("qti-response-declaration", "RESPONSE", "identifier", "single", [
          values("qti-correct-response", "true"),
        ]),
        declaration("qti-outcome-declaration", "SCORE", "float", "single", [
          values("qti-default-value", "1"),
        ]),
        el(
          "qti-item-body",
          [],
          [
            el("p", [], [text("This is a True/False question?")]),
            el(
              "qti-choice-interaction",
              [attr("max-choices", "1"), attr("response-identifier", "RESPONSE")],
              [choice("true", "True"), choice("false", "False")],
            ),
          ],
        ),
        processing,
      ],
    ),
  );

/**
 * A float `RESPONSE` whose correct response is 1.5, a float `SCORE` with no default, and
 * `match_correct`.
 *
 * @param templating What follows the declarations, such as a `qti-template-processing`; nothing
 *   by default.
 * @returns The document at `items/test.xml`.
 */
const floatMatchCorrect = (templating: readonly SourceElement[] = []): SourceDocument =>
  item({
    after: [template("match_correct")],
    body: [],
    declarations: [
      declaration("qti-response-declaration", "RESPONSE", "float", "single", [
        values("qti-correct-response", "1.5"),
      ]),
      declaration("qti-outcome-declaration", "SCORE", "float", "single"),
      ...templating,
    ],
  });

/**
 * A `qti-template-processing` that sets `RESPONSE`'s correct response to the float 2.5.
 */
const setsCorrectResponse: SourceElement = el(
  "qti-template-processing",
  [],
  [
    el(
      "qti-set-correct-response",
      [attr("identifier", "RESPONSE")],
      [el("qti-base-value", [attr("base-type", "float")], [text("2.5")])],
    ),
  ],
);

/**
 * A `qti-template-processing` that does not run: it holds a `qti-set-outcome-value`, which is not a
 * template rule, so the reader marks it and the template processing is none.
 */
const stalledTemplating: SourceElement = el(
  "qti-template-processing",
  [],
  [
    el(
      "qti-set-outcome-value",
      [attr("identifier", "SCORE")],
      [el("qti-base-value", [attr("base-type", "float")], [text("1")])],
    ),
  ],
);

/**
 * Construct a `qti-template-declaration`.
 *
 * @param identifier The declared identifier.
 * @param cardinality The `cardinality` value.
 * @param baseType The `base-type` value, none when absent, as a record's is.
 * @returns The declaration element.
 */
const templateDeclaration = (
  identifier: string,
  cardinality: string,
  baseType?: string,
): SourceElement =>
  el("qti-template-declaration", [
    ...(baseType === undefined ? [] : [attr("base-type", baseType)]),
    attr("cardinality", cardinality),
    attr("identifier", identifier),
  ]);

/**
 * Construct a template setting rule.
 *
 * @param local The rule's name.
 * @param identifier The variable it sets.
 * @param expression Its expression.
 * @returns The rule element.
 */
const templateSetting = (
  local: "qti-set-correct-response" | "qti-set-default-value" | "qti-set-template-value",
  identifier: string,
  expression: SourceElement,
): SourceElement => el(local, [attr("identifier", identifier)], [expression]);

/**
 * Construct a `qti-variable`.
 *
 * @param identifier The variable it reads.
 * @returns The expression element.
 */
const variableElement = (identifier: string): SourceElement =>
  el("qti-variable", [attr("identifier", identifier)]);

/**
 * Construct a `qti-value` that writes one field of a record declaration's value.
 *
 * @param identifier The `field-identifier`, as written.
 * @param baseType The field's `base-type`.
 * @param written The value's text.
 * @returns The value element.
 */
const recordField = (identifier: string, baseType: string, written: string): SourceElement =>
  el(
    "qti-value",
    [attr("base-type", baseType), attr("field-identifier", identifier)],
    [text(written)],
  );

/**
 * Construct a `qti-is-null` of one operand.
 *
 * @param operand The operand.
 * @returns The expression element.
 */
const isNullOf = (operand: SourceElement): SourceElement => el("qti-is-null", [], [operand]);

/**
 * The float outcome `SCORE`, which {@link templatingItem}'s response processing sets.
 */
const scoreDeclaration: SourceElement = declaration(
  "qti-outcome-declaration",
  "SCORE",
  "float",
  "single",
);

/**
 * The single integer context variable `CTX`, whose default is 4.
 */
const contextDeclaration: SourceElement = el(
  "qti-context-declaration",
  [attr("base-type", "integer"), attr("cardinality", "single"), attr("identifier", "CTX")],
  [values("qti-default-value", "4")],
);

/**
 * Construct an item whose template processing is one rule, and whose inline response processing
 * sets `SCORE` to 1, or, with a condition given, to 1 when that condition is true.
 *
 * @param declarations The declarations, in document order, `SCORE` among them.
 * @param rule The template rule.
 * @param condition The response processing's condition, none by default.
 * @returns The document at `items/test.xml`.
 */
const templatingItem = (
  declarations: readonly SourceElement[],
  rule: SourceElement,
  condition?: SourceElement,
): SourceDocument =>
  item({
    after: [
      el(
        "qti-response-processing",
        [],
        [
          condition === undefined
            ? setScore("1")
            : el(
                "qti-response-condition",
                [],
                [el("qti-response-if", [], [condition, setScore("1")])],
              ),
        ],
      ),
    ],
    attributes: [attr("time-dependent", "false")],
    body: [],
    declarations: [...declarations, el("qti-template-processing", [], [rule])],
  });

/**
 * The seven shapes of template processing `check` accepts whose first attempt reads or sets a
 * name the engine does not hold while template processing runs (review `079e8c44` P1-1), each with
 * its declarations, its one rule, the name it marks and the declarations' own marks: a read of
 * `QTI_CONTEXT`; a read of a context variable through `qti-variable`, then through `qti-default`;
 * a read of a template variable of cardinality `record`; a set of one of base type `file`; a
 * `qti-set-correct-response` of a `file` response; and a `qti-set-default-value` of a `file`
 * outcome.
 */
const unheldTemplating: readonly {
  readonly declarations: readonly SourceElement[];
  readonly marks: readonly Pick<UnsupportedFeature, "feature" | "path">[];
  readonly rule: SourceElement;
  readonly unheld: string;
}[] = [
  {
    declarations: [scoreDeclaration, templateDeclaration("B", "single", "boolean")],
    marks: [],
    rule: templateSetting("qti-set-template-value", "B", isNullOf(variableElement("QTI_CONTEXT"))),
    unheld: "QTI_CONTEXT",
  },
  {
    declarations: [
      contextDeclaration,
      scoreDeclaration,
      templateDeclaration("T", "single", "integer"),
    ],
    marks: [{ feature: "qti-context-declaration", path: `${root}/qti-context-declaration` }],
    rule: templateSetting("qti-set-template-value", "T", variableElement("CTX")),
    unheld: "CTX",
  },
  {
    declarations: [
      contextDeclaration,
      scoreDeclaration,
      templateDeclaration("T", "single", "integer"),
    ],
    marks: [{ feature: "qti-context-declaration", path: `${root}/qti-context-declaration` }],
    rule: templateSetting(
      "qti-set-template-value",
      "T",
      el("qti-default", [attr("identifier", "CTX")]),
    ),
    unheld: "CTX",
  },
  {
    declarations: [
      scoreDeclaration,
      templateDeclaration("R", "record"),
      templateDeclaration("B", "single", "boolean"),
    ],
    marks: [{ feature: 'cardinality="record"', path: `${root}/qti-template-declaration[1]` }],
    rule: templateSetting("qti-set-template-value", "B", isNullOf(variableElement("R"))),
    unheld: "R",
  },
  {
    declarations: [scoreDeclaration, templateDeclaration("F", "single", "file")],
    marks: [{ feature: 'base-type="file"', path: `${root}/qti-template-declaration` }],
    rule: templateSetting("qti-set-template-value", "F", el("qti-null")),
    unheld: "F",
  },
  {
    declarations: [
      declaration("qti-response-declaration", "RF", "file", "single"),
      scoreDeclaration,
    ],
    marks: [{ feature: 'base-type="file"', path: `${root}/qti-response-declaration` }],
    rule: templateSetting("qti-set-correct-response", "RF", el("qti-null")),
    unheld: "RF",
  },
  {
    declarations: [
      scoreDeclaration,
      declaration("qti-outcome-declaration", "OF", "file", "single"),
    ],
    marks: [{ feature: 'base-type="file"', path: `${root}/qti-outcome-declaration[2]` }],
    rule: templateSetting("qti-set-default-value", "OF", el("qti-null")),
    unheld: "OF",
  },
];

/**
 * A float `SCORE` and a float template variable `T`, with inline response processing that sets
 * `SCORE` to `T`.
 *
 * @param templating What follows the declarations, such as a `qti-template-processing`; nothing
 *   by default.
 * @returns The document at `items/test.xml`.
 */
const readsTemplate = (templating: readonly SourceElement[] = []): SourceDocument =>
  item({
    after: [
      el(
        "qti-response-processing",
        [],
        [
          el(
            "qti-set-outcome-value",
            [attr("identifier", "SCORE")],
            [el("qti-variable", [attr("identifier", "T")])],
          ),
        ],
      ),
    ],
    body: [],
    declarations: [
      declaration("qti-outcome-declaration", "SCORE", "float", "single"),
      el("qti-template-declaration", [
        attr("base-type", "float"),
        attr("cardinality", "single"),
        attr("identifier", "T"),
      ]),
      ...templating,
    ],
  });

/**
 * Set `SCORE` to a float.
 *
 * @param value The number.
 * @returns The rule.
 */
const scoreRule = (value: number): Rule => ({
  expression: { kind: "base-value", operands: [], value: float(value) },
  identifier: "SCORE",
  kind: "set-outcome",
});

/**
 * Construct a branch of a condition.
 *
 * @param when Its condition.
 * @param then The rules it runs.
 * @returns The branch.
 */
// oxlint-disable-next-line unicorn/no-thenable -- `then` is the branch's rule list, the name the phase-1 slice list fixes; it is an array, never a function.
const branch = (when: Expression, then: readonly Rule[]): Branch => ({ then, when });

/**
 * `match_correct` as a rule tree: `SCORE` is 1 when `RESPONSE` matches its correct response, else
 * 0.
 */
const matchCorrect: readonly Rule[] = [
  {
    branches: [
      branch(
        {
          kind: "match",
          operands: [
            {
              identifier: "RESPONSE",
              kind: "variable",
              operands: [],
              weightIdentifier: Option.none(),
            },
            { identifier: "RESPONSE", kind: "correct", operands: [] },
          ],
        },
        [scoreRule(1)],
      ),
    ],
    kind: "condition",
    otherwise: Option.some([scoreRule(0)]),
  },
];

/**
 * `map_response_point` as a rule tree: `SCORE` is 0 when `RESPONSE` is NULL, else its value
 * through its area mapping.
 */
const mapResponsePoint: readonly Rule[] = [
  {
    branches: [
      branch(
        {
          kind: "is-null",
          operands: [
            {
              identifier: "RESPONSE",
              kind: "variable",
              operands: [],
              weightIdentifier: Option.none(),
            },
          ],
        },
        [scoreRule(0)],
      ),
    ],
    kind: "condition",
    otherwise: Option.some([
      {
        expression: { identifier: "RESPONSE", kind: "map-response-point", operands: [] },
        identifier: "SCORE",
        kind: "set-outcome",
      },
    ]),
  },
];

/**
 * Construct a `qti-variable`.
 *
 * @param identifier The variable's identifier.
 * @returns The expression.
 */
const variableOf = (identifier: string): Expression => ({
  identifier,
  kind: "variable",
  operands: [],
  weightIdentifier: Option.none(),
});

/**
 * Construct a single identifier value.
 *
 * @param value The identifier.
 * @returns The value.
 */
const identifierValue = (value: string): Value => ({
  baseType: "identifier",
  cardinality: "single",
  values: [{ baseType: "identifier", value }],
});

/**
 * Construct a single string value.
 *
 * @param value The text.
 * @returns The value.
 */
const stringValue = (value: string): Value => ({
  baseType: "string",
  cardinality: "single",
  values: [{ baseType: "string", value }],
});

/**
 * Set an outcome to an expression's value.
 *
 * @param identifier The outcome.
 * @param expression Its new value.
 * @returns The rule.
 */
const setRule = (identifier: string, expression: Expression): Rule => ({
  expression,
  identifier,
  kind: "set-outcome",
});

/**
 * `CC2_match_basic` as a rule tree: on a match `SCORE` takes `MAXSCORE` and `FEEDBACKBASIC` is
 * `correct`, else `FEEDBACKBASIC` is `incorrect`.
 */
const cc2MatchBasic: readonly Rule[] = [
  {
    branches: [
      branch(
        {
          kind: "match",
          operands: [
            variableOf("RESPONSE"),
            { identifier: "RESPONSE", kind: "correct", operands: [] },
          ],
        },
        [
          setRule("SCORE", variableOf("MAXSCORE")),
          setRule("FEEDBACKBASIC", {
            kind: "base-value",
            operands: [],
            value: identifierValue("correct"),
          }),
        ],
      ),
    ],
    kind: "condition",
    otherwise: Option.some([
      setRule("FEEDBACKBASIC", {
        kind: "base-value",
        operands: [],
        value: identifierValue("incorrect"),
      }),
    ]),
  },
];

/**
 * `CC2_map_response` as a rule tree: `SCORE` is 0 when `RESPONSE` is NULL, else its mapped value;
 * then `FEEDBACK` is `correct` when `MAXSCORE` equals `SCORE` exactly, else `incorrect`.
 */
const cc2MapResponse: readonly Rule[] = [
  {
    branches: [branch({ kind: "is-null", operands: [variableOf("RESPONSE")] }, [scoreRule(0)])],
    kind: "condition",
    otherwise: Option.some([
      setRule("SCORE", { identifier: "RESPONSE", kind: "map-response", operands: [] }),
    ]),
  },
  {
    branches: [
      branch(
        {
          includeLowerBound: true,
          includeUpperBound: true,
          kind: "equal",
          operands: [variableOf("MAXSCORE"), variableOf("SCORE")],
          tolerance: [],
          toleranceMode: "exact",
        },
        [
          setRule("FEEDBACK", {
            kind: "base-value",
            operands: [],
            value: identifierValue("correct"),
          }),
        ],
      ),
    ],
    kind: "condition",
    otherwise: Option.some([
      setRule("FEEDBACK", {
        kind: "base-value",
        operands: [],
        value: identifierValue("incorrect"),
      }),
    ]),
  },
];

/**
 * An item a `CC2_*` template scores: a single string `RESPONSE` whose correct response is `York`
 * and whose mapping maps `York` to 1 (case-sensitive) and `york` to 0.5, a float `SCORE` with
 * default 0, the identifier outcomes `FEEDBACK` and `FEEDBACKBASIC`, and a `MAXSCORE` with default
 * 1 of the base type given.
 *
 * @param processing The item's response processing.
 * @param maxScore `MAXSCORE`'s base type, or none to declare no `MAXSCORE`.
 * @returns The document at `items/test.xml`.
 */
const cc2Item = (
  processing: SourceElement,
  maxScore: Option.Option<"float" | "integer"> = Option.some("float"),
): SourceDocument =>
  item({
    after: [processing],
    body: [],
    declarations: [
      declaration("qti-response-declaration", "RESPONSE", "string", "single", [
        values("qti-correct-response", "York"),
        el(
          "qti-mapping",
          [attr("default-value", "0")],
          [
            el("qti-map-entry", [
              attr("case-sensitive", "true"),
              attr("map-key", "York"),
              attr("mapped-value", "1"),
            ]),
            el("qti-map-entry", [attr("map-key", "york"), attr("mapped-value", "0.5")]),
          ],
        ),
      ]),
      declaration("qti-outcome-declaration", "SCORE", "float", "single", [
        values("qti-default-value", "0"),
      ]),
      declaration("qti-outcome-declaration", "FEEDBACK", "identifier", "single"),
      declaration("qti-outcome-declaration", "FEEDBACKBASIC", "identifier", "single"),
      ...Option.match(maxScore, {
        onNone: () => [],
        onSome: (baseType) => [
          declaration("qti-outcome-declaration", "MAXSCORE", baseType, "single", [
            values("qti-default-value", "1"),
          ]),
        ],
      }),
    ],
  });

/**
 * Construct an inline `qti-response-processing` that sets the boolean outcome `SAME` to a
 * `qti-equal` of two float base values.
 *
 * @param attributes The `qti-equal`'s attributes.
 * @param left The first operand's text.
 * @param right The second operand's text.
 * @returns The processing element.
 */
const equalBlock = (
  attributes: readonly SourceAttribute[],
  left: string,
  right: string,
): SourceElement =>
  el(
    "qti-response-processing",
    [],
    [
      el(
        "qti-set-outcome-value",
        [attr("identifier", "SAME")],
        [
          el("qti-equal", attributes, [
            el("qti-base-value", [attr("base-type", "integer")], [text(left)]),
            el("qti-base-value", [attr("base-type", "float")], [text(right)]),
          ]),
        ],
      ),
    ],
  );

/**
 * An item whose single point `RESPONSE` has the area mapping {@link areaMapping} gives, and whose
 * float `SCORE` the processing sets.
 *
 * @param processing The item's response processing.
 * @param attributes The area mapping's attributes, none by default.
 * @param rectRight The rect's third coordinate, as written; 50 by default.
 * @returns The document at `items/test.xml`.
 */
const pointItem = (
  processing: SourceElement,
  attributes: readonly SourceAttribute[] = [],
  rectRight = "50",
): SourceDocument =>
  item({
    after: [processing],
    body: [],
    declarations: [
      declaration("qti-response-declaration", "RESPONSE", "point", "single", [
        areaMapping(attributes, rectRight),
      ]),
      declaration("qti-outcome-declaration", "SCORE", "float", "single"),
    ],
  });

/**
 * A single point value.
 *
 * @param points The point, none for NULL.
 * @returns The value.
 */
const pointValue = (...points: readonly (readonly [bigint, bigint])[]): Value => ({
  baseType: "point",
  cardinality: "single",
  values: points.map((point) => ({ baseType: "point", value: point })),
});

/**
 * A built-in template's file is missing or unreadable under `HOME`.
 */
class UnreadableTemplateError extends Data.TaggedError("UnreadableTemplateError")<{
  /**
   * The path the template was read from.
   */
  readonly path: string;
}> {
  /**
   * The path, and where the template files come from, in one line.
   */
  override get message(): string {
    return `Cannot read the response-processing template ${this.path}: fetch QTI 3's rptemplates into ~/.cache/gr8des/qti3/rptemplates/.`;
  }
}

/**
 * Read the rules of a built-in template from its file in the cache, under `HOME`, as `confPath`
 * names `conf.txt`.
 *
 * @param name The template's name.
 * @returns The children of the file's `qti-response-processing`; an
 *   {@link UnreadableTemplateError} naming the path when the file cannot be read.
 */
const templateRules = (name: string) =>
  Effect.gen(function* readTemplateRules() {
    const file = yield* rptemplatesDirectory.pipe(
      Config.map((directory) => `${directory}/${name}.xml`),
    );
    const bytes = yield* Effect.tryPromise({
      catch: () => new UnreadableTemplateError({ path: file }),
      try: () => readFile(file),
    });
    const source = yield* readSource(file, bytes);

    return source.root.children;
  });

/**
 * An item whose body is one `qti-choice-interaction` bound to a single identifier response.
 *
 * @param attributes The interaction's attributes beside `response-identifier`.
 * @returns The document at `items/test.xml`.
 */
const choiceItem = (attributes: readonly SourceAttribute[]): SourceDocument =>
  item({
    body: [
      el(
        "qti-choice-interaction",
        [...attributes, attr("response-identifier", "RESPONSE")],
        [choice("A", "Ant"), choice("B", "Bee")],
      ),
    ],
    declarations: [declaration("qti-response-declaration", "RESPONSE", "identifier", "single")],
  });

/**
 * An item whose body is one `qti-text-entry-interaction` bound to a single integer response.
 *
 * @param attributes The interaction's attributes beside `response-identifier`.
 * @returns The document at `items/test.xml`.
 */
const textEntryItem = (attributes: readonly SourceAttribute[]): SourceDocument =>
  item({
    body: [
      el(
        "p",
        [],
        [
          el("qti-text-entry-interaction", [
            ...attributes,
            attr("response-identifier", "RESPONSE"),
          ]),
        ],
      ),
    ],
    declarations: [declaration("qti-response-declaration", "RESPONSE", "integer", "single")],
  });

/**
 * An item whose body is one `qti-extended-text-interaction` bound to a string response.
 *
 * @param cardinality The response's cardinality.
 * @param attributes The interaction's attributes beside `response-identifier`.
 * @returns The document at `items/test.xml`.
 */
const extendedTextItem = (
  cardinality: string,
  attributes: readonly SourceAttribute[],
): SourceDocument =>
  item({
    body: [
      el("qti-extended-text-interaction", [...attributes, attr("response-identifier", "RESPONSE")]),
    ],
    declarations: [declaration("qti-response-declaration", "RESPONSE", "string", cardinality)],
  });

/**
 * Read an item written as XML text, at `items/test.xml`.
 *
 * @param xml The document's text.
 * @returns The source document, or the reader's refusal.
 */
const fromXml = (xml: string) => readSource("items/test.xml", new TextEncoder().encode(xml));

/**
 * Write an item whose body is one paragraph around an Inline Choice bound to a single identifier
 * `RESPONSE`, as XML text.
 *
 * @param interaction The `qti-inline-choice-interaction` element, as XML text.
 * @returns The item's text.
 */
const inlineChoiceXml = (interaction: string): string =>
  [
    '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="item" title="Item">',
    '<qti-response-declaration base-type="identifier" cardinality="single" identifier="RESPONSE"/>',
    `<qti-item-body><p>The sky is ${interaction}.</p></qti-item-body>`,
    "</qti-assessment-item>",
  ].join("");

/**
 * Give each choice's identifier beside its template visibility.
 *
 * @param choices A Choice's or an Inline Choice's choices.
 * @returns The pairs, in document order.
 */
const visibilities = (choices: ChoiceInteraction["choices"]) =>
  choices.map((each) => [each.identifier, each.templateVisibility] as const);

/**
 * The path of the Inline Choice {@link inlineChoiceXml} writes.
 */
const inlinePath = `${body}/p/qti-inline-choice-interaction`;

/**
 * Find the one Choice model among body nodes.
 *
 * @param nodes The nodes to search.
 * @returns The Choice model; the test fails when there is none.
 */
const choiceIn = (nodes: readonly BodyNode[]): ChoiceInteraction => {
  const found = nodes.find((node): node is ChoiceInteraction => node.kind === "choice");
  assert.isDefined(found);

  return found;
};

/**
 * The children of a body element.
 *
 * @param node A body node.
 * @returns Its children; the test fails when it is not an element.
 */
const childrenOf = (node: BodyNode | undefined): readonly BodyNode[] => {
  assert.strictEqual(node?.kind, "element");

  return node?.kind === "element" ? node.children : [];
};

/**
 * Build an item from {@link inlineChoiceXml} whose Inline Choice holds a choice `A` of text and
 * then a choice `B` of the given content.
 *
 * @param content Choice `B`'s content, as XML text.
 * @returns The body node in the Inline Choice's place, and the build's unsupported features.
 */
const inlineChoiceWith = (content: string) =>
  Effect.map(
    Effect.flatMap(
      fromXml(
        inlineChoiceXml(
          [
            '<qti-inline-choice-interaction response-identifier="RESPONSE">',
            '<qti-inline-choice identifier="A">plain</qti-inline-choice>',
            `<qti-inline-choice identifier="B">${content}</qti-inline-choice>`,
            "</qti-inline-choice-interaction>",
          ].join(""),
        ),
      ),
      buildItem,
    ),
    (built) => [childrenOf(built.body[0])[1], built.unsupported] as const,
  );

/**
 * The declarations each growth check builds first, before it builds {@link growthFactor} times as
 * many.
 */
const fewerDeclarations = 1000;

/**
 * Each growth check and its control build 8,000 declarations three times and 1,000 declarations 24
 * times. A quadratic record took about 4 s of that, and a quadratic binding about 20 s, beyond
 * vitest's default of 5 s, and a failing check should report its ratio, not a timeout.
 */
const growthTimeoutMs = 60_000;

/**
 * An item with `count` template declarations of base type `file` and an empty body. The model does
 * not hold a `file` declaration, so each is one unsupported feature at its own path.
 *
 * @param count How many declarations the item holds.
 * @returns The document at `items/test.xml`.
 */
const templated = (count: number): SourceDocument =>
  item({
    body: [],
    declarations: Array.from({ length: count }, (_, index) =>
      el("qti-template-declaration", [
        attr("base-type", "file"),
        attr("cardinality", "single"),
        attr("identifier", `T${index}`),
      ]),
    ),
  });

/**
 * The growth check's control, a deliberately quadratic dedupe: the scan `buildItem` made before it
 * kept each feature's paths in a set, which compares each entry with every entry kept so far.
 *
 * @param entries The features, in document order.
 * @returns The features once per feature and path, in document order.
 */
const dedupeQuadratically = (
  entries: readonly UnsupportedFeature[],
): readonly UnsupportedFeature[] => {
  const kept: UnsupportedFeature[] = [];
  for (const entry of entries) {
    if (!kept.some((held) => held.feature === entry.feature && held.path === entry.path)) {
      kept.push(entry);
    }
  }

  return kept;
};

/**
 * An item with `count` string response declarations and, in one paragraph, `count` Text Entry
 * interactions, each bound to its own declaration.
 *
 * @param count How many declarations and interactions the item holds.
 * @returns The document at `items/test.xml`.
 */
const textEntries = (count: number): SourceDocument =>
  item({
    body: [
      el(
        "p",
        [],
        Array.from({ length: count }, (_, index) =>
          el("qti-text-entry-interaction", [attr("response-identifier", `R${index}`)]),
        ),
      ),
    ],
    declarations: Array.from({ length: count }, (_, index) =>
      declaration("qti-response-declaration", `R${index}`, "string", "single"),
    ),
  });

/**
 * Keep an element's element children, as the quadratic binding reads them.
 *
 * @param element The element.
 * @returns Its element children, in document order.
 */
const elementsIn = (element: SourceElement): readonly SourceElement[] =>
  element.children.filter((child): child is SourceElement => child.kind === "element");

/**
 * Read an attribute's value as written, as the quadratic binding reads it.
 *
 * @param element The element.
 * @param name The attribute's local name.
 * @returns The value, or `undefined` when the element does not carry it.
 */
const valueIn = (element: SourceElement, name: string): string | undefined =>
  element.attributes.find((attribute) => attribute.local === name)?.value;

/**
 * The growth check's control, a deliberately quadratic binding: the scan `buildItem` made before it
 * kept a map of declarations, which reads every child of the root once per interaction.
 *
 * @param source An item from {@link textEntries}.
 * @returns Each interaction's declaration, the last one with its identifier, in document order.
 */
const bindQuadratically = (source: SourceDocument): readonly (SourceElement | undefined)[] =>
  elementsIn(source.root)
    .filter((part) => part.local === "qti-item-body")
    .flatMap(elementsIn)
    .flatMap(elementsIn)
    .map((interaction) =>
      elementsIn(source.root).findLast(
        (part) =>
          part.local === "qti-response-declaration" &&
          valueIn(part, "identifier") === valueIn(interaction, "response-identifier"),
      ),
    );

/**
 * An item whose inline response processing holds the given rules, with an integer `RESPONSE`, a
 * float `SCORE`, and an identifier `GRADE` with a match table.
 *
 * @param rules The rule elements of its `qti-response-processing`.
 * @returns The document.
 */
const rulesItem = (rules: readonly SourceElement[]): SourceDocument =>
  item({
    after: [el("qti-response-processing", [], rules)],
    body: [],
    declarations: [
      declaration("qti-response-declaration", "RESPONSE", "integer", "single"),
      declaration("qti-outcome-declaration", "SCORE", "float", "single"),
      declaration("qti-outcome-declaration", "GRADE", "identifier", "single", [
        el(
          "qti-match-table",
          [attr("default-value", "F")],
          [el("qti-match-table-entry", [attr("source-value", "1"), attr("target-value", "A")])],
        ),
      ]),
    ],
  });

/**
 * A `qti-lookup-outcome-value` of an outcome to a `qti-variable`.
 *
 * @param identifier The outcome it looks up.
 * @param source The variable whose value it looks up.
 * @returns The rule element.
 */
const lookupElement = (identifier: string, source: string): SourceElement =>
  el(
    "qti-lookup-outcome-value",
    [attr("identifier", identifier)],
    [el("qti-variable", [attr("identifier", source)])],
  );

/**
 * Construct an item whose response processing looks up the outcome `TARGET` from the integer
 * response `RESPONSE`, `TARGET` holding a match table: an identifier outcome, or a record, which
 * writes no base type.
 *
 * @param cardinality `TARGET`'s cardinality.
 * @returns The document at `items/test.xml`.
 */
const lookedUpItem = (cardinality: string): SourceDocument => {
  const table = el(
    "qti-match-table",
    [attr("default-value", "F")],
    [el("qti-match-table-entry", [attr("source-value", "1"), attr("target-value", "A")])],
  );

  return item({
    after: [el("qti-response-processing", [], [lookupElement("TARGET", "RESPONSE")])],
    attributes: [attr("time-dependent", "false")],
    body: [],
    declarations: [
      declaration("qti-response-declaration", "RESPONSE", "integer", "single"),
      cardinality === "record"
        ? el(
            "qti-outcome-declaration",
            [attr("cardinality", "record"), attr("identifier", "TARGET")],
            [table],
          )
        : declaration("qti-outcome-declaration", "TARGET", "identifier", cardinality, [table]),
    ],
  });
};

describe("buildItem", () => {
  it.effect(
    "[I-0] [I-1] [I-2] [I-7] [Q-2] builds BG007's Choice, and its template's rule tree is the inline block's",
    () =>
      Effect.gen(function* buildsBg007() {
        const built: Item = yield* buildItem(bg007(template("match_correct")));
        const inline = yield* buildItem(bg007(matchCorrectBlock()));
        const interaction = choiceIn(built.body);

        assert.strictEqual(built.document, "items/BG007.xml");
        assert.strictEqual(built.identifier, "beginnersguide007");
        assert.strictEqual(built.title, "BG true false example ");
        assert.deepStrictEqual(built.lang, Option.some("en-US"));
        assert.deepStrictEqual(
          built.body.map((node) => node.kind),
          ["element", "choice"],
        );
        assert.deepStrictEqual(
          interaction.choices.map((option) => option.identifier),
          ["true", "false"],
        );
        assert.deepStrictEqual(interaction.choices[0]?.content, [{ kind: "text", text: "True" }]);
        assert.strictEqual(interaction.response, "RESPONSE");
        assert.strictEqual(interaction.cardinality, "single");
        assert.strictEqual(interaction.maxChoices, 1n);
        assert.strictEqual(interaction.minChoices, 0n);
        assert.strictEqual(interaction.shuffle, false);
        assert.strictEqual(interaction.path, `${body}/qti-choice-interaction`);
        assert.deepStrictEqual(
          built.responses.get("RESPONSE")?.correct,
          Option.some<Value>({
            baseType: "identifier",
            cardinality: "single",
            values: [{ baseType: "identifier", value: "true" }],
          }),
        );
        assert.deepStrictEqual(built.outcomes.get("SCORE")?.defaultValue, Option.some(float(1)));
        assert.deepStrictEqual(built.processing, Option.some(matchCorrect));
        assert.deepStrictEqual(inline.processing, built.processing);
        assert.deepStrictEqual(built.unsupported, []);
      }),
  );

  it.effect("resolves map_response to its rule tree and reads the mapping", () =>
    Effect.gen(function* buildsMapResponse() {
      const built = yield* buildItem(
        item({
          after: [template("map_response.xml")],
          body: [el("qti-text-entry-interaction", [attr("response-identifier", "RESPONSE")])],
          declarations: [
            declaration("qti-response-declaration", "RESPONSE", "string", "single", [
              el(
                "qti-mapping",
                [attr("default-value", "0")],
                [
                  el("qti-map-entry", [
                    attr("case-sensitive", "true"),
                    attr("map-key", "York"),
                    attr("mapped-value", "1"),
                  ]),
                  el("qti-map-entry", [attr("map-key", "york"), attr("mapped-value", "0.5")]),
                ],
              ),
            ]),
            declaration("qti-outcome-declaration", "SCORE", "float", "single"),
          ],
        }),
      );

      assert.deepStrictEqual(
        built.processing,
        Option.some<readonly Rule[]>([
          {
            branches: [
              branch(
                {
                  kind: "is-null",
                  operands: [
                    {
                      identifier: "RESPONSE",
                      kind: "variable",
                      operands: [],
                      weightIdentifier: Option.none(),
                    },
                  ],
                },
                [scoreRule(0)],
              ),
            ],
            kind: "condition",
            otherwise: Option.some([
              {
                expression: { identifier: "RESPONSE", kind: "map-response", operands: [] },
                identifier: "SCORE",
                kind: "set-outcome",
              },
            ]),
          },
        ]),
      );
      assert.deepStrictEqual(
        built.responses.get("RESPONSE")?.mapping,
        Option.some({
          defaultValue: 0,
          entries: [
            { caseSensitive: true, key: { baseType: "string", value: "York" }, value: 1 },
            { caseSensitive: false, key: { baseType: "string", value: "york" }, value: 0.5 },
          ],
          lowerBound: Option.none(),
          upperBound: Option.none(),
        }),
      );
    }),
  );

  /* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shape` is the QTI attribute of `qti-area-map-entry` and names an area's geometry, not a structure. */
  it.effect(
    "[I-1] holds a point declaration's qti-area-mapping, its entries in document order",
    () =>
      Effect.gen(function* holdsAreaMapping() {
        const built = yield* buildItem(
          item({
            after: [template("map_response_point")],
            body: [],
            declarations: [
              declaration("qti-response-declaration", "RESPONSE", "point", "single", [
                areaMapping([], "50"),
              ]),
              declaration("qti-response-declaration", "OTHER", "identifier", "single", [
                areaMapping([], "50"),
              ]),
              declaration("qti-outcome-declaration", "SCORE", "float", "single"),
            ],
          }),
        );

        assert.deepStrictEqual(
          built.responses.get("RESPONSE")?.areaMapping,
          Option.some<AreaMapping>({
            defaultValue: 0,
            entries: [
              { coords: [102, 113, 16], mappedValue: 1, shape: "circle" },
              { coords: [0, 0, 50, 40], mappedValue: 0.5, shape: "rect" },
            ],
            lowerBound: Option.none(),
            percent: false,
            upperBound: Option.none(),
          }),
        );
        assert.deepStrictEqual(built.responses.get("OTHER")?.areaMapping, Option.none());
        assert.deepStrictEqual(built.processing, Option.some(mapResponsePoint));
        assert.deepStrictEqual(built.unsupported, []);
      }),
  );

  it.effect(
    "[I-1] holds an area mapping's bounds and default, and percent for a coordinate 50%",
    () =>
      Effect.gen(function* holdsPercentAreaMapping() {
        const built = yield* buildItem(
          item({
            body: [],
            declarations: [
              declaration("qti-response-declaration", "RESPONSE", "point", "multiple", [
                areaMapping(
                  [attr("default-value", "-1"), attr("lower-bound", "0"), attr("upper-bound", "2")],
                  "50%",
                ),
              ]),
            ],
          }),
        );

        assert.deepStrictEqual(
          built.responses.get("RESPONSE")?.areaMapping,
          Option.some<AreaMapping>({
            defaultValue: -1,
            entries: [
              { coords: [102, 113, 16], mappedValue: 1, shape: "circle" },
              { coords: [0, 0, 50, 40], mappedValue: 0.5, shape: "rect" },
            ],
            lowerBound: Option.some(0),
            percent: true,
            upperBound: Option.some(2),
          }),
        );
        assert.deepStrictEqual(built.unsupported, []);
      }),
  );

  /* oxlint-enable anti-slop/no-shape-in-symbol-names */

  it.effect(
    "resolves map_response_point to the rules of its file, read from the cache",
    () =>
      Effect.gen(function* resolvesMapResponsePoint() {
        const rules = yield* templateRules("map_response_point");
        const inline = yield* buildItem(pointItem(el("qti-response-processing", [], rules)));
        const built = yield* buildItem(pointItem(template("map_response_point")));

        assert.deepStrictEqual(built.processing, Option.some(mapResponsePoint));
        assert.deepStrictEqual(inline.processing, built.processing);
        assert.deepStrictEqual(built.unsupported, []);
        assert.deepStrictEqual(inline.unsupported, []);
      }),
    { tags: ["rptemplates"] },
  );

  it.effect("fails naming the path when a template file is missing under HOME", () =>
    Effect.gen(function* missingTemplate() {
      const home = `${import.meta.dirname}/no-such-home`;
      const failure = yield* Effect.flip(
        templateRules("map_response_point").pipe(
          Effect.provide(ConfigProvider.layer(ConfigProvider.fromUnknown({ HOME: home }))),
        ),
      );

      assert.deepStrictEqual(
        failure._tag === "UnreadableTemplateError" ? failure.path : failure._tag,
        `${home}/.cache/gr8des/qti3/rptemplates/map_response_point.xml`,
      );
    }),
  );

  it.effect(
    "[I-9b] map_response_point scores a point in the circle or on its edge 1, one in no area the default, and NULL 0",
    () =>
      Effect.gen(function* scoresMapResponsePoint() {
        const built = yield* buildItem(
          pointItem(template("map_response_point"), [attr("default-value", "0.25")]),
        );
        const scoreOf = (answer: Value) =>
          Effect.map(
            Effect.fromResult(runAttempt(built, fresh(built, "i"), { RESPONSE: answer })),
            (after) => after.outcomes["SCORE"],
          );

        assert.deepStrictEqual(yield* scoreOf(pointValue([102n, 113n])), float(1));
        assert.deepStrictEqual(yield* scoreOf(pointValue([118n, 113n])), float(1));
        assert.deepStrictEqual(yield* scoreOf(pointValue([300n, 300n])), float(0.25));
        assert.deepStrictEqual(yield* scoreOf(pointValue()), float(0));
      }),
  );

  it.effect(
    "marks processing that reads an area mapping with a % coordinate area-coords-percent",
    () =>
      Effect.gen(function* marksPercentCoords() {
        const inline = el(
          "qti-response-processing",
          [],
          [
            el(
              "qti-set-outcome-value",
              [attr("identifier", "SCORE")],
              [el("qti-map-response-point", [attr("identifier", "RESPONSE")])],
            ),
          ],
        );

        for (const processing of [template("map_response_point"), inline]) {
          const built = yield* buildItem(pointItem(processing, [], "50%"));

          assert.deepStrictEqual(built.processing, Option.none());
          assert.deepStrictEqual(built.unsupported, [
            {
              feature: "area-coords-percent",
              path: `${root}/qti-response-processing`,
              shown: "mark",
            },
          ]);
        }
      }),
  );

  it.effect(
    "resolves CC2_match_basic and CC2_map_response to the rules of their files, and CC2_match to match_correct's",
    () =>
      Effect.gen(function* resolvesCc2Templates() {
        const cases = [
          { expected: cc2MatchBasic, name: "CC2_match_basic" },
          { expected: cc2MapResponse, name: "CC2_map_response" },
          { expected: matchCorrect, name: "CC2_match" },
        ] as const;

        for (const { expected, name } of cases) {
          const rules = yield* templateRules(name);
          const inline = yield* buildItem(cc2Item(el("qti-response-processing", [], rules)));
          const built = yield* buildItem(cc2Item(template(name)));

          assert.deepStrictEqual(built.processing, Option.some(expected), name);
          assert.deepStrictEqual(inline.processing, built.processing, name);
          assert.deepStrictEqual(built.unsupported, [], name);
          assert.deepStrictEqual(inline.unsupported, [], name);
        }

        const matchRules = yield* templateRules("match_correct");
        const cc2MatchRules = yield* templateRules("CC2_match");
        const matchInline = yield* buildItem(
          cc2Item(el("qti-response-processing", [], matchRules)),
        );
        const cc2MatchInline = yield* buildItem(
          cc2Item(el("qti-response-processing", [], cc2MatchRules)),
        );

        assert.deepStrictEqual(cc2MatchInline.processing, matchInline.processing);
      }),
    { tags: ["rptemplates"] },
  );

  it.effect("[I-9b] CC2_match scores as match_correct", () =>
    Effect.gen(function* scoresCc2Match() {
      const built = yield* buildItem(bg007(template("CC2_match.xml")));
      const scoreOf = (answer: string) =>
        Effect.map(
          Effect.fromResult(
            runAttempt(built, fresh(built, "i"), { RESPONSE: identifierValue(answer) }),
          ),
          (after) => after.outcomes["SCORE"],
        );

      assert.deepStrictEqual(built.processing, Option.some(matchCorrect));
      assert.deepStrictEqual(yield* scoreOf("true"), float(1));
      assert.deepStrictEqual(yield* scoreOf("false"), float(0));
    }),
  );

  it.effect(
    "[I-9b] CC2_map_response sets FEEDBACK to correct exactly when SCORE equals MAXSCORE, a float or an integer",
    () =>
      Effect.gen(function* scoresCc2MapResponse() {
        for (const baseType of ["float", "integer"] as const) {
          const built = yield* buildItem(
            cc2Item(template("CC2_map_response"), Option.some(baseType)),
          );
          const outcomesOf = (answer: Value) =>
            Effect.map(
              Effect.fromResult(runAttempt(built, fresh(built, "i"), { RESPONSE: answer })),
              (after) => [after.outcomes["SCORE"], after.outcomes["FEEDBACK"]],
            );

          assert.deepStrictEqual(built.processing, Option.some(cc2MapResponse), baseType);
          assert.deepStrictEqual(
            yield* outcomesOf(stringValue("York")),
            [float(1), identifierValue("correct")],
            baseType,
          );
          assert.deepStrictEqual(
            yield* outcomesOf(stringValue("york")),
            [float(0.5), identifierValue("incorrect")],
            baseType,
          );
          assert.deepStrictEqual(
            yield* outcomesOf({ baseType: "string", cardinality: "single", values: [] }),
            [float(0), identifierValue("incorrect")],
            baseType,
          );
        }
      }),
  );

  it.effect(
    "[I-9b] CC2_match_basic sets SCORE to MAXSCORE and FEEDBACKBASIC to correct on a match",
    () =>
      Effect.gen(function* scoresCc2MatchBasic() {
        const built = yield* buildItem(cc2Item(template("CC2_match_basic")));
        const outcomesOf = (answer: string) =>
          Effect.map(
            Effect.fromResult(
              runAttempt(built, fresh(built, "i"), { RESPONSE: stringValue(answer) }),
            ),
            (after) => [after.outcomes["SCORE"], after.outcomes["FEEDBACKBASIC"]],
          );

        assert.deepStrictEqual(built.processing, Option.some(cc2MatchBasic));
        assert.deepStrictEqual(yield* outcomesOf("York"), [float(1), identifierValue("correct")]);
        assert.deepStrictEqual(yield* outcomesOf("Paris"), [
          float(0),
          identifierValue("incorrect"),
        ]);
      }),
  );

  it.effect(
    "marks CC2_map_response and CC2_match_basic on an item with no MAXSCORE variable:MAXSCORE, and refuses neither",
    () =>
      Effect.gen(function* marksMissingMaxScore() {
        for (const name of ["CC2_map_response", "CC2_match_basic"]) {
          const source = cc2Item(template(name), Option.none());
          const built = yield* buildItem(source);

          assert.deepStrictEqual(checkRules(source, tables), [], name);
          assert.deepStrictEqual(built.processing, Option.none(), name);
          assert.deepStrictEqual(
            built.unsupported,
            [
              {
                feature: "variable:MAXSCORE",
                path: `${root}/qti-response-processing`,
                shown: "mark",
              },
            ],
            name,
          );
        }
      }),
  );

  it.effect(
    "marks a CC2_* template that needs what the item does not provide, once per need in the order its tree needs it, judges no need of a variable it does not hold, and runs none of it",
    () =>
      Effect.gen(function* marksUnmetNeeds() {
        const processing = `${root}/qti-response-processing`;
        const unmapped = declaration(
          "qti-response-declaration",
          "RESPONSE",
          "identifier",
          "single",
        );
        const cases = [
          {
            // CC2_map_response sets SCORE to the float 0 before it maps RESPONSE.
            declarations: [
              unmapped,
              declaration("qti-outcome-declaration", "SCORE", "integer", "single"),
              declaration("qti-outcome-declaration", "MAXSCORE", "float", "single"),
              declaration("qti-outcome-declaration", "FEEDBACK", "identifier", "single"),
            ],
            features: ["outcome-type:SCORE", "mapping:RESPONSE"],
            template: "CC2_map_response",
          },
          {
            declarations: [
              unmapped,
              declaration("qti-outcome-declaration", "SCORE", "float", "single"),
              declaration("qti-outcome-declaration", "FEEDBACK", "identifier", "single"),
            ],
            features: ["variable:MAXSCORE", "mapping:RESPONSE"],
            template: "CC2_map_response",
          },
          {
            // The SCORE it sets to MAXSCORE is not judged, for MAXSCORE has no type here.
            declarations: [
              declaration("qti-response-declaration", "RESPONSE", "identifier", "single", [
                values("qti-correct-response", "A"),
              ]),
              declaration("qti-outcome-declaration", "SCORE", "integer", "single"),
              declaration("qti-outcome-declaration", "FEEDBACKBASIC", "identifier", "single"),
            ],
            features: ["variable:MAXSCORE"],
            template: "CC2_match_basic",
          },
        ] as const;

        for (const [index, { declarations, features, template: name }] of cases.entries()) {
          const source = item({ after: [template(name)], body: [], declarations });
          const built = yield* buildItem(source);
          const label = `case ${index + 1}, ${name}`;

          assert.deepStrictEqual(checkRules(source, tables), [], label);
          assert.deepStrictEqual(built.processing, Option.none(), label);
          assert.deepStrictEqual(
            built.unsupported,
            features.map((feature) => ({ feature, path: processing, shown: "mark" })),
            label,
          );
        }
      }),
  );

  it.effect(
    "reads an inline qti-equal in exact mode, written or by default, into the rule tree",
    () =>
      Effect.gen(function* readsEqual() {
        const expected: readonly Rule[] = [
          setRule("SAME", {
            includeLowerBound: true,
            includeUpperBound: true,
            kind: "equal",
            operands: [
              { kind: "base-value", operands: [], value: integer(1n) },
              { kind: "base-value", operands: [], value: float(1) },
            ],
            tolerance: [],
            toleranceMode: "exact",
          }),
        ];

        for (const attributes of [[], [attr("tolerance-mode", "exact")]]) {
          const built = yield* buildItem(
            item({
              after: [equalBlock(attributes, "1", "1.0")],
              body: [],
              declarations: [declaration("qti-outcome-declaration", "SAME", "boolean", "single")],
            }),
          );

          assert.deepStrictEqual(built.processing, Option.some(expected));
          assert.deepStrictEqual(built.unsupported, []);
        }
      }),
  );

  it.effect(
    "reads a qti-equal's tolerance token by token and its bounds, in exact mode, with no mark",
    () =>
      Effect.gen(function* readsTolerance() {
        const built = yield* buildItem(
          item({
            after: [
              equalBlock(
                [
                  attr("tolerance", " 0.5\tSAME "),
                  attr("include-lower-bound", "false"),
                  attr("tolerance-mode", "exact"),
                ],
                "1",
                "1.0",
              ),
            ],
            body: [],
            declarations: [declaration("qti-outcome-declaration", "SAME", "boolean", "single")],
          }),
        );

        assert.deepStrictEqual(
          built.processing,
          Option.some([
            setRule("SAME", {
              includeLowerBound: false,
              includeUpperBound: true,
              kind: "equal",
              operands: [
                { kind: "base-value", operands: [], value: integer(1n) },
                { kind: "base-value", operands: [], value: float(1) },
              ],
              tolerance: [
                { _tag: "literal", value: 0.5 },
                { _tag: "ref", identifier: "SAME" },
              ],
              toleranceMode: "exact",
            }),
          ]),
        );
        assert.deepStrictEqual(built.unsupported, []);
      }),
  );

  it.effect(
    "[I-1] refuses an area map entry's shape or coords outside its type as attribute-type",
    () =>
      Effect.gen(function* refusesAreaEntry() {
        const entry = `${root}/qti-response-declaration/qti-area-mapping/qti-area-map-entry`;
        const cases = [
          { attribute: "shape", entry: areaEntry("square", "0,0,1,1", "1") },
          { attribute: "coords", entry: areaEntry("rect", "0,0,1.5,1", "1") },
          { attribute: "coords", entry: areaEntry("rect", "0,0,1 ,1", "1") },
        ];

        for (const { attribute, entry: written } of cases) {
          const refusal = yield* Effect.flip(
            buildItem(
              item({
                body: [],
                declarations: [
                  declaration("qti-response-declaration", "RESPONSE", "point", "single", [
                    el("qti-area-mapping", [], [written]),
                  ]),
                ],
              }),
            ),
          );

          assert.strictEqual(refusal.rule, "attribute-type");
          assert.deepStrictEqual(refusal.location, {
            kind: "path",
            path: `${entry}/@${attribute}`,
          });
        }
      }),
  );

  it.effect("[I-7] shows a hotspot interaction as a notice and keeps the rest of the body", () =>
    Effect.gen(function* hotspotIsNotice() {
      const built = yield* buildItem(
        item({
          body: [
            el("p", [], [text("Which one is Highland Lighthouse?")]),
            el(
              "qti-hotspot-interaction",
              [attr("max-choices", "1"), attr("response-identifier", "RESPONSE")],
              [
                el("qti-prompt", [], [text("Pick one")]),
                el("img", [attr("alt", "a map"), attr("src", "images/map.svg")]),
                el("qti-hotspot-choice", [attr("coords", "418,29,40"), attr("identifier", "R")]),
              ],
            ),
            el("p", [], [text("After")]),
          ],
          declarations: [
            declaration("qti-response-declaration", "RESPONSE", "identifier", "single"),
          ],
        }),
      );
      const path = `${body}/qti-hotspot-interaction`;

      assert.deepStrictEqual(built.body[1], {
        feature: "qti-hotspot-interaction",
        kind: "unsupported",
        path,
      });
      assert.deepStrictEqual(
        built.body.map((node) => node.kind),
        ["element", "unsupported", "element"],
      );
      assert.deepStrictEqual(childrenOf(built.body[2]), [{ kind: "text", text: "After" }]);
      assert.deepStrictEqual(built.unsupported, [
        { feature: "qti-hotspot-interaction", path, shown: "notice" },
      ]);
    }),
  );

  it.effect(
    '[Q-2] builds shuffle="true" with no unsupported feature and keeps the choices in document order',
    () =>
      Effect.gen(function* shuffleIsModelled() {
        const built = yield* buildItem(
          item({
            body: [
              el(
                "qti-choice-interaction",
                [attr("response-identifier", "RESPONSE"), attr("shuffle", "true")],
                [choice("C", "Cat"), choice("A", "Ant"), choice("B", "Bee")],
              ),
            ],
            declarations: [
              declaration("qti-response-declaration", "RESPONSE", "identifier", "multiple"),
            ],
          }),
        );
        const interaction = choiceIn(built.body);

        assert.deepStrictEqual(
          interaction.choices.map((option) => option.identifier),
          ["C", "A", "B"],
        );
        assert.strictEqual(interaction.shuffle, true);
        assert.strictEqual(interaction.cardinality, "multiple");
        assert.deepStrictEqual(built.unsupported, []);
      }),
  );

  it.effect(
    '[Q-2] reads each choice\'s fixed as an xs:boolean: true for "true" and "1", false for "false", "0" and none',
    () =>
      Effect.gen(function* fixedChoices() {
        const built = yield* buildItem(
          item({
            body: [
              el(
                "qti-choice-interaction",
                [attr("response-identifier", "RESPONSE"), attr("shuffle", "true")],
                [
                  el(
                    "qti-simple-choice",
                    [attr("fixed", "true"), attr("identifier", "T")],
                    [text("True")],
                  ),
                  el(
                    "qti-simple-choice",
                    [attr("fixed", "1"), attr("identifier", "O")],
                    [text("One")],
                  ),
                  el(
                    "qti-simple-choice",
                    [attr("fixed", "false"), attr("identifier", "F")],
                    [text("False")],
                  ),
                  el(
                    "qti-simple-choice",
                    [attr("fixed", " 0 "), attr("identifier", "Z")],
                    [text("Zero")],
                  ),
                  choice("N", "None"),
                ],
              ),
            ],
            declarations: [
              declaration("qti-response-declaration", "RESPONSE", "identifier", "single"),
            ],
          }),
        );

        assert.deepStrictEqual(
          choiceIn(built.body).choices.map((option) => [option.identifier, option.fixed]),
          [
            ["T", true],
            ["O", true],
            ["F", false],
            ["Z", false],
            ["N", false],
          ],
        );
        assert.deepStrictEqual(built.unsupported, []);
      }),
  );

  it.effect('[Q-2] refuses fixed="yes" on a choice with value-type, naming the attribute', () =>
    Effect.gen(function* refusesFixed() {
      const refusal = yield* Effect.flip(
        buildItem(
          item({
            body: [
              el(
                "qti-choice-interaction",
                [attr("response-identifier", "RESPONSE")],
                [
                  el(
                    "qti-simple-choice",
                    [attr("fixed", "yes"), attr("identifier", "A")],
                    [text("Ant")],
                  ),
                ],
              ),
            ],
            declarations: [
              declaration("qti-response-declaration", "RESPONSE", "identifier", "single"),
            ],
          }),
        ),
      );

      assert.strictEqual(refusal.rule, "value-type");
      assert.deepStrictEqual(refusal.location, {
        kind: "path",
        path: `${body}/qti-choice-interaction/qti-simple-choice/@fixed`,
      });
      assert.deepStrictEqual(refusal.detail, { baseType: "boolean", lexical: "yes" });
    }),
  );

  it.effect(
    "[I-0] [Q-2] reads adaptive and shuffle as true for true or 1 and false for false or 0, marking only adaptive",
    () =>
      Effect.gen(function* booleanAttributes() {
        const cases = [
          ["true", true],
          ["1", true],
          [" 1 ", true],
          ["false", false],
          ["0", false],
        ] as const;

        for (const [written, on] of cases) {
          const built = yield* buildItem(
            item({
              attributes: [attr("adaptive", written)],
              body: [
                el(
                  "qti-choice-interaction",
                  [attr("response-identifier", "RESPONSE"), attr("shuffle", written)],
                  [choice("A", "Ant"), choice("B", "Bee")],
                ),
              ],
              declarations: [
                declaration("qti-response-declaration", "RESPONSE", "identifier", "single"),
              ],
            }),
          );

          assert.strictEqual(choiceIn(built.body).shuffle, on, written);
          assert.deepStrictEqual(
            built.unsupported,
            on ? [{ feature: 'adaptive="true"', path: root, shown: "mark" }] : [],
            written,
          );
        }
      }),
  );

  it.effect("[Q-2] reads a Choice's aria-label and aria-labelledby, none when absent", () =>
    Effect.gen(function* choiceNames() {
      const named = choiceIn(
        (yield* buildItem(
          choiceItem([attr("aria-label", "Pick a city"), attr("aria-labelledby", "intro")]),
        )).body,
      );
      const unnamed = choiceIn((yield* buildItem(choiceItem([]))).body);

      assert.deepStrictEqual(named.ariaLabel, Option.some("Pick a city"));
      assert.deepStrictEqual(named.ariaLabelledby, Option.some("intro"));
      assert.deepStrictEqual(unnamed.ariaLabel, Option.none());
      assert.deepStrictEqual(unnamed.ariaLabelledby, Option.none());
    }),
  );

  it.effect(
    '[Q-12] builds an Inline Choice from XML with every field, reading required=" true " as true',
    () =>
      Effect.gen(function* buildsInlineChoice() {
        const built = yield* buildItem(
          yield* fromXml(
            inlineChoiceXml(
              [
                '<qti-inline-choice-interaction aria-label="Colour" aria-labelledby="intro"',
                ' class="qti-input-width-10" data-min-selections-message="Pick a colour"',
                ' data-prompt="Choose" min-choices=" 1 " required=" true "',
                ' response-identifier="RESPONSE" shuffle=" 1 ">',
                "<qti-label>Sky <em>colour</em></qti-label>",
                '<qti-inline-choice identifier=" R ">red</qti-inline-choice>',
                '<qti-inline-choice fixed=" true " identifier="B">blue</qti-inline-choice>',
                '<qti-inline-choice fixed="0" identifier="G"><em>green</em></qti-inline-choice>',
                "</qti-inline-choice-interaction>",
              ].join(""),
            ),
          ),
        );
        const expected: InlineChoiceInteraction = {
          ariaLabel: Option.some("Colour"),
          ariaLabelledby: Option.some("intro"),
          choices: [
            {
              content: [{ kind: "text", text: "red" }],
              fixed: false,
              identifier: "R",
              templateVisibility: Option.none(),
            },
            {
              content: [{ kind: "text", text: "blue" }],
              fixed: true,
              identifier: "B",
              templateVisibility: Option.none(),
            },
            {
              content: [
                {
                  attributes: [],
                  children: [{ kind: "text", text: "green" }],
                  kind: "element",
                  path: `${inlinePath}/qti-inline-choice[3]/em`,
                  tag: "em",
                },
              ],
              fixed: false,
              identifier: "G",
              templateVisibility: Option.none(),
            },
          ],
          class: "qti-input-width-10",
          kind: "inline-choice",
          label: Option.some([
            { kind: "text", text: "Sky " },
            {
              attributes: [],
              children: [{ kind: "text", text: "colour" }],
              kind: "element",
              path: `${inlinePath}/qti-label/em`,
              tag: "em",
            },
          ]),
          messages: { min: Option.some("Pick a colour") },
          minChoices: 1n,
          path: inlinePath,
          placeholder: Option.some("Choose"),
          required: true,
          response: "RESPONSE",
          shuffle: true,
        };

        assert.deepStrictEqual(childrenOf(built.body[0]), [
          { kind: "text", text: "The sky is " },
          expected,
          { kind: "text", text: "." },
        ]);
        assert.deepStrictEqual(built.unsupported, []);
      }),
  );

  it.effect(
    "[Q-12] builds an Inline Choice with only its required attributes at the defaults",
    () =>
      Effect.gen(function* inlineChoiceDefaults() {
        const built = yield* buildItem(
          yield* fromXml(
            inlineChoiceXml(
              [
                '<qti-inline-choice-interaction response-identifier="RESPONSE">',
                '<qti-inline-choice identifier="R">red</qti-inline-choice>',
                "</qti-inline-choice-interaction>",
              ].join(""),
            ),
          ),
        );
        const expected: InlineChoiceInteraction = {
          ariaLabel: Option.none(),
          ariaLabelledby: Option.none(),
          choices: [
            {
              content: [{ kind: "text", text: "red" }],
              fixed: false,
              identifier: "R",
              templateVisibility: Option.none(),
            },
          ],
          class: "",
          kind: "inline-choice",
          label: Option.none(),
          messages: { min: Option.none() },
          minChoices: 0n,
          path: inlinePath,
          placeholder: Option.none(),
          required: false,
          response: "RESPONSE",
          shuffle: false,
        };

        assert.deepStrictEqual(childrenOf(built.body[0])[1], expected);
        assert.deepStrictEqual(built.unsupported, []);
      }),
  );

  it.effect(
    "[Q-12] shows an Inline Choice as its notice when a choice holds what a native option cannot show, and builds one of text-safe elements",
    () =>
      Effect.gen(function* textSafeChoices() {
        const shown = [
          '<img alt="a" src="a.png"/>',
          "line<br/>break",
          "H<sub>2</sub>O",
          "<em>x<sup>2</sup></em>",
          '<span><a href="a.html">link</a></span>',
        ];
        for (const content of shown) {
          const [node, unsupported] = yield* inlineChoiceWith(content);

          assert.deepStrictEqual(
            node,
            { feature: "qti-inline-choice-interaction", kind: "unsupported", path: inlinePath },
            content,
          );
          assert.deepStrictEqual(
            unsupported,
            [{ feature: "qti-inline-choice-interaction", path: inlinePath, shown: "notice" }],
            content,
          );
        }

        const built = [
          "<em>emphasis</em>",
          "<span><strong>bold</strong> and <b>b</b></span>",
          '<abbr title="water">H2O</abbr> <code>c</code> <kbd>k</kbd> <bdi>b</bdi>',
        ];
        for (const content of built) {
          const [node, unsupported] = yield* inlineChoiceWith(content);

          assert.strictEqual(node?.kind, "inline-choice", content);
          assert.deepStrictEqual(unsupported, [], content);
        }

        const withEntity = yield* buildItem(
          item({
            body: [
              el(
                "p",
                [],
                [
                  el(
                    "qti-inline-choice-interaction",
                    [attr("response-identifier", "RESPONSE")],
                    [
                      el(
                        "qti-inline-choice",
                        [attr("identifier", "A")],
                        [text("a"), entity("nbsp"), text("b")],
                      ),
                    ],
                  ),
                ],
              ),
            ],
            declarations: [
              declaration("qti-response-declaration", "RESPONSE", "identifier", "single"),
            ],
          }),
        );

        assert.deepStrictEqual(withEntity.unsupported, [
          { feature: "qti-inline-choice-interaction", path: inlinePath, shown: "notice" },
        ]);
      }),
  );

  it.effect("[Q-20] builds a Text Entry with its attributes and base 10 by default", () =>
    Effect.gen(function* buildsTextEntry() {
      const built = yield* buildItem(
        item({
          body: [
            el(
              "p",
              [],
              [
                text("Capital: "),
                el("qti-text-entry-interaction", [
                  attr("expected-length", " 12 "),
                  attr("placeholder-text", "a city"),
                  attr("response-identifier", "RESPONSE"),
                ]),
              ],
            ),
          ],
          declarations: [declaration("qti-response-declaration", "RESPONSE", "string", "single")],
        }),
      );
      const expected: TextEntryInteraction = {
        ariaLabel: Option.none(),
        ariaLabelledby: Option.none(),
        base: 10,
        baseType: "string",
        cardinality: "single",
        class: "",
        expectedLength: Option.some(12n),
        kind: "text-entry",
        path: `${body}/p/qti-text-entry-interaction`,
        patternMask: Option.none(),
        patternMaskMessage: Option.none(),
        placeholder: Option.some("a city"),
        response: "RESPONSE",
      };

      assert.deepStrictEqual(childrenOf(built.body[0]), [
        { kind: "text", text: "Capital: " },
        expected,
      ]);
    }),
  );

  it.effect(
    '[Q-20] builds a Text Entry with pattern-mask="[0-9]+" holding its pattern, with no notice',
    () =>
      Effect.gen(function* patternMaskIsModelled() {
        const built = yield* buildItem(textEntryItem([attr("pattern-mask", "[0-9]+")]));
        const [entry] = childrenOf(built.body[0]);

        assert.strictEqual(entry?.kind, "text-entry");
        assert.deepStrictEqual(
          entry?.kind === "text-entry" ? entry.patternMask : Option.none(),
          Option.some("[0-9]+"),
        );
        assert.deepStrictEqual(built.unsupported, []);
      }),
  );

  it.effect(
    '[Q-20] keeps the notice pattern-mask on a pattern the translator refuses, pattern-mask="[0-9", and builds the item',
    () =>
      Effect.gen(function* refusedPatternIsNotice() {
        const built = yield* buildItem(textEntryItem([attr("pattern-mask", "[0-9")]));
        const path = `${body}/p/qti-text-entry-interaction`;

        assert.deepStrictEqual(childrenOf(built.body[0]), [
          { feature: "pattern-mask", kind: "unsupported", path },
        ]);
        assert.deepStrictEqual(built.unsupported, [
          { feature: "pattern-mask", path, shown: "notice" },
        ]);
      }),
  );

  it.effect(
    '[Q-5] builds an Extended Text with format="xhtml" and its pattern-mask, with no notice',
    () =>
      Effect.gen(function* xhtmlIsModelled() {
        const built = yield* buildItem(
          item({
            body: [
              el("qti-extended-text-interaction", [
                attr("format", "xhtml"),
                attr("pattern-mask", "[^<>]*"),
                attr("response-identifier", "RESPONSE"),
              ]),
            ],
            declarations: [declaration("qti-response-declaration", "RESPONSE", "string", "single")],
          }),
        );
        const [node] = built.body;

        assert.strictEqual(node?.kind, "extended-text");
        assert.deepStrictEqual(
          node?.kind === "extended-text" ? [node.format, node.patternMask] : [],
          ["xhtml", Option.some("[^<>]*")],
        );
        assert.deepStrictEqual(built.unsupported, []);
      }),
  );

  it.effect("[Q-5] builds an Extended Text with its prompt and format", () =>
    Effect.gen(function* buildsExtendedText() {
      const built = yield* buildItem(
        item({
          body: [
            el(
              "qti-extended-text-interaction",
              [
                attr("expected-lines", "5"),
                attr("format", "preformatted"),
                attr("response-identifier", "RESPONSE"),
              ],
              [el("qti-prompt", [], [text("Write a poem.")])],
            ),
          ],
          declarations: [declaration("qti-response-declaration", "RESPONSE", "string", "single")],
        }),
      );
      const [node] = built.body;

      assert.strictEqual(node?.kind, "extended-text");
      assert.deepStrictEqual(
        node?.kind === "extended-text"
          ? [
              node.format,
              node.expectedLines,
              node.prompt,
              node.cardinality,
              node.maxStrings,
              node.minStrings,
            ]
          : [],
        [
          "preformatted",
          Option.some(5n),
          Option.some([{ kind: "text", text: "Write a poem." }]),
          "single",
          Option.none(),
          0n,
        ],
      );
    }),
  );

  for (const [cardinality, attributes, maxStrings, minStrings] of [
    ["ordered", [attr("max-strings", "3")], Option.some(3n), 0n],
    ["multiple", [attr("max-strings", "1000000000000")], Option.some(1_000_000_000_000n), 0n],
    ["ordered", [attr("max-strings", "200"), attr("min-strings", "100")], Option.some(200n), 100n],
    ["ordered", [attr("max-strings", "0")], Option.some(0n), 0n],
  ] as const) {
    it.effect(
      `[Q-5] builds an Extended Text bound to ${cardinality} with ${attributes.map((attribute) => `${attribute.local}="${attribute.value}"`).join(" ")}, its counts held exactly, with no notice`,
      () =>
        Effect.gen(function* buildsContainer() {
          const built = yield* buildItem(extendedTextItem(cardinality, attributes));
          const [node] = built.body;

          assert.strictEqual(node?.kind, "extended-text");
          assert.deepStrictEqual(
            node?.kind === "extended-text"
              ? [node.cardinality, node.maxStrings, node.minStrings]
              : [],
            [cardinality, maxStrings, minStrings],
          );
          assert.deepStrictEqual(built.unsupported, []);
        }),
    );
  }

  for (const [attributes, maxStrings, minStrings] of [
    [[attr("max-strings", "200"), attr("min-strings", "101")], Option.some(200n), 101n],
    [
      [attr("max-strings", "1000000000000"), attr("min-strings", "1000000000000")],
      Option.some(1_000_000_000_000n),
      1_000_000_000_000n,
    ],
    [[attr("max-strings", "5"), attr("min-strings", "101")], Option.some(5n), 101n],
  ] as const) {
    it.effect(
      `[Q-5] builds an ordered Extended Text with ${attributes.map((attribute) => `${attribute.local}="${attribute.value}"`).join(" ")}, its counts held exactly, and shows min-strings>100 in place of its Controls`,
      () =>
        Effect.gen(function* overTheCap() {
          const built = yield* buildItem(extendedTextItem("ordered", attributes));
          const [node] = built.body;

          assert.strictEqual(node?.kind, "extended-text");
          assert.deepStrictEqual(
            node?.kind === "extended-text"
              ? [node.cardinality, node.maxStrings, node.minStrings]
              : [],
            ["ordered", maxStrings, minStrings],
          );
          assert.deepStrictEqual(built.unsupported, [
            {
              feature: "min-strings>100",
              path: `${body}/qti-extended-text-interaction`,
              shown: "notice",
            },
          ]);
        }),
    );
  }

  it.effect("[Q-5] refuses a min-strings that is not a count, and shows no notice for it", () =>
    Effect.gen(function* refusesMinStrings() {
      const refused = yield* Effect.flip(
        buildItem(
          extendedTextItem("ordered", [attr("max-strings", "3"), attr("min-strings", "x101")]),
        ),
      );

      assert.strictEqual(refused.rule, "value-type");
    }),
  );

  it.effect("[Q-32] shows a portable custom interaction as a notice", () =>
    Effect.gen(function* pciIsNotice() {
      const path = `${body}/qti-portable-custom-interaction`;
      const built = yield* buildItem(
        item({
          body: [
            el(
              "qti-portable-custom-interaction",
              [attr("module", "fractions"), attr("response-identifier", "RESPONSE")],
              [el("qti-interaction-markup", [], [el("div", [], [text("Loading")])])],
            ),
          ],
          declarations: [declaration("qti-response-declaration", "RESPONSE", "string", "single")],
        }),
      );

      assert.deepStrictEqual(built.body, [
        { feature: "qti-portable-custom-interaction", kind: "unsupported", path },
      ]);
      assert.deepStrictEqual(built.unsupported, [
        { feature: "qti-portable-custom-interaction", path, shown: "notice" },
      ]);
    }),
  );

  it.effect(
    "[I-5] holds a qti-printed-variable as a printed-variable node with every attribute it carries, and lists no unsupported feature for it",
    () =>
      Effect.gen(function* holdsPrintedVariable() {
        const built = yield* buildItem(
          item({
            body: [
              el(
                "p",
                [],
                [
                  text("Score: "),
                  el("qti-printed-variable", [
                    attr("base", "B"),
                    attr("delimiter", ", "),
                    attr("field", "x"),
                    attr("format", "%.1f"),
                    attr("identifier", " SCORE "),
                    attr("index", "2"),
                    attr("mapping-indicator", ":"),
                    attr("power-form", "true"),
                  ]),
                ],
              ),
            ],
            declarations: [
              declaration("qti-outcome-declaration", "B", "integer", "single"),
              declaration("qti-outcome-declaration", "SCORE", "float", "single"),
            ],
          }),
        );

        assert.deepStrictEqual(built.body, [
          {
            attributes: [],
            children: [
              { kind: "text", text: "Score: " },
              {
                base: { _tag: "ref", identifier: "B" },
                delimiter: ", ",
                field: Option.some("x"),
                format: Option.some("%.1f"),
                identifier: "SCORE",
                index: Option.some<IntegerOrRef>({ _tag: "literal", value: 2n }),
                kind: "printed-variable",
                mappingIndicator: ":",
                path: `${body}/p/qti-printed-variable`,
                powerForm: true,
              },
            ],
            kind: "element",
            path: `${body}/p`,
            tag: "p",
          },
        ]);
        assert.deepStrictEqual(built.unsupported, []);
      }),
  );

  it.effect(
    "[I-5] holds a qti-printed-variable that carries only its identifier at the attributes' defaults: base 10, the delimiter ;, the mapping indicator =, no power form, and no format, field or index",
    () =>
      Effect.gen(function* printedVariableDefaults() {
        const built = yield* buildItem(
          item({
            body: [el("qti-printed-variable", [attr("identifier", "SCORE")])],
            declarations: [declaration("qti-outcome-declaration", "SCORE", "float", "single")],
          }),
        );

        assert.deepStrictEqual(built.body, [
          {
            base: { _tag: "literal", value: 10n },
            delimiter: ";",
            field: Option.none(),
            format: Option.none(),
            identifier: "SCORE",
            index: Option.none(),
            kind: "printed-variable",
            mappingIndicator: "=",
            path: `${body}/qti-printed-variable`,
            powerForm: false,
          },
        ]);
        assert.deepStrictEqual(built.unsupported, []);
      }),
  );

  it.effect(
    "[I-5] holds a qti-template-block and a qti-template-inline as body nodes with their identifier, template visibility and content, a block's content its qti-content-body's and its qti-stylesheet a mark",
    () =>
      Effect.gen(function* holdsTemplateContent() {
        const built = yield* buildItem(
          item({
            body: [
              el(
                "p",
                [],
                [
                  text("Go by "),
                  el(
                    "qti-template-inline",
                    [attr("identifier", " plane "), attr("template-identifier", " TRANSPORT ")],
                    [el("em", [], [text("air")])],
                  ),
                ],
              ),
              el(
                "qti-template-block",
                [
                  attr("identifier", "SOLUTION"),
                  attr("show-hide", "hide"),
                  attr("template-identifier", "SHOWN"),
                ],
                [
                  el("qti-stylesheet", [attr("href", "block.css"), attr("type", "text/css")]),
                  el("qti-content-body", [], [el("p", [], [text("Worked solution")])]),
                ],
              ),
            ],
            declarations: [],
          }),
        );
        const block = `${body}/qti-template-block`;

        assert.deepStrictEqual(built.body, [
          {
            attributes: [],
            children: [
              { kind: "text", text: "Go by " },
              {
                content: [
                  {
                    attributes: [],
                    children: [{ kind: "text", text: "air" }],
                    kind: "element",
                    path: `${body}/p/qti-template-inline/em`,
                    tag: "em",
                  },
                ],
                identifier: "plane",
                kind: "template-inline",
                path: `${body}/p/qti-template-inline`,
                responses: [],
                templateVisibility: { showHide: "show", templateIdentifier: "TRANSPORT" },
              },
            ],
            kind: "element",
            path: `${body}/p`,
            tag: "p",
          },
          {
            content: [
              {
                attributes: [],
                children: [{ kind: "text", text: "Worked solution" }],
                kind: "element",
                path: `${block}/qti-content-body/p`,
                tag: "p",
              },
            ],
            identifier: "SOLUTION",
            kind: "template-block",
            path: block,
            responses: [],
            templateVisibility: { showHide: "hide", templateIdentifier: "SHOWN" },
          },
        ]);
        assert.deepStrictEqual(built.unsupported, [
          { feature: "qti-stylesheet", path: `${block}/qti-stylesheet`, shown: "mark" },
        ]);
      }),
  );

  it.effect(
    "[I-5] names in a template block's or inline's responses every response its content binds, an interaction read or shown as a notice and one in nested template content, each once in document order, and none for content that binds none",
    () =>
      Effect.gen(function* namesTemplateResponses() {
        const built = yield* buildItem(
          item({
            body: [
              el(
                "qti-template-block",
                [attr("identifier", "ANSWERS"), attr("template-identifier", "SHOWN")],
                [
                  el(
                    "qti-content-body",
                    [],
                    [
                      el(
                        "qti-choice-interaction",
                        [attr("response-identifier", "R1")],
                        [el("qti-simple-choice", [attr("identifier", "A")], [text("Ant")])],
                      ),
                      el(
                        "qti-order-interaction",
                        [attr("response-identifier", " R2 ")],
                        [
                          el("qti-simple-choice", [attr("identifier", "X")], [text("First")]),
                          el("qti-simple-choice", [attr("identifier", "Y")], [text("Second")]),
                        ],
                      ),
                      el(
                        "p",
                        [],
                        [
                          text("Then "),
                          el(
                            "qti-template-inline",
                            [attr("identifier", "ENTRY"), attr("template-identifier", "SHOWN")],
                            [el("qti-text-entry-interaction", [attr("response-identifier", "R3")])],
                          ),
                        ],
                      ),
                      el(
                        "qti-choice-interaction",
                        [attr("response-identifier", "R1")],
                        [el("qti-simple-choice", [attr("identifier", "B")], [text("Bee")])],
                      ),
                    ],
                  ),
                ],
              ),
              el(
                "qti-template-block",
                [attr("identifier", "QUIET"), attr("template-identifier", "SHOWN")],
                [el("qti-content-body", [], [el("p", [], [text("Nothing to answer")])])],
              ),
            ],
            declarations: [
              declaration("qti-response-declaration", "R1", "identifier", "single"),
              declaration("qti-response-declaration", "R2", "identifier", "ordered"),
              declaration("qti-response-declaration", "R3", "string", "single"),
            ],
          }),
        );
        const [answers, quiet] = built.body;
        const inline = answers?.kind === "template-block" ? answers.content[2] : undefined;
        const [, entry] = childrenOf(inline);

        assert.deepStrictEqual(
          answers?.kind === "template-block" ? answers.responses : "not a template block",
          ["R1", "R2", "R3"],
        );
        assert.deepStrictEqual(
          entry?.kind === "template-inline" ? entry.responses : "not a template inline",
          ["R3"],
        );
        assert.deepStrictEqual(
          quiet?.kind === "template-block" ? quiet.responses : "not a template block",
          [],
        );
      }),
  );

  it.effect(
    "[I-5] reads a qti-simple-choice's and a qti-inline-choice's template-identifier and show-hide into its template visibility, show when absent, and gives none to a choice with no template-identifier whatever its show-hide",
    () =>
      Effect.gen(function* readsChoiceVisibility() {
        const built = yield* buildItem(
          item({
            body: [
              el(
                "qti-choice-interaction",
                [attr("response-identifier", "RESPONSE")],
                [
                  el(
                    "qti-simple-choice",
                    [attr("identifier", "A"), attr("template-identifier", " SHOWN ")],
                    [text("Ant")],
                  ),
                  el(
                    "qti-simple-choice",
                    [
                      attr("identifier", "B"),
                      attr("show-hide", "hide"),
                      attr("template-identifier", "HIDDEN"),
                    ],
                    [text("Bee")],
                  ),
                  el(
                    "qti-simple-choice",
                    [attr("identifier", "C"), attr("show-hide", "hide")],
                    [text("Cat")],
                  ),
                ],
              ),
              el(
                "p",
                [],
                [
                  el(
                    "qti-inline-choice-interaction",
                    [attr("response-identifier", "COLOUR")],
                    [
                      el(
                        "qti-inline-choice",
                        [
                          attr("identifier", "R"),
                          attr("show-hide", "hide"),
                          attr("template-identifier", "SHOWN"),
                        ],
                        [text("red")],
                      ),
                    ],
                  ),
                ],
              ),
            ],
            declarations: [
              declaration("qti-response-declaration", "RESPONSE", "identifier", "single"),
              declaration("qti-response-declaration", "COLOUR", "identifier", "single"),
            ],
          }),
        );
        assert.deepStrictEqual(visibilities(choiceIn(built.body).choices), [
          ["A", Option.some<TemplateVisibility>({ showHide: "show", templateIdentifier: "SHOWN" })],
          [
            "B",
            Option.some<TemplateVisibility>({ showHide: "hide", templateIdentifier: "HIDDEN" }),
          ],
          ["C", Option.none()],
        ]);

        const [inline] = childrenOf(built.body[1]);
        assert.deepStrictEqual(
          inline?.kind === "inline-choice" ? visibilities(inline.choices) : [],
          [
            [
              "R",
              Option.some<TemplateVisibility>({ showHide: "hide", templateIdentifier: "SHOWN" }),
            ],
          ],
        );
        assert.deepStrictEqual(built.unsupported, []);
      }),
  );

  it.effect("[I-0] [I-8] marks what it does not render outside the body and on body elements", () =>
    Effect.gen(function* marksUnread() {
      const built = yield* buildItem(
        item({
          after: [el("qti-modal-feedback", [attr("identifier", "fb")], [text("Well done")])],
          attributes: [attr("adaptive", "true")],
          body: [
            el(
              "p",
              [
                attr("base", "images/", xmlNamespace),
                attr("lang", "fr", xmlNamespace),
                attr("class", "lead"),
              ],
              [text("Bonjour")],
            ),
          ],
          declarations: [
            declaration("qti-response-declaration", "POINT", "point", "single"),
            el("qti-template-declaration", [
              attr("base-type", "integer"),
              attr("cardinality", "single"),
              attr("identifier", "T"),
            ]),
          ],
        }),
      );

      assert.deepStrictEqual(built.body[0], {
        attributes: [
          { name: "xml:lang", value: "fr" },
          { name: "class", value: "lead" },
        ],
        children: [{ kind: "text", text: "Bonjour" }],
        kind: "element",
        path: `${body}/p`,
        tag: "p",
      });
      assert.deepStrictEqual(built.lang, Option.none());
      assert.deepStrictEqual([...built.responses.keys()], ["POINT"]);
      assert.deepStrictEqual(built.unsupported, [
        { feature: 'adaptive="true"', path: root, shown: "mark" },
        { feature: "xml:base", path: `${body}/p`, shown: "mark" },
        { feature: "qti-modal-feedback", path: `${root}/qti-modal-feedback`, shown: "mark" },
      ]);
    }),
  );

  it.effect(
    "[I-1] [I-2] marks each record outcome and each untyped declaration at its path, and holds a record response declaration with no mark",
    () =>
      Effect.gen(function* marksUnmodelledDeclarations() {
        const built = yield* buildItem(
          item({
            body: [],
            declarations: [
              el("qti-response-declaration", [
                attr("cardinality", "record"),
                attr("identifier", "DETAIL"),
              ]),
              el("qti-response-declaration", [
                attr("cardinality", "single"),
                attr("identifier", "BARE"),
              ]),
              declaration("qti-response-declaration", "RESPONSE", "string", "single"),
              el("qti-outcome-declaration", [
                attr("cardinality", "record"),
                attr("identifier", "CONTEXT"),
              ]),
              el("qti-outcome-declaration", [
                attr("cardinality", "multiple"),
                attr("identifier", "LIST"),
              ]),
            ],
          }),
        );
        const response = `${root}/qti-response-declaration`;
        const outcome = `${root}/qti-outcome-declaration`;

        assert.deepStrictEqual([...built.responses.keys()], ["RESPONSE"]);
        assert.deepStrictEqual([...(built.records?.keys() ?? [])], ["DETAIL"]);
        assert.deepStrictEqual([...built.outcomes.keys()], []);
        assert.deepStrictEqual(built.unsupported, [
          { feature: 'base-type=""', path: `${response}[2]`, shown: "mark" },
          { feature: 'cardinality="record"', path: `${outcome}[1]`, shown: "mark" },
          { feature: 'base-type=""', path: `${outcome}[2]`, shown: "mark" },
        ]);
      }),
  );

  it.effect(
    "[I-1] holds a record response declaration bound to a Text Entry in records, its correct and default values read field by field, the first of a repeated identifier kept",
    () =>
      Effect.gen(function* holdsRecordResponse() {
        const built = yield* buildItem(
          item({
            after: [
              el(
                "qti-response-processing",
                [],
                [
                  el(
                    "qti-set-outcome-value",
                    [attr("identifier", "EMPTY")],
                    [isNullOf(variableElement("ANSWER"))],
                  ),
                ],
              ),
            ],
            body: [el("qti-text-entry-interaction", [attr("response-identifier", "ANSWER")])],
            declarations: [
              el(
                "qti-response-declaration",
                [attr("cardinality", "record"), attr("identifier", "ANSWER")],
                [
                  el(
                    "qti-correct-response",
                    [],
                    [
                      recordField("stringValue", "string", " 12 "),
                      recordField(" floatValue ", "float", " 12 "),
                      recordField("integerValue", "integer", "12"),
                      recordField("integerValue", "integer", "99"),
                    ],
                  ),
                  el(
                    "qti-default-value",
                    [],
                    [
                      recordField("stringValue", "string", ""),
                      recordField("stringValue", "string", "later"),
                      recordField("exponent", "integer", " 3 "),
                      recordField("stringValue", "string", "last"),
                    ],
                  ),
                ],
              ),
              el("qti-response-declaration", [
                attr("cardinality", "record"),
                attr("identifier", "BARE"),
              ]),
              declaration("qti-outcome-declaration", "EMPTY", "boolean", "single"),
            ],
          }),
        );
        const expected: ReadonlyMap<string, RecordDeclaration> = new Map([
          [
            "ANSWER",
            {
              correct: Option.some<RecordValue>({
                cardinality: "record",
                fields: [
                  { identifier: "stringValue", value: { baseType: "string", value: " 12 " } },
                  { identifier: "floatValue", value: { baseType: "float", value: 12 } },
                  { identifier: "integerValue", value: { baseType: "integer", value: 12n } },
                ],
              }),
              defaultValue: Option.some<RecordValue>({
                cardinality: "record",
                fields: [
                  { identifier: "stringValue", value: { baseType: "string", value: "later" } },
                  { identifier: "exponent", value: { baseType: "integer", value: 3n } },
                ],
              }),
              identifier: "ANSWER",
            },
          ],
          ["BARE", { correct: Option.none(), defaultValue: Option.none(), identifier: "BARE" }],
        ]);

        assert.deepStrictEqual(built.records, expected);
        assert.deepStrictEqual([...built.responses.keys()], []);
        assert.isUndefined(built.unheld);
        // The Text Entry is the string control bound to the record, and the processing that reads
        // ANSWER through qti-is-null runs, since the engine holds its record there; neither the
        // declaration nor the Text Entry carries a feature.
        assert.deepStrictEqual(
          built.body.map((node) =>
            node.kind === "text-entry" ? [node.baseType, node.cardinality] : node.kind,
          ),
          [["string", "record"]],
        );
        assert.isTrue(Option.isSome(built.processing), "the processing runs");
        assert.deepStrictEqual(built.unsupported, []);
      }),
  );

  it.effect(
    "[Q-20] [Q-5] builds a record-bound control: a Text Entry and an Extended Text bound to a record response the model holds are the string control of cardinality record, their attributes held as for a string binding, with no notice",
    () =>
      Effect.gen(function* buildsRecordBoundControls() {
        const built = yield* buildItem(
          item({
            body: [
              el(
                "p",
                [],
                [
                  el("qti-text-entry-interaction", [
                    attr("base", "16"),
                    attr("expected-length", "8"),
                    attr("pattern-mask", "[0-9]+"),
                    attr("placeholder-text", "a number"),
                    attr("response-identifier", "NUMBER"),
                  ]),
                ],
              ),
              el(
                "qti-extended-text-interaction",
                [
                  attr("expected-lines", "3"),
                  attr("max-strings", "4"),
                  attr("min-strings", "1"),
                  attr("response-identifier", "WORKING"),
                ],
                [el("qti-prompt", [], [text("Show your working.")])],
              ),
            ],
            declarations: [
              el("qti-response-declaration", [
                attr("cardinality", "record"),
                attr("identifier", "NUMBER"),
              ]),
              el("qti-response-declaration", [
                attr("cardinality", "record"),
                attr("identifier", "WORKING"),
              ]),
            ],
          }),
        );
        const entry: TextEntryInteraction = {
          ariaLabel: Option.none(),
          ariaLabelledby: Option.none(),
          base: 16,
          baseType: "string",
          cardinality: "record",
          class: "",
          expectedLength: Option.some(8n),
          kind: "text-entry",
          path: `${body}/p/qti-text-entry-interaction`,
          patternMask: Option.some("[0-9]+"),
          patternMaskMessage: Option.none(),
          placeholder: Option.some("a number"),
          response: "NUMBER",
        };
        const working: ExtendedTextInteraction = {
          ariaLabel: Option.none(),
          ariaLabelledby: Option.none(),
          base: 10,
          baseType: "string",
          cardinality: "record",
          class: "",
          expectedLength: Option.none(),
          expectedLines: Option.some(3n),
          format: "plain",
          kind: "extended-text",
          maxStrings: Option.some(4n),
          minStrings: 1n,
          path: `${body}/qti-extended-text-interaction`,
          patternMask: Option.none(),
          patternMaskMessage: Option.none(),
          placeholder: Option.none(),
          prompt: Option.some([{ kind: "text", text: "Show your working." }]),
          response: "WORKING",
        };

        assert.deepStrictEqual(childrenOf(built.body[0]), [entry]);
        assert.deepStrictEqual(built.body[1], working);
        assert.deepStrictEqual([...(built.records?.keys() ?? [])], ["NUMBER", "WORKING"]);
        assert.deepStrictEqual(built.unsupported, []);
      }),
  );

  it.effect(
    '[Q-20] builds no record-bound control for a record response the model does not hold, one with a file field: its Text Entry is the notice cardinality="record"',
    () =>
      Effect.gen(function* fileRecordIsNotice() {
        const built = yield* buildItem(
          item({
            body: [el("qti-text-entry-interaction", [attr("response-identifier", "UPLOAD")])],
            declarations: [
              el(
                "qti-response-declaration",
                [attr("cardinality", "record"), attr("identifier", "UPLOAD")],
                [el("qti-correct-response", [], [recordField("content", "file", "a.txt")])],
              ),
            ],
          }),
        );
        const path = `${body}/qti-text-entry-interaction`;

        assert.isUndefined(built.records);
        assert.deepStrictEqual(built.body, [
          { feature: 'cardinality="record"', kind: "unsupported", path },
        ]);
        assert.deepStrictEqual(built.unsupported, [
          {
            feature: 'cardinality="record"',
            path: `${root}/qti-response-declaration`,
            shown: "mark",
          },
          { feature: 'cardinality="record"', path, shown: "notice" },
        ]);
      }),
  );

  it.effect(
    "[I-1] keeps a record response declaration of a file field, or of base type file, unheld and marked, and holds one of modelled fields",
    () =>
      Effect.gen(function* keepsFileRecordUnheld() {
        const built = yield* buildItem(
          item({
            body: [],
            declarations: [
              el(
                "qti-response-declaration",
                [attr("cardinality", "record"), attr("identifier", "UPLOADS")],
                [
                  el(
                    "qti-correct-response",
                    [],
                    [
                      recordField("name", "string", "a.txt"),
                      recordField("content", "file", "a.txt"),
                    ],
                  ),
                ],
              ),
              el("qti-response-declaration", [
                attr("base-type", "file"),
                attr("cardinality", "record"),
                attr("identifier", "FILED"),
              ]),
              el(
                "qti-response-declaration",
                [attr("cardinality", "record"), attr("identifier", "HELD")],
                [el("qti-default-value", [], [recordField("name", "string", "a.txt")])],
              ),
            ],
          }),
        );
        const response = `${root}/qti-response-declaration`;

        assert.deepStrictEqual(
          built.unheld,
          new Map<string, UnheldDeclaration>([
            [
              "UPLOADS",
              {
                baseType: Option.none(),
                cardinality: "record",
                declaresCorrect: true,
                identifier: "UPLOADS",
                kind: "response",
              },
            ],
            [
              "FILED",
              {
                baseType: Option.some("file"),
                cardinality: "record",
                declaresCorrect: false,
                identifier: "FILED",
                kind: "response",
              },
            ],
          ]),
        );
        assert.deepStrictEqual([...(built.records?.keys() ?? [])], ["HELD"]);
        assert.deepStrictEqual(built.unsupported, [
          { feature: 'cardinality="record"', path: `${response}[1]`, shown: "mark" },
          { feature: 'base-type="file"', path: `${response}[2]`, shown: "mark" },
          { feature: 'cardinality="record"', path: `${response}[2]`, shown: "mark" },
        ]);
      }),
  );

  it.effect(
    "[I-1] [I-2] [T-9] holds each file and record declaration's identifier, base type, cardinality and kind in unheld, a response's with whether it declares a correct response, and no modelled one",
    () =>
      Effect.gen(function* holdsUnheldDeclarations() {
        const built = yield* buildItem(
          item({
            body: [],
            declarations: [
              declaration("qti-response-declaration", "UPLOAD", "file", "single"),
              declaration("qti-response-declaration", "KEYED", "file", "single", [
                values("qti-correct-response", "answer.txt"),
              ]),
              declaration("qti-response-declaration", "RESPONSE", "string", "single"),
              el("qti-outcome-declaration", [
                attr("cardinality", "record"),
                attr("identifier", "DETAIL"),
              ]),
              declaration("qti-outcome-declaration", "TYPED", "integer", "record"),
              declaration("qti-outcome-declaration", "FILES", "file", "multiple"),
              declaration("qti-outcome-declaration", "SCORE", "float", "single"),
              templateDeclaration("ROW", "record"),
              templateDeclaration("T", "single", "integer"),
            ],
          }),
        );

        assert.deepStrictEqual(
          built.unheld,
          new Map([
            [
              "UPLOAD",
              {
                baseType: Option.some("file"),
                cardinality: "single",
                declaresCorrect: false,
                identifier: "UPLOAD",
                kind: "response",
              },
            ],
            [
              "KEYED",
              {
                baseType: Option.some("file"),
                cardinality: "single",
                declaresCorrect: true,
                identifier: "KEYED",
                kind: "response",
              },
            ],
            [
              "DETAIL",
              {
                baseType: Option.none(),
                cardinality: "record",
                identifier: "DETAIL",
                kind: "outcome",
              },
            ],
            [
              "TYPED",
              {
                baseType: Option.some("integer"),
                cardinality: "record",
                identifier: "TYPED",
                kind: "outcome",
              },
            ],
            [
              "FILES",
              {
                baseType: Option.some("file"),
                cardinality: "multiple",
                identifier: "FILES",
                kind: "outcome",
              },
            ],
            [
              "ROW",
              {
                baseType: Option.none(),
                cardinality: "record",
                identifier: "ROW",
                kind: "template",
              },
            ],
          ]),
        );
        assert.deepStrictEqual([...built.responses.keys()], ["RESPONSE"]);
        assert.deepStrictEqual([...built.outcomes.keys()], ["SCORE"]);
        assert.deepStrictEqual([...built.templates.keys()], ["T"]);
      }),
  );

  it.effect(
    "[I-1] reads a response's qti-default-value through the value model, none without",
    () =>
      Effect.gen(function* readsResponseDefault() {
        const built = yield* buildItem(
          item({
            body: [],
            declarations: [
              declaration("qti-response-declaration", "WITH", "integer", "single", [
                values("qti-default-value", " 7 "),
              ]),
              declaration("qti-response-declaration", "WITHOUT", "integer", "single"),
            ],
          }),
        );

        assert.deepStrictEqual(
          built.responses.get("WITH")?.defaultValue,
          Option.some<Value>({
            baseType: "integer",
            cardinality: "single",
            values: [{ baseType: "integer", value: 7n }],
          }),
        );
        assert.deepStrictEqual(built.responses.get("WITHOUT")?.defaultValue, Option.none());
      }),
  );

  it.effect("[I-1] reads an integer correct response beyond 2^53 exactly", () =>
    Effect.gen(function* readsExactCorrect() {
      const built = yield* buildItem(
        item({
          body: [],
          declarations: [
            declaration("qti-response-declaration", "RESPONSE", "integer", "single", [
              values("qti-correct-response", "9007199254740993"),
            ]),
          ],
        }),
      );

      assert.deepStrictEqual(
        built.responses.get("RESPONSE")?.correct,
        Option.some<Value>({
          baseType: "integer",
          cardinality: "single",
          values: [{ baseType: "integer", value: 2n ** 53n + 1n }],
        }),
      );
    }),
  );

  it.effect("[I-1] reads an integer map-key of 31 digits exactly", () =>
    Effect.gen(function* readsExactMapKey() {
      const built = yield* buildItem(
        item({
          body: [],
          declarations: [
            declaration("qti-response-declaration", "RESPONSE", "integer", "single", [
              el(
                "qti-mapping",
                [],
                [
                  el("qti-map-entry", [
                    attr("map-key", "-1000000000000000000000000000000"),
                    attr("mapped-value", "1"),
                  ]),
                ],
              ),
            ]),
          ],
        }),
      );

      assert.deepStrictEqual(
        built.responses.get("RESPONSE")?.mapping,
        Option.some({
          defaultValue: 0,
          entries: [
            {
              caseSensitive: false,
              key: { baseType: "integer", value: -(10n ** 30n) },
              value: 1,
            },
          ],
          lowerBound: Option.none(),
          upperBound: Option.none(),
        }),
      );
    }),
  );

  it.effect(
    "gives no processing for a template outside the built-ins or an element outside the engine",
    () =>
      Effect.gen(function* unsupportedProcessing() {
        const declarations = [
          declaration("qti-response-declaration", "RESPONSE", "string", "single"),
        ];
        const processing = `${root}/qti-response-processing`;
        const cases = [
          {
            element: el("qti-response-processing", [
              attr("template", "https://example.com/rp/custom.xml"),
            ]),
            feature: 'template="https://example.com/rp/custom.xml"',
            path: processing,
          },
          {
            element: el(
              "qti-response-processing",
              [],
              [
                el(
                  "qti-set-template-value",
                  [attr("identifier", "T")],
                  [el("qti-variable", [attr("identifier", "RESPONSE")])],
                ),
              ],
            ),
            feature: "qti-set-template-value",
            path: `${processing}/qti-set-template-value`,
          },
        ];

        for (const { element, feature, path } of cases) {
          const built = yield* buildItem(item({ after: [element], body: [], declarations }));

          assert.deepStrictEqual(built.processing, Option.none());
          assert.deepStrictEqual(built.unsupported, [{ feature, path, shown: "mark" }]);
        }
      }),
  );

  it.effect("[I-2] refuses an integer qti-value of abc as value-type at its path", () =>
    Effect.gen(function* refusesBadValue() {
      const refusal = yield* Effect.flip(
        buildItem(
          item({
            body: [],
            declarations: [
              declaration("qti-outcome-declaration", "COUNT", "integer", "single", [
                values("qti-default-value", "abc"),
              ]),
            ],
          }),
        ),
      );

      assert.strictEqual(refusal._tag, "Refusal");
      assert.strictEqual(refusal.rule, "value-type");
      assert.strictEqual(refusal.document, "items/test.xml");
      assert.deepStrictEqual(refusal.location, {
        kind: "path",
        path: `${root}/qti-outcome-declaration/qti-default-value/qti-value`,
      });
    }),
  );

  it.effect(
    "[I-9a] reads a duration qti-value as seconds in a double, INF, NaN and a negative included, marks a file outcome, and refuses PT1M30.5S as value-type",
    () =>
      Effect.gen(function* readsDurations() {
        const cases: readonly (readonly [string, number])[] = [
          ["90.5", 90.5],
          ["89.95", 89.95],
          [" INF ", Number.POSITIVE_INFINITY],
          ["-INF", Number.NEGATIVE_INFINITY],
          ["NaN", Number.NaN],
          ["-1.5", -1.5],
        ];
        for (const [written, seconds] of cases) {
          const built = yield* buildItem(
            item({
              body: [],
              declarations: [
                declaration("qti-outcome-declaration", "TIME", "duration", "single", [
                  values("qti-default-value", written),
                ]),
                declaration("qti-outcome-declaration", "UPLOAD", "file", "single"),
              ],
            }),
          );

          assert.deepStrictEqual([...built.outcomes.keys()], ["TIME"], written);
          assert.deepStrictEqual(
            built.outcomes.get("TIME")?.defaultValue,
            Option.some({
              baseType: "duration",
              cardinality: "single",
              values: [{ baseType: "duration", value: seconds }],
            }),
            written,
          );
          assert.deepStrictEqual(
            built.unsupported,
            [
              {
                feature: 'base-type="file"',
                path: `${root}/qti-outcome-declaration[2]`,
                shown: "mark",
              },
            ],
            written,
          );
        }

        const refusal = yield* Effect.flip(
          buildItem(
            item({
              body: [],
              declarations: [
                declaration("qti-outcome-declaration", "TIME", "duration", "single", [
                  values("qti-default-value", "PT1M30.5S"),
                ]),
              ],
            }),
          ),
        );

        assert.strictEqual(refusal.rule, "value-type");
        assert.deepStrictEqual(refusal.location, {
          kind: "path",
          path: `${root}/qti-outcome-declaration/qti-default-value/qti-value`,
        });
        assert.deepStrictEqual(refusal.detail, { baseType: "duration", lexical: "PT1M30.5S" });
      }),
  );

  it.effect(
    "[I-3] holds each template declaration of a modelled type with its default, param-variable and math-variable, and marks only the others, by their type",
    () =>
      Effect.gen(function* holdsTemplates() {
        const built = yield* buildItem(
          item({
            body: [],
            declarations: [
              el(
                "qti-template-declaration",
                [
                  attr("base-type", "integer"),
                  attr("cardinality", "single"),
                  attr("identifier", "T"),
                  attr("param-variable", "true"),
                ],
                [values("qti-default-value", "7")],
              ),
              el(
                "qti-template-declaration",
                [
                  attr("base-type", "string"),
                  attr("cardinality", "multiple"),
                  attr("identifier", "NAMES"),
                  attr("math-variable", " 1 "),
                  attr("param-variable", "0"),
                ],
                [values("qti-default-value", "a", "b")],
              ),
              el("qti-template-declaration", [
                attr("base-type", "duration"),
                attr("cardinality", "single"),
                attr("identifier", "D"),
              ]),
              el("qti-template-declaration", [
                attr("cardinality", "record"),
                attr("identifier", "R"),
              ]),
              el("qti-template-declaration", [
                attr("base-type", "float"),
                attr("cardinality", "single"),
                attr("identifier", "P"),
              ]),
            ],
          }),
        );
        const expected: readonly TemplateDeclaration[] = [
          {
            baseType: "integer",
            cardinality: "single",
            defaultValue: Option.some(integer(7n)),
            identifier: "T",
            mathVariable: false,
            paramVariable: true,
          },
          {
            baseType: "string",
            cardinality: "multiple",
            defaultValue: Option.some({
              baseType: "string",
              cardinality: "multiple",
              values: [
                { baseType: "string", value: "a" },
                { baseType: "string", value: "b" },
              ],
            }),
            identifier: "NAMES",
            mathVariable: true,
            paramVariable: false,
          },
          {
            baseType: "duration",
            cardinality: "single",
            defaultValue: Option.none(),
            identifier: "D",
            mathVariable: false,
            paramVariable: false,
          },
          {
            baseType: "float",
            cardinality: "single",
            defaultValue: Option.none(),
            identifier: "P",
            mathVariable: false,
            paramVariable: false,
          },
        ];

        assert.deepStrictEqual([...built.templates.keys()], ["T", "NAMES", "D", "P"]);
        assert.deepStrictEqual([...built.templates.values()], expected);
        assert.deepStrictEqual(built.templateProcessing, Option.none());
        assert.deepStrictEqual(built.unsupported, [
          {
            feature: 'cardinality="record"',
            path: `${root}/qti-template-declaration[4]`,
            shown: "mark",
          },
        ]);
      }),
  );

  it.effect(
    "[I-3] refuses a template default outside its base type as value-type at its path",
    () =>
      Effect.gen(function* refusesTemplateDefault() {
        const refusal = yield* Effect.flip(
          buildItem(
            item({
              body: [],
              declarations: [
                el(
                  "qti-template-declaration",
                  [
                    attr("base-type", "integer"),
                    attr("cardinality", "single"),
                    attr("identifier", "T"),
                  ],
                  [values("qti-default-value", "abc")],
                ),
              ],
            }),
          ),
        );

        assert.strictEqual(refusal.rule, "value-type");
        assert.deepStrictEqual(refusal.location, {
          kind: "path",
          path: `${root}/qti-template-declaration/qti-default-value/qti-value`,
        });
      }),
  );

  it.effect(
    "[I-2] reads an outcome declaration's six reporting attributes as the XSD types them, none when absent",
    () =>
      Effect.gen(function* readsReporting() {
        const built = yield* buildItem(
          item({
            body: [],
            declarations: [
              el("qti-outcome-declaration", [
                attr("base-type", "float"),
                attr("cardinality", "single"),
                attr("identifier", "SCORE"),
                attr("view", " candidate\n\ttutor  scorer "),
                attr("interpretation", " Points, out of 10 "),
                attr("long-interpretation", " https://example.org/scales/points\n"),
                attr("normal-maximum", " 10 "),
                attr("normal-minimum", "-1.5"),
                attr("mastery-value", "1e400"),
              ]),
              declaration("qti-outcome-declaration", "MAXSCORE", "float", "single"),
            ],
          }),
        );
        const score = built.outcomes.get("SCORE");
        const bare = built.outcomes.get("MAXSCORE");

        assert.deepStrictEqual(score?.view, Option.some(["candidate", "tutor", "scorer"]));
        assert.deepStrictEqual(score?.interpretation, Option.some(" Points, out of 10 "));
        assert.deepStrictEqual(
          score?.longInterpretation,
          Option.some("https://example.org/scales/points"),
        );
        assert.deepStrictEqual(score?.normalMaximum, Option.some(10));
        assert.deepStrictEqual(score?.normalMinimum, Option.some(-1.5));
        assert.deepStrictEqual(score?.masteryValue, Option.some(Number.MAX_VALUE));
        assert.deepStrictEqual(
          [
            bare?.view,
            bare?.interpretation,
            bare?.longInterpretation,
            bare?.normalMaximum,
            bare?.normalMinimum,
            bare?.masteryValue,
          ],
          [
            Option.none(),
            Option.none(),
            Option.none(),
            Option.none(),
            Option.none(),
            Option.none(),
          ],
        );
      }),
  );

  it.effect("[I-2] refuses a malformed normal-maximum as value-type at the attribute", () =>
    Effect.gen(function* refusesNormalMaximum() {
      const refusal = yield* Effect.flip(
        buildItem(
          item({
            body: [],
            declarations: [
              el("qti-outcome-declaration", [
                attr("base-type", "float"),
                attr("cardinality", "single"),
                attr("identifier", "SCORE"),
                attr("normal-maximum", "ten"),
              ]),
            ],
          }),
        ),
      );

      assert.strictEqual(refusal.rule, "value-type");
      assert.deepStrictEqual(refusal.location, {
        kind: "path",
        path: `${root}/qti-outcome-declaration/@normal-maximum`,
      });
      assert.deepStrictEqual(refusal.detail, { baseType: "xs:double", lexical: "ten" });
    }),
  );

  it.effect("[I-2] refuses a view that names no view as attribute-type at the attribute", () =>
    Effect.gen(function* refusesView() {
      const refusal = yield* Effect.flip(
        buildItem(
          item({
            body: [],
            declarations: [
              el("qti-outcome-declaration", [
                attr("base-type", "float"),
                attr("cardinality", "single"),
                attr("identifier", "SCORE"),
                attr("view", "candidate learner"),
              ]),
            ],
          }),
        ),
      );

      assert.strictEqual(refusal.rule, "attribute-type");
      assert.deepStrictEqual(refusal.location, {
        kind: "path",
        path: `${root}/qti-outcome-declaration/@view`,
      });
      assert.deepStrictEqual(refusal.detail, { attribute: "view", value: "candidate learner" });
    }),
  );

  it.effect(
    "[I-9a] reads a match table's entries and default-value into its outcome's declaration (readings 7 and 8)",
    () =>
      Effect.gen(function* readsMatchTable() {
        const built = yield* buildItem(
          item({
            body: [],
            declarations: [
              declaration("qti-outcome-declaration", "GRADE", "float", "single", [
                el(
                  "qti-match-table",
                  [attr("default-value", "0")],
                  [
                    el("qti-match-table-entry", [
                      attr("source-value", "1"),
                      attr("target-value", "0.5"),
                    ]),
                    el("qti-match-table-entry", [
                      attr("source-value", " -2 "),
                      attr("target-value", "1e1"),
                    ]),
                  ],
                ),
              ]),
            ],
          }),
        );

        assert.deepStrictEqual(
          built.outcomes.get("GRADE")?.lookupTable,
          Option.some({
            defaultValue: Option.some({ baseType: "float", value: 0 }),
            entries: [
              { sourceValue: 1n, targetValue: { baseType: "float", value: 0.5 } },
              { sourceValue: -2n, targetValue: { baseType: "float", value: 10 } },
            ],
            kind: "match",
          }),
        );
      }),
  );

  it.effect(
    "[I-9a] reads an interpolation table's include-boundary, true when absent, and no default-value as none",
    () =>
      Effect.gen(function* readsInterpolationTable() {
        const built = yield* buildItem(
          item({
            body: [],
            declarations: [
              declaration("qti-outcome-declaration", "BAND", "identifier", "single", [
                el(
                  "qti-interpolation-table",
                  [],
                  [
                    el("qti-interpolation-table-entry", [
                      attr("source-value", "7.5"),
                      attr("target-value", "HIGH"),
                    ]),
                    el("qti-interpolation-table-entry", [
                      attr("include-boundary", "false"),
                      attr("source-value", "2"),
                      attr("target-value", "MID"),
                    ]),
                    el("qti-interpolation-table-entry", [
                      attr("include-boundary", "true"),
                      attr("source-value", "0"),
                      attr("target-value", "LOW"),
                    ]),
                  ],
                ),
              ]),
            ],
          }),
        );

        assert.deepStrictEqual(
          built.outcomes.get("BAND")?.lookupTable,
          Option.some({
            defaultValue: Option.none(),
            entries: [
              {
                includeBoundary: true,
                sourceValue: 7.5,
                targetValue: { baseType: "identifier", value: "HIGH" },
              },
              {
                includeBoundary: false,
                sourceValue: 2,
                targetValue: { baseType: "identifier", value: "MID" },
              },
              {
                includeBoundary: true,
                sourceValue: 0,
                targetValue: { baseType: "identifier", value: "LOW" },
              },
            ],
            kind: "interpolation",
          }),
        );
      }),
  );

  it.effect(
    "[I-9a] refuses a match table's target-value outside its outcome's base type, or padded, as value-type at the attribute (readings 7 and 8)",
    () =>
      Effect.gen(function* refusesTargetValue() {
        for (const written of ["A", " 1"]) {
          const refusal = yield* Effect.flip(
            buildItem(
              item({
                body: [],
                declarations: [
                  declaration("qti-outcome-declaration", "LEVEL", "integer", "single", [
                    el(
                      "qti-match-table",
                      [],
                      [
                        el("qti-match-table-entry", [
                          attr("source-value", "1"),
                          attr("target-value", written),
                        ]),
                      ],
                    ),
                  ]),
                ],
              }),
            ),
          );

          assert.strictEqual(refusal.rule, "value-type", written);
          assert.deepStrictEqual(refusal.location, {
            kind: "path",
            path: `${root}/qti-outcome-declaration/qti-match-table/qti-match-table-entry/@target-value`,
          });
          assert.deepStrictEqual(refusal.detail, { baseType: "integer", lexical: written });
        }
      }),
  );

  it.effect("[I-9a] marks nothing for an outcome declaration's lookup table, now read", () =>
    Effect.gen(function* marksNoTable() {
      const built = yield* buildItem(
        item({
          body: [],
          declarations: [
            declaration("qti-outcome-declaration", "GRADE", "identifier", "single", [
              values("qti-default-value", "F"),
              el(
                "qti-match-table",
                [attr("default-value", "F")],
                [
                  el("qti-match-table-entry", [
                    attr("source-value", "1"),
                    attr("target-value", "A"),
                  ]),
                ],
              ),
            ]),
            declaration("qti-outcome-declaration", "BAND", "float", "single", [
              el(
                "qti-interpolation-table",
                [attr("default-value", "0")],
                [
                  el("qti-interpolation-table-entry", [
                    attr("source-value", "1"),
                    attr("target-value", "1"),
                  ]),
                ],
              ),
            ]),
          ],
        }),
      );

      assert.deepStrictEqual(built.unsupported, []);
      assert.deepStrictEqual(
        [...built.outcomes.values()].map((outcome) =>
          outcome.lookupTable.pipe(Option.map((table) => table.kind)),
        ),
        [Option.some("match"), Option.some("interpolation")],
      );
    }),
  );

  it.effect(
    "[I-9a] reads a qti-lookup-outcome-value into a lookup rule and a qti-exit-response into an exit, with no mark",
    () =>
      Effect.gen(function* readsLookupAndExit() {
        const built = yield* buildItem(
          rulesItem([lookupElement("GRADE", "RESPONSE"), el("qti-exit-response"), setScore("1")]),
        );

        assert.deepStrictEqual(
          built.processing,
          Option.some([
            {
              expression: {
                identifier: "RESPONSE",
                kind: "variable",
                operands: [],
                weightIdentifier: Option.none(),
              },
              identifier: "GRADE",
              kind: "lookup-outcome",
            },
            { kind: "exit" },
            scoreRule(1),
          ]),
        );
        assert.deepStrictEqual(built.unsupported, []);
      }),
  );

  it.effect(
    "[I-9a] reads a qti-response-processing-fragment's rules in its place, nested fragments and a branch's included",
    () =>
      Effect.gen(function* readsFragments() {
        const built = yield* buildItem(
          rulesItem([
            el(
              "qti-response-processing-fragment",
              [],
              [
                setScore("1"),
                el("qti-response-processing-fragment", [], [el("qti-exit-response")]),
              ],
            ),
            el(
              "qti-response-condition",
              [],
              [
                el(
                  "qti-response-if",
                  [],
                  [
                    el("qti-base-value", [attr("base-type", "boolean")], [text("true")]),
                    el("qti-response-processing-fragment", [], [setScore("2")]),
                  ],
                ),
              ],
            ),
            setScore("0"),
          ]),
        );

        assert.deepStrictEqual(
          built.processing,
          Option.some([
            scoreRule(1),
            { kind: "exit" },
            {
              branches: [
                branch(
                  {
                    kind: "base-value",
                    operands: [],
                    value: {
                      baseType: "boolean",
                      cardinality: "single",
                      values: [{ baseType: "boolean", value: true }],
                    },
                  },
                  [scoreRule(2)],
                ),
              ],
              kind: "condition",
              otherwise: Option.none(),
            },
            scoreRule(0),
          ]),
        );
        assert.deepStrictEqual(built.unsupported, []);
      }),
  );

  it.effect(
    "[I-9a] marks each xi:include in response processing xi:include at its path and runs none, as it is never fetched (S-6)",
    () =>
      Effect.gen(function* marksInclude() {
        const built = yield* buildItem(
          rulesItem([
            setScore("1"),
            el("include", [attr("href", "rules.xml")], [], xincludeNamespace),
            el(
              "qti-response-processing-fragment",
              [],
              [el("include", [attr("href", "more.xml")], [], xincludeNamespace)],
            ),
          ]),
        );

        assert.deepStrictEqual(built.processing, Option.none());
        assert.deepStrictEqual(built.unsupported, [
          {
            feature: "xi:include",
            path: `${root}/qti-response-processing/{${xincludeNamespace}}include`,
            shown: "mark",
          },
          {
            feature: "xi:include",
            path: `${root}/qti-response-processing/qti-response-processing-fragment/{${xincludeNamespace}}include`,
            shown: "mark",
          },
        ]);
      }),
  );

  it.effect(
    "[I-9a] marks a lookup whose outcome or expression names a variable the engine does not hold, as a set's",
    () =>
      Effect.gen(function* marksUnheldLookup() {
        const built = yield* buildItem(
          rulesItem([lookupElement("MISSING", "GRADE"), lookupElement("GRADE", "UNDECLARED")]),
        );

        assert.deepStrictEqual(built.processing, Option.none());
        assert.deepStrictEqual(built.unsupported, [
          { feature: "variable:MISSING", path: `${root}/qti-response-processing`, shown: "mark" },
          {
            feature: "variable:UNDECLARED",
            path: `${root}/qti-response-processing`,
            shown: "mark",
          },
        ]);
      }),
  );

  it("align-54 lookup refused for a non-single outcome E15: refuses a match table under a multiple, an ordered or a record outcome as misplaced-element, check lookup-cardinality, so check refuses the item (reading 100)", () => {
    for (const cardinality of ["multiple", "ordered", "record"]) {
      const verdict = check(lookedUpItem(cardinality), tables, Option.none());

      assert.deepStrictEqual(
        verdict.verdict === "refused"
          ? verdict.refusals.map((refusal) => [refusal.rule, refusal.location, refusal.detail])
          : verdict.verdict,
        [
          [
            "misplaced-element",
            { kind: "path", path: `${root}/qti-outcome-declaration/qti-match-table` },
            {
              check: "lookup-cardinality",
              element: "qti-match-table",
              identifier: "TARGET",
              reading: "100",
            },
          ],
        ],
        cardinality,
      );
    }
  });

  it.effect(
    "[I-9a] marks a lookup into an outcome that is not single where buildItem reads the item without the structural walk, the one path that still reaches the mark: outcome-type for a multiple or an ordered outcome, and variable for a record one, which the model does not hold",
    () =>
      Effect.gen(function* marksUnwalkedLookup() {
        const processing = `${root}/qti-response-processing`;
        const cases = [
          {
            cardinality: "multiple",
            marks: [{ feature: "outcome-type:TARGET", path: processing }],
          },
          { cardinality: "ordered", marks: [{ feature: "outcome-type:TARGET", path: processing }] },
          {
            cardinality: "record",
            marks: [
              { feature: 'cardinality="record"', path: `${root}/qti-outcome-declaration` },
              { feature: "variable:TARGET", path: processing },
            ],
          },
        ] as const;

        for (const { cardinality, marks } of cases) {
          const built = yield* buildItem(lookedUpItem(cardinality));

          assert.deepStrictEqual(
            built.unsupported,
            marks.map((mark) => ({ ...mark, shown: "mark" })),
            cardinality,
          );
          assert.deepStrictEqual(built.processing, Option.none(), cardinality);
        }
      }),
  );

  it.effect('[Q-2] refuses max-choices="-1" as value-type, outside xs:nonNegativeInteger', () =>
    Effect.gen(function* refusesNegativeCount() {
      const refusal = yield* Effect.flip(buildItem(choiceItem([attr("max-choices", "-1")])));

      assert.strictEqual(refusal._tag, "Refusal");
      assert.strictEqual(refusal.rule, "value-type");
      assert.deepStrictEqual(refusal.location, {
        kind: "path",
        path: `${body}/qti-choice-interaction/@max-choices`,
      });
    }),
  );

  it.effect('[Q-20] refuses base="2147483648" as value-type, outside xs:int', () =>
    Effect.gen(function* refusesWideBase() {
      const refusal = yield* Effect.flip(buildItem(textEntryItem([attr("base", "2147483648")])));

      assert.strictEqual(refusal._tag, "Refusal");
      assert.strictEqual(refusal.rule, "value-type");
      assert.deepStrictEqual(refusal.location, {
        kind: "path",
        path: `${body}/p/qti-text-entry-interaction/@base`,
      });
    }),
  );

  it.effect('[Q-20] reads base="-2147483648", the least xs:int', () =>
    Effect.gen(function* readsLeastBase() {
      const built = yield* buildItem(textEntryItem([attr("base", "-2147483648")]));
      const [entry] = childrenOf(built.body[0]);

      assert.strictEqual(entry?.kind === "text-entry" ? entry.base : undefined, -2_147_483_648);
    }),
  );

  it.effect("[Q-2] refuses a max-choices of 10^30 as count-range and reads -0 as 0", () =>
    Effect.gen(function* refusesHugeCount() {
      const refusal = yield* Effect.flip(
        buildItem(choiceItem([attr("max-choices", "1000000000000000000000000000000")])),
      );
      const built = yield* buildItem(choiceItem([attr("min-choices", "-0")]));

      assert.strictEqual(refusal.rule, "count-range");
      assert.deepStrictEqual(refusal.location, {
        kind: "path",
        path: `${body}/qti-choice-interaction/@max-choices`,
      });
      assert.strictEqual(choiceIn(built.body).minChoices, 0n);
    }),
  );

  it.effect("[Q-2] holds a min-choices of 2^53+1 exactly", () =>
    Effect.gen(function* holdsBeyondSafe() {
      const built = yield* buildItem(choiceItem([attr("min-choices", "9007199254740993")]));

      assert.strictEqual(choiceIn(built.body).minChoices, 9_007_199_254_740_993n);
    }),
  );

  it.effect("[Q-2] holds a max-choices of 2^63-1, the greatest count, by its value", () =>
    Effect.gen(function* holdsGreatestCount() {
      for (const written of ["9223372036854775807", "+09223372036854775807"]) {
        const built = yield* buildItem(choiceItem([attr("max-choices", written)]));

        assert.strictEqual(choiceIn(built.body).maxChoices, 9_223_372_036_854_775_807n, written);
      }
    }),
  );

  it.effect("[Q-2] refuses a max-choices or min-choices of 2^63 as count-range (reading 46)", () =>
    Effect.gen(function* refusesBeyondCount() {
      for (const attribute of ["max-choices", "min-choices"]) {
        const refusal = yield* Effect.flip(
          buildItem(choiceItem([attr(attribute, "9223372036854775808")])),
        );

        assert.strictEqual(refusal.rule, "count-range", attribute);
        assert.deepStrictEqual(refusal.location, {
          kind: "path",
          path: `${body}/qti-choice-interaction/@${attribute}`,
        });
        assert.deepStrictEqual(refusal.detail, {
          attribute,
          greatest: "9223372036854775807",
          least: "-9223372036854775808",
          lexical: "9223372036854775808",
          reading: "46",
        });
      }
    }),
  );

  it.effect("[Q-20] [Q-5] holds expected-length and expected-lines exactly, with no bound", () =>
    Effect.gen(function* holdsUnboundedSizes() {
      const entry = yield* buildItem(
        textEntryItem([attr("expected-length", "9223372036854775808")]),
      );
      const extended = yield* buildItem(
        item({
          body: [
            el("qti-extended-text-interaction", [
              attr("expected-lines", "1000000000000000000000000000000"),
              attr("response-identifier", "RESPONSE"),
            ]),
          ],
          declarations: [declaration("qti-response-declaration", "RESPONSE", "string", "single")],
        }),
      );
      const [node] = childrenOf(entry.body[0]);
      const [lines] = extended.body;

      assert.deepStrictEqual(
        node?.kind === "text-entry" ? node.expectedLength : undefined,
        Option.some(9_223_372_036_854_775_808n),
      );
      assert.deepStrictEqual(
        lines?.kind === "extended-text" ? lines.expectedLines : undefined,
        Option.some(10n ** 30n),
      );
    }),
  );

  it.effect("[Q-2] says the too-few count it read from the source exactly, 2^53+1", () =>
    Effect.gen(function* saysExactCount() {
      const built = yield* buildItem(choiceItem([attr("min-choices", "9007199254740993")]));
      const messages = validateChoice(
        choiceIn(built.body),
        {
          baseType: "identifier",
          cardinality: "single",
          values: [{ baseType: "identifier", value: "A" }],
        },
        yield* configure({ validateResponses: true }),
      );

      assert.deepStrictEqual(messages, [
        { response: "RESPONSE", text: message("en", "atLeast", { n: "9,007,199,254,740,993" }) },
      ]);
    }),
  );

  it.effect("runs a point RESPONSE's match_correct and marks only what it does not render", () =>
    Effect.gen(function* runsPointMatchCorrect() {
      const built = yield* buildItem(
        item({
          after: [
            template("match_correct"),
            el("qti-modal-feedback", [attr("identifier", "fb")], [text("Well done")]),
          ],
          body: [],
          declarations: [
            declaration("qti-response-declaration", "RESPONSE", "point", "single", [
              values("qti-correct-response", "10 10"),
            ]),
            declaration("qti-outcome-declaration", "SCORE", "float", "single"),
          ],
        }),
      );

      assert.isTrue(Option.isSome(built.processing));
      assert.deepStrictEqual(built.unsupported, [
        { feature: "qti-modal-feedback", path: `${root}/qti-modal-feedback`, shown: "mark" },
      ]);
    }),
  );

  it.effect("marks inline rules that read the built-in duration as variable:duration", () =>
    Effect.gen(function* marksBuiltInDuration() {
      const built = yield* buildItem(
        item({
          after: [
            el(
              "qti-response-processing",
              [],
              [
                el(
                  "qti-set-outcome-value",
                  [attr("identifier", "SCORE")],
                  [el("qti-variable", [attr("identifier", "duration")])],
                ),
              ],
            ),
          ],
          body: [],
          declarations: [declaration("qti-outcome-declaration", "SCORE", "float", "single")],
        }),
      );

      assert.deepStrictEqual(built.processing, Option.none());
      assert.deepStrictEqual(built.unsupported, [
        { feature: "variable:duration", path: `${root}/qti-response-processing`, shown: "mark" },
      ]);
    }),
  );

  it.effect("keeps inline rules that read the built-in numAttempts, with no mark", () =>
    Effect.gen(function* keepsNumAttempts() {
      const built = yield* buildItem(
        item({
          after: [
            el(
              "qti-response-processing",
              [],
              [
                el(
                  "qti-set-outcome-value",
                  [attr("identifier", "ATTEMPTS")],
                  [el("qti-variable", [attr("identifier", "numAttempts")])],
                ),
              ],
            ),
          ],
          body: [],
          declarations: [declaration("qti-outcome-declaration", "ATTEMPTS", "integer", "single")],
        }),
      );

      assert.deepStrictEqual(
        built.processing,
        Option.some([
          {
            expression: {
              identifier: "numAttempts",
              kind: "variable",
              operands: [],
              weightIdentifier: Option.none(),
            },
            identifier: "ATTEMPTS",
            kind: "set-outcome",
          },
        ]),
      );
      assert.deepStrictEqual(built.unsupported, []);
    }),
  );

  it.effect("reads a qti-variable's weight-identifier and holds it, with no mark", () =>
    Effect.gen(function* readsWeightIdentifier() {
      const built = yield* buildItem(
        item({
          after: [
            el(
              "qti-response-processing",
              [],
              [
                el(
                  "qti-set-outcome-value",
                  [attr("identifier", "ATTEMPTS")],
                  [
                    el("qti-variable", [
                      attr("identifier", "numAttempts"),
                      attr("weight-identifier", " W "),
                    ]),
                  ],
                ),
              ],
            ),
          ],
          body: [],
          declarations: [declaration("qti-outcome-declaration", "ATTEMPTS", "integer", "single")],
        }),
      );

      assert.deepStrictEqual(
        built.processing,
        Option.some([
          {
            expression: {
              identifier: "numAttempts",
              kind: "variable",
              operands: [],
              weightIdentifier: Option.some("W"),
            },
            identifier: "ATTEMPTS",
            kind: "set-outcome",
          },
        ]),
      );
      assert.deepStrictEqual(built.unsupported, []);
    }),
  );

  it.effect(
    "[I-9a] runs inline rules that read or set the built-in completionStatus, and marks one that sets the built-in duration, which stays unheld",
    () =>
      Effect.gen(function* holdsCompletionStatus() {
        const completed = el(
          "qti-base-value",
          [attr("base-type", "identifier")],
          [text("completed")],
        );
        const reading = yield* buildItem(
          statusItem(
            el(
              "qti-set-outcome-value",
              [attr("identifier", "STATUS")],
              [el("qti-variable", [attr("identifier", "completionStatus")])],
            ),
          ),
        );
        const setting = yield* buildItem(
          statusItem(
            el("qti-set-outcome-value", [attr("identifier", "completionStatus")], [completed]),
          ),
        );
        const timing = yield* buildItem(
          statusItem(el("qti-set-outcome-value", [attr("identifier", "duration")], [completed])),
        );

        assert.deepStrictEqual(
          reading.processing,
          Option.some([
            {
              expression: {
                identifier: "completionStatus",
                kind: "variable",
                operands: [],
                weightIdentifier: Option.none(),
              },
              identifier: "STATUS",
              kind: "set-outcome",
            },
          ]),
        );
        assert.deepStrictEqual(
          setting.processing,
          Option.some([
            {
              expression: {
                kind: "base-value",
                operands: [],
                value: {
                  baseType: "identifier",
                  cardinality: "single",
                  values: [{ baseType: "identifier", value: "completed" }],
                },
              },
              identifier: "completionStatus",
              kind: "set-outcome",
            },
          ]),
        );
        assert.deepStrictEqual([reading.unsupported, setting.unsupported], [[], []]);
        assert.deepStrictEqual(timing.processing, Option.none());
        assert.deepStrictEqual(timing.unsupported, [
          { feature: "variable:duration", path: `${root}/qti-response-processing`, shown: "mark" },
        ]);
      }),
  );

  it.effect(
    "[I-9a] marks inline rules that read or set completionStatus where the item declares a variable by that name the model does not hold",
    () =>
      Effect.gen(function* marksDeclaredCompletionStatus() {
        const rules = [
          el(
            "qti-set-outcome-value",
            [attr("identifier", "STATUS")],
            [el("qti-variable", [attr("identifier", "completionStatus")])],
          ),
          el(
            "qti-set-outcome-value",
            [attr("identifier", "completionStatus")],
            [el("qti-base-value", [attr("base-type", "identifier")], [text("completed")])],
          ),
        ];

        for (const [index, rule] of rules.entries()) {
          const built = yield* buildItem(
            item({
              after: [el("qti-response-processing", [], [rule])],
              body: [],
              declarations: [
                declaration("qti-outcome-declaration", "STATUS", "identifier", "single"),
                el("qti-template-declaration", [
                  attr("base-type", "file"),
                  attr("cardinality", "single"),
                  attr("identifier", "completionStatus"),
                ]),
              ],
            }),
          );

          assert.deepStrictEqual(built.processing, Option.none(), `rule ${String(index)}`);
          assert.deepStrictEqual(
            built.unsupported.map((entry) => entry.feature),
            ['base-type="file"', "variable:completionStatus"],
            `rule ${String(index)}`,
          );
        }
      }),
  );

  it.effect(
    "[I-5] runs inline rules that read a template variable named completionStatus, and marks one that sets it, as only template processing sets a template variable",
    () =>
      Effect.gen(function* readsDeclaredCompletionStatus() {
        const reading = yield* buildItem(
          statusTemplateItem(
            el(
              "qti-set-outcome-value",
              [attr("identifier", "STATUS")],
              [el("qti-variable", [attr("identifier", "completionStatus")])],
            ),
          ),
        );
        const setting = yield* buildItem(
          statusTemplateItem(
            el(
              "qti-set-outcome-value",
              [attr("identifier", "completionStatus")],
              [el("qti-base-value", [attr("base-type", "identifier")], [text("completed")])],
            ),
          ),
        );

        assert.deepStrictEqual(
          reading.processing,
          Option.some<readonly Rule[]>([
            {
              expression: {
                identifier: "completionStatus",
                kind: "variable",
                operands: [],
                weightIdentifier: Option.none(),
              },
              identifier: "STATUS",
              kind: "set-outcome",
            },
          ]),
        );
        assert.deepStrictEqual(reading.unsupported, []);
        assert.deepStrictEqual(setting.processing, Option.none());
        assert.deepStrictEqual(setting.unsupported, [
          {
            feature: "variable:completionStatus",
            path: `${root}/qti-response-processing`,
            shown: "mark",
          },
        ]);
      }),
  );

  it.effect(
    "marks inline rules that read numAttempts where the item declares a variable by that name the model does not hold",
    () =>
      Effect.gen(function* marksDeclaredNumAttempts() {
        const built = yield* buildItem(
          item({
            after: [
              el(
                "qti-response-processing",
                [],
                [
                  el(
                    "qti-set-outcome-value",
                    [attr("identifier", "ATTEMPTS")],
                    [el("qti-variable", [attr("identifier", "numAttempts")])],
                  ),
                ],
              ),
            ],
            body: [],
            declarations: [
              declaration("qti-outcome-declaration", "ATTEMPTS", "integer", "single"),
              el("qti-template-declaration", [
                attr("base-type", "integer"),
                attr("cardinality", "record"),
                attr("identifier", "numAttempts"),
              ]),
            ],
          }),
        );

        assert.deepStrictEqual(built.processing, Option.none());
        assert.deepStrictEqual(built.unsupported, [
          {
            feature: 'cardinality="record"',
            path: `${root}/qti-template-declaration`,
            shown: "mark",
          },
          {
            feature: "variable:numAttempts",
            path: `${root}/qti-response-processing`,
            shown: "mark",
          },
        ]);
      }),
  );

  it.effect(
    "[I-5] runs inline rules that read a template variable, with no mark, the record's template value read",
    () =>
      Effect.gen(function* runsTemplateVariable() {
        const built = yield* buildItem(readsTemplate());
        const after = yield* Effect.fromResult(
          runRules(
            Option.getOrElse(built.processing, () => assert.fail("no processing")),
            built,
            {
              outcomes: { SCORE: float(0) },
              responses: {},
              templates: { T: float(2.5) },
            },
          ),
        );

        assert.deepStrictEqual(
          built.processing,
          Option.some<readonly Rule[]>([
            {
              expression: {
                identifier: "T",
                kind: "variable",
                operands: [],
                weightIdentifier: Option.none(),
              },
              identifier: "SCORE",
              kind: "set-outcome",
            },
          ]),
        );
        assert.deepStrictEqual(built.unsupported, []);
        assert.deepStrictEqual(after.outcomes["SCORE"], float(2.5));
      }),
  );

  it.effect(
    "[I-5] keeps response processing none beside a template processing with a marked element, and marks the template variables its rules read",
    () =>
      Effect.gen(function* stalledTemplateProcessing() {
        const built = yield* buildItem(readsTemplate([stalledTemplating]));

        assert.deepStrictEqual(built.templateProcessing, Option.none());
        assert.deepStrictEqual(built.processing, Option.none());
        assert.deepStrictEqual(built.unsupported, [
          {
            feature: "qti-set-outcome-value",
            path: `${root}/qti-template-processing/qti-set-outcome-value`,
            shown: "mark",
          },
          { feature: "variable:T", path: `${root}/qti-response-processing`, shown: "mark" },
        ]);
      }),
  );

  it.effect("keeps BG007's match_correct tree, every identifier held, with no mark", () =>
    Effect.gen(function* keepsHeldTree() {
      const built = yield* buildItem(bg007(template("match_correct")));

      assert.deepStrictEqual(built.processing, Option.some(matchCorrect));
      assert.deepStrictEqual(built.unsupported, []);
    }),
  );

  it.effect(
    "[I-5] keeps response processing beside a template processing that runs, and marks neither",
    () =>
      Effect.gen(function* templatedRuns() {
        const built = yield* buildItem(floatMatchCorrect([setsCorrectResponse]));
        const plain = yield* buildItem(floatMatchCorrect());

        assert.isTrue(Option.isSome(built.templateProcessing), "the template processing runs");
        assert.deepStrictEqual(built.processing, plain.processing);
        assert.isTrue(Option.isSome(built.processing), "the response processing runs");
        assert.deepStrictEqual(built.unsupported, []);
      }),
  );

  it.effect(
    "[I-5] keeps response processing none beside a template processing with a marked element, whatever the tree",
    () =>
      Effect.gen(function* stalledRunsNone() {
        const built = yield* buildItem(floatMatchCorrect([stalledTemplating]));

        assert.deepStrictEqual(built.templateProcessing, Option.none());
        assert.deepStrictEqual(built.processing, Option.none());
        assert.deepStrictEqual(built.unsupported, [
          {
            feature: "qti-set-outcome-value",
            path: `${root}/qti-template-processing/qti-set-outcome-value`,
            shown: "mark",
          },
        ]);
      }),
  );

  it("[I-5] marks template processing that reads or sets a name the engine does not hold while it runs, at the qti-template-processing, and runs neither processing", () => {
    for (const { declarations, marks, rule, unheld } of unheldTemplating) {
      const verdict = check(templatingItem(declarations, rule), tables, Option.none());
      const accepted = Option.getOrElse(acceptedItem(verdict), () =>
        assert.fail(`${unheld}: the item is ${verdict.verdict}, not accepted.`),
      );

      assert.strictEqual(verdict.verdict, "accepted-with-unsupported", unheld);
      assert.deepStrictEqual(accepted.item.templateProcessing, Option.none(), unheld);
      assert.deepStrictEqual(accepted.item.processing, Option.none(), unheld);
      assert.deepStrictEqual(
        accepted.unsupported,
        [
          ...marks.map((mark): UnsupportedFeature => ({ ...mark, shown: "mark" })),
          {
            feature: `variable:${unheld}`,
            path: `${root}/qti-template-processing`,
            shown: "mark",
          },
        ],
        unheld,
      );
    }
  });

  it("[I-5] places the template processing's mark before the response processing's, in document order", () => {
    const verdict = check(
      templatingItem(
        [scoreDeclaration, templateDeclaration("B", "single", "boolean")],
        templateSetting("qti-set-template-value", "B", isNullOf(variableElement("QTI_CONTEXT"))),
        variableElement("B"),
      ),
      tables,
      Option.none(),
    );
    const accepted = Option.getOrElse(acceptedItem(verdict), () =>
      assert.fail(`the item is ${verdict.verdict}, not accepted.`),
    );

    assert.deepStrictEqual(accepted.unsupported, [
      { feature: "variable:QTI_CONTEXT", path: `${root}/qti-template-processing`, shown: "mark" },
      { feature: "variable:B", path: `${root}/qti-response-processing`, shown: "mark" },
    ]);
  });

  it("[I-5] keeps template processing that reads and sets only template variables the model holds, and response processing, with no mark", () => {
    const verdict = check(
      templatingItem(
        [
          scoreDeclaration,
          templateDeclaration("T", "single", "integer"),
          templateDeclaration("B", "single", "boolean"),
        ],
        el(
          "qti-template-condition",
          [],
          [
            el(
              "qti-template-if",
              [],
              [
                isNullOf(variableElement("T")),
                templateSetting(
                  "qti-set-template-value",
                  "T",
                  el("qti-base-value", [attr("base-type", "integer")], [text("3")]),
                ),
              ],
            ),
            el(
              "qti-template-else",
              [],
              [templateSetting("qti-set-template-value", "B", isNullOf(variableElement("T")))],
            ),
          ],
        ),
        variableElement("B"),
      ),
      tables,
      Option.none(),
    );
    const accepted = Option.getOrElse(acceptedItem(verdict), () =>
      assert.fail(`the item is ${verdict.verdict}, not accepted.`),
    );

    assert.strictEqual(verdict.verdict, "accepted");
    assert.isTrue(Option.isSome(accepted.item.templateProcessing), "the template processing runs");
    assert.isTrue(Option.isSome(accepted.item.processing), "the response processing runs");
    assert.deepStrictEqual(accepted.unsupported, []);
  });

  it.effect(
    "gives equal outcomes for the correct value and another on an item whose template processing does not run",
    () =>
      Effect.gen(function* stalledScoresNone() {
        const built = yield* buildItem(floatMatchCorrect([stalledTemplating]));
        const correct = yield* Effect.fromResult(
          runAttempt(built, fresh(built, "i"), { RESPONSE: float(1.5) }),
        );
        const other = yield* Effect.fromResult(
          runAttempt(built, fresh(built, "i"), { RESPONSE: float(2.5) }),
        );

        assert.deepStrictEqual(correct.outcomes, other.outcomes);
      }),
  );

  it.effect(
    "[I-9b] keeps match_correct for the same item without template processing, and scores 1",
    () =>
      Effect.gen(function* untemplatedRuns() {
        const built = yield* buildItem(floatMatchCorrect());
        const correct = yield* Effect.fromResult(
          runAttempt(built, fresh(built, "i"), { RESPONSE: float(1.5) }),
        );
        const other = yield* Effect.fromResult(
          runAttempt(built, fresh(built, "i"), { RESPONSE: float(2.5) }),
        );

        assert.deepStrictEqual(built.processing, Option.some(matchCorrect));
        assert.deepStrictEqual(built.unsupported, []);
        assert.deepStrictEqual(correct.outcomes["SCORE"], float(1));
        assert.deepStrictEqual(other.outcomes["SCORE"], float(0));
      }),
  );

  it.effect(
    "[I-9b] runs a template URI padded with XML whitespace as the built-in it names, with no mark",
    () =>
      Effect.gen(function* runsPaddedTemplate() {
        const built = yield* buildItem(
          item({
            after: [
              el("qti-response-processing", [
                attr(
                  "template",
                  " \n\thttps://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct\n ",
                ),
              ]),
            ],
            body: [
              el(
                "qti-choice-interaction",
                [attr("max-choices", "1"), attr("response-identifier", "RESPONSE")],
                [choice("A", "Ant"), choice("B", "Bee")],
              ),
            ],
            declarations: [
              declaration("qti-response-declaration", "RESPONSE", "identifier", "single", [
                values("qti-correct-response", "A"),
              ]),
              declaration("qti-outcome-declaration", "SCORE", "float", "single"),
            ],
          }),
        );
        const after = yield* Effect.fromResult(
          runAttempt(built, fresh(built, "i"), {
            RESPONSE: {
              baseType: "identifier",
              cardinality: "single",
              values: [{ baseType: "identifier", value: "A" }],
            },
          }),
        );

        assert.deepStrictEqual(built.processing, Option.some(matchCorrect));
        assert.deepStrictEqual(built.unsupported, []);
        assert.deepStrictEqual(after.outcomes["SCORE"], float(1));
      }),
  );

  it.effect('[I-1] [Q-2] binds response-identifier=" RESPONSE " to the declaration RESPONSE', () =>
    Effect.gen(function* bindsPaddedReference() {
      const built = yield* buildItem(
        item({
          body: [
            el(
              "qti-choice-interaction",
              [attr("response-identifier", " RESPONSE ")],
              [choice("A", "Ant"), choice("B", "Bee")],
            ),
          ],
          declarations: [
            declaration("qti-response-declaration", "RESPONSE", "identifier", "single"),
          ],
        }),
      );

      assert.strictEqual(choiceIn(built.body).response, "RESPONSE");
    }),
  );

  it.effect('[I-1] [Q-2] keys a declaration identifier="\\tRESPONSE\\n" as RESPONSE', () =>
    Effect.gen(function* keysPaddedDeclaration() {
      const built = yield* buildItem(
        item({
          body: [
            el(
              "qti-choice-interaction",
              [attr("response-identifier", "RESPONSE")],
              [choice("A", "Ant"), choice("B", "Bee")],
            ),
          ],
          declarations: [
            declaration("qti-response-declaration", "\tRESPONSE\n", "identifier", "single"),
          ],
        }),
      );

      assert.deepStrictEqual([...built.responses.keys()], ["RESPONSE"]);
      assert.strictEqual(built.responses.get("RESPONSE")?.identifier, "RESPONSE");
      assert.strictEqual(choiceIn(built.body).response, "RESPONSE");
    }),
  );

  it.effect('[Q-2] reads a qti-simple-choice identifier=" A " as A', () =>
    Effect.gen(function* readsPaddedChoice() {
      const built = yield* buildItem(
        item({
          body: [
            el(
              "qti-choice-interaction",
              [attr("response-identifier", "RESPONSE")],
              [choice(" A ", "Ant"), choice("B", "Bee")],
            ),
          ],
          declarations: [
            declaration("qti-response-declaration", "RESPONSE", "identifier", "single"),
          ],
        }),
      );

      assert.deepStrictEqual(
        choiceIn(built.body).choices.map((option) => option.identifier),
        ["A", "B"],
      );
    }),
  );

  it.effect(
    "reads padded identifiers in inline processing as the declarations they name, with no mark",
    () =>
      Effect.gen(function* readsPaddedProcessing() {
        const built = yield* buildItem(
          item({
            after: [
              el(
                "qti-response-processing",
                [],
                [
                  el(
                    "qti-set-outcome-value",
                    [attr("identifier", " SCORE ")],
                    [el("qti-variable", [attr("identifier", " RESPONSE ")])],
                  ),
                ],
              ),
            ],
            body: [],
            declarations: [
              declaration("qti-response-declaration", "RESPONSE", "float", "single"),
              declaration("qti-outcome-declaration", "SCORE", "float", "single"),
            ],
          }),
        );

        assert.deepStrictEqual(
          built.processing,
          Option.some<readonly Rule[]>([
            {
              expression: {
                identifier: "RESPONSE",
                kind: "variable",
                operands: [],
                weightIdentifier: Option.none(),
              },
              identifier: "SCORE",
              kind: "set-outcome",
            },
          ]),
        );
        assert.deepStrictEqual(built.unsupported, []);
      }),
  );

  it.effect('[I-0] reads a root identifier=" item-1 " as item-1', () =>
    Effect.gen(function* readsPaddedRoot() {
      const built = yield* buildItem(
        doc(
          "items/test.xml",
          el(
            root,
            [attr("identifier", " item-1 "), attr("title", "Item")],
            [el("qti-item-body", [], [])],
          ),
        ),
      );

      assert.strictEqual(built.identifier, "item-1");
    }),
  );

  it.effect(
    '[I-1] [Q-2] names the collapsed identifier when response-identifier=" OTHER " binds no declaration',
    () =>
      Effect.gen(function* namesCollapsedReference() {
        const refusal = yield* Effect.flip(
          buildItem(
            item({
              body: [
                el(
                  "qti-choice-interaction",
                  [attr("response-identifier", " OTHER ")],
                  [choice("A", "Ant")],
                ),
              ],
              declarations: [
                declaration("qti-response-declaration", "RESPONSE", "identifier", "single"),
              ],
            }),
          ),
        );

        assert.strictEqual(refusal.rule, "undeclared-response");
        assert.deepStrictEqual(refusal.location, {
          kind: "path",
          path: `${body}/qti-choice-interaction/@response-identifier`,
        });
        assert.deepStrictEqual(refusal.detail, { response: "OTHER" });
      }),
  );

  it.effect('[I-1] [Q-2] refuses response-identifier="OTHER" with no such declaration', () =>
    Effect.gen(function* refusesUnboundReference() {
      const refusal = yield* Effect.flip(
        buildItem(
          item({
            body: [
              el(
                "qti-choice-interaction",
                [attr("response-identifier", "OTHER")],
                [choice("A", "Ant")],
              ),
            ],
            declarations: [
              declaration("qti-response-declaration", "RESPONSE", "identifier", "single"),
            ],
          }),
        ),
      );

      assert.strictEqual(refusal._tag, "Refusal");
      assert.strictEqual(refusal.rule, "undeclared-response");
      assert.deepStrictEqual(refusal.location, {
        kind: "path",
        path: `${body}/qti-choice-interaction/@response-identifier`,
      });
      assert.deepStrictEqual(refusal.detail, { response: "OTHER" });
    }),
  );

  it.live("trims a 50,000-character inner whitespace run in an attribute in linear time", () =>
    Effect.gen(function* linearAttributeTrim() {
      const run = " \t\n\r".repeat(12_500);
      const cases = [
        ["max-choices", `1${run}1`],
        ["shuffle", `true${run}false`],
      ] as const;
      for (const [name, written] of cases) {
        const [elapsed, refusal] = yield* Effect.timed(
          Effect.flip(Effect.suspend(() => buildItem(choiceItem([attr(name, written)])))),
        );
        assert.strictEqual(refusal.rule, "value-type", name);
        assert.deepStrictEqual(refusal.location, {
          kind: "path",
          path: `${body}/qti-choice-interaction/@${name}`,
        });
        assert.isBelow(Duration.toMillis(elapsed), 200, `${name}: ${Duration.format(elapsed)}`);
      }
    }),
  );

  it.effect(
    "[I-0] records 8,000 unsupported declarations, 8 times as many in under 32 times the time",
    () =>
      Effect.gen(function* recordsInConstantTime() {
        const fewer = templated(fewerDeclarations);
        const more = templated(fewerDeclarations * growthFactor);
        const built = yield* buildItem(more);
        assert.strictEqual(built.unsupported.length, fewerDeclarations * growthFactor);

        const growth = yield* growthRatio(
          () => {
            Effect.runSync(buildItem(fewer));
          },
          () => {
            Effect.runSync(buildItem(more));
          },
        );
        assert.isBelow(
          growth,
          growthLimit,
          `8 times the declarations took ${growth.toFixed(1)} times as long`,
        );
      }),
    growthTimeoutMs,
  );

  it.effect(
    "[I-0] binds 8,000 Text Entries to 8,000 declarations, 8 times as many in under 32 times the time",
    () =>
      Effect.gen(function* bindsInConstantTime() {
        const fewer = textEntries(fewerDeclarations);
        const more = textEntries(fewerDeclarations * growthFactor);
        const built = yield* buildItem(more);
        const entries = childrenOf(built.body[0]);
        assert.strictEqual(entries.length, fewerDeclarations * growthFactor);
        assert.isTrue(entries.every((node) => node.kind === "text-entry"));
        assert.deepStrictEqual(built.unsupported, []);

        const growth = yield* growthRatio(
          () => {
            Effect.runSync(buildItem(fewer));
          },
          () => {
            Effect.runSync(buildItem(more));
          },
        );
        assert.isBelow(
          growth,
          growthLimit,
          `8 times the interactions took ${growth.toFixed(1)} times as long`,
        );
      }),
    growthTimeoutMs,
  );

  it.effect(
    "control: a quadratic binding of the same interactions fails the growth check",
    () =>
      Effect.gen(function* quadraticBindingControl() {
        const fewer = textEntries(fewerDeclarations);
        const more = textEntries(fewerDeclarations * growthFactor);
        const bound = bindQuadratically(fewer);
        assert.strictEqual(bound.length, fewerDeclarations);
        assert.isTrue(bound.every((found) => found !== undefined));

        const growth = yield* growthRatio(
          () => {
            bindQuadratically(fewer);
          },
          () => {
            bindQuadratically(more);
          },
        );
        assert.isAtLeast(
          growth,
          growthLimit,
          `8 times the interactions took ${growth.toFixed(1)} times as long`,
        );
      }),
    growthTimeoutMs,
  );

  it.effect(
    "control: a quadratic dedupe of the same features fails the growth check",
    () =>
      Effect.gen(function* quadraticControl() {
        const fewer = (yield* buildItem(templated(fewerDeclarations))).unsupported;
        const more = (yield* buildItem(templated(fewerDeclarations * growthFactor))).unsupported;
        assert.deepStrictEqual(dedupeQuadratically([...fewer, ...fewer]), fewer);

        const growth = yield* growthRatio(
          () => {
            dedupeQuadratically(fewer);
          },
          () => {
            dedupeQuadratically(more);
          },
        );
        assert.isAtLeast(
          growth,
          growthLimit,
          `8 times the features took ${growth.toFixed(1)} times as long`,
        );
      }),
    growthTimeoutMs,
  );
});

/**
 * How many accepted corpus items have a `qti-template-processing` child of their root: the BPIG
 * examples' `adaptiveTemplate`, `template_digging` and `template_image` and the packaging examples'
 * `SineRule-001`, `SineRule-002-maths`, `adaptive_template` and `template_image`, each twice, as a
 * file and inside its zip. `SineRule-001`'s `qti-custom-operator` is marked and gives NULL, since
 * plate runs no extension, so its marks stop neither processing.
 */
const templatedCorpusItems = 14;

/**
 * The time the corpus count may take: it opens every corpus document once, as the sweeps do.
 */
const corpusTimeoutMs = 600_000;

/**
 * A template rule tree's outline: each setting rule as its kind and target, each condition as its
 * branches' outlines and its otherwise's, so a case can pin a tree's structure without pinning how
 * an expression in it is modelled.
 */
type Outline =
  | string
  | {
      readonly branches: readonly (readonly Outline[])[];
      readonly otherwise: Option.Option<readonly Outline[]>;
    };

/**
 * Outline template rules.
 *
 * @param rules The rules.
 * @returns Their outline, in order.
 */
const outline = (rules: readonly TemplateRule[]): readonly Outline[] =>
  rules.map((rule): Outline => {
    if (rule.kind === "template-condition") {
      return {
        branches: rule.branches.map((part) => outline(part.then)),
        otherwise: rule.otherwise.pipe(Option.map(outline)),
      };
    }

    return "identifier" in rule ? `${rule.kind} ${rule.identifier}` : rule.kind;
  });

describe("buildItem over the corpus", { tags: ["corpus"] }, () => {
  it.effect(
    "[I-5] template_digging reads its template processing and runs its response processing, with no template mark",
    () =>
      Effect.gen(function* templateDigging() {
        const location = "QTI3_BPIG_Examples/items/template_digging.xml";
        const source = yield* readSource(location, yield* readCorpusFile(location));
        const built = yield* buildItem(source);
        const features = built.unsupported.map((entry) => entry.feature);

        assert.deepStrictEqual([...built.templates.keys()], ["PEOPLE", "A", "B", "MIN"]);
        assert.isTrue(Option.isSome(built.processing), "the response processing runs");
        assert.notInclude(features, "qti-template-declaration");
        assert.notInclude(features, "qti-template-processing");
        assert.isFalse(
          features.some((feature) => feature.startsWith("variable:")),
          features.join(", "),
        );
        assert.deepStrictEqual(
          built.templateProcessing.pipe(Option.map(outline)),
          Option.some<readonly Outline[]>([
            "set-template-value PEOPLE",
            "set-template-value A",
            {
              branches: [["set-template-value B"], ["set-template-value B"]],
              otherwise: Option.some(["set-template-value B"]),
            },
            "set-template-value MIN",
            "set-correct-response RESPONSE",
          ]),
        );
      }),
  );

  it.effect(
    "[I-5] runs template processing and response processing in each of the 14 accepted corpus items whose root holds a qti-template-processing",
    () =>
      Effect.gen(function* templatedCorpus() {
        const found: { readonly item: Item; readonly location: string }[] = [];
        for (const member of yield* openCorpus) {
          const accepted = acceptedOf(member);
          if (Option.isSome(accepted)) {
            const source = yield* readSource(member.location, member.bytes);
            if (
              source.root.children.some(
                (child) =>
                  child.kind === "element" &&
                  child.namespace === qtiNamespace &&
                  child.local === "qti-template-processing",
              )
            ) {
              found.push({ item: accepted.value.item, location: member.location });
            }
          }
        }

        assert.lengthOf(found, templatedCorpusItems);
        for (const { item: built, location } of found) {
          assert.isTrue(
            Option.isSome(built.templateProcessing),
            `${location}: template processing`,
          );
          assert.isTrue(Option.isSome(built.processing), `${location}: response processing`);
        }
      }),
    corpusTimeoutMs,
  );
});

/**
 * Construct a rule that names a variable by its `identifier` and holds one expression.
 *
 * @param local The rule's local name.
 * @param identifier The variable it names.
 * @param expression The expression.
 * @returns The rule.
 */
const naming = (local: string, identifier: string, expression: SourceElement): SourceElement =>
  el(local, [attr("identifier", identifier)], [expression]);

/**
 * Construct a `qti-base-value`.
 *
 * @param baseType Its `base-type`.
 * @param value Its text.
 * @returns The expression.
 */
const literal = (baseType: string, value: string): SourceElement =>
  el("qti-base-value", [attr("base-type", baseType)], [text(value)]);

describe("align-54 built-ins by kind: the engine holds a built-in a rule names by its kind (reading 111)", () => {
  it.effect(
    "align-54 built-ins by kind E22a: runs template processing that sets a correct response of numAttempts and a default of numAttempts and of completionStatus, and response processing that reads a qti-correct of numAttempts, with no mark",
    () =>
      Effect.gen(function* runsBuiltInTargets() {
        const built = yield* buildItem(
          item({
            after: [
              el(
                "qti-response-processing",
                [],
                [
                  naming(
                    "qti-set-outcome-value",
                    "N",
                    el("qti-correct", [attr("identifier", "numAttempts")]),
                  ),
                ],
              ),
            ],
            body: [],
            declarations: [
              declaration("qti-outcome-declaration", "N", "integer", "single"),
              el(
                "qti-template-processing",
                [],
                [
                  naming("qti-set-correct-response", "numAttempts", literal("integer", "7")),
                  naming("qti-set-default-value", "numAttempts", literal("integer", "5")),
                  naming(
                    "qti-set-default-value",
                    "completionStatus",
                    literal("identifier", "done"),
                  ),
                ],
              ),
            ],
          }),
        );

        assert.deepStrictEqual(built.unsupported, []);
        assert.isTrue(Option.isSome(built.templateProcessing), "the template processing runs");
        assert.isTrue(Option.isSome(built.processing), "the response processing runs");
      }),
  );

  it.effect(
    "align-54 built-ins by kind E22a: still marks a set of duration, which the engine holds no value of, and a correct response of completionStatus, a built-in outcome",
    () =>
      Effect.gen(function* marksUnheldBuiltInTargets() {
        const built = yield* buildItem(
          item({
            body: [],
            declarations: [
              el(
                "qti-template-processing",
                [],
                [
                  naming("qti-set-default-value", "duration", literal("float", "1")),
                  naming(
                    "qti-set-correct-response",
                    "completionStatus",
                    literal("identifier", "done"),
                  ),
                ],
              ),
            ],
          }),
        );

        assert.deepStrictEqual(
          built.unsupported.map(({ feature }) => feature),
          ["variable:duration", "variable:completionStatus"],
        );
      }),
  );
});

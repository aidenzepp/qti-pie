import { assert, describe, it } from "@effect/vitest";
import { Option } from "effect";
import { attr, doc, el, entity, text, xincludeNamespace } from "#plate/document/source.ts";
import type { SourceChild, SourceDocument, SourceElement } from "#plate/document/source.ts";
import { tables } from "#plate/validate/tables.ts";
import { checkTestRules } from "#plate/validate/test-rules.ts";

/**
 * The location every hand-built test or section document in these tests carries.
 */
const location = "tests/test-rules.xml";

/**
 * Construct a hand-built test from its root's children.
 *
 * @param children The children of its `qti-assessment-test`, in document order.
 * @returns The test as a source document.
 */
const assessmentTest = (children: readonly SourceElement[]): SourceDocument =>
  doc(
    location,
    el("qti-assessment-test", [attr("identifier", "T"), attr("title", "Test")], children),
  );

/**
 * Construct a section element, the root of a section document or a section inside a test.
 *
 * @param identifier Its `identifier`, also its `title`.
 * @param children Its children, in document order.
 * @returns The `qti-assessment-section`.
 */
const section = (identifier: string, children: readonly SourceChild[]): SourceElement =>
  el(
    "qti-assessment-section",
    [attr("identifier", identifier), attr("title", identifier), attr("visible", "true")],
    children,
  );

/**
 * Construct a hand-built section document.
 *
 * @param identifier The root section's `identifier`.
 * @param children The root's children, in document order.
 * @returns The section document.
 */
const sectionDocument = (identifier: string, children: readonly SourceElement[]): SourceDocument =>
  doc(location, section(identifier, children));

/**
 * Construct a linear, individual test part.
 *
 * @param identifier Its `identifier`.
 * @param children Its children, in document order.
 * @returns The `qti-test-part`.
 */
const part = (identifier: string, children: readonly SourceElement[]): SourceElement =>
  el(
    "qti-test-part",
    [
      attr("identifier", identifier),
      attr("navigation-mode", "linear"),
      attr("submission-mode", "individual"),
    ],
    children,
  );

/**
 * Construct an item ref whose `href` is `items/<identifier>.xml` unless another is given.
 *
 * @param identifier Its `identifier`, as written.
 * @param children Its children, such as a `qti-pre-condition`.
 * @param href Its `href`.
 * @returns The `qti-assessment-item-ref`.
 */
const itemRef = (
  identifier: string,
  children: readonly SourceElement[] = [],
  href = `items/${identifier.trim()}.xml`,
): SourceElement =>
  el("qti-assessment-item-ref", [attr("href", href), attr("identifier", identifier)], children);

/**
 * Construct a section ref whose `href` is `sections/<identifier>.xml` unless another is given.
 *
 * @param identifier Its `identifier`.
 * @param href Its `href`.
 * @returns The `qti-assessment-section-ref`.
 */
const sectionRef = (identifier: string, href = `sections/${identifier}.xml`): SourceElement =>
  el("qti-assessment-section-ref", [attr("href", href), attr("identifier", identifier)]);

/**
 * Construct a test of one part `P` holding one section `S`, the shape most cases need.
 *
 * @param sectionChildren The section's children.
 * @param partChildren The part's children before the section, such as a `qti-pre-condition`.
 * @param testChildren The test's children after the part, such as a `qti-outcome-processing`.
 * @returns The test.
 */
const oneSection = (
  sectionChildren: readonly SourceChild[],
  partChildren: readonly SourceElement[] = [],
  testChildren: readonly SourceElement[] = [],
): SourceDocument =>
  assessmentTest([part("P", [...partChildren, section("S", sectionChildren)]), ...testChildren]);

/**
 * The path of `oneSection`'s part.
 */
const partPath = "qti-assessment-test/qti-test-part";

/**
 * The path of `oneSection`'s section.
 */
const sectionPath = `${partPath}/qti-assessment-section`;

/**
 * Construct an integer `qti-base-value`.
 *
 * @param value The value, as written.
 * @returns The base value.
 */
const integer = (value: string): SourceElement =>
  el("qti-base-value", [attr("base-type", "integer")], [text(value)]);

/**
 * Construct a `qti-gte` comparing an expression with the integer 1.
 *
 * @param expression The left operand.
 * @returns The comparison.
 */
const atLeastOne = (expression: SourceElement): SourceElement =>
  el("qti-gte", [], [expression, integer("1")]);

/**
 * Construct a `qti-variable`, weighted when a weight is given.
 *
 * @param identifier Its `identifier`, such as a prefixed `I1.SCORE`.
 * @param weight Its `weight-identifier`, none when absent.
 * @returns The variable.
 */
const variable = (identifier: string, weight?: string): SourceElement =>
  el("qti-variable", [
    attr("identifier", identifier),
    ...(weight === undefined ? [] : [attr("weight-identifier", weight)]),
  ]);

/**
 * Construct a `qti-pre-condition` holding one expression.
 *
 * @param expression The condition.
 * @returns The pre-condition.
 */
const preCondition = (expression: SourceElement): SourceElement =>
  el("qti-pre-condition", [], [expression]);

/**
 * Construct a `qti-branch-rule` to a target, holding one expression.
 *
 * @param target Its `target`.
 * @param expression The condition.
 * @returns The branch rule.
 */
const branchRule = (target: string, expression: SourceElement): SourceElement =>
  el("qti-branch-rule", [attr("target", target)], [expression]);

/**
 * Construct a test's `qti-outcome-processing` that sets `SCORE` to an expression.
 *
 * @param expression The expression.
 * @returns The outcome processing.
 */
const outcomeProcessing = (expression: SourceElement): SourceElement =>
  el(
    "qti-outcome-processing",
    [],
    [el("qti-set-outcome-value", [attr("identifier", "SCORE")], [expression])],
  );

/**
 * The test's float `SCORE`, which `outcomeProcessing` sets.
 */
const score = el("qti-outcome-declaration", [
  attr("base-type", "float"),
  attr("cardinality", "single"),
  attr("identifier", "SCORE"),
]);

/**
 * The eight outcome-only expressions of reading 23, each with the attributes the XSD requires of
 * it.
 */
const outcomeOnly: readonly SourceElement[] = [
  el("qti-number-correct"),
  el("qti-number-incorrect"),
  el("qti-number-presented"),
  el("qti-number-responded"),
  el("qti-number-selected"),
  el("qti-outcome-maximum", [attr("outcome-identifier", "SCORE")]),
  el("qti-outcome-minimum", [attr("outcome-identifier", "SCORE")]),
  el("qti-test-variables", [attr("variable-identifier", "SCORE")]),
];

/**
 * Construct a candidate rubric block whose content body holds the given content.
 *
 * @param content The content body's children.
 * @returns The `qti-rubric-block`.
 */
const rubricBlock = (...content: readonly SourceElement[]): SourceElement =>
  el("qti-rubric-block", [attr("view", "candidate")], [el("qti-content-body", [], content)]);

/**
 * Construct a test feedback shown at the end, whose content body holds the given content.
 *
 * @param content The content body's children.
 * @returns The `qti-test-feedback`.
 */
const testFeedback = (...content: readonly SourceElement[]): SourceElement =>
  el(
    "qti-test-feedback",
    [
      attr("access", "atEnd"),
      attr("identifier", "DONE"),
      attr("outcome-identifier", "FEEDBACK"),
      attr("show-hide", "show"),
    ],
    [el("qti-content-body", [], content)],
  );

/**
 * A Choice bound to `RESPONSE` with one choice.
 */
const choice = el(
  "qti-choice-interaction",
  [attr("response-identifier", "RESPONSE")],
  [el("qti-simple-choice", [attr("identifier", "A")], [text("A")])],
);

/**
 * Construct a template element shown when `TEMPLATE` is `T1`.
 *
 * @param local `qti-template-inline` or `qti-template-block`.
 * @param content Its children.
 * @returns The template element.
 */
const template = (local: string, content: readonly SourceElement[] = []): SourceElement =>
  el(
    local,
    [attr("identifier", "T1"), attr("show-hide", "show"), attr("template-identifier", "TEMPLATE")],
    content,
  );

/**
 * Construct a feedback element shown when `FEEDBACK` is `GOOD`.
 *
 * @param local `qti-feedback-inline` or `qti-feedback-block`.
 * @param content Its children.
 * @returns The feedback element.
 */
const feedback = (local: string, content: readonly SourceChild[]): SourceElement =>
  el(
    local,
    [attr("identifier", "GOOD"), attr("outcome-identifier", "FEEDBACK"), attr("show-hide", "show")],
    content,
  );

/**
 * A paragraph of plain text.
 */
const paragraph = el("p", [], [text("Read each question.")]);

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
 * Construct a declaration of a test.
 *
 * @param local `qti-outcome-declaration` or `qti-context-declaration`.
 * @param identifier Its `identifier`.
 * @param cardinality Its `cardinality`.
 * @param baseType Its `base-type`.
 * @returns The declaration.
 */
const declaration = (
  local: string,
  identifier: string,
  cardinality: string,
  baseType: string,
): SourceElement =>
  el(local, [
    attr("base-type", baseType),
    attr("cardinality", cardinality),
    attr("identifier", identifier),
  ]);

/**
 * Construct a `qti-base-value` of a base type.
 *
 * @param baseType Its `base-type`.
 * @param value The value, as written.
 * @returns The base value.
 */
const baseValue = (baseType: string, value: string): SourceElement =>
  el("qti-base-value", [attr("base-type", baseType)], [text(value)]);

/**
 * Construct a `qti-sum` of its operands.
 *
 * @param operands The operands, in document order.
 * @returns The sum.
 */
const sum = (...operands: readonly SourceElement[]): SourceElement => el("qti-sum", [], operands);

/**
 * Construct an item ref's `qti-template-default` holding one expression.
 *
 * @param identifier Its `template-identifier`.
 * @param expression The expression.
 * @returns The template default.
 */
const templateDefault = (identifier: string, expression: SourceElement): SourceElement =>
  el("qti-template-default", [attr("template-identifier", identifier)], [expression]);

/**
 * Construct a test with the float `SCORE` and one item ref, `ITEM1`, whose outcome processing sets
 * `SCORE` to an expression.
 *
 * @param expression The expression.
 * @returns The test.
 */
const scoring = (expression: SourceElement): SourceDocument =>
  assessmentTest([
    score,
    part("P", [section("S", [itemRef("ITEM1")])]),
    outcomeProcessing(expression),
  ]);

/**
 * Construct a test with the float `SCORE` whose four processing contexts each hold an expression:
 * its part's pre-condition and its item ref's branch rule each as a `qti-gte` against 1, its item
 * ref's template default, and its outcome processing, which sets `SCORE` to it.
 *
 * @param expression Construct the expression, once per context, so each context holds its own
 *   element.
 * @returns The test.
 */
const inEveryContext = (expression: () => SourceElement): SourceDocument =>
  assessmentTest([
    score,
    part("P", [
      preCondition(atLeastOne(expression())),
      section("S", [
        itemRef("I1", [
          branchRule("EXIT_TEST", atLeastOne(expression())),
          templateDefault("T", expression()),
        ]),
      ]),
    ]),
    outcomeProcessing(expression()),
  ]);

/**
 * The paths of the elements that hold {@link inEveryContext}'s expressions, in document order.
 */
const contextPaths = [
  `${partPath}/qti-pre-condition/qti-gte`,
  `${sectionPath}/qti-assessment-item-ref/qti-branch-rule/qti-gte`,
  `${sectionPath}/qti-assessment-item-ref/qti-template-default`,
  "qti-assessment-test/qti-outcome-processing/qti-set-outcome-value",
] as const;

/**
 * Construct a test's `qti-outcome-processing` that holds one `qti-outcome-condition`.
 *
 * @param branches The condition's branches, in document order.
 * @returns The outcome processing.
 */
const outcomeCondition = (...branches: readonly SourceElement[]): SourceElement =>
  el("qti-outcome-processing", [], [el("qti-outcome-condition", [], branches)]);

/**
 * Construct a branch of an outcome condition that sets `SCORE` to 1 when its condition holds.
 *
 * @param local `qti-outcome-if` or `qti-outcome-else-if`.
 * @param condition The condition.
 * @returns The branch.
 */
const scoringBranch = (local: string, condition: SourceElement): SourceElement =>
  el(
    local,
    [],
    [
      condition,
      el("qti-set-outcome-value", [attr("identifier", "SCORE")], [baseValue("float", "1")]),
    ],
  );

/**
 * Construct a test with the float `SCORE` whose outcome processing sets it to 1 when an expression
 * is NULL. `qti-is-null` takes an operand of any type, so the expression meets no type rule but
 * its own, as a weighted `qti-test-variables`, a multiple, meets P29 alone.
 *
 * @param expression The expression.
 * @returns The test.
 */
const whenNull = (expression: SourceElement): SourceDocument =>
  assessmentTest([
    score,
    part("P", [section("S", [itemRef("ITEM1")])]),
    outcomeCondition(scoringBranch("qti-outcome-if", el("qti-is-null", [], [expression]))),
  ]);

/**
 * Construct a `qti-test-variables` of `SCORE` weighted by `W`.
 *
 * @param baseType Its `base-type`, none when absent.
 * @returns The expression.
 */
const weighted = (baseType?: string): SourceElement =>
  el("qti-test-variables", [
    ...(baseType === undefined ? [] : [attr("base-type", baseType)]),
    attr("variable-identifier", "SCORE"),
    attr("weight-identifier", "W"),
  ]);

/**
 * Reduce refusals to what a test asserts: the rule, the path and the detail.
 *
 * @param source The document to check.
 * @returns One entry per refusal, in the order `checkTestRules` gives them.
 */
const judged = (source: SourceDocument) =>
  checkTestRules(source, tables).map((refusal) => {
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
 * The child-count detail of an empty section (reading 26).
 */
const sectionChildren = {
  child: "qti-assessment-item-ref or qti-assessment-section or qti-assessment-section-ref",
  element: "qti-assessment-section",
  required: "at least one",
  source: "reading 26",
};

describe("checkTestRules", () => {
  describe("duplicate-identifier", () => {
    it("refuses the second of two item refs named I1 in different sections", () => {
      assert.deepStrictEqual(
        judged(
          assessmentTest([
            part("P", [section("S1", [itemRef("I1")]), section("S2", [itemRef(" I1\n")])]),
          ]),
        ),
        [
          {
            detail: { identifier: "I1" },
            path: `${partPath}/qti-assessment-section[2]/qti-assessment-item-ref/@identifier`,
            rule: "duplicate-identifier",
          },
        ],
      );
    });

    it("refuses a section repeating a part's identifier and a section repeating an item ref's", () => {
      assert.deepStrictEqual(
        judged(
          assessmentTest([
            part("P1", [section("P1", [itemRef("S2")])]),
            part("P2", [section("S2", [itemRef("I2")])]),
          ]),
        ),
        [
          {
            detail: { identifier: "P1" },
            path: "qti-assessment-test/qti-test-part[1]/qti-assessment-section/@identifier",
            rule: "duplicate-identifier",
          },
          {
            detail: { identifier: "S2" },
            path: "qti-assessment-test/qti-test-part[2]/qti-assessment-section/@identifier",
            rule: "duplicate-identifier",
          },
        ],
      );
    });

    it("refuses a section inside a section document repeating the root's identifier", () => {
      assert.deepStrictEqual(
        judged(sectionDocument("S", [itemRef("I1"), section("S", [itemRef("I2")])])),
        [
          {
            detail: { identifier: "S" },
            path: "qti-assessment-section/qti-assessment-section/@identifier",
            rule: "duplicate-identifier",
          },
        ],
      );
    });

    it("refuses a section ref repeating an item ref's identifier", () => {
      assert.deepStrictEqual(judged(oneSection([itemRef("I1"), sectionRef("I1")])), [
        {
          detail: { identifier: "I1" },
          path: `${sectionPath}/qti-assessment-section-ref/@identifier`,
          rule: "duplicate-identifier",
        },
      ]);
    });

    it("accepts two section refs pointing at one section under distinct identifiers", () => {
      assert.deepStrictEqual(
        judged(oneSection([sectionRef("R1"), sectionRef("R2", "sections/R1.xml"), itemRef("I1")])),
        [],
      );
    });

    it("accepts distinct identifiers, and two item refs pointing at one item", () => {
      assert.deepStrictEqual(
        judged(
          assessmentTest([
            part("P1", [section("S1", [itemRef("I1"), itemRef("I2", [], "items/I1.xml")])]),
            part("P2", [section("S2", [section("S3", [itemRef("I3")]), sectionRef("R1")])]),
          ]),
        ),
        [],
      );
    });
  });

  describe("child-count (reading 26)", () => {
    it("refuses a section holding no item ref, section or section ref", () => {
      assert.deepStrictEqual(judged(oneSection([rubricBlock(paragraph)])), [
        { detail: sectionChildren, path: sectionPath, rule: "child-count" },
      ]);
    });

    it("refuses a section document whose root section is empty", () => {
      assert.deepStrictEqual(judged(sectionDocument("S", [])), [
        { detail: sectionChildren, path: "qti-assessment-section", rule: "child-count" },
      ]);
    });

    it("accepts a section holding only an item ref, only a section, or only a section ref", () => {
      assert.deepStrictEqual(judged(oneSection([itemRef("I1")])), []);
      assert.deepStrictEqual(judged(oneSection([section("S2", [itemRef("I1")])])), []);
      assert.deepStrictEqual(judged(oneSection([sectionRef("R1")])), []);
    });

    it("does not count a section whose children an XInclude include may supply", () => {
      assert.deepStrictEqual(
        judged(oneSection([el("include", [attr("href", "more.xml")], [], xincludeNamespace)])),
        [],
      );
    });
  });

  describe("misplaced-element (readings 24 and 25)", () => {
    it("refuses an interaction in a section's rubric block", () => {
      assert.deepStrictEqual(judged(oneSection([rubricBlock(choice), itemRef("I1")])), [
        {
          detail: {
            element: "qti-choice-interaction",
            reading: "25",
            requires: "outside a test's qti-rubric-block",
          },
          path: `${sectionPath}/qti-rubric-block/qti-content-body/qti-choice-interaction`,
          rule: "misplaced-element",
        },
      ]);
    });

    it("refuses template elements and a nested interaction in test feedback", () => {
      assert.deepStrictEqual(
        judged(
          oneSection(
            [itemRef("I1")],
            [],
            [
              testFeedback(
                el("p", [], [template("qti-template-inline", [])]),
                template("qti-template-block", [
                  el("qti-content-body", [], [el("div", [], [choice])]),
                ]),
              ),
            ],
          ),
        ),
        [
          {
            detail: {
              element: "qti-template-inline",
              reading: "25",
              requires: "outside a test's qti-test-feedback",
            },
            path: "qti-assessment-test/qti-test-feedback/qti-content-body/p/qti-template-inline",
            rule: "misplaced-element",
          },
          {
            detail: {
              element: "qti-template-block",
              reading: "25",
              requires: "outside a test's qti-test-feedback",
            },
            path: "qti-assessment-test/qti-test-feedback/qti-content-body/qti-template-block",
            rule: "misplaced-element",
          },
          {
            detail: {
              element: "qti-choice-interaction",
              reading: "25",
              requires: "outside a test's qti-test-feedback",
            },
            path: "qti-assessment-test/qti-test-feedback/qti-content-body/qti-template-block/qti-content-body/div/qti-choice-interaction",
            rule: "misplaced-element",
          },
        ],
      );
    });

    it("accepts printed variables in a rubric block, and inline and block feedback in test feedback", () => {
      assert.deepStrictEqual(
        judged(
          assessmentTest([
            score,
            part("P", [
              testFeedback(
                feedback("qti-feedback-block", [
                  el(
                    "qti-content-body",
                    [],
                    [el("p", [], [feedback("qti-feedback-inline", [text("Good")])])],
                  ),
                ]),
              ),
              section("S", [rubricBlock(el("p", [], [printed("SCORE")])), itemRef("I1")]),
            ]),
          ]),
        ),
        [],
      );
    });
  });

  describe("a printed variable's references (pantry printed-variable-ref, R37 and R39)", () => {
    const rubricPath = "qti-assessment-test/qti-rubric-block/qti-content-body/p";

    /**
     * The declarations every case below may name: a float `SCORE`, an integer `COUNT` and a
     * multiple integer `M` outcome, and the string context variable `CONTEXT`. A test declares no
     * template or response variable.
     */
    const declared = [
      declaration("qti-context-declaration", "CONTEXT", "single", "string"),
      score,
      declaration("qti-outcome-declaration", "COUNT", "single", "integer"),
      declaration("qti-outcome-declaration", "M", "multiple", "integer"),
    ];

    /**
     * Check a test with {@link declared}'s declarations whose own rubric block holds one paragraph
     * of the given printed variables.
     *
     * @param variables The printed variables, in document order.
     * @returns The refusals, reduced.
     */
    const printing = (...variables: readonly SourceElement[]) =>
      judged(
        assessmentTest([
          ...declared,
          rubricBlock(el("p", [], variables)),
          part("P", [section("S", [itemRef("I1")])]),
        ]),
      );

    it("[I-5] refuses a test's printed variable whose identifier, base or index names nothing the test declares or builds in, the item built-ins completionStatus and numAttempts among them, at that attribute, expecting an outcome (pantry printed-variable-ref, binding-declared)", () => {
      assert.deepStrictEqual(
        printing(
          printed("NOPE"),
          printed("SCORE", { base: "RADIX" }),
          printed("M", { index: "NOPE" }),
          printed("completionStatus"),
          printed("SCORE", { base: "numAttempts" }),
        ),
        (
          [
            ["1", "identifier", "NOPE"],
            ["2", "base", "RADIX"],
            ["3", "index", "NOPE"],
            ["4", "identifier", "completionStatus"],
            ["5", "base", "numAttempts"],
          ] as const
        ).map(([position, attribute, identifier]) => ({
          detail: {
            attribute,
            declarer: "test",
            element: "qti-printed-variable",
            expected: "outcome",
            identifier,
          },
          path: `${rubricPath}/qti-printed-variable[${position}]/@${attribute}`,
          rule: "undeclared-variable",
        })),
      );
    });

    it("[I-5] refuses a test's printed variable whose identifier names a context variable, or the test's built-ins QTI_CONTEXT and duration, with its kind (pantry printed-variable-ref, PrintedVariableRefKind; info.txt:9226)", () => {
      assert.deepStrictEqual(
        printing(printed("CONTEXT"), printed("QTI_CONTEXT"), printed("duration")),
        (
          [
            ["1", "CONTEXT", "context"],
            ["2", "QTI_CONTEXT", "context"],
            ["3", "duration", "response"],
          ] as const
        ).map(([position, identifier, variableKind]) => ({
          detail: {
            attribute: "identifier",
            check: "reference",
            declarer: "test",
            element: "qti-printed-variable",
            identifier,
            source: "info.txt:70296",
            variableKind,
          },
          path: `${rubricPath}/qti-printed-variable[${position}]/@identifier`,
          rule: "expression-type",
        })),
      );
    });

    it("[I-5] refuses a test's printed variable whose base names a float outcome or index a multiple integer one, where a single integer outcome is needed (pantry printed-variable-ref, PrintedVariableVarRefType)", () => {
      assert.deepStrictEqual(
        printing(printed("COUNT", { base: "SCORE" }), printed("M", { index: "M" })),
        (
          [
            ["1", "base", "SCORE"],
            ["2", "index", "M"],
          ] as const
        ).map(([position, attribute, identifier]) => ({
          detail: {
            attribute,
            check: "reference",
            declarer: "test",
            element: "qti-printed-variable",
            expectedBaseType: "integer",
            identifier,
          },
          path: `${rubricPath}/qti-printed-variable[${position}]/@${attribute}`,
          rule: "expression-type",
        })),
      );
    });

    it("[I-5] accepts a test's printed variable of a declared outcome of any type, a base or index naming a single integer outcome, and a base or index written as an integer", () => {
      assert.deepStrictEqual(
        printing(
          printed("SCORE", { format: "%.1f" }),
          printed(" M "),
          printed("COUNT", { base: "COUNT", format: "%i" }),
          printed("M", { index: "COUNT" }),
          printed("COUNT", { base: " 16 ", format: "%i" }),
          printed("M", { index: "-1" }),
        ),
        [],
      );
    });

    it("[I-5] judges a printed variable anywhere in a test, in a section's rubric block and in a part's test feedback alike", () => {
      assert.deepStrictEqual(
        judged(
          assessmentTest([
            score,
            part("P", [
              testFeedback(el("p", [], [printed("FEEDBACK_NOPE")])),
              section("S", [rubricBlock(el("p", [], [printed("SECTION_NOPE")])), itemRef("I1")]),
            ]),
          ]),
        ).map(({ detail, path, rule }) => [rule, path, detail["identifier"]]),
        [
          [
            "undeclared-variable",
            `${partPath}/qti-test-feedback/qti-content-body/p/qti-printed-variable/@identifier`,
            "FEEDBACK_NOPE",
          ],
          [
            "undeclared-variable",
            `${sectionPath}/qti-rubric-block/qti-content-body/p/qti-printed-variable/@identifier`,
            "SECTION_NOPE",
          ],
        ],
      );
    });

    it("[I-5] does not judge a printed variable in a section document, which declares no variable (pantry bindsVariables)", () => {
      assert.deepStrictEqual(
        judged(
          sectionDocument("S", [
            rubricBlock(el("p", [], [printed("NOPE", { base: "RADIX", index: "POSITION" })])),
            itemRef("I1"),
          ]),
        ),
        [],
      );
    });
  });

  describe("expression-placement (reading 23)", () => {
    it("refuses each outcome-only expression in a part's pre-condition", () => {
      for (const expression of outcomeOnly) {
        assert.deepStrictEqual(
          judged(oneSection([itemRef("I1")], [preCondition(el("qti-is-null", [], [expression]))])),
          [
            {
              detail: { context: "qti-pre-condition", element: expression.local, reading: "23" },
              path: `${partPath}/qti-pre-condition/qti-is-null/${expression.local}`,
              rule: "expression-placement",
            },
          ],
          expression.local,
        );
      }
    });

    it("refuses an outcome-only expression in an item ref's branch rule and template default", () => {
      assert.deepStrictEqual(
        judged(
          oneSection([
            itemRef("I1", [
              branchRule("EXIT_TEST", atLeastOne(el("qti-number-correct"))),
              el(
                "qti-template-default",
                [attr("template-identifier", "T")],
                [el("qti-number-presented")],
              ),
            ]),
          ]),
        ),
        [
          {
            detail: { context: "qti-branch-rule", element: "qti-number-correct", reading: "23" },
            path: `${sectionPath}/qti-assessment-item-ref/qti-branch-rule/qti-gte/qti-number-correct`,
            rule: "expression-placement",
          },
          {
            detail: {
              context: "qti-template-default",
              element: "qti-number-presented",
              reading: "23",
            },
            path: `${sectionPath}/qti-assessment-item-ref/qti-template-default/qti-number-presented`,
            rule: "expression-placement",
          },
        ],
      );
    });

    it("refuses weight-identifier on a qti-variable in a section's pre-condition", () => {
      assert.deepStrictEqual(
        judged(oneSection([preCondition(atLeastOne(variable("I1.SCORE", "W"))), itemRef("I1")])),
        [
          {
            detail: {
              attribute: "weight-identifier",
              context: "qti-pre-condition",
              element: "qti-variable",
              reading: "23",
            },
            path: `${sectionPath}/qti-pre-condition/qti-gte/qti-variable/@weight-identifier`,
            rule: "expression-placement",
          },
        ],
      );
    });

    it("accepts the outcome-only expressions and a weighted variable in outcome processing", () => {
      assert.deepStrictEqual(
        judged(
          assessmentTest([
            score,
            part("P", [
              preCondition(atLeastOne(variable("I1.SCORE"))),
              section("S", [itemRef("I1")]),
            ]),
            outcomeProcessing(el("qti-sum", [], [...outcomeOnly, variable("I1.SCORE", "W")])),
          ]),
        ),
        [],
      );
    });
  });

  describe("dotted references (readings 4, 5, 37 and 48)", () => {
    it("accepts prefixed references in pre-conditions, branch rules and outcome processing", () => {
      assert.deepStrictEqual(
        judged(
          assessmentTest([
            score,
            part("P", [
              preCondition(atLeastOne(variable("P.duration"))),
              section("S", [
                itemRef("I1"),
                itemRef("I2", [preCondition(atLeastOne(variable("I1.SCORE")))]),
                itemRef("I3", [branchRule("EXIT_TEST", atLeastOne(variable("I1.1.SCORE")))]),
              ]),
            ]),
            outcomeProcessing(el("qti-sum", [], [variable("I1.SCORE"), variable("S.duration")])),
          ]),
        ),
        [],
      );
    });

    it("accepts a.b.SCORE in a test whose item refs are a and a.b, which only a package can judge", () => {
      assert.deepStrictEqual(
        judged(
          assessmentTest([
            score,
            part("P", [
              section("S", [
                itemRef("a"),
                itemRef("a.b", [preCondition(atLeastOne(variable("a.b.SCORE")))]),
              ]),
            ]),
            outcomeProcessing(variable("a.b.SCORE")),
          ]),
        ),
        [],
      );
    });

    it("accepts a prefixed reference in a section document, which resolves per test (reading 5)", () => {
      assert.deepStrictEqual(
        judged(
          sectionDocument("S", [
            branchRule("EXIT_SECTION", atLeastOne(variable("I9.SCORE"))),
            itemRef("I1"),
          ]),
        ),
        [],
      );
    });
  });

  describe("time limits (T-O8)", () => {
    it("accepts min-time above max-time", () => {
      assert.deepStrictEqual(
        judged(
          oneSection(
            [itemRef("I1")],
            [el("qti-time-limits", [attr("max-time", "30"), attr("min-time", "60")])],
          ),
        ),
        [],
      );
    });
  });

  describe("the processing rules on a test's expressions (D4-10, P29)", () => {
    it("[T-9] refuses outcome processing that sets the float SCORE from a string (pantry P20)", () => {
      assert.deepStrictEqual(judged(scoring(baseValue("string", "x"))), [
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
      ]);
    });

    it("[T-9] refuses a qti-outcome-if over a single integer and a qti-outcome-else-if over a string, with check condition (pantry P21)", () => {
      assert.deepStrictEqual(
        judged(
          assessmentTest([
            score,
            part("P", [section("S", [itemRef("I1")])]),
            outcomeCondition(
              scoringBranch("qti-outcome-if", integer("1")),
              scoringBranch("qti-outcome-else-if", baseValue("string", "x")),
            ),
          ]),
        ),
        (
          [
            ["qti-outcome-if", "integer"],
            ["qti-outcome-else-if", "string"],
          ] as const
        ).map(([element, expressionBaseType]) => ({
          detail: {
            check: "condition",
            element,
            expressionBaseType,
            expressionCardinality: "single",
          },
          path: `qti-assessment-test/qti-outcome-processing/qti-outcome-condition/${element}`,
          rule: "expression-type",
        })),
      );
    });

    it("[T-9] refuses a qti-lookup-outcome-value whose operand is a string under a match table (pantry P22, reading 28)", () => {
      assert.deepStrictEqual(
        judged(
          assessmentTest([
            el(
              "qti-outcome-declaration",
              [
                attr("base-type", "identifier"),
                attr("cardinality", "single"),
                attr("identifier", "GRADE"),
              ],
              [
                el(
                  "qti-match-table",
                  [],
                  [
                    el("qti-match-table-entry", [
                      attr("source-value", "1"),
                      attr("target-value", "A"),
                    ]),
                  ],
                ),
              ],
            ),
            part("P", [section("S", [itemRef("I1")])]),
            el(
              "qti-outcome-processing",
              [],
              [
                el(
                  "qti-lookup-outcome-value",
                  [attr("identifier", "GRADE")],
                  [baseValue("string", "x")],
                ),
              ],
            ),
          ]),
        ),
        [
          {
            detail: {
              element: "qti-lookup-outcome-value",
              expressionBaseType: "string",
              expressionCardinality: "single",
              identifier: "GRADE",
              reading: "28",
              table: "qti-match-table",
            },
            path: "qti-assessment-test/qti-outcome-processing/qti-lookup-outcome-value",
            rule: "expression-type",
          },
        ],
      );
    });

    it("[T-9] refuses a qti-sum over a string in outcome processing, a pre-condition, a branch rule and a template default (pantry P23)", () => {
      assert.deepStrictEqual(
        judged(inEveryContext(() => sum(baseValue("string", "x")))),
        contextPaths.map((path) => ({
          detail: {
            acceptsBaseTypes: "integer float",
            acceptsCardinalities: "multiple ordered single",
            check: "operand",
            element: "qti-sum",
            expressionBaseType: "string",
            expressionCardinality: "single",
            operand: "1",
          },
          path: `${path}/qti-sum`,
          rule: "expression-type",
        })),
      );
    });

    it("[T-9] refuses an unprefixed qti-variable naming nothing the test declares in outcome processing, a pre-condition, a branch rule and a template default (pantry P8)", () => {
      assert.deepStrictEqual(
        judged(inEveryContext(() => variable("NOPE"))),
        contextPaths.map((path) => ({
          detail: { element: "qti-variable", expected: "variable", identifier: "NOPE" },
          path: `${path}/qti-variable`,
          rule: "undeclared-variable",
        })),
      );
    });

    it("[T-9] accepts a pre-condition and a branch rule whose expression is a single integer, since no condition rule judges them (pantry conditionKinds)", () => {
      assert.deepStrictEqual(
        judged(
          oneSection(
            [itemRef("I1", [branchRule("EXIT_TEST", integer("1"))])],
            [preCondition(integer("1"))],
          ),
        ),
        [],
      );
    });

    it("[T-9] accepts a template default that sets a template variable from a string in a test alone, whose item only a package holds (pantry P20)", () => {
      assert.deepStrictEqual(
        judged(oneSection([itemRef("I1", [templateDefault("T", baseValue("string", "x"))])])),
        [],
      );
    });

    it("[T-9] accepts a template default that reads a test outcome and ITEM1.SCORE, since the template read rule does not judge a test (pantry P26)", () => {
      assert.deepStrictEqual(
        judged(
          assessmentTest([
            score,
            part("P", [
              section("S", [
                itemRef("ITEM1"),
                itemRef("I2", [
                  templateDefault("T", sum(variable("SCORE"), variable("ITEM1.SCORE"))),
                ]),
              ]),
            ]),
          ]),
        ),
        [],
      );
    });

    it("[T-9] the processing scope: accepts outcome processing that reads numAttempts and sets completionStatus, both unprefixed, and still refuses a printed numAttempts (pantry builtInsOf, printed-variable-ref)", () => {
      assert.deepStrictEqual(
        judged(
          assessmentTest([
            rubricBlock(el("p", [], [printed("numAttempts")])),
            part("P", [section("S", [itemRef("I1")])]),
            outcomeCondition(
              el(
                "qti-outcome-if",
                [],
                [
                  atLeastOne(variable("numAttempts")),
                  el(
                    "qti-set-outcome-value",
                    [attr("identifier", "completionStatus")],
                    [baseValue("identifier", "completed")],
                  ),
                ],
              ),
            ),
          ]),
        ),
        [
          {
            detail: {
              attribute: "identifier",
              declarer: "test",
              element: "qti-printed-variable",
              expected: "outcome",
              identifier: "numAttempts",
            },
            path: "qti-assessment-test/qti-rubric-block/qti-content-body/p/qti-printed-variable/@identifier",
            rule: "undeclared-variable",
          },
        ],
      );
    });

    it("[T-9] refuses a weighted qti-test-variables whose base type is integer, with check weight (pantry P29)", () => {
      assert.deepStrictEqual(judged(whenNull(weighted("integer"))), [
        {
          detail: { baseType: "integer", check: "weight", element: "qti-test-variables" },
          path: "qti-assessment-test/qti-outcome-processing/qti-outcome-condition/qti-outcome-if/qti-is-null/qti-test-variables",
          rule: "expression-type",
        },
      ]);
    });

    it("[T-9] accepts a weighted qti-test-variables whose base type is float or absent (pantry P29)", () => {
      assert.deepStrictEqual(
        [judged(whenNull(weighted("float"))), judged(whenNull(weighted()))],
        [[], []],
      );
    });

    it("[T-9] test-level type: refuses the single float SCORE set straight from qti-test-variables, a multiple, as expression-type, and accepts it under a qti-sum (pantry P20)", () => {
      const testVariables = el("qti-test-variables", [attr("variable-identifier", "SCORE")]);

      assert.deepStrictEqual(
        [judged(scoring(testVariables)), judged(scoring(sum(testVariables)))],
        [
          [
            {
              detail: {
                element: "qti-set-outcome-value",
                expressionBaseType: "",
                expressionCardinality: "multiple",
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

    it("[T-9] accepts ITEM1.SCORE in a test alone, whose items only a package holds", () => {
      assert.deepStrictEqual(judged(scoring(variable("ITEM1.SCORE"))), []);
    });

    it("[T-9] judges a section document's expressions only by the rules that need no declaration (reading 5)", () => {
      assert.deepStrictEqual(
        judged(
          sectionDocument("S", [
            preCondition(atLeastOne(variable("NOPE"))),
            branchRule("EXIT_SECTION", atLeastOne(sum(baseValue("string", "x")))),
            itemRef("I1", [templateDefault("T", variable("numAttempts"))]),
          ]),
        ),
        [
          {
            detail: {
              acceptsBaseTypes: "integer float",
              acceptsCardinalities: "multiple ordered single",
              check: "operand",
              element: "qti-sum",
              expressionBaseType: "string",
              expressionCardinality: "single",
              operand: "1",
            },
            path: "qti-assessment-section/qti-branch-rule/qti-gte/qti-sum",
            rule: "expression-type",
          },
        ],
      );
    });

    it("[T-9] gives the processing rules' refusals in document order among the test rules'", () => {
      assert.deepStrictEqual(
        judged(
          assessmentTest([
            part("P", [preCondition(atLeastOne(variable("NOPE"))), section("S1", [itemRef("I1")])]),
            part("P", [section("S2", [itemRef("I2")])]),
            outcomeProcessing(variable("GONE")),
          ]),
        ).map(({ detail, path, rule }) => [rule, path, detail["identifier"]]),
        [
          [
            "undeclared-variable",
            "qti-assessment-test/qti-test-part[1]/qti-pre-condition/qti-gte/qti-variable",
            "NOPE",
          ],
          ["duplicate-identifier", "qti-assessment-test/qti-test-part[2]/@identifier", "P"],
          [
            "undeclared-variable",
            "qti-assessment-test/qti-outcome-processing/qti-set-outcome-value",
            "SCORE",
          ],
          [
            "undeclared-variable",
            "qti-assessment-test/qti-outcome-processing/qti-set-outcome-value/qti-variable",
            "GONE",
          ],
        ],
      );
    });
  });

  describe("what the rules judge", () => {
    it("passes over a section root nested in a selection's lax content (readings 6 and 57)", () => {
      assert.deepStrictEqual(
        judged(
          oneSection([
            el(
              "qti-selection",
              [attr("select", "1")],
              [el("extension", [], [section("S", [])], "urn:example:extension")],
            ),
            itemRef("I1"),
          ]),
        ),
        [],
      );
    });

    it("gives nothing for a document holding an unexpanded entity reference", () => {
      assert.deepStrictEqual(
        judged(oneSection([itemRef("I1"), itemRef("I1"), entity("more")])),
        [],
      );
    });

    it("gives nothing for an item root", () => {
      assert.deepStrictEqual(
        judged(
          doc(
            location,
            el(
              "qti-assessment-item",
              [attr("identifier", "I"), attr("time-dependent", "false"), attr("title", "Item")],
              [
                el(
                  "qti-item-body",
                  [],
                  [
                    el(
                      "qti-rubric-block",
                      [attr("view", "candidate")],
                      [el("qti-content-body", [], [choice])],
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        [],
      );
    });

    it("gives every refusal in document order, never stopping at the first", () => {
      assert.deepStrictEqual(
        judged(
          assessmentTest([
            part("P", [
              preCondition(atLeastOne(el("qti-number-selected"))),
              section("S", [rubricBlock(choice)]),
              section("S", [itemRef("I1")]),
            ]),
          ]),
        ).map(({ path, rule }) => [rule, path]),
        [
          ["expression-placement", `${partPath}/qti-pre-condition/qti-gte/qti-number-selected`],
          ["child-count", `${partPath}/qti-assessment-section[1]`],
          [
            "misplaced-element",
            `${partPath}/qti-assessment-section[1]/qti-rubric-block/qti-content-body/qti-choice-interaction`,
          ],
          ["duplicate-identifier", `${partPath}/qti-assessment-section[2]/@identifier`],
        ],
      );
    });
  });
});

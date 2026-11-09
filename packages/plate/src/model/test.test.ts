import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { attr, doc, el, text, xincludeNamespace } from "#plate/document/source.ts";
import type {
  SourceAttribute,
  SourceChild,
  SourceDocument,
  SourceElement,
} from "#plate/document/source.ts";
import { buildItem } from "#plate/model/item.ts";
import type { Rule } from "#plate/model/expression.ts";
import type { UnsupportedFeature } from "#plate/model/item.ts";
import { absentControl, buildTest, withLtiLinks } from "#plate/model/test.ts";
import type {
  MarkedFeature,
  Section,
  SectionChild,
  TemplateDefault,
  Test,
} from "#plate/model/test.ts";
import { checkStructure } from "#plate/validate/structure.ts";
import { tables } from "#plate/validate/tables.ts";

/**
 * The path of the test root, which every path in these tests starts with.
 */
const root = "qti-assessment-test";

/**
 * The path of the first test part.
 */
const firstPart = `${root}/qti-test-part`;

/**
 * Construct a test document with its two required attributes.
 *
 * @param children The root's children.
 * @returns The document, at `tests/test.xml`.
 */
const test = (children: readonly SourceChild[]): SourceDocument =>
  doc(
    "tests/test.xml",
    el(
      "qti-assessment-test",
      [attr("identifier", "two-parts"), attr("title", "Two parts")],
      children,
    ),
  );

/**
 * Construct a test part.
 *
 * @param identifier The part's identifier.
 * @param navigation Its `navigation-mode`.
 * @param submission Its `submission-mode`.
 * @param children Its children.
 * @returns The part element.
 */
const part = (
  identifier: string,
  navigation: string,
  submission: string,
  children: readonly SourceChild[],
): SourceElement =>
  el(
    "qti-test-part",
    [
      attr("identifier", identifier),
      attr("navigation-mode", navigation),
      attr("submission-mode", submission),
    ],
    children,
  );

/**
 * Construct a visible section titled after its identifier.
 *
 * @param identifier The section's identifier.
 * @param children Its children.
 * @param attributes Its other attributes, none by default.
 * @returns The section element.
 */
const section = (
  identifier: string,
  children: readonly SourceChild[],
  attributes: readonly SourceAttribute[] = [],
): SourceElement =>
  el(
    "qti-assessment-section",
    [
      attr("identifier", identifier),
      attr("title", `Section ${identifier}`),
      attr("visible", "true"),
      ...attributes,
    ],
    children,
  );

/**
 * Construct an item reference.
 *
 * @param identifier The reference's identifier.
 * @param href Its `href`, as written.
 * @param attributes Its other attributes, none by default.
 * @param children Its children, none by default.
 * @returns The item reference element.
 */
const itemRef = (
  identifier: string,
  href: string,
  attributes: readonly SourceAttribute[] = [],
  children: readonly SourceChild[] = [],
): SourceElement =>
  el(
    "qti-assessment-item-ref",
    [attr("href", href), attr("identifier", identifier), ...attributes],
    children,
  );

/**
 * Construct a `qti-item-session-control`.
 *
 * @param attributes The attributes it sets.
 * @returns The element.
 */
const control = (...attributes: readonly SourceAttribute[]): SourceElement =>
  el("qti-item-session-control", attributes);

/**
 * Construct an outcome declaration.
 *
 * @param identifier The declared identifier.
 * @param baseType The `base-type` value.
 * @param children The declaration's children, none by default.
 * @returns The declaration element.
 */
const outcome = (
  identifier: string,
  baseType: string,
  children: readonly SourceChild[] = [],
): SourceElement =>
  el(
    "qti-outcome-declaration",
    [attr("base-type", baseType), attr("cardinality", "single"), attr("identifier", identifier)],
    children,
  );

/**
 * Construct a `qti-default-value` of one value.
 *
 * @param value The value's text.
 * @returns The element.
 */
const defaultValue = (value: string): SourceElement =>
  el("qti-default-value", [], [el("qti-value", [], [text(value)])]);

/**
 * A test of two parts: a linear one whose section holds an item, a nested section and another
 * item, and a nonlinear one of one section and one item.
 */
const twoParts = test([
  outcome("SCORE", "float", [defaultValue("0")]),
  part("P1", "linear", "individual", [
    control(attr("show-feedback", "true")),
    section("S1", [
      itemRef("I1", "items/one.xml", [attr("category", " core\tmath ")]),
      section(
        "S1a",
        [
          control(attr("max-attempts", "2")),
          itemRef("I2", " items/two.xml ", [attr("fixed", "true"), attr("required", "1")]),
        ],
        [attr("fixed", "1"), attr("keep-together", "false"), attr("required", "true")],
      ),
      itemRef("I3", "items/three.xml"),
    ]),
  ]),
  part("P2", "nonlinear", "simultaneous", [section("S2", [itemRef("I4", "items/four.xml")])]),
]);

/**
 * A section's tree by identifier: an item reference's identifier, or a section's identifier and its
 * children's outlines.
 */
type Outline = string | readonly [string, readonly Outline[]];

/**
 * Give a section child's outline.
 *
 * @param child The child.
 * @returns Its outline.
 */
const outline = (child: SectionChild): Outline =>
  child.kind === "item-ref" ? child.identifier : [child.identifier, child.children.map(outline)];

/**
 * Give a section child and, when it is a section, everything below it, each before its children.
 *
 * @param child The child.
 * @returns It and its descendants, in document order.
 */
const within = (child: SectionChild): readonly SectionChild[] =>
  child.kind === "section" ? [child, ...child.children.flatMap(within)] : [child];

/**
 * Give every section and item reference of a test, each before its children.
 *
 * @param built The test.
 * @returns Them, in document order.
 */
const nodesOf = (built: Test): readonly SectionChild[] =>
  built.parts.flatMap((testPart) => testPart.children.flatMap(within));

/**
 * Construct the mark of a test feature.
 *
 * @param feature The feature's key.
 * @param path Where.
 * @returns The mark.
 */
const mark = (feature: string, path: string): MarkedFeature => ({ feature, path, shown: "mark" });

/**
 * Find a section or an item reference of a test by identifier and kind.
 *
 * @param built The test.
 * @param identifier The identifier.
 * @param kind The kind it must have.
 * @returns It, or a failed assertion.
 */
const nodeNamed = <const K extends SectionChild["kind"]>(
  built: Test,
  identifier: string,
  kind: K,
): Extract<SectionChild, { kind: K }> => {
  const found = nodesOf(built).find(
    (node): node is Extract<SectionChild, { kind: K }> =>
      node.identifier === identifier && node.kind === kind,
  );

  return found ?? assert.fail(`The test holds no ${kind} ${identifier}.`);
};

describe("buildTest", () => {
  it.effect(
    "[T-4] [T-7] [S-0] [S-7] reads a two-part test with a nested section as its tree, in document order",
    () =>
      Effect.gen(function* readsTwoParts() {
        const built = yield* buildTest(twoParts);

        assert.deepStrictEqual(checkStructure(twoParts, tables), []);
        assert.strictEqual(built.document, "tests/test.xml");
        assert.strictEqual(built.identifier, "two-parts");
        assert.strictEqual(built.title, "Two parts");
        assert.deepStrictEqual(
          built.parts.map((testPart) => [
            testPart.identifier,
            testPart.navigation,
            testPart.submission,
          ]),
          [
            ["P1", "linear", "individual"],
            ["P2", "nonlinear", "simultaneous"],
          ],
        );
        assert.deepStrictEqual(
          built.parts.map((testPart) => testPart.children.map(outline)),
          [[["S1", ["I1", ["S1a", ["I2"]], "I3"]]], [["S2", ["I4"]]]],
        );

        const outer: Section = nodeNamed(built, "S1", "section");
        const nested: Section = nodeNamed(built, "S1a", "section");
        assert.deepStrictEqual(
          [outer.title, outer.visible, outer.required, outer.fixed, outer.keepTogether],
          ["Section S1", true, false, false, true],
        );
        assert.deepStrictEqual(
          [nested.title, nested.visible, nested.required, nested.fixed, nested.keepTogether],
          ["Section S1a", true, true, true, false],
        );

        const first = nodeNamed(built, "I1", "item-ref");
        const second = nodeNamed(built, "I2", "item-ref");
        assert.deepStrictEqual(
          [first.href, first.category, first.required, first.fixed],
          ["items/one.xml", ["core", "math"], false, false],
        );
        assert.deepStrictEqual(
          [second.href, second.category, second.required, second.fixed],
          ["items/two.xml", [], true, true],
        );
        assert.deepStrictEqual(
          [...built.outcomes.values()],
          [
            {
              baseType: "float",
              cardinality: "single",
              defaultValue: Option.some({
                baseType: "float",
                cardinality: "single",
                values: [{ baseType: "float", value: 0 }],
              }),
              identifier: "SCORE",
              interpretation: Option.none(),
              longInterpretation: Option.none(),
              lookupTable: Option.none(),
              masteryValue: Option.none(),
              normalMaximum: Option.none(),
              normalMinimum: Option.none(),
              view: Option.none(),
            },
          ],
        );
        assert.deepStrictEqual(built.unsupported, []);
      }),
  );

  it.effect(
    "holds each session-control attribute as written or absent, never filled in from a default",
    () =>
      Effect.gen(function* readsControl() {
        const built = yield* buildTest(twoParts);

        assert.deepStrictEqual(nodeNamed(built, "S1a", "section").control, {
          ...absentControl,
          maxAttempts: Option.some(2),
        });
        assert.deepStrictEqual(nodeNamed(built, "S1", "section").control, absentControl);
        assert.deepStrictEqual(nodeNamed(built, "I2", "item-ref").control, absentControl);
        assert.deepStrictEqual(built.parts[0]?.control, {
          ...absentControl,
          showFeedback: Option.some(true),
        });
      }),
  );

  it.effect(
    "marks each unsupported test feature once at its path, in document order, and delivers around it",
    () =>
      Effect.gen(function* marksFeatures() {
        const marked = test([
          outcome("SCORE", "float"),
          el("qti-time-limits", [attr("max-time", "600")]),
          el(
            "qti-rubric-block",
            [attr("view", "candidate")],
            [
              el("qti-stylesheet", [attr("href", "rubric.css"), attr("type", "text/css")]),
              el("qti-content-body", [], [el("p", [], [text("Read each question carefully.")])]),
            ],
          ),
          part("P1", "linear", "individual", [
            control(attr("allow-comment", "1")),
            section("S1", [
              el("qti-time-limits", [attr("min-time", "60")]),
              el("qti-selection", [attr("select", "1")]),
              el("qti-ordering", [attr("shuffle", "true")]),
              itemRef(
                "I1",
                "items/one.xml",
                [],
                [
                  control(attr("max-attempts", "-1"), attr("allow-review", "false")),
                  el("qti-weight", [attr("identifier", "DOUBLE"), attr("value", "2")]),
                ],
              ),
              itemRef("I2", "items/two.xml"),
            ]),
            el("qti-assessment-section-ref", [
              attr("href", "sections/more.xml"),
              attr("identifier", "S2"),
            ]),
          ]),
          el(
            "qti-outcome-processing",
            [],
            [
              el(
                "qti-set-outcome-value",
                [attr("identifier", "SCORE")],
                [el("qti-base-value", [attr("base-type", "float")], [text("1")])],
              ),
            ],
          ),
        ]);
        const built = yield* buildTest(marked);
        const firstSection = `${firstPart}/qti-assessment-section`;

        assert.deepStrictEqual(checkStructure(marked, tables), []);
        assert.deepStrictEqual(built.unsupported, [
          mark("qti-time-limits", `${root}/qti-time-limits`),
          mark("qti-rubric-block", `${root}/qti-rubric-block`),
          mark('allow-comment="true"', `${firstPart}/qti-item-session-control`),
          mark("qti-time-limits", `${firstSection}/qti-time-limits`),
          mark("qti-selection", `${firstSection}/qti-selection`),
          mark("qti-ordering", `${firstSection}/qti-ordering`),
          mark(
            "max-attempts:negative",
            `${firstSection}/qti-assessment-item-ref[1]/qti-item-session-control/@max-attempts`,
          ),
          mark("qti-assessment-section-ref", `${firstPart}/qti-assessment-section-ref`),
        ]);
        assert.deepStrictEqual([...nodeNamed(built, "I1", "item-ref").weights], [["DOUBLE", 2]]);
        assert.strictEqual(built.outcomeProcessing.kind, "runs");
        assert.deepStrictEqual(
          built.parts.map((testPart) => testPart.children.map(outline)),
          [[["S1", ["I1", "I2"]]]],
        );
        assert.deepStrictEqual(nodeNamed(built, "I1", "item-ref").control, {
          ...absentControl,
          allowReview: Option.some(false),
          maxAttempts: Option.some(-1),
        });
        assert.deepStrictEqual(built.parts[0]?.control, {
          ...absentControl,
          allowComment: Option.some(true),
        });
      }),
  );

  it.effect(
    "marks an adaptive selection and an xi:include at their paths, and leaves the include out of the tree",
    () =>
      Effect.gen(function* marksAdaptiveAndInclude() {
        const included = test([
          part("P1", "linear", "individual", [
            section("S1", [
              el(
                "qti-adaptive-selection",
                [],
                [
                  el("qti-adaptive-engine-ref", [
                    attr("href", "https://engine.example/cat"),
                    attr("identifier", "ENGINE"),
                  ]),
                ],
              ),
              itemRef("I1", "items/one.xml"),
            ]),
            section("S2", [
              itemRef("I2", "items/two.xml"),
              el("include", [attr("href", "shared/items.xml")], [], xincludeNamespace),
              itemRef("I3", "items/three.xml"),
            ]),
          ]),
        ]);
        const built = yield* buildTest(included);

        assert.deepStrictEqual(checkStructure(included, tables), []);
        assert.deepStrictEqual(built.unsupported, [
          mark(
            "qti-adaptive-selection",
            `${firstPart}/qti-assessment-section[1]/qti-adaptive-selection`,
          ),
          mark(
            "xi:include",
            `${firstPart}/qti-assessment-section[2]/{${xincludeNamespace}}include`,
          ),
        ]);
        assert.deepStrictEqual(
          built.parts.map((testPart) => testPart.children.map(outline)),
          [
            [
              ["S1", ["I1"]],
              ["S2", ["I2", "I3"]],
            ],
          ],
        );
      }),
  );

  it.effect("reads its outcome declarations, and marks those it does not hold, as an item's", () =>
    Effect.gen(function* readsOutcomes() {
      const declarations = [
        outcome("SCORE", "float", [defaultValue(" 2.5 ")]),
        outcome("PASSED", "boolean"),
        outcome("TIME", "duration"),
        outcome("GRADE", "identifier", [
          el(
            "qti-match-table",
            [attr("default-value", "F")],
            [el("qti-match-table-entry", [attr("source-value", "1"), attr("target-value", "A")])],
          ),
        ]),
        el("qti-outcome-declaration", [attr("cardinality", "record"), attr("identifier", "REC")]),
      ];
      const built = yield* buildTest(
        test([...declarations, part("P1", "linear", "individual", [section("S1", [])])]),
      );
      const item = yield* buildItem(
        doc(
          "items/item.xml",
          el(
            "qti-assessment-item",
            [attr("identifier", "item"), attr("title", "Item")],
            declarations,
          ),
        ),
      );

      assert.deepStrictEqual(built.outcomes, item.outcomes);
      assert.deepStrictEqual([...built.outcomes.keys()], ["SCORE", "PASSED", "TIME", "GRADE"]);
      assert.deepStrictEqual(
        built.outcomes.get("GRADE")?.lookupTable,
        Option.some({
          defaultValue: Option.some({ baseType: "identifier", value: "F" }),
          entries: [{ sourceValue: 1n, targetValue: { baseType: "identifier", value: "A" } }],
          kind: "match",
        }),
      );
      assert.deepStrictEqual<readonly UnsupportedFeature[]>(
        built.unsupported,
        item.unsupported.map((feature) => ({
          ...feature,
          path: feature.path.replace(/^qti-assessment-item\//u, `${root}/`),
        })),
      );
      assert.deepStrictEqual(
        built.unsupported.map((feature) => feature.feature),
        ['cardinality="record"'],
      );
    }),
  );

  it.effect(
    "[T-1] holds a test outcome of base type duration, its default read as seconds, and marks one of base type file",
    () =>
      Effect.gen(function* holdsDurationOutcome() {
        const built = yield* buildTest(
          test([
            outcome("TIME", "duration", [defaultValue("90.5")]),
            outcome("UPLOAD", "file"),
            part("P1", "linear", "individual", [section("S1", [])]),
          ]),
        );

        assert.deepStrictEqual([...built.outcomes.keys()], ["TIME"]);
        assert.deepStrictEqual(built.outcomes.get("TIME")?.baseType, "duration");
        assert.deepStrictEqual(
          built.outcomes.get("TIME")?.defaultValue,
          Option.some({
            baseType: "duration",
            cardinality: "single",
            values: [{ baseType: "duration", value: 90.5 }],
          }),
        );
        assert.deepStrictEqual(built.unsupported, [
          mark('base-type="file"', `${root}/qti-outcome-declaration[2]`),
        ]);
      }),
  );

  it.effect("reads its outcome declarations' six reporting attributes as an item's", () =>
    Effect.gen(function* readsReporting() {
      const declarations = [
        el(
          "qti-outcome-declaration",
          [
            attr("base-type", "float"),
            attr("cardinality", "single"),
            attr("identifier", "TOTAL"),
            attr("view", "candidate scorer"),
            attr("interpretation", "Points, out of 10"),
            attr("long-interpretation", " https://example.org/scales/points "),
            attr("normal-maximum", "10"),
            attr("normal-minimum", "0"),
            attr("mastery-value", "7.5"),
          ],
          [defaultValue("0.5")],
        ),
        outcome("PASSED", "boolean"),
      ];
      const built = yield* buildTest(
        test([...declarations, part("P1", "linear", "individual", [section("S1", [])])]),
      );
      const item = yield* buildItem(
        doc(
          "items/item.xml",
          el(
            "qti-assessment-item",
            [attr("identifier", "item"), attr("title", "Item")],
            declarations,
          ),
        ),
      );
      const total = built.outcomes.get("TOTAL");

      assert.deepStrictEqual(built.outcomes, item.outcomes);
      assert.deepStrictEqual(
        [
          total?.view,
          total?.interpretation,
          total?.longInterpretation,
          total?.normalMaximum,
          total?.normalMinimum,
          total?.masteryValue,
        ],
        [
          Option.some(["candidate", "scorer"]),
          Option.some("Points, out of 10"),
          Option.some("https://example.org/scales/points"),
          Option.some(10),
          Option.some(0),
          Option.some(7.5),
        ],
      );
      assert.deepStrictEqual(built.outcomes.get("PASSED")?.view, Option.none());
    }),
  );

  it.effect("refuses a malformed normal-maximum on a test outcome at the attribute", () =>
    Effect.gen(function* refusesNormalMaximum() {
      const refusal = yield* Effect.flip(
        buildTest(
          test([
            el("qti-outcome-declaration", [
              attr("base-type", "float"),
              attr("cardinality", "single"),
              attr("identifier", "TOTAL"),
              attr("normal-maximum", "ten"),
            ]),
            part("P1", "linear", "individual", [section("S1", [])]),
          ]),
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

  it.effect("refuses a max-attempts outside xs:int at the attribute", () =>
    Effect.gen(function* refusesAttempts() {
      const refusal = yield* Effect.flip(
        buildTest(
          test([
            part("P1", "linear", "individual", [
              control(attr("max-attempts", "2147483648")),
              section("S1", []),
            ]),
          ]),
        ),
      );

      assert.strictEqual(refusal.rule, "value-type");
      assert.deepStrictEqual(refusal.location, {
        kind: "path",
        path: `${firstPart}/qti-item-session-control/@max-attempts`,
      });
      assert.deepStrictEqual(refusal.detail, { baseType: "xs:int", lexical: "2147483648" });
    }),
  );
});

/**
 * The path of a test's `qti-outcome-processing`, where a name its rules read and the engine does
 * not hold is marked.
 */
const processingPath = `${root}/qti-outcome-processing`;

/**
 * Construct a `qti-base-value`.
 *
 * @param baseType Its `base-type`.
 * @param value Its text.
 * @returns The element.
 */
const baseValue = (baseType: string, value: string): SourceElement =>
  el("qti-base-value", [attr("base-type", baseType)], [text(value)]);

/**
 * Construct a `qti-variable`.
 *
 * @param identifier The name it reads.
 * @returns The element.
 */
const variable = (identifier: string): SourceElement =>
  el("qti-variable", [attr("identifier", identifier)]);

/**
 * Construct a rule that names an outcome and holds one expression.
 *
 * @param local `qti-set-outcome-value` or `qti-lookup-outcome-value`.
 * @param identifier The outcome.
 * @param expression Its expression.
 * @returns The element.
 */
const setting = (
  local: "qti-lookup-outcome-value" | "qti-set-outcome-value",
  identifier: string,
  expression: SourceElement,
): SourceElement => el(local, [attr("identifier", identifier)], [expression]);

/**
 * Construct a test of one part `P1`, one section `S1` and one item reference `I1`, with a float
 * `SCORE`, a duration `TIME`, the given further outcome declarations and outcome processing of the
 * given rules.
 *
 * @param rules The rules its `qti-outcome-processing` holds.
 * @param outcomes Its further outcome declarations, after `SCORE` and `TIME`, none by default.
 * @returns The document.
 */
const processed = (
  rules: readonly SourceChild[],
  outcomes: readonly SourceElement[] = [],
): SourceDocument =>
  test([
    outcome("SCORE", "float", [defaultValue("0")]),
    outcome("TIME", "duration"),
    ...outcomes,
    part("P1", "linear", "individual", [section("S1", [itemRef("I1", "items/one.xml")])]),
    el("qti-outcome-processing", [], rules),
  ]);

/**
 * The float single value of a number, as a `qti-base-value` reads.
 *
 * @param value The number.
 * @returns The expression.
 */
const floatValue = (value: number) =>
  ({
    kind: "base-value",
    operands: [],
    value: { baseType: "float", cardinality: "single", values: [{ baseType: "float", value }] },
  }) as const;

/**
 * The expression a {@link variable} reads into.
 *
 * @param identifier The name it reads.
 * @returns The expression.
 */
const variableRead = (identifier: string) =>
  ({
    identifier,
    kind: "variable",
    operands: [],
    weightIdentifier: Option.none(),
  }) as const;

describe("buildTest's outcome processing, weights and variable mappings", () => {
  it.effect(
    "[T-9] declared holds every identifier the test's outcome and context declarations declare, those the model does not hold included",
    () =>
      Effect.gen(function* holdsDeclared() {
        const built = yield* buildTest(
          test([
            outcome("SCORE", "float"),
            el("qti-outcome-declaration", [
              attr("cardinality", "record"),
              attr("identifier", "DETAIL"),
            ]),
            el("qti-context-declaration", [
              attr("base-type", "float"),
              attr("cardinality", "single"),
              attr("identifier", "I1.SCORE"),
            ]),
            part("P1", "linear", "individual", [section("S1", [itemRef("I1", "items/one.xml")])]),
          ]),
        );

        assert.deepStrictEqual([...built.outcomes.keys()], ["SCORE"]);
        assert.deepStrictEqual(built.declared, new Set(["DETAIL", "I1.SCORE", "SCORE"]));
      }),
  );

  it.effect("[T-9] absent, marked or runs: a test with no outcome processing is absent", () =>
    Effect.gen(function* absent() {
      const built = yield* buildTest(twoParts);

      assert.deepStrictEqual(built.outcomeProcessing, { kind: "absent" });
    }),
  );

  it.effect(
    "[T-9] absent, marked or runs: one the engine runs is runs, its five rules read in order and a fragment's in its place",
    () =>
      Effect.gen(function* runs() {
        const document = processed([
          el(
            "qti-outcome-condition",
            [],
            [
              el(
                "qti-outcome-if",
                [],
                [
                  el("qti-gte", [], [variable("SCORE"), baseValue("float", "1")]),
                  setting("qti-set-outcome-value", "SCORE", baseValue("float", "2")),
                ],
              ),
              el("qti-outcome-else-if", [], [variable("I1.PASSED"), el("qti-exit-test")]),
              el(
                "qti-outcome-else",
                [],
                [setting("qti-set-outcome-value", "SCORE", baseValue("float", "0"))],
              ),
            ],
          ),
          setting("qti-lookup-outcome-value", "SCORE", variable("I1.SCORE")),
          el(
            "qti-outcome-processing-fragment",
            [],
            [setting("qti-set-outcome-value", "SCORE", variable("SCORE"))],
          ),
          el("qti-exit-test"),
        ]);
        const built = yield* buildTest(document);

        assert.deepStrictEqual(checkStructure(document, tables), []);
        assert.deepStrictEqual(built.unsupported, []);
        assert.deepStrictEqual(built.outcomeProcessing, {
          kind: "runs",
          rules: [
            {
              branches: [
                {
                  // oxlint-disable-next-line unicorn/no-thenable -- `then` is the branch's rule list, as `Branch` names it.
                  then: [{ expression: floatValue(2), identifier: "SCORE", kind: "set-outcome" }],
                  when: { kind: "gte", operands: [variableRead("SCORE"), floatValue(1)] },
                },
                // oxlint-disable-next-line unicorn/no-thenable -- `then` is the branch's rule list, as `Branch` names it.
                { then: [{ kind: "exit" }], when: variableRead("I1.PASSED") },
              ],
              kind: "condition",
              otherwise: Option.some<readonly Rule[]>([
                { expression: floatValue(0), identifier: "SCORE", kind: "set-outcome" },
              ]),
            },
            { expression: variableRead("I1.SCORE"), identifier: "SCORE", kind: "lookup-outcome" },
            { expression: variableRead("SCORE"), identifier: "SCORE", kind: "set-outcome" },
            { kind: "exit" },
          ],
        });
      }),
  );

  it.effect(
    "[T-9] absent, marked or runs: one that reads numAttempts is marked variable:numAttempts at the processing",
    () =>
      Effect.gen(function* readsAttempts() {
        const document = processed([
          el(
            "qti-outcome-condition",
            [],
            [
              el(
                "qti-outcome-if",
                [],
                [
                  el("qti-gte", [], [variable("numAttempts"), baseValue("integer", "1")]),
                  setting("qti-set-outcome-value", "SCORE", baseValue("float", "1")),
                ],
              ),
            ],
          ),
        ]);
        const built = yield* buildTest(document);

        assert.deepStrictEqual(checkStructure(document, tables), []);
        assert.deepStrictEqual(built.outcomeProcessing, { kind: "marked" });
        assert.deepStrictEqual(built.unsupported, [mark("variable:numAttempts", processingPath)]);
      }),
  );

  it.effect(
    "align-54 R3 test declarations F2: one that declares an outcome numAttempts and reads it has no structural refusal and runs, the declared outcome held (reading 168)",
    () =>
      Effect.gen(function* declaresAttempts() {
        const document = processed(
          [
            el(
              "qti-outcome-condition",
              [],
              [
                el(
                  "qti-outcome-if",
                  [],
                  [
                    el("qti-gte", [], [variable("numAttempts"), baseValue("integer", "1")]),
                    setting("qti-set-outcome-value", "SCORE", baseValue("float", "1")),
                  ],
                ),
              ],
            ),
          ],
          [outcome("numAttempts", "integer")],
        );
        const built = yield* buildTest(document);

        assert.deepStrictEqual(checkStructure(document, tables), []);
        assert.deepStrictEqual(built.unsupported, []);
        assert.strictEqual(built.outcomeProcessing.kind, "runs");
      }),
  );

  it.effect(
    "[T-9] absent, marked or runs: one that reads a part's, a section's or an item ref's duration is marked by each name, unless the test declares it whole",
    () =>
      Effect.gen(function* readsDurations() {
        const document = processed([
          setting("qti-set-outcome-value", "TIME", variable("P1.duration")),
          setting("qti-set-outcome-value", "TIME", variable("S1.duration")),
          setting("qti-set-outcome-value", "TIME", variable("I1.duration")),
          setting("qti-set-outcome-value", "TIME", variable("duration")),
        ]);
        const built = yield* buildTest(document);
        const declared = test([
          outcome("P1.duration", "duration"),
          part("P1", "linear", "individual", [section("S1", [itemRef("I1", "items/one.xml")])]),
          el(
            "qti-outcome-processing",
            [],
            [setting("qti-set-outcome-value", "P1.duration", variable("P1.duration"))],
          ),
        ]);
        const whole = yield* buildTest(declared);

        assert.deepStrictEqual(checkStructure(document, tables), []);
        assert.deepStrictEqual(built.outcomeProcessing, { kind: "marked" });
        assert.deepStrictEqual(built.unsupported, [
          mark("variable:P1.duration", processingPath),
          mark("variable:S1.duration", processingPath),
          mark("variable:I1.duration", processingPath),
        ]);
        assert.strictEqual(whole.outcomeProcessing.kind, "runs");
        assert.deepStrictEqual(whole.unsupported, []);
      }),
  );

  it.effect(
    "[T-9] an occurrence duration is marked: I1.1.duration and I1.02.duration are marked by name at the processing, as I1.duration is, and I1.1.SCORE is held",
    () =>
      Effect.gen(function* marksOccurrenceDurations() {
        const reads = (name: string): SourceDocument =>
          processed([setting("qti-set-outcome-value", "TIME", variable(name))]);
        const first = reads("I1.1.duration");
        const built = yield* buildTest(first);
        const padded = yield* buildTest(reads("I1.02.duration"));
        const plain = yield* buildTest(reads("I1.duration"));
        const scored = yield* buildTest(
          processed([setting("qti-set-outcome-value", "SCORE", variable("I1.1.SCORE"))]),
        );

        assert.deepStrictEqual(checkStructure(first, tables), []);
        assert.deepStrictEqual(built.outcomeProcessing, { kind: "marked" });
        assert.deepStrictEqual(built.unsupported, [mark("variable:I1.1.duration", processingPath)]);
        assert.deepStrictEqual(padded.outcomeProcessing, { kind: "marked" });
        assert.deepStrictEqual(padded.unsupported, [
          mark("variable:I1.02.duration", processingPath),
        ]);
        assert.deepStrictEqual(plain.unsupported, [mark("variable:I1.duration", processingPath)]);
        assert.strictEqual(scored.outcomeProcessing.kind, "runs");
        assert.deepStrictEqual(scored.unsupported, []);
      }),
  );

  it.effect(
    "[T-9] absent, marked or runs: one whose qti-test-variables names duration is marked variable:duration at the processing",
    () =>
      Effect.gen(function* collectsDurations() {
        const document = processed([
          setting(
            "qti-set-outcome-value",
            "SCORE",
            el(
              "qti-sum",
              [],
              [el("qti-test-variables", [attr("variable-identifier", "duration")])],
            ),
          ),
        ]);
        const built = yield* buildTest(document);

        assert.deepStrictEqual(checkStructure(document, tables), []);
        assert.deepStrictEqual(built.outcomeProcessing, { kind: "marked" });
        assert.deepInclude(built.unsupported, mark("variable:duration", processingPath));
      }),
  );

  it.effect(
    "[T-9] absent, marked or runs: one that holds an xi:include is marked xi:include at the include, once",
    () =>
      Effect.gen(function* holdsInclude() {
        const document = processed([
          setting("qti-set-outcome-value", "SCORE", baseValue("float", "1")),
          el("include", [attr("href", "shared/processing.xml")], [], xincludeNamespace),
        ]);
        const built = yield* buildTest(document);

        assert.deepStrictEqual(built.outcomeProcessing, { kind: "marked" });
        assert.deepStrictEqual(built.unsupported, [
          mark("xi:include", `${processingPath}/{${xincludeNamespace}}include`),
        ]);
      }),
  );

  it.effect(
    "[T-9] reads each qti-weight and qti-variable-mapping onto its item ref, and marks neither",
    () =>
      Effect.gen(function* readsWeights() {
        const document = test([
          part("P1", "linear", "individual", [
            section("S1", [
              itemRef(
                "I1",
                "items/one.xml",
                [],
                [
                  el("qti-variable-mapping", [
                    attr("source-identifier", "SCORE"),
                    attr("target-identifier", "RAW"),
                  ]),
                  el("qti-weight", [attr("identifier", "DOUBLE"), attr("value", " 2.5 ")]),
                  el("qti-weight", [attr("identifier", "NONE"), attr("value", "0")]),
                ],
              ),
              itemRef("I2", "items/two.xml"),
            ]),
          ]),
        ]);
        const built = yield* buildTest(document);
        const weighted = nodeNamed(built, "I1", "item-ref");
        const plain = nodeNamed(built, "I2", "item-ref");

        assert.deepStrictEqual(checkStructure(document, tables), []);
        assert.deepStrictEqual(built.unsupported, []);
        assert.deepStrictEqual(
          [...weighted.weights],
          [
            ["DOUBLE", 2.5],
            ["NONE", 0],
          ],
        );
        assert.deepStrictEqual([...weighted.mappings], [["RAW", "SCORE"]]);
        assert.deepStrictEqual([plain.weights.size, plain.mappings.size], [0, 0]);
      }),
  );
});

/**
 * Construct a `qti-template-default`.
 *
 * @param identifier The template variable it sets.
 * @param expression Its expression.
 * @returns The element.
 */
const templateDefault = (identifier: string, expression: SourceElement): SourceElement =>
  el("qti-template-default", [attr("template-identifier", identifier)], [expression]);

/**
 * Construct a test of one part `P1` and one section `S1` that holds two item references, `ITEM1`
 * with the given template defaults and `ITEM2`, with a float `SCORE`.
 *
 * @param defaults `ITEM1`'s template defaults, at least two.
 * @returns The document.
 */
const defaulted = (defaults: readonly SourceElement[]): SourceDocument =>
  test([
    outcome("SCORE", "float", [defaultValue("0")]),
    part("P1", "linear", "individual", [
      section("S1", [
        itemRef("ITEM1", "items/one.xml", [], defaults),
        itemRef("ITEM2", "items/two.xml"),
      ]),
    ]),
  ]);

/**
 * Give the path of one of `ITEM1`'s template defaults in a {@link defaulted} test.
 *
 * @param position Its position among them, from 1.
 * @returns The path.
 */
const defaultPath = (position: number): string =>
  `${firstPart}/qti-assessment-section/qti-assessment-item-ref[1]/qti-template-default[${String(position)}]`;

/**
 * The integer single value of an integer, as a `qti-base-value` reads.
 *
 * @param value The integer.
 * @returns The expression.
 */
const integerValue = (value: bigint) =>
  ({
    kind: "base-value",
    operands: [],
    value: {
      baseType: "integer",
      cardinality: "single",
      values: [{ baseType: "integer", value }],
    },
  }) as const;

/**
 * Give the template defaults the model read onto `ITEM1`.
 *
 * @param built The test.
 * @returns Them, in order.
 */
const defaultsOf = (built: Test): readonly TemplateDefault[] =>
  nodeNamed(built, "ITEM1", "item-ref").templateDefaults;

/**
 * The path of the `qti-assessment-section-ref` of a {@link referring} test.
 */
const sectionRefPath = `${firstPart}/qti-assessment-section-ref`;

/**
 * Construct a test of one part `P1` whose section `S1` holds one item reference and which holds a
 * `qti-assessment-section-ref` `R1` after it, with a float `SCORE`, a duration `TIME`, the given
 * further outcome declarations and outcome processing of the given rules.
 *
 * @param own The item reference's identifier.
 * @param rules The rules its `qti-outcome-processing` holds.
 * @param defaults The item reference's template defaults, none by default.
 * @param outcomes Its further outcome declarations, after `SCORE` and `TIME`, none by default.
 * @returns The document.
 */
const referring = (
  own: string,
  rules: readonly SourceChild[],
  defaults: readonly SourceElement[] = [],
  outcomes: readonly SourceElement[] = [],
): SourceDocument =>
  test([
    outcome("SCORE", "float", [defaultValue("0")]),
    outcome("TIME", "duration"),
    ...outcomes,
    part("P1", "linear", "individual", [
      section("S1", [itemRef(own, "items/one.xml", [], defaults)]),
      el("qti-assessment-section-ref", [
        attr("href", "sections/more.xml"),
        attr("identifier", "R1"),
      ]),
    ]),
    el("qti-outcome-processing", [], rules),
  ]);

/**
 * The outcomes the outcome-only kinds' rules set: a float `F` and an integer `N`.
 */
const counters: readonly SourceElement[] = [outcome("F", "float"), outcome("N", "integer")];

/**
 * Rules that aggregate over the test's items: `F` the sum of every item's `SCORE`, and `N` the
 * number of items selected.
 */
const aggregating: readonly SourceElement[] = [
  setting(
    "qti-set-outcome-value",
    "F",
    el("qti-sum", [], [el("qti-test-variables", [attr("variable-identifier", "SCORE")])]),
  ),
  setting("qti-set-outcome-value", "N", el("qti-number-selected", [])),
];

/**
 * The six outcome-only kinds {@link aggregating} does not hold, each with its required attributes
 * and the outcome a `qti-sum` of it sets.
 */
const otherOutcomeOnly: readonly (readonly [string, readonly SourceAttribute[], string])[] = [
  ["qti-number-correct", [], "N"],
  ["qti-number-incorrect", [], "N"],
  ["qti-number-presented", [], "N"],
  ["qti-number-responded", [], "N"],
  ["qti-outcome-minimum", [attr("outcome-identifier", "SCORE")], "F"],
  ["qti-outcome-maximum", [attr("outcome-identifier", "SCORE")], "F"],
];

describe("buildTest's template defaults", () => {
  it.effect(
    "[T-9] reads the template default of each qti-template-default on an item ref, in document order with its expression",
    () =>
      Effect.gen(function* readsInOrder() {
        const document = defaulted([
          templateDefault(
            "T2",
            el("qti-sum", [], [baseValue("integer", "1"), baseValue("integer", "2")]),
          ),
          templateDefault("T1", baseValue("integer", "3")),
        ]);
        const built = yield* buildTest(document);

        assert.deepStrictEqual(checkStructure(document, tables), []);
        assert.deepStrictEqual(defaultsOf(built), [
          {
            expression: { kind: "sum", operands: [integerValue(1n), integerValue(2n)] },
            templateIdentifier: "T2",
          },
          { expression: integerValue(3n), templateIdentifier: "T1" },
        ]);
        assert.deepStrictEqual(nodeNamed(built, "ITEM2", "item-ref").templateDefaults, []);
        assert.deepStrictEqual(built.unsupported, []);
      }),
  );

  it.effect(
    "[T-9] reads the template default that reads numAttempts or a section's duration as marked by its name at the default, and leaves it out",
    () =>
      Effect.gen(function* marksUnheld() {
        const document = defaulted([
          templateDefault("T1", variable("numAttempts")),
          templateDefault("T2", baseValue("integer", "2")),
          templateDefault("T3", variable("S1.duration")),
        ]);
        const built = yield* buildTest(document);

        assert.deepStrictEqual(checkStructure(document, tables), []);
        assert.deepStrictEqual(defaultsOf(built), [
          { expression: integerValue(2n), templateIdentifier: "T2" },
        ]);
        assert.deepStrictEqual(built.unsupported, [
          mark("variable:numAttempts", defaultPath(1)),
          mark("variable:S1.duration", defaultPath(3)),
        ]);
      }),
  );

  it.effect(
    "[T-9] reads the template default that reads ITEM2.T, a test outcome or the test's own duration",
    () =>
      Effect.gen(function* readsHeld() {
        const document = defaulted([
          templateDefault("T1", variable("ITEM2.T")),
          templateDefault("T2", variable("SCORE")),
          templateDefault("T3", variable("duration")),
        ]);
        const built = yield* buildTest(document);

        assert.deepStrictEqual(checkStructure(document, tables), []);
        assert.deepStrictEqual(defaultsOf(built), [
          { expression: variableRead("ITEM2.T"), templateIdentifier: "T1" },
          { expression: variableRead("SCORE"), templateIdentifier: "T2" },
          { expression: variableRead("duration"), templateIdentifier: "T3" },
        ]);
        assert.deepStrictEqual(built.unsupported, []);
      }),
  );

  it.effect(
    "[T-9] reads the template default that holds a qti-field-value of ITEM2.R, its field-identifier and its operand, with no mark",
    () =>
      Effect.gen(function* readsFieldValue() {
        const document = defaulted([
          templateDefault(
            "T1",
            el("qti-field-value", [attr("field-identifier", " F ")], [variable("ITEM2.R")]),
          ),
          templateDefault("T2", baseValue("integer", "2")),
        ]);
        const built = yield* buildTest(document);

        assert.deepStrictEqual(checkStructure(document, tables), []);
        assert.deepStrictEqual(defaultsOf(built), [
          {
            expression: {
              fieldIdentifier: "F",
              kind: "field-value",
              operands: [variableRead("ITEM2.R")],
            },
            templateIdentifier: "T1",
          },
          { expression: integerValue(2n), templateIdentifier: "T2" },
        ]);
        assert.deepStrictEqual(built.unsupported, []);
      }),
  );

  it.effect(
    "[T-9] a read through a section ref is marked: in a test that holds one, I1.SCORE and S2.duration with no own I1 or S2 are marked by name at the processing and at a template default",
    () =>
      Effect.gen(function* marksSectionRefReads() {
        const document = referring("I0", [
          setting("qti-set-outcome-value", "SCORE", variable("I1.SCORE")),
          setting("qti-set-outcome-value", "TIME", variable("S2.duration")),
        ]);
        const built = yield* buildTest(document);
        const withDefaults = referring(
          "I0",
          [setting("qti-set-outcome-value", "SCORE", baseValue("float", "1"))],
          [
            templateDefault("T1", variable("I1.SCORE")),
            templateDefault("T2", baseValue("integer", "2")),
          ],
        );
        const defaultsBuilt = yield* buildTest(withDefaults);
        const own = yield* buildTest(
          referring("I1", [setting("qti-set-outcome-value", "SCORE", variable("I1.SCORE"))]),
        );
        const unreferred = yield* buildTest(
          processed([setting("qti-set-outcome-value", "SCORE", variable("I9.SCORE"))]),
        );

        assert.deepStrictEqual(checkStructure(document, tables), []);
        assert.deepStrictEqual(checkStructure(withDefaults, tables), []);
        assert.deepStrictEqual(built.outcomeProcessing, { kind: "marked" });
        assert.deepStrictEqual(built.unsupported, [
          mark("qti-assessment-section-ref", sectionRefPath),
          mark("variable:I1.SCORE", processingPath),
          mark("variable:S2.duration", processingPath),
        ]);
        assert.deepStrictEqual(nodeNamed(defaultsBuilt, "I0", "item-ref").templateDefaults, [
          { expression: integerValue(2n), templateIdentifier: "T2" },
        ]);
        assert.deepStrictEqual(defaultsBuilt.unsupported, [
          mark(
            "variable:I1.SCORE",
            `${firstPart}/qti-assessment-section/qti-assessment-item-ref/qti-template-default[1]`,
          ),
          mark("qti-assessment-section-ref", sectionRefPath),
        ]);
        assert.strictEqual(defaultsBuilt.outcomeProcessing.kind, "runs");
        assert.strictEqual(own.outcomeProcessing.kind, "runs");
        assert.deepStrictEqual(own.unsupported, [
          mark("qti-assessment-section-ref", sectionRefPath),
        ]);
        assert.strictEqual(unreferred.outcomeProcessing.kind, "runs");
        assert.deepStrictEqual(unreferred.unsupported, []);
      }),
  );

  it.effect(
    "[T-9] an outcome-only kind beside a section ref marks the outcome processing: qti-test-variables and qti-number-selected each at its own path",
    () =>
      Effect.gen(function* marksBesideSectionRef() {
        const document = referring("I0", aggregating, [], counters);
        const built = yield* buildTest(document);

        assert.deepStrictEqual(checkStructure(document, tables), []);
        assert.deepStrictEqual(built.outcomeProcessing, { kind: "marked" });
        assert.deepStrictEqual(built.unsupported, [
          mark("qti-assessment-section-ref", sectionRefPath),
          mark(
            "qti-test-variables",
            `${processingPath}/qti-set-outcome-value[1]/qti-sum/qti-test-variables`,
          ),
          mark(
            "qti-number-selected",
            `${processingPath}/qti-set-outcome-value[2]/qti-number-selected`,
          ),
        ]);
      }),
  );

  it.effect(
    "[T-9] each other outcome-only kind beside a section ref marks the outcome processing alone, at its own path",
    () =>
      Effect.gen(function* marksEachBesideSectionRef() {
        for (const [local, attributes, target] of otherOutcomeOnly) {
          const document = referring(
            "I0",
            [setting("qti-set-outcome-value", target, el("qti-sum", [], [el(local, attributes)]))],
            [],
            counters,
          );
          const built = yield* buildTest(document);

          assert.deepStrictEqual(checkStructure(document, tables), [], local);
          assert.deepStrictEqual(built.outcomeProcessing, { kind: "marked" }, local);
          assert.deepStrictEqual(
            built.unsupported,
            [
              mark("qti-assessment-section-ref", sectionRefPath),
              mark(local, `${processingPath}/qti-set-outcome-value/qti-sum/${local}`),
            ],
            local,
          );
        }
      }),
  );

  it.effect(
    "[T-9] with no outcome-only kind beside a section ref, the same rules in a test with no section ref run, unmarked",
    () =>
      Effect.gen(function* runsWithoutSectionRef() {
        const document = processed(aggregating, counters);
        const built = yield* buildTest(document);

        assert.deepStrictEqual(checkStructure(document, tables), []);
        assert.strictEqual(built.outcomeProcessing.kind, "runs");
        assert.deepStrictEqual(built.unsupported, []);
      }),
  );

  it.effect(
    "[T-9] with no outcome-only kind beside a section ref, a read of the test's own item ref runs, with only the section ref's mark",
    () =>
      Effect.gen(function* runsOwnReadBesideSectionRef() {
        const document = referring(
          "I0",
          [setting("qti-set-outcome-value", "F", variable("I0.SCORE"))],
          [],
          counters,
        );
        const built = yield* buildTest(document);

        assert.deepStrictEqual(checkStructure(document, tables), []);
        assert.strictEqual(built.outcomeProcessing.kind, "runs");
        assert.deepStrictEqual(built.unsupported, [
          mark("qti-assessment-section-ref", sectionRefPath),
        ]);
      }),
  );
});

describe("withLtiLinks", () => {
  it.effect(
    "align-54 LTI item ref E21: leaves each item ref that names an LTI link out of the tree, a nested section's included, and marks it lti-link at its path after the test's own marks, once each; with none it gives the test back",
    () =>
      Effect.gen(function* linkedItemRefs() {
        const built = yield* buildTest(twoParts);
        const nested = `${root}/qti-test-part[1]/qti-assessment-section/qti-assessment-section/qti-assessment-item-ref`;
        const second = `${root}/qti-test-part[2]/qti-assessment-section/qti-assessment-item-ref`;
        const linked = withLtiLinks(
          built,
          [
            { identifier: "I2", path: nested },
            { identifier: "I4", path: second },
            { identifier: "I2", path: nested },
          ],
          twoParts,
        );

        assert.deepStrictEqual(
          linked.parts.map((testPart) => testPart.children.map(outline)),
          [[["S1", ["I1", ["S1a", []], "I3"]]], [["S2", []]]],
        );
        assert.deepStrictEqual(linked.unsupported, [
          ...built.unsupported,
          mark("lti-link", nested),
          mark("lti-link", second),
        ]);
        assert.deepStrictEqual(linked.outcomeProcessing, built.outcomeProcessing);
        assert.strictEqual(withLtiLinks(built, [], twoParts), built);
      }),
  );

  it.effect(
    "align-54 LOM languages E21: a test whose processing counts over its items, with an LTI ref left out, marks each outcome-only expression at its own path and the processing, as a section ref does, once each",
    () =>
      Effect.gen(function* linkedCounts() {
        const document = processed(
          [
            setting(
              "qti-set-outcome-value",
              "N",
              el("qti-sum", [], [el("qti-number-presented", [])]),
            ),
            ...aggregating,
          ],
          counters,
        );
        const built = yield* buildTest(document);
        const ref = `${root}/qti-test-part/qti-assessment-section/qti-assessment-item-ref`;
        const linked = withLtiLinks(
          {
            ...built,
            unsupported: [
              mark(
                "qti-number-selected",
                `${processingPath}/qti-set-outcome-value[3]/qti-number-selected`,
              ),
            ],
          },
          [{ identifier: "I1", path: ref }],
          document,
        );

        assert.strictEqual(built.outcomeProcessing.kind, "runs");
        assert.deepStrictEqual(linked.outcomeProcessing, { kind: "marked" });
        assert.deepStrictEqual(linked.unsupported, [
          mark(
            "qti-number-selected",
            `${processingPath}/qti-set-outcome-value[3]/qti-number-selected`,
          ),
          mark("lti-link", ref),
          mark(
            "qti-number-presented",
            `${processingPath}/qti-set-outcome-value[1]/qti-sum/qti-number-presented`,
          ),
          mark(
            "qti-test-variables",
            `${processingPath}/qti-set-outcome-value[2]/qti-sum/qti-test-variables`,
          ),
        ]);
      }),
  );

  it.effect(
    "align-54 LOM languages E21, control: a test whose processing counts over no items keeps it running when an LTI ref is left out",
    () =>
      Effect.gen(function* linkedNoCounts() {
        const document = processed([
          setting("qti-set-outcome-value", "SCORE", variable("I1.SCORE")),
        ]);
        const built = yield* buildTest(document);
        const ref = `${root}/qti-test-part/qti-assessment-section/qti-assessment-item-ref`;
        const linked = withLtiLinks(built, [{ identifier: "I1", path: ref }], document);

        assert.deepStrictEqual(linked.outcomeProcessing, built.outcomeProcessing);
        assert.deepStrictEqual(linked.unsupported, [mark("lti-link", ref)]);
      }),
  );
});

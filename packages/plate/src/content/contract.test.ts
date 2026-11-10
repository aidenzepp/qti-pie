import { assert, describe, it, vi } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { configure } from "#plate/configuration.ts";
import { catalogInfoModule } from "#plate/content/catalog-info.ts";
import { companionMaterialsModule } from "#plate/content/companion-materials.ts";
import { ContentNotImplemented } from "#plate/content/contract.ts";
import type {
  ContentModule,
  ItemContentModule,
  ItemParseContext,
  Placement,
} from "#plate/content/contract.ts";
import { feedbackBlockModule } from "#plate/content/feedback-block.ts";
import { feedbackInlineModule } from "#plate/content/feedback-inline.ts";
import { mathmlModule } from "#plate/content/mathml.ts";
import { modalFeedbackModule } from "#plate/content/modal-feedback.ts";
import { rubricModule } from "#plate/content/rubric.ts";
import { stimulusRefModule } from "#plate/content/stimulus-ref.ts";
import { stylesheetModule } from "#plate/content/stylesheet.ts";
import { attr, doc, el, mathmlNamespace, qtiNamespace, text } from "#plate/document/source.ts";
import type { SourceElement } from "#plate/document/source.ts";
import { resolveOverrides } from "#plate/emit/parts.ts";
import type { ParseContext } from "#plate/interactions/contract.ts";
import { buildItem } from "#plate/model/item.ts";
import type { Unsupported } from "#plate/model/item.ts";
import type { EmitState } from "#plate/payload.ts";
import { noSupports } from "#plate/supports.ts";

/**
 * A parse context and the features its notices named, in order.
 */
interface Recording {
  readonly context: ParseContext;
  readonly noticed: string[];
}

/**
 * An item-placed parse context and the features its marks named, in order.
 */
interface MarkRecording {
  readonly context: ItemParseContext;
  readonly marked: string[];
}

/**
 * What a stub module must declare, beside the module as this test reads it.
 */
interface Expected {
  readonly element: string;
  readonly feature: readonly string[];
  readonly namespace: string;
  readonly notice: string;
  readonly placement: Placement;
}

/**
 * One stub module as this test reads it, its node types erased.
 */
interface Stub {
  readonly expected: Expected;
  readonly module: ContentModule<string, never>;
}

/**
 * The QTI name a body walk gives a MathML `math` element's notice.
 */
const mathNotice = `{${mathmlNamespace}}math`;

/**
 * Each stub module beside what it must declare, in the brief's order.
 */
const stubs: readonly Stub[] = [
  {
    expected: {
      element: "qti-rubric-block",
      feature: ["I-11"],
      namespace: qtiNamespace,
      notice: "qti-rubric-block",
      placement: "body",
    },
    module: rubricModule,
  },
  {
    expected: {
      element: "qti-feedback-inline",
      feature: [],
      namespace: qtiNamespace,
      notice: "qti-feedback-inline",
      placement: "body",
    },
    module: feedbackInlineModule,
  },
  {
    expected: {
      element: "qti-feedback-block",
      feature: [],
      namespace: qtiNamespace,
      notice: "qti-feedback-block",
      placement: "body",
    },
    module: feedbackBlockModule,
  },
  {
    expected: {
      element: "qti-modal-feedback",
      feature: ["I-10"],
      namespace: qtiNamespace,
      notice: "qti-modal-feedback",
      placement: "item",
    },
    module: modalFeedbackModule,
  },
  {
    expected: {
      element: "qti-companion-materials-info",
      feature: ["I-13"],
      namespace: qtiNamespace,
      notice: "qti-companion-materials-info",
      placement: "item",
    },
    module: companionMaterialsModule,
  },
  {
    expected: {
      element: "qti-stylesheet",
      feature: ["I-6"],
      namespace: qtiNamespace,
      notice: "qti-stylesheet",
      placement: "item",
    },
    module: stylesheetModule,
  },
  {
    expected: {
      element: "qti-catalog-info",
      feature: ["I-14"],
      namespace: qtiNamespace,
      notice: "qti-catalog-info",
      placement: "item",
    },
    module: catalogInfoModule,
  },
  {
    expected: {
      element: "qti-assessment-stimulus-ref",
      feature: ["I-4"],
      namespace: qtiNamespace,
      notice: "qti-assessment-stimulus-ref",
      placement: "item",
    },
    module: stimulusRefModule,
  },
  {
    expected: {
      element: "math",
      feature: ["I-18"],
      namespace: mathmlNamespace,
      notice: mathNotice,
      placement: "body",
    },
    module: mathmlModule,
  },
];

/**
 * Construct a parse context that records every notice it is asked for.
 *
 * @param path The element's path.
 * @returns The context and the features its notices named.
 */
const recording = (path: string): Recording => {
  const noticed: string[] = [];

  return {
    context: {
      notice: (feature) => {
        noticed.push(feature);

        return Result.succeed({ feature, kind: "unsupported", path });
      },
      path,
    },
    noticed,
  };
};

/**
 * Construct an item-placed parse context that records every mark it is asked for.
 *
 * @param path The element's path.
 * @returns The context and the features its marks named.
 */
const markRecording = (path: string): MarkRecording => {
  const marked: string[] = [];

  return {
    context: {
      mark: (feature) => {
        marked.push(feature);

        return Result.succeed(Option.none());
      },
      path,
    },
    marked,
  };
};

/**
 * Run one step of a stub and give the element named by the {@link ContentNotImplemented} it threw.
 *
 * @param step The step.
 * @returns The element, or none when the step returned or threw anything else.
 */
const notImplementedBy = (step: () => void): Option.Option<string> => {
  const ran = Result.try({ catch: (thrown) => thrown, try: step });

  return Result.isFailure(ran) && ran.failure instanceof ContentNotImplemented
    ? Option.some(ran.failure.element)
    : Option.none();
};

/**
 * Construct an element of a stub's own name and namespace, with no attributes and no children.
 *
 * @param expected What the stub must declare.
 * @returns The element.
 */
const elementOf = (expected: Expected): SourceElement =>
  el(expected.element, [], [], expected.namespace);

describe("the stub content modules", () => {
  it("are nine, one per element", () => {
    assert.strictEqual(stubs.length, 9);
    assert.strictEqual(new Set(stubs.map(({ module }) => module.element)).size, 9);
  });

  it("declare their element, namespace, placement and Appendix A features, and are not implemented", () => {
    for (const { expected, module } of stubs) {
      assert.strictEqual(module.element, expected.element);
      assert.strictEqual(module.namespace, expected.namespace, expected.element);
      assert.strictEqual(module.placement, expected.placement, expected.element);
      assert.deepStrictEqual(module.feature, expected.feature, expected.element);
      assert.isFalse(module.implemented, expected.element);
    }
  });

  it("parse a body element as the unsupported node naming it, recorded once, as the body walk gives any element it does not read", () => {
    for (const { expected, module } of stubs) {
      if (module.placement === "body") {
        const path = `qti-assessment-item/qti-item-body/${expected.notice}`;
        const { context, noticed } = recording(path);
        const unsupported: Unsupported = { feature: expected.notice, kind: "unsupported", path };

        assert.deepStrictEqual(
          module.parse(elementOf(expected), context),
          Result.succeed(unsupported),
          expected.element,
        );
        assert.deepStrictEqual(noticed, [expected.notice], expected.element);
      }
    }
  });

  it("parse an item element as none, its mark recorded once, as the item root's walk records any element it does not read", () => {
    for (const { expected, module } of stubs) {
      if (module.placement === "item") {
        const { context, marked } = markRecording(`qti-assessment-item/${expected.element}`);

        assert.deepStrictEqual(
          module.parse(elementOf(expected), context),
          Result.succeed(Option.none()),
          expected.element,
        );
        assert.deepStrictEqual(marked, [expected.element], expected.element);
      }
    }
  });

  it.effect("throw ContentNotImplemented, naming the element, from every step past parse", () =>
    Effect.gen(function* everyStep() {
      const configuration = yield* configure({});
      const state: EmitState = {
        assetBase: "",
        headingLevel: 1,
        locale: configuration.locale,
        parts: yield* Effect.fromResult(resolveOverrides()),
      };

      for (const { expected, module } of stubs) {
        const steps: (readonly [string, () => void])[] = [
          [
            "redact",
            () => {
              // oxlint-disable-next-line anti-slop/no-reflect-apply -- a stub's model node type is never, as it has none, so no typed call can hand it one; the step throws before it reads the placeholder handed here.
              Reflect.apply(module.redact, undefined, [{}]);
            },
          ],
          [
            "render",
            () => {
              // oxlint-disable-next-line anti-slop/no-reflect-apply -- a stub's payload node type is never, as it has none, so no typed call can hand it one; the step throws before it reads the placeholder handed here.
              Reflect.apply(module.render, undefined, [{}, state, noSupports]);
            },
          ],
        ];
        const { normalise } = module;
        if (normalise !== undefined) {
          steps.push([
            "normalise",
            () => {
              normalise(elementOf(expected));
            },
          ]);
        }

        for (const [name, step] of steps) {
          assert.deepStrictEqual(
            notImplementedBy(step),
            Option.some(expected.element),
            `${expected.element} ${name}`,
          );
        }
      }
    }),
  );

  it("give the MathML stub, alone, the normalisation hook", () => {
    assert.deepStrictEqual(
      stubs
        .filter(({ module }) => module.normalise !== undefined)
        .map(({ module }) => module.element),
      ["math"],
    );
  });
});

describe("the body walk", () => {
  it.effect(
    "dispatches each body content element to its stub, which gives the notice it gave before",
    () =>
      Effect.gen(function* walkBody() {
        const body = el(
          "qti-item-body",
          [],
          [
            el("p", [], [text("Read the passage.")]),
            el(
              "qti-rubric-block",
              [attr("use", "instructions"), attr("view", "candidate")],
              [el("p", [], [text("Rubric.")])],
            ),
            el("qti-feedback-block", [
              attr("identifier", "HINT"),
              attr("outcome-identifier", "FEEDBACK"),
              attr("show-hide", "show"),
            ]),
            el(
              "p",
              [],
              [
                el("qti-feedback-inline", [
                  attr("identifier", "HINT"),
                  attr("outcome-identifier", "FEEDBACK"),
                  attr("show-hide", "show"),
                ]),
                el("math", [], [], mathmlNamespace),
              ],
            ),
          ],
        );
        const item = yield* Effect.fromResult(
          buildItem(
            doc(
              "item.xml",
              el(
                "qti-assessment-item",
                [attr("identifier", "item"), attr("title", "Item")],
                [body],
              ),
            ),
          ),
        );

        assert.deepStrictEqual(
          item.unsupported.map(({ feature, shown }) => [feature, shown]),
          [
            ["qti-rubric-block", "notice"],
            ["qti-feedback-block", "notice"],
            ["qti-feedback-inline", "notice"],
            [mathNotice, "notice"],
          ],
        );
        assert.deepStrictEqual(
          item.body.flatMap((node) => (node.kind === "unsupported" ? [node.feature] : [])),
          ["qti-rubric-block", "qti-feedback-block"],
        );
      }),
  );
});

/**
 * An item-placed stub as the item root's walk test reads it: the module, the specifier and export
 * name it is imported by, and the attributes a hand-built item gives its element.
 */
interface ItemStub {
  readonly attributes: ReturnType<typeof attr>[];
  readonly exported: string;
  readonly module: ItemContentModule<string, never>;
  readonly specifier: string;
}

/**
 * The five item-placed stubs, in the brief's order.
 */
const itemStubs: readonly ItemStub[] = [
  {
    attributes: [
      attr("identifier", "HINT"),
      attr("outcome-identifier", "FEEDBACK"),
      attr("show-hide", "show"),
    ],
    exported: "modalFeedbackModule",
    module: modalFeedbackModule,
    specifier: "#plate/content/modal-feedback.ts",
  },
  {
    attributes: [],
    exported: "companionMaterialsModule",
    module: companionMaterialsModule,
    specifier: "#plate/content/companion-materials.ts",
  },
  {
    attributes: [attr("href", "style.css"), attr("type", "text/css")],
    exported: "stylesheetModule",
    module: stylesheetModule,
    specifier: "#plate/content/stylesheet.ts",
  },
  {
    attributes: [],
    exported: "catalogInfoModule",
    module: catalogInfoModule,
    specifier: "#plate/content/catalog-info.ts",
  },
  {
    attributes: [attr("identifier", "passage"), attr("href", "passage.xml")],
    exported: "stimulusRefModule",
    module: stimulusRefModule,
    specifier: "#plate/content/stimulus-ref.ts",
  },
];

describe("the item root's walk", () => {
  for (const { attributes, exported, module, specifier } of itemStubs) {
    it.effect(
      `dispatches ${module.element} to its stub, which records the mark the walk recorded before`,
      () =>
        Effect.gen(function* walkRoot() {
          const parsed: string[] = [];
          const counting: ItemContentModule<string, never> = {
            ...module,
            parse: (source, context) => {
              parsed.push(source.local);

              return module.parse(source, context);
            },
          };
          vi.resetModules();
          vi.doMock(specifier, () => ({ [exported]: counting }));

          const model = yield* Effect.promise(() => import("#plate/model/item.ts"));
          const item = yield* Effect.fromResult(
            model.buildItem(
              doc(
                "item.xml",
                el(
                  "qti-assessment-item",
                  [attr("identifier", "item"), attr("title", "Item")],
                  [el(module.element, attributes), el("qti-item-body", [], [])],
                ),
              ),
            ),
          );

          assert.deepStrictEqual(parsed, [module.element]);
          assert.deepStrictEqual(
            item.unsupported.map(({ feature, path, shown }) => [feature, path, shown]),
            [[module.element, `qti-assessment-item/${module.element}`, "mark"]],
          );
          assert.isUndefined(item.content);
        }).pipe(
          Effect.ensuring(
            Effect.sync(() => {
              vi.doUnmock(specifier);
              vi.resetModules();
            }),
          ),
        ),
    );
  }
});

/**
 * What a fake item-placed module that lands its element reads it into: the element's name and
 * path, so the test sees which element each node came from, in which order.
 */
interface LandedNode {
  readonly element: string;
  readonly path: string;
}

describe("the item model", () => {
  for (const { attributes, exported, module, specifier } of itemStubs) {
    for (const count of [1, 2]) {
      it.effect(
        `holds the node a landed module reads from each of ${String(count)} ${module.element}, in document order, by its element`,
        () =>
          Effect.gen(function* holdNodes() {
            const landing = {
              ...module,
              parse: (
                source: SourceElement,
                context: ItemParseContext,
              ): Result.Result<Option.Option<LandedNode>> =>
                Result.succeed(Option.some({ element: source.local, path: context.path })),
            };
            vi.resetModules();
            vi.doMock(specifier, () => ({ [exported]: landing }));

            const model = yield* Effect.promise(() => import("#plate/model/item.ts"));
            const parts = Array.from({ length: count }, () => el(module.element, attributes));
            const item = yield* Effect.fromResult(
              model.buildItem(
                doc(
                  "item.xml",
                  el(
                    "qti-assessment-item",
                    [attr("identifier", "item"), attr("title", "Item")],
                    [...parts, el("qti-item-body", [], [])],
                  ),
                ),
              ),
            );
            const paths =
              count === 1
                ? [`qti-assessment-item/${module.element}`]
                : [
                    `qti-assessment-item/${module.element}[1]`,
                    `qti-assessment-item/${module.element}[2]`,
                  ];

            assert.deepStrictEqual<unknown>(item.content, {
              [module.element]: paths.map((path) => ({ element: module.element, path })),
            });
            assert.deepStrictEqual(item.unsupported, []);
          }).pipe(
            Effect.ensuring(
              Effect.sync(() => {
                vi.doUnmock(specifier);
                vi.resetModules();
              }),
            ),
          ),
      );
    }
  }
});

import { readdirSync } from "node:fs";
import { assert, describe, it, vi } from "@effect/vitest";
import { Effect, Option, Predicate, Result } from "effect";
import { configure } from "#plate/configuration.ts";
import { ContentNotImplemented, defaultView } from "#plate/content/contract.ts";
import type {
  ContentCopyKit,
  ContentFeatureId,
  ContentModule,
  ContentRedactKit,
  ContentRenderKit,
  ItemContentModule,
  ItemParseContext,
  Placement,
} from "#plate/content/contract.ts";
import {
  attr,
  doc,
  el,
  mathmlNamespace,
  qtiNamespace,
  ssmlNamespace,
  text,
} from "#plate/document/source.ts";
import type { SourceElement } from "#plate/document/source.ts";
import { resolveOverrides } from "#plate/emit/parts.ts";
import type { ParseContext } from "#plate/interactions/contract.ts";
import { buildItem, parseContextOf } from "#plate/model/item.ts";
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
 * A content module as this test reads it, its node types erased to `unknown`, so a step of one
 * that is not implemented can be handed a placeholder node it never reads.
 */
type AnyContentModule = ContentModule<string, unknown, unknown>;

/**
 * An item-placed content module as this test reads it, its node types erased.
 */
type AnyItemModule = ItemContentModule<string, unknown, unknown>;

/**
 * A content module this test found, beside the specifier and export name it is imported by, which
 * `vi.doMock` replaces it through.
 *
 * @template M The module's type.
 */
interface Found<M extends AnyContentModule = AnyContentModule> {
  readonly exported: string;
  readonly module: M;
  readonly specifier: string;
}

/**
 * What an element's module declares, whether or not it is implemented: none of it changes when the
 * module lands.
 */
interface Declared {
  readonly feature: readonly ContentFeatureId[];
  readonly namespace: string;
  /**
   * Whether the module has the normalisation hook.
   */
  readonly normalises: boolean;
  readonly placement: Placement;
}

/**
 * What each content element's module declares, by the element's local name.
 */
const declared = {
  "*": { feature: [], namespace: ssmlNamespace, normalises: false, placement: "body" },
  math: { feature: ["I-18"], namespace: mathmlNamespace, normalises: true, placement: "body" },
  "qti-assessment-stimulus-ref": {
    feature: ["I-4"],
    namespace: qtiNamespace,
    normalises: false,
    placement: "item",
  },
  "qti-catalog-info": {
    feature: ["I-14"],
    namespace: qtiNamespace,
    normalises: false,
    placement: "item",
  },
  "qti-companion-materials-info": {
    feature: ["I-13"],
    namespace: qtiNamespace,
    normalises: false,
    placement: "item",
  },
  "qti-feedback-block": {
    feature: [],
    namespace: qtiNamespace,
    normalises: false,
    placement: "body",
  },
  "qti-feedback-inline": {
    feature: [],
    namespace: qtiNamespace,
    normalises: false,
    placement: "body",
  },
  "qti-modal-feedback": {
    feature: ["I-10"],
    namespace: qtiNamespace,
    normalises: false,
    placement: "item",
  },
  "qti-rubric-block": {
    feature: ["I-11"],
    namespace: qtiNamespace,
    normalises: false,
    placement: "body",
  },
  "qti-stylesheet": {
    feature: ["I-6"],
    namespace: qtiNamespace,
    normalises: false,
    placement: "item",
  },
} satisfies Readonly<Record<string, Declared>>;

/**
 * The kit a stub's `redact` is handed here: it never reads it, as it throws first.
 */
const redactKit: ContentRedactKit = {
  nodes: (nodes) => nodes,
  record: Option.none(),
  supports: noSupports,
  view: defaultView,
  withhold: () => {},
};

/**
 * The kit a stub's `copy` is handed here: it never reads it, as it throws first.
 */
const copyKit: ContentCopyKit = { nodes: () => [] };

/**
 * The kit a stub's `render` is handed here: it never reads it, as it throws first.
 */
const renderKit: ContentRenderKit = {
  nodes: () => Result.succeed([]),
  supports: noSupports,
  view: defaultView,
};

/**
 * {@link declared}, looked up by an element's local name.
 */
const declarations = new Map(Object.entries(declared));

/**
 * Tell whether an export is a content module: an object naming its element and placement and
 * saying whether it is implemented.
 *
 * @param value The export.
 * @returns Whether it is a content module.
 */
const isContentModule = (value: unknown): value is AnyContentModule =>
  Predicate.isObject(value) &&
  Predicate.isString(value["element"]) &&
  Predicate.isBoolean(value["implemented"]) &&
  (value["placement"] === "body" || value["placement"] === "item");

/**
 * Read the content modules one file exports.
 *
 * @param file The file's name in `src/content/`.
 * @returns Each content module it exports, beside its specifier and export name.
 */
const modulesIn = async (file: string): Promise<readonly Found[]> => {
  const specifier = `#plate/content/${file}`;
  const loaded: unknown = await import(specifier);

  return Predicate.isObject(loaded)
    ? Object.entries(loaded).flatMap(([exported, value]) =>
        isContentModule(value) ? [{ exported, module: value, specifier }] : [],
      )
    : [];
};

/**
 * The content modules each file of `src/content/` beside this test exports, in file order.
 */
const foundPerFile = await Promise.all(
  readdirSync(new URL("./", import.meta.url))
    .filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts") && file !== "contract.ts")
    .toSorted()
    .map(modulesIn),
);

/**
 * Every content module, read from the files of `src/content/` beside this test, in file order: each
 * module that lands is found here as it is, so no case names one.
 */
const contentModules: readonly Found[] = foundPerFile.flat();

/**
 * The content modules that are not implemented, each a stub whose `parse` gives the notice or the
 * mark.
 */
const stubs = contentModules.filter(({ module }) => !module.implemented);

/**
 * The item-placed content modules, implemented or not.
 */
const itemModules: readonly Found<AnyItemModule>[] = contentModules.flatMap((found) =>
  found.module.placement === "item"
    ? [{ exported: found.exported, module: found.module, specifier: found.specifier }]
    : [],
);

/**
 * Give the feature the body walk's notice names for an element it does not read: its local name in
 * QTI's namespace, `{namespace}local` in another.
 *
 * @param module The element's module.
 * @returns The feature.
 */
const noticeOf = (module: AnyContentModule): string =>
  module.namespace === qtiNamespace ? module.element : `{${module.namespace}}${module.element}`;

/**
 * Construct an element of a module's own name and namespace, with no attributes and no children.
 *
 * @param module The module.
 * @returns The element.
 */
const elementOf = (module: AnyContentModule): SourceElement =>
  el(module.element, [], [], module.namespace);

/**
 * Construct the parse context the body walk hands a module for one element placed alone in an
 * item body, its notice recording every feature it is asked for.
 *
 * @param element The element.
 * @returns The context and the features its notices named.
 */
const recording = (element: SourceElement): Recording => {
  const noticed: string[] = [];
  const { context } = parseContextOf(
    doc(
      "items/test.xml",
      el(
        "qti-assessment-item",
        [attr("identifier", "item"), attr("title", "Item")],
        [el("qti-item-body", [], [element])],
      ),
    ),
    element,
  );

  return {
    context: {
      ...context,
      notice: (feature) => {
        noticed.push(feature);

        return Result.succeed({ feature, kind: "unsupported", path: context.path });
      },
    },
    noticed,
  };
};

/**
 * Construct the item-placed parse context the item root's walk hands a module for one element
 * placed under the root of an item with an empty body, its mark recording every feature it is asked
 * for: the path and the reader kit are the walk's own, over that document.
 *
 * @param module The element's module.
 * @returns The context and the features its marks named.
 */
const markRecording = (module: AnyContentModule): MarkRecording => {
  const marked: string[] = [];
  const element = elementOf(module);
  const { context } = parseContextOf(
    doc(
      "items/test.xml",
      el(
        "qti-assessment-item",
        [attr("identifier", "item"), attr("title", "Item")],
        [element, el("qti-item-body", [], [])],
      ),
    ),
    element,
  );

  return {
    context: {
      catalogReferences: [],
      mark: (feature) => {
        marked.push(feature);

        return Result.succeed(Option.none());
      },
      path: context.path,
      read: context.read,
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

describe("the content modules", () => {
  it("are ten, one per element, each declared", () => {
    const elements = contentModules.map(({ module }) => module.element);

    assert.strictEqual(contentModules.length, 10);
    assert.strictEqual(new Set(elements).size, 10);
    assert.deepStrictEqual(elements.toSorted(), Object.keys(declared).toSorted());
  });

  it("declare their namespace, placement, Appendix A features and normalisation hook", () => {
    for (const { module } of contentModules) {
      const expected = declarations.get(module.element);

      assert.isDefined(expected, module.element);
      assert.strictEqual(module.namespace, expected?.namespace, module.element);
      assert.strictEqual(module.placement, expected?.placement, module.element);
      assert.deepStrictEqual(module.feature, expected?.feature, module.element);
      assert.strictEqual(module.normalise !== undefined, expected?.normalises, module.element);
    }
  });
});

describe("a content module not implemented", () => {
  it("parses a body element as the unsupported node naming it, recorded once, as the body walk gives any element it does not read", () => {
    for (const { module } of stubs) {
      if (module.placement === "body") {
        const notice = noticeOf(module);
        const path = `qti-assessment-item/qti-item-body/${notice}`;
        const element = elementOf(module);
        const { context, noticed } = recording(element);
        const unsupported: Unsupported = { feature: notice, kind: "unsupported", path };

        assert.strictEqual(context.path, path, module.element);
        assert.deepStrictEqual(
          module.parse(element, context),
          Result.succeed(unsupported),
          module.element,
        );
        assert.deepStrictEqual(noticed, [notice], module.element);
      }
    }
  });

  it("parses an item element as none, its mark recorded once, as the item root's walk records any element it does not read", () => {
    for (const { module } of stubs) {
      if (module.placement === "item") {
        const { context, marked } = markRecording(module);

        assert.strictEqual(context.path, `qti-assessment-item/${module.element}`, module.element);
        assert.deepStrictEqual(
          module.parse(elementOf(module), context),
          Result.succeed(Option.none()),
          module.element,
        );
        assert.deepStrictEqual(marked, [module.element], module.element);
      }
    }
  });

  it("gives the element as written from normalise, which the walks call before parse", () => {
    for (const { module } of stubs) {
      const { normalise } = module;
      if (normalise !== undefined) {
        const element = elementOf(module);

        assert.strictEqual(normalise(element), element, module.element);
      }
    }
  });

  it.effect("throws ContentNotImplemented, naming the element, from every step past parse", () =>
    Effect.gen(function* everyStep() {
      const configuration = yield* configure({});
      const state: EmitState = {
        assetBase: "",
        headingLevel: 1,
        locale: configuration.locale,
        parts: yield* Effect.fromResult(resolveOverrides()),
      };

      for (const { module } of stubs) {
        const steps: (readonly [string, () => void])[] = [
          [
            "redact",
            () => {
              module.redact({}, redactKit);
            },
          ],
          [
            "copy",
            () => {
              module.copy({}, copyKit);
            },
          ],
          [
            "render",
            () => {
              module.render({}, state, renderKit);
            },
          ],
        ];
        for (const [name, step] of steps) {
          assert.deepStrictEqual(
            notImplementedBy(step),
            Option.some(module.element),
            `${module.element} ${name}`,
          );
        }
      }
    }),
  );
});

describe("the body walk", () => {
  it.effect(
    "dispatches each body element of a module not implemented to that module, which gives the notice it gave before, in the body or in a paragraph",
    () =>
      Effect.gen(function* walkBody() {
        const placed = stubs.flatMap(({ module }) => (module.placement === "body" ? [module] : []));
        const elements = (): SourceElement[] => placed.map(elementOf);
        const notices = placed.map(noticeOf);
        const body = el(
          "qti-item-body",
          [],
          [el("p", [], [text("Read the passage.")]), ...elements(), el("p", [], elements())],
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
          [...notices, ...notices].map((notice) => [notice, "notice"]),
        );
        assert.deepStrictEqual(
          item.body.flatMap((node) => (node.kind === "unsupported" ? [node.feature] : [])),
          notices,
        );
      }),
  );
});

describe("the item root's walk", () => {
  for (const { exported, module, specifier } of itemModules) {
    if (!module.implemented) {
      it.effect(
        `dispatches ${module.element}, whose module is not implemented, to that module, which records the mark the walk recorded before`,
        () =>
          Effect.gen(function* walkRoot() {
            const parsed: string[] = [];
            const counting: AnyItemModule = {
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
                    [el(module.element, []), el("qti-item-body", [], [])],
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
  for (const { exported, module, specifier } of itemModules) {
    for (const count of [1, 2]) {
      it.effect(
        `holds the node a landed module reads from each of ${String(count)} ${module.element}, in document order, by its element`,
        () =>
          Effect.gen(function* holdNodes() {
            const landing: AnyItemModule = {
              ...module,
              parse: (source, context): Result.Result<Option.Option<LandedNode>> =>
                Result.succeed(Option.some({ element: source.local, path: context.path })),
            };
            vi.resetModules();
            vi.doMock(specifier, () => ({ [exported]: landing }));

            const model = yield* Effect.promise(() => import("#plate/model/item.ts"));
            const parts = Array.from({ length: count }, () => el(module.element, []));
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

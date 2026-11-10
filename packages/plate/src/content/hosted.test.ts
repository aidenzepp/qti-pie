import { assert, describe, it, vi } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import type { RedactedJson } from "#plate/codec/redacted.ts";
import { configure } from "#plate/configuration.ts";
import { catalogInfoModule } from "#plate/content/catalog-info.ts";
import { ContentNotImplemented, defaultView } from "#plate/content/contract.ts";
import type {
  BodyContentModule,
  CatalogReference,
  ContentNodeOf,
  ItemContentModule,
} from "#plate/content/contract.ts";
import { bodyModules, itemModules } from "#plate/content/modules.ts";
import { mathmlModule } from "#plate/content/mathml.ts";
import type {
  BodyContentNodeIn,
  BodyTable,
  ItemNodesIn,
  ItemTable,
} from "#plate/content/modules.ts";
import { presenters } from "#plate/content/presenters/table.ts";
import type { Presenters } from "#plate/content/presenters/table.ts";
import { ssmlModule } from "#plate/content/ssml.ts";
import {
  attr,
  doc,
  el,
  mathmlNamespace,
  qtiNamespace,
  ssmlNamespace,
  text,
} from "#plate/document/source.ts";
import type { SourceDocument } from "#plate/document/source.ts";
import { h } from "#plate/emit/node.ts";
import type { BodyNode } from "#plate/model/item.ts";
import type { PayloadNode } from "#plate/payload.ts";
import { catalogSupports, noSupports } from "#plate/supports.ts";
import type { Supports } from "#plate/supports.ts";
import { tables } from "#plate/validate/tables.ts";

/**
 * Whether two types are identical, by the conditional-type identity check: `true` when they are,
 * `false` otherwise.
 *
 * @template A One type.
 * @template B The other.
 */
type Equals<A, B> =
  // oxlint-disable-next-line typescript/no-unnecessary-type-parameters -- each `T` must stay an unresolved type parameter inside its function type, so the conditional compares `A` and `B` by identity rather than by assignability.
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

/**
 * The model node of {@link landedRubric}: the block's content, its `use`, the views it names, and
 * how many catalog supports the redaction ran under, 0 as parsed.
 */
interface LandedRubric {
  readonly content: readonly BodyNode[];
  readonly supports: number;
  readonly use: string;
  readonly views: readonly string[];
}

/**
 * The payload node of {@link landedRubric}: its content copied, its `use` and the supports count.
 */
interface LandedRubricPayload {
  readonly nodes: readonly PayloadNode[];
  readonly supports: number;
  readonly use: string;
}

/**
 * The JSON form of {@link LandedRubric}.
 */
interface LandedRubricJson {
  readonly content: RedactedJson["body"];
  readonly supports: number;
  readonly use: string;
  readonly views: readonly string[];
}

/**
 * A Rubric Block module as one that has landed would be: implemented, with its own model node,
 * payload node and JSON form, parsing through the reader kit, keeping its block for the views it
 * names, and rendering through the render kit. The tests register it in place of the stub.
 */
const landedRubric: BodyContentModule<
  "qti-rubric-block",
  LandedRubric,
  LandedRubricPayload,
  LandedRubricJson
> = {
  content: (payload) => payload.nodes,
  copy: (node, kit) => ({ nodes: kit.nodes(node.content), supports: node.supports, use: node.use }),
  element: "qti-rubric-block",
  feature: ["I-11"],
  implemented: true,
  namespace: qtiNamespace,
  parse: (element, context) =>
    Result.gen(function* parseRubric() {
      const use = yield* context.read.requiredValue(element, "use");
      const view = yield* context.read.requiredValue(element, "view");
      const content = yield* context.read.nodes(element);
      context.read.markElement(element);

      return { content, supports: 0, use, views: view.split(" ") };
    }),
  payloadSchema: ({ BodyNodes, Schema }) =>
    Schema.Struct({
      content: BodyNodes,
      supports: Schema.Number,
      use: Schema.String,
      views: Schema.Array(Schema.String),
    }),
  placement: "body",
  redact: (node, kit) => {
    if (node.views.includes(kit.view)) {
      return Option.some({
        ...node,
        content: kit.nodes(node.content),
        supports: kit.supports.catalog.size,
      });
    }

    kit.withhold(node.content);

    return Option.none();
  },
  render: (payload, state, kit) =>
    Result.map(kit.nodes(payload.nodes), (nodes) =>
      h(
        "div",
        {
          "data-heading": String(state.headingLevel),
          "data-supports": String(payload.supports),
          "data-use": payload.use,
          "data-view": kit.view,
        },
        nodes,
      ),
    ),
};

/**
 * The model node of {@link landedModal}: the feedback's content and the outcome it names.
 */
interface LandedModal {
  readonly content: readonly BodyNode[];
  readonly outcome: string;
}

/**
 * The payload node of {@link landedModal}.
 */
interface LandedModalPayload {
  readonly nodes: readonly PayloadNode[];
  readonly outcome: string;
}

/**
 * The JSON form of {@link LandedModal}.
 */
interface LandedModalJson {
  readonly content: RedactedJson["body"];
  readonly outcome: string;
}

/**
 * A Modal Feedback module as one that has landed would be: item-placed, parsing its content through
 * the reader kit the item root's walk hands it, dropped for the scorer's view.
 */
const landedModal: ItemContentModule<
  "qti-modal-feedback",
  LandedModal,
  LandedModalPayload,
  LandedModalJson
> = {
  content: (payload) => payload.nodes,
  copy: (node, kit) => ({ nodes: kit.nodes(node.content), outcome: node.outcome }),
  element: "qti-modal-feedback",
  feature: ["I-10"],
  implemented: true,
  namespace: qtiNamespace,
  parse: (element, context) =>
    Result.map(context.read.nodes(element), (content) =>
      Option.some({
        content,
        outcome: Option.getOrElse(context.read.valueOf(element, "outcome-identifier"), () => ""),
      }),
    ),
  payloadSchema: ({ BodyNodes, Schema }) =>
    Schema.Struct({ content: BodyNodes, outcome: Schema.String }),
  placement: "item",
  redact: (node, kit) => {
    if (kit.view === "scorer") {
      kit.withhold(node.content);

      return Option.none();
    }

    return Option.some({ ...node, content: kit.nodes(node.content) });
  },
  render: (payload, _state, kit) =>
    Result.map(kit.nodes(payload.nodes), (nodes) =>
      h("dialog", { "data-outcome": payload.outcome }, nodes),
    ),
};

/**
 * The model node of {@link landedCatalog}: the body's catalog references, as the item root's walk
 * hands them.
 */
interface LandedCatalog {
  readonly references: readonly CatalogReference[];
}

/**
 * A Catalog Resources module as one that has landed would be: it reads the body's references from
 * its context, keeps its node only when the host enabled a catalog support, and holds the presenter
 * table.
 */
const landedCatalog: ItemContentModule<
  "qti-catalog-info",
  LandedCatalog,
  LandedCatalog,
  LandedCatalog
> & { readonly presenters: Presenters } = {
  content: () => [],
  copy: (node) => node,
  element: "qti-catalog-info",
  feature: ["I-14"],
  implemented: true,
  namespace: qtiNamespace,
  parse: (_element, context) =>
    Result.succeed(Option.some({ references: context.catalogReferences })),
  payloadSchema: ({ Schema }) =>
    Schema.Struct({
      references: Schema.Array(Schema.Struct({ idref: Schema.String, path: Schema.String })),
    }),
  placement: "item",
  presenters,
  redact: (node, kit) => (kit.supports.catalog.size > 0 ? Option.some(node) : Option.none()),
  render: (payload) =>
    Result.succeed(
      h("ul", { "data-catalog": payload.references.map(({ idref }) => idref).join(" ") }, []),
    ),
};

/**
 * The body-placed table with {@link landedRubric} in place of the Rubric Block stub: what the hubs
 * would read, so `tsc` types the landed module against them here.
 */
const landedBody = { ...bodyModules, "qti-rubric-block": landedRubric } satisfies BodyTable;

/**
 * The item-placed table with {@link landedModal} and {@link landedCatalog} in place of their stubs.
 */
const landedItem = {
  ...itemModules,
  "qti-catalog-info": landedCatalog,
  "qti-modal-feedback": landedModal,
} satisfies ItemTable;

/**
 * The body's content member derived from the landed table holds the landed rubric's node at its
 * element.
 */
const rubricDerived: Equals<
  Extract<BodyContentNodeIn<typeof landedBody>, { readonly element: "qti-rubric-block" }>,
  ContentNodeOf<"qti-rubric-block", LandedRubric>
> = true;

/**
 * The item content derived from the landed table holds the landed modal's nodes under its element.
 */
const modalDerived: Equals<
  NonNullable<ItemNodesIn<typeof landedItem>["qti-modal-feedback"]>,
  readonly LandedModal[]
> = true;

/**
 * One module registered in place of a stub: the stub's specifier, and the exports to load in its
 * place.
 */
interface Mock {
  readonly exports: object;
  readonly specifier: string;
}

/**
 * What each test registers in place of the stubs: the three landed modules.
 */
const landed: readonly Mock[] = [
  { exports: { catalogInfoModule: landedCatalog }, specifier: "#plate/content/catalog-info.ts" },
  { exports: { modalFeedbackModule: landedModal }, specifier: "#plate/content/modal-feedback.ts" },
  { exports: { rubricModule: landedRubric }, specifier: "#plate/content/rubric.ts" },
];

/**
 * Run an effect with modules registered in place of stubs, every module that imports them loaded
 * afresh, and the stubs restored after.
 *
 * @param effect The effect, which imports what it reads of plate dynamically, after the mocks.
 * @param mocks What to register; the three landed modules by default.
 * @returns The effect, wrapped.
 */
const withLanded = <A, E>(
  effect: Effect.Effect<A, E>,
  mocks: readonly Mock[] = landed,
): Effect.Effect<A, E> =>
  Effect.sync(() => {
    vi.resetModules();
    for (const { exports, specifier } of mocks) {
      vi.doMock(specifier, () => exports);
    }
  }).pipe(
    Effect.andThen(effect),
    Effect.ensuring(
      Effect.sync(() => {
        for (const { specifier } of mocks) {
          vi.doUnmock(specifier);
        }

        vi.resetModules();
      }),
    ),
  );

/**
 * The item the landed modules read: two rubric blocks, one for the candidate and one for the
 * scorer, a paragraph referencing a catalog, a modal feedback and a catalog.
 */
const landedDocument: SourceDocument = doc(
  "items/landed.xml",
  el(
    "qti-assessment-item",
    [attr("identifier", "landed"), attr("title", "Landed")],
    [
      el("qti-outcome-declaration", [
        attr("identifier", "FEEDBACK"),
        attr("cardinality", "single"),
        attr("base-type", "identifier"),
      ]),
      el(
        "qti-item-body",
        [],
        [
          el(
            "qti-rubric-block",
            [attr("use", "instructions"), attr("view", "candidate")],
            [el("p", [], [text("Read "), el("em", [], [text("carefully")]), text(".")])],
          ),
          el(
            "qti-rubric-block",
            [attr("use", "scoring"), attr("view", "scorer")],
            [el("p", [], [text("Award one mark.")])],
          ),
          el("p", [attr("data-catalog-idref", "cat1")], [text("The passage.")]),
        ],
      ),
      el(
        "qti-modal-feedback",
        [
          attr("identifier", "correct"),
          attr("outcome-identifier", "FEEDBACK"),
          attr("show-hide", "show"),
        ],
        [el("p", [], [text("Well done.")])],
      ),
      el("qti-catalog-info", [], [el("qti-catalog", [attr("id", "cat1")])]),
    ],
  ),
);

/**
 * The supports with one catalog support enabled.
 */
const glossary: Supports = { ...noSupports, catalog: new Set(["glossary-on-screen"]) };

/**
 * Construct a text node of the model.
 *
 * @param value The text.
 * @returns The node.
 */
const textNode = (value: string): BodyNode => ({ kind: "text", text: value });

/**
 * Construct a paragraph of the model holding the given children, with no attributes.
 *
 * @param path The paragraph's path.
 * @param children Its children.
 * @returns The node.
 */
const paragraph = (path: string, children: readonly BodyNode[]): BodyNode => ({
  attributes: [],
  children,
  kind: "element",
  path,
  tag: "p",
});

/**
 * The body path of the landed item.
 */
const bodyPath = "qti-assessment-item/qti-item-body";

/**
 * The candidate's rubric as the body walk reads it.
 */
const candidateRubric = (path: string): ContentNodeOf<"qti-rubric-block", LandedRubric> => ({
  element: "qti-rubric-block",
  kind: "content",
  node: {
    content: [
      paragraph(`${path}/p`, [
        textNode("Read "),
        {
          attributes: [],
          children: [textNode("carefully")],
          kind: "element",
          path: `${path}/p/em`,
          tag: "em",
        },
        textNode("."),
      ]),
    ],
    supports: 0,
    use: "instructions",
    views: ["candidate"],
  },
  path,
});

/**
 * The scorer's rubric as the body walk reads it.
 */
const scorerRubric = (path: string): ContentNodeOf<"qti-rubric-block", LandedRubric> => ({
  element: "qti-rubric-block",
  kind: "content",
  node: {
    content: [paragraph(`${path}/p`, [textNode("Award one mark.")])],
    supports: 0,
    use: "scoring",
    views: ["scorer"],
  },
  path,
});

/**
 * Blank the paths of an element and of every element below it, as the codec decodes them.
 *
 * @param node The node.
 * @returns The node with every path `""`.
 */
const blankPaths = (node: BodyNode): BodyNode =>
  node.kind === "element" ? { ...node, children: node.children.map(blankPaths), path: "" } : node;

/**
 * A rubric as the codec decodes it: every path blank, the supports count as the redaction set it.
 *
 * @param rubric The rubric as the body walk read it.
 * @param supports The supports count the redaction set.
 * @returns The rubric decoded.
 */
const decodedRubric = (
  rubric: ContentNodeOf<"qti-rubric-block", LandedRubric>,
  supports: number,
): ContentNodeOf<"qti-rubric-block", LandedRubric> => ({
  ...rubric,
  node: { ...rubric.node, content: rubric.node.content.map(blankPaths), supports },
  path: "",
});

/**
 * The referencing paragraph as the body walk reads it: its `data-catalog-idref` is a marked
 * attribute, so the model drops it, and the reference reaches the catalog module, while the
 * element keeps the idref as its `catalog` key.
 */
const referencing = (path: string): BodyNode => ({
  attributes: [],
  // The attachment hook keys a catalog presenter by the idref the author wrote.
  catalog: "cat1",
  children: [textNode("The passage.")],
  kind: "element",
  path,
  tag: "p",
});

describe("a content module that lands", () => {
  it("types its own nodes into the hubs through the module tables", () => {
    assert.isTrue(rubricDerived);
    assert.isTrue(modalDerived);
  });

  it.effect(
    "parses its element through the reader kit, a body-placed one into the body at its path and an item-placed one into the item content, the catalog references reaching the catalog module",
    () =>
      withLanded(
        Effect.gen(function* parsed() {
          const model = yield* Effect.promise(() => import("#plate/model/item.ts"));
          const built = yield* Effect.fromResult(model.buildItem(landedDocument));

          assert.deepStrictEqual<unknown>(built.body, [
            candidateRubric(`${bodyPath}/qti-rubric-block[1]`),
            scorerRubric(`${bodyPath}/qti-rubric-block[2]`),
            referencing(`${bodyPath}/p`),
          ]);
          assert.deepStrictEqual<unknown>(built.content, {
            "qti-catalog-info": [{ references: [{ idref: "cat1", path: `${bodyPath}/p` }] }],
            "qti-modal-feedback": [
              {
                content: [
                  paragraph("qti-assessment-item/qti-modal-feedback/p", [textNode("Well done.")]),
                ],
                outcome: "FEEDBACK",
              },
            ],
          });
          assert.deepStrictEqual(
            built.unsupported.filter(({ feature }) => feature.startsWith("qti-")),
            [],
          );
        }),
      ),
  );

  it.effect(
    "redacts through its own redact, which sees the supports and the view: the candidate keeps the candidate's rubric, the modal and the catalog, and the scorer keeps the scorer's rubric alone",
    () =>
      withLanded(
        Effect.gen(function* redacted() {
          const model = yield* Effect.promise(() => import("#plate/model/item.ts"));
          const payload = yield* Effect.promise(() => import("#plate/payload.ts"));
          const built = yield* Effect.fromResult(model.buildItem(landedDocument));
          const candidate = payload.redactItem(built, undefined, undefined, glossary);
          const scorer = payload.redactItem(built, undefined, undefined, noSupports, "scorer");
          const kept = candidateRubric(`${bodyPath}/qti-rubric-block[1]`);

          assert.deepStrictEqual<unknown>(candidate.body, [
            { ...kept, node: { ...kept.node, supports: 1 } },
            referencing(`${bodyPath}/p`),
          ]);
          assert.deepStrictEqual<unknown>(candidate.content, built.content);
          assert.deepStrictEqual(candidate.notices, []);
          assert.deepStrictEqual<unknown>(scorer.body, [
            scorerRubric(`${bodyPath}/qti-rubric-block[2]`),
            referencing(`${bodyPath}/p`),
          ]);
          assert.isFalse("content" in scorer);
        }),
      ),
  );

  it.effect(
    "carries its nodes through the codec: the redacted item encodes, survives a JSON round trip and decodes to the same item with every path blank",
    () =>
      withLanded(
        Effect.gen(function* coded() {
          const model = yield* Effect.promise(() => import("#plate/model/item.ts"));
          const payload = yield* Effect.promise(() => import("#plate/payload.ts"));
          const codec = yield* Effect.promise(() => import("#plate/codec/redacted.ts"));
          const built = yield* Effect.fromResult(model.buildItem(landedDocument));
          const redactedItem = payload.redactItem(built, undefined, undefined, glossary);
          const json = yield* Effect.fromResult(codec.encodeRedacted(redactedItem));
          const decoded = yield* Effect.fromResult(codec.decodeRedacted(structuredClone(json)));
          assert.isTrue(payload.isRedacted(decoded));
          assert.deepStrictEqual<unknown>(decoded.body, [
            decodedRubric(candidateRubric(`/qti-rubric-block[1]`), 1),
            referencing(""),
          ]);
          assert.deepStrictEqual<unknown>(decoded.content, {
            "qti-catalog-info": [{ references: [{ idref: "cat1", path: `${bodyPath}/p` }] }],
            "qti-modal-feedback": [
              { content: [paragraph("", [textNode("Well done.")])], outcome: "FEEDBACK" },
            ],
          });
          assert.deepStrictEqual(
            codec.encodeRedacted(decoded).pipe(Result.map((again) => again)),
            Result.succeed(json),
          );
        }),
      ),
  );

  it.effect(
    "renders through its own render with the supports and the view the host passed, its content through the kit, and the item-placed nodes after the body and before the Live part",
    () =>
      withLanded(
        Effect.gen(function* rendered() {
          const model = yield* Effect.promise(() => import("#plate/model/item.ts"));
          const payload = yield* Effect.promise(() => import("#plate/payload.ts"));
          const plate = yield* Effect.promise(() => import("#plate/render.ts"));
          const configuration = yield* configure({});
          const built = yield* Effect.fromResult(model.buildItem(landedDocument));
          const candidate = yield* Effect.fromResult(
            plate.render(payload.redactItem(built, undefined, undefined, glossary), configuration, {
              instance: "q1",
              supports: glossary,
            }),
          );
          const scorer = yield* Effect.fromResult(
            plate.render(
              payload.redactItem(built, undefined, undefined, noSupports, "scorer"),
              configuration,
              { instance: "q1", view: "scorer" },
            ),
          );

          assert.include(
            candidate.html,
            '<div data-heading="2" data-supports="1" data-use="instructions" data-view="candidate"><p>Read <em>carefully</em>.</p></div>',
          );
          assert.include(
            candidate.html,
            '<ul data-catalog="cat1"></ul><dialog data-outcome="FEEDBACK"><p>Well done.</p></dialog>',
          );
          assert.isBelow(candidate.html.indexOf("The passage."), candidate.html.indexOf("<ul"));
          assert.isBelow(candidate.html.indexOf("<dialog"), candidate.html.indexOf("item-live"));
          assert.notInclude(candidate.html, "Award one mark.");
          assert.include(
            scorer.html,
            '<div data-heading="2" data-supports="0" data-use="scoring" data-view="scorer"><p>Award one mark.</p></div>',
          );
          assert.notInclude(scorer.html, "<dialog");
          assert.notInclude(scorer.html, "Read ");
        }),
      ),
  );
});

/**
 * An item whose body holds one island of a namespace outside QTI's.
 *
 * @param island The island's outermost element.
 * @returns The document.
 */
const withIsland = (island: ReturnType<typeof el>): SourceDocument =>
  doc(
    "items/island.xml",
    el(
      "qti-assessment-item",
      [attr("identifier", "island"), attr("time-dependent", "false"), attr("title", "Island")],
      [el("qti-item-body", [], [el("p", [], [text("Solve "), island])])],
    ),
  );

describe("the verdict's islands", () => {
  for (const { exported, local, name, namespace, reason, specifier, stub } of [
    {
      exported: "mathmlModule",
      local: "math",
      name: "MathML",
      namespace: mathmlNamespace,
      reason: "mathml",
      specifier: "#plate/content/mathml.ts",
      stub: mathmlModule,
    },
    {
      exported: "ssmlModule",
      local: "speak",
      name: "SSML",
      namespace: ssmlNamespace,
      reason: "ssml",
      specifier: "#plate/content/ssml.ts",
      stub: ssmlModule,
    },
  ] as const) {
    it.effect(
      `reach the ${name} module's check: the stub leaves the document unchecked with the reason ${reason}, and a module that judges the island lets the verdict build the item`,
      () =>
        Effect.gen(function* islands() {
          const island = el(local, [], [el("mi", [], [text("x")], namespace)], namespace);
          const path = `qti-assessment-item/qti-item-body/p/{${namespace}}${local}`;
          const stubbed = yield* Effect.promise(() => import("#plate/validate/verdict.ts"));
          const before = stubbed.check(withIsland(island), tables, Option.none());

          assert.strictEqual(before.verdict, "unchecked");
          if (before.verdict === "unchecked") {
            assert.deepStrictEqual(before.reasons, [{ path, reason }]);
          }

          const judging = { ...stub, check: () => [] };
          const after = yield* withLanded(
            Effect.gen(function* judged() {
              const verdict = yield* Effect.promise(() => import("#plate/validate/verdict.ts"));

              return verdict.check(withIsland(island), tables, Option.none());
            }),
            [{ exports: { [exported]: judging }, specifier }],
          );

          assert.strictEqual(after.verdict, "accepted-with-unsupported");
          if (after.verdict === "accepted-with-unsupported" && after.kind === "item") {
            assert.deepStrictEqual(after.accepted.item.unsupported, [
              { feature: `{${namespace}}${local}`, path, shown: "notice" },
            ]);
          }
        }),
    );
  }
});

describe("the item Root's hook", () => {
  it.effect(
    "adds the attributes the hook gives for the supports and the view, and never replaces the chrome's own",
    () =>
      withLanded(
        Effect.gen(function* hooked() {
          const model = yield* Effect.promise(() => import("#plate/model/item.ts"));
          const payload = yield* Effect.promise(() => import("#plate/payload.ts"));
          const plate = yield* Effect.promise(() => import("#plate/render.ts"));
          const configuration = yield* configure({});
          const built = yield* Effect.fromResult(
            model.buildItem(
              doc(
                "items/plain.xml",
                el(
                  "qti-assessment-item",
                  [attr("identifier", "plain"), attr("title", "Plain")],
                  [el("qti-item-body", [], [el("p", [], [text("Hello.")])])],
                ),
              ),
            ),
          );
          const { html } = yield* Effect.fromResult(
            plate.render(payload.redactItem(built), configuration, { instance: "q1" }),
          );

          assert.match(html, /^<qti-assessment-item [^>]*data-zoom="2"/u);
          assert.match(html, /^<qti-assessment-item [^>]*data-view="candidate"/u);
          assert.match(html, /^<qti-assessment-item [^>]*lang="en"/u);
          assert.notInclude(html, 'lang="xx"');
        }),
        [
          {
            exports: {
              rootHook: {
                attributes: (state: { readonly view?: string }) => ({
                  "data-view": state.view ?? "none",
                  "data-zoom": "2",
                  lang: "xx",
                }),
                implemented: true,
              },
            },
            specifier: "#plate/content/root.ts",
          },
        ],
      ),
  );
});

describe("the catalog presenters", () => {
  it("are one stub per predefined catalog support, each naming its support, which the catalog module holds", () => {
    assert.deepStrictEqual(Object.keys(presenters).toSorted(), [...catalogSupports].toSorted());
    assert.strictEqual(catalogInfoModule.presenters, presenters);
    for (const support of catalogSupports) {
      const presenter = presenters[support];

      assert.strictEqual(presenter.support, support);
      assert.isFalse(presenter.implemented);

      const ran = Result.try({
        catch: (thrown) => thrown,
        try: () =>
          presenter.present(
            // SAFETY: a stub's `present` throws before it reads the card, whose type is `never`.
            // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The SAFETY note above.
            undefined as never,
            {
              assetBase: "",
              headingLevel: 1,
              locale: "en",
              parts: { replacementFor: () => Option.none() },
            },
            { nodes: () => Result.succeed([]), supports: noSupports, view: defaultView },
          ),
      });

      assert.isTrue(
        Result.isFailure(ran) &&
          ran.failure instanceof ContentNotImplemented &&
          ran.failure.element === support,
        support,
      );
    }
  });
});

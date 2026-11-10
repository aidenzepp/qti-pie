import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { configure } from "#plate/configuration.ts";
import { qtiNamespace } from "#plate/document/source.ts";
import { h } from "#plate/emit/node.ts";
import type { Element, Node } from "#plate/emit/node.ts";
import { scopedId } from "#plate/emit/parts.ts";
import type { BodyNode, PrintedVariable, TextEntryInteraction } from "#plate/model/item.ts";
import { redact, render as renderItem } from "#plate/render.ts";
import { renderTestContent } from "#plate/session/content.ts";
import type { TestSession } from "#plate/session/session.ts";
import { current, itemViews, startTest } from "#plate/session/start.ts";
import type { ItemView, TestSummary } from "#plate/session/start.ts";
import { noSupports } from "#plate/supports.ts";
import { stub } from "#plate/test-features/contract.ts";
import type {
  PresentContext,
  TestContent,
  TestContentRenderKit,
  TestFeatureModule,
} from "#plate/test-features/contract.ts";
import { testFeatures } from "#plate/test-features/table.ts";
import type { TestFeatureTable } from "#plate/test-features/table.ts";
import { parseHtml } from "#plate/test/round-trip.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";
import type { Accepted, AcceptedTest } from "#plate/validate/verdict.ts";

/**
 * The node the fake feedback module presents: the body nodes it renders.
 */
interface FeedbackNode {
  readonly nodes: readonly BodyNode[];
}

/**
 * Build a feedback module as it would land, for this test alone: it presents what a function
 * decides for each place, and renders each node as a `section` holding the kit's emission of the
 * node's body nodes.
 *
 * @param present What the module presents at a place.
 * @param record What the module does with the kit its `render` is handed, none by default.
 * @returns The module.
 */
const feedbackModule = (
  present: (context: PresentContext) => readonly FeedbackNode[],
  record?: (kit: TestContentRenderKit) => void,
): TestFeatureModule<"qti-test-feedback", FeedbackNode> => ({
  ...stub({
    element: "qti-test-feedback",
    feature: ["T-8"],
    issue: "m5-04",
    key: "qti-test-feedback",
    namespace: qtiNamespace,
  }),
  implemented: true,
  present,
  render: (node, _state, kit) => {
    record?.(kit);

    return Result.map(kit.nodes(node.nodes), (nodes) => h("section", {}, nodes));
  },
});

/**
 * Build the table of stubs with a module in its own stub's place, whatever the default table holds.
 *
 * @param module The module.
 * @returns The table.
 */
const tableWith = (
  module: TestFeatureModule<"qti-test-feedback", FeedbackNode>,
): TestFeatureTable =>
  testFeatures.map((feature) =>
    feature.key === module.key
      ? module
      : stub({
          element: feature.element,
          feature: feature.feature,
          issue: feature.issue,
          key: feature.key,
          namespace: feature.namespace,
        }),
  );

/**
 * A printed variable of the test outcome `TOTAL`, at its attributes' defaults.
 */
const printedTotal: PrintedVariable = {
  base: { _tag: "literal", value: 10n },
  delimiter: ";",
  field: Option.none(),
  format: Option.none(),
  identifier: "TOTAL",
  index: Option.none(),
  kind: "printed-variable",
  mappingIndicator: "=",
  path: "feedback/p/qti-printed-variable",
  powerForm: false,
};

/**
 * A paragraph that prints `TOTAL` after a label.
 */
const paragraph: BodyNode = {
  attributes: [],
  children: [{ kind: "text", text: "Total: " }, printedTotal],
  kind: "element",
  path: "feedback/p",
  tag: "p",
};

/**
 * A Text Entry bound to a single string response, which no test content may hold.
 */
const textEntry: TextEntryInteraction = {
  ariaLabel: Option.none(),
  ariaLabelledby: Option.none(),
  base: 10,
  baseType: "string",
  cardinality: "single",
  class: "",
  expectedLength: Option.none(),
  kind: "text-entry",
  path: "feedback/qti-text-entry-interaction",
  patternMask: Option.none(),
  patternMaskMessage: Option.none(),
  placeholder: Option.none(),
  response: "RESPONSE",
};

/**
 * Write a hand-built item: one Choice bound to `RESPONSE`.
 *
 * @param identifier The item's identifier.
 * @returns The item's text.
 */
const itemXml = (identifier: string): string =>
  `<qti-assessment-item xmlns="${qtiNamespace}" identifier="${identifier}" title="${identifier}" adaptive="false" time-dependent="false"><qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/><qti-item-body><qti-choice-interaction response-identifier="RESPONSE"><qti-simple-choice identifier="A">A</qti-simple-choice><qti-simple-choice identifier="B">B</qti-simple-choice></qti-choice-interaction></qti-item-body></qti-assessment-item>`;

/**
 * Write the two-part test the rows below open: the outcome `TOTAL`, which defaults to 2.5; part
 * `P1`, whose section `S1` holds the section `S1a`, which holds `i1`, and then `i2`; and part `P2`,
 * whose section `S2` holds `i3`.
 */
const testXml = `<qti-assessment-test xmlns="${qtiNamespace}" identifier="t" title="T"><qti-outcome-declaration identifier="TOTAL" cardinality="single" base-type="float"><qti-default-value><qti-value>2.5</qti-value></qti-default-value></qti-outcome-declaration><qti-test-part identifier="P1" navigation-mode="nonlinear" submission-mode="individual"><qti-assessment-section identifier="S1" title="S1" visible="true"><qti-assessment-section identifier="S1a" title="S1a" visible="true"><qti-assessment-item-ref identifier="i1" href="i1.xml"/></qti-assessment-section><qti-assessment-item-ref identifier="i2" href="i2.xml"/></qti-assessment-section></qti-test-part><qti-test-part identifier="P2" navigation-mode="nonlinear" submission-mode="individual"><qti-assessment-section identifier="S2" title="S2" visible="true"><qti-assessment-item-ref identifier="i3" href="i3.xml"/></qti-assessment-section></qti-test-part></qti-assessment-test>`;

/**
 * Open the test and its three items, and start a session of it with the default table, whose every
 * module presents nothing.
 */
const started = Effect.gen(function* startSession() {
  const encoder = new TextEncoder();
  const verdict = yield* open("tests/t.xml", encoder.encode(testXml));
  const test: AcceptedTest =
    (verdict.verdict === "accepted" || verdict.verdict === "accepted-with-unsupported") &&
    verdict.kind === "test"
      ? verdict.accepted
      : assert.fail(`the test is ${verdict.verdict}`);
  const items = new Map<string, Accepted>();
  for (const ref of ["i1", "i2", "i3"]) {
    const opened = yield* open(`tests/${ref}.xml`, encoder.encode(itemXml(ref)));
    items.set(
      ref,
      Option.getOrElse(acceptedItem(opened), () => assert.fail(`${ref} is ${opened.verdict}`)),
    );
  }

  const configuration = yield* configure({});
  const session: TestSession = Result.getOrElse(
    startTest(test, items, configuration, { instance: "sitting", now: new Date(0) }),
    (failure) => assert.fail(`startTest refused: ${failure.message}`),
  );

  return { configuration, session, test };
});

/**
 * Read the views of the three items under a table, failing the test when a read fails.
 *
 * @param delivery The test, the session and the configuration.
 * @param delivery.configuration The configuration.
 * @param delivery.session The session.
 * @param delivery.test The test.
 * @param features The table.
 * @returns The views of items 1 to 3.
 */
const viewsUnder = (
  delivery: {
    readonly configuration: Parameters<typeof itemViews>[2];
    readonly session: TestSession;
    readonly test: AcceptedTest;
  },
  features: TestFeatureTable,
): readonly ItemView[] =>
  Result.getOrElse(
    itemViews(delivery.test, delivery.session, delivery.configuration, [1, 2, 3], features),
    (failure) => assert.fail(`itemViews failed: ${failure.message}`),
  );

/**
 * Give the text a node holds, below its elements.
 *
 * @param node The node.
 * @returns Its text, in document order.
 */
const textOf = (node: Node): string =>
  node.kind === "text" ? node.text : node.children.map(textOf).join("");

/**
 * List the elements among nodes, below elements, in document order.
 *
 * @param nodes The nodes.
 * @returns The elements.
 */
const elementsIn = (nodes: readonly Node[]): readonly Element[] =>
  nodes.flatMap((node) => (node.kind === "element" ? [node, ...elementsIn(node.children)] : []));

/**
 * Read the one element a rendered test content is: the root `renderTestContent` wrote.
 *
 * @param html The rendered HTML.
 * @returns The root.
 */
const rootOf = (html: string): Element => {
  const [root, ...rest] = parseHtml(html);

  return root?.kind === "element" && rest.length === 0
    ? root
    : assert.fail("the HTML is not exactly one element");
};

describe("a test-feature module's content", () => {
  it.effect(
    "[W0-BF] a module presents content at the item places of one part, and the host renders it with the test's outcomes printed",
    () =>
      Effect.gen(function* presentsAtOnePart() {
        const delivery = yield* started;
        const features = tableWith(
          feedbackModule((context) =>
            context.place.kind === "item" && context.place.part.identifier === "P1"
              ? [{ nodes: [paragraph] }]
              : [],
          ),
        );
        const views = viewsUnder(delivery, features);
        const [first, second, third] = views;

        assert.deepStrictEqual(
          views.map((view) => view.content.map(({ key }) => key)),
          [["qti-test-feedback"], ["qti-test-feedback"], []],
        );
        assert.deepStrictEqual(first?.content[0]?.node, { nodes: [paragraph] });
        assert.strictEqual(second?.ref, "i2");
        assert.strictEqual(third?.ref, "i3");

        const rendered = Result.getOrElse(
          renderTestContent(first?.content ?? [], delivery.configuration, {
            features,
            instance: first?.instance ?? "",
            outcomes: delivery.session.outcomes,
          }),
          (failure) => assert.fail(`renderTestContent failed: ${failure.message}`),
        );
        const root = rootOf(rendered.html);
        const written = elementsIn(root.children).find((element) => element.tag === "p");

        assert.strictEqual(rendered.instance, first?.instance);
        assert.strictEqual(root.attrs["data-slot"], "test-content");
        assert.strictEqual(root.attrs["id"], scopedId(first?.instance ?? "", "test-content"));
        assert.deepStrictEqual(Object.keys(root.attrs).toSorted(), ["data-slot", "id"]);
        assert.strictEqual(written === undefined ? "" : textOf(written), "Total: 2.5");

        const empty = Result.getOrElse(
          renderTestContent(third?.content ?? [], delivery.configuration, {
            features,
            instance: third?.instance ?? "",
            outcomes: delivery.session.outcomes,
          }),
          (failure) => assert.fail(`renderTestContent failed: ${failure.message}`),
        );

        assert.strictEqual(empty.html, "");
      }),
  );

  it.effect("[W0-BF] the summary carries its content", () =>
    Effect.gen(function* summaryContent() {
      const delivery = yield* started;
      const features = tableWith(
        feedbackModule((context) =>
          context.place.kind === "summary" ? [{ nodes: [paragraph] }] : [],
        ),
      );
      const closed: TestSession = {
        ...delivery.session,
        parts: delivery.session.parts.map((part) => ({ ...part, status: "ended" })),
        status: "closed",
      };
      const whileOpen = Result.getOrElse(
        current(delivery.test, delivery.session, delivery.configuration, features),
        (failure) => assert.fail(`current failed: ${failure.message}`),
      );
      const shown = Result.getOrElse(
        current(delivery.test, closed, delivery.configuration, features),
        (failure) => assert.fail(`current failed: ${failure.message}`),
      );
      const summary: TestSummary =
        shown.kind === "summary" ? shown : assert.fail("a closed test shows its items");

      assert.deepStrictEqual(
        summary.content.map(({ key }) => key),
        ["qti-test-feedback"],
      );
      assert.strictEqual(whileOpen.kind, "item");
      assert.deepStrictEqual(whileOpen.content, []);
    }),
  );

  it.effect("[W0-BF] the place carries the enclosing sections outermost first", () =>
    Effect.gen(function* placeSections() {
      const delivery = yield* started;
      const seen = new Map<string, readonly string[]>();
      const features = tableWith(
        feedbackModule((context) => {
          if (context.place.kind === "item") {
            seen.set(
              context.place.ref,
              context.place.sections.map((section) => section.identifier),
            );
          }

          return [];
        }),
      );

      viewsUnder(delivery, features);

      assert.deepStrictEqual(
        [...seen],
        [
          ["i1", ["S1", "S1a"]],
          ["i2", ["S1"]],
          ["i3", ["S2"]],
        ],
      );
    }),
  );

  it.effect("[W0-BF] an interaction among test content is refused", () =>
    Effect.gen(function* interactionRefused() {
      const delivery = yield* started;
      const features = tableWith(feedbackModule(() => []));
      const content: readonly TestContent[] = [
        { key: "qti-test-feedback", node: { nodes: [paragraph, textEntry] } },
      ];
      const refused = renderTestContent(content, delivery.configuration, {
        features,
        instance: "sitting.1",
        outcomes: delivery.session.outcomes,
      });

      assert.strictEqual(
        Result.match(refused, {
          onFailure: (failure) => failure._tag,
          onSuccess: () => "rendered",
        }),
        "PartSwapRefused",
      );
    }),
  );

  it.effect(
    "[W0-BF] withholds a printed variable naming no outcome the session holds behind its notice",
    () =>
      Effect.gen(function* withheldVariable() {
        const delivery = yield* started;
        const features = tableWith(feedbackModule(() => []));
        const content: readonly TestContent[] = [
          { key: "qti-test-feedback", node: { nodes: [paragraph] } },
        ];
        const rendered = Result.getOrElse(
          renderTestContent(content, delivery.configuration, {
            features,
            instance: "sitting.1",
            outcomes: {},
          }),
          (failure) => assert.fail(`renderTestContent failed: ${failure.message}`),
        );
        const slots = elementsIn(parseHtml(rendered.html)).map(
          (element) => element.attrs["data-slot"],
        );

        assert.include(slots, "item-notice");
        assert.notInclude(textOf(rootOf(rendered.html)), "2.5");
      }),
  );

  it.effect(
    "[W0-BF] renders no content as no HTML, and draws the instance when none is passed",
    () =>
      Effect.gen(function* noContent() {
        const delivery = yield* started;
        const drawn = Result.getOrElse(renderTestContent([], delivery.configuration), (failure) =>
          assert.fail(`renderTestContent failed: ${failure.message}`),
        );

        assert.strictEqual(drawn.html, "");
        assert.match(drawn.instance, /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[\da-f]{4}-[\da-f]{12}$/u);
      }),
  );

  it.effect(
    "[W0-BF] refuses an instance token that breaks a requirement, before it reads any content",
    () =>
      Effect.gen(function* invalidInstance() {
        const delivery = yield* started;
        const refused = renderTestContent([], delivery.configuration, { instance: "ends-in-" });

        assert.strictEqual(
          Result.match(refused, {
            onFailure: (failure) => failure._tag,
            onSuccess: () => "rendered",
          }),
          "InvalidInstance",
        );
      }),
  );

  it.effect("[W0-BF] hands each module's render the supports and the view it was given", () =>
    Effect.gen(function* handsKit() {
      const delivery = yield* started;
      const kits: TestContentRenderKit[] = [];
      const features = tableWith(
        feedbackModule(
          () => [],
          (kit) => {
            kits.push(kit);
          },
        ),
      );
      const content: readonly TestContent[] = [
        { key: "qti-test-feedback", node: { nodes: [paragraph] } },
      ];
      const supports = { ...noSupports, answerMasking: true };

      for (const options of [{}, { supports, view: "scorer" as const }]) {
        Result.getOrElse(
          renderTestContent(content, delivery.configuration, {
            features,
            instance: "sitting.1",
            outcomes: delivery.session.outcomes,
            ...options,
          }),
          (failure) => assert.fail(`renderTestContent failed: ${failure.message}`),
        );
      }

      assert.deepStrictEqual(
        kits.map((kit) => [kit.supports, kit.view]),
        [
          [noSupports, "candidate"],
          [supports, "scorer"],
        ],
      );
    }),
  );

  it.effect(
    "[W0-BF] writes its root through the part table, so a host's replacement swaps it and keeps its id",
    () =>
      Effect.gen(function* swappedRoot() {
        const delivery = yield* started;
        const features = tableWith(feedbackModule(() => []));
        const content: readonly TestContent[] = [
          { key: "qti-test-feedback", node: { nodes: [paragraph] } },
        ];
        const rendered = Result.getOrElse(
          renderTestContent(content, delivery.configuration, {
            features,
            instance: "sitting.1",
            outcomes: delivery.session.outcomes,
            parts: { "test-content": { root: (props, children) => h("aside", props, children) } },
          }),
          (failure) => assert.fail(`renderTestContent failed: ${failure.message}`),
        );
        const root = rootOf(rendered.html);

        assert.strictEqual(root.tag, "aside");
        assert.strictEqual(root.attrs["data-slot"], "test-content");
        assert.strictEqual(root.attrs["id"], scopedId("sitting.1", "test-content"));
      }),
  );

  it.effect("[W0-BF] renders nothing for content whose key the table holds no module for", () =>
    Effect.gen(function* unknownKey() {
      const delivery = yield* started;
      const content: readonly TestContent[] = [
        { key: "qti-test-feedback", node: { nodes: [paragraph] } },
      ];
      const rendered = Result.getOrElse(
        renderTestContent(content, delivery.configuration, { features: [], instance: "sitting.1" }),
        (failure) => assert.fail(`renderTestContent failed: ${failure.message}`),
      );

      assert.deepStrictEqual(rendered, { html: "", instance: "sitting.1" });
    }),
  );

  it.effect(
    "[W0-BF] returns a heading level a hand-built configuration breaks as MarkupRefused, never a throw",
    () =>
      Effect.gen(function* brokenHeadingLevel() {
        const delivery = yield* started;
        const features = tableWith(feedbackModule(() => []));
        const heading: BodyNode = {
          attributes: [],
          children: [{ kind: "text", text: "Rubric" }],
          kind: "element",
          path: "feedback/h1",
          tag: "h1",
        };
        const content: readonly TestContent[] = [
          { key: "qti-test-feedback", node: { nodes: [heading] } },
        ];
        const render = (headingLevel: number) =>
          renderTestContent(
            content,
            { ...delivery.configuration, headingLevel },
            { features, instance: "sitting.1" },
          );

        assert.strictEqual(
          Result.match(render(Number.NaN), {
            onFailure: (failure) => failure._tag,
            onSuccess: () => "rendered",
          }),
          "MarkupRefused",
        );
        assert.deepStrictEqual(
          elementsIn(
            rootOf(Result.getOrElse(render(3), (failure) => assert.fail(failure.message)).html)
              .children,
          ).map((element) => element.tag),
          ["section", "h3"],
        );
      }),
  );
});

/**
 * The model node of {@link landedStylesheet}: the package path its element names.
 */
interface StyleNode {
  readonly href: string;
}

/**
 * A test-level Stylesheet module as `m5-06` will land it, reduced to what the host's reader and the
 * item's instance reach: it renders the rule the host's text for its path makes under the item
 * Root's id, `#<scopedId(instance, "item")> <text>`, carried as the `data-rule` of a childless
 * `style` element, since the serialiser refuses any child of one (`RawTextChildren`).
 */
const landedStylesheet: TestFeatureModule<"qti-stylesheet", StyleNode> = {
  ...stub({
    element: "qti-stylesheet",
    feature: ["T-3"],
    issue: "m5-06",
    key: "qti-stylesheet",
    namespace: qtiNamespace,
  }),
  implemented: true,
  render: (node, _state, kit) =>
    Result.succeed(
      Option.match(kit.files(node.href), {
        onNone: () => h("span", { "data-stylesheet": "none" }),
        onSome: (css) => h("style", { "data-rule": `#${scopedId(kit.instance, "item")} ${css}` }),
      }),
    ),
};

/**
 * The host's reader of package files here: it holds the one file the landed module asks for.
 *
 * @param path A package-relative path.
 * @returns The file's text, none for any other path.
 */
const holdsStyle = (path: string): Option.Option<string> =>
  path === "style/test.css" ? Option.some("p { color: red }") : Option.none();

/**
 * Read the rules the `style` elements of a render carry, in document order.
 *
 * @param html The rendered HTML.
 * @returns Each `style` element's `data-rule`.
 */
const rulesIn = (html: string): readonly string[] =>
  [...html.matchAll(/<style data-rule="(?<rule>[^"]*)"><\/style>/gu)].map(
    ({ groups }) => groups?.["rule"] ?? "",
  );

describe("renderTestContent, the host's files", () => {
  it.effect(
    "[W0-BH] hands a module's render the host's files and the item's instance, so its rule is confined to that item's Root",
    () =>
      Effect.gen(function* handsFiles() {
        const configuration = yield* configure({});
        const opened = yield* open("items/i1.xml", new TextEncoder().encode(itemXml("i1")));
        const accepted = Option.getOrElse(acceptedItem(opened), () =>
          assert.fail(`the item is ${opened.verdict}`),
        );
        const instance = "sitting.1";
        const content: readonly TestContent[] = [
          { key: "qti-stylesheet", node: { href: "style/test.css" } },
        ];
        const features: TestFeatureTable = [landedStylesheet];
        const item = yield* Effect.fromResult(
          renderItem(redact(accepted, undefined, configuration), configuration, { instance }),
        );
        const withFile = yield* Effect.fromResult(
          renderTestContent(content, configuration, { features, files: holdsStyle, instance }),
        );
        const without = yield* Effect.fromResult(
          renderTestContent(content, configuration, { features, instance }),
        );
        const rootId = /^<qti-assessment-item [^>]*\bid="(?<id>[^"]*)"/u.exec(item.html)?.groups?.[
          "id"
        ];

        assert.strictEqual(rootId, scopedId(instance, "item"));
        assert.match(withFile.html, /^<div [^>]*data-slot="test-content"/u);
        assert.match(withFile.html, /^<div [^>]*id="sitting\.1-test-content"/u);
        assert.strictEqual(withFile.instance, instance);
        assert.deepStrictEqual(rulesIn(withFile.html), [`#${rootId} p { color: red }`]);
        assert.deepStrictEqual(rulesIn(without.html), []);
        assert.include(without.html, '<span data-stylesheet="none"></span>');
      }),
  );
});

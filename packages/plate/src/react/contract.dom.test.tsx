/**
 * The React layer's contract in each engine's page, under React 19: `useParts` projects the tree
 * plate's part functions build for the M2 Choice fixture to the same `data-slot` markers, ids and
 * entry names as `render`'s HTML (OD-8: one emitter, a React projection); every stub component (the
 * 21 interactions', `Item`, `Status` and `Navigation`) renders the item's notice; and
 * `TestProvider` fails at mount naming the issue that fills it.
 *
 * Every case sits under a `describe` named by the engine (`server.browser`), as in
 * `src/test/page.dom.test.ts`.
 */
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import type { ReactNode } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import type { RootOptions } from "react-dom/client";
import { commands, server } from "vite-plus/test/browser/context";
import { configure } from "#plate/configuration.ts";
import type { Configuration } from "#plate/configuration.ts";
import { emitBody } from "#plate/emit/body.ts";
import type { RenderInteraction } from "#plate/emit/body.ts";
import { emitItem, itemPart } from "#plate/emit/item.ts";
import type { Element } from "#plate/emit/node.ts";
import { resolveOverrides } from "#plate/emit/parts.ts";
import { toHtml } from "#plate/emit/serialise.ts";
import { renderChoice } from "#plate/interactions/choice.ts";
import { payload } from "#plate/payload.ts";
import type { EmitState, Redacted } from "#plate/payload.ts";
import {
  Associate,
  Choice,
  Drawing,
  EndAttempt,
  ExtendedText,
  GapMatch,
  GraphicAssociate,
  GraphicGapMatch,
  GraphicOrder,
  Hotspot,
  Hottext,
  InlineChoice,
  Item,
  Match,
  Media,
  Navigation,
  NotImplemented,
  Order,
  PortableCustom,
  PositionObject,
  SelectPoint,
  Slider,
  Status,
  TestProvider,
  TextEntry,
  Upload,
  useParts,
} from "#plate/react/index.tsx";
import type { InteractionComponent } from "#plate/react/index.tsx";
import { redact, render } from "#plate/render.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";

/**
 * The M2 fixture item holding one Choice, relative to the package, the in-page project's root,
 * which `commands.readFile` resolves this file's paths against.
 */
const choiceFixture = "fixtures/m2/items/p2-choice.xml";

/**
 * The instance key every render here uses.
 */
const instance = "w0e";

/**
 * Open the M2 Choice fixture and redact it, with the default configuration.
 *
 * @returns The redacted item and the configuration.
 */
const redactedChoice = Effect.gen(function* openChoice() {
  const bytes = new TextEncoder().encode(
    yield* Effect.promise(() => commands.readFile(choiceFixture)),
  );
  const accepted = Option.getOrThrow(acceptedItem(yield* open("p2-choice.xml", bytes)));
  const configuration = yield* configure({});

  return { configuration, redacted: redact(accepted) };
});

/**
 * Build the item's tree through the part functions `render` calls, with the default view: the body
 * with each Choice rendered by `renderChoice`, the live region, and the item's root around them.
 *
 * @param redacted The item.
 * @param configuration The configuration.
 * @returns The item's root element.
 */
const choiceTree = (redacted: Redacted, configuration: Configuration): Element => {
  const state: EmitState = {
    assetBase: configuration.assetBase,
    headingLevel: configuration.headingLevel,
    locale: configuration.locale,
    parts: Result.getOrThrow(resolveOverrides()),
  };
  const built = payload(redacted, {
    finished: false,
    instance,
    locale: configuration.locale,
    messages: [],
    mode: "answering",
    names: new Map(),
    posted: Option.none(),
    values: new Map(),
  });
  const renderInteraction: RenderInteraction = (interaction) => {
    if (interaction.kind !== "choice") {
      return assert.fail(`the Choice fixture holds a ${interaction.kind} interaction`);
    }

    return renderChoice(interaction, built, state);
  };
  const body = Result.getOrThrow(emitBody(built, state, renderInteraction));
  const live = Result.getOrThrow(
    itemPart(
      state.parts,
      "live",
      { "aria-atomic": "true", "aria-live": "polite", role: "status" },
      [],
    ),
  );

  return Result.getOrThrow(emitItem(built, state, [...body, live]));
};

/**
 * Mount a React node into a fresh container at the end of the page's body, synchronously.
 *
 * @param node The node.
 * @param options React's root options, such as the handler of an error a component threw.
 * @returns The container and its unmount, which the caller calls.
 */
const mount = (node: ReactNode, options: RootOptions = {}) => {
  const container = document.createElement("div");

  document.body.append(container);

  const root = createRoot(container, options);

  flushSync(() => {
    root.render(node);
  });

  return {
    container,
    unmount: () => {
      root.unmount();
      container.remove();
    },
  };
};

/**
 * Parse some HTML into a fresh template.
 *
 * @param html The HTML.
 * @returns The template's content.
 */
const parsed = (html: string): DocumentFragment => {
  const template = document.createElement("template");

  template.innerHTML = html;

  return template.content;
};

/**
 * Read one attribute of every element under a node that carries it, in document order.
 *
 * @param node The node.
 * @param name The attribute.
 * @returns Each value.
 */
const valuesOf = (node: ParentNode, name: string): readonly string[] =>
  [...node.querySelectorAll(`[${name}]`)].map((element) => element.getAttribute(name) ?? "");

/**
 * Every interaction's component, by the QTI element its notice names.
 */
const interactionStubs: readonly (readonly [string, InteractionComponent<never>])[] = [
  ["qti-associate-interaction", Associate],
  ["qti-choice-interaction", Choice],
  ["qti-drawing-interaction", Drawing],
  ["qti-end-attempt-interaction", EndAttempt],
  ["qti-extended-text-interaction", ExtendedText],
  ["qti-gap-match-interaction", GapMatch],
  ["qti-graphic-associate-interaction", GraphicAssociate],
  ["qti-graphic-gap-match-interaction", GraphicGapMatch],
  ["qti-graphic-order-interaction", GraphicOrder],
  ["qti-hotspot-interaction", Hotspot],
  ["qti-hottext-interaction", Hottext],
  ["qti-inline-choice-interaction", InlineChoice],
  ["qti-match-interaction", Match],
  ["qti-media-interaction", Media],
  ["qti-order-interaction", Order],
  ["qti-portable-custom-interaction", PortableCustom],
  ["qti-position-object-interaction", PositionObject],
  ["qti-select-point-interaction", SelectPoint],
  ["qti-slider-interaction", Slider],
  ["qti-text-entry-interaction", TextEntry],
  ["qti-upload-interaction", Upload],
];

/**
 * A component that projects a tree through `useParts`.
 *
 * @param props The tree.
 * @returns The tree as React renders it.
 */
const Projected = ({ tree }: { readonly tree: Element }): ReactNode => useParts(tree);

describe(server.browser, () => {
  describe("useParts", () => {
    it.effect(
      "projects the Choice fixture's tree to the markers, ids and names render writes",
      () =>
        Effect.gen(function* projectsChoice() {
          const { configuration, redacted } = yield* redactedChoice;
          const tree = choiceTree(redacted, configuration);
          const { html } = Result.getOrThrow(render(redacted, configuration, { instance }));

          // The tree is the one render builds: it serialises to render's HTML.
          assert.strictEqual(Result.getOrThrow(toHtml(tree)), html);

          const written = parsed(html);
          const { container, unmount } = mount(<Projected tree={tree} />);
          const slots = valuesOf(container, "data-slot");

          assert.include(slots, "choice-interaction");
          assert.deepStrictEqual(slots, valuesOf(written, "data-slot"));
          assert.deepStrictEqual(valuesOf(container, "id"), valuesOf(written, "id"));
          assert.deepStrictEqual(valuesOf(container, "name"), valuesOf(written, "name"));
          assert.deepStrictEqual(valuesOf(container, "for"), valuesOf(written, "for"));
          assert.strictEqual(container.textContent, written.textContent);
          unmount();
        }),
    );
  });

  describe("the stubs", () => {
    it.effect("render the item's notice naming their feature", () =>
      Effect.gen(function* stubsGiveNotice() {
        const configuration = yield* configure({});
        const { redacted } = yield* redactedChoice;
        const stubs: readonly (readonly [string, ReactNode])[] = [
          ...interactionStubs.map(
            ([feature, Stub]) =>
              [feature, <Stub key={feature} responseIdentifier="RESPONSE" />] as const,
          ),
          [
            "qti-assessment-item",
            <Item configuration={configuration} key="item" redacted={redacted} />,
          ],
          [
            "status",
            <Status
              configuration={configuration}
              input={{ heading: "scored", instance }}
              key="status"
            />,
          ],
          [
            "test-navigation",
            <Navigation
              configuration={configuration}
              key="navigation"
              state={{
                allowed: [],
                count: 0,
                items: [],
                navigation: "linear",
                position: 0,
                submission: "individual",
              }}
            />,
          ],
        ];

        assert.strictEqual(interactionStubs.length, 21);

        for (const [feature, node] of stubs) {
          const { container, unmount } = mount(node);
          const notice = container.querySelector('[data-slot="item-notice"]');

          assert.strictEqual(notice?.getAttribute("role"), "note", feature);
          assert.strictEqual(notice?.textContent, `Not supported here: ${feature}`);
          unmount();
        }
      }),
    );
  });

  describe("TestProvider", () => {
    it("fails at mount with NotImplemented naming m3g-06", () => {
      const errors: unknown[] = [];
      const transport = {
        post: () => Promise.reject(new NotImplemented({ issue: "test", piece: "post" })),
        view: () => Promise.reject(new NotImplemented({ issue: "test", piece: "view" })),
      };
      const { unmount } = mount(<TestProvider transport={transport} />, {
        onUncaughtError: (thrown) => {
          errors.push(thrown);
        },
      });

      unmount();

      const [error] = errors;

      assert.strictEqual(errors.length, 1);
      assert.instanceOf(error, NotImplemented);
      assert.strictEqual(error.issue, "m3g-06");
      assert.strictEqual(error.piece, "TestProvider");
    });
  });
});

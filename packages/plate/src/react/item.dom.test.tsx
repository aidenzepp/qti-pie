/**
 * `Item` and `useInteraction` in each engine's page, under React 19: `Item` projects the very tree
 * `render` builds (one emitter, a React projection), so its markers, ids, names, label links and
 * text are `render`'s; it mounts `options.values` as the controls' defaults and reports a changed
 * response as `decode` reads it; a part replacement given as a React component holds the swap
 * invariant as the core's swap does, and a breach throws the core's refusal; `useInteraction` is
 * the item's notice outside an item, controlled through `value` inside an `ItemScope`, and reports
 * what the runtime writes into hidden inputs; and `useUpgrade` upgrades as `upgrade` itself does.
 *
 * Every case sits under a `describe` named by the engine (`server.browser`), as in
 * `src/test/page.dom.test.ts`.
 */
/// <reference types="vite-plus/client" />
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { Children, useRef, useState } from "react";
import type { ReactNode } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import type { RootOptions } from "react-dom/client";
import { commands, server, userEvent } from "vite-plus/test/browser/context";
import { configure } from "#plate/configuration.ts";
import { h } from "#plate/emit/node.ts";
import type { Attributes, Node, PartFunction } from "#plate/emit/node.ts";
import { UnknownPart } from "#plate/emit/parts.ts";
import { toHtml } from "#plate/emit/serialise.ts";
import { PartSwapRefused } from "#plate/emit/swap.ts";
import type { ResponseValue } from "#plate/model/values.ts";
import type { InteractionProps, PartOverrides, PartProps } from "#plate/react/contract.tsx";
import { ItemScope, useInteraction } from "#plate/react/interaction.tsx";
import { Item } from "#plate/react/item.tsx";
import { useParts, useUpgrade } from "#plate/react/parts.tsx";
import { redact, render } from "#plate/render.ts";
import type { Options } from "#plate/render.ts";
import { upgrade } from "#plate/runtime.dom.ts";
import { runtimeKinds } from "#plate/runtime/contract.dom.ts";
import { writeHidden } from "#plate/runtime/wire.dom.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";

/**
 * The composite fixture: a Choice bound to `CHOICE` and a Text Entry bound to `TEXT`, relative to
 * the package, the in-page project's root, which `commands.readFile` resolves paths against.
 */
const composite = "fixtures/m3g/items/m3g-composite.xml";

/**
 * Every M2 fixture item, and the composite, as paths relative to the package's root. Vite expands
 * the glob when it serves this file.
 */
const projectedItems = [
  composite,
  ...Object.keys(import.meta.glob("/fixtures/m2/items/*.xml")).map((key) => key.slice(1)),
];

/**
 * Every fixture item of every area that renders a root of a runtime kind today, as paths relative
 * to the package's root: the M3.d items, whose Gap Match is the one runtime kind the core renders.
 */
const runtimeItems = Object.keys(import.meta.glob("/fixtures/m3d/items/*.xml")).map((key) =>
  key.slice(1),
);

/**
 * The instance every render here uses.
 */
const instance = "t1";

/**
 * Open one fixture item and redact it, with the default configuration.
 *
 * @param path The item's path relative to the package's root.
 * @returns The redacted item and the configuration.
 */
const redactedFixture = (path: string) =>
  Effect.gen(function* openFixture() {
    const bytes = new TextEncoder().encode(yield* Effect.promise(() => commands.readFile(path)));
    const accepted = Option.getOrThrow(acceptedItem(yield* open(path, bytes)));
    const configuration = yield* configure({});

    return { configuration, redacted: redact(accepted) };
  });

/**
 * Mount a React node into a fresh container at the end of the page's body, synchronously.
 *
 * @param node The node.
 * @param options React's root options, such as the handler of an error a component threw.
 * @returns The container, a synchronous re-render, and the unmount, which the caller calls.
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
 * Mount a node that throws while it renders, and give the error React reported as uncaught,
 * failing the test unless it is an error.
 *
 * @param node The node.
 * @returns The first error React reported as uncaught.
 */
const thrownBy = (node: ReactNode): Error => {
  const errors: unknown[] = [];
  const { unmount } = mount(node, {
    onUncaughtError: (thrown) => {
      errors.push(thrown);
    },
  });

  unmount();

  const [error] = errors;

  assert.instanceOf(error, Error);

  return error;
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
 * The attributes the projection must carry as `render` writes them: the markers, ids, entry names
 * and label links.
 */
const linkAttributes = ["data-slot", "id", "name", "for", "aria-labelledby"] as const;

/**
 * Assert that a mounted node and `render`'s HTML hold the same values of each of `names`, in
 * document order.
 *
 * @param actual The mounted container.
 * @param expected `render`'s HTML, parsed.
 * @param names The attributes to compare.
 * @param label What the comparison is of, for a failure.
 */
const assertSameAttributes = (
  actual: ParentNode,
  expected: ParentNode,
  names: readonly string[],
  label: string,
): void => {
  for (const name of names) {
    assert.deepStrictEqual(valuesOf(actual, name), valuesOf(expected, name), `${label} ${name}`);
  }
};

/**
 * Narrow a DOM node to an element, failing the test when it is not one.
 *
 * @param node The node.
 * @returns The node as an element.
 */
const assertElement = (node: globalThis.Node | null | undefined): Element => {
  assert.instanceOf(node, Element);

  return node;
};

/**
 * Give an element's tree as React renders it, adjacent texts merged, so it compares node by node
 * with the same markup parsed.
 *
 * @param element The element.
 * @returns A normalised deep clone.
 */
const normalised = (element: Element): Element => {
  const clone = element.cloneNode(true);

  clone.normalize();

  return assertElement(clone);
};

/**
 * Find the one input under a node that matches a selector.
 *
 * @param node The node.
 * @param selector The selector.
 * @returns The input.
 */
const inputAt = (node: ParentNode, selector: string): HTMLInputElement => {
  const input = node.querySelector(selector);

  assert.instanceOf(input, HTMLInputElement, selector);

  return input;
};

/**
 * Construct a single identifier value.
 *
 * @param value The identifier.
 * @returns The value, of cardinality `single`.
 */
const identifier = (value: string): ResponseValue => ({
  baseType: "identifier",
  cardinality: "single",
  values: [{ baseType: "identifier", value }],
});

/**
 * Construct a single string value.
 *
 * @param value The string.
 * @returns The value, of cardinality `single`.
 */
const string = (value: string): ResponseValue => ({
  baseType: "string",
  cardinality: "single",
  values: [{ baseType: "string", value }],
});

/**
 * Wait for the next animation frame, after every mutation observer the page queued has run.
 *
 * @returns The frame's timestamp.
 */
const nextFrame = Effect.callback<number>((resume) => {
  requestAnimationFrame((time) => {
    resume(Effect.succeed(time));
  });
});

/**
 * A component that projects a Choice through `useInteraction`, as a filled Choice does.
 *
 * @param props The interaction's props.
 * @returns The Choice, or the notice outside an item.
 */
const ChoiceProbe = (props: InteractionProps<"choice-interaction">): ReactNode =>
  useInteraction("choice-interaction", props);

/**
 * A component that projects a Gap Match through `useInteraction`, as a filled Gap Match does.
 *
 * @param props The interaction's props.
 * @returns The Gap Match, or the notice outside an item.
 */
const GapMatchProbe = (props: InteractionProps<"gap-match-interaction">): ReactNode =>
  useInteraction("gap-match-interaction", props);

/**
 * A core part function that swaps a part's element for another tag, as a host's would.
 *
 * @param tag The tag.
 * @returns The part function.
 */
const coreSwap =
  (tag: string): PartFunction<Attributes> =>
  (props, children) =>
    h(tag, props, children);

/**
 * Every runtime kind's root, by hand, inside an item root with its live part: the tree the pin of
 * `useUpgrade` projects.
 */
const everyKindTree = h("div", { "data-slot": "item" }, [
  h("div", { "aria-atomic": "true", "aria-live": "polite", "data-slot": "item-live" }),
  ...runtimeKinds.map((kind) => h("div", { "data-slot": `${kind}-interaction` })),
]);

/**
 * A component that projects a tree into a `div` and upgrades it through `useUpgrade`.
 *
 * @param props The tree.
 * @returns The `div` holding the tree.
 */
const UpgradedTree = ({ tree }: { readonly tree: Node }): ReactNode => {
  const ref = useRef<HTMLDivElement>(null);

  useUpgrade(ref);

  return <div ref={ref}>{useParts(tree)}</div>;
};

describe(server.browser, () => {
  describe("Item", () => {
    it.effect(
      "[m3g-01] Item projects the markers, ids, names, label links and text render writes",
      () =>
        Effect.gen(function* projectsRender() {
          for (const path of projectedItems) {
            const { configuration, redacted } = yield* redactedFixture(path);
            const { html } = Result.getOrThrow(render(redacted, configuration, { instance }));
            const written = parsed(html);
            const { container, unmount } = mount(
              <Item configuration={configuration} options={{ instance }} redacted={redacted} />,
            );

            assert.isAbove(valuesOf(container, "data-slot").length, 2, path);
            assertSameAttributes(container, written, linkAttributes, path);
            assert.strictEqual(container.textContent, written.textContent, path);
            unmount();
          }
        }),
    );

    it.effect("[m3g-01] Item mounts options.values as the controls' defaults", () =>
      Effect.gen(function* mountsValues() {
        const { configuration, redacted } = yield* redactedFixture(composite);
        const options: Options = {
          instance,
          values: { CHOICE: identifier("B"), TEXT: string("warm") },
        };
        const written = parsed(Result.getOrThrow(render(redacted, configuration, options)).html);
        const { container, unmount } = mount(
          <Item configuration={configuration} options={options} redacted={redacted} />,
        );

        assert.isTrue(inputAt(written, 'input[value="B"]').hasAttribute("checked"));
        assert.strictEqual(inputAt(written, 'input[type="text"]').getAttribute("value"), "warm");
        assert.isTrue(inputAt(container, 'input[value="B"]').checked);
        assert.isFalse(inputAt(container, 'input[value="A"]').checked);
        assert.strictEqual(inputAt(container, 'input[type="text"]').value, "warm");
        unmount();
      }),
    );

    it.effect("[m3g-01] Item reports a changed response as decode reads it", () =>
      Effect.gen(function* reportsChange() {
        const { configuration, redacted } = yield* redactedFixture(composite);
        const changes: (readonly [string, ResponseValue])[] = [];
        const { container, unmount } = mount(
          <Item
            configuration={configuration}
            onValueChange={(response, value) => {
              changes.push([response, value]);
            }}
            options={{ instance }}
            redacted={redacted}
          />,
        );

        yield* Effect.promise(() => userEvent.click(inputAt(container, 'input[value="A"]')));
        assert.deepStrictEqual(changes, [["CHOICE", identifier("A")]]);

        yield* Effect.promise(() => userEvent.type(inputAt(container, 'input[type="text"]'), "x"));
        assert.deepStrictEqual(changes, [
          ["CHOICE", identifier("A")],
          ["TEXT", string("x")],
        ]);
        unmount();
      }),
    );
  });

  describe("part replacements", () => {
    it.effect("[m3g-01] a replacement root keeps every attribute the emitter requires (I1)", () =>
      Effect.gen(function* keepsRequired() {
        const { configuration, redacted } = yield* redactedFixture(composite);
        const parts: PartOverrides = {
          "choice-interaction": {
            indicator: (props) => <span {...props} aria-hidden="false" data-slot="mine" />,
          },
        };
        const { container, unmount } = mount(
          <Item
            configuration={configuration}
            options={{ instance }}
            parts={parts}
            redacted={redacted}
          />,
        );
        const indicators = [...container.querySelectorAll<HTMLElement>("label > span")];

        assert.strictEqual(indicators.length, 2);
        assert.isNull(container.querySelector('[data-slot="mine"]'));
        for (const indicator of indicators) {
          assert.strictEqual(indicator.dataset["slot"], "choice-interaction-indicator");
          assert.strictEqual(indicator.getAttribute("aria-hidden"), "true");
        }
        unmount();
      }),
    );

    it.effect(
      "[m3g-01] Choices and Choice swapped to divs keep both names, as the core's swap does",
      () =>
        Effect.gen(function* keepsNames() {
          const { configuration, redacted } = yield* redactedFixture(composite);
          const swaps: readonly (readonly [PartOverrides, NonNullable<Options["parts"]>])[] = [
            [
              {
                "choice-interaction": {
                  choice: (props) => <div {...props} />,
                  choices: (props) => <div {...props} />,
                },
              },
              { "choice-interaction": { choice: coreSwap("div"), choices: coreSwap("div") } },
            ],
            [
              { "choice-interaction": { label: (props) => <span {...props} /> } },
              { "choice-interaction": { label: coreSwap("span") } },
            ],
          ];

          for (const [parts, coreParts] of swaps) {
            const written = parsed(
              Result.getOrThrow(render(redacted, configuration, { instance, parts: coreParts }))
                .html,
            );
            const { container, unmount } = mount(
              <Item
                configuration={configuration}
                options={{ instance }}
                parts={parts}
                redacted={redacted}
              />,
            );

            assertSameAttributes(container, written, [...linkAttributes, "role"], "swap");
            assert.strictEqual(container.textContent, written.textContent);

            for (const control of container.querySelectorAll<HTMLInputElement>(
              'input[type="radio"]',
            )) {
              const label = container.querySelector(
                `#${CSS.escape(control.getAttribute("aria-labelledby") ?? "")}`,
              );

              assert.isNotEmpty(label?.textContent ?? "", control.id);
            }
            unmount();
          }

          const divs = yield* redactedFixture(composite);
          const { container, unmount } = mount(
            <Item
              configuration={divs.configuration}
              options={{ instance }}
              parts={swaps[0]?.[0] ?? {}}
              redacted={divs.redacted}
            />,
          );

          assert.deepStrictEqual(valuesOf(container, "role"), ["list", "listitem", "listitem"]);
          unmount();
        }),
    );

    it.effect("[m3g-01] a replacement outside the part's tag class is refused (I3)", () =>
      Effect.gen(function* refusesRoot() {
        const { configuration, redacted } = yield* redactedFixture(composite);
        const error = thrownBy(
          <Item
            configuration={configuration}
            options={{ instance }}
            parts={{ "choice-interaction": { control: (props) => <div {...props} /> } }}
            redacted={redacted}
          />,
        );

        assert.instanceOf(error, PartSwapRefused);
        assert.strictEqual(error.cause, "root-not-allowed");
        assert.strictEqual(error.interaction, "choice-interaction");
        assert.strictEqual(error.part, "control");
      }),
    );

    it.effect("[m3g-01] a replacement that drops a child it was handed is refused (I2)", () =>
      Effect.gen(function* refusesDropped() {
        const { configuration, redacted } = yield* redactedFixture(composite);
        const error = thrownBy(
          <Item
            configuration={configuration}
            options={{ instance }}
            parts={{
              "choice-interaction": {
                choice: ({ children, ...props }) => (
                  <li {...props}>{Children.toArray(children).slice(1)}</li>
                ),
              },
            }}
            redacted={redacted}
          />,
        );

        assert.instanceOf(error, PartSwapRefused);
        assert.strictEqual(error.cause, "child-missing");
        assert.strictEqual(error.interaction, "choice-interaction");
        assert.strictEqual(error.part, "choice");
      }),
    );

    it.effect("[m3g-01] an unknown part key is refused", () =>
      Effect.gen(function* refusesUnknown() {
        const { configuration, redacted } = yield* redactedFixture(composite);
        const parts: PartOverrides = Object.fromEntries([
          ["choice-interaction", { nope: (props: PartProps) => <div {...props} /> }],
        ]);
        const error = thrownBy(
          <Item
            configuration={configuration}
            options={{ instance }}
            parts={parts}
            redacted={redacted}
          />,
        );

        assert.instanceOf(error, UnknownPart);
        assert.strictEqual(error.interaction, "choice-interaction");
        assert.deepStrictEqual(error.part, Option.some("nope"));
      }),
    );
  });

  describe("useInteraction", () => {
    it("[m3g-01] useInteraction outside an Item renders the notice for its kind", () => {
      const { container, unmount } = mount(<ChoiceProbe responseIdentifier="CHOICE" />);
      const notice = container.querySelector('[data-slot="item-notice"][role="note"]');

      assert.strictEqual(notice?.textContent, "Not supported here: qti-choice-interaction");
      unmount();
    });

    it.effect("[m3g-01] useInteraction inside an ItemScope is controlled through value", () =>
      Effect.gen(function* controlled() {
        const { configuration, redacted } = yield* redactedFixture(composite);
        const changes: ResponseValue[] = [];
        let choose: ((value: ResponseValue) => void) | undefined;
        const Host = (): ReactNode => {
          const [value, setValue] = useState(identifier("B"));

          choose = setValue;

          return (
            <ItemScope configuration={configuration} instance={instance} redacted={redacted}>
              <ChoiceProbe
                onValueChange={(changed) => {
                  changes.push(changed);
                }}
                responseIdentifier="CHOICE"
                value={value}
              />
            </ItemScope>
          );
        };
        const { container, unmount } = mount(<Host />);
        const radio = (choice: string) => inputAt(container, `input[value="${choice}"]`);

        assert.isTrue(radio("B").checked);
        assert.isFalse(radio("A").checked);

        yield* Effect.promise(() => userEvent.click(radio("A")));
        assert.deepStrictEqual(changes, [identifier("A")]);
        assert.isTrue(radio("B").checked);
        assert.isFalse(radio("A").checked);

        const set = choose;

        assert.isDefined(set);
        flushSync(() => {
          set(identifier("A"));
        });
        assert.isTrue(radio("A").checked);
        assert.isFalse(radio("B").checked);
        assert.deepStrictEqual(changes, [identifier("A")]);
        unmount();
      }),
    );

    it.effect("[m3g-01] useInteraction reports what the runtime writes into hidden inputs", () =>
      Effect.gen(function* reportsHidden() {
        const path =
          runtimeItems.find((item) => item.endsWith("/gap-match.xml")) ??
          assert.fail("no M3.d Gap Match fixture item");
        const { configuration, redacted } = yield* redactedFixture(path);
        const changes: ResponseValue[] = [];
        const { container, unmount } = mount(
          <ItemScope configuration={configuration} instance={instance} redacted={redacted}>
            <GapMatchProbe
              onValueChange={(changed) => {
                changes.push(changed);
              }}
              responseIdentifier="RESPONSE"
            />
          </ItemScope>,
        );
        const root = container.querySelector('[data-slot="gap-match-interaction"]');

        assert.instanceOf(root, HTMLElement);
        writeHidden(root, `${instance}.RESPONSE`, ["A G1", "B G2"]);
        yield* nextFrame;
        writeHidden(root, `${instance}.RESPONSE`, ["A G1", "B G2"]);
        yield* nextFrame;

        assert.deepStrictEqual(changes, [
          {
            baseType: "directedPair",
            cardinality: "multiple",
            values: [
              { baseType: "directedPair", value: ["A", "G1"] },
              { baseType: "directedPair", value: ["B", "G2"] },
            ],
          },
        ]);
        unmount();
      }),
    );
  });

  describe("useUpgrade", () => {
    it.effect("[m3g-01] useUpgrade upgrades what Item renders as upgrade itself does", () =>
      Effect.gen(function* upgradesAsUpgrade() {
        const focused = document.activeElement;
        const pinTwin = document.createElement("div");

        pinTwin.innerHTML = Result.getOrThrow(toHtml(everyKindTree));
        document.body.append(pinTwin);

        const pin = mount(<UpgradedTree tree={everyKindTree} />);
        const pinned = assertElement(pin.container.firstElementChild);
        const pinTwinUpgraded = upgrade(pinTwin);

        assert.isNotEmpty(pinTwinUpgraded.controllers);
        assert.isTrue(normalised(pinned).isEqualNode(normalised(pinTwin)));
        pin.unmount();
        pinTwinUpgraded.teardown();
        assert.isTrue(normalised(pinned).isEqualNode(normalised(pinTwin)));
        pinTwin.remove();
        assert.strictEqual(document.activeElement, focused);

        assert.isNotEmpty(runtimeItems);
        for (const path of runtimeItems) {
          const { configuration, redacted } = yield* redactedFixture(path);
          const { html } = Result.getOrThrow(render(redacted, configuration, { instance }));
          const twin = document.createElement("div");

          twin.innerHTML = html;
          document.body.append(twin);

          const { container, unmount } = mount(
            <Item configuration={configuration} options={{ instance }} redacted={redacted} />,
          );
          const item = assertElement(container.firstElementChild);
          const twinItem = assertElement(twin.firstElementChild);
          const upgraded = upgrade(twin);

          assert.isNotEmpty(upgraded.controllers, path);
          assert.isTrue(normalised(item).isEqualNode(normalised(twinItem)), path);
          unmount();
          upgraded.teardown();
          assert.isTrue(normalised(item).isEqualNode(normalised(twinItem)), path);
          twin.remove();
          assert.strictEqual(document.activeElement, focused, path);
        }
      }),
    );
  });
});

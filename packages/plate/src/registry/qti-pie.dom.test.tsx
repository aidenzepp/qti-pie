/**
 * The registry item's components (`src/registry/qti-pie.tsx`, issue m3g-05) in each engine's page,
 * under React 19: each wraps the plate component of its name, so it renders the markers, ids, names
 * and text that component renders, adds its own classes to the root's, keeps a host's `className`
 * beside them and passes every other prop through.
 *
 * Every case sits under a `describe` named by the engine (`server.browser`), as in
 * `src/test/page.dom.test.ts`.
 */
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import type { ReactNode } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import type { RootOptions } from "react-dom/client";
import { commands, server, userEvent } from "vite-plus/test/browser/context";
import { configure } from "#plate/configuration.ts";
import type { Configuration } from "#plate/configuration.ts";
import type { StatusInput } from "#plate/emit/item.ts";
import { PartSwapRefused } from "#plate/emit/swap.ts";
import type { ResponseValue } from "#plate/model/values.ts";
import type { NavigationState } from "#plate/navigation.ts";
import type { Redacted } from "#plate/payload.ts";
import { ItemScope } from "#plate/react/interaction.tsx";
import { Item } from "#plate/react/item.tsx";
import { Navigation } from "#plate/react/navigation.tsx";
import { Status } from "#plate/react/status.tsx";
import {
  QtiChoice,
  QtiExtendedText,
  QtiInlineChoice,
  QtiItem,
  QtiNavigation,
  QtiStatus,
  QtiTextEntry,
} from "#plate/registry/qti-pie.tsx";
import { redact } from "#plate/render.ts";
import type { Intent } from "#plate/session/session.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";

/**
 * This area's composite fixture item holding a Choice bound to `CHOICE` and a Text Entry bound to
 * `TEXT`, relative to the package, the in-page project's root, which `commands.readFile` resolves
 * paths against.
 */
const composite = "fixtures/m3g/items/m3g-composite.xml";

/**
 * This area's fixture item holding an Inline Choice bound to `PICK` and an Extended Text bound to
 * `NOTE`.
 */
const inlineChoice = "fixtures/m3g/items/m3g-inline.xml";

/**
 * The instance every render here uses.
 */
const instance = "t1";

/**
 * The class a host gives a component, to show it is kept beside the wrapper's.
 */
const hostClass = "host-x";

/**
 * A class that names one of shadcn's theme tokens as a Tailwind utility: a text, background,
 * border, ring or shadow utility on a token the registry item's sheet reads.
 */
const tokenClass =
  /^(?:text|bg|border|ring|outline)-(?:foreground|card|card-foreground|primary|primary-foreground|muted|muted-foreground|accent|accent-foreground|destructive|border|input|ring)(?:\/\d+)?$/u;

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
 * @returns The container and the unmount, which the caller calls.
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
 * Mount a node inside an `ItemScope` over one item, as `Item` places an interaction's component.
 *
 * @param setup The item, its configuration and the node.
 * @param setup.configuration The configuration.
 * @param setup.node The component under test.
 * @param setup.redacted The item.
 * @returns The container and the unmount, which the caller calls.
 */
const mountScoped = ({
  configuration,
  node,
  redacted,
}: {
  readonly configuration: Configuration;
  readonly node: ReactNode;
  readonly redacted: Redacted;
}) =>
  mount(
    <ItemScope configuration={configuration} instance={instance} redacted={redacted}>
      {node}
    </ItemScope>,
  );

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
 * Assert that two mounted nodes hold the same values of each of `names`, in document order.
 *
 * @param actual The container of the wrapper.
 * @param expected The container of the plate component.
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
 * Find the one element under a node that matches a selector, failing the test unless it is an
 * instance of a class.
 *
 * @param node The node.
 * @param selector The selector.
 * @param kind The element's class.
 * @returns The element.
 */
const found = <E extends Element>(node: ParentNode, selector: string, kind: new () => E): E => {
  const element = node.querySelector(selector);

  assert.instanceOf(element, kind, selector);

  return element;
};

/**
 * Find the root a component renders: the element that carries its `data-slot` marker.
 *
 * @param container The container the component is mounted in.
 * @param slot The root's marker.
 * @returns The root.
 */
const rootOf = (container: ParentNode, slot: string): HTMLElement =>
  found(container, `[data-slot="${slot}"]`, HTMLElement);

/**
 * Assert what a wrapper does to its root's classes: it keeps every class the plate component
 * writes, adds at least one class of its own, and at least one of those names a shadcn token.
 *
 * @param wrapped The root a wrapper rendered.
 * @param plain The root the plate component rendered from the same props.
 * @param label What the roots are of, for a failure.
 * @returns The classes the wrapper added.
 */
const assertAddsClasses = (
  wrapped: HTMLElement,
  plain: HTMLElement,
  label: string,
): readonly string[] => {
  const added = [...wrapped.classList].filter((name) => !plain.classList.contains(name));

  for (const name of plain.classList) {
    assert.isTrue(wrapped.classList.contains(name), `${label} keeps ${name}`);
  }

  assert.isNotEmpty(added, `${label} adds classes`);
  assert.isTrue(
    added.some((name) => tokenClass.test(name)),
    `${label} adds a class on a shadcn token: ${added.join(" ")}`,
  );

  return added;
};

/**
 * List every radio button or checkbox under a node, in document order.
 *
 * @param node The node.
 * @param type The control's `type`.
 * @returns The controls.
 */
const checkablesIn = (
  node: ParentNode,
  type: "checkbox" | "radio",
): readonly HTMLInputElement[] => [
  ...node.querySelectorAll<HTMLInputElement>(`input[type="${type}"]`),
];

/**
 * Name the controls under a container that a candidate can set: the inputs but the hidden ones,
 * the selects and the textareas.
 *
 * @param container The container.
 * @returns The controls, in document order.
 */
const controlsIn = (container: ParentNode): readonly HTMLElement[] => [
  ...container.querySelectorAll<HTMLElement>('input:not([type="hidden"]), select, textarea'),
];

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
 * Type into a text control after its last character, as a candidate who clicks past the end does:
 * where a click lands depends on the control's width and the engine's font.
 *
 * @param control The input or textarea.
 * @param keys The keys to press, in `userEvent`'s syntax.
 * @returns A promise that settles when the keys were typed.
 */
const typeAtEnd = (
  control: HTMLInputElement | HTMLTextAreaElement,
  keys: string,
): Promise<void> => {
  control.focus();
  control.setSelectionRange(control.value.length, control.value.length);

  return userEvent.type(control, keys, { skipClick: true });
};

/**
 * A navigation of a nonlinear part with three items, the first current, which takes `next` and a
 * `go` to the third item and no other intent.
 */
const navigationState: NavigationState = {
  allowed: [{ kind: "next" }, { kind: "go", sequenceIndex: 3 }],
  count: 3,
  items: [
    { current: true, sequenceIndex: 1, state: "answered" },
    { current: false, sequenceIndex: 2, state: "not-answered" },
    { current: false, sequenceIndex: 3, state: "not-answered" },
  ],
  navigation: "nonlinear",
  position: 1,
  submission: "individual",
};

describe(server.browser, () => {
  describe("the registry item's components", () => {
    it.effect("[m3g-05] QtiItem renders what Item renders, with its classes on the root", () =>
      Effect.gen(function* rendersLikeItem() {
        const { configuration, redacted } = yield* redactedFixture(composite);
        const plain = mount(
          <Item configuration={configuration} options={{ instance }} redacted={redacted} />,
        );
        const wrapped = mount(
          <QtiItem configuration={configuration} options={{ instance }} redacted={redacted} />,
        );

        assert.isNull(wrapped.container.querySelector('[data-slot="item-notice"]'));
        assert.include(valuesOf(wrapped.container, "data-slot"), "choice-interaction");
        assertSameAttributes(
          wrapped.container,
          plain.container,
          ["data-slot", "id", "name", "for"],
          "QtiItem",
        );
        assert.strictEqual(wrapped.container.textContent, plain.container.textContent);
        assertAddsClasses(
          rootOf(wrapped.container, "item"),
          rootOf(plain.container, "item"),
          "QtiItem's root",
        );

        plain.unmount();
        wrapped.unmount();
      }),
    );

    it.effect("[m3g-05] a host's className is kept beside the wrapper's", () =>
      Effect.gen(function* keepsHostClass() {
        const { configuration, redacted } = yield* redactedFixture(composite);
        const alone = mount(
          <QtiItem configuration={configuration} options={{ instance }} redacted={redacted} />,
        );
        const hosted = mount(
          <QtiItem
            className={hostClass}
            configuration={configuration}
            options={{ instance }}
            redacted={redacted}
          />,
        );
        const aloneRoot = rootOf(alone.container, "item");
        const hostedRoot = rootOf(hosted.container, "item");

        assert.isFalse(aloneRoot.classList.contains(hostClass));
        assert.isTrue(hostedRoot.classList.contains(hostClass));
        assert.sameMembers([...hostedRoot.classList], [...aloneRoot.classList, hostClass]);
        alone.unmount();
        hosted.unmount();

        const plainStatus = mount(
          <Status
            configuration={configuration}
            input={{ heading: "scored", instance, score: "1" }}
          />,
        );
        const status = mount(
          <QtiStatus
            className={hostClass}
            configuration={configuration}
            input={{ heading: "scored", instance, score: "1" }}
          />,
        );
        const statusRoot = rootOf(status.container, "item-status");

        assert.isTrue(statusRoot.classList.contains(hostClass));
        assertAddsClasses(
          statusRoot,
          rootOf(plainStatus.container, "item-status"),
          "QtiStatus's root",
        );
        plainStatus.unmount();
        status.unmount();

        const plainNavigation = mount(
          <Navigation configuration={configuration} state={navigationState} />,
        );
        const navigation = mount(
          <QtiNavigation
            className={hostClass}
            configuration={configuration}
            state={navigationState}
          />,
        );
        const navigationRoot = rootOf(navigation.container, "test-navigation");

        assert.isTrue(navigationRoot.classList.contains(hostClass));
        assertAddsClasses(
          navigationRoot,
          rootOf(plainNavigation.container, "test-navigation"),
          "QtiNavigation's root",
        );
        plainNavigation.unmount();
        navigation.unmount();
      }),
    );

    it.effect("[m3g-05] QtiChoice and the other wrappers pass every state prop through", () =>
      Effect.gen(function* passesProps() {
        const { configuration, redacted } = yield* redactedFixture(composite);
        const choices: ResponseValue[] = [];
        const choice = mountScoped({
          configuration,
          node: (
            <QtiChoice
              className={hostClass}
              defaultValue={identifier("B")}
              name="pick"
              onValueChange={(changed) => {
                choices.push(changed);
              }}
              responseIdentifier="CHOICE"
            />
          ),
          redacted,
        });
        const radios = checkablesIn(choice.container, "radio");
        const radio = (value: string) =>
          found(choice.container, `input[value="${value}"]`, HTMLInputElement);

        assert.isNull(choice.container.querySelector('[data-slot="item-notice"]'));
        assert.lengthOf(radios, 2);
        for (const control of radios) {
          assert.strictEqual(control.getAttribute("name"), "pick");
        }

        assert.isTrue(radio("B").checked);
        assert.isTrue(rootOf(choice.container, "choice-interaction").classList.contains(hostClass));
        assert.deepStrictEqual(choices, []);

        yield* Effect.promise(() => userEvent.click(radio("A")));
        assert.isTrue(radio("A").checked);
        assert.deepStrictEqual(choices, [identifier("A")]);
        choice.unmount();

        const typed: ResponseValue[] = [];
        const entry = mountScoped({
          configuration,
          node: (
            <QtiTextEntry
              className={hostClass}
              onValueChange={(changed) => {
                typed.push(changed);
              }}
              responseIdentifier="TEXT"
            />
          ),
          redacted,
        });
        const input = found(entry.container, 'input[type="text"]', HTMLInputElement);

        assert.isNull(entry.container.querySelector('[data-slot="item-notice"]'));
        assert.isTrue(
          rootOf(entry.container, "text-entry-interaction").classList.contains(hostClass),
        );
        yield* Effect.promise(() => typeAtEnd(input, "h"));
        assert.deepStrictEqual(typed, [string("h")]);
        entry.unmount();

        const controlled: ResponseValue[] = [];
        const held = mountScoped({
          configuration,
          node: (
            <QtiChoice
              onValueChange={(changed) => {
                controlled.push(changed);
              }}
              responseIdentifier="CHOICE"
              value={identifier("B")}
            />
          ),
          redacted,
        });
        const heldRadio = (value: string) =>
          found(held.container, `input[value="${value}"]`, HTMLInputElement);

        assert.isTrue(heldRadio("B").checked);
        yield* Effect.promise(() => userEvent.click(heldRadio("A")));
        assert.deepStrictEqual(controlled, [identifier("A")]);
        assert.isTrue(heldRadio("B").checked);
        assert.isFalse(heldRadio("A").checked);
        held.unmount();

        const off = mountScoped({
          configuration,
          node: (
            <>
              <QtiChoice disabled responseIdentifier="CHOICE" />
              <QtiTextEntry disabled responseIdentifier="TEXT" />
            </>
          ),
          redacted,
        });
        const controls = controlsIn(off.container);

        assert.lengthOf(controls, 3);
        for (const control of controls) {
          assert.isTrue(control.matches(":disabled"), control.id);
        }

        off.unmount();

        const inline = yield* redactedFixture(inlineChoice);
        const picks: ResponseValue[] = [];
        const notes: ResponseValue[] = [];
        const pair = mountScoped({
          configuration: inline.configuration,
          node: (
            <>
              <QtiInlineChoice
                className={hostClass}
                defaultValue={identifier("Y")}
                name="pick-one"
                onValueChange={(changed) => {
                  picks.push(changed);
                }}
                responseIdentifier="PICK"
              />
              <QtiExtendedText
                className={hostClass}
                name="note-one"
                onValueChange={(changed) => {
                  notes.push(changed);
                }}
                responseIdentifier="NOTE"
              />
            </>
          ),
          redacted: inline.redacted,
        });
        const select = found(pair.container, "select", HTMLSelectElement);
        const area = found(pair.container, "textarea", HTMLTextAreaElement);

        assert.isNull(pair.container.querySelector('[data-slot="item-notice"]'));
        assert.strictEqual(select.value, "Y");
        assert.strictEqual(select.getAttribute("name"), "pick-one");
        assert.strictEqual(area.getAttribute("name"), "note-one");
        assert.isTrue(
          rootOf(pair.container, "inline-choice-interaction").classList.contains(hostClass),
        );
        assert.isTrue(
          rootOf(pair.container, "extended-text-interaction").classList.contains(hostClass),
        );

        yield* Effect.promise(() => userEvent.selectOptions(select, "Z"));
        yield* Effect.promise(() => typeAtEnd(area, "n"));
        assert.deepStrictEqual(picks, [identifier("Z")]);
        assert.deepStrictEqual(notes, [string("n")]);
        pair.unmount();

        const disabledPair = mountScoped({
          configuration: inline.configuration,
          node: (
            <>
              <QtiInlineChoice disabled responseIdentifier="PICK" />
              <QtiExtendedText disabled responseIdentifier="NOTE" />
            </>
          ),
          redacted: inline.redacted,
        });
        const disabledControls = controlsIn(disabledPair.container);

        assert.lengthOf(disabledControls, 2);
        for (const control of disabledControls) {
          assert.isTrue(control.matches(":disabled"), control.id);
        }

        disabledPair.unmount();
      }),
    );

    it.effect("[m3g-05] QtiStatus and QtiNavigation render what Status and Navigation render", () =>
      Effect.gen(function* rendersChrome() {
        const configuration = yield* configure({});
        const inputs: readonly StatusInput[] = [
          { heading: "scored", instance, score: "1" },
          {
            heading: "notAccepted",
            instance,
            messages: [{ response: "RESPONSE", text: "Choose one of the answers." }],
          },
        ];

        for (const input of inputs) {
          const plain = mount(<Status configuration={configuration} input={input} />);
          const wrapped = mount(<QtiStatus configuration={configuration} input={input} />);

          assert.isNull(
            wrapped.container.querySelector('[data-slot="item-notice"]'),
            input.heading,
          );
          assert.isAbove(valuesOf(wrapped.container, "data-slot").length, 1, input.heading);
          assertSameAttributes(
            wrapped.container,
            plain.container,
            ["data-slot", "id", "role", "aria-labelledby", "tabindex"],
            input.heading,
          );
          assert.strictEqual(wrapped.container.textContent, plain.container.textContent);
          plain.unmount();
          wrapped.unmount();
        }

        const refused = thrownBy(
          <QtiStatus
            configuration={configuration}
            input={{ heading: "scored", instance, score: "1" }}
            parts={{ statusHeading: (props) => <div {...props} /> }}
          />,
        );

        assert.instanceOf(refused, PartSwapRefused);
        assert.strictEqual(refused.interaction, "item");
        assert.strictEqual(refused.part, "statusHeading");

        const plainNavigation = mount(
          <Navigation configuration={configuration} state={navigationState} />,
        );
        const intents: Intent[] = [];
        const wrappedNavigation = mount(
          <QtiNavigation
            configuration={configuration}
            onIntent={(intent) => {
              intents.push(intent);
            }}
            state={navigationState}
          />,
        );

        assert.isNull(wrappedNavigation.container.querySelector('[data-slot="item-notice"]'));
        assert.isAbove(valuesOf(wrappedNavigation.container, "data-intent").length, 4);
        assertSameAttributes(
          wrappedNavigation.container,
          plainNavigation.container,
          [
            "data-slot",
            "data-intent",
            "data-navigation",
            "data-submission",
            "aria-label",
            "aria-current",
            "disabled",
            "id",
            "type",
          ],
          "QtiNavigation",
        );
        assert.strictEqual(
          wrappedNavigation.container.textContent,
          plainNavigation.container.textContent,
        );

        yield* Effect.promise(() =>
          userEvent.click(
            found(wrappedNavigation.container, '[data-intent="next"]', HTMLButtonElement),
          ),
        );
        assert.deepStrictEqual(intents, [{ kind: "next" }]);
        plainNavigation.unmount();
        wrappedNavigation.unmount();
      }),
    );
  });
});

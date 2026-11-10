/**
 * The shipped interactions' components and the chrome's in each engine's page, under React 19:
 * `Choice`, `TextEntry`, `ExtendedText` and `InlineChoice` project their interaction through
 * `useInteraction` with working state props (uncontrolled through `defaultValue`, controlled
 * through `value`, `name`, `disabled`), `Status` and `Navigation` project the trees `renderStatus`
 * and `renderNavigation` build, and `Navigation` calls `onIntent` with the pressed button's intent.
 *
 * Each interaction's component is mounted two ways: inside `Item`, which places it at its root and
 * mounts `options.values` as its defaults, and by itself inside an `ItemScope`, which reaches the
 * controlled mode `Item` never uses. Every case sits under a `describe` named by the engine
 * (`server.browser`), as in `src/test/page.dom.test.ts`.
 */
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { useState } from "react";
import type { ReactNode } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import type { RootOptions } from "react-dom/client";
import { commands, server, userEvent } from "vite-plus/test/browser/context";
import { configure } from "#plate/configuration.ts";
import type { Configuration } from "#plate/configuration.ts";
import type { StatusInput } from "#plate/emit/item.ts";
import { UnknownPart } from "#plate/emit/parts.ts";
import type { InteractionKey } from "#plate/emit/parts.ts";
import { PartSwapRefused } from "#plate/emit/swap.ts";
import type { ResponseValue } from "#plate/model/values.ts";
import { renderNavigation } from "#plate/navigation.ts";
import type { NavigationState } from "#plate/navigation.ts";
import type { Redacted } from "#plate/payload.ts";
import { Choice } from "#plate/react/choice.tsx";
import type {
  InteractionComponent,
  InteractionParts,
  PartOverrides,
  PartProps,
} from "#plate/react/contract.tsx";
import { ExtendedText } from "#plate/react/extended-text.tsx";
import { InlineChoice } from "#plate/react/inline-choice.tsx";
import { ItemScope } from "#plate/react/interaction.tsx";
import { Item } from "#plate/react/item.tsx";
import { Navigation } from "#plate/react/navigation.tsx";
import { isStub } from "#plate/react/parts.tsx";
import { Status } from "#plate/react/status.tsx";
import { TextEntry } from "#plate/react/text-entry.tsx";
import type { Intent } from "#plate/session/session.ts";
import { redact, render, renderStatus } from "#plate/render.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";

/**
 * The M2 fixture item holding one single Choice, bound to `RESPONSE`, relative to the package, the
 * in-page project's root, which `commands.readFile` resolves paths against.
 */
const singleChoice = "fixtures/m2/items/p1-single-choice.xml";

/**
 * The M2 fixture item holding one multiple Choice, bound to `RESPONSE`.
 */
const multipleChoice = "fixtures/m2/items/p1-multiple-choice.xml";

/**
 * The M2 fixture item holding one Text Entry of the base type `string`, bound to `RESPONSE`.
 */
const textEntry = "fixtures/m2/items/p1-text-entry.xml";

/**
 * The M2 fixture item holding one Extended Text of the base type `string`, bound to `RESPONSE`.
 */
const extendedText = "fixtures/m2/items/p2-extended-text.xml";

/**
 * This area's fixture item holding an Inline Choice bound to `PICK` and an Extended Text bound to
 * `NOTE`.
 */
const inlineChoice = "fixtures/m3g/items/m3g-inline.xml";

/**
 * This area's composite fixture item holding a Choice bound to `CHOICE` and a Text Entry bound to
 * `TEXT`.
 */
const composite = "fixtures/m3g/items/m3g-composite.xml";

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
 * The attributes a Choice's projection must carry as `render` writes them: the markers, ids, entry
 * names and label links.
 */
const linkAttributes = ["data-slot", "id", "name", "for", "aria-labelledby"] as const;

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
 * Find the one input under a node that matches a selector.
 *
 * @param node The node.
 * @param selector The selector.
 * @returns The input.
 */
const inputAt = (node: ParentNode, selector: string): HTMLInputElement =>
  found(node, selector, HTMLInputElement);

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
 * Construct a multiple identifier value.
 *
 * @param values The identifiers, in order.
 * @returns The value, of cardinality `multiple`.
 */
const identifiers = (values: readonly string[]): ResponseValue => ({
  baseType: "identifier",
  cardinality: "multiple",
  values: values.map((value) => ({ baseType: "identifier", value }) as const),
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
 * One way of mounting an interaction's component with the response it starts from: the node, and
 * the values it reports as the candidate changes the response.
 */
interface Mounted {
  readonly node: ReactNode;
  readonly reports: ResponseValue[];
  readonly via: string;
}

/**
 * Give the two ways an interaction's component is mounted uncontrolled: by itself inside an
 * `ItemScope`, with `defaultValue`, and inside `Item`, which places it at its root and mounts
 * `options.values` as its defaults. Each reports into its own list.
 *
 * @param Component The interaction's component.
 * @param setup The item, its configuration, the response the component is bound to and the value
 *   it starts from, none by default.
 * @param setup.configuration The configuration.
 * @param setup.redacted The item.
 * @param setup.response The response's identifier.
 * @param setup.value The value the response starts from.
 * @returns The two mounts.
 */
const uncontrolledMounts = <I extends InteractionKey>(
  Component: InteractionComponent<I>,
  {
    configuration,
    redacted,
    response,
    value,
  }: {
    readonly configuration: Configuration;
    readonly redacted: Redacted;
    readonly response: string;
    readonly value?: ResponseValue;
  },
): readonly Mounted[] => {
  const scoped: ResponseValue[] = [];
  const placed: ResponseValue[] = [];
  const defaults = value === undefined ? {} : { defaultValue: value };
  const values: Record<string, ResponseValue> = {};

  if (value !== undefined) {
    values[response] = value;
  }

  return [
    {
      node: (
        <ItemScope configuration={configuration} instance={instance} redacted={redacted}>
          <Component
            responseIdentifier={response}
            {...defaults}
            onValueChange={(changed) => {
              scoped.push(changed);
            }}
          />
        </ItemScope>
      ),
      reports: scoped,
      via: "ItemScope",
    },
    {
      node: (
        <Item
          configuration={configuration}
          onValueChange={(changed, next) => {
            if (changed === response) {
              placed.push(next);
            }
          }}
          options={{ instance, values }}
          redacted={redacted}
        />
      ),
      reports: placed,
      via: "Item",
    },
  ];
};

/**
 * Mount an interaction's component controlled inside an `ItemScope`, its host holding `value` in
 * state, and hand back the way to set it.
 *
 * @param Component The interaction's component.
 * @param setup The item, its configuration, the response and the value the host starts with.
 * @param setup.configuration The configuration.
 * @param setup.initial The value the host holds when it mounts.
 * @param setup.redacted The item.
 * @param setup.response The response's identifier.
 * @returns The mounted container, the values the component reported, the host's setter and the
 *   unmount.
 */
const controlledMount = <I extends InteractionKey>(
  Component: InteractionComponent<I>,
  {
    configuration,
    initial,
    redacted,
    response,
  }: {
    readonly configuration: Configuration;
    readonly initial: ResponseValue;
    readonly redacted: Redacted;
    readonly response: string;
  },
) => {
  const reports: ResponseValue[] = [];
  let set: ((value: ResponseValue) => void) | undefined;
  const Host = (): ReactNode => {
    const [value, setValue] = useState(initial);

    set = setValue;

    return (
      <ItemScope configuration={configuration} instance={instance} redacted={redacted}>
        <Component
          onValueChange={(changed) => {
            reports.push(changed);
          }}
          responseIdentifier={response}
          value={value}
        />
      </ItemScope>
    );
  };
  const { container, unmount } = mount(<Host />);

  return {
    container,
    reports,
    set: (value: ResponseValue): void => {
      assert.isDefined(set);
      flushSync(() => {
        set?.(value);
      });
    },
    unmount,
  };
};

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

/**
 * Press a button as a candidate does: a click on the element, or, for a disabled button, which a
 * browser's click never reaches, the element's own `click`.
 *
 * @param button The button.
 * @returns A promise that settles when the button was pressed.
 */
const press = async (button: HTMLElement): Promise<void> => {
  if (button.matches(":disabled")) {
    button.click();

    return;
  }

  await userEvent.click(button);
};

describe(server.browser, () => {
  describe("Choice", () => {
    it.effect(
      "[Q-2] Choice inside Item projects the markers, ids, names and label links render writes",
      () =>
        Effect.gen(function* projectsRender() {
          for (const path of [singleChoice, multipleChoice]) {
            const { configuration, redacted } = yield* redactedFixture(path);
            const written = parsed(
              Result.getOrThrow(render(redacted, configuration, { instance })).html,
            );
            const { container, unmount } = mount(
              <Item configuration={configuration} options={{ instance }} redacted={redacted} />,
            );

            assert.include(valuesOf(container, "data-slot"), "choice-interaction", path);
            assert.isNull(container.querySelector('[data-slot="item-notice"]'), path);
            assertSameAttributes(container, written, linkAttributes, path);
            assert.strictEqual(container.textContent, written.textContent, path);
            unmount();
          }
        }),
    );

    it.effect("[Q-2] Choice is uncontrolled through defaultValue", () =>
      Effect.gen(function* uncontrolled() {
        const { configuration, redacted } = yield* redactedFixture(singleChoice);

        for (const { node, reports, via } of uncontrolledMounts(Choice, {
          configuration,
          redacted,
          response: "RESPONSE",
          value: identifier("C"),
        })) {
          const { container, unmount } = mount(node);
          const radio = (choice: string) => inputAt(container, `input[value="${choice}"]`);

          assert.isNull(container.querySelector('[data-slot="item-notice"]'), via);
          assert.isTrue(radio("C").checked, via);
          assert.isFalse(radio("A").checked, via);
          assert.deepStrictEqual(reports, [], via);

          yield* Effect.promise(() => userEvent.click(radio("A")));
          assert.isTrue(radio("A").checked, via);
          assert.isFalse(radio("C").checked, via);
          assert.deepStrictEqual(reports, [identifier("A")], via);
          unmount();
        }
      }),
    );

    it.effect("[Q-2] Choice is controlled through value", () =>
      Effect.gen(function* controlled() {
        const { configuration, redacted } = yield* redactedFixture(singleChoice);
        const { container, reports, set, unmount } = controlledMount(Choice, {
          configuration,
          initial: identifier("B"),
          redacted,
          response: "RESPONSE",
        });
        const radio = (choice: string) => inputAt(container, `input[value="${choice}"]`);

        assert.isNull(container.querySelector('[data-slot="item-notice"]'));
        assert.isTrue(radio("B").checked);
        assert.isFalse(radio("A").checked);

        yield* Effect.promise(() => userEvent.click(radio("A")));
        assert.deepStrictEqual(reports, [identifier("A")]);
        assert.isTrue(radio("B").checked);
        assert.isFalse(radio("A").checked);

        set(identifier("A"));
        assert.isTrue(radio("A").checked);
        assert.isFalse(radio("B").checked);
        assert.deepStrictEqual(reports, [identifier("A")]);

        set(identifier("D"));
        assert.isTrue(radio("D").checked);
        assert.isFalse(radio("A").checked);
        unmount();
      }),
    );

    it.effect("[Q-2] a multiple Choice reports multiple cardinality in document order", () =>
      Effect.gen(function* reportsMultiple() {
        const { configuration, redacted } = yield* redactedFixture(multipleChoice);

        for (const { node, reports, via } of uncontrolledMounts(Choice, {
          configuration,
          redacted,
          response: "RESPONSE",
        })) {
          const { container, unmount } = mount(node);
          const boxes = checkablesIn(container, "checkbox");
          const [first, , third] = boxes.map((box) => box.value);

          assert.isNotEmpty(boxes, via);
          assert.isDefined(first, via);
          assert.isDefined(third, via);

          yield* Effect.promise(() => userEvent.click(boxes[2] ?? assert.fail("no third box")));
          assert.deepStrictEqual(reports, [identifiers([third ?? ""])], via);

          yield* Effect.promise(() => userEvent.click(boxes[0] ?? assert.fail("no first box")));
          assert.deepStrictEqual(
            reports,
            [identifiers([third ?? ""]), identifiers([first ?? "", third ?? ""])],
            via,
          );
          unmount();
        }
      }),
    );
  });

  describe("Text Entry", () => {
    it.effect("[Q-20] Text Entry is uncontrolled and reports typed text", () =>
      Effect.gen(function* uncontrolled() {
        const { configuration, redacted } = yield* redactedFixture(textEntry);

        for (const { node, reports, via } of uncontrolledMounts(TextEntry, {
          configuration,
          redacted,
          response: "RESPONSE",
          value: string("7"),
        })) {
          const { container, unmount } = mount(node);
          const input = inputAt(container, 'input[type="text"]');

          assert.isNull(container.querySelector('[data-slot="item-notice"]'), via);
          assert.strictEqual(input.value, "7", via);
          assert.deepStrictEqual(reports, [], via);

          yield* Effect.promise(() => typeAtEnd(input, "5"));
          assert.strictEqual(input.value, "75", via);
          assert.deepStrictEqual(reports, [string("75")], via);
          unmount();
        }
      }),
    );

    it.effect("[Q-20] Text Entry is controlled through value", () =>
      Effect.gen(function* controlled() {
        const { configuration, redacted } = yield* redactedFixture(textEntry);
        const { container, reports, set, unmount } = controlledMount(TextEntry, {
          configuration,
          initial: string("warm"),
          redacted,
          response: "RESPONSE",
        });
        const input = inputAt(container, 'input[type="text"]');

        assert.isNull(container.querySelector('[data-slot="item-notice"]'));
        assert.strictEqual(input.value, "warm");

        yield* Effect.promise(() => typeAtEnd(input, "x"));
        assert.deepStrictEqual(reports, [string("warmx")]);
        assert.strictEqual(input.value, "warm");

        set(string("warmx"));
        assert.strictEqual(input.value, "warmx");
        assert.deepStrictEqual(reports, [string("warmx")]);

        set(string("cold"));
        assert.strictEqual(input.value, "cold");
        unmount();
      }),
    );
  });

  describe("Extended Text", () => {
    it.effect(
      "[Q-5] Extended Text shows defaultValue and reports typed text with LF line breaks",
      () =>
        Effect.gen(function* showsAndReports() {
          const { configuration, redacted } = yield* redactedFixture(extendedText);

          for (const { node, reports, via } of uncontrolledMounts(ExtendedText, {
            configuration,
            redacted,
            response: "RESPONSE",
            value: string("a\r\nb"),
          })) {
            const { container, unmount } = mount(node);
            const area = found(container, "textarea", HTMLTextAreaElement);

            assert.isNull(container.querySelector('[data-slot="item-notice"]'), via);
            assert.strictEqual(area.value, "a\nb", via);
            assert.deepStrictEqual(reports, [], via);

            yield* Effect.promise(() => typeAtEnd(area, "{Enter}c"));
            assert.strictEqual(area.value, "a\nb\nc", via);
            assert.deepStrictEqual(reports.at(-1), string("a\nb\nc"), via);
            for (const reported of reports) {
              assert.notInclude(JSON.stringify(reported), "\\r", via);
            }
            unmount();
          }
        }),
    );
  });

  describe("Inline Choice", () => {
    it.effect("[Q-12] Inline Choice selects defaultValue and reports a changed option", () =>
      Effect.gen(function* selectsAndReports() {
        const { configuration, redacted } = yield* redactedFixture(inlineChoice);

        for (const { node, reports, via } of uncontrolledMounts(InlineChoice, {
          configuration,
          redacted,
          response: "PICK",
          value: identifier("Y"),
        })) {
          const { container, unmount } = mount(node);
          const select = found(container, "select", HTMLSelectElement);

          assert.isNull(container.querySelector('[data-slot="item-notice"]'), via);
          assert.strictEqual(select.value, "Y", via);
          assert.strictEqual(select.selectedOptions[0]?.textContent, "early in the morning", via);
          assert.deepStrictEqual(reports, [], via);

          yield* Effect.promise(() => userEvent.selectOptions(select, "Z"));
          assert.strictEqual(select.value, "Z", via);
          assert.deepStrictEqual(reports, [identifier("Z")], via);
          unmount();
        }
      }),
    );
  });

  describe("state props", () => {
    it.effect("[Q-2] [Q-20] name and disabled reach the controls", () =>
      Effect.gen(function* reachControls() {
        const { configuration, redacted } = yield* redactedFixture(composite);
        const names = { CHOICE: "pick" };
        const viaOptions = mount(
          <Item
            configuration={configuration}
            options={{ disabled: true, instance, names }}
            redacted={redacted}
          />,
        );
        const viaProps = mount(
          <ItemScope configuration={configuration} instance={instance} redacted={redacted}>
            <Choice disabled name="pick" responseIdentifier="CHOICE" />
            <TextEntry disabled responseIdentifier="TEXT" />
          </ItemScope>,
        );

        for (const [via, { container, unmount }] of [
          ["Item options", viaOptions],
          ["component props", viaProps],
        ] as const) {
          const radios = checkablesIn(container, "radio");

          assert.isNull(container.querySelector('[data-slot="item-notice"]'), via);
          assert.lengthOf(radios, 2, via);
          for (const radio of radios) {
            assert.strictEqual(radio.getAttribute("name"), "pick", via);
          }

          const controls = controlsIn(container);

          assert.lengthOf(controls, 3, via);
          for (const control of controls) {
            assert.isTrue(control.matches(":disabled"), `${via} ${control.id}`);
          }

          unmount();
        }
      }),
    );
  });

  describe("chrome", () => {
    it.effect("[m3g-02] Status projects the region renderStatus writes", () =>
      Effect.gen(function* projectsStatus() {
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
          const written = parsed(Result.getOrThrow(renderStatus(input, configuration)).html);
          const { container, unmount } = mount(
            <Status configuration={configuration} input={input} />,
          );

          assert.isNull(container.querySelector('[data-slot="item-notice"]'), input.heading);
          assert.isAbove(valuesOf(container, "data-slot").length, 1, input.heading);
          assertSameAttributes(
            container,
            written,
            ["data-slot", "id", "role", "aria-labelledby", "tabindex"],
            input.heading,
          );
          assert.strictEqual(container.textContent, written.textContent, input.heading);
          unmount();
        }
      }),
    );

    it.effect("[m3g-02] Navigation projects renderNavigation's tree and calls onIntent", () =>
      Effect.gen(function* projectsNavigation() {
        const configuration = yield* configure({});
        const written = parsed(Result.getOrThrow(renderNavigation(navigationState, configuration)));
        const intents: Intent[] = [];
        const { container, unmount } = mount(
          <Navigation
            configuration={configuration}
            onIntent={(intent) => {
              intents.push(intent);
            }}
            state={navigationState}
          />,
        );
        const button = (intent: string) =>
          found(container, `[data-intent="${intent}"]`, HTMLButtonElement);

        assert.isNull(container.querySelector('[data-slot="item-notice"]'));
        assert.isAbove(valuesOf(container, "data-intent").length, 4);
        assertSameAttributes(
          container,
          written,
          [
            "data-slot",
            "data-intent",
            "data-navigation",
            "data-submission",
            "aria-label",
            "aria-current",
            "disabled",
            "type",
          ],
          "navigation",
        );
        assert.strictEqual(container.textContent, written.textContent);

        yield* Effect.promise(() => press(button("next")));
        assert.deepStrictEqual(intents, [{ kind: "next" }]);

        yield* Effect.promise(() => press(button("go:3")));
        assert.deepStrictEqual(intents, [{ kind: "next" }, { kind: "go", sequenceIndex: 3 }]);

        for (const disabled of ["previous", "go:2", "submit-item", "end-part"]) {
          assert.isTrue(button(disabled).disabled, disabled);
          yield* Effect.promise(() => press(button(disabled)));
        }

        assert.deepStrictEqual(intents, [{ kind: "next" }, { kind: "go", sequenceIndex: 3 }]);
        unmount();

        const submitted: Intent[] = [];
        const posting = mount(
          <Navigation
            configuration={configuration}
            onIntent={(intent) => {
              submitted.push(intent);
            }}
            parts={{
              next: ({ children, ...props }) => (
                <button
                  {...props}
                  name="t1.intent"
                  type="submit"
                  value={String(props["data-intent"])}
                >
                  {children}
                </button>
              ),
            }}
            state={navigationState}
          />,
        );
        const next = found(posting.container, '[data-intent="next"]', HTMLButtonElement);

        assert.strictEqual(next.type, "submit");
        assert.strictEqual(next.value, "next");
        assert.strictEqual(next.dataset["slot"], "test-navigation-next");
        yield* Effect.promise(() => press(next));
        assert.deepStrictEqual(submitted, [{ kind: "next" }]);
        posting.unmount();

        const refused = thrownBy(
          <Navigation
            configuration={configuration}
            parts={{ next: (props) => <div {...props} /> }}
            state={navigationState}
          />,
        );

        assert.instanceOf(refused, PartSwapRefused);
        assert.strictEqual(refused.cause, "root-not-allowed");
        assert.strictEqual(refused.interaction, "test-navigation");
        assert.strictEqual(refused.part, "next");

        const unknown: InteractionParts<"test-navigation"> = Object.fromEntries([
          ["nope", (props: PartProps) => <div {...props} />],
        ]);
        const unknownError = thrownBy(
          <Navigation configuration={configuration} parts={unknown} state={navigationState} />,
        );

        assert.instanceOf(unknownError, UnknownPart);
        assert.strictEqual(unknownError.interaction, "test-navigation");
        assert.deepStrictEqual(unknownError.part, Option.some("nope"));
      }),
    );

    it.effect("[m3g-02] a refused Status swap is thrown as the core's error", () =>
      Effect.gen(function* refusesSwap() {
        const configuration = yield* configure({});
        const input: StatusInput = { heading: "scored", instance, score: "1" };
        const parts: InteractionParts<"item"> = { statusHeading: (props) => <div {...props} /> };
        const error = thrownBy(
          <Status configuration={configuration} input={input} parts={parts} />,
        );

        assert.instanceOf(error, PartSwapRefused);
        assert.strictEqual(error.cause, "root-not-allowed");
        assert.strictEqual(error.interaction, "item");
        assert.strictEqual(error.part, "statusHeading");

        const unknown: PartOverrides["item"] = Object.fromEntries([
          ["nope", (props: PartProps) => <div {...props} />],
        ]);
        const unknownError = thrownBy(
          <Status configuration={configuration} input={input} parts={unknown} />,
        );

        assert.instanceOf(unknownError, UnknownPart);
        assert.strictEqual(unknownError.interaction, "item");
        assert.deepStrictEqual(unknownError.part, Option.some("nope"));
      }),
    );

    it("[m3g-02] the six components are no longer stubs", () => {
      const components = {
        Choice,
        ExtendedText,
        InlineChoice,
        Navigation,
        Status,
        TextEntry,
      };

      for (const [name, component] of Object.entries(components)) {
        assert.isFalse(isStub(component), name);
      }
    });
  });
});

/**
 * `DefaultSubmit` in each engine's page, under React 19: it renders the hidden default submit
 * carrying only what its props give, and, first in a form, it is the button HTML's implicit
 * submission fires at when Enter is pressed in a text field, while a click on a later submit button
 * still submits through that button.
 *
 * Every case sits under a `describe` named by the engine (`server.browser`), as in
 * `src/react/contract.dom.test.tsx`.
 */
import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import type { ReactNode, SyntheticEvent } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { server, userEvent } from "vite-plus/test/browser/context";
import { DefaultSubmit } from "#plate/react/index.tsx";

/**
 * Mount a React node into a fresh container at the end of the page's body, synchronously.
 *
 * @param node The node.
 * @returns The container and its unmount, which the caller calls.
 */
const mount = (node: ReactNode) => {
  const container = document.createElement("div");

  document.body.append(container);

  const root = createRoot(container);

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
 * Read the one `button` a container holds, failing the test for any other count.
 *
 * @param container The mounted container.
 * @returns The button.
 */
const buttonOf = (container: HTMLElement): HTMLButtonElement => {
  const buttons = container.querySelectorAll("button");

  assert.strictEqual(buttons.length, 1);

  return buttons[0] ?? assert.fail("the container holds no button");
};

/**
 * List the names of an element's attributes, sorted.
 *
 * @param element The element.
 * @returns Its attribute names.
 */
const attributeNames = (element: Element): readonly string[] =>
  element.getAttributeNames().toSorted();

describe(server.browser, () => {
  it("[W0-DEFAULT-SUBMIT] DefaultSubmit renders a hidden submit button carrying only what its props give", () => {
    const bare = mount(<DefaultSubmit />);
    const button = buttonOf(bare.container);

    assert.strictEqual(button.getAttribute("type"), "submit");
    assert.isTrue(button.hasAttribute("hidden"));
    assert.strictEqual(button.textContent, "Submit");
    assert.deepStrictEqual(attributeNames(button), ["hidden", "type"]);
    bare.unmount();

    const given = mount(<DefaultSubmit disabled name="s.intent" value="go" />);
    const carried = buttonOf(given.container);

    assert.strictEqual(carried.getAttribute("type"), "submit");
    assert.isTrue(carried.hasAttribute("hidden"));
    assert.isTrue(carried.hasAttribute("disabled"));
    assert.strictEqual(carried.getAttribute("name"), "s.intent");
    assert.strictEqual(carried.getAttribute("value"), "go");
    assert.deepStrictEqual(attributeNames(carried), [
      "disabled",
      "hidden",
      "name",
      "type",
      "value",
    ]);
    given.unmount();
  });

  it.effect(
    "[W0-DEFAULT-SUBMIT] in a form with DefaultSubmit first, Enter in a text field submits through it, and a click submits through the clicked button",
    () =>
      Effect.gen(function* enterAndClick() {
        const submitters: (HTMLElement | null)[] = [];
        /**
         * Record a submission's submitter and stop the page from navigating.
         *
         * @param event React's submit event.
         */
        const record = (event: SyntheticEvent<HTMLFormElement>): void => {
          event.preventDefault();
          submitters.push(
            event.nativeEvent instanceof SubmitEvent ? event.nativeEvent.submitter : null,
          );
        };
        const { container, unmount } = mount(
          <form onSubmit={record}>
            <DefaultSubmit />
            <input type="text" />
            <button type="submit">Send</button>
          </form>,
        );
        const input = container.querySelector("input") ?? assert.fail("the form holds no input");
        const [hidden, send] = container.querySelectorAll("button");

        assert.isDefined(hidden);
        assert.isDefined(send);
        assert.isTrue(hidden?.hasAttribute("hidden"));
        assert.strictEqual(send?.textContent, "Send");

        yield* Effect.promise(() => userEvent.click(input));
        yield* Effect.promise(() => userEvent.keyboard("{Enter}"));

        assert.lengthOf(submitters, 1);
        assert.strictEqual(submitters[0], hidden);

        yield* Effect.promise(() => userEvent.click(send ?? assert.fail("no Send button")));

        assert.lengthOf(submitters, 2);
        assert.strictEqual(submitters[1], send);
        unmount();
      }),
  );
});

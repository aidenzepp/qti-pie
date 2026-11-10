/**
 * The React 19 host fixture in each engine's page (issue m3g-07, criterion 10): `ReactHost` and
 * `CoreHost` each put one Choice item in the host's own `<form action={…}>` under a shadcn theme,
 * score the post with plate's functions and show the result with `<Status>`.
 *
 * The item is the M2 single Choice (`RESPONSE`, correct `B`, `match_correct`), read with
 * `commands.readFile`. The sheet is `src/styles.css` as text in a `<style>`, and the shadcn theme
 * is this file's own `<style>` that sets the tokens at `:root`, so plate's sheet and the host's
 * theme meet in the page as they do in a host. Colours are compared by `getComputedStyle`, never by
 * reading the sheet. Every case sits under a `describe` named by the engine (`server.browser`).
 */
import { assert, describe, it, vi } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import type { ComponentProps, ReactNode } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import { commands, server, userEvent } from "vite-plus/test/browser/context";
import { acceptedItem, configure, open, redact, render } from "#plate/index.ts";
import { CoreHost, ReactHost } from "#plate/hosts/react.tsx";
import { message } from "#plate/messages.ts";

/**
 * The M2 fixture item holding one single Choice, bound to `RESPONSE`, whose correct response is
 * `B`, relative to the package, the in-page project's root, which `commands.readFile` resolves
 * paths against.
 */
const singleChoice = "fixtures/m2/items/p1-single-choice.xml";

/**
 * Where plate's sheet sits under the package's root.
 */
const sheetPath = "src/styles.css";

/**
 * The instance every render here uses.
 */
const instance = "q1";

/**
 * The colour the theme gives `--primary`, which a checked choice's indicator takes as its
 * `background-color`, as `getComputedStyle` writes it.
 */
const primary = "rgb(200, 30, 30)";

/**
 * A shadcn theme as a host writes it: the tokens plate's sheet reads, set at `:root`, which plate
 * never sets. Only `--primary` departs from shadcn's neutral defaults.
 */
const shadcnTheme = `:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --card: oklch(1 0 0);
  --card-foreground: oklch(0.145 0 0);
  --primary: ${primary};
  --primary-foreground: oklch(0.985 0 0);
  --muted: oklch(0.97 0 0);
  --muted-foreground: oklch(0.556 0 0);
  --accent: oklch(0.97 0 0);
  --accent-foreground: oklch(0.205 0 0);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0 0);
  --input: oklch(0.922 0 0);
  --ring: oklch(0.708 0 0);
}
body {
  background-color: var(--background);
  color: var(--foreground);
}
`;

/**
 * The transparent black `getComputedStyle` gives a `background-color` nothing sets.
 */
const transparent = "rgba(0, 0, 0, 0)";

/**
 * One host component: `ReactHost` and `CoreHost` take the same props.
 */
type HostComponent = (props: ComponentProps<typeof ReactHost>) => ReactNode;

/**
 * The two compositions, by name.
 */
const hosts: readonly (readonly [name: string, Host: HostComponent])[] = [
  ["ReactHost", ReactHost],
  ["CoreHost", CoreHost],
];

/**
 * Open the fixture item and configure the default configuration.
 *
 * @returns The accepted item and the configuration every host here is given.
 */
const hostSetup = Effect.gen(function* hostSetup() {
  const bytes = new TextEncoder().encode(
    yield* Effect.promise(() => commands.readFile(singleChoice)),
  );
  const accepted = Option.getOrThrow(acceptedItem(yield* open(singleChoice, bytes)));
  const configuration = yield* configure({});

  return { accepted, configuration };
});

/**
 * Put some CSS in a `<style>` in the page's head until the test's scope closes.
 *
 * @param css The stylesheet's text.
 * @returns The style element.
 */
const styled = (css: string) =>
  Effect.acquireRelease(
    Effect.sync(() => {
      const style = document.createElement("style");

      style.textContent = css;
      document.head.append(style);

      return style;
    }),
    (style) =>
      Effect.sync(() => {
        style.remove();
      }),
  );

/**
 * Read plate's sheet and load it into the page as a `<style>` until the test's scope closes.
 *
 * @returns The sheet's text and the style element that holds it, whose `sheet` is the stylesheet
 *   the engine parsed.
 */
const sheetLoaded = Effect.gen(function* sheetLoaded() {
  const text = yield* Effect.promise(() => commands.readFile(sheetPath));
  const style = yield* styled(text);

  return { style, text };
});

/**
 * Mount a host into a fresh container at the end of the page's body, synchronously, until the
 * test's scope closes.
 *
 * @param Host The host component.
 * @param props The accepted item and the configuration it is given.
 * @param props.accepted The accepted item.
 * @param props.configuration The configuration.
 * @returns The container.
 */
const hostMounted = (Host: HostComponent, props: Omit<ComponentProps<HostComponent>, "instance">) =>
  Effect.acquireRelease(
    Effect.sync(() => {
      const container = document.createElement("div");

      document.body.append(container);

      const root = createRoot(container);

      flushSync(() => {
        root.render(<Host {...props} instance={instance} />);
      });

      return { container, root };
    }),
    ({ container, root }) =>
      Effect.sync(() => {
        root.unmount();
        container.remove();
      }),
  ).pipe(Effect.map(({ container }) => container));

/**
 * Put an element that holds focus but is not in the tab order at the end of the page's body until
 * the test's scope closes, so the first key press starts from a known place inside the page, and
 * the next element a Tab reaches is the first one mounted after it.
 *
 * @returns The focused element.
 */
const focusStart = Effect.acquireRelease(
  Effect.sync(() => {
    const element = document.createElement("div");

    element.tabIndex = -1;
    document.body.append(element);
    element.focus();

    return element;
  }),
  (element) =>
    Effect.sync(() => {
      element.remove();
    }),
);

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
 * List the submit buttons a form holds, as the browser counts them: a `button` of type `submit`,
 * which is a `button` with no `type` too, and an `input` that submits.
 *
 * @param form The form.
 * @returns Each, in document order.
 */
const submitButtonsIn = (form: HTMLFormElement): readonly Element[] =>
  [...form.elements].filter(
    (control) =>
      (control instanceof HTMLButtonElement && control.type === "submit") ||
      (control instanceof HTMLInputElement && ["image", "submit"].includes(control.type)),
  );

/**
 * Choose a choice as a candidate does: a click on its label, whose indicator is the visible mark,
 * since the Control is hidden from sight only.
 *
 * @param container The mounted host.
 * @param choice The choice's identifier.
 * @returns The Control, once it is checked.
 */
const chosen = (container: ParentNode, choice: string) =>
  Effect.gen(function* choosing() {
    const control = found(container, `input[type="radio"][value="${choice}"]`, HTMLInputElement);
    const label = found(container, `label[for="${control.id}"]`, HTMLLabelElement);

    yield* Effect.promise(() => userEvent.click(label));
    assert.isTrue(control.checked, `choosing ${choice} checks its Control`);

    return control;
  });

/**
 * Press the host's submit button with a click.
 *
 * @param container The mounted host.
 * @returns A promise that settles when the button was pressed.
 */
const submitted = (container: ParentNode) =>
  Effect.promise(() =>
    userEvent.click(found(container, 'form button[type="submit"]', HTMLButtonElement)),
  );

/**
 * Wait for the page's Status region, which the host shows once its action has scored a post, and
 * read it: the text of its heading and of the paragraph under it.
 *
 * @param container The mounted host.
 * @returns The region, its heading's text and its paragraph's text, none when it shows none.
 */
const statusShown = (container: ParentNode) =>
  Effect.promise(() =>
    vi.waitFor(
      () => {
        const region = found(container, '[data-slot="item-status"]', HTMLElement);

        return {
          detail: region.querySelector("p")?.textContent ?? undefined,
          heading: found(region, '[data-slot="item-status-heading"]', HTMLElement).textContent,
          region,
        };
      },
      { timeout: 10_000 },
    ),
  );

/**
 * Choose a choice in a host, submit its form and read the Status region it answers with, and which
 * choices the page shows as checked once it has.
 *
 * @param Host The host component.
 * @param choice The choice's identifier.
 * @returns What the Status region says, and the identifiers of the checked choices.
 */
const scoreOf = (Host: HostComponent, choice: string) =>
  Effect.scoped(
    Effect.gen(function* scoring() {
      const { accepted, configuration } = yield* hostSetup;
      const container = yield* hostMounted(Host, { accepted, configuration });

      yield* chosen(container, choice);
      yield* submitted(container);

      const { detail, heading } = yield* statusShown(container);
      const checked = [...container.querySelectorAll<HTMLInputElement>('input[type="radio"]')]
        .filter((radio) => radio.checked)
        .map((radio) => radio.value);

      return { checked, detail, heading };
    }),
  );

/**
 * Choose `B` in a host and read the computed `background-color` of the checked choice's indicator.
 *
 * @param Host The host component.
 * @returns The computed colour.
 */
const checkedIndicatorColour = (Host: HostComponent) =>
  Effect.scoped(
    Effect.gen(function* colouring() {
      const { accepted, configuration } = yield* hostSetup;
      const container = yield* hostMounted(Host, { accepted, configuration });
      const row = (yield* chosen(container, "B")).closest(
        '[data-slot="choice-interaction-choice"]',
      );

      assert.instanceOf(row, HTMLElement);

      return getComputedStyle(found(row, '[data-slot="choice-interaction-indicator"]', HTMLElement))
        .backgroundColor;
    }),
  );

/**
 * List the selectors of every style rule in a sheet, nested rules and rules inside an at-rule
 * included.
 *
 * @param rules The sheet's rules.
 * @returns Each style rule's selector text.
 */
const selectorsIn = (rules: Iterable<CSSRule>): readonly string[] =>
  [...rules].flatMap((rule) => [
    ...(rule instanceof CSSStyleRule ? [rule.selectorText] : []),
    ...(rule instanceof CSSGroupingRule ? selectorsIn(rule.cssRules) : []),
  ]);

/**
 * Remove a stylesheet's block comments, so a mention of `:root` in prose is not a rule.
 *
 * @param css The stylesheet's text.
 * @returns The text without its comments.
 */
const withoutComments = (css: string): string => css.replaceAll(/\/\*[\s\S]*?\*\//gu, "");

describe(server.browser, () => {
  it.effect("[m3g-07] ReactHost renders the item through Item inside the host's form", () =>
    Effect.gen(function* rendersThroughItem() {
      const { accepted, configuration } = yield* hostSetup;

      yield* sheetLoaded;

      const container = yield* hostMounted(ReactHost, { accepted, configuration });
      const form = found(container, "form", HTMLFormElement);
      const written = parsed(
        Result.getOrThrow(
          render(redact(accepted, undefined, configuration), configuration, { instance }),
        ).html,
      );
      const [button, ...others] = submitButtonsIn(form);

      assert.lengthOf(container.querySelectorAll("form"), 1);
      assert.strictEqual(form.getAttribute("autocomplete"), "off");
      assert.lengthOf(others, 0);
      assert.instanceOf(button, HTMLButtonElement);
      assert.isNull(button.closest('[data-slot="item"]'), "the button is the host's");
      for (const name of ["data-slot", "id", "name"]) {
        assert.deepStrictEqual(valuesOf(form, name), valuesOf(written, name), name);
      }
    }),
  );

  it.effect("[m3g-07] ReactHost scores the correct choice 1", () =>
    Effect.gen(function* scoresCorrect() {
      const { configuration } = yield* hostSetup;

      yield* sheetLoaded;

      const { checked, detail, heading } = yield* scoreOf(ReactHost, "B");

      assert.strictEqual(heading, message(configuration.locale, "scored"));
      assert.strictEqual(detail, message(configuration.locale, "score", { score: "1" }));
      assert.deepStrictEqual(checked, ["B"], "the scored page keeps the answer");
    }),
  );

  it.effect("[m3g-07] ReactHost scores a wrong choice 0", () =>
    Effect.gen(function* scoresWrong() {
      const { configuration } = yield* hostSetup;

      yield* sheetLoaded;

      const { checked, detail, heading } = yield* scoreOf(ReactHost, "A");

      assert.strictEqual(heading, message(configuration.locale, "scored"));
      assert.strictEqual(detail, message(configuration.locale, "score", { score: "0" }));
      assert.deepStrictEqual(checked, ["A"], "the scored page keeps the answer");
    }),
  );

  it.effect("[m3g-07] ReactHost is answered and submitted by keyboard alone", () =>
    Effect.gen(function* byKeyboard() {
      const { accepted, configuration } = yield* hostSetup;

      yield* sheetLoaded;

      const start = yield* focusStart;
      const container = yield* hostMounted(ReactHost, { accepted, configuration });
      const radios = [...container.querySelectorAll<HTMLInputElement>('input[type="radio"]')];
      const button = found(container, 'form button[type="submit"]', HTMLButtonElement);

      assert.strictEqual(document.activeElement, start);
      yield* Effect.promise(() => userEvent.tab());
      assert.strictEqual(document.activeElement, radios[0], "Tab reaches the radio group");
      yield* Effect.promise(() => userEvent.keyboard("{ArrowDown}"));

      const checked = radios.filter((radio) => radio.checked);

      assert.lengthOf(checked, 1, "an arrow key checks one choice");
      assert.strictEqual(document.activeElement, checked[0]);
      yield* Effect.promise(() => userEvent.tab());
      assert.strictEqual(document.activeElement, button, "Tab reaches the host's button");
      yield* Effect.promise(() => userEvent.keyboard("{Enter}"));

      const { detail, heading, region } = yield* statusShown(container);

      assert.strictEqual(heading, message(configuration.locale, "scored"));
      assert.strictEqual(
        detail,
        message(configuration.locale, "score", { score: checked[0]?.value === "B" ? "1" : "0" }),
      );
      assert.strictEqual(document.activeElement, region, "the result takes focus");
    }),
  );

  it.effect("[m3g-07] CoreHost scores the same as ReactHost", () =>
    Effect.gen(function* scoresAlike() {
      const { configuration } = yield* hostSetup;

      yield* sheetLoaded;

      const scored = (score: string, checked: string) => ({
        checked: [checked],
        detail: message(configuration.locale, "score", { score }),
        heading: message(configuration.locale, "scored"),
      });
      const correct = yield* scoreOf(CoreHost, "B");
      const wrong = yield* scoreOf(CoreHost, "A");

      assert.deepStrictEqual(correct, scored("1", "B"));
      assert.deepStrictEqual(wrong, scored("0", "A"));
      assert.deepStrictEqual(correct, yield* scoreOf(ReactHost, "B"));
      assert.deepStrictEqual(wrong, yield* scoreOf(ReactHost, "A"));
    }),
  );

  it.effect("[m3g-07] the shadcn theme reaches a checked choice in both compositions", () =>
    Effect.gen(function* themed() {
      yield* sheetLoaded;
      yield* styled(shadcnTheme);

      for (const [name, Host] of hosts) {
        assert.strictEqual(yield* checkedIndicatorColour(Host), primary, name);
      }
    }),
  );

  it.effect("[m3g-07] without the theme the sheet's fallback applies", () =>
    Effect.gen(function* unthemed() {
      yield* sheetLoaded;

      const react = yield* checkedIndicatorColour(ReactHost);
      const core = yield* checkedIndicatorColour(CoreHost);

      assert.notStrictEqual(react, primary);
      assert.notStrictEqual(react, transparent, "the sheet's fallback fills the indicator");
      assert.strictEqual(core, react);
    }),
  );

  it.effect("[m3g-07] the fixture sets no token from plate's side", () =>
    Effect.gen(function* setsNoToken() {
      const { style, text } = yield* sheetLoaded;
      const { sheet: theme } = yield* styled(shadcnTheme);
      const rootSelectors = (rules: Iterable<CSSRule>) =>
        selectorsIn(rules).filter((selector) => selector.includes(":root"));

      assert.isAbove(selectorsIn(style.sheet?.cssRules ?? []).length, 0, "the sheet has rules");
      assert.deepStrictEqual(rootSelectors(style.sheet?.cssRules ?? []), []);
      assert.notMatch(withoutComments(text), /:root/u);
      assert.deepStrictEqual(
        rootSelectors(theme?.cssRules ?? []),
        [":root"],
        "the same reading finds the host's theme, so the pin can fail",
      );
    }),
  );
});

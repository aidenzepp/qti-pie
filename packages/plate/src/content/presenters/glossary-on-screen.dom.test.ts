/**
 * A glossary definition in each engine's page: the `details` the glossary-on-screen presenter
 * writes opens and closes by Enter and by Space on its `summary` and by a pointer click, with no
 * script of plate's, and nothing in plate moves focus, on load or when it opens. The page loads no
 * stylesheet, so what it measures is what the browser does with the native element alone.
 *
 * It runs only inside the engine's page, under the in-page project of `vite.browser.config.ts`
 * (`test:browser`), and never in Node. Every case sits under a `describe` named by the engine
 * (`server.browser`), as in `src/test/page.dom.test.ts`. Issue m3e-08, feature A-15.
 */
/// <reference types="vite-plus/client" />
import { afterEach, assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { commands, server, userEvent } from "vite-plus/test/browser/context";
import { acceptedItem, configure, noSupports, open, redact, render } from "#plate/index.ts";
import type { Supports } from "#plate/index.ts";
import { upgrade } from "#plate/runtime.dom.ts";
import { tabTo } from "#plate/test/tab.dom.ts";

/**
 * Where the glossary fixture sits under the package, which `commands.readFile` and `open` take.
 */
const fixtureLocation = "fixtures/m3e/items/glossary.xml";

/**
 * The supports a host enables to show glossary definitions, and nothing else.
 */
const glossaryOn: Supports = { ...noSupports, catalog: new Set(["glossary-on-screen"]) };

/**
 * The containers the running case mounted, which `afterEach` removes.
 */
const mounted: HTMLElement[] = [];

/**
 * Render the glossary fixture with the glossary on, as a host does for one candidate, and append it
 * to the body.
 *
 * @returns The container that holds the rendered item, which `afterEach` removes.
 */
const mountGlossary = Effect.fnUntraced(function* mountGlossary() {
  const text = yield* Effect.promise(() => commands.readFile(fixtureLocation));
  const verdict = yield* open(fixtureLocation, new TextEncoder().encode(text));
  const accepted = Option.getOrElse(acceptedItem(verdict), () =>
    assert.fail(`the fixture is ${verdict.verdict}, not accepted`),
  );
  const configuration = yield* configure({});
  const rendered = yield* Effect.fromResult(
    render(redact(accepted, undefined, undefined, { supports: glossaryOn }), configuration, {
      instance: "q1",
      supports: glossaryOn,
    }),
  );
  const container = document.createElement("div");

  container.innerHTML = rendered.html;
  document.body.append(container);
  mounted.push(container);

  return container;
});

/**
 * Find the first `details` of a container and its `summary`, failing the case when there is none.
 *
 * @param container The container.
 * @returns The first disclosure and its summary.
 */
const firstDisclosure = (container: HTMLElement) => {
  const details = container.querySelector("details");
  const summary = container.querySelector<HTMLElement>("details > summary");

  if (details === null || summary === null) {
    return assert.fail("the rendered item holds no glossary disclosure");
  }

  return { details, summary };
};

/**
 * Tell whether the disclosure's definition is visible: the engine skips the content of a closed
 * disclosure, so its paragraph is not visible, and shows it once the disclosure is open.
 *
 * @param details The disclosure.
 * @returns Whether the definition's paragraph is visible.
 */
const definitionShown = (details: HTMLDetailsElement): boolean => {
  const paragraph = details.querySelector("p");

  return paragraph !== null && paragraph.checkVisibility();
};

describe(server.browser, () => {
  afterEach(() => {
    for (const container of mounted.splice(0)) {
      container.remove();
    }
  });

  it.effect(
    "[A-15] in the page Enter or Space on the summary opens the definition and again closes it",
    () =>
      Effect.gen(function* keyboardToggle() {
        const container = yield* mountGlossary();
        const { details, summary } = firstDisclosure(container);

        yield* Effect.promise(() => tabTo(summary, userEvent));

        assert.strictEqual(document.activeElement, summary);
        assert.isFalse(details.open, "the definition starts closed");
        assert.isFalse(definitionShown(details), "a closed definition is not visible");

        for (const key of ["{Enter}", " "]) {
          yield* Effect.promise(() => userEvent.keyboard(key));

          assert.isTrue(details.open, `${JSON.stringify(key)} opens the definition`);
          assert.isTrue(definitionShown(details), "an open definition is visible");
          assert.strictEqual(document.activeElement, summary);

          yield* Effect.promise(() => userEvent.keyboard(key));

          assert.isFalse(details.open, `${JSON.stringify(key)} closes it again`);
          assert.isFalse(definitionShown(details));
          assert.strictEqual(document.activeElement, summary);
        }
      }),
  );

  it.effect(
    "[A-15] in the page a pointer click on the summary opens it, and nothing moves focus on load",
    () =>
      Effect.gen(function* pointerToggle() {
        const before = document.createElement("input");

        before.type = "text";
        document.body.append(before);
        mounted.push(before);
        before.focus();

        const container = yield* mountGlossary();
        const { details, summary } = firstDisclosure(container);

        upgrade(container);

        assert.strictEqual(document.activeElement, before, "upgrade moves no focus");
        assert.isFalse(details.open, "upgrade opens no definition");

        yield* Effect.promise(() => userEvent.click(summary));

        assert.isTrue(details.open, "a click opens the definition");
        assert.isTrue(definitionShown(details));

        yield* Effect.promise(() => userEvent.click(summary));

        assert.isFalse(details.open, "a second click closes it");
        assert.isFalse(definitionShown(details));
      }),
  );
});

import { assert } from "@effect/vitest";
import { Effect, Option } from "effect";
import type { Locator, Page } from "playwright-core";
import { openMember } from "#plate/dev/listing.ts";
import { h } from "#plate/emit/node.ts";
import type { Element, Node } from "#plate/emit/node.ts";
import { entryName } from "#plate/form/encoding.ts";
import { message } from "#plate/messages.ts";
import { format } from "#plate/model/values.ts";
import { attribute, nameOf } from "#plate/test/accessibility.ts";
import { Playground, eachEngine, playgroundLayer, withPage } from "#plate/test/browsers.ts";
import type { EngineName } from "#plate/test/browsers.ts";
import { tabOrder } from "#plate/test/keyboard.ts";
import { parseHtml } from "#plate/test/round-trip.ts";

/**
 * The corpus paths of the items the walk answers: BG007's True/False Choice, BG008's Choice with
 * `max-choices="3"` over five choices, the shuffled Choices of Composition of Water, and a Choice
 * of the Common Cartridge package scored by `CC2_match`.
 */
const paths = {
  bg007: "QTI3_BPIG_Examples/items/BG007.xml",
  bg008: "QTI3_BeginnersGuide_Examples/items/BG008.xml",
  ccPackage: "qtiv3-examples/packaging/ccPackage/testitems/QUE_102010.xml",
  water:
    "qtiv3-examples/items/shared-vocabulary/Items/Item_QTI3_CompWater_03/composition_of_water_qti3.xml",
} as const;

/**
 * Composition of Water's responses, one per shuffled Choice, in document order; `RESPONSE1`'s
 * Choice has `max-choices="2"`.
 */
const waterResponses = ["RESPONSE1", "RESPONSE2", "RESPONSE3"] as const;

/**
 * A choice as the page presents it: its identifier, which its Control posts as its value, and the
 * accessible name `nameOf` gives its Control.
 */
interface Choice {
  readonly identifier: string;
  readonly name: string;
}

/**
 * Collect every element of a tree, each before its descendants.
 *
 * @param nodes The tree's top-level nodes.
 * @returns The elements in document order.
 */
const elementsOf = (nodes: readonly Node[]): readonly Element[] =>
  nodes.flatMap((node) => (node.kind === "element" ? [node, ...elementsOf(node.children)] : []));

/**
 * Open an item page of the playground in a page, and read the HTML it answered as a tree.
 *
 * @param page The page.
 * @param corpusPath The item's corpus path.
 * @returns The page's nodes under one root, which `nameOf` and `tabOrder` read.
 */
const openItem = Effect.fn("openItem")(function* openItem(page: Page, corpusPath: string) {
  const { origin } = yield* Playground;
  const query = new URLSearchParams({ path: corpusPath }).toString();
  const response = yield* Effect.promise(() => page.goto(`${origin}/item?${query}`));

  assert.isNotNull(response);
  assert.strictEqual(response.status(), 200);

  return h("body", {}, [...parseHtml(yield* Effect.promise(() => response.text()))]);
});

/**
 * Read the instance token an item page's form posts under, from its `action`.
 *
 * @param tree The item page's tree.
 * @returns The token; the test fails when the page has no item form.
 */
const instanceOf = (tree: Element): string => {
  const action = elementsOf([tree])
    .flatMap((element) => (element.tag === "form" ? [attribute(element, "action") ?? ""] : []))
    .find((written) => written.startsWith("/item?"));
  const instance =
    action === undefined
      ? null
      : new URL(action, "http://playground.invalid").searchParams.get("instance");

  return instance ?? assert.fail("the item page has a form whose action names its instance");
};

/**
 * List the choices of one response's interaction, in the order the page presents them.
 *
 * @param tree The item page's tree.
 * @param entry The entry name the response's Controls post under.
 * @returns Each Control's value and accessible name, in document order.
 */
const choicesOf = (tree: Element, entry: string): readonly Choice[] =>
  elementsOf([tree])
    .filter((element) => element.tag === "input" && attribute(element, "name") === entry)
    .map((control) => ({
      identifier: attribute(control, "value") ?? "",
      name: nameOf(control, tree),
    }));

/**
 * Read the correct response of one response declaration of a corpus item, from the item `open`
 * accepted.
 *
 * @param corpusPath The item's corpus path.
 * @param response The response's identifier.
 * @returns The correct response's values in their lexical form; the test fails when the item is
 *   not accepted.
 */
const correctOf = Effect.fn("correctOf")(function* correctOf(corpusPath: string, response: string) {
  const verdict = yield* openMember(corpusPath);
  if (verdict.verdict === "refused" || verdict.verdict === "unchecked") {
    return assert.fail(`${corpusPath} is ${verdict.verdict}, not accepted`);
  }

  const declaration = verdict.accepted.item.responses.get(response);

  return declaration === undefined
    ? []
    : Option.match(declaration.correct, {
        onNone: () => [],
        onSome: (value) => value.values.map(format),
      });
});

/**
 * Locate a choice's Control by its role and accessible name, among the Controls of one response.
 *
 * @param page The page.
 * @param role The Control's role.
 * @param entry The entry name the response's Controls post under.
 * @param choice The choice.
 * @returns The locator.
 */
const control = (page: Page, role: "checkbox" | "radio", entry: string, choice: Choice): Locator =>
  page.getByRole(role, { exact: true, name: choice.name }).and(page.locator(`[name="${entry}"]`));

/**
 * Tick a choice's Control by mouse: a click at its centre, then a check that it is now checked.
 *
 * The Control is hidden from sight, a clipped 1px box (`src/styles.css`), under its Indicator,
 * which sits in the Control's `label`; a click there reaches the Control through the label, as a
 * person's click on the mark does. Playwright's hit-target check refuses a click that lands on an
 * element other than the target or its descendants, so the click is forced: `force` skips the
 * actionability checks only, and the mouse events are real, at the Control's centre.
 *
 * @param target The Control.
 * @returns Once the Control is checked; the test fails when the click left it unchecked.
 */
const tick = (target: Locator) => Effect.promise(() => target.check({ force: true }));

/**
 * Locate the item form's Submit button by its role and name.
 *
 * @param page The page.
 * @returns The locator.
 */
const submitButton = (page: Page): Locator =>
  page.getByRole("button", { exact: true, name: message("en", "submit") });

/**
 * Submit the item form and wait for the page that answers the post, whose URL names the instance.
 *
 * @param page The page.
 * @param act The click or key press that submits.
 * @returns Once the answering page has loaded.
 */
const submit = (page: Page, act: () => Promise<void>) =>
  Effect.promise(() =>
    Promise.all([page.waitForURL((url) => url.searchParams.has("instance")), act()]),
  );

/**
 * Count the elements of the Status region whose text is exactly the given text.
 *
 * @param page The page after a submit.
 * @param text The text.
 * @returns How many elements of the region, read through its role `status`, hold it.
 */
const inStatus = (page: Page, text: string) =>
  Effect.promise(() => page.getByRole("status").getByText(text, { exact: true }).count());

/**
 * Read the order a response's Choice presents its choices in, from the page as the browser holds
 * it.
 *
 * @param page The page.
 * @param entry The entry name the response's Controls post under.
 * @returns The Controls' values, in document order.
 */
const presentedOrder = Effect.fn("presentedOrder")(function* presentedOrder(
  page: Page,
  entry: string,
) {
  const controls = yield* Effect.promise(() => page.locator(`input[name="${entry}"]`).all());

  return yield* Effect.all(
    controls.map((each) => Effect.promise(() => each.getAttribute("value"))),
  );
});

/**
 * Give the key that moves focus to the next control of any kind in an engine on this platform.
 *
 * WebKit on macOS keeps Safari's split by default: Tab highlights only fields and pop-up menus,
 * and Option+Tab (Alt+Tab) highlights clickable items too. Headless, Tab there moves only between
 * the theme box's `textarea` and the page, while Alt+Tab reaches the radios and the Submit button.
 * Elsewhere Tab reaches every control.
 *
 * @param name The engine.
 * @returns `Alt+Tab` for WebKit on macOS, else `Tab`.
 * @see https://support.apple.com/guide/safari/cpsh003/mac (Safari's keyboard shortcuts: Tab and Option-Tab, and the setting that swaps them)
 */
const nextControlKey = (name: EngineName): string =>
  name === "webkit" && process.platform === "darwin" ? "Alt+Tab" : "Tab";

/**
 * Press the engine's next-control key until the focused element is one the target matches.
 *
 * @param page The page.
 * @param key The key, {@link nextControlKey}'s.
 * @param target The elements to reach.
 * @param most The most presses to make before the test fails.
 * @returns How many presses it took.
 */
const tabUntil = Effect.fn("tabUntil")(function* tabUntil(
  page: Page,
  key: string,
  target: Locator,
  most: number,
) {
  for (let pressed = 1; pressed <= most; pressed += 1) {
    yield* Effect.promise(() => page.keyboard.press(key));
    if ((yield* Effect.promise(() => target.and(page.locator(":focus")).count())) > 0) {
      return pressed;
    }
  }

  return assert.fail(`${String(most)} presses of ${key} never reached the target`);
});

/**
 * Pick the choice of an item page whose identifier is or is not among the correct values.
 *
 * @param choices The choices of one response.
 * @param correct The correct response's values.
 * @param wanted Whether to pick a correct choice.
 * @returns The first such choice; the test fails when there is none.
 */
const pick = (choices: readonly Choice[], correct: readonly string[], wanted: boolean): Choice => {
  const found = choices.find((choice) => correct.includes(choice.identifier) === wanted);

  assert.isDefined(found, `a choice that is ${wanted ? "" : "not "}correct is presented`);

  return found;
};

eachEngine((it, name) => {
  it.layer(playgroundLayer({}))("the walk, answering", (walk) => {
    walk.effect("[Q-2] BG007 by mouse: the radio named True clicked, then Submit, scores 1", () =>
      withPage({ javaScriptEnabled: false }, (page) =>
        Effect.gen(function* byMouse() {
          const tree = yield* openItem(page, paths.bg007);
          const entry = entryName(instanceOf(tree), "RESPONSE");
          const correct = yield* correctOf(paths.bg007, "RESPONSE");

          yield* tick(control(page, "radio", entry, pick(choicesOf(tree, entry), correct, true)));
          yield* submit(page, () => submitButton(page).click());

          assert.strictEqual(yield* inStatus(page, message("en", "score", { score: "1" })), 1);
        }),
      ),
    );

    walk.effect(
      "[Q-2] [keyboard] BG007 by keys alone: Tab into the group, Space on True, Tab to Submit, Enter, scores 1",
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* byKeys() {
            const tree = yield* openItem(page, paths.bg007);
            const entry = entryName(instanceOf(tree), "RESPONSE");
            const correct = yield* correctOf(paths.bg007, "RESPONSE");
            const chosen = control(
              page,
              "radio",
              entry,
              pick(choicesOf(tree, entry), correct, true),
            );
            // Twice the Node walk's stops: a bound on the presses, not an expected order, which
            // p3-68 compares.
            const most = 2 * tabOrder(tree).length;
            const key = nextControlKey(name);

            yield* tabUntil(page, key, page.locator(`input[name="${entry}"]`), most);
            yield* Effect.promise(() => page.keyboard.press("Space"));

            assert.isTrue(yield* Effect.promise(() => chosen.isChecked()));

            yield* tabUntil(page, key, submitButton(page), most);
            yield* submit(page, () => page.keyboard.press("Enter"));

            assert.strictEqual(yield* inStatus(page, message("en", "score", { score: "1" })), 1);
          }),
        ),
    );

    walk.effect(
      "[Q-2] BG007 with a wrong answer by mouse: False clicked, then Submit, scores 0",
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* wrongAnswer() {
            const tree = yield* openItem(page, paths.bg007);
            const entry = entryName(instanceOf(tree), "RESPONSE");
            const correct = yield* correctOf(paths.bg007, "RESPONSE");

            yield* tick(
              control(page, "radio", entry, pick(choicesOf(tree, entry), correct, false)),
            );
            yield* submit(page, () => submitButton(page).click());

            assert.strictEqual(yield* inStatus(page, message("en", "score", { score: "0" })), 1);
          }),
        ),
    );

    walk.effect(
      "[Q-2] BG008 over-ticked: four of five ticked against max-choices 3, then Submit, says at most 3 and keeps the four ticked",
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* overTicked() {
            const tree = yield* openItem(page, paths.bg008);
            const entry = entryName(instanceOf(tree), "RESPONSE");
            const ticked = choicesOf(tree, entry).slice(0, 4);

            assert.strictEqual(ticked.length, 4);

            yield* Effect.forEach(
              ticked,
              (choice) => tick(control(page, "checkbox", entry, choice)),
              { discard: true },
            );
            yield* submit(page, () => submitButton(page).click());

            assert.strictEqual(yield* inStatus(page, message("en", "atMost", { n: "3" })), 1);
            assert.deepStrictEqual(
              yield* Effect.all(
                ticked.map((choice) =>
                  Effect.promise(() => control(page, "checkbox", entry, choice).isChecked()),
                ),
              ),
              ticked.map(() => true),
            );
          }),
        ),
    );

    walk.effect(
      "[Q-2] Composition of Water's shuffled Choices keep each presented order across a refused submit of three ticks against max-choices 2",
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* shuffled() {
            const tree = yield* openItem(page, paths.water);
            const instance = instanceOf(tree);
            const entries = waterResponses.map((response) => entryName(instance, response));
            const [first = ""] = entries;
            const before = yield* Effect.all(entries.map((entry) => presentedOrder(page, entry)));
            const ticked = choicesOf(tree, first).slice(0, 3);

            assert.deepStrictEqual(
              before.map((order) => order.length > 1),
              entries.map(() => true),
            );
            assert.strictEqual(ticked.length, 3);

            yield* Effect.forEach(
              ticked,
              (choice) => tick(control(page, "checkbox", first, choice)),
              { discard: true },
            );
            yield* submit(page, () => submitButton(page).click());

            const region = page.getByRole("status");

            assert.strictEqual(
              yield* Effect.promise(() =>
                region
                  .getByRole("heading", { exact: true, name: message("en", "notAccepted") })
                  .count(),
              ),
              1,
            );
            assert.isAbove(yield* Effect.promise(() => region.getByRole("listitem").count()), 0);
            assert.deepStrictEqual(
              yield* Effect.all(entries.map((entry) => presentedOrder(page, entry))),
              before,
            );
          }),
        ),
    );

    walk.effect(
      "[Q-2] [I-9b] a ccPackage CC2_match item scores 1: QUE_102010's correct choice clicked, then Submit",
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* ccPackage() {
            const tree = yield* openItem(page, paths.ccPackage);
            const entry = entryName(instanceOf(tree), "RESPONSE");
            const correct = yield* correctOf(paths.ccPackage, "RESPONSE");

            yield* tick(control(page, "radio", entry, pick(choicesOf(tree, entry), correct, true)));
            yield* submit(page, () => submitButton(page).click());

            assert.strictEqual(yield* inStatus(page, message("en", "score", { score: "1" })), 1);
          }),
        ),
    );
  });
});

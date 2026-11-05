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
 * The Choice items the keys answer, each scored by `match_correct`: BG007's True/False single
 * Choice, BG008's multiple Choice with `max-choices="3"` over five choices, and `choice_fixed`'s
 * shuffled single Choice of four, its last fixed.
 */
const items = {
  bg007: "QTI3_BPIG_Examples/items/BG007.xml",
  bg008: "QTI3_BeginnersGuide_Examples/items/BG008.xml",
  choiceFixed: "qtiv3-examples/packaging/items/choice_fixed.xml",
} as const;

/**
 * The items whose Choice is a radio group, by the name a test title gives each.
 */
const radioItems = [
  ["BG007", items.bg007],
  ["choice_fixed", items.choiceFixed],
] as const;

/**
 * The arrow keys a radio group is walked with from its first radio, and the index of the radio
 * each leaves checked: next, previous, next, previous. The walk never passes either end, so no
 * step depends on wrapping.
 */
const arrowSteps = [
  ["ArrowDown", 1],
  ["ArrowUp", 0],
  ["ArrowRight", 1],
  ["ArrowLeft", 0],
] as const;

/**
 * The response every item here declares, whose Controls the item form posts.
 */
const responseId = "RESPONSE";

/**
 * A choice as the page presents it: its identifier, which its Control posts as its value, and the
 * accessible name `nameOf` gives its Control.
 */
interface Choice {
  readonly identifier: string;
  readonly name: string;
}

/**
 * Where one press of the next-control key left focus, as the page in the browser holds it.
 */
interface Stop {
  /**
   * Whether the focused element is in the item form.
   */
  readonly inForm: boolean;
  /**
   * The focused element's key, {@link keyOf}'s, empty when nothing is focused.
   */
  readonly key: string;
  /**
   * Whether the focused element is a link.
   */
  readonly link: boolean;
  /**
   * Whether the focused element is the item form's Submit button.
   */
  readonly submit: boolean;
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
 * Identify an element as the tab-order comparison matches it: by its `id`, else by its `name` and
 * `value`, an attribute that is missing reading as empty.
 *
 * @param attributes The element's `id`, `name` and `value`.
 * @param attributes.id The `id`.
 * @param attributes.name The `name`.
 * @param attributes.value The `value`.
 * @returns The key.
 */
const keyOf = (attributes: {
  readonly id: string | null | undefined;
  readonly name: string | null | undefined;
  readonly value: string | null | undefined;
}): string =>
  attributes.id !== null && attributes.id !== undefined && attributes.id !== ""
    ? `id=${attributes.id}`
    : `name=${attributes.name ?? ""} value=${attributes.value ?? ""}`;

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
 * Whether a form's `action` posts to the item page, which makes it the item form.
 *
 * @param action The form's `action`.
 * @returns Whether it names `/item`.
 */
const isItemAction = (action: string): boolean => action.startsWith("/item?");

/**
 * Find the item form of an item page.
 *
 * @param tree The item page's tree.
 * @returns The form; the test fails when the page has none.
 */
const itemFormOf = (tree: Element): Element =>
  elementsOf([tree]).find(
    (element) => element.tag === "form" && isItemAction(attribute(element, "action") ?? ""),
  ) ?? assert.fail("the item page has an item form");

/**
 * Read the instance token the item form posts under, from its `action`.
 *
 * @param tree The item page's tree.
 * @returns The token; the test fails when the action names none.
 */
const instanceOf = (tree: Element): string =>
  new URL(
    attribute(itemFormOf(tree), "action") ?? "",
    "http://playground.invalid",
  ).searchParams.get("instance") ?? assert.fail("the item form's action names its instance");

/**
 * List the keys of the item form's tab stops, in the order the Node walk's `tabOrder` gives for
 * the whole page.
 *
 * @param tree The item page's tree.
 * @returns Each stop's key, {@link keyOf}'s, from the form's first control to its Submit.
 */
const formStops = (tree: Element): readonly string[] => {
  const inForm = new Set(elementsOf([itemFormOf(tree)]));

  return tabOrder(tree)
    .filter((element) => inForm.has(element))
    .map((element) =>
      keyOf({
        id: attribute(element, "id"),
        name: attribute(element, "name"),
        value: attribute(element, "value"),
      }),
    );
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
 * Read the correct response of an item's {@link responseId}, from the item `open` accepted.
 *
 * @param corpusPath The item's corpus path.
 * @returns The correct response's values in their lexical form; the test fails when the item is
 *   not accepted.
 */
const correctOf = Effect.fn("correctOf")(function* correctOf(corpusPath: string) {
  const verdict = yield* openMember(corpusPath);
  if (verdict.verdict === "refused" || verdict.verdict === "unchecked") {
    return assert.fail(`${corpusPath} is ${verdict.verdict}, not accepted`);
  }

  const declaration = verdict.accepted.item.responses.get(responseId);

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
 * Locate the item form's Submit button by its role and name.
 *
 * @param page The page.
 * @returns The locator.
 */
const submitButton = (page: Page): Locator =>
  page.getByRole("button", { exact: true, name: message("en", "submit") });

/**
 * Count the elements a locator matches.
 *
 * @param locator The locator.
 * @returns How many elements it matches now.
 */
const count = (locator: Locator) => Effect.promise(() => locator.count());

/**
 * Whether the element a locator matches holds keyboard focus.
 *
 * @param page The page.
 * @param target The locator.
 * @returns Whether a focused element is among its matches.
 */
const isFocused = Effect.fn("isFocused")(function* isFocused(page: Page, target: Locator) {
  return (yield* count(target.and(page.locator(":focus")))) > 0;
});

/**
 * Press a key on the page's keyboard.
 *
 * @param page The page.
 * @param key The key, as Playwright names it.
 * @returns Once the key is up.
 */
const press = (page: Page, key: string) => Effect.promise(() => page.keyboard.press(key));

/**
 * Read whether each Control is checked.
 *
 * @param controls The Controls.
 * @returns Each one's checked state, in the given order.
 */
const checkedStates = (controls: readonly Locator[]) =>
  Effect.all(controls.map((each) => Effect.promise(() => each.isChecked())));

/**
 * Submit the item form by a key press and wait for the page that answers the post, whose URL
 * names the instance.
 *
 * @param page The page.
 * @param key The key that submits, pressed on the focused Submit.
 * @returns Once the answering page has loaded.
 */
const submitBy = (page: Page, key: string) =>
  Effect.promise(() =>
    Promise.all([
      page.waitForURL((url) => url.searchParams.has("instance")),
      page.keyboard.press(key),
    ]),
  );

/**
 * Count the elements of the Status region whose text is exactly the given text.
 *
 * @param page The page after a submit.
 * @param text The text.
 * @returns How many elements of the region, read through its role `status`, hold it.
 */
const inStatus = (page: Page, text: string) =>
  count(page.getByRole("status").getByText(text, { exact: true }));

/**
 * Give the key that moves focus to the next control of any kind in an engine on this platform.
 *
 * WebKit on macOS keeps Safari's split by default: Tab highlights only fields and pop-up menus,
 * and Option+Tab (Alt+Tab) highlights clickable items too, the radios, checkboxes and buttons
 * among them. Elsewhere Tab reaches every control.
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
    yield* press(page, key);
    if (yield* isFocused(page, target)) {
      return pressed;
    }
  }

  return assert.fail(`${String(most)} presses of ${key} never reached the target`);
});

/**
 * Read where focus is, as a {@link Stop}.
 *
 * @param page The page.
 * @returns The focused element's key and what it is; an empty key when nothing is focused.
 */
const focusedStop = Effect.fn("focusedStop")(function* focusedStop(page: Page) {
  const focused = page.locator(":focus");
  if ((yield* count(focused)) === 0) {
    return { inForm: false, key: "", link: false, submit: false } satisfies Stop;
  }

  const read = (name: string) => Effect.promise(() => focused.getAttribute(name));

  return {
    inForm: (yield* count(page.locator('form[action^="/item?"] :focus'))) > 0,
    key: keyOf({ id: yield* read("id"), name: yield* read("name"), value: yield* read("value") }),
    link: (yield* count(page.locator("a:focus"))) > 0,
    submit: yield* isFocused(page, submitButton(page)),
  } satisfies Stop;
});

/**
 * Press the engine's next-control key from the page's start until focus reaches the item form's
 * Submit, reading each stop.
 *
 * @param page The page, freshly loaded, with nothing focused.
 * @param key The key, {@link nextControlKey}'s.
 * @param most The most presses to make before the test fails.
 * @returns Every stop, in the order the presses reached them, the Submit last.
 */
const stopsToSubmit = Effect.fn("stopsToSubmit")(function* stopsToSubmit(
  page: Page,
  key: string,
  most: number,
) {
  const stops: Stop[] = [];
  for (let pressed = 1; pressed <= most; pressed += 1) {
    yield* press(page, key);

    const stop = yield* focusedStop(page);
    stops.push(stop);
    if (stop.submit) {
      return stops;
    }
  }

  return assert.fail(`${String(most)} presses of ${key} never reached the item form's Submit`);
});

/**
 * Answer a radio group by keys: the next-control key into the group, which focuses its first
 * radio, then Space on the wanted radio when it is first, else ArrowDown until it is checked.
 *
 * @param page The page.
 * @param key The next-control key.
 * @param group Every radio of the group.
 * @param radios The group's radios, in the presented order.
 * @param wanted The index of the radio to check.
 * @param most The most presses of the next-control key.
 * @returns Once the wanted radio is checked; the test fails when another one is.
 */
const answerRadios = Effect.fn("answerRadios")(function* answerRadios(
  page: Page,
  key: string,
  group: Locator,
  radios: readonly Locator[],
  wanted: number,
  most: number,
) {
  yield* tabUntil(page, key, group, most);
  if (wanted === 0) {
    yield* press(page, "Space");
  }

  for (let moved = 0; moved < wanted; moved += 1) {
    yield* press(page, "ArrowDown");
  }

  assert.deepStrictEqual(
    yield* checkedStates(radios),
    radios.map((_, index) => index === wanted),
  );
});

/**
 * Answer a checkbox group by keys: the next-control key onto each checkbox in the presented order,
 * and Space on each one to tick.
 *
 * @param page The page.
 * @param key The next-control key.
 * @param boxes The group's checkboxes, in the presented order.
 * @param ticked Whether to tick each.
 * @param most The most presses of the next-control key per checkbox.
 * @returns Once the checkboxes are ticked as asked; the test fails otherwise.
 */
const answerBoxes = Effect.fn("answerBoxes")(function* answerBoxes(
  page: Page,
  key: string,
  boxes: readonly Locator[],
  ticked: readonly boolean[],
  most: number,
) {
  for (const [index, box] of boxes.entries()) {
    yield* tabUntil(page, key, box, most);
    if (ticked[index] === true) {
      yield* press(page, "Space");
    }
  }

  assert.deepStrictEqual(yield* checkedStates(boxes), ticked);
});

eachEngine((it, name) => {
  it.layer(playgroundLayer({}))("the keyboard, Choice", (keys) => {
    const key = nextControlKey(name);

    for (const [label, corpusPath] of [
      ["BG007", items.bg007],
      ["BG008", items.bg008],
      ["choice_fixed", items.choiceFixed],
    ] as const) {
      keys.effect(
        `[Q-2] [keyboard] Tab order: ${label}'s item form, from its first control to its Submit, is the Node walk's tabOrder`,
        (context) =>
          withPage({ javaScriptEnabled: false }, (page) =>
            Effect.gen(function* tabOrderMatches() {
              const tree = yield* openItem(page, corpusPath);
              const stops = yield* stopsToSubmit(page, key, 2 * tabOrder(tree).length);
              const first = stops.findIndex((stop) => stop.inForm);

              assert.isAtLeast(first, 0, "a press reached the item form");
              assert.deepStrictEqual(
                stops.slice(first).map((stop) => stop.key),
                formStops(tree),
              );

              const links = stops.slice(0, first).filter((stop) => stop.link).length;

              yield* Effect.promise(() =>
                context.annotate(
                  `${name}, ${key}: before ${label}'s item form, ${links > 0 ? `stopped on ${String(links)} of the page's links` : "stopped on none of the page's links"}`,
                ),
              );
            }),
          ),
      );
    }

    for (const [label, corpusPath] of radioItems) {
      keys.effect(
        `[Q-2] [keyboard] Arrows: in ${label}'s radio group, ArrowDown and ArrowRight check the next radio, and ArrowUp and ArrowLeft the previous one`,
        () =>
          withPage({ javaScriptEnabled: false }, (page) =>
            Effect.gen(function* arrows() {
              const tree = yield* openItem(page, corpusPath);
              const entry = entryName(instanceOf(tree), responseId);
              const radios = choicesOf(tree, entry).map((choice) =>
                control(page, "radio", entry, choice),
              );
              const [first] = radios;

              assert.isAtLeast(radios.length, 2);
              assert.isDefined(first);

              yield* tabUntil(
                page,
                key,
                page.locator(`input[name="${entry}"]`),
                2 * tabOrder(tree).length,
              );

              assert.isTrue(yield* isFocused(page, first), "Tab entered the group at its first");
              assert.deepStrictEqual(
                yield* checkedStates(radios),
                radios.map(() => false),
              );

              for (const [arrow, index] of arrowSteps) {
                yield* press(page, arrow);

                assert.deepStrictEqual(
                  yield* checkedStates(radios),
                  radios.map((_, each) => each === index),
                  `${arrow} checks radio ${String(index)}`,
                );
                assert.isTrue(
                  yield* isFocused(page, radios[index] ?? first),
                  `${arrow} focuses radio ${String(index)}`,
                );
              }
            }),
          ),
      );

      keys.effect(`[Q-2] [keyboard] Space checks ${label}'s focused radio`, () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* spaceOnRadio() {
            const tree = yield* openItem(page, corpusPath);
            const entry = entryName(instanceOf(tree), responseId);
            const radios = choicesOf(tree, entry).map((choice) =>
              control(page, "radio", entry, choice),
            );
            const [first] = radios;
            assert.isDefined(first);

            yield* tabUntil(page, key, first, 2 * tabOrder(tree).length);
            yield* press(page, "Space");

            assert.deepStrictEqual(
              yield* checkedStates(radios),
              radios.map((_, index) => index === 0),
            );
          }),
        ),
      );

      keys.effect(
        `[Q-2] [keyboard] ${label} answered by keys: its correct radio checked, Enter on Submit, scores 1`,
        () =>
          withPage({ javaScriptEnabled: false }, (page) =>
            Effect.gen(function* submitRadio() {
              const tree = yield* openItem(page, corpusPath);
              const entry = entryName(instanceOf(tree), responseId);
              const correct = yield* correctOf(corpusPath);
              const choices = choicesOf(tree, entry);
              const wanted = choices.findIndex((choice) => correct.includes(choice.identifier));
              const most = 2 * tabOrder(tree).length;

              assert.isAtLeast(wanted, 0, "the correct choice is presented");

              yield* answerRadios(
                page,
                key,
                page.locator(`input[name="${entry}"]`),
                choices.map((choice) => control(page, "radio", entry, choice)),
                wanted,
                most,
              );
              yield* tabUntil(page, key, submitButton(page), most);
              yield* submitBy(page, "Enter");

              assert.strictEqual(yield* inStatus(page, message("en", "score", { score: "1" })), 1);
            }),
          ),
      );
    }

    keys.effect("[Q-2] [keyboard] Space ticks and unticks BG008's focused checkbox", () =>
      withPage({ javaScriptEnabled: false }, (page) =>
        Effect.gen(function* spaceOnCheckbox() {
          const tree = yield* openItem(page, items.bg008);
          const entry = entryName(instanceOf(tree), responseId);
          const [choice] = choicesOf(tree, entry);
          assert.isDefined(choice);

          const box = control(page, "checkbox", entry, choice);

          yield* tabUntil(page, key, box, 2 * tabOrder(tree).length);
          yield* press(page, "Space");

          assert.isTrue(yield* Effect.promise(() => box.isChecked()), "Space ticks");

          yield* press(page, "Space");

          assert.isFalse(yield* Effect.promise(() => box.isChecked()), "Space unticks");
        }),
      ),
    );

    keys.effect(
      "[Q-2] [keyboard] BG008 answered by keys: its correct choices ticked, Enter on Submit, scores 1",
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* submitCorrect() {
            const tree = yield* openItem(page, items.bg008);
            const entry = entryName(instanceOf(tree), responseId);
            const correct = yield* correctOf(items.bg008);
            const choices = choicesOf(tree, entry);
            const most = 2 * tabOrder(tree).length;

            assert.isAbove(correct.length, 1);

            yield* answerBoxes(
              page,
              key,
              choices.map((choice) => control(page, "checkbox", entry, choice)),
              choices.map((choice) => correct.includes(choice.identifier)),
              most,
            );
            yield* tabUntil(page, key, submitButton(page), most);
            yield* submitBy(page, "Enter");

            assert.strictEqual(yield* inStatus(page, message("en", "score", { score: "1" })), 1);
          }),
        ),
    );

    keys.effect(
      "[Q-2] [keyboard] BG008 over-ticked by keys: four of five ticked against max-choices 3, Enter on Submit, says at most 3",
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* submitOverTicked() {
            const tree = yield* openItem(page, items.bg008);
            const entry = entryName(instanceOf(tree), responseId);
            const choices = choicesOf(tree, entry);
            const most = 2 * tabOrder(tree).length;

            assert.strictEqual(choices.length, 5);

            yield* answerBoxes(
              page,
              key,
              choices.map((choice) => control(page, "checkbox", entry, choice)),
              choices.map((_, index) => index < 4),
              most,
            );
            yield* tabUntil(page, key, submitButton(page), most);
            yield* submitBy(page, "Enter");

            assert.strictEqual(yield* inStatus(page, message("en", "atMost", { n: "3" })), 1);
          }),
        ),
    );
  });
});

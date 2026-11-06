/**
 * The keyboard on M2's session pages in Chromium and WebKit, with JavaScript off (spec §4.11,
 * §4.15): the tab order of a session page, the navigation pressed by Enter and Space, the confirm
 * page's Confirm and Return, a review page's stops, and P1 of the M2 fixture's test completed by
 * keys alone.
 *
 * Keys go through Playwright's keyboard, and the key that moves to the next control is the one
 * `nextControlKey` finds in the engine. Expected values come from the code the playground runs:
 * tab orders from `tabOrder` over the HTML each page answered, parts through the part table, and
 * texts from `message`.
 */
import { assert } from "@effect/vitest";
import { Effect, Option } from "effect";
import type { Locator, Page } from "playwright-core";
import type { Element } from "#plate/emit/node.ts";
import { rowFor } from "#plate/emit/parts.ts";
import type { InteractionKey, PartOf } from "#plate/emit/parts.ts";
import { message, numeral } from "#plate/messages.ts";
import { attribute } from "#plate/test/accessibility.ts";
import { Playground, eachEngine, nextControlKey, withPage } from "#plate/test/browsers.ts";
import { tabOrder } from "#plate/test/keyboard.ts";
import {
  count,
  elementsOf,
  isFocused,
  keyOf,
  press,
  tabUntil,
  treeOf,
} from "#plate/test/playground-page.ts";
import {
  fixturePlaygroundLayer,
  navigationOf,
  positionOf,
  startFixtureSession,
  statusOf,
} from "#plate/test/session-page.ts";

/**
 * The locale the playground's pages are written in.
 */
const locale = "en";

/**
 * The sequence indexes of the fixture test's part P1, which is nonlinear and simultaneous: items 1
 * to 3. P2 starts at item 4.
 */
const partOne = [1, 2, 3] as const;

/**
 * The sequence index of P2's first item, which the session page shows once P1 is submitted.
 */
const partTwoFirst = 4;

/**
 * The query a confirmed part submit's 303 asks the session page with, `notice=part-submitted`, so
 * the page shows the Status that says the part is submitted.
 */
const partSubmittedNotice = { name: "notice", value: "part-submitted" } as const;

/**
 * Locate the elements of one part, by its `data-slot` marker read through the part table.
 *
 * @param page The page.
 * @param interaction The part's owner.
 * @param part The part.
 * @returns The locator.
 */
const slotted = <I extends InteractionKey>(page: Page, interaction: I, part: PartOf<I>): Locator =>
  page.locator(`[data-slot="${rowFor(interaction, part).slot}"]`);

/**
 * Locate a button of the confirm page by its role and the text `message` gives it.
 *
 * @param page The page.
 * @param label The button's message key.
 * @returns The locator.
 */
const confirmPageButton = (page: Page, label: "confirm" | "return"): Locator =>
  page.getByRole("button", { exact: true, name: message(locale, label) });

/**
 * The attributes a tab stop is told apart by: `id`, `name`, `value` and `data-slot`, a missing one
 * read as null or undefined.
 */
interface StopAttributes {
  readonly id: string | null | undefined;
  readonly name: string | null | undefined;
  readonly slot: string | null | undefined;
  readonly value: string | null | undefined;
}

/**
 * Identify a tab stop: `keyOf`'s key, then its `data-slot` marker.
 *
 * The marker tells apart two buttons that post the same intent: the session form's Save button
 * and the current item's button both post `go` to the current item under one name, and only the
 * item's button carries a marker.
 *
 * @param attributes The stop's attributes.
 * @returns The key.
 */
const stopKey = (attributes: StopAttributes): string =>
  `${keyOf(attributes)} slot=${attributes.slot ?? ""}`;

/**
 * Identify an element of an answered page's tree as {@link stopKey} does.
 *
 * @param element The element.
 * @returns Its key.
 */
const elementKey = (element: Element): string =>
  stopKey({
    id: attribute(element, "id"),
    name: attribute(element, "name"),
    slot: attribute(element, "data-slot"),
    value: attribute(element, "value"),
  });

/**
 * A part of a page whose tab stops a test reads, found in the answered tree and in the browser
 * alike.
 */
interface Region {
  /**
   * Whether an element of the answered tree is the region's root.
   */
  readonly is: (element: Element) => boolean;
  /**
   * The selector of the region's root in the browser.
   */
  readonly selector: string;
}

/**
 * The session form of a session's page: the form that posts to the session's page, with the
 * Status region's id as its fragment.
 *
 * @param sessionPath The session page's path, `/sessions/<sid>`.
 * @returns The region.
 */
const sessionForm = (sessionPath: string): Region => ({
  is: (element) =>
    element.tag === "form" && (attribute(element, "action") ?? "").startsWith(`${sessionPath}#`),
  selector: `form[action^="${sessionPath}#"]`,
});

/**
 * The item Root's `data-slot` marker, read through the part table.
 */
const itemSlot = rowFor("item", "root").slot;

/**
 * The item a page shows: its Root.
 */
const itemRegion: Region = {
  is: (element) => attribute(element, "data-slot") === itemSlot,
  selector: `[data-slot="${itemSlot}"]`,
};

/**
 * List the keys of a region's tab stops, in the order `tabOrder` gives for the whole page.
 *
 * @param tree The answered page's tree.
 * @param region The region.
 * @returns Each stop's {@link elementKey}, in tab order.
 */
const expectedStops = (tree: Element, region: Region): readonly string[] => {
  const inside = new Set(elementsOf(elementsOf([tree]).filter((element) => region.is(element))));

  return tabOrder(tree)
    .filter((element) => inside.has(element))
    .map(elementKey);
};

/**
 * Find the elements of one navigation part in an answered page's tree, by its `data-slot` marker
 * read through the part table.
 *
 * @param tree The answered page's tree.
 * @param part The navigation part.
 * @returns The part's elements, in document order.
 */
const navigationElements = (tree: Element, part: PartOf<"test-navigation">): readonly Element[] =>
  elementsOf([tree]).filter(
    (element) => attribute(element, "data-slot") === rowFor("test-navigation", part).slot,
  );

/**
 * Give the most presses of the next-control key a walk of a page makes before it fails: twice the
 * page's stops, so a walk may pass every stop and wrap once.
 *
 * @param tree The answered page's tree.
 * @returns The bound.
 */
const boundOf = (tree: Element): number => 2 * tabOrder(tree).length;

/**
 * Read the key of the element that holds focus, as {@link stopKey} gives it.
 *
 * @param page The page.
 * @returns The key; the test fails when nothing is focused.
 */
const focusedKey = Effect.fn("focusedKey")(function* focusedKey(page: Page) {
  const focused = page.locator(":focus");

  assert.strictEqual(yield* count(focused), 1, "one element holds focus");

  const read = (name: string) => Effect.promise(() => focused.getAttribute(name));

  return stopKey({
    id: yield* read("id"),
    name: yield* read("name"),
    slot: yield* read("data-slot"),
    value: yield* read("value"),
  });
});

/**
 * Press the next-control key from where focus is and read the region's stops: the first run of
 * presses that leave focus inside the region, ended by the first press that leaves it outside.
 *
 * @param page The page.
 * @param key The key, `nextControlKey`'s.
 * @param region The region.
 * @param most The most presses to make.
 * @returns Each stop's {@link stopKey}, in the order the presses reached them; empty when no
 *   press reached the region.
 */
const browserStops = Effect.fn("browserStops")(function* browserStops(
  page: Page,
  key: string,
  region: Region,
  most: number,
) {
  const run: string[] = [];
  for (let pressed = 1; pressed <= most; pressed += 1) {
    yield* press(page, key);
    if ((yield* count(page.locator(`${region.selector} :focus`))) > 0) {
      run.push(yield* focusedKey(page));
    } else if (run.length > 0) {
      return run;
    }
  }

  return run;
});

/**
 * Act on a page and wait for the page the act leads to: the document a `GET` loads after any
 * redirect, a post's 303 included.
 *
 * @param page The page.
 * @param act The key press or click that leaves the current page.
 * @param arrives Whether a URL is the page the act leads to.
 * @param what The page, for a failure message.
 * @returns The arrived page's tree, once it has loaded; the test fails unless it answered 200.
 */
const arrive = Effect.fn("arrive")(function* arrive(
  page: Page,
  act: () => Promise<void>,
  arrives: (url: URL) => boolean,
  what: string,
) {
  const [response] = yield* Effect.promise(() =>
    Promise.all([
      page.waitForResponse(
        (answer) =>
          answer.request().method() === "GET" &&
          answer.request().isNavigationRequest() &&
          arrives(new URL(answer.url())),
      ),
      page.waitForEvent("load"),
      act(),
    ]),
  );

  assert.strictEqual(response.status(), 200, what);

  return treeOf(yield* Effect.promise(() => response.text()));
});

/**
 * Whether a URL is a session's page with no query: where a move, Save and Return lead.
 *
 * @param sessionPath The session page's path.
 * @returns The predicate.
 */
const atSession =
  (sessionPath: string) =>
  (url: URL): boolean =>
    url.pathname === sessionPath && url.search === "";

/**
 * Whether a URL is a session's confirm page.
 *
 * @param sessionPath The session page's path.
 * @returns The predicate.
 */
const atConfirm =
  (sessionPath: string) =>
  (url: URL): boolean =>
    url.pathname === `${sessionPath}/confirm`;

/**
 * Whether a URL is the session page a confirmed part submit leads to, which asks for the Status
 * that says the part is submitted.
 *
 * @param sessionPath The session page's path.
 * @returns The predicate.
 */
const atPartSubmitted =
  (sessionPath: string) =>
  (url: URL): boolean =>
    url.pathname === sessionPath &&
    url.searchParams.get(partSubmittedNotice.name) === partSubmittedNotice.value;

/**
 * Start a session of the M2 fixture's test and read its first page: the session page reloaded, so
 * the tree is the HTML of the page the browser shows, and focus starts at the page's start.
 *
 * @param page The page, which ends on the session's page.
 * @returns The session page's path and the answered page's tree.
 */
const startShown = Effect.fn("startShown")(function* startShown(page: Page) {
  const { origin } = yield* Playground;
  const sessionPath = yield* startFixtureSession(page, origin);
  const shown = yield* Effect.promise(() => page.reload());

  assert.isNotNull(shown);
  assert.strictEqual(shown.status(), 200, "the session page answers 200");

  return { sessionPath, tree: treeOf(yield* Effect.promise(() => shown.text())) };
});

/**
 * Press a key on the focused element, through Playwright's keyboard.
 *
 * @param page The page.
 * @param key The key.
 * @returns The press, as an act {@link arrive} waits on.
 */
const pressing = (page: Page, key: string) => () => page.keyboard.press(key);

/**
 * Submit P1 of a fixture session started on item 1, by mouse: Next, the Text Entry of item 2
 * filled, Submit part, and Confirm on the confirm page.
 *
 * @param page The page, on item 1's session page; it ends on P2's first item.
 * @param sessionPath The session page's path.
 * @param typed The text item 2's Text Entry is filled with.
 * @returns Once P2's first item has loaded.
 */
const submitPartOne = Effect.fn("submitPartOne")(function* submitPartOne(
  page: Page,
  sessionPath: string,
  typed: string,
) {
  yield* arrive(
    page,
    () => slotted(page, "test-navigation", "next").click(),
    atSession(sessionPath),
    "item 2",
  );
  yield* Effect.promise(() => slotted(page, "text-entry-interaction", "control").fill(typed));
  yield* arrive(
    page,
    () => slotted(page, "test-navigation", "submit").click(),
    atConfirm(sessionPath),
    "the confirm page",
  );
  yield* arrive(
    page,
    () => confirmPageButton(page, "confirm").click(),
    atPartSubmitted(sessionPath),
    "P2's first item",
  );

  assert.strictEqual(yield* positionOf(page), partTwoFirst);
});

/**
 * Open a review page of a session's item and read the HTML it answered.
 *
 * @param page The page.
 * @param sessionPath The session page's path.
 * @param sequenceIndex The item's sequence index.
 * @returns The answered page's tree; the test fails unless the page answered 200.
 */
const openReview = Effect.fn("openReview")(function* openReview(
  page: Page,
  sessionPath: string,
  sequenceIndex: number,
) {
  const { origin } = yield* Playground;
  const response = yield* Effect.promise(() =>
    page.goto(`${origin}${sessionPath}/review/${String(sequenceIndex)}`),
  );

  assert.isNotNull(response);
  assert.strictEqual(response.status(), 200, `item ${String(sequenceIndex)}'s review page`);

  return treeOf(yield* Effect.promise(() => response.text()));
});

/**
 * Read whether each element a locator matches is checked.
 *
 * @param controls The Controls.
 * @returns Each one's checked state, in document order.
 */
const checkedStates = Effect.fn("checkedStates")(function* checkedStates(controls: Locator) {
  const all = yield* Effect.promise(() => controls.all());

  return yield* Effect.all(all.map((each) => Effect.promise(() => each.isChecked())));
});

eachEngine((it) => {
  it.layer(fixturePlaygroundLayer)("the keyboard on the fixture session's pages", (keys) => {
    keys.effect(
      "[T-4] Tab order: on item 1's session page, the stops from the item's first control through the navigation are tabOrder's over the page's HTML: the disabled Previous is no stop, and the item list's buttons, the current one included, are stops",
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* sessionTabOrder() {
            const key = yield* nextControlKey(page);
            const { sessionPath, tree } = yield* startShown(page);
            const form = sessionForm(sessionPath);
            const expected = expectedStops(tree, form);
            const stops = yield* browserStops(page, key, form, boundOf(tree));
            const navigation = yield* navigationOf(page);
            const itemButtons = navigationElements(tree, "itemButton");
            const [previous] = navigationElements(tree, "previous");
            const current = itemButtons.filter(
              (element) => attribute(element, "aria-current") !== undefined,
            );

            assert.deepStrictEqual(stops, expected);
            assert.deepStrictEqual(
              navigation.filter((button) => button.disabled).map((button) => button.part),
              ["previous"],
              "Previous is the one disabled part",
            );
            assert.isDefined(previous);
            assert.notInclude(stops, elementKey(previous), "the disabled Previous is no stop");
            assert.strictEqual(itemButtons.length, partOne.length);
            assert.strictEqual(current.length, 1, "one item button is current");
            for (const button of itemButtons) {
              assert.include(stops, elementKey(button), "each item button is a stop");
            }
          }),
        ),
    );

    keys.effect(
      "[T-4] Enter on Next moves to item 2, and Space on Previous moves back to item 1",
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* enterAndSpace() {
            const key = yield* nextControlKey(page);
            const { sessionPath, tree } = yield* startShown(page);

            yield* tabUntil(page, key, slotted(page, "test-navigation", "next"), boundOf(tree));

            const second = yield* arrive(
              page,
              pressing(page, "Enter"),
              atSession(sessionPath),
              "item 2",
            );

            assert.strictEqual(yield* positionOf(page), 2, "Enter on Next moves to item 2");

            yield* tabUntil(
              page,
              key,
              slotted(page, "test-navigation", "previous"),
              boundOf(second),
            );
            yield* arrive(page, pressing(page, "Space"), atSession(sessionPath), "item 1");

            assert.strictEqual(yield* positionOf(page), 1, "Space on Previous moves to item 1");
          }),
        ),
    );

    keys.effect(
      "[T-4] On the confirm page, Return is reached and Enter on it returns to the item, and Confirm is reached and Enter on it submits P1, so P2's first item shows with the Part submitted Status",
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* confirmByKeys() {
            const key = yield* nextControlKey(page);
            const { sessionPath, tree } = yield* startShown(page);
            const submitPart = slotted(page, "test-navigation", "submit");

            yield* tabUntil(page, key, submitPart, boundOf(tree));

            const confirming = yield* arrive(
              page,
              pressing(page, "Enter"),
              atConfirm(sessionPath),
              "the confirm page",
            );

            yield* tabUntil(page, key, confirmPageButton(page, "return"), boundOf(confirming));

            const returned = yield* arrive(
              page,
              pressing(page, "Enter"),
              atSession(sessionPath),
              "item 1 after Return",
            );

            assert.strictEqual(yield* positionOf(page), 1, "Return goes back to item 1");
            assert.isTrue(Option.isNone(yield* statusOf(page)), "Return shows no Status");

            yield* tabUntil(page, key, submitPart, boundOf(returned));

            const again = yield* arrive(
              page,
              pressing(page, "Enter"),
              atConfirm(sessionPath),
              "the confirm page again",
            );

            yield* tabUntil(page, key, confirmPageButton(page, "confirm"), boundOf(again));
            yield* arrive(
              page,
              pressing(page, "Enter"),
              atPartSubmitted(sessionPath),
              "P2's first item",
            );

            assert.strictEqual(yield* positionOf(page), partTwoFirst, "Confirm submits P1");
            assert.deepStrictEqual(
              (yield* statusOf(page)).pipe(Option.map((status) => status.heading)),
              Option.some(message(locale, "partSubmitted")),
            );
          }),
        ),
    );

    keys.effect(
      "[T-11] On a review page a Choice's controls are no stop, and a text Control is a stop whose value typing leaves unchanged",
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* reviewStops() {
            const key = yield* nextControlKey(page);
            const { sessionPath } = yield* startShown(page);
            const typed = "Seven";

            yield* submitPartOne(page, sessionPath, typed);

            const choiceReview = yield* openReview(page, sessionPath, 1);
            const choiceSlot = rowFor("choice-interaction", "control").slot;
            const choices = elementsOf([choiceReview]).filter(
              (element) => attribute(element, "data-slot") === choiceSlot,
            );

            assert.isAbove(choices.length, 1, "item 1 shows its Choice's controls");
            assert.deepStrictEqual(expectedStops(choiceReview, itemRegion), []);
            assert.deepStrictEqual(
              yield* browserStops(page, key, itemRegion, boundOf(choiceReview)),
              [],
              "no press stops on a Choice's control",
            );

            const textReview = yield* openReview(page, sessionPath, 2);
            const textControl = slotted(page, "text-entry-interaction", "control");
            const expected = expectedStops(textReview, itemRegion);

            assert.strictEqual(expected.length, 1, "the Text Entry's Control is the item's stop");
            assert.deepStrictEqual(
              yield* browserStops(page, key, itemRegion, boundOf(textReview)),
              expected,
            );
            assert.isNotNull(
              yield* Effect.promise(() => textControl.getAttribute("readonly")),
              "the text Control is readonly in the DOM",
            );

            yield* Effect.promise(() => page.reload());
            yield* tabUntil(page, key, textControl, boundOf(textReview));

            const before = yield* Effect.promise(() => textControl.inputValue());

            yield* Effect.promise(() => page.keyboard.type("Eight"));

            assert.strictEqual(before, typed, "review shows the candidate's value");
            assert.strictEqual(
              yield* Effect.promise(() => textControl.inputValue()),
              before,
              "typing leaves the value unchanged",
            );
          }),
        ),
    );

    keys.effect(
      "[T-4] [keyboard] P1 completed by keys alone: each item answered, Enter on Next between them, Enter on Submit part, and Enter on Confirm on the confirm page, which lists the three answered; P2's first item follows with the Part submitted Status focused",
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* partOneByKeys() {
            const key = yield* nextControlKey(page);
            const { sessionPath, tree } = yield* startShown(page);
            const next = slotted(page, "test-navigation", "next");
            const choiceControls = slotted(page, "choice-interaction", "control");

            const radios = yield* count(choiceControls);

            assert.isAbove(radios, 1, "item 1 shows its radios");

            yield* tabUntil(page, key, choiceControls, boundOf(tree));
            yield* press(page, "ArrowDown");

            assert.deepStrictEqual(
              yield* checkedStates(choiceControls),
              Array.from({ length: radios }, (_, index) => index === 1),
              "ArrowDown from the first radio checks item 1's second",
            );

            yield* tabUntil(page, key, next, boundOf(tree));

            const second = yield* arrive(
              page,
              pressing(page, "Enter"),
              atSession(sessionPath),
              "item 2",
            );

            yield* tabUntil(
              page,
              key,
              slotted(page, "text-entry-interaction", "control"),
              boundOf(second),
            );
            yield* Effect.promise(() => page.keyboard.type("Seven"));
            yield* tabUntil(page, key, next, boundOf(second));

            const third = yield* arrive(
              page,
              pressing(page, "Enter"),
              atSession(sessionPath),
              "item 3",
            );
            const boxes = yield* Effect.promise(() => choiceControls.all());

            assert.isAbove(boxes.length, 2, "item 3 shows its checkboxes");

            const ticked = boxes.map((_, index) => index < 2);
            for (const [index, box] of boxes.entries()) {
              if (ticked[index] === true) {
                yield* tabUntil(page, key, box, boundOf(third));
                yield* press(page, "Space");
              }
            }

            assert.deepStrictEqual(yield* checkedStates(choiceControls), ticked);

            yield* tabUntil(page, key, slotted(page, "test-navigation", "submit"), boundOf(third));

            const confirming = yield* arrive(
              page,
              pressing(page, "Enter"),
              atConfirm(sessionPath),
              "the confirm page",
            );

            assert.deepStrictEqual(
              yield* Effect.promise(() => page.getByRole("listitem").allTextContents()),
              partOne.map((n) =>
                message(locale, "itemState", {
                  item: message(locale, "item", { n: numeral(locale, n) }),
                  state: message(locale, "itemAnswered"),
                }),
              ),
            );

            yield* tabUntil(page, key, confirmPageButton(page, "confirm"), boundOf(confirming));
            yield* arrive(
              page,
              pressing(page, "Enter"),
              atPartSubmitted(sessionPath),
              "P2's first item",
            );

            assert.strictEqual(yield* positionOf(page), partTwoFirst);
            assert.deepStrictEqual(
              (yield* statusOf(page)).pipe(Option.map((status) => status.heading)),
              Option.some(message(locale, "partSubmitted")),
            );
            assert.isTrue(
              yield* isFocused(page, page.getByRole("status")),
              "the Part submitted Status holds focus",
            );
          }),
        ),
    );
  });
});

/**
 * The accessibility tree of M2's session pages while a candidate answers, in Chromium and WebKit
 * with JavaScript off (spec §4.15): the test navigation, the Status region after a refused answer
 * and after a part submit, and the confirm page.
 *
 * Every assertion reads Playwright's computed tree in both engines, and Chromium's own tree in
 * Chromium too; each test's title names the trees its engine read. `aria-current` is read in the
 * DOM, since no tree reached here exposes it. Expected values come from the code the playground
 * runs: the HTML each page answered, whose parts are found through the part table and named by
 * `nameOf` (a heading's and a list item's words by `textOf`, which `nameOf` does not name),
 * `encodeIntent`, and the locale's messages.
 */
import { assert } from "@effect/vitest";
import { Effect, Option } from "effect";
import type { Locator, Page } from "playwright-core";
import type { Element } from "#plate/emit/node.ts";
import { partForSlot, rowFor } from "#plate/emit/parts.ts";
import { encodeIntent } from "#plate/form/intent.ts";
import { message, numeral } from "#plate/messages.ts";
import { attribute, inputType, nameOf, textOf } from "#plate/test/accessibility.ts";
import {
  axQuery,
  byNodeId,
  chromiumTree,
  descendantsOf,
  focusedIn,
  propertyOf,
} from "#plate/test/ax-tree.ts";
import type { AxNode } from "#plate/test/ax-tree.ts";
import { Playground, eachEngine, nextControlKey, withPage } from "#plate/test/browsers.ts";
import type { EngineName } from "#plate/test/browsers.ts";
import {
  assertResultFirst,
  byId,
  count,
  elementsOf,
  exposed,
  focusedElement,
  press,
  snapshotDescendants,
  snapshotOf,
  snapshotTexts,
  treeOf,
  treesRead,
} from "#plate/test/playground-page.ts";
import type { SnapshotNode } from "#plate/test/playground-page.ts";
import {
  fixturePlaygroundLayer,
  navigationButtonParts,
  navigationOf,
  positionOf,
  startFixtureSession,
  startPackageSession,
  statusOf,
} from "#plate/test/session-page.ts";
import type { NavigationButton, NavigationButtonPart } from "#plate/test/session-page.ts";

/**
 * The corpus package the refusal is posted in, and its test's path from the package's root.
 * BGtest's one part is nonlinear and submits each item on its own, so its Submit posts
 * `submit-item`, "Submit answer".
 */
const begGuide = { id: "BegGuide_March2025", test: "BGtest.xml" } as const;

/**
 * BG008's place in BGtest's sequence, and the most choices its Choice takes (`max-choices="3"`);
 * the refusal ticks one more.
 */
const bg008 = { maxChoices: 3, sequenceIndex: 3 } as const;

/**
 * The fixture test's part P1, nonlinear and simultaneous, as its navigation lists it: items 1 to
 * 3, one button each; P2's first item is item 4.
 */
const partOne = { items: [1, 2, 3], nextPartFirst: 4 } as const;

/**
 * The markers the tests find parts by, read through the part table.
 */
const slots = {
  choiceControl: rowFor("choice-interaction", "control").slot,
  navigation: rowFor("test-navigation", "root").slot,
} as const;

/**
 * Locate the elements a `data-slot` marker names.
 *
 * @param scope The page, or a locator to search below.
 * @param slot The marker, read from the part table.
 * @returns The locator.
 */
const bySlot = (scope: Locator | Page, slot: string): Locator =>
  scope.locator(`[data-slot="${slot}"]`);

/**
 * Find the one element of an answered page that a test reads.
 *
 * @param tree The page's tree.
 * @param matches Whether an element is the one.
 * @param what The element, for a failure message.
 * @returns The element; the test fails unless exactly one matches.
 */
const onlyElement = (
  tree: Element,
  matches: (element: Element) => boolean,
  what: string,
): Element => {
  const found = elementsOf([tree]).filter(matches);

  assert.strictEqual(found.length, 1, `the answered page holds one ${what}`);

  const [element] = found;
  assert.isDefined(element);

  return element;
};

/**
 * Find the navigation button part an element's `data-slot` marker names, through the part table.
 *
 * @param element The element.
 * @returns The part, or none when the element is no navigation button.
 */
const buttonPartOf = (element: Element): Option.Option<NavigationButtonPart> =>
  Option.flatMap(partForSlot(attribute(element, "data-slot") ?? ""), (named) =>
    named.interaction === "test-navigation"
      ? Option.fromUndefinedOr(navigationButtonParts.find((part) => part === named.part))
      : Option.none(),
  );

/**
 * Read the navigation buttons of the HTML a session page answered, as `navigationOf` reads them
 * from the browser.
 *
 * @param tree The page's tree.
 * @returns Each button's part, `nameOf` name, `disabled`, `data-intent` and `aria-current`, in
 *   document order.
 */
const answeredNavigation = (tree: Element): readonly NavigationButton[] =>
  elementsOf([tree]).flatMap((element) =>
    Option.match(buttonPartOf(element), {
      onNone: () => [],
      onSome: (part) => [
        {
          ariaCurrent: Option.fromUndefinedOr(attribute(element, "aria-current")),
          dataIntent: Option.fromUndefinedOr(attribute(element, "data-intent")),
          disabled: attribute(element, "disabled") !== undefined,
          name: nameOf(element, tree),
          part,
        },
      ],
    }),
  );

/**
 * The page a press of a form's button led to: the method and the path of the request that
 * answered it, and the tree of that answer's HTML.
 */
interface Arrival {
  readonly method: string;
  readonly path: string;
  readonly search: string;
  readonly tree: Element;
}

/**
 * Press a button that posts the page's form, and read the page the post leads to: the answer to
 * the post itself when it answers in place, as a refused post does, or the page its 303 leads to.
 *
 * @param page The page.
 * @param button The button.
 * @returns The answering request's method, path and query, and the answer's tree, once the page
 *   has loaded; the test fails unless that answer is a 200.
 */
const arrive = Effect.fn("arrive")(function* arrive(page: Page, button: Locator) {
  const [response] = yield* Effect.promise(() =>
    Promise.all([
      page.waitForResponse(
        (answer) =>
          answer.request().isNavigationRequest() &&
          answer.request().frame() === page.mainFrame() &&
          answer.status() !== 303,
      ),
      page.waitForEvent("load"),
      button.click(),
    ]),
  );
  const url = new URL(response.url());
  const method = response.request().method();

  assert.strictEqual(response.status(), 200, `${method} ${url.pathname}${url.search}`);

  return {
    method,
    path: url.pathname,
    search: url.search,
    tree: treeOf(yield* Effect.promise(() => response.text())),
  } satisfies Arrival;
});

/**
 * Read the page a session page answers now, through a `GET` of its URL outside the browser; a
 * session page's `GET` changes nothing in the session.
 *
 * @param page The page, on a session page.
 * @returns The answered page's tree; the test fails unless it answers 200.
 */
const answeredNow = Effect.fn("answeredNow")(function* answeredNow(page: Page) {
  const answer = yield* Effect.promise(() => fetch(page.url()));

  assert.strictEqual(answer.status, 200, `GET ${page.url()}`);

  return treeOf(yield* Effect.promise(() => answer.text()));
});

/**
 * Locate a navigation button of the session page by the intent it posts.
 *
 * @param page The page.
 * @param intent The intent, as `encodeIntent` writes it.
 * @returns The locator.
 */
const navigationButton = (page: Page, intent: string): Locator =>
  bySlot(page, slots.navigation).locator(`[data-intent="${intent}"]`);

/**
 * Collect the names of the buttons below a node of Playwright's computed tree, in tree order.
 *
 * @param node The node.
 * @returns The names.
 */
const buttonNames = (node: SnapshotNode): readonly string[] =>
  snapshotDescendants(node)
    .filter((below) => below.role === "button")
    .map((below) => below.name ?? "");

/**
 * Collect the descendants of a node of Chromium's tree that are exposed with a role.
 *
 * @param node The node.
 * @param nodes The tree's nodes.
 * @param role The role.
 * @returns The descendants, not ignored, of that role, in tree order.
 */
const exposedBelow = (node: AxNode, nodes: readonly AxNode[], role: string): readonly AxNode[] =>
  descendantsOf(node, byNodeId(nodes)).filter((below) => !below.ignored && below.role === role);

/**
 * Find the one node of a list.
 *
 * @param found The nodes.
 * @param what The node, for a failure message.
 * @returns The node; the test fails unless the list holds exactly one.
 */
const onlyNode = (found: readonly AxNode[], what: string): AxNode => {
  assert.strictEqual(found.length, 1, `Chromium's tree exposes one ${what}`);

  const [node] = found;
  assert.isDefined(node);

  return node;
};

/**
 * Assert that the session page's navigation is the one the page answered, in the DOM and in each
 * tree the engine reads: a `navigation` landmark named by the answered Root; its buttons in order,
 * each with its role, name and `disabled` as answered; the item list's buttons in order; and, in
 * the DOM, each button's `data-intent` and `aria-current` as answered.
 *
 * @param page The page, on a session page.
 * @param engine The engine.
 * @param answered The tree of the HTML the session page answered.
 * @returns The navigation's buttons as the answered page holds them, for the data's own checks.
 */
const assertNavigation = Effect.fn("assertNavigation")(function* assertNavigation(
  page: Page,
  engine: EngineName,
  answered: Element,
) {
  const root = onlyElement(
    answered,
    (element) => attribute(element, "data-slot") === slots.navigation,
    "navigation Root",
  );
  const name = nameOf(root, answered);
  const expected = answeredNavigation(answered);
  const listed = expected.filter((button) => button.part === "itemButton");

  assert.strictEqual(name, message("en", "testNavigation"));
  assert.deepStrictEqual(yield* navigationOf(page), expected, "the DOM's buttons, as answered");

  const landmark = page.getByRole("navigation", { exact: true, name });

  assert.strictEqual(
    yield* count(landmark.and(bySlot(page, slots.navigation))),
    1,
    "the navigation landmark is the navigation Root",
  );

  const node = yield* snapshotOf(landmark);

  assert.strictEqual(node.role, "navigation");
  assert.strictEqual(node.name, name);
  assert.deepStrictEqual(
    buttonNames(node),
    expected.map((button) => button.name),
  );
  assert.deepStrictEqual(
    buttonNames(yield* snapshotOf(landmark.getByRole("list"))),
    listed.map((button) => button.name),
  );
  for (const button of expected) {
    assert.strictEqual(
      yield* count(
        landmark.getByRole("button", {
          disabled: button.disabled,
          exact: true,
          name: button.name,
        }),
      ),
      1,
      `the computed tree's ${button.name} is ${button.disabled ? "disabled" : "enabled"}`,
    );
  }

  if (engine === "chromium") {
    const nodes = yield* chromiumTree(page, engine);
    const own = exposed(nodes, "navigation", name);
    const buttons = exposedBelow(own, nodes, "button");
    const list = onlyNode(exposedBelow(own, nodes, "list"), "item list in the navigation");

    assert.deepStrictEqual(
      buttons.map((button) => button.name),
      expected.map((button) => button.name),
    );
    assert.deepStrictEqual(
      buttons.map((button) => propertyOf(button, "disabled") === true),
      expected.map((button) => button.disabled),
    );
    assert.deepStrictEqual(
      exposedBelow(list, nodes, "button").map((button) => button.name),
      listed.map((button) => button.name),
    );

    const queried = yield* axQuery(page, engine, { name, role: "navigation" });

    assert.deepStrictEqual(
      queried
        .filter((found) => !found.ignored)
        .map((found) => Option.getOrUndefined(found.backendDOMNodeId)),
      [Option.getOrUndefined(own.backendDOMNodeId)],
    );
  }

  return expected;
});

/**
 * Assert that the current item's button, and no other navigation button, carries
 * `aria-current="step"` in the DOM, and that the item list's buttons go to P1's items in order.
 *
 * @param buttons The navigation's buttons, as the page answered them and the DOM holds them.
 * @param position The current item's sequence index.
 */
const assertCurrent = (buttons: readonly NavigationButton[], position: number): void => {
  assert.deepStrictEqual(
    buttons.filter((button) => button.part === "itemButton").map((button) => button.dataIntent),
    partOne.items.map((sequenceIndex) => Option.some(encodeIntent({ kind: "go", sequenceIndex }))),
  );
  assert.deepStrictEqual(
    buttons
      .filter((button) => Option.isSome(button.ariaCurrent))
      .map((button) => [button.part, button.ariaCurrent, button.dataIntent]),
    [
      [
        "itemButton",
        Option.some("step"),
        Option.some(encodeIntent({ kind: "go", sequenceIndex: position })),
      ],
    ],
  );
};

/**
 * Assert that the page opened at its Status region, which a heading names and the page focuses:
 * the region is the answered page's one `role="status"`, named by its heading, is the focused
 * element in Playwright's computed tree and, in Chromium, in Chromium's own tree, and holds the
 * heading's words.
 *
 * @param page The page.
 * @param engine The engine.
 * @param answered The tree of the HTML the page answered.
 * @param heading The heading's words.
 * @returns Once every assertion has held.
 */
const assertStatusFocused = Effect.fn("assertStatusFocused")(function* assertStatusFocused(
  page: Page,
  engine: EngineName,
  answered: Element,
  heading: string,
) {
  const region = onlyElement(
    answered,
    (element) => attribute(element, "role") === "status",
    "Status region",
  );
  const regionName = nameOf(region, answered);

  assert.strictEqual(regionName, heading);

  const status = page.getByRole("status", { exact: true, name: regionName });

  assert.strictEqual(yield* count(status.and(byId(page, attribute(region, "id") ?? ""))), 1);
  assert.strictEqual(
    yield* count(status.and(page.locator(":focus"))),
    1,
    yield* focusedElement(page),
  );
  assert.include(snapshotTexts(yield* snapshotOf(status)), heading);

  const seen = yield* statusOf(page);

  assert.strictEqual(
    seen.pipe(
      Option.map((shown) => shown.heading),
      Option.getOrUndefined,
    ),
    heading,
  );

  if (engine === "chromium") {
    const nodes = yield* chromiumTree(page, engine);
    const own = exposed(nodes, "status", regionName);

    assert.deepStrictEqual(
      focusedIn(nodes).map((focused) => focused.nodeId),
      [own.nodeId],
    );
  }
});

eachEngine((it, name) => {
  it.layer(fixturePlaygroundLayer)("the accessibility tree, session pages", (sessions) => {
    sessions.effect(
      `[T-4] The navigation on P1's first item: the navigation landmark is named Test navigation; its buttons have role button, their names and disabled exactly as the data says (Previous only); the item list's buttons are in order; item 1's button holds aria-current="step" in the DOM, in ${treesRead(name)}`,
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* firstItem() {
            const { origin } = yield* Playground;

            yield* startFixtureSession(page, origin);

            const buttons = yield* assertNavigation(page, name, yield* answeredNow(page));

            assert.strictEqual(yield* positionOf(page), 1);
            assert.deepStrictEqual(
              buttons.map((button) => [button.part, button.disabled]),
              [
                ["previous", true],
                ["itemButton", false],
                ["itemButton", false],
                ["itemButton", false],
                ["next", false],
                ["submit", false],
              ],
            );
            assertCurrent(buttons, 1);
          }),
        ),
    );

    sessions.effect(
      `[T-4] The navigation on P1's last item, reached by its item button: Next is disabled and Previous enabled, as the data says; item 3's button holds aria-current="step" in the DOM, in ${treesRead(name)}`,
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* lastItem() {
            const { origin } = yield* Playground;
            const sessionPath = yield* startFixtureSession(page, origin);
            const last = partOne.items.at(-1) ?? assert.fail("P1 holds an item");
            const moved = yield* arrive(
              page,
              navigationButton(page, encodeIntent({ kind: "go", sequenceIndex: last })),
            );

            assert.deepStrictEqual([moved.method, moved.path], ["GET", sessionPath]);
            assert.strictEqual(yield* positionOf(page), last);

            const buttons = yield* assertNavigation(page, name, moved.tree);

            assert.deepStrictEqual(
              buttons.map((button) => [button.part, button.disabled]),
              [
                ["previous", false],
                ["itemButton", false],
                ["itemButton", false],
                ["itemButton", false],
                ["next", true],
                ["submit", false],
              ],
            );
            assertCurrent(buttons, last);
          }),
        ),
    );

    sessions.effect(
      `[T-4] After a refusal that concerns the item: BG008 of BGtest with four ticked against max-choices="3", then Submit answer, which score refuses: the Status region is focused and holds Not accepted and the atMost message; the refused Control is invalid and described by it; the next control key from the region reaches a Control of the item, in ${treesRead(name)}`,
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* refusal() {
            const { origin } = yield* Playground;
            const key = yield* nextControlKey(page);
            const sessionPath = yield* startPackageSession(
              page,
              origin,
              begGuide.id,
              begGuide.test,
            );
            const reached = yield* arrive(
              page,
              navigationButton(
                page,
                encodeIntent({ kind: "go", sequenceIndex: bg008.sequenceIndex }),
              ),
            );

            assert.deepStrictEqual([reached.method, reached.path], ["GET", sessionPath]);
            assert.strictEqual(yield* positionOf(page), bg008.sequenceIndex);

            const ticked = (yield* Effect.promise(() =>
              bySlot(page, slots.choiceControl).all(),
            )).slice(0, bg008.maxChoices + 1);

            assert.strictEqual(ticked.length, bg008.maxChoices + 1, "BG008 offers enough choices");
            for (const control of ticked) {
              yield* Effect.promise(() => control.check({ force: true }));
            }

            assert.deepStrictEqual(
              yield* Effect.all(ticked.map((control) => Effect.promise(() => control.isChecked()))),
              ticked.map(() => true),
            );

            const submit = page
              .getByRole("navigation", { exact: true, name: message("en", "testNavigation") })
              .getByRole("button", { exact: true, name: message("en", "submitAnswer") });
            const refused = yield* arrive(page, submit);
            const atMost = message("en", "atMost", { n: numeral("en", bg008.maxChoices) });

            assert.deepStrictEqual(
              [refused.method, refused.path],
              ["POST", sessionPath],
              "the refused answer is answered in place",
            );

            yield* assertResultFirst(page, name, refused.tree, [
              message("en", "notAccepted"),
              atMost,
            ]);

            const seen = yield* statusOf(page);

            assert.isTrue(
              Option.exists(
                seen,
                (shown) =>
                  shown.heading === message("en", "notAccepted") && shown.text.includes(atMost),
              ),
              "statusOf reads the region's heading and message",
            );

            const controls = elementsOf([refused.tree]).filter(
              (element) => attribute(element, "data-slot") === slots.choiceControl,
            );
            const invalid =
              controls.find((element) => attribute(element, "aria-invalid") === "true") ??
              assert.fail("the answered page marks a refused Control");
            const refusedName = nameOf(invalid, refused.tree);
            const role = inputType(invalid) === "checkbox" ? "checkbox" : "radio";
            const control = byId(page, attribute(invalid, "id") ?? "");
            const node = yield* snapshotOf(control);

            assert.strictEqual(node.role, role);
            assert.strictEqual(node.name, refusedName);
            assert.strictEqual(node.invalid, true);
            assert.strictEqual(
              yield* count(
                page
                  .getByRole(role, { description: atMost, exact: true, name: refusedName })
                  .and(control),
              ),
              1,
            );

            if (name === "chromium") {
              const own = exposed(yield* chromiumTree(page, name), role, refusedName);

              assert.strictEqual(propertyOf(own, "invalid"), "true");
              assert.strictEqual(own.description, atMost);
            }

            yield* press(page, key);

            const itemControls = page.locator(
              controls.map((element) => `[id="${attribute(element, "id") ?? ""}"]`).join(", "),
            );

            assert.strictEqual(
              yield* count(itemControls.and(page.locator(":focus"))),
              1,
              yield* focusedElement(page),
            );

            if (name === "chromium") {
              const focused = focusedIn(yield* chromiumTree(page, name));

              assert.deepStrictEqual(
                focused.map((reachedNode) => reachedNode.role),
                [role],
              );
            }
          }),
        ),
    );

    sessions.effect(
      `[T-4] After a part submit: P1's Submit part, then the confirm page's Confirm, leads to P2's first item, whose Status region is focused and headed Part submitted, in ${treesRead(name)}`,
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* partSubmitted() {
            const { origin } = yield* Playground;
            const sessionPath = yield* startFixtureSession(page, origin);
            const confirming = yield* arrive(
              page,
              navigationButton(page, encodeIntent({ kind: "submit-part" })),
            );

            assert.deepStrictEqual(
              [confirming.method, confirming.path],
              ["GET", `${sessionPath}/confirm`],
            );

            const submitted = yield* arrive(
              page,
              page.getByRole("button", { exact: true, name: message("en", "confirm") }),
            );

            assert.deepStrictEqual(
              [submitted.method, submitted.path, submitted.search],
              ["GET", sessionPath, "?notice=part-submitted"],
            );
            assert.strictEqual(yield* positionOf(page), partOne.nextPartFirst);

            yield* assertStatusFocused(page, name, submitted.tree, message("en", "partSubmitted"));
          }),
        ),
    );

    sessions.effect(
      `[T-4] The confirm page: its heading, its list of P1's unanswered items, and its Confirm and Return buttons, each by role and name, in ${treesRead(name)}`,
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* confirmPage() {
            const { origin } = yield* Playground;

            yield* startFixtureSession(page, origin);

            const testTitle = textOf(
              onlyElement(yield* answeredNow(page), (element) => element.tag === "h1", "h1"),
            );
            const confirming = yield* arrive(
              page,
              navigationButton(page, encodeIntent({ kind: "submit-part" })),
            );
            const answered = confirming.tree;
            const title = textOf(onlyElement(answered, (element) => element.tag === "h1", "h1"));
            const listHeading = textOf(
              onlyElement(
                answered,
                (element) =>
                  element.tag === "h2" && textOf(element) === message("en", "confirmList"),
                "list heading",
              ),
            );
            const listed = elementsOf(
              onlyElement(answered, (element) => element.tag === "ul", "list").children,
            )
              .filter((element) => element.tag === "li")
              .map(textOf);
            const form = onlyElement(
              answered,
              (element) => element.tag === "form" && nameOf(element, answered) === title,
              "form named by the heading",
            );
            const buttons = elementsOf(form.children)
              .filter((element) => element.tag === "button")
              .map((element) => nameOf(element, answered));

            assert.strictEqual(
              title,
              message("en", "confirmTitle", {
                intent: message("en", "submitPart"),
                test: testTitle,
              }),
            );
            assert.deepStrictEqual(
              listed,
              partOne.items.map((sequenceIndex) =>
                message("en", "itemState", {
                  item: message("en", "item", { n: numeral("en", sequenceIndex) }),
                  state: message("en", "itemNotAnswered"),
                }),
              ),
            );
            assert.deepStrictEqual(buttons, [message("en", "confirm"), message("en", "return")]);

            assert.strictEqual(yield* count(page.getByRole("heading", { level: 1 })), 1);
            assert.strictEqual(
              yield* count(page.getByRole("heading", { exact: true, level: 1, name: title })),
              1,
            );
            assert.strictEqual(
              yield* count(page.getByRole("heading", { exact: true, level: 2, name: listHeading })),
              1,
            );

            const lists = page.getByRole("list");

            assert.strictEqual(yield* count(lists), 1);
            assert.deepStrictEqual(
              snapshotDescendants(yield* snapshotOf(lists))
                .filter((node) => node.role === "listitem")
                .map((node) => snapshotTexts(node).join("")),
              listed,
            );

            const formNode = yield* snapshotOf(
              page.getByRole("form", { exact: true, name: title }),
            );

            assert.strictEqual(formNode.role, "form");
            assert.deepStrictEqual(buttonNames(formNode), buttons);

            if (name === "chromium") {
              const nodes = yield* chromiumTree(page, name);
              const list = onlyNode(
                nodes.filter((node) => !node.ignored && node.role === "list"),
                "list",
              );
              const texts = exposedBelow(list, nodes, "StaticText").map((node) => node.name);

              assert.strictEqual(propertyOf(exposed(nodes, "heading", title), "level"), 1);
              assert.strictEqual(propertyOf(exposed(nodes, "heading", listHeading), "level"), 2);
              assert.strictEqual(exposedBelow(list, nodes, "listitem").length, listed.length);
              assert.deepStrictEqual(
                texts.filter((said) => listed.includes(said)),
                listed,
              );
              assert.deepStrictEqual(
                exposedBelow(exposed(nodes, "form", title), nodes, "button").map(
                  (node) => node.name,
                ),
                buttons,
              );
            }
          }),
        ),
    );
  });
});

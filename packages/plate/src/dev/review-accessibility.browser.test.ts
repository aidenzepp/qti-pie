/**
 * The accessibility tree of the M2 fixture's read-only views in Chromium and WebKit, with
 * JavaScript off: an item in review and in solution, and the closed test's
 * summary with its view links and its results link.
 *
 * Each test sits the fixture's test as a candidate does, by mouse and typing: P1's items answered
 * and P1 submitted through its confirm page, and for the tests that read P2 or the summary, P2
 * answered and submitted too. Playwright's computed tree is read in both engines and Chromium's own
 * tree in Chromium; `readonly`, which no computed tree carries, is read in Chromium's own tree and
 * in the DOM.
 *
 * Expected values come from the code: the HTML each page answered gives the names, a Control's and
 * a region's through `nameOf` and a link's through `textOf`, its content; `solution` gives the
 * correct responses, over the fixture's items as `openPackage` accepted them; `sessionControl`
 * gives each item's review and solution permission; and `message` gives the words. Solution's
 * assertions are the part a ruling of B on T-k drops.
 */
import path from "node:path";
import { assert } from "@effect/vitest";
import type { Locator, Page } from "playwright-core";
import { Effect, Option, Result } from "effect";
import { openDirectory } from "#plate/dev/packages.ts";
import type { Element } from "#plate/emit/node.ts";
import { rowFor } from "#plate/emit/parts.ts";
import type { PartOf } from "#plate/emit/parts.ts";
import { message, numeral } from "#plate/messages.ts";
import { format, isRecordValue } from "#plate/model/values.ts";
import { itemRefs } from "#plate/session/item-refs.ts";
import { sessionControl } from "#plate/session/control.ts";
import type { SessionControl } from "#plate/session/control.ts";
import { solution } from "#plate/solution.ts";
import { attribute, inputType, nameOf, textOf } from "#plate/test/accessibility.ts";
import { axQuery, chromiumTree, propertyOf } from "#plate/test/ax-tree.ts";
import { Playground, eachEngine, withPage } from "#plate/test/browsers.ts";
import type { EngineName } from "#plate/test/browsers.ts";
import {
  byId,
  count,
  elementsOf,
  exposed,
  isFocused,
  snapshotOf,
  snapshotTexts,
  treeOf,
  treesRead,
} from "#plate/test/playground-page.ts";
import {
  arrive,
  fixturePlaygroundLayer,
  navigationOf,
  positionOf,
  startFixtureSession,
  statusOf,
} from "#plate/test/session-page.ts";
import type { Accepted } from "#plate/validate/verdict.ts";

/**
 * The M2 fixture package as `openDirectory` reads it: its location, as the playground names it,
 * and its directory in this package's source.
 */
const fixture = {
  id: "m2",
  location: "fixtures/m2",
  root: path.resolve(import.meta.dirname, "..", "..", "fixtures", "m2"),
} as const;

/**
 * The fixture test's path in its package, the key of its test among the package's tests.
 */
const fixtureTest = "test.xml";

/**
 * The response every fixture item declares, and the only one each holds.
 */
const response = "RESPONSE";

/**
 * What the candidate posts on each item of the fixture's test, by sequence index: P1's Choice of
 * four (radios) answered A, its Text Entry "eight", its shuffled Choice of four (checkboxes) A and
 * B; P2's Extended Text a sentence, its Choice of three B. Each Choice answer is wrong, so review
 * and solution show different values.
 */
const answers = {
  choice: new Map<number, readonly string[]>([
    [1, ["A"]],
    [3, ["A", "B"]],
    [5, ["B"]],
  ]),
  text: new Map<number, string>([
    [2, "eight"],
    [4, "I added the numbers again."],
  ]),
} as const;

/**
 * The fixture test's items by part: P1 holds items 1 to 3, and P2 items 4 and 5.
 */
const parts = { one: [1, 2, 3], two: [4, 5] } as const;

/**
 * What a typing check presses into a read-only Control.
 */
const typed = "x";

/**
 * A read-only view of an item.
 */
type ShownMode = "review" | "solution";

/**
 * One item of the fixture's test, as the code reads it: its sequence index, the item `openPackage`
 * accepted, and the session control in force for its item ref.
 */
interface FixtureItem {
  readonly control: SessionControl;
  readonly item: Accepted;
  readonly sequenceIndex: number;
}

/**
 * A Choice Control as the HTML a page answered presents it: its id, its role, its value (the
 * choice's identifier) and the name `nameOf` gives it.
 */
interface ChoiceControl {
  readonly id: string;
  readonly name: string;
  readonly role: "checkbox" | "radio";
  readonly value: string;
}

/**
 * A text Control as the HTML a page answered presents it: its id and the name `nameOf` gives it.
 */
interface TextControl {
  readonly id: string;
  readonly name: string;
}

/**
 * Write the selector of the elements a part's `data-slot` marker names, read through the part
 * table.
 *
 * @param slot The marker.
 * @returns The attribute selector.
 */
const slotSelector = (slot: string): string => `[data-slot="${slot}"]`;

/**
 * The markers of the Controls the tests read, through the part table.
 */
const slots = {
  choice: rowFor("choice-interaction", "control").slot,
  extendedText: rowFor("extended-text-interaction", "control").slot,
  status: rowFor("item", "status").slot,
  textEntry: rowFor("text-entry-interaction", "control").slot,
} as const;

/**
 * Read the fixture's test as the code accepts it: each of its items in session order, with the
 * item and its session control.
 *
 * @returns The items, from sequence index 1; the test fails unless the package and its test are
 *   accepted and every item ref resolves.
 */
const fixtureItems = Effect.fn("fixtureItems")(function* fixtureItems() {
  const verdict = yield* openDirectory(fixture);
  if (verdict.verdict !== "accepted" && verdict.verdict !== "accepted-with-unsupported") {
    return assert.fail(`the fixture package is ${verdict.verdict}, not accepted`);
  }

  const test =
    verdict.accepted.tests.get(fixtureTest) ?? assert.fail(`the fixture holds ${fixtureTest}`);

  return itemRefs(test.test).map((ref, index): FixtureItem => {
    const item =
      test.items.get(ref.identifier) ?? assert.fail(`the fixture resolves ${ref.identifier}`);
    const control = Result.getOrElse(sessionControl(test.test.test, ref.identifier), () =>
      assert.fail(`the fixture's test holds the item ref ${ref.identifier}`),
    );

    return { control, item, sequenceIndex: index + 1 };
  });
});

/**
 * Find one item of the fixture's test.
 *
 * @param items The fixture's items.
 * @param sequenceIndex The item's sequence index.
 * @returns The item; the test fails when the test holds none at that index.
 */
const itemAt = (items: readonly FixtureItem[], sequenceIndex: number): FixtureItem =>
  items.find((found) => found.sequenceIndex === sequenceIndex) ??
  assert.fail(`the fixture's test holds item ${String(sequenceIndex)}`);

/**
 * Give the values a view shows for an item's response: the candidate's answer in review, the
 * item's correct response, as `solution` gives it, in solution.
 *
 * @param item The item.
 * @param mode The view.
 * @returns The values in their lexical form.
 */
const shownValues = (item: FixtureItem, mode: ShownMode): readonly string[] => {
  if (mode === "review") {
    const text = answers.text.get(item.sequenceIndex);

    return text === undefined ? (answers.choice.get(item.sequenceIndex) ?? []) : [text];
  }

  const correct = solution(item.item)[response];

  return (correct === undefined || isRecordValue(correct) ? [] : correct.values).map(format);
};

/**
 * Give the path of a read-only view of a session's item.
 *
 * @param sessionPath The session page's path, `/sessions/<sid>`.
 * @param mode The view.
 * @param sequenceIndex The item's sequence index.
 * @returns `/sessions/<sid>/<mode>/<n>`.
 */
const viewPath = (sessionPath: string, mode: ShownMode, sequenceIndex: number): string =>
  `${sessionPath}/${mode}/${String(sequenceIndex)}`;

/**
 * Open a page of the playground and read the HTML it answered.
 *
 * @param page The page.
 * @param target The page's path.
 * @returns The page's tree; the test fails unless it answered 200.
 */
const open = Effect.fn("open")(function* open(page: Page, target: string) {
  const { origin } = yield* Playground;
  const answer = yield* Effect.promise(() => page.goto(`${origin}${target}`));

  assert.isNotNull(answer);
  assert.strictEqual(answer.status(), 200, target);

  return treeOf(yield* Effect.promise(() => answer.text()));
});

/**
 * Press the one navigation button of a part, which the session page holds enabled.
 *
 * @param page The page.
 * @param part The navigation part.
 * @returns The click, for {@link arrive}; the test fails unless the button is there and enabled.
 */
const navigate = Effect.fn("navigate")(function* navigate(
  page: Page,
  part: PartOf<"test-navigation">,
) {
  const buttons = (yield* navigationOf(page)).filter((button) => button.part === part);

  assert.strictEqual(buttons.length, 1, `the navigation holds one ${part} button`);
  assert.isFalse(buttons[0]?.disabled ?? true, `the ${part} button is enabled`);

  const button = page.locator(slotSelector(rowFor("test-navigation", part).slot));

  return () => button.click();
});

/**
 * Answer the item the session page shows as {@link answers} says: tick its Choice's Controls with
 * the mouse (`check({ force: true })`, since a Control is a clipped box under its Indicator), or
 * type into its text Control.
 *
 * @param page The page.
 * @returns Once the answer is on the page; the test fails unless the page shows the Controls.
 */
const answer = Effect.fn("answer")(function* answer(page: Page) {
  const sequenceIndex = yield* positionOf(page);
  const text = answers.text.get(sequenceIndex);
  if (text !== undefined) {
    const control = page.locator(
      `${slotSelector(slots.textEntry)}, ${slotSelector(slots.extendedText)}`,
    );

    yield* Effect.promise(() => control.fill(text));
    assert.strictEqual(yield* Effect.promise(() => control.inputValue()), text);

    return;
  }

  for (const value of answers.choice.get(sequenceIndex) ?? []) {
    const control = page.locator(`${slotSelector(slots.choice)}[value="${value}"]`);

    yield* Effect.promise(() => control.check({ force: true }));
    assert.isTrue(yield* Effect.promise(() => control.isChecked()), `choice ${value} is ticked`);
  }
});

/**
 * Answer every item of the part the session page shows, moving by Next, then submit the part
 * through its confirm page.
 *
 * @param page The page, on the part's first item.
 * @param sessionPath The session page's path.
 * @param items The part's sequence indexes, in order.
 * @returns The tree of the page the confirmed submit lands on: the next part's first item, or the
 *   summary.
 */
const sitPart = Effect.fn("sitPart")(function* sitPart(
  page: Page,
  sessionPath: string,
  items: readonly number[],
) {
  const onSession = (method: string, url: URL) => method === "GET" && url.pathname === sessionPath;

  for (const [index, sequenceIndex] of items.entries()) {
    assert.strictEqual(yield* positionOf(page), sequenceIndex, "the session shows the item");

    yield* answer(page);
    if (index < items.length - 1) {
      yield* arrive(page, yield* navigate(page, "next"), onSession);
    }
  }

  yield* arrive(
    page,
    yield* navigate(page, "submit"),
    (method, url) => method === "GET" && url.pathname === `${sessionPath}/confirm`,
  );

  const landed = yield* arrive(
    page,
    () => page.getByRole("button", { exact: true, name: message("en", "confirm") }).click(),
    onSession,
  );

  return landed.tree;
});

/**
 * Start the fixture's test session, answer P1 and submit it, which closes items 1 to 3 and shows
 * P2's first item.
 *
 * @param page The page, which ends on item 4.
 * @returns The session page's path.
 */
const submitPartOne = Effect.fn("submitPartOne")(function* submitPartOne(page: Page) {
  const { origin } = yield* Playground;
  const sessionPath = yield* startFixtureSession(page, origin);

  yield* sitPart(page, sessionPath, parts.one);

  assert.strictEqual(yield* positionOf(page), parts.two[0], "P2's first item follows P1");

  return sessionPath;
});

/**
 * Start the fixture's test session and sit it to the end: P1 and P2 answered and submitted, which
 * closes the test and shows its summary.
 *
 * @param page The page, which ends on the summary.
 * @returns The session page's path and the summary's tree.
 */
const finishTest = Effect.fn("finishTest")(function* finishTest(page: Page) {
  const sessionPath = yield* submitPartOne(page);
  const summary = yield* sitPart(page, sessionPath, parts.two);

  assert.strictEqual(
    (yield* statusOf(page)).pipe(
      Option.map((status) => status.heading),
      Option.getOrUndefined,
    ),
    message("en", "testFinished"),
    "the summary shows",
  );

  return { sessionPath, summary };
});

/**
 * List the Choice Controls of the HTML a page answered, in document order.
 *
 * @param tree The page's tree.
 * @returns Each Control's id, role, value and `nameOf` name; the test fails unless there is one.
 */
const choiceControlsIn = (tree: Element): readonly ChoiceControl[] => {
  const controls = elementsOf([tree])
    .filter((element) => attribute(element, "data-slot") === slots.choice)
    .map((control): ChoiceControl => ({
      id: attribute(control, "id") ?? "",
      name: nameOf(control, tree),
      role: inputType(control) === "checkbox" ? "checkbox" : "radio",
      value: attribute(control, "value") ?? "",
    }));

  assert.isAbove(controls.length, 0, "the page holds a Choice's Controls");

  return controls;
};

/**
 * Find the one text Control of the HTML a page answered, a Text Entry's or an Extended Text's.
 *
 * @param tree The page's tree.
 * @returns Its id and `nameOf` name; the test fails unless there is exactly one.
 */
const textControlIn = (tree: Element): TextControl => {
  const controls = elementsOf([tree]).filter((element) => {
    const slot = attribute(element, "data-slot");

    return slot === slots.textEntry || slot === slots.extendedText;
  });

  assert.strictEqual(controls.length, 1, "the page holds one text Control");

  const [control] = controls;
  assert.isDefined(control);

  return { id: attribute(control, "id") ?? "", name: nameOf(control, tree) };
};

/**
 * Assert that a view's Choice Controls are disabled, each with its role, its `nameOf` name and the
 * checked state the view shows, in Playwright's computed tree and, in Chromium, in Chromium's own
 * tree.
 *
 * @param page The page, on the view.
 * @param engine The engine.
 * @param tree The view's tree.
 * @param shown The values the view shows ticked.
 * @returns Once every assertion has held.
 */
const assertChoicesShown = Effect.fn("assertChoicesShown")(function* assertChoicesShown(
  page: Page,
  engine: EngineName,
  tree: Element,
  shown: readonly string[],
) {
  const controls = choiceControlsIn(tree);
  const ticked = new Set(shown);

  assert.includeMembers(
    controls.map((control) => control.value),
    [...ticked],
    "the view presents every ticked choice",
  );

  for (const control of controls) {
    const checked = ticked.has(control.value);

    assert.strictEqual(
      yield* count(
        page
          .getByRole(control.role, { checked, disabled: true, exact: true, name: control.name })
          .and(byId(page, control.id)),
      ),
      1,
      `the computed tree exposes ${control.role} "${control.name}" disabled, ${checked ? "checked" : "not checked"}`,
    );
  }

  if (engine === "chromium") {
    const nodes = yield* chromiumTree(page, engine);

    assert.deepStrictEqual(
      controls.map((control) => {
        const own = exposed(nodes, control.role, control.name);

        return [control.name, propertyOf(own, "disabled"), propertyOf(own, "checked")];
      }),
      controls.map((control) => [control.name, true, ticked.has(control.value) ? "true" : "false"]),
      "Chromium's own tree",
    );
  }
});

/**
 * Assert that a view's text Control is read-only and shows its value: the role `textbox` and its
 * `nameOf` name in Playwright's computed tree; `readonly` in Chromium's own tree in Chromium; the
 * `readonly` attribute in the DOM; and the value unchanged after a click and typing, in each
 * engine.
 *
 * @param page The page, on the view.
 * @param engine The engine.
 * @param tree The view's tree.
 * @param value The value the view shows.
 * @returns Once every assertion has held.
 */
const assertTextShown = Effect.fn("assertTextShown")(function* assertTextShown(
  page: Page,
  engine: EngineName,
  tree: Element,
  value: string,
) {
  const control = textControlIn(tree);
  const target: Locator = byId(page, control.id);

  assert.strictEqual(
    yield* count(page.getByRole("textbox", { exact: true, name: control.name }).and(target)),
    1,
    `the computed tree exposes textbox "${control.name}"`,
  );
  if (engine === "chromium") {
    assert.isTrue(
      propertyOf(exposed(yield* chromiumTree(page, engine), "textbox", control.name), "readonly"),
      "Chromium's own tree marks the Control readonly",
    );
  }

  assert.isNotNull(
    yield* Effect.promise(() => target.getAttribute("readonly")),
    "the DOM's Control carries readonly",
  );
  assert.strictEqual(yield* Effect.promise(() => target.inputValue()), value);

  yield* Effect.promise(() => target.click());
  assert.isTrue(yield* isFocused(page, target), "a click focuses the read-only Control");

  yield* Effect.promise(() => page.keyboard.type(typed));
  assert.strictEqual(
    yield* Effect.promise(() => target.inputValue()),
    value,
    "typing leaves the value unchanged",
  );
});

/**
 * Name what a read-only Control's assertions read in an engine, for a test's title.
 *
 * @param engine The engine.
 * @returns Chromium's own tree's `readonly` and the DOM in Chromium; the DOM in WebKit.
 */
const readonlyRead = (engine: EngineName): string =>
  engine === "chromium"
    ? "readonly in Chromium's own tree and in the DOM, the value unchanged after typing"
    : "readonly as the DOM attribute, the value unchanged after typing";

eachEngine((it, name) => {
  it.layer(fixturePlaygroundLayer)("the accessibility tree of the read-only views", (views) => {
    views.effect(
      `[Q-2] In review and solution, each Choice Control is disabled with its role, the name nameOf gives it and the checked state the view shows: the candidate's ticks in review, the correct response in solution, in ${treesRead(name)}`,
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* choicesShown() {
            const items = yield* fixtureItems();
            const sessionPath = yield* submitPartOne(page);

            for (const sequenceIndex of parts.one.filter((index) => answers.choice.has(index))) {
              const item = itemAt(items, sequenceIndex);
              for (const mode of ["review", "solution"] as const) {
                const tree = yield* open(page, viewPath(sessionPath, mode, sequenceIndex));

                yield* assertChoicesShown(page, name, tree, shownValues(item, mode));
              }
            }
          }),
        ),
    );

    views.effect(
      `[Q-5] [Q-20] In review and solution, the Text Entry and the Extended Text are read-only with their values: ${readonlyRead(name)}; the role and name in Playwright's computed tree`,
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* textShown() {
            const items = yield* fixtureItems();
            const { sessionPath } = yield* finishTest(page);

            for (const sequenceIndex of answers.text.keys()) {
              const item = itemAt(items, sequenceIndex);
              const modes: readonly ShownMode[] = item.control.showSolution
                ? ["review", "solution"]
                : ["review"];

              for (const mode of modes) {
                const tree = yield* open(page, viewPath(sessionPath, mode, sequenceIndex));
                const [value = ""] = shownValues(item, mode);

                yield* assertTextShown(page, name, tree, value);
              }
            }
          }),
        ),
    );

    views.effect(
      `The Status heading names the mode, "Review" or "Solution", and names the Status region, in ${treesRead(name)}`,
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* statusShown() {
            const sessionPath = yield* submitPartOne(page);

            for (const sequenceIndex of parts.one) {
              for (const mode of ["review", "solution"] as const) {
                const tree = yield* open(page, viewPath(sessionPath, mode, sequenceIndex));
                const heading = message("en", mode);
                const regions = elementsOf([tree]).filter(
                  (element) => attribute(element, "data-slot") === slots.status,
                );
                const [region] = regions;

                assert.strictEqual(regions.length, 1, "the view holds one Status region");
                assert.isDefined(region);
                assert.strictEqual(nameOf(region, tree), heading, "nameOf names the region");
                assert.strictEqual(
                  (yield* statusOf(page)).pipe(
                    Option.map((seen) => seen.heading),
                    Option.getOrUndefined,
                  ),
                  heading,
                );
                assert.strictEqual(
                  yield* count(page.getByRole("status", { exact: true, name: heading })),
                  1,
                  `the computed tree exposes the Status region named "${heading}"`,
                );
                if (name === "chromium") {
                  exposed(yield* chromiumTree(page, name), "status", heading);
                }
              }
            }
          }),
        ),
    );

    views.effect(
      `[T-5] The summary links each item's review as "Review: Item n" and its solution as "Solution: Item n", says in words why an item has no link, and names the results link "Download results (XML)", in ${treesRead(name)}`,
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* summaryLinks() {
            const items = yield* fixtureItems();
            const { sessionPath, summary } = yield* finishTest(page);
            const links = elementsOf([summary]).filter((element) => element.tag === "a");

            /**
             * Assert one link of the summary: in the HTML the page answered, at its path, its text
             * the name (a link is named from its content, which `textOf` reads; `nameOf` reads only
             * a control's explicit references); in Playwright's computed tree and Chromium's own,
             * one link of that name.
             *
             * @param href The link's path.
             * @param linkName The name the link carries.
             * @returns Once every assertion has held.
             */
            const assertLink = Effect.fn("assertLink")(function* assertLink(
              href: string,
              linkName: string,
            ) {
              const answered = links.filter((link) => attribute(link, "href") === href);

              assert.strictEqual(answered.length, 1, `the summary links ${href}`);

              const [link] = answered;
              assert.isDefined(link);
              assert.strictEqual(textOf(link), linkName, "the link's content names it");
              assert.strictEqual(
                yield* count(
                  page
                    .getByRole("link", { exact: true, name: linkName })
                    .and(page.locator(`[href="${href}"]`)),
                ),
                1,
                `the computed tree exposes the link "${linkName}"`,
              );
              if (name === "chromium") {
                const queried = yield* axQuery(page, name, { name: linkName, role: "link" });

                assert.strictEqual(
                  queried.filter((node) => !node.ignored).length,
                  1,
                  `Chromium's own tree exposes one link "${linkName}"`,
                );
              }
            });

            /**
             * Assert that the summary has no link for a view an item does not permit, and says so
             * in words: no link of the view's name in Playwright's computed tree or Chromium's
             * own, and the item's list entry holds the words.
             *
             * @param sequenceIndex The item's sequence index.
             * @param linkName The name the link would carry.
             * @param refused The words shown instead.
             * @returns Once every assertion has held.
             */
            const assertRefused = Effect.fn("assertRefused")(function* assertRefused(
              sequenceIndex: number,
              linkName: string,
              refused: string,
            ) {
              assert.strictEqual(
                yield* count(page.getByRole("link", { exact: true, name: linkName })),
                0,
                `no link "${linkName}"`,
              );
              assert.include(
                snapshotTexts(yield* snapshotOf(page.locator("ol > li").nth(sequenceIndex - 1))),
                refused,
                `item ${String(sequenceIndex)}'s entry says why it has no link`,
              );
              if (name === "chromium") {
                const queried = yield* axQuery(page, name, { name: linkName, role: "link" });

                assert.deepStrictEqual(
                  queried.filter((node) => !node.ignored),
                  [],
                  `Chromium's own tree exposes no link "${linkName}"`,
                );
              }
            });

            for (const item of items) {
              const n = numeral("en", item.sequenceIndex);
              const shown = [
                {
                  allowed: item.control.allowReview,
                  link: message("en", "reviewItem", { n }),
                  mode: "review",
                  refused: message("en", "reviewNotAllowed"),
                },
                {
                  allowed: item.control.showSolution,
                  link: message("en", "solutionItem", { n }),
                  mode: "solution",
                  refused: message("en", "solutionNotAllowed"),
                },
              ] as const;

              for (const view of shown) {
                yield* view.allowed
                  ? assertLink(viewPath(sessionPath, view.mode, item.sequenceIndex), view.link)
                  : assertRefused(item.sequenceIndex, view.link, view.refused);
              }
            }

            assert.isTrue(
              items.some((item) => !item.control.showSolution),
              "an item of the fixture has no solution link",
            );

            yield* assertLink(`${sessionPath}/results.xml`, message("en", "downloadResults"));
          }),
        ),
    );
  });
});

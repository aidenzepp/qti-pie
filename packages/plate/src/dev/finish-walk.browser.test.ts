/**
 * The finishing walk in Chromium and WebKit, with JavaScript off: the M2
 * fixture's test session taken to its end by mouse, through P1's Submit part and its confirm page,
 * the linear part P2, the summary, its Review and Solution pages and its results download; then
 * the plain-HTML host around BG007.
 *
 * Expected values come from the code the playground runs: words from `message`, parts through the
 * part table's markers, the fixture's correct responses from the items its package accepts, and
 * BG007's from the item `open` accepts.
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { assert } from "@effect/vitest";
import { Effect, Option } from "effect";
import type { Page, Response } from "playwright-core";
import { openDirectory } from "#plate/dev/packages.ts";
import { rowFor, scopedId } from "#plate/emit/parts.ts";
import { entryName } from "#plate/form/encoding.ts";
import { message, numeral } from "#plate/messages.ts";
import { format } from "#plate/model/values.ts";
import { attribute, inputType, nameOf } from "#plate/test/accessibility.ts";
import { Playground, eachEngine, withPage } from "#plate/test/browsers.ts";
import {
  choicesOf,
  control,
  correctOf,
  count,
  elementsOf,
  inStatus,
  isFocused,
  treeOf,
} from "#plate/test/playground-page.ts";
import {
  arrive,
  fixturePlaygroundLayer,
  navigationOf,
  positionOf,
  startFixtureSession,
  statusOf,
} from "#plate/test/session-page.ts";
import { validateAgainst } from "#plate/test/xsd.ts";

/**
 * The M2 fixture package as the playground opens it: its id, its location, its directory and its
 * test's path from its root.
 */
const fixture = {
  id: "m2",
  location: "fixtures/m2",
  root: path.resolve(import.meta.dirname, "..", "..", "fixtures", "m2"),
  test: "test.xml",
} as const;

/**
 * The item refs of the fixture's test, by sequence index: P1, nonlinear, holds items 1 to 3; P2,
 * linear, holds items 4 and 5.
 */
const fixtureRefs = {
  1: "p1-single-choice",
  2: "p1-text-entry",
  3: "p1-multiple-choice",
} as const;

/**
 * The sequence index of P2's first item.
 */
const partTwoFirst = 4;

/**
 * The response every item of the fixture declares and binds.
 */
const response = "RESPONSE";

/**
 * The candidate's answers: a wrong choice on item 1 (`9`, where `11` is prime) and a wrong word on
 * item 2, so the Review and Solution pages differ; item 3 is left unanswered; a sentence on item
 * 4 and a choice on item 5.
 */
const answers = {
  itemFive: "B",
  itemFour: "I added each pair again.",
  itemOne: "A",
  itemTwo: "eight",
} as const;

/**
 * BG007, the True/False Choice the plain-HTML host serves, by its corpus path.
 */
const bg007 = "QTI3_BPIG_Examples/items/BG007.xml";

/**
 * The path the playground mounts the plain-HTML host at.
 */
const hostPath = "/hosts/html";

/**
 * The cached Results Reporting XSD the results document validates against.
 */
const resultsXsd = "imsqti_resultv3p0_v1p0.xsd";

/**
 * Write the selector of the elements a `data-slot` marker names.
 *
 * @param slot The marker, read from the part table.
 * @returns The attribute selector.
 */
const slotSelector = (slot: string): string => `[data-slot="${slot}"]`;

/**
 * The item Root's selector, read from the part table.
 */
const itemRoot = slotSelector(rowFor("item", "root").slot);

/**
 * The Status region's selector, read from the part table.
 */
const statusRegion = slotSelector(rowFor("item", "status").slot);

/**
 * Wait for the GET of one path.
 *
 * @param pathname The path.
 * @returns Whether a request is that GET.
 */
const getOf =
  (pathname: string) =>
  (method: string, url: URL): boolean =>
    method === "GET" && url.pathname === pathname;

/**
 * Press a navigation button by mouse, found by its part's marker, and arrive back at the session
 * page, where the post's 303 sends the browser.
 *
 * @param page The page, on the session page.
 * @param part The navigation part.
 * @param sessionPath The session page's path.
 * @returns Once the session page has loaded.
 */
const step = Effect.fn("step")(function* step(
  page: Page,
  part: "next" | "previous",
  sessionPath: string,
) {
  const button = page.locator(slotSelector(rowFor("test-navigation", part).slot));

  assert.strictEqual(yield* count(button), 1, `the navigation holds one ${part} button`);

  yield* arrive(page, () => button.click(), getOf(sessionPath));
});

/**
 * Press the navigation's Submit part by mouse and arrive at the session's confirm page.
 *
 * @param page The page, on the session page.
 * @param sessionPath The session page's path.
 * @returns Once the confirm page has loaded.
 */
const submitPart = Effect.fn("submitPart")(function* submitPart(page: Page, sessionPath: string) {
  const button = page.locator(slotSelector(rowFor("test-navigation", "submit").slot));

  assert.strictEqual(yield* count(button), 1, "the navigation holds one Submit part button");

  yield* arrive(page, () => button.click(), getOf(`${sessionPath}/confirm`));
});

/**
 * Press one of the confirm page's buttons, Confirm or Return, by mouse, and arrive back at the
 * session page.
 *
 * @param page The page, on the confirm page.
 * @param sessionPath The session page's path.
 * @param label The button's label key.
 * @returns Once the session page has loaded.
 */
const confirmBy = Effect.fn("confirmBy")(function* confirmBy(
  page: Page,
  sessionPath: string,
  label: "confirm" | "return",
) {
  const button = page.getByRole("button", { exact: true, name: message("en", label) });

  assert.strictEqual(yield* count(button), 1, `the confirm page holds one ${label} button`);

  yield* arrive(page, () => button.click(), getOf(sessionPath));
});

/**
 * Read the entry name the shown item's response posts under, from the item Root's `id`, which
 * `scopedId` writes for the item instance.
 *
 * @param page The page, showing one item.
 * @returns The entry name; the test fails unless the page shows one item whose Root's `id` is an
 *   item instance's.
 */
const responseEntry = Effect.fn("responseEntry")(function* responseEntry(page: Page) {
  const root = page.locator(itemRoot);

  assert.strictEqual(yield* count(root), 1, "the page shows one item");

  const id = (yield* Effect.promise(() => root.getAttribute("id"))) ?? "";
  const instance = id.replace(/-item$/u, "");

  assert.strictEqual(scopedId(instance, "item"), id, "the item Root's id names its instance");

  return entryName(instance, response);
});

/**
 * Tick a choice of the shown item by mouse: its Control, a clipped box under its Indicator, is
 * checked through a forced click, then read back.
 *
 * @param page The page, showing an item with a Choice.
 * @param identifier The choice's identifier, the value its Control posts.
 * @returns Once the Control is checked.
 */
const tick = Effect.fn("tick")(function* tick(page: Page, identifier: string) {
  const entry = yield* responseEntry(page);
  const target = page.locator(`${itemRoot} input[name="${entry}"][value="${identifier}"]`);

  assert.strictEqual(yield* count(target), 1, `the item holds one Control for ${identifier}`);

  yield* Effect.promise(() => target.check({ force: true }));

  assert.isTrue(yield* Effect.promise(() => target.isChecked()), `${identifier} is checked`);
});

/**
 * Locate the shown item's text Control: its Text Entry or its Extended Text.
 *
 * @param page The page, showing an item with one text Control.
 * @returns The locator.
 */
const textControl = (page: Page) => page.locator(itemRoot).getByRole("textbox");

/**
 * Type into the shown item's text Control, after a click on it.
 *
 * @param page The page, showing an item with one text Control.
 * @param words The text.
 * @returns Once the Control holds the text.
 */
const type = Effect.fn("type")(function* type(page: Page, words: string) {
  const target = textControl(page);

  assert.strictEqual(yield* count(target), 1, "the item holds one text Control");

  yield* Effect.promise(() => target.click());
  yield* Effect.promise(() => target.fill(words));
});

/**
 * A Choice Control of the shown item as the browser holds it.
 */
interface ControlSeen {
  readonly checked: boolean;
  readonly disabled: boolean;
  readonly value: string;
}

/**
 * Read the shown item's Choice Controls: each one's value, checked state and disabled state, in
 * document order.
 *
 * @param page The page, showing an item with a Choice.
 * @returns The Controls; the test fails when the item holds none.
 */
const controlsOf = Effect.fn("controlsOf")(function* controlsOf(page: Page) {
  const entry = yield* responseEntry(page);
  const found = yield* Effect.promise(() =>
    page.locator(`${itemRoot} input[name="${entry}"]`).all(),
  );

  assert.isAbove(found.length, 0, "the item holds Choice Controls");

  const seen: ControlSeen[] = [];
  for (const each of found) {
    seen.push({
      checked: yield* Effect.promise(() => each.isChecked()),
      disabled: yield* Effect.promise(() => each.isDisabled()),
      value: (yield* Effect.promise(() => each.getAttribute("value"))) ?? "",
    });
  }

  return seen;
});

/**
 * Give the values of the checked Controls, sorted.
 *
 * @param seen The Controls.
 * @returns The values.
 */
const checkedValues = (seen: readonly ControlSeen[]): readonly string[] =>
  seen
    .filter((each) => each.checked)
    .map((each) => each.value)
    .toSorted();

/**
 * Read the shown item's text Control: its value, whether it carries `readonly` in the DOM, and
 * whether Playwright finds it editable.
 *
 * @param page The page, showing an item with one text Control.
 * @returns What the browser holds.
 */
const textOf = Effect.fn("textOf")(function* textOf(page: Page) {
  const target = textControl(page);

  assert.strictEqual(yield* count(target), 1, "the item holds one text Control");

  return {
    editable: yield* Effect.promise(() => target.isEditable()),
    readonly: (yield* Effect.promise(() => target.getAttribute("readonly"))) !== null,
    value: yield* Effect.promise(() => target.inputValue()),
  };
});

/**
 * Assert that the page's Status region is headed by a heading's words and holds keyboard focus.
 *
 * @param page The page.
 * @param heading The heading's key.
 * @returns Once both hold.
 */
const assertStatusFocused = Effect.fn("assertStatusFocused")(function* assertStatusFocused(
  page: Page,
  heading: "partSubmitted" | "testFinished",
) {
  const status = yield* statusOf(page);

  assert.isTrue(Option.isSome(status), "the page shows a Status region");
  assert.strictEqual(Option.getOrThrow(status).heading, message("en", heading));
  assert.isTrue(yield* isFocused(page, page.locator(statusRegion)), "the Status region is focused");
});

/**
 * Assert that the session page's navigation offers no way back: in a linear part Previous is
 * absent or disabled.
 *
 * @param page The page, on the session page.
 * @returns Once it holds.
 */
const assertNoPrevious = Effect.fn("assertNoPrevious")(function* assertNoPrevious(page: Page) {
  const previous = (yield* navigationOf(page)).filter((button) => button.part === "previous");

  assert.isTrue(
    previous.every((button) => button.disabled),
    "Previous is absent or disabled",
  );
});

/**
 * Start a fixture session and answer P1 by mouse: a wrong choice on item 1, Next, a wrong word
 * typed into item 2, unsaved; item 3 stays unanswered.
 *
 * @param page The page, which ends on item 2.
 * @param origin The playground's origin.
 * @returns The session page's path.
 */
const answerPartOne = Effect.fn("answerPartOne")(function* answerPartOne(
  page: Page,
  origin: string,
) {
  const sessionPath = yield* startFixtureSession(page, origin);

  yield* tick(page, answers.itemOne);
  yield* step(page, "next", sessionPath);

  assert.strictEqual(yield* positionOf(page), 2);

  yield* type(page, answers.itemTwo);

  return sessionPath;
});

/**
 * Take a fixture session to its end by mouse: P1 answered ({@link answerPartOne}), submitted and
 * confirmed; item 4's sentence, Next, item 5's choice; P2 submitted and confirmed.
 *
 * @param page The page, which ends on the summary.
 * @param origin The playground's origin.
 * @returns The session page's path, where the summary shows.
 */
const finishTest = Effect.fn("finishTest")(function* finishTest(page: Page, origin: string) {
  const sessionPath = yield* answerPartOne(page, origin);

  yield* submitPart(page, sessionPath);
  yield* confirmBy(page, sessionPath, "confirm");
  yield* type(page, answers.itemFour);
  yield* step(page, "next", sessionPath);
  yield* tick(page, answers.itemFive);
  yield* submitPart(page, sessionPath);
  yield* confirmBy(page, sessionPath, "confirm");

  return sessionPath;
});

/**
 * Open the summary, then follow one item's Review or Solution link by mouse.
 *
 * @param page The page, which ends on the view.
 * @param origin The playground's origin.
 * @param sessionPath The session page's path, where the summary shows.
 * @param mode The view.
 * @param n The item's sequence index.
 * @returns Once the view has loaded.
 */
const openView = Effect.fn("openView")(function* openView(
  page: Page,
  origin: string,
  sessionPath: string,
  mode: "review" | "solution",
  n: number,
) {
  const summary = yield* Effect.promise(() => page.goto(`${origin}${sessionPath}`));

  assert.isNotNull(summary);
  assert.strictEqual(summary.status(), 200, "the summary");

  const link = page.getByRole("link", {
    exact: true,
    name: message("en", mode === "review" ? "reviewItem" : "solutionItem", {
      n: numeral("en", n),
    }),
  });

  assert.strictEqual(yield* count(link), 1, `the summary links item ${String(n)}'s ${mode}`);

  yield* arrive(page, () => link.click(), getOf(`${sessionPath}/${mode}/${String(n)}`));
});

/**
 * Read the correct response of one of the fixture's P1 items, from the item its package accepts.
 *
 * @param n The item's sequence index.
 * @returns The correct response's values in their lexical form; the test fails when the package
 *   is not accepted.
 */
const fixtureCorrect = Effect.fn("fixtureCorrect")(function* fixtureCorrect(
  n: keyof typeof fixtureRefs,
) {
  const verdict = yield* openDirectory(fixture);
  if (verdict.verdict !== "accepted" && verdict.verdict !== "accepted-with-unsupported") {
    return assert.fail(`the fixture package is ${verdict.verdict}, not accepted`);
  }

  const test =
    verdict.accepted.tests.get(`${fixture.location}/${fixture.test}`) ??
    assert.fail("the fixture package holds its test");
  const item = test.items.get(fixtureRefs[n]) ?? assert.fail(`the test holds ${fixtureRefs[n]}`);
  const declaration =
    item.item.responses.get(response) ?? assert.fail(`${fixtureRefs[n]} declares ${response}`);

  return Option.match(declaration.correct, {
    onNone: (): readonly string[] => [],
    onSome: (value) => value.values.map(format),
  });
});

/**
 * Read a page's body as text.
 *
 * @param answer The answer.
 * @returns Its body.
 */
const bodyOf = (answer: Response) => Effect.promise(() => answer.text());

eachEngine((it) => {
  it.layer(fixturePlaygroundLayer)("the finishing walk", (walk) => {
    walk.effect(
      "[T-4] P1's Submit part: the confirm page lists the unanswered item, Return shows the saved values, and Confirm shows P2's first item with its Status focused and headed Part submitted",
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* partSubmit() {
            const { origin } = yield* Playground;
            const sessionPath = yield* answerPartOne(page, origin);

            yield* submitPart(page, sessionPath);

            const unanswered = message("en", "itemState", {
              item: message("en", "item", { n: numeral("en", 3) }),
              state: message("en", "itemNotAnswered"),
            });

            assert.strictEqual(
              yield* count(
                page.getByRole("listitem").and(page.getByText(unanswered, { exact: true })),
              ),
              1,
              "the confirm page lists item 3 as not answered",
            );

            yield* confirmBy(page, sessionPath, "return");

            assert.strictEqual(yield* positionOf(page), 2, "Return shows the item it left");
            assert.strictEqual(
              (yield* textOf(page)).value,
              answers.itemTwo,
              "the word Submit part saved",
            );

            yield* submitPart(page, sessionPath);
            yield* confirmBy(page, sessionPath, "confirm");

            assert.strictEqual(yield* positionOf(page), partTwoFirst, "P2's first item");

            yield* assertStatusFocused(page, "partSubmitted");
          }),
        ),
    );

    walk.effect(
      "[T-4] in P2, a linear part, Previous is absent or disabled, and once the part is submitted the summary shows with its Status focused and headed Test finished",
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* linearPart() {
            const { origin } = yield* Playground;
            const sessionPath = yield* answerPartOne(page, origin);

            yield* submitPart(page, sessionPath);
            yield* confirmBy(page, sessionPath, "confirm");

            assert.strictEqual(yield* positionOf(page), partTwoFirst);

            yield* assertNoPrevious(page);
            yield* type(page, answers.itemFour);
            yield* step(page, "next", sessionPath);

            assert.strictEqual(yield* positionOf(page), partTwoFirst + 1);

            yield* assertNoPrevious(page);
            yield* tick(page, answers.itemFive);
            yield* submitPart(page, sessionPath);
            yield* confirmBy(page, sessionPath, "confirm");

            assert.strictEqual(
              yield* count(page.locator(itemRoot)),
              0,
              "the summary shows no item",
            );

            yield* assertStatusFocused(page, "testFinished");
          }),
        ),
    );

    walk.effect(
      "[T-11] a Review link shows the candidate's values in disabled or read-only controls",
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* review() {
            const { origin } = yield* Playground;
            const sessionPath = yield* finishTest(page, origin);

            yield* openView(page, origin, sessionPath, "review", 1);

            const choices = yield* controlsOf(page);

            assert.deepStrictEqual(checkedValues(choices), [answers.itemOne]);
            assert.isTrue(
              choices.every((each) => each.disabled),
              "every Choice Control is disabled",
            );

            yield* openView(page, origin, sessionPath, "review", 2);

            assert.deepStrictEqual(yield* textOf(page), {
              editable: false,
              readonly: true,
              value: answers.itemTwo,
            });
          }),
        ),
    );

    walk.effect("[T-12] a Solution link shows the correct values", () =>
      withPage({ javaScriptEnabled: false }, (page) =>
        Effect.gen(function* solution() {
          const { origin } = yield* Playground;
          const sessionPath = yield* finishTest(page, origin);

          yield* openView(page, origin, sessionPath, "solution", 1);

          assert.deepStrictEqual(
            checkedValues(yield* controlsOf(page)),
            (yield* fixtureCorrect(1)).toSorted(),
          );

          yield* openView(page, origin, sessionPath, "solution", 2);

          assert.deepStrictEqual([(yield* textOf(page)).value], yield* fixtureCorrect(2));

          yield* openView(page, origin, sessionPath, "solution", 3);

          assert.deepStrictEqual(
            checkedValues(yield* controlsOf(page)),
            (yield* fixtureCorrect(3)).toSorted(),
          );
        }),
      ),
    );

    walk.effect(
      "[T-14] the summary's results link downloads a file whose text validates against the Results XSD",
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* resultsDownload() {
            const { origin } = yield* Playground;
            const sessionPath = yield* finishTest(page, origin);
            const link = page.getByRole("link", {
              exact: true,
              name: message("en", "downloadResults"),
            });

            assert.strictEqual(yield* count(link), 1, "the summary links the results");

            const [download] = yield* Effect.promise(() =>
              Promise.all([page.waitForEvent("download"), link.click()]),
            );

            assert.strictEqual(new URL(download.url()).pathname, `${sessionPath}/results.xml`);
            assert.isNull(
              yield* Effect.promise(() => download.failure()),
              "the download completes",
            );

            const xml = yield* Effect.promise(() =>
              download.path().then((saved) => readFile(saved, "utf-8")),
            );
            const verdict = yield* validateAgainst(resultsXsd, xml);

            assert.isTrue(verdict.valid, verdict.messages.join("\n"));
          }),
        ),
    );

    walk.effect(
      "[Q-2] /hosts/html: BG007 answered by mouse scores 1, and neither page the host answers holds <script",
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* plainHost() {
            const { origin } = yield* Playground;
            const landing = yield* Effect.promise(() => page.goto(`${origin}${hostPath}`));

            assert.isNotNull(landing);
            assert.strictEqual(landing.status(), 200, hostPath);

            const html = yield* bodyOf(landing);

            assert.notInclude(html.toLowerCase(), "<script", "the host's page");

            const tree = treeOf(html);
            const entries = new Set(
              elementsOf([tree])
                .filter((element) => element.tag === "input" && inputType(element) === "radio")
                .map((element) => attribute(element, "name") ?? ""),
            );
            const [entry] = entries;

            assert.strictEqual(entries.size, 1, "BG007's Choice posts under one entry");
            assert.isDefined(entry);

            const [correct] = yield* correctOf(bg007, response);
            const choice =
              choicesOf(tree, entry).find((each) => each.identifier === correct) ??
              assert.fail(`BG007 presents its correct choice ${String(correct)}`);
            const target = control(page, "radio", entry, choice);

            yield* Effect.promise(() => target.check({ force: true }));

            assert.isTrue(yield* Effect.promise(() => target.isChecked()), "the choice is ticked");

            const submit =
              elementsOf([tree]).find(
                (element) => element.tag === "button" && attribute(element, "type") === "submit",
              ) ?? assert.fail("the host's form has a submit button");
            const answered = yield* arrive(
              page,
              () => page.getByRole("button", { exact: true, name: nameOf(submit, tree) }).click(),
              (method, url) => method === "POST" && url.pathname === hostPath,
            );

            assert.notInclude(answered.html.toLowerCase(), "<script", "the host's answer");

            const status = yield* statusOf(page);

            assert.isTrue(Option.isSome(status), "the answer shows a Status region");
            assert.strictEqual(Option.getOrThrow(status).heading, message("en", "scored"));
            assert.strictEqual(
              yield* inStatus(page, message("en", "score", { score: numeral("en", 1) })),
              1,
              "BG007 scores 1",
            );
          }),
        ),
    );
  });
});

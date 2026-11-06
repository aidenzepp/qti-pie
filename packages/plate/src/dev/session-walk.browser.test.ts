/**
 * The walk through a test session's pages in Chromium and WebKit, with JavaScript off: the M2
 * fixture's session started, a tick saved by Next and shown again by Previous, the browser's Back
 * answered by the store's current item, a closed page resumed from the playground's index, and
 * Enter in a text field saving where the candidate stands.
 *
 * Expected values come from the code the playground runs: parts are found through the part table,
 * intents are written by `encodeIntent`, the Resume link's name by `message`, and the values the
 * store holds are read from a fresh load of the session page.
 */
import { assert } from "@effect/vitest";
import type { Locator, Page, Response } from "playwright-core";
import { Effect, Option } from "effect";
import { rowFor } from "#plate/emit/parts.ts";
import type { InteractionKey, PartOf } from "#plate/emit/parts.ts";
import { encodeIntent } from "#plate/form/intent.ts";
import { message, numeral } from "#plate/messages.ts";
import { Playground, eachEngine, withPage } from "#plate/test/browsers.ts";
import { count, snapshotOf } from "#plate/test/playground-page.ts";
import {
  fixturePlaygroundLayer,
  positionOf,
  startFixtureSession,
  statusOf,
} from "#plate/test/session-page.ts";

/**
 * The number of items the fixture's test holds, across its two parts: P1's three and P2's two.
 * The Resume link names the current item as one of them.
 */
const fixtureItems = 5;

/**
 * The text typed into item 2's Text Entry, the fixture's one Text Entry.
 */
const typed = "seven";

/**
 * Locate the elements of a part, by the `data-slot` marker the part table gives it.
 *
 * @param page The page.
 * @param interaction The interaction the part belongs to.
 * @param part The part.
 * @returns The locator.
 */
const partIn = <I extends InteractionKey>(page: Page, interaction: I, part: PartOf<I>): Locator =>
  page.locator(`[data-slot="${rowFor(interaction, part).slot}"]`);

/**
 * The current item as a session page shows it: its sequence index, the values of its checked
 * Choice Controls and the text of its Text Entry Controls, each in document order.
 */
interface ItemShown {
  readonly position: number;
  readonly ticked: readonly string[];
  readonly typed: readonly string[];
}

/**
 * Read the current item as the browser holds it.
 *
 * @param page The page, on a session page that shows an item.
 * @returns Its sequence index, its checked Choices' values and its Text Entries' text.
 */
const shownIn = Effect.fn("shownIn")(function* shownIn(page: Page) {
  const position = yield* positionOf(page);
  const choices = yield* Effect.promise(() => partIn(page, "choice-interaction", "control").all());
  const ticked: string[] = [];
  for (const choice of choices) {
    if (yield* Effect.promise(() => choice.isChecked())) {
      ticked.push(
        Option.getOrElse(
          Option.fromNullOr(yield* Effect.promise(() => choice.getAttribute("value"))),
          () => "",
        ),
      );
    }
  }

  const entries = yield* Effect.promise(() =>
    partIn(page, "text-entry-interaction", "control").all(),
  );
  const texts: string[] = [];
  for (const entry of entries) {
    texts.push(yield* Effect.promise(() => entry.inputValue()));
  }

  return { position, ticked, typed: texts } satisfies ItemShown;
});

/**
 * Read the current item as the store holds it: load the session page in a fresh browser context,
 * which holds no history and no cache of it, and read what it shows.
 *
 * @param origin The playground's origin.
 * @param sessionPath The session page's path.
 * @returns The item the store makes current, with the values the store holds for it; the test
 *   fails unless the page answers 200.
 */
const storedItem = (origin: string, sessionPath: string) =>
  withPage({ javaScriptEnabled: false }, (fresh) =>
    Effect.gen(function* freshLoad() {
      const answer = yield* Effect.promise(() => fresh.goto(`${origin}${sessionPath}`));

      assert.isNotNull(answer);
      assert.strictEqual(answer.status(), 200, "a fresh load of the session page");

      return yield* shownIn(fresh);
    }),
  );

/**
 * Whether a response ends a navigation: a navigation request's answer that is not a redirect.
 *
 * @param response The response.
 * @returns Whether it is the response the navigated page loads from.
 */
const landing = (response: Response): boolean =>
  response.request().isNavigationRequest() && (response.status() < 300 || response.status() >= 400);

/**
 * Post the session form and wait for the page that answers it to load.
 *
 * The session form posts to the session page itself, so the URL alone does not show the answer
 * has arrived: the main frame's next committed navigation does, and the page is read once that
 * document has loaded.
 *
 * @param page The page, on a session page.
 * @param act The click or key press that posts the form.
 * @returns The posted form entries; the test fails unless the post was saved, which the
 *   playground answers with a redirect to the session page, and that page answered 200.
 */
const post = Effect.fn("post")(function* post(page: Page, act: () => Promise<void>) {
  const [posted, landed] = yield* Effect.promise(() =>
    Promise.all([
      page.waitForRequest(
        (request) => request.method() === "POST" && request.isNavigationRequest(),
      ),
      page.waitForResponse(landing),
      page.waitForEvent("framenavigated", { predicate: (frame) => frame === page.mainFrame() }),
      act(),
    ]),
  );
  yield* Effect.promise(() => page.waitForLoadState("load"));

  assert.strictEqual(
    landed.request().method(),
    "GET",
    "the post was saved and the browser sent back to the session page",
  );
  assert.strictEqual(landed.status(), 200, "the session page answers 200");
  assert.isTrue(Option.isNone(yield* statusOf(page)), "a saved post's page shows no Status");

  return new URLSearchParams(posted.postData() ?? "");
});

/**
 * Press a navigation button of the session page, which posts the form with its intent.
 *
 * @param page The page, on a session page.
 * @param part The navigation button.
 * @returns Once the page that answers has loaded.
 */
const navigate = (page: Page, part: "next" | "previous") =>
  post(page, () => partIn(page, "test-navigation", part).click());

/**
 * Locate the session form's first submit button, the playground's Save, which HTML's implicit
 * submission posts when Enter is pressed in a text field.
 *
 * @param page The page, on a session page.
 * @returns The locator.
 */
const firstSubmit = (page: Page): Locator =>
  page.locator('form[method="post"] button[type="submit"]').first();

/**
 * Tick the first Choice Control of the current item with the mouse, through the clipped Control
 * itself, and read its value.
 *
 * @param page The page, on a session page that shows a Choice.
 * @returns The ticked Control's value; the test fails when the click left it unchecked.
 */
const tickFirst = Effect.fn("tickFirst")(function* tickFirst(page: Page) {
  const choice = partIn(page, "choice-interaction", "control").first();
  yield* Effect.promise(() => choice.check({ force: true }));

  assert.isTrue(yield* Effect.promise(() => choice.isChecked()), "the Choice is ticked");

  return Option.getOrElse(
    Option.fromNullOr(yield* Effect.promise(() => choice.getAttribute("value"))),
    () => "",
  );
});

/**
 * Locate the current item's one Text Entry Control.
 *
 * @param page The page, on a session page that shows the Text Entry.
 * @returns The locator; the test fails unless the item holds exactly one.
 */
const textEntry = Effect.fn("textEntry")(function* textEntry(page: Page) {
  const entries = partIn(page, "text-entry-interaction", "control");

  assert.strictEqual(yield* count(entries), 1, "the item holds one Text Entry");

  return entries;
});

eachEngine((it) => {
  it.layer(fixturePlaygroundLayer)("the session walk", (sessions) => {
    sessions.effect(
      "[T-4] [T-14] A tick on item 1, then the test's Next, shows item 2; Previous shows item 1 with its tick",
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* nextAndBack() {
            const { origin } = yield* Playground;
            const sessionPath = yield* startFixtureSession(page, origin);

            assert.strictEqual(yield* positionOf(page), 1);

            const ticked = yield* tickFirst(page);
            yield* navigate(page, "next");

            assert.deepStrictEqual(yield* shownIn(page), {
              position: 2,
              ticked: [],
              typed: [""],
            });

            yield* navigate(page, "previous");

            const back = yield* shownIn(page);

            assert.deepStrictEqual(back, { position: 1, ticked: [ticked], typed: [] });
            assert.deepStrictEqual(back, yield* storedItem(origin, sessionPath));
          }),
        ),
    );

    sessions.effect(
      "[T-14] The browser's Back after a save on item 1 and the move to item 2 shows the item the store makes current, item 2, with the values the store holds, never item 1's earlier page",
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* browserBack() {
            const { origin } = yield* Playground;
            const sessionPath = yield* startFixtureSession(page, origin);

            yield* tickFirst(page);
            yield* navigate(page, "next");

            assert.strictEqual(yield* positionOf(page), 2);

            const back = yield* Effect.promise(() => page.goBack());

            assert.isNotNull(back, "the browser loaded the page again, not from a page cache");
            assert.strictEqual(back.request().method(), "GET");
            assert.strictEqual(back.status(), 200, "the session page answers 200");
            assert.strictEqual(new URL(page.url()).pathname, sessionPath);

            const shown = yield* shownIn(page);

            assert.strictEqual(shown.position, 2, "the store's current item, not item 1");
            assert.deepStrictEqual(shown, yield* storedItem(origin, sessionPath));
          }),
        ),
    );

    sessions.effect(
      "[T-14] Closing the page and following the session's Resume link from the index in a new page of the same context shows the current item with its saved values",
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* closeAndResume() {
            const { origin } = yield* Playground;
            const sessionPath = yield* startFixtureSession(page, origin);
            const heading = page.getByRole("heading", { level: 1 });

            assert.strictEqual(yield* count(heading), 1, "the session page has one title");

            const testTitle = (yield* Effect.promise(() => heading.textContent())) ?? "";

            yield* tickFirst(page);
            yield* navigate(page, "next");

            const entry = yield* textEntry(page);
            yield* Effect.promise(() => entry.fill(typed));
            yield* post(page, () => firstSubmit(page).click());

            assert.deepStrictEqual(yield* shownIn(page), {
              position: 2,
              ticked: [],
              typed: [typed],
            });

            yield* Effect.promise(() => page.close());

            const reopened = yield* Effect.acquireRelease(
              Effect.promise(() => page.context().newPage()),
              (opened) => Effect.promise(() => opened.close()),
            );
            const index = yield* Effect.promise(() => reopened.goto(`${origin}/`));

            assert.isNotNull(index);
            assert.strictEqual(index.status(), 200, "the playground's index");

            const resume = reopened.locator(`a[href="${sessionPath}"]`);

            assert.strictEqual(yield* count(resume), 1, "the index links the session once");
            assert.strictEqual(
              (yield* snapshotOf(resume)).name,
              message("en", "resume", {
                count: numeral("en", fixtureItems),
                n: numeral("en", 2),
                test: testTitle,
              }),
            );

            yield* Effect.promise(() =>
              Promise.all([
                reopened.waitForURL((url) => url.pathname === sessionPath),
                resume.click(),
              ]),
            );

            assert.deepStrictEqual(yield* shownIn(reopened), {
              position: 2,
              ticked: [],
              typed: [typed],
            });
          }),
        ),
    );

    sessions.effect(
      "[T-4] Typing in the Text Entry and pressing Enter posts the form's first submit button, go to the current item: the page stays on the item and the typed value is saved",
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* enterSaves() {
            const { origin } = yield* Playground;
            const sessionPath = yield* startFixtureSession(page, origin);

            yield* navigate(page, "next");

            const stay = encodeIntent({ kind: "go", sequenceIndex: 2 });

            assert.strictEqual(yield* positionOf(page), 2);
            assert.strictEqual(
              yield* Effect.promise(() => firstSubmit(page).getAttribute("value")),
              stay,
              "the form's first submit button goes to the current item",
            );

            const entry = yield* textEntry(page);
            yield* Effect.promise(() => entry.pressSequentially(typed));

            const posted = yield* post(page, () => entry.press("Enter"));
            const intents = [...posted.values()].filter(
              (value) => value === stay || value === encodeIntent({ kind: "next" }),
            );

            assert.deepStrictEqual(intents, [stay], "Enter posted go to the current item");

            const shown = yield* shownIn(page);

            assert.deepStrictEqual(shown, { position: 2, ticked: [], typed: [typed] });
            assert.deepStrictEqual(shown, yield* storedItem(origin, sessionPath));
          }),
        ),
    );
  });
});

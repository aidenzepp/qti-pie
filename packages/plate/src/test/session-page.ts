/**
 * Reading and driving M2's session pages in a browser test: the dev playground over the corpus
 * cache and the M2 fixture package; a test session started as a candidate starts one, from the
 * package listing through a package's page to its test's Start button; and the session page's
 * navigation, current item and Status region as the browser holds them.
 *
 * Every part is found by its `data-slot` marker, read through the part table, and every name is
 * read from Playwright's computed tree. A helper that finds what a test needs fails the test
 * through `assert` when it is not there.
 *
 * Test support: only browser test files import it.
 */
import { assert } from "@effect/vitest";
import type { Locator, Page } from "playwright-core";
import { Effect, Option } from "effect";
import type { Layer } from "effect";
import type { ListenFailed } from "#plate/dev/listen.ts";
import { packageHref, testField } from "#plate/dev/packages.ts";
import { rowFor, scopedId } from "#plate/emit/parts.ts";
import type { PartOf } from "#plate/emit/parts.ts";
import { playgroundLayer } from "#plate/test/browsers.ts";
import type { Playground, ReservedPort } from "#plate/test/browsers.ts";
import { count, snapshotOf } from "#plate/test/playground-page.ts";

/**
 * The dev playground with `createHandler`'s default settings: its packages are every `*.zip.d`
 * package of the corpus cache, read through `PLATE_CORPUS_DIR` or `HOME` from the environment,
 * then the M2 fixture package, `fixtures/m2/`.
 */
export const fixturePlaygroundLayer: Layer.Layer<Playground, ListenFailed | ReservedPort> =
  playgroundLayer({});

/**
 * The M2 fixture package as the playground lists it: its id, and its test's path from the
 * package's root, which that test's Start button posts.
 */
const fixturePackage = { id: "m2", test: "test.xml" } as const;

/**
 * The path of a session's page, `/sessions/<sid>`, whose one segment is the session id.
 */
const sessionRoute = /^\/sessions\/[^/]+$/u;

/**
 * The navigation parts that are buttons, in the order the part table lists them.
 */
export const navigationButtonParts = [
  "previous",
  "next",
  "itemButton",
  "submit",
  "end",
] as const satisfies readonly PartOf<"test-navigation">[];

/**
 * A navigation part that is a button.
 */
export type NavigationButtonPart = (typeof navigationButtonParts)[number];

/**
 * The navigation button parts by their `data-slot` markers, read from the part table.
 */
const navigationSlots: ReadonlyMap<string, NavigationButtonPart> = new Map(
  navigationButtonParts.map((part) => [rowFor("test-navigation", part).slot, part]),
);

/**
 * Write the selector of the elements a `data-slot` marker names.
 *
 * @param slot The marker, read from the part table.
 * @returns The attribute selector.
 */
const slotSelector = (slot: string): string => `[data-slot="${slot}"]`;

/**
 * Follow a link or a button to the page it leads to, and require that page to answer 200.
 *
 * @param page The page.
 * @param act The click that leaves the current page.
 * @param arrives Whether a URL is the page the click leads to, after any redirect.
 * @param what The page, for a failure message.
 * @returns Once the page it leads to has loaded.
 */
const follow = Effect.fn("follow")(function* follow(
  page: Page,
  act: () => Promise<void>,
  arrives: (url: URL) => boolean,
  what: string,
) {
  const [response] = yield* Effect.promise(() =>
    Promise.all([
      page.waitForResponse(
        (answer) => answer.request().method() === "GET" && arrives(new URL(answer.url())),
      ),
      page.waitForURL(arrives),
      act(),
    ]),
  );

  assert.strictEqual(response.status(), 200, what);
});

/**
 * Require a locator to match exactly one element.
 *
 * @param target The locator.
 * @param what The element, for a failure message.
 * @returns The locator, once it matches one element.
 */
const one = Effect.fn("one")(function* one(target: Locator, what: string) {
  assert.strictEqual(yield* count(target), 1, `the page holds one ${what}`);

  return target;
});

/**
 * Start a test session as a candidate does: open the package listing, follow the package's link,
 * and press its test's Start button, which posts the test and is redirected to the new session's
 * page.
 *
 * @param page The page, which ends on the session's page.
 * @param origin The playground's origin.
 * @param packageId The package's id, as the listing links it.
 * @param testHref The test's path from the package's root, the value of its Start button.
 * @returns The session page's path, `/sessions/<sid>`; the test fails when a page on the way does
 *   not answer 200 or does not hold the link or the button.
 */
export const startPackageSession = Effect.fn("startPackageSession")(function* startPackageSession(
  page: Page,
  origin: string,
  packageId: string,
  testHref: string,
) {
  const listing = yield* Effect.promise(() => page.goto(`${origin}/packages`));

  assert.isNotNull(listing);
  assert.strictEqual(listing.status(), 200, "the package listing");

  const href = packageHref(packageId);
  const link = yield* one(
    page.getByRole("link", { exact: true, name: packageId }).and(page.locator(`[href="${href}"]`)),
    `link to the package ${packageId}`,
  );

  yield* follow(
    page,
    () => link.click(),
    (url) => url.pathname === href,
    href,
  );

  const start = yield* one(
    page.locator(`button[name="${testField}"][value="${testHref}"]`),
    `Start button for ${testHref}`,
  );

  yield* follow(
    page,
    () => start.click(),
    (url) => sessionRoute.test(url.pathname),
    `the session page of ${testHref}`,
  );

  return new URL(page.url()).pathname;
});

/**
 * Start a test session of the M2 fixture package's test, through {@link startPackageSession}.
 *
 * @param page The page, which ends on the session's page.
 * @param origin The playground's origin.
 * @returns The session page's path, `/sessions/<sid>`.
 */
export const startFixtureSession = (page: Page, origin: string) =>
  startPackageSession(page, origin, fixturePackage.id, fixturePackage.test);

/**
 * A navigation button as the browser holds it.
 */
export interface NavigationButton {
  /**
   * The button's `aria-current`, which the current item's button carries as `step`.
   */
  readonly ariaCurrent: Option.Option<string>;
  /**
   * The button's `data-intent`, the intent it posts as `encodeIntent` writes it.
   */
  readonly dataIntent: Option.Option<string>;
  /**
   * Whether the button is disabled.
   */
  readonly disabled: boolean;
  /**
   * The button's accessible name, read from Playwright's computed tree.
   */
  readonly name: string;
  /**
   * The navigation part, read from the button's `data-slot` marker through the part table.
   */
  readonly part: NavigationButtonPart;
}

/**
 * Read an attribute of the element a locator matches.
 *
 * @param target The locator, which matches one element.
 * @param name The attribute.
 * @returns Its value, or none when the element does not carry it.
 */
const attributeOf = (target: Locator, name: string) =>
  Effect.promise(() => target.getAttribute(name)).pipe(Effect.map(Option.fromNullOr));

/**
 * Read the session page's navigation: each of its buttons, in document order.
 *
 * @param page The page.
 * @returns Each navigation button's part, name, `disabled`, `data-intent` and `aria-current`; the
 *   test fails unless the page holds one navigation Root.
 */
export const navigationOf = Effect.fn("navigationOf")(function* navigationOf(page: Page) {
  const root = yield* one(
    page.locator(slotSelector(rowFor("test-navigation", "root").slot)),
    "test navigation",
  );
  const buttons = yield* Effect.promise(() =>
    root.locator([...navigationSlots.keys()].map(slotSelector).join(", ")).all(),
  );
  const read: NavigationButton[] = [];
  for (const button of buttons) {
    const slot = yield* attributeOf(button, "data-slot");
    const part = navigationSlots.get(Option.getOrElse(slot, () => ""));
    if (part === undefined) {
      return assert.fail("a navigation button's marker names no navigation button part");
    }

    read.push({
      ariaCurrent: yield* attributeOf(button, "aria-current"),
      dataIntent: yield* attributeOf(button, "data-intent"),
      disabled: yield* Effect.promise(() => button.isDisabled()),
      name: (yield* snapshotOf(button)).name ?? "",
      part,
    });
  }

  return read;
});

/**
 * An item Root's `id` as `scopedId` writes it for its item instance, which is the session's
 * instance, a `.` and the item's sequence index (`ItemView.instance`).
 */
const itemRootId = /^(?<session>.+)\.(?<index>[1-9][0-9]*)-item$/u;

/**
 * Read the current item's sequence index from the item the session page shows, through its Root's
 * `id`.
 *
 * The item Root stands on every page that shows an item, the navigation's item list only in a
 * nonlinear part, so the position is read from the item.
 *
 * @param page The page.
 * @returns The sequence index, from 1; the test fails unless the page shows one item whose Root's
 *   `id` is the one `scopedId` writes for an item instance of the session.
 */
export const positionOf = Effect.fn("positionOf")(function* positionOf(page: Page) {
  const root = yield* one(page.locator(slotSelector(rowFor("item", "root").slot)), "item");
  const id = Option.getOrElse(yield* attributeOf(root, "id"), () => "");
  const groups = itemRootId.exec(id)?.groups;
  const session = groups?.["session"];
  const index = groups?.["index"];
  if (session === undefined || index === undefined) {
    return assert.fail(`the item Root's id ${id} names no item instance of a session`);
  }

  const sequenceIndex = Number(index);

  assert.strictEqual(
    scopedId(`${session}.${String(sequenceIndex)}`, "item"),
    id,
    "the item Root's id is scopedId's for its instance",
  );

  return sequenceIndex;
});

/**
 * The Status region as the browser holds it: its heading's text, and the region's whole text,
 * heading included, each with its whitespace runs collapsed to one space.
 */
export interface StatusSeen {
  readonly heading: string;
  readonly text: string;
}

/**
 * Collapse a text's whitespace runs to one space and trim it.
 *
 * @param words The text.
 * @returns The text collapsed.
 */
const collapsed = (words: string): string => words.replaceAll(/\s+/gu, " ").trim();

/**
 * Read the session page's Status region, which a page shows only to say something: a refused
 * post's messages, or that a part is submitted.
 *
 * @param page The page.
 * @returns The region's heading and text, or none when the page holds no Status region; the test
 *   fails when it holds more than one.
 */
export const statusOf = Effect.fn("statusOf")(function* statusOf(page: Page) {
  const regions = page.locator(slotSelector(rowFor("item", "status").slot));
  if ((yield* count(regions)) === 0) {
    return Option.none<StatusSeen>();
  }

  const region = yield* one(regions, "Status region");
  const heading = yield* one(
    region.locator(slotSelector(rowFor("item", "statusHeading").slot)),
    "Status heading",
  );

  const headingText = yield* Effect.promise(() => heading.textContent());
  // oxlint-disable-next-line unicorn/prefer-dom-node-text-content -- Playwright's `innerText` gives the region's rendered text, a break between its heading and each message; `textContent` runs them together.
  const regionText = yield* Effect.promise(() => region.innerText());

  return Option.some<StatusSeen>({
    heading: collapsed(headingText ?? ""),
    text: collapsed(regionText),
  });
});

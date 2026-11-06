/**
 * The session-page helpers (`#plate/test/session-page.ts`) in Chromium and WebKit, with JavaScript
 * off (spec §4.15), witnessed on the first page of the M2 fixture's test session.
 *
 * Expected values come from the code the playground runs: the HTML the session page answered,
 * whose parts are found through the part table and named by `nameOf`, and `encodeIntent`.
 */
import { assert } from "@effect/vitest";
import { Effect, Option } from "effect";
import { rowFor } from "#plate/emit/parts.ts";
import { encodeIntent } from "#plate/form/intent.ts";
import { attribute, nameOf } from "#plate/test/accessibility.ts";
import { Playground, eachEngine, withPage } from "#plate/test/browsers.ts";
import { count, elementsOf, treeOf } from "#plate/test/playground-page.ts";
import {
  answeredNavigation,
  fixturePlaygroundLayer,
  navigationOf,
  positionOf,
  startFixtureSession,
  statusOf,
} from "#plate/test/session-page.ts";
import type { NavigationButton, NavigationButtonPart } from "#plate/test/session-page.ts";

/**
 * The sequence indexes of the fixture test's part P1, which is nonlinear, so its navigation lists
 * one button per item: items 1 to 3 (P2, linear, holds items 4 and 5).
 */
const partOne = [1, 2, 3] as const;

/**
 * Find the one button of a navigation part.
 *
 * @param buttons The navigation's buttons.
 * @param part The part.
 * @returns The button; the test fails unless exactly one is that part.
 */
const onlyButton = (
  buttons: readonly NavigationButton[],
  part: NavigationButtonPart,
): NavigationButton => {
  const found = buttons.filter((button) => button.part === part);

  assert.strictEqual(found.length, 1, `the navigation holds one ${part} button`);

  const [button] = found;
  assert.isDefined(button);

  return button;
};

eachEngine((it) => {
  it.layer(fixturePlaygroundLayer)("the fixture session's pages", (sessions) => {
    sessions.effect(
      "starting the fixture session lands on item 1 of P1: its navigation landmark is present, Previous is disabled, item 1's button is current, Next is enabled, and no Status shows",
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* landing() {
            const { origin } = yield* Playground;
            const sessionPath = yield* startFixtureSession(page, origin);

            assert.match(sessionPath, /^\/sessions\/[^/]+$/u, "the session page's path");
            assert.strictEqual(new URL(page.url()).pathname, sessionPath);

            const navigation = yield* navigationOf(page);
            const position = yield* positionOf(page);
            const status = yield* statusOf(page);
            const answer = yield* Effect.promise(() => fetch(`${origin}${sessionPath}`));

            assert.strictEqual(answer.status, 200, "the session page answers 200");

            const answered = treeOf(yield* Effect.promise(() => answer.text()));
            const root =
              elementsOf([answered]).find(
                (element) =>
                  attribute(element, "data-slot") === rowFor("test-navigation", "root").slot,
              ) ?? assert.fail("the session page answered a navigation Root");

            assert.strictEqual(
              yield* count(
                page.getByRole("navigation", { exact: true, name: nameOf(root, answered) }),
              ),
              1,
              "the navigation landmark",
            );
            assert.deepStrictEqual(navigation, answeredNavigation(answered));
            assert.strictEqual(position, 1);
            assert.isTrue(onlyButton(navigation, "previous").disabled, "Previous is disabled");
            assert.isFalse(onlyButton(navigation, "next").disabled, "Next is enabled");
            assert.deepStrictEqual(
              navigation
                .filter((button) => button.part === "itemButton")
                .map((button) => button.dataIntent),
              partOne.map((sequenceIndex) =>
                Option.some(encodeIntent({ kind: "go", sequenceIndex })),
              ),
            );
            assert.deepStrictEqual(
              navigation
                .filter((button) => Option.isSome(button.ariaCurrent))
                .map((button) => [button.part, button.ariaCurrent, button.dataIntent]),
              [
                [
                  "itemButton",
                  Option.some("step"),
                  Option.some(encodeIntent({ kind: "go", sequenceIndex: 1 })),
                ],
              ],
            );
            assert.isTrue(Option.isNone(status), "a fresh session page shows no Status");
          }),
        ),
    );
  });
});

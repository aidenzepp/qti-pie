import { assert } from "@effect/vitest";
import { Effect } from "effect";
import type { Locator, Page } from "playwright-core";
import { entryName } from "#plate/form/encoding.ts";
import { message } from "#plate/messages.ts";
import { eachEngine, nextControlKey, playgroundLayer, withPage } from "#plate/test/browsers.ts";
import { tabOrder } from "#plate/test/keyboard.ts";
import {
  choicesOf,
  control,
  correctOf,
  inStatus,
  instanceOf,
  openItem,
  press,
  submitBy,
  submitButton,
  submitWith,
  tabUntil,
} from "#plate/test/playground-page.ts";
import type { Choice } from "#plate/test/playground-page.ts";

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

eachEngine((it) => {
  it.layer(playgroundLayer({}))("the walk, answering", (walk) => {
    walk.effect("[Q-2] BG007 by mouse: the radio named True clicked, then Submit, scores 1", () =>
      withPage({ javaScriptEnabled: false }, (page) =>
        Effect.gen(function* byMouse() {
          const tree = yield* openItem(page, paths.bg007);
          const entry = entryName(instanceOf(tree), "RESPONSE");
          const correct = yield* correctOf(paths.bg007, "RESPONSE");

          yield* tick(control(page, "radio", entry, pick(choicesOf(tree, entry), correct, true)));
          yield* submitWith(page, () => submitButton(page).click());

          assert.strictEqual(yield* inStatus(page, message("en", "score", { score: "1" })), 1);
        }),
      ),
    );

    walk.effect(
      "[Q-2] [keyboard] BG007 by keys alone: Tab into the group, Space on True, Tab to Submit, Enter, scores 1",
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* byKeys() {
            const key = yield* nextControlKey(page);
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

            yield* tabUntil(page, key, page.locator(`input[name="${entry}"]`), most);
            yield* press(page, "Space");

            assert.isTrue(yield* Effect.promise(() => chosen.isChecked()));

            yield* tabUntil(page, key, submitButton(page), most);
            yield* submitBy(page, "Enter");

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
            yield* submitWith(page, () => submitButton(page).click());

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
            yield* submitWith(page, () => submitButton(page).click());

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
            yield* submitWith(page, () => submitButton(page).click());

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
            yield* submitWith(page, () => submitButton(page).click());

            assert.strictEqual(yield* inStatus(page, message("en", "score", { score: "1" })), 1);
          }),
        ),
    );
  });
});

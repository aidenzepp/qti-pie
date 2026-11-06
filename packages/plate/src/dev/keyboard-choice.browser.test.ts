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
  formStops,
  inStatus,
  instanceOf,
  isFocused,
  openItem,
  press,
  stopsToSubmit,
  submitBy,
  submitButton,
  tabUntil,
} from "#plate/test/playground-page.ts";

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
 * Read whether each Control is checked.
 *
 * @param controls The Controls.
 * @returns Each one's checked state, in the given order.
 */
const checkedStates = (controls: readonly Locator[]) =>
  Effect.all(controls.map((each) => Effect.promise(() => each.isChecked())));

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
              const key = yield* nextControlKey(page);
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
              const key = yield* nextControlKey(page);
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
            const key = yield* nextControlKey(page);
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
              const key = yield* nextControlKey(page);
              const tree = yield* openItem(page, corpusPath);
              const entry = entryName(instanceOf(tree), responseId);
              const correct = yield* correctOf(corpusPath, responseId);
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
          const key = yield* nextControlKey(page);
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
            const key = yield* nextControlKey(page);
            const tree = yield* openItem(page, items.bg008);
            const entry = entryName(instanceOf(tree), responseId);
            const correct = yield* correctOf(items.bg008, responseId);
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
            const key = yield* nextControlKey(page);
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

import { assert } from "@effect/vitest";
import { Effect, Option } from "effect";
import type { Locator, Page } from "playwright-core";
import { entryName } from "#plate/form/encoding.ts";
import { message } from "#plate/messages.ts";
import { attribute } from "#plate/test/accessibility.ts";
import {
  eachEngine,
  nextControlKey,
  playgroundLayer,
  walkPlaygroundLayer,
  withPage,
} from "#plate/test/browsers.ts";
import { tabOrder } from "#plate/test/keyboard.ts";
import {
  correctOf,
  count,
  elementsOf,
  formStops,
  inlineChoiceOf,
  inStatus,
  instanceOf,
  isFocused,
  itemFormOf,
  keyOf,
  openItem,
  press,
  stopsToSubmit,
  submitBy,
  submitButton,
  tabUntil,
} from "#plate/test/playground-page.ts";
import { arrive } from "#plate/test/session-page.ts";

/**
 * Shakespeare's line from the example corpus, with one unshuffled Inline Choice of Gloucester,
 * Lancaster and York, scored by `match_correct` against York.
 */
const quoteItem = "QTI3_BPIG_Examples/items/QTI3-inline-choice.xml";

/**
 * The walk corpus's Inline Choice item (`scripts/walk-corpus.ts`): `RESPONSE`'s Inline Choice is
 * required, shuffled with its last choice fixed, and carries the author's too-few message;
 * `RESPONSE2`'s carries none of those. Its `match_correct` scores `RESPONSE` alone, against
 * Jupiter.
 */
const inlineItem = "inline.xml";

/**
 * The response each item's first Inline Choice binds.
 */
const responseId = "RESPONSE";

/**
 * The response `inline.xml`'s second Inline Choice binds, which nothing requires.
 */
const optionalId = "RESPONSE2";

/**
 * What the keys choose in each item by type-ahead: the letter typed into the focused select, and
 * the identifier of the one option whose text starts with it. York's identifier is `Y`; in
 * `inline.xml` the options and the Placeholder start with different letters, so `J` reaches
 * Jupiter alone.
 */
const typed = {
  inline: { identifier: "JUPITER", letter: "J" },
  quote: { letter: "Y" },
} as const;

/**
 * Locate the `select` that posts an entry.
 *
 * @param page The page.
 * @param entry The entry name.
 * @returns The locator.
 */
const selectOf = (page: Page, entry: string): Locator => page.locator(`select[name="${entry}"]`);

/**
 * Read a control's value as the browser holds it: for a `select`, the value of its selected
 * option.
 *
 * @param target The control.
 * @returns Its value.
 */
const valueOf = (target: Locator) => Effect.promise(() => target.inputValue());

/**
 * Type text into the focused element, a key press for each character.
 *
 * @param page The page.
 * @param text The text.
 * @returns Once every key is up.
 */
const type = (page: Page, text: string) => Effect.promise(() => page.keyboard.type(text));

/**
 * Read the values of a `select`'s options, in the order the page presents them.
 *
 * @param select The `select`.
 * @returns Each option's `value`, the Placeholder's `""` first; the test fails when an option has
 *   none.
 */
const presentedValues = Effect.fn("presentedValues")(function* presentedValues(select: Locator) {
  const options = select.locator("option");
  const total = yield* count(options);

  return yield* Effect.all(
    Array.from({ length: total }, (_, index) =>
      Effect.promise(() => options.nth(index).getAttribute("value")).pipe(
        Effect.map((value) => value ?? assert.fail(`option ${String(index)} carries a value`)),
      ),
    ),
  );
});

/**
 * Count the Status region's headings that name an after-submit state.
 *
 * @param page The page after a submit.
 * @param state The state, as `messages.ts` keys it.
 * @returns How many headings of the region, read through its role `status`, have its text.
 */
const statusHeadings = (page: Page, state: "notAccepted" | "scored") =>
  count(page.getByRole("status").getByRole("heading", { exact: true, name: message("en", state) }));

/**
 * Submit the item form by Enter on the focused element, and wait for the page that answers the
 * post to load. The wait is on the post's answer, not on a change of URL, because a page that
 * answered a post already names the instance a second post goes to.
 *
 * @param page The page, with focus on the item form's Submit.
 * @returns Once the answering page has loaded; the test fails unless it answered 200.
 */
const postByEnter = (page: Page) =>
  arrive(
    page,
    () => page.keyboard.press("Enter"),
    (method) => method === "POST",
  );

/**
 * Press the next-control key through an item's page to its Submit, and compare the stops it makes
 * inside the item form with the Node walk's `tabOrder` for that form, every `select` of the form
 * among them.
 *
 * @param page The page, fresh: the key is probed on it first.
 * @param corpusPath The item's path in the playground's corpus.
 * @returns The key pressed, and how many of the page's links it stopped on before the item form.
 */
const tabOrderOf = Effect.fn("tabOrderOf")(function* tabOrderOf(page: Page, corpusPath: string) {
  const key = yield* nextControlKey(page);
  const tree = yield* openItem(page, corpusPath);
  const expected = formStops(tree);
  const selects = elementsOf([itemFormOf(tree)])
    .filter((element) => element.tag === "select")
    .map((select) =>
      keyOf({
        id: attribute(select, "id"),
        name: attribute(select, "name"),
        value: attribute(select, "value"),
      }),
    );
  const stops = yield* stopsToSubmit(page, key, 2 * tabOrder(tree).length);
  const first = stops.findIndex((stop) => stop.inForm);

  assert.isNotEmpty(selects, "the item form holds a select");
  assert.includeMembers([...expected], selects, "the Node walk stops on every select");
  assert.isAtLeast(first, 0, "a press reached the item form");
  assert.deepStrictEqual(
    stops.slice(first).map((stop) => stop.key),
    expected,
  );

  return { key, links: stops.slice(0, first).filter((stop) => stop.link).length };
});

/**
 * Describe what the presses did beside the compared order, for a test's annotation.
 *
 * @param seen What {@link tabOrderOf} returned.
 * @param seen.key The next-control key pressed.
 * @param seen.links How many of the page's links the presses stopped on before the item form.
 * @param label The item, as the test's title names it.
 * @returns The phrase.
 */
const observed = (seen: { readonly key: string; readonly links: number }, label: string): string =>
  `${seen.key}: before ${label}'s item form, ${
    seen.links > 0
      ? `stopped on ${String(seen.links)} of the page's links`
      : "stopped on none of the page's links"
  }`;

eachEngine((it, name) => {
  it.layer(playgroundLayer({}))("the keyboard, Inline Choice", (keys) => {
    keys.effect(
      "[Q-12] [keyboard] Tab order: QTI3-inline-choice.xml's item form, from its first control to its Submit, is the Node walk's tabOrder",
      (context) =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* quoteTabOrder() {
            const seen = yield* tabOrderOf(page, quoteItem);

            yield* Effect.promise(() =>
              context.annotate(`${name}, ${observed(seen, "QTI3-inline-choice.xml")}`),
            );
          }),
        ),
    );

    keys.effect(
      "[Q-12] [keyboard] QTI3-inline-choice.xml answered by keys: Tab to the select, type Y, Tab to Submit and Enter choose York and score 1",
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* answerYork() {
            const key = yield* nextControlKey(page);
            const tree = yield* openItem(page, quoteItem);
            const select = selectOf(page, entryName(instanceOf(tree), responseId));
            const correct = yield* correctOf(quoteItem, responseId);
            const most = 2 * tabOrder(tree).length;

            assert.strictEqual(yield* count(select), 1);
            assert.strictEqual(yield* valueOf(select), "", "the Placeholder is selected at first");

            yield* tabUntil(page, key, select, most);
            yield* type(page, typed.quote.letter);

            assert.deepStrictEqual([yield* valueOf(select)], correct, "type-ahead chose York");

            yield* tabUntil(page, key, submitButton(page), most);
            yield* submitBy(page, "Enter");

            assert.strictEqual(yield* statusHeadings(page, "scored"), 1);
            assert.strictEqual(yield* inStatus(page, message("en", "score", { score: "1" })), 1);
            assert.deepStrictEqual([yield* valueOf(select)], correct, "York is restored");
          }),
        ),
    );
  });

  it.layer(walkPlaygroundLayer)("the keyboard, Inline Choice, over the walk corpus", (walk) => {
    walk.effect(
      "[Q-12] [keyboard] Tab order: inline.xml's item form, from its first control to its Submit, is the Node walk's tabOrder",
      (context) =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* inlineTabOrder() {
            const seen = yield* tabOrderOf(page, inlineItem);

            yield* Effect.promise(() =>
              context.annotate(`${name}, ${observed(seen, "inline.xml")}`),
            );
          }),
        ),
    );

    walk.effect(
      '[Q-12] [keyboard] inline.xml answered by keys: Submit with nothing chosen shows "Pick a planet first." in the Status region and keeps the shuffled order, "None of these" last; then J typed and Submit record Jupiter, scoring 1, with RESPONSE2 left NULL',
      () =>
        Effect.gen(function* answerPlanet() {
          const interaction = yield* inlineChoiceOf(inlineItem, responseId);
          const tooFew = Option.getOrElse(interaction.messages.min, () =>
            assert.fail("inline.xml's required Inline Choice carries the author's too-few message"),
          );
          const identifiers = interaction.choices.map((choice) => choice.identifier);
          const fixed = interaction.choices.flatMap((choice) =>
            choice.fixed ? [choice.identifier] : [],
          );

          assert.isTrue(interaction.shuffle, "inline.xml's Inline Choice is shuffled");
          assert.deepStrictEqual(fixed, identifiers.slice(-1), "its one fixed choice is last");
          assert.include(identifiers, typed.inline.identifier);

          yield* withPage({ javaScriptEnabled: false }, (page) =>
            Effect.gen(function* refuseThenAnswer() {
              const key = yield* nextControlKey(page);
              const tree = yield* openItem(page, inlineItem);
              const instance = instanceOf(tree);
              const planet = selectOf(page, entryName(instance, responseId));
              const water = selectOf(page, entryName(instance, optionalId));
              const most = 2 * tabOrder(tree).length;
              const presented = yield* presentedValues(planet);

              assert.strictEqual(yield* count(planet), 1);
              assert.strictEqual(yield* count(water), 1);
              assert.strictEqual(presented[0], "", "the Placeholder is the first option");
              assert.sameMembers(presented.slice(1), identifiers, "every choice is presented once");
              assert.deepStrictEqual(presented.slice(-1), fixed, "the fixed choice stays last");

              yield* tabUntil(page, key, submitButton(page), most);

              const refused = yield* postByEnter(page);

              assert.strictEqual(refused.method, "POST");
              assert.strictEqual(yield* statusHeadings(page, "notAccepted"), 1);
              assert.strictEqual(yield* inStatus(page, tooFew), 1, tooFew);
              assert.deepStrictEqual(
                yield* presentedValues(planet),
                presented,
                "the refused page presents the same order",
              );
              assert.strictEqual(yield* valueOf(planet), "", "the Placeholder is restored");

              // The item form's action names the Status region as its fragment, so HTML skips the
              // invalid select's `autofocus` and focus rests on the region; the next press moves
              // into the item, whose first stop is the select.
              assert.isTrue(
                yield* isFocused(page, page.getByRole("status")),
                "the Status region holds focus on the refused page",
              );

              yield* press(page, key);

              assert.isTrue(
                yield* isFocused(page, planet),
                `${key} from the Status region reaches the select`,
              );

              yield* type(page, typed.inline.letter);

              assert.strictEqual(
                yield* valueOf(planet),
                typed.inline.identifier,
                "J chose Jupiter",
              );

              yield* tabUntil(page, key, submitButton(page), most);

              const recorded = yield* postByEnter(page);

              assert.strictEqual(recorded.method, "POST");
              assert.strictEqual(yield* statusHeadings(page, "scored"), 1);
              assert.strictEqual(yield* inStatus(page, message("en", "score", { score: "1" })), 1);
              assert.strictEqual(
                yield* valueOf(planet),
                typed.inline.identifier,
                "Jupiter is restored",
              );
              assert.strictEqual(
                yield* valueOf(water),
                "",
                "RESPONSE2 is NULL, so its Placeholder is restored",
              );
            }),
          );
        }),
    );
  });
});

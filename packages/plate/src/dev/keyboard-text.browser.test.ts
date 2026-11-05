import { assert } from "@effect/vitest";
import { Effect, Option } from "effect";
import type { Locator, Page } from "playwright-core";
import type { Element } from "#plate/emit/node.ts";
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
import type { NextControlKey } from "#plate/test/browsers.ts";
import { tabOrder } from "#plate/test/keyboard.ts";
import {
  count,
  elementStops,
  elementsOf,
  formStops,
  inStatus,
  instanceOf,
  isFocused,
  itemFormOf,
  openItem,
  press,
  stopsToSubmit,
  submitBy,
  submitButton,
  tabUntil,
  textEntryOf,
} from "#plate/test/playground-page.ts";

/**
 * The example corpus's text items the keys answer: BG010's Text Entry, scored by `map_response`
 * with York mapped to 1, BG011's single Extended Text, and the postcard's ten Extended Texts, some
 * `format="xhtml"`; none of the Extended Text items has response processing.
 */
const items = {
  bg010: "QTI3_BPIG_Examples/items/BG010.xml",
  bg011: "QTI3_BeginnersGuide_Examples/items/BG011.xml",
  postcard:
    "qtiv3-examples/items/shared-vocabulary/Items/Item_QTI3_WritingPostcard_02/extended_text_qti3.xml",
} as const;

/**
 * The walk corpus's ordered Extended Text, with `max-strings="3"`, so three Controls.
 */
const orderedItem = "ordered.xml";

/**
 * The response BG010, BG011 and the ordered Extended Text declare.
 */
const responseId = "RESPONSE";

/**
 * The two lines typed into an essay's textarea, with Enter between them.
 */
const lines = ["First line", "Second line"] as const;

/**
 * The two values typed into the first two of the ordered Extended Text's three Controls, in order.
 */
const planets = ["Mercury", "Venus"] as const;

/**
 * An essay the keys answer: its corpus path, and whether the textarea typed into is the first one
 * marked `format="xhtml"` rather than the item form's first.
 */
interface Essay {
  readonly item: string;
  readonly label: string;
  readonly xhtml: boolean;
}

/**
 * The essays: BG011's one textarea, and the postcard's first `xhtml` one, which the session lists
 * the postcard for.
 */
const essays: readonly Essay[] = [
  { item: items.bg011, label: "BG011", xhtml: false },
  { item: items.postcard, label: "the postcard", xhtml: true },
];

/**
 * A `pattern-mask` probe of the walk corpus and the two entries typed into it, each a valid
 * literal of the response's base type, so a refusal is the pattern's and not the type's.
 */
interface PatternProbe {
  /**
   * The probe's path in the walk corpus.
   */
  readonly item: string;
  readonly label: string;
  /**
   * An entry the pattern admits.
   */
  readonly match: string;
  /**
   * An entry the pattern refuses.
   */
  readonly mismatch: string;
}

/**
 * The session's pattern item and the three derived probes `src/ledger/passes.ts` lists, one for
 * each distinct pattern the corpus uses:
 *
 * - `pattern.xml`, a `string` against `[0-9]{1,4}`: five digits mismatch.
 * - Example03's probe, a `float` against `([0-9.\\-]{0,10})`, matched in its canonical form: eleven
 *   digits, which `String` writes as eleven digits, mismatch.
 * - RichardTake3's `RESPONSE10`, a `string` against `([0-9.]{0,6})`: seven digits mismatch.
 * - The packaged RichardTake3's `RESPONSE10`, a `string` against `[0-9\.]+`: a letter mismatches.
 */
const patternProbes: readonly PatternProbe[] = [
  { item: "pattern.xml", label: "pattern.xml", match: "2024", mismatch: "12345" },
  {
    item: "derived/QTI3_BPIG_Examples/items/Example03-feedbackBlock-solution/RESPONSE.xml",
    label: "Example03's derived probe",
    match: "3.14",
    mismatch: "12345678901",
  },
  {
    item: "derived/qtiv3-examples/items/shared-vocabulary/Items/Item_QTI3_RichardTake3_01/text_entry_qti3/RESPONSE10.xml",
    label: "RichardTake3's derived probe",
    match: "12.5",
    mismatch: "1234567",
  },
  {
    item: "derived/qtiv3-examples/items/shared-vocabulary/shared-vocabulary-imsmanifest.zip.d/Items/Item_QTI3_RichardTake3_01/text_entry_qti3/RESPONSE10.xml",
    label: "the packaged RichardTake3's derived probe",
    match: "3.5",
    mismatch: "12a",
  },
];

/**
 * List the item form's textareas, in document order.
 *
 * @param tree The item page's tree.
 * @returns The textareas.
 */
const textareasOf = (tree: Element): readonly Element[] =>
  elementsOf([itemFormOf(tree)]).filter((element) => element.tag === "textarea");

/**
 * Type text into the focused element, a key press for each character.
 *
 * @param page The page.
 * @param text The text.
 * @returns Once every key is up.
 */
const type = (page: Page, text: string) => Effect.promise(() => page.keyboard.type(text));

/**
 * Read a text control's value as the browser holds it.
 *
 * @param target The control.
 * @returns Its value.
 */
const valueOf = (target: Locator) => Effect.promise(() => target.inputValue());

/**
 * Count the Status region's headings that name an after-submit state.
 *
 * @param page The page after a submit.
 * @param state The state, as `messages.ts` keys it.
 * @returns How many headings of the region, read through its role `status`, have its text.
 */
const statusHeadings = (page: Page, state: "notAccepted" | "responseRecorded") =>
  count(page.getByRole("status").getByRole("heading", { exact: true, name: message("en", state) }));

/**
 * Press the next-control key through an item's page to its Submit, and compare the elements it
 * visits inside the item form ({@link elementStops}) with the Node walk's `tabOrder` for that
 * form.
 *
 * @param page The page, fresh: the key is probed on it first.
 * @param corpusPath The item's path in the playground's corpus.
 * @returns What the presses did beside the compared order: the key pressed, how many of the page's
 *   links they stopped on before the item form, and how many presses the form's media elements
 *   took.
 */
const tabOrderOf = Effect.fn("tabOrderOf")(function* tabOrderOf(page: Page, corpusPath: string) {
  const key = yield* nextControlKey(page);
  const tree = yield* openItem(page, corpusPath);
  // Room for a media element's native controls, which the Node walk counts as one stop.
  const stops = yield* stopsToSubmit(page, key, 4 * tabOrder(tree).length);
  const first = stops.findIndex((stop) => stop.inForm);

  assert.isAtLeast(first, 0, "a press reached the item form");
  assert.deepStrictEqual(
    elementStops(stops.slice(first)).map((stop) => stop.key),
    formStops(tree),
  );

  return {
    key,
    links: stops.slice(0, first).filter((stop) => stop.link).length,
    media: stops.slice(first).filter((stop) => stop.media).length,
  };
});

/**
 * Describe what the presses did beside the compared order, for a test's annotation.
 *
 * @param seen What {@link tabOrderOf} returned.
 * @param seen.key The next-control key pressed.
 * @param seen.links How many of the page's links the presses stopped on before the item form.
 * @param seen.media How many presses the item form's media elements took.
 * @param label The item, as the test's title names it.
 * @returns The phrase.
 */
const observed = (
  seen: { readonly key: NextControlKey; readonly links: number; readonly media: number },
  label: string,
): string =>
  `${seen.key}: before ${label}'s item form, ${[
    seen.links > 0
      ? `stopped on ${String(seen.links)} of the page's links`
      : "stopped on none of the page's links",
    ...(seen.media > 0 ? [`the form's media elements took ${String(seen.media)} presses`] : []),
  ].join("; ")}`;

eachEngine((it, name) => {
  it.layer(playgroundLayer({}))("the keyboard, text", (keys) => {
    for (const [label, corpusPath, tag] of [
      ["BG010", items.bg010, "[Q-20]"],
      ["BG011", items.bg011, "[Q-5]"],
      ["the postcard", items.postcard, "[Q-5]"],
    ] as const) {
      keys.effect(
        `${tag} [keyboard] Tab order: ${label}'s item form, from its first control to its Submit, is the Node walk's tabOrder`,
        (context) =>
          withPage({ javaScriptEnabled: false }, (page) =>
            Effect.gen(function* tabOrderMatches() {
              const seen = yield* tabOrderOf(page, corpusPath);

              yield* Effect.promise(() => context.annotate(`${name}, ${observed(seen, label)}`));
            }),
          ),
      );
    }

    keys.effect(
      "[Q-20] [keyboard] BG010 answered by keys: Tab to the Text Entry, type York, Enter submits the form and scores 1",
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* answerYork() {
            const key = yield* nextControlKey(page);
            const tree = yield* openItem(page, items.bg010);
            const entry = entryName(instanceOf(tree), responseId);

            yield* tabUntil(
              page,
              key,
              page.locator(`input[name="${entry}"]`),
              2 * tabOrder(tree).length,
            );
            yield* type(page, "York");
            yield* submitBy(page, "Enter");

            assert.strictEqual(yield* inStatus(page, message("en", "score", { score: "1" })), 1);
          }),
        ),
    );

    for (const essay of essays) {
      keys.effect(
        `[Q-5] [keyboard] ${essay.label} answered by keys: a line, Enter, a second line, Tab to Submit and Enter record the response, and the restored textarea holds both lines`,
        () =>
          withPage({ javaScriptEnabled: false }, (page) =>
            Effect.gen(function* answerEssay() {
              const key = yield* nextControlKey(page);
              const tree = yield* openItem(page, essay.item);
              const chosen =
                textareasOf(tree).find(
                  (textarea) => !essay.xhtml || attribute(textarea, "data-format") === "xhtml",
                ) ?? assert.fail(`${essay.label}'s item form has the textarea to type into`);
              const textarea = page.locator(`textarea[name="${attribute(chosen, "name") ?? ""}"]`);
              const most = 2 * tabOrder(tree).length;

              assert.strictEqual(yield* count(textarea), 1);

              yield* tabUntil(page, key, textarea, most);
              yield* type(page, lines[0]);
              yield* press(page, "Enter");
              yield* type(page, lines[1]);

              assert.isTrue(yield* isFocused(page, textarea), "Enter stays in the textarea");

              yield* tabUntil(page, key, submitButton(page), most);
              yield* submitBy(page, "Enter");

              assert.strictEqual(yield* statusHeadings(page, "responseRecorded"), 1);
              assert.strictEqual(yield* valueOf(textarea), lines.join("\n"));
            }),
          ),
      );
    }
  });

  it.layer(walkPlaygroundLayer)("the keyboard, text, over the walk corpus", (walk) => {
    walk.effect(
      "[Q-5] [keyboard] Tab order: ordered.xml's item form, from its first control to its Submit, is the Node walk's tabOrder",
      (context) =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* orderedTabOrder() {
            const seen = yield* tabOrderOf(page, orderedItem);

            yield* Effect.promise(() =>
              context.annotate(`${name}, ${observed(seen, "ordered.xml")}`),
            );
          }),
        ),
    );

    walk.effect(
      "[Q-5] [keyboard] ordered.xml answered by keys: Tab moves through its three Controls in order, two filled, Enter on Submit records the response, and the restored Controls hold the two in order",
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* answerOrdered() {
            const key = yield* nextControlKey(page);
            const tree = yield* openItem(page, orderedItem);
            const entry = entryName(instanceOf(tree), responseId);
            const controls = page.locator(`textarea[name="${entry}"]`);
            const total = textareasOf(tree).filter(
              (textarea) => attribute(textarea, "name") === entry,
            ).length;
            const most = 2 * tabOrder(tree).length;

            assert.strictEqual(total, 3);
            assert.strictEqual(yield* count(controls), total);

            yield* tabUntil(page, key, controls.nth(0), most);
            yield* type(page, planets[0]);
            yield* press(page, key);

            assert.isTrue(
              yield* isFocused(page, controls.nth(1)),
              "the next press reaches the second",
            );

            yield* type(page, planets[1]);
            yield* press(page, key);

            assert.isTrue(
              yield* isFocused(page, controls.nth(2)),
              "the next press reaches the third",
            );

            yield* tabUntil(page, key, submitButton(page), most);
            yield* submitBy(page, "Enter");

            assert.strictEqual(yield* statusHeadings(page, "responseRecorded"), 1);
            assert.deepStrictEqual(
              yield* Effect.all(
                Array.from({ length: total }, (_, index) => valueOf(controls.nth(index))),
              ),
              [...planets, ""],
            );
          }),
        ),
    );

    for (const probe of patternProbes) {
      walk.effect(
        `[Q-20] [keyboard] pattern-mask: ${probe.label} refuses "${probe.mismatch}" typed by keys with its pattern message`,
        () =>
          Effect.gen(function* refused() {
            const interaction = yield* textEntryOf(probe.item);
            const expected = Option.getOrElse(interaction.patternMaskMessage, () =>
              message("en", "patternMismatch"),
            );

            yield* withPage({ javaScriptEnabled: false }, (page) =>
              Effect.gen(function* typeMismatch() {
                const key = yield* nextControlKey(page);
                const tree = yield* openItem(page, probe.item);
                const entry = entryName(instanceOf(tree), interaction.response);

                yield* tabUntil(
                  page,
                  key,
                  page.locator(`input[name="${entry}"]`),
                  2 * tabOrder(tree).length,
                );
                yield* type(page, probe.mismatch);
                yield* submitBy(page, "Enter");

                assert.strictEqual(yield* statusHeadings(page, "notAccepted"), 1);
                assert.strictEqual(yield* inStatus(page, expected), 1, expected);
              }),
            );
          }),
      );

      walk.effect(
        `[Q-20] [keyboard] pattern-mask: ${probe.label} accepts "${probe.match}" typed by keys`,
        () =>
          Effect.gen(function* accepted() {
            const interaction = yield* textEntryOf(probe.item);
            const expected = Option.getOrElse(interaction.patternMaskMessage, () =>
              message("en", "patternMismatch"),
            );

            yield* withPage({ javaScriptEnabled: false }, (page) =>
              Effect.gen(function* typeMatch() {
                const key = yield* nextControlKey(page);
                const tree = yield* openItem(page, probe.item);
                const entry = entryName(instanceOf(tree), interaction.response);

                yield* tabUntil(
                  page,
                  key,
                  page.locator(`input[name="${entry}"]`),
                  2 * tabOrder(tree).length,
                );
                yield* type(page, probe.match);
                yield* submitBy(page, "Enter");

                assert.strictEqual(yield* statusHeadings(page, "responseRecorded"), 1);
                assert.strictEqual(yield* inStatus(page, expected), 0, expected);
              }),
            );
          }),
      );
    }
  });
});

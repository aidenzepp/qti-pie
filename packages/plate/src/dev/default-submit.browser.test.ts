/**
 * The playground item page's hidden default submit, in Chromium and WebKit: Enter in BG010's Text
 * Entry submits through it, so the post carries the answer and no entry of a submit button that
 * stands inside the item, as an End Attempt's Control does; a click on such a button still posts
 * its own entry; and the hidden default is neither rendered nor a tab stop.
 *
 * The item holds no submit button of its own on this base, so each row that needs one inserts a
 * decoy, `button type="submit" name="decoy" value="pressed"`, as the first child of the item's
 * root: before the host's hidden default it would be the form's first submit button in tree
 * order, HTML's default button, and Enter would post `decoy=pressed`.
 */
import { assert } from "@effect/vitest";
import { Effect, Predicate } from "effect";
import type { Page, Request } from "playwright-core";
import type { Element } from "#plate/emit/node.ts";
import { entryName } from "#plate/form/encoding.ts";
import { message } from "#plate/messages.ts";
import { attribute } from "#plate/test/accessibility.ts";
import { eachEngine, nextControlKey, playgroundLayer, withPage } from "#plate/test/browsers.ts";
import {
  byId,
  count,
  elementsOf,
  inStatus,
  instanceOf,
  isFocused,
  itemFormOf,
  openItem,
  press,
  submitButton,
} from "#plate/test/playground-page.ts";

/**
 * The example corpus's inline Text Entry: BG010, scored by `map_response` with York mapped to 1.
 */
const bg010 = "QTI3_BPIG_Examples/items/BG010.xml";

/**
 * The response BG010 declares.
 */
const responseId = "RESPONSE";

/**
 * The entry a decoy submit button inside the item posts when it is the submitter.
 */
const decoy = { name: "decoy", value: "pressed" } as const;

/**
 * The script that inserts the decoy as the first child of the item's root, the item form's element
 * child that carries `lang`. It is a string, since the Node-driven files name no DOM type.
 */
const insertDecoy = `(() => {
  const form = document.querySelector('form[action^="/item?"]');
  const root = form === null ? null : Array.from(form.children).find((child) => child.hasAttribute("lang"));
  if (root === undefined || root === null) {
    return false;
  }
  root.insertAdjacentHTML("afterbegin", '<button type="submit" name=${JSON.stringify(decoy.name)} value=${JSON.stringify(decoy.value)}>Decoy</button>');
  return true;
})()`;

/**
 * The script that reads the computed `display` of the item form's hidden submit button, or `null`
 * when the form holds none.
 */
const hiddenDisplay = `(() => {
  const hidden = document.querySelector('form[action^="/item?"] button[hidden]');
  return hidden === null ? null : getComputedStyle(hidden).display;
})()`;

/**
 * Find the Text Entry's Control in an item page's tree: the `input` posting the response's entry.
 *
 * @param tree The item page's tree.
 * @param entry The response's entry name.
 * @returns The Control's `id`; the test fails when the form holds no such input, or it has no id.
 */
const controlId = (tree: Element, entry: string): string => {
  const control = elementsOf([itemFormOf(tree)]).find(
    (element) => element.tag === "input" && attribute(element, "name") === entry,
  );

  return (
    attribute(control ?? assert.fail("the item form has no Text Entry Control"), "id") ??
    assert.fail("the Text Entry Control has no id")
  );
};

/**
 * Insert the decoy into the item's root and check it is there, a live submit button of the form.
 *
 * @param page The page, open at the item.
 * @returns Once the decoy is the form's first submit button in tree order.
 */
const withDecoy = Effect.fn("withDecoy")(function* withDecoy(page: Page) {
  const inserted: unknown = yield* Effect.promise(() => page.evaluate(insertDecoy));

  assert.strictEqual(inserted, true, "the decoy was inserted into the item's root");
  assert.strictEqual(yield* count(page.getByRole("button", { name: "Decoy" })), 1);
});

/**
 * Act on the page and read the form post the act makes, once the answering page has loaded.
 *
 * @param page The page.
 * @param act The click or key press that submits.
 * @returns The post's entries.
 */
const postedBy = Effect.fn("postedBy")(function* postedBy(page: Page, act: () => Promise<void>) {
  const [request] = yield* Effect.promise(() =>
    Promise.all([
      page.waitForRequest((candidate: Request) => candidate.method() === "POST"),
      page.waitForURL((url) => url.searchParams.has("instance")),
      act(),
    ]),
  );

  return new URLSearchParams(request.postData() ?? "");
});

/**
 * Type text into the focused element, a key press for each character.
 *
 * @param page The page.
 * @param text The text.
 * @returns Once every key is up.
 */
const type = (page: Page, text: string) => Effect.promise(() => page.keyboard.type(text));

eachEngine((it) => {
  it.layer(playgroundLayer({}))("the hidden default submit", (keys) => {
    keys.effect(
      "[W0-DEFAULT-SUBMIT] Enter in BG010's Text Entry submits through the hidden default: the post carries the answer and no entry of a submit button inside the item",
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* enterSubmits() {
            const tree = yield* openItem(page, bg010);
            const entry = entryName(instanceOf(tree), responseId);
            const control = byId(page, controlId(tree, entry));

            yield* withDecoy(page);
            yield* Effect.promise(() => control.focus());

            assert.isTrue(yield* isFocused(page, control), "the Text Entry has focus");

            yield* type(page, "York");

            const posted = yield* postedBy(page, () => page.keyboard.press("Enter"));

            assert.deepStrictEqual(posted.getAll(entry), ["York"]);
            assert.isFalse(posted.has(decoy.name), "the post carries no entry of the decoy");
            assert.strictEqual(yield* inStatus(page, message("en", "score", { score: "1" })), 1);
          }),
        ),
    );

    keys.effect(
      "[W0-DEFAULT-SUBMIT] a submit button inside the item still posts its own entry when clicked",
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* decoyClicked() {
            const tree = yield* openItem(page, bg010);
            const entry = entryName(instanceOf(tree), responseId);

            yield* withDecoy(page);

            const posted = yield* postedBy(page, () =>
              page.getByRole("button", { name: "Decoy" }).click(),
            );

            assert.deepStrictEqual(posted.getAll(decoy.name), [decoy.value]);
            assert.isTrue(posted.has(entry), "the post carries the Text Entry's entry");
          }),
        ),
    );

    keys.effect("[W0-DEFAULT-SUBMIT] the hidden default is not rendered and not a tab stop", () =>
      withPage({ javaScriptEnabled: false }, (page) =>
        Effect.gen(function* notAStop() {
          const key = yield* nextControlKey(page);
          const tree = yield* openItem(page, bg010);
          const entry = entryName(instanceOf(tree), responseId);
          const control = byId(page, controlId(tree, entry));
          const hidden = page.locator("form button[hidden]");

          assert.strictEqual(yield* count(hidden), 1);

          const display: unknown = yield* Effect.promise(() => page.evaluate(hiddenDisplay));

          assert.isTrue(Predicate.isString(display));
          assert.strictEqual(display, "none");

          yield* Effect.promise(() => control.focus());

          assert.isTrue(yield* isFocused(page, control), "the Text Entry has focus");

          yield* press(page, key);

          assert.isTrue(
            yield* isFocused(page, submitButton(page)),
            "one press lands on the visible Submit",
          );
        }),
      ),
    );
  });
});

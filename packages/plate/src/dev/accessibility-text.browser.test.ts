import { assert } from "@effect/vitest";
import { Effect, Option } from "effect";
import type { Page } from "playwright-core";
import { configure } from "#plate/configuration.ts";
import type { Element } from "#plate/emit/node.ts";
import { rowFor } from "#plate/emit/parts.ts";
import { patternMessage } from "#plate/interactions/pattern.ts";
import { message } from "#plate/messages.ts";
import { attribute, nameOf } from "#plate/test/accessibility.ts";
import {
  axQuery,
  byNodeId,
  chromiumTree,
  descendantsOf,
  flatName,
  focusedIn,
  propertyOf,
} from "#plate/test/ax-tree.ts";
import {
  eachEngine,
  nextControlKey,
  playgroundLayer,
  walkPlaygroundLayer,
  withPage,
} from "#plate/test/browsers.ts";
import type { EngineName } from "#plate/test/browsers.ts";
import {
  assertResultFirst,
  byId,
  correctOf,
  count,
  elementsOf,
  exposed,
  focusedElement,
  openItem as openPage,
  press,
  snapshotDescendants,
  snapshotOf,
  submitRead,
  textEntryOf,
  treesRead,
} from "#plate/test/playground-page.ts";
import { xhtmlItem } from "#scripts/walk-corpus.ts";

/**
 * The corpus items whose text Controls the tests read: BG010's one Text Entry, in a line of a
 * quotation and named by no author; and BG011's one Extended Text, with no Prompt.
 */
const corpusItems = [
  { label: "BG010", path: "QTI3_BPIG_Examples/items/BG010.xml", tags: "[Q-20]" },
  { label: "BG011", path: "QTI3_BeginnersGuide_Examples/items/BG011.xml", tags: "[Q-5]" },
] as const;

/**
 * The walk corpus's text items: `ordered.xml`, an Extended Text bound to an `ordered` response
 * with `max-strings="3"` under a Prompt, so a group of three Controls; `pattern.xml`, a Text Entry
 * with a `pattern-mask` and the author's `data-patternmask-message`; and `xhtml.xml`'s five
 * Extended Texts, each named by its Prompt, in the `plain` and `xhtml` formats.
 */
const walkItems = [
  { label: "ordered.xml", path: "ordered.xml", tags: "[Q-5]" },
  { label: "pattern.xml", path: "pattern.xml", tags: "[Q-20]" },
  { label: "xhtml.xml", path: xhtmlItem, tags: "[Q-5]" },
] as const;

/**
 * The items the group, result and pattern tests read: BG010, scored; `ordered.xml`, the container
 * group; and `pattern.xml`, refused when its entry mismatches.
 */
const [bg010] = corpusItems;

const [ordered, pattern] = walkItems;

/**
 * The Controls `ordered.xml`'s group holds: its `max-strings`.
 */
const orderedControls = 3;

/**
 * An entry `pattern.xml`'s `pattern-mask` (one to four digits) refuses.
 */
const mismatching = "seven";

/**
 * The text interactions' Root and Control markers, read through the part table.
 */
const slots = {
  extendedControl: rowFor("extended-text-interaction", "control").slot,
  extendedRoot: rowFor("extended-text-interaction", "root").slot,
  textEntryControl: rowFor("text-entry-interaction", "control").slot,
};

/**
 * A text Control as the HTML the playground answered presents it: its id, whether it is marked
 * invalid (`aria-invalid="true"`), whether it is multi-line (an Extended Text's), and the
 * accessible name `nameOf` gives it.
 */
interface PresentedControl {
  readonly id: string;
  readonly invalid: boolean;
  readonly multiline: boolean;
  readonly name: string;
}

/**
 * Read the text Controls below an element, as the oracle names them.
 *
 * @param below The element whose descendants are read.
 * @param tree The page's tree, which `nameOf` resolves references in.
 * @returns Every Text Entry and Extended Text Control below it, in document order.
 */
const controlsIn = (below: Element, tree: Element): readonly PresentedControl[] =>
  elementsOf(below.children)
    .filter((element) => {
      const slot = attribute(element, "data-slot");

      return slot === slots.textEntryControl || slot === slots.extendedControl;
    })
    .map((control): PresentedControl => ({
      id: attribute(control, "id") ?? "",
      invalid: attribute(control, "aria-invalid") === "true",
      multiline: attribute(control, "data-slot") === slots.extendedControl,
      name: nameOf(control, tree),
    }));

/**
 * Open an item page of the playground in a page, and read the text Controls its answered HTML
 * presents.
 *
 * @param page The page.
 * @param corpusPath The item's path in the playground's document set.
 * @returns The page's tree and its Controls; the test fails unless the page holds at least one.
 */
const openItem = Effect.fn("openItem")(function* openItem(page: Page, corpusPath: string) {
  const tree = yield* openPage(page, corpusPath);
  const controls = controlsIn(tree, tree);

  assert.isAbove(controls.length, 0, `${corpusPath} presents a text Control`);

  return { controls, tree };
});

/**
 * Type an entry into a text Control, as a person does.
 *
 * @param page The page.
 * @param control The Control.
 * @param entry The text typed.
 * @returns Once the Control holds the entry.
 */
const typeInto = (page: Page, control: PresentedControl, entry: string) =>
  Effect.promise(() => byId(page, control.id).fill(entry));

/**
 * Give the message `pattern.xml`'s Text Entry shows for the mismatching entry, as the renderer's
 * own check gives it under `validateResponses`, and confirm it is the author's
 * `data-patternmask-message`.
 *
 * @returns The message; the test fails unless the item is accepted, holds one Text Entry with a
 *   `data-patternmask-message`, and its check gives that message for the entry.
 */
const authoredPatternMessage = Effect.fn("authoredPatternMessage")(
  function* authoredPatternMessage() {
    const entry = yield* textEntryOf(pattern.path);
    const authored = Option.getOrUndefined(entry.patternMaskMessage);
    assert.isDefined(authored, `${pattern.path}'s Text Entry carries data-patternmask-message`);

    const configuration = yield* configure({ validateResponses: true });
    const shown = patternMessage(
      entry,
      {
        baseType: "string",
        cardinality: "single",
        values: [{ baseType: "string", value: mismatching }],
      },
      configuration,
    );

    assert.deepStrictEqual(Option.getOrUndefined(shown), authored);

    return authored;
  },
);

/**
 * Open `pattern.xml`, type the mismatching entry into its Text Entry, submit, and read the page the
 * refused post answered.
 *
 * @param page The page.
 * @returns The answered page's tree, its text Controls, and its refused Control: the first, in
 *   document order, that the answered HTML marks invalid; the test fails when it marks none.
 */
const mismatch = Effect.fn("mismatch")(function* mismatch(page: Page) {
  const { controls } = yield* openItem(page, pattern.path);
  const [entry] = controls;
  assert.isDefined(entry);

  yield* typeInto(page, entry, mismatching);

  const answered = yield* submitRead(page);
  const answeredControls = controlsIn(answered, answered);
  const refused = answeredControls.find((control) => control.invalid);
  assert.isDefined(refused, "the answered page holds a refused Control");

  return { answered, controls: answeredControls, refused };
});

/**
 * Assert that each text Control of an item page has role `textbox` and the name `nameOf` gives
 * it, and is multi-line exactly when it is an Extended Text's: a `textarea`, and in Chromium's
 * tree `multiline`; else an `input`, which Chromium does not mark `multiline`.
 *
 * @param page The page.
 * @param name The engine.
 * @param corpusPath The item's path in the playground's document set.
 * @returns Once every assertion has held.
 */
const assertControls = Effect.fn("assertControls")(function* assertControls(
  page: Page,
  name: EngineName,
  corpusPath: string,
) {
  const { controls } = yield* openItem(page, corpusPath);

  for (const control of controls) {
    const located = byId(page, control.id);
    const node = yield* snapshotOf(located);
    const element = page.locator(
      control.multiline ? `textarea[id="${control.id}"]` : `input[id="${control.id}"]`,
    );

    assert.strictEqual(node.role, "textbox", control.id);
    assert.strictEqual(node.name ?? "", control.name, control.id);
    assert.strictEqual(
      yield* Effect.promise(() =>
        page
          .getByRole("textbox", { exact: true, name: control.name })
          .and(located)
          .and(element)
          .count(),
      ),
      1,
      `${control.id} is a textbox named "${control.name}", ${control.multiline ? "a textarea" : "an input"}`,
    );
  }

  if (name === "chromium") {
    const nodes = yield* chromiumTree(page, name);

    assert.deepStrictEqual(
      controls.map((control) => {
        const own = exposed(nodes, "textbox", control.name, "flat");

        return { multiline: propertyOf(own, "multiline") === true, name: flatName(own.name) };
      }),
      controls.map((control) => ({ multiline: control.multiline, name: control.name })),
    );
  }
});

eachEngine((it, name) => {
  it.layer(playgroundLayer({}))("the accessibility tree, text", (tree) => {
    for (const item of corpusItems) {
      tree.effect(
        `${item.tags} Controls: each of ${item.label}'s text Controls has role textbox and the name nameOf gives it, multi-line exactly when it is an Extended Text's, in ${treesRead(name)}`,
        () =>
          withPage({ javaScriptEnabled: false }, (page) => assertControls(page, name, item.path)),
      );
    }

    tree.effect(
      `[Q-20] The result first: BG010 with York, then Submit: the fragment names the Status region, which is focused and holds score 1, in ${treesRead(name)}`,
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* resultFirst() {
            const { controls } = yield* openItem(page, bg010.path);
            const [entry] = controls;
            assert.isDefined(entry);

            const [correct] = yield* correctOf(bg010.path, "RESPONSE");
            assert.isDefined(correct, "BG010 declares a correct response");

            yield* typeInto(page, entry, correct);
            yield* assertResultFirst(
              page,
              name,
              yield* submitRead(page),
              [message("en", "score", { score: "1" })],
              "flat",
            );
          }),
        ),
    );
  });

  it.layer(walkPlaygroundLayer)("the accessibility tree, text, over the walk corpus", (tree) => {
    for (const item of walkItems) {
      tree.effect(
        `${item.tags} Controls: each of ${item.label}'s text Controls has role textbox and the name nameOf gives it, multi-line exactly when it is an Extended Text's, in ${treesRead(name)}`,
        () =>
          withPage({ javaScriptEnabled: false }, (page) => assertControls(page, name, item.path)),
      );
    }

    tree.effect(
      `[Q-5] The container group: ordered.xml's group Root has role group and the name its Prompt gives, and its three Controls are its only textboxes, in order, in ${treesRead(name)}`,
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* containerGroup() {
            const opened = yield* openItem(page, ordered.path);
            const roots = elementsOf([opened.tree]).filter(
              (element) =>
                attribute(element, "data-slot") === slots.extendedRoot &&
                attribute(element, "role") === "group",
            );

            assert.strictEqual(roots.length, 1, "the page holds one Extended Text group");

            const [root] = roots;
            assert.isDefined(root);

            const groupName = nameOf(root, opened.tree);
            const controls = controlsIn(root, opened.tree);
            const group = page.locator(`[data-slot="${slots.extendedRoot}"]`);
            const node = yield* snapshotOf(group);

            assert.notStrictEqual(groupName, "", "the group is named");
            assert.strictEqual(controls.length, orderedControls);
            assert.deepStrictEqual(controls, opened.controls);
            assert.strictEqual(node.role, "group");
            assert.strictEqual(node.name, groupName);
            assert.strictEqual(
              yield* Effect.promise(() =>
                page.getByRole("group", { exact: true, name: groupName }).and(group).count(),
              ),
              1,
            );
            assert.deepStrictEqual(
              yield* Effect.all(
                (yield* Effect.promise(() => group.getByRole("textbox").all())).map((located) =>
                  Effect.promise(() => located.getAttribute("id")),
                ),
              ),
              controls.map((control) => control.id),
            );
            assert.deepStrictEqual(
              snapshotDescendants(node)
                .filter((descendant) => descendant.role === "textbox")
                .map((descendant) => descendant.name ?? ""),
              controls.map((control) => control.name),
            );

            if (name === "chromium") {
              const nodes = yield* chromiumTree(page, name);
              const own = exposed(nodes, "group", groupName, "flat");
              const queried = yield* axQuery(page, name, { name: groupName, role: "group" });

              assert.deepStrictEqual(
                queried
                  .filter((found) => !found.ignored)
                  .map((found) => Option.getOrUndefined(found.backendDOMNodeId)),
                [Option.getOrUndefined(own.backendDOMNodeId)],
              );
              assert.deepStrictEqual(
                descendantsOf(own, byNodeId(nodes))
                  .filter((descendant) => !descendant.ignored && descendant.role === "textbox")
                  .map((descendant) => flatName(descendant.name)),
                controls.map((control) => control.name),
              );
            }
          }),
        ),
    );

    tree.effect(
      `[Q-20] The pattern message: pattern.xml with a mismatching entry, then Submit: the Control is invalid and described by the author's data-patternmask-message, in ${treesRead(name)}`,
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* patternDescribed() {
            const authored = yield* authoredPatternMessage();
            const { refused } = yield* mismatch(page);
            const control = byId(page, refused.id);
            const node = yield* snapshotOf(control);

            assert.strictEqual(node.role, "textbox");
            assert.strictEqual(node.name, refused.name);
            assert.strictEqual(node.invalid, true);
            assert.strictEqual(
              yield* Effect.promise(() =>
                page
                  .getByRole("textbox", {
                    description: authored,
                    exact: true,
                    name: refused.name,
                  })
                  .and(control)
                  .count(),
              ),
              1,
            );

            if (name === "chromium") {
              const own = exposed(yield* chromiumTree(page, name), "textbox", refused.name, "flat");

              assert.strictEqual(propertyOf(own, "invalid"), "true");
              assert.strictEqual(own.description, authored);
            }
          }),
        ),
    );

    tree.effect(
      `[Q-20] The pattern message: pattern.xml with a mismatching entry, then Submit: the Status region is focused and holds Not accepted and the author's message, and the next control key from it reaches a control of the item before any other part of the page, in ${treesRead(name)}`,
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* patternFocus() {
            const key = yield* nextControlKey(page);
            const authored = yield* authoredPatternMessage();
            const { answered, controls } = yield* mismatch(page);

            yield* assertResultFirst(
              page,
              name,
              answered,
              [message("en", "notAccepted"), authored],
              "flat",
            );
            yield* press(page, key);

            const itemControls = page.locator(
              controls.map((control) => `[id="${control.id}"]`).join(", "),
            );

            assert.strictEqual(
              yield* count(itemControls.and(page.locator(":focus"))),
              1,
              yield* focusedElement(page),
            );

            if (name === "chromium") {
              const focused = focusedIn(yield* chromiumTree(page, name));

              assert.deepStrictEqual(
                focused.map((node) => node.role),
                ["textbox"],
              );

              const [reached] = focused;
              assert.isDefined(reached);
              assert.include(
                controls.map((control) => control.name),
                flatName(reached.name),
              );
            }
          }),
        ),
    );
  });
});

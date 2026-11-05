import { assert } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import type { Page } from "playwright-core";
import type { Element } from "#plate/emit/node.ts";
import { rowFor } from "#plate/emit/parts.ts";
import { attribute, nameOf } from "#plate/test/accessibility.ts";
import { axQuery, byNodeId, chromiumTree, descendantsOf, propertyOf } from "#plate/test/ax-tree.ts";
import type { AxNode } from "#plate/test/ax-tree.ts";
import { eachEngine, playgroundLayer, withPage } from "#plate/test/browsers.ts";
import { elementsOf, openItem } from "#plate/test/playground-page.ts";

/**
 * The corpus item the tests open: a shuffled Choice of four, the last fixed, its Prompt a
 * `legend`.
 */
const item = "qtiv3-examples/packaging/items/choice_fixed.xml";

/**
 * The Choice's Root, Control and Label markers, read through the part table.
 */
const slots = {
  control: rowFor("choice-interaction", "control").slot,
  label: rowFor("choice-interaction", "label").slot,
  root: rowFor("choice-interaction", "root").slot,
};

/**
 * What the HTML the playground answered presents: the Choice group's accessible name, and its
 * controls' names and ids in the presented order.
 */
interface Presented {
  readonly choices: readonly string[];
  readonly ids: readonly string[];
  readonly prompt: string;
}

/**
 * Read what a page's HTML presents of its one Choice, as the oracle names it.
 *
 * @param tree The page's tree, as the playground answered it.
 * @returns The group's name and its controls' names and ids, in document order.
 */
const presentedIn = (tree: Element): Presented => {
  const groups = elementsOf([tree]).filter(
    (element) => attribute(element, "data-slot") === slots.root,
  );

  assert.strictEqual(groups.length, 1);

  const [group] = groups;
  const controls = elementsOf(group?.children ?? []).filter(
    (element) => attribute(element, "data-slot") === slots.control,
  );

  return {
    choices: controls.map((control) => nameOf(control, tree)),
    ids: controls.map((control) => attribute(control, "id") ?? ""),
    prompt: group === undefined ? "" : nameOf(group, tree),
  };
};

/**
 * A Choice as Chromium's tree exposes it: its group node and the radio nodes below it.
 */
interface ExposedChoice {
  readonly group: AxNode;
  readonly radios: readonly AxNode[];
}

/**
 * Find the one group a tree exposes under a name, and the radios exposed below it.
 *
 * @param nodes The tree's nodes.
 * @param prompt The group's name.
 * @returns The group and its radios in tree order.
 */
const choiceIn = (nodes: readonly AxNode[], prompt: string): ExposedChoice => {
  const groups = nodes.filter(
    (node) => !node.ignored && node.role === "group" && node.name === prompt,
  );

  assert.strictEqual(groups.length, 1);

  const [group] = groups;
  assert.isDefined(group);

  return {
    group,
    radios: descendantsOf(group, byNodeId(nodes)).filter(
      (node) => !node.ignored && node.role === "radio",
    ),
  };
};

/**
 * Open the item in a page and read what its HTML presents.
 *
 * @param page The page.
 * @returns What the answered HTML presents.
 */
const openChoice = (page: Page) => openItem(page, item).pipe(Effect.map(presentedIn));

eachEngine((it, name) => {
  if (name === "chromium") {
    it.effect(
      "Chromium's own tree holds the Choice group named by its Prompt, its radios below it in the presented order and unchecked, and a clicked radio checked and focused",
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* choiceTree() {
            const presented = yield* openChoice(page);
            const before = choiceIn(yield* chromiumTree(page, name), presented.prompt);

            assert.strictEqual(presented.choices.length, 4);
            assert.deepStrictEqual(
              before.radios.map((radio) => radio.name),
              presented.choices,
            );
            assert.deepStrictEqual(
              before.radios.map((radio) => propertyOf(radio, "checked")),
              presented.choices.map(() => "false"),
            );

            const queried = yield* axQuery(page, name, { name: presented.prompt, role: "group" });

            assert.deepStrictEqual(
              queried
                .filter((node) => !node.ignored)
                .map((node) => Option.getOrUndefined(node.backendDOMNodeId)),
              [Option.getOrUndefined(before.group.backendDOMNodeId)],
            );

            const target = presented.choices[1] ?? "";

            // The Control is hidden from sight, so a person clicks its Label, as the mouse does here.
            yield* Effect.promise(() =>
              page.locator(`[data-slot="${slots.label}"][for="${presented.ids[1] ?? ""}"]`).click(),
            );

            const after = choiceIn(yield* chromiumTree(page, name), presented.prompt);

            assert.deepStrictEqual(
              after.radios.map((radio) => propertyOf(radio, "checked")),
              presented.choices.map((choice) => (choice === target ? "true" : "false")),
            );
            assert.deepStrictEqual(
              after.radios.map((radio) => propertyOf(radio, "focused")),
              presented.choices.map((choice) => (choice === target ? true : undefined)),
            );
          }),
        ).pipe(Effect.provide(playgroundLayer({}))),
    );
  } else {
    it.effect("chromiumTree and axQuery fail with ChromiumOnly", () =>
      withPage({ javaScriptEnabled: false }, (page) =>
        Effect.gen(function* otherEngine() {
          const presented = yield* openChoice(page);
          const tree = yield* Effect.result(chromiumTree(page, name));
          const queried = yield* Effect.result(
            axQuery(page, name, { name: presented.prompt, role: "group" }),
          );

          assert.deepStrictEqual(
            [tree, queried].map((result) =>
              Result.isFailure(result) ? result.failure._tag : "succeeded",
            ),
            ["ChromiumOnly", "ChromiumOnly"],
          );
        }),
      ).pipe(Effect.provide(playgroundLayer({}))),
    );
  }
});

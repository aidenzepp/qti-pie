import { assert } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import type { Page } from "playwright-core";
import type { Element } from "#plate/emit/node.ts";
import { rowFor } from "#plate/emit/parts.ts";
import { attribute, nameOf } from "#plate/test/accessibility.ts";
import { axQuery, byNodeId, chromiumTree, descendantsOf, propertyOf } from "#plate/test/ax-tree.ts";
import type { AxNode } from "#plate/test/ax-tree.ts";
import { eachEngine, playgroundLayer, withPage } from "#plate/test/browsers.ts";
import { count, elementsOf, openItem, snapshotOf, treesRead } from "#plate/test/playground-page.ts";

/**
 * The corpus item the tests open: a shuffled Choice of four, the last fixed, its Prompt a
 * `legend`.
 */
const item = "qtiv3-examples/packaging/items/choice_fixed.xml";

/**
 * The page the value test reads, hand-built: a `select` named House by its `label`, its first
 * option an empty prompt, and a slider named Level at 4 of 0 to 10.
 */
const valuePage = [
  "<!doctype html><title>Values</title>",
  '<label for="house">House</label>',
  '<select id="house"><option value="">Select an answer</option><option value="L">Lancaster</option><option value="Y">York</option></select>',
  '<input type="range" min="0" max="10" value="4" aria-label="Level">',
].join("");

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
  it.effect(
    `A node's value: the select's is the text of its chosen option, before and after a choice, and the slider's is its number, in ${treesRead(name)}`,
    () =>
      withPage({ javaScriptEnabled: false }, (page) =>
        Effect.gen(function* nodeValue() {
          const select = page.locator("#house");
          const chosen = (option: string) =>
            count(select.getByRole("option", { exact: true, name: option, selected: true }));
          const ownValues = Effect.fn("ownValues")(function* ownValues() {
            const nodes = yield* chromiumTree(page, name);
            const valueOf = (role: string, label: string) => {
              const found = nodes.filter(
                (node) => !node.ignored && node.role === role && node.name === label,
              );

              assert.strictEqual(found.length, 1, `one ${role} named ${label}`);

              return Option.getOrUndefined(found[0]?.value ?? Option.none());
            };

            return {
              root: nodes
                .filter((node) => node.role === "RootWebArea")
                .map((node) => Option.getOrUndefined(node.value)),
              select: valueOf("combobox", "House"),
              slider: valueOf("slider", "Level"),
            };
          });

          yield* Effect.promise(() => page.setContent(valuePage));

          assert.strictEqual((yield* snapshotOf(select)).role, "combobox");
          assert.strictEqual(yield* chosen("Select an answer"), 1);
          if (name === "chromium") {
            assert.deepStrictEqual(yield* ownValues(), {
              root: [undefined],
              select: "Select an answer",
              slider: 4,
            });
          }

          yield* Effect.promise(() => select.selectOption("L"));

          assert.strictEqual(yield* chosen("Lancaster"), 1);
          if (name === "chromium") {
            assert.deepStrictEqual(yield* ownValues(), {
              root: [undefined],
              select: "Lancaster",
              slider: 4,
            });
          }
        }),
      ),
  );

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

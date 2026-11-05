import { assert } from "@effect/vitest";
import { Effect, Option, Predicate, Schema } from "effect";
import type { Locator, Page } from "playwright-core";
import { openMember } from "#plate/dev/listing.ts";
import { h } from "#plate/emit/node.ts";
import type { Element, Node } from "#plate/emit/node.ts";
import { rowFor } from "#plate/emit/parts.ts";
import { message } from "#plate/messages.ts";
import { format } from "#plate/model/values.ts";
import { attribute, inputType, nameOf } from "#plate/test/accessibility.ts";
import { axQuery, chromiumTree } from "#plate/test/ax-tree.ts";
import type { AxNode } from "#plate/test/ax-tree.ts";
import { Playground, eachEngine, playgroundLayer, withPage } from "#plate/test/browsers.ts";
import type { EngineName } from "#plate/test/browsers.ts";
import { parseHtml } from "#plate/test/round-trip.ts";

/**
 * The corpus items whose Choice the tests read: BG007's True/False Choice, with no Prompt, so its
 * group has no name (Q10); choice_fixed's shuffled Choice of four, the last fixed, its Prompt a
 * `legend`; and BG008's Choice of five checkboxes with `max-choices="3"`, its Prompt block content
 * named through `aria-labelledby`.
 */
const items = [
  { label: "BG007", path: "QTI3_BPIG_Examples/items/BG007.xml" },
  { label: "choice_fixed", path: "qtiv3-examples/packaging/items/choice_fixed.xml" },
  { label: "BG008", path: "QTI3_BeginnersGuide_Examples/items/BG008.xml" },
] as const;

/**
 * The items the submits answer: BG007, scored, and BG008, refused when over-ticked.
 */
const [bg007, , bg008] = items;

/**
 * The Choice's Root, Control and Label markers, read through the part table.
 */
const slots = {
  control: rowFor("choice-interaction", "control").slot,
  label: rowFor("choice-interaction", "label").slot,
  root: rowFor("choice-interaction", "root").slot,
};

/**
 * A role a Choice's Control maps to.
 */
type ControlRole = "checkbox" | "radio";

/**
 * A Control as the HTML the playground answered presents it: its id, whether it is marked invalid
 * (`aria-invalid="true"`), its value (the choice's identifier), its role, and the accessible name
 * `nameOf` gives it.
 */
interface PresentedControl {
  readonly id: string;
  readonly invalid: boolean;
  readonly name: string;
  readonly role: ControlRole;
  readonly value: string;
}

/**
 * A page's one Choice as its HTML presents it: the group's accessible name (empty when `nameOf`
 * gives none), its Controls in the presented order, and the role they share.
 */
interface Presented {
  readonly controls: readonly PresentedControl[];
  readonly groupName: string;
  readonly role: ControlRole;
}

/**
 * A node of Playwright's computed tree, as `ariaSnapshotJSON` gives it: the role, the name when it
 * has one, the states it carries (`checked` and `invalid` only when set), its one text child as
 * `text`, else its children.
 */
interface SnapshotNode {
  readonly checked?: boolean | "mixed";
  readonly children?: readonly (SnapshotNode | string)[];
  readonly invalid?: boolean | string;
  readonly name?: string;
  readonly role: string;
  readonly text?: string;
}

/**
 * The Schema of a {@link SnapshotNode}; the keys a test does not read are ignored.
 */
const SnapshotNodeSchema: Schema.Codec<SnapshotNode> = Schema.Struct({
  checked: Schema.optionalKey(Schema.Union([Schema.Boolean, Schema.Literal("mixed")])),
  children: Schema.optionalKey(
    Schema.Array(
      Schema.Union([
        Schema.String,
        Schema.suspend((): Schema.Codec<SnapshotNode> => SnapshotNodeSchema),
      ]),
    ),
  ),
  invalid: Schema.optionalKey(Schema.Union([Schema.Boolean, Schema.String])),
  name: Schema.optionalKey(Schema.String),
  role: Schema.String,
  text: Schema.optionalKey(Schema.String),
});

/**
 * Collect every element of a tree, each before its descendants.
 *
 * @param nodes The tree's top-level nodes.
 * @returns The elements in document order.
 */
const elementsOf = (nodes: readonly Node[]): readonly Element[] =>
  nodes.flatMap((node) => (node.kind === "element" ? [node, ...elementsOf(node.children)] : []));

/**
 * Read a page's HTML as one tree, which `nameOf` reads.
 *
 * @param html The HTML the playground answered.
 * @returns The page's nodes under one root.
 */
const treeOf = (html: string): Element => h("body", {}, [...parseHtml(html)]);

/**
 * Read what a page's HTML presents of its one Choice, as the oracle names it.
 *
 * @param tree The page's tree.
 * @returns The Choice's group name and Controls; the test fails unless the page holds exactly one
 *   Choice whose Controls share one role.
 */
const presentedIn = (tree: Element): Presented => {
  const groups = elementsOf([tree]).filter(
    (element) => attribute(element, "data-slot") === slots.root,
  );

  assert.strictEqual(groups.length, 1, "the page holds one Choice");

  const [group] = groups;
  assert.isDefined(group);

  const controls = elementsOf(group.children)
    .filter((element) => attribute(element, "data-slot") === slots.control)
    .map((control): PresentedControl => {
      const type = inputType(control);

      return {
        id: attribute(control, "id") ?? "",
        invalid: attribute(control, "aria-invalid") === "true",
        name: nameOf(control, tree),
        role: type === "checkbox" ? "checkbox" : "radio",
        value: attribute(control, "value") ?? "",
      };
    });
  const roles = new Set(controls.map((control) => control.role));
  const [role] = roles;

  assert.strictEqual(roles.size, 1, "the Choice's Controls share one role");
  assert.isDefined(role);

  return { controls, groupName: nameOf(group, tree), role };
};

/**
 * Open an item page of the playground in a page, and read what its answered HTML presents.
 *
 * @param page The page.
 * @param corpusPath The item's corpus path.
 * @returns What the answered HTML presents of its Choice.
 */
const openItem = Effect.fn("openItem")(function* openItem(page: Page, corpusPath: string) {
  const { origin } = yield* Playground;
  const query = new URLSearchParams({ path: corpusPath }).toString();
  const response = yield* Effect.promise(() => page.goto(`${origin}/item?${query}`));

  assert.isNotNull(response);
  assert.strictEqual(response.status(), 200);

  return presentedIn(treeOf(yield* Effect.promise(() => response.text())));
});

/**
 * Locate an element of the page by its id.
 *
 * @param page The page.
 * @param id The id.
 * @returns The locator.
 */
const byId = (page: Page, id: string): Locator => page.locator(`[id="${id}"]`);

/**
 * Locate the page's one Choice group by its Root marker.
 *
 * @param page The page.
 * @returns The locator.
 */
const groupOf = (page: Page): Locator => page.locator(`[data-slot="${slots.root}"]`);

/**
 * Tick a Control by mouse, as a person does: the Control is hidden from sight by design, so the
 * click lands on its Label.
 *
 * @param page The page.
 * @param control The Control.
 * @returns Once the click is done.
 */
const clickLabel = (page: Page, control: PresentedControl) =>
  Effect.promise(() => page.locator(`[data-slot="${slots.label}"][for="${control.id}"]`).click());

/**
 * Submit the item form by clicking its Submit button, and read the page the post answered.
 *
 * @param page The page.
 * @returns The answered page's tree, once that page has loaded.
 */
const submit = Effect.fn("submit")(function* submit(page: Page) {
  const [response] = yield* Effect.promise(() =>
    Promise.all([
      page.waitForResponse((answer) => answer.request().method() === "POST"),
      page.waitForURL((url) => url.searchParams.has("instance")),
      page.getByRole("button", { exact: true, name: message("en", "submit") }).click(),
    ]),
  );

  return treeOf(yield* Effect.promise(() => response.text()));
});

/**
 * Read an element's node of Playwright's computed tree.
 *
 * @param target The element.
 * @returns Its snapshot node; the test fails unless the snapshot is one node.
 */
const snapshotOf = Effect.fn("snapshotOf")(function* snapshotOf(target: Locator) {
  const nodes = yield* Schema.decodeUnknownEffect(Schema.Array(SnapshotNodeSchema))(
    yield* Effect.promise(() => target.ariaSnapshotJSON()),
  );

  assert.strictEqual(nodes.length, 1, "the snapshot is one node");

  const [node] = nodes;
  assert.isDefined(node);

  return node;
});

/**
 * Collect the descendants of a computed-tree node, each before its own, in child order.
 *
 * @param node The node.
 * @returns Its descendant nodes; text children are left out.
 */
const snapshotDescendants = (node: SnapshotNode): readonly SnapshotNode[] =>
  (node.children ?? []).flatMap((child) =>
    Predicate.isString(child) ? [] : [child, ...snapshotDescendants(child)],
  );

/**
 * Collect the text a computed-tree node and its descendants hold: their names, their single text
 * children and their text fragments.
 *
 * @param node The node.
 * @returns The texts, in tree order.
 */
const snapshotTexts = (node: SnapshotNode): readonly string[] => [
  ...(node.name === undefined ? [] : [node.name]),
  ...(node.text === undefined ? [] : [node.text]),
  ...(node.children ?? []).flatMap((child) =>
    Predicate.isString(child) ? [child] : snapshotTexts(child),
  ),
];

/**
 * Index a Chromium tree's nodes by their `nodeId`.
 *
 * @param nodes The tree's nodes.
 * @returns The index.
 */
const indexOf = (nodes: readonly AxNode[]): ReadonlyMap<string, AxNode> =>
  new Map(nodes.map((node) => [node.nodeId, node]));

/**
 * Collect the descendants of a node of Chromium's tree, each before its own, in child order.
 *
 * @param node The node.
 * @param index Every node of the tree, by `nodeId`.
 * @returns The node's descendants.
 */
const descendantsOf = (node: AxNode, index: ReadonlyMap<string, AxNode>): readonly AxNode[] =>
  node.childIds.flatMap((id) => {
    const child = index.get(id);

    return child === undefined ? [] : [child, ...descendantsOf(child, index)];
  });

/**
 * Find the one node of Chromium's tree, not ignored, with a role and a name.
 *
 * @param nodes The tree's nodes.
 * @param role The role.
 * @param name The name.
 * @returns The node; the test fails unless exactly one matches.
 */
const exposed = (nodes: readonly AxNode[], role: string, name: string): AxNode => {
  const found = nodes.filter((node) => !node.ignored && node.role === role && node.name === name);

  assert.strictEqual(found.length, 1, `Chromium's tree exposes one ${role} named "${name}"`);

  const [node] = found;
  assert.isDefined(node);

  return node;
};

/**
 * Find, in Chromium's tree, the group that holds a Choice's Controls: the nearest ancestor of role
 * `group` of each Control's node, which must be the same for every Control. The group is found by
 * structure, so a group with no name is found too.
 *
 * @param nodes The tree's nodes.
 * @param presented The Choice as its HTML presents it.
 * @returns The group's node.
 */
const exposedGroup = (nodes: readonly AxNode[], presented: Presented): AxNode => {
  const parents = new Map(
    nodes.flatMap((node) => node.childIds.map((child) => [child, node] as const)),
  );
  const groupAbove = (node: AxNode): AxNode | undefined => {
    const parent = parents.get(node.nodeId);

    return parent === undefined || parent.role === "group" ? parent : groupAbove(parent);
  };
  const groups = new Set(
    presented.controls.map((control) => groupAbove(exposed(nodes, presented.role, control.name))),
  );

  assert.strictEqual(groups.size, 1, "every Control sits in one group");

  const [group] = groups;
  assert.isDefined(group, "the Controls sit in a group");

  return group;
};

/**
 * Read a property's value from a node of Chromium's tree.
 *
 * @param node The node.
 * @param property The property's protocol name.
 * @returns Its value, or `undefined` when the node does not carry it.
 */
const valueOf = (node: AxNode, property: string): boolean | number | string | undefined =>
  node.properties.get(property)?.value;

/**
 * List the elements Chromium's tree marks focused: the nodes, not ignored, whose `focused` is
 * true, the document's own node aside. Chromium marks the `RootWebArea` focused too whenever its
 * frame holds focus, beside the element that holds it.
 *
 * @param nodes The tree's nodes.
 * @returns Them, in tree order.
 */
const focusedIn = (nodes: readonly AxNode[]): readonly AxNode[] =>
  nodes.filter(
    (node) => !node.ignored && node.role !== "RootWebArea" && valueOf(node, "focused") === true,
  );

/**
 * Read the correct response of an item's `RESPONSE`, from the item `open` accepted.
 *
 * @param corpusPath The item's corpus path.
 * @returns The correct response's values in their lexical form; the test fails when the item is
 *   not accepted.
 */
const correctOf = Effect.fn("correctOf")(function* correctOf(corpusPath: string) {
  const verdict = yield* openMember(corpusPath);
  if (verdict.verdict === "refused" || verdict.verdict === "unchecked") {
    return assert.fail(`${corpusPath} is ${verdict.verdict}, not accepted`);
  }

  const declaration = verdict.accepted.item.responses.get("RESPONSE");

  return declaration === undefined
    ? []
    : Option.match(declaration.correct, {
        onNone: () => [],
        onSome: (value) => value.values.map(format),
      });
});

/**
 * Describe the element that holds focus, for a failure message.
 *
 * @param page The page.
 * @returns The focused element's id and role, or that nothing is focused.
 */
const focusedElement = Effect.fn("focusedElement")(function* focusedElement(page: Page) {
  const focused = page.locator(":focus");
  if ((yield* Effect.promise(() => focused.count())) === 0) {
    return "nothing is focused";
  }

  const id = yield* Effect.promise(() => focused.first().getAttribute("id"));
  const role = yield* Effect.promise(() => focused.first().getAttribute("role"));

  return `the focused element is id=${id ?? "(none)"} role=${role ?? "(none)"}`;
});

/**
 * Open BG008, tick four of its five choices by their Labels against `max-choices="3"`, submit, and
 * read the page the refused post answered.
 *
 * @param page The page.
 * @returns The answered page's tree, its Choice as that page presents it, and its first refused
 *   Control: the first, in document order, that the answered HTML marks invalid; the test fails
 *   when it marks none.
 */
const overTick = Effect.fn("overTick")(function* overTick(page: Page) {
  const presented = yield* openItem(page, bg008.path);
  const ticked = presented.controls.slice(0, 4);

  assert.strictEqual(ticked.length, 4);

  yield* Effect.forEach(ticked, (control) => clickLabel(page, control), { discard: true });

  const answered = yield* submit(page);
  const choice = presentedIn(answered);
  const refused = choice.controls.find((control) => control.invalid);
  assert.isDefined(refused, "the answered page holds a refused Control");

  return { answered, choice, refused };
});

/**
 * Give the key that moves focus to the next control of any kind in an engine on this platform.
 *
 * WebKit on macOS keeps Safari's split by default: Tab highlights only fields and pop-up menus,
 * and Option+Tab (Alt+Tab) highlights clickable items too, checkboxes and radios among them.
 * Elsewhere Tab reaches every control.
 *
 * @param name The engine.
 * @returns `Alt+Tab` for WebKit on macOS, else `Tab`.
 * @see https://support.apple.com/guide/safari/cpsh003/mac (Safari's keyboard shortcuts: Tab and Option-Tab, and the setting that swaps them)
 */
const nextControlKey = (name: EngineName): string =>
  name === "webkit" && process.platform === "darwin" ? "Alt+Tab" : "Tab";

/**
 * Assert that the page a submit answered opened at its result: the URL's fragment names the
 * Status region, and that region, of role `status` and named by its heading, is the focused
 * element and holds each of the texts, in Playwright's computed tree and, in Chromium, in
 * Chromium's own tree too.
 *
 * @param page The page, after the submit.
 * @param name The engine.
 * @param answered The answered page's tree, which gives the region's id and name.
 * @param texts The texts the region holds.
 * @returns Once every assertion has held.
 */
const assertResultFirst = Effect.fn("assertResultFirst")(function* assertResultFirst(
  page: Page,
  name: EngineName,
  answered: Element,
  texts: readonly string[],
) {
  const regions = elementsOf([answered]).filter(
    (element) => attribute(element, "role") === "status",
  );

  assert.strictEqual(regions.length, 1, "the answered page holds one Status region");

  const [region] = regions;
  assert.isDefined(region);

  const regionId = attribute(region, "id") ?? "";
  const regionName = nameOf(region, answered);

  assert.strictEqual(new URL(page.url()).hash, `#${regionId}`);

  const status = page.getByRole("status", { exact: true, name: regionName });

  assert.strictEqual(yield* Effect.promise(() => status.and(byId(page, regionId)).count()), 1);
  assert.strictEqual(
    yield* Effect.promise(() => status.and(page.locator(":focus")).count()),
    1,
    yield* focusedElement(page),
  );

  const held = snapshotTexts(yield* snapshotOf(status));
  for (const text of texts) {
    assert.include(held, text);
  }

  if (name === "chromium") {
    const nodes = yield* chromiumTree(page, name);
    const own = exposed(nodes, "status", regionName);
    const below = descendantsOf(own, indexOf(nodes)).map((node) => node.name);

    assert.deepStrictEqual(
      focusedIn(nodes).map((node) => node.nodeId),
      [own.nodeId],
    );
    for (const text of texts) {
      assert.include(below, text);
    }
  }
});

/**
 * Name the trees an engine's assertions read, for a test's title.
 *
 * @param name The engine.
 * @returns Chromium's own tree and the computed tree in Chromium; the computed tree only in WebKit.
 */
const treesRead = (name: EngineName): string =>
  name === "chromium"
    ? "Chromium's own tree and Playwright's computed tree"
    : "Playwright's computed tree";

eachEngine((it, name) => {
  it.layer(playgroundLayer({}))("the accessibility tree, Choice", (tree) => {
    for (const item of items) {
      tree.effect(
        `[Q-2] Group names: ${item.label}'s Choice group has role group and the name nameOf gives its fieldset, in ${treesRead(name)}`,
        () =>
          withPage({ javaScriptEnabled: false }, (page) =>
            Effect.gen(function* groupNames() {
              const presented = yield* openItem(page, item.path);
              const group = groupOf(page);
              const node = yield* snapshotOf(group);

              assert.strictEqual(node.role, "group");
              assert.strictEqual(node.name ?? "", presented.groupName);
              if (presented.groupName !== "") {
                assert.strictEqual(
                  yield* Effect.promise(() =>
                    page
                      .getByRole("group", { exact: true, name: presented.groupName })
                      .and(group)
                      .count(),
                  ),
                  1,
                );
              }

              if (name === "chromium") {
                const own = exposedGroup(yield* chromiumTree(page, name), presented);

                assert.strictEqual(own.name, presented.groupName);
                if (presented.groupName !== "") {
                  const queried = yield* axQuery(page, name, {
                    name: presented.groupName,
                    role: "group",
                  });

                  assert.deepStrictEqual(
                    queried
                      .filter((found) => !found.ignored)
                      .map((found) => Option.getOrUndefined(found.backendDOMNodeId)),
                    [Option.getOrUndefined(own.backendDOMNodeId)],
                  );
                }
              }
            }),
          ),
      );

      tree.effect(
        `[Q-2] Controls: each of ${item.label}'s Controls has its role and the name nameOf gives it, unchecked, and checked after a click, in ${treesRead(name)}`,
        () =>
          withPage({ javaScriptEnabled: false }, (page) =>
            Effect.gen(function* controls() {
              const presented = yield* openItem(page, item.path);
              const [target] = presented.controls;
              assert.isDefined(target);

              const checkedOf = (checked: (control: PresentedControl) => boolean) =>
                Effect.all(
                  presented.controls.map((control) =>
                    Effect.promise(() =>
                      page
                        .getByRole(control.role, {
                          checked: checked(control),
                          exact: true,
                          name: control.name,
                        })
                        .and(byId(page, control.id))
                        .count(),
                    ),
                  ),
                );
              const ownChecked = Effect.fn("ownChecked")(function* ownChecked() {
                const nodes = yield* chromiumTree(page, name);

                return presented.controls.map((control) =>
                  valueOf(exposed(nodes, control.role, control.name), "checked"),
                );
              });

              assert.deepStrictEqual(
                yield* checkedOf(() => false),
                presented.controls.map(() => 1),
              );
              if (name === "chromium") {
                assert.deepStrictEqual(
                  yield* ownChecked(),
                  presented.controls.map(() => "false"),
                );
              }

              yield* clickLabel(page, target);

              assert.deepStrictEqual(
                yield* checkedOf((control) => control.id === target.id),
                presented.controls.map(() => 1),
              );
              if (name === "chromium") {
                assert.deepStrictEqual(
                  yield* ownChecked(),
                  presented.controls.map((control) =>
                    control.id === target.id ? "true" : "false",
                  ),
                );
              }
            }),
          ),
      );

      tree.effect(
        `[Q-2] n of N: ${item.label}'s group holds exactly its choices' Controls of that role, in the presented order, in ${treesRead(name)}`,
        () =>
          withPage({ javaScriptEnabled: false }, (page) =>
            Effect.gen(function* nOfN() {
              const presented = yield* openItem(page, item.path);
              const group = groupOf(page);
              const located = yield* Effect.promise(() => group.getByRole(presented.role).all());

              assert.deepStrictEqual(
                yield* Effect.all(
                  located.map((control) => Effect.promise(() => control.getAttribute("id"))),
                ),
                presented.controls.map((control) => control.id),
              );
              assert.deepStrictEqual(
                snapshotDescendants(yield* snapshotOf(group))
                  .filter((node) => node.role === presented.role)
                  .map((node) => node.name ?? ""),
                presented.controls.map((control) => control.name),
              );

              if (name === "chromium") {
                const nodes = yield* chromiumTree(page, name);

                assert.deepStrictEqual(
                  descendantsOf(exposedGroup(nodes, presented), indexOf(nodes))
                    .filter((node) => !node.ignored && node.role === presented.role)
                    .map((node) => node.name),
                  presented.controls.map((control) => control.name),
                );
              }
            }),
          ),
      );
    }

    tree.effect(
      `[Q-2] The result first: BG007 with True, then Submit: the fragment names the Status region, which is focused and holds the score message, in ${treesRead(name)}`,
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* resultFirst() {
            const presented = yield* openItem(page, bg007.path);
            const correct = yield* correctOf(bg007.path);
            const chosen = presented.controls.find((control) => correct.includes(control.value));
            assert.isDefined(chosen, "the correct choice is presented");

            yield* clickLabel(page, chosen);
            yield* assertResultFirst(page, name, yield* submit(page), [
              message("en", "score", { score: "1" }),
            ]);
          }),
        ),
    );

    tree.effect(
      `[Q-2] The refusal message: BG008 with four ticked, then Submit: the first refused Control is invalid and described by the atMost message, in ${treesRead(name)}`,
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* refusalMessage() {
            const { refused } = yield* overTick(page);
            const atMost = message("en", "atMost", { n: "3" });
            const control = byId(page, refused.id);
            const node = yield* snapshotOf(control);

            assert.strictEqual(node.role, refused.role);
            assert.strictEqual(node.name, refused.name);
            assert.strictEqual(node.invalid, true);
            assert.strictEqual(
              yield* Effect.promise(() =>
                page
                  .getByRole(refused.role, { description: atMost, exact: true, name: refused.name })
                  .and(control)
                  .count(),
              ),
              1,
            );

            if (name === "chromium") {
              const own = exposed(yield* chromiumTree(page, name), refused.role, refused.name);

              assert.strictEqual(valueOf(own, "invalid"), "true");
              assert.strictEqual(own.description, atMost);
            }
          }),
        ),
    );

    tree.effect(
      `[Q-2] The refusal message: BG008 with four ticked, then Submit: the Status region is focused and holds Not accepted and the atMost message, and the next control key from it reaches a control of the item before any other part of the page, in ${treesRead(name)}`,
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* refusalFocus() {
            const { answered, choice } = yield* overTick(page);

            yield* assertResultFirst(page, name, answered, [
              message("en", "notAccepted"),
              message("en", "atMost", { n: "3" }),
            ]);
            yield* Effect.promise(() => page.keyboard.press(nextControlKey(name)));

            const itemControls = page.locator(
              choice.controls.map((control) => `[id="${control.id}"]`).join(", "),
            );

            assert.strictEqual(
              yield* Effect.promise(() => itemControls.and(page.locator(":focus")).count()),
              1,
              yield* focusedElement(page),
            );

            if (name === "chromium") {
              const focused = focusedIn(yield* chromiumTree(page, name));

              assert.deepStrictEqual(
                focused.map((node) => node.role),
                [choice.role],
              );

              const [reached] = focused;
              assert.isDefined(reached);
              assert.include(
                choice.controls.map((control) => control.name),
                reached.name,
              );
            }
          }),
        ),
    );
  });
});

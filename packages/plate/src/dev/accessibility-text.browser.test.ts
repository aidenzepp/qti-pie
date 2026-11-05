import { assert } from "@effect/vitest";
import { ConfigProvider, Effect, Layer, Option, Predicate, Schema } from "effect";
import type { Locator, Page } from "playwright-core";
import { configure } from "#plate/configuration.ts";
import { openMember } from "#plate/dev/listing.ts";
import { h } from "#plate/emit/node.ts";
import type { Element, Node } from "#plate/emit/node.ts";
import { rowFor } from "#plate/emit/parts.ts";
import { patternMessage } from "#plate/interactions/pattern.ts";
import { message } from "#plate/messages.ts";
import { interactionsIn } from "#plate/model/interactions.ts";
import { format } from "#plate/model/values.ts";
import { attribute, nameOf } from "#plate/test/accessibility.ts";
import { axQuery, chromiumTree } from "#plate/test/ax-tree.ts";
import type { AxNode } from "#plate/test/ax-tree.ts";
import {
  Playground,
  WalkCorpus,
  eachEngine,
  playgroundLayer,
  walkCorpusLayer,
  withPage,
} from "#plate/test/browsers.ts";
import type { EngineName } from "#plate/test/browsers.ts";
import { parseHtml } from "#plate/test/round-trip.ts";

/**
 * The corpus items whose text Controls the tests read: BG010's one Text Entry, in a line of a
 * quotation and named by no author; BG011's one Extended Text, with no Prompt; and the postcard's
 * ten Extended Texts, each named by its Prompt, in the `plain` and `xhtml` formats.
 */
const corpusItems = [
  { label: "BG010", path: "QTI3_BPIG_Examples/items/BG010.xml", tags: "[Q-20]" },
  { label: "BG011", path: "QTI3_BeginnersGuide_Examples/items/BG011.xml", tags: "[Q-5]" },
  {
    label: "the postcard",
    path: "qtiv3-examples/items/shared-vocabulary/Items/Item_QTI3_WritingPostcard_02/extended_text_qti3.xml",
    tags: "[Q-5]",
  },
] as const;

/**
 * The walk corpus's text items: `ordered.xml`, an Extended Text bound to an `ordered` response
 * with `max-strings="3"` under a Prompt, so a group of three Controls; and `pattern.xml`, a Text
 * Entry with a `pattern-mask` and the author's `data-patternmask-message`.
 */
const walkItems = [
  { label: "ordered.xml", path: "ordered.xml", tags: "[Q-5]" },
  { label: "pattern.xml", path: "pattern.xml", tags: "[Q-20]" },
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
 * A node of Playwright's computed tree, as `ariaSnapshotJSON` gives it: the role, the name when it
 * has one, `invalid` only when set, its one text child as `text`, else its children.
 */
interface SnapshotNode {
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
 * @returns The Controls; the test fails unless the page holds at least one.
 */
const openItem = Effect.fn("openItem")(function* openItem(page: Page, corpusPath: string) {
  const { origin } = yield* Playground;
  const query = new URLSearchParams({ path: corpusPath }).toString();
  const response = yield* Effect.promise(() => page.goto(`${origin}/item?${query}`));

  assert.isNotNull(response);
  assert.strictEqual(response.status(), 200);

  const tree = treeOf(yield* Effect.promise(() => response.text()));
  const controls = controlsIn(tree, tree);

  assert.isAbove(controls.length, 0, `${corpusPath} presents a text Control`);

  return { controls, tree };
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
 * Read a name of Chromium's tree as the flat string AccName defines, its whitespace runs one space
 * and its ends trimmed, as `nameOf` and Playwright's computed tree give it. Chromium keeps a space
 * its own join produced at an end: a Prompt whose text starts with `<br/>`, as each of the
 * postcard's does, names its Control " Demonstrates …" there, the same tokens.
 *
 * @param name The name as Chromium computed it.
 * @returns The flat name.
 * @see https://w3c.github.io/accname/#terminology (flat string)
 */
const flat = (name: string): string => name.replaceAll(/[\t\n\f\r ]+/gu, " ").trim();

/**
 * Find the one node of Chromium's tree, not ignored, with a role and a name, its name read
 * {@link flat}.
 *
 * @param nodes The tree's nodes.
 * @param role The role.
 * @param name The name.
 * @returns The node; the test fails unless exactly one matches.
 */
const exposed = (nodes: readonly AxNode[], role: string, name: string): AxNode => {
  const found = nodes.filter(
    (node) => !node.ignored && node.role === role && flat(node.name) === name,
  );

  assert.strictEqual(found.length, 1, `Chromium's tree exposes one ${role} named "${name}"`);

  const [node] = found;
  assert.isDefined(node);

  return node;
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
 * Give the message `pattern.xml`'s Text Entry shows for the mismatching entry, as the renderer's
 * own check gives it under `validateResponses`, and confirm it is the author's
 * `data-patternmask-message`.
 *
 * @returns The message; the test fails unless the item is accepted, holds one Text Entry with a
 *   `data-patternmask-message`, and its check gives that message for the entry.
 */
const authoredPatternMessage = Effect.fn("authoredPatternMessage")(
  function* authoredPatternMessage() {
    const { directory } = yield* WalkCorpus;
    const verdict = yield* openMember(pattern.path).pipe(
      Effect.provide(
        ConfigProvider.layer(ConfigProvider.fromUnknown({ PLATE_CORPUS_DIR: directory })),
      ),
    );
    if (verdict.verdict === "refused" || verdict.verdict === "unchecked") {
      return assert.fail(`${pattern.path} is ${verdict.verdict}, not accepted`);
    }

    const entries = interactionsIn(verdict.accepted.item.body).filter(
      (interaction) => interaction.kind === "text-entry",
    );
    assert.strictEqual(entries.length, 1, `${pattern.path} holds one Text Entry`);

    const [entry] = entries;
    assert.isDefined(entry);

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

  const answered = yield* submit(page);
  const answeredControls = controlsIn(answered, answered);
  const refused = answeredControls.find((control) => control.invalid);
  assert.isDefined(refused, "the answered page holds a refused Control");

  return { answered, controls: answeredControls, refused };
});

/**
 * Give the key that moves focus to the next control of any kind in an engine on this platform.
 *
 * WebKit on macOS keeps Safari's split by default: Tab highlights only fields and pop-up menus,
 * and Option+Tab (Alt+Tab) highlights clickable items too. Elsewhere Tab reaches every control.
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
    const below = descendantsOf(own, indexOf(nodes)).map((node) => flat(node.name));

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
        const own = exposed(nodes, "textbox", control.name);

        return { multiline: valueOf(own, "multiline") === true, name: flat(own.name) };
      }),
      controls.map((control) => ({ multiline: control.multiline, name: control.name })),
    );
  }
});

/**
 * A playground over the walk corpus with `validateResponses` on, so a post's entry is checked
 * against its `pattern-mask`.
 */
const walkPlayground = Layer.unwrap(
  Effect.gen(function* overWalk() {
    const { directory } = yield* WalkCorpus;

    return playgroundLayer({
      configuration: { validateResponses: true },
      provider: ConfigProvider.fromUnknown({ PLATE_CORPUS_DIR: directory }),
    });
  }),
);

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

            const [correct] = yield* correctOf(bg010.path);
            assert.isDefined(correct, "BG010 declares a correct response");

            yield* typeInto(page, entry, correct);
            yield* assertResultFirst(page, name, yield* submit(page), [
              message("en", "score", { score: "1" }),
            ]);
          }),
        ),
    );
  });

  it.layer(walkCorpusLayer)("the accessibility tree, text, over the walk corpus", (walk) => {
    walk.layer(walkPlayground)((tree) => {
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
                const own = exposed(nodes, "group", groupName);
                const queried = yield* axQuery(page, name, { name: groupName, role: "group" });

                assert.deepStrictEqual(
                  queried
                    .filter((found) => !found.ignored)
                    .map((found) => Option.getOrUndefined(found.backendDOMNodeId)),
                  [Option.getOrUndefined(own.backendDOMNodeId)],
                );
                assert.deepStrictEqual(
                  descendantsOf(own, indexOf(nodes))
                    .filter((descendant) => !descendant.ignored && descendant.role === "textbox")
                    .map((descendant) => flat(descendant.name)),
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
                const own = exposed(yield* chromiumTree(page, name), "textbox", refused.name);

                assert.strictEqual(valueOf(own, "invalid"), "true");
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
              const authored = yield* authoredPatternMessage();
              const { answered, controls } = yield* mismatch(page);

              yield* assertResultFirst(page, name, answered, [
                message("en", "notAccepted"),
                authored,
              ]);
              yield* Effect.promise(() => page.keyboard.press(nextControlKey(name)));

              const itemControls = page.locator(
                controls.map((control) => `[id="${control.id}"]`).join(", "),
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
                  ["textbox"],
                );

                const [reached] = focused;
                assert.isDefined(reached);
                assert.include(
                  controls.map((control) => control.name),
                  flat(reached.name),
                );
              }
            }),
          ),
      );
    });
  });
});

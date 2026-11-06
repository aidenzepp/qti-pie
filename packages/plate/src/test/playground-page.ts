/**
 * Reading and driving the dev playground's pages in a browser test: the HTML a page answered, read
 * as a tree; the item page's form, its Controls and the item's correct response; the presses of
 * the next-control key and the stops they make; the submit and the Status region it answers with;
 * and the item as Playwright's computed tree and Chromium's own tree expose it.
 *
 * Expected values come from the code, not copies: accessible names from `nameOf`, tab orders from
 * `tabOrder`, messages from `message`. A helper that finds what a test needs fails the test
 * through `assert` when it is not there.
 *
 * Test support: only browser test files import it.
 */
import { assert } from "@effect/vitest";
import type { Locator, Page } from "playwright-core";
import { ConfigProvider, Effect, Option, Predicate, Schema } from "effect";
import { openMember } from "#plate/dev/listing.ts";
import { h } from "#plate/emit/node.ts";
import type { Element, Node } from "#plate/emit/node.ts";
import { message } from "#plate/messages.ts";
import { interactionsIn } from "#plate/model/interactions.ts";
import { format } from "#plate/model/values.ts";
import { attribute, nameOf } from "#plate/test/accessibility.ts";
import { byNodeId, chromiumTree, descendantsOf, flatName, focusedIn } from "#plate/test/ax-tree.ts";
import type { AxNode } from "#plate/test/ax-tree.ts";
import { Playground, WalkCorpus } from "#plate/test/browsers.ts";
import type { EngineName } from "#plate/test/browsers.ts";
import { tabOrder } from "#plate/test/keyboard.ts";
import { parseHtml } from "#plate/test/round-trip.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";

/**
 * Collect every element of a tree, each before its descendants.
 *
 * @param nodes The tree's top-level nodes.
 * @returns The elements in document order.
 */
export const elementsOf = (nodes: readonly Node[]): readonly Element[] =>
  nodes.flatMap((node) => (node.kind === "element" ? [node, ...elementsOf(node.children)] : []));

/**
 * Read a page's HTML as one tree, which `nameOf` and `tabOrder` read.
 *
 * @param html The HTML the playground answered.
 * @returns The page's nodes under one root.
 */
export const treeOf = (html: string): Element => h("body", {}, [...parseHtml(html)]);

/**
 * Give the target of the item page for a corpus path.
 *
 * @param corpusPath The document's path in the playground's corpus.
 * @returns `/item?path=…`.
 */
export const itemTarget = (corpusPath: string): string =>
  `/item?${new URLSearchParams({ path: corpusPath }).toString()}`;

/**
 * Open an item page of the {@link Playground} in a page, and read the HTML it answered as a tree.
 *
 * @param page The page.
 * @param corpusPath The item's path in the playground's corpus.
 * @returns The page's tree ({@link treeOf}); the test fails unless the page answered 200.
 */
export const openItem = Effect.fn("openItem")(function* openItem(page: Page, corpusPath: string) {
  const { origin } = yield* Playground;
  const response = yield* Effect.promise(() => page.goto(`${origin}${itemTarget(corpusPath)}`));

  assert.isNotNull(response);
  assert.strictEqual(response.status(), 200, corpusPath);

  return treeOf(yield* Effect.promise(() => response.text()));
});

/**
 * Find the item form of an item page: the form whose `action` posts to the item page.
 *
 * @param tree The item page's tree.
 * @returns The form; the test fails when the page has none.
 */
export const itemFormOf = (tree: Element): Element =>
  elementsOf([tree]).find(
    (element) =>
      element.tag === "form" && (attribute(element, "action") ?? "").startsWith("/item?"),
  ) ?? assert.fail("the item page has an item form");

/**
 * Read the instance token the item form posts under, from its `action`.
 *
 * @param tree The item page's tree.
 * @returns The token; the test fails when the action names none.
 */
export const instanceOf = (tree: Element): string =>
  new URL(
    attribute(itemFormOf(tree), "action") ?? "",
    "http://playground.invalid",
  ).searchParams.get("instance") ?? assert.fail("the item form's action names its instance");

/**
 * Identify an element as the tab-order comparison matches it: by its `id`, else by its `name` and
 * `value`, an attribute that is missing reading as empty.
 *
 * @param attributes The element's `id`, `name` and `value`.
 * @param attributes.id The `id`.
 * @param attributes.name The `name`.
 * @param attributes.value The `value`.
 * @returns The key.
 */
export const keyOf = (attributes: {
  readonly id: string | null | undefined;
  readonly name: string | null | undefined;
  readonly value: string | null | undefined;
}): string =>
  attributes.id !== null && attributes.id !== undefined && attributes.id !== ""
    ? `id=${attributes.id}`
    : `name=${attributes.name ?? ""} value=${attributes.value ?? ""}`;

/**
 * List the keys of the item form's tab stops, in the order the Node walk's `tabOrder` gives for
 * the whole page.
 *
 * @param tree The item page's tree.
 * @returns Each stop's key, {@link keyOf}'s, from the form's first control to its Submit.
 */
export const formStops = (tree: Element): readonly string[] => {
  const inForm = new Set(elementsOf([itemFormOf(tree)]));

  return tabOrder(tree)
    .filter((element) => inForm.has(element))
    .map((element) =>
      keyOf({
        id: attribute(element, "id"),
        name: attribute(element, "name"),
        value: attribute(element, "value"),
      }),
    );
};

/**
 * A choice as the page presents it: its identifier, which its Control posts as its value, and the
 * accessible name `nameOf` gives its Control.
 */
export interface Choice {
  readonly identifier: string;
  readonly name: string;
}

/**
 * List the choices of one response's interaction, in the order the page presents them.
 *
 * @param tree The item page's tree.
 * @param entry The entry name the response's Controls post under.
 * @returns Each Control's value and accessible name, in document order.
 */
export const choicesOf = (tree: Element, entry: string): readonly Choice[] =>
  elementsOf([tree])
    .filter((element) => element.tag === "input" && attribute(element, "name") === entry)
    .map((control) => ({
      identifier: attribute(control, "value") ?? "",
      name: nameOf(control, tree),
    }));

/**
 * Locate a choice's Control by its role and accessible name, among the Controls of one response.
 *
 * @param page The page.
 * @param role The Control's role.
 * @param entry The entry name the response's Controls post under.
 * @param choice The choice.
 * @returns The locator.
 */
export const control = (
  page: Page,
  role: "checkbox" | "radio",
  entry: string,
  choice: Choice,
): Locator =>
  page.getByRole(role, { exact: true, name: choice.name }).and(page.locator(`[name="${entry}"]`));

/**
 * Read the correct response of one response declaration of a corpus item, from the item `open`
 * accepted.
 *
 * @param corpusPath The item's corpus path.
 * @param response The response's identifier.
 * @returns The correct response's values in their lexical form; the test fails when the item is
 *   not accepted.
 */
export const correctOf = Effect.fn("correctOf")(function* correctOf(
  corpusPath: string,
  response: string,
) {
  const verdict = yield* openMember(corpusPath);
  const accepted = acceptedItem(verdict);
  if (Option.isNone(accepted)) {
    return assert.fail(`${corpusPath} is ${verdict.verdict}, not accepted`);
  }

  const declaration = accepted.value.item.responses.get(response);

  return declaration === undefined
    ? []
    : Option.match(declaration.correct, {
        onNone: () => [],
        onSome: (value) => value.values.map(format),
      });
});

/**
 * Open a probe of the {@link WalkCorpus} and list its interactions, from the item `open` accepted.
 *
 * @param member The probe's path in the walk corpus.
 * @returns The item's interactions in document order; the test fails when the probe is not
 *   accepted.
 */
const probeInteractions = Effect.fn("probeInteractions")(function* probeInteractions(
  member: string,
) {
  const { directory } = yield* WalkCorpus;
  const verdict = yield* openMember(member).pipe(
    Effect.provide(
      ConfigProvider.layer(ConfigProvider.fromUnknown({ PLATE_CORPUS_DIR: directory })),
    ),
  );
  const accepted = acceptedItem(verdict);
  if (Option.isNone(accepted)) {
    return assert.fail(`${member} is ${verdict.verdict}, not accepted`);
  }

  return interactionsIn(accepted.value.item.body);
});

/**
 * Open a probe of the {@link WalkCorpus} and find its one Text Entry, from the item `open`
 * accepted.
 *
 * @param member The probe's path in the walk corpus.
 * @returns The Text Entry; the test fails when the probe is not accepted or holds another count.
 */
export const textEntryOf = Effect.fn("textEntryOf")(function* textEntryOf(member: string) {
  const entries = (yield* probeInteractions(member)).flatMap((interaction) =>
    interaction.kind === "text-entry" ? [interaction] : [],
  );
  const [entry] = entries;

  assert.strictEqual(entries.length, 1, `${member} holds one Text Entry`);
  assert.isDefined(entry);

  return entry;
});

/**
 * Open a probe of the {@link WalkCorpus} and find its one Inline Choice bound to a response, from
 * the item `open` accepted.
 *
 * @param member The probe's path in the walk corpus.
 * @param response The response identifier the Inline Choice binds.
 * @returns The Inline Choice; the test fails when the probe is not accepted or holds another count
 *   bound to the response.
 */
export const inlineChoiceOf = Effect.fn("inlineChoiceOf")(function* inlineChoiceOf(
  member: string,
  response: string,
) {
  const choices = (yield* probeInteractions(member)).flatMap((interaction) =>
    interaction.kind === "inline-choice" && interaction.response === response ? [interaction] : [],
  );
  const [choice] = choices;

  assert.strictEqual(choices.length, 1, `${member} holds one Inline Choice bound to ${response}`);
  assert.isDefined(choice);

  return choice;
});

/**
 * Locate an element of the page by its id.
 *
 * @param page The page.
 * @param id The id.
 * @returns The locator.
 */
export const byId = (page: Page, id: string): Locator => page.locator(`[id="${id}"]`);

/**
 * Locate the item form's Submit button by its role and name.
 *
 * @param page The page.
 * @returns The locator.
 */
export const submitButton = (page: Page): Locator =>
  page.getByRole("button", { exact: true, name: message("en", "submit") });

/**
 * Submit the item form and wait for the page that answers the post, whose URL names the instance.
 *
 * @param page The page.
 * @param act The click or key press that submits.
 * @returns Once the answering page has loaded.
 */
export const submitWith = (page: Page, act: () => Promise<void>) =>
  Effect.promise(() =>
    Promise.all([page.waitForURL((url) => url.searchParams.has("instance")), act()]),
  );

/**
 * Submit the item form by a key press on the focused element, and wait for the answering page.
 *
 * @param page The page.
 * @param key The key that submits.
 * @returns Once the answering page has loaded.
 */
export const submitBy = (page: Page, key: string) =>
  submitWith(page, () => page.keyboard.press(key));

/**
 * Submit the item form by clicking its Submit button, and read the page the post answered.
 *
 * @param page The page.
 * @returns The answered page's tree, once that page has loaded.
 */
export const submitRead = Effect.fn("submitRead")(function* submitRead(page: Page) {
  const [response] = yield* Effect.promise(() =>
    Promise.all([
      page.waitForResponse((answer) => answer.request().method() === "POST"),
      page.waitForURL((url) => url.searchParams.has("instance")),
      submitButton(page).click(),
    ]),
  );

  return treeOf(yield* Effect.promise(() => response.text()));
});

/**
 * Count the elements a locator matches.
 *
 * @param locator The locator.
 * @returns How many elements it matches now.
 */
export const count = (locator: Locator) => Effect.promise(() => locator.count());

/**
 * Count the elements of the Status region whose text is exactly the given text.
 *
 * @param page The page after a submit.
 * @param text The text.
 * @returns How many elements of the region, read through its role `status`, hold it.
 */
export const inStatus = (page: Page, text: string) =>
  count(page.getByRole("status").getByText(text, { exact: true }));

/**
 * Whether the element a locator matches holds keyboard focus.
 *
 * @param page The page.
 * @param target The locator.
 * @returns Whether a focused element is among its matches.
 */
export const isFocused = Effect.fn("isFocused")(function* isFocused(page: Page, target: Locator) {
  return (yield* count(target.and(page.locator(":focus")))) > 0;
});

/**
 * Press a key on the page's keyboard.
 *
 * @param page The page.
 * @param key The key, as Playwright names it.
 * @returns Once the key is up.
 */
export const press = (page: Page, key: string) => Effect.promise(() => page.keyboard.press(key));

/**
 * Press the next-control key until the focused element is one the target matches.
 *
 * @param page The page.
 * @param key The key, `nextControlKey`'s.
 * @param target The elements to reach.
 * @param most The most presses to make before the test fails.
 * @returns How many presses it took.
 */
export const tabUntil = Effect.fn("tabUntil")(function* tabUntil(
  page: Page,
  key: string,
  target: Locator,
  most: number,
) {
  for (let pressed = 1; pressed <= most; pressed += 1) {
    yield* press(page, key);
    if (yield* isFocused(page, target)) {
      return pressed;
    }
  }

  return assert.fail(`${String(most)} presses of ${key} never reached the target`);
});

/**
 * Where one press of the next-control key left focus, as the page in the browser holds it.
 */
export interface Stop {
  /**
   * Whether the focused element is in the item form.
   */
  readonly inForm: boolean;
  /**
   * The focused element's key, {@link keyOf}'s, empty when nothing is focused.
   */
  readonly key: string;
  /**
   * Whether the focused element is a link.
   */
  readonly link: boolean;
  /**
   * Whether the focused element is a `video` or `audio` that shows the engine's native controls,
   * which take stops of their own inside it.
   */
  readonly media: boolean;
  /**
   * Whether the focused element is the item form's Submit button.
   */
  readonly submit: boolean;
}

/**
 * Write a script expression over the page's active element, `document.activeElement`, which is
 * the media element itself while focus is inside its native controls.
 *
 * @param expression The expression, which reads the element as `active`, never null there.
 * @returns The script, which gives the expression's value, or null when nothing is active.
 */
const onActive = (expression: string): string =>
  `(() => { const active = document.activeElement; return active === null ? null : ${expression}; })()`;

/**
 * Whether the page's active element meets a condition.
 *
 * @param page The page.
 * @param condition The condition, a script expression over `active`.
 * @returns Whether it gives `true`; false when nothing is active.
 */
const activeHolds = (page: Page, condition: string) =>
  Effect.promise(async () => (await page.evaluate(onActive(condition))) === true);

/**
 * Read an attribute of the page's active element.
 *
 * @param page The page.
 * @param name The attribute.
 * @returns Its value, or null when the element does not carry it or nothing is active.
 */
const activeAttribute = (page: Page, name: "id" | "name" | "value") =>
  Effect.promise(async () => {
    const read: unknown = await page.evaluate(
      onActive(`active.getAttribute(${JSON.stringify(name)})`),
    );

    return Predicate.isString(read) ? read : null;
  });

/**
 * Read where focus is, as a {@link Stop}.
 *
 * Inside a media element's native controls, Chromium keeps focus in the element's user-agent
 * shadow tree, where `:focus` matches no element of the document; the stop is then read from the
 * active element, the media element itself.
 *
 * @param page The page.
 * @returns The focused element's key and what it is; an empty key when nothing is focused.
 */
export const focusedStop = Effect.fn("focusedStop")(function* focusedStop(page: Page) {
  const media = yield* activeHolds(
    page,
    `(active.localName === "video" || active.localName === "audio") && active.hasAttribute("controls")`,
  );
  const focused = page.locator(":focus");
  if ((yield* count(focused)) === 0) {
    return media
      ? ({
          inForm: yield* activeHolds(page, `active.closest('form[action^="/item?"]') !== null`),
          key: keyOf({
            id: yield* activeAttribute(page, "id"),
            name: yield* activeAttribute(page, "name"),
            value: yield* activeAttribute(page, "value"),
          }),
          link: false,
          media,
          submit: false,
        } satisfies Stop)
      : ({ inForm: false, key: "", link: false, media, submit: false } satisfies Stop);
  }

  const read = (name: string) => Effect.promise(() => focused.getAttribute(name));

  return {
    inForm: (yield* count(page.locator('form[action^="/item?"] :focus'))) > 0,
    key: keyOf({ id: yield* read("id"), name: yield* read("name"), value: yield* read("value") }),
    link: (yield* count(page.locator("a:focus"))) > 0,
    media,
    submit: yield* isFocused(page, submitButton(page)),
  } satisfies Stop;
});

/**
 * Read the stops as the elements Tab visits: a run of stops on one media element, the element and
 * then its native controls, is one visit to that element, as the Node walk lists it.
 *
 * Chromium stops on a `video` with controls and then on each of its controls; WebKit stops on it
 * twice. The Node walk models the document, where the controls are not elements. The controls are
 * the browser's, not the author's or plate's markup, so the run counts once.
 *
 * @param stops The stops, in the order the presses reached them.
 * @returns The stops with each run on one media element kept as its first.
 */
export const elementStops = (stops: readonly Stop[]): readonly Stop[] =>
  stops.filter((stop, index) => {
    const previous = stops[index - 1];

    return !(stop.media && previous?.media === true && previous.key === stop.key);
  });

/**
 * Press the next-control key from the page's start until focus reaches the item form's Submit,
 * reading each stop.
 *
 * @param page The page, freshly loaded, with nothing focused.
 * @param key The key, `nextControlKey`'s.
 * @param most The most presses to make before the test fails.
 * @returns Every stop, in the order the presses reached them, the Submit last.
 */
export const stopsToSubmit = Effect.fn("stopsToSubmit")(function* stopsToSubmit(
  page: Page,
  key: string,
  most: number,
) {
  const stops: Stop[] = [];
  for (let pressed = 1; pressed <= most; pressed += 1) {
    yield* press(page, key);

    const stop = yield* focusedStop(page);
    stops.push(stop);
    if (stop.submit) {
      return stops;
    }
  }

  return assert.fail(`${String(most)} presses of ${key} never reached the item form's Submit`);
});

/**
 * Describe the element that holds focus, for a failure message.
 *
 * @param page The page.
 * @returns The focused element's id and role, or that nothing is focused.
 */
export const focusedElement = Effect.fn("focusedElement")(function* focusedElement(page: Page) {
  const focused = page.locator(":focus");
  if ((yield* count(focused)) === 0) {
    return "nothing is focused";
  }

  const id = yield* Effect.promise(() => focused.first().getAttribute("id"));
  const role = yield* Effect.promise(() => focused.first().getAttribute("role"));

  return `the focused element is id=${id ?? "(none)"} role=${role ?? "(none)"}`;
});

/**
 * A node of Playwright's computed tree, as `ariaSnapshotJSON` gives it: the role, the name when it
 * has one, the states it carries (`checked` and `invalid` only when set), its one text child as
 * `text`, else its children.
 */
export interface SnapshotNode {
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
 * Read an element's node of Playwright's computed tree.
 *
 * @param target The element.
 * @returns Its snapshot node; the test fails unless the snapshot is one node.
 */
export const snapshotOf = Effect.fn("snapshotOf")(function* snapshotOf(target: Locator) {
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
export const snapshotDescendants = (node: SnapshotNode): readonly SnapshotNode[] =>
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
export const snapshotTexts = (node: SnapshotNode): readonly string[] => [
  ...(node.name === undefined ? [] : [node.name]),
  ...(node.text === undefined ? [] : [node.text]),
  ...(node.children ?? []).flatMap((child) =>
    Predicate.isString(child) ? [child] : snapshotTexts(child),
  ),
];

/**
 * How a test reads the names of Chromium's tree: as Chromium computed them, or as AccName's flat
 * strings ({@link flatName}), for a page whose markup leaves a space at a name's end.
 */
export type ChromiumNames = "computed" | "flat";

/**
 * Read a node's name of Chromium's tree as a test compares it.
 *
 * @param node The node.
 * @param names How the test reads names.
 * @returns The name.
 */
export const chromiumName = (node: AxNode, names: ChromiumNames): string =>
  names === "flat" ? flatName(node.name) : node.name;

/**
 * Find the one node of Chromium's tree, not ignored, with a role and a name.
 *
 * @param nodes The tree's nodes.
 * @param role The role.
 * @param name The name.
 * @param names How a node's name is read: as computed by default, or flat.
 * @returns The node; the test fails unless exactly one matches.
 */
export const exposed = (
  nodes: readonly AxNode[],
  role: string,
  name: string,
  names: ChromiumNames = "computed",
): AxNode => {
  const found = nodes.filter(
    (node) => !node.ignored && node.role === role && chromiumName(node, names) === name,
  );

  assert.strictEqual(found.length, 1, `Chromium's tree exposes one ${role} named "${name}"`);

  const [node] = found;
  assert.isDefined(node);

  return node;
};

/**
 * Assert that the page a submit answered opened at its result: the URL's fragment names the
 * Status region, and that region, of role `status` and named by its heading, is the focused
 * element and holds each of the texts, in Playwright's computed tree and, in Chromium, in
 * Chromium's own tree too.
 *
 * @param page The page, after the submit.
 * @param engine The engine.
 * @param answered The answered page's tree, which gives the region's id and name.
 * @param texts The texts the region holds.
 * @param names How Chromium's names are read: as computed by default, or flat.
 * @returns Once every assertion has held.
 */
export const assertResultFirst = Effect.fn("assertResultFirst")(function* assertResultFirst(
  page: Page,
  engine: EngineName,
  answered: Element,
  texts: readonly string[],
  names: ChromiumNames = "computed",
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

  assert.strictEqual(yield* count(status.and(byId(page, regionId))), 1);
  assert.strictEqual(
    yield* count(status.and(page.locator(":focus"))),
    1,
    yield* focusedElement(page),
  );

  const held = snapshotTexts(yield* snapshotOf(status));
  for (const text of texts) {
    assert.include(held, text);
  }

  if (engine === "chromium") {
    const nodes = yield* chromiumTree(page, engine);
    const own = exposed(nodes, "status", regionName, names);
    const below = descendantsOf(own, byNodeId(nodes)).map((node) => chromiumName(node, names));

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
 * Name the trees an engine's accessibility assertions read, for a test's title.
 *
 * @param engine The engine.
 * @returns Chromium's own tree and the computed tree in Chromium; the computed tree only in WebKit.
 */
export const treesRead = (engine: EngineName): string =>
  engine === "chromium"
    ? "Chromium's own tree and Playwright's computed tree"
    : "Playwright's computed tree";

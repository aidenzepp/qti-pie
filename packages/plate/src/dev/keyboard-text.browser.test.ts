import { assert } from "@effect/vitest";
import { ConfigProvider, Effect, Layer, Option, Predicate } from "effect";
import type { Locator, Page } from "playwright-core";
import { openMember } from "#plate/dev/listing.ts";
import { h } from "#plate/emit/node.ts";
import type { Element, Node } from "#plate/emit/node.ts";
import { entryName } from "#plate/form/encoding.ts";
import { message } from "#plate/messages.ts";
import { interactionsIn } from "#plate/model/interactions.ts";
import { attribute } from "#plate/test/accessibility.ts";
import {
  Playground,
  WalkCorpus,
  eachEngine,
  playgroundLayer,
  walkCorpusLayer,
  withPage,
} from "#plate/test/browsers.ts";
import type { EngineName } from "#plate/test/browsers.ts";
import { tabOrder } from "#plate/test/keyboard.ts";
import { parseHtml } from "#plate/test/round-trip.ts";

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
 * Where one press of the next-control key left focus, as the page in the browser holds it.
 */
interface Stop {
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
 * Collect every element of a tree, each before its descendants.
 *
 * @param nodes The tree's top-level nodes.
 * @returns The elements in document order.
 */
const elementsOf = (nodes: readonly Node[]): readonly Element[] =>
  nodes.flatMap((node) => (node.kind === "element" ? [node, ...elementsOf(node.children)] : []));

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
const keyOf = (attributes: {
  readonly id: string | null | undefined;
  readonly name: string | null | undefined;
  readonly value: string | null | undefined;
}): string =>
  attributes.id !== null && attributes.id !== undefined && attributes.id !== ""
    ? `id=${attributes.id}`
    : `name=${attributes.name ?? ""} value=${attributes.value ?? ""}`;

/**
 * Open an item page of the playground in a page, and read the HTML it answered as a tree.
 *
 * @param page The page.
 * @param corpusPath The item's path in the playground's corpus.
 * @returns The page's nodes under one root, which `tabOrder` reads.
 */
const openItem = Effect.fn("openItem")(function* openItem(page: Page, corpusPath: string) {
  const { origin } = yield* Playground;
  const query = new URLSearchParams({ path: corpusPath }).toString();
  const response = yield* Effect.promise(() => page.goto(`${origin}/item?${query}`));

  assert.isNotNull(response);
  assert.strictEqual(response.status(), 200, corpusPath);

  return h("body", {}, [...parseHtml(yield* Effect.promise(() => response.text()))]);
});

/**
 * Whether a form's `action` posts to the item page, which makes it the item form.
 *
 * @param action The form's `action`.
 * @returns Whether it names `/item`.
 */
const isItemAction = (action: string): boolean => action.startsWith("/item?");

/**
 * Find the item form of an item page.
 *
 * @param tree The item page's tree.
 * @returns The form; the test fails when the page has none.
 */
const itemFormOf = (tree: Element): Element =>
  elementsOf([tree]).find(
    (element) => element.tag === "form" && isItemAction(attribute(element, "action") ?? ""),
  ) ?? assert.fail("the item page has an item form");

/**
 * Read the instance token the item form posts under, from its `action`.
 *
 * @param tree The item page's tree.
 * @returns The token; the test fails when the action names none.
 */
const instanceOf = (tree: Element): string =>
  new URL(
    attribute(itemFormOf(tree), "action") ?? "",
    "http://playground.invalid",
  ).searchParams.get("instance") ?? assert.fail("the item form's action names its instance");

/**
 * List the keys of the item form's tab stops, in the order the Node walk's `tabOrder` gives for
 * the whole page.
 *
 * @param tree The item page's tree.
 * @returns Each stop's key, {@link keyOf}'s, from the form's first control to its Submit.
 */
const formStops = (tree: Element): readonly string[] => {
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
 * List the item form's textareas, in document order.
 *
 * @param tree The item page's tree.
 * @returns The textareas.
 */
const textareasOf = (tree: Element): readonly Element[] =>
  elementsOf([itemFormOf(tree)]).filter((element) => element.tag === "textarea");

/**
 * Open a walk-corpus probe and find its one Text Entry, from the item `open` accepted.
 *
 * @param directory The walk corpus's folder.
 * @param member The probe's path in the walk corpus.
 * @returns The Text Entry; the test fails when the probe is not accepted or holds another count.
 */
const textEntryOf = Effect.fn("textEntryOf")(function* textEntryOf(
  directory: string,
  member: string,
) {
  const verdict = yield* openMember(member).pipe(
    Effect.provide(
      ConfigProvider.layer(ConfigProvider.fromUnknown({ PLATE_CORPUS_DIR: directory })),
    ),
  );
  if (verdict.verdict === "refused" || verdict.verdict === "unchecked") {
    return assert.fail(`${member} is ${verdict.verdict}, not accepted`);
  }

  const entries = interactionsIn(verdict.accepted.item.body).flatMap((interaction) =>
    interaction.kind === "text-entry" ? [interaction] : [],
  );
  const [entry] = entries;

  assert.strictEqual(entries.length, 1, `${member} holds one Text Entry`);
  assert.isDefined(entry);

  return entry;
});

/**
 * Locate the item form's Submit button by its role and name.
 *
 * @param page The page.
 * @returns The locator.
 */
const submitButton = (page: Page): Locator =>
  page.getByRole("button", { exact: true, name: message("en", "submit") });

/**
 * Count the elements a locator matches.
 *
 * @param locator The locator.
 * @returns How many elements it matches now.
 */
const count = (locator: Locator) => Effect.promise(() => locator.count());

/**
 * Whether the element a locator matches holds keyboard focus.
 *
 * @param page The page.
 * @param target The locator.
 * @returns Whether a focused element is among its matches.
 */
const isFocused = Effect.fn("isFocused")(function* isFocused(page: Page, target: Locator) {
  return (yield* count(target.and(page.locator(":focus")))) > 0;
});

/**
 * Press a key on the page's keyboard.
 *
 * @param page The page.
 * @param key The key, as Playwright names it.
 * @returns Once the key is up.
 */
const press = (page: Page, key: string) => Effect.promise(() => page.keyboard.press(key));

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
 * Submit the item form by a key press and wait for the page that answers the post, whose URL
 * names the instance.
 *
 * @param page The page.
 * @param key The key that submits, pressed on the focused element.
 * @returns Once the answering page has loaded.
 */
const submitBy = (page: Page, key: string) =>
  Effect.promise(() =>
    Promise.all([
      page.waitForURL((url) => url.searchParams.has("instance")),
      page.keyboard.press(key),
    ]),
  );

/**
 * Count the elements of the Status region whose text is exactly the given text.
 *
 * @param page The page after a submit.
 * @param text The text.
 * @returns How many elements of the region, read through its role `status`, hold it.
 */
const inStatus = (page: Page, text: string) =>
  count(page.getByRole("status").getByText(text, { exact: true }));

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
 * Give the key that moves focus to the next control of any kind in an engine on this platform.
 *
 * WebKit on macOS keeps Safari's split by default: Tab highlights only fields and pop-up menus,
 * and Option+Tab (Alt+Tab) highlights clickable items too, the buttons among them. Elsewhere Tab
 * reaches every control.
 *
 * @param name The engine.
 * @returns `Alt+Tab` for WebKit on macOS, else `Tab`.
 * @see https://support.apple.com/guide/safari/cpsh003/mac (Safari's keyboard shortcuts: Tab and Option-Tab, and the setting that swaps them)
 */
const nextControlKey = (name: EngineName): string =>
  name === "webkit" && process.platform === "darwin" ? "Alt+Tab" : "Tab";

/**
 * Press the engine's next-control key until the focused element is one the target matches.
 *
 * @param page The page.
 * @param key The key, {@link nextControlKey}'s.
 * @param target The elements to reach.
 * @param most The most presses to make before the test fails.
 * @returns How many presses it took.
 */
const tabUntil = Effect.fn("tabUntil")(function* tabUntil(
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
const focusedStop = Effect.fn("focusedStop")(function* focusedStop(page: Page) {
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
 * twice. The Node walk models the document, where the controls are not elements.
 *
 * @param stops The stops, in the order the presses reached them.
 * @returns The stops with each run on one media element kept as its first.
 */
const elementStops = (stops: readonly Stop[]): readonly Stop[] =>
  stops.filter((stop, index) => {
    const previous = stops[index - 1];

    return !(stop.media && previous?.media === true && previous.key === stop.key);
  });

/**
 * Press the engine's next-control key from the page's start until focus reaches the item form's
 * Submit, reading each stop.
 *
 * @param page The page, freshly loaded, with nothing focused.
 * @param key The key, {@link nextControlKey}'s.
 * @param most The most presses to make before the test fails.
 * @returns Every stop, in the order the presses reached them, the Submit last.
 */
const stopsToSubmit = Effect.fn("stopsToSubmit")(function* stopsToSubmit(
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
 * Press the engine's next-control key through an item's page to its Submit, and compare the
 * elements it visits inside the item form ({@link elementStops}) with the Node walk's `tabOrder`
 * for that form.
 *
 * @param page The page.
 * @param name The engine.
 * @param corpusPath The item's path in the playground's corpus.
 * @returns What the presses did beside the compared order: how many of the page's links they
 *   stopped on before the item form, and how many presses the form's media elements took.
 */
const tabOrderOf = Effect.fn("tabOrderOf")(function* tabOrderOf(
  page: Page,
  name: EngineName,
  corpusPath: string,
) {
  const tree = yield* openItem(page, corpusPath);
  // Room for a media element's native controls, which the Node walk counts as one stop.
  const stops = yield* stopsToSubmit(page, nextControlKey(name), 4 * tabOrder(tree).length);
  const first = stops.findIndex((stop) => stop.inForm);

  assert.isAtLeast(first, 0, "a press reached the item form");
  assert.deepStrictEqual(
    elementStops(stops.slice(first)).map((stop) => stop.key),
    formStops(tree),
  );

  return {
    links: stops.slice(0, first).filter((stop) => stop.link).length,
    media: stops.slice(first).filter((stop) => stop.media).length,
  };
});

/**
 * Describe what the presses did beside the compared order, for a test's annotation.
 *
 * @param seen What {@link tabOrderOf} returned.
 * @param seen.links How many of the page's links the presses stopped on before the item form.
 * @param seen.media How many presses the item form's media elements took.
 * @returns The phrase.
 */
const observed = (seen: { readonly links: number; readonly media: number }): string =>
  [
    seen.links > 0
      ? `stopped on ${String(seen.links)} of the page's links`
      : "stopped on none of the page's links",
    ...(seen.media > 0 ? [`the form's media elements took ${String(seen.media)} presses`] : []),
  ].join("; ");

/**
 * The walk corpus, and a playground over it whose configuration turns on `validateResponses`, so
 * a `pattern-mask` is checked.
 */
const walkPlayground = Layer.unwrap(
  Effect.gen(function* overWalkCorpus() {
    const { directory } = yield* WalkCorpus;

    return playgroundLayer({
      configuration: { validateResponses: true },
      provider: ConfigProvider.fromUnknown({ PLATE_CORPUS_DIR: directory }),
    });
  }),
).pipe(Layer.provideMerge(walkCorpusLayer));

eachEngine((it, name) => {
  const key = nextControlKey(name);

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
              const seen = yield* tabOrderOf(page, name, corpusPath);

              yield* Effect.promise(() =>
                context.annotate(`${name}, ${key}: before ${label}'s item form, ${observed(seen)}`),
              );
            }),
          ),
      );
    }

    keys.effect(
      "[Q-20] [keyboard] BG010 answered by keys: Tab to the Text Entry, type York, Enter submits the form and scores 1",
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* answerYork() {
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

  it.layer(walkPlayground)("the keyboard, text, over the walk corpus", (walk) => {
    walk.effect(
      "[Q-5] [keyboard] Tab order: ordered.xml's item form, from its first control to its Submit, is the Node walk's tabOrder",
      (context) =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* orderedTabOrder() {
            const seen = yield* tabOrderOf(page, name, orderedItem);

            yield* Effect.promise(() =>
              context.annotate(
                `${name}, ${key}: before ordered.xml's item form, ${observed(seen)}`,
              ),
            );
          }),
        ),
    );

    walk.effect(
      "[Q-5] [keyboard] ordered.xml answered by keys: Tab moves through its three Controls in order, two filled, Enter on Submit records the response, and the restored Controls hold the two in order",
      () =>
        withPage({ javaScriptEnabled: false }, (page) =>
          Effect.gen(function* answerOrdered() {
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
            const { directory } = yield* WalkCorpus;
            const interaction = yield* textEntryOf(directory, probe.item);
            const expected = Option.getOrElse(interaction.patternMaskMessage, () =>
              message("en", "patternMismatch"),
            );

            yield* withPage({ javaScriptEnabled: false }, (page) =>
              Effect.gen(function* typeMismatch() {
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
            const { directory } = yield* WalkCorpus;
            const interaction = yield* textEntryOf(directory, probe.item);
            const expected = Option.getOrElse(interaction.patternMaskMessage, () =>
              message("en", "patternMismatch"),
            );

            yield* withPage({ javaScriptEnabled: false }, (page) =>
              Effect.gen(function* typeMatch() {
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

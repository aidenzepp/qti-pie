import { assert, describe, it } from "@effect/vitest";
import { Result } from "effect";
import { defaultOrder, emitNavigation } from "#plate/emit/navigation.ts";
import type { NavigationEmit, NavigationPart } from "#plate/emit/navigation.ts";
import { h } from "#plate/emit/node.ts";
import type { Attributes, Element, Node } from "#plate/emit/node.ts";
import { resolveOverrides, rowFor } from "#plate/emit/parts.ts";
import type { PartOf, PartOverrides } from "#plate/emit/parts.ts";
import { encodeIntent } from "#plate/form/intent.ts";
import { message, numeral } from "#plate/messages.ts";
import type { MessageKey } from "#plate/messages.ts";
import type { NavigationItem, NavigationItemState, NavigationState } from "#plate/navigation.ts";
import type { Intent } from "#plate/session/session.ts";
import type { NavigationMode, SubmissionMode } from "#plate/vocabulary.ts";

/**
 * The attributes that give a button submit semantics or a form owner, none of which a navigation
 * part carries (rule `9af3809b`).
 */
const submitSemantics: ReadonlySet<string> = new Set([
  "action",
  "form",
  "formaction",
  "formenctype",
  "formmethod",
  "formnovalidate",
  "formtarget",
  "name",
  "value",
]);

/**
 * The navigation parts that are buttons, each of which defaults `type` to `button`.
 */
const buttonParts = [
  "previous",
  "next",
  "itemButton",
  "submit",
  "end",
] as const satisfies readonly PartOf<"test-navigation">[];

/**
 * The locale key of each item state's words.
 */
const stateWords = {
  answered: "itemAnswered",
  closed: "itemClosed",
  "not-answered": "itemNotAnswered",
  submitted: "itemSubmitted",
} as const satisfies Readonly<Record<NavigationItemState, MessageKey>>;

/**
 * Construct a navigation of four items, the second current, one in each state.
 *
 * @param navigation The part's navigation mode.
 * @param submission The part's submission mode.
 * @param allowed The intents the session takes.
 * @returns The navigation, at position 2 of a session of 4 items.
 */
const stateOf = (
  navigation: NavigationMode,
  submission: SubmissionMode,
  allowed: readonly Intent[],
): NavigationState => ({
  allowed,
  count: 4,
  items: (["answered", "not-answered", "submitted", "closed"] as const).map(
    (state, index): NavigationItem => ({
      current: index === 1,
      sequenceIndex: index + 1,
      state,
    }),
  ),
  navigation,
  position: 2,
  submission,
});

/**
 * Every intent a navigation of {@link stateOf} names: the moves, `go` to each item, and the
 * submissions of both modes.
 */
const everyIntent: readonly Intent[] = [
  { kind: "next" },
  { kind: "previous" },
  ...[1, 2, 3, 4].map((sequenceIndex): Intent => ({ kind: "go", sequenceIndex })),
  { kind: "submit-item" },
  { kind: "submit-part" },
  { kind: "end-part" },
];

/**
 * The four combinations of the part modes.
 */
const modes: readonly (readonly [NavigationMode, SubmissionMode])[] = [
  ["linear", "individual"],
  ["linear", "simultaneous"],
  ["nonlinear", "individual"],
  ["nonlinear", "simultaneous"],
];

/**
 * Resolve part overrides into what the navigation parts read, failing the test on an unknown
 * part.
 *
 * @param overrides The replacement part functions, none by default.
 * @returns The locale `en` and the resolved overrides.
 */
const emitWith = (overrides?: PartOverrides): NavigationEmit => ({
  locale: "en",
  parts: Result.getOrElse(resolveOverrides(overrides), (failure) =>
    assert.fail(`resolveOverrides refused: ${failure.message}`),
  ),
});

/**
 * Emit a navigation, failing the test when a part is refused.
 *
 * @param state The navigation.
 * @param emit The locale and the part overrides, none swapped by default.
 * @param order The parts, the default order when absent.
 * @returns The navigation Root.
 */
const emitted = (
  state: NavigationState,
  emit: NavigationEmit = emitWith(),
  order?: readonly NavigationPart[],
): Element =>
  Result.getOrElse(emitNavigation(state, emit, order), (failure) =>
    assert.fail(`emitNavigation refused: ${failure.message}`),
  );

/**
 * List an element and every element below it, in document order.
 *
 * @param node The node to walk.
 * @returns The elements, `node` first when it is one.
 */
const elementsOf = (node: Node): readonly Element[] =>
  node.kind === "element" ? [node, ...node.children.flatMap(elementsOf)] : [];

/**
 * Give the text a node holds, its descendants' in order.
 *
 * @param node The node.
 * @returns The text.
 */
const textOf = (node: Node): string =>
  node.kind === "text" ? node.text : node.children.map(textOf).join("");

/**
 * List the elements below a Root that carry a navigation part's marker, read through the part
 * table.
 *
 * @param root The navigation Root.
 * @param part The part.
 * @returns The part's elements, in document order.
 */
const partsOf = (root: Element, part: PartOf<"test-navigation">): readonly Element[] => {
  const { slot } = rowFor("test-navigation", part);

  return elementsOf(root).filter((element) => element.attrs["data-slot"] === slot);
};

/**
 * Give the one element of a part below a Root, failing the test unless there is exactly one.
 *
 * @param root The navigation Root.
 * @param part The part.
 * @returns The part's element.
 */
const onePart = (root: Element, part: PartOf<"test-navigation">): Element => {
  const found = partsOf(root, part);
  assert.lengthOf(found, 1, part);

  return found[0] ?? assert.fail(part);
};

/**
 * Give the parts a Root holds, each as the part key its marker names.
 *
 * @param root The navigation Root.
 * @returns The part keys of the Root's children, in order.
 */
const childParts = (root: Element): readonly string[] =>
  root.children.map((child) => {
    const slot = child.kind === "element" ? child.attrs["data-slot"] : undefined;
    const match = (["previous", "next", "items", "submit", "end"] as const).find(
      (part) => rowFor("test-navigation", part).slot === slot,
    );

    return match ?? assert.fail(`a Root child carries ${String(slot)}`);
  });

/**
 * Write an item button's label as the locale writes it.
 *
 * @param item The item.
 * @param count The session's item count.
 * @returns "Item n of count" and the item's state in words.
 */
const itemLabel = (item: NavigationItem, count: number): string =>
  message("en", "itemState", {
    item: message("en", "itemOf", {
      count: numeral("en", count),
      n: numeral("en", item.sequenceIndex),
    }),
    state: message("en", stateWords[item.state]),
  });

/**
 * Copy a tree without the attributes a host's submit swap writes: `type`, `name` and `value`.
 *
 * @param node The node.
 * @returns The node, every element's attributes without those three.
 */
const withoutSubmitAttributes = (node: Node): Node => {
  if (node.kind === "text") {
    return node;
  }

  const attrs: Attributes = Object.fromEntries(
    Object.entries(node.attrs).filter(([name]) => !["name", "type", "value"].includes(name)),
  );

  return h(node.tag, attrs, node.children.map(withoutSubmitAttributes));
};

/**
 * A host's replacement that makes a navigation button its own submit button, posting the intent
 * the button is handed.
 *
 * @param props The attributes the button carries.
 * @param children The button's label.
 * @returns A submit button named `s-1.intent` whose value is `props["data-intent"]`.
 */
const submitting = (props: Attributes, children: readonly Node[]): Element =>
  h("button", { name: "s-1.intent", type: "submit", value: props["data-intent"] ?? "" }, children);

describe("emitNavigation", () => {
  it("[T-4] holds the data: the modes on the Root, a labelled button per part and per item, and the current item marked", () => {
    const state = stateOf("nonlinear", "individual", everyIntent);
    const root = emitted(state);

    assert.strictEqual(root.tag, "nav");
    assert.strictEqual(root.attrs["data-slot"], rowFor("test-navigation", "root").slot);
    assert.strictEqual(root.attrs["aria-label"], message("en", "testNavigation"));
    assert.strictEqual(root.attrs["data-navigation"], "nonlinear");
    assert.strictEqual(root.attrs["data-submission"], "individual");
    assert.deepStrictEqual(childParts(root), ["previous", "items", "next", "submit", "end"]);

    assert.deepStrictEqual(
      (["previous", "next", "submit", "end"] as const).map((part) => textOf(onePart(root, part))),
      (["previousItem", "nextItem", "submitAnswer", "endPart"] as const).map((key) =>
        message("en", key),
      ),
    );
    assert.deepStrictEqual(
      (["previous", "next", "submit", "end"] as const).map(
        (part) => onePart(root, part).attrs["data-intent"],
      ),
      ["previous", "next", "submit-item", "end-part"],
    );

    const items = onePart(root, "items");
    assert.strictEqual(items.tag, "ol");
    assert.lengthOf(partsOf(root, "item"), state.items.length);
    for (const [index, entry] of partsOf(root, "item").entries()) {
      assert.strictEqual(entry.tag, "li");
      assert.strictEqual(items.children[index], entry);
    }

    const buttons = partsOf(root, "itemButton");
    assert.deepStrictEqual(
      buttons.map((button) => textOf(button)),
      state.items.map((item) => itemLabel(item, state.count)),
    );
    assert.deepStrictEqual(
      buttons.map((button) => button.attrs["data-intent"]),
      ["go:1", "go:2", "go:3", "go:4"],
    );
    assert.deepStrictEqual(
      buttons.map((button) => button.attrs["aria-current"]),
      [undefined, "step", undefined, undefined],
    );
  });

  it("[T-4] labels Submit by the submission mode and gives it that mode's intent", () => {
    const individual = onePart(emitted(stateOf("linear", "individual", [])), "submit");
    const simultaneous = onePart(emitted(stateOf("linear", "simultaneous", [])), "submit");

    assert.strictEqual(textOf(individual), message("en", "submitAnswer"));
    assert.strictEqual(individual.attrs["data-intent"], "submit-item");
    assert.strictEqual(textOf(simultaneous), message("en", "submitPart"));
    assert.strictEqual(simultaneous.attrs["data-intent"], "submit-part");
  });

  it("[T-4] writes plain buttons: type button, and no name, value, form attribute, action or script anywhere", () => {
    for (const [navigation, submission] of modes) {
      const root = emitted(stateOf(navigation, submission, everyIntent), emitWith(), [
        "previous",
        "items",
        "next",
        "submit",
        "end",
      ]);
      const elements = elementsOf(root);
      const buttons = elements.filter((element) => element.tag === "button");

      assert.lengthOf(buttons, 8, `${navigation} ${submission}`);
      for (const button of buttons) {
        assert.strictEqual(button.attrs["type"], "button");
      }

      for (const element of elements) {
        assert.notInclude(["form", "script"], element.tag);
        assert.deepStrictEqual(
          Object.keys(element.attrs).filter(
            (name) => submitSemantics.has(name) || name.startsWith("on"),
          ),
          [],
          `<${element.tag}> in ${navigation} ${submission}`,
        );
      }
    }
  });

  it("[T-4] disables a button exactly when the data's allowed intents lack its intent", () => {
    const subsets: readonly (readonly Intent[])[] = [
      [],
      everyIntent,
      [{ kind: "next" }, { kind: "go", sequenceIndex: 2 }, { kind: "submit-item" }],
      [{ kind: "previous" }, { kind: "go", sequenceIndex: 4 }, { kind: "end-part" }],
      [{ kind: "submit-part" }, { kind: "go", sequenceIndex: 1 }],
    ];
    for (const [navigation, submission] of modes) {
      for (const allowed of subsets) {
        const root = emitted(stateOf(navigation, submission, allowed), emitWith(), [
          "previous",
          "items",
          "next",
          "submit",
          "end",
        ]);
        const posted = new Set(allowed.map(encodeIntent));
        const buttons = buttonParts.flatMap((part) => partsOf(root, part));

        assert.lengthOf(buttons, 8);
        for (const button of buttons) {
          const intent = button.attrs["data-intent"];
          assert.isString(intent);
          assert.strictEqual(
            button.attrs["disabled"] === true,
            !posted.has(String(intent)),
            `${String(intent)} in ${navigation} ${submission}`,
          );
        }
      }
    }
  });

  it("[T-4] holds by default the parts the modes admit, and exactly the parts an order names", () => {
    const defaults = modes.map(([navigation, submission]) =>
      childParts(emitted(stateOf(navigation, submission, everyIntent))),
    );
    assert.deepStrictEqual(defaults, [
      ["next", "submit"],
      ["next", "submit"],
      ["previous", "items", "next", "submit", "end"],
      ["previous", "items", "next", "submit"],
    ]);
    assert.deepStrictEqual(
      modes.map(([navigation, submission]) => defaultOrder({ navigation, submission })),
      defaults,
    );

    const state = stateOf("linear", "individual", [{ kind: "next" }, { kind: "submit-item" }]);
    assert.deepStrictEqual(childParts(emitted(state, emitWith(), ["next"])), ["next"]);
    assert.deepStrictEqual(childParts(emitted(state, emitWith(), [])), []);

    const repeated = emitted(state, emitWith(), ["end", "previous", "end"]);
    assert.deepStrictEqual(childParts(repeated), ["end", "previous", "end"]);
    assert.notStrictEqual(repeated.children[0], repeated.children[2]);
    assert.isTrue(onePart(repeated, "previous").attrs["disabled"] === true);
  });

  it("[T-4] gives two emits of one input equal trees", () => {
    for (const [navigation, submission] of modes) {
      const state = stateOf(navigation, submission, everyIntent);

      assert.deepStrictEqual(emitted(state), emitted(state));
    }
  });

  it("[T-4] keeps everything but type, name and value when a host swaps every button for its own submit button", () => {
    const state = stateOf("nonlinear", "individual", [
      { kind: "next" },
      { kind: "go", sequenceIndex: 2 },
    ]);
    const swapped = emitted(
      state,
      emitWith({
        "test-navigation": Object.fromEntries(buttonParts.map((part) => [part, submitting])),
      }),
    );
    const plain = emitted(state);

    assert.deepStrictEqual(withoutSubmitAttributes(swapped), withoutSubmitAttributes(plain));

    const buttons = buttonParts.flatMap((part) => partsOf(swapped, part));
    assert.lengthOf(buttons, 8);
    for (const button of buttons) {
      assert.strictEqual(button.attrs["type"], "submit");
      assert.strictEqual(button.attrs["name"], "s-1.intent");
      assert.strictEqual(button.attrs["value"], button.attrs["data-intent"]);
    }
  });

  it("[T-4] refuses a swap of a button to a div with PartSwapRefused", () => {
    const failure = Result.match(
      emitNavigation(
        stateOf("nonlinear", "individual", everyIntent),
        emitWith({ "test-navigation": { next: (_props, children) => h("div", {}, children) } }),
      ),
      {
        onFailure: (error) => error,
        onSuccess: () => assert.fail("a div stood for a navigation button"),
      },
    );

    assert.strictEqual(failure._tag, "PartSwapRefused");
    assert.strictEqual(failure.cause, "root-not-allowed");
    assert.strictEqual(failure.interaction, "test-navigation");
    assert.strictEqual(failure.part, "next");
  });
});

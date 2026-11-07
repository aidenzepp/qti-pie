import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { emitItem, emitStatus } from "#plate/emit/item.ts";
import type { StatusInput } from "#plate/emit/item.ts";
import { h, text } from "#plate/emit/node.ts";
import type { Attributes, Element, Node } from "#plate/emit/node.ts";
import { resolveOverrides, rowFor, scopedId } from "#plate/emit/parts.ts";
import type { PartOverrides } from "#plate/emit/parts.ts";
import { message } from "#plate/messages.ts";
import type { Item, TextEntryInteraction } from "#plate/model/item.ts";
import { identifyMessages, payload, redactItem } from "#plate/payload.ts";
import type {
  EmitState,
  InteractionPayload,
  Payload,
  PayloadNode,
  RenderMode,
  ValidationMessage,
  View,
} from "#plate/payload.ts";
import { checkTree, nameOf, textOf } from "#plate/test/accessibility.ts";
import { roundTrips } from "#plate/test/round-trip.ts";

/**
 * The item instance every payload here is built for.
 */
const instance = "i1";

/**
 * Construct a payload with an empty body, as `payload` gives it.
 *
 * @param finished Whether the author disabled every control.
 * @param mode The render's mode, `answering` by default.
 * @returns The payload, its language `en-GB` and its title `Colours`.
 */
const payloadOf = (finished: boolean, mode: RenderMode = "answering"): Payload => ({
  body: [],
  finished,
  instance,
  lang: "en-GB",
  messages: [],
  mode,
  notices: [],
  title: "Colours",
});

/**
 * The renders the Root is checked in: answering with every control enabled and finished, then
 * review and solution.
 */
const renders: readonly Payload[] = [
  payloadOf(false),
  payloadOf(true),
  payloadOf(false, "review"),
  payloadOf(false, "solution"),
];

/**
 * Construct the emit state, with the given part overrides resolved.
 *
 * @param overrides The replacement part functions, none by default.
 * @returns The state, locale `en` and heading level 2.
 */
const stateWith = (overrides?: PartOverrides): Effect.Effect<EmitState> =>
  Effect.map(Effect.orDie(Effect.fromResult(resolveOverrides(overrides))), (parts) => ({
    assetBase: "",
    headingLevel: 2,
    locale: "en",
    parts,
  }));

/**
 * Construct a hand-built item body: a paragraph and a named text control, as the body emitter
 * hands them over.
 *
 * @returns The body's nodes, new on each call.
 */
const body = (): readonly Node[] => [
  h("p", {}, [text("Name a colour.")]),
  h("input", { "aria-label": "Colour", name: `${instance}-RESPONSE`, type: "text" }),
];

/**
 * Collect the tags of a subtree's elements in document order, its root included.
 *
 * @param node The subtree's root.
 * @returns Every element's local name at or below `node`.
 */
const tagsIn = (node: Node): readonly string[] =>
  node.kind === "text" ? [] : [node.tag, ...node.children.flatMap(tagsIn)];

/**
 * Construct a replacement that returns a `tag` element carrying the class `host`, its own `lang`
 * and `id`, the props it is handed and the children it is handed.
 *
 * @param tag The element the replacement returns.
 * @returns A part function returning a `tag` element.
 */
const hostPart =
  (tag: string) =>
  (props: Attributes, children: readonly Node[]): Element =>
    h(tag, { ...props, class: "host", id: "host", lang: "fr" }, children);

describe("emitItem", () => {
  it.effect(
    "[I-0] the Root carries lang, id and data-mode, and data-disabled only when finished; never data-attempt",
    () =>
      Effect.gen(function* rootAttributes() {
        const state = yield* stateWith();
        for (const render of renders) {
          const root = yield* Effect.fromResult(emitItem(render, state, body()));
          assert.strictEqual(root.tag, rowFor("item", "root").element);
          assert.strictEqual(root.attrs["data-slot"], rowFor("item", "root").slot);
          assert.strictEqual(root.attrs["lang"], "en-GB");
          assert.strictEqual(root.attrs["id"], scopedId(instance, "item"));
          assert.strictEqual(root.attrs["data-mode"], render.mode);
          assert.strictEqual(root.attrs["data-disabled"], render.finished ? true : undefined);
          assert.doesNotHaveAnyKeys(root.attrs, ["data-attempt", "data-finished"]);
        }
      }),
  );

  it.effect(
    "[I-0] the Root holds the body nodes in order and nothing else, and the tree has no form and no button",
    () =>
      Effect.gen(function* rootChildren() {
        const state = yield* stateWith();
        for (const render of renders) {
          const nodes = body();
          const root = yield* Effect.fromResult(emitItem(render, state, nodes));
          assert.strictEqual(root.children.length, nodes.length);
          assert.isTrue(nodes.every((node, index) => root.children[index] === node));
          assert.notInclude(tagsIn(root), "form");
          assert.notInclude(tagsIn(root), "button");
        }
      }),
  );

  it.effect("[I-0] a Root swapped to a div keeps lang and id (I1)", () =>
    Effect.gen(function* swappedRoot() {
      const state = yield* stateWith({ item: { root: hostPart("div") } });
      const nodes = body();
      const root = yield* Effect.fromResult(emitItem(payloadOf(false), state, nodes));
      assert.strictEqual(root.tag, "div");
      assert.strictEqual(root.attrs["class"], "host");
      assert.strictEqual(root.attrs["lang"], "en-GB");
      assert.strictEqual(root.attrs["id"], scopedId(instance, "item"));
      assert.strictEqual(root.attrs["data-slot"], rowFor("item", "root").slot);
      assert.isTrue(nodes.every((node, index) => root.children[index] === node));
    }),
  );

  it.effect("[I-0] a Root swapped to an a is refused root-not-allowed", () =>
    Effect.gen(function* refusedRoot() {
      const state = yield* stateWith({
        item: { root: (props, children) => h("a", props, children) },
      });
      const error = yield* Effect.flip(
        Effect.fromResult(emitItem(payloadOf(false), state, body())),
      );
      assert.strictEqual(error._tag, "PartSwapRefused");
      assert.strictEqual(error.cause, "root-not-allowed");
      assert.strictEqual(error.interaction, "item");
      assert.strictEqual(error.part, "root");
    }),
  );

  it.effect("[I-0] the tree passes checkTree at base level 2 and round-trips", () =>
    Effect.gen(function* checkedTree() {
      const state = yield* stateWith();
      for (const render of renders) {
        const root = yield* Effect.fromResult(emitItem(render, state, body()));
        assert.deepStrictEqual(checkTree(root, { baseLevel: 2 }), []);
        assert.isTrue(roundTrips(root));
      }
    }),
  );
});

/**
 * The messages of a refused post: two for `CITY` around one for `RIVER`, so each response counts
 * its own messages.
 */
const refusals: readonly ValidationMessage[] = [
  { response: "CITY", text: "Enter a city." },
  { response: "RIVER", text: "Name a river." },
  { response: "CITY", text: "Use letters only." },
];

/**
 * The Status inputs of the three after-submit states: a score, a refused post's messages, and a
 * response recorded with no processing.
 */
const scored: StatusInput = { heading: "scored", instance, score: "1" };

const notAccepted: StatusInput = { heading: "notAccepted", instance, messages: refusals };

const recorded: StatusInput = { heading: "responseRecorded", instance };

/**
 * Every Status input checked here: the three after-submit states, then a review, a solution, a
 * submitted part and a finished test, each showing only its heading.
 */
const statuses: readonly StatusInput[] = [
  scored,
  notAccepted,
  recorded,
  ...(["review", "solution", "partSubmitted", "testFinished"] as const).map(
    (heading): StatusInput => ({ heading, instance }),
  ),
];

/**
 * Give an element child of a part, which the test expects to be there.
 *
 * @param parent The part.
 * @param index The child's position.
 * @returns The child.
 * @throws {Error} When the child is missing or a text node, a failure of the emitter under test.
 */
const elementAt = (parent: Element, index: number): Element => {
  const child = parent.children[index];
  if (child?.kind !== "element") {
    throw new Error(`Expected an element at child ${index} of a ${parent.tag}.`);
  }

  return child;
};

/**
 * Collect the elements of a subtree that carry an attribute, its root included.
 *
 * @param node The subtree's root.
 * @param name The attribute.
 * @returns Every element at or below `node` that carries `name`.
 */
const carrying = (node: Node, name: string): readonly Element[] =>
  node.kind === "text"
    ? []
    : [
        ...(node.attrs[name] === undefined ? [] : [node]),
        ...node.children.flatMap((child) => carrying(child, name)),
      ];

/**
 * Construct an unnamed Text Entry bound to a single string response.
 *
 * @param response The response it binds.
 * @returns The interaction.
 */
const textEntry = (response: string): TextEntryInteraction => ({
  ariaLabel: Option.none(),
  ariaLabelledby: Option.none(),
  base: 10,
  baseType: "string",
  class: "",
  expectedLength: Option.none(),
  kind: "text-entry",
  path: `qti-assessment-item/qti-item-body/p/qti-text-entry-interaction[${response}]`,
  patternMask: Option.none(),
  patternMaskMessage: Option.none(),
  placeholder: Option.none(),
  response,
});

/**
 * A hand-built item whose one paragraph holds a Text Entry for `CITY` and one for `RIVER`.
 */
const rivers: Item = {
  body: [
    {
      attributes: [],
      children: [textEntry("CITY"), { kind: "text", text: " on the " }, textEntry("RIVER")],
      kind: "element",
      path: "qti-assessment-item/qti-item-body/p",
      tag: "p",
    },
  ],
  document: "items/rivers.xml",
  identifier: "rivers",
  lang: Option.none(),
  outcomes: new Map(),
  processing: Option.none(),
  responses: new Map(
    ["CITY", "RIVER"].map((identifier) => [
      identifier,
      {
        areaMapping: Option.none(),
        baseType: "string",
        cardinality: "single",
        correct: Option.none(),
        defaultValue: Option.none(),
        identifier,
        mapping: Option.none(),
      },
    ]),
  ),
  templateProcessing: Option.none(),
  templates: new Map(),
  title: "Rivers",
  unsupported: [],
};

/**
 * Collect the interaction payloads of payload nodes in document order.
 *
 * @param nodes The payload's body nodes.
 * @returns Every interaction at or below them.
 */
const interactionsIn = (nodes: readonly PayloadNode[]): readonly InteractionPayload[] =>
  nodes.flatMap((node) => {
    switch (node.kind) {
      case "element": {
        return interactionsIn(node.children);
      }
      case "notice":
      case "text": {
        return [];
      }
      case "choice":
      case "extended-text":
      case "inline-choice":
      case "text-entry": {
        return [node];
      }
      default: {
        return node satisfies never;
      }
    }
  });

/**
 * The view of a first render of {@link rivers}: answering, no messages, nothing posted, no values.
 */
const first: View = {
  finished: false,
  instance,
  locale: "en",
  messages: [],
  mode: "answering",
  names: new Map(),
  posted: Option.none(),
  values: new Map(),
};

describe("emitItem, from a built payload", () => {
  it.effect(
    "[I-0] a render with every control disabled keeps data-mode answering and carries data-disabled",
    () =>
      Effect.gen(function* disabledRender() {
        const state = yield* stateWith();
        const built = payload(redactItem(rivers), { ...first, finished: true });
        const root = yield* Effect.fromResult(emitItem(built, state, body()));
        assert.strictEqual(root.attrs["data-mode"], "answering");
        assert.strictEqual(root.attrs["data-disabled"], true);
      }),
  );

  it.effect("[I-0] a review or solution render names its mode and is not disabled", () =>
    Effect.gen(function* modeRender() {
      const state = yield* stateWith();
      for (const mode of ["review", "solution"] as const) {
        const built = payload(redactItem(rivers), { ...first, mode });
        const root = yield* Effect.fromResult(emitItem(built, state, body()));
        assert.strictEqual(root.attrs["data-mode"], mode);
        assert.isUndefined(root.attrs["data-disabled"]);
      }
    }),
  );
});

describe("the item chrome, plain functions", () => {
  it.effect("emitItem and emitStatus return Results", () =>
    Effect.gen(function* chromeResults() {
      const state = yield* stateWith();
      assert.isTrue(Result.isResult(emitItem(payloadOf(false), state, body())));
      assert.isTrue(Result.isResult(emitStatus(scored, state)));
    }),
  );
});

describe("emitStatus", () => {
  it.effect(
    "[I-0] the region's heading is at the base level, reads the state's text, and names it",
    () =>
      Effect.gen(function* statusHeading() {
        const state = yield* stateWith();
        for (const input of statuses) {
          const status = yield* Effect.fromResult(emitStatus(input, state));
          const heading = elementAt(status, 0);
          const headingRow = rowFor("item", "statusHeading", { headingLevel: state.headingLevel });
          assert.strictEqual(status.tag, rowFor("item", "status").element);
          assert.strictEqual(status.attrs["data-slot"], rowFor("item", "status").slot);
          assert.strictEqual(status.attrs["id"], scopedId(instance, "status"));
          assert.strictEqual(status.attrs["role"], "status");
          assert.strictEqual(status.attrs["tabindex"], "-1");
          assert.strictEqual(heading.tag, "h2");
          assert.strictEqual(heading.tag, headingRow.element);
          assert.strictEqual(heading.attrs["data-slot"], headingRow.slot);
          assert.strictEqual(status.attrs["aria-labelledby"], heading.attrs["id"]);
          assert.strictEqual(textOf(heading), message("en", input.heading));
          assert.strictEqual(nameOf(status, status), message("en", input.heading));
        }
      }),
  );

  it.effect("[I-0] autofocus is on the Status region exactly when the input asks for it", () =>
    Effect.gen(function* statusAutofocus() {
      const state = yield* stateWith();
      for (const input of statuses) {
        const absent = yield* Effect.fromResult(emitStatus(input, state));
        const declined = yield* Effect.fromResult(
          emitStatus({ ...input, autofocus: false }, state),
        );
        const asked = yield* Effect.fromResult(emitStatus({ ...input, autofocus: true }, state));
        assert.deepStrictEqual(carrying(absent, "autofocus"), []);
        assert.deepStrictEqual(carrying(declined, "autofocus"), []);
        assert.deepStrictEqual(carrying(asked, "autofocus"), [asked]);
        assert.strictEqual(asked.attrs["autofocus"], true);
      }
    }),
  );

  it.effect(
    "[I-0] a scored input shows the score, a refused one a Message per message, a recorded one only its heading",
    () =>
      Effect.gen(function* statusDetail() {
        const state = yield* stateWith();

        const score = yield* Effect.fromResult(emitStatus(scored, state));
        assert.strictEqual(score.children.length, 2);
        assert.strictEqual(textOf(elementAt(score, 1)), message("en", "score", { score: "1" }));

        const refused = yield* Effect.fromResult(emitStatus(notAccepted, state));
        const list = elementAt(refused, 1);
        assert.strictEqual(refused.children.length, 2);
        assert.strictEqual(list.tag, rowFor("item", "messages").element);
        assert.strictEqual(list.attrs["data-slot"], rowFor("item", "messages").slot);
        assert.deepStrictEqual(
          list.children.map((_, index) => {
            const item = elementAt(list, index);

            return [item.tag, item.attrs["data-slot"], textOf(item)];
          }),
          refusals.map((entry) => [
            rowFor("item", "message").element,
            rowFor("item", "message").slot,
            entry.text,
          ]),
        );

        const response = yield* Effect.fromResult(emitStatus(recorded, state));
        assert.strictEqual(response.children.length, 1);
        assert.strictEqual(textOf(response), message("en", "responseRecorded"));

        const both = yield* Effect.fromResult(emitStatus({ ...scored, messages: refusals }, state));
        assert.strictEqual(both.children.length, 2);
        assert.strictEqual(textOf(elementAt(both, 1)), message("en", "score", { score: "1" }));
      }),
  );

  it.effect(
    "[I-0] each Message id is the one identifyMessages gives, which the payload writes into its Control's messageIds",
    () =>
      Effect.gen(function* statusMessageIds() {
        const state = yield* stateWith();
        const list = elementAt(yield* Effect.fromResult(emitStatus(notAccepted, state)), 1);
        const ids = list.children.map((_, index) => String(elementAt(list, index).attrs["id"]));
        assert.deepStrictEqual(
          ids,
          identifyMessages(instance, refusals).map((entry) => entry.id),
        );

        const built = payload(redactItem(rivers), { ...first, messages: refusals });
        const controls = interactionsIn(built.body);
        assert.deepStrictEqual(
          controls.map((control) => control.response),
          ["CITY", "RIVER"],
        );
        for (const control of controls) {
          assert.deepStrictEqual(
            control.messageIds,
            ids.filter((_, index) => refusals[index]?.response === control.response),
          );
        }
      }),
  );

  it.effect("[I-0] the region holds no form and no button", () =>
    Effect.gen(function* statusChrome() {
      const state = yield* stateWith();
      for (const input of statuses) {
        const status = yield* Effect.fromResult(emitStatus({ ...input, autofocus: true }, state));
        assert.notInclude(tagsIn(status), "form");
        assert.notInclude(tagsIn(status), "button");
      }
    }),
  );

  it.effect(
    "[I-0] a Status swapped to a div keeps its id, role, aria-labelledby and tabindex (I1)",
    () =>
      Effect.gen(function* swappedStatus() {
        const state = yield* stateWith({ item: { status: hostPart("div") } });
        const status = yield* Effect.fromResult(emitStatus({ ...scored, autofocus: true }, state));
        assert.strictEqual(status.tag, "div");
        assert.strictEqual(status.attrs["class"], "host");
        assert.strictEqual(status.attrs["id"], scopedId(instance, "status"));
        assert.strictEqual(status.attrs["role"], "status");
        assert.strictEqual(status.attrs["tabindex"], "-1");
        assert.strictEqual(status.attrs["autofocus"], true);
        assert.strictEqual(status.attrs["aria-labelledby"], elementAt(status, 0).attrs["id"]);
      }),
  );

  it.effect(
    "[I-0] each region round-trips, and passes checkTree at base level 2 placed first in the Root",
    () =>
      Effect.gen(function* checkedStatus() {
        const state = yield* stateWith();
        for (const input of statuses) {
          for (const status of [
            yield* Effect.fromResult(emitStatus(input, state)),
            yield* Effect.fromResult(emitStatus({ ...input, autofocus: true }, state)),
          ]) {
            const root = yield* Effect.fromResult(
              emitItem(payloadOf(false), state, [status, ...body()]),
            );
            assert.deepStrictEqual(checkTree(root, { baseLevel: 2 }), []);
            assert.isTrue(roundTrips(status));
            assert.isTrue(roundTrips(root));
          }
        }
      }),
  );
});

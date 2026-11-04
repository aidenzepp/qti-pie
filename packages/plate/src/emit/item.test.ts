import { assert, describe, it } from "@effect/vitest";
import { Effect } from "effect";
import { emitItem } from "#plate/emit/item.ts";
import { h, text } from "#plate/emit/node.ts";
import type { Attributes, Element, Node } from "#plate/emit/node.ts";
import { resolveOverrides, rowFor, scopedId } from "#plate/emit/parts.ts";
import type { PartOverrides } from "#plate/emit/parts.ts";
import type { EmitState, Payload } from "#plate/payload.ts";
import { checkTree } from "#plate/test/accessibility.ts";
import { roundTrips } from "#plate/test/round-trip.ts";

/**
 * The item instance every payload here is built for.
 */
const instance = "i1";

/**
 * Construct a payload with an empty body, as `payload` gives it.
 *
 * @param finished Whether the author disabled every control.
 * @returns The payload, its language `en-GB` and its title `Colours`.
 */
const payloadOf = (finished: boolean): Payload => ({
  body: [],
  finished,
  instance,
  lang: "en-GB",
  messages: [],
  mode: "answering",
  notices: [],
  title: "Colours",
});

/**
 * The renders the Root is checked in: with every control enabled, and finished.
 */
const renders: readonly Payload[] = [payloadOf(false), payloadOf(true)];

/**
 * Construct the emit state, with the given part overrides resolved.
 *
 * @param overrides The replacement part functions, none by default.
 * @returns The state, locale `en` and heading level 2.
 */
const stateWith = (overrides?: PartOverrides): Effect.Effect<EmitState> =>
  Effect.map(Effect.orDie(resolveOverrides(overrides)), (parts) => ({
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
    "[I-0] the Root carries lang, id and data-mode, and data-finished only when finished; never data-attempt",
    () =>
      Effect.gen(function* rootAttributes() {
        const state = yield* stateWith();
        for (const render of renders) {
          const root = yield* emitItem(render, state, body());
          assert.strictEqual(root.tag, rowFor("item", "root").element);
          assert.strictEqual(root.attrs["data-slot"], rowFor("item", "root").slot);
          assert.strictEqual(root.attrs["lang"], "en-GB");
          assert.strictEqual(root.attrs["id"], scopedId(instance, "item"));
          assert.strictEqual(root.attrs["data-mode"], "answering");
          assert.strictEqual(root.attrs["data-finished"], render.finished ? true : undefined);
          assert.notProperty(root.attrs, "data-attempt");
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
          const root = yield* emitItem(render, state, nodes);
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
      const root = yield* emitItem(payloadOf(false), state, nodes);
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
      const error = yield* Effect.flip(emitItem(payloadOf(false), state, body()));
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
        const root = yield* emitItem(render, state, body());
        assert.deepStrictEqual(checkTree(root, { baseLevel: 2 }), []);
        assert.isTrue(roundTrips(root));
      }
    }),
  );
});

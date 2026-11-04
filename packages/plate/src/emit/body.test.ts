import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { emitBody } from "#plate/emit/body.ts";
import type { RenderInteraction } from "#plate/emit/body.ts";
import { h, text } from "#plate/emit/node.ts";
import type { Element, Node } from "#plate/emit/node.ts";
import { resolveOverrides, rowFor, scopedId } from "#plate/emit/parts.ts";
import { toHtml } from "#plate/emit/serialise.ts";
import { message } from "#plate/messages.ts";
import type {
  ChoicePayload,
  ElementPayload,
  EmitState,
  Payload,
  PayloadNode,
  TextEntryPayload,
  TextPayload,
} from "#plate/payload.ts";
import { checkTree } from "#plate/test/accessibility.ts";
import { roundTrips } from "#plate/test/round-trip.ts";

/**
 * The item instance key every test payload carries.
 */
const instance = "i1";

/**
 * Build a body element's payload.
 *
 * @param tag The element's local name.
 * @param attributes Its attributes as the model kept them, `xml:lang` under that name.
 * @param children Its child payload nodes.
 * @returns The element payload.
 */
const el = (
  tag: string,
  attributes: Readonly<Record<string, string>> = {},
  children: readonly PayloadNode[] = [],
): ElementPayload => ({
  attributes: Object.entries(attributes).map(([name, value]) => ({ name, value })),
  children,
  kind: "element",
  tag,
});

/**
 * Build a run of body text.
 *
 * @param value The characters.
 * @returns The text payload.
 */
const txt = (value: string): TextPayload => ({ kind: "text", text: value });

/**
 * Build a payload around a body, in the state before any submit.
 *
 * @param body The body's payload nodes.
 * @returns The payload.
 */
const payloadOf = (body: readonly PayloadNode[]): Payload => ({
  attempt: "none",
  body,
  finished: false,
  instance,
  lang: "en",
  messages: [],
  mode: "answering",
  notices: [],
  recorded: false,
  score: Option.none(),
  title: "Item",
});

/**
 * Give the emit state, with no part overrides.
 *
 * @param headingLevel The configured heading level.
 * @returns The emit state.
 */
const stateAt = (headingLevel: number): Effect.Effect<EmitState> =>
  Effect.map(Effect.orDie(resolveOverrides()), (parts) => ({
    action: "/submit",
    assetBase: "",
    headingLevel,
    locale: "en",
    parts,
  }));

/**
 * An interaction render stub: a `span` naming the response, or, for a Choice, the first Control's
 * `input` with the id its connect function writes.
 */
const stub: RenderInteraction = (interaction) =>
  Effect.succeed(
    interaction.kind === "choice"
      ? h("input", {
          "aria-label": "Red",
          id: scopedId(instance, interaction.response, "control", 0),
          name: interaction.response,
          type: "radio",
        })
      : h("span", { "data-response": interaction.response }),
  );

/**
 * Emit a body at a heading level, with the stub for every interaction.
 *
 * @param body The body's payload nodes.
 * @param headingLevel The configured heading level, 2 by default.
 * @returns The emitted nodes.
 */
const emit = (
  body: readonly PayloadNode[],
  headingLevel = 2,
): Effect.Effect<readonly Node[], unknown> =>
  Effect.flatMap(stateAt(headingLevel), (state) => emitBody(payloadOf(body), state, stub));

/**
 * Collect the elements of a node list in document order, descendants included.
 *
 * @param nodes The nodes.
 * @returns Every element at or below them.
 */
const elementsIn = (nodes: readonly Node[]): readonly Element[] =>
  nodes.flatMap((node) => (node.kind === "element" ? [node, ...elementsIn(node.children)] : []));

/**
 * Collect the `id` values of a node list in document order.
 *
 * @param nodes The nodes.
 * @returns Every `id` at or below them.
 */
const idsIn = (nodes: readonly Node[]): readonly string[] =>
  elementsIn(nodes).flatMap((element) => {
    const { id } = element.attrs;

    return id === undefined || id === true ? [] : [id];
  });

/**
 * A minimal item root around emitted nodes, carrying `lang` as the item Root does.
 *
 * @param nodes The emitted body.
 * @returns The root.
 */
const rootOf = (nodes: readonly Node[]): Element => h("div", { lang: "en" }, nodes);

/**
 * A Text Entry bound to `RESPONSE`, unnamed, before any submit.
 */
const textEntry: TextEntryPayload = {
  autofocus: false,
  base: 10,
  baseType: "string",
  class: "",
  expectedLength: Option.none(),
  invalid: false,
  kind: "text-entry",
  messageIds: [],
  name: {
    ariaLabel: Option.none(),
    ariaLabelledby: Option.none(),
    unnamed: Option.some({ count: 1, n: 1 }),
  },
  placeholder: Option.none(),
  response: "RESPONSE",
  restore: "",
};

/**
 * A single Choice bound to `RESPONSE`, with no Prompt, before any submit.
 */
const choice: ChoicePayload = {
  autofocus: false,
  cardinality: "single",
  choices: [{ content: [txt("Red")], identifier: "A" }],
  class: "",
  invalid: false,
  kind: "choice",
  maxChoices: 1,
  messageIds: [],
  minChoices: 0,
  orientation: Option.none(),
  prompt: Option.none(),
  response: "RESPONSE",
  restore: [],
};

/**
 * Build a table row's payload holding one cell.
 *
 * @param cell The cell's text.
 * @returns The `tr` payload.
 */
const row = (cell: string): ElementPayload => el("tr", {}, [el("td", {}, [txt(cell)])]);

/**
 * Build the emitted form of {@link row}.
 *
 * @param cell The cell's text.
 * @returns The `tr` element.
 */
const emittedRow = (cell: string): Element => h("tr", {}, [h("td", {}, [text(cell)])]);

describe("emitBody", () => {
  it.effect(
    "[I-7] [I-8] [A-1] a BG011-shaped body round-trips and passes the accessibility checks",
    () =>
      Effect.gen(function* bg011() {
        const nodes = yield* emit([
          el("div", {}, [
            el("img", {
              alt: "Picture of crows roosting in a tree",
              height: "215",
              src: "resources/crows.jpg",
              width: "320",
            }),
          ]),
          txt("\n"),
          el("p", {}, [txt("Crows play an important part of the ecosystem.")]),
          txt("\n"),
          el("video", { controls: "controls", height: "240", width: "320" }, [
            txt("\n"),
            el("source", { src: "resources/crow_movie.mp4", type: "video/mp4" }),
            txt("\n"),
            el("source", { src: "resources/crow_movie.ogg", type: "video/ogg" }),
            txt("\n"),
            el("track", { kind: "subtitles", src: "resources/subtitles_en.vtt", srclang: "en" }),
            txt("\n"),
          ]),
        ]);
        const root = rootOf(nodes);

        assert.isTrue(roundTrips(root));
        assert.deepStrictEqual(checkTree(root, { baseLevel: 2 }), []);
        assert.deepStrictEqual(
          elementsIn(nodes).map((element) => element.tag),
          ["div", "img", "p", "video", "source", "source", "track"],
        );
        assert.strictEqual(
          elementsIn(nodes).find((element) => element.tag === "img")?.attrs["alt"],
          "Picture of crows roosting in a tree",
        );
      }),
  );

  it.effect(
    "[I-7] [I-8] a BG010-shaped quote with an inline interaction round-trips, the interaction in place",
    () =>
      Effect.gen(function* bg010() {
        const nodes = yield* emit([
          el("div", {}, [
            el("blockquote", {}, [
              el("p", {}, [
                txt("Now is the winter of our discontent"),
                el("br"),
                txt("Made glorious summer by this sun of "),
                textEntry,
                txt(";"),
                el("br"),
                txt("And all the clouds that lour'd upon our house"),
              ]),
            ]),
          ]),
        ]);

        assert.isTrue(roundTrips(rootOf(nodes)));
        assert.deepStrictEqual(
          elementsIn(nodes).map((element) => element.tag),
          ["div", "blockquote", "p", "br", "span", "br"],
        );
        assert.strictEqual(
          elementsIn(nodes).find((element) => element.tag === "span")?.attrs["data-response"],
          "RESPONSE",
        );
      }),
  );

  it.effect("[I-8] headings shift so h1 sits at the heading level, capped at h6", () =>
    Effect.gen(function* headings() {
      const nodes = yield* emit([
        el("h1", {}, [txt("A")]),
        el("h3", {}, [txt("B")]),
        el("h6", {}, [txt("C")]),
      ]);

      assert.deepStrictEqual(nodes, [
        h("h2", {}, [text("A")]),
        h("h4", {}, [text("B")]),
        h("h6", {}, [text("C")]),
      ]);
    }),
  );

  it.effect("[I-8] rows directly under a table gain one tbody, so the table round-trips", () =>
    Effect.gen(function* table() {
      const nodes = yield* emit([
        el("table", {}, [
          el("caption", {}, [txt("Crows")]),
          txt("\n"),
          row("1"),
          txt("\n"),
          row("2"),
          txt("\n"),
        ]),
      ]);

      assert.deepStrictEqual(nodes, [
        h("table", {}, [
          h("caption", {}, [text("Crows")]),
          text("\n"),
          h("tbody", {}, [emittedRow("1"), text("\n"), emittedRow("2")]),
          text("\n"),
        ]),
      ]);
      assert.isTrue(nodes.every(roundTrips));
    }),
  );

  it.effect("[I-8] an authored id and the aria-labelledby naming it are scoped alike", () =>
    Effect.gen(function* ids() {
      const nodes = yield* emit([
        el("p", { id: "q1" }, [txt("Question")]),
        el("div", { "aria-labelledby": "q1", role: "group" }, [txt("Body")]),
      ]);
      const [paragraph, group] = elementsIn(nodes);

      assert.strictEqual(paragraph?.attrs["id"], "i1--q1");
      assert.strictEqual(group?.attrs["aria-labelledby"], "i1--q1");
    }),
  );

  it.effect("[I-8] every IDREF attribute is rewritten, each id of a list in turn", () =>
    Effect.gen(function* references() {
      const nodes = yield* emit([
        el("div", {
          "aria-activedescendant": "a",
          "aria-controls": "b c",
          "aria-describedby": "d\te",
          "aria-details": "f",
          "aria-errormessage": "g",
          "aria-flowto": "h",
          "aria-labelledby": "i",
          "aria-owns": "j  k",
        }),
        el("table", {}, [
          el("tbody", {}, [el("tr", {}, [el("td", { headers: "l m" }, [txt("1")])])]),
        ]),
      ]);
      const [owner] = elementsIn(nodes);
      const cell = elementsIn(nodes).find((element) => element.tag === "td");

      assert.deepStrictEqual(owner?.attrs, {
        "aria-activedescendant": "i1--a",
        "aria-controls": "i1--b i1--c",
        "aria-describedby": "i1--d i1--e",
        "aria-details": "i1--f",
        "aria-errormessage": "i1--g",
        "aria-flowto": "i1--h",
        "aria-labelledby": "i1--i",
        "aria-owns": "i1--j i1--k",
      });
      assert.strictEqual(cell?.attrs["headers"], "i1--l i1--m");
    }),
  );

  it.effect("[I-8] an authored id spelled like a Control's id stays distinct from it", () =>
    Effect.gen(function* controlId() {
      const nodes = yield* emit([el("p", { id: "RESPONSE-control-0" }, [txt("Pick")]), choice]);
      const ids = idsIn(nodes);

      assert.deepStrictEqual(ids, ["i1--RESPONSE-control-0", "i1-RESPONSE-control-0"]);
      assert.strictEqual(new Set(ids).size, 2);
    }),
  );

  it.effect("[I-8] authored ids item and status miss the Root's and the Status region's ids", () =>
    Effect.gen(function* chromeIds() {
      const nodes = yield* emit([el("p", { id: "item" }), el("p", { id: "status" })]);
      const ids = idsIn(nodes);

      assert.strictEqual(ids.length, 2);
      assert.notInclude(ids, scopedId(instance, "item"));
      assert.notInclude(ids, scopedId(instance, "status"));
    }),
  );

  it.effect("[I-8] xml:lang becomes lang, class stays the author's", () =>
    Effect.gen(function* lang() {
      const nodes = yield* emit([el("p", { class: "big quote", "xml:lang": "fr" }, [txt("Oui")])]);

      assert.deepStrictEqual(nodes, [h("p", { class: "big quote", lang: "fr" }, [text("Oui")])]);
    }),
  );

  it.effect("[I-8] xml:lang wins over an authored lang on the same element", () =>
    Effect.gen(function* langConflict() {
      const nodes = yield* emit([el("span", { lang: "de", "xml:lang": "fr" }, [txt("Oui")])]);

      assert.deepStrictEqual(nodes, [h("span", { lang: "fr" }, [text("Oui")])]);
    }),
  );

  it.effect(
    "[I-8] an event-handler attribute is dropped, so the serialiser writes the element",
    () =>
      Effect.gen(function* handlers() {
        const nodes = yield* emit([el("p", { ONCLICK: "x()", onclick: "alert(1)", title: "t" })]);

        assert.deepStrictEqual(nodes, [h("p", { title: "t" })]);
        assert.strictEqual(nodes.map(toHtml).join(""), '<p title="t"></p>');
      }),
  );

  it.effect("[Q-31] [Q-32] a notice is a phrasing note placeholder naming the feature", () =>
    Effect.gen(function* notice() {
      const nodes = yield* emit([
        el("p", {}, [txt("See "), { feature: "qti-portable-custom-interaction", kind: "notice" }]),
      ]);

      assert.deepStrictEqual(nodes, [
        h("p", {}, [
          text("See "),
          h("span", { "data-slot": rowFor("item", "notice").slot, role: "note" }, [
            text(message("en", "notice", { feature: "qti-portable-custom-interaction" })),
          ]),
        ]),
      ]);
      assert.isTrue(nodes.every(roundTrips));
    }),
  );
});

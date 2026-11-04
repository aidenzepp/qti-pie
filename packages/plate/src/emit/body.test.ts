import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { emitBody, htmlSubset } from "#plate/emit/body.ts";
import type { RenderInteraction } from "#plate/emit/body.ts";
import { h, text } from "#plate/emit/node.ts";
import type { Element, Node } from "#plate/emit/node.ts";
import { resolveOverrides, rowFor, scopedId } from "#plate/emit/parts.ts";
import type { PartOverrides } from "#plate/emit/parts.ts";
import { toHtml } from "#plate/emit/serialise.ts";
import { entryName } from "#plate/form/encoding.ts";
import { renderChoice } from "#plate/interactions/choice.ts";
import { message } from "#plate/messages.ts";
import type {
  ChoicePayload,
  ElementPayload,
  EmitState,
  NoticePayload,
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
 * Build a payload around a body, with no messages and every control enabled.
 *
 * @param body The body's payload nodes.
 * @returns The payload.
 */
const payloadOf = (body: readonly PayloadNode[]): Payload => ({
  body,
  finished: false,
  instance,
  lang: "en",
  messages: [],
  mode: "answering",
  notices: [],
  title: "Item",
});

/**
 * Build the notice `check` hands in for a feature, in place of an unsupported part or beside an
 * element whose URL attribute it dropped.
 *
 * @param feature The feature's key.
 * @returns The notice payload.
 */
const notice = (feature: string): NoticePayload => ({ feature, kind: "notice" });

/**
 * Give the emit state.
 *
 * @param headingLevel The configured heading level.
 * @param assetBase The base package paths are rebased onto, `""` by default.
 * @param overrides The part overrides, none by default.
 * @returns The emit state.
 */
const stateAt = (
  headingLevel: number,
  assetBase = "",
  overrides: PartOverrides = {},
): Effect.Effect<EmitState> =>
  Effect.map(Effect.orDie(Effect.fromResult(resolveOverrides(overrides))), (parts) => ({
    assetBase,
    headingLevel,
    locale: "en",
    parts,
  }));

/**
 * An interaction render stub: a `span` naming the response, or, for a Choice, the first Control's
 * `input` with the id its connect function writes.
 */
const stub: RenderInteraction = (interaction) =>
  Result.succeed(
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
  Effect.flatMap(stateAt(headingLevel), (state) =>
    Effect.fromResult(emitBody(payloadOf(body), state, stub)),
  );

/**
 * Emit a body at heading level 2 with package paths rebased onto an asset base.
 *
 * @param body The body's payload nodes.
 * @param assetBase The asset base.
 * @returns The emitted nodes.
 */
const emitAt = (
  body: readonly PayloadNode[],
  assetBase: string,
): Effect.Effect<readonly Node[], unknown> =>
  Effect.flatMap(stateAt(2, assetBase), (state) =>
    Effect.fromResult(emitBody(payloadOf(body), state, stub)),
  );

/**
 * The Notice part as it renders by default: the note naming the feature, a `span` at a phrasing
 * position and a `div` at a flow position.
 *
 * @param feature The feature's key.
 * @param tag The element its position gives.
 * @returns The Notice element.
 */
const noticeElement = (feature: string, tag: "div" | "span"): Element =>
  h(tag, { "data-slot": rowFor("item", "notice").slot, role: "note" }, [
    text(message("en", "notice", { feature })),
  ]);

/**
 * Collect the elements of a node list in document order, descendants included.
 *
 * @param nodes The nodes.
 * @returns Every element at or below them.
 */
const elementsIn = (nodes: readonly Node[]): readonly Element[] =>
  nodes.flatMap((node) => (node.kind === "element" ? [node, ...elementsIn(node.children)] : []));

/**
 * Collect, for each element of a node list in document order, the URL it fetches: its `src`, else
 * its `poster`, else its `data`.
 *
 * @param nodes The nodes.
 * @returns One value per element, undefined for an element with none of the three.
 */
const fetchedUrlsIn = (nodes: readonly Node[]): readonly (string | true | undefined)[] =>
  elementsIn(nodes).map(({ attrs }) => attrs["src"] ?? attrs["poster"] ?? attrs["data"]);

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
 * A Text Entry bound to `RESPONSE`, unnamed, with no message.
 */
const textEntry: TextEntryPayload = {
  autofocus: false,
  base: 10,
  baseType: "string",
  class: "",
  expectedLength: Option.none(),
  formName: entryName(instance, "RESPONSE"),
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
 * A single Choice bound to `RESPONSE`, with no Prompt and no message.
 */
const choice: ChoicePayload = {
  ariaLabel: Option.none(),
  ariaLabelledby: Option.none(),
  autofocus: false,
  cardinality: "single",
  choices: [{ content: [txt("Red")], identifier: "A" }],
  class: "",
  formName: entryName(instance, "RESPONSE"),
  invalid: false,
  kind: "choice",
  maxChoices: 1n,
  messageIds: [],
  minChoices: 0n,
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
  it("returns a Result, a plain function callable with no Effect runtime", () => {
    const state: EmitState = {
      assetBase: "",
      headingLevel: 2,
      locale: "en",
      parts: Result.getOrThrow(resolveOverrides()),
    };
    const emitted = emitBody(payloadOf([el("p", {}, [txt("Kept")])]), state, stub);
    assert.isTrue(Result.isResult(emitted));
    assert.isTrue(Result.isSuccess(emitted));
    assert.deepStrictEqual(Result.getOrThrow(emitted), [h("p", {}, [text("Kept")])]);
  });

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
        assert.deepStrictEqual(
          elementsIn(nodes).map(({ attrs }) => Object.keys(attrs).toSorted()),
          [
            [],
            ["alt", "height", "src", "width"],
            [],
            ["controls", "height", "width"],
            ["src", "type"],
            ["src", "type"],
            ["kind", "src", "srclang"],
          ],
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
        const nodes = yield* emit([el("p", { ONCLICK: "x()", class: "t", onclick: "alert(1)" })]);

        assert.deepStrictEqual(nodes, [h("p", { class: "t" })]);
        assert.strictEqual(nodes.map(toHtml).join(""), '<p class="t"></p>');
      }),
  );

  it.effect(
    "[Q-31] [Q-32] a notice inside a p is a span Notice that round-trips and passes the checks",
    () =>
      Effect.gen(function* phrasingNotice() {
        const nodes = yield* emit([
          el("p", {}, [txt("See "), notice("qti-portable-custom-interaction"), txt(" here.")]),
        ]);

        assert.deepStrictEqual(nodes, [
          h("p", {}, [
            text("See "),
            noticeElement("qti-portable-custom-interaction", "span"),
            text(" here."),
          ]),
        ]);
        assert.isTrue(roundTrips(rootOf(nodes)));
        assert.deepStrictEqual(checkTree(rootOf(nodes), { baseLevel: 2 }), []);
      }),
  );

  it.effect(
    "[Q-31] [Q-32] a hotspot notice under a flow parent is a div Notice, and the rest renders",
    () =>
      Effect.gen(function* flowNotice() {
        const nodes = yield* emit([
          el("div", {}, [
            el("p", {}, [txt("Before")]),
            notice("qti-hotspot-interaction"),
            el("p", {}, [txt("After")]),
          ]),
        ]);

        assert.deepStrictEqual(nodes, [
          h("div", {}, [
            h("p", {}, [text("Before")]),
            noticeElement("qti-hotspot-interaction", "div"),
            h("p", {}, [text("After")]),
          ]),
        ]);
        assert.isTrue(roundTrips(rootOf(nodes)));
        assert.deepStrictEqual(checkTree(rootOf(nodes), { baseLevel: 2 }), []);
      }),
  );

  it.effect("[Q-31] a notice in a span under a p stays a span, so the p is never closed", () =>
    Effect.gen(function* nestedPhrasing() {
      const nodes = yield* emit([
        el("p", {}, [el("span", {}, [notice("qti-hotspot-interaction")])]),
      ]);

      assert.deepStrictEqual(nodes, [
        h("p", {}, [h("span", {}, [noticeElement("qti-hotspot-interaction", "span")])]),
      ]);
      assert.isTrue(roundTrips(rootOf(nodes)));
    }),
  );

  it.effect("[Q-31] the Notice goes through its part replacement", () =>
    Effect.gen(function* swappedNotice() {
      const state = yield* stateAt(2, "", {
        // The replacement writes no props of its own; applyPart writes the Notice's over it (I1).
        item: { notice: (_props, children) => h("strong", { class: "notice" }, children) },
      });
      const nodes = yield* Effect.fromResult(
        emitBody(payloadOf([notice("qti-hotspot-interaction")]), state, stub),
      );

      assert.deepStrictEqual(nodes, [
        h("strong", { class: "notice", "data-slot": rowFor("item", "notice").slot, role: "note" }, [
          text(message("en", "notice", { feature: "qti-hotspot-interaction" })),
        ]),
      ]);
    }),
  );
});

describe("emitBody, URLs", () => {
  it.effect(
    "[I-8] [A-1] an img whose src check dropped keeps its alt, and the Notice follows it",
    () =>
      Effect.gen(function* droppedSrc() {
        // check's secured form of <img src="javascript:alert(1)" alt="x">: no src, its notice beside.
        const nodes = yield* emit([el("img", { alt: "x" }), notice("url-scheme:javascript")]);

        assert.deepStrictEqual(nodes, [
          h("img", { alt: "x" }),
          noticeElement("url-scheme:javascript", "div"),
        ]);
        assert.isTrue(roundTrips(rootOf(nodes)));
      }),
  );

  it.effect(
    "[I-8] a link in a p keeps its text and loses its href, with a span Notice beside",
    () =>
      Effect.gen(function* droppedHref() {
        // check's secured form of <p><a href="javascript:x">read more</a></p>.
        const nodes = yield* emit([
          el("p", {}, [el("a", {}, [txt("read more")]), notice("url-scheme:javascript")]),
        ]);

        assert.deepStrictEqual(nodes, [
          h("p", {}, [
            h("a", {}, [text("read more")]),
            noticeElement("url-scheme:javascript", "span"),
          ]),
        ]);
        assert.isTrue(roundTrips(rootOf(nodes)));
        assert.deepStrictEqual(checkTree(rootOf(nodes), { baseLevel: 2 }), []);
      }),
  );

  it.effect("[I-8] a bare link check dropped renders as its Notice only", () =>
    Effect.gen(function* bareLink() {
      // check's secured form of <a href="data:text/html,x"></a>: the notice in the link's place.
      const nodes = yield* emit([notice("url-scheme:data")]);

      assert.deepStrictEqual(nodes, [noticeElement("url-scheme:data", "div")]);
      assert.isTrue(roundTrips(rootOf(nodes)));
    }),
  );

  it.effect(
    "[I-8] a blockquote whose cite check dropped keeps its content, a div Notice after",
    () =>
      Effect.gen(function* droppedCite() {
        // check's secured form of <blockquote cite="data:x"><p>Quoted</p></blockquote>.
        const nodes = yield* emit([
          el("blockquote", {}, [el("p", {}, [txt("Quoted")])]),
          notice("url-scheme:data"),
        ]);

        assert.deepStrictEqual(nodes, [
          h("blockquote", {}, [h("p", {}, [text("Quoted")])]),
          noticeElement("url-scheme:data", "div"),
        ]);
        assert.isTrue(roundTrips(rootOf(nodes)));
      }),
  );

  it.effect("[I-8] a package-relative src resolves against the asset base", () =>
    Effect.gen(function* rebased() {
      const body = [
        el("img", { alt: "Crows", src: "resources/crows.jpg" }),
        el("video", { controls: "controls", poster: "poster%20one.png" }, [
          el("source", { src: "movie.mp4", type: "video/mp4" }),
          el("track", { kind: "subtitles", src: "subtitles_en.vtt", srclang: "en" }),
        ]),
        el("object", { data: "orkney1.svg", type: "image/svg+xml" }, [txt("Orkney")]),
      ];
      const expected = [
        "https://cdn.example/pkg/resources/crows.jpg",
        "https://cdn.example/pkg/poster%20one.png",
        "https://cdn.example/pkg/movie.mp4",
        "https://cdn.example/pkg/subtitles_en.vtt",
        "https://cdn.example/pkg/orkney1.svg",
      ];

      assert.deepStrictEqual(
        fetchedUrlsIn(yield* emitAt(body, "https://cdn.example/pkg/")),
        expected,
      );
      assert.deepStrictEqual(
        fetchedUrlsIn(yield* emitAt(body, "https://cdn.example/pkg")),
        expected,
      );
      assert.deepStrictEqual(fetchedUrlsIn(yield* emit(body)), [
        "resources/crows.jpg",
        "poster%20one.png",
        "movie.mp4",
        "subtitles_en.vtt",
        "orkney1.svg",
      ]);
    }),
  );

  it.effect(
    "[I-8] a remote http or https URL stays as check wrote it, whatever the asset base",
    () =>
      Effect.gen(function* remote() {
        const nodes = yield* emitAt(
          [
            el("img", { alt: "x", src: "http://example.org/a.png" }),
            el("a", { href: "https://example.org/page?q=1#top" }, [txt("page")]),
          ],
          "https://cdn.example/pkg/",
        );

        assert.deepStrictEqual(
          elementsIn(nodes).map(({ attrs }) => attrs["src"] ?? attrs["href"]),
          ["http://example.org/a.png", "https://example.org/page?q=1#top"],
        );
      }),
  );

  it.effect(
    "[I-8] each package candidate of a srcset is rebased, remote ones and descriptors kept",
    () =>
      Effect.gen(function* srcset() {
        const nodes = yield* emitAt(
          [
            el("picture", {}, [
              el("source", {
                srcset: "small.png 1x, https://cdn.other/big.png 2x",
                type: "image/png",
              }),
              el("img", { alt: "x", src: "small.png" }),
            ]),
          ],
          "https://cdn.example/pkg/",
        );
        const source = elementsIn(nodes).find((element) => element.tag === "source");

        assert.strictEqual(
          source?.attrs["srcset"],
          "https://cdn.example/pkg/small.png 1x, https://cdn.other/big.png 2x",
        );
      }),
  );

  it.effect("[I-8] a same-document #id is scoped as the id it names, and a bare # stays", () =>
    Effect.gen(function* fragments() {
      const nodes = yield* emitAt(
        [
          el("p", { id: "q1" }, [txt("Question")]),
          el("p", {}, [
            el("a", { href: "#q1" }, [txt("back")]),
            el("q", { cite: "#q1" }, [txt("quoted")]),
            el("a", { href: "#" }, [txt("top")]),
          ]),
        ],
        "https://cdn.example/pkg/",
      );
      const [target, , back, quote, top] = elementsIn(nodes);

      assert.strictEqual(target?.attrs["id"], "i1--q1");
      assert.strictEqual(back?.attrs["href"], "#i1--q1");
      assert.strictEqual(quote?.attrs["cite"], "#i1--q1");
      assert.strictEqual(top?.attrs["href"], "#");
    }),
  );

  it.effect(
    "[I-8] a URL url.ts refuses is never written, even in a payload check did not secure",
    () =>
      Effect.gen(function* unsecured() {
        const nodes = yield* emit([
          el("p", {}, [el("a", { class: "t", href: "java\tscript:alert(1)" }, [txt("read")])]),
          el("img", { alt: "x", src: "data:image/png;base64,AAAA" }),
          el("object", { data: "https://evil.example/x.svg" }, [txt("fallback")]),
          el("audio", { src: "/etc/passwd" }),
        ]);

        assert.deepStrictEqual(nodes, [
          h("p", {}, [h("a", { class: "t" }, [text("read")])]),
          h("img", { alt: "x" }),
          h("object", {}, [text("fallback")]),
          h("audio", {}),
        ]);
      }),
  );
});

/**
 * A script URL: test input the walk must never write.
 */
// oxlint-disable-next-line eslint/no-script-url -- the value is test input the emitter must drop, never a URL this code navigates to.
const scriptUrl = "javascript:alert(1)";

describe("emitBody, the XSD's HTML subset", () => {
  // Every payload here is built by hand, as a `Redacted` that crossed the network as JSON and lost
  // its type would arrive: no `check`, no `redactItem`. The emitter must not trust it.

  it.effect("[I-8] script, form and iframe elements are dropped with their subtrees", () =>
    Effect.gen(function* droppedElements() {
      const nodes = yield* emit([
        el("div", {}, [
          el("script", {}, [txt("alert(1)")]),
          el("form", { action: "https://evil.example/" }, [el("p", {}, [txt("Inside")])]),
          el("iframe", { src: "https://evil.example/" }, [txt("Frame")]),
          el("p", {}, [txt("Kept")]),
        ]),
      ]);

      assert.deepStrictEqual(nodes, [h("div", {}, [h("p", {}, [text("Kept")])])]);
    }),
  );

  it.effect(
    "[I-8] a p keeps only lang: handlers, style and every undeclared data-* are dropped",
    () =>
      Effect.gen(function* undeclaredAttributes() {
        const nodes = yield* emit([
          el(
            "p",
            {
              "data-foo": "1",
              "data-mode": "review",
              "data-slot": "choice-interaction-control",
              lang: "fr",
              onclick: "x",
              style: "color:red",
            },
            [txt("Oui")],
          ),
        ]);

        assert.deepStrictEqual(nodes, [h("p", { lang: "fr" }, [text("Oui")])]);
      }),
  );

  it.effect("[I-8] a javascript: href placed straight into the payload is dropped", () =>
    Effect.gen(function* javascriptHref() {
      const nodes = yield* emit([el("a", { href: scriptUrl }, [txt("read")])]);

      assert.deepStrictEqual(nodes, [h("a", {}, [text("read")])]);
    }),
  );

  it.effect("[I-8] names are matched exactly: a mixed-case element or attribute is dropped", () =>
    Effect.gen(function* mixedCase() {
      const nodes = yield* emit([
        el("A", { href: scriptUrl }, [txt("upper")]),
        el("a", { HREF: scriptUrl }, [txt("read")]),
        el("img", { Src: scriptUrl, alt: "x" }),
      ]);

      assert.deepStrictEqual(nodes, [h("a", {}, [text("read")]), h("img", { alt: "x" })]);
    }),
  );

  it.effect("[I-8] [A-1] an img keeps src and alt, src in its parsed form", () =>
    Effect.gen(function* keptImage() {
      const nodes = yield* emit([el("img", { alt: "x", src: "HTTPS://CDN.Example/x.png" })]);

      assert.deepStrictEqual(nodes, [h("img", { alt: "x", src: "https://cdn.example/x.png" })]);
    }),
  );

  it.effect("[I-8] label loses for, which the XSD does not declare on it", () =>
    Effect.gen(function* labelFor() {
      const nodes = yield* emit([el("label", { for: "x" }, [txt("Name")])]);

      assert.deepStrictEqual(nodes, [h("label", {}, [text("Name")])]);
    }),
  );

  it.effect("[I-8] either spelling of aria-keyshortcuts on an empty element writes ARIA's", () =>
    Effect.gen(function* keyShortcuts() {
      const nodes = yield* emit([
        el("br", { "aria-keyshorts": "Alt+B" }),
        el("hr", { "aria-keyshortcuts": "Alt+H" }),
        el("p", { "aria-keyshortcuts": "Alt+P" }, [txt("P")]),
      ]);

      assert.deepStrictEqual(nodes, [
        h("br", { "aria-keyshortcuts": "Alt+B" }),
        h("hr", { "aria-keyshortcuts": "Alt+H" }),
        h("p", { "aria-keyshortcuts": "Alt+P" }, [text("P")]),
      ]);
    }),
  );

  it.effect("[I-8] a node of a kind the payload does not define is dropped", () =>
    Effect.gen(function* unknownKind() {
      // A JSON payload can carry any object; this one would serialise as an iframe if kept.
      const parsed: unknown = JSON.parse(
        '{"attrs":{"src":"https://evil.example/"},"children":[],"kind":"raw","tag":"iframe"}',
      );
      // SAFETY: none holds, on purpose: a payload that crossed the network reaches the walk typed `PayloadNode`, whatever it holds.
      // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The SAFETY note above: the test stands in for a payload that lost its type.
      const smuggled = parsed as PayloadNode;
      const nodes = yield* emit([el("p", {}, [smuggled, txt("Kept")])]);

      assert.deepStrictEqual(nodes, [h("p", {}, [text("Kept")])]);
    }),
  );

  it.effect(
    "[Q-2] [I-8] a data-slot in choice content is dropped, the real Control keeps its marker",
    () =>
      Effect.gen(function* choiceMarker() {
        const marker = rowFor("choice-interaction", "control").slot;
        const marked: ChoicePayload = {
          ...choice,
          choices: [
            { content: [el("span", { "data-slot": marker }, [txt("Red")])], identifier: "A" },
          ],
        };
        const state = yield* stateAt(2);
        const root = yield* Effect.fromResult(renderChoice(marked, payloadOf([marked]), state));
        const slotted = elementsIn([root]).filter(({ attrs }) => attrs["data-slot"] === marker);
        const content = elementsIn([root]).find(
          ({ children, tag }) => tag === "span" && children[0]?.kind === "text",
        );

        assert.deepStrictEqual(
          slotted.map((element) => element.tag),
          ["input"],
        );
        assert.deepStrictEqual(content, h("span", {}, [text("Red")]));
      }),
  );

  it("[I-8] htmlSubset holds the XSD's 76 HTML elements, none of them executable or global", () => {
    assert.strictEqual(htmlSubset.size, 76);

    for (const tag of ["script", "style", "form", "iframe", "embed", "base", "link", "meta"]) {
      assert.isFalse(htmlSubset.has(tag), tag);
    }
  });

  it("[I-8] htmlSubset names every element and attribute in lower case, so lookups are exact", () => {
    for (const [tag, attributes] of htmlSubset) {
      assert.strictEqual(tag, tag.toLowerCase());

      for (const attribute of attributes) {
        assert.strictEqual(attribute, attribute.toLowerCase(), `${tag}@${attribute}`);
        assert.isFalse(attribute.startsWith("on") || attribute === "style", `${tag}@${attribute}`);
      }
    }
  });
});

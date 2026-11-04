import { assert, describe, it } from "@effect/vitest";
import { Effect, Option } from "effect";
import { h, text } from "#plate/emit/node.ts";
import type { Attributes, Node } from "#plate/emit/node.ts";
import {
  allows,
  controls,
  isFlowContainer,
  isPhrasingContainer,
  links,
  lists,
  partForSlot,
  partTable,
  positionUnder,
  promptMarkupFor,
  resolveOverrides,
  rowFor,
  scopedId,
} from "#plate/emit/parts.ts";

/**
 * The spec's part table (§4.3), one entry per row: interaction, part, `data-slot` marker and
 * default element. The markers are the operator's ruling (rule `0e767b8d`): a Root carries its
 * component's name, and every other part `<component>-<part>` in kebab case.
 */
const specRows = [
  ["item", "root", "item", "qti-assessment-item"],
  ["item", "form", "item-form", "form"],
  ["item", "status", "item-status", "section"],
  ["item", "statusHeading", "item-status-heading", "h1"],
  ["item", "messages", "item-messages", "ul"],
  ["item", "message", "item-message", "li"],
  ["item", "submit", "item-submit", "button"],
  ["item", "notice", "item-notice", "span"],
  ["choice-interaction", "root", "choice-interaction", "fieldset"],
  ["choice-interaction", "prompt", "choice-interaction-prompt", "qti-prompt"],
  ["choice-interaction", "choices", "choice-interaction-choices", "ul"],
  ["choice-interaction", "choice", "choice-interaction-choice", "li"],
  ["choice-interaction", "control", "choice-interaction-control", "input"],
  ["choice-interaction", "indicator", "choice-interaction-indicator", "span"],
  ["choice-interaction", "label", "choice-interaction-label", "label"],
  ["text-entry-interaction", "root", "text-entry-interaction", "qti-text-entry-interaction"],
  ["text-entry-interaction", "control", "text-entry-interaction-control", "input"],
  [
    "extended-text-interaction",
    "root",
    "extended-text-interaction",
    "qti-extended-text-interaction",
  ],
  ["extended-text-interaction", "prompt", "extended-text-interaction-prompt", "qti-prompt"],
  ["extended-text-interaction", "control", "extended-text-interaction-control", "textarea"],
] as const;

/**
 * A replacement part function that returns a `span` holding the children it was handed.
 *
 * @param props The attributes the part carries.
 * @param children The nodes the part holds.
 * @returns A `span` with `props` and `children`.
 */
const indicator = (props: Attributes, children: readonly Node[]) => h("span", props, children);

/**
 * A replacement for a part the Choice interaction does not have.
 *
 * @param props The attributes the part carries.
 * @returns A `span` with `props`, reading "new".
 */
const badge = (props: Attributes) => h("span", props, [text("new")]);

describe("partTable", () => {
  it("holds every row of the spec's table once, with its slot and default element", () => {
    assert.strictEqual(partTable.length, specRows.length);
    for (const [interaction, part, slot, element] of specRows) {
      const rows = partTable.filter((row) => row.interaction === interaction && row.part === part);
      assert.strictEqual(rows.length, 1, `${interaction} ${part}`);
      assert.strictEqual(rows[0]?.slot, slot, `${interaction} ${part}`);
      assert.strictEqual(rows[0]?.element, element, `${interaction} ${part}`);
    }
  });

  it("gives every marker once across the table", () => {
    const slots = partTable.map((row) => row.slot);
    assert.strictEqual(new Set(slots).size, slots.length);
  });

  it("resolves every row's marker back to its interaction and part", () => {
    for (const row of partTable) {
      assert.deepStrictEqual(Option.getOrUndefined(partForSlot(row.slot)), {
        interaction: row.interaction,
        part: row.part,
      });
    }
  });

  it("resolves no part from a bare part name or an unknown marker", () => {
    for (const slot of ["root", "prompt", "status", "status-heading", "choice-interaction-badge"]) {
      assert.isTrue(Option.isNone(partForSlot(slot)), slot);
    }
  });

  it("marks only Choices as the owner of a list", () => {
    const owners = partTable.filter((row) => row.listOwner).map((row) => row.part);
    assert.deepStrictEqual(owners, ["choices"]);
    assert.isTrue(rowFor("choice-interaction", "choices").listOwner);
  });

  it("records the attributes I1 merges onto the Choice Control", () => {
    assert.deepStrictEqual(rowFor("choice-interaction", "control").merged, [
      "id",
      "name",
      "type",
      "value",
      "checked",
      "disabled",
      "aria-labelledby",
      "aria-invalid",
      "aria-describedby",
    ]);
  });
});

describe("rowFor", () => {
  it("makes the Notice a span at a phrasing position and a div at a flow position", () => {
    const phrasing = rowFor("item", "notice", { position: "phrasing" });
    const flow = rowFor("item", "notice", { position: "flow" });
    assert.strictEqual(phrasing.element, "span");
    assert.strictEqual(phrasing.tagClass, "phrasing-container");
    assert.strictEqual(flow.element, "div");
    assert.strictEqual(flow.tagClass, "flow-container");
  });

  it("makes the StatusHeading the heading of the given level", () => {
    assert.strictEqual(rowFor("item", "statusHeading", { headingLevel: 3 }).element, "h3");
  });

  it("makes the Choice Prompt a legend first in its fieldset under the legend markup", () => {
    const prompt = rowFor("choice-interaction", "prompt", { promptMarkup: "legend" });
    const root = rowFor("choice-interaction", "root", { promptMarkup: "legend" });
    assert.strictEqual(prompt.element, "legend");
    assert.strictEqual(prompt.tagClass, "legend");
    assert.deepStrictEqual(prompt.merged, []);
    assert.strictEqual(prompt.slot, "choice-interaction-prompt");
    assert.strictEqual(root.element, "fieldset");
    assert.isTrue(root.legendOwner);
    assert.deepStrictEqual(root.merged, []);
  });

  it("keeps the Choice Prompt its own element, named by the Root, under the labelledby markup", () => {
    for (const context of [{}, { promptMarkup: "labelledby" } as const]) {
      const prompt = rowFor("choice-interaction", "prompt", context);
      const root = rowFor("choice-interaction", "root", context);
      assert.strictEqual(prompt.element, "qti-prompt");
      assert.deepStrictEqual(prompt.merged, ["id"]);
      assert.strictEqual(root.element, "fieldset");
      assert.isFalse(root.legendOwner);
      assert.deepStrictEqual(root.merged, ["aria-labelledby"]);
    }
  });

  it("gives the Extended Text Prompt no legend markup", () => {
    const prompt = rowFor("extended-text-interaction", "prompt", { promptMarkup: "legend" });
    assert.strictEqual(prompt.element, "qti-prompt");
  });
});

describe("promptMarkupFor", () => {
  it("gives the legend markup to a prompt of phrasing content only", () => {
    const phrasing = [
      [],
      [text("Which city is the capital of France?")],
      [
        text("Pick "),
        h("em", {}, [text("one")]),
        h("img", { alt: "A map", src: "map.png" }),
        h("a", { href: "#x" }, [h("strong", {}, [text("city")])]),
        h("br", {}),
        h("span", { role: "note" }, [text("Not shown.")]),
        h("math", {}, [h("mi", {}, [text("x")])]),
      ],
    ];
    for (const content of phrasing) {
      assert.strictEqual(promptMarkupFor(content), "legend");
    }
  });

  it("gives the labelledby markup to a prompt holding a paragraph, a list or a div", () => {
    const blocks = [
      [h("p", {}, [text("Which city is the capital of France?")])],
      [text("Pick one:"), h("ul", {}, [h("li", {}, [text("Paris")])])],
      [h("span", {}, [h("div", { role: "note" }, [text("Not shown.")])])],
      [h("a", { href: "#x" }, [h("p", {}, [text("A link around a paragraph.")])])],
    ];
    for (const content of blocks) {
      assert.strictEqual(promptMarkupFor(content), "labelledby");
    }
  });
});

describe("allows", () => {
  it("accepts each row's default element", () => {
    const rows = [
      ...partTable,
      rowFor("item", "notice", { position: "flow" }),
      rowFor("item", "statusHeading", { headingLevel: 6 }),
      rowFor("choice-interaction", "prompt", { promptMarkup: "legend" }),
      rowFor("choice-interaction", "root", { promptMarkup: "legend" }),
    ];
    for (const row of rows) {
      assert.isTrue(allows(row, h(row.element, {})), `${row.interaction} ${row.part}`);
    }
  });

  it("refuses an input for a Choice Root", () => {
    assert.isFalse(allows(rowFor("choice-interaction", "root"), h("input", {})));
  });

  it("refuses a div for a Control", () => {
    assert.isFalse(allows(rowFor("choice-interaction", "control"), h("div", {})));
    assert.isFalse(allows(rowFor("text-entry-interaction", "control"), h("div", {})));
    assert.isFalse(allows(rowFor("extended-text-interaction", "control"), h("div", {})));
  });

  it("refuses an input of type checkbox for the Text Entry Control", () => {
    const row = rowFor("text-entry-interaction", "control");
    assert.isFalse(allows(row, h("input", { type: "checkbox" })));
    assert.isTrue(allows(row, h("input", { type: "text" })));
  });

  it("refuses a ul for a Root", () => {
    assert.isFalse(allows(rowFor("item", "root"), h("ul", {})));
    assert.isFalse(allows(rowFor("choice-interaction", "root"), h("ul", {})));
    assert.isFalse(allows(rowFor("extended-text-interaction", "root"), h("ul", {})));
  });

  it("accepts a div for Choices and for a Choice, and a custom element for an Extended Text Root", () => {
    assert.isTrue(allows(rowFor("choice-interaction", "choices"), h("div", {})));
    assert.isTrue(allows(rowFor("choice-interaction", "choice"), h("div", {})));
    assert.isTrue(allows(rowFor("extended-text-interaction", "root"), h("my-essay", {})));
  });

  it("keeps the Choice Root a native fieldset under either Prompt markup", () => {
    for (const promptMarkup of ["legend", "labelledby"] as const) {
      const row = rowFor("choice-interaction", "root", { promptMarkup });
      assert.isTrue(allows(row, h("fieldset", {})), promptMarkup);
      assert.isFalse(allows(row, h("div", {})), promptMarkup);
      assert.isFalse(allows(row, h("my-group", {})), promptMarkup);
    }
  });

  it("keeps a legend Prompt a legend, and lets a labelledby Prompt become a p or a div", () => {
    const legend = rowFor("choice-interaction", "prompt", { promptMarkup: "legend" });
    const labelled = rowFor("choice-interaction", "prompt", { promptMarkup: "labelledby" });
    assert.isTrue(allows(legend, h("legend", {})));
    assert.isFalse(allows(legend, h("span", {})));
    assert.isTrue(allows(labelled, h("p", {})));
    assert.isTrue(allows(labelled, h("div", {})));
  });
});

describe("tag classes", () => {
  it("keeps every control, link and list out of the container classes", () => {
    for (const tag of [...controls, ...links, ...lists]) {
      assert.isFalse(isFlowContainer(tag), tag);
      assert.isFalse(isPhrasingContainer(tag), tag);
    }
  });

  it("counts a custom element as a phrasing and a flow container", () => {
    assert.isTrue(isPhrasingContainer("qti-prompt"));
    assert.isTrue(isFlowContainer("qti-prompt"));
  });
});

describe("positionUnder", () => {
  it("gives phrasing under a p, under a phrasing element and inside an open p", () => {
    assert.strictEqual(positionUnder("p", false), "phrasing");
    assert.strictEqual(positionUnder("span", false), "phrasing");
    assert.strictEqual(positionUnder("div", true), "phrasing");
  });

  it("gives flow under a div or an li with no p open", () => {
    assert.strictEqual(positionUnder("div", false), "flow");
    assert.strictEqual(positionUnder("li", false), "flow");
  });
});

describe("scopedId", () => {
  it("joins the instance and the segments with a hyphen", () => {
    assert.strictEqual(scopedId("i1", "RESPONSE", "control", 0), "i1-RESPONSE-control-0");
  });
});

describe("resolveOverrides", () => {
  it.effect("resolves a replacement for a known part", () =>
    Effect.gen(function* knownPart() {
      const resolved = yield* resolveOverrides({ "choice-interaction": { indicator } });
      const replacement = resolved.replacementFor("choice-interaction", "indicator");
      assert.isTrue(Option.isSome(replacement));
      assert.strictEqual(Option.getOrUndefined(replacement), indicator);
      assert.isTrue(Option.isNone(resolved.replacementFor("choice-interaction", "label")));
      assert.isTrue(Option.isNone(resolved.replacementFor("item", "root")));
    }),
  );

  it.effect("resolves no overrides to no replacements", () =>
    Effect.gen(function* noOverrides() {
      const resolved = yield* resolveOverrides();
      assert.isTrue(Option.isNone(resolved.replacementFor("choice-interaction", "indicator")));
    }),
  );

  it.effect("fails with UnknownPart naming an unknown interaction", () =>
    Effect.gen(function* unknownInteraction() {
      const error = yield* Effect.flip(resolveOverrides({ "hotspot-interaction": {} }));
      assert.strictEqual(error._tag, "UnknownPart");
      assert.strictEqual(error.interaction, "hotspot-interaction");
      assert.isTrue(Option.isNone(error.part));
    }),
  );

  it.effect("fails with UnknownPart naming an unknown part", () =>
    Effect.gen(function* unknownPart() {
      const error = yield* Effect.flip(resolveOverrides({ "choice-interaction": { badge } }));
      assert.strictEqual(error._tag, "UnknownPart");
      assert.strictEqual(error.interaction, "choice-interaction");
      assert.strictEqual(Option.getOrUndefined(error.part), "badge");
    }),
  );
});

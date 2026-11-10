import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { configure } from "#plate/configuration.ts";
import { h, text } from "#plate/emit/node.ts";
import type { Attributes, Element, Node } from "#plate/emit/node.ts";
import {
  allows,
  authoredId,
  authoredIdrefs,
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
  splitTokens,
} from "#plate/emit/parts.ts";
import type { PartRow } from "#plate/emit/parts.ts";
import { associateModule } from "#plate/interactions/associate.ts";
import { drawingModule } from "#plate/interactions/drawing.ts";
import { endAttemptModule } from "#plate/interactions/end-attempt.ts";
import { gapMatchModule } from "#plate/interactions/gap-match.ts";
import { graphicAssociateModule } from "#plate/interactions/graphic-associate.ts";
import { graphicGapMatchModule } from "#plate/interactions/graphic-gap-match.ts";
import { graphicOrderModule } from "#plate/interactions/graphic-order.ts";
import { hotspotModule } from "#plate/interactions/hotspot.ts";
import { hottextModule } from "#plate/interactions/hottext.ts";
import { matchModule } from "#plate/interactions/match.ts";
import { mediaModule } from "#plate/interactions/media.ts";
import { orderModule } from "#plate/interactions/order.ts";
import { portableCustomModule } from "#plate/interactions/portable-custom.ts";
import { positionObjectModule } from "#plate/interactions/position-object.ts";
import { selectPointModule } from "#plate/interactions/select-point.ts";
import { sliderModule } from "#plate/interactions/slider.ts";
import { uploadModule } from "#plate/interactions/upload.ts";
import type {
  BodyNode,
  ChoiceInteraction,
  ExtendedTextInteraction,
  InlineChoiceInteraction,
  Item,
  ResponseDeclaration,
  TextEntryInteraction,
} from "#plate/model/item.ts";
import { redactItem } from "#plate/payload.ts";
import type { RenderMode } from "#plate/payload.ts";
import { render, renderStatus } from "#plate/render.ts";
import { parseHtml } from "#plate/test/round-trip.ts";

/**
 * The part table, one entry per row: interaction, part, `data-slot` marker and
 * default element. The markers are the operator's ruling (rule `0e767b8d`): a Root carries its
 * component's name, and every other part `<component>-<part>` in kebab case.
 */
const specRows = [
  ["item", "root", "item", "qti-assessment-item"],
  ["item", "status", "item-status", "section"],
  ["item", "live", "item-live", "div"],
  ["item", "statusHeading", "item-status-heading", "h1"],
  ["item", "messages", "item-messages", "ul"],
  ["item", "message", "item-message", "li"],
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
    "inline-choice-interaction",
    "root",
    "inline-choice-interaction",
    "qti-inline-choice-interaction",
  ],
  ["inline-choice-interaction", "label", "inline-choice-interaction-label", "label"],
  ["inline-choice-interaction", "control", "inline-choice-interaction-control", "select"],
  ["inline-choice-interaction", "placeholder", "inline-choice-interaction-placeholder", "option"],
  ["inline-choice-interaction", "option", "inline-choice-interaction-option", "option"],
  [
    "extended-text-interaction",
    "root",
    "extended-text-interaction",
    "qti-extended-text-interaction",
  ],
  ["extended-text-interaction", "prompt", "extended-text-interaction-prompt", "qti-prompt"],
  ["extended-text-interaction", "control", "extended-text-interaction-control", "textarea"],
  ["test-navigation", "root", "test-navigation", "nav"],
  ["test-navigation", "previous", "test-navigation-previous", "button"],
  ["test-navigation", "next", "test-navigation-next", "button"],
  ["test-navigation", "items", "test-navigation-items", "ol"],
  ["test-navigation", "item", "test-navigation-item", "li"],
  ["test-navigation", "itemButton", "test-navigation-item-button", "button"],
  ["test-navigation", "submit", "test-navigation-submit", "button"],
  ["test-navigation", "end", "test-navigation-end", "button"],
  ["test-navigation", "time", "test-navigation-time", "div"],
] as const;

/**
 * The four interactions plate renders, which the merged column's fixtures place in a body.
 */
type ShippedInteraction =
  | ChoiceInteraction
  | ExtendedTextInteraction
  | InlineChoiceInteraction
  | TextEntryInteraction;

/**
 * Every interaction module by its part-table owner and whether it is implemented: the four plate
 * renders, whose rows the table holds, and each stub module beside the contract.
 */
const interactionModules: readonly { readonly implemented: boolean; readonly owner: string }[] = [
  { implemented: true, owner: "choice-interaction" },
  { implemented: true, owner: "extended-text-interaction" },
  { implemented: true, owner: "inline-choice-interaction" },
  { implemented: true, owner: "text-entry-interaction" },
  associateModule,
  drawingModule,
  endAttemptModule,
  gapMatchModule,
  graphicAssociateModule,
  graphicGapMatchModule,
  graphicOrderModule,
  hotspotModule,
  hottextModule,
  matchModule,
  mediaModule,
  orderModule,
  portableCustomModule,
  positionObjectModule,
  selectPointModule,
  sliderModule,
  uploadModule,
];

/**
 * The navigation parts, in their order: the Root, the five buttons, the item list and its items,
 * and the Time part, which issue m3f-01 fills.
 */
const navigationParts = [
  "root",
  "previous",
  "next",
  "items",
  "item",
  "itemButton",
  "submit",
  "end",
  "time",
] as const;

/**
 * The navigation buttons, each a plain `button` whose `type` is a default a replacement may set.
 */
const navigationButtons = ["previous", "next", "itemButton", "submit", "end"] as const;

/**
 * The attributes that give a button submit semantics, none of which a navigation row merges, so a
 * host's replacement can give its own (rule `9af3809b`).
 */
const submitSemantics = [
  "type",
  "name",
  "value",
  "form",
  "formaction",
  "formmethod",
  "formenctype",
  "formtarget",
  "formnovalidate",
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

  it("gives the item chrome no Form and no Submit: a host composes its own form", () => {
    const item = partTable.filter((row) => row.interaction === "item").map((row) => row.part);
    assert.deepStrictEqual(item, [
      "root",
      "status",
      "live",
      "statusHeading",
      "messages",
      "message",
      "notice",
    ]);
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

  it("keeps every row's defaults apart from its merged attributes, as placed", () => {
    const rows = [
      ...partTable,
      rowFor("item", "notice", { position: "flow" }),
      rowFor("item", "statusHeading", { headingLevel: 6 }),
      rowFor("choice-interaction", "prompt", { promptMarkup: "legend" }),
      rowFor("choice-interaction", "root", { promptMarkup: "legend" }),
    ];
    for (const row of rows) {
      const met = Object.keys(row.defaults).filter((name) => row.merged.includes(name));
      assert.deepStrictEqual(met, [], `${row.interaction} ${row.part}`);
    }
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
      "autofocus",
    ]);
  });
});

describe("the interaction modules", () => {
  it("give the table rows for each implemented module, and none for a stub", () => {
    const owners: ReadonlySet<string> = new Set(partTable.map((row) => row.interaction));
    const implemented = interactionModules.filter((module) => module.implemented);

    assert.deepStrictEqual(
      implemented.map((module) => module.owner),
      [
        "choice-interaction",
        "extended-text-interaction",
        "inline-choice-interaction",
        "text-entry-interaction",
      ],
    );
    for (const module of interactionModules) {
      assert.strictEqual(owners.has(module.owner), module.implemented, module.owner);
    }
  });

  it("checks each implemented module's rows as rendered: the merged column renders every row", () => {
    const checked = new Set(
      interactionModules.filter((module) => module.implemented).map((module) => module.owner),
    );

    for (const row of partTable) {
      if (row.interaction.endsWith("-interaction")) {
        assert.isTrue(checked.has(row.interaction), row.slot);
      }
    }
  });
});

describe("the test-navigation rows", () => {
  it("resolves each navigation part by rowFor, and its marker back to it through the table", () => {
    for (const part of navigationParts) {
      const row = rowFor("test-navigation", part);
      assert.strictEqual(row.interaction, "test-navigation", part);
      assert.strictEqual(row.part, part);
      assert.deepStrictEqual(Option.getOrUndefined(partForSlot(row.slot)), {
        interaction: "test-navigation",
        part,
      });
    }
  });

  it("gives the Root the component's marker and every other part its own", () => {
    const root = rowFor("test-navigation", "root").slot;
    assert.strictEqual(root, "test-navigation");
    for (const part of navigationParts.filter((name) => name !== "root")) {
      assert.isTrue(rowFor("test-navigation", part).slot.startsWith(`${root}-`), part);
    }
  });

  it("defaults the five buttons to type button and no other row of the table", () => {
    for (const part of navigationButtons) {
      assert.deepStrictEqual(rowFor("test-navigation", part).defaults, { type: "button" }, part);
    }

    const defaulted = partTable
      .filter((row) => Object.keys(row.defaults).length > 0)
      .map((row) => `${row.interaction} ${row.part}`);
    assert.deepStrictEqual(
      defaulted,
      navigationButtons.map((part) => `test-navigation ${part}`),
    );
  });

  it("merges no attribute of submit semantics on any navigation row", () => {
    for (const part of navigationParts) {
      const { merged } = rowFor("test-navigation", part);
      const met = submitSemantics.filter((name) => merged.includes(name));
      assert.deepStrictEqual(met, [], part);
    }
  });

  it("merges the Root's name and modes, and each button's state and intent", () => {
    assert.deepStrictEqual(rowFor("test-navigation", "root").merged, [
      "aria-label",
      "data-navigation",
      "data-submission",
    ]);
    for (const part of ["previous", "next", "submit", "end"] as const) {
      assert.deepStrictEqual(rowFor("test-navigation", part).merged, ["disabled", "data-intent"]);
    }

    assert.deepStrictEqual(rowFor("test-navigation", "itemButton").merged, [
      "disabled",
      "data-intent",
      "aria-current",
    ]);
    assert.deepStrictEqual(rowFor("test-navigation", "time").merged, ["hidden", "role"]);
    assert.deepStrictEqual(rowFor("test-navigation", "items").merged, []);
    assert.deepStrictEqual(rowFor("test-navigation", "item").merged, []);
  });

  it("lets a button become only a button, the Items a list, the Item an li, the Root no control", () => {
    for (const part of navigationButtons) {
      const row = rowFor("test-navigation", part);
      assert.isTrue(allows(row, h("button", {})), part);
      for (const tag of ["div", "input", "a", "span", "my-button"]) {
        assert.isFalse(allows(row, h(tag, {})), `${part} ${tag}`);
      }
    }

    const root = rowFor("test-navigation", "root");
    assert.isTrue(allows(root, h("nav", {})));
    assert.isTrue(allows(root, h("div", {})));
    for (const tag of [...controls, ...links, ...lists]) {
      assert.isFalse(allows(root, h(tag, {})), tag);
    }

    const items = rowFor("test-navigation", "items");
    assert.isTrue(allows(items, h("ul", {})));
    assert.isFalse(allows(items, h("div", {})));
    assert.isTrue(allows(rowFor("test-navigation", "item"), h("li", {})));
    assert.isFalse(allows(rowFor("test-navigation", "item"), h("div", {})));
  });

  it("owns no list joint rule, as the item chrome's Messages own none", () => {
    for (const part of navigationParts) {
      assert.isFalse(rowFor("test-navigation", part).listOwner, part);
    }
  });
});

describe("autocomplete on the Controls", () => {
  it("is merged on the two text Controls and never on the Choice Control", () => {
    assert.include(rowFor("text-entry-interaction", "control").merged, "autocomplete");
    assert.include(rowFor("extended-text-interaction", "control").merged, "autocomplete");
    assert.notInclude(rowFor("choice-interaction", "control").merged, "autocomplete");
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
    assert.deepStrictEqual(root.merged, ["class", "data-orientation"]);
  });

  it("keeps the Choice Prompt its own element, named by the Root, under the labelledby markup", () => {
    for (const context of [{}, { promptMarkup: "labelledby" } as const]) {
      const prompt = rowFor("choice-interaction", "prompt", context);
      const root = rowFor("choice-interaction", "root", context);
      assert.strictEqual(prompt.element, "qti-prompt");
      assert.deepStrictEqual(prompt.merged, ["id"]);
      assert.strictEqual(root.element, "fieldset");
      assert.isFalse(root.legendOwner);
      assert.deepStrictEqual(root.merged, [
        "aria-labelledby",
        "aria-label",
        "class",
        "data-orientation",
      ]);
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

  it("[Q-12] keeps the Inline Choice Control a select, refusing a div and an input", () => {
    const row = rowFor("inline-choice-interaction", "control");
    assert.isTrue(allows(row, h("select", {})));
    assert.isFalse(allows(row, h("div", {})));
    assert.isFalse(allows(row, h("input", {})));
  });

  it("[Q-12] merges onto the Inline Choice Placeholder and each Option their value, selected, disabled and hidden", () => {
    for (const part of ["placeholder", "option"] as const) {
      assert.deepStrictEqual(
        rowFor("inline-choice-interaction", part).merged,
        ["value", "selected", "disabled", "hidden"],
        part,
      );
    }
  });

  it("[Q-12] keeps the Inline Choice Placeholder and each Option an option, refusing a span", () => {
    for (const part of ["placeholder", "option"] as const) {
      const row = rowFor("inline-choice-interaction", part);
      assert.isTrue(allows(row, h("option", {})), part);
      assert.isFalse(allows(row, h("span", {})), part);
    }
  });

  it("[Q-12] lets the Inline Choice Label be a label, a span or a custom element, never a div or a p", () => {
    const row = rowFor("inline-choice-interaction", "label");
    for (const tag of ["label", "span", "my-label"]) {
      assert.isTrue(allows(row, h(tag, {})), tag);
    }

    for (const tag of ["div", "p"]) {
      assert.isFalse(allows(row, h(tag, {})), tag);
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

describe("authoredId", () => {
  it("scopes an authored id behind a double hyphen, a prefix no renderer id has", () => {
    assert.strictEqual(authoredId("i1", "RESPONSE-control-0"), "i1--RESPONSE-control-0");
    assert.notStrictEqual(authoredId("i1", "item"), scopedId("i1", "item"));
  });
});

describe("splitTokens and authoredIdrefs", () => {
  it("split an IDREFS value at ASCII whitespace, dropping empty ids", () => {
    assert.deepStrictEqual(splitTokens(" intro\tnote\n\fhint\r "), ["intro", "note", "hint"]);
    assert.deepStrictEqual(splitTokens(""), []);
  });

  it("keep a no-break space inside an id, since only ASCII whitespace separates them", () => {
    assert.deepStrictEqual(splitTokens("a\u00A0b c"), ["a\u00A0b", "c"]);
  });

  it("scope every authored id of the value and join them by one space", () => {
    assert.deepStrictEqual(authoredIdrefs("i1", "intro   note"), Option.some("i1--intro i1--note"));
  });

  it("give none for a value that names no id, which is no reference at all", () => {
    assert.deepStrictEqual(authoredIdrefs("i1", " \t\n\f\r "), Option.none());
    assert.deepStrictEqual(authoredIdrefs("i1", ""), Option.none());
  });
});

describe("resolveOverrides", () => {
  it("resolves a replacement for a known part", () => {
    const resolved = Result.getOrThrow(resolveOverrides({ "choice-interaction": { indicator } }));
    const replacement = resolved.replacementFor("choice-interaction", "indicator");
    assert.isTrue(Option.isSome(replacement));
    assert.strictEqual(Option.getOrUndefined(replacement), indicator);
    assert.isTrue(Option.isNone(resolved.replacementFor("choice-interaction", "label")));
    assert.isTrue(Option.isNone(resolved.replacementFor("item", "root")));
  });

  it("resolves no overrides to no replacements", () => {
    const resolved = Result.getOrThrow(resolveOverrides());
    assert.isTrue(Option.isNone(resolved.replacementFor("choice-interaction", "indicator")));
  });

  it("returns a Result, failing UnknownPart with no part for an unknown interaction", () => {
    const resolved = resolveOverrides({ "hotspot-interaction": {} });
    assert.isTrue(Result.isResult(resolved));
    assert.isTrue(Result.isFailure(resolved));

    const error = Option.getOrThrow(Result.getFailure(resolved));
    assert.strictEqual(error._tag, "UnknownPart");
    assert.strictEqual(error.interaction, "hotspot-interaction");
    assert.isTrue(Option.isNone(error.part));
  });

  it("fails with UnknownPart naming an unknown part", () => {
    const error = Option.getOrThrow(
      Result.getFailure(resolveOverrides({ "choice-interaction": { badge } })),
    );
    assert.strictEqual(error._tag, "UnknownPart");
    assert.strictEqual(error.interaction, "choice-interaction");
    assert.strictEqual(Option.getOrUndefined(error.part), "badge");
  });
});

/**
 * The item instance every render of the merged-column test uses.
 */
const instance = "merged-0";

/**
 * The attributes a part carries that its row's `merged` column leaves out: the `data-slot` marker
 * and the Root state (`data-mode`, `data-disabled`).
 */
const markerAndState: ReadonlySet<string> = new Set(["data-disabled", "data-mode", "data-slot"]);

/**
 * The names a row's `merged` column holds that its connect function never computes, by marker:
 * the Inline Choice Option's and Placeholder's `disabled` and `hidden`, which plate owns by their
 * absence alone, and the item Live part's `role`, which it leaves to a host override so the live
 * region is no second Status region (D14).
 */
const ownedAbsent: ReadonlyMap<string, readonly string[]> = new Map<string, readonly string[]>([
  ...(["option", "placeholder"] as const).map(
    (part) => [rowFor("inline-choice-interaction", part).slot, ["disabled", "hidden"]] as const,
  ),
  [rowFor("item", "live").slot, ["role"]],
]);

/**
 * Every state an item is rendered in. Each writes attributes the others may not, such as the text
 * Controls' `readonly` in review and solution, so the merged-column test renders all three.
 */
const modes: readonly RenderMode[] = ["answering", "review", "solution"];

/**
 * Construct a text node of the body.
 *
 * @param value The text.
 * @returns The node.
 */
const words = (value: string): BodyNode => ({ kind: "text", text: value });

/**
 * A Choice with every optional attribute its connect function reads, and a phrasing Prompt, which
 * takes the `legend` markup.
 */
const legendChoice: ChoiceInteraction = {
  ariaLabel: Option.none(),
  ariaLabelledby: Option.none(),
  cardinality: "single",
  choices: [
    { content: [words("Red")], fixed: false, identifier: "A", templateVisibility: Option.none() },
    { content: [words("Blue")], fixed: false, identifier: "B", templateVisibility: Option.none() },
  ],
  class: "swatches",
  kind: "choice",
  maxChoices: 1n,
  messages: { max: Option.none(), min: Option.none() },
  minChoices: 0n,
  orientation: Option.some("horizontal"),
  path: "qti-assessment-item/qti-item-body/qti-choice-interaction",
  prompt: Option.some([words("Pick a colour.")]),
  response: "RESPONSE",
  shuffle: false,
};

/**
 * The Choice with a Prompt of flow content, a `p`, which takes the `labelledby` markup.
 */
const labelledChoice: ChoiceInteraction = {
  ...legendChoice,
  prompt: Option.some([
    {
      attributes: [],
      children: [words("Pick a colour.")],
      kind: "element",
      path: "qti-assessment-item/qti-item-body/qti-choice-interaction/qti-prompt/p",
      tag: "p",
    },
  ]),
};

/**
 * The Choice with no Prompt, named by the author's `aria-label` and `aria-labelledby`.
 */
const authorNamedChoice: ChoiceInteraction = {
  ...legendChoice,
  ariaLabel: Option.some("Colours"),
  ariaLabelledby: Option.some("intro"),
  prompt: Option.none(),
};

/**
 * A Text Entry with every optional attribute its connect function reads: an integer in base 10
 * (`inputmode`), an expected length (`size`), a placeholder and the author's two names.
 */
const textEntry: TextEntryInteraction = {
  ariaLabel: Option.some("Year"),
  ariaLabelledby: Option.some("intro"),
  base: 10,
  baseType: "integer",
  cardinality: "single",
  class: "short-answer",
  expectedLength: Option.some(4n),
  kind: "text-entry",
  path: "qti-assessment-item/qti-item-body/p/qti-text-entry-interaction",
  patternMask: Option.none(),
  patternMaskMessage: Option.none(),
  placeholder: Option.some("A year"),
  response: "RESPONSE",
};

/**
 * An Extended Text with every optional attribute its connect function reads and a Prompt, which
 * names its Control.
 */
const promptedEssay: ExtendedTextInteraction = {
  ...textEntry,
  baseType: "string",
  cardinality: "single",
  class: "qti-height-lines-6",
  expectedLines: Option.some(5n),
  format: "preformatted",
  kind: "extended-text",
  maxStrings: Option.none(),
  minStrings: 0n,
  path: "qti-assessment-item/qti-item-body/qti-extended-text-interaction",
  prompt: Option.some([words("Describe your day.")]),
};

/**
 * The Extended Text with no Prompt, named by the author's `aria-label` and `aria-labelledby`.
 */
const authorNamedEssay: ExtendedTextInteraction = { ...promptedEssay, prompt: Option.none() };

/**
 * The prompted Extended Text in the `xhtml` format, whose Control carries `data-format`.
 */
const xhtmlEssay: ExtendedTextInteraction = { ...promptedEssay, format: "xhtml" };

/**
 * The prompted Extended Text bound to an `ordered` response of at most three strings: three
 * Controls in a Root that is a group its Prompt names.
 */
const groupedEssay: ExtendedTextInteraction = {
  ...promptedEssay,
  cardinality: "ordered",
  maxStrings: Option.some(3n),
};

/**
 * The grouped Extended Text with no Prompt, its group named by the author's `aria-label` and
 * `aria-labelledby`.
 */
const authorNamedGroup: ExtendedTextInteraction = { ...groupedEssay, prompt: Option.none() };

/**
 * An Inline Choice whose Label gives text, which names its Control, with the author's class; the
 * merged column posts `B`, so a choice's Option is the one selected.
 */
const labelledInlineChoice: InlineChoiceInteraction = {
  ariaLabel: Option.none(),
  ariaLabelledby: Option.none(),
  choices: [
    { content: [words("red")], fixed: false, identifier: "R", templateVisibility: Option.none() },
    { content: [words("blue")], fixed: false, identifier: "B", templateVisibility: Option.none() },
  ],
  class: "colour",
  kind: "inline-choice",
  label: Option.some([words("Colour")]),
  messages: { min: Option.none() },
  minChoices: 0n,
  path: "qti-assessment-item/qti-item-body/p/qti-inline-choice-interaction",
  placeholder: Option.none(),
  required: false,
  response: "RESPONSE",
  shuffle: false,
};

/**
 * The Inline Choice with no Label and no author's name, which the renderer names; the merged column
 * posts `Z`, which no choice has, so its Placeholder is the option selected.
 */
const unnamedInlineChoice: InlineChoiceInteraction = {
  ...labelledInlineChoice,
  label: Option.none(),
};

/**
 * Place an interaction in the body: a Text Entry stands in a sentence beside a Notice for an
 * inline interaction plate does not render (an End Attempt), an Inline Choice in a sentence of its
 * own, and a Choice or an Extended Text at the body's top level.
 *
 * @param interaction The interaction.
 * @returns The body node that holds it.
 */
const placed = (interaction: ShippedInteraction): BodyNode => {
  switch (interaction.kind) {
    case "text-entry": {
      return {
        attributes: [],
        children: [
          words("The year was "),
          interaction,
          {
            feature: "qti-end-attempt-interaction",
            kind: "unsupported",
            path: "qti-assessment-item/qti-item-body/p/qti-end-attempt-interaction",
          },
        ],
        kind: "element",
        path: "qti-assessment-item/qti-item-body/p",
        tag: "p",
      };
    }
    case "inline-choice": {
      return {
        attributes: [],
        children: [words("The sky is "), interaction, words(".")],
        kind: "element",
        path: "qti-assessment-item/qti-item-body/p",
        tag: "p",
      };
    }
    case "choice":
    case "extended-text": {
      return interaction;
    }
    default: {
      return interaction satisfies never;
    }
  }
};

/**
 * Give the binding an interaction's response declares: a Choice's is an identifier of its own
 * cardinality, an Inline Choice's a single identifier, a Text Entry's a single value of its base
 * type, and an Extended Text's its own base type and cardinality. Every fixture here binds a
 * value, never a record.
 *
 * @param interaction The interaction.
 * @returns The response's base type and cardinality.
 */
const bindingOf = (
  interaction: ShippedInteraction,
): Pick<ResponseDeclaration, "baseType" | "cardinality"> => {
  switch (interaction.kind) {
    case "choice": {
      return { baseType: "identifier", cardinality: interaction.cardinality };
    }
    case "inline-choice": {
      return { baseType: "identifier", cardinality: "single" };
    }
    case "text-entry": {
      return { baseType: interaction.baseType, cardinality: "single" };
    }
    case "extended-text": {
      return interaction.cardinality === "record"
        ? assert.fail(`The Extended Text for ${interaction.response} binds a record.`)
        : { baseType: interaction.baseType, cardinality: interaction.cardinality };
    }
    default: {
      return interaction satisfies never;
    }
  }
};

/**
 * Construct an item whose body holds a paragraph carrying the id `intro`, which the fixtures'
 * `aria-labelledby` names, then one interaction ({@link placed}), bound to a response of its base
 * type and cardinality ({@link bindingOf}), and a Notice for an unsupported part.
 *
 * @param interaction The interaction.
 * @returns The item.
 */
const itemOf = (interaction: ShippedInteraction): Item => ({
  body: [
    {
      attributes: [{ name: "id", value: "intro" }],
      children: [words("Colours and dates.")],
      kind: "element",
      path: 'qti-assessment-item/qti-item-body/p[@id="intro"]',
      tag: "p",
    },
    placed(interaction),
    {
      feature: "qti-hotspot-interaction",
      kind: "unsupported",
      path: "qti-assessment-item/qti-item-body/qti-hotspot-interaction",
    },
  ],
  document: "items/merged.xml",
  identifier: "merged",
  lang: Option.none(),
  outcomes: new Map(),
  processing: Option.none(),
  responses: new Map([
    [
      interaction.response,
      {
        ...bindingOf(interaction),
        areaMapping: Option.none(),
        correct: Option.none(),
        defaultValue: Option.none(),
        identifier: interaction.response,
        mapping: Option.none(),
      },
    ],
  ]),
  templateProcessing: Option.none(),
  templates: new Map(),
  title: "Merged",
  unsupported: [],
});

/**
 * List an element and every element below it, in document order.
 *
 * @param nodes The nodes to walk.
 * @returns The elements.
 */
const elementsOf = (nodes: readonly Node[]): readonly Element[] =>
  nodes.flatMap((node) => (node.kind === "element" ? [node, ...elementsOf(node.children)] : []));

/**
 * Read the row a rendered part was placed by, from its marker and its placement: a Notice `div`
 * stands at a flow position, and the Choice Root and Prompt take the `legend` markup when the
 * Prompt is a `legend`, the Root's first child.
 *
 * @param element A rendered part.
 * @param slot The part's `data-slot` marker.
 * @returns The part's row as placed.
 */
const placedRow = (element: Element, slot: string): PartRow => {
  const { interaction, part } = Option.getOrThrow(partForSlot(slot));
  const [first] = element.children;
  const legend =
    interaction === "choice-interaction" &&
    (part === "prompt"
      ? element.tag === "legend"
      : first?.kind === "element" && first.tag === "legend");

  return rowFor(interaction, part, {
    position: part === "notice" && element.tag === "div" ? "flow" : "phrasing",
    promptMarkup: legend ? "legend" : "labelledby",
  });
};

/**
 * Name a row as placed, telling apart the rows one marker has: the Notice's `span` and `div`, and
 * the Choice Root and Prompt under each markup.
 *
 * @param row The row.
 * @returns Its marker, its element and whether it owns a legend.
 */
const rowKey = (row: PartRow): string =>
  `${row.slot} ${row.element}${row.legendOwner ? " legend-owner" : ""}`;

describe("the merged column", () => {
  it.effect(
    "records, for every row render emits in answering, review and solution, the attributes its connect function computes beyond the marker and the Root state, and the states it owns only by their absence",
    () =>
      Effect.gen(function* mergedColumn() {
        const configuration = yield* configure({});
        const items = [
          { interaction: legendChoice, posted: ["A"] },
          { interaction: labelledChoice, posted: ["A"] },
          { interaction: authorNamedChoice, posted: ["A"] },
          { interaction: textEntry, posted: ["1066"] },
          { interaction: promptedEssay, posted: ["A day."] },
          { interaction: authorNamedEssay, posted: ["A day."] },
          { interaction: xhtmlEssay, posted: ["A <b>day</b>."] },
          { interaction: groupedEssay, posted: ["A day.", "Another."] },
          { interaction: authorNamedGroup, posted: ["A day."] },
          { interaction: labelledInlineChoice, posted: ["B"] },
          { interaction: unnamedInlineChoice, posted: ["Z"] },
        ];
        const rendered = [
          ...modes.flatMap((mode) =>
            items.map(({ interaction, posted }) =>
              render(redactItem(itemOf(interaction)), configuration, {
                disabled: true,
                instance,
                messages: [{ response: interaction.response, text: "Check this answer." }],
                mode,
                posted: { [interaction.response]: posted },
              }),
            ),
          ),
          renderStatus(
            {
              autofocus: true,
              heading: "notAccepted",
              instance,
              messages: [{ response: "RESPONSE", text: "Check this answer." }],
            },
            configuration,
          ),
        ];
        const htmls = (yield* Effect.all(rendered.map((result) => Effect.fromResult(result)))).map(
          ({ html }) => html,
        );
        const observed = new Map<string, Set<string>>();

        for (const html of htmls) {
          for (const element of elementsOf(parseHtml(html))) {
            const slot = element.attrs["data-slot"];
            if (slot !== undefined && slot !== true) {
              const key = rowKey(placedRow(element, slot));
              const names = observed.get(key) ?? new Set<string>();
              for (const name of Object.keys(element.attrs)) {
                if (!markerAndState.has(name)) {
                  names.add(name);
                }
              }

              observed.set(key, names);
            }
          }
        }

        const rows = [
          ...partTable.filter((row) => row.interaction !== "test-navigation"),
          rowFor("item", "notice", { position: "flow" }),
          rowFor("choice-interaction", "prompt", { promptMarkup: "legend" }),
          rowFor("choice-interaction", "root", { promptMarkup: "legend" }),
        ];
        for (const row of rows) {
          const names = observed.get(rowKey(row));

          assert.isDefined(names, `${rowKey(row)} was never rendered`);

          const computed = row.merged.filter(
            (name) => !(ownedAbsent.get(row.slot) ?? []).includes(name),
          );
          assert.deepStrictEqual([...(names ?? [])].toSorted(), computed.toSorted(), rowKey(row));
        }
      }),
  );
});

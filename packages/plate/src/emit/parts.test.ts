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
  splitIdrefs,
} from "#plate/emit/parts.ts";
import type { PartRow } from "#plate/emit/parts.ts";
import type {
  BodyNode,
  ChoiceInteraction,
  ExtendedTextInteraction,
  Item,
  TextEntryInteraction,
} from "#plate/model/item.ts";
import { redactItem } from "#plate/payload.ts";
import { render, renderStatus } from "#plate/render.ts";
import { parseHtml } from "#plate/test/round-trip.ts";

/**
 * The spec's part table (§4.3), one entry per row: interaction, part, `data-slot` marker and
 * default element. The markers are the operator's ruling (rule `0e767b8d`): a Root carries its
 * component's name, and every other part `<component>-<part>` in kebab case.
 */
const specRows = [
  ["item", "root", "item", "qti-assessment-item"],
  ["item", "status", "item-status", "section"],
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

  it("gives the item chrome no Form and no Submit: a host composes its own form", () => {
    const item = partTable.filter((row) => row.interaction === "item").map((row) => row.part);
    assert.deepStrictEqual(item, [
      "root",
      "status",
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

  it("throws HeadingLevelDefect, carrying the level, for a StatusHeading level above 6", () => {
    const thrown = Result.getFailure(
      Result.try(() => rowFor("item", "statusHeading", { headingLevel: 7 })),
    );
    assert.isTrue(Option.isSome(thrown));

    const defect = Option.getOrThrow(thrown);
    assert.propertyVal(defect, "_tag", "HeadingLevelDefect");
    assert.propertyVal(defect, "level", 7);
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

describe("splitIdrefs and authoredIdrefs", () => {
  it("split an IDREFS value at ASCII whitespace, dropping empty ids", () => {
    assert.deepStrictEqual(splitIdrefs(" intro\tnote\n\fhint\r "), ["intro", "note", "hint"]);
    assert.deepStrictEqual(splitIdrefs(""), []);
  });

  it("keep a no-break space inside an id, since only ASCII whitespace separates them", () => {
    assert.deepStrictEqual(splitIdrefs("a\u00A0b c"), ["a\u00A0b", "c"]);
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
 * and the Root state of spec §4.4.
 */
const markerAndState: ReadonlySet<string> = new Set(["data-disabled", "data-mode", "data-slot"]);

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
    { content: [words("Red")], identifier: "A" },
    { content: [words("Blue")], identifier: "B" },
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
  class: "short-answer",
  expectedLength: Option.some(4n),
  kind: "text-entry",
  path: "qti-assessment-item/qti-item-body/p/qti-text-entry-interaction",
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
  class: "qti-height-lines-6",
  expectedLines: Option.some(5n),
  format: "preformatted",
  kind: "extended-text",
  path: "qti-assessment-item/qti-item-body/qti-extended-text-interaction",
  prompt: Option.some([words("Describe your day.")]),
};

/**
 * The Extended Text with no Prompt, named by the author's `aria-label` and `aria-labelledby`.
 */
const authorNamedEssay: ExtendedTextInteraction = { ...promptedEssay, prompt: Option.none() };

/**
 * Construct an item whose body holds one interaction, bound to a response of its base type and
 * cardinality, and a Notice for an unsupported part.
 *
 * @param interaction The interaction.
 * @returns The item.
 */
const itemOf = (
  interaction: ChoiceInteraction | ExtendedTextInteraction | TextEntryInteraction,
): Item => ({
  body: [
    interaction.kind === "text-entry"
      ? {
          attributes: [],
          children: [
            words("The year was "),
            interaction,
            {
              feature: "qti-inline-choice-interaction",
              kind: "unsupported",
              path: "qti-assessment-item/qti-item-body/p/qti-inline-choice-interaction",
            },
          ],
          kind: "element",
          path: "qti-assessment-item/qti-item-body/p",
          tag: "p",
        }
      : interaction,
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
        baseType: interaction.kind === "choice" ? "identifier" : interaction.baseType,
        cardinality: interaction.kind === "choice" ? interaction.cardinality : "single",
        correct: Option.none(),
        defaultValue: Option.none(),
        identifier: interaction.response,
        mapping: Option.none(),
      },
    ],
  ]),
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
    "records, for every row, exactly the attributes its connect function computes beyond the marker and the Root state",
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
        ];
        const rendered = [
          ...items.map(({ interaction, posted }) =>
            render(redactItem(itemOf(interaction)), configuration, {
              disabled: true,
              instance,
              messages: [{ response: interaction.response, text: "Check this answer." }],
              posted: { [interaction.response]: posted },
            }),
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
        const observed = new Map<string, Set<string>>();

        for (const result of rendered) {
          const { html } = yield* Effect.fromResult(result);
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
          ...partTable,
          rowFor("item", "notice", { position: "flow" }),
          rowFor("choice-interaction", "prompt", { promptMarkup: "legend" }),
          rowFor("choice-interaction", "root", { promptMarkup: "legend" }),
        ];
        for (const row of rows) {
          const names = observed.get(rowKey(row));

          assert.isDefined(names, `${rowKey(row)} was never rendered`);
          assert.deepStrictEqual(
            [...(names ?? [])].toSorted(),
            [...row.merged].toSorted(),
            rowKey(row),
          );
        }
      }),
  );
});

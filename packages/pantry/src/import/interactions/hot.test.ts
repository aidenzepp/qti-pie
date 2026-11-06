/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shape` is the column the hotspot and `Coords` rows name; it is a geometric shape here, not a structure. */
import type { Uuid } from "@bjornpagen/grizzle";
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it, layer } from "@effect/vitest";
import { Effect, Exit, FileSystem, Option } from "effect";
import {
  attributeReader,
  bindingRows,
  coordsRows,
  gapMatchBindingRow,
  markers,
  maxBoundOf,
  maxCountDefault,
  nearestInteraction,
  templateRef,
  typedCopy,
} from "#pantry/import/interactions.ts";
import type { DeclaredVariable, InteractionContext, Shared } from "#pantry/import/interactions.ts";
import { hotRows } from "#pantry/import/interactions/hot.ts";
import { ImportRefused } from "#pantry/import/refusal.ts";
import { ItemRefusal, Rows, treeRows } from "#pantry/import/tree.ts";
import type { IndexedNode, NodeIndex } from "#pantry/import/tree.ts";
import { ChoiceIdentifier, RectCoords } from "#pantry/schema/contracts.ts";
import { ChoiceTemplateRef } from "#pantry/schema/choices.ts";
import {
  DeclaredHotspotChoiceShowHide,
  DeclaredHotspotMaxChoices,
  DeclaredHotspotMinChoices,
  DeclaredHottextMaxChoices,
  DeclaredHottextMinChoices,
  DeclaredHottextShowHide,
  DeclaredPositionObjectMaxChoices,
  DeclaredSelectPointMaxChoices,
  DeclaredSelectPointMinChoices,
  HotspotChoice,
  HotspotChoiceLabel,
  HotspotInteraction,
  HotspotMaxSelectionsMessage,
  HotspotMinSelectionsMessage,
  Hottext,
  HottextInteraction,
  HottextMaxSelectionsMessage,
  HottextMinSelectionsMessage,
  HottextOwner,
  PositionObjectCenterPoint,
  PositionObjectInteraction,
  PositionObjectMinChoices,
  PositionObjectStage,
  SelectPointInteraction,
} from "#pantry/schema/interactions/hot.ts";
import { InteractionBinding, TypedBinding } from "#pantry/schema/interaction.ts";
import { AttributeSpelling, NodeKind } from "#pantry/schema/node.ts";
import { Coords, CoordsCircle, CoordsRect } from "#pantry/schema/shapes.ts";
import { materialize, uuidOf } from "#pantry/test/fixtures.ts";
import { readXml } from "@qti-pie/crust/read.ts";
import type { Attribute, Element } from "@qti-pie/crust/tree.ts";

const documentId = "11111111-1111-4111-8111-111111111111";

const attribute = (local: string, value: string): Attribute => ({
  local,
  namespace: "",
  prefix: "",
  qname: local,
  references: [],
  value,
});

const element = (
  local: string,
  attributes: Readonly<Record<string, string>> = {},
  children: readonly Element[] = [],
): Element => ({
  attributes: Object.entries(attributes).map(([name, value]) => attribute(name, value)),
  children,
  kind: "element",
  local,
  namespace: "http://www.imsglobal.org/xsd/imsqtiasi_v3p0",
  prefix: "",
  qname: local,
});

/**
 * The node index of a hand-written tree: each element's local name is its kind and its id is its
 * position in document order.
 */
const indexTree = (root: Element): NodeIndex => {
  const index = new Map<Element, IndexedNode>();
  const visit = (found: Element): void => {
    const kind = NodeKind.handles.find((handle) => handle === found.local);
    if (kind !== undefined) {
      index.set(found, { ancestry: "root", id: uuidOf(`node-${index.size}`), kind });
    }

    for (const child of found.children) {
      if (child.kind === "element") {
        visit(child);
      }
    }
  };
  visit(root);

  return index;
};

const shared: Shared = {
  attributes: attributeReader,
  bindingRows,
  coordsRows,
  gapMatchBindingRow,
  markers,
  maxBoundOf,
  maxCountDefault,
  nearestInteraction,
  templateRef,
  typedCopy,
};

const variable = (
  id: Uuid,
  baseType: NonNullable<DeclaredVariable["baseType"] extends Option.Option<infer B> ? B : never>,
  cardinality: "multiple" | "ordered" | "single",
): DeclaredVariable => ({
  baseType: Option.some(baseType),
  cardinality: Option.some(cardinality),
  id,
  shape: "typed",
});

const single = new Map([["RESPONSE", variable(uuidOf("decl-1"), "identifier", "single")]]);

const multiple = new Map([["RESPONSE", variable(uuidOf("decl-1"), "identifier", "multiple")]]);

const point = new Map([["RESPONSE", variable(uuidOf("decl-1"), "point", "single")]]);

/**
 * The context of an item whose body holds `children`, and the node index of its tree.
 */
const contextOf = (
  children: readonly Element[],
  declarations: ReadonlyMap<string, DeclaredVariable> = new Map(),
): InteractionContext => {
  const root = element("qti-assessment-item", {}, [element("qti-item-body", {}, children)]);

  return {
    declarations,
    documentId,
    item: { adaptive: "false" },
    nodes: indexTree(root),
    root,
    rootKind: "item",
    shared,
  };
};

const idsOf = (ctx: InteractionContext, kind: string): Uuid[] =>
  [...ctx.nodes.values()].filter((found) => found.kind === kind).map((found) => found.id);

const idOf = (ctx: InteractionContext, kind: string): Uuid =>
  Option.getOrThrow(Option.fromNullishOr(idsOf(ctx, kind)[0]));

const hotspotChoice = (identifier: string, more: Readonly<Record<string, string>> = {}): Element =>
  element("qti-hotspot-choice", {
    coords: "0,0,10,10",
    identifier,
    shape: "rect",
    ...more,
  });

const hottext = (identifier: string, more: Readonly<Record<string, string>> = {}): Element =>
  element("qti-hottext", { identifier, ...more });

const refusalRuleOf = (exit: Exit.Exit<Rows, unknown>): string => {
  const failure = Exit.isFailure(exit) ? Exit.findErrorOption(exit) : Option.none();

  return Option.isSome(failure) && failure.value instanceof ItemRefusal ? failure.value.rule : "";
};

describe("hotRows on a hotspot interaction", () => {
  it.effect("writes a choice's show-hide and marks the one the source wrote", () =>
    Effect.gen(function* showHide() {
      const ctx = contextOf(
        [
          element("qti-hotspot-interaction", { "response-identifier": "RESPONSE" }, [
            hotspotChoice("A", { "show-hide": "hide" }),
            hotspotChoice("B"),
          ]),
        ],
        single,
      );

      const built = yield* hotRows(ctx, Rows.empty());

      const choices = Rows.of(built, HotspotChoice);
      assert.deepStrictEqual(
        choices.map((row) => [row.identifier, row.showHide]),
        [
          ["A", "hide"],
          ["B", "show"],
        ],
      );
      assert.deepStrictEqual(Rows.of(built, DeclaredHotspotChoiceShowHide), [
        { node: choices[0]?.id ?? uuidOf("missing") },
      ]);
    }),
  );

  it.effect("writes the interaction, its binding, its choices and their coordinates", () =>
    Effect.gen(function* hotspots() {
      const interaction = element(
        "qti-hotspot-interaction",
        {
          "data-max-selections-message": "too many",
          "data-min-selections-message": "too few",
          "max-choices": "2",
          "response-identifier": "RESPONSE",
        },
        [
          hotspotChoice("A", { "hotspot-label": "north" }),
          hotspotChoice("B", { coords: "5,5,3", shape: "circle" }),
        ],
      );
      const ctx = contextOf([interaction], multiple);

      const built = yield* hotRows(ctx, Rows.empty());

      assert.deepStrictEqual(Rows.of(built, HotspotInteraction), [
        {
          id: uuidOf("node-2"),
          maxChoicesN: 2n,
          minChoicesN: 0n,
          responseIdentifier: "RESPONSE",
          rootKind: "item",
        },
      ]);
      assert.deepStrictEqual(Rows.of(built, DeclaredHotspotMaxChoices), [
        { node: uuidOf("node-2") },
      ]);
      assert.strictEqual(Rows.of(built, DeclaredHotspotMinChoices).length, 0);
      assert.deepStrictEqual(Rows.of(built, HotspotMinSelectionsMessage), [
        { node: uuidOf("node-2"), value: "too few" },
      ]);
      assert.deepStrictEqual(Rows.of(built, HotspotMaxSelectionsMessage), [
        { node: uuidOf("node-2"), value: "too many" },
      ]);
      assert.deepStrictEqual(
        Rows.of(built, HotspotChoice).map((row) => [
          row.id,
          row.identifier,
          row.interaction,
          row.shape,
        ]),
        [
          [uuidOf("node-3"), "A", uuidOf("node-2"), "rect"],
          [uuidOf("node-4"), "B", uuidOf("node-2"), "circle"],
        ],
      );
      assert.deepStrictEqual(Rows.of(built, HotspotChoiceLabel), [
        { node: uuidOf("node-3"), value: "north" },
      ]);
      assert.deepStrictEqual(
        Rows.of(built, Coords).map((row) => [row.node, row.ownerKind, row.shape, row.value]),
        [
          [uuidOf("node-3"), "qti-hotspot-choice", "rect", "0,0,10,10"],
          [uuidOf("node-4"), "qti-hotspot-choice", "circle", "5,5,3"],
        ],
      );
      assert.deepStrictEqual(Rows.of(built, CoordsRect), [
        { node: uuidOf("node-3"), value: RectCoords("0,0,10,10") },
      ]);
      assert.deepStrictEqual(Rows.of(built, CoordsCircle), [
        { node: uuidOf("node-4"), value: "5,5,3" },
      ]);
      assert.deepStrictEqual(Rows.of(built, TypedBinding), [
        {
          baseType: "identifier",
          cardinality: "multiple",
          document: documentId,
          interactionKind: "qti-hotspot-interaction",
          maxCount: 2n,
          node: uuidOf("node-2"),
          responseIdentifier: "RESPONSE",
        },
      ]);
    }),
  );

  it.effect("defaults the bounds and writes no optional the source omitted", () =>
    Effect.gen(function* defaults() {
      const ctx = contextOf(
        [element("qti-hotspot-interaction", { "response-identifier": "RESPONSE" })],
        single,
      );

      const built = yield* hotRows(ctx, Rows.empty());

      const [row] = Rows.of(built, HotspotInteraction);
      assert.strictEqual(row?.maxChoicesN, 1n);
      assert.strictEqual(row?.minChoicesN, 0n);
      assert.strictEqual(Rows.of(built, DeclaredHotspotMaxChoices).length, 0);
      assert.strictEqual(Rows.of(built, TypedBinding)[0]?.maxCount, 1n);
    }),
  );

  it.effect("writes the template variable a choice names", () =>
    Effect.gen(function* template() {
      const declarations = new Map([
        ...single,
        ["TPL", variable(uuidOf("decl-2"), "identifier", "single")],
      ]);
      const ctx = contextOf(
        [
          element("qti-hotspot-interaction", { "response-identifier": "RESPONSE" }, [
            hotspotChoice("A", { "template-identifier": "TPL" }),
          ]),
        ],
        declarations,
      );

      const built = yield* hotRows(ctx, Rows.empty());

      assert.deepStrictEqual(
        Rows.of(built, ChoiceTemplateRef).map((row) => [row.node, row.identifier]),
        [[uuidOf("node-3"), "TPL"]],
      );
    }),
  );

  it.effect("refuses a choice whose shape is not a shape", () =>
    Effect.gen(function* badShape() {
      const ctx = contextOf(
        [
          element("qti-hotspot-interaction", { "response-identifier": "RESPONSE" }, [
            hotspotChoice("A", { shape: "star" }),
          ]),
        ],
        single,
      );

      const exit = yield* Effect.exit(hotRows(ctx, Rows.empty()));

      assert.isTrue(Exit.isFailure(exit));
    }),
  );

  it.effect("refuses an interaction whose response variable no declaration names", () =>
    Effect.gen(function* undeclared() {
      const ctx = contextOf([
        element("qti-hotspot-interaction", { "response-identifier": "RESPONSE" }),
      ]);

      const exit = yield* Effect.exit(hotRows(ctx, Rows.empty()));

      assert.isTrue(Exit.isFailure(exit));
    }),
  );

  it.effect("refuses a hotspot choice that sits in no interaction under admission", () =>
    Effect.gen(function* stray() {
      const exit = yield* Effect.exit(
        hotRows(contextOf([element("p", {}, [hotspotChoice("A")])]), Rows.empty()),
      );

      assert.strictEqual(refusalRuleOf(exit), "admission");
    }),
  );
});

describe("hotRows on a select-point interaction", () => {
  it.effect("counts an absent max-choices as 0 in the interaction and the binding", () =>
    Effect.gen(function* unbounded() {
      const ctx = contextOf(
        [element("qti-select-point-interaction", { "response-identifier": "RESPONSE" })],
        point,
      );

      const built = yield* hotRows(ctx, Rows.empty());

      assert.deepStrictEqual(Rows.of(built, SelectPointInteraction), [
        {
          id: uuidOf("node-2"),
          maxChoicesN: 0n,
          minChoicesN: 0n,
          responseIdentifier: "RESPONSE",
          rootKind: "item",
        },
      ]);
      assert.strictEqual(Rows.of(built, TypedBinding)[0]?.maxCount, 0n);
      assert.strictEqual(Rows.of(built, DeclaredSelectPointMaxChoices).length, 0);
    }),
  );

  it.effect("copies a written max-choices and min-choices with their markers", () =>
    Effect.gen(function* written() {
      const ctx = contextOf(
        [
          element("qti-select-point-interaction", {
            "max-choices": "3",
            "min-choices": "1",
            "response-identifier": "RESPONSE",
          }),
        ],
        point,
      );

      const built = yield* hotRows(ctx, Rows.empty());

      const [row] = Rows.of(built, SelectPointInteraction);
      assert.strictEqual(row?.maxChoicesN, 3n);
      assert.strictEqual(row?.minChoicesN, 1n);
      assert.deepStrictEqual(Rows.of(built, DeclaredSelectPointMaxChoices), [
        { node: uuidOf("node-2") },
      ]);
      assert.deepStrictEqual(Rows.of(built, DeclaredSelectPointMinChoices), [
        { node: uuidOf("node-2") },
      ]);
      assert.strictEqual(Rows.of(built, TypedBinding)[0]?.maxCount, 3n);
      assert.strictEqual(Rows.of(built, InteractionBinding).length, 1);
    }),
  );
});

describe("hotRows on a position-object interaction", () => {
  it.effect("writes the stage, the interaction and its center point", () =>
    Effect.gen(function* positioned() {
      const stage = element("qti-position-object-stage", {}, [
        element("qti-position-object-interaction", {
          "center-point": "10 20",
          "response-identifier": "RESPONSE",
        }),
      ]);
      const ctx = contextOf([stage], point);

      const built = yield* hotRows(ctx, Rows.empty());

      assert.deepStrictEqual(Rows.of(built, PositionObjectStage), [{ id: uuidOf("node-2") }]);
      assert.deepStrictEqual(Rows.of(built, PositionObjectInteraction), [
        {
          id: uuidOf("node-3"),
          maxChoicesN: 1n,
          minChoicesN: 0n,
          responseIdentifier: "RESPONSE",
          rootKind: "item",
        },
      ]);
      assert.deepStrictEqual(Rows.of(built, PositionObjectCenterPoint), [
        { node: uuidOf("node-3"), value: "10 20" },
      ]);
      assert.strictEqual(Rows.of(built, PositionObjectMinChoices).length, 0);
      assert.strictEqual(Rows.of(built, DeclaredPositionObjectMaxChoices).length, 0);
      assert.strictEqual(Rows.of(built, TypedBinding)[0]?.maxCount, 1n);
    }),
  );

  it.effect("copies a written max-choices and min-choices", () =>
    Effect.gen(function* bounded() {
      const ctx = contextOf(
        [
          element("qti-position-object-interaction", {
            "max-choices": "2",
            "min-choices": "1",
            "response-identifier": "RESPONSE",
          }),
        ],
        point,
      );

      const built = yield* hotRows(ctx, Rows.empty());

      const [row] = Rows.of(built, PositionObjectInteraction);
      assert.strictEqual(row?.maxChoicesN, 2n);
      assert.strictEqual(row?.minChoicesN, 1n);
      assert.deepStrictEqual(Rows.of(built, PositionObjectMinChoices), [
        { node: uuidOf("node-2") },
      ]);
      assert.deepStrictEqual(Rows.of(built, DeclaredPositionObjectMaxChoices), [
        { node: uuidOf("node-2") },
      ]);
      assert.strictEqual(Rows.of(built, TypedBinding)[0]?.maxCount, 2n);
    }),
  );
});

describe("hotRows on hottexts", () => {
  it.effect("writes a hottext's show-hide and marks the one the source wrote", () =>
    Effect.gen(function* showHide() {
      const ctx = contextOf(
        [
          element("qti-hottext-interaction", { "response-identifier": "RESPONSE" }, [
            element("p", {}, [hottext("A", { "show-hide": "hide" }), hottext("B")]),
          ]),
        ],
        multiple,
      );

      const built = yield* hotRows(ctx, Rows.empty());

      const texts = Rows.of(built, Hottext);
      assert.deepStrictEqual(
        texts.map((row) => [row.identifier, row.showHide]),
        [
          ["A", "hide"],
          ["B", "show"],
        ],
      );
      assert.deepStrictEqual(Rows.of(built, DeclaredHottextShowHide), [
        { node: texts[0]?.id ?? uuidOf("missing") },
      ]);
    }),
  );

  it.effect("owns the hottexts of the prompt and the body, three rows each", () =>
    Effect.gen(function* owned() {
      const interaction = element(
        "qti-hottext-interaction",
        {
          "data-max-selections-message": "too many",
          "data-min-selections-message": "too few",
          "max-choices": "2",
          "min-choices": "1",
          "response-identifier": "RESPONSE",
        },
        [element("qti-prompt", {}, [hottext("P")]), element("p", {}, [hottext("A"), hottext("B")])],
      );
      const ctx = contextOf([interaction], multiple);

      const built = yield* hotRows(ctx, Rows.empty());

      assert.deepStrictEqual(Rows.of(built, HottextInteraction), [
        {
          id: uuidOf("node-2"),
          maxChoicesN: 2n,
          minChoicesN: 1n,
          responseIdentifier: "RESPONSE",
          rootKind: "item",
        },
      ]);
      assert.deepStrictEqual(
        Rows.of(built, Hottext).map((row) => [row.id, row.identifier]),
        [
          [uuidOf("node-4"), "P"],
          [uuidOf("node-6"), "A"],
          [uuidOf("node-7"), "B"],
        ],
      );
      assert.deepStrictEqual(
        Rows.of(built, HottextOwner).map((row) => [row.node, row.identifier, row.interaction]),
        [
          [uuidOf("node-4"), "P", uuidOf("node-2")],
          [uuidOf("node-6"), "A", uuidOf("node-2")],
          [uuidOf("node-7"), "B", uuidOf("node-2")],
        ],
      );
      assert.deepStrictEqual(Rows.of(built, DeclaredHottextMaxChoices), [
        { node: uuidOf("node-2") },
      ]);
      assert.deepStrictEqual(Rows.of(built, DeclaredHottextMinChoices), [
        { node: uuidOf("node-2") },
      ]);
      assert.deepStrictEqual(Rows.of(built, HottextMinSelectionsMessage), [
        { node: uuidOf("node-2"), value: "too few" },
      ]);
      assert.deepStrictEqual(Rows.of(built, HottextMaxSelectionsMessage), [
        { node: uuidOf("node-2"), value: "too many" },
      ]);
      assert.strictEqual(Rows.of(built, TypedBinding)[0]?.maxCount, 2n);
    }),
  );

  it.effect("gives a hottext in a choice interaction's prompt a row and no owner", () =>
    Effect.gen(function* foreign() {
      const interaction = element("qti-choice-interaction", { "response-identifier": "RESPONSE" }, [
        element("qti-prompt", {}, [element("span", {}, [hottext("X")])]),
      ]);
      const ctx = contextOf([interaction], single);

      const built = yield* hotRows(ctx, Rows.empty());

      assert.deepStrictEqual(Rows.of(built, Hottext), [
        { id: idOf(ctx, "qti-hottext"), identifier: ChoiceIdentifier("X"), showHide: "show" },
      ]);
      assert.strictEqual(Rows.of(built, HottextOwner).length, 0);
      assert.strictEqual(Rows.of(built, HottextInteraction).length, 0);
    }),
  );

  it.effect("gives a hottext directly under the item body a row and no owner", () =>
    Effect.gen(function* bare() {
      const ctx = contextOf([hottext("Y")]);

      const built = yield* hotRows(ctx, Rows.empty());

      assert.deepStrictEqual(Rows.of(built, Hottext), [
        { id: uuidOf("node-2"), identifier: ChoiceIdentifier("Y"), showHide: "show" },
      ]);
      assert.strictEqual(Rows.of(built, HottextOwner).length, 0);
    }),
  );
});

/**
 * Read `example/<name>.xml` of the materialized `sharedMedia` package into the item's tree.
 */
const sharedItem = (name: string) =>
  Effect.gen(function* readShared() {
    const fs = yield* FileSystem.FileSystem;
    const directory = yield* materialize("sharedMedia");
    const bytes = yield* fs.readFile(path.join(directory, "example", `${name}.xml`));
    const doc = yield* readXml(bytes);
    const tree = yield* treeRows(
      doc,
      { charset: "utf-8", id: documentId, kind: "document", root: "item", version: "3.0.0" },
      Rows.empty(),
    );
    const ctx: InteractionContext = {
      declarations: new Map([
        [
          "RESPONSE",
          variable(uuidOf("decl-1"), "identifier", name === "graphic_order" ? "ordered" : "single"),
        ],
      ]),
      documentId,
      item: { adaptive: "false" },
      nodes: tree.nodes,
      root: doc.root,
      rootKind: "item",
      shared,
    };

    return { ctx, rows: yield* hotRows(ctx, tree.rows) };
  });

layer(NodeServices.layer, { excludeTestServices: true })(
  "hotRows on the sharedMedia items",
  (suite) => {
    suite.effect("writes hotspot.xml's interaction, four circle choices and their binding", () =>
      Effect.gen(function* hotspotXml() {
        const { ctx, rows } = yield* sharedItem("hotspot");
        const interaction = idOf(ctx, "qti-hotspot-interaction");

        assert.deepStrictEqual(
          Rows.of(rows, HotspotInteraction).map((row) => [row.id, row.maxChoicesN]),
          [[interaction, 1n]],
        );
        assert.deepStrictEqual(
          Rows.of(rows, HotspotChoice).map((row) => [row.identifier, row.interaction, row.shape]),
          ["A", "B", "C", "D"].map((identifier) => [identifier, interaction, "circle"]),
        );
        assert.deepStrictEqual(
          Rows.of(rows, Coords).map((row) => [row.ownerKind, row.shape, row.value]),
          [
            ["qti-hotspot-choice", "circle", "77,115,8"],
            ["qti-hotspot-choice", "circle", "118,184,8"],
            ["qti-hotspot-choice", "circle", "150,235,8"],
            ["qti-hotspot-choice", "circle", "96,114,8"],
          ],
        );
        assert.strictEqual(Rows.of(rows, CoordsCircle).length, 4);
        assert.strictEqual(Rows.of(rows, CoordsRect).length, 0);
        assert.deepStrictEqual(
          Rows.of(rows, TypedBinding).map((row) => [
            row.responseIdentifier,
            row.cardinality,
            row.maxCount,
          ]),
          [["RESPONSE", "single", 1n]],
        );
        assert.deepStrictEqual(Rows.of(rows, DeclaredHotspotMaxChoices), [{ node: interaction }]);
      }),
    );

    suite.effect("owns graphic_order.xml's four choices to the graphic order interaction", () =>
      Effect.gen(function* graphicOrderXml() {
        const { ctx, rows } = yield* sharedItem("graphic_order");
        const interaction = idOf(ctx, "qti-graphic-order-interaction");

        assert.strictEqual(Rows.of(rows, HotspotInteraction).length, 0);
        assert.deepStrictEqual(
          Rows.of(rows, HotspotChoice).map((row) => [row.identifier, row.interaction]),
          ["A", "B", "C", "D"].map((identifier) => [identifier, interaction]),
        );
        assert.strictEqual(Rows.of(rows, Coords).length, 4);
      }),
    );
  },
);

const importRuleOf = (exit: Exit.Exit<Rows, unknown>): string => {
  const failure = Exit.isFailure(exit) ? Exit.findErrorOption(exit) : Option.none();

  return Option.isSome(failure) && failure.value instanceof ImportRefused ? failure.value.rule : "";
};

describe("hotRows on an integer outside its space", () => {
  const refused: readonly (readonly [string, Element, ReadonlyMap<string, DeclaredVariable>])[] = [
    [
      "min-choices of a hotspot interaction",
      element("qti-hotspot-interaction", {
        "min-choices": "-1",
        "response-identifier": "RESPONSE",
      }),
      single,
    ],
    [
      "max-choices of a hotspot interaction",
      element("qti-hotspot-interaction", {
        "max-choices": "-1",
        "response-identifier": "RESPONSE",
      }),
      single,
    ],
    [
      "max-choices of a select point",
      element("qti-select-point-interaction", {
        "max-choices": "x",
        "response-identifier": "RESPONSE",
      }),
      point,
    ],
    [
      "min-choices of a select point",
      element("qti-select-point-interaction", {
        "min-choices": "1.5",
        "response-identifier": "RESPONSE",
      }),
      point,
    ],
    [
      "max-choices of a hottext interaction",
      element("qti-hottext-interaction", {
        "max-choices": "-1",
        "response-identifier": "RESPONSE",
      }),
      single,
    ],
    [
      "min-choices of a position-object interaction",
      element("qti-position-object-interaction", {
        "min-choices": "abc",
        "response-identifier": "RESPONSE",
      }),
      point,
    ],
  ];

  for (const [name, tree, declarations] of refused) {
    it.effect(`refuses ${name} under attribute-lexical before any row is written`, () =>
      Effect.gen(function* outside() {
        const exit = yield* Effect.exit(hotRows(contextOf([tree], declarations), Rows.empty()));

        assert.strictEqual(importRuleOf(exit), "attribute-lexical");
      }),
    );
  }
});

describe("hotRows on a non-canonical integer spelling", () => {
  it.effect("keeps a padded max-choices on a hottext interaction as one spelling row", () =>
    Effect.gen(function* padded() {
      const ctx = contextOf(
        [
          element("qti-hottext-interaction", {
            "max-choices": "05",
            "response-identifier": "RESPONSE",
          }),
        ],
        multiple,
      );

      const built = yield* hotRows(ctx, Rows.empty());

      assert.strictEqual(Rows.of(built, HottextInteraction)[0]?.maxChoicesN, 5n);
      assert.strictEqual(Rows.of(built, TypedBinding)[0]?.maxCount, 5n);
      assert.deepStrictEqual(Rows.of(built, AttributeSpelling), [
        {
          attribute: "max-choices",
          kind: "qti-hottext-interaction",
          node: uuidOf("node-2"),
          value: "05",
        },
      ]);
    }),
  );

  it.effect("keeps a signed min-choices on a hotspot interaction as one spelling row", () =>
    Effect.gen(function* signed() {
      const ctx = contextOf(
        [
          element("qti-hotspot-interaction", {
            "max-choices": "3",
            "min-choices": "+1",
            "response-identifier": "RESPONSE",
          }),
        ],
        multiple,
      );

      const built = yield* hotRows(ctx, Rows.empty());

      assert.strictEqual(Rows.of(built, HotspotInteraction)[0]?.minChoicesN, 1n);
      assert.deepStrictEqual(
        Rows.of(built, AttributeSpelling).map((row) => [row.attribute, row.value]),
        [["min-choices", "+1"]],
      );
    }),
  );

  it.effect("writes no spelling row for a canonical value", () =>
    Effect.gen(function* canonical() {
      const ctx = contextOf(
        [
          element("qti-select-point-interaction", {
            "max-choices": "3",
            "min-choices": "0",
            "response-identifier": "RESPONSE",
          }),
        ],
        point,
      );

      const built = yield* hotRows(ctx, Rows.empty());

      assert.strictEqual(Rows.of(built, AttributeSpelling).length, 0);
    }),
  );
});

describe("hotRows on a choice outside the show-hide roster", () => {
  const refused: readonly (readonly [string, Element])[] = [
    [
      "show-hide of visible on a hottext",
      element("qti-hottext-interaction", { "response-identifier": "RESPONSE" }, [
        element("qti-hottext", { identifier: "A", "show-hide": "visible" }),
      ]),
    ],
    [
      "show-hide of visible on a hotspot choice",
      element("qti-hotspot-interaction", { "response-identifier": "RESPONSE" }, [
        element("qti-hotspot-choice", {
          coords: "0,0,1,1",
          identifier: "A",
          shape: "rect",
          "show-hide": "visible",
        }),
      ]),
    ],
  ];

  for (const [name, tree] of refused) {
    it.effect(`refuses ${name} under attribute-lexical before any row is written`, () =>
      Effect.gen(function* outside() {
        const exit = yield* Effect.exit(hotRows(contextOf([tree], single), Rows.empty()));

        assert.strictEqual(importRuleOf(exit), "attribute-lexical");
      }),
    );
  }

  it.effect("admits show-hide of hide on a hottext", () =>
    Effect.gen(function* admitted() {
      const tree = element("qti-hottext-interaction", { "response-identifier": "RESPONSE" }, [
        element("qti-hottext", { identifier: "A", "show-hide": "hide" }),
      ]);
      const built = yield* hotRows(contextOf([tree], single), Rows.empty());

      assert.deepStrictEqual(
        Rows.of(built, Hottext).map((row) => row.showHide),
        ["hide"],
      );
    }),
  );
});

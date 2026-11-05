/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shape` is the typed-or-record column of a declared variable the context holds, not a structure. */
import path from "node:path";
import { NodeServices } from "@effect/platform-node";
import { assert, describe, it, layer } from "@effect/vitest";
import { Effect, Exit, FileSystem, Option } from "effect";
import { ChoiceIdentifier, ContainerWidth, VariableReference } from "#pantry/schema/contracts.ts";
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
import { orderRows } from "#pantry/import/interactions/order.ts";
import { itemRows } from "#pantry/import/item.ts";
import { ImportRefused } from "#pantry/import/refusal.ts";
import { ItemRefusal, Rows } from "#pantry/import/tree.ts";
import type { IndexedNode, NodeIndex } from "#pantry/import/tree.ts";
import {
  DeclaredFixed,
  DeclaredShowHide,
  InteractionBinding,
  SimpleChoice,
  SimpleChoiceTemplateIdentifier,
  TypedBinding,
} from "#pantry/schema/interaction.ts";
import {
  DeclaredOrderShuffle,
  GraphicOrderInteraction,
  GraphicOrderMaxChoicesN,
  GraphicOrderMinChoicesN,
  OrderChoicesContainerWidth,
  OrderInteraction,
  OrderMaxChoicesN,
  OrderMaxSelectionsMessage,
  OrderMinChoicesN,
  OrderMinSelectionsMessage,
  OrderOrientation,
} from "#pantry/schema/interactions/order.ts";
import { AttributeLexical, AttributeSpelling, NodeKind } from "#pantry/schema/node.ts";
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

const ordered: DeclaredVariable = {
  baseType: Option.some("identifier"),
  cardinality: Option.some("ordered"),
  id: uuidOf("decl-1"),
  shape: "typed",
};

const contextOf = (
  interactions: readonly Element[],
  declarations: ReadonlyMap<string, DeclaredVariable> = new Map(),
): InteractionContext => {
  const root = element("qti-assessment-item", {}, [element("qti-item-body", {}, interactions)]);

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

const declared = new Map([["RESPONSE", ordered]]);

const simpleChoice = (identifier: string, more: Readonly<Record<string, string>> = {}): Element =>
  element("qti-simple-choice", { identifier, ...more });

const orderItem = (
  more: Readonly<Record<string, string>> = {},
  choices: readonly Element[] = [simpleChoice("A"), simpleChoice("B")],
): Element =>
  element("qti-order-interaction", { "response-identifier": "RESPONSE", ...more }, choices);

const graphicOrderItem = (more: Readonly<Record<string, string>> = {}): Element =>
  element("qti-graphic-order-interaction", { "response-identifier": "RESPONSE", ...more }, [
    element("qti-hotspot-choice", { coords: "0,0,1,1", identifier: "H1", shape: "rect" }),
  ]);

const refusalRuleOf = (exit: Exit.Exit<Rows, unknown>): string => {
  const failure = Exit.isFailure(exit) ? Exit.findErrorOption(exit) : Option.none();

  return Option.isSome(failure) && failure.value instanceof ItemRefusal ? failure.value.rule : "";
};

describe("orderRows on an order interaction", () => {
  it.effect("writes the defaults, the binding and a simple choice for each choice", () =>
    Effect.gen(function* defaults() {
      const ctx = contextOf([orderItem()], declared);

      const built = yield* orderRows(ctx, Rows.empty());

      assert.deepStrictEqual(Rows.of(built, OrderInteraction), [
        {
          id: uuidOf("node-2"),
          maxBound: "unlimited",
          maxChoicesN: 0n,
          minChoicesN: 0n,
          responseIdentifier: "RESPONSE",
          rootKind: "item",
          shuffle: "false",
        },
      ]);
      assert.deepStrictEqual(Rows.of(built, InteractionBinding), [
        {
          adaptive: "false",
          ancestry: "root",
          document: documentId,
          interactionKind: "qti-order-interaction",
          node: uuidOf("node-2"),
          responseIdentifier: "RESPONSE",
          shape: "typed",
        },
      ]);
      assert.deepStrictEqual(Rows.of(built, TypedBinding), [
        {
          baseType: "identifier",
          cardinality: "ordered",
          document: documentId,
          interactionKind: "qti-order-interaction",
          maxCount: 1n,
          node: uuidOf("node-2"),
          responseIdentifier: "RESPONSE",
        },
      ]);
      assert.deepStrictEqual(Rows.of(built, SimpleChoice), [
        {
          fixed: "false",
          id: uuidOf("node-3"),
          identifier: ChoiceIdentifier("A"),
          interaction: uuidOf("node-2"),
          showHide: "show",
        },
        {
          fixed: "false",
          id: uuidOf("node-4"),
          identifier: ChoiceIdentifier("B"),
          interaction: uuidOf("node-2"),
          showHide: "show",
        },
      ]);
      for (const relation of [
        OrderMinChoicesN,
        OrderMaxChoicesN,
        OrderOrientation,
        OrderMinSelectionsMessage,
        OrderMaxSelectionsMessage,
        OrderChoicesContainerWidth,
        DeclaredOrderShuffle,
        DeclaredFixed,
        DeclaredShowHide,
        SimpleChoiceTemplateIdentifier,
        AttributeLexical,
      ] as const) {
        assert.strictEqual(Rows.of(built, relation).length, 0, relation.name);
      }
    }),
  );

  it.effect("copies the written attributes and bounds a maximum above zero", () =>
    Effect.gen(function* written() {
      const ctx = contextOf(
        [
          orderItem(
            {
              "data-choices-container-width": "300",
              "data-max-selections-message": "too\tmany",
              "data-min-selections-message": "too few",
              "max-choices": "3",
              "min-choices": "2",
              orientation: "horizontal",
              shuffle: "true",
            },
            [
              simpleChoice("A", { fixed: "true", "show-hide": "hide", "template-identifier": "T" }),
              simpleChoice("B"),
              simpleChoice("C"),
            ],
          ),
        ],
        declared,
      );

      const built = yield* orderRows(ctx, Rows.empty());

      assert.deepStrictEqual(
        Rows.of(built, OrderInteraction).map((row) => [
          row.maxBound,
          row.maxChoicesN,
          row.minChoicesN,
          row.shuffle,
        ]),
        [["bounded", 3n, 2n, "true"]],
      );
      assert.deepStrictEqual(Rows.of(built, DeclaredOrderShuffle), [{ node: uuidOf("node-2") }]);
      assert.deepStrictEqual(Rows.of(built, OrderMaxChoicesN), [
        { node: uuidOf("node-2"), value: 3n },
      ]);
      assert.deepStrictEqual(Rows.of(built, OrderMinChoicesN), [
        { node: uuidOf("node-2"), value: 2n },
      ]);
      assert.deepStrictEqual(Rows.of(built, OrderOrientation), [
        { node: uuidOf("node-2"), value: "horizontal" },
      ]);
      assert.deepStrictEqual(Rows.of(built, OrderMinSelectionsMessage), [
        { node: uuidOf("node-2"), value: "too few" },
      ]);
      assert.deepStrictEqual(Rows.of(built, OrderMaxSelectionsMessage), [
        { node: uuidOf("node-2"), value: "too many" },
      ]);
      assert.deepStrictEqual(Rows.of(built, OrderChoicesContainerWidth), [
        { node: uuidOf("node-2"), value: ContainerWidth("300") },
      ]);
      assert.strictEqual(Rows.of(built, TypedBinding)[0]?.maxCount, 1n);
      assert.deepStrictEqual(
        Rows.of(built, SimpleChoice).map((row) => [row.identifier, row.fixed, row.showHide]),
        [
          ["A", "true", "hide"],
          ["B", "false", "show"],
          ["C", "false", "show"],
        ],
      );
      assert.deepStrictEqual(Rows.of(built, DeclaredFixed), [{ node: uuidOf("node-3") }]);
      assert.deepStrictEqual(Rows.of(built, DeclaredShowHide), [{ node: uuidOf("node-3") }]);
      assert.deepStrictEqual(Rows.of(built, SimpleChoiceTemplateIdentifier), [
        { node: uuidOf("node-3"), value: VariableReference("T") },
      ]);
    }),
  );

  it.effect("marks a written shuffle of false, which an omitted shuffle does not get", () =>
    Effect.gen(function* writtenFalse() {
      const written = yield* orderRows(
        contextOf([orderItem({ shuffle: "false" })], declared),
        Rows.empty(),
      );
      const omitted = yield* orderRows(contextOf([orderItem()], declared), Rows.empty());

      assert.deepStrictEqual(
        Rows.of(written, OrderInteraction).map((row) => row.shuffle),
        ["false"],
      );
      assert.deepStrictEqual(Rows.of(written, DeclaredOrderShuffle), [{ node: uuidOf("node-2") }]);
      assert.deepStrictEqual(
        Rows.of(omitted, OrderInteraction).map((row) => row.shuffle),
        ["false"],
      );
      assert.strictEqual(Rows.of(omitted, DeclaredOrderShuffle).length, 0);
    }),
  );

  it.effect("reads a zero maximum as unbounded", () =>
    Effect.gen(function* zero() {
      const ctx = contextOf([orderItem({ "max-choices": "0" }, [simpleChoice("A")])], declared);

      const built = yield* orderRows(ctx, Rows.empty());

      assert.deepStrictEqual(
        Rows.of(built, OrderInteraction).map((row) => [
          row.maxBound,
          row.maxChoicesN,
          row.minChoicesN,
        ]),
        [["unlimited", 0n, 0n]],
      );
      assert.deepStrictEqual(Rows.of(built, OrderMaxChoicesN), [
        { node: uuidOf("node-2"), value: 0n },
      ]);
      assert.strictEqual(Rows.of(built, OrderMinChoicesN).length, 0);
    }),
  );

  it.effect("writes no simple choice for one whose parent is another interaction", () =>
    Effect.gen(function* elsewhere() {
      const ctx = contextOf(
        [
          element("qti-choice-interaction", { "response-identifier": "OTHER" }, [
            simpleChoice("X"),
          ]),
        ],
        declared,
      );

      const built = yield* orderRows(ctx, Rows.empty());

      assert.strictEqual(Rows.of(built, SimpleChoice).length, 0);
      assert.strictEqual(Rows.of(built, InteractionBinding).length, 0);
    }),
  );

  it.effect("refuses an interaction whose response-identifier no declaration names", () =>
    Effect.gen(function* undeclared() {
      const ctx = contextOf([orderItem()], new Map());

      const exit = yield* Effect.exit(orderRows(ctx, Rows.empty()));

      assert.strictEqual(refusalRuleOf(exit), "binding-declared");
    }),
  );
});

describe("orderRows on a graphic order interaction", () => {
  it.effect("writes the arm and binding, and no choice, shuffle or orientation", () =>
    Effect.gen(function* graphic() {
      const ctx = contextOf([graphicOrderItem()], declared);

      const built = yield* orderRows(ctx, Rows.empty());

      assert.deepStrictEqual(Rows.of(built, GraphicOrderInteraction), [
        {
          id: uuidOf("node-2"),
          maxBound: "unlimited",
          maxChoicesN: 0n,
          minChoicesN: 0n,
          responseIdentifier: "RESPONSE",
          rootKind: "item",
        },
      ]);
      assert.deepStrictEqual(
        Rows.of(built, TypedBinding).map((row) => [row.interactionKind, row.maxCount]),
        [["qti-graphic-order-interaction", 1n]],
      );
      assert.strictEqual(Rows.of(built, OrderInteraction).length, 0);
      assert.strictEqual(Rows.of(built, SimpleChoice).length, 0);
      assert.strictEqual(Rows.of(built, OrderOrientation).length, 0);
    }),
  );

  it.effect("copies the written bounds", () =>
    Effect.gen(function* bounds() {
      const ctx = contextOf(
        [graphicOrderItem({ "max-choices": "4", "min-choices": "1" })],
        declared,
      );

      const built = yield* orderRows(ctx, Rows.empty());

      assert.deepStrictEqual(
        Rows.of(built, GraphicOrderInteraction).map((row) => [
          row.maxBound,
          row.maxChoicesN,
          row.minChoicesN,
        ]),
        [["bounded", 4n, 1n]],
      );
      assert.deepStrictEqual(Rows.of(built, GraphicOrderMaxChoicesN), [
        { node: uuidOf("node-2"), value: 4n },
      ]);
      assert.deepStrictEqual(Rows.of(built, GraphicOrderMinChoicesN), [
        { node: uuidOf("node-2"), value: 1n },
      ]);
    }),
  );

  it.effect("refuses an interaction whose response-identifier no declaration names", () =>
    Effect.gen(function* undeclared() {
      const ctx = contextOf([graphicOrderItem()], new Map());

      const exit = yield* Effect.exit(orderRows(ctx, Rows.empty()));

      assert.strictEqual(refusalRuleOf(exit), "binding-declared");
    }),
  );
});

layer(NodeServices.layer, { excludeTestServices: true })(
  "orderRows on SHARED/example/graphic_order.xml",
  (suite) => {
    suite.effect("writes the graphic order interaction, its binding and its typed binding", () =>
      Effect.gen(function* sharedGraphicOrder() {
        const fs = yield* FileSystem.FileSystem;
        const directory = yield* materialize("sharedMedia");
        const bytes = yield* fs.readFile(path.join(directory, "example/graphic_order.xml"));
        const doc = yield* readXml(bytes);
        const item = yield* itemRows(
          {
            doc,
            packageId: "22222222-2222-4222-8222-222222222222",
            path: "example/graphic_order.xml",
            resource: "graphic_order",
            resourceLomHasGeneral: false,
            resourceType: "imsqti_item_xmlv3p0",
            version: "3.0.0",
          },
          Rows.empty(),
        );
        const built = item.rows;

        const interactions = Rows.of(built, GraphicOrderInteraction);
        assert.strictEqual(interactions.length, 1);

        const [interaction] = interactions;
        const bindings = Rows.of(built, InteractionBinding);
        assert.strictEqual(bindings.length, 1);
        assert.strictEqual(bindings[0]?.node, interaction?.id);
        assert.strictEqual(bindings[0]?.ancestry, "root");
        assert.strictEqual(bindings[0]?.adaptive, "false");
        assert.strictEqual(bindings[0]?.interactionKind, "qti-graphic-order-interaction");
        assert.deepStrictEqual(
          Rows.of(built, TypedBinding).map((row) => [
            row.node,
            row.responseIdentifier,
            row.cardinality,
            row.maxCount,
          ]),
          [[interaction?.id, interaction?.responseIdentifier, "ordered", 1n]],
        );
      }),
    );
  },
);

const importRuleOf = (exit: Exit.Exit<Rows, unknown>): string => {
  const failure = Exit.isFailure(exit) ? Exit.findErrorOption(exit) : Option.none();

  return Option.isSome(failure) && failure.value instanceof ImportRefused ? failure.value.rule : "";
};

describe("orderRows on an integer outside its space", () => {
  const refused: readonly (readonly [string, Element])[] = [
    ["min-choices of 0 on an order interaction", orderItem({ "min-choices": "0" })],
    ["min-choices of -1 on an order interaction", orderItem({ "min-choices": "-1" })],
    ["min-choices of two on an order interaction", orderItem({ "min-choices": "two" })],
    ["max-choices of -1 on an order interaction", orderItem({ "max-choices": "-1" })],
    ["max-choices of 1.5 on an order interaction", orderItem({ "max-choices": "1.5" })],
    ["min-choices of 0 on a graphic order interaction", graphicOrderItem({ "min-choices": "0" })],
    ["max-choices of x on a graphic order interaction", graphicOrderItem({ "max-choices": "x" })],
  ];

  for (const [name, tree] of refused) {
    it.effect(`refuses ${name} under attribute-lexical before any row is written`, () =>
      Effect.gen(function* outside() {
        const exit = yield* Effect.exit(orderRows(contextOf([tree], declared), Rows.empty()));

        assert.strictEqual(importRuleOf(exit), "attribute-lexical");
      }),
    );
  }
});

describe("orderRows on a non-canonical integer spelling", () => {
  it.effect("keeps a signed min-choices on an order interaction as one spelling row", () =>
    Effect.gen(function* signed() {
      const ctx = contextOf([orderItem({ "max-choices": "3", "min-choices": "+2" })], declared);

      const built = yield* orderRows(ctx, Rows.empty());

      assert.deepStrictEqual(Rows.of(built, OrderMinChoicesN), [
        { node: uuidOf("node-2"), value: 2n },
      ]);
      assert.deepStrictEqual(Rows.of(built, AttributeSpelling), [
        {
          attribute: "min-choices",
          kind: "qti-order-interaction",
          node: uuidOf("node-2"),
          value: "+2",
        },
      ]);
    }),
  );

  it.effect("keeps a padded max-choices on a graphic order interaction as one spelling row", () =>
    Effect.gen(function* padded() {
      const ctx = contextOf([graphicOrderItem({ "max-choices": "04" })], declared);

      const built = yield* orderRows(ctx, Rows.empty());

      assert.deepStrictEqual(Rows.of(built, GraphicOrderMaxChoicesN), [
        { node: uuidOf("node-2"), value: 4n },
      ]);
      assert.deepStrictEqual(
        Rows.of(built, AttributeSpelling).map((row) => [row.attribute, row.value]),
        [["max-choices", "04"]],
      );
    }),
  );

  it.effect("writes no spelling row for a canonical value", () =>
    Effect.gen(function* canonical() {
      const ctx = contextOf([orderItem({ "max-choices": "3", "min-choices": "2" })], declared);

      const built = yield* orderRows(ctx, Rows.empty());

      assert.strictEqual(Rows.of(built, AttributeSpelling).length, 0);
    }),
  );
});

describe("orderRows on a simple choice outside its rosters", () => {
  const refused: readonly (readonly [string, Element])[] = [
    ["fixed of yes", simpleChoice("A", { fixed: "yes" })],
    ["show-hide of hidden", simpleChoice("A", { "show-hide": "hidden" })],
  ];

  for (const [name, choice] of refused) {
    it.effect(`refuses ${name} under attribute-lexical before any row is written`, () =>
      Effect.gen(function* outside() {
        const exit = yield* Effect.exit(
          orderRows(contextOf([orderItem({}, [choice])], declared), Rows.empty()),
        );

        assert.strictEqual(importRuleOf(exit), "attribute-lexical");
      }),
    );
  }

  it.effect("admits the xs:boolean spellings 1 and 0 for fixed", () =>
    Effect.gen(function* admitted() {
      const built = yield* orderRows(
        contextOf([orderItem({}, [simpleChoice("A", { fixed: "1" })])], declared),
        Rows.empty(),
      );

      assert.deepStrictEqual(
        Rows.of(built, SimpleChoice).map((row) => row.fixed),
        ["1"],
      );
    }),
  );
});

describe("orderRows on an order interaction outside its rosters", () => {
  const refused: readonly (readonly [string, Element])[] = [
    ["shuffle of yes", orderItem({ shuffle: "yes" })],
    ["orientation of diagonal", orderItem({ orientation: "diagonal" })],
  ];

  for (const [name, interaction] of refused) {
    it.effect(`refuses ${name} under attribute-lexical before any row is written`, () =>
      Effect.gen(function* outside() {
        const exit = yield* Effect.exit(
          orderRows(contextOf([interaction], declared), Rows.empty()),
        );

        assert.strictEqual(importRuleOf(exit), "attribute-lexical");
      }),
    );
  }

  it.effect("admits the xs:boolean spelling 1 for shuffle and a roster orientation", () =>
    Effect.gen(function* admitted() {
      const built = yield* orderRows(
        contextOf([orderItem({ orientation: "horizontal", shuffle: "1" })], declared),
        Rows.empty(),
      );

      assert.deepStrictEqual(
        Rows.of(built, OrderInteraction).map((row) => row.shuffle),
        ["1"],
      );
      assert.deepStrictEqual(
        Rows.of(built, OrderOrientation).map((row) => row.value),
        ["horizontal"],
      );
    }),
  );
});

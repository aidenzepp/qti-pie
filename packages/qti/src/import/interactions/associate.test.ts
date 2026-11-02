/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shape` is the column the hotspot and `Coords` rows name; it is a geometric shape here, not a structure. */
import { assert, describe, it } from "@effect/vitest";
import { Effect, Exit, Option } from "effect";
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
} from "#qti/import/interactions.ts";
import type { DeclaredVariable, InteractionContext, Shared } from "#qti/import/interactions.ts";
import { associateRows } from "#qti/import/interactions/associate.ts";
import { ItemRefusal, Rows } from "#qti/import/tree.ts";
import type { IndexedNode, NodeIndex } from "#qti/import/tree.ts";
import { ChoiceTemplateRef, MatchGroup } from "#qti/schema/choices.ts";
import {
  AssociableHotspot,
  AssociableHotspotLabel,
  AssociateInteraction,
  AssociateMaxAssociations,
  AssociateMinAssociations,
  DeclaredAssociateMaxAssociations,
  DeclaredAssociateMinAssociations,
  DeclaredAssociateShuffle,
  DeclaredGraphicAssociateMaxAssociations,
  DeclaredMatchShuffle,
  GraphicAssociateInteraction,
  GraphicAssociateMaxAssociations,
  MatchFirstColumnHeader,
  MatchInteraction,
  MatchMaxSelectionsMessage,
  MatchMinSelectionsMessage,
  SimpleAssociableChoice,
  SimpleAssociableChoiceFixed,
  SimpleAssociableChoiceMatchMin,
  SimpleAssociableChoiceMatchSet,
  SimpleAssociableChoiceShowHide,
  SimpleMatchSet,
} from "#qti/schema/interactions/associate.ts";
import { InteractionBinding, TypedBinding } from "#qti/schema/interaction.ts";
import { AttributeLexical, NodeKind } from "#qti/schema/node.ts";
import { Coords, CoordsCircle } from "#qti/schema/shapes.ts";
import type { Attribute, Element } from "#qti/xml/tree.ts";

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
      index.set(found, { ancestry: "root", id: `node-${index.size}`, kind });
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
  id: string,
  baseType: NonNullable<DeclaredVariable["baseType"] extends Option.Option<infer B> ? B : never>,
  cardinality: "multiple" | "ordered" | "single",
): DeclaredVariable => ({
  baseType: Option.some(baseType),
  cardinality: Option.some(cardinality),
  id,
  shape: "typed",
});

/**
 * The context of an item whose body holds `interactions`, and the node index of its tree.
 */
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
    shared,
  };
};

const choice = (identifier: string, more: Readonly<Record<string, string>> = {}): Element =>
  element("qti-simple-associable-choice", { identifier, "match-max": "1", ...more });

const matchItem = (): Element =>
  element("qti-match-interaction", { "response-identifier": "RESPONSE" }, [
    element("qti-simple-match-set", {}, [choice("A"), choice("B")]),
    element("qti-simple-match-set", {}, [choice("X"), choice("Y"), choice("Z")]),
  ]);

const pairs = new Map([["RESPONSE", variable("decl-1", "directedPair", "multiple")]]);

describe("associateRows on a match interaction", () => {
  it.effect("writes the interaction, its two sets, five choices and the binding", () =>
    Effect.gen(function* matchRows() {
      const ctx = contextOf([matchItem()], pairs);

      const built = yield* associateRows(ctx, Rows.empty());

      const interaction = Rows.of(built, MatchInteraction);
      assert.deepStrictEqual(interaction, [
        {
          id: "node-2",
          maxAssociationsN: 1n,
          minAssociationsN: 0n,
          responseIdentifier: "RESPONSE",
          rootKind: "item",
          shuffle: "false",
        },
      ]);
      assert.deepStrictEqual(Rows.of(built, SimpleMatchSet), [{ id: "node-3" }, { id: "node-6" }]);

      const choices = Rows.of(built, SimpleAssociableChoice);
      assert.deepStrictEqual(
        choices.map((row) => [
          row.identifier,
          row.interaction,
          row.matchMax,
          row.matchMaxN,
          row.matchMinN,
        ]),
        ["A", "B", "X", "Y", "Z"].map((identifier) => [identifier, "node-2", "1", 1n, 0n]),
      );
      assert.deepStrictEqual(
        Rows.of(built, SimpleAssociableChoiceMatchSet).map((row) => [
          row.node,
          row.matchSet,
          row.interaction,
        ]),
        [
          ["node-4", "node-3", "node-2"],
          ["node-5", "node-3", "node-2"],
          ["node-7", "node-6", "node-2"],
          ["node-8", "node-6", "node-2"],
          ["node-9", "node-6", "node-2"],
        ],
      );
      assert.deepStrictEqual(Rows.of(built, TypedBinding), [
        {
          baseType: "directedPair",
          cardinality: "multiple",
          document: documentId,
          interactionKind: "qti-match-interaction",
          maxCount: 1n,
          node: "node-2",
          responseIdentifier: "RESPONSE",
        },
      ]);
      assert.strictEqual(Rows.of(built, InteractionBinding).length, 1);
    }),
  );

  it.effect(
    "writes no marker, optional, fixed, show-hide or match group for what was not written",
    () =>
      Effect.gen(function* absent() {
        const ctx = contextOf([matchItem()], pairs);

        const built = yield* associateRows(ctx, Rows.empty());

        for (const relation of [
          DeclaredMatchShuffle,
          MatchMinSelectionsMessage,
          MatchMaxSelectionsMessage,
          MatchFirstColumnHeader,
          SimpleAssociableChoiceFixed,
          SimpleAssociableChoiceShowHide,
          SimpleAssociableChoiceMatchMin,
          MatchGroup,
          ChoiceTemplateRef,
          AttributeLexical,
        ] as const) {
          assert.strictEqual(Rows.of(built, relation).length, 0, relation.name);
        }
      }),
  );

  it.effect(
    "copies max-associations and keeps the three data attributes after whitespace replacement",
    () =>
      Effect.gen(function* written() {
        const ctx = contextOf(
          [
            element(
              "qti-match-interaction",
              {
                "data-first-column-header": "Item",
                "data-max-selections-message": "too\tmany",
                "data-min-selections-message": "too few",
                "max-associations": "0",
                "response-identifier": "RESPONSE",
                shuffle: "true",
              },
              [
                element("qti-simple-match-set", {}, [choice("A")]),
                element("qti-simple-match-set", {}, [choice("X")]),
              ],
            ),
          ],
          pairs,
        );

        const built = yield* associateRows(ctx, Rows.empty());

        assert.strictEqual(Rows.of(built, MatchInteraction)[0]?.maxAssociationsN, 0n);
        assert.strictEqual(Rows.of(built, MatchInteraction)[0]?.shuffle, "true");
        assert.strictEqual(Rows.of(built, TypedBinding)[0]?.maxCount, 0n);
        assert.deepStrictEqual(Rows.of(built, DeclaredMatchShuffle), [{ node: "node-2" }]);
        assert.deepStrictEqual(Rows.of(built, MatchMaxSelectionsMessage), [
          { node: "node-2", value: "too many" },
        ]);
        assert.deepStrictEqual(Rows.of(built, MatchMinSelectionsMessage), [
          { node: "node-2", value: "too few" },
        ]);
        assert.deepStrictEqual(Rows.of(built, MatchFirstColumnHeader), [
          { node: "node-2", value: "Item" },
        ]);
        assert.deepStrictEqual(Rows.of(built, AttributeLexical), [
          {
            attribute: "data-max-selections-message",
            kind: "qti-match-interaction",
            node: "node-2",
            value: "too\tmany",
          },
        ]);
      }),
  );

  it.effect("refuses a response-identifier that no declaration names", () =>
    Effect.gen(function* undeclared() {
      const ctx = contextOf([matchItem()]);

      const exit = yield* Effect.exit(associateRows(ctx, Rows.empty()));

      assert.isTrue(Exit.isFailure(exit));

      const failure = Exit.isFailure(exit) ? Exit.findErrorOption(exit) : Option.none();
      assert.isTrue(Option.isSome(failure) && failure.value instanceof ItemRefusal);
      assert.strictEqual(
        Option.isSome(failure) && failure.value instanceof ItemRefusal ? failure.value.rule : "",
        "binding-declared",
      );
    }),
  );
});

const writtenAssociate = (): Element =>
  element(
    "qti-associate-interaction",
    {
      "max-associations": "3",
      "min-associations": "1",
      "response-identifier": "RESPONSE",
      shuffle: "true",
    },
    [
      choice("A", {
        fixed: "true",
        "match-group": "g1 g2",
        "match-max": "2",
        "match-min": "1",
        "show-hide": "hide",
      }),
      choice("B", { "template-identifier": "TPL" }),
    ],
  );

const associateDeclarations = new Map([
  ["RESPONSE", variable("decl-1", "pair", "multiple")],
  ["TPL", variable("decl-2", "identifier", "single")],
]);

describe("associateRows on an associate interaction", () => {
  it.effect("writes the typed copies, the lexical optionals and the markers the source wrote", () =>
    Effect.gen(function* associate() {
      const ctx = contextOf([writtenAssociate()], associateDeclarations);

      const built = yield* associateRows(ctx, Rows.empty());

      assert.deepStrictEqual(Rows.of(built, AssociateInteraction), [
        {
          id: "node-2",
          maxAssociationsN: 3n,
          minAssociationsN: 1n,
          responseIdentifier: "RESPONSE",
          rootKind: "item",
          shuffle: "true",
        },
      ]);
      assert.deepStrictEqual(Rows.of(built, AssociateMaxAssociations), [
        { node: "node-2", value: "3" },
      ]);
      assert.deepStrictEqual(Rows.of(built, AssociateMinAssociations), [
        { node: "node-2", value: "1" },
      ]);
      for (const marker of [
        DeclaredAssociateShuffle,
        DeclaredAssociateMaxAssociations,
        DeclaredAssociateMinAssociations,
      ] as const) {
        assert.deepStrictEqual(Rows.of(built, marker), [{ node: "node-2" }], marker.name);
      }

      assert.strictEqual(Rows.of(built, TypedBinding)[0]?.maxCount, 3n);
    }),
  );

  it.effect("writes a direct choice with no set row, and the optionals it wrote", () =>
    Effect.gen(function* choices() {
      const ctx = contextOf([writtenAssociate()], associateDeclarations);

      const built = yield* associateRows(ctx, Rows.empty());

      const rows = Rows.of(built, SimpleAssociableChoice);
      assert.deepStrictEqual(
        rows.map((row) => [
          row.identifier,
          row.interaction,
          row.matchMax,
          row.matchMaxN,
          row.matchMinN,
        ]),
        [
          ["A", "node-2", "2", 2n, 1n],
          ["B", "node-2", "1", 1n, 0n],
        ],
      );
      assert.strictEqual(Rows.of(built, SimpleAssociableChoiceMatchSet).length, 0);
      assert.deepStrictEqual(Rows.of(built, SimpleAssociableChoiceFixed), [
        { node: "node-3", value: "true" },
      ]);
      assert.deepStrictEqual(Rows.of(built, SimpleAssociableChoiceShowHide), [
        { node: "node-3", value: "hide" },
      ]);
      assert.deepStrictEqual(Rows.of(built, SimpleAssociableChoiceMatchMin), [
        { node: "node-3", value: "1" },
      ]);
      assert.deepStrictEqual(Rows.of(built, MatchGroup), [{ node: "node-3", value: "g1 g2" }]);
      assert.deepStrictEqual(Rows.of(built, ChoiceTemplateRef), [
        {
          baseType: "identifier",
          cardinality: "single",
          document: documentId,
          identifier: "TPL",
          node: "node-4",
        },
      ]);
    }),
  );

  it.effect("refuses a template-identifier that names no typed variable", () =>
    Effect.gen(function* template() {
      const ctx = contextOf(
        [writtenAssociate()],
        new Map([["RESPONSE", variable("decl-1", "pair", "multiple")]]),
      );

      const exit = yield* Effect.exit(associateRows(ctx, Rows.empty()));

      assert.isTrue(Exit.isFailure(exit));
    }),
  );
});

const graphicItem = (more: Readonly<Record<string, string>> = {}): Element =>
  element("qti-graphic-associate-interaction", { "response-identifier": "RESPONSE", ...more }, [
    element("img", { alt: "map", src: "map.png" }),
    element("qti-associable-hotspot", {
      coords: "10,10,5",
      identifier: "H1",
      "match-max": "1",
      shape: "circle",
    }),
    element("qti-associable-hotspot", {
      coords: "40,40,5",
      "hotspot-label": "north",
      identifier: "H2",
      "match-max": "2",
      "match-min": "1",
      shape: "circle",
    }),
  ]);

const graphicDeclarations = new Map([["RESPONSE", variable("decl-1", "pair", "multiple")]]);

describe("associateRows on a graphic associate interaction", () => {
  it.effect("writes two hotspots with their coordinates and the interaction", () =>
    Effect.gen(function* hotspots() {
      const ctx = contextOf([graphicItem()], graphicDeclarations);

      const built = yield* associateRows(ctx, Rows.empty());

      assert.deepStrictEqual(Rows.of(built, GraphicAssociateInteraction), [
        {
          id: "node-2",
          maxAssociationsN: 1n,
          minAssociationsN: 0n,
          responseIdentifier: "RESPONSE",
          rootKind: "item",
        },
      ]);
      assert.strictEqual(Rows.of(built, DeclaredGraphicAssociateMaxAssociations).length, 0);
      assert.strictEqual(Rows.of(built, TypedBinding)[0]?.maxCount, 1n);
      assert.deepStrictEqual(
        Rows.of(built, AssociableHotspot).map((row) => [
          row.id,
          row.identifier,
          row.interaction,
          row.parentKind,
          row.shape,
          row.matchMax,
          row.matchMaxN,
          row.matchMinN,
        ]),
        [
          ["node-4", "H1", "node-2", "qti-graphic-associate-interaction", "circle", "1", 1n, 0n],
          ["node-5", "H2", "node-2", "qti-graphic-associate-interaction", "circle", "2", 2n, 1n],
        ],
      );
      assert.deepStrictEqual(
        Rows.of(built, Coords).map((row) => [row.node, row.ownerKind, row.shape, row.value]),
        [
          ["node-4", "qti-associable-hotspot", "circle", "10,10,5"],
          ["node-5", "qti-associable-hotspot", "circle", "40,40,5"],
        ],
      );
      assert.deepStrictEqual(
        Rows.of(built, CoordsCircle).map((row) => row.node),
        ["node-4", "node-5"],
      );
      assert.deepStrictEqual(Rows.of(built, AssociableHotspotLabel), [
        { node: "node-5", value: "north" },
      ]);
    }),
  );

  it.effect("copies a written max-associations and marks it", () =>
    Effect.gen(function* maximum() {
      const ctx = contextOf([graphicItem({ "max-associations": "4" })], graphicDeclarations);

      const built = yield* associateRows(ctx, Rows.empty());

      assert.strictEqual(Rows.of(built, GraphicAssociateInteraction)[0]?.maxAssociationsN, 4n);
      assert.deepStrictEqual(Rows.of(built, GraphicAssociateMaxAssociations), [
        { node: "node-2", value: "4" },
      ]);
      assert.deepStrictEqual(Rows.of(built, DeclaredGraphicAssociateMaxAssociations), [
        { node: "node-2" },
      ]);
      assert.strictEqual(Rows.of(built, TypedBinding)[0]?.maxCount, 4n);
    }),
  );

  it.effect("refuses a hotspot whose shape is not a shape", () =>
    Effect.gen(function* badShape() {
      const interaction = element(
        "qti-graphic-associate-interaction",
        { "response-identifier": "RESPONSE" },
        [
          element("qti-associable-hotspot", {
            coords: "1,2",
            identifier: "H1",
            "match-max": "1",
            shape: "star",
          }),
        ],
      );
      const ctx = contextOf([interaction], graphicDeclarations);

      const exit = yield* Effect.exit(associateRows(ctx, Rows.empty()));

      assert.isTrue(Exit.isFailure(exit));
    }),
  );

  it.effect("copies the parent kind of a hotspot under a graphic gap match", () =>
    Effect.gen(function* gapParent() {
      const interaction = element(
        "qti-graphic-gap-match-interaction",
        { "response-identifier": "RESPONSE" },
        [
          element("qti-associable-hotspot", {
            coords: "1,2,3",
            identifier: "H1",
            "match-max": "1",
            shape: "circle",
          }),
        ],
      );
      const ctx = contextOf([interaction], graphicDeclarations);

      const built = yield* associateRows(ctx, Rows.empty());

      assert.deepStrictEqual(
        Rows.of(built, AssociableHotspot).map((row) => [row.interaction, row.parentKind]),
        [["node-2", "qti-graphic-gap-match-interaction"]],
      );
      assert.strictEqual(Rows.of(built, GraphicAssociateInteraction).length, 0);
    }),
  );
});

describe("associateRows on a tree with no associate interaction", () => {
  it.effect("returns the rows it was given", () =>
    Effect.gen(function* untouched() {
      const ctx = contextOf([]);
      const rows = Rows.add(Rows.empty(), DeclaredMatchShuffle, [{ node: "node-9" }]);

      assert.strictEqual(yield* associateRows(ctx, rows), rows);
    }),
  );
});

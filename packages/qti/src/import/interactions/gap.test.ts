/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shape` is the typed-or-record column of a declared variable the context holds, not a structure. */
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
import { gapRows } from "#qti/import/interactions/gap.ts";
import { ImportRefused } from "#qti/import/refusal.ts";
import { ItemRefusal, Rows } from "#qti/import/tree.ts";
import type { IndexedNode, NodeIndex } from "#qti/import/tree.ts";
import { ChoiceTemplateRef, MatchGroup } from "#qti/schema/choices.ts";
import {
  DeclaredGapImgShowHide,
  DeclaredGapMatchMaxAssociations,
  DeclaredGapMatchShuffle,
  DeclaredGapRequired,
  DeclaredGapShowHide,
  DeclaredGapTextShowHide,
  DeclaredGraphicGapMatchMaxAssociations,
  Gap,
  GapImg,
  GapImgLeft,
  GapImgMatchMin,
  GapImgObjectLabel,
  GapImgTop,
  GapMatchChoicesContainerWidth,
  GapMatchInteraction,
  GapMatchMaxSelectionsMessage,
  GapMatchMinAssociations,
  GapMatchMinSelectionsMessage,
  GapText,
  GapTextMatchMin,
  GraphicGapMatchInteraction,
  GraphicGapMatchMinAssociations,
} from "#qti/schema/interactions/gap.ts";
import { GapMatchBinding, InteractionBinding, TypedBinding } from "#qti/schema/interaction.ts";
import { AttributeLexical, AttributeSpelling, NodeKind } from "#qti/schema/node.ts";
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
  cardinality: "multiple" | "ordered" | "single",
): DeclaredVariable => ({
  baseType: Option.some("directedPair"),
  cardinality: Option.some(cardinality),
  id,
  shape: "typed",
});

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

const pairs = new Map([["RESPONSE", variable("decl-1", "multiple")]]);

const gapText = (identifier: string, more: Readonly<Record<string, string>> = {}): Element =>
  element("qti-gap-text", { identifier, "match-max": "1", ...more });

const gap = (identifier: string, more: Readonly<Record<string, string>> = {}): Element =>
  element("qti-gap", { identifier, ...more });

/**
 * A gap-match whose two gaps sit at different depths: the first directly in the paragraph, the
 * second inside a span.
 */
const gapMatchItem = (): Element =>
  element("qti-gap-match-interaction", { "response-identifier": "RESPONSE" }, [
    gapText("A"),
    gapText("B"),
    element("p", {}, [gap("G1"), element("span", {}, [gap("G2")])]),
  ]);

const refusalRuleOf = (exit: Exit.Exit<Rows, unknown>): string => {
  const failure = Exit.isFailure(exit) ? Exit.findErrorOption(exit) : Option.none();

  return Option.isSome(failure) && failure.value instanceof ItemRefusal ? failure.value.rule : "";
};

describe("gapRows on a gap-match interaction", () => {
  it.effect("writes a gap's and a gap text's show-hide and marks each the source wrote", () =>
    Effect.gen(function* showHide() {
      const ctx = contextOf(
        [
          element("qti-gap-match-interaction", { "response-identifier": "RESPONSE" }, [
            gapText("A", { "show-hide": "hide" }),
            gapText("B"),
            element("p", {}, [gap("G1", { "show-hide": "hide" }), gap("G2")]),
          ]),
        ],
        pairs,
      );

      const built = yield* gapRows(ctx, Rows.empty());

      const texts = Rows.of(built, GapText);
      const gaps = Rows.of(built, Gap);
      assert.deepStrictEqual(
        texts.map((row) => [row.identifier, row.showHide]),
        [
          ["A", "hide"],
          ["B", "show"],
        ],
      );
      assert.deepStrictEqual(
        gaps.map((row) => [row.identifier, row.showHide]),
        [
          ["G1", "hide"],
          ["G2", "show"],
        ],
      );
      assert.deepStrictEqual(Rows.of(built, DeclaredGapTextShowHide), [
        { node: texts[0]?.id ?? "" },
      ]);
      assert.deepStrictEqual(Rows.of(built, DeclaredGapShowHide), [{ node: gaps[0]?.id ?? "" }]);
    }),
  );

  it.effect("writes the interaction, its binding, two texts and both gaps at any depth", () =>
    Effect.gen(function* gapMatchRows() {
      const ctx = contextOf([gapMatchItem()], pairs);

      const built = yield* gapRows(ctx, Rows.empty());

      assert.deepStrictEqual(Rows.of(built, GapMatchInteraction), [
        {
          id: "node-2",
          maxAssociationsN: 1n,
          minAssociationsN: 0n,
          responseIdentifier: "RESPONSE",
          rootKind: "item",
          shuffle: "false",
        },
      ]);
      assert.deepStrictEqual(Rows.of(built, GapMatchBinding), [
        { cardinality: "multiple", node: "node-2" },
      ]);
      assert.deepStrictEqual(Rows.of(built, TypedBinding), [
        {
          baseType: "directedPair",
          cardinality: "multiple",
          document: documentId,
          interactionKind: "qti-gap-match-interaction",
          maxCount: 1n,
          node: "node-2",
          responseIdentifier: "RESPONSE",
        },
      ]);
      assert.strictEqual(Rows.of(built, InteractionBinding).length, 1);
      assert.deepStrictEqual(
        Rows.of(built, GapText).map((row) => [
          row.id,
          row.identifier,
          row.interaction,
          row.matchMaxN,
          row.matchMinN,
        ]),
        [
          ["node-3", "A", "node-2", 1n, 0n],
          ["node-4", "B", "node-2", 1n, 0n],
        ],
      );
      assert.deepStrictEqual(
        Rows.of(built, Gap).map((row) => [row.id, row.identifier, row.interaction, row.required]),
        [
          ["node-6", "G1", "node-2", "false"],
          ["node-8", "G2", "node-2", "false"],
        ],
      );
    }),
  );

  it.effect("writes no marker, optional, group or template for what was not written", () =>
    Effect.gen(function* absent() {
      const ctx = contextOf([gapMatchItem()], pairs);

      const built = yield* gapRows(ctx, Rows.empty());

      for (const relation of [
        DeclaredGapMatchShuffle,
        DeclaredGapMatchMaxAssociations,
        DeclaredGapRequired,
        GapMatchMinAssociations,
        GapMatchMinSelectionsMessage,
        GapMatchMaxSelectionsMessage,
        GapMatchChoicesContainerWidth,
        GapTextMatchMin,
        MatchGroup,
        ChoiceTemplateRef,
        AttributeLexical,
        AttributeSpelling,
      ] as const) {
        assert.strictEqual(Rows.of(built, relation).length, 0, relation.name);
      }
    }),
  );

  it.effect("copies the written attributes, their markers and the bounds", () =>
    Effect.gen(function* written() {
      const ctx = contextOf(
        [
          element(
            "qti-gap-match-interaction",
            {
              "data-choices-container-width": "300",
              "data-max-selections-message": "too\tmany",
              "data-min-selections-message": "too few",
              "max-associations": "4",
              "min-associations": "2",
              "response-identifier": "RESPONSE",
              shuffle: "true",
            },
            [
              gapText("A", { "match-group": "G1 G2", "match-min": "1" }),
              element("p", {}, [gap("G1", { required: "true" })]),
            ],
          ),
        ],
        pairs,
      );

      const built = yield* gapRows(ctx, Rows.empty());

      assert.deepStrictEqual(
        Rows.of(built, GapMatchInteraction).map((row) => [
          row.maxAssociationsN,
          row.minAssociationsN,
          row.shuffle,
        ]),
        [[4n, 2n, "true"]],
      );
      assert.strictEqual(Rows.of(built, TypedBinding)[0]?.maxCount, 4n);
      assert.deepStrictEqual(Rows.of(built, GapMatchMinAssociations), [{ node: "node-2" }]);
      assert.deepStrictEqual(Rows.of(built, GapMatchMinSelectionsMessage), [
        { node: "node-2", value: "too few" },
      ]);
      assert.deepStrictEqual(Rows.of(built, GapMatchMaxSelectionsMessage), [
        { node: "node-2", value: "too many" },
      ]);
      assert.deepStrictEqual(Rows.of(built, GapMatchChoicesContainerWidth), [
        { node: "node-2", value: "300" },
      ]);
      assert.deepStrictEqual(Rows.of(built, DeclaredGapMatchShuffle), [{ node: "node-2" }]);
      assert.deepStrictEqual(Rows.of(built, DeclaredGapMatchMaxAssociations), [{ node: "node-2" }]);
      assert.deepStrictEqual(Rows.of(built, GapTextMatchMin), [{ node: "node-3" }]);
      assert.deepStrictEqual(Rows.of(built, MatchGroup), [{ node: "node-3", value: "G1 G2" }]);
      assert.deepStrictEqual(
        Rows.of(built, GapText).map((row) => row.matchMinN),
        [1n],
      );
      assert.deepStrictEqual(
        Rows.of(built, Gap).map((row) => row.required),
        ["true"],
      );
      assert.deepStrictEqual(Rows.of(built, DeclaredGapRequired), [{ node: "node-5" }]);
    }),
  );

  it.effect("writes the template variable a gap text or gap names", () =>
    Effect.gen(function* templated() {
      const declared = new Map(pairs).set("TMPL", {
        baseType: Option.some("identifier" as const),
        cardinality: Option.some("single" as const),
        id: "decl-2",
        shape: "typed" as const,
      });
      const ctx = contextOf(
        [
          element("qti-gap-match-interaction", { "response-identifier": "RESPONSE" }, [
            gapText("A", { "template-identifier": "TMPL" }),
            element("p", {}, [gap("G1", { "template-identifier": "TMPL" })]),
          ]),
        ],
        declared,
      );

      const built = yield* gapRows(ctx, Rows.empty());

      assert.deepStrictEqual(
        Rows.of(built, ChoiceTemplateRef).map((row) => [row.node, row.identifier]),
        [
          ["node-3", "TMPL"],
          ["node-5", "TMPL"],
        ],
      );
    }),
  );

  it.effect("refuses a response-identifier that no declaration names", () =>
    Effect.gen(function* undeclared() {
      const exit = yield* Effect.exit(gapRows(contextOf([gapMatchItem()]), Rows.empty()));

      assert.strictEqual(refusalRuleOf(exit), "binding-declared");
    }),
  );

  it.effect("refuses a gap that sits in no gap-match interaction", () =>
    Effect.gen(function* stray() {
      const exit = yield* Effect.exit(
        gapRows(contextOf([element("p", {}, [gap("G1")])], pairs), Rows.empty()),
      );

      assert.strictEqual(refusalRuleOf(exit), "ancestry-ban");
    }),
  );

  it.effect("refuses a gap text that sits in no gap-match interaction under admission", () =>
    Effect.gen(function* stray() {
      const exit = yield* Effect.exit(
        gapRows(contextOf([element("p", {}, [gapText("T1")])]), Rows.empty()),
      );

      assert.strictEqual(refusalRuleOf(exit), "admission");
    }),
  );
});

const graphic = (more: Readonly<Record<string, string>> = {}): Element =>
  element("qti-graphic-gap-match-interaction", { "response-identifier": "RESPONSE", ...more }, [
    element("img", { src: "a.png" }),
    element("qti-gap-img", { identifier: "I1", "match-max": "2" }, [
      element("img", { src: "b.png" }),
    ]),
    gapText("T1"),
  ]);

describe("gapRows on a graphic gap-match interaction", () => {
  it.effect("writes a gap image's show-hide and marks the one the source wrote", () =>
    Effect.gen(function* showHide() {
      const image = (identifier: string, more: Readonly<Record<string, string>> = {}): Element =>
        element("qti-gap-img", { identifier, "match-max": "1", ...more }, [
          element("img", { src: `${identifier}.png` }),
        ]);
      const ctx = contextOf(
        [
          element("qti-graphic-gap-match-interaction", { "response-identifier": "RESPONSE" }, [
            image("I1", { "show-hide": "hide" }),
            image("I2"),
          ]),
        ],
        pairs,
      );

      const built = yield* gapRows(ctx, Rows.empty());

      const images = Rows.of(built, GapImg);
      assert.deepStrictEqual(
        images.map((row) => [row.identifier, row.showHide]),
        [
          ["I1", "hide"],
          ["I2", "show"],
        ],
      );
      assert.deepStrictEqual(Rows.of(built, DeclaredGapImgShowHide), [
        { node: images[0]?.id ?? "" },
      ]);
    }),
  );

  it.effect(
    "writes the interaction, a binding of count 1 with no gap-match row, and gap images",
    () =>
      Effect.gen(function* graphicRows() {
        const built = yield* gapRows(contextOf([graphic()], pairs), Rows.empty());

        assert.deepStrictEqual(Rows.of(built, GraphicGapMatchInteraction), [
          {
            id: "node-2",
            maxAssociationsN: 1n,
            minAssociationsN: 0n,
            responseIdentifier: "RESPONSE",
            rootKind: "item",
          },
        ]);
        assert.strictEqual(Rows.of(built, TypedBinding)[0]?.maxCount, 1n);
        assert.strictEqual(Rows.of(built, GapMatchBinding).length, 0);
        assert.deepStrictEqual(
          Rows.of(built, GapImg).map((row) => [
            row.id,
            row.identifier,
            row.interaction,
            row.matchMaxN,
            row.matchMinN,
          ]),
          [["node-4", "I1", "node-2", 2n, 0n]],
        );
        assert.deepStrictEqual(
          Rows.of(built, GapText).map((row) => [row.id, row.interaction]),
          [["node-6", "node-2"]],
        );
        for (const relation of [
          GapImgObjectLabel,
          GapImgTop,
          GapImgLeft,
          GapImgMatchMin,
          DeclaredGraphicGapMatchMaxAssociations,
          GraphicGapMatchMinAssociations,
          AttributeSpelling,
        ] as const) {
          assert.strictEqual(Rows.of(built, relation).length, 0, relation.name);
        }
      }),
  );

  it.effect("writes the optionals and the max-associations marker the source wrote", () =>
    Effect.gen(function* optionals() {
      const ctx = contextOf(
        [
          element(
            "qti-graphic-gap-match-interaction",
            {
              "max-associations": "3",
              "min-associations": "1",
              "response-identifier": "RESPONSE",
            },
            [
              element("qti-gap-img", {
                identifier: "I1",
                left: "1\t2",
                "match-max": "2",
                "match-min": "1",
                "object-label": "Label",
                top: "3",
              }),
            ],
          ),
        ],
        pairs,
      );

      const built = yield* gapRows(ctx, Rows.empty());

      assert.deepStrictEqual(
        Rows.of(built, GraphicGapMatchInteraction).map((row) => [
          row.maxAssociationsN,
          row.minAssociationsN,
        ]),
        [[3n, 1n]],
      );
      assert.deepStrictEqual(Rows.of(built, GraphicGapMatchMinAssociations), [{ node: "node-2" }]);
      assert.deepStrictEqual(Rows.of(built, DeclaredGraphicGapMatchMaxAssociations), [
        { node: "node-2" },
      ]);
      assert.deepStrictEqual(Rows.of(built, GapImgMatchMin), [{ node: "node-3" }]);
      assert.deepStrictEqual(Rows.of(built, GapImgObjectLabel), [
        { node: "node-3", value: "Label" },
      ]);
      assert.deepStrictEqual(Rows.of(built, GapImgTop), [{ node: "node-3", value: "3" }]);
      assert.deepStrictEqual(Rows.of(built, GapImgLeft), [{ node: "node-3", value: "1 2" }]);
    }),
  );

  it.effect("refuses a gap image that sits in no gap-match interaction under admission", () =>
    Effect.gen(function* stray() {
      const exit = yield* Effect.exit(
        gapRows(
          contextOf([
            element("p", {}, [
              element("qti-gap-img", { identifier: "I1", "match-max": "1" }, [
                element("img", { src: "b.png" }),
              ]),
            ]),
          ]),
          Rows.empty(),
        ),
      );

      assert.strictEqual(refusalRuleOf(exit), "admission");
    }),
  );
});

const importRuleOf = (exit: Exit.Exit<Rows, unknown>): string => {
  const failure = Exit.isFailure(exit) ? Exit.findErrorOption(exit) : Option.none();

  return Option.isSome(failure) && failure.value instanceof ImportRefused ? failure.value.rule : "";
};

describe("gapRows on an integer outside its space", () => {
  const refused: readonly (readonly [string, Element])[] = [
    [
      "max-associations of a gap-match interaction",
      element("qti-gap-match-interaction", {
        "max-associations": "-1",
        "response-identifier": "RESPONSE",
      }),
    ],
    [
      "min-associations of a gap-match interaction",
      element("qti-gap-match-interaction", {
        "min-associations": "x",
        "response-identifier": "RESPONSE",
      }),
    ],
    [
      "max-associations of a graphic gap-match interaction",
      element("qti-graphic-gap-match-interaction", {
        "max-associations": "-0",
        "response-identifier": "RESPONSE",
      }),
    ],
    [
      "min-associations of a graphic gap-match interaction",
      element("qti-graphic-gap-match-interaction", {
        "min-associations": "-1",
        "response-identifier": "RESPONSE",
      }),
    ],
    [
      "match-max of a gap text",
      element("qti-gap-match-interaction", { "response-identifier": "RESPONSE" }, [
        gapText("A", { "match-max": "-1" }),
      ]),
    ],
    [
      "a missing match-max of a gap text",
      element("qti-gap-match-interaction", { "response-identifier": "RESPONSE" }, [
        element("qti-gap-text", { identifier: "A" }),
      ]),
    ],
    [
      "match-min of a gap text",
      element("qti-gap-match-interaction", { "response-identifier": "RESPONSE" }, [
        gapText("A", { "match-min": "abc" }),
      ]),
    ],
    [
      "match-max of a gap image",
      element("qti-graphic-gap-match-interaction", { "response-identifier": "RESPONSE" }, [
        element("qti-gap-img", { identifier: "I1", "match-max": "-1" }),
      ]),
    ],
    [
      "a missing match-max of a gap image",
      element("qti-graphic-gap-match-interaction", { "response-identifier": "RESPONSE" }, [
        element("qti-gap-img", { identifier: "I1" }),
      ]),
    ],
    [
      "match-min of a gap image",
      element("qti-graphic-gap-match-interaction", { "response-identifier": "RESPONSE" }, [
        element("qti-gap-img", { identifier: "I1", "match-max": "1", "match-min": "-1" }),
      ]),
    ],
  ];

  for (const [name, tree] of refused) {
    it.effect(`refuses ${name} under attribute-lexical before any row is written`, () =>
      Effect.gen(function* outside() {
        const exit = yield* Effect.exit(gapRows(contextOf([tree], pairs), Rows.empty()));

        assert.strictEqual(importRuleOf(exit), "attribute-lexical");
      }),
    );
  }
});

describe("gapRows on a non-canonical integer spelling", () => {
  it.effect("keeps a signed max-associations as the value, the count and one spelling row", () =>
    Effect.gen(function* signed() {
      const ctx = contextOf(
        [
          element("qti-gap-match-interaction", {
            "max-associations": "+3",
            "response-identifier": "RESPONSE",
          }),
        ],
        pairs,
      );

      const built = yield* gapRows(ctx, Rows.empty());

      assert.strictEqual(Rows.of(built, GapMatchInteraction)[0]?.maxAssociationsN, 3n);
      assert.strictEqual(Rows.of(built, TypedBinding)[0]?.maxCount, 3n);
      assert.deepStrictEqual(Rows.of(built, AttributeSpelling), [
        {
          attribute: "max-associations",
          kind: "qti-gap-match-interaction",
          node: "node-2",
          value: "+3",
        },
      ]);
    }),
  );

  it.effect("keeps a padded match-max and match-min on a gap text as two spelling rows", () =>
    Effect.gen(function* padded() {
      const ctx = contextOf(
        [
          element("qti-gap-match-interaction", { "response-identifier": "RESPONSE" }, [
            gapText("A", { "match-max": "02", "match-min": "01" }),
          ]),
        ],
        pairs,
      );

      const built = yield* gapRows(ctx, Rows.empty());

      assert.deepStrictEqual(
        Rows.of(built, GapText).map((row) => [row.matchMaxN, row.matchMinN]),
        [[2n, 1n]],
      );
      assert.deepStrictEqual(
        Rows.of(built, AttributeSpelling).map((row) => [row.attribute, row.value]),
        [
          ["match-max", "02"],
          ["match-min", "01"],
        ],
      );
    }),
  );

  it.effect("keeps a padded match-max on a gap image as one spelling row", () =>
    Effect.gen(function* image() {
      const ctx = contextOf(
        [
          element("qti-graphic-gap-match-interaction", { "response-identifier": "RESPONSE" }, [
            element("qti-gap-img", { identifier: "I1", "match-max": "+2" }),
          ]),
        ],
        pairs,
      );

      const built = yield* gapRows(ctx, Rows.empty());

      assert.strictEqual(Rows.of(built, GapImg)[0]?.matchMaxN, 2n);
      assert.deepStrictEqual(
        Rows.of(built, AttributeSpelling).map((row) => [row.attribute, row.value]),
        [["match-max", "+2"]],
      );
    }),
  );

  it.effect("writes no spelling row for a canonical value", () =>
    Effect.gen(function* canonical() {
      const built = yield* gapRows(contextOf([graphic()], pairs), Rows.empty());

      assert.strictEqual(Rows.of(built, AttributeSpelling).length, 0);
    }),
  );
});

/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shape` is the column and `ShapeHandle` the roster the bindings and `Coords` rows name; neither is a structure. */
import { createHash } from "node:crypto";
import type { Uuid } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Exit, Option } from "effect";
import {
  attributeReader,
  bindingRows,
  coordsRows,
  gapMatchBindingRow,
  interactionRows,
  markers,
  maxBoundOf,
  maxCountDefault,
  nearestInteraction,
  templateRef,
  typedCopy,
} from "#pantry/import/interactions.ts";
import type { DeclaredVariable } from "#pantry/import/interactions.ts";
import { ItemRefusal, Rows } from "#pantry/import/tree.ts";
import type { IndexedNode, NodeIndex } from "#pantry/import/tree.ts";
import { RectCoords, ShapeCoords } from "#pantry/schema/contracts.ts";
import { CoordsRect, Coords } from "#pantry/schema/shapes.ts";
import { ChoiceTemplateRef } from "#pantry/schema/choices.ts";
import {
  DeclaredMaxChoices,
  DeclaredShuffle,
  GapMatchBinding,
  InteractionBinding,
  RecordBinding,
  TypedBinding,
} from "#pantry/schema/interaction.ts";
import { AttributeLexical } from "#pantry/schema/node.ts";
import type { NodeKindHandle } from "#pantry/schema/node.ts";
import type { Attribute, Element } from "@qti-pie/crust/tree.ts";

/**
 * A well-formed UUID derived from a readable label, so a fixture names its nodes and declarations
 * and the rows still carry the `Uuid` the schema asks for.
 */
const uuidOf = (label: string): Uuid => {
  const hex = createHash("sha1").update(label).digest("hex");

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
};

const documentId = "11111111-1111-4111-8111-111111111111";

const nodeId = "22222222-2222-4222-8222-222222222222";

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
  children: readonly Element[] = [],
  attributes: readonly Attribute[] = [],
): Element => ({
  attributes,
  children,
  kind: "element",
  local,
  namespace: "http://www.imsglobal.org/xsd/imsqtiasi_v3p0",
  prefix: "",
  qname: local,
});

/**
 * A hand-built tree and the node index of its elements; each element's id is its position.
 */
const indexed = (entries: readonly (readonly [Element, NodeKindHandle])[]): NodeIndex =>
  new Map<Element, IndexedNode>(
    entries.map(([found, kind], position) => [
      found,
      { ancestry: "root", id: uuidOf(`node-${position}`), kind },
    ]),
  );

const typedChoice: DeclaredVariable = {
  baseType: Option.some("identifier"),
  cardinality: Option.some("multiple"),
  id: uuidOf("decl-1"),
  shape: "typed",
};

describe("maxCountDefault", () => {
  const none = new Map<string, string>();

  it("defaults max-choices to 1 for choice, hottext, hotspot and position-object", () => {
    for (const kind of [
      "qti-choice-interaction",
      "qti-hottext-interaction",
      "qti-hotspot-interaction",
      "qti-position-object-interaction",
    ] as const) {
      assert.strictEqual(maxCountDefault(kind, none), 1n, kind);
    }
  });

  it("defaults max-choices to 0 for select-point", () => {
    assert.strictEqual(maxCountDefault("qti-select-point-interaction", none), 0n);
  });

  it("defaults max-associations to 1 for associate, match, graphic-associate and gap-match", () => {
    for (const kind of [
      "qti-associate-interaction",
      "qti-match-interaction",
      "qti-graphic-associate-interaction",
      "qti-gap-match-interaction",
    ] as const) {
      assert.strictEqual(maxCountDefault(kind, none), 1n, kind);
    }
  });

  it("reads the attribute the kind's count rule names", () => {
    assert.strictEqual(
      maxCountDefault("qti-hotspot-interaction", new Map([["max-choices", "2"]])),
      2n,
    );
    assert.strictEqual(
      maxCountDefault("qti-select-point-interaction", new Map([["max-choices", "3"]])),
      3n,
    );
    assert.strictEqual(
      maxCountDefault("qti-match-interaction", new Map([["max-associations", "4"]])),
      4n,
    );
  });

  it("reads 0 for a max-choices of 0, which is unlimited", () => {
    assert.strictEqual(
      maxCountDefault("qti-choice-interaction", new Map([["max-choices", "0"]])),
      0n,
    );
  });

  it("ignores the other count attribute", () => {
    assert.strictEqual(
      maxCountDefault("qti-choice-interaction", new Map([["max-associations", "5"]])),
      1n,
    );
  });

  it("writes 1 for every kind with no count rule, whatever it carries", () => {
    for (const kind of [
      "qti-order-interaction",
      "qti-graphic-order-interaction",
      "qti-graphic-gap-match-interaction",
      "qti-text-entry-interaction",
      "qti-extended-text-interaction",
      "qti-inline-choice-interaction",
      "qti-media-interaction",
      "qti-upload-interaction",
      "qti-drawing-interaction",
      "qti-slider-interaction",
      "qti-end-attempt-interaction",
    ] as const) {
      assert.strictEqual(
        maxCountDefault(
          kind,
          new Map([
            ["max-choices", "7"],
            ["max-associations", "7"],
          ]),
        ),
        1n,
        kind,
      );
    }
  });
});

describe("typedCopy and maxBoundOf", () => {
  it("copies the written integer and falls back to the default when it is absent", () => {
    assert.strictEqual(typedCopy(Option.some("12"), 1n), 12n);
    assert.strictEqual(typedCopy(Option.some("+3"), 1n), 3n);
    assert.strictEqual(typedCopy(Option.some("007"), 1n), 7n);
    assert.strictEqual(typedCopy(Option.none(), 4n), 4n);
  });

  it("reads a form that is no natural number as 0", () => {
    assert.strictEqual(typedCopy(Option.some("two"), 1n), 0n);
    assert.strictEqual(typedCopy(Option.some("-1"), 1n), 0n);
  });

  it("is unbounded at 0 and bounded above it", () => {
    assert.strictEqual(maxBoundOf(0n), "unlimited");
    assert.strictEqual(maxBoundOf(3n), "bounded");
  });
});

describe("coordsRows", () => {
  it("writes the Coords row and the arm of its shape", () => {
    const rows = coordsRows(Rows.empty(), nodeId, "qti-hotspot-choice", "rect", "1,2,3,4");

    assert.deepStrictEqual(Rows.of(rows, Coords), [
      {
        node: nodeId,
        ownerKind: "qti-hotspot-choice",
        shape: "rect",
        value: ShapeCoords("1,2,3,4"),
      },
    ]);
    assert.deepStrictEqual(Rows.of(rows, CoordsRect), [
      { node: nodeId, value: RectCoords("1,2,3,4") },
    ]);
    assert.strictEqual(Rows.of(rows, AttributeLexical).length, 0);
  });

  it("writes only the arm of the shape it is given", () => {
    const rows = coordsRows(Rows.empty(), nodeId, "qti-associable-hotspot", "circle", "5,6,7");

    assert.strictEqual(Rows.of(rows, CoordsRect).length, 0);
    assert.strictEqual(rows.size, 2);
  });

  it("stores the value after replace and keeps the lexical form that differs", () => {
    const rows = coordsRows(Rows.empty(), nodeId, "qti-hotspot-choice", "rect", "1,2,\t3,4");

    assert.deepStrictEqual(
      Rows.of(rows, Coords).map((row) => row.value),
      ["1,2, 3,4"],
    );
    assert.deepStrictEqual(Rows.of(rows, AttributeLexical), [
      { attribute: "coords", kind: "qti-hotspot-choice", node: nodeId, value: "1,2,\t3,4" },
    ]);
  });
});

describe("nearestInteraction", () => {
  const hottext = element("qti-hottext");
  const span = element("span", [hottext]);
  const prompt = element("qti-prompt", [span]);
  const hottextInteraction = element("qti-hottext-interaction", [prompt]);
  const inChoicePrompt = element("qti-hottext");
  const choiceSpan = element("span", [inChoicePrompt]);
  const choicePrompt = element("qti-prompt", [choiceSpan]);
  const choiceInteraction = element("qti-choice-interaction", [choicePrompt]);
  const bare = element("qti-hottext");
  const body = element("qti-item-body", [hottextInteraction, choiceInteraction, bare]);
  const root = element("qti-assessment-item", [body]);
  const nodes = indexed([
    [root, "qti-assessment-item"],
    [body, "qti-item-body"],
    [hottextInteraction, "qti-hottext-interaction"],
    [prompt, "qti-prompt"],
    [span, "span"],
    [hottext, "qti-hottext"],
    [choiceInteraction, "qti-choice-interaction"],
    [choicePrompt, "qti-prompt"],
    [choiceSpan, "span"],
    [inChoicePrompt, "qti-hottext"],
    [bare, "qti-hottext"],
  ]);

  it("returns the hottext interaction for a hottext under its prompt", () => {
    const found = nearestInteraction(nodes, hottext);

    assert.deepStrictEqual(
      found,
      Option.some({ id: uuidOf("node-2"), kind: "qti-hottext-interaction" }),
    );
  });

  it("returns the choice interaction for a hottext inside its prompt", () => {
    const found = nearestInteraction(nodes, inChoicePrompt);

    assert.deepStrictEqual(
      found,
      Option.some({ id: uuidOf("node-6"), kind: "qti-choice-interaction" }),
    );
  });

  it("returns None for a hottext directly under the item body", () => {
    assert.isTrue(Option.isNone(nearestInteraction(nodes, bare)));
  });

  it("returns None for the root and for an element no index holds", () => {
    assert.isTrue(Option.isNone(nearestInteraction(nodes, root)));
    assert.isTrue(Option.isNone(nearestInteraction(nodes, element("qti-hottext"))));
  });

  it("does not count an interaction as its own enclosing interaction", () => {
    assert.isTrue(Option.isNone(nearestInteraction(nodes, hottextInteraction)));
  });

  it("finds the nearest of two nested interactions", () => {
    const inner = element("qti-gap");
    const nested = element("qti-text-entry-interaction", [inner]);
    const outer = element("qti-gap-match-interaction", [nested]);
    const tree = indexed([
      [outer, "qti-gap-match-interaction"],
      [nested, "qti-text-entry-interaction"],
      [inner, "qti-gap"],
    ]);

    assert.deepStrictEqual(
      nearestInteraction(tree, inner),
      Option.some({ id: uuidOf("node-1"), kind: "qti-text-entry-interaction" }),
    );
  });
});

describe("bindingRows", () => {
  it.effect("writes the binding and the typed row a typed declaration copies", () =>
    Effect.gen(function* typed() {
      const rows = yield* bindingRows(
        Rows.empty(),
        nodeId,
        documentId,
        "qti-choice-interaction",
        "RESPONSE",
        Option.some(typedChoice),
        "root",
        "false",
        2n,
      );

      assert.deepStrictEqual(Rows.of(rows, InteractionBinding), [
        {
          adaptive: "false",
          ancestry: "root",
          document: documentId,
          interactionKind: "qti-choice-interaction",
          node: nodeId,
          responseIdentifier: "RESPONSE",
          shape: "typed",
        },
      ]);
      assert.deepStrictEqual(Rows.of(rows, TypedBinding), [
        {
          baseType: "identifier",
          cardinality: "multiple",
          document: documentId,
          interactionKind: "qti-choice-interaction",
          maxCount: 2n,
          node: nodeId,
          responseIdentifier: "RESPONSE",
        },
      ]);
      assert.strictEqual(Rows.of(rows, RecordBinding).length, 0);
    }),
  );

  it.effect("writes a record binding for a record declaration", () =>
    Effect.gen(function* record() {
      const rows = yield* bindingRows(
        Rows.empty(),
        nodeId,
        documentId,
        "qti-text-entry-interaction",
        "RESPONSE",
        Option.some({
          baseType: Option.none(),
          cardinality: Option.none(),
          id: uuidOf("decl-2"),
          shape: "record",
        }),
        "root",
        "true",
        1n,
      );

      assert.deepStrictEqual(Rows.of(rows, RecordBinding), [
        { interactionKind: "qti-text-entry-interaction", node: nodeId },
      ]);
      assert.strictEqual(Rows.of(rows, TypedBinding).length, 0);
      assert.deepStrictEqual(
        Rows.of(rows, InteractionBinding).map((row) => [row.shape, row.adaptive]),
        [["record", "true"]],
      );
    }),
  );

  it.effect("refuses a response-identifier that no declaration names", () =>
    Effect.gen(function* undeclared() {
      const exit = yield* Effect.exit(
        bindingRows(
          Rows.empty(),
          nodeId,
          documentId,
          "qti-order-interaction",
          "MISSING",
          Option.none(),
          "root",
          "false",
          1n,
        ),
      );

      assert.isTrue(Exit.isFailure(exit));

      const failure = Exit.isFailure(exit) ? Exit.findErrorOption(exit) : Option.none();
      assert.isTrue(Option.isSome(failure));
      if (Option.isSome(failure)) {
        assert.instanceOf(failure.value, ItemRefusal);
        assert.strictEqual(failure.value.rule, "binding-declared");
        assert.include(failure.value.detail, "MISSING");
      }
    }),
  );
});

describe("gapMatchBindingRow", () => {
  it("writes the cardinality of a typed declaration", () => {
    const rows = gapMatchBindingRow(Rows.empty(), nodeId, typedChoice);

    assert.deepStrictEqual(Rows.of(rows, GapMatchBinding), [
      { cardinality: "multiple", node: nodeId },
    ]);
  });

  it("writes nothing for a record declaration", () => {
    const rows = gapMatchBindingRow(Rows.empty(), nodeId, {
      baseType: Option.none(),
      cardinality: Option.none(),
      id: uuidOf("decl-3"),
      shape: "record",
    });

    assert.strictEqual(Rows.of(rows, GapMatchBinding).length, 0);
  });
});

describe("templateRef", () => {
  const declarations = new Map<string, DeclaredVariable>([
    [
      "TEMPLATE",
      {
        baseType: Option.some("identifier"),
        cardinality: Option.some("single"),
        id: uuidOf("decl-4"),
        shape: "typed",
      },
    ],
  ]);

  it.effect("writes the reference with the type the declaration holds", () =>
    Effect.gen(function* named() {
      const rows = yield* templateRef(Rows.empty(), nodeId, documentId, "TEMPLATE", declarations);

      assert.deepStrictEqual(Rows.of(rows, ChoiceTemplateRef), [
        {
          baseType: "identifier",
          cardinality: "single",
          document: documentId,
          identifier: "TEMPLATE",
          node: nodeId,
        },
      ]);
    }),
  );

  it.effect("refuses an identifier no declaration names", () =>
    Effect.gen(function* unnamed() {
      const exit = yield* Effect.exit(
        templateRef(Rows.empty(), nodeId, documentId, "OTHER", declarations),
      );

      const failure = Exit.isFailure(exit) ? Exit.findErrorOption(exit) : Option.none();
      assert.isTrue(Option.isSome(failure));
      if (Option.isSome(failure)) {
        assert.strictEqual(failure.value.rule, "binding-declared");
        assert.include(failure.value.detail, "OTHER");
      }
    }),
  );
});

describe("markers", () => {
  it("writes one row for each attribute the source wrote, and none for the others", () => {
    const rows = markers(
      Rows.empty(),
      { "max-choices": DeclaredMaxChoices, shuffle: DeclaredShuffle },
      nodeId,
      new Set(["shuffle", "title"]),
    );

    assert.deepStrictEqual(Rows.of(rows, DeclaredShuffle), [{ node: nodeId }]);
    assert.strictEqual(Rows.of(rows, DeclaredMaxChoices).length, 0);
  });
});

describe("attributeReader", () => {
  it("reads an attribute under its class from the inventory and keeps the lexical form", () => {
    const own = element(
      "qti-choice-interaction",
      [],
      [
        attribute("response-identifier", "  RESPONSE "),
        attribute("data-min-selections-message", "pick\tone"),
        attribute("max-choices", "2"),
      ],
    );
    const reader = attributeReader(Rows.empty(), own, {
      id: nodeId,
      kind: "qti-choice-interaction",
    });

    assert.deepStrictEqual(reader.read("response-identifier"), Option.some("RESPONSE"));
    assert.deepStrictEqual(reader.read("data-min-selections-message"), Option.some("pick one"));
    assert.deepStrictEqual(reader.read("shuffle"), Option.none());
    assert.deepStrictEqual(
      Rows.of(reader.rows(), AttributeLexical).map((row) => [row.attribute, row.value]),
      [
        ["response-identifier", "  RESPONSE "],
        ["data-min-selections-message", "pick\tone"],
      ],
    );
    assert.deepStrictEqual([...reader.written()].toSorted(), [
      "data-min-selections-message",
      "max-choices",
      "response-identifier",
    ]);
  });
});

describe("interactionRows", () => {
  it.effect("returns the rows of a tree with no interaction unchanged", () =>
    Effect.gen(function* untouched() {
      const root = element("qti-assessment-item", [element("qti-item-body")]);
      const nodes = indexed([[root, "qti-assessment-item"]]);
      const rows = Rows.add(Rows.empty(), DeclaredShuffle, [{ node: nodeId }]);

      const built = yield* interactionRows(
        root,
        nodes,
        documentId,
        new Map(),
        { adaptive: "false" },
        rows,
      );

      assert.strictEqual(built, rows);
    }),
  );
});

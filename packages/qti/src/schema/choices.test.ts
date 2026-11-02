/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shapes.ts` and its `shape` field are the contract this test reads; the shape here is a geometric one. */
import { closedId, pg, relation, schema, uuid } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Predicate } from "effect";
import * as choices from "#qti/schema/choices.ts";
import * as declaration from "#qti/schema/declaration.ts";
import * as document from "#qti/schema/document.ts";
import * as node from "#qti/schema/node.ts";
import * as pkg from "#qti/schema/package.ts";
import * as patterns from "#qti/schema/patterns.ts";
import * as rosters from "#qti/schema/content/rosters.ts";
import { recordBindingFit } from "#qti/schema/seed/record-binding-fit.ts";
import * as shapes from "#qti/schema/shapes.ts";

/**
 * The probe schema: the spine relations the two leaves read, with the leaves' own.
 */
const probe = () =>
  schema(
    "QtiChoicesProbe",
    {
      ...node.relations,
      ...pkg.relations,
      ...document.relations,
      ...declaration.relations,
      ...rosters.relations,
      ...choices.relations,
      ...shapes.relations,
    },
    [
      ...node.rules,
      ...pkg.rules,
      ...document.rules,
      ...declaration.rules,
      ...choices.rules,
      ...shapes.rules,
    ],
  );

/**
 * A stand-in for a hotspot-like arm: an `(id, shape)` pair the helpers contain `Coords` into.
 */
const ProbeArm = relation("ProbeArm", { id: uuid, shape: closedId(rosters.Shape) }, ["id"]);

/**
 * A relation carrying the two match bounds, for `matchBoundsCheck`.
 */
const ProbeBounds = relation(
  "ProbeBounds",
  { id: uuid, matchMaxN: pg.bigint, matchMinN: pg.bigint },
  ["id"],
);

/**
 * A containment side's selection of a relation, or none where the side names the relation whole.
 */
const selectionOf = (side: { readonly source: object }) =>
  "relation" in side.source && "bindings" in side.source ? side.source : undefined;

/**
 * Whether a pattern's whole-string form admits a value.
 */
const admits = (source: string, value: string): boolean => new RegExp(source, "u").test(value);

/**
 * The `shape` a side's selection binds, or the empty string where it binds none.
 */
const selectedShape = (side: { readonly source: object }): string => {
  const selection = selectionOf(side);

  return selection !== undefined && Predicate.hasProperty(selection.bindings, "shape")
    ? String(selection.bindings.shape)
    : "";
};

type Capacity = ReturnType<typeof shapes.shapeCapacities>[number];

/**
 * The inclusive bounds a capacity statement carries on its description, which the public statement
 * type does not expose.
 */
const boundsOf = (rule: Capacity | undefined): readonly [unknown, unknown] => {
  const within =
    Predicate.hasProperty(rule, "desc") &&
    Predicate.hasProperty(rule.desc, "within") &&
    Predicate.hasProperty(rule.desc.within, "low") &&
    Predicate.hasProperty(rule.desc.within, "high")
      ? rule.desc.within
      : undefined;

  assert.isDefined(within, "capacity description");

  return [within.low, within.high];
};

describe("choices and shapes", () => {
  it("builds a schema over node, declaration, rosters, choices and shapes without refusal", () => {
    const built = probe();
    for (const name of ["ChoiceTemplateRef", "MatchGroup", "Coords", "CoordsRect"]) {
      assert.include(Object.keys(built.relations), name);
    }
  });

  it("keys the arms by nothing: both modules export no NodeKind arm", () => {
    assert.deepStrictEqual(choices.arms, {});
    assert.deepStrictEqual(shapes.arms, {});
  });

  it("refuses 1,2,3 and admits 1,2,3,4 under CoordsRect", () => {
    const { value } = shapes.relations.CoordsRect.fields;
    assert.strictEqual(value.pattern.source, patterns.coordsRect);
    assert.isFalse(admits(value.pattern.source, "1,2,3"));
    assert.isTrue(admits(value.pattern.source, "1,2,3,4"));
  });

  it("refuses 1,2,3,4 and admits 1,2,3,4,5,6 under CoordsPoly", () => {
    const { value } = shapes.relations.CoordsPoly.fields;
    assert.strictEqual(value.pattern.source, patterns.coordsPoly);
    assert.isFalse(admits(value.pattern.source, "1,2,3,4"));
    assert.isTrue(admits(value.pattern.source, "1,2,3,4,5,6"));
  });

  it("types each Coords arm and the parent by its pattern", () => {
    const { Coords, CoordsCircle, CoordsDefault, CoordsEllipse } = shapes.relations;
    assert.strictEqual(Coords.fields.value.pattern.source, patterns.coordsAny);
    assert.strictEqual(CoordsCircle.fields.value.pattern.source, patterns.coordsCircle);
    assert.strictEqual(CoordsDefault.fields.value.pattern.source, patterns.coordsAny);
    assert.strictEqual(CoordsEllipse.fields.value.pattern.source, patterns.coordsEllipse);
  });

  it("declares the Coords alternatives with five arms, keyed by node", () => {
    const [rule, ...rest] = shapes.rules.filter((candidate) => candidate.kind === "alternatives");
    assert.strictEqual(rest.length, 0);
    assert.strictEqual(rule?.parent, shapes.relations.Coords);
    assert.strictEqual(rule?.discriminator, "shape");
    assert.strictEqual(rule?.roster, rosters.Shape);
    assert.deepStrictEqual(Object.keys(rule?.arms ?? {}).toSorted(), [
      "circle",
      "default",
      "ellipse",
      "poly",
      "rect",
    ]);
    assert.deepStrictEqual([...shapes.relations.Coords.primaryKey], ["node"]);
  });

  it("carries ownerKind on Coords and contains it in Node by (id, kind)", () => {
    assert.deepStrictEqual(Object.keys(shapes.relations.Coords.fields).toSorted(), [
      "node",
      "ownerKind",
      "shape",
      "value",
    ]);

    const owned = shapes.rules
      .filter((rule) => rule.kind === "contained")
      .filter((rule) => rule.left.source === shapes.relations.Coords);
    assert.strictEqual(owned.length, 1);
    assert.strictEqual(owned[0]?.right.source, node.relations.Node);
    assert.deepStrictEqual([...(owned[0]?.left.fields ?? [])], ["node", "ownerKind"]);
    assert.deepStrictEqual([...(owned[0]?.right.fields ?? [])], ["id", "kind"]);
  });

  it("coordsBinding selects the Coords source on the owner and targets the arm's (id, shape)", () => {
    const rule = shapes.coordsBinding(ProbeArm, "qti-hotspot-choice");
    assert.strictEqual(rule?.kind, "contained");

    const source = selectionOf(rule.left);
    assert.strictEqual(source?.relation, shapes.relations.Coords);
    assert.deepStrictEqual(source?.bindings, { ownerKind: "qti-hotspot-choice" });
    assert.deepStrictEqual([...rule.left.fields], ["node", "shape"]);
    assert.strictEqual(rule.right.source, ProbeArm);
    assert.deepStrictEqual([...rule.right.fields], ["id", "shape"]);
  });

  it("shapeCapacities gives 1..1 for four shapes and 0..1 for default, each selecting the arm", () => {
    const statements = shapes.shapeCapacities(ProbeArm);
    assert.strictEqual(statements.length, 5);

    const bySelected = new Map(
      statements.map((statement) => [selectedShape(statement.target), statement]),
    );
    assert.deepStrictEqual([...bySelected.keys()].toSorted(), [
      "circle",
      "default",
      "ellipse",
      "poly",
      "rect",
    ]);
    for (const statement of statements) {
      assert.strictEqual(statement.kind, "capacity");
      assert.strictEqual(selectionOf(statement.target)?.relation, ProbeArm);
      assert.deepStrictEqual([...statement.target.fields], ["id"]);
      assert.strictEqual(statement.from.source, shapes.relations.Coords);
      assert.deepStrictEqual([...statement.from.fields], ["node"]);
    }
    assert.deepStrictEqual(boundsOf(bySelected.get("default")), [0n, 1n]);
    for (const shape of ["circle", "ellipse", "poly", "rect"]) {
      assert.deepStrictEqual(boundsOf(bySelected.get(shape)), [1n, 1n], shape);
    }
  });

  it("types MatchGroup.value by ncNameListOrEmpty and keys it by node", () => {
    const { MatchGroup } = choices.relations;
    assert.strictEqual(MatchGroup.fields.value.pattern.source, patterns.ncNameListOrEmpty);
    assert.deepStrictEqual([...MatchGroup.primaryKey], ["node"]);
  });

  it("holds the ChoiceTemplateRef key, both containments, the Node containment and the check", () => {
    const { ChoiceTemplateRef } = choices.relations;
    assert.deepStrictEqual([...ChoiceTemplateRef.primaryKey], ["node"]);
    assert.deepStrictEqual(Object.keys(ChoiceTemplateRef.fields).toSorted(), [
      "baseType",
      "cardinality",
      "document",
      "identifier",
      "node",
    ]);

    const from = choices.rules
      .filter((rule) => rule.kind === "contained")
      .filter((rule) => rule.left.source === ChoiceTemplateRef)
      .map((rule) => ({
        left: [...rule.left.fields],
        right: [...rule.right.fields],
        selection: selectionOf(rule.right)?.bindings,
        target: selectionOf(rule.right)?.relation ?? rule.right.source,
      }));
    assert.deepStrictEqual(from, [
      {
        left: ["document", "identifier"],
        right: ["document", "identifier"],
        selection: { kind: "template" },
        target: declaration.relations.Declaration,
      },
      {
        left: ["document", "identifier", "baseType", "cardinality"],
        right: ["document", "identifier", "baseType", "cardinality"],
        selection: undefined,
        target: declaration.relations.TypedDeclaration,
      },
      {
        left: ["node", "document"],
        right: ["id", "tree"],
        selection: undefined,
        target: node.relations.Node,
      },
    ]);

    const checks = choices.rules.filter((rule) => rule.kind === "check");
    assert.deepStrictEqual(
      checks.map((rule) => [rule.name, rule.relation]),
      [["ChoiceTemplateRefType", ChoiceTemplateRef]],
    );
  });

  it("matchBoundsCheck returns a named check on its relation", () => {
    const rule = choices.matchBoundsCheck("ProbeMatchBounds", ProbeBounds);
    assert.strictEqual(rule?.kind, "check");
    assert.strictEqual(rule.name, "ProbeMatchBounds");
    assert.strictEqual(rule.relation, ProbeBounds);
  });

  it("holds exactly the two record-binding interaction kinds, each a NodeKind handle", () => {
    assert.deepStrictEqual(recordBindingFit.map((row) => row.interactionKind).toSorted(), [
      "qti-extended-text-interaction",
      "qti-text-entry-interaction",
    ]);
    for (const row of recordBindingFit) {
      assert.include(node.relations.NodeKind.handles, row.interactionKind);
    }
  });
});

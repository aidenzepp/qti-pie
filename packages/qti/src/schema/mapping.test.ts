/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shapes` is the module under test's dependency, and the shape here is a geometric one. */
import { schema } from "@bjornpagen/grizzle";
import { assert, describe, it } from "@effect/vitest";
import { Predicate } from "effect";
import * as declaration from "#qti/schema/declaration.ts";
import * as document from "#qti/schema/document.ts";
import * as rosters from "#qti/schema/content/rosters.ts";
import * as mapping from "#qti/schema/mapping.ts";
import * as node from "#qti/schema/node.ts";
import * as pkg from "#qti/schema/package.ts";
import { mappableBaseType } from "#qti/schema/seed/mappable-base-type.ts";
import * as shapes from "#qti/schema/shapes.ts";

/**
 * The probe schema: the spine relations the module reads, with its own.
 */
const probe = () =>
  schema(
    "QtiMappingProbe",
    {
      ...node.relations,
      ...pkg.relations,
      ...document.relations,
      ...declaration.relations,
      ...rosters.relations,
      ...shapes.relations,
      ...mapping.relations,
    },
    [
      ...node.rules,
      ...pkg.rules,
      ...document.rules,
      ...declaration.rules,
      ...shapes.rules,
      ...mapping.rules,
    ],
  );

type Rule = (typeof mapping.rules)[number];

type ContainedRule = Extract<Rule, { readonly kind: "contained" }>;

type AlternativesRule = Extract<Rule, { readonly kind: "alternatives" }>;

type KeyRule = Extract<Rule, { readonly kind: "key" }>;

type CapacityRule = Extract<Rule, { readonly kind: "capacity" }>;

/**
 * The selection a containment or capacity side holds, or undefined where it names a relation whole.
 */
const selectionOf = (side: { readonly source: object }) =>
  "relation" in side.source && "bindings" in side.source ? side.source : undefined;

/**
 * The containments whose left side is one relation, selected or not, as plain values.
 */
const containmentsFrom = (relation: { readonly name: string }) =>
  mapping.rules
    .filter((rule): rule is ContainedRule => rule.kind === "contained")
    .filter((rule) => (selectionOf(rule.left)?.relation ?? rule.left.source) === relation)
    .map((rule) => ({
      left: [...rule.left.fields],
      right: [...rule.right.fields],
      selection: selectionOf(rule.left)?.bindings,
      target: selectionOf(rule.right)?.relation ?? rule.right.source,
      targetSelection: selectionOf(rule.right)?.bindings,
    }));

/**
 * The alternatives of one parent on its `baseType`.
 */
const alternativesOf = (parent: { readonly name: string }) =>
  mapping.rules
    .filter((rule): rule is AlternativesRule => rule.kind === "alternatives")
    .filter((rule) => rule.parent === parent);

const { relations } = mapping;

const baseTypes = declaration.BaseType.handles;

const mappable = baseTypes.filter((handle) => handle !== "file" && handle !== "duration");

const armSuffix: Readonly<Record<(typeof baseTypes)[number], string>> = {
  boolean: "Boolean",
  directedPair: "DirectedPair",
  duration: "Duration",
  file: "File",
  float: "Float",
  identifier: "Identifier",
  integer: "Integer",
  pair: "Pair",
  point: "Point",
  string: "String",
  uri: "Uri",
};

describe("mapping", () => {
  it("seeds the nine mappable base types, all but file and duration", () => {
    assert.strictEqual(mappableBaseType.length, 9);
    assert.deepStrictEqual(
      mappableBaseType.map((row) => row.baseType).toSorted(),
      [...mappable].toSorted(),
    );
    assert.notInclude(
      mappableBaseType.map((row) => row.baseType),
      "file",
    );
    assert.notInclude(
      mappableBaseType.map((row) => row.baseType),
      "duration",
    );
  });

  it("builds a schema over node, declaration, rosters, shapes and mapping without refusal", () => {
    const built = probe();
    for (const name of [
      "MappableBaseType",
      "Mapping",
      "MapEntry",
      "AreaMapping",
      "AreaMapEntry",
      "MatchTable",
      "MatchTableEntry",
      "InterpolationTable",
      "InterpolationTableEntry",
    ]) {
      assert.include(Object.keys(built.relations), name);
    }
  });

  it("keys the eight arms by their NodeKind handles", () => {
    assert.deepStrictEqual(Object.keys(mapping.arms).toSorted(), [
      "qti-area-map-entry",
      "qti-area-mapping",
      "qti-interpolation-table",
      "qti-interpolation-table-entry",
      "qti-map-entry",
      "qti-mapping",
      "qti-match-table",
      "qti-match-table-entry",
    ]);
    assert.strictEqual(mapping.arms["qti-mapping"], relations.Mapping);
    assert.strictEqual(mapping.arms["qti-map-entry"], relations.MapEntry);
    assert.strictEqual(mapping.arms["qti-area-mapping"], relations.AreaMapping);
    assert.strictEqual(mapping.arms["qti-area-map-entry"], relations.AreaMapEntry);
    assert.strictEqual(mapping.arms["qti-match-table"], relations.MatchTable);
    assert.strictEqual(mapping.arms["qti-match-table-entry"], relations.MatchTableEntry);
    assert.strictEqual(mapping.arms["qti-interpolation-table"], relations.InterpolationTable);
    assert.strictEqual(
      mapping.arms["qti-interpolation-table-entry"],
      relations.InterpolationTableEntry,
    );
  });

  it("keys MappableBaseType by base type", () => {
    assert.deepStrictEqual(Object.keys(relations.MappableBaseType.fields), ["baseType"]);
  });

  it("keys Mapping and AreaMapping by id and by declaration", () => {
    const keys = mapping.rules.filter((rule): rule is KeyRule => rule.kind === "key");
    for (const owner of [relations.Mapping, relations.AreaMapping]) {
      assert.deepStrictEqual(
        keys.filter((rule) => rule.relation === owner).map((rule) => [...rule.fields]),
        [["declaration"]],
        owner.name,
      );
    }
  });

  it("types a mapping by its declaration and by the mappable base types", () => {
    assert.deepStrictEqual(containmentsFrom(relations.Mapping), [
      {
        left: ["id", "declaration"],
        right: ["child", "parent"],
        selection: undefined,
        target: node.relations.Edge,
        targetSelection: undefined,
      },
      {
        left: ["declaration", "baseType"],
        right: ["id", "baseType"],
        selection: undefined,
        target: declaration.relations.TypedDeclaration,
        targetSelection: undefined,
      },
      {
        left: ["baseType"],
        right: ["baseType"],
        selection: undefined,
        target: relations.MappableBaseType,
        targetSelection: undefined,
      },
    ]);
  });

  it("holds an area mapping's declaration to the point base type", () => {
    const point = containmentsFrom(relations.AreaMapping).find(
      (rule) => rule.target === declaration.relations.TypedDeclaration,
    );
    assert.isDefined(point);
    assert.deepStrictEqual(point?.left, ["declaration"]);
    assert.deepStrictEqual(point?.right, ["id"]);
    assert.deepStrictEqual(point?.targetSelection, { baseType: "point" });
  });

  it("contains each bound into the mapping it belongs to", () => {
    for (const [bound, owner] of [
      [relations.MappingLowerBound, relations.Mapping],
      [relations.MappingUpperBound, relations.Mapping],
      [relations.AreaMappingLowerBound, relations.AreaMapping],
      [relations.AreaMappingUpperBound, relations.AreaMapping],
      [relations.DeclaredMapEntryCaseSensitive, relations.MapEntry],
      [relations.DeclaredMappingDefaultValue, relations.Mapping],
      [relations.DeclaredAreaMappingDefaultValue, relations.AreaMapping],
      [relations.DeclaredIncludeBoundary, relations.InterpolationTableEntry],
    ] as const) {
      const owned = containmentsFrom(bound);
      assert.strictEqual(owned.length, 1, bound.name);
      assert.strictEqual(owned[0]?.target, owner, bound.name);
      assert.deepStrictEqual(owned[0]?.left, ["node"]);
      assert.deepStrictEqual(owned[0]?.right, ["id"]);
    }
  });

  it("copies a map entry's mapping into Mapping and its place into Edge", () => {
    assert.deepStrictEqual(
      containmentsFrom(relations.MapEntry).map((rule) => [rule.left, rule.right, rule.target]),
      [
        [["mapping", "declaration"], ["id", "declaration"], relations.Mapping],
        [["id", "mapping", "position"], ["child", "parent", "position"], node.relations.Edge],
      ],
    );
  });

  it("copies an area map entry's place into Edge and binds its Coords on its own kind", () => {
    const owned = containmentsFrom(relations.AreaMapEntry);
    assert.deepStrictEqual(
      owned.map((rule) => [rule.left, rule.right, rule.target]),
      [
        [["id", "areaMapping", "position"], ["child", "parent", "position"], node.relations.Edge],
        [["areaMapping"], ["id"], relations.AreaMapping],
      ],
    );

    const bound = containmentsFrom(shapes.Coords).filter(
      (rule) => rule.target === relations.AreaMapEntry,
    );
    assert.strictEqual(bound.length, 1);
    assert.deepStrictEqual(bound[0]?.selection, { ownerKind: "qti-area-map-entry" });
    assert.deepStrictEqual(bound[0]?.left, ["node", "shape"]);
    assert.deepStrictEqual(bound[0]?.right, ["id", "shape"]);
  });

  it("states the five shape capacities of the area map entry", () => {
    const capacities = mapping.rules.filter(
      (rule): rule is CapacityRule =>
        rule.kind === "capacity" && selectionOf(rule.target)?.relation === relations.AreaMapEntry,
    );
    assert.deepStrictEqual(
      capacities
        .map((rule) => JSON.stringify(selectionOf(rule.target)?.bindings))
        .toSorted((a, b) => a.localeCompare(b)),
      ["circle", "default", "ellipse", "poly", "rect"].map((shape) => JSON.stringify({ shape })),
    );
  });

  it("holds each table's declaration to a single-cardinality outcome", () => {
    for (const table of [relations.MatchTable, relations.InterpolationTable]) {
      const owned = containmentsFrom(table);
      const single = owned.filter(
        (rule) =>
          rule.target === declaration.relations.TypedDeclaration &&
          rule.targetSelection !== undefined,
      );
      assert.strictEqual(single.length, 1, table.name);
      assert.deepStrictEqual(single[0]?.left, ["declaration"]);
      assert.deepStrictEqual(single[0]?.right, ["id"]);
      assert.deepStrictEqual(single[0]?.targetSelection, { cardinality: "single" });

      const outcome = owned.filter((rule) => rule.target === declaration.relations.Declaration);
      assert.strictEqual(outcome.length, 1, table.name);
      assert.deepStrictEqual(outcome[0]?.left, ["declaration"]);
      assert.deepStrictEqual(outcome[0]?.right, ["id"]);
      assert.deepStrictEqual(outcome[0]?.targetSelection, { kind: "outcome" });

      const typed = owned.filter(
        (rule) =>
          rule.target === declaration.relations.TypedDeclaration &&
          rule.targetSelection === undefined,
      );
      assert.strictEqual(typed.length, 1, table.name);
      assert.deepStrictEqual(typed[0]?.left, ["declaration", "baseType"]);
      assert.deepStrictEqual(typed[0]?.right, ["id", "baseType"]);
    }
  });

  it("keys each table by declaration", () => {
    const keys = mapping.rules.filter((rule): rule is KeyRule => rule.kind === "key");
    for (const table of [relations.MatchTable, relations.InterpolationTable]) {
      assert.deepStrictEqual(
        keys.filter((rule) => rule.relation === table).map((rule) => [...rule.fields]),
        [["declaration"]],
        table.name,
      );
    }
  });

  it("copies a table entry's place into Edge and its table's type into the table", () => {
    for (const [entry, table] of [
      [relations.MatchTableEntry, relations.MatchTable],
      [relations.InterpolationTableEntry, relations.InterpolationTable],
    ] as const) {
      assert.deepStrictEqual(
        containmentsFrom(entry).map((rule) => [rule.left, rule.right, rule.target]),
        [
          [["id", "table", "position"], ["child", "parent", "position"], node.relations.Edge],
          [["table", "declaration", "baseType"], ["id", "declaration", "baseType"], table],
        ],
        entry.name,
      );
    }
  });

  it("declares eleven arms on base type for each map entry and table relation", () => {
    for (const [parent, prefix, field] of [
      [relations.MapEntry, "MapEntry", "mapKey"],
      [relations.MatchTableEntry, "MatchTableEntry", "targetValue"],
      [relations.InterpolationTableEntry, "InterpolationTableEntry", "targetValue"],
      [relations.MatchTableDefaultValue, "MatchTableDefaultValue", "value"],
      [relations.InterpolationTableDefaultValue, "InterpolationTableDefaultValue", "value"],
    ] as const) {
      const [rule, ...rest] = alternativesOf(parent);
      assert.strictEqual(rest.length, 0, parent.name);
      assert.isDefined(rule);
      assert.strictEqual(rule?.discriminator, "baseType");
      assert.strictEqual(rule?.roster, declaration.relations.BaseType);

      const entries: readonly (readonly [string, unknown])[] = Object.entries(rule?.arms ?? {});
      assert.deepStrictEqual(entries.map(([name]) => name).toSorted(), [...baseTypes].toSorted());
      for (const handle of baseTypes) {
        const arm = entries.find(([name]) => name === handle)?.[1];

        assert.isTrue(
          Predicate.hasProperty(arm, "name") &&
            Predicate.hasProperty(arm, "fields") &&
            Predicate.isObject(arm.fields) &&
            arm.name === `${prefix}${armSuffix[handle]}` &&
            field in arm.fields,
          `${prefix}${armSuffix[handle]}`,
        );
      }
    }
  });

  it("holds a table's default value to the table's base type", () => {
    for (const [value, table] of [
      [relations.MatchTableDefaultValue, relations.MatchTable],
      [relations.InterpolationTableDefaultValue, relations.InterpolationTable],
    ] as const) {
      assert.deepStrictEqual(
        containmentsFrom(value).map((rule) => [rule.left, rule.right, rule.target]),
        [[["node", "baseType"], ["id", "baseType"], table]],
        value.name,
      );
    }
  });
});

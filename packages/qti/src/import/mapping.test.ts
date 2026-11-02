/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shape` is the column the area map entry and `Coords` rows name; it is a geometric shape here, not a structure. */
import { assert, describe, it } from "@effect/vitest";
import { Effect, Exit, Option } from "effect";
import type { DeclaredVariable } from "#qti/import/interactions.ts";
import { mappingRows } from "#qti/import/mapping.ts";
import { Rows, treeRows } from "#qti/import/tree.ts";
import type { NodeIndex } from "#qti/import/tree.ts";
import {
  AreaMapEntry,
  AreaMapping,
  AreaMappingLowerBound,
  AreaMappingUpperBound,
  DeclaredIncludeBoundary,
  DeclaredMapEntryCaseSensitive,
  InterpolationTable,
  InterpolationTableDefaultValue,
  InterpolationTableEntry,
  MapEntry,
  Mapping,
  MappingLowerBound,
  MappingUpperBound,
  MatchTable,
  MatchTableDefaultValue,
  MatchTableEntry,
  relations,
} from "#qti/schema/mapping.ts";
import { AttributeLexical, Edge } from "#qti/schema/node.ts";
import { Coords, CoordsRect } from "#qti/schema/shapes.ts";
import { readXml } from "#qti/xml/read.ts";
import type { Element } from "#qti/xml/tree.ts";

const {
  InterpolationTableDefaultValueFloat,
  InterpolationTableEntryFloat,
  MapEntryIdentifier,
  MapEntryInteger,
  MatchTableDefaultValueFloat,
  MatchTableEntryFloat,
} = relations;

const treeId = "11111111-1111-4111-8111-111111111111";

const namespace = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * An item document whose body is the given declarations, written without whitespace between
 * elements so each child's position is its index.
 */
const itemXml = (declarations: string): Uint8Array =>
  new TextEncoder().encode(
    `<qti-assessment-item xmlns="${namespace}" identifier="item" title="Item" adaptive="false" time-dependent="false">${declarations}</qti-assessment-item>`,
  );

const baseTypes = [
  "boolean",
  "directedPair",
  "duration",
  "file",
  "float",
  "identifier",
  "integer",
  "pair",
  "point",
  "string",
  "uri",
] as const;

/**
 * The variable each declaration of the item names, by identifier, as the item pass hands them on.
 */
const variablesOf = (root: Element, nodes: NodeIndex): ReadonlyMap<string, DeclaredVariable> => {
  const variables = new Map<string, DeclaredVariable>();
  for (const child of root.children) {
    const node = child.kind === "element" ? nodes.get(child) : undefined;
    if (child.kind !== "element" || node === undefined) {
      continue;
    }

    const read = (name: string) =>
      Option.fromNullishOr(child.attributes.find((found) => found.local === name)?.value);
    const baseType = Option.flatMapNullishOr(read("base-type"), (text) =>
      baseTypes.find((known) => known === text),
    );
    variables.set(
      Option.getOrElse(read("identifier"), () => ""),
      {
        baseType,
        cardinality: Option.some("single"),
        id: node.id,
        shape: "typed",
      },
    );
  }

  return variables;
};

/**
 * Read an item, build its tree rows and name each declaration's variable.
 */
const imported = (declarations: string) =>
  Effect.gen(function* importItem() {
    const doc = yield* readXml(itemXml(declarations));
    const { nodes, rows } = yield* treeRows(
      doc,
      { charset: doc.charset, id: treeId, kind: "document", root: "item", version: "3.0.0" },
      Rows.empty(),
    );

    return { nodes, root: doc.root, rows, variables: variablesOf(doc.root, nodes) };
  });

const declarationOf = (
  variables: ReadonlyMap<string, DeclaredVariable>,
  identifier: string,
): string => Option.getOrThrow(Option.fromNullishOr(variables.get(identifier)?.id));

const idsOf = (nodes: NodeIndex, kind: string): string[] =>
  [...nodes.values()].filter((found) => found.kind === kind).map((found) => found.id);

const pairOf = (nodes: NodeIndex, kind: string): readonly [string, string] => {
  const [first, second] = idsOf(nodes, kind);

  return [
    Option.getOrThrow(Option.fromNullishOr(first)),
    Option.getOrThrow(Option.fromNullishOr(second)),
  ];
};

const idOf = (nodes: NodeIndex, kind: string): string =>
  Option.getOrThrow(
    Option.fromNullishOr([...nodes.values()].find((found) => found.kind === kind)?.id),
  );

const mapped = (declarations: string) =>
  Effect.gen(function* mapDeclarations() {
    const item = yield* imported(declarations);
    const built = yield* mappingRows(item.root, item.nodes, treeId, item.variables, item.rows);

    return { ...item, built };
  });

describe("mappingRows on a mapping", () => {
  it.effect("writes the mapping and one typed entry per map entry at its position", () =>
    Effect.gen(function* identifierMapping() {
      const { built, nodes, variables } = yield* mapped(
        `<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"><qti-mapping lower-bound="0" upper-bound="3"><qti-map-entry map-key="A" mapped-value="1"/><qti-map-entry map-key="B" mapped-value="2" case-sensitive="true"/></qti-mapping></qti-response-declaration>`,
      );
      const mapping = idOf(nodes, "qti-mapping");
      const declaration = declarationOf(variables, "RESPONSE");

      assert.deepStrictEqual(Rows.of(built, Mapping), [
        { baseType: "identifier", declaration, defaultValue: "0", document: treeId, id: mapping },
      ]);
      assert.deepStrictEqual(Rows.of(built, MappingLowerBound), [{ node: mapping, value: "0" }]);
      assert.deepStrictEqual(Rows.of(built, MappingUpperBound), [{ node: mapping, value: "3" }]);

      const [first, second] = pairOf(nodes, "qti-map-entry");
      assert.deepStrictEqual(Rows.of(built, MapEntry), [
        {
          baseType: "identifier",
          caseSensitive: "false",
          declaration,
          id: first,
          mappedValue: "1",
          mapping,
          position: 0n,
        },
        {
          baseType: "identifier",
          caseSensitive: "true",
          declaration,
          id: second,
          mappedValue: "2",
          mapping,
          position: 1n,
        },
      ]);
      assert.deepStrictEqual(Rows.of(built, MapEntryIdentifier), [
        { id: first, mapKey: "A" },
        { id: second, mapKey: "B" },
      ]);
      assert.deepStrictEqual(Rows.of(built, DeclaredMapEntryCaseSensitive), [{ node: second }]);
      assert.strictEqual(Rows.of(built, AreaMapping).length, 0);
    }),
  );

  it.effect("copies a written default-value and omits bounds the source left out", () =>
    Effect.gen(function* defaults() {
      const { built } = yield* mapped(
        `<qti-response-declaration identifier="RESPONSE" cardinality="multiple" base-type="identifier"><qti-mapping default-value="-1.5"><qti-map-entry map-key="A" mapped-value="1"/></qti-mapping></qti-response-declaration>`,
      );

      assert.deepStrictEqual(
        Rows.of(built, Mapping).map((row) => row.defaultValue),
        ["-1.5"],
      );
      assert.strictEqual(Rows.of(built, MappingLowerBound).length, 0);
      assert.strictEqual(Rows.of(built, MappingUpperBound).length, 0);
      assert.strictEqual(Rows.of(built, DeclaredMapEntryCaseSensitive).length, 0);
    }),
  );

  it.effect("stores a key after the class of its base type's lexical space", () =>
    Effect.gen(function* keyClass() {
      const { built, nodes } = yield* mapped(
        `<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="integer"><qti-mapping><qti-map-entry map-key=" 12 " mapped-value="1"/></qti-mapping></qti-response-declaration>`,
      );
      const entry = idOf(nodes, "qti-map-entry");

      assert.deepStrictEqual(Rows.of(built, MapEntryInteger), [{ id: entry, mapKey: "12" }]);
      assert.deepStrictEqual(
        Rows.of(built, AttributeLexical).map((row) => [row.node, row.attribute, row.value]),
        [[entry, "map-key", " 12 "]],
      );
    }),
  );

  it.effect("writes no mapping for a declaration with no base type", () =>
    Effect.gen(function* record() {
      const { built } = yield* mapped(
        `<qti-response-declaration identifier="RESPONSE" cardinality="record"><qti-mapping><qti-map-entry map-key="A" mapped-value="1"/></qti-mapping></qti-response-declaration>`,
      );

      assert.strictEqual(Rows.of(built, Mapping).length, 0);
      assert.strictEqual(Rows.of(built, MapEntry).length, 0);
    }),
  );
});

describe("mappingRows on an area mapping", () => {
  const point = `<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="point"><qti-area-mapping lower-bound="0" upper-bound="2" default-value="0.5"><qti-area-map-entry shape="rect" coords="0,0,10,10" mapped-value="1"/><qti-area-map-entry shape="circle" coords="5,5,3" mapped-value="2"/></qti-area-mapping></qti-response-declaration>`;

  it.effect("writes the area mapping, its bounds, its entries and their coordinates", () =>
    Effect.gen(function* areaMapping() {
      const { built, nodes, variables } = yield* mapped(point);
      const mapping = idOf(nodes, "qti-area-mapping");
      const declaration = declarationOf(variables, "RESPONSE");

      assert.deepStrictEqual(Rows.of(built, AreaMapping), [
        { declaration, defaultValue: "0.5", document: treeId, id: mapping },
      ]);
      assert.deepStrictEqual(Rows.of(built, AreaMappingLowerBound), [
        { node: mapping, value: "0" },
      ]);
      assert.deepStrictEqual(Rows.of(built, AreaMappingUpperBound), [
        { node: mapping, value: "2" },
      ]);

      const [first, second] = pairOf(nodes, "qti-area-map-entry");
      assert.deepStrictEqual(Rows.of(built, AreaMapEntry), [
        { areaMapping: mapping, id: first, mappedValue: "1", position: 0n, shape: "rect" },
        { areaMapping: mapping, id: second, mappedValue: "2", position: 1n, shape: "circle" },
      ]);
      assert.deepStrictEqual(
        Rows.of(built, Coords).map((row) => [row.node, row.ownerKind, row.shape, row.value]),
        [
          [first, "qti-area-map-entry", "rect", "0,0,10,10"],
          [second, "qti-area-map-entry", "circle", "5,5,3"],
        ],
      );
      assert.deepStrictEqual(Rows.of(built, CoordsRect), [{ node: first, value: "0,0,10,10" }]);
    }),
  );

  it.effect("refuses an entry whose shape is not a shape", () =>
    Effect.gen(function* badShape() {
      const exit = yield* Effect.exit(mapped(point.replace('shape="rect"', 'shape="square"')));

      assert.isTrue(Exit.isFailure(exit));
      assert.isTrue(JSON.stringify(exit).includes("square"));
    }),
  );
});

describe("mappingRows on a match table", () => {
  const table = `<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"><qti-match-table default-value="9"><qti-match-table-entry source-value="1" target-value="1.5"/><qti-match-table-entry source-value="2" target-value="2.5"/></qti-match-table></qti-outcome-declaration>`;

  it.effect("writes the table, its typed default and its typed entries", () =>
    Effect.gen(function* matchTable() {
      const { built, nodes, variables } = yield* mapped(table);
      const id = idOf(nodes, "qti-match-table");
      const declaration = declarationOf(variables, "SCORE");

      assert.deepStrictEqual(Rows.of(built, MatchTable), [
        { baseType: "float", declaration, document: treeId, id },
      ]);
      assert.deepStrictEqual(Rows.of(built, MatchTableDefaultValue), [
        { baseType: "float", node: id },
      ]);
      assert.deepStrictEqual(Rows.of(built, MatchTableDefaultValueFloat), [
        { node: id, value: "9" },
      ]);

      const [first, second] = pairOf(nodes, "qti-match-table-entry");
      assert.deepStrictEqual(Rows.of(built, MatchTableEntry), [
        { baseType: "float", declaration, id: first, position: 0n, sourceValue: "1", table: id },
        { baseType: "float", declaration, id: second, position: 1n, sourceValue: "2", table: id },
      ]);
      assert.deepStrictEqual(Rows.of(built, MatchTableEntryFloat), [
        { id: first, targetValue: "1.5" },
        { id: second, targetValue: "2.5" },
      ]);
    }),
  );

  it.effect("writes no default for a table that has none", () =>
    Effect.gen(function* noDefault() {
      const { built } = yield* mapped(table.replace(' default-value="9"', ""));

      assert.strictEqual(Rows.of(built, MatchTable).length, 1);
      assert.strictEqual(Rows.of(built, MatchTableDefaultValue).length, 0);
      assert.strictEqual(Rows.of(built, MatchTableDefaultValueFloat).length, 0);
    }),
  );
});

describe("mappingRows on an interpolation table", () => {
  const table = `<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"><qti-interpolation-table default-value="0"><qti-interpolation-table-entry source-value="10" target-value="1"/><qti-interpolation-table-entry source-value="5" include-boundary="false" target-value="0.5"/></qti-interpolation-table></qti-outcome-declaration>`;

  it.effect("defaults include-boundary to true and marks the one the source wrote", () =>
    Effect.gen(function* interpolation() {
      const { built, nodes, variables } = yield* mapped(table);
      const id = idOf(nodes, "qti-interpolation-table");
      const declaration = declarationOf(variables, "SCORE");

      assert.deepStrictEqual(Rows.of(built, InterpolationTable), [
        { baseType: "float", declaration, document: treeId, id },
      ]);
      assert.deepStrictEqual(Rows.of(built, InterpolationTableDefaultValue), [
        { baseType: "float", node: id },
      ]);
      assert.deepStrictEqual(Rows.of(built, InterpolationTableDefaultValueFloat), [
        { node: id, value: "0" },
      ]);

      const [first, second] = pairOf(nodes, "qti-interpolation-table-entry");
      assert.deepStrictEqual(Rows.of(built, InterpolationTableEntry), [
        {
          baseType: "float",
          declaration,
          id: first,
          includeBoundary: "true",
          position: 0n,
          sourceValue: "10",
          table: id,
        },
        {
          baseType: "float",
          declaration,
          id: second,
          includeBoundary: "false",
          position: 1n,
          sourceValue: "5",
          table: id,
        },
      ]);
      assert.deepStrictEqual(Rows.of(built, InterpolationTableEntryFloat), [
        { id: first, targetValue: "1" },
        { id: second, targetValue: "0.5" },
      ]);
      assert.deepStrictEqual(Rows.of(built, DeclaredIncludeBoundary), [{ node: second }]);
    }),
  );

  it.effect("takes each position from the entry's edge", () =>
    Effect.gen(function* positions() {
      const { built, rows } = yield* mapped(table);
      const edges = new Map(Rows.of(rows, Edge).map((edge) => [edge.child, edge.position]));

      for (const entry of Rows.of(built, InterpolationTableEntry)) {
        assert.strictEqual(entry.position, edges.get(entry.id));
      }
    }),
  );
});

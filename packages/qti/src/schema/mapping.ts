/**
 * The mappings and lookup tables of an item: `qti-mapping` and its `qti-map-entry` children,
 * `qti-area-mapping` and its `qti-area-map-entry` children, `qti-match-table` and
 * `qti-interpolation-table` and their entries, with the optional values each may carry.
 *
 * A mapping is of one base type, and a base type is mappable unless it is `file` or `duration`:
 * the nine rows of `MappableBaseType`. A map entry's key and a table entry's target are held in
 * the lexical form of the base type, one arm of the entry per base type. An area mapping is of
 * point-typed variables alone, and each of its entries has the shape and coordinates of a
 * hotspot. A table's variable is a single-cardinality outcome. Entries keep their document order
 * through `Edge.position`.
 */
/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shape` and `shapeCapacities` are the column and helper names `shapes.ts` fixes for every hotspot-like arm; the shape here is a geometric one, not a structure. */
import {
  alternatives,
  closedId,
  contained,
  key,
  on,
  pg,
  relation,
  select,
  uuid,
} from "@bjornpagen/grizzle";
import { Shape, XsBoolean } from "#qti/schema/content/rosters.ts";
import { InterpolationSourceValue, MappingScore, MatchSourceValue } from "#qti/schema/contracts.ts";
import { BaseType, Declaration, TypedDeclaration } from "#qti/schema/declaration.ts";
import { Edge } from "#qti/schema/node.ts";
import { coordsBinding, shapeCapacities } from "#qti/schema/shapes.ts";
import { fieldsOf } from "#qti/schema/value.ts";

/**
 * The base types a mapping or a map entry may be of: every base type but `file` and `duration`.
 * Seeded.
 */
export const MappableBaseType = relation("MappableBaseType", { baseType: closedId(BaseType) }, [
  "baseType",
]);

/**
 * A `qti-mapping`, the mapping of a response declaration. `declaration` and `baseType` copy the
 * declaration's, and `defaultValue` is 0 where the source omits `default-value`.
 */
export const Mapping = relation(
  "Mapping",
  {
    baseType: closedId(BaseType),
    declaration: uuid,
    defaultValue: MappingScore,
    document: uuid,
    id: uuid,
  },
  ["id"],
);

/**
 * A mapping's `lower-bound`, when it has one.
 */
export const MappingLowerBound = relation(
  "MappingLowerBound",
  { node: uuid, value: MappingScore },
  ["node"],
);

/**
 * A mapping's `upper-bound`, when it has one.
 */
export const MappingUpperBound = relation(
  "MappingUpperBound",
  { node: uuid, value: MappingScore },
  ["node"],
);

/**
 * A `qti-map-entry`, at its position in its mapping. `caseSensitive` is `false` where the source
 * omits it, and its key is held by the arm of its base type.
 */
export const MapEntry = relation(
  "MapEntry",
  {
    baseType: closedId(BaseType),
    caseSensitive: closedId(XsBoolean),
    declaration: uuid,
    id: uuid,
    mappedValue: MappingScore,
    mapping: uuid,
    position: pg.bigint,
  },
  ["id"],
);

/**
 * The source wrote `case-sensitive` on this map entry.
 */
export const DeclaredMapEntryCaseSensitive = relation(
  "DeclaredMapEntryCaseSensitive",
  { node: uuid },
  ["node"],
);

/**
 * The source wrote `default-value` on this mapping.
 */
export const DeclaredMappingDefaultValue = relation("DeclaredMappingDefaultValue", { node: uuid }, [
  "node",
]);

/**
 * The source wrote `default-value` on this area mapping.
 */
export const DeclaredAreaMappingDefaultValue = relation(
  "DeclaredAreaMappingDefaultValue",
  { node: uuid },
  ["node"],
);

/**
 * A `qti-area-mapping`, the mapping of a point-typed response declaration.
 */
export const AreaMapping = relation(
  "AreaMapping",
  { declaration: uuid, defaultValue: MappingScore, document: uuid, id: uuid },
  ["id"],
);

/**
 * An area mapping's `lower-bound`, when it has one.
 */
export const AreaMappingLowerBound = relation(
  "AreaMappingLowerBound",
  { node: uuid, value: MappingScore },
  ["node"],
);

/**
 * An area mapping's `upper-bound`, when it has one.
 */
export const AreaMappingUpperBound = relation(
  "AreaMappingUpperBound",
  { node: uuid, value: MappingScore },
  ["node"],
);

/**
 * A `qti-area-map-entry`, at its position in its area mapping. Its coordinates are the `Coords`
 * row of its node.
 */
export const AreaMapEntry = relation(
  "AreaMapEntry",
  {
    areaMapping: uuid,
    id: uuid,
    mappedValue: MappingScore,
    position: pg.bigint,
    shape: closedId(Shape),
  },
  ["id"],
);

/**
 * A `qti-match-table`, the lookup table of an outcome declaration. `declaration` and `baseType`
 * copy the declaration's.
 */
export const MatchTable = relation(
  "MatchTable",
  { baseType: closedId(BaseType), declaration: uuid, document: uuid, id: uuid },
  ["id"],
);

/**
 * A `qti-interpolation-table`, the lookup table of an outcome declaration.
 */
export const InterpolationTable = relation(
  "InterpolationTable",
  { baseType: closedId(BaseType), declaration: uuid, document: uuid, id: uuid },
  ["id"],
);

/**
 * A `qti-match-table-entry`, at its position in its table. Its target is held by the arm of its
 * base type.
 */
export const MatchTableEntry = relation(
  "MatchTableEntry",
  {
    baseType: closedId(BaseType),
    declaration: uuid,
    id: uuid,
    position: pg.bigint,
    sourceValue: MatchSourceValue,
    table: uuid,
  },
  ["id"],
);

/**
 * A `qti-interpolation-table-entry`, at its position in its table. `includeBoundary` is `true`
 * where the source omits it.
 */
export const InterpolationTableEntry = relation(
  "InterpolationTableEntry",
  {
    baseType: closedId(BaseType),
    declaration: uuid,
    id: uuid,
    includeBoundary: closedId(XsBoolean),
    position: pg.bigint,
    sourceValue: InterpolationSourceValue,
    table: uuid,
  },
  ["id"],
);

/**
 * The source wrote `include-boundary` on this interpolation table entry.
 */
export const DeclaredIncludeBoundary = relation("DeclaredIncludeBoundary", { node: uuid }, [
  "node",
]);

/**
 * The default value of a match table, when it has one. The typed value is held by the arm of the
 * table's base type.
 */
export const MatchTableDefaultValue = relation(
  "MatchTableDefaultValue",
  { baseType: closedId(BaseType), node: uuid },
  ["node"],
);

/**
 * The default value of an interpolation table, when it has one.
 */
export const InterpolationTableDefaultValue = relation(
  "InterpolationTableDefaultValue",
  { baseType: closedId(BaseType), node: uuid },
  ["node"],
);

const mapEntryLexical = fieldsOf("MapKey");

/**
 * The eleven `map-key` arms of a map entry, one per base type, each holding the key in the lexical
 * form of its base type.
 */
const mapEntryArms = {
  boolean: relation("MapEntryBoolean", { id: uuid, mapKey: mapEntryLexical.boolean }, ["id"]),
  directedPair: relation(
    "MapEntryDirectedPair",
    { id: uuid, mapKey: mapEntryLexical.directedPair },
    ["id"],
  ),
  duration: relation("MapEntryDuration", { id: uuid, mapKey: mapEntryLexical.duration }, ["id"]),
  file: relation("MapEntryFile", { id: uuid, mapKey: mapEntryLexical.file }, ["id"]),
  float: relation("MapEntryFloat", { id: uuid, mapKey: mapEntryLexical.float }, ["id"]),
  identifier: relation("MapEntryIdentifier", { id: uuid, mapKey: mapEntryLexical.identifier }, [
    "id",
  ]),
  integer: relation("MapEntryInteger", { id: uuid, mapKey: mapEntryLexical.integer }, ["id"]),
  pair: relation("MapEntryPair", { id: uuid, mapKey: mapEntryLexical.pair }, ["id"]),
  point: relation("MapEntryPoint", { id: uuid, mapKey: mapEntryLexical.point }, ["id"]),
  string: relation("MapEntryString", { id: uuid, mapKey: mapEntryLexical.string }, ["id"]),
  uri: relation("MapEntryUri", { id: uuid, mapKey: mapEntryLexical.uri }, ["id"]),
};

const matchTableEntryLexical = fieldsOf("MatchTarget");

/**
 * The eleven `target-value` arms of a match table entry, one per base type.
 */
const matchTableEntryArms = {
  boolean: relation(
    "MatchTableEntryBoolean",
    { id: uuid, targetValue: matchTableEntryLexical.boolean },
    ["id"],
  ),
  directedPair: relation(
    "MatchTableEntryDirectedPair",
    { id: uuid, targetValue: matchTableEntryLexical.directedPair },
    ["id"],
  ),
  duration: relation(
    "MatchTableEntryDuration",
    { id: uuid, targetValue: matchTableEntryLexical.duration },
    ["id"],
  ),
  file: relation("MatchTableEntryFile", { id: uuid, targetValue: matchTableEntryLexical.file }, [
    "id",
  ]),
  float: relation("MatchTableEntryFloat", { id: uuid, targetValue: matchTableEntryLexical.float }, [
    "id",
  ]),
  identifier: relation(
    "MatchTableEntryIdentifier",
    { id: uuid, targetValue: matchTableEntryLexical.identifier },
    ["id"],
  ),
  integer: relation(
    "MatchTableEntryInteger",
    { id: uuid, targetValue: matchTableEntryLexical.integer },
    ["id"],
  ),
  pair: relation("MatchTableEntryPair", { id: uuid, targetValue: matchTableEntryLexical.pair }, [
    "id",
  ]),
  point: relation("MatchTableEntryPoint", { id: uuid, targetValue: matchTableEntryLexical.point }, [
    "id",
  ]),
  string: relation(
    "MatchTableEntryString",
    { id: uuid, targetValue: matchTableEntryLexical.string },
    ["id"],
  ),
  uri: relation("MatchTableEntryUri", { id: uuid, targetValue: matchTableEntryLexical.uri }, [
    "id",
  ]),
};

const interpolationTableEntryLexical = fieldsOf("InterpolationTarget");

/**
 * The eleven `target-value` arms of an interpolation table entry, one per base type.
 */
const interpolationTableEntryArms = {
  boolean: relation(
    "InterpolationTableEntryBoolean",
    { id: uuid, targetValue: interpolationTableEntryLexical.boolean },
    ["id"],
  ),
  directedPair: relation(
    "InterpolationTableEntryDirectedPair",
    { id: uuid, targetValue: interpolationTableEntryLexical.directedPair },
    ["id"],
  ),
  duration: relation(
    "InterpolationTableEntryDuration",
    { id: uuid, targetValue: interpolationTableEntryLexical.duration },
    ["id"],
  ),
  file: relation(
    "InterpolationTableEntryFile",
    { id: uuid, targetValue: interpolationTableEntryLexical.file },
    ["id"],
  ),
  float: relation(
    "InterpolationTableEntryFloat",
    { id: uuid, targetValue: interpolationTableEntryLexical.float },
    ["id"],
  ),
  identifier: relation(
    "InterpolationTableEntryIdentifier",
    { id: uuid, targetValue: interpolationTableEntryLexical.identifier },
    ["id"],
  ),
  integer: relation(
    "InterpolationTableEntryInteger",
    { id: uuid, targetValue: interpolationTableEntryLexical.integer },
    ["id"],
  ),
  pair: relation(
    "InterpolationTableEntryPair",
    { id: uuid, targetValue: interpolationTableEntryLexical.pair },
    ["id"],
  ),
  point: relation(
    "InterpolationTableEntryPoint",
    { id: uuid, targetValue: interpolationTableEntryLexical.point },
    ["id"],
  ),
  string: relation(
    "InterpolationTableEntryString",
    { id: uuid, targetValue: interpolationTableEntryLexical.string },
    ["id"],
  ),
  uri: relation(
    "InterpolationTableEntryUri",
    { id: uuid, targetValue: interpolationTableEntryLexical.uri },
    ["id"],
  ),
};

const matchTableDefaultValueLexical = fieldsOf("MatchDefault");

/**
 * The eleven typed values a match table's `default-value` may hold, one per base type.
 */
const matchTableDefaultValueArms = {
  boolean: relation(
    "MatchTableDefaultValueBoolean",
    { node: uuid, value: matchTableDefaultValueLexical.boolean },
    ["node"],
  ),
  directedPair: relation(
    "MatchTableDefaultValueDirectedPair",
    { node: uuid, value: matchTableDefaultValueLexical.directedPair },
    ["node"],
  ),
  duration: relation(
    "MatchTableDefaultValueDuration",
    { node: uuid, value: matchTableDefaultValueLexical.duration },
    ["node"],
  ),
  file: relation(
    "MatchTableDefaultValueFile",
    { node: uuid, value: matchTableDefaultValueLexical.file },
    ["node"],
  ),
  float: relation(
    "MatchTableDefaultValueFloat",
    { node: uuid, value: matchTableDefaultValueLexical.float },
    ["node"],
  ),
  identifier: relation(
    "MatchTableDefaultValueIdentifier",
    { node: uuid, value: matchTableDefaultValueLexical.identifier },
    ["node"],
  ),
  integer: relation(
    "MatchTableDefaultValueInteger",
    { node: uuid, value: matchTableDefaultValueLexical.integer },
    ["node"],
  ),
  pair: relation(
    "MatchTableDefaultValuePair",
    { node: uuid, value: matchTableDefaultValueLexical.pair },
    ["node"],
  ),
  point: relation(
    "MatchTableDefaultValuePoint",
    { node: uuid, value: matchTableDefaultValueLexical.point },
    ["node"],
  ),
  string: relation(
    "MatchTableDefaultValueString",
    { node: uuid, value: matchTableDefaultValueLexical.string },
    ["node"],
  ),
  uri: relation(
    "MatchTableDefaultValueUri",
    { node: uuid, value: matchTableDefaultValueLexical.uri },
    ["node"],
  ),
};

const interpolationTableDefaultValueLexical = fieldsOf("InterpolationDefault");

/**
 * The eleven typed values an interpolation table's `default-value` may hold, one per base type.
 */
const interpolationTableDefaultValueArms = {
  boolean: relation(
    "InterpolationTableDefaultValueBoolean",
    { node: uuid, value: interpolationTableDefaultValueLexical.boolean },
    ["node"],
  ),
  directedPair: relation(
    "InterpolationTableDefaultValueDirectedPair",
    { node: uuid, value: interpolationTableDefaultValueLexical.directedPair },
    ["node"],
  ),
  duration: relation(
    "InterpolationTableDefaultValueDuration",
    { node: uuid, value: interpolationTableDefaultValueLexical.duration },
    ["node"],
  ),
  file: relation(
    "InterpolationTableDefaultValueFile",
    { node: uuid, value: interpolationTableDefaultValueLexical.file },
    ["node"],
  ),
  float: relation(
    "InterpolationTableDefaultValueFloat",
    { node: uuid, value: interpolationTableDefaultValueLexical.float },
    ["node"],
  ),
  identifier: relation(
    "InterpolationTableDefaultValueIdentifier",
    { node: uuid, value: interpolationTableDefaultValueLexical.identifier },
    ["node"],
  ),
  integer: relation(
    "InterpolationTableDefaultValueInteger",
    { node: uuid, value: interpolationTableDefaultValueLexical.integer },
    ["node"],
  ),
  pair: relation(
    "InterpolationTableDefaultValuePair",
    { node: uuid, value: interpolationTableDefaultValueLexical.pair },
    ["node"],
  ),
  point: relation(
    "InterpolationTableDefaultValuePoint",
    { node: uuid, value: interpolationTableDefaultValueLexical.point },
    ["node"],
  ),
  string: relation(
    "InterpolationTableDefaultValueString",
    { node: uuid, value: interpolationTableDefaultValueLexical.string },
    ["node"],
  ),
  uri: relation(
    "InterpolationTableDefaultValueUri",
    { node: uuid, value: interpolationTableDefaultValueLexical.uri },
    ["node"],
  ),
};

export const relations = {
  AreaMapEntry,
  AreaMapping,
  AreaMappingLowerBound,
  AreaMappingUpperBound,
  DeclaredAreaMappingDefaultValue,
  DeclaredIncludeBoundary,
  DeclaredMapEntryCaseSensitive,
  DeclaredMappingDefaultValue,
  InterpolationTable,
  InterpolationTableDefaultValue,
  InterpolationTableDefaultValueBoolean: interpolationTableDefaultValueArms.boolean,
  InterpolationTableDefaultValueDirectedPair: interpolationTableDefaultValueArms.directedPair,
  InterpolationTableDefaultValueDuration: interpolationTableDefaultValueArms.duration,
  InterpolationTableDefaultValueFile: interpolationTableDefaultValueArms.file,
  InterpolationTableDefaultValueFloat: interpolationTableDefaultValueArms.float,
  InterpolationTableDefaultValueIdentifier: interpolationTableDefaultValueArms.identifier,
  InterpolationTableDefaultValueInteger: interpolationTableDefaultValueArms.integer,
  InterpolationTableDefaultValuePair: interpolationTableDefaultValueArms.pair,
  InterpolationTableDefaultValuePoint: interpolationTableDefaultValueArms.point,
  InterpolationTableDefaultValueString: interpolationTableDefaultValueArms.string,
  InterpolationTableDefaultValueUri: interpolationTableDefaultValueArms.uri,
  InterpolationTableEntry,
  InterpolationTableEntryBoolean: interpolationTableEntryArms.boolean,
  InterpolationTableEntryDirectedPair: interpolationTableEntryArms.directedPair,
  InterpolationTableEntryDuration: interpolationTableEntryArms.duration,
  InterpolationTableEntryFile: interpolationTableEntryArms.file,
  InterpolationTableEntryFloat: interpolationTableEntryArms.float,
  InterpolationTableEntryIdentifier: interpolationTableEntryArms.identifier,
  InterpolationTableEntryInteger: interpolationTableEntryArms.integer,
  InterpolationTableEntryPair: interpolationTableEntryArms.pair,
  InterpolationTableEntryPoint: interpolationTableEntryArms.point,
  InterpolationTableEntryString: interpolationTableEntryArms.string,
  InterpolationTableEntryUri: interpolationTableEntryArms.uri,
  MapEntry,
  MapEntryBoolean: mapEntryArms.boolean,
  MapEntryDirectedPair: mapEntryArms.directedPair,
  MapEntryDuration: mapEntryArms.duration,
  MapEntryFile: mapEntryArms.file,
  MapEntryFloat: mapEntryArms.float,
  MapEntryIdentifier: mapEntryArms.identifier,
  MapEntryInteger: mapEntryArms.integer,
  MapEntryPair: mapEntryArms.pair,
  MapEntryPoint: mapEntryArms.point,
  MapEntryString: mapEntryArms.string,
  MapEntryUri: mapEntryArms.uri,
  MappableBaseType,
  Mapping,
  MappingLowerBound,
  MappingUpperBound,
  MatchTable,
  MatchTableDefaultValue,
  MatchTableDefaultValueBoolean: matchTableDefaultValueArms.boolean,
  MatchTableDefaultValueDirectedPair: matchTableDefaultValueArms.directedPair,
  MatchTableDefaultValueDuration: matchTableDefaultValueArms.duration,
  MatchTableDefaultValueFile: matchTableDefaultValueArms.file,
  MatchTableDefaultValueFloat: matchTableDefaultValueArms.float,
  MatchTableDefaultValueIdentifier: matchTableDefaultValueArms.identifier,
  MatchTableDefaultValueInteger: matchTableDefaultValueArms.integer,
  MatchTableDefaultValuePair: matchTableDefaultValueArms.pair,
  MatchTableDefaultValuePoint: matchTableDefaultValueArms.point,
  MatchTableDefaultValueString: matchTableDefaultValueArms.string,
  MatchTableDefaultValueUri: matchTableDefaultValueArms.uri,
  MatchTableEntry,
  MatchTableEntryBoolean: matchTableEntryArms.boolean,
  MatchTableEntryDirectedPair: matchTableEntryArms.directedPair,
  MatchTableEntryDuration: matchTableEntryArms.duration,
  MatchTableEntryFile: matchTableEntryArms.file,
  MatchTableEntryFloat: matchTableEntryArms.float,
  MatchTableEntryIdentifier: matchTableEntryArms.identifier,
  MatchTableEntryInteger: matchTableEntryArms.integer,
  MatchTableEntryPair: matchTableEntryArms.pair,
  MatchTableEntryPoint: matchTableEntryArms.point,
  MatchTableEntryString: matchTableEntryArms.string,
  MatchTableEntryUri: matchTableEntryArms.uri,
};

/**
 * The element arms of this module, by element name.
 */
export const arms = {
  "qti-area-map-entry": AreaMapEntry,
  "qti-area-mapping": AreaMapping,
  "qti-interpolation-table": InterpolationTable,
  "qti-interpolation-table-entry": InterpolationTableEntry,
  "qti-map-entry": MapEntry,
  "qti-mapping": Mapping,
  "qti-match-table": MatchTable,
  "qti-match-table-entry": MatchTableEntry,
};

/**
 * The statements over this module's relations. A mapping is the one of its declaration, a child
 * of it in the tree, of the declaration's base type, and of a mappable one; so is an area
 * mapping's declaration, which must be point-typed. A map entry belongs to a mapping of the same
 * declaration and is its edge child at its position; an area map entry is the same of an area
 * mapping, with the coordinates and shape capacities of a hotspot. A table is the one of its
 * declaration, a single-cardinality outcome of the table's base type, and its entries are the
 * edge children of the table and copy its declaration and base type. Every optional value and
 * marker belongs to its owner, and a table's default value has the table's base type.
 */
export const rules = [
  key(Mapping, ["declaration"]),
  contained(on(Mapping, "id", "declaration"), on(Edge, "child", "parent")),
  contained(on(Mapping, "declaration", "baseType"), on(TypedDeclaration, "id", "baseType")),
  contained(on(Mapping, "baseType"), on(MappableBaseType, "baseType")),
  contained(on(MappingLowerBound, "node"), on(Mapping, "id")),
  contained(on(MappingUpperBound, "node"), on(Mapping, "id")),
  contained(on(MapEntry, "mapping", "declaration"), on(Mapping, "id", "declaration")),
  contained(on(MapEntry, "id", "mapping", "position"), on(Edge, "child", "parent", "position")),
  alternatives(MapEntry, "baseType", BaseType, mapEntryArms),
  contained(on(DeclaredMapEntryCaseSensitive, "node"), on(MapEntry, "id")),
  contained(on(DeclaredMappingDefaultValue, "node"), on(Mapping, "id")),
  key(AreaMapping, ["declaration"]),
  contained(
    on(AreaMapping, "declaration"),
    on(select(TypedDeclaration, { baseType: "point" }), "id"),
  ),
  contained(on(AreaMapping, "id", "declaration"), on(Edge, "child", "parent")),
  contained(on(AreaMappingLowerBound, "node"), on(AreaMapping, "id")),
  contained(on(AreaMappingUpperBound, "node"), on(AreaMapping, "id")),
  contained(on(DeclaredAreaMappingDefaultValue, "node"), on(AreaMapping, "id")),
  contained(
    on(AreaMapEntry, "id", "areaMapping", "position"),
    on(Edge, "child", "parent", "position"),
  ),
  contained(on(AreaMapEntry, "areaMapping"), on(AreaMapping, "id")),
  coordsBinding(AreaMapEntry, "qti-area-map-entry"),
  ...shapeCapacities(AreaMapEntry),
  ...[MatchTable, InterpolationTable].flatMap((table) => [
    key(table, ["declaration"]),
    contained(
      on(table, "declaration"),
      on(select(TypedDeclaration, { cardinality: "single" }), "id"),
    ),
    contained(on(table, "declaration"), on(select(Declaration, { kind: "outcome" }), "id")),
    contained(on(table, "declaration", "baseType"), on(TypedDeclaration, "id", "baseType")),
  ]),
  contained(
    on(MatchTableEntry, "id", "table", "position"),
    on(Edge, "child", "parent", "position"),
  ),
  contained(
    on(MatchTableEntry, "table", "declaration", "baseType"),
    on(MatchTable, "id", "declaration", "baseType"),
  ),
  alternatives(MatchTableEntry, "baseType", BaseType, matchTableEntryArms),
  contained(on(MatchTableDefaultValue, "node", "baseType"), on(MatchTable, "id", "baseType")),
  alternatives(MatchTableDefaultValue, "baseType", BaseType, matchTableDefaultValueArms),
  contained(
    on(InterpolationTableEntry, "id", "table", "position"),
    on(Edge, "child", "parent", "position"),
  ),
  contained(
    on(InterpolationTableEntry, "table", "declaration", "baseType"),
    on(InterpolationTable, "id", "declaration", "baseType"),
  ),
  alternatives(InterpolationTableEntry, "baseType", BaseType, interpolationTableEntryArms),
  contained(on(DeclaredIncludeBoundary, "node"), on(InterpolationTableEntry, "id")),
  contained(
    on(InterpolationTableDefaultValue, "node", "baseType"),
    on(InterpolationTable, "id", "baseType"),
  ),
  alternatives(
    InterpolationTableDefaultValue,
    "baseType",
    BaseType,
    interpolationTableDefaultValueArms,
  ),
] as const;

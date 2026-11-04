/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shape` is the column the area map entry and `Coords` rows name, and `ShapeHandle` the roster; the shape here is a geometric one, not a structure. */

/**
 * The rows of the mappings and lookup tables of an item: `qti-mapping` and its `qti-map-entry`
 * children, `qti-area-mapping` and its `qti-area-map-entry` children, `qti-match-table` and
 * `qti-interpolation-table` and their entries.
 *
 * A mapping or a table copies the base type of the declaration it sits in, and every entry copies
 * it from its mapping or table; a key, a target and a table's default value are held by the arm of
 * that base type, in the lexical form its lexical space gives them. A declaration with no base type
 * (a record) has no mapping or table row, and the missing arm is the commit's refusal.
 *
 * A value attribute is read exactly: outer whitespace around it refuses the document (decision
 * 157).
 */
import { judgedLater } from "#qti/import/judged.ts";
import { ImportRefused } from "#qti/import/refusal.ts";
import type { Rule } from "#qti/import/refusal.ts";
import { Effect, Option } from "effect";
import { attributeReader, coordsRows, markers } from "#qti/import/interactions.ts";
import type { DeclaredVariable, NodeRef } from "#qti/import/interactions.ts";
import { closedOf, ItemRefusal, Rows, typedAttribute, withParents } from "#qti/import/tree.ts";
import type { NodeIndex, WhiteSpace } from "#qti/import/tree.ts";
import { BooleanLiteral, Shape, XsBoolean } from "#qti/schema/content/rosters.ts";
import type { BaseType } from "#qti/schema/declaration.ts";
import * as mapping from "#qti/schema/mapping.ts";
import { Edge } from "#qti/schema/node.ts";
import type { AttributeNameHandle } from "#qti/schema/node.ts";
import type { Element } from "@qti-pie/crust/tree.ts";

type BaseTypeHandle = (typeof BaseType.handles)[number];

/**
 * One fact of an optional-value relation where the attribute was written, none where it was not.
 */
const written = <Value, Made>(value: Option.Option<Value>, make: (own: Value) => Made): Made[] =>
  Option.match(value, { onNone: () => [], onSome: (own) => [make(own)] });

/**
 * The value of the attribute `element` carries under `name` with no namespace, as written.
 */
const lexicalOf = (element: Element, name: string): Option.Option<string> =>
  Option.fromNullishOr(
    element.attributes.find((found) => found.namespace === "" && found.local === name),
  ).pipe(Option.map((found) => found.value));

/**
 * The whitespace class of the lexical space of a base type: a string or a file is an
 * `xs:normalizedString`, and every other base type is collapsed like a token. A value attribute
 * is refused when padded, so collapse reaches only an internal run, as in the pair `"A  B"`.
 */
const spaceOf = (baseType: BaseTypeHandle): WhiteSpace =>
  baseType === "string" || baseType === "file" ? "replace" : "collapse";

/**
 * Refuse the attribute `name` of `element` where it is written with whitespace before or after its
 * value. A value attribute is read exactly: no tool reformats it, so padding is a mistake in the
 * source and not formatting (decision 157).
 *
 * @param where - What the attribute is, for the refusal's detail: the attribute and its element.
 * @returns Nothing; `ImportRefused` under `rule` for a padded value.
 */
const exactOf = Effect.fn("import.exactOf")(function* exactOf(
  element: Element,
  name: string,
  where: string,
  rule: Rule,
): Effect.fn.Return<void, ImportRefused> {
  const lexical = lexicalOf(element, name);
  if (Option.isSome(lexical) && /^[ \t\n\r]|[ \t\n\r]$/u.test(lexical.value)) {
    yield* new ImportRefused({
      detail: `${where} is ${JSON.stringify(lexical.value)}, which has whitespace before or after the value. An attribute value is read exactly as written, so remove the spaces, tabs or line ends around it.`,
      rule,
    });
  }
});

/**
 * Read one attribute as a value of `baseType`. A string is an `xs:normalizedString`, its lexical
 * form processed by the replace class with an `AttributeLexical` row where processing changed it;
 * every other base type is read exactly, so outer whitespace refuses it under `rule`, and only an
 * internal run of spaces is collapsed.
 */
const valueOf = Effect.fn("import.valueOf")(function* valueOf(
  rows: Rows,
  element: Element,
  node: NodeRef,
  name: AttributeNameHandle,
  baseType: BaseTypeHandle,
  rule: Rule,
): Effect.fn.Return<{ rows: Rows; value: Option.Option<string> }, ImportRefused> {
  if (baseType !== "string") {
    yield* exactOf(
      element,
      name,
      `the ${name} attribute of ${/^[aeiou]/u.test(baseType) ? "an" : "a"} ${baseType} ${node.kind}`,
      rule,
    );
  }

  return Option.match(lexicalOf(element, name), {
    onNone: () => ({ rows, value: Option.none<string>() }),
    onSome: (lexical) => {
      const typed = typedAttribute(rows, node.id, node.kind, name, lexical, spaceOf(baseType));

      return { rows: typed.rows, value: Option.some(typed.value) };
    },
  });
});

/**
 * A typed arm writer: the row of one value in the arm of its base type. The boolean arm narrows
 * its text to `BooleanLiteral` first, so it is effectful and the others are not.
 */
type ArmWriter = Record<
  Exclude<BaseTypeHandle, "boolean">,
  (rows: Rows, id: string, text: string) => Rows
> & {
  readonly boolean: (rows: Rows, id: string, text: string) => Effect.Effect<Rows, ImportRefused>;
};

/**
 * Write the row of one value in the arm of `baseType` of `writer`.
 *
 * @returns The rows with the arm added; `ImportRefused` for a boolean outside `BooleanLiteral`.
 */
const armRows = (
  writer: ArmWriter,
  baseType: BaseTypeHandle,
  rows: Rows,
  id: string,
  text: string,
): Effect.Effect<Rows, ImportRefused> =>
  baseType === "boolean"
    ? writer.boolean(rows, id, text)
    : Effect.succeed(writer[baseType](rows, id, text));

const mapKeyArms: ArmWriter = {
  boolean: (rows, id, text) =>
    closedOf(
      BooleanLiteral.handles,
      text,
      "map-key-lexical",
      "the map-key attribute of a boolean qti-map-entry",
    ).pipe(
      Effect.map((literal) =>
        Rows.add(rows, mapping.relations.MapEntryBoolean, [{ id, mapKey: literal }]),
      ),
    ),
  directedPair: (rows, id, text) =>
    Rows.add(rows, mapping.relations.MapEntryDirectedPair, [{ id, mapKey: judgedLater(text) }]),
  duration: (rows, id, text) =>
    Rows.add(rows, mapping.relations.MapEntryDuration, [{ id, mapKey: judgedLater(text) }]),
  file: (rows, id, text) =>
    Rows.add(rows, mapping.relations.MapEntryFile, [{ id, mapKey: judgedLater(text) }]),
  float: (rows, id, text) =>
    Rows.add(rows, mapping.relations.MapEntryFloat, [{ id, mapKey: judgedLater(text) }]),
  identifier: (rows, id, text) =>
    Rows.add(rows, mapping.relations.MapEntryIdentifier, [{ id, mapKey: judgedLater(text) }]),
  integer: (rows, id, text) =>
    Rows.add(rows, mapping.relations.MapEntryInteger, [{ id, mapKey: judgedLater(text) }]),
  pair: (rows, id, text) =>
    Rows.add(rows, mapping.relations.MapEntryPair, [{ id, mapKey: judgedLater(text) }]),
  point: (rows, id, text) =>
    Rows.add(rows, mapping.relations.MapEntryPoint, [{ id, mapKey: judgedLater(text) }]),
  string: (rows, id, text) =>
    Rows.add(rows, mapping.relations.MapEntryString, [{ id, mapKey: judgedLater(text) }]),
  uri: (rows, id, text) =>
    Rows.add(rows, mapping.relations.MapEntryUri, [{ id, mapKey: judgedLater(text) }]),
};

const matchTargetArms: ArmWriter = {
  boolean: (rows, id, text) =>
    closedOf(
      BooleanLiteral.handles,
      text,
      "attribute-lexical",
      "the target-value attribute of a boolean qti-match-table-entry",
    ).pipe(
      Effect.map((literal) =>
        Rows.add(rows, mapping.relations.MatchTableEntryBoolean, [{ id, targetValue: literal }]),
      ),
    ),
  directedPair: (rows, id, text) =>
    Rows.add(rows, mapping.relations.MatchTableEntryDirectedPair, [
      { id, targetValue: judgedLater(text) },
    ]),
  duration: (rows, id, text) =>
    Rows.add(rows, mapping.relations.MatchTableEntryDuration, [
      { id, targetValue: judgedLater(text) },
    ]),
  file: (rows, id, text) =>
    Rows.add(rows, mapping.relations.MatchTableEntryFile, [{ id, targetValue: judgedLater(text) }]),
  float: (rows, id, text) =>
    Rows.add(rows, mapping.relations.MatchTableEntryFloat, [
      { id, targetValue: judgedLater(text) },
    ]),
  identifier: (rows, id, text) =>
    Rows.add(rows, mapping.relations.MatchTableEntryIdentifier, [
      { id, targetValue: judgedLater(text) },
    ]),
  integer: (rows, id, text) =>
    Rows.add(rows, mapping.relations.MatchTableEntryInteger, [
      { id, targetValue: judgedLater(text) },
    ]),
  pair: (rows, id, text) =>
    Rows.add(rows, mapping.relations.MatchTableEntryPair, [{ id, targetValue: judgedLater(text) }]),
  point: (rows, id, text) =>
    Rows.add(rows, mapping.relations.MatchTableEntryPoint, [
      { id, targetValue: judgedLater(text) },
    ]),
  string: (rows, id, text) =>
    Rows.add(rows, mapping.relations.MatchTableEntryString, [
      { id, targetValue: judgedLater(text) },
    ]),
  uri: (rows, id, text) =>
    Rows.add(rows, mapping.relations.MatchTableEntryUri, [{ id, targetValue: judgedLater(text) }]),
};

const interpolationTargetArms: ArmWriter = {
  boolean: (rows, id, text) =>
    closedOf(
      BooleanLiteral.handles,
      text,
      "attribute-lexical",
      "the target-value attribute of a boolean qti-interpolation-table-entry",
    ).pipe(
      Effect.map((literal) =>
        Rows.add(rows, mapping.relations.InterpolationTableEntryBoolean, [
          { id, targetValue: literal },
        ]),
      ),
    ),
  directedPair: (rows, id, text) =>
    Rows.add(rows, mapping.relations.InterpolationTableEntryDirectedPair, [
      { id, targetValue: judgedLater(text) },
    ]),
  duration: (rows, id, text) =>
    Rows.add(rows, mapping.relations.InterpolationTableEntryDuration, [
      { id, targetValue: judgedLater(text) },
    ]),
  file: (rows, id, text) =>
    Rows.add(rows, mapping.relations.InterpolationTableEntryFile, [
      { id, targetValue: judgedLater(text) },
    ]),
  float: (rows, id, text) =>
    Rows.add(rows, mapping.relations.InterpolationTableEntryFloat, [
      { id, targetValue: judgedLater(text) },
    ]),
  identifier: (rows, id, text) =>
    Rows.add(rows, mapping.relations.InterpolationTableEntryIdentifier, [
      { id, targetValue: judgedLater(text) },
    ]),
  integer: (rows, id, text) =>
    Rows.add(rows, mapping.relations.InterpolationTableEntryInteger, [
      { id, targetValue: judgedLater(text) },
    ]),
  pair: (rows, id, text) =>
    Rows.add(rows, mapping.relations.InterpolationTableEntryPair, [
      { id, targetValue: judgedLater(text) },
    ]),
  point: (rows, id, text) =>
    Rows.add(rows, mapping.relations.InterpolationTableEntryPoint, [
      { id, targetValue: judgedLater(text) },
    ]),
  string: (rows, id, text) =>
    Rows.add(rows, mapping.relations.InterpolationTableEntryString, [
      { id, targetValue: judgedLater(text) },
    ]),
  uri: (rows, id, text) =>
    Rows.add(rows, mapping.relations.InterpolationTableEntryUri, [
      { id, targetValue: judgedLater(text) },
    ]),
};

const matchDefaultArms: ArmWriter = {
  boolean: (rows, node, text) =>
    closedOf(
      BooleanLiteral.handles,
      text,
      "attribute-lexical",
      "the default-value attribute of a boolean qti-match-table",
    ).pipe(
      Effect.map((literal) =>
        Rows.add(rows, mapping.relations.MatchTableDefaultValueBoolean, [{ node, value: literal }]),
      ),
    ),
  directedPair: (rows, node, text) =>
    Rows.add(rows, mapping.relations.MatchTableDefaultValueDirectedPair, [
      { node, value: judgedLater(text) },
    ]),
  duration: (rows, node, text) =>
    Rows.add(rows, mapping.relations.MatchTableDefaultValueDuration, [
      { node, value: judgedLater(text) },
    ]),
  file: (rows, node, text) =>
    Rows.add(rows, mapping.relations.MatchTableDefaultValueFile, [
      { node, value: judgedLater(text) },
    ]),
  float: (rows, node, text) =>
    Rows.add(rows, mapping.relations.MatchTableDefaultValueFloat, [
      { node, value: judgedLater(text) },
    ]),
  identifier: (rows, node, text) =>
    Rows.add(rows, mapping.relations.MatchTableDefaultValueIdentifier, [
      { node, value: judgedLater(text) },
    ]),
  integer: (rows, node, text) =>
    Rows.add(rows, mapping.relations.MatchTableDefaultValueInteger, [
      { node, value: judgedLater(text) },
    ]),
  pair: (rows, node, text) =>
    Rows.add(rows, mapping.relations.MatchTableDefaultValuePair, [
      { node, value: judgedLater(text) },
    ]),
  point: (rows, node, text) =>
    Rows.add(rows, mapping.relations.MatchTableDefaultValuePoint, [
      { node, value: judgedLater(text) },
    ]),
  string: (rows, node, text) =>
    Rows.add(rows, mapping.relations.MatchTableDefaultValueString, [
      { node, value: judgedLater(text) },
    ]),
  uri: (rows, node, text) =>
    Rows.add(rows, mapping.relations.MatchTableDefaultValueUri, [
      { node, value: judgedLater(text) },
    ]),
};

const interpolationDefaultArms: ArmWriter = {
  boolean: (rows, node, text) =>
    closedOf(
      BooleanLiteral.handles,
      text,
      "attribute-lexical",
      "the default-value attribute of a boolean qti-interpolation-table",
    ).pipe(
      Effect.map((literal) =>
        Rows.add(rows, mapping.relations.InterpolationTableDefaultValueBoolean, [
          { node, value: literal },
        ]),
      ),
    ),
  directedPair: (rows, node, text) =>
    Rows.add(rows, mapping.relations.InterpolationTableDefaultValueDirectedPair, [
      { node, value: judgedLater(text) },
    ]),
  duration: (rows, node, text) =>
    Rows.add(rows, mapping.relations.InterpolationTableDefaultValueDuration, [
      { node, value: judgedLater(text) },
    ]),
  file: (rows, node, text) =>
    Rows.add(rows, mapping.relations.InterpolationTableDefaultValueFile, [
      { node, value: judgedLater(text) },
    ]),
  float: (rows, node, text) =>
    Rows.add(rows, mapping.relations.InterpolationTableDefaultValueFloat, [
      { node, value: judgedLater(text) },
    ]),
  identifier: (rows, node, text) =>
    Rows.add(rows, mapping.relations.InterpolationTableDefaultValueIdentifier, [
      { node, value: judgedLater(text) },
    ]),
  integer: (rows, node, text) =>
    Rows.add(rows, mapping.relations.InterpolationTableDefaultValueInteger, [
      { node, value: judgedLater(text) },
    ]),
  pair: (rows, node, text) =>
    Rows.add(rows, mapping.relations.InterpolationTableDefaultValuePair, [
      { node, value: judgedLater(text) },
    ]),
  point: (rows, node, text) =>
    Rows.add(rows, mapping.relations.InterpolationTableDefaultValuePoint, [
      { node, value: judgedLater(text) },
    ]),
  string: (rows, node, text) =>
    Rows.add(rows, mapping.relations.InterpolationTableDefaultValueString, [
      { node, value: judgedLater(text) },
    ]),
  uri: (rows, node, text) =>
    Rows.add(rows, mapping.relations.InterpolationTableDefaultValueUri, [
      { node, value: judgedLater(text) },
    ]),
};

/**
 * What an entry copies from the mapping or table it sits in: the declaration's id and the base
 * type.
 */
interface Holder {
  readonly baseType: BaseTypeHandle;
  readonly declaration: string;
}

/**
 * The state a pass over the tree keeps: the position of each child, the mapping or table each
 * holder node became, and the document.
 */
interface Pass {
  readonly documentId: string;
  readonly holders: Map<string, Holder>;
  readonly positions: ReadonlyMap<string, bigint>;
}

/**
 * The rows of one `qti-mapping`: the mapping, its bounds where written, and its default value.
 */
const mappingElement = Effect.fn("import.mappingElement")(function* mappingElement(
  pass: Pass,
  rows: Rows,
  element: Element,
  node: NodeRef,
  owner: DeclaredVariable,
): Effect.fn.Return<Rows, ImportRefused> {
  if (Option.isNone(owner.baseType)) {
    return rows;
  }

  const baseType = owner.baseType.value;
  yield* exactOf(
    element,
    "lower-bound",
    "the lower-bound attribute of qti-mapping",
    "attribute-lexical",
  );
  yield* exactOf(
    element,
    "upper-bound",
    "the upper-bound attribute of qti-mapping",
    "attribute-lexical",
  );
  yield* exactOf(
    element,
    "default-value",
    "the default-value attribute of qti-mapping",
    "attribute-lexical",
  );

  const attributes = attributeReader(rows, element, node);
  const lower = attributes.read("lower-bound");
  const upper = attributes.read("upper-bound");
  const defaultValue = attributes.read("default-value");
  pass.holders.set(node.id, { baseType, declaration: owner.id });
  let built = Rows.add(attributes.rows(), mapping.Mapping, [
    {
      baseType,
      declaration: owner.id,
      defaultValue: judgedLater(Option.getOrElse(defaultValue, () => "0")),
      document: pass.documentId,
      id: node.id,
    },
  ]);
  built = Rows.add(
    built,
    mapping.MappingLowerBound,
    written(lower, (own) => ({ node: node.id, value: judgedLater(own) })),
  );

  built = Rows.add(
    built,
    mapping.MappingUpperBound,
    written(upper, (own) => ({ node: node.id, value: judgedLater(own) })),
  );

  return markers(
    built,
    { "default-value": mapping.DeclaredMappingDefaultValue },
    node.id,
    attributes.written(),
  );
});

/**
 * The rows of one `qti-map-entry`: the entry at its position, its key in the arm of its mapping's
 * base type, and the marker of a written `case-sensitive`.
 */
const mapEntryElement = Effect.fn("import.mapEntryElement")(function* mapEntryElement(
  pass: Pass,
  rows: Rows,
  element: Element,
  node: NodeRef,
  holderId: string,
): Effect.fn.Return<Rows, ImportRefused> {
  const holder = pass.holders.get(holderId);
  if (holder === undefined) {
    return rows;
  }

  yield* exactOf(
    element,
    "mapped-value",
    "the mapped-value attribute of qti-map-entry",
    "attribute-lexical",
  );

  const attributes = attributeReader(rows, element, node);
  const mappedValue = attributes.read("mapped-value");
  const caseSensitive = yield* closedOf(
    XsBoolean.handles,
    Option.getOrElse(attributes.read("case-sensitive"), () => "false"),
    "attribute-lexical",
    "the case-sensitive attribute of qti-map-entry",
  );
  const key = yield* valueOf(
    attributes.rows(),
    element,
    node,
    "map-key",
    holder.baseType,
    "map-key-lexical",
  );
  let built = Rows.add(key.rows, mapping.MapEntry, [
    {
      baseType: holder.baseType,
      caseSensitive,
      declaration: holder.declaration,
      id: node.id,
      mappedValue: judgedLater(Option.getOrElse(mappedValue, () => "")),
      mapping: holderId,
      position: pass.positions.get(node.id) ?? 0n,
    },
  ]);
  if (Option.isSome(key.value)) {
    built = yield* armRows(mapKeyArms, holder.baseType, built, node.id, key.value.value);
  }

  return markers(
    built,
    { "case-sensitive": mapping.DeclaredMapEntryCaseSensitive },
    node.id,
    attributes.written(),
  );
});

/**
 * The rows of one `qti-area-mapping`: the area mapping, its bounds where written, and its default
 * value.
 */
const areaMappingElement = Effect.fn("import.areaMappingElement")(function* areaMappingElement(
  pass: Pass,
  rows: Rows,
  element: Element,
  node: NodeRef,
  declaration: string,
): Effect.fn.Return<Rows, ImportRefused> {
  yield* exactOf(
    element,
    "lower-bound",
    "the lower-bound attribute of qti-area-mapping",
    "attribute-lexical",
  );
  yield* exactOf(
    element,
    "upper-bound",
    "the upper-bound attribute of qti-area-mapping",
    "attribute-lexical",
  );
  yield* exactOf(
    element,
    "default-value",
    "the default-value attribute of qti-area-mapping",
    "attribute-lexical",
  );

  const attributes = attributeReader(rows, element, node);
  const lower = attributes.read("lower-bound");
  const upper = attributes.read("upper-bound");
  const defaultValue = attributes.read("default-value");
  let built = Rows.add(attributes.rows(), mapping.AreaMapping, [
    {
      declaration,
      defaultValue: judgedLater(Option.getOrElse(defaultValue, () => "0")),
      document: pass.documentId,
      id: node.id,
    },
  ]);
  built = Rows.add(
    built,
    mapping.AreaMappingLowerBound,
    written(lower, (own) => ({ node: node.id, value: judgedLater(own) })),
  );

  built = Rows.add(
    built,
    mapping.AreaMappingUpperBound,
    written(upper, (own) => ({ node: node.id, value: judgedLater(own) })),
  );

  return markers(
    built,
    { "default-value": mapping.DeclaredAreaMappingDefaultValue },
    node.id,
    attributes.written(),
  );
});

/**
 * The rows of one `qti-area-map-entry`: the entry at its position and its coordinates.
 *
 * @returns The rows; `ItemRefusal` for an entry whose `shape` is not a shape. An entry with no
 *   `coords` has no `Coords` row, and the shape's capacity refuses it at commit.
 */
const areaMapEntryElement = Effect.fn("import.areaMapEntryElement")(function* areaMapEntryElement(
  pass: Pass,
  rows: Rows,
  element: Element,
  node: NodeRef,
  areaMapping: string,
): Effect.fn.Return<Rows, ItemRefusal | ImportRefused> {
  const shapeText = lexicalOf(element, "shape");
  const shape = Option.flatMapNullishOr(shapeText, (known) =>
    Shape.handles.find((handle) => handle === known),
  );
  if (Option.isNone(shape)) {
    return yield* new ItemRefusal({
      detail: `The qti-area-map-entry has the shape "${Option.getOrElse(shapeText, () => "")}", which is not a shape. Use circle, default, ellipse, poly or rect.`,
      rule: "typed-copy",
    });
  }

  yield* exactOf(
    element,
    "mapped-value",
    "the mapped-value attribute of qti-area-map-entry",
    "attribute-lexical",
  );

  const attributes = attributeReader(rows, element, node);
  const mappedValue = attributes.read("mapped-value");
  const built = Rows.add(attributes.rows(), mapping.AreaMapEntry, [
    {
      areaMapping,
      id: node.id,
      mappedValue: judgedLater(Option.getOrElse(mappedValue, () => "")),
      position: pass.positions.get(node.id) ?? 0n,
      shape: shape.value,
    },
  ]);

  return Option.match(lexicalOf(element, "coords"), {
    onNone: () => built,
    onSome: (coords) => coordsRows(built, node.id, "qti-area-map-entry", shape.value, coords),
  });
});

/**
 * The rows of one `qti-match-table` or `qti-interpolation-table`: the table, and its default value
 * in the arm of its base type where written.
 */
const tableElement = Effect.fn("import.tableElement")(function* tableElement(
  pass: Pass,
  rows: Rows,
  element: Element,
  node: NodeRef,
  owner: DeclaredVariable,
): Effect.fn.Return<Rows, ImportRefused> {
  if (Option.isNone(owner.baseType)) {
    return rows;
  }

  const baseType = owner.baseType.value;
  pass.holders.set(node.id, { baseType, declaration: owner.id });

  const match = node.kind === "qti-match-table";
  const fact = { baseType, declaration: owner.id, document: pass.documentId, id: node.id };
  const withTable = match
    ? Rows.add(rows, mapping.MatchTable, [fact])
    : Rows.add(rows, mapping.InterpolationTable, [fact]);
  const defaultValue = yield* valueOf(
    withTable,
    element,
    node,
    "default-value",
    baseType,
    "attribute-lexical",
  );
  if (Option.isNone(defaultValue.value)) {
    return defaultValue.rows;
  }

  const text = defaultValue.value.value;

  return match
    ? yield* armRows(
        matchDefaultArms,
        baseType,
        Rows.add(defaultValue.rows, mapping.MatchTableDefaultValue, [{ baseType, node: node.id }]),
        node.id,
        text,
      )
    : yield* armRows(
        interpolationDefaultArms,
        baseType,
        Rows.add(defaultValue.rows, mapping.InterpolationTableDefaultValue, [
          { baseType, node: node.id },
        ]),
        node.id,
        text,
      );
});

/**
 * The rows of one `qti-match-table-entry` or `qti-interpolation-table-entry`: the entry at its
 * position, its target in the arm of its table's base type, and, for an interpolation entry, its
 * `include-boundary` and the marker of a written one.
 */
const tableEntryElement = Effect.fn("import.tableEntryElement")(function* tableEntryElement(
  pass: Pass,
  rows: Rows,
  element: Element,
  node: NodeRef,
  tableId: string,
): Effect.fn.Return<Rows, ImportRefused> {
  const holder = pass.holders.get(tableId);
  if (holder === undefined) {
    return rows;
  }

  yield* exactOf(
    element,
    "source-value",
    `the source-value attribute of ${node.kind}`,
    "attribute-lexical",
  );

  const attributes = attributeReader(rows, element, node);
  const source = Option.getOrElse(attributes.read("source-value"), () => "");
  const target = yield* valueOf(
    attributes.rows(),
    element,
    node,
    "target-value",
    holder.baseType,
    "attribute-lexical",
  );
  const position = pass.positions.get(node.id) ?? 0n;
  const fact = {
    baseType: holder.baseType,
    declaration: holder.declaration,
    id: node.id,
    position,
    table: tableId,
  };
  if (node.kind === "qti-match-table-entry") {
    const built = Rows.add(target.rows, mapping.MatchTableEntry, [
      { ...fact, sourceValue: judgedLater(source) },
    ]);

    return Option.isNone(target.value)
      ? built
      : yield* armRows(matchTargetArms, holder.baseType, built, node.id, target.value.value);
  }

  const includeBoundary = yield* closedOf(
    XsBoolean.handles,
    Option.getOrElse(attributes.read("include-boundary"), () => "true"),
    "attribute-lexical",
    "the include-boundary attribute of qti-interpolation-table-entry",
  );
  const built = Rows.add(target.rows, mapping.InterpolationTableEntry, [
    {
      ...fact,
      includeBoundary,
      sourceValue: judgedLater(source),
    },
  ]);
  const withTarget = Option.isNone(target.value)
    ? built
    : yield* armRows(interpolationTargetArms, holder.baseType, built, node.id, target.value.value);

  return markers(
    withTarget,
    { "include-boundary": mapping.DeclaredIncludeBoundary },
    node.id,
    attributes.written(),
  );
});

/**
 * The rows of every mapping, area mapping, match table and interpolation table of an item, with
 * their entries.
 *
 * Each entry's position is the one of its `Edge` row in `rows`, which must hold the item's tree.
 *
 * @param root - The item's root element.
 * @param nodes - The node index of the item's tree.
 * @param documentId - The id of the item's document, which is also its tree's.
 * @param declarations - The variables the item's declarations name, by identifier.
 * @param rows - The rows so far, which hold the item's tree.
 * @returns The rows with the mappings, tables and entries; `ItemRefusal` for an area map entry
 *   whose shape is not a shape.
 */
export const mappingRows = Effect.fn("import.mappingRows")(function* mappingRows(
  root: Element,
  nodes: NodeIndex,
  documentId: string,
  declarations: ReadonlyMap<string, DeclaredVariable>,
  rows: Rows,
): Effect.fn.Return<Rows, ItemRefusal | ImportRefused> {
  const pass: Pass = {
    documentId,
    holders: new Map(),
    positions: new Map(Rows.of(rows, Edge).map((edge) => [edge.child, edge.position])),
  };
  const owners = new Map([...declarations.values()].map((variable) => [variable.id, variable]));
  let built = rows;
  for (const [element, parent] of withParents(root, Option.none())) {
    const node = nodes.get(element);
    const above = Option.flatMapNullishOr(parent, (found) => nodes.get(found));
    if (node === undefined || Option.isNone(above)) {
      continue;
    }

    const owner = owners.get(above.value.id);
    const parentId = above.value.id;
    if (node.kind === "qti-mapping" && owner !== undefined) {
      built = yield* mappingElement(pass, built, element, node, owner);
    } else if (node.kind === "qti-map-entry") {
      built = yield* mapEntryElement(pass, built, element, node, parentId);
    } else if (node.kind === "qti-area-mapping" && owner !== undefined) {
      built = yield* areaMappingElement(pass, built, element, node, owner.id);
    } else if (node.kind === "qti-area-map-entry") {
      built = yield* areaMapEntryElement(pass, built, element, node, parentId);
    } else if (
      (node.kind === "qti-match-table" || node.kind === "qti-interpolation-table") &&
      owner !== undefined
    ) {
      built = yield* tableElement(pass, built, element, node, owner);
    } else if (
      node.kind === "qti-match-table-entry" ||
      node.kind === "qti-interpolation-table-entry"
    ) {
      built = yield* tableEntryElement(pass, built, element, node, parentId);
    }
  }

  return built;
});

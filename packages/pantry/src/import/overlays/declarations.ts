/**
 * The O2 overlay rows of a document (plan §1.7, §C's `rowsOf`): from a document's view (its rows,
 * each node at its `start`, and their folds) and its place in its package, the rows of every
 * overlay `#pantry/qti/declarations.ts` declares, each relation's rows a keyed set by its element's
 * place, `(package, path, start)`.
 *
 * The rows restate what the tree says and nothing else: each overlay copies its node's tuple as the
 * tree's own rows give it (`flatten` of `#pantry/model/xdm.ts`), each attribute's lexical form as
 * written, each identifier as its lexical form's pieces, each code as the handle its lexical form
 * spells (C17), and each value's text as its node's string value. The database proves every one of
 * them (`declarationLaws`), so a row this builder gets wrong is refused, never accepted.
 */
import type { Addition } from "@bjornpagen/grizzle";
import { Option, Struct } from "effect";
import { foldAt } from "#pantry/import/fold.ts";
import type { DocumentView, Folds } from "#pantry/import/fold.ts";
import { spelledBaseTypes } from "#pantry/grammar/attributes.ts";
import { isNcName } from "#pantry/grammar/domains.ts";
import { spelledCardinalities } from "#pantry/grammar/compose.ts";
import { DeclarationKind } from "#pantry/grammar/install.ts";
import { piecesOf } from "#pantry/import/pieces.ts";
import type { Pieces } from "#pantry/import/pieces.ts";
import type { Composed } from "#pantry/model/composed.ts";
import type { FlatRows, NodeRow } from "#pantry/model/xdm.ts";
import type {
  Declaration,
  DeclarationBaseType,
  DeclarationCardinality,
  DeclarationIdentifier,
  DeclarationName,
  FieldValue,
  MasteryCeiling,
  MasteryFloor,
  MasteryValue,
  NormalMaximum,
  NormalMinimum,
  RecordField,
  RecordFieldName,
  TypedValue,
  Value,
  ValueBaseType,
  ValueSet,
  ValueSetCardinality,
} from "#pantry/qti/declarations.ts";
import { normalMinimumDefaults } from "#pantry/vocab/terms/declarations.ts";

/**
 * A document's O2 overlay rows, one keyed set per relation: each map from the text of its row's
 * key, its element's place ({@link keyTextOf}), to the row as its writer writes it.
 */
export interface DeclarationRows {
  readonly Declaration: ReadonlyMap<string, Addition<typeof Declaration>>;
  readonly DeclarationBaseType: ReadonlyMap<string, Addition<typeof DeclarationBaseType>>;
  readonly DeclarationCardinality: ReadonlyMap<string, Addition<typeof DeclarationCardinality>>;
  readonly DeclarationIdentifier: ReadonlyMap<string, Addition<typeof DeclarationIdentifier>>;
  readonly DeclarationName: ReadonlyMap<string, Addition<typeof DeclarationName>>;
  readonly FieldValue: ReadonlyMap<string, Addition<typeof FieldValue>>;
  readonly MasteryCeiling: ReadonlyMap<string, Addition<typeof MasteryCeiling>>;
  readonly MasteryFloor: ReadonlyMap<string, Addition<typeof MasteryFloor>>;
  readonly MasteryValue: ReadonlyMap<string, Addition<typeof MasteryValue>>;
  readonly NormalMaximum: ReadonlyMap<string, Addition<typeof NormalMaximum>>;
  readonly NormalMinimum: ReadonlyMap<string, Addition<typeof NormalMinimum>>;
  readonly RecordField: ReadonlyMap<string, Addition<typeof RecordField>>;
  readonly RecordFieldName: ReadonlyMap<string, Addition<typeof RecordFieldName>>;
  readonly TypedValue: ReadonlyMap<string, Addition<typeof TypedValue>>;
  readonly Value: ReadonlyMap<string, Addition<typeof Value>>;
  readonly ValueBaseType: ReadonlyMap<string, Addition<typeof ValueBaseType>>;
  readonly ValueSet: ReadonlyMap<string, Addition<typeof ValueSet>>;
  readonly ValueSetCardinality: ReadonlyMap<string, Addition<typeof ValueSetCardinality>>;
}

/**
 * A row of one of the builder's relations, as its writer writes it.
 */
type RowOf<Relation extends keyof DeclarationRows> =
  DeclarationRows[Relation] extends ReadonlyMap<string, infer Row> ? Row : never;

/**
 * One relation's rows of a document, each at its element's `start`, as the relation's keyed set
 * holds them, by the text of the row's key ({@link keyTextOf}): a type-level function of the rows,
 * so `Struct.map` gives each relation of {@link DeclarationRows} its own row type.
 */
interface Keyed extends Struct.Lambda {
  <Row>(rows: ReadonlyMap<bigint, Row>): ReadonlyMap<string, Row>;
  readonly "~lambda.out": this["~lambda.in"] extends ReadonlyMap<bigint, infer Row>
    ? ReadonlyMap<string, Row>
    : never;
}

/**
 * Where a document stands in its package, as its rows hold it: its package's manifest identifier
 * and its path there, which every row holds beside its element's `start`.
 */
export type Place = Pick<Addition<typeof Declaration>, "package" | "path">;

/**
 * The text of a row's key in its relation's keyed set: its document's package and path and its
 * element's `start`, as a JSON array, so the rows of two documents never meet at one key.
 *
 * @param place - The document's place.
 * @param start - The element's position in it.
 * @returns The key text.
 */
export const keyTextOf = (place: Place, start: bigint): string =>
  JSON.stringify([place.package, place.path, String(start)]);

/**
 * A `BaseType` handle.
 */
type BaseTypeHandle = Addition<typeof DeclarationBaseType>["baseType"];

/**
 * A `Cardinality` handle.
 */
type CardinalityHandle = Addition<typeof DeclarationCardinality>["cardinality"];

/**
 * A `DeclarationKind` handle.
 */
type DeclarationKindHandle = Addition<typeof Declaration>["declarationKind"];

/**
 * The declaration kinds, each a `NodeKind` handle that is its own `DeclarationKind` handle.
 */
const declarationKinds: ReadonlyMap<string, DeclarationKindHandle> = new Map(
  DeclarationKind.handles.map((handle) => [handle, handle] as const),
);

/**
 * The declaration kind that writes a normal scale, `mastery-value`, `normal-minimum` and
 * `normal-maximum` (QTI 3.0 information model §4.5.7 to §4.5.9, OutcomeDeclaration).
 */
const outcomeKind = "qti-outcome-declaration";

/**
 * The kinds that hold a declaration's values.
 */
const valueSetKinds: ReadonlySet<string> = new Set(["qti-default-value", "qti-correct-response"]);

/**
 * Split an identifier's lexical form into its pieces where it names something once collapsed, an
 * NCName ({@link isNcName}): any other form, whitespace alone or a name with whitespace or a digit
 * at its start, names nothing, and has no row that holds a name (lane NIL's audit, B10), so its
 * value domain refuses it alone (spec readings 152 and 157).
 *
 * @param lexical - The lexical form, as written.
 * @returns Its pieces, none where it names nothing.
 */
const namedPiecesOf = (lexical: string): Option.Option<Pieces> =>
  Option.liftPredicate(piecesOf(lexical), ({ value }) => isNcName(value));

/**
 * Read the code a `base-type` spells (C17): its lexical form, where that is one of
 * `BaseTypeLexical`'s, since each code is spelled as its lexical form.
 *
 * @param lexical - The lexical form, none where the attribute is unwritten.
 * @returns The handle it spells, none where it is unwritten or spells none, which its value domain
 *   refuses alone.
 */
export const spelledBaseTypeOf = (lexical: Option.Option<string>): Option.Option<BaseTypeHandle> =>
  lexical.pipe(Option.filter((spelled) => spelledBaseTypes.has(spelled)));

/**
 * Read the code a `cardinality` spells (C17): its lexical form, where that is one of
 * `CardinalityLexical`'s, compared as written, since the enumeration restricts `xs:string`, whose
 * whitespace is preserved.
 *
 * @param lexical - The lexical form, none where the attribute is unwritten.
 * @returns The handle it spells, none where it is unwritten or spells none, which AL3 or its value
 *   domain refuses alone.
 */
const spelledCardinalityOf = (lexical: Option.Option<string>): Option.Option<CardinalityHandle> =>
  lexical.pipe(Option.filter((spelled) => spelledCardinalities.has(spelled)));

/**
 * The lexical forms of the three attributes a declaration's rows read, each none where unwritten.
 */
interface DeclarationLexicals {
  readonly baseType: Option.Option<string>;
  readonly cardinality: Option.Option<string>;
  readonly identifier: Option.Option<string>;
}

/**
 * A declaration's name as its {@link DeclarationIdentifier} holds it: its `identifier` as written,
 * and its pieces.
 */
interface DeclaredName {
  readonly lexical: string;
  readonly pieces: Pieces;
}

/**
 * A declaration as its rows hold it: the code its `cardinality` spells, the code its `base-type`
 * spells, each spelled as its lexical form (`BaseTypeLexical`, `CardinalityLexical`), and its
 * name, each none where its attribute is unwritten or spells or names nothing.
 */
export interface TypedDeclaration {
  readonly baseType: Option.Option<BaseTypeHandle>;
  readonly cardinality: Option.Option<CardinalityHandle>;
  readonly name: Option.Option<DeclaredName>;
}

/**
 * Read a declaration as its rows hold it: its `cardinality` and its `base-type` each where it is
 * written and spells a handle (C17; an enumeration whose whitespace is preserved, so a padded one
 * spells none), and its name, its `identifier`'s, where that is written and names something once
 * collapsed ({@link namedPiecesOf}).
 *
 * Every declaration has its row, and every row below it, whatever the three spell (spec readings
 * 157 and 158): each that is unwritten or spells nothing is only the absence of its typed row, a
 * missing value being a row of its own relation, never a sentinel (lane NIL's audit, B10 and B11).
 * AL3 (a required `identifier` or `cardinality` unwritten) or the attribute's value domain (written
 * and spelling nothing) refuses it alone (the orchestrator's ruling of 2026-11-06), and no law
 * reads a type or a name the declaration does not have. The overlays that read declarations, the
 * bindings', the references', the mappings' and the tables', read them through this, so they agree
 * on which have which.
 *
 * @param lexical - The lexical forms of its `identifier`, `base-type` and `cardinality`.
 * @returns The declaration.
 */
export const typedDeclarationOf = ({
  baseType,
  cardinality,
  identifier,
}: DeclarationLexicals): TypedDeclaration => ({
  baseType: spelledBaseTypeOf(baseType),
  cardinality: spelledCardinalityOf(cardinality),
  name: identifier.pipe(
    Option.flatMap((lexical) =>
      Option.map(namedPiecesOf(lexical), (pieces) => ({ lexical, pieces })),
    ),
  ),
});

/**
 * Count a declaration's typed rows of one attribute, the rows of `DeclarationBaseType` or
 * `DeclarationCardinality` it has and the `baseTypes` or `cardinalities` every row that copies it
 * holds: 1 where the attribute spells a code, and 0 where it is unwritten, a record's base type
 * among them, or spells nothing (lane NIL's audit, B12; spec reading 158).
 *
 * @param typed - The attribute's code, none where it has none.
 * @returns The count.
 */
export const typedCountOf = (typed: Option.Option<string>): bigint =>
  BigInt(Option.toArray(typed).length);

/**
 * Read a declaring element as every overlay that copies its declaration reads it: its kind's
 * `DeclarationKind` and the declaration as its rows hold it ({@link typedDeclarationOf}). An
 * element that declares nothing has none.
 *
 * @param kind - The element's kind.
 * @param attribute - Reads one of its attributes' lexical form, none where it is unwritten.
 * @returns The declaration, or none.
 */
export const declarationOf = (
  kind: string,
  attribute: (name: string) => Option.Option<string>,
): Option.Option<TypedDeclaration & { readonly declarationKind: DeclarationKindHandle }> =>
  Option.map(Option.fromUndefinedOr(declarationKinds.get(kind)), (declarationKind) => ({
    ...typedDeclarationOf({
      baseType: attribute("base-type"),
      cardinality: attribute("cardinality"),
      identifier: attribute("identifier"),
    }),
    declarationKind,
  }));

/**
 * Index a document's attribute rows by their element and name.
 *
 * @param rows - The document's flat rows.
 * @returns Each element's attributes' lexical forms, by the element's `start` and the attribute's
 *   name.
 */
const attributesOf = (rows: FlatRows<Composed>): ReadonlyMap<bigint, ReadonlyMap<string, string>> =>
  new Map(
    [...Map.groupBy(rows.attributes, ({ start }) => start)].map(
      ([start, attributes]) =>
        [start, new Map(attributes.map(({ lexical, name }) => [name, lexical] as const))] as const,
    ),
  );

/**
 * Read each node's characters as `Node.chars` holds them: a text or whitespace node's text, an
 * entity reference's `&name;`, nothing for every other node.
 *
 * @param rows - The document's flat rows.
 * @returns Each node's characters, by its `start`, for the nodes that have any.
 */
const charsOf = (rows: FlatRows<Composed>): ReadonlyMap<bigint, string> =>
  new Map([
    ...rows.texts.map(({ start, value }) => [start, value] as const),
    ...rows.whitespace.map(({ start, value }) => [start, value] as const),
    ...rows.entityRefs.map(({ name, start }) => [start, `&${name};`] as const),
  ]);

/**
 * What a node's rows give the overlays besides its own row: its fold (`#pantry/import/fold.ts`),
 * which holds its nearest interaction (N8) and its element counts, and its children's characters,
 * for each node one of whose children holds any.
 */
interface Derived {
  readonly folds: Folds;
  readonly text: ReadonlyMap<bigint, string>;
}

/**
 * The string value of a node none of whose children holds characters: the concatenation of none,
 * the empty text (`Node.stringValue`, Q5.03's fold over its children's characters).
 */
const noCharacters = "";

/**
 * Compute what the tree gives each node, as `Node`'s laws hold it: its fold, the view's, and the
 * string value of its children's characters, concatenated in order.
 *
 * @param view - A document's view, its nodes in document order, so each parent precedes its
 *   children.
 * @returns The derived values, by node `start`.
 */
const derivedOf = (view: DocumentView): Derived => {
  const { folds, rows } = view;
  const chars = charsOf(rows);
  const pieces = rows.nodes.flatMap(({ parent, start }) =>
    parent === start
      ? []
      : Option.toArray(
          Option.map(Option.fromUndefinedOr(chars.get(start)), (value) => ({ parent, value })),
        ),
  );
  const text = new Map(
    [...Map.groupBy(pieces, ({ parent }) => parent)].map(
      ([parent, held]) => [parent, held.map(({ value }) => value).join("")] as const,
    ),
  );

  return { folds, text };
};

/**
 * What every row builder reads of a document: its place in its package, its node rows' derived
 * values, its attributes, and the rows built so far, a parent's before its children's, each by its
 * element's `start`.
 */
interface Reading {
  readonly attributes: ReadonlyMap<bigint, ReadonlyMap<string, string>>;
  readonly derived: Derived;
  readonly kinds: ReadonlyMap<bigint, NodeRow<Composed>["kind"]>;
  readonly place: Place;
  readonly rows: { readonly [Relation in keyof DeclarationRows]: Map<bigint, RowOf<Relation>> };
}

/**
 * Read a node's attribute.
 *
 * @param reading - The document.
 * @param node - The node.
 * @param name - The attribute's name.
 * @returns Its lexical form, none where the node does not write it.
 */
const valueOf = (reading: Reading, node: NodeRow<Composed>, name: string): Option.Option<string> =>
  Option.fromUndefinedOr(reading.attributes.get(node.start)?.get(name));

/**
 * Read a node's parent's kind, as `Declaration.parentKind` copies it from `Node`.
 *
 * @param reading - The document.
 * @param node - The node, not the document node.
 * @returns The parent's kind.
 * @throws {Error} When the document holds no node at the parent's `start`: a defect of the caller,
 *   which read a node of other rows than the reading's.
 */
const parentKindOf = (reading: Reading, node: NodeRow<Composed>): NodeRow<Composed>["kind"] => {
  const kind = reading.kinds.get(node.parent);
  if (kind === undefined) {
    throw new Error(
      `${node.parent}, the parent of the node at ${node.start}, is no node's start in the document, which holds every parent a declaration names. Read each node in the rows the reading was built from.`,
    );
  }

  return kind;
};

/**
 * Write a node's place, the key of every row of it: its document's package and path and its own
 * `start`.
 *
 * @param reading - The document.
 * @param node - The node.
 * @returns The place.
 */
const placeOf = (reading: Reading, node: NodeRow<Composed>) => ({
  package: reading.place.package,
  path: reading.place.path,
  start: node.start,
});

/**
 * Write a node's `nodeRef` tuple as an overlay row copies it.
 *
 * @param reading - The document.
 * @param node - The node.
 * @returns The tuple.
 */
const tupleOf = (reading: Reading, node: NodeRow<Composed>) => ({
  ...placeOf(reading, node),
  kind: node.kind,
  nearest: foldAt(reading.derived.folds, node.start).nearest,
  parent: node.parent,
  version: node.version,
});

/**
 * Read an outcome declaration's normal minimum (spec reading 149): its `normal-minimum` as written,
 * and else its version's XSD default, which QTI 3.0.1 states and QTI 3.0 does not
 * (`normalMinimumDefaults`).
 *
 * @param reading - The document.
 * @param node - The declaration's node.
 * @returns The minimum's lexical form and whether it is written, none where it has none.
 */
const minimumOf = (
  reading: Reading,
  node: NodeRow<Composed>,
): Option.Option<{ readonly lexical: string; readonly written: boolean }> =>
  Option.match(valueOf(reading, node, "normal-minimum"), {
    onNone: () =>
      Option.map(Option.fromUndefinedOr(normalMinimumDefaults.get(node.version)), (lexical) => ({
        lexical,
        written: false,
      })),
    onSome: (lexical) => Option.some({ lexical, written: true }),
  });

/**
 * Add an outcome declaration's scale rows: each of its `mastery-value` and `normal-maximum` it
 * writes, its normal minimum where it has one ({@link minimumOf}), and each pair of them
 * `Mastery_range` orders where it has both (spec readings 9 and 149). A value it does not have has
 * no row, and no pair holds it.
 *
 * @param reading - The document.
 * @param node - The declaration's node.
 */
const addScale = (reading: Reading, node: NodeRow<Composed>): void => {
  const mastery = valueOf(reading, node, "mastery-value");
  const minimum = minimumOf(reading, node);
  const maximum = valueOf(reading, node, "normal-maximum");
  const place = placeOf(reading, node);
  for (const lexical of Option.toArray(mastery)) {
    reading.rows.MasteryValue.set(node.start, { ...place, lexical });
  }

  for (const { lexical, written: stated } of Option.toArray(minimum)) {
    reading.rows.NormalMinimum.set(node.start, {
      ...place,
      lexical,
      version: node.version,
      written: stated,
    });
  }

  for (const lexical of Option.toArray(maximum)) {
    reading.rows.NormalMaximum.set(node.start, { ...place, lexical });
  }

  for (const [{ lexical: normalMinimum }, masteryValue] of Option.toArray(
    Option.all([minimum, mastery]),
  )) {
    reading.rows.MasteryFloor.set(node.start, { ...place, masteryValue, normalMinimum });
  }

  for (const [masteryValue, normalMaximum] of Option.toArray(Option.all([mastery, maximum]))) {
    reading.rows.MasteryCeiling.set(node.start, { ...place, masteryValue, normalMaximum });
  }
};

/**
 * Add a declaration's rows: its row, every declaration's whatever its attributes spell (spec
 * readings 157 and 158); its cardinality's and its base type's, each where it spells a code; its
 * identifier's where it names something, and its name's where it names something and the
 * declaration has a cardinality; and an outcome declaration's scale rows ({@link addScale}). An
 * attribute that is unwritten or spells nothing has no row, and its own law refuses it alone.
 *
 * @param reading - The document.
 * @param node - The declaration's node.
 * @param declarationKind - Its kind as a `DeclarationKind`.
 */
const addDeclaration = (
  reading: Reading,
  node: NodeRow<Composed>,
  declarationKind: DeclarationKindHandle,
): void => {
  const typed = typedDeclarationOf({
    baseType: valueOf(reading, node, "base-type"),
    cardinality: valueOf(reading, node, "cardinality"),
    identifier: valueOf(reading, node, "identifier"),
  });
  const counts = {
    baseTypes: typedCountOf(typed.baseType),
    cardinalities: typedCountOf(typed.cardinality),
  };
  const parentKind = parentKindOf(reading, node);
  const place = placeOf(reading, node);
  reading.rows.Declaration.set(node.start, {
    ...tupleOf(reading, node),
    declarationKind,
    parentKind,
  });
  for (const cardinality of Option.toArray(typed.cardinality)) {
    reading.rows.DeclarationCardinality.set(node.start, { ...place, cardinality });
  }

  for (const baseType of Option.toArray(typed.baseType)) {
    reading.rows.DeclarationBaseType.set(node.start, { ...place, baseType });
  }

  for (const { lexical, pieces } of Option.toArray(typed.name)) {
    reading.rows.DeclarationIdentifier.set(node.start, {
      ...place,
      ...counts,
      declarationKind,
      identifier: pieces.value,
      identifierLead: pieces.lead,
      identifierLexical: lexical,
      identifierTrail: pieces.trail,
      parentKind,
    });
    for (const cardinality of Option.toArray(typed.cardinality)) {
      reading.rows.DeclarationName.set(node.start, {
        ...place,
        baseTypes: counts.baseTypes,
        cardinality,
        declarationKind,
        identifier: pieces.value,
        parentKind,
      });
    }
  }

  if (node.kind === outcomeKind) {
    addScale(reading, node);
  }
};

/**
 * Read a declaration's typed rows: its `DeclarationBaseType`'s base type and its
 * `DeclarationCardinality`'s cardinality, written before any row below it, since a declaration
 * precedes its children in document order.
 *
 * @param reading - The document.
 * @param declaration - The declaration's `start`.
 * @returns Its base type and its cardinality, each none where it has none.
 */
const typedAt = (
  reading: Reading,
  declaration: bigint,
): Pick<TypedDeclaration, "baseType" | "cardinality"> => ({
  baseType: Option.map(
    Option.fromUndefinedOr(reading.rows.DeclarationBaseType.get(declaration)),
    ({ baseType }) => baseType,
  ),
  cardinality: Option.map(
    Option.fromUndefinedOr(reading.rows.DeclarationCardinality.get(declaration)),
    ({ cardinality }) => cardinality,
  ),
});

/**
 * Add a value set's row: its declaration's fields, through `declarationRef`, and its count of
 * values.
 *
 * @param reading - The document.
 * @param node - The set's node.
 * @param declaration - Its declaration's row.
 */
const addValueSet = (
  reading: Reading,
  node: NodeRow<Composed>,
  declaration: Addition<typeof Declaration>,
): void => {
  const typed = typedAt(reading, node.parent);
  const fold = foldAt(reading.derived.folds, node.start);
  reading.rows.ValueSet.set(node.start, {
    ...tupleOf(reading, node),
    baseTypes: typedCountOf(typed.baseType),
    cardinalities: typedCountOf(typed.cardinality),
    declarationKind: declaration.declarationKind,
    elementChildren: fold.elementChildren,
    elements: fold.elements,
  });
};

/**
 * Add a value's row, its text beside its declaration's base type and cardinality where the
 * declaration has both, its own base type's where it writes one that spells a code and its text
 * beside that where the declaration has a cardinality, its field's where it writes both a
 * `field-identifier` and a `base-type`, and its field's name where that `field-identifier` names
 * something once collapsed.
 *
 * A value writes either only as a record's field (information model §7.46.1 and §7.46.2: each "is
 * only used for" a value "that forms part of a record"). The rows hold what it writes and nothing
 * else, so `Value_cardinality` refuses a record's value that writes either alone or neither, and
 * any other set's value that writes either, through its count of fields and each attribute's copy
 * into {@link RecordField}. A field whose `field-identifier` is no NCName once collapsed,
 * whitespace alone among them, names no field: it has no {@link RecordFieldName}, and its value
 * domain refuses it alone, never `E1_derived` over a name it does not have (spec reading
 * 152).
 *
 * @param reading - The document.
 * @param node - The value's node.
 * @param set - Its set's row.
 */
const addValue = (
  reading: Reading,
  node: NodeRow<Composed>,
  set: Addition<typeof ValueSet>,
): void => {
  const text = reading.derived.text.get(node.start) ?? noCharacters;
  const typed = typedAt(reading, set.parent);
  const place = placeOf(reading, node);
  const written = { ...place, declaration: set.parent, text };
  reading.rows.Value.set(node.start, {
    ...tupleOf(reading, node),
    baseTypes: set.baseTypes,
    cardinalities: set.cardinalities,
    declaration: set.parent,
    text,
  });
  for (const [baseType, cardinality] of Option.toArray(
    Option.all([typed.baseType, typed.cardinality]),
  )) {
    reading.rows.TypedValue.set(node.start, { ...written, baseType, cardinality });
  }

  const fieldIdentifier = valueOf(reading, node, "field-identifier");
  const fieldBaseType = valueOf(reading, node, "base-type");
  for (const baseType of Option.toArray(spelledBaseTypeOf(fieldBaseType))) {
    reading.rows.ValueBaseType.set(node.start, {
      ...place,
      baseType,
      cardinalities: set.cardinalities,
    });
    for (const cardinality of Option.toArray(typed.cardinality)) {
      reading.rows.FieldValue.set(node.start, { ...written, baseType, cardinality });
    }
  }

  for (const [identifierLexical, baseTypeLexical] of Option.toArray(
    Option.all([fieldIdentifier, fieldBaseType]),
  )) {
    reading.rows.RecordField.set(node.start, {
      ...tupleOf(reading, node),
      baseTypeLexical,
      identifierLexical,
    });
    for (const { lead, trail, value: name } of Option.toArray(namedPiecesOf(identifierLexical))) {
      reading.rows.RecordFieldName.set(node.start, {
        ...place,
        identifier: name,
        identifierLead: lead,
        identifierLexical,
        identifierTrail: trail,
        parent: node.parent,
      });
    }
  }
};

/**
 * Add each value set's row beside its declaration's cardinality, where the declaration has one:
 * its counts of values and of fields, the {@link RecordField} rows whose parent it is, which
 * `ValueSet.fields` counts.
 *
 * @param reading - The document, every value's rows written.
 */
const addValueSetCardinalities = (reading: Reading): void => {
  const fields = [...reading.rows.RecordField.values()];
  for (const set of reading.rows.ValueSet.values()) {
    for (const cardinality of Option.toArray(typedAt(reading, set.parent).cardinality)) {
      reading.rows.ValueSetCardinality.set(set.start, {
        cardinality,
        declaration: set.parent,
        elementChildren: set.elementChildren,
        fields: BigInt(fields.filter(({ parent }) => parent === set.start).length),
        package: set.package,
        path: set.path,
        start: set.start,
      });
    }
  }
};

/**
 * Build the O2 overlay rows of a document: a row per declaration, per cardinality and base type it
 * spells, per identifier and name it has, per value set of a declaration and per value set beside
 * its declaration's cardinality, per value and its typed rows, per record field and per field
 * name, and per scale attribute of an outcome declaration and per pair of them it writes.
 *
 * @param view - The document's view: its rows, each node at its `start`, and their folds under its
 *   context (spec reading 117), its own or, for an included fragment, the interaction its includes
 *   stand in, which its nodes take as their nearest.
 * @param place - Where the document stands in its package, the key every row holds.
 * @returns Every overlay's rows.
 */
export const rowsOf = (view: DocumentView, place: Place): DeclarationRows => {
  const flat = view.rows;
  const reading: Reading = {
    attributes: attributesOf(flat),
    derived: derivedOf(view),
    kinds: new Map(flat.nodes.map(({ kind, start }) => [start, kind] as const)),
    place,
    rows: {
      Declaration: new Map(),
      DeclarationBaseType: new Map(),
      DeclarationCardinality: new Map(),
      DeclarationIdentifier: new Map(),
      DeclarationName: new Map(),
      FieldValue: new Map(),
      MasteryCeiling: new Map(),
      MasteryFloor: new Map(),
      MasteryValue: new Map(),
      NormalMaximum: new Map(),
      NormalMinimum: new Map(),
      RecordField: new Map(),
      RecordFieldName: new Map(),
      TypedValue: new Map(),
      Value: new Map(),
      ValueBaseType: new Map(),
      ValueSet: new Map(),
      ValueSetCardinality: new Map(),
    },
  };

  for (const node of flat.nodes) {
    const declarationKind = declarationKinds.get(node.kind);
    const declaration = reading.rows.Declaration.get(node.parent);
    const set = reading.rows.ValueSet.get(node.parent);
    if (declarationKind !== undefined) {
      addDeclaration(reading, node, declarationKind);
    } else if (valueSetKinds.has(node.kind) && declaration !== undefined) {
      addValueSet(reading, node, declaration);
    } else if (node.kind === "qti-value" && set !== undefined) {
      addValue(reading, node, set);
    }
  }

  addValueSetCardinalities(reading);

  return Struct.map(
    Struct.lambda<Keyed>(
      (rows) => new Map([...rows].map(([start, row]) => [keyTextOf(place, start), row] as const)),
    ),
  )(reading.rows);
};

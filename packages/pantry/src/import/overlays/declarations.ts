/**
 * The O2 overlay rows of a document (plan §1.7, §C's `rowsOf`): from a document's XDM tree and the
 * ids its nodes are written under, the rows of every overlay `#pantry/qti/declarations.ts`
 * declares, each relation's rows a keyed set by its node's id.
 *
 * The rows restate what the tree says and nothing else: each overlay copies its node's tuple as the
 * tree's own rows give it (`flatten` of `#pantry/model/xdm.ts`), each attribute's lexical form as
 * written, each identifier as its lexical form's pieces, each code as the handle its lexical form
 * spells (C17), and each value's text as its node's string value. The database proves every one of
 * them (`declarationLaws`), so a row this builder gets wrong is refused, never accepted.
 */
import type { Addition } from "@bjornpagen/grizzle";
import { Option } from "effect";
import type { DocumentContext } from "#pantry/import/context.ts";
import { foldAt, foldOf } from "#pantry/import/fold.ts";
import type { Folds } from "#pantry/import/fold.ts";
import { spelledBaseTypes } from "#pantry/grammar/attributes.ts";
import { isNcName } from "#pantry/grammar/domains.ts";
import { spelledCardinalities } from "#pantry/grammar/compose.ts";
import { DeclarationKind } from "#pantry/grammar/install.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { FlatRows, NodeId, NodeRow, XdmDocument } from "#pantry/model/xdm.ts";
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
import { normalMinimumDefaults } from "#pantry/qti/declarations.ts";
import { valueBaseOf } from "#pantry/qti/expression-types.ts";

/**
 * The ids a document's rows are written under: each of its tree's nodes', drawn by the number
 * `flatten` gives the node, in document order from the document node's 0.
 *
 * It is the part of the importer's `NodeIds` (Q5.15) this builder reads, so the overlay rows and
 * the tree's rows name each node by one id.
 */
export interface DocumentIds {
  /**
   * The document's context (spec reading 117), its own (`ownContext`) or, for an included
   * fragment, the interaction its includes stand in, which its nodes take as their nearest.
   */
  readonly context: DocumentContext;
  readonly idOf: (index: number) => NodeId;
}

/**
 * A document's O2 overlay rows, one keyed set per relation: each map from its row's node id to the
 * row as its writer writes it.
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
 * The whitespace an identifier's lexical form holds around its name.
 */
type Space = Addition<typeof DeclarationIdentifier>["identifierLead"];

/**
 * An identifier's lexical form in its three pieces: the whitespace before its name, the name, and
 * the whitespace after it.
 */
export interface Pieces {
  readonly lead: Space;
  readonly name: string;
  readonly trail: Space;
}

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
 * Whether a character is XML whitespace, `S` (XML 1.0, §2.3): a tab, a line feed, a carriage return
 * or a space.
 *
 * @param char - The character.
 * @returns Whether it is.
 */
const isSpaceCharacter = (char: string): boolean =>
  char === "\t" || char === "\n" || char === "\r" || char === " ";

/**
 * Whether a text is XML whitespace alone, possibly none: the language of an identifier's pieces.
 *
 * @param text - The text.
 * @returns Whether it is.
 */
const isSpace = (text: string): text is Space => /^[\t\n\r ]*$/u.test(text);

/**
 * Read a run of a lexical form that holds whitespace alone, as a piece.
 *
 * @param lexical - The lexical form.
 * @param from - The run's first unit.
 * @param to - The unit past its last.
 * @returns The run.
 * @throws {Error} When the run holds a character that is no whitespace, which {@link piecesOf}'s
 *   bounds rule out: a defect of the caller, never of the document.
 */
const spaceRunOf = (lexical: string, from: number, to: number): Space => {
  const run = lexical.slice(from, to);
  if (!isSpace(run)) {
    throw new Error(
      `The run ${JSON.stringify(run)} of ${JSON.stringify(lexical)} holds a character that is no XML whitespace. Bound an identifier's pieces at its first and last non-whitespace characters.`,
    );
  }

  return run;
};

/**
 * Split an identifier's lexical form into its pieces: its outer whitespace and the name between,
 * its collapsed form (XML Schema Part 2, §4.3.6), since a name holds no whitespace. A form of
 * whitespace alone is its lead, and names nothing.
 *
 * Each whitespace character is one UTF-16 unit, so the name's bounds are read by unit.
 *
 * @param lexical - The lexical form, as written.
 * @returns The pieces, which concatenate to it.
 */
export const piecesOf = (lexical: string): Pieces => {
  let start = 0;
  while (start < lexical.length && isSpaceCharacter(lexical.charAt(start))) {
    start += 1;
  }

  let end = lexical.length;
  while (end > start && isSpaceCharacter(lexical.charAt(end - 1))) {
    end -= 1;
  }

  return {
    lead: spaceRunOf(lexical, 0, start),
    name: lexical.slice(start, end),
    trail: spaceRunOf(lexical, end, lexical.length),
  };
};

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
  Option.liftPredicate(piecesOf(lexical), ({ name }) => isNcName(name));

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
export interface DeclarationLexicals {
  readonly baseType: Option.Option<string>;
  readonly cardinality: Option.Option<string>;
  readonly identifier: Option.Option<string>;
}

/**
 * A declaration's name as its {@link DeclarationIdentifier} holds it: its `identifier` as written,
 * and its pieces.
 */
export interface DeclaredName {
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
 * @returns Each element's attributes' lexical forms, by the element's id and the attribute's name.
 */
const attributesOf = (rows: FlatRows<Composed>): ReadonlyMap<NodeId, ReadonlyMap<string, string>> =>
  new Map(
    [...Map.groupBy(rows.attributes, ({ node }) => node)].map(
      ([node, attributes]) =>
        [node, new Map(attributes.map(({ lexical, name }) => [name, lexical] as const))] as const,
    ),
  );

/**
 * Read each node's characters as `Node.chars` holds them: a text or whitespace node's text, an
 * entity reference's `&name;`, nothing for every other node.
 *
 * @param rows - The document's flat rows.
 * @returns Each node's characters, by its id, for the nodes that have any.
 */
const charsOf = (rows: FlatRows<Composed>): ReadonlyMap<NodeId, string> =>
  new Map([
    ...rows.texts.map(({ node, value }) => [node, value] as const),
    ...rows.whitespace.map(({ node, value }) => [node, value] as const),
    ...rows.entityRefs.map(({ name, node }) => [node, `&${name};`] as const),
  ]);

/**
 * What a node's rows give the overlays besides its own row: its fold (`#pantry/import/fold.ts`),
 * which holds its nearest interaction (N8) and its element counts, and its children's characters,
 * for each node one of whose children holds any.
 */
interface Derived {
  readonly folds: Folds;
  readonly text: ReadonlyMap<NodeId, string>;
}

/**
 * The string value of a node none of whose children holds characters: the concatenation of none,
 * the empty text (`Node.stringValue`, Q5.03's fold over its children's characters).
 */
const noCharacters = "";

/**
 * Compute what the tree gives each node, as `Node`'s laws hold it: its fold, and the string value
 * of its children's characters, concatenated in order.
 *
 * @param rows - A document's flat rows, its nodes in document order, so each parent precedes its
 *   children.
 * @param context - The document's context (spec reading 117).
 * @returns The derived values, by node id.
 */
const derivedOf = (rows: FlatRows<Composed>, context: DocumentContext): Derived => {
  const chars = charsOf(rows);
  const pieces = rows.nodes.flatMap(({ id, parent }) =>
    parent === id
      ? []
      : Option.toArray(
          Option.map(Option.fromUndefinedOr(chars.get(id)), (value) => ({ parent, value })),
        ),
  );
  const text = new Map(
    [...Map.groupBy(pieces, ({ parent }) => parent)].map(
      ([parent, held]) => [parent, held.map(({ value }) => value).join("")] as const,
    ),
  );

  return { folds: foldOf(rows.nodes, context), text };
};

/**
 * What every row builder reads of a document: its node rows' derived values, its attributes, and
 * the rows built so far, a parent's before its children's.
 */
interface Reading {
  readonly attributes: ReadonlyMap<NodeId, ReadonlyMap<string, string>>;
  readonly derived: Derived;
  readonly document: NodeId;
  readonly rows: { readonly [Relation in keyof DeclarationRows]: Map<string, RowOf<Relation>> };
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
  Option.fromUndefinedOr(reading.attributes.get(node.id)?.get(name));

/**
 * Write a node's `nodeRef` tuple as an overlay row copies it.
 *
 * @param reading - The document.
 * @param node - The node.
 * @returns The tuple.
 */
const tupleOf = (reading: Reading, node: NodeRow<Composed>) => ({
  document: reading.document,
  kind: node.kind,
  nearest: foldAt(reading.derived.folds, node.id).nearest,
  node: node.id,
  parent: node.parent,
  start: node.start,
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
  for (const lexical of Option.toArray(mastery)) {
    reading.rows.MasteryValue.set(node.id, { lexical, node: node.id });
  }

  for (const { lexical, written: stated } of Option.toArray(minimum)) {
    reading.rows.NormalMinimum.set(node.id, {
      lexical,
      node: node.id,
      version: node.version,
      written: stated,
    });
  }

  for (const lexical of Option.toArray(maximum)) {
    reading.rows.NormalMaximum.set(node.id, { lexical, node: node.id });
  }

  for (const [{ lexical: normalMinimum }, masteryValue] of Option.toArray(
    Option.all([minimum, mastery]),
  )) {
    reading.rows.MasteryFloor.set(node.id, { masteryValue, node: node.id, normalMinimum });
  }

  for (const [masteryValue, normalMaximum] of Option.toArray(Option.all([mastery, maximum]))) {
    reading.rows.MasteryCeiling.set(node.id, { masteryValue, node: node.id, normalMaximum });
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
  reading.rows.Declaration.set(node.id, { ...tupleOf(reading, node), declarationKind });
  for (const cardinality of Option.toArray(typed.cardinality)) {
    reading.rows.DeclarationCardinality.set(node.id, {
      cardinality,
      cardinalityLexical: cardinality,
      node: node.id,
    });
  }

  for (const baseType of Option.toArray(typed.baseType)) {
    reading.rows.DeclarationBaseType.set(node.id, {
      baseType,
      baseTypeLexical: baseType,
      node: node.id,
      valueBase: valueBaseOf(baseType),
    });
  }

  for (const { lexical, pieces } of Option.toArray(typed.name)) {
    reading.rows.DeclarationIdentifier.set(node.id, {
      ...counts,
      declarationKind,
      document: reading.document,
      identifier: pieces.name,
      identifierLead: pieces.lead,
      identifierLexical: lexical,
      identifierTrail: pieces.trail,
      node: node.id,
    });
    for (const cardinality of Option.toArray(typed.cardinality)) {
      reading.rows.DeclarationName.set(node.id, {
        baseTypes: counts.baseTypes,
        cardinality,
        declarationKind,
        document: reading.document,
        identifier: pieces.name,
        node: node.id,
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
 * @param declaration - The declaration's node.
 * @returns Its base type and its cardinality, each none where it has none.
 */
const typedAt = (
  reading: Reading,
  declaration: NodeId,
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
  reading.rows.ValueSet.set(node.id, {
    ...tupleOf(reading, node),
    baseTypes: typedCountOf(typed.baseType),
    cardinalities: typedCountOf(typed.cardinality),
    declarationKind: declaration.declarationKind,
    elementChildren: foldAt(reading.derived.folds, node.id).elementChildren,
    elements: foldAt(reading.derived.folds, node.id).elements,
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
  const text = reading.derived.text.get(node.id) ?? noCharacters;
  const typed = typedAt(reading, set.parent);
  const written = { declaration: set.parent, node: node.id, text };
  reading.rows.Value.set(node.id, {
    ...tupleOf(reading, node),
    baseTypes: set.baseTypes,
    cardinalities: set.cardinalities,
    declaration: set.parent,
    text,
  });
  for (const [baseType, cardinality] of Option.toArray(
    Option.all([typed.baseType, typed.cardinality]),
  )) {
    reading.rows.TypedValue.set(node.id, { ...written, baseType, cardinality });
  }

  const fieldIdentifier = valueOf(reading, node, "field-identifier");
  const fieldBaseType = valueOf(reading, node, "base-type");
  for (const baseType of Option.toArray(spelledBaseTypeOf(fieldBaseType))) {
    reading.rows.ValueBaseType.set(node.id, {
      baseType,
      baseTypeLexical: baseType,
      cardinalities: set.cardinalities,
      node: node.id,
    });
    for (const cardinality of Option.toArray(typed.cardinality)) {
      reading.rows.FieldValue.set(node.id, { ...written, baseType, cardinality });
    }
  }

  for (const [identifierLexical, baseTypeLexical] of Option.toArray(
    Option.all([fieldIdentifier, fieldBaseType]),
  )) {
    reading.rows.RecordField.set(node.id, {
      ...tupleOf(reading, node),
      baseTypeLexical,
      identifierLexical,
    });
    for (const { lead, name, trail } of Option.toArray(namedPiecesOf(identifierLexical))) {
      reading.rows.RecordFieldName.set(node.id, {
        identifier: name,
        identifierLead: lead,
        identifierLexical,
        identifierTrail: trail,
        node: node.id,
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
      reading.rows.ValueSetCardinality.set(set.node, {
        cardinality,
        declaration: set.parent,
        elementChildren: set.elementChildren,
        fields: BigInt(fields.filter(({ parent }) => parent === set.node).length),
        node: set.node,
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
 * @param doc - The document's tree, as shred gives it.
 * @param ids - The ids its rows are written under.
 * @returns Every overlay's rows.
 */
export const rowsOf = (doc: XdmDocument<Composed>, ids: DocumentIds): DeclarationRows => {
  const flat = flatten(doc, ids.idOf);
  const reading: Reading = {
    attributes: attributesOf(flat),
    derived: derivedOf(flat, ids.context),
    document: flat.document.node,
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

  return reading.rows;
};

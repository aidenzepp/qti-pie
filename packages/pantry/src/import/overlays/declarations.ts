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
import { recordCardinality, spelledCardinalities } from "#pantry/grammar/compose.ts";
import { DeclarationKind } from "#pantry/grammar/install.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { FlatRows, NodeId, NodeRow, XdmDocument } from "#pantry/model/xdm.ts";
import type {
  Declaration,
  DeclarationBaseType,
  DeclarationName,
  DeclaredValue,
  MasteryCeiling,
  MasteryFloor,
  MasteryValue,
  NormalMaximum,
  NormalMinimum,
  RecordField,
  RecordFieldName,
  Value,
  ValueBaseType,
  ValueSet,
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
  readonly DeclarationName: ReadonlyMap<string, Addition<typeof DeclarationName>>;
  readonly DeclaredValue: ReadonlyMap<string, Addition<typeof DeclaredValue>>;
  readonly MasteryCeiling: ReadonlyMap<string, Addition<typeof MasteryCeiling>>;
  readonly MasteryFloor: ReadonlyMap<string, Addition<typeof MasteryFloor>>;
  readonly MasteryValue: ReadonlyMap<string, Addition<typeof MasteryValue>>;
  readonly NormalMaximum: ReadonlyMap<string, Addition<typeof NormalMaximum>>;
  readonly NormalMinimum: ReadonlyMap<string, Addition<typeof NormalMinimum>>;
  readonly RecordField: ReadonlyMap<string, Addition<typeof RecordField>>;
  readonly RecordFieldName: ReadonlyMap<string, Addition<typeof RecordFieldName>>;
  readonly Value: ReadonlyMap<string, Addition<typeof Value>>;
  readonly ValueBaseType: ReadonlyMap<string, Addition<typeof ValueBaseType>>;
  readonly ValueSet: ReadonlyMap<string, Addition<typeof ValueSet>>;
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
type CardinalityHandle = Addition<typeof Declaration>["cardinality"];

/**
 * A `DeclarationKind` handle.
 */
type DeclarationKindHandle = Addition<typeof Declaration>["declarationKind"];

/**
 * The whitespace an identifier's lexical form holds around its name.
 */
type Space = Addition<typeof DeclarationName>["identifierLead"];

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
export const spelledBaseTypeOf = (lexical: string | undefined): Option.Option<BaseTypeHandle> =>
  lexical !== undefined && spelledBaseTypes.has(lexical) ? Option.some(lexical) : Option.none();

/**
 * The lexical forms of the three attributes a declaration's row reads, each none where unwritten.
 */
export interface DeclarationLexicals {
  readonly baseType: string | undefined;
  readonly cardinality: string | undefined;
  readonly identifier: string | undefined;
}

/**
 * A declaration's name as its {@link DeclarationName} holds it: its `identifier` as written, and
 * its pieces.
 */
export interface DeclaredName {
  readonly lexical: string;
  readonly pieces: Pieces;
}

/**
 * A declaration as its rows hold it: the code its `cardinality` spells with its lexical form, the
 * code its `base-type` spells, none where it writes none, each code spelled as its lexical form
 * (`BaseTypeLexical`, `CardinalityLexical`), and its name, none where its identifier names nothing.
 */
export interface TypedDeclaration {
  readonly baseType: Option.Option<BaseTypeHandle>;
  readonly cardinality: CardinalityHandle;
  readonly cardinalityLexical: string;
  readonly name: Option.Option<DeclaredName>;
}

/**
 * Read a declaration as its rows hold it, where it has a row: its `cardinality` written and
 * spelling a handle (an enumeration whose whitespace is preserved, so a padded one spells none),
 * and its `base-type` unwritten or spelling one (C17). Its name is its `identifier`'s, where that
 * is written and names something once collapsed ({@link namedPiecesOf}); one that is unwritten or
 * names nothing leaves the declaration its row and everything below it, and no name (spec reading
 * 157).
 *
 * Every other declaration has no row, and no row anywhere stands for its type or cardinality: a
 * missing value is a row of its own relation, never a sentinel (lane NIL's audit, B10 and B11).
 * Each such declaration, and each that names nothing, breaks AL3 (a required `identifier` or
 * `cardinality` unwritten) or its attribute's value domain (written and spelling nothing), the one
 * rule it is refused by (the orchestrator's ruling of 2026-11-06), and no law reads a type or a
 * name it does not have. The overlays that read declarations, the bindings', the references' and
 * the tables', read them through this, so they agree on which have rows and which have names.
 *
 * @param lexical - The lexical forms of its `identifier`, `base-type` and `cardinality`.
 * @returns The declaration, or none where it has no row.
 */
export const typedDeclarationOf = ({
  baseType,
  cardinality,
  identifier,
}: DeclarationLexicals): Option.Option<TypedDeclaration> => {
  const spelled = spelledBaseTypeOf(baseType);
  if (
    cardinality === undefined ||
    !spelledCardinalities.has(cardinality) ||
    (baseType !== undefined && Option.isNone(spelled))
  ) {
    return Option.none();
  }

  return Option.some({
    baseType: spelled,
    cardinality,
    cardinalityLexical: cardinality,
    name: Option.flatMap(Option.fromUndefinedOr(identifier), (lexical) =>
      Option.map(namedPiecesOf(lexical), (pieces) => ({ lexical, pieces })),
    ),
  });
};

/**
 * Count a declaration's base types, the rows of `DeclarationBaseType` it has and the `baseTypes`
 * every row that copies it holds: 1 where its `base-type` spells a code, and 0 where it writes
 * none, a record's (lane NIL's audit, B12).
 *
 * @param baseType - Its base type, none where it writes none.
 * @returns The count.
 */
export const baseTypesOf = (baseType: Option.Option<BaseTypeHandle>): bigint =>
  BigInt(Option.toArray(baseType).length);

/**
 * The fields a declaration gives every row that copies it, and its kind's `DeclarationKind`: its
 * base type, none where it writes none, a record's, which a row copies only as its count
 * ({@link baseTypesOf}) and reads only from `DeclarationBaseType`; and its name, none where its
 * identifier names nothing, which only a row that references it by name copies.
 */
export interface DeclaredFields {
  readonly baseType: Option.Option<BaseTypeHandle>;
  readonly cardinality: CardinalityHandle;
  readonly declarationKind: DeclarationKindHandle;
  readonly identifier: Option.Option<string>;
}

/**
 * Read the fields a declaring element gives every row that copies its declaration
 * (`declarationRef`, and `declarationNameRef` where it has a name), as {@link Declaration}'s
 * builder writes them ({@link typedDeclarationOf}): the codes its `base-type` and `cardinality`
 * spell, its kind's `DeclarationKind`, and its name, its identifier without its outer whitespace.
 * Every overlay that resolves against a declaration or copies one reads them here, so the
 * database's containments into either tuple hold by construction.
 *
 * An element that declares nothing has none, and so has a declaration with no `Declaration` row,
 * whose cardinality is unwritten or spells nothing, or whose base type spells nothing: no row
 * copies a declaration that has none (lane NIL's audit, B11).
 *
 * @param kind - The element's kind.
 * @param attribute - Reads one of its attributes' lexical form, none where it is unwritten.
 * @returns The fields, or none.
 */
export const declaredFieldsOf = (
  kind: string,
  attribute: (name: string) => string | undefined,
): Option.Option<DeclaredFields> =>
  Option.flatMap(Option.fromUndefinedOr(declarationKinds.get(kind)), (declarationKind) =>
    Option.map(
      typedDeclarationOf({
        baseType: attribute("base-type"),
        cardinality: attribute("cardinality"),
        identifier: attribute("identifier"),
      }),
      (declared) => ({
        baseType: declared.baseType,
        cardinality: declared.cardinality,
        declarationKind,
        identifier: declared.name.pipe(Option.map(({ pieces }) => pieces.name)),
      }),
    ),
  );

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
const valueOf = (reading: Reading, node: NodeRow<Composed>, name: string): string | undefined =>
  reading.attributes.get(node.id)?.get(name);

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
  Option.match(Option.fromUndefinedOr(valueOf(reading, node, "normal-minimum")), {
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
  const written = (name: string) => Option.fromUndefinedOr(valueOf(reading, node, name));
  const mastery = written("mastery-value");
  const minimum = minimumOf(reading, node);
  const maximum = written("normal-maximum");
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
 * Add a declaration's row, its base type's where it writes one, its name's where its identifier
 * names something, and an outcome declaration's scale rows ({@link addScale}), where it has a row
 * ({@link typedDeclarationOf}): one whose cardinality is unwritten or spells nothing has none of
 * them, nor any value set, value or field below it. One whose identifier is unwritten or names
 * nothing has all of them but its name (spec reading 157).
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
  if (Option.isNone(typed)) {
    return;
  }

  const declared = typed.value;
  reading.rows.Declaration.set(node.id, {
    ...tupleOf(reading, node),
    cardinality: declared.cardinality,
    cardinalityLexical: declared.cardinalityLexical,
    declarationKind,
  });
  for (const { lexical, pieces } of Option.toArray(declared.name)) {
    reading.rows.DeclarationName.set(node.id, {
      baseTypes: baseTypesOf(declared.baseType),
      cardinality: declared.cardinality,
      declarationKind,
      document: reading.document,
      identifier: pieces.name,
      identifierLead: pieces.lead,
      identifierLexical: lexical,
      identifierTrail: pieces.trail,
      node: node.id,
    });
  }
  for (const baseType of Option.toArray(declared.baseType)) {
    reading.rows.DeclarationBaseType.set(node.id, {
      baseType,
      baseTypeLexical: baseType,
      node: node.id,
      valueBase: valueBaseOf(baseType),
    });
  }

  if (node.kind === outcomeKind) {
    addScale(reading, node);
  }
};

/**
 * Read the base type of a declaration of the document: its `DeclarationBaseType`'s, written before
 * any row below it, since a declaration precedes its children in document order.
 *
 * @param reading - The document.
 * @param declaration - The declaration's node.
 * @returns Its base type, none where it writes none, a record's.
 */
const baseTypeAt = (reading: Reading, declaration: NodeId): Option.Option<BaseTypeHandle> =>
  Option.map(
    Option.fromUndefinedOr(reading.rows.DeclarationBaseType.get(declaration)),
    ({ baseType }) => baseType,
  );

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
  reading.rows.ValueSet.set(node.id, {
    ...tupleOf(reading, node),
    baseTypes: baseTypesOf(baseTypeAt(reading, node.parent)),
    cardinality: declaration.cardinality,
    declarationKind: declaration.declarationKind,
    elementChildren: foldAt(reading.derived.folds, node.id).elementChildren,
    elements: foldAt(reading.derived.folds, node.id).elements,
  });
};

/**
 * Add a value's row, its text in its declaration's base type where its set is no record's and the
 * declaration has one, its own base type's where it writes one that spells a code, its field's
 * where it writes both a `field-identifier` and a `base-type`, and its field's name where that
 * `field-identifier` names something once collapsed.
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
  reading.rows.Value.set(node.id, {
    ...tupleOf(reading, node),
    baseTypes: set.baseTypes,
    cardinality: set.cardinality,
    declaration: set.parent,
    text,
  });
  if (set.cardinality !== recordCardinality) {
    for (const baseType of Option.toArray(baseTypeAt(reading, set.parent))) {
      reading.rows.DeclaredValue.set(node.id, {
        baseType,
        declaration: set.parent,
        node: node.id,
        text,
      });
    }
  }

  const fieldIdentifier = valueOf(reading, node, "field-identifier");
  const fieldBaseType = valueOf(reading, node, "base-type");
  for (const baseType of Option.toArray(spelledBaseTypeOf(fieldBaseType))) {
    reading.rows.ValueBaseType.set(node.id, {
      baseType,
      baseTypeLexical: baseType,
      cardinality: set.cardinality,
      node: node.id,
      text,
    });
  }

  if (fieldIdentifier !== undefined && fieldBaseType !== undefined) {
    reading.rows.RecordField.set(node.id, {
      ...tupleOf(reading, node),
      baseTypeLexical: fieldBaseType,
      identifierLexical: fieldIdentifier,
    });
    for (const { lead, name, trail } of Option.toArray(namedPiecesOf(fieldIdentifier))) {
      reading.rows.RecordFieldName.set(node.id, {
        identifier: name,
        identifierLead: lead,
        identifierLexical: fieldIdentifier,
        identifierTrail: trail,
        node: node.id,
        parent: node.parent,
      });
    }
  }
};

/**
 * Build the O2 overlay rows of a document: a row per declaration that has one
 * ({@link typedDeclarationOf}), per base type it writes and per name it has, per value set of such
 * a declaration,
 * per value of a value set, per value's own base type, per record field and per field name, and
 * per scale attribute of such an outcome declaration and per pair of them it writes.
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
      DeclarationName: new Map(),
      DeclaredValue: new Map(),
      MasteryCeiling: new Map(),
      MasteryFloor: new Map(),
      MasteryValue: new Map(),
      NormalMaximum: new Map(),
      NormalMinimum: new Map(),
      RecordField: new Map(),
      RecordFieldName: new Map(),
      Value: new Map(),
      ValueBaseType: new Map(),
      ValueSet: new Map(),
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

  return reading.rows;
};

/**
 * The names a document's declarations hold that only a declaration with no row holds
 * ({@link typedDeclarationOf}): its identifier naming something, its cardinality unwritten or
 * spelling nothing, or its base type spelling nothing. No reference to such a name is written, in
 * place either: the declaration's own law refuses it alone (lane NIL's audit, B11).
 *
 * @param doc - The document's tree, as shred gives it.
 * @param ids - The ids its rows are written under.
 * @returns Each name, under the document's node.
 */
export const untypedNamesOf = (
  doc: XdmDocument<Composed>,
  ids: DocumentIds,
): readonly { readonly document: NodeId; readonly name: string }[] => {
  const flat = flatten(doc, ids.idOf);
  const attributes = attributesOf(flat);
  const typed = new Set<string>();
  const untyped = new Set<string>();
  for (const node of flat.nodes.filter(({ kind }) => declarationKinds.has(kind))) {
    const lexical = (name: string) => attributes.get(node.id)?.get(name);
    const identifier = lexical("identifier");
    for (const { name } of Option.toArray(
      Option.flatMap(Option.fromUndefinedOr(identifier), namedPiecesOf),
    )) {
      const held = typedDeclarationOf({
        baseType: lexical("base-type"),
        cardinality: lexical("cardinality"),
        identifier,
      });
      (Option.isSome(held) ? typed : untyped).add(name);
    }
  }

  return [...untyped]
    .filter((name) => !typed.has(name))
    .map((name) => ({ document: flat.document.node, name }));
};

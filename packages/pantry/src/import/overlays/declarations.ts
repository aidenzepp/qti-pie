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
import { spelledCardinalities } from "#pantry/grammar/compose.ts";
import { DeclarationKind } from "#pantry/grammar/install.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { FlatRows, NodeId, NodeRow, XdmDocument } from "#pantry/model/xdm.ts";
import type {
  Declaration,
  DeclarationBaseType,
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
type BaseTypeHandle = Addition<typeof Declaration>["baseType"];

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
type Space = Addition<typeof Declaration>["identifierLead"];

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
 * The `BaseType` a declaration that writes no `base-type` holds, `none`, which no lexical form
 * spells: a record's ("Variables with record cardinality have no base-type", QTI 3.0 information
 * model, tables 4.5.3, 5.34.3, 5.115.3 and 5.151.3), which `Declaration_base_type` refuses on any
 * other cardinality. It is the one sentinel this builder writes: `declarationRef` copies a
 * declaration's base type into every row that names it, so it is open until those rows read
 * {@link DeclarationBaseType} instead (lane NIL's audit, B12).
 */
const noBaseType: BaseTypeHandle = "none";

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
 * Split an identifier's lexical form into its pieces where it names something once collapsed: a
 * form of whitespace alone names nothing, and has no row that holds a name (lane NIL's audit, B10).
 *
 * @param lexical - The lexical form, as written.
 * @returns Its pieces, none where it names nothing.
 */
const namedPiecesOf = (lexical: string): Option.Option<Pieces> => {
  const pieces = piecesOf(lexical);

  return pieces.name === "" ? Option.none() : Option.some(pieces);
};

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
 * A declaration as its rows hold it: its identifier as written and in its pieces, the code its
 * `cardinality` spells with its lexical form, and the code its `base-type` spells, none where it
 * writes none, each code spelled as its lexical form (`BaseTypeLexical`, `CardinalityLexical`).
 */
export interface TypedDeclaration {
  readonly baseType: Option.Option<BaseTypeHandle>;
  readonly cardinality: CardinalityHandle;
  readonly cardinalityLexical: string;
  readonly identifier: Pieces;
  readonly identifierLexical: string;
}

/**
 * Read a declaration as its row holds it, where it has one: its `identifier` written and naming
 * something once collapsed, its `cardinality` written and spelling a handle (an enumeration whose
 * whitespace is preserved, so a padded one spells none), and its `base-type` unwritten or spelling
 * one (C17).
 *
 * Every other declaration has no row, and no row anywhere stands for its identifier, type or
 * cardinality: a missing value is a row of its own relation, never a sentinel (lane NIL's audit,
 * B10 and B11). Each such declaration breaks AL3 (a required `identifier` or `cardinality`
 * unwritten) or its attribute's value domain (written and spelling nothing), the one rule it is
 * refused by (the orchestrator's ruling of 2026-11-06), and no law reads a type or a name it does
 * not have. The overlays that read declarations, the bindings', the references' and the tables',
 * read them through this, so they agree on which have rows.
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
    identifier === undefined ||
    cardinality === undefined ||
    !spelledCardinalities.has(cardinality) ||
    (baseType !== undefined && Option.isNone(spelled))
  ) {
    return Option.none();
  }

  return Option.map(namedPiecesOf(identifier), (pieces) => ({
    baseType: spelled,
    cardinality,
    cardinalityLexical: cardinality,
    identifier: pieces,
    identifierLexical: identifier,
  }));
};

/**
 * Read the base type a declaration's row holds, and every row that copies it: the code its
 * `base-type` spells, or {@link noBaseType} where it writes none.
 *
 * @param declared - The declaration.
 * @returns The base type.
 */
export const heldBaseTypeOf = (declared: TypedDeclaration): BaseTypeHandle =>
  Option.getOrElse(declared.baseType, () => noBaseType);

/**
 * The fields a declaration gives every row that copies it, and its kind's `DeclarationKind`: its
 * base type as {@link heldBaseTypeOf} reads it.
 */
export interface DeclaredFields {
  readonly baseType: BaseTypeHandle;
  readonly cardinality: CardinalityHandle;
  readonly declarationKind: DeclarationKindHandle;
  readonly identifier: string;
}

/**
 * Read the fields a declaring element gives every row that copies its declaration
 * (`declarationRef`), as {@link Declaration}'s builder writes them ({@link typedDeclarationOf}):
 * its identifier without its outer whitespace, the codes its `base-type` and `cardinality` spell,
 * and its kind's `DeclarationKind`. Every overlay that resolves against a declaration or copies one
 * reads them here, so the database's `declarationRef` containments hold by construction.
 *
 * An element that declares nothing has none, and so has a declaration with no `Declaration` row,
 * whose identifier or cardinality is unwritten or spells nothing, or whose base type spells
 * nothing: no row copies a declaration that has none (lane NIL's audit, B11).
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
        baseType: heldBaseTypeOf(declared),
        cardinality: declared.cardinality,
        declarationKind,
        identifier: declared.identifier.name,
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
 * Add an outcome declaration's scale rows: each of its `mastery-value`, `normal-minimum` and
 * `normal-maximum` it writes, and each pair of them `Mastery_range` orders where it writes both
 * (spec reading 9: "each pair judged where both are written"). An attribute it does not write has
 * no row, and no pair holds it.
 *
 * @param reading - The document.
 * @param node - The declaration's node.
 */
const addScale = (reading: Reading, node: NodeRow<Composed>): void => {
  const written = (name: string) => Option.fromUndefinedOr(valueOf(reading, node, name));
  const mastery = written("mastery-value");
  const minimum = written("normal-minimum");
  const maximum = written("normal-maximum");
  for (const lexical of Option.toArray(mastery)) {
    reading.rows.MasteryValue.set(node.id, { lexical, node: node.id });
  }

  for (const lexical of Option.toArray(minimum)) {
    reading.rows.NormalMinimum.set(node.id, { lexical, node: node.id });
  }

  for (const lexical of Option.toArray(maximum)) {
    reading.rows.NormalMaximum.set(node.id, { lexical, node: node.id });
  }

  for (const [normalMinimum, masteryValue] of Option.toArray(Option.all([minimum, mastery]))) {
    reading.rows.MasteryFloor.set(node.id, { masteryValue, node: node.id, normalMinimum });
  }

  for (const [masteryValue, normalMaximum] of Option.toArray(Option.all([mastery, maximum]))) {
    reading.rows.MasteryCeiling.set(node.id, { masteryValue, node: node.id, normalMaximum });
  }
};

/**
 * Add a declaration's row, its base type's where it writes one, and an outcome declaration's scale
 * rows ({@link addScale}), where it has a row ({@link typedDeclarationOf}): one whose identifier or
 * cardinality is unwritten or spells nothing has none of them, nor any value set, value or field
 * below it.
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
    baseType: heldBaseTypeOf(declared),
    cardinality: declared.cardinality,
    cardinalityLexical: declared.cardinalityLexical,
    declarationKind,
    identifier: declared.identifier.name,
    identifierLead: declared.identifier.lead,
    identifierLexical: declared.identifierLexical,
    identifierTrail: declared.identifier.trail,
  });
  for (const baseType of Option.toArray(declared.baseType)) {
    reading.rows.DeclarationBaseType.set(node.id, {
      baseType,
      baseTypeLexical: baseType,
      node: node.id,
    });
  }

  if (node.kind === outcomeKind) {
    addScale(reading, node);
  }
};

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
    baseType: declaration.baseType,
    cardinality: declaration.cardinality,
    declarationKind: declaration.declarationKind,
    elementChildren: foldAt(reading.derived.folds, node.id).elementChildren,
    elements: foldAt(reading.derived.folds, node.id).elements,
    identifier: declaration.identifier,
  });
};

/**
 * Add a value's row, its own base type's where it writes one that spells a code, its field's where
 * it writes both a `field-identifier` and a `base-type`, and its field's name where that
 * `field-identifier` names something once collapsed.
 *
 * A value writes either only as a record's field (information model §7.46.1 and §7.46.2: each "is
 * only used for" a value "that forms part of a record"). The rows hold what it writes and nothing
 * else, so `Value_cardinality` refuses a record's value that writes either alone or neither, and
 * any other set's value that writes either, through its count of fields and each attribute's copy
 * into {@link RecordField}. A field whose `field-identifier` is whitespace alone names no field: it
 * has no {@link RecordFieldName}, and its value domain refuses it alone, never `E1_derived` over an
 * empty name.
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
    baseType: set.baseType,
    cardinality: set.cardinality,
    text,
  });

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
 * ({@link typedDeclarationOf}) and per base type it writes, per value set of such a declaration,
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
 * ({@link typedDeclarationOf}): its identifier written, its cardinality unwritten or spelling
 * nothing, or its base type spelling nothing. No reference to such a name is written, in place
 * either: the declaration's own law refuses it alone (lane NIL's audit, B11).
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
    if (identifier !== undefined) {
      const held = typedDeclarationOf({
        baseType: lexical("base-type"),
        cardinality: lexical("cardinality"),
        identifier,
      });
      (Option.isSome(held) ? typed : untyped).add(piecesOf(identifier).name);
    }
  }

  return [...untyped]
    .filter((name) => !typed.has(name))
    .map((name) => ({ document: flat.document.node, name }));
};

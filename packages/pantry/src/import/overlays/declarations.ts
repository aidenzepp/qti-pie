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
import { foldOf, ownContext } from "#pantry/import/fold.ts";
import type { Folded } from "#pantry/import/fold.ts";
import { spelledBaseTypes } from "#pantry/grammar/attributes.ts";
import { recordCardinality, spelledCardinalities } from "#pantry/grammar/compose.ts";
import { DeclarationKind } from "#pantry/grammar/install.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { FlatRows, NodeId, NodeRow, XdmDocument } from "#pantry/model/xdm.ts";
import type {
  Declaration,
  OutcomeRange,
  RecordField,
  Value,
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
   * The document's context (spec reading 117), its own where none is given: an included
   * fragment's nodes take the interaction their includes stand in as their nearest.
   */
  readonly context?: DocumentContext;
  readonly idOf: (index: number) => NodeId;
}

/**
 * A document's O2 overlay rows, one keyed set per relation: each map from its row's node id to the
 * row as its writer writes it.
 */
export interface DeclarationRows {
  readonly Declaration: ReadonlyMap<string, Addition<typeof Declaration>>;
  readonly OutcomeRange: ReadonlyMap<string, Addition<typeof OutcomeRange>>;
  readonly RecordField: ReadonlyMap<string, Addition<typeof RecordField>>;
  readonly Value: ReadonlyMap<string, Addition<typeof Value>>;
  readonly ValueSet: ReadonlyMap<string, Addition<typeof ValueSet>>;
}

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
 * The null object of `BaseType`: a record's base type, and one no lexical form spells.
 */
const noBaseType: BaseTypeHandle = "none";

/**
 * The declaration kinds, each a `NodeKind` handle that is its own `DeclarationKind` handle.
 */
const declarationKinds: ReadonlyMap<string, DeclarationKindHandle> = new Map(
  DeclarationKind.handles.map((handle) => [handle, handle] as const),
);

/**
 * The kinds that hold a declaration's values.
 */
const valueSetKinds: ReadonlySet<string> = new Set(["qti-default-value", "qti-correct-response"]);

/**
 * Whether a text is XML whitespace alone, possibly none: the language of an identifier's pieces.
 *
 * @param text - The text.
 * @returns Whether it is.
 */
const isSpace = (text: string): text is Space => /^[\t\n\r ]*$/u.test(text);

/**
 * Split an identifier's lexical form into its pieces: its outer whitespace and the name between,
 * its collapsed form (XML Schema Part 2, §4.3.6), since a name holds no whitespace.
 *
 * @param lexical - The lexical form, as written.
 * @returns The pieces, which concatenate to it.
 */
export const piecesOf = (lexical: string): Pieces => {
  const {
    lead = "",
    name = "",
    trail = "",
  } = /^(?<lead>[\t\n\r ]*)(?<name>.*?)(?<trail>[\t\n\r ]*)$/su.exec(lexical)?.groups ?? {};

  return { lead: isSpace(lead) ? lead : "", name, trail: isSpace(trail) ? trail : "" };
};

/**
 * Read the code of a `base-type` from its lexical form (C17).
 *
 * @param lexical - The lexical form, none where the attribute is unwritten.
 * @returns The handle it spells; `none` where it is unwritten or spells none, which
 *   `Declaration_base_type` or `E1_derived` refuses.
 */
export const baseTypeOf = (lexical: string | undefined): BaseTypeHandle =>
  lexical === undefined || !spelledBaseTypes.has(lexical) ? noBaseType : lexical;

/**
 * The lexical forms of the three attributes a declaration's row reads, each none where unwritten.
 */
export interface DeclarationLexicals {
  readonly baseType: string | undefined;
  readonly cardinality: string | undefined;
  readonly identifier: string | undefined;
}

/**
 * A declaration as its row holds it: its identifier as written and in its pieces, and the codes its
 * `base-type` and `cardinality` spell, with their lexical forms (`""` for a `base-type` it does not
 * write, whose code is `none`, a record's).
 */
export interface TypedDeclaration {
  readonly baseType: BaseTypeHandle;
  readonly baseTypeLexical: string;
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
export const typedDeclarationOf = (
  lexical: DeclarationLexicals,
): Option.Option<TypedDeclaration> => {
  const identifier = piecesOf(lexical.identifier ?? "");

  return lexical.identifier === undefined ||
    identifier.name === "" ||
    lexical.cardinality === undefined ||
    !spelledCardinalities.has(lexical.cardinality) ||
    (lexical.baseType !== undefined && !spelledBaseTypes.has(lexical.baseType))
    ? Option.none()
    : Option.some({
        baseType: lexical.baseType ?? noBaseType,
        baseTypeLexical: lexical.baseType ?? "",
        cardinality: lexical.cardinality,
        cardinalityLexical: lexical.cardinality,
        identifier,
        identifierLexical: lexical.identifier,
      });
};

/**
 * The fields a declaration gives every row that copies it, and its kind's `DeclarationKind`.
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
        baseType: declared.baseType,
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
const attributesOf = (
  rows: FlatRows<Composed>,
): ReadonlyMap<NodeId, ReadonlyMap<string, string>> => {
  const byNode = new Map<NodeId, Map<string, string>>();

  for (const { lexical, name, node } of rows.attributes) {
    const named = byNode.get(node) ?? new Map<string, string>();
    named.set(name, lexical);
    byNode.set(node, named);
  }

  return byNode;
};

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
 * which holds its nearest interaction (N8) and its element counts, and its children's characters.
 */
interface Derived {
  readonly folds: ReadonlyMap<NodeId, Folded>;
  readonly text: ReadonlyMap<NodeId, string>;
}

/**
 * Compute what the tree gives each node, as `Node`'s laws hold it: its fold, and the string value
 * of its children's characters, concatenated in order.
 *
 * @param rows - A document's flat rows, its nodes in document order, so each parent precedes its
 *   children.
 * @param context - The document's context (spec reading 117), its own where none is given.
 * @returns The derived values, by node id.
 */
const derivedOf = (rows: FlatRows<Composed>, context: DocumentContext | undefined): Derived => {
  const chars = charsOf(rows);
  const text = new Map<NodeId, string>();
  for (const node of rows.nodes.filter(({ id, parent }) => parent !== id)) {
    text.set(node.parent, (text.get(node.parent) ?? "") + (chars.get(node.id) ?? ""));
  }

  return { folds: foldOf(rows.nodes, context ?? ownContext(rows.document.node)), text };
};

/**
 * What every row builder reads of a document: its node rows' derived values, its attributes, and
 * the rows built so far, a parent's before its children's.
 */
interface Reading {
  readonly attributes: ReadonlyMap<NodeId, ReadonlyMap<string, string>>;
  readonly derived: Derived;
  readonly document: NodeId;
  readonly rows: {
    readonly Declaration: Map<string, Addition<typeof Declaration>>;
    readonly OutcomeRange: Map<string, Addition<typeof OutcomeRange>>;
    readonly RecordField: Map<string, Addition<typeof RecordField>>;
    readonly Value: Map<string, Addition<typeof Value>>;
    readonly ValueSet: Map<string, Addition<typeof ValueSet>>;
  };
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
  nearest: reading.derived.folds.get(node.id)?.nearest ?? reading.document,
  node: node.id,
  parent: node.parent,
  start: node.start,
  version: node.version,
});

/**
 * Add a declaration's row, and its outcome range where it writes a scale attribute, where it has a
 * row ({@link typedDeclarationOf}): one whose identifier or cardinality is unwritten or spells
 * nothing has neither, nor any value set, value or field below it.
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
    baseType: declared.baseType,
    baseTypeLexical: declared.baseTypeLexical,
    cardinality: declared.cardinality,
    cardinalityLexical: declared.cardinalityLexical,
    declarationKind,
    identifier: declared.identifier.name,
    identifierLead: declared.identifier.lead,
    identifierLexical: declared.identifierLexical,
    identifierTrail: declared.identifier.trail,
  });

  const scale = {
    masteryValue: valueOf(reading, node, "mastery-value"),
    normalMaximum: valueOf(reading, node, "normal-maximum"),
    normalMinimum: valueOf(reading, node, "normal-minimum"),
  };
  if (
    node.kind === "qti-outcome-declaration" &&
    Object.values(scale).some((lexical) => lexical !== undefined)
  ) {
    reading.rows.OutcomeRange.set(node.id, {
      masteryValue: scale.masteryValue ?? "",
      node: node.id,
      normalMaximum: scale.normalMaximum ?? "",
      normalMinimum: scale.normalMinimum ?? "",
    });
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
    elementChildren: reading.derived.folds.get(node.id)?.elementChildren ?? 0n,
    elements: reading.derived.folds.get(node.id)?.elements ?? 0n,
    identifier: declaration.identifier,
  });
};

/**
 * Add a value's row, and its field's where it is one.
 *
 * A value is a record's field where its set is a record's or it writes a `field-identifier` or a
 * `base-type` of its own, so a field the specification places only in a record is refused by
 * `Value_cardinality` rather than dropped.
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
  const fieldIdentifier = valueOf(reading, node, "field-identifier");
  const fieldBaseType = valueOf(reading, node, "base-type");
  const ownBaseType = baseTypeOf(fieldBaseType);
  reading.rows.Value.set(node.id, {
    ...tupleOf(reading, node),
    baseType: set.baseType === noBaseType ? ownBaseType : set.baseType,
    setBaseType: set.baseType,
    text: reading.derived.text.get(node.id) ?? "",
  });

  if (
    set.cardinality === recordCardinality ||
    fieldIdentifier !== undefined ||
    fieldBaseType !== undefined
  ) {
    const { lead, name, trail } = piecesOf(fieldIdentifier ?? "");
    reading.rows.RecordField.set(node.id, {
      ...tupleOf(reading, node),
      baseType: ownBaseType,
      baseTypeLexical: fieldBaseType ?? "",
      identifier: name,
      identifierLead: lead,
      identifierLexical: fieldIdentifier ?? "",
      identifierTrail: trail,
    });
  }
};

/**
 * Build the O2 overlay rows of a document: a row per declaration that has one
 * ({@link typedDeclarationOf}), per value set of such a declaration, per value of a value set and
 * per record field, and an outcome range per such outcome declaration that writes a scale
 * attribute.
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
      OutcomeRange: new Map(),
      RecordField: new Map(),
      Value: new Map(),
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

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
import type { DocumentContext } from "#pantry/import/context.ts";
import {
  BaseType,
  Cardinality,
  DeclarationKind,
  interactionKinds,
  nonElementKinds,
} from "#pantry/grammar/install.ts";
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
 * The `Cardinality` handle of a record.
 */
const record: CardinalityHandle = "record";

/**
 * The `BaseType` handles a lexical form spells: every one but the null object.
 */
const spelledBaseTypes: ReadonlyMap<string, BaseTypeHandle> = new Map(
  BaseType.handles.flatMap((handle) => (handle === noBaseType ? [] : [[handle, handle] as const])),
);

/**
 * The `Cardinality` handles, each spelled as its lexical form.
 */
const spelledCardinalities: ReadonlyMap<string, CardinalityHandle> = new Map(
  Cardinality.handles.map((handle) => [handle, handle] as const),
);

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
 * The interaction kinds, whose children take them as their nearest interaction (N8).
 */
const interactions: ReadonlySet<string> = new Set(interactionKinds);

/**
 * The kinds that are no element.
 */
const nonElements: ReadonlySet<string> = new Set(nonElementKinds);

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
  lexical === undefined ? noBaseType : (spelledBaseTypes.get(lexical) ?? noBaseType);

/**
 * Read the code of a `cardinality` from its lexical form (C17).
 *
 * @param lexical - The lexical form.
 * @returns The handle it spells; `single` where it spells none, which `E1_derived` refuses, since
 *   `single`'s lexical form is not the one written.
 */
export const cardinalityOf = (lexical: string): CardinalityHandle =>
  spelledCardinalities.get(lexical) ?? "single";

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
 * What a node's rows give the overlays besides its own row: its nearest interaction (N8), its
 * element rank among its siblings, its element children, and its string value.
 */
interface Derived {
  readonly elementChildren: ReadonlyMap<NodeId, bigint>;
  readonly elements: ReadonlyMap<NodeId, bigint>;
  readonly nearest: ReadonlyMap<NodeId, NodeId>;
  readonly text: ReadonlyMap<NodeId, string>;
}

/**
 * Compute what the tree's folds give each node, as `Node`'s laws hold it: the nearest interaction
 * (N8), the element count fold's `elements` and `elementChildren`, and the string value of each
 * node's children's characters, concatenated in order.
 *
 * @param rows - A document's flat rows, its nodes in document order, so each parent precedes its
 *   children.
 * @param rootNearest - The document node's nearest interaction, its context's (spec reading 117);
 *   itself where none is given.
 * @returns The derived values, by node id.
 */
const derivedOf = (rows: FlatRows<Composed>, rootNearest: NodeId | undefined): Derived => {
  const chars = charsOf(rows);
  const kinds = new Map<NodeId, string>();
  const nearest = new Map<NodeId, NodeId>();
  const elements = new Map<NodeId, bigint>();
  const elementChildren = new Map<NodeId, bigint>();
  const text = new Map<NodeId, string>();

  for (const node of rows.nodes) {
    kinds.set(node.id, node.kind);
    if (node.parent === node.id) {
      nearest.set(node.id, rootNearest ?? node.id);
      continue;
    }

    const parentKind = kinds.get(node.parent) ?? "";
    nearest.set(
      node.id,
      interactions.has(parentKind) ? node.parent : (nearest.get(node.parent) ?? node.parent),
    );
    text.set(node.parent, (text.get(node.parent) ?? "") + (chars.get(node.id) ?? ""));
    if (!nonElements.has(node.kind)) {
      const rank = (elementChildren.get(node.parent) ?? 0n) + 1n;
      elementChildren.set(node.parent, rank);
      elements.set(node.id, rank);
    }
  }

  return { elementChildren, elements, nearest, text };
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
  nearest: reading.derived.nearest.get(node.id) ?? reading.document,
  node: node.id,
  parent: node.parent,
  start: node.start,
  version: node.version,
});

/**
 * Add a declaration's row, and its outcome range where it writes a scale attribute.
 *
 * A required attribute that is absent leaves its field empty, and AL3 refuses the element.
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
  const identifierLexical = valueOf(reading, node, "identifier") ?? "";
  const { lead, name, trail } = piecesOf(identifierLexical);
  const baseTypeLexical = valueOf(reading, node, "base-type");
  const cardinalityLexical = valueOf(reading, node, "cardinality") ?? "";
  reading.rows.Declaration.set(node.id, {
    ...tupleOf(reading, node),
    baseType: baseTypeOf(baseTypeLexical),
    baseTypeLexical: baseTypeLexical ?? "",
    cardinality: cardinalityOf(cardinalityLexical),
    cardinalityLexical,
    declarationKind,
    identifier: name,
    identifierLead: lead,
    identifierLexical,
    identifierTrail: trail,
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
    elementChildren: reading.derived.elementChildren.get(node.id) ?? 0n,
    elements: reading.derived.elements.get(node.id) ?? 0n,
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

  if (set.cardinality === record || fieldIdentifier !== undefined || fieldBaseType !== undefined) {
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
 * Build the O2 overlay rows of a document: a row per declaration, per value set of a declaration,
 * per value of a value set and per record field, and an outcome range per outcome declaration that
 * writes a scale attribute.
 *
 * @param doc - The document's tree, as shred gives it.
 * @param ids - The ids its rows are written under.
 * @returns Every overlay's rows.
 */
export const rowsOf = (doc: XdmDocument<Composed>, ids: DocumentIds): DeclarationRows => {
  const flat = flatten(doc, ids.idOf);
  const reading: Reading = {
    attributes: attributesOf(flat),
    derived: derivedOf(flat, ids.context?.nearest),
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

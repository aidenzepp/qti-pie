/**
 * The rows one package is written as, the facts the author login's `importWrite` ChangeSet applies
 * (`#pantry/qti/logins.ts`; plan W5, Q5.15; the W5 amendment's A, C5, C13, C19 and C21;
 * rows-first.md §1 and §2).
 *
 * A package is written once, as one ChangeSet step over the author role that inserts every owner
 * with its whole family: no relation is `mutable`, so no apply needs a read flight, and nothing is
 * ever put or deleted. Every input is a keyed set, a `ReadonlyMap` from the text of a row's key to
 * the row as its writer writes it (`Addition<R>`), and only sequences nest:
 *
 * - Each document is one `Node` root ({@link rootInsertOf}), its tree nested at `children` in
 *   document order, each element's attributes at `attributes` and namespace declarations at
 *   `namespaces`, each attribute's open name, IDREF tokens and entity references under it;
 * - The package is one `Package` row, its record nested at `entries` in listing order;
 * - Every other relation is flat: the document layer's rows ({@link documentRowsOf}) and each overlay
 *   builder's (`#pantry/import/overlays/index.ts`).
 *
 * No row carries a field grizzle draws or fills, or PostgreSQL generates: each is `Addition<R>`,
 * which omits them, nested at a sequence's count field only. The host writes the fields the
 * amendment's §C gives it, each proved by a law: a node's `state` from `placedStep` (C5, N5), its
 * `ancestry` (`E1_derived`), its nearest interaction (N8), its `chars`, `first` and `last` (E1);
 * an attribute's `slot` (AL2's step) and its IDREF tokens with the whitespace around each, whose
 * generated pieces concatenate to its lexical form.
 *
 * Each document is flattened once, a fresh id drawn for each node and attribute, and folded once
 * under the context it is judged in ({@link nodeIdsOf}, `DocumentView` of
 * `#pantry/import/fold.ts`), so the tree and every overlay builder read one view and name each node
 * by one id.
 */
import { Bits } from "@bjornpagen/grizzle";
import type { Addition, InsertAllRowsOf, Uuid } from "@bjornpagen/grizzle";
import { Option, Struct } from "effect";
import {
  attributeRows,
  AttributeSlot,
  Flag,
  KindNamespace,
  openElementClasses,
  Position,
  ValueIdentity,
} from "#pantry/grammar/install.ts";
import { openClasses } from "#pantry/grammar/kinds.ts";
import { contextsOf } from "#pantry/import/context.ts";
import { foldAt, governorOf, viewOf } from "#pantry/import/fold.ts";
import type { DocumentView, Folded } from "#pantry/import/fold.ts";
import type { ListedTarget } from "#pantry/import/context.ts";
import { tokensOf } from "#pantry/import/pieces.ts";
import type { documentLayer } from "#pantry/import/roster.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { endsOf } from "#pantry/model/folds.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type {
  AttributeRow,
  FlatRows,
  NodeId,
  NodeRow,
  OpenNameRow,
  XdmDocument,
} from "#pantry/model/xdm.ts";
import type {
  Attribute,
  AttributeEntity,
  Idref,
  OpenAttributeName,
} from "#pantry/qti/attributes.ts";
import type { Document, Namespace } from "#pantry/qti/chardata.ts";
import type { Node } from "#pantry/qti/node.ts";
import type { Qti } from "#pantry/qti/schema.ts";

/**
 * Where one document stands in its package, beside its view: every overlay builder's `ids` argument
 * (§C), each reading the part it needs.
 */
export interface NodeIds {
  /**
   * Whether the document is in an assembly (`Document.assembled`): a test or a section, or a
   * document that holds a site or that a site names (`#pantry/import/context.ts`).
   */
  readonly assembled: boolean;
  /**
   * The documents of the package by their paths, which a site's href names (Q5.13's builder).
   *
   * @param path - A document's path in the package.
   * @returns The id of the document node there, none when the package holds no document at the
   *   path.
   */
  readonly documentAt: (path: string) => Option.Option<NodeId>;
  /**
   * Whether the package holds an entry at a path, which a site's href names (`SitePath.entry`).
   *
   * @param path - A path in the package.
   * @returns Whether an entry is there.
   */
  readonly entryAt: (path: string) => boolean;
  /**
   * The document's type: `manifest` for the manifest, which is no resource's document (spec
   * readings 146 and 176), else the type of the resource that lists it. Every node of the document
   * copies it (`Node.documentType`), so a law can tell the manifest's elements from another
   * document's.
   */
  readonly documentType: ListedDocument["documentType"];
  /**
   * The package's id.
   */
  readonly package: Uuid;
  /**
   * The document's path in the package, its entry's.
   */
  readonly path: string;
  /**
   * The document a site's href names, with its root's kind and its context, as the site's row
   * copies them.
   *
   * @param path - A document's path in the package.
   * @returns The document a resource names there, none when no resource names one at the path,
   *   the manifest's included (spec readings 115 and 146).
   */
  readonly targetAt: (path: string) => Option.Option<ListedTarget>;
  /**
   * Whether a site of the package names the document, so it is an instance of every assembly
   * that places it (Q5.13's `Instance`, spec reading 117).
   */
  readonly targeted: boolean;
}

/**
 * A document as the importer lists it, one per path: its path, its tree as shred gives it, and its
 * type: `manifest` for the manifest, which is no resource's document (spec readings 146 and 176),
 * else the type of the resource that names it.
 */
export interface ListedDocument {
  readonly documentType: Addition<typeof Document>["documentType"];
  readonly path: string;
  readonly tree: XdmDocument<Composed>;
}

/**
 * One listed document as its rows are built: as listed, where it stands in its package, and its
 * view, its rows under the ids they are written under and their folds under the context it is
 * judged in (spec reading 117, `#pantry/import/context.ts`): its own, or, for a document sites
 * name, the union of their ancestries and the interaction they stand in.
 */
export interface PlacedDocument {
  readonly ids: NodeIds;
  readonly listed: ListedDocument;
  readonly view: DocumentView;
}

/**
 * The ids of one package: its own, and each listed document under its ids, in the listing's order.
 */
export interface PackageIds {
  readonly documents: readonly PlacedDocument[];
  readonly package: Uuid;
}

/**
 * Mint the ids of one package and view each of its documents: one fresh uuid for the package, then
 * each document flattened once, `flatten` drawing a fresh uuid for each XDM node and each attribute
 * as it numbers them, judged in its context (`contextsOf` of `#pantry/import/context.ts`) and
 * folded once under it. An import mints them each time it runs, so the same package imported twice
 * is two packages, every id fresh.
 *
 * A document's `documentAt` reads every listed document's document node, one per path, since the
 * import reads each path once, the manifest's as the manifest (`#pantry/import/program.ts`). Its
 * `targetAt` reads only the documents a resource names: a site never names the manifest, which is
 * no resource's document (spec readings 115 and 146), so an href that resolves to it names no
 * target, and "Include target" refuses an include of it.
 *
 * @param documents - The package's documents, in the listing's order.
 * @param entries - The paths of the package's entries.
 * @param mint - Draws a fresh uuid. Defaults to `crypto.randomUUID`.
 * @returns The package's id and each document placed and viewed, in the order given.
 */
export const nodeIdsOf = (
  documents: readonly ListedDocument[],
  entries: Iterable<string>,
  mint: () => NodeId = () => crypto.randomUUID(),
): PackageIds => {
  const entryPaths: ReadonlySet<string> = new Set(entries);
  const entryAt = (path: string): boolean => entryPaths.has(path);
  const packageId = mint();
  const listed = documents.map((document) => ({
    document,
    named: document.documentType !== "manifest",
    path: document.path,
    rows: flatten(document.tree, mint),
    tree: document.tree,
  }));
  const placed = new Map<string, NodeId>();
  for (const { path, rows } of listed) {
    if (!placed.has(path)) {
      placed.set(path, rows.document.node);
    }
  }

  const documentAt = (path: string): Option.Option<NodeId> =>
    Option.fromUndefinedOr(placed.get(path));
  const judged = contextsOf(listed);
  const targets = new Map<string, ListedTarget>();
  for (const { context, listed: target } of judged) {
    if (target.named && !targets.has(target.path)) {
      targets.set(target.path, {
        context,
        node: target.rows.document.node,
        rootKind: target.tree.root.kind,
      });
    }
  }

  const targetAt = (path: string): Option.Option<ListedTarget> =>
    Option.fromUndefinedOr(targets.get(path));

  return {
    documents: judged.map(({ assembled, context, listed: { document, rows }, targeted }) => ({
      ids: {
        assembled,
        documentAt,
        documentType: document.documentType,
        entryAt,
        package: packageId,
        path: document.path,
        targetAt,
        targeted,
      },
      listed: document,
      view: viewOf(document.tree, rows, context),
    })),
    package: packageId,
  };
};

/**
 * An entity reference inside an attribute's lexical form, as its attribute's family nests it:
 * without the `node` and `attribute` the nesting supplies, nor the `at` the family draws.
 */
export type EntityInsert = Omit<Addition<typeof AttributeEntity>, "attribute" | "node">;

/**
 * One IDREF token with the whitespace written around it, as its attribute's family nests it.
 */
export type IdrefInsert = Omit<Addition<typeof Idref>, "attribute" | "node">;

/**
 * An open-class attribute's exact name, as its attribute's family nests it.
 */
export type OpenNameInsert = Omit<Addition<typeof OpenAttributeName>, "attribute" | "node">;

/**
 * An attribute as its element's family nests it: its written fields but the `node` the nesting
 * supplies, and its three families at their count fields.
 */
export type AttributeInsert = Omit<Addition<typeof Attribute>, "node"> & {
  readonly entities: readonly EntityInsert[];
  readonly idrefs: readonly IdrefInsert[];
  readonly openName: readonly OpenNameInsert[];
};

/**
 * A namespace declaration as its element's family nests it.
 */
export type NamespaceInsert = Omit<Addition<typeof Namespace>, "node">;

/**
 * The fields the host writes on every node, as a member of its parent's family nests it: every
 * written field but the tree's `parent`, which the nesting supplies, and the root field `document`,
 * which only the root names (C13).
 */
export type NodeFields = Omit<Addition<typeof Node>, "document" | "parent">;

/**
 * A node below the document node as its parent's family nests it, with its own families nested.
 */
export type NodeMember = NodeFields & {
  readonly attributes: readonly AttributeInsert[];
  readonly children: readonly NodeMember[];
  readonly namespaces: readonly NamespaceInsert[];
};

/**
 * A document's tree as the one `Node` insert writes it: the document node, which names the root
 * field `document` as its own id, with every node below it nested.
 */
export type NodeRoot = NodeMember & { readonly document: Addition<typeof Node>["document"] };

/**
 * The document layer's flat rows of one or more documents, each a keyed set by its node's id: the
 * `Document` row of each document node, each comment's, instruction's and doctype's row, each
 * foreign element's expanded name, and each element's named governing type, one keyed set per
 * relation of `documentLayer`
 * (`#pantry/import/roster.ts`). A text, whitespace or entity reference node keeps its characters on
 * its `Node` row (`chars`).
 */
export type DocumentLayerRows = {
  readonly [Name in keyof typeof documentLayer]: ReadonlyMap<
    string,
    Addition<(typeof Qti)["relations"][Name]>
  >;
};

/**
 * Every input of one package's ChangeSet, a keyed set of each relation `insertAll` takes over `Qti`
 * (`writtenNames` of `#pantry/import/roster.ts`), its rows typed as grizzle's `InsertAllRowsOf`
 * types that insert's: the `Package` row with its record nested and each document's `Node` root
 * with its tree nested, both keyed by their id, the document layer's flat rows
 * ({@link DocumentLayerRows}), and every overlay's (`OverlayRows`). `readProgram` builds it from
 * those, so each builder's row types are held to grizzle's here.
 */
export type PackageInputs = {
  readonly [Name in keyof InsertAllRowsOf<typeof Qti>]: ReadonlyMap<
    string,
    InsertAllRowsOf<typeof Qti>[Name][number]
  >;
};

/**
 * A `Position` handle, a node's content-automaton state.
 */
type PositionHandle = Addition<typeof Node>["state"];

/**
 * A key of the installed closed relations' row maps: its fields' values, space separated.
 *
 * @param values - The key's values, in the relation's key order.
 * @returns The text.
 */
const keyOf = (...values: readonly string[]): string => values.join(" ");

/**
 * The domains whose values are `xs:IDREF` tokens: those the installed `ValueIdentity` gives an
 * `IDREF` or `IDREFS` identity. A domain of no identity has no row there.
 */
const idrefDomains: ReadonlySet<string> = new Set(
  ValueIdentity.rows.flatMap(({ domain, identity }) =>
    identity === "IDREF" || identity === "IDREFS" ? [domain] : [],
  ),
);

/**
 * The installed `KindNamespace`, by kind: the namespace name an element of the kind is written in,
 * for every element kind but the foreign ones, whose name their `OpenElementName` row holds.
 */
const namespaceAt: ReadonlyMap<string, string> = new Map(
  KindNamespace.rows.map(({ kind, namespace }) => [kind, namespace]),
);

/**
 * The foreign element kinds, whose namespace their `OpenElementName` row holds.
 */
const foreignKinds: ReadonlySet<string> = new Set(openElementClasses);

/**
 * The open attribute classes, each of whose attributes has its exact name nested under it (AL4).
 */
const openNames: ReadonlySet<string> = new Set(openClasses);

/**
 * The `Position` handles, by their code's number.
 */
const positionOf: ReadonlyMap<number, PositionHandle> = new Map(
  Position.handles.map((handle) => [Number(handle), handle]),
);

/**
 * Name a state's `Position` handle.
 *
 * @param state - The state, a position of the grammar's automata.
 * @returns Its handle.
 * @throws {Error} When the `Position` roster holds no such code, a defect of the grammar, whose
 *   automata name only its positions.
 */
const positionHandle = (state: number): PositionHandle => {
  const handle = positionOf.get(state);
  if (handle === undefined) {
    throw new Error(
      `The content grammar steps to state ${String(state)}, which the Position roster does not hold. Regenerate the grammar's positions.`,
    );
  }

  return handle;
};

/**
 * What the host writes of an attribute its governor admits, read once from the attribute grammar
 * (`AttributeGrammar`) and its domain's rows: its slot's position, whether its domain is an
 * `xs:IDREF` or `xs:IDREFS` (`ValueIdentity`), so it holds its IDREF pieces.
 */
interface AdmittedAttribute {
  readonly idrefs: boolean;
  readonly position: (typeof attributeRows)[number]["position"];
}

/**
 * The attribute grammar, by `version governor name`, each row as the host writes it.
 */
const attributeGrammarAt: ReadonlyMap<string, AdmittedAttribute> = new Map(
  attributeRows.map(
    ({ domain, governor, name, position, version }) =>
      [
        keyOf(version, governor, name),
        {
          idrefs: idrefDomains.has(domain),
          position,
        },
      ] as const,
  ),
);

/**
 * The namespace name of the one node in no namespace that is a parent, the document node, as
 * `ForeignNamespace` writes none (`#pantry/qti/chardata.ts`): the empty text, which is no namespace
 * name (Namespaces in XML 1.0, §2.2: "The empty string, though it is a legal URI reference, cannot
 * be used as a namespace name").
 */
const noNamespace = "";

/**
 * Read the record a row of `flatten`'s names as its owner.
 *
 * @param records - The records, by their owner's id.
 * @param owner - The id the row names.
 * @param what - What the row is, for the defect's message.
 * @returns The owner's record.
 * @throws {Error} When no record has the id: `flatten` writes a row only of a node or an attribute
 *   it writes, so a miss is its defect, never the document's.
 */
const ownerIn = <V>(records: ReadonlyMap<string, V>, owner: string, what: string): V => {
  const record = records.get(owner);
  if (record === undefined) {
    throw new Error(
      `flatten names ${owner} as the owner of ${what}, and writes no node or attribute ${owner}. Correct flatten.`,
    );
  }

  return record;
};

/**
 * Read an element's namespace name: a foreign element's from its `OpenElementName` row, any other
 * element's from `KindNamespace`, which holds every element kind but the foreign ones.
 *
 * @param kind - The element's kind.
 * @param foreign - Its `OpenElementName` row's namespace name, where it has the row.
 * @returns The namespace name.
 * @throws {Error} When the element has neither: `flatten` writes an `OpenElementName` row of every
 *   foreign element, so a miss is a defect of `flatten` or of the grammar's `KindNamespace`.
 */
const elementNamespaceOf = (kind: string, foreign: Option.Option<string>): string =>
  Option.getOrThrowWith(
    foreignKinds.has(kind) ? foreign : Option.fromUndefinedOr(namespaceAt.get(kind)),
    () =>
      new Error(
        `An element of kind ${kind} has no namespace name, and flatten writes an OpenElementName row of every foreign element while KindNamespace holds every other element kind. Correct flatten or the grammar's KindNamespace.`,
      ),
  );

/**
 * An attribute as the walk gathers it: its row, and its entity references and open names, each in
 * the order `flatten` writes them.
 */
interface GatheredAttribute {
  readonly entities: FlatRows<Composed>["attributeEntities"][number][];
  readonly openNames: OpenNameRow[];
  readonly row: AttributeRow<Composed>;
}

/**
 * A node below the document node as the walk gathers it: its row; its attributes and namespace
 * declarations, in slot order; its characters, `chars`, a text or whitespace node's own and an
 * entity reference's `&name;`, empty for a node that holds none; and its namespace name where it is
 * a foreign element.
 */
interface Gathered {
  readonly attributes: GatheredAttribute[];
  chars: string;
  foreignNamespace: Option.Option<string>;
  readonly namespaces: FlatRows<Composed>["namespaces"][number][];
  readonly node: NodeRow<Composed>;
}

/**
 * Gather each node below the document node with its own rows: every row `flatten` writes of a node
 * or an attribute is put on its owner's record, so the walk reads each record whole.
 *
 * @param rows - The document's rows, as `flatten` writes them.
 * @returns Each node below the document node, in document order.
 * @throws {Error} When a row names an owner `flatten` wrote no row of ({@link ownerIn}).
 */
const gatheredOf = (rows: FlatRows<Composed>): Iterable<Gathered> => {
  const self = rows.document.node;
  const nodes = new Map<string, Gathered>(
    rows.nodes.flatMap((node) =>
      node.id === self
        ? []
        : [
            [
              node.id,
              {
                attributes: [],
                chars: "",
                foreignNamespace: Option.none(),
                namespaces: [],
                node,
              },
            ] as const,
          ],
    ),
  );
  const attributes = new Map<string, GatheredAttribute>();
  for (const row of rows.attributes) {
    const attribute: GatheredAttribute = { entities: [], openNames: [], row };
    ownerIn(nodes, row.node, `attribute ${row.id}`).attributes.push(attribute);
    attributes.set(row.id, attribute);
  }

  for (const entity of rows.attributeEntities) {
    ownerIn(attributes, entity.attribute, "an entity reference").entities.push(entity);
  }

  for (const name of rows.openNames) {
    ownerIn(attributes, name.attribute, "an open name").openNames.push(name);
  }

  for (const declaration of rows.namespaces) {
    ownerIn(nodes, declaration.node, "a namespace declaration").namespaces.push(declaration);
  }

  for (const { node, value } of [...rows.texts, ...rows.whitespace]) {
    ownerIn(nodes, node, "characters").chars = value;
  }

  for (const { name, node } of rows.entityRefs) {
    ownerIn(nodes, node, "an entity reference node").chars = `&${name};`;
  }

  for (const { namespace, node } of rows.openElementNames) {
    ownerIn(nodes, node, "an open element name").foreignNamespace = Option.some(namespace);
  }

  return nodes.values();
};

/**
 * Write one attribute as its element's family nests it.
 *
 * @param attribute - The attribute, gathered.
 * @param element - Its element, gathered: its version, kind, governing type and namespace name.
 * @returns The attribute: its slot under its element's governor (empty for a name the governor
 *   does not admit, which AL1 refuses), its IDREF pieces where its domain is an `xs:IDREF` or
 *   `xs:IDREFS`, its entity references and its open name. A bounded value has no row: the
 *   database reads it from the lexical form (`Double_bound`, `#pantry/qti/attributes.ts`).
 */
const attributeOf = (attribute: GatheredAttribute, element: Gathered): AttributeInsert => {
  const { row } = attribute;
  const { governs, kind, version } = element.node;
  const admitted = Option.fromUndefinedOr(
    attributeGrammarAt.get(keyOf(version, governorOf(version, kind, governs), row.name)),
  );

  return {
    entities: attribute.entities.map(({ name, offset }) => ({ name, offset })),
    id: row.id,
    idrefs: Option.exists(admitted, ({ idrefs }) => idrefs) ? tokensOf(row.lexical) : [],
    lexical: row.lexical,
    name: row.name,
    openName: openNames.has(row.name)
      ? attribute.openNames.map(({ local, uri }) => ({
          elementNamespace: elementNamespaceOf(kind, element.foreignNamespace),
          local,
          uri,
        }))
      : [],
    prefix: row.prefix,
    slot: Bits.of(
      AttributeSlot,
      Option.toArray(admitted.pipe(Option.map(({ position }) => position))),
    ),
  };
};

/**
 * A member as the walk writes it: its insert, and the list its children are nested in.
 */
interface WrittenMember {
  readonly children: NodeMember[];
  readonly member: NodeMember;
}

/**
 * Write one node below the document node from its gathered rows and its fold.
 *
 * @param gathered - The node, gathered with its own rows.
 * @param folded - Its fold (`foldOf`): its ancestry, its nearest interaction and its state.
 * @param documentType - Its document's type.
 * @returns The member, with the list its children are nested in.
 */
const memberOf = (
  gathered: Gathered,
  folded: Folded,
  documentType: ListedDocument["documentType"],
): WrittenMember => {
  const { node } = gathered;
  const { kind, version } = node;
  const ends = endsOf(gathered.chars);
  const children: NodeMember[] = [];
  const governor = governorOf(version, kind, node.governs);

  return {
    children,
    member: {
      ancestry: Bits.of(Flag, [...folded.ancestry]),
      attributes: gathered.attributes.map((attribute) => attributeOf(attribute, gathered)),
      chars: gathered.chars,
      children,
      documentType,
      first: ends.first,
      governor,
      id: node.id,
      kind,
      last: ends.last,
      namespaces: gathered.namespaces.map(({ prefix, uri }) => ({ prefix, uri })),
      nearest: folded.nearest,
      nearestKind: folded.nearestKind,
      prefix: node.prefix,
      state: positionHandle(folded.state),
      version,
    },
  };
};

/**
 * Write a document's tree as the one `Node` insert writes it (C13): the document node with every
 * node below it nested at `children` in document order, each with its attributes (their open
 * names, IDREF pieces and entity references nested) and its namespace declarations.
 *
 * No row names `parent`, only the root names `document`, and no row carries a drawn, accumulated
 * or generated field. The host's fields are the ones the laws prove:
 *
 * - `state`, `ancestry`, `nearest` and `nearestKind`, from the document's fold (`foldOf` of
 *   `#pantry/import/fold.ts`, under the document's context: C5, E1, N8 and spec reading 117); the
 *   document node's are its context's, its state 0;
 * - `chars`, a text or whitespace node's characters and an entity reference's `&name;`, empty
 *   elsewhere, `first` and `last`, the first and last code points of `chars` (`endsOf`);
 * - `governor`, what its attributes and text are read under (`governorOf`, its kind's own for a node
 *   no named type governs), and `prefix`, an element's own, empty for any other node;
 * - `documentType`, the document's type (`NodeIds.documentType`), every node's alike, which its
 *   `Document` row and the tree's owner axis prove.
 *
 * The walk reads the gathered nodes in document order, each nested in its parent's list, so a
 * tree of any depth is written without recursion.
 *
 * @param view - The document's view: its rows, and their folds under the context it is judged in
 *   (`ownContext` of its document node for a document no site names).
 * @param ids - Its type.
 * @returns The document node, with its tree nested.
 */
export const rootInsertOf = (view: DocumentView, ids: Pick<NodeIds, "documentType">): NodeRoot => {
  const { documentType } = ids;
  const { context, folds, rows } = view;
  const { version } = view.tree;
  const self = rows.document.node;
  const rootChildren: NodeMember[] = [];
  const root: NodeRoot = {
    ancestry: Bits.of(Flag, [...context.ancestry]),
    attributes: [],
    chars: "",
    children: rootChildren,
    document: self,
    documentType,
    first: "",
    governor: "document",
    id: self,
    kind: "document",
    last: "",
    namespaces: [],
    nearest: context.nearest,
    nearestKind: context.nearestKind,
    prefix: "",
    state: "0",
    version,
  };
  const children = new Map<NodeId, NodeMember[]>([[self, rootChildren]]);

  for (const gathered of gatheredOf(rows)) {
    const { node } = gathered;
    const siblings = children.get(node.parent);
    if (siblings === undefined) {
      throw new Error(
        `flatten wrote node ${node.id} before its parent ${node.parent}, and it writes nodes in document order. Correct flatten.`,
      );
    }

    const written = memberOf(gathered, foldAt(folds, node.id), documentType);
    siblings.push(written.member);
    children.set(node.id, written.children);
  }

  return root;
};

/**
 * Write a document's flat rows of the document layer: its `Document` row, its XML declaration's
 * `XmlDecl`, `EncodingDecl` and `SdDecl` rows where it writes each, each comment's, instruction's
 * and doctype's row, each foreign element's `OpenElementName` row with its node's tuple (C18) and
 * its parent's kind and namespace name, the document node's none, and the named governing type of
 * each element a named type governs: a vocabulary element's `ElementType`, and a foreign element's
 * `OpenElementType` with its parent's namespace name, each with its node's governor
 * (`governorOf`); and, for a document a resource lists, its `ResourceDocument`, the type of that
 * resource, which the manifest has none of (spec reading 176).
 *
 * @param document - The document, placed and viewed: its type and path as the importer lists it,
 *   whether it is in an assembly and its package, and its view, folded under the context it is
 *   judged in (`ownContext` of its document node for a document no site names).
 * @param document.ids - Whether it is in an assembly, and its package.
 * @param document.listed - Its type and path.
 * @param document.view - Its view.
 * @returns Its rows, each keyed by its node's id.
 * @throws {Error} When `flatten` writes an `OpenElementName` row of a node, or a node of a parent,
 *   that it wrote no row of ({@link ownerIn}).
 */
export const documentRowsOf = (document: {
  readonly ids: Pick<NodeIds, "assembled" | "package">;
  readonly listed: Pick<ListedDocument, "documentType" | "path">;
  readonly view: DocumentView;
}): DocumentLayerRows => {
  const { ids, listed, view } = document;
  const { context, folds, rows } = view;
  const self = rows.document.node;
  const byId = new Map(rows.nodes.map((node) => [node.id, node] as const));
  const foreignNamespace = new Map(
    rows.openElementNames.map(({ namespace, node }) => [node, namespace] as const),
  );
  const namespaceOf = (parent: NodeRow<Composed>): string =>
    parent.id === self
      ? noNamespace
      : elementNamespaceOf(parent.kind, Option.fromUndefinedOr(foreignNamespace.get(parent.id)));
  const typed = rows.nodes.flatMap((row) =>
    Option.toArray(
      row.governs.pipe(
        Option.map((type) => ({
          fields: {
            document: self,
            governor: governorOf(row.version, row.kind, row.governs),
            kind: row.kind,
            node: row.id,
            type,
            version: row.version,
          },
          row,
        })),
      ),
    ),
  );

  return {
    Comment: new Map(rows.comments.map(({ node, value }) => [node, { node, value }] as const)),
    Doctype: new Map(rows.doctypes.map(({ node, value }) => [node, { node, value }] as const)),
    Document: new Map([
      [
        self,
        {
          ...rows.document,
          assembled: ids.assembled,
          contextNearest: context.nearest,
          contextNearestKind: context.nearestKind,
          documentType: listed.documentType,
          nodeChildren: BigInt(
            rows.nodes.filter((node) => node.parent === self && node.id !== self).length,
          ),
          package: ids.package,
          path: listed.path,
          rootKind: view.tree.root.kind,
          version: view.tree.version,
        },
      ],
    ]),
    ElementType: new Map(
      typed.flatMap(({ fields, row }) =>
        foreignKinds.has(row.kind) ? [] : [[row.id, fields] as const],
      ),
    ),
    EncodingDecl: new Map(rows.encodingDecls.map((row) => [row.node, row] as const)),
    OpenElementName: new Map(
      rows.openElementNames.map(({ local, namespace, node }) => {
        const row = ownerIn(byId, node, "an open element name");
        const parent = ownerIn(byId, row.parent, `node ${node}, its child`);

        return [
          node,
          {
            document: self,
            kind: row.kind,
            local,
            namespace,
            nearest: foldAt(folds, node).nearest,
            node,
            parent: parent.id,
            parentKind: parent.kind,
            parentNamespace: namespaceOf(parent),
            start: row.start,
            version: row.version,
          },
        ] as const;
      }),
    ),
    OpenElementType: new Map(
      typed.flatMap(({ fields, row }) =>
        foreignKinds.has(row.kind)
          ? [
              [
                row.id,
                {
                  ...fields,
                  parentNamespace: namespaceOf(
                    ownerIn(byId, row.parent, `node ${row.id}, its child`),
                  ),
                },
              ] as const,
            ]
          : [],
      ),
    ),
    Pi: new Map(rows.pis.map(({ data, node, target }) => [node, { data, node, target }] as const)),
    ResourceDocument: new Map(
      listed.documentType === "manifest"
        ? []
        : [
            [
              self,
              {
                node: self,
                package: ids.package,
                path: listed.path,
                rootKind: view.tree.root.kind,
                type: listed.documentType,
              },
            ],
          ],
    ),
    SdDecl: new Map(rows.sdDecls.map((row) => [row.node, row] as const)),
    XmlDecl: new Map(rows.xmlDecls.map((row) => [row.node, row] as const)),
  };
};

/**
 * The rows of a keyed set, in the order it holds them, as a ChangeSet's insert takes a relation's
 * facts: a type-level function, so `Struct.map` gives each relation its own row type.
 */
interface RowsOfSet extends Struct.Lambda {
  <Row>(set: ReadonlyMap<string, Row>): readonly Row[];
  readonly "~lambda.out": this["~lambda.in"] extends ReadonlyMap<string, infer Row>
    ? readonly Row[]
    : never;
}

/**
 * Read a keyed set's rows ({@link RowsOfSet}).
 */
const rowsOfSet = Struct.lambda<RowsOfSet>((set) => [...set.values()]);

/**
 * Read one package's facts, the rows of each relation of its inputs as `insertAll` takes them: each
 * keyed set's rows, in the order the set holds them. They are what the author login's `importWrite`
 * member applies (`db.workload.importWrite.apply(facts, {})`), which grizzle checks as each
 * relation's insert checks its rows. The rows are a set: no order of them changes what the write
 * holds or which law refuses it.
 *
 * @param inputs - The package's inputs.
 * @returns The facts, one array of rows per relation.
 */
export const packageFactsOf = (inputs: PackageInputs) => Struct.map(rowsOfSet)(inputs);

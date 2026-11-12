/**
 * The rows one package is written as, the facts the author login's `importWrite` ChangeSet applies
 * (`#pantry/qti/logins.ts`; plan W5, Q5.15; the W5 amendment's A, C5, C13, C19 and C21;
 * rows-first.md §1 and §2).
 *
 * A package is written once, as one ChangeSet step over the author role that inserts every owner
 * with its whole sequence: no relation is `mutable`, so no apply needs a read flight, and nothing
 * is ever put. Every input is a keyed set, a `ReadonlyMap` from the text of a row's key to the row
 * as its writer writes it, and only sequences nest:
 *
 * - Each document is one `Node` root ({@link rootInsertOf}), its tree nested at `children` in
 *   document order;
 * - Every other relation is flat: the package's `Package` row and its entries, the document layer's
 *   rows ({@link documentRowsOf}), each element's closed and open attributes, their entity
 *   references and its namespace declarations, each a counted member keyed by its element, each
 *   closed attribute's IDREF tokens nested under it, and each overlay builder's
 *   (`#pantry/import/overlays/index.ts`).
 *
 * Every key is QTI's own: the package's manifest identifier, a document's path, an element's
 * position in its document, and the identity fields a row adds. Nothing is minted, so the same
 * package read twice is the same rows, and writing it again changes nothing.
 *
 * No row carries a field grizzle draws or fills, or PostgreSQL generates: each is grizzle's insert
 * row type, which omits them. The host writes the fields the amendment's §C gives it, each proved
 * by a law: a node's `state` from `placedStep` (C5, N5), its `ancestry` (`E1_derived`), its nearest
 * interaction (N8), its `chars`, `first` and `last` (E1); an attribute's `slot` (AL2's step) and
 * its IDREF tokens with the whitespace around each, whose generated pieces concatenate to its
 * lexical form.
 *
 * Each document is flattened once, each node named by its position, and folded once under the
 * context it is judged in ({@link nodeIdsOf}, `DocumentView` of `#pantry/import/fold.ts`), so the
 * tree and every overlay builder read one view and name each node by one position.
 */
import { Bits } from "@bjornpagen/grizzle";
import type { Addition, InsertAllRowsOf } from "@bjornpagen/grizzle";
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
import { contextsOf } from "#pantry/import/context.ts";
import { foldAt, governorOf, viewOf } from "#pantry/import/fold.ts";
import type { DocumentView, Folded } from "#pantry/import/fold.ts";
import type { ListedTarget } from "#pantry/import/context.ts";
import { keyTextOf } from "#pantry/import/key-text.ts";
import { tokensOf } from "#pantry/import/pieces.ts";
import type { documentLayer } from "#pantry/import/roster.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { endsOf } from "#pantry/model/folds.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { FlatRows, NodeRow, XdmDocument } from "#pantry/model/xdm.ts";
import type { Document } from "#pantry/qti/chardata.ts";
import type { Node } from "#pantry/qti/node.ts";
import type { Package } from "#pantry/qti/package.ts";
import type { Qti } from "#pantry/qti/schema.ts";

/**
 * A package's manifest identifier as a row holds it: `Package`'s key, every row's `package`.
 */
type PackageIdentifier = Addition<typeof Package>["identifier"];

/**
 * Where one document stands in its package, beside its view: every overlay builder's `ids` argument
 * (§C), each reading the part it needs. Every row of the document holds its `package` and `path`,
 * and names an element of it by the element's position.
 */
export interface DocumentPlace {
  /**
   * Whether the document is in an assembly (`Document.assembled`): a test or a section, or a
   * document that holds a site or that a site names (`#pantry/import/context.ts`).
   */
  readonly assembled: boolean;
  /**
   * The documents of the package by their paths, which a site's href names (Q5.13's builder).
   *
   * @param path - A path in the package.
   * @returns The path, where the package holds a document there; none where it holds none.
   */
  readonly documentAt: (path: string) => Option.Option<string>;
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
   * The package's manifest identifier, its key.
   */
  readonly package: PackageIdentifier;
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
 * A document's place in its package, which every row of it holds beside its own key fields: its
 * package's manifest identifier and its path. Every builder names a document by it.
 */
export type Place = Pick<DocumentPlace, "package" | "path">;

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
 * view, its rows and their folds under the context it is judged in (spec reading 117,
 * `#pantry/import/context.ts`): its own, or, for a document sites name, the union of their
 * ancestries and the interaction they stand in.
 */
export interface PlacedDocument {
  readonly ids: DocumentPlace;
  readonly listed: ListedDocument;
  readonly view: DocumentView;
}

/**
 * Place and view each document of one package: each flattened once, its nodes named by their
 * positions, judged in its context (`contextsOf` of `#pantry/import/context.ts`) and folded once
 * under it. Nothing is drawn, so the same package placed twice is the same.
 *
 * A document's `documentAt` reads every listed document, one per path, since the import reads each
 * path once, the manifest's as the manifest (`#pantry/import/program.ts`). Its `targetAt` reads
 * only the documents a resource names: a site never names the manifest, which is no resource's
 * document (spec readings 115 and 146), so an href that resolves to it names no target, and
 * "Include target" refuses an include of it.
 *
 * @param identifier - The package's manifest identifier.
 * @param documents - The package's documents, in the listing's order.
 * @param entries - The paths of the package's entries.
 * @returns Each document placed and viewed, in the order given.
 */
export const nodeIdsOf = (
  identifier: PackageIdentifier,
  documents: readonly ListedDocument[],
  entries: Iterable<string>,
): readonly PlacedDocument[] => {
  const entryPaths: ReadonlySet<string> = new Set(entries);
  const entryAt = (path: string): boolean => entryPaths.has(path);
  const listed = documents.map((document) => ({
    document,
    named: document.documentType !== "manifest",
    path: document.path,
    rows: flatten(document.tree),
    tree: document.tree,
  }));
  const placed: ReadonlySet<string> = new Set(listed.map(({ path }) => path));
  const documentAt = (path: string): Option.Option<string> =>
    placed.has(path) ? Option.some(path) : Option.none();
  const judged = contextsOf(listed);
  const targets = new Map<string, ListedTarget>();
  for (const { context, listed: target } of judged) {
    if (target.named && !targets.has(target.path)) {
      targets.set(target.path, { context, rootKind: target.tree.root.kind });
    }
  }

  const targetAt = (path: string): Option.Option<ListedTarget> =>
    Option.fromUndefinedOr(targets.get(path));

  return judged.map(({ assembled, context, listed: { document, rows }, targeted }) => ({
    ids: {
      assembled,
      documentAt,
      documentType: document.documentType,
      entryAt,
      package: identifier,
      path: document.path,
      targetAt,
      targeted,
    },
    listed: document,
    view: viewOf(document.tree, rows, context),
  }));
};

/**
 * The fields the host writes on every node, as a member of its parent's family nests it: every
 * written field but the tree's root fields `package` and `path`, which only the root names (C13);
 * grizzle draws `parent`, `start` and every count.
 */
export type NodeFields = Omit<Addition<typeof Node>, "package" | "path">;

/**
 * A node below the document node as its parent's family nests it, with its children nested.
 */
export type NodeMember = NodeFields & { readonly children: readonly NodeMember[] };

/**
 * A document's tree as the one `Node` insert writes it: the document node, which names the root
 * fields, its document's `package` and `path`, with every node below it nested.
 */
export type NodeRoot = NodeMember & Pick<Addition<typeof Node>, "package" | "path">;

/**
 * The insert row of a relation `insertAll` takes over `Qti`, its sequences nested.
 */
type InsertRow<Name extends keyof InsertAllRowsOf<typeof Qti>> = InsertAllRowsOf<
  typeof Qti
>[Name][number];

/**
 * The document layer's flat rows of one or more documents, each a keyed set by the text of its
 * key: the `Document` row of each document, its XML declaration's rows, each comment's,
 * instruction's and doctype's row, each foreign element's expanded name, each element's named
 * governing type, each element's closed and open attributes with their entity references and its
 * namespace declarations, one keyed set per relation of `documentLayer`
 * (`#pantry/import/roster.ts`). A text, whitespace or entity reference node keeps its characters on
 * its `Node` row (`chars`).
 */
export type DocumentLayerRows = {
  readonly [Name in keyof typeof documentLayer]: ReadonlyMap<string, InsertRow<Name>>;
};

/**
 * Every input of one package's ChangeSet, a keyed set of each relation `insertAll` takes over `Qti`
 * (`writtenNames` of `#pantry/import/roster.ts`), its rows typed as grizzle's `InsertAllRowsOf`
 * types that insert's: the `Package` row and its entries, each document's `Node` root with its tree
 * nested, the document layer's flat rows ({@link DocumentLayerRows}), and every overlay's
 * (`OverlayRows`). `readProgram` builds it from those, so each builder's row types are held to
 * grizzle's here.
 */
export type PackageInputs = {
  readonly [Name in keyof InsertAllRowsOf<typeof Qti>]: ReadonlyMap<string, InsertRow<Name>>;
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
 * Read the record a row of `flatten`'s names as its owner, by its owner's position.
 *
 * @param records - The records, by their owner's position.
 * @param owner - The position the row names.
 * @param what - What the row is, for the defect's message.
 * @returns The owner's record.
 * @throws {Error} When no record is at the position: `flatten` writes a row only of a node it
 *   writes, so a miss is its defect, never the document's.
 */
const ownerIn = <V>(records: ReadonlyMap<bigint, V>, owner: bigint, what: string): V => {
  const record = records.get(owner);
  if (record === undefined) {
    throw new Error(
      `flatten names the node at ${String(owner)} as the owner of ${what}, and writes no node there. Correct flatten.`,
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
 * Read the characters of every node that holds some, by its position: a text or whitespace node's
 * own, and an entity reference's `&name;`. Every other node holds none.
 *
 * @param rows - The document's rows, as `flatten` writes them.
 * @returns Each such node's characters.
 */
const charactersAt = (rows: FlatRows<Composed>): ReadonlyMap<bigint, string> =>
  new Map([
    ...[...rows.texts, ...rows.whitespace].map(({ start, value }) => [start, value] as const),
    ...rows.entityRefs.map(({ name, start }) => [start, `&${name};`] as const),
  ]);

/**
 * A member as the walk writes it: its insert, and the list its children are nested in.
 */
interface WrittenMember {
  readonly children: NodeMember[];
  readonly member: NodeMember;
}

/**
 * Write one node below the document node from its row, its characters and its fold.
 *
 * @param node - The node's row.
 * @param chars - Its characters, empty for a node that holds none.
 * @param folded - Its fold (`foldOf`): its ancestry, its nearest interaction and its state.
 * @param ids - Its document's path and type.
 * @returns The member, with the list its children are nested in.
 */
const memberOf = (
  node: NodeRow<Composed>,
  chars: string,
  folded: Folded,
  ids: Pick<DocumentPlace, "documentType" | "path">,
): WrittenMember => {
  const { kind, version } = node;
  const ends = endsOf(chars);
  const children: NodeMember[] = [];

  return {
    children,
    member: {
      ancestry: Bits.of(Flag, [...folded.ancestry]),
      chars,
      children,
      documentType: ids.documentType,
      first: ends.first,
      governor: governorOf(version, kind, node.governs),
      kind,
      last: ends.last,
      nearest: folded.nearest,
      nearestKind: folded.nearestKind,
      nearestPath: Option.getOrElse(folded.nearestPath, () => ids.path),
      prefix: node.prefix,
      state: positionHandle(folded.state),
      version,
    },
  };
};

/**
 * Write a document's tree as the one `Node` insert writes it (C13): the document node, naming its
 * document's `package` and `path`, with every node below it nested at `children` in document
 * order.
 *
 * No member names `parent` or the root fields, and no row carries a drawn, accumulated or
 * generated field: grizzle draws each node's `start` and `parent` from the nesting, which numbers
 * the nodes in document order as `flatten` does, so every other row of the document names a node by
 * the position the tree gives it. The host's fields are the ones the laws prove:
 *
 * - `state`, `ancestry`, `nearest` and `nearestKind`, from the document's fold (`foldOf` of
 *   `#pantry/import/fold.ts`, under the document's context: C5, E1, N8 and spec reading 117); the
 *   document node's are its context's, its state 0;
 * - `chars`, a text or whitespace node's characters and an entity reference's `&name;`, empty
 *   elsewhere, `first` and `last`, the first and last code points of `chars` (`endsOf`);
 * - `governor`, what its attributes and text are read under (`governorOf`, its kind's own for a node
 *   no named type governs), and `prefix`, an element's own, empty for any other node;
 * - `documentType`, the document's type (`DocumentPlace.documentType`), every node's alike, which its
 *   `Document` row and the tree's owner axis prove.
 *
 * The walk reads the nodes in document order, each nested in its parent's list, so a tree of any
 * depth is written without recursion.
 *
 * @param view - The document's view: its rows, and their folds under the context it is judged in
 *   (`ownContext` for a document no site names).
 * @param ids - Its package, path and type.
 * @returns The document node, with its tree nested.
 * @throws {Error} When `flatten` writes a node before its parent, which it never does.
 */
export const rootInsertOf = (
  view: DocumentView,
  ids: Place & Pick<DocumentPlace, "documentType">,
): NodeRoot => {
  const { documentType } = ids;
  const { context, folds, rows } = view;
  const { version } = view.tree;
  const chars = charactersAt(rows);
  const rootChildren: NodeMember[] = [];
  const root: NodeRoot = {
    ancestry: Bits.of(Flag, [...context.ancestry]),
    chars: "",
    children: rootChildren,
    documentType,
    first: "",
    governor: "document",
    kind: "document",
    last: "",
    nearest: context.nearest,
    nearestKind: context.nearestKind,
    nearestPath: Option.getOrElse(context.nearestPath, () => ids.path),
    package: ids.package,
    path: ids.path,
    prefix: "",
    state: "0",
    version,
  };
  const children = new Map<bigint, NodeMember[]>([[0n, rootChildren]]);

  for (const node of rows.nodes.slice(1)) {
    const siblings = children.get(node.parent);
    if (siblings === undefined) {
      throw new Error(
        `flatten wrote the node at ${String(node.start)} before its parent at ${String(node.parent)}, and it writes nodes in document order. Correct flatten.`,
      );
    }

    const written = memberOf(node, chars.get(node.start) ?? "", foldAt(folds, node.start), ids);
    siblings.push(written.member);
    children.set(node.start, written.children);
  }

  return root;
};

/**
 * Read what the host writes of an attribute its element's governor admits.
 *
 * @param element - Its element's row: its version, kind and governing type.
 * @param name - The attribute's name, a closed handle or an open class.
 * @returns The grammar's row, none for a name the governor does not admit, which AL1 refuses.
 */
const admittedOf = (element: NodeRow<Composed>, name: string): Option.Option<AdmittedAttribute> =>
  Option.fromUndefinedOr(
    attributeGrammarAt.get(
      keyOf(element.version, governorOf(element.version, element.kind, element.governs), name),
    ),
  );

/**
 * Write the slot of an attribute's name under its element's governor: the singleton of its
 * position, empty for a name the governor does not admit, which AL1 refuses.
 *
 * @param admitted - The grammar's row of the name, where the governor admits it.
 * @returns The slot.
 */
const slotOf = (admitted: Option.Option<AdmittedAttribute>) =>
  Bits.of(AttributeSlot, Option.toArray(admitted.pipe(Option.map(({ position }) => position))));

/**
 * Write a document's flat rows of the document layer: its `Document` row, its XML declaration's
 * `XmlDecl`, `EncodingDecl` and `SdDecl` rows where it writes each, each comment's, instruction's
 * and doctype's row, each foreign element's `OpenElementName` row with its node's tuple (C18) and
 * its parent's kind and namespace name, the named governing type of each element a named type
 * governs: a vocabulary element's `ElementType`, and a foreign element's `OpenElementType` with
 * its parent's namespace name, each with its node's governor (`governorOf`); each element's closed
 * attributes, their slot and their IDREF pieces nested where their domain is an `xs:IDREF` or
 * `xs:IDREFS`, its open attributes with their element's namespace name, each attribute's entity
 * references and each namespace declaration; and, for a document a resource lists, its
 * `ResourceDocument`, the type of that resource, which the manifest has none of (spec reading 176).
 * A bounded value has no row: the database reads it from the lexical form (`Double_bound`,
 * `#pantry/qti/attributes.ts`).
 *
 * @param document - The document, placed and viewed: its type and path as the importer lists it,
 *   whether it is in an assembly and its package, and its view, folded under the context it is
 *   judged in (`ownContext` for a document no site names).
 * @param document.ids - Whether it is in an assembly, and its package.
 * @param document.listed - Its type and path.
 * @param document.view - Its view.
 * @returns Its rows, each keyed by the text of its key ({@link keyTextOf}).
 * @throws {Error} When `flatten` writes a row of a node, or a node of a parent, that it wrote no
 *   row of ({@link ownerIn}).
 */
export const documentRowsOf = (document: {
  readonly ids: Pick<DocumentPlace, "assembled" | "package">;
  readonly listed: Pick<ListedDocument, "documentType" | "path">;
  readonly view: DocumentView;
}): DocumentLayerRows => {
  const { ids, listed, view } = document;
  const { context, folds, rows } = view;
  const { package: pkg } = ids;
  const { path } = listed;
  const at = { package: pkg, path };
  const byStart = new Map(rows.nodes.map((node) => [node.start, node] as const));
  const foreignNamespace = new Map(
    rows.openElementNames.map(({ namespace, start }) => [start, namespace] as const),
  );
  const namespaceOf = (node: NodeRow<Composed>): string =>
    node.start === 0n
      ? noNamespace
      : elementNamespaceOf(node.kind, Option.fromUndefinedOr(foreignNamespace.get(node.start)));
  const typed = rows.nodes.flatMap((row) =>
    Option.toArray(
      row.governs.pipe(
        Option.map((type) => ({
          fields: {
            ...at,
            governor: governorOf(row.version, row.kind, row.governs),
            kind: row.kind,
            start: row.start,
            type,
            version: row.version,
          },
          row,
        })),
      ),
    ),
  );
  const ofDocument = <Row>(list: readonly Row[]) =>
    new Map(list.map((row) => [keyTextOf(pkg, path), { ...row, ...at }] as const));

  return {
    Attribute: new Map(
      rows.attributes.map(({ lexical, name, prefix, start }) => {
        const admitted = admittedOf(ownerIn(byStart, start, `attribute ${name}`), name);

        return [
          keyTextOf(pkg, path, start, name),
          {
            ...at,
            idrefs: Option.exists(admitted, ({ idrefs }) => idrefs) ? tokensOf(lexical) : [],
            lexical,
            name,
            prefix,
            slot: slotOf(admitted),
            start,
          },
        ] as const;
      }),
    ),
    AttributeEntity: new Map(
      rows.attributeEntities.map(({ entity, name, offset, start }) => [
        keyTextOf(pkg, path, start, name, offset),
        { ...at, entity, name, offset, start },
      ]),
    ),
    Comment: new Map(
      rows.comments.map(({ start, value }) => [
        keyTextOf(pkg, path, start),
        { ...at, start, value },
      ]),
    ),
    Doctype: new Map(
      rows.doctypes.map(({ start, value }) => [
        keyTextOf(pkg, path, start),
        { ...at, start, value },
      ]),
    ),
    Document: new Map([
      [
        keyTextOf(pkg, path),
        {
          ...rows.document,
          ...at,
          assembled: ids.assembled,
          contextNearest: context.nearest,
          contextNearestKind: context.nearestKind,
          contextPath: Option.getOrElse(context.nearestPath, () => path),
          documentType: listed.documentType,
          nodeChildren: BigInt(
            rows.nodes.filter((node) => node.parent === 0n && node.start !== 0n).length,
          ),
          rootKind: view.tree.root.kind,
          version: view.tree.version,
        },
      ],
    ]),
    ElementType: new Map(
      typed.flatMap(({ fields, row }) =>
        foreignKinds.has(row.kind) ? [] : [[keyTextOf(pkg, path, row.start), fields] as const],
      ),
    ),
    EncodingDecl: ofDocument(rows.encodingDecls),
    Namespace: new Map(
      rows.namespaces.map(({ prefix, start, uri }) => [
        keyTextOf(pkg, path, start, prefix),
        { ...at, prefix, start, uri },
      ]),
    ),
    OpenAttribute: new Map(
      rows.openAttributes.map((row) => {
        const element = ownerIn(byStart, row.start, `attribute ${row.local}`);

        return [
          keyTextOf(pkg, path, row.start, row.uri, row.local),
          {
            ...at,
            class: row.class,
            elementNamespace: namespaceOf(element),
            lexical: row.lexical,
            local: row.local,
            prefix: row.prefix,
            slot: slotOf(admittedOf(element, row.class)),
            start: row.start,
            uri: row.uri,
          },
        ] as const;
      }),
    ),
    OpenAttributeEntity: new Map(
      rows.openAttributeEntities.map(({ entity, local, offset, start, uri }) => [
        keyTextOf(pkg, path, start, uri, local, offset),
        { ...at, entity, local, offset, start, uri },
      ]),
    ),
    OpenElementName: new Map(
      rows.openElementNames.map(({ local, namespace, start }) => {
        const row = ownerIn(byStart, start, "an open element name");
        const parent = ownerIn(byStart, row.parent, `the node at ${String(start)}, its child`);

        return [
          keyTextOf(pkg, path, start),
          {
            ...at,
            kind: row.kind,
            local,
            namespace,
            nearest: foldAt(folds, start).nearest,
            parent: parent.start,
            parentKind: parent.kind,
            parentNamespace: namespaceOf(parent),
            start,
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
                keyTextOf(pkg, path, row.start),
                {
                  ...fields,
                  parentNamespace: namespaceOf(
                    ownerIn(byStart, row.parent, `the node at ${String(row.start)}, its child`),
                  ),
                },
              ] as const,
            ]
          : [],
      ),
    ),
    Pi: new Map(
      rows.pis.map(({ data, start, target }) => [
        keyTextOf(pkg, path, start),
        { ...at, data, start, target },
      ]),
    ),
    ResourceDocument: new Map(
      listed.documentType === "manifest"
        ? []
        : [
            [
              keyTextOf(pkg, path),
              { ...at, rootKind: view.tree.root.kind, type: listed.documentType },
            ],
          ],
    ),
    SdDecl: ofDocument(rows.sdDecls),
    XmlDecl: ofDocument(rows.xmlDecls),
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

/**
 * The rows one package is written as, and the one ChangeSet that writes them (plan W5, Q5.15; the
 * W5 amendment's A, C5, C13, C19 and C21; rows-first.md §1 and §2).
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
 * Ids are drawn by the number `flatten` (`#pantry/model/xdm.ts`) gives each node and attribute, so
 * the tree and every overlay builder name each node by one id ({@link NodeIds}).
 */
import { Bits, ChangeSet } from "@bjornpagen/grizzle";
import type { Addition, AnyRelation, Uuid } from "@bjornpagen/grizzle";
import { Array as Arr, Option, Order } from "effect";
import { patternFlags } from "#pantry/grammar/domains.ts";
import {
  attributeRows,
  AttributeSlot,
  boundedDomains,
  Flag,
  KindNamespace,
  openElementClasses,
  Position,
  ValueDomainOf,
  ValueIdentity,
} from "#pantry/grammar/install.ts";
import { openClasses } from "#pantry/grammar/kinds.ts";
import { contextAt, contextsOf } from "#pantry/import/context.ts";
import { foldAt, foldOf, governorOf, textDomainOf } from "#pantry/import/fold.ts";
import type { Folded } from "#pantry/import/fold.ts";
import type { DocumentContext, ListedTarget } from "#pantry/import/context.ts";
import type { PackageRecord } from "#pantry/import/record.ts";
import type { OverlayRows } from "#pantry/import/overlays/index.ts";
import { writtenNames } from "#pantry/import/roster.ts";
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
  DoubleValue,
  Idref,
  OpenAttributeName,
  TextDoubleValue,
} from "#pantry/qti/attributes.ts";
import type { Document, Namespace } from "#pantry/qti/chardata.ts";
import type { Node } from "#pantry/qti/node.ts";
import type { Author } from "#pantry/qti/roles.ts";
import { Qti } from "#pantry/qti/schema.ts";

/**
 * The ids one document's rows are written under, and where it stands in its package: every overlay
 * builder's `ids` argument (§C), each reading the part it needs.
 */
export interface NodeIds {
  /**
   * Whether the document is in an assembly (`Document.assembled`): a test or a section, or a
   * document that holds a site or that a site names (`#pantry/import/context.ts`).
   */
  readonly assembled: boolean;
  /**
   * The context the document is judged in (spec reading 117, `#pantry/import/context.ts`): its own,
   * or, for a document sites name, the union of their ancestries and the interaction they stand in.
   */
  readonly context: DocumentContext;
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
   * The document's type, the type of the resource that lists it, `none` for the manifest, which is
   * no resource's document (spec reading 146): every node of the document copies it
   * (`Node.documentType`), so a law can tell the manifest's elements from another document's.
   */
  readonly documentType: ListedDocument["resourceType"];
  /**
   * The id of the node or attribute numbered `index` by `flatten`: the nodes in document order from
   * the document node's 0, then the attributes, so every caller that flattens the document under
   * it names each node by one id. The same index always gives the same id.
   *
   * @param index - The number `flatten` gives the node or attribute.
   * @returns Its id, a fresh uuid the first time the index is asked for.
   */
  readonly idOf: (index: number) => NodeId;
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
 * A document as the importer lists it, one per path: its path, its tree as shred gives it, and the
 * type of the resource that names it, `none` for the manifest, which is no resource's document
 * (spec reading 146).
 */
export interface ListedDocument {
  readonly path: string;
  readonly resourceType: Addition<typeof Document>["resourceType"];
  readonly tree: XdmDocument<Composed>;
}

/**
 * One listed document under the ids its rows are written under.
 */
export interface PlacedDocument {
  readonly ids: NodeIds;
  readonly listed: ListedDocument;
}

/**
 * The ids of one package: its own, and each listed document under its ids, in the listing's order.
 */
export interface PackageIds {
  readonly documents: readonly PlacedDocument[];
  readonly package: Uuid;
}

/**
 * The ids of one document, each drawn the first time its number is asked for.
 *
 * @param mint - Draws a fresh uuid.
 * @returns The document's `idOf`: the same id for the same number ever after.
 */
const drawnBy = (mint: () => NodeId): ((index: number) => NodeId) => {
  const drawn = new Map<number, NodeId>();

  return (index) => {
    const held = drawn.get(index);
    if (held !== undefined) {
      return held;
    }

    const id = mint();
    drawn.set(index, id);

    return id;
  };
};

/**
 * Mint the ids of one package: one fresh uuid for the package, and one for each XDM node and each
 * attribute of every document, drawn the first time its number is asked for and the same ever
 * after, as an import mints them each time it runs. So the same package imported twice is two
 * packages, every id fresh.
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
 * @returns The package's id and each document under its ids, in the order given.
 */
export const nodeIdsOf = (
  documents: readonly ListedDocument[],
  entries: Iterable<string>,
  mint: () => NodeId = () => crypto.randomUUID(),
): PackageIds => {
  const entryPaths: ReadonlySet<string> = new Set(entries);
  const entryAt = (path: string): boolean => entryPaths.has(path);
  const packageId = mint();
  const listed = documents.map((document) => ({ document, idOf: drawnBy(mint) }));
  const placed = new Map<string, NodeId>();
  const targets = new Map<string, Omit<ListedTarget, "context">>();
  for (const { document, idOf } of listed) {
    if (!placed.has(document.path)) {
      placed.set(document.path, idOf(0));
    }

    if (document.resourceType !== "none" && !targets.has(document.path)) {
      targets.set(document.path, { node: idOf(0), rootKind: document.tree.root.kind });
    }
  }

  const documentAt = (path: string): Option.Option<NodeId> =>
    Option.fromUndefinedOr(placed.get(path));
  const { assembled, contexts, targeted } = contextsOf(
    listed.map(({ document: { path, resourceType, tree }, idOf }) => ({
      idOf,
      named: resourceType !== "none",
      path,
      tree,
    })),
  );
  const targetAt = (path: string): Option.Option<ListedTarget> =>
    Option.map(Option.fromUndefinedOr(targets.get(path)), ({ node, rootKind }) => ({
      context: contextAt(contexts, node),
      node,
      rootKind,
    }));

  return {
    documents: listed.map(({ document, idOf }) => ({
      ids: {
        assembled: assembled.has(idOf(0)),
        context: contextAt(contexts, idOf(0)),
        documentAt,
        documentType: document.resourceType,
        entryAt,
        idOf,
        package: packageId,
        path: document.path,
        targetAt,
        targeted: targeted.has(idOf(0)),
      },
      listed: document,
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
 * A bounded attribute's typed value, as its attribute's family nests it.
 */
export type DoubleValueInsert = Omit<Addition<typeof DoubleValue>, "attribute" | "node">;

/**
 * A bounded text's typed value, as its element's family nests it.
 */
export type TextDoubleValueInsert = Omit<Addition<typeof TextDoubleValue>, "node">;

/**
 * An attribute as its element's family nests it: its written fields but the `node` the nesting
 * supplies, and its four families at their count fields.
 */
export type AttributeInsert = Omit<Addition<typeof Attribute>, "node"> & {
  readonly doubleValue: readonly DoubleValueInsert[];
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
  readonly doubleValue: readonly TextDoubleValueInsert[];
  readonly namespaces: readonly NamespaceInsert[];
};

/**
 * A document's tree as the one `Node` insert writes it: the document node, which names the root
 * field `document` as its own id, with every node below it nested.
 */
export type NodeRoot = NodeMember & { readonly document: Addition<typeof Node>["document"] };

/**
 * The document layer's flat rows of one or more documents, each a keyed set by its node's id: the
 * `Document` row of each document node, each comment's, instruction's and doctype's row, and each
 * foreign element's expanded name, one keyed set per relation of `documentLayer`
 * (`#pantry/import/roster.ts`). A text, whitespace or entity reference node keeps its characters on
 * its `Node` row (`chars`).
 */
export type DocumentLayerRows = {
  readonly [Name in keyof typeof documentLayer]: ReadonlyMap<
    string,
    Addition<(typeof documentLayer)[Name]>
  >;
};

/**
 * Every input of one package's ChangeSet, each a keyed set: the `Package` row with its record
 * nested, each document's `Node` root with its tree nested, both keyed by their id, the document
 * layer's flat rows, and every overlay's.
 */
export type PackageInputs = DocumentLayerRows &
  OverlayRows & {
    readonly Node: ReadonlyMap<string, NodeRoot>;
    readonly Package: ReadonlyMap<string, PackageRecord>;
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
 * The installed `ValueIdentity`, by domain: total over the domains, `none` for one of no identity.
 */
const identityAt: ReadonlyMap<string, string> = new Map(
  ValueIdentity.rows.map(({ domain, identity }) => [domain, identity]),
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
 * The domains a bound judges ({@link boundedDomains}), each with its lexical space as the host
 * reads it: its pattern, read with {@link patternFlags} as AL1 reads it.
 */
const boundedPatterns: ReadonlyMap<string, RegExp> = new Map(
  ValueDomainOf.rows
    .filter(({ domain }) => boundedDomains.some((bounded) => bounded === domain))
    .map(({ domain, pattern }) => [domain, new RegExp(pattern, patternFlags)] as const),
);

/**
 * What the host writes of an attribute its governor admits, read once from the attribute grammar
 * (`AttributeGrammar`, `AttributeSlotOf`) and its domain's rows: its slot's position, whether its
 * domain is an `xs:IDREF` or `xs:IDREFS` (`ValueIdentity`), so it holds its IDREF pieces, and its
 * domain's lexical space where a bound judges the domain ({@link boundedPatterns}).
 */
interface AdmittedAttribute {
  readonly idrefs: boolean;
  readonly lexicalSpace: Option.Option<RegExp>;
  readonly position: (typeof attributeRows)[number]["position"];
}

/**
 * The attribute grammar, by `version governor name`, each row as the host writes it.
 *
 * @throws {Error} When `ValueIdentity` holds no row of an admitted attribute's domain: it is total
 *   over the domains (`#pantry/grammar/install.ts`), so a miss is a defect of the grammar.
 */
const attributeGrammarAt: ReadonlyMap<string, AdmittedAttribute> = new Map(
  attributeRows.map(({ domain, governor, name, position, version }) => {
    const identity = identityAt.get(domain);
    if (identity === undefined) {
      throw new Error(
        `ValueIdentity holds no row of the domain ${domain}, and it is total over the domains. Regenerate the grammar's ValueIdentity.`,
      );
    }

    return [
      keyOf(version, governor, name),
      {
        idrefs: identity === "IDREF" || identity === "IDREFS",
        lexicalSpace: Option.fromUndefinedOr(boundedPatterns.get(domain)),
        position,
      },
    ] as const;
  }),
);

/**
 * The whitespace `xs:double`'s `collapse` reads around a value: XML's `S`.
 */
const doubleSpace = /^[\t\n\r ]+|[\t\n\r ]+$/gu;

/**
 * The values of `xs:double`'s three special literals in XML Schema 1.0, the edition QTI 3.0's XSDs
 * are written in (spec reading 71): `INF`, `-INF` and `NaN`. `+INF` is XML Schema 1.1's, outside
 * 1.0's lexical space, so the domain's pattern refuses it and no value of it is read.
 */
const specialDoubles: ReadonlyMap<string, number> = new Map([
  ["INF", Number.POSITIVE_INFINITY],
  ["-INF", Number.NEGATIVE_INFINITY],
  ["NaN", Number.NaN],
]);

/**
 * Read an `xs:double` literal's value, the reader of an attribute's or a text's double (a map
 * key's is PostgreSQL's cast, `#pantry/qti/mapping.ts` `MapKeyFloat`): its whitespace collapsed,
 * then a special literal's value, else the IEEE double nearest the decimal it writes,
 * which JavaScript's `Number` rounds to as XML Schema 1.1 Part 2 §3.3.5.2 does, a magnitude below
 * 2^-1075 rounding to a zero of its sign.
 *
 * @param lexical - The literal, in `xs:double`'s lexical space after collapsing.
 * @returns Its value.
 */
export const doubleOf = (lexical: string): number => {
  const text = lexical.replaceAll(doubleSpace, "");

  return specialDoubles.get(text) ?? Number(text);
};

/**
 * The whitespace an IDREFS value separates its tokens by, XML's `S`.
 */
const idrefSpace = /[\t\n\r ]+/gu;

/**
 * XML whitespace, possibly none, as an `Idref` piece holds it around its token.
 */
type SpaceText = IdrefInsert["before"];

/**
 * State that a run the split cut at whitespace is the whitespace around a token: `Space`'s
 * pattern, `^[\t\n\r ]*$`, the language the type `SpaceText` spells.
 *
 * @param text - A run of {@link idrefSpace}'s matches, or the empty text.
 * @returns Whether it is XML whitespace, possibly none.
 */
const isSpace = (text: string): text is SpaceText => /^[\t\n\r ]*$/u.test(text);

/**
 * Hold a run the split cut at whitespace to the type of the whitespace around a token.
 *
 * @param text - A run of {@link idrefSpace}'s matches, or the empty text.
 * @returns The run.
 * @throws {Error} When the run holds anything but whitespace, which the split never cuts.
 */
const spaceOf = (text: string): SpaceText => {
  if (isSpace(text)) {
    return text;
  }

  throw new Error(
    `The IDREF split cut ${JSON.stringify(text)} as whitespace, and it holds more. Correct idrefPiecesOf.`,
  );
};

/**
 * Split an IDREF or IDREFS lexical form into its tokens, each with the whitespace written before
 * it, and the last with the whitespace after it, so the pieces concatenate to the form and every
 * token but the first follows whitespace (`E1_derived` on `Idref`).
 *
 * @param lexical - The attribute's lexical form.
 * @returns Its pieces, in order; none for a form with no token, which the attribute's laws refuse.
 */
export const idrefPiecesOf = (lexical: string): readonly IdrefInsert[] => {
  const tokens: { readonly before: string; readonly token: string }[] = [];
  let before = "";
  let last = 0;
  for (const space of lexical.matchAll(idrefSpace)) {
    const token = lexical.slice(last, space.index);
    if (token.length > 0) {
      tokens.push({ before, token });
      before = "";
    }

    before += space[0];
    last = space.index + space[0].length;
  }

  const tail = lexical.slice(last);
  if (tail.length > 0) {
    tokens.push({ before, token: tail });
    before = "";
  }

  return tokens.map(({ before: lead, token }, at) => ({
    after: spaceOf(at === tokens.length - 1 ? before : ""),
    before: spaceOf(lead),
    token,
  }));
};

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
 * entity reference's `&name;`, empty for a node that holds none; `text`, its children's characters
 * in document order, its string value where its text is checked, which a bounded text's typed value
 * is read from; and its namespace name where it is a foreign element.
 */
interface Gathered {
  readonly attributes: GatheredAttribute[];
  chars: string;
  foreignNamespace: Option.Option<string>;
  readonly namespaces: FlatRows<Composed>["namespaces"][number][];
  readonly node: NodeRow<Composed>;
  text: string;
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
                text: "",
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

  for (const { chars, node } of nodes.values()) {
    if (node.parent !== self) {
      ownerIn(nodes, node.parent, `node ${node.id}, its child`).text += chars;
    }
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
 *   `xs:IDREFS`, its typed value where its domain is bounded and its lexical form is in the
 *   domain's lexical space, its entity references and its open name.
 */
const attributeOf = (attribute: GatheredAttribute, element: Gathered): AttributeInsert => {
  const { row } = attribute;
  const { governs, kind, version } = element.node;
  const admitted = Option.flatMap(governorOf(version, kind, governs), (governor) =>
    Option.fromUndefinedOr(attributeGrammarAt.get(keyOf(version, governor, row.name))),
  );
  const lexicalSpace = admitted.pipe(Option.flatMap((admits) => admits.lexicalSpace));

  return {
    doubleValue: Option.exists(lexicalSpace, (space) => space.test(row.lexical))
      ? [{ value: doubleOf(row.lexical) }]
      : [],
    entities: attribute.entities.map(({ name, offset }) => ({ name, offset })),
    id: row.id,
    idrefs: Option.exists(admitted, ({ idrefs }) => idrefs) ? idrefPiecesOf(row.lexical) : [],
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
 * @param documentType - The type of the resource that lists its document.
 * @returns The member, with the list its children are nested in.
 */
const memberOf = (
  gathered: Gathered,
  folded: Folded,
  documentType: ListedDocument["resourceType"],
): WrittenMember => {
  const { node } = gathered;
  const { kind, version } = node;
  const ends = endsOf(gathered.chars);
  const children: NodeMember[] = [];
  const textSpace = Option.flatMap(textDomainOf(version, kind, node.governs), (domain) =>
    Option.fromUndefinedOr(boundedPatterns.get(domain)),
  );

  return {
    children,
    member: {
      ancestry: Bits.of(Flag, [...folded.ancestry]),
      attributes: gathered.attributes.map((attribute) => attributeOf(attribute, gathered)),
      chars: gathered.chars,
      children,
      documentType,
      doubleValue: Option.exists(textSpace, (space) => space.test(gathered.text))
        ? [{ value: doubleOf(gathered.text) }]
        : [],
      first: ends.first,
      governs: node.governs,
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
 * - `governs` and `prefix`, an element's own, `none` and empty for any other node;
 * - `documentType`, the document's type (`NodeIds.documentType`), every node's alike, which its
 *   `Document` row and the tree's owner axis prove.
 *
 * The walk reads the gathered nodes in document order, each nested in its parent's list, so a
 * tree of any depth is written without recursion.
 *
 * @param doc - The document's tree, as shred gives it.
 * @param ids - The ids its rows are written under, its type, and the context it is judged in
 *   (`ownContext` of its document node for a document no site names).
 * @returns The document node, with its tree nested.
 */
export const rootInsertOf = (
  doc: XdmDocument<Composed>,
  ids: Pick<NodeIds, "context" | "documentType" | "idOf">,
): NodeRoot => {
  const { context, documentType } = ids;
  const rows = flatten(doc, ids.idOf);
  const { version } = doc;
  const self = rows.document.node;
  const folds = foldOf(rows.nodes, context);
  const rootChildren: NodeMember[] = [];
  const root: NodeRoot = {
    ancestry: Bits.of(Flag, [...context.ancestry]),
    attributes: [],
    chars: "",
    children: rootChildren,
    document: self,
    documentType,
    doubleValue: [],
    first: "",
    governs: "none",
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
 * and doctype's row, and each foreign element's `OpenElementName` row with its node's tuple (C18)
 * and its parent's kind and namespace name, the document node's none.
 *
 * @param document - The document as the importer lists it.
 * @param ids - The ids its rows are written under, whether it is in an assembly, and the context
 *   it is judged in (`ownContext` of its document node for a document no site names).
 * @returns Its rows, each keyed by its node's id.
 * @throws {Error} When `flatten` writes an `OpenElementName` row of a node, or a node of a parent,
 *   that it wrote no row of ({@link ownerIn}).
 */
export const documentRowsOf = (
  document: ListedDocument,
  ids: Pick<NodeIds, "assembled" | "context" | "idOf" | "package">,
): DocumentLayerRows => {
  const rows = flatten(document.tree, ids.idOf);
  const self = rows.document.node;
  const { context } = ids;
  const byId = new Map(rows.nodes.map((node) => [node.id, node] as const));
  const foreignNamespace = new Map(
    rows.openElementNames.map(({ namespace, node }) => [node, namespace] as const),
  );
  const folds = foldOf(rows.nodes, context);
  const namespaceOf = (parent: NodeRow<Composed>): string =>
    parent.id === self
      ? noNamespace
      : elementNamespaceOf(parent.kind, Option.fromUndefinedOr(foreignNamespace.get(parent.id)));

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
          nodeChildren: BigInt(
            rows.nodes.filter((node) => node.parent === self && node.id !== self).length,
          ),
          nodeDocument: self,
          nodeGoverns: "none",
          nodeKind: "document",
          nodeParentKind: "document",
          nodeStart: 0n,
          package: ids.package,
          path: document.path,
          resourceType: document.resourceType,
          rootKind: document.tree.root.kind,
          version: document.tree.version,
        },
      ],
    ]),
    EncodingDecl: new Map(rows.encodingDecls.map((row) => [row.node, row] as const)),
    OpenElementName: new Map(
      rows.openElementNames.map(({ local, namespace, node }) => {
        const row = ownerIn(byId, node, "an open element name");
        const parent = ownerIn(byId, row.parent, `node ${node}, its child`);

        return [
          node,
          {
            document: self,
            governs: row.governs,
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
    Pi: new Map(rows.pis.map(({ data, node, target }) => [node, { data, node, target }] as const)),
    SdDecl: new Map(rows.sdDecls.map((row) => [row.node, row] as const)),
    XmlDecl: new Map(rows.xmlDecls.map((row) => [row.node, row] as const)),
  };
};

/**
 * The row type of one input of a package's ChangeSet.
 */
type RowOf<Name extends keyof PackageInputs> =
  PackageInputs[Name] extends ReadonlyMap<string, infer Row> ? Row : never;

/**
 * A row of any input of a package's ChangeSet.
 */
type AnyRow = RowOf<keyof PackageInputs>;

/**
 * The fields each flat relation's CHECK reads a per-row pattern by, the pattern's inputs: the
 * relations whose rows are sorted by them before the write, so that rows of one pattern are one run
 * of their statement and PostgreSQL's backend, which caches 32 compiled regexes, compiles each
 * pattern once per run (the tier-1 addendum's import order: 1.4 to 4.9 µs a grouped row against
 * about 80 µs in arbitrary order).
 *
 * A nested family's rows are written in the nesting's order, each owner's members in slot order
 * (grizzle's `write/family/nesting.ts`), so the `Attribute` statement, whose `value_domain` reads
 * a pattern per domain, and `Node`'s TextDomain keep document order: no caller can sort them.
 *
 * `Value`'s `Typed_value` reads the pattern of its base type's domain (Q5.08), `Literal_lexical`
 * its type code's and `ExpressionAttribute`'s `E1_derived` its attribute's and base type's
 * (Q5.10), and `UsageValue`'s `Usage_typed_value` its base type's (spec reading 105). A relation
 * joins this table when a check over it reads a pattern by a field.
 */
export const patternInputs = {
  ExpressionAttribute: ["attribute", "baseType"],
  LiteralTyped: ["typeCode"],
  UsageValue: ["baseType"],
  Value: ["baseType"],
} as const satisfies Partial<Readonly<Record<keyof PackageInputs, readonly string[]>>>;

/**
 * Order rows by the values of their pattern inputs, stably: rows with equal inputs form one run,
 * and keep their own order within it.
 *
 * @param rows - The rows, in the order their keyed set holds them.
 * @param fields - The fields the pattern is read by, most significant first.
 * @returns The rows, sorted.
 */
export const domainOrdered = <const F extends string, R extends Readonly<Record<F, string>>>(
  rows: Iterable<R>,
  fields: readonly F[],
): readonly R[] =>
  Arr.sort(
    [...rows],
    Order.mapInput(Order.Array(Order.String), (row: R) => fields.map((field) => row[field])),
  );

/**
 * The rows of each relation of {@link patternInputs}, sorted by their pattern's inputs; the
 * `satisfies` holds the record to the table, so a relation the table gains is sorted here or fails
 * to compile.
 *
 * @param inputs - The package's inputs.
 * @returns Each pattern relation's rows, sorted.
 */
const patternOrdered = (inputs: PackageInputs) =>
  ({
    ExpressionAttribute: domainOrdered(
      inputs.ExpressionAttribute.values(),
      patternInputs.ExpressionAttribute,
    ),
    LiteralTyped: domainOrdered(inputs.LiteralTyped.values(), patternInputs.LiteralTyped),
    UsageValue: domainOrdered(inputs.UsageValue.values(), patternInputs.UsageValue),
    Value: domainOrdered(inputs.Value.values(), patternInputs.Value),
  }) satisfies { readonly [Name in keyof typeof patternInputs]: readonly RowOf<Name>[] };

/**
 * Whether a relation is one of {@link patternInputs}, whose rows are sorted before the write.
 *
 * @param name - The relation.
 * @returns Whether its rows are sorted.
 */
const isPatterned = (name: keyof PackageInputs): name is keyof typeof patternInputs =>
  Object.hasOwn(patternInputs, name);

/**
 * A ChangeSet as the fold below builds it: grizzle's runtime value, whose `insert` takes any
 * relation and its facts and checks each member where the ChangeSet is compiled (grizzle-engine
 * `write/changeset/value.ts`, `ChangeSetValue`).
 */
interface Inserting {
  readonly insert: (relation: AnyRelation, facts: readonly AnyRow[]) => Inserting;
}

/**
 * Build one package's ChangeSet: one step over the author role, each relation of the package's
 * inputs inserted once (`writtenNames` of `#pantry/import/roster.ts`, every stored relation of
 * `Qti` no ordered family nests), every owner in the same stratum as its whole family (the W5
 * amendment's A, C19). A ChangeSet is canonical, its members sorted by relation, so the order of
 * the inserts is no part of it.
 *
 * The `Node` insert carries each document's tree, its attributes and namespace declarations, and
 * their families nested; the `Package` insert its record. Every other input is its keyed set's
 * rows, flat, those of {@link patternInputs} sorted by their pattern's inputs.
 *
 * The caller passes the role, the one its database was opened on: describing `Author` costs about
 * 2 s and 271 MB when `#pantry/qti/roles.ts` loads (measured 2026-11-06 at load average 27), and
 * a caller that only builds rows, such as the dry run, never needs it.
 *
 * @param author - The author role, `Author` of `#pantry/qti/roles.ts`.
 * @param inputs - The package's inputs.
 * @returns The ChangeSet, compiled by `db.apply` for the one call that applies it.
 */
export const changeSetOf = (
  author: typeof Author,
  inputs: PackageInputs,
): ChangeSet<typeof Author, unknown, keyof PackageInputs> => {
  // SAFETY: grizzle's ChangeSet value has the runtime `insert` `Inserting` names (grizzle-engine
  // `write/changeset/value.ts`, `ChangeSetValue`), which checks each member where the ChangeSet
  // is compiled.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
  let changes = ChangeSet.empty(author) as Inserting;
  const ordered = patternOrdered(inputs);
  for (const name of writtenNames) {
    changes = changes.insert(
      Qti.relations[name],
      isPatterned(name) ? ordered[name] : [...inputs[name].values()],
    );
  }

  // SAFETY: the loop inserted each relation of `writtenNames`, the keys of `PackageInputs`, with its
  // facts, so the value is a ChangeSet over the role writing exactly those relations, each owner with
  // its family, which grizzle checks again where it compiles the ChangeSet.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
  return changes as ChangeSet<typeof Author, unknown, keyof PackageInputs>;
};

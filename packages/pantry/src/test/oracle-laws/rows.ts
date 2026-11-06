/**
 * The rows the law oracle's added producers read (`#pantry/test/oracle-laws.ts`): one folded
 * document indexed for its overlay laws, and a breach as those producers report it.
 *
 * The law oracle (`#pantry/test/oracle.ts`) keeps its own index of a document private, so the
 * producers that state the laws it declared without a producer read their documents through this
 * one instead. It reads the same rows the same way: an element's closed attributes as written, by
 * their handles; its children in slot order; its path as each element step `kind[at]` from the
 * document node down. It shares no code with the importer's overlays (`#pantry/import/overlays/`),
 * so a producer here is a second statement of each law, never a copy of the rows the database
 * reads.
 */
import { Option } from "effect";
import type { Composed } from "#pantry/model/composed.ts";
import type { FoldedNode, FoldedRows } from "#pantry/model/folds.ts";
import type { NodeId } from "#pantry/model/xdm.ts";
import { openClasses } from "#pantry/grammar/kinds.ts";

/**
 * A node row of a folded document.
 */
export type Row = FoldedNode<Composed>;

/**
 * One breach of a law as a producer reports it: the law, the document where it broke, and the keys
 * of the failing row, the oracle's `Breach` over the producer's own laws.
 */
export interface LawBreach<Law extends string> {
  readonly document: string;
  readonly keys: Readonly<Record<string, string>>;
  readonly law: Law;
}

/**
 * One folded document indexed for the producers: its nodes by id and below each parent in slot
 * order, each element's closed attributes as written by handle, and each character node's text.
 */
export interface Rows {
  readonly byId: ReadonlyMap<NodeId, Row>;
  readonly childrenOf: ReadonlyMap<NodeId, readonly Row[]>;
  /**
   * Every node row below the document node, in document order.
   */
  readonly members: readonly Row[];
  /**
   * The document's path in its package.
   */
  readonly path: string;
  /**
   * The document's root element, none when the rows hold no element under the document node.
   */
  readonly root: Option.Option<Row>;
  readonly rows: FoldedRows<Composed>;
  readonly self: NodeId;
  readonly valuesOf: ReadonlyMap<NodeId, ReadonlyMap<string, string>>;
}

/**
 * The XML whitespace characters the `collapse` class turns to spaces.
 */
const xmlWhitespace = /[\t\n\r]/gu;

/**
 * Collapse a lexical form: XML Schema's `collapse` whitespace class, which every identifier,
 * number and name an overlay law reads is compared under.
 *
 * @param lexical - The form as read.
 * @returns The form with tabs, line feeds and carriage returns as spaces, each run of spaces made
 *   one, and none at either end; no other character is whitespace to it.
 * @see {@link https://www.w3.org/TR/xmlschema-2/#rf-whiteSpace | XML Schema Part 2, whiteSpace}
 */
export const collapsed = (lexical: string): string =>
  lexical
    .replaceAll(xmlWhitespace, " ")
    .replaceAll(/ +/gu, " ")
    .replace(/^ /u, "")
    .replace(/ $/u, "");

/**
 * The node kinds that are no element: the document node and the character-data kinds.
 */
const characterKinds: ReadonlySet<string> = new Set([
  "comment",
  "doctype",
  "document",
  "entityRef",
  "pi",
  "text",
  "ws",
]);

/**
 * Decide whether a node row is an element, of a closed kind or foreign.
 *
 * @param node - The row.
 * @returns Whether it is no document node and no character data.
 */
export const isElement = (node: Row): boolean => !characterKinds.has(node.kind);

/**
 * Index a document's folded rows.
 *
 * @param path - The document's path in its package.
 * @param rows - Its folded rows.
 * @returns The index.
 */
export const rowsOf = (path: string, rows: FoldedRows<Composed>): Rows => {
  const self = rows.document.node;
  const members = rows.nodes.filter(({ start }) => start > 0n);
  const byId = new Map<NodeId, Row>();
  for (const node of rows.nodes) {
    if (!byId.has(node.id)) {
      byId.set(node.id, node);
    }
  }

  const childrenOf = new Map<NodeId, Row[]>();
  for (const node of members) {
    const siblings = childrenOf.get(node.parent);
    if (siblings === undefined) {
      childrenOf.set(node.parent, [node]);
    } else {
      siblings.push(node);
    }
  }

  for (const siblings of childrenOf.values()) {
    siblings.sort((left, right) => Number(left.at - right.at));
  }

  const valuesOf = new Map<NodeId, Map<string, string>>();
  for (const attribute of rows.attributes) {
    if (!openClasses.some((open) => open === attribute.name)) {
      const values = valuesOf.get(attribute.node) ?? new Map<string, string>();
      if (!values.has(attribute.name)) {
        values.set(attribute.name, attribute.lexical);
      }

      valuesOf.set(attribute.node, values);
    }
  }

  return {
    byId,
    childrenOf,
    members,
    path,
    root: Option.fromNullishOr((childrenOf.get(self) ?? []).find(isElement)),
    rows,
    self,
    valuesOf,
  };
};

/**
 * Read an element's closed attribute as written.
 *
 * @param rows - The document.
 * @param node - The element's id.
 * @param name - The attribute's closed handle.
 * @returns Its lexical form, or none when the element carries no such attribute.
 */
export const valueOf = (rows: Rows, node: NodeId, name: string): Option.Option<string> =>
  Option.fromNullishOr(rows.valuesOf.get(node)?.get(name));

/**
 * Read an element's closed attribute collapsed, the form every identifier and number is compared
 * in.
 *
 * @param rows - The document.
 * @param node - The element's id.
 * @param name - The attribute's closed handle.
 * @returns Its collapsed form, or none when the element carries no such attribute.
 */
export const collapsedOf = (rows: Rows, node: NodeId, name: string): Option.Option<string> =>
  Option.map(valueOf(rows, node, name), collapsed);

/**
 * List an element's element children in slot order.
 *
 * @param rows - The document.
 * @param node - The element's id.
 * @returns Its children that are elements.
 */
export const elementsOf = (rows: Rows, node: NodeId): readonly Row[] =>
  (rows.childrenOf.get(node) ?? []).filter(isElement);

/**
 * List the members of a node's subtree below it, in document order: the rows whose start lies in
 * its interval after its own.
 *
 * @param rows - The document.
 * @param node - The node.
 * @returns Its descendants.
 */
export const descendantsOf = (rows: Rows, node: Row): readonly Row[] =>
  rows.members.filter(({ start }) => start > node.start && start < node.end);

/**
 * List a node's ancestors, nearest first, the document node left out. The walk stops before a node
 * it has already met, so a cycle of parent links ends.
 *
 * @param rows - The document.
 * @param node - The node.
 * @returns Its ancestor elements.
 */
export const ancestorsOf = (rows: Rows, node: Row): readonly Row[] => {
  const chain: Row[] = [];
  const met = new Set<NodeId>([node.id]);
  let at = node.start > 0n ? rows.byId.get(node.parent) : undefined;
  while (at !== undefined && at.start > 0n && !met.has(at.id)) {
    met.add(at.id);
    chain.push(at);
    at = rows.byId.get(at.parent);
  }

  return chain;
};

/**
 * Write where a node sits in its document, as the law oracle writes a breach's `node` key: each
 * element step from the document node down, as `kind[at]`.
 *
 * @param rows - The document.
 * @param id - The node's id.
 * @returns The path, `/` for the document node.
 */
export const pathOf = (rows: Rows, id: NodeId): string => {
  const node = rows.byId.get(id);
  if (node === undefined || node.start === 0n) {
    return "/";
  }

  return `/${[node, ...ancestorsOf(rows, node)]
    .map((at) => `${at.kind}[${String(at.at)}]`)
    .toReversed()
    .join("/")}`;
};

/**
 * Read a node's string value as its children write it: the folds' `stringValue`, its text,
 * whitespace and entity-reference children's characters in order.
 *
 * @param node - The node.
 * @returns The string value.
 */
export const stringValueOf = (node: Row): string => node.stringValue;

/**
 * Make a producer's breach of a node: its document, its node's path, kind and version, and the
 * keys its law reads.
 *
 * @param rows - The document.
 * @param node - The node where the law broke.
 * @param law - The law.
 * @param keys - The keys of the failing row the law's explanation reads.
 * @returns The breach.
 */
export const breachAt = <Law extends string>(
  rows: Rows,
  node: Row,
  law: Law,
  keys: Readonly<Record<string, string>> = {},
): LawBreach<Law> => ({
  document: rows.path,
  keys: { kind: node.kind, node: pathOf(rows, node.id), version: node.version, ...keys },
  law,
});

/**
 * One document a package's manifest lists, as the package-level producers read it: its path, the
 * `type` of the resource that lists it as written, and its own rows as folded, an include not
 * spliced in.
 */
export interface ListedRows {
  readonly path: string;
  readonly resourceType: string;
  readonly rows: Rows;
}

/**
 * A package as the package-level producers read it: its manifest, the documents it lists that
 * folded, in manifest order, and its entries' paths.
 */
export interface PackageRows {
  readonly documents: readonly ListedRows[];
  readonly entries: ReadonlySet<string>;
  readonly manifest: Rows;
}

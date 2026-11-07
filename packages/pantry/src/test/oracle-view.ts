/**
 * One folded document indexed for the law oracle (`#pantry/test/oracle.ts`) and its producers
 * (`#pantry/test/oracle-laws/`): its rows by id, by slot and by owner, each element's closed
 * attribute values by name, its character data, and the reads both make of it, an element's
 * attribute, its path, its ancestors, an href resolved against its `xml:base` values.
 *
 * It shares no code with the importer's overlays (`#pantry/import/overlays/`), so every law the
 * oracle states over it is a second statement of the law, never a copy of the rows the database
 * reads.
 */
import { Option } from "effect";
import { openClasses } from "#pantry/grammar/kinds.ts";
import type { Composed } from "#pantry/model/composed.ts";
import type { FoldedAttribute, FoldedNode, FoldedRows } from "#pantry/model/folds.ts";
import type { ClosedName, NodeId, OpenNameRow } from "#pantry/model/xdm.ts";
import { comparedPath, oracleValueOf, resolveAttribute } from "#pantry/test/resolution.ts";
import type { OracleResolution, OracleWhiteSpace } from "#pantry/test/resolution.ts";

/**
 * A node row of a folded document.
 */
export type Row = FoldedNode<Composed>;

/**
 * One breach of a law: the law, the document where it broke, and the keys of the failing row its
 * explanation reads.
 */
export interface LawBreach<Law extends string> {
  readonly document: string;
  readonly keys: Readonly<Record<string, string>>;
  readonly law: Law;
}

/**
 * Read one key field of a breach.
 *
 * @param keys - The breach's keys.
 * @param name - The field's name.
 * @returns Its text, empty when the keys do not hold it.
 */
export const field = (keys: Readonly<Record<string, string>>, name: string): string =>
  keys[name] ?? "";

/**
 * Read an attribute's value as its type reads it, or none: the oracle's one read of a typed
 * attribute past AL1. A form inside its value domain is its value after its type's whiteSpace
 * class, and a form outside it, or a name its owner does not admit, has none. XML Schema judges a
 * value after its whiteSpace normalization (XSD 1.1 Part 2, §4.3.6), so a form AL1 refuses holds no
 * value any other law could read.
 */
export type TypedReading = (attribute: FoldedAttribute<Composed>) => Option.Option<string>;

/**
 * One folded document with its rows indexed for the laws: by id, by slot, by owner, and each
 * element's closed attribute values by name, as written and as their types read them.
 */
export interface View {
  readonly attributesOf: ReadonlyMap<NodeId, readonly FoldedAttribute<Composed>[]>;
  /**
   * Each node row by its id, the first row that holds the id: a later row with the same id is in
   * {@link View.repeated}, never in place of the first.
   */
  readonly byId: ReadonlyMap<NodeId, Row>;
  readonly bySlot: ReadonlyMap<string, Row>;
  /**
   * Each node's children in the order its rows hold them, which the node laws judge.
   */
  readonly childrenOf: ReadonlyMap<NodeId, readonly Row[]>;
  /**
   * The name of each entity-reference node, by node.
   */
  readonly entityOf: ReadonlyMap<NodeId, string>;
  /**
   * The stored namespace of each foreign element, by node: its `OpenElementName` row's.
   */
  readonly foreignNamespaceOf: ReadonlyMap<NodeId, string>;
  /**
   * Every node row below the document node, in the order the rows hold them.
   */
  readonly members: readonly Row[];
  /**
   * Each open-class attribute's exact name, by the attribute's id: its `OpenName` row.
   */
  readonly openNameOf: ReadonlyMap<string, OpenNameRow>;
  /**
   * The document's path in its package.
   */
  readonly path: string;
  /**
   * The node rows whose id an earlier row already holds, which the `Node` key refuses.
   */
  readonly repeated: ReadonlySet<Row>;
  /**
   * The document's root element, its document node's first element child by slot, none when the
   * rows hold no element under the document node.
   */
  readonly root: Option.Option<Row>;
  readonly rows: FoldedRows<Composed>;
  readonly self: NodeId;
  /**
   * The node rows whose `start` an earlier row of the document already holds, which T1's key
   * refuses.
   */
  readonly startTaken: ReadonlySet<Row>;
  /**
   * The character data of each text, whitespace and doctype node, by node.
   */
  readonly textOf: ReadonlyMap<NodeId, string>;
  /**
   * Each element's closed attributes that hold a value, by name, each value as its type reads it
   * ({@link TypedReading}): an attribute whose form lies outside its domain is not here.
   */
  readonly typedValuesOf: ReadonlyMap<NodeId, ReadonlyMap<string, string>>;
  readonly valuesOf: ReadonlyMap<NodeId, ReadonlyMap<string, string>>;
}

/**
 * The XML whitespace characters the `collapse` class turns to spaces.
 */
const xmlWhitespace = /[\t\n\r]/gu;

/**
 * Collapse a lexical form: XML Schema's `collapse` whitespace class, which every name, number and
 * identifier an overlay law reads is read under. A value domain's own pattern absorbs its class
 * (`#pantry/grammar/domains.ts`), so the domain laws read the form as written.
 *
 * @param lexical - The form as read.
 * @returns The form with tabs, line feeds and carriage returns as spaces, each run of spaces made
 *   one, and none at either end. No other character is whitespace to it, so a no-break space stays.
 * @see {@link https://www.w3.org/TR/xmlschema-2/#rf-whiteSpace | XML Schema Part 2, whiteSpace}
 */
export const collapsed = (lexical: string): string =>
  lexical
    .replaceAll(xmlWhitespace, " ")
    .replaceAll(/ +/gu, " ")
    .replace(/^ /u, "")
    .replace(/ $/u, "");

/**
 * Key a slot of a family.
 *
 * @param owner - The family's owner.
 * @param at - The slot.
 * @returns One string per (owner, slot).
 */
export const slotKey = (owner: NodeId, at: bigint): string => `${owner} ${String(at)}`;

/**
 * Group rows by the node that owns them, keeping their order within each group.
 *
 * @param rows - The rows.
 * @param ownerOf - The id of a row's owner.
 * @returns Each owner's rows, in the order they came.
 */
export const grouped = <Owned>(
  rows: readonly Owned[],
  ownerOf: (row: Owned) => NodeId,
): ReadonlyMap<NodeId, readonly Owned[]> => {
  const groups = new Map<NodeId, Owned[]>();
  for (const row of rows) {
    const owner = ownerOf(row);
    const group = groups.get(owner);
    if (group === undefined) {
      groups.set(owner, [row]);
    } else {
      group.push(row);
    }
  }

  return groups;
};

/**
 * Whether an `AttributeName` handle is an open class, whose many names share one code.
 *
 * @param name - The handle.
 * @returns Whether it is `data-*`, `foreign`, `no-namespace` or `own-namespace`.
 */
export const isOpenClass = (name: string): boolean => openClasses.some((open) => open === name);

/**
 * Keep an `AttributeName` handle when it names one attribute.
 *
 * @param name - An `AttributeName` handle.
 * @returns The handle, or none for an open class.
 */
export const closedNameOf = (name: Composed["name"]): Option.Option<ClosedName<Composed>> =>
  Option.liftPredicate(name, (held): held is ClosedName<Composed> => !isOpenClass(held));

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
const isElement = (node: Row): boolean => !characterKinds.has(node.kind);

/**
 * Order rows by their slot in their family.
 *
 * @param left - One row.
 * @param right - The other.
 * @returns Their order.
 */
const bySlotOrder = (left: Row, right: Row): number => Number(left.at - right.at);

/**
 * Index a document's folded rows for the laws.
 *
 * @param path - The document's path in its package.
 * @param rows - Its folded rows.
 * @param typed - How an attribute's type reads its value.
 * @returns The view.
 */
export const viewOf = (path: string, rows: FoldedRows<Composed>, typed: TypedReading): View => {
  const self = rows.document.node;
  const members = rows.nodes.filter(({ start }) => start > 0n);
  const attributesOf = grouped(rows.attributes, ({ node }) => node);
  const closedValues = (read: TypedReading) =>
    new Map(
      [...attributesOf].map(([node, owned]) => [
        node,
        new Map(
          owned.flatMap((attribute) =>
            Option.toArray(closedNameOf(attribute.name)).flatMap((name) =>
              Option.toArray(read(attribute)).map((value) => [name, value] as const),
            ),
          ),
        ),
      ]),
    );
  const valuesOf = closedValues((attribute) => Option.some(attribute.lexical));
  const byId = new Map<NodeId, Row>();
  const repeated = new Set<Row>();
  const starts = new Set<bigint>();
  const startTaken = new Set<Row>();
  for (const node of rows.nodes) {
    if (byId.has(node.id)) {
      repeated.add(node);
    } else {
      byId.set(node.id, node);
    }

    if (starts.has(node.start)) {
      startTaken.add(node);
    }

    starts.add(node.start);
  }

  const childrenOf = grouped(members, ({ parent }) => parent);

  return {
    attributesOf,
    byId,
    bySlot: new Map(members.map((node) => [slotKey(node.parent, node.at), node])),
    childrenOf,
    entityOf: new Map(rows.entityRefs.map(({ name, node }) => [node, name])),
    foreignNamespaceOf: new Map(
      rows.openElementNames.map(({ namespace, node }) => [node, namespace]),
    ),
    members,
    openNameOf: new Map(rows.openNames.map((row) => [row.attribute, row])),
    path,
    repeated,
    root: Option.fromNullishOr((childrenOf.get(self) ?? []).toSorted(bySlotOrder).find(isElement)),
    rows,
    self,
    startTaken,
    textOf: new Map(
      [...rows.texts, ...rows.whitespace, ...rows.doctypes].map(({ node, value }) => [node, value]),
    ),
    typedValuesOf: closedValues(typed),
    valuesOf,
  };
};

/**
 * Read an element's closed attribute as written.
 *
 * @param view - The document.
 * @param node - The element's id.
 * @param name - The attribute's closed name.
 * @returns Its lexical form, or none when the element carries no such attribute.
 */
export const valueOf = (view: View, node: NodeId, name: string): Option.Option<string> =>
  Option.fromNullishOr(view.valuesOf.get(node)?.get(name));

/**
 * Read an element's closed attribute as its type reads it ({@link TypedReading}): the form every
 * law past AL1 compares an identifier, a number or a code in.
 *
 * @param view - The document.
 * @param node - The element's id.
 * @param name - The attribute's closed name.
 * @returns Its value, or none when the element carries no such attribute or its form lies outside
 *   its value domain.
 */
export const typedValueOf = (view: View, node: NodeId, name: string): Option.Option<string> =>
  Option.fromNullishOr(view.typedValuesOf.get(node)?.get(name));

/**
 * The decimal digits, each with its value.
 */
const digitValues: ReadonlyMap<string, bigint> = new Map(
  Array.from({ length: 10 }, (_, value) => [String(value), BigInt(value)] as const),
);

/**
 * Read an `xs:integer` form as its value: the oracle's own lexical mapping, apart from the
 * import's. XML Schema 1.1 Part 2 §3.3.13 states the lexical space, an optional sign and one or
 * more digits, and the value the digits name, negated after a `-`. A zero is zero whatever its sign
 * or its leading zeros, so `0`, `+0`, `-0` and `00` all read 0 (§3.3.20, nonNegativeInteger's
 * lexical space admits `-0`). The form is the one {@link typedValueOf} gives, after the type's
 * whitespace class.
 *
 * @param form - The form.
 * @returns Its value, or none where the form is no `xs:integer`'s.
 */
export const integerOf = (form: string): Option.Option<bigint> => {
  const negative = form.startsWith("-");
  const body = negative || form.startsWith("+") ? form.slice(1) : form;
  let magnitude = 0n;
  for (const digit of body) {
    const value = digitValues.get(digit);
    if (value === undefined) {
      return Option.none();
    }

    magnitude = magnitude * 10n + value;
  }

  if (body.length === 0) {
    return Option.none();
  }

  return Option.some(negative ? -magnitude : magnitude);
};

/**
 * Read an element's closed attribute as its type reads it ({@link typedValueOf}), and a value
 * where the element does not write it: what a law past AL1 reads of an attribute that has a
 * meaning when unwritten.
 *
 * @param view - The document.
 * @param node - The element's id.
 * @param name - The attribute's closed name.
 * @param unwritten - What the law reads where the element writes no such attribute.
 * @returns Its value, or `unwritten`; none where the element writes it outside its value domain,
 *   a form no law past AL1 reads.
 */
export const typedOr = (
  view: View,
  node: NodeId,
  name: string,
  unwritten: string,
): Option.Option<string> =>
  Option.isNone(valueOf(view, node, name))
    ? Option.some(unwritten)
    : typedValueOf(view, node, name);

/**
 * Read an element's text content: its text and whitespace children's characters, in order.
 *
 * @param view - The document.
 * @param node - The element's id.
 * @returns The characters, empty when it holds none.
 */
export const contentOf = (view: View, node: NodeId): string =>
  (view.childrenOf.get(node) ?? []).map(({ id }) => view.textOf.get(id) ?? "").join("");

/**
 * List an element's element children in slot order.
 *
 * @param view - The document.
 * @param node - The element's id.
 * @returns Its children that are elements.
 */
export const elementsOf = (view: View, node: NodeId): readonly Row[] =>
  (view.childrenOf.get(node) ?? []).filter(isElement).toSorted(bySlotOrder);

/**
 * Follow parent links up from a node: the node, then each parent in turn, ending after the first
 * node at start 0, the document node. The walk stops before a node it has already met, so a cycle
 * of parent links, which T3 and T4 refuse, ends rather than growing without bound.
 *
 * @param view - The document.
 * @param start - The node to start at, none for no chain.
 * @param met - The ids the walk is not to enter again.
 * @returns The chain, nearest first.
 */
export const chainFrom = (
  view: View,
  start: Row | undefined,
  met: ReadonlySet<NodeId> = new Set(),
): readonly Row[] => {
  const chain: Row[] = [];
  const seen = new Set(met);
  let at = start;
  while (at !== undefined && !seen.has(at.id)) {
    seen.add(at.id);
    chain.push(at);
    at = at.start > 0n ? view.byId.get(at.parent) : undefined;
  }

  return chain;
};

/**
 * Write where a node sits in its document: each step from the document node down, as
 * `kind[at]`.
 *
 * @param view - The document.
 * @param id - The node's id.
 * @returns The path, `/` for the document node; on a cycle of parent links, the steps up to the
 *   first node met twice.
 */
export const pathOf = (view: View, id: NodeId): string =>
  `/${chainFrom(view, view.byId.get(id))
    .filter(({ start }) => start > 0n)
    .map((at) => `${at.kind}[${String(at.at)}]`)
    .toReversed()
    .join("/")}`;

/**
 * The ancestors of a node, nearest first, the document node last.
 *
 * @param view - The document.
 * @param node - The node.
 * @returns Its ancestors; on a cycle of parent links, those up to the first node met twice.
 */
export const ancestorsOf = (view: View, node: Row): readonly Row[] =>
  node.start > 0n ? chainFrom(view, view.byId.get(node.parent), new Set([node.id])) : [];

/**
 * Make a producer's breach of a node: its document, its node's path, kind and version, and the
 * keys its law reads.
 *
 * @param view - The document.
 * @param node - The node where the law broke.
 * @param law - The law.
 * @param keys - The keys of the failing row the law's explanation reads.
 * @returns The breach.
 */
export const breachAt = <Law extends string>(
  view: View,
  node: Row,
  law: Law,
  keys: Readonly<Record<string, string>> = {},
): LawBreach<Law> => ({
  document: view.path,
  keys: { kind: node.kind, node: pathOf(view, node.id), version: node.version, ...keys },
  law,
});

/**
 * An href resolved as the package laws read it (readings 102 and 103): its resolution by the
 * oracle's own resolver (`#pantry/test/resolution.ts`), and the path it is compared by, the entry
 * path in the package and its path as read otherwise.
 */
export interface ResolvedHref {
  readonly path: string;
  readonly resolution: OracleResolution;
}

/**
 * Read the `xml:base` values in scope at a node, outermost first: its ancestors' and its own (an
 * element's other attributes resolve against its own `xml:base`).
 *
 * @param view - The document.
 * @param node - The node.
 * @returns The bases, the root's first.
 */
const basesAt = (view: View, node: NodeId): readonly string[] =>
  chainFrom(view, view.byId.get(node))
    .toReversed()
    .flatMap(({ id }) => Option.toArray(valueOf(view, id, "xml:base")));

/**
 * Resolve an attribute of a node as an href (readings 102 and 103), with the `xml:base` values in
 * scope at the node, by the oracle's own resolver.
 *
 * @param view - The node's document.
 * @param node - The node.
 * @param lexical - The attribute's lexical form.
 * @param read - How the value is read: its type's whitespace class, an `xs:anyURI`'s `collapse`
 *   unless given, and whether it is a `srcset`.
 * @param read.whiteSpace - The class.
 * @param read.srcset - Whether the attribute is a `srcset`.
 * @returns The href resolved.
 */
export const resolvedAt = (
  view: View,
  node: NodeId,
  lexical: string,
  read: { readonly srcset?: boolean; readonly whiteSpace?: OracleWhiteSpace } = {},
): ResolvedHref => {
  const whiteSpace = read.whiteSpace ?? "collapse";
  const resolution = resolveAttribute({
    bases: basesAt(view, node),
    document: view.path,
    lexical,
    srcset: read.srcset ?? false,
    whiteSpace,
  });

  return { path: comparedPath(resolution, oracleValueOf(lexical, whiteSpace)), resolution };
};

/**
 * Resolve an element's `href` as a package path (readings 102 and 103): its `xs:anyURI` value
 * collapsed and resolved against its document's path and the `xml:base` values in scope, and the
 * path it is compared by.
 *
 * @param view - The document.
 * @param node - The element.
 * @returns The path, none where the element writes no href.
 */
export const hrefPathOf = (view: View, node: Row): Option.Option<string> =>
  Option.map(valueOf(view, node.id, "href"), (lexical) => resolvedAt(view, node.id, lexical).path);

/**
 * One document a package's manifest lists, as the package-level producers read it: its path, the
 * `type` of the resource that lists it as written, and its own rows as folded, an include not
 * spliced in.
 */
export interface ListedRows {
  readonly path: string;
  readonly resourceType: string;
  readonly rows: View;
}

/**
 * A package as the package-level producers read it: its manifest, the documents it lists that
 * folded, in manifest order, its entries' paths, and `spliced`, each listed document's path with
 * the paths of the documents its includes splice in place (spec reading 117), as the oracle's
 * `standsFor` reads an include: under a parent whose include splices its fragment, and standing for
 * that fragment's root.
 */
export interface PackageRows {
  readonly documents: readonly ListedRows[];
  readonly entries: ReadonlySet<string>;
  readonly manifest: View;
  readonly spliced: ReadonlyMap<string, readonly string[]>;
}

/**
 * The laws a content reference breaks where its name resolves to no variable it may name (the
 * oracle's laws `Context variable reference`, `Feedback reference`, `Printed variable reference`
 * and `Template reference`).
 */
export type ContentLaw =
  | "Context variable reference"
  | "Feedback reference"
  | "Printed variable reference"
  | "Template reference";

/**
 * The law a content reference breaks, by the attribute that makes it: a feedback element's
 * outcome (`feedback-ref`), a template element's or choice's template variable (`template-ref`),
 * and what a printed variable prints or indexes by (`printed-variable-ref`).
 */
const contentLaws: ReadonlyMap<string, ContentLaw> = new Map([
  ["base", "Printed variable reference"],
  ["identifier", "Printed variable reference"],
  ["index", "Printed variable reference"],
  ["outcome-identifier", "Feedback reference"],
  ["template-identifier", "Template reference"],
]);

/**
 * The law a content reference breaks where its kind decides it rather than its attribute: a
 * portable custom interaction's context variable (`context-variable-ref`), whose `identifier` is
 * also a printed variable's attribute.
 */
const contentKindLaws: ReadonlyMap<string, ContentLaw> = new Map([
  ["qti-context-variable", "Context variable reference"],
]);

/**
 * Name the law a content reference breaks: its kind's, else its attribute's. The item's overlay
 * laws (`#pantry/test/oracle.ts`) and a test's assembly (`#pantry/test/oracle-laws/tests.ts`) name
 * it alike.
 *
 * @param kind - The kind of the element that makes the reference.
 * @param attribute - The attribute it makes it by.
 * @returns The law, none for a reference no law reads.
 */
export const contentLawOf = (kind: string, attribute: string): Option.Option<ContentLaw> =>
  Option.orElse(Option.fromNullishOr(contentKindLaws.get(kind)), () =>
    Option.fromNullishOr(contentLaws.get(attribute)),
  );

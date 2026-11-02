/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */

/**
 * The tree-level half of the importer: the rows every tree has beside its nodes, the lookup that
 * names an element's kind, the refusal for vocabulary no registry models, the refusal for an item
 * whose bindings do not hold together, the walk that pairs every element with its parent, and the
 * whitespace helpers every typed attribute passes through.
 *
 * {@link treeRows} also walks the root and writes every tree's node, edge, generic-arm, namespace
 * and attribute-reference rows; the kind-specific arms and typed attribute columns belong to the
 * modules that read the {@link NodeIndex} it returns.
 */
import type { AnyRelation, Fact } from "@bjornpagen/grizzle";
import { Effect, Option, Schema } from "effect";
import type { RegistryRow } from "#qti/schema/kinds/generic.ts";
import {
  Ancestry,
  AttributeEntityReference,
  AttributeLexical,
  Comment,
  Edge,
  EntityReference,
  NamespaceDeclaration,
  Node,
  NodeKind,
  Pi,
  SchemaLocation,
  TextNode,
  Tree,
  TreeDoctype,
  TreeExportCharset,
  TreeMisc,
  TreeRoot,
  TreeXmlEncoding,
  TreeXmlStandalone,
  TreeXmlVersion,
  vocabularies,
  Ws,
} from "#qti/schema/node.ts";
import type {
  AncestryHandle,
  AttributeNameHandle,
  NodeKindHandle,
  RootKindHandle,
  SchemaVersionHandle,
} from "#qti/schema/node.ts";
import * as patterns from "#qti/schema/patterns.ts";
import { FLAGS, handleOf, KindEnters } from "#qti/schema/seed/ancestry.ts";
import type { Flag } from "#qti/schema/seed/ancestry.ts";
import { exportCharset } from "#qti/xml/charset.ts";
import type { Child, Element, Misc, XmlDocument } from "#qti/xml/tree.ts";

/**
 * The rows an import has built so far, by relation.
 *
 * Every import module appends to one of these and hands the result on; no function mutates the
 * map it is given.
 */
// oxlint-disable-next-line eslint/no-redeclare -- `Rows` is a type and the value of its functions under one name, so `Rows.empty()` and `Rows` as a parameter type read as one thing.
export type Rows = ReadonlyMap<AnyRelation, readonly object[]>;

/**
 * The functions over {@link Rows}.
 */
export const Rows = {
  /**
   * Append `facts` to `relation`'s rows.
   *
   * @param rows - The rows so far, left unchanged.
   * @param relation - The relation the facts belong to.
   * @param facts - The facts to append after the relation's existing rows.
   * @returns A new set of rows holding the facts.
   */
  add: <R extends AnyRelation>(rows: Rows, relation: R, facts: readonly Fact<R>[]): Rows =>
    new Map(rows).set(relation, [...(rows.get(relation) ?? []), ...facts]),

  /**
   * No rows.
   */
  empty: (): Rows => new Map(),

  /**
   * Read `relation`'s rows.
   *
   * The map stores each relation's rows under the relation they were added for, and `add` takes
   * only that relation's facts, so the rows read back are the facts of `relation`.
   *
   * @param rows - The rows so far.
   * @param relation - The relation to read.
   * @returns Its rows in the order they were added, none when it has none.
   */
  of: <R extends AnyRelation>(rows: Rows, relation: R): readonly Fact<R>[] =>
    // SAFETY: the map is heterogeneous by relation and `add` is its only writer, which types each relation's facts, so the rows under `relation` are its facts.
    // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
    (rows.get(relation) ?? []) as readonly Fact<R>[],
};

/**
 * What the walk keeps of an element's node: its id, its kind, and the ancestry it sits in.
 */
export interface IndexedNode {
  readonly ancestry: AncestryHandle;
  readonly id: string;
  readonly kind: NodeKindHandle;
}

/**
 * The node each element of a tree became, keyed by the tree's own `Element` objects by identity, so
 * later modules attach arm rows to the elements they walk.
 */
export type NodeIndex = ReadonlyMap<Element, IndexedNode>;

/**
 * What the caller of {@link treeRows} decides about a tree: its id, which is also its root node's
 * id, whether it is a document or a manifest, its schema version, its root kind and the charset its
 * bytes were decoded from.
 */
export interface TreeInput {
  readonly charset: string;
  readonly id: string;
  readonly kind: "document" | "manifest";
  readonly root: RootKindHandle;
  readonly version: SchemaVersionHandle;
}

/**
 * The document holds an element or an attribute that no kinds file models yet.
 *
 * `name` is the qualified name as written; for an attribute `parent` is the element that carries it
 * and for an element it is the enclosing element, `None` for the root.
 */
export class UnmodeledVocabulary extends Schema.TaggedError<UnmodeledVocabulary>()(
  "UnmodeledVocabulary",
  {
    kind: Schema.Literals(["element", "attribute"]),
    name: Schema.String,
    parent: Schema.Option(Schema.String),
  },
) {}

/**
 * An item the importer reads but whose bindings do not hold together.
 *
 * `rule` names the importer rule the item breaks and `detail` says which part of the item does. The
 * rule may be a schema law's name when the importer meets that law first, as `ancestry-ban` for a
 * gap that has no gap-match interaction to own it, and `admission` for a choice-like child that
 * no interaction owns.
 */
export class ItemRefusal extends Schema.TaggedError<ItemRefusal>()("ItemRefusal", {
  detail: Schema.String,
  rule: Schema.Literals(["binding-declared", "typed-copy", "ancestry-ban", "admission"]),
}) {}

/**
 * Every element of `element`'s subtree beside its parent element, in document order.
 */
export const withParents = (
  element: Element,
  parent: Option.Option<Element>,
): readonly (readonly [Element, Option.Option<Element>])[] => [
  [element, parent],
  ...element.children.flatMap((child) =>
    child.kind === "element" ? withParents(child, Option.some(element)) : [],
  ),
];

/**
 * How an attribute's lexical value becomes its typed value: kept, with its tab, line feed and
 * carriage return characters turned to spaces, or collapsed like an `xs:token`.
 */
export type WhiteSpace = "preserve" | "replace" | "collapse";

/**
 * Turn each tab, line feed and carriage return into a space.
 *
 * @param s - The lexical value.
 * @returns The value with every such character replaced by one space.
 */
export const replace = (s: string): string => s.replaceAll(/[\t\n\r]/gu, " ");

/**
 * Apply the `xs:token` whitespace collapse: replace, then remove leading and trailing spaces, then
 * make each run of spaces one space.
 *
 * @param s - The lexical value.
 * @returns The collapsed value.
 */
export const collapse = (s: string): string =>
  replace(s).replaceAll(/ +/gu, " ").replaceAll(/^ | $/gu, "");

/**
 * The value a typed column holds for `lexical` under `whiteSpace`.
 */
const processed = (lexical: string, whiteSpace: WhiteSpace): string => {
  if (whiteSpace === "collapse") {
    return collapse(lexical);
  }

  return whiteSpace === "replace" ? replace(lexical) : lexical;
};

/**
 * Process one typed attribute's lexical value and keep the lexical form when processing changed it.
 *
 * @param rows - The rows so far.
 * @param node - The id of the element that carries the attribute.
 * @param kind - The element's kind.
 * @param name - The attribute's registry name.
 * @param lexical - The value as read.
 * @param whiteSpace - The attribute's whitespace class.
 * @returns The value for the typed column, and the rows with one `AttributeLexical` row appended
 *   exactly when `lexical` differs from that value.
 */
export const typedAttribute = (
  rows: Rows,
  node: string,
  kind: NodeKindHandle,
  name: AttributeNameHandle,
  lexical: string,
  whiteSpace: WhiteSpace,
): { value: string; rows: Rows } => {
  const value = processed(lexical, whiteSpace);

  return value === lexical
    ? { rows, value }
    : {
        rows: Rows.add(rows, AttributeLexical, [{ attribute: name, kind, node, value: lexical }]),
        value,
      };
};

const xmlnsNamespace = "http://www.w3.org/2000/xmlns/";

const xmlNamespace = "http://www.w3.org/XML/1998/namespace";

const xsiNamespace = "http://www.w3.org/2001/XMLSchema-instance";

/**
 * A kind an element name can stand for, and the kind its parent must be when the handle is dotted.
 */
interface Candidate {
  readonly handle: NodeKindHandle;
  readonly parent: Option.Option<string>;
}

/**
 * The element-kind registry rows by handle, from the six kinds files; the generic kinds are not
 * elements and are left out.
 */
const rowsByHandle: ReadonlyMap<string, RegistryRow> = new Map(
  vocabularies
    .flatMap((vocabulary) => Object.entries<RegistryRow>(vocabulary.registry))
    .filter(([, row]) => row.local !== ""),
);

/**
 * The `Ancestry` handle a flag set is named by, `None` when the set is one no tree can reach.
 */
const ancestryOf = (flags: readonly Flag[]): Option.Option<AncestryHandle> =>
  Option.fromNullishOr(Ancestry.handles.find((handle) => handle === handleOf(flags)));

/**
 * The flags in force under an element of `kind` that sits inside `flags`: those it sits inside and
 * the ones its kind enters.
 */
const enteredBy = (flags: readonly Flag[], kind: NodeKindHandle): readonly Flag[] =>
  FLAGS.filter((flag) => flags.includes(flag) || (KindEnters[kind] ?? []).includes(flag));

const clark = (namespace: string, local: string): string => `{${namespace}}${local}`;

/**
 * The candidates of each `(namespace, local)` pair, built once from the registries.
 */
const candidates: ReadonlyMap<string, readonly Candidate[]> = (() => {
  const byName = new Map<string, Candidate[]>();
  for (const [key, row] of rowsByHandle) {
    const handle = NodeKind.handles.find((known) => known === key);
    if (handle !== undefined) {
      const name = clark(row.namespace, row.local);
      byName.set(name, [...(byName.get(name) ?? []), { handle, parent: row.parent }]);
    }
  }

  return byName;
})();

/**
 * The kind an element is, looked up by its namespace and local name; a dotted handle is chosen by
 * the kind of the element's parent.
 *
 * @param element - The element to classify.
 * @param parentKind - The kind of its parent, `None` for the root.
 * @returns The element's kind, `None` when no registry names it under that parent.
 */
export const kindOf = (
  element: Element,
  parentKind: Option.Option<NodeKindHandle>,
): Option.Option<NodeKindHandle> => {
  const named = candidates.get(clark(element.namespace, element.local)) ?? [];
  const dotted = named.find(
    (candidate) =>
      Option.isSome(candidate.parent) &&
      Option.isSome(parentKind) &&
      candidate.parent.value === parentKind.value,
  );
  const plain = named.find((candidate) => Option.isNone(candidate.parent));

  return Option.fromNullishOr((dotted ?? plain)?.handle);
};

/**
 * The first element or attribute of `element`'s subtree that no registry models, in document order.
 * An attribute in the XML namespace is modeled when its kind's registry lists its prefixed name
 * (`xml:lang`, `xml:base`); any other `xml:` name is not.
 * An element whose ancestry no `Ancestry` handle names is refused as an element: it sits inside a
 * combination of flags the model cannot hold.
 */
const firstUnmodeled = (
  element: Element,
  parent: Option.Option<{ readonly kind: NodeKindHandle; readonly name: string }>,
  flags: readonly Flag[],
): Option.Option<UnmodeledVocabulary> => {
  const kind = kindOf(element, parent.pipe(Option.map((above) => above.kind)));
  if (Option.isNone(kind) || Option.isNone(ancestryOf(flags))) {
    return Option.some(
      new UnmodeledVocabulary({
        kind: "element",
        name: element.qname,
        parent: parent.pipe(Option.map((above) => above.name)),
      }),
    );
  }

  const own = new Set(rowsByHandle.get(kind.value)?.attributes);
  const stray = element.attributes.find(
    (attribute) =>
      attribute.namespace !== xmlnsNamespace &&
      !(attribute.namespace === xsiNamespace && attribute.local === "schemaLocation") &&
      !(attribute.namespace === "" && own.has(attribute.local)) &&
      !(attribute.namespace === xmlNamespace && own.has(`xml:${attribute.local}`)),
  );
  if (stray !== undefined) {
    return Option.some(
      new UnmodeledVocabulary({
        kind: "attribute",
        name: stray.qname,
        parent: Option.some(element.qname),
      }),
    );
  }

  const here = Option.some({ kind: kind.value, name: element.qname });
  const inside = enteredBy(flags, kind.value);
  for (const child of element.children) {
    if (child.kind === "element") {
      const found = firstUnmodeled(child, here, inside);
      if (Option.isSome(found)) {
        return found;
      }
    }
  }

  return Option.none();
};

/**
 * The rows the walk of a tree's root collects, one list per relation, filled as it descends.
 */
interface Walked {
  readonly attributeReferences: Fact<typeof AttributeEntityReference>[];
  readonly comments: Fact<typeof Comment>[];
  readonly edges: Fact<typeof Edge>[];
  readonly entityReferences: Fact<typeof EntityReference>[];
  readonly namespaces: Fact<typeof NamespaceDeclaration>[];
  readonly nodes: Fact<typeof Node>[];
  readonly pis: Fact<typeof Pi>[];
  readonly schemaLocations: Fact<typeof SchemaLocation>[];
  readonly texts: Fact<typeof TextNode>[];
  readonly whitespace: Fact<typeof Ws>[];
}

const nonWhitespace = /[^ \t\r\n]/u;

/**
 * Whether `value` is a non-empty run of whitespace, the shape `Ws` holds.
 */
const isWhitespaceRun = (value: string): value is Fact<typeof Ws>["value"] =>
  /^[ \t\r\n]+$/u.test(value);

/**
 * Write the rows of one child of an element, or of the root, and for an element everything under it
 * in document order.
 *
 * The caller has checked the whole tree against the registries, so every element has a kind; one
 * that does not is a bug in that check, and is skipped here along with its subtree rather than
 * given a row.
 */
const walk = (
  child: Child,
  parent: Option.Option<{
    readonly ancestry: AncestryHandle;
    readonly flags: readonly Flag[];
    readonly id: string;
    readonly kind: NodeKindHandle;
  }>,
  position: number,
  input: TreeInput,
  walked: Walked,
  index: Map<Element, IndexedNode>,
): void => {
  const common = { tree: input.id, version: input.version };
  const id = Option.isNone(parent) ? input.id : crypto.randomUUID();
  const flags = parent.pipe(
    Option.map((above) => above.flags),
    Option.getOrElse((): readonly Flag[] => []),
  );
  const sitsAt = ancestryOf(flags);
  if (Option.isNone(sitsAt)) {
    return;
  }

  const { value: ancestry } = sitsAt;
  let kind: NodeKindHandle;
  let prefix = "";

  if (child.kind === "element") {
    const found = kindOf(child, parent.pipe(Option.map((above) => above.kind)));
    if (Option.isNone(found)) {
      return;
    }

    kind = found.value;
    ({ prefix } = child);
    index.set(child, { ancestry, id, kind });
  } else if (Option.isNone(parent)) {
    return;
  } else if (child.kind === "text") {
    if (nonWhitespace.test(child.value)) {
      kind = "text";
      walked.texts.push({ id, value: child.value });
    } else if (isWhitespaceRun(child.value)) {
      kind = "ws";
      walked.whitespace.push({ id, value: child.value });
    } else {
      // An empty run holds no character to keep; the reader does not produce one.
      return;
    }
  } else if (child.kind === "comment") {
    kind = "comment";
    walked.comments.push({ id, text: child.text });
  } else if (child.kind === "pi") {
    kind = "pi";
    walked.pis.push({ data: child.data, id, target: child.target });
  } else {
    kind = "entityRef";
    walked.entityReferences.push({ id, name: child.name });
  }

  walked.nodes.push({ ...common, ancestry, id, kind, prefix, rootKind: input.root });
  if (Option.isSome(parent)) {
    walked.edges.push({
      ...common,
      child: id,
      childAncestry: ancestry,
      childKind: kind,
      parent: parent.value.id,
      parentAncestry: parent.value.ancestry,
      parentKind: parent.value.kind,
      position: BigInt(position),
    });
  }

  if (child.kind !== "element") {
    return;
  }

  let declared = 0;
  for (const attribute of child.attributes) {
    if (attribute.namespace === xmlnsNamespace) {
      walked.namespaces.push({
        node: id,
        position: BigInt(declared),
        prefix: attribute.qname === "xmlns" ? "" : attribute.local,
        uri: attribute.value,
      });
      declared += 1;
    } else if (attribute.namespace === xsiNamespace && attribute.local === "schemaLocation") {
      walked.schemaLocations.push({ node: id, prefix: attribute.prefix, value: attribute.value });
    }

    for (const reference of attribute.references) {
      walked.attributeReferences.push({
        attribute: attribute.qname,
        name: reference.name,
        node: id,
        offset: BigInt(reference.offset),
      });
    }
  }

  const here = Option.some({ ancestry, flags: enteredBy(flags, kind), id, kind });
  for (const [childPosition, grandchild] of child.children.entries()) {
    walk(grandchild, here, childPosition, input, walked, index);
  }
};

const xmlVersion = new RegExp(patterns.xmlVersion, "u");

/**
 * Whether a declaration's version is one `TreeXmlVersion` holds; the reader refuses any other.
 */
const isXmlVersion = (value: string): value is `1.${number}` => xmlVersion.test(value);

/**
 * A prolog or epilog item as the `kind` and `text` of a `TreeMisc` row: a comment's text, and a
 * processing instruction as its target, then one space and its data when it has data.
 */
const miscRow = (item: Misc): { kind: "comment" | "pi"; text: string } =>
  item.kind === "comment"
    ? { kind: "comment", text: item.text }
    : { kind: "pi", text: item.data === "" ? item.target : `${item.target} ${item.data}` };

/**
 * Write the rows every tree has: its `Tree` row and the fidelity rows for its prolog, epilog,
 * declaration, doctype and export charset.
 *
 * The root node's id is the tree id; every other node gets a fresh uuid.
 *
 * The whole tree is checked against the registries before any row is written, so a vocabulary not
 * yet modeled is refused ahead of every other rule.
 *
 * @param doc - The tree as the reader gave it.
 * @param input - What the caller decides about the tree.
 * @param rows - The rows so far.
 * @returns The rows with this tree's added, and the node index holding every element; the node,
 *   edge and generic-arm rows, `TreeRoot`, the namespace declarations, the `xsi:schemaLocation` and
 *   the attribute entity references are among them; `UnmodeledVocabulary` for the first element or
 *   attribute no registry names. The XML-namespace names a kind's registry lists are modeled; their
 *   rows are `attributeRows`'s.
 */
export const treeRows = Effect.fn("import.treeRows")(function* treeRows(
  doc: XmlDocument,
  input: TreeInput,
  rows: Rows,
): Effect.fn.Return<{ rows: Rows; nodes: NodeIndex }, UnmodeledVocabulary> {
  const refusal = firstUnmodeled(doc.root, Option.none(), []);
  if (Option.isSome(refusal)) {
    return yield* refusal.value;
  }

  const { id } = input;
  const misc = (placement: "prolog" | "epilog", items: readonly Misc[]) =>
    items.map((item, position) => ({
      ...miscRow(item),
      placement,
      position: BigInt(position),
      tree: id,
    }));
  const exported = exportCharset(input.charset, doc);
  const { declaration } = doc;

  const declared = declaration
    .pipe(Option.map(({ version }) => version))
    .pipe(Option.filter(isXmlVersion));
  const encoding = declaration.pipe(Option.flatMap((found) => found.encoding));
  const standalone = declaration
    .pipe(Option.flatMap((found) => found.standalone))
    .pipe(Option.filter((value) => value === "yes" || value === "no"));
  const withTree = Rows.add(rows, Tree, [
    { charset: input.charset, id, kind: input.kind, root: input.root, version: input.version },
  ]);
  const withMisc = Rows.add(withTree, TreeMisc, [
    ...misc("prolog", doc.prolog),
    ...misc("epilog", doc.epilog),
  ]);
  const withVersion = Rows.add(
    withMisc,
    TreeXmlVersion,
    Option.match(declared, { onNone: () => [], onSome: (value) => [{ tree: id, value }] }),
  );
  const withEncoding = Rows.add(
    withVersion,
    TreeXmlEncoding,
    Option.match(encoding, { onNone: () => [], onSome: (value) => [{ tree: id, value }] }),
  );
  const withStandalone = Rows.add(
    withEncoding,
    TreeXmlStandalone,
    Option.match(standalone, { onNone: () => [], onSome: (value) => [{ tree: id, value }] }),
  );
  const withDoctype = Rows.add(
    withStandalone,
    TreeDoctype,
    Option.match(doc.doctype, { onNone: () => [], onSome: (text) => [{ text, tree: id }] }),
  );
  const withCharset = Rows.add(
    withDoctype,
    TreeExportCharset,
    exported === input.charset ? [] : [{ label: exported, tree: id }],
  );

  const walked: Walked = {
    attributeReferences: [],
    comments: [],
    edges: [],
    entityReferences: [],
    namespaces: [],
    nodes: [],
    pis: [],
    schemaLocations: [],
    texts: [],
    whitespace: [],
  };
  const nodes = new Map<Element, IndexedNode>();
  walk(doc.root, Option.none(), 0, input, walked, nodes);

  const rootNode = nodes.get(doc.root);

  const withNodes = Rows.add(withCharset, Node, walked.nodes);
  const withEdges = Rows.add(withNodes, Edge, walked.edges);
  const withTexts = Rows.add(withEdges, TextNode, walked.texts);
  const withWs = Rows.add(withTexts, Ws, walked.whitespace);
  const withComments = Rows.add(withWs, Comment, walked.comments);
  const withPis = Rows.add(withComments, Pi, walked.pis);
  const withEntities = Rows.add(withPis, EntityReference, walked.entityReferences);
  const withRoot = Rows.add(
    withEntities,
    TreeRoot,
    rootNode === undefined ? [] : [{ node: rootNode.id, tree: id }],
  );
  const withNamespaces = Rows.add(withRoot, NamespaceDeclaration, walked.namespaces);
  const withSchemaLocations = Rows.add(withNamespaces, SchemaLocation, walked.schemaLocations);
  const built = Rows.add(withSchemaLocations, AttributeEntityReference, walked.attributeReferences);

  return { nodes, rows: built };
});

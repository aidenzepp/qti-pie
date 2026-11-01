/* oxlint-disable unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown, so the rule's "call without new" reading does not apply. */

/**
 * The tree-level half of the importer: the rows every tree has beside its nodes, the lookup that
 * names an element's kind, the refusal for vocabulary no registry models, and the whitespace
 * helpers every typed attribute passes through.
 *
 * The node, edge and arm rows are added to {@link treeRows} by the slice that follows this one;
 * until then it validates the whole tree and returns an empty {@link NodeIndex}.
 */
import type { AnyRelation, Fact } from "@bjornpagen/grizzle";
import { Effect, Option, Schema } from "effect";
import type { RegistryRow } from "#qti/schema/kinds/generic.ts";
import {
  AttributeLexical,
  NodeKind,
  Tree,
  TreeDoctype,
  TreeExportCharset,
  TreeMisc,
  TreeXmlEncoding,
  TreeXmlStandalone,
  TreeXmlVersion,
  vocabularies,
} from "#qti/schema/node.ts";
import type {
  AttributeNameHandle,
  NodeKindHandle,
  RootKindHandle,
  SchemaVersionHandle,
} from "#qti/schema/node.ts";
import * as patterns from "#qti/schema/patterns.ts";
import { exportCharset } from "#qti/xml/charset.ts";
import type { Element, Misc, XmlDocument } from "#qti/xml/tree.ts";

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
 * The node each element of a tree became, keyed by the tree's own `Element` objects by identity, so
 * later modules attach arm rows to the elements they walk.
 */
export type NodeIndex = ReadonlyMap<
  Element,
  { readonly id: string; readonly kind: NodeKindHandle }
>;

/**
 * What the caller of {@link treeRows} decides about a tree: its id, whether it is a document or a
 * manifest, its schema version, its root kind and the charset its bytes were decoded from.
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
 */
const firstUnmodeled = (
  element: Element,
  parent: Option.Option<{ readonly kind: NodeKindHandle; readonly name: string }>,
): Option.Option<UnmodeledVocabulary> => {
  const kind = kindOf(element, parent.pipe(Option.map((above) => above.kind)));
  if (Option.isNone(kind)) {
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
      !(attribute.namespace === "" && own.has(attribute.local)),
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
  for (const child of element.children) {
    if (child.kind === "element") {
      const found = firstUnmodeled(child, here);
      if (Option.isSome(found)) {
        return found;
      }
    }
  }

  return Option.none();
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
 * The whole tree is checked against the registries before any row is written, so a vocabulary not
 * yet modeled is refused ahead of every other rule.
 *
 * @param doc - The tree as the reader gave it.
 * @param input - What the caller decides about the tree.
 * @param rows - The rows so far.
 * @returns The rows with this tree's added, and the node index (empty until node rows exist);
 *   `UnmodeledVocabulary` for the first element or attribute no registry names.
 */
export const treeRows = Effect.fn("import.treeRows")(function* treeRows(
  doc: XmlDocument,
  input: TreeInput,
  rows: Rows,
): Effect.fn.Return<{ rows: Rows; nodes: NodeIndex }, UnmodeledVocabulary> {
  const refusal = firstUnmodeled(doc.root, Option.none());
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
  const built = Rows.add(
    withDoctype,
    TreeExportCharset,
    exported === input.charset ? [] : [{ label: exported, tree: id }],
  );

  return { nodes: new Map(), rows: built };
});

/**
 * The queries of export: the walk of a tree's edges, the nodes of a tree with everything the
 * importer wrote for each attached, and the `Tree` row with the fidelity rows around it.
 *
 * They live apart from `read.ts` so that the author application's workload
 * (`#pantry/schema/logins.ts`) can name them without importing the module that opens a database
 * through that login.
 *
 * One rule places every stored relation: the first field of its primary key holds the id of the
 * node that owns the row, and a tree's id is its root node's. The relations are known as values
 * here, so the attachments are built through the run-time view of the builder
 * ({@link LooseBuilder}), whose assertions are the only places this module leaves grizzle's static
 * headings.
 */
import { arm, query, uuid, v } from "@bjornpagen/grizzle";
import type { AnyRelation } from "@bjornpagen/grizzle";
import { Predicate } from "effect";
import { Document } from "#pantry/schema/document.ts";
import { Edge, Node, Tree, TreeRoot } from "#pantry/schema/node.ts";
import { nodeArms as nodeArmsOfKind } from "#pantry/schema/qti.ts";
import { Author } from "#pantry/schema/roles.ts";

/**
 * A variable or term of a rule, which the run-time view only passes from one call to the next.
 */
interface Term {
  readonly term: true;
}

/**
 * The variables of a relation or of a parent, or the head of a `find`, by field name.
 */
type Terms = Readonly<Record<string, Term | undefined>>;

/**
 * What `find` finishes a rule with.
 */
interface Finished {
  readonly finished: true;
}

/**
 * A rule of the run-time view of the builder: its sources are relations known as values, so the
 * heading of each match is not stated.
 */
interface LooseRule {
  readonly match: (source: AnyRelation, bindings: Terms) => LooseRule;
  readonly find: (head: Terms) => Finished;
}

/**
 * How an attachment's child is delivered: every child, at most one, or the arm of one handle's
 * `Node` law.
 */
type Delivery = "array" | "option" | ReturnType<typeof arm<"kind", string>>;

/**
 * A query value of the run-time view, which attachments can be added to.
 */
export interface LooseQuery {
  readonly attach: (
    name: string,
    child: (parent: Terms) => LooseQuery,
    delivery: Delivery,
  ) => LooseQuery;
}

/**
 * `query(Author)` of the run-time view.
 */
interface LooseBuilder {
  readonly rule: (rule: (r: LooseRule) => Finished) => LooseQuery;
}

/**
 * `query(Author)` of the run-time view.
 */
// SAFETY: `query(Author)` is the builder the run-time view describes, whose `rule` takes a callback over its rule and returns the query value it finishes; only the static headings the view leaves out differ.
// oxlint-disable-next-line typescript/no-unsafe-type-assertion, anti-slop/no-chained-type-assertions -- The invariant is the SAFETY note above; the two types name the same builder, so no direct assertion compiles.
const looseBuilder = query(Author) as unknown as LooseBuilder;

/**
 * The variables of a relation of the run-time view, by field name.
 */
// SAFETY: `v` mints one variable per scalar field of the relation it is given, which the run-time view reads by field name.
// oxlint-disable-next-line typescript/no-unsafe-type-assertion, anti-slop/no-chained-type-assertions -- The invariant is the SAFETY note above; the two types name the same function, so no direct assertion compiles.
const looseVars = v as unknown as (source: AnyRelation) => Terms;

/**
 * The relations the importer writes: every stored relation but the seeded ones.
 */
const written: readonly AnyRelation[] = Author.write.map((name) => Author.relations[name]);

/**
 * The arms of `Node`, by the node kind handle each belongs to: the target of that handle's
 * `mirrors` law.
 */
const nodeArms: ReadonlyMap<string, AnyRelation> = new Map(Object.entries(nodeArmsOfKind));

/**
 * The names of the relations a node's attachments do not carry: `Node` and `Edge` are the walk's
 * own, the `Tree` row has its own query, and a package's entries and file contents belong to the
 * package, not to a tree.
 */
const notNodeOwned: ReadonlySet<string> = new Set([
  Edge.name,
  Node.name,
  Tree.name,
  "FileContent",
  "PackageEntry",
]);

/**
 * The names of a relation's fields, in column order.
 */
export const fieldNamesOf = (relation: AnyRelation): readonly string[] =>
  Predicate.isObject(relation.fields) ? Object.keys(relation.fields) : [];

/**
 * One attachment on a query: the relation it delivers, the field of that relation the parent's id
 * binds, and how the child is delivered.
 */
export interface Attachment {
  readonly delivery: Delivery;
  readonly name: string;
  readonly owner: string;
  readonly relation: AnyRelation;
}

/**
 * The first primary key field of a relation, through which a node or a tree owns its rows.
 */
const ownerOf = (relation: AnyRelation): string => relation.primaryKey[0] ?? "";

/**
 * The attachment of a relation a node owns beside its arm: one optional row when the owner is the
 * whole key and an array otherwise.
 */
const ownedBy = (relation: AnyRelation, owner: string): Attachment => ({
  delivery: relation.primaryKey.length === 1 ? "option" : "array",
  name: relation.name,
  owner,
  relation,
});

/**
 * The relations the arms of `Node` are, as a set.
 */
const armRelations: ReadonlySet<AnyRelation> = new Set(nodeArms.values());

/**
 * The attachments of a node: its `Edge` to its parent, the row of the arm its kind names, then
 * every other relation it owns. An arm's attachment is named by its handle, not its relation: a
 * relation can be the arm of several handles, and a heading's names are each used once.
 */
const nodeAttachments: readonly Attachment[] = [
  { delivery: "option", name: Edge.name, owner: "child", relation: Edge },
  ...[...nodeArms].map(([handle, relation]): Attachment => ({
    delivery: arm("kind", handle),
    name: handle,
    owner: ownerOf(relation),
    relation,
  })),
  ...written
    .filter(
      (relation) =>
        !notNodeOwned.has(relation.name) &&
        !armRelations.has(relation) &&
        ownerOf(relation) !== "tree",
    )
    .map((relation) => ownedBy(relation, ownerOf(relation))),
];

/**
 * The attachments of the `Tree` row: the relations keyed by the tree.
 */
export const treeAttachments: readonly Attachment[] = written
  .filter((relation) => ownerOf(relation) === "tree")
  .map((relation) => ownedBy(relation, "tree"));

/**
 * The child query of an attachment, correlated to the parent's `id`: its relation's rows whose
 * owner field is that id, each as its other fields.
 */
const childOf = (attached: Attachment) => (parent: Terms) =>
  looseBuilder.rule((r) => {
    const vars = looseVars(attached.relation);
    const head: Terms = Object.fromEntries(
      Object.entries(vars).filter(([field]) => field !== attached.owner),
    );

    return r.match(attached.relation, { ...head, [attached.owner]: parent["id"] }).find(head);
  });

/**
 * `base` with every attachment of `attached` added, in order.
 */
const attaching = (base: LooseQuery, attached: readonly Attachment[]): LooseQuery => {
  let current = base;
  for (const one of attached) {
    current = current.attach(one.name, childOf(one), one.delivery);
  }

  return current;
};

/**
 * The ids of the documents of a package, one row per document tree.
 */
export const documentIdsOf = query(Author).rule((r) => {
  const { id } = v(Document);

  return r.match(Document, { id, package: r.param("package", uuid) }).find({ id });
});

/**
 * Every node id of the tree `tree`, from its root node down: the root from `TreeRoot`, then the
 * children of each node found through `Edge`. A cycle in `Edge` ends the walk.
 */
export const subtree = query(Author).recursive("Subtree", {
  base: [
    (r) => {
      const { node } = v(TreeRoot);

      return r.match(TreeRoot, { node, tree: r.param("tree", uuid) }).find({ node });
    },
  ],
  rec: [
    (r, self) => {
      const { node } = v(self);
      const { child } = v(Edge);

      return r.match(self, { node }).match(Edge, { child, parent: node }).find({ node: child });
    },
  ],
  row: { node: uuid },
});

/**
 * The most attachments one query carries. grizzle compiles a query within a budget of 10,000 nodes,
 * and 85 attachments of this schema's relations fit while 90 do not, so the attachments of a node
 * are read by several queries of at most this many, each walking the tree again.
 */
const ATTACHMENTS_PER_QUERY = 30;

/**
 * `items` in runs of at most `size`, in order.
 */
const inRuns = <T>(items: readonly T[], size: number): readonly (readonly T[])[] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, run) =>
    items.slice(run * size, (run + 1) * size),
  );

/**
 * The runs of `nodeAttachments`, one per query of {@link nodeQueries}.
 */
export const nodeRuns: readonly (readonly Attachment[])[] = inRuns(
  nodeAttachments,
  ATTACHMENTS_PER_QUERY,
);

/**
 * The query of the nodes of the tree `tree`: each node's `Node` row, which the attachments of a run
 * hang on.
 */
const nodesRule = query(Author).rule((r) => {
  const walk = subtree.bind({ tree: r.param("tree", uuid) });
  const { node } = v(walk);
  const { ancestry, kind, prefix, rootKind, tree, version } = v(Node);

  return r
    .match(walk, { node })
    .match(Node, { ancestry, id: node, kind, prefix, rootKind, tree, version })
    .find({ ancestry, id: node, kind, prefix, rootKind, tree, version });
});

/**
 * {@link nodesRule} as the run-time view, which attachments can be added to.
 */
// SAFETY: a query value is the same value under either type; the run-time view leaves out only the static heading.
// oxlint-disable-next-line typescript/no-unsafe-type-assertion, anti-slop/no-chained-type-assertions -- The invariant is the SAFETY note above; the two types name the same value, so no direct assertion compiles.
const nodesOfTree = nodesRule as unknown as LooseQuery;

/**
 * The queries of the tree `tree`: each walks every node of the tree, delivers its `Node` row, and
 * attaches one run of the node's attachments: its `Edge`, the row of the arm its kind names and
 * every relation it owns. The reads are separate statements, yet they read one state: the store is
 * append-only (no stored relation is `mutable`, no code path deletes or puts), and a package is
 * written in one `db.apply`, so a tree `documentIdsOf` finds is committed whole. Revisit only if
 * the import is ever written in several applies.
 */
export const nodeQueries: readonly LooseQuery[] = nodeRuns.map((run) =>
  attaching(nodesOfTree, run),
);

/**
 * The query of the `Tree` row of the tree `tree`, which the fidelity rows hang on.
 */
const treeRule = query(Author).rule((r) => {
  const { charset, id, kind, root, version } = v(Tree);

  return r
    .match(Tree, { charset, id, kind, root, version })
    .where(r.eq(id, r.param("tree", uuid)))
    .find({ charset, id, kind, root, version });
});

/**
 * {@link treeRule} as the run-time view, which attachments can be added to.
 */
// SAFETY: a query value is the same value under either type; the run-time view leaves out only the static heading.
// oxlint-disable-next-line typescript/no-unsafe-type-assertion, anti-slop/no-chained-type-assertions -- The invariant is the SAFETY note above; the two types name the same value, so no direct assertion compiles.
const treeRow = treeRule as unknown as LooseQuery;

/**
 * The `Tree` row of the tree `tree`, with the fidelity rows around it attached.
 */
export const treeOf = attaching(treeRow, treeAttachments);

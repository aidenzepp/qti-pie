/**
 * The logins that open a connection: the author application and the programs it runs.
 *
 * The workload names every program the application runs, so that `grizzle generate` compiles each
 * and derives the indexes its access paths earn: the import, which inserts every relation the
 * author role writes from one row-list parameter each, and the export's reads, which
 * `#qti/export/queries.ts` builds.
 */
import { ChangeSet, login, query, v, workload } from "@bjornpagen/grizzle";
import type { AnyRelation } from "@bjornpagen/grizzle";
import { documentIdsOf, nodeQueries, treeOf } from "#qti/export/queries.ts";
import { Qti } from "#qti/schema/qti.ts";
import { Author } from "#qti/schema/roles.ts";

/**
 * A variable of a rule, which the run-time view only passes from one call to the next.
 */
interface Term {
  readonly term: true;
}

/**
 * The variables of a relation by field name, or the head of a `find`.
 */
type Terms = Readonly<Record<string, Term | undefined>>;

/**
 * A source a rule matches: a row-list parameter, which the run-time view only passes on.
 */
interface Source {
  readonly source: true;
}

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
  readonly match: (source: Source, bindings: Terms) => LooseRule;
  readonly find: (head: Terms) => Finished;
  readonly relation: (name: string, heading: AnyRelation) => Source;
}

/**
 * A query value of the run-time view.
 */
interface LooseQuery {
  readonly query: true;
}

/**
 * `query(Author)` of the run-time view.
 */
interface LooseBuilder {
  readonly rule: (rule: (r: LooseRule) => Finished) => LooseQuery;
}

/**
 * A `ChangeSet` over the author role of the run-time view, which inserts a relation's rows from a
 * query.
 */
interface LooseChangeSet {
  readonly insert: (relation: AnyRelation, facts: LooseQuery) => LooseChangeSet;
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
 * `ChangeSet.empty(Author)` of the run-time view.
 */
// SAFETY: `ChangeSet.empty(Author)` is the value the run-time view describes; `insert` takes a relation and a query whose head is that relation's heading, which a relation known only as a value cannot state.
// oxlint-disable-next-line typescript/no-unsafe-type-assertion, anti-slop/no-chained-type-assertions -- The invariant is the SAFETY note above; the two types name the same value, so no direct assertion compiles.
const emptyChanges = ChangeSet.empty(Author) as unknown as LooseChangeSet;

/**
 * The relations the importer writes: every stored relation the author role writes.
 */
const written: readonly AnyRelation[] = Author.write.map((name) => Author.relations[name]);

/**
 * The query that reads the rows of the row-list parameter named for `relation`, each as one fact of
 * the relation.
 */
const rowsOf = (relation: AnyRelation): LooseQuery =>
  looseBuilder.rule((r) => {
    const vars = looseVars(relation);

    return r.match(r.relation(relation.name, relation), vars).find(vars);
  });

/**
 * The import: one `ChangeSet` inserting each written relation's rows from a row-list parameter
 * named for the relation, so a caller binds `{ [relation.name]: facts }` and an empty list inserts
 * nothing.
 */
const importPackage = ((): LooseChangeSet => {
  let changes = emptyChanges;
  for (const relation of written) {
    changes = changes.insert(relation, rowsOf(relation));
  }

  return changes;
})();

/**
 * The programs the author application runs, by name: the import, the ids of a package's documents,
 * the `Tree` row with the fidelity rows around it, and the node reads, which are separate
 * statements of at most 30 attachments each (`#qti/export/queries.ts`).
 */
const programs = {
  importPackage,
  readTree: treeOf,
  treesOf: documentIdsOf,
  ...Object.fromEntries(nodeQueries.map((nodes, run) => [`readNodes${run + 1}`, nodes])),
};

// SAFETY: every program above is a `ChangeSet` or a query over the author role, which `workload` takes; the loose views leave out only their static headings.
// oxlint-disable-next-line typescript/no-unsafe-type-assertion, anti-slop/no-chained-type-assertions -- The invariant is the SAFETY note above; the two types name the same value, so no direct assertion compiles.
const authorPrograms = programs as unknown as Parameters<typeof workload<typeof Author, never>>[1];

export const authorWork = workload(Author, authorPrograms);

export const AuthorApp = login(Qti, "author_app", [Author], { workload: [authorWork] });

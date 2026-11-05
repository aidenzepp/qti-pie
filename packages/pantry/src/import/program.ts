/**
 * The import as one program of the author application's workload: a `ChangeSet` over `Author` that
 * inserts every relation the author role writes from a relation parameter named by the relation.
 * `importPackage` applies it with the rows an import built, each relation's rows under its name and
 * an empty list where the package holds none.
 *
 * The relations are known as values here, so every insert but the package's is built through the
 * run-time view of the builder ({@link ParameterRule}), and its assertions are the only places this
 * module leaves grizzle's static headings.
 *
 * @module
 */
import { ChangeSet, query, v } from "@bjornpagen/grizzle";
import type { AnyRelation } from "@bjornpagen/grizzle";
import type { Rows } from "#pantry/import/tree.ts";
import { Package } from "#pantry/schema/package.ts";
import { Author } from "#pantry/schema/roles.ts";

/**
 * A source of a rule of the run-time view: a relation parameter, which a rule matches like a table.
 */
interface Parameter {
  readonly parameter: true;
}

/**
 * A variable of a rule, which the run-time view only passes from one call to the next.
 */
interface Term {
  readonly term: true;
}

/**
 * The variables of a parameter, or the head of a `find`, by field name.
 */
type Terms = Readonly<Record<string, Term | undefined>>;

/**
 * What `find` finishes a rule with.
 */
interface Finished {
  readonly finished: true;
}

/**
 * A rule of the run-time view of the builder: its relation parameter's heading is a relation's
 * fields known as a value, so the heading of its match is not stated.
 */
interface ParameterRule {
  readonly relation: (name: string, fields: AnyRelation["fields"]) => Parameter;
  readonly match: (source: Parameter, bindings: Terms) => ParameterRule;
  readonly find: (head: Terms) => Finished;
}

/**
 * A query value of the run-time view, whose head is a relation's fields known as a value.
 */
interface ParameterQuery {
  readonly parameterQuery: true;
}

/**
 * `query(Author)` of the run-time view.
 */
interface ParameterBuilder {
  readonly rule: (rule: (r: ParameterRule) => Finished) => ParameterQuery;
}

/**
 * `query(Author)` of the run-time view.
 */
// SAFETY: `query(Author)` is the builder the run-time view describes, whose `rule` takes a callback over its rule and returns the query value it finishes; only the static headings the view leaves out differ.
// oxlint-disable-next-line typescript/no-unsafe-type-assertion, anti-slop/no-chained-type-assertions -- The invariant is the SAFETY note above; the two types name the same builder, so no direct assertion compiles.
const parameterBuilder = query(Author) as unknown as ParameterBuilder;

/**
 * The variables of a relation parameter of the run-time view, by field name.
 */
// SAFETY: `v` mints one variable per field of the relation parameter it is given, which the run-time view reads by field name.
// oxlint-disable-next-line typescript/no-unsafe-type-assertion, anti-slop/no-chained-type-assertions -- The invariant is the SAFETY note above; the two types name the same function, so no direct assertion compiles.
const parameterVars = v as unknown as (source: Parameter, name: string) => Terms;

/**
 * The package's own rows, from the relation parameter `Package`: the one insert whose heading is
 * stated, which every other insert's type stands in for.
 */
const packageRows = query(Author).rule((r) => {
  const rows = r.relation(Package.name, Package.fields);
  const { id, identifier, schemaversion } = v(rows, "row");

  return r.match(rows, { id, identifier, schemaversion }).find({ id, identifier, schemaversion });
});

/**
 * The rows of `relation`, from the relation parameter of its name.
 */
const parameterRows = (relation: AnyRelation): ParameterQuery =>
  parameterBuilder.rule((r) => {
    const rows = r.relation(relation.name, relation.fields);
    const row = parameterVars(rows, "row");

    return r.match(rows, row).find(row);
  });

/**
 * The relations the import writes, the package's own first: every stored relation but the seeded
 * ones.
 */
export const importedRelations: readonly AnyRelation[] = [
  Package,
  ...Author.write.map((name) => Author.relations[name]).filter((relation) => relation !== Package),
];

/**
 * One insert of the import program: `relation` from the relation parameter of its name, typed as
 * the package's insert, which stands for any of them.
 */
const insertOf = (relation: AnyRelation) => {
  // SAFETY: every relation here is one the author role writes, and `insert`'s per-relation write check cannot be told so of a relation known as a value; `Package` stands for any of them.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
  const target = relation as typeof Package;
  // SAFETY: the query reads the parameter of the relation's own name with the relation's own fields, so its head is the relation's facts; `packageRows`, the package's, stands for any of them.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion, anti-slop/no-chained-type-assertions -- The invariant is the SAFETY note above; the two types name the same kind of query value, so no direct assertion compiles.
  const rows = parameterRows(relation) as unknown as typeof packageRows;

  return { rows, target };
};

/**
 * The import program: one insert per relation of {@link importedRelations}, each from the relation
 * parameter of its name.
 */
let program = ChangeSet.empty(Author).insert(Package, packageRows);

for (const relation of importedRelations.slice(1)) {
  const { rows, target } = insertOf(relation);
  program = program.insert(target, rows);
}

export const importRows = program;

/**
 * The parameters of {@link importRows} for the rows an import built: each relation's facts under its
 * name, an empty list where `rows` holds none.
 *
 * @param rows - The rows the import built.
 * @returns One list of facts per imported relation, by relation name.
 */
export const importParameters = (rows: Rows): Readonly<Record<string, readonly object[]>> =>
  Object.fromEntries(
    importedRelations.map((relation) => [relation.name, rows.get(relation) ?? []]),
  );

/**
 * The queries `Qti` names over its stored level (`#pantry/qti/base.ts` `QtiBase`), and every rule
 * that reads one: grizzle's rules over queries (README, "Rules over queries"). Each query is a live
 * derived relation, `derived(name, query(QtiBase)…)`, which stores nothing: a rule over it reads
 * its definition as the tables stand at COMMIT, through a deferred constraint trigger on each table
 * the definition reads. A relation the database derives from what the import writes is a query
 * here, never a stored copy the import keeps in step.
 *
 * A query is over the stored level, and no law of that level reads one, so the queries and their
 * rules live here, in a module `base.ts` never imports, and `Qti` (`#pantry/qti/schema.ts`) is the
 * level that holds them. Each domain's rules are grouped by the law each states, as every module's
 * are, and {@link queryLawsByName} lists those groups, so the importer names a refusal by them
 * (`#pantry/import/refusal.ts` `namedLaws`).
 */

/**
 * Every query `Qti` names, under its own name.
 */
export const queryRelations = {};

/**
 * Each domain's rules over the queries, grouped by the law each states, one record per domain.
 */
export const queryLawsByName = [] as const;

/**
 * One rule over a query, as its domain states it: the union of each domain's statement types, each
 * read from that domain's one record (`Object.values(record).flat()`), never from the list of
 * records. `Object.values` over a union of records falls back to lib's `values(o: {}): any[]`, and
 * a statement typed `any` types every statement of `Qti` `any` with it, so that grizzle can tell no
 * nested member's count apart (`#pantry/qti/schema.ts` holds this type to no `any`). None yet.
 */
type QueryStatement = never;

/**
 * Every rule over a query, each domain's list spread in {@link queryLawsByName}'s order.
 */
export const queryLaws: readonly QueryStatement[] = [];

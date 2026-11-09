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
import { derived, mirrors, on, query, v } from "@bjornpagen/grizzle";
import { QtiBase } from "#pantry/qti/base.ts";
import { GeneralObject } from "#pantry/qti/identity.ts";
import { LomGeneral, LomObject } from "#pantry/qti/metadata.ts";

/**
 * The general categories of the records that name a document, keyed by the category's node, each
 * with that document (spec reading 62): a `lom:general` whose parent is a record with a
 * {@link LomObject}. They are the categories R26 reads a document's languages against
 * (`#pantry/qti/identity.ts` `documentLang`).
 */
export const NamingGeneral = derived(
  "NamingGeneral",
  query(QtiBase).rule((r) => {
    const { node: general, parent: record } = v(LomGeneral, "general");
    const { document } = v(LomObject, "object");

    return r
      .match(LomGeneral, { node: general, parent: record })
      .match(LomObject, { document, record })
      .find({ document, general });
  }),
);

/**
 * The identity overlays' rules over a query, each named by its oracle law: each `GeneralObject`,
 * the stored copy R26's count reads (gap G2), is exactly a {@link NamingGeneral} row, both ways
 * ("E1 derived").
 */
export const identityQueryLawsByName = {
  "E1 derived": [
    mirrors(on(GeneralObject, "document", "general"), on(NamingGeneral, "document", "general")),
  ],
} as const;

/**
 * The identity overlays' rules over a query, in one list.
 */
const identityQueryLaws = Object.values(identityQueryLawsByName).flat();

/**
 * Every query `Qti` names, under its own name.
 */
export const queryRelations = { NamingGeneral };

/**
 * Each domain's rules over the queries, grouped by the law each states, one record per domain.
 */
export const queryLawsByName = [identityQueryLawsByName] as const;

/**
 * One rule over a query, as its domain states it: the union of each domain's statement types, each
 * read from that domain's one record (`Object.values(record).flat()`), never from the list of
 * records. `Object.values` over a union of records falls back to lib's `values(o: {}): any[]`, and
 * a statement typed `any` types every statement of `Qti` `any` with it, so that grizzle can tell no
 * nested member's count apart (`#pantry/qti/schema.ts` holds this type to no `any`).
 */
type QueryStatement = (typeof identityQueryLaws)[number];

/**
 * Every rule over a query, each domain's list spread in {@link queryLawsByName}'s order.
 */
export const queryLaws: readonly QueryStatement[] = [...identityQueryLaws];

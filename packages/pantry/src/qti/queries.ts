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
 *
 * A derived relation's definition reads only the levels below its own, never another derived
 * relation of this level (grizzle's `admitExtend`), so a definition several queries share is a
 * query of its own over `QtiBase`, such as {@link namingRecords}, which each of them matches.
 */
import { Compute, contained, derived, mirrors, on, query, v } from "@bjornpagen/grizzle";
import { QtiBase } from "#pantry/qti/base.ts";
import { GeneralObject } from "#pantry/qti/identity.ts";
import {
  AssessmentObject,
  languageTagPattern,
  LomEntry,
  LomGeneral,
  LomRecord,
  LomTitle,
  LomTitleString,
  noLanguage,
  ObjectIdentifier,
  ObjectTitle,
  objectTypes,
  resourceMetadata,
} from "#pantry/qti/metadata.ts";
import { ResourceDocument, ResourceHref, ResourceTyped } from "#pantry/qti/package.ts";

/**
 * The records that name a document, each with that document (spec reading 62): a `lom:lom` of a
 * resource's `cp:metadata`, its resource of an item's or a test's type, and the document a resource
 * lists at the path the resource's `href` names ({@link ResourceDocument}), whatever type it is
 * read as (reading 162). A record whose resource has no `href`, no such type, or an `href` that
 * names no listed document names none, and no law reads it: "Document entry" refuses that `href`
 * (reading 93). The manifest is no resource's document (reading 146), so an `href` that names it
 * names none (NS6).
 *
 * The record keys a row, since a record's resource has one `href` and one type, and the package
 * lists one document at a path (`ResourceDocument`'s key over `package` and `path`).
 */
export const namingRecords = query(QtiBase).rule((r) => {
  const { node: record, ownerParent: resource } = v(LomRecord, "record");
  const { package: pkg, path } = v(ResourceHref, "href");
  const { type } = v(ResourceTyped, "typed");
  const { node: document } = v(ResourceDocument, "document");

  return r
    .match(LomRecord, { node: record, owner: resourceMetadata, ownerParent: resource })
    .match(ResourceHref, { node: resource, package: pkg, path })
    .match(ResourceTyped, { node: resource, package: pkg, type })
    .match(ResourceDocument, { node: document, package: pkg, path })
    .where(r.inSet(type, objectTypes))
    .find({ document, record });
});

/**
 * The records that name a document and whose general category lists an `identifier`, each by its
 * record: `lom-identifier` reads each (§2.7.1.1). A meta-metadata's or a relation's identifier is
 * no general one.
 */
export const ListedIdentifier = derived(
  "ListedIdentifier",
  query(QtiBase).rule((r) => {
    const { holderParent: record } = v(LomEntry, "entry");

    return r
      .match(LomEntry, { holderKind: "lom:general", holderParent: record })
      .match(namingRecords, { record })
      .find({ record });
  }),
);

/**
 * The records that name a document one of whose general `identifier` entries is that document's
 * identifier, each by its record (§2.7.1.1: "One of the values given for the identifier must have
 * an entry that matches the identifier of the associated item, test or object bank"): the entry's
 * trimmed token is the root's collapsed `identifier` ({@link ObjectIdentifier}), so a document that
 * writes none is named by no entry.
 */
export const MatchedIdentifier = derived(
  "MatchedIdentifier",
  query(QtiBase).rule((r) => {
    const { holderParent: record, token } = v(LomEntry, "entry");
    const { document } = v(namingRecords, "named");

    return r
      .match(LomEntry, { holderKind: "lom:general", holderParent: record, token })
      .match(namingRecords, { document, record })
      .match(ObjectIdentifier, { document, identifier: token })
      .find({ record });
  }),
);

/**
 * The records that name a document and whose general category has a `title`, each by its record:
 * `lom-title` reads each (§2.7.1.2).
 */
export const ListedTitle = derived(
  "ListedTitle",
  query(QtiBase).rule((r) => {
    const { record } = v(LomTitle, "title");

    return r.match(LomTitle, { record }).match(namingRecords, { record }).find({ record });
  }),
);

/**
 * The records that name a document one of whose title strings is that document's title in its
 * language, each by its record (§2.7.1.2: "The title must have a value that matches the value of
 * the title attribute of the associated item, test or object bank. The language used to interpret
 * the title is taken from the language attribute"): the string's `textValue` is the root's
 * `titleValue` ({@link ObjectTitle}), both in `xs:normalizedString`'s value space, and the root
 * states no language (its compared `xml:lang` is no language tag, spec reading 151), or the string
 * has none ({@link noLanguage}), or the two are one tag without regard to case.
 */
export const MatchedTitle = derived(
  "MatchedTitle",
  query(QtiBase).rule((r) => {
    const { languageTag, record, textValue } = v(LomTitleString, "string");
    const { document } = v(namingRecords, "named");
    const { langTag } = v(AssessmentObject, "root");

    return r
      .match(LomTitleString, { languageTag, record, textValue })
      .match(namingRecords, { document, record })
      .match(ObjectTitle, { document, titleValue: textValue })
      .match(AssessmentObject, { document, langTag })
      .where(
        r.or(
          Compute.not(Compute.matches(langTag, languageTagPattern)),
          r.eq(languageTag, noLanguage),
          r.eq(languageTag, langTag),
        ),
      )
      .find({ record });
  }),
);

/**
 * The general categories of the records that name a document, keyed by the category's node, each
 * with that document: the categories R26 reads a document's languages against
 * (`#pantry/qti/identity.ts` `documentLang`).
 */
export const NamingGeneral = derived(
  "NamingGeneral",
  query(QtiBase).rule((r) => {
    const { node: general, parent: record } = v(LomGeneral, "general");
    const { document } = v(namingRecords, "named");

    return r
      .match(LomGeneral, { node: general, parent: record })
      .match(namingRecords, { document, record })
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
 * The metadata overlays' rules over a query, each named by its oracle law (spec reading 62):
 *
 * - **`lom-identifier`:** a record that names a document and lists a general identifier names that
 *   document's identifier ("LomObjectIdentifier");
 * - **`lom-title`:** a record that names a document and has a general title names that document's
 *   title in its language ("LomObjectTitle").
 */
export const metadataQueryLawsByName = {
  LomObjectIdentifier: [contained(on(ListedIdentifier, "record"), on(MatchedIdentifier, "record"))],
  LomObjectTitle: [contained(on(ListedTitle, "record"), on(MatchedTitle, "record"))],
} as const;

/**
 * The identity overlays' rules over a query, in one list.
 */
const identityQueryLaws = Object.values(identityQueryLawsByName).flat();

/**
 * The metadata overlays' rules over a query, in one list.
 */
const metadataQueryLaws = Object.values(metadataQueryLawsByName).flat();

/**
 * Every query `Qti` names, under its own name.
 */
export const queryRelations = {
  ListedIdentifier,
  ListedTitle,
  MatchedIdentifier,
  MatchedTitle,
  NamingGeneral,
};

/**
 * Each domain's rules over the queries, grouped by the law each states, one record per domain.
 */
export const queryLawsByName = [identityQueryLawsByName, metadataQueryLawsByName] as const;

/**
 * One rule over a query, as its domain states it: the union of each domain's statement types, each
 * read from that domain's one record (`Object.values(record).flat()`), never from the list of
 * records. `Object.values` over a union of records falls back to lib's `values(o: {}): any[]`, and
 * a statement typed `any` types every statement of `Qti` `any` with it, so that grizzle can tell no
 * nested member's count apart (`#pantry/qti/schema.ts` holds this type to no `any`).
 */
type QueryStatement = (typeof identityQueryLaws)[number] | (typeof metadataQueryLaws)[number];

/**
 * Every rule over a query, each domain's list spread in {@link queryLawsByName}'s order.
 */
export const queryLaws: readonly QueryStatement[] = [...identityQueryLaws, ...metadataQueryLaws];

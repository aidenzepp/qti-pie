/**
 * The catalog laws of spec reading R9-a: what the information model asks of a catalog's cards and
 * of a card's entries beyond the XSD, which states neither.
 *
 * - **Card support** (rule `card-support`; info §5.26.1: "Use only one card for any particular named
 *   support in a catalog"): no two cards of one catalog carry one `support`. A `support` is
 *   compared by its value, its lexical form collapsed (XML Schema 1.0 Part 2 §4.3.6, whiteSpace
 *   `collapse`), so `" spoken "` and `spoken` name one support. {@link CardSupport} is one row per
 *   card, keyed by its element, and the key on its `(catalog, support)` is the law, so a second
 *   card of one support in one catalog has no row to be written.
 * - **Card default entry** (rule `card-default`; info §5.27.2: "Only one of the CardEntry instances
 *   can have a default designation"): a card holds at most one entry whose `default` designates it.
 *   An entry's `default` is an `xs:boolean`, whose value space is `true`, `false`, `1` and `0`
 *   under whiteSpace `collapse`, so an entry designates where its collapsed value is `true` or `1`.
 *   {@link DefaultEntry} is one row per such entry, keyed by its element, and the key on its `card`
 *   is the law. An entry that writes no `default`, or one whose value is `false` or `0`, has no
 *   row; the XSD's default of `false` designates nothing.
 * - **Catalog reference** (rule `idref-target`; info §5.28.1, §5.15.9; spec reading 117): a
 *   `data-catalog-idref` names a `qti-catalog` of its document, not any ID of it. The attribute is
 *   typed `xs:IDREF`, so "Idref target" (`#pantry/qti/identity.ts`) alone refuses a token that
 *   names no ID, and accepts one that names an HTML `id` or a declaration. {@link CatalogRef} is
 *   one row per such attribute that holds a token, as "Idref target" reads only an attribute the
 *   schema checks as IDREF and only its tokens (an unchecked one, or an empty or blank one, names
 *   nothing), keyed by its element, its token the lexical form collapsed (`xs:IDREF`'s whiteSpace
 *   `collapse`); {@link CatalogId} is one row per `qti-catalog` whose `id` is an NCName, copied
 *   from the attribute as a `TableHeader` is, its `id` the value its {@link DocumentId} holds. A
 *   document in no assembly resolves each reference among its own catalogs: the containment of
 *   every reference's `(document, token)` in the catalogs' `(document, id)`, over the tokens
 *   {@link CatalogTarget} holds. A document in an assembly resolves it once per instance, as "Idref
 *   target" does its IDREFs ({@link PlacedIdref}): a fragment's reference names a catalog of the
 *   item it is included in, and a fragment two items include is judged in each.
 *   {@link PlacedCatalogRef} is one token of an instance's document, which
 *   {@link AssembledCatalog}, a catalog's binding in its assembly's ID table, must hold under the
 *   instance's assembly.
 *
 * The card overlays copy their node through {@link nodeRef}, so `catalog` and `card`, each the
 * start of the node's parent, are the parent the tree holds, and both copy their attribute as
 * `identity.ts` states a copy (C18): from `select(Attribute, φ)` into the overlay, keyed by
 * `Attribute`'s key `(package, path, start, name)`, its name fixed, whose index over the element
 * serves the copy's reverse probe. Every copied text that takes part in a
 * cross-row equality is `keyText` (`#pantry/qti/limits.ts`). Every check is named by its oracle law
 * (`#pantry/test/oracle.ts` `LawName`) with spaces written as underscores; the overlays' agreement
 * with what the tree holds is "E1 derived" (rule `derived`).
 *
 * @see {@link https://www.imsglobal.org/spec/qti/v3p0/info#Data_Card | QTI 3.0 information model, §5.26 Card}
 * @see {@link https://www.imsglobal.org/spec/qti/v3p0/info#Data_CardEntry | QTI 3.0 information model, §5.27 CardEntry}
 */
import {
  check,
  closedId,
  Compute,
  contained,
  counted,
  drawn,
  fin,
  generated,
  key,
  natural,
  on,
  pg,
  relation,
  select,
} from "@bjornpagen/grizzle";
import type { RowScalars } from "@bjornpagen/grizzle";
import { booleanTrue } from "#pantry/grammar/domains.ts";
import {
  AttributeGrammar,
  AttributeModelOf,
  NodeKind,
  SchemaVersion,
  ValueIdentity,
} from "#pantry/grammar/install.ts";
import { Attribute, namingPattern } from "#pantry/qti/attributes.ts";
import { Document } from "#pantry/qti/chardata.ts";
import { AssembledId, DocumentId, PlacedIdref } from "#pantry/qti/identity.ts";
import { EntryPath, keyText, ManifestIdentifier } from "#pantry/qti/limits.ts";
import { nodeRef } from "#pantry/qti/node.ts";
import { TestDocument } from "#pantry/qti/tests.ts";

/**
 * A `qti-card`'s `support`, keyed by the card's element: its {@link nodeRef} tuple, with `catalog`
 * its parent, the `support` as written (`lexical`, C18's copy) and that form collapsed (`support`),
 * which the database derives.
 */
export const CardSupport = relation.generated(
  "CardSupport",
  {
    catalog: natural,
    kind: closedId(NodeKind),
    lexical: keyText,
    nearest: natural,
    package: ManifestIdentifier,
    path: EntryPath,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["package", "path", "start"],
  (c) => ({ support: generated(keyText, Compute.cast(Compute.collapse(c.lexical), keyText)) }),
);

/**
 * A `qti-card-entry` that designates itself the default of its card, keyed by the entry's element:
 * its {@link nodeRef} tuple, with `card` its parent, the `default` as written (`lexical`, C18's
 * copy) and that form collapsed (`value`), which the database derives, `true` or `1`.
 */
export const DefaultEntry = relation.generated(
  "DefaultEntry",
  {
    card: natural,
    kind: closedId(NodeKind),
    lexical: keyText,
    nearest: natural,
    package: ManifestIdentifier,
    path: EntryPath,
    start: natural,
    version: closedId(SchemaVersion),
  },
  ["package", "path", "start"],
  (e) => ({ value: generated(keyText, Compute.cast(Compute.collapse(e.lexical), keyText)) }),
);

/**
 * One `data-catalog-idref`, keyed by its element: the attribute as written
 * (`lexical`, C18's copy) and that form collapsed (`token`), the id of the catalog it names. The
 * importer writes `token`, which "E1 derived" proves, since a family's group is fields its member's
 * writer writes (grizzle refuses a generated one), and {@link catalogTargetFamily} groups by it.
 */
export const CatalogRef = relation(
  "CatalogRef",
  {
    lexical: keyText,
    package: ManifestIdentifier,
    path: EntryPath,
    start: natural,
    // GRIZZLE-PENDING: Q20: a family that groups by a generated field; then `token` is generated as collapse(lexical), and tsc names its writer.
    token: keyText,
  },
  ["package", "path", "start"],
);

/**
 * One `qti-catalog` that carries an ID, an `id` whose value is an NCName, keyed by its element:
 * its `id`, the ID's value as its {@link DocumentId} holds it (an `xs:ID` collapsed), with `owner`
 * the element's own start, an attribute ID's binding, so its copy shares the superkey
 * `DocumentId` reads.
 *
 * The import writes its rows where its form names something (`namedBy` of
 * `#pantry/import/names.ts`, which lists every such relation), until it is a query over
 * `Attribute`.
 */
export const CatalogId = relation(
  "CatalogId",
  {
    id: keyText,
    owner: natural,
    package: ManifestIdentifier,
    path: EntryPath,
    start: natural,
  },
  ["package", "path", "start"],
);

/**
 * A token a document's `data-catalog-idref`s name, a projection keyed by its document's `(package,
 * path)` and the token: one row per distinct token of a document's {@link CatalogRef}s, with the
 * document's `assembled`. A document in no assembly resolves each in its own catalogs; one in an
 * assembly, in its assembly's, once per instance ({@link PlacedCatalogRef}). `carriers` counts the
 * document's references of the token, and `placements` its {@link PlacedCatalogRef}s.
 */
export const CatalogTarget = relation(
  "CatalogTarget",
  {
    assembled: pg.boolean,
    carriers: drawn(natural),
    id: keyText,
    package: ManifestIdentifier,
    path: EntryPath,
    placements: drawn(natural),
  },
  ["package", "path", "id"],
);

/**
 * One token of an instance's document's catalog references (spec reading 117), keyed by the
 * instance (its assembly and start) and the token: a {@link CatalogTarget} of the instance's
 * document, `path`, which resolves among
 * its assembly's catalogs ("Catalog reference").
 */
export const PlacedCatalogRef = relation(
  "PlacedCatalogRef",
  {
    assembly: EntryPath,
    id: keyText,
    instance: natural,
    package: ManifestIdentifier,
    path: EntryPath,
  },
  ["package", "assembly", "instance", "id"],
);

/**
 * One binding of an assembly's ID table whose owner is a `qti-catalog`, keyed by the assembly and
 * the id: an {@link AssembledId} of the assembly, its owner, `(path, owner)`, a {@link CatalogId}'s
 * element.
 */
export const AssembledCatalog = relation(
  "AssembledCatalog",
  {
    assembly: EntryPath,
    id: keyText,
    owner: natural,
    package: ManifestIdentifier,
    path: EntryPath,
  },
  ["package", "assembly", "id"],
);

/**
 * Every relation this module declares, by name, as `schema.ts` composes them.
 */
export const catalogRelations = {
  AssembledCatalog,
  CardSupport,
  CatalogId,
  CatalogRef,
  CatalogTarget,
  DefaultEntry,
  PlacedCatalogRef,
};

/**
 * Each document's catalog tokens, counted by `CatalogTarget.carriers`.
 */
const catalogTargetFamily = counted(
  on(CatalogRef, "package", "path", "token"),
  fin(CatalogTarget, "carriers"),
);

/**
 * Each document's catalog tokens placed under its instances, counted by
 * `CatalogTarget.placements`.
 */
const placedCatalogFamily = counted(
  on(PlacedCatalogRef, "package", "path", "id"),
  fin(CatalogTarget, "placements"),
);

/**
 * Every card's `support`, the source of {@link CardSupport}.
 */
const supportAttributes = select(Attribute, (a) =>
  a.and(a.eq(a.kind, "qti-card"), a.eq(a.name, "support")),
);

/**
 * The `default`s that designate their entry, the source of {@link DefaultEntry}: those whose
 * collapsed value is `true` or `1`.
 */
const designatingDefaults = select(Attribute, (a) =>
  a.and(
    a.eq(a.kind, "qti-card-entry"),
    a.eq(a.name, "default"),
    a.or(
      a.eq(Compute.collapse(a.lexical), booleanTrue[0]),
      a.eq(Compute.collapse(a.lexical), booleanTrue[1]),
    ),
  ),
);

/**
 * An `Attribute` row as a selection reads it.
 */
type AttributeRow = RowScalars<typeof Attribute>;

/**
 * Read an attribute's identity type, as `identity.ts` reads it: its value domain's under its
 * element's governor, absent for a name the governor does not admit.
 *
 * @param a - The row.
 * @returns The closed read.
 */
const identityOf = (a: AttributeRow) => {
  const model = AttributeModelOf.at("model", a.version, a.governor);

  return ValueIdentity.at("identity", AttributeGrammar.at("domain", model, a.name));
};

/**
 * Every `data-catalog-idref` that holds an IDREF token, the source of {@link CatalogRef}: the
 * attributes "Idref target" reads, those the schema checks as an IDREF whose collapsed value is
 * not empty. One the schema does not check has no `Idref` piece, and neither has an empty or blank
 * one, which names nothing.
 */
const referenceAttributes = select(Attribute, (a) =>
  a.and(
    a.eq(a.name, "data-catalog-idref"),
    a.in(identityOf(a), ["IDREF", "IDREFS"]),
    a.ne(Compute.collapse(a.lexical), ""),
  ),
);

/**
 * Every catalog's `id` that is one of its document's IDs, its lexical form naming something once
 * collapsed ({@link namingPattern}), the source of {@link CatalogId}: any other names no catalog,
 * as it has no {@link DocumentId}, and its value domain refuses it alone (spec reading 156).
 */
const catalogIdAttributes = select(Attribute, (a) =>
  a.and(a.eq(a.kind, "qti-catalog"), a.eq(a.name, "id"), Compute.matches(a.lexical, namingPattern)),
);

/**
 * The tokens of a document in no assembly, which resolve among its own catalogs.
 */
const unassembledTargets = select(CatalogTarget, (t) => t.eq(t.assembled, false));

/**
 * The tokens of a document in an assembly, each placed under every one of its instances.
 */
const assembledTargets = select(CatalogTarget, (t) => t.eq(t.assembled, true));

/**
 * Every statement over the catalog overlays, each `check` named by its oracle law:
 *
 * - **Card support:** a catalog holds one card for each support, the key on {@link CardSupport}'s
 *   `(catalog, support)`;
 * - **Card default entry:** a card holds at most one designated entry, the key on
 *   {@link DefaultEntry}'s `card`;
 * - **Catalog reference:** each reference's token is the `id` of a catalog of its document, a
 *   reference being a `data-catalog-idref` that holds an IDREF token, as "Idref target" reads one:
 *   a document in no assembly has it among its own catalogs, one in an assembly under each
 *   instance, among its assembly's catalogs;
 * - **DocumentId key:** {@link CatalogId}'s `(package, path, id)`, which an ID held twice in a
 *   document already breaks and which the containment of "Catalog reference" needs of its target;
 *   the attribute selections the copies read are keyed by `Attribute`'s key, their name fixed;
 * - **E1 derived:** each card overlay's node tuple, each overlay's attribute copied into its row both
 *   ways, a collapsed value the lexical form collapsed (a designating one `true` or `1`), and a
 *   catalog's `id` its {@link DocumentId}'s, owned by the catalog itself; and the tokens'
 *   placement: each {@link CatalogTarget} the token of a reference, its `assembled` its document's,
 *   placed under every instance of an assembled document ({@link PlacedCatalogRef}, each an
 *   {@link PlacedIdref} of that instance), and each {@link AssembledCatalog} a binding of
 *   {@link AssembledId} owned by a catalog.
 */
export const catalogLawsByName = {
  "Card default entry": [key(on(DefaultEntry, "package", "path", "card"))],
  "Card support": [key(on(CardSupport, "package", "path", "catalog", "support"))],
  "Catalog reference": [
    contained(
      on(unassembledTargets, "package", "path", "id"),
      on(CatalogId, "package", "path", "id"),
    ),
    contained(
      on(PlacedCatalogRef, "package", "assembly", "id"),
      on(AssembledCatalog, "package", "assembly", "id"),
    ),
  ],
  "DocumentId key": [key(on(CatalogId, "package", "path", "id"))],
  "E1 derived": [
    contained(
      on(CardSupport, "package", "path", "start", "kind", "nearest", "version", "catalog"),
      nodeRef,
    ),
    contained(
      on(DefaultEntry, "package", "path", "start", "kind", "nearest", "version", "card"),
      nodeRef,
    ),
    contained(
      on(supportAttributes, "package", "path", "start", "lexical"),
      on(CardSupport, "package", "path", "start", "lexical"),
    ),
    contained(
      on(CardSupport, "package", "path", "start"),
      on(supportAttributes, "package", "path", "start"),
    ),
    contained(
      on(designatingDefaults, "package", "path", "start", "lexical"),
      on(DefaultEntry, "package", "path", "start", "lexical"),
    ),
    contained(
      on(DefaultEntry, "package", "path", "start"),
      on(designatingDefaults, "package", "path", "start"),
    ),
    check("E1_derived", DefaultEntry, (e) =>
      e.or(e.eq(e.value, booleanTrue[0]), e.eq(e.value, booleanTrue[1])),
    ),
    contained(
      on(referenceAttributes, "package", "path", "start", "lexical"),
      on(CatalogRef, "package", "path", "start", "lexical"),
    ),
    contained(
      on(CatalogRef, "package", "path", "start"),
      on(referenceAttributes, "package", "path", "start"),
    ),
    check("E1_derived", CatalogRef, (r) => r.eq(r.token, Compute.collapse(r.lexical))),
    contained(
      on(catalogIdAttributes, "package", "path", "start"),
      on(CatalogId, "package", "path", "start"),
    ),
    contained(
      on(CatalogId, "package", "path", "start"),
      on(catalogIdAttributes, "package", "path", "start"),
    ),
    contained(
      on(CatalogId, "package", "path", "start", "id", "owner"),
      on(DocumentId, "package", "path", "start", "id", "owner"),
    ),
    check("E1_derived", CatalogId, (c) => c.eq(c.owner, c.start)),
    catalogTargetFamily,
    check("E1_derived", CatalogTarget, (t) => t.gt(t.carriers, 0n)),
    contained(
      on(CatalogTarget, "package", "path", "assembled"),
      on(Document, "package", "path", "assembled"),
    ),
    contained(
      on(PlacedCatalogRef, "package", "assembly", "instance", "id", "path"),
      on(PlacedIdref, "package", "assembly", "instance", "id", "path"),
    ),
    placedCatalogFamily,
    contained(
      on(assembledTargets, "package", "path", "placements"),
      on(TestDocument, "package", "path", "instances"),
    ),
    contained(
      on(AssembledCatalog, "package", "assembly", "id", "path", "owner"),
      on(AssembledId, "package", "assembly", "id", "path", "owner"),
    ),
    contained(
      on(AssembledCatalog, "package", "path", "owner"),
      on(CatalogId, "package", "path", "start"),
    ),
  ],
} as const;

/**
 * {@link catalogLawsByName}'s statements in one list, the module's laws as the schema composes
 * them.
 */
export const catalogLaws = Object.values(catalogLawsByName).flat();

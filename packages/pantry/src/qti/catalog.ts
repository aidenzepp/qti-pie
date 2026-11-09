/**
 * The catalog laws of spec reading R9-a: what the information model asks of a catalog's cards and
 * of a card's entries beyond the XSD, which states neither.
 *
 * - **Card support** (rule `card-support`; info §5.26.1: "Use only one card for any particular named
 *   support in a catalog"): no two cards of one catalog carry one `support`. A `support` is
 *   compared by its value, its lexical form collapsed (XML Schema 1.0 Part 2 §4.3.6, whiteSpace
 *   `collapse`), so `" spoken "` and `spoken` name one support. {@link CardSupport} is one row per
 *   card, keyed by its node, and the key on its `(catalog, support)` is the law, so a second card
 *   of one support in one catalog has no row to be written.
 * - **Card default entry** (rule `card-default`; info §5.27.2: "Only one of the CardEntry instances
 *   can have a default designation"): a card holds at most one entry whose `default` designates it.
 *   An entry's `default` is an `xs:boolean`, whose value space is `true`, `false`, `1` and `0`
 *   under whiteSpace `collapse`, so an entry designates where its collapsed value is `true` or `1`.
 *   {@link DefaultEntry} is one row per such entry, keyed by its node, and the key on its `card` is
 *   the law. An entry that writes no `default`, or one whose value is `false` or `0`, has no row;
 *   the XSD's default of `false` designates nothing.
 * - **Catalog reference** (rule `idref-target`; info §5.28.1, §5.15.9; spec reading 117): a
 *   `data-catalog-idref` names a `qti-catalog` of its document, not any ID of it. The attribute is
 *   typed `xs:IDREF`, so "Idref target" (`#pantry/qti/identity.ts`) alone refuses a token that
 *   names no ID, and accepts one that names an HTML `id` or a declaration. {@link CatalogRef} is
 *   one row per such attribute that holds a token, as "Idref target" reads only an attribute the
 *   schema checks as IDREF and only its tokens (an unchecked one, or an empty or blank one, names
 *   nothing), keyed by its node, its token the lexical form collapsed (`xs:IDREF`'s whiteSpace
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
 * node's parent, are the parent the tree holds, and both copy their attribute as `identity.ts`
 * states a copy (C18): from `select(Attribute, φ)` into the overlay, beside a key over the same
 * selection whose UNIQUE serves the copy's reverse probe. Every copied text that takes part in a
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
  key,
  natural,
  on,
  pg,
  relation,
  select,
  uuid,
} from "@bjornpagen/grizzle";
import type { RowScalars } from "@bjornpagen/grizzle";
import { booleanTrue } from "#pantry/grammar/domains.ts";
import {
  AttributeGrammar,
  AttributeModelOf,
  AttributeSlotOf,
  NodeKind,
  SchemaVersion,
  ValueIdentity,
} from "#pantry/grammar/install.ts";
import { Attribute } from "#pantry/qti/attributes.ts";
import { Document } from "#pantry/qti/chardata.ts";
import { AssembledId, DocumentId, namingPattern, PlacedIdref } from "#pantry/qti/identity.ts";
import { keyText } from "#pantry/qti/limits.ts";
import { nodeRef } from "#pantry/qti/node.ts";
import { TestDocument } from "#pantry/qti/tests.ts";

/**
 * A `qti-card`'s `support`, keyed by the card's node: its {@link nodeRef} tuple, with `catalog` its
 * parent, the `support` as written (`lexical`, C18's copy) and that form collapsed (`support`).
 */
export const CardSupport = relation(
  "CardSupport",
  {
    catalog: uuid,
    document: uuid,
    kind: closedId(NodeKind),
    lexical: keyText,
    nearest: uuid,
    node: uuid,
    start: natural,
    support: keyText,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * A `qti-card-entry` that designates itself the default of its card, keyed by the entry's node: its
 * {@link nodeRef} tuple, with `card` its parent, the `default` as written (`lexical`, C18's copy)
 * and that form collapsed (`value`), `true` or `1`.
 */
export const DefaultEntry = relation(
  "DefaultEntry",
  {
    card: uuid,
    document: uuid,
    kind: closedId(NodeKind),
    lexical: keyText,
    nearest: uuid,
    node: uuid,
    start: natural,
    value: keyText,
    version: closedId(SchemaVersion),
  },
  ["node"],
);

/**
 * One `data-catalog-idref`, keyed by its element's node: its document, the attribute as written
 * (`lexical`, C18's copy) and that form collapsed (`token`), the id of the catalog it names.
 */
export const CatalogRef = relation(
  "CatalogRef",
  { document: uuid, lexical: keyText, node: uuid, token: keyText },
  ["node"],
);

/**
 * One `qti-catalog` that carries an ID, an `id` whose value is an NCName, keyed by its node: its
 * document, its `id`, the ID's value as its {@link DocumentId} holds it (an `xs:ID` collapsed),
 * with `owner` the node itself, an attribute ID's binding, so its copy shares the superkey
 * `DocumentId` reads.
 */
export const CatalogId = relation(
  "CatalogId",
  { document: uuid, id: keyText, node: uuid, owner: uuid },
  ["node"],
);

/**
 * A token a document's `data-catalog-idref`s name, a projection keyed by its heading: one row per
 * distinct token of a document's {@link CatalogRef}s, with the document's `assembled`. A document in
 * no assembly resolves each in its own catalogs; one in an assembly, in its assembly's, once per
 * instance ({@link PlacedCatalogRef}). `carriers` counts the document's references of the token,
 * and `placements` its {@link PlacedCatalogRef}s.
 */
export const CatalogTarget = relation(
  "CatalogTarget",
  {
    assembled: pg.boolean,
    carriers: drawn(natural),
    document: uuid,
    id: keyText,
    placements: drawn(natural),
  },
  ["document", "id"],
);

/**
 * One token of an instance's document's catalog references (spec reading 117), keyed by the
 * instance and the token: a {@link CatalogTarget} of the instance's document, which resolves among
 * its assembly's catalogs ("Catalog reference").
 */
export const PlacedCatalogRef = relation(
  "PlacedCatalogRef",
  { assembly: uuid, document: uuid, id: keyText, instance: uuid },
  ["instance", "id"],
);

/**
 * One binding of an assembly's ID table whose owner is a `qti-catalog`, keyed by the assembly and
 * the id: an {@link AssembledId} of the assembly, the owner a {@link CatalogId}'s node.
 */
export const AssembledCatalog = relation(
  "AssembledCatalog",
  { assembly: uuid, id: keyText, owner: uuid },
  ["assembly", "id"],
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
  on(CatalogRef, "document", "token"),
  fin(CatalogTarget, "carriers"),
);

/**
 * Each document's catalog tokens placed under its instances, counted by
 * `CatalogTarget.placements`.
 */
const placedCatalogFamily = counted(
  on(PlacedCatalogRef, "document", "id"),
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

  return ValueIdentity.at(
    "identity",
    AttributeGrammar.at("domain", model, AttributeSlotOf.at("slot", model, a.name)),
  );
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
 * - **DocumentId key:** one `support` per card, one designating `default` per entry, one
 *   `data-catalog-idref` and one catalog `id` per element, the keys over the attribute selections
 *   the copies read, and {@link CatalogId}'s `(document, id)`, which an ID held twice in a document
 *   already breaks and which the containment of "Catalog reference" needs of its target;
 * - **E1 derived:** each card overlay's node tuple, each overlay's attribute copied into its row both
 *   ways, a collapsed value the lexical form collapsed (a designating one `true` or `1`), and a
 *   catalog's `id` its {@link DocumentId}'s, owned by the catalog itself; and the tokens'
 *   placement: each {@link CatalogTarget} the token of a reference, its `assembled` its document's,
 *   placed under every instance of an assembled document ({@link PlacedCatalogRef}, each an
 *   {@link PlacedIdref} of that instance), and each {@link AssembledCatalog} a binding of
 *   {@link AssembledId} owned by a catalog.
 */
export const catalogLawsByName = {
  "Card default entry": [key(on(DefaultEntry, "card"))],
  "Card support": [key(on(CardSupport, "catalog", "support"))],
  "Catalog reference": [
    contained(on(unassembledTargets, "document", "id"), on(CatalogId, "document", "id")),
    contained(on(PlacedCatalogRef, "assembly", "id"), on(AssembledCatalog, "assembly", "id")),
  ],
  "DocumentId key": [
    key(on(supportAttributes, "node")),
    key(on(designatingDefaults, "node")),
    key(on(referenceAttributes, "node")),
    key(on(catalogIdAttributes, "node")),
    key(on(CatalogId, "document", "id")),
  ],
  "E1 derived": [
    contained(
      on(CardSupport, "node", "document", "kind", "start", "nearest", "version", "catalog"),
      nodeRef,
    ),
    contained(
      on(DefaultEntry, "node", "document", "kind", "start", "nearest", "version", "card"),
      nodeRef,
    ),
    contained(on(supportAttributes, "node", "lexical"), on(CardSupport, "node", "lexical")),
    contained(on(CardSupport, "node"), on(supportAttributes, "node")),
    contained(on(designatingDefaults, "node", "lexical"), on(DefaultEntry, "node", "lexical")),
    contained(on(DefaultEntry, "node"), on(designatingDefaults, "node")),
    check("E1_derived", CardSupport, (c) => c.eq(c.support, Compute.collapse(c.lexical))),
    check("E1_derived", DefaultEntry, (e) =>
      e.and(
        e.eq(e.value, Compute.collapse(e.lexical)),
        e.or(e.eq(e.value, booleanTrue[0]), e.eq(e.value, booleanTrue[1])),
      ),
    ),
    contained(
      on(referenceAttributes, "node", "document", "lexical"),
      on(CatalogRef, "node", "document", "lexical"),
    ),
    contained(on(CatalogRef, "node"), on(referenceAttributes, "node")),
    check("E1_derived", CatalogRef, (r) => r.eq(r.token, Compute.collapse(r.lexical))),
    contained(on(catalogIdAttributes, "node", "document"), on(CatalogId, "node", "document")),
    contained(on(CatalogId, "node"), on(catalogIdAttributes, "node")),
    contained(
      on(CatalogId, "node", "document", "id", "owner"),
      on(DocumentId, "node", "document", "id", "owner"),
    ),
    check("E1_derived", CatalogId, (c) => c.eq(c.owner, c.node)),
    catalogTargetFamily,
    check("E1_derived", CatalogTarget, (t) => t.gt(t.carriers, 0n)),
    contained(on(CatalogTarget, "document", "assembled"), on(Document, "node", "assembled")),
    contained(
      on(PlacedCatalogRef, "instance", "id", "document", "assembly"),
      on(PlacedIdref, "instance", "id", "document", "assembly"),
    ),
    placedCatalogFamily,
    contained(
      on(assembledTargets, "document", "placements"),
      on(TestDocument, "node", "instances"),
    ),
    contained(
      on(AssembledCatalog, "assembly", "id", "owner"),
      on(AssembledId, "assembly", "id", "owner"),
    ),
    contained(on(AssembledCatalog, "owner"), on(CatalogId, "node")),
  ],
} as const;

/**
 * {@link catalogLawsByName}'s statements in one list, the module's laws as the schema composes
 * them.
 */
export const catalogLaws = Object.values(catalogLawsByName).flat();

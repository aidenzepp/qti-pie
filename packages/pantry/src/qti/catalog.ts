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
 *
 * Both overlays copy their node through {@link nodeRef}, so `catalog` and `card`, each the node's
 * parent, are the parent the tree holds, and both copy their attribute as `identity.ts` states a
 * copy (C18): from `select(Attribute, φ)` into the overlay, beside a key over the same selection
 * whose UNIQUE serves the copy's reverse probe. Every copied text that takes part in a cross-row
 * equality is `keyText` (`#pantry/qti/limits.ts`). Every check is named by its oracle law
 * (`#pantry/test/oracle.ts` `LawName`) with spaces written as underscores; the overlays'
 * agreement with what the tree holds is "E1 derived" (rule `derived`).
 *
 * @see {@link https://www.imsglobal.org/spec/qti/v3p0/info#Data_Card | QTI 3.0 information model, §5.26 Card}
 * @see {@link https://www.imsglobal.org/spec/qti/v3p0/info#Data_CardEntry | QTI 3.0 information model, §5.27 CardEntry}
 */
import {
  check,
  closedId,
  Compute,
  contained,
  key,
  natural,
  on,
  relation,
  select,
  uuid,
} from "@bjornpagen/grizzle";
import { NodeKind, SchemaVersion } from "#pantry/grammar/install.ts";
import { Attribute } from "#pantry/qti/attributes.ts";
import { keyText } from "#pantry/qti/limits.ts";
import { nodeRef } from "#pantry/qti/node.ts";

/**
 * The values of an entry's `default` that designate it, once collapsed: the two lexical forms of
 * `xs:boolean`'s true.
 */
export const designatingValues = ["true", "1"] as const;

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
 * Every relation this module declares, by name, as `schema.ts` composes them.
 */
export const catalogRelations = { CardSupport, DefaultEntry };

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
      a.eq(Compute.collapse(a.lexical), designatingValues[0]),
      a.eq(Compute.collapse(a.lexical), designatingValues[1]),
    ),
  ),
);

/**
 * Every statement over the catalog overlays, each `check` named by its oracle law:
 *
 * - **Card support:** a catalog holds one card for each support, the key on {@link CardSupport}'s
 *   `(catalog, support)`;
 * - **Card default entry:** a card holds at most one designated entry, the key on
 *   {@link DefaultEntry}'s `card`;
 * - **DocumentId key:** one `support` per card and one designating `default` per entry, the keys over
 *   the attribute selections the copies read;
 * - **E1 derived:** each overlay's node tuple, its attribute copied into its row both ways, and its
 *   collapsed value the lexical form collapsed, a designating one `true` or `1`.
 */
export const catalogLawsByName = {
  "Card default entry": [key(on(DefaultEntry, "card"))],
  "Card support": [key(on(CardSupport, "catalog", "support"))],
  "DocumentId key": [key(on(supportAttributes, "node")), key(on(designatingDefaults, "node"))],
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
        e.or(e.eq(e.value, designatingValues[0]), e.eq(e.value, designatingValues[1])),
      ),
    ),
  ],
} as const;

/**
 * {@link catalogLawsByName}'s statements in one list, the module's laws as the schema composes
 * them.
 */
export const catalogLaws = Object.values(catalogLawsByName).flat();

/**
 * The catalog overlays' rows (spec reading R9-a, `#pantry/qti/catalog.ts`): from one document's XDM
 * tree and the ids its nodes are written under, one `CardSupport` row per `qti-card`'s `support`,
 * one `DefaultEntry` row per `qti-card-entry` whose `default` designates it, one `CatalogRef` row
 * per `data-catalog-idref` that holds a token and one `CatalogId` row per `qti-catalog` that
 * writes an `id`, each keyed by its node.
 *
 * The rows restate what the tree says and nothing else: each card overlay's node tuple (C18), its
 * parent, and every attribute as written and that form collapsed. The database proves every one
 * of them (`catalogLaws`), so a row this builder gets wrong is refused, never accepted.
 */
import type { Addition } from "@bjornpagen/grizzle";
import { Option } from "effect";
import { booleanTrue } from "#pantry/grammar/domains.ts";
import { attributeRows, ValueIdentity } from "#pantry/grammar/install.ts";
import type { DocumentContext } from "#pantry/import/context.ts";
import { foldOf, governorOf, ownContext } from "#pantry/import/fold.ts";
import { collapse } from "#pantry/import/overlays/metadata.ts";
import type { Composed } from "#pantry/model/composed.ts";
import { flatten } from "#pantry/model/xdm.ts";
import type { NodeId, NodeRow, XdmDocument } from "#pantry/model/xdm.ts";
import type { CardSupport, CatalogId, CatalogRef, DefaultEntry } from "#pantry/qti/catalog.ts";

/**
 * The ids a document's rows are written under: each of its tree's nodes', drawn by the number
 * `flatten` gives it, and the document's context (spec reading 117), its own where none is given.
 *
 * It is the part of the importer's `NodeIds` (Q5.15) this builder reads, so the overlay rows and
 * the tree's rows name each node by one id.
 */
export interface CatalogIds {
  readonly context?: DocumentContext;
  readonly idOf: (index: number) => NodeId;
}

/**
 * A document's catalog rows, one keyed set per relation: each map from the text of a row's key, its
 * node's id, to the row as its writer writes it.
 */
export interface CatalogRows {
  readonly CardSupport: ReadonlyMap<string, Addition<typeof CardSupport>>;
  readonly CatalogId: ReadonlyMap<string, Addition<typeof CatalogId>>;
  readonly CatalogRef: ReadonlyMap<string, Addition<typeof CatalogRef>>;
  readonly DefaultEntry: ReadonlyMap<string, Addition<typeof DefaultEntry>>;
}

/**
 * The attribute the catalog reference law reads.
 */
const referenceName = "data-catalog-idref";

/**
 * The domains whose identity is `xs:IDREF` or `xs:IDREFS`, as the installed `ValueIdentity` holds
 * them: those whose tokens are `Idref` rows.
 */
const idrefDomains: ReadonlySet<string> = new Set(
  ValueIdentity.rows.flatMap(({ domain, identity }) =>
    identity === "IDREF" || identity === "IDREFS" ? [domain] : [],
  ),
);

/**
 * The governors, keyed `version governor`, under which `data-catalog-idref` has an IDREF domain:
 * the ones under which the schema checks it as an IDREF, as `#pantry/import/overlays/identity.ts`
 * reads an attribute's domain.
 */
const referencing: ReadonlySet<string> = new Set(
  attributeRows.flatMap(({ domain, governor, name, version }) =>
    name === referenceName && idrefDomains.has(domain) ? [`${version} ${governor}`] : [],
  ),
);

/**
 * Decide whether an element's `data-catalog-idref` holds an IDREF token, so "Idref target" reads
 * it: the schema checks it as an IDREF under its element's governor, and its value is not empty or
 * blank, which holds no token.
 *
 * @param element - The attribute's element's node row.
 * @param lexical - The attribute as written.
 * @returns Whether it is a reference.
 */
const holdsReference = (element: NodeRow<Composed>, lexical: string): boolean => {
  const governor = governorOf(element.version, element.kind, element.governs);

  return (
    Option.isSome(governor) &&
    referencing.has(`${element.version} ${governor.value}`) &&
    collapse(lexical) !== ""
  );
};

/**
 * The values that designate an entry, collapsed.
 */
const designating: ReadonlySet<string> = new Set(booleanTrue);

/**
 * Build the catalog overlays' rows of one document: a `CardSupport` for each `qti-card` that writes
 * a `support`, and a `DefaultEntry` for each `qti-card-entry` whose `default` collapses to `true`
 * or `1`, and a `CatalogRef` for each `data-catalog-idref` that holds an IDREF token (an empty or
 * blank one holds none). A document with no such element gives no row.
 *
 * @param doc - The document's tree, as shred gives it.
 * @param ids - The ids its rows are written under, and its context.
 * @returns Every catalog relation's rows, keyed by node.
 */
export const rowsOf = (doc: XdmDocument<Composed>, ids: CatalogIds): CatalogRows => {
  const rows = flatten(doc, ids.idOf);
  const document = rows.document.node;
  const folds = foldOf(rows.nodes, ids.context ?? ownContext(document));
  const byId = new Map(rows.nodes.map((node) => [node.id, node] as const));
  const supports = new Map<string, Addition<typeof CardSupport>>();
  const defaults = new Map<string, Addition<typeof DefaultEntry>>();
  const references = new Map<string, Addition<typeof CatalogRef>>();
  const catalogIds = new Map<string, Addition<typeof CatalogId>>();

  for (const { lexical, name, node: id } of rows.attributes) {
    const node = byId.get(id);
    if (node === undefined) {
      continue;
    }

    const value = collapse(lexical);
    if (name === referenceName) {
      if (holdsReference(node, lexical)) {
        references.set(id, { document, lexical, node: id, token: value });
      }

      continue;
    }

    if (node.kind === "qti-catalog" && name === "id") {
      catalogIds.set(id, { document, id: value, node: id, owner: id });
      continue;
    }

    const isSupport = node.kind === "qti-card" && name === "support";
    const isDesignating =
      node.kind === "qti-card-entry" && name === "default" && designating.has(value);
    if (!isSupport && !isDesignating) {
      continue;
    }

    const tuple = {
      document,
      kind: node.kind,
      lexical,
      nearest: folds.get(id)?.nearest ?? document,
      node: id,
      start: node.start,
      version: node.version,
    };
    if (isSupport) {
      supports.set(id, { ...tuple, catalog: node.parent, support: value });
    } else {
      defaults.set(id, { ...tuple, card: node.parent, value });
    }
  }

  return {
    CardSupport: supports,
    CatalogId: catalogIds,
    CatalogRef: references,
    DefaultEntry: defaults,
  };
};

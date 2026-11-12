/**
 * The catalog overlays' rows (spec reading R9-a, `#pantry/qti/catalog.ts`): from one document's
 * view (`DocumentView` of `#pantry/import/fold.ts`), one `CardSupport` row per `qti-card`'s
 * `support`, one `DefaultEntry` row per `qti-card-entry` whose `default` designates it, one
 * `CatalogRef` row per `data-catalog-idref` that holds a token and one `CatalogId` row per
 * `qti-catalog` whose `id` is an NCName, each keyed by its element, and one `CatalogTarget` row per
 * distinct token of the document's references, keyed by its document and token.
 *
 * A document in an assembly resolves its references once per instance (spec reading 117), which
 * {@link placedCatalogRowsOf} writes over the whole package: a `PlacedCatalogRef` for each token of
 * each instance's document, and an `AssembledCatalog` for each binding of an assembly's ID table
 * that a catalog owns.
 *
 * The rows restate what the tree says and nothing else: each card overlay's node tuple (C18), its
 * parent, and every attribute as written and that form collapsed. The database proves every one
 * of them (`catalogLaws`), so a row this builder gets wrong is refused, never accepted.
 */
import type { Addition } from "@bjornpagen/grizzle";
import { Option } from "effect";
import { booleanTrue, collapse } from "#pantry/grammar/domains.ts";
import { attributeRows, ValueIdentity } from "#pantry/grammar/install.ts";
import { foldAt, governorOf } from "#pantry/import/fold.ts";
import type { DocumentView } from "#pantry/import/fold.ts";
import { namedBy } from "#pantry/import/names.ts";
import type { Composed } from "#pantry/model/composed.ts";
import type { NodeRow } from "#pantry/model/xdm.ts";
import type { InstanceMember, InstanceRoot } from "#pantry/import/overlays/tests.ts";
import type {
  AssembledCatalog,
  CardSupport,
  CatalogId,
  CatalogRef,
  CatalogTarget,
  DefaultEntry,
  PlacedCatalogRef,
} from "#pantry/qti/catalog.ts";
import type { AssembledId } from "#pantry/qti/identity.ts";

/**
 * Where a document stands in its package, as this builder reads it beside the document's view: the
 * part of the importer's `DocumentPlace` (Q5.15) it needs.
 */
interface CatalogIds {
  /**
   * Whether the document is in an assembly (`Document.assembled`), so its references resolve per
   * instance (spec reading 117).
   */
  readonly assembled: boolean;
  /**
   * The package's manifest identifier.
   */
  readonly package: Addition<typeof CatalogRef>["package"];
  /**
   * The document's path in the package, its entry's.
   */
  readonly path: Addition<typeof CatalogRef>["path"];
}

/**
 * A document's catalog rows, one keyed set per relation: each map from the text of a row's key
 * within its document, its element's start (a token's own text for `CatalogTarget`), to the row as
 * its writer writes it.
 */
export interface CatalogRows {
  readonly CardSupport: ReadonlyMap<string, Addition<typeof CardSupport>>;
  readonly CatalogId: ReadonlyMap<string, Addition<typeof CatalogId>>;
  readonly CatalogRef: ReadonlyMap<string, Addition<typeof CatalogRef>>;
  readonly CatalogTarget: ReadonlyMap<string, Addition<typeof CatalogTarget>>;
  readonly DefaultEntry: ReadonlyMap<string, Addition<typeof DefaultEntry>>;
}

/**
 * A package's catalog tokens placed under each instance of each assembly, and the catalogs'
 * bindings of each assembly's ID table (spec reading 117), one keyed set per relation.
 */
export interface PlacedCatalogRows {
  readonly AssembledCatalog: ReadonlyMap<string, Addition<typeof AssembledCatalog>>;
  readonly PlacedCatalogRef: ReadonlyMap<string, Addition<typeof PlacedCatalogRef>>;
}

/**
 * The text of a row's key: its fields, in key order, as one string.
 *
 * @param values - The key's values.
 * @returns The key's text.
 */
const headingKey = (values: readonly string[]): string => JSON.stringify(values);

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

  return referencing.has(`${element.version} ${governor}`) && collapse(lexical) !== "";
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
 * @param view - The document's view: its rows, and their folds under its context (spec reading
 *   117).
 * @param ids - Where it stands in its package.
 * @returns Every catalog relation's rows, keyed by start.
 */
export const rowsOf = (view: DocumentView, ids: CatalogIds): CatalogRows => {
  const { folds, rows } = view;
  const { assembled, package: pkg, path } = ids;
  const byStart = new Map(rows.nodes.map((node) => [node.start, node] as const));
  const supports = new Map<string, Addition<typeof CardSupport>>();
  const defaults = new Map<string, Addition<typeof DefaultEntry>>();
  const references = new Map<string, Addition<typeof CatalogRef>>();
  const catalogIds = new Map<string, Addition<typeof CatalogId>>();
  const targets = new Map<string, Addition<typeof CatalogTarget>>();

  for (const { lexical, name, start } of rows.attributes) {
    const node = byStart.get(start);
    if (node === undefined) {
      continue;
    }

    const at = String(start);
    const place = { package: pkg, path, start };
    const value = collapse(lexical);
    if (name === referenceName) {
      if (holdsReference(node, lexical)) {
        references.set(at, { ...place, lexical, token: value });
        targets.set(value, { assembled, id: value, package: pkg, path });
      }

      continue;
    }

    // A catalog's `id` that is no NCName is no ID: it names no catalog, as it has no `DocumentId`
    // (spec reading 156), and its value domain refuses it alone.
    if (node.kind === "qti-catalog" && name === "id") {
      for (const catalog of Option.toArray(namedBy(lexical))) {
        catalogIds.set(at, { ...place, id: catalog, owner: start });
      }

      continue;
    }

    const isSupport = node.kind === "qti-card" && name === "support";
    const isDesignating =
      node.kind === "qti-card-entry" && name === "default" && designating.has(value);
    if (!isSupport && !isDesignating) {
      continue;
    }

    const tuple = {
      ...place,
      kind: node.kind,
      lexical,
      nearest: foldAt(folds, start).nearest,
      version: node.version,
    };
    if (isSupport) {
      supports.set(at, { ...tuple, catalog: node.parent });
    } else {
      defaults.set(at, { ...tuple, card: node.parent });
    }
  }

  return {
    CardSupport: supports,
    CatalogId: catalogIds,
    CatalogRef: references,
    CatalogTarget: targets,
    DefaultEntry: defaults,
  };
};

/**
 * An instance of an assembly's tree with its start, its pre-order position, which is its key.
 */
interface Numbered {
  readonly instance: InstanceMember | InstanceRoot;
  readonly start: bigint;
}

/**
 * Collect every instance of an assembly's tree in pre-order, its root's own first, each numbered
 * by its place in that order, as the instance tree draws `start`.
 *
 * @param root - The assembly's root instance.
 * @returns Each instance with its start.
 */
const instancesOf = (root: InstanceRoot): readonly Numbered[] => {
  const found: Numbered[] = [];
  const stack: (InstanceMember | InstanceRoot)[] = [root];
  for (let next = stack.pop(); next !== undefined; next = stack.pop()) {
    found.push({ instance: next, start: BigInt(found.length) });
    stack.push(...next.children.toReversed());
  }

  return found;
};

/**
 * Build a package's placed catalog tokens (spec reading 117): under each instance of each
 * assembly, a `PlacedCatalogRef` for every `CatalogTarget` of the instance's document; and, for
 * each binding of an assembly's ID table whose owner is a catalog, an `AssembledCatalog` row, one
 * for each assembly and id.
 *
 * @param input - The package's rows the placements read.
 * @param input.assembledIds - Every assembly's ID bindings ({@link placedIdRowsOf}'s
 *   `AssembledId`, in `#pantry/import/overlays/identity.ts`).
 * @param input.catalogs - Every document's catalogs ({@link rowsOf}'s `CatalogId`), whose elements
 *   own the ids that are catalog bindings.
 * @param input.instances - Every assembly's root instance, its tree nested (Q5.13's
 *   `assembledRowsOf`).
 * @param input.targets - Every document's catalog tokens ({@link rowsOf}'s `CatalogTarget`).
 * @returns The rows.
 */
export const placedCatalogRowsOf = (input: {
  readonly assembledIds: Iterable<Addition<typeof AssembledId>>;
  readonly catalogs: Iterable<Addition<typeof CatalogId>>;
  readonly instances: Iterable<InstanceRoot>;
  readonly targets: Iterable<Addition<typeof CatalogTarget>>;
}): PlacedCatalogRows => {
  const targetsOf = Map.groupBy(input.targets, ({ path }) => path);
  const catalogElements = new Set(
    [...input.catalogs].map(({ path, start }) => headingKey([path, String(start)])),
  );
  const placed = new Map<string, Addition<typeof PlacedCatalogRef>>();
  for (const root of input.instances) {
    for (const { instance, start } of instancesOf(root)) {
      for (const { id, path } of targetsOf.get(instance.document) ?? []) {
        placed.set(headingKey([root.assembly, String(start), id]), {
          assembly: root.assembly,
          id,
          instance: start,
          package: root.package,
          path,
        });
      }
    }
  }

  const bound = new Map<string, Addition<typeof AssembledCatalog>>();
  for (const { assembly, id, owner, package: pkg, path } of input.assembledIds) {
    if (catalogElements.has(headingKey([path, String(owner)]))) {
      bound.set(headingKey([assembly, id]), { assembly, id, owner, package: pkg, path });
    }
  }

  return { AssembledCatalog: bound, PlacedCatalogRef: placed };
};

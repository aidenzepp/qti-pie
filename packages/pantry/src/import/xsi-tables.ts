/**
 * The tables `xsi-types.ts` judges against: the rows of `seed/xsi.ts` gathered by schema set and
 * version, then by the key of the type (or global attribute) they belong to, and the keys and
 * names that find them. A pure module over those rows.
 */
import type { SchemaSetHandle } from "#pantry/schema/content/rosters.ts";
import type { SchemaVersionHandle } from "#pantry/schema/kinds/generic.ts";
import type {
  AttributeUseRow,
  GlobalAttributeTypeRow,
  SimpleFacetRow,
  SimpleMemberRow,
  TypeAttributeWildcardRow,
  TypeDerivationRow,
  TypeKey,
} from "#pantry/schema/seed/xsi.ts";
import {
  attributeUse,
  globalAttributeType,
  simpleFacet,
  simpleMember,
  typeAttributeWildcard,
  typeDerivation,
  typeNamespaces,
} from "#pantry/schema/seed/xsi.ts";

/**
 * The key of a type: its expanded name, or the path of the declaration that holds it.
 */
export const keyOf = (type: TypeKey): string =>
  "anonymous" in type ? `!${type.anonymous}` : `{${type.namespace}}${type.local}`;

/**
 * A type for a message.
 */
export const describe = (type: TypeKey): string =>
  "anonymous" in type ? `the anonymous type ${type.anonymous}` : `{${type.namespace}}${type.local}`;

/**
 * Whether `type` is the XML Schema built-in `local`.
 */
export const isBuiltin = (type: TypeKey, local: string): boolean =>
  "local" in type && type.namespace === typeNamespaces.xs && type.local === local;

/**
 * The key of an attribute or element name.
 */
export const nameKey = (namespace: string, local: string): string => `{${namespace}}${local}`;

/**
 * The rows of one schema set and version, by type.
 */
export interface Tables {
  readonly derivations: ReadonlyMap<string, TypeDerivationRow>;
  readonly facets: ReadonlyMap<string, readonly SimpleFacetRow[]>;
  readonly globals: ReadonlyMap<string, GlobalAttributeTypeRow>;
  readonly members: ReadonlyMap<string, readonly SimpleMemberRow[]>;
  readonly uses: ReadonlyMap<string, readonly AttributeUseRow[]>;
  readonly wildcards: ReadonlyMap<string, TypeAttributeWildcardRow>;
}

/**
 * The rows that belong to a schema set and version.
 */
interface Keyed {
  readonly set: SchemaSetHandle;
  readonly version: SchemaVersionHandle;
}

/**
 * Append `row` to the list `map` holds for `key`.
 */
const append = <A>(map: Map<string, A[]>, key: string, row: A): void => {
  const list = map.get(key);

  if (list === undefined) {
    map.set(key, [row]);
  } else {
    list.push(row);
  }
};

/**
 * The block of a schema set and version.
 */
const blockOf = (row: Keyed): string => `${row.set}/${row.version}`;

/**
 * The tables of every schema set and version, by `<set>/<version>`.
 */
export const blocks: ReadonlyMap<string, Tables> = (() => {
  const names = new Set<string>(
    [...typeDerivation, ...attributeUse, ...simpleFacet, ...simpleMember].map(blockOf),
  );
  const built = new Map<string, Tables>();

  for (const name of names) {
    const here = (row: Keyed): boolean => blockOf(row) === name;
    const derivations = new Map<string, TypeDerivationRow>();
    const facets = new Map<string, SimpleFacetRow[]>();
    const globals = new Map<string, GlobalAttributeTypeRow>();
    const members = new Map<string, SimpleMemberRow[]>();
    const uses = new Map<string, AttributeUseRow[]>();
    const wildcards = new Map<string, TypeAttributeWildcardRow>();

    for (const row of typeDerivation.filter(here)) {
      derivations.set(keyOf(row.type), row);
    }

    for (const row of simpleFacet.filter(here)) {
      append(facets, keyOf(row.type), row);
    }

    for (const row of simpleMember.filter(here)) {
      append(members, keyOf(row.type), row);
    }

    for (const row of attributeUse.filter(here)) {
      append(uses, keyOf(row.type), row);
    }

    for (const row of typeAttributeWildcard.filter(here)) {
      wildcards.set(keyOf(row.type), row);
    }

    for (const row of globalAttributeType.filter(here)) {
      globals.set(nameKey(row.namespace, row.local), row);
    }

    for (const list of members.values()) {
      list.sort((left, right) => left.position - right.position);
    }

    built.set(name, { derivations, facets, globals, members, uses, wildcards });
  }

  return built;
})();

/**
 * The tables of a schema set and version, empty when the tables hold none.
 */
export const tablesOf = (set: SchemaSetHandle, version: SchemaVersionHandle): Tables =>
  blocks.get(`${set}/${version}`) ?? {
    derivations: new Map(),
    facets: new Map(),
    globals: new Map(),
    members: new Map(),
    uses: new Map(),
    wildcards: new Map(),
  };

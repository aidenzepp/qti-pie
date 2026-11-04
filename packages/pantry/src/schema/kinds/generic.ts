/**
 * The generic vocabulary: the node kinds every document has whatever its schema, and the types
 * every kinds file shares.
 *
 * A kinds file holds data only: its `kinds` tuple, its `attributes` tuple, its `Admission` rows and
 * its registry. `xsi:schemaLocation` is admitted on every element and stored as `SchemaLocation`,
 * so it is not a registry attribute and no `attributes` tuple lists it.
 */
import { Option } from "effect";

/**
 * A QTI schema version the model admits.
 */
export type SchemaVersionHandle = "3.0.0" | "3.0.1";

/**
 * What the registry knows about one node kind: its XML name, its parent kind when its handle is
 * dotted, and the element-specific attribute local names its arm stores.
 */
export interface RegistryRow {
  readonly attributes: readonly string[];
  readonly local: string;
  readonly namespace: string;
  readonly parent: Option.Option<string>;
}

/**
 * One permitted parent and child pairing under a schema version.
 */
export interface AdmissionRow {
  readonly child: string;
  readonly parent: string;
  readonly version: SchemaVersionHandle;
}

/**
 * The generic kinds, in append-only order. They are children only: none is an element.
 */
export const kinds = ["text", "ws", "comment", "pi", "entityRef"] as const;

/**
 * The attribute names the generic kinds introduce: none.
 */
export const attributes = [] as const;

const notElement = {
  attributes: [],
  local: "",
  namespace: "",
  parent: Option.none(),
} satisfies RegistryRow;

/**
 * The registry row of each generic kind.
 */
export const registry: Readonly<Record<(typeof kinds)[number], RegistryRow>> = {
  comment: notElement,
  entityRef: notElement,
  pi: notElement,
  text: notElement,
  ws: notElement,
};

/**
 * The generic kinds are children only, so they admit nothing.
 */
export const admission: readonly AdmissionRow[] = [];

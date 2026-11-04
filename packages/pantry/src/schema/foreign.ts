/**
 * The foreign element: an element QTI 3.0 has no kind for, kept under the `foreign` node kind.
 *
 * `ForeignElement` is the arm of `foreign`, so every `Node` row of kind `foreign` is mirrored into
 * one `ForeignElement` row. It carries the element's namespace and local name, the kind of the
 * element it sits under, and the tree's root kind and the schema set its position is judged
 * against, so the wildcard laws can read them without a join. The laws and the relations that
 * judge a foreign tree are added beside it.
 */
import { closedId, relation, str, uuid } from "@bjornpagen/grizzle";
import { SchemaSet } from "#pantry/schema/content/rosters.ts";
import { NamespaceUri, XmlLocalName } from "#pantry/schema/contracts.ts";
import { NodeKind, RootKind } from "#pantry/schema/node.ts";
import * as patterns from "#pantry/schema/patterns.ts";

/**
 * One foreign element, with its local name, its namespace, the prefix it is written with, the kind
 * of its parent, its tree's root kind and the schema set it is judged against.
 */
export const ForeignElement = relation(
  "ForeignElement",
  {
    id: uuid,
    local: XmlLocalName,
    namespace: NamespaceUri,
    parentKind: closedId(NodeKind),
    prefix: str.regex(patterns.ncNameOrEmpty),
    rootKind: closedId(RootKind),
    schemaSet: closedId(SchemaSet),
  },
  ["id"],
);

/**
 * The relations of this module, as schema members.
 */
export const relations = { ForeignElement };

/**
 * The arm of the `foreign` node kind.
 */
export const arms = { foreign: ForeignElement };

/**
 * The statements of this module: none yet.
 */
export const rules = [] as const;

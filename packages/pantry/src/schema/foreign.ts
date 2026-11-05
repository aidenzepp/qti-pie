/**
 * The foreign tree: elements and attributes QTI 3.0 has no kind for, and the tables that say where
 * a wildcard admits them.
 *
 * `ForeignElement` is the arm of `foreign`, so every `Node` row of kind `foreign` is mirrored into
 * one `ForeignElement` row. It carries the element's namespace and local name, the kind of the
 * element it sits under, and the tree's root kind and the schema set its position is judged
 * against, so the wildcard guard can read them without a join. `ForeignAttribute` is the attribute
 * that an attribute wildcard admits and no kind declares.
 *
 * Seven relations are seeded and written by no role: the element and attribute wildcard hosts
 * (`WildcardHost`, `AttributeWildcard`), the namespaces each refuses (`WildcardExclusion`,
 * `AttributeExclusion`), the global declarations a wildcard's content is typed by
 * (`GlobalElement`, `GlobalAttribute`) and the schema set each root is judged against
 * (`RootSchemaSet`). Their rows are `seed/wildcard.ts`'s.
 *
 * The statements are the database's W5 and W8:
 *
 * - W5: a foreign attribute's processing is its host's.
 * - W8: a prefix goes with a namespace.
 *
 * W1, W2, W3, W6 and W7 are the importer's wildcard guard (`src/import/guards/wildcard.ts`,
 * decision 270), because grizzle cannot pair a seeded roster column with an author's namespace
 * text. W9 is the key per qualified name here, and the reader's per expanded name.
 *
 * The seeded relations key their namespace on `SchemaNamespace`, the closed roster of the
 * namespaces the schema sets name, so a seeded column holds a handle and never an author's text.
 */
import { check, closedId, contained, on, relation, str, uuid } from "@bjornpagen/grizzle";
import {
  NamespacePolicy,
  ProcessContents,
  SchemaNamespace,
  SchemaSet,
} from "#pantry/schema/content/rosters.ts";
import { NamespaceUri, XmlLocalName } from "#pantry/schema/contracts.ts";
import { Edge, Node, NodeKind, RootKind } from "#pantry/schema/node.ts";
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
 * One foreign attribute: an attribute no kind declares, on a node, with its expanded name, the
 * prefix it is written with, its processing, the tree's root kind, the schema set it is judged
 * against and its value as written. `process` is its host's, so decision 108's exemption can read
 * it. The key is the node's one attribute per qualified name: a prefix is bound to one namespace on
 * an element, and one per expanded name (W9) is refused by the XML reader before any row exists.
 */
export const ForeignAttribute = relation(
  "ForeignAttribute",
  {
    kind: closedId(NodeKind),
    local: XmlLocalName,
    namespace: NamespaceUri,
    node: uuid,
    prefix: str.regex(patterns.ncNameOrEmpty),
    process: closedId(ProcessContents),
    rootKind: closedId(RootKind),
    schemaSet: closedId(SchemaSet),
    value: str.regex(patterns.wildcard, patterns.wildcardFlags),
  },
  ["node", "prefix", "local"],
);

/**
 * An element wildcard host: what its wildcard admits, how it processes the content and the
 * namespace `##other` is relative to. Seeded.
 */
export const WildcardHost = relation(
  "WildcardHost",
  {
    host: closedId(NodeKind),
    policy: closedId(NamespacePolicy),
    process: closedId(ProcessContents),
    target: closedId(SchemaNamespace),
  },
  ["host"],
);

/**
 * An attribute wildcard host, in the form of `WildcardHost`. Seeded.
 */
export const AttributeWildcard = relation(
  "AttributeWildcard",
  {
    host: closedId(NodeKind),
    policy: closedId(NamespacePolicy),
    process: closedId(ProcessContents),
    target: closedId(SchemaNamespace),
  },
  ["host"],
);

/**
 * A namespace an element wildcard host refuses. Seeded.
 */
export const WildcardExclusion = relation(
  "WildcardExclusion",
  { host: closedId(NodeKind), namespace: closedId(SchemaNamespace) },
  ["host", "namespace"],
);

/**
 * A namespace an attribute wildcard host refuses. Seeded.
 */
export const AttributeExclusion = relation(
  "AttributeExclusion",
  { host: closedId(NodeKind), namespace: closedId(SchemaNamespace) },
  ["host", "namespace"],
);

/**
 * An element a schema set declares globally, so a wildcard types it. Seeded.
 */
export const GlobalElement = relation(
  "GlobalElement",
  { local: XmlLocalName, namespace: closedId(SchemaNamespace), set: closedId(SchemaSet) },
  ["set", "namespace", "local"],
);

/**
 * An attribute a schema set declares globally, so a wildcard types it. Seeded.
 */
export const GlobalAttribute = relation(
  "GlobalAttribute",
  { local: XmlLocalName, namespace: closedId(SchemaNamespace), set: closedId(SchemaSet) },
  ["set", "namespace", "local"],
);

/**
 * The schema set a root kind is judged against. Seeded.
 */
export const RootSchemaSet = relation(
  "RootSchemaSet",
  { root: closedId(RootKind), set: closedId(SchemaSet) },
  ["root"],
);

/**
 * The relations of this module, as schema members.
 */
export const relations = {
  AttributeExclusion,
  AttributeWildcard,
  ForeignAttribute,
  ForeignElement,
  GlobalAttribute,
  GlobalElement,
  RootSchemaSet,
  WildcardExclusion,
  WildcardHost,
};

/**
 * The arm of the `foreign` node kind.
 */
export const arms = { foreign: ForeignElement };

/**
 * The statements of this module. The row checks name handles as literals: a handle term is refused
 * against a `closedId` field of the whole roster, while a literal adopts the field's type.
 */
export const rules = [
  contained(on(WildcardExclusion, "host"), on(WildcardHost, "host")),
  contained(on(AttributeExclusion, "host"), on(AttributeWildcard, "host")),
  contained(on(ForeignElement, "id", "parentKind"), on(Edge, "child", "parentKind")),
  contained(on(ForeignElement, "id", "prefix", "rootKind"), on(Node, "id", "prefix", "rootKind")),
  contained(on(ForeignElement, "rootKind", "schemaSet"), on(RootSchemaSet, "root", "set")),
  check("ForeignUnqualifiedUnprefixed", ForeignElement, (row) =>
    row.or(row.ne(row.namespace, ""), row.eq(row.prefix, "")),
  ),
  contained(on(ForeignAttribute, "node", "kind", "rootKind"), on(Node, "id", "kind", "rootKind")),
  contained(on(ForeignAttribute, "rootKind", "schemaSet"), on(RootSchemaSet, "root", "set")),
  contained(on(ForeignAttribute, "kind", "process"), on(AttributeWildcard, "host", "process")),
  check("ForeignAttributePrefix", ForeignAttribute, (row) =>
    row.or(
      row.and(row.eq(row.namespace, ""), row.eq(row.prefix, "")),
      row.and(row.ne(row.namespace, ""), row.ne(row.prefix, "")),
    ),
  ),
] as const;

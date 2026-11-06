/**
 * The QTI document: the one tree a package resource points at, with its identity inside the
 * package, its root kind and schema version, and the `identifier` and `title` its root element
 * carries.
 *
 * `identifier` and `title` are rows of the document, counted per root kind by capacity statements:
 * a document root that has the attribute has exactly one row, any other has none. The arms of the
 * root elements are the kinds files' and `item.ts`'s, so this module declares none.
 */
import {
  capacity,
  closed,
  closedId,
  contained,
  key,
  on,
  relation,
  select,
  str,
  uuid,
  within,
} from "@bjornpagen/grizzle";
import {
  AttributeName,
  Node,
  NodeKind,
  RootKind,
  SchemaVersion,
  Tree,
} from "#pantry/schema/node.ts";
import type { RootKindHandle } from "#pantry/schema/node.ts";
import { Package, PackageEntry, Resource, RootOfType } from "#pantry/schema/package.ts";
import { ManifestIdentifier, PackagePath } from "#pantry/schema/contracts.ts";
import * as patterns from "#pantry/schema/patterns.ts";

const ncName = str.regex(patterns.ncName);

const resourceType = str.regex(patterns.resourceType);

/**
 * The elements of a document that hold an `id` other rows refer to.
 */
export const IdHolder = closed("IdHolder", [
  "responseDeclaration",
  "htmlId",
  "itemBody",
  "printedVariable",
  "contextDeclaration",
  "xmlId",
]);

/**
 * A QTI document of a package: the entry it is read from, the resource that lists it, its tree's
 * root kind and schema version, and a copy of the resource's type that `RootOfType` judges against
 * the root. Its id is its tree's id.
 */
export const Document = relation(
  "Document",
  {
    id: uuid,
    package: uuid,
    path: PackagePath,
    resource: ManifestIdentifier,
    resourceType,
    root: closedId(RootKind),
    version: closedId(SchemaVersion),
  },
  ["id"],
);

/**
 * The `identifier` of a document's root element. `package`, `resource` and `root` copy the
 * document's so the identifier is unique within its package and counted by root kind.
 */
export const DocumentIdentifier = relation(
  "DocumentIdentifier",
  {
    document: uuid,
    package: uuid,
    resource: ManifestIdentifier,
    root: closedId(RootKind),
    value: ncName,
  },
  ["document"],
);

/**
 * The `title` of a document's root element, with the whitespace-collapsed form it is judged on
 * beside the value as written.
 *
 * The collapsed form holds at most 256 non-space characters, a representation limit
 * (campaign decision 26), because a key-shaped containment target or index holds it.
 */
export const DocumentTitle = relation(
  "DocumentTitle",
  {
    collapsed: str.regex(patterns.boundedToken, patterns.boundedTokenFlags),
    document: uuid,
    package: uuid,
    resource: ManifestIdentifier,
    root: closedId(RootKind),
    value: str.regex(patterns.xsNormalizedString, patterns.xsNormalizedStringFlags),
  },
  ["document"],
);

/**
 * An `id` a document declares on one of its holders, once per document.
 */
export const DocumentId = relation(
  "DocumentId",
  { document: uuid, holder: closedId(IdHolder), id: ncName },
  ["document", "id"],
);

/**
 * The `id` of an element of the HTML profile, with the kind of the element that holds it. The
 * `(node)` key holds because an element has one `id`, and a containment can only reach a
 * projection that is keyed. `attribute` is always `id`: it makes `(kind, attribute)` the pair the
 * `AttributeAdmission` containment reads, because a containment into a selected target is refused.
 */
export const HtmlId = relation(
  "HtmlId",
  {
    attribute: closedId(AttributeName),
    document: uuid,
    id: ncName,
    kind: closedId(NodeKind),
    node: uuid,
  },
  ["document", "id"],
);

/**
 * The `xml:id` of an element of a document, once per document, in `HtmlId`'s shape: it shares the
 * document's `id` space with every other holder of `DocumentId`. `attribute` is always `xml:id`.
 * The value is the bare NCName: the item's `xs:ID` space is another module's concern.
 */
export const DocumentXmlId = relation(
  "DocumentXmlId",
  {
    attribute: closedId(AttributeName),
    document: uuid,
    id: ncName,
    kind: closedId(NodeKind),
    node: uuid,
  },
  ["document", "id"],
);

/**
 * The `id` of the item body.
 */
export const ItemBodyId = relation("ItemBodyId", { document: uuid, id: ncName, node: uuid }, [
  "document",
  "id",
]);

/**
 * The `id` of a printed variable.
 */
export const PrintedVariableId = relation(
  "PrintedVariableId",
  { document: uuid, id: ncName, node: uuid },
  ["document", "id"],
);

/**
 * The `id` of a context declaration.
 */
export const ContextDeclarationId = relation(
  "ContextDeclarationId",
  { document: uuid, id: ncName, node: uuid },
  ["document", "id"],
);

/**
 * The root kinds whose root element has an `identifier` and a `title`, and the ones that have
 * neither (the external metadata record's root is a `lom:lom`); `outcomes` has an identifier and no
 * title.
 */
const identified: Readonly<Record<RootKindHandle, boolean>> = {
  externalLom: false,
  item: true,
  manifest: false,
  outcomes: true,
  rptemplate: false,
  section: true,
  stimulus: true,
  test: true,
  usagedata: false,
};

const titled: Readonly<Record<RootKindHandle, boolean>> = {
  ...identified,
  outcomes: false,
};

/**
 * The count of `from` rows per document of one root kind: exactly one where the kind has the
 * attribute, none where it does not.
 */
const count = (bound: Readonly<Record<RootKindHandle, boolean>>, handle: RootKindHandle) =>
  bound[handle] ? within(1n, 1n) : within(0n, 0n);

/**
 * The relations and rosters of this module, as schema members.
 */
export const relations = {
  ContextDeclarationId,
  Document,
  DocumentId,
  DocumentIdentifier,
  DocumentTitle,
  DocumentXmlId,
  HtmlId,
  IdHolder,
  ItemBodyId,
  PrintedVariableId,
};

/**
 * The root elements' arms, none: the item root's is `item.ts`'s.
 */
export const arms = {};

/**
 * The statements over this module's relations: a document is identified within its package by its
 * path and by its resource, lies in the package's manifest entries and resources under the
 * package's schema version, is the tree it names, and has a resource type its root kind is listed
 * under; each identifier and title belongs to a document and copies its package, resource and
 * root; each root kind has one identifier or none, and one title or none; each declared id belongs
 * to a document; each holder arm of the HTML profile, the item body, the printed variables and
 * the context declarations is keyed by its node and lies in the node's tree. The arms join
 * `DocumentId` in `declaration.ts`, not here.
 */
export const rules = [
  key(Document, ["package", "path"]),
  key(Document, ["package", "resource"]),
  contained(on(Document, "package", "path"), on(PackageEntry, "package", "path")),
  contained(on(Document, "package", "resource"), on(Resource, "package", "identifier")),
  contained(on(Document, "package", "version"), on(Package, "id", "schemaversion")),
  contained(on(Document, "id", "version", "root"), on(Tree, "id", "version", "root")),
  contained(
    on(Document, "package", "resource", "resourceType"),
    on(Resource, "package", "identifier", "type"),
  ),
  contained(on(Document, "resourceType", "root"), on(RootOfType, "type", "root")),
  key(DocumentIdentifier, ["package", "resource"]),
  contained(
    on(DocumentIdentifier, "document", "package", "resource", "root"),
    on(Document, "id", "package", "resource", "root"),
  ),
  ...RootKind.handles.map((handle) =>
    capacity(on(select(Document, { root: handle }), "id"), {
      from: on(DocumentIdentifier, "document"),
      within: count(identified, handle),
    }),
  ),
  key(DocumentTitle, ["package", "resource"]),
  contained(
    on(DocumentTitle, "document", "package", "resource", "root"),
    on(Document, "id", "package", "resource", "root"),
  ),
  ...RootKind.handles.map((handle) =>
    capacity(on(select(Document, { root: handle }), "id"), {
      from: on(DocumentTitle, "document"),
      within: count(titled, handle),
    }),
  ),
  contained(on(DocumentId, "document"), on(Document, "id")),
  key(HtmlId, ["node"]),
  contained(on(HtmlId, "node", "document", "kind"), on(Node, "id", "tree", "kind")),
  key(DocumentXmlId, ["node"]),
  contained(on(DocumentXmlId, "node", "document", "kind"), on(Node, "id", "tree", "kind")),
  key(ItemBodyId, ["node"]),
  contained(on(ItemBodyId, "node", "document"), on(Node, "id", "tree")),
  key(PrintedVariableId, ["node"]),
  contained(on(PrintedVariableId, "node", "document"), on(Node, "id", "tree")),
  key(ContextDeclarationId, ["node"]),
  contained(on(ContextDeclarationId, "node", "document"), on(Node, "id", "tree")),
] as const;

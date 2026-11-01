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
import { RootKind, SchemaVersion, Tree } from "#qti/schema/node.ts";
import type { RootKindHandle } from "#qti/schema/node.ts";
import { Package, PackageEntry, Resource, RootOfType } from "#qti/schema/package.ts";
import * as patterns from "#qti/schema/patterns.ts";

const hrefInPackage = str.regex(patterns.hrefInPackage);

const ncName = str.regex(patterns.ncName);

const resourceType = str.regex(patterns.resourceType);

/**
 * The elements of a document that hold an `id` other rows refer to.
 */
export const IdHolder = closed("IdHolder", ["responseDeclaration"]);

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
    path: hrefInPackage,
    resource: ncName,
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
    resource: ncName,
    root: closedId(RootKind),
    value: ncName,
  },
  ["document"],
);

/**
 * The `title` of a document's root element, with the whitespace-collapsed form it is judged on
 * beside the value as written.
 */
export const DocumentTitle = relation(
  "DocumentTitle",
  {
    collapsed: str.regex(patterns.xsToken, patterns.xsTokenFlags),
    document: uuid,
    package: uuid,
    resource: ncName,
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
 * The root kinds whose root element has an `identifier` and a `title`, and the ones that have
 * neither; `outcomes` has an identifier and no title.
 */
const identified: Readonly<Record<RootKindHandle, boolean>> = {
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
export const relations = { Document, DocumentId, DocumentIdentifier, DocumentTitle, IdHolder };

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
 * to a document.
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
] as const;

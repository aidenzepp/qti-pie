/**
 * The references a test, a section and a stimulus resolve, and the in-package files an attribute
 * names.
 *
 * An item reference resolves to a package file whose root is an item or to an LTI resource of the
 * manifest, a section or stimulus reference to a document of the package, and a URI attribute to a
 * file inside the package. None of these is an attribute, so none has a home, and the statements
 * over their rows are this module's `rules`.
 */
import {
  alternatives,
  check,
  closedId,
  contained,
  on,
  pg,
  relation,
  select,
  uuid,
} from "@bjornpagen/grizzle";
import { ItemRefTarget } from "#pantry/schema/content/rosters.ts";
import { PackagePath } from "#pantry/schema/contracts.ts";
import { AttributeAdmission } from "#pantry/schema/attributes.ts";
import { Document } from "#pantry/schema/document.ts";
import { AttributeName, Node, NodeKind } from "#pantry/schema/node.ts";
import { PackageEntry, Resource } from "#pantry/schema/package.ts";
import { ItemStimulusRef } from "#pantry/schema/stimulus.ts";
import { ItemRef, SectionRef } from "#pantry/schema/test/structure.ts";

/**
 * The package file an item reference resolves to, at `path` in `package`, and the kind of target
 * it is.
 */
export const ItemRefResolution = relation(
  "ItemRefResolution",
  { itemRef: uuid, package: uuid, path: PackagePath, targetKind: closedId(ItemRefTarget) },
  ["itemRef"],
);

/**
 * The item document an item reference resolves to: the document at `path` in `package`.
 */
export const ItemRefDocument = relation(
  "ItemRefDocument",
  { document: uuid, itemRef: uuid, package: uuid, path: PackagePath },
  ["itemRef"],
);

/**
 * The LTI resource an item reference resolves to, by the `identifier` and `type` of the
 * package's `Resource`.
 */
export const ItemRefLti = relation(
  "ItemRefLti",
  {
    itemRef: uuid,
    package: uuid,
    resource: Resource.fields.identifier,
    type: Resource.fields.type,
  },
  ["itemRef"],
);

/**
 * The section document a section reference resolves to: the document at `path` in `package`.
 */
export const SectionRefResolution = relation(
  "SectionRefResolution",
  { document: uuid, package: uuid, path: PackagePath, sectionRef: uuid },
  ["sectionRef"],
);

/**
 * The stimulus document a stimulus reference resolves to: the document at `path` in `package`.
 */
export const StimulusRefResolution = relation(
  "StimulusRefResolution",
  { document: uuid, package: uuid, path: PackagePath, stimulusRef: uuid },
  ["stimulusRef"],
);

/**
 * A file inside the package that a URI attribute of `node` names, at `position` among the
 * candidates of that attribute (several for a `srcset`), found at `path` in `package`, with the
 * `document` the node is in.
 */
export const AttributeFileReference = relation(
  "AttributeFileReference",
  {
    attribute: closedId(AttributeName),
    document: uuid,
    kind: closedId(NodeKind),
    node: uuid,
    package: uuid,
    path: PackagePath,
    position: pg.bigint,
  },
  ["node", "attribute", "position"],
);

/**
 * The relations this module declares.
 */
export const relations = {
  AttributeFileReference,
  ItemRefDocument,
  ItemRefLti,
  ItemRefResolution,
  SectionRefResolution,
  StimulusRefResolution,
} as const;

/**
 * The statements over this module's relations. An item reference resolves to a document whose root
 * is an item or to an LTI resource of the package, whose type is one of the three LTI types; a
 * section or stimulus reference resolves to a document whose root is a section or a stimulus; each
 * reference has its resolution. A file reference names a node, a document of that node's tree, an
 * entry of the document's package and an attribute its node kind admits.
 *
 * Two statements the spec makes are not here: a file reference's path is no `File`'s `href`, and an
 * LTI resolution's path is no `ResourceHref`'s `href`. Neither `File` nor `ResourceHref` holds a
 * key on `(package, href)`, so grizzle admits no containment into it; the importer's reference
 * guards check both over the rows.
 */
export const rules = [
  alternatives(ItemRefResolution, "targetKind", ItemRefTarget, {
    item: ItemRefDocument,
    lti: ItemRefLti,
  }),
  contained(
    on(ItemRefDocument, "package", "path", "document"),
    on(select(Document, { root: "item" }), "package", "path", "id"),
  ),
  contained(
    on(ItemRefLti, "package", "resource", "type"),
    on(Resource, "package", "identifier", "type"),
  ),
  check("ItemRefLtiType", ItemRefLti, (l) =>
    l.in(l.type, ["imsbasiclti_xmlv1p3", "imslti_xmlv1p1", "imsltia_xmlv1p0"]),
  ),
  contained(on(ItemRef, "id"), on(ItemRefResolution, "itemRef")),
  contained(
    on(SectionRefResolution, "package", "path", "document"),
    on(select(Document, { root: "section" }), "package", "path", "id"),
  ),
  contained(on(SectionRef, "id"), on(SectionRefResolution, "sectionRef")),
  contained(
    on(StimulusRefResolution, "package", "path", "document"),
    on(select(Document, { root: "stimulus" }), "package", "path", "id"),
  ),
  contained(on(ItemStimulusRef, "id"), on(StimulusRefResolution, "stimulusRef")),
  contained(on(AttributeFileReference, "node", "kind"), on(Node, "id", "kind")),
  contained(on(AttributeFileReference, "node", "document"), on(Node, "id", "tree")),
  contained(on(AttributeFileReference, "document", "package"), on(Document, "id", "package")),
  contained(on(AttributeFileReference, "package", "path"), on(PackageEntry, "package", "path")),
  contained(
    on(AttributeFileReference, "kind", "attribute"),
    on(AttributeAdmission, "kind", "attribute"),
  ),
] as const;

/**
 * The references a test, a section and a stimulus resolve, and the in-package files an attribute
 * names.
 *
 * An item reference resolves to a package file whose root is an item or to an LTI resource of the
 * manifest, a section or stimulus reference to a document of the package, and a URI attribute to a
 * file inside the package. None of these is an attribute, so none has a home, and the statements
 * over their rows arrive with the laws heading.
 */
import { closedId, pg, relation, uuid } from "@bjornpagen/grizzle";
import { ItemRefTarget } from "#pantry/schema/content/rosters.ts";
import { PackagePath } from "#pantry/schema/contracts.ts";
import { AttributeName, NodeKind } from "#pantry/schema/node.ts";
import { Resource } from "#pantry/schema/package.ts";

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
 * The statements this module declares: none.
 */
export const rules = [] as const;

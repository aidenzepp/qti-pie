/**
 * The languages of a package's documents and of its resources' LOM records, and the rules that tie
 * the two together.
 *
 * A document's language set is the `xml:lang` values written in its tree. `DocumentLang` holds one
 * row per distinct value, flagged by whether the resource's LOM `general` category also declares
 * it. A resource's LOM set is its `lom:language` values; `ResourceLomLanguageSet` holds one row
 * per distinct value, with the resource it belongs to copied for the rule that judges a document
 * against it. `ResourceLomGeneral` marks the resources whose record has a `general` category.
 */
import { closedId, contained, key, on, relation, select, str, uuid } from "@bjornpagen/grizzle";
import { NodeLabel, NodeXmlLang } from "#qti/schema/attributes.ts";
import { YesNo } from "#qti/schema/content/rosters.ts";
import { Document } from "#qti/schema/document.ts";
import { ItemToolBoth } from "#qti/schema/item.ts";
import { LomGeneral, LomLanguage, ResourceLom } from "#qti/schema/metadata.ts";
import * as patterns from "#qti/schema/patterns.ts";

const bcp47 = str.regex(patterns.bcp47);

const ncName = str.regex(patterns.ncName);

const xsLanguageOrEmpty = str.regex(patterns.xsLanguageOrEmpty);

/**
 * One `xml:lang` value in a document's tree, with whether the resource's LOM `general` category
 * declares it too, and the package and resource of the document it copies.
 */
export const DocumentLang = relation(
  "DocumentLang",
  {
    document: uuid,
    lomGeneral: closedId(YesNo),
    package: uuid,
    resource: ncName,
    value: bcp47,
  },
  ["document", "value"],
);

/**
 * One `lom:language` value of a resource's record, with the package and resource it copies.
 */
export const ResourceLomLanguageSet = relation(
  "ResourceLomLanguageSet",
  { lom: uuid, package: uuid, resource: ncName, value: xsLanguageOrEmpty },
  ["lom", "value"],
);

/**
 * A resource whose LOM record has a `general` category.
 */
export const ResourceLomGeneral = relation(
  "ResourceLomGeneral",
  { lom: uuid, package: uuid, resource: ncName },
  ["lom"],
);

/**
 * The relations of this module, as schema members.
 */
export const relations = { DocumentLang, ResourceLomGeneral, ResourceLomLanguageSet };

/**
 * The arms this module adds to `alternatives`: none.
 */
export const arms = {};

/**
 * The statements over this module's relations and the leaf relations they read.
 *
 * A language row belongs to its document and, through the document's resource, to the record
 * of the same resource. The resource's set is keyed by its record and, because `ResourceLom` holds
 * `(package, resource)` as a key, by the resource as well. Every `xml:lang` of an item tree is a
 * `DocumentLang` row; manifest `lom:string` languages are not item documents and are not
 * refused. A flagged document language is in the resource's LOM set and the resource's record
 * has a `general` category; every resource-owned `lom:language` is in that set. A label in an
 * item tree needs both tool values (goal 3.12).
 */
export const rules = [
  contained(
    on(DocumentLang, "document", "package", "resource"),
    on(Document, "id", "package", "resource"),
  ),
  key(ResourceLomLanguageSet, ["package", "resource", "value"]),
  contained(
    on(ResourceLomLanguageSet, "lom", "package", "resource"),
    on(ResourceLom, "lom", "package", "resource"),
  ),
  key(ResourceLomGeneral, ["package", "resource"]),
  contained(on(ResourceLomGeneral, "lom"), on(LomGeneral, "lom")),
  contained(
    on(ResourceLomGeneral, "lom", "package", "resource"),
    on(ResourceLom, "lom", "package", "resource"),
  ),
  contained(
    on(select(NodeXmlLang, { rootKind: "item" }), "tree", "value"),
    on(DocumentLang, "document", "value"),
  ),
  contained(
    on(select(DocumentLang, { lomGeneral: "yes" }), "package", "resource", "value"),
    on(ResourceLomLanguageSet, "package", "resource", "value"),
  ),
  contained(
    on(select(DocumentLang, { lomGeneral: "yes" }), "package", "resource"),
    on(ResourceLomGeneral, "package", "resource"),
  ),
  contained(
    on(select(LomLanguage, { owner: "resource" }), "lom", "value"),
    on(ResourceLomLanguageSet, "lom", "value"),
  ),
  contained(on(select(NodeLabel, { rootKind: "item" }), "tree"), on(ItemToolBoth, "tree")),
] as const;

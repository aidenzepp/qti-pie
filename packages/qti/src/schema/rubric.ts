/**
 * Rubric blocks, stylesheets and the two thin hooks the item kinds reserve.
 *
 * A rubric block states what a scorer or candidate is told: its `use` names the purpose and its
 * `view` lists who reads it. A stylesheet link names a stylesheet by `href` and media type. The
 * catalog and companion-materials infos are hooks: each is a node with no attribute and no child
 * relation of its own, and its admitted children stay none until the later milestone that fills
 * them.
 */
import { contained, on, relation, str, uuid } from "@bjornpagen/grizzle";
import { ContentMediaType, StylesheetUri } from "#qti/schema/contracts.ts";
import * as patterns from "#qti/schema/patterns.ts";

/**
 * A `qti-rubric-block`: its required `use` (`instructions`, `scoring`, `navigation` or an `ext:`
 * name) and its required `view`, a non-empty list of the roles that read it.
 */
export const RubricBlock = relation(
  "RubricBlock",
  { id: uuid, use: str.regex(patterns.useEnumExt), view: str.regex(patterns.viewList) },
  ["id"],
);

/**
 * A `qti-stylesheet`: the location and media type of the stylesheet it links.
 */
export const Stylesheet = relation(
  "Stylesheet",
  { href: StylesheetUri, id: uuid, type: ContentMediaType },
  ["id"],
);

/**
 * A stylesheet's `media`, when it has one.
 */
export const StylesheetMedia = relation(
  "StylesheetMedia",
  { node: uuid, value: str.regex(patterns.xsString, patterns.xsStringFlags) },
  ["node"],
);

/**
 * A stylesheet's `title`, when it has one.
 */
export const StylesheetTitle = relation(
  "StylesheetTitle",
  { node: uuid, value: str.regex(patterns.xsNormalizedString, patterns.xsNormalizedStringFlags) },
  ["node"],
);

/**
 * A `qti-catalog-info`: a hook with no attribute and no child relation.
 */
export const CatalogInfo = relation("CatalogInfo", { id: uuid }, ["id"]);

/**
 * A `qti-companion-materials-info`: a hook with no attribute and no child relation.
 */
export const CompanionMaterialsInfo = relation("CompanionMaterialsInfo", { id: uuid }, ["id"]);

/**
 * The relations of this module, as schema members.
 */
export const relations = {
  CatalogInfo,
  CompanionMaterialsInfo,
  RubricBlock,
  Stylesheet,
  StylesheetMedia,
  StylesheetTitle,
};

/**
 * The rubric kinds' arms, keyed by their `NodeKind` handles.
 */
export const arms = {
  "qti-catalog-info": CatalogInfo,
  "qti-companion-materials-info": CompanionMaterialsInfo,
  "qti-rubric-block": RubricBlock,
  "qti-stylesheet": Stylesheet,
};

/**
 * The statements over this module's relations: a stylesheet's optional values belong to a
 * stylesheet.
 */
export const rules = [
  contained(on(StylesheetMedia, "node"), on(Stylesheet, "id")),
  contained(on(StylesheetTitle, "node"), on(Stylesheet, "id")),
] as const;

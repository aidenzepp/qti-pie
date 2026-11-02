/**
 * The composed schema: every module's relations and rosters, every module's statements, and the
 * two alternatives statements that bind the node and tree rosters to their arms.
 *
 * `grizzle` requires exactly one `closed("NodeKind")` and one `alternatives` over it, so the `Node`
 * statement is written here and nowhere else; the modules export their arms and leave the
 * containments into `Node` to it.
 */
import { alternatives, schema } from "@bjornpagen/grizzle";
import * as ancestry from "#qti/schema/ancestry.ts";
import * as attributes from "#qti/schema/attributes.ts";
import * as choices from "#qti/schema/choices.ts";
import * as rosters from "#qti/schema/content/rosters.ts";
import * as declaration from "#qti/schema/declaration.ts";
import * as document from "#qti/schema/document.ts";
import * as feedback from "#qti/schema/feedback.ts";
import * as html from "#qti/schema/html.ts";
import * as htmlMedia from "#qti/schema/html/media.ts";
import * as htmlStructure from "#qti/schema/html/structure.ts";
import * as htmlText from "#qti/schema/html/text.ts";
import * as interaction from "#qti/schema/interaction.ts";
import * as associate from "#qti/schema/interactions/associate.ts";
import * as gap from "#qti/schema/interactions/gap.ts";
import * as hot from "#qti/schema/interactions/hot.ts";
import * as order from "#qti/schema/interactions/order.ts";
import * as other from "#qti/schema/interactions/other.ts";
import * as textInteraction from "#qti/schema/interactions/text.ts";
import * as item from "#qti/schema/item.ts";
import * as lang from "#qti/schema/lang.ts";
import * as mapping from "#qti/schema/mapping.ts";
import * as metadata from "#qti/schema/metadata.ts";
import * as node from "#qti/schema/node.ts";
import * as pkg from "#qti/schema/package.ts";
import * as processing from "#qti/schema/processing.ts";
import * as rubric from "#qti/schema/rubric.ts";
import * as coords from "#qti/schema/shapes.ts";
import * as template from "#qti/schema/template.ts";
import * as value from "#qti/schema/value.ts";

export const Qti = schema(
  "Qti",
  {
    ...node.relations,
    ...pkg.relations,
    ...document.relations,
    ...metadata.relations,
    ...declaration.relations,
    ...value.relations,
    ...interaction.relations,
    ...processing.relations,
    ...item.relations,
    ...html.relations,
    ...rosters.relations,
    ...ancestry.relations,
    ...attributes.relations,
    ...htmlText.relations,
    ...htmlStructure.relations,
    ...htmlMedia.relations,
    ...choices.relations,
    ...coords.relations,
    ...order.relations,
    ...associate.relations,
    ...gap.relations,
    ...hot.relations,
    ...textInteraction.relations,
    ...other.relations,
    ...feedback.relations,
    ...template.relations,
    ...rubric.relations,
    ...mapping.relations,
    ...lang.relations,
  },
  [
    ...node.rules,
    ...pkg.rules,
    ...document.rules,
    ...metadata.rules,
    ...declaration.rules,
    ...value.rules,
    ...interaction.rules,
    ...processing.rules,
    ...item.rules,
    ...html.rules,
    ...rosters.rules,
    ...ancestry.rules,
    ...attributes.rules,
    ...htmlText.rules,
    ...htmlStructure.rules,
    ...htmlMedia.rules,
    ...choices.rules,
    ...coords.rules,
    ...order.rules,
    ...associate.rules,
    ...gap.rules,
    ...hot.rules,
    ...textInteraction.rules,
    ...other.rules,
    ...feedback.rules,
    ...template.rules,
    ...rubric.rules,
    ...mapping.rules,
    ...lang.rules,
    alternatives(node.Node, "kind", node.NodeKind, {
      ...node.arms,
      ...declaration.arms,
      ...value.arms,
      ...interaction.arms,
      ...processing.arms,
      ...item.arms,
      ...html.arms,
      ...pkg.arms,
      ...metadata.arms,
      ...ancestry.arms,
      ...attributes.arms,
      ...htmlText.arms,
      ...htmlStructure.arms,
      ...htmlMedia.arms,
      ...choices.arms,
      ...coords.arms,
      ...order.arms,
      ...associate.arms,
      ...gap.arms,
      ...hot.arms,
      ...textInteraction.arms,
      ...other.arms,
      ...feedback.arms,
      ...template.arms,
      ...rubric.arms,
      ...mapping.arms,
      ...lang.arms,
    }),
    alternatives(node.Tree, "kind", node.TreeKind, {
      document: document.Document,
      manifest: pkg.Manifest,
    }),
  ],
);

/**
 * The composed schema: every module's relations and rosters, every module's statements, the
 * `Node` law, and the alternatives statement that binds the tree roster to its arms.
 *
 * The `Node` law is one `contained` from `Node.kind` into `NodeKind` plus one `mirrors` per
 * handle, from the `Node` rows of that kind into the handle's arm. That is the `alternatives`
 * helper's own expansion (grizzle `statements.ts:341-346`), written out so that no single
 * function holds every arm. It is written here and nowhere else; the modules export their arms
 * and leave the containments into `Node` to it.
 */
import { alternatives, contained, mirrors, on, schema, select } from "@bjornpagen/grizzle";
import * as ancestry from "#qti/schema/ancestry.ts";
import * as attributes from "#qti/schema/attributes.ts";
import * as choices from "#qti/schema/choices.ts";
import * as csm from "#qti/schema/csm.ts";
import * as rosters from "#qti/schema/content/rosters.ts";
import * as declaration from "#qti/schema/declaration.ts";
import * as expression from "#qti/schema/expression.ts";
import * as expressionAttributes from "#qti/schema/expression-attributes.ts";
import * as document from "#qti/schema/document.ts";
import * as feedback from "#qti/schema/feedback.ts";
import * as html from "#qti/schema/html.ts";
import * as htmlMedia from "#qti/schema/html/media.ts";
import * as htmlStructure from "#qti/schema/html/structure.ts";
import * as htmlTemplate from "#qti/schema/html/template.ts";
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
import * as outcome from "#qti/schema/outcome.ts";
import * as pkg from "#qti/schema/package.ts";
import * as processing from "#qti/schema/processing.ts";
import * as rubric from "#qti/schema/rubric.ts";
import * as rule from "#qti/schema/rule.ts";
import * as coords from "#qti/schema/shapes.ts";
import * as template from "#qti/schema/template.ts";
import * as usage from "#qti/schema/usage.ts";
import * as value from "#qti/schema/value.ts";

/**
 * The arm of each `NodeKind` handle, one relation per handle.
 */
export const nodeArms = {
  ...node.arms,
  ...declaration.arms,
  ...value.arms,
  ...interaction.arms,
  ...processing.arms,
  ...expression.arms,
  ...expressionAttributes.arms,
  ...rule.arms,
  ...item.arms,
  ...html.arms,
  ...pkg.arms,
  ...metadata.arms,
  ...csm.arms,
  ...usage.arms,
  ...ancestry.arms,
  ...attributes.arms,
  ...htmlText.arms,
  ...htmlStructure.arms,
  ...htmlMedia.arms,
  ...htmlTemplate.arms,
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
};

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
    ...expression.relations,
    ...expressionAttributes.relations,
    ...rule.relations,
    ...item.relations,
    ...html.relations,
    ...rosters.relations,
    ...ancestry.relations,
    ...attributes.relations,
    ...htmlText.relations,
    ...htmlStructure.relations,
    ...htmlMedia.relations,
    ...htmlTemplate.relations,
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
    ...outcome.relations,
    ...csm.relations,
    ...usage.relations,
    StatisticKind: usage.StatisticKind,
    TargetObjectType: usage.TargetObjectType,
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
    ...expression.rules,
    ...expressionAttributes.rules,
    ...rule.rules,
    ...item.rules,
    ...html.rules,
    ...rosters.rules,
    ...ancestry.rules,
    ...attributes.rules,
    ...htmlText.rules,
    ...htmlStructure.rules,
    ...htmlMedia.rules,
    ...htmlTemplate.rules,
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
    ...outcome.rules,
    ...csm.rules,
    ...usage.rules,
    contained(on(node.Node, "kind"), on(node.NodeKind, "id")),
    ...node.NodeKind.handles.map((kind) =>
      mirrors(on(select(node.Node, { kind }), "id"), on(nodeArms[kind], "id")),
    ),
    alternatives(node.Tree, "kind", node.TreeKind, {
      document: document.Document,
      manifest: pkg.Manifest,
    }),
  ],
);

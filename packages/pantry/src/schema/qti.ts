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
import * as ancestry from "#pantry/schema/ancestry.ts";
import * as attributes from "#pantry/schema/attributes.ts";
import * as choices from "#pantry/schema/choices.ts";
import * as csm from "#pantry/schema/csm.ts";
import * as rosters from "#pantry/schema/content/rosters.ts";
import * as declaration from "#pantry/schema/declaration.ts";
import * as expression from "#pantry/schema/expression.ts";
import * as expressionAttributes from "#pantry/schema/expression-attributes.ts";
import * as document from "#pantry/schema/document.ts";
import * as feedback from "#pantry/schema/feedback.ts";
import * as foreignAttributes from "#pantry/schema/foreign-attributes.ts";
import * as foreign from "#pantry/schema/foreign.ts";
import * as html from "#pantry/schema/html.ts";
import * as htmlMedia from "#pantry/schema/html/media.ts";
import * as htmlStructure from "#pantry/schema/html/structure.ts";
import * as htmlTemplate from "#pantry/schema/html/template.ts";
import * as htmlText from "#pantry/schema/html/text.ts";
import * as interaction from "#pantry/schema/interaction.ts";
import * as associate from "#pantry/schema/interactions/associate.ts";
import * as gap from "#pantry/schema/interactions/gap.ts";
import * as hot from "#pantry/schema/interactions/hot.ts";
import * as order from "#pantry/schema/interactions/order.ts";
import * as other from "#pantry/schema/interactions/other.ts";
import * as textInteraction from "#pantry/schema/interactions/text.ts";
import * as item from "#pantry/schema/item.ts";
import * as lang from "#pantry/schema/lang.ts";
import * as mapping from "#pantry/schema/mapping.ts";
import * as metadata from "#pantry/schema/metadata.ts";
import * as node from "#pantry/schema/node.ts";
import * as outcome from "#pantry/schema/outcome.ts";
import * as pkg from "#pantry/schema/package.ts";
import * as processing from "#pantry/schema/processing.ts";
import * as rubric from "#pantry/schema/rubric.ts";
import * as rule from "#pantry/schema/rule.ts";
import * as coords from "#pantry/schema/shapes.ts";
import * as template from "#pantry/schema/template.ts";
import * as usage from "#pantry/schema/usage.ts";
import * as value from "#pantry/schema/value.ts";
import * as xlink from "#pantry/schema/xlink.ts";

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
  ...foreign.arms,
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
    ...foreign.relations,
    ...foreignAttributes.relations,
    ...xlink.relations,
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
    ...foreign.rules,
    ...foreignAttributes.rules,
    ...xlink.rules,
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

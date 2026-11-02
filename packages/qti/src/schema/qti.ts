/**
 * The composed schema: every module's relations and rosters, every module's statements, and the
 * two alternatives statements that bind the node and tree rosters to their arms.
 *
 * `grizzle` requires exactly one `closed("NodeKind")` and one `alternatives` over it, so the `Node`
 * statement is written here and nowhere else; the modules export their arms and leave the
 * containments into `Node` to it.
 */
import { alternatives, schema } from "@bjornpagen/grizzle";
import * as csm from "#qti/schema/csm.ts";
import * as declaration from "#qti/schema/declaration.ts";
import * as document from "#qti/schema/document.ts";
import * as expression from "#qti/schema/expression.ts";
import * as expressionAttributes from "#qti/schema/expression-attributes.ts";
import * as html from "#qti/schema/html.ts";
import * as interaction from "#qti/schema/interaction.ts";
import * as item from "#qti/schema/item.ts";
import * as metadata from "#qti/schema/metadata.ts";
import * as node from "#qti/schema/node.ts";
import * as outcome from "#qti/schema/outcome.ts";
import * as pkg from "#qti/schema/package.ts";
import * as processing from "#qti/schema/processing.ts";
import * as usage from "#qti/schema/usage.ts";
import * as rule from "#qti/schema/rule.ts";
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
    ...expression.relations,
    ...expressionAttributes.relations,
    ...rule.relations,
    ...item.relations,
    ...html.relations,
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
    ...outcome.rules,
    ...csm.rules,
    ...usage.rules,
    alternatives(node.Node, "kind", node.NodeKind, {
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
    }),
    alternatives(node.Tree, "kind", node.TreeKind, {
      document: document.Document,
      manifest: pkg.Manifest,
    }),
  ],
);

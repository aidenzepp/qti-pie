/**
 * The composed schema: every module's relations and rosters, every module's statements, and the
 * two alternatives statements that bind the node and tree rosters to their arms.
 *
 * `grizzle` requires exactly one `closed("NodeKind")` and one `alternatives` over it, so the `Node`
 * statement is written here and nowhere else; the modules export their arms and leave the
 * containments into `Node` to it.
 */
import { alternatives, schema } from "@bjornpagen/grizzle";
import * as declaration from "#qti/schema/declaration.ts";
import * as document from "#qti/schema/document.ts";
import * as html from "#qti/schema/html.ts";
import * as interaction from "#qti/schema/interaction.ts";
import * as item from "#qti/schema/item.ts";
import * as metadata from "#qti/schema/metadata.ts";
import * as node from "#qti/schema/node.ts";
import * as outcome from "#qti/schema/outcome.ts";
import * as pkg from "#qti/schema/package.ts";
import * as processing from "#qti/schema/processing.ts";
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
    ...outcome.relations,
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
    ...outcome.rules,
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
    }),
    alternatives(node.Tree, "kind", node.TreeKind, {
      document: document.Document,
      manifest: pkg.Manifest,
    }),
  ],
);

/**
 * Which base type and cardinality an interaction kind can bind to.
 */
import type { BaseType, TypedCardinality } from "#qti/schema/declaration.ts";
import type { NodeKindHandle } from "#qti/schema/node.ts";

/**
 * A pairing an interaction kind accepts: the base type and cardinality of the variable it binds.
 */
export interface BindingFitRow {
  readonly baseType: (typeof BaseType.handles)[number];
  readonly cardinality: (typeof TypedCardinality.handles)[number];
  readonly interactionKind: NodeKindHandle;
}

/**
 * The pairings the choice interaction accepts: one identifier, or several. The record rows belong
 * to a later phase.
 */
export const bindingFit: readonly BindingFitRow[] = [
  { baseType: "identifier", cardinality: "single", interactionKind: "qti-choice-interaction" },
  { baseType: "identifier", cardinality: "multiple", interactionKind: "qti-choice-interaction" },
];

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
 * The pairings each interaction accepts, from the required-binding table of the interaction
 * research (section 10.1): the choice interaction's two rows, then 38 rows for the other 19
 * interactions (40 in all). Every typed row of the table is here, one per base type and
 * cardinality its row lists. The record rows of `qti-text-entry-interaction` and
 * `qti-extended-text-interaction` (a record has no base type) belong to `RecordBindingFit`, and
 * `qti-custom-interaction` and the portable custom interaction, unconstrained, have no row.
 */
export const bindingFit: readonly BindingFitRow[] = [
  { baseType: "identifier", cardinality: "single", interactionKind: "qti-choice-interaction" },
  { baseType: "identifier", cardinality: "multiple", interactionKind: "qti-choice-interaction" },
  { baseType: "identifier", cardinality: "ordered", interactionKind: "qti-order-interaction" },
  { baseType: "pair", cardinality: "single", interactionKind: "qti-associate-interaction" },
  { baseType: "pair", cardinality: "multiple", interactionKind: "qti-associate-interaction" },
  { baseType: "directedPair", cardinality: "single", interactionKind: "qti-match-interaction" },
  { baseType: "directedPair", cardinality: "multiple", interactionKind: "qti-match-interaction" },
  { baseType: "directedPair", cardinality: "single", interactionKind: "qti-gap-match-interaction" },
  {
    baseType: "directedPair",
    cardinality: "multiple",
    interactionKind: "qti-gap-match-interaction",
  },
  {
    baseType: "identifier",
    cardinality: "single",
    interactionKind: "qti-inline-choice-interaction",
  },
  { baseType: "string", cardinality: "single", interactionKind: "qti-text-entry-interaction" },
  { baseType: "integer", cardinality: "single", interactionKind: "qti-text-entry-interaction" },
  { baseType: "float", cardinality: "single", interactionKind: "qti-text-entry-interaction" },
  { baseType: "string", cardinality: "single", interactionKind: "qti-extended-text-interaction" },
  { baseType: "string", cardinality: "multiple", interactionKind: "qti-extended-text-interaction" },
  { baseType: "string", cardinality: "ordered", interactionKind: "qti-extended-text-interaction" },
  { baseType: "integer", cardinality: "single", interactionKind: "qti-extended-text-interaction" },
  {
    baseType: "integer",
    cardinality: "multiple",
    interactionKind: "qti-extended-text-interaction",
  },
  { baseType: "integer", cardinality: "ordered", interactionKind: "qti-extended-text-interaction" },
  { baseType: "float", cardinality: "single", interactionKind: "qti-extended-text-interaction" },
  { baseType: "float", cardinality: "multiple", interactionKind: "qti-extended-text-interaction" },
  { baseType: "float", cardinality: "ordered", interactionKind: "qti-extended-text-interaction" },
  { baseType: "identifier", cardinality: "single", interactionKind: "qti-hottext-interaction" },
  { baseType: "identifier", cardinality: "multiple", interactionKind: "qti-hottext-interaction" },
  { baseType: "identifier", cardinality: "single", interactionKind: "qti-hotspot-interaction" },
  { baseType: "identifier", cardinality: "multiple", interactionKind: "qti-hotspot-interaction" },
  { baseType: "point", cardinality: "single", interactionKind: "qti-select-point-interaction" },
  { baseType: "point", cardinality: "multiple", interactionKind: "qti-select-point-interaction" },
  {
    baseType: "identifier",
    cardinality: "ordered",
    interactionKind: "qti-graphic-order-interaction",
  },
  { baseType: "pair", cardinality: "single", interactionKind: "qti-graphic-associate-interaction" },
  {
    baseType: "pair",
    cardinality: "multiple",
    interactionKind: "qti-graphic-associate-interaction",
  },
  {
    baseType: "directedPair",
    cardinality: "multiple",
    interactionKind: "qti-graphic-gap-match-interaction",
  },
  { baseType: "point", cardinality: "single", interactionKind: "qti-position-object-interaction" },
  {
    baseType: "point",
    cardinality: "multiple",
    interactionKind: "qti-position-object-interaction",
  },
  { baseType: "integer", cardinality: "single", interactionKind: "qti-slider-interaction" },
  { baseType: "float", cardinality: "single", interactionKind: "qti-slider-interaction" },
  { baseType: "file", cardinality: "single", interactionKind: "qti-drawing-interaction" },
  { baseType: "integer", cardinality: "single", interactionKind: "qti-media-interaction" },
  { baseType: "file", cardinality: "single", interactionKind: "qti-upload-interaction" },
  { baseType: "boolean", cardinality: "single", interactionKind: "qti-end-attempt-interaction" },
];

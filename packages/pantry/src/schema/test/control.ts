/**
 * The test's control elements: selection and ordering, the adaptive selection and its references,
 * the item session control and the time limits.
 *
 * Each arm is thin: its node only, until the schema slice of its heading widens it. The arms'
 * containments into `Node` are not written here: one `mirrors` per handle in the composed schema
 * (`#pantry/schema/qti.ts`) binds them.
 */
import { relation, uuid } from "@bjornpagen/grizzle";

/**
 * A `qti-selection` element.
 */
export const Selection = relation("Selection", { id: uuid }, ["id"]);

/**
 * A `qti-ordering` element.
 */
export const Ordering = relation("Ordering", { id: uuid }, ["id"]);

/**
 * A `qti-adaptive-selection` element.
 */
export const AdaptiveSelection = relation("AdaptiveSelection", { id: uuid }, ["id"]);

/**
 * A `qti-adaptive-engine-ref` element.
 */
export const AdaptiveEngineRef = relation("AdaptiveEngineRef", { id: uuid }, ["id"]);

/**
 * A `qti-adaptive-settings-ref` element.
 */
export const AdaptiveSettingsRef = relation("AdaptiveSettingsRef", { id: uuid }, ["id"]);

/**
 * A `qti-usagedata-ref` element.
 */
export const UsageDataRef = relation("UsageDataRef", { id: uuid }, ["id"]);

/**
 * A `qti-metadata-ref` element.
 */
export const MetadataRef = relation("MetadataRef", { id: uuid }, ["id"]);

/**
 * A `qti-item-session-control` element.
 */
export const ItemSessionControl = relation("ItemSessionControl", { id: uuid }, ["id"]);

/**
 * A `qti-time-limits` element.
 */
export const TimeLimits = relation("TimeLimits", { id: uuid }, ["id"]);

/**
 * The `NodeKind` handles this module arms, each with its arm.
 */
export const arms = {
  "qti-adaptive-engine-ref": AdaptiveEngineRef,
  "qti-adaptive-selection": AdaptiveSelection,
  "qti-adaptive-settings-ref": AdaptiveSettingsRef,
  "qti-item-session-control": ItemSessionControl,
  "qti-metadata-ref": MetadataRef,
  "qti-ordering": Ordering,
  "qti-selection": Selection,
  "qti-time-limits": TimeLimits,
  "qti-usagedata-ref": UsageDataRef,
} as const;

/**
 * The relations this module declares.
 */
export const relations = {
  AdaptiveEngineRef,
  AdaptiveSelection,
  AdaptiveSettingsRef,
  ItemSessionControl,
  MetadataRef,
  Ordering,
  Selection,
  TimeLimits,
  UsageDataRef,
} as const;

/**
 * The statements this module declares: none.
 */
export const rules = [] as const;

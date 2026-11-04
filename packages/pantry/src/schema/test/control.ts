/**
 * The test's control elements: selection and ordering, the adaptive selection and its references,
 * the item session control and the time limits.
 *
 * The arms' containments into `Node` are not written here: one `mirrors` per handle in the
 * composed schema (`#pantry/schema/qti.ts`) binds them, and the statements over these rows, other
 * than the one candidate key a later containment targets, arrive with the laws heading.
 *
 * A required attribute is a column of its arm; an optional one is a relation of its own keyed
 * `node`; a defaulted one is a typed column plus a `Declared*` marker of one `node` column that
 * says the source wrote it (the placement rules of `#pantry/schema/attribute-homes.ts`). Integers
 * are `bigint` columns; a non-canonical spelling is an `AttributeSpelling` row.
 */
import { closedId, key, pg, relation, uuid } from "@bjornpagen/grizzle";
import { XsBoolean } from "#pantry/schema/content/rosters.ts";
import {
  AdaptiveRefHref,
  AdaptiveRefIdentifier,
  TimeLimitSeconds,
} from "#pantry/schema/contracts.ts";

/**
 * A `qti-selection` element. `select` is required; `withReplacement` defaults to `false`, and
 * `DeclaredWithReplacement` holds the selections that wrote it. `section` is the parent section's
 * id, and a section holds at most one selection.
 */
export const Selection = relation(
  "Selection",
  { id: uuid, section: uuid, select: pg.bigint, withReplacement: closedId(XsBoolean) },
  ["id"],
);

/**
 * A selection copied to its section: the `(section, select, withReplacement)` a later containment
 * binds to `Selection`, so the section's selection bounds are checked against a row keyed by the
 * section.
 */
export const SelectionBounded = relation(
  "SelectionBounded",
  { section: uuid, select: pg.bigint, withReplacement: closedId(XsBoolean) },
  ["section"],
);

/**
 * A selection whose `with-replacement` attribute was written, as opposed to defaulted.
 */
export const DeclaredWithReplacement = relation("DeclaredWithReplacement", { node: uuid }, [
  "node",
]);

/**
 * A `qti-ordering` element. `shuffle` defaults to `false`.
 */
export const Ordering = relation("Ordering", { id: uuid, shuffle: closedId(XsBoolean) }, ["id"]);

/**
 * An ordering whose `shuffle` attribute was written, as opposed to defaulted.
 */
export const DeclaredOrderingShuffle = relation("DeclaredOrderingShuffle", { node: uuid }, [
  "node",
]);

/**
 * A `qti-adaptive-selection` element, thin: its attributes are none.
 */
export const AdaptiveSelection = relation("AdaptiveSelection", { id: uuid }, ["id"]);

/**
 * A `qti-adaptive-engine-ref` element: the `identifier` and `href` both required.
 */
export const AdaptiveEngineRef = relation(
  "AdaptiveEngineRef",
  { href: AdaptiveRefHref, id: uuid, identifier: AdaptiveRefIdentifier },
  ["id"],
);

/**
 * A `qti-adaptive-settings-ref` element.
 */
export const AdaptiveSettingsRef = relation(
  "AdaptiveSettingsRef",
  { href: AdaptiveRefHref, id: uuid, identifier: AdaptiveRefIdentifier },
  ["id"],
);

/**
 * A `qti-usagedata-ref` element.
 */
export const UsageDataRef = relation(
  "UsageDataRef",
  { href: AdaptiveRefHref, id: uuid, identifier: AdaptiveRefIdentifier },
  ["id"],
);

/**
 * A `qti-metadata-ref` element.
 */
export const MetadataRef = relation(
  "MetadataRef",
  { href: AdaptiveRefHref, id: uuid, identifier: AdaptiveRefIdentifier },
  ["id"],
);

/**
 * A `qti-item-session-control` element. The six booleans default to the XSD's: `allowReview` and
 * `allowSkipping` to `true`, the rest to `false`; each `Declared*` marker holds the elements that
 * wrote it.
 */
export const ItemSessionControl = relation(
  "ItemSessionControl",
  {
    allowComment: closedId(XsBoolean),
    allowReview: closedId(XsBoolean),
    allowSkipping: closedId(XsBoolean),
    id: uuid,
    showFeedback: closedId(XsBoolean),
    showSolution: closedId(XsBoolean),
    validateResponses: closedId(XsBoolean),
  },
  ["id"],
);

/**
 * An item session control whose `allow-comment` attribute was written, as opposed to defaulted.
 */
export const DeclaredAllowComment = relation("DeclaredAllowComment", { node: uuid }, ["node"]);

/**
 * An item session control whose `allow-review` attribute was written, as opposed to defaulted.
 */
export const DeclaredAllowReview = relation("DeclaredAllowReview", { node: uuid }, ["node"]);

/**
 * An item session control whose `allow-skipping` attribute was written, as opposed to defaulted.
 */
export const DeclaredAllowSkipping = relation("DeclaredAllowSkipping", { node: uuid }, ["node"]);

/**
 * An item session control whose `show-feedback` attribute was written, as opposed to defaulted.
 */
export const DeclaredShowFeedback = relation("DeclaredShowFeedback", { node: uuid }, ["node"]);

/**
 * An item session control whose `show-solution` attribute was written, as opposed to defaulted.
 */
export const DeclaredShowSolution = relation("DeclaredShowSolution", { node: uuid }, ["node"]);

/**
 * An item session control whose `validate-responses` attribute was written, as opposed to
 * defaulted.
 */
export const DeclaredValidateResponses = relation("DeclaredValidateResponses", { node: uuid }, [
  "node",
]);

/**
 * The `max-attempts` of an item session control, an `xs:int` the source may omit: it has no
 * default.
 */
export const ItemSessionMaxAttempts = relation(
  "ItemSessionMaxAttempts",
  { node: uuid, value: pg.bigint },
  ["node"],
);

/**
 * A `qti-time-limits` element. `allowLateSubmission` defaults to `false`.
 */
export const TimeLimits = relation(
  "TimeLimits",
  { allowLateSubmission: closedId(XsBoolean), id: uuid },
  ["id"],
);

/**
 * A time limits element whose `allow-late-submission` attribute was written, as opposed to
 * defaulted.
 */
export const DeclaredAllowLateSubmission = relation("DeclaredAllowLateSubmission", { node: uuid }, [
  "node",
]);

/**
 * The `min-time` of a time limits element, in seconds as written, which the source may omit.
 */
export const TimeLimitMin = relation("TimeLimitMin", { node: uuid, value: TimeLimitSeconds }, [
  "node",
]);

/**
 * The `max-time` of a time limits element, in seconds as written, which the source may omit.
 */
export const TimeLimitMax = relation("TimeLimitMax", { node: uuid, value: TimeLimitSeconds }, [
  "node",
]);

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
  DeclaredAllowComment,
  DeclaredAllowLateSubmission,
  DeclaredAllowReview,
  DeclaredAllowSkipping,
  DeclaredOrderingShuffle,
  DeclaredShowFeedback,
  DeclaredShowSolution,
  DeclaredValidateResponses,
  DeclaredWithReplacement,
  ItemSessionControl,
  ItemSessionMaxAttempts,
  MetadataRef,
  Ordering,
  Selection,
  SelectionBounded,
  TimeLimitMax,
  TimeLimitMin,
  TimeLimits,
  UsageDataRef,
} as const;

/**
 * The statements this module declares: the candidate key a later containment targets. A section
 * holds at most one selection, so `Selection.section` is unique, and `SelectionBounded` contains
 * into `Selection.(section, select, withReplacement)`.
 */
export const rules = [key(Selection, ["section"])] as const;

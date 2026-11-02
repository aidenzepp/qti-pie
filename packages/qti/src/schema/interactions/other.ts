/**
 * The interactions that carry no choices: `qti-media-interaction`, `qti-upload-interaction`,
 * `qti-drawing-interaction`, `qti-slider-interaction` and `qti-end-attempt-interaction`, with the
 * optional values each may carry. The attributes are the inventory entries of the same names. None
 * of the five is the parent of a node of this module, so no relation here is the child of one: a
 * prompt, a media object or a drawing's picture belongs to its own module.
 *
 * A media interaction's `autostart` is required, and `loop` is `false`, `max-plays` and
 * `min-plays` are 0 where the source omits them. The plays are typed columns, 0 where omitted,
 * beside the lexical optionals `MediaMaxPlays` and `MediaMinPlays`, which hold the text as
 * written. A maximum of 0 means no limit, so the minimum is at most the maximum unless the maximum
 * is 0: the shipped schematron's rule, which also rejects `max-plays="0"` with a positive
 * `min-plays`, is wrong about that and is not reproduced.
 *
 * A slider's `step` has no column: the XSD's default of 1.0 is wrong for a slider bound to a float,
 * which is continuous where the source does not declare a step, so `SliderStep` holds it when the
 * source does. An end-attempt interaction's `title` is required.
 */
import {
  check,
  closedId,
  contained,
  on,
  pg,
  relation,
  select,
  str,
  uuid,
} from "@bjornpagen/grizzle";
import { InteractionBinding } from "#qti/schema/interaction.ts";
import { Node, RootKind } from "#qti/schema/node.ts";
import * as patterns from "#qti/schema/patterns.ts";

/**
 * An `xs:boolean` attribute's lexical form.
 */
const xsBoolean = str.regex(patterns.xsBoolean);

/**
 * An `xs:nonNegativeInteger` attribute's lexical form.
 */
const xsNonNegativeInteger = str.regex(patterns.xsNonNegativeInteger);

/**
 * An `xs:normalizedString` attribute's value, as the typed column holds it after replacement.
 */
const xsNormalizedString = str.regex(patterns.xsNormalizedString, patterns.xsNormalizedStringFlags);

/**
 * An identifier: an `xs:NCName`.
 */
const ncName = str.regex(patterns.ncName);

/**
 * An `xs:double` that is zero or greater.
 */
const nonNegativeDouble = str.regex(patterns.nonNegativeDouble);

/**
 * An `xs:double` that is greater than zero.
 */
const positiveDouble = str.regex(patterns.positiveDouble);

/**
 * An `orientation`: `vertical` or `horizontal`.
 */
const orientation = str.regex(patterns.orientation);

/**
 * The coordinates of a rectangle: four `CoordsDType` tokens.
 */
const coordsRect = str.regex(patterns.coordsRect);

/**
 * Media types separated by spaces, or the empty list.
 */
const mimeTypeList = str.regex(patterns.mimeTypeList);

/**
 * A `qti-media-interaction`. `autostart` is required. `loop` is `false` and the plays are 0 where
 * the source omits them; a maximum of 0 is no limit.
 */
export const MediaInteraction = relation(
  "MediaInteraction",
  {
    autostart: xsBoolean,
    id: uuid,
    loop: xsBoolean,
    maxPlaysN: pg.bigint,
    minPlaysN: pg.bigint,
    responseIdentifier: ncName,
    rootKind: closedId(RootKind),
  },
  ["id"],
);

/**
 * A `qti-upload-interaction`.
 */
export const UploadInteraction = relation(
  "UploadInteraction",
  { id: uuid, responseIdentifier: ncName, rootKind: closedId(RootKind) },
  ["id"],
);

/**
 * A `qti-drawing-interaction`.
 */
export const DrawingInteraction = relation(
  "DrawingInteraction",
  { id: uuid, responseIdentifier: ncName, rootKind: closedId(RootKind) },
  ["id"],
);

/**
 * A `qti-slider-interaction`. `stepLabel` is `false` where the source omits it.
 */
export const SliderInteraction = relation(
  "SliderInteraction",
  {
    id: uuid,
    lowerBound: nonNegativeDouble,
    responseIdentifier: ncName,
    rootKind: closedId(RootKind),
    stepLabel: xsBoolean,
    upperBound: nonNegativeDouble,
  },
  ["id"],
);

/**
 * A `qti-end-attempt-interaction`: an empty element. `title` is required.
 */
export const EndAttemptInteraction = relation(
  "EndAttemptInteraction",
  {
    id: uuid,
    responseIdentifier: ncName,
    rootKind: closedId(RootKind),
    title: xsNormalizedString,
  },
  ["id"],
);

/**
 * A media interaction's `max-plays` as written, when it has one.
 */
export const MediaMaxPlays = relation(
  "MediaMaxPlays",
  { node: uuid, value: xsNonNegativeInteger },
  ["node"],
);

/**
 * A media interaction's `min-plays` as written, when it has one.
 */
export const MediaMinPlays = relation(
  "MediaMinPlays",
  { node: uuid, value: xsNonNegativeInteger },
  ["node"],
);

/**
 * A media interaction's `coordinates`, when it has them: always a rectangle, so the shape is not
 * recorded and the value is not a `Coords` row.
 */
export const MediaCoords = relation("MediaCoords", { node: uuid, value: coordsRect }, ["node"]);

/**
 * An upload interaction's `type`, when it has one. The empty list is a value the XSD admits.
 */
export const UploadType = relation("UploadType", { node: uuid, value: mimeTypeList }, ["node"]);

/**
 * A slider interaction's `step`, when the source declares one. Without it the slider is
 * continuous, so the arm has no `step` column.
 */
export const SliderStep = relation("SliderStep", { node: uuid, value: positiveDouble }, ["node"]);

/**
 * A slider interaction's `orientation`, when it has one.
 */
export const SliderOrientation = relation("SliderOrientation", { node: uuid, value: orientation }, [
  "node",
]);

/**
 * A slider interaction's `reverse`, when it has one.
 */
export const SliderReverse = relation("SliderReverse", { node: uuid, value: xsBoolean }, ["node"]);

/**
 * An end-attempt interaction's `count-attempt`, when it has one: the XSD gives it no default.
 */
export const EndAttemptCountAttempt = relation(
  "EndAttemptCountAttempt",
  { node: uuid, value: xsBoolean },
  ["node"],
);

/**
 * The source wrote `loop` on this media interaction.
 */
export const DeclaredMediaLoop = relation("DeclaredMediaLoop", { node: uuid }, ["node"]);

/**
 * The source wrote `step-label` on this slider interaction.
 */
export const DeclaredSliderStepLabel = relation("DeclaredSliderStepLabel", { node: uuid }, [
  "node",
]);

/**
 * The arms of the five kinds, keyed by their `NodeKind` handles. Their containments into `Node`
 * are expanded by `alternatives` in the composed schema.
 */
export const arms = {
  "qti-drawing-interaction": DrawingInteraction,
  "qti-end-attempt-interaction": EndAttemptInteraction,
  "qti-media-interaction": MediaInteraction,
  "qti-slider-interaction": SliderInteraction,
  "qti-upload-interaction": UploadInteraction,
};

/**
 * The relations of this module, as schema members.
 */
export const relations = {
  DeclaredMediaLoop,
  DeclaredSliderStepLabel,
  DrawingInteraction,
  EndAttemptCountAttempt,
  EndAttemptInteraction,
  MediaCoords,
  MediaInteraction,
  MediaMaxPlays,
  MediaMinPlays,
  SliderInteraction,
  SliderOrientation,
  SliderReverse,
  SliderStep,
  UploadInteraction,
  UploadType,
};

/**
 * The statements over this module's relations: each arm is a node of its root kind, and an item's
 * interaction has a binding for its response variable; a media interaction's minimum plays are at
 * most its maximum unless the maximum is 0 (unlimited); every marker and optional value belongs to
 * its owner.
 */
export const rules = [
  contained(on(MediaInteraction, "id", "rootKind"), on(Node, "id", "rootKind")),
  contained(
    on(select(MediaInteraction, { rootKind: "item" }), "id", "responseIdentifier"),
    on(InteractionBinding, "node", "responseIdentifier"),
  ),
  contained(on(UploadInteraction, "id", "rootKind"), on(Node, "id", "rootKind")),
  contained(
    on(select(UploadInteraction, { rootKind: "item" }), "id", "responseIdentifier"),
    on(InteractionBinding, "node", "responseIdentifier"),
  ),
  contained(on(DrawingInteraction, "id", "rootKind"), on(Node, "id", "rootKind")),
  contained(
    on(select(DrawingInteraction, { rootKind: "item" }), "id", "responseIdentifier"),
    on(InteractionBinding, "node", "responseIdentifier"),
  ),
  contained(on(SliderInteraction, "id", "rootKind"), on(Node, "id", "rootKind")),
  contained(
    on(select(SliderInteraction, { rootKind: "item" }), "id", "responseIdentifier"),
    on(InteractionBinding, "node", "responseIdentifier"),
  ),
  contained(on(EndAttemptInteraction, "id", "rootKind"), on(Node, "id", "rootKind")),
  contained(
    on(select(EndAttemptInteraction, { rootKind: "item" }), "id", "responseIdentifier"),
    on(InteractionBinding, "node", "responseIdentifier"),
  ),
  check("MediaPlays", MediaInteraction, (r) =>
    r.or(r.eq(r.maxPlaysN, 0n), r.ge(r.maxPlaysN, r.minPlaysN)),
  ),
  contained(on(MediaMaxPlays, "node"), on(MediaInteraction, "id")),
  contained(on(MediaMinPlays, "node"), on(MediaInteraction, "id")),
  contained(on(MediaCoords, "node"), on(MediaInteraction, "id")),
  contained(on(DeclaredMediaLoop, "node"), on(MediaInteraction, "id")),
  contained(on(UploadType, "node"), on(UploadInteraction, "id")),
  contained(on(SliderStep, "node"), on(SliderInteraction, "id")),
  contained(on(SliderOrientation, "node"), on(SliderInteraction, "id")),
  contained(on(SliderReverse, "node"), on(SliderInteraction, "id")),
  contained(on(DeclaredSliderStepLabel, "node"), on(SliderInteraction, "id")),
  contained(on(EndAttemptCountAttempt, "node"), on(EndAttemptInteraction, "id")),
] as const;

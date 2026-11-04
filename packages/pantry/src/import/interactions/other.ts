/**
 * The rows of the other interactions: media, upload, drawing, slider and end-attempt.
 *
 * Each interaction is written as its arm, the optional values and markers its attributes call for,
 * and its binding to the response variable it names. A binding's `maxCount` is the sentinel 1: no
 * count attribute bounds these kinds, and the kind's `BindingFit` rows alone say which variables
 * they accept.
 */
import type { Uuid } from "@bjornpagen/grizzle";
import { judgedLater } from "#pantry/import/judged.ts";
import { requiredAttribute } from "#pantry/import/required.ts";
import { Effect, Option } from "effect";
import type { InteractionContext, MarkerRelation, NodeRef } from "#pantry/import/interactions.ts";
import type { ImportRefused } from "#pantry/import/refusal.ts";
import { closedOf, Rows, spelledInteger, typedAttribute } from "#pantry/import/tree.ts";
import type { ItemRefusal, UnmodeledVocabulary } from "#pantry/import/tree.ts";
import { Orientation, XsBoolean } from "#pantry/schema/content/rosters.ts";
import { MediaRectCoords } from "#pantry/schema/contracts.ts";
import {
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
} from "#pantry/schema/interactions/other.ts";
import type { AncestryHandle } from "#pantry/schema/node.ts";
import type { Element } from "@qti-pie/crust/tree.ts";

/**
 * The `maxCount` the other interactions' typed bindings hold.
 */
const sentinelCount = 1n;

/**
 * The rows of an optional value's relation: one row when the source wrote the attribute, none
 * otherwise.
 */
const valueFact = <T extends string>(
  node: Uuid,
  value: Option.Option<string>,
  judge: (read: string) => T,
): readonly { readonly node: Uuid; readonly value: T }[] =>
  Option.match(value, {
    onNone: () => [],
    onSome: (own) => [{ node, value: judge(own) }],
  });

/**
 * A text value as an optional's column holds it: a plain string.
 */
const plain = (read: string): string => read;

/**
 * The rows of an optional value's relation over a closed roster: one row, its value narrowed to a
 * handle, when the source wrote the attribute, none otherwise.
 *
 * @param node - The node the value belongs to.
 * @param value - The attribute's text, when the source wrote it.
 * @param handles - The roster's handles.
 * @param where - The element and attribute, in a short phrase, for the refusal's detail.
 * @returns The rows; `ImportRefused` (`attribute-lexical`) for text outside the roster.
 */
const closedFact = <const Handle extends string>(
  node: Uuid,
  value: Option.Option<string>,
  handles: readonly Handle[],
  where: string,
): Effect.Effect<readonly { readonly node: Uuid; readonly value: Handle }[], ImportRefused> =>
  Option.match(value, {
    onNone: () => Effect.succeed([]),
    onSome: (own) =>
      Effect.map(closedOf(handles, own, "attribute-lexical", where), (handle) => [
        { node, value: handle },
      ]),
  });

type MarkerSet = Readonly<Record<string, MarkerRelation>>;

type Owned = NodeRef & { readonly ancestry: AncestryHandle };

/**
 * Write the binding of one interaction to the variable its `response-identifier` names.
 */
const bound = (
  ctx: InteractionContext,
  rows: Rows,
  node: Owned,
  responseIdentifier: string,
): Effect.Effect<Rows, ItemRefusal> =>
  ctx.shared.bindingRows(
    rows,
    node.id,
    ctx.documentId,
    node.kind,
    responseIdentifier,
    Option.fromNullishOr(ctx.declarations.get(responseIdentifier)),
    node.ancestry,
    ctx.item.adaptive,
    sentinelCount,
  );

/**
 * The plays of a media interaction as its typed column holds them: 0 where the source omits them,
 * and otherwise the value of the attribute, with its spelling kept where the source spelled it
 * other than the way the value is written.
 */
const playsOf = (
  rows: Rows,
  node: Owned,
  name: "max-plays" | "min-plays",
  text: Option.Option<string>,
) =>
  Option.match(text, {
    onNone: () => Effect.succeed({ rows, value: 0n }),
    onSome: (own) =>
      spelledInteger(
        rows,
        node.id,
        node.kind,
        name,
        own,
        "nonNegativeInteger",
        "attribute-lexical",
        `${node.kind} ${name}`,
      ),
  });

/**
 * The rows of one `qti-media-interaction`.
 *
 * @param ctx - The tree, its node index, the document and the shared writers.
 * @param rows - The rows so far.
 * @param element - The interaction's element.
 * @param node - The interaction's node.
 * @returns The rows with the arm, its markers and its binding; `ImportRefused`
 *   (`attribute-lexical`) for a `max-plays` or `min-plays` outside the non-negative integers, or an
 *   `autostart` or `loop` outside `xs:boolean`'s four spellings.
 */
const mediaRows = Effect.fn("import.mediaRows")(function* mediaRows(
  ctx: InteractionContext,
  rows: Rows,
  element: Element,
  node: Owned,
): Effect.fn.Return<Rows, ImportRefused | ItemRefusal> {
  const attributes = ctx.shared.attributes(rows, element, node);
  const responseIdentifier = Option.getOrElse(attributes.read("response-identifier"), () => "");
  const autostart = yield* requiredAttribute(element, "autostart", attributes.read("autostart"));
  const loop = attributes.read("loop");
  const maxPlays = attributes.read("max-plays");
  const minPlays = attributes.read("min-plays");
  const coords = attributes.read("coords");
  const autostartHandle = yield* closedOf(
    XsBoolean.handles,
    autostart,
    "attribute-lexical",
    "the autostart attribute of qti-media-interaction",
  );
  const loopHandle = yield* closedOf(
    XsBoolean.handles,
    Option.getOrElse(loop, () => "false"),
    "attribute-lexical",
    "the loop attribute of qti-media-interaction",
  );

  const maximum = yield* playsOf(attributes.rows(), node, "max-plays", maxPlays);
  const minimum = yield* playsOf(maximum.rows, node, "min-plays", minPlays);

  let built = minimum.rows;
  built = Rows.add(built, MediaInteraction, [
    {
      autostart: autostartHandle,
      id: node.id,
      loop: loopHandle,
      maxPlaysN: maximum.value,
      minPlaysN: minimum.value,
      responseIdentifier,
      rootKind: "item",
    },
  ]);
  built = ctx.shared.markers(
    built,
    {
      loop: DeclaredMediaLoop,
      "max-plays": MediaMaxPlays,
      "min-plays": MediaMinPlays,
    } satisfies MarkerSet,
    node.id,
    attributes.written(),
  );
  built = Rows.add(built, MediaCoords, valueFact(node.id, coords, MediaRectCoords));

  return yield* bound(ctx, built, node, responseIdentifier);
});

/**
 * The rows of one `qti-upload-interaction`.
 */
const uploadRows = Effect.fn("import.uploadRows")(function* uploadRows(
  ctx: InteractionContext,
  rows: Rows,
  element: Element,
  node: Owned,
): Effect.fn.Return<Rows, ItemRefusal> {
  const attributes = ctx.shared.attributes(rows, element, node);
  const responseIdentifier = Option.getOrElse(attributes.read("response-identifier"), () => "");
  const type = attributes.read("type");

  let built = attributes.rows();
  built = Rows.add(built, UploadInteraction, [
    { id: node.id, responseIdentifier, rootKind: "item" },
  ]);
  built = Rows.add(built, UploadType, valueFact(node.id, type, plain));

  return yield* bound(ctx, built, node, responseIdentifier);
});

/**
 * The rows of one `qti-drawing-interaction`.
 */
const drawingRows = Effect.fn("import.drawingRows")(function* drawingRows(
  ctx: InteractionContext,
  rows: Rows,
  element: Element,
  node: Owned,
): Effect.fn.Return<Rows, ItemRefusal> {
  const attributes = ctx.shared.attributes(rows, element, node);
  const responseIdentifier = Option.getOrElse(attributes.read("response-identifier"), () => "");

  let built = attributes.rows();
  built = Rows.add(built, DrawingInteraction, [
    { id: node.id, responseIdentifier, rootKind: "item" },
  ]);

  return yield* bound(ctx, built, node, responseIdentifier);
});

/**
 * The rows of one `qti-slider-interaction`. `SliderStep` is written only where the source declares
 * a `step`: no default is written.
 *
 * @returns The rows; `ImportRefused` (`attribute-lexical`) for a `step-label` or `reverse` outside
 *   `xs:boolean`'s four spellings, or an `orientation` outside `vertical` and `horizontal`.
 */
const sliderRows = Effect.fn("import.sliderRows")(function* sliderRows(
  ctx: InteractionContext,
  rows: Rows,
  element: Element,
  node: Owned,
): Effect.fn.Return<Rows, ImportRefused | ItemRefusal> {
  const attributes = ctx.shared.attributes(rows, element, node);
  const responseIdentifier = Option.getOrElse(attributes.read("response-identifier"), () => "");
  const lowerBound = yield* requiredAttribute(
    element,
    "lower-bound",
    attributes.read("lower-bound"),
  );
  const upperBound = yield* requiredAttribute(
    element,
    "upper-bound",
    attributes.read("upper-bound"),
  );
  const step = attributes.read("step");
  const stepLabel = attributes.read("step-label");
  const orientation = attributes.read("orientation");
  const reverse = attributes.read("reverse");
  const stepLabelHandle = yield* closedOf(
    XsBoolean.handles,
    Option.getOrElse(stepLabel, () => "false"),
    "attribute-lexical",
    "the step-label attribute of qti-slider-interaction",
  );
  const orientationRows = yield* closedFact(
    node.id,
    orientation,
    Orientation.handles,
    "the orientation attribute of qti-slider-interaction",
  );
  const reverseRows = yield* closedFact(
    node.id,
    reverse,
    XsBoolean.handles,
    "the reverse attribute of qti-slider-interaction",
  );

  let built = attributes.rows();
  built = Rows.add(built, SliderInteraction, [
    {
      id: node.id,
      lowerBound: judgedLater(lowerBound),
      responseIdentifier,
      rootKind: "item",
      stepLabel: stepLabelHandle,
      upperBound: judgedLater(upperBound),
    },
  ]);
  built = ctx.shared.markers(
    built,
    { "step-label": DeclaredSliderStepLabel } satisfies MarkerSet,
    node.id,
    attributes.written(),
  );
  built = Rows.add(built, SliderStep, valueFact(node.id, step, plain));
  built = Rows.add(built, SliderOrientation, orientationRows);
  built = Rows.add(built, SliderReverse, reverseRows);

  return yield* bound(ctx, built, node, responseIdentifier);
});

/**
 * The rows of one `qti-end-attempt-interaction`. Its `title` is stored after `replace`.
 *
 * @returns The rows; `ImportRefused` (`attribute-lexical`) for a `count-attempt` outside
 *   `xs:boolean`'s four spellings.
 */
const endAttemptRows = Effect.fn("import.endAttemptRows")(function* endAttemptRows(
  ctx: InteractionContext,
  rows: Rows,
  element: Element,
  node: Owned,
): Effect.fn.Return<Rows, ImportRefused | ItemRefusal> {
  const attributes = ctx.shared.attributes(rows, element, node);
  const responseIdentifier = Option.getOrElse(attributes.read("response-identifier"), () => "");
  const title = yield* requiredAttribute(element, "title", attributes.read("title"));
  const countAttempt = attributes.read("count-attempt");
  const countAttemptRows = yield* closedFact(
    node.id,
    countAttempt,
    XsBoolean.handles,
    "the count-attempt attribute of qti-end-attempt-interaction",
  );

  let built = attributes.rows();
  const typed = typedAttribute(built, node.id, node.kind, "title", title, "replace");
  built = typed.rows;

  built = Rows.add(built, EndAttemptInteraction, [
    { id: node.id, responseIdentifier, rootKind: "item", title: typed.value },
  ]);
  built = Rows.add(built, EndAttemptCountAttempt, countAttemptRows);

  return yield* bound(ctx, built, node, responseIdentifier);
});

/**
 * The other interactions' rows.
 *
 * @param ctx - The tree, its node index, the document and the shared writers.
 * @param rows - The rows so far.
 * @returns The rows with each media, upload, drawing, slider and end-attempt interaction's arm,
 *   optional values, markers and binding; `ItemRefusal` for a `response-identifier` no declaration
 *   of the item names; `ImportRefused` (`attribute-lexical`) for a `max-plays` or `min-plays`
 *   outside the non-negative integers, or a flag or orientation outside its roster.
 */
export const otherRows = Effect.fn("import.otherRows")(function* otherRows(
  ctx: InteractionContext,
  rows: Rows,
): Effect.fn.Return<Rows, ImportRefused | UnmodeledVocabulary | ItemRefusal> {
  let built = rows;
  for (const [element, indexed] of ctx.nodes) {
    const node = { ancestry: indexed.ancestry, id: indexed.id, kind: indexed.kind };
    if (indexed.kind === "qti-media-interaction") {
      built = yield* mediaRows(ctx, built, element, node);
    } else if (indexed.kind === "qti-upload-interaction") {
      built = yield* uploadRows(ctx, built, element, node);
    } else if (indexed.kind === "qti-drawing-interaction") {
      built = yield* drawingRows(ctx, built, element, node);
    } else if (indexed.kind === "qti-slider-interaction") {
      built = yield* sliderRows(ctx, built, element, node);
    } else if (indexed.kind === "qti-end-attempt-interaction") {
      built = yield* endAttemptRows(ctx, built, element, node);
    }
  }

  return built;
});

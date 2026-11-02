/**
 * The rows of the other interactions: media, upload, drawing, slider and end-attempt.
 *
 * Each interaction is written as its arm, the optional values and markers its attributes call for,
 * and its binding to the response variable it names. A binding's `maxCount` is the sentinel 1: no
 * count attribute bounds these kinds, and the kind's `BindingFit` rows alone say which variables
 * they accept.
 */
import { Effect, Option } from "effect";
import type { InteractionContext, MarkerRelation, NodeRef } from "#qti/import/interactions.ts";
import { Rows, typedAttribute } from "#qti/import/tree.ts";
import type { ItemRefusal, UnmodeledVocabulary } from "#qti/import/tree.ts";
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
} from "#qti/schema/interactions/other.ts";
import type { AncestryHandle } from "#qti/schema/node.ts";
import type { Element } from "#qti/xml/tree.ts";

/**
 * The `maxCount` the other interactions' typed bindings hold.
 */
const sentinelCount = 1n;

/**
 * An attribute value whose column's pattern judges it at commit: the typed columns of booleans and
 * numbers are template-literal types, and the value read is a string until that pattern says it
 * fits, so the cast narrows only the type; a value the pattern refuses is refused there.
 */
// oxlint-disable-next-line typescript/no-unnecessary-type-parameters -- `T` is the column type the caller's row demands; the call site names it by inference.
const judgedLater = <T extends string>(value: string): T =>
  // SAFETY: the column's regex law judges the value at commit, which is the importer's refusal for it (spec 3.9, 4.5).
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The invariant is the SAFETY note above.
  value as T;

/**
 * The rows of an optional value's relation: one row when the source wrote the attribute, none
 * otherwise.
 */
const valueFact = <T extends string>(
  node: string,
  value: Option.Option<string>,
  judge: (read: string) => T,
): readonly { readonly node: string; readonly value: T }[] =>
  Option.match(value, {
    onNone: () => [],
    onSome: (own) => [{ node, value: judge(own) }],
  });

/**
 * A text value as an optional's column holds it: a plain string.
 */
const plain = (read: string): string => read;

/**
 * A count as an `xs:nonNegativeInteger` column holds it.
 */
const natural = (read: string): `${number}` | `+${number}` => judgedLater(read);

/**
 * A flag as an `xs:boolean` column holds it.
 */
const flag = (read: string): "0" | "1" | "false" | "true" => judgedLater(read);

/**
 * An orientation as its column holds it.
 */
const direction = (read: string): "horizontal" | "vertical" => judgedLater(read);

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
 * The plays of a media interaction as its typed column holds them: 0 where the source omits them.
 */
const playsOf = (ctx: InteractionContext, lexical: Option.Option<string>): bigint =>
  ctx.shared.typedCopy(lexical, 0n);

/**
 * The rows of one `qti-media-interaction`.
 */
const mediaRows = Effect.fn("import.mediaRows")(function* mediaRows(
  ctx: InteractionContext,
  rows: Rows,
  element: Element,
  node: Owned,
): Effect.fn.Return<Rows, ItemRefusal> {
  const attributes = ctx.shared.attributes(rows, element, node);
  const responseIdentifier = Option.getOrElse(attributes.read("response-identifier"), () => "");
  const autostart = attributes.read("autostart");
  const loop = attributes.read("loop");
  const maxPlays = attributes.read("max-plays");
  const minPlays = attributes.read("min-plays");
  const coords = attributes.read("coords");

  let built = attributes.rows();
  built = Rows.add(built, MediaInteraction, [
    {
      autostart: judgedLater(Option.getOrElse(autostart, () => "")),
      id: node.id,
      loop: judgedLater(Option.getOrElse(loop, () => "false")),
      maxPlaysN: playsOf(ctx, maxPlays),
      minPlaysN: playsOf(ctx, minPlays),
      responseIdentifier,
      rootKind: "item",
    },
  ]);
  built = ctx.shared.markers(
    built,
    { loop: DeclaredMediaLoop } satisfies MarkerSet,
    node.id,
    attributes.written(),
  );
  built = Rows.add(built, MediaMaxPlays, valueFact(node.id, maxPlays, natural));
  built = Rows.add(built, MediaMinPlays, valueFact(node.id, minPlays, natural));
  built = Rows.add(built, MediaCoords, valueFact(node.id, coords, plain));

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
 */
const sliderRows = Effect.fn("import.sliderRows")(function* sliderRows(
  ctx: InteractionContext,
  rows: Rows,
  element: Element,
  node: Owned,
): Effect.fn.Return<Rows, ItemRefusal> {
  const attributes = ctx.shared.attributes(rows, element, node);
  const responseIdentifier = Option.getOrElse(attributes.read("response-identifier"), () => "");
  const lowerBound = attributes.read("lower-bound");
  const upperBound = attributes.read("upper-bound");
  const step = attributes.read("step");
  const stepLabel = attributes.read("step-label");
  const orientation = attributes.read("orientation");
  const reverse = attributes.read("reverse");

  let built = attributes.rows();
  built = Rows.add(built, SliderInteraction, [
    {
      id: node.id,
      lowerBound: judgedLater(Option.getOrElse(lowerBound, () => "")),
      responseIdentifier,
      rootKind: "item",
      stepLabel: judgedLater(Option.getOrElse(stepLabel, () => "false")),
      upperBound: judgedLater(Option.getOrElse(upperBound, () => "")),
    },
  ]);
  built = ctx.shared.markers(
    built,
    { "step-label": DeclaredSliderStepLabel } satisfies MarkerSet,
    node.id,
    attributes.written(),
  );
  built = Rows.add(built, SliderStep, valueFact(node.id, step, plain));
  built = Rows.add(built, SliderOrientation, valueFact(node.id, orientation, direction));
  built = Rows.add(built, SliderReverse, valueFact(node.id, reverse, flag));

  return yield* bound(ctx, built, node, responseIdentifier);
});

/**
 * The rows of one `qti-end-attempt-interaction`. Its `title` is stored after `replace`.
 */
const endAttemptRows = Effect.fn("import.endAttemptRows")(function* endAttemptRows(
  ctx: InteractionContext,
  rows: Rows,
  element: Element,
  node: Owned,
): Effect.fn.Return<Rows, ItemRefusal> {
  const attributes = ctx.shared.attributes(rows, element, node);
  const responseIdentifier = Option.getOrElse(attributes.read("response-identifier"), () => "");
  const title = attributes.read("title");
  const countAttempt = attributes.read("count-attempt");

  let built = attributes.rows();
  let stored = "";
  if (Option.isSome(title)) {
    const typed = typedAttribute(built, node.id, node.kind, "title", title.value, "replace");
    built = typed.rows;
    stored = typed.value;
  }

  built = Rows.add(built, EndAttemptInteraction, [
    { id: node.id, responseIdentifier, rootKind: "item", title: stored },
  ]);
  built = Rows.add(built, EndAttemptCountAttempt, valueFact(node.id, countAttempt, flag));

  return yield* bound(ctx, built, node, responseIdentifier);
});

/**
 * The other interactions' rows.
 *
 * @param ctx - The tree, its node index, the document and the shared writers.
 * @param rows - The rows so far.
 * @returns The rows with each media, upload, drawing, slider and end-attempt interaction's arm,
 *   optional values, markers and binding; `ItemRefusal` for a `response-identifier` no declaration
 *   of the item names.
 */
export const otherRows = Effect.fn("import.otherRows")(function* otherRows(
  ctx: InteractionContext,
  rows: Rows,
): Effect.fn.Return<Rows, UnmodeledVocabulary | ItemRefusal> {
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

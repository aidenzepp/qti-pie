/**
 * The Schema codec of the item view payload, for the server and the page that read it across a
 * fetch: {@link ItemViewPayloadSchema} checks the `ItemViewPayload` of
 * `#plate/react/contract.tsx`, {@link encodeItemView} writes it in the JSON form the wire carries,
 * and {@link decodeItemView} checks one that arrived before a page trusts it.
 *
 * The Schema's type is that interface, which `src/react/assessment-test-wire.test.tsx` pins. This
 * file does not import it: the contract is a `.tsx` file, which the root `tsc` project, with no
 * `--jsx`, refuses to resolve from a `.ts` one.
 *
 * The payload is JSON-safe but for one field: `navigation.time` holds two `Option`s, which
 * `JSON.stringify` does not write. The codec writes each as an optional number, absent for none,
 * and reads it back. Every other field is its own JSON form, checked as it passes. A view is never
 * stored, so the form names no version.
 *
 * It value-imports `Schema`, so it belongs at the server and service boundary (ruling OD-6): a
 * module that imports it takes `Schema` into its bundle, which the browser modules of plate do not
 * hold.
 *
 * @module
 */
import { Data, Result, Schema } from "effect";
import { decodeRedacted } from "#plate/codec/redacted.ts";
import type { RedactedJson } from "#plate/codec/redacted.ts";
import { SavedResponsesSchema } from "#plate/codec/session.ts";
import { Configuration } from "#plate/configuration.ts";
import { navigationModes, submissionModes } from "#plate/vocabulary.ts";

/**
 * The configuration as the wire carries it: every field present, each under the constraint
 * {@link Configuration} puts on it.
 *
 * {@link Configuration} defaults a field it is not given, which a decoded configuration never
 * needs, so this keeps its type and its checks and drops the defaults: a page receives the whole
 * configuration the server rendered with, never a partial one that would take the page's defaults.
 */
const ConfigurationJson = Schema.toType(Configuration);

/**
 * The JSON form of a redacted item, as {@link RedactedJson} types it, passed through as it is.
 *
 * A value is one when {@link decodeRedacted} accepts it, which checks the shape, the depth and the
 * placement of every interaction and never throws, so a value that passes holds up when the page
 * decodes it next. It is the only check of the form that is safe on input from the wire: the
 * Schema that reads the form recurses through the body and overflows the stack on a deep one,
 * which only {@link decodeRedacted} bounds the depth against first.
 */
const RedactedJsonSchema = Schema.declare(
  // oxlint-disable-next-line anti-slop/no-unknown-parameters -- A type guard takes the unchecked value it narrows, which is the point of the check.
  (input: unknown): input is RedactedJson => Result.isSuccess(decodeRedacted(input)),
  { expected: "the JSON form encodeRedacted writes, which decodeRedacted accepts" },
);

/**
 * An item's saved responses in the JSON form {@link SavedResponsesSchema} writes, passed through as
 * it is: the payload's `values` are that form already, so the page decodes them when it renders.
 */
const ValuesJson = Schema.toEncoded(SavedResponsesSchema);

/**
 * A sequence index: a whole number of at least 1, counted as the session counts its items.
 */
const SequenceIndex = Schema.Int.check(Schema.isGreaterThanOrEqualTo(1));

/**
 * A whole number of at least 0: a count, or a position.
 */
const Count = Schema.Int.check(Schema.isGreaterThanOrEqualTo(0));

/**
 * The intents of `Intent` in `#plate/session/session.ts`, each as the object it is: `go` carries a
 * sequence index, and every other kind only itself.
 */
const IntentJson = Schema.Union([
  Schema.Struct({ kind: Schema.Literal("end-part") }),
  Schema.Struct({ kind: Schema.Literal("go"), sequenceIndex: SequenceIndex }),
  Schema.Struct({ kind: Schema.Literal("next") }),
  Schema.Struct({ kind: Schema.Literal("previous") }),
  Schema.Struct({ kind: Schema.Literal("submit-item") }),
  Schema.Struct({ kind: Schema.Literal("submit-part") }),
]);

/**
 * One item of the navigation, as `NavigationItem` of `#plate/navigation.ts` has it.
 */
const NavigationItemJson = Schema.Struct({
  current: Schema.Boolean,
  sequenceIndex: SequenceIndex,
  state: Schema.Literals(["answered", "closed", "not-answered", "submitted"]),
});

/**
 * A time in seconds as JSON writes it: a finite number, since `JSON.stringify` writes NaN and the
 * infinities as `null`, which the page's decode would refuse far from the cause.
 */
const Seconds = Schema.Finite;

/**
 * The time in force, as `TimeState` of `#plate/test-features/time-limits.ts` has it. `minTimeLeft`
 * and `timeLeft` are `Option`s there and optional numbers on the wire, absent for none.
 */
const TimeStateJson = Schema.Struct({
  allowLateSubmission: Schema.Boolean,
  minTimeLeft: Schema.OptionFromOptionalKey(Seconds),
  timeLeft: Schema.OptionFromOptionalKey(Seconds),
});

/**
 * The navigation, as `NavigationState` of `#plate/navigation.ts` has it, with `time` in its wire
 * form when the session has a time in force and left out when it has none.
 */
const NavigationJson = Schema.Struct({
  allowed: Schema.Array(IntentJson),
  count: Count,
  items: Schema.Array(NavigationItemJson),
  navigation: Schema.Literals(navigationModes),
  position: Count,
  submission: Schema.Literals(submissionModes),
  time: Schema.optionalKey(TimeStateJson),
});

/**
 * The status region's state, as `StatusInput` of `#plate/emit/item.ts` has it.
 */
const StatusJson = Schema.Struct({
  autofocus: Schema.optionalKey(Schema.Boolean),
  heading: Schema.Literals([
    "notAccepted",
    "partSubmitted",
    "responseRecorded",
    "review",
    "scored",
    "solution",
    "testFinished",
  ]),
  instance: Schema.String,
  messages: Schema.optionalKey(
    Schema.Array(Schema.Struct({ response: Schema.String, text: Schema.String })),
  ),
  score: Schema.optionalKey(Schema.String),
});

/**
 * The Schema of an item view payload; its type is the contract's `ItemViewPayload`, and its encoded
 * form the {@link ItemViewPayloadJson} the wire carries.
 *
 * The encoded form differs from the type in `navigation.time` alone, whose two `Option`s of
 * seconds become the optional numbers `minTimeLeft` and `timeLeft`. `configuration` is checked
 * against {@link Configuration}'s constraints, `redacted` against {@link decodeRedacted}, and
 * `values` against the JSON form of {@link SavedResponsesSchema}; `posted` is left out of the form
 * when the payload has none. A number of seconds or milliseconds must be finite, so a value JSON
 * would turn into `null` is refused where it is written.
 */
export const ItemViewPayloadSchema = Schema.Struct({
  configuration: ConfigurationJson,
  disabled: Schema.Boolean,
  instance: Schema.String,
  navigation: NavigationJson,
  posted: Schema.optionalKey(Schema.Record(Schema.String, Schema.Array(Schema.String))),
  redacted: RedactedJsonSchema,
  status: Schema.optionalKey(StatusJson),
  timeLeft: Schema.optionalKey(Schema.Finite),
  values: ValuesJson,
});

/**
 * An item view payload in the form the wire carries: plain JSON, which `JSON.stringify` writes
 * without loss. It is the contract's `ItemViewPayload` with `navigation.time` written as
 * `{ allowLateSubmission, minTimeLeft?, timeLeft? }`, a number for each time in force and no key
 * for a time that is none.
 */
export type ItemViewPayloadJson = Schema.Codec.Encoded<typeof ItemViewPayloadSchema>;

/**
 * Where the item view codec failed: reading the JSON a page received, or writing a payload.
 */
export type ItemViewStage = "decode" | "encode";

/**
 * What each {@link ItemViewStage}'s failure means and what to do about it.
 */
const itemViewRemedies: Readonly<Record<ItemViewStage, (issue: string) => string>> = {
  decode: (issue) =>
    `The input is not the JSON form encodeItemView writes: ${issue}. Pass encodeItemView's output to decodeItemView unchanged, through JSON.stringify and JSON.parse if it crosses the wire.`,
  encode: (issue) =>
    `The item view does not fit its JSON form: ${issue}. Only a view built by hand can cause this; send the view as the test server builds it, from the session's own functions.`,
};

/**
 * An item view the codec could not read or write: JSON that is not the form {@link encodeItemView}
 * writes (`stage` `decode`), or a payload with a field that does not fit
 * {@link ItemViewPayloadSchema} (`stage` `encode`), which only an object built by hand can hold.
 */
export class InvalidItemView extends Data.TaggedError("InvalidItemView")<{
  /**
   * What the Schema found wrong, with the path to it.
   */
  readonly issue: string;
  /**
   * Whether the view failed on its way in from the wire or on its way out to it.
   */
  readonly stage: ItemViewStage;
}> {
  /**
   * What is wrong and what to do instead, in one line.
   */
  override get message(): string {
    return itemViewRemedies[this.stage](this.issue);
  }
}

/**
 * Write an item view payload in the JSON form the wire carries.
 *
 * @param view The payload, an `ItemViewPayload`.
 * @returns The {@link ItemViewPayloadJson}, which `JSON.stringify` writes without loss and
 *   {@link decodeItemView} reads back to `view`.
 * @throws {InvalidItemView} At stage `encode`, naming a field that does not fit
 *   {@link ItemViewPayloadSchema}, such as a time that is not a finite number. The payload's type
 *   admits no such value, so only a view built by hand can cause it, and the throw keeps the cause
 *   at the server instead of a `null` the page cannot read.
 */
export const encodeItemView = (view: typeof ItemViewPayloadSchema.Type): ItemViewPayloadJson =>
  Result.getOrThrowWith(
    Schema.encodeResult(ItemViewPayloadSchema)(view),
    (schemaError) => new InvalidItemView({ issue: schemaError.message, stage: "encode" }),
  );

/**
 * Check the JSON form of an item view payload and make the `ItemViewPayload` a page renders.
 *
 * @param json The JSON form as the page received it: the {@link ItemViewPayloadJson}
 *   {@link encodeItemView} wrote, after the `JSON.stringify` and `JSON.parse` of the wire. A
 *   payload missing `disabled` or `values` is refused, as is one whose `redacted` is not a JSON
 *   form {@link decodeRedacted} accepts.
 * @returns The payload, with each time in force as `Option`s; or {@link InvalidItemView} at stage
 *   `decode` naming what does not fit.
 */
export const decodeItemView = (
  // oxlint-disable-next-line anti-slop/no-unknown-parameters -- The page receives the JSON as any value, and this is the check that parses it.
  json: unknown,
): Result.Result<typeof ItemViewPayloadSchema.Type, InvalidItemView> =>
  Result.mapError(
    Schema.decodeUnknownResult(ItemViewPayloadSchema)(json),
    (schemaError) => new InvalidItemView({ issue: schemaError.message, stage: "decode" }),
  );

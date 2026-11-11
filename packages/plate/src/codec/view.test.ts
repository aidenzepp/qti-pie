import { assert, describe, expectTypeOf, it } from "@effect/vitest";
import { Effect, Option, Result, Schema } from "effect";
import { encodeRedacted } from "#plate/codec/redacted.ts";
import type { RedactedJson } from "#plate/codec/redacted.ts";
import { encodeSession, SavedResponsesSchema } from "#plate/codec/session.ts";
import type { SavedResponsesJson, StoredTestSession } from "#plate/codec/session.ts";
import { decodeItemView, encodeItemView, InvalidItemView } from "#plate/codec/view.ts";
import type { ItemViewPayloadJson, ItemViewPayloadSchema } from "#plate/codec/view.ts";
import { configure } from "#plate/configuration.ts";
import type { Configuration } from "#plate/configuration.ts";
import type { Value } from "#plate/model/values.ts";
import { navigationState } from "#plate/navigation.ts";
import type { NavigationState } from "#plate/navigation.ts";
import { redact } from "#plate/render.ts";
import type { TestSession } from "#plate/session/session.ts";
import { itemView, startTest } from "#plate/session/start.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";
import type { Accepted, AcceptedTest } from "#plate/validate/verdict.ts";

/**
 * The payload the codec checks, which `src/react/assessment-test-wire.test.tsx` pins to the
 * contract's `ItemViewPayload`: the contract is a `.tsx` file, which this file's `tsc` project
 * cannot resolve.
 */
type ItemViewPayload = typeof ItemViewPayloadSchema.Type;

/**
 * The time the hand-built session starts at.
 */
const startedAt = new Date("2026-11-05T10:00:00.000Z");

/**
 * A single identifier value.
 *
 * @param identifier The identifier.
 * @returns The value.
 */
const chosen = (identifier: string): Value => ({
  baseType: "identifier",
  cardinality: "single",
  values: [{ baseType: "identifier", value: identifier }],
});

/**
 * The text of a hand-built Choice item: `RESPONSE`, a single identifier whose correct response is
 * `A`.
 */
const itemXml = [
  '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="i1" title="i1" adaptive="false" time-dependent="false">',
  '<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">',
  "<qti-correct-response><qti-value>A</qti-value></qti-correct-response>",
  "</qti-response-declaration>",
  '<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float"/>',
  '<qti-item-body><qti-choice-interaction response-identifier="RESPONSE" shuffle="false" max-choices="1">',
  '<qti-simple-choice identifier="A">Choice A</qti-simple-choice>',
  '<qti-simple-choice identifier="B">Choice B</qti-simple-choice>',
  "</qti-choice-interaction></qti-item-body>",
  '<qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct.xml"/>',
  "</qti-assessment-item>",
].join("");

/**
 * The text of a hand-built test of one linear, individual part that delivers the item ref `i1`.
 */
const testXml = [
  '<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="view-test" title="view-test">',
  '<qti-test-part identifier="P1" navigation-mode="linear" submission-mode="individual">',
  '<qti-assessment-section identifier="S1" title="Section" visible="true">',
  '<qti-assessment-item-ref identifier="i1" href="i1.xml"/>',
  "</qti-assessment-section></qti-test-part>",
  "</qti-assessment-test>",
].join("");

/**
 * Open the hand-built test and its one item, failing the test unless both are accepted.
 */
const delivery = Effect.gen(function* delivery() {
  const encoder = new TextEncoder();
  const testVerdict = yield* open("tests/view-test.xml", encoder.encode(testXml));
  const itemVerdict = yield* open("tests/i1.xml", encoder.encode(itemXml));
  const item: Accepted = Option.getOrElse(acceptedItem(itemVerdict), () =>
    assert.fail(`the item is ${itemVerdict.verdict}, not an accepted item`),
  );
  const test: AcceptedTest =
    (testVerdict.verdict === "accepted" || testVerdict.verdict === "accepted-with-unsupported") &&
    testVerdict.kind === "test"
      ? testVerdict.accepted
      : assert.fail(`the test is ${testVerdict.verdict}, not an accepted test`);

  return { item, test };
});

/**
 * The pieces of a payload a one-item session gives: the session, its navigation, and the item's
 * view as the server reads it.
 */
interface Sitting {
  readonly configuration: Configuration;
  readonly item: Accepted;
  readonly navigation: NavigationState;
  readonly session: TestSession;
  readonly test: AcceptedTest;
}

/**
 * Start a session of the hand-built test.
 */
const sitting = Effect.gen(function* sitting() {
  const { item, test } = yield* delivery;
  const configuration = yield* configure({});
  const session = Result.getOrElse(
    startTest(test, new Map([["i1", item]]), configuration, {
      instance: "sitting",
      now: startedAt,
    }),
    (failure) => assert.fail(`startTest refused: ${failure.message}`),
  );
  const navigation = Result.getOrElse(navigationState(test, session), (failure) =>
    assert.fail(`navigationState failed: ${failure.message}`),
  );

  return { configuration, item, navigation, session, test } satisfies Sitting;
});

/**
 * Build the payload a server would send for a sitting's current item, as the contract describes it.
 *
 * @param given The sitting.
 * @param values The saved responses to carry, as the session codec writes them.
 * @returns The payload, with no `posted`, `status` or time in force.
 */
const payloadOf = (given: Sitting, values: SavedResponsesJson): ItemViewPayload => {
  const view = Result.getOrElse(
    itemView(given.test, given.session, given.configuration, 1),
    (failure) => assert.fail(`itemView failed: ${failure.message}`),
  );
  const redacted: RedactedJson = Result.getOrElse(
    encodeRedacted(redact(given.item, view.record, view.configuration)),
    (failure) => assert.fail(`encodeRedacted failed: ${failure.message}`),
  );

  return {
    configuration: view.configuration,
    disabled: view.disabled,
    instance: view.instance,
    navigation: given.navigation,
    redacted,
    values,
  };
};

/**
 * Write a payload through the codec, which throws on a payload it refuses.
 *
 * @param payload The payload.
 * @returns Its JSON form.
 */
const written = (payload: ItemViewPayload): ItemViewPayloadJson => encodeItemView(payload);

/**
 * Take the payload out of a codec result, failing the test when the codec refused its input.
 *
 * @param result What the codec gave.
 * @returns The payload.
 */
const accepted = (result: Result.Result<ItemViewPayload, InvalidItemView>): ItemViewPayload =>
  Result.getOrElse(result, (failure) => assert.fail(`decodeItemView refused: ${failure.message}`));

/**
 * Take the refusal out of a codec result, failing the test when the codec accepted its input.
 *
 * @param result What the codec gave.
 * @returns The refusal.
 */
const refusal = (result: Result.Result<unknown, InvalidItemView>): InvalidItemView =>
  Result.getOrElse(Result.flip(result), () =>
    assert.fail("the codec accepted what it must refuse"),
  );

/**
 * Take the refusal `encodeItemView` throws for a payload, failing the test when it writes the
 * payload or throws anything else.
 *
 * @param view The payload.
 * @returns The refusal.
 */
const encodeRefusal = (view: ItemViewPayload): InvalidItemView =>
  Result.getOrElse(
    Result.flip(
      Result.try({
        catch: (thrown) =>
          thrown instanceof InvalidItemView
            ? thrown
            : assert.fail("encodeItemView threw something other than InvalidItemView"),
        try: () => encodeItemView(view),
      }),
    ),
    () => assert.fail("encodeItemView wrote what it must refuse"),
  );

describe("ItemViewPayloadSchema", () => {
  it.effect(
    "[W0-AN.2] the saved-responses Schema is exported and its JSON type is what encodeSession writes for an item's saved",
    () =>
      Effect.gen(function* savedJson() {
        const given = yield* sitting;
        const [first] = given.session.items;

        assert.isDefined(first);

        const saved = { RESPONSE: chosen("A") };
        const stored = Result.getOrElse(
          encodeSession({ ...given.session, items: [{ ...first, saved: Option.some(saved) }] }),
          (failure) => assert.fail(`encodeSession refused: ${failure.message}`),
        );
        const encoded: SavedResponsesJson = Schema.encodeSync(SavedResponsesSchema)(saved);

        expectTypeOf<
          NonNullable<StoredTestSession["items"][number]["saved"]>
        >().toEqualTypeOf<SavedResponsesJson>();

        assert.deepStrictEqual(stored.items[0]?.saved, encoded);
        assert.deepStrictEqual(Schema.decodeUnknownSync(SavedResponsesSchema)(encoded), saved);
      }),
  );

  it.effect("[W0-AN.2] the view codec round-trips a payload whose navigation has no time", () =>
    Effect.gen(function* noTime() {
      const given = yield* sitting;
      const payload = payloadOf(given, {});
      const json = written(payload);

      assert.isFalse("time" in json.navigation);
      assert.isFalse(Object.hasOwn(payload.navigation, "time"));
      assert.deepStrictEqual(accepted(decodeItemView(json)), payload);
    }),
  );

  it.effect(
    "[W0-AN.2] the view codec writes time's Options as optional numbers and reads them back",
    () =>
      Effect.gen(function* timed() {
        const given = yield* sitting;
        const base = payloadOf(given, {});
        const payload: ItemViewPayload = {
          ...base,
          navigation: {
            ...base.navigation,
            time: {
              allowLateSubmission: false,
              minTimeLeft: Option.some(30),
              timeLeft: Option.none(),
            },
          },
        };
        const json = written(payload);

        assert.deepStrictEqual(json.navigation.time, {
          allowLateSubmission: false,
          minTimeLeft: 30,
        });
        assert.deepStrictEqual(accepted(decodeItemView(json)).navigation.time, {
          allowLateSubmission: false,
          minTimeLeft: Option.some(30),
          timeLeft: Option.none(),
        });
        assert.deepStrictEqual(
          written({
            ...base,
            navigation: {
              ...base.navigation,
              time: {
                allowLateSubmission: true,
                minTimeLeft: Option.none(),
                timeLeft: Option.some(0),
              },
            },
          }).navigation.time,
          { allowLateSubmission: true, timeLeft: 0 },
        );
        expectTypeOf<NonNullable<ItemViewPayloadJson["navigation"]["time"]>>().toEqualTypeOf<{
          readonly allowLateSubmission: boolean;
          readonly minTimeLeft?: number;
          readonly timeLeft?: number;
        }>();
      }),
  );

  it.effect("[W0-AN.2] the encoded form survives JSON.stringify and JSON.parse unchanged", () =>
    Effect.gen(function* surviving() {
      const given = yield* sitting;
      const base = payloadOf(
        given,
        Schema.encodeSync(SavedResponsesSchema)({ RESPONSE: chosen("A") }),
      );
      const payload: ItemViewPayload = {
        ...base,
        disabled: true,
        navigation: {
          ...base.navigation,
          time: {
            allowLateSubmission: true,
            minTimeLeft: Option.some(12.5),
            timeLeft: Option.some(90),
          },
        },
        posted: { RESPONSE: ["B"] },
        status: {
          autofocus: true,
          heading: "notAccepted",
          instance: base.instance,
          messages: [{ response: "RESPONSE", text: "Choose one." }],
        },
        timeLeft: 90_000,
      };
      const json = written(payload);
      // oxlint-disable-next-line unicorn/prefer-structured-clone -- The row is about what `JSON.stringify` and `JSON.parse` do to the form, which `structuredClone` would not do: it keeps `undefined` and every class instance.
      const wire: unknown = JSON.parse(JSON.stringify(json));

      assert.deepStrictEqual(wire, json);
      assert.deepStrictEqual(accepted(decodeItemView(wire)), payload);
    }),
  );

  it.effect("[W0-AN.2] the view codec refuses a payload missing disabled or values", () =>
    Effect.gen(function* missing() {
      const given = yield* sitting;
      const json = written(payloadOf(given, {}));
      const { disabled: _disabled, ...withoutDisabled } = json;
      const { values: _values, ...withoutValues } = json;

      for (const refused of [decodeItemView(withoutDisabled), decodeItemView(withoutValues)]) {
        const failure = refusal(refused);

        assert.instanceOf(failure, InvalidItemView);
        assert.strictEqual(failure.stage, "decode");
      }
    }),
  );

  it.effect("[W0-AN.2] posted is carried when present and absent when not", () =>
    Effect.gen(function* posted() {
      const given = yield* sitting;
      const base = payloadOf(given, {});
      const withPosted: ItemViewPayload = { ...base, posted: { R: ["x"] } };
      const json = written(withPosted);

      assert.deepStrictEqual(json.posted, { R: ["x"] });
      assert.deepStrictEqual(accepted(decodeItemView(json)), withPosted);
      assert.isFalse("posted" in written(base));
      assert.deepStrictEqual(accepted(decodeItemView(written(base))), base);
    }),
  );

  it.effect("[W0-AN.2] the view codec writes nothing JSON would change", () =>
    Effect.gen(function* unsafe() {
      const given = yield* sitting;
      const base = payloadOf(given, {});
      const notANumber = encodeRefusal({
        ...base,
        navigation: {
          ...base.navigation,
          time: {
            allowLateSubmission: false,
            minTimeLeft: Option.none(),
            timeLeft: Option.some(Number.NaN),
          },
        },
      });
      const infinite = encodeRefusal({ ...base, timeLeft: Number.POSITIVE_INFINITY });

      assert.strictEqual(notANumber.stage, "encode");
      assert.strictEqual(infinite.stage, "encode");
    }),
  );

  it.effect("[W0-AN.2] the view codec refuses a redacted item that is not the JSON form", () =>
    Effect.gen(function* notRedacted() {
      const given = yield* sitting;
      const json = written(payloadOf(given, {}));

      assert.strictEqual(
        refusal(decodeItemView({ ...json, redacted: { body: [] } })).stage,
        "decode",
      );
      assert.strictEqual(refusal(decodeItemView("not an object")).stage, "decode");
    }),
  );
});

import { assert, describe, expectTypeOf, it } from "@effect/vitest";
import { Effect, Layer, Option, Result } from "effect";
import { SecureRandom } from "effect/crypto";
import type { Configuration as PlainConfiguration } from "#plate/configuration.ts";
import { anyElement } from "#plate/content/contract.ts";
import { bodyModules } from "#plate/content/modules.ts";
import { Configuration } from "#plate/effect/configuration.ts";
import {
  acceptedItem,
  allowedIntents,
  checkResponses,
  current,
  decode,
  decodeRedacted,
  decodeSession,
  encodeRedacted,
  encodeSession,
  itemView,
  navigationState,
  permits,
  redact,
  render,
  renderNavigation,
  renderStatus,
  restore,
  score,
} from "#plate/effect/operations.ts";
import type { PlateError, Refused } from "#plate/effect/operations.ts";
import { drawnInstance, Randomness } from "#plate/effect/randomness.ts";
import * as plain from "#plate/index.ts";
import type {
  Accepted,
  AcceptedTest,
  Binding,
  Malformed,
  RecordBinding,
  RecordValue,
  ResponseValue,
  Value,
  ValueBinding,
  Verdict,
} from "#plate/index.ts";
import { brandRedacted } from "#plate/payload.ts";

/**
 * The time the plain `startTest` starts the fixture's session at.
 */
const startedAt = Date.parse("2026-11-05T10:00:00.000Z");

/**
 * The session instance the fixture's session starts with.
 */
const instance = "sitting";

/**
 * A test `Randomness` over a fixed byte source: each call returns a fresh array whose byte at index
 * `n` is `n`, so every draw of the same size gives the same bytes.
 */
const countingBytes = SecureRandom.make((size) =>
  Uint8Array.from({ length: size }, (_, index) => index % 0x1_00),
);

/**
 * The instance `drawnInstance` makes from {@link countingBytes}: bytes 0x00 to 0x0f with the UUID
 * v4 version and variant bits set.
 */
const countedInstance = "00010203-0405-4607-8809-0a0b0c0d0e0f";

/**
 * A test `Randomness` that fails the case the moment anything draws from it.
 */
const forbiddenBytes = SecureRandom.make(() =>
  assert.fail("an instance was drawn although the host gave one"),
);

/**
 * Write the text of a hand-built templated item: one Choice over `A`, `B` and `C` bound to the
 * single identifier `RESPONSE`, after a paragraph that prints the template variable `T`, which
 * template processing sets to 12345, so the item prints five characters under every seed.
 *
 * @param identifier The item's identifier.
 * @returns The item's text.
 */
const itemXml = (identifier: string): string =>
  [
    `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="${identifier}" title="${identifier}" adaptive="false" time-dependent="false">`,
    '<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/>',
    '<qti-template-declaration identifier="T" cardinality="single" base-type="integer"/>',
    "<qti-template-processing>",
    '<qti-set-template-value identifier="T"><qti-base-value base-type="integer">12345</qti-base-value></qti-set-template-value>',
    "</qti-template-processing><qti-item-body>",
    '<p>T is <qti-printed-variable identifier="T"/>.</p>',
    '<qti-choice-interaction response-identifier="RESPONSE" shuffle="false">',
    ...["A", "B", "C"].map(
      (choice) => `<qti-simple-choice identifier="${choice}">Choice ${choice}</qti-simple-choice>`,
    ),
    "</qti-choice-interaction></qti-item-body></qti-assessment-item>",
  ].join("");

/**
 * Write the text of a hand-built test: one nonlinear, individual part with one section that holds
 * each item ref, each ref's `href` its identifier with `.xml`.
 *
 * @param refs Each item ref's identifier, in document order.
 * @returns The test's text.
 */
const testXml = (refs: readonly string[]): string =>
  [
    '<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="mirrored" title="mirrored">',
    '<qti-test-part identifier="part" navigation-mode="nonlinear" submission-mode="individual">',
    '<qti-assessment-section identifier="section" title="Section" visible="true">',
    ...refs.map((ref) => `<qti-assessment-item-ref identifier="${ref}" href="${ref}.xml"/>`),
    "</qti-assessment-section></qti-test-part></qti-assessment-test>",
  ].join("");

/**
 * The content module whose `check` still leaves a document holding an island of its namespace
 * unchecked, read from the content modules table, as `validate/verdict.test.ts` reads it. The
 * constant moves to the next such stub when that kind lands (issue m4-02), and the test that uses
 * it needs another source of an unchecked verdict once no content module leaves one.
 */
const uncheckedStub = bodyModules[anyElement];

/**
 * Write the text of a hand-built item whose body holds an island of the unchecked content kind
 * ({@link uncheckedStub}), which plate cannot judge, so `check` leaves it unchecked.
 */
const uncheckedXml = [
  '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="unchecked" title="unchecked" adaptive="false" time-dependent="false">',
  `<qti-item-body><p>Solve <speak xmlns="${uncheckedStub.namespace}">x</speak></p></qti-item-body>`,
  "</qti-assessment-item>",
].join("");

/**
 * Check a hand-built document with the plain `open`.
 *
 * @param location The document's location.
 * @param text The document's text.
 * @returns Its verdict.
 */
const verdictOf = (location: string, text: string) =>
  plain.open(location, new TextEncoder().encode(text));

/**
 * Open a hand-built item and require it accepted.
 *
 * @param identifier The item's identifier, which also names its file under `tests/`.
 * @returns The accepted item.
 */
const openedItem = Effect.fnUntraced(function* openedItem(identifier: string) {
  const location = `tests/${identifier}.xml`;
  const verdict = yield* verdictOf(location, itemXml(identifier));

  return Option.getOrElse(plain.acceptedItem(verdict), () =>
    assert.fail(`${location} is ${verdict.verdict}, not an accepted item`),
  );
});

/**
 * Give the value a plain call succeeded with, failing the case when it failed.
 *
 * @param result The plain call's result.
 * @param call The plain call, named in the failure.
 * @returns The value.
 */
const succeeded = <A, E>(result: Result.Result<A, E>, call: string): A =>
  Result.getOrElse(result, () => assert.fail(`the plain ${call} failed`));

/**
 * Give the failure a plain call failed with, failing the case when it succeeded.
 *
 * @param result The plain call's result.
 * @param call The plain call, named in the failure.
 * @returns The failure.
 */
const failed = <A, E>(result: Result.Result<A, E>, call: string): E =>
  Result.match(result, {
    onFailure: (failure) => failure,
    onSuccess: () => assert.fail(`the plain ${call} succeeded`),
  });

/**
 * Assert that a mirror failed with the plain function's failure: the tag named, and every field.
 *
 * @param mirrored The mirror's failure, as `Effect.flip` gave it.
 * @param expected The plain function's failure for the same arguments.
 * @param tag The tag both carry.
 */
const assertSameFailure = (
  mirrored: { readonly _tag: string },
  expected: { readonly _tag: string },
  tag: string,
): void => {
  assert.strictEqual(mirrored._tag, tag);
  assert.strictEqual(expected._tag, tag);
  assert.deepStrictEqual(Object.entries(mirrored), Object.entries(expected));
};

/**
 * Provide a configuration as the {@link Configuration} service, with `Layer.succeed`.
 *
 * @param configuration The configuration the mirrors read.
 * @returns A function that provides it to a program.
 */
const configured = (configuration: PlainConfiguration) =>
  Effect.provide(Layer.succeed(Configuration, configuration));

/**
 * Build what the cases read: two accepted items, the test over them, the first item's record and
 * redacted form, and a session the plain `startTest` started.
 *
 * @returns The fixture.
 */
const fixture = Effect.fnUntraced(function* fixture() {
  const configuration = yield* plain.configure({});
  const document = yield* openedItem("first");
  const other = yield* openedItem("second");
  const testVerdict = yield* verdictOf("tests/mirrored.xml", testXml(["first", "second"]));
  const test: AcceptedTest =
    testVerdict.verdict === "accepted" && testVerdict.kind === "test"
      ? testVerdict.accepted
      : assert.fail(`the test is ${testVerdict.verdict} on a ${testVerdict.kind}`);
  const items = new Map<string, Accepted>([
    ["first", document],
    ["second", other],
  ]);
  const stored = succeeded(plain.begin(document, { instance: "q1", seed: "7" }), "begin");
  const { record } = succeeded(plain.restore(document, stored), "restore");
  const session = succeeded(
    plain.startTest(test, items, configuration, {
      instance,
      now: new Date(startedAt),
      seed: "7",
    }),
    "startTest",
  );

  return {
    configuration,
    document,
    other,
    record,
    redacted: plain.redact(document, record, configuration),
    session,
    stored,
    test,
    testVerdict,
  };
});

/**
 * The binding of the fixture's `RESPONSE` under the instance `q1`, a single identifier.
 */
const valueBinding: ValueBinding = {
  baseType: "identifier",
  cardinality: "single",
  name: "q1.RESPONSE",
};

/**
 * A record binding under the instance `q1`.
 */
const recordBinding: RecordBinding = { cardinality: "record", name: "q1.R" };

/**
 * Give a binding typed as either kind, which no assignment narrows, so a call takes the widest
 * overload of `decode`.
 *
 * @param binding The binding.
 * @returns The same binding, typed `Binding`.
 */
const widened = (binding: Binding): Binding => binding;

/**
 * Decode a choice posted for `RESPONSE` with the plain `decode`.
 *
 * @param choice The choice's identifier.
 * @returns The single identifier value.
 */
const chosen = (choice: string): Value =>
  succeeded(plain.decode([["q1.RESPONSE", choice]], valueBinding), "decode");

/**
 * Give the fields of the failure the `acceptedItem` mirror fails with for a verdict.
 *
 * @param verdict A verdict that holds no accepted item.
 * @returns An Effect of the {@link Refused}'s document, kind, refusals and verdict.
 */
const refusedOf = (verdict: Verdict) =>
  Effect.map(Effect.flip(acceptedItem(verdict)), (refused: Refused) => ({
    document: refused.document,
    kind: refused.kind,
    refusals: refused.refusals,
    verdict: refused.verdict,
  }));

/**
 * Give an error's tag, as every handler of the type-level case does.
 *
 * @param error A failure of `PlateError`.
 * @returns An Effect of its tag.
 */
const tagOf = (error: { readonly _tag: string }) => Effect.succeed(error._tag);

/**
 * A handler for every tag of {@link PlateError}, each giving the tag.
 */
const everyTag = {
  IntentRefused: tagOf,
  InvalidConfiguration: tagOf,
  InvalidHeadingLevel: tagOf,
  InvalidInstance: tagOf,
  InvalidRecord: tagOf,
  InvalidRedacted: tagOf,
  InvalidResponses: tagOf,
  InvalidResultContext: tagOf,
  InvalidSession: tagOf,
  InvalidSessionInstance: tagOf,
  InvalidTime: tagOf,
  ItemNotInSession: tagOf,
  Malformed: tagOf,
  MarkupRefused: tagOf,
  NotRedacted: tagOf,
  OutcomeMismatchError: tagOf,
  OutputTooLarge: tagOf,
  PartSwapRefused: tagOf,
  RecordMismatch: tagOf,
  RecordOperandError: tagOf,
  RecordRequired: tagOf,
  Refused: tagOf,
  ResponsesRefused: tagOf,
  ResultItemMissing: tagOf,
  SessionMismatch: tagOf,
  StepResponseMisfit: tagOf,
  TestNotDeliverable: tagOf,
  UnknownIdentifierError: tagOf,
  UnknownItemRef: tagOf,
  UnknownPart: tagOf,
  UnmappedResponseError: tagOf,
};

describe("the ./effect mirrors", () => {
  it.effect(
    "render's effect mirror gives the plain render's value under Configuration, drawing nothing for a host instance, and its failure by tag: NotRedacted for a copy",
    () =>
      Effect.gen(function* renderMirror() {
        const { configuration, redacted } = yield* fixture();
        const rendered = yield* render(redacted, { instance: "q1" }).pipe(
          configured(configuration),
          Effect.provideService(Randomness, forbiddenBytes),
        );
        const copy = { ...redacted };
        const refused = yield* Effect.flip(
          render(copy, { instance: "q1" }).pipe(configured(configuration)),
        );

        assert.deepStrictEqual(
          Result.succeed(rendered),
          plain.render(redacted, configuration, { instance: "q1" }),
        );
        assertSameFailure(
          refused,
          failed(plain.render(copy, configuration, { instance: "q1" }), "render"),
          "NotRedacted",
        );
      }),
  );

  it.effect(
    "render's effect mirror with no instance draws it through Randomness: a test reference over fixed bytes gives the instance those bytes make",
    () =>
      Effect.gen(function* renderDraws() {
        const { configuration, redacted } = yield* fixture();
        const counted = Effect.provideService(Randomness, countingBytes);
        const rendered = yield* render(redacted).pipe(configured(configuration), counted);

        assert.strictEqual(yield* drawnInstance.pipe(counted), countedInstance);
        assert.strictEqual(rendered.instance, countedInstance);
        assert.deepStrictEqual(
          Result.succeed(rendered),
          plain.render(redacted, configuration, { instance: countedInstance }),
        );
      }),
  );

  it.effect(
    "renderStatus's effect mirror gives the plain value under Configuration, and its failure by tag: InvalidInstance",
    () =>
      Effect.gen(function* renderStatusMirror() {
        const { configuration } = yield* fixture();
        const input = { heading: "scored", instance: "q1", score: "1" } as const;
        const broken = { ...input, instance: "ab-" };
        const rendered = yield* renderStatus(input).pipe(configured(configuration));
        const refused = yield* Effect.flip(renderStatus(broken).pipe(configured(configuration)));

        assert.deepStrictEqual(Result.succeed(rendered), plain.renderStatus(input, configuration));
        assertSameFailure(
          refused,
          failed(plain.renderStatus(broken, configuration), "renderStatus"),
          "InvalidInstance",
        );
      }),
  );

  it.effect(
    "renderNavigation's effect mirror gives the plain value under Configuration, and its failure by tag: UnknownPart",
    () =>
      Effect.gen(function* renderNavigationMirror() {
        const { configuration, session, test } = yield* fixture();
        const state = succeeded(plain.navigationState(test, session), "navigationState");
        const unknown = {
          parts: {
            "test-navigation": {
              pager: (_props: plain.Attributes, children: readonly plain.Node[]) =>
                plain.h("button", { type: "button" }, children),
            },
          },
        };
        const rendered = yield* renderNavigation(state).pipe(configured(configuration));
        const refused = yield* Effect.flip(
          renderNavigation(state, unknown).pipe(configured(configuration)),
        );

        assert.deepStrictEqual(
          Result.succeed(rendered),
          plain.renderNavigation(state, configuration),
        );
        assertSameFailure(
          refused,
          failed(plain.renderNavigation(state, configuration, unknown), "renderNavigation"),
          "UnknownPart",
        );
      }),
  );

  it.effect(
    "current's effect mirror gives the plain value under Configuration, and its failure by tag: ItemNotInSession",
    () =>
      Effect.gen(function* currentMirror() {
        const { configuration, session, test } = yield* fixture();
        const past = { ...session, position: 99 };
        const shown = yield* current(test, session).pipe(configured(configuration));
        const refused = yield* Effect.flip(current(test, past).pipe(configured(configuration)));

        assert.deepStrictEqual(Result.succeed(shown), plain.current(test, session, configuration));
        assertSameFailure(
          refused,
          failed(plain.current(test, past, configuration), "current"),
          "ItemNotInSession",
        );
      }),
  );

  it.effect(
    "itemView's effect mirror gives the plain value under Configuration, and its failure by tag: ItemNotInSession",
    () =>
      Effect.gen(function* itemViewMirror() {
        const { configuration, session, test } = yield* fixture();
        const view = yield* itemView(test, session, 2).pipe(configured(configuration));
        const refused = yield* Effect.flip(
          itemView(test, session, 99).pipe(configured(configuration)),
        );

        assert.deepStrictEqual(
          Result.succeed(view),
          plain.itemView(test, session, configuration, 2),
        );
        assertSameFailure(
          refused,
          failed(plain.itemView(test, session, configuration, 99), "itemView"),
          "ItemNotInSession",
        );
      }),
  );

  it.effect(
    "decodeRedacted's effect mirror gives the plain value, and its failure by tag: InvalidRedacted",
    () =>
      Effect.gen(function* decodeRedactedMirror() {
        const { redacted } = yield* fixture();
        const json = succeeded(plain.encodeRedacted(redacted), "encodeRedacted");
        const decoded = yield* decodeRedacted(json);
        const refused = yield* Effect.flip(decodeRedacted({}));

        assert.deepStrictEqual(Result.succeed(decoded), plain.decodeRedacted(json));
        assertSameFailure(
          refused,
          failed(plain.decodeRedacted({}), "decodeRedacted"),
          "InvalidRedacted",
        );
      }),
  );

  it.effect(
    "encodeRedacted's effect mirror gives the plain value, and its failure by tag: InvalidRedacted",
    () =>
      Effect.gen(function* encodeRedactedMirror() {
        const { redacted } = yield* fixture();
        const handBuilt = brandRedacted({
          ...redacted,
          // @ts-expect-error -- a title is a string; the number 5 is what encode must refuse.
          title: 5,
        });
        const json = yield* encodeRedacted(redacted);
        const refused = yield* Effect.flip(encodeRedacted(handBuilt));

        assert.deepStrictEqual(Result.succeed(json), plain.encodeRedacted(redacted));
        assertSameFailure(
          refused,
          failed(plain.encodeRedacted(handBuilt), "encodeRedacted"),
          "InvalidRedacted",
        );
      }),
  );

  it.effect(
    "decodeSession's effect mirror gives the plain value, and its failure by tag: InvalidSession",
    () =>
      Effect.gen(function* decodeSessionMirror() {
        const { session, test } = yield* fixture();
        const stored = succeeded(plain.encodeSession(session), "encodeSession");
        const decoded = yield* decodeSession(stored, test);
        const refused = yield* Effect.flip(decodeSession({}, test));

        assert.deepStrictEqual(Result.succeed(decoded), plain.decodeSession(stored, test));
        assertSameFailure(
          refused,
          failed(plain.decodeSession({}, test), "decodeSession"),
          "InvalidSession",
        );
      }),
  );

  it.effect(
    "encodeSession's effect mirror gives the plain value, and its failure by tag: InvalidSession",
    () =>
      Effect.gen(function* encodeSessionMirror() {
        const { session } = yield* fixture();
        const inexact = { ...session, position: 1.5 };
        const stored = yield* encodeSession(session);
        const refused = yield* Effect.flip(encodeSession(inexact));

        assert.deepStrictEqual(Result.succeed(stored), plain.encodeSession(session));
        assertSameFailure(
          refused,
          failed(plain.encodeSession(inexact), "encodeSession"),
          "InvalidSession",
        );
      }),
  );

  it.effect(
    "decode's effect mirror gives the plain value for each overload, and its failure by tag: Malformed",
    () =>
      Effect.gen(function* decodeMirror() {
        const either = widened(recordBinding);
        const twice = [
          ["q1.RESPONSE", "A"],
          ["q1.RESPONSE", "B"],
        ] as const;
        const single = yield* decode([["q1.RESPONSE", "A"]], valueBinding);
        const record = yield* decode([["q1.R", "1.5e3"]], recordBinding);
        const response = yield* decode([["q1.R", "7"]], either, { base: 10 });
        const refused = yield* Effect.flip(decode(twice, valueBinding));

        expectTypeOf(decode([], valueBinding)).toEqualTypeOf<Effect.Effect<Value, Malformed>>();
        expectTypeOf(decode([], recordBinding)).toEqualTypeOf<
          Effect.Effect<RecordValue, Malformed>
        >();
        expectTypeOf(decode([], either)).toEqualTypeOf<Effect.Effect<ResponseValue, Malformed>>();
        assert.deepStrictEqual(
          Result.succeed(single),
          plain.decode([["q1.RESPONSE", "A"]], valueBinding),
        );
        assert.deepStrictEqual(
          Result.succeed(record),
          plain.decode([["q1.R", "1.5e3"]], recordBinding),
        );
        assert.deepStrictEqual(
          Result.succeed(response),
          plain.decode([["q1.R", "7"]], either, { base: 10 }),
        );
        assertSameFailure(
          refused,
          failed(plain.decode(twice, valueBinding), "decode"),
          "Malformed",
        );
      }),
  );

  it.effect(
    "navigationState's effect mirror gives the plain value, and its failure by tag: ItemNotInSession",
    () =>
      Effect.gen(function* navigationStateMirror() {
        const { session, test } = yield* fixture();
        const past = { ...session, position: 99 };
        const state = yield* navigationState(test, session);
        const refused = yield* Effect.flip(navigationState(test, past));

        assert.deepStrictEqual(Result.succeed(state), plain.navigationState(test, session));
        assertSameFailure(
          refused,
          failed(plain.navigationState(test, past), "navigationState"),
          "ItemNotInSession",
        );
      }),
  );

  it.effect(
    "restore's effect mirror gives the plain value, and its failure by tag: RecordMismatch for another item's record",
    () =>
      Effect.gen(function* restoreMirror() {
        const { document, other, stored } = yield* fixture();
        const foreign = succeeded(plain.begin(other, { instance: "q2", seed: "7" }), "begin");
        const restored = yield* restore(document, stored);
        const refused = yield* Effect.flip(restore(document, foreign));

        assert.deepStrictEqual(Result.succeed(restored), plain.restore(document, stored));
        assertSameFailure(
          refused,
          failed(plain.restore(document, foreign), "restore"),
          "RecordMismatch",
        );
      }),
  );

  it.effect(
    "score's effect mirror gives the plain value, and its failure by tag: RecordRequired for a templated item with no record",
    () =>
      Effect.gen(function* scoreMirror() {
        const { document, stored } = yield* fixture();
        const responses = { RESPONSE: chosen("A") };
        const scored = yield* score(document, responses, stored);
        const refused = yield* Effect.flip(score(document, responses));

        assert.deepStrictEqual(Result.succeed(scored), plain.score(document, responses, stored));
        assertSameFailure(
          refused,
          failed(plain.score(document, responses), "score"),
          "RecordRequired",
        );
      }),
  );

  it.effect(
    "allowedIntents's effect mirror gives the plain value, and its failure by tag: ItemNotInSession",
    () =>
      Effect.gen(function* allowedIntentsMirror() {
        const { session, test } = yield* fixture();
        const past = { ...session, position: 99 };
        const intents = yield* allowedIntents(test, session);
        const refused = yield* Effect.flip(allowedIntents(test, past));

        assert.deepStrictEqual(Result.succeed(intents), plain.allowedIntents(test, session));
        assertSameFailure(
          refused,
          failed(plain.allowedIntents(test, past), "allowedIntents"),
          "ItemNotInSession",
        );
      }),
  );

  it.effect(
    "permits's effect mirror gives the plain value, and its failure by tag: ItemNotInSession",
    () =>
      Effect.gen(function* permitsMirror() {
        const { session, test } = yield* fixture();
        const granted = yield* permits(test, session, 1);
        const refused = yield* Effect.flip(permits(test, session, 99));

        assert.deepStrictEqual(Result.succeed(granted), plain.permits(test, session, 1));
        assertSameFailure(
          refused,
          failed(plain.permits(test, session, 99), "permits"),
          "ItemNotInSession",
        );
      }),
  );

  it.effect(
    "redact's effect mirror gives the plain value under Configuration and never fails",
    () =>
      Effect.gen(function* redactMirror() {
        const { configuration, document, record } = yield* fixture();
        const redacted = yield* redact(document, record).pipe(configured(configuration));
        const fresh = yield* redact(document).pipe(configured(configuration));

        expectTypeOf(redact(document)).toEqualTypeOf<
          Effect.Effect<plain.Redacted, never, Configuration>
        >();
        assert.deepStrictEqual(redacted, plain.redact(document, record, configuration));
        assert.deepStrictEqual(fresh, plain.redact(document, undefined, configuration));
        assert.isTrue(Result.isSuccess(plain.render(redacted, configuration, { instance: "q1" })));
      }),
  );

  it.effect(
    "redact's effect mirror holds the printed text to the provided outputBudget, as render does",
    () =>
      Effect.gen(function* redactBudget() {
        const { document, record } = yield* fixture();
        const tight = yield* plain.configure({ outputBudget: 3 });
        const roomy = yield* plain.configure({});
        const held = yield* redact(document, record).pipe(configured(tight));
        const printed = yield* redact(document, record).pipe(configured(roomy));
        const tooLarge = yield* Effect.flip(
          render(held, { instance: "q1" }).pipe(configured(tight)),
        );

        assert.deepStrictEqual(held, plain.redact(document, record, { outputBudget: 3 }));
        assert.deepStrictEqual(
          held.unprinted.pipe(
            Option.map(({ bound, identifier, limit }) => ({ bound, identifier, limit })),
          ),
          Option.some({ bound: 3, identifier: "T", limit: "budget" as const }),
        );
        assert.isTrue(Option.isNone(printed.unprinted));
        assert.strictEqual(tooLarge._tag, "OutputTooLarge");
      }),
  );

  it.effect(
    "checkResponses's effect mirror gives the plain messages under Configuration and never fails",
    () =>
      Effect.gen(function* checkResponsesMirror() {
        const { configuration, document, record } = yield* fixture();
        const responses = { RESPONSE: chosen("D") };
        const messages = yield* checkResponses(document, responses, record).pipe(
          configured(configuration),
        );
        const none = yield* checkResponses(document, { RESPONSE: chosen("A") }).pipe(
          configured(configuration),
        );

        expectTypeOf(checkResponses(document, responses)).toEqualTypeOf<
          Effect.Effect<readonly plain.ValidationMessage[], never, Configuration>
        >();
        assert.isNotEmpty(messages);
        assert.deepStrictEqual(
          messages,
          plain.checkResponses(document, responses, configuration, record),
        );
        assert.deepStrictEqual(
          none,
          plain.checkResponses(document, { RESPONSE: chosen("A") }, configuration),
        );
      }),
  );

  it.effect(
    "acceptedItem's effect mirror gives the plain accepted item for an item's verdict",
    () =>
      Effect.gen(function* acceptedItemMirror() {
        const verdict = yield* verdictOf("tests/first.xml", itemXml("first"));
        const accepted = yield* acceptedItem(verdict);

        assert.deepStrictEqual(Option.some(accepted), plain.acceptedItem(verdict));
      }),
  );

  it.effect(
    "acceptedItem's effect mirror fails Refused for a refused verdict with its refusals, an accepted test with none and kind test, and an unchecked item with none",
    () =>
      Effect.gen(function* acceptedItemRefused() {
        const { testVerdict } = yield* fixture();
        const broken = yield* verdictOf("tests/broken.xml", "<qti-assessment-item");
        const unchecked = yield* verdictOf("tests/unchecked.xml", uncheckedXml);

        assert.strictEqual(broken.verdict, "refused");
        assert.deepStrictEqual(yield* refusedOf(broken), {
          document: "tests/broken.xml",
          kind: broken.kind,
          refusals: broken.verdict === "refused" ? broken.refusals : [],
          verdict: "refused",
        });
        assert.isNotEmpty((yield* refusedOf(broken)).refusals);
        assert.deepStrictEqual(yield* refusedOf(testVerdict), {
          document: "tests/mirrored.xml",
          kind: "test",
          refusals: [],
          verdict: "accepted",
        });
        assert.deepStrictEqual(yield* refusedOf(unchecked), {
          document: "tests/unchecked.xml",
          kind: "item",
          refusals: [],
          verdict: "unchecked",
        });
      }),
  );

  it.effect(
    "an effect mirror's PlateError takes Effect.catchTags with a handler for every tag, and one missing a tag leaves that tag",
    () =>
      Effect.gen(function* catchesEveryTag() {
        const failing = Effect.fail<PlateError>(new plain.NotRedacted());
        const { Refused: _refused, ...allButRefused } = everyTag;
        const handled = failing.pipe(Effect.catchTags(everyTag));
        const partial = failing.pipe(Effect.catchTags(allButRefused));

        expectTypeOf<Effect.Error<typeof handled>>().toEqualTypeOf<never>();
        expectTypeOf<Effect.Error<typeof partial>>().toEqualTypeOf<Refused>();
        assert.strictEqual(yield* handled, "NotRedacted");
        assert.strictEqual(yield* partial, "NotRedacted");
      }),
  );
});

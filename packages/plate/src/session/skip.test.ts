import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { configure } from "#plate/configuration.ts";
import type { Configuration } from "#plate/configuration.ts";
import { containerKinds, modules } from "#plate/model/interactions.ts";
import { IntentRefused, advance } from "#plate/session/advance.ts";
import type { AdvanceFailure } from "#plate/session/advance.ts";
import type { Value } from "#plate/model/values.ts";
import type { Responses, Step, TestSession } from "#plate/session/session.ts";
import { startTest } from "#plate/session/start.ts";
import {
  hasStub,
  stubBaseType,
  stubCardinality,
  stubDeclarations,
  stubElement,
  stubKind,
  stubOrder,
} from "#plate/test/stub-kind.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";
import type { Accepted, AcceptedTest } from "#plate/validate/verdict.ts";

/**
 * The namespace of every hand-built document here.
 */
const namespace = "http://www.imsglobal.org/xsd/imsqtiasi_v3p0";

/**
 * The session instance every test starts with.
 */
const instance = "sitting";

/**
 * The time every test starts its session at.
 */
const startedAt = new Date("2026-11-06T10:00:00.000Z");

/**
 * The time of every step a test takes.
 */
const steppedAt = new Date("2026-11-06T10:00:05.000Z");

/**
 * Write the text of a hand-built item that holds response declarations and a body.
 *
 * @param identifier The item's identifier.
 * @param declarations The item's `qti-response-declaration` elements, written out.
 * @param body The item body's content.
 * @returns The item's text.
 */
const declaredXml = (identifier: string, declarations: string, body: string): string =>
  [
    `<qti-assessment-item xmlns="${namespace}" identifier="${identifier}" title="${identifier}" adaptive="false" time-dependent="false">`,
    declarations,
    `<qti-item-body>${body}</qti-item-body>`,
    "</qti-assessment-item>",
  ].join("");

/**
 * Write the text of a hand-built item that declares `RESPONSE` and holds a body.
 *
 * @param identifier The item's identifier.
 * @param declaration The `RESPONSE` declaration's cardinality and base type, as attributes.
 * @param body The item body's content.
 * @returns The item's text.
 */
const itemXml = (identifier: string, declaration: string, body: string): string =>
  declaredXml(identifier, `<qti-response-declaration identifier="RESPONSE" ${declaration}/>`, body);

/**
 * Write the attributes of a `RESPONSE` declaration for a base type and a cardinality.
 *
 * @param declaration The base type and the cardinality to declare.
 * @param declaration.baseType The declaration's base type.
 * @param declaration.cardinality The declaration's cardinality.
 * @returns The attributes, as {@link itemXml} takes them.
 */
const declarationOf = ({
  baseType,
  cardinality,
}: {
  readonly baseType: string;
  readonly cardinality: string;
}): string => `cardinality="${cardinality}" base-type="${baseType}"`;

/**
 * The children a kind of the stub order needs to be a valid interaction of its element, by kind:
 * what the [W0-AQ.1] stub-order row puts inside the element, so the row holds on a branch where
 * the kind is a stub (its module gives the notice and reads no child) and on one where it has
 * landed (its module reads the children and binds). Hotspot's module, once it lands, gives the
 * notice for an interaction without an image, and QTI 3.0 gives the interaction an image and at
 * least one `qti-hotspot-choice`, so its fixture carries an `img` with a `width` and `height` and
 * one `rect` hotspot, the way the module's own tests build theirs. The other kinds stand bare
 * while their modules are stubs; each gets its children when its module lands and says what a
 * valid interaction of it holds.
 */
const stubChildren = {
  "graphic-associate": "",
  "graphic-gap-match": "",
  "graphic-order": "",
  hotspot: [
    '<img src="images/map.svg" alt="A map of four plots" width="400" height="300"/>',
    '<qti-hotspot-choice identifier="A" shape="rect" coords="40,40,160,120"/>',
  ].join(""),
  "select-point": "",
} as const satisfies { readonly [K in (typeof stubOrder)[number]]: string };

/**
 * The `RESPONSE` declaration of {@link stubItem}: the base type and cardinality
 * `#plate/test/stub-kind.ts` gives {@link stubKind}, which bind the bare element of that kind.
 */
const stubDeclaration = declarationOf({ baseType: stubBaseType, cardinality: stubCardinality });

/**
 * An item whose only response an interaction of {@link stubKind} binds, which plate shows as a
 * notice while its module is a stub: no rendered control can post it. The kind is derived in
 * `#plate/test/stub-kind.ts`, so the fixture changes with the table of modules; while no kind of
 * the stub order is a bare stub there is no such item to show, and the [T-4] stub-notice test is
 * skipped.
 */
const stubItem = itemXml(
  "held",
  stubDeclaration,
  `<${stubElement} response-identifier="RESPONSE"/>`,
);

/**
 * The title of the [T-4] stub-notice test: the reason it is skipped joins it while no kind of the
 * stub order is a bare stub, a stub whose module declares no container.
 */
const stubNoticeTitle = hasStub
  ? "[T-4] lets next and submit-item pass an item whose only response a stub interaction, shown as a notice, binds"
  : "[T-4] lets next and submit-item pass an item whose only response a stub interaction, shown as a notice, binds (skipped: no kind of the stub order is a stub that stands bare in an item body)";

/**
 * An item that declares a response no interaction binds: a passage to read.
 */
const unboundItem = itemXml(
  "held",
  'cardinality="single" base-type="identifier"',
  "<p>Read this passage, then move on.</p>",
);

/**
 * An item whose only response a Choice binds, which the page can post.
 *
 * @param identifier The item's identifier.
 * @returns The item's text.
 */
const choiceItem = (identifier: string): string =>
  itemXml(
    identifier,
    'cardinality="single" base-type="identifier"',
    [
      '<qti-choice-interaction response-identifier="RESPONSE" shuffle="false" max-choices="1">',
      '<qti-simple-choice identifier="A">Choice A</qti-simple-choice>',
      '<qti-simple-choice identifier="B">Choice B</qti-simple-choice>',
      "</qti-choice-interaction>",
    ].join(""),
  );

/**
 * The `HINT` declaration of an item with an End Attempt: the single boolean the interaction binds.
 */
const hintDeclaration =
  '<qti-response-declaration identifier="HINT" cardinality="single" base-type="boolean"/>';

/**
 * The paragraph that holds an End Attempt bound to `HINT`.
 */
const hintParagraph =
  '<p><qti-end-attempt-interaction response-identifier="HINT" title="Hint"/></p>';

/**
 * An item with a Choice bound to `RESPONSE`, which the page can post, and an End Attempt bound to
 * `HINT`.
 *
 * @param identifier The item's identifier.
 * @returns The item's text.
 */
const hintItem = (identifier: string): string =>
  declaredXml(
    identifier,
    [
      '<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/>',
      hintDeclaration,
    ].join(""),
    [
      '<qti-choice-interaction response-identifier="RESPONSE" shuffle="false" max-choices="1">',
      '<qti-simple-choice identifier="A">Choice A</qti-simple-choice>',
      '<qti-simple-choice identifier="B">Choice B</qti-simple-choice>',
      "</qti-choice-interaction>",
      hintParagraph,
    ].join(""),
  );

/**
 * An item whose only interaction is an End Attempt bound to `HINT`, the one response it declares.
 */
const hintOnlyItem = declaredXml("held", hintDeclaration, hintParagraph);

/**
 * The value of an End Attempt's response when the candidate ended the attempt through its button.
 */
const pressed: Value = {
  baseType: "boolean",
  cardinality: "single",
  values: [{ baseType: "boolean", value: true }],
};

/**
 * The value an End Attempt's response takes when the attempt ended another way, which the form
 * sets for a post that carries no entry for the button.
 */
const unpressed: Value = {
  baseType: "boolean",
  cardinality: "single",
  values: [{ baseType: "boolean", value: false }],
};

/**
 * The value of a Choice's response when the candidate chose `A`.
 */
const chosen: Value = {
  baseType: "identifier",
  cardinality: "single",
  values: [{ baseType: "identifier", value: "A" }],
};

/**
 * The text of a test of one linear, individual part under `allow-skipping="false"`, whose section
 * holds the item ref `held` and then `after`.
 */
const testXml = [
  `<qti-assessment-test xmlns="${namespace}" identifier="T" title="T">`,
  '<qti-test-part identifier="P" navigation-mode="linear" submission-mode="individual">',
  '<qti-item-session-control allow-skipping="false"/>',
  '<qti-assessment-section identifier="S" title="S" visible="true">',
  '<qti-assessment-item-ref identifier="held" href="held.xml"/>',
  '<qti-assessment-item-ref identifier="after" href="after.xml"/>',
  "</qti-assessment-section></qti-test-part></qti-assessment-test>",
].join("");

/**
 * A test and the items it delivers, as a host passes them to `startTest`.
 */
interface Delivery {
  readonly items: ReadonlyMap<string, Accepted>;
  readonly test: AcceptedTest;
}

/**
 * Open {@link testXml} at `tests/T.xml`, the item `held` beside it from its text, and `after` as a
 * Choice item.
 *
 * @param held The text of the item `held`.
 * @returns The test and its items.
 */
const delivery = Effect.fnUntraced(function* delivery(held: string) {
  const encoder = new TextEncoder();
  const verdict = yield* open("tests/T.xml", encoder.encode(testXml));
  const test =
    (verdict.verdict === "accepted" || verdict.verdict === "accepted-with-unsupported") &&
    verdict.kind === "test"
      ? verdict.accepted
      : assert.fail(`the test is ${verdict.verdict} on a ${verdict.kind}, not an accepted test`);
  const items = new Map<string, Accepted>();
  for (const [ref, xml] of [
    ["held", held],
    ["after", choiceItem("after")],
  ] as const) {
    const opened = yield* open(`tests/${ref}.xml`, encoder.encode(xml));
    items.set(
      ref,
      Option.getOrElse(acceptedItem(opened), () => assert.fail(`${ref} is ${opened.verdict}`)),
    );
  }

  return { items, test } satisfies Delivery;
});

/**
 * Give the accepted item a delivery holds for `held`.
 *
 * @param given The test and its items.
 * @returns The item.
 */
const heldOf = (given: Delivery): Accepted =>
  given.items.get("held") ?? assert.fail("the delivery holds no item for held");

/**
 * Take one step on a session of a delivery just started.
 *
 * @param given The test and its items.
 * @param step The request.
 * @param configuration The host's configuration.
 * @returns What `advance` gave.
 */
const taken = (
  given: Delivery,
  step: Step,
  configuration: Configuration,
): Result.Result<TestSession, AdvanceFailure> =>
  advance(
    given.test,
    given.items,
    Result.getOrElse(
      startTest(given.test, given.items, configuration, { instance, now: startedAt }),
      (failure) => assert.fail(`startTest refused: ${failure.message}`),
    ),
    step,
    configuration,
    { now: steppedAt },
  );

/**
 * Take one step of an intent that posts no response, on a session of a delivery just started.
 *
 * @param given The test and its items.
 * @param kind The intent.
 * @param configuration The host's configuration.
 * @returns What `advance` gave.
 */
const stepped = (
  given: Delivery,
  kind: "next" | "submit-item",
  configuration: Configuration,
): Result.Result<TestSession, AdvanceFailure> => taken(given, { intent: { kind } }, configuration);

/**
 * Take one step of an intent that posts responses, on a session of a delivery just started.
 *
 * @param given The test and its items.
 * @param kind The intent.
 * @param responses The responses the step posts, by identifier.
 * @param configuration The host's configuration.
 * @returns What `advance` gave.
 */
const steppedWith = (
  given: Delivery,
  kind: "next" | "submit-item",
  responses: Responses,
  configuration: Configuration,
): Result.Result<TestSession, AdvanceFailure> =>
  taken(given, { intent: { kind }, responses }, configuration);

/**
 * Require `advance` to accept a step.
 *
 * @param result What `advance` returned.
 * @returns The session it gave.
 */
const accepted = (result: Result.Result<TestSession, AdvanceFailure>): TestSession =>
  Result.getOrElse(result, (failure) => assert.fail(`advance refused: ${failure.message}`));

/**
 * Require `advance` to refuse a step, and give the rule it names.
 *
 * @param result What `advance` returned.
 * @returns The rule.
 */
const refusedRule = (result: Result.Result<TestSession, AdvanceFailure>): string => {
  const failure = Option.getOrElse(Result.getFailure(result), () =>
    assert.fail("expected advance to refuse, and it accepted"),
  );

  return failure instanceof IntentRefused
    ? failure.rule
    : assert.fail(`expected IntentRefused, not ${failure._tag}: ${failure.message}`);
};

/**
 * Assert that `next` and `submit-item`, posting no response, each process `held`'s attempt, and
 * that `next` then moves to `after`: the item does not trap the candidate.
 *
 * @param given The test and its items.
 * @param configuration The host's configuration.
 */
const proceeds = (given: Delivery, configuration: Configuration): void => {
  const moved = accepted(stepped(given, "next", configuration));
  assert.strictEqual(moved.position, 1);
  assert.strictEqual(moved.items[0]?.record.numAttempts, 1);

  const submitted = accepted(stepped(given, "submit-item", configuration));
  assert.strictEqual(submitted.position, 0);
  assert.strictEqual(submitted.items[0]?.record.numAttempts, 1);
};

describe("the skip test under allow-skipping false", () => {
  // Skipped, with its reason in the title, while no kind of the stub order is a bare stub
  // (`hasStub`): its premise, an item whose only response a notice binds, has no item to stand on
  // then.
  it.effect.skipIf(!hasStub)(stubNoticeTitle, () =>
    Effect.gen(function* stubNotice() {
      const given = yield* delivery(stubItem);
      const configuration = yield* configure({});
      const { item } = heldOf(given);

      assert.isTrue(item.responses.has("RESPONSE"));
      assert.deepStrictEqual(
        item.unsupported.map(({ shown }) => shown),
        ["notice"],
      );
      proceeds(given, configuration);
    }),
  );

  it.effect(
    "[T-4] lets next and submit-item pass an item whose declared response no interaction binds",
    () =>
      Effect.gen(function* unbound() {
        const given = yield* delivery(unboundItem);
        const configuration = yield* configure({});

        assert.isTrue(heldOf(given).item.responses.has("RESPONSE"));
        proceeds(given, configuration);
      }),
  );

  it.effect(
    "[T-4] still refuses next and submit-item on an item with an unanswered Choice: skipping-not-allowed",
    () =>
      Effect.gen(function* unansweredChoice() {
        const given = yield* delivery(choiceItem("held"));
        const configuration = yield* configure({});

        for (const kind of ["next", "submit-item"] as const) {
          assert.strictEqual(
            refusedRule(stepped(given, kind, configuration)),
            "skipping-not-allowed",
          );
        }
      }),
  );

  it.effect(
    "[Q-4] [T-4] under allow-skipping false, a submission whose only non-NULL response is an End Attempt's false is a skip",
    () =>
      Effect.gen(function* endAttemptFalse() {
        const given = yield* delivery(hintItem("held"));
        const configuration = yield* configure({});

        assert.sameMembers([...heldOf(given).item.responses.keys()], ["HINT", "RESPONSE"]);
        for (const kind of ["submit-item", "next"] as const) {
          assert.strictEqual(
            refusedRule(steppedWith(given, kind, { HINT: unpressed }, configuration)),
            "skipping-not-allowed",
          );
        }
      }),
  );

  it.effect(
    "[Q-4] [T-4] pressing the End Attempt alone does not answer the item: HINT true with the Choice NULL is still a skip",
    () =>
      Effect.gen(function* endAttemptTrue() {
        const given = yield* delivery(hintItem("held"));
        const configuration = yield* configure({});

        for (const kind of ["submit-item", "next"] as const) {
          assert.strictEqual(
            refusedRule(steppedWith(given, kind, { HINT: pressed }, configuration)),
            "skipping-not-allowed",
          );
        }
      }),
  );

  it.effect(
    "[Q-4] [T-4] an answered Choice beside an End Attempt submits, whatever HINT holds",
    () =>
      Effect.gen(function* answeredBesideEndAttempt() {
        const given = yield* delivery(hintItem("held"));
        const configuration = yield* configure({});

        for (const hint of [unpressed, pressed]) {
          const submitted = accepted(
            steppedWith(given, "submit-item", { HINT: hint, RESPONSE: chosen }, configuration),
          );

          assert.strictEqual(submitted.items[0]?.record.numAttempts, 1);
        }
      }),
  );

  it.effect("[Q-4] [T-4] an item whose only interaction is an End Attempt is never skipped", () =>
    Effect.gen(function* onlyEndAttempt() {
      const given = yield* delivery(hintOnlyItem);
      const configuration = yield* configure({});

      assert.sameMembers([...heldOf(given).item.responses.keys()], ["HINT"]);
      proceeds(given, configuration);
    }),
  );
});

describe("the stub kind the shared pins name", () => {
  it("[W0-AQ.1] the derived stub kind is select-point while every module is a stub", () => {
    const stubs = stubOrder.filter(
      (kind) => !modules[kind].implemented && !containerKinds.has(kind),
    );

    assert.strictEqual(hasStub, stubs.length > 0);
    assert.strictEqual(stubKind, stubs[0] ?? stubOrder.at(-1));
    assert.strictEqual(modules[stubKind].implemented, !hasStub);
    assert.strictEqual(containerKinds.has(stubKind), false);

    if (stubs.length === stubOrder.length) {
      assert.isTrue(hasStub);
      assert.strictEqual(stubKind, stubOrder[0]);
      // Select Point is named by its element, so that `stub-kind.ts` stays the one file that names
      // a kind.
      assert.strictEqual(stubElement, "qti-select-point-interaction");
      assert.strictEqual(stubElement, modules[stubKind].element);
      assert.strictEqual(stubBaseType, "point");
      assert.strictEqual(stubCardinality, "multiple");
    }
  });

  it.effect(
    "[W0-AQ.1] every kind of the stub order opens as a notice item under its declaration while its module is a stub, and binds once it is implemented",
    () =>
      Effect.gen(function* stubOrderOpens() {
        const encoder = new TextEncoder();

        for (const kind of stubOrder) {
          const { element, implemented } = modules[kind];
          const opened = yield* open(
            `items/${kind}.xml`,
            encoder.encode(
              itemXml(
                kind,
                declarationOf(stubDeclarations[kind]),
                `<${element} response-identifier="RESPONSE">${stubChildren[kind]}</${element}>`,
              ),
            ),
          );
          const { item } = Option.getOrElse(acceptedItem(opened), () =>
            assert.fail(`${kind} is ${opened.verdict}, not an accepted item`),
          );

          if (implemented) {
            assert.deepStrictEqual(item.unsupported, []);
            assert.isTrue(item.responses.has("RESPONSE"));
          } else {
            assert.deepStrictEqual(
              item.unsupported.map(({ shown }) => shown),
              ["notice"],
            );
          }
        }
      }),
  );
});

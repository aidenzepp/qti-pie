import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { configure } from "#plate/configuration.ts";
import type { Configuration } from "#plate/configuration.ts";
import { attr, doc, el } from "#plate/document/source.ts";
import type { SourceAttribute, SourceChild, SourceElement } from "#plate/document/source.ts";
import { buildTest } from "#plate/model/test.ts";
import type { Test } from "#plate/model/test.ts";
import { itemConfiguration, sessionControl } from "#plate/session/control.ts";
import type { SessionControl } from "#plate/session/control.ts";

/**
 * Construct a `qti-item-session-control`.
 *
 * @param attributes The attributes it sets.
 * @returns The element.
 */
const control = (...attributes: readonly SourceAttribute[]): SourceElement =>
  el("qti-item-session-control", attributes);

/**
 * Construct a visible section titled after its identifier.
 *
 * @param identifier The section's identifier.
 * @param children Its children, a session control first when it has one.
 * @returns The section element.
 */
const section = (identifier: string, children: readonly SourceChild[]): SourceElement =>
  el(
    "qti-assessment-section",
    [
      attr("identifier", identifier),
      attr("title", `Section ${identifier}`),
      attr("visible", "true"),
    ],
    children,
  );

/**
 * Construct an item reference to `<identifier>.xml`.
 *
 * @param identifier The reference's identifier.
 * @param children Its children, none by default.
 * @returns The item reference element.
 */
const itemRef = (identifier: string, children: readonly SourceChild[] = []): SourceElement =>
  el(
    "qti-assessment-item-ref",
    [attr("href", `${identifier}.xml`), attr("identifier", identifier)],
    children,
  );

/**
 * Construct a linear test part.
 *
 * @param identifier The part's identifier.
 * @param submission Its `submission-mode`.
 * @param children Its children, a session control first when it has one.
 * @returns The part element.
 */
const part = (
  identifier: string,
  submission: string,
  children: readonly SourceChild[],
): SourceElement =>
  el(
    "qti-test-part",
    [
      attr("identifier", identifier),
      attr("navigation-mode", "linear"),
      attr("submission-mode", submission),
    ],
    children,
  );

/**
 * Build a test from its parts.
 *
 * @param parts The test's parts.
 * @returns The test model.
 */
const testOf = (...parts: readonly SourceElement[]) =>
  buildTest(
    doc(
      "tests/control.xml",
      el("qti-assessment-test", [attr("identifier", "control"), attr("title", "Control")], parts),
    ),
  );

/**
 * A test shaped like the corpus's `rtest09.xml`: the part sets `show-feedback="true"`, section A
 * sets nothing and holds `item034` with `max-attempts="0"` and `item160` with nothing, and section
 * B sets only `max-attempts="2"` and holds `item434`, which sets only `allow-review="false"`.
 */
const rtest09 = testOf(
  part("part", "individual", [
    control(attr("show-feedback", "true")),
    section("sectionA", [
      itemRef("item034", [control(attr("max-attempts", "0"))]),
      itemRef("item160"),
    ]),
    section("sectionB", [
      control(attr("max-attempts", "2")),
      itemRef("item434", [control(attr("allow-review", "false"))]),
    ]),
  ]),
);

/**
 * The session control of an item ref nothing limits: the XSD defaults, one attempt, individual.
 */
const defaults: SessionControl = {
  allowComment: false,
  allowReview: true,
  allowSkipping: true,
  maxAttempts: 1,
  showFeedback: false,
  showSolution: false,
  submission: "individual",
  validateResponses: false,
};

/**
 * A configuration whose seven session-control fields all differ from the defaults, so a field
 * {@link itemConfiguration} leaves alone shows.
 */
const hostConfiguration = configure({
  allowComment: true,
  allowReview: false,
  allowSkipping: false,
  headingLevel: 3,
  maxAttempts: 5,
  seed: 7,
  showFeedback: true,
  showSolution: true,
  validateResponses: true,
});

/**
 * Resolve an item ref's session control, failing the test when the ref is unknown.
 *
 * @param test The test.
 * @param ref The item ref's identifier.
 * @returns The session control.
 */
const resolved = (test: Test, ref: string): Option.Option<SessionControl> =>
  Result.getSuccess(sessionControl(test, ref));

/**
 * The effective attempt limit of an item ref under the host configuration.
 *
 * @param test The test.
 * @param ref The item ref's identifier.
 * @param configuration The host's configuration.
 * @returns The configuration's `maxAttempts` once the item's control is written in.
 */
const limitOf = (test: Test, ref: string, configuration: Configuration): Option.Option<number> =>
  Option.map(resolved(test, ref), (found) => itemConfiguration(configuration, found).maxAttempts);

describe("sessionControl", () => {
  it.effect(
    "[T-5] [S-1] gives an item the part's, its section's and its own settings, and the defaults elsewhere",
    () =>
      Effect.gen(function* rtest09Settings() {
        const test = yield* rtest09;

        assert.deepStrictEqual(
          resolved(test, "item434"),
          Option.some({ ...defaults, allowReview: false, maxAttempts: 2, showFeedback: true }),
        );
        assert.deepStrictEqual(
          resolved(test, "item034"),
          Option.some({ ...defaults, maxAttempts: 0, showFeedback: true }),
        );
      }),
  );

  it.effect("[T-5] [S-1] gives max-attempts 1 where no element sets it", () =>
    Effect.gen(function* oneAttempt() {
      const test = yield* rtest09;

      assert.deepStrictEqual(
        resolved(test, "item160"),
        Option.some({ ...defaults, showFeedback: true }),
      );
    }),
  );

  it.effect("takes each attribute from the innermost enclosing section that sets it", () =>
    Effect.gen(function* innermost() {
      const test = yield* testOf(
        part("part", "individual", [
          control(attr("max-attempts", "5"), attr("validate-responses", "true")),
          section("outer", [
            control(attr("max-attempts", "3"), attr("show-solution", "true")),
            section("inner", [control(attr("max-attempts", "4")), itemRef("item")]),
          ]),
        ]),
      );

      assert.deepStrictEqual(
        resolved(test, "item"),
        Option.some({ ...defaults, maxAttempts: 4, showSolution: true, validateResponses: true }),
      );
    }),
  );

  it.effect("fails with UnknownItemRef for an identifier the test does not hold", () =>
    Effect.gen(function* unknown() {
      const test = yield* rtest09;

      assert.deepStrictEqual(
        Option.map(Result.getFailure(sessionControl(test, "sectionB")), (failure) => ({
          _tag: failure._tag,
          ref: failure.ref,
          test: failure.test,
        })),
        Option.some({ _tag: "UnknownItemRef", ref: "sectionB", test: "control" }),
      );
    }),
  );
});

describe("itemConfiguration", () => {
  it.effect(
    "[T-5] [S-1] replaces the configuration's seven session-control fields and keeps the rest",
    () =>
      Effect.gen(function* replaced() {
        const test = yield* rtest09;
        const configuration = yield* hostConfiguration;
        const item434 = yield* Effect.fromResult(sessionControl(test, "item434"));

        assert.deepStrictEqual(itemConfiguration(configuration, item434), {
          ...configuration,
          allowComment: false,
          allowReview: false,
          allowSkipping: true,
          maxAttempts: 2,
          showFeedback: true,
          showSolution: false,
          validateResponses: false,
        });
      }),
  );

  it.effect("[T-5] [S-1] writes a negative max-attempts as 0, no limit", () =>
    Effect.gen(function* negative() {
      const test = yield* testOf(
        part("part", "individual", [
          section("section", [itemRef("item", [control(attr("max-attempts", "-1"))])]),
        ]),
      );
      const configuration = yield* hostConfiguration;

      assert.deepStrictEqual(
        Option.map(resolved(test, "item"), (found) => found.maxAttempts),
        Option.some(-1),
      );
      assert.deepStrictEqual(limitOf(test, "item", configuration), Option.some(0));
    }),
  );

  it.effect("[T-5] [S-1] writes 1 in a simultaneous part, whatever max-attempts says", () =>
    Effect.gen(function* simultaneous() {
      const test = yield* testOf(
        part("part", "simultaneous", [
          control(attr("max-attempts", "3")),
          section("section", [
            itemRef("three"),
            itemRef("unlimited", [control(attr("max-attempts", "0"))]),
            itemRef("negative", [control(attr("max-attempts", "-2"))]),
          ]),
        ]),
      );
      const configuration = yield* hostConfiguration;

      assert.deepStrictEqual(
        ["three", "unlimited", "negative"].map((ref) => limitOf(test, ref, configuration)),
        [Option.some(1), Option.some(1), Option.some(1)],
      );
      assert.deepStrictEqual(
        Option.map(resolved(test, "three"), (found) => found.submission),
        Option.some("simultaneous"),
      );
    }),
  );

  it.effect("keeps max-attempts 0, no limit, in an individual part", () =>
    Effect.gen(function* unlimited() {
      const test = yield* rtest09;
      const configuration = yield* hostConfiguration;

      assert.deepStrictEqual(limitOf(test, "item034", configuration), Option.some(0));
    }),
  );
});

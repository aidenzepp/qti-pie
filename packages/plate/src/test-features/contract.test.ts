import { readdirSync } from "node:fs";
import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Predicate, Result } from "effect";
import { configure } from "#plate/configuration.ts";
import { attr, doc, el, qtiNamespace, xincludeNamespace } from "#plate/document/source.ts";
import type { SourceDocument, SourceElement } from "#plate/document/source.ts";
import { pathsOf } from "#plate/model/item.ts";
import { readersOf } from "#plate/model/reader.ts";
import { buildTest } from "#plate/model/test.ts";
import type { Test } from "#plate/model/test.ts";
import { moveTargets } from "#plate/session/navigate.ts";
import { startTest } from "#plate/session/start.ts";
import type { TestSession } from "#plate/session/session.ts";
import { TestFeatureNotImplemented, stub, testFeatureKeys } from "#plate/test-features/contract.ts";
import type {
  SequencePlace,
  TestFeatureId,
  TestFeatureKey,
  TestFeatureModule,
  TestFeatureNodes,
  TestParseContext,
} from "#plate/test-features/contract.ts";
import { deliveredBy, featureAt, gatedBy, sequencedBy } from "#plate/test-features/dispatch.ts";
import { testFeatures } from "#plate/test-features/table.ts";
import type { AnyTestFeature, TestFeatureTable } from "#plate/test-features/table.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";
import type { Accepted, AcceptedTest } from "#plate/validate/verdict.ts";
import { testMarks } from "#plate/vocabulary.ts";

/**
 * A test-feature module as this test reads it, its node type erased.
 */
type AnyModule = TestFeatureModule<TestFeatureKey, unknown>;

/**
 * What each feature's module declares, by key: none of it changes when the module lands.
 */
const declared = {
  "qti-adaptive-selection": {
    element: "qti-adaptive-selection",
    feature: [],
    namespace: qtiNamespace,
  },
  "qti-assessment-section-ref": {
    element: "qti-assessment-section-ref",
    feature: ["S-9", "P-2"],
    namespace: qtiNamespace,
  },
  "qti-branch-rule": { element: "qti-branch-rule", feature: [], namespace: qtiNamespace },
  "qti-context-declaration": {
    element: "qti-context-declaration",
    feature: ["I-15"],
    namespace: qtiNamespace,
  },
  "qti-ordering": { element: "qti-ordering", feature: ["S-4"], namespace: qtiNamespace },
  "qti-pre-condition": { element: "qti-pre-condition", feature: [], namespace: qtiNamespace },
  "qti-rubric-block": {
    element: "qti-rubric-block",
    feature: ["S-5", "T-13"],
    namespace: qtiNamespace,
  },
  "qti-selection": { element: "qti-selection", feature: ["S-3"], namespace: qtiNamespace },
  "qti-stylesheet": { element: "qti-stylesheet", feature: ["T-3"], namespace: qtiNamespace },
  "qti-test-feedback": {
    element: "qti-test-feedback",
    feature: ["T-8", "T-10"],
    namespace: qtiNamespace,
  },
  "qti-time-limits": {
    element: "qti-time-limits",
    feature: ["T-2", "S-2", "T-6", "I-16"],
    namespace: qtiNamespace,
  },
  "xi:include": { element: "include", feature: ["I-12", "S-6"], namespace: xincludeNamespace },
} satisfies Readonly<
  Record<
    TestFeatureKey,
    {
      readonly element: string;
      readonly feature: readonly TestFeatureId[];
      readonly namespace: string;
    }
  >
>;

/**
 * Tell whether an export is a test-feature module.
 *
 * @param value The export.
 * @returns Whether it is one.
 */
const isModule = (value: unknown): value is AnyModule =>
  Predicate.isObject(value) &&
  Predicate.isString(value["key"]) &&
  Predicate.isBoolean(value["implemented"]) &&
  Predicate.isFunction(value["parse"]);

/**
 * The modules each file of `src/test-features/` beside this test exports, in file order, so a
 * module that lands is found here as it is.
 */
const foundPerFile = await Promise.all(
  readdirSync(new URL("./", import.meta.url))
    .filter((file) => file.endsWith(".ts") && !file.endsWith(".test.ts"))
    .toSorted()
    .map(async (file): Promise<readonly AnyModule[]> => {
      const loaded: unknown = await import(`#plate/test-features/${file}`);

      return Predicate.isObject(loaded) ? Object.values(loaded).filter(isModule) : [];
    }),
);

/**
 * Every module those files export, in file order.
 */
const found: readonly AnyModule[] = foundPerFile.flat();

/**
 * The stubs: the modules of the table that are not implemented.
 */
const stubs = testFeatures.filter((module) => !module.implemented);

/**
 * Construct an element of a module's own name and namespace, with no attributes and no children.
 *
 * @param module The module.
 * @returns The element.
 */
const elementOf = (module: AnyModule): SourceElement =>
  el(module.element, [], [], module.namespace);

/**
 * A parse context and the features its marks named, in order.
 */
interface MarkRecording {
  readonly context: TestParseContext;
  readonly marked: string[];
}

/**
 * Construct a parse context that records every mark it is asked for.
 *
 * @param source The document the element is read from.
 * @returns The context and the features its marks named.
 */
const recording = (source: SourceDocument): MarkRecording => {
  const marked: string[] = [];

  return {
    context: {
      mark: (feature) => {
        marked.push(feature);

        return Result.succeed(Option.none());
      },
      path: "qti-assessment-test/x",
      readers: readersOf({ builder: "buildTest", document: source, paths: pathsOf(source) }),
    },
    marked,
  };
};

/**
 * Write a one-part, one-section test holding some item refs, each `href` `<ref>.xml`, the section
 * holding the given children before them.
 *
 * @param refs The item refs' identifiers.
 * @param before The section's other children.
 * @returns The document.
 */
const testOf = (refs: readonly string[], before: readonly SourceElement[] = []): SourceDocument =>
  doc(
    "tests/t.xml",
    el(
      "qti-assessment-test",
      [attr("identifier", "t"), attr("title", "T")],
      [
        el(
          "qti-test-part",
          [
            attr("identifier", "P1"),
            attr("navigation-mode", "nonlinear"),
            attr("submission-mode", "individual"),
          ],
          [
            el(
              "qti-assessment-section",
              [attr("identifier", "S1"), attr("title", "S"), attr("visible", "true")],
              [
                ...before,
                ...refs.map((ref) =>
                  el("qti-assessment-item-ref", [
                    attr("identifier", ref),
                    attr("href", `${ref}.xml`),
                  ]),
                ),
              ],
            ),
          ],
        ),
      ],
    ),
  );

/**
 * A `qti-time-limits` with a `max-time`.
 *
 * @param maxTime The seconds.
 * @returns The element.
 */
const timeLimits = (maxTime: number): SourceElement =>
  el("qti-time-limits", [attr("max-time", String(maxTime))]);

/**
 * The node the landed module reads a `qti-time-limits` into.
 */
interface TimeLimitsNode {
  readonly maxTime: number;
  readonly path: string;
}

/**
 * A time-limits module as it would land, for this test alone: it reads `max-time`, reverses the
 * sequence, refuses `next`, and retitles the delivered test, each a visible effect at one hub.
 */
const landedTimeLimits: TestFeatureModule<"qti-time-limits", TimeLimitsNode> = {
  ...stub({
    element: "qti-time-limits",
    feature: ["T-2"],
    issue: "m3f-01",
    key: "qti-time-limits",
    namespace: qtiNamespace,
  }),
  deliver: (context) => ({ ...context.test, title: `${context.test.title} (timed)` }),
  gate: (context) =>
    context.intent.kind === "next"
      ? Option.some({ detail: "the time has run out", kind: "refuse", rule: "time-expired" })
      : Option.none(),
  implemented: true,
  parse: (element, context) =>
    Result.map(context.readers.floatAttribute(element, "max-time"), (maxTime) => {
      if (Option.isNone(maxTime)) {
        return Option.none();
      }

      return Option.some({ maxTime: maxTime.value, path: context.path });
    }),
  sequence: (context) => context.places.toReversed(),
};

/**
 * The table with the landed module in the stub's place.
 */
const landed: TestFeatureTable = testFeatures.map((module) =>
  module.key === "qti-time-limits" ? landedTimeLimits : module,
);

/**
 * The nodes a test built under {@link landed} holds, typed from the table.
 */
type LandedNodes = TestFeatureNodes<AnyTestFeature | typeof landedTimeLimits>;

/**
 * Build a test, failing the test when `buildTest` refuses.
 *
 * @param source The document.
 * @param features The table.
 * @returns The test.
 */
const built = (source: SourceDocument, features: TestFeatureTable): Test =>
  Result.getOrElse(buildTest(source, features), (refusal) =>
    assert.fail(`buildTest refused: ${refusal.rule}`),
  );

/**
 * The places of a test's item refs in document order, each with its part.
 *
 * @param test The test.
 * @returns The places.
 */
const placesOf = (test: Test): readonly SequencePlace[] =>
  test.parts.flatMap((part) =>
    part.children.flatMap((section) =>
      section.kind === "section"
        ? section.children.flatMap((child) =>
            child.kind === "item-ref" ? [{ part, ref: child }] : [],
          )
        : [],
    ),
  );

/**
 * Write a hand-built item: one Choice bound to `RESPONSE`.
 *
 * @param identifier The item's identifier.
 * @returns The item's text.
 */
const itemXml = (identifier: string): string =>
  `<qti-assessment-item xmlns="${qtiNamespace}" identifier="${identifier}" title="${identifier}" adaptive="false" time-dependent="false"><qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/><qti-item-body><qti-choice-interaction response-identifier="RESPONSE"><qti-simple-choice identifier="A">A</qti-simple-choice><qti-simple-choice identifier="B">B</qti-simple-choice></qti-choice-interaction></qti-item-body></qti-assessment-item>`;

/**
 * Write the two-item test the session tests open.
 */
const sessionTestXml = `<qti-assessment-test xmlns="${qtiNamespace}" identifier="t" title="T"><qti-test-part identifier="P1" navigation-mode="nonlinear" submission-mode="individual"><qti-assessment-section identifier="S1" title="S" visible="true"><qti-time-limits max-time="60"/><qti-assessment-item-ref identifier="i1" href="i1.xml"/><qti-assessment-item-ref identifier="i2" href="i2.xml"/></qti-assessment-section></qti-test-part></qti-assessment-test>`;

/**
 * Open the two-item test and its items, and start a session of it.
 */
const startedSession = Effect.gen(function* startSession() {
  const encoder = new TextEncoder();
  const verdict = yield* open("tests/t.xml", encoder.encode(sessionTestXml));
  const test: AcceptedTest =
    (verdict.verdict === "accepted" || verdict.verdict === "accepted-with-unsupported") &&
    verdict.kind === "test"
      ? verdict.accepted
      : assert.fail(`the test is ${verdict.verdict}`);
  const items = new Map<string, Accepted>();
  for (const ref of ["i1", "i2"]) {
    const opened = yield* open(`tests/${ref}.xml`, encoder.encode(itemXml(ref)));
    items.set(
      ref,
      Option.getOrElse(acceptedItem(opened), () => assert.fail(`${ref} is ${opened.verdict}`)),
    );
  }

  const configuration = yield* configure({});
  const session: TestSession = Result.getOrElse(
    startTest(test, items, configuration, { instance: "sitting", now: new Date(0) }),
    (failure) => assert.fail(`startTest refused: ${failure.message}`),
  );

  return { session, test };
});

describe("the test-feature modules", () => {
  it("are twelve, one per key in testMarks' order, each declared, and every file beside the contract exports its own", () => {
    assert.deepStrictEqual(
      testFeatures.map((module) => module.key),
      [...testFeatureKeys],
    );
    assert.strictEqual(new Set(testFeatureKeys).size, 12);
    assert.sameMembers(
      found.map((module) => module.key),
      [...testFeatureKeys],
    );
    for (const module of testFeatures) {
      const expected = declared[module.key];
      assert.strictEqual(module.element, expected.element, module.key);
      assert.strictEqual(module.namespace, expected.namespace, module.key);
      assert.deepStrictEqual(module.feature, expected.feature, module.key);
      assert.isNotEmpty(module.issue, module.key);
    }
  });

  it("key the element marks of testMarks, in order, before the marks no element names", () => {
    assert.deepStrictEqual([...testMarks].slice(0, testFeatureKeys.length), [...testFeatureKeys]);
    for (const module of testFeatures) {
      assert.include([...testMarks], module.key);
    }
  });
});

describe("a test-feature module not implemented", () => {
  it("parses its element as none, its key recorded once as the mark, and is found by its element", () => {
    const source = testOf([]);
    for (const module of stubs) {
      const element = elementOf(module);
      const { context, marked } = recording(source);

      assert.deepStrictEqual(
        module.parse(element, context),
        Result.succeed(Option.none()),
        module.key,
      );
      assert.deepStrictEqual(marked, [module.key], module.key);
      assert.strictEqual(
        Option.getOrUndefined(featureAt(testFeatures, element))?.key,
        module.key,
        module.key,
      );
    }
  });

  it.effect("leaves the sequence, every intent and the delivered test as they are", () =>
    Effect.gen(function* noEffect() {
      const { session } = yield* startedSession;
      const test = built(testOf(["a", "b"]), testFeatures);
      const places = placesOf(test);

      assert.deepStrictEqual(sequencedBy(testFeatures, { places, seed: "seed", test }), places);
      for (const intent of [
        { kind: "next" },
        { kind: "submit-item" },
        { kind: "end-part" },
      ] as const) {
        assert.deepStrictEqual(
          gatedBy(testFeatures, { intent, now: Option.none(), session, test }),
          Option.none(),
          intent.kind,
        );
      }

      assert.strictEqual(
        deliveredBy(testFeatures, { documents: new Map(), source: testOf([]), test }),
        test,
      );
    }),
  );

  it("names its key and the issue that fills it in TestFeatureNotImplemented", () => {
    const thrown = new TestFeatureNotImplemented({ feature: "qti-time-limits", issue: "m3f-01" });

    assert.include(thrown.message, "qti-time-limits");
    assert.include(thrown.message, "m3f-01");
  });
});

describe("a test-feature module that has landed", () => {
  it("reaches the model: buildTest holds its node under its key and records no mark for it, where the stub marked it", () => {
    const source = testOf(["a"], [timeLimits(60)]);
    const withStub = built(source, testFeatures);
    const withLanded = built(source, landed);
    const path = "qti-assessment-test/qti-test-part/qti-assessment-section/qti-time-limits";
    const nodes: LandedNodes | undefined = withLanded.features;

    assert.deepStrictEqual(withStub.unsupported, [
      { feature: "qti-time-limits", path, shown: "mark" },
    ]);
    assert.isUndefined(withStub.features);
    assert.deepStrictEqual(withLanded.unsupported, []);
    assert.deepStrictEqual(nodes?.["qti-time-limits"], [{ maxTime: 60, path }]);
  });

  it("reaches the session's start: the sequence is what its sequence hook gives", () => {
    const test = built(testOf(["a", "b", "c"]), testFeatures);
    const places = placesOf(test);

    assert.deepStrictEqual(
      sequencedBy(landed, { places, seed: "seed", test }).map((place) => place.ref.identifier),
      ["c", "b", "a"],
    );
  });

  it.effect(
    "reaches the session's moves: moveTargets refuses what its gate refuses, under the rule feature with its own rule",
    () =>
      Effect.gen(function* gatedMove() {
        const { session, test } = yield* startedSession;
        const decide = yield* Effect.fromResult(moveTargets(test, session, landed));
        const asToday = yield* Effect.fromResult(moveTargets(test, session));
        const refused = decide({ kind: "next" });
        const allowed = asToday({ kind: "next" });

        assert.deepStrictEqual(allowed, Result.succeed(2));
        assert.isTrue(Result.isFailure(refused));
        if (Result.isFailure(refused)) {
          assert.strictEqual(refused.failure.rule, "feature");
          assert.deepStrictEqual(
            refused.failure.feature,
            Option.some({
              detail: "the time has run out",
              feature: "qti-time-limits",
              rule: "time-expired",
            }),
          );
          assert.include(refused.failure.message, "time-expired");
        }

        assert.deepStrictEqual(decide({ kind: "go", sequenceIndex: 2 }), Result.succeed(2));
      }),
  );

  it("reaches the package's delivery: the delivered test is what its deliver hook gives", () => {
    const test = built(testOf(["a"]), testFeatures);

    assert.strictEqual(
      deliveredBy(landed, { documents: new Map(), source: testOf([]), test }).title,
      "T (timed)",
    );
  });
});

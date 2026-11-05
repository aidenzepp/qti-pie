import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { decodeSession, encodeSession } from "#plate/codec/session.ts";
import { configure } from "#plate/configuration.ts";
import type { Configuration } from "#plate/configuration.ts";
import { readCorpusFile } from "#plate/document/corpus.ts";
import { nullOf } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";
import { redact, render } from "#plate/render.ts";
import type { TestSession } from "#plate/session/session.ts";
import {
  current,
  itemView,
  permits,
  present,
  recordStep,
  startTest,
} from "#plate/session/start.ts";
import type { Current, ItemView } from "#plate/session/start.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";
import type { Accepted, AcceptedTest } from "#plate/validate/verdict.ts";

/**
 * The folder of the Beginner's Guide examples under the corpus root.
 */
const guide = "QTI3_BeginnersGuide_Examples";

/**
 * `BGtest.xml`'s six item refs in document order, each with its `href`.
 */
const guideRefs = [
  ["firstexample", "items/firstexample.xml"],
  ["beginnersguide007", "items/BG007.xml"],
  ["beginnersguide008", "items/BG008.xml"],
  ["beginnersguide009", "items/BG009.xml"],
  ["beginnersguide010", "items/BG010.xml"],
  ["beginnersguide011", "items/BG011.xml"],
] as const;

/**
 * The session instance every test starts with.
 */
const instance = "sitting";

/**
 * The time every test starts its session at.
 */
const startedAt = new Date("2026-11-05T10:00:00.000Z");

/**
 * Give a time some milliseconds after {@link startedAt}.
 *
 * @param milliseconds The offset, negative for a time before it.
 * @returns The time.
 */
const after = (milliseconds: number): Date => new Date(startedAt.getTime() + milliseconds);

/**
 * BG007's and BG008's choice `true`, as a single identifier.
 */
const chosen: Value = {
  baseType: "identifier",
  cardinality: "single",
  values: [{ baseType: "identifier", value: "true" }],
};

/**
 * The NULL single identifier, the value of a Choice response nothing has set.
 */
const nullChoice = nullOf("identifier", "single");

/**
 * The default the hand-built items declare for `RESPONSE`: the choice `B`.
 */
const choiceB: Value = {
  baseType: "identifier",
  cardinality: "single",
  values: [{ baseType: "identifier", value: "B" }],
};

/**
 * A test and the items it delivers, as a host passes them to `startTest`.
 */
interface Delivery {
  readonly items: ReadonlyMap<string, Accepted>;
  readonly test: AcceptedTest;
}

/**
 * Open a document and require an accepted item.
 *
 * @param location The document's location, which `open` takes.
 * @param bytes The document's bytes.
 * @returns The accepted item.
 */
const openItem = Effect.fnUntraced(function* openItem(location: string, bytes: Uint8Array) {
  const verdict = yield* open(location, bytes);

  return Option.getOrElse(acceptedItem(verdict), () =>
    assert.fail(`${location} is ${verdict.verdict}, not an accepted item`),
  );
});

/**
 * Open a document and require an accepted test.
 *
 * @param location The document's location, which `open` takes.
 * @param bytes The document's bytes.
 * @returns The accepted test.
 */
const openTest = Effect.fnUntraced(function* openTest(location: string, bytes: Uint8Array) {
  const verdict = yield* open(location, bytes);

  return (verdict.verdict === "accepted" || verdict.verdict === "accepted-with-unsupported") &&
    verdict.kind === "test"
    ? verdict.accepted
    : assert.fail(`${location} is ${verdict.verdict} on a ${verdict.kind}, not an accepted test`);
});

/**
 * Open `BGtest.xml` and its six items from the corpus cache, each item keyed by its ref.
 *
 * @returns The test and its items.
 */
const guideDelivery = Effect.fnUntraced(function* guideDelivery() {
  const testLocation = `${guide}/BGtest.xml`;
  const test = yield* openTest(testLocation, yield* readCorpusFile(testLocation));
  const items = new Map<string, Accepted>();
  for (const [ref, href] of guideRefs) {
    const location = `${guide}/${href}`;
    items.set(ref, yield* openItem(location, yield* readCorpusFile(location)));
  }

  return { items, test } satisfies Delivery;
});

/**
 * Write the text of a hand-built item: one Choice bound to the single identifier `RESPONSE`.
 *
 * @param identifier The item's identifier.
 * @param options What the item adds.
 * @param options.choices The choices' identifiers, in document order.
 * @param options.defaultValue Whether `RESPONSE` declares the default `B`.
 * @param options.shuffle Whether the Choice shuffles.
 * @returns The item's text.
 */
const itemXml = (
  identifier: string,
  options: { readonly choices: readonly string[]; defaultValue: boolean; shuffle: boolean },
): string =>
  [
    `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="${identifier}" title="${identifier}" adaptive="false" time-dependent="false">`,
    '<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">',
    options.defaultValue ? "<qti-default-value><qti-value>B</qti-value></qti-default-value>" : "",
    "</qti-response-declaration><qti-item-body>",
    `<qti-choice-interaction response-identifier="RESPONSE" shuffle="${options.shuffle}">`,
    ...options.choices.map(
      (choice) => `<qti-simple-choice identifier="${choice}">Choice ${choice}</qti-simple-choice>`,
    ),
    "</qti-choice-interaction></qti-item-body></qti-assessment-item>",
  ].join("");

/**
 * Write the text of a hand-built test: one nonlinear, individual part with one section that holds
 * each item ref.
 *
 * @param identifier The test's identifier.
 * @param refs Each item ref's identifier with its `href`, in document order.
 * @returns The test's text.
 */
const testXml = (identifier: string, refs: readonly (readonly [string, string])[]): string =>
  [
    `<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="${identifier}" title="${identifier}">`,
    '<qti-test-part identifier="part" navigation-mode="nonlinear" submission-mode="individual">',
    '<qti-assessment-section identifier="section" title="Section" visible="true">',
    ...refs.map(([ref, href]) => `<qti-assessment-item-ref identifier="${ref}" href="${href}"/>`),
    "</qti-assessment-section></qti-test-part></qti-assessment-test>",
  ].join("");

/**
 * Open a hand-built test and its items, the test at `tests/<identifier>.xml` and each item beside
 * it at `tests/<ref>.xml`.
 *
 * @param identifier The test's identifier.
 * @param items Each item ref's identifier with its item's text.
 * @returns The test and its items.
 */
const builtDelivery = Effect.fnUntraced(function* builtDelivery(
  identifier: string,
  items: readonly (readonly [string, string])[],
) {
  const encoder = new TextEncoder();
  const test = yield* openTest(
    `tests/${identifier}.xml`,
    encoder.encode(
      testXml(
        identifier,
        items.map(([ref]) => [ref, `${ref}.xml`] as const),
      ),
    ),
  );
  const accepted = new Map<string, Accepted>();
  for (const [ref, xml] of items) {
    accepted.set(ref, yield* openItem(`tests/${ref}.xml`, encoder.encode(xml)));
  }

  return { items: accepted, test } satisfies Delivery;
});

/**
 * Start a session of a one-item test whose item ref `first` has an `href` given, with an item
 * opened at a location given under the key `first`.
 *
 * @param testLocation The test's location.
 * @param href The item ref's `href`.
 * @param itemLocation The item's location.
 * @returns What `startTest` returned.
 */
const startedWith = Effect.fnUntraced(function* startedWith(
  testLocation: string,
  href: string,
  itemLocation: string,
) {
  const encoder = new TextEncoder();
  const test = yield* openTest(testLocation, encoder.encode(testXml("hrefs", [["first", href]])));
  const item = yield* openItem(
    itemLocation,
    encoder.encode(itemXml("first", { choices: ["A", "B"], defaultValue: false, shuffle: false })),
  );

  return startTest(test, new Map([["first", item]]), yield* configure({}), {
    instance,
    now: startedAt,
  });
});

/**
 * Start a session of a delivery, failing the test when `startTest` refuses.
 *
 * @param delivery The test and its items.
 * @param configuration The host's configuration.
 * @returns The session.
 */
const started = (delivery: Delivery, configuration: Configuration): TestSession =>
  Result.getOrElse(
    startTest(delivery.test, delivery.items, configuration, { instance, now: startedAt }),
    (failure) => assert.fail(`startTest refused: ${failure.message}`),
  );

/**
 * Hand a session through a host's storage: encode it, write it as JSON text, read the text back
 * and decode it, failing the test when either side refuses.
 *
 * @param test The test the session belongs to.
 * @param session The session.
 * @returns The session as the library reads it back.
 */
const throughHost = (test: AcceptedTest, session: TestSession): TestSession => {
  const stored = Result.getOrElse(encodeSession(session), (failure) =>
    assert.fail(failure.message),
  );
  // oxlint-disable-next-line unicorn/prefer-structured-clone -- The test proves the session survives JSON text, the form a host stores; `structuredClone` would keep what JSON drops.
  const handedBack: unknown = JSON.parse(JSON.stringify(stored));

  return Result.getOrElse(decodeSession(handedBack, test), (failure) =>
    assert.fail(failure.message),
  );
};

/**
 * Read the current item of a session, failing the test when the session shows the summary or
 * `current` fails.
 *
 * @param delivery The test and its items.
 * @param session The session.
 * @param configuration The host's configuration.
 * @returns The current item's view.
 */
const currentItem = (
  delivery: Delivery,
  session: TestSession,
  configuration: Configuration,
): ItemView => {
  const shown: Current = Result.getOrElse(
    current(delivery.test, session, configuration),
    (failure) => assert.fail(`current failed: ${failure.message}`),
  );

  return shown.kind === "item" ? shown : assert.fail("current shows the summary, not an item");
};

/**
 * Read one item's view, failing the test when `itemView` fails.
 *
 * @param delivery The test and its items.
 * @param session The session.
 * @param configuration The host's configuration.
 * @param sequenceIndex The item's sequence index.
 * @returns The view.
 */
const viewAt = (
  delivery: Delivery,
  session: TestSession,
  configuration: Configuration,
  sequenceIndex: number,
): ItemView =>
  Result.getOrElse(itemView(delivery.test, session, configuration, sequenceIndex), (failure) =>
    assert.fail(`itemView failed: ${failure.message}`),
  );

/**
 * Read a result's failure, failing the test unless it failed with the tag given.
 *
 * @param result The result.
 * @param tag The failure's expected `_tag`.
 * @returns The failure, narrowed to its tag.
 */
const failureTagged = <A, E extends { readonly _tag: string }, T extends E["_tag"]>(
  result: Result.Result<A, E>,
  tag: T,
): Extract<E, { readonly _tag: T }> => {
  const failure = Option.getOrElse(Result.getFailure(result), () =>
    assert.fail(`expected the failure ${tag}, and the call succeeded`),
  );
  const tagged = (candidate: E): candidate is Extract<E, { readonly _tag: T }> =>
    candidate._tag === tag;

  return tagged(failure)
    ? failure
    : assert.fail(`expected the failure ${tag}, not ${failure._tag}`);
};

describe("startTest", () => {
  it.effect(
    "[T-4] [T-7] [S-7] numbers BGtest.xml's six items 1 to 6 in document order, each with its own instance, and presents the first",
    () =>
      Effect.gen(function* guideStarts() {
        const delivery = yield* guideDelivery();
        const session = started(delivery, yield* configure({}));

        assert.deepStrictEqual(
          session.items.map((item) => [item.sequenceIndex, item.ref, item.record.instance]),
          guideRefs.map(([ref], index) => [index + 1, ref, `${instance}.${index + 1}`]),
        );
        assert.deepStrictEqual(
          session.items.map((item) => item.presented),
          [true, false, false, false, false, false],
        );
        assert.deepStrictEqual(session.parts, [{ identifier: "testPart-1", status: "current" }]);
        assert.strictEqual(session.status, "interacting");
        assert.strictEqual(session.position, 0);
        assert.strictEqual(session.started, startedAt.toISOString());
        assert.strictEqual(session.document, `${guide}/BGtest.xml`);
      }),
  );

  it.effect("refuses items with no entry for an item ref: item-missing", () =>
    Effect.gen(function* missingItem() {
      const delivery = yield* guideDelivery();
      const items = new Map(delivery.items);
      items.delete("beginnersguide009");

      const refused = startTest(delivery.test, items, yield* configure({}), {
        instance,
        now: startedAt,
      });

      const failure = failureTagged(refused, "TestNotDeliverable");

      assert.deepStrictEqual(
        [failure.reason, failure.ref, failure.expected, failure.found],
        ["item-missing", "beginnersguide009", `${guide}/items/BG009.xml`, Option.none()],
      );
    }),
  );

  it.effect("refuses an item from another document than its ref names: item-mismatch", () =>
    Effect.gen(function* mismatchedItem() {
      const delivery = yield* guideDelivery();
      const items = new Map(delivery.items);
      const bg007 = items.get("beginnersguide007") ?? assert.fail("BG007 is not among the items");
      items.set("beginnersguide008", bg007);

      const refused = startTest(delivery.test, items, yield* configure({}), {
        instance,
        now: startedAt,
      });

      const failure = failureTagged(refused, "TestNotDeliverable");

      assert.deepStrictEqual(
        [failure.reason, failure.ref, failure.expected, failure.found],
        [
          "item-mismatch",
          "beginnersguide008",
          `${guide}/items/BG008.xml`,
          Option.some(`${guide}/items/BG007.xml`),
        ],
      );
    }),
  );

  it.effect(
    "resolves an item ref's href against the test's location, so ../ names a document above it",
    () =>
      Effect.gen(function* dottedHref() {
        assert.isTrue(
          Result.isSuccess(
            yield* startedWith("tests/nested/up.xml", "../first.xml", "tests/first.xml"),
          ),
        );
        assert.strictEqual(
          failureTagged(
            yield* startedWith("tests/nested/up.xml", "../first.xml", "tests/nested/first.xml"),
            "TestNotDeliverable",
          ).expected,
          "tests/first.xml",
        );
      }),
  );

  it.effect(
    "decodes an href's percent escapes as the manifest does, so a%20b.xml finds the file a b.xml",
    () =>
      Effect.gen(function* escapedHref() {
        assert.isTrue(
          Result.isSuccess(yield* startedWith("tests/hrefs.xml", "a%20b.xml", "tests/a b.xml")),
        );
        assert.strictEqual(
          failureTagged(
            yield* startedWith("tests/hrefs.xml", "a%20b.xml", "tests/a%20b.xml"),
            "TestNotDeliverable",
          ).expected,
          "tests/a b.xml",
        );
      }),
  );

  it.effect("sets an href's fragment and query aside", () =>
    Effect.gen(function* fragmentHref() {
      assert.isTrue(
        Result.isSuccess(
          yield* startedWith("tests/hrefs.xml", "first.xml#part", "tests/first.xml"),
        ),
      );
      assert.isTrue(
        Result.isSuccess(yield* startedWith("tests/hrefs.xml", "first.xml?v=1", "tests/first.xml")),
      );
    }),
  );

  it.effect("leaves a segment with a malformed escape as written, as the manifest does", () =>
    Effect.gen(function* malformedHref() {
      assert.isTrue(
        Result.isSuccess(
          yield* startedWith("tests/hrefs.xml", "a%20b%zz.xml", "tests/a%20b%zz.xml"),
        ),
      );
      assert.strictEqual(
        failureTagged(
          yield* startedWith("tests/hrefs.xml", "a%20b%zz.xml", "tests/a b%zz.xml"),
          "TestNotDeliverable",
        ).expected,
        "tests/a%20b%zz.xml",
      );
    }),
  );

  it.effect("refuses a session instance checkInstance refuses, and an invalid now", () =>
    Effect.gen(function* brokenContext() {
      const delivery = yield* guideDelivery();
      const configuration = yield* configure({});

      const badInstance = startTest(delivery.test, delivery.items, configuration, {
        instance: "sitting-",
        now: startedAt,
      });
      const badTime = startTest(delivery.test, delivery.items, configuration, {
        instance,
        now: new Date(Number.NaN),
      });

      assert.strictEqual(
        failureTagged(badInstance, "InvalidSessionInstance").requirement,
        "id-boundary",
      );
      assert.strictEqual(failureTagged(badTime, "InvalidTime").argument, "context.now");
    }),
  );
});

describe("current", () => {
  it.effect(
    "[T-4] [T-7] [S-7] shows BGtest.xml's item 1 with NULL values, the instance <instance>.1 and its part's modes",
    () =>
      Effect.gen(function* guideCurrent() {
        const delivery = yield* guideDelivery();
        const configuration = yield* configure({});
        const view = currentItem(delivery, started(delivery, configuration), configuration);

        assert.deepStrictEqual(
          [view.ref, view.sequenceIndex, view.count, view.instance, view.disabled],
          ["firstexample", 1, 6, `${instance}.1`, false],
        );
        assert.deepStrictEqual([view.navigation, view.submission], ["nonlinear", "individual"]);
        assert.deepStrictEqual(view.values, { RESPONSE: nullChoice });
      }),
  );

  it.effect("renders with the seed the session started with, not the host's", () =>
    Effect.gen(function* storedSeed() {
      const delivery = yield* guideDelivery();
      const session = started(delivery, yield* configure({ seed: 7 }));

      assert.deepStrictEqual(session.seed, Option.some(7));
      assert.strictEqual(
        currentItem(delivery, session, yield* configure({ seed: 9 })).configuration.seed,
        7,
      );
    }),
  );

  it.effect(
    "[T-14] renders a shuffled Choice byte-equal after a JSON round trip of a session started with no seed, whatever seed the host passes",
    () =>
      Effect.gen(function* unseededRoundTrip() {
        const delivery = yield* builtDelivery("shuffle", [
          [
            "shuffled",
            itemXml("shuffled", {
              choices: ["A", "B", "C", "D"],
              defaultValue: false,
              shuffle: true,
            }),
          ],
        ]);
        const item = redact(
          delivery.items.get("shuffled") ?? assert.fail("the shuffled item is missing"),
        );
        const hostConfiguration = yield* configure({ seed: 9 });
        const session = started(delivery, yield* configure({}));
        const restored = throughHost(delivery.test, session);
        const htmlOf = (view: ItemView): string =>
          Result.getOrElse(
            render(item, view.configuration, {
              disabled: view.disabled,
              instance: view.instance,
              values: view.values,
            }),
            (failure) => assert.fail(failure.message),
          ).html;
        const before = currentItem(delivery, session, hostConfiguration);
        const restoredView = currentItem(delivery, restored, hostConfiguration);
        const underHostSeed = htmlOf({ ...before, configuration: hostConfiguration });

        assert.isFalse(Object.hasOwn(before.configuration, "seed"));
        assert.isFalse(Object.hasOwn(restoredView.configuration, "seed"));
        assert.notStrictEqual(underHostSeed, htmlOf(before), "seed 9 presents another order");
        assert.strictEqual(htmlOf(restoredView), htmlOf(before));
      }),
  );

  it.effect("[T-14] gives the same view after encode, a JSON round trip and decode", () =>
    Effect.gen(function* viewRoundTrip() {
      const delivery = yield* guideDelivery();
      const configuration = yield* configure({});
      const session = Result.getOrElse(
        recordStep(
          started(delivery, configuration),
          { intent: { kind: "next" }, responses: { RESPONSE: chosen } },
          after(4200),
        ),
        (failure) => assert.fail(failure.message),
      );
      const restored = throughHost(delivery.test, session);

      assert.deepStrictEqual(restored, session);
      assert.deepStrictEqual(
        current(delivery.test, restored, configuration),
        current(delivery.test, session, configuration),
      );
      assert.deepStrictEqual(currentItem(delivery, restored, configuration).values, {
        RESPONSE: chosen,
      });
    }),
  );

  it.effect("gives the summary once the test is closed, each item with its permits", () =>
    Effect.gen(function* closedSummary() {
      const delivery = yield* guideDelivery();
      const session = started(delivery, yield* configure({}));
      const closed: TestSession = {
        ...session,
        parts: [{ identifier: "testPart-1", status: "ended" }],
        status: "closed",
      };
      const shown = Result.getOrElse(
        current(delivery.test, closed, yield* configure({})),
        (failure) => assert.fail(failure.message),
      );

      assert.deepStrictEqual(shown, {
        items: guideRefs.map(([ref], index) => ({
          numAttempts: 0,
          permits: { review: true, solution: false },
          presented: index === 0,
          ref,
          sequenceIndex: index + 1,
        })),
        kind: "summary",
      });
    }),
  );
});

describe("present", () => {
  it.effect(
    "writes a declared response default at the first presentation only: NULL before, the default after",
    () =>
      Effect.gen(function* defaultsAtPresentation() {
        const choices = ["A", "B", "C"];
        const delivery = yield* builtDelivery("defaults", [
          ["first", itemXml("first", { choices, defaultValue: true, shuffle: false })],
          ["second", itemXml("second", { choices, defaultValue: true, shuffle: false })],
        ]);
        const configuration = yield* configure({});
        const session = started(delivery, configuration);

        assert.deepStrictEqual(currentItem(delivery, session, configuration).values, {
          RESPONSE: choiceB,
        });
        assert.deepStrictEqual(viewAt(delivery, session, configuration, 2).values, {
          RESPONSE: nullChoice,
        });

        const presented = Result.getOrElse(
          present(delivery.items, session, 2, after(1000)),
          (failure) => assert.fail(failure.message),
        );

        assert.deepStrictEqual(viewAt(delivery, presented, configuration, 2).values, {
          RESPONSE: choiceB,
        });
        assert.isTrue(presented.items[1]?.presented);
        assert.strictEqual(presented.items[1]?.datestamp, after(1000).toISOString());
      }),
  );

  it.effect("changes nothing on an item already presented", () =>
    Effect.gen(function* presentedTwice() {
      const delivery = yield* guideDelivery();
      const session = started(delivery, yield* configure({}));

      assert.deepStrictEqual(
        present(delivery.items, session, 1, after(5000)),
        Result.succeed(session),
      );
    }),
  );

  it.effect("refuses a sequence index the session lacks: ItemNotInSession", () =>
    Effect.gen(function* presentOutside() {
      const delivery = yield* guideDelivery();
      const session = started(delivery, yield* configure({}));

      const failure = failureTagged(
        present(delivery.items, session, 7, after(1000)),
        "ItemNotInSession",
      );

      assert.deepStrictEqual([failure.sequenceIndex, failure.count], [7, 6]);
    }),
  );
});

describe("itemView", () => {
  it.effect("[T-4] [T-7] [S-7] gives BGtest.xml's item 3 the instance <instance>.3", () =>
    Effect.gen(function* thirdItem() {
      const delivery = yield* guideDelivery();
      const configuration = yield* configure({});
      const view = viewAt(delivery, started(delivery, configuration), configuration, 3);

      assert.deepStrictEqual(
        [view.ref, view.sequenceIndex, view.instance],
        ["beginnersguide008", 3, `${instance}.3`],
      );
    }),
  );

  it.effect("refuses a sequence index the session lacks: ItemNotInSession", () =>
    Effect.gen(function* viewOutside() {
      const delivery = yield* guideDelivery();
      const configuration = yield* configure({});

      const failure = failureTagged(
        itemView(delivery.test, started(delivery, configuration), configuration, 0),
        "ItemNotInSession",
      );

      assert.deepStrictEqual([failure.sequenceIndex, failure.count], [0, 6]);
    }),
  );
});

describe("permits", () => {
  it.effect(
    "permits nothing on an open item, and review on one whose single attempt was processed",
    () =>
      Effect.gen(function* attemptsClose() {
        const delivery = yield* guideDelivery();
        const configuration = yield* configure({});
        const session = started(delivery, configuration);
        const [first, ...rest] = session.items;
        const attempted: TestSession = {
          ...session,
          items: [
            {
              ...(first ?? assert.fail("the session has no items")),
              record: { ...(first ?? assert.fail("no items")).record, numAttempts: 1 },
            },
            ...rest,
          ],
        };

        assert.deepStrictEqual(
          permits(delivery.test, session, 1),
          Result.succeed({ review: false, solution: false }),
        );
        assert.deepStrictEqual(
          permits(delivery.test, attempted, 1),
          Result.succeed({ review: true, solution: false }),
        );
        assert.isTrue(currentItem(delivery, attempted, configuration).disabled);
      }),
  );
});

describe("recordStep", () => {
  it.effect(
    "saves the step's responses and adds the interval since the last transition, a negative one adding 0",
    () =>
      Effect.gen(function* stepTimes() {
        const delivery = yield* guideDelivery();
        const session = started(delivery, yield* configure({}));
        const saved = Result.getOrElse(
          recordStep(
            session,
            { intent: { kind: "go", sequenceIndex: 1 }, responses: { RESPONSE: chosen } },
            after(12_345),
          ),
          (failure) => assert.fail(failure.message),
        );
        const earlier = Result.getOrElse(
          recordStep(saved, { intent: { kind: "next" } }, after(2000)),
          (failure) => assert.fail(failure.message),
        );

        assert.deepStrictEqual(
          [saved.items[0]?.duration, saved.items[0]?.saved, saved.updated],
          [12.3, Option.some({ RESPONSE: chosen }), after(12_345).toISOString()],
        );
        assert.strictEqual(saved.items[0]?.datestamp, after(12_345).toISOString());
        assert.deepStrictEqual(
          [earlier.items[0]?.duration, earlier.items[0]?.saved, earlier.updated],
          [12.3, Option.some({ RESPONSE: chosen }), after(2000).toISOString()],
        );
        assert.deepStrictEqual(saved.items.slice(1), session.items.slice(1));
      }),
  );
});

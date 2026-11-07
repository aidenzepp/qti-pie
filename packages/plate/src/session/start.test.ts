import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { decodeSession, encodeSession } from "#plate/codec/session.ts";
import { configure } from "#plate/configuration.ts";
import type { Configuration } from "#plate/configuration.ts";
import { readCorpusFile } from "#plate/document/corpus.ts";
import { firstAttempt } from "#plate/engine/attempt.ts";
import type { ItemRecord } from "#plate/model/record.ts";
import { nullOf } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";
import { openPackage } from "#plate/package/open.ts";
import { manifestFile } from "#plate/package/store.ts";
import { redact, render } from "#plate/render.ts";
import { advance } from "#plate/session/advance.ts";
import type { TestSession } from "#plate/session/session.ts";
import {
  current,
  itemView,
  itemViews,
  permits,
  present,
  recordStep,
  startTest,
} from "#plate/session/start.ts";
import type { Current, ItemView } from "#plate/session/start.ts";
import { open } from "#plate/validate/open.ts";
import { float, integer } from "#plate/test/fixtures.ts";
import { acceptedItem, acceptForTest } from "#plate/validate/verdict.ts";
import type { Accepted, AcceptedTest } from "#plate/validate/verdict.ts";
import { manifestNamespace } from "#plate/vocabulary.ts";

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
 * The default the hand-built templated item's template processing sets for `RESPONSE`: the choice
 * `C`.
 */
const choiceC: Value = {
  baseType: "identifier",
  cardinality: "single",
  values: [{ baseType: "identifier", value: "C" }],
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
 * Write the text of a hand-built templated item: one Choice over `A`, `B` and `C` bound to the
 * single identifier `RESPONSE`, which declares the default `B`, and template processing that draws
 * the single integer template variable `T` from 1 to 10^9 and sets `RESPONSE`'s default to `C`.
 *
 * @param identifier The item's identifier.
 * @returns The item's text.
 */
const templatedXml = (identifier: string): string =>
  [
    `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="${identifier}" title="${identifier}" adaptive="false" time-dependent="false">`,
    '<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">',
    "<qti-default-value><qti-value>B</qti-value></qti-default-value></qti-response-declaration>",
    '<qti-template-declaration identifier="T" cardinality="single" base-type="integer"/>',
    "<qti-template-processing>",
    '<qti-set-template-value identifier="T"><qti-random-integer min="1" max="1000000000"/></qti-set-template-value>',
    '<qti-set-default-value identifier="RESPONSE"><qti-base-value base-type="identifier">C</qti-base-value></qti-set-default-value>',
    '</qti-template-processing><qti-item-body><qti-choice-interaction response-identifier="RESPONSE" shuffle="false">',
    ...["A", "B", "C"].map(
      (choice) => `<qti-simple-choice identifier="${choice}">Choice ${choice}</qti-simple-choice>`,
    ),
    "</qti-choice-interaction></qti-item-body></qti-assessment-item>",
  ].join("");

/**
 * Write the text of a hand-built item whose template processing reads `QTI_CONTEXT`, which the
 * engine does not hold while template processing runs, so `check` marks it and it does not run:
 * one Choice over `A`, `B` and `C` bound to the single identifier `RESPONSE`, which declares the
 * default `B`, and the single boolean template variable `B`, which the one rule sets to whether
 * `QTI_CONTEXT` is NULL.
 *
 * @param identifier The item's identifier.
 * @returns The item's text.
 */
const contextReadingXml = (identifier: string): string =>
  [
    `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="${identifier}" title="${identifier}" adaptive="false" time-dependent="false">`,
    '<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">',
    "<qti-default-value><qti-value>B</qti-value></qti-default-value></qti-response-declaration>",
    '<qti-template-declaration identifier="B" cardinality="single" base-type="boolean"/>',
    '<qti-template-processing><qti-set-template-value identifier="B">',
    '<qti-is-null><qti-variable identifier="QTI_CONTEXT"/></qti-is-null>',
    "</qti-set-template-value></qti-template-processing>",
    '<qti-item-body><qti-choice-interaction response-identifier="RESPONSE" shuffle="false">',
    ...["A", "B", "C"].map(
      (choice) => `<qti-simple-choice identifier="${choice}">Choice ${choice}</qti-simple-choice>`,
    ),
    "</qti-choice-interaction></qti-item-body></qti-assessment-item>",
  ].join("");

/**
 * Write the text of a hand-built test: its outcome declarations, then one nonlinear, individual
 * part with one section that holds each item ref.
 *
 * @param identifier The test's identifier.
 * @param refs Each item ref's identifier with its `href`, in document order.
 * @param declarations The test's outcome declarations' text, in document order, none by default.
 * @returns The test's text.
 */
const testXml = (
  identifier: string,
  refs: readonly (readonly [string, string])[],
  declarations: readonly string[] = [],
): string =>
  [
    `<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="${identifier}" title="${identifier}">`,
    ...declarations,
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
 * @param declarations The test's outcome declarations' text, none by default.
 * @returns The test and its items.
 */
const builtDelivery = Effect.fnUntraced(function* builtDelivery(
  identifier: string,
  items: readonly (readonly [string, string])[],
  declarations: readonly string[] = [],
) {
  const encoder = new TextEncoder();
  const test = yield* openTest(
    `tests/${identifier}.xml`,
    encoder.encode(
      testXml(
        identifier,
        items.map(([ref]) => [ref, `${ref}.xml`] as const),
        declarations,
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
 * Where a hand-built package sits and how it names its files: the package's location, the real
 * name of the directory that holds its test and its item and the item's real file name, and both
 * as the manifest's and the test's `href` values write them.
 */
interface PackagePlace {
  readonly directory: string;
  readonly directoryHref: string;
  readonly item: string;
  readonly itemHref: string;
  readonly location: string;
}

/**
 * Open a hand-built package, a test at `<directory>/test.xml` whose one item ref `first` names an
 * item at `<directory>/items/<item>`, and start a session of its test with the items
 * `openPackage` resolved for it, as a host does.
 *
 * @param place Where the package sits and how it names its files.
 * @returns What `startTest` returned.
 */
const startedFromPackage = Effect.fnUntraced(function* startedFromPackage(place: PackagePlace) {
  const encoder = new TextEncoder();
  const testHref = `${place.directoryHref}/test.xml`;
  const itemHref = `${place.directoryHref}/items/${place.itemHref}`;
  const manifest = [
    `<manifest xmlns="${manifestNamespace}" identifier="M"><metadata><schema>QTI Package</schema>`,
    "<schemaversion>3.0.0</schemaversion></metadata><organizations/><resources>",
    `<resource identifier="T" type="imsqti_test_xmlv3p0" href="${testHref}"><file href="${testHref}"/></resource>`,
    `<resource identifier="I" type="imsqti_item_xmlv3p0" href="${itemHref}"><file href="${itemHref}"/></resource>`,
    "</resources></manifest>",
  ].join("");
  const texts: readonly (readonly [path: string, text: string])[] = [
    [manifestFile, manifest],
    [`${place.directory}/test.xml`, testXml("hrefs", [["first", `items/${place.itemHref}`]])],
    [
      `${place.directory}/items/${place.item}`,
      itemXml("first", { choices: ["A", "B"], defaultValue: false, shuffle: false }),
    ],
  ];
  const files = new Map(texts.map(([path, text]) => [path, encoder.encode(text)] as const));
  const verdict = yield* openPackage(place.location, files);
  if (verdict.verdict !== "accepted" && verdict.verdict !== "accepted-with-unsupported") {
    return assert.fail(`the package at ${place.location} is ${verdict.verdict}`);
  }

  const [delivery] = verdict.accepted.tests.values();
  if (delivery === undefined) {
    return assert.fail(`the package at ${place.location} holds no test`);
  }

  return startTest(delivery.test, delivery.items, yield* configure({}), {
    instance,
    now: startedAt,
  });
});

/**
 * Start a session of a delivery, failing the test when `startTest` refuses.
 *
 * @param delivery The test and its items.
 * @param configuration The host's configuration.
 * @param seed The processing seed the context gives; with none, `startTest` draws one.
 * @returns The session.
 */
const started = (delivery: Delivery, configuration: Configuration, seed?: string): TestSession =>
  Result.getOrElse(
    startTest(
      delivery.test,
      delivery.items,
      configuration,
      seed === undefined ? { instance, now: startedAt } : { instance, now: startedAt, seed },
    ),
    (failure) => assert.fail(`startTest refused: ${failure.message}`),
  );

/**
 * Open the one-item hand-built test whose item `shuffled` is a shuffled Choice over `A` to `D`.
 *
 * @returns The test and its item.
 */
const shuffledDelivery = () =>
  builtDelivery("shuffle", [
    [
      "shuffled",
      itemXml("shuffled", { choices: ["A", "B", "C", "D"], defaultValue: false, shuffle: true }),
    ],
  ]);

/**
 * Render the item a view shows under the view's configuration, failing the test when `render`
 * refuses.
 *
 * @param delivery The test and its items.
 * @param view The view.
 * @param configuration The configuration to render under, the view's when absent.
 * @returns The HTML.
 */
const viewHtml = (
  delivery: Delivery,
  view: ItemView,
  configuration: Configuration = view.configuration,
): string =>
  Result.getOrElse(
    render(
      redact(
        delivery.items.get(view.ref) ?? assert.fail(`the delivery has no item ${view.ref}`),
        view.record,
        configuration,
      ),
      configuration,
      { disabled: view.disabled, instance: view.instance, values: view.values },
    ),
    (failure) => assert.fail(failure.message),
  ).html;

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
 * Give the record `firstAttempt` starts for one of a delivery's items, failing the test when it
 * fails.
 *
 * @param delivery The test and its items.
 * @param ref The item ref's identifier.
 * @param start The item's instance and the seed, as `firstAttempt` takes them.
 * @param start.instance The item's instance.
 * @param start.seed The seed.
 * @returns The record.
 */
const startedRecord = (
  delivery: Delivery,
  ref: string,
  start: { readonly instance: string; readonly seed: string },
): ItemRecord =>
  Result.getOrElse(
    firstAttempt(
      (delivery.items.get(ref) ?? assert.fail(`the delivery has no item ${ref}`)).item,
      start,
    ),
    (failure) => assert.fail(`firstAttempt failed: ${failure._tag}`),
  );

/**
 * Open the two-item hand-built test whose items `first` and `second` are each
 * {@link templatedXml}'s.
 *
 * @returns The test and its items.
 */
const templatedDelivery = () =>
  builtDelivery("templated", [
    ["first", templatedXml("first")],
    ["second", templatedXml("second")],
  ]);

/**
 * Give the record of a session's first item.
 *
 * @param session The session.
 * @returns The record.
 */
const recordUnder = (session: TestSession): ItemRecord =>
  session.items[0]?.record ?? assert.fail("the session has no items");

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
    { tags: ["corpus"] },
  );

  it.effect(
    "refuses items with no entry for an item ref: item-missing",
    () =>
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
    { tags: ["corpus"] },
  );

  it.effect(
    "refuses an item from another document than its ref names: item-mismatch",
    () =>
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
    { tags: ["corpus"] },
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

  it.effect(
    "starts every test openPackage accepted: a location holding %41 or ./, a directory named d%41 or d#1, and a URL location naming its item a%20b.xml",
    () =>
      Effect.gen(function* packagedHrefs() {
        const plain: PackagePlace = {
          directory: "d",
          directoryHref: "d",
          item: "first.xml",
          itemHref: "first.xml",
          location: "pkgs/m2",
        };
        const places: readonly (readonly [string, PackagePlace])[] = [
          ["control", plain],
          [
            "control: a directory named dA, written d%41",
            { ...plain, directory: "dA", directoryHref: "d%41" },
          ],
          ["a location holding %41", { ...plain, location: "pkgs/m%41" }],
          ["a location holding ./", { ...plain, location: "./pkgs/m2" }],
          ["a directory named d%41", { ...plain, directory: "d%41", directoryHref: "d%2541" }],
          ["a directory named d#1", { ...plain, directory: "d#1", directoryHref: "d%231" }],
          [
            "a URL location naming its item a%20b.xml",
            {
              ...plain,
              item: "a b.xml",
              itemHref: "a%20b.xml",
              location: "https://example.org/pkgs/m2",
            },
          ],
        ];

        const outcomes = yield* Effect.all(
          places.map(([label, place]) =>
            Effect.map(startedFromPackage(place), (outcome) => [
              label,
              Result.match(outcome, {
                onFailure: (failure) =>
                  failure._tag === "TestNotDeliverable"
                    ? `${failure.reason}: expected ${failure.expected}`
                    : failure._tag,
                onSuccess: () => "started",
              }),
            ]),
          ),
        );

        assert.deepStrictEqual(
          outcomes,
          places.map(([label]) => [label, "started"]),
        );
      }),
  );

  it.effect(
    "refuses a session instance checkInstance refuses, and an invalid now",
    () =>
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
    { tags: ["corpus"] },
  );

  it.effect(
    "[T-1] starts each test outcome at its declared default, else its starting value, with no outcome processing run and no item's template defaults",
    () =>
      Effect.gen(function* startsOutcomes() {
        const delivery = yield* builtDelivery(
          "outcomes",
          [
            [
              "first",
              itemXml("first", { choices: ["A", "B"], defaultValue: false, shuffle: false }),
            ],
            [
              "second",
              itemXml("second", { choices: ["A", "B"], defaultValue: false, shuffle: false }),
            ],
          ],
          [
            '<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">',
            "<qti-default-value><qti-value>2.5</qti-value></qti-default-value>",
            "</qti-outcome-declaration>",
            '<qti-outcome-declaration identifier="COUNT" cardinality="single" base-type="integer">',
            "<qti-default-value><qti-value>9007199254740993</qti-value></qti-default-value>",
            "</qti-outcome-declaration>",
            '<qti-outcome-declaration identifier="TOTAL" cardinality="single" base-type="integer"/>',
            '<qti-outcome-declaration identifier="MEAN" cardinality="single" base-type="float"/>',
            '<qti-outcome-declaration identifier="GRADE" cardinality="single" base-type="identifier"/>',
          ],
        );
        const session = started(delivery, yield* configure({}));

        assert.deepStrictEqual(session.outcomes, {
          COUNT: integer(2n ** 53n + 1n),
          GRADE: nullOf("identifier", "single"),
          MEAN: float(0),
          SCORE: float(2.5),
          TOTAL: integer(0n),
        });
        assert.strictEqual(session.outcomeRuns, 0);
        assert.deepStrictEqual(
          session.items.map((item) => item.templateDefaults),
          [Option.none(), Option.none()],
        );
        assert.deepStrictEqual(throughHost(delivery.test, session), session);
      }),
  );

  it.effect(
    "[T-1] keeps the configuration's seed as the shuffle seed, none when it has none, and a session stored at version 3 keeps either",
    () =>
      Effect.gen(function* keepsShuffleSeed() {
        const delivery = yield* builtDelivery("shuffled", [
          [
            "first",
            itemXml("first", { choices: ["A", "B", "C"], defaultValue: false, shuffle: true }),
          ],
        ]);
        const seeded = started(delivery, yield* configure({ seed: "7" }));
        const unseeded = started(delivery, yield* configure({}));

        assert.deepStrictEqual(
          [seeded.shuffleSeed, unseeded.shuffleSeed],
          [Option.some("7"), Option.none()],
        );
        assert.deepStrictEqual(throughHost(delivery.test, seeded), seeded);
        assert.deepStrictEqual(throughHost(delivery.test, unseeded), unseeded);
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
    { tags: ["corpus"] },
  );

  it.effect(
    "renders with the shuffle seed the session started with, not the host's, and never with its processing seed",
    () =>
      Effect.gen(function* storedSeed() {
        const delivery = yield* guideDelivery();
        const session = started(delivery, yield* configure({ seed: "7" }), "11");

        assert.deepStrictEqual([session.seed, session.shuffleSeed], ["11", Option.some("7")]);
        assert.strictEqual(
          currentItem(delivery, session, yield* configure({ seed: "9" })).configuration.seed,
          "7",
        );
      }),
    { tags: ["corpus"] },
  );

  it.effect(
    "[T-14] renders a shuffled Choice byte-equal after a JSON round trip, in the order of the shuffle seed the session stored, whatever seed the host passes",
    () =>
      Effect.gen(function* storedSeedRoundTrip() {
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
        const hostConfiguration = yield* configure({ seed: "9" });
        const session = started(delivery, yield* configure({ seed: "7" }));
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

        assert.strictEqual(before.configuration.seed, "7");
        assert.strictEqual(restoredView.configuration.seed, "7");
        assert.notStrictEqual(underHostSeed, htmlOf(before), 'seed "9" presents another order');
        assert.strictEqual(htmlOf(restoredView), htmlOf(before));
      }),
  );

  it.effect(
    "[T-14] gives the same view after encode, a JSON round trip and decode",
    () =>
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
    { tags: ["corpus"] },
  );

  it.effect(
    "gives the summary once the test is closed, each item with its permits",
    () =>
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
    { tags: ["corpus"] },
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

  it.effect(
    "changes nothing on an item already presented",
    () =>
      Effect.gen(function* presentedTwice() {
        const delivery = yield* guideDelivery();
        const session = started(delivery, yield* configure({}));

        assert.deepStrictEqual(
          present(delivery.items, session, 1, after(5000)),
          Result.succeed(session),
        );
      }),
    { tags: ["corpus"] },
  );

  it.effect(
    "refuses a sequence index the session lacks: ItemNotInSession",
    () =>
      Effect.gen(function* presentOutside() {
        const delivery = yield* guideDelivery();
        const session = started(delivery, yield* configure({}));

        const failure = failureTagged(
          present(delivery.items, session, 7, after(1000)),
          "ItemNotInSession",
        );

        assert.deepStrictEqual([failure.sequenceIndex, failure.count], [7, 6]);
      }),
    { tags: ["corpus"] },
  );
});

describe("a templated item in a session", () => {
  it.effect(
    "[I-5] presents each item with the record firstAttempt starts under the session's processing seed and the item's instance, the template-set default first",
    () =>
      Effect.gen(function* presentsTemplated() {
        const delivery = yield* templatedDelivery();
        const configuration = yield* configure({ seed: "7" });
        const session = started(delivery, configuration, "11");
        const first = startedRecord(delivery, "first", { instance: `${instance}.1`, seed: "11" });

        assert.deepStrictEqual(session.items[0]?.record, first);
        assert.deepStrictEqual(Object.keys(first.templates), ["T"]);
        assert.strictEqual(first.templates["T"]?.baseType, "integer");
        assert.deepStrictEqual(first.responses, { RESPONSE: choiceC });
        assert.deepStrictEqual(currentItem(delivery, session, configuration).values, {
          RESPONSE: choiceC,
        });
        assert.deepStrictEqual(session.items[1]?.record.templates, {});

        const presented = Result.getOrElse(
          present(delivery.items, session, 2, after(1000)),
          (failure) => assert.fail(failure.message),
        );

        assert.deepStrictEqual(
          presented.items[1]?.record,
          startedRecord(delivery, "second", { instance: `${instance}.2`, seed: "11" }),
        );
        assert.deepStrictEqual(presented.items[0], session.items[0]);
      }),
  );

  it.effect(
    "[I-5] gives two sessions started with two processing seeds under one configuration seed two template values",
    () =>
      Effect.gen(function* seedsDiffer() {
        const delivery = yield* templatedDelivery();
        const configuration = yield* configure({ seed: "7" });
        const eleven = recordUnder(started(delivery, configuration, "11"));
        const twelve = recordUnder(started(delivery, configuration, "12"));

        assert.notDeepEqual(eleven.templates["T"], twelve.templates["T"]);
        assert.deepStrictEqual([eleven.seed, twelve.seed], ["11", "12"]);
      }),
  );

  it.effect(
    "[I-5] draws a processing seed of 32 lowercase hex digits for a session started with no seed, another each session, which every presented item's record carries and the item configuration does not",
    () =>
      Effect.gen(function* drawsSessionSeed() {
        const delivery = yield* templatedDelivery();
        const configuration = yield* configure({});
        const session = started(delivery, configuration);
        const other = started(delivery, configuration);
        const presented = Result.getOrElse(
          present(delivery.items, session, 2, after(1000)),
          (failure) => assert.fail(failure.message),
        );

        assert.match(session.seed, /^[0-9a-f]{32}$/u);
        assert.match(other.seed, /^[0-9a-f]{32}$/u);
        assert.notStrictEqual(other.seed, session.seed);
        assert.deepStrictEqual(
          presented.items.map((item) => item.record.seed),
          [session.seed, session.seed],
        );
        assert.deepStrictEqual(
          recordUnder(session),
          startedRecord(delivery, "first", { instance: `${instance}.1`, seed: session.seed }),
        );
        assert.isFalse(
          Object.hasOwn(currentItem(delivery, session, configuration).configuration, "seed"),
        );
      }),
  );

  it.effect("[I-5] gives each view the record of the item it shows", () =>
    Effect.gen(function* viewsCarryRecords() {
      const delivery = yield* templatedDelivery();
      const configuration = yield* configure({ seed: "11" });
      const session = Result.getOrElse(
        present(delivery.items, started(delivery, configuration), 2, after(1000)),
        (failure) => assert.fail(failure.message),
      );

      assert.deepStrictEqual(
        currentItem(delivery, session, configuration).record,
        session.items[0]?.record,
      );
      assert.deepStrictEqual(
        [1, 2].map(
          (sequenceIndex) => viewAt(delivery, session, configuration, sequenceIndex).record,
        ),
        session.items.map((item) => item.record),
      );
    }),
  );

  it.effect(
    "[I-5] [T-14] shows a templated session's record and values the same after encode, a JSON round trip and decode",
    () =>
      Effect.gen(function* templatedRoundTrip() {
        const delivery = yield* templatedDelivery();
        const configuration = yield* configure({ seed: "11" });
        const session = started(delivery, configuration);
        const restored = throughHost(delivery.test, session);
        const shown = currentItem(delivery, session, configuration);
        const restoredView = currentItem(delivery, restored, configuration);

        assert.deepStrictEqual(restored, session);
        assert.deepStrictEqual(restoredView.record, shown.record);
        assert.deepStrictEqual(restoredView.record.templates, shown.record.templates);
        assert.deepStrictEqual(restoredView.values, { RESPONSE: choiceC });
      }),
  );

  it.effect(
    "[I-5] starts a test whose item's template processing reads QTI_CONTEXT, marked, and presents that item with a record that holds no template value",
    () =>
      Effect.gen(function* startsMarked() {
        const delivery = yield* builtDelivery("marked", [["first", contextReadingXml("first")]]);
        const configuration = yield* configure({ seed: "11" });
        const returned = Result.getOrElse(
          Result.try(() =>
            startTest(delivery.test, delivery.items, configuration, {
              instance,
              now: startedAt,
            }),
          ),
          () => assert.fail("startTest threw"),
        );
        const session = Result.getOrElse(returned, (failure) =>
          assert.fail(`startTest refused: ${failure.message}`),
        );
        const record = recordUnder(session);

        assert.deepStrictEqual(
          delivery.items.get("first")?.item.templateProcessing,
          Option.none(),
          "the item's template processing is marked",
        );
        assert.deepStrictEqual([record.templates, record.correct, record.defaults], [{}, {}, {}]);
        assert.deepStrictEqual(record.responses, { RESPONSE: choiceB });
        assert.deepStrictEqual(currentItem(delivery, session, configuration).record, record);
      }),
  );

  it.effect(
    "[I-5] throws a tagged defect, and returns no session, when firstAttempt fails on an item no check accepted",
    () =>
      Effect.gen(function* unreachableFailure() {
        const delivery = yield* builtDelivery("unchecked", [["first", templatedXml("first")]]);
        const accepted = delivery.items.get("first") ?? assert.fail("the item is missing");
        const rules = Option.getOrElse(accepted.item.templateProcessing, () =>
          assert.fail("the item's template processing does not run"),
        );
        const misnamed = acceptForTest({
          ...accepted.item,
          templateProcessing: Option.some(
            rules.map((rule) =>
              rule.kind === "set-template-value" ? { ...rule, identifier: "UNDECLARED" } : rule,
            ),
          ),
        });
        const configuration = yield* configure({});

        const thrown = Option.getOrElse(
          Result.getFailure(
            Result.try(() =>
              startTest(delivery.test, new Map([["first", misnamed]]), configuration, {
                instance,
                now: startedAt,
              }),
            ),
          ),
          () => assert.fail("startTest returned instead of throwing"),
        );

        assert.propertyVal(thrown, "_tag", "FirstAttemptDefect");
      }),
  );
});

describe("the processing seed (SR-1)", () => {
  it.effect(
    "[I-5] keys every item's processing by the processing seed the host gives in startTest's context, and the view's configuration carries the shuffle seed, never it",
    () =>
      Effect.gen(function* givenProcessingSeed() {
        const delivery = yield* templatedDelivery();
        const configuration = yield* configure({ seed: "7" });
        const session = started(delivery, configuration, "processing-11");
        const presented = Result.getOrElse(
          present(delivery.items, session, 2, after(1000)),
          (failure) => assert.fail(failure.message),
        );
        const view = currentItem(delivery, session, configuration);

        assert.strictEqual(session.seed, "processing-11");
        assert.deepStrictEqual(session.shuffleSeed, Option.some("7"));
        assert.deepStrictEqual(
          presented.items.map((item) => item.record),
          [1, 2].map((sequenceIndex) =>
            startedRecord(delivery, sequenceIndex === 1 ? "first" : "second", {
              instance: `${instance}.${String(sequenceIndex)}`,
              seed: "processing-11",
            }),
          ),
        );
        assert.strictEqual(view.configuration.seed, "7");
        assert.notStrictEqual(view.configuration.seed, view.record.seed);
      }),
  );

  it.effect(
    "[I-5] draws the processing seed when the context gives none, never the configuration's seed, and the view's configuration carries only the shuffle seed",
    () =>
      Effect.gen(function* drawnProcessingSeed() {
        const delivery = yield* templatedDelivery();
        const configuration = yield* configure({ seed: "7" });
        const session = started(delivery, configuration);
        const view = currentItem(delivery, session, configuration);

        assert.match(session.seed, /^[0-9a-f]{32}$/u);
        assert.deepStrictEqual(session.shuffleSeed, Option.some("7"));
        assert.deepStrictEqual(
          view.record,
          startedRecord(delivery, "first", { instance: `${instance}.1`, seed: session.seed }),
        );
        assert.strictEqual(view.configuration.seed, "7");
        assert.notStrictEqual(view.configuration.seed, view.record.seed);
      }),
  );

  it.effect(
    "orders a shuffle by the configuration's seed only, whatever the processing seed: two processing seeds present one order, two configuration seeds two",
    () =>
      Effect.gen(function* shuffleSeedOnly() {
        const delivery = yield* shuffledDelivery();
        const seven = yield* configure({ seed: "7" });
        const nine = yield* configure({ seed: "9" });
        const htmlUnder = (configuration: Configuration, seed: string): string =>
          viewHtml(
            delivery,
            currentItem(delivery, started(delivery, configuration, seed), configuration),
          );

        assert.strictEqual(htmlUnder(seven, "processing-a"), htmlUnder(seven, "processing-b"));
        assert.notStrictEqual(htmlUnder(seven, "processing-a"), htmlUnder(nine, "processing-a"));
      }),
  );

  it.effect(
    "with no configuration seed, gives a view with no seed, so a shuffle follows the instance alone, whatever the processing seed",
    () =>
      Effect.gen(function* unseededShuffle() {
        const delivery = yield* shuffledDelivery();
        const configuration = yield* configure({});
        const session = started(delivery, configuration, "processing-11");
        const view = currentItem(delivery, session, configuration);

        assert.deepStrictEqual(session.shuffleSeed, Option.none());
        assert.isFalse(Object.hasOwn(view.configuration, "seed"));
        assert.strictEqual(
          viewHtml(delivery, view),
          viewHtml(delivery, view, { ...view.configuration, seed: "" }),
        );
        assert.notStrictEqual(
          viewHtml(delivery, view),
          viewHtml(delivery, view, { ...view.configuration, seed: session.seed }),
        );
      }),
  );

  it.effect("[T-14] round-trips a stored session's processing seed and its shuffle seed", () =>
    Effect.gen(function* storedSeeds() {
      const delivery = yield* shuffledDelivery();
      const seeded = started(delivery, yield* configure({ seed: "7" }), "processing-11");
      const unseeded = started(delivery, yield* configure({}), "processing-12");
      const stored = Result.getOrElse(encodeSession(seeded), (failure) =>
        assert.fail(failure.message),
      );

      assert.deepStrictEqual([stored.seed, stored.shuffleSeed], ["processing-11", "7"]);
      assert.deepStrictEqual(throughHost(delivery.test, seeded), seeded);
      assert.deepStrictEqual(throughHost(delivery.test, unseeded), unseeded);
    }),
  );

  it.effect(
    "gives a session started with no configured seed, viewed under a configuration that holds one, a view with no seed and the order the instance alone gives, never the processing seed's",
    () =>
      Effect.gen(function* viewedUnderHostSeed() {
        const delivery = yield* shuffledDelivery();
        const unseeded = yield* configure({});
        const host = yield* configure({ seed: "9" });
        const session = started(delivery, unseeded, "processing-11");
        const view = currentItem(delivery, session, host);

        assert.isFalse(Object.hasOwn(view.configuration, "seed"));
        assert.strictEqual(
          viewHtml(delivery, view),
          viewHtml(delivery, view, { ...view.configuration, seed: "" }),
        );
        assert.notStrictEqual(
          viewHtml(delivery, view),
          viewHtml(delivery, view, { ...view.configuration, seed: "9" }),
        );
      }),
  );

  it.effect(
    "gives a session started with a configured seed, viewed under another, its shuffle seed, never the processing seed",
    () =>
      Effect.gen(function* viewedUnderOtherSeed() {
        const delivery = yield* shuffledDelivery();
        const session = started(delivery, yield* configure({ seed: "7" }), "processing-11");
        const view = currentItem(delivery, session, yield* configure({ seed: "9" }));

        assert.strictEqual(view.configuration.seed, "7");
      }),
  );
});

describe("a test whose SCORE and MAXSCORE are not floats", () => {
  it.effect(
    "[I-9a] opens a test declaring a string SCORE with a default and a point MAXSCORE, which the information model types in an item only, and starts it, shows its item and submits it",
    () =>
      Effect.gen(function* untypedScores() {
        const delivery = yield* builtDelivery(
          "untyped",
          [
            [
              "first",
              itemXml("first", { choices: ["A", "B"], defaultValue: false, shuffle: false }),
            ],
          ],
          [
            '<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="string">',
            "<qti-default-value><qti-value>high</qti-value></qti-default-value>",
            "</qti-outcome-declaration>",
            '<qti-outcome-declaration identifier="MAXSCORE" cardinality="single" base-type="point"/>',
          ],
        );
        assert.deepStrictEqual(delivery.test.unsupported, []);
        assert.deepStrictEqual(
          [...delivery.test.test.outcomes.values()].map((outcome) => [
            outcome.identifier,
            outcome.baseType,
          ]),
          [
            ["SCORE", "string"],
            ["MAXSCORE", "point"],
          ],
        );

        const configuration = yield* configure({});
        const session = started(delivery, configuration);
        assert.strictEqual(viewAt(delivery, session, configuration, 1).sequenceIndex, 1);

        const submitted = Result.getOrElse(
          advance(
            delivery.test,
            delivery.items,
            session,
            { intent: { kind: "submit-item" }, responses: { RESPONSE: choiceB } },
            configuration,
            { now: after(1) },
          ),
          (failure) => assert.fail(`advance refused: ${failure.message}`),
        );
        const [first] = submitted.items;
        assert.strictEqual(first?.record.numAttempts, 1);
        assert.deepStrictEqual(first?.record.responses["RESPONSE"], choiceB);
      }),
  );
});

describe("itemView", { tags: ["corpus"] }, () => {
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

describe("itemViews", { tags: ["corpus"] }, () => {
  it.effect("gives each item's view as itemView does, in the order asked", () =>
    Effect.gen(function* everyView() {
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
      const order = [6, 1, 3, 2, 5, 4];

      assert.deepStrictEqual(
        itemViews(delivery.test, attempted, configuration, order),
        Result.succeed(
          order.map((sequenceIndex) => viewAt(delivery, attempted, configuration, sequenceIndex)),
        ),
      );
    }),
  );

  it.effect("refuses the first sequence index the session lacks: ItemNotInSession", () =>
    Effect.gen(function* viewsOutside() {
      const delivery = yield* guideDelivery();
      const configuration = yield* configure({});

      const failure = failureTagged(
        itemViews(delivery.test, started(delivery, configuration), configuration, [2, 7, 0]),
        "ItemNotInSession",
      );

      assert.deepStrictEqual([failure.sequenceIndex, failure.count], [7, 6]);
    }),
  );
});

describe("permits", { tags: ["corpus"] }, () => {
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

describe("recordStep", { tags: ["corpus"] }, () => {
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

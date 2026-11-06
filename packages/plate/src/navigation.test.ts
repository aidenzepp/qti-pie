import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { configure } from "#plate/configuration.ts";
import type { Configuration } from "#plate/configuration.ts";
import { readCorpusFile } from "#plate/document/corpus.ts";
import { h } from "#plate/emit/node.ts";
import type { Attributes, Element, Node } from "#plate/emit/node.ts";
import { rowFor } from "#plate/emit/parts.ts";
import type { PartOf } from "#plate/emit/parts.ts";
import { encodeIntent } from "#plate/form/intent.ts";
import { message, numeral } from "#plate/messages.ts";
import type { Value } from "#plate/model/values.ts";
import { navigationState, PartlessTestDefect, renderNavigation } from "#plate/navigation.ts";
import type { NavigationOptions, NavigationState } from "#plate/navigation.ts";
import { advance } from "#plate/session/advance.ts";
import { allowedIntents } from "#plate/session/intents.ts";
import type { Step, TestSession } from "#plate/session/session.ts";
import { startTest } from "#plate/session/start.ts";
import { checkAllowlist, sourceModules, valueClosure } from "#plate/test/imports.ts";
import { parseHtml } from "#plate/test/round-trip.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem, acceptTestForTest } from "#plate/validate/verdict.ts";
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
 * The folder of the CASE package's test and items under the corpus root.
 */
const caseFolder = "qtiv3-examples/packaging/CASE/testitems";

/**
 * The CASE test's three item refs in document order, each with its `href`.
 */
const caseRefs = [
  ["res_-TX_G06SAMP_001", "-TX_G06SAMP_001.xml"],
  ["res_-TX_G06SAMP_004", "-TX_G06SAMP_004.xml"],
  ["res_-TX_G06SAMP_005", "-TX_G06SAMP_005.xml"],
] as const;

/**
 * The time every test starts its session at.
 */
const startedAt = new Date("2026-11-05T10:00:00.000Z");

/**
 * Give a time some seconds after {@link startedAt}.
 *
 * @param seconds The offset.
 * @returns The time.
 */
const after = (seconds: number): Date => new Date(startedAt.getTime() + seconds * 1000);

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
 * Open a test and its items from the corpus cache, each item keyed by its ref.
 *
 * @param folder The folder of the test and its items under the corpus root.
 * @param testHref The test's location in the folder.
 * @param refs Each item ref with its `href` in the folder.
 * @returns The test and its items.
 */
const corpusDelivery = Effect.fnUntraced(function* corpusDelivery(
  folder: string,
  testHref: string,
  refs: readonly (readonly [string, string])[],
) {
  const testLocation = `${folder}/${testHref}`;
  const test = yield* openTest(testLocation, yield* readCorpusFile(testLocation));
  const items = new Map<string, Accepted>();
  for (const [ref, href] of refs) {
    const location = `${folder}/${href}`;
    items.set(ref, yield* openItem(location, yield* readCorpusFile(location)));
  }

  return { items, test } satisfies Delivery;
});

/**
 * Write the text of a hand-built Choice item: `RESPONSE`, a single identifier whose correct
 * response is `A`.
 *
 * @param identifier The item's identifier.
 * @returns The item's text.
 */
const choiceItemXml = (identifier: string): string =>
  [
    `<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="${identifier}" title="${identifier}" adaptive="false" time-dependent="false">`,
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
 * Open a hand-built test of a linear, individual part holding the items `i1` and `i2`, then a
 * nonlinear, simultaneous part whose one section holds only a section ref, which the test marks
 * and does not deliver, so that part delivers no item. The test is at `tests/<identifier>.xml` and
 * each item beside it.
 *
 * @param identifier The test's identifier.
 * @returns The test and its items.
 */
const sectionRefDelivery = Effect.fnUntraced(function* sectionRefDelivery(identifier: string) {
  const encoder = new TextEncoder();
  const text = [
    `<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="${identifier}" title="${identifier}">`,
    '<qti-test-part identifier="P1" navigation-mode="linear" submission-mode="individual">',
    '<qti-assessment-section identifier="S1" title="Section" visible="true">',
    ...["i1", "i2"].map(
      (ref) => `<qti-assessment-item-ref identifier="${ref}" href="${ref}.xml"/>`,
    ),
    "</qti-assessment-section></qti-test-part>",
    '<qti-test-part identifier="P2" navigation-mode="nonlinear" submission-mode="simultaneous">',
    '<qti-assessment-section identifier="S2" title="Section" visible="true">',
    '<qti-assessment-section-ref identifier="elsewhere" href="elsewhere.xml"/>',
    "</qti-assessment-section></qti-test-part>",
    "</qti-assessment-test>",
  ].join("");
  const test = yield* openTest(`tests/${identifier}.xml`, encoder.encode(text));
  const items = new Map<string, Accepted>();
  for (const ref of ["i1", "i2"]) {
    items.set(ref, yield* openItem(`tests/${ref}.xml`, encoder.encode(choiceItemXml(ref))));
  }

  return { items, test } satisfies Delivery;
});

/**
 * Start a session of a delivery and take some steps through `advance`, failing the test when one
 * is refused.
 *
 * @param given The test and its items.
 * @param configuration The host's configuration.
 * @param steps The steps, in order.
 * @returns The session after the last.
 */
const sessionAfter = (
  given: Delivery,
  configuration: Configuration,
  steps: readonly Step[],
): TestSession => {
  let session = Result.getOrElse(
    startTest(given.test, given.items, configuration, { instance: "sitting", now: startedAt }),
    (failure) => assert.fail(`startTest refused: ${failure.message}`),
  );
  for (const [index, step] of steps.entries()) {
    session = Result.getOrElse(
      advance(given.test, given.items, session, step, configuration, { now: after(index + 1) }),
      (failure) => assert.fail(`advance refused ${encodeIntent(step.intent)}: ${failure.message}`),
    );
  }

  return session;
};

/**
 * Give a session's navigation, failing the test when it fails.
 *
 * @param test The test.
 * @param session The session.
 * @returns The navigation.
 */
const stateOf = (test: AcceptedTest, session: TestSession): NavigationState =>
  Result.getOrElse(navigationState(test, session), (failure) =>
    assert.fail(`navigationState failed: ${failure.message}`),
  );

/**
 * Give each item of a navigation as its sequence index, state and whether it is current.
 *
 * @param state The navigation.
 * @returns The items, in order.
 */
const itemsOf = (state: NavigationState): readonly (readonly [number, string, boolean])[] =>
  state.items.map((item) => [item.sequenceIndex, item.state, item.current]);

/**
 * Give the intents a session takes now, failing the test when `allowedIntents` fails.
 *
 * @param test The test.
 * @param session The session.
 * @returns The intents' posted values, in order.
 */
const allowedNow = (test: AcceptedTest, session: TestSession): readonly string[] =>
  Result.getOrElse(allowedIntents(test, session), (failure) =>
    assert.fail(`allowedIntents failed: ${failure.message}`),
  ).map(encodeIntent);

describe("navigationState", () => {
  it.effect(
    "[T-4] on BGtest.xml, after a response saved on item 1 and a move to item 2, gives position 2, item 1 answered, item 2 current and the intents allowedIntents lists",
    () =>
      Effect.gen(function* guideMove() {
        const given = yield* corpusDelivery(guide, "BGtest.xml", guideRefs);
        const configuration = yield* configure({});
        const session = sessionAfter(given, configuration, [
          { intent: { kind: "next" }, responses: { RESPONSE: chosen("A") } },
        ]);
        const state = stateOf(given.test, session);

        assert.strictEqual(state.navigation, "nonlinear");
        assert.strictEqual(state.submission, "individual");
        assert.strictEqual(state.position, 2);
        assert.strictEqual(state.count, 6);
        assert.deepStrictEqual(itemsOf(state), [
          [1, "answered", false],
          [2, "not-answered", true],
          [3, "not-answered", false],
          [4, "not-answered", false],
          [5, "not-answered", false],
          [6, "not-answered", false],
        ]);
        assert.deepStrictEqual(state.allowed.map(encodeIntent), allowedNow(given.test, session));
        assert.isTrue(state.allowed.some((intent) => intent.kind === "previous"));
      }),
  );

  it.effect(
    "[T-4] on the CASE test (linear) allows no previous, and gives an item submitted with attempts left submitted and one at its limit closed",
    () =>
      Effect.gen(function* caseSubmissions() {
        const given = yield* corpusDelivery(caseFolder, "-TX_G06SAMP_000.xml", caseRefs);
        const configuration = yield* configure({});
        const submit: Step = {
          intent: { kind: "submit-item" },
          responses: { RESPONSE: chosen("A_2") },
        };

        const started = stateOf(given.test, sessionAfter(given, configuration, []));
        assert.strictEqual(started.navigation, "linear");
        assert.isFalse(started.allowed.some((intent) => intent.kind === "previous"));
        assert.deepStrictEqual(itemsOf(started), [
          [1, "not-answered", true],
          [2, "not-answered", false],
          [3, "not-answered", false],
        ]);

        const once = sessionAfter(given, configuration, [submit]);
        const submitted = stateOf(given.test, once);
        assert.strictEqual(once.items[0]?.record.numAttempts, 1);
        assert.isFalse(submitted.allowed.some((intent) => intent.kind === "previous"));
        assert.deepStrictEqual(itemsOf(submitted)[0], [1, "submitted", true]);
        assert.deepStrictEqual(submitted.allowed.map(encodeIntent), allowedNow(given.test, once));

        const twice = stateOf(given.test, sessionAfter(given, configuration, [submit, submit]));
        assert.deepStrictEqual(itemsOf(twice)[0], [1, "closed", true]);
      }),
  );

  it.effect(
    "[T-4] once the CASE test has closed, allows nothing and lists its last part's items, each closed and none current",
    () =>
      Effect.gen(function* caseClosed() {
        const given = yield* corpusDelivery(caseFolder, "-TX_G06SAMP_000.xml", caseRefs);
        const configuration = yield* configure({});
        const session = sessionAfter(
          given,
          configuration,
          ["A_2", "A_1", "A_3"].map((choice) => ({
            intent: { kind: "next" },
            responses: { RESPONSE: chosen(choice) },
          })),
        );
        assert.strictEqual(session.status, "closed");

        const state = stateOf(given.test, session);
        assert.deepStrictEqual(state.allowed, []);
        assert.strictEqual(state.navigation, "linear");
        assert.strictEqual(state.count, 3);
        assert.strictEqual(state.position, 3);
        assert.deepStrictEqual(itemsOf(state), [
          [1, "closed", false],
          [2, "closed", false],
          [3, "closed", false],
        ]);
      }),
  );

  it.effect(
    "[T-4] once a test whose last part holds only a section ref has closed, lists the part it closed in, each item closed, in that part's modes",
    () =>
      Effect.gen(function* closedBeforeEmptyPart() {
        const given = yield* sectionRefDelivery("SR");
        const configuration = yield* configure({});
        const session = sessionAfter(
          given,
          configuration,
          ["i1", "i2"].map(() => ({
            intent: { kind: "next" },
            responses: { RESPONSE: chosen("A") },
          })),
        );
        assert.strictEqual(session.status, "closed");

        const state = stateOf(given.test, session);
        assert.deepStrictEqual(state.allowed, []);
        assert.strictEqual(state.navigation, "linear");
        assert.strictEqual(state.submission, "individual");
        assert.strictEqual(state.count, 2);
        assert.strictEqual(state.position, 2);
        assert.deepStrictEqual(itemsOf(state), [
          [1, "closed", false],
          [2, "closed", false],
        ]);
      }),
  );

  it.effect("fails with UnknownItemRef on a session of another test", () =>
    Effect.gen(function* otherTest() {
      const guideGiven = yield* corpusDelivery(guide, "BGtest.xml", guideRefs);
      const caseGiven = yield* corpusDelivery(caseFolder, "-TX_G06SAMP_000.xml", caseRefs);
      const configuration = yield* configure({});
      const failure = Result.match(
        navigationState(caseGiven.test, sessionAfter(guideGiven, configuration, [])),
        {
          onFailure: (error) => error,
          onSuccess: () => assert.fail("navigationState read a session of another test"),
        },
      );

      assert.strictEqual(failure._tag, "UnknownItemRef");
    }),
  );

  it.effect("throws PartlessTestDefect on a closed session of a test with no part", () =>
    Effect.gen(function* partless() {
      const given = yield* corpusDelivery(caseFolder, "-TX_G06SAMP_000.xml", caseRefs);
      const configuration = yield* configure({});
      const test = acceptTestForTest({ ...given.test.test, parts: [] });
      const session = Result.getOrElse(
        startTest(test, new Map(), configuration, { instance: "sitting", now: startedAt }),
        (failure) => assert.fail(`startTest refused: ${failure.message}`),
      );
      assert.strictEqual(session.status, "closed");

      assert.throws(() => {
        navigationState(test, session);
      }, PartlessTestDefect);
    }),
  );
});

/**
 * Render a navigation and parse the HTML as a browser would, failing the test when the render
 * fails.
 *
 * @param state The navigation.
 * @param configuration The host's configuration.
 * @param options The part overrides and the order, none by default.
 * @returns The HTML and the Root it parses to.
 */
const renderedRoot = (
  state: NavigationState,
  configuration: Configuration,
  options?: NavigationOptions,
): { readonly html: string; readonly root: Element } => {
  const html = Result.getOrElse(renderNavigation(state, configuration, options), (failure) =>
    assert.fail(`renderNavigation refused: ${failure.message}`),
  );
  const [root] = parseHtml(html);

  return root?.kind === "element"
    ? { html, root }
    : assert.fail(`renderNavigation wrote no Root: ${html}`);
};

/**
 * List an element and every element below it, in document order.
 *
 * @param node The node to walk.
 * @returns The elements, `node` first when it is one.
 */
const elementsOf = (node: Node): readonly Element[] =>
  node.kind === "element" ? [node, ...node.children.flatMap(elementsOf)] : [];

/**
 * Give the text a node holds, its descendants' in order.
 *
 * @param node The node.
 * @returns The text.
 */
const textOf = (node: Node): string =>
  node.kind === "text" ? node.text : node.children.map(textOf).join("");

/**
 * List the elements below a Root that carry a navigation part's marker, read through the part
 * table.
 *
 * @param root The navigation Root.
 * @param part The part.
 * @returns The part's elements, in document order.
 */
const partsOf = (root: Element, part: PartOf<"test-navigation">): readonly Element[] => {
  const { slot } = rowFor("test-navigation", part);

  return elementsOf(root).filter((element) => element.attrs["data-slot"] === slot);
};

/**
 * Give the part key each child of a Root carries, read through the part table.
 *
 * @param root The navigation Root.
 * @returns The part keys of the Root's children, in order.
 */
const childParts = (root: Element): readonly string[] =>
  root.children.map((child) => {
    const slot = child.kind === "element" ? child.attrs["data-slot"] : undefined;

    return (
      (["previous", "next", "items", "submit", "end"] as const).find(
        (part) => rowFor("test-navigation", part).slot === slot,
      ) ?? assert.fail(`a Root child carries ${String(slot)}`)
    );
  });

/**
 * The navigation parts that are buttons.
 */
const buttonParts = [
  "previous",
  "next",
  "itemButton",
  "submit",
  "end",
] as const satisfies readonly PartOf<"test-navigation">[];

/**
 * A host's replacement that makes a navigation button its own submit button, posting the intent
 * the button is handed, as the recipe for a native post writes it.
 *
 * @param props The attributes the button carries.
 * @param children The button's label.
 * @returns A submit button named `s-1.intent` whose value is `props["data-intent"]`.
 */
const submitting = (props: Attributes, children: readonly Node[]): Element =>
  h("button", { name: "s-1.intent", type: "submit", value: props["data-intent"] ?? "" }, children);

/**
 * Copy a tree without the attributes a host's submit swap writes: `type`, `name` and `value`.
 *
 * @param node The node.
 * @returns The node, every element's attributes without those three.
 */
const withoutSubmitAttributes = (node: Node): Node =>
  node.kind === "text"
    ? node
    : h(
        node.tag,
        Object.fromEntries(
          Object.entries(node.attrs).filter(([name]) => !["name", "type", "value"].includes(name)),
        ),
        node.children.map(withoutSubmitAttributes),
      );

describe("renderNavigation", () => {
  it.effect(
    "[T-4] renders BGtest.xml's navigationState: the part's modes, each item's state in words, the current item marked, and each button disabled exactly when the data does not allow its intent",
    () =>
      Effect.gen(function* guideNavigation() {
        const given = yield* corpusDelivery(guide, "BGtest.xml", guideRefs);
        const configuration = yield* configure({});
        const session = sessionAfter(given, configuration, [
          { intent: { kind: "next" }, responses: { RESPONSE: chosen("A") } },
        ]);
        const state = stateOf(given.test, session);
        const { root } = renderedRoot(state, configuration);

        assert.strictEqual(root.tag, "nav");
        assert.strictEqual(root.attrs["aria-label"], message("en", "testNavigation"));
        assert.strictEqual(root.attrs["data-navigation"], "nonlinear");
        assert.strictEqual(root.attrs["data-submission"], "individual");
        assert.deepStrictEqual(childParts(root), ["previous", "items", "next", "submit", "end"]);

        const itemButtons = partsOf(root, "itemButton");
        assert.deepStrictEqual(
          itemButtons.map(textOf),
          (
            [
              [1, "itemAnswered"],
              [2, "itemNotAnswered"],
              [3, "itemNotAnswered"],
              [4, "itemNotAnswered"],
              [5, "itemNotAnswered"],
              [6, "itemNotAnswered"],
            ] as const
          ).map(([n, words]) =>
            message("en", "itemState", {
              item: message("en", "itemOf", { count: numeral("en", 6), n: numeral("en", n) }),
              state: message("en", words),
            }),
          ),
        );
        assert.deepStrictEqual(
          itemButtons.map((button) => button.attrs["aria-current"]),
          [undefined, "step", undefined, undefined, undefined, undefined],
        );

        const allowed = new Set(allowedNow(given.test, session));
        const buttons = buttonParts.flatMap((part) => partsOf(root, part));
        assert.lengthOf(buttons, 10);
        for (const button of buttons) {
          const intent = button.attrs["data-intent"] ?? assert.fail("a button has no intent");
          assert.strictEqual(button.attrs["type"], "button");
          assert.strictEqual(button.attrs["disabled"] !== undefined, !allowed.has(String(intent)));
        }
      }),
  );

  it.effect(
    "[T-4] is pure: two renders are byte-equal, a linear part's default Root holds Next and Submit, and order [next] holds Next only",
    () =>
      Effect.gen(function* linearNavigation() {
        const given = yield* corpusDelivery(caseFolder, "-TX_G06SAMP_000.xml", caseRefs);
        const configuration = yield* configure({});
        const state = stateOf(given.test, sessionAfter(given, configuration, []));
        const first = renderedRoot(state, configuration);

        assert.strictEqual(renderedRoot(state, configuration).html, first.html);
        assert.strictEqual(state.navigation, "linear");
        assert.deepStrictEqual(childParts(first.root), ["next", "submit"]);
        assert.deepStrictEqual(
          childParts(renderedRoot(state, configuration, { order: ["next"] }).root),
          ["next"],
        );
      }),
  );

  it.effect(
    "[T-4] keeps everything but type, name and value when a host swaps every button for its own submit button",
    () =>
      Effect.gen(function* submitSwap() {
        const given = yield* corpusDelivery(guide, "BGtest.xml", guideRefs);
        const configuration = yield* configure({});
        const state = stateOf(given.test, sessionAfter(given, configuration, []));
        const swapped = renderedRoot(state, configuration, {
          parts: {
            "test-navigation": Object.fromEntries(buttonParts.map((part) => [part, submitting])),
          },
        }).root;

        assert.deepStrictEqual(
          withoutSubmitAttributes(swapped),
          withoutSubmitAttributes(renderedRoot(state, configuration).root),
        );

        const buttons = buttonParts.flatMap((part) => partsOf(swapped, part));
        assert.lengthOf(buttons, 10);
        for (const button of buttons) {
          assert.strictEqual(button.attrs["type"], "submit");
          assert.strictEqual(button.attrs["name"], "s-1.intent");
          assert.strictEqual(button.attrs["value"], button.attrs["data-intent"]);
        }
      }),
  );

  it.effect(
    "[T-4] refuses a swap of a button to a div with PartSwapRefused, and an unknown part with UnknownPart",
    () =>
      Effect.gen(function* refusedSwaps() {
        const given = yield* corpusDelivery(guide, "BGtest.xml", guideRefs);
        const configuration = yield* configure({});
        const state = stateOf(given.test, sessionAfter(given, configuration, []));
        const failureOf = (options: NavigationOptions) =>
          Result.match(renderNavigation(state, configuration, options), {
            onFailure: (error) => error,
            onSuccess: () => assert.fail("renderNavigation took a swap it should refuse"),
          });

        const div = failureOf({
          parts: { "test-navigation": { submit: (_props, children) => h("div", {}, children) } },
        });
        assert.strictEqual(div._tag, "PartSwapRefused");
        if (div._tag === "PartSwapRefused") {
          assert.strictEqual(div.cause, "root-not-allowed");
          assert.strictEqual(div.part, "submit");
        }

        const unknown = failureOf({ parts: { "test-navigation": { pager: submitting } } });
        assert.strictEqual(unknown._tag, "UnknownPart");
        if (unknown._tag === "UnknownPart") {
          assert.strictEqual(unknown.interaction, "test-navigation");
          assert.deepStrictEqual(unknown.part, Option.some("pager"));
        }
      }),
  );
});

describe("src/navigation.ts as a browser module", () => {
  it("is among the browser roots, reaches the navigation parts and keeps the browser allowlist", () => {
    const modules = sourceModules();

    assert.isTrue(modules.has("src/navigation.ts"));
    assert.include(valueClosure(modules, ["src/navigation.ts"]), "src/emit/navigation.ts");
    assert.deepStrictEqual(checkAllowlist(modules, ["src/navigation.ts"]), []);
  });
});

import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { ConfigProvider, Effect, Option, Result } from "effect";
import { decodeSession } from "#plate/codec/session.ts";
import { configure } from "#plate/configuration.ts";
import { pageHeaders, pageHtml } from "#plate/dev/frame.ts";
import type { Page } from "#plate/dev/frame.ts";
import { openDirectory, packageCache, testField } from "#plate/dev/packages.ts";
import type { PackageCache, PackageOpener, PackageSource } from "#plate/dev/packages.ts";
import { sessionStore } from "#plate/dev/store.ts";
import { routeSessions, sessionPath } from "#plate/dev/test-page.ts";
import type { SessionPlayground } from "#plate/dev/test-page.ts";
import { emptyTheme } from "#plate/dev/theme.ts";
import type { Element, Node } from "#plate/emit/node.ts";
import { rowFor, scopedId } from "#plate/emit/parts.ts";
import type { PartOf } from "#plate/emit/parts.ts";
import { entryName } from "#plate/form/encoding.ts";
import { decodeIntent, encodeIntent, intentName } from "#plate/form/intent.ts";
import { message } from "#plate/messages.ts";
import type { Value } from "#plate/model/values.ts";
import { navigationState, renderNavigation } from "#plate/navigation.ts";
import { openPackage } from "#plate/package/open.ts";
import { resultValues } from "#plate/results/values.ts";
import type { Intent } from "#plate/session/session.ts";
import { parseHtml } from "#plate/test/round-trip.ts";

/**
 * The origin every request is made against; the route never opens it.
 */
const origin = "http://127.0.0.1:5190";

/**
 * The corpus root the fixture tests name: the repository's `fixtures/` directory, which holds no
 * `*.zip.d` directory, so the M2 fixture package is the playground's one package.
 */
const fixturesRoot = path.resolve(import.meta.dirname, "..", "..", "fixtures");

/**
 * A package and the test the tests start in it: the package's id, its location, the test's path
 * from the package's root, its title, its item count, and the pattern of what redaction keeps off
 * its pages (a correct response or a mapping key).
 */
interface Sitting {
  readonly count: number;
  readonly id: string;
  readonly location: string;
  readonly markers: RegExp;
  readonly test: string;
  readonly title: string;
}

/**
 * The M2 fixture's test: part P1 (nonlinear, simultaneous) holds items 1 to 3, part P2 (linear,
 * simultaneous) items 4 and 5. `seven` is item 2's correct response and mapping key.
 */
const fixture: Sitting = {
  count: 5,
  id: "m2",
  location: "fixtures/m2",
  markers: /seven/iu,
  test: "test.xml",
  title: "Numbers check",
};

/**
 * The Beginner's Guide package's test, read from the corpus cache: one nonlinear, individual part
 * of six items, item 1 a Choice with `min-choices="1"` and item 3 (BG008) one with
 * `max-choices="3"`. `York` and `york` are BG010's correct response and mapping keys.
 */
const guide: Sitting = {
  count: 6,
  id: "BegGuide_March2025",
  location: "QTI3_BeginnersGuide_Examples/BegGuide_March2025.zip.d",
  markers: /york/iu,
  test: "BGtest.xml",
  title: "Beginners Guide Example Test",
};

/**
 * Reading a corpus package takes a moment; the bound leaves room for a busy machine.
 */
const corpusTimeoutMs = 120_000;

/**
 * The navigation parts that are buttons, each of which the playground swaps for its submit button.
 */
const navigationButtons = [
  "previous",
  "next",
  "itemButton",
  "submit",
  "end",
] as const satisfies readonly PartOf<"test-navigation">[];

/**
 * The `data-slot` markers of the navigation buttons, read through the part table.
 */
const navigationSlots: ReadonlySet<string> = new Set(
  navigationButtons.map((part) => rowFor("test-navigation", part).slot),
);

/**
 * Write a patched copy of the Beginner's Guide test: its part gains
 * `<qti-item-session-control validate-responses="true"/>`, read in memory. The corpus holds no
 * test that sets it, and tier (b) checks run only under it.
 *
 * @param bytes `BGtest.xml` as the corpus holds it.
 * @returns The patched document.
 */
const validatingTest = (bytes: Uint8Array): Uint8Array => {
  const written = new TextDecoder().decode(bytes);
  const patched = written.replace(
    'submission-mode="individual">',
    'submission-mode="individual"><qti-item-session-control validate-responses="true"/>',
  );
  assert.notStrictEqual(patched, written, "BGtest.xml's test part does not read as expected.");

  return new TextEncoder().encode(patched);
};

/**
 * Open a package as `openDirectory` does, with one of its files replaced in memory.
 *
 * @param source The package.
 * @param replaced The replaced file's path from the package's root.
 * @param replace The replacement, given the bytes the directory holds.
 * @returns Its verdict.
 */
const openReplacing = (
  source: PackageSource,
  replaced: string,
  replace: (bytes: Uint8Array) => Uint8Array,
) =>
  Effect.gen(function* replacingPackage() {
    const entries = yield* Effect.promise(() =>
      readdir(source.root, { recursive: true, withFileTypes: true }),
    );
    const files = new Map<string, Uint8Array>();
    for (const entry of entries.filter((each) => each.isFile())) {
      const full = path.join(entry.parentPath, entry.name);
      const file = path.relative(source.root, full).split(path.sep).join("/");
      const bytes = yield* Effect.promise(() => readFile(full));
      files.set(file, file === replaced ? replace(bytes) : bytes);
    }

    return yield* openPackage(source.location, files);
  });

/**
 * Open a package as `openDirectory` does, with the Beginner's Guide test patched by
 * {@link validatingTest}.
 *
 * @param source The package.
 * @returns Its verdict.
 */
const validatingOpener: PackageOpener = (source) =>
  source.id === guide.id
    ? openReplacing(source, guide.test, validatingTest)
    : openDirectory(source);

/**
 * A hand-built templated item in place of the M2 fixture's item 1, with its identifier: template
 * processing draws the single integer template variable `T` from 1 to 10^9 and sets `RESPONSE`'s
 * correct response to `C`, which overrides the declared `B`, and the body prints `T` before a
 * Choice over `A` to `D`.
 */
const templatedItem = [
  '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="p1-single-choice" title="Drawn number" adaptive="false" time-dependent="false">',
  '<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">',
  "<qti-correct-response><qti-value>B</qti-value></qti-correct-response></qti-response-declaration>",
  '<qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">',
  "<qti-default-value><qti-value>0</qti-value></qti-default-value></qti-outcome-declaration>",
  '<qti-template-declaration identifier="T" cardinality="single" base-type="integer"/>',
  "<qti-template-processing>",
  '<qti-set-template-value identifier="T"><qti-random-integer min="1" max="1000000000"/></qti-set-template-value>',
  '<qti-set-correct-response identifier="RESPONSE"><qti-base-value base-type="identifier">C</qti-base-value></qti-set-correct-response>',
  "</qti-template-processing><qti-item-body>",
  '<p>The drawn number is <qti-printed-variable identifier="T"/>.</p>',
  '<qti-choice-interaction response-identifier="RESPONSE" max-choices="1">',
  "<qti-prompt>Which choice is correct?</qti-prompt>",
  ...["A", "B", "C", "D"].map(
    (choice) => `<qti-simple-choice identifier="${choice}">Choice ${choice}</qti-simple-choice>`,
  ),
  "</qti-choice-interaction></qti-item-body>",
  '<qti-response-processing template="https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/match_correct.xml"/>',
  "</qti-assessment-item>",
].join("");

/**
 * Open a package as `openDirectory` does, with the M2 fixture's item 1 replaced by
 * {@link templatedItem}.
 *
 * @param source The package.
 * @returns Its verdict.
 */
const templatedOpener: PackageOpener = (source) =>
  source.id === fixture.id
    ? openReplacing(source, "items/p1-single-choice.xml", () =>
        new TextEncoder().encode(templatedItem),
      )
    : openDirectory(source);

/**
 * Write a patched copy of the M2 fixture's test with outcome processing the engine runs: before
 * part `P1` it declares `PRESENTED`, `SCORES` and `NOTE`, and after part `P2` its processing sets
 * `PRESENTED` to the number of items presented and `SCORES` to every item's `SCORE`, so `NOTE`,
 * which no rule sets, stays NULL.
 *
 * @param bytes `test.xml` as the fixture holds it.
 * @returns The patched document.
 */
const outcomeTest = (bytes: Uint8Array): Uint8Array => {
  const written = new TextDecoder().decode(bytes);
  const firstPart = '<qti-test-part identifier="P1"';
  const end = "</qti-assessment-test>";
  assert.include(written, firstPart, "The fixture test's first part does not read as expected.");
  assert.include(written, end, "The fixture test does not end as expected.");

  return new TextEncoder().encode(
    written
      .replace(
        firstPart,
        [
          '<qti-outcome-declaration identifier="PRESENTED" cardinality="single" base-type="integer"/>',
          '<qti-outcome-declaration identifier="SCORES" cardinality="multiple" base-type="float"/>',
          '<qti-outcome-declaration identifier="NOTE" cardinality="single" base-type="identifier"/>',
          firstPart,
        ].join(""),
      )
      .replace(
        end,
        [
          "<qti-outcome-processing>",
          '<qti-set-outcome-value identifier="PRESENTED"><qti-number-presented/></qti-set-outcome-value>',
          '<qti-set-outcome-value identifier="SCORES"><qti-test-variables variable-identifier="SCORE"/></qti-set-outcome-value>',
          "</qti-outcome-processing>",
          end,
        ].join(""),
      ),
  );
};

/**
 * Open a package as `openDirectory` does, with the M2 fixture's test patched by
 * {@link outcomeTest}.
 *
 * @param source The package.
 * @returns Its verdict.
 */
const outcomeOpener: PackageOpener = (source) =>
  source.id === fixture.id
    ? openReplacing(source, fixture.test, outcomeTest)
    : openDirectory(source);

/**
 * The package caches the tests share, so each package is opened once for the file: the fixture's
 * over the fixtures directory, as it is, with its test given outcome processing and with item 1
 * templated, and the corpus's as it is and with the patched test.
 */
const caches = {
  fixture: Effect.runSync(packageCache()),
  guide: Effect.runSync(packageCache()),
  outcomes: Effect.runSync(packageCache(outcomeOpener)),
  templated: Effect.runSync(packageCache(templatedOpener)),
  validating: Effect.runSync(packageCache(validatingOpener)),
} as const;

/**
 * Give the text a single integer value prints in its default form.
 *
 * @param value The value.
 * @returns Its integer, written in decimal.
 */
const printedInteger = (value: Value | undefined): string => {
  const [single, ...rest] = value?.values ?? [];
  assert.lengthOf(rest, 0, "The value is not single.");

  return single?.baseType === "integer"
    ? String(single.value)
    : assert.fail("The value holds no integer.");
};

/**
 * A playground the tests post to: its sessions, the sitting it starts, and how its package reads
 * find their corpus root.
 */
interface Bench {
  readonly playground: SessionPlayground;
  /**
   * Run an effect that reads the packages with the corpus root this bench names.
   */
  readonly provide: <A, E>(effect: Effect.Effect<A, E>) => Effect.Effect<A, E>;
  readonly sitting: Sitting;
}

/**
 * Construct a bench with an empty store over a package cache, configured with a shuffle seed and
 * with no processing seed, so `startTest` draws one for each session.
 *
 * @param packages The packages.
 * @param sitting The sitting it starts.
 * @param root The corpus root its reads name, the environment's when absent.
 * @returns The bench.
 */
const benchOf = (packages: PackageCache, sitting: Sitting, root?: string) =>
  Effect.map(configure({ seed: "7" }), (configuration): Bench => ({
    playground: { configuration, packages, seed: Option.none(), sessions: sessionStore() },
    provide: (effect) =>
      root === undefined
        ? effect
        : effect.pipe(
            Effect.provide(
              ConfigProvider.layer(ConfigProvider.fromUnknown({ PLATE_CORPUS_DIR: root })),
            ),
          ),
    sitting,
  }));

/**
 * The fields of a form post, in order.
 */
type Fields = readonly (readonly [string, string])[];

/**
 * Send a request to the session routes: a GET, or a form post when fields are given.
 *
 * @param bench The bench.
 * @param target The path.
 * @param fields The posted fields, none for a GET.
 * @param method The method, GET or POST by `fields` when absent.
 * @returns The route's page or response.
 */
const send = (bench: Bench, target: string, fields?: Fields, method?: string) =>
  bench.provide(
    routeSessions(
      bench.playground,
      new Request(
        `${origin}${target}`,
        fields === undefined
          ? { method: method ?? "GET" }
          : {
              body: new URLSearchParams(fields.map(([name, value]) => [name, value])),
              method: method ?? "POST",
            },
      ),
    ),
  );

/**
 * Give every element of a tree, each before its descendants.
 *
 * @param nodes The roots.
 * @returns Their elements, in document order.
 */
const elementsOf = (nodes: readonly Node[]): readonly Element[] =>
  nodes.flatMap((node) => (node.kind === "element" ? [node, ...elementsOf(node.children)] : []));

/**
 * Give the text of a tree, its text nodes joined in document order.
 *
 * @param node The root.
 * @returns The text.
 */
const textOf = (node: Node): string =>
  node.kind === "element" ? node.children.map(textOf).join("") : node.text;

/**
 * A session page as the playground's handler writes it: the page, its HTML and its elements.
 */
interface Shown {
  readonly elements: readonly Element[];
  readonly html: string;
  readonly page: Page;
}

/**
 * Require a route's outcome to be a page, and write it as the playground's handler does. Every
 * page holds at most one `autofocus` and nothing redaction keeps off a page.
 *
 * @param bench The bench, whose sitting names what redaction keeps off.
 * @param outcome The route's outcome.
 * @param target The path the page answers.
 * @returns The page, its written HTML and its elements.
 */
const shown = (bench: Bench, outcome: Page | Response, target: string): Shown => {
  if (outcome instanceof Response) {
    return assert.fail(`${target} answered with a ${outcome.status} response, not a page.`);
  }

  const html = pageHtml(outcome, { appearance: { dark: false, theme: emptyTheme }, back: target });
  const elements = elementsOf(parseHtml(html));

  assert.isAtMost(
    elements.filter((element) => element.attrs["autofocus"] !== undefined).length,
    1,
    `${target} holds more than one autofocus.`,
  );
  assert.notMatch(html, bench.sitting.markers);

  return { elements, html, page: outcome };
};

/**
 * Require a route's outcome to be a 303 with the page headers.
 *
 * @param outcome The route's outcome.
 * @returns The location it sends the browser to.
 */
const seeOther = (outcome: Page | Response): string => {
  if (!(outcome instanceof Response)) {
    return assert.fail(`The post answered with a ${outcome.status} page: ${outcome.title}.`);
  }

  assert.strictEqual(outcome.status, 303);
  assert.strictEqual(outcome.headers.get("cache-control"), "no-store");

  return outcome.headers.get("location") ?? assert.fail("The 303 names no location.");
};

/**
 * Require a route's outcome to be the 303 to a session's page that a saved post answers with.
 *
 * @param outcome The route's outcome.
 * @returns The session id the location names.
 */
const redirected = (outcome: Page | Response): string => {
  const location = seeOther(outcome);
  assert.match(location, /^\/sessions\/s-[\da-f-]{36}$/u);

  return location.slice("/sessions/".length);
};

/**
 * Start the bench's sitting as a Start button's post does.
 *
 * @param bench The bench.
 * @returns The session id.
 */
const start = (bench: Bench) =>
  Effect.map(
    send(bench, `/packages/${bench.sitting.id}/tests`, [[testField, bench.sitting.test]]),
    redirected,
  );

/**
 * Read a session's page.
 *
 * @param bench The bench.
 * @param id The session id.
 * @returns The page as the handler writes it.
 */
const open = (bench: Bench, id: string) =>
  Effect.map(send(bench, `/sessions/${id}`), (outcome) => shown(bench, outcome, `/sessions/${id}`));

/**
 * Read the page a 303 sends the browser to.
 *
 * @param bench The bench.
 * @param location The 303's location.
 * @returns The page as the handler writes it.
 */
const follow = (bench: Bench, location: string) =>
  Effect.map(send(bench, location), (outcome) => shown(bench, outcome, location));

/**
 * Post a session's form as a press of one of its buttons does: the button's entry, then the
 * fields.
 *
 * @param bench The bench.
 * @param id The session id.
 * @param button The pressed button.
 * @param fields The form's other fields.
 * @returns The route's outcome.
 */
const press = (bench: Bench, id: string, button: Element, fields: Fields = []) =>
  send(bench, `/sessions/${id}`, [
    [String(button.attrs["name"]), String(button.attrs["value"])],
    ...fields,
  ]);

/**
 * Post an intent to a session as a button that posts it would, enabled or not.
 *
 * @param bench The bench.
 * @param id The session id.
 * @param intent The intent.
 * @param fields The form's other fields.
 * @returns The route's outcome.
 */
const postIntent = (bench: Bench, id: string, intent: Intent, fields: Fields = []) =>
  send(bench, `/sessions/${id}`, [[intentName(id), encodeIntent(intent)], ...fields]);

/**
 * Give a page's session form.
 *
 * @param page The page.
 * @param id The session id.
 * @returns The form, the one whose action is the session's page.
 */
const sessionForm = (page: Shown, id: string): Element =>
  page.elements.find(
    (element) =>
      element.tag === "form" && String(element.attrs["action"]).startsWith(`/sessions/${id}#`),
  ) ?? assert.fail("The page holds no session form.");

/**
 * Give a confirm page's form.
 *
 * @param page The page.
 * @param id The session id.
 * @returns The form, the one whose action is the session's confirm page.
 */
const confirmForm = (page: Shown, id: string): Element =>
  page.elements.find(
    (element) =>
      element.tag === "form" &&
      String(element.attrs["action"]).startsWith(`/sessions/${id}/confirm#`),
  ) ?? assert.fail("The page holds no confirm form.");

/**
 * Give a confirm page's button by its label.
 *
 * @param page The page.
 * @param id The session id.
 * @param label The button's text.
 * @returns The button.
 */
const confirmButton = (page: Shown, id: string, label: string): Element =>
  elementsOf(confirmForm(page, id).children).find(
    (element) => element.tag === "button" && textOf(element) === label,
  ) ?? assert.fail(`The confirm form has no ${label} button.`);

/**
 * Post a confirm page's form as a press of one of its buttons does.
 *
 * @param bench The bench.
 * @param id The session id.
 * @param button The pressed button.
 * @returns The route's outcome.
 */
const pressConfirm = (bench: Bench, id: string, button: Element) =>
  send(bench, `/sessions/${id}/confirm`, [
    [String(button.attrs["name"]), String(button.attrs["value"])],
  ]);

/**
 * Give the submit buttons of a page's session form, in document order.
 *
 * @param page The page.
 * @param id The session id.
 * @returns The buttons.
 */
const submitButtons = (page: Shown, id: string): readonly Element[] =>
  elementsOf(sessionForm(page, id).children).filter(
    (element) => element.tag === "button" && element.attrs["type"] === "submit",
  );

/**
 * Give a page's navigation buttons, in document order.
 *
 * @param page The page.
 * @returns The buttons whose `data-slot` names a navigation button part.
 */
const navigationOf = (page: Shown): readonly Element[] =>
  page.elements.filter((element) => navigationSlots.has(String(element.attrs["data-slot"])));

/**
 * Give the navigation button that posts an intent.
 *
 * @param page The page.
 * @param intent The intent.
 * @returns The button.
 */
const buttonFor = (page: Shown, intent: Intent): Element =>
  navigationOf(page).find((button) => button.attrs["data-intent"] === encodeIntent(intent)) ??
  assert.fail(`The page has no navigation button for ${encodeIntent(intent)}.`);

/**
 * Give the controls that post a response, in document order.
 *
 * @param page The page.
 * @param name The response's entry name.
 * @returns The `input` and `textarea` controls named so.
 */
const controlsNamed = (page: Shown, name: string): readonly Element[] =>
  page.elements.filter(
    (element) =>
      (element.tag === "input" || element.tag === "textarea") && element.attrs["name"] === name,
  );

/**
 * Give the values of the checked controls among some, in document order.
 *
 * @param controls The controls.
 * @returns Their `value` attributes.
 */
const checkedValues = (controls: readonly Element[]): readonly string[] =>
  controls.flatMap((control) =>
    control.attrs["checked"] === undefined ? [] : [String(control.attrs["value"])],
  );

/**
 * Give the elements of a page that carry `autofocus`.
 *
 * @param page The page.
 * @returns The elements.
 */
const autofocused = (page: Shown): readonly Element[] =>
  page.elements.filter((element) => element.attrs["autofocus"] !== undefined);

/**
 * Give a page's Status region for an item instance.
 *
 * @param page The page.
 * @param instance The item instance.
 * @returns The region.
 */
const statusOf = (page: Shown, instance: string): Element =>
  page.elements.find((element) => element.attrs["id"] === scopedId(instance, "status")) ??
  assert.fail(`The page holds no Status region for ${instance}.`);

/**
 * Give the title an item page of a sitting carries.
 *
 * @param sitting The sitting.
 * @param state The page's state.
 * @param n The item's sequence index.
 * @returns `{state}: Item n of N, {test title}`.
 */
const itemTitle = (
  sitting: Sitting,
  state: "answering" | "notAccepted" | "partSubmitted",
  n: number,
): string =>
  message("en", "title", {
    state: message("en", state),
    title: `${message("en", "itemOf", { count: String(sitting.count), n: String(n) })}, ${sitting.title}`,
  });

/**
 * Give an item's line on a confirm page: `Item n` and its state in words.
 *
 * @param n The item's sequence index.
 * @param state The key of its state's words.
 * @returns The line.
 */
const confirmLine = (n: number, state: "itemAnswered" | "itemNotAnswered"): string =>
  message("en", "itemState", {
    item: message("en", "item", { n: String(n) }),
    state: message("en", state),
  });

/**
 * Give each navigation button's intent with whether it is disabled, in document order.
 *
 * @param buttons The buttons.
 * @returns Each button's `data-intent` and disabled state.
 */
const disabledOf = (buttons: readonly Element[]): readonly (readonly [string, boolean])[] =>
  buttons.map((button) => [
    String(button.attrs["data-intent"]),
    button.attrs["disabled"] !== undefined,
  ]);

/**
 * Give the session a bench's store holds, decoded against its test, with the test.
 *
 * @param bench The bench.
 * @param id The session id.
 * @returns The test and the session.
 */
const storedSession = Effect.fnUntraced(function* storedSession(bench: Bench, id: string) {
  const { playground, sitting } = bench;
  const entry = Option.getOrElse(playground.sessions.get(id), () =>
    assert.fail(`The store holds no session ${id}.`),
  );
  const found = yield* bench.provide(playground.packages.packageOf(sitting.id));
  const { verdict } = Option.getOrElse(found, () => assert.fail(`No package ${sitting.id}.`));
  const test =
    verdict.verdict === "accepted" || verdict.verdict === "accepted-with-unsupported"
      ? (verdict.accepted.tests.get(`${entry.packageLocation}/${entry.testHref}`) ??
        assert.fail(`The package holds no test ${entry.testHref}.`))
      : assert.fail(`The package ${sitting.id} is ${verdict.verdict}.`);
  const session = Result.getOrElse(decodeSession(entry.session, test.test), (failure) =>
    assert.fail(failure.message),
  );

  return { entry, session, test };
});

/**
 * Submit the current part through its confirm page: press the page's Submit part button with the
 * fields, read the confirm page it is sent to, and press Confirm there.
 *
 * @param bench The bench.
 * @param id The session id.
 * @param from The session page the part is submitted from.
 * @param fields The session form's other fields.
 * @returns The location Confirm's 303 sends the browser to.
 */
const confirmed = Effect.fnUntraced(function* confirmed(
  bench: Bench,
  id: string,
  from: Shown,
  fields: Fields = [],
) {
  const confirm = yield* follow(
    bench,
    seeOther(yield* press(bench, id, buttonFor(from, { kind: "submit-part" }), fields)),
  );

  return seeOther(
    yield* pressConfirm(bench, id, confirmButton(confirm, id, message("en", "confirm"))),
  );
});

describe("sessionPath", () => {
  it("names a package's Start post, a session's page and its confirm page, and no other path", () => {
    assert.isTrue(sessionPath("/packages/m2/tests"));
    assert.isTrue(sessionPath("/sessions/s-1"));
    assert.isTrue(sessionPath("/sessions/s-1/confirm"));
    assert.isFalse(sessionPath("/packages/m2"));
    assert.isFalse(sessionPath("/packages//tests"));
    assert.isFalse(sessionPath("/packages/m2/tests/x"));
    assert.isFalse(sessionPath("/packages/m2/files/test.xml"));
    assert.isFalse(sessionPath("/sessions"));
    assert.isFalse(sessionPath("/sessions/"));
    assert.isFalse(sessionPath("/sessions/s-1/review/1"));
    assert.isFalse(sessionPath("/sessions/s-1/confirm/1"));
    assert.isFalse(sessionPath("/sessions//confirm"));
  });
});

describe("routeSessions", () => {
  it.effect(
    "starts a session from a Start button's post with a 303 to its page, storing the package's location and the test's path",
    () =>
      Effect.gen(function* started() {
        const bench = yield* benchOf(caches.fixture, fixture, fixturesRoot);
        const id = yield* start(bench);
        const entry = Option.getOrElse(bench.playground.sessions.get(id), () =>
          assert.fail("The store holds no started session."),
        );
        const statusAt = (outcome: Page | Response): number =>
          shown(bench, outcome, "/packages").page.status;

        assert.strictEqual(entry.packageLocation, fixture.location);
        assert.strictEqual(entry.testHref, fixture.test);
        assert.strictEqual(
          statusAt(yield* send(bench, "/packages/none/tests", [[testField, fixture.test]])),
          404,
        );
        assert.strictEqual(
          statusAt(
            yield* send(bench, `/packages/${fixture.id}/tests`, [
              [testField, "items/p1-single-choice.xml"],
            ]),
          ),
          404,
        );
        assert.strictEqual(statusAt(yield* send(bench, `/packages/${fixture.id}/tests`, [])), 400);

        const startGet = yield* send(bench, `/packages/${fixture.id}/tests`);
        assert.strictEqual(statusAt(startGet), 405);
        assert.deepStrictEqual(shown(bench, startGet, "/packages").page.headers, { allow: "POST" });
        assert.strictEqual(bench.playground.sessions.size, 1);
      }),
  );

  it.effect(
    "[I-5] shows a templated item's printed variable from the record its session item holds, with no notice",
    () =>
      Effect.gen(function* templatedPage() {
        const bench = yield* benchOf(caches.templated, fixture, fixturesRoot);
        const id = yield* start(bench);
        const page = yield* open(bench, id);
        const { session } = yield* storedSession(bench, id);
        const drawn = printedInteger(session.items[0]?.record.templates["T"]);
        const pageText = parseHtml(page.html).map(textOf).join("");

        assert.strictEqual(page.page.status, 200);
        assert.include(pageText, `The drawn number is ${drawn}.`);
        assert.notInclude(pageText, message("en", "notice", { feature: "qti-printed-variable" }));
      }),
  );

  it.effect(
    "[T-4] serves the current item in the session form: its title, autocomplete off, the action naming the Status region, the save that stays first, and every navigation button the playground's submit button",
    () =>
      Effect.gen(function* sessionPage() {
        const bench = yield* benchOf(caches.fixture, fixture, fixturesRoot);
        const id = yield* start(bench);
        const page = yield* open(bench, id);
        const form = sessionForm(page, id);
        const [first] = submitButtons(page, id);
        const buttons = navigationOf(page);

        assert.strictEqual(page.page.status, 200);
        assert.strictEqual(page.page.title, itemTitle(fixture, "answering", 1));
        assert.strictEqual(
          textOf(page.elements.find((element) => element.tag === "h1") ?? form),
          fixture.title,
        );
        assert.strictEqual(form.attrs["method"], "post");
        assert.strictEqual(form.attrs["autocomplete"], "off");
        assert.isDefined(form.attrs["novalidate"]);
        assert.strictEqual(
          form.attrs["action"],
          `/sessions/${id}#${scopedId(`${id}.1`, "status")}`,
        );
        assert.strictEqual(first?.attrs["name"], intentName(id));
        assert.strictEqual(first?.attrs["value"], encodeIntent({ kind: "go", sequenceIndex: 1 }));
        assert.isUndefined(first?.attrs["disabled"]);
        assert.lengthOf(autofocused(page), 0);

        assert.isAbove(buttons.length, 0);
        for (const button of buttons) {
          const value = String(button.attrs["value"]);

          assert.strictEqual(button.attrs["type"], "submit");
          assert.strictEqual(button.attrs["name"], intentName(id));
          assert.deepStrictEqual(
            Option.map(decodeIntent([[intentName(id), value]], id), encodeIntent),
            Option.some(String(button.attrs["data-intent"])),
          );
        }

        const { session, test } = yield* storedSession(bench, id);
        const plain = Result.getOrElse(
          Result.flatMap(navigationState(test.test, session), (state) =>
            renderNavigation(state, bench.playground.configuration),
          ),
          (failure) => assert.fail(failure.message),
        );
        const before = disabledOf(
          elementsOf(parseHtml(plain)).filter((element) =>
            navigationSlots.has(String(element.attrs["data-slot"])),
          ),
        );

        assert.deepStrictEqual(disabledOf(buttons), before);
        assert.isTrue(before.some(([, disabled]) => disabled));
      }),
  );

  it.effect(
    "[T-4] [T-14] keeps saved values across a save, Next, Previous and a fresh read, with autocomplete off on the form and the text Control and on no Choice control",
    () =>
      Effect.gen(function* awayAndBack() {
        const bench = yield* benchOf(caches.fixture, fixture, fixturesRoot);
        const id = yield* start(bench);
        const choice = entryName(`${id}.1`, "RESPONSE");
        const typed = entryName(`${id}.2`, "RESPONSE");
        const [save] = submitButtons(yield* open(bench, id), id);

        redirected(yield* press(bench, id, save ?? assert.fail("No save."), [[choice, "B"]]));

        const saved = yield* open(bench, id);
        assert.strictEqual(saved.page.title, itemTitle(fixture, "answering", 1));
        assert.deepStrictEqual(checkedValues(controlsNamed(saved, choice)), ["B"]);

        redirected(yield* press(bench, id, buttonFor(saved, { kind: "next" }), [[choice, "B"]]));

        const second = yield* open(bench, id);
        const [entry, ...others] = controlsNamed(second, typed);
        assert.strictEqual(second.page.title, itemTitle(fixture, "answering", 2));
        assert.lengthOf(others, 0);
        assert.strictEqual(entry?.attrs["autocomplete"], "off");
        assert.strictEqual(sessionForm(second, id).attrs["autocomplete"], "off");

        redirected(
          yield* press(bench, id, buttonFor(second, { kind: "previous" }), [[typed, "eight"]]),
        );

        const back = yield* open(bench, id);
        const radios = controlsNamed(back, choice);
        assert.strictEqual(back.page.title, itemTitle(fixture, "answering", 1));
        assert.deepStrictEqual(checkedValues(radios), ["B"]);
        assert.lengthOf(radios, 4);
        assert.isTrue(radios.every((radio) => radio.attrs["autocomplete"] === undefined));

        const fresh = yield* open(bench, id);
        assert.deepStrictEqual(checkedValues(controlsNamed(fresh, choice)), ["B"]);

        redirected(
          yield* press(bench, id, buttonFor(fresh, { kind: "go", sequenceIndex: 2 }), [
            [choice, "B"],
          ]),
        );

        const again = yield* open(bench, id);
        assert.strictEqual(controlsNamed(again, typed)[0]?.attrs["value"], "eight");
        assert.strictEqual(pageHeaders["cache-control"], "no-store");
      }),
  );

  it.effect(
    "[T-4] answers a move the part refuses on its item: the Status holds the refusal and the page's one autofocus, the posted values stay, and the session is unchanged",
    () =>
      Effect.gen(function* refusedMove() {
        const bench = yield* benchOf(caches.fixture, fixture, fixturesRoot);
        const id = yield* start(bench);
        const instance = `${id}.3`;
        const choice = entryName(instance, "RESPONSE");

        redirected(yield* postIntent(bench, id, { kind: "go", sequenceIndex: 3 }));

        const before = bench.playground.sessions.get(id);
        const target = `/sessions/${id}`;
        const page = shown(
          bench,
          yield* postIntent(bench, id, { kind: "next" }, [[choice, "A"]]),
          target,
        );
        const status = statusOf(page, instance);

        assert.strictEqual(page.page.status, 200);
        assert.strictEqual(page.page.title, itemTitle(fixture, "notAccepted", 3));
        assert.include(textOf(status), message("en", "notAccepted"));
        assert.include(textOf(status), message("en", "endOfPart"));
        assert.deepStrictEqual(autofocused(page), [status]);
        assert.isTrue(
          String(sessionForm(page, id).attrs["action"]).endsWith(
            `#${scopedId(instance, "status")}`,
          ),
        );
        assert.deepStrictEqual(checkedValues(controlsNamed(page, choice)), ["A"]);
        assert.deepStrictEqual(bench.playground.sessions.get(id), before);
      }),
  );

  it.effect(
    "answers a malformed post as a refused one: the item's own message, the Control invalid and the page's one autofocus",
    () =>
      Effect.gen(function* malformed() {
        const bench = yield* benchOf(caches.fixture, fixture, fixturesRoot);
        const id = yield* start(bench);
        const instance = `${id}.2`;
        const typed = entryName(instance, "RESPONSE");

        redirected(yield* postIntent(bench, id, { kind: "go", sequenceIndex: 2 }));

        const before = bench.playground.sessions.get(id);
        const page = shown(
          bench,
          yield* postIntent(bench, id, { kind: "next" }, [
            [typed, "one"],
            [typed, "two"],
          ]),
          `/sessions/${id}`,
        );
        const controls = controlsNamed(page, typed);
        const [control] = controls;

        assert.strictEqual(page.page.status, 200);
        assert.strictEqual(page.page.title, itemTitle(fixture, "notAccepted", 2));
        assert.include(textOf(statusOf(page, instance)), message("en", "malformedSingleMany"));
        assert.isUndefined(statusOf(page, instance).attrs["autofocus"]);
        assert.strictEqual(control?.attrs["aria-invalid"], "true");
        assert.deepStrictEqual(autofocused(page), controls.slice(0, 1));
        assert.deepStrictEqual(bench.playground.sessions.get(id), before);
      }),
  );

  it.effect(
    "[T-4] completes the fixture's P1 through posts: Submit part saves the posted responses and answers its confirm page, which lists the unanswered item; Return shows the saved values; Confirm answers P2's first item, its Status Part submitted holding the page's one autofocus",
    () =>
      Effect.gen(function* partSubmit() {
        const bench = yield* benchOf(caches.fixture, fixture, fixturesRoot);
        const id = yield* start(bench);
        const choice = entryName(`${id}.1`, "RESPONSE");
        const typed = entryName(`${id}.2`, "RESPONSE");
        const confirmAt = `/sessions/${id}/confirm`;

        redirected(
          yield* press(bench, id, buttonFor(yield* open(bench, id), { kind: "next" }), [
            [choice, "B"],
          ]),
        );

        const second = yield* open(bench, id);
        assert.strictEqual(
          seeOther(
            yield* press(bench, id, buttonFor(second, { kind: "submit-part" }), [[typed, "eight"]]),
          ),
          confirmAt,
        );

        const confirm = yield* follow(bench, confirmAt);
        const form = confirmForm(confirm, id);
        const title = message("en", "confirmTitle", {
          intent: message("en", "submitPart"),
          test: fixture.title,
        });
        const confirmPress = confirmButton(confirm, id, message("en", "confirm"));
        const returnPress = confirmButton(confirm, id, message("en", "return"));

        assert.strictEqual(confirm.page.status, 200);
        assert.strictEqual(confirm.page.title, title);
        assert.strictEqual(
          textOf(confirm.elements.find((element) => element.tag === "h1") ?? form),
          title,
        );
        assert.deepStrictEqual(
          confirm.elements.filter((element) => element.tag === "li").map(textOf),
          [
            confirmLine(1, "itemAnswered"),
            confirmLine(2, "itemAnswered"),
            confirmLine(3, "itemNotAnswered"),
          ],
        );
        assert.strictEqual(form.attrs["method"], "post");
        assert.strictEqual(form.attrs["autocomplete"], "off");
        assert.strictEqual(form.attrs["action"], `${confirmAt}#${scopedId(`${id}.2`, "status")}`);
        for (const button of [confirmPress, returnPress]) {
          assert.strictEqual(button.attrs["type"], "submit");
          assert.strictEqual(button.attrs["name"], intentName(id));
        }
        assert.strictEqual(confirmPress.attrs["value"], encodeIntent({ kind: "submit-part" }));
        assert.lengthOf(autofocused(confirm), 0);

        assert.strictEqual(redirected(yield* pressConfirm(bench, id, returnPress)), id);

        const back = yield* open(bench, id);
        assert.strictEqual(back.page.title, itemTitle(fixture, "answering", 2));
        assert.strictEqual(controlsNamed(back, typed)[0]?.attrs["value"], "eight");

        const location = yield* confirmed(bench, id, back, [[typed, "eight"]]);
        const fourth = yield* follow(bench, location);
        const status = statusOf(fourth, `${id}.4`);

        assert.strictEqual(fourth.page.status, 200);
        assert.strictEqual(fourth.page.title, itemTitle(fixture, "partSubmitted", 4));
        assert.include(textOf(status), message("en", "partSubmitted"));
        assert.deepStrictEqual(autofocused(fourth), [status]);

        const { session } = yield* storedSession(bench, id);
        assert.deepStrictEqual(
          session.parts.map((part) => part.status),
          ["ended", "current"],
        );
        assert.deepStrictEqual(
          session.items.map((item) => item.record.numAttempts),
          [1, 1, 0, 0, 0],
        );
      }),
  );

  it.effect(
    "[T-4] answers a confirmed Submit part that score refuses on another item with that item's page: it becomes current, its Controls invalid and described by the message, the page's one autofocus on the first",
    () =>
      Effect.gen(function* refusedElsewhere() {
        const bench = yield* benchOf(caches.fixture, fixture, fixturesRoot);
        const id = yield* start(bench);
        const instance = `${id}.3`;
        const ticked = entryName(instance, "RESPONSE");
        const first = entryName(`${id}.1`, "RESPONSE");

        redirected(yield* postIntent(bench, id, { kind: "go", sequenceIndex: 3 }));
        redirected(
          yield* postIntent(
            bench,
            id,
            { kind: "go", sequenceIndex: 1 },
            ["A", "B", "C"].map((value) => [ticked, value] as const),
          ),
        );

        const one = yield* open(bench, id);
        const confirm = yield* follow(
          bench,
          seeOther(
            yield* press(bench, id, buttonFor(one, { kind: "submit-part" }), [[first, "B"]]),
          ),
        );
        const target = `/sessions/${id}/confirm`;
        const page = shown(
          bench,
          yield* pressConfirm(bench, id, confirmButton(confirm, id, message("en", "confirm"))),
          target,
        );
        const status = statusOf(page, instance);
        const said = message("en", "atMost", { n: "2" });
        const note =
          elementsOf(status.children).find(
            (element) => element.tag === "li" && textOf(element) === said,
          ) ?? assert.fail("The Status holds no atMost message.");
        const controls = controlsNamed(page, ticked);

        assert.strictEqual(page.page.status, 200);
        assert.strictEqual(page.page.title, itemTitle(fixture, "notAccepted", 3));
        assert.include(textOf(status), message("en", "notAccepted"));
        assert.isUndefined(status.attrs["autofocus"]);
        assert.isAbove(controls.length, 0);
        for (const control of controls) {
          assert.strictEqual(control.attrs["aria-invalid"], "true");
          assert.include(
            String(control.attrs["aria-describedby"]).split(" "),
            String(note.attrs["id"]),
          );
        }
        assert.deepStrictEqual(autofocused(page), controls.slice(0, 1));
        assert.deepStrictEqual(checkedValues(controls).toSorted(), ["A", "B", "C"]);
        assert.lengthOf(controlsNamed(page, first), 0);

        const { session } = yield* storedSession(bench, id);
        assert.strictEqual(session.position, 2);
        assert.strictEqual(session.parts[0]?.status, "current");
        assert.isTrue(session.items.every((item) => item.record.numAttempts === 0));
      }),
  );

  it.effect(
    "submits both parts through their confirm pages, then answers the session's page with the summary, its confirm page and a post to the page with a 303 there",
    () =>
      Effect.gen(function* closed() {
        const bench = yield* benchOf(caches.fixture, fixture, fixturesRoot);
        const id = yield* start(bench);

        const fourth = yield* follow(bench, yield* confirmed(bench, id, yield* open(bench, id)));
        const [text] = controlsNamed(fourth, entryName(`${id}.4`, "RESPONSE"));
        assert.strictEqual(fourth.page.title, itemTitle(fixture, "partSubmitted", 4));
        assert.strictEqual(text?.tag, "textarea");
        assert.strictEqual(text?.attrs["autocomplete"], "off");

        redirected(yield* press(bench, id, buttonFor(fourth, { kind: "next" })));

        assert.strictEqual(yield* confirmed(bench, id, yield* open(bench, id)), `/sessions/${id}`);

        const summary = yield* open(bench, id);

        assert.strictEqual(
          summary.page.title,
          message("en", "title", { state: message("en", "finished"), title: fixture.title }),
        );
        assert.deepStrictEqual(autofocused(summary), [statusOf(summary, id)]);
        assert.strictEqual(redirected(yield* send(bench, `/sessions/${id}/confirm`)), id);
        assert.strictEqual(redirected(yield* postIntent(bench, id, { kind: "next" })), id);
      }),
  );

  it.effect(
    "[T-9] summary lists the test's outcomes as the closed session holds them once both parts are submitted through their confirm pages",
    () =>
      Effect.gen(function* outcomesListed() {
        const bench = yield* benchOf(caches.outcomes, fixture, fixturesRoot);
        const id = yield* start(bench);
        const fourth = yield* follow(bench, yield* confirmed(bench, id, yield* open(bench, id)));

        redirected(yield* press(bench, id, buttonFor(fourth, { kind: "next" })));
        assert.strictEqual(yield* confirmed(bench, id, yield* open(bench, id)), `/sessions/${id}`);

        const summary = yield* open(bench, id);
        const { session, test } = yield* storedSession(bench, id);
        const list =
          summary.elements.find((element) => element.tag === "dl") ??
          assert.fail("The summary lists no outcomes.");
        const listed = list.children.flatMap((child) =>
          child.kind === "element" ? [[child.tag, textOf(child)] as const] : [],
        );
        const expected = [...test.test.test.outcomes.keys()].flatMap((identifier) => {
          const written = resultValues(
            session.outcomes[identifier] ?? assert.fail(`The session holds no ${identifier}.`),
          );

          return [
            ["dt", identifier] as const,
            ...(written.length === 0 ? [message("en", "nullValue")] : written).map(
              (each) => ["dd", each] as const,
            ),
          ];
        });

        assert.strictEqual(session.status, "closed");
        assert.isAbove(session.outcomeRuns, 0);
        assert.deepStrictEqual(session.outcomes["PRESENTED"], {
          baseType: "integer",
          cardinality: "single",
          values: [{ baseType: "integer", value: 3n }],
        });
        assert.deepStrictEqual(listed.slice(0, 3), [
          ["dt", "PRESENTED"],
          ["dd", "3"],
          ["dt", "SCORES"],
        ]);
        assert.deepStrictEqual(listed.slice(-2), [
          ["dt", "NOTE"],
          ["dd", message("en", "nullValue")],
        ]);
        assert.deepStrictEqual(listed, expected);
      }),
  );

  it.effect(
    "answers 404 for an unknown session or path, 400 for a post with no form or no intent, and 405 with Allow naming GET and POST for another method",
    () =>
      Effect.gen(function* refusedRequests() {
        const bench = yield* benchOf(caches.fixture, fixture, fixturesRoot);
        const id = yield* start(bench);
        const statusAt = (outcome: Page | Response): number =>
          shown(bench, outcome, `/sessions/${id}`).page.status;
        const headersAt = (outcome: Page | Response) =>
          shown(bench, outcome, `/sessions/${id}`).page.headers;
        const unknown = yield* send(bench, "/sessions/s-unknown");
        const confirmPut = yield* send(bench, `/sessions/${id}/confirm`, undefined, "PUT");
        const sessionPut = yield* send(bench, `/sessions/${id}`, undefined, "PUT");
        const notAForm = bench.provide(
          routeSessions(
            bench.playground,
            new Request(`${origin}/sessions/${id}`, {
              body: "next",
              headers: { "content-type": "text/plain" },
              method: "POST",
            }),
          ),
        );

        assert.strictEqual(statusAt(unknown), 404);
        assert.deepStrictEqual(headersAt(unknown), {});
        assert.strictEqual(statusAt(yield* send(bench, "/sessions/s-unknown", [])), 404);
        assert.strictEqual(statusAt(yield* send(bench, "/sessions/%E0%A4%A")), 404);
        assert.strictEqual(statusAt(yield* send(bench, `/sessions/${id}/elsewhere`)), 404);
        assert.strictEqual(statusAt(yield* send(bench, "/sessions/s-unknown/confirm")), 404);
        assert.strictEqual(statusAt(confirmPut), 405);
        assert.deepStrictEqual(headersAt(confirmPut), { allow: "GET, POST" });
        assert.strictEqual(statusAt(yield* notAForm), 400);
        assert.strictEqual(statusAt(yield* send(bench, `/sessions/${id}`, [])), 400);
        assert.strictEqual(
          statusAt(yield* send(bench, `/sessions/${id}`, [[intentName(id), "jump"]])),
          400,
        );
        assert.strictEqual(statusAt(sessionPut), 405);
        assert.deepStrictEqual(headersAt(sessionPut), { allow: "GET, POST" });
      }),
  );

  it.effect(
    "tier (a): BG008 posted with four choices ticked and submit-item answers Not accepted, atMost 3 describing each invalid Control, and one autofocus, on the first",
    () =>
      Effect.gen(function* tierA() {
        const bench = yield* benchOf(caches.guide, guide);
        const id = yield* start(bench);
        const instance = `${id}.3`;
        const choice = entryName(instance, "RESPONSE");

        redirected(yield* postIntent(bench, id, { kind: "go", sequenceIndex: 3 }));

        const before = bench.playground.sessions.get(id);
        const page = shown(
          bench,
          yield* postIntent(
            bench,
            id,
            { kind: "submit-item" },
            ["A", "B", "C", "D"].map((value) => [choice, value] as const),
          ),
          `/sessions/${id}`,
        );
        const status = statusOf(page, instance);
        const said = message("en", "atMost", { n: "3" });
        const note =
          elementsOf(status.children).find(
            (element) => element.tag === "li" && textOf(element) === said,
          ) ?? assert.fail("The Status holds no atMost message.");
        const controls = controlsNamed(page, choice);

        assert.strictEqual(page.page.status, 200);
        assert.strictEqual(page.page.title, itemTitle(guide, "notAccepted", 3));
        assert.include(textOf(status), message("en", "notAccepted"));
        assert.isUndefined(status.attrs["autofocus"]);
        assert.isAbove(controls.length, 0);
        for (const control of controls) {
          assert.strictEqual(control.attrs["aria-invalid"], "true");
          assert.include(
            String(control.attrs["aria-describedby"]).split(" "),
            String(note.attrs["id"]),
          );
        }
        assert.deepStrictEqual(autofocused(page), controls.slice(0, 1));
        assert.deepStrictEqual(checkedValues(controls), ["A", "B", "C", "D"]);
        assert.isTrue(
          String(sessionForm(page, id).attrs["action"]).endsWith(`#${String(status.attrs["id"])}`),
        );
        assert.deepStrictEqual(bench.playground.sessions.get(id), before);
      }),
    { tags: ["corpus"], timeout: corpusTimeoutMs },
  );

  it.effect(
    "tier (b): under validate-responses, firstexample submitted with no choice answers Not accepted with atLeast 1, its one autofocus on the first invalid Control",
    () =>
      Effect.gen(function* tierB() {
        const bench = yield* benchOf(caches.validating, guide);
        const id = yield* start(bench);
        const instance = `${id}.1`;
        const page = shown(
          bench,
          yield* postIntent(bench, id, { kind: "submit-item" }),
          `/sessions/${id}`,
        );
        const status = statusOf(page, instance);
        const controls = controlsNamed(page, entryName(instance, "RESPONSE"));

        assert.strictEqual(page.page.status, 200);
        assert.strictEqual(page.page.title, itemTitle(guide, "notAccepted", 1));
        assert.include(textOf(status), message("en", "atLeast", { n: "1" }));
        assert.isUndefined(status.attrs["autofocus"]);
        assert.isAbove(controls.length, 0);
        assert.isTrue(controls.every((control) => control.attrs["aria-invalid"] === "true"));
        assert.deepStrictEqual(autofocused(page), controls.slice(0, 1));
      }),
    { tags: ["corpus"], timeout: corpusTimeoutMs },
  );

  it.effect(
    "titles an individual part's confirm page End part, listing its unanswered items, and its Confirm ends the part, here closing the test",
    () =>
      Effect.gen(function* partEnd() {
        const bench = yield* benchOf(caches.guide, guide);
        const id = yield* start(bench);
        const confirmAt = `/sessions/${id}/confirm`;

        assert.strictEqual(seeOther(yield* postIntent(bench, id, { kind: "end-part" })), confirmAt);

        const confirm = yield* follow(bench, confirmAt);
        const end = confirmButton(confirm, id, message("en", "confirm"));

        assert.strictEqual(
          confirm.page.title,
          message("en", "confirmTitle", { intent: message("en", "endPart"), test: guide.title }),
        );
        assert.deepStrictEqual(
          confirm.elements.filter((element) => element.tag === "li").map(textOf),
          Array.from({ length: guide.count }, (_, index) =>
            confirmLine(index + 1, "itemNotAnswered"),
          ),
        );
        assert.strictEqual(end.attrs["value"], encodeIntent({ kind: "end-part" }));
        assert.strictEqual(redirected(yield* pressConfirm(bench, id, end)), id);

        const { session } = yield* storedSession(bench, id);
        assert.strictEqual(session.status, "closed");
      }),
    { tags: ["corpus"], timeout: corpusTimeoutMs },
  );
});

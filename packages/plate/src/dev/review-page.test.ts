import path from "node:path";
import { assert, describe, it } from "@effect/vitest";
import { ConfigProvider, Effect, Option, Result } from "effect";
import { encodeSession } from "#plate/codec/session.ts";
import { configure } from "#plate/configuration.ts";
import type { Configuration } from "#plate/configuration.ts";
import { pageHtml } from "#plate/dev/frame.ts";
import type { Page } from "#plate/dev/frame.ts";
import { packageCache } from "#plate/dev/packages.ts";
import { reviewPath, routeReview, summaryPage } from "#plate/dev/review-page.ts";
import type { ReviewPlayground } from "#plate/dev/review-page.ts";
import { newSessionId, sessionStore } from "#plate/dev/store.ts";
import { emptyTheme } from "#plate/dev/theme.ts";
import { readSource } from "#plate/document/read.ts";
import { walk } from "#plate/document/source.ts";
import type { Element, Node } from "#plate/emit/node.ts";
import { scopedId } from "#plate/emit/parts.ts";
import { entryName } from "#plate/form/encoding.ts";
import { message } from "#plate/messages.ts";
import type { Value } from "#plate/model/values.ts";
import type { PackageTest } from "#plate/package/open.ts";
import { redact, render } from "#plate/render.ts";
import { advance } from "#plate/session/advance.ts";
import type { Intent, Responses, TestSession } from "#plate/session/session.ts";
import { current, itemView, startTest } from "#plate/session/start.ts";
import { parseHtml } from "#plate/test/round-trip.ts";
import { validateAgainst } from "#plate/test/xsd.ts";

/**
 * The origin every request is made against; the route never opens it.
 */
const origin = "http://127.0.0.1:5190";

/**
 * The corpus root these tests name: the repository's `fixtures/` directory, which holds no
 * `*.zip.d` directory, so the M2 fixture package is the playground's one package.
 */
const fixturesRoot = path.resolve(import.meta.dirname, "..", "..", "fixtures");

/**
 * The fixture package's location and its test's path from the package's root.
 */
const fixture = { location: "fixtures/m2", test: "test.xml" } as const;

/**
 * The cached Results Reporting XSD, named relative to the XSD cache.
 */
const resultsXsd = "imsqti_resultv3p0_v1p0.xsd";

/**
 * The XSD oracle compiles its schema on every run; the bound leaves room for a busy machine.
 */
const oracleTimeoutMs = 120_000;

/**
 * The closed session's id: an `s-` id as `newSessionId` draws one, fixed so that item 3, a shuffled
 * Choice, is presented in an order other than its document's on every run.
 */
const closedId = "s-0f8fad5b-d9cb-469f-a165-70867728950e";

/**
 * The order item 3's choices take in its document.
 */
const documentOrder = ["A", "B", "C", "D"];

/**
 * The time every session starts at.
 */
const startedAt = new Date("2026-11-05T10:00:00.000Z");

/**
 * The package cache every test of this file shares, so the fixture package is opened once.
 */
const cache = Effect.runSync(packageCache());

/**
 * Read the corpus root from {@link fixturesRoot} while running an effect that reads the packages.
 *
 * @param effect The effect.
 * @returns The effect, its corpus root the fixtures directory.
 */
const provided = <A, E>(effect: Effect.Effect<A, E>): Effect.Effect<A, E> =>
  effect.pipe(
    Effect.provide(
      ConfigProvider.layer(ConfigProvider.fromUnknown({ PLATE_CORPUS_DIR: fixturesRoot })),
    ),
  );

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
 * A multiple identifier value.
 *
 * @param identifiers The identifiers.
 * @returns The value.
 */
const chosenMany = (...identifiers: readonly string[]): Value => ({
  baseType: "identifier",
  cardinality: "multiple",
  values: identifiers.map((value) => ({ baseType: "identifier", value })),
});

/**
 * A single string value.
 *
 * @param value The string.
 * @returns The value.
 */
const written = (value: string): Value => ({
  baseType: "string",
  cardinality: "single",
  values: [{ baseType: "string", value }],
});

/**
 * The candidate's sitting of the fixture test, step by step: item 1 answered wrongly, item 2
 * wrongly, item 3 with two of its choices and the first part submitted, then the second part's two
 * items answered and that part submitted, which closes the test.
 */
const sitting: readonly { readonly intent: Intent; readonly responses: Responses }[] = [
  { intent: { kind: "next" }, responses: { RESPONSE: chosen("A") } },
  { intent: { kind: "next" }, responses: { RESPONSE: written("six") } },
  { intent: { kind: "submit-part" }, responses: { RESPONSE: chosenMany("A", "B") } },
  { intent: { kind: "next" }, responses: { RESPONSE: written("I counted twice.") } },
  { intent: { kind: "submit-part" }, responses: { RESPONSE: chosen("B") } },
];

/**
 * The fixture test delivered in a playground: one session closed through {@link sitting}, one
 * still open on its first item, and item 3's choice order as the candidate saw it when answering.
 */
interface Delivered {
  readonly closed: { readonly id: string; readonly session: TestSession };
  readonly configuration: Configuration;
  readonly open: string;
  readonly order: readonly string[];
  readonly playground: ReviewPlayground;
  readonly test: PackageTest;
}

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
 * Give the values of the controls that post a response, in document order.
 *
 * @param elements The page's elements.
 * @param name The response's entry name.
 * @returns The controls.
 */
const controlsNamed = (elements: readonly Element[], name: string): readonly Element[] =>
  elements.filter((element) => element.tag === "input" && element.attrs["name"] === name);

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
 * Deliver the fixture test: start a session, take it through {@link sitting} to its close, start a
 * second session and leave it open, and store both as the playground's session pages do.
 */
const delivered = Effect.gen(function* delivered() {
  const configuration = yield* configure({ seed: "7" });
  const found = yield* provided(cache.packageOf("m2"));
  const entry = Option.getOrElse(found, () => assert.fail("The fixture package is not listed."));
  const { verdict } = entry;
  if (verdict.verdict !== "accepted" && verdict.verdict !== "accepted-with-unsupported") {
    return assert.fail(`The fixture package is ${verdict.verdict}.`);
  }

  const test =
    verdict.accepted.tests.get(`${fixture.location}/${fixture.test}`) ??
    assert.fail("The fixture package holds no test.xml.");
  const start = (id: string): TestSession =>
    Result.getOrElse(
      startTest(test.test, test.items, configuration, { instance: id, now: startedAt }),
      (failure) => assert.fail(`startTest refused: ${failure.message}`),
    );
  let session = start(closedId);
  let order: readonly string[] = [];
  for (const [index, step] of sitting.entries()) {
    if (session.position === 2) {
      const view = Result.getOrElse(itemView(test.test, session, configuration, 3), (failure) =>
        assert.fail(failure.message),
      );
      const answering = Result.getOrElse(
        render(redact(test.items.get(view.ref) ?? assert.fail("No item 3.")), view.configuration, {
          instance: view.instance,
        }),
        (failure) => assert.fail(failure.message),
      );
      order = controlsNamed(
        elementsOf(parseHtml(answering.html)),
        entryName(view.instance, "RESPONSE"),
      ).map((control) => String(control.attrs["value"]));
    }

    session = Result.getOrElse(
      advance(test.test, test.items, session, step, configuration, {
        now: new Date(startedAt.getTime() + (index + 1) * 10_000),
      }),
      (failure) => assert.fail(`advance refused: ${failure.message}`),
    );
  }
  assert.strictEqual(session.status, "closed");

  const sessions = sessionStore();
  const store = (id: string, held: TestSession): void => {
    sessions.set(id, {
      packageLocation: fixture.location,
      session: Result.getOrElse(encodeSession(held), (failure) => assert.fail(failure.message)),
      testHref: fixture.test,
    });
  };
  const openId = newSessionId();
  store(closedId, session);
  store(openId, start(openId));

  const result: Delivered = {
    closed: { id: closedId, session },
    configuration,
    open: openId,
    order,
    playground: { configuration, packages: cache, sessions },
    test,
  };

  return result;
});

/**
 * Send a request to the review route.
 *
 * @param playground The playground.
 * @param target The path.
 * @param method The method, GET when absent.
 * @returns The route's page or response.
 */
const ask = (playground: ReviewPlayground, target: string, method = "GET") =>
  provided(routeReview(playground, new Request(`${origin}${target}`, { method })));

/**
 * Require a route's outcome to be a page, and give its status and elements as the playground's
 * handler writes it.
 *
 * @param outcome The route's outcome.
 * @param target The path the page answers, which its theme box returns to.
 * @returns The page, its written HTML and its elements.
 */
const shown = (outcome: Page | Response, target: string) => {
  if (outcome instanceof Response) {
    return assert.fail(`${target} answered with a response, not a page.`);
  }

  const html = pageHtml(outcome, { appearance: { dark: false, theme: emptyTheme }, back: target });

  return { elements: elementsOf(parseHtml(html)), html, page: outcome };
};

describe("reviewPath", () => {
  it("names the review, solution and results paths of a session, and no other", () => {
    assert.isTrue(reviewPath("/sessions/s-1/review/1"));
    assert.isTrue(reviewPath("/sessions/s-1/solution/2"));
    assert.isTrue(reviewPath("/sessions/s-1/results.xml"));
    assert.isFalse(reviewPath("/sessions/s-1"));
    assert.isFalse(reviewPath("/sessions/s-1/confirm"));
    assert.isFalse(reviewPath("/sessions/s-1/review"));
    assert.isFalse(reviewPath("/sessions/s-1/results.xml/1"));
    assert.isFalse(reviewPath("/packages/m2"));
  });
});

describe("routeReview", () => {
  it.effect("shows an item in review with the candidate's values, read-only", () =>
    Effect.gen(function* review() {
      const { closed, playground } = yield* delivered;
      const target = `/sessions/${closed.id}/review/1`;
      const { elements, page } = shown(yield* ask(playground, target), target);
      const instance = `${closed.id}.1`;
      const choices = controlsNamed(elements, entryName(instance, "RESPONSE"));

      assert.strictEqual(page.status, 200);
      assert.strictEqual(
        page.title,
        message("en", "title", {
          state: message("en", "review"),
          title: `${message("en", "itemOf", { count: "5", n: "1" })}, Numbers check`,
        }),
      );
      assert.isTrue(elements.some((element) => element.attrs["data-mode"] === "review"));

      const status = elements.find(
        (element) => element.attrs["id"] === scopedId(instance, "status"),
      );
      assert.include(textOf(status ?? assert.fail("No Status region.")), message("en", "review"));
      assert.strictEqual(choices.length, 4);
      assert.isTrue(choices.every((choice) => choice.attrs["disabled"] !== undefined));
      assert.deepStrictEqual(checkedValues(choices), ["A"]);
      assert.isTrue(
        elements.some(
          (element) => element.tag === "a" && element.attrs["href"] === `/sessions/${closed.id}`,
        ),
      );
    }),
  );

  it.effect("shows a text Control in review read-only and still enabled, with its value", () =>
    Effect.gen(function* reviewText() {
      const { closed, playground } = yield* delivered;
      const target = `/sessions/${closed.id}/review/2`;
      const { elements } = shown(yield* ask(playground, target), target);
      const [control, ...others] = controlsNamed(elements, entryName(`${closed.id}.2`, "RESPONSE"));

      assert.lengthOf(others, 0);
      assert.strictEqual(control?.attrs["value"], "six");
      assert.isDefined(control?.attrs["readonly"]);
      assert.isUndefined(control?.attrs["disabled"]);
    }),
  );

  it.effect("keeps a shuffled Choice in the order the candidate saw it", () =>
    Effect.gen(function* keptOrder() {
      const { closed, order, playground } = yield* delivered;
      const name = entryName(`${closed.id}.3`, "RESPONSE");

      assert.sameMembers([...order], documentOrder);
      assert.notDeepEqual(order, documentOrder);
      for (const mode of ["review", "solution"]) {
        const target = `/sessions/${closed.id}/${mode}/3`;
        const { elements } = shown(yield* ask(playground, target), target);
        const choices = controlsNamed(elements, name);

        assert.deepStrictEqual(
          choices.map((choice) => String(choice.attrs["value"])),
          order,
        );
        assert.deepStrictEqual(
          checkedValues(choices).toSorted(),
          mode === "review" ? ["A", "B"] : ["A", "C"],
        );
      }
    }),
  );

  it.effect("shows an item in solution with its correct values, read-only", () =>
    Effect.gen(function* solutionPage() {
      const { closed, playground } = yield* delivered;
      const choiceTarget = `/sessions/${closed.id}/solution/1`;
      const choice = shown(yield* ask(playground, choiceTarget), choiceTarget);
      const choices = controlsNamed(choice.elements, entryName(`${closed.id}.1`, "RESPONSE"));
      const textTarget = `/sessions/${closed.id}/solution/2`;
      const entry = shown(yield* ask(playground, textTarget), textTarget);
      const [control] = controlsNamed(entry.elements, entryName(`${closed.id}.2`, "RESPONSE"));

      assert.strictEqual(choice.page.status, 200);
      assert.isTrue(choice.elements.some((element) => element.attrs["data-mode"] === "solution"));
      assert.isTrue(choices.every((each) => each.attrs["disabled"] !== undefined));
      assert.deepStrictEqual(checkedValues(choices), ["B"]);
      assert.strictEqual(control?.attrs["value"], "seven");
      assert.isDefined(control?.attrs["readonly"]);
    }),
  );

  it.effect("answers 404 for a solution its item's session control forbids, but shows review", () =>
    Effect.gen(function* forbidden() {
      const { closed, playground } = yield* delivered;

      for (const n of [4, 5]) {
        const solution = `/sessions/${closed.id}/solution/${n}`;
        const review = `/sessions/${closed.id}/review/${n}`;

        assert.strictEqual(shown(yield* ask(playground, solution), solution).page.status, 404);
        assert.strictEqual(shown(yield* ask(playground, review), review).page.status, 200);
      }
    }),
  );

  it.effect(
    "answers 404 for an open item, an unknown session, an item the session lacks and an unowned path",
    () =>
      Effect.gen(function* notFound() {
        const { closed, open, playground } = yield* delivered;
        const targets = [
          `/sessions/${open}/review/1`,
          `/sessions/${open}/solution/1`,
          "/sessions/s-unknown/review/1",
          "/sessions/s-unknown/results.xml",
          `/sessions/${closed.id}/review/0`,
          `/sessions/${closed.id}/review/6`,
          `/sessions/${closed.id}/review/01`,
          `/sessions/${closed.id}/solution/x`,
          `/sessions/${closed.id}/confirm`,
          `/sessions/${closed.id}`,
        ];

        for (const target of targets) {
          assert.strictEqual(
            shown(yield* ask(playground, target), target).page.status,
            404,
            target,
          );
        }
      }),
  );

  it.effect("refuses another method than GET with a 405 whose Allow names GET", () =>
    Effect.gen(function* refusedMethod() {
      const { closed, playground } = yield* delivered;
      const targets = [
        `/sessions/${closed.id}/review/1`,
        `/sessions/${closed.id}/solution/1`,
        `/sessions/${closed.id}/results.xml`,
      ];

      for (const target of targets) {
        const { page } = shown(yield* ask(playground, target, "POST"), target);

        assert.strictEqual(page.status, 405, target);
        assert.deepStrictEqual(page.headers, { allow: "GET" }, target);
      }
    }),
  );

  it.effect(
    "answers the session's results as an XML download whose session identifier is the store's id, valid against the Results XSD",
    () =>
      Effect.gen(function* resultsDocument() {
        const { closed, playground } = yield* delivered;
        const outcome = yield* ask(playground, `/sessions/${closed.id}/results.xml`).pipe(
          Effect.map((answered) =>
            answered instanceof Response
              ? answered
              : assert.fail(`The results answered with a ${answered.status} page.`),
          ),
        );

        const xml = yield* Effect.promise(() => outcome.text());
        const source = yield* readSource("results.xml", new TextEncoder().encode(xml));
        const identifiers = [...walk(source)].flatMap(({ element }) =>
          element.local === "sessionIdentifier"
            ? element.attributes.flatMap((attribute) =>
                attribute.local === "identifier" ? [attribute.value] : [],
              )
            : [],
        );
        const verdict = yield* validateAgainst(resultsXsd, xml);

        assert.strictEqual(outcome.status, 200);
        assert.strictEqual(outcome.headers.get("content-type"), "application/xml; charset=utf-8");
        assert.strictEqual(outcome.headers.get("content-disposition"), "attachment");
        assert.strictEqual(outcome.headers.get("x-content-type-options"), "nosniff");
        assert.strictEqual(outcome.headers.get("cache-control"), "no-store");
        assert.deepStrictEqual(identifiers, [closed.id]);
        assert.isTrue(verdict.valid, verdict.messages.join("\n"));
      }),
    { tags: ["qti-xsd"], timeout: oracleTimeoutMs },
  );
});

describe("summaryPage", () => {
  it.effect(
    "lists each item with its state and its permitted views, focuses the Status and links the results",
    () =>
      Effect.gen(function* summary() {
        const { closed, configuration, playground, test } = yield* delivered;
        const now = Result.getOrElse(current(test.test, closed.session, configuration), (failure) =>
          assert.fail(failure.message),
        );
        const shownNow =
          now.kind === "summary"
            ? now
            : assert.fail("The closed session shows an item, not the summary.");

        const target = `/sessions/${closed.id}`;
        const { elements, page } = shown(
          summaryPage(closed.id, test.test, closed.session, shownNow, configuration),
          target,
        );
        const status =
          elements.find((element) => element.attrs["id"] === scopedId(closed.id, "status")) ??
          assert.fail("No Status region.");
        const items = elements.find((element) => element.tag === "ol")?.children ?? [];
        const links = elements.filter((element) => element.tag === "a");
        const hrefOf = (name: string): Option.Option<string> =>
          Option.fromUndefinedOr(links.find((link) => textOf(link) === name)?.attrs["href"]).pipe(
            Option.map(String),
          );
        const download =
          links.find((link) => textOf(link) === message("en", "downloadResults")) ??
          assert.fail("No results link.");

        assert.strictEqual(page.status, 200);
        assert.strictEqual(
          page.title,
          message("en", "title", { state: message("en", "finished"), title: "Numbers check" }),
        );
        assert.isDefined(status.attrs["autofocus"]);
        assert.include(textOf(status), message("en", "testFinished"));
        assert.lengthOf(items, 5);
        for (const [index, item] of items.entries()) {
          const n = String(index + 1);

          assert.isTrue(
            textOf(item).startsWith(
              message("en", "itemState", {
                item: message("en", "item", { n }),
                state: message("en", "itemSubmitted"),
              }),
            ),
            textOf(item),
          );
          assert.deepStrictEqual(
            hrefOf(message("en", "reviewItem", { n })),
            Option.some(`${target}/review/${n}`),
          );
          assert.deepStrictEqual(
            hrefOf(message("en", "solutionItem", { n })),
            index < 3 ? Option.some(`${target}/solution/${n}`) : Option.none(),
          );
          assert.strictEqual(
            textOf(item).includes(message("en", "solutionNotAllowed")),
            index >= 3,
          );
        }
        assert.strictEqual(download.attrs["href"], `${target}/results.xml`);
        assert.isDefined(download.attrs["download"]);

        for (const link of links) {
          const href = String(link.attrs["href"]);
          if (reviewPath(href) && !href.endsWith("results.xml")) {
            assert.strictEqual(shown(yield* ask(playground, href), href).page.status, 200, href);
          }
        }
      }),
  );
});

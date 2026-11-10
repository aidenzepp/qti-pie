/**
 * The dev playground's read-only views of a test session: an item in review at
 * `/sessions/<sid>/review/<n>`, an item with its correct responses at
 * `/sessions/<sid>/solution/<n>`, the session's Results Reporting document at
 * `/sessions/<sid>/results.xml` once the test has closed, and the closed test's summary page,
 * which links them.
 *
 * A review or solution page is served only while `permits` allows it for item `n`, and is rendered
 * with `itemView`'s instance, configuration and record for that item, so a shuffled Choice shows
 * the order the candidate saw and a templated item the values its template processing drew. Review
 * shows the candidate's values, and, where `permits` also allows the solution, marks each answer
 * against the values `solution` gives from the item's record, passed to `render` as `solution`;
 * solution shows those values, its template-set correct responses among them, which the author
 * passes to `render` as `values`. Those two are the only places a correct response reaches a page
 * (T-k under A; the solution page is the part a ruling of B drops). The summary is a page builder,
 * {@link summaryPage}: the session page shows it once the test has closed, and it is not routed
 * here; after the items it lists the test's outcomes as the last outcome processing left them. The
 * results document reports the session under the store's `s-` id, which the Results XSD takes as an
 * NCName.
 *
 * The route returns the frame's {@link Page} for every HTML answer, so the playground's handler
 * writes it with the stylesheets, the theme box and the page headers, and a `Response` only for the
 * results document. Every page is built through `h`, so a test's and an item's titles are escaped.
 *
 * Dev playground code outside the core: nothing reachable from `src/index.ts` imports it.
 *
 * @module
 */
import { Effect, Option, Result } from "effect";
import type { Configuration } from "#plate/configuration.ts";
import { page, slot } from "#plate/dev/frame.ts";
import type { Page } from "#plate/dev/frame.ts";
import type { PackageCache, PackagesFailure } from "#plate/dev/packages.ts";
import {
  failurePage,
  itemAssetBase,
  itemOf,
  notePage,
  sessionHref,
  sittingOf,
} from "#plate/dev/sitting.ts";
import type { Sitting } from "#plate/dev/sitting.ts";
import type { SessionStore } from "#plate/dev/store.ts";
import { h, text } from "#plate/emit/node.ts";
import type { Element, Node } from "#plate/emit/node.ts";
import { message, numeral } from "#plate/messages.ts";
import type { Locale } from "#plate/messages.ts";
import { isNullResponse } from "#plate/model/values.ts";
import { redact, render, renderStatus } from "#plate/render.ts";
import type { Options } from "#plate/render.ts";
import { results } from "#plate/results/results.ts";
import { resultValues } from "#plate/results/values.ts";
import type { TestSession } from "#plate/session/session.ts";
import { itemView, permits } from "#plate/session/start.ts";
import type { SummaryItem, TestSummary } from "#plate/session/start.ts";
import { solution } from "#plate/solution.ts";
import type { AcceptedTest } from "#plate/validate/verdict.ts";

/**
 * What the review routes read: the playground's configuration, its packages and its sessions.
 *
 * `configuration` is the playground's decoded configuration, the one its session pages start and
 * advance sessions with; `itemView` writes each item's session control into it.
 */
export interface ReviewPlayground {
  readonly configuration: Configuration;
  readonly packages: PackageCache;
  readonly sessions: SessionStore;
}

/**
 * The read-only view a review route shows an item in.
 */
type ShownMode = "review" | "solution";

/**
 * One request the review routes take: a session id, still percent-encoded, and what to show of it.
 */
type Target =
  | { readonly id: string; readonly kind: "item"; readonly mode: ShownMode; readonly n: string }
  | { readonly id: string; readonly kind: "results" };

/**
 * The headers of the results document: an XML download that no cache keeps and no browser sniffs
 * into another type.
 */
const resultsHeaders = {
  "cache-control": "no-store",
  "content-disposition": "attachment",
  "content-type": "application/xml; charset=utf-8",
  "x-content-type-options": "nosniff",
} as const satisfies Readonly<Record<string, string>>;

/**
 * A sequence index as a path segment writes it: a positive decimal integer with no leading zero.
 */
const sequenceSegment = /^[1-9]\d*$/u;

/**
 * Read a request's path as a review target.
 *
 * @param pathname The request's path.
 * @returns The target: `/sessions/<sid>/review/<n>` or `/sessions/<sid>/solution/<n>` for an item,
 *   `/sessions/<sid>/results.xml` for the results; none for any other path.
 */
const targetOf = (pathname: string): Option.Option<Target> => {
  const [root, base, id, view, n, ...rest] = pathname.split("/");
  if (root !== "" || base !== "sessions" || id === undefined || id === "" || rest.length > 0) {
    return Option.none();
  }

  if (view === "results.xml" && n === undefined) {
    return Option.some({ id, kind: "results" });
  }

  return (view === "review" || view === "solution") && n !== undefined
    ? Option.some({ id, kind: "item", mode: view, n })
    : Option.none();
};

/**
 * Say whether a path is one of the review routes, so the playground dispatches it to
 * {@link routeReview} and every other path under `/sessions` to its session pages.
 *
 * @param pathname The request's path.
 * @returns Whether the path is `/sessions/<sid>/review/<n>`, `/sessions/<sid>/solution/<n>` or
 *   `/sessions/<sid>/results.xml`, whatever `<sid>` and `<n>` hold.
 */
export const reviewPath = (pathname: string): boolean => Option.isSome(targetOf(pathname));

/**
 * Construct the 404 page every refused review path answers with: an unknown session, an item the
 * session lacks, an item its session control does not show in the asked mode, and the results of a
 * session whose test is still open.
 *
 * @returns The 404 page.
 */
const notFound = (): Page =>
  notePage(404, "Not found", "No session, or no view of its item, is at this address.");

/**
 * Give the title a page of a session's item carries: `{state}: Item n of N, {test title}`.
 *
 * @param configuration The configuration, which gives the locale.
 * @param state The page's state, the mode it shows the item in.
 * @param position The item's sequence index and the session's item count.
 * @param position.count The number of items in the session.
 * @param position.n The item's sequence index.
 * @param testTitle The test's title.
 * @returns The title.
 */
const itemTitle = (
  configuration: Configuration,
  state: ShownMode,
  position: { readonly count: number; readonly n: number },
  testTitle: string,
): string => {
  const { locale } = configuration;
  const item = message(locale, "itemOf", {
    count: numeral(locale, position.count),
    n: numeral(locale, position.n),
  });

  return message(locale, "title", {
    state: message(locale, state),
    title: `${item}, ${testTitle}`,
  });
};

/**
 * Compose a review or solution page for item `n` of a sitting: the test's title, the Status part
 * headed by the mode, the item rendered read-only in that mode, then the link back to the session
 * page: "Back to the summary" once the test has closed, "Back to the test" while an item closed in
 * an open test is shown.
 *
 * The page is served only when `permits` allows the mode for the item; otherwise, and for an `n`
 * the session lacks, it is the 404. The item is rendered with `itemView`'s instance, configuration
 * and record, so its ids, a shuffled Choice's order and a templated item's values are the ones the
 * candidate saw, and without `disabled`: the mode alone makes it read-only, so a Choice's controls
 * are disabled and a text Control is `readonly`, still a tab stop. Review shows the candidate's
 * values, marked against `solution(document, view.record)` when `permits` allows the item's
 * solution too, as its item session control's `show-solution` decides; solution shows
 * `solution(document, view.record)`.
 *
 * @param playground The playground, whose configuration the item is read with.
 * @param sitting The session and its test.
 * @param mode The view.
 * @param segment The item's sequence index, as the path wrote it.
 * @returns The page.
 */
const itemPage = (
  playground: ReviewPlayground,
  sitting: Sitting,
  mode: ShownMode,
  segment: string,
): Page => {
  const n = sequenceSegment.test(segment) ? Number(segment) : 0;
  const allowed = permits(sitting.test.test, sitting.session, n);
  if (Result.isFailure(allowed)) {
    return allowed.failure._tag === "ItemNotInSession" ? notFound() : failurePage(allowed.failure);
  }

  if (!allowed.success[mode]) {
    return notFound();
  }

  const testTitle = sitting.test.test.test.title.trim();

  return Result.match(
    Result.gen(function* composeItem() {
      const view = yield* itemView(sitting.test.test, sitting.session, playground.configuration, n);
      const document = yield* itemOf(sitting, view.ref);
      const status = yield* renderStatus(
        { heading: mode, instance: view.instance },
        view.configuration,
      );
      const correct = solution(document, view.record);
      const shown: Options = {
        assetBase: itemAssetBase(sitting, document),
        instance: view.instance,
        mode,
        values: mode === "review" ? view.values : correct,
      };
      const item = yield* render(
        redact(document, view.page, view.configuration),
        view.configuration,
        mode === "review" && allowed.success.solution ? { ...shown, solution: correct } : shown,
      );
      const { locale } = view.configuration;

      return page(
        200,
        locale,
        itemTitle(view.configuration, mode, { count: view.count, n }, testTitle),
        [
          h("h1", {}, [text(testTitle)]),
          slot(0),
          slot(1),
          h("p", {}, [
            h("a", { href: sessionHref(sitting.id) }, [
              text(
                sitting.session.status === "closed" ? "Back to the summary" : "Back to the test",
              ),
            ]),
          ]),
        ],
        [status.html, item.html],
      );
    }),
    { onFailure: failurePage, onSuccess: (composed) => composed },
  );
};

/**
 * Answer with the results document of a sitting's session: `results` over the session, the test
 * and the items it was started with, under the store's `s-` id as the session identifier and the
 * playground's origin as the system that issued it, as an XML download.
 *
 * {@link routeReview} calls it only for a closed session: the document reports each presented
 * item's template variables, which can give an answer away, so a candidate who types the address
 * mid-test gets the 404 instead.
 *
 * @param sitting The session and its test, which has closed.
 * @param origin The playground's origin, such as `http://127.0.0.1:5190`.
 * @returns The document's response, or a developer error's page when `results` refuses the input.
 */
const resultsAnswer = (sitting: Sitting, origin: string): Page | Response =>
  Result.match(
    results({
      context: { sessions: [{ identifier: sitting.id, sourceId: `${origin}/` }] },
      items: sitting.test.items,
      kind: "test",
      session: sitting.entry.session,
      test: sitting.test.test,
    }),
    {
      onFailure: failurePage,
      onSuccess: (xml) => new Response(xml, { headers: resultsHeaders }),
    },
  );

/**
 * Route one request for a session's read-only views: `GET /sessions/<sid>/review/<n>` and
 * `/solution/<n>`, each only while `permits` allows it, and `GET /sessions/<sid>/results.xml`,
 * only once the session's test has closed. Another method there is a 405 whose `Allow` names GET;
 * any other path, a session the store does not hold, an `n` the session lacks, a view its item's
 * session control forbids and the results of an open session are 404s.
 *
 * An open session's results are refused because the document reports each presented item's
 * template variables, which can give an answer away while the candidate is still answering.
 *
 * @example
 *   const outcome = await Effect.runPromise(
 *     routeReview(
 *       { configuration, packages: cache, sessions: store },
 *       new Request(`http://127.0.0.1:5190/sessions/${sid}/review/1`),
 *     ),
 *   );
 *   // item 1's review page, which the playground writes with its frame
 *
 * @param playground The configuration, the packages and the sessions.
 * @param request The request.
 * @returns The page to answer with, or the results document's response.
 */
export const routeReview = (
  playground: ReviewPlayground,
  request: Request,
): Effect.Effect<Page | Response, PackagesFailure> => {
  const url = new URL(request.url);
  const target = targetOf(url.pathname);
  if (Option.isNone(target)) {
    return Effect.succeed(notFound());
  }

  if (request.method !== "GET") {
    return Effect.succeed(
      notePage(405, "Method not allowed", `${request.method} is not taken at ${url.pathname}.`, {
        allow: "GET",
      }),
    );
  }

  const asked = target.value;

  return sittingOf(playground, asked.id, notFound()).pipe(
    Effect.withSpan("playground.review.sitting"),
    Effect.map((sitting) =>
      Result.match(sitting, {
        onFailure: (answered): Page | Response => answered,
        onSuccess: (found) => {
          if (asked.kind === "item") {
            return itemPage(playground, found, asked.mode, asked.n);
          }

          return found.session.status === "closed" ? resultsAnswer(found, url.origin) : notFound();
        },
      }),
    ),
  );
};

/**
 * Give an item's state on the summary, in words: submitted when an attempt of it was processed,
 * else answered when the responses saved on it hold a value that is not NULL, else not answered.
 *
 * Every item of a closed test is closed, so the summary tells them apart by what the candidate did.
 *
 * @param summary The item's summary.
 * @param session The session, which holds the item's saved responses.
 * @returns The state's key.
 */
const summaryState = (
  summary: SummaryItem,
  session: TestSession,
): "itemAnswered" | "itemNotAnswered" | "itemSubmitted" => {
  if (summary.numAttempts > 0) {
    return "itemSubmitted";
  }

  const saved = session.items[summary.sequenceIndex - 1]?.saved ?? Option.none();

  return Option.exists(saved, (responses) =>
    Object.values(responses).some((value) => !isNullResponse(value)),
  )
    ? "itemAnswered"
    : "itemNotAnswered";
};

/**
 * Construct one line of an item's views on the summary: the link to the view when the item permits
 * it, the words that say it is not allowed otherwise.
 *
 * @param configuration The configuration, which gives the locale.
 * @param href The view's path.
 * @param allowed Whether the item permits the view.
 * @param keys The link's text key and the refusal's.
 * @param keys.link The key of the link's text, which names the item.
 * @param keys.refused The key of the words shown instead.
 * @param n The item's sequence index, as the locale writes it.
 * @returns The list item.
 */
const viewLine = (
  configuration: Configuration,
  href: string,
  allowed: boolean,
  keys: {
    readonly link: "reviewItem" | "solutionItem";
    readonly refused: "reviewNotAllowed" | "solutionNotAllowed";
  },
  n: string,
): Element =>
  h("li", {}, [
    allowed
      ? h("a", { href }, [text(message(configuration.locale, keys.link, { n }))])
      : text(message(configuration.locale, keys.refused)),
  ]);

/**
 * Construct the summary's part for the test's own outcomes, by the state of its outcome processing.
 *
 * When the engine runs it, the part is a heading and a description list of each outcome the test
 * declares, in declaration order: its identifier, then one `dd` per value in the lexical form
 * results write (`resultValues`), or the catalog's word for NULL when it holds none; an outcome the
 * session does not hold, which a session `decodeSession` checked against the test never lacks, is
 * left out, and when that leaves no outcome the part is nothing. When the test has outcome
 * processing the engine cannot run, the heading and the sentence that it did not run, so no
 * starting value reads as a score. When the test has none, nothing.
 *
 * @param test The test the session was started from.
 * @param session The closed session, which holds the outcomes the last run left.
 * @param locale The locale of the page's words.
 * @returns The part's nodes, none when there is nothing to list.
 */
const outcomesPart = (
  test: AcceptedTest["test"],
  session: TestSession,
  locale: Locale,
): readonly Node[] => {
  const heading = h("h2", {}, [text(message(locale, "testOutcomes"))]);

  switch (test.outcomeProcessing.kind) {
    case "absent": {
      return [];
    }
    case "marked": {
      return [heading, h("p", {}, [text(message(locale, "outcomesNotRun"))])];
    }
    case "runs": {
      const entries = [...test.outcomes.keys()].flatMap((identifier) => {
        const value = session.outcomes[identifier];
        if (value === undefined) {
          return [];
        }

        const written = resultValues(value);

        return [
          h("dt", {}, [text(identifier)]),
          ...(written.length === 0 ? [message(locale, "nullValue")] : written).map((each) =>
            h("dd", {}, [text(each)]),
          ),
        ];
      });

      return entries.length === 0 ? [] : [heading, h("dl", {}, entries)];
    }
    default: {
      return test.outcomeProcessing satisfies never;
    }
  }
};

/**
 * Construct the summary page of a closed test: the test's title, the Status part headed "Test
 * finished" with `autofocus`, an ordered list of the items, each with its state and its Review and
 * Solution links where `permits` allows them and the words why where not, the test's outcomes
 * ({@link outcomesPart}), then the link that downloads the results.
 *
 * The session page shows it once `current` gives the summary. The Status region is scoped by the
 * session id, so its id is not the `<item instance>-status` a session form's action names, and a
 * browser that answers that form here focuses the region through its `autofocus`.
 *
 * @example
 *   const shown = current(test, session, configuration);
 *   // when shown is Result.succeed({ kind: "summary", … }):
 *   summaryPage(sid, test, session, shown.success, configuration);
 *
 * @param id The session id, the store's `s-` id, which is also the session's instance.
 * @param test The test the session was started from.
 * @param session The closed session.
 * @param summary The summary `current` gives for it.
 * @param configuration The playground's configuration, which gives the locale.
 * @returns The page, titled "Finished: {test title}", or a developer error's page when the Status
 *   part cannot be rendered with the id as its instance.
 */
export const summaryPage = (
  id: string,
  test: AcceptedTest,
  session: TestSession,
  summary: TestSummary,
  configuration: Configuration,
): Page => {
  const { locale } = configuration;
  const testTitle = test.test.title.trim();
  const base = sessionHref(id);
  const items: readonly Node[] = summary.items.map((item) => {
    const n = numeral(locale, item.sequenceIndex);

    return h("li", {}, [
      text(
        message(locale, "itemState", {
          item: message(locale, "item", { n }),
          state: message(locale, summaryState(item, session)),
        }),
      ),
      h("ul", {}, [
        viewLine(
          configuration,
          `${base}/review/${item.sequenceIndex}`,
          item.permits.review,
          { link: "reviewItem", refused: "reviewNotAllowed" },
          n,
        ),
        viewLine(
          configuration,
          `${base}/solution/${item.sequenceIndex}`,
          item.permits.solution,
          { link: "solutionItem", refused: "solutionNotAllowed" },
          n,
        ),
      ]),
    ]);
  });

  return Result.match(
    renderStatus({ autofocus: true, heading: "testFinished", instance: id }, configuration),
    {
      onFailure: failurePage,
      onSuccess: (status) =>
        page(
          200,
          locale,
          message(locale, "title", { state: message(locale, "finished"), title: testTitle }),
          [
            h("h1", {}, [text(testTitle)]),
            slot(0),
            h("ol", {}, items),
            ...outcomesPart(test.test, session, locale),
            h("p", {}, [
              h("a", { download: true, href: `${base}/results.xml` }, [
                text(message(locale, "downloadResults")),
              ]),
            ]),
          ],
          [status.html],
        ),
    },
  );
};

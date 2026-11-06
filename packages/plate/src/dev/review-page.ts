/**
 * The dev playground's read-only views of a test session (spec P4-26): an item in review at
 * `/sessions/<sid>/review/<n>`, an item with its correct responses at
 * `/sessions/<sid>/solution/<n>`, the session's Results Reporting document at
 * `/sessions/<sid>/results.xml`, and the closed test's summary page, which links them.
 *
 * A review or solution page is served only while `permits` allows it for item `n`, and is rendered
 * with `itemView`'s instance and configuration for that item, so a shuffled Choice shows the order
 * the candidate saw. Review shows the candidate's values; solution shows the values `solution`
 * gives, which the author passes to `render` as `values`, the only place a correct response
 * reaches a page (T-k under A; the solution page is the part a ruling of B drops). The summary is
 * a page builder, {@link summaryPage}: the session page shows it once the test has closed, and it
 * is not routed here. The results document reports the session under the store's `s-` id, which
 * the Results XSD takes as an NCName.
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
import { decodeSession } from "#plate/codec/session.ts";
import type { Configuration } from "#plate/configuration.ts";
import { page, slot } from "#plate/dev/frame.ts";
import type { Page } from "#plate/dev/frame.ts";
import { packageAssetBase, packageIds } from "#plate/dev/packages.ts";
import type { PackageCache, PackageEntry, PackagesFailure } from "#plate/dev/packages.ts";
import type { SessionEntry, SessionStore } from "#plate/dev/store.ts";
import { h, text } from "#plate/emit/node.ts";
import type { Element, Node } from "#plate/emit/node.ts";
import { message, numeral } from "#plate/messages.ts";
import { isNull } from "#plate/model/values.ts";
import type { PackageTest } from "#plate/package/open.ts";
import { redact, render, renderStatus } from "#plate/render.ts";
import { results } from "#plate/results/results.ts";
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
 * One stored session with everything its pages read: its id, its package, its test with the items
 * it was started with, and the session decoded against that test.
 */
interface Sitting {
  readonly entry: SessionEntry;
  readonly id: string;
  readonly package: PackageEntry;
  readonly session: TestSession;
  readonly test: PackageTest;
}

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
 * Give the path of a session's page, its id percent-encoded as one segment.
 *
 * @param id The session id.
 * @returns `/sessions/<sid>`.
 */
const sessionHref = (id: string): string => `/sessions/${encodeURIComponent(id)}`;

/**
 * The link at the end of every page that says one thing.
 */
const home: Element = h("p", {}, [
  h("a", { href: "/packages" }, [text("All packages")]),
  text(" · "),
  h("a", { href: "/" }, [text("All documents")]),
]);

/**
 * Construct a page that says one thing: a 404, a refused method or a developer error.
 *
 * @param status The status code.
 * @param title The page's title and heading.
 * @param said What the page says, a developer error's message included.
 * @returns The page.
 */
const notePage = (status: number, title: string, said: string): Page =>
  page(status, "en", title, [h("h1", {}, [text(title)]), h("p", {}, [text(said)]), home]);

/**
 * Construct the 404 page every refused review path answers with: an unknown session, an item the
 * session lacks, and an item its session control does not show in the asked mode.
 *
 * @returns The 404 page.
 */
const notFound = (): Page =>
  notePage(404, "Not found", "No session, or no view of its item, is at this address.");

/**
 * Construct the page of a developer error: a failure the playground's own code or state caused,
 * reported with its message.
 *
 * @param error The failure.
 * @returns The 500 page.
 */
const failurePage = (error: { readonly message: string }): Page =>
  notePage(500, "Playground error", error.message);

/**
 * Find the package at a location among the playground's packages, opening only the package whose
 * id that location gives.
 *
 * A package's id is its directory's name without `.zip.d`, or its whole location when another
 * package shares that name ({@link packageIds}), so the package is one of the two ids tried, and
 * the one whose location matches.
 *
 * @param packages The packages.
 * @param location The package's location, as `openPackage` names it.
 * @returns The package, or none when no package is at the location.
 */
const packageAt = Effect.fnUntraced(function* packageAt(
  packages: PackageCache,
  location: string,
): Effect.fn.Return<Option.Option<PackageEntry>, PackagesFailure> {
  for (const id of new Set([...packageIds([location]), location])) {
    const found = yield* packages.packageOf(id);
    if (Option.isSome(found) && found.value.location === location) {
      return found;
    }
  }

  return Option.none();
});

/**
 * Read a stored session with its package and test: the entry the store holds under the id, the
 * package at its location, the test at its href in that package, and the session decoded against
 * that test.
 *
 * An id the store does not hold is a 404. A package, test or session that does not fit the entry
 * is the playground's own fault, a developer error.
 *
 * @param playground The playground.
 * @param encoded The session id, as the request wrote it.
 * @returns The sitting, or the page that answers instead.
 */
const sittingOf = Effect.fn("playground.review.sitting")(function* sittingOf(
  playground: ReviewPlayground,
  encoded: string,
): Effect.fn.Return<Result.Result<Sitting, Page>, PackagesFailure> {
  const decoded = Result.try(() => decodeURIComponent(encoded));
  const held = Result.isSuccess(decoded) ? playground.sessions.get(decoded.success) : Option.none();
  if (Result.isFailure(decoded) || Option.isNone(held)) {
    return Result.fail(notFound());
  }

  const id = decoded.success;
  const entry = held.value;
  const found = yield* packageAt(playground.packages, entry.packageLocation);
  if (Option.isNone(found)) {
    return Result.fail(
      failurePage({
        message: `Session ${id} names the package at ${entry.packageLocation}, which is not among the playground's packages. Start the session again from its package's page.`,
      }),
    );
  }

  const { verdict } = found.value;
  const test =
    verdict.verdict === "accepted" || verdict.verdict === "accepted-with-unsupported"
      ? Option.fromUndefinedOr(
          verdict.accepted.tests.get(`${entry.packageLocation}/${entry.testHref}`),
        )
      : Option.none();
  if (Option.isNone(test)) {
    return Result.fail(
      failurePage({
        message: `Session ${id} names the test ${entry.testHref}, which the package at ${entry.packageLocation} does not hold as an accepted test (the package is ${verdict.verdict}). Start the session again from its package's page.`,
      }),
    );
  }

  return Result.mapBoth(decodeSession(entry.session, test.value.test), {
    onFailure: failurePage,
    onSuccess: (session): Sitting => ({
      entry,
      id,
      package: found.value,
      session,
      test: test.value,
    }),
  });
});

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
 * the session lacks, it is the 404. The item is rendered with `itemView`'s instance and
 * configuration, so its ids and a shuffled Choice's order are the ones the candidate saw, and
 * without `disabled`: the mode alone makes it read-only, so a Choice's controls are disabled and a
 * text Control is `readonly`, still a tab stop. Review shows the candidate's values; solution shows
 * `solution(document)`.
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
      const document = yield* Result.fromOption(
        Option.fromUndefinedOr(sitting.test.items.get(view.ref)),
        () => ({
          message: `The test ${testTitle} has no item for its item ref ${view.ref}. Restore the package at ${sitting.package.location}.`,
        }),
      );
      // A package item's document is `<package location>/<path from the package's root>`.
      const documentPath = document.document.slice(sitting.package.location.length + 1);
      const status = yield* renderStatus(
        { heading: mode, instance: view.instance },
        view.configuration,
      );
      const item = yield* render(redact(document), view.configuration, {
        assetBase: packageAssetBase(sitting.package.id, documentPath),
        instance: view.instance,
        mode,
        values: mode === "review" ? view.values : solution(document),
      });
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
 * @param sitting The session and its test.
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
 * `/solution/<n>`, each only while `permits` allows it, and `GET /sessions/<sid>/results.xml`.
 * Another method there is a 405; any other path, a session the store does not hold, an `n` the
 * session lacks and a view its item's session control forbids are 404s.
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
      notePage(405, "Method not allowed", `${request.method} is not taken at ${url.pathname}.`),
    );
  }

  const asked = target.value;

  return sittingOf(playground, asked.id).pipe(
    Effect.map((sitting) =>
      Result.match(sitting, {
        onFailure: (answered): Page | Response => answered,
        onSuccess: (found) =>
          asked.kind === "results"
            ? resultsAnswer(found, url.origin)
            : itemPage(playground, found, asked.mode, asked.n),
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
    Object.values(responses).some((value) => !isNull(value)),
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
 * Construct the summary page of a closed test: the test's title, the Status part headed "Test
 * finished" with `autofocus`, an ordered list of the items, each with its state and its Review and
 * Solution links where `permits` allows them and the words why where not, then the link that
 * downloads the results.
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

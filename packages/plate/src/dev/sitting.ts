/**
 * What the dev playground's session pages and read-only views share: a stored session read back
 * with its package and test, a session item's accepted document and the configuration it renders
 * with, the path of a session's page, and the pages that say one thing.
 *
 * `test-page.ts` answers a session's own pages and `review-page.ts` its read-only views; both read
 * a request's session through {@link sittingOf} and answer a 404 or a developer error through
 * {@link notePage}, so the two routes agree on what an id names and how a failure reads.
 *
 * Dev playground code outside the core: nothing reachable from `src/index.ts` imports it.
 *
 * @module
 */
import { Effect, Option, Result } from "effect";
import { decodeSession } from "#plate/codec/session.ts";
import { page } from "#plate/dev/frame.ts";
import type { Page } from "#plate/dev/frame.ts";
import type { Configuration } from "#plate/configuration.ts";
import { packageAssets, packageAt, testIn } from "#plate/dev/packages.ts";
import type { PackageCache, PackageEntry, PackagesFailure } from "#plate/dev/packages.ts";
import type { SessionEntry, SessionStore } from "#plate/dev/store.ts";
import { h, text } from "#plate/emit/node.ts";
import type { Element } from "#plate/emit/node.ts";
import type { PackageTest } from "#plate/package/open.ts";
import type { TestSession } from "#plate/session/session.ts";
import type { Accepted } from "#plate/validate/verdict.ts";

/**
 * One stored session with everything its pages read: its id, its store entry, its package, its
 * test with the items it was started with, and the session decoded against that test.
 */
export interface Sitting {
  readonly entry: SessionEntry;
  readonly id: string;
  readonly package: PackageEntry;
  readonly session: TestSession;
  readonly test: PackageTest;
}

/**
 * What {@link sittingOf} reads a session from: the playground's packages and its store of
 * sessions.
 */
export interface Sittings {
  readonly packages: PackageCache;
  readonly sessions: SessionStore;
}

/**
 * Give the path of a session's page, its id percent-encoded as one segment.
 *
 * @param id The session id.
 * @returns `/sessions/<sid>`.
 */
export const sessionHref = (id: string): string => `/sessions/${encodeURIComponent(id)}`;

/**
 * The links at the end of every session page and every page that says one thing.
 */
export const home: Element = h("p", {}, [
  h("a", { href: "/packages" }, [text("All packages")]),
  text(" · "),
  h("a", { href: "/" }, [text("All documents")]),
]);

/**
 * Construct a page that says one thing: a 404, a refused method or post, or a developer error.
 *
 * @param status The status code.
 * @param title The page's title and heading.
 * @param said What the page says, a developer error's message included.
 * @param headers The headers the page carries besides the page headers, such as a 405's `Allow`.
 * @returns The page.
 */
export const notePage = (
  status: number,
  title: string,
  said: string,
  headers: Readonly<Record<string, string>> = {},
): Page =>
  page(
    status,
    "en",
    title,
    [h("h1", {}, [text(title)]), h("p", {}, [text(said)]), home],
    [],
    headers,
  );

/**
 * Construct the page of a developer error: a failure the playground's own code or state caused,
 * reported with its message.
 *
 * @param error The failure.
 * @returns The 500 page.
 */
export const failurePage = (error: { readonly message: string }): Page =>
  notePage(500, "Playground error", error.message);

/**
 * Give the accepted item a session item delivers.
 *
 * @param sitting The session and its test.
 * @param ref The item ref's identifier.
 * @returns The item, or the developer error of a test that has no item for the ref.
 */
export const itemOf = (
  sitting: Sitting,
  ref: string,
): Result.Result<Accepted, { readonly message: string }> =>
  Result.fromOption(Option.fromUndefinedOr(sitting.test.items.get(ref)), () => ({
    message: `The test ${sitting.test.test.test.title.trim()} has no item for its item ref ${ref}. Restore the package at ${sitting.package.location}.`,
  }));

/**
 * Give the configuration a sitting's item renders with: the item view's, with the addresses of the
 * files its package's files route serves as its `assets` ({@link packageAssets}).
 *
 * @param sitting The session and its test.
 * @param configuration The item view's configuration.
 * @returns The configuration `render` takes for the sitting's items.
 */
export const sittingConfiguration = (
  sitting: Sitting,
  configuration: Configuration,
): Configuration => ({ ...configuration, assets: packageAssets(sitting.package) });

/**
 * Read a stored session with its package and test: the entry the store holds under the id, the
 * package at its location, the test at its href in that package, and the session decoded against
 * that test.
 *
 * An id the store does not hold is the route's own 404. A package, test or session that does not
 * fit the entry is the playground's own fault, a developer error.
 *
 * @param playground The playground's packages and sessions.
 * @param encoded The session id, as the request wrote it.
 * @param notFound The route's 404 page.
 * @returns The sitting, or the page that answers instead.
 */
export const sittingOf = Effect.fnUntraced(function* sittingOf(
  playground: Sittings,
  encoded: string,
  notFound: Page,
): Effect.fn.Return<Result.Result<Sitting, Page>, PackagesFailure> {
  const decoded = Result.try(() => decodeURIComponent(encoded));
  const held = Result.isSuccess(decoded) ? playground.sessions.get(decoded.success) : Option.none();
  if (Result.isFailure(decoded) || Option.isNone(held)) {
    return Result.fail(notFound);
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

  const test = testIn(found.value, entry.testHref);
  if (Option.isNone(test)) {
    return Result.fail(
      failurePage({
        message: `Session ${id} names the test ${entry.testHref}, which the package at ${entry.packageLocation} does not hold as an accepted test (the package is ${found.value.verdict.verdict}). Start the session again from its package's page.`,
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

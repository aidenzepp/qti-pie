/**
 * The dev playground's stores: the test sessions it has started, each under its key, and the items
 * it holds open, each under its corpus path. Nothing here is drawn: a session's key is its package,
 * its test and its attempt ({@link SessionKey}).
 *
 * The library keeps no session or record of its own (rule `a9d04969`); these stores are the
 * playground's, an example host's. Each lives in memory for the handler's life and keeps at most
 * {@link entryLimit} entries, evicting the one stored first when a new one would pass the bound, so
 * a long run of starts or opens cannot grow it without end. A test session is held only as the
 * {@link StoredTestSession} `encodeSession` writes, never the plain session, so each request reads
 * it back through `decodeSession`; an open item's record is held only as the `StoredRecord`
 * `begin` or `score` returned, so each request reads it back through `restore`, as a host that
 * keeps them elsewhere would. Neither leaves the server: the page holds only the item rendered
 * from it (H5).
 *
 * @module
 */
import { Option } from "effect";
import type { StoredTestSession } from "#plate/codec/session.ts";

/**
 * The most entries a store keeps; the one stored first is evicted first (OD-10's placeholder).
 */
const entryLimit = 100;

/**
 * A test session's key: the package's id among the playground's packages, the test document's
 * href in that package, and the attempt, 1 for the first session of the test and one more for each
 * after it.
 */
export interface SessionKey {
  readonly attempt: number;
  readonly package: string;
  readonly test: string;
}

/**
 * One session the playground holds: its attempt, the package the test came from, the test's href
 * in that package, and the session in its stored form.
 */
export interface SessionEntry {
  /**
   * The session's attempt at its test, as its {@link SessionKey} gives it.
   */
  readonly attempt: number;
  /**
   * Where the package the test belongs to is, as the playground's package routes name it.
   */
  readonly packageLocation: string;
  /**
   * The session, as `encodeSession` wrote it.
   */
  readonly session: StoredTestSession;
  /**
   * The test document's href in the package's manifest.
   */
  readonly testHref: string;
}

/**
 * Entries the playground holds by id, at most {@link entryLimit} of them.
 */
export interface Store<Entry> {
  /**
   * The entry held under an id.
   *
   * @param id The id the entry was stored under.
   * @returns The entry, or none when the store holds none under `id`, never stored or evicted.
   */
  readonly get: (id: string) => Option.Option<Entry>;
  /**
   * The ids the store holds, in the order their entries were first stored, so the playground can
   * walk every entry: its index resumes each session, and its asset route finds the package of
   * each open item.
   *
   * @returns The ids, none evicted.
   */
  readonly ids: () => readonly string[];
  /**
   * Hold an entry under an id, replacing any held there. A new id that would take the store past
   * {@link entryLimit} evicts the entry stored first; an id already held keeps its place, so
   * eviction follows the order entries were first stored.
   *
   * @param id The id.
   * @param entry The entry.
   */
  readonly set: (id: string, entry: Entry) => void;
  /**
   * How many entries the store holds.
   */
  readonly size: number;
}

/**
 * The playground's test sessions, by session id ({@link sessionId}).
 */
export type SessionStore = Store<SessionEntry>;

/**
 * Construct an empty store.
 *
 * @returns The store.
 */
export const boundedStore = <Entry>(): Store<Entry> => {
  const entries = new Map<string, Entry>();

  return {
    get: (id) => Option.fromUndefinedOr(entries.get(id)),
    ids: () => [...entries.keys()],
    set: (id, entry) => {
      entries.set(id, entry);
      for (const oldest of entries.keys()) {
        if (entries.size <= entryLimit) {
          break;
        }

        entries.delete(oldest);
      }
    },
    get size() {
      return entries.size;
    },
  };
};

/**
 * Construct an empty store of test sessions.
 *
 * @returns The store.
 */
export const sessionStore = (): SessionStore => boundedStore();

/**
 * Write a session's key as the id the store holds it under: the package, the test and the attempt,
 * each percent-encoded and joined by `/`, which a session's path writes as one segment.
 *
 * @example
 *   sessionId({ attempt: 1, package: "fixture", test: "tests/t.xml" }); // "fixture/tests%2Ft.xml/1"
 *
 * @param key The session's key.
 * @returns The id.
 */
export const sessionId = (key: SessionKey): string =>
  [key.package, key.test, String(key.attempt)].map(encodeURIComponent).join("/");

/**
 * Name a session's instance token by its attempt: `attempt-<n>`. A page shows one session, so the
 * attempt names it there; the token is one `checkInstance` passes and an NCName, so it also serves
 * as a result's `sessionIdentifier` `identifier`.
 *
 * @param attempt The session's attempt, from 1.
 * @returns The instance token, such as `attempt-1`.
 */
export const sessionInstance = (attempt: number): string => `attempt-${attempt}`;

/**
 * Give the attempt the next session of a test takes: one past the highest attempt the store holds
 * for that package and test, 1 when it holds none.
 *
 * @param store The store.
 * @param test The package's location and the test's href.
 * @returns The attempt.
 */
export const nextAttempt = (
  store: SessionStore,
  test: { readonly packageLocation: string; readonly testHref: string },
): number =>
  1 +
  Math.max(
    0,
    ...store
      .ids()
      .flatMap((id) => Option.toArray(store.get(id)))
      .filter(
        (entry) =>
          entry.packageLocation === test.packageLocation && entry.testHref === test.testHref,
      )
      .map((entry) => entry.attempt),
  );

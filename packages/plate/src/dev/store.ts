/**
 * The dev playground's stores: the test sessions it has started and the items it holds open, each
 * under the id it drew for it.
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
 * One session the playground holds: the package the test came from, the test's href in that
 * package, and the session in its stored form.
 */
export interface SessionEntry {
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
 * The playground's test sessions, by session id.
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
 * Draw a new session id: `s-` followed by a random UUID.
 *
 * The id is an NCName, so it serves as a result's `sessionIdentifier` `identifier`, and an
 * instance token `checkInstance` passes, so it serves as the session's instance.
 *
 * @returns The id, such as `s-1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed`.
 */
export const newSessionId = (): string => `s-${crypto.randomUUID()}`;

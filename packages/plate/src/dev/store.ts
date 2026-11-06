/**
 * The dev playground's store of test sessions: each session it has started, under the id it drew
 * for it, held in the form the host stores.
 *
 * The library keeps no session of its own (rule `a9d04969`); this store is the playground's, an
 * example host's. It lives in memory for the handler's life and keeps at most
 * {@link sessionLimit} sessions, evicting the one started first when a new one would pass the
 * bound, so a long run of starts cannot grow it without end. It holds a session only as the
 * {@link StoredTestSession} `encodeSession` writes, never the plain session, so each request reads
 * it back through `decodeSession`, as a host that keeps sessions elsewhere would.
 *
 * @module
 */
import { Option } from "effect";
import type { StoredTestSession } from "#plate/codec/session.ts";

/**
 * The most sessions a store keeps; the one started first is evicted first (OD-10's placeholder).
 */
const sessionLimit = 100;

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
 * The playground's test sessions, by session id, at most {@link sessionLimit} of them.
 */
export interface SessionStore {
  /**
   * The entry held under an id.
   *
   * @param id The session id, as {@link newSessionId} drew it.
   * @returns The entry, or none when the store holds none under `id`, never started or evicted.
   */
  readonly get: (id: string) => Option.Option<SessionEntry>;
  /**
   * The ids the store holds, in the order their sessions were started, so the playground's index
   * can resume each.
   *
   * @returns The ids, none evicted.
   */
  readonly ids: () => readonly string[];
  /**
   * Hold an entry under an id, replacing any held there. A new id that would take the store past
   * {@link sessionLimit} evicts the entry stored first; an id already held keeps its place, so
   * eviction follows the order sessions were started.
   *
   * @param id The session id.
   * @param entry The entry.
   */
  readonly set: (id: string, entry: SessionEntry) => void;
  /**
   * How many entries the store holds.
   */
  readonly size: number;
}

/**
 * Construct an empty store.
 *
 * @returns The store.
 */
export const sessionStore = (): SessionStore => {
  const entries = new Map<string, SessionEntry>();

  return {
    get: (id) => Option.fromUndefinedOr(entries.get(id)),
    ids: () => [...entries.keys()],
    set: (id, entry) => {
      entries.set(id, entry);
      for (const oldest of entries.keys()) {
        if (entries.size <= sessionLimit) {
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
 * Draw a new session id: `s-` followed by a random UUID.
 *
 * The id is an NCName, so it serves as a result's `sessionIdentifier` `identifier`, and an
 * instance token `checkInstance` passes, so it serves as the session's instance.
 *
 * @returns The id, such as `s-1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed`.
 */
export const newSessionId = (): string => `s-${crypto.randomUUID()}`;

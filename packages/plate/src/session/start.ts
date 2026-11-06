/**
 * Starting a test session, and reading what it shows: {@link startTest} builds the session a host
 * stores, {@link present} starts an item's first attempt when the candidate first meets it,
 * {@link recordStep} saves what one request carries, and {@link current}, {@link itemView} and
 * {@link permits} say what to render.
 *
 * Every function is pure: time is the `now` the host passes, and nothing is kept between calls.
 * Item session control, part modes and titles are not stored in the session: each read recomputes
 * them from the accepted test. This is a browser module: it value-imports from `effect` only
 * `Option`, `Array`, `Data` and `Result`.
 *
 * @module
 */
import { Array as Arr, Data, Option, Result } from "effect";
import type { Configuration } from "#plate/configuration.ts";
import { appendSegments, decodeSegment } from "#plate/document/href.ts";
import { checkInstance } from "#plate/form/encoding.ts";
import type { InstanceRequirement } from "#plate/form/encoding.ts";
import type { Item } from "#plate/model/item.ts";
import { fresh } from "#plate/model/record.ts";
import { itemRefsIn } from "#plate/model/item-refs.ts";
import type { ItemRef, Test, TestPart } from "#plate/model/test.ts";
import { itemConfiguration, sessionControls, UnknownItemRef } from "#plate/session/control.ts";
import type { SessionControl } from "#plate/session/control.ts";
import type { Responses, SessionItem, Step, TestSession } from "#plate/session/session.ts";
import type { Accepted, AcceptedTest } from "#plate/validate/verdict.ts";
import type { NavigationMode, SubmissionMode } from "#plate/vocabulary.ts";

/**
 * Why a test cannot be delivered with the items a host passed: the items have no entry for an
 * item ref (`item-missing`), or hold, under its identifier, an item from another document than the
 * one the ref names (`item-mismatch`).
 */
export type UndeliverableReason = "item-mismatch" | "item-missing";

/**
 * The failure of {@link startTest} and {@link present} when the items passed cannot deliver the
 * test: `ref` is the item ref's identifier, `expected` the document it names, and `found` the
 * document of the item held under `ref`, none when no item is.
 */
export class TestNotDeliverable extends Data.TaggedError("TestNotDeliverable")<{
  readonly expected: string;
  readonly found: Option.Option<string>;
  readonly reason: UndeliverableReason;
  readonly ref: string;
  readonly test: string;
}> {
  /**
   * The item ref, the document it names, what the items hold, and what to pass instead.
   */
  override get message(): string {
    const named = `the test ${JSON.stringify(this.test)}'s item ref ${JSON.stringify(this.ref)}, which names the document ${JSON.stringify(this.expected)}`;
    const remedy = `Pass, under the key ${JSON.stringify(this.ref)}, the item open accepted from ${JSON.stringify(this.expected)}.`;

    return Option.match(this.found, {
      onNone: () => `The items passed have no entry for ${named}. ${remedy}`,
      onSome: (found) =>
        `The items passed hold the item of ${JSON.stringify(found)} for ${named}. ${remedy}`,
    });
  }
}

/**
 * What each {@link InstanceRequirement} says a broken session instance holds.
 */
const breaches: Readonly<Record<InstanceRequirement, (token: string) => string>> = {
  characters: (token) =>
    `holds ${JSON.stringify(/[^\w.:-]/u.exec(token)?.[0] ?? "")}, which is not an ASCII letter, a digit, "_", ".", ":" or "-"`,
  "id-boundary": (token) =>
    token.endsWith("-")
      ? `ends in "-", so its items' ids can equal another instance's`
      : `holds "--", so its items' ids can equal another instance's`,
  "non-empty": () => "is empty",
};

/**
 * The failure of {@link startTest} for a session instance that breaks a requirement
 * `checkInstance` checks. Each item's instance is the session's, a `.` and its sequence index, so
 * a session instance that meets every requirement gives item instances that do too.
 */
export class InvalidSessionInstance extends Data.TaggedError("InvalidSessionInstance")<{
  readonly requirement: InstanceRequirement;
  readonly token: string;
}> {
  /**
   * The token, what it breaks, and what to pass instead.
   */
  override get message(): string {
    return `The session instance ${JSON.stringify(this.token)} in context.instance ${breaches[this.requirement](this.token)}. Pass a token of ASCII letters, digits, "_", ".", ":" and "-" that does not end in "-" and holds no "--", such as a lowercase UUID.`;
  }
}

/**
 * Where a transition's time was passed: {@link startTest}'s `context.now`, or the `now` of
 * {@link present} or {@link recordStep}.
 */
export type TimeArgument = "context.now" | "now";

/**
 * The failure of a transition passed an invalid `Date`, one whose time is `NaN`, which no ISO 8601
 * datestamp can name.
 */
export class InvalidTime extends Data.TaggedError("InvalidTime")<{
  readonly argument: TimeArgument;
}> {
  /**
   * Where the invalid time was passed, and what to pass instead.
   */
  override get message(): string {
    return `The ${this.argument} passed is an invalid Date, whose time is NaN, so the session cannot record when this transition happened. Pass a valid Date, such as new Date().`;
  }
}

/**
 * The failure of a read or a transition that names an item the session does not hold: a sequence
 * index outside 1 to `count`, or a stored session whose position is past its items.
 */
export class ItemNotInSession extends Data.TaggedError("ItemNotInSession")<{
  readonly count: number;
  readonly sequenceIndex: number;
}> {
  /**
   * The sequence index, the session's range, and what to pass instead.
   */
  override get message(): string {
    return this.count === 0
      ? `The test session has no items, so it has no item at sequence index ${this.sequenceIndex}. Read a session with items, as startTest or advance returned it.`
      : `The test session has no item at sequence index ${this.sequenceIndex}: its items are numbered 1 to ${this.count}. Pass a sequence index from 1 to ${this.count}, with the session startTest or advance returned.`;
  }
}

/**
 * What a host renders for one item of a test session.
 *
 * The host renders it with exactly these fields:
 * `render(redact(items.get(view.ref)), view.configuration, { instance: view.instance, values:
 * view.values, disabled: view.disabled })`, so a restored session presents the choice order it
 * showed.
 */
export interface ItemView {
  /**
   * The number of items in the session.
   */
  readonly count: number;
  /**
   * The configuration to render and check the item with: the host's, with the item's session
   * control written in by `itemConfiguration`, and the session's seed in place of the host's, no
   * seed when the session stores none.
   */
  readonly configuration: Configuration;
  /**
   * Whether the item is closed: its part has ended, the test has closed, or its attempt limit is
   * above 0 and reached. Its controls render disabled, and `advance` ignores the responses a step
   * carries for it, so its `values` stay the ones it closed with whatever a host posts.
   */
  readonly disabled: boolean;
  /**
   * The item's instance: the session's instance, a `.` and its sequence index.
   */
  readonly instance: string;
  readonly kind: "item";
  /**
   * The navigation mode of the item's part.
   */
  readonly navigation: NavigationMode;
  /**
   * The item ref's identifier, the key of its accepted item among the items the host passes.
   */
  readonly ref: string;
  readonly sequenceIndex: number;
  /**
   * The submission mode of the item's part.
   */
  readonly submission: SubmissionMode;
  /**
   * The values to show: each response's saved value, else its record's.
   */
  readonly values: Responses;
}

/**
 * What a closed item may be shown in: `review` when it allows review, `solution` when it shows its
 * solution. An open item permits neither.
 */
export interface Permits {
  readonly review: boolean;
  readonly solution: boolean;
}

/**
 * One item of a closed test's summary: its place, whether the candidate met it, how many attempts
 * were processed, and what it may be shown in.
 */
export interface SummaryItem {
  readonly numAttempts: number;
  readonly permits: Permits;
  readonly presented: boolean;
  readonly ref: string;
  readonly sequenceIndex: number;
}

/**
 * What a closed test shows instead of an item: each of its items, in sequence.
 */
export interface TestSummary {
  readonly items: readonly SummaryItem[];
  readonly kind: "summary";
}

/**
 * What a test session shows now: the current item while the test is open, the summary once it is
 * closed.
 */
export type Current = ItemView | TestSummary;

/**
 * An item ref and the test part that holds it.
 */
interface Place {
  readonly part: TestPart;
  readonly ref: ItemRef;
}

/**
 * List a test's item refs in the order the candidate meets them, each with its part.
 *
 * The test model leaves out or holds inert every feature the session does not deliver, so the
 * walk is the document order of parts, sections and item refs.
 *
 * @param test The test.
 * @returns Each item ref with its part.
 */
const placesOf = (test: Test): readonly Place[] =>
  test.parts.flatMap((part) => itemRefsIn(part.children).map((ref) => ({ part, ref })));

/**
 * What a read of a session derives from the test once, so each item it reads is looked up instead
 * of found by walking the test again, which would grow with the square of the item count.
 */
interface Index {
  /**
   * Each item ref's session control, by identifier.
   */
  readonly controls: ReadonlyMap<string, SessionControl>;
  /**
   * The identifiers of the session's ended parts.
   */
  readonly ended: ReadonlySet<string>;
  /**
   * Each item ref's place, by identifier.
   */
  readonly places: ReadonlyMap<string, Place>;
  /**
   * The test's identifier, which an {@link UnknownItemRef} names.
   */
  readonly test: string;
}

/**
 * Derive what a read of a session looks its items up in, in one walk of the test each.
 *
 * An identifier keeps its first item ref in document order, as a search of the test finds it.
 *
 * @param test The test.
 * @param session The session.
 * @returns The index.
 */
const indexOf = (test: Test, session: TestSession): Index => {
  const places = new Map<string, Place>();
  for (const place of placesOf(test)) {
    if (!places.has(place.ref.identifier)) {
      places.set(place.ref.identifier, place);
    }
  }

  return {
    controls: sessionControls(test),
    ended: new Set(
      session.parts.filter((part) => part.status === "ended").map((part) => part.identifier),
    ),
    places,
    test: test.identifier,
  };
};

/**
 * Look up an item ref's entry in one of an index's maps.
 *
 * @param index The index.
 * @param entries The map.
 * @param ref The item ref's identifier.
 * @returns The entry, or {@link UnknownItemRef} when the test holds no item ref of that identifier.
 */
const lookUp = <A>(
  index: Index,
  entries: ReadonlyMap<string, A>,
  ref: string,
): Result.Result<A, UnknownItemRef> =>
  Result.fromOption(
    Option.fromUndefinedOr(entries.get(ref)),
    () => new UnknownItemRef({ ref, test: index.test }),
  );

/**
 * The parts of a URI reference (RFC 3986 §3) that locate a document: its scheme and authority,
 * each absent when the reference does not have it, and its path. A query and a fragment locate
 * nothing in a document's location, so they are set aside.
 */
interface Reference {
  readonly authority: string | undefined;
  readonly path: string;
  readonly scheme: string | undefined;
}

/**
 * RFC 3986 Appendix B's pattern, which splits any string into the five parts of a URI reference.
 *
 * @see https://www.rfc-editor.org/rfc/rfc3986#appendix-B
 */
const referenceParts =
  /^(?:(?<scheme>[^:/?#]+):)?(?:\/\/(?<authority>[^/?#]*))?(?<path>[^?#]*)(?:\?[^#]*)?(?:#.*)?$/su;

/**
 * Split a URI reference into the parts that locate a document.
 *
 * @param value The reference.
 * @returns Its scheme, authority and path; its query and fragment are dropped.
 */
const parseReference = (value: string): Reference => {
  const parts = referenceParts.exec(value)?.groups ?? {};

  return { authority: parts["authority"], path: parts["path"] ?? "", scheme: parts["scheme"] };
};

/**
 * Remove the `.` and `..` segments of a path (RFC 3986 §5.2.4), each segment read through a
 * decoding first.
 *
 * A path without a root, such as a URN's, is read as though it began at one, so a `..` that would
 * rise above its first segment is dropped, as one rising above a root is, and the result stays
 * relative. {@link appendSegments} decodes each segment before it removes the dot segments, as the
 * manifest reader does, so `%2E%2E` climbs as `..` does on both sides.
 *
 * @param path The path.
 * @param decode How each segment is read.
 * @returns The path without dot segments, its segments decoded.
 * @see https://www.rfc-editor.org/rfc/rfc3986#section-5.2.4
 */
const removeDotSegments = (path: string, decode: (segment: string) => string): string => {
  const rooted = path.startsWith("/");
  const { segments } = appendSegments([], (rooted ? path.slice(1) : path).split("/"), decode);

  return `${rooted ? "/" : ""}${segments.join("/")}`;
};

/**
 * Append a relative path to the directory of a base's path (RFC 3986 §5.2.3) through
 * {@link appendSegments}, the rule `openPackage` resolves an item ref by: each of the path's
 * segments is decoded, a segment with a malformed escape left as written, and its dot segments are
 * removed against the base's, while the base's own segments stay as written, a `.`, an escape, a
 * `?` or a `#` among them.
 *
 * A rooted base's `..` that would rise above its root is dropped. A base without a root is read as
 * though it began at one, so a `..` that would rise above its first segment is dropped too, and the
 * result stays relative.
 *
 * @param base The base's path as written, after its scheme and authority.
 * @param rooted Whether the base's path is rooted: it starts with `/`, or the base has an authority
 *   and an empty path.
 * @param path The relative path, which does not start with `/`.
 * @returns The path the two name.
 * @see https://www.rfc-editor.org/rfc/rfc3986#section-5.2.3
 */
const appendedPath = (base: string, rooted: boolean, path: string): string => {
  const directory = (rooted ? base.slice(1) : base).split("/").slice(0, -1);
  const { segments } = appendSegments(directory, path.split("/"), decodeSegment);

  return `${rooted ? "/" : ""}${segments.join("/")}`;
};

/**
 * Write a location from its scheme, its authority and its path, leaving out a part it lacks.
 *
 * @param scheme The scheme, without its colon.
 * @param authority The authority, without its `//`.
 * @param path The path.
 * @returns The location.
 */
const located = (scheme: string | undefined, authority: string | undefined, path: string): string =>
  [
    scheme === undefined ? "" : `${scheme}:`,
    authority === undefined ? "" : `//${authority}`,
    path,
  ].join("");

/**
 * Give the document an item ref names: its `href` resolved against the test document's location
 * by the rule `openPackage` resolves an item ref against its test's path, so a test a package
 * accepted starts with the items the package resolved for it. The `href`'s query and fragment are
 * set aside.
 *
 * A package names each document by the package's location, a `/` and the file's real name, and
 * resolves a relative `href` against the test's real name with only the `href`'s segments decoded
 * ({@link appendedPath}). So the test document's location is taken as written, whatever its
 * segments hold, and `items/a%20b.xml` names the file `items/a b.xml` beside it. An `href` that
 * starts with `/` keeps the test document's scheme and authority and replaces its path, its
 * segments decoded the same way. An `href` with a scheme or an authority is a URI, kept as written
 * but for its dot segments. A package refuses both as naming no file inside it.
 *
 * @param test The test.
 * @param ref The item ref.
 * @returns The location of the document the ref names.
 */
const namedDocument = (test: Test, ref: ItemRef): string => {
  const reference = parseReference(ref.href);
  const base = parseReference(test.document);
  if (reference.scheme !== undefined || reference.authority !== undefined) {
    return located(
      reference.scheme ?? base.scheme,
      reference.authority,
      removeDotSegments(reference.path, (segment) => segment),
    );
  }

  const origin = located(base.scheme, base.authority, "");
  if (reference.path.startsWith("/")) {
    return `${origin}${removeDotSegments(reference.path, decodeSegment)}`;
  }

  const path = test.document.slice(origin.length);
  const rooted = path.startsWith("/") || (base.authority !== undefined && path === "");

  return `${origin}${appendedPath(path, rooted, reference.path)}`;
};

/**
 * Find the accepted item the host passed for an item ref, and check it is the ref's.
 *
 * @param items The items, keyed by item ref identifier.
 * @param test The test's identifier.
 * @param ref The item ref's identifier.
 * @param expected The document the ref names.
 * @returns The item, or {@link TestNotDeliverable}: `item-missing` when the items have no entry
 *   for the ref, `item-mismatch` when its entry is the item of another document.
 */
const deliverable = (
  items: ReadonlyMap<string, Accepted>,
  test: string,
  ref: string,
  expected: string,
): Result.Result<Accepted, TestNotDeliverable> => {
  const accepted = items.get(ref);
  if (accepted === undefined) {
    return Result.fail(
      new TestNotDeliverable({ expected, found: Option.none(), reason: "item-missing", ref, test }),
    );
  }

  return accepted.document === expected
    ? Result.succeed(accepted)
    : Result.fail(
        new TestNotDeliverable({
          expected,
          found: Option.some(accepted.document),
          reason: "item-mismatch",
          ref,
          test,
        }),
      );
};

/**
 * Write a transition's time as an ISO 8601 UTC datestamp.
 *
 * @param now The time.
 * @param argument Where it was passed.
 * @returns The datestamp, or {@link InvalidTime} for an invalid `Date`.
 */
const datestampOf = (now: Date, argument: TimeArgument): Result.Result<string, InvalidTime> =>
  Number.isNaN(now.getTime())
    ? Result.fail(new InvalidTime({ argument }))
    : Result.succeed(now.toISOString());

/**
 * Give each declared response default of an item, by response identifier.
 *
 * @param item The item.
 * @returns The `qti-default-value` of each response declaration that has one.
 */
const responseDefaults = (item: Item): Responses =>
  Object.fromEntries(
    [...item.responses.values()].flatMap((response) =>
      Option.match(response.defaultValue, {
        onNone: () => [],
        onSome: (value) => [[response.identifier, value] as const],
      }),
    ),
  );

/**
 * Find a session item by its sequence index.
 *
 * @param session The session.
 * @param sequenceIndex The sequence index, counted from 1.
 * @returns The item's index in `session.items` and the item, or {@link ItemNotInSession}.
 */
const itemAt = (
  session: TestSession,
  sequenceIndex: number,
): Result.Result<readonly [number, SessionItem], ItemNotInSession> =>
  Result.fromOption(
    Arr.findFirst(session.items, (item, index) =>
      item.sequenceIndex === sequenceIndex ? Option.some([index, item] as const) : Option.none(),
    ),
    () => new ItemNotInSession({ count: session.items.length, sequenceIndex }),
  );

/**
 * Find a session's current item: the item at its position.
 *
 * @param session The session.
 * @returns The item's index in `session.items` and the item, or {@link ItemNotInSession} when the
 *   position is past the items.
 */
const itemAtPosition = (
  session: TestSession,
): Result.Result<readonly [number, SessionItem], ItemNotInSession> => {
  const item = session.items[session.position];

  return item === undefined
    ? Result.fail(
        new ItemNotInSession({
          count: session.items.length,
          sequenceIndex: session.position + 1,
        }),
      )
    : Result.succeed([session.position, item]);
};

/**
 * Replace one item of a session.
 *
 * @param session The session.
 * @param index The item's index in `session.items`.
 * @param item The item to put there.
 * @returns The session's items with `item` at `index`.
 */
export const withItem = (
  session: TestSession,
  index: number,
  item: SessionItem,
): readonly SessionItem[] =>
  session.items.map((existing, position) => (position === index ? item : existing));

/**
 * Mark a session item presented and start its first attempt, writing each declared response
 * default into its record.
 *
 * @param item The session item, not yet presented.
 * @param accepted The item it delivers.
 * @param datestamp The time of the transition, in ISO 8601.
 * @returns The item, presented.
 */
const presented = (item: SessionItem, accepted: Accepted, datestamp: string): SessionItem => ({
  ...item,
  datestamp,
  presented: true,
  record: {
    ...item.record,
    responses: { ...item.record.responses, ...responseDefaults(accepted.item) },
  },
});

/**
 * Mark an item of a session presented, starting its first attempt when it was not.
 *
 * An attempt starts when the item's session first enters interacting: at its first presentation
 * in answering mode. That writes each declared response default into the item's record
 * (`info.txt:8462`), so a response with a `qti-default-value` holds it from then on, and an item
 * never presented keeps NULL. Presenting an item already presented changes nothing. The moves and
 * a part's end call this for the item they show.
 *
 * @example
 *   present(items, session, 2, new Date()); // item 2 presented, its response defaults written
 *
 * @param items The accepted items, keyed by item ref identifier, as {@link startTest} took them.
 * @param session The session.
 * @param sequenceIndex The item's sequence index, counted from 1.
 * @param now The time of the transition.
 * @returns The session with the item presented; {@link ItemNotInSession} for a sequence index the
 *   session lacks; {@link TestNotDeliverable} when the items have no entry for the item's ref, or
 *   one from another document than its record's; {@link InvalidTime} for an invalid `now`.
 */
export const present = (
  items: ReadonlyMap<string, Accepted>,
  session: TestSession,
  sequenceIndex: number,
  now: Date,
): Result.Result<TestSession, InvalidTime | ItemNotInSession | TestNotDeliverable> =>
  Result.gen(function* presentItem() {
    const datestamp = yield* datestampOf(now, "now");
    const [index, item] = yield* itemAt(session, sequenceIndex);
    if (item.presented) {
      return session;
    }

    const accepted = yield* deliverable(items, session.test, item.ref, item.record.document);

    return { ...session, items: withItem(session, index, presented(item, accepted, datestamp)) };
  });

/**
 * Give the status each part starts in: the first part that holds an item is current, the parts
 * before it have ended, and the parts after it are pending. A part with no item has nothing to
 * take, so it ends as the candidate reaches it.
 *
 * @param parts The test's parts.
 * @param first The part of the test's first item, none when the test has no item.
 * @returns Each part's identifier and status, in order.
 */
const startingParts = (
  parts: readonly TestPart[],
  first: Option.Option<TestPart>,
): TestSession["parts"] => {
  const current = Option.match(first, {
    onNone: () => parts.length,
    onSome: (part) => parts.indexOf(part),
  });

  return parts.map((part, index) => {
    if (index < current) {
      return { identifier: part.identifier, status: "ended" };
    }

    return { identifier: part.identifier, status: index === current ? "current" : "pending" };
  });
};

/**
 * Check a session instance token.
 *
 * @param token The token passed as `context.instance`.
 * @returns The token, or {@link InvalidSessionInstance} naming the first requirement it breaks.
 */
const checkedInstance = (token: string): Result.Result<string, InvalidSessionInstance> =>
  Option.match(checkInstance(token), {
    onNone: () => Result.succeed(token),
    onSome: (requirement) => Result.fail(new InvalidSessionInstance({ requirement, token })),
  });

/**
 * Start a test session.
 *
 * The items are the test's item refs in document order, numbered from 1, each starting from a
 * fresh record whose instance is `<instance>.<sequenceIndex>`. The first part that holds an item
 * is current and its first item is presented, which starts its first attempt as {@link present}
 * does. The session stores `configuration.seed`, so a restored session presents the choice order
 * it showed whatever seed the host passes later. A test with no item at all starts closed.
 *
 * @example
 *   startTest(test, items, configuration, { instance: crypto.randomUUID(), now: new Date() });
 *
 * @param test The test, as `check` accepted it.
 * @param items The test's items, each as `check` accepted it, keyed by the identifier of the item
 *   ref that names its document.
 * @param configuration The host's configuration, whose `seed` the session keeps.
 * @param context The sitting.
 * @param context.instance The host's name for this sitting, which scopes every item's ids: a token
 *   `checkInstance` passes, such as a lowercase UUID.
 * @param context.now When the session starts.
 * @returns The session; {@link TestNotDeliverable} when the items have no entry for an item ref
 *   (`item-missing`) or hold one from another document than the ref names (`item-mismatch`);
 *   {@link InvalidSessionInstance} for an instance that breaks a requirement; {@link InvalidTime}
 *   for an invalid `now`.
 */
export const startTest = (
  test: AcceptedTest,
  items: ReadonlyMap<string, Accepted>,
  configuration: Configuration,
  context: { readonly instance: string; readonly now: Date },
): Result.Result<TestSession, InvalidSessionInstance | InvalidTime | TestNotDeliverable> =>
  Result.gen(function* startSession() {
    const instance = yield* checkedInstance(context.instance);
    const datestamp = yield* datestampOf(context.now, "context.now");
    const places = placesOf(test.test);
    const delivered = yield* Result.all(
      places.map(({ ref }, index) =>
        Result.map(
          deliverable(items, test.test.identifier, ref.identifier, namedDocument(test.test, ref)),
          (accepted) => {
            const item: SessionItem = {
              datestamp,
              duration: 0,
              firstOutcomes: Option.none(),
              presented: false,
              record: fresh(accepted.item, `${instance}.${index + 1}`),
              ref: ref.identifier,
              saved: Option.none(),
              sequenceIndex: index + 1,
            };

            return index === 0 ? presented(item, accepted, datestamp) : item;
          },
        ),
      ),
    );
    const first = Option.map(Arr.head(places), (place) => place.part);
    const session: TestSession = {
      document: test.test.document,
      instance,
      items: delivered,
      kind: "test",
      parts: startingParts(test.test.parts, first),
      position: 0,
      seed: Option.fromUndefinedOr(configuration.seed),
      started: datestamp,
      status: Option.isSome(first) ? "interacting" : "closed",
      test: test.test.identifier,
      updated: datestamp,
    };

    return session;
  });

/**
 * Add the time since a session's last transition to an item's duration.
 *
 * Durations are whole tenths of a second, the interval truncated to one; an interval that is
 * negative, or that a stored `updated` no `Date` reads cannot give, adds nothing.
 *
 * @param duration The item's duration, in seconds.
 * @param updated The session's last transition, in ISO 8601.
 * @param now The time of this transition.
 * @returns The duration with the interval added.
 */
const addedDuration = (duration: number, updated: string, now: Date): number => {
  const interval = now.getTime() - Date.parse(updated);
  const tenths = Number.isFinite(interval) && interval > 0 ? Math.trunc(interval / 100) : 0;

  return (Math.round(duration * 10) + tenths) / 10;
};

/**
 * Save what one request carries on a session's current item.
 *
 * The step's responses, when it carries any, become the item's saved responses; the interval since
 * the session's last transition is added to the item's duration, since the current item is shown
 * in answering mode; the item's datestamp and the session's `updated` become `now`. A closed test
 * has no current item and is returned unchanged. This is the one place a step is saved: the moves
 * and the submissions call it first.
 *
 * @param session The session.
 * @param step The request: its intent, and the responses posted with it.
 * @param now The time of the transition.
 * @returns The session with the step saved; {@link ItemNotInSession} for a session whose position
 *   is past its items; {@link InvalidTime} for an invalid `now`.
 */
export const recordStep = (
  session: TestSession,
  step: Step,
  now: Date,
): Result.Result<TestSession, InvalidTime | ItemNotInSession> =>
  Result.gen(function* recordOne() {
    const datestamp = yield* datestampOf(now, "now");
    if (session.status === "closed") {
      return session;
    }

    const [index, item] = yield* itemAtPosition(session);
    const saved = step.responses === undefined ? item.saved : Option.some(step.responses);

    return {
      ...session,
      items: withItem(session, index, {
        ...item,
        datestamp,
        duration: addedDuration(item.duration, session.updated, now),
        saved,
      }),
      updated: datestamp,
    };
  });

/**
 * Everything a read derives for one session item from the test.
 */
interface Inspected {
  readonly closed: boolean;
  readonly configuration: Configuration;
  readonly control: SessionControl;
  readonly place: Place;
}

/**
 * Derive an item's place, session control, configuration and whether it is closed.
 *
 * An item is closed when the test has closed, when its part has ended, or when its effective
 * attempt limit is above 0 and the record's `numAttempts`, the count of processed attempts, has
 * reached it.
 *
 * @param index The test, indexed for the session.
 * @param session The session.
 * @param configuration The host's configuration.
 * @param item The session item.
 * @returns What the read needs, or {@link UnknownItemRef} when the test holds no item ref the item
 *   names.
 */
const inspect = (
  index: Index,
  session: TestSession,
  configuration: Configuration,
  item: SessionItem,
): Result.Result<Inspected, UnknownItemRef> =>
  Result.gen(function* inspectItem() {
    const place = yield* lookUp(index, index.places, item.ref);
    const control = yield* lookUp(index, index.controls, item.ref);
    const { seed: _hostSeed, ...withControl } = itemConfiguration(configuration, control);
    const ended = index.ended.has(place.part.identifier);
    const limit = withControl.maxAttempts;

    return {
      closed:
        session.status === "closed" || ended || (limit > 0 && item.record.numAttempts >= limit),
      configuration: Option.match(session.seed, {
        onNone: () => withControl,
        onSome: (seed) => ({ ...withControl, seed }),
      }),
      control,
      place,
    };
  });

/**
 * Give an item's values: each response's saved value, else its record's.
 *
 * @param item The session item.
 * @returns The values, by response identifier.
 */
const valuesOf = (item: SessionItem): Responses =>
  Option.match(item.saved, {
    onNone: () => item.record.responses,
    onSome: (saved) => ({ ...item.record.responses, ...saved }),
  });

/**
 * Build the view of one session item.
 *
 * @param index The test, indexed for the session.
 * @param session The session.
 * @param configuration The host's configuration.
 * @param item The session item.
 * @returns The view, or {@link UnknownItemRef}.
 */
const viewOf = (
  index: Index,
  session: TestSession,
  configuration: Configuration,
  item: SessionItem,
): Result.Result<ItemView, UnknownItemRef> =>
  Result.map(inspect(index, session, configuration, item), (inspected) => ({
    configuration: inspected.configuration,
    count: session.items.length,
    disabled: inspected.closed,
    instance: `${session.instance}.${item.sequenceIndex}`,
    kind: "item",
    navigation: inspected.place.part.navigation,
    ref: item.ref,
    sequenceIndex: item.sequenceIndex,
    submission: inspected.place.part.submission,
    values: valuesOf(item),
  }));

/**
 * Give what any item of a test session renders with: its instance, configuration, values and
 * disabled state, as it was presented, so a review or a solution page shows the choice order the
 * candidate saw.
 *
 * @param test The test the session was started from.
 * @param session The session.
 * @param configuration The host's configuration.
 * @param sequenceIndex The item's sequence index, counted from 1.
 * @returns The item's view; {@link ItemNotInSession} for a sequence index the session lacks;
 *   {@link UnknownItemRef} when the test holds no item ref the item names, as when the session
 *   belongs to another test.
 */
export const itemView = (
  test: AcceptedTest,
  session: TestSession,
  configuration: Configuration,
  sequenceIndex: number,
): Result.Result<ItemView, ItemNotInSession | UnknownItemRef> =>
  Result.flatMap(itemAt(session, sequenceIndex), ([, item]) =>
    viewOf(indexOf(test.test, session), session, configuration, item),
  );

/**
 * Give the views of several items of a test session, as {@link itemView} gives each, reading the
 * test once for all of them.
 *
 * A read of every item, such as a navigation's, takes its views here: a call of {@link itemView}
 * per item reads the whole test and session each time, which grows with the square of the item
 * count.
 *
 * @example
 *   itemViews(test, session, configuration, [1, 2, 3]); // the views of items 1 to 3, in that order
 *
 * @param test The test the session was started from.
 * @param session The session.
 * @param configuration The host's configuration.
 * @param sequenceIndices The items' sequence indices, each counted from 1.
 * @returns Each item's view, in the order of `sequenceIndices`; {@link ItemNotInSession} for the
 *   first sequence index the session lacks; {@link UnknownItemRef} when the test holds no item ref
 *   an item names, as when the session belongs to another test.
 */
export const itemViews = (
  test: AcceptedTest,
  session: TestSession,
  configuration: Configuration,
  sequenceIndices: readonly number[],
): Result.Result<readonly ItemView[], ItemNotInSession | UnknownItemRef> => {
  const index = indexOf(test.test, session);
  const bySequence = new Map<number, SessionItem>();
  for (const item of session.items) {
    if (!bySequence.has(item.sequenceIndex)) {
      bySequence.set(item.sequenceIndex, item);
    }
  }

  return Result.all(
    sequenceIndices.map((sequenceIndex) =>
      Result.flatMap(
        Result.fromOption(
          Option.fromUndefinedOr(bySequence.get(sequenceIndex)),
          () => new ItemNotInSession({ count: session.items.length, sequenceIndex }),
        ),
        (item) => viewOf(index, session, configuration, item),
      ),
    ),
  );
};

/**
 * The configuration a reader of a session passes where the test and the session alone decide what
 * it reads: {@link permits}' attempt limit, `allowedIntents`' current item view, and
 * `navigationState`'s item views.
 *
 * `itemConfiguration` writes every session-control field over the configuration it is given, so an
 * item's attempt limit, its closed state and its part's modes depend on the test and the session
 * alone, and none of these values reaches what the reader gives.
 */
export const readingBase: Configuration = {
  allowComment: false,
  allowReview: true,
  allowSkipping: true,
  assetBase: "",
  headingLevel: 2,
  locale: "en",
  maxAttempts: 1,
  showFeedback: false,
  showSolution: false,
  validateResponses: false,
};

/**
 * Say what one session item may be shown in.
 *
 * @param index The test, indexed for the session.
 * @param session The session.
 * @param item The session item.
 * @returns Its permissions, or {@link UnknownItemRef}.
 */
const permitsOf = (
  index: Index,
  session: TestSession,
  item: SessionItem,
): Result.Result<Permits, UnknownItemRef> =>
  Result.map(inspect(index, session, readingBase, item), ({ closed, control }) => ({
    review: closed && control.allowReview,
    solution: closed && control.showSolution,
  }));

/**
 * Say whether an item of a test session may be shown in review or in solution: review when it is
 * closed and its `allow-review` holds, solution when it is closed and its `show-solution` holds.
 *
 * @param test The test the session was started from.
 * @param session The session.
 * @param sequenceIndex The item's sequence index, counted from 1.
 * @returns The item's permissions; {@link ItemNotInSession} for a sequence index the session
 *   lacks; {@link UnknownItemRef} when the test holds no item ref the item names.
 */
export const permits = (
  test: AcceptedTest,
  session: TestSession,
  sequenceIndex: number,
): Result.Result<Permits, ItemNotInSession | UnknownItemRef> =>
  Result.flatMap(itemAt(session, sequenceIndex), ([, item]) =>
    permitsOf(indexOf(test.test, session), session, item),
  );

/**
 * Give what a test session shows now: the current item's view while the test is open, the summary
 * of every item once it is closed.
 *
 * @example
 *   const shown = current(test, session, configuration);
 *   // Result.succeed({ kind: "item", instance: "<instance>.1", … }) on a session just started
 *
 * @param test The test the session was started from.
 * @param session The session.
 * @param configuration The host's configuration.
 * @returns The view or the summary; {@link ItemNotInSession} for an open session whose position is
 *   past its items; {@link UnknownItemRef} when the test holds no item ref an item names.
 */
export const current = (
  test: AcceptedTest,
  session: TestSession,
  configuration: Configuration,
): Result.Result<Current, ItemNotInSession | UnknownItemRef> => {
  const index = indexOf(test.test, session);
  if (session.status === "interacting") {
    return Result.flatMap(itemAtPosition(session), ([, item]) =>
      viewOf(index, session, configuration, item),
    );
  }

  return Result.map(
    Result.all(
      session.items.map((item) =>
        Result.map(permitsOf(index, session, item), (granted): SummaryItem => ({
          numAttempts: item.record.numAttempts,
          permits: granted,
          presented: item.presented,
          ref: item.ref,
          sequenceIndex: item.sequenceIndex,
        })),
      ),
    ),
    (items): TestSummary => ({ items, kind: "summary" }),
  );
};

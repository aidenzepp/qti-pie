/**
 * Starting a test session, and reading what it shows: {@link startTest} builds the session a host
 * stores, {@link partStarted} computes a nonlinear part's template defaults as the part starts,
 * {@link present} starts an item's first attempt when the candidate first meets it,
 * {@link recordStep} saves what one request carries, and {@link current}, {@link itemView} and
 * {@link permits} say what to render.
 *
 * Nothing is kept between calls, and time is the `now` the host passes. Every function is pure but
 * {@link startTest}, which draws the session's processing seed (`drawSeed`) when its context gives
 * none. Item session control, part modes and titles are not stored in the session: each read
 * recomputes them from the accepted test. This is a browser module: it value-imports from `effect`
 * only `Option`, `Array`, `Data` and `Result`.
 *
 * @module
 */
import { Array as Arr, Data, Option, Result } from "effect";
import type { Configuration } from "#plate/configuration.ts";
import { appendSegments, decodeSegment } from "#plate/document/href.ts";
import { adaptivePolicy } from "#plate/engine/adaptive.ts";
import { firstAttempt } from "#plate/engine/attempt.ts";
import type { EngineFailure } from "#plate/engine/evaluate.ts";
import { testScopeOf } from "#plate/engine/outcome.ts";
import type { TestScope } from "#plate/engine/scope.ts";
import { defaultLabel, drawStream } from "#plate/engine/random.ts";
import { checkTemplateDefaults, evaluateTemplateDefaults } from "#plate/engine/template.ts";
import { checkInstance } from "#plate/form/encoding.ts";
import type { InstanceRequirement } from "#plate/form/encoding.ts";
import { fresh, startingValue } from "#plate/model/record.ts";
import type { ItemRecord } from "#plate/model/record.ts";
import { itemRefsIn, refIdentifiersIn } from "#plate/model/item-refs.ts";
import type { ItemRef, Section, SectionChild, Test, TestPart } from "#plate/model/test.ts";
import type { Value } from "#plate/model/values.ts";
import { defaultOutputBudget } from "#plate/output-budget.ts";
import { drawSeed } from "#plate/seed.ts";
import { commentModule } from "#plate/session/comment.ts";
import {
  attemptLimits,
  itemConfiguration,
  sessionControls,
  UnknownItemRef,
} from "#plate/session/control.ts";
import type { SessionControl } from "#plate/session/control.ts";
import type { Responses, SessionItem, Step, TestSession } from "#plate/session/session.ts";
import type { TestContent, TimedScope } from "#plate/test-features/contract.ts";
import { enteredBy, presentedBy, sequencedBy } from "#plate/test-features/dispatch.ts";
import { testFeatures } from "#plate/test-features/table.ts";
import type { TestFeatureTable } from "#plate/test-features/table.ts";
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
 * `render(redact(items.get(view.ref), view.record, view.configuration), view.configuration, {
 * instance: view.instance, values: view.values, disabled: view.disabled })`, so a restored session
 * presents the choice order and the template values it showed.
 *
 * The view is server data, since its `record` is: the host reads it on the server and sends the
 * page only what `render` writes.
 */
export interface ItemView {
  /**
   * The comment the item holds, as the comment module (`#plate/session/comment.ts`) keeps it: the
   * host passes it to `render` as `Options.comment`, so the item shows the comment it holds. None
   * for every item while the module is a stub.
   */
  readonly comment: Option.Option<string>;
  /**
   * The number of items in the session.
   */
  readonly count: number;
  /**
   * The configuration to render and check the item with: the host's, with the item's session
   * control written in by `itemConfiguration`, and the session's shuffle seed in place of the
   * host's `seed`, so a restored session presents the choice order it showed. With no shuffle seed
   * it has no `seed`, so a shuffle follows the instance alone, as `render`'s does with none,
   * whatever `seed` the host's configuration holds. It never carries the session's processing
   * seed.
   */
  readonly configuration: Configuration;
  /**
   * The content the test-feature modules present with the item, each module's nodes in table order
   * ({@link TestContent}): a rubric block, a test feedback. The host renders it beside the item
   * through `renderTestContent` (`#plate/session/content.ts`). Empty while every module is a stub,
   * and for an item no module presents anything at. It is server data like the rest of the view,
   * and holds nothing of the session a module did not choose to show.
   */
  readonly content: readonly TestContent[];
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
   * The decoded record of the item it shows: the record its first presentation started, through
   * `firstAttempt`, and each processed attempt's after it. The host passes it to `redact`,
   * `checkResponses` and `solution`, so the item shows, checks and solves with the template values
   * its record holds. It is server data: its template values and correct responses can give the
   * answers away, so it never reaches the page.
   */
  readonly record: ItemRecord;
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
 * What a closed test shows instead of an item: each of its items, in sequence, and the content the
 * test-feature modules present with the summary, as {@link ItemView.content} holds an item's.
 */
export interface TestSummary {
  readonly content: readonly TestContent[];
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
 * List a test's item refs in document order, each with its part: the order the candidate meets
 * them, until a test-feature module that selects or orders lands, which `startTest` consults
 * through `sequencedBy` over these places.
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
 * Find a section by identifier among some section children, nested sections included.
 *
 * @param children The children.
 * @param identifier The section's identifier.
 * @returns The section, none when no section among the children has the identifier.
 */
const sectionIn = (children: readonly SectionChild[], identifier: string): Option.Option<Section> =>
  Arr.findFirst(children, (child) => {
    if (child.kind !== "section") {
      return Option.none();
    }

    return child.identifier === identifier
      ? Option.some(child)
      : sectionIn(child.children, identifier);
  });

/**
 * Give the identifiers of the item refs a scope holds within a part, when the part holds the scope.
 *
 * @param part The part.
 * @param scope The scope: an item ref, a section or a part; the test is held by no part.
 * @returns The scope's refs, none when the part does not hold the scope.
 */
const membersIn = (part: TestPart, scope: TimedScope): Option.Option<ReadonlySet<string>> => {
  const refs = refIdentifiersIn(part.children);
  switch (scope.kind) {
    case "item-ref": {
      return refs.includes(scope.identifier)
        ? Option.some(new Set([scope.identifier]))
        : Option.none();
    }
    case "section": {
      return Option.map(
        sectionIn(part.children, scope.identifier),
        (section) => new Set(refIdentifiersIn(section.children)),
      );
    }
    case "part": {
      return part.identifier === scope.identifier ? Option.some(new Set(refs)) : Option.none();
    }
    case "test": {
      return Option.none();
    }
    default: {
      return scope.kind satisfies never;
    }
  }
};

/**
 * The part that holds a scope: its index among the test's parts, the part, and the identifiers of
 * the item refs the scope holds.
 */
export interface ScopeHolder {
  readonly index: number;
  readonly members: ReadonlySet<string>;
  readonly part: TestPart;
}

/**
 * Find the part that holds a scope, with the identifiers of the item refs the scope holds. The
 * expiry and the exit of a scope (`#plate/session/expire.ts`) and the entering gate here read a
 * scope's place in the test through this, so a test-feature module never does.
 *
 * @param test The test.
 * @param scope The scope: an item ref, a section or a part; the test is held by no part.
 * @returns The part's index, the part and the scope's refs; none when no part holds the scope.
 */
export const partHoldingScope = (test: Test, scope: TimedScope): Option.Option<ScopeHolder> =>
  Arr.findFirst(test.parts, (part, index) =>
    Option.map(membersIn(part, scope), (members) => ({ index, members, part })),
  );

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
   * The test, which a test-feature module's `present` is handed.
   */
  readonly model: Test;
  /**
   * Each item ref's place, by identifier.
   */
  readonly places: ReadonlyMap<string, Place>;
  /**
   * The sections that enclose each item ref, outermost first, by identifier.
   */
  readonly sections: ReadonlyMap<string, readonly Section[]>;
  /**
   * The test's identifier, which an {@link UnknownItemRef} names.
   */
  readonly test: string;
}

/**
 * List the sections that enclose each item ref of some section children, outermost first, by the
 * item ref's identifier, in one walk. An identifier keeps its first item ref in document order, as
 * {@link placesOf} does.
 *
 * @param children The children, whose item refs the sections enclose.
 * @param enclosing The sections that already enclose the children, outermost first.
 * @param held The map to write into, one entry per identifier.
 */
const collectSections = (
  children: readonly SectionChild[],
  enclosing: readonly Section[],
  held: Map<string, readonly Section[]>,
): void => {
  for (const child of children) {
    if (child.kind === "section") {
      collectSections(child.children, [...enclosing, child], held);
    } else if (!held.has(child.identifier)) {
      held.set(child.identifier, enclosing);
    }
  }
};

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

  const sections = new Map<string, readonly Section[]>();
  for (const part of test.parts) {
    collectSections(part.children, [], sections);
  }

  return {
    controls: sessionControls(test),
    ended: new Set(
      session.parts.filter((part) => part.status === "ended").map((part) => part.identifier),
    ),
    model: test,
    places,
    sections,
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
 * `openPackage` resolves an item ref through the `xml:base` in scope (reading 103), which the test
 * model does not keep. An accepted test holds no `xml:base` above an item ref: no test element,
 * from `qti-assessment-test` to `qti-assessment-item-ref`, declares one, so `check` refuses it
 * (reading 90). So the test's location is the base both sides resolve an accepted test's item ref
 * against.
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
 * An item's first attempt failed at its presentation, a defect of the renderer that no checked
 * item can cause.
 *
 * It cannot occur: the item ref's template defaults are checked against the item before its first
 * attempt (`checkTemplateDefaults`), and a default that does not fit is returned, since a test and
 * its items each pass `check` apart. After that check, `firstAttempt` fails only when the item's
 * own template processing reads a variable it holds no value of, sets a variable the item does not
 * declare in the kind the rule sets, or sets one to a value of another type, and on an accepted
 * item the validator refuses each of these or the item model marks the template processing that
 * would cause it, which then does not run. It is thrown, never returned, so the failures of
 * {@link present} and the moves hold only failures a caller can cause, and it is not exported.
 */
class FirstAttemptDefect extends Data.TaggedError("FirstAttemptDefect")<{
  readonly failure: EngineFailure;
  readonly item: string;
}> {
  /**
   * The item, the engine's failure, and what to do with it.
   */
  override get message(): string {
    return `The first attempt of the item ${JSON.stringify(this.item)} failed with ${this.failure._tag}, though the validator refuses, or the item model marks, every cause of that failure on a checked item. This is a defect in the renderer; report it with the item that caused it.`;
  }
}

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
 * Evaluate an item ref's template defaults for a session item and check them against the item they
 * set.
 *
 * The defaults are evaluated in document order from the stream keyed by the session's processing
 * seed under the default label of the item's sequence index, never the default key. Each
 * expression reads the test's outcomes as the session holds them and the test's items through the
 * scope given, which holds no time.
 *
 * @param test The test.
 * @param session The session.
 * @param scope The session's test scope, with no duration: the test's own `duration` reads NULL.
 * @param ref The item ref.
 * @param item The session item that delivers it.
 * @param accepted The item it delivers, whose template variables the defaults set.
 * @returns The defaults, by template identifier, each a value of its variable's declared type, a
 *   NULL its variable's own; or the {@link EngineFailure} of their evaluation, or of
 *   `checkTemplateDefaults`: a key that names no template variable of the item, or a value of
 *   another type.
 */
const evaluatedDefaults = (
  test: Test,
  session: TestSession,
  scope: TestScope,
  ref: ItemRef,
  item: SessionItem,
  accepted: Accepted,
): Result.Result<Readonly<Record<string, Value>>, EngineFailure> =>
  Result.flatMap(
    evaluateTemplateDefaults(
      ref.templateDefaults,
      test,
      session.outcomes,
      scope,
      drawStream(session.seed, defaultLabel(session.instance, item.sequenceIndex)),
    ),
    (defaults) => checkTemplateDefaults(accepted.item, defaults),
  );

/**
 * Give the template defaults the test's item ref gives a session item at its first presentation,
 * checked against the item they set.
 *
 * In a linear part the defaults are evaluated as the candidate meets the item (`info.txt:46025`),
 * as {@link evaluatedDefaults} does, over the session's test scope with no time: the test's own
 * `duration` reads NULL, and so does a variable of an item whose record holds no value of it, such
 * as one not yet presented. In a nonlinear part they were evaluated when the part started
 * ({@link partStarted}) and the item holds them, so a later change to what they read does not
 * change them; they are checked again here, since a stored session is the host's to hand back. An
 * item of a nonlinear part that holds none has none. A default the test model marked is not in the
 * item ref's defaults, so its variable keeps its declared default. An item no item ref of the test
 * names has none.
 *
 * @param test The test.
 * @param items The accepted items, keyed by item ref identifier.
 * @param session The session, the item not yet presented.
 * @param item The session item.
 * @param accepted The item it delivers, whose template variables the defaults set.
 * @returns The defaults, by template identifier, each a value of its variable's declared type; or
 *   the {@link EngineFailure} of their evaluation, or of `checkTemplateDefaults`: a key that names
 *   no template variable of the item, or a value of another type.
 */
const templateDefaultsOf = (
  test: Test,
  items: ReadonlyMap<string, Accepted>,
  session: TestSession,
  item: SessionItem,
  accepted: Accepted,
): Result.Result<Readonly<Record<string, Value>>, EngineFailure> =>
  Option.match(
    Arr.findFirst(placesOf(test), (place) => place.ref.identifier === item.ref),
    {
      onNone: () => Result.succeed({}),
      onSome: ({ part, ref }) =>
        part.navigation === "linear"
          ? evaluatedDefaults(
              test,
              session,
              testScopeOf(test, items, session, attemptLimits(test), Option.none()),
              ref,
              item,
              accepted,
            )
          : checkTemplateDefaults(
              accepted.item,
              Option.getOrElse(item.templateDefaults, () => ({})),
            ),
    },
  );

/**
 * Start a test part's template defaults: when the part is nonlinear, give each of its items the
 * template defaults its item ref gives, evaluated and checked now, before any of its items is
 * presented, since "in nonlinear mode the expression is evaluated at the start of the testPart"
 * (`info.txt:46025`).
 *
 * Each item ref's defaults are evaluated as {@link evaluatedDefaults} does, each from its own
 * stream under the default label of its item's sequence index, over the test's outcomes as the
 * session holds them, which after a simultaneous part's submission are those its outcome run left,
 * and the session's test scope with no time, in which the test's own `duration` reads NULL and so
 * does a variable of an item whose record holds no value of it, such as one of this part not yet
 * presented. Each item stores its checked defaults in `templateDefaults`, which its first
 * presentation passes to `firstAttempt`. An item whose item ref has no template default keeps
 * none, and a linear part's items are left as they are: a linear part evaluates an item's defaults
 * when the candidate meets the item.
 *
 * @param test The test.
 * @param items The accepted items, keyed by item ref identifier.
 * @param session The session, none of the part's items presented.
 * @param part The part that starts.
 * @returns The session with each of the part's items holding its defaults;
 *   {@link TestNotDeliverable} when the items have no entry for an item ref of the part that holds
 *   a default, or one from another document than its record's; or the first {@link EngineFailure},
 *   in sequence order: a default reads a value the session's records lack (an
 *   `UnknownIdentifierError`, holder `record`), names no template variable of its item (holder
 *   `item`), or is a value of another type than its variable's (an `OutcomeMismatchError`). A
 *   package that holds the test and its items keeps all but one of these from the session:
 *   `openPackage` refuses each, but a default that reads an item's context variable through its
 *   item ref, which it marks and leaves out. The one that reaches the session is a default whose
 *   type a `qti-field-value` decides at run time, such as a field of an item's declared `record`
 *   read through `qti-default`, whose `OutcomeMismatchError` reaches the session with no answer
 *   given, since a `record` declaration types none of its fields.
 */
export const partStarted = (
  test: Test,
  items: ReadonlyMap<string, Accepted>,
  session: TestSession,
  part: TestPart,
): Result.Result<TestSession, EngineFailure | TestNotDeliverable> => {
  if (part.navigation !== "nonlinear") {
    return Result.succeed(session);
  }

  const refs = new Map<string, ItemRef>();
  for (const ref of itemRefsIn(part.children)) {
    if (!refs.has(ref.identifier)) {
      refs.set(ref.identifier, ref);
    }
  }

  const scope = testScopeOf(test, items, session, attemptLimits(test), Option.none());

  return Result.map(
    Result.all(
      session.items.map((item): Result.Result<SessionItem, EngineFailure | TestNotDeliverable> => {
        const ref = refs.get(item.ref);
        if (ref === undefined || ref.templateDefaults.length === 0) {
          return Result.succeed(item);
        }

        return Result.map(
          Result.flatMap(
            deliverable(items, session.test, item.ref, item.record.document),
            (accepted) => evaluatedDefaults(test, session, scope, ref, item, accepted),
          ),
          (defaults) => ({ ...item, templateDefaults: Option.some(defaults) }),
        );
      }),
    ),
    (started): TestSession => ({ ...session, items: started }),
  );
};

/**
 * Mark a session item presented and start its first attempt: its record becomes the one
 * `firstAttempt` starts for the item's instance under the session's processing seed, from the
 * template defaults given, as {@link present} describes.
 *
 * @param item The session item, not yet presented.
 * @param accepted The item it delivers.
 * @param datestamp The time of the transition, in ISO 8601.
 * @param seed The session's processing seed.
 * @param templateDefaults The item ref's template defaults, already checked against the item.
 * @returns The item, presented.
 * @throws {FirstAttemptDefect} When `firstAttempt` fails, which no checked item can cause once its
 *   defaults are checked: the validator refuses, or the item model marks, every cause.
 */
const presented = (
  item: SessionItem,
  accepted: Accepted,
  datestamp: string,
  seed: string,
  templateDefaults: Readonly<Record<string, Value>>,
): SessionItem => {
  const started = firstAttempt(accepted.item, {
    instance: item.record.instance,
    seed,
    templateDefaults,
  });
  if (Result.isFailure(started)) {
    throw new FirstAttemptDefect({ failure: started.failure, item: accepted.item.identifier });
  }

  return { ...item, datestamp, presented: true, record: started.success };
};

/**
 * Present the item at an index of a session's items: give its template defaults, then start its
 * first attempt from them.
 *
 * @param test The test.
 * @param items The accepted items, keyed by item ref identifier.
 * @param session The session.
 * @param index The item's index in `session.items`.
 * @param item The session item there, not yet presented.
 * @param accepted The item it delivers.
 * @param datestamp The time of the transition, in ISO 8601.
 * @returns The session with the item presented, or the {@link EngineFailure} of its template
 *   defaults.
 */
const presentedIn = (
  test: Test,
  items: ReadonlyMap<string, Accepted>,
  session: TestSession,
  index: number,
  item: SessionItem,
  accepted: Accepted,
  datestamp: string,
): Result.Result<TestSession, EngineFailure> =>
  Result.map(
    templateDefaultsOf(test, items, session, item, accepted),
    (templateDefaults): TestSession => ({
      ...session,
      items: withItem(
        session,
        index,
        presented(item, accepted, datestamp, session.seed, templateDefaults),
      ),
    }),
  );

/**
 * Mark an item of a session presented, starting its first attempt when it was not.
 *
 * An attempt starts when the item's session first enters interacting: at its first presentation in
 * answering mode. In a linear part the item ref's template defaults are evaluated first, as the
 * candidate meets the item: in document order, from the stream keyed by the session's processing
 * seed under the default label of the item's sequence index, each over the test's outcomes as the
 * session holds them and the test's items through the session's test scope, in which the test's own
 * `duration` reads NULL and so does a variable of an item whose record holds no value of it, such
 * as one not yet presented. In a nonlinear part they were evaluated when the part started
 * ({@link partStarted}), and the values the item stores are used instead, so a later run that
 * changes what a default read does not change them. Each is checked against the item it sets, a
 * stored value included. A default the test model marked is not applied, so its variable keeps its
 * declared default. Then the item's record becomes the one `firstAttempt` starts: its template
 * variables begin at their declared defaults, the test's defaults in their place, and the item's
 * template processing runs once, drawing from the stream keyed by the session's processing seed
 * under the template label of the item's instance and the item, and a constraint's restart returns
 * to the test's defaults. Each response then holds its default (`info.txt:8462`), the one template
 * processing set, else its `qti-default-value`, else NULL, and each outcome its default, the one
 * template processing set, else its starting value. Where the item model marks the item's template
 * processing (it names a variable the engine does not hold, such as `QTI_CONTEXT` or a context
 * variable, or holds an element the engine does not run), it does not run, and the record begins
 * with each response and outcome at its declared default, each template variable at the test's
 * default or else none, and no correct response or default, as `firstAttempt` starts it; `check`'s
 * verdict, `accepted-with-unsupported`, names each mark. An item never presented keeps a fresh
 * record, with no template value. Presenting an item already presented changes nothing. The moves
 * and a part's end call this for the item they show.
 *
 * A test and its items each pass `check` apart, so a template default that does not fit its item is
 * caller input: it is returned, never thrown. A package that holds the test and its items refuses
 * such a default at `openPackage`, except one whose type a `qti-field-value` decides at run time,
 * which `openPackage` cannot type, since a `record` declaration types none of its fields: its
 * `OutcomeMismatchError` is returned here.
 *
 * @example
 *   present(test.test, items, session, 2, new Date()); // item 2 presented, its template values and defaults written
 *
 * @param test The model of the test the session was started from, the `test` of the accepted
 *   test {@link startTest} took.
 * @param items The accepted items, keyed by item ref identifier, as {@link startTest} took them.
 * @param session The session.
 * @param sequenceIndex The item's sequence index, counted from 1.
 * @param now The time of the transition.
 * @returns The session with the item presented; {@link ItemNotInSession} for a sequence index the
 *   session lacks; {@link TestNotDeliverable} when the items have no entry for the item's ref, or
 *   one from another document than its record's; {@link InvalidTime} for an invalid `now`; an
 *   `EngineFailure` when a template default reads a value the session's records lack (an
 *   `UnknownIdentifierError`, holder `record`), names no template variable of the item (an
 *   `UnknownIdentifierError`, holder `item`), or is a value of another type than its variable's (an
 *   `OutcomeMismatchError`).
 */
export const present = (
  test: Test,
  items: ReadonlyMap<string, Accepted>,
  session: TestSession,
  sequenceIndex: number,
  now: Date,
): Result.Result<
  TestSession,
  EngineFailure | InvalidTime | ItemNotInSession | TestNotDeliverable
> =>
  Result.gen(function* presentItem() {
    const datestamp = yield* datestampOf(now, "now");
    const [index, item] = yield* itemAt(session, sequenceIndex);
    if (item.presented) {
      return session;
    }

    const accepted = yield* deliverable(items, session.test, item.ref, item.record.document);

    return yield* presentedIn(test, items, session, index, item, accepted, datestamp);
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
 * What `startTest` delivers for one place of the sequence: the accepted item and the session item
 * it starts from.
 */
interface DeliveredPlace {
  readonly accepted: Accepted;
  readonly item: SessionItem;
}

/**
 * Give the index of the place a session goes to when, at its start, the modules exit a scope from
 * a place not yet presented: the first place after the scope's last member when the scope holds
 * the place, or the test's end for the test; the place itself for an item ref in a nonlinear part,
 * whose exit stays where it is, and for a scope that does not hold the place, those the test lacks
 * among them, so the place is entered. Nothing of the part has been presented, so leaving its last
 * member moves on to the next part, as ending it would.
 *
 * @param test The test.
 * @param places The places, in the order the candidate meets them.
 * @param index The index of the place the exit leaves from.
 * @param scope The scope.
 * @returns The index of the place to ask for next; the places' count when none follows.
 */
const indexAfterExit = (
  test: Test,
  places: readonly Place[],
  index: number,
  scope: TimedScope,
): number => {
  if (scope.kind === "test") {
    return scope.identifier === test.identifier ? places.length : index;
  }

  return Option.match(partHoldingScope(test, scope), {
    onNone: () => index,
    onSome: ({ members, part }) => {
      const place = places[index];
      if (place === undefined || !members.has(place.ref.identifier)) {
        return index;
      }

      return scope.kind === "item-ref" && part.navigation !== "linear"
        ? index
        : places.findLastIndex((each) => members.has(each.ref.identifier)) + 1;
    },
  });
};

/**
 * Enter the first place of a session's sequence: ask the test-feature modules for each place in
 * turn, from the first, and present the first one every module lets be entered. A skipped place is
 * passed over, its item never presented; an exit moves on past the scope ({@link indexAfterExit}).
 * Each part is started once, as the first place asked for in it is reached, so a nonlinear part's
 * template defaults are evaluated before its first place is asked for. When every place is passed
 * over, the session starts closed, every part ended and no outcome run counted, as a test with no
 * item starts.
 *
 * @param test The test.
 * @param items The accepted items, keyed by item ref identifier.
 * @param features The test-feature modules.
 * @param now When the session starts.
 * @param session The session, no part started and no item presented.
 * @param places The places, in the order the candidate meets them.
 * @param delivered What each place delivers, in the same order.
 * @returns The session on its first entered place, or closed; a failure of `partStarted` or of the
 *   presentation.
 */
const enteredFirst = (
  test: Test,
  items: ReadonlyMap<string, Accepted>,
  features: TestFeatureTable,
  now: Date,
  session: TestSession,
  places: readonly Place[],
  delivered: readonly DeliveredPlace[],
): Result.Result<TestSession, EngineFailure | TestNotDeliverable> =>
  Result.gen(function* enterFirstPlace() {
    let index = 0;
    let begun = session;
    let begunPart: Option.Option<TestPart> = Option.none();
    while (index < places.length) {
      const place = places[index];
      const entry = delivered[index];
      if (place === undefined || entry === undefined) {
        break;
      }

      const positioned: TestSession = {
        ...begun,
        parts: startingParts(test.parts, Option.some(place.part)),
        position: index,
        status: "interacting",
      };
      begun = Option.exists(begunPart, (part) => part === place.part)
        ? positioned
        : yield* partStarted(test, items, positioned, place.part);
      begunPart = Option.some(place.part);

      const verdict = enteredBy(features, {
        items: Option.some(items),
        now: Option.some(now),
        sequenceIndex: index + 1,
        session: begun,
        test,
      });
      if (Option.isNone(verdict)) {
        const shown = begun.items[index] ?? entry.item;

        return yield* presentedIn(test, items, begun, index, shown, entry.accepted, begun.started);
      }

      index =
        verdict.value.kind === "skip"
          ? index + 1
          : indexAfterExit(test, places, index, verdict.value.scope);
    }

    return { ...begun, parts: startingParts(test.parts, Option.none()), status: "closed" };
  });

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
 * does. The session keeps two seeds apart. Its `seed` is the processing seed: `context.seed`, used
 * as given, or, when the context gives none, a seed `startTest` draws, 128 random bits written as
 * 32 lowercase hex digits; never the configuration's `seed`. Each item's first attempt draws its
 * template values under it, and so does every later draw of the session's processing, so the
 * stored session, which holds it, is server data. Its `shuffleSeed` is the configuration's `seed`,
 * absent when it has none, and it alone keys each item's shuffle, so a restored session presents
 * the choice order it showed whatever seed the host passes later; with none, a shuffle follows the
 * instance alone. A shuffle's order is on the page, so pass a processing seed apart from the
 * configuration's `seed`, never one string as both. The session starts each of the test's
 * outcomes at its declared default, else its starting value, with no run of the test's outcome
 * processing counted, so the first part's template defaults read each test outcome at that value.
 * When the first part is linear, the first item's are evaluated at its presentation and no session
 * item stores them. When it is nonlinear, the defaults of every item of the part are evaluated as
 * the part starts, before its first item is presented, each from its own stream under the default
 * label of its sequence index, and each item whose item ref has a default stores them in
 * `templateDefaults`, which its first presentation applies ({@link partStarted}). A test with no
 * item at all starts closed.
 *
 * Before the first place is presented, the test-feature modules are asked whether it is entered
 * (`enter`, through `enteredBy`), as `advance` asks for each place it lands on: a `skip` passes the
 * place over, its item never presented and its record fresh, and the next place is asked for; an
 * `exit` moves on past the scope it names; and the first place every module lets through is
 * presented. A test whose every place is passed over starts closed, with no outcome run.
 *
 * @example
 *   // The instance is the host's own token for the sitting, such as its key in the host's store.
 *   // A page served over plain HTTP has no `crypto.randomUUID`.
 *   startTest(test, items, configuration, { instance: "sitting-42", now: new Date() });
 *   // under a processing seed startTest draws; pass `seed` in the context to give your own
 *
 * @param test The test, as `check` accepted it.
 * @param items The test's items, each as `check` accepted it, keyed by the identifier of the item
 *   ref that names its document.
 * @param configuration The host's configuration, whose `seed` the session keeps as its shuffle
 *   seed, none when it has none.
 * @param context The sitting.
 * @param context.features The test-feature modules the sequence and the entering gate consult,
 *   the table by default; a test hands in one holding a module that has landed.
 * @param context.instance The host's name for this sitting, which scopes every item's ids: a token
 *   `checkInstance` passes, such as a lowercase UUID.
 * @param context.now When the session starts.
 * @param context.seed The processing seed, which keys every value the session's processing draws,
 *   used as given; with none, `startTest` draws one. Server data: keep it from the page.
 * @returns The session; {@link TestNotDeliverable} when the items have no entry for an item ref
 *   (`item-missing`) or hold one from another document than the ref names (`item-mismatch`);
 *   {@link InvalidSessionInstance} for an instance that breaks a requirement; {@link InvalidTime}
 *   for an invalid `now`; an `EngineFailure` of the first part's template defaults: in a linear
 *   part the first item's, as {@link present} gives it, and in a nonlinear part any item's, as
 *   {@link partStarted} gives it. A default reads a value the session lacks (an
 *   `UnknownIdentifierError`, holder `record`), names no template variable of its item (holder
 *   `item`), or is a value of another type than its variable's (an `OutcomeMismatchError`). A test
 *   and its items each pass `check` apart, so a default that does not fit is caller input; a
 *   package that holds them refuses it at `openPackage`, except a default whose type a
 *   `qti-field-value` decides at run time, which `openPackage` cannot type, since a `record`
 *   declaration types none of its fields. Such a default can fail here with no answer given, when
 *   it reads a field of an item's declared `record` through `qti-default` or `qti-correct`: its
 *   `OutcomeMismatchError` is returned, never thrown.
 */
export const startTest = (
  test: AcceptedTest,
  items: ReadonlyMap<string, Accepted>,
  configuration: Configuration,
  context: {
    readonly features?: TestFeatureTable;
    readonly instance: string;
    readonly now: Date;
    readonly seed?: string;
  },
): Result.Result<
  TestSession,
  EngineFailure | InvalidSessionInstance | InvalidTime | TestNotDeliverable
> =>
  Result.gen(function* startSession() {
    const instance = yield* checkedInstance(context.instance);
    const datestamp = yield* datestampOf(context.now, "context.now");
    const seed = context.seed ?? drawSeed();
    const features = context.features ?? testFeatures;
    const places = sequencedBy(features, {
      places: placesOf(test.test),
      seed,
      test: test.test,
    });
    const delivered = yield* Result.all(
      places.map(({ ref }, index) =>
        Result.map(
          deliverable(items, test.test.identifier, ref.identifier, namedDocument(test.test, ref)),
          (accepted) => {
            const item: SessionItem = {
              adaptive: accepted.item.adaptive ?? false,
              comment: Option.none(),
              datestamp,
              duration: 0,
              firstOutcomes: Option.none(),
              locked: false,
              presented: false,
              record: fresh(accepted.item, `${instance}.${index + 1}`),
              ref: ref.identifier,
              saved: Option.none(),
              sequenceIndex: index + 1,
              templateDefaults: Option.none(),
            };

            return { accepted, item } satisfies DeliveredPlace;
          },
        ),
      ),
    );
    const session: TestSession = {
      document: test.test.document,
      expired: [],
      instance,
      items: delivered.map(({ item }) => item),
      kind: "test",
      outcomeRuns: 0,
      outcomes: Object.fromEntries(
        Array.from(test.test.outcomes, ([identifier, outcome]) => [
          identifier,
          startingValue(outcome),
        ]),
      ),
      parts: startingParts(test.test.parts, Option.none()),
      position: 0,
      seed,
      shuffleSeed: Option.fromUndefinedOr(configuration.seed),
      started: datestamp,
      status: "closed",
      test: test.test.identifier,
      updated: datestamp,
    };

    return yield* enteredFirst(test.test, items, features, context.now, session, places, delivered);
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
 * in answering mode; the item's datestamp and the session's `updated` become `now`. The item's
 * comment is what the comment module (`#plate/session/comment.ts`) keeps, given the step's comment,
 * whether the item's session control allows one and the comment the item held. A closed test has
 * no current item and is returned unchanged. This is the one place a step is saved: the moves and
 * the submissions call it first.
 *
 * The item's session control is not in the session, so a caller that lets a comment be kept passes
 * the test's controls (`sessionControls`); with none, no item allows a comment.
 *
 * @param session The session.
 * @param step The request: its intent, and the responses and the comment posted with it.
 * @param now The time of the transition.
 * @param controls The test's session controls by item ref, from `sessionControls`; none by
 *   default, under which the comment module is told the item does not allow a comment.
 * @returns The session with the step saved; {@link ItemNotInSession} for a session whose position
 *   is past its items; {@link InvalidTime} for an invalid `now`.
 */
export const recordStep = (
  session: TestSession,
  step: Step,
  now: Date,
  controls?: ReadonlyMap<string, SessionControl>,
): Result.Result<TestSession, InvalidTime | ItemNotInSession> =>
  Result.gen(function* recordOne() {
    const datestamp = yield* datestampOf(now, "now");
    if (session.status === "closed") {
      return session;
    }

    const [index, item] = yield* itemAtPosition(session);
    const saved = step.responses === undefined ? item.saved : Option.some(step.responses);
    const allowed = controls?.get(item.ref)?.allowComment ?? false;

    return {
      ...session,
      items: withItem(session, index, {
        ...item,
        comment: commentModule.keep(Option.fromUndefinedOr(step.comment), allowed, item.comment),
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
 * Give a configuration the session's shuffle seed as its `seed`, or no `seed` when the session has
 * none, whatever `seed` the host's configuration holds.
 *
 * @param configuration The configuration.
 * @param shuffleSeed The session's shuffle seed.
 * @returns The configuration, keyed for shuffles by the session's shuffle seed alone.
 */
const shuffledBy = (
  configuration: Configuration,
  shuffleSeed: Option.Option<string>,
): Configuration => {
  const { seed: _host, ...unseeded } = configuration;

  return Option.match(shuffleSeed, {
    onNone: () => unseeded,
    onSome: (seed) => ({ ...unseeded, seed }),
  });
};

/**
 * Derive an item's place, session control, configuration and whether it is closed.
 *
 * An item is closed when the test has closed, when its part has ended, when a timed scope that
 * holds it has expired (the item is `locked`), or when the adaptive policy says its attempts have
 * closed it (`adaptivePolicy.closed` in `#plate/engine/adaptive.ts`, given whether the item is
 * adaptive, its record and its effective attempt limit): for a non-adaptive item, and for every
 * item while the policy is a stub, when the limit is above 0 and the record's `numAttempts`, the
 * count of processed attempts, has reached it.
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
    const configured = shuffledBy(itemConfiguration(configuration, control), session.shuffleSeed);
    const ended = index.ended.has(place.part.identifier);

    return {
      closed:
        session.status === "closed" ||
        ended ||
        item.locked ||
        adaptivePolicy.closed(item.adaptive, item.record, configured.maxAttempts),
      configuration: configured,
      control,
      place,
    };
  });

/**
 * Give an item's values, which its view shows and its attempt is processed with: each saved
 * response, else its record's, which holds NULL or, once the item is presented, its default
 * (D4-11): the one its template processing set, else its declared one. A record response's comes
 * from the record's `records`, the rest from its `responses`.
 *
 * @param item The session item.
 * @returns The values, by response identifier.
 */
export const valuesOf = (item: SessionItem): Responses => {
  const held: Responses = { ...item.record.responses, ...item.record.records };

  return Option.match(item.saved, {
    onNone: () => held,
    onSome: (saved) => ({ ...held, ...saved }),
  });
};

/**
 * Build the view of one session item.
 *
 * @param index The test, indexed for the session.
 * @param session The session.
 * @param configuration The host's configuration.
 * @param item The session item.
 * @param features The table whose modules present the view's content.
 * @returns The view, or {@link UnknownItemRef}.
 */
const viewOf = (
  index: Index,
  session: TestSession,
  configuration: Configuration,
  item: SessionItem,
  features: TestFeatureTable,
): Result.Result<ItemView, UnknownItemRef> =>
  Result.map(inspect(index, session, configuration, item), (inspected) => ({
    comment: item.comment,
    configuration: inspected.configuration,
    content: presentedBy(features, {
      place: {
        kind: "item",
        part: inspected.place.part,
        ref: item.ref,
        sections: index.sections.get(item.ref) ?? [],
        sequenceIndex: item.sequenceIndex,
      },
      session,
      test: index.model,
    }),
    count: session.items.length,
    disabled: inspected.closed,
    instance: `${session.instance}.${item.sequenceIndex}`,
    kind: "item",
    navigation: inspected.place.part.navigation,
    record: item.record,
    ref: item.ref,
    sequenceIndex: item.sequenceIndex,
    submission: inspected.place.part.submission,
    values: valuesOf(item),
  }));

/**
 * Give what any item of a test session renders with: its instance, configuration, values, disabled
 * state and record, as it was presented, so a review or a solution page shows the choice order and
 * the template values the candidate saw. The view is server data, as {@link ItemView} says.
 *
 * @param test The test the session was started from.
 * @param session The session.
 * @param configuration The host's configuration.
 * @param sequenceIndex The item's sequence index, counted from 1.
 * @param features The table whose modules present the view's content, the package's
 *   `testFeatures` by default; a test passes one holding a module that has landed.
 * @returns The item's view; {@link ItemNotInSession} for a sequence index the session lacks;
 *   {@link UnknownItemRef} when the test holds no item ref the item names, as when the session
 *   belongs to another test.
 */
export const itemView = (
  test: AcceptedTest,
  session: TestSession,
  configuration: Configuration,
  sequenceIndex: number,
  features: TestFeatureTable = testFeatures,
): Result.Result<ItemView, ItemNotInSession | UnknownItemRef> =>
  Result.flatMap(itemAt(session, sequenceIndex), ([, item]) =>
    viewOf(indexOf(test.test, session), session, configuration, item, features),
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
 * @param features The table whose modules present the views' content, the package's
 *   `testFeatures` by default.
 * @returns Each item's view, in the order of `sequenceIndices`; {@link ItemNotInSession} for the
 *   first sequence index the session lacks; {@link UnknownItemRef} when the test holds no item ref
 *   an item names, as when the session belongs to another test.
 */
export const itemViews = (
  test: AcceptedTest,
  session: TestSession,
  configuration: Configuration,
  sequenceIndices: readonly number[],
  features: TestFeatureTable = testFeatures,
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
        (item) => viewOf(index, session, configuration, item, features),
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
  outputBudget: defaultOutputBudget,
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
 * of every item once it is closed. The item's view is server data, as {@link ItemView} says.
 *
 * @example
 *   const shown = current(test, session, configuration);
 *   // Result.succeed({ kind: "item", instance: "<instance>.1", … }) on a session just started
 *
 * @param test The test the session was started from.
 * @param session The session.
 * @param configuration The host's configuration.
 * @param features The table whose modules present the content the view or the summary carries, the
 *   package's `testFeatures` by default.
 * @returns The view or the summary; {@link ItemNotInSession} for an open session whose position is
 *   past its items; {@link UnknownItemRef} when the test holds no item ref an item names.
 */
export const current = (
  test: AcceptedTest,
  session: TestSession,
  configuration: Configuration,
  features: TestFeatureTable = testFeatures,
): Result.Result<Current, ItemNotInSession | UnknownItemRef> => {
  const index = indexOf(test.test, session);
  if (session.status === "interacting") {
    return Result.flatMap(itemAtPosition(session), ([, item]) =>
      viewOf(index, session, configuration, item, features),
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
    (items): TestSummary => ({
      content: presentedBy(features, { place: { kind: "summary" }, session, test: index.model }),
      items,
      kind: "summary",
    }),
  );
};

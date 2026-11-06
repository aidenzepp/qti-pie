import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { encodeSession } from "#plate/codec/session.ts";
import { configure } from "#plate/configuration.ts";
import { navigationState, renderNavigation } from "#plate/navigation.ts";
import type { NavigationState } from "#plate/navigation.ts";
import { results } from "#plate/results/results.ts";
import { allowedIntents } from "#plate/session/intents.ts";
import type { Intent, TestSession } from "#plate/session/session.ts";
import { current, permits, startTest } from "#plate/session/start.ts";
import { growthFactor, growthLimit, growthRatio } from "#plate/test/growth.ts";
import { open } from "#plate/validate/open.ts";
import { acceptedItem } from "#plate/validate/verdict.ts";
import type { Accepted, AcceptedTest } from "#plate/validate/verdict.ts";

/**
 * The item refs of the smaller test each growth check reads, before it reads one with
 * {@link growthFactor} times as many.
 */
const fewerRefs = 1000;

/**
 * The items of the smaller navigation the render check renders, before it renders one with
 * {@link growthFactor} times as many. Rendering an item's button costs far more than testing its
 * intent against the allowed ones, so a search of every allowed intent for each button shows above
 * the linear work only at this size.
 */
const fewerButtons = 4000;

/**
 * Each growth check reads the larger input three times and the smaller one 24 times. A read that
 * walked the test or the allowed intents again for each item took up to 37 s of that, far beyond
 * vitest's default of 5 s, and a failing check should report its ratio, not a timeout.
 */
const growthTimeoutMs = 300_000;

/**
 * The item every ref delivers: one Choice of `A` and `B` bound to the single identifier
 * `RESPONSE`.
 */
const itemXml = [
  '<qti-assessment-item xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="choice" title="Choice" adaptive="false" time-dependent="false">',
  '<qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier"/>',
  '<qti-item-body><qti-choice-interaction response-identifier="RESPONSE">',
  '<qti-simple-choice identifier="A">A</qti-simple-choice>',
  '<qti-simple-choice identifier="B">B</qti-simple-choice>',
  "</qti-choice-interaction></qti-item-body></qti-assessment-item>",
].join("");

/**
 * How a test holds its item refs: all in one section of one part, each in a part of its own, or
 * each in a section of its own, the sections siblings in one part. A read that finds a ref by
 * walking the test again pays for every part, section and ref before it, so each arrangement gives
 * that walk a different cost per ref.
 */
type Arrangement = "one part" | "parts" | "sections";

/**
 * Write the text of one nonlinear test part with individual submission.
 *
 * @param identifier The part's identifier.
 * @param sections The text of its sections.
 * @returns The part's text.
 */
const partXml = (identifier: string, sections: readonly string[]): string =>
  [
    `<qti-test-part identifier="${identifier}" navigation-mode="nonlinear" submission-mode="individual">`,
    ...sections,
    "</qti-test-part>",
  ].join("");

/**
 * Write the text of one section.
 *
 * @param identifier The section's identifier.
 * @param refs The sequence indices of the item refs it holds, each ref `i<index>`.
 * @returns The section's text.
 */
const sectionXml = (identifier: string, refs: readonly number[]): string =>
  [
    `<qti-assessment-section identifier="${identifier}" title="Section" visible="true">`,
    ...refs.map((index) => `<qti-assessment-item-ref identifier="i${index}" href="choice.xml"/>`),
    "</qti-assessment-section>",
  ].join("");

/**
 * Write the text of a test whose item refs `i1` to `i<count>`, in that order, all name
 * `choice.xml` beside the test.
 *
 * @param count How many item refs the test holds.
 * @param arrangement How it holds them: in one section of one part unless given.
 * @returns The test's text.
 */
const testXml = (count: number, arrangement: Arrangement = "one part"): string => {
  const indices = Array.from({ length: count }, (_, index) => index + 1);
  const parts = {
    "one part": () => [partXml("P", [sectionXml("S", indices)])],
    parts: () => indices.map((index) => partXml(`P${index}`, [sectionXml(`S${index}`, [index])])),
    sections: () => [
      partXml(
        "P",
        indices.map((index) => sectionXml(`S${index}`, [index])),
      ),
    ],
  } satisfies Readonly<Record<Arrangement, () => readonly string[]>>;

  return [
    '<qti-assessment-test xmlns="http://www.imsglobal.org/xsd/imsqtiasi_v3p0" identifier="T" title="T">',
    ...parts[arrangement](),
    "</qti-assessment-test>",
  ].join("");
};

/**
 * A test of many item refs, the items it delivers by ref, and a session of it, just started: item 1
 * is current.
 */
interface Sitting {
  readonly items: ReadonlyMap<string, Accepted>;
  readonly session: TestSession;
  readonly test: AcceptedTest;
}

/**
 * Open the test of {@link testXml} and its one item, and start a session of it.
 *
 * @param count How many item refs the test holds.
 * @param arrangement How the test holds them.
 * @returns The test, its items and the session.
 */
const sittingOf = Effect.fnUntraced(function* sittingOf(count: number, arrangement: Arrangement) {
  const encoder = new TextEncoder();
  const itemVerdict = yield* open("tests/choice.xml", encoder.encode(itemXml));
  const item = Option.getOrElse(acceptedItem(itemVerdict), () =>
    assert.fail(`choice.xml is ${itemVerdict.verdict}, not an accepted item`),
  );
  const testVerdict = yield* open("tests/T.xml", encoder.encode(testXml(count, arrangement)));
  const test =
    (testVerdict.verdict === "accepted" || testVerdict.verdict === "accepted-with-unsupported") &&
    testVerdict.kind === "test"
      ? testVerdict.accepted
      : assert.fail(`T.xml is ${testVerdict.verdict} on a ${testVerdict.kind}, not a test`);
  const items = new Map<string, Accepted>(
    Array.from({ length: count }, (_, index) => [`i${index + 1}`, item] as const),
  );
  const session = Result.getOrElse(
    startTest(test, items, yield* configure({}), {
      instance: "sitting",
      now: new Date("2026-11-06T09:00:00.000Z"),
    }),
    (failure) => assert.fail(`startTest refused: ${failure.message}`),
  );

  return { items, session, test } satisfies Sitting;
});

/**
 * The smaller and the larger sitting each check reads.
 */
interface Sittings {
  readonly fewer: Sitting;
  readonly more: Sitting;
}

/**
 * Open the smaller and the larger sitting.
 *
 * @param fewer The item refs of the smaller sitting: {@link fewerRefs} unless given.
 * @param arrangement How each test holds its item refs: in one section of one part unless given.
 * @returns Both sittings.
 */
const sittings = Effect.fnUntraced(function* sittings(
  fewer: number = fewerRefs,
  arrangement: Arrangement = "one part",
) {
  return {
    fewer: yield* sittingOf(fewer, arrangement),
    more: yield* sittingOf(fewer * growthFactor, arrangement),
  } satisfies Sittings;
});

/**
 * Give the navigation of a nonlinear, individual part of some items on its first item, as
 * `navigationState` gives it for a session just started: every item not answered, and `next`, `go`
 * to each item, `submit-item` and `end-part` allowed.
 *
 * @param count How many items the part holds.
 * @returns The navigation.
 */
const startedNavigation = (count: number): NavigationState => {
  const sequenceIndices = Array.from({ length: count }, (_, index) => index + 1);

  return {
    allowed: [
      { kind: "next" },
      ...sequenceIndices.map((sequenceIndex): Intent => ({ kind: "go", sequenceIndex })),
      { kind: "submit-item" },
      { kind: "end-part" },
    ],
    count,
    items: sequenceIndices.map((sequenceIndex) => ({
      current: sequenceIndex === 1,
      sequenceIndex,
      state: "not-answered",
    })),
    navigation: "nonlinear",
    position: 1,
    submission: "individual",
  };
};

/**
 * Close a session as a test closes: every item closed, so the summary gives each its permits.
 *
 * @param session The session.
 * @returns The session, closed.
 */
const closed = (session: TestSession): TestSession => ({
  ...session,
  parts: session.parts.map((part) => ({ ...part, status: "ended" })),
  status: "closed",
});

/**
 * Assert that a read of the larger sitting took under {@link growthLimit} times as long as a read
 * of the smaller one.
 *
 * @param name What the read is, as the failure names it.
 * @param read The read of one sitting, which fails the test on a refusal.
 * @param pair The sittings.
 * @returns An effect that fails the test when the read grew faster than linearly.
 */
const linearIn = (name: string, read: (sitting: Sitting) => void, { fewer, more }: Sittings) =>
  Effect.gen(function* assertLinear() {
    const growth = yield* growthRatio(
      () => {
        read(fewer);
      },
      () => {
        read(more);
      },
    );
    assert.isBelow(
      growth,
      growthLimit,
      `${name} over 8 times the item refs took ${growth.toFixed(1)} times as long`,
    );
  });

describe("the navigation reads, read time", () => {
  it.effect(
    "allowedIntents lists every go of 8 times the item refs in under 32 times the time",
    () =>
      Effect.gen(function* allowedInLinearTime() {
        const pair = yield* sittings();
        const allowed = Result.getOrThrow(allowedIntents(pair.more.test, pair.more.session));
        assert.lengthOf(
          allowed.filter((intent) => intent.kind === "go"),
          fewerRefs * growthFactor,
        );

        yield* linearIn(
          "allowedIntents",
          ({ session, test }) => {
            Result.getOrThrow(allowedIntents(test, session));
          },
          pair,
        );
      }),
    growthTimeoutMs,
  );

  it.effect(
    "navigationState gives every item of 8 times the item refs in under 32 times the time",
    () =>
      Effect.gen(function* stateInLinearTime() {
        const pair = yield* sittings();
        const state = Result.getOrThrow(navigationState(pair.more.test, pair.more.session));
        assert.lengthOf(state.items, fewerRefs * growthFactor);

        yield* linearIn(
          "navigationState",
          ({ session, test }) => {
            Result.getOrThrow(navigationState(test, session));
          },
          pair,
        );
      }),
    growthTimeoutMs,
  );

  it.effect(
    "renderNavigation renders a button per item of 8 times the items in under 32 times the time",
    () =>
      Effect.gen(function* renderInLinearTime() {
        const configuration = yield* configure({});
        const fewerState = startedNavigation(fewerButtons);
        const moreState = startedNavigation(fewerButtons * growthFactor);
        const pair = yield* sittings();
        assert.deepStrictEqual(
          Result.getOrThrow(navigationState(pair.fewer.test, pair.fewer.session)),
          startedNavigation(fewerRefs),
        );

        const growth = yield* growthRatio(
          () => {
            Result.getOrThrow(renderNavigation(fewerState, configuration));
          },
          () => {
            Result.getOrThrow(renderNavigation(moreState, configuration));
          },
        );
        assert.isBelow(
          growth,
          growthLimit,
          `renderNavigation over 8 times the items took ${growth.toFixed(1)} times as long`,
        );
      }),
    growthTimeoutMs,
  );

  it.effect(
    "a closed current gives the permits of 8 times the items in under 32 times the time",
    () =>
      Effect.gen(function* summaryInLinearTime() {
        const pair = yield* sittings();
        const summary = Result.getOrThrow(
          current(pair.more.test, closed(pair.more.session), yield* configure({})),
        );
        assert.strictEqual(summary.kind, "summary");
        assert.lengthOf(summary.kind === "summary" ? summary.items : [], fewerRefs * growthFactor);

        const configuration = yield* configure({});
        yield* linearIn(
          "current on a closed session",
          ({ session, test }) => {
            Result.getOrThrow(current(test, closed(session), configuration));
          },
          pair,
        );
      }),
    growthTimeoutMs,
  );

  it.effect(
    "permits of the last of 8 times the items takes under 32 times the time",
    () =>
      Effect.gen(function* permitsInLinearTime() {
        const pair = yield* sittings();
        yield* linearIn(
          "permits of the last item",
          ({ session, test }) => {
            Result.getOrThrow(permits(test, closed(session), session.items.length));
          },
          pair,
        );
      }),
    growthTimeoutMs,
  );
});

/**
 * Write a closed session of a sitting in the form the host stores, and give a read that writes its
 * result.
 *
 * @param sitting The sitting.
 * @returns A read that writes the session's result, failing the test on a refusal.
 */
const reportOf = ({ items, session, test }: Sitting): (() => void) => {
  const stored = Result.getOrThrow(encodeSession(closed(session)));

  return () => {
    Result.getOrThrow(results({ context: {}, items, kind: "test", session: stored, test }));
  };
};

/**
 * The `results` checks: each arrangement of item refs, the item refs of its smaller test, before
 * a test with {@link growthFactor} times as many, and the words its title names it with.
 *
 * A result resolves each item's session control. Resolving it by walking the test up to the ref
 * costs a step per part, section and ref before it, which shows above the linear work of writing
 * each item's result only at these sizes: soonest where each ref sits in a part of its own, latest
 * where every ref shares one section.
 */
const resultChecks = [
  { arrangement: "one part", fewer: 4000, where: "in one part" },
  { arrangement: "parts", fewer: 1000, where: "each in its own part" },
  { arrangement: "sections", fewer: 2000, where: "each in its own section" },
] as const satisfies readonly {
  readonly arrangement: Arrangement;
  readonly fewer: number;
  readonly where: string;
}[];

describe("results, write time", () => {
  for (const { arrangement, fewer, where } of resultChecks) {
    it.effect(
      `results reports a closed session of 8 times the item refs, ${where}, in under 32 times the time`,
      () =>
        Effect.gen(function* resultsInLinearTime() {
          const pair = yield* sittings(fewer, arrangement);
          const growth = yield* growthRatio(reportOf(pair.fewer), reportOf(pair.more));
          assert.isBelow(
            growth,
            growthLimit,
            `results over 8 times the item refs, ${where}, took ${growth.toFixed(1)} times as long`,
          );
        }),
      growthTimeoutMs,
    );
  }
});

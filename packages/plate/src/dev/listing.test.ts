import { randomUUID } from "node:crypto";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { afterAll, assert, beforeAll, describe, it } from "@effect/vitest";
import { ConfigProvider, Effect, Fiber, Latch, Option } from "effect";
import { groupVerdicts, verdictCache, verdictOrder } from "#plate/dev/listing.ts";
import type { Opener } from "#plate/dev/listing.ts";
import { CorpusFileUnreadable } from "#plate/document/corpus.ts";
import type { Verdict } from "#plate/validate/verdict.ts";

/**
 * The scratch folder this run owns, under the package's git-ignored `work/`. Its name is new for
 * each run, so two runs at once never share or remove each other's files.
 */
const scratch = path.resolve(
  import.meta.dirname,
  "..",
  "..",
  "work",
  `listing-test-${randomUUID()}`,
);

/**
 * The members the scratch corpus root holds, in the document set's order.
 */
const members = ["a/one.xml", "a/two.xml", "b/three.xml", "root.xml"];

/**
 * A second scratch corpus root beside {@link scratch}, for the bounded reads: it holds more members
 * than the bound, so the bound, not the member count, limits how many opens run at once.
 */
const boundedScratch = `${scratch}-bounded`;

/**
 * The members {@link boundedScratch} holds, in the document set's order: twelve, numbered so the
 * set's sorted order is their numbering.
 */
const boundedMembers = Array.from(
  { length: 12 },
  (_, index) => `m${String(index).padStart(2, "0")}.xml`,
);

/**
 * The most member opens the verdict cache runs at once.
 */
const openBound = 8;

/**
 * Provide the scratch corpus root to an effect, through `PLATE_CORPUS_DIR`.
 *
 * @param effect The effect.
 * @returns The effect, reading the scratch root.
 */
const inScratch = <A, E>(effect: Effect.Effect<A, E>): Effect.Effect<A, E> =>
  effect.pipe(
    Effect.provide(ConfigProvider.layer(ConfigProvider.fromUnknown({ PLATE_CORPUS_DIR: scratch }))),
  );

/**
 * Provide {@link boundedScratch} to an effect, through `PLATE_CORPUS_DIR`.
 *
 * @param effect The effect.
 * @returns The effect, reading the bounded scratch root.
 */
const inBoundedScratch = <A, E>(effect: Effect.Effect<A, E>): Effect.Effect<A, E> =>
  effect.pipe(
    Effect.provide(
      ConfigProvider.layer(ConfigProvider.fromUnknown({ PLATE_CORPUS_DIR: boundedScratch })),
    ),
  );

/**
 * An opener and the members it opened, in order.
 */
interface Counting {
  readonly opened: string[];
  readonly opener: Opener;
}

/**
 * An opener that records each member it opens and gives it an `unchecked` verdict with no
 * reasons, reading nothing.
 *
 * @returns The opener and the members it opened, in order.
 */
const counting = (): Counting => {
  const opened: string[] = [];

  return {
    opened,
    opener: (member) =>
      Effect.sync((): Verdict => {
        opened.push(member);

        return { document: member, kind: "none", reasons: [], verdict: "unchecked" };
      }),
  };
};

beforeAll(() => {
  for (const member of members) {
    mkdirSync(path.dirname(path.join(scratch, member)), { recursive: true });
    writeFileSync(path.join(scratch, member), "<unread/>");
  }
  mkdirSync(boundedScratch, { recursive: true });
  for (const member of boundedMembers) {
    writeFileSync(path.join(boundedScratch, member), "<unread/>");
  }
});

afterAll(() => {
  rmSync(scratch, { force: true, recursive: true });
  rmSync(boundedScratch, { force: true, recursive: true });
});

describe("dev/listing.ts", () => {
  it.effect("the verdicts are every member's, in the set's order, each member opened once", () =>
    Effect.gen(function* everyMember() {
      const { opened, opener } = counting();
      const cache = yield* verdictCache(opener);
      const first = yield* inScratch(cache.verdicts);
      const second = yield* inScratch(cache.verdicts);

      assert.deepStrictEqual(
        first.map((verdict) => verdict.document),
        members,
      );
      assert.deepStrictEqual(second, first);
      assert.deepStrictEqual(opened, members);
    }),
  );

  it.effect(
    "one member's verdict opens that member alone, once; a path outside the set is none",
    () =>
      Effect.gen(function* oneMember() {
        const { opened, opener } = counting();
        const cache = yield* verdictCache(opener);
        const found = yield* inScratch(cache.verdictOf("a/two.xml"));
        const again = yield* inScratch(cache.verdictOf("a/two.xml"));
        const outside = yield* inScratch(cache.verdictOf("a/three.xml"));
        const climbing = yield* inScratch(cache.verdictOf("a/../a/two.xml"));

        assert.strictEqual(Option.getOrUndefined(found)?.document, "a/two.xml");
        assert.deepStrictEqual(again, found);
        assert.isTrue(Option.isNone(outside));
        assert.isTrue(Option.isNone(climbing));
        assert.deepStrictEqual(opened, ["a/two.xml"]);

        yield* inScratch(cache.verdicts);
        assert.deepStrictEqual(opened, ["a/two.xml", "a/one.xml", "b/three.xml", "root.xml"]);
      }),
  );

  it.effect("a failed open is not kept: the next request opens that member again", () =>
    Effect.gen(function* retried() {
      const { opened, opener: recording } = counting();
      const tried: string[] = [];
      const opener: Opener = (member) => {
        tried.push(member);

        return member === "b/three.xml" && !opened.includes("b/three.xml") && tried.length === 3
          ? Effect.fail(new CorpusFileUnreadable({ detail: "gone for a moment", path: member }))
          : recording(member);
      };
      const cache = yield* verdictCache(opener);
      const failed = yield* Effect.flip(inScratch(cache.verdicts));
      const listed = yield* inScratch(cache.verdicts);
      const again = yield* inScratch(cache.verdicts);

      assert.strictEqual(failed._tag, "CorpusFileUnreadable");
      assert.lengthOf(listed, members.length);
      assert.deepStrictEqual(again, listed);
      assert.deepStrictEqual(tried, [
        "a/one.xml",
        "a/two.xml",
        "b/three.xml",
        "b/three.xml",
        "root.xml",
      ]);
      assert.deepStrictEqual(opened, members);
    }),
  );

  it.effect(
    "bounded corpus reads: the verdicts open more than one member at once and at most 8, in the set's order",
    () =>
      Effect.gen(function* boundedReads() {
        const latch = yield* Latch.make();
        let inFlight = 0;
        let most = 0;
        const cache = yield* verdictCache((member) =>
          Effect.gen(function* heldOpen() {
            inFlight += 1;
            most = Math.max(most, inFlight);
            yield* latch.await;
            inFlight -= 1;
            const verdict: Verdict = {
              document: member,
              kind: "none",
              reasons: [],
              verdict: "unchecked",
            };

            return verdict;
          }),
        );

        // List the set first, opening no member, so every open below starts in the forked fiber's
        // first run and holds on the latch until it opens.
        yield* inBoundedScratch(cache.verdictOf("absent.xml"));

        const reading = yield* Effect.forkChild(inBoundedScratch(cache.verdicts), {
          startImmediately: true,
        });
        yield* latch.open;
        const verdicts = yield* Fiber.join(reading);

        assert.isAbove(most, 1);
        assert.isAtMost(most, openBound);
        assert.deepStrictEqual(
          verdicts.map((verdict) => verdict.document),
          boundedMembers,
        );
      }),
  );

  it("groups by verdict in the listing's order, then by top folder, each member once", () => {
    const groups = groupVerdicts([
      { document: "QTI3_BPIG_Examples/items/BG007.xml", verdict: "accepted" },
      { document: "QTI3_BPIG_Examples/items/x.xml", verdict: "refused" },
      { document: "catalog.xml", verdict: "refused" },
      { document: "qtiv3-examples/CAT/test.xml", verdict: "refused" },
      { document: "qtiv3-examples/a/b.xml", verdict: "accepted" },
      { document: "qtiv3-examples/c.xml", verdict: "refused" },
    ]);

    assert.deepStrictEqual(verdictOrder, [
      "accepted",
      "accepted-with-unsupported",
      "unchecked",
      "refused",
    ]);
    assert.deepStrictEqual(groups, [
      {
        count: 2,
        folders: [
          { folder: "QTI3_BPIG_Examples", members: ["QTI3_BPIG_Examples/items/BG007.xml"] },
          { folder: "qtiv3-examples", members: ["qtiv3-examples/a/b.xml"] },
        ],
        verdict: "accepted",
      },
      { count: 0, folders: [], verdict: "accepted-with-unsupported" },
      { count: 0, folders: [], verdict: "unchecked" },
      {
        count: 4,
        folders: [
          { folder: "QTI3_BPIG_Examples", members: ["QTI3_BPIG_Examples/items/x.xml"] },
          { folder: ".", members: ["catalog.xml"] },
          {
            folder: "qtiv3-examples",
            members: ["qtiv3-examples/CAT/test.xml", "qtiv3-examples/c.xml"],
          },
        ],
        verdict: "refused",
      },
    ]);
  });
});

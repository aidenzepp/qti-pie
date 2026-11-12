import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { begin } from "#plate/begin.ts";
import type { StoredRecord } from "#plate/codec/record.ts";
import { decodeSession, encodeSession } from "#plate/codec/session.ts";
import type { SessionTest } from "#plate/codec/session.ts";
import {
  boundedStore,
  nextAttempt,
  sessionId,
  sessionInstance,
  sessionStore,
} from "#plate/dev/store.ts";
import type { SessionEntry, SessionStore } from "#plate/dev/store.ts";
import { attr, doc, el } from "#plate/document/source.ts";
import { firstAttempt } from "#plate/engine/attempt.ts";
import { checkInstance } from "#plate/form/encoding.ts";
import { fresh } from "#plate/model/record.ts";
import { isNcName, nullOf } from "#plate/model/values.ts";
import { restore } from "#plate/restore.ts";
import type { TestSession } from "#plate/session/session.ts";
import { bg007Item, integer } from "#plate/test/fixtures.ts";
import { tables } from "#plate/validate/tables.ts";
import { acceptedItem, check } from "#plate/validate/verdict.ts";

/**
 * The test the sessions below belong to, as `decodeSession` checks them against it: one linear
 * part, `part-1`, whose section holds the one item ref `item-1`, which gives no template default,
 * and no outcome declaration.
 */
const owner: SessionTest = {
  test: {
    document: "tests/m2.xml",
    identifier: "m2",
    outcomes: new Map(),
    parts: [
      {
        children: [
          {
            children: [{ identifier: "item-1", kind: "item-ref", templateDefaults: [] }],
            kind: "section",
          },
        ],
        identifier: "part-1",
        navigation: "linear",
      },
    ],
  },
};

/**
 * A one-item session of {@link owner} under an id: the item presented, processed once and holding
 * responses saved since, an integer beyond 2^53 and a NULL among them.
 *
 * @param id The session's instance.
 * @returns The session.
 */
const sessionOf = (id: string): TestSession => ({
  document: owner.test.document,
  instance: id,
  items: [
    {
      datestamp: "2026-11-05T10:00:12.500Z",
      duration: 12.5,
      firstOutcomes: Option.some(fresh(bg007Item, `${id}.1`).outcomes),
      presented: true,
      record: { ...fresh(bg007Item, `${id}.1`), attempt: "submitted", numAttempts: 1 },
      ref: "item-1",
      saved: Option.some({
        COUNT: integer(2n ** 53n + 1n),
        RESPONSE: nullOf("identifier", "single"),
      }),
      sequenceIndex: 1,
      templateDefaults: Option.none(),
    },
  ],
  kind: "test",
  outcomeRuns: 0,
  outcomes: {},
  parts: [{ identifier: "part-1", status: "current" }],
  position: 0,
  seed: "7",
  shuffleSeed: Option.none(),
  started: "2026-11-05T10:00:00.000Z",
  status: "interacting",
  test: owner.test.identifier,
  updated: "2026-11-05T10:00:12.500Z",
});

/**
 * The entry the playground holds for an attempt at the fixture's test.
 *
 * @param attempt The attempt.
 * @returns The entry, its session in the stored form, started under the attempt's instance.
 */
const entryOf = (attempt: number): SessionEntry => ({
  attempt,
  packageLocation: "fixtures/m2",
  session: Result.getOrThrow(encodeSession(sessionOf(sessionInstance(attempt)))),
  testHref: owner.test.document,
});

/**
 * The id the playground stores an attempt at the fixture's test under.
 *
 * @param attempt The attempt.
 * @returns The id.
 */
const idOf = (attempt: number): string =>
  sessionId({ attempt, package: "m2", test: owner.test.document });

/**
 * Store the next attempt at the fixture's test, a number of times, in order.
 *
 * @param store The store.
 * @param count How many entries to store.
 * @returns The ids, in the order they were stored.
 */
const fill = (store: SessionStore, count: number): readonly string[] =>
  Array.from({ length: count }, () => {
    const attempt = nextAttempt(store, entryOf(0));
    store.set(idOf(attempt), entryOf(attempt));

    return idOf(attempt);
  });

describe("sessionStore", () => {
  it("keeps 100 entries and evicts the oldest when the 101st is stored", () => {
    const store = sessionStore();
    const ids = fill(store, 101);

    assert.strictEqual(store.size, 100);
    assert.isTrue(Option.isNone(store.get(ids[0] ?? "")));
    assert.deepStrictEqual(
      ids.slice(1).filter((id) => Option.isNone(store.get(id))),
      [],
    );
  });

  it("keeps an updated entry in the place it was first stored in", () => {
    const store = sessionStore();
    const [first = "", second = ""] = fill(store, 100);

    store.set(first, entryOf(1));
    fill(store, 1);

    assert.isTrue(Option.isNone(store.get(first)));
    assert.isTrue(Option.isSome(store.get(second)));
  });

  it("gives back an entry whose session decodes to the session it was given", () => {
    const store = sessionStore();
    const id = idOf(1);
    store.set(id, entryOf(1));

    const held = store.get(id);

    assert.isTrue(Option.isSome(held));
    if (Option.isSome(held)) {
      assert.strictEqual(held.value.packageLocation, "fixtures/m2");
      assert.strictEqual(held.value.testHref, owner.test.document);
      assert.deepStrictEqual(
        decodeSession(held.value.session, owner),
        Result.succeed(sessionOf(sessionInstance(1))),
      );
    }
  });
});

/**
 * A hand-built item whose template processing draws the integer template variable `N` from 0 to
 * 999,999, so the record `begin` starts for it holds a drawn value.
 */
const templated = Option.getOrElse(
  acceptedItem(
    check(
      doc(
        "items/sitting.xml",
        el(
          "qti-assessment-item",
          [
            attr("identifier", "sitting"),
            attr("time-dependent", "false"),
            attr("title", "Sitting"),
          ],
          [
            el("qti-response-declaration", [
              attr("base-type", "integer"),
              attr("cardinality", "single"),
              attr("identifier", "RESPONSE"),
            ]),
            el("qti-template-declaration", [
              attr("base-type", "integer"),
              attr("cardinality", "single"),
              attr("identifier", "N"),
            ]),
            el(
              "qti-template-processing",
              [],
              [
                el(
                  "qti-set-template-value",
                  [attr("identifier", "N")],
                  [el("qti-random-integer", [attr("max", "999999"), attr("min", "0")])],
                ),
              ],
            ),
          ],
        ),
      ),
      tables,
      Option.none(),
    ),
  ),
  () => assert.fail("the hand-built templated item is not accepted"),
);

describe("boundedStore", () => {
  it.effect(
    "[I-5] keeps a sitting's record: the record begin stored comes back as stored, and restore reads its seed and template values from it",
    () =>
      Effect.gen(function* keepsRecord() {
        const store = boundedStore<{ readonly record: StoredRecord }>();
        const start = { instance: "sitting", seed: "42" };
        const stored = yield* Effect.fromResult(begin(templated, start));
        store.set(start.instance, { record: stored });

        const held = Option.getOrElse(store.get(start.instance), () =>
          assert.fail("the store holds no sitting under its instance"),
        );
        const { record } = yield* Effect.fromResult(restore(templated, held.record));

        assert.strictEqual(held.record, stored);
        assert.strictEqual(record.seed, start.seed);
        assert.isDefined(record.templates["N"], "the record holds no drawn template value");
        assert.deepStrictEqual(
          record,
          yield* Effect.fromResult(firstAttempt(templated.item, start)),
        );
      }),
  );
});

describe("sessionId", () => {
  it("writes a session's package, test and attempt, each percent-encoded, joined by /", () => {
    assert.strictEqual(
      sessionId({ attempt: 2, package: "a b", test: "tests/t.xml" }),
      "a%20b/tests%2Ft.xml/2",
    );
  });
});

describe("sessionInstance", () => {
  it("names attempts 1 to 1000 apart, each an NCName that checkInstance passes", () => {
    const instances = Array.from({ length: 1000 }, (_, index) => sessionInstance(index + 1));

    assert.deepStrictEqual(
      instances.filter((token) => !isNcName(token) || Option.isSome(checkInstance(token))),
      [],
    );
    assert.strictEqual(new Set(instances).size, 1000);
  });
});

describe("nextAttempt", () => {
  it("gives 1 for a test the store holds no session of, and one past the highest it holds", () => {
    const store = sessionStore();
    const other = { packageLocation: "fixtures/other", testHref: owner.test.document };

    assert.strictEqual(nextAttempt(store, entryOf(0)), 1);
    store.set(idOf(1), entryOf(1));
    store.set(idOf(3), entryOf(3));

    assert.strictEqual(nextAttempt(store, entryOf(0)), 4);
    assert.strictEqual(nextAttempt(store, other), 1);
  });
});

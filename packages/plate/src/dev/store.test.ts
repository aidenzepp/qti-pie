import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { begin } from "#plate/begin.ts";
import type { StoredRecord } from "#plate/codec/record.ts";
import { decodeSession, encodeSession } from "#plate/codec/session.ts";
import type { SessionTest } from "#plate/codec/session.ts";
import { boundedStore, newSessionId, sessionStore } from "#plate/dev/store.ts";
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
 * The test the sessions below belong to, as `decodeSession` checks them against it.
 */
const owner: SessionTest = { test: { document: "tests/m2.xml", identifier: "m2" } };

/**
 * A one-item session of {@link owner} under an id: the item presented, processed once and holding
 * responses saved since, an integer beyond 2^53 and a NULL among them.
 *
 * @param id The session id, which is the session's instance.
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
    },
  ],
  kind: "test",
  parts: [{ identifier: "part-1", status: "current" }],
  position: 0,
  seed: "7",
  started: "2026-11-05T10:00:00.000Z",
  status: "interacting",
  test: owner.test.identifier,
  updated: "2026-11-05T10:00:12.500Z",
});

/**
 * The entry the playground holds for a session it started under an id.
 *
 * @param id The session id.
 * @returns The entry, its session in the stored form.
 */
const entryOf = (id: string): SessionEntry => ({
  packageLocation: "fixtures/m2",
  session: Result.getOrThrow(encodeSession(sessionOf(id))),
  testHref: owner.test.document,
});

/**
 * Store an entry for each of a number of new ids, in order.
 *
 * @param store The store.
 * @param count How many entries to store.
 * @returns The ids, in the order they were stored.
 */
const fill = (store: SessionStore, count: number): readonly string[] =>
  Array.from({ length: count }, () => {
    const id = newSessionId();
    store.set(id, entryOf(id));

    return id;
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

    store.set(first, entryOf(first));
    fill(store, 1);

    assert.isTrue(Option.isNone(store.get(first)));
    assert.isTrue(Option.isSome(store.get(second)));
  });

  it("gives back an entry whose session decodes to the session it was given", () => {
    const store = sessionStore();
    const id = newSessionId();
    store.set(id, entryOf(id));

    const held = store.get(id);

    assert.isTrue(Option.isSome(held));
    if (Option.isSome(held)) {
      assert.strictEqual(held.value.packageLocation, "fixtures/m2");
      assert.strictEqual(held.value.testHref, owner.test.document);
      assert.deepStrictEqual(
        decodeSession(held.value.session, owner),
        Result.succeed(sessionOf(id)),
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

describe("newSessionId", () => {
  it("draws distinct ids, each s- and a UUID, an NCName that checkInstance passes", () => {
    const ids = Array.from({ length: 1000 }, () => newSessionId());
    const uuid = /^s-[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/u;

    assert.deepStrictEqual(
      ids.filter((id) => !uuid.test(id) || !isNcName(id) || Option.isSome(checkInstance(id))),
      [],
    );
    assert.strictEqual(new Set(ids).size, 1000);
  });
});

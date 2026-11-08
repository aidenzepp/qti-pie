import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Result } from "effect";
import { encodeRecord } from "#plate/codec/record.ts";
import { decodeSession, encodeSession } from "#plate/codec/session.ts";
import type {
  InvalidSession,
  SessionMismatch,
  SessionTest,
  StoredTestSession,
  TestSessionSchema,
} from "#plate/codec/session.ts";
import { fresh } from "#plate/model/record.ts";
import { nullOf } from "#plate/model/values.ts";
import type { SessionItem, TestSession } from "#plate/session/session.ts";
import { bg007Item, float, integer } from "#plate/test/fixtures.ts";

/**
 * Whether two types are the same type, not merely assignable to each other: `true` only when the
 * checker treats `A` and `B` as identical.
 */
type Equals<A, B> =
  // oxlint-disable-next-line typescript/no-unnecessary-type-parameters -- each `T` must stay an unresolved type parameter inside its function type, so the conditional compares `A` and `B` by identity rather than by assignability.
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2 ? true : false;

/**
 * {@link TestSessionSchema}'s type is the plain {@link TestSession}; `tsc` refuses this line when
 * they part.
 */
const sessionPinned: Equals<typeof TestSessionSchema.Type, TestSession> = true;

/**
 * The stored form carries version 3; `tsc` refuses this line when it carries another.
 */
const versionPinned: Equals<StoredTestSession["version"], 3> = true;

/**
 * The test the sessions below belong to, as `decodeSession` checks them against it: its outcomes
 * `PASSED`, `SCORE` and `TOTAL`, and two parts, the linear `part-1` holding the item ref `item-1`,
 * which gives no template default, and the nonlinear `part-2` holding `item-2`, which defaults the
 * template variable `T`, in a section nested in its section.
 */
const owner: SessionTest = {
  test: {
    document: "tests/m2.xml",
    identifier: "m2",
    outcomes: new Map([
      ["PASSED", { baseType: "boolean", cardinality: "single" }],
      ["SCORE", { baseType: "float", cardinality: "single" }],
      ["TOTAL", { baseType: "integer", cardinality: "single" }],
    ]),
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
      {
        children: [
          {
            children: [
              {
                children: [
                  {
                    identifier: "item-2",
                    kind: "item-ref",
                    templateDefaults: [{ templateIdentifier: "T" }],
                  },
                ],
                kind: "section",
              },
            ],
            kind: "section",
          },
        ],
        identifier: "part-2",
        navigation: "nonlinear",
      },
    ],
  },
};

/**
 * The second item of {@link seeded}: never presented, so nothing saved and no outcomes kept.
 */
const unpresented: SessionItem = {
  datestamp: "2026-11-05T10:00:00.000Z",
  duration: 0,
  firstOutcomes: Option.none(),
  presented: false,
  record: fresh(bg007Item, "s1.2"),
  ref: "item-2",
  saved: Option.none(),
  sequenceIndex: 2,
  templateDefaults: Option.none(),
};

/**
 * The first item of {@link seeded}: presented and processed once, with its first outcomes kept and
 * responses saved since, an integer beyond 2^53 and a NULL among them.
 */
const answered: SessionItem = {
  datestamp: "2026-11-05T10:00:12.500Z",
  duration: 12.5,
  firstOutcomes: Option.some({ ...fresh(bg007Item, "s1.1").outcomes, SCORE: float(0.5) }),
  presented: true,
  record: {
    ...fresh(bg007Item, "s1.1"),
    attempt: "submitted",
    numAttempts: 1,
    outcomes: { ...fresh(bg007Item, "s1.1").outcomes, COUNT: integer(2n ** 53n + 1n) },
  },
  ref: "item-1",
  saved: Option.some({
    COUNT: integer(2n ** 53n + 1n),
    RESPONSE: nullOf("identifier", "single"),
  }),
  sequenceIndex: 1,
  templateDefaults: Option.none(),
};

/**
 * A two-item session of the test {@link owner}, seed `"7"`, with no shuffle seed, the test's
 * outcomes at their starting values and no outcome processing run: item 1 presented and processed
 * once, with its first outcomes kept and responses saved since, an integer beyond 2^53 and a NULL
 * among them; item 2 never presented. Neither item holds template defaults.
 */
const seeded: TestSession = {
  document: "tests/m2.xml",
  instance: "s1",
  items: [answered, unpresented],
  kind: "test",
  outcomeRuns: 0,
  outcomes: {
    PASSED: nullOf("boolean", "single"),
    SCORE: float(0),
    TOTAL: integer(0n),
  },
  parts: [
    { identifier: "part-1", status: "current" },
    { identifier: "part-2", status: "pending" },
  ],
  position: 0,
  seed: "7",
  shuffleSeed: Option.none(),
  started: "2026-11-05T10:00:00.000Z",
  status: "interacting",
  test: "m2",
  updated: "2026-11-05T10:00:12.500Z",
};

/**
 * The template value {@link templated}'s first item holds: an integer beyond 2^53.
 */
const drawn = integer(2n ** 60n + 3n);

/**
 * {@link seeded} with its first item's record started by template processing under the seed `"7"`:
 * the template variable `T` at {@link drawn}, `RESPONSE`'s correct response and `SCORE`'s default
 * set, as `firstAttempt` writes a templated item's record.
 */
const templated: TestSession = {
  ...seeded,
  items: seeded.items.map((item) =>
    item.sequenceIndex === 1
      ? {
          ...item,
          record: {
            ...item.record,
            correct: { RESPONSE: drawn },
            defaults: { SCORE: float(0.5) },
            seed: "7",
            templates: { T: drawn },
          },
        }
      : item,
  ),
};

/**
 * {@link seeded} after two runs of the test's outcome processing, under the shuffle seed `"9"`:
 * the test's outcomes an integer beyond 2^53, a float and a NULL, and item 2's template defaults
 * computed when its nonlinear part started, the template variable `T` at {@link drawn}.
 */
const processed: TestSession = {
  ...seeded,
  items: seeded.items.map((item) =>
    item.sequenceIndex === 2 ? { ...item, templateDefaults: Option.some({ T: drawn }) } : item,
  ),
  outcomeRuns: 2,
  outcomes: {
    PASSED: nullOf("boolean", "single"),
    SCORE: float(1.5),
    TOTAL: integer(2n ** 53n + 1n),
  },
  shuffleSeed: Option.some("9"),
};

/**
 * Pass a session through a host: encode it, write it as JSON text, read the text back and decode
 * what the host hands back.
 *
 * @param session The session.
 * @returns The session as the library reads it back, or the failure either side gives.
 */
const throughHost = (
  session: TestSession,
): Result.Result<TestSession, InvalidSession | SessionMismatch> =>
  Result.flatMap(encodeSession(session), (stored) => {
    // oxlint-disable-next-line unicorn/prefer-structured-clone -- The test proves the session survives JSON text, the form a host stores; `structuredClone` would keep what JSON drops.
    const handedBack: unknown = JSON.parse(JSON.stringify(stored));

    return decodeSession(handedBack, owner);
  });

/**
 * Decode a stored session that should fail, and give its failure.
 *
 * @param input The stored session.
 * @returns The failure, or none when the session decoded.
 */
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- The input is a stored session as a host could hand back any value.
const failureOf = (input: unknown): Option.Option<InvalidSession | SessionMismatch> =>
  Result.getFailure(decodeSession(input, owner));

/**
 * Give what a test reads from a failure: its tag, then for an InvalidSession its stage and the
 * version it names, and for a SessionMismatch the field, the name found and the name expected.
 *
 * @param failure The failure.
 * @returns The failure's tag and fields, as a list.
 */
const fieldsOf = (failure: InvalidSession | SessionMismatch): readonly unknown[] =>
  failure._tag === "InvalidSession"
    ? [failure._tag, failure.stage, failure.version]
    : [failure._tag, failure.field, failure.found, failure.expected];

describe("the plain type", () => {
  it("is the Schema's type, and the stored form carries version 3", () => {
    assert.isTrue(sessionPinned && versionPinned);
  });
});

describe("encodeSession and decodeSession", () => {
  it.effect(
    '[T-14] round-trip a session through JSON: saved responses, an integer beyond 2^53, a NULL, seed "7", first outcomes kept for one item and none for another',
    () =>
      Effect.gen(function* roundTripsSeeded() {
        const stored = yield* Effect.fromResult(encodeSession(seeded));
        const [first, second] = stored.items;

        assert.strictEqual(stored.version, 3);
        assert.strictEqual(stored.seed, "7");
        assert.strictEqual(first?.saved?.["COUNT"]?.values[0]?.value, "9007199254740993");
        assert.isTrue(first !== undefined && "firstOutcomes" in first);
        assert.isFalse(second !== undefined && "firstOutcomes" in second);
        assert.isFalse(second !== undefined && "saved" in second);
        assert.deepStrictEqual(yield* Effect.fromResult(throughHost(seeded)), seeded);
      }),
  );

  it.effect(
    "[T-1] [T-14] round-trip a session stored at version 3: the test's outcomes, the run count, the shuffle seed and an item's template defaults, each absent one left out of the stored form",
    () =>
      Effect.gen(function* roundTripsProcessed() {
        const stored = yield* Effect.fromResult(encodeSession(processed));
        const bare = yield* Effect.fromResult(encodeSession(seeded));
        const [first, second] = stored.items;

        assert.strictEqual(stored.version, 3);
        assert.strictEqual(stored.outcomeRuns, 2);
        assert.strictEqual(stored.shuffleSeed, "9");
        assert.strictEqual(stored.outcomes["TOTAL"]?.values[0]?.value, "9007199254740993");
        assert.strictEqual(
          second?.templateDefaults?.["T"]?.values[0]?.value,
          "1152921504606846979",
        );
        assert.isFalse(first !== undefined && "templateDefaults" in first);
        assert.deepStrictEqual(
          [bare.outcomeRuns, bare.outcomes["TOTAL"]?.values[0]?.value],
          [0, "0"],
        );
        assert.isFalse("shuffleSeed" in bare);
        assert.isFalse(bare.items.some((item) => "templateDefaults" in item));
        assert.deepStrictEqual(yield* Effect.fromResult(throughHost(processed)), processed);
        assert.deepStrictEqual(yield* Effect.fromResult(throughHost(seeded)), seeded);
      }),
  );

  it.effect(
    "[T-14] [I-5] refuses a stored session with no seed, which every stored session holds: InvalidSession at stage decode",
    () =>
      Effect.gen(function* refusesUnseeded() {
        const { seed: _written, ...unseeded } = yield* Effect.fromResult(encodeSession(seeded));

        assert.deepStrictEqual(
          Option.map(failureOf(unseeded), (failure) =>
            failure._tag === "InvalidSession" ? [failure._tag, failure.stage] : [failure._tag],
          ),
          Option.some(["InvalidSession", "decode"]),
        );
      }),
  );

  it.effect(
    "[I-5] [T-14] round-trip a session whose item record holds its seed, template values, correct responses and defaults",
    () =>
      Effect.gen(function* roundTripsTemplated() {
        const stored = yield* Effect.fromResult(encodeSession(templated));
        const restored = yield* Effect.fromResult(throughHost(templated));
        const [first] = stored.items;

        assert.strictEqual(first?.record.seed, "7");
        assert.strictEqual(first?.record.templates["T"]?.values[0]?.value, "1152921504606846979");
        assert.deepStrictEqual(restored, templated);
        assert.deepStrictEqual(
          restored.items.map((item) => [item.record.templates, item.record.correct]),
          [
            [{ T: drawn }, { RESPONSE: drawn }],
            [{}, {}],
          ],
        );
      }),
  );

  it.effect("store each item's record as a stored record, version and all", () =>
    Effect.gen(function* storesRecords() {
      const stored = yield* Effect.fromResult(encodeSession(seeded));
      const record = yield* Effect.fromResult(encodeRecord(fresh(bg007Item, "s1.2")));

      assert.deepStrictEqual(stored.items[1]?.record, record);
    }),
  );
});

describe("decodeSession", () => {
  it.effect(
    "[T-1] [T-14] [I-5] reads only a session stored at version 3: one stored at version 2 or 1 is InvalidSession at stage decode, naming the version found",
    () =>
      Effect.gen(function* refusesEarlierVersions() {
        const stored = yield* Effect.fromResult(encodeSession(processed));

        for (const version of [2, 1]) {
          assert.deepStrictEqual(
            Option.map(failureOf({ ...stored, version }), fieldsOf),
            Option.some(["InvalidSession", "decode", Option.some(version)]),
          );
        }
      }),
  );

  it.effect("refuses a stored session with no version: InvalidSession naming none", () =>
    Effect.gen(function* refusesUnversioned() {
      const { version: _written, ...unversioned } = yield* Effect.fromResult(encodeSession(seeded));

      assert.deepStrictEqual(
        Option.map(failureOf(unversioned), fieldsOf),
        Option.some(["InvalidSession", "decode", Option.none()]),
      );
    }),
  );

  it.effect("refuses a stored session whose item record names no version: InvalidSession", () =>
    Effect.gen(function* refusesUnversionedRecord() {
      const stored = yield* Effect.fromResult(encodeSession(seeded));
      const [first, second] = stored.items;
      const unversioned = second === undefined ? [] : [{ ...second, record: {} }];

      assert.deepStrictEqual(
        Option.map(failureOf({ ...stored, items: [first, ...unversioned] }), fieldsOf),
        Option.some(["InvalidSession", "decode", Option.some(3)]),
      );
    }),
  );

  it.effect(
    "refuses a session that is not one the renderer wrote: InvalidSession at stage decode, naming the version it holds",
    () =>
      Effect.gen(function* refusesMalformed() {
        const stored = yield* Effect.fromResult(encodeSession(seeded));

        for (const malformed of [
          { ...stored, status: "paused" },
          { ...stored, position: -1 },
          { ...stored, seed: 7 },
          { ...stored, outcomeRuns: -1 },
          { ...stored, outcomeRuns: 1.5 },
          { ...stored, outcomes: { SCORE: "1.5" } },
          { ...stored, shuffleSeed: 9 },
        ]) {
          assert.deepStrictEqual(
            Option.map(failureOf(malformed), fieldsOf),
            Option.some(["InvalidSession", "decode", Option.some(3)]),
            JSON.stringify(malformed),
          );
        }
        assert.deepStrictEqual(
          Option.map(failureOf("a session"), fieldsOf),
          Option.some(["InvalidSession", "decode", Option.none()]),
        );
      }),
  );

  it.effect("refuses a session of another test or another document: SessionMismatch", () =>
    Effect.gen(function* refusesMismatch() {
      const stored = yield* Effect.fromResult(encodeSession(seeded));
      const mismatchOf = (test: SessionTest) =>
        Option.map(Result.getFailure(decodeSession(stored, test)), fieldsOf);

      assert.deepStrictEqual(
        mismatchOf({ test: { ...owner.test, identifier: "other" } }),
        Option.some(["SessionMismatch", "test", "m2", "other"]),
      );
      assert.deepStrictEqual(
        mismatchOf({ test: { ...owner.test, document: "tests/other.xml" } }),
        Option.some(["SessionMismatch", "document", "tests/m2.xml", "tests/other.xml"]),
      );
    }),
  );
});

/**
 * Pass a session through a host and give what a test reads from the failure decoding it against a
 * test gives.
 *
 * @param session The session, which encodes.
 * @param test The test it is decoded against, {@link owner} by default.
 * @returns The failure's tag and fields, or none when the session decoded.
 */
const refusalOf = (
  session: TestSession,
  test: SessionTest = owner,
): Option.Option<readonly unknown[]> =>
  Result.match(encodeSession(session), {
    onFailure: (failure) => Option.some(fieldsOf(failure)),
    onSuccess: (stored) => {
      // oxlint-disable-next-line unicorn/prefer-structured-clone -- The session reaches decodeSession as JSON text, the form a host stores.
      const handedBack: unknown = JSON.parse(JSON.stringify(stored));

      return Option.map(Result.getFailure(decodeSession(handedBack, test)), fieldsOf);
    },
  });

/**
 * What {@link refusalOf} gives for a session `decodeSession` refuses against its test: an
 * InvalidSession at stage decode, naming the version 3 the session holds.
 */
const refusedAgainstTest = Option.some(["InvalidSession", "decode", Option.some(3)]);

/**
 * Give {@link seeded}'s items with changes made to some of them.
 *
 * @param changes The fields that change, by the item's index among the items.
 * @returns The items.
 */
const itemsWith = (
  changes: Readonly<Record<number, Partial<SessionItem>>>,
): readonly SessionItem[] => seeded.items.map((item, index) => ({ ...item, ...changes[index] }));

/**
 * {@link processed} once its nonlinear part `part-2` has started, with changes made to some of its
 * items: once with `part-2` current and the session at its item, and once with both parts ended
 * and the session closed.
 *
 * @param changes The fields that change, by the item's index among the items.
 * @returns The two sessions.
 */
const startedSessions = (
  changes: Readonly<Record<number, Partial<SessionItem>>>,
): readonly TestSession[] => {
  const items = processed.items.map((item, index) => ({ ...item, ...changes[index] }));

  return [
    {
      ...processed,
      items,
      parts: [
        { identifier: "part-1", status: "ended" },
        { identifier: "part-2", status: "current" },
      ],
      position: 1,
    },
    {
      ...processed,
      items,
      parts: [
        { identifier: "part-1", status: "ended" },
        { identifier: "part-2", status: "ended" },
      ],
      position: 1,
      status: "closed",
    },
  ];
};

/**
 * Whether `decodeSession` refuses a session against a test for an item's stored template defaults:
 * its InvalidSession's issue starts with the path to them.
 *
 * @param session The session, which encodes.
 * @param test The test it is decoded against, {@link owner} by default.
 * @param index The item's index among the session's items, 1 by default.
 * @returns Whether that is what it refuses.
 */
const defaultsRefused = (session: TestSession, test: SessionTest = owner, index = 1): boolean =>
  Result.match(encodeSession(session), {
    onFailure: () => false,
    onSuccess: (stored) =>
      Option.exists(
        Result.getFailure(decodeSession(stored, test)),
        (failure) =>
          failure._tag === "InvalidSession" &&
          failure.issue.startsWith(`items[${String(index)}].templateDefaults `),
      ),
  });

describe("decodeSession checks a stored session against its test", () => {
  it("[T-14] passes a stored session against its test that meets every rule, closed and with no item included", () => {
    const empty: SessionTest = {
      test: {
        ...owner.test,
        parts: [{ children: [], identifier: "part-1", navigation: "linear" }],
      },
    };
    const closed: TestSession = {
      ...seeded,
      items: [],
      parts: [{ identifier: "part-1", status: "ended" }],
      status: "closed",
    };

    assert.deepStrictEqual(
      [seeded, processed, closed].map((session, index) =>
        refusalOf(session, index === 2 ? empty : owner),
      ),
      [Option.none(), Option.none(), Option.none()],
    );
  });

  it("[T-14] refuses a stored session against its test whose items are not the test's item refs in document order, one per ref", () => {
    const swapped = itemsWith({
      0: { ...unpresented, record: fresh(bg007Item, "s1.1"), sequenceIndex: 1 },
      1: { ...answered, record: { ...answered.record, instance: "s1.2" }, sequenceIndex: 2 },
    });

    for (const items of [
      seeded.items.slice(0, 1),
      [...seeded.items, { ...unpresented, record: fresh(bg007Item, "s1.3"), sequenceIndex: 3 }],
      itemsWith({ 1: { ref: "item-1" } }),
      swapped,
      itemsWith({ 1: { ref: "item-3" } }),
    ]) {
      assert.deepStrictEqual(
        refusalOf({ ...seeded, items }),
        refusedAgainstTest,
        items.map((item) => item.ref).join(" "),
      );
    }
  });

  it("[T-14] refuses a stored session against its test whose sequence indexes are not 1 to n in order", () => {
    for (const sequenceIndex of [3, 1]) {
      const items = itemsWith({
        1: { record: fresh(bg007Item, `s1.${String(sequenceIndex)}`), sequenceIndex },
      });

      assert.deepStrictEqual(refusalOf({ ...seeded, items }), refusedAgainstTest);
    }
  });

  it("[T-14] refuses a stored session against its test whose parts are not the test's in order, or whose statuses are out of order", () => {
    for (const parts of [
      [{ identifier: "part-1", status: "current" }],
      [
        { identifier: "part-2", status: "current" },
        { identifier: "part-1", status: "pending" },
      ],
      [
        { identifier: "part-1", status: "current" },
        { identifier: "part-2", status: "pending" },
        { identifier: "part-3", status: "pending" },
      ],
      [
        { identifier: "part-1", status: "pending" },
        { identifier: "part-2", status: "current" },
      ],
      [
        { identifier: "part-1", status: "current" },
        { identifier: "part-2", status: "current" },
      ],
      [
        { identifier: "part-1", status: "current" },
        { identifier: "part-2", status: "ended" },
      ],
    ] as const) {
      assert.deepStrictEqual(
        refusalOf({ ...seeded, parts }),
        refusedAgainstTest,
        JSON.stringify(parts),
      );
    }
  });

  it("[T-14] refuses a stored session against its test that is closed while a part is current", () => {
    const ended: TestSession = {
      ...processed,
      parts: processed.parts.map(({ identifier }) => ({ identifier, status: "ended" })),
      status: "closed",
    };

    assert.deepStrictEqual(refusalOf(ended), Option.none());
    assert.deepStrictEqual(refusalOf({ ...seeded, status: "closed" }), refusedAgainstTest);
  });

  it("[T-14] refuses a stored session against its test whose item record's instance is not the session's instance, a dot and its sequence index", () => {
    for (const instance of ["s1.3", "s2.2", "s1", "s1.02"]) {
      const items = itemsWith({ 1: { record: fresh(bg007Item, instance) } });

      assert.deepStrictEqual(refusalOf({ ...seeded, items }), refusedAgainstTest, instance);
    }
  });

  it("[T-14] refuses a stored session against its test whose dates are not ISO 8601 UTC instants, or that was updated before it started", () => {
    const valid: TestSession = {
      ...seeded,
      items: itemsWith({ 1: { datestamp: "2026-11-05T10:00:00Z" } }),
      started: "2026-11-05T10:00:00.1Z",
      updated: "+002026-11-05T10:00:12.500Z",
    };

    assert.deepStrictEqual(refusalOf(valid), Option.none());
    for (const datestamp of [
      "2026-11-05",
      "2026-11-05T10:00:00.000+01:00",
      "2026-11-05T10:00:00.000",
      "2026-02-30T10:00:00.000Z",
      "2026-11-05T24:00:00.000Z",
      "2026-11-05T10:00:60.000Z",
      "Thu, 05 Nov 2026 10:00:00 GMT",
    ]) {
      for (const session of [
        { ...seeded, started: datestamp },
        { ...seeded, updated: datestamp },
        { ...seeded, items: itemsWith({ 1: { datestamp } }) },
      ]) {
        assert.deepStrictEqual(refusalOf(session), refusedAgainstTest, datestamp);
      }
    }
    assert.deepStrictEqual(
      refusalOf({ ...seeded, updated: "2026-11-05T09:59:59.999Z" }),
      refusedAgainstTest,
    );
  });

  it("[T-14] refuses a stored session against its test whose position is past its items", () => {
    const empty: SessionTest = {
      test: {
        ...owner.test,
        parts: [{ children: [], identifier: "part-1", navigation: "linear" }],
      },
    };
    const closed: TestSession = {
      ...seeded,
      items: [],
      parts: [{ identifier: "part-1", status: "ended" }],
      status: "closed",
    };

    assert.deepStrictEqual(refusalOf({ ...seeded, position: 1 }), Option.none());
    assert.deepStrictEqual(refusalOf({ ...seeded, position: 2 }), refusedAgainstTest);
    assert.deepStrictEqual(refusalOf({ ...closed, position: 1 }, empty), refusedAgainstTest);
  });

  it("[T-14] refuses a stored session against its test whose outcomes are not exactly the test's declared outcomes, each of its declared base type and cardinality", () => {
    const { TOTAL: _total, ...missing } = seeded.outcomes;

    for (const outcomes of [
      missing,
      { ...seeded.outcomes, EXTRA: float(1) },
      { ...seeded.outcomes, SCORE: integer(0n) },
      { ...seeded.outcomes, SCORE: { ...float(0), cardinality: "multiple" } },
      { ...seeded.outcomes, PASSED: nullOf("boolean", "ordered") },
    ] as const) {
      assert.deepStrictEqual(
        refusalOf({ ...seeded, outcomes }),
        refusedAgainstTest,
        Object.keys(outcomes).join(" "),
      );
    }
  });

  it.effect(
    "[T-14] refuses a stored session against its test whose run count is below 0 or not whole",
    () =>
      Effect.gen(function* refusesRunCounts() {
        const stored = yield* Effect.fromResult(encodeSession(seeded));

        for (const outcomeRuns of [-1, 1.5]) {
          assert.deepStrictEqual(
            Option.map(failureOf({ ...stored, outcomeRuns }), fieldsOf),
            refusedAgainstTest,
            String(outcomeRuns),
          );
        }
      }),
  );

  it("[T-14] refuses stored defaults that do not fit the item ref of a started nonlinear part: none stored, T missing, or a key U the ref does not default", () => {
    const unfit: readonly SessionItem["templateDefaults"][] = [
      Option.none(),
      Option.some({}),
      Option.some({ U: drawn }),
      Option.some({ T: drawn, U: drawn }),
    ];

    for (const templateDefaults of unfit) {
      const keys = Option.isNone(templateDefaults)
        ? "none stored"
        : `keys ${Object.keys(templateDefaults.value).join(" ")}`;

      for (const session of startedSessions({ 1: { templateDefaults } })) {
        assert.deepStrictEqual(
          [refusalOf(session), defaultsRefused(session)],
          [refusedAgainstTest, true],
          `${JSON.stringify(session.parts)} ${keys}`,
        );
      }
    }
  });

  it("[T-14] leaves stored defaults that do not fit unjudged in a pending or a linear part, and decodes a started nonlinear part's that fit, processed round-tripping unchanged", () => {
    const lax: SessionItem["templateDefaults"] = Option.some({ U: drawn });

    assert.deepStrictEqual(
      [
        refusalOf(processed),
        refusalOf(seeded),
        refusalOf({ ...seeded, items: itemsWith({ 1: { templateDefaults: lax } }) }),
        refusalOf({ ...seeded, items: itemsWith({ 0: { templateDefaults: lax } }) }),
        ...startedSessions({}).map((session) => refusalOf(session)),
        ...startedSessions({ 0: { templateDefaults: lax } }).map((session) => refusalOf(session)),
      ],
      Array.from({ length: 8 }, () => Option.none()),
    );
    assert.deepStrictEqual(throughHost(processed), Result.succeed(processed));
  });

  it("[T-14] refuses stored defaults that do not fit an item ref with no template default in a started nonlinear part: any stored map, an empty one included", () => {
    const nonlinear: SessionTest = {
      test: {
        ...owner.test,
        parts: owner.test.parts.map((part) => ({ ...part, navigation: "nonlinear" })),
      },
    };

    for (const session of startedSessions({})) {
      assert.deepStrictEqual(refusalOf(session, nonlinear), Option.none());
    }
    const unfit: readonly SessionItem["templateDefaults"][] = [
      Option.some({}),
      Option.some({ T: drawn }),
    ];

    for (const templateDefaults of unfit) {
      for (const session of startedSessions({ 0: { templateDefaults } })) {
        assert.deepStrictEqual(
          [refusalOf(session, nonlinear), defaultsRefused(session, nonlinear, 0)],
          [refusedAgainstTest, true],
          JSON.stringify(session.parts),
        );
      }
    }
  });
});

describe("encodeSession", () => {
  it.effect("refuses an integer value holding the number 1.5: InvalidSession at stage encode", () =>
    Effect.gen(function* refusesInexact() {
      const inexact = {
        baseType: "integer",
        cardinality: "single",
        values: [{ baseType: "integer", value: 1.5 }],
      } as const;
      const session: TestSession = {
        ...seeded,
        // @ts-expect-error -- an integer holds a bigint; the number 1.5 is what encode must refuse.
        items: [{ ...unpresented, saved: Option.some({ COUNT: inexact }) }],
      };
      const failure = yield* Effect.flip(Effect.fromResult(encodeSession(session)));

      assert.deepStrictEqual(fieldsOf(failure), ["InvalidSession", "encode", Option.none()]);
    }),
  );
});

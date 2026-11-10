import { assert, describe, it } from "@effect/vitest";
import { Effect, Option, Schema } from "effect";
import { begin } from "#plate/begin.ts";
import { decodeRecord } from "#plate/codec/record.ts";
import { decodeSession, encodeSession } from "#plate/codec/session.ts";
import type { SessionTest } from "#plate/codec/session.ts";
import type { RedactedJsonSchema } from "#plate/effect/schemas.ts";
import {
  ConfigurationJsonSchema,
  RedactedJsonJsonSchema,
  RefusalJsonSchema,
  StoredRecordJsonSchema,
  StoredRecordSchema,
  StoredTestSessionJsonSchema,
  StoredTestSessionSchema,
} from "#plate/effect/schemas.ts";
import { fresh } from "#plate/model/record.ts";
import type { Redacted } from "#plate/payload.ts";
import type { TestSession } from "#plate/session/session.ts";
import { bg007Item } from "#plate/test/fixtures.ts";
import { acceptForTest } from "#plate/validate/verdict.ts";

/**
 * The five JSON Schema documents, by the name of the Schema each describes.
 */
const documents = {
  ConfigurationSchema: ConfigurationJsonSchema,
  RedactedJsonSchema: RedactedJsonJsonSchema,
  RefusalSchema: RefusalJsonSchema,
  StoredRecordSchema: StoredRecordJsonSchema,
  StoredTestSessionSchema: StoredTestSessionJsonSchema,
};

/**
 * A one-item session of the test `m2` in `tests/m2.xml`, seed `"7"`, with no shuffle seed: its
 * one part current and its one item, a BG007-decoded record, not yet presented.
 */
const session: TestSession = {
  document: "tests/m2.xml",
  instance: "s1",
  items: [
    {
      datestamp: "2026-11-05T10:00:00.000Z",
      duration: 0,
      firstOutcomes: Option.none(),
      presented: false,
      record: fresh(bg007Item, "s1.1"),
      ref: "item-1",
      saved: Option.none(),
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
  test: "m2",
  updated: "2026-11-05T10:00:00.000Z",
};

/**
 * A test other than {@link session}'s, `other` in `tests/other.xml`, against which `decodeSession`
 * refuses the session as `SessionMismatch`.
 */
const another: SessionTest = {
  test: { document: "tests/other.xml", identifier: "other", outcomes: new Map(), parts: [] },
};

/**
 * Hand a shape-only decode of the redacted item's JSON form where a `Redacted` is wanted, which its
 * type refuses: the type test is the `@ts-expect-error` below, which `tsc` fails on if the line
 * ever type-checks. No test calls it.
 *
 * @param fields What {@link RedactedJsonSchema} decodes.
 * @returns The fields, as the `Redacted` they are not.
 */
const brandedUnredacted = (fields: typeof RedactedJsonSchema.Type): Redacted =>
  // @ts-expect-error -- a shape-only decode gives the fields, not a `Redacted`: only `redact` and `decodeRedacted` brand one.
  fields;

describe("the ./effect Schemas", () => {
  it("give a JSON Schema document with a schema body for each shape-only Schema", () => {
    for (const [name, document] of Object.entries(documents)) {
      assert.strictEqual(document.dialect, "draft-2020-12", name);
      assert.isNotEmpty(Object.keys(document.schema), name);
    }
  });

  it.effect(
    "decode a record begin wrote with the shape-only Schema, as decodeRecord reads it",
    () =>
      Effect.gen(function* recordDecodes() {
        const stored = yield* Effect.fromResult(
          begin(acceptForTest(bg007Item), { instance: "q1", seed: "7" }),
        );
        const decoded = yield* Schema.decodeUnknownEffect(
          Schema.fromJsonString(StoredRecordSchema),
        )(JSON.stringify(stored));

        assert.deepStrictEqual(decoded, yield* Effect.fromResult(decodeRecord(stored)));
      }),
  );

  it.effect("decode a session encodeSession wrote with the shape-only Schema", () =>
    Effect.gen(function* sessionDecodes() {
      const stored = yield* Effect.fromResult(encodeSession(session));
      const decoded = yield* Schema.decodeUnknownEffect(
        Schema.fromJsonString(StoredTestSessionSchema),
      )(JSON.stringify(stored));

      assert.deepStrictEqual(decoded, session);
    }),
  );

  it.effect(
    "decode, with the shape-only Schema, a stored session decodeSession refuses for another test",
    () =>
      Effect.gen(function* mismatchDecodes() {
        const stored = yield* Effect.fromResult(encodeSession(session));
        const refusal = yield* Effect.flip(Effect.fromResult(decodeSession(stored, another)));
        const decoded = yield* Schema.decodeUnknownEffect(StoredTestSessionSchema)(stored);

        assert.strictEqual(refusal._tag, "SessionMismatch");
        assert.deepStrictEqual(decoded, session);
      }),
  );

  it("are typed so a shape-only Schema mints no Redacted brand", () => {
    assert.isFunction(brandedUnredacted);
  });
});

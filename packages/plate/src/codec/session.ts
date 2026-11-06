/**
 * The Schema codec of the test session, for the server and the boundaries: {@link TestSessionSchema}
 * checks the plain {@link TestSession} of `#plate/session/session.ts`, {@link encodeSession} writes
 * it in the form the host stores, and {@link decodeSession} checks one the host hands back, against
 * the test it must belong to, before the library trusts it.
 *
 * The stored form names its version, as the stored item record does, and each item's record in it
 * is a stored item record. No browser module imports this file, so Schema stays out of the browser
 * bundle.
 *
 * @module
 */
import { Data, Option, Result, Schema, SchemaTransformation } from "effect";
import { ItemRecordSchema, storedVersion, versionIssue, versionOf } from "#plate/codec/record.ts";
import { ValueSchema } from "#plate/codec/values.ts";
import type { TestSession } from "#plate/session/session.ts";

/**
 * Values by identifier: an item's saved responses, or its first outcomes.
 */
const ValuesSchema = Schema.Record(Schema.String, ValueSchema);

/**
 * The Schema of one item of a test session. `saved` and `firstOutcomes` are left out of the stored
 * form when there are none.
 */
const SessionItemSchema = Schema.Struct({
  datestamp: Schema.String,
  duration: Schema.Finite.check(Schema.isGreaterThanOrEqualTo(0)),
  firstOutcomes: Schema.OptionFromOptionalKey(ValuesSchema),
  presented: Schema.Boolean,
  record: ItemRecordSchema,
  ref: Schema.String,
  saved: Schema.OptionFromOptionalKey(ValuesSchema),
  sequenceIndex: Schema.Int.check(Schema.isGreaterThanOrEqualTo(1)),
});

/**
 * The fields of a test session, as {@link TestSession} has them. `seed` is left out of the stored
 * form when the session has none, and is otherwise a finite JSON number, which JSON text carries
 * exactly.
 */
const sessionFields = {
  document: Schema.String,
  instance: Schema.String,
  items: Schema.Array(SessionItemSchema),
  kind: Schema.Literal("test"),
  parts: Schema.Array(
    Schema.Struct({
      identifier: Schema.String,
      status: Schema.Literals(["current", "ended", "pending"]),
    }),
  ),
  position: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  seed: Schema.OptionFromOptionalKey(Schema.Finite),
  started: Schema.String,
  status: Schema.Literals(["closed", "interacting"]),
  test: Schema.String,
  updated: Schema.String,
};

/**
 * The Schema of a test session; its type is {@link TestSession}, and its encoded form the
 * {@link StoredTestSession} the host keeps, which adds `version`. Encoding writes
 * {@link storedVersion} and decoding requires it, so the plain session carries no version.
 */
export const TestSessionSchema = Schema.Struct({
  ...sessionFields,
  version: Schema.Literal(storedVersion),
}).pipe(
  Schema.decodeTo(
    Schema.toType(Schema.Struct(sessionFields)),
    SchemaTransformation.transform({
      decode: ({ version: _stored, ...session }) => session,
      encode: (session) => ({ ...session, version: storedVersion }),
    }),
  ),
);

/**
 * A test session in the form the host stores: JSON-safe data that names its version, `1`. Every
 * value is written as the stored item record writes it, integers as their decimal digits, so no
 * integer is rounded on the way through the host; each item's `record` is a stored item record;
 * `seed`, an item's `saved` and an item's `firstOutcomes` are absent when there are none.
 */
export type StoredTestSession = typeof TestSessionSchema.Encoded;

/**
 * The test a stored session must belong to: its identifier and its document's location, as the
 * accepted test's model gives them.
 */
export interface SessionTest {
  readonly test: {
    /**
     * The test document's location.
     */
    readonly document: string;
    /**
     * The test's identifier.
     */
    readonly identifier: string;
  };
}

/**
 * Where the session codec failed: reading a session the host handed back, or writing one.
 */
export type SessionStage = "decode" | "encode";

/**
 * What each {@link SessionStage}'s failure means and what to do about it.
 */
const sessionRemedies: Readonly<Record<SessionStage, (issue: string) => string>> = {
  decode: (issue) =>
    `The stored test session is not one this renderer reads: ${issue}. Pass back, unchanged, the session encodeSession wrote, or start the test again.`,
  encode: (issue) =>
    `The test session does not fit its stored form: ${issue}. Pass the session startTest or advance returned, unchanged; if you did, report it with the test as a renderer defect.`,
};

/**
 * A test session the codec could not read or write: one the host handed back that this renderer
 * did not write, another version included (`stage` `decode`), or one that does not fit the
 * session's Schema on its way out (`stage` `encode`).
 */
export class InvalidSession extends Data.TaggedError("InvalidSession")<{
  /**
   * What is wrong, with the path to it: the version found, when that is what is wrong.
   */
  readonly issue: string;
  /**
   * Whether the session failed on its way in from the host or on its way out to it.
   */
  readonly stage: SessionStage;
  /**
   * The value the stored session holds under `version`, which is `1` when something else is
   * wrong; none when it is not an object or names no version, and at stage `encode`, where no
   * stored session was read.
   */
  readonly version: Option.Option<unknown>;
}> {
  /**
   * What is wrong and what to do instead, in one line.
   */
  override get message(): string {
    return sessionRemedies[this.stage](this.issue);
  }
}

/**
 * Which of a session's names did not match its test's: the test's identifier or its document's
 * location.
 */
export type SessionField = "document" | "test";

/**
 * A stored session that belongs to another test, or to another document of a test with the same
 * identifier, than the one it was handed back with.
 */
export class SessionMismatch extends Data.TaggedError("SessionMismatch")<{
  /**
   * The test's own identifier or document location.
   */
  readonly expected: string;
  /**
   * Which of the two did not match.
   */
  readonly field: SessionField;
  /**
   * What the stored session names instead.
   */
  readonly found: string;
}> {
  /**
   * What is wrong and what to do instead, in one line.
   */
  override get message(): string {
    const named = this.field === "test" ? "test" : "test document";

    return `The stored test session belongs to the ${named} ${this.found}, not ${this.expected}. Pass the session started for this test, or start a new one.`;
  }
}

/**
 * Write a test session in the form the host stores.
 *
 * @param session The session.
 * @returns The {@link StoredTestSession}, which `JSON.stringify` writes without loss and
 *   {@link decodeSession} reads back to `session`, or {@link InvalidSession} at stage `encode`
 *   naming a value that does not fit the session's Schema.
 */
export const encodeSession = (
  session: TestSession,
): Result.Result<StoredTestSession, InvalidSession> =>
  Result.mapError(
    Schema.encodeResult(TestSessionSchema)(session),
    (schemaError) =>
      new InvalidSession({ issue: schemaError.message, stage: "encode", version: Option.none() }),
  );

/**
 * Check that a session names the test it was handed back with.
 *
 * @param session The decoded session.
 * @param test The test it must belong to.
 * @returns The session, or {@link SessionMismatch} naming the first name that differs: the test's
 *   identifier, then its document's location.
 */
const belonging = (
  session: TestSession,
  test: SessionTest,
): Result.Result<TestSession, SessionMismatch> => {
  if (session.test !== test.test.identifier) {
    return Result.fail(
      new SessionMismatch({ expected: test.test.identifier, field: "test", found: session.test }),
    );
  }

  return session.document === test.test.document
    ? Result.succeed(session)
    : Result.fail(
        new SessionMismatch({
          expected: test.test.document,
          field: "document",
          found: session.document,
        }),
      );
};

/**
 * Check a test session the host handed back.
 *
 * @param input The stored session, as the host returned it: the {@link StoredTestSession}
 *   {@link encodeSession} wrote, after any JSON round trip. A session that names no version, or
 *   another version than {@link storedVersion}, is refused before the rest is read.
 * @param test The test the session must belong to.
 * @returns The session; {@link InvalidSession} at stage `decode` naming what does not fit, with the
 *   version found when that is what does not fit; or {@link SessionMismatch} when the session
 *   names another test or test document.
 */
export const decodeSession = (
  // oxlint-disable-next-line anti-slop/no-unknown-parameters -- The host stores the session and hands it back as any value, and this is the check that parses it.
  input: unknown,
  test: SessionTest,
): Result.Result<TestSession, InvalidSession | SessionMismatch> => {
  const version = versionOf(input);

  return Option.match(versionIssue(input), {
    onNone: () =>
      Result.flatMap(
        Result.mapError(
          Schema.decodeUnknownResult(TestSessionSchema)(input),
          (schemaError) =>
            new InvalidSession({ issue: schemaError.message, stage: "decode", version }),
        ),
        (session) => belonging(session, test),
      ),
    onSome: (issue) => Result.fail(new InvalidSession({ issue, stage: "decode", version })),
  });
};

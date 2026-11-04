/**
 * The Schema codec of the session record, for the server and the boundaries:
 * {@link ItemRecordSchema} checks the plain {@link ItemRecord} of `#plate/model/record.ts`,
 * {@link encodeRecord} writes it in the form the host stores, and {@link decodeRecord} checks one
 * the host hands back before the renderer trusts it.
 *
 * No browser module imports this file, so Schema stays out of the browser bundle.
 *
 * @module
 */
import { Data, Result, Schema } from "effect";
import { ValueSchema } from "#plate/codec/values.ts";
import type { ItemRecord } from "#plate/model/record.ts";

/**
 * The Schema of one item's session; its type is {@link ItemRecord}, and its encoded form the
 * {@link StoredRecord} the host keeps.
 */
export const ItemRecordSchema = Schema.Struct({
  attempt: Schema.Literals(["none", "refused", "submitted"]),
  document: Schema.String,
  instance: Schema.String,
  item: Schema.String,
  kind: Schema.Literal("item"),
  notices: Schema.Array(Schema.String),
  numAttempts: Schema.Int.check(Schema.isGreaterThanOrEqualTo(0)),
  outcomes: Schema.Record(Schema.String, ValueSchema),
  responses: Schema.Record(Schema.String, ValueSchema),
});

/**
 * One item's session in the form the host stores: JSON-safe data, with every integer written as
 * its decimal digits, so no integer is rounded on the way through the host.
 */
export type StoredRecord = typeof ItemRecordSchema.Encoded;

/**
 * A session record the host handed back that is not one the renderer could have written.
 */
export class InvalidRecord extends Data.TaggedError("InvalidRecord")<{
  /**
   * What the record's Schema found wrong, with the path to it.
   */
  readonly issue: string;
}> {
  /**
   * What is wrong and what to pass instead, in one line.
   */
  override get message(): string {
    return `The session record is not one the renderer wrote: ${this.issue}. Pass back the record the last open or submit returned, unchanged.`;
  }
}

/**
 * Write a session record in the form the host stores, every integer as its decimal digits.
 *
 * @param record The record.
 * @returns The {@link StoredRecord}, which `JSON.stringify` writes without loss and
 *   {@link decodeRecord} reads back to `record`, or {@link InvalidRecord} naming a value that does
 *   not fit the record's Schema.
 */
export const encodeRecord = (record: ItemRecord): Result.Result<StoredRecord, InvalidRecord> =>
  Result.mapError(
    Schema.encodeResult(ItemRecordSchema)(record),
    (schemaError) => new InvalidRecord({ issue: schemaError.message }),
  );

/**
 * Check a session record the host handed back.
 *
 * @param input The stored record, as the host returned it: the {@link StoredRecord}
 *   {@link encodeRecord} wrote, after any JSON round trip. An integer written as a JSON number is
 *   refused.
 * @returns The record, or {@link InvalidRecord} naming what does not fit.
 */
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- The host stores the record and hands it back as any value, and this is the check that parses it.
export const decodeRecord = (input: unknown): Result.Result<ItemRecord, InvalidRecord> =>
  Result.mapError(
    Schema.decodeUnknownResult(ItemRecordSchema)(input),
    (schemaError) => new InvalidRecord({ issue: schemaError.message }),
  );

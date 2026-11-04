/**
 * The scoring function an author calls: {@link score}, which runs one attempt and returns the record
 * to store. It is a plain function that returns a `Result`. It validates responses with
 * `checkResponses`, which lives in its own browser module, `responses.ts`, so that a host can
 * import it without this one.
 *
 * The library keeps no state of an author's flow (rule `a9d04969`): the host stores the record
 * `score` returns and hands it back, and no attempt limit applies here. `score` reads and writes
 * that record through the record's Schema codec, so this is a boundary module, not a browser one.
 *
 * @module
 */
import { Data, Option, Result, Schema } from "effect";
import { decodeRecord, encodeRecord } from "#plate/codec/record.ts";
import type { InvalidRecord, StoredRecord } from "#plate/codec/record.ts";
import { ValueSchema } from "#plate/codec/values.ts";
import type { Configuration } from "#plate/configuration.ts";
import { runAttempt } from "#plate/engine/attempt.ts";
import type { EngineFailure } from "#plate/engine/evaluate.ts";
import type { Item, ResponseDeclaration } from "#plate/model/item.ts";
import { fresh } from "#plate/model/record.ts";
import type { ItemRecord } from "#plate/model/record.ts";
import type { Value } from "#plate/model/values.ts";
import type { ValidationMessage } from "#plate/payload.ts";
import { checkResponses } from "#plate/responses.ts";
import type { Accepted } from "#plate/validate/verdict.ts";

/**
 * A session record that belongs to another item or document than the one being scored: a
 * developer error, returned through a `Result`.
 *
 * `item` and `document` are the scored item's; `recordItem` and `recordDocument` the record's.
 */
export class RecordMismatch extends Data.TaggedError("RecordMismatch")<{
  readonly document: string;
  readonly item: string;
  readonly recordDocument: string;
  readonly recordItem: string;
}> {
  /**
   * Both items and what to pass instead, in one line.
   */
  override get message(): string {
    return `The session record belongs to item ${JSON.stringify(this.recordItem)} in ${JSON.stringify(this.recordDocument)}, not to item ${JSON.stringify(this.item)} in ${JSON.stringify(this.document)}. Pass the record score returned for this item, or none to start it afresh.`;
  }
}

/**
 * Why a response is not one {@link score} takes.
 *
 * - `undeclared`: the item declares no response by that identifier.
 * - `not-a-value`: it is not a value at all (an integer as a number rather than a `bigint`, an empty
 *   string, two values in a single, …).
 * - `base-type`: a value of another base type than its declaration's.
 * - `cardinality`: a value of another cardinality than its declaration's.
 */
export type ResponseProblem = "base-type" | "cardinality" | "not-a-value" | "undeclared";

/**
 * What each {@link ResponseProblem} of a declared response says about it.
 */
const problemWords: Readonly<Record<ResponseProblem, string>> = {
  "base-type": "has another base type than its declaration",
  cardinality: "has another cardinality than its declaration",
  "not-a-value": "is not a value",
  undeclared: "is not declared",
};

/**
 * A response {@link score} cannot run: a developer error, returned through a `Result`.
 *
 * `response` is its identifier, `problem` what is wrong with it, and `expected` its declaration's
 * base type and cardinality, none when the item declares no such response.
 */
export class InvalidResponses extends Data.TaggedError("InvalidResponses")<{
  readonly expected: Option.Option<Pick<ResponseDeclaration, "baseType" | "cardinality">>;
  readonly problem: ResponseProblem;
  readonly response: string;
}> {
  /**
   * The response, what is wrong with it and what to pass instead, in one line.
   */
  override get message(): string {
    const name = JSON.stringify(this.response);

    return Option.match(this.expected, {
      onNone: () =>
        `The responses hold ${name}, which the item declares no response for. Pass only the item's declared responses, each under its identifier.`,
      onSome: ({ baseType, cardinality }) =>
        `The response ${name} ${problemWords[this.problem]}. Pass a value of base type ${baseType} and cardinality ${cardinality}, an integer as a bigint and NULL as no values, as decode gives it.`,
    });
  }
}

/**
 * Responses that break a limit the item sets whatever the configuration says (tier (a)): a
 * developer error, returned through a `Result`, with the messages the interactions gave.
 *
 * `score` records nothing for them, so the host's own count of refused posts, if it keeps one, is
 * the only trace.
 */
export class ResponsesRefused extends Data.TaggedError("ResponsesRefused")<{
  readonly messages: readonly ValidationMessage[];
}> {
  /**
   * The messages and what to do with them, in one line.
   */
  override get message(): string {
    const said = this.messages.map((entry) => `${entry.response}: ${entry.text}`).join("; ");

    return `The responses break the item's own limits (${said}). Show these messages, for example through render's messages option, and score the corrected responses; check them first with checkResponses.`;
  }
}

/**
 * The configuration tier (a) runs under: English, with `validateResponses` off, so only the limits
 * an item sets whatever the configuration says apply.
 *
 * It is a plain literal, every field the configuration's decode gives `{ locale: "en",
 * validateResponses: false }`, so importing this module runs no Schema decode and keeps no Schema
 * in a bundle. It is exported for its test only, which checks it against that decode; `index.ts`
 * does not list it.
 */
export const tierA: Configuration = {
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
 * Check that a record belongs to the item being scored.
 *
 * @param item The item.
 * @param record The decoded record.
 * @returns The record, or {@link RecordMismatch} when its item or document is another.
 */
const belonging = (item: Item, record: ItemRecord): Result.Result<ItemRecord, RecordMismatch> =>
  record.item === item.identifier && record.document === item.document
    ? Result.succeed(record)
    : Result.fail(
        new RecordMismatch({
          document: item.document,
          item: item.identifier,
          recordDocument: record.document,
          recordItem: record.item,
        }),
      );

/**
 * Find what is wrong with one response, as a value of its declaration's type.
 *
 * It checks the type-side value (`Schema.is`), so an integer is a `bigint`, as `decode` gives it.
 *
 * @param declaration The response's declaration, none when the item declares none.
 * @param value The response.
 * @returns The problem, or none when the response fits its declaration.
 */
const problemOf = (
  declaration: Option.Option<ResponseDeclaration>,
  value: Value,
): Option.Option<ResponseProblem> =>
  Option.match(declaration, {
    onNone: () => Option.some("undeclared"),
    onSome: ({ baseType, cardinality }) => {
      if (!Schema.is(ValueSchema)(value)) {
        return Option.some("not-a-value");
      }

      if (value.baseType !== baseType) {
        return Option.some("base-type");
      }

      return value.cardinality === cardinality ? Option.none() : Option.some("cardinality");
    },
  });

/**
 * Check each response as a value of its declaration's base type and cardinality.
 *
 * @param item The item.
 * @param responses The responses by identifier.
 * @returns The responses, or {@link InvalidResponses} for the first that does not fit.
 */
const checkedResponses = (
  item: Item,
  responses: Readonly<Record<string, Value>>,
): Result.Result<Readonly<Record<string, Value>>, InvalidResponses> =>
  Option.match(
    Option.firstSomeOf(
      Object.entries(responses).map(([response, value]) => {
        const declaration = Option.fromUndefinedOr(item.responses.get(response));

        return Option.map(
          problemOf(declaration, value),
          (problem) =>
            new InvalidResponses({
              expected: declaration.pipe(
                Option.map(({ baseType, cardinality }) => ({ baseType, cardinality })),
              ),
              problem,
              response,
            }),
        );
      }),
    ),
    {
      onNone: () => Result.succeed(responses),
      onSome: (invalid) => Result.fail(invalid),
    },
  );

/**
 * Score one attempt of an item: run its response processing over the responses and return the
 * record the host stores.
 *
 * In order: it decodes the record the host handed back, or starts a fresh one when there is none;
 * it checks each response as a value of its declaration; it refuses responses that break a tier (a)
 * limit, under the default configuration; then it runs the attempt and writes the record. It sets
 * no attempt limit: `maxAttempts` is the author's flow.
 *
 * @example
 *   const stored = score(accepted, { RESPONSE: decoded });
 *   // Result.succeed(record); pass Result.getSuccess's record back to the next score
 *
 * @param document The document `check` accepted.
 * @param responses The candidate's responses by identifier, each a value of its declaration's base
 *   type and cardinality, an integer as a `bigint`. A response left out keeps the record's value.
 * @param record The record the last `score` of this item returned, none for the first attempt.
 * @returns The record after the attempt, in the form the host stores, or {@link InvalidRecord} for a
 *   record the renderer did not write (or could not write), {@link RecordMismatch} for another
 *   item's record, {@link InvalidResponses} for a response that does not fit its declaration,
 *   {@link ResponsesRefused} for responses that break a tier (a) limit, or an
 *   {@link EngineFailure} when the record lacks a variable the processing reads or holds one of
 *   another type.
 */
export const score = (
  document: Accepted,
  responses: Readonly<Record<string, Value>>,
  record?: StoredRecord,
): Result.Result<
  StoredRecord,
  EngineFailure | InvalidRecord | InvalidResponses | RecordMismatch | ResponsesRefused
> =>
  Result.gen(function* scoreAttempt() {
    const { item } = document;
    const before =
      record === undefined ? fresh(item, "") : yield* belonging(item, yield* decodeRecord(record));
    const checked = yield* checkedResponses(item, responses);
    const messages = checkResponses(document, checked, tierA);
    if (messages.length > 0) {
      return yield* Result.fail(new ResponsesRefused({ messages }));
    }

    return yield* encodeRecord(yield* runAttempt(item, before, checked));
  });

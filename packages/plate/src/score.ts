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
import { InvalidRecord, decodeRecord, encodeRecord } from "#plate/codec/record.ts";
import type { StoredRecord } from "#plate/codec/record.ts";
import { ValueSchema } from "#plate/codec/values.ts";
import type { Configuration } from "#plate/configuration.ts";
import { runAttempt } from "#plate/engine/attempt.ts";
import type { EngineFailure } from "#plate/engine/evaluate.ts";
import type { Item, OutcomeDeclaration, ResponseDeclaration } from "#plate/model/item.ts";
import {
  completionStatus,
  completionStatusType,
  fresh,
  holdsCompletionStatus,
} from "#plate/model/record.ts";
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
 * - `undeclared`: the item scores no response by that identifier. It declares none, or declares one
 *   the renderer does not score: base type `duration` or `file`, cardinality `record`, or no base
 *   type.
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
  undeclared: "is not a response the item scores",
};

/**
 * A response {@link score} cannot run: a developer error, returned through a `Result`.
 *
 * `response` is its identifier, `problem` what is wrong with it, and `expected` its declaration's
 * base type and cardinality, none when the item scores no such response (`undeclared`).
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
        `The responses hold ${name}, but the item scores no response by that identifier: it declares none, or declares one the renderer does not score (base type duration or file, cardinality record, or no base type). Leave ${name} out of the responses.`,
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
 * `score` runs it on the record it is handed, and `restore` on the record it gives back, so
 * another item's record is refused before either checks it against the item's declarations.
 *
 * @param item The item.
 * @param record The decoded record.
 * @returns The record, or {@link RecordMismatch} when its item or document is another.
 */
export const belonging = (
  item: Item,
  record: ItemRecord,
): Result.Result<ItemRecord, RecordMismatch> =>
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
 * A kind of variable a stored record holds by identifier: a response or an outcome.
 */
type StoredVariable = "outcome" | "response";

/**
 * What a record holding an undeclared variable of each {@link StoredVariable} kind is told.
 */
const undeclaredWords: Readonly<Record<StoredVariable, string>> = {
  outcome: "the item declares no outcome by that identifier",
  response: "the item scores no response by that identifier",
};

/**
 * Say what is wrong with one variable a stored record holds, as a value of its declaration's
 * type.
 *
 * The record's codec has already checked the value is a value, so only its base type and
 * cardinality are left to check.
 *
 * @param variable Whether it is a response or an outcome.
 * @param identifier The variable's identifier.
 * @param declaration The variable's declaration, or the built-in's type, none when the item
 *   declares no such variable (or, for a response, declares one it does not score).
 * @param value The record's value of it.
 * @returns The issue, in words that name the variable, or none when the value fits.
 */
const storedMisfit = (
  variable: StoredVariable,
  identifier: string,
  declaration: Option.Option<Pick<OutcomeDeclaration, "baseType" | "cardinality">>,
  value: Value,
): Option.Option<string> => {
  const name = JSON.stringify(identifier);

  return Option.match(declaration, {
    onNone: () => Option.some(`it holds the ${variable} ${name}, but ${undeclaredWords[variable]}`),
    onSome: ({ baseType, cardinality }) =>
      value.baseType === baseType && value.cardinality === cardinality
        ? Option.none()
        : Option.some(
            `its ${variable} ${name} has base type ${value.baseType} and cardinality ${value.cardinality}, but the item declares it with base type ${baseType} and cardinality ${cardinality}`,
          ),
  });
};

/**
 * Find the first of a record's variables of one kind that does not fit the item's declarations.
 *
 * @param variable Whether the values are responses or outcomes.
 * @param declarations The item's declarations of that kind, with any built-in it holds, by
 *   identifier.
 * @param values The record's values of that kind, by identifier.
 * @returns The first issue, or none when every value fits.
 */
const firstMisfit = (
  variable: StoredVariable,
  declarations: ReadonlyMap<string, Pick<OutcomeDeclaration, "baseType" | "cardinality">>,
  values: Readonly<Record<string, Value>>,
): Option.Option<string> =>
  Option.firstSomeOf(
    Object.entries(values).map(([identifier, value]) =>
      storedMisfit(
        variable,
        identifier,
        Option.fromUndefinedOr(declarations.get(identifier)),
        value,
      ),
    ),
  );

/**
 * Give a record back, or refuse it with the issue found.
 *
 * @param record The decoded record.
 * @param issue What does not fit, none when everything does.
 * @returns The record, or {@link InvalidRecord} at stage `decode` with the issue.
 */
const unlessMisfit = (
  record: ItemRecord,
  issue: Option.Option<string>,
): Result.Result<ItemRecord, InvalidRecord> =>
  Option.match(issue, {
    onNone: () => Result.succeed(record),
    onSome: (found) => Result.fail(new InvalidRecord({ issue: found, stage: "decode" })),
  });

/**
 * Check what an attempt carries from a decoded record into the rules: each response the record
 * holds is one the item scores, of its declaration's base type and cardinality, and the built-in
 * `completionStatus`, where the item holds it, is a single identifier. It is the check
 * {@link score} runs on the record it is handed.
 *
 * A declared response the record lacks is left to the engine, which fails `UnknownIdentifierError`
 * if the processing reads it, and the attempt starts the built-in at `unknown` for a record that
 * lacks it. The declared outcomes are not checked: the attempt resets them to the item's defaults
 * before the rules run, so none the record holds reaches the engine.
 *
 * @param item The item.
 * @param record The decoded record, which belongs to the item.
 * @returns The record, or {@link InvalidRecord} at stage `decode` naming the first response, then
 *   the built-in, that does not fit.
 */
const carriedFitting = (item: Item, record: ItemRecord): Result.Result<ItemRecord, InvalidRecord> =>
  unlessMisfit(
    record,
    Option.orElse(firstMisfit("response", item.responses, record.responses), () =>
      holdsCompletionStatus(item)
        ? Option.flatMap(Option.fromUndefinedOr(record.outcomes[completionStatus]), (value) =>
            storedMisfit("outcome", completionStatus, Option.some(completionStatusType), value),
          )
        : Option.none(),
    ),
  );

/**
 * Give the type of each outcome a record of an item may hold: each outcome the item declares, and
 * the built-in `completionStatus`, a single identifier, where the item holds it
 * (`holdsCompletionStatus` in `#plate/model/record.ts`).
 *
 * @param item The item.
 * @returns Each outcome's base type and cardinality, keyed by identifier.
 */
const recordOutcomes = (
  item: Item,
): ReadonlyMap<string, Pick<OutcomeDeclaration, "baseType" | "cardinality">> =>
  holdsCompletionStatus(item)
    ? new Map<string, Pick<OutcomeDeclaration, "baseType" | "cardinality">>([
        ...item.outcomes,
        [completionStatus, completionStatusType],
      ])
    : item.outcomes;

/**
 * Check that a decoded record is one {@link score} could have written for the item: each response
 * it holds is one the item scores, and each outcome one the item declares or the built-in
 * `completionStatus` ({@link recordOutcomes}), each of its declaration's base type and
 * cardinality.
 *
 * `restore` and `results` run it, so a record that does not fit is refused rather than given back
 * or written into a result. It checks the responses and the built-in as `score` checks the record
 * it is handed, and the declared outcomes too, which `score` leaves alone because an attempt resets
 * them; every record `score` writes fits, since the engine sets only declared outcomes and the
 * built-in `completionStatus`, each to a value of its type. A declared variable the record lacks is
 * not refused, nor is a record that lacks `completionStatus`, as one written before the item held
 * the built-in does: the attempt starts it at `unknown`.
 *
 * @param item The item.
 * @param record The decoded record, which belongs to the item.
 * @returns The record, or {@link InvalidRecord} at stage `decode` naming the first response, then
 *   the first outcome, that does not fit.
 */
export const fitting = (item: Item, record: ItemRecord): Result.Result<ItemRecord, InvalidRecord> =>
  unlessMisfit(
    record,
    Option.orElse(firstMisfit("response", item.responses, record.responses), () =>
      firstMisfit("outcome", recordOutcomes(item), record.outcomes),
    ),
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
 * In order: it decodes the record the host handed back, checks that it belongs to the item, that
 * each response it holds is one the item scores, of its declaration's base type and cardinality,
 * and that the built-in `completionStatus`, which the attempt carries over, is a single identifier,
 * or starts a fresh record when there is none; it checks each response as a value of its
 * declaration; it refuses responses that break a tier (a) limit, under the default configuration;
 * then it runs the attempt and writes the record. It sets no attempt limit: `maxAttempts` is the
 * author's flow.
 *
 * @example
 *   const stored = score(accepted, { RESPONSE: decoded });
 *   // Result.succeed(record); pass Result.getSuccess's record back to the next score
 *
 * @param document The document `check` accepted.
 * @param responses The candidate's responses by identifier, each a value of its declaration's base
 *   type and cardinality, an integer as a `bigint`. A response left out keeps the record's value.
 * @param record The record the last `score` of this item returned, none for the first attempt.
 * @returns The record after the attempt, in the form the host stores, or {@link InvalidRecord} for
 *   a record the renderer did not write (or could not write), such as one that holds a response the
 *   item does not score, one of another base type or cardinality than its declaration, or a
 *   `completionStatus` that is not a single identifier, {@link RecordMismatch} for another item's
 *   record, {@link InvalidResponses} for a response that does not fit its declaration,
 *   {@link ResponsesRefused} for responses that break a tier (a) limit, or an {@link EngineFailure}
 *   when the record lacks a response the processing reads or the processing sets an outcome to a
 *   value of another type.
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
      record === undefined
        ? fresh(item, "")
        : yield* carriedFitting(item, yield* belonging(item, yield* decodeRecord(record)));
    const checked = yield* checkedResponses(item, responses);
    const messages = checkResponses(document, checked, tierA);
    if (messages.length > 0) {
      return yield* Result.fail(new ResponsesRefused({ messages }));
    }

    return yield* encodeRecord(yield* runAttempt(item, before, checked));
  });

/**
 * The scoring function an author calls: {@link score}, which runs one attempt and returns the record
 * to store. It is a plain function that returns a `Result`. It validates responses with
 * `checkResponses`, which lives in its own browser module, `responses.ts`, so that a host can
 * import it without this one.
 *
 * The library keeps no state of an author's flow (rule `a9d04969`): the host stores the record
 * `begin` starts and `score` returns, and hands it back, and no attempt limit applies here. `score`
 * reads and writes that record through the record's Schema codec, so this is a boundary module, not
 * a browser one.
 *
 * @module
 */
import { Data, Option, Result, Schema } from "effect";
import { InvalidRecord, decodeRecord, encodeRecord } from "#plate/codec/record.ts";
import type { StoredRecord } from "#plate/codec/record.ts";
import { ValueSchema } from "#plate/codec/values.ts";
import type { Configuration } from "#plate/configuration.ts";
import { firstAttempt, runAttempt } from "#plate/engine/attempt.ts";
import type { EngineFailure } from "#plate/engine/evaluate.ts";
import type { Item, OutcomeDeclaration, ResponseDeclaration } from "#plate/model/item.ts";
import {
  completionStatus,
  completionStatusType,
  holdsCompletionStatus,
} from "#plate/model/record.ts";
import type { ItemRecord } from "#plate/model/record.ts";
import type { Value } from "#plate/model/values.ts";
import { hiddenOnlyResponses } from "#plate/payload.ts";
import type { ValidationMessage } from "#plate/payload.ts";
import { checkResponses } from "#plate/responses.ts";
import { drawSeed } from "#plate/seed.ts";
import type { Accepted } from "#plate/validate/verdict.ts";

/**
 * A session record that belongs to another item or document than the one it is passed with: a
 * developer error, returned through a `Result` by `score`, `restore` and `results`.
 *
 * `item` and `document` are the passed item's; `recordItem` and `recordDocument` the record's.
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
    return `The session record belongs to item ${JSON.stringify(this.recordItem)} in ${JSON.stringify(this.recordDocument)}, not to item ${JSON.stringify(this.item)} in ${JSON.stringify(this.document)}. Pass back, unchanged, the record begin or score returned for this item.`;
  }
}

/**
 * An item whose template processing runs, scored with no record: a developer error, returned
 * through a `Result`.
 *
 * Such an item's template values, and the correct responses and defaults its template processing
 * sets, are drawn once, when its record starts, and response processing reads them from the record,
 * so `score` has nothing to score against without one and invents no values. `begin` starts the
 * record. `item` and `document` are the scored item's.
 */
export class RecordRequired extends Data.TaggedError("RecordRequired")<{
  readonly document: string;
  readonly item: string;
}> {
  /**
   * The item, why it needs its record and where the record comes from, in one line.
   */
  override get message(): string {
    return `The item ${JSON.stringify(this.item)} in ${JSON.stringify(this.document)} runs template processing, so score needs the record its first attempt started with. Start the record with begin, keep it where only the server reads it, and pass it to score with the responses.`;
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
  outputBudget: 16_777_216,
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
 * A kind of value a stored record holds by identifier: a response, an outcome, a template
 * variable, or a correct response or a default its template processing set.
 */
type StoredVariable = "correct response" | "default" | "outcome" | "response" | "template variable";

/**
 * What a record holding a value of each {@link StoredVariable} kind for an identifier the item
 * gives no type is told.
 */
const undeclaredWords: Readonly<Record<StoredVariable, string>> = {
  "correct response": "the item scores no response by that identifier",
  default: "the item scores no response and declares no outcome by that identifier",
  outcome: "the item declares no outcome by that identifier",
  response: "the item scores no response by that identifier",
  "template variable": "the item declares no template variable by that identifier",
};

/**
 * The type a record's value of one variable must have: its declaration's base type and
 * cardinality, or, for the built-in `completionStatus`, which no declaration gives, the built-in's
 * (`builtIn`).
 */
interface Expected extends Pick<OutcomeDeclaration, "baseType" | "cardinality"> {
  readonly builtIn: boolean;
}

/**
 * The type of the built-in `completionStatus`, a single identifier, as {@link Expected}.
 */
const builtInCompletion: Expected = { ...completionStatusType, builtIn: true };

/**
 * Give the type a declaration sets for a record's value of its variable.
 *
 * @param declaration The declaration, none when the item gives the identifier no type.
 * @returns Its base type and cardinality, as a declaration's, or none.
 */
const declared = (
  declaration: Pick<OutcomeDeclaration, "baseType" | "cardinality"> | undefined,
): Option.Option<Expected> =>
  Option.map(Option.fromUndefinedOr(declaration), ({ baseType, cardinality }) => ({
    baseType,
    builtIn: false,
    cardinality,
  }));

/**
 * Say what is wrong with one value a stored record holds, as a value of its variable's type.
 *
 * The record's codec has already checked the value is a value, so only its base type and
 * cardinality are left to check. A mistyped built-in `completionStatus` is named as the built-in,
 * since no declaration of the item gives its type.
 *
 * @param variable What kind of value it is.
 * @param identifier The identifier the record holds it under.
 * @param expected The type the value must have, none when the item gives that identifier no type
 *   of the kind (or, for a response, declares one it does not score).
 * @param value The record's value.
 * @returns The issue, in words that name the variable, or none when the value fits.
 */
const storedMisfit = (
  variable: StoredVariable,
  identifier: string,
  expected: Option.Option<Expected>,
  value: Value,
): Option.Option<string> => {
  const name = JSON.stringify(identifier);

  return Option.match(expected, {
    onNone: () => Option.some(`it holds the ${variable} ${name}, but ${undeclaredWords[variable]}`),
    onSome: ({ baseType, builtIn, cardinality }) =>
      value.baseType === baseType && value.cardinality === cardinality
        ? Option.none()
        : Option.some(
            `its ${variable} ${name} has base type ${value.baseType} and cardinality ${value.cardinality}, but ${builtIn ? `the built-in ${name} takes` : `the item declares ${name} with`} base type ${baseType} and cardinality ${cardinality}`,
          ),
  });
};

/**
 * Find the first of a record's values of one kind that does not fit its variable's type.
 *
 * @param variable What kind of values they are.
 * @param expectedOf The type each identifier's value must have, none when the item gives it no type
 *   of the kind.
 * @param values The record's values of that kind, by identifier.
 * @returns The first issue, or none when every value fits.
 */
const firstMisfit = (
  variable: StoredVariable,
  expectedOf: (identifier: string) => Option.Option<Expected>,
  values: Readonly<Record<string, Value>>,
): Option.Option<string> =>
  Option.firstSomeOf(
    Object.entries(values).map(([identifier, value]) =>
      storedMisfit(variable, identifier, expectedOf(identifier), value),
    ),
  );

/**
 * Find the first response a record holds that does not fit: one the item does not score, or one of
 * another base type or cardinality than its declaration.
 *
 * @param item The item.
 * @param record The decoded record, which belongs to the item.
 * @returns The first issue, or none when every response fits.
 */
const responseMisfit = (item: Item, record: ItemRecord): Option.Option<string> =>
  firstMisfit(
    "response",
    (identifier) => declared(item.responses.get(identifier)),
    record.responses,
  );

/**
 * Find the first of the values template processing left in a record that does not fit: each
 * template value one of a template variable the item declares, each correct response one of a
 * response the item scores, and each default one of a response it scores or an outcome it
 * declares, as template processing sets them (`targetOf` in `#plate/engine/template.ts`), each of
 * its declaration's base type and cardinality.
 *
 * A template variable the record lacks is not refused here: the record of an item whose
 * `qti-template-processing` the engine does not run holds none, and `results` and `advance` run
 * {@link fitting}, which shares this check, over the `fresh` record of an item never presented,
 * which holds no template value either. {@link templateGap} refuses the gap where it matters, on
 * the record `score` and `restore` take for an item whose template processing runs.
 *
 * @param item The item.
 * @param record The decoded record, which belongs to the item.
 * @returns The first issue, a template value's, then a correct response's, then a default's, or
 *   none when every value fits.
 */
const templateMisfit = (item: Item, record: ItemRecord): Option.Option<string> =>
  firstMisfit(
    "template variable",
    (identifier) => declared(item.templates.get(identifier)),
    record.templates,
  ).pipe(
    Option.orElse(() =>
      firstMisfit(
        "correct response",
        (identifier) => declared(item.responses.get(identifier)),
        record.correct,
      ),
    ),
    Option.orElse(() =>
      firstMisfit(
        "default",
        (identifier) => declared(item.responses.get(identifier) ?? item.outcomes.get(identifier)),
        record.defaults,
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
 * Find the first template variable an item declares that a record holds no value for, where the
 * item's template processing runs.
 *
 * Such an item's response processing reads values its template processing drew when the record
 * started, and every record `begin` or `score` writes for it holds a value, NULL included, for each
 * declared template variable. A record without one would be scored against the declarations, the
 * correct response its template processing overrides among them, so it is not one the renderer
 * wrote. An item whose template processing does not run is left alone: its record holds the
 * declared defaults, or, for a `qti-template-processing` the item model marks, no template value.
 *
 * @param item The item.
 * @param record The decoded record, which belongs to the item.
 * @returns The issue, naming the first such variable in declaration order, or none.
 */
const templateGap = (item: Item, record: ItemRecord): Option.Option<string> =>
  Option.isSome(item.templateProcessing)
    ? Option.map(
        Option.fromUndefinedOr(
          [...item.templates.keys()].find(
            (identifier) => !Object.hasOwn(record.templates, identifier),
          ),
        ),
        (identifier) =>
          `it holds no value for the template variable ${JSON.stringify(identifier)}, which the item's template processing sets when its record starts`,
      )
    : Option.none();

/**
 * Check that a decoded record holds a value for every template variable its item declares, where
 * the item's template processing runs ({@link templateGap}).
 *
 * `restore` runs it after {@link fitting}, and {@link score} runs its check, {@link templateGap},
 * inside {@link carriedFitting}, so neither gives back nor scores a record that would be scored
 * against the declared values its template processing replaces. {@link fitting} does not run it:
 * `results` and `advance` run that over the `fresh` record of an item never presented, which holds
 * no template value and must still fit.
 *
 * @param item The item.
 * @param record The decoded record, which belongs to the item.
 * @returns The record, or {@link InvalidRecord} at stage `decode` naming the first declared
 *   template variable it holds no value for.
 */
export const templatesHeld = (
  item: Item,
  record: ItemRecord,
): Result.Result<ItemRecord, InvalidRecord> => unlessMisfit(record, templateGap(item, record));

/**
 * Check what an attempt carries from a decoded record into the rules: each response the record
 * holds is one the item scores, of its declaration's base type and cardinality; the built-in
 * `completionStatus`, where the item holds it, is a single identifier; the template values,
 * correct responses and defaults fit as {@link templateMisfit} checks them; and, where the item's
 * template processing runs, it holds a value for each declared template variable
 * ({@link templatesHeld}). It is the check {@link score} runs on the record it is handed.
 *
 * A declared response the record lacks is left to the engine, which fails `UnknownIdentifierError`
 * if the processing reads it, and the attempt starts the built-in at `unknown` for a record that
 * lacks it. The declared outcomes are not checked: the attempt resets them to their defaults before
 * the rules run, so none the record holds reaches the engine.
 *
 * @param item The item.
 * @param record The decoded record, which belongs to the item.
 * @returns The record, or {@link InvalidRecord} at stage `decode` naming the first response, then
 *   the built-in, then the first template value, correct response or default, that does not fit,
 *   then the first declared template variable it holds no value for.
 */
const carriedFitting = (item: Item, record: ItemRecord): Result.Result<ItemRecord, InvalidRecord> =>
  unlessMisfit(
    record,
    responseMisfit(item, record).pipe(
      Option.orElse(() =>
        holdsCompletionStatus(item)
          ? Option.flatMap(Option.fromUndefinedOr(record.outcomes[completionStatus]), (value) =>
              storedMisfit("outcome", completionStatus, Option.some(builtInCompletion), value),
            )
          : Option.none(),
      ),
      Option.orElse(() => templateMisfit(item, record)),
      Option.orElse(() => templateGap(item, record)),
    ),
  );

/**
 * Give the type of an outcome a record of an item may hold: an outcome the item declares, or the
 * built-in `completionStatus`, a single identifier, where the item holds it
 * (`holdsCompletionStatus` in `#plate/model/record.ts`).
 *
 * @param item The item.
 * @param identifier The outcome's identifier.
 * @returns Its type, or none when the item gives no outcome by that identifier.
 */
const outcomeType = (item: Item, identifier: string): Option.Option<Expected> =>
  identifier === completionStatus && holdsCompletionStatus(item)
    ? Option.some(builtInCompletion)
    : declared(item.outcomes.get(identifier));

/**
 * Check that a decoded record is one {@link score} could have written for the item: each response
 * it holds is one the item scores, each outcome one the item declares or the built-in
 * `completionStatus` ({@link outcomeType}), and its template values, correct responses and
 * defaults fit as {@link templateMisfit} checks them, each of its declaration's base type and
 * cardinality.
 *
 * `restore` and `results` run it, so a record that does not fit is refused rather than given back
 * or written into a result. It checks what `score` checks on the record it is handed, and the
 * declared outcomes too, which `score` leaves alone because an attempt resets them; every record
 * `begin` or `score` writes fits, since template processing and the engine set only declared
 * variables and the built-in `completionStatus`, each to a value of its type. A declared variable
 * the record lacks is not refused, nor is a record that lacks `completionStatus`, as one written
 * before the item held the built-in does: the attempt starts it at `unknown`. A declared template
 * variable the record of an item whose template processing runs lacks is {@link templatesHeld}'s
 * to refuse, which `restore` runs after this and whose check `score` runs too; `results` and
 * `advance` do not, since they fit the `fresh` record of an item never presented.
 *
 * @param item The item.
 * @param record The decoded record, which belongs to the item.
 * @returns The record, or {@link InvalidRecord} at stage `decode` naming the first response, then
 *   the first outcome, then the first template value, correct response or default, that does not
 *   fit.
 */
export const fitting = (item: Item, record: ItemRecord): Result.Result<ItemRecord, InvalidRecord> =>
  unlessMisfit(
    record,
    responseMisfit(item, record).pipe(
      Option.orElse(() =>
        firstMisfit("outcome", (identifier) => outcomeType(item, identifier), record.outcomes),
      ),
      Option.orElse(() => templateMisfit(item, record)),
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
 * Give the record an attempt with no record starts from.
 *
 * An item scored alone starts from its declared response defaults (D4-11, OD-P7-5 A), so for an
 * item whose template processing does not run it is the record of the item's first attempt
 * (`firstAttempt` in `#plate/engine/attempt.ts`) under the empty instance and a drawn seed (32
 * lowercase hex digits from `drawSeed`): each response at its declared default, else NULL, and the
 * template values that record holds, none of them drawn. The seed is drawn because its response
 * processing can draw, and a guessable seed would let the page predict those draws. An item whose
 * template processing runs reads values drawn when its record starts, which no declaration gives,
 * so it has none to start from.
 *
 * @param item The item.
 * @returns The record, {@link RecordRequired} for an item whose template processing runs, or the
 *   engine's failure, every cause of which, on a checked item, the validator refuses or the item
 *   model marks.
 */
const unrecorded = (item: Item): Result.Result<ItemRecord, EngineFailure | RecordRequired> =>
  Option.isSome(item.templateProcessing)
    ? Result.fail(new RecordRequired({ document: item.document, item: item.identifier }))
    : firstAttempt(item, { instance: "", seed: drawSeed() });

/**
 * Leave out the posted value of each response only content the page does not see binds
 * (`hiddenOnlyResponses` in `#plate/payload.ts`, from the walk `redactItem` makes, which
 * `checkResponses` judges by, made without printing any text): one some interaction binds, a
 * rendered one anywhere in the body or any one inside a template block or inline the record's
 * template values hide or withhold, and no interaction the page sees binds. An interaction inside
 * hidden template content is dropped whether the renderer shows it or a notice in its place: hidden
 * wins.
 *
 * `checkResponses` gives such a response no message, so a session's stored value for it passes
 * that check, and this is the one guard that keeps a posted value from reaching response
 * processing: the attempt reads the record's value instead, which stands even when the value
 * posted is NULL. Every route into an attempt passes it: outside tests, only {@link score} calls
 * `runAttempt`, and `submit` and `advance` in `#plate/session/` score through it. A response no
 * interaction of the item binds, or one bound only to a notice on content the page sees, is
 * passed on as posted (D8-3).
 *
 * @param item The item.
 * @param record The record the attempt scores from.
 * @param responses The responses, each checked against its declaration.
 * @returns The responses, but those only content the record hides or withholds binds.
 */
const shownOnly = (
  item: Item,
  record: ItemRecord,
  responses: Readonly<Record<string, Value>>,
): Readonly<Record<string, Value>> => {
  const hidden = hiddenOnlyResponses(item, record);

  return Object.fromEntries(
    Object.entries(responses).filter(([response]) => !hidden.has(response)),
  );
};

/**
 * Score one attempt of an item: run its response processing over the responses and return the
 * record the host stores.
 *
 * In order, it:
 *
 * 1. Decodes the record the host handed back and checks that it belongs to the item and, as
 *    {@link carriedFitting} checks it, that each response it holds is one the item scores, of its
 *    declaration's base type and cardinality, that the built-in `completionStatus`, which the
 *    attempt carries over, is a single identifier, that its template values, correct responses and
 *    defaults are each of its variable's declared type, and, where the item's template processing
 *    runs, that it holds a value for each declared template variable ({@link templatesHeld}).
 * 2. Checks each response as a value of its declaration.
 * 3. Refuses responses that break a tier (a) limit, under the default configuration, judging the item
 *    as the record it scores from shows it (`checkResponses` with that record), so a choice the
 *    record's template values hide is refused `unknownChoice` and one they show is judged as any
 *    choice.
 * 4. Leaves out the posted value of a response only content the record hides or withholds binds,
 *    whether the renderer shows the interaction there or a notice in its place
 *    ({@link shownOnly}).
 * 5. Runs the attempt and writes the record.
 *
 * The record's seed, template values, correct responses and defaults come back unchanged, and the
 * rules read the template values, and the correct responses and defaults template processing set,
 * from it. It sets no attempt limit: `maxAttempts` is the author's flow.
 *
 * With no record, an item whose template processing runs fails {@link RecordRequired}: its values
 * are drawn once, by `begin`, and `score` invents none. Any other item starts from the record its
 * first attempt starts with, each response at its declared default (D4-11), so a response the
 * attempt leaves out scores as its default, under a seed `score` draws (32 lowercase hex digits),
 * which the record it returns holds: pass that record back to the next `score`.
 *
 * @example
 *   const stored = score(accepted, { RESPONSE: decoded }, record);
 *   // record is begin's, or the last score's; on Result.succeed, store the new record and pass it
 *   // back to the next score
 *
 * @param document The document `check` accepted.
 * @param responses The candidate's responses by identifier, each a value of its declaration's base
 *   type and cardinality, an integer as a `bigint`. A response left out keeps the record's value,
 *   as does one only content the record hides binds, whatever is posted for it.
 * @param record The record `begin` or the last `score` of this item returned, passed back
 *   unchanged. It may be left out for an item whose template processing does not run.
 * @returns The record after the attempt, in the form the host stores, or {@link InvalidRecord} for
 *   a record the renderer did not write (or could not write), such as one that holds a response the
 *   item does not score, a value of another base type or cardinality than its variable's
 *   declaration, a `completionStatus` that is not a single identifier, or, for an item whose
 *   template processing runs, no value for a declared template variable, {@link RecordMismatch}
 *   for another item's record, {@link RecordRequired} for no record of an item whose template
 *   processing runs, {@link InvalidResponses} for a response that does not fit its declaration,
 *   {@link ResponsesRefused} for responses that break a tier (a) limit, a choice the record hides
 *   among them, or an {@link EngineFailure} when the record lacks a response the processing reads
 *   or the processing sets an outcome to a value of another type.
 */
export const score = (
  document: Accepted,
  responses: Readonly<Record<string, Value>>,
  record?: StoredRecord,
): Result.Result<
  StoredRecord,
  | EngineFailure
  | InvalidRecord
  | InvalidResponses
  | RecordMismatch
  | RecordRequired
  | ResponsesRefused
> =>
  Result.gen(function* scoreAttempt() {
    const { item } = document;
    const before =
      record === undefined
        ? yield* unrecorded(item)
        : yield* carriedFitting(item, yield* belonging(item, yield* decodeRecord(record)));
    const checked = yield* checkedResponses(item, responses);
    const messages = checkResponses(document, checked, tierA, before);
    if (messages.length > 0) {
      return yield* Result.fail(new ResponsesRefused({ messages }));
    }

    return yield* encodeRecord(yield* runAttempt(item, before, shownOnly(item, before, checked)));
  });

/**
 * The session record: everything the renderer keeps about one item between requests, as data the
 * host stores and hands back.
 *
 * The renderer holds no session state of its own, so {@link ItemRecord} is the whole of an item's
 * session. {@link fresh} starts one and the attempt advances it.
 *
 * @module
 */
import { Option } from "effect";
import type { ContextDeclaration, Item, OutcomeDeclaration } from "#plate/model/item.ts";
import { nullOf } from "#plate/model/values.ts";
import type { RecordField, RecordValue, Value } from "#plate/model/values.ts";

/**
 * One item's session as the renderer holds it, each value of base type integer an exact `bigint`.
 *
 * `item` is the item's identifier and `document` its location. `instance` is the host's name for
 * this use of the item, which scopes its ids. `attempt` is `none` before any attempt and
 * `submitted` once `score` has processed one, and `numAttempts` counts the attempts processed. A
 * refused post is no state of the record: `score` returns no record for it, and a host that counts
 * refused posts keeps that count itself.
 * `responses` and `outcomes` hold every modelled variable by identifier, NULL included, and
 * `records` holds each record response's value beside `responses`, by the response's identifier;
 * template processing never sets one. `outcomes` holds the built-in `completionStatus` too where
 * the item holds it ({@link holdsCompletionStatus}). A record written before the built-in was held
 * lacks it, and an attempt starts it at `unknown`. `notices` names the unsupported features the
 * item shows as notices.
 *
 * `seed` is the seed the record started under: the host's string, used as given, or the one
 * `begin`, `startTest` or `score` drew when the host gave none. `templates` holds the template
 * values the item's first attempt produced, and `correct` and `defaults` the correct responses and
 * the defaults its template processing set, each by the identifier of the variable it belongs to.
 * A stored value always wins over recomputation: the template values are drawn once, when the
 * record starts, and every later use reads them from here rather than running template processing
 * again.
 *
 * From stored version 2 the record is server data. Its template values and correct responses can
 * give the answers away, so keep it where only the server reads it, never in the page.
 */
export interface ItemRecord {
  readonly attempt: "none" | "submitted";
  readonly correct: { readonly [identifier: string]: Value };
  readonly defaults: { readonly [identifier: string]: Value };
  readonly document: string;
  readonly instance: string;
  readonly item: string;
  readonly kind: "item";
  readonly notices: readonly string[];
  readonly numAttempts: number;
  readonly outcomes: { readonly [identifier: string]: Value };
  /**
   * The context the host gave when it started the item or the test the item sits in, from which
   * every processing of the item reads `QTI_CONTEXT` ({@link qtiContextRecord}). Absent when the
   * host gave none, and `QTI_CONTEXT` is then the NULL record.
   */
  readonly qtiContext?: QtiContext;
  readonly records: { readonly [identifier: string]: RecordValue };
  readonly responses: { readonly [identifier: string]: Value };
  readonly seed: string;
  readonly templates: { readonly [identifier: string]: Value };
}

/**
 * The part of an {@link ItemRecord} `redact` reads: the outcomes and the template values it shows
 * an item by. It holds no seed, so nothing redacted can redraw the values.
 */
export type RedactRecord = Pick<ItemRecord, "outcomes" | "templates">;

/**
 * The part of an {@link ItemRecord} `checkResponses` reads: the template values that decide which
 * choices an item shows. It holds no seed.
 */
export type ResponsesRecord = Pick<ItemRecord, "templates">;

/**
 * The part of an {@link ItemRecord} `solution` reads: the correct responses template processing
 * set. It holds no seed.
 */
export type SolutionRecord = Pick<ItemRecord, "correct">;

/**
 * The part of an {@link ItemRecord} a test's outcome processing reads through the test scope
 * (`#plate/engine/scope.ts`): the responses and the record responses' records, the outcomes and
 * the template values, and the correct responses and defaults template processing set. It holds
 * no seed.
 */
export type ScopeRecord = Pick<
  ItemRecord,
  "correct" | "defaults" | "outcomes" | "records" | "responses" | "templates"
>;

/**
 * Give the value an outcome holds before any processing sets it: its declared default, else 0 for
 * a single integer or float, else NULL. An item's and a test's outcomes start alike, so the record
 * and the results report read the same value.
 *
 * @param outcome The outcome's declaration.
 * @returns The outcome's starting value.
 */
export const startingValue = (outcome: OutcomeDeclaration): Value =>
  Option.getOrElse(outcome.defaultValue, (): Value => {
    if (outcome.cardinality === "single" && outcome.baseType === "integer") {
      return {
        baseType: "integer",
        cardinality: "single",
        values: [{ baseType: "integer", value: 0n }],
      };
    }

    return outcome.cardinality === "single" && outcome.baseType === "float"
      ? { baseType: "float", cardinality: "single", values: [{ baseType: "float", value: 0 }] }
      : nullOf(outcome.baseType, outcome.cardinality);
  });

/**
 * The values a host supplies for the built-in context variable `QTI_CONTEXT` when it starts a test
 * (`startTest`) or an item (`begin`): who sits it, which test, and where. Each is optional, since a
 * host may know none of them, and a field the host omits, or gives as the empty string, is NULL in
 * `QTI_CONTEXT` ({@link qtiContextRecord}).
 *
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#DataCharacteristic_ContextDeclaration
 */
export interface QtiContext {
  /**
   * The candidate's identifier, `QTI_CONTEXT.candidateIdentifier`.
   */
  readonly candidateIdentifier?: string;
  /**
   * The delivery environment's identifier, `QTI_CONTEXT.environmentIdentifier`.
   */
  readonly environmentIdentifier?: string;
  /**
   * The test's identifier as the host names it, `QTI_CONTEXT.testIdentifier`.
   */
  readonly testIdentifier?: string;
}

/**
 * The identifier of the built-in context variable, a record a delivery engine sets before any
 * template, response or outcome processing runs, and which every item and test holds.
 */
export const qtiContextName = "QTI_CONTEXT";

/**
 * The three fields of `QTI_CONTEXT`, each a single string, in the order the record writes them.
 */
const qtiContextFields = [
  "candidateIdentifier",
  "environmentIdentifier",
  "testIdentifier",
] as const;

/**
 * Give the value of `QTI_CONTEXT` for a host's context: a record with one string field for each
 * field the host gave as a non-empty string. A field the host omits is NULL, and a NULL field is no
 * field of a record, so a host that gives no context, or none of the three, makes `QTI_CONTEXT`
 * the NULL record, and a read of any of its fields gives NULL rather than failing.
 *
 * @example
 *   qtiContextRecord({ candidateIdentifier: "c1" });
 *   // a record whose one field `candidateIdentifier` is the single string "c1"
 *
 * @param context The host's context, none when the host gave none.
 * @returns The record.
 */
export const qtiContextRecord = (context: QtiContext | undefined): RecordValue => ({
  cardinality: "record",
  fields: qtiContextFields.flatMap((identifier): readonly RecordField[] => {
    const given = context?.[identifier];

    return given === undefined || given === ""
      ? []
      : [{ identifier, value: { baseType: "string", value: given } }];
  }),
});

/**
 * Give a record that keeps the host's context, or the record unchanged when the host gave none, so
 * a record begun without one encodes as it did before `qtiContext` existed.
 *
 * @param record The record.
 * @param context The host's context, none when it gave none.
 * @returns The record, holding `qtiContext` exactly when a context is given.
 */
export const withQtiContext = (record: ItemRecord, context: QtiContext | undefined): ItemRecord =>
  context === undefined ? record : { ...record, qtiContext: context };

/**
 * Give the value of each context variable an item or a test declares of a modelled type: its
 * declared default, else NULL of its base type and cardinality. No processing sets a context
 * variable and no host supplies one, so these are its values throughout a session.
 *
 * @param contexts The context declarations (`Item.contexts` or `Test.contexts`), none when the
 *   holder declares none.
 * @returns Each value, keyed by the variable's identifier.
 */
export const contextValues = (
  contexts: ReadonlyMap<string, ContextDeclaration> | undefined,
): Readonly<Record<string, Value>> =>
  Object.fromEntries(
    Array.from(contexts ?? [], ([identifier, declaration]) => [
      identifier,
      Option.getOrElse(declaration.defaultValue, () =>
        nullOf(declaration.baseType, declaration.cardinality),
      ),
    ]),
  );

/**
 * The identifier of the built-in outcome variable `completionStatus`, a single identifier the
 * delivery engine maintains and no outcome declaration may name. It "starts with the reserved
 * value 'not_attempted'", "at the start of the first attempt it changes to the reserved value
 * 'unknown'", and response processing may set it (`info.txt:8488`). `runAttempt` in
 * `#plate/engine/attempt.ts` starts the first attempt's processing with it at `unknown` and every
 * later attempt's at the value the record holds.
 *
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#IV_Outcome
 */
export const completionStatus = "completionStatus";

/**
 * The type of the built-in {@link completionStatus}: a single identifier.
 */
export const completionStatusType: Pick<OutcomeDeclaration, "baseType" | "cardinality"> = {
  baseType: "identifier",
  cardinality: "single",
};

/**
 * The two values the engine gives the built-in {@link completionStatus} itself: `not_attempted`
 * before any attempt, and `unknown` at the start of the first. Response processing may set any
 * identifier, which later attempts keep.
 */
export type CompletionStart = "not_attempted" | "unknown";

/**
 * Give the built-in {@link completionStatus} one of the values the engine starts it at.
 *
 * @param status The value.
 * @returns It as a single identifier.
 */
export const completionValue = (status: CompletionStart): Value => ({
  baseType: "identifier",
  cardinality: "single",
  values: [{ baseType: "identifier", value: status }],
});

/**
 * Report whether an item holds the built-in {@link completionStatus} among its record's outcomes.
 *
 * Every checked item holds it: `open` refuses a declaration of any kind named `completionStatus`
 * (`reserved-identifier`, pantry's `DeclarationNotReserved`). Only an item `buildItem` built from
 * an unchecked document can declare a response or an outcome of that name, which then wins over the
 * built-in as every declared variable does (`variableType` in `#plate/validate/rules.ts`), so such
 * an item does not hold it. Its model also decides which rules run by every declaration, a template
 * or context declaration and an outcome it does not model included (`heldBuiltIns` in
 * `#plate/model/item.ts`), so a rule that reads or sets `completionStatus` past such a declaration
 * never runs; the record then holds the built-in beside it, which only a result reports.
 *
 * It reads only the item's response and outcome declarations, so the evaluator's declarations
 * holder (`Declarations` in `#plate/engine/evaluate.ts`), a test's outcome declarations included,
 * may be passed for the item.
 *
 * @param item The item, or a declarations holder.
 * @returns Whether its record's outcomes hold the built-in.
 */
export const holdsCompletionStatus = (item: Pick<Item, "outcomes" | "responses">): boolean =>
  !item.responses.has(completionStatus) && !item.outcomes.has(completionStatus);

/**
 * A path at or below the root's `qti-template-processing`: the root's step, then that element's
 * step, with its `[n]` where the walk writes one, then the end or a further step.
 */
const templateProcessingPath = /^[^/]+\/qti-template-processing(?:\[\d+\])?(?:\/|$)/u;

/**
 * Report whether an item has a `qti-template-processing` the engine does not run: the item model
 * holds no template rules (`Item.templateProcessing` is none) and marks something at or below that
 * element's path. An item with no `qti-template-processing` holds no such mark.
 *
 * Its first attempt then holds no template value, since nothing computed one: `firstAttempt` in
 * `#plate/engine/attempt.ts` starts such a record, and `redactItem` in `#plate/payload.ts` reads
 * the item with no record as that record.
 *
 * @param item The item.
 * @returns Whether its template processing exists and does not run.
 */
export const unrunTemplateProcessing = (item: Item): boolean =>
  Option.isNone(item.templateProcessing) &&
  item.unsupported.some((entry) => templateProcessingPath.test(entry.path));

/**
 * Give each outcome of an item its starting value, the value a non-adaptive attempt resets it to,
 * and, where the item holds it ({@link holdsCompletionStatus}), the built-in
 * {@link completionStatus} at `not_attempted`, the value it holds before any attempt; the first
 * attempt starts it at `unknown`.
 *
 * @param item The item.
 * @returns Each outcome at {@link startingValue}, keyed by identifier, and the built-in.
 */
export const outcomeDefaults = (item: Item): ItemRecord["outcomes"] => {
  const declared: ItemRecord["outcomes"] = Object.fromEntries(
    Array.from(item.outcomes, ([identifier, outcome]) => [identifier, startingValue(outcome)]),
  );

  return holdsCompletionStatus(item)
    ? { [completionStatus]: completionValue("not_attempted"), ...declared }
    : declared;
};

/**
 * Start the session of an item that has not been attempted.
 *
 * The record's notices are the features `item.unsupported` shows as notices, so they can name less
 * than a redaction of the item does. Under a `qti-template-processing` the engine does not run
 * ({@link unrunTemplateProcessing}), no template value is computed, so a printed variable that
 * names a template variable has nothing to print and `redact` shows it as the notice
 * `qti-printed-variable`: the redacted item's notices name it, and the record's do not, since the
 * item marks no such feature.
 *
 * @param item The item.
 * @param instance The host's name for this use of the item, which scopes its ids.
 * @returns The record: every response NULL, the outcomes at {@link outcomeDefaults}, the
 *   built-in `completionStatus` `not_attempted` among them, no attempts, the features of
 *   `item.unsupported` shown as notices, the seed `""`, and no record response's value, template
 *   value, correct response or default.
 */
export const fresh = (item: Item, instance: string): ItemRecord => ({
  attempt: "none",
  correct: {},
  defaults: {},
  document: item.document,
  instance,
  item: item.identifier,
  kind: "item",
  notices: item.unsupported.flatMap((entry) => (entry.shown === "notice" ? [entry.feature] : [])),
  numAttempts: 0,
  outcomes: outcomeDefaults(item),
  records: {},
  responses: Object.fromEntries(
    Array.from(item.responses, ([identifier, response]) => [
      identifier,
      nullOf(response.baseType, response.cardinality),
    ]),
  ),
  seed: "",
  templates: {},
});

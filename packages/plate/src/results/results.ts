/**
 * Results Reporting: {@link results} writes one `assessmentResult` document for an item or a test
 * session, in the Results namespace with its camelCase names, through `writeDocument`.
 *
 * Nothing new is stored for a result. The built-in `numAttempts`, `completionStatus` and
 * `sessionStatus` are derived from whether an item was presented, its record's count of processed
 * attempts and its effective attempt limit; `answeredStatus` from its values, its declarations
 * and `checkResponses`. Every value is written in the lexical form `#plate/results/values.ts`
 * fixes, and no `correctResponse` is written. A result names its item's or test's outcomes, so a
 * page that writes one holds the candidate's scores.
 *
 * @module
 */
import type { Attribute, Child, Element } from "@qti-pie/crust/tree.ts";
import { Array as Arr, Data, Option, Result } from "effect";
import { decodeRecord, storedVersion } from "#plate/codec/record.ts";
import type { InvalidRecord, StoredRecord } from "#plate/codec/record.ts";
import { decodeSession, InvalidSession } from "#plate/codec/session.ts";
import type { SessionMismatch, StoredTestSession } from "#plate/codec/session.ts";
import type { Configuration } from "#plate/configuration.ts";
import { xmlnsNamespace } from "#plate/document/source.ts";
import { writeDocument } from "#plate/document/write.ts";
import { isXmlText } from "#plate/form/encoding.ts";
import { interactionsIn } from "#plate/model/interactions.ts";
import type { Item, OutcomeDeclaration, OutcomeReporting } from "#plate/model/item.ts";
import { startingValue } from "#plate/model/record.ts";
import type { ItemRecord } from "#plate/model/record.ts";
import { isNcName, isNull, match, nullOf } from "#plate/model/values.ts";
import type { ModelledBaseType, Value } from "#plate/model/values.ts";
import { choiceOrder } from "#plate/payload.ts";
import { checkResponses } from "#plate/responses.ts";
import { resultValue, resultValues } from "#plate/results/values.ts";
import type { ResultSingle } from "#plate/results/values.ts";
import { fitting, RecordMismatch } from "#plate/score.ts";
import { itemConfiguration, sessionControl } from "#plate/session/control.ts";
import type { SessionItem, TestSession } from "#plate/session/session.ts";
import type { Accepted, AcceptedTest } from "#plate/validate/verdict.ts";
import type { AnsweredStatus, SessionStatus, TestMark } from "#plate/vocabulary.ts";

/**
 * The namespace of every element a result holds.
 */
const resultNamespace = "http://www.imsglobal.org/xsd/imsqti_result_v3p0";

/**
 * Who the result is about and which sessions it reports: the host's `sourcedId` for the
 * candidate, and one session identifier per entry of `sessions`, each the URI of the system that
 * issued it (`sourceId`) and the identifier it issued.
 *
 * The Results XSD types `sourcedId` and each `identifier` as an NCName, so a bare UUID, which
 * starts with a digit more often than not, does not fit; `s-` followed by a UUID does.
 *
 * Each `sourceId` must be an absolute URI, one `URL.canParse` reads without a base. That is
 * stricter than the XSD, whose `xs:anyURI` admits a relative reference
 * (`imsqti_resultv3p0_v1p0.xsd:603`): Results Reporting describes `sourceID` as a unique
 * identifier of the system that added the session identifier (`rr-bind.txt:3548`), and a relative
 * reference does not name a system on its own. It must also hold only characters XML can carry,
 * which `URL.canParse` does not check: it reads past a leading control character, and an
 * attribute that holds one is not well-formed.
 */
export interface ResultContext {
  readonly sessions?: readonly { readonly identifier: string; readonly sourceId: string }[];
  readonly sourcedId?: string;
}

/**
 * What {@link results} reports: an item delivered alone, with the record its last `score`
 * returned and when that happened, or a test session with the test and the items it was started
 * with, keyed by item ref identifier as `startTest` took them.
 */
export type ResultsInput =
  | {
      readonly context: ResultContext;
      readonly datestamp: Date;
      readonly document: Accepted;
      readonly kind: "item";
      readonly record: StoredRecord;
    }
  | {
      readonly context: ResultContext;
      readonly items: ReadonlyMap<string, Accepted>;
      readonly kind: "test";
      readonly session: StoredTestSession;
      readonly test: AcceptedTest;
    };

/**
 * The input a result context check names: the context's `sourcedId`, a session entry's
 * `identifier` or `sourceId`, or an item result's `datestamp`.
 */
export type ContextField = "datestamp" | "identifier" | "sourceId" | "sourcedId";

/**
 * What each {@link ContextField} must be, and what to pass instead.
 */
const contextRemedies: Readonly<Record<ContextField, string>> = {
  datestamp: "is not a valid date. Pass the Date of the item session's last change",
  identifier:
    'is not an NCName, which the Results XSD requires. Pass an identifier that starts with a letter or "_" and holds only letters, digits, "-", "_" and ".", such as "s-" followed by a UUID',
  sourceId:
    'is not an absolute URI made of characters XML can carry. Pass the URI of the system that issued the session identifier, such as "http://localhost:5190/", with no control character, U+FFFE, U+FFFF or lone surrogate',
  sourcedId:
    'is not an NCName, which the Results XSD requires. Pass an identifier that starts with a letter or "_" and holds only letters, digits, "-", "_" and ".", or leave sourcedId out',
};

/**
 * A result input the Results XSD cannot hold: a `sourcedId` or a session `identifier` that is not
 * an NCName, a session `sourceId` that is not an absolute URI made of characters XML can carry, or
 * an item result's `datestamp` that is not a valid date.
 *
 * `session` is the index of the session entry at fault, none for `sourcedId` and `datestamp`;
 * `value` is what was passed.
 */
export class InvalidResultContext extends Data.TaggedError("InvalidResultContext")<{
  readonly field: ContextField;
  readonly session: Option.Option<number>;
  readonly value: string;
}> {
  /**
   * The input, its value, and what to pass instead.
   */
  override get message(): string {
    const where = Option.match(this.session, {
      onNone: () => `The result's ${this.field}`,
      onSome: (index) => `The result context's session ${String(index)} ${this.field}`,
    });

    return `${where} ${JSON.stringify(this.value)} ${contextRemedies[this.field]}.`;
  }
}

/**
 * A test result whose items lack the item a session item's ref names, so it cannot be reported.
 *
 * `ref` is the item ref's identifier and `document` the document its record names.
 */
export class ResultItemMissing extends Data.TaggedError("ResultItemMissing")<{
  readonly document: string;
  readonly ref: string;
}> {
  /**
   * The item ref, the document, and what to pass instead.
   */
  override get message(): string {
    return `The items passed have no entry for the session's item ref ${JSON.stringify(this.ref)}, whose record names ${JSON.stringify(this.document)}. Pass, under the key ${JSON.stringify(this.ref)}, the item open accepted from that document, as startTest took it.`;
  }
}

/**
 * The configuration an answered status is judged under: every limit of both tiers applies, so a
 * response an item's interaction refuses on any count reads as responded and invalid. Only its
 * session-control fields reach {@link itemConfiguration}, which replaces all seven, so it also
 * gives an item's effective attempt limit. A plain literal, so no Schema decode runs.
 */
const judging: Configuration = {
  allowComment: false,
  allowReview: true,
  allowSkipping: true,
  assetBase: "",
  headingLevel: 2,
  locale: "en",
  maxAttempts: 1,
  showFeedback: false,
  showSolution: false,
  validateResponses: true,
};

/**
 * The test mark of outcome processing, which M2 does not run, so a test that has it reports no
 * outcome of its own.
 */
const outcomeProcessing: TestMark = "qti-outcome-processing";

/**
 * What a result says about one item: where it sits, how its session stands, and the values to
 * report.
 */
interface ItemReport {
  /**
   * The values reported for its responses, by identifier.
   */
  readonly answers: ItemRecord["responses"];
  readonly datestamp: string;
  /**
   * Its built-in `duration` in seconds, none when it is not known.
   */
  readonly duration: Option.Option<number>;
  readonly identifier: string;
  readonly item: Accepted;
  /**
   * The values reported for its outcomes, by identifier.
   */
  readonly outcomes: ItemRecord["outcomes"];
  readonly presented: boolean;
  /**
   * The order each shuffled Choice was presented in, by response identifier.
   */
  readonly sequences: ReadonlyMap<string, string>;
  readonly sequenceIndex: Option.Option<number>;
  readonly session: Attempts;
}

/**
 * An item session's built-in attempt count and status.
 */
interface Attempts {
  /**
   * The attempts started: the built-in `numAttempts`.
   */
  readonly started: number;
  readonly status: SessionStatus;
}

/**
 * Construct an attribute in no namespace.
 *
 * @param local Its name.
 * @param value Its value.
 * @returns The attribute.
 */
const attribute = (local: string, value: string): Attribute => ({
  local,
  namespace: "",
  prefix: "",
  qname: local,
  references: [],
  value,
});

/**
 * Construct an unprefixed element in the Results namespace.
 *
 * @param local Its local name.
 * @param attributes Its attributes, in order.
 * @param children Its children, in order.
 * @returns The element.
 */
const element = (
  local: string,
  attributes: readonly Attribute[],
  children: readonly Child[] = [],
): Element => ({
  attributes,
  children,
  kind: "element",
  local,
  namespace: resultNamespace,
  prefix: "",
  qname: local,
});

/**
 * Construct one `value` element.
 *
 * @param lexical The value's lexical form.
 * @returns The element.
 */
const valueElement = (lexical: string): Element =>
  element("value", [], [{ cdata: false, kind: "text", value: lexical }]);

/**
 * Give an optional attribute, none when it has no value.
 *
 * @param local Its name.
 * @param value Its value, if any.
 * @returns The attribute in a list, or an empty list.
 */
const optional = (local: string, value: Option.Option<string>): readonly Attribute[] =>
  Option.match(value, { onNone: () => [], onSome: (text) => [attribute(local, text)] });

/**
 * The attributes that name a variable and its type.
 *
 * @param identifier The variable's identifier.
 * @param cardinality Its cardinality.
 * @param baseType Its base type.
 * @returns The `identifier`, `cardinality` and `baseType` attributes.
 */
const declared = (
  identifier: string,
  cardinality: Value["cardinality"],
  baseType: ModelledBaseType | "duration",
): readonly Attribute[] => [
  attribute("identifier", identifier),
  attribute("cardinality", cardinality),
  attribute("baseType", baseType),
];

/**
 * Write a built-in single response variable.
 *
 * @param identifier The built-in's identifier.
 * @param single Its value.
 * @returns The `responseVariable`.
 */
const builtInResponse = (identifier: string, single: ResultSingle): Element =>
  element("responseVariable", declared(identifier, "single", single.baseType), [
    element("candidateResponse", [], [valueElement(resultValue(single))]),
  ]);

/**
 * Give an own entry of a record of values.
 *
 * @param values The values, by identifier.
 * @param identifier The identifier.
 * @returns Its value, none when `values` has no own entry for it.
 */
const own = (values: Readonly<Record<string, Value>>, identifier: string): Option.Option<Value> =>
  Object.hasOwn(values, identifier) ? Option.fromUndefinedOr(values[identifier]) : Option.none();

/**
 * Write a double in the form a float value takes.
 *
 * @param value The double.
 * @returns Its lexical form.
 */
const doubleText = (value: number): string => resultValue({ baseType: "float", value });

/**
 * The reporting attributes an outcome declaration carries, as its `outcomeVariable` writes them:
 * `view` its views joined by spaces, `interpretation` and `longInterpretation` as the model holds
 * them, and the three doubles in the form a float value takes. One the declaration lacks is not
 * written.
 *
 * @param outcome The outcome's declaration.
 * @returns The attributes, in the Results XSD's order.
 */
const reportingAttributes = (outcome: OutcomeReporting): readonly Attribute[] => [
  ...optional("view", outcome.view.pipe(Option.map((views) => views.join(" ")))),
  ...optional("interpretation", outcome.interpretation),
  ...optional("longInterpretation", outcome.longInterpretation),
  ...optional("normalMaximum", outcome.normalMaximum.pipe(Option.map(doubleText))),
  ...optional("normalMinimum", outcome.normalMinimum.pipe(Option.map(doubleText))),
  ...optional("masteryValue", outcome.masteryValue.pipe(Option.map(doubleText))),
];

/**
 * Write the outcome variables of some declarations.
 *
 * Each is written with its declaration's identifier, cardinality and base type, then each of the
 * six reporting attributes the declaration carries.
 *
 * @param declarations The outcome declarations, in document order.
 * @param values The values to report, by identifier; an outcome they lack is at its starting
 *   value.
 * @returns One `outcomeVariable` per declaration, in order.
 */
const outcomeVariables = (
  declarations: ReadonlyMap<string, OutcomeDeclaration>,
  values: ItemRecord["outcomes"],
): readonly Element[] =>
  Array.from(declarations.values(), (outcome) =>
    element(
      "outcomeVariable",
      [
        ...declared(outcome.identifier, outcome.cardinality, outcome.baseType),
        ...reportingAttributes(outcome),
      ],
      resultValues(
        Option.getOrElse(own(values, outcome.identifier), () => startingValue(outcome)),
      ).map(valueElement),
    ),
  );

/**
 * Derive an item session's built-in attempt count and status, with nothing stored for either.
 *
 * An attempt starts at the item's first presentation, and again at once after each submission
 * that leaves the item open. So a presented item has started one more attempt than it has
 * processed, unless its last submission reached its effective limit and closed it. Results
 * Reporting 2.7.7: `initial` exactly when none has started, `final` when the item closed at a
 * submission, and `pendingSubmission` while a started attempt is unprocessed.
 *
 * @param presented Whether the candidate was shown the item.
 * @param processed The record's count of processed attempts.
 * @param limit The effective attempt limit, 0 for none.
 * @returns The attempts started and the session status.
 */
const attemptsOf = (presented: boolean, processed: number, limit: number): Attempts => {
  if (!presented) {
    return { started: 0, status: "initial" };
  }

  return limit > 0 && processed >= limit
    ? { started: processed, status: "final" }
    : { started: processed + 1, status: "pendingSubmission" };
};

/**
 * Give a response's answered status by Results Reporting 2.7.1's criteria.
 *
 * @param declaredDefault The response's declared default, if any.
 * @param value The value reported.
 * @param presented Whether the candidate was shown the item.
 * @param invalid Whether the item's interaction refuses the value, on any limit of either tier.
 * @returns `notpresented` for an item never shown; `presented` for NULL or the declared default,
 *   which is skipping it; `attempted` for a value the interaction refuses; else `answered`.
 */
const answeredStatusOf = (
  declaredDefault: Option.Option<Value>,
  value: Value,
  presented: boolean,
  invalid: boolean,
): AnsweredStatus => {
  if (!presented) {
    return "notpresented";
  }

  if (isNull(value) || Option.exists(declaredDefault, (fallback) => match(value, fallback))) {
    return "presented";
  }

  return invalid ? "attempted" : "answered";
};

/**
 * Write an item result.
 *
 * The built-ins come first: `numAttempts`, `duration` when it is known and `completionStatus`,
 * `not_attempted` until an attempt starts and `unknown` after, since no M2 item's processing may
 * set it. Then one response variable per declared response with its answered status, and one
 * outcome variable per declared outcome.
 *
 * @param report What the result says about the item.
 * @returns The `itemResult`.
 */
const itemResult = (report: ItemReport): Element => {
  const { item } = report.item;
  const invalid = new Set(
    checkResponses(report.item, report.answers, judging).map((message) => message.response),
  );
  const responses = Array.from(item.responses.values(), (declaration) => {
    const value = Option.getOrElse(own(report.answers, declaration.identifier), () =>
      nullOf(declaration.baseType, declaration.cardinality),
    );
    const answered = answeredStatusOf(
      declaration.defaultValue,
      value,
      report.presented,
      invalid.has(declaration.identifier),
    );

    return element(
      "responseVariable",
      [
        ...declared(declaration.identifier, declaration.cardinality, declaration.baseType),
        ...optional(
          "choiceSequence",
          Option.fromUndefinedOr(report.sequences.get(declaration.identifier)),
        ),
        attribute("answeredStatus", answered),
      ],
      [element("candidateResponse", [], resultValues(value).map(valueElement))],
    );
  });
  const completion = report.session.started === 0 ? "not_attempted" : "unknown";

  return element(
    "itemResult",
    [
      attribute("identifier", report.identifier),
      ...optional("sequenceIndex", report.sequenceIndex.pipe(Option.map(String))),
      attribute("datestamp", report.datestamp),
      attribute("sessionStatus", report.session.status),
    ],
    [
      builtInResponse("numAttempts", {
        baseType: "integer",
        value: BigInt(report.session.started),
      }),
      ...Option.match(report.duration, {
        onNone: () => [],
        onSome: (seconds) => [builtInResponse("duration", { baseType: "float", value: seconds })],
      }),
      element("outcomeVariable", declared("completionStatus", "single", "identifier"), [
        valueElement(completion),
      ]),
      ...responses,
      ...outcomeVariables(item.outcomes, report.outcomes),
    ],
  );
};

/**
 * Check the result context and write its element.
 *
 * @param context The host's context.
 * @returns The `context` element, or {@link InvalidResultContext} for the first input that does not
 *   fit.
 */
const contextElement = (context: ResultContext): Result.Result<Element, InvalidResultContext> =>
  Result.gen(function* checkContext() {
    const sourcedId = Option.fromUndefinedOr(context.sourcedId);
    if (Option.isSome(sourcedId) && !isNcName(sourcedId.value)) {
      return yield* Result.fail(
        new InvalidResultContext({
          field: "sourcedId",
          session: Option.none(),
          value: sourcedId.value,
        }),
      );
    }

    const sessions = context.sessions ?? [];
    for (const [index, entry] of sessions.entries()) {
      if (!isNcName(entry.identifier)) {
        return yield* Result.fail(
          new InvalidResultContext({
            field: "identifier",
            session: Option.some(index),
            value: entry.identifier,
          }),
        );
      }

      if (!URL.canParse(entry.sourceId) || !isXmlText(entry.sourceId)) {
        return yield* Result.fail(
          new InvalidResultContext({
            field: "sourceId",
            session: Option.some(index),
            value: entry.sourceId,
          }),
        );
      }
    }

    return element(
      "context",
      optional("sourcedId", sourcedId),
      sessions.map((entry) =>
        element("sessionIdentifier", [
          attribute("sourceID", entry.sourceId),
          attribute("identifier", entry.identifier),
        ]),
      ),
    );
  });

/**
 * Write the whole document.
 *
 * @param children The context, then the test result if any, then the item results.
 * @returns The document's text.
 */
const documentOf = (children: readonly Element[]): string =>
  writeDocument(
    element(
      "assessmentResult",
      [
        {
          local: "xmlns",
          namespace: xmlnsNamespace,
          prefix: "",
          qname: "xmlns",
          references: [],
          value: resultNamespace,
        },
      ],
      children,
    ),
  );

/**
 * Check that a record belongs to the item it is reported for, as `score` does.
 *
 * @param document The item.
 * @param record The record.
 * @returns The record, or {@link RecordMismatch} when it names another item or document.
 */
const belonging = (
  document: Accepted,
  record: ItemRecord,
): Result.Result<ItemRecord, RecordMismatch> =>
  record.item === document.item.identifier && record.document === document.item.document
    ? Result.succeed(record)
    : Result.fail(
        new RecordMismatch({
          document: document.item.document,
          item: document.item.identifier,
          recordDocument: record.document,
          recordItem: record.item,
        }),
      );

/**
 * Write the result of an item delivered alone.
 *
 * The host holds the item's presentation and its attempt limit, so the result reads the record
 * alone: each processed attempt is one started and finished, a record with none is an item not
 * yet presented, its outcomes are the record's, and its duration is not known. No
 * `choiceSequence` is written, since the record's instance need not be the one the item was
 * rendered with.
 *
 * @param input The item, its record, when it last changed and the context.
 * @returns The document's text, or the failure of its context, its datestamp or its record: a
 *   record of another item, or one that does not fit the item's declarations (`fitting`).
 */
const itemResults = (
  input: Extract<ResultsInput, { readonly kind: "item" }>,
): Result.Result<string, InvalidRecord | InvalidResultContext | RecordMismatch> =>
  Result.gen(function* writeItem() {
    const context = yield* contextElement(input.context);
    if (Number.isNaN(input.datestamp.getTime())) {
      return yield* Result.fail(
        new InvalidResultContext({
          field: "datestamp",
          session: Option.none(),
          value: String(input.datestamp),
        }),
      );
    }

    const record = yield* fitting(
      input.document.item,
      yield* belonging(input.document, yield* decodeRecord(input.record)),
    );
    const presented = record.numAttempts > 0;

    return documentOf([
      context,
      itemResult({
        answers: record.responses,
        datestamp: input.datestamp.toISOString(),
        duration: Option.none(),
        identifier: input.document.item.identifier,
        item: input.document,
        outcomes: record.outcomes,
        presented,
        sequenceIndex: Option.none(),
        sequences: new Map(),
        session: attemptsOf(presented, record.numAttempts, 1),
      }),
    ]);
  });

/**
 * The form of a time a session stores, as `Date.prototype.toISOString` writes it, and the
 * offsets `xs:dateTime` also admits.
 */
const isoTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/u;

/**
 * Check that a session's times are times, since a result writes them as `xs:dateTime` and
 * measures the test's duration between two of them.
 *
 * @param session The decoded session.
 * @returns The session, or {@link InvalidSession} naming the first field that is not an ISO 8601
 *   time.
 */
const timed = (session: TestSession): Result.Result<TestSession, InvalidSession> => {
  const fields: readonly (readonly [string, string])[] = [
    ["started", session.started],
    ["updated", session.updated],
    ...session.items.map(
      (item, index) => [`items[${String(index)}].datestamp`, item.datestamp] as const,
    ),
  ];
  const wrong = Arr.findFirst(
    fields,
    ([, text]) => !isoTime.test(text) || Number.isNaN(Date.parse(text)),
  );

  return Option.match(wrong, {
    onNone: () => Result.succeed(session),
    onSome: ([field, text]) =>
      Result.fail(
        new InvalidSession({
          issue: `its ${field} is ${JSON.stringify(text)}, not an ISO 8601 time such as "2026-11-05T10:00:00.000Z"`,
          stage: "decode",
          version: Option.some(storedVersion),
        }),
      ),
  });
};

/**
 * Give the time between two ISO 8601 times in seconds, truncated to a tenth of a second, and 0
 * when the second is not later.
 *
 * @param from The earlier time.
 * @param to The later time.
 * @returns The seconds between them.
 */
const secondsBetween = (from: string, to: string): number =>
  Math.max(Math.trunc((Date.parse(to) - Date.parse(from)) / 100) / 10, 0);

/**
 * Give the order each shuffled Choice of an item was presented in, as `render` presents it.
 *
 * @param item The item.
 * @param seed The session's seed.
 * @param instance The item instance it was rendered under.
 * @returns The choice identifiers, space-separated, by the Choice's response identifier.
 */
const choiceSequences = (
  item: Item,
  seed: Option.Option<number>,
  instance: string,
): ReadonlyMap<string, string> =>
  new Map(
    interactionsIn(item.body).flatMap((interaction) =>
      interaction.kind === "choice" && interaction.shuffle
        ? [[interaction.response, choiceOrder(interaction, seed, instance).join(" ")] as const]
        : [],
    ),
  );

/**
 * Find the item a session item delivers, and check that its record is that item's and fits it.
 *
 * @param items The items the session was started with, by item ref identifier.
 * @param entry The session item.
 * @returns The item; {@link ResultItemMissing} when `items` has none for its ref;
 *   {@link RecordMismatch} when its record names another item or document; or
 *   {@link InvalidSession} when its record does not fit the item's declarations (`fitting`).
 */
const deliveredItem = (
  items: ReadonlyMap<string, Accepted>,
  entry: SessionItem,
): Result.Result<Accepted, InvalidSession | RecordMismatch | ResultItemMissing> =>
  Result.gen(function* deliverItem() {
    const document = yield* Result.fromOption(
      Option.fromUndefinedOr(items.get(entry.ref)),
      () => new ResultItemMissing({ document: entry.record.document, ref: entry.ref }),
    );
    yield* belonging(document, entry.record);
    yield* Result.mapError(
      fitting(document.item, entry.record),
      ({ issue }) =>
        new InvalidSession({
          issue: `the record of its item ${String(entry.sequenceIndex)}, of the item ref ${JSON.stringify(entry.ref)}, does not fit the item: ${issue}`,
          stage: "decode",
          version: Option.some(storedVersion),
        }),
    );

    return document;
  });

/**
 * Report one item of a test session.
 *
 * The values reported are the responses saved and not yet processed, else the record's. Its
 * outcomes are the first processed attempt's when its effective limit is 0, since a delivery
 * engine that does not limit attempts reports only the first outcomes of a non-adaptive item, and
 * the record's otherwise: the last processed, or the starting values before any. A presented
 * shuffled Choice carries the order it was presented in, under the session's seed and the item's
 * instance `<session instance>.<sequenceIndex>`.
 *
 * @param test The test.
 * @param items The items the session was started with.
 * @param session The session.
 * @param entry The session item.
 * @returns The report, or the failure of its ref in the test, then of its item.
 */
const sessionItemReport = (
  test: AcceptedTest,
  items: ReadonlyMap<string, Accepted>,
  session: TestSession,
  entry: SessionItem,
): Result.Result<ItemReport, InvalidSession | RecordMismatch | ResultItemMissing> =>
  Result.gen(function* reportItem() {
    const control = yield* Result.mapError(
      sessionControl(test.test, entry.ref),
      () =>
        new InvalidSession({
          issue: `its item ${String(entry.sequenceIndex)} names the item ref ${JSON.stringify(entry.ref)}, which the test ${JSON.stringify(test.test.identifier)} does not hold`,
          stage: "decode",
          version: Option.some(storedVersion),
        }),
    );
    const document = yield* deliveredItem(items, entry);
    const limit = itemConfiguration(judging, control).maxAttempts;
    const saved = Option.getOrElse(entry.saved, () => ({}));
    const answers = Object.fromEntries(
      [...document.item.responses.keys()].flatMap((identifier) =>
        Option.toArray(
          Option.map(
            Option.orElse(own(saved, identifier), () => own(entry.record.responses, identifier)),
            (value) => [identifier, value] as const,
          ),
        ),
      ),
    );

    return {
      answers,
      datestamp: entry.datestamp,
      duration: Option.some(entry.duration),
      identifier: entry.ref,
      item: document,
      outcomes:
        limit === 0
          ? Option.getOrElse(entry.firstOutcomes, () => entry.record.outcomes)
          : entry.record.outcomes,
      presented: entry.presented,
      sequenceIndex: Option.some(entry.sequenceIndex),
      sequences: entry.presented
        ? choiceSequences(
            document.item,
            session.seed,
            `${session.instance}.${String(entry.sequenceIndex)}`,
          )
        : new Map(),
      session: attemptsOf(entry.presented, entry.record.numAttempts, limit),
    };
  });

/**
 * Write the result of a test session.
 *
 * The test result holds the built-in `duration`, from the session's start to its last change in
 * seconds, of base type duration (reading 29). The test's own outcomes are written at their
 * starting values only when it has no outcome processing, which M2 does not run, so no default
 * reads as a score. Then one item result per session item, in sequence order.
 *
 * @param input The test, its items, the stored session and the context.
 * @returns The document's text, or the failure of its context, its session or an item.
 */
const testResults = (
  input: Extract<ResultsInput, { readonly kind: "test" }>,
): Result.Result<
  string,
  InvalidResultContext | InvalidSession | RecordMismatch | ResultItemMissing | SessionMismatch
> =>
  Result.gen(function* writeTest() {
    const context = yield* contextElement(input.context);
    const session = yield* timed(yield* decodeSession(input.session, input.test));
    const reports: Element[] = [];
    for (const entry of session.items) {
      reports.push(itemResult(yield* sessionItemReport(input.test, input.items, session, entry)));
    }

    const { test } = input.test;
    const outcomes = input.test.unsupported.some((mark) => mark.feature === outcomeProcessing)
      ? []
      : outcomeVariables(test.outcomes, {});

    return documentOf([
      context,
      element(
        "testResult",
        [attribute("identifier", test.identifier), attribute("datestamp", session.updated)],
        [
          builtInResponse("duration", {
            baseType: "duration",
            value: secondsBetween(session.started, session.updated),
          }),
          ...outcomes,
        ],
      ),
      ...reports,
    ]);
  });

/**
 * Write the Results Reporting document for an item or a test session.
 *
 * A test result holds a `testResult` and one `itemResult` per session item, in sequence order; an
 * item result holds the item's `itemResult`. Each item result reports the built-ins
 * `numAttempts`, `duration` (in a test) and `completionStatus`, the session status, every
 * declared response with its answered status and every declared outcome, never a correct
 * response. In a test, a presented shuffled Choice's response carries the order it was presented
 * in as `choiceSequence`.
 *
 * @example
 *   results({ context: { sourcedId: "candidate-1" }, datestamp: new Date(), document, kind: "item", record });
 *   // Result.succeed('<?xml version="1.0" encoding="utf-8"?>\n<assessmentResult …>…</assessmentResult>')
 *
 * @param input The item or the test session to report, and the context.
 * @returns The document's text; {@link InvalidResultContext} for a context or datestamp the
 *   Results XSD cannot hold; {@link InvalidRecord}, {@link InvalidSession} or
 *   {@link SessionMismatch} for a stored record or session this renderer did not write, or one of
 *   another test, a record that does not fit its item's declarations included;
 *   {@link RecordMismatch} for a record of another item than the one it is reported for; or
 *   {@link ResultItemMissing} when the items lack a session item's item.
 */
export const results = (
  input: ResultsInput,
): Result.Result<
  string,
  | InvalidRecord
  | InvalidResultContext
  | InvalidSession
  | RecordMismatch
  | ResultItemMissing
  | SessionMismatch
> => (input.kind === "item" ? itemResults(input) : testResults(input));

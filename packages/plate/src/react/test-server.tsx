/**
 * The server side of the React test layer: {@link createTestServer}, a Fetch handler that answers
 * the wire `TestProvider`'s transport speaks, over plate's session functions. It keeps the accepted
 * test and items, and every session lives in the host's store, so the page receives only what
 * `redact` writes, in the view codec's JSON form.
 *
 * It holds no JSX and imports no React, so a server that mounts it loads only plate's session
 * functions; the contract's types it reads are type imports.
 *
 * @module
 */
import { Effect, Option, Result, Schema } from "effect";
import { encodeRedacted } from "#plate/codec/redacted.ts";
import { decodeSession, encodeSession, SavedResponsesSchema } from "#plate/codec/session.ts";
import { encodeItemView } from "#plate/codec/view.ts";
import type { ItemViewPayloadJson } from "#plate/codec/view.ts";
import type { StatusInput } from "#plate/emit/item.ts";
import { decode, Malformed, partition, postedStrings } from "#plate/form/encoding.ts";
import type { Entry } from "#plate/form/encoding.ts";
import { decodeIntent, intentName } from "#plate/form/intent.ts";
import { message } from "#plate/messages.ts";
import type { ResponseValue } from "#plate/model/values.ts";
import { navigationState } from "#plate/navigation.ts";
import { postings } from "#plate/payload.ts";
import type { ValidationMessage } from "#plate/payload.ts";
import type {
  CreateTestServer,
  ItemViewPayload,
  Posted,
  TestServerOptions,
} from "#plate/react/contract.tsx";
import { redact } from "#plate/render.ts";
import { checkResponses } from "#plate/responses.ts";
import { advance } from "#plate/session/advance.ts";
import type { AdvanceFailure, IntentRefused } from "#plate/session/advance.ts";
import { UnknownItemRef } from "#plate/session/control.ts";
import type { Intent, Responses, TestSession } from "#plate/session/session.ts";
import { current, startTest } from "#plate/session/start.ts";
import type { ItemView } from "#plate/session/start.ts";
import type { Accepted } from "#plate/validate/verdict.ts";

/**
 * The segment a refusal of the intent names as its message's response, as the status region scopes
 * a message's id by it: no response of an item is named `intent`, since the intent's own entry,
 * `intentName(instance)`, is the session's and not the item's.
 */
const intentSegment = "intent";

/**
 * The status code of a post the server refused: the item it was posted from, with the refusal.
 */
const refusedStatus = 422;

/**
 * What one post carries for the current item: each response its postings decode, the strings
 * posted for each, and the responses whose entries do not decode.
 */
interface Post {
  readonly decoded: Readonly<Record<string, Malformed | ResponseValue>>;
  readonly malformed: ReadonlySet<string>;
  readonly posted: Readonly<Record<string, readonly string[]>>;
}

/**
 * What a refused post answers with besides the item: the messages for its status region, and the
 * strings it posted, which the item's controls show instead of its values.
 */
interface Refusal {
  readonly messages: readonly ValidationMessage[];
  readonly posted: Option.Option<Post["posted"]>;
}

/**
 * What the wire carries in a body: an open session's view, bare, as a `GET` answers it, or a
 * {@link Posted} with its view in the JSON form.
 */
type WireBody =
  | ItemViewPayloadJson
  | { readonly kind: "finished" }
  | { readonly kind: "view"; readonly view: ItemViewPayloadJson };

/**
 * Answer JSON with a status.
 *
 * @param status The status code.
 * @param body The body.
 * @returns The response.
 */
const json = (status: number, body: WireBody): Response => Response.json(body, { status });

/**
 * The answer to a request whose method the wire does not take.
 *
 * @returns A `405` naming the two methods it takes.
 */
const methodNotAllowed = (): Response =>
  new Response(null, { headers: { allow: "GET, POST" }, status: 405 });

/**
 * Give the accepted item of the current item's ref.
 *
 * @param options The server's options.
 * @param view The current item.
 * @returns The item, or {@link UnknownItemRef} when the items the host passed lack it.
 */
const itemOf = (
  options: TestServerOptions,
  view: ItemView,
): Result.Result<Accepted, UnknownItemRef> =>
  Result.fromNullishOr(
    options.items.get(view.ref),
    () => new UnknownItemRef({ ref: view.ref, test: options.test.test.document }),
  );

/**
 * Read a post's body as form entries: an empty list for a body that is not a form, which then
 * carries no intent and is refused as such.
 *
 * @param request The post.
 * @returns The entries in posted order.
 */
const entriesOf = (request: Request) =>
  Effect.map(
    Effect.result(
      // oxlint-disable-next-line typescript/no-deprecated -- The deprecation warns against parsing an untrusted server's multipart response; this is a page's post of its own form, which the host's server reads under its own body limits.
      Effect.tryPromise(() => request.formData()),
    ),
    (form): readonly Entry[] =>
      Result.isFailure(form)
        ? []
        : Array.from(form.success, ([name, value]): Entry => [name, value]),
  );

/**
 * Read what a post carries for the current item: its own entries, partitioned by the item's
 * instance, each response decoded through the postings of the item as `redact` gives it with the
 * record it was rendered from, with the strings posted for it.
 *
 * @param document The accepted item.
 * @param view The current item.
 * @param entries The posted entries.
 * @returns The post.
 */
const postOf = (document: Accepted, view: ItemView, entries: readonly Entry[]): Post => {
  const { own } = partition(entries, view.instance);
  const itemPostings = postings(redact(document, view.record, view.configuration), view.instance);
  const decoded = Object.fromEntries(
    itemPostings.map(({ binding, identifier, options }) => [
      identifier,
      Result.merge(decode(own, binding, options)),
    ]),
  );

  return {
    decoded,
    malformed: new Set(
      Object.entries(decoded).flatMap(([response, value]) =>
        value instanceof Malformed ? [response] : [],
      ),
    ),
    posted: Object.fromEntries(
      itemPostings.map(({ binding, identifier }) => [identifier, postedStrings(own, binding)]),
    ),
  };
};

/**
 * Give the values a post carries that decode.
 *
 * @param post The post.
 * @returns Each decoded value, by response.
 */
const valuesOf = (post: Post): Responses =>
  Object.fromEntries(
    Object.entries(post.decoded).flatMap(([response, value]) =>
      value instanceof Malformed ? [] : [[response, value] as const],
    ),
  );

/**
 * Say whether an intent ends the current part.
 *
 * @param intent The intent.
 * @returns Whether it is `submit-part` or `end-part`.
 */
const isPartIntent = (intent: Intent): boolean =>
  intent.kind === "end-part" || intent.kind === "submit-part";

/**
 * Give the words that say why an intent was refused, for a refusal that concerns no single
 * response: the locale's words for `end-of-part` and `skipping-not-allowed`, the two rules a page's
 * own navigation reaches, and the refusal's own message for the rest.
 *
 * @param view The current item, whose configuration gives the locale.
 * @param refusal The refusal.
 * @returns The message.
 */
const refusalText = (view: ItemView, refusal: IntentRefused): string => {
  if (refusal.rule === "end-of-part") {
    return message(view.configuration.locale, "endOfPart");
  }

  return refusal.rule === "skipping-not-allowed"
    ? message(view.configuration.locale, "skippingNotAllowed")
    : refusal.message;
};

/**
 * Give the refusal a failed `advance` answers with, or none for a failure the candidate did not
 * cause, which the handler fails with instead.
 *
 * `ResponsesRefused`, and `IntentRefused` with `responses-invalid` for the current item, refuse the
 * responses with their own messages; any other `IntentRefused` refuses the intent, with one message
 * under {@link intentSegment}.
 *
 * @param view The current item.
 * @param posted The strings the post sent for the item; none for a closed item, which posts none.
 * @param failure What `advance` failed with.
 * @returns The refusal, or none.
 */
const refusalOf = (
  view: ItemView,
  posted: Option.Option<Post["posted"]>,
  failure: AdvanceFailure,
): Option.Option<Refusal> => {
  if (failure._tag === "ResponsesRefused") {
    return Option.some({ messages: failure.messages, posted });
  }

  if (failure._tag !== "IntentRefused") {
    return Option.none();
  }

  const forThisItem = Option.match(failure.sequenceIndex, {
    onNone: () => true,
    onSome: (index) => index === view.sequenceIndex,
  });

  return Option.some(
    failure.rule === "responses-invalid" && forThisItem
      ? { messages: failure.messages, posted }
      : {
          messages: [{ response: intentSegment, text: refusalText(view, failure) }],
          posted,
        },
  );
};

/**
 * Make the payload a page renders the current item from: the redacted item in its JSON form, the
 * values in theirs, the navigation, the instance, the configuration, the disabled state, and the
 * time left in milliseconds when a `max-time` is in force; never the record or the accepted item.
 *
 * @param options The server's options.
 * @param session The session.
 * @param view The current item.
 * @param shown The status region's state and the strings a refused post sent, when there are any.
 * @param shown.posted The strings a refused post sent, by response.
 * @param shown.status The status region's state.
 * @returns The payload.
 */
const payloadOf = Effect.fn("plate.testServer.view")(function* payloadOf(
  options: TestServerOptions,
  session: TestSession,
  view: ItemView,
  shown: {
    readonly posted?: Readonly<Record<string, readonly string[]>>;
    readonly status?: StatusInput;
  },
) {
  yield* Effect.annotateCurrentSpan({ "plate.item.instance": view.instance });

  const document = yield* Effect.fromResult(itemOf(options, view));
  const navigation = yield* Effect.fromResult(navigationState(options.test, session));
  const redacted = yield* Effect.fromResult(
    encodeRedacted(redact(document, view.record, view.configuration)),
  );
  const values = yield* Effect.fromResult(Schema.encodeResult(SavedResponsesSchema)(view.values));
  const timeLeft = Option.flatMap(Option.fromUndefinedOr(navigation.time), (time) => time.timeLeft);
  const payload: ItemViewPayload = {
    configuration: view.configuration,
    disabled: view.disabled,
    instance: view.instance,
    navigation,
    redacted,
    values,
    ...shown,
    ...Option.match(timeLeft, {
      onNone: () => ({}),
      onSome: (seconds) => ({ timeLeft: seconds * 1000 }),
    }),
  };

  return payload;
});

/**
 * Write a payload in the JSON form the wire carries. A payload made by {@link payloadOf} always
 * fits it, so a misfit is a defect, which keeps its cause at the server.
 *
 * @param payload The payload.
 * @returns The JSON form.
 */
const wireOf = (payload: ItemViewPayload) => Effect.sync(() => encodeItemView(payload));

/**
 * Encode a session and store it under its name.
 *
 * @param options The server's options.
 * @param id The session's name.
 * @param session The session.
 */
const save = Effect.fn("plate.testServer.save")(function* save(
  options: TestServerOptions,
  id: string,
  session: TestSession,
) {
  const stored = yield* Effect.fromResult(encodeSession(session));

  yield* Effect.promise(() => options.store.save(id, stored));
});

/**
 * Read the session a request names from the host's store, or start it there when the store has
 * none: `startTest` with the session's name as its instance and the clock's time, then saved.
 *
 * @param options The server's options.
 * @param id The session's name.
 * @param now The clock.
 * @returns The session.
 */
const sessionOf = Effect.fn("plate.testServer.load")(function* sessionOf(
  options: TestServerOptions,
  id: string,
  now: () => Date,
) {
  const stored = yield* Effect.promise(() => options.store.load(id));
  if (stored !== undefined) {
    yield* Effect.annotateCurrentSpan({ "plate.session.started": false });

    return yield* Effect.fromResult(decodeSession(stored, options.test));
  }

  const session = yield* Effect.fromResult(
    startTest(options.test, options.items, options.configuration, { instance: id, now: now() }),
  );

  yield* Effect.annotateCurrentSpan({ "plate.session.started": true });
  yield* save(options, id, session);
  yield* Effect.logDebug("test server started a session");

  return session;
});

/**
 * Answer what the session shows now: the current item's payload while it is open, the test's end
 * once it is closed.
 *
 * @param options The server's options.
 * @param session The session.
 * @param shown Give the status region's state for the item shown, when the step that led here
 *   gave one.
 * @returns The JSON the wire carries for a {@link Posted}'s view, or the finished member.
 */
const shownNow = Effect.fn("plate.testServer.current")(function* shownNow(
  options: TestServerOptions,
  session: TestSession,
  shown: (view: ItemView) => { readonly status?: StatusInput },
) {
  const now = yield* Effect.fromResult(current(options.test, session, options.configuration));
  if (now.kind === "summary") {
    const finished: Posted = { kind: "finished" };

    return finished;
  }

  return {
    kind: "view" as const,
    view: yield* wireOf(yield* payloadOf(options, session, now, shown(now))),
  };
});

/**
 * Answer a refused post: the item it was posted from, re-rendered from the session as it was, with
 * the refusal's messages in a status region headed "Not accepted" and the strings it posted.
 *
 * @param options The server's options.
 * @param session The session, unchanged.
 * @param view The item the post came from.
 * @param refusal The refusal.
 * @returns The `422`.
 */
const refused = Effect.fn("plate.testServer.refuse")(function* refused(
  options: TestServerOptions,
  session: TestSession,
  view: ItemView,
  refusal: Refusal,
) {
  yield* Effect.logDebug("test server refused a post").pipe(
    Effect.annotateLogs({ "plate.item.instance": view.instance }),
  );

  const payload = yield* payloadOf(options, session, view, {
    ...Option.match(refusal.posted, { onNone: () => ({}), onSome: (posted) => ({ posted }) }),
    status: { heading: "notAccepted", instance: view.instance, messages: refusal.messages },
  });

  return json(refusedStatus, { kind: "view", view: yield* wireOf(payload) });
});

/**
 * Answer a `POST`: decode the intent and the current item's responses, refuse a response that does
 * not decode with its item's message, then `advance` the session, store it, and answer what it
 * shows next. A refusal is answered on the item it was posted from, and the store keeps the
 * session as it was. A post to a closed test answers its end.
 *
 * `submit-part` and `end-part` go straight to `advance`: a page confirms them in its own UI before
 * it posts them. A closed item posts nothing, so its step carries no responses.
 *
 * @param options The server's options.
 * @param id The session's name.
 * @param session The session.
 * @param request The post.
 * @param now The clock.
 * @returns The answer.
 */
const answerPost = Effect.fn("plate.testServer.post")(function* answerPost(
  options: TestServerOptions,
  id: string,
  session: TestSession,
  request: Request,
  now: () => Date,
) {
  const shown = yield* Effect.fromResult(current(options.test, session, options.configuration));
  if (shown.kind === "summary") {
    return json(200, { kind: "finished" } satisfies Posted);
  }

  const view = shown;
  const entries = yield* entriesOf(request);
  const document = yield* Effect.fromResult(itemOf(options, view));
  const post = postOf(document, view, entries);
  const posted = view.disabled ? Option.none() : Option.some(post.posted);
  const intent = decodeIntent(entries, session.instance);
  if (Option.isNone(intent)) {
    return yield* refused(options, session, view, {
      messages: [
        {
          response: intentSegment,
          text: `The post carries no intent: send one entry named ${intentName(session.instance)} holding an intent encodeIntent writes.`,
        },
      ],
      posted,
    });
  }

  yield* Effect.annotateCurrentSpan({ "plate.intent": intent.value.kind });

  if (post.malformed.size > 0) {
    const messages = checkResponses(document, post.decoded, view.configuration, view.record).filter(
      (said) => post.malformed.has(said.response),
    );

    return yield* refused(options, session, view, { messages, posted });
  }

  const step = view.disabled
    ? { intent: intent.value }
    : { intent: intent.value, responses: valuesOf(post) };
  const advanced = advance(options.test, options.items, session, step, options.configuration, {
    now: now(),
  });
  if (Result.isFailure(advanced)) {
    const refusal = refusalOf(view, posted, advanced.failure);
    if (Option.isNone(refusal)) {
      return yield* Effect.fail(advanced.failure);
    }

    return yield* refused(options, session, view, refusal.value);
  }

  yield* save(options, id, advanced.success);

  const answer = yield* shownNow(options, advanced.success, (next) =>
    isPartIntent(intent.value)
      ? { status: { heading: "partSubmitted", instance: next.instance } }
      : {},
  );

  return json(200, answer);
});

/**
 * Make the server side of `TestProvider`'s transport: a Fetch handler that answers the wire
 * `fetchTransport` speaks for the session {@link TestServerOptions.sessionOf} names, over
 * `startTest`, `current`, `advance` and `navigationState`, keeping every session in the host's
 * {@link TestServerOptions.store}.
 *
 * - `GET` answers the current item's view, `encodeItemView`'s JSON, while the session is open, and `{
 *   "kind": "finished" }` once it is closed. A session the store lacks is started and saved first.
 * - `POST` takes the current item's form entries and the intent's entry, `intentName(instance)` of
 *   the session's instance, and answers `Posted` JSON: `{ "kind": "view", "view": … }` with the
 *   next view, or `{ "kind": "finished" }`. After `submit-part` or `end-part` the next view's
 *   status is headed "Part submitted". A refused intent, a post with no intent, and a response
 *   whose entries do not decode answer `422` with the view of the item it was posted from: the
 *   messages in its status, headed "Not accepted", and the strings posted in `posted`. Nothing is
 *   saved.
 * - Any other method answers `405`, and reads and saves nothing.
 *
 * The page receives only `redact`'s output, the encoded values and the navigation: never the
 * accepted item or test, a record, a correct response or the session's seed.
 *
 * @example
 *   const handler = createTestServer({
 *     configuration,
 *     items: delivery.items,
 *     sessionOf: (request) => sessionIdFromCookie(request),
 *     store,
 *     test: delivery.test,
 *   });
 *   // In the host's route: export const GET = handler, POST = handler.
 *
 * @param options The accepted test and items, the configuration, the store, how a request names
 *   its session, and the clock.
 * @returns The handler. Its promise rejects, with the failure itself, when the failure is not the
 *   candidate's: the store's own rejection, a stored session `decodeSession` refuses
 *   (`InvalidSession`, `SessionMismatch`), a session name `startTest` refuses
 *   (`InvalidSessionInstance`) or a test it cannot deliver, and an `advance` failure other than a
 *   refusal (`EngineFailure` and the like), so the host's own error handling sees the cause.
 */
export const createTestServer: CreateTestServer = (options) => {
  const now = options.now ?? (() => new Date());
  const handle = Effect.fn("plate.testServer.handle")(function* handle(request: Request) {
    yield* Effect.annotateCurrentSpan({ "http.request.method": request.method });

    if (request.method !== "GET" && request.method !== "POST") {
      return methodNotAllowed();
    }

    const id = options.sessionOf(request);
    const session = yield* sessionOf(options, id, now);

    return request.method === "GET"
      ? yield* Effect.map(
          shownNow(options, session, () => ({})),
          (answer) => json(200, answer.kind === "view" ? answer.view : answer),
        )
      : yield* answerPost(options, id, session, request, now);
  });

  return (request) => Effect.runPromise(handle(request));
};

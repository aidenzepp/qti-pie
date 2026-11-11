/**
 * The React test layer in each engine's page (issue m3g-06): `createAssessmentTestServer` answers
 * the wire over the M2 fixture test, keeping the session in an in-memory store, `fetchTransport`
 * speaks the wire over `fetch`, and `AssessmentTestProvider` and its hooks run the test through
 * that transport.
 *
 * The handler runs in the page, with the browser's own `Request` and `Response`, and no server is
 * started: a transport's `fetch` is routed to the handler for the case's duration. The M2 package
 * (`fixtures/m2`) is read with `commands.readFile` and opened with `openPackage`; its part `P1` is
 * nonlinear and simultaneous, with three items, and `P2` linear and simultaneous, with two. Every
 * case sits under a `describe` named by the engine (`server.browser`).
 */
import { assert, describe, it, vi } from "@effect/vitest";
import { Effect, Option, Result, Schema } from "effect";
import { useMemo } from "react";
import type { ReactNode } from "react";
import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import type { RootOptions } from "react-dom/client";
import { commands, server, userEvent } from "vite-plus/test/browser/context";
import { decodeRedacted } from "#plate/codec/redacted.ts";
import { decodeSession, SavedResponsesSchema } from "#plate/codec/session.ts";
import type { StoredTestSession } from "#plate/codec/session.ts";
import { decodeItemView } from "#plate/codec/view.ts";
import { configure } from "#plate/configuration.ts";
import { decode } from "#plate/form/encoding.ts";
import { encodeIntent, intentName } from "#plate/form/intent.ts";
import type { ResponseValue } from "#plate/model/values.ts";
import { openPackage } from "#plate/package/open.ts";
import type { PackageTest } from "#plate/package/open.ts";
import { postings } from "#plate/payload.ts";
import type { Posting } from "#plate/payload.ts";
import {
  createAssessmentTestServer,
  fetchTransport,
  Item,
  NoAssessmentTestProvider,
  AssessmentTestProvider,
  useCurrentItem,
  useNavigation,
  useSubmit,
  useAssessmentTest,
  useTimer,
} from "#plate/react/index.tsx";
import type {
  ItemViewPayload,
  Posted,
  Submit,
  AssessmentTestState,
  AssessmentTestStore,
  AssessmentTestTransport,
  TimerState,
} from "#plate/react/index.tsx";
import { isStub } from "#plate/react/parts.tsx";
import type { Intent } from "#plate/session/session.ts";

/**
 * The M2 fixture package's folder, relative to the package, the in-page project's root, which
 * `commands.readFile` resolves paths against.
 */
const fixtureFolder = "fixtures/m2";

/**
 * The M2 package's files, by path from the package's root.
 */
const fixtureFiles = [
  "imsmanifest.xml",
  "test.xml",
  "items/p1-single-choice.xml",
  "items/p1-text-entry.xml",
  "items/p1-multiple-choice.xml",
  "items/p2-extended-text.xml",
  "items/p2-choice.xml",
] as const;

/**
 * The session every case's server names, and so the session's instance.
 */
const sessionId = "candidate";

/**
 * The clock every case's server reads.
 */
const startedAt = new Date("2026-11-10T12:00:00.000Z");

/**
 * Where the test server answers: the handler runs in the page, so no request leaves it.
 */
const url = "http://plate.test/session";

/**
 * The response the M2 test's first item, a single Choice, binds.
 */
const choiceResponse = "RESPONSE";

/**
 * The keys of the parts of an accepted item `redact` leaves out, which no view may carry.
 */
const secretKeys = [
  "correct",
  "mapping",
  "areaMapping",
  "defaultValue",
  "outcomes",
  "processing",
] as const;

/**
 * Open the M2 package and give its one test.
 *
 * @returns The test and its items, as `openPackage` delivers them.
 */
const openM2 = Effect.gen(function* openM2() {
  const encoder = new TextEncoder();
  const files = new Map<string, Uint8Array>();

  for (const file of fixtureFiles) {
    const text = yield* Effect.promise(() => commands.readFile(`${fixtureFolder}/${file}`));

    files.set(file, encoder.encode(text));
  }

  const verdict = yield* openPackage(fixtureFolder, files);
  if (verdict.verdict !== "accepted" && verdict.verdict !== "accepted-with-unsupported") {
    return assert.fail(`the M2 package is ${verdict.verdict}`);
  }

  const [delivery] = verdict.accepted.tests.values();

  return delivery ?? assert.fail("the M2 package holds no test");
});

/**
 * A test server over the M2 test with an in-memory store and the fixed clock.
 */
interface Sitting {
  readonly delivery: PackageTest;
  readonly handler: (request: Request) => Promise<Response>;
  /**
   * The store's sessions, by id, which a case compares by identity to see that nothing was saved.
   */
  readonly sessions: ReadonlyMap<string, StoredTestSession>;
}

/**
 * Make a test server over the M2 test, with a fresh in-memory store.
 *
 * @returns The server, its test and its store's sessions.
 */
const sitting = Effect.gen(function* sitting() {
  const delivery = yield* openM2;
  const sessions = new Map<string, StoredTestSession>();
  const store: AssessmentTestStore = {
    load: (id) => Promise.resolve(sessions.get(id)),
    save: (id, session) => {
      sessions.set(id, session);

      return Promise.resolve();
    },
  };
  const handler = createAssessmentTestServer({
    configuration: yield* configure({}),
    items: delivery.items,
    now: () => startedAt,
    sessionOf: () => sessionId,
    store,
    test: delivery.test,
  });

  return { delivery, handler, sessions } satisfies Sitting;
});

/**
 * Send a request to a test server.
 *
 * @param handler The server.
 * @param request The request.
 * @returns The answer.
 */
const send = (handler: Sitting["handler"], request: Request) =>
  Effect.promise(() => handler(request));

/**
 * Make the `POST` of an intent with some entries of the current item's form.
 *
 * @param intent The intent.
 * @param entries The form's entries.
 * @returns The request, with the intent's entry after the form's.
 */
const posting = (intent: Intent, entries: readonly (readonly [string, string])[]): Request => {
  const form = new FormData();

  for (const [name, value] of entries) {
    form.append(name, value);
  }

  form.append(intentName(sessionId), encodeIntent(intent));

  return new Request(url, { body: form, method: "POST" });
};

/**
 * Read an answer's body as text.
 *
 * @param response The answer.
 * @returns The body.
 */
const textOf = (response: Response) => Effect.promise(() => response.text());

/**
 * Decode a bare view, as a `GET` answers an open session's, from its JSON text.
 *
 * @param text The body.
 * @returns The view.
 */
const viewOfText = (text: string): ItemViewPayload =>
  Result.getOrThrow(decodeItemView(JSON.parse(text)));

/**
 * Read the bare view an answer carries.
 *
 * @param response The answer.
 * @returns The view.
 */
const viewIn = (response: Response) => Effect.map(textOf(response), viewOfText);

/**
 * The JSON shape of a {@link Posted}, its view left for `decodeItemView`.
 */
const PostedJson = Schema.Union([
  Schema.Struct({ kind: Schema.Literal("finished") }),
  Schema.Struct({ kind: Schema.Literal("view"), view: Schema.Unknown }),
]);

/**
 * Read the {@link Posted} an answer carries.
 *
 * @param response The answer.
 * @returns The answer's end or view.
 */
const postedIn = (response: Response) =>
  Effect.map(textOf(response), (text): Posted => {
    const answer = Schema.decodeUnknownSync(PostedJson)(JSON.parse(text));

    return answer.kind === "finished"
      ? answer
      : { kind: "view", view: Result.getOrThrow(decodeItemView(answer.view)) };
  });

/**
 * Give an answer's view, failing the case when it is the test's end.
 *
 * @param answer The answer.
 * @returns Its view.
 */
const shownBy = (answer: Posted): ItemViewPayload =>
  answer.kind === "view" ? answer.view : assert.fail("the answer is the test's end, not a view");

/**
 * Give the posting of one response of a view's item.
 *
 * @param view The view.
 * @param response The response's identifier.
 * @returns The posting: its entry name and how its entries decode.
 */
const postingOf = (view: ItemViewPayload, response: string): Posting =>
  postings(Result.getOrThrow(decodeRedacted(view.redacted)), view.instance).find(
    (found) => found.identifier === response,
  ) ?? assert.fail(`the item ${view.instance} posts no ${response}`);

/**
 * Give the value a response's entries decode to, as the server decodes them.
 *
 * @param found The response's posting.
 * @param values The strings posted under its entry name.
 * @returns The value.
 */
const decodedAs = (found: Posting, values: readonly string[]): ResponseValue =>
  Result.getOrThrow(
    decode(
      values.map((value) => [found.binding.name, value] as const),
      found.binding,
      found.options,
    ),
  );

/**
 * Read a stored session back with its test.
 *
 * @param run The server and its store.
 * @returns The session the store holds.
 */
const storedSession = (run: Sitting) =>
  Result.getOrThrow(
    decodeSession(
      run.sessions.get(sessionId) ?? assert.fail("the store holds no session"),
      run.delivery.test,
    ),
  );

/**
 * Give the intent that moves a test on toward its end, as its navigation allows it: `submit-part`
 * when the part takes it now, else `next`.
 *
 * @param view The current view.
 * @returns The intent.
 */
const onward = (view: ItemViewPayload): Intent =>
  view.navigation.allowed.find((intent) => intent.kind === "submit-part") ??
  view.navigation.allowed.find((intent) => intent.kind === "next") ??
  assert.fail(`the item ${view.instance} allows neither submit-part nor next`);

/**
 * Route the page's `fetch` to a test server for the rest of the case, restored when it ends.
 *
 * @param handler The server.
 */
const routeFetch = (handler: Sitting["handler"]): void => {
  vi.stubGlobal("fetch", (input: RequestInfo | URL, init?: RequestInit) =>
    handler(new Request(input, init)),
  );
};

/**
 * Run a case with the page's `fetch` restored after it, whatever it ends with.
 *
 * @param effect The case.
 * @returns The case, restoring `fetch` after.
 */
const restoringFetch = <A, E>(effect: Effect.Effect<A, E>) =>
  effect.pipe(Effect.ensuring(Effect.sync(() => vi.unstubAllGlobals())));

/**
 * Mount a React node into a fresh container at the end of the page's body, synchronously.
 *
 * @param node The node.
 * @param options React's root options, such as the handler of an error a component threw.
 * @returns The container and its unmount, which the caller calls.
 */
const mount = (node: ReactNode, options: RootOptions = {}) => {
  const container = document.createElement("div");

  document.body.append(container);

  const root = createRoot(container, options);

  flushSync(() => {
    root.render(node);
  });

  return {
    container,
    unmount: () => {
      root.unmount();
      container.remove();
    },
  };
};

/**
 * Wait until a check holds, failing the case after ten seconds.
 *
 * @param check The check, which throws while it does not hold.
 * @returns What the check gave once it held.
 */
const eventually = <A,>(check: () => A) =>
  Effect.promise(() => vi.waitFor(check, { timeout: 10_000 }));

/**
 * What the probes below saw, render by render.
 */
interface Seen {
  items: ItemViewPayload[];
  navigations: ItemViewPayload["navigation"][];
  states: AssessmentTestState[];
  submit?: Submit;
  timers: TimerState[];
}

/**
 * Make an empty record of what the probes see.
 *
 * @returns The record.
 */
const seen = (): Seen => ({ items: [], navigations: [], states: [], timers: [] });

/**
 * Give the last state a probe saw.
 *
 * @param record What the probes saw.
 * @returns The last state.
 */
const lastState = (record: Seen): AssessmentTestState =>
  record.states.at(-1) ?? assert.fail("the provider has not rendered its children");

/**
 * Read the current item and the navigation, recording both.
 *
 * @param props The record to write.
 * @param props.record What the probes saw.
 * @returns Nothing.
 */
const ItemProbe = ({ record }: { readonly record: Seen }): ReactNode => {
  record.items.push(useCurrentItem());
  record.navigations.push(useNavigation());

  return null;
};

/**
 * The current item, as the host renders it from {@link useCurrentItem}: with the view's instance,
 * configuration, disabled state and values, and a refusal's messages and posted strings.
 *
 * @returns The item.
 */
const ShownItem = (): ReactNode => {
  const view = useCurrentItem();
  const redacted = useMemo(() => Result.getOrThrow(decodeRedacted(view.redacted)), [view]);
  const values = useMemo(() => Schema.decodeUnknownSync(SavedResponsesSchema)(view.values), [view]);

  return (
    <Item
      configuration={view.configuration}
      options={{
        disabled: view.disabled,
        instance: view.instance,
        messages: view.status?.messages ?? [],
        posted: view.posted ?? {},
        values,
      }}
      redacted={redacted}
    />
  );
};

/**
 * The host's page inside the provider: its own form around the current item, keyed by its
 * instance so the next item mounts afresh. It records the session's state, the timer and the
 * submit function.
 *
 * @param props The record to write.
 * @param props.record What the probes saw.
 * @returns The form.
 */
const HostPage = ({ record }: { readonly record: Seen }): ReactNode => {
  const state = useAssessmentTest();

  record.states.push(state);
  record.timers.push(useTimer());
  record.submit = useSubmit();

  return (
    <form>
      {state.view === undefined ? null : (
        <>
          <ItemProbe record={record} />
          <ShownItem key={state.view.instance} />
        </>
      )}
    </form>
  );
};

/**
 * Call `useCurrentItem` with no provider above it.
 *
 * @returns Nothing: the hook throws.
 */
const CurrentItemAlone = (): ReactNode => {
  useCurrentItem();

  return null;
};

/**
 * Mount the host's page in a provider over a transport, and wait for its first view.
 *
 * @param transport The transport.
 * @returns What the probes saw, the mounted page and the first view.
 */
const mountedPage = (transport: AssessmentTestTransport) =>
  Effect.gen(function* mountPage() {
    const record = seen();
    const mounted = mount(
      <AssessmentTestProvider transport={transport}>
        <HostPage record={record} />
      </AssessmentTestProvider>,
    );
    const first = yield* eventually(
      () => lastState(record).view ?? assert.fail("no view has arrived"),
    );

    return { first, mounted, record };
  });

/**
 * Give the form the host's page renders.
 *
 * @param container The mounted page.
 * @returns The form.
 */
const formIn = (container: HTMLElement): HTMLFormElement =>
  container.querySelector("form") ?? assert.fail("the page holds no form");

/**
 * Submit through the provider's `useSubmit`, with the host's form as it stands.
 *
 * @param record What the probes saw, holding the submit function.
 * @param container The mounted page.
 * @param intent The intent.
 * @returns What the server answered.
 */
const submitted = (record: Seen, container: HTMLElement, intent: Intent) =>
  Effect.promise(() =>
    (record.submit ?? assert.fail("useSubmit has not rendered"))(
      intent,
      new FormData(formIn(container)),
    ),
  );

describe(server.browser, () => {
  describe("createAssessmentTestServer", () => {
    it.effect("[m3g-06] a GET for a new session starts it and answers the first item's view", () =>
      Effect.gen(function* startsOnGet() {
        const run = yield* sitting;
        const response = yield* send(run.handler, new Request(url));

        assert.strictEqual(response.status, 200);

        const view = yield* viewIn(response);

        const choice = postingOf(view, choiceResponse);
        const session = storedSession(run);

        assert.strictEqual(view.instance, `${sessionId}.1`);
        assert.strictEqual(view.navigation.position, 1);
        assert.isFalse(view.disabled);
        assert.deepStrictEqual(Schema.decodeUnknownSync(SavedResponsesSchema)(view.values), {
          [choiceResponse]: decodedAs(choice, []),
        });
        assert.strictEqual(
          Result.getOrThrow(decodeRedacted(view.redacted)).identifier,
          "p1-single-choice",
        );
        assert.strictEqual(session.instance, sessionId);
        assert.isTrue(
          Option.isNone(
            session.items.find((item) => item.sequenceIndex === 1)?.saved ?? Option.some({}),
          ),
        );
      }),
    );

    it.effect("[m3g-06] the view carries only redact's output", () =>
      Effect.gen(function* onlyRedacted() {
        const run = yield* sitting;
        const text = yield* textOf(yield* send(run.handler, new Request(url)));

        assert.isTrue(Result.isSuccess(decodeRedacted(viewOfText(text).redacted)));

        for (const key of secretKeys) {
          assert.notInclude(text, `${JSON.stringify(key)}:`, key);
        }
      }),
    );

    it.effect("[m3g-06] a POST with next advances and saves the posted responses", () =>
      Effect.gen(function* nextSaves() {
        const run = yield* sitting;
        const first = yield* viewIn(yield* send(run.handler, new Request(url)));
        const choice = postingOf(first, choiceResponse);
        const response = yield* send(
          run.handler,
          posting({ kind: "next" }, [[choice.binding.name, "B"]]),
        );

        assert.strictEqual(response.status, 200);

        const next = shownBy(yield* postedIn(response));

        assert.strictEqual(next.instance, `${sessionId}.2`);
        assert.strictEqual(next.navigation.position, 2);

        const saved = storedSession(run).items.find((item) => item.sequenceIndex === 1)?.saved;

        assert.deepStrictEqual(
          Option.getOrThrow(saved ?? Option.none())[choiceResponse],
          decodedAs(choice, ["B"]),
        );
      }),
    );

    it.effect("[m3g-06] a view after previous shows the saved values", () =>
      Effect.gen(function* previousShowsSaved() {
        const run = yield* sitting;
        const first = yield* viewIn(yield* send(run.handler, new Request(url)));
        const choice = postingOf(first, choiceResponse);

        yield* send(run.handler, posting({ kind: "next" }, [[choice.binding.name, "B"]]));

        const response = yield* send(run.handler, posting({ kind: "previous" }, []));

        assert.strictEqual(response.status, 200);

        const back = shownBy(yield* postedIn(response));

        assert.strictEqual(back.instance, `${sessionId}.1`);
        assert.deepStrictEqual(
          Schema.decodeUnknownSync(SavedResponsesSchema)(back.values)[choiceResponse],
          decodedAs(choice, ["B"]),
        );
      }),
    );

    it.effect(
      "[m3g-06] a refused intent answers the item it was posted from with its posted strings",
      () =>
        Effect.gen(function* refusedIntent() {
          const run = yield* sitting;
          const first = yield* viewIn(yield* send(run.handler, new Request(url)));
          const choice = postingOf(first, choiceResponse);
          const before = run.sessions.get(sessionId);

          assert.isFalse(first.navigation.allowed.some((intent) => intent.kind === "previous"));

          const response = yield* send(
            run.handler,
            posting({ kind: "previous" }, [[choice.binding.name, "C"]]),
          );

          assert.strictEqual(response.status, 422);

          const answer = yield* postedIn(response);
          const refused = shownBy(answer);

          assert.strictEqual(answer.kind, "view");
          assert.strictEqual(refused.instance, first.instance);
          assert.deepStrictEqual(refused.posted?.[choiceResponse], ["C"]);
          assert.strictEqual(run.sessions.get(sessionId), before);
        }),
    );

    it.effect("[m3g-06] a malformed form answers 422 with the item's messages", () =>
      Effect.gen(function* malformedForm() {
        const run = yield* sitting;
        const first = yield* viewIn(yield* send(run.handler, new Request(url)));
        const choice = postingOf(first, choiceResponse);
        const before = run.sessions.get(sessionId);
        const twice = [
          [choice.binding.name, "A"],
          [choice.binding.name, "B"],
        ] as const;
        const refusal = decode(twice, choice.binding, choice.options);

        assert.strictEqual(Result.isFailure(refusal) ? refusal.failure.reason : "", "single-many");

        const response = yield* send(run.handler, posting({ kind: "next" }, twice));

        assert.strictEqual(response.status, 422);

        const refused = shownBy(yield* postedIn(response));

        assert.strictEqual(refused.instance, first.instance);
        assert.isAbove(refused.status?.messages?.length ?? 0, 0);
        assert.strictEqual(run.sessions.get(sessionId), before);
      }),
    );

    it.effect("[m3g-06] the last submit answers finished, and GET then answers finished too", () =>
      Effect.gen(function* walksToTheEnd() {
        const run = yield* sitting;
        const walk = (answer: Posted, steps: number): Effect.Effect<Posted> =>
          answer.kind === "finished" || steps === 0
            ? Effect.succeed(answer)
            : Effect.gen(function* step() {
                const response = yield* send(run.handler, posting(onward(answer.view), []));

                assert.strictEqual(response.status, 200);

                return yield* walk(yield* postedIn(response), steps - 1);
              });
        const first = yield* viewIn(yield* send(run.handler, new Request(url)));
        const last = yield* walk({ kind: "view", view: first }, 10);

        assert.deepStrictEqual(last, { kind: "finished" });

        const response = yield* send(run.handler, new Request(url));

        assert.strictEqual(response.status, 200);
        assert.deepStrictEqual(JSON.parse(yield* textOf(response)), { kind: "finished" });
      }),
    );

    it.effect("[m3g-06] a request with another method answers 405", () =>
      Effect.gen(function* otherMethod() {
        const run = yield* sitting;
        const fresh = yield* send(run.handler, new Request(url, { method: "PUT" }));

        assert.strictEqual(fresh.status, 405);
        assert.strictEqual(run.sessions.size, 0);

        yield* send(run.handler, new Request(url));

        const before = run.sessions.get(sessionId);
        const response = yield* send(run.handler, new Request(url, { method: "PUT" }));

        assert.strictEqual(response.status, 405);
        assert.strictEqual(run.sessions.get(sessionId), before);
      }),
    );
  });

  describe("fetchTransport", () => {
    it.effect("[m3g-06] fetchTransport speaks the wire over fetch", () =>
      restoringFetch(
        Effect.gen(function* speaksTheWire() {
          const run = yield* sitting;

          routeFetch(run.handler);

          const transport = fetchTransport(url);
          const first = shownBy(yield* Effect.promise(() => transport.view()));
          const choice = postingOf(first, choiceResponse);
          const form = new FormData();

          form.append(choice.binding.name, "C");

          assert.strictEqual(first.instance, `${sessionId}.1`);

          const refused = shownBy(
            yield* Effect.promise(() => transport.post({ kind: "previous" }, form)),
          );

          assert.strictEqual(refused.instance, first.instance);
          assert.deepStrictEqual(refused.posted?.[choiceResponse], ["C"]);

          const next = shownBy(yield* Effect.promise(() => transport.post({ kind: "next" }, form)));

          assert.strictEqual(next.instance, `${sessionId}.2`);
          assert.strictEqual(next.navigation.position, 2);
        }),
      ),
    );
  });

  describe("AssessmentTestProvider", () => {
    it.effect("[m3g-06] AssessmentTestProvider loads the view and its hooks read it", () =>
      restoringFetch(
        Effect.gen(function* loadsTheView() {
          const run = yield* sitting;

          routeFetch(run.handler);

          const { first, mounted, record } = yield* mountedPage(fetchTransport(url));
          const [initial] = record.states;

          assert.isTrue(initial?.pending);
          assert.isUndefined(initial?.view);
          assert.isFalse(lastState(record).pending);
          assert.strictEqual(first.instance, `${sessionId}.1`);
          assert.strictEqual(record.items.at(-1), first);
          assert.strictEqual(record.navigations.at(-1), first.navigation);
          mounted.unmount();
        }),
      ),
    );

    it.effect("[m3g-06] useSubmit posts the form and shows the next view", () =>
      restoringFetch(
        Effect.gen(function* submitsTheForm() {
          const run = yield* sitting;

          routeFetch(run.handler);

          const { mounted, record } = yield* mountedPage(fetchTransport(url));
          const radio = yield* eventually(
            () =>
              mounted.container.querySelector<HTMLInputElement>('input[value="B"]') ??
              assert.fail("the item shows no choice B"),
          );

          yield* Effect.promise(() => userEvent.click(radio));

          const answer = yield* submitted(record, mounted.container, { kind: "next" });

          assert.strictEqual(shownBy(answer).instance, `${sessionId}.2`);

          const shown = yield* eventually(() => {
            const state = lastState(record);

            assert.strictEqual(state.view?.instance, `${sessionId}.2`);
            assert.isFalse(state.pending);

            return state;
          });

          assert.strictEqual(record.items.at(-1), shown.view);

          const saved = storedSession(run).items.find((item) => item.sequenceIndex === 1)?.saved;

          assert.isTrue(Option.isSome(saved ?? Option.none()));
          mounted.unmount();
        }),
      ),
    );

    it.effect("[m3g-06] the provider shows a refusal on the same item", () =>
      restoringFetch(
        Effect.gen(function* showsTheRefusal() {
          const run = yield* sitting;

          routeFetch(run.handler);

          const { first, mounted, record } = yield* mountedPage(fetchTransport(url));
          const answer = yield* submitted(record, mounted.container, { kind: "previous" });
          const refused = shownBy(answer);

          assert.strictEqual(refused.instance, first.instance);

          const shown = yield* eventually(() => {
            const state = lastState(record);

            assert.isFalse(state.pending);
            assert.strictEqual(state.view, refused);

            return state;
          });

          assert.strictEqual(record.items.at(-1), refused);
          assert.strictEqual(shown.view?.instance, first.instance);
          assert.deepStrictEqual(shown.view?.status?.messages, refused.status?.messages);
          assert.isAbove(shown.view?.status?.messages?.length ?? 0, 0);
          mounted.unmount();
        }),
      ),
    );

    it.effect("[m3g-06] the provider shows the end", () =>
      restoringFetch(
        Effect.gen(function* showsTheEnd() {
          const run = yield* sitting;

          routeFetch(run.handler);

          const { first, mounted, record } = yield* mountedPage(fetchTransport(url));
          const walk = (view: ItemViewPayload, steps: number): Effect.Effect<ItemViewPayload> =>
            Effect.gen(function* step() {
              const answer = yield* submitted(record, mounted.container, onward(view));

              return answer.kind === "finished" || steps === 0
                ? view
                : yield* walk(answer.view, steps - 1);
            });
          const lastShown = yield* walk(first, 10);
          const ended = yield* eventually(() => {
            const state = lastState(record);

            assert.isTrue(state.finished);
            assert.isFalse(state.pending);

            return state;
          });

          assert.strictEqual(ended.view, lastShown);
          mounted.unmount();
        }),
      ),
    );

    it.effect("[m3g-06] useTimer gives no time left when no limit is in force", () =>
      restoringFetch(
        Effect.gen(function* noTimeLeft() {
          const run = yield* sitting;

          routeFetch(run.handler);

          const { first, mounted, record } = yield* mountedPage(fetchTransport(url));

          assert.isUndefined(first.timeLeft);
          assert.isAbove(record.timers.length, 0);
          assert.isUndefined(record.timers.at(-1)?.timeLeft);
          mounted.unmount();
        }),
      ),
    );

    it("[m3g-06] a hook outside an AssessmentTestProvider throws NoAssessmentTestProvider naming the hook", () => {
      const errors: unknown[] = [];
      const { unmount } = mount(<CurrentItemAlone />, {
        onUncaughtError: (thrown) => {
          errors.push(thrown);
        },
      });

      unmount();

      const [error] = errors;

      assert.strictEqual(errors.length, 1);
      assert.instanceOf(error, NoAssessmentTestProvider);
      assert.strictEqual(error.hook, "useCurrentItem");
    });

    it("[m3g-06] AssessmentTestProvider is no longer a stub", () => {
      assert.isFalse(isStub(AssessmentTestProvider));
    });
  });
});

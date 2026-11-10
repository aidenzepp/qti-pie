/**
 * The test layer over plate's pieces: `TestProvider` holds a test session reached through a
 * `TestTransport`, and its hooks read it; `fetchTransport` is the transport that speaks the wire
 * `createTestServer` (`#plate/react/test-server.tsx`) answers. The provider renders no form and no
 * submit control: the host renders the current item inside its own form and posts that form's
 * data through `useSubmit`. {@link NoTestProvider} is the failure every hook throws outside a
 * provider.
 *
 * @module
 */
import { Data, Option, Result, Schema } from "effect";
import { createContext, use, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { decodeItemView, InvalidItemView } from "#plate/codec/view.ts";
import { encodeIntent, intentName } from "#plate/form/intent.ts";
import type { NavigationState } from "#plate/navigation.ts";
import type {
  ItemViewPayload,
  Posted,
  Submit,
  TestProviderProps,
  TestSessionState,
  TestTransport,
  TimerState,
} from "#plate/react/contract.tsx";

/**
 * A piece of the React layer that is still a stub: mounting or calling it fails, naming the issue
 * that fills it. It is thrown, since React reports a component's failure only by a throw, which an
 * error boundary catches.
 */
export class NotImplemented extends Data.TaggedError("NotImplemented")<{
  /**
   * The issue that fills the piece, such as `m3g-06`.
   */
  readonly issue: string;
  /**
   * The piece's name, such as `TestProvider`.
   */
  readonly piece: string;
}> {
  /**
   * The piece and the issue that fills it.
   */
  override get message(): string {
    return `${this.piece} is a stub of plate's React layer: issue ${this.issue} fills it. Render items with Item, or use plate's session functions on the server, until it lands.`;
  }
}

/**
 * A hook of the test layer called outside a `TestProvider`: the hook has no session to read. Every
 * hook throws it when no provider is mounted above the component that calls it. It is thrown,
 * since React reports a component's failure only by a throw, which an error boundary catches.
 */
export class NoTestProvider extends Data.TaggedError("NoTestProvider")<{
  /**
   * The hook's name, such as `useCurrentItem`.
   */
  readonly hook: string;
}> {
  /**
   * The hook and the remedy.
   */
  override get message(): string {
    return `${this.hook} was called outside a TestProvider, so it has no test session to read. Mount a TestProvider above the component that calls ${this.hook}, with a transport such as fetchTransport(url).`;
  }
}

/**
 * The status codes the wire answers with a body: `200`, and `422` for a refused post.
 */
const answeredStatuses: ReadonlySet<number> = new Set([200, 422]);

/**
 * Give the session's instance from an item's: the item's instance is the session's, a `.` and the
 * item's sequence index.
 *
 * @param itemInstance The item's instance, as a view carries it.
 * @returns The session's instance, which the intent's entry is named by.
 */
const sessionInstanceOf = (itemInstance: string): string =>
  itemInstance.slice(0, itemInstance.lastIndexOf("."));

/**
 * The wire's answers that name their kind: the test's end, and a `POST`'s view, whose payload
 * {@link decodeItemView} checks. A `GET` answers an open session's view bare, with no kind.
 */
const KindedAnswer = Schema.Union([
  Schema.Struct({ kind: Schema.Literal("finished") }),
  Schema.Struct({ kind: Schema.Literal("view"), view: Schema.Unknown }),
]);

/**
 * Read the body the test server answered as a {@link Posted}: `{ "kind": "finished" }`, a `Posted`
 * view, or the bare view a `GET` answers while the session is open.
 *
 * @param body The answer's JSON.
 * @returns The answer, or {@link InvalidItemView} when its view is not the JSON form
 *   `encodeItemView` writes.
 */
// oxlint-disable-next-line anti-slop/no-unknown-parameters -- The body arrives from the wire as any value, and this is the check that parses it.
const postedOf = (body: unknown): Result.Result<Posted, InvalidItemView> =>
  Option.match(Schema.decodeUnknownOption(KindedAnswer)(body), {
    onNone: () => Result.map(decodeItemView(body), (view): Posted => ({ kind: "view", view })),
    onSome: (answer) =>
      answer.kind === "finished"
        ? Result.succeed<Posted>(answer)
        : Result.map(decodeItemView(answer.view), (view): Posted => ({ kind: "view", view })),
  });

/**
 * Read the test server's answer.
 *
 * @param response The answer.
 * @returns A promise of the {@link Posted} it carries, a `422`'s refusal included; it rejects with
 *   {@link InvalidItemView} at stage `decode` for an answer whose status is neither `200` nor `422`
 *   or whose body is not the wire's JSON.
 */
const answerOf = async (response: Response): Promise<Posted> => {
  if (!answeredStatuses.has(response.status)) {
    throw new InvalidItemView({
      issue: `the test server answered HTTP ${String(response.status)}, where the wire answers 200 or 422`,
      stage: "decode",
    });
  }

  return Result.getOrThrow(postedOf(await response.json()));
};

/**
 * Copy a form's entries and set the intent's entry, `intentName(instance)` holding
 * `encodeIntent(intent)`, after them, so the host's own form is left as it was.
 *
 * @param form The current item's form data.
 * @param instance The session's instance.
 * @param intent The intent.
 * @returns The body to post.
 */
const withIntent = (form: FormData, instance: string, intent: Parameters<Submit>[0]): FormData => {
  const body = new FormData();

  for (const [name, value] of form) {
    body.append(name, value);
  }

  body.set(intentName(instance), encodeIntent(intent));

  return body;
};

/**
 * Make the transport that speaks `createTestServer`'s wire over `fetch`, to the URL the server is
 * mounted at: `view` sends `GET`, and `post` sends `POST` with the form's entries and the intent's
 * entry, named by the session's instance, which the transport reads from the last view it was
 * answered with. A `post` before any view first asks for one, and answers the test's end without
 * posting when that is what it gets.
 *
 * @example
 *   <TestProvider transport={fetchTransport("/api/test-session")}>
 *     <TestPage />
 *   </TestProvider>;
 *
 * @param url The URL the test server answers at, which the requests go to.
 * @returns The transport. Its requests resolve with the server's answer, a `422`'s refusal
 *   included, and reject with `fetch`'s own failure, or with {@link InvalidItemView} at stage
 *   `decode` for an answer that is not the wire's.
 */
export const fetchTransport = (url: string): TestTransport => {
  const last = { instance: Option.none<string>() };
  const remember = (answer: Posted): Posted => {
    if (answer.kind === "view") {
      last.instance = Option.some(sessionInstanceOf(answer.view.instance));
    }

    return answer;
  };
  const view = async (): Promise<Posted> =>
    remember(
      await answerOf(await fetch(url, { headers: { accept: "application/json" }, method: "GET" })),
    );
  const instanceNow = async (): Promise<Option.Option<string>> => {
    if (Option.isNone(last.instance)) {
      await view();
    }

    return last.instance;
  };

  return {
    post: async (intent, form) => {
      const known = await instanceNow();
      if (Option.isNone(known)) {
        return { kind: "finished" };
      }

      const response = await fetch(url, {
        body: withIntent(form, known.value, intent),
        headers: { accept: "application/json" },
        method: "POST",
      });

      return remember(await answerOf(response));
    },
    view,
  };
};

/**
 * What a provider gives its hooks: the session's state, the first view's arrival, which a hook
 * that needs a view suspends on until it has one, and the submit function.
 */
interface Held {
  readonly firstView: Promise<ItemViewPayload>;
  readonly state: TestSessionState;
  readonly submit: Submit;
}

/**
 * The provider's context: none outside a `TestProvider`.
 */
const TestContext = createContext<Held | undefined>(undefined);

/**
 * Give what the provider above holds.
 *
 * @param hook The calling hook's name, which {@link NoTestProvider} names.
 * @returns What the provider holds.
 * @throws {NoTestProvider} When no provider is mounted above the caller.
 */
const useHeld = (hook: string): Held => {
  const held = useContext(TestContext);
  if (held === undefined) {
    throw new NoTestProvider({ hook });
  }

  return held;
};

/**
 * Give the view the provider shows, suspending until the first one arrives.
 *
 * @param held What the provider holds.
 * @returns The view.
 */
const useShownView = (held: Held): ItemViewPayload => held.state.view ?? use(held.firstView);

/**
 * Hold a test session reached through a transport, for the hooks below: on mount it asks the
 * transport for the current view, and `useSubmit` posts an intent with the host's form and shows
 * what the server answers, a refusal's view on the same item included. It renders only its
 * children: no form, no item and no submit control, which the host renders from the hooks.
 *
 * The state is `pending` while a request is in flight; `finished` once the server answered the
 * test's end, with `view` still the last one shown. A transport whose first `view` rejects fails
 * the provider with that rejection, which an error boundary above it catches; a rejected submit
 * rejects the promise `useSubmit`'s function returned and leaves the view as it was.
 *
 * @example
 *   const Page = () => {
 *   const view = useCurrentItem();
 *   const submit = useSubmit();
 *   return (
 *   <form onSubmit={(event) => { event.preventDefault(); void submit({ kind: "next" }, new FormData(event.currentTarget)); }}>
 *   <Item key={view.instance} configuration={view.configuration} redacted={…} options={{ instance: view.instance }} />
 *   <button>Next</button>
 *   </form>
 *   );
 *   };
 *   <TestProvider transport={fetchTransport("/api/test-session")}><Page /></TestProvider>;
 *
 * @param props The transport and the children.
 * @param props.children What reads the session through the hooks.
 * @param props.transport How the provider reaches the test server.
 * @returns The children, under the provider's context.
 */
export const TestProvider = ({ children, transport }: TestProviderProps): ReactNode => {
  const [state, setState] = useState<TestSessionState>({ finished: false, pending: true });
  const [failure, setFailure] = useState<Option.Option<unknown>>(Option.none());
  const [firstView] = useState(() => Promise.withResolvers<ItemViewPayload>());
  const show = useCallback(
    (answer: Posted) => {
      if (answer.kind === "view") {
        firstView.resolve(answer.view);
      }

      setState((before) =>
        answer.kind === "view"
          ? { finished: false, pending: false, view: answer.view }
          : { ...before, finished: true, pending: false },
      );
    },
    [firstView],
  );

  useEffect(() => {
    const subscription = { live: true };
    const load = async (): Promise<void> => {
      const [settled] = await Promise.allSettled([transport.view()]);
      if (settled === undefined || !subscription.live) {
        return;
      }

      if (settled.status === "fulfilled") {
        show(settled.value);
      } else {
        setFailure(Option.some(settled.reason));
      }
    };

    void load();

    return () => {
      subscription.live = false;
    };
  }, [show, transport]);

  const submit = useCallback<Submit>(
    async (intent, form) => {
      setState((before) => ({ ...before, pending: true }));

      const [settled] = await Promise.allSettled([transport.post(intent, form)]);
      if (settled?.status !== "fulfilled") {
        setState((before) => ({ ...before, pending: false }));

        throw settled?.reason;
      }

      show(settled.value);

      return settled.value;
    },
    [show, transport],
  );
  const held = useMemo(
    (): Held => ({ firstView: firstView.promise, state, submit }),
    [firstView, state, submit],
  );

  if (Option.isSome(failure)) {
    throw failure.value;
  }

  return <TestContext value={held}>{children}</TestContext>;
};

/**
 * Read the test session the provider above holds: whether a request is in flight, the last view
 * and whether the test has finished.
 *
 * @returns The session's state.
 * @throws {NoTestProvider} Outside a `TestProvider`.
 */
export const useTestSession = (): TestSessionState => useHeld("useTestSession").state;

/**
 * Read the current item's view: the last one the server answered, a refusal's included. Before
 * the first view arrives it suspends, so a `Suspense` above it shows its fallback; a test that
 * finished before any item was shown has none, so read `useTestSession().finished` first.
 *
 * @returns The view.
 * @throws {NoTestProvider} Outside a `TestProvider`.
 */
export const useCurrentItem = (): ItemViewPayload => useShownView(useHeld("useCurrentItem"));

/**
 * Read the test's navigation: the current view's, as `navigationState` gave it. It suspends until
 * the first view arrives, as {@link useCurrentItem} does.
 *
 * @returns The navigation.
 * @throws {NoTestProvider} Outside a `TestProvider`.
 */
export const useNavigation = (): NavigationState =>
  useShownView(useHeld("useNavigation")).navigation;

/**
 * Read the time left on the tightest time limit in force, in milliseconds, as the last view gave
 * it: none while no view has arrived or no limit is in force.
 *
 * @returns The time left.
 * @throws {NoTestProvider} Outside a `TestProvider`.
 */
export const useTimer = (): TimerState => {
  const { view } = useHeld("useTimer").state;

  return view?.timeLeft === undefined ? {} : { timeLeft: view.timeLeft };
};

/**
 * Get the function that posts an intent with the current item's form: it posts through the
 * transport, marks the session `pending` until the server answers, then shows the answer and
 * resolves with it.
 *
 * @returns The submit function.
 * @throws {NoTestProvider} Outside a `TestProvider`.
 */
export const useSubmit = (): Submit => useHeld("useSubmit").submit;

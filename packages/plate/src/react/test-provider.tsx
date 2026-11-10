/**
 * The test layer over plate's pieces: `TestProvider` holds a test session reached through a
 * `TestTransport`, and its hooks read it; `fetchTransport` is the transport that speaks the wire
 * `createTestServer` answers. Every body is a stub that throws {@link NotImplemented} naming issue
 * m3g-06, which fills them; the server side, `createTestServer`, is typed in
 * `#plate/react/contract.tsx` and lands with the same issue. {@link NoTestProvider} is the failure
 * every hook throws outside a provider once m3g-06 fills them.
 *
 * @module
 */
import { Data } from "effect";
import type { ReactNode } from "react";
import type {
  ItemViewPayload,
  Submit,
  TestProviderProps,
  TestSessionState,
  TestTransport,
  TimerState,
} from "#plate/react/contract.tsx";
import type { NavigationState } from "#plate/navigation.ts";
import { markStub } from "#plate/react/parts.tsx";

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
 * Throw for a piece issue m3g-06 fills.
 *
 * @param piece The piece's name.
 * @returns Nothing: it always throws.
 * @throws {NotImplemented} Always, naming the piece and m3g-06.
 */
const notImplemented = (piece: string): never => {
  throw new NotImplemented({ issue: "m3g-06", piece });
};

/**
 * Reject for a request of a transport issue m3g-06 fills: the asynchronous form of
 * {@link notImplemented}, since a transport's requests fail by rejecting, never by throwing.
 *
 * @param piece The piece's name, such as `fetchTransport.view`.
 * @returns A promise that rejects with {@link NotImplemented} naming the piece and m3g-06.
 */
const rejectNotImplemented = <A,>(piece: string): Promise<A> =>
  Promise.reject(new NotImplemented({ issue: "m3g-06", piece }));

/**
 * A hook of the test layer called outside a `TestProvider`: the hook has no session to read. Every
 * hook throws it when no provider is mounted above the component that calls it; issue m3g-06
 * makes the hooks throw it. It is thrown, since React reports a component's failure only by a
 * throw, which an error boundary catches.
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
 * Make the transport that speaks `createTestServer`'s wire over `fetch`, to the URL the server is
 * mounted at: a stub whose requests reject. Issue m3g-06 fills it.
 *
 * @param _url The URL the test server answers at, which the requests go to.
 * @returns A transport whose `view` and `post` reject with {@link NotImplemented} naming m3g-06.
 */
export const fetchTransport = (_url: string): TestTransport => ({
  post: () => rejectNotImplemented("fetchTransport.post"),
  view: () => rejectNotImplemented("fetchTransport.view"),
});

/**
 * Hold a test session reached through a transport, for the hooks below: a stub, marked
 * (`markStub`). Issue m3g-06 fills it.
 *
 * @param props The transport and the children.
 * @returns Nothing: it throws when it mounts.
 * @throws {NotImplemented} When it mounts, naming m3g-06.
 */
export const TestProvider = markStub((_props: TestProviderProps): ReactNode =>
  notImplemented("TestProvider"),
);

/**
 * Read the test session `TestProvider` holds: a stub. Issue m3g-06 fills it.
 *
 * @returns Nothing: it throws.
 * @throws {NotImplemented} Always, naming m3g-06.
 */
export const useTestSession = (): TestSessionState => notImplemented("useTestSession");

/**
 * Read the current item's view: a stub. Issue m3g-06 fills it.
 *
 * @returns Nothing: it throws.
 * @throws {NotImplemented} Always, naming m3g-06.
 */
export const useCurrentItem = (): ItemViewPayload => notImplemented("useCurrentItem");

/**
 * Read the test's navigation: a stub. Issue m3g-06 fills it.
 *
 * @returns Nothing: it throws.
 * @throws {NotImplemented} Always, naming m3g-06.
 */
export const useNavigation = (): NavigationState => notImplemented("useNavigation");

/**
 * Read the time left on the tightest time limit in force: a stub. Issue m3g-06 fills it.
 *
 * @returns Nothing: it throws.
 * @throws {NotImplemented} Always, naming m3g-06.
 */
export const useTimer = (): TimerState => notImplemented("useTimer");

/**
 * Get the function that posts an intent with the current item's form: a stub. Issue m3g-06 fills
 * it.
 *
 * @returns Nothing: it throws.
 * @throws {NotImplemented} Always, naming m3g-06.
 */
export const useSubmit = (): Submit => notImplemented("useSubmit");

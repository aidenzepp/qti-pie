/**
 * The test layer over plate's pieces: `TestProvider` holds a test session reached through a
 * `TestTransport`, and its hooks read it. Every body is a stub that throws
 * {@link NotImplemented} naming issue m3g-06, which fills them; the server side,
 * `createTestServer`, is typed in `#plate/react/contract.tsx` and lands with the same issue.
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
  TimerState,
} from "#plate/react/contract.tsx";
import type { NavigationState } from "#plate/navigation.ts";

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
 * Hold a test session reached through a transport, for the hooks below: a stub. Issue m3g-06 fills
 * it.
 *
 * @param props The transport and the children.
 * @returns Nothing: it throws when it mounts.
 * @throws {NotImplemented} When it mounts, naming m3g-06.
 */
export const TestProvider = (_props: TestProviderProps): ReactNode =>
  notImplemented("TestProvider");

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

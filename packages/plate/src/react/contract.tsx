/**
 * The React layer's contract (`./react`, decision D6): the props, part overrides, hooks and test
 * transport every React piece of plate is typed by. It holds types only; the pieces beside it give
 * their bodies, most of them still stubs, each naming the issue that fills it.
 *
 * The layer is a projection, not a second emitter (OD-8, the composition ruling `a9d04969`): a
 * React piece calls the same part functions `render` calls and projects the neutral tree
 * (`#plate/emit/node.ts`) through {@link UseParts}, so the markers (`data-slot`), ids and names a
 * React page holds are the ones plate's HTML holds. The browser never holds the accepted item: a
 * page receives the redacted item, as {@link ItemViewPayload} carries it.
 *
 * @module
 */
import type { ReactNode, RefObject } from "react";
import type { RedactedJson } from "#plate/codec/redacted.ts";
import type { StoredTestSession } from "#plate/codec/session.ts";
import type { Configuration } from "#plate/configuration.ts";
import type { StatusInput } from "#plate/emit/item.ts";
import type { Node } from "#plate/emit/node.ts";
import type { InteractionKey, PartOf } from "#plate/emit/parts.ts";
import type { ResponseValue } from "#plate/model/values.ts";
import type { NavigationPart, NavigationState } from "#plate/navigation.ts";
import type { Accepted, AcceptedTest } from "#plate/validate/verdict.ts";
import type { Redacted } from "#plate/payload.ts";
import type { Options } from "#plate/render.ts";
import type { Intent } from "#plate/session/session.ts";

/**
 * The props a replacement part receives: the attributes the part's interaction computed, in
 * React's spelling (`className`, `htmlFor`), and the part's children.
 *
 * The swap invariant (I1 to I4 of `fb4fe744` S2) holds for a React replacement as it holds for a
 * part function: the attributes the emitter requires (the marker, ids, names, the ARIA it computed)
 * win over the replacement's own (I1); the children are rendered exactly once, in the order given
 * (I2); the replacement's root stays within the part's tag class (I3); and its one root carries the
 * props (I4). Issue m3g-01 enforces them.
 */
export type PartProps = Readonly<Record<string, string | true>> & {
  readonly children?: ReactNode;
};

/**
 * A replacement for one part: a component that receives the part's {@link PartProps} and renders
 * exactly one element. Issue m3g-01 applies it.
 */
export type PartComponent = (props: PartProps) => ReactNode;

/**
 * The replacements for the parts of one interaction, or of the item or test chrome, keyed by part,
 * so a part key that `I` has no row for does not type-check.
 */
export type InteractionParts<I extends InteractionKey> = {
  readonly [P in PartOf<I>]?: PartComponent;
};

/**
 * The React part overrides: keyed by {@link InteractionKey}, then by part key, as the core's
 * `parts` option is, with a {@link PartComponent} in place of each part function, such as
 * `parts["choice-interaction"].indicator`. Issue m3g-01 applies them.
 */
export type PartOverrides = {
  readonly [I in InteractionKey]?: InteractionParts<I>;
};

/**
 * The props of `Item`: what `render` takes, with the parts as React components and a callback for
 * a changed response. Issue m3g-01 fills `Item`'s body.
 */
export interface ItemProps {
  /**
   * A class for the item's root, merged with the classes plate writes.
   */
  readonly className?: string;
  /**
   * The configuration `render` takes.
   */
  readonly configuration: Configuration;
  /**
   * Called with a response's identifier and its new value whenever the candidate changes it.
   */
  readonly onValueChange?: (responseIdentifier: string, value: ResponseValue) => void;
  /**
   * `render`'s options but its `parts`, which {@link ItemProps.parts} gives as components.
   */
  readonly options?: Omit<Options, "parts">;
  /**
   * The part replacements, as React components.
   */
  readonly parts?: PartOverrides;
  /**
   * The item, as `redact` made it or `decodeRedacted` decoded it.
   */
  readonly redacted: Redacted;
}

/**
 * The state props every interaction's root takes (the composition ruling `a9d04969`): uncontrolled
 * through `defaultValue`, controlled through `value` with `onValueChange`, as React's own form
 * controls are. Issue m3g-01 fills them for the shipped interactions.
 *
 * @template V The response's value.
 */
export interface InteractionStateProps<V = ResponseValue> {
  /**
   * Whether the interaction's controls are disabled.
   */
  readonly disabled?: boolean;
  /**
   * The response's value when the interaction mounts, when it is uncontrolled.
   */
  readonly defaultValue?: V;
  /**
   * The form entry name; by default the one `render` writes, `<instance>.<responseIdentifier>`.
   */
  readonly name?: string;
  /**
   * Called with the response's new value whenever the candidate changes it.
   */
  readonly onValueChange?: (value: V) => void;
  /**
   * The response's value, when the interaction is controlled.
   */
  readonly value?: V;
}

/**
 * The props of one interaction's component, such as `<Choice>`: its state props, the response it
 * renders and the replacements for its own parts. Issues m3g-02 (the shipped interactions), m3g-03
 * (M3.d's) and m3g-04 (the elective ones) fill the components.
 *
 * @template I The interaction's key, such as `choice-interaction`.
 */
export interface InteractionProps<I extends InteractionKey> extends InteractionStateProps {
  /**
   * A class for the interaction's root, merged with the classes plate writes.
   */
  readonly className?: string;
  /**
   * The replacements for this interaction's parts.
   */
  readonly parts?: InteractionParts<I>;
  /**
   * The identifier of the response the interaction is bound to, which picks it out of the item.
   */
  readonly responseIdentifier: string;
}

/**
 * One interaction's component.
 *
 * @template I The interaction's key.
 */
export type InteractionComponent<I extends InteractionKey> = (
  props: InteractionProps<I>,
) => ReactNode;

/**
 * The props of `Status`: what `renderStatus` takes. Issue m3g-02 fills `Status`'s body.
 */
export interface StatusProps {
  readonly className?: string;
  readonly configuration: Configuration;
  /**
   * The status region's state, as `renderStatus` takes it.
   */
  readonly input: StatusInput;
  readonly parts?: InteractionParts<"item">;
}

/**
 * The props of `Navigation`: what `renderNavigation` takes, and a callback for the intent a button
 * asks for. Issue m3g-02 fills `Navigation`'s body.
 */
export interface NavigationProps {
  readonly className?: string;
  readonly configuration: Configuration;
  /**
   * Called with a button's intent when the candidate presses it.
   */
  readonly onIntent?: (intent: Intent) => void;
  /**
   * The parts the root holds, in order, as `renderNavigation`'s `order` lists them.
   */
  readonly order?: readonly NavigationPart[];
  readonly parts?: InteractionParts<"test-navigation">;
  /**
   * The navigation, as `navigationState` gives it.
   */
  readonly state: NavigationState;
}

/**
 * Project a node of the neutral tree to React: each element to the element of its tag, with its
 * attributes in React's spelling, each text to its characters. The type of `useParts`.
 */
export type UseParts = (node: Node) => ReactNode;

/**
 * Upgrade the rendered interactions under an element: call the runtime's `upgrade` on it when it
 * mounts and the teardown when it unmounts. The type of `useUpgrade`; issue m3g-01 owns it.
 */
export type UseUpgrade = (ref: RefObject<HTMLElement | null>) => void;

/**
 * What the server helper sends a page for the current item: serialisable, so it crosses a fetch,
 * and holding no accepted item, record or correct response. Issue m3g-06 fills it.
 */
export interface ItemViewPayload {
  readonly configuration: Configuration;
  /**
   * The item instance key the item is rendered with.
   */
  readonly instance: string;
  /**
   * The navigation, as `navigationState` gives it.
   */
  readonly navigation: NavigationState;
  /**
   * The redacted item, encoded as `encodeRedacted` writes it.
   */
  readonly redacted: RedactedJson;
  /**
   * The status region's state, when the last step gave one.
   */
  readonly status?: StatusInput;
  /**
   * The milliseconds left on the tightest time limit in force, when one is.
   */
  readonly timeLeft?: number;
}

/**
 * What the server helper answers a post with: the view to show next, or the test's end. Issue
 * m3g-06 fills it.
 */
export type Posted =
  | { readonly kind: "finished" }
  | { readonly kind: "view"; readonly view: ItemViewPayload };

/**
 * How `TestProvider` reaches the server helper: a page asks for the current view and posts an
 * intent with the item's form. Issue m3g-06 fills it.
 */
export interface TestTransport {
  /**
   * Post an intent and the current item's form data.
   *
   * @param intent The intent the candidate asked for.
   * @param form The current item's form, as the browser encodes it.
   * @returns What the server answered.
   */
  readonly post: (intent: Intent, form: FormData) => Promise<Posted>;
  /**
   * Fetch the current view.
   *
   * @returns The current item's view.
   */
  readonly view: () => Promise<ItemViewPayload>;
}

/**
 * The props of `TestProvider`. Issue m3g-06 fills it.
 */
export interface TestProviderProps {
  readonly children?: ReactNode;
  readonly transport: TestTransport;
}

/**
 * What `useTestSession` gives: whether a view is loading, the last view, and the test's end. Issue
 * m3g-06 fills it.
 */
export interface TestSessionState {
  readonly finished: boolean;
  readonly pending: boolean;
  readonly view?: ItemViewPayload;
}

/**
 * What `useTimer` gives: the milliseconds left, when a time limit is in force. Issue m3g-06 fills
 * it.
 */
export interface TimerState {
  readonly timeLeft?: number;
}

/**
 * What `useSubmit` gives: a function that posts an intent with the current item's form. Issue
 * m3g-06 fills it.
 */
export type Submit = (intent: Intent, form: FormData) => Promise<Posted>;

/**
 * Where the server helper keeps sessions between requests: the host's store, keyed by a session
 * id the host chooses. Issue m3g-06 fills its use.
 */
export interface TestSessionStore {
  /**
   * Read a stored session.
   *
   * @param id The session's id.
   * @returns The stored session, or undefined when there is none.
   */
  readonly load: (id: string) => Promise<StoredTestSession | undefined>;
  /**
   * Store a session.
   *
   * @param id The session's id.
   * @param session The session, encoded as `encodeSession` writes it.
   */
  readonly save: (id: string, session: StoredTestSession) => Promise<void>;
}

/**
 * What `createTestServer` takes: the accepted test and items, the configuration, and the host's
 * session store. It runs on the server only, since the accepted test and items never reach a page.
 * Issue m3g-06 fills it.
 */
export interface TestServerOptions {
  readonly configuration: Configuration;
  /**
   * The test's items, keyed by item ref identifier, as `startTest` takes them.
   */
  readonly items: ReadonlyMap<string, Accepted>;
  readonly store: TestSessionStore;
  readonly test: AcceptedTest;
}

/**
 * Make the server side of `TestProvider`'s transport: a Fetch handler over `startTest`,
 * `itemView`, `advance` and `results`, answering {@link TestTransport}'s requests. The type of
 * `createTestServer`; issue m3g-06 fills it.
 */
export type CreateTestServer = (
  options: TestServerOptions,
) => (request: Request) => Promise<Response>;

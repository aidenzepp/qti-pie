/**
 * The protocol between a Portable Custom Interaction's (Q-16) frame host and its frame (issue
 * pci-04): the data the page writes into the frame's `srcdoc`, and the messages the two exchange
 * through `postMessage`. Types only: the page side (`frame-host.dom.ts`) and the frame side
 * (`frame-boot.dom.ts`) both read it by `import type`, so a page loads nothing for it.
 *
 * Every message carries the frame's `nonce`, the random string the host drew for that frame and
 * wrote into its `srcdoc`. The page accepts a message only from that frame's `contentWindow` and
 * with that nonce; the frame accepts one only from its parent window with that nonce. The frame's
 * origin is opaque (`sandbox="allow-scripts"`, never `allow-same-origin`), so neither side can
 * name the other's origin and both post with the target origin `"*"`: the nonce and the source
 * check are the whole of the trust.
 *
 * What a PCI gives the host is opaque to it by the PCI contract: its `state` is whatever the PCI
 * wants back, and its response and change values are the Appendix C JSON binding, which issue
 * pci-05 reads with `fromPciJson`. Those fields are `unknown` here on purpose, and travel as the
 * structured clone `postMessage` makes of them.
 *
 * @module
 */

/**
 * A JSON value, as the Appendix C binding of a variable's value is one: what the page hands a
 * PCI for its template and context variables.
 */
export type PciJsonValue =
  | boolean
  | number
  | string
  | null
  | readonly PciJsonValue[]
  | PciJsonObject;

/**
 * A JSON object: the values of a PCI's template or context variables, by identifier.
 */
export interface PciJsonObject {
  readonly [key: string]: PciJsonValue;
}

/**
 * The configuration the page computes for a PCI, as the bridge in the frame hands it to
 * `getInstance` with its own `onready` and `ondone` added: the element's `data-*` properties by
 * dataset name, the response identifier, the status (`interacting`, `review` or `solution` as
 * the render mode gives it), and the template and context variables' values by identifier.
 *
 * A stated limit of issue pci-04: the root carries the variables' identifiers only, so both
 * variable objects are empty until the issue that reads their values lands. No `boundTo`: issue
 * pci-05 adds the response's value by state.
 */
export interface PciFrameConfiguration {
  readonly contextVariables: PciJsonObject;
  readonly properties: Readonly<Record<string, string>>;
  readonly responseIdentifier: string;
  readonly status: string;
  readonly templateVariables: PciJsonObject;
}

/**
 * One module route as the host resolved it (issue pci-01's rules) and wrote it into
 * `data-pci-routes`: the module id, its primary and fallback locations as absolute URLs ending
 * `.js` (each absent when the module has none), and the seconds the loader waits for each
 * before it gives up, 0 for no limit. The frame tries `primary` first and `fallback` after a
 * timeout or a fatal error; a route with no `fallback` has no second chance.
 */
export interface PciFrameRoute {
  readonly fallback?: string;
  readonly id: string;
  readonly primary?: string;
  readonly waitSeconds: { readonly fallback: number; readonly primary: number };
}

/**
 * The data the page writes into the frame's `srcdoc` as a `<script type="application/json">`
 * data block, which no policy executes and the frame boot reads: the frame's nonce, the routes
 * to load, and the entry module's id when the PCI names one, which loads first. Without an entry
 * every route loads and the one module that registers is the factory.
 */
export interface PciFrameBoot {
  readonly entry?: string;
  readonly nonce: string;
  readonly routes: readonly PciFrameRoute[];
}

/**
 * The frame's first word: the boot ran, read its data block and is loading the routes.
 */
export interface FrameBooted {
  readonly kind: "booted";
  readonly nonce: string;
}

/**
 * Every route loaded and the modules ran: the `typeIdentifier` of every factory they registered
 * with the bridge, in registration order. The page chooses among them (`factoryFor`, issue
 * pci-01) and answers with {@link PageInstantiate}.
 */
export interface FrameRegistered {
  readonly kind: "registered";
  readonly nonce: string;
  readonly typeIdentifiers: readonly string[];
}

/**
 * The PCI called `onready`: it is rendered into its `dom`, with the state it reported.
 */
export interface FrameReady {
  readonly kind: "ready";
  readonly nonce: string;
  readonly state: unknown;
}

/**
 * The PCI fired `qti-interaction-changed` at its `dom`: the value is the event's `detail.value`
 * when it carries one, else the PCI's `getResponse()`; `valid` is the detail's, or `undefined`
 * when it carries none.
 */
export interface FrameChanged {
  readonly kind: "changed";
  readonly nonce: string;
  readonly responseIdentifier: string;
  readonly valid: boolean | undefined;
  readonly value: unknown;
}

/**
 * The PCI called `ondone`, with the response, the state and the status it gave (`undefined` when
 * it gave none).
 */
export interface FrameDone {
  readonly kind: "done";
  readonly nonce: string;
  readonly response: unknown;
  readonly state: unknown;
  readonly status: string | undefined;
}

/**
 * The frame answered {@link PageComplete}: it called `getResponse()`, then `getState()`, then
 * `oncompleted()` when the PCI has one, in that order, and these are the two values. The page
 * removes the frame when this arrives.
 */
export interface FrameCompleted {
  readonly kind: "completed";
  readonly nonce: string;
  readonly response: unknown;
  readonly state: unknown;
}

/**
 * The frame's content changed height: the whole pixels its document's root element now takes,
 * which the page writes as the frame's `height` attribute.
 */
export interface FrameHeight {
  readonly kind: "height";
  readonly nonce: string;
  readonly pixels: number;
}

/**
 * The frame cannot serve the PCI: a route exhausted its locations, a module named a dependency no
 * route defines, no factory served the type identifier the page chose, or a script threw. The
 * reason is one English sentence for the page's host to log; the page shows the Notice again.
 */
export interface FrameFailed {
  readonly kind: "failed";
  readonly nonce: string;
  readonly reason: string;
}

/**
 * Every message the frame posts to the page.
 */
export type FrameToPage =
  | FrameBooted
  | FrameChanged
  | FrameCompleted
  | FrameDone
  | FrameFailed
  | FrameHeight
  | FrameReady
  | FrameRegistered;

/**
 * The page chose a factory: instantiate the PCI through the bridge with this type identifier,
 * this configuration, and this state, `undefined` (never `null`) when there is none to restore.
 */
export interface PageInstantiate {
  readonly configuration: PciFrameConfiguration;
  readonly kind: "instantiate";
  readonly nonce: string;
  readonly state: unknown;
  readonly typeIdentifier: string;
}

/**
 * The page is about to remove the frame: run the PCI's completion and answer with
 * {@link FrameCompleted}.
 */
export interface PageComplete {
  readonly kind: "complete";
  readonly nonce: string;
}

/**
 * Every message the page posts to the frame.
 */
export type PageToFrame = PageComplete | PageInstantiate;

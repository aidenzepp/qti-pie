/**
 * The browser runtime's contract (D1): how a page's rendered items gain the behaviour their HTML
 * alone cannot give, without the runtime ever building markup.
 *
 * - No custom element is ever registered. The SSR's roots are native elements already (a `fieldset`,
 *   a `span`), so there is no global name, no collision and no `is=`.
 * - The runtime finds an interaction's root by its `data-slot` marker, `<kind>-interaction` (the
 *   `<component>` spelling `emit/parts.ts` gives a Root), and attaches the one {@link Controller}
 *   its kind has in a closed {@link Registry}: delegation by kind, not extensible by a host.
 * - A content module that needs script owns a {@link ContentController} the same way: the runtime
 *   finds its root by the module's slot, `data-slot="<slot>"` ({@link contentRuntimeSlots}), and
 *   attaches the one controller that slot has in the registry's `content` map.
 * - Upgrading never calls `focus()` and never moves focus; a controller acts only on the user's
 *   input.
 * - Every announcement goes through the item's live region ({@link LiveRegion}, the item chrome's
 *   `live` part), never through a region a controller creates.
 *
 * @module
 */
import { liveRegionOf } from "#plate/runtime/announce.dom.ts";
import type { LiveRegion } from "#plate/runtime/announce.dom.ts";

export type { LiveRegion } from "#plate/runtime/announce.dom.ts";

/**
 * The interaction kinds that have a runtime: the kinds whose response a native control cannot give
 * alone. Slider, Upload and End Attempt are absent, since their native controls are the whole of
 * their behaviour (D3).
 */
export const runtimeKinds = [
  "associate",
  "drawing",
  "gap-match",
  "graphic-associate",
  "graphic-gap-match",
  "graphic-order",
  "hotspot",
  "hottext",
  "match",
  "media",
  "order",
  "portable-custom",
  "position-object",
  "select-point",
] as const;

/**
 * An interaction kind that has a runtime, as {@link runtimeKinds} lists it.
 */
export type RuntimeKind = (typeof runtimeKinds)[number];

/**
 * Undo an upgrade: remove every listener, observer and node the controller added, leaving the root
 * as the SSR wrote it but for the hidden inputs that carry the response.
 */
export type Teardown = () => void;

/**
 * The behaviour of one interaction kind in the page.
 *
 * @template K The kind it upgrades.
 */
export interface Controller<K extends RuntimeKind = RuntimeKind> {
  readonly kind: K;

  /**
   * Whether the controller gives the kind its behaviour. A stub declares `false` and marks its root
   * `data-runtime="stub"`; the issue that fills a kind flips this to `true` and drops the mark, and
   * the registry tests then expect only what every controller promises: a teardown that removes
   * what the upgrade added, no focus moved, nothing announced.
   */
  readonly implemented: boolean;

  /**
   * Attach the kind's behaviour to one rendered interaction, without moving focus.
   *
   * A root may lack the parts the SSR would write (no choices, no gaps, no entry name, no image),
   * and the upgrade tolerates it: it attaches nothing to a missing part, moves no focus, announces
   * nothing, and still returns a teardown that undoes what it did. The shared runtime tests run the
   * page's registry over such bare roots.
   *
   * @param root The interaction's root, `data-slot="<kind>-interaction"`.
   * @param live The live region of the item the root sits in, the only place it announces.
   * @returns The teardown that undoes the upgrade.
   */
  readonly upgrade: (root: HTMLElement, live: LiveRegion) => Teardown;
}

/**
 * The slots of the content modules that have a browser runtime: the content whose behaviour its
 * native element cannot give alone, such as a modal feedback's dialog returning focus. A slot is
 * the `data-slot` value of the content's root, which the module's render writes.
 */
export const contentRuntimeSlots = ["modal-feedback"] as const;

/**
 * A content slot that has a runtime, as {@link contentRuntimeSlots} lists it.
 */
export type ContentSlot = (typeof contentRuntimeSlots)[number];

/**
 * The behaviour of one content module in the page: what a native element cannot give alone, such
 * as the focus a modal feedback's dialog takes and returns.
 *
 * It follows the contract's decision D1 as {@link Controller} does: no custom element is
 * registered, and the controller upgrades the root the server rendered, found by its slot, never
 * building markup. `m5-01`, modal feedback, is the first content module to give a slot a
 * controller.
 *
 * @template S The slot it upgrades.
 */
export interface ContentController<S extends ContentSlot = ContentSlot> {
  readonly slot: S;

  /**
   * Whether the controller gives the slot its behaviour. A stub declares `false` and marks its
   * root `data-runtime="stub"`; the issue that fills a slot flips this to `true` and drops the
   * mark, as an interaction's does.
   */
  readonly implemented: boolean;

  /**
   * Attach the slot's behaviour to one rendered content root, without moving focus.
   *
   * A root may lack the parts the server would write, and the upgrade tolerates it: it attaches
   * nothing to a missing part, moves no focus, announces nothing, and still returns a teardown that
   * undoes what it did.
   *
   * @param root The content's root, `data-slot="<slot>"`.
   * @param live The live region of the item the root sits in, the only place it announces.
   * @returns The teardown that undoes the upgrade.
   */
  readonly upgrade: (root: HTMLElement, live: LiveRegion) => Teardown;
}

/**
 * The closed registry: at most one controller per runtime kind, keyed by the kind it upgrades, and
 * at most one per content slot in its `content` map, keyed by the slot. A kind or slot without one
 * stays as the SSR rendered it.
 */
export type Registry = { readonly [K in RuntimeKind]?: Controller<K> } & {
  readonly content?: { readonly [S in ContentSlot]?: ContentController<S> };
};

/**
 * One root an upgrade attached a controller to: an interaction, reported with its kind, or a
 * content root, reported with its slot.
 */
export type UpgradedRoot =
  | { readonly kind: RuntimeKind; readonly root: HTMLElement }
  | { readonly root: HTMLElement; readonly slot: ContentSlot };

/**
 * What an upgrade did: the roots it attached a controller to, the interactions in document order
 * and then the content roots, and the one teardown that undoes them all.
 */
export interface Upgraded {
  readonly controllers: readonly UpgradedRoot[];

  /**
   * Undo every attachment of this upgrade, in reverse order. A second call does nothing.
   */
  readonly teardown: () => void;
}

/**
 * The selector of every interaction root the SSR writes: a `data-slot` ending `-interaction`, which
 * only a Root's marker does.
 */
export const interactionRootSelector = '[data-slot$="-interaction"]';

/**
 * The `data-slot` marker of the item chrome's Root.
 */
const itemSlot = "item";

/**
 * The suffix every interaction Root's marker ends with.
 */
const rootSuffix = "-interaction";

/**
 * Read the runtime kind an interaction root's marker names.
 *
 * @param slot The root's `data-slot` value.
 * @returns The kind, or `undefined` for a marker that names no runtime kind (a native interaction
 *   such as `choice-interaction`, or no interaction at all).
 */
export const runtimeKindOf = (slot: string | undefined): RuntimeKind | undefined => {
  if (slot === undefined || !slot.endsWith(rootSuffix)) {
    return undefined;
  }

  const kind = slot.slice(0, -rootSuffix.length);

  return runtimeKinds.find((runtimeKind) => runtimeKind === kind);
};

/**
 * The roots an upgrade has attached a controller to and not yet torn down, interactions and content
 * alike, so a second upgrade of the same page (a host's re-render, React's double effect) never
 * attaches twice.
 */
const attached = new WeakSet<HTMLElement>();

/**
 * List the roots in or at a node that match a selector, in document order.
 *
 * @param root The node to search: a document, a fragment, or an element, which is included when it
 *   itself matches.
 * @param selector The selector of the roots.
 * @returns The roots.
 */
const rootsMatching = (root: ParentNode, selector: string): readonly HTMLElement[] => [
  ...(root instanceof HTMLElement && root.matches(selector) ? [root] : []),
  ...root.querySelectorAll<HTMLElement>(selector),
];

/**
 * Give the live region of the item a root sits in.
 *
 * @param element The root.
 * @returns The region of the item that holds it, or of the root itself when no item does.
 */
const liveRegionAround = (element: HTMLElement): LiveRegion =>
  liveRegionOf(element.closest<HTMLElement>(`[data-slot="${itemSlot}"]`) ?? element);

/**
 * One controller an upgrade attached: the root it reports and the teardown that undoes it.
 */
interface Attachment {
  readonly reported: UpgradedRoot;
  readonly teardown: Teardown;
}

/**
 * Upgrade every interaction and content root under a node through a registry: each interaction root
 * whose kind has a controller, and each content root whose slot has one, and that no live upgrade
 * holds, gets that controller, given the live region of the item it sits in. The interaction roots
 * go first, in document order, then the content roots, by slot. Nothing else in the page changes,
 * and focus does not move.
 *
 * The page's entry binds this to its one closed registry; it takes the registry as an argument so
 * the walk is testable with a controller of the test's own.
 *
 * @param registry The controllers by kind, and by content slot in its `content` map.
 * @param root The node to upgrade under.
 * @returns The attached roots and their teardown.
 */
export const upgradeWith = (registry: Registry, root: ParentNode): Upgraded => {
  const interactions = rootsMatching(root, interactionRootSelector).flatMap(
    (element): readonly Attachment[] => {
      const kind = runtimeKindOf(element.dataset["slot"]);
      const controller = kind === undefined ? undefined : registry[kind];

      if (kind === undefined || controller === undefined || attached.has(element)) {
        return [];
      }

      const teardown = controller.upgrade(element, liveRegionAround(element));

      attached.add(element);

      return [{ reported: { kind, root: element }, teardown }];
    },
  );
  const contents = contentRuntimeSlots.flatMap((slot) =>
    rootsMatching(root, `[data-slot="${slot}"]`).flatMap((element): readonly Attachment[] => {
      const controller = registry.content?.[slot];

      if (controller === undefined || attached.has(element)) {
        return [];
      }

      const teardown = controller.upgrade(element, liveRegionAround(element));

      attached.add(element);

      return [{ reported: { root: element, slot }, teardown }];
    }),
  );
  const done = [...interactions, ...contents];
  let open = true;

  return {
    controllers: done.map(({ reported }) => reported),
    teardown: () => {
      if (!open) {
        return;
      }

      open = false;

      for (const { reported, teardown } of done.toReversed()) {
        teardown();
        attached.delete(reported.root);
      }
    },
  };
};

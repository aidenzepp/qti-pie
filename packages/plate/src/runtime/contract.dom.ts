/**
 * The browser runtime's contract (D1): how a page's rendered items gain the behaviour their HTML
 * alone cannot give, without the runtime ever building markup.
 *
 * - No custom element is ever registered. The SSR's roots are native elements already (a `fieldset`,
 *   a `span`), so there is no global name, no collision and no `is=`.
 * - The runtime finds an interaction's root by its `data-slot` marker, `<kind>-interaction` (the
 *   `<component>` spelling `emit/parts.ts` gives a Root), and attaches the one {@link Controller}
 *   its kind has in a closed {@link Registry}: delegation by kind, not extensible by a host.
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
   * @param root The interaction's root, `data-slot="<kind>-interaction"`.
   * @param live The live region of the item the root sits in, the only place it announces.
   * @returns The teardown that undoes the upgrade.
   */
  readonly upgrade: (root: HTMLElement, live: LiveRegion) => Teardown;
}

/**
 * The closed registry: at most one controller per runtime kind, keyed by the kind it upgrades. A
 * kind without one stays as the SSR rendered it.
 */
export type Registry = { readonly [K in RuntimeKind]?: Controller<K> };

/**
 * One interaction an upgrade attached a controller to.
 */
export interface UpgradedRoot {
  readonly kind: RuntimeKind;
  readonly root: HTMLElement;
}

/**
 * What an upgrade did: the interactions it attached a controller to, in document order, and the one
 * teardown that undoes them all.
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
 * The interaction roots an upgrade has attached a controller to and not yet torn down, so a second
 * upgrade of the same page (a host's re-render, React's double effect) never attaches twice.
 */
const attached = new WeakSet<HTMLElement>();

/**
 * List the interaction roots in or at a node, in document order.
 *
 * @param root The node to search: a document, a fragment, or an element, which is included when it
 *   is itself an interaction root.
 * @returns The roots.
 */
const interactionRoots = (root: ParentNode): readonly HTMLElement[] => [
  ...(root instanceof HTMLElement && root.matches(interactionRootSelector) ? [root] : []),
  ...root.querySelectorAll<HTMLElement>(interactionRootSelector),
];

/**
 * Upgrade every interaction under a node through a registry: each root whose kind has a controller,
 * and that no live upgrade holds, gets that controller, given the live region of the item it sits
 * in. Nothing else in the page changes, and focus does not move.
 *
 * The page's entry binds this to its one closed registry; it takes the registry as an argument so
 * the walk is testable with a controller of the test's own.
 *
 * @param registry The controllers by kind.
 * @param root The node to upgrade under.
 * @returns The attached interactions and their teardown.
 */
export const upgradeWith = (registry: Registry, root: ParentNode): Upgraded => {
  const done = interactionRoots(root).flatMap((element) => {
    const kind = runtimeKindOf(element.dataset["slot"]);
    const controller = kind === undefined ? undefined : registry[kind];

    if (kind === undefined || controller === undefined || attached.has(element)) {
      return [];
    }

    const item = element.closest<HTMLElement>(`[data-slot="${itemSlot}"]`) ?? element;
    const teardown = controller.upgrade(element, liveRegionOf(item));

    attached.add(element);

    return [{ kind, root: element, teardown }];
  });
  let open = true;

  return {
    controllers: done.map(({ kind, root: element }) => ({ kind, root: element })),
    teardown: () => {
      if (!open) {
        return;
      }

      open = false;

      for (const { root: element, teardown } of done.toReversed()) {
        teardown();
        attached.delete(element);
      }
    },
  };
};

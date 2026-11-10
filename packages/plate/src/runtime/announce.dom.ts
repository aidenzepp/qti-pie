/**
 * The live-region protocol: every announcement a runtime controller makes goes through its item's
 * live region, the item chrome's `live` part (`data-slot="item-live"`), which the SSR writes as a
 * status region, so the runtime never creates a region of its own and never moves focus to speak.
 *
 * @module
 */

/**
 * A place a controller speaks through: what it announces is read out by assistive technology
 * without moving focus.
 */
export interface LiveRegion {
  /**
   * Announce a text, replacing whatever the region last announced.
   *
   * @param text The text, in the item's language.
   */
  readonly announce: (text: string) => void;
}

/**
 * The live region of one rendered item, and whether the item carried one.
 *
 * `missing` is true when the item holds no `data-slot="item-live"` element (markup rendered before
 * the item chrome had a `live` part, or an embedder's swap that dropped it); such a region
 * announces nothing, so a controller works the same, silently.
 */
export interface ItemLiveRegion extends LiveRegion {
  readonly missing: boolean;
}

/**
 * The `data-slot` marker of the item chrome's `live` part, `<component>-<part>` as
 * `emit/parts.ts` derives it for the `item` component.
 */
export const liveSlot = "item-live";

/**
 * Do nothing: the announcement of a region the item does not carry.
 */
const announceNothing = (): void => undefined;

/**
 * The region an item without a `live` part has: it announces nothing and says it is missing.
 */
const missingRegion: ItemLiveRegion = { announce: announceNothing, missing: true };

/**
 * Find an item's live region and speak through it.
 *
 * An announcement clears the region's text, then writes the new text on the next animation frame,
 * so a text equal to the last one is still a change a screen reader reads out; a second
 * announcement before that frame replaces the first, which is never written.
 *
 * @param itemRoot The item's root (`data-slot="item"`), or any element holding its `live` part.
 * @returns The region of the first `data-slot="item-live"` element under the root, or a region that
 *   announces nothing, with `missing` set, when there is none.
 */
export const liveRegionOf = (itemRoot: HTMLElement): ItemLiveRegion => {
  const element = itemRoot.querySelector<HTMLElement>(`[data-slot="${liveSlot}"]`);

  if (element === null) {
    return missingRegion;
  }

  let pending: number | undefined;

  return {
    announce: (text) => {
      if (pending !== undefined) {
        cancelAnimationFrame(pending);
      }

      element.textContent = "";
      pending = requestAnimationFrame(() => {
        pending = undefined;
        element.textContent = text;
      });
    },
    missing: false,
  };
};

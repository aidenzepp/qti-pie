/**
 * The item Root's attribute hook, a stub: the item chrome asks it for the attributes the supports
 * and the view add to the Root, such as a magnification factor and the text and background
 * colours as CSS custom properties, which the sheet's `supports` block applies. It gives none
 * until issue m3e-09 fills it, so the Root is exactly what the chrome writes.
 *
 * @module
 */
import type { RootHook } from "#plate/content/contract.ts";

/**
 * The Root hook, a stub.
 */
export const rootHook: RootHook = {
  /**
   * No attribute: the Root carries only what the chrome writes until issue m3e-09 reads the
   * supports' display preferences.
   */
  attributes: () => ({}),
  /**
   * False: the hook is a stub until issue m3e-09 lands it.
   */
  implemented: false,
};

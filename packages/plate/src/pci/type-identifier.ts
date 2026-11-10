/**
 * The type-identifier rule of a portable custom interaction (issue pci-01, default R7):
 * {@link factoryFor} chooses, among the factories a PCI's modules register, the one that serves
 * the element's `custom-interaction-type-identifier`.
 *
 * A PCI module registers its factory under its own `typeIdentifier`, and the host asks for the
 * element's `custom-interaction-type-identifier`, which should match it. In the example corpus
 * three of the four items write an identifier that differs from the one their module registers
 * (hyphens for colons, a version segment, a stray letter), so a host that demanded an exact match
 * would render none of them. R7 settles it: an exact match wins; with no match and exactly one
 * registered factory, that factory serves, with the notice `pci-type-identifier` naming both
 * values; otherwise there is none.
 *
 * This module runs in the PCI frame (issue pci-04) and in the page, so it value-imports nothing:
 * no `effect`, no server module. It is plain TypeScript, as `runtime/announce.dom.ts` is.
 *
 * @module
 */

/**
 * Which registered factory serves a PCI element, by R7.
 *
 * `exact` is a factory registered under the element's own `custom-interaction-type-identifier`.
 * `only` is the one factory registered when none matches: `typeIdentifier` is what it registered
 * and `written` is the element's value, the two facts the notice `pci-type-identifier` carries.
 * `none` is no factory: nothing matched and the registered factories number zero or more than one.
 */
export type FactoryChoice =
  | { readonly kind: "exact"; readonly typeIdentifier: string }
  | { readonly kind: "none" }
  | { readonly kind: "only"; readonly typeIdentifier: string; readonly written: string };

/**
 * Choose the registered factory that serves a PCI element (R7).
 *
 * @param written The element's `custom-interaction-type-identifier`, as written.
 * @param registered The `typeIdentifier` of every factory the PCI's modules registered, in
 *   registration order.
 * @returns `exact` when one registered identifier equals `written`; else `only` when exactly one
 *   factory registered, that one; else `none`.
 */
export const factoryFor = (written: string, registered: readonly string[]): FactoryChoice => {
  if (registered.includes(written)) {
    return { kind: "exact", typeIdentifier: written };
  }

  const [only, ...rest] = registered;

  return only !== undefined && rest.length === 0
    ? { kind: "only", typeIdentifier: only, written }
    : { kind: "none" };
};

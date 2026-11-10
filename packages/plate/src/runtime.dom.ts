/**
 * The browser runtime's entry: `upgrade` gives a page's rendered items the behaviour their HTML
 * alone cannot, under the contract in `runtime/contract.dom.ts` (D1): no custom element, roots
 * found by their `data-slot` marker, one controller per kind from a closed registry, no focus
 * moved, and every announcement through the item's live region.
 *
 * It is plain TypeScript with no Effect value import, so the bundle a page loads carries no runtime
 * library.
 *
 * @module
 */
import { upgradeWith } from "#plate/runtime/contract.dom.ts";
import type { Registry, Upgraded } from "#plate/runtime/contract.dom.ts";

export type {
  Controller,
  LiveRegion,
  Registry,
  RuntimeKind,
  Teardown,
  Upgraded,
  UpgradedRoot,
} from "#plate/runtime/contract.dom.ts";

/**
 * The controllers the runtime attaches, by kind: closed, so a host cannot add one. No interaction's
 * controller has landed, so every kind stays as the SSR rendered it.
 */
const registry: Registry = {};

/**
 * Upgrade every rendered interaction under a node: attach its kind's controller to each interaction
 * root that has one and is not already upgraded, without building markup or moving focus.
 *
 * @example
 *   const upgraded = upgrade(); // every item in the document
 *   // later, before the item's markup is replaced:
 *   upgraded.teardown();
 *
 * @param root The node to upgrade under: the document, or one item's container.
 * @returns The interactions it attached a controller to, and their teardown.
 */
export const upgrade = (root: ParentNode = document): Upgraded => upgradeWith(registry, root);

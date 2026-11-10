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
import { controller as associate } from "#plate/interactions/associate.dom.ts";
import { controller as drawing } from "#plate/interactions/drawing.dom.ts";
import { controller as gapMatch } from "#plate/interactions/gap-match.dom.ts";
import { controller as graphicAssociate } from "#plate/interactions/graphic-associate.dom.ts";
import { controller as graphicGapMatch } from "#plate/interactions/graphic-gap-match.dom.ts";
import { controller as graphicOrder } from "#plate/interactions/graphic-order.dom.ts";
import { controller as hotspot } from "#plate/interactions/hotspot.dom.ts";
import { controller as hottext } from "#plate/interactions/hottext.dom.ts";
import { controller as match } from "#plate/interactions/match.dom.ts";
import { controller as media } from "#plate/interactions/media.dom.ts";
import { controller as order } from "#plate/interactions/order.dom.ts";
import { controller as portableCustom } from "#plate/interactions/portable-custom.dom.ts";
import { controller as positionObject } from "#plate/interactions/position-object.dom.ts";
import { controller as selectPoint } from "#plate/interactions/select-point.dom.ts";
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
 * The controllers the runtime attaches, by kind: closed, so a host cannot add one, and complete,
 * one controller for every runtime kind, each from its own module `interactions/<kind>.dom.ts`, so
 * an interaction's issue fills its module and never this table.
 */
const registry = {
  associate,
  drawing,
  "gap-match": gapMatch,
  "graphic-associate": graphicAssociate,
  "graphic-gap-match": graphicGapMatch,
  "graphic-order": graphicOrder,
  hotspot,
  hottext,
  match,
  media,
  order,
  "portable-custom": portableCustom,
  "position-object": positionObject,
  "select-point": selectPoint,
} satisfies Required<Registry>;

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

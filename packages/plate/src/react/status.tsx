/**
 * The item's status region, rendered as React: the tree `statusTree` builds, projected.
 *
 * @module
 */
import { Result } from "effect";
import { useMemo } from "react";
import type { ReactNode } from "react";
import { h } from "#plate/emit/node.ts";
import type { Element } from "#plate/emit/node.ts";
import { resolveOverrides } from "#plate/emit/parts.ts";
import type { PartOverrides, StatusProps } from "#plate/react/contract.tsx";
import { project } from "#plate/react/interaction.tsx";
import type { Projection } from "#plate/react/interaction.tsx";
import { statusTree } from "#plate/render.ts";

/**
 * The part replacements of a Status given none, one object so the memoised projection keeps its
 * identity.
 */
const noParts: PartOverrides = {};

/**
 * The placements of a Status, which holds no interaction root.
 */
const noPlacements: Projection["placements"] = new Map();

/**
 * A part function that stands for a React replacement while its key is checked, never called.
 *
 * @returns Nothing: it is never called.
 */
const keyOnly = (): Element => h("div", {});

/**
 * Check a Status's React part replacements' keys against the part table, as `renderStatus` checks
 * its own, and give them as the projection takes them.
 *
 * @param parts The replacements, none by default.
 * @returns The replacements, keyed by the interaction they belong to.
 * @throws {UnknownPart} For the first part the part table lacks for the item chrome, as
 *   `resolveOverrides` returns it; React reports a component's failure by a throw.
 */
const checkedParts = (parts: StatusProps["parts"]): PartOverrides => {
  if (parts === undefined) {
    return noParts;
  }

  Result.getOrThrow(
    resolveOverrides({
      item: Object.fromEntries(Object.keys(parts).map((part) => [part, keyOnly])),
    }),
  );

  return { item: parts };
};

/**
 * The status region (m3g-02), a chrome component: the region `renderStatus` writes for a state the
 * author gives, with its heading and what it shows, projected to React.
 *
 * It builds the region through `statusTree`, the tree `renderStatus` serialises, so its markers,
 * ids, `role="status"` and text are `renderStatus`'s HTML's (one emitter, a React projection). The
 * region is the page's one status region (WCAG 4.1.3): the author places one. It writes no form
 * and moves no focus, so it leaves off the `autofocus` `renderStatus` writes after a refused
 * post. A part `parts` replaces renders through its React component under the swap invariant, and
 * `className` is merged onto the region's classes. A refusal of `statusTree`, a part key the part
 * table lacks, or a replacement that breaks the swap invariant is thrown as the core's own error,
 * as `Item` throws it, since React reports a component's failure by a throw.
 *
 * @example
 *   <Status configuration={configuration} input={{ heading: "scored", instance: "q1", score: "1" }} />;
 *
 * @param props The status input, the configuration `renderStatus` takes, the part replacements and
 *   a class for the root.
 * @param props.className A class merged onto the region's classes.
 * @param props.configuration The configuration, which gives the locale and the heading level.
 * @param props.input The region's state, as `renderStatus` takes it.
 * @param props.parts The replacements for the item chrome's parts, such as `statusHeading`.
 * @returns The status region, projected.
 * @throws {InvalidInstance
 *   | InvalidHeadingLevel
 *   | PartSwapRefused}
 *   The first refusal `statusTree` gives.
 * @throws {UnknownPart} For a part `props.parts` names that the item chrome lacks.
 * @see {@link statusTree}
 * @see https://www.w3.org/TR/WCAG22/#status-messages
 */
export const Status = ({ className, configuration, input, parts }: StatusProps): ReactNode => {
  const replacements = useMemo(() => checkedParts(parts), [parts]);
  const { root } = useMemo(
    () => Result.getOrThrow(statusTree(input, configuration)),
    [configuration, input],
  );

  return project(root, {
    host: { className, ref: null, root },
    parts: replacements,
    placements: noPlacements,
  });
};

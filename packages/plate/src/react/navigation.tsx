/**
 * The test navigation, rendered as React: the tree `emitNavigation` builds, projected, with a
 * callback for the intent a pressed button asks for.
 *
 * @module
 */
import { Option, Result } from "effect";
import { useLayoutEffect, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import { emitNavigation } from "#plate/emit/navigation.ts";
import { h } from "#plate/emit/node.ts";
import type { Element } from "#plate/emit/node.ts";
import { resolveOverrides } from "#plate/emit/parts.ts";
import { decodeIntent, intentName } from "#plate/form/intent.ts";
import type { NavigationProps, PartOverrides } from "#plate/react/contract.tsx";
import { project } from "#plate/react/interaction.tsx";
import type { Projection } from "#plate/react/interaction.tsx";
import type { Intent } from "#plate/session/session.ts";

/**
 * The part replacements of a Navigation given none, one object so the memoised projection keeps
 * its identity.
 */
const noParts: PartOverrides = {};

/**
 * The placements of a Navigation, which holds no interaction root.
 */
const noPlacements: Projection["placements"] = new Map();

/**
 * The instance token a button's `data-intent` is decoded under: `decodeIntent` reads the one entry
 * named for a session, and a button holds no session, so any valid token names it.
 */
const token = "navigation";

/**
 * A part function that stands for a React replacement while its key is checked, never called.
 *
 * @returns Nothing: it is never called.
 */
const keyOnly = (): Element => h("div", {});

/**
 * Check a Navigation's React part replacements' keys against the part table, as
 * `renderNavigation` checks its own, and give them as the projection takes them.
 *
 * @param parts The replacements, none by default.
 * @returns The replacements, keyed by the component they belong to.
 * @throws {UnknownPart} For the first part the part table lacks for the test navigation, as
 *   `resolveOverrides` returns it; React reports a component's failure by a throw.
 */
const checkedParts = (parts: NavigationProps["parts"]): PartOverrides => {
  if (parts === undefined) {
    return noParts;
  }

  Result.getOrThrow(
    resolveOverrides({
      "test-navigation": Object.fromEntries(Object.keys(parts).map((part) => [part, keyOnly])),
    }),
  );

  return { "test-navigation": parts };
};

/**
 * Read the intent a pressed element asks for: the `data-intent` of the enabled button the press
 * landed on, which `encodeIntent` wrote and `decodeIntent` reads back.
 *
 * @param root The navigation's root, which the button must stand in.
 * @param target The element the press landed on.
 * @returns The button's intent, or none when the press landed on no button, on one that is
 *   disabled, or on one whose `data-intent` is no intent.
 */
const intentOf = (root: HTMLElement, target: EventTarget | null): Option.Option<Intent> => {
  if (!(target instanceof globalThis.Element)) {
    return Option.none();
  }

  const button = target.closest<HTMLElement>("[data-intent]");

  if (
    button === null ||
    !root.contains(button) ||
    button.matches(":disabled") ||
    button.getAttribute("aria-disabled") === "true"
  ) {
    return Option.none();
  }

  return decodeIntent([[intentName(token), button.dataset["intent"] ?? ""]], token);
};

/**
 * The test navigation (m3g-02), a chrome component: the `nav` Root `renderNavigation` writes for a
 * session's navigation, its buttons and its item list, projected to React.
 *
 * It builds the Root through `emitNavigation`, the function `renderNavigation` calls, so its
 * markers, labels, `data-intent` values and `disabled` states are `renderNavigation`'s HTML's (one
 * emitter, a React projection). Every button is a plain `type="button"`: pressing one calls
 * `onIntent` with the intent its `data-intent` holds, `next` for Next and `go` with the item's
 * sequence index for an item's button, and a disabled button calls nothing. A host that posts
 * natively replaces a button through `parts` with its own submit button; the `data-intent` and
 * `disabled` the emitter writes survive the swap, so `onIntent` is called for it too. A part
 * `parts` replaces renders through its React component under the swap invariant, and `className`
 * is merged onto the Root's classes. A refusal of `emitNavigation`, a part key the part table lacks
 * or a replacement that breaks the swap invariant is thrown as the core's own error, as `Item`
 * throws it, since React reports a component's failure by a throw.
 *
 * @example
 *   <Navigation configuration={configuration} onIntent={post} state={state} />;
 *
 * @param props The navigation state, the configuration, the callback and the parts to show.
 * @param props.className A class merged onto the Root's classes.
 * @param props.configuration The configuration, which gives the locale.
 * @param props.onIntent Called with a button's intent when the candidate presses it.
 * @param props.order The parts the Root holds, in order; by default the ones the part's modes
 *   admit.
 * @param props.parts The replacements for the navigation's parts, such as `next`.
 * @param props.state The navigation, as `navigationState` gives it.
 * @returns The navigation's Root, projected.
 * @throws {PartSwapRefused} The first refusal `emitNavigation` gives, or a replacement that breaks
 *   the swap invariant.
 * @throws {UnknownPart} For a part `props.parts` names that the test navigation lacks.
 * @see {@link emitNavigation}
 */
export const Navigation = ({
  className,
  configuration,
  onIntent,
  order,
  parts,
  state,
}: NavigationProps): ReactNode => {
  const ref = useRef<HTMLElement>(null);
  const replacements = useMemo(() => checkedParts(parts), [parts]);
  const root = useMemo(
    () =>
      Result.getOrThrow(
        emitNavigation(
          state,
          { locale: configuration.locale, parts: Result.getOrThrow(resolveOverrides()) },
          order,
        ),
      ),
    [configuration.locale, order, state],
  );

  // No dependency array: a `parts` swap can replace the root element while `onIntent` stays the
  // same, so the listener is bound to whatever element is the root after every commit.
  useLayoutEffect(() => {
    const element = ref.current;
    const pressed = (event: Event): void => {
      const intent = element === null ? Option.none() : intentOf(element, event.target);

      if (Option.isSome(intent)) {
        onIntent?.(intent.value);
      }
    };

    element?.addEventListener("click", pressed);

    return () => {
      element?.removeEventListener("click", pressed);
    };
  });

  return project(root, {
    host: { className, ref, root },
    parts: replacements,
    placements: noPlacements,
  });
};

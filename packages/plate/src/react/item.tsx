/**
 * An item, rendered as React (issue m3g-01): {@link Item} projects the very tree `render` builds,
 * through `renderTree`, so its markers, ids, entry names and text are `render`'s HTML's; it applies
 * React part replacements under the swap invariant, places each interaction's component at that
 * interaction's root, reports each changed response, and upgrades the runtime kinds.
 *
 * Each interaction's component is imported from its own `#plate/react/<name>.tsx`, never through
 * `#plate/react/index.tsx`, which imports this module.
 *
 * @module
 */
import { useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { InteractionKey } from "#plate/emit/parts.ts";
import type { ResponseValue } from "#plate/model/values.ts";
import { Associate } from "#plate/react/associate.tsx";
import { Choice } from "#plate/react/choice.tsx";
import type { InteractionComponent, InteractionProps, ItemProps } from "#plate/react/contract.tsx";
import { Drawing } from "#plate/react/drawing.tsx";
import { EndAttempt } from "#plate/react/end-attempt.tsx";
import { ExtendedText } from "#plate/react/extended-text.tsx";
import { GapMatch } from "#plate/react/gap-match.tsx";
import { GraphicAssociate } from "#plate/react/graphic-associate.tsx";
import { GraphicGapMatch } from "#plate/react/graphic-gap-match.tsx";
import { GraphicOrder } from "#plate/react/graphic-order.tsx";
import { Hotspot } from "#plate/react/hotspot.tsx";
import { Hottext } from "#plate/react/hottext.tsx";
import { InlineChoice } from "#plate/react/inline-choice.tsx";
import {
  InteractionHost,
  ItemScope,
  Placed,
  project,
  useItemScope,
} from "#plate/react/interaction.tsx";
import type { Placement } from "#plate/react/interaction.tsx";
import { Match } from "#plate/react/match.tsx";
import { Media } from "#plate/react/media.tsx";
import { Order } from "#plate/react/order.tsx";
import { isStub, Notice, useUpgrade } from "#plate/react/parts.tsx";
import { PortableCustom } from "#plate/react/portable-custom.tsx";
import { PositionObject } from "#plate/react/position-object.tsx";
import { SelectPoint } from "#plate/react/select-point.tsx";
import { Slider } from "#plate/react/slider.tsx";
import { TextEntry } from "#plate/react/text-entry.tsx";
import { Upload } from "#plate/react/upload.tsx";
import { drawInstance } from "#plate/seed.ts";

/**
 * A props object built one optional prop at a time, each set only when present.
 */
type Mutable<T> = { -readonly [K in keyof T]: T[K] };

/**
 * Each interaction's component, by its key: what `Item` places at a root of that kind.
 */
const components = {
  "associate-interaction": Associate,
  "choice-interaction": Choice,
  "drawing-interaction": Drawing,
  "end-attempt-interaction": EndAttempt,
  "extended-text-interaction": ExtendedText,
  "gap-match-interaction": GapMatch,
  "graphic-associate-interaction": GraphicAssociate,
  "graphic-gap-match-interaction": GraphicGapMatch,
  "graphic-order-interaction": GraphicOrder,
  "hotspot-interaction": Hotspot,
  "hottext-interaction": Hottext,
  "inline-choice-interaction": InlineChoice,
  "match-interaction": Match,
  "media-interaction": Media,
  "order-interaction": Order,
  "portable-custom-interaction": PortableCustom,
  "position-object-interaction": PositionObject,
  "select-point-interaction": SelectPoint,
  "slider-interaction": Slider,
  "text-entry-interaction": TextEntry,
  "upload-interaction": Upload,
} as const satisfies {
  readonly [I in Exclude<InteractionKey, "item" | "test-navigation">]: InteractionComponent<I>;
};

/**
 * Give the component `Item` places at an interaction root of a key.
 *
 * @param key The interaction's key.
 * @returns Its component, or undefined for a key no interaction component has.
 */
const componentFor = (key: InteractionKey): InteractionComponent<InteractionKey> | undefined =>
  key === "item" || key === "test-navigation" ? undefined : components[key];

/**
 * Project the item in scope: its tree from the item's root, each interaction root through its
 * component, and the root upgraded by the runtime.
 *
 * @param props The root's classes and the change listener.
 * @param props.className A class merged onto the root's classes.
 * @param props.onValueChange Called with a response's identifier and its new value.
 * @returns The item's root as React renders it.
 */
const ItemRoot = ({
  className,
  onValueChange,
}: {
  readonly className: ItemProps["className"] | undefined;
  readonly onValueChange: ItemProps["onValueChange"] | undefined;
}): ReactNode => {
  const scope = useItemScope();
  const ref = useRef<HTMLElement>(null);
  const report = useRef(onValueChange);

  useLayoutEffect(() => {
    report.current = onValueChange;
  });
  useUpgrade(ref);

  if (scope === undefined) {
    return <Notice feature="qti-assessment-item" />;
  }

  const { options } = scope;
  const place = (placement: Placement): ReactNode => {
    const { key, response } = placement;
    const Component = componentFor(key);
    const name = options.names?.[response];
    const defaultValue = options.values?.[response];
    const parts = scope.parts[key];
    const state: Mutable<InteractionProps<InteractionKey>> = {
      onValueChange: (value: ResponseValue) => {
        report.current?.(response, value);
      },
      responseIdentifier: response,
    };

    if (defaultValue !== undefined) {
      state.defaultValue = defaultValue;
    }

    if (name !== undefined) {
      state.name = name;
    }

    if (options.disabled !== undefined) {
      state.disabled = options.disabled;
    }

    if (parts !== undefined) {
      state.parts = parts;
    }

    return Component === undefined || isStub(Component) ? (
      <InteractionHost key={placement.ordinal} placement={placement} scope={scope} state={state} />
    ) : (
      <Placed key={placement.ordinal} placement={placement}>
        <Component {...state} />
      </Placed>
    );
  };

  return project(scope.tree, {
    host: { className, ref, root: scope.tree },
    parts: scope.parts,
    place,
    placements: scope.placements,
  });
};

/**
 * An item, rendered as React: the tree `render` builds for the same item, configuration and
 * options, projected, so its `data-slot` markers, ids, entry names, label links and text are
 * `render`'s HTML's (one emitter, a React projection).
 *
 * It builds the tree through `renderTree` with `options` and no core `parts`, drawing an instance
 * once when `options` names none. A part `parts` replaces renders through its React component
 * under the swap invariant: the attributes the emitter requires win over the replacement's on its
 * one root (I1), each child it was handed appears once, in order (I2), its root stays in the part's
 * tag class (I3), and a breach, or a part key the part table lacks, throws the core's own error,
 * `PartSwapRefused` with the core's cause or `UnknownPart` (I4), as does any refusal of
 * `renderTree`, since React reports a component's failure by a throw. Each interaction root holds
 * its kind's component with `responseIdentifier`, that kind's `parts`, the `name` and
 * `defaultValue` `options.names` and `options.values` give, `options.disabled`, and an
 * `onValueChange` that calls this one's with the response's identifier; a kind whose component is
 * still a stub has its root projected as the core rendered it, with the same reports, so every
 * kind the core renders shows here. The controls are uncontrolled: `options.values` are their
 * defaults, and checked, selected and typed text live on the native controls. It upgrades its
 * root through `useUpgrade`, writes no form and no submit control, and never moves focus, so it
 * leaves off the `autofocus` `render` writes after a refused post.
 *
 * @example
 *   <form method="post">
 *     <Item configuration={configuration} redacted={redacted} options={{ instance: "q1" }} />
 *     <button>Submit</button>
 *   </form>;
 *
 * @param props The item, its configuration, `render`'s options but `parts`, the React part
 *   replacements, a class for the root and the change listener.
 * @param props.className A class merged onto the root's classes.
 * @param props.configuration The configuration `render` takes.
 * @param props.onValueChange Called with a response's identifier and its new value, as `decode`
 *   reads the entries its controls would post, once per change.
 * @param props.options `render`'s options but `parts`.
 * @param props.parts The React part replacements.
 * @param props.redacted The item, as `redact` or `decodeRedacted` made it.
 * @returns The item's root.
 * @throws {InvalidInstance | NotRedacted | OutputTooLarge | InvalidHeadingLevel} The first refusal
 *   `renderTree` gives.
 * @throws {UnknownPart} For a replacement keyed by an interaction or part the part table lacks.
 * @throws {PartSwapRefused} For a replacement that breaks the swap invariant.
 */
export const Item = ({
  className,
  configuration,
  onValueChange,
  options,
  parts,
  redacted,
}: ItemProps): ReactNode => {
  const [drawn] = useState(drawInstance);

  return (
    <ItemScope
      configuration={configuration}
      instance={options?.instance ?? drawn}
      {...(options === undefined ? {} : { options })}
      {...(parts === undefined ? {} : { parts })}
      redacted={redacted}
    >
      <ItemRoot className={className} onValueChange={onValueChange} />
    </ItemScope>
  );
};

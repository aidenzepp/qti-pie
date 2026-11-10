/**
 * Text Entry (Q-20), rendered as React: the interaction `useInteraction` projects from the item's
 * tree.
 *
 * @module
 */
import type { InteractionComponent } from "#plate/react/contract.tsx";
import { useInteraction } from "#plate/react/interaction.tsx";

/**
 * Text Entry (Q-20), an interaction component: the item's `qti-text-entry-interaction` bound to
 * `responseIdentifier`, a phrasing container holding one native text `input`.
 *
 * It projects the interaction through `useInteraction`, so its markers, ids and entry name are the
 * ones `render` writes, and the typed text lives on the native control. Typing reports the text as
 * a value of the response's base type. The state props work as React's form controls take them:
 * `defaultValue` is the value the control mounts with, `value` with `onValueChange` controls it,
 * `name` and `disabled` reach it, `className` is merged onto the root's classes and `parts`
 * replaces the interaction's parts. `Item` places it at each Text Entry root; inside an
 * `ItemScope` it takes the first Text Entry bound to `responseIdentifier`; outside both it renders
 * the item's notice.
 *
 * @example
 *   <TextEntry responseIdentifier="RESPONSE" defaultValue={typed} onValueChange={setTyped} />;
 *
 * @param props The interaction's props: the response it is bound to, its state props, `className`
 *   and `parts`.
 * @returns The interaction's root, projected.
 * @throws {UnknownPart} For a part `props.parts` names that Text Entry lacks.
 * @throws {PartSwapRefused} For a replacement that breaks the swap invariant.
 * @see {@link useInteraction}
 */
export const TextEntry: InteractionComponent<"text-entry-interaction"> = (props) =>
  useInteraction("text-entry-interaction", props);

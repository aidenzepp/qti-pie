/**
 * Inline Choice (Q-12), rendered as React: the interaction `useInteraction` projects from the
 * item's tree.
 *
 * @module
 */
import type { InteractionComponent } from "#plate/react/contract.tsx";
import { useInteraction } from "#plate/react/interaction.tsx";

/**
 * Inline Choice (Q-12), an interaction component: the item's `qti-inline-choice-interaction` bound
 * to `responseIdentifier`, a phrasing container holding the Label, when the item has one, and one
 * native `select` whose first option is the placeholder.
 *
 * It projects the interaction through `useInteraction`, so its markers, ids and entry name are the
 * ones `render` writes, and the selected option lives on the native control. The state props work
 * as React's form controls take them: `defaultValue` is the value the control mounts with, `value`
 * with `onValueChange` controls it, `name` and `disabled` reach it, `className` is merged onto the
 * root's classes and `parts` replaces the interaction's parts. `Item` places it at each Inline
 * Choice root; inside an `ItemScope` it takes the first Inline Choice bound to
 * `responseIdentifier`; outside both it renders the item's notice.
 *
 * @example
 *   <InlineChoice responseIdentifier="PICK" defaultValue={picked} onValueChange={setPicked} />;
 *
 * @param props The interaction's props: the response it is bound to, its state props, `className`
 *   and `parts`.
 * @returns The interaction's root, projected.
 * @throws {UnknownPart} For a part `props.parts` names that Inline Choice lacks.
 * @throws {PartSwapRefused} For a replacement that breaks the swap invariant.
 * @see {@link useInteraction}
 */
export const InlineChoice: InteractionComponent<"inline-choice-interaction"> = (props) =>
  useInteraction("inline-choice-interaction", props);

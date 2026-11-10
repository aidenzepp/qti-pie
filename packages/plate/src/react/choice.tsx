/**
 * Choice (Q-2), rendered as React: the interaction `useInteraction` projects from the item's tree.
 *
 * @module
 */
import type { InteractionComponent } from "#plate/react/contract.tsx";
import { useInteraction } from "#plate/react/interaction.tsx";

/**
 * Choice (Q-2), an interaction component: the item's `qti-choice-interaction` bound to
 * `responseIdentifier`, as a radio group (a single response) or a checkbox group (a multiple one)
 * of native inputs.
 *
 * It projects the interaction through `useInteraction`, so its markers, ids, entry names and label
 * links are the ones `render` writes, and the checked choice lives on the native control. The state
 * props work as React's form controls take them: `defaultValue` is the value the controls mount
 * with, `value` with `onValueChange` controls them, `name` and `disabled` reach every control,
 * `className` is merged onto the root's classes and `parts` replaces the interaction's parts.
 * `Item` places it at each Choice root; inside an `ItemScope` it takes the first Choice bound to
 * `responseIdentifier`; outside both it renders the item's notice.
 *
 * @example
 *   <Choice responseIdentifier="RESPONSE" defaultValue={chosen} onValueChange={setChosen} />;
 *
 * @param props The interaction's props: the response it is bound to, its state props, `className`
 *   and `parts`.
 * @returns The interaction's root, projected.
 * @throws {UnknownPart} For a part `props.parts` names that Choice lacks.
 * @throws {PartSwapRefused} For a replacement that breaks the swap invariant.
 * @see {@link useInteraction}
 */
export const Choice: InteractionComponent<"choice-interaction"> = (props) =>
  useInteraction("choice-interaction", props);

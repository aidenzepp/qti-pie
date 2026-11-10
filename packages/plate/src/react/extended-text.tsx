/**
 * Extended Text (Q-5), rendered as React: the interaction `useInteraction` projects from the
 * item's tree.
 *
 * @module
 */
import type { InteractionComponent } from "#plate/react/contract.tsx";
import { useInteraction } from "#plate/react/interaction.tsx";

/**
 * Extended Text (Q-5), an interaction component: the item's `qti-extended-text-interaction` bound
 * to `responseIdentifier`, its Prompt and one native `textarea` for each string the response holds.
 *
 * It projects the interaction through `useInteraction`, so its markers, ids and entry name are the
 * ones `render` writes, and the typed text lives on the native control. A text area's value reads
 * its line breaks as LF, so a `defaultValue` written with CRLF shows, and typing reports, LF line
 * breaks. The state props work as React's form controls take them: `defaultValue` is the value the
 * control mounts with, `value` with `onValueChange` controls it, `name` and `disabled` reach it,
 * `className` is merged onto the root's classes and `parts` replaces the interaction's parts.
 * `Item` places it at each Extended Text root; inside an `ItemScope` it takes the first Extended
 * Text bound to `responseIdentifier`; outside both it renders the item's notice.
 *
 * @example
 *   <ExtendedText responseIdentifier="NOTE" defaultValue={written} onValueChange={setWritten} />;
 *
 * @param props The interaction's props: the response it is bound to, its state props, `className`
 *   and `parts`.
 * @returns The interaction's root, projected.
 * @throws {UnknownPart} For a part `props.parts` names that Extended Text lacks.
 * @throws {PartSwapRefused} For a replacement that breaks the swap invariant.
 * @see {@link useInteraction}
 * @see https://html.spec.whatwg.org/multipage/form-elements.html#the-textarea-element
 */
export const ExtendedText: InteractionComponent<"extended-text-interaction"> = (props) =>
  useInteraction("extended-text-interaction", props);

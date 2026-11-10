/**
 * The hidden default submit a React host puts first in its form, so that the form's default
 * button is the host's own and never a submit button the item holds (issue gate-default-submit).
 *
 * @module
 */
import type { ReactNode } from "react";

/**
 * The props of {@link DefaultSubmit}: what the hidden default submit carries, nothing by default.
 */
export interface DefaultSubmitProps {
  /**
   * Whether the default button is disabled, which stops implicit submission: pass what the form's
   * visible submit button carries.
   */
  readonly disabled?: boolean;
  /**
   * The entry the default button posts, when the form's visible submit posts one (a session page's
   * intent): the same `name` and `value`, so Enter posts what that button posts.
   */
  readonly name?: string;
  readonly value?: string;
}

/**
 * Render a host form's hidden default submit: `button type="submit" hidden`, reading "Submit",
 * carrying exactly the props given and nothing else. Put it first in the form, before the
 * rendered item, and keep the visible submit button where it is, after the item.
 *
 * The rule: a host form's default button is the host's own submit, so implicit submission (Enter
 * in a text field) is the item's ordinary submission. HTML's default button is the form's first
 * submit button in tree order, and an item can hold a submit button of its own, an End Attempt's
 * Control, named for its response and valued `true`; were it the first, Enter would post that
 * response and end the attempt. With this button first, an End Attempt's response is `true` only
 * when the candidate activates its button. `hidden` alone hides it: the button is not rendered,
 * not focusable and not in the accessibility tree, so the tab order and what a screen reader
 * hears are the visible submit's alone; it carries no `aria-hidden`, no `tabIndex` and no class.
 *
 * @example
 *   <form method="post">
 *     <DefaultSubmit />
 *     <Item redacted={redacted} configuration={configuration} />
 *     <button type="submit">Submit</button>
 *   </form>;
 *
 * @param props The props.
 * @param props.disabled Whether the button is disabled, as the form's visible submit is.
 * @param props.name The entry name the button posts, when the visible submit posts one.
 * @param props.value The entry value the button posts, when the visible submit posts one.
 * @returns The hidden submit button.
 * @see https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#implicit-submission
 * @see https://html.spec.whatwg.org/multipage/interaction.html#the-hidden-attribute
 */
export const DefaultSubmit = ({ disabled, name, value }: DefaultSubmitProps): ReactNode => (
  <button disabled={disabled} hidden name={name} type="submit" value={value}>
    Submit
  </button>
);

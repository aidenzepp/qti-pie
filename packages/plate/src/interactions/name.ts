/**
 * How the interactions name their groups and controls for assistive technology (§4.3, §4.8, Q10):
 * the names the author wrote, and the renderer's own for a text control the author left unnamed.
 *
 * A Choice, a Text Entry and an Extended Text each read the author's `aria-label` and
 * `aria-labelledby` here, so every interaction scopes the author's ids the same way.
 *
 * @module
 */
import { Option } from "effect";
import type { Attributes } from "#plate/emit/node.ts";
import { authoredIdrefs } from "#plate/emit/parts.ts";
import { message } from "#plate/messages.ts";
import type { Locale } from "#plate/messages.ts";
import type { TextName } from "#plate/payload.ts";

/**
 * Give the names the author wrote: `aria-label` as written, and `aria-labelledby` with each id
 * scoped by the instance through `authoredIdrefs`, joined by one space.
 *
 * @param names The author's `aria-label` and `aria-labelledby`, the ids unscoped.
 * @param instance The item instance key, which scopes the author's ids.
 * @returns The attributes the author gave, none when they gave neither.
 */
export const authorsName = (
  names: Pick<TextName, "ariaLabel" | "ariaLabelledby">,
  instance: string,
): Attributes => ({
  ...Option.match(names.ariaLabel, {
    onNone: () => ({}),
    onSome: (label) => ({ "aria-label": label }),
  }),
  ...Option.match(names.ariaLabelledby, {
    onNone: () => ({}),
    onSome: (ids) => ({ "aria-labelledby": authoredIdrefs(instance, ids) }),
  }),
});

/**
 * Name a text control that no Prompt names (§4.8, Q10).
 *
 * The author's `aria-label` and `aria-labelledby` win ({@link authorsName}). A control with
 * neither is named by the renderer: "Answer", or "Answer n of count" when the item holds more than
 * one such control.
 *
 * @param name How the control is named, from the payload.
 * @param instance The item instance key, which scopes the author's ids.
 * @param locale The locale of the renderer's own text.
 * @returns The naming attributes.
 */
export const textControlName = (name: TextName, instance: string, locale: Locale): Attributes => {
  if (Option.isSome(name.ariaLabel) || Option.isSome(name.ariaLabelledby)) {
    return authorsName(name, instance);
  }

  const count = (n: number): string => new Intl.NumberFormat(locale).format(n);

  return {
    "aria-label": Option.match(name.unnamed.pipe(Option.filter((position) => position.count > 1)), {
      onNone: () => message(locale, "answer"),
      onSome: (position) =>
        message(locale, "answerOf", { count: count(position.count), n: count(position.n) }),
    }),
  };
};

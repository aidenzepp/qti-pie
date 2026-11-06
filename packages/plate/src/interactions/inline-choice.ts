/**
 * Inline Choice (Q-12): its response validation, on the module shape of Choice and Text Entry.
 *
 * `renderInlineChoice` emits this structure: a `qti-inline-choice-interaction` Root, a phrasing
 * container that stands inside the author's sentence, holding the Label when the item has a
 * `qti-label`, and one native `select`, the Control. The Control's first option is the
 * Placeholder, `value=""`, which posts as NULL; each choice is an Option after it, in presented
 * order, holding its content's text. The Control is a native select, so the browser's own keyboard
 * map applies. In review and solution, and when the author finished the item, the Control is
 * `disabled`, since a `select` has no `readonly`.
 *
 * {@link validateInlineChoice} checks a value the caller decoded, in two tiers: tier (a) always,
 * tier (b) only under `validateResponses` (D5).
 *
 * @module
 */
import { Option } from "effect";
import type { Configuration } from "#plate/configuration.ts";
import { Malformed } from "#plate/form/encoding.ts";
import { message, numeral } from "#plate/messages.ts";
import type { InlineChoiceInteraction } from "#plate/model/item.ts";
import { format } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";
import type { ValidationMessage } from "#plate/payload.ts";

/**
 * Check an Inline Choice's response, which the caller decoded, in two tiers.
 *
 * The caller decodes the posted entry with `decode`, under the entry name its form gave the
 * Control and the Inline Choice's binding (one identifier), and passes the value, or the
 * {@link Malformed} `decode` gave. The Placeholder posts `""`, which decodes to NULL. So the entry
 * name stays the caller's, while the messages and the author's override stay here.
 *
 * - A {@link Malformed} input: `atMost` 1 when the response was posted more than once, else
 *   `unknownChoice`.
 * - Tier (a), always: an identifier that names no choice gives `unknownChoice`. Identifiers compare
 *   exactly, so `a` does not name a choice `A`.
 * - Tier (b), only under `validateResponses`: fewer identifiers than needed gives `atLeast` with the
 *   count needed. That count is `min-choices`, raised to 1 when `required` is true; NULL is
 *   accepted when it is 0. A `min-choices` above 1 is validated as written, so then every response
 *   is refused (R-P6-1).
 *
 * The author's `data-min-selections-message` replaces the renderer's text for `atLeast`.
 *
 * @param interaction The Inline Choice.
 * @param input The decoded value, or why the entries did not decode.
 * @param configuration The configuration, which gives the locale and `validateResponses`.
 * @returns One message per problem, none when the response is accepted.
 */
export const validateInlineChoice = (
  interaction: InlineChoiceInteraction,
  input: Value | Malformed,
  configuration: Configuration,
): readonly ValidationMessage[] => {
  const { locale } = configuration;
  const say = (words: string): ValidationMessage => ({
    response: interaction.response,
    text: words,
  });

  if (input instanceof Malformed) {
    return [
      say(
        input.reason === "single-many"
          ? message(locale, "atMost", { n: numeral(locale, 1n) })
          : message(locale, "unknownChoice"),
      ),
    ];
  }

  const presented = new Set(interaction.choices.map((choice) => choice.identifier));
  const chosen = input.values.map(format);
  const needed = interaction.required && interaction.minChoices < 1n ? 1n : interaction.minChoices;

  return [
    ...(chosen.some((identifier) => !presented.has(identifier))
      ? [say(message(locale, "unknownChoice"))]
      : []),
    ...(configuration.validateResponses && BigInt(chosen.length) < needed
      ? [
          say(
            Option.getOrElse(interaction.messages.min, () =>
              message(locale, "atLeast", { n: numeral(locale, needed) }),
            ),
          ),
        ]
      : []),
  ];
};

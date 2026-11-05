/**
 * The pattern check Text Entry and Extended Text share: a response against its interaction's
 * `pattern-mask`, a tier (b) check, run only under `validateResponses`.
 *
 * A `pattern-mask` is an XML Schema regular expression, which {@link translate} turns into a
 * JavaScript expression anchored at both ends, once per pattern. A value of base type `integer` or
 * `float` is matched in its canonical lexical form, as `format` writes it, so on a `float` binding
 * a posted `1.50` is matched as `1.5` and on an `integer` binding `007` as `7`. A `string` is
 * matched as the candidate typed it, its line breaks already LF.
 *
 * The check is this function, which the host runs with the posted response; no native `pattern`
 * attribute is written.
 *
 * The module is pure and synchronous, a browser module.
 *
 * @module
 */
import { Option, Result, pipe } from "effect";
import type { Configuration } from "#plate/configuration.ts";
import { message } from "#plate/messages.ts";
import type { TextEntryInteraction } from "#plate/model/item.ts";
import { translate } from "#plate/model/regex.ts";
import { format } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";

/**
 * Each pattern translated so far, with its expression, or none when the translator refused it.
 *
 * Patterns come from the items a process renders, so the map holds one entry per distinct
 * `pattern-mask` it has checked.
 */
const translated = new Map<string, Option.Option<RegExp>>();

/**
 * Translate a pattern, once.
 *
 * @param pattern The `pattern-mask`, as written.
 * @returns Its expression, or none when the translator refuses it.
 */
const expressionOf = (pattern: string): Option.Option<RegExp> => {
  const known = translated.get(pattern);
  if (known !== undefined) {
    return known;
  }

  const expression = Result.getSuccess(translate(pattern));
  translated.set(pattern, expression);

  return expression;
};

/**
 * Check a text response against its interaction's `pattern-mask`.
 *
 * The response mismatches when any of its values does not match the whole pattern. NULL is not
 * checked. An interaction without a `pattern-mask` checks nothing, and so does one whose pattern
 * the translator refuses, which an item built by `open` never holds: it shows the notice
 * `pattern-mask` instead.
 *
 * @example
 *   // With validateResponses on, against pattern-mask="([0-9.]{0,6})":
 *   patternMessage(interaction, { baseType: "string", cardinality: "single", values: [{ baseType: "string", value: "12a" }] }, configuration);
 *   // Option.some of the author's data-patternmask-message, else patternMismatch's text
 *
 * @param interaction The Text Entry or Extended Text: its `pattern-mask` and the author's message.
 * @param value The decoded response.
 * @param configuration The configuration, which gives `validateResponses` and the locale.
 * @returns The one pattern message, the author's `data-patternmask-message` or else the locale's
 *   `patternMismatch`; none when the response matches, is NULL, or is not checked.
 */
export const patternMessage = (
  interaction: Pick<TextEntryInteraction, "patternMask" | "patternMaskMessage">,
  value: Value,
  configuration: Configuration,
): Option.Option<string> =>
  configuration.validateResponses
    ? pipe(
        interaction.patternMask,
        Option.flatMap(expressionOf),
        Option.filter((expression) =>
          value.values.some((single) => !expression.test(format(single))),
        ),
        Option.map(() =>
          Option.getOrElse(interaction.patternMaskMessage, () =>
            message(configuration.locale, "patternMismatch"),
          ),
        ),
      )
    : Option.none();

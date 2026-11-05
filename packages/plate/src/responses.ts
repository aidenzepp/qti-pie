/**
 * Response validation as the item's interactions do it: {@link checkResponses}, a plain function an
 * author calls before showing or scoring responses.
 *
 * Each interaction module validates its own response, so this module only finds the interactions
 * and hands each its input. This is a browser module: it value-imports from `effect` only `Option`,
 * `Array`, `pipe`, `Data` and `Result`, and takes the configuration as a type, so a host that
 * imports `checkResponses` alone bundles no Schema and no Effect runtime.
 *
 * @module
 */
import { Option } from "effect";
import type { Configuration } from "#plate/configuration.ts";
import type { Malformed } from "#plate/form/encoding.ts";
import { validateChoice } from "#plate/interactions/choice.ts";
import { validateExtendedText } from "#plate/interactions/extended-text.ts";
import { validateTextEntry } from "#plate/interactions/text-entry.ts";
import { interactionsIn } from "#plate/model/interactions.ts";
import type { Interaction, Item } from "#plate/model/item.ts";
import { nullOf } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";
import type { ValidationMessage } from "#plate/payload.ts";
import type { Accepted } from "#plate/validate/verdict.ts";

/**
 * Give an interaction's NULL, the input of a response the caller left out.
 *
 * @param item The item, whose declaration gives the response's type.
 * @param interaction The interaction.
 * @returns NULL of the bound response's declared type, or of the interaction's own when the item
 *   declares none.
 */
const absent = (item: Item, interaction: Interaction): Value =>
  Option.match(Option.fromUndefinedOr(item.responses.get(interaction.response)), {
    onNone: () =>
      interaction.kind === "choice"
        ? nullOf("identifier", interaction.cardinality)
        : nullOf(interaction.baseType, "single"),
    onSome: (declaration) => nullOf(declaration.baseType, declaration.cardinality),
  });

/**
 * Validate one interaction's input through its own module.
 *
 * @param interaction The interaction.
 * @param input Its response's value, or why the entries did not decode.
 * @param configuration The configuration.
 * @returns Its messages.
 */
const validate = (
  interaction: Interaction,
  input: Value | Malformed,
  configuration: Configuration,
): readonly ValidationMessage[] => {
  switch (interaction.kind) {
    case "choice": {
      return validateChoice(interaction, input, configuration);
    }
    case "extended-text": {
      return validateExtendedText(interaction, input, configuration);
    }
    case "text-entry": {
      return validateTextEntry(interaction, input, configuration);
    }
    default: {
      return interaction satisfies never;
    }
  }
};

/**
 * Validate responses as the item's interactions do, without scoring them.
 *
 * Each interaction of the item, in document order, validates its response: a host that posts a
 * native form passes what `decode` gave for each response, a {@link Malformed} included, and a
 * form-library host passes values. A response left out is NULL. Tier (a) limits apply always and
 * tier (b) ones only under `configuration.validateResponses`.
 *
 * @example
 *   checkResponses(accepted, { RESPONSE: decoded }, configuration);
 *   // [] when RESPONSE is accepted, else its messages, ready for render's messages option
 *
 * @param document The document `check` accepted.
 * @param responses The responses by identifier, each a value or the `Malformed` `decode` gave.
 * @param configuration The configuration, which gives the locale and `validateResponses`.
 * @returns Every message, in document order of the interactions; none when all are accepted.
 */
export const checkResponses = (
  document: Accepted,
  responses: Readonly<Record<string, Value | Malformed>>,
  configuration: Configuration,
): readonly ValidationMessage[] =>
  interactionsIn(document.item.body).flatMap((interaction) => {
    const given = Object.hasOwn(responses, interaction.response)
      ? responses[interaction.response]
      : undefined;

    return validate(interaction, given ?? absent(document.item, interaction), configuration);
  });

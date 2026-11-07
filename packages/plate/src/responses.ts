/**
 * Response validation as the item's interactions do it: {@link checkResponses}, a plain function an
 * author calls before showing or scoring responses.
 *
 * Each interaction module validates its own response, so this module only finds the interactions
 * the page showed, through the redaction the page is built from, and hands each its input. This is
 * a browser module: it value-imports from `effect` only `Option`, `Array`, `pipe`, `Data` and
 * `Result`, and takes the configuration as a type, so a host that imports `checkResponses` alone
 * bundles no Schema and no Effect runtime.
 *
 * @module
 */
import { Option } from "effect";
import type { Configuration } from "#plate/configuration.ts";
import { Malformed } from "#plate/form/encoding.ts";
import { validateChoice } from "#plate/interactions/choice.ts";
import { validateExtendedText } from "#plate/interactions/extended-text.ts";
import { validateInlineChoice } from "#plate/interactions/inline-choice.ts";
import { validateTextEntry } from "#plate/interactions/text-entry.ts";
import { message } from "#plate/messages.ts";
import { interactionsIn } from "#plate/model/interactions.ts";
import type { Interaction, Item } from "#plate/model/item.ts";
import type { ResponsesRecord } from "#plate/model/record.ts";
import { isNull, nullOf } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";
import { redactItem } from "#plate/payload.ts";
import type { ValidationMessage } from "#plate/payload.ts";
import type { Accepted } from "#plate/validate/verdict.ts";

/**
 * Give the NULL of the type an interaction binds: an identifier of a Choice's cardinality, a single
 * identifier for an Inline Choice, and a single value of a text control's base type.
 *
 * @param interaction The interaction.
 * @returns Its NULL.
 */
const ownNull = (interaction: Interaction): Value => {
  switch (interaction.kind) {
    case "choice": {
      return nullOf("identifier", interaction.cardinality);
    }
    case "inline-choice": {
      return nullOf("identifier", "single");
    }
    case "extended-text":
    case "text-entry": {
      return nullOf(interaction.baseType, "single");
    }
    default: {
      return interaction satisfies never;
    }
  }
};

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
    onNone: () => ownNull(interaction),
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
    case "inline-choice": {
      return validateInlineChoice(interaction, input, configuration);
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
 * Give the interactions the page showed, in document order: those of the item redacted under the
 * record (`redactItem`), the walk `render` shows the item by, so a choice its template hides is not
 * among its interaction's choices and an interaction a hidden template block, inline or choice
 * holds is not there at all. With no record the redaction reads the item as it does with none
 * (H3), so an item whose template processing runs shows no template block, inline or choice with
 * a template visibility.
 *
 * @param item The item.
 * @param record The template values of the attempt shown, if any.
 * @returns The interactions shown.
 */
const shownInteractions = (item: Item, record?: ResponsesRecord): readonly Interaction[] =>
  interactionsIn(
    (record === undefined
      ? redactItem(item)
      : redactItem(item, { outcomes: {}, templates: record.templates })
    ).body,
  );

/**
 * Say whether a caller passed candidate input for a response: a value that is not NULL, or the
 * {@link Malformed} `decode` gave for entries posted under it. NULL is what a response left out
 * reads as, so it carries none.
 *
 * @param given The response's input, undefined when the caller left it out.
 * @returns Whether it carries input.
 */
const carriesInput = (given: Value | Malformed | undefined): boolean =>
  given !== undefined && (given instanceof Malformed || !isNull(given));

/**
 * Validate responses as the item's interactions do, without scoring them.
 *
 * It judges only what the page showed: the interactions of the item as `redact` shows it under the
 * record's template values ({@link shownInteractions}). Each interaction shown, in document order,
 * validates its response: a host that posts a native form passes what `decode` gave for each
 * response, a {@link Malformed} included, and a form-library host passes values. A response left
 * out is NULL. Tier (a) limits apply always and tier (b) ones only under
 * `configuration.validateResponses`. An Extended Text that renders the cap's notice in place of
 * its Controls (Q23) is not judged against its `min-strings`, so a post with no entry for it never
 * holds its item back.
 *
 * A choice its template hides, or withholds because the record holds no value of its template
 * variable, is not among the choices presented, so posting it gives `unknownChoice`. An
 * interaction a hidden or withheld template block, inline or choice holds is absent: no limit on
 * it holds a post back, and a response bound to no interaction shown that carries input for it (a
 * value that is not NULL, or a {@link Malformed}) is refused with `unknownChoice`, as a post for a
 * control the page never showed, so it never reaches response processing. Its NULL reads as left
 * out.
 *
 * With no record, an item whose template processing does not run reads as the record its first
 * attempt starts with (each template variable at its declared default); for an item whose template
 * processing runs, every template block and inline is withheld and every choice with a template
 * visibility is absent (H3).
 *
 * @example
 *   checkResponses(accepted, { RESPONSE: decoded }, configuration, record);
 *   // [] when RESPONSE is accepted, else its messages, ready for render's messages option; record
 *   // is the one the item was rendered under, as redact took it
 *
 * @param document The document `check` accepted.
 * @param responses The responses by identifier, each a value or the `Malformed` `decode` gave.
 * @param configuration The configuration, which gives the locale and `validateResponses`.
 * @param record The template values of the attempt the page showed, the record `redact` took; none
 *   to judge the item as it reads with no record.
 * @returns The messages of the interactions shown, in their document order, then one
 *   `unknownChoice` for each response that carries input for content the page did not show, in the
 *   document order of the first interaction binding it; none when all are accepted.
 */
export const checkResponses = (
  document: Accepted,
  responses: Readonly<Record<string, Value | Malformed>>,
  configuration: Configuration,
  record?: ResponsesRecord,
): readonly ValidationMessage[] => {
  const given = (response: string): Value | Malformed | undefined =>
    Object.hasOwn(responses, response) ? responses[response] : undefined;
  const shown = shownInteractions(document.item, record);
  const bound = new Set(shown.map((interaction) => interaction.response));
  const unshown = new Set(
    interactionsIn(document.item.body).flatMap((interaction) =>
      bound.has(interaction.response) ? [] : [interaction.response],
    ),
  );

  return [
    ...shown.flatMap((interaction) =>
      validate(
        interaction,
        given(interaction.response) ?? absent(document.item, interaction),
        configuration,
      ),
    ),
    ...[...unshown].flatMap((response): readonly ValidationMessage[] =>
      carriesInput(given(response))
        ? [{ response, text: message(configuration.locale, "unknownChoice") }]
        : [],
    ),
  ];
};

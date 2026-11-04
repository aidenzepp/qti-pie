/**
 * Text Entry (Q-20): its parts, its connect function and its response validation, on the module
 * shape of Choice.
 *
 * {@link renderTextEntry} emits the structure of spec §4.3: a `qti-text-entry-interaction` Root, a
 * phrasing container that stands inside the author's sentence, holding one native text `input`, the
 * Control. The connect function computes every attribute of both parts once, and `applyPart` places
 * each one, through the embedder's replacement when there is one (ruling `fb4fe744` S1, S2). The
 * Control is a native text input, so the browser's own keyboard map applies (§4.8), and Enter
 * submits the author's form by implicit submission.
 *
 * {@link validateTextEntry} checks a value the caller decoded. Only tier (a) applies: a posted text
 * that is not a number of the bound base type.
 *
 * @module
 */
import { Option, Result } from "effect";
import type { Configuration } from "#plate/configuration.ts";
import { authoredId } from "#plate/emit/body.ts";
import type { Attributes, Element } from "#plate/emit/node.ts";
import { rowFor, scopedId } from "#plate/emit/parts.ts";
import type { PartOf, PartRow } from "#plate/emit/parts.ts";
import { applyPart } from "#plate/emit/swap.ts";
import type { PartSwapRefused } from "#plate/emit/swap.ts";
import { Malformed } from "#plate/form/encoding.ts";
import { message } from "#plate/messages.ts";
import type { Locale } from "#plate/messages.ts";
import type { TextEntryInteraction } from "#plate/model/item.ts";
import type { Value } from "#plate/model/values.ts";
import type { EmitState, Payload, TextEntryPayload, ValidationMessage } from "#plate/payload.ts";

/**
 * The owner of every Text Entry part in the part table.
 */
const owner = "text-entry-interaction";

/**
 * A Text Entry part.
 */
type TextEntryPart = PartOf<typeof owner>;

/**
 * The row of every Text Entry part.
 */
type Rows = { readonly [P in TextEntryPart]: PartRow };

/**
 * The attributes of every part of one Text Entry, computed once by {@link connect}.
 */
type Connected = { readonly [P in TextEntryPart]: Attributes };

/**
 * The rows of the Text Entry parts, which no placement changes.
 */
const rows: Rows = {
  control: rowFor(owner, "control"),
  root: rowFor(owner, "root"),
};

/**
 * The ASCII whitespace that separates the ids of an IDREFS value.
 */
const idSeparator = /[\t\n\f\r ]+/u;

/**
 * Give attributes only when a condition holds, so a part's props read as one object literal.
 *
 * @param condition Whether the attributes apply.
 * @param attributes The attributes.
 * @returns `attributes`, or none when `condition` is false.
 */
const when = (condition: boolean, attributes: Attributes): Attributes =>
  condition ? attributes : {};

/**
 * Give the attributes of an optional value, none when it is absent.
 *
 * @param value The value.
 * @param attributes The attributes the present value gives.
 * @returns The attributes, or none.
 */
const whenSome = <A>(value: Option.Option<A>, attributes: (present: A) => Attributes): Attributes =>
  Option.match(value, { onNone: () => ({}), onSome: attributes });

/**
 * Give the virtual keyboard a Text Entry asks for: digits for an integer in a base whose digits
 * are all decimal, a decimal keypad for a float.
 *
 * An integer in a base above 10 takes letters as digits, which a numeric keypad cannot type, so it
 * asks for none.
 *
 * @param interaction The Text Entry.
 * @returns The `inputmode` attribute, or none.
 */
const inputModeOf = (interaction: TextEntryPayload): Attributes => {
  if (interaction.baseType === "float") {
    return { inputmode: "decimal" };
  }

  return when(interaction.baseType === "integer" && interaction.base <= 10, {
    inputmode: "numeric",
  });
};

/**
 * Name the Control for assistive technology (§4.8, Q10).
 *
 * The author's `aria-labelledby`, its ids scoped as the body scopes the ids it names, and the
 * author's `aria-label` win. A Control with neither is named by the renderer: "Answer", or
 * "Answer n of count" when the item holds more than one such control.
 *
 * @param interaction The Text Entry.
 * @param instance The item instance key, which scopes the author's ids.
 * @param locale The locale of the renderer's text.
 * @returns The naming attributes.
 */
const nameAttributes = (
  interaction: TextEntryPayload,
  instance: string,
  locale: Locale,
): Attributes => {
  const { ariaLabel, ariaLabelledby, unnamed } = interaction.name;

  if (Option.isSome(ariaLabel) || Option.isSome(ariaLabelledby)) {
    return {
      ...whenSome(ariaLabel, (label) => ({ "aria-label": label })),
      ...whenSome(ariaLabelledby, (ids) => ({
        "aria-labelledby": ids
          .split(idSeparator)
          .filter((id) => id !== "")
          .map((id) => authoredId(instance, id))
          .join(" "),
      })),
    };
  }

  const count = (n: number): string => new Intl.NumberFormat(locale).format(n);

  return {
    "aria-label": Option.match(unnamed.pipe(Option.filter((position) => position.count > 1)), {
      onNone: () => message(locale, "answer"),
      onSome: (position) =>
        message(locale, "answerOf", { count: count(position.count), n: count(position.n) }),
    }),
  };
};

/**
 * Compute every attribute of both parts of one Text Entry: the connect function.
 *
 * - Root: the marker, the state (`data-mode`, and `data-disabled` when the author disabled every
 *   control), and the author's `class`.
 * - Control: a text `input`; its id, the payload's `formName` and its restored `value`; `disabled`
 *   when finished; `inputmode` by the base type; `expected-length` as `size` when above 0, which
 *   HTML requires; `placeholder-text` as `placeholder`; its name; `aria-invalid` and
 *   `aria-describedby` → the message ids when the response is invalid; and `autofocus` when the
 *   payload says.
 *
 * @param interaction The Text Entry.
 * @param payload The payload, which gives the instance and `finished`.
 * @param locale The locale of the renderer's text.
 * @returns The attributes of both parts.
 */
const connect = (interaction: TextEntryPayload, payload: Payload, locale: Locale): Connected => ({
  control: {
    ...nameAttributes(interaction, payload.instance, locale),
    ...when(interaction.invalid, {
      "aria-describedby": interaction.messageIds.join(" "),
      "aria-invalid": "true",
    }),
    ...when(interaction.autofocus, { autofocus: true }),
    "data-slot": rows.control.slot,
    ...when(payload.finished, { disabled: true }),
    id: scopedId(payload.instance, interaction.response, "control"),
    ...inputModeOf(interaction),
    name: interaction.formName,
    ...whenSome(interaction.placeholder, (placeholder) => ({ placeholder })),
    ...whenSome(
      interaction.expectedLength.pipe(Option.filter((expected) => expected > 0n)),
      (expected) => ({ size: String(expected) }),
    ),
    type: "text",
    value: interaction.restore,
  },
  root: {
    ...when(interaction.class !== "", { class: interaction.class }),
    ...when(payload.finished, { "data-disabled": true }),
    "data-mode": payload.mode,
    "data-slot": rows.root.slot,
  },
});

/**
 * Render a Text Entry as spec §4.3 structures it: a `qti-text-entry-interaction` Root holding one
 * text `input` Control.
 *
 * Each part goes through `applyPart` with its replacement from `state.parts`, so every swap holds
 * I1 to I4.
 *
 * @param interaction The Text Entry's payload.
 * @param payload The payload of the whole render, which gives the instance and `finished`.
 * @param state The locale and the resolved part overrides.
 * @returns The Text Entry Root, or {@link PartSwapRefused} when a replacement breaks the swap
 *   invariant.
 */
export const renderTextEntry = (
  interaction: TextEntryPayload,
  payload: Payload,
  state: EmitState,
): Result.Result<Element, PartSwapRefused> =>
  Result.gen(function* textEntryRoot() {
    const replacement = (part: TextEntryPart) =>
      Option.getOrUndefined(state.parts.replacementFor(owner, part));
    const props = connect(interaction, payload, state.locale);
    const control = yield* applyPart(rows.control, props.control, [], replacement("control"));

    return yield* applyPart(rows.root, props.root, [control], replacement("root"));
  });

/**
 * Check a Text Entry's response, which the caller decoded.
 *
 * The caller decodes the posted entry with `decode`, under the entry name its form gave the
 * Control, the Text Entry's binding (a single value of its base type) and its `base`, and passes
 * the value, or the {@link Malformed} `decode` gave. The entry name so stays the caller's, while
 * the message and the author's override stay here.
 *
 * - A {@link Malformed} input: `malformedNumber`, or the author's `data-patternmask-message`.
 * - A decoded value: nothing more to check. `pattern-mask` never reaches here, as the item marks it
 *   unsupported.
 *
 * @param interaction The Text Entry.
 * @param input The decoded value, or why the entry did not decode.
 * @param configuration The configuration, which gives the locale.
 * @returns One message per problem, none when the response is accepted.
 */
export const validateTextEntry = (
  interaction: TextEntryInteraction,
  input: Value | Malformed,
  configuration: Configuration,
): readonly ValidationMessage[] =>
  input instanceof Malformed
    ? [
        {
          response: interaction.response,
          text: Option.getOrElse(interaction.patternMaskMessage, () =>
            message(configuration.locale, "malformedNumber"),
          ),
        },
      ]
    : [];

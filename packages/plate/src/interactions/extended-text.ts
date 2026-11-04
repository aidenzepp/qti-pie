/**
 * Extended Text (Q-5): its parts, its connect function and its response validation, on Choice's
 * module shape.
 *
 * {@link renderExtendedText} emits the structure of spec §4.3: a `qti-extended-text-interaction`
 * Root holding the Prompt, when there is one, then the Control, a native `textarea` whose only
 * child is the text to restore. The connect function computes every attribute of every part once,
 * and `applyPart` places each one, through the embedder's replacement when there is one (ruling
 * `fb4fe744` S1, S2). The browser's own textarea keys apply (§4.8): Enter adds a line and Tab
 * leaves. The Prompt's content goes through the body's {@link emitNodes}, so it gets the body's id
 * scoping, heading shift and placeholders.
 *
 * {@link validateExtendedText} checks a value the caller decoded. Phase 1 has tier (a) only: a
 * number binding refuses text that is not a number.
 *
 * @module
 */
import { Effect, Option } from "effect";
import type { Configuration } from "#plate/configuration.ts";
import { authoredId, emitNodes } from "#plate/emit/body.ts";
import type { RenderInteraction } from "#plate/emit/body.ts";
import { text } from "#plate/emit/node.ts";
import type { Attributes, Element } from "#plate/emit/node.ts";
import { rowFor, scopedId } from "#plate/emit/parts.ts";
import type { PartOf } from "#plate/emit/parts.ts";
import { applyPart } from "#plate/emit/swap.ts";
import type { PartSwapRefused } from "#plate/emit/swap.ts";
import { Malformed } from "#plate/form/encoding.ts";
import { message } from "#plate/messages.ts";
import type { Locale } from "#plate/messages.ts";
import type { ExtendedTextInteraction } from "#plate/model/item.ts";
import type { Value } from "#plate/model/values.ts";
import type { EmitState, ExtendedTextPayload, Payload, ValidationMessage } from "#plate/payload.ts";

/**
 * The owner of every Extended Text part in the part table.
 */
const owner = "extended-text-interaction";

/**
 * An Extended Text part.
 */
type ExtendedTextPart = PartOf<typeof owner>;

/**
 * The attributes of every part of one Extended Text, computed once by {@link connect}.
 */
interface Connected {
  readonly control: Attributes;
  readonly prompt: Attributes;
  readonly root: Attributes;
}

/**
 * The whitespace that separates the ids of an IDREFS value, as the body splits them.
 */
const separator = /[\t\n\f\r ]+/u;

/**
 * A line break the HTML parser turns into a line feed: CRLF, or a lone CR.
 */
const lineBreak = /\r\n?/gu;

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
 * Render an interaction met in an Extended Text's Prompt, which QTI's schema admits nowhere there:
 * a defect, since only a hand-built item can hold one.
 *
 * @param nested The interaction's payload.
 * @returns Never; it dies with an error that names the interaction.
 */
const nestedInteraction: RenderInteraction = (nested) =>
  Effect.die(
    new Error(
      `A ${nested.kind} interaction for the response ${JSON.stringify(nested.response)} sits inside an Extended Text's Prompt, where QTI's schema admits no interaction; move it out to the item body, or render an item that check accepted.`,
    ),
  );

/**
 * Compute how the Control is named (§4.8, Q10): the Prompt when there is one; else the author's
 * `aria-label` and `aria-labelledby`, each referenced id scoped as the body scopes the author's
 * ids; else the locale's "Answer", or "Answer n of N" when the item has several unnamed text
 * controls.
 *
 * @param interaction The Extended Text.
 * @param instance The item instance key.
 * @param locale The locale of the renderer's own text.
 * @param promptId The Prompt's id, none when there is no Prompt.
 * @returns The Control's naming attributes.
 */
const nameAttributes = (
  interaction: ExtendedTextPayload,
  instance: string,
  locale: Locale,
  promptId: Option.Option<string>,
): Attributes => {
  if (Option.isSome(promptId)) {
    return { "aria-labelledby": promptId.value };
  }

  const { ariaLabel, ariaLabelledby, unnamed } = interaction.name;
  if (Option.isSome(ariaLabel) || Option.isSome(ariaLabelledby)) {
    return {
      ...Option.match(ariaLabel, {
        onNone: () => ({}),
        onSome: (label) => ({ "aria-label": label }),
      }),
      ...Option.match(ariaLabelledby, {
        onNone: () => ({}),
        onSome: (ids) => ({
          "aria-labelledby": ids
            .split(separator)
            .filter((id) => id !== "")
            .map((id) => authoredId(instance, id))
            .join(" "),
        }),
      }),
    };
  }

  const count = (n: number): string => new Intl.NumberFormat(locale).format(n);

  return {
    "aria-label": unnamed.pipe(
      Option.filter((position) => position.count > 1),
      Option.match({
        onNone: () => message(locale, "answer"),
        onSome: (position) =>
          message(locale, "answerOf", { count: count(position.count), n: count(position.n) }),
      }),
    ),
  };
};

/**
 * Compute every attribute of every part of one Extended Text: the connect function.
 *
 * - Root: the marker, the state (`data-mode`, and `data-disabled` when the author disabled every
 *   control), the author's `class`, and `data-format="preformatted"` for a preformatted format.
 * - Prompt: the marker and its id, which the Control's `aria-labelledby` names.
 * - Control: its id, the payload's `formName`, `rows` from `expected-lines` above 0, the author's
 *   `placeholder-text`, `disabled` when finished, its name ({@link nameAttributes}), `aria-invalid`
 *   and `aria-describedby` → the message ids when the response is invalid, and `autofocus` when the
 *   payload says.
 *
 * Every id is `scopedId(instance, response, part)`.
 *
 * @param interaction The Extended Text.
 * @param payload The payload, which gives the instance, the mode and `finished`.
 * @param locale The locale of the renderer's own text.
 * @returns The attributes of every part.
 */
const connect = (interaction: ExtendedTextPayload, payload: Payload, locale: Locale): Connected => {
  const { instance } = payload;
  const promptId = scopedId(instance, interaction.response, "prompt");
  const named = nameAttributes(
    interaction,
    instance,
    locale,
    interaction.prompt.pipe(Option.as(promptId)),
  );

  return {
    control: {
      ...named,
      ...when(interaction.invalid, {
        "aria-describedby": interaction.messageIds.join(" "),
        "aria-invalid": "true",
      }),
      ...when(interaction.autofocus, { autofocus: true }),
      "data-slot": rowFor(owner, "control").slot,
      ...when(payload.finished, { disabled: true }),
      id: scopedId(instance, interaction.response, "control"),
      name: interaction.formName,
      ...Option.match(interaction.placeholder, {
        onNone: () => ({}),
        onSome: (placeholder) => ({ placeholder }),
      }),
      ...interaction.expectedLines.pipe(
        Option.filter((lines) => lines > 0n),
        Option.match({
          onNone: () => ({}),
          onSome: (lines) => ({ rows: String(lines) }),
        }),
      ),
    },
    prompt: { "data-slot": rowFor(owner, "prompt").slot, id: promptId },
    root: {
      ...when(interaction.class !== "", { class: interaction.class }),
      ...when(payload.finished, { "data-disabled": true }),
      ...when(interaction.format === "preformatted", { "data-format": "preformatted" }),
      "data-mode": payload.mode,
      "data-slot": rowFor(owner, "root").slot,
    },
  };
};

/**
 * Render an Extended Text as spec §4.3 structures it: a `qti-extended-text-interaction` Root
 * holding the Prompt, when there is one, then the Control, a `textarea`.
 *
 * The Control's only child is the text to restore, its line breaks written as line feeds, as the
 * HTML parser reads them; it has no child when that text is empty. Each part goes through
 * `applyPart` with its replacement from `state.parts`, so every swap holds I1 to I4. The Prompt's
 * content goes through {@link emitNodes}, as the body's does.
 *
 * @param interaction The Extended Text's payload.
 * @param payload The payload of the whole render, which gives the instance and `finished`.
 * @param state The locale, the heading level and the resolved part overrides.
 * @returns The Extended Text Root, or {@link PartSwapRefused} when a replacement breaks the swap
 *   invariant. It dies when the Prompt holds an interaction, which QTI admits nowhere there.
 */
export const renderExtendedText = Effect.fnUntraced(function* renderExtendedText(
  interaction: ExtendedTextPayload,
  payload: Payload,
  state: EmitState,
): Effect.fn.Return<Element, PartSwapRefused> {
  const replacement = (part: ExtendedTextPart) =>
    Option.getOrUndefined(state.parts.replacementFor(owner, part));
  const props = connect(interaction, payload, state.locale);
  const restore = interaction.restore.replaceAll(lineBreak, "\n");

  const prompt = yield* Effect.transposeOption(
    interaction.prompt.pipe(
      Option.map((content) =>
        emitNodes(content, payload, state, nestedInteraction).pipe(
          Effect.flatMap((nodes) =>
            applyPart(rowFor(owner, "prompt"), props.prompt, nodes, replacement("prompt")),
          ),
        ),
      ),
    ),
  );
  const control = yield* applyPart(
    rowFor(owner, "control"),
    props.control,
    restore === "" ? [] : [text(restore)],
    replacement("control"),
  );

  return yield* applyPart(
    rowFor(owner, "root"),
    props.root,
    [...Option.toArray(prompt), control],
    replacement("root"),
  );
});

/**
 * Check an Extended Text's response, which the caller decoded.
 *
 * The caller decodes the posted entries with `decode`, under the entry name its form gave the
 * Control and the Extended Text's binding (a single value of its base type, an integer read in its
 * `base`), and passes the value, or the {@link Malformed} `decode` gave. Phase 1 checks tier (a)
 * only, and a decoded value passes it.
 *
 * - A {@link Malformed} input of an `integer` or `float` binding: `malformedNumber`, or the author's
 *   `data-patternmask-message` when set.
 * - A {@link Malformed} input of a `string` binding, which a native form never posts (two entries, or
 *   a file): `notAccepted`.
 *
 * @param interaction The Extended Text.
 * @param input The decoded value, or why the entries did not decode.
 * @param configuration The configuration, which gives the locale.
 * @returns One message per problem, none when the response is accepted.
 */
export const validateExtendedText = (
  interaction: ExtendedTextInteraction,
  input: Value | Malformed,
  configuration: Configuration,
): readonly ValidationMessage[] => {
  if (!(input instanceof Malformed)) {
    return [];
  }

  const { locale } = configuration;
  const words =
    interaction.baseType === "string"
      ? message(locale, "notAccepted")
      : Option.getOrElse(interaction.patternMaskMessage, () => message(locale, "malformedNumber"));

  return [{ response: interaction.response, text: words }];
};

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
 * scoping, heading shift, URLs and Notices.
 *
 * An `xhtml` Extended Text is presented the same way, its Control marked `data-format="xhtml"`: a
 * plain textarea whose response is the text typed, a `string`. Plate never renders that text as
 * markup; a restored value is the textarea's text, which the serialiser escapes (Q21: rich-text
 * editing needs script).
 *
 * {@link validateExtendedText} checks a value the caller decoded. Tier (a): a number binding
 * refuses text that is not a number, and every binding refuses a file or a second entry, which a
 * native textarea never posts. Tier (b), under `validateResponses`: the `pattern-mask`, through
 * {@link patternMessage}.
 *
 * @module
 */
import { Option, Result } from "effect";
import type { Configuration } from "#plate/configuration.ts";
import { emitNodes, nestedInteraction } from "#plate/emit/body.ts";
import { text, when } from "#plate/emit/node.ts";
import type { Attributes, Element } from "#plate/emit/node.ts";
import { rowFor, scopedId } from "#plate/emit/parts.ts";
import type { PartOf, PartRow } from "#plate/emit/parts.ts";
import { applyPart } from "#plate/emit/swap.ts";
import type { PartSwapRefused } from "#plate/emit/swap.ts";
import { Malformed } from "#plate/form/encoding.ts";
import { textControlName } from "#plate/interactions/name.ts";
import { patternMessage } from "#plate/interactions/pattern.ts";
import { message } from "#plate/messages.ts";
import type { Locale, MessageKey } from "#plate/messages.ts";
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
 * The row of every Extended Text part.
 */
type Rows = { readonly [P in ExtendedTextPart]: PartRow };

/**
 * The attributes of every part of one Extended Text, computed once by {@link connect}.
 */
interface Connected {
  readonly control: Attributes;
  readonly prompt: Attributes;
  readonly root: Attributes;
}

/**
 * The rows of the Extended Text parts, which no placement changes.
 */
const rows: Rows = {
  control: rowFor(owner, "control"),
  prompt: rowFor(owner, "prompt"),
  root: rowFor(owner, "root"),
};

/**
 * A line break the HTML parser turns into a line feed: CRLF, or a lone CR.
 */
const lineBreak = /\r\n?/gu;

/**
 * Compute how the Control is named (§4.8, Q10): the Prompt when there is one; else as any text
 * control is named ({@link textControlName}): the author's `aria-label` and `aria-labelledby`,
 * else the locale's "Answer", or "Answer n of N" when the item has several unnamed text controls.
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
): Attributes =>
  Option.match(promptId, {
    onNone: () => textControlName(interaction.name, instance, locale),
    onSome: (id) => ({ "aria-labelledby": id }),
  });

/**
 * Compute every attribute of every part of one Extended Text: the connect function.
 *
 * - Root: the marker, the state (`data-mode`, and `data-disabled` when the author disabled every
 *   control), the author's `class`, and `data-format="preformatted"` for a preformatted format.
 * - Prompt: the marker and its id, which the Control's `aria-labelledby` names.
 * - Control: its id, the payload's `formName`, `rows` from `expected-lines` above 0, the author's
 *   `placeholder-text`, `disabled` when finished, its name ({@link nameAttributes}), `aria-invalid`
 *   and `aria-describedby` → the message ids when the response is invalid, `autofocus` when the
 *   payload says, and `data-format="xhtml"` for the `xhtml` format.
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
      ...when(interaction.format === "xhtml", { "data-format": "xhtml" }),
      "data-slot": rows.control.slot,
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
    prompt: { "data-slot": rows.prompt.slot, id: promptId },
    root: {
      ...when(interaction.class !== "", { class: interaction.class }),
      ...when(payload.finished, { "data-disabled": true }),
      ...when(interaction.format === "preformatted", { "data-format": "preformatted" }),
      "data-mode": payload.mode,
      "data-slot": rows.root.slot,
    },
  };
};

/**
 * Render an Extended Text as spec §4.3 structures it: a `qti-extended-text-interaction` Root
 * holding the Prompt, when there is one, then the Control, a `textarea`.
 *
 * The Control's only child is the text to restore, its line breaks written as line feeds, as the
 * HTML parser reads them; it has no child when that text is empty. That child is text in every
 * format, `xhtml` included, so markup an author or candidate typed is written escaped. Each part
 * goes through `applyPart` with its replacement from `state.parts`, so every swap holds I1 to I4.
 * The Prompt's content goes through {@link emitNodes}, as the body's does.
 *
 * @param interaction The Extended Text's payload.
 * @param payload The payload of the whole render, which gives the instance and `finished`.
 * @param state The locale, the heading level and the resolved part overrides.
 * @returns The Extended Text Root, or {@link PartSwapRefused} when a replacement breaks the swap
 *   invariant.
 * @throws {NestedInteractionDefect} When the Prompt holds an interaction, which QTI admits nowhere
 *   there ({@link nestedInteraction}).
 */
export const renderExtendedText = (
  interaction: ExtendedTextPayload,
  payload: Payload,
  state: EmitState,
): Result.Result<Element, PartSwapRefused> =>
  Result.gen(function* extendedTextRoot() {
    const replacement = (part: ExtendedTextPart) =>
      Option.getOrUndefined(state.parts.replacementFor(owner, part));
    const props = connect(interaction, payload, state.locale);
    const restore = interaction.restore.replaceAll(lineBreak, "\n");

    const prompt = yield* Result.transposeOption(
      interaction.prompt.pipe(
        Option.map((content) =>
          Result.flatMap(emitNodes(content, payload, state, nestedInteraction(owner)), (nodes) =>
            applyPart(rows.prompt, props.prompt, nodes, replacement("prompt")),
          ),
        ),
      ),
    );
    const control = yield* applyPart(
      rows.control,
      props.control,
      restore === "" ? [] : [text(restore)],
      replacement("control"),
    );

    return yield* applyPart(
      rows.root,
      props.root,
      [...Option.toArray(prompt), control],
      replacement("root"),
    );
  });

/**
 * The message a string Extended Text gives for each reason its entries did not decode.
 *
 * `decode` keeps a string as posted, so for one it fails only as `file` (a file was posted) or
 * `single-many` (the entry was posted twice), each with its own message. `number` and `identifier`,
 * which only a {@link Malformed} built by hand carries here, get the general `notAccepted`.
 */
const stringRefusals = {
  file: "malformedFile",
  identifier: "notAccepted",
  number: "notAccepted",
  "single-many": "malformedSingleMany",
} as const satisfies Readonly<Record<Malformed["reason"], MessageKey>>;

/**
 * Check an Extended Text's response, which the caller decoded.
 *
 * The caller decodes the posted entries with `decode`, under the entry name its form gave the
 * Control and the Extended Text's binding (a single value of its base type, an integer read in its
 * `base`), and passes the value, or the {@link Malformed} `decode` gave.
 *
 * - A {@link Malformed} input of an `integer` or `float` binding: `malformedNumber`, or the author's
 *   `data-patternmask-message` when set.
 * - A {@link Malformed} input of a `string` binding, which a native form never posts: the message of
 *   its reason, `malformedFile` for a file and `malformedSingleMany` for a second entry.
 * - A decoded value passes tier (a). Under `validateResponses` it is checked against the
 *   `pattern-mask` ({@link patternMessage}): a mismatch gives the author's
 *   `data-patternmask-message`, else `patternMismatch`. NULL is not checked.
 *
 * @param interaction The Extended Text.
 * @param input The decoded value, or why the entries did not decode.
 * @param configuration The configuration, which gives `validateResponses` and the locale.
 * @returns One message per problem, none when the response is accepted.
 */
export const validateExtendedText = (
  interaction: ExtendedTextInteraction,
  input: Value | Malformed,
  configuration: Configuration,
): readonly ValidationMessage[] => {
  if (!(input instanceof Malformed)) {
    return Option.toArray(
      Option.map(patternMessage(interaction, input, configuration), (mismatch) => ({
        response: interaction.response,
        text: mismatch,
      })),
    );
  }

  const { locale } = configuration;
  const words =
    interaction.baseType === "string"
      ? message(locale, stringRefusals[input.reason])
      : Option.getOrElse(interaction.patternMaskMessage, () => message(locale, "malformedNumber"));

  return [{ response: interaction.response, text: words }];
};

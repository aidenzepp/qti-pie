/**
 * Choice (Q-2), the discovery interaction: its parts, its connect function, its response
 * validation and its control-to-entry mapping, the module shape Text Entry and Extended Text copy.
 *
 * {@link renderChoice} emits the structure of spec §4.3: a native `fieldset` Root, the Prompt, and a
 * `ul` of Choices, each `li > [Control, Label > [Indicator, …choice content]]`. The connect
 * function computes every attribute of every part once, and `applyPart` places each one, through
 * the embedder's replacement when there is one (ruling `fb4fe744` S1, S2). The Controls are native
 * radios or checkboxes, so the browser's own keyboard map applies (§4.8): the radios form one
 * native group by their shared `name`.
 *
 * {@link validateChoice} decodes the posted entries and checks them in two tiers: tier (a) always,
 * tier (b) only under `validateResponses` (D5).
 *
 * @module
 */
import { Effect, Option, Result, pipe } from "effect";
import type { Configuration } from "#plate/configuration.ts";
import { h, text } from "#plate/emit/node.ts";
import type { Attributes, Element, Node } from "#plate/emit/node.ts";
import { promptMarkupFor, rowFor, scopedId } from "#plate/emit/parts.ts";
import type { PartOf, PartRow, PromptMarkup, Resolved, RowContext } from "#plate/emit/parts.ts";
import { applyPart } from "#plate/emit/swap.ts";
import type { PartSwapRefused } from "#plate/emit/swap.ts";
import { decode, entryName } from "#plate/form/encoding.ts";
import type { Binding, Entry } from "#plate/form/encoding.ts";
import { message } from "#plate/messages.ts";
import type { Locale } from "#plate/messages.ts";
import type { ChoiceInteraction } from "#plate/model/item.ts";
import { format, nullOf } from "#plate/model/values.ts";
import type {
  AttributePayload,
  ChoicePayload,
  EmitState,
  InteractionPayload,
  Payload,
  PayloadNode,
  Validation,
  ValidationMessage,
} from "#plate/payload.ts";

/**
 * The owner of every Choice part in the part table.
 */
const owner = "choice-interaction";

/**
 * A Choice part.
 */
type ChoicePart = PartOf<typeof owner>;

/**
 * The row of every Choice part as placed, the Root's and the Prompt's set by the Prompt's markup.
 */
type Rows = { readonly [P in ChoicePart]: PartRow };

/**
 * The attributes the connect function computes for one choice's parts, beside the content its
 * Label holds.
 */
interface ChoiceItem {
  readonly choice: Attributes;
  readonly content: readonly PayloadNode[];
  readonly control: Attributes;
  readonly indicator: Attributes;
  readonly label: Attributes;
}

/**
 * The attributes of every part of one Choice, computed once by {@link connect}.
 */
interface Connected {
  readonly choices: Attributes;
  /**
   * One per choice, in document order.
   */
  readonly items: readonly ChoiceItem[];
  readonly prompt: Attributes;
  readonly root: Attributes;
}

/**
 * What emitting Choice content needs: the instance that scopes authored ids, the locale of the
 * Notice's text, and the replacement for the Notice part.
 */
interface ContentContext {
  readonly instance: string;
  readonly locale: Locale;
  readonly parts: Resolved;
}

/**
 * The attributes of a body element whose value is a list of ids, which name authored ids and so
 * are scoped as those ids are.
 */
const idRefAttributes: ReadonlySet<string> = new Set([
  "aria-activedescendant",
  "aria-describedby",
  "aria-labelledby",
  "aria-owns",
  "headers",
]);

/**
 * The QTI element of each interaction kind, which names the Notice that stands for an interaction
 * nested in a Prompt or a choice. QTI's schema admits none there, so only a hand-built item holds
 * one.
 */
const interactionElements = {
  choice: "qti-choice-interaction",
  "extended-text": "qti-extended-text-interaction",
  "text-entry": "qti-text-entry-interaction",
} satisfies { readonly [K in InteractionPayload["kind"]]: string };

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
 * Map a Choice to the form entries its Controls post: the control-to-entry mapping that names the
 * Controls and decodes what they post.
 *
 * @param interaction The Choice's response identifier and cardinality.
 * @param instance The item instance key.
 * @returns The binding: identifiers, under `entryName(instance, response)`.
 */
const bindingOf = (
  interaction: Pick<ChoiceInteraction, "cardinality" | "response">,
  instance: string,
): Binding => ({
  baseType: "identifier",
  cardinality: interaction.cardinality,
  name: entryName(instance, interaction.response),
});

/**
 * Scope an authored id by the item instance, as the body's authored ids are: `<instance>--<id>`.
 *
 * The empty segment keeps an authored id apart from every id the emitter builds, such as
 * `<instance>-RESPONSE-control-0`.
 *
 * @param instance The item instance key.
 * @param id The authored id.
 * @returns The scoped id.
 */
const authoredId = (instance: string, id: string): string => scopedId(instance, "", id);

/**
 * Convert a body element's attributes into the output's: `xml:lang` becomes `lang`, an authored id
 * and each id an id list names are scoped by the instance, and an event-handler attribute, which
 * the serialiser refuses, is dropped.
 *
 * @param attributes The attributes as the payload holds them.
 * @param instance The item instance key.
 * @returns The element's attributes.
 */
const contentAttributes = (attributes: readonly AttributePayload[], instance: string): Attributes =>
  Object.fromEntries(
    attributes.flatMap(({ name, value }): readonly (readonly [string, string])[] => {
      if (/^on/iu.test(name)) {
        return [];
      }

      if (name === "xml:lang") {
        return [["lang", value]];
      }

      if (name === "id") {
        return [[name, authoredId(instance, value)]];
      }

      if (idRefAttributes.has(name)) {
        const ids = value.split(/[\t\n\f\r ]+/u).filter((id) => id !== "");

        return [[name, ids.map((id) => authoredId(instance, id)).join(" ")]];
      }

      return [[name, value]];
    }),
  );

/**
 * Construct the Notice part for a feature inside a Prompt or a choice, always at a phrasing
 * position.
 *
 * A Label holds phrasing content, and a Notice placed as phrasing never pushes a phrasing Prompt
 * out of the `legend` markup that {@link promptMarkupFor} reads from the emitted content.
 *
 * @param feature The feature's key in QTI's own spelling.
 * @param context The locale and the Notice's replacement.
 * @returns The Notice, a `span` by default.
 */
const notice = (
  feature: string,
  context: ContentContext,
): Effect.Effect<Element, PartSwapRefused> => {
  const row = rowFor("item", "notice", { position: "phrasing" });

  return applyPart(
    row,
    { "data-slot": row.slot, role: "note" },
    [text(message(context.locale, "notice", { feature }))],
    Option.getOrUndefined(context.parts.replacementFor("item", "notice")),
  );
};

/**
 * Emit the content of a Prompt or a choice, in order.
 *
 * @param nodes The content as the payload holds it.
 * @param context The instance, locale and Notice replacement.
 * @returns The output nodes.
 */
const emitContent = (
  nodes: readonly PayloadNode[],
  context: ContentContext,
): Effect.Effect<readonly Node[], PartSwapRefused> =>
  pipe(
    nodes,
    // oxlint-disable-next-line eslint/no-use-before-define -- `emitContent` and `emitNode` are mutually recursive, as elements nest; the call runs only after both are defined.
    Effect.forEach((node) => emitNode(node, context)),
  );

/**
 * Emit one node of a Prompt's or a choice's content.
 *
 * @param node The node as the payload holds it.
 * @param context The instance, locale and Notice replacement.
 * @returns The output node: text as itself, an element with its attributes converted, and a
 *   notice, or an interaction nested where QTI admits none, as the Notice part.
 */
const emitNode = (
  node: PayloadNode,
  context: ContentContext,
): Effect.Effect<Node, PartSwapRefused> => {
  switch (node.kind) {
    case "text": {
      return Effect.succeed(text(node.text));
    }
    case "element": {
      return emitContent(node.children, context).pipe(
        Effect.map((children) =>
          h(node.tag, contentAttributes(node.attributes, context.instance), children),
        ),
      );
    }
    case "notice": {
      return notice(node.feature, context);
    }
    case "choice":
    case "extended-text":
    case "text-entry": {
      return notice(interactionElements[node.kind], context);
    }
    default: {
      return node satisfies never;
    }
  }
};

/**
 * Give the row of every Choice part for a Prompt markup.
 *
 * @param markup The Prompt's markup, none when the Choice has no Prompt.
 * @returns The rows; the Root and Prompt rows follow the markup, the table's when there is none.
 */
const rowsFor = (markup: Option.Option<PromptMarkup>): Rows => {
  const context: RowContext = Option.match(markup, {
    onNone: () => ({}),
    onSome: (promptMarkup) => ({ promptMarkup }),
  });

  return {
    choice: rowFor(owner, "choice"),
    choices: rowFor(owner, "choices"),
    control: rowFor(owner, "control"),
    indicator: rowFor(owner, "indicator"),
    label: rowFor(owner, "label"),
    prompt: rowFor(owner, "prompt", context),
    root: rowFor(owner, "root", context),
  };
};

/**
 * Compute every attribute of every part of one Choice: the connect function.
 *
 * - Root: the marker, the session state (`data-mode`, `data-attempt`, `data-finished`), the author's
 *   `class`, `data-orientation`, and `aria-labelledby` → the Prompt's id under the `labelledby`
 *   markup. It carries no `role`: a native `fieldset` is the group.
 * - Prompt: the marker, and its id under the `labelledby` markup; a `legend` names its group natively
 *   and needs none.
 * - Control: a radio when one choice can be posted (`max-choices` 1, or a single response), else a
 *   checkbox; its id, name and value; `checked` from the restore; `disabled` when finished;
 *   `aria-labelledby` → its Label; `aria-invalid` and `aria-describedby` → the message ids when the
 *   response is invalid; and `autofocus` on the first Control when the payload says.
 * - Indicator: `aria-hidden="true"`. Label: its id, and `for` → its Control.
 *
 * Every id is `scopedId(instance, response, part, index)`.
 *
 * @param interaction The Choice.
 * @param payload The payload, which gives the instance and the session state.
 * @param rows The rows of the Choice's parts as placed.
 * @param markup The Prompt's markup, none when there is no Prompt.
 * @returns The attributes of every part.
 */
const connect = (
  interaction: ChoicePayload,
  payload: Payload,
  rows: Rows,
  markup: Option.Option<PromptMarkup>,
): Connected => {
  const { instance } = payload;
  const promptId = scopedId(instance, interaction.response, "prompt");
  const labelledby = Option.contains(markup, "labelledby");
  const type =
    interaction.maxChoices === 1 || interaction.cardinality === "single" ? "radio" : "checkbox";
  const { name } = bindingOf(interaction, instance);

  return {
    choices: { "data-slot": rows.choices.slot },
    items: interaction.choices.map((choice, index) => {
      const controlId = scopedId(instance, interaction.response, "control", index);
      const labelId = scopedId(instance, interaction.response, "label", index);

      return {
        choice: { "data-slot": rows.choice.slot },
        content: choice.content,
        control: {
          "aria-labelledby": labelId,
          ...when(interaction.invalid, {
            "aria-describedby": interaction.messageIds.join(" "),
            "aria-invalid": "true",
          }),
          ...when(interaction.autofocus && index === 0, { autofocus: true }),
          ...when(interaction.restore.includes(choice.identifier), { checked: true }),
          "data-slot": rows.control.slot,
          ...when(payload.finished, { disabled: true }),
          id: controlId,
          name,
          type,
          value: choice.identifier,
        },
        indicator: { "aria-hidden": "true", "data-slot": rows.indicator.slot },
        label: { "data-slot": rows.label.slot, for: controlId, id: labelId },
      };
    }),
    prompt: { "data-slot": rows.prompt.slot, ...when(labelledby, { id: promptId }) },
    root: {
      ...when(labelledby, { "aria-labelledby": promptId }),
      ...when(interaction.class !== "", { class: interaction.class }),
      "data-attempt": payload.attempt,
      ...when(payload.finished, { "data-finished": true }),
      "data-mode": payload.mode,
      ...Option.match(interaction.orientation, {
        onNone: () => ({}),
        onSome: (orientation) => ({ "data-orientation": orientation }),
      }),
      "data-slot": rows.root.slot,
    },
  };
};

/**
 * Render a Choice as spec §4.3 structures it: a `fieldset` Root holding the Prompt, when there is
 * one, then a `ul` of Choices, each `li > [Control, Label > [Indicator, …choice content]]`.
 *
 * The Prompt's markup is picked from its emitted content (rule `efed9867`): a Prompt of phrasing
 * content is the Root's first child, a `legend`; any other is a `qti-prompt` the Root names through
 * `aria-labelledby`. Choices render in document order, whatever `shuffle` says. Each part goes
 * through `applyPart` with its replacement from `state.parts`, so every swap holds I1 to I4.
 *
 * @param interaction The Choice's payload.
 * @param payload The payload of the whole render, which gives the instance and the session state.
 * @param state The locale and the resolved part overrides.
 * @returns The Choice Root, or {@link PartSwapRefused} when a replacement breaks the swap
 *   invariant.
 */
export const renderChoice = Effect.fnUntraced(function* renderChoice(
  interaction: ChoicePayload,
  payload: Payload,
  state: EmitState,
): Effect.fn.Return<Element, PartSwapRefused> {
  const context: ContentContext = {
    instance: payload.instance,
    locale: state.locale,
    parts: state.parts,
  };
  const replacement = (part: ChoicePart) =>
    Option.getOrUndefined(state.parts.replacementFor(owner, part));
  const promptContent = yield* Effect.transposeOption(
    interaction.prompt.pipe(Option.map((nodes) => emitContent(nodes, context))),
  );
  const markup = promptContent.pipe(Option.map(promptMarkupFor));
  const rows = rowsFor(markup);
  const props = connect(interaction, payload, rows, markup);

  const choices = yield* pipe(
    props.items,
    Effect.forEach((item) =>
      Effect.gen(function* choiceItem() {
        const content = yield* emitContent(item.content, context);
        const indicator = yield* applyPart(
          rows.indicator,
          item.indicator,
          [],
          replacement("indicator"),
        );
        const label = yield* applyPart(
          rows.label,
          item.label,
          [indicator, ...content],
          replacement("label"),
        );
        const control = yield* applyPart(rows.control, item.control, [], replacement("control"));

        return yield* applyPart(rows.choice, item.choice, [control, label], replacement("choice"));
      }),
    ),
  );
  const list = yield* applyPart(rows.choices, props.choices, choices, replacement("choices"));
  const prompt = yield* Effect.transposeOption(
    promptContent.pipe(
      Option.map((content) => applyPart(rows.prompt, props.prompt, content, replacement("prompt"))),
    ),
  );

  return yield* applyPart(
    rows.root,
    props.root,
    [...Option.toArray(prompt), list],
    replacement("root"),
  );
});

/**
 * Validate the entries posted for a Choice's response, in two tiers.
 *
 * Only the entries named for this response are read, decoded as identifiers of its cardinality.
 *
 * - Tier (a), always: every identifier names a presented choice and none repeats (`unknownChoice`); a
 *   single response takes at most one entry, and `max-choices` above 0 caps the count whatever
 *   `validateResponses` says (D5; `atMost`).
 * - Tier (b), only under `validateResponses`: `min-choices` (`atLeast`).
 *
 * The author's `data-max-selections-message` and `data-min-selections-message` replace the
 * renderer's text for `atMost` and `atLeast`.
 *
 * @param interaction The Choice.
 * @param entries The entries posted for this item instance.
 * @param configuration The configuration, which gives the locale and `validateResponses`.
 * @param instance The item instance key, which names the response's entries.
 * @returns The decoded value, NULL when the entries do not decode, and one message per problem,
 *   none when the response is accepted.
 */
export const validateChoice = (
  interaction: ChoiceInteraction,
  entries: readonly Entry[],
  configuration: Configuration,
  instance: string,
): Validation => {
  const { locale } = configuration;
  const say = (words: string): ValidationMessage => ({
    response: interaction.response,
    text: words,
  });
  const count = (n: number): string => new Intl.NumberFormat(locale).format(n);
  const tooMany = (n: number) =>
    say(
      Option.getOrElse(interaction.messages.max, () => message(locale, "atMost", { n: count(n) })),
    );
  const tooFew = (n: number) =>
    say(
      Option.getOrElse(interaction.messages.min, () => message(locale, "atLeast", { n: count(n) })),
    );
  const unknown = say(message(locale, "unknownChoice"));

  // `decode` only succeeds or fails, synchronously, so running it here cannot throw or suspend.
  return Result.match(
    Effect.runSync(Effect.result(decode(entries, bindingOf(interaction, instance)))),
    {
      onFailure: (malformed) => ({
        messages: [malformed.reason === "single-many" ? tooMany(1) : unknown],
        value: nullOf("identifier", interaction.cardinality),
      }),
      onSuccess: (value) => {
        const presented = new Set(interaction.choices.map((choice) => choice.identifier));
        const chosen = value.values.map(format);
        const stray = chosen.some((identifier) => !presented.has(identifier));
        const repeated = new Set(chosen).size < chosen.length;

        return {
          messages: [
            ...(stray || repeated ? [unknown] : []),
            ...(interaction.maxChoices > 0 && chosen.length > interaction.maxChoices
              ? [tooMany(interaction.maxChoices)]
              : []),
            ...(configuration.validateResponses && chosen.length < interaction.minChoices
              ? [tooFew(interaction.minChoices)]
              : []),
          ],
          value,
        };
      },
    },
  );
};

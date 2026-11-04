/**
 * The payload: the allowlist of what the emitter may know about an item and its session.
 *
 * {@link payload} is the only input the emitter receives. It copies each field it names out of the
 * item model and the record, one by one, and never spreads a model object, so a field the model
 * gains reaches the page only when this file names it. Nothing here holds a correct response, a
 * mapping, a processing rule, the seed, a template value or feedback content: what the page
 * cannot be given, it cannot leak.
 *
 * @module
 * @see {@link Item} for the model it reads.
 */
import { Array as Arr, Option } from "effect";
import { scopedId } from "#plate/emit/parts.ts";
import type { Resolved } from "#plate/emit/parts.ts";
import type { Locale } from "#plate/messages.ts";
import type {
  BodyNode,
  ChoiceInteraction,
  ExtendedTextInteraction,
  Item,
  TextEntryInteraction,
} from "#plate/model/item.ts";
import type { ItemRecord } from "#plate/model/record.ts";
import { format } from "#plate/model/values.ts";
import type { Single, Value } from "#plate/model/values.ts";

/**
 * A message response validation gives one response, in the locale's text or the author's.
 */
export interface ValidationMessage {
  /**
   * The identifier of the response it concerns.
   */
  readonly response: string;
  readonly text: string;
}

/**
 * What an interaction's response validation makes of its posted entries: the decoded value, and a
 * message for each problem, none when the value is accepted.
 */
export interface Validation {
  readonly messages: readonly ValidationMessage[];
  readonly value: Value;
}

/**
 * How one render was asked for: the state of the attempt it follows and what that submit left.
 *
 * `posted` holds the raw strings posted for each response, keyed by response identifier, and is
 * read only after a refused submit, so the candidate sees what they typed. `messages` are the
 * refused submit's validation messages. `locale` is the configuration's, the language of an item
 * that names none.
 */
export interface View {
  readonly attempt: "none" | "refused" | "submitted";
  /**
   * Whether `max-attempts` is reached, so every control is disabled.
   */
  readonly finished: boolean;
  readonly locale: Locale;
  readonly messages: readonly ValidationMessage[];
  readonly posted: Option.Option<ReadonlyMap<string, readonly string[]>>;
}

/**
 * What the emitter needs beyond the payload: the locale, the base heading level, the form's
 * `action`, the base package-relative URLs resolve against, and the resolved part overrides.
 */
export interface EmitState {
  readonly action: string;
  readonly assetBase: string;
  readonly headingLevel: number;
  readonly locale: Locale;
  readonly parts: Resolved;
}

/**
 * A validation message with the id its Message part carries and each Control it concerns names in
 * `aria-describedby`.
 */
export interface MessagePayload extends ValidationMessage {
  /**
   * `scopedId(instance, response, "message", n)`, where `n` counts this response's messages from
   * 0.
   */
  readonly id: string;
}

/**
 * An attribute of a body element, `xml:lang` under the name `xml:lang`.
 */
export interface AttributePayload {
  readonly name: string;
  readonly value: string;
}

/**
 * An HTML element of the item body with its attributes as the model kept them.
 */
export interface ElementPayload {
  readonly attributes: readonly AttributePayload[];
  readonly children: readonly PayloadNode[];
  readonly kind: "element";
  readonly tag: string;
}

/**
 * A run of body text, whitespace included.
 */
export interface TextPayload {
  readonly kind: "text";
  readonly text: string;
}

/**
 * A body part phase 1 does not render, which the emitter shows as the Notice part.
 */
export interface NoticePayload {
  /**
   * The feature's key in QTI's own spelling, such as `qti-hotspot-interaction`.
   */
  readonly feature: string;
  readonly kind: "notice";
}

/**
 * What every interaction payload says about the last submit's validation of its response.
 *
 * `invalid` holds when its response has a message, and `messageIds` names those messages in order.
 * `autofocus` holds on the first interaction in document order with a message, after a refused
 * submit only; its connect function writes `autofocus` on that interaction's first Control.
 */
export interface ValidationPayload {
  readonly autofocus: boolean;
  readonly invalid: boolean;
  readonly messageIds: readonly string[];
}

/**
 * A Choice as the page may know it (Q-2): its binding, its constraints, its Prompt, its choices in
 * document order, and the identifiers to show as checked.
 */
export interface ChoicePayload extends ValidationPayload {
  readonly cardinality: "multiple" | "single";
  readonly choices: readonly {
    readonly content: readonly PayloadNode[];
    readonly identifier: string;
  }[];
  /**
   * The author's `class` value, empty when absent.
   */
  readonly class: string;
  readonly kind: "choice";
  readonly maxChoices: number;
  readonly minChoices: number;
  readonly orientation: Option.Option<string>;
  readonly prompt: Option.Option<readonly PayloadNode[]>;
  /**
   * The identifier of the response it binds.
   */
  readonly response: string;
  readonly restore: readonly string[];
}

/**
 * How a text control is named (§4.8, Q10).
 *
 * `ariaLabel` and `ariaLabelledby` are the author's, the ids unscoped. `unnamed` is set exactly
 * when the control has neither of them nor a Prompt: its position `n`, from 1, among the `count`
 * such controls of the item, in document order.
 */
export interface TextName {
  readonly ariaLabel: Option.Option<string>;
  readonly ariaLabelledby: Option.Option<string>;
  readonly unnamed: Option.Option<{ readonly count: number; readonly n: number }>;
}

/**
 * What a Text Entry and an Extended Text share: the binding, the integer `base`, the placeholder,
 * the name and the text to restore.
 */
export interface TextControlPayload extends ValidationPayload {
  readonly base: number;
  readonly baseType: "float" | "integer" | "string";
  /**
   * The author's `class` value, empty when absent.
   */
  readonly class: string;
  readonly name: TextName;
  /**
   * `placeholder-text`.
   */
  readonly placeholder: Option.Option<string>;
  /**
   * The identifier of the response it binds.
   */
  readonly response: string;
  /**
   * The text the control shows: the string posted after a refused submit, else the recorded
   * value written in its lexical form, an integer in `base`; empty for NULL.
   */
  readonly restore: string;
}

/**
 * A Text Entry as the page may know it (Q-20).
 */
export interface TextEntryPayload extends TextControlPayload {
  readonly expectedLength: Option.Option<number>;
  readonly kind: "text-entry";
}

/**
 * An Extended Text as the page may know it (Q-5): a text control with `expected-lines`, a
 * `format` and a Prompt.
 */
export interface ExtendedTextPayload extends TextControlPayload {
  readonly expectedLines: Option.Option<number>;
  readonly format: "plain" | "preformatted";
  readonly kind: "extended-text";
  readonly prompt: Option.Option<readonly PayloadNode[]>;
}

/**
 * An interaction payload, which the emitter hands to its interaction's render function.
 */
export type InteractionPayload = ChoicePayload | ExtendedTextPayload | TextEntryPayload;

/**
 * A node of the payload's body.
 */
export type PayloadNode = ElementPayload | InteractionPayload | NoticePayload | TextPayload;

/**
 * Everything the emitter may know about one render of an item.
 *
 * `lang` is the item's `xml:lang`, else the view's locale. `score` is `SCORE` written in its
 * lexical form, set when `SCORE` is declared, the attempt was submitted and response processing
 * ran. `recorded` holds for a submitted attempt of an item with no response processing.
 * `notices` names the unsupported features the body shows as notices.
 */
export interface Payload {
  readonly attempt: View["attempt"];
  readonly body: readonly PayloadNode[];
  readonly finished: boolean;
  /**
   * The item instance key, which scopes every id and entry name.
   */
  readonly instance: string;
  readonly lang: string;
  readonly messages: readonly MessagePayload[];
  readonly mode: "answering";
  readonly notices: readonly string[];
  readonly recorded: boolean;
  readonly score: Option.Option<string>;
  readonly title: string;
}

/**
 * An interaction of the item model.
 */
type Interaction = ChoiceInteraction | ExtendedTextInteraction | TextEntryInteraction;

/**
 * What one payload build knows about the whole item while it copies one node.
 */
interface Build {
  /**
   * The interaction whose first Control takes `autofocus`, if any.
   */
  readonly autofocus: Option.Option<Interaction>;
  readonly messages: readonly MessagePayload[];
  /**
   * The posted strings to restore, set only after a refused submit.
   */
  readonly posted: Option.Option<ReadonlyMap<string, readonly string[]>>;
  readonly responses: ItemRecord["responses"];
  /**
   * The text controls with no authored name and no Prompt, in document order.
   */
  readonly unnamed: readonly Interaction[];
}

/**
 * Collect the interactions of body nodes in document order, inside elements, Prompts and choices.
 *
 * @param nodes The body nodes.
 * @returns The interactions.
 */
const interactionsIn = (nodes: readonly BodyNode[]): readonly Interaction[] =>
  nodes.flatMap((node): readonly Interaction[] => {
    switch (node.kind) {
      case "element": {
        return interactionsIn(node.children);
      }
      case "choice": {
        return [
          node,
          ...interactionsIn(Option.getOrElse(node.prompt, () => [])),
          ...node.choices.flatMap((choice) => interactionsIn(choice.content)),
        ];
      }
      case "extended-text": {
        return [node, ...interactionsIn(Option.getOrElse(node.prompt, () => []))];
      }
      case "text-entry": {
        return [node];
      }
      case "text":
      case "unsupported": {
        return [];
      }
      default: {
        return node satisfies never;
      }
    }
  });

/**
 * Report whether an interaction is a text control with no authored name and no Prompt (Q10).
 *
 * @param interaction The interaction.
 * @returns Whether the renderer must name it.
 */
const isUnnamed = (interaction: Interaction): boolean =>
  interaction.kind !== "choice" &&
  Option.isNone(interaction.ariaLabel) &&
  Option.isNone(interaction.ariaLabelledby) &&
  (interaction.kind === "text-entry" || Option.isNone(interaction.prompt));

/**
 * Give each validation message its id.
 *
 * @param instance The item instance key.
 * @param messages The messages, in the order validation gave them.
 * @returns The messages with ids, `n` counting each response's messages from 0.
 */
const identify = (
  instance: string,
  messages: readonly ValidationMessage[],
): readonly MessagePayload[] =>
  messages.map(({ response, text }, index) => ({
    id: scopedId(
      instance,
      response,
      "message",
      messages.slice(0, index).filter((earlier) => earlier.response === response).length,
    ),
    response,
    text,
  }));

/**
 * Give the recorded values of a response.
 *
 * @param build The build.
 * @param response The response identifier.
 * @returns Its values, none when it is NULL or the record lacks it.
 */
const recorded = (build: Build, response: string): readonly Single[] =>
  build.responses[response]?.values ?? [];

/**
 * Write a recorded value as the text a text control shows.
 *
 * An integer is written in the control's `base`, the base its posted text is read in, so a
 * restored value posts back unchanged. A base outside 2 to 36, which no posted text can be read in,
 * writes base 10.
 *
 * @param single The value.
 * @param base The control's number base.
 * @returns The value's text.
 */
const writeIn = (single: Single, base: number): string =>
  single.baseType === "integer" && Number.isInteger(base) && base >= 2 && base <= 36
    ? single.value.toString(base)
    : format(single);

/**
 * Copy what an interaction's response validation says into its payload fields.
 *
 * @param interaction The interaction.
 * @param build The build.
 * @returns Its message ids, whether it is invalid, and whether it takes `autofocus`.
 */
const validationOf = (interaction: Interaction, build: Build): ValidationPayload => {
  const messageIds = build.messages.flatMap((entry) =>
    entry.response === interaction.response ? [entry.id] : [],
  );

  return {
    autofocus: Option.exists(build.autofocus, (first) => first === interaction),
    invalid: messageIds.length > 0,
    messageIds,
  };
};

/**
 * Copy body nodes into payload nodes, in order.
 *
 * @param nodes The body nodes.
 * @param build The build.
 * @returns The payload nodes.
 */
const copyNodes = (nodes: readonly BodyNode[], build: Build): readonly PayloadNode[] =>
  // oxlint-disable-next-line eslint/no-use-before-define -- `copyNodes` and `copyNode` are mutually recursive, as elements, Prompts and choices nest; the call runs only after both are defined.
  nodes.map((node) => copyNode(node, build));

/**
 * Copy a Choice into its payload.
 *
 * @param interaction The Choice.
 * @param build The build.
 * @returns Its payload; `restore` holds the posted identifiers after a refused submit, else the
 *   recorded ones.
 */
const choicePayload = (interaction: ChoiceInteraction, build: Build): ChoicePayload => ({
  ...validationOf(interaction, build),
  cardinality: interaction.cardinality,
  choices: interaction.choices.map((choice) => ({
    content: copyNodes(choice.content, build),
    identifier: choice.identifier,
  })),
  class: interaction.class,
  kind: "choice",
  maxChoices: interaction.maxChoices,
  minChoices: interaction.minChoices,
  orientation: interaction.orientation,
  prompt: interaction.prompt.pipe(Option.map((prompt) => copyNodes(prompt, build))),
  response: interaction.response,
  restore: Option.match(build.posted, {
    onNone: () => recorded(build, interaction.response).map(format),
    onSome: (posted) => posted.get(interaction.response) ?? [],
  }),
});

/**
 * Copy the fields a Text Entry and an Extended Text share into their payload.
 *
 * @param interaction The text control.
 * @param build The build.
 * @returns The shared fields.
 */
const textControlPayload = (
  interaction: ExtendedTextInteraction | TextEntryInteraction,
  build: Build,
): TextControlPayload => {
  const position = build.unnamed.indexOf(interaction);

  return {
    ...validationOf(interaction, build),
    base: interaction.base,
    baseType: interaction.baseType,
    class: interaction.class,
    name: {
      ariaLabel: interaction.ariaLabel,
      ariaLabelledby: interaction.ariaLabelledby,
      unnamed:
        position === -1
          ? Option.none()
          : Option.some({ count: build.unnamed.length, n: position + 1 }),
    },
    placeholder: interaction.placeholder,
    response: interaction.response,
    restore: Option.match(build.posted, {
      onNone: () =>
        Option.match(Arr.head(recorded(build, interaction.response)), {
          onNone: () => "",
          onSome: (single) => writeIn(single, interaction.base),
        }),
      onSome: (posted) => posted.get(interaction.response)?.[0] ?? "",
    }),
  };
};

/**
 * Copy one body node into its payload node.
 *
 * @param node The body node.
 * @param build The build.
 * @returns The payload node: an unsupported part becomes its notice.
 */
const copyNode = (node: BodyNode, build: Build): PayloadNode => {
  switch (node.kind) {
    case "element": {
      return {
        attributes: node.attributes.map(({ name, value }) => ({ name, value })),
        children: copyNodes(node.children, build),
        kind: "element",
        tag: node.tag,
      };
    }
    case "text": {
      return { kind: "text", text: node.text };
    }
    case "unsupported": {
      return { feature: node.feature, kind: "notice" };
    }
    case "choice": {
      return choicePayload(node, build);
    }
    case "text-entry": {
      return {
        ...textControlPayload(node, build),
        expectedLength: node.expectedLength,
        kind: "text-entry",
      };
    }
    case "extended-text": {
      return {
        ...textControlPayload(node, build),
        expectedLines: node.expectedLines,
        format: node.format,
        kind: "extended-text",
        prompt: node.prompt.pipe(Option.map((prompt) => copyNodes(prompt, build))),
      };
    }
    default: {
      return node satisfies never;
    }
  }
};

/**
 * Give the score to show: `SCORE` in its lexical form, when it is declared, the attempt was
 * submitted and response processing ran.
 *
 * @param item The item.
 * @param record The session record.
 * @param view The view.
 * @returns The score, its values separated by a space; none otherwise.
 */
const scoreOf = (item: Item, record: ItemRecord, view: View): Option.Option<string> =>
  view.attempt === "submitted" && Option.isSome(item.processing) && item.outcomes.has("SCORE")
    ? Option.map(Option.fromUndefinedOr(record.outcomes["SCORE"]), (score) =>
        score.values.map(format).join(" "),
      )
    : Option.none();

/**
 * Compute the payload of one render: the allowlist of what the emitter may know about the item
 * and its session.
 *
 * @param item The item.
 * @param record The session record, which gives the instance key and the recorded responses.
 * @param view How the render was asked for.
 * @returns The payload. It holds no correct response, mapping, processing rule, seed, template
 *   value or feedback content, in any state.
 */
export const payload = (item: Item, record: ItemRecord, view: View): Payload => {
  const messages = identify(record.instance, view.messages);
  const interactions = interactionsIn(item.body);
  const build: Build = {
    autofocus:
      view.attempt === "refused"
        ? Arr.findFirst(interactions, (interaction) =>
            messages.some((entry) => entry.response === interaction.response),
          )
        : Option.none(),
    messages,
    posted: view.attempt === "refused" ? view.posted : Option.none(),
    responses: record.responses,
    unnamed: interactions.filter(isUnnamed),
  };

  return {
    attempt: view.attempt,
    body: copyNodes(item.body, build),
    finished: view.finished,
    instance: record.instance,
    lang: Option.getOrElse(item.lang, () => view.locale),
    messages,
    mode: "answering",
    notices: item.unsupported.flatMap((entry) => (entry.shown === "notice" ? [entry.feature] : [])),
    recorded: view.attempt === "submitted" && Option.isNone(item.processing),
    score: scoreOf(item, record, view),
    title: item.title,
  };
};

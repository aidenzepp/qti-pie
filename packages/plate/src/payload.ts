/**
 * The payload: the allowlist of what the emitter may know about an item and one render of it.
 *
 * Two copies stand between the item model and the page. {@link redactItem} copies the parts of an
 * item the page may know into a {@link Redacted}, and {@link payload} copies a `Redacted` and the
 * author's {@link View} into the {@link Payload}, the only input the emitter receives. Each copies
 * every field it names one by one and never spreads a model object, so a field the model gains
 * reaches the page only when this file names it. Nothing here holds a correct response, a mapping,
 * a response or outcome default, a processing rule, the seed, a template value or feedback
 * content: what the page cannot be given, it cannot leak.
 *
 * @module
 * @see {@link Item} for the model it reads.
 */
import { Array as Arr, Option } from "effect";
import type { Brand } from "effect";
import { scopedId } from "#plate/emit/parts.ts";
import type { Resolved } from "#plate/emit/parts.ts";
import { entryName } from "#plate/form/encoding.ts";
import type { Locale } from "#plate/messages.ts";
import type {
  BodyNode,
  ChoiceInteraction,
  ExtendedTextInteraction,
  Item,
  TextEntryInteraction,
} from "#plate/model/item.ts";
import { format } from "#plate/model/values.ts";
import type { ModelledBaseType, Single, Value } from "#plate/model/values.ts";

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
 * The author's inputs to one render: the instance, the values to show, the entry names, and the
 * messages of a post the author refused.
 *
 * The library decides no flow, so every field is the author's: each map is keyed by response
 * identifier, and a response it omits takes the default the field names. `messages` decides how
 * the controls are filled: when it is not empty, each control shows its `posted` strings, so the
 * candidate sees what they typed, and the first interaction with a message takes `autofocus`;
 * when it is empty, each control shows its value in `values` and `posted` is not read. `locale` is
 * the language of an item that names none.
 */
export interface View {
  /**
   * Whether the author disabled every control.
   */
  readonly finished: boolean;
  /**
   * The item instance key, which scopes every id and each default entry name.
   */
  readonly instance: string;
  readonly locale: Locale;
  readonly messages: readonly ValidationMessage[];
  /**
   * The name each response's controls post under, `entryName(instance, response)` when absent.
   */
  readonly names: ReadonlyMap<string, string>;
  readonly posted: Option.Option<ReadonlyMap<string, readonly string[]>>;
  /**
   * The value each response's controls show, such as its `defaultValue` or a value the author's
   * flow recorded; NULL when absent.
   */
  readonly values: ReadonlyMap<string, Value>;
}

/**
 * What the emitter needs beyond the payload: the locale, the base heading level, the base
 * package-relative URLs resolve against, and the resolved part overrides.
 */
export interface EmitState {
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
 * What every interaction payload says about the view's messages for its response.
 *
 * `invalid` holds when its response has a message, and `messageIds` names those messages in order.
 * `autofocus` holds on the first interaction in document order with a message; its connect
 * function writes `autofocus` on that interaction's first Control.
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
  /**
   * The author's `aria-label`, which names the group when there is no Prompt.
   */
  readonly ariaLabel: Option.Option<string>;
  /**
   * The author's `aria-labelledby`, the ids unscoped, which names the group when there is no
   * Prompt.
   */
  readonly ariaLabelledby: Option.Option<string>;
  readonly cardinality: "multiple" | "single";
  readonly choices: readonly {
    readonly content: readonly PayloadNode[];
    readonly identifier: string;
  }[];
  /**
   * The author's `class` value, empty when absent.
   */
  readonly class: string;
  /**
   * The name its Controls post under: the view's name for the response, else
   * `entryName(instance, response)`.
   */
  readonly formName: string;
  readonly kind: "choice";
  readonly maxChoices: bigint;
  readonly minChoices: bigint;
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
 * the entry name, the accessible name and the text to restore.
 */
export interface TextControlPayload extends ValidationPayload {
  readonly base: number;
  readonly baseType: "float" | "integer" | "string";
  /**
   * The author's `class` value, empty when absent.
   */
  readonly class: string;
  /**
   * The name its Control posts under: the view's name for the response, else
   * `entryName(instance, response)`.
   */
  readonly formName: string;
  /**
   * How the Control is named for assistive technology, not the entry name.
   */
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
   * The text the control shows: the string posted when the view has messages, else the view's
   * value written in its lexical form, an integer in `base`; empty for NULL.
   */
  readonly restore: string;
}

/**
 * A Text Entry as the page may know it (Q-20).
 */
export interface TextEntryPayload extends TextControlPayload {
  readonly expectedLength: Option.Option<bigint>;
  readonly kind: "text-entry";
}

/**
 * An Extended Text as the page may know it (Q-5): a text control with `expected-lines`, a
 * `format` and a Prompt.
 */
export interface ExtendedTextPayload extends TextControlPayload {
  readonly expectedLines: Option.Option<bigint>;
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
 * `lang` is the item's `xml:lang`, else the view's locale. `finished` is the view's: the author
 * disabled every control. `notices` names the unsupported features the body shows as notices.
 */
export interface Payload {
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
  readonly title: string;
}

/**
 * A response's binding as the page may know it: its identifier, base type and cardinality, with no
 * correct response, mapping or default.
 */
export interface ResponseBinding {
  readonly baseType: ModelledBaseType;
  readonly cardinality: Value["cardinality"];
  readonly identifier: string;
}

/**
 * The fields of an item the page may know, which {@link redactItem} copies by name.
 *
 * `responses` lists the response bindings in document order, and `notices` the features the body
 * shows as notices. Exported for the codec of {@link Redacted}'s JSON form, whose Schema's type it
 * is; `src/index.ts` does not export it.
 */
export interface RedactedFields {
  readonly body: readonly BodyNode[];
  /**
   * The document's location as the host named it.
   */
  readonly document: string;
  readonly identifier: string;
  /**
   * The root's `xml:lang`.
   */
  readonly lang: Option.Option<string>;
  readonly notices: readonly string[];
  readonly responses: readonly ResponseBinding[];
  readonly title: string;
}

/**
 * An item with every part the page may not know removed: the only item {@link payload} takes.
 *
 * The brand exists only in the type, so a full {@link Item}, or any object built by hand, does not
 * type-check where a `Redacted` is expected. {@link redactItem} makes one from an item, and the
 * codec's `decodeRedacted` from its checked JSON form, each through {@link brandRedacted}; the value
 * either returns holds exactly the fields of {@link RedactedFields}.
 */
export type Redacted = Brand.Branded<RedactedFields, "Redacted">;

/**
 * Brand redacted fields as a {@link Redacted}: a cast, so that no run-time import of effect's
 * `Brand` reaches the browser (the OD-6 ruling, rule `e2bd87f2`).
 *
 * Only {@link redactItem}'s allowlisted copy and the codec's `decodeRedacted`, after its Schema has
 * checked every field, call it; `src/index.ts` does not export it. Any other caller would make a
 * `Redacted` the allowlist never saw.
 *
 * @param fields The fields the allowlist copied, or the codec checked.
 * @returns The same object, typed as a `Redacted`.
 */
export const brandRedacted = (fields: RedactedFields): Redacted =>
  // SAFETY: `fields` comes from redactItem's allowlisted copy or decodeRedacted's checked decode, the only two callers; the brand is type-only, so the cast adds no run-time field.
  // oxlint-disable-next-line typescript/no-unsafe-type-assertion -- The SAFETY note above: the brand exists only in the type, and these two callers are the allowlist's only ways in.
  fields as Redacted;

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
  readonly instance: string;
  readonly messages: readonly MessagePayload[];
  readonly names: View["names"];
  /**
   * The posted strings to restore, set only when the view has messages.
   */
  readonly posted: Option.Option<ReadonlyMap<string, readonly string[]>>;
  /**
   * The text controls with no authored name and no Prompt, in document order.
   */
  readonly unnamed: readonly Interaction[];
  readonly values: View["values"];
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
 * Give each validation message the id its Message part carries, so a Control's
 * `aria-describedby` and the Status part's Message agree.
 *
 * @param instance The item instance key.
 * @param messages The messages, in the order validation gave them.
 * @returns The messages with ids, `n` counting each response's messages from 0.
 */
export const identifyMessages = (
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
 * Give the values the view shows for a response.
 *
 * @param build The build.
 * @param response The response identifier.
 * @returns Its values, none when it is NULL or the view gives none.
 */
const shown = (build: Build, response: string): readonly Single[] =>
  build.values.get(response)?.values ?? [];

/**
 * Give the name a response's controls post under.
 *
 * @param build The build.
 * @param response The response identifier.
 * @returns The view's name for it, else `entryName(instance, response)`.
 */
const formNameOf = (build: Build, response: string): string =>
  build.names.get(response) ?? entryName(build.instance, response);

/**
 * Write a value as the text a text control shows.
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
 * @returns Its payload; `restore` holds the posted identifiers when the view has messages, else
 *   the view's value.
 */
const choicePayload = (interaction: ChoiceInteraction, build: Build): ChoicePayload => ({
  ...validationOf(interaction, build),
  ariaLabel: interaction.ariaLabel,
  ariaLabelledby: interaction.ariaLabelledby,
  cardinality: interaction.cardinality,
  choices: interaction.choices.map((choice) => ({
    content: copyNodes(choice.content, build),
    identifier: choice.identifier,
  })),
  class: interaction.class,
  formName: formNameOf(build, interaction.response),
  kind: "choice",
  maxChoices: interaction.maxChoices,
  minChoices: interaction.minChoices,
  orientation: interaction.orientation,
  prompt: interaction.prompt.pipe(Option.map((prompt) => copyNodes(prompt, build))),
  response: interaction.response,
  restore: Option.match(build.posted, {
    onNone: () => shown(build, interaction.response).map(format),
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
    formName: formNameOf(build, interaction.response),
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
        Option.match(Arr.head(shown(build, interaction.response)), {
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
 * Copy the parts of an item the page may know: the allowlist, and the only way to make a
 * {@link Redacted} from an item.
 *
 * It copies, each by name, the document location, the identifier, the title, `lang`, the body,
 * each response's binding and the features shown as notices. It copies no outcome declaration,
 * correct response, mapping, response default or processing rule, and no field it does not name.
 *
 * @param item The item.
 * @returns The redacted item.
 */
export const redactItem = (item: Item): Redacted =>
  brandRedacted({
    body: item.body,
    document: item.document,
    identifier: item.identifier,
    lang: item.lang,
    notices: item.unsupported.flatMap((entry) => (entry.shown === "notice" ? [entry.feature] : [])),
    responses: Array.from(item.responses.values(), ({ baseType, cardinality, identifier }) => ({
      baseType,
      cardinality,
      identifier,
    })),
    title: item.title,
  });

/**
 * Compute the payload of one render: the allowlist of what the emitter may know about a redacted
 * item and the author's inputs.
 *
 * @param redacted The item, through {@link redactItem}.
 * @param view The author's inputs: the instance, values, names, messages and posted strings.
 * @returns The payload. It holds no correct response, mapping, default, processing rule, seed,
 *   template value or feedback content, whatever the view.
 */
export const payload = (redacted: Redacted, view: View): Payload => {
  const messages = identifyMessages(view.instance, view.messages);
  const interactions = interactionsIn(redacted.body);
  const build: Build = {
    autofocus: Arr.findFirst(interactions, (interaction) =>
      messages.some((entry) => entry.response === interaction.response),
    ),
    instance: view.instance,
    messages,
    names: view.names,
    posted: messages.length > 0 ? view.posted : Option.none(),
    unnamed: interactions.filter(isUnnamed),
    values: view.values,
  };

  return {
    body: copyNodes(redacted.body, build),
    finished: view.finished,
    instance: view.instance,
    lang: Option.getOrElse(redacted.lang, () => view.locale),
    messages,
    mode: "answering",
    notices: redacted.notices,
    title: redacted.title,
  };
};

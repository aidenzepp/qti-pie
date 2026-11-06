/**
 * The payload: the allowlist of what the emitter may know about an item and one render of it.
 *
 * Two copies stand between the item model and the page. {@link redactItem} copies the parts of an
 * item the page may know into a {@link Redacted}, and {@link payload} copies a `Redacted` and the
 * author's {@link View} into the {@link Payload}, the only input the emitter receives. Each copies
 * every field it names one by one and never spreads a model object, so a field the model gains
 * reaches the page only when this file names it. Neither copy holds a correct response, a mapping,
 * a response or outcome default, a processing rule, a template value or feedback content, and the
 * payload holds no seed: the view's seed only orders a shuffled Choice's or Inline Choice's
 * choices. What the page cannot be given, it cannot leak. A `solution` render shows correct
 * responses only when the author passes them as the view's values; nothing here reads them from the
 * item.
 *
 * @module
 * @see {@link Item} for the model it reads.
 */
import { Array as Arr, Option } from "effect";
import type { Brand } from "effect";
import { controlCap, exceedsControlCap } from "#plate/control-cap.ts";
import { scopedId } from "#plate/emit/parts.ts";
import type { Resolved } from "#plate/emit/parts.ts";
import { shuffleOrder } from "#plate/engine/random.ts";
import { entryName, isPosted } from "#plate/form/encoding.ts";
import type { Binding, DecodeOptions } from "#plate/form/encoding.ts";
import { authorsLabel, givesText, resolvedLabelledby } from "#plate/interactions/name.ts";
import type { Locale } from "#plate/messages.ts";
import { interactionsIn } from "#plate/model/interactions.ts";
import type {
  BodyNode,
  ChoiceInteraction,
  ExtendedTextInteraction,
  InlineChoiceInteraction,
  Interaction,
  Item,
  SimpleChoice,
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
 * The state a render shows an item in, which its Root's `data-mode` names.
 *
 * `answering` lets the candidate change each response. `review` and `solution` show the values the
 * author passes and let the candidate change none: `review` shows a recorded attempt, and
 * `solution` the correct responses, which reach the page only as the author's values.
 */
export type RenderMode = "answering" | "review" | "solution";

/**
 * The author's inputs to one render: the instance, the mode, the seed, the values to show, the
 * entry names, and the messages of a post the author refused.
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
   * The state the item is shown in, which decides whether the candidate may change a response.
   */
  readonly mode: RenderMode;
  /**
   * The name each response's controls post under, `entryName(instance, response)` when absent.
   */
  readonly names: ReadonlyMap<string, string>;
  readonly posted: Option.Option<ReadonlyMap<string, readonly string[]>>;
  /**
   * The configuration's `seed`, which keys a shuffled Choice's or Inline Choice's order with the
   * instance and the response; keyed as the empty string when absent.
   */
  readonly seed?: number;
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
 * A body part plate does not render, which the emitter shows as the Notice part.
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
 * What every interaction payload says about the render's mode.
 *
 * `editable` holds exactly when the mode is `answering`. When it is false, in `review` and
 * `solution`, the candidate may change no response, and the interaction's render function is to
 * show its Controls' values without accepting input. It is apart from the payload's `finished`,
 * the author's choice to disable every control, so a Control accepts input only when `editable`
 * holds and `finished` does not.
 */
export interface ModePayload {
  readonly editable: boolean;
}

/**
 * A Choice as the page may know it (Q-2): its binding, its constraints, its Prompt, its choices in
 * the order they are presented, and the identifiers to show as checked.
 */
export interface ChoicePayload extends ModePayload, ValidationPayload {
  /**
   * The author's `aria-label`, which names the group when there is no Prompt.
   */
  readonly ariaLabel: Option.Option<string>;
  /**
   * The ids of the author's `aria-labelledby` that an element of the item carries, unscoped
   * ({@link resolvedLabelledby}), which name the group when there is no Prompt; none when the
   * author wrote none or none of its ids is carried.
   */
  readonly ariaLabelledby: Option.Option<string>;
  readonly cardinality: "multiple" | "single";
  /**
   * The choices in presented order: for a Choice with `shuffle` true, the order the view's seed,
   * the instance and the response key, each fixed choice at its document position; else document
   * order.
   */
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
 * An Inline Choice as the page may know it (Q-12): its binding, its Label, its placeholder, its
 * choices in the order they are presented, how its Control is named and the identifier it restores.
 */
export interface InlineChoicePayload extends ModePayload, ValidationPayload {
  /**
   * The choices in presented order, as {@link ChoicePayload.choices} orders a Choice's.
   */
  readonly choices: readonly {
    readonly content: readonly PayloadNode[];
    readonly identifier: string;
  }[];
  /**
   * The author's `class` value, empty when absent.
   */
  readonly class: string;
  /**
   * The name its Control posts under: the view's name for the response, else
   * `entryName(instance, response)`.
   */
  readonly formName: string;
  readonly kind: "inline-choice";
  /**
   * The content of the first `qti-label`, none when the interaction has none.
   */
  readonly label: Option.Option<readonly PayloadNode[]>;
  /**
   * How the Control is named for assistive technology when no Label gives it a name, as a text
   * control's is.
   */
  readonly name: TextName;
  /**
   * The author's `data-prompt`, the text of the option that stands for no answer.
   */
  readonly placeholder: Option.Option<string>;
  /**
   * The identifier of the response it binds.
   */
  readonly response: string;
  /**
   * The identifier the Control shows as chosen: the string posted when the view has messages,
   * else the view's value; empty for NULL.
   */
  readonly restore: string;
}

/**
 * Where the first Control of a text control or an Inline Choice stands among the Controls the
 * renderer names (Q10): `n`, from 1, among the `count` of the item.
 */
export interface UnnamedPosition {
  readonly count: number;
  readonly n: number;
}

/**
 * How a text control or an Inline Choice is named.
 *
 * `ariaLabel` is the author's, as written. `ariaLabelledby` holds the ids of the author's that an
 * element of the item carries, unscoped ({@link resolvedLabelledby}), none when none is carried.
 * `unnamed` is set exactly when the renderer names the control's Controls: it has neither of them
 * nor a Prompt, nor, for an Inline Choice, a Label that gives text, a blank `ariaLabel` counting as
 * none, and it renders at least one Control. Every Control the renderer names counts once, in
 * document order across the item, which is the order the Controls are emitted in: a Text Entry's
 * and an Inline Choice's one Control and each Control of an Extended Text. `n` is the position of
 * the control's first Control, an Extended Text's others following at `n + 1` onwards, and `count`
 * is how many there are.
 */
export interface TextName {
  readonly ariaLabel: Option.Option<string>;
  readonly ariaLabelledby: Option.Option<string>;
  readonly unnamed: Option.Option<UnnamedPosition>;
}

/**
 * What a Text Entry and an Extended Text share: the binding, the integer `base`, the placeholder,
 * the entry name and the accessible name.
 */
export interface TextControlPayload extends ModePayload, ValidationPayload {
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
}

/**
 * A Text Entry as the page may know it (Q-20).
 */
export interface TextEntryPayload extends TextControlPayload {
  readonly expectedLength: Option.Option<bigint>;
  readonly kind: "text-entry";
  /**
   * The text the Control shows: the string posted when the view has messages, else the view's
   * value written in its lexical form, an integer in `base`; empty for NULL.
   */
  readonly restore: string;
}

/**
 * An Extended Text as the page may know it (Q-5): a text control with `expected-lines`, a
 * `format`, a Prompt, its binding's cardinality, and its `n` Controls with the text each restores,
 * or the notice that stands in their place.
 */
export interface ExtendedTextPayload extends TextControlPayload {
  readonly cardinality: ExtendedTextInteraction["cardinality"];
  readonly expectedLines: Option.Option<bigint>;
  readonly format: ExtendedTextInteraction["format"];
  readonly kind: "extended-text";
  /**
   * The number of Controls (Q9): 1 for a `single` binding; for a container, `max-strings` when it
   * is from 1 to 10, else the greater of 10 and `min-strings`, so `max-strings="0"` and an absent
   * one give at least 10 (reading 53). It also covers every member of the value or post it
   * restores, up to a nonzero `max-strings`. At most 100 (Q23), and 0 when `min-strings` exceeds
   * 100.
   */
  readonly n: number;
  /**
   * The cap's notice, `min-strings>100` (Q23): in place of the Controls when `min-strings` exceeds
   * 100, `n` then 0, or beside the first 100 Controls when the value or post restored holds more
   * members than they do; none otherwise.
   */
  readonly notice: Option.Option<NoticePayload>;
  readonly prompt: Option.Option<readonly PayloadNode[]>;
  /**
   * The text each Control shows, one per Control in order: the strings posted when the view has
   * messages, else the view's values, each written as {@link TextEntryPayload.restore} writes one;
   * empty for a Control with none.
   */
  readonly restores: readonly string[];
}

/**
 * An interaction payload, which the emitter hands to its interaction's render function.
 */
export type InteractionPayload =
  | ChoicePayload
  | ExtendedTextPayload
  | InlineChoicePayload
  | TextEntryPayload;

/**
 * A node of the payload's body.
 */
export type PayloadNode = ElementPayload | InteractionPayload | NoticePayload | TextPayload;

/**
 * Everything the emitter may know about one render of an item.
 *
 * `lang` is the item's `xml:lang`, else the view's locale. `finished` is the view's: the author
 * disabled every control. `mode` is the view's, the state the Root's and each interaction Root's
 * `data-mode` name. `notices` names the unsupported features the body shows as notices.
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
  readonly mode: RenderMode;
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
 * What one payload build knows about the whole item while it copies one node.
 */
interface Build {
  /**
   * The interaction whose first Control takes `autofocus`, if any.
   */
  readonly autofocus: Option.Option<Interaction>;
  /**
   * Whether the view's mode lets the candidate change a response ({@link ModePayload}).
   */
  readonly editable: boolean;
  /**
   * The ids the author gave the item's elements, unscoped ({@link authoredIdsIn}).
   */
  readonly ids: ReadonlySet<string>;
  readonly instance: string;
  readonly messages: readonly MessagePayload[];
  readonly names: View["names"];
  /**
   * The posted strings to restore, set only when the view has messages.
   */
  readonly posted: Option.Option<ReadonlyMap<string, readonly string[]>>;
  /**
   * The view's seed, none when the view has none.
   */
  readonly seed: Option.Option<number>;
  /**
   * Each interaction the renderer names, with where its first Control stands among the Controls
   * the renderer names ({@link TextName}).
   */
  readonly unnamed: ReadonlyMap<Interaction, UnnamedPosition>;
  readonly values: View["values"];
}

/**
 * Collect the ids the author gave the elements of body nodes, in document order: the `id` of
 * every element, below elements, in Prompts and Labels and in a Choice's choice content, the places
 * the emitter writes as elements, so each one is an id an element of the rendered item carries. An
 * Inline Choice's choice content gives none: each of its choices is written as the one text of an
 * `option`, so an id inside one is never emitted.
 *
 * @param nodes The body nodes.
 * @returns The ids, unscoped.
 */
const authoredIdsIn = (nodes: readonly BodyNode[]): readonly string[] =>
  nodes.flatMap((node): readonly string[] => {
    switch (node.kind) {
      case "element": {
        return [
          ...node.attributes.flatMap(({ name, value }) => (name === "id" ? [value] : [])),
          ...authoredIdsIn(node.children),
        ];
      }
      case "choice": {
        return [
          ...authoredIdsIn(Option.getOrElse(node.prompt, () => [])),
          ...node.choices.flatMap((choice) => authoredIdsIn(choice.content)),
        ];
      }
      case "extended-text": {
        return authoredIdsIn(Option.getOrElse(node.prompt, () => []));
      }
      case "inline-choice": {
        return authoredIdsIn(Option.getOrElse(node.label, () => []));
      }
      case "text-entry":
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
 * Report whether the renderer names an interaction's Controls (Q10): a Text Entry with no authored
 * name, an Extended Text with no authored name and no Prompt, or an Inline Choice with no authored
 * name and no Label whose content gives text ({@link givesText}, the one Label check the emitter
 * also reads). A Choice never: its Controls are named by their choices. A blank `aria-label`
 * ({@link authorsLabel}) and an `aria-labelledby` none of whose ids an element of the item carries
 * ({@link resolvedLabelledby}) are no authored names.
 *
 * @param interaction The interaction.
 * @param ids The ids the author gave the item's elements.
 * @returns Whether the renderer must name it.
 */
const isUnnamed = (interaction: Interaction, ids: ReadonlySet<string>): boolean => {
  const unauthored =
    Option.isNone(authorsLabel(interaction)) && Option.isNone(resolvedLabelledby(interaction, ids));
  switch (interaction.kind) {
    case "choice": {
      return false;
    }
    case "text-entry": {
      return unauthored;
    }
    case "extended-text": {
      return unauthored && Option.isNone(interaction.prompt);
    }
    case "inline-choice": {
      return unauthored && !Option.exists(interaction.label, givesText);
    }
    default: {
      return interaction satisfies never;
    }
  }
};

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
const shown = (build: Pick<Build, "values">, response: string): readonly Single[] =>
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
  // oxlint-disable-next-line eslint/no-use-before-define -- `copyNodes` and `copyNode` are mutually recursive, as elements, Prompts, Labels and choices nest; the call runs only after both are defined.
  nodes.map((node) => copyNode(node, build));

/**
 * The separator of a shuffle key's three fields, U+001F INFORMATION SEPARATOR ONE, which no number
 * written with `String`, checked instance token or identifier holds.
 */
const keySeparator = "\u001F";

/**
 * Give the identifiers of a Choice's or an Inline Choice's choices in the order a render presents
 * them: the one function that presents both kinds and reports their order.
 *
 * An interaction with `shuffle` true is presented in {@link shuffleOrder}'s order under the key
 * `<seed>\u001F<instance>\u001F<response>`, where the seed is written with `String` and an absent
 * seed is the empty string: its non-fixed choices are permuted among the non-fixed positions, and
 * each fixed choice keeps its document position. Any other keeps document order. The same
 * interaction, seed and instance always give the same order, the one `render` presents, so a host
 * can report it, such as a result's `choiceSequence`. The order is presentation only: scores,
 * records and validation read identifiers, never positions.
 *
 * @example
 *   // A shuffled Choice of choices A, B and C, none fixed, bound to RESPONSE:
 *   choiceOrder(interaction, Option.some(7), "_r_1_"); // ["B", "A", "C"]
 *   choiceOrder(interaction, Option.none(), "_r_1_"); // ["A", "C", "B"]
 *
 * @param interaction The Choice or Inline Choice: its choices, its response and its `shuffle`.
 * @param seed The configuration's `seed`, none when it has none.
 * @param instance The item instance key the interaction is rendered under.
 * @returns The choice identifiers, in presented order.
 */
export const choiceOrder = (
  interaction: Pick<ChoiceInteraction, "choices" | "response" | "shuffle">,
  seed: Option.Option<number>,
  instance: string,
): readonly string[] =>
  interaction.shuffle
    ? shuffleOrder(
        [
          Option.match(seed, { onNone: () => "", onSome: String }),
          instance,
          interaction.response,
        ].join(keySeparator),
        interaction.choices.map((choice) => choice.fixed),
      ).flatMap((index) => interaction.choices[index]?.identifier ?? [])
    : interaction.choices.map((choice) => choice.identifier);

/**
 * Give a Choice's or an Inline Choice's choices in the order they are presented,
 * {@link choiceOrder}'s, so the payload presents the order `choiceOrder` reports.
 *
 * A checked interaction's choice identifiers are unique (`duplicate-identifier`, info.txt:42411),
 * so each identifier names exactly one choice.
 *
 * @param interaction The Choice or Inline Choice: its choices, its response and its `shuffle`.
 * @param build The build, which gives the seed and the instance.
 * @returns The choices, in presented order.
 */
const presentedChoices = (
  interaction: Pick<ChoiceInteraction, "choices" | "response" | "shuffle">,
  build: Build,
): readonly SimpleChoice[] => {
  const byIdentifier = new Map(interaction.choices.map((choice) => [choice.identifier, choice]));

  return choiceOrder(interaction, build.seed, build.instance).flatMap(
    (identifier) => byIdentifier.get(identifier) ?? [],
  );
};

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
  ariaLabelledby: resolvedLabelledby(interaction, build.ids),
  cardinality: interaction.cardinality,
  choices: presentedChoices(interaction, build).map((choice) => ({
    content: copyNodes(choice.content, build),
    identifier: choice.identifier,
  })),
  class: interaction.class,
  editable: build.editable,
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
 * Give how a text control or an Inline Choice is named: the author's `aria-label` as written, the
 * ids of the author's `aria-labelledby` an element carries, and where the renderer numbers it.
 *
 * @param interaction The interaction.
 * @param build The build.
 * @returns Its name.
 */
const textNameOf = (
  interaction: ExtendedTextInteraction | InlineChoiceInteraction | TextEntryInteraction,
  build: Build,
): TextName => ({
  ariaLabel: interaction.ariaLabel,
  ariaLabelledby: resolvedLabelledby(interaction, build.ids),
  unnamed: Option.fromNullishOr(build.unnamed.get(interaction)),
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
): TextControlPayload => ({
  ...validationOf(interaction, build),
  base: interaction.base,
  baseType: interaction.baseType,
  class: interaction.class,
  editable: build.editable,
  formName: formNameOf(build, interaction.response),
  name: textNameOf(interaction, build),
  placeholder: interaction.placeholder,
  response: interaction.response,
});

/**
 * Copy a Text Entry into its payload.
 *
 * @param interaction The Text Entry.
 * @param build The build.
 * @returns Its payload; `restore` holds the posted string when the view has messages, else the
 *   view's value in its lexical form.
 */
const textEntryPayload = (interaction: TextEntryInteraction, build: Build): TextEntryPayload => ({
  ...textControlPayload(interaction, build),
  expectedLength: interaction.expectedLength,
  kind: "text-entry",
  restore: Option.match(build.posted, {
    onNone: () =>
      Option.match(Arr.head(shown(build, interaction.response)), {
        onNone: () => "",
        onSome: (single) => writeIn(single, interaction.base),
      }),
    onSome: (posted) => posted.get(interaction.response)?.[0] ?? "",
  }),
});

/**
 * Copy an Inline Choice into its payload (Q-12).
 *
 * @param interaction The Inline Choice.
 * @param build The build.
 * @returns Its payload: its choices in presented order, its Label, and `restore`, the string posted
 *   when the view has messages, else the view's identifier, else empty.
 */
const inlineChoicePayload = (
  interaction: InlineChoiceInteraction,
  build: Build,
): InlineChoicePayload => ({
  ...validationOf(interaction, build),
  choices: presentedChoices(interaction, build).map((choice) => ({
    content: copyNodes(choice.content, build),
    identifier: choice.identifier,
  })),
  class: interaction.class,
  editable: build.editable,
  formName: formNameOf(build, interaction.response),
  kind: "inline-choice",
  label: interaction.label.pipe(Option.map((label) => copyNodes(label, build))),
  name: textNameOf(interaction, build),
  placeholder: interaction.placeholder,
  response: interaction.response,
  restore: Option.match(build.posted, {
    onNone: () =>
      Option.match(Arr.head(shown(build, interaction.response)), {
        onNone: () => "",
        onSome: format,
      }),
    onSome: (posted) => posted.get(interaction.response)?.[0] ?? "",
  }),
});

/**
 * The number of Controls a container renders when `max-strings` does not fix it (Q9).
 */
const defaultControls = 10n;

/**
 * Give the larger of two counts.
 *
 * @param left One count.
 * @param right The other.
 * @returns The larger.
 */
const larger = (left: bigint, right: bigint): bigint => (left > right ? left : right);

/**
 * Give the smaller of two counts.
 *
 * @param left One count.
 * @param right The other.
 * @returns The smaller.
 */
const smaller = (left: bigint, right: bigint): bigint => (left < right ? left : right);

/**
 * How many Controls an Extended Text renders, and whether the cap's notice shows.
 */
interface Controls {
  readonly n: number;
  /**
   * Whether the cap (Q23) holds back what the item or its value asks for: `min-strings` above
   * 100, or a value with more members than 100 Controls hold.
   */
  readonly overCap: boolean;
}

/**
 * Count the Controls an Extended Text renders.
 *
 * Q9 gives a container `max-strings` Controls when it is from 1 to 10, else the greater of 10 and
 * `min-strings`; `max-strings="0"` restricts nothing (reading 53). So restoring drops no answer
 * silently, `n` also covers each member the restored or posted value holds, up to `max-strings`
 * when it restricts and up to the cap of 100 (Q23). Over the cap, the first 100 show beside the
 * cap's notice; a `min-strings` above 100 leaves no Control, the notice in their place.
 *
 * @param interaction The Extended Text.
 * @param members How many members the value or post to restore holds.
 * @returns The count, from 0 to 100, and whether the cap's notice shows.
 */
const controlsOf = (interaction: ExtendedTextInteraction, members: number): Controls => {
  if (exceedsControlCap(interaction.minStrings)) {
    return { n: 0, overCap: true };
  }

  if (interaction.cardinality === "single") {
    return { n: 1, overCap: false };
  }

  const limit = interaction.maxStrings.pipe(Option.filter((maxStrings) => maxStrings > 0n));
  const asked = Option.getOrElse(
    limit.pipe(Option.filter((maxStrings) => maxStrings <= defaultControls)),
    () => larger(defaultControls, interaction.minStrings),
  );
  const held = Option.match(limit, {
    onNone: () => BigInt(members),
    onSome: (maxStrings) => smaller(BigInt(members), maxStrings),
  });
  const cap = controlCap.when.limit;

  return { n: Number(larger(asked, smaller(held, cap))), overCap: held > cap };
};

/**
 * Give the texts an Extended Text's Controls restore: the strings posted when the view has
 * messages, else the view's values, each written in the control's `base`.
 *
 * @param interaction The Extended Text.
 * @param build The build, which gives the posted strings and the values.
 * @returns The texts, in order; none for NULL or an empty post.
 */
const entriesOf = (
  interaction: ExtendedTextInteraction,
  build: Pick<Build, "posted" | "values">,
): readonly string[] =>
  Option.match(build.posted, {
    onNone: () =>
      shown(build, interaction.response).map((single) => writeIn(single, interaction.base)),
    onSome: (posted) => posted.get(interaction.response) ?? [],
  });

/**
 * Copy an Extended Text into its payload.
 *
 * @param interaction The Extended Text.
 * @param build The build.
 * @returns Its payload: `n` Controls, each restoring the posted string or value at its place, and
 *   the cap's notice when the cap holds back what the item or its value asks for.
 */
const extendedTextPayload = (
  interaction: ExtendedTextInteraction,
  build: Build,
): ExtendedTextPayload => {
  const entries = entriesOf(interaction, build);
  const { n, overCap } = controlsOf(interaction, entries.length);

  return {
    ...textControlPayload(interaction, build),
    cardinality: interaction.cardinality,
    expectedLines: interaction.expectedLines,
    format: interaction.format,
    kind: "extended-text",
    n,
    notice: overCap ? Option.some({ feature: controlCap.feature, kind: "notice" }) : Option.none(),
    prompt: interaction.prompt.pipe(Option.map((prompt) => copyNodes(prompt, build))),
    restores: Array.from({ length: n }, (_, index) => entries[index] ?? ""),
  };
};

/**
 * Count the Controls an interaction renders: an Extended Text's `n`, and one for each other kind.
 *
 * @param interaction The interaction.
 * @param build The build's posted strings and values, which give an Extended Text its Controls.
 * @returns How many Controls it renders.
 */
const controlCount = (
  interaction: Interaction,
  build: Pick<Build, "posted" | "values">,
): number => {
  switch (interaction.kind) {
    case "extended-text": {
      return controlsOf(interaction, entriesOf(interaction, build).length).n;
    }
    case "choice":
    case "inline-choice":
    case "text-entry": {
      return 1;
    }
    default: {
      return interaction satisfies never;
    }
  }
};

/**
 * Number the Controls the renderer names (Q10), in document order across the item: a Text Entry's
 * and an Inline Choice's one Control and each Control of an Extended Text, for each interaction
 * {@link isUnnamed} says the renderer names. An Extended Text that renders no Control, over the
 * cap, takes no position.
 *
 * @param interactions The item's interactions, in document order.
 * @param build The build's ids, which say whether an `aria-labelledby` names an element, and its
 *   posted strings and values, which give an Extended Text its Controls.
 * @returns Each interaction the renderer names, with where its first Control stands.
 */
const unnamedPositions = (
  interactions: readonly Interaction[],
  build: Pick<Build, "ids" | "posted" | "values">,
): ReadonlyMap<Interaction, UnnamedPosition> => {
  const firsts: (readonly [Interaction, number])[] = [];
  let next = 1;
  for (const interaction of interactions.filter((each) => isUnnamed(each, build.ids))) {
    const controls = controlCount(interaction, build);
    if (controls > 0) {
      firsts.push([interaction, next]);
      next += controls;
    }
  }

  return new Map(firsts.map(([interaction, n]) => [interaction, { count: next - 1, n }]));
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
      return textEntryPayload(node, build);
    }
    case "extended-text": {
      return extendedTextPayload(node, build);
    }
    case "inline-choice": {
      return inlineChoicePayload(node, build);
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
 * How one response travels through a host's form: its identifier, its binding, and the options
 * `decode` reads its entries with.
 *
 * The binding's `name` is the entry name `render` gives the response's Controls by default,
 * `entryName(instance, identifier)`. {@link postings} does not see `render`'s `names` option, so a
 * host that passes `names` to `render` must decode each response under the name it passed there,
 * not under the binding's `name`.
 */
export interface Posting {
  readonly binding: Binding;
  readonly identifier: string;
  /**
   * The number base its integer is written in: the `base` of the first Text Entry or Extended
   * Text, in document order, that binds the response, and 10 when only a Choice or an Inline
   * Choice binds it.
   */
  readonly options: DecodeOptions;
}

/**
 * Give the number base an interaction's posted text is read in: a Text Entry's or an Extended
 * Text's `base`, and none for a Choice or an Inline Choice, which post identifiers.
 *
 * @param interaction The interaction.
 * @returns Its base, or none.
 */
const baseOf = (interaction: Interaction): Option.Option<number> => {
  switch (interaction.kind) {
    case "extended-text":
    case "text-entry": {
      return Option.some(interaction.base);
    }
    case "choice":
    case "inline-choice": {
      return Option.none();
    }
    default: {
      return interaction satisfies never;
    }
  }
};

/**
 * Give the postings of a redacted item in one instance: one for each response of a posted base
 * type that an interaction in the body binds, in the order of the item's `responses`, so a host
 * decodes each from its form with the base its interaction declares instead of assuming base 10.
 *
 * A declared response that no interaction binds has no posting. The form has no Control for it,
 * so a post never carries it, and decoding it would give NULL. A host that saved that NULL would
 * replace the value the response holds in its record, the declared default a test session writes
 * when the item is first presented, and processing would read NULL instead.
 *
 * It reads only a {@link Redacted}, so a host needs no type of the item's body to decode a post.
 * It walks the body once and indexes its interactions by the response each binds, keeping
 * document order, so its time grows with the item, not with its responses times its interactions.
 *
 * @example
 *   const values = postings(redact(accepted), instance).map(({ binding, options }) =>
 *     decode(entries, binding, options),
 *   );
 *
 * @param redacted The item, through `redact`.
 * @param instance The instance token the render used, one `checkInstance` passes.
 * @returns The postings: a response no interaction binds, or of a base type no phase-1
 *   interaction posts, has none.
 */
export const postings = (redacted: Redacted, instance: string): readonly Posting[] => {
  const byResponse = new Map<string, Interaction[]>();
  for (const interaction of interactionsIn(redacted.body)) {
    const others = byResponse.get(interaction.response);
    if (others === undefined) {
      byResponse.set(interaction.response, [interaction]);
    } else {
      others.push(interaction);
    }
  }

  return redacted.responses.flatMap(({ baseType, cardinality, identifier }): readonly Posting[] => {
    const bound = byResponse.get(identifier) ?? [];
    if (!isPosted(baseType) || bound.length === 0) {
      return [];
    }

    return [
      {
        binding: { baseType, cardinality, name: entryName(instance, identifier) },
        identifier,
        options: { base: Option.getOrElse(Arr.findFirst(bound, baseOf), () => 10) },
      },
    ];
  });
};

/**
 * Compute the payload of one render: the allowlist of what the emitter may know about a redacted
 * item and the author's inputs.
 *
 * @param redacted The item, through {@link redactItem}.
 * @param view The author's inputs: the instance, the mode, the seed, values, names, messages and
 *   posted strings.
 * @returns The payload. It holds no correct response, mapping, default, processing rule, seed,
 *   template value or feedback content of the item, whatever the view; the seed only orders a
 *   shuffled Choice's or Inline Choice's choices, and a value it shows is one the view gave.
 */
export const payload = (redacted: Redacted, view: View): Payload => {
  const messages = identifyMessages(view.instance, view.messages);
  const interactions = interactionsIn(redacted.body);
  const restoring = {
    ids: new Set(authoredIdsIn(redacted.body)),
    posted: messages.length > 0 ? view.posted : Option.none(),
    values: view.values,
  };
  const build: Build = {
    ...restoring,
    autofocus: Arr.findFirst(interactions, (interaction) =>
      messages.some((entry) => entry.response === interaction.response),
    ),
    editable: view.mode === "answering",
    instance: view.instance,
    messages,
    names: view.names,
    seed: Option.fromUndefinedOr(view.seed),
    unnamed: unnamedPositions(interactions, restoring),
  };

  return {
    body: copyNodes(redacted.body, build),
    finished: view.finished,
    instance: view.instance,
    lang: Option.getOrElse(redacted.lang, () => view.locale),
    messages,
    mode: view.mode,
    notices: redacted.notices,
    title: redacted.title,
  };
};

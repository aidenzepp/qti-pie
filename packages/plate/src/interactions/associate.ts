/**
 * Associate (Q-1, the `associate` kind): `qti-associate-interaction` read into its model node,
 * copied into its payload node, rendered without script, and checked.
 *
 * Without script the interaction is its Prompt, its choices (a `qti-simple-associable-choice`
 * each, in the order the seed and the instance present them when `shuffle` is true, a `fixed`
 * choice keeping its place), and the list of the associations the view restores, each shown as the
 * text of its two choices' labels ("Pedal paired with Crank"). One hidden input for each pair posts
 * the response under the entry name the host chose, `"<a> <b>"`, so a post is a `pair` response of
 * one entry per pair (decision D2); the runtime reads `data-entry-name` and
 * `data-max-associations` from the Root. The page holds no Control: the way to make a pair is the
 * runtime's select-then-place path, issue ei-05, so that no association needs a drag (WCAG 2.5.7)
 * and every one is made from the keyboard (2.1.1), and the script-free page shows what the response
 * holds (D3).
 *
 * The facts this module keeps to, from the information model and the schema:
 *
 * - The interaction binds a `pair` response of `single` or `multiple` cardinality; any other binding
 *   is the notice, as the shipped kinds give one. A `pair` is unordered, so `A B` and `B A` are one
 *   pair, which the value model's equality already holds.
 * - `max-associations` defaults to 1 and `min-associations` to 0 (`imsqti_asiv3p0p1_v1p0.xsd:24927`,
 *   `:24928`). Reading 53 gives `max-associations="0"` and `match-max="0"` the meaning of no
 *   restriction, and reading 76 holds a least count at most its most unless the most is 0. Reading
 *   92 binds a count above 1, or 0, to a `multiple` response, which `open` enforces before this
 *   module reads the element.
 * - A choice's `match-max` is the most pairs it may be in, and its `match-min` the fewest (default
 *   0); its `match-group` lists the choices it may pair with, and an absent one means any.
 *
 * Where the facts are silent this module takes the planner's defaults for issue ei-04: a choice
 * never pairs with itself, and one pair given twice (in either order) is refused, both in tier (a).
 * A pair is outside a `match-group` when either choice of it names a group that omits the other,
 * since a group says which choices its owner may pair with whichever side it stands on. The
 * information model gives no rule for the author's `data-max-selections-message` and
 * `data-min-selections-message` here, so they are not read: the limits' messages are this module's.
 *
 * Strings the renderer writes here live in this module, in English ({@link words}).
 *
 * @module
 * @see https://www.w3.org/WAI/WCAG22/Understanding/dragging-movements.html
 */
import { Option, Result } from "effect";
import type { Configuration } from "#plate/configuration.ts";
import { attributePath } from "#plate/document/source.ts";
import type { SourceElement } from "#plate/document/source.ts";
import { emitNodes, nestedInteraction } from "#plate/emit/body.ts";
import { text, when } from "#plate/emit/node.ts";
import type { Attributes, Element, Node } from "#plate/emit/node.ts";
import { authoredIdrefs, scopedId, splitTokens } from "#plate/emit/parts.ts";
import type { PartRow } from "#plate/emit/parts.ts";
import { applyPart } from "#plate/emit/swap.ts";
import type { PartSwapRefused } from "#plate/emit/swap.ts";
import { shuffleOrder } from "#plate/engine/random.ts";
import { Malformed } from "#plate/form/encoding.ts";
import { partRow } from "#plate/interactions/contract.ts";
import type {
  InteractionModule,
  ModuleInteraction,
  OwnRegion,
  ParseContext,
  PartSpec,
  TextProps,
} from "#plate/interactions/contract.ts";
import { message, numeral } from "#plate/messages.ts";
import type { Locale } from "#plate/messages.ts";
import type { BodyNode, Unsupported } from "#plate/model/item.ts";
import { format, nullOf, trimXmlSpace } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";
import type { EmitState, Payload, PayloadNode, ValidationMessage } from "#plate/payload.ts";
import type { Refusal } from "#plate/validate/refusal.ts";

/**
 * The owner of every Associate part in the part table.
 */
const owner = "associate-interaction";

/**
 * Associate's identifier in the QTI 3.0 conformance list, Appendix A.
 */
const feature = "Q-1";

/**
 * The QTI element Associate is read from, which its notice names.
 */
const element = "qti-associate-interaction";

/**
 * The separator of the parts of a shuffle's key, as `choiceOrder` in `#plate/payload.ts` keys a
 * Choice's: the seed, the instance and the response, which no identifier or token holds.
 */
const keySeparator = "\u001F";

/**
 * An Associate part, by the key its row and its host override go by.
 */
type AssociatePart = "choice" | "choices" | "hidden" | "pair" | "pairs" | "prompt" | "root";

/**
 * The rows of the Associate parts, each part once: the Root and the Prompt are flow containers (the
 * Root a group the Prompt names); the Choices a list of Choices, and the Pairs a list of Pair
 * items, each list a list owner; the hidden input a native input whose `type` stays `hidden`.
 * `merged` lists every attribute the connect function computes beyond the `data-slot` marker and
 * the Root state (`data-mode`, `data-disabled`), which a replacement may not override.
 */
const parts = {
  choice: {
    defaults: {},
    element: "li",
    listOwner: false,
    merged: ["data-identifier", "data-match-group", "data-match-max"],
    tagClass: "choice-item",
  },
  choices: {
    defaults: {},
    element: "ul",
    listOwner: true,
    merged: [],
    tagClass: "choice-list",
  },
  hidden: {
    defaults: {},
    element: "input",
    listOwner: false,
    merged: ["name", "type", "value"],
    tagClass: "native-input",
  },
  pair: {
    defaults: {},
    element: "li",
    listOwner: false,
    merged: [],
    tagClass: "choice-item",
  },
  pairs: {
    defaults: {},
    element: "ul",
    listOwner: true,
    merged: ["aria-label"],
    tagClass: "choice-list",
  },
  prompt: {
    defaults: {},
    element: "div",
    listOwner: false,
    merged: ["id"],
    tagClass: "prompt",
  },
  root: {
    defaults: {},
    element: "div",
    listOwner: false,
    merged: [
      "aria-describedby",
      "aria-label",
      "aria-labelledby",
      "class",
      "data-entry-name",
      "data-max-associations",
      "role",
    ],
    tagClass: "flow-container",
  },
} as const satisfies { readonly [Q in AssociatePart]: PartSpec };

/**
 * The module's owner and parts, which {@link partRow} derives each part's row from.
 */
const table = { owner, parts } as const;

/**
 * The row of every Associate part, which no placement changes.
 */
const rows = {
  choice: partRow(table, "choice"),
  choices: partRow(table, "choices"),
  hidden: partRow(table, "hidden"),
  pair: partRow(table, "pair"),
  pairs: partRow(table, "pairs"),
  prompt: partRow(table, "prompt"),
  root: partRow(table, "root"),
} satisfies { readonly [Q in AssociatePart]: PartRow };

/**
 * One `qti-simple-associable-choice` of an Associate: a choice either side of a pair.
 */
export interface AssociateChoice {
  /**
   * The choice's content as the body walk read it.
   */
  readonly content: readonly BodyNode[];
  /**
   * `fixed`: the choice keeps its document position when the Associate shuffles.
   */
  readonly fixed: boolean;
  readonly identifier: string;
  /**
   * `match-group`: the choices this one may pair with, none when absent, which means any choice.
   */
  readonly matchGroup: Option.Option<readonly string[]>;
  /**
   * `match-max`: the most pairs this choice may be in; 0 is no limit.
   */
  readonly matchMax: bigint;
  /**
   * `match-min`, 0 when absent: the fewest pairs this choice must be in for a valid response.
   */
  readonly matchMin: bigint;
}

/**
 * A `qti-associate-interaction` (Q-1): its Prompt, its choices, and the limits it declares, bound
 * to a `pair` response of `single` or `multiple` cardinality: each value is two choices.
 */
export interface AssociateInteraction extends ModuleInteraction<"associate"> {
  /**
   * The bound response's cardinality: `multiple`, or `single` for an interaction of one pair.
   */
  readonly cardinality: "multiple" | "single";
  readonly choices: readonly AssociateChoice[];
  /**
   * The author's `class` value, empty when absent.
   */
  readonly class: string;
  /**
   * `max-associations`, 1 when absent (the default the ASI XSD gives it on this interaction): the
   * most pairs a response may hold; 0 is no limit.
   */
  readonly maxAssociations: bigint;
  /**
   * `min-associations`, 0 when absent: the fewest pairs a valid response holds.
   */
  readonly minAssociations: bigint;
  readonly prompt: Option.Option<readonly BodyNode[]>;
  /**
   * `shuffle`: the choices are presented in an order keyed by the seed, the instance and the
   * response, each `fixed` choice at its document position.
   */
  readonly shuffle: boolean;
}

/**
 * One choice as the page may know it: its content, and what the render and the runtime read of its
 * limits.
 */
export interface AssociatePayloadChoice {
  readonly content: readonly PayloadNode[];
  readonly identifier: string;
  /**
   * The choices this one may pair with, none listed when it may pair with any.
   */
  readonly matchGroup: readonly string[];
  readonly matchMax: bigint;
}

/**
 * An Associate as the page may know it: its Prompt, its choices in presented order, the name its
 * hidden inputs post under, and the pairs to restore. It holds no correct response.
 */
export interface AssociatePayload {
  readonly ariaLabel: Option.Option<string>;
  readonly ariaLabelledby: Option.Option<string>;
  readonly choices: readonly AssociatePayloadChoice[];
  /**
   * The author's `class` value, empty when absent.
   */
  readonly class: string;
  /**
   * The name its hidden inputs post under: the view's name for the response, else
   * `entryName(instance, response)`.
   */
  readonly formName: string;
  /**
   * `max-associations`, written or defaulted (0 is no limit), which the runtime reads from the
   * Root.
   */
  readonly maxAssociations: bigint;
  readonly prompt: Option.Option<readonly PayloadNode[]>;
  /**
   * The identifier of the response it binds.
   */
  readonly response: string;
  /**
   * The pairs to show, each as posted, `<a> <b>`: the strings posted when the view has messages,
   * else the view's value.
   */
  readonly restore: readonly string[];
}

/**
 * The JSON form of a choice in a redacted body, with no path: its counts as decimal digits and
 * each `Option` an optional key.
 */
interface AssociateChoiceJson {
  readonly content: readonly unknown[];
  readonly fixed: boolean;
  readonly identifier: string;
  readonly matchGroup?: readonly string[];
  readonly matchMax: string;
  readonly matchMin: string;
}

/**
 * The JSON form of an Associate in a redacted body: its counts as decimal digits, each `Option` an
 * optional key, and no path. Its content is held as the body's own JSON form, which this module
 * cannot name.
 */
export interface AssociateJson {
  readonly ariaLabel?: string;
  readonly ariaLabelledby?: string;
  readonly cardinality: "multiple" | "single";
  readonly choices: readonly AssociateChoiceJson[];
  readonly class: string;
  readonly kind: "associate";
  readonly maxAssociations: string;
  readonly minAssociations: string;
  readonly prompt?: readonly unknown[];
  readonly response: string;
  readonly shuffle: boolean;
}

/**
 * The strings the renderer writes for Associate, by locale. A `{name}` is a placeholder that
 * {@link say} fills.
 */
const words = {
  en: {
    atLeast: "Make at least {n} pairs.",
    atLeastOne: "Make at least 1 pair.",
    atMost: "Make at most {n} pairs.",
    atMostOne: "Make at most 1 pair.",
    choiceAtLeast: "Use choice {choice} in at least {n} pairs.",
    choiceAtLeastOne: "Use choice {choice} in at least 1 pair.",
    choiceAtMost: "Use choice {choice} in at most {n} pairs.",
    choiceAtMostOne: "Use choice {choice} in at most 1 pair.",
    itself: "Choice {choice} cannot be paired with itself; pair it with a different choice.",
    outsideGroup:
      "Choice {choice} cannot be paired with choice {other}; pair it with one of {group} instead.",
    pair: "{first} paired with {second}",
    pairs: "Associations",
    repeated:
      "Choice {first} and choice {second} are paired more than once; keep only one of those pairs.",
    unknown: "Pair only the choices shown.",
  },
} as const satisfies Readonly<Record<Locale, Readonly<Record<string, string>>>>;

/**
 * The key of a string the renderer writes for Associate.
 */
type Word = keyof (typeof words)["en"];

/**
 * A `{name}` placeholder in a string of {@link words}; its one group is the name.
 */
const placeholder = /\{(?<name>[A-Za-z]+)\}/gu;

/**
 * Write Associate's text for a key in a locale, each placeholder filled in one pass, so a value
 * that holds a `{name}` of its own stays as written.
 *
 * @param locale The locale of the renderer's own text.
 * @param key The string to write.
 * @param values The value of each `{name}` placeholder the string holds.
 * @returns The string, a placeholder with no value left as written.
 */
const say = (locale: Locale, key: Word, values: Readonly<Record<string, string>> = {}): string =>
  words[locale][key].replaceAll(placeholder, (whole, name: string) => values[name] ?? whole);

/**
 * Write a count limit's message: the singular string at a count of 1, else the plural with the
 * count.
 *
 * @param locale The locale of the renderer's own text.
 * @param count The limit.
 * @param one The key of the string for a limit of 1.
 * @param many The key of the string for any other limit, which holds `{n}`.
 * @param values The value of every other placeholder the strings hold.
 * @returns The message.
 */
const counted = (
  locale: Locale,
  count: bigint,
  one: Word,
  many: Word,
  values: Readonly<Record<string, string>> = {},
): string =>
  count === 1n
    ? say(locale, one, values)
    : say(locale, many, { ...values, n: numeral(locale, count) });

/**
 * Read an attribute of an element the body walk kept, as it kept it.
 *
 * @param attributes The element's attributes.
 * @param attribute The attribute's name.
 * @returns Its value as written, empty when the element does not carry it.
 */
const valueIn = (
  attributes: readonly { readonly name: string; readonly value: string }[],
  attribute: string,
): string => attributes.find(({ name }) => name === attribute)?.value ?? "";

/**
 * Give the choices in the order a render presents them: document order, or with `shuffle` the order
 * `shuffleOrder` draws under the key `<seed>\u001F<instance>\u001F<response>`, where an absent seed
 * is the empty string, each fixed choice at its document position. The same interaction, seed and
 * instance always give the same order, so `sequence` reports the order `render` presents.
 *
 * @param interaction The Associate: its choices, its response and its `shuffle`.
 * @param seed The configuration's `seed`, none when it has none.
 * @param instance The item instance key the interaction is rendered under.
 * @returns The choices, in presented order.
 */
const presented = (
  interaction: Pick<AssociateInteraction, "choices" | "response" | "shuffle">,
  seed: Option.Option<string>,
  instance: string,
): readonly AssociateChoice[] =>
  interaction.shuffle
    ? shuffleOrder(
        [Option.getOrElse(seed, () => ""), instance, interaction.response].join(keySeparator),
        interaction.choices.map((choice) => choice.fixed),
      ).flatMap((index) => interaction.choices[index] ?? [])
    : interaction.choices;

/**
 * Split a pair as posted into its two choices: two identifiers separated by white space.
 *
 * @param pair The pair as posted.
 * @returns The two sides in the order written, none for a text that is not two identifiers.
 */
const sidesOf = (pair: string): Option.Option<readonly [string, string]> => {
  const [first, second, ...rest] = splitTokens(pair);

  return first === undefined || second === undefined || rest.length > 0
    ? Option.none()
    : Option.some([first, second] as const);
};

/**
 * Collapse runs of ASCII whitespace to one space and trim the ends.
 *
 * @param value The text.
 * @returns The collapsed text.
 */
const collapse = (value: string): string =>
  value.replaceAll(/[\t\n\f\r ]+/gu, " ").replaceAll(/^ | $/gu, "");

/**
 * Collect the text of some payload nodes: every text node, at any depth, as written.
 *
 * @param nodes The nodes.
 * @returns The text, concatenated.
 */
const textIn = (nodes: readonly PayloadNode[]): string =>
  nodes
    .map((node) => {
      if (node.kind === "text") {
        return node.text;
      }

      return node.kind === "element" ? textIn(node.children) : "";
    })
    .join("");

/**
 * Find the first `alt` an image in some payload nodes carries that holds more than white space, at
 * any depth.
 *
 * @param nodes The nodes.
 * @returns The `alt`, collapsed; empty when no image has one.
 */
const altIn = (nodes: readonly PayloadNode[]): string =>
  nodes
    .flatMap((node) => {
      if (node.kind !== "element") {
        return [];
      }

      const own = node.tag === "img" ? collapse(valueIn(node.attributes, "alt")) : "";

      return [own === "" ? altIn(node.children) : own];
    })
    .find((alt) => alt !== "") ?? "";

/**
 * Give the label a choice has in a pair: its content's text, collapsed; for a choice with none, the
 * `alt` of an image it holds; else "Choice n of count", `n` its presented position. A pair is shown
 * as text, so a choice is named by its words, never by its markup.
 *
 * @param choice The choice.
 * @param position The choice's position `n`, from 1, among the `count` choices as presented.
 * @param count How many choices there are.
 * @param locale The locale of the renderer's own text.
 * @returns The label.
 */
const labelOf = (
  choice: AssociatePayloadChoice,
  position: number,
  count: number,
  locale: Locale,
): string => {
  const written = collapse(textIn(choice.content));
  if (written !== "") {
    return written;
  }

  const alt = altIn(choice.content);

  return alt === ""
    ? message(locale, "choiceOf", { count: numeral(locale, count), n: numeral(locale, position) })
    : alt;
};

/**
 * One pair the page shows: its two choices as posted, and the text that names both.
 */
interface Placed {
  /**
   * The pair as its hidden input posts it, `<a> <b>`, the order the restored response gave.
   */
  readonly pair: string;
  /**
   * The text of the Pair item, both labels.
   */
  readonly text: string;
}

/**
 * Find the pairs the page shows, in the order restored: a pair counts when both of its identifiers
 * name a choice of the interaction, so one that names a choice the page does not hold is neither
 * listed nor posted back. A refused post's pairs stay, a choice paired with itself or a pair given
 * twice among them, so the messages that refuse them name what the page shows.
 *
 * @param interaction The Associate's payload.
 * @param locale The locale of the renderer's own text.
 * @returns One entry for each pair shown.
 */
const placedIn = (interaction: AssociatePayload, locale: Locale): readonly Placed[] => {
  const labels = new Map(
    interaction.choices.map((choice, index) => [
      choice.identifier,
      labelOf(choice, index + 1, interaction.choices.length, locale),
    ]),
  );

  return interaction.restore.flatMap((written) =>
    Option.match(sidesOf(written), {
      onNone: () => [],
      onSome: ([first, second]) => {
        const firstLabel = labels.get(first);
        const secondLabel = labels.get(second);

        return firstLabel === undefined || secondLabel === undefined
          ? []
          : [
              {
                pair: `${first} ${second}`,
                text: say(locale, "pair", { first: firstLabel, second: secondLabel }),
              },
            ];
      },
    }),
  );
};

/**
 * Name the group when the Prompt does not: the author's `aria-label`, as written unless it is
 * blank, and `aria-labelledby` with each id scoped by the instance; the group is `role="group"`
 * only when something names it.
 *
 * @param interaction The Associate's payload.
 * @param instance The item instance key, which scopes the author's ids.
 * @returns The naming attributes, none when the author gave neither.
 */
const authorsName = (interaction: AssociatePayload, instance: string): Attributes => {
  const label = interaction.ariaLabel.pipe(
    Option.filter((written) => trimXmlSpace(written) !== ""),
  );
  const labelledby = interaction.ariaLabelledby.pipe(
    Option.flatMap((ids) => authoredIdrefs(instance, ids)),
  );

  return {
    ...Option.match(label, {
      onNone: () => ({}),
      onSome: (written) => ({ "aria-label": written }),
    }),
    ...Option.match(labelledby, {
      onNone: () => ({}),
      onSome: (ids) => ({ "aria-labelledby": ids }),
    }),
    ...when(Option.isSome(label) || Option.isSome(labelledby), { role: "group" }),
  };
};

/**
 * The attributes of every part of one Associate, computed once by {@link connect}: one entry per
 * choice in presented order, per pair shown (with the text it shows) and per hidden input.
 */
interface AssociateConnected {
  readonly choice: readonly Attributes[];
  readonly choices: Attributes;
  readonly hidden: readonly Attributes[];
  readonly pair: readonly TextProps[];
  readonly pairs: Attributes;
  readonly prompt: Attributes;
  readonly root: Attributes;
}

/**
 * Compute every attribute of every part of one Associate: the connect function.
 *
 * - Root: the marker, the state (`data-mode`, and `data-disabled` when the author disabled every
 *   control), the author's `class`, `data-entry-name`, the name the runtime writes its hidden
 *   inputs under, and `data-max-associations`, the written limit or its default. It is
 *   `role="group"`, named by the Prompt through `aria-labelledby` → the Prompt's id, and the
 *   author's names are not written; with no Prompt, by the author's `aria-label` and
 *   `aria-labelledby`; with neither, the group stays unnamed and carries no role.
 *   `aria-describedby` → the message ids when the response has a message.
 * - Prompt: the marker and its id. Choices: the marker.
 * - Choice, one for each choice in presented order: its identifier, its `match-max` and, when the
 *   choice names the choices it may pair with, its `match-group`.
 * - Pairs: the marker and `aria-label`, which names the list. Pair, one for each pair shown: the
 *   marker, and the text naming both of its choices ({@link placedIn}).
 * - Hidden, one for each pair shown, only while the candidate may answer: `type="hidden"`, the name
 *   and the pair as posted. None in `review` and `solution`, nor when the author finished the item:
 *   the form posts nothing for it.
 *
 * @param interaction The Associate's payload.
 * @param payload The payload, which gives the instance, the mode, `finished` and the messages.
 * @param locale The locale of the renderer's own text.
 * @returns The attributes of every part.
 */
const connect = (
  interaction: AssociatePayload,
  payload: Payload,
  locale: Locale,
): AssociateConnected => {
  const { instance } = payload;
  const promptId = scopedId(instance, interaction.response, "prompt");
  const messageIds = payload.messages
    .filter((entry) => entry.response === interaction.response)
    .map((entry) => entry.id);
  const answering = payload.mode === "answering" && !payload.finished;
  const placed = placedIn(interaction, locale);

  return {
    choice: interaction.choices.map((choice) => ({
      "data-identifier": choice.identifier,
      ...when(choice.matchGroup.length > 0, { "data-match-group": choice.matchGroup.join(" ") }),
      "data-match-max": String(choice.matchMax),
      "data-slot": rows.choice.slot,
    })),
    choices: { "data-slot": rows.choices.slot },
    hidden: answering
      ? placed.map(({ pair }) => ({
          "data-slot": rows.hidden.slot,
          name: interaction.formName,
          type: "hidden",
          value: pair,
        }))
      : [],
    pair: placed.map((entry) => ({
      props: { "data-slot": rows.pair.slot },
      text: entry.text,
    })),
    pairs: { "aria-label": say(locale, "pairs"), "data-slot": rows.pairs.slot },
    prompt: { "data-slot": rows.prompt.slot, id: promptId },
    root: {
      ...Option.match(interaction.prompt, {
        onNone: () => authorsName(interaction, instance),
        onSome: () => ({ "aria-labelledby": promptId, role: "group" }),
      }),
      ...when(messageIds.length > 0, { "aria-describedby": messageIds.join(" ") }),
      ...when(interaction.class !== "", { class: interaction.class }),
      "data-entry-name": interaction.formName,
      "data-max-associations": String(interaction.maxAssociations),
      ...when(payload.finished, { "data-disabled": true }),
      "data-mode": payload.mode,
      "data-slot": rows.root.slot,
    },
  };
};

/**
 * Render an Associate: a `div` Root holding the Prompt, when there is one, a `ul` of Choices, a
 * `ul` of the Pairs shown, and the hidden inputs.
 *
 * Each part goes through `applyPart` with its replacement from `state.parts`, so every swap holds
 * I1 to I4. The Prompt and each choice's content go through {@link emitNodes}, as the body's do,
 * with the heading shift, ids and URLs of the body.
 *
 * @param interaction The Associate's payload.
 * @param payload The payload of the whole render, which gives the instance and `finished`.
 * @param state The locale, the heading level and the resolved part overrides.
 * @returns The Associate Root, or {@link PartSwapRefused} when a replacement breaks the swap
 *   invariant.
 * @throws {NestedInteractionDefect} When the Prompt or a choice's content holds an interaction,
 *   which QTI's schema admits nowhere there.
 */
const renderAssociate = (
  interaction: AssociatePayload,
  payload: Payload,
  state: EmitState,
): Result.Result<Element, PartSwapRefused> => {
  const props = connect(interaction, payload, state.locale);
  const replacement = (part: AssociatePart) =>
    Option.getOrUndefined(state.parts.replacementFor(owner, part));

  return Result.gen(function* associateRoot() {
    const choices = yield* Result.all(
      interaction.choices.map((choice, index) =>
        Result.flatMap(
          emitNodes(choice.content, payload, state, nestedInteraction(owner)),
          (nodes) =>
            applyPart(rows.choice, props.choice[index] ?? {}, nodes, replacement("choice")),
        ),
      ),
    );
    const list = yield* applyPart(rows.choices, props.choices, choices, replacement("choices"));
    const prompt = yield* Result.transposeOption(
      interaction.prompt.pipe(
        Option.map((content) =>
          Result.flatMap(emitNodes(content, payload, state, nestedInteraction(owner)), (nodes) =>
            applyPart(rows.prompt, props.prompt, nodes, replacement("prompt")),
          ),
        ),
      ),
    );
    const shown = yield* Result.all(
      props.pair.map((entry) =>
        applyPart(rows.pair, entry.props, [text(entry.text)], replacement("pair")),
      ),
    );
    const pairs = yield* applyPart(rows.pairs, props.pairs, shown, replacement("pairs"));
    const hidden = yield* Result.all(
      props.hidden.map((input) => applyPart(rows.hidden, input, [], replacement("hidden"))),
    );
    const children: readonly Node[] = [...Option.toArray(prompt), list, pairs, ...hidden];

    return yield* applyPart(rows.root, props.root, children, replacement("root"));
  });
};

/**
 * Read one `qti-simple-associable-choice` into its choice: its identifier, its limits and its
 * content as the body walk reads it. A `template-identifier` the choice carries is recorded as a
 * mark: plate shows no choice by a template value here.
 *
 * @param context The element's path, its notice and the reader kit.
 * @param choice The `qti-simple-associable-choice`.
 * @returns The choice, or a refusal.
 */
const readChoice = (
  context: ParseContext,
  choice: SourceElement,
): Result.Result<AssociateChoice, Refusal> =>
  Result.gen(function* readAssociableChoice() {
    const { read } = context;

    read.markElement(choice);
    if (Option.isSome(read.valueOf(choice, "template-identifier"))) {
      read.mark(choice, "template-identifier");
    }

    const matchMax = yield* read.countAttribute(choice, "match-max");
    const matchMin = yield* read.countAttribute(choice, "match-min");

    return {
      content: yield* read.nodes(choice),
      fixed: yield* read.xsBoolean(choice, "fixed", false),
      identifier: yield* read.identifierAttribute(choice, "identifier"),
      matchGroup: Option.map(read.valueOf(choice, "match-group"), splitTokens),
      matchMax: Option.getOrElse(matchMax, () => 0n),
      matchMin: Option.getOrElse(matchMin, () => 0n),
    };
  });

/**
 * Read a `qti-associate-interaction` as {@link associateModule} renders it, through the kit.
 *
 * The response must be declared (`undeclared-response` otherwise, as the shipped kinds refuse), of
 * cardinality `single` or `multiple` and base type `pair`; a declaration outside that is the
 * notice `cardinality="…"` or `base-type="…"`. The Prompt and each choice's content are read by
 * the body walk. The features it reads and does not render are recorded as marks:
 * `template-identifier` on a choice.
 *
 * @param source The interaction's source element.
 * @param context The element's path, its notice and the reader kit.
 * @returns The model node, its notice, or a refusal.
 */
const parse = (
  source: SourceElement,
  context: ParseContext,
): Result.Result<AssociateInteraction | Unsupported, Refusal> =>
  Result.gen(function* readAssociate() {
    const { read } = context;
    const written = yield* read.requiredAttribute(source, "response-identifier");
    const response = read.identifierOf(written.value);
    const { bound } = read;

    if (Option.isNone(bound)) {
      return yield* Result.fail(
        read.refusal("undeclared-response", attributePath(context.path, written), { response }),
      );
    }

    const declaration = bound.value;
    const declared = Option.getOrUndefined(declaration.cardinality);
    const writtenOf = (name: string) =>
      Option.getOrElse(read.valueOf(declaration.element, name), () => "");

    if (declared !== "multiple" && declared !== "single") {
      return yield* context.notice(`cardinality="${writtenOf("cardinality")}"`);
    }

    if (!Option.contains(declaration.baseType, "pair")) {
      return yield* context.notice(`base-type="${writtenOf("base-type")}"`);
    }

    read.markElement(source);

    const maxAssociations = yield* read.countAttribute(source, "max-associations");
    const minAssociations = yield* read.countAttribute(source, "min-associations");
    const shuffle = yield* read.xsBoolean(source, "shuffle", false);
    const prompt = yield* read.content(source, "qti-prompt");
    const choices: AssociateChoice[] = [];

    for (const child of read.elementsOf(source)) {
      if (read.isQti(child, "qti-simple-associable-choice")) {
        choices.push(yield* readChoice(context, child));
      }
    }

    return {
      ariaLabel: read.valueOf(source, "aria-label"),
      ariaLabelledby: read.valueOf(source, "aria-labelledby"),
      cardinality: declared,
      choices,
      class: Option.getOrElse(read.valueOf(source, "class"), () => ""),
      kind: "associate",
      maxAssociations: Option.getOrElse(maxAssociations, () => 1n),
      minAssociations: Option.getOrElse(minAssociations, () => 0n),
      path: context.path,
      prompt,
      response,
      shuffle,
    };
  });

/**
 * Give the key two choices make as a pair, the same whichever comes first: a `pair` is unordered.
 *
 * @param first One choice's identifier.
 * @param second The other's.
 * @returns The two identifiers in code-unit order, separated by a space.
 */
const keyOf = (first: string, second: string): string =>
  first < second ? `${first} ${second}` : `${second} ${first}`;

/**
 * Count how often each identifier occurs, in order of first occurrence.
 *
 * @param identifiers The identifiers, with repeats.
 * @returns Each identifier with its count.
 */
const countsOf = (identifiers: readonly string[]): ReadonlyMap<string, number> => {
  const counts = new Map<string, number>();

  for (const identifier of identifiers) {
    counts.set(identifier, (counts.get(identifier) ?? 0) + 1);
  }

  return counts;
};

/**
 * Give the choices a choice may pair with.
 *
 * @param choice The choice, none for an identifier that names no choice.
 * @returns Its `match-group`, empty when it names none, which means any choice.
 */
const groupOf = (choice: AssociateChoice | undefined): readonly string[] =>
  choice === undefined ? [] : Option.getOrElse(choice.matchGroup, (): readonly string[] => []);

/**
 * Find the choice of a pair whose `match-group` omits the other choice.
 *
 * @param choices The interaction's choices, by identifier.
 * @param first One choice of the pair.
 * @param second The other.
 * @returns The choice that holds the group and the choice it omits, the first side's when both
 *   sides break their groups; none when neither does.
 */
const outsideGroup = (
  choices: ReadonlyMap<string, AssociateChoice>,
  first: string,
  second: string,
): Option.Option<readonly [holder: string, other: string]> =>
  Option.fromUndefinedOr(
    (
      [
        [first, second],
        [second, first],
      ] as const
    ).find(([holder, other]) => {
      const group = groupOf(choices.get(holder));

      return group.length > 0 && !group.includes(other);
    }),
  );

/**
 * Check an Associate's response, which the caller decoded, in two tiers.
 *
 * The caller decodes the posted entries with `decode`, under the entry name its form gave the
 * hidden inputs and the binding a `pair` response travels under, and passes the value, or the
 * {@link Malformed} `decode` gave; the entry name stays the caller's, while the messages stay here.
 * A pair counts once, in either order, for every limit but the repeat itself, so one cause gives
 * one message.
 *
 * - A {@link Malformed} input: `atMost` 1 when a single response was posted more than once, else the
 *   message that names the choices shown.
 * - Tier (a), always: a pair that names a choice the interaction does not hold; a choice paired with
 *   itself; a pair given more than once, in either order; a choice in more pairs than its
 *   `match-max` (0 is no limit); a pair outside the `match-group` of either of its choices; and
 *   `max-associations` above 0 capping the pairs.
 * - Tier (b), only under `validateResponses`: fewer pairs than `min-associations`, and a choice in
 *   fewer pairs than its `match-min`.
 *
 * @param interaction The Associate.
 * @param input The decoded value, or why the entries did not decode.
 * @param configuration The configuration, which gives the locale and `validateResponses`.
 * @returns One message per problem, none when the response is accepted.
 */
const validate = (
  interaction: AssociateInteraction,
  input: Value | Malformed,
  configuration: Configuration,
): readonly ValidationMessage[] => {
  const { locale } = configuration;
  const problem = (written: string): ValidationMessage => ({
    response: interaction.response,
    text: written,
  });

  if (input instanceof Malformed) {
    return [problem(say(locale, input.reason === "single-many" ? "atMostOne" : "unknown"))];
  }

  const given = input.values.flatMap((single) =>
    single.baseType === "pair" ? [single.value] : [],
  );
  const occurrences = countsOf(given.map(([first, second]) => keyOf(first, second)));
  const firsts = new Map<string, readonly [string, string]>();

  for (const pair of given) {
    const key = keyOf(...pair);

    if (!firsts.has(key)) {
      firsts.set(key, pair);
    }
  }

  const choices = new Map(interaction.choices.map((choice) => [choice.identifier, choice]));
  const distinct = [...firsts.values()];
  const usable = distinct.filter(
    ([first, second]) => first !== second && choices.has(first) && choices.has(second),
  );
  const perChoice = countsOf(usable.flat());
  const tierA = [
    ...(distinct.some(([first, second]) => !choices.has(first) || !choices.has(second))
      ? [problem(say(locale, "unknown"))]
      : []),
    ...distinct
      .filter(([first, second]) => first === second)
      .map(([choice]) => problem(say(locale, "itself", { choice }))),
    ...distinct
      .filter(([first, second]) => (occurrences.get(keyOf(first, second)) ?? 0) > 1)
      .map(([first, second]) => problem(say(locale, "repeated", { first, second }))),
    ...interaction.choices.flatMap((choice) =>
      choice.matchMax > 0n && BigInt(perChoice.get(choice.identifier) ?? 0) > choice.matchMax
        ? [
            problem(
              counted(locale, choice.matchMax, "choiceAtMostOne", "choiceAtMost", {
                choice: choice.identifier,
              }),
            ),
          ]
        : [],
    ),
    ...usable.flatMap(([first, second]) =>
      Option.match(outsideGroup(choices, first, second), {
        onNone: () => [],
        onSome: ([holder, other]) => [
          problem(
            say(locale, "outsideGroup", {
              choice: holder,
              group: groupOf(choices.get(holder)).join(", "),
              other,
            }),
          ),
        ],
      }),
    ),
    ...(interaction.maxAssociations > 0n && BigInt(distinct.length) > interaction.maxAssociations
      ? [problem(counted(locale, interaction.maxAssociations, "atMostOne", "atMost"))]
      : []),
  ];

  if (!configuration.validateResponses) {
    return tierA;
  }

  return [
    ...tierA,
    ...(BigInt(distinct.length) < interaction.minAssociations
      ? [problem(counted(locale, interaction.minAssociations, "atLeastOne", "atLeast"))]
      : []),
    ...interaction.choices.flatMap((choice) =>
      BigInt(perChoice.get(choice.identifier) ?? 0) < choice.matchMin
        ? [
            problem(
              counted(locale, choice.matchMin, "choiceAtLeastOne", "choiceAtLeast", {
                choice: choice.identifier,
              }),
            ),
          ]
        : [],
    ),
  ];
};

/**
 * The regions of an Associate's own content, in document order: its Prompt, when it has one, then
 * each choice's content.
 *
 * @param interaction The model node.
 * @returns The regions, without their owner.
 */
const ownRegions = (interaction: AssociateInteraction): readonly OwnRegion[] => [
  ...Option.match(interaction.prompt, {
    onNone: (): readonly OwnRegion[] => [],
    onSome: (nodes): readonly OwnRegion[] => [
      { choice: Option.none(), nodes, part: "prompt", written: "nodes" },
    ],
  }),
  ...interaction.choices.map((choice): OwnRegion => ({
    choice: Option.some(choice.identifier),
    nodes: choice.content,
    part: "choice",
    written: "nodes",
  })),
];

/**
 * The Associate module.
 */
export const associateModule: InteractionModule<
  "associate",
  AssociateInteraction,
  AssociatePayload,
  AssociatePart,
  AssociateJson
> = {
  /**
   * The one response Associate binds, which `postings` reads: its `pair`s are posted as text with
   * no number base.
   */
  bindings: (interaction) => [{ base: Option.none(), response: interaction.response }],
  /**
   * Associate's connect function, {@link connect}, as the record of parts the contract names.
   */
  connect: (interaction, payload, locale) => ({ ...connect(interaction, payload, locale) }),
  /**
   * The payload nodes the render writes as content: the Prompt, then each choice's content in
   * presented order.
   */
  content: (interaction) => [
    ...Option.getOrElse(interaction.prompt, () => []),
    ...interaction.choices.flatMap((choice) => choice.content),
  ],
  /**
   * No Controls: the script-free render holds hidden inputs only, and the runtime gives the input.
   */
  controls: () => 0,
  element,
  feature,
  /**
   * True: the module renders the kind.
   */
  implemented: true,
  kind: "associate",
  /**
   * The NULL of the `pair` response Associate binds, of the cardinality it declares.
   */
  nullValue: (interaction) => nullOf("pair", interaction.cardinality),
  owner,
  parse,
  parts,
  /**
   * The codec of an Associate in a redacted body: every field of the model node but its path.
   */
  payloadSchema: ({ BodyNodes, Count, NoPath, OptionalText, Schema }) =>
    Schema.Struct({
      ariaLabel: OptionalText,
      ariaLabelledby: OptionalText,
      cardinality: Schema.Literals(["multiple", "single"]),
      choices: Schema.Array(
        Schema.Struct({
          content: BodyNodes,
          fixed: Schema.Boolean,
          identifier: Schema.String,
          matchGroup: Schema.OptionFromOptionalKey(Schema.Array(Schema.String)),
          matchMax: Count,
          matchMin: Count,
        }),
      ),
      class: Schema.String,
      kind: Schema.Literal("associate"),
      maxAssociations: Count,
      minAssociations: Count,
      path: NoPath,
      prompt: Schema.OptionFromOptionalKey(BodyNodes),
      response: Schema.String,
      shuffle: Schema.Boolean,
    }),
  /**
   * Copy the Associate into its payload node: its content through the kit, its choices in the order
   * the seed and the instance present them, and the pairs the view shows, as posted when the view
   * holds a refused post.
   */
  redact: (interaction, kit) => ({
    ariaLabel: interaction.ariaLabel,
    ariaLabelledby: interaction.ariaLabelledby,
    choices: presented(interaction, kit.seed, kit.instance).map((choice) => ({
      content: kit.nodes(choice.content),
      identifier: choice.identifier,
      matchGroup: Option.getOrElse(choice.matchGroup, () => []),
      matchMax: choice.matchMax,
    })),
    class: interaction.class,
    formName: kit.formName(interaction.response),
    maxAssociations: interaction.maxAssociations,
    prompt: interaction.prompt.pipe(Option.map(kit.nodes)),
    response: interaction.response,
    restore: Option.getOrElse(kit.posted(interaction.response), () =>
      kit.shown(interaction.response).map(format),
    ),
  }),
  /**
   * The regions of the node's own content, in document order: its Prompt, then each choice's
   * content.
   */
  regions: ownRegions,
  render: renderAssociate,
  /**
   * Rebuild the node with each region's content replaced, in the order `regions` gives them.
   */
  replaceRegions: (interaction, contents) => {
    const [first, ...rest] = contents;
    const after = Option.isSome(interaction.prompt) ? rest : contents;

    return {
      ...interaction,
      choices: interaction.choices.map((choice, index) => ({
        ...choice,
        content: after[index] ?? choice.content,
      })),
      prompt: interaction.prompt.pipe(Option.map((nodes) => first ?? nodes)),
    };
  },
  /**
   * The value Associate shows for a stored response: the stored pairs themselves, which the page
   * keeps to those that name two of its choices.
   */
  restore: (_interaction, stored) => stored,
  /**
   * The order Associate's choices were presented in, as the identifiers separated by spaces; none
   * without `shuffle`.
   */
  sequence: (interaction, seed, instance) =>
    interaction.shuffle
      ? Option.some(
          presented(interaction, seed, instance)
            .map((choice) => choice.identifier)
            .join(" "),
        )
      : Option.none(),
  /**
   * The value Associate shows for the correct response: the correct pairs themselves.
   */
  solution: (_interaction, correct) => correct,
  /**
   * False: Associate renders no Control the renderer names.
   */
  unnamed: () => false,
  validate,
};

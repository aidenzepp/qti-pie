/**
 * Gap Match (Q-6): its model node, parts, parse, redaction, render and response validation, on the
 * module shape the interaction-module contract states.
 *
 * Two readings of `docs/spec-readings.md` bind it. "A `qti-gap` appears only within a gap-match
 * interaction, and a `qti-hottext` may appear in any flow or inline …": `open` refuses a gap
 * outside this interaction, so {@link gapMatchModule}'s `parse` reads `qti-gap` only inside its
 * own element, as an element of the gapped content the kit's body walk lets through. "A gap match
 * interaction with two or more gaps binds a response of multiple cardinality.": `open` enforces
 * it, so `parse` reads the declared cardinality, `single` or `multiple`, and any other is the
 * notice `cardinality="…"`, as a binding no shipped kind renders is.
 *
 * Proposed reading, for the operator: an unwritten `max-associations` reads as the default the
 * schema gives the attribute on this interaction, 1. The ASI XSD declares, in
 * `GapMatchInteractionDType`, `<xs:attribute name="max-associations" use="optional" default="1"
 * type="xs:nonNegativeInteger" />` (`imsqti_asiv3p0p1_v1p0.xsd:27805`), and `min-associations`
 * with no default (`:27804`), so an unwritten `min-associations` is no minimum. Reading 92 reads
 * an unwritten count as its XSD default, and reading 53 gives `0` the meaning of no restriction:
 * "`max-associations` (section 5.8.2) and `match-max` (section 5.7.8) say the same". So a response
 * of more pairs than the item writes, or than 1 when it writes none, is refused in tier (a), and
 * the correct response of an item that writes three pairs and no `max-associations`, such as the
 * 1EdTech examples `jumble-gapMatch.xml` and `multi-input.xml`, is refused as any response over a
 * limit is.
 *
 * {@link gapMatchModule}'s render emits this structure: a `div` Root that is `role="group"`, named
 * by its Prompt through `aria-labelledby` (or by the author's names when there is no Prompt); the
 * Prompt; a `ul` of Choices, one `li` for each gap text in presented order; the Content, the
 * author's gapped content with each `qti-gap` written as a Gap, a `span` that holds the chosen
 * choice's text (a GapChoice) once the restored response puts one in it; and, only while the
 * candidate may answer, one hidden input for each pair under the host's entry name (the wire of
 * decision D2, which `runtime/wire.dom.ts` writes again from the page). The page holds no other
 * control: a Gap Match has no non-drag input without script, and the select-then-place path is the
 * runtime's (WCAG 2.5.7), so the script-free render shows the response and posts it.
 *
 * {@link gapMatchModule}'s `validate` checks a value the caller decoded, in two tiers: tier (a)
 * always, tier (b) only under `validateResponses` (D5).
 *
 * @module
 */
import { Option, Result, pipe } from "effect";
import type { Configuration } from "#plate/configuration.ts";
import { attributePath } from "#plate/document/source.ts";
import type { SourceChild, SourceElement } from "#plate/document/source.ts";
import { emitNodes, nestedInteraction } from "#plate/emit/body.ts";
import type { OwnedElements } from "#plate/emit/body.ts";
import { text, when } from "#plate/emit/node.ts";
import type { Attributes, Element } from "#plate/emit/node.ts";
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
  ParseContext,
  PartSpec,
  ReaderKit,
  TextProps,
} from "#plate/interactions/contract.ts";
import { message, numeral } from "#plate/messages.ts";
import type { Locale } from "#plate/messages.ts";
import type { BodyNode, Unsupported } from "#plate/model/item.ts";
import { format, nullOf, trimXmlSpace } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";
import type {
  ElementPayload,
  EmitState,
  Payload,
  PayloadNode,
  ValidationMessage,
} from "#plate/payload.ts";
import type { Refusal } from "#plate/validate/refusal.ts";

/**
 * The owner of every Gap Match part in the part table.
 */
const owner = "gap-match-interaction";

/**
 * Gap Match's identifier in the QTI 3.0 conformance list, Appendix A.
 */
const feature = "Q-6";

/**
 * The QTI element Gap Match is read from, which its notice names.
 */
const element = "qti-gap-match-interaction";

/**
 * The separator of the parts of a shuffle's key, as `choiceOrder` in `#plate/payload.ts` keys a
 * Choice's: the seed, the instance and the response, which no identifier or token holds.
 */
const keySeparator = "\u001F";

/**
 * A Gap Match part, by the key its row and its host override go by.
 */
type GapMatchPart =
  | "choice"
  | "choices"
  | "content"
  | "gap"
  | "gapChoice"
  | "hidden"
  | "prompt"
  | "root";

/**
 * The rows of the Gap Match parts, each part once: the Root and the Prompt are flow containers
 * (the Root a group the Prompt names); the Choices a list of Choices; the Content the author's
 * gapped content; a Gap a phrasing container inside the author's sentence, and the GapChoice
 * another inside it; the hidden input a native input whose `type` stays `hidden`. `merged` lists
 * every attribute the connect function computes beyond the `data-slot` marker and the Root state
 * (`data-mode`, `data-disabled`), which a replacement may not override.
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
  content: {
    defaults: {},
    element: "div",
    listOwner: false,
    merged: [],
    tagClass: "flow-container",
  },
  gap: {
    defaults: {},
    element: "span",
    listOwner: false,
    merged: ["data-gap", "data-required"],
    tagClass: "phrasing-container",
  },
  gapChoice: {
    defaults: {},
    element: "span",
    listOwner: false,
    merged: ["data-identifier"],
    tagClass: "phrasing-container",
  },
  hidden: {
    defaults: {},
    element: "input",
    listOwner: false,
    merged: ["name", "type", "value"],
    tagClass: "native-input",
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
      "role",
    ],
    tagClass: "flow-container",
  },
} as const satisfies { readonly [Q in GapMatchPart]: PartSpec };

/**
 * The module's owner and parts, which {@link partRow} derives each part's row from.
 */
const table = { owner, parts } as const;

/**
 * The row of every Gap Match part, which no placement changes.
 */
const rows = {
  choice: partRow(table, "choice"),
  choices: partRow(table, "choices"),
  content: partRow(table, "content"),
  gap: partRow(table, "gap"),
  gapChoice: partRow(table, "gapChoice"),
  hidden: partRow(table, "hidden"),
  prompt: partRow(table, "prompt"),
  root: partRow(table, "root"),
} satisfies { readonly [Q in GapMatchPart]: PartRow };

/**
 * One `qti-gap-text` or `qti-gap-img` of a Gap Match: a choice of the pair's source side.
 */
export interface GapMatchChoice {
  /**
   * The choice's content as the body walk read it: the gap text's text and markup, or the gap
   * image's `object`.
   */
  readonly content: readonly BodyNode[];
  /**
   * `fixed`: the choice keeps its document position when the Gap Match shuffles. The ASI schema
   * declares no such attribute on a gap choice, so a document gives false; the redacted form may
   * hold true.
   */
  readonly fixed: boolean;
  readonly identifier: string;
  /**
   * `object-label` of a `qti-gap-img`: the text that names the image, none for a gap text.
   */
  readonly label: Option.Option<string>;
  /**
   * `match-group`: the gaps this choice may fill, none when absent, which means any gap.
   */
  readonly matchGroup: Option.Option<readonly string[]>;
  /**
   * `match-max`: the most gaps this choice may fill; 0 is no limit.
   */
  readonly matchMax: bigint;
  /**
   * `match-min`, 0 when absent: the fewest gaps this choice must fill for a valid response.
   */
  readonly matchMin: bigint;
}

/**
 * A `qti-gap-match-interaction` (Q-6): its Prompt, its choices, its gapped content, and the limits
 * and messages it declares, bound to a `directedPair` response of `single` or `multiple`
 * cardinality: each pair is a choice and the gap it fills.
 */
export interface GapMatchInteraction extends ModuleInteraction<"gap-match"> {
  /**
   * The bound response's cardinality: `multiple`, or `single` for an interaction with one gap.
   */
  readonly cardinality: "multiple" | "single";
  readonly choices: readonly GapMatchChoice[];
  /**
   * The author's `class` value, empty when absent.
   */
  readonly class: string;
  /**
   * The block content around the gaps, as the body walk read it, with each `qti-gap` an element
   * the module owns.
   */
  readonly gapped: readonly BodyNode[];
  /**
   * `max-associations`, 1 when absent (the default the ASI XSD gives it on this interaction): the
   * most pairs a response may hold; 0 is no limit.
   */
  readonly maxAssociations: bigint;
  /**
   * The author's replacements for the messages of the two bounds, `data-max-selections-message` and
   * `data-min-selections-message`.
   */
  readonly messages: {
    readonly max: Option.Option<string>;
    readonly min: Option.Option<string>;
  };
  /**
   * `min-associations`, 0 when absent: the fewest pairs a valid response holds.
   */
  readonly minAssociations: bigint;
  readonly prompt: Option.Option<readonly BodyNode[]>;
  /**
   * `shuffle`: the choices, never the gaps, are presented in an order keyed by the seed, the
   * instance and the response.
   */
  readonly shuffle: boolean;
}

/**
 * A gap of the gapped content as validation and the render read it: its identifier and whether a
 * valid response fills it.
 */
export interface GapMatchGap {
  readonly identifier: string;
  readonly required: boolean;
}

/**
 * One choice as the page may know it: its content, and what the render and the runtime read of its
 * limits.
 */
export interface GapMatchPayloadChoice {
  readonly content: readonly PayloadNode[];
  readonly identifier: string;
  readonly label: Option.Option<string>;
  /**
   * The gaps the choice may fill, none listed when it may fill any.
   */
  readonly matchGroup: readonly string[];
  readonly matchMax: bigint;
}

/**
 * A Gap Match as the page may know it: its Prompt, its choices in presented order, its gapped
 * content, its gaps, the name its hidden inputs post under, and the pairs to restore. It holds no
 * correct response.
 */
export interface GapMatchPayload {
  readonly ariaLabel: Option.Option<string>;
  readonly ariaLabelledby: Option.Option<string>;
  readonly choices: readonly GapMatchPayloadChoice[];
  /**
   * The author's `class` value, empty when absent.
   */
  readonly class: string;
  readonly content: readonly PayloadNode[];
  /**
   * The name its hidden inputs post under: the view's name for the response, else
   * `entryName(instance, response)`.
   */
  readonly formName: string;
  readonly gaps: readonly GapMatchGap[];
  readonly prompt: Option.Option<readonly PayloadNode[]>;
  /**
   * The identifier of the response it binds.
   */
  readonly response: string;
  /**
   * The pairs to show, each as posted, `<choice> <gap>`: the strings posted when the view has
   * messages, else the view's value.
   */
  readonly restore: readonly string[];
}

/**
 * The JSON form of a choice in a redacted body, with no path: its counts as decimal digits and
 * each `Option` an optional key.
 */
interface GapMatchChoiceJson {
  readonly content: readonly unknown[];
  readonly fixed: boolean;
  readonly identifier: string;
  readonly label?: string;
  readonly matchGroup?: readonly string[];
  readonly matchMax: string;
  readonly matchMin: string;
}

/**
 * The JSON form of a Gap Match in a redacted body: its counts as decimal digits, each `Option` an
 * optional key, and no path. Its content is held as the body's own JSON form, which this module
 * cannot name.
 */
export interface GapMatchJson {
  readonly ariaLabel?: string;
  readonly ariaLabelledby?: string;
  readonly cardinality: "multiple" | "single";
  readonly choices: readonly GapMatchChoiceJson[];
  readonly class: string;
  readonly gapped: readonly unknown[];
  readonly kind: "gap-match";
  readonly maxAssociations: string;
  readonly messages: { readonly max?: string; readonly min?: string };
  readonly minAssociations: string;
  readonly prompt?: readonly unknown[];
  readonly response: string;
  readonly shuffle: boolean;
}

/**
 * The attributes of every part of one Gap Match, computed once by {@link connect}: one entry per
 * choice in presented order, per gap in document order, per filled gap (with the text it shows) and
 * per hidden input.
 */
interface GapMatchConnected {
  readonly choice: readonly Attributes[];
  readonly choices: Attributes;
  readonly content: Attributes;
  readonly gap: readonly Attributes[];
  readonly gapChoice: readonly TextProps[];
  readonly hidden: readonly Attributes[];
  readonly prompt: Attributes;
  readonly root: Attributes;
}

/**
 * Read an attribute of an element a module owns, as the body walk kept it.
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
 * Tell whether an `xs:boolean` value as written is true: `true` or `1`, XML white space around it
 * ignored.
 *
 * @param written The value as written.
 * @returns Whether it reads true.
 */
const isTrue = (written: string): boolean => {
  const value = trimXmlSpace(written);

  return value === "true" || value === "1";
};

/**
 * Collect the gaps of the gapped content, in document order, below elements: each `qti-gap` the
 * module owns, with its identifier and whether it is `required`.
 *
 * @param nodes The gapped content.
 * @returns The gaps.
 */
const gapsIn = (nodes: readonly BodyNode[]): readonly GapMatchGap[] =>
  nodes.flatMap((node): readonly GapMatchGap[] => {
    if (node.kind !== "element") {
      return [];
    }

    return node.tag === "qti-gap"
      ? [
          {
            identifier: valueIn(node.attributes, "identifier"),
            required: isTrue(valueIn(node.attributes, "required")),
          },
        ]
      : gapsIn(node.children);
  });

/**
 * Give the choices in the order a render presents them: document order, or with `shuffle` the
 * order `shuffleOrder` draws under the key `<seed>\u001F<instance>\u001F<response>`, where an
 * absent seed is the empty string, each fixed choice at its document position. The gaps never
 * move. The same interaction, seed and instance always give the same order, so `sequence` reports
 * the order `render` presents.
 *
 * @param interaction The Gap Match: its choices, its response and its `shuffle`.
 * @param seed The configuration's `seed`, none when it has none.
 * @param instance The item instance key the interaction is rendered under.
 * @returns The choices, in presented order.
 */
const presented = (
  interaction: Pick<GapMatchInteraction, "choices" | "response" | "shuffle">,
  seed: Option.Option<string>,
  instance: string,
): readonly GapMatchChoice[] =>
  interaction.shuffle
    ? shuffleOrder(
        [Option.getOrElse(seed, () => ""), instance, interaction.response].join(keySeparator),
        interaction.choices.map((choice) => choice.fixed),
      ).flatMap((index) => interaction.choices[index] ?? [])
    : interaction.choices;

/**
 * Split a posted pair into its source and its target, as a `directedPair` is written: two
 * identifiers separated by white space.
 *
 * @param pair The pair as posted.
 * @returns The two sides, none for a text that is not two identifiers.
 */
const sidesOf = (pair: string): Option.Option<readonly [string, string]> => {
  const [source, target, ...rest] = splitTokens(pair);

  return source === undefined || target === undefined || rest.length > 0
    ? Option.none()
    : Option.some([source, target] as const);
};

/**
 * One gap that holds a choice in the restored response.
 */
interface Placed {
  readonly choice: GapMatchPayloadChoice;
  readonly gap: GapMatchGap;
  /**
   * The choice's position, from 1, among the choices as presented.
   */
  readonly position: number;
}

/**
 * Find the gaps the restored pairs fill, in the gaps' document order: a pair counts when its source
 * names a choice and its target a gap, and a gap shows the first pair that fills it.
 *
 * @param interaction The Gap Match's payload.
 * @returns One entry for each filled gap.
 */
const placedIn = (interaction: GapMatchPayload): readonly Placed[] => {
  const sides = interaction.restore.flatMap((pair) => Option.toArray(sidesOf(pair)));

  return interaction.gaps.flatMap((gap): readonly Placed[] => {
    const filling = sides.find(([, target]) => target === gap.identifier);
    const position = interaction.choices.findIndex((choice) => choice.identifier === filling?.[0]);
    const choice = interaction.choices[position];

    return choice === undefined ? [] : [{ choice, gap, position: position + 1 }];
  });
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
 * Give the text a choice shows inside a gap: its content's text, collapsed; for a choice with none,
 * the `object-label` of a gap image; else "Choice n of count", `n` its presented position.
 *
 * @param choice The choice.
 * @param position The choice's position `n`, from 1, among the `count` choices as presented.
 * @param count How many choices there are.
 * @param locale The locale of the renderer's own text.
 * @returns The text.
 */
const shownText = (
  choice: GapMatchPayloadChoice,
  position: number,
  count: number,
  locale: Locale,
): string => {
  const written = collapse(textIn(choice.content));
  const label = collapse(Option.getOrElse(choice.label, () => ""));

  if (written !== "") {
    return written;
  }

  return label === ""
    ? message(locale, "choiceOf", { count: numeral(locale, count), n: numeral(locale, position) })
    : label;
};

/**
 * Name the group when the Prompt does not: the author's `aria-label`, as written unless it is
 * blank, and `aria-labelledby` with each id scoped by the instance; the group is `role="group"`
 * only when something names it.
 *
 * @param interaction The Gap Match's payload.
 * @param instance The item instance key, which scopes the author's ids.
 * @returns The naming attributes, none when the author gave neither.
 */
const authorsName = (interaction: GapMatchPayload, instance: string): Attributes => {
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
 * Compute every attribute of every part of one Gap Match: the connect function.
 *
 * - Root: the marker, the state (`data-mode`, and `data-disabled` when the author disabled every
 *   control), the author's `class`, and `data-entry-name`, the name the runtime writes its hidden
 *   inputs under. It is `role="group"`, named by the Prompt through `aria-labelledby` → the
 *   Prompt's id, and the author's names are not written; with no Prompt, by the author's
 *   `aria-label` and `aria-labelledby`; with neither, the group stays unnamed and carries no role.
 *   `aria-describedby` → the message ids when the response has a message.
 * - Prompt: the marker and its id. Choices: the marker. Content: the marker.
 * - Choice, one for each choice in presented order: its identifier, its `match-max` and, when the
 *   choice names its gaps, its `match-group`.
 * - Gap, one for each gap in document order: its identifier, and `data-required` when a valid
 *   response fills it. GapChoice, one for each filled gap: the identifier of the choice it holds,
 *   and its text ({@link shownText}).
 * - Hidden, one for each pair to restore, only while the candidate may answer: `type="hidden"`, the
 *   name and the pair as posted. None in `review` and `solution`, nor when the author finished the
 *   item: the form posts nothing for it.
 *
 * @param interaction The Gap Match's payload.
 * @param payload The payload, which gives the instance, the mode, `finished` and the messages.
 * @param locale The locale of the renderer's own text.
 * @returns The attributes of every part.
 */
const connect = (
  interaction: GapMatchPayload,
  payload: Payload,
  locale: Locale,
): GapMatchConnected => {
  const { instance } = payload;
  const promptId = scopedId(instance, interaction.response, "prompt");
  const messageIds = payload.messages
    .filter((entry) => entry.response === interaction.response)
    .map((entry) => entry.id);
  const answering = payload.mode === "answering" && !payload.finished;

  return {
    choice: interaction.choices.map((choice) => ({
      "data-identifier": choice.identifier,
      ...when(choice.matchGroup.length > 0, { "data-match-group": choice.matchGroup.join(" ") }),
      "data-match-max": String(choice.matchMax),
      "data-slot": rows.choice.slot,
    })),
    choices: { "data-slot": rows.choices.slot },
    content: { "data-slot": rows.content.slot },
    gap: interaction.gaps.map((gap) => ({
      "data-gap": gap.identifier,
      ...when(gap.required, { "data-required": true }),
      "data-slot": rows.gap.slot,
    })),
    gapChoice: placedIn(interaction).map(({ choice, position }) => ({
      props: { "data-identifier": choice.identifier, "data-slot": rows.gapChoice.slot },
      text: shownText(choice, position, interaction.choices.length, locale),
    })),
    hidden: answering
      ? interaction.restore.map((pair) => ({
          "data-slot": rows.hidden.slot,
          name: interaction.formName,
          type: "hidden",
          value: pair,
        }))
      : [],
    prompt: { "data-slot": rows.prompt.slot, id: promptId },
    root: {
      ...Option.match(interaction.prompt, {
        onNone: () => authorsName(interaction, instance),
        onSome: () => ({ "aria-labelledby": promptId, role: "group" }),
      }),
      ...when(messageIds.length > 0, { "aria-describedby": messageIds.join(" ") }),
      ...when(interaction.class !== "", { class: interaction.class }),
      "data-entry-name": interaction.formName,
      ...when(payload.finished, { "data-disabled": true }),
      "data-mode": payload.mode,
      "data-slot": rows.root.slot,
    },
  };
};

/**
 * Render a Gap Match: a `div` Root holding the Prompt, when there is one, a `ul` of Choices, the
 * Content, and the hidden inputs.
 *
 * Each part goes through `applyPart` with its replacement from `state.parts`, so every swap holds
 * I1 to I4. The Prompt, each choice's content and the Content go through {@link emitNodes}, as
 * the body's do, with the heading shift, ids and URLs of the body; the Content's `qti-gap`
 * elements, which the emitter hands to {@link nestedInteraction}'s owned-element renderer, are
 * each written as a Gap holding its GapChoice when the restored response fills it.
 *
 * @param interaction The Gap Match's payload.
 * @param payload The payload of the whole render, which gives the instance and `finished`.
 * @param state The locale, the heading level and the resolved part overrides.
 * @returns The Gap Match Root, or {@link PartSwapRefused} when a replacement breaks the swap
 *   invariant.
 * @throws {NestedInteractionDefect} When the Prompt or a choice's content holds an interaction,
 *   which QTI's schema admits nowhere there.
 */
const renderGapMatch = (
  interaction: GapMatchPayload,
  payload: Payload,
  state: EmitState,
): Result.Result<Element, PartSwapRefused> => {
  const props = connect(interaction, payload, state.locale);
  const placed = placedIn(interaction);
  const replacement = (part: GapMatchPart) =>
    Option.getOrUndefined(state.parts.replacementFor(owner, part));
  const gapElement: OwnedElements = (written: ElementPayload) => {
    if (written.tag !== "qti-gap") {
      return Option.none();
    }

    const identifier = valueIn(written.attributes, "identifier");
    const index = interaction.gaps.findIndex((gap) => gap.identifier === identifier);
    const filled = placed.findIndex(({ gap }) => gap.identifier === identifier);
    const chosen = props.gapChoice[filled];

    return Option.some(
      Result.gen(function* gapRoot() {
        const inside = yield* chosen === undefined
          ? Result.succeed<readonly Element[]>([])
          : Result.map(
              applyPart(
                rows.gapChoice,
                chosen.props,
                [text(chosen.text)],
                replacement("gapChoice"),
              ),
              (choice) => [choice],
            );

        return [
          yield* applyPart(
            rows.gap,
            props.gap[index] ?? { "data-gap": identifier, "data-slot": rows.gap.slot },
            inside,
            replacement("gap"),
          ),
        ];
      }),
    );
  };

  return Result.gen(function* gapMatchRoot() {
    const choices = yield* pipe(
      interaction.choices.map((choice, index) =>
        Result.flatMap(
          emitNodes(choice.content, payload, state, nestedInteraction(owner)),
          (nodes) =>
            applyPart(rows.choice, props.choice[index] ?? {}, nodes, replacement("choice")),
        ),
      ),
      Result.all,
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
    const content = yield* Result.flatMap(
      emitNodes(interaction.content, payload, state, nestedInteraction(owner, gapElement)),
      (nodes) => applyPart(rows.content, props.content, nodes, replacement("content")),
    );
    const hidden = yield* pipe(
      props.hidden.map((input) => applyPart(rows.hidden, input, [], replacement("hidden"))),
      Result.all,
    );

    return yield* applyPart(
      rows.root,
      props.root,
      [...Option.toArray(prompt), list, content, ...hidden],
      replacement("root"),
    );
  });
};

/**
 * Collect the `qti-gap` elements of an interaction's source, at any depth.
 *
 * @param read The reader kit.
 * @param parent The element to search below.
 * @returns Each `qti-gap`, in document order.
 */
const gapElementsIn = (read: ReaderKit, parent: SourceElement): readonly SourceElement[] =>
  read
    .elementsOf(parent)
    .flatMap((child) => (read.isQti(child, "qti-gap") ? [child] : gapElementsIn(read, child)));

/**
 * Tell whether a child of the interaction is one the Gap Match reads on its own and not as gapped
 * content: its Prompt, a gap text or a gap image.
 *
 * @param read The reader kit.
 * @param child The child.
 * @returns Whether the child is read by name.
 */
const isReadByName = (read: ReaderKit, child: SourceChild): boolean =>
  child.kind === "element" &&
  (read.isQti(child, "qti-prompt") ||
    read.isQti(child, "qti-gap-text") ||
    read.isQti(child, "qti-gap-img"));

/**
 * Read one `qti-gap-text` or `qti-gap-img` into its choice: its identifier, its limits and its
 * content as the body walk reads it. A `template-identifier` the choice carries is recorded as a
 * mark: plate shows no choice by a template value here.
 *
 * @param read The reader kit.
 * @param choice The gap text or gap image.
 * @returns The choice, or a refusal.
 */
const readChoice = (
  read: ReaderKit,
  choice: SourceElement,
): Result.Result<GapMatchChoice, Refusal> =>
  Result.gen(function* readGapChoice() {
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
      label: read.valueOf(choice, "object-label"),
      matchGroup: Option.map(read.valueOf(choice, "match-group"), splitTokens),
      matchMax: Option.getOrElse(matchMax, () => 0n),
      matchMin: Option.getOrElse(matchMin, () => 0n),
    };
  });

/**
 * Tell whether a child of the interaction is XML white space between its elements, which is no
 * gapped content.
 *
 * @param child The child.
 * @returns Whether it is a text of white space only.
 */
const isBlank = (child: SourceChild): boolean =>
  child.kind === "text" && trimXmlSpace(child.text) === "";

/**
 * Read a `qti-gap-match-interaction` as {@link gapMatchModule} renders it, through the kit.
 *
 * The response must be declared (`undeclared-response` otherwise, as the shipped kinds refuse),
 * of base type `directedPair` and cardinality `single` or `multiple`; a declaration outside that
 * is the notice `base-type="…"` or `cardinality="…"`. The Prompt, each choice's content and the
 * gapped content are read by the body walk, the gapped content with `qti-gap` let through as the
 * module's own element. The features it reads and does not render are recorded as marks:
 * `data-choices-container-width`, and `match-group` and `template-identifier` on a gap, and
 * `template-identifier` on a choice.
 *
 * @param source The interaction's source element.
 * @param context The element's path, its notice and the reader kit.
 * @returns The model node, its notice, or a refusal.
 */
const parse = (
  source: SourceElement,
  context: ParseContext,
): Result.Result<GapMatchInteraction | Unsupported, Refusal> =>
  Result.gen(function* readGapMatch() {
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

    if (!Option.contains(declaration.baseType, "directedPair")) {
      return yield* context.notice(`base-type="${writtenOf("base-type")}"`);
    }

    read.markElement(source);
    if (Option.isSome(read.valueOf(source, "data-choices-container-width"))) {
      read.mark(source, "data-choices-container-width");
    }

    for (const gap of gapElementsIn(read, source)) {
      for (const marked of ["match-group", "template-identifier"]) {
        if (Option.isSome(read.valueOf(gap, marked))) {
          read.mark(gap, marked);
        }
      }
    }

    const maxAssociations = yield* read.countAttribute(source, "max-associations");
    const minAssociations = yield* read.countAttribute(source, "min-associations");
    const shuffle = yield* read.xsBoolean(source, "shuffle", false);
    const prompt = yield* read.content(source, "qti-prompt");
    const choices: GapMatchChoice[] = [];

    for (const child of read.elementsOf(source)) {
      if (read.isQti(child, "qti-gap-text") || read.isQti(child, "qti-gap-img")) {
        choices.push(yield* readChoice(read, child));
      }
    }

    const gapped = yield* read.nodes(source, {
      children: source.children.filter((child) => !isReadByName(read, child) && !isBlank(child)),
      own: ["qti-gap"],
    });

    return {
      ariaLabel: read.valueOf(source, "aria-label"),
      ariaLabelledby: read.valueOf(source, "aria-labelledby"),
      cardinality: declared,
      choices,
      class: Option.getOrElse(read.valueOf(source, "class"), () => ""),
      gapped,
      kind: "gap-match",
      maxAssociations: Option.getOrElse(maxAssociations, () => 1n),
      messages: {
        max: read.valueOf(source, "data-max-selections-message"),
        min: read.valueOf(source, "data-min-selections-message"),
      },
      minAssociations: Option.getOrElse(minAssociations, () => 0n),
      path: context.path,
      prompt,
      response,
      shuffle,
    };
  });

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
 * Give the gaps a choice may fill.
 *
 * @param choice The choice, none for an identifier that names no choice.
 * @returns Its `match-group`, empty when it names none, which means any gap.
 */
const groupOf = (choice: GapMatchChoice | undefined): readonly string[] =>
  choice === undefined ? [] : Option.getOrElse(choice.matchGroup, (): readonly string[] => []);

/**
 * Write "gap" or "gaps" for a count, in English: this module's own strings stay in it.
 *
 * @param count The count.
 * @returns The noun that agrees with it.
 */
const gapNoun = (count: bigint): string => (count === 1n ? "gap" : "gaps");

/**
 * Check a Gap Match's response, which the caller decoded, in two tiers.
 *
 * The caller decodes the posted entries with `decode`, under the entry name its form gave the
 * hidden inputs and the binding a `directedPair` response travels under, and passes the value, or
 * the {@link Malformed} `decode` gave; the entry name stays the caller's, while the messages and
 * the author's overrides stay here.
 *
 * - A {@link Malformed} input: `atMost` 1 when a single response was posted more than once, else
 *   `unknownChoice`.
 * - Tier (a), always: a pair that names no choice or no gap (`unknownChoice`); a gap that holds more
 *   than one choice; a choice that fills more gaps than its `match-max` (0 is no limit); a pair
 *   outside the choice's `match-group`; and `max-associations` above 0 capping the pairs
 *   (`atMost`).
 * - Tier (b), only under `validateResponses`: fewer pairs than `min-associations` (`atLeast`), a
 *   `required` gap with no choice, and a choice that fills fewer gaps than its `match-min`.
 *
 * The author's `data-max-selections-message` and `data-min-selections-message` replace the
 * renderer's text for `atMost` and `atLeast`. The messages of the other limits are this module's,
 * in English, and each names the gap or the choice at fault.
 *
 * @param interaction The Gap Match.
 * @param input The decoded value, or why the entries did not decode.
 * @param configuration The configuration, which gives the locale and `validateResponses`.
 * @returns One message per problem, none when the response is accepted.
 */
const validate = (
  interaction: GapMatchInteraction,
  input: Value | Malformed,
  configuration: Configuration,
): readonly ValidationMessage[] => {
  const { locale } = configuration;
  const say = (words: string): ValidationMessage => ({
    response: interaction.response,
    text: words,
  });
  const tooMany = (n: bigint) =>
    say(
      Option.getOrElse(interaction.messages.max, () =>
        message(locale, "atMost", { n: numeral(locale, n) }),
      ),
    );
  const tooFew = (n: bigint) =>
    say(
      Option.getOrElse(interaction.messages.min, () =>
        message(locale, "atLeast", { n: numeral(locale, n) }),
      ),
    );

  if (input instanceof Malformed) {
    return [input.reason === "single-many" ? tooMany(1n) : say(message(locale, "unknownChoice"))];
  }

  const pairs = input.values.flatMap((single) =>
    single.baseType === "directedPair" ? [single.value] : [],
  );
  const choices = new Map(interaction.choices.map((choice) => [choice.identifier, choice]));
  const gaps = gapsIn(interaction.gapped);
  const named = new Set(gaps.map((gap) => gap.identifier));
  const perGap = countsOf(pairs.map(([, target]) => target));
  const perChoice = countsOf(pairs.map(([source]) => source));
  const outside = pairs.filter(([source, target]) => {
    const group = groupOf(choices.get(source));

    return group.length > 0 && !group.includes(target);
  });
  const tierA = [
    ...(pairs.some(([source, target]) => !choices.has(source) || !named.has(target))
      ? [say(message(locale, "unknownChoice"))]
      : []),
    ...[...perGap]
      .filter(([, count]) => count > 1)
      .map(([gap]) => say(`Place only one choice in gap ${gap}.`)),
    ...interaction.choices.flatMap((choice) =>
      choice.matchMax > 0n && BigInt(perChoice.get(choice.identifier) ?? 0) > choice.matchMax
        ? [
            say(
              `Use choice ${choice.identifier} in at most ${numeral(locale, choice.matchMax)} ${gapNoun(choice.matchMax)}.`,
            ),
          ]
        : [],
    ),
    ...[...new Set(outside.map(([source, target]) => `${source} ${target}`))].map((pair) => {
      const [source = "", target = ""] = pair.split(" ");
      const group = groupOf(choices.get(source));

      return say(
        `Choice ${source} cannot go in gap ${target}; use one of ${group.join(", ")} instead.`,
      );
    }),
    ...(interaction.maxAssociations > 0n && BigInt(pairs.length) > interaction.maxAssociations
      ? [tooMany(interaction.maxAssociations)]
      : []),
  ];

  if (!configuration.validateResponses) {
    return tierA;
  }

  return [
    ...tierA,
    ...(BigInt(pairs.length) < interaction.minAssociations
      ? [tooFew(interaction.minAssociations)]
      : []),
    ...gaps
      .filter((gap) => gap.required && !perGap.has(gap.identifier))
      .map((gap) => say(`Place a choice in gap ${gap.identifier}.`)),
    ...interaction.choices.flatMap((choice) =>
      BigInt(perChoice.get(choice.identifier) ?? 0) < choice.matchMin
        ? [
            say(
              `Use choice ${choice.identifier} in at least ${numeral(locale, choice.matchMin)} ${gapNoun(choice.matchMin)}.`,
            ),
          ]
        : [],
    ),
  ];
};

/**
 * The Gap Match module.
 */
export const gapMatchModule: InteractionModule<
  "gap-match",
  GapMatchInteraction,
  GapMatchPayload,
  GapMatchPart,
  GapMatchJson
> = {
  /**
   * The one response Gap Match binds, which `postings` reads: its `directedPair`s are posted as
   * text with no number base.
   */
  bindings: (interaction) => [{ base: Option.none(), response: interaction.response }],
  /**
   * Gap Match's connect function, {@link connect}, as the record of parts the contract names.
   */
  connect: (interaction, payload, locale) => ({ ...connect(interaction, payload, locale) }),
  /**
   * The payload nodes the render writes as content: the Prompt, each choice's content in presented
   * order, then the gapped content.
   */
  content: (interaction) => [
    ...Option.getOrElse(interaction.prompt, () => []),
    ...interaction.choices.flatMap((choice) => choice.content),
    ...interaction.content,
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
  kind: "gap-match",
  /**
   * The NULL of the `directedPair` response Gap Match binds, of the cardinality it declares.
   */
  nullValue: (interaction) => nullOf("directedPair", interaction.cardinality),
  owner,
  parse,
  parts,
  /**
   * The codec of a Gap Match in a redacted body: every field of the model node but its path.
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
          label: OptionalText,
          matchGroup: Schema.OptionFromOptionalKey(Schema.Array(Schema.String)),
          matchMax: Count,
          matchMin: Count,
        }),
      ),
      class: Schema.String,
      gapped: BodyNodes,
      kind: Schema.Literal("gap-match"),
      maxAssociations: Count,
      messages: Schema.Struct({ max: OptionalText, min: OptionalText }),
      minAssociations: Count,
      path: NoPath,
      prompt: Schema.OptionFromOptionalKey(BodyNodes),
      response: Schema.String,
      shuffle: Schema.Boolean,
    }),
  /**
   * Copy the Gap Match into its payload node: its content through the kit, its choices in the order
   * the seed and the instance present them, and the pairs the view shows, as posted when the view
   * holds a refused post.
   */
  redact: (interaction, kit) => {
    const posted = kit.posted(interaction.response);
    const shown = kit.shown(interaction.response).map(format);

    return {
      ariaLabel: interaction.ariaLabel,
      ariaLabelledby: interaction.ariaLabelledby,
      choices: presented(interaction, kit.seed, kit.instance).map((choice) => ({
        content: kit.nodes(choice.content),
        identifier: choice.identifier,
        label: choice.label,
        matchGroup: Option.getOrElse(choice.matchGroup, () => []),
        matchMax: choice.matchMax,
      })),
      class: interaction.class,
      content: kit.nodes(interaction.gapped),
      formName: kit.formName(interaction.response),
      gaps: gapsIn(interaction.gapped),
      prompt: interaction.prompt.pipe(Option.map(kit.nodes)),
      response: interaction.response,
      restore: Option.getOrElse(posted, () => shown),
    };
  },
  /**
   * The regions of the node's own content, in document order: its Prompt, each choice's content,
   * and the gapped content.
   */
  regions: (interaction) => [
    ...Option.match(interaction.prompt, {
      onNone: () => [],
      onSome: (nodes) => [
        { choice: Option.none(), nodes, part: "prompt" as const, written: "nodes" as const },
      ],
    }),
    ...interaction.choices.map((choice) => ({
      choice: Option.some(choice.identifier),
      nodes: choice.content,
      part: "choice" as const,
      written: "nodes" as const,
    })),
    {
      choice: Option.none(),
      nodes: interaction.gapped,
      part: "content" as const,
      written: "nodes" as const,
    },
  ],
  render: renderGapMatch,
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
      gapped: after[interaction.choices.length] ?? interaction.gapped,
      prompt: interaction.prompt.pipe(Option.map((nodes) => first ?? nodes)),
    };
  },
  /**
   * The value Gap Match shows for a stored response: the stored pairs themselves.
   */
  restore: (_interaction, stored) => stored,
  /**
   * The order Gap Match's choices were presented in, as the identifiers separated by spaces; none
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
   * The value Gap Match shows for the correct response: the correct pairs themselves.
   */
  solution: (_interaction, correct) => correct,
  /**
   * False: Gap Match renders no Control the renderer names.
   */
  unnamed: () => false,
  validate,
};

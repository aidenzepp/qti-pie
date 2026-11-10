/**
 * Order (Q-15), the `qti-order-interaction`: the choices in their presented order beside an
 * ordered list of positions, with the author's restored order shown in those positions and one
 * hidden input per ordered choice, so the page reads without script and posts the response the
 * runtime (issue ei-07) builds.
 *
 * Two readings of `docs/spec-readings.md` bind this module.
 *
 * - Reading 18, "An order or graphic-order interaction's `min-choices`, where written, is from 1 to
 *   its number of choices, and a `max-choices` written beside it is from `min-choices` to its
 *   number of choices." `open` refuses a bound that breaks it. With no `min-choices` every choice
 *   must be ordered and `max-choices` is ignored, so the effective bounds are the number of
 *   choices; with one, the bounds are `min-choices` and `max-choices`, which is the number of
 *   choices when it is not written.
 * - Reading 172, "An order interaction may be bound to a response variable of any base type and
 *   cardinality: its class description states no binding." `open` accepts any binding. This module
 *   renders the one whose meaning the information model describes, an `identifier` response of
 *   `ordered` cardinality, and gives the notice for any other, naming the binding, as the
 *   contract's `BoundDeclaration` says a module does for a binding it does not render.
 *
 * {@link orderModule}'s render emits a Root holding the Prompt, a `ul` of the choices not yet in a
 * position, an `ol` of positions, each an `li` that holds the label of the choice placed there,
 * and one hidden input of the response's entry name per ordered choice, in order. The positions
 * are an `ol`, so each position's number is programmatic (WCAG 1.3.1), and the source list comes
 * before them in the document as it does on screen (1.3.2). The Root carries `data-entry-name`,
 * `data-min-choices` and `data-max-choices` for the runtime. In review and solution, and when the
 * author finished the item, the response shows without a hidden input, since it is not posted.
 *
 * @module
 */
import { Array as Arr, Option, Result, pipe } from "effect";
import { attributePath } from "#plate/document/source.ts";
import type { SourceElement } from "#plate/document/source.ts";
import { emitNodes, nestedInteraction } from "#plate/emit/body.ts";
import { when } from "#plate/emit/node.ts";
import type { Attributes, Element, Node } from "#plate/emit/node.ts";
import { authoredIdrefs, scopedId } from "#plate/emit/parts.ts";
import type { PartRow } from "#plate/emit/parts.ts";
import { applyPart } from "#plate/emit/swap.ts";
import type { PartSwapRefused } from "#plate/emit/swap.ts";
import { shuffleOrder } from "#plate/engine/random.ts";
import { Malformed } from "#plate/form/encoding.ts";
import { partRow } from "#plate/interactions/contract.ts";
import type {
  BoundDeclaration,
  Connected,
  InteractionModule,
  ModuleInteraction,
  OwnRegion,
  ParseContext,
  PartSpec,
  ReaderKit,
  RedactKit,
} from "#plate/interactions/contract.ts";
import { message, numeral } from "#plate/messages.ts";
import type { Locale } from "#plate/messages.ts";
import type { BodyNode, SimpleChoice, Unsupported } from "#plate/model/item.ts";
import { format, nullOf, trimXmlSpace } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";
import type { SchemaKit } from "#plate/codec/redacted.ts";
import type { Configuration } from "#plate/configuration.ts";
import type { EmitState, Payload, PayloadNode, ValidationMessage } from "#plate/payload.ts";
import type { Refusal } from "#plate/validate/refusal.ts";

/**
 * The owner of every Order part in the part table.
 */
const owner = "order-interaction";

/**
 * Order's identifier in the QTI 3.0 conformance list, Appendix A.
 */
const feature = "Q-15";

/**
 * The QTI element Order is read from.
 */
const element = "qti-order-interaction";

/**
 * The key a shuffle's three fields are joined by, U+001F INFORMATION SEPARATOR ONE, as a shuffled
 * Choice keys its shuffle: `<seed>`, `<instance>` and `<response>`, so an Order presents its
 * choices as a Choice with the same key would.
 */
const keySeparator = "\u001F";

/**
 * The text the renderer writes in Order, in English: the names of its two lists, the name of a
 * group no author or Prompt names, and the validation messages Order adds to the catalog's. A
 * later pass centralises these in the catalog.
 */
const words = {
  group: "Choices to put in order",
  orderedList: "Your order",
  sourceList: "Choices still to place",
} as const;

/**
 * An Order part, by the key of its row.
 */
type OrderPart = "choice" | "choices" | "hidden" | "ordered" | "prompt" | "root" | "slot";

/**
 * The model node of an Order: the fields every module's node shares, its Prompt, its choices in
 * document order whatever `shuffle` says, `min-choices` and `max-choices` as written, and the
 * authored hints a render reads. Each choice's template visibility is none, since the redacted
 * codec holds none (`read.mark` records one the choice carried as not rendered).
 */
interface OrderInteraction extends ModuleInteraction<"order"> {
  readonly choices: readonly SimpleChoice[];
  readonly class: string;
  /**
   * `max-choices`, none when it is not written; ignored when `min-choices` is not written.
   */
  readonly maxChoices: Option.Option<bigint>;
  /**
   * The author's replacements for the too-many and too-few messages,
   * `data-max-selections-message` and `data-min-selections-message`.
   */
  readonly messages: { readonly max: Option.Option<string>; readonly min: Option.Option<string> };
  /**
   * `min-choices`, none when it is not written, which asks for every choice to be ordered.
   */
  readonly minChoices: Option.Option<bigint>;
  readonly orientation: Option.Option<string>;
  readonly prompt: Option.Option<readonly BodyNode[]>;
  readonly shuffle: boolean;
}

/**
 * One choice of an Order as the page may know it: its identifier and its content.
 */
interface OrderChoicePayload {
  readonly content: readonly PayloadNode[];
  readonly identifier: string;
}

/**
 * The payload node of an Order, what its `redact` copies of the model node and reads of the view:
 * every choice in presented order, the identifiers the response places, in order, and the
 * effective bounds. It holds no correct response.
 */
interface OrderPayload {
  readonly ariaLabel: Option.Option<string>;
  readonly ariaLabelledby: Option.Option<string>;
  /**
   * Every choice in presented order: the model's order, or, for a shuffled Order, the order the
   * seed, the instance and the response key give, each fixed choice at its own place.
   */
  readonly choices: readonly OrderChoicePayload[];
  readonly class: string;
  /**
   * The name its hidden inputs post under: the view's name for the response, else
   * `entryName(instance, response)`.
   */
  readonly formName: string;
  /**
   * The most choices the response may place, from the least to the number of choices.
   */
  readonly maxChoices: number;
  /**
   * The fewest choices the response may place, from 0 to the number of choices.
   */
  readonly minChoices: number;
  readonly orientation: Option.Option<string>;
  /**
   * The identifiers the response places, in order, each naming a choice and each once: the strings
   * posted when the view has messages, else the view's values, with what names no choice, and a
   * repeat, left out.
   */
  readonly placed: readonly string[];
  readonly prompt: Option.Option<readonly PayloadNode[]>;
  readonly response: string;
}

/**
 * The model node of an Order in the redacted body's JSON form: each `Option` an optional key,
 * each count as decimal digits, and no path.
 */
interface OrderJson {
  readonly ariaLabel?: string;
  readonly ariaLabelledby?: string;
  readonly choices: SchemaKit["Choices"]["Encoded"];
  readonly class: string;
  readonly kind: "order";
  readonly maxChoices?: string;
  readonly messages: { readonly max?: string; readonly min?: string };
  readonly minChoices?: string;
  readonly orientation?: string;
  readonly prompt?: SchemaKit["BodyNodes"]["Encoded"];
  readonly response: string;
  readonly shuffle: boolean;
}

/**
 * The rows of Order's parts: the Root, the Prompt, the source list and its choices, the list of
 * positions and each position, and the hidden inputs.
 *
 * Both lists own the list joint rule, so a replacement that is not a list is given the list roles,
 * and one that is must hold `li` items. The positions' list stays a native list (`list`), so each
 * position keeps its number, and its items are `li`. A part's `merged` names every attribute the
 * connect function computes on it beyond the marker and the Root's state, which a replacement
 * cannot change.
 */
const parts = {
  choice: {
    defaults: {},
    element: "li",
    listOwner: false,
    merged: ["data-identifier"],
    tagClass: "choice-item",
  },
  choices: {
    defaults: {},
    element: "ul",
    listOwner: true,
    merged: ["aria-label"],
    tagClass: "choice-list",
  },
  hidden: {
    defaults: {},
    element: "input",
    listOwner: false,
    merged: ["name", "type", "value"],
    tagClass: "native-input",
  },
  ordered: {
    defaults: {},
    element: "ol",
    listOwner: true,
    merged: ["aria-label"],
    tagClass: "list",
  },
  prompt: {
    defaults: {},
    element: "qti-prompt",
    listOwner: false,
    merged: ["id"],
    tagClass: "prompt",
  },
  root: {
    defaults: {},
    element: "qti-order-interaction",
    listOwner: false,
    merged: [
      "aria-label",
      "aria-labelledby",
      "class",
      "data-entry-name",
      "data-max-choices",
      "data-min-choices",
      "data-orientation",
      "role",
    ],
    tagClass: "flow-container",
  },
  slot: {
    defaults: {},
    element: "li",
    listOwner: false,
    merged: ["data-identifier", "data-position"],
    tagClass: "li",
  },
} as const satisfies { readonly [Q in OrderPart]: PartSpec };

/**
 * The row of every Order part, which no placement changes.
 */
const rows = {
  choice: partRow({ owner, parts }, "choice"),
  choices: partRow({ owner, parts }, "choices"),
  hidden: partRow({ owner, parts }, "hidden"),
  ordered: partRow({ owner, parts }, "ordered"),
  prompt: partRow({ owner, parts }, "prompt"),
  root: partRow({ owner, parts }, "root"),
  slot: partRow({ owner, parts }, "slot"),
} as const satisfies { readonly [Q in OrderPart]: PartRow };

/**
 * Give the smaller of two counts.
 *
 * @param left One count.
 * @param right The other.
 * @returns The smaller.
 */
const smaller = (left: bigint, right: bigint): bigint => (left < right ? left : right);

/**
 * Give the larger of two counts.
 *
 * @param left One count.
 * @param right The other.
 * @returns The larger.
 */
const larger = (left: bigint, right: bigint): bigint => (left > right ? left : right);

/**
 * The fewest and the most choices a response to an Order places (reading 18).
 */
interface Bounds {
  readonly least: bigint;
  readonly most: bigint;
}

/**
 * Give the bounds on the choices an Order's response places: without `min-choices` every choice
 * must be ordered and `max-choices` is ignored, so both are the number of choices; with it, the
 * least is `min-choices` and the most `max-choices`, the number of choices when it is not written,
 * neither above the number of choices nor the most below the least.
 *
 * @param interaction The Order.
 * @returns The bounds.
 */
const boundsOf = (interaction: OrderInteraction): Bounds => {
  const total = BigInt(interaction.choices.length);

  if (Option.isNone(interaction.minChoices)) {
    return { least: total, most: total };
  }

  const least = smaller(interaction.minChoices.value, total);

  return {
    least,
    most: larger(
      least,
      Option.match(interaction.maxChoices, {
        onNone: () => total,
        onSome: (written) => smaller(written, total),
      }),
    ),
  };
};

/**
 * Give an Order's choices in the order they are presented: document order, or, for a shuffled
 * Order, the order `shuffleOrder` gives under the key `<seed>\u001F<instance>\u001F<response>`
 * with each fixed choice at its document position, as a shuffled Choice is presented.
 *
 * @param interaction The Order.
 * @param seed The configuration's `seed`, none when it has none.
 * @param instance The item instance key.
 * @returns The choices, in presented order.
 */
const presentedChoices = (
  interaction: OrderInteraction,
  seed: Option.Option<string>,
  instance: string,
): readonly SimpleChoice[] =>
  interaction.shuffle
    ? shuffleOrder(
        [Option.getOrElse(seed, () => ""), instance, interaction.response].join(keySeparator),
        interaction.choices.map((choice) => choice.fixed),
      ).flatMap((index) => interaction.choices[index] ?? [])
    : interaction.choices;

/**
 * Tell whether an author's `aria-label` names the group: it is not blank, as the accessible-name
 * computation skips a blank one.
 *
 * @param label The author's `aria-label`.
 * @returns The label as written when it is not blank, else none.
 * @see https://www.w3.org/TR/accname-1.2/#comp_label
 */
const writtenLabel = (label: Option.Option<string>): Option.Option<string> =>
  label.pipe(Option.filter((written) => trimXmlSpace(written) !== ""));

/**
 * Name the Feature a binding that is not an ordered identifier is outside, as the notice for it
 * keys it: the cardinality first, as `cardinality="…"`, then the base type, as `base-type="…"`,
 * each as the declaration writes it.
 *
 * @param read The kit, which reads the declaration's attributes.
 * @param declaration The declaration the Order binds.
 * @returns The feature of the first part of the binding outside Order's, none for an ordered
 *   identifier.
 */
const misfitOf = (read: ReaderKit, declaration: BoundDeclaration): Option.Option<string> => {
  const written = (name: string) =>
    Option.getOrElse(read.valueOf(declaration.element, name), () => "");

  if (!Option.contains(declaration.cardinality, "ordered")) {
    return Option.some(`cardinality="${written("cardinality")}"`);
  }

  return Option.contains(declaration.baseType, "identifier")
    ? Option.none()
    : Option.some(`base-type="${written("base-type")}"`);
};

/**
 * Read an Order from its element: its binding, `shuffle`, `min-choices` and `max-choices`, its
 * Prompt, its choices and its authored hints, or the notice for a binding that is not an ordered
 * identifier (reading 172).
 *
 * A `template-identifier` on a choice is recorded as not rendered: the redacted copy holds no
 * template value to decide it by, so the choice is always shown.
 *
 * @param source The `qti-order-interaction` element.
 * @param context What the body walk hands a module: the path, the notice and the kit.
 * @param context.notice Replace the element by its notice.
 * @param context.path The element's path.
 * @param context.read The kit the element is read with.
 * @returns The Order, its notice, or a refusal: `undeclared-response` when it binds no declaration
 *   the item makes, or the refusal of an attribute or a child the kit reads.
 */
const parseOrder = (
  source: SourceElement,
  { notice, path, read }: ParseContext,
): Result.Result<OrderInteraction | Unsupported, Refusal> =>
  Result.gen(function* readOrder() {
    const written = yield* read.requiredAttribute(source, "response-identifier");
    const response = read.identifierOf(written.value);
    const { bound } = read;

    if (Option.isNone(bound)) {
      return yield* Result.fail(
        read.refusal("undeclared-response", attributePath(path, written), { response }),
      );
    }

    const misfit = misfitOf(read, bound.value);

    if (Option.isSome(misfit)) {
      return yield* notice(misfit.value);
    }

    read.markElement(source);

    const shuffle = yield* read.xsBoolean(source, "shuffle", false);
    const minChoices = yield* read.countAttribute(source, "min-choices");
    const maxChoices = yield* read.countAttribute(source, "max-choices");
    const prompt = yield* read.content(source, "qti-prompt");
    const choices: SimpleChoice[] = [];

    for (const choice of read.childrenNamed(source, "qti-simple-choice")) {
      read.markElement(choice);

      if (Option.isSome(read.valueOf(choice, "template-identifier"))) {
        read.mark(choice, "template-identifier");
      }

      const identifier = yield* read.identifierAttribute(choice, "identifier");
      const fixed = yield* read.xsBoolean(choice, "fixed", false);

      choices.push({
        content: yield* read.nodes(choice),
        fixed,
        identifier,
        templateVisibility: Option.none(),
      });
    }

    return {
      ariaLabel: read.valueOf(source, "aria-label"),
      ariaLabelledby: read.valueOf(source, "aria-labelledby"),
      choices,
      class: Option.getOrElse(read.valueOf(source, "class"), () => ""),
      kind: "order",
      maxChoices,
      messages: {
        max: read.valueOf(source, "data-max-selections-message"),
        min: read.valueOf(source, "data-min-selections-message"),
      },
      minChoices,
      orientation: read.valueOf(source, "orientation"),
      path,
      prompt,
      response,
      shuffle,
    };
  });

/**
 * Give the regions of an Order's own content, in document order: its Prompt, then each choice's
 * content, written as nodes.
 *
 * @param interaction The Order.
 * @returns Its regions, without the owner.
 */
const regionsOfOrder = (interaction: OrderInteraction): readonly OwnRegion[] => [
  ...Option.match(interaction.prompt, {
    onNone: () => [],
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
 * Rebuild an Order with the content of each region ({@link regionsOfOrder}) replaced.
 *
 * @param interaction The Order.
 * @param contents One entry per region, in the order the regions are given.
 * @returns The Order with its Prompt and choices holding the new content.
 */
const replaceOrderRegions = (
  interaction: OrderInteraction,
  contents: readonly (readonly BodyNode[])[],
): OrderInteraction => {
  const offset = Option.isSome(interaction.prompt) ? 1 : 0;

  return {
    ...interaction,
    choices: interaction.choices.map((choice, index) => ({
      ...choice,
      content: contents[offset + index] ?? choice.content,
    })),
    prompt: interaction.prompt.pipe(Option.map((nodes) => contents[0] ?? nodes)),
  };
};

/**
 * Copy an Order into its payload node: its content through the kit, its choices in presented
 * order, the identifiers the response places, and the effective bounds.
 *
 * The identifiers placed are the strings a refused post sent when the view has messages, else the
 * values the view shows. An identifier that names no choice, and a repeat of one, is left out, so
 * a choice shows once, in one position, and the hidden inputs post what the positions show.
 *
 * @param interaction The Order.
 * @param kit What the payload hands a module's `redact`.
 * @returns The payload node.
 */
const redactOrder = (interaction: OrderInteraction, kit: RedactKit): OrderPayload => {
  const known = new Set(interaction.choices.map((choice) => choice.identifier));
  const wanted = Option.getOrElse(kit.posted(interaction.response), () =>
    kit.shown(interaction.response).map(format),
  );
  const { least, most } = boundsOf(interaction);

  return {
    ariaLabel: interaction.ariaLabel,
    ariaLabelledby: interaction.ariaLabelledby,
    choices: presentedChoices(interaction, kit.seed, kit.instance).map((choice) => ({
      content: kit.nodes(choice.content),
      identifier: choice.identifier,
    })),
    class: interaction.class,
    formName: kit.formName(interaction.response),
    maxChoices: Number(most),
    minChoices: Number(least),
    orientation: interaction.orientation,
    placed: [...new Set(wanted)].filter((identifier) => known.has(identifier)),
    prompt: interaction.prompt.pipe(Option.map(kit.nodes)),
    response: interaction.response,
  };
};

/**
 * Where an Order's choices stand: those not yet in a position, in presented order, and those the
 * response places, in the order of the positions.
 */
interface Layout {
  readonly placed: readonly OrderChoicePayload[];
  readonly source: readonly OrderChoicePayload[];
}

/**
 * Lay an Order's choices out: each identifier the response places gives its choice to a position,
 * and every other choice stays in the source list.
 *
 * @param interaction The Order's payload.
 * @returns The source list's choices and the placed ones.
 */
const layoutOf = (interaction: OrderPayload): Layout => {
  const byIdentifier = new Map(interaction.choices.map((choice) => [choice.identifier, choice]));
  const placed = interaction.placed.flatMap((identifier) => byIdentifier.get(identifier) ?? []);
  const taken = new Set(placed.map((choice) => choice.identifier));

  return { placed, source: interaction.choices.filter((choice) => !taken.has(choice.identifier)) };
};

/**
 * Count the positions an Order shows: as many as the response may place, and as many as it does,
 * so a refused post of more choices than that keeps each in a position of its own.
 *
 * @param interaction The Order's payload.
 * @returns The number of positions.
 */
const positionCount = (interaction: OrderPayload): number =>
  Math.max(interaction.maxChoices, interaction.placed.length);

/**
 * The attributes of every part of one Order, computed once by {@link connectOrder}.
 */
interface Props extends Connected {
  readonly choices: Attributes;
  readonly hidden: readonly Attributes[];
  readonly ordered: Attributes;
  readonly prompt: Attributes;
  readonly root: Attributes;
  readonly slots: readonly Attributes[];
  readonly source: readonly Attributes[];
}

/**
 * Compute every attribute of every part of one Order: the connect function.
 *
 * - Root: the marker, the state (`data-mode`, and `data-disabled` when the author disabled every
 *   control), the author's `class`, `data-orientation`, `role="group"`, the entry name and the
 *   effective bounds the runtime reads, and the group's name: with a Prompt, `aria-labelledby` →
 *   the Prompt's id and no authored name; with none, the author's `aria-label` unless it is blank
 *   and its `aria-labelledby`, each id scoped by the instance; with neither, the renderer's own.
 * - Prompt: the marker and its id. Source list and ordered list: the marker and a name, so a reader
 *   can tell them apart. Each source choice: the marker and its identifier. Each position: the
 *   marker, its number from 1 and, when a choice is placed there, its identifier.
 * - Hidden: one `input` of type hidden per placed choice, in order, named by `formName`, written only
 *   when the response can be posted: the view is answering and the author did not disable the
 *   controls.
 *
 * @param interaction The Order's payload.
 * @param payload The payload of the whole render, which gives the instance, the mode and
 *   `finished`.
 * @returns The attributes of every part.
 */
const connectOrder = (interaction: OrderPayload, payload: Payload): Props => {
  const { placed, source } = layoutOf(interaction);
  const promptId = scopedId(payload.instance, interaction.response, "prompt");
  const hasPrompt = Option.isSome(interaction.prompt);
  const label = writtenLabel(interaction.ariaLabel);
  const labelledby = interaction.ariaLabelledby.pipe(
    Option.flatMap((ids) => authoredIdrefs(payload.instance, ids)),
  );
  const named = hasPrompt || Option.isSome(label) || Option.isSome(labelledby);
  const posts = payload.mode === "answering" && !payload.finished;

  return {
    choices: { "aria-label": words.sourceList, "data-slot": rows.choices.slot },
    hidden: posts
      ? placed.map((choice) => ({
          "data-slot": rows.hidden.slot,
          name: interaction.formName,
          type: "hidden",
          value: choice.identifier,
        }))
      : [],
    ordered: { "aria-label": words.orderedList, "data-slot": rows.ordered.slot },
    prompt: { "data-slot": rows.prompt.slot, id: promptId },
    root: {
      ...(hasPrompt
        ? { "aria-labelledby": promptId }
        : {
            ...Option.match(label, {
              onNone: () => (named ? {} : { "aria-label": words.group }),
              onSome: (written) => ({ "aria-label": written }),
            }),
            ...Option.match(labelledby, {
              onNone: () => ({}),
              onSome: (ids) => ({ "aria-labelledby": ids }),
            }),
          }),
      ...when(interaction.class !== "", { class: interaction.class }),
      ...when(payload.finished, { "data-disabled": true }),
      "data-entry-name": interaction.formName,
      "data-max-choices": String(interaction.maxChoices),
      "data-min-choices": String(interaction.minChoices),
      "data-mode": payload.mode,
      ...Option.match(interaction.orientation, {
        onNone: () => ({}),
        onSome: (orientation) => ({ "data-orientation": orientation }),
      }),
      "data-slot": rows.root.slot,
      role: "group",
    },
    slots: Array.from({ length: positionCount(interaction) }, (_, index) => ({
      ...Option.match(Arr.get(placed, index), {
        onNone: () => ({}),
        onSome: (choice) => ({ "data-identifier": choice.identifier }),
      }),
      "data-position": String(index + 1),
      "data-slot": rows.slot.slot,
    })),
    source: source.map((choice) => ({
      "data-identifier": choice.identifier,
      "data-slot": rows.choice.slot,
    })),
  };
};

/**
 * Render an Order: a Root holding the Prompt, when there is one, the source list of the choices
 * not yet in a position, the ordered list of positions, and the hidden inputs.
 *
 * Each choice's content goes through {@link emitNodes} once, in the position that holds the choice
 * or in the source list, so no authored id appears twice. Each part goes through `applyPart` with
 * its replacement from `state.parts`, so every swap holds I1 to I4.
 *
 * @param interaction The Order's payload.
 * @param payload The payload of the whole render.
 * @param state The locale, the heading level and the resolved part overrides.
 * @returns The Order's Root, or {@link PartSwapRefused} when a replacement breaks the swap
 *   invariant.
 * @throws {NestedInteractionDefect} When the Prompt or a choice's content holds an interaction,
 *   which QTI admits nowhere there.
 */
const renderOrder = (
  interaction: OrderPayload,
  payload: Payload,
  state: EmitState,
): Result.Result<Element, PartSwapRefused> => {
  const props = connectOrder(interaction, payload);
  const { placed, source } = layoutOf(interaction);
  const replacement = (part: OrderPart) =>
    Option.getOrUndefined(state.parts.replacementFor(owner, part));
  const emitContent = (
    nodes: readonly PayloadNode[],
  ): Result.Result<readonly Node[], PartSwapRefused> =>
    emitNodes(nodes, payload, state, nestedInteraction(owner));
  const place = (
    row: PartRow,
    part: OrderPart,
    attributes: Attributes,
    choice: OrderChoicePayload | undefined,
  ) =>
    Result.flatMap(emitContent(choice?.content ?? []), (nodes) =>
      applyPart(row, attributes, nodes, replacement(part)),
    );

  return Result.gen(function* orderRoot() {
    const prompt = yield* Result.transposeOption(
      interaction.prompt.pipe(
        Option.map((content) =>
          Result.flatMap(emitContent(content), (nodes) =>
            applyPart(rows.prompt, props.prompt, nodes, replacement("prompt")),
          ),
        ),
      ),
    );
    const choices = yield* pipe(
      Arr.zip(source, props.source).map(([choice, attributes]) =>
        place(rows.choice, "choice", attributes, choice),
      ),
      Result.all,
    );
    const positions = yield* pipe(
      props.slots.map((attributes, index) =>
        place(rows.slot, "slot", attributes, Arr.get(placed, index).pipe(Option.getOrUndefined)),
      ),
      Result.all,
    );
    const sourceList = yield* applyPart(
      rows.choices,
      props.choices,
      choices,
      replacement("choices"),
    );
    const orderedList = yield* applyPart(
      rows.ordered,
      props.ordered,
      positions,
      replacement("ordered"),
    );
    const inputs = yield* pipe(
      props.hidden.map((attributes) =>
        applyPart(rows.hidden, attributes, [], replacement("hidden")),
      ),
      Result.all,
    );

    return yield* applyPart(
      rows.root,
      props.root,
      [...Option.toArray(prompt), sourceList, orderedList, ...inputs],
      replacement("root"),
    );
  });
};

/**
 * Give the message for a choice ordered more than once.
 *
 * @param identifier The choice's identifier.
 * @returns The message.
 */
const repeatedMessage = (identifier: string): string =>
  `Choice ${identifier} is in the order more than once. Put each choice in one position only.`;

/**
 * Give the message for fewer choices ordered than the response needs.
 *
 * @param needed The fewest choices.
 * @param every Whether the whole of the choices must be ordered.
 * @param locale The locale of the renderer's own text.
 * @returns The message.
 */
const tooFewMessage = (needed: bigint, every: boolean, locale: Locale): string => {
  const count = numeral(locale, needed);
  const noun = needed === 1n ? "choice" : "choices";

  return every ? `Put all ${count} ${noun} in order.` : `Put at least ${count} ${noun} in order.`;
};

/**
 * Give the message for more choices ordered than the response may place.
 *
 * @param allowed The most choices.
 * @param locale The locale of the renderer's own text.
 * @returns The message.
 */
const tooManyMessage = (allowed: bigint, locale: Locale): string =>
  `Put at most ${numeral(locale, allowed)} ${allowed === 1n ? "choice" : "choices"} in order.`;

/**
 * Check an Order's response, which the caller decoded, in two tiers.
 *
 * The caller decodes the posted entries with `decode`, under the entry name its form gave the
 * hidden inputs and the Order's binding (identifiers of `ordered` cardinality), and passes the
 * value, or the {@link Malformed} `decode` gave.
 *
 * - A {@link Malformed} input: `unknownChoice`.
 * - Tier (a), always: an identifier that names no choice gives `unknownChoice`, a choice more than
 *   once gives one message naming it, and more distinct choices than the effective maximum give the
 *   too-many message (reading 18: the number of choices without `min-choices`, else
 *   `max-choices`).
 * - Tier (b), only under `validateResponses`: fewer distinct choices than the effective minimum,
 *   which is every choice without `min-choices`, give the too-few message.
 *
 * The author's `data-max-selections-message` and `data-min-selections-message` replace the
 * renderer's text for the too-many and the too-few message.
 *
 * @param interaction The Order.
 * @param input The decoded value, or why the entries did not decode.
 * @param configuration The configuration, which gives the locale and `validateResponses`.
 * @returns One message per problem, none when the response is accepted.
 */
const validateOrder = (
  interaction: OrderInteraction,
  input: Value | Malformed,
  configuration: Configuration,
): readonly ValidationMessage[] => {
  const { locale } = configuration;
  const say = (text: string): ValidationMessage => ({ response: interaction.response, text });

  if (input instanceof Malformed) {
    return [say(message(locale, "unknownChoice"))];
  }

  const known = new Set(interaction.choices.map((choice) => choice.identifier));
  const chosen = input.values.map(format);
  const repeated = [
    ...new Set(chosen.filter((identifier, index) => chosen.indexOf(identifier) < index)),
  ];
  const ordered = BigInt(new Set(chosen.filter((identifier) => known.has(identifier))).size);
  const { least, most } = boundsOf(interaction);

  return [
    ...(chosen.some((identifier) => !known.has(identifier))
      ? [say(message(locale, "unknownChoice"))]
      : []),
    ...repeated.map((identifier) => say(repeatedMessage(identifier))),
    ...(ordered > most
      ? [say(Option.getOrElse(interaction.messages.max, () => tooManyMessage(most, locale)))]
      : []),
    ...(configuration.validateResponses && ordered < least
      ? [
          say(
            Option.getOrElse(interaction.messages.min, () =>
              tooFewMessage(least, Option.isNone(interaction.minChoices), locale),
            ),
          ),
        ]
      : []),
  ];
};

/**
 * The Order module (Q-15, kind `order`): it reads a `qti-order-interaction` bound to an
 * `identifier` response of `ordered` cardinality, renders it, restores and solves it, binds and
 * validates its response, and gives the notice for any other binding (reading 172). Its runtime is
 * issue ei-07.
 */
export const orderModule: InteractionModule<
  "order",
  OrderInteraction,
  OrderPayload,
  OrderPart,
  OrderJson
> = {
  /**
   * The one response Order binds: an `identifier` response of `ordered` cardinality, which posts
   * identifiers, so none of it has a number base.
   */
  bindings: (interaction) => [{ base: Option.none(), response: interaction.response }],
  /**
   * Order's connect function: the attributes of every part ({@link connectOrder}).
   */
  connect: (interaction, payload) => connectOrder(interaction, payload),
  /**
   * The nodes Order's render writes as content, in the order it writes them: the Prompt, then the
   * choices still in the source list, then the choices in the positions.
   */
  content: (interaction) => {
    const { placed, source } = layoutOf(interaction);

    return [
      ...Option.getOrElse(interaction.prompt, () => []),
      ...source.flatMap((choice) => choice.content),
      ...placed.flatMap((choice) => choice.content),
    ];
  },
  /**
   * No Control: the SSR writes hidden inputs only, and the runtime gives the input, so the
   * renderer names none.
   */
  controls: () => 0,
  element,
  feature,
  /**
   * True: the module renders an `identifier` response of `ordered` cardinality.
   */
  implemented: true,
  kind: "order",
  /**
   * The NULL of Order's binding: an ordered identifier of no value.
   */
  nullValue: () => nullOf("identifier", "ordered"),
  owner,
  /**
   * Read the `qti-order-interaction` element into its model node, or its notice for a binding
   * other than an ordered identifier ({@link parseOrder}).
   */
  parse: (source, context) => parseOrder(source, context),
  parts,
  /**
   * The codec of Order's model node in a redacted body, built from the codec's field schemas:
   * `min-choices` and `max-choices` as optional decimal digits, the choices with no template
   * visibility, and no path.
   */
  payloadSchema: ({ BodyNodes, ChoiceCount, Choices, NoPath, OptionalText, Schema }) =>
    Schema.Struct({
      ariaLabel: OptionalText,
      ariaLabelledby: OptionalText,
      choices: Choices,
      class: Schema.String,
      kind: Schema.Literal("order"),
      maxChoices: Schema.OptionFromOptionalKey(ChoiceCount),
      messages: Schema.Struct({ max: OptionalText, min: OptionalText }),
      minChoices: Schema.OptionFromOptionalKey(ChoiceCount),
      orientation: OptionalText,
      path: NoPath,
      prompt: Schema.OptionFromOptionalKey(BodyNodes),
      response: Schema.String,
      shuffle: Schema.Boolean,
    }),
  /**
   * Order's payload copy ({@link redactOrder}).
   */
  redact: (interaction, kit) => redactOrder(interaction, kit),
  /**
   * The regions of Order's own content: its Prompt and each choice's content.
   */
  regions: (interaction) => regionsOfOrder(interaction),
  /**
   * Order's render function ({@link renderOrder}).
   */
  render: (interaction, payload, state) => renderOrder(interaction, payload, state),
  /**
   * The Order with its Prompt and choices holding the replaced content.
   */
  replaceRegions: (interaction, contents) => replaceOrderRegions(interaction, contents),
  /**
   * The value Order shows for a stored response: the stored value itself, as the shipped kinds
   * show theirs. `redact` leaves out of it what names no choice.
   */
  restore: (_interaction, stored) => stored,
  /**
   * The order a shuffled Order presented its choices in, space-separated, none for one with no
   * shuffle.
   */
  sequence: (interaction, seed, instance) =>
    interaction.shuffle
      ? Option.some(
          presentedChoices(interaction, seed, instance)
            .map((choice) => choice.identifier)
            .join(" "),
        )
      : Option.none(),
  /**
   * The value Order shows for the correct response: the correct value itself.
   */
  solution: (_interaction, correct) => correct,
  /**
   * False: Order has no Control the renderer names, since it renders none.
   */
  unnamed: () => false,
  /**
   * Order's response validation ({@link validateOrder}).
   */
  validate: (interaction, input, configuration) => validateOrder(interaction, input, configuration),
};

/**
 * Media (Q-14, the `media` kind): `qti-media-interaction` read into its model node, copied into its
 * payload node, rendered without script, and checked.
 *
 * Without script the interaction is the author's own `audio` or `video`, native, with its `source`
 * and `track` children (captions, descriptions and subtitles stay the author's), under the Prompt.
 * The browser's controls, when the author asked for them, are the whole of the candidate's way to
 * play, pause and seek (WCAG 2.1.1, 2.2.2), and no count is posted: a page with no runtime plays
 * the media and gives no response (decision D3). The runtime, `media.dom.ts`, counts the plays into
 * the response's one hidden input under the entry name the Root carries as `data-entry-name`, and
 * reads the limit from `data-max-plays`; `data-min-plays` stands on the Root for the host, since
 * the least count is the server's check under `validateResponses`.
 *
 * The facts this module keeps to, from the information model and the schema:
 *
 * - The interaction binds a response of base type `integer` and cardinality `single`, the number of
 *   times the media was experienced; any other binding is the notice naming the one it breaks, as
 *   the shipped kinds give one.
 * - `autostart` (required) is the native `autoplay` of the media element, and `loop` the native
 *   `loop`; the interaction's two attributes decide, so a written `autoplay` or `loop` on the
 *   element itself never starts or repeats what the interaction did not ask for. The runtime never
 *   starts playback.
 * - The XSD spells the element's `controls`, `muted`, `autoplay` and `loop` as `true`, `false` or
 *   their own name, to bridge HTML's boolean attributes into XML, and a browser reads any value of
 *   a boolean attribute as set. So the render writes `controls` and `muted` as set only when the
 *   author did not write `false`: a `video` or `audio` written `controls="false"` has no controls,
 *   the operator's settled rule for media. The author's choice stands: when `autostart="true"` and
 *   the controls are gone, nothing pauses the media (WCAG 1.4.2, 2.2.2), which an item's verdict
 *   does not mark and a reviewer should.
 * - `min-plays` and `max-plays` default to 0; `max-plays="0"` is no limit (reading 76), and the
 *   Schematron's least-at-most rule is `open`'s. A count over a limit that is not 0 is refused in
 *   tier (a), since no play past it is possible; a count under `min-plays` is refused in tier (b),
 *   under `validateResponses` alone, and NULL, which a page with no runtime posts, counts as 0.
 * - `coords`, the deprecated rectangle of an `object`'s place, is read and ignored with a mark, and
 *   so is the deprecated `object` element, written as the author wrote it: a browser cannot report
 *   plays of one, so its count is never posted.
 *
 * Strings the renderer writes here live in this module, in English ({@link words}).
 *
 * @module
 * @see https://www.w3.org/WAI/WCAG22/Understanding/audio-control.html
 */
import { Option, Result } from "effect";
import type { SchemaKit } from "#plate/codec/redacted.ts";
import type { Configuration } from "#plate/configuration.ts";
import { attributePath } from "#plate/document/source.ts";
import type { SourceElement } from "#plate/document/source.ts";
import { emitNodes, nestedInteraction } from "#plate/emit/body.ts";
import { h, when } from "#plate/emit/node.ts";
import type { Attributes, Element, Node } from "#plate/emit/node.ts";
import { authoredIdrefs, scopedId } from "#plate/emit/parts.ts";
import type { PartRow } from "#plate/emit/parts.ts";
import { applyPart } from "#plate/emit/swap.ts";
import type { PartSwapRefused } from "#plate/emit/swap.ts";
import { Malformed } from "#plate/form/encoding.ts";
import { partRow } from "#plate/interactions/contract.ts";
import type {
  Connected,
  InteractionModule,
  ModuleInteraction,
  OwnRegion,
  ParseContext,
  PartSpec,
} from "#plate/interactions/contract.ts";
import { malformedMessage } from "#plate/interactions/pattern.ts";
import { numeral } from "#plate/messages.ts";
import type { Locale } from "#plate/messages.ts";
import type { BodyNode, Unsupported } from "#plate/model/item.ts";
import { format, nullOf, trimXmlSpace } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";
import type { EmitState, Payload, PayloadNode, ValidationMessage } from "#plate/payload.ts";
import type { Refusal } from "#plate/validate/refusal.ts";

/**
 * The owner of every Media part in the part table.
 */
const owner = "media-interaction";

/**
 * Media's identifier in the QTI 3.0 conformance list, Appendix A.
 */
const feature = "Q-14";

/**
 * The QTI element Media is read from, which its notice names.
 */
const element = "qti-media-interaction";

/**
 * A Media part, by the key its row and its host override go by.
 */
type MediaPart = "hidden" | "media" | "prompt" | "root";

/**
 * The elements the interaction's one media child may be, which the XSD lists.
 */
const mediaElements: readonly string[] = ["audio", "object", "video"];

/**
 * The elements a browser plays, and so counts the plays of: the two the render writes the native
 * booleans of.
 */
const playable: ReadonlySet<string> = new Set(["audio", "video"]);

/**
 * The boolean attributes the render writes of a playable element itself: set from the interaction
 * (`autoplay`, `loop`) or from the author's own value (`controls`, `muted`), and never copied as
 * written.
 */
const booleanAttributes: ReadonlySet<string> = new Set(["autoplay", "controls", "loop", "muted"]);

/**
 * The rows of the Media parts, each part once: the Root and the Prompt are flow containers (the
 * Root a group the Prompt names), the media part a flow container that wraps the author's element,
 * and the hidden input a native input whose `type` stays `hidden`. `merged` lists every attribute
 * the connect function computes beyond the `data-slot` marker and the Root state (`data-mode`,
 * `data-disabled`), which a replacement may not override.
 */
const parts = {
  hidden: {
    defaults: {},
    element: "input",
    listOwner: false,
    merged: ["name", "type", "value"],
    tagClass: "native-input",
  },
  media: {
    defaults: {},
    element: "div",
    listOwner: false,
    merged: [],
    tagClass: "flow-container",
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
      "data-max-plays",
      "data-min-plays",
      "role",
    ],
    tagClass: "flow-container",
  },
} as const satisfies { readonly [Q in MediaPart]: PartSpec };

/**
 * The module's owner and parts, which {@link partRow} derives each part's row from.
 */
const table = { owner, parts } as const;

/**
 * The row of every Media part, which no placement changes.
 */
const rows = {
  hidden: partRow(table, "hidden"),
  media: partRow(table, "media"),
  prompt: partRow(table, "prompt"),
  root: partRow(table, "root"),
} satisfies { readonly [Q in MediaPart]: PartRow };

/**
 * A `qti-media-interaction` (Q-14, the `media` kind): its Prompt, its one media element, and the
 * plays it asks for, bound to a single `integer` response, the count of plays.
 */
export interface MediaInteraction extends ModuleInteraction<"media"> {
  /**
   * `autostart`: the media starts as the attempt starts, which the render writes as the media
   * element's native `autoplay`.
   */
  readonly autostart: boolean;
  /**
   * The author's `class` value, empty when absent.
   */
  readonly class: string;
  /**
   * `loop`, false when absent: the media plays continuously once started, still within
   * `max-plays`.
   */
  readonly loop: boolean;
  /**
   * `max-plays`, 0 when absent: the most plays a response may count; 0 is no limit.
   */
  readonly maxPlays: bigint;
  /**
   * The media element, `audio`, `video` or the deprecated `object`, as the body walk read it, with
   * its `source` and `track` children; none when the interaction held none.
   */
  readonly media: readonly BodyNode[];
  /**
   * `min-plays`, 0 when absent: the fewest plays a valid response counts.
   */
  readonly minPlays: bigint;
  readonly prompt: Option.Option<readonly BodyNode[]>;
}

/**
 * The JSON form of {@link MediaInteraction} (Q-14, the `media` kind) in a redacted body: its counts
 * as decimal digits, each `Option` an optional key, and no path. Its content is held as the body's
 * own JSON form.
 */
export interface MediaJson {
  readonly ariaLabel?: string;
  readonly ariaLabelledby?: string;
  readonly autostart: boolean;
  readonly class: string;
  readonly kind: "media";
  readonly loop: boolean;
  readonly maxPlays: string;
  readonly media: SchemaKit["BodyNodes"]["Encoded"];
  readonly minPlays: string;
  readonly path?: unknown;
  readonly prompt?: SchemaKit["BodyNodes"]["Encoded"];
  readonly response: string;
}

/**
 * A Media (Q-14, the `media` kind) as the page may know it: its Prompt and media element copied
 * through the payload, the limits the runtime reads, the name its hidden input posts under, and the
 * count to restore. It holds no correct response.
 */
export interface MediaPayload {
  readonly ariaLabel: Option.Option<string>;
  readonly ariaLabelledby: Option.Option<string>;
  readonly autostart: boolean;
  /**
   * The author's `class` value, empty when absent.
   */
  readonly class: string;
  /**
   * The name its hidden input posts under: the view's name for the response, else
   * `entryName(instance, response)`.
   */
  readonly formName: string;
  readonly loop: boolean;
  /**
   * `max-plays`, written or defaulted (0 is no limit), which the runtime reads from the Root.
   */
  readonly maxPlays: bigint;
  readonly media: readonly PayloadNode[];
  /**
   * `min-plays`, written or defaulted, which stands on the Root.
   */
  readonly minPlays: bigint;
  readonly prompt: Option.Option<readonly PayloadNode[]>;
  /**
   * The identifier of the response it binds.
   */
  readonly response: string;
  /**
   * The count to write as the hidden input, as decimal digits: the count posted when the view
   * holds a refused post, else the value it shows; none when that is no count.
   */
  readonly restore: Option.Option<string>;
}

/**
 * The attributes of every part of one Media, computed once by {@link connect}: the hidden input is
 * one entry or none.
 */
interface MediaConnected extends Connected {
  readonly hidden: readonly Attributes[];
  readonly media: Attributes;
  readonly prompt: Attributes;
  readonly root: Attributes;
}

/**
 * The strings the renderer writes for Media, by locale. A `{n}` is the count a message names.
 */
const words = {
  en: {
    atLeast: "Play the media at least {n} times.",
    atLeastOnce: "Play the media at least once.",
    atMost: "The media can be played at most {n} times.",
    atMostOnce: "The media can be played only once.",
  },
} as const satisfies Readonly<Record<Locale, Readonly<Record<string, string>>>>;

/**
 * Write a count limit's message: the singular string at a count of 1, else the plural with the
 * count.
 *
 * @param locale The locale of the renderer's own text.
 * @param count The limit.
 * @param one The string for a limit of 1.
 * @param many The string for any other limit, which holds `{n}`.
 * @returns The message.
 */
const counted = (locale: Locale, count: bigint, one: string, many: string): string =>
  count === 1n ? one : many.replace("{n}", numeral(locale, count));

/**
 * Pick the count the hidden input starts at: the first of the candidates that is a count, as
 * decimal digits, written back without leading zeros.
 *
 * @param candidates The strings the view gives, in order: the strings a refused post sent, or the
 *   values it shows.
 * @returns The count, none when no candidate is one.
 */
const countOf = (candidates: readonly string[]): Option.Option<string> =>
  Option.fromUndefinedOr(
    candidates.map(trimXmlSpace).find((candidate) => /^[0-9]+$/u.test(candidate)),
  ).pipe(Option.map((digits) => String(BigInt(digits))));

/**
 * Name the group when the Prompt does not: the author's `aria-label`, as written unless it is
 * blank, and `aria-labelledby` with each id scoped by the instance; the group is `role="group"`
 * only when something names it.
 *
 * @param interaction The Media's payload.
 * @param instance The item instance key, which scopes the author's ids.
 * @returns The naming attributes, none when the author gave neither.
 */
const authorsName = (interaction: MediaPayload, instance: string): Attributes => {
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
 * Compute every attribute of every part of one Media: the connect function.
 *
 * - Root: the marker, the state (`data-mode`, and `data-disabled` when the author disabled every
 *   control), the author's `class`, `data-entry-name`, the name the runtime writes its hidden input
 *   under, and `data-min-plays` and `data-max-plays`, written or defaulted. It is `role="group"`,
 *   named by the Prompt through `aria-labelledby` → the Prompt's id; with no Prompt, by the
 *   author's `aria-label` and `aria-labelledby`; with neither, the group stays unnamed and carries
 *   no role. `aria-describedby` → the message ids when the response has a message.
 * - Prompt: the marker and its id. Media: the marker.
 * - Hidden, only for a count to restore and only while the candidate may answer: `type="hidden"`, the
 *   name and the count. None in `review` and `solution`, nor when the author finished the item: the
 *   form posts nothing for it.
 *
 * @param interaction The Media's payload.
 * @param payload The payload, which gives the instance, the mode, `finished` and the messages.
 * @returns The attributes of every part.
 */
const connect = (interaction: MediaPayload, payload: Payload): MediaConnected => {
  const { instance } = payload;
  const promptId = scopedId(instance, interaction.response, "prompt");
  const messageIds = payload.messages
    .filter((entry) => entry.response === interaction.response)
    .map((entry) => entry.id);
  const answering = payload.mode === "answering" && !payload.finished;

  return {
    hidden: answering
      ? Option.match(interaction.restore, {
          onNone: (): readonly Attributes[] => [],
          onSome: (count) => [
            {
              "data-slot": rows.hidden.slot,
              name: interaction.formName,
              type: "hidden",
              value: count,
            },
          ],
        })
      : [],
    media: { "data-slot": rows.media.slot },
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
      "data-max-plays": String(interaction.maxPlays),
      "data-min-plays": String(interaction.minPlays),
      "data-mode": payload.mode,
      "data-slot": rows.root.slot,
    },
  };
};

/**
 * Tell whether the author set a boolean attribute of the media element: written, and not `false`,
 * the one value of the XSD's enumeration that means unset.
 *
 * @param value The attribute as emitted, none when the author did not write it.
 * @returns Whether it is set.
 */
const isSet = (value: string | true | undefined): boolean =>
  value !== undefined && value !== "false";

/**
 * Write a playable media element natively: `autoplay` and `loop` as the interaction asked,
 * `controls` and `muted` as the author wrote them (a written `false` is no attribute, since a
 * browser reads every value of a boolean attribute as set), and every other attribute and child as
 * emitted. Any other node stands as it is.
 *
 * @param node A node the author's content emitted.
 * @param interaction The Media's payload, which gives `autostart` and `loop`.
 * @returns The node, rewritten when it is an `audio` or a `video`.
 */
const natively = (node: Node, interaction: MediaPayload): Node => {
  if (node.kind !== "element" || !playable.has(node.tag)) {
    return node;
  }

  return h(
    node.tag,
    {
      ...Object.fromEntries(
        Object.entries(node.attrs).filter(([attribute]) => !booleanAttributes.has(attribute)),
      ),
      ...when(isSet(node.attrs["controls"]), { controls: true }),
      ...when(interaction.autostart, { autoplay: true }),
      ...when(interaction.loop, { loop: true }),
      ...when(isSet(node.attrs["muted"]), { muted: true }),
    },
    node.children,
  );
};

/**
 * Render a Media: a `div` Root holding the Prompt, when there is one, the media part wrapping the
 * author's element, and the hidden input of a restored count.
 *
 * Each part goes through `applyPart` with its replacement from `state.parts`, so every swap holds
 * I1 to I4. The Prompt and the author's element go through {@link emitNodes}, as the body's do,
 * with the heading shift, ids and URLs of the body; the element then takes its native booleans
 * ({@link natively}).
 *
 * @param interaction The Media's payload.
 * @param payload The payload of the whole render, which gives the instance, the mode and
 *   `finished`.
 * @param state The locale, the heading level and the resolved part overrides.
 * @returns The Media Root, or {@link PartSwapRefused} when a replacement breaks the swap invariant.
 * @throws {NestedInteractionDefect} When the Prompt or the media holds an interaction, which QTI's
 *   schema admits nowhere there.
 */
const renderMedia = (
  interaction: MediaPayload,
  payload: Payload,
  state: EmitState,
): Result.Result<Element, PartSwapRefused> =>
  Result.gen(function* mediaRoot() {
    const props = connect(interaction, payload);
    const replacement = (part: MediaPart) =>
      Option.getOrUndefined(state.parts.replacementFor(owner, part));
    const prompt = yield* Result.transposeOption(
      interaction.prompt.pipe(
        Option.map((content) =>
          Result.flatMap(emitNodes(content, payload, state, nestedInteraction(owner)), (nodes) =>
            applyPart(rows.prompt, props.prompt, nodes, replacement("prompt")),
          ),
        ),
      ),
    );
    const emitted = yield* emitNodes(interaction.media, payload, state, nestedInteraction(owner));
    const media = yield* applyPart(
      rows.media,
      props.media,
      emitted.map((node) => natively(node, interaction)),
      replacement("media"),
    );
    const hidden = yield* Result.all(
      props.hidden.map((input) => applyPart(rows.hidden, input, [], replacement("hidden"))),
    );

    return yield* applyPart(
      rows.root,
      props.root,
      [...Option.toArray(prompt), media, ...hidden],
      replacement("root"),
    );
  });

/**
 * Read a `qti-media-interaction` as {@link mediaModule} renders it, through the kit.
 *
 * The response must be declared (`undeclared-response` otherwise, as the shipped kinds refuse), of
 * cardinality `single` and base type `integer`; a declaration outside that is the notice
 * `cardinality="…"` or `base-type="…"`. The Prompt and the media element are read by the body
 * walk. The features it reads and does not render are recorded as marks: `coords` on the
 * interaction, and `object` for the deprecated element, whose plays a browser cannot report.
 *
 * @param source The interaction's source element.
 * @param context The element's path, its notice and the reader kit.
 * @returns The model node, its notice, or a refusal.
 */
const parse = (
  source: SourceElement,
  context: ParseContext,
): Result.Result<MediaInteraction | Unsupported, Refusal> =>
  Result.gen(function* readMedia() {
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
    const writtenOf = (name: string) =>
      Option.getOrElse(read.valueOf(declaration.element, name), () => "");

    if (!Option.contains(declaration.cardinality, "single")) {
      return yield* context.notice(`cardinality="${writtenOf("cardinality")}"`);
    }

    if (!Option.contains(declaration.baseType, "integer")) {
      return yield* context.notice(`base-type="${writtenOf("base-type")}"`);
    }

    read.markElement(source);

    if (Option.isSome(read.valueOf(source, "coords"))) {
      read.mark(source, "coords");
    }

    const autostart = yield* read.xsBoolean(source, "autostart", false);
    const loop = yield* read.xsBoolean(source, "loop", false);
    const maxPlays = yield* read.countAttribute(source, "max-plays");
    const minPlays = yield* read.countAttribute(source, "min-plays");
    const prompt = yield* read.content(source, "qti-prompt");
    const child = read
      .elementsOf(source)
      .find((candidate) => mediaElements.some((tag) => read.isQti(candidate, tag)));

    if (child?.local === "object") {
      read.mark(child, "object");
    }

    return {
      ariaLabel: read.valueOf(source, "aria-label"),
      ariaLabelledby: read.valueOf(source, "aria-labelledby"),
      autostart,
      class: Option.getOrElse(read.valueOf(source, "class"), () => ""),
      kind: "media",
      loop,
      maxPlays: Option.getOrElse(maxPlays, () => 0n),
      media: child === undefined ? [] : yield* read.nodes(source, { children: [child] }),
      minPlays: Option.getOrElse(minPlays, () => 0n),
      path: context.path,
      prompt,
      response,
    };
  });

/**
 * Read the count a decoded value holds: its one integer, NULL as 0 plays.
 *
 * @param value The decoded response.
 * @returns The count.
 */
const playsOf = (value: Value): bigint => {
  const [single] = value.values;

  return single?.baseType === "integer" ? single.value : 0n;
};

/**
 * Check a Media's response, which the caller decoded, in two tiers.
 *
 * The caller decodes the posted entry with `decode`, under the entry name its form gave the hidden
 * input and the Media's binding (a single `integer`), and passes the value, or the
 * {@link Malformed} `decode` gave; the entry name stays the caller's, while the messages stay here.
 *
 * - A {@link Malformed} input, by its reason ({@link malformedMessage}): `malformedNumber` for text
 *   that is no number, `malformedSingleMany` for a second entry.
 * - Tier (a), always: a count above `max-plays` when that is not 0, since no play past it is
 *   possible.
 * - Tier (b), only under `validateResponses`: a count below `min-plays`, NULL counting as 0.
 *
 * @param interaction The Media.
 * @param input The decoded value, or why the entry did not decode.
 * @param configuration The configuration, which gives the locale and `validateResponses`.
 * @returns One message per problem, none when the response is accepted.
 */
const validate = (
  interaction: MediaInteraction,
  input: Value | Malformed,
  configuration: Configuration,
): readonly ValidationMessage[] => {
  const { locale } = configuration;
  const say = words[locale];
  const problem = (text: string): ValidationMessage => ({ response: interaction.response, text });

  if (input instanceof Malformed) {
    return [
      problem(
        malformedMessage(
          { baseType: "integer", patternMaskMessage: Option.none() },
          input.reason,
          locale,
        ),
      ),
    ];
  }

  const plays = playsOf(input);

  return [
    ...(interaction.maxPlays > 0n && plays > interaction.maxPlays
      ? [problem(counted(locale, interaction.maxPlays, say.atMostOnce, say.atMost))]
      : []),
    ...(configuration.validateResponses && plays < interaction.minPlays
      ? [problem(counted(locale, interaction.minPlays, say.atLeastOnce, say.atLeast))]
      : []),
  ];
};

/**
 * The regions of a Media's own content, in document order: its Prompt, when it has one, then the
 * media element, with its `source` and `track` children and its fallback content.
 *
 * @param interaction The model node.
 * @returns The regions, without their owner.
 */
const ownRegions = (interaction: MediaInteraction): readonly OwnRegion[] => [
  ...Option.match(interaction.prompt, {
    onNone: (): readonly OwnRegion[] => [],
    onSome: (nodes): readonly OwnRegion[] => [
      { choice: Option.none(), nodes, part: "prompt", written: "nodes" },
    ],
  }),
  { choice: Option.none(), nodes: interaction.media, part: "content", written: "nodes" },
];

/**
 * The Media module (Q-14, the `media` kind): `qti-media-interaction` parsed, copied into its
 * payload node, rendered as the author's native media with its plays counted by the runtime, and
 * checked.
 */
export const mediaModule: InteractionModule<
  "media",
  MediaInteraction,
  MediaPayload,
  MediaPart,
  MediaJson
> = {
  /**
   * The one response Media binds, which `postings` reads: a count, posted as decimal digits.
   */
  bindings: (interaction) => [{ base: Option.some(10), response: interaction.response }],
  /**
   * Media's connect function, {@link connect}, as the record of parts the contract names.
   */
  connect: (interaction, payload) => ({ ...connect(interaction, payload) }),
  /**
   * The payload nodes the render writes as content: the Prompt, then the media element.
   */
  content: (interaction) => [
    ...Option.getOrElse(interaction.prompt, () => []),
    ...interaction.media,
  ],
  /**
   * No Controls the renderer names: the media element's native controls are the author's, and the
   * hidden input is no Control.
   */
  controls: () => 0,
  element,
  feature,
  /**
   * True: the module renders the kind.
   */
  implemented: true,
  kind: "media",
  /**
   * The NULL of the `integer` response Media binds, a single value holding none.
   */
  nullValue: () => nullOf("integer", "single"),
  owner,
  parse,
  parts,
  /**
   * The codec of a Media in a redacted body: every field of the model node but its path.
   */
  payloadSchema: ({ BodyNodes, Count, NoPath, OptionalText, Schema }) =>
    Schema.Struct({
      ariaLabel: OptionalText,
      ariaLabelledby: OptionalText,
      autostart: Schema.Boolean,
      class: Schema.String,
      kind: Schema.Literal("media"),
      loop: Schema.Boolean,
      maxPlays: Count,
      media: BodyNodes,
      minPlays: Count,
      path: NoPath,
      prompt: Schema.OptionFromOptionalKey(BodyNodes),
      response: Schema.String,
    }),
  /**
   * Copy the Media into its payload node: its content through the kit, and the count the view
   * shows, as posted when the view holds a refused post.
   */
  redact: (interaction, kit) => ({
    ariaLabel: interaction.ariaLabel,
    ariaLabelledby: interaction.ariaLabelledby,
    autostart: interaction.autostart,
    class: interaction.class,
    formName: kit.formName(interaction.response),
    loop: interaction.loop,
    maxPlays: interaction.maxPlays,
    media: kit.nodes(interaction.media),
    minPlays: interaction.minPlays,
    prompt: interaction.prompt.pipe(Option.map(kit.nodes)),
    response: interaction.response,
    restore: countOf(
      Option.getOrElse(kit.posted(interaction.response), () =>
        kit.shown(interaction.response).map(format),
      ),
    ),
  }),
  /**
   * The regions of the node's own content, in document order: its Prompt, then the media element.
   */
  regions: ownRegions,
  render: renderMedia,
  /**
   * Rebuild the node with each region's content replaced, in the order `regions` gives them.
   */
  replaceRegions: (interaction, contents) => {
    const [first, ...rest] = contents;
    const after = Option.isSome(interaction.prompt) ? rest : contents;

    return {
      ...interaction,
      media: after[0] ?? interaction.media,
      prompt: interaction.prompt.pipe(Option.map((nodes) => first ?? nodes)),
    };
  },
  /**
   * The value Media shows for a stored response: the stored count itself, which the hidden input
   * restores for the runtime to continue.
   */
  restore: (_interaction, stored) => stored,
  /**
   * No order: a Media has no choices to shuffle.
   */
  sequence: () => Option.none(),
  /**
   * The value Media shows for the correct response: the correct count itself.
   */
  solution: (_interaction, correct) => correct,
  /**
   * False: Media renders no Control the renderer names.
   */
  unnamed: () => false,
  validate,
};

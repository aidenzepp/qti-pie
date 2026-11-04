import { Effect, Option, Schema } from "effect";
import type { Attributes, Element, PartFunction } from "#plate/emit/node.ts";

/**
 * The part keys of each interaction and of the item chrome, a part's name with a lower-case first
 * letter.
 */
interface PartsOf {
  "choice-interaction":
    | "choice"
    | "choices"
    | "control"
    | "indicator"
    | "label"
    | "prompt"
    | "root";
  "extended-text-interaction": "control" | "prompt" | "root";
  item: "form" | "message" | "messages" | "notice" | "root" | "status" | "statusHeading" | "submit";
  "text-entry-interaction": "control" | "root";
}

/**
 * The owner of a group of parts: the item chrome, or one of the interactions phase 1 renders.
 *
 * It is also the first key of {@link PartOverrides}.
 */
export type InteractionKey = keyof PartsOf;

/**
 * The part keys of the interaction `I`, so a part key that `I` has no row for does not type-check.
 */
export type PartOf<I extends InteractionKey> = PartsOf[I];

/**
 * A part of any interaction, the second key of {@link PartOverrides}.
 */
export type PartKey = PartOf<InteractionKey>;

/**
 * Where a part sits in the HTML content model: inside content that takes phrasing content only, or
 * inside content that takes flow content.
 */
export type Position = "flow" | "phrasing";

/**
 * The set of elements a part's root may become under a swap (I3), named for the spec's "May become"
 * column.
 *
 * - `flow-container`, `phrasing-container`: any element of that container class.
 * - `prompt`: a flow or phrasing container, or `p`, so the prompt is valid in any parent.
 * - `form`, `button`, `li`, `textarea`: that element only.
 * - `heading`: `h1` to `h6`. `list`: `ul`, `ol` or `menu`.
 * - `choice-list`: `ul`, `ol` or a flow container; a swap to a flow container adds the list roles.
 * - `choice-item`: `li`, or a flow container under a Choices that is not a list.
 * - `native-input`: an `input`, whose `type` I1 writes back, so the native control stays the one the
 *   interaction computed.
 * - `text-input`: an `input` of type `text`, written or by default.
 * - `any`: any element.
 */
export type TagClass =
  | "any"
  | "button"
  | "choice-item"
  | "choice-list"
  | "flow-container"
  | "form"
  | "heading"
  | "li"
  | "list"
  | "native-input"
  | "phrasing-container"
  | "prompt"
  | "text-input"
  | "textarea";

/**
 * One row of the part table: a part of an interaction, its marker, its default element, what a swap
 * may make it, and the attributes I1 writes onto it.
 */
export interface PartRow {
  /**
   * The default element's local name.
   */
  readonly element: string;
  readonly interaction: InteractionKey;
  /**
   * Whether the part's children are the list items of a list part, so the list joint rule applies
   * to it on every emit, swapped or not.
   */
  readonly listOwner: boolean;
  /**
   * The attributes the interaction's connect function computes for this part, beyond the
   * `data-slot` marker and the session state, which I1 writes over a replacement's.
   *
   * This records what the connect function computes; the merge itself writes whatever the props
   * carry.
   */
  readonly merged: readonly string[];
  readonly part: PartKey;
  /**
   * The part's `data-slot` marker value.
   */
  readonly slot: string;
  readonly tagClass: TagClass;
}

/**
 * Where a part is placed, for the rows whose element depends on it.
 */
export interface RowContext {
  /**
   * The configured heading level of the Status heading, 1 to 6.
   */
  readonly headingLevel?: number;
  /**
   * The Notice's position, phrasing by default.
   */
  readonly position?: Position;
}

/**
 * The form controls: no container class holds one, so a part that must stay a container never
 * becomes a control.
 */
export const controls: ReadonlySet<string> = new Set(["button", "input", "select", "textarea"]);

/**
 * The link elements: no container class holds one, so a container part never becomes a link.
 */
export const links: ReadonlySet<string> = new Set(["a", "area"]);

/**
 * The list elements, whose children are `li` elements.
 */
export const lists: ReadonlySet<string> = new Set(["menu", "ol", "ul"]);

/**
 * The heading elements.
 */
export const headings: ReadonlySet<string> = new Set(["h1", "h2", "h3", "h4", "h5", "h6"]);

/**
 * The elements whose content is phrasing content and which are themselves phrasing content, so
 * they stand at a phrasing or a flow position. Custom elements also count ({@link
 * isPhrasingContainer}).
 *
 * @see https://html.spec.whatwg.org/multipage/dom.html#phrasing-content
 */
const phrasingContainers: ReadonlySet<string> = new Set([
  "abbr",
  "b",
  "bdi",
  "bdo",
  "cite",
  "code",
  "data",
  "dfn",
  "em",
  "i",
  "kbd",
  "mark",
  "q",
  "s",
  "samp",
  "small",
  "span",
  "strong",
  "sub",
  "sup",
  "time",
  "u",
  "var",
]);

/**
 * The containers whose content is flow content and which stand only at a flow position.
 *
 * `p`, the headings and `pre` are left out because their content is phrasing only; a `div` child
 * of one would not round-trip.
 *
 * @see https://html.spec.whatwg.org/multipage/dom.html#flow-content
 */
const blockContainers: ReadonlySet<string> = new Set([
  "address",
  "article",
  "aside",
  "blockquote",
  "details",
  "div",
  "fieldset",
  "figure",
  "footer",
  "header",
  "main",
  "nav",
  "section",
]);

/**
 * The parents that take flow content: the block containers, plus the elements whose content is
 * flow content but which no part becomes.
 */
const flowParents: ReadonlySet<string> = new Set([
  ...blockContainers,
  "dd",
  "form",
  "li",
  "td",
  "th",
]);

/**
 * Tell whether a tag names a custom element, which the HTML parser treats as an ordinary element
 * and which counts as both a phrasing and a flow container.
 *
 * @param tag A local name, lower case.
 * @returns Whether `tag` contains a hyphen.
 * @see https://html.spec.whatwg.org/multipage/custom-elements.html#valid-custom-element-name
 */
const isCustomElement = (tag: string): boolean => tag.includes("-");

/**
 * Tell whether a tag names a phrasing container: an element whose content is phrasing content and
 * which stands at a phrasing or a flow position.
 *
 * @param tag A local name, lower case.
 * @returns Whether `tag` is a listed phrasing container or a custom element.
 */
export const isPhrasingContainer = (tag: string): boolean =>
  phrasingContainers.has(tag) || isCustomElement(tag);

/**
 * Tell whether a tag names a flow container: any element that may stand where a flow container
 * stands, phrasing containers included, and never a control, link or list.
 *
 * @param tag A local name, lower case.
 * @returns Whether `tag` is a phrasing container, a block container or a custom element.
 */
export const isFlowContainer = (tag: string): boolean =>
  isPhrasingContainer(tag) || blockContainers.has(tag);

/**
 * Tell whether an `input`'s `type` attribute is the text type, written or by default.
 *
 * @param type The `type` attribute's value, if present.
 * @returns Whether `type` is absent or is `text` in any ASCII case.
 */
const isTextType = (type: string | true | undefined): boolean =>
  type !== true && (type ?? "text").toLowerCase() === "text";

/**
 * I3's test of each tag class, on the element a replacement returned.
 */
const admits = {
  any: () => true,
  button: ({ tag }) => tag === "button",
  "choice-item": ({ tag }) => tag === "li" || isFlowContainer(tag),
  "choice-list": ({ tag }) => tag === "ol" || tag === "ul" || isFlowContainer(tag),
  "flow-container": ({ tag }) => isFlowContainer(tag),
  form: ({ tag }) => tag === "form",
  heading: ({ tag }) => headings.has(tag),
  li: ({ tag }) => tag === "li",
  list: ({ tag }) => lists.has(tag),
  "native-input": ({ tag }) => tag === "input",
  "phrasing-container": ({ tag }) => isPhrasingContainer(tag),
  prompt: ({ tag }) => tag === "p" || isFlowContainer(tag),
  "text-input": ({ attrs, tag }) => tag === "input" && isTextType(attrs["type"]),
  textarea: ({ tag }) => tag === "textarea",
} satisfies { readonly [C in TagClass]: (element: Element) => boolean };

/**
 * The part table of spec §4.3, one row per part, in the spec's order.
 *
 * The Notice and the StatusHeading hold their context-free defaults, a phrasing `span` and `h1`;
 * {@link rowFor} gives the row for a placement.
 */
export const partTable: readonly PartRow[] = [
  {
    element: "qti-assessment-item",
    interaction: "item",
    listOwner: false,
    merged: ["lang", "id"],
    part: "root",
    slot: "item",
    tagClass: "flow-container",
  },
  {
    element: "form",
    interaction: "item",
    listOwner: false,
    merged: ["method", "action", "novalidate"],
    part: "form",
    slot: "form",
    tagClass: "form",
  },
  {
    element: "section",
    interaction: "item",
    listOwner: false,
    merged: ["id", "role", "aria-labelledby", "tabindex", "autofocus"],
    part: "status",
    slot: "status",
    tagClass: "flow-container",
  },
  {
    element: "h1",
    interaction: "item",
    listOwner: false,
    merged: ["id"],
    part: "statusHeading",
    slot: "status-heading",
    tagClass: "heading",
  },
  {
    element: "ul",
    interaction: "item",
    listOwner: false,
    merged: [],
    part: "messages",
    slot: "messages",
    tagClass: "list",
  },
  {
    element: "li",
    interaction: "item",
    listOwner: false,
    merged: ["id"],
    part: "message",
    slot: "message",
    tagClass: "li",
  },
  {
    element: "button",
    interaction: "item",
    listOwner: false,
    merged: ["type", "disabled"],
    part: "submit",
    slot: "submit",
    tagClass: "button",
  },
  {
    element: "span",
    interaction: "item",
    listOwner: false,
    merged: ["role"],
    part: "notice",
    slot: "notice",
    tagClass: "phrasing-container",
  },
  {
    element: "fieldset",
    interaction: "choice-interaction",
    listOwner: false,
    merged: ["role", "aria-labelledby"],
    part: "root",
    slot: "root",
    tagClass: "flow-container",
  },
  {
    element: "qti-prompt",
    interaction: "choice-interaction",
    listOwner: false,
    merged: ["id"],
    part: "prompt",
    slot: "prompt",
    tagClass: "prompt",
  },
  {
    element: "ul",
    interaction: "choice-interaction",
    listOwner: true,
    merged: [],
    part: "choices",
    slot: "choices",
    tagClass: "choice-list",
  },
  {
    element: "li",
    interaction: "choice-interaction",
    listOwner: false,
    merged: [],
    part: "choice",
    slot: "choice",
    tagClass: "choice-item",
  },
  {
    element: "input",
    interaction: "choice-interaction",
    listOwner: false,
    merged: [
      "id",
      "name",
      "type",
      "value",
      "checked",
      "disabled",
      "aria-labelledby",
      "aria-invalid",
      "aria-describedby",
    ],
    part: "control",
    slot: "control",
    tagClass: "native-input",
  },
  {
    element: "span",
    interaction: "choice-interaction",
    listOwner: false,
    merged: ["aria-hidden"],
    part: "indicator",
    slot: "indicator",
    tagClass: "any",
  },
  {
    element: "label",
    interaction: "choice-interaction",
    listOwner: false,
    merged: ["id", "for"],
    part: "label",
    slot: "label",
    tagClass: "any",
  },
  {
    element: "qti-text-entry-interaction",
    interaction: "text-entry-interaction",
    listOwner: false,
    merged: [],
    part: "root",
    slot: "root",
    tagClass: "phrasing-container",
  },
  {
    element: "input",
    interaction: "text-entry-interaction",
    listOwner: false,
    merged: [
      "id",
      "name",
      "type",
      "value",
      "disabled",
      "inputmode",
      "size",
      "placeholder",
      "aria-label",
      "aria-labelledby",
      "aria-invalid",
      "aria-describedby",
    ],
    part: "control",
    slot: "control",
    tagClass: "text-input",
  },
  {
    element: "qti-extended-text-interaction",
    interaction: "extended-text-interaction",
    listOwner: false,
    merged: [],
    part: "root",
    slot: "root",
    tagClass: "flow-container",
  },
  {
    element: "qti-prompt",
    interaction: "extended-text-interaction",
    listOwner: false,
    merged: ["id"],
    part: "prompt",
    slot: "prompt",
    tagClass: "prompt",
  },
  {
    element: "textarea",
    interaction: "extended-text-interaction",
    listOwner: false,
    merged: [
      "id",
      "name",
      "rows",
      "disabled",
      "aria-label",
      "aria-labelledby",
      "aria-invalid",
      "aria-describedby",
    ],
    part: "control",
    slot: "control",
    tagClass: "textarea",
  },
];

/**
 * The key of a part in the lookups: the interaction and the part, which neither key's spelling can
 * make ambiguous because neither holds a space.
 *
 * @param interaction The interaction key.
 * @param part The part key.
 * @returns The two keys joined by a space.
 */
const rowKey = (interaction: string, part: string): string => `${interaction} ${part}`;

/**
 * The part table's rows by interaction and part.
 */
const rowIndex: ReadonlyMap<string, PartRow> = new Map(
  partTable.map((row) => [rowKey(row.interaction, row.part), row]),
);

if (rowIndex.size !== partTable.length) {
  throw new Error("The part table holds two rows for the same interaction and part.");
}

/**
 * The part keys of each interaction, in the table's order, for checking overrides and naming the
 * keys an unknown one should have been.
 */
const knownParts: ReadonlyMap<string, readonly string[]> = new Map(
  [...new Set(partTable.map((row) => row.interaction))].map((interaction) => [
    interaction,
    partTable.filter((row) => row.interaction === interaction).map((row) => row.part),
  ]),
);

/**
 * Give the row of a part as placed: the table's row, with the Notice's element and class set by its
 * position and the StatusHeading's element by the heading level.
 *
 * @param interaction The interaction that owns the part.
 * @param part The part.
 * @param context Where the part is placed: the Notice's position, phrasing by default, and the
 *   StatusHeading's level, 1 by default.
 * @returns The part's row.
 * @throws {RangeError} When the heading level is not an integer from 1 to 6, a defect of the
 *   caller, which receives a validated configuration.
 */
export const rowFor = <I extends InteractionKey>(
  interaction: I,
  part: PartOf<I>,
  context: RowContext = {},
): PartRow => {
  const row = rowIndex.get(rowKey(interaction, part));
  if (row === undefined) {
    throw new Error(`The part table has no row for ${interaction} ${part}.`);
  }

  if (row.interaction === "item" && row.part === "notice" && context.position === "flow") {
    return { ...row, element: "div", tagClass: "flow-container" };
  }

  if (row.interaction === "item" && row.part === "statusHeading") {
    const level = context.headingLevel ?? 1;
    if (!Number.isInteger(level) || level < 1 || level > 6) {
      throw new RangeError(`A heading level is an integer from 1 to 6, not ${level}.`);
    }

    return { ...row, element: `h${level}` };
  }

  return row;
};

/**
 * Tell whether a replacement's root element may stand for a part (I3), by its tag and, for the
 * text input class, its `type`.
 *
 * @param row The part's row, as {@link rowFor} gives it for the placement.
 * @param element The root element the replacement returned.
 * @returns Whether `element` is in the row's tag class.
 */
export const allows = (row: PartRow, element: Element): boolean => admits[row.tagClass](element);

/**
 * Give the position of a part placed under a parent: flow only when the parent takes flow content
 * and no `p` is open above it, since a `div` start tag closes an open `p` and would not round-trip.
 *
 * @param parentTag The parent's local name, lower case.
 * @param insideParagraph Whether a `p` is open above the parent.
 * @returns `"flow"` or `"phrasing"`.
 */
export const positionUnder = (parentTag: string, insideParagraph: boolean): Position =>
  !insideParagraph && (flowParents.has(parentTag) || isCustomElement(parentTag))
    ? "flow"
    : "phrasing";

/**
 * Construct an id scoped by the item instance, so two instances on one page never share an id.
 * Every id the emitter writes is built here.
 *
 * @param instance The item instance's id.
 * @param segments The id's further parts, such as the response identifier, a part and an index.
 * @returns The instance and the segments joined by `-`: `<instance>-<response>-control-0`.
 */
export const scopedId = (instance: string, ...segments: readonly (number | string)[]): string =>
  [instance, ...segments].join("-");

/**
 * Replacement part functions keyed by interaction, then by part: the goal's tier-2 swap, such as
 * `parts["choice-interaction"].indicator`.
 *
 * The keys are strings so that a caller's misspelt key reaches {@link resolveOverrides} and fails
 * with {@link UnknownPart}.
 */
export type PartOverrides = Readonly<
  Record<string, Readonly<Record<string, PartFunction<Attributes>>>>
>;

/**
 * The part overrides, checked against the part table.
 */
export interface Resolved {
  /**
   * Give the replacement for a part.
   *
   * @param interaction The interaction that owns the part.
   * @param part The part.
   * @returns The replacement part function, or none when the part keeps its default.
   */
  readonly replacementFor: <I extends InteractionKey>(
    interaction: I,
    part: PartOf<I>,
  ) => Option.Option<PartFunction<Attributes>>;
}

/**
 * A part override keyed by an interaction or a part the part table does not have.
 *
 * `part` is none when the interaction itself is unknown.
 */
// oxlint-disable-next-line unicorn/throw-new-error -- `Schema.TaggedError<Self>()` is a class factory that is called once and extended, never thrown.
export class UnknownPart extends Schema.TaggedError<UnknownPart>()("UnknownPart", {
  interaction: Schema.String,
  part: Schema.Option(Schema.String),
}) {
  /**
   * The unknown key and the keys allowed at its level.
   */
  override get message(): string {
    const parts = knownParts.get(this.interaction);
    if (parts === undefined || Option.isNone(this.part)) {
      return `parts has no interaction "${this.interaction}". Key it by one of: ${[...knownParts.keys()].join(", ")}.`;
    }

    return `parts["${this.interaction}"] has no part "${this.part.value}". Key it by one of: ${parts.join(", ")}.`;
  }
}

/**
 * Check part overrides against the part table, failing on the first unknown interaction or part.
 *
 * @param overrides The replacement part functions, none by default.
 * @returns The overrides, resolvable by interaction and part.
 */
export const resolveOverrides = Effect.fnUntraced(function* resolveOverrides(
  overrides: PartOverrides = {},
): Effect.fn.Return<Resolved, UnknownPart> {
  const replacements = new Map<string, PartFunction<Attributes>>();
  for (const [interaction, parts] of Object.entries(overrides)) {
    const known = knownParts.get(interaction);
    if (known === undefined) {
      return yield* new UnknownPart({ interaction, part: Option.none() });
    }

    for (const [part, replacement] of Object.entries(parts)) {
      if (!known.includes(part)) {
        return yield* new UnknownPart({ interaction, part: Option.some(part) });
      }

      replacements.set(rowKey(interaction, part), replacement);
    }
  }

  return {
    replacementFor: (interaction, part) =>
      Option.fromUndefinedOr(replacements.get(rowKey(interaction, part))),
  };
});

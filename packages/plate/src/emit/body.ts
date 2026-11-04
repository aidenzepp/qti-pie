/**
 * Body emission: the item body's HTML subset as nodes of the output tree (I-7, I-8, A-1).
 *
 * {@link emitBody} walks the payload's body. An HTML element renders as itself through `h`, with
 * three changes: `xml:lang` becomes `lang`; an authored `id`, and every reference to one, is scoped
 * by the item instance through {@link authoredId}; and a heading shifts so that `h1` sits at the
 * configured heading level. A `tr` the author placed directly in a `table` gains the `tbody` the
 * HTML parser would insert, so the tree survives a parse. Text becomes text, an interaction goes
 * to its render function, and an unsupported feature becomes a placeholder note. URL attributes
 * pass through unchanged.
 *
 * @module
 * @see {@link Payload} for what the walk reads.
 */
import { Effect } from "effect";
import { h, text } from "#plate/emit/node.ts";
import type { Attributes, Element, Node } from "#plate/emit/node.ts";
import { headings, rowFor, scopedId } from "#plate/emit/parts.ts";
import type { PartSwapRefused } from "#plate/emit/swap.ts";
import { message } from "#plate/messages.ts";
import type { Locale } from "#plate/messages.ts";
import type {
  AttributePayload,
  ElementPayload,
  EmitState,
  InteractionPayload,
  NoticePayload,
  Payload,
  PayloadNode,
} from "#plate/payload.ts";

/**
 * Render one interaction of the body: the interaction module's render function, with the payload
 * and the state already applied.
 *
 * @param interaction The interaction's payload.
 * @returns The interaction's Root, or the refusal of a part swap.
 */
export type RenderInteraction = (
  interaction: InteractionPayload,
) => Effect.Effect<Element, PartSwapRefused>;

/**
 * The attributes the XSD declares as references to ids (`xs:IDREF`, `xs:IDREFS`, and `headers`, a
 * list of identifiers), each value one id or a whitespace-separated list of them.
 *
 * `for` is not among them: the XSD does not declare it on `label`.
 */
const idReferences: ReadonlySet<string> = new Set([
  "aria-activedescendant",
  "aria-controls",
  "aria-describedby",
  "aria-details",
  "aria-errormessage",
  "aria-flowto",
  "aria-labelledby",
  "aria-owns",
  "headers",
]);

/**
 * An event-handler attribute's name, which the serialiser refuses.
 */
const eventHandler = /^on/iu;

/**
 * The whitespace that separates the ids of a list.
 */
const separator = /[\t\n\f\r ]+/u;

/**
 * Text that holds whitespace only, which the HTML parser keeps in place between table rows.
 */
const blank = /^[\t\n\f\r ]*$/u;

/**
 * What the walk carries from the payload and the state into every node.
 */
interface Walk {
  readonly headingLevel: number;
  readonly instance: string;
  readonly locale: Locale;
  readonly renderInteraction: RenderInteraction;
}

/**
 * Scope an id the author wrote by the item instance, so it meets no other instance's ids and none
 * of the ids the renderer writes for its own parts.
 *
 * The renderer's ids are `<instance>-<segment>-…`, where the first segment is a response
 * identifier or a part name and so starts with a letter or an underscore. The empty segment here
 * gives `<instance>--<id>`: the double hyphen is a prefix no renderer id has, so an authored
 * `RESPONSE-control-0`, `item` or `status` stays distinct from the Control, Root and Status ids.
 * The `id` attribute, every IDREF attribute and every same-document `#id` fragment use this one
 * helper, so a reference still finds its target.
 *
 * @param instance The item instance key.
 * @param id The id as the author wrote it.
 * @returns `<instance>--<id>`.
 */
export const authoredId = (instance: string, id: string): string => scopedId(instance, "", id);

/**
 * Give the tag an authored element renders as: a heading shifted so `h1` sits at the heading level,
 * every level rising by the same amount and capped at `h6`; any other tag unchanged.
 *
 * @param tag The authored local name.
 * @param headingLevel The configured heading level, 1 to 6.
 * @returns The tag to emit.
 */
const tagFor = (tag: string, headingLevel: number): string =>
  headings.has(tag) ? `h${Math.min(6, Number(tag.slice(1)) + headingLevel - 1)}` : tag;

/**
 * Give one authored attribute as it renders.
 *
 * @param attribute The attribute as the model kept it.
 * @param instance The item instance key.
 * @returns The attribute's name and value as emitted: `xml:lang` as `lang`, an `id` and each id an
 *   IDREF attribute names through {@link authoredId}, any other value as written.
 */
const attributeFor = (
  { name, value }: AttributePayload,
  instance: string,
): readonly [string, string] => {
  if (name === "xml:lang") {
    return ["lang", value];
  }

  if (name === "id") {
    return [name, authoredId(instance, value)];
  }

  if (idReferences.has(name)) {
    const ids = value.split(separator).filter((id) => id !== "");

    return [name, ids.map((id) => authoredId(instance, id)).join(" ")];
  }

  return [name, value];
};

/**
 * Give an authored element's attributes as they render.
 *
 * An event-handler attribute is dropped, which the serialiser would refuse; `check` already
 * removes and marks every attribute only the XSD's wildcard admits, so this drop is the emitter's
 * own guard. When the author wrote both `lang` and `xml:lang`, `xml:lang` wins, as it does in HTML.
 *
 * @param attributes The attributes as the model kept them.
 * @param instance The item instance key.
 * @returns The attributes to emit.
 */
const attributesFor = (attributes: readonly AttributePayload[], instance: string): Attributes => {
  const hasXmlLang = attributes.some(({ name }) => name === "xml:lang");

  return Object.fromEntries(
    attributes
      .filter(({ name }) => !eventHandler.test(name) && !(hasXmlLang && name === "lang"))
      .map((attribute) => attributeFor(attribute, instance)),
  );
};

/**
 * Tell whether a node is a table row.
 *
 * @param node The node.
 * @returns Whether it is a `tr` element.
 */
const isRow = (node: Node): node is Element => node.kind === "element" && node.tag === "tr";

/**
 * Wrap each run of rows a `table` holds directly in a `tbody`, as the HTML parser would, so the
 * emitted table parses back to itself.
 *
 * A run is consecutive `tr` elements with only whitespace text between them; whitespace before the
 * first row and after the last stays outside the `tbody`.
 *
 * @param children The `table`'s emitted children.
 * @returns The children with every run of rows in its own `tbody`.
 */
const withBodies = (children: readonly Node[]): readonly Node[] => {
  const result: Node[] = [];
  let rows: Node[] = [];
  let gap: Node[] = [];
  const close = (): void => {
    if (rows.length > 0) {
      result.push(h("tbody", {}, rows));
    }

    result.push(...gap);
    rows = [];
    gap = [];
  };

  for (const child of children) {
    if (isRow(child)) {
      rows.push(...gap, child);
      gap = [];
    } else if (rows.length > 0 && child.kind === "text" && blank.test(child.text)) {
      gap.push(child);
    } else {
      close();
      result.push(child);
    }
  }

  close();

  return result;
};

/**
 * Give the placeholder of an unsupported feature: a phrasing `span` note carrying the Notice
 * marker and the locale's notice text, standing in until the body renders the Notice part.
 *
 * @param notice The notice's payload.
 * @param locale The locale the text is written in.
 * @returns The placeholder.
 */
const placeholder = (notice: NoticePayload, locale: Locale): Element =>
  h("span", { "data-slot": rowFor("item", "notice").slot, role: "note" }, [
    text(message(locale, "notice", { feature: notice.feature })),
  ]);

/**
 * Emit body nodes, in order.
 *
 * @param nodes The payload nodes.
 * @param walk What the walk carries.
 * @returns The emitted nodes, or the first refusal of an interaction's part swap.
 */
const nodesOf = (
  nodes: readonly PayloadNode[],
  walk: Walk,
): Effect.Effect<readonly Node[], PartSwapRefused> =>
  // oxlint-disable-next-line eslint/no-use-before-define -- `nodesOf` and `nodeOf` are mutually recursive, as elements nest; the call runs only after both are defined.
  Effect.all(nodes.map((node) => nodeOf(node, walk)));

/**
 * Emit an authored HTML element and its subtree.
 *
 * @param element The element's payload.
 * @param walk What the walk carries.
 * @returns The element as it renders, or the first refusal of an interaction's part swap.
 */
const elementOf = (element: ElementPayload, walk: Walk): Effect.Effect<Element, PartSwapRefused> =>
  Effect.map(nodesOf(element.children, walk), (children) =>
    h(
      tagFor(element.tag, walk.headingLevel),
      attributesFor(element.attributes, walk.instance),
      element.tag === "table" ? withBodies(children) : children,
    ),
  );

/**
 * Emit one body node.
 *
 * @param node The payload node.
 * @param walk What the walk carries.
 * @returns The node as it renders, or the refusal of an interaction's part swap.
 */
const nodeOf = (node: PayloadNode, walk: Walk): Effect.Effect<Node, PartSwapRefused> => {
  switch (node.kind) {
    case "element": {
      return elementOf(node, walk);
    }
    case "text": {
      return Effect.succeed(text(node.text));
    }
    case "notice": {
      return Effect.succeed(placeholder(node, walk.locale));
    }
    case "choice":
    case "extended-text":
    case "text-entry": {
      return walk.renderInteraction(node);
    }
    default: {
      return node satisfies never;
    }
  }
};

/**
 * Emit payload nodes from anywhere in the body, such as a Prompt's or a choice's content, with the
 * same id scoping, heading shift and placeholders as the body itself.
 *
 * @param nodes The payload nodes.
 * @param payload The payload, which gives the item instance key.
 * @param state The emit state, which gives the locale and the heading level.
 * @param renderInteraction The render function for an interaction among the nodes.
 * @returns The emitted nodes, in order, or the first refusal of an interaction's part swap.
 */
export const emitNodes = (
  nodes: readonly PayloadNode[],
  payload: Payload,
  state: EmitState,
  renderInteraction: RenderInteraction,
): Effect.Effect<readonly Node[], PartSwapRefused> =>
  nodesOf(nodes, {
    headingLevel: state.headingLevel,
    instance: payload.instance,
    locale: state.locale,
    renderInteraction,
  });

/**
 * Emit the item body: the payload's body nodes as the output tree's nodes, in order.
 *
 * @param payload The payload, whose body the walk reads.
 * @param state The emit state.
 * @param renderInteraction The render function each interaction of the body is handed to.
 * @returns The body's nodes, or the first refusal of an interaction's part swap.
 */
export const emitBody = (
  payload: Payload,
  state: EmitState,
  renderInteraction: RenderInteraction,
): Effect.Effect<readonly Node[], PartSwapRefused> =>
  emitNodes(payload.body, payload, state, renderInteraction);

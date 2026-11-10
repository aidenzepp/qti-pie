/**
 * Hot Text (Q-11): its model node, parts, connect function and response validation, on the
 * interaction-module shape.
 *
 * A `qti-hottext-interaction` is a prompt interaction whose block content holds `qti-hottext`
 * choices at any depth. Reading 38 ("A `qti-gap` appears only within a gap-match interaction, and a
 * `qti-hottext` may appear in any flow or inline content") lets a hottext stand anywhere in flow or
 * inline content, so the module reads the hottexts of its own content, at any depth, and a hottext
 * outside it belongs to no interaction and stays as the body walk leaves it.
 *
 * {@link hottextModule}'s render emits this structure: a `qti-hottext-interaction` Root, a custom
 * element, which takes flow content, carrying `role="group"` as Extended Text's Root does, named by
 * the Prompt through `aria-labelledby`; it holds the Prompt when there is one and the Content, the
 * author's block content with each hottext in place. A hottext is one Choice, a `label` holding one
 * native Control, a radio when one choice can be posted (`max-choices` 1, or a `single` response)
 * and a checkbox otherwise, then the hottext's own content, so the sentence reads as the author
 * wrote it and the Control's accessible name is the hottext's text (WCAG 2.5.3). The Choice is
 * phrasing content, so no part breaks the author's paragraph in the HTML parser, and it takes the
 * hottext's own authored attributes.
 *
 * A hottext the template variable it names hides (`template-identifier` and `show-hide`) "must
 * still be presented to the candidate as if it were simply part of the surrounding material": its
 * content stands in the sentence with no Choice and no Control. The model keeps that decision where
 * the redaction already makes it: each hottext holds a `qti-hottext-control` marker, and one with
 * a template visibility holds it inside a template inline, which `redact` shows or hides by the
 * template value as it does any template inline. So a redacted hottext is selectable exactly when
 * it holds the marker, and the response validation and the render read that one fact.
 *
 * The module value-imports nothing that reaches `#plate/model/interactions.ts`, which holds the
 * table of modules and so imports this file: `#plate/interactions/name.ts` and
 * `#plate/interactions/choice.ts` do reach it, so loading this file first would read the table
 * before the module it names exists. The few helpers it shares with Choice, the text a name is
 * made of and the `label` rewrite, are written here beside the part they serve.
 *
 * {@link hottextModule}'s `validate` checks a value the caller decoded in two tiers, as Choice's
 * does: tier (a) always, tier (b) only under `validateResponses` (D5).
 *
 * @module
 */
import { Option, Result } from "effect";
import type { SchemaKit } from "#plate/codec/redacted.ts";
import type { Configuration } from "#plate/configuration.ts";
import { attributePath } from "#plate/document/source.ts";
import { emitNodes, nestedInteraction } from "#plate/emit/body.ts";
import type { OwnedElements } from "#plate/emit/body.ts";
import { h, when } from "#plate/emit/node.ts";
import type { Attributes, Element, Node, PartFunction } from "#plate/emit/node.ts";
import { authoredIdrefs, scopedId } from "#plate/emit/parts.ts";
import { applyPart } from "#plate/emit/swap.ts";
import type { PartSwapRefused } from "#plate/emit/swap.ts";
import { Malformed } from "#plate/form/encoding.ts";
import { partRow } from "#plate/interactions/contract.ts";
import type {
  InteractionModule,
  ModuleInteraction,
  OwnRegion,
  PartSpec,
  RedactKit,
} from "#plate/interactions/contract.ts";
import { message, numeral } from "#plate/messages.ts";
import type { Locale } from "#plate/messages.ts";
import type {
  BodyElement,
  BodyNode,
  TemplateContent,
  TemplateVisibility,
} from "#plate/model/item.ts";
import { format, nullOf, trimXmlSpace } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";
import type {
  ElementPayload,
  EmitState,
  Payload,
  PayloadNode,
  ValidationMessage,
} from "#plate/payload.ts";
import type { Cardinality } from "#plate/vocabulary.ts";

/**
 * The owner of every Hot Text part in the part table.
 */
const owner = "hottext-interaction";

/**
 * Hot Text's identifier in the QTI 3.0 conformance list, Appendix A.
 */
const feature = "Q-11";

/**
 * The QTI element Hot Text is read from.
 */
const element = "qti-hottext-interaction";

/**
 * The QTI element of one choice of Hot Text, which the body walk reads as an element of the
 * module's own content, where it writes a notice for any other `qti-*` element.
 */
const hottextTag = "qti-hottext";

/**
 * The tag of the marker a selectable hottext holds, which no QTI document writes: the model adds
 * it to each hottext it reads, as its first child, so a hottext with no template visibility holds
 * it and one with a template visibility holds it inside a template inline that the template value
 * shows or hides. The emitter never writes it.
 */
const controlTag = "qti-hottext-control";

/**
 * A Hot Text part.
 */
type HottextPart = "choice" | "content" | "control" | "prompt" | "root";

/**
 * The model node of a `qti-hottext-interaction` (Q-11), bound to an identifier response of single
 * or multiple cardinality: the fields every module's node shares, `max-choices` and `min-choices`
 * as counts held exactly (reading 46), the author's messages for the two bounds, the Prompt, and
 * the block content with every hottext in place, each holding the marker of a selectable choice
 * ({@link controlTag}).
 */
export interface HottextInteraction extends ModuleInteraction<"hottext"> {
  /**
   * The bound response's cardinality.
   */
  readonly cardinality: "multiple" | "single";
  /**
   * The author's `class` value, empty when absent.
   */
  readonly class: string;
  /**
   * The interaction's block content after its Prompt: the author's markup, with each `qti-hottext`
   * left in place as an element that holds its own content after its marker.
   */
  readonly content: readonly BodyNode[];
  /**
   * `max-choices`, 1 when absent: a count, 0 to 2^63-1, held exactly (reading 46). 0 limits
   * nothing.
   */
  readonly maxChoices: bigint;
  /**
   * The author's replacements for the too-many and too-few messages,
   * `data-max-selections-message` and `data-min-selections-message`.
   */
  readonly messages: { readonly max: Option.Option<string>; readonly min: Option.Option<string> };
  /**
   * `min-choices`, 0 when absent: a count, 0 to 2^63-1, held exactly (reading 46).
   */
  readonly minChoices: bigint;
  /**
   * The content of the interaction's first `qti-prompt`, none when it has none.
   */
  readonly prompt: Option.Option<readonly BodyNode[]>;
}

/**
 * The payload node of a Hot Text (Q-11, the kind `hottext`): what its `redact` copies of the model
 * node, its Prompt and content as payload nodes, and what it reads of the view through the kit, so
 * the render sees the `Payload` and none of the view beyond it.
 */
export interface HottextPayload {
  /**
   * The author's `aria-label`, which names the group when it has no Prompt.
   */
  readonly ariaLabel: Option.Option<string>;
  /**
   * The author's `aria-labelledby`, the ids as written, which names the group when it has no
   * Prompt.
   */
  readonly ariaLabelledby: Option.Option<string>;
  /**
   * Whether the first Control takes `autofocus`.
   */
  readonly autofocus: boolean;
  /**
   * The author's `class` value, empty when absent.
   */
  readonly class: string;
  /**
   * The block content, its hottexts as elements: each selectable one holds the marker first.
   */
  readonly content: readonly PayloadNode[];
  /**
   * The name every Control posts under: the view's name for the response, else
   * `entryName(instance, response)`.
   */
  readonly formName: string;
  readonly prompt: Option.Option<readonly PayloadNode[]>;
  /**
   * The identifier of the response it binds.
   */
  readonly response: string;
  /**
   * The identifiers the Controls show checked: the strings posted when the view has messages, else
   * the view's values.
   */
  readonly restore: readonly string[];
  /**
   * What each Control is: a radio when one choice can be posted, else a checkbox.
   */
  readonly type: "checkbox" | "radio";
}

/**
 * A Hot Text in the JSON form: counts as decimal digits, each `Option` an optional key, its content
 * the body's recursive form, and no path.
 */
interface HottextJson {
  readonly ariaLabel?: string;
  readonly ariaLabelledby?: string;
  readonly cardinality: "multiple" | "single";
  readonly class: string;
  readonly content: SchemaKit["BodyNodes"]["Encoded"];
  readonly kind: "hottext";
  readonly maxChoices: string;
  readonly messages: { readonly max?: string; readonly min?: string };
  readonly minChoices: string;
  readonly prompt?: SchemaKit["BodyNodes"]["Encoded"];
  readonly response: string;
}

/**
 * The attributes of every part of one Hot Text, computed once by {@link connect}: each Choice's
 * and each Control's for every selectable hottext, in document order.
 */
interface HottextAttributes {
  readonly choice: readonly Attributes[];
  readonly content: Attributes;
  readonly control: readonly Attributes[];
  readonly prompt: Attributes;
  readonly root: Attributes;
}

/**
 * The specs of the Hot Text parts. The Root is a custom element, which takes flow content, so the
 * author's `p` stays inside it; the Choice is a `label`, phrasing content, so a hottext stays
 * inside the author's sentence.
 */
const parts = {
  choice: {
    defaults: {},
    element: "label",
    listOwner: false,
    merged: ["for"],
    tagClass: "inline-label",
  },
  content: {
    defaults: {},
    element: "div",
    listOwner: false,
    merged: [],
    tagClass: "flow-container",
  },
  control: {
    defaults: {},
    element: "input",
    listOwner: false,
    merged: [
      "id",
      "name",
      "type",
      "value",
      "checked",
      "disabled",
      "aria-label",
      "aria-invalid",
      "aria-describedby",
      "autofocus",
    ],
    tagClass: "native-input",
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
    element,
    listOwner: false,
    merged: ["role", "aria-labelledby", "aria-label", "class"],
    tagClass: "flow-container",
  },
} as const satisfies { readonly [Q in HottextPart]: PartSpec };

/**
 * The row of every Hot Text part, which no placement changes.
 */
const rows = {
  choice: partRow({ owner, parts }, "choice"),
  content: partRow({ owner, parts }, "content"),
  control: partRow({ owner, parts }, "control"),
  prompt: partRow({ owner, parts }, "prompt"),
  root: partRow({ owner, parts }, "root"),
};

/**
 * Read an attribute of a body element or of a payload element, none when it carries none.
 *
 * @param attributes The element's attributes, as the model or the payload holds them.
 * @param name The attribute's name.
 * @returns Its value, or none.
 */
const attributeOf = (
  attributes: readonly { readonly name: string; readonly value: string }[],
  name: string,
): Option.Option<string> =>
  Option.fromNullishOr(attributes.find((attribute) => attribute.name === name)?.value);

/**
 * Tell whether a text holds anything but ASCII whitespace, the whitespace a name collapses.
 *
 * @param written The text.
 * @returns Whether it is not blank.
 */
const isWritten = (written: string): boolean => /[^\t\n\f\r ]/u.test(written);

/**
 * Tell whether payload nodes give a reader any text: a text node, an `img`'s `alt` and an
 * element's `aria-label`, each counting when it holds anything but whitespace, and a notice, which
 * the renderer writes as text. An element with `aria-hidden="true"` gives none, nor does anything
 * below it. A Control whose Choice gives none is named by the renderer.
 *
 * @param nodes A hottext's content, without its marker.
 * @returns Whether any of them gives text.
 */
const givesText = (nodes: readonly PayloadNode[]): boolean =>
  nodes.some((node) => {
    if (node.kind === "text") {
      return isWritten(node.text);
    }

    if (node.kind === "element") {
      const read = (name: string) => Option.exists(attributeOf(node.attributes, name), isWritten);

      return (
        !Option.contains(attributeOf(node.attributes, "aria-hidden"), "true") &&
        (read("aria-label") || (node.tag === "img" && read("alt")) || givesText(node.children))
      );
    }

    return node.kind === "notice";
  });

/**
 * Tell whether children of a model hottext hold its marker, directly or inside the template inline
 * that shows or hides it.
 *
 * @param children The hottext's children.
 * @returns Whether the hottext is selectable.
 */
const holdsMarker = (children: readonly BodyNode[]): boolean =>
  children.some(
    (child) =>
      (child.kind === "element" && child.tag === controlTag) ||
      (child.kind === "template-inline" && holdsMarker(child.content)),
  );

/**
 * Collect the identifiers of the selectable hottexts among body nodes, in document order, below
 * elements and template content, the hottext's own content not entered.
 *
 * @param nodes The interaction's content.
 * @returns The identifiers of the hottexts that hold a marker.
 */
const selectableIn = (nodes: readonly BodyNode[]): readonly string[] =>
  nodes.flatMap((node): readonly string[] => {
    if (node.kind === "element") {
      if (node.tag !== hottextTag) {
        return selectableIn(node.children);
      }

      return holdsMarker(node.children)
        ? Option.toArray(attributeOf(node.attributes, "identifier"))
        : [];
    }

    return node.kind === "template-block" || node.kind === "template-inline"
      ? selectableIn(node.content)
      : [];
  });

/**
 * A selectable hottext as the payload holds it.
 */
interface Selectable {
  /**
   * Its content, without the marker.
   */
  readonly content: readonly PayloadNode[];
  /**
   * The payload element itself, which the emitter hands the render by identity.
   */
  readonly element: ElementPayload;
  readonly identifier: string;
}

/**
 * Drop the marker among a payload hottext's children.
 *
 * @param children The hottext's children.
 * @returns The hottext's own content.
 */
const withoutMarker = (children: readonly PayloadNode[]): readonly PayloadNode[] =>
  children.filter((child) => !(child.kind === "element" && child.tag === controlTag));

/**
 * Collect the selectable hottexts among payload nodes, in document order, below elements; a
 * hottext's own content is not entered, since no hottext holds another.
 *
 * @param nodes The interaction's content.
 * @returns Each hottext that holds the marker.
 */
const selectablesIn = (nodes: readonly PayloadNode[]): readonly Selectable[] =>
  nodes.flatMap((node): readonly Selectable[] => {
    if (node.kind !== "element") {
      return [];
    }

    if (node.tag !== hottextTag) {
      return selectablesIn(node.children);
    }

    const content = withoutMarker(node.children);

    return content.length === node.children.length
      ? []
      : [
          {
            content,
            element: node,
            identifier: Option.getOrElse(attributeOf(node.attributes, "identifier"), () => ""),
          },
        ];
  });

/**
 * Mark one hottext: put the marker first among its children, in a template inline when the hottext
 * names a template variable.
 *
 * @param hottext The hottext element, its children already marked.
 * @param identifierOf The reader of an identifier attribute's value.
 * @returns The hottext without `template-identifier` and `show-hide`, holding the marker first.
 */
const marked = (hottext: BodyElement, identifierOf: (written: string) => string): BodyElement => {
  const identifier = Option.getOrElse(attributeOf(hottext.attributes, "identifier"), () => "");
  const path = `${hottext.path}/${controlTag}`;
  const marker: BodyElement = {
    attributes: [],
    children: [],
    kind: "element",
    path,
    tag: controlTag,
  };
  const visibility: Option.Option<TemplateVisibility> = Option.map(
    attributeOf(hottext.attributes, "template-identifier"),
    (written) => ({
      showHide: Option.contains(attributeOf(hottext.attributes, "show-hide"), "hide")
        ? "hide"
        : "show",
      templateIdentifier: identifierOf(written),
    }),
  );
  const control: BodyNode = Option.match(visibility, {
    onNone: (): BodyNode => marker,
    onSome: (templateVisibility): TemplateContent => ({
      content: [marker],
      identifier: identifierOf(identifier),
      kind: "template-inline",
      path,
      responses: [],
      templateVisibility,
    }),
  });

  return {
    ...hottext,
    attributes: hottext.attributes.filter(
      ({ name }) => name !== "template-identifier" && name !== "show-hide",
    ),
    children: [control, ...hottext.children],
  };
};

/**
 * Add the marker to each hottext among body nodes, at any depth, so the model holds which hottexts
 * are selectable: a hottext with no `template-identifier` holds the marker as its first child, one
 * with it holds the marker inside a template inline that carries the visibility, and the hottext
 * loses both attributes, which the redaction settles and the page never knows.
 *
 * @param nodes The content the body walk read.
 * @param identifierOf The reader of an identifier attribute's value.
 * @returns The same nodes, each hottext marked.
 */
const withMarkers = (
  nodes: readonly BodyNode[],
  identifierOf: (written: string) => string,
): readonly BodyNode[] =>
  nodes.map((node): BodyNode => {
    if (node.kind === "template-block" || node.kind === "template-inline") {
      return { ...node, content: withMarkers(node.content, identifierOf) };
    }

    if (node.kind !== "element") {
      return node;
    }

    const children = withMarkers(node.children, identifierOf);

    return node.tag === hottextTag
      ? marked({ ...node, children }, identifierOf)
      : { ...node, children };
  });

/**
 * Narrow a written cardinality to the two Hot Text binds.
 *
 * @param cardinality The declaration's cardinality, none when absent or outside the vocabulary.
 * @returns `single` or `multiple`, else none.
 */
const bindable = (cardinality: Option.Option<Cardinality>): Option.Option<"multiple" | "single"> =>
  cardinality.pipe(
    Option.flatMap((value) =>
      value === "single" || value === "multiple" ? Option.some(value) : Option.none(),
    ),
  );

/**
 * Give the author's names of the group when it has no Prompt: the `aria-label` unless blank, and
 * the `aria-labelledby` with each id scoped by the instance. The kit gives the module no ids the
 * item carries, so an id no element carries stays written, where Choice drops it.
 *
 * @param interaction The Hot Text.
 * @param instance The item instance key.
 * @returns The group's naming attributes, none when the author gave none.
 */
const authorsName = (interaction: HottextPayload, instance: string): Attributes => ({
  ...Option.match(
    interaction.ariaLabel.pipe(Option.filter((label) => trimXmlSpace(label) !== "")),
    { onNone: () => ({}), onSome: (label) => ({ "aria-label": label }) },
  ),
  ...Option.match(
    interaction.ariaLabelledby.pipe(Option.flatMap((ids) => authoredIdrefs(instance, ids))),
    { onNone: () => ({}), onSome: (ids) => ({ "aria-labelledby": ids }) },
  ),
});

/**
 * Compute every attribute of every part of one Hot Text once: the connect function.
 *
 * - Root: the marker, `role="group"`, the state (`data-mode`, and `data-disabled` when the author
 *   disabled every control), the author's `class`, and the group's name: with a Prompt, the Prompt
 *   names it (`aria-labelledby` → the Prompt's id) and the author's names are not written; with
 *   none, the author's `aria-label` and `aria-labelledby` ({@link authorsName}); with neither the
 *   group stays unnamed.
 * - Prompt: the marker and its id, which the Root names.
 * - Content: the marker.
 * - Each Choice: the marker, and `for` → its Control's id.
 * - Each Control, one per selectable hottext in document order: a radio when one choice can be posted
 *   (`max-choices` 1, or a `single` response), else a checkbox; its id, the payload's `formName`
 *   and the hottext's identifier as `value`; `checked` from the restore; `disabled` when finished
 *   or not editable (review and solution); `aria-invalid` and `aria-describedby` → the message ids
 *   when the response is invalid; `autofocus` on the first when the payload says; and, when the
 *   hottext's content gives no text, the renderer's `aria-label` "Choice n of count", `n` its
 *   position among the Controls: the Choice's text names every other.
 *
 * Every id is `scopedId(instance, response, part, index)`.
 *
 * @param interaction The Hot Text.
 * @param payload The payload, which gives the instance, the mode, `finished` and the messages.
 * @param locale The locale of the renderer's own text.
 * @returns The attributes of every part.
 * @see https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#constructing-the-form-data-set
 */
const connect = (
  interaction: HottextPayload,
  payload: Payload,
  locale: Locale,
): HottextAttributes => {
  const { instance } = payload;
  const selectables = selectablesIn(interaction.content);
  const messageIds = payload.messages
    .filter((entry) => entry.response === interaction.response)
    .map((entry) => entry.id);
  const invalid = messageIds.length > 0;
  const editable = payload.mode === "answering";
  const controlId = (index: number) => scopedId(instance, interaction.response, "control", index);

  return {
    choice: selectables.map((_, index) => ({
      "data-slot": rows.choice.slot,
      for: controlId(index),
    })),
    content: { "data-slot": rows.content.slot },
    control: selectables.map(({ content, identifier }, index) => ({
      ...when(!givesText(content), {
        "aria-label": message(locale, "choiceOf", {
          count: numeral(locale, selectables.length),
          n: numeral(locale, index + 1),
        }),
      }),
      ...when(invalid, { "aria-describedby": messageIds.join(" "), "aria-invalid": "true" }),
      ...when(interaction.autofocus && index === 0, { autofocus: true }),
      ...when(interaction.restore.includes(identifier), { checked: true }),
      "data-slot": rows.control.slot,
      ...when(payload.finished || !editable, { disabled: true }),
      id: controlId(index),
      name: interaction.formName,
      type: interaction.type,
      value: identifier,
    })),
    prompt: {
      "data-slot": rows.prompt.slot,
      id: scopedId(instance, interaction.response, "prompt"),
    },
    root: {
      ...(Option.isSome(interaction.prompt)
        ? { "aria-labelledby": scopedId(instance, interaction.response, "prompt") }
        : authorsName(interaction, instance)),
      ...when(interaction.class !== "", { class: interaction.class }),
      ...when(payload.finished, { "data-disabled": true }),
      "data-mode": payload.mode,
      "data-slot": rows.root.slot,
      role: "group",
    },
  };
};

/**
 * Write every `label` element among emitted nodes, at any depth, as a `span` with the same children
 * and attributes, `for` dropped, so a `label` the author put in a hottext's content does not nest
 * in the Choice's own.
 *
 * @param node A node of a hottext's emitted content.
 * @returns The node with no `label` element at or below it.
 */
const labelAsSpan = (node: Node): Node => {
  if (node.kind === "text") {
    return node;
  }

  const children = node.children.map(labelAsSpan);

  return node.tag === "label"
    ? h(
        "span",
        Object.fromEntries(Object.entries(node.attrs).filter(([key]) => key !== "for")),
        children,
      )
    : h(node.tag, node.attrs, children);
};

/**
 * Give a host's replacement for a Hot Text part.
 *
 * @param state The emit state, which holds the resolved overrides.
 * @param part The part.
 * @returns The replacement part function, undefined when the part keeps its default.
 */
const replacementOf = (state: EmitState, part: HottextPart) =>
  Option.getOrUndefined(state.parts.replacementFor(owner, part));

/**
 * What the placement of a hottext reads, in one render: the payload and the emit state the content
 * is written under, the part overrides, and the attributes {@link connect} computed for each
 * selectable hottext, by the payload element itself.
 */
interface Placing {
  readonly connected: ReadonlyMap<
    ElementPayload,
    { readonly choice: Attributes; readonly control: Attributes }
  >;
  readonly payload: Payload;
  readonly replacement: (part: HottextPart) => PartFunction<Attributes> | undefined;
  readonly state: EmitState;
}

/**
 * Give the owned-element renderer of content in which every hottext is the module's own element:
 * the emitter hands it each element outside the HTML subset, and it renders the hottexts through
 * `place` and drops any other.
 *
 * @param place Renders one hottext.
 * @returns The renderer for {@link nestedInteraction}.
 */
const ownedBy =
  (
    place: (hottext: ElementPayload) => Result.Result<readonly Node[], PartSwapRefused>,
  ): OwnedElements =>
  (found) =>
    found.tag === hottextTag ? Option.some(place(found)) : Option.none();

/**
 * Emit a hottext's content as part of the surrounding material: no Choice and no Control, its
 * children where the hottext stood. A hottext inside it is written the same way, since no hottext
 * holds a selectable one.
 *
 * @param children The hottext's own content.
 * @param placing What the render reads.
 * @returns The emitted nodes, or the refusal of a part swap.
 */
const emitPlain = (
  children: readonly PayloadNode[],
  placing: Placing,
): Result.Result<readonly Node[], PartSwapRefused> =>
  emitNodes(
    children,
    placing.payload,
    placing.state,
    nestedInteraction(
      owner,
      ownedBy((inner) => emitPlain(withoutMarker(inner.children), placing)),
    ),
  );

/**
 * Place one hottext of the content: a Choice holding its Control and its content when it is
 * selectable, its content alone when it is not.
 *
 * The hottext's authored attributes (`class`, `lang`, an `id`) are written as the body writes them,
 * through `emitNodes` on a `span` that carries them. A selectable hottext's Choice takes them under
 * its own, around its Control and its content with each `label` written as a `span`; the Control
 * goes through `applyPart` first, so a replacement of the Choice is handed it among its children. A
 * hottext that is not selectable stands as part of the surrounding material: its content, in a
 * `span` only when the author gave it an attribute, so no `lang` or `id` is lost.
 *
 * @param hottext The hottext element of the payload.
 * @param placing What the render reads.
 * @returns The nodes that stand where the hottext stood, or the refusal of a part swap.
 */
const placeHottext = (
  hottext: ElementPayload,
  placing: Placing,
): Result.Result<readonly Node[], PartSwapRefused> =>
  Result.gen(function* hottextChoice() {
    const span: ElementPayload = {
      attributes: hottext.attributes.filter(({ name }) => name !== "identifier"),
      children: withoutMarker(hottext.children),
      kind: "element",
      tag: "span",
    };
    const emitted = yield* emitPlain([span], placing);
    const authored = emitted.find((node): node is Element => node.kind === "element");
    const attributes = placing.connected.get(hottext);

    if (attributes === undefined) {
      return span.attributes.length === 0 ? (authored?.children ?? []) : emitted;
    }

    const control = yield* applyPart(
      rows.control,
      attributes.control,
      [],
      placing.replacement("control"),
    );

    return [
      yield* applyPart(
        rows.choice,
        { ...authored?.attrs, ...attributes.choice },
        [control, ...(authored?.children ?? []).map(labelAsSpan)],
        placing.replacement("choice"),
      ),
    ];
  });

/**
 * Render a Hot Text: a `qti-hottext-interaction` Root holding the Prompt, when there is one, then
 * the Content, the author's block content with each selectable hottext a Choice around its Control
 * and each hidden one its content alone.
 *
 * Each part goes through `applyPart` with its replacement from `state.parts`, so every swap holds
 * I1 to I4. The Prompt's and the content's nodes go through {@link emitNodes}, as the body's do, so
 * they get the body's id scoping, heading shift, URLs and Notices.
 *
 * @param interaction The Hot Text's payload.
 * @param payload The payload of the whole render, which gives the instance, the mode and the
 *   messages.
 * @param state The locale, the heading level and the resolved part overrides.
 * @returns The Hot Text Root, or the refusal of a part swap.
 * @throws {NestedInteractionDefect} When the Prompt or the content holds an interaction, which
 *   QTI's schema admits nowhere there ({@link nestedInteraction}).
 */
const render = (
  interaction: HottextPayload,
  payload: Payload,
  state: EmitState,
): Result.Result<Element, PartSwapRefused> =>
  Result.gen(function* hottextRoot() {
    const props = connect(interaction, payload, state.locale);
    const placing: Placing = {
      connected: new Map(
        selectablesIn(interaction.content).map(({ element: selectable }, index) => [
          selectable,
          { choice: props.choice[index] ?? {}, control: props.control[index] ?? {} },
        ]),
      ),
      payload,
      replacement: (part) => replacementOf(state, part),
      state,
    };
    const prompt = yield* Result.transposeOption(
      interaction.prompt.pipe(
        Option.map((nodes) =>
          Result.flatMap(emitNodes(nodes, payload, state, nestedInteraction(owner)), (emitted) =>
            applyPart(rows.prompt, props.prompt, emitted, placing.replacement("prompt")),
          ),
        ),
      ),
    );
    const content = yield* Result.flatMap(
      emitNodes(
        interaction.content,
        payload,
        state,
        nestedInteraction(
          owner,
          ownedBy((hottext) => placeHottext(hottext, placing)),
        ),
      ),
      (emitted) => applyPart(rows.content, props.content, emitted, placing.replacement("content")),
    );

    return yield* applyPart(
      rows.root,
      props.root,
      [...Option.toArray(prompt), content],
      placing.replacement("root"),
    );
  });

/**
 * Check a Hot Text's response, which the caller decoded, in two tiers, as Choice's is.
 *
 * The caller decodes the posted entries with `decode`, under the entry name its form gave the
 * Controls and the Hot Text's binding (identifiers of its cardinality), and passes the value, or
 * the {@link Malformed} `decode` gave. So the entry name stays the caller's, while the messages and
 * the author's overrides stay here.
 *
 * - A {@link Malformed} input: `atMost` 1 when a single response was posted more than once, else
 *   `unknownChoice`.
 * - Tier (a), always: every identifier names a hottext the page presented, which a hottext its
 *   template hides is not, and none repeats (`unknownChoice`); `max-choices` above 0 caps the count
 *   (D5; `atMost`).
 * - Tier (b), only under `validateResponses`: `min-choices` (`atLeast`).
 *
 * The author's `data-max-selections-message` and `data-min-selections-message` replace the
 * renderer's text for `atMost` and `atLeast`.
 *
 * @param interaction The Hot Text, as the redaction under the record shows it, so its content
 *   holds the marker of each hottext presented.
 * @param input The decoded value, or why the entries did not decode.
 * @param configuration The configuration, which gives the locale and `validateResponses`.
 * @returns One message per problem, none when the response is accepted.
 */
const validate = (
  interaction: HottextInteraction,
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
  const unknown = say(message(locale, "unknownChoice"));

  if (input instanceof Malformed) {
    return [input.reason === "single-many" ? tooMany(1n) : unknown];
  }

  const presented = new Set(selectableIn(interaction.content));
  const chosen = input.values.map(format);
  const stray = chosen.some((identifier) => !presented.has(identifier));
  const repeated = new Set(chosen).size < chosen.length;

  return [
    ...(stray || repeated ? [unknown] : []),
    ...(interaction.maxChoices > 0n && BigInt(chosen.length) > interaction.maxChoices
      ? [tooMany(interaction.maxChoices)]
      : []),
    ...(configuration.validateResponses && BigInt(chosen.length) < interaction.minChoices
      ? [tooFew(interaction.minChoices)]
      : []),
  ];
};

/**
 * Copy the Hot Text's model node into its payload node: its Prompt and content through the kit, and
 * what it shows of the view, baked in since the render sees the `Payload` and none of the view
 * beyond it.
 *
 * `restore` holds the strings posted when the view has messages, else the view's identifiers; the
 * module's own `restore` and `solution` steps handed the values over unchanged.
 *
 * @param interaction The Hot Text's model node.
 * @param kit The payload's copy of body nodes and the view's facts about the interaction.
 * @returns Its payload node.
 */
const redact = (interaction: HottextInteraction, kit: RedactKit): HottextPayload => ({
  ariaLabel: interaction.ariaLabel,
  ariaLabelledby: interaction.ariaLabelledby,
  autofocus: kit.autofocus,
  class: interaction.class,
  content: kit.nodes(interaction.content),
  formName: kit.formName(interaction.response),
  prompt: interaction.prompt.pipe(Option.map((nodes) => kit.nodes(nodes))),
  response: interaction.response,
  restore: Option.getOrElse(kit.posted(interaction.response), () =>
    kit.shown(interaction.response).map(format),
  ),
  type:
    interaction.maxChoices === 1n || interaction.cardinality === "single" ? "radio" : "checkbox",
});

/**
 * Give the regions of the Hot Text's own content, in document order: its Prompt, then its content.
 * A hottext's content sits inside the content region, so no region of its own names a choice.
 *
 * @param interaction The Hot Text's model node.
 * @returns The regions.
 */
const regions = (interaction: HottextInteraction): readonly OwnRegion[] => [
  ...Option.match(interaction.prompt, {
    onNone: (): readonly OwnRegion[] => [],
    onSome: (nodes): readonly OwnRegion[] => [
      { choice: Option.none(), nodes, part: "prompt", written: "nodes" },
    ],
  }),
  { choice: Option.none(), nodes: interaction.content, part: "content", written: "nodes" },
];

/**
 * The type of {@link hottextModule}.
 */
type HottextModule = InteractionModule<
  "hottext",
  HottextInteraction,
  HottextPayload,
  HottextPart,
  HottextJson
>;

/**
 * The Hot Text module (Q-11): the interaction module of the kind `hottext`, which reads, renders,
 * binds and validates `qti-hottext-interaction`.
 */
export const hottextModule: HottextModule = {
  /**
   * The one response Hot Text binds, of identifiers, posted by their form text.
   */
  bindings: (interaction) => [{ base: Option.none(), response: interaction.response }],
  /**
   * Hot Text's connect function ({@link connect}).
   */
  connect: (interaction, payload, locale) => ({ ...connect(interaction, payload, locale) }),
  /**
   * The Prompt's nodes, then the content's, as the render writes them.
   */
  content: (interaction) => [
    ...Option.getOrElse(interaction.prompt, () => []),
    ...interaction.content,
  ],
  /**
   * One Control for each selectable hottext.
   */
  controls: (interaction) => selectableIn(interaction.content).length,
  element,
  feature,
  /**
   * True: the module reads, renders, binds and validates `qti-hottext-interaction`.
   */
  implemented: true,
  kind: "hottext",
  /**
   * The NULL of the identifier binding, of the response's cardinality.
   */
  nullValue: (interaction) => nullOf("identifier", interaction.cardinality),
  owner,
  /**
   * Read a `qti-hottext-interaction` through the kit: its binding, `max-choices` and
   * `min-choices`, the author's messages, its Prompt, and its content with `qti-hottext` let
   * through as the module's own element, each hottext then marked ({@link withMarkers}).
   *
   * The interaction is the notice `cardinality="…"` or `base-type="…"`, as for any interaction
   * plate renders, when its response is not an identifier of single or multiple cardinality, and
   * the refusal `undeclared-response` when it names no declared response. Reading 38 gives the
   * module the hottexts of its own content alone: a hottext outside it is read by the body walk as
   * the notice `qti-hottext`.
   */
  parse: (source, { notice, path, read }) =>
    Result.gen(function* readHottext() {
      const written = yield* read.requiredAttribute(source, "response-identifier");
      const { bound } = read;
      if (Option.isNone(bound)) {
        return yield* Result.fail(
          read.refusal("undeclared-response", attributePath(path, written), {
            response: read.identifierOf(written.value),
          }),
        );
      }

      const declaration = bound.value;
      const cardinality = bindable(declaration.cardinality);
      if (Option.isNone(cardinality)) {
        return yield* notice(
          `cardinality="${Option.getOrElse(read.valueOf(declaration.element, "cardinality"), () => "")}"`,
        );
      }

      if (!Option.contains(declaration.baseType, "identifier")) {
        return yield* notice(
          `base-type="${Option.getOrElse(read.valueOf(declaration.element, "base-type"), () => "")}"`,
        );
      }

      read.markElement(source);

      const maxChoices = yield* read.countAttribute(source, "max-choices");
      const minChoices = yield* read.countAttribute(source, "min-choices");
      const prompt = yield* read.content(source, "qti-prompt");
      const [firstPrompt] = read.childrenNamed(source, "qti-prompt");
      const content = yield* read.nodes(source, {
        children: source.children.filter((child) => child !== firstPrompt),
        own: [hottextTag],
      });

      return {
        ariaLabel: read.valueOf(source, "aria-label"),
        ariaLabelledby: read.valueOf(source, "aria-labelledby"),
        cardinality: cardinality.value,
        class: Option.getOrElse(read.valueOf(source, "class"), () => ""),
        content: withMarkers(content, read.identifierOf),
        kind: "hottext" as const,
        maxChoices: Option.getOrElse(maxChoices, () => 1n),
        messages: {
          max: read.valueOf(source, "data-max-selections-message"),
          min: read.valueOf(source, "data-min-selections-message"),
        },
        minChoices: Option.getOrElse(minChoices, () => 0n),
        path,
        prompt,
        response: read.identifierOf(written.value),
      };
    }),
  parts,
  /**
   * The Hot Text node's JSON form, which a redacted body holds in place of the model node: counts
   * as decimal digits, each `Option` an optional key, and no path.
   */
  payloadSchema: ({ BodyNodes, ChoiceCount, NoPath, OptionalText, Schema }) =>
    Schema.Struct({
      ariaLabel: OptionalText,
      ariaLabelledby: OptionalText,
      cardinality: Schema.Literals(["multiple", "single"]),
      class: Schema.String,
      content: BodyNodes,
      kind: Schema.Literal("hottext"),
      maxChoices: ChoiceCount,
      messages: Schema.Struct({ max: OptionalText, min: OptionalText }),
      minChoices: ChoiceCount,
      path: NoPath,
      prompt: Schema.OptionFromOptionalKey(BodyNodes),
      response: Schema.String,
    }),
  redact,
  regions,
  render,
  /**
   * Rebuild the node with its Prompt's and its content's nodes replaced, in the order
   * {@link regions} gives them.
   */
  replaceRegions: (interaction, contents) => {
    const [first, ...rest] = contents;
    const prompted = Option.isSome(interaction.prompt);

    return {
      ...interaction,
      content: (prompted ? rest[0] : first) ?? interaction.content,
      prompt: interaction.prompt.pipe(Option.map((nodes) => first ?? nodes)),
    };
  },
  /**
   * The value Hot Text shows for a stored response: the stored identifiers themselves, each
   * checked in the Control of the hottext that names it.
   */
  restore: (_interaction, stored) => stored,
  /**
   * No order: Hot Text has no `shuffle`, its choices stand where the author put them.
   */
  sequence: () => Option.none(),
  /**
   * The value Hot Text shows for the correct response: the correct identifiers themselves.
   */
  solution: (_interaction, correct) => correct,
  /**
   * False: each Control is named by its hottext's text, as a Choice's is, so the renderer names
   * none in Q10's sense.
   */
  unnamed: () => false,
  validate,
};

/**
 * Hotspot (Q-10): a `qti-hotspot-interaction` rendered without script as its image with one
 * native checkable control per hotspot choice, each named by its `hotspot-label`; its model node,
 * its payload node, its parts, its connect and render functions, its response validation and its
 * bindings, on the module shape of Choice (`#plate/interactions/choice.ts`).
 *
 * {@link hotspotModule.render} emits this structure: a native `fieldset` Root (`role="group"`,
 * named by its Prompt through `aria-labelledby`, as an Extended Text's is), the Prompt, then the
 * Image part, a box holding the author's image (its `img`, `picture` or `object`, emitted as body
 * content) and after it the Choices part, which holds one Choice per hotspot in document order.
 * Each Choice is a `label` laid over the whole image, holding its Control (a native radio when one
 * choice can be posted, a checkbox otherwise), its Outline (an inline `svg` drawn in the image's
 * coordinate space, `aria-hidden`, whose one shape is the hotspot's area) and its Label (the
 * `hotspot-label` text, visually hidden, which names the Control through `aria-labelledby`).
 * Clicking the area activates the label and so toggles the control; the keyboard reaches the
 * control natively, in document order. The stylesheet positions nothing by coordinates: the
 * playground's pages carry a `style-src 'self'` policy (rule `723e580c`), so no part carries an
 * inline `style`, and the geometry travels only as SVG attributes, which the policy does not
 * govern. Without the stylesheet, the Choices read as a plain list of labelled controls below the
 * image.
 *
 * The readings that bind this module, by their wording:
 *
 * - "A default hotspot is the last hotspot choice of its interaction, and a graphic gap match
 *   interaction has none." The structure check refuses a default hotspot that is not last; the
 *   render draws it as the last Choice, a rectangle over the whole image that takes no pointer
 *   event ({@link wholeImage}), so an area listed before it hides it where they overlap.
 * - "An area's `coords` that do not fit its shape are read as the HTML Standard's image-map
 *   processing reads an `area`'s." An area with fewer coordinates than its shape needs holds no
 *   point ({@link areaHolds}), so its Choice renders its Control and Label with no Outline;
 *   coordinates beyond the shape's are ignored; a `rect`'s corners may come in either order.
 * - "A `default` shape carries `coords`, as every shape does, and they are a `CoordsDType`." A
 *   `default` hotspot's coordinates are read and ignored.
 *
 * A coordinate written with `%` is a percentage of the image: it is scaled by the image's `width`
 * or `height` when the author gave both, and when they gave neither the area draws no Outline, a
 * stated limit. The strings this module adds, the positional name of a hotspot with no
 * `hotspot-label`, are English and live here (D7).
 *
 * The runtime polish, pointer hit-testing inside a non-rectangular area and announcements, is
 * issue m3d-08, not this module's.
 *
 * @module
 */
/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shape` is the QTI attribute of `qti-hotspot-choice` and names an area's geometry, not a structure. */
import { Option, Result, pipe } from "effect";
import type { Configuration } from "#plate/configuration.ts";
import type { SourceElement } from "#plate/document/source.ts";
import { emitNodes, nestedInteraction } from "#plate/emit/body.ts";
import { h, text, when } from "#plate/emit/node.ts";
import type { Attributes, Element, Node } from "#plate/emit/node.ts";
import { authoredIdrefs, scopedId } from "#plate/emit/parts.ts";
import type { PartRow } from "#plate/emit/parts.ts";
import { applyPart } from "#plate/emit/swap.ts";
import type { PartSwapRefused } from "#plate/emit/swap.ts";
import { areaHolds } from "#plate/engine/expressions/shapes.ts";
import { Malformed } from "#plate/form/encoding.ts";
import { partRow } from "#plate/interactions/contract.ts";
import type {
  InteractionModule,
  ModuleInteraction,
  OwnRegion,
  PartSpec,
  ReaderKit,
} from "#plate/interactions/contract.ts";
import { message, numeral } from "#plate/messages.ts";
import type { BodyNode, TemplateVisibility } from "#plate/model/item.ts";
import { format, nullOf, trimXmlSpace } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";
import type { EmitState, Payload, PayloadNode, ValidationMessage } from "#plate/payload.ts";
import type { Refusal } from "#plate/validate/refusal.ts";
import type { AreaShape } from "#plate/vocabulary.ts";

/**
 * The owner of every Hotspot part in the part table.
 */
const owner = "hotspot-interaction";

/**
 * Hotspot's identifier in the QTI 3.0 conformance list, Appendix A.
 */
const feature = "Q-10";

/**
 * The QTI element Hotspot is read from, which its notice names.
 */
const element = "qti-hotspot-interaction";

/**
 * The values of a hotspot's `shape` attribute, as the XSD enumerates them.
 */
const geometries = [
  "circle",
  "default",
  "ellipse",
  "poly",
  "rect",
] as const satisfies readonly AreaShape[];

/**
 * The values of `show-hide`, as the XSD enumerates them.
 */
const showHides = ["hide", "show"] as const;

/**
 * The elements that carry a Hotspot's image, in the QTI namespace: `img`, `picture`, or the
 * deprecated `object`.
 */
const imageElements = ["img", "picture", "object"] as const;

/**
 * One coordinate of a hotspot's `coords`, as written: its number, and whether it was written with
 * `%`, a percentage of the image.
 */
export interface Coordinate {
  readonly percent: boolean;
  readonly value: number;
}

/**
 * The image's `width` and `height`, when the author wrote both as positive integers: the
 * coordinate space the areas are drawn in.
 */
export interface ImageSize {
  readonly height: number;
  readonly width: number;
}

/**
 * One `qti-hotspot-choice` of a Hotspot (Q-10): its identifier, its shape and coordinates as
 * written, its `hotspot-label`, and its template visibility, none when it has no
 * `template-identifier`.
 */
export interface HotspotChoice {
  readonly coords: readonly Coordinate[];
  readonly identifier: string;
  /**
   * `hotspot-label`, the area's alternative text, treated as an `img`'s `alt`.
   */
  readonly label: Option.Option<string>;
  readonly shape: AreaShape;
  readonly templateVisibility: Option.Option<TemplateVisibility>;
}

/**
 * The messages the author wrote in place of plate's own: `data-max-selections-message` and
 * `data-min-selections-message`.
 */
export interface AuthorMessages {
  readonly max: Option.Option<string>;
  readonly min: Option.Option<string>;
}

/**
 * The model node of a Hotspot (Q-10), the kind `hotspot`: the fields every module's node shares,
 * its binding's cardinality, its choices in document order, its `class`, its image as body nodes,
 * `max-choices` and `min-choices` (reading 46's counts), the author's messages, its Prompt, and
 * the image's size when the author wrote one.
 */
export interface HotspotInteraction extends ModuleInteraction<"hotspot"> {
  readonly cardinality: "multiple" | "single";
  readonly choices: readonly HotspotChoice[];
  /**
   * The author's `class` value, empty when absent.
   */
  readonly class: string;
  /**
   * The image element and its subtree, read as body content, so the emitter resolves its URL and
   * keeps its `alt`.
   */
  readonly image: readonly BodyNode[];
  /**
   * `max-choices`, 1 when absent; 0 is no limit.
   */
  readonly maxChoices: bigint;
  readonly messages: AuthorMessages;
  /**
   * `min-choices`, 0 when absent.
   */
  readonly minChoices: bigint;
  readonly prompt: Option.Option<readonly BodyNode[]>;
  readonly size: Option.Option<ImageSize>;
}

/**
 * One hotspot as the page may know it: its identifier, label, shape and coordinates; no template
 * visibility, which `redact` settles.
 */
export type HotspotChoicePayload = Omit<HotspotChoice, "templateVisibility">;

/**
 * The payload node of a Hotspot (Q-10), the kind `hotspot`: what its render reads of the model
 * node and of the view, through the kit the payload hands `redact`.
 */
export interface HotspotPayload {
  readonly ariaLabel: Option.Option<string>;
  /**
   * The author's `aria-labelledby`, as written; the render scopes its ids by the instance.
   */
  readonly ariaLabelledby: Option.Option<string>;
  readonly autofocus: boolean;
  readonly cardinality: "multiple" | "single";
  readonly choices: readonly HotspotChoicePayload[];
  readonly class: string;
  /**
   * The name its Controls post under: the view's name for the response, else
   * `entryName(instance, response)`.
   */
  readonly formName: string;
  readonly image: readonly PayloadNode[];
  readonly maxChoices: bigint;
  readonly prompt: Option.Option<readonly PayloadNode[]>;
  readonly response: string;
  /**
   * The identifiers the Controls show as checked: the strings posted when the view has messages,
   * else the view's value.
   */
  readonly restore: readonly string[];
  readonly size: Option.Option<ImageSize>;
}

/**
 * The JSON form of {@link HotspotInteraction} in a redacted body, as `payloadSchema` encodes it:
 * the counts as decimal digits, the options as optional keys, no path and no template visibility.
 */
export interface HotspotJson {
  readonly ariaLabel?: string;
  readonly ariaLabelledby?: string;
  readonly cardinality: "multiple" | "single";
  readonly choices: readonly {
    readonly coords: readonly Coordinate[];
    readonly identifier: string;
    readonly label?: string;
    readonly shape: AreaShape;
  }[];
  readonly class: string;
  readonly image: readonly unknown[];
  readonly kind: "hotspot";
  readonly maxChoices: string;
  readonly messages: { readonly max?: string; readonly min?: string };
  readonly minChoices: string;
  readonly prompt?: readonly unknown[];
  readonly response: string;
  readonly size?: ImageSize;
}

/**
 * The Hotspot parts: the Root, the Prompt, the Image (the box the controls lie over), the Choices
 * (the group of controls, after the image in the DOM), one Choice per hotspot (the `label` laid
 * over the image, holding the control, the outline and the label text), the Control (the native
 * `input`), the Label (the `hotspot-label` text or the positional name) and the Outline (the
 * drawn area, an inline `svg`, `aria-hidden`).
 */
export type HotspotPart =
  | "choice"
  | "choices"
  | "control"
  | "image"
  | "label"
  | "outline"
  | "prompt"
  | "root";

/**
 * The row each Hotspot part gives `partRow`, before the owner, the key and the marker are added.
 */
const parts = {
  choice: {
    defaults: {},
    element: "label",
    listOwner: false,
    merged: ["for"],
    tagClass: "any",
  },
  choices: {
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
    merged: ["id", "name", "type", "value", "checked", "disabled", "aria-labelledby", "autofocus"],
    tagClass: "native-input",
  },
  image: {
    defaults: {},
    element: "div",
    listOwner: false,
    merged: [],
    tagClass: "flow-container",
  },
  label: {
    defaults: {},
    element: "span",
    listOwner: false,
    merged: ["id"],
    tagClass: "phrasing-container",
  },
  outline: {
    defaults: {},
    element: "svg",
    listOwner: false,
    merged: ["aria-hidden", "viewBox"],
    tagClass: "any",
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
    element: "fieldset",
    listOwner: false,
    merged: ["role", "aria-labelledby", "aria-label", "class"],
    tagClass: "fieldset",
  },
} as const satisfies { readonly [Q in HotspotPart]: PartSpec };

/**
 * The module's owner and parts, as `partRow` takes them.
 */
const table = { owner, parts } as const;

/**
 * The row of every Hotspot part, which no placement changes: the Root is a `fieldset` the Prompt
 * names through `aria-labelledby`, as an Extended Text's Prompt names its group, so a Prompt of
 * any content takes one markup.
 */
const rows = {
  choice: partRow(table, "choice"),
  choices: partRow(table, "choices"),
  control: partRow(table, "control"),
  image: partRow(table, "image"),
  label: partRow(table, "label"),
  outline: partRow(table, "outline"),
  prompt: partRow(table, "prompt"),
  root: partRow(table, "root"),
} satisfies { readonly [Q in HotspotPart]: PartRow };

/**
 * Name a hotspot with no `hotspot-label` by its position among the hotspots presented, in
 * English: "Area 2 of 4" (1.1.1 Non-text Content; D7).
 *
 * @param n The hotspot's position, from 1.
 * @param count How many hotspots are presented.
 * @returns The name.
 */
const positionalName = (n: number, count: number): string => `Area ${n} of ${count}`;

/**
 * Give the names the author wrote for the group, as `authorsName` in `#plate/interactions/name.ts`
 * gives them (that module reaches the table of modules, which this module cannot import without a
 * cycle): `aria-label` as written unless blank, and `aria-labelledby` with each id scoped by the
 * instance, none when it names no id.
 *
 * @param interaction The Hotspot's payload.
 * @param instance The item instance key.
 * @returns The attributes the author gave, none when they gave neither.
 */
const authorsName = (interaction: HotspotPayload, instance: string): Attributes => ({
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
 * Read a hotspot's coordinates as numbers in the image's coordinate space: a percentage scaled by
 * the image's width (an x coordinate, a `circle`'s radius or an `ellipse`'s horizontal radius) or
 * its height (a y coordinate or a vertical radius); none when a percentage appears and the image's
 * size is unknown, the stated limit.
 *
 * @param choice The hotspot.
 * @param size The image's size, when known.
 * @returns The coordinates as numbers, or none.
 */
const numbersOf = (
  choice: HotspotChoicePayload,
  size: Option.Option<ImageSize>,
): Option.Option<readonly number[]> => {
  if (choice.coords.every((coordinate) => !coordinate.percent)) {
    return Option.some(choice.coords.map((coordinate) => coordinate.value));
  }

  return size.pipe(
    Option.map(({ height, width }) =>
      choice.coords.map((coordinate, index) => {
        if (!coordinate.percent) {
          return coordinate.value;
        }

        // An ellipse's vertical radius is its fourth coordinate; every other even index is an x
        // coordinate, a circle's radius included, and every odd index a y coordinate.
        const alongHeight = index % 2 === 1 || (choice.shape === "ellipse" && index === 3);

        return (coordinate.value / 100) * (alongHeight ? height : width);
      }),
    ),
  );
};

/**
 * The presentation attribute every drawn shape carries: it takes pointer events where its Choice,
 * its Outline and every other box over the image take none, so a click on the area, and only
 * there, reaches the label. A presentation attribute is not a `style` attribute, so the
 * playground's policy admits it.
 */
const hit = { "pointer-events": "visiblePainted" } as const;

/**
 * The rectangle over the whole image, the `default` hotspot's area. It is drawn last and so lies
 * over every other area, and the stylesheet, which keys on part markers alone, has no rule to lay
 * it under them; so it takes no pointer event and no fill, by its own presentation attributes: the
 * areas before it stay clickable where they overlap it, as "the one listed first hides the later
 * ones", and the default hotspot is reached by its Control, in the tab order, until issue m3d-08
 * hit-tests the pointer. Its stroke still shows its state.
 *
 * @returns The SVG element.
 */
const wholeImage = (): Element =>
  h("rect", {
    "data-shape": "default",
    fill: "none",
    height: "100%",
    "pointer-events": "none",
    width: "100%",
    x: "0",
    y: "0",
  });

/**
 * Report whether an area of a geometry holds any point at all, by testing the point its
 * coordinates name: a `rect`'s first corner, a `circle`'s or `ellipse`'s centre, a `poly`'s first
 * vertex. Each lies in its area whenever the coordinates fit the geometry, so the test fails
 * exactly for an area HTML reads as holding no point.
 *
 * @param geometry The hotspot's `shape` attribute.
 * @param coords Its coordinates, as numbers.
 * @returns Whether the area holds a point.
 */
const holdsAnyPoint = (geometry: AreaShape, coords: readonly number[]): boolean => {
  const [x = 0, y = 0] = coords;

  return areaHolds[geometry](coords, x, y);
};

/**
 * Draw an area whose coordinates fit its geometry, in the image's coordinate space: a `rect` from
 * its corners in either order, a `circle`, an `ellipse`, or a `polygon` from its vertex pairs, an
 * odd last coordinate ignored, as coordinates beyond a geometry's are.
 *
 * @param geometry The hotspot's `shape` attribute, not `default`.
 * @param coords Its coordinates, as numbers, which fit the geometry.
 * @returns The SVG element.
 */
const drawn = (geometry: Exclude<AreaShape, "default">, coords: readonly number[]): Element => {
  switch (geometry) {
    case "rect": {
      const [left = 0, top = 0, right = 0, bottom = 0] = coords;

      return h("rect", {
        ...hit,
        "data-shape": "rect",
        height: String(Math.abs(bottom - top)),
        width: String(Math.abs(right - left)),
        x: String(Math.min(left, right)),
        y: String(Math.min(top, bottom)),
      });
    }
    case "circle": {
      const [cx = 0, cy = 0, r = 0] = coords;

      return h("circle", {
        ...hit,
        cx: String(cx),
        cy: String(cy),
        "data-shape": "circle",
        r: String(r),
      });
    }
    case "ellipse": {
      const [cx = 0, cy = 0, rx = 0, ry = 0] = coords;

      return h("ellipse", {
        ...hit,
        cx: String(cx),
        cy: String(cy),
        "data-shape": "ellipse",
        rx: String(rx),
        ry: String(ry),
      });
    }
    case "poly": {
      const points: string[] = [];
      for (let index = 0; index + 1 < coords.length; index += 2) {
        points.push(`${String(coords[index] ?? 0)},${String(coords[index + 1] ?? 0)}`);
      }

      return h("polygon", { ...hit, "data-shape": "poly", points: points.join(" ") });
    }
    default: {
      return geometry satisfies never;
    }
  }
};

/**
 * Give the one SVG element that draws a hotspot's area: for `default` the rectangle over the whole
 * image ({@link wholeImage}), its coordinates read and ignored; for every other geometry the area
 * {@link drawn} from its coordinates, or none for an area that holds no point ({@link areaHolds}),
 * which is how HTML's image-map processing reads an `area` with too few coordinates or a radius of
 * zero or less.
 *
 * @param choice The hotspot.
 * @param size The image's size, when known.
 * @returns The element, or none.
 */
const outlineOf = (
  choice: HotspotChoicePayload,
  size: Option.Option<ImageSize>,
): Option.Option<Element> => {
  const geometry = choice.shape;
  if (geometry === "default") {
    return Option.some(wholeImage());
  }

  return numbersOf(choice, size).pipe(
    Option.filter((coords) => holdsAnyPoint(geometry, coords)),
    Option.map((coords) => drawn(geometry, coords)),
  );
};

/**
 * The attributes the connect function computes for one hotspot's parts, with its outline when it
 * draws one and its label's text.
 */
interface ChoiceItem {
  readonly choice: Attributes;
  readonly control: Attributes;
  readonly label: Attributes;
  readonly outline: Option.Option<{ readonly figure: Element; readonly props: Attributes }>;
  readonly text: string;
}

/**
 * The attributes of every part of one Hotspot, computed once by {@link connect}.
 */
interface Connected {
  readonly choices: Attributes;
  readonly image: Attributes;
  readonly items: readonly ChoiceItem[];
  readonly prompt: Attributes;
  readonly root: Attributes;
}

/**
 * Compute every attribute of every part of one Hotspot: the connect function.
 *
 * - Root: the marker, `role="group"`, `data-mode`, `data-disabled` when finished, the author's
 *   `class`, and the group's name: the Prompt names it (`aria-labelledby` → the Prompt's id), else
 *   the author's `aria-label` and `aria-labelledby`.
 * - Prompt: the marker and its id.
 * - Image, Choices: the marker.
 * - Choice: the marker and `for` → its Control.
 * - Control: a radio when one choice can be posted (`max-choices` 1, or a single response), else a
 *   checkbox; its id, the payload's `formName`, its value; `checked` from the restore; `disabled`
 *   when finished or not answering; `aria-labelledby` → its Label; `autofocus` on the first when
 *   the payload says.
 * - Label: the marker and its id; its text is the `hotspot-label`, or the positional name.
 * - Outline: the marker, `aria-hidden`, and the image's `viewBox` when its size is known.
 *
 * @param interaction The Hotspot's payload.
 * @param payload The payload, which gives the instance, the mode and `finished`.
 * @returns The attributes of every part.
 */
const connect = (interaction: HotspotPayload, payload: Payload): Connected => {
  const { instance } = payload;
  const promptId = scopedId(instance, interaction.response, "prompt");
  const prompted = Option.isSome(interaction.prompt);
  const type =
    interaction.maxChoices === 1n || interaction.cardinality === "single" ? "radio" : "checkbox";
  const disabled = payload.finished || payload.mode !== "answering";
  const viewBox = Option.match(interaction.size, {
    onNone: () => ({}),
    onSome: ({ height, width }) => ({ viewBox: `0 0 ${String(width)} ${String(height)}` }),
  });

  return {
    choices: { "data-slot": rows.choices.slot },
    image: { "data-slot": rows.image.slot },
    items: interaction.choices.map((choice, index) => {
      const controlId = scopedId(instance, interaction.response, "control", index);
      const labelId = scopedId(instance, interaction.response, "label", index);

      return {
        choice: { "data-slot": rows.choice.slot, for: controlId },
        control: {
          "aria-labelledby": labelId,
          ...when(interaction.autofocus && index === 0, { autofocus: true }),
          ...when(interaction.restore.includes(choice.identifier), { checked: true }),
          "data-slot": rows.control.slot,
          ...when(disabled, { disabled: true }),
          id: controlId,
          name: interaction.formName,
          type,
          value: choice.identifier,
        },
        label: { "data-slot": rows.label.slot, id: labelId },
        outline: outlineOf(choice, interaction.size).pipe(
          Option.map((figure) => ({
            figure,
            props: { "aria-hidden": "true", "data-slot": rows.outline.slot, ...viewBox },
          })),
        ),
        text: Option.getOrElse(choice.label, () =>
          positionalName(index + 1, interaction.choices.length),
        ),
      };
    }),
    prompt: { "data-slot": rows.prompt.slot, id: promptId },
    root: {
      ...(prompted ? { "aria-labelledby": promptId } : authorsName(interaction, instance)),
      ...when(interaction.class !== "", { class: interaction.class }),
      ...when(payload.finished, { "data-disabled": true }),
      "data-mode": payload.mode,
      "data-slot": rows.root.slot,
      role: "group",
    },
  };
};

/**
 * Render a Hotspot: a `fieldset` Root holding the Prompt, when there is one, then the Image part
 * holding the author's image and the Choices, one Choice per hotspot, each a `label` holding its
 * Control, its Outline when it draws one, and its Label text.
 *
 * Each part goes through `applyPart` with its replacement from `state.parts`. The Prompt's and the
 * image's content go through {@link emitNodes}, as the body's do, so the image's URL resolves
 * against the asset base.
 *
 * @param interaction The Hotspot's payload.
 * @param payload The payload of the whole render.
 * @param state The locale, the heading level and the resolved part overrides.
 * @returns The Hotspot Root, or {@link PartSwapRefused} when a replacement breaks the swap
 *   invariant.
 */
const render = (
  interaction: HotspotPayload,
  payload: Payload,
  state: EmitState,
): Result.Result<Element, PartSwapRefused> => {
  const emitContent = (
    nodes: readonly PayloadNode[],
  ): Result.Result<readonly Node[], PartSwapRefused> =>
    emitNodes(nodes, payload, state, nestedInteraction(owner));
  const replacement = (part: HotspotPart) =>
    Option.getOrUndefined(state.parts.replacementFor(owner, part));

  return Result.gen(function* hotspotRoot() {
    const promptContent = yield* Result.transposeOption(
      interaction.prompt.pipe(Option.map(emitContent)),
    );
    const props = connect(interaction, payload);
    const image = yield* emitContent(interaction.image);

    const choices = yield* pipe(
      props.items.map((item) =>
        Result.gen(function* choiceItem() {
          const control = yield* applyPart(rows.control, item.control, [], replacement("control"));
          const outline = yield* Result.transposeOption(
            item.outline.pipe(
              Option.map((figure) =>
                applyPart(rows.outline, figure.props, [figure.figure], replacement("outline")),
              ),
            ),
          );
          const label = yield* applyPart(
            rows.label,
            item.label,
            [text(item.text)],
            replacement("label"),
          );

          return yield* applyPart(
            rows.choice,
            item.choice,
            [control, ...Option.toArray(outline), label],
            replacement("choice"),
          );
        }),
      ),
      Result.all,
    );
    const group = yield* applyPart(rows.choices, props.choices, choices, replacement("choices"));
    const box = yield* applyPart(rows.image, props.image, [...image, group], replacement("image"));
    const prompt = yield* Result.transposeOption(
      promptContent.pipe(
        Option.map((content) =>
          applyPart(rows.prompt, props.prompt, content, replacement("prompt")),
        ),
      ),
    );

    return yield* applyPart(
      rows.root,
      props.root,
      [...Option.toArray(prompt), box],
      replacement("root"),
    );
  });
};

/**
 * Check a Hotspot's response, which the caller decoded, in two tiers, as Choice checks its own.
 *
 * - A {@link Malformed} input: `atMost` 1 when a single response was posted more than once, else
 *   `unknownChoice`.
 * - Tier (a), always: every identifier names a presented hotspot and none repeats (`unknownChoice`),
 *   and `max-choices` above 0 caps the count (`atMost`).
 * - Tier (b), only under `validateResponses`: `min-choices` (`atLeast`).
 *
 * The author's `data-max-selections-message` and `data-min-selections-message` replace the
 * renderer's text for `atMost` and `atLeast`.
 *
 * @param interaction The Hotspot.
 * @param input The decoded value, or why the entries did not decode.
 * @param configuration The configuration, which gives the locale and `validateResponses`.
 * @returns One message per problem, none when the response is accepted.
 */
const validate = (
  interaction: HotspotInteraction,
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

  const presented = new Set(interaction.choices.map((choice) => choice.identifier));
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
 * Read the image's `width` and `height` as positive integers, none unless both are written so.
 *
 * @param read The kit's attribute readers.
 * @param image The image element: a `picture`'s size is its `img` child's.
 * @returns The size, or none.
 */
const sizeOf = (read: ReaderKit, image: SourceElement): Option.Option<ImageSize> => {
  const sized = read.isQti(image, "picture")
    ? Option.fromUndefinedOr(read.childrenNamed(image, "img")[0])
    : Option.some(image);
  const dimension = (name: string): Option.Option<number> =>
    sized.pipe(
      Option.flatMap((carrier) => read.valueOf(carrier, name)),
      Option.filter((written) => /^[0-9]+$/u.test(written.trim())),
      Option.map((written) => Number(written.trim())),
      Option.filter((value) => value > 0),
    );

  return Option.all({ height: dimension("height"), width: dimension("width") });
};

/**
 * Read one `qti-hotspot-choice` through the kit.
 *
 * @param read The kit.
 * @param choice The hotspot.
 * @returns The hotspot, or a refusal.
 */
const choiceOf = (read: ReaderKit, choice: SourceElement): Result.Result<HotspotChoice, Refusal> =>
  Result.gen(function* readChoice() {
    read.markElement(choice);

    const identifier = yield* read.identifierAttribute(choice, "identifier");
    const geometryAttribute = yield* read.requiredAttribute(choice, "shape");
    const geometry = yield* read.listed(choice, "shape", geometryAttribute, geometries);
    const coords = yield* read.coordsOf(choice);
    const templateVisibility = yield* Result.transposeOption(
      read.valueOf(choice, "template-identifier").pipe(
        Option.map((written) =>
          read.enumerated(choice, "show-hide", showHides).pipe(
            Result.map((showHide) => ({
              showHide: Option.getOrElse(showHide, () => "show" as const),
              templateIdentifier: read.identifierOf(written),
            })),
          ),
        ),
      ),
    );

    return {
      coords: coords.map(([value, percent]) => ({ percent, value })),
      identifier,
      label: read.valueOf(choice, "hotspot-label"),
      shape: geometry,
      templateVisibility,
    };
  });

/**
 * The regions of a hotspot's template visibility: one template inline per hotspot that carries a
 * `template-identifier`, holding the hotspot's identifier as its one text, so the payload's
 * redaction decides the hotspot's visibility with its template values as it decides a template
 * inline's, and {@link hotspotModule.replaceRegions} reads the decision: the text kept means
 * shown, nothing or a notice in its place means hidden or withheld, and the inline itself, as a
 * walk that keeps regions as they are hands it back, means undecided.
 *
 * @param interaction The Hotspot.
 * @returns One region per hotspot with a template visibility, in document order.
 */
const visibilityRegions = (interaction: HotspotInteraction): readonly OwnRegion[] =>
  interaction.choices.flatMap((choice) =>
    Option.match(choice.templateVisibility, {
      onNone: () => [],
      onSome: (templateVisibility): readonly OwnRegion[] => [
        {
          choice: Option.some(choice.identifier),
          nodes: [
            {
              content: [{ kind: "text", text: choice.identifier }],
              identifier: choice.identifier,
              kind: "template-inline",
              path: interaction.path,
              responses: [],
              templateVisibility,
            },
          ],
          part: "choice",
          written: "text",
        },
      ],
    }),
  );

/**
 * Decide a hotspot's visibility from what a walk gave back for its region
 * ({@link visibilityRegions}): the hotspot as it was when the walk kept the inline, the hotspot
 * with its visibility settled when the walk kept the inline's text, and nothing when the walk
 * dropped it or put a notice in its place.
 *
 * @param choice The hotspot.
 * @param nodes What the walk gave back for its region.
 * @returns The hotspot the rebuilt node holds, if any.
 */
const decided = (choice: HotspotChoice, nodes: readonly BodyNode[]): readonly HotspotChoice[] => {
  if (nodes.some((node) => node.kind === "template-inline")) {
    return [choice];
  }

  return nodes.some((node) => node.kind === "text")
    ? [{ ...choice, templateVisibility: Option.none() }]
    : [];
};

/**
 * The Hotspot module (Q-10), the kind `hotspot`.
 */
export const hotspotModule: InteractionModule<
  "hotspot",
  HotspotInteraction,
  HotspotPayload,
  HotspotPart,
  HotspotJson
> = {
  /**
   * The one response Hotspot binds, posting identifiers, so it has no number base.
   */
  bindings: (interaction) => [{ base: Option.none(), response: interaction.response }],
  /**
   * The connect function, by part key: the Root, the Prompt, the Image, the Choices, and each
   * hotspot's Choice, Control, Label and Outline, in document order.
   */
  connect: (interaction, payload) => {
    const props = connect(interaction, payload);

    return {
      choice: props.items.map((item) => item.choice),
      choices: props.choices,
      control: props.items.map((item) => item.control),
      image: props.image,
      label: props.items.map((item) => ({ props: item.label, text: item.text })),
      outline: props.items.flatMap((item) =>
        Option.match(item.outline, { onNone: () => [], onSome: (figure) => [figure.props] }),
      ),
      prompt: props.prompt,
      root: props.root,
    };
  },
  /**
   * The content the render writes through `emitNodes`: the Prompt, then the image.
   */
  content: (interaction) => [
    ...Option.getOrElse(interaction.prompt, () => []),
    ...interaction.image,
  ],
  /**
   * One Control per hotspot.
   */
  controls: (interaction) => interaction.choices.length,
  element,
  feature,
  implemented: true,
  kind: "hotspot",
  /**
   * The NULL of an identifier response of the Hotspot's cardinality.
   */
  nullValue: (interaction) => nullOf("identifier", interaction.cardinality),
  owner,
  /**
   * Read a `qti-hotspot-interaction` through the kit: its binding (the notice `cardinality="…"` or
   * `base-type="…"` for one Hotspot does not render, as the body walk gives a Choice's), its
   * Prompt, its image (the notice `qti-hotspot-interaction` when it has none), `max-choices`,
   * `min-choices`, the author's messages, and each `qti-hotspot-choice`.
   */
  parse: (source, context) =>
    Result.gen(function* readHotspot() {
      const { read } = context;
      const response = yield* read.identifierAttribute(source, "response-identifier");
      const bound = yield* Option.match(read.bound, {
        onNone: () =>
          Result.fail(
            read.refusal("undeclared-response", `${context.path}/@response-identifier`, {
              response,
            }),
          ),
        onSome: (declaration) => Result.succeed(declaration),
      });
      const cardinality = bound.cardinality.pipe(
        Option.filter(
          (value): value is "multiple" | "single" => value === "single" || value === "multiple",
        ),
      );
      if (Option.isNone(cardinality)) {
        return yield* context.notice(
          `cardinality="${Option.getOrElse(read.valueOf(bound.element, "cardinality"), () => "")}"`,
        );
      }

      if (!Option.contains(bound.baseType, "identifier")) {
        return yield* context.notice(
          `base-type="${Option.getOrElse(read.valueOf(bound.element, "base-type"), () => "")}"`,
        );
      }

      const image = read
        .elementsOf(source)
        .find((child) => imageElements.some((local) => read.isQti(child, local)));
      if (image === undefined) {
        return yield* context.notice(element);
      }

      read.markElement(source);

      const maxChoices = yield* read.countAttribute(source, "max-choices");
      const minChoices = yield* read.countAttribute(source, "min-choices");
      const prompt = yield* read.content(source, "qti-prompt");
      const imageNodes = yield* read.nodes(source, { children: [image] });
      const choices: HotspotChoice[] = [];
      for (const choice of read.childrenNamed(source, "qti-hotspot-choice")) {
        choices.push(yield* choiceOf(read, choice));
      }

      return {
        ariaLabel: read.valueOf(source, "aria-label"),
        ariaLabelledby: read.valueOf(source, "aria-labelledby"),
        cardinality: cardinality.value,
        choices,
        class: Option.getOrElse(read.valueOf(source, "class"), () => ""),
        image: imageNodes,
        kind: "hotspot",
        maxChoices: Option.getOrElse(maxChoices, () => 1n),
        messages: {
          max: read.valueOf(source, "data-max-selections-message"),
          min: read.valueOf(source, "data-min-selections-message"),
        },
        minChoices: Option.getOrElse(minChoices, () => 0n),
        path: context.path,
        prompt,
        response,
        size: sizeOf(read, image),
      };
    }),
  parts,
  /**
   * The codec of the model node's JSON form: the counts as decimal digits, each option an
   * optional key, no path, and no template visibility, which `redact` settles.
   */
  payloadSchema: ({ BodyNodes, ChoiceCount, NoPath, OptionalText, Schema, SchemaGetter }) =>
    Schema.Struct({
      ariaLabel: OptionalText,
      ariaLabelledby: OptionalText,
      cardinality: Schema.Literals(["multiple", "single"]),
      choices: Schema.Array(
        Schema.Struct({
          coords: Schema.Array(Schema.Struct({ percent: Schema.Boolean, value: Schema.Number })),
          identifier: Schema.String,
          label: OptionalText,
          shape: Schema.Literals(geometries),
          templateVisibility: Schema.optionalKey(Schema.Never).pipe(
            Schema.decodeTo(
              Schema.Option(
                Schema.Struct({
                  showHide: Schema.Literals(showHides),
                  templateIdentifier: Schema.String,
                }),
              ),
              { decode: SchemaGetter.succeed(Option.none()), encode: SchemaGetter.omit() },
            ),
          ),
        }),
      ),
      class: Schema.String,
      image: BodyNodes,
      kind: Schema.Literal("hotspot"),
      maxChoices: ChoiceCount,
      messages: Schema.Struct({ max: OptionalText, min: OptionalText }),
      minChoices: ChoiceCount,
      path: NoPath,
      prompt: Schema.OptionFromOptionalKey(BodyNodes),
      response: Schema.String,
      size: Schema.OptionFromOptionalKey(
        Schema.Struct({ height: Schema.Number, width: Schema.Number }),
      ),
    }),
  /**
   * Copy the model node into its payload node: the Prompt and the image through the kit, each
   * hotspot without its settled visibility, and the view's facts: `autofocus`, the entry name, and
   * the identifiers to show as checked (the strings posted when the view has messages, else the
   * values shown).
   */
  redact: (interaction, kit) => ({
    ariaLabel: interaction.ariaLabel,
    ariaLabelledby: interaction.ariaLabelledby,
    autofocus: kit.autofocus,
    cardinality: interaction.cardinality,
    choices: interaction.choices.map(({ templateVisibility: _settled, ...choice }) => choice),
    class: interaction.class,
    formName: kit.formName(interaction.response),
    image: kit.nodes(interaction.image),
    maxChoices: interaction.maxChoices,
    prompt: interaction.prompt.pipe(Option.map((nodes) => kit.nodes(nodes))),
    response: interaction.response,
    restore: Option.getOrElse(kit.posted(interaction.response), () =>
      kit.shown(interaction.response).map(format),
    ),
    size: interaction.size,
  }),
  /**
   * The regions of the node's own content: its Prompt, its image, then one per hotspot with a
   * template visibility ({@link visibilityRegions}).
   */
  regions: (interaction) => [
    ...Option.match(interaction.prompt, {
      onNone: () => [],
      onSome: (nodes): readonly OwnRegion[] => [
        { choice: Option.none(), nodes, part: "prompt", written: "nodes" },
      ],
    }),
    { choice: Option.none(), nodes: interaction.image, part: "content", written: "nodes" },
    ...visibilityRegions(interaction),
  ],
  render,
  /**
   * Rebuild the node with its regions' content replaced, in the order `regions` gives them: the
   * Prompt, the image, then each templated hotspot's visibility as the walk decided it
   * ({@link decided}).
   */
  replaceRegions: (interaction, contents) => {
    const [first, ...rest] = contents;
    const prompt = interaction.prompt.pipe(Option.map((nodes) => first ?? nodes));
    const after = Option.isSome(interaction.prompt) ? rest : contents;
    const [image = interaction.image, ...visibilities] = after;
    let next = 0;

    return {
      ...interaction,
      choices: interaction.choices.flatMap((choice) => {
        if (Option.isNone(choice.templateVisibility)) {
          return [choice];
        }

        const given = visibilities[next];
        next += 1;

        return given === undefined ? [choice] : decided(choice, given);
      }),
      image,
      prompt,
    };
  },
  /**
   * The stored value itself: a Hotspot shows what was stored.
   */
  restore: (_interaction, stored) => stored,
  /**
   * None: a Hotspot presents its hotspots in document order and never shuffles.
   */
  sequence: () => Option.none(),
  /**
   * The correct value itself: a Hotspot shows the correct identifiers checked.
   */
  solution: (_interaction, correct) => correct,
  /**
   * False: every Control is named by its hotspot's Label.
   */
  unnamed: () => false,
  validate,
};

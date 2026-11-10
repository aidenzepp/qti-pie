/**
 * Graphic Order (Q-9, the `graphic-order` kind): `qti-graphic-order-interaction` read into its
 * model node, copied into its payload node, rendered without script, and checked.
 *
 * Without script the interaction is its image with each hotspot drawn over its area and named by
 * its `hotspot-label`, an ordered list of positions beside the image, and the author's restored
 * order shown twice: as a position number (the Badge) on each ordered hotspot and in the positions.
 * One hidden input per ordered hotspot, in order, posts the order under the entry name the host
 * chose; the runtime reads `data-entry-name`, `data-min-choices` and `data-max-choices` from the
 * Root. Nothing but the response is posted, so a post is an `ordered` `identifier` response.
 *
 * It follows four readings of `docs/spec-readings.md`, each cited by its wording:
 *
 * - "An order or graphic-order interaction's `min-choices`, where written, is from 1 to its number of
 *   choices, and a `max-choices` written beside it is from `min-choices` to its number of choices."
 *   `open` refuses the bounds that break it. With no `min-choices` every hotspot must be ordered
 *   and `max-choices` is ignored, so the effective bounds are the number of hotspots twice
 *   ({@link boundsOf}); the Root writes them and there are that many positions as the most allows.
 * - "A default hotspot is the last hotspot choice of its interaction, and a graphic gap match
 *   interaction has none." `open` refuses one that is not last; a default hotspot is ordered like
 *   any other, and its outline covers the image under the others.
 * - "An area's `coords` that do not fit its shape are read as the HTML Standard's image-map
 *   processing reads an `area`'s." An area with too few coordinates holds no point: its hotspot is
 *   listed and labelled but drawn with no outline, as is one whose radius is zero or less.
 * - "A `default` shape carries `coords`, as every shape does, and they are a `CoordsDType`." A
 *   default hotspot's coordinates are read and ignored.
 *
 * Beyond those readings, an outline needs the image's size to place a coordinate written in
 * percentages; plate reads it from the `width` and `height` attributes of the image (`img`, the
 * `img` of a `picture`, or `object`), and draws a percentage with no outline when the image gives
 * neither. Pixel coordinates need no size to be drawn, and a hotspot's Badge is placed at the
 * centre of its area.
 *
 * Strings the renderer writes here live in this module, in English ({@link words}).
 *
 * @module
 * @see https://html.spec.whatwg.org/multipage/image-maps.html#image-map-processing-model
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/listbox/examples/listbox-rearrangeable/
 */
import { Array as Arr, Option, Result } from "effect";
import { attributePath } from "#plate/document/source.ts";
import type { SourceElement } from "#plate/document/source.ts";
import { emitNodes, nestedInteraction } from "#plate/emit/body.ts";
import { h, text, when } from "#plate/emit/node.ts";
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
  PartSpec,
  ReaderKit,
  RedactKit,
  TextProps,
} from "#plate/interactions/contract.ts";
import type { SchemaKit } from "#plate/codec/redacted.ts";
import { numeral } from "#plate/messages.ts";
import type { Locale } from "#plate/messages.ts";
import type { BodyNode } from "#plate/model/item.ts";
import { format, isRecordValue, nullOf, trimXmlSpace } from "#plate/model/values.ts";
import type { ResponseValue, Value } from "#plate/model/values.ts";
import type {
  ElementPayload,
  EmitState,
  Payload,
  PayloadNode,
  ValidationMessage,
} from "#plate/payload.ts";
import type { Refusal } from "#plate/validate/refusal.ts";

/**
 * The owner of every Graphic Order part in the part table.
 */
const owner = "graphic-order-interaction";

/**
 * Graphic Order's identifier in the QTI 3.0 conformance list, Appendix A.
 */
const feature = "Q-9";

/**
 * The QTI element Graphic Order is read from, which its notice names.
 */
const element = "qti-graphic-order-interaction";

/**
 * The geometries a `qti-hotspot-choice`'s `shape` attribute names, as the XSD enumerates them.
 */
const areas = ["circle", "default", "ellipse", "poly", "rect"] as const;

/**
 * The geometry of a hotspot's area.
 */
export type HotspotArea = (typeof areas)[number];

/**
 * One coordinate of a hotspot, as `CoordsDType` writes it: a number, and whether it is written as a
 * percentage of the image.
 */
export interface HotspotCoordinate {
  readonly percent: boolean;
  readonly value: number;
}

/**
 * One `qti-hotspot-choice` of a Graphic Order (Q-9): its identifier, the geometry of its area and
 * the coordinates that area's geometry reads, and its `hotspot-label`, the area's alternative text.
 */
export interface GraphicOrderHotspot {
  readonly area: HotspotArea;
  readonly coords: readonly HotspotCoordinate[];
  readonly identifier: string;
  readonly label: Option.Option<string>;
}

/**
 * A `qti-graphic-order-interaction` as the item model holds it (Q-9, `graphic-order`): its Prompt,
 * its image, its hotspots in document order, and the bounds it wrote.
 *
 * `minChoices` and `maxChoices` are the counts as written, none when absent; the bounds the
 * interaction enforces are {@link boundsOf}'s, never these alone. `image` holds the author's image
 * element (`img`, `picture` or `object`) as body nodes, none when the document has no such element,
 * which `open` refuses first.
 */
export interface GraphicOrderInteraction extends ModuleInteraction<"graphic-order"> {
  /**
   * The author's `class` value, empty when absent.
   */
  readonly class: string;
  readonly hotspots: readonly GraphicOrderHotspot[];
  readonly image: readonly BodyNode[];
  readonly maxChoices: Option.Option<bigint>;
  readonly minChoices: Option.Option<bigint>;
  readonly prompt: Option.Option<readonly BodyNode[]>;
}

/**
 * A Graphic Order as the page may know it (Q-9, `graphic-order`): what the model node holds of the
 * hotspots and the image, the effective bounds, the name its hidden inputs post under, and the
 * order the view shows. It holds no correct response: `ordered` is the stored, posted or solution
 * value the view gave, kept to the hotspots it names.
 */
export interface GraphicOrderPayload {
  readonly ariaLabel: Option.Option<string>;
  readonly ariaLabelledby: Option.Option<string>;
  readonly class: string;
  /**
   * The name its hidden inputs post under: the view's name for the response, else
   * `entryName(instance, response)`.
   */
  readonly formName: string;
  readonly hotspots: readonly GraphicOrderHotspot[];
  readonly image: readonly PayloadNode[];
  /**
   * The effective `max-choices` ({@link boundsOf}): how many positions there are.
   */
  readonly maxChoices: bigint;
  /**
   * The effective `min-choices` ({@link boundsOf}).
   */
  readonly minChoices: bigint;
  /**
   * The identifiers of the ordered hotspots, in order, each naming a hotspot once and at most
   * `maxChoices` of them ({@link keptOf}).
   */
  readonly ordered: readonly string[];
  readonly prompt: Option.Option<readonly PayloadNode[]>;
  /**
   * The identifier of the response it binds.
   */
  readonly response: string;
}

/**
 * The JSON form of a body-node list, as the codec writes a Prompt's content.
 */
type BodyNodesJson = SchemaKit["BodyNodes"]["Encoded"];

/**
 * A Graphic Order in the redacted JSON form: each `Option` an optional key, each count as decimal
 * digits, no path.
 */
export interface GraphicOrderJson {
  readonly ariaLabel?: string;
  readonly ariaLabelledby?: string;
  readonly class: string;
  readonly hotspots: readonly {
    readonly area: HotspotArea;
    readonly coords: readonly HotspotCoordinate[];
    readonly identifier: string;
    readonly label?: string;
  }[];
  readonly image: BodyNodesJson;
  readonly kind: "graphic-order";
  readonly maxChoices?: string;
  readonly minChoices?: string;
  readonly prompt?: BodyNodesJson;
  readonly response: string;
}

/**
 * A part of Graphic Order, by the key a host's override and the part table name it.
 */
export type GraphicOrderPart =
  | "badge"
  | "hidden"
  | "hotspot"
  | "hotspots"
  | "image"
  | "ordered"
  | "outline"
  | "prompt"
  | "root"
  | "slot";

/**
 * The rows of Graphic Order's parts, each declared once; {@link partRow} derives the owner, the key
 * and the `data-slot` marker.
 *
 * The Root is a `role="group"` custom element, as an Extended Text's is, and holds the Prompt, the
 * image with its hotspots and the positions. The Hotspots and the positions are lists, so a
 * swap to a flow container takes the list joint rule's roles. The Outline is an `svg` that stays
 * `aria-hidden`; the Hidden input stays a hidden input of the name and value plate computed.
 */
const parts = {
  badge: {
    defaults: {},
    element: "span",
    listOwner: false,
    merged: ["style", "data-position"],
    tagClass: "phrasing-container",
  },
  hidden: {
    defaults: {},
    element: "input",
    listOwner: false,
    merged: ["name", "type", "value"],
    tagClass: "native-input",
  },
  hotspot: {
    defaults: {},
    element: "li",
    listOwner: false,
    merged: ["aria-label", "data-area", "data-identifier", "data-position"],
    tagClass: "choice-item",
  },
  hotspots: {
    defaults: {},
    element: "ul",
    listOwner: true,
    merged: [],
    tagClass: "choice-list",
  },
  image: {
    defaults: {},
    element: "div",
    listOwner: false,
    merged: [],
    tagClass: "flow-container",
  },
  ordered: {
    defaults: {},
    element: "ol",
    listOwner: true,
    merged: ["aria-label"],
    tagClass: "choice-list",
  },
  outline: {
    defaults: {},
    element: "svg",
    listOwner: false,
    merged: ["aria-hidden", "preserveAspectRatio", "viewBox"],
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
    element: "qti-graphic-order-interaction",
    listOwner: false,
    merged: [
      "role",
      "aria-labelledby",
      "aria-label",
      "aria-describedby",
      "class",
      "data-entry-name",
      "data-min-choices",
      "data-max-choices",
    ],
    tagClass: "flow-container",
  },
  slot: {
    defaults: {},
    element: "li",
    listOwner: false,
    merged: ["data-empty"],
    tagClass: "choice-item",
  },
} satisfies { readonly [Q in GraphicOrderPart]: PartSpec };

/**
 * The module's owner and parts, as {@link partRow} reads them.
 */
const spec = { owner, parts } as const;

/**
 * The row of every Graphic Order part as placed: none of them depends on a placement.
 */
const rows = {
  badge: partRow(spec, "badge"),
  hidden: partRow(spec, "hidden"),
  hotspot: partRow(spec, "hotspot"),
  hotspots: partRow(spec, "hotspots"),
  image: partRow(spec, "image"),
  ordered: partRow(spec, "ordered"),
  outline: partRow(spec, "outline"),
  prompt: partRow(spec, "prompt"),
  root: partRow(spec, "root"),
  slot: partRow(spec, "slot"),
} satisfies { readonly [Q in GraphicOrderPart]: PartRow };

/**
 * The strings the renderer writes for Graphic Order, by locale. A `{name}` is a placeholder that
 * {@link say} fills.
 */
const words = {
  en: {
    area: "Area {n} of {count}",
    atLeast: "Place at least {n} areas in order.",
    atLeastOne: "Place at least 1 area in order.",
    atMost: "Place at most {n} areas in order.",
    atMostOne: "Place at most 1 area in order.",
    empty: "Empty",
    order: "Order",
    twice: "{name} is placed more than once; place each area once.",
    unknown: "Place only the areas the image shows.",
  },
} as const satisfies Readonly<Record<Locale, Readonly<Record<string, string>>>>;

/**
 * The key of a string the renderer writes for Graphic Order.
 */
type Word = keyof (typeof words)["en"];

/**
 * A `{name}` placeholder in a string of {@link words}; its one group is the name.
 */
const placeholder = /\{(?<name>[A-Za-z]+)\}/gu;

/**
 * Write Graphic Order's text for a key in a locale, each placeholder filled.
 *
 * @param locale The locale of the renderer's own text.
 * @param key The string to write.
 * @param values The value of each `{name}` placeholder the string holds.
 * @returns The string, a placeholder with no value left as written.
 */
const say = (locale: Locale, key: Word, values: Readonly<Record<string, string>> = {}): string =>
  words[locale][key].replaceAll(placeholder, (whole, name: string) => values[name] ?? whole);

/**
 * Give a hotspot's name: its `hotspot-label` when that holds anything but whitespace, else its
 * position, "Area 2 of 4".
 *
 * @param hotspots The interaction's hotspots, in document order.
 * @param index The hotspot's index among them.
 * @param locale The locale of the renderer's own text.
 * @returns The name the page shows and assistive technology reads.
 */
const nameOf = (
  hotspots: readonly GraphicOrderHotspot[],
  index: number,
  locale: Locale,
): string => {
  const label = Option.filter(
    Option.flatMap(Option.fromUndefinedOr(hotspots[index]), (hotspot) => hotspot.label),
    (written) => /[^\t\n\r ]/u.test(written),
  );

  return Option.getOrElse(label, () =>
    say(locale, "area", {
      count: numeral(locale, hotspots.length),
      n: numeral(locale, index + 1),
    }),
  );
};

/**
 * The least and the most hotspots an interaction orders.
 */
interface Bounds {
  readonly max: bigint;
  readonly min: bigint;
}

/**
 * Give the bounds an interaction enforces: with no `min-choices` every hotspot must be ordered and
 * `max-choices` is ignored, so both are the number of hotspots; with `min-choices` written, it is
 * the least, and `max-choices` the most, the number of hotspots when absent. Each is held to the
 * number of hotspots, and the most to the least, which `open` already requires.
 *
 * @param interaction What the interaction wrote and how many hotspots it holds.
 * @param interaction.hotspots The hotspots.
 * @param interaction.maxChoices The `max-choices` as written, none when absent.
 * @param interaction.minChoices The `min-choices` as written, none when absent.
 * @returns The least and the most hotspots to order.
 */
const boundsOf = (interaction: {
  readonly hotspots: readonly unknown[];
  readonly maxChoices: Option.Option<bigint>;
  readonly minChoices: Option.Option<bigint>;
}): Bounds => {
  const count = BigInt(interaction.hotspots.length);
  const atMostCount = (written: bigint): bigint => (written < count ? written : count);
  const min = Option.match(interaction.minChoices, {
    onNone: () => count,
    onSome: atMostCount,
  });
  const max = Option.isNone(interaction.minChoices)
    ? count
    : atMostCount(Option.getOrElse(interaction.maxChoices, () => count));

  return { max: max < min ? min : max, min };
};

/**
 * Keep the identifiers that name a hotspot, each once at its first place, and at most as many as
 * the interaction can order.
 *
 * @param interaction The hotspots and the effective most.
 * @param interaction.hotspots The hotspots.
 * @param interaction.max The most hotspots to order, from {@link boundsOf}.
 * @param identifiers The identifiers, in the order shown.
 * @returns The identifiers the page can show as ordered, in order.
 */
const keptOf = (
  interaction: { readonly hotspots: readonly GraphicOrderHotspot[]; readonly max: bigint },
  identifiers: readonly string[],
): readonly string[] => {
  const known = new Set(interaction.hotspots.map((hotspot) => hotspot.identifier));

  return [...new Set(identifiers)]
    .filter((identifier) => known.has(identifier))
    .slice(0, Number(interaction.max));
};

/**
 * Give the value a restored or solved response shows: the stored identifiers kept to the hotspots
 * ({@link keptOf}), the value's type as it was.
 *
 * @param interaction The model node.
 * @param stored The stored or correct response.
 * @returns The value the interaction shows; a record, which an `ordered` identifier never is, as it
 *   was.
 */
const shownValue = (interaction: GraphicOrderInteraction, stored: ResponseValue): ResponseValue => {
  if (isRecordValue(stored)) {
    return stored;
  }

  const kept = keptOf(
    { hotspots: interaction.hotspots, max: boundsOf(interaction).max },
    stored.values.map(format),
  );

  return {
    ...stored,
    values: kept.flatMap((identifier) =>
      Option.toArray(Arr.findFirst(stored.values, (single) => format(single) === identifier)),
    ),
  };
};

/**
 * Read one `qti-hotspot-choice`: its identifier, its geometry and coordinates, and its
 * `hotspot-label`. A `template-identifier` is a mark, since no template value reaches a module's
 * `parse`.
 *
 * @param read The reader kit.
 * @param choice The `qti-hotspot-choice` element.
 * @returns The hotspot, or the refusal at its first attribute outside its type.
 */
const hotspotOf = (
  read: ReaderKit,
  choice: SourceElement,
): Result.Result<GraphicOrderHotspot, Refusal> =>
  Result.gen(function* readHotspot() {
    read.markElement(choice);

    const identifier = yield* read.identifierAttribute(choice, "identifier");
    const written = yield* read.requiredAttribute(choice, "shape");
    const area = yield* read.listed(choice, "shape", written, areas);
    const coords = yield* read.coordsOf(choice);
    if (Option.isSome(read.valueOf(choice, "template-identifier"))) {
      read.mark(choice, "template-identifier");
    }

    return {
      area,
      coords: coords.map(([value, percent]) => ({ percent, value })),
      identifier,
      label: read.valueOf(choice, "hotspot-label"),
    };
  });

/**
 * The elements of QTI's HTML subset an interaction's image may be.
 */
const imageTags = ["img", "object", "picture"] as const;

/**
 * An axis a coordinate is measured along.
 */
type Axis = "x" | "y";

/**
 * The axis of each coordinate a geometry reads, none when the coordinates are too few for it:
 * `rect` its four corners, `circle` its centre and radius (a percentage radius is of the image's
 * width), `ellipse` its centre and two radii, `poly` each complete pair, three at least.
 *
 * @see https://html.spec.whatwg.org/multipage/image-maps.html#image-map-processing-model
 */
const axesOf: Readonly<
  Record<Exclude<HotspotArea, "default">, (count: number) => Option.Option<readonly Axis[]>>
> = {
  circle: (count) => (count >= 3 ? Option.some(["x", "y", "x"]) : Option.none()),
  ellipse: (count) => (count >= 4 ? Option.some(["x", "y", "x", "y"]) : Option.none()),
  poly: (count) => {
    const pairs = Math.floor(count / 2);

    return pairs >= 3
      ? Option.some(
          Array.from({ length: pairs * 2 }, (_, index): Axis => (index % 2 === 0 ? "x" : "y")),
        )
      : Option.none();
  },
  rect: (count) => (count >= 4 ? Option.some(["x", "y", "x", "y"]) : Option.none()),
};

/**
 * The size of an image as its `width` and `height` attributes give it.
 */
interface Frame {
  readonly height: number;
  readonly width: number;
}

/**
 * Read a dimension attribute as HTML does: digits alone, more than zero.
 *
 * @param node The image element.
 * @param name `width` or `height`.
 * @returns The number, none when the element writes none or one that is not a positive integer.
 */
const dimensionOf = (node: ElementPayload, name: "height" | "width"): Option.Option<number> =>
  Option.filter(
    Option.flatMap(
      Option.fromUndefinedOr(node.attributes.find((attribute) => attribute.name === name)),
      ({ value }) =>
        /^[0-9]+$/u.test(value.trim()) ? Option.some(Number(value.trim())) : Option.none(),
    ),
    (value) => value > 0,
  );

/**
 * Find the image element among payload nodes: the first `img` at any depth, else the first
 * `object`.
 *
 * @param nodes The image's payload nodes.
 * @returns The element, none when there is none.
 */
const imageElementOf = (nodes: readonly PayloadNode[]): Option.Option<ElementPayload> => {
  const found = (tag: string, within: readonly PayloadNode[]): Option.Option<ElementPayload> => {
    for (const node of within) {
      if (node.kind === "element") {
        if (node.tag === tag) {
          return Option.some(node);
        }

        const inner = found(tag, node.children);
        if (Option.isSome(inner)) {
          return inner;
        }
      }
    }

    return Option.none();
  };

  return Option.orElse(found("img", nodes), () => found("object", nodes));
};

/**
 * Give the size of an image, none when its element writes no positive `width` and `height`.
 *
 * @param nodes The image's payload nodes.
 * @returns The frame coordinates are measured in.
 */
const frameOf = (nodes: readonly PayloadNode[]): Option.Option<Frame> =>
  Option.flatMap(imageElementOf(nodes), (image) =>
    Option.all({ height: dimensionOf(image, "height"), width: dimensionOf(image, "width") }),
  );

/**
 * Where a hotspot is drawn: its outline element, the centre of its area, and the unit both are in.
 */
interface Drawing {
  /**
   * The centre of the area, `[x, y]`, in the frame's units, or fractions of the image for the
   * `default` area.
   */
  readonly centre: readonly [x: number, y: number];
  /**
   * The shape the `svg` holds.
   */
  readonly figure: Element;
}

/**
 * Round a number to four decimals, the precision an outline needs.
 *
 * @param value The number.
 * @returns The rounded number.
 */
const rounded = (value: number): number => Math.round(value * 10_000) / 10_000;

/**
 * Write a number as an SVG number.
 *
 * @param value The number.
 * @returns Its digits.
 */
const digits = (value: number): string => String(rounded(value));

/**
 * Resolve a hotspot's coordinates to numbers in one unit: image pixels when the image's size is
 * known (a percentage is scaled by it), the coordinates as written otherwise, when none is a
 * percentage.
 *
 * @param coords The coordinates as written.
 * @param axes The axis of each coordinate the geometry reads.
 * @param frame The image's size.
 * @returns The numbers, none when a percentage has no size to be a percentage of.
 */
const resolvedOf = (
  coords: readonly HotspotCoordinate[],
  axes: readonly Axis[],
  frame: Option.Option<Frame>,
): Option.Option<readonly number[]> => {
  const numbers: number[] = [];
  for (const [index, axis] of axes.entries()) {
    const coordinate = coords[index];
    if (coordinate === undefined) {
      return Option.none();
    }

    if (!coordinate.percent) {
      numbers.push(coordinate.value);
    } else if (Option.isSome(frame)) {
      numbers.push(
        (coordinate.value * (axis === "x" ? frame.value.width : frame.value.height)) / 100,
      );
    } else {
      return Option.none();
    }
  }

  return Option.some(numbers);
};

/**
 * Draw an area of one of the four geometries that read coordinates, from its resolved numbers.
 *
 * @param area The geometry.
 * @param numbers The coordinates the geometry reads, in one unit ({@link resolvedOf}).
 * @returns The drawing, none for a radius of zero or less, which holds no point.
 */
const drawn = (
  area: Exclude<HotspotArea, "default">,
  numbers: readonly number[],
): Option.Option<Drawing> => {
  const [first = 0, second = 0, third = 0, fourth = 0] = numbers;

  switch (area) {
    case "circle": {
      return third > 0
        ? Option.some({
            centre: [first, second],
            figure: h("circle", { cx: digits(first), cy: digits(second), r: digits(third) }),
          })
        : Option.none();
    }
    case "ellipse": {
      return third > 0 && fourth > 0
        ? Option.some({
            centre: [first, second],
            figure: h("ellipse", {
              cx: digits(first),
              cy: digits(second),
              rx: digits(third),
              ry: digits(fourth),
            }),
          })
        : Option.none();
    }
    case "poly": {
      const xs = numbers.filter((_, index) => index % 2 === 0);
      const ys = numbers.filter((_, index) => index % 2 === 1);

      return Option.some({
        centre: [(Math.min(...xs) + Math.max(...xs)) / 2, (Math.min(...ys) + Math.max(...ys)) / 2],
        figure: h("polygon", {
          points: xs.map((x, index) => `${digits(x)},${digits(ys[index] ?? 0)}`).join(" "),
        }),
      });
    }
    case "rect": {
      return Option.some({
        centre: [(first + third) / 2, (second + fourth) / 2],
        figure: h("rect", {
          height: digits(Math.abs(fourth - second)),
          width: digits(Math.abs(third - first)),
          x: digits(Math.min(first, third)),
          y: digits(Math.min(second, fourth)),
        }),
      });
    }
    default: {
      return area satisfies never;
    }
  }
};

/**
 * Draw one hotspot's area: the SVG shape and its centre.
 *
 * An area holds no drawing when its coordinates are too few for its geometry, when a radius is zero
 * or less, or when a percentage has no image size ({@link resolvedOf}); the `default` area covers
 * the image whatever it carries.
 *
 * @param hotspot The hotspot.
 * @param frame The image's size.
 * @returns The drawing, none for an area that holds no point or cannot be placed.
 */
const drawingOf = (
  hotspot: GraphicOrderHotspot,
  frame: Option.Option<Frame>,
): Option.Option<Drawing> => {
  const { area } = hotspot;
  if (area === "default") {
    return Option.some({
      centre: [0.5, 0.5],
      figure: h("rect", { height: "100%", width: "100%", x: "0", y: "0" }),
    });
  }

  return axesOf[area](hotspot.coords.length).pipe(
    Option.flatMap((axes) => resolvedOf(hotspot.coords, axes, frame)),
    Option.flatMap((numbers) => drawn(area, numbers)),
  );
};

/**
 * Write a Badge's position as the `style` that places it at the centre of its area: percentages of
 * the image when its size is known, pixels otherwise; the `default` area's centre is the image's.
 *
 * @param hotspot The hotspot.
 * @param drawing The hotspot's drawing.
 * @param frame The image's size.
 * @returns The `style` attribute's value.
 */
const placementOf = (
  hotspot: GraphicOrderHotspot,
  drawing: Drawing,
  frame: Option.Option<Frame>,
): string => {
  const [x, y] = drawing.centre;
  if (hotspot.area === "default") {
    return "left:50%;top:50%";
  }

  return Option.match(frame, {
    onNone: () => `left:${digits(x)}px;top:${digits(y)}px`,
    onSome: (size) =>
      `left:${digits((x / size.width) * 100)}%;top:${digits((y / size.height) * 100)}%`,
  });
};

/**
 * Give the names the author wrote for the group: `aria-label` when it holds anything but XML
 * whitespace, and `aria-labelledby` with each id scoped by the instance, written only when it names
 * an id. A blank `aria-label` names nothing under accname 1.2, so it is not written.
 *
 * It repeats `authorsName` of `#plate/interactions/name.ts` and never imports it: that module
 * imports `#plate/model/interactions.ts`, which imports this one at load, and the cycle would read
 * this module's export before it is initialised whenever this module is the first loaded.
 *
 * @param names The author's `aria-label` and `aria-labelledby`, the ids unscoped.
 * @param instance The item instance key, which scopes the author's ids.
 * @returns The attributes the author gave, none when they gave neither.
 * @see https://www.w3.org/TR/accname-1.2/#comp_label
 */
const authoredName = (
  names: Pick<GraphicOrderPayload, "ariaLabel" | "ariaLabelledby">,
  instance: string,
): Attributes => ({
  ...Option.match(names.ariaLabel.pipe(Option.filter((label) => trimXmlSpace(label) !== "")), {
    onNone: () => ({}),
    onSome: (label) => ({ "aria-label": label }),
  }),
  ...Option.match(
    names.ariaLabelledby.pipe(Option.flatMap((ids) => authoredIdrefs(instance, ids))),
    { onNone: () => ({}), onSome: (ids) => ({ "aria-labelledby": ids }) },
  ),
});

/**
 * The attributes the connect function computes for one hotspot's parts.
 */
interface HotspotProps {
  /**
   * The Badge's text and attributes, none for a hotspot that is not ordered.
   */
  readonly badge: Option.Option<TextProps>;
  readonly drawing: Option.Option<Drawing>;
  readonly hotspot: Attributes;
  readonly outline: Attributes;
}

/**
 * The attributes of every part of one Graphic Order, computed once by {@link connectOf}.
 */
interface Props {
  /**
   * One per hotspot, in document order.
   */
  readonly hotspots: readonly HotspotProps[];
  readonly hotspotsList: Attributes;
  /**
   * One per ordered hotspot, in order; none when the page is not editable or the author disabled
   * every control, which post nothing.
   */
  readonly hidden: readonly Attributes[];
  readonly image: Attributes;
  readonly ordered: Attributes;
  readonly prompt: Attributes;
  readonly root: Attributes;
  /**
   * One per position, in order, each with the name of the hotspot placed there or "Empty".
   */
  readonly slots: readonly TextProps[];
}

/**
 * Compute every attribute of every part of one Graphic Order: the connect function.
 *
 * - Root: the marker, the state (`data-mode`, and `data-disabled` when the author disabled every
 *   control), `role="group"`, the author's `class`, the entry name and the effective bounds the
 *   runtime reads, and the group's name: with a Prompt, `aria-labelledby` → the Prompt's id, else
 *   the author's `aria-label` and `aria-labelledby` ({@link authoredName}); `aria-describedby` →
 *   the message ids when the response is invalid.
 * - Hotspot: its name as `aria-label` (its `hotspot-label`, else "Area n of count"), its identifier
 *   as `data-identifier`, its geometry as `data-area`, which lets the theme draw a `default` area
 *   under the others, and, when ordered, its position as `data-position`.
 * - Outline: `aria-hidden`, and, when the image's size is known, `viewBox` of that size with
 *   `preserveAspectRatio="none"`, so it scales with the image.
 * - Badge: the position, placed at the centre of the area, only for an ordered hotspot.
 * - Ordered: `aria-label`; each position holds the hotspot placed there, or "Empty" (`data-empty`).
 * - Hidden: one per ordered hotspot, only while the page is editable and not finished.
 *
 * @param interaction The Graphic Order's payload.
 * @param payload The payload, which gives the instance, the mode, `finished` and the messages.
 * @param locale The locale of the renderer's own text.
 * @returns The attributes of every part.
 */
const connectOf = (interaction: GraphicOrderPayload, payload: Payload, locale: Locale): Props => {
  const { instance } = payload;
  const frame = frameOf(interaction.image);
  const promptId = scopedId(instance, interaction.response, "prompt");
  const problems = payload.messages.filter((entry) => entry.response === interaction.response);
  const writes = payload.mode === "answering" && !payload.finished;
  const hotspots = interaction.hotspots.map((hotspot, index): HotspotProps => {
    const position = interaction.ordered.indexOf(hotspot.identifier);
    const drawing = drawingOf(hotspot, frame);

    return {
      badge:
        position === -1
          ? Option.none()
          : Option.some({
              props: {
                "data-position": String(position + 1),
                "data-slot": rows.badge.slot,
                ...Option.match(drawing, {
                  onNone: () => ({}),
                  onSome: (figure) => ({ style: placementOf(hotspot, figure, frame) }),
                }),
              },
              text: numeral(locale, position + 1),
            }),
      drawing,
      hotspot: {
        "aria-label": nameOf(interaction.hotspots, index, locale),
        "data-area": hotspot.area,
        "data-identifier": hotspot.identifier,
        ...when(position !== -1, { "data-position": String(position + 1) }),
        "data-slot": rows.hotspot.slot,
      },
      outline: {
        "aria-hidden": "true",
        "data-slot": rows.outline.slot,
        preserveAspectRatio: "none",
        ...Option.match(frame, {
          onNone: () => ({}),
          onSome: (size) => ({ viewBox: `0 0 ${String(size.width)} ${String(size.height)}` }),
        }),
      },
    };
  });

  return {
    hidden: writes
      ? interaction.ordered.map((identifier) => ({
          "data-slot": rows.hidden.slot,
          name: interaction.formName,
          type: "hidden",
          value: identifier,
        }))
      : [],
    hotspots,
    hotspotsList: { "data-slot": rows.hotspots.slot },
    image: { "data-slot": rows.image.slot },
    ordered: { "aria-label": say(locale, "order"), "data-slot": rows.ordered.slot },
    prompt: { "data-slot": rows.prompt.slot, id: promptId },
    root: {
      ...(Option.isSome(interaction.prompt)
        ? { "aria-labelledby": promptId }
        : authoredName(interaction, instance)),
      ...when(problems.length > 0, {
        "aria-describedby": problems.map((entry) => entry.id).join(" "),
      }),
      ...when(interaction.class !== "", { class: interaction.class }),
      ...when(payload.finished, { "data-disabled": true }),
      "data-entry-name": interaction.formName,
      "data-max-choices": String(interaction.maxChoices),
      "data-min-choices": String(interaction.minChoices),
      "data-mode": payload.mode,
      "data-slot": rows.root.slot,
      role: "group",
    },
    slots: Array.from({ length: Number(interaction.maxChoices) }, (_, position): TextProps => {
      const identifier = interaction.ordered[position];
      const index = interaction.hotspots.findIndex((hotspot) => hotspot.identifier === identifier);

      return index === -1
        ? {
            props: { "data-empty": true, "data-slot": rows.slot.slot },
            text: say(locale, "empty"),
          }
        : {
            props: { "data-slot": rows.slot.slot },
            text: nameOf(interaction.hotspots, index, locale),
          };
    }),
  };
};

/**
 * Flatten the typed props into the contract's {@link Connected}: the attributes of each part, or of
 * each element of a part that repeats, by part key.
 *
 * @param props The props {@link connectOf} computed.
 * @returns The part keys with their attributes.
 */
const flattened = (props: Props): Connected => ({
  badge: props.hotspots.flatMap(({ badge }) => Option.toArray(badge)),
  hidden: props.hidden,
  hotspot: props.hotspots.map(({ hotspot }) => hotspot),
  hotspots: props.hotspotsList,
  image: props.image,
  ordered: props.ordered,
  outline: props.hotspots.map(({ outline }) => outline),
  prompt: props.prompt,
  root: props.root,
  slot: props.slots,
});

/**
 * Render a Graphic Order: a Root holding the Prompt, when there is one, the image part with its
 * hotspots after the image, the positions, and one Hidden input per ordered hotspot in order.
 *
 * The Prompt's and the image's content go through {@link emitNodes}, as the body's do, so they get
 * its id scoping, heading shift, URLs and Notices. Each part goes through `applyPart` with its
 * replacement from `state.parts`, so every swap holds I1 to I4. A hotspot whose area holds no
 * drawing is written with no Outline.
 *
 * @param interaction The Graphic Order's payload.
 * @param payload The render's payload.
 * @param state The render's emit state.
 * @returns The Root, or the refusal of a part swap.
 */
const renderGraphicOrder = (
  interaction: GraphicOrderPayload,
  payload: Payload,
  state: EmitState,
): Result.Result<Element, PartSwapRefused> => {
  const props = connectOf(interaction, payload, state.locale);
  const emitContent = (
    nodes: readonly PayloadNode[],
  ): Result.Result<readonly Node[], PartSwapRefused> =>
    emitNodes(nodes, payload, state, nestedInteraction(owner));
  const place = (
    part: GraphicOrderPart,
    attributes: Attributes,
    children: readonly Node[],
  ): Result.Result<Element, PartSwapRefused> =>
    applyPart(
      rows[part],
      attributes,
      children,
      Option.getOrUndefined(state.parts.replacementFor(owner, part)),
    );

  return Result.gen(function* graphicOrderRoot() {
    const prompt = yield* Result.transposeOption(
      interaction.prompt.pipe(
        Option.map((content) =>
          Result.flatMap(emitContent(content), (children) =>
            place("prompt", props.prompt, children),
          ),
        ),
      ),
    );
    const image = yield* emitContent(interaction.image);
    const hotspots = yield* Result.all(
      props.hotspots.map((entry) =>
        Result.gen(function* hotspotItem() {
          const outline = yield* Result.transposeOption(
            entry.drawing.pipe(
              Option.map(({ figure }) => place("outline", entry.outline, [figure])),
            ),
          );
          const badge = yield* Result.transposeOption(
            entry.badge.pipe(
              Option.map(({ props: attributes, text: written }) =>
                place("badge", attributes, [text(written)]),
              ),
            ),
          );

          return yield* place("hotspot", entry.hotspot, [
            ...Option.toArray(outline),
            ...Option.toArray(badge),
          ]);
        }),
      ),
    );
    const list = yield* place("hotspots", props.hotspotsList, hotspots);
    const frame = yield* place("image", props.image, [...image, list]);
    const slots = yield* Result.all(
      props.slots.map((slot) => place("slot", slot.props, [text(slot.text)])),
    );
    const positions = yield* place("ordered", props.ordered, slots);
    const hidden = yield* Result.all(
      props.hidden.map((attributes) => place("hidden", attributes, [])),
    );

    return yield* place("root", props.root, [
      ...Option.toArray(prompt),
      frame,
      positions,
      ...hidden,
    ]);
  });
};

/**
 * Check a Graphic Order's response, which the caller decoded, in two tiers.
 *
 * - A {@link Malformed} input: the identifiers did not decode, so a hotspot the image does not show.
 * - Tier (a), always: every identifier names a hotspot (the same message), no hotspot repeats (the
 *   message names it by its label or position), and the effective `max-choices` caps the count.
 * - Tier (b), only under `validateResponses`: the effective `min-choices`, which is every hotspot
 *   when the author wrote no `min-choices`.
 *
 * @param interaction The Graphic Order.
 * @param input The decoded value, or why the entries did not decode.
 * @param configuration The configuration, which gives the locale and `validateResponses`.
 * @returns One message per problem, none when the response is accepted.
 */
const validateGraphicOrder = (
  interaction: GraphicOrderInteraction,
  input: Value | Malformed,
  configuration: { readonly locale: Locale; readonly validateResponses: boolean },
): readonly ValidationMessage[] => {
  const { locale } = configuration;
  const problem = (written: string): ValidationMessage => ({
    response: interaction.response,
    text: written,
  });

  if (input instanceof Malformed) {
    return [problem(say(locale, "unknown"))];
  }

  const { max, min } = boundsOf(interaction);
  const chosen = input.values.map(format);
  const names = new Map(
    interaction.hotspots.map((hotspot, index) => [
      hotspot.identifier,
      nameOf(interaction.hotspots, index, locale),
    ]),
  );
  const stray = chosen.some((identifier) => !names.has(identifier));
  const repeated = [
    ...new Set(chosen.filter((identifier, index) => chosen.indexOf(identifier) !== index)),
  ];
  const count = BigInt(chosen.length);
  const bound = (n: bigint, one: Word, many: Word): string =>
    n === 1n ? say(locale, one) : say(locale, many, { n: numeral(locale, n) });

  return [
    ...(stray ? [problem(say(locale, "unknown"))] : []),
    ...repeated.flatMap((identifier) =>
      Option.toArray(
        Option.map(Option.fromUndefinedOr(names.get(identifier)), (name) =>
          problem(say(locale, "twice", { name })),
        ),
      ),
    ),
    ...(count > max ? [problem(bound(max, "atMostOne", "atMost"))] : []),
    ...(configuration.validateResponses && count < min
      ? [problem(bound(min, "atLeastOne", "atLeast"))]
      : []),
  ];
};

/**
 * The elements of the image the interaction holds, by the part of the region that holds them.
 *
 * @param interaction The model node.
 * @returns The Prompt's region, when it has a Prompt, then the image's.
 */
const ownRegions = (interaction: GraphicOrderInteraction): readonly OwnRegion[] => [
  ...Option.toArray(interaction.prompt).map((nodes): OwnRegion => ({
    choice: Option.none(),
    nodes,
    part: "prompt",
    written: "nodes",
  })),
  { choice: Option.none(), nodes: interaction.image, part: "content", written: "nodes" },
];

/**
 * Copy a Graphic Order's model node into its payload node: its content through the kit, the
 * effective bounds, the entry name the host chose, and the order the view shows.
 *
 * The order is the strings a refused post sent when the view restores one, else the values the view
 * shows ({@link RedactKit.shown}), each kept to the hotspots ({@link keptOf}): what names no
 * hotspot is not shown, and a hotspot twice is shown once, at its first place.
 *
 * @param interaction The model node.
 * @param kit What the payload hands a module's `redact`.
 * @returns The payload node.
 */
const redactGraphicOrder = (
  interaction: GraphicOrderInteraction,
  kit: RedactKit,
): GraphicOrderPayload => {
  const { max, min } = boundsOf(interaction);

  return {
    ariaLabel: interaction.ariaLabel,
    ariaLabelledby: interaction.ariaLabelledby,
    class: interaction.class,
    formName: kit.formName(interaction.response),
    hotspots: interaction.hotspots,
    image: kit.nodes(interaction.image),
    maxChoices: max,
    minChoices: min,
    ordered: keptOf(
      { hotspots: interaction.hotspots, max },
      Option.getOrElse(kit.posted(interaction.response), () =>
        kit.shown(interaction.response).map(format),
      ),
    ),
    prompt: interaction.prompt.pipe(Option.map(kit.nodes)),
    response: interaction.response,
  };
};

/**
 * The Graphic Order module: reads `qti-graphic-order-interaction`, copies, renders and checks it.
 */
export const graphicOrderModule: InteractionModule<
  "graphic-order",
  GraphicOrderInteraction,
  GraphicOrderPayload,
  GraphicOrderPart,
  GraphicOrderJson
> = {
  /**
   * The one response Graphic Order binds, an `ordered` `identifier`, which posts identifiers and so
   * has no number base.
   */
  bindings: (interaction) => [{ base: Option.none(), response: interaction.response }],
  /**
   * Graphic Order's connect function: the attributes of every part, by part key.
   */
  connect: (interaction, payload, locale) => flattened(connectOf(interaction, payload, locale)),
  /**
   * The Prompt's nodes, then the image's: what the render writes as content, in document order.
   */
  content: (interaction) => [
    ...Option.getOrElse(interaction.prompt, () => []),
    ...interaction.image,
  ],
  /**
   * No Control: without script a hotspot is not operable and the hidden inputs are not Controls a
   * person operates, so the renderer names none.
   */
  controls: () => 0,
  element,
  feature,
  /**
   * True: the module renders the kind.
   */
  implemented: true,
  kind: "graphic-order",
  /**
   * The NULL of Graphic Order's binding: an `ordered` `identifier` with no value.
   */
  nullValue: () => nullOf("identifier", "ordered"),
  owner,
  /**
   * Read `qti-graphic-order-interaction`: the notice when its response is not an `ordered`
   * `identifier`; the refusal `undeclared-response` when it names no declaration; otherwise its
   * Prompt, its image, its `qti-hotspot-choice` children and the counts it wrote.
   */
  parse: (source, context) => {
    const { read } = context;

    return Result.gen(function* readGraphicOrder() {
      const response = yield* read.requiredAttribute(source, "response-identifier");
      const declaration = read.bound;
      if (Option.isNone(declaration)) {
        return yield* Result.fail(
          read.refusal("undeclared-response", attributePath(context.path, response), {
            response: read.identifierOf(response.value),
          }),
        );
      }

      if (
        !(
          Option.contains(declaration.value.baseType, "identifier") &&
          Option.contains(declaration.value.cardinality, "ordered")
        )
      ) {
        return yield* context.notice(element);
      }

      read.markElement(source);

      const minChoices = yield* read.countAttribute(source, "min-choices");
      const maxChoices = yield* read.countAttribute(source, "max-choices");
      const prompt = yield* read.content(source, "qti-prompt");
      const imageElement = Arr.findFirst(read.elementsOf(source), (child) =>
        imageTags.some((tag) => read.isQti(child, tag)),
      );
      const image = yield* Option.match(imageElement, {
        onNone: () => Result.succeed<readonly BodyNode[]>([]),
        onSome: (child) => read.nodes(source, { children: [child] }),
      });
      const hotspots: GraphicOrderHotspot[] = [];
      for (const choice of read.childrenNamed(source, "qti-hotspot-choice")) {
        hotspots.push(yield* hotspotOf(read, choice));
      }

      return {
        ariaLabel: read.valueOf(source, "aria-label"),
        ariaLabelledby: read.valueOf(source, "aria-labelledby"),
        class: Option.getOrElse(read.valueOf(source, "class"), () => ""),
        hotspots,
        image,
        kind: "graphic-order" as const,
        maxChoices,
        minChoices,
        path: context.path,
        prompt,
        response: read.identifierOf(response.value),
      };
    });
  },
  /**
   * The rows of Graphic Order's parts, by part key.
   */
  parts,
  /**
   * The codec of the model node's JSON form: each `Option` an optional key, the counts as decimal
   * digits, every coordinate a finite number, no path.
   */
  payloadSchema: ({ BodyNodes, NoPath, OptionalCount, OptionalText, Schema }) =>
    Schema.Struct({
      ariaLabel: OptionalText,
      ariaLabelledby: OptionalText,
      class: Schema.String,
      hotspots: Schema.Array(
        Schema.Struct({
          area: Schema.Literals(areas),
          coords: Schema.Array(Schema.Struct({ percent: Schema.Boolean, value: Schema.Finite })),
          identifier: Schema.String,
          label: OptionalText,
        }),
      ),
      image: BodyNodes,
      kind: Schema.Literal("graphic-order"),
      maxChoices: OptionalCount,
      minChoices: OptionalCount,
      path: NoPath,
      prompt: Schema.OptionFromOptionalKey(BodyNodes),
      response: Schema.String,
    }),
  /**
   * Graphic Order's payload copy: {@link redactGraphicOrder}.
   */
  redact: redactGraphicOrder,
  /**
   * The Prompt's region, when it has a Prompt, then the image's.
   */
  regions: ownRegions,
  /**
   * Render a Graphic Order: its Root holding the Prompt, the image with its hotspots, the positions
   * and, while the page accepts input, one hidden input per ordered hotspot.
   */
  render: renderGraphicOrder,
  /**
   * Rebuild the node with the content of each region replaced, in the order {@link ownRegions}
   * gives them.
   */
  replaceRegions: (interaction, contents) => {
    const [first = [], second] = contents;

    return Option.isSome(interaction.prompt)
      ? { ...interaction, image: second ?? interaction.image, prompt: Option.some(first) }
      : { ...interaction, image: contents[0] ?? interaction.image };
  },
  /**
   * The value Graphic Order shows for a stored response: the order kept to its hotspots.
   */
  restore: shownValue,
  /**
   * No shuffle: a Graphic Order presents its hotspots in document order.
   */
  sequence: () => Option.none(),
  /**
   * The value Graphic Order shows for the correct response: the order kept to its hotspots.
   */
  solution: shownValue,
  /**
   * The renderer names no Control of a Graphic Order, since it renders none.
   */
  unnamed: () => false,
  /**
   * Check a Graphic Order's response: {@link validateGraphicOrder}.
   */
  validate: validateGraphicOrder,
};

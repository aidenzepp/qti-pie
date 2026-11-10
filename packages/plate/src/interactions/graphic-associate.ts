/**
 * Graphic Associate (Q-7, the `graphic-associate` kind): `qti-graphic-associate-interaction` read
 * into its model node, copied into its payload node, rendered without script, and checked.
 *
 * Without script the interaction is its image with each associable hotspot drawn over its area and
 * named by its `hotspot-label`, and a list of the author's restored associations, each pair naming
 * its two hotspots. One hidden input per pair, `"<a> <b>"`, posts the response under the entry name
 * the host chose; the runtime (issue ei-09) reads `data-entry-name` and `data-max-associations`
 * from the Root and each hotspot's `data-match-max` and `data-match-group`. Nothing but the
 * response is posted, so a post is a `pair` response of the declared cardinality. Without pointer
 * selection the hotspots are offered in document order, which is how the list of hotspots reads.
 *
 * It follows three readings of `docs/spec-readings.md`, each cited by its wording:
 *
 * - "A default hotspot is the last hotspot choice of its interaction, and a graphic gap match
 *   interaction has none." The reading binds `qti-hotspot-choice` and says nothing of this
 *   interaction's `qti-associable-hotspot`, so here a `default` hotspot may stand anywhere, and it
 *   is rendered in document order like any other; its outline covers the image under the others.
 * - "An area's `coords` that do not fit its shape are read as the HTML Standard's image-map
 *   processing reads an `area`'s." An area with too few coordinates holds no point: its hotspot is
 *   listed and labelled but drawn with no outline, as is one whose radius is zero or less.
 * - "A `default` shape carries `coords`, as every shape does, and they are a `CoordsDType`." A
 *   default hotspot's coordinates are read and ignored.
 *
 * Two defaults of this module, in tier (a) of its validation: a hotspot never pairs with itself,
 * and one pair given twice, in either order, is refused. An unwritten `max-associations` reads as
 * the XSD's default on this interaction, 1, and 0 is no limit; an unwritten `min-associations` is
 * no minimum; `match-max` is required of each hotspot and 0 is no limit; `match-min` is 0 when
 * absent. A hotspot's `match-group`, when written, names the hotspots it may pair with, and a
 * pair is outside the group when either side names a group the other is not in.
 *
 * An outline needs the image's size to place a coordinate written in percentages; plate reads it
 * from the `width` and `height` attributes of the image (`img`, the `img` of a `picture`, or
 * `object`), and draws a percentage with no outline when the image gives neither.
 *
 * Strings the renderer writes here live in this module, in English ({@link words}).
 *
 * @module
 * @see https://html.spec.whatwg.org/multipage/image-maps.html#image-map-processing-model
 */
import { Array as Arr, Option, Result } from "effect";
import type { Configuration } from "#plate/configuration.ts";
import { attributePath } from "#plate/document/source.ts";
import type { SourceElement } from "#plate/document/source.ts";
import { emitNodes, nestedInteraction } from "#plate/emit/body.ts";
import { h, text, when } from "#plate/emit/node.ts";
import type { Attributes, Element, Node } from "#plate/emit/node.ts";
import { authoredIdrefs, scopedId, splitTokens } from "#plate/emit/parts.ts";
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
import { isRecordValue, nullOf, trimXmlSpace } from "#plate/model/values.ts";
import type { ResponseValue, Single, Value } from "#plate/model/values.ts";
import type {
  ElementPayload,
  EmitState,
  Payload,
  PayloadNode,
  ValidationMessage,
} from "#plate/payload.ts";
import type { Refusal } from "#plate/validate/refusal.ts";

/**
 * The owner of every Graphic Associate part in the part table.
 */
const owner = "graphic-associate-interaction";

/**
 * Graphic Associate's identifier in the QTI 3.0 conformance list, Appendix A.
 */
const feature = "Q-7";

/**
 * The QTI element Graphic Associate is read from, which its notice names.
 */
const element = "qti-graphic-associate-interaction";

/**
 * The geometries a `qti-associable-hotspot`'s `shape` attribute names, as the XSD enumerates them.
 */
const areas = ["circle", "default", "ellipse", "poly", "rect"] as const;

/**
 * The geometry of an associable hotspot's area.
 */
export type AssociableArea = (typeof areas)[number];

/**
 * One coordinate of a hotspot, as `CoordsDType` writes it: a number, and whether it is written as a
 * percentage of the image.
 */
export interface AssociableCoordinate {
  readonly percent: boolean;
  readonly value: number;
}

/**
 * One `qti-associable-hotspot` of a Graphic Associate (Q-7): its identifier, the geometry of its
 * area and the coordinates that geometry reads, its `hotspot-label`, and the limits on the pairs
 * it may be in.
 */
export interface GraphicAssociateHotspot {
  readonly area: AssociableArea;
  readonly coords: readonly AssociableCoordinate[];
  readonly identifier: string;
  readonly label: Option.Option<string>;
  /**
   * `match-group`: the hotspots this one may pair with, none when absent, which means any.
   */
  readonly matchGroup: Option.Option<readonly string[]>;
  /**
   * `match-max`: the most pairs this hotspot may be in; 0 is no limit.
   */
  readonly matchMax: bigint;
  /**
   * `match-min`, 0 when absent: the fewest pairs this hotspot must be in for a valid response.
   */
  readonly matchMin: bigint;
}

/**
 * A `qti-graphic-associate-interaction` as the item model holds it (Q-7, `graphic-associate`):
 * its Prompt, its image, its hotspots in document order, and the bounds on its pairs, bound to a
 * `pair` response of `single` or `multiple` cardinality.
 *
 * `image` holds the author's image element (`img`, `picture` or `object`) as body nodes, none when
 * the document has no such element, which `open` refuses first.
 */
export interface GraphicAssociateInteraction extends ModuleInteraction<"graphic-associate"> {
  /**
   * The bound response's cardinality.
   */
  readonly cardinality: "multiple" | "single";
  /**
   * The author's `class` value, empty when absent.
   */
  readonly class: string;
  readonly hotspots: readonly GraphicAssociateHotspot[];
  readonly image: readonly BodyNode[];
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
}

/**
 * One hotspot as the page may know it: what the render and the runtime read of it.
 */
export interface GraphicAssociatePayloadHotspot {
  readonly area: AssociableArea;
  readonly coords: readonly AssociableCoordinate[];
  readonly identifier: string;
  readonly label: Option.Option<string>;
  /**
   * The hotspots this one may pair with, none listed when it may pair with any.
   */
  readonly matchGroup: readonly string[];
  readonly matchMax: bigint;
}

/**
 * A Graphic Associate as the page may know it (Q-7, `graphic-associate`): its hotspots and its
 * image, the most pairs, the name its hidden inputs post under, and the pairs the view shows. It
 * holds no correct response: `pairs` is the stored, posted or solution value the view gave, kept
 * to the hotspots ({@link keptPairs}).
 */
export interface GraphicAssociatePayload {
  readonly ariaLabel: Option.Option<string>;
  readonly ariaLabelledby: Option.Option<string>;
  readonly class: string;
  /**
   * The name its hidden inputs post under: the view's name for the response, else
   * `entryName(instance, response)`.
   */
  readonly formName: string;
  readonly hotspots: readonly GraphicAssociatePayloadHotspot[];
  readonly image: readonly PayloadNode[];
  readonly maxAssociations: bigint;
  /**
   * The pairs to show, each two hotspot identifiers in the order the view gave them, each naming
   * two different hotspots, no pair twice in either order, and at most `maxAssociations` of them
   * when that is above 0.
   */
  readonly pairs: readonly (readonly [string, string])[];
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
 * A Graphic Associate in the redacted JSON form: each `Option` an optional key, each count as
 * decimal digits, no path.
 */
export interface GraphicAssociateJson {
  readonly ariaLabel?: string;
  readonly ariaLabelledby?: string;
  readonly cardinality: "multiple" | "single";
  readonly class: string;
  readonly hotspots: readonly {
    readonly area: AssociableArea;
    readonly coords: readonly AssociableCoordinate[];
    readonly identifier: string;
    readonly label?: string;
    readonly matchGroup?: readonly string[];
    readonly matchMax: string;
    readonly matchMin: string;
  }[];
  readonly image: BodyNodesJson;
  readonly kind: "graphic-associate";
  readonly maxAssociations: string;
  readonly minAssociations: string;
  readonly prompt?: BodyNodesJson;
  readonly response: string;
}

/**
 * A part of Graphic Associate, by the key a host's override and the part table name it.
 */
export type GraphicAssociatePart =
  | "hidden"
  | "hotspot"
  | "hotspots"
  | "image"
  | "outline"
  | "pair"
  | "pairs"
  | "prompt"
  | "root";

/**
 * The rows of Graphic Associate's parts, each declared once; {@link partRow} derives the owner,
 * the key and the `data-slot` marker.
 *
 * The Root is a `role="group"` custom element, as a Graphic Order's is, and holds the Prompt, the
 * image with its hotspots and the pairs. The Hotspots and the Pairs are lists, so a swap to a flow
 * container takes the list joint rule's roles. The Outline is an `svg` that stays `aria-hidden`;
 * the Hidden input stays a hidden input of the name and value plate computed.
 */
const parts = {
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
    merged: [
      "aria-label",
      "data-area",
      "data-identifier",
      "data-match-group",
      "data-match-max",
      "data-paired",
    ],
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
  outline: {
    defaults: {},
    element: "svg",
    listOwner: false,
    merged: ["aria-hidden", "preserveAspectRatio", "viewBox"],
    tagClass: "any",
  },
  pair: {
    defaults: {},
    element: "li",
    listOwner: false,
    merged: ["data-pair"],
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
    element: "qti-prompt",
    listOwner: false,
    merged: ["id"],
    tagClass: "prompt",
  },
  root: {
    defaults: {},
    element: "qti-graphic-associate-interaction",
    listOwner: false,
    merged: [
      "role",
      "aria-labelledby",
      "aria-label",
      "aria-describedby",
      "class",
      "data-entry-name",
      "data-max-associations",
    ],
    tagClass: "flow-container",
  },
} satisfies { readonly [Q in GraphicAssociatePart]: PartSpec };

/**
 * The module's owner and parts, as {@link partRow} reads them.
 */
const spec = { owner, parts } as const;

/**
 * The row of every Graphic Associate part as placed: none of them depends on a placement.
 */
const rows = {
  hidden: partRow(spec, "hidden"),
  hotspot: partRow(spec, "hotspot"),
  hotspots: partRow(spec, "hotspots"),
  image: partRow(spec, "image"),
  outline: partRow(spec, "outline"),
  pair: partRow(spec, "pair"),
  pairs: partRow(spec, "pairs"),
  prompt: partRow(spec, "prompt"),
  root: partRow(spec, "root"),
} satisfies { readonly [Q in GraphicAssociatePart]: PartRow };

/**
 * The strings the renderer writes for Graphic Associate, by locale. A `{name}` is a placeholder
 * that {@link say} fills.
 */
const words = {
  en: {
    area: "Area {n} of {count}",
    atLeast: "Make at least {n} pairs.",
    atLeastOne: "Make at least 1 pair.",
    atMost: "Make at most {n} pairs.",
    atMostOne: "Make at most 1 pair.",
    matchMax: "Pair {name} with at most {n} other areas.",
    matchMaxOne: "Pair {name} with at most 1 other area.",
    matchMin: "Pair {name} with at least {n} other areas.",
    matchMinOne: "Pair {name} with at least 1 other area.",
    outside: "{name} cannot be paired with {other}; pair it with one of {allowed}.",
    pair: "{a} and {b}",
    pairs: "Pairs",
    self: "{name} is paired with itself; pair two different areas.",
    twice: "{a} and {b} are paired more than once; pair them once.",
    unknown: "Pair only the areas the image shows.",
  },
} as const satisfies Readonly<Record<Locale, Readonly<Record<string, string>>>>;

/**
 * The key of a string the renderer writes for Graphic Associate.
 */
type Word = keyof (typeof words)["en"];

/**
 * A `{name}` placeholder in a string of {@link words}; its one group is the name.
 */
const placeholder = /\{(?<name>[A-Za-z]+)\}/gu;

/**
 * Write Graphic Associate's text for a key in a locale, each placeholder filled.
 *
 * @param locale The locale of the renderer's own text.
 * @param key The string to write.
 * @param values The value of each `{name}` placeholder the string holds.
 * @returns The string, a placeholder with no value left as written.
 */
const say = (locale: Locale, key: Word, values: Readonly<Record<string, string>> = {}): string =>
  words[locale][key].replaceAll(placeholder, (whole, name: string) => values[name] ?? whole);

/**
 * A hotspot as the two steps that name one read it: its `hotspot-label`.
 */
interface Labelled {
  readonly label: Option.Option<string>;
}

/**
 * Give a hotspot's name: its `hotspot-label` when that holds anything but whitespace, else its
 * position, "Area 2 of 4".
 *
 * @param hotspots The interaction's hotspots, in document order.
 * @param index The hotspot's index among them.
 * @param locale The locale of the renderer's own text.
 * @returns The name the page shows and assistive technology reads.
 */
const nameOf = (hotspots: readonly Labelled[], index: number, locale: Locale): string => {
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
 * Give the name of each hotspot by its identifier.
 *
 * @param hotspots The interaction's hotspots, in document order.
 * @param locale The locale of the renderer's own text.
 * @returns Each identifier with the name {@link nameOf} gives it.
 */
const namesOf = (
  hotspots: readonly (Labelled & { readonly identifier: string })[],
  locale: Locale,
): ReadonlyMap<string, string> =>
  new Map(hotspots.map((hotspot, index) => [hotspot.identifier, nameOf(hotspots, index, locale)]));

/**
 * A pair of hotspot identifiers, in the order given.
 */
type Pair = readonly [string, string];

/**
 * Tell whether two pairs associate the same two hotspots, in either order.
 *
 * @param left One pair.
 * @param right The other.
 * @returns Whether they are the same association.
 */
const samePair = (left: Pair, right: Pair): boolean =>
  (left[0] === right[0] && left[1] === right[1]) || (left[0] === right[1] && left[1] === right[0]);

/**
 * Split a posted pair into its two sides, as a `pair` is written: two identifiers separated by
 * white space.
 *
 * @param pair The pair as posted.
 * @returns The two sides, none for a text that is not two identifiers.
 */
const sidesOf = (pair: string): Option.Option<Pair> => {
  const [a, b, ...rest] = splitTokens(pair);

  return a === undefined || b === undefined || rest.length > 0
    ? Option.none()
    : Option.some([a, b] as const);
};

/**
 * Give the sides of each `pair` single of a value, in order; a single of another base type, which
 * the declared `pair` binding never holds, gives none.
 *
 * @param singles The value's singles.
 * @returns The pairs.
 */
const pairsOf = (singles: readonly Single[]): readonly Pair[] =>
  singles.flatMap((single) => (single.baseType === "pair" ? [single.value] : []));

/**
 * Keep the pairs the page can show: each names two different hotspots, each association once at
 * its first place whichever order it came in, and at most as many as the interaction allows when
 * `max-associations` is above 0.
 *
 * @param interaction The hotspots and the most pairs.
 * @param interaction.hotspots The hotspots.
 * @param interaction.maxAssociations The most pairs; 0 is no limit.
 * @param given The pairs, in the order shown.
 * @returns The pairs the page shows, in order.
 */
const keptPairs = (
  interaction: {
    readonly hotspots: readonly { readonly identifier: string }[];
    readonly maxAssociations: bigint;
  },
  given: readonly Pair[],
): readonly Pair[] => {
  const known = new Set(interaction.hotspots.map((hotspot) => hotspot.identifier));
  const kept: Pair[] = [];

  for (const pair of given) {
    const [a, b] = pair;
    if (a !== b && known.has(a) && known.has(b) && !kept.some((seen) => samePair(seen, pair))) {
      kept.push(pair);
    }
  }

  return interaction.maxAssociations > 0n
    ? kept.slice(0, Number(interaction.maxAssociations))
    : kept;
};

/**
 * Give the value a restored or solved response shows: the stored pairs kept to the hotspots
 * ({@link keptPairs}), the value's type as it was.
 *
 * @param interaction The model node.
 * @param stored The stored or correct response.
 * @returns The value the interaction shows; a record, which a `pair` never is, as it was.
 */
const shownValue = (
  interaction: GraphicAssociateInteraction,
  stored: ResponseValue,
): ResponseValue => {
  if (isRecordValue(stored)) {
    return stored;
  }

  return {
    ...stored,
    values: keptPairs(interaction, pairsOf(stored.values)).map((pair): Single => ({
      baseType: "pair",
      value: pair,
    })),
  };
};

/**
 * Read one `qti-associable-hotspot`: its identifier, its geometry and coordinates, its
 * `hotspot-label` and its limits. A `template-identifier` is a mark, since no template value
 * reaches a module's `parse`.
 *
 * @param read The reader kit.
 * @param choice The `qti-associable-hotspot` element.
 * @returns The hotspot, or the refusal at its first attribute outside its type.
 */
const hotspotOf = (
  read: ReaderKit,
  choice: SourceElement,
): Result.Result<GraphicAssociateHotspot, Refusal> =>
  Result.gen(function* readHotspot() {
    read.markElement(choice);

    const identifier = yield* read.identifierAttribute(choice, "identifier");
    const written = yield* read.requiredAttribute(choice, "shape");
    const area = yield* read.listed(choice, "shape", written, areas);
    const coords = yield* read.coordsOf(choice);
    const matchMax = yield* read.countAttribute(choice, "match-max");
    const matchMin = yield* read.countAttribute(choice, "match-min");
    if (Option.isSome(read.valueOf(choice, "template-identifier"))) {
      read.mark(choice, "template-identifier");
    }

    return {
      area,
      coords: coords.map(([value, percent]) => ({ percent, value })),
      identifier,
      label: read.valueOf(choice, "hotspot-label"),
      matchGroup: Option.map(read.valueOf(choice, "match-group"), splitTokens),
      matchMax: Option.getOrElse(matchMax, () => 0n),
      matchMin: Option.getOrElse(matchMin, () => 0n),
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
  Record<Exclude<AssociableArea, "default">, (count: number) => Option.Option<readonly Axis[]>>
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
  coords: readonly AssociableCoordinate[],
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
 * @returns The shape, none for a radius of zero or less, which holds no point.
 */
const drawn = (
  area: Exclude<AssociableArea, "default">,
  numbers: readonly number[],
): Option.Option<Element> => {
  const [first = 0, second = 0, third = 0, fourth = 0] = numbers;

  switch (area) {
    case "circle": {
      return third > 0
        ? Option.some(h("circle", { cx: digits(first), cy: digits(second), r: digits(third) }))
        : Option.none();
    }
    case "ellipse": {
      return third > 0 && fourth > 0
        ? Option.some(
            h("ellipse", {
              cx: digits(first),
              cy: digits(second),
              rx: digits(third),
              ry: digits(fourth),
            }),
          )
        : Option.none();
    }
    case "poly": {
      const xs = numbers.filter((_, index) => index % 2 === 0);
      const ys = numbers.filter((_, index) => index % 2 === 1);

      return Option.some(
        h("polygon", {
          points: xs.map((x, index) => `${digits(x)},${digits(ys[index] ?? 0)}`).join(" "),
        }),
      );
    }
    case "rect": {
      return Option.some(
        h("rect", {
          height: digits(Math.abs(fourth - second)),
          width: digits(Math.abs(third - first)),
          x: digits(Math.min(first, third)),
          y: digits(Math.min(second, fourth)),
        }),
      );
    }
    default: {
      return area satisfies never;
    }
  }
};

/**
 * Draw one hotspot's area: the SVG shape its Outline holds.
 *
 * An area holds no drawing when its coordinates are too few for its geometry, when a radius is zero
 * or less, or when a percentage has no image size ({@link resolvedOf}); the `default` area covers
 * the image whatever it carries.
 *
 * @param hotspot The hotspot.
 * @param frame The image's size.
 * @returns The shape, none for an area that holds no point or cannot be placed.
 */
const drawingOf = (
  hotspot: GraphicAssociatePayloadHotspot,
  frame: Option.Option<Frame>,
): Option.Option<Element> => {
  const { area } = hotspot;
  if (area === "default") {
    return Option.some(h("rect", { height: "100%", width: "100%", x: "0", y: "0" }));
  }

  return axesOf[area](hotspot.coords.length).pipe(
    Option.flatMap((axes) => resolvedOf(hotspot.coords, axes, frame)),
    Option.flatMap((numbers) => drawn(area, numbers)),
  );
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
  names: Pick<GraphicAssociatePayload, "ariaLabel" | "ariaLabelledby">,
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
  readonly drawing: Option.Option<Element>;
  readonly hotspot: Attributes;
  readonly outline: Attributes;
}

/**
 * The attributes of every part of one Graphic Associate, computed once by {@link connectOf}.
 */
interface Props {
  /**
   * One per pair, in order; none when the page is not editable or the author disabled every
   * control, which post nothing.
   */
  readonly hidden: readonly Attributes[];
  /**
   * One per hotspot, in document order.
   */
  readonly hotspots: readonly HotspotProps[];
  readonly hotspotsList: Attributes;
  readonly image: Attributes;
  /**
   * One per pair, in order, each with the names of its two hotspots.
   */
  readonly pairItems: readonly TextProps[];
  readonly pairsList: Attributes;
  readonly prompt: Attributes;
  readonly root: Attributes;
}

/**
 * Write a pair as it is posted: its two identifiers separated by a space.
 *
 * @param pair The pair.
 * @returns The posted form.
 */
const postedOf = ([a, b]: Pair): string => `${a} ${b}`;

/**
 * Compute every attribute of every part of one Graphic Associate: the connect function.
 *
 * - Root: the marker, the state (`data-mode`, and `data-disabled` when the author disabled every
 *   control), `role="group"`, the author's `class`, the entry name and the most pairs the runtime
 *   reads, and the group's name: with a Prompt, `aria-labelledby` → the Prompt's id, else the
 *   author's `aria-label` and `aria-labelledby` ({@link authoredName}); `aria-describedby` → the
 *   message ids when the response is invalid.
 * - Hotspot: its name as `aria-label` (its `hotspot-label`, else "Area n of count"), its identifier
 *   as `data-identifier`, its geometry as `data-area`, which lets the theme draw a `default` area
 *   under the others, its `match-max` and, when written, its `match-group` for the runtime, and
 *   `data-paired` when a shown pair names it, so the theme can stroke it without colour alone.
 * - Outline: `aria-hidden`, and, when the image's size is known, `viewBox` of that size with
 *   `preserveAspectRatio="none"`, so it scales with the image.
 * - Pairs: `aria-label`; each Pair names its two hotspots and carries the pair as posted.
 * - Hidden: one per pair, only while the page is editable and not finished.
 *
 * @param interaction The Graphic Associate's payload.
 * @param payload The payload, which gives the instance, the mode, `finished` and the messages.
 * @param locale The locale of the renderer's own text.
 * @returns The attributes of every part.
 */
const connectOf = (
  interaction: GraphicAssociatePayload,
  payload: Payload,
  locale: Locale,
): Props => {
  const { instance } = payload;
  const frame = frameOf(interaction.image);
  const promptId = scopedId(instance, interaction.response, "prompt");
  const problems = payload.messages.filter((entry) => entry.response === interaction.response);
  const writes = payload.mode === "answering" && !payload.finished;
  const names = namesOf(interaction.hotspots, locale);
  const paired = new Set(interaction.pairs.flat());
  const nameFor = (identifier: string): string => names.get(identifier) ?? identifier;

  return {
    hidden: writes
      ? interaction.pairs.map((pair) => ({
          "data-slot": rows.hidden.slot,
          name: interaction.formName,
          type: "hidden",
          value: postedOf(pair),
        }))
      : [],
    hotspots: interaction.hotspots.map((hotspot, index): HotspotProps => ({
      drawing: drawingOf(hotspot, frame),
      hotspot: {
        "aria-label": nameOf(interaction.hotspots, index, locale),
        "data-area": hotspot.area,
        "data-identifier": hotspot.identifier,
        ...when(hotspot.matchGroup.length > 0, {
          "data-match-group": hotspot.matchGroup.join(" "),
        }),
        "data-match-max": String(hotspot.matchMax),
        ...when(paired.has(hotspot.identifier), { "data-paired": true }),
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
    })),
    hotspotsList: { "data-slot": rows.hotspots.slot },
    image: { "data-slot": rows.image.slot },
    pairItems: interaction.pairs.map((pair): TextProps => ({
      props: { "data-pair": postedOf(pair), "data-slot": rows.pair.slot },
      text: say(locale, "pair", { a: nameFor(pair[0]), b: nameFor(pair[1]) }),
    })),
    pairsList: { "aria-label": say(locale, "pairs"), "data-slot": rows.pairs.slot },
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
      "data-max-associations": String(interaction.maxAssociations),
      "data-mode": payload.mode,
      "data-slot": rows.root.slot,
      role: "group",
    },
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
  hidden: props.hidden,
  hotspot: props.hotspots.map(({ hotspot }) => hotspot),
  hotspots: props.hotspotsList,
  image: props.image,
  outline: props.hotspots.map(({ outline }) => outline),
  pair: props.pairItems,
  pairs: props.pairsList,
  prompt: props.prompt,
  root: props.root,
});

/**
 * Render a Graphic Associate: a Root holding the Prompt, when there is one, the image part with
 * its hotspots after the image, the Pairs, and one Hidden input per pair in order.
 *
 * The Prompt's and the image's content go through {@link emitNodes}, as the body's do, so they get
 * its id scoping, heading shift, URLs and Notices. Each part goes through `applyPart` with its
 * replacement from `state.parts`, so every swap holds I1 to I4. A hotspot whose area holds no
 * drawing is written with no Outline.
 *
 * @param interaction The Graphic Associate's payload.
 * @param payload The render's payload.
 * @param state The render's emit state.
 * @returns The Root, or the refusal of a part swap.
 */
const renderGraphicAssociate = (
  interaction: GraphicAssociatePayload,
  payload: Payload,
  state: EmitState,
): Result.Result<Element, PartSwapRefused> => {
  const props = connectOf(interaction, payload, state.locale);
  const emitContent = (
    nodes: readonly PayloadNode[],
  ): Result.Result<readonly Node[], PartSwapRefused> =>
    emitNodes(nodes, payload, state, nestedInteraction(owner));
  const place = (
    part: GraphicAssociatePart,
    attributes: Attributes,
    children: readonly Node[],
  ): Result.Result<Element, PartSwapRefused> =>
    applyPart(
      rows[part],
      attributes,
      children,
      Option.getOrUndefined(state.parts.replacementFor(owner, part)),
    );

  return Result.gen(function* graphicAssociateRoot() {
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
            entry.drawing.pipe(Option.map((figure) => place("outline", entry.outline, [figure]))),
          );

          return yield* place("hotspot", entry.hotspot, Option.toArray(outline));
        }),
      ),
    );
    const list = yield* place("hotspots", props.hotspotsList, hotspots);
    const frame = yield* place("image", props.image, [...image, list]);
    const items = yield* Result.all(
      props.pairItems.map((pair) => place("pair", pair.props, [text(pair.text)])),
    );
    const pairs = yield* place("pairs", props.pairsList, items);
    const hidden = yield* Result.all(
      props.hidden.map((attributes) => place("hidden", attributes, [])),
    );

    return yield* place("root", props.root, [...Option.toArray(prompt), frame, pairs, ...hidden]);
  });
};

/**
 * Count how often each identifier occurs.
 *
 * @param identifiers The identifiers, with repeats.
 * @returns Each identifier with its count.
 */
const countsOf = (identifiers: readonly string[]): ReadonlyMap<string, bigint> => {
  const counts = new Map<string, bigint>();

  for (const identifier of identifiers) {
    counts.set(identifier, (counts.get(identifier) ?? 0n) + 1n);
  }

  return counts;
};

/**
 * Check a Graphic Associate's response, which the caller decoded, in two tiers.
 *
 * - A {@link Malformed} input: `atMost` 1 when a single response was posted more than once, else the
 *   pairs did not decode, so a hotspot the image does not show.
 * - Tier (a), always: every identifier names a hotspot (one message), no hotspot pairs with itself,
 *   no association is given twice in either order, no hotspot is in more pairs than its `match-max`
 *   (0 is no limit), no pair is outside a `match-group` either side names, and `max-associations`
 *   above 0 caps the pairs. Each message but the first names the hotspots by their labels or
 *   positions.
 * - Tier (b), only under `validateResponses`: `min-associations`, and each hotspot's `match-min`.
 *
 * @param interaction The Graphic Associate.
 * @param input The decoded value, or why the entries did not decode.
 * @param configuration The configuration, which gives the locale and `validateResponses`.
 * @returns One message per problem, none when the response is accepted.
 */
const validateGraphicAssociate = (
  interaction: GraphicAssociateInteraction,
  input: Value | Malformed,
  configuration: Configuration,
): readonly ValidationMessage[] => {
  const { locale } = configuration;
  const problem = (written: string): ValidationMessage => ({
    response: interaction.response,
    text: written,
  });
  const bound = (n: bigint, one: Word, many: Word, values: Record<string, string> = {}): string =>
    n === 1n ? say(locale, one, values) : say(locale, many, { ...values, n: numeral(locale, n) });

  if (input instanceof Malformed) {
    return [
      input.reason === "single-many"
        ? problem(bound(1n, "atMostOne", "atMost"))
        : problem(say(locale, "unknown")),
    ];
  }

  const pairs = pairsOf(input.values);
  const names = namesOf(interaction.hotspots, locale);
  const nameFor = (identifier: string): string => names.get(identifier) ?? identifier;
  const groups = new Map(
    interaction.hotspots.map((hotspot) => [hotspot.identifier, hotspot.matchGroup]),
  );
  const stray = pairs.some(([a, b]) => !names.has(a) || !names.has(b));
  const selves = [...new Set(pairs.filter(([a, b]) => a === b).map(([a]) => a))];
  const repeated = pairs.filter(
    (pair, index) => pairs.findIndex((earlier) => samePair(earlier, pair)) !== index,
  );
  const twice = repeated.filter(
    (pair, index) => repeated.findIndex((earlier) => samePair(earlier, pair)) === index,
  );
  const perHotspot = countsOf(pairs.flat());
  const groupOf = (side: string): readonly string[] =>
    Option.getOrElse(groups.get(side) ?? Option.none(), (): readonly string[] => []);
  const excludes = (side: string, other: string): boolean => {
    const group = groupOf(side);

    return group.length > 0 && !group.includes(other);
  };
  const outside = pairs.flatMap(([a, b]): readonly Pair[] => {
    if (a === b) {
      return [];
    }

    if (excludes(a, b)) {
      return [[a, b]];
    }

    return excludes(b, a) ? [[b, a]] : [];
  });
  const count = BigInt(pairs.length);
  const tierA = [
    ...(stray ? [problem(say(locale, "unknown"))] : []),
    ...selves.map((identifier) => problem(say(locale, "self", { name: nameFor(identifier) }))),
    ...twice.map(([a, b]) => problem(say(locale, "twice", { a: nameFor(a), b: nameFor(b) }))),
    ...interaction.hotspots.flatMap((hotspot) =>
      hotspot.matchMax > 0n && (perHotspot.get(hotspot.identifier) ?? 0n) > hotspot.matchMax
        ? [
            problem(
              bound(hotspot.matchMax, "matchMaxOne", "matchMax", {
                name: nameFor(hotspot.identifier),
              }),
            ),
          ]
        : [],
    ),
    ...outside.map(([side, other]) =>
      problem(
        say(locale, "outside", {
          allowed: groupOf(side).map(nameFor).join(", "),
          name: nameFor(side),
          other: nameFor(other),
        }),
      ),
    ),
    ...(interaction.maxAssociations > 0n && count > interaction.maxAssociations
      ? [problem(bound(interaction.maxAssociations, "atMostOne", "atMost"))]
      : []),
  ];

  if (!configuration.validateResponses) {
    return tierA;
  }

  return [
    ...tierA,
    ...(count < interaction.minAssociations
      ? [problem(bound(interaction.minAssociations, "atLeastOne", "atLeast"))]
      : []),
    ...interaction.hotspots.flatMap((hotspot) =>
      (perHotspot.get(hotspot.identifier) ?? 0n) < hotspot.matchMin
        ? [
            problem(
              bound(hotspot.matchMin, "matchMinOne", "matchMin", {
                name: nameFor(hotspot.identifier),
              }),
            ),
          ]
        : [],
    ),
  ];
};

/**
 * The elements of the image the interaction holds, by the part of the region that holds them.
 *
 * @param interaction The model node.
 * @returns The Prompt's region, when it has a Prompt, then the image's.
 */
const ownRegions = (interaction: GraphicAssociateInteraction): readonly OwnRegion[] => [
  ...Option.toArray(interaction.prompt).map((nodes): OwnRegion => ({
    choice: Option.none(),
    nodes,
    part: "prompt",
    written: "nodes",
  })),
  { choice: Option.none(), nodes: interaction.image, part: "content", written: "nodes" },
];

/**
 * Copy a Graphic Associate's model node into its payload node: its content through the kit, the
 * entry name the host chose, and the pairs the view shows.
 *
 * The pairs are the strings a refused post sent when the view restores one, else the values the
 * view shows ({@link RedactKit.shown}), each kept to the hotspots ({@link keptPairs}): a posted
 * string that is not two identifiers, a pair that names no hotspot or a hotspot with itself is not
 * shown, and an association twice is shown once, at its first place.
 *
 * @param interaction The model node.
 * @param kit What the payload hands a module's `redact`.
 * @returns The payload node.
 */
const redactGraphicAssociate = (
  interaction: GraphicAssociateInteraction,
  kit: RedactKit,
): GraphicAssociatePayload => ({
  ariaLabel: interaction.ariaLabel,
  ariaLabelledby: interaction.ariaLabelledby,
  class: interaction.class,
  formName: kit.formName(interaction.response),
  hotspots: interaction.hotspots.map((hotspot) => ({
    area: hotspot.area,
    coords: hotspot.coords,
    identifier: hotspot.identifier,
    label: hotspot.label,
    matchGroup: Option.getOrElse(hotspot.matchGroup, (): readonly string[] => []),
    matchMax: hotspot.matchMax,
  })),
  image: kit.nodes(interaction.image),
  maxAssociations: interaction.maxAssociations,
  pairs: keptPairs(
    interaction,
    Option.match(kit.posted(interaction.response), {
      onNone: () => pairsOf(kit.shown(interaction.response)),
      onSome: (posted) => posted.flatMap((pair) => Option.toArray(sidesOf(pair))),
    }),
  ),
  prompt: interaction.prompt.pipe(Option.map(kit.nodes)),
  response: interaction.response,
});

/**
 * The Graphic Associate module: reads `qti-graphic-associate-interaction`, copies, renders and
 * checks it.
 */
export const graphicAssociateModule: InteractionModule<
  "graphic-associate",
  GraphicAssociateInteraction,
  GraphicAssociatePayload,
  GraphicAssociatePart,
  GraphicAssociateJson
> = {
  /**
   * The one response Graphic Associate binds, a `pair`, which posts identifiers and so has no
   * number base.
   */
  bindings: (interaction) => [{ base: Option.none(), response: interaction.response }],
  /**
   * Graphic Associate's connect function: the attributes of every part, by part key.
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
  kind: "graphic-associate",
  /**
   * The NULL of Graphic Associate's binding: a `pair` of the declared cardinality with no value.
   */
  nullValue: (interaction) => nullOf("pair", interaction.cardinality),
  owner,
  /**
   * Read `qti-graphic-associate-interaction`: the notice when its response is not a `pair` of
   * `single` or `multiple` cardinality; the refusal `undeclared-response` when it names no
   * declaration; otherwise its Prompt, its image, its `qti-associable-hotspot` children and the
   * bounds it wrote.
   */
  parse: (source, context) => {
    const { read } = context;

    return Result.gen(function* readGraphicAssociate() {
      const response = yield* read.requiredAttribute(source, "response-identifier");
      const declaration = read.bound;
      if (Option.isNone(declaration)) {
        return yield* Result.fail(
          read.refusal("undeclared-response", attributePath(context.path, response), {
            response: read.identifierOf(response.value),
          }),
        );
      }

      const cardinality = Option.getOrUndefined(declaration.value.cardinality);
      if (
        !Option.contains(declaration.value.baseType, "pair") ||
        (cardinality !== "multiple" && cardinality !== "single")
      ) {
        return yield* context.notice(element);
      }

      read.markElement(source);

      const maxAssociations = yield* read.countAttribute(source, "max-associations");
      const minAssociations = yield* read.countAttribute(source, "min-associations");
      const prompt = yield* read.content(source, "qti-prompt");
      const imageElement = Arr.findFirst(read.elementsOf(source), (child) =>
        imageTags.some((tag) => read.isQti(child, tag)),
      );
      const image = yield* Option.match(imageElement, {
        onNone: () => Result.succeed<readonly BodyNode[]>([]),
        onSome: (child) => read.nodes(source, { children: [child] }),
      });
      const hotspots: GraphicAssociateHotspot[] = [];
      for (const choice of read.childrenNamed(source, "qti-associable-hotspot")) {
        hotspots.push(yield* hotspotOf(read, choice));
      }

      return {
        ariaLabel: read.valueOf(source, "aria-label"),
        ariaLabelledby: read.valueOf(source, "aria-labelledby"),
        cardinality,
        class: Option.getOrElse(read.valueOf(source, "class"), () => ""),
        hotspots,
        image,
        kind: "graphic-associate" as const,
        maxAssociations: Option.getOrElse(maxAssociations, () => 1n),
        minAssociations: Option.getOrElse(minAssociations, () => 0n),
        path: context.path,
        prompt,
        response: read.identifierOf(response.value),
      };
    });
  },
  /**
   * The rows of Graphic Associate's parts, by part key.
   */
  parts,
  /**
   * The codec of the model node's JSON form: each `Option` an optional key, the counts as decimal
   * digits, every coordinate a finite number, no path.
   */
  payloadSchema: ({ BodyNodes, Count, NoPath, OptionalText, Schema }) =>
    Schema.Struct({
      ariaLabel: OptionalText,
      ariaLabelledby: OptionalText,
      cardinality: Schema.Literals(["multiple", "single"]),
      class: Schema.String,
      hotspots: Schema.Array(
        Schema.Struct({
          area: Schema.Literals(areas),
          coords: Schema.Array(Schema.Struct({ percent: Schema.Boolean, value: Schema.Finite })),
          identifier: Schema.String,
          label: OptionalText,
          matchGroup: Schema.OptionFromOptionalKey(Schema.Array(Schema.String)),
          matchMax: Count,
          matchMin: Count,
        }),
      ),
      image: BodyNodes,
      kind: Schema.Literal("graphic-associate"),
      maxAssociations: Count,
      minAssociations: Count,
      path: NoPath,
      prompt: Schema.OptionFromOptionalKey(BodyNodes),
      response: Schema.String,
    }),
  /**
   * Graphic Associate's payload copy: {@link redactGraphicAssociate}.
   */
  redact: redactGraphicAssociate,
  /**
   * The Prompt's region, when it has a Prompt, then the image's.
   */
  regions: ownRegions,
  /**
   * Render a Graphic Associate: its Root holding the Prompt, the image with its hotspots, the
   * pairs and, while the page accepts input, one hidden input per pair.
   */
  render: renderGraphicAssociate,
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
   * The value Graphic Associate shows for a stored response: the pairs kept to its hotspots.
   */
  restore: shownValue,
  /**
   * No shuffle: a Graphic Associate presents its hotspots in document order.
   */
  sequence: () => Option.none(),
  /**
   * The value Graphic Associate shows for the correct response: the pairs kept to its hotspots.
   */
  solution: shownValue,
  /**
   * The renderer names no Control of a Graphic Associate, since it renders none.
   */
  unnamed: () => false,
  /**
   * Check a Graphic Associate's response: {@link validateGraphicAssociate}.
   */
  validate: validateGraphicAssociate,
};

/**
 * Position Object (Q-17, the `position-object` kind): `qti-position-object-interaction` read into
 * its model node, its `qti-position-object-stage` read as the module's container, both copied into
 * their payload nodes, rendered without script, and checked.
 *
 * A Position Object is an object image the candidate places on a stage image, one or more times;
 * its response is a `point` (`single` or `multiple`), each point the place on the stage the
 * object's centre point lands on. The stage is no interaction of its own: it is the element the
 * module owns as the container of its interactions ({@link ModuleContainer}), and the body walk
 * reads it through the module's `container` member and nothing else. The Stage part wraps the
 * stage image and every interaction inside it, and carries the stage's size as `data-width` and
 * `data-height`; each interaction's Root carries `data-entry-name`, `data-min-choices`,
 * `data-max-choices` and `data-center-point`, the effective centre point as `x y`.
 *
 * Without script the interaction is its object image, and one group of two number inputs per
 * position the candidate may place, x then y, each bounded by the stage's size (`min="0"`, `max`
 * the stage's width or height, `step="1"`) and named by the entry name's point entries
 * (`pointEntryNames` in `#plate/form/encoding.ts`): the native inputs' entries are the wire (D2),
 * and the number inputs are the script-free path (D3). The object is drawn on the stage once per
 * position both coordinates of which are whole numbers: an SVG `image` of the object, in an `svg`
 * over the stage whose `viewBox` is the stage's size, placed by its `x` and `y` attributes, the
 * position less the centre point, so it carries no `style`, which plate's Content Security Policy
 * refuses. The `svg` is `aria-hidden`: a screen reader hears each position in its inputs.
 *
 * How many groups the page renders: the effective `max-choices` when it is above zero, else
 * `min-choices`, and at least one; more when the view shows more positions, which the check then
 * refuses. A refused post's strings fill the inputs in posted order, x then y per position, so a
 * half-written position comes back as it was typed. The check ({@link validatePositionObject})
 * always caps the count at `max-choices`; it holds a point to the stage's edge, and the count to
 * `min-choices`, only under `validateResponses`, since the area mapping maps a point anywhere.
 *
 * It follows two readings of `docs/spec-readings.md`, each cited by its wording:
 *
 * - "An area mapping maps points." The response is a point and only a point: `open` gives the notice
 *   for an interaction whose response is not a `single` or `multiple` `point`.
 * - "An area mapping holds a point on a shape's boundary, maps a point by the first area listed that
 *   holds it, maps each area once, and adds `default-value` once for each distinct point in no
 *   area." The engine scores it so (`qti-map-response-point`); the module renders no area of the
 *   mapping and hints at none, so the page shows nothing of the correct response.
 *
 * Beyond those readings, the module decides three defaults, each a notice rather than a guess:
 *
 * - A stage whose first element child is no image (`img`, `picture` or `object`), whose image writes
 *   no positive `width` and `height`, or which holds no interaction of this kind gives the notice
 *   `qti-position-object-stage`: without the image's size no input has a bound and no marker a
 *   place.
 * - An interaction outside any stage gives the notice `qti-position-object-interaction`: it has no
 *   stage to be placed on.
 * - An interaction whose object image writes no `width` and `height` while it writes no
 *   `center-point` gives the same notice: the centre point defaults to the object's centre, which
 *   needs its size.
 *
 * Strings the renderer writes here live in this module, in English ({@link words}), except the
 * Q10 name of an unnamed Root, which every interaction shares (`#plate/messages.ts`).
 *
 * @module
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#Root_PositionObjectInteraction
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/spinbutton/
 */
import { Array as Arr, Option, Result } from "effect";
import { attributePath } from "#plate/document/source.ts";
import type { SourceElement } from "#plate/document/source.ts";
import { emitNodes, nestedInteraction } from "#plate/emit/body.ts";
import { h, text, when } from "#plate/emit/node.ts";
import type { Attributes, Element, Node } from "#plate/emit/node.ts";
import { authoredIdrefs } from "#plate/emit/parts.ts";
import type { PartRow } from "#plate/emit/parts.ts";
import { applyPart } from "#plate/emit/swap.ts";
import type { PartSwapRefused } from "#plate/emit/swap.ts";
import { Malformed, pointEntryNames } from "#plate/form/encoding.ts";
import { partRow } from "#plate/interactions/contract.ts";
import type {
  Connected,
  InteractionModule,
  ModuleContainer,
  ModuleInteraction,
  OwnRegion,
  ParseContext,
  PartSpec,
  ReaderKit,
  RedactKit,
  TextProps,
} from "#plate/interactions/contract.ts";
import type { SchemaKit } from "#plate/codec/redacted.ts";
import { message, numeral } from "#plate/messages.ts";
import type { Locale } from "#plate/messages.ts";
import type { BodyNode, ContainerNode } from "#plate/model/item.ts";
import { classifyUrl, formatUrl, urlContextOf } from "#plate/model/url.ts";
import { nullOf, trimXmlSpace } from "#plate/model/values.ts";
import type { Single, Value } from "#plate/model/values.ts";
import type {
  ContainerPayload,
  EmitState,
  ModulePayloadOf,
  Payload,
  PayloadNode,
  UnnamedPosition,
  ValidationMessage,
} from "#plate/payload.ts";
import type { Refusal } from "#plate/validate/refusal.ts";

/**
 * The owner of every Position Object part in the part table.
 */
const owner = "position-object-interaction";

/**
 * Position Object's identifier in the QTI 3.0 conformance list, Appendix A.
 */
const feature = "Q-17";

/**
 * The QTI element Position Object is read from, which its notice names.
 */
const element = "qti-position-object-interaction";

/**
 * The QTI element the module owns as the container of its interactions, which its notice names.
 */
const stageElement = "qti-position-object-stage";

/**
 * The elements the stage image and the object image may be, as the XSD lists them.
 */
const imageTags = ["img", "object", "picture"] as const;

/**
 * The cardinalities a Position Object's response may have: one point, or several.
 */
const cardinalities = ["multiple", "single"] as const;

/**
 * A size in pixels, as an image's `width` and `height` attributes write it.
 */
export interface ImageSize {
  readonly height: number;
  readonly width: number;
}

/**
 * The model node of `qti-position-object-interaction` (Q-17, `position-object`).
 *
 * `centerPoint` is the effective centre point: the author's `center-point`, else the centre of the
 * object image's box. `stage` is the size of the stage image, set by the stage's container `parse`
 * once it has read the interaction inside it; none on a node the stage has not yet adopted, which
 * the body walk hands to the stage's `parse` and no hub reads.
 */
export interface PositionObjectInteraction extends ModuleInteraction<"position-object"> {
  readonly cardinality: (typeof cardinalities)[number];
  readonly centerPoint: readonly [x: number, y: number];
  /**
   * The author's `class` value, empty when absent.
   */
  readonly class: string;
  readonly maxChoices: Option.Option<bigint>;
  readonly minChoices: Option.Option<bigint>;
  /**
   * The object image, the one image element of the interaction and its subtree.
   */
  readonly object: readonly BodyNode[];
  readonly stage: Option.Option<ImageSize>;
}

/**
 * One position as the view shows it: the two coordinates as the inputs' values, each empty when
 * the view gives none.
 */
export interface ShownPosition {
  readonly x: string;
  readonly y: string;
}

/**
 * A Position Object as the page may know it (Q-17, `position-object`): what the model node holds
 * of the object, the effective bounds, the stage's size, the name its inputs post under, and the
 * positions the view shows. It holds no correct response: `positions` is the stored, posted or
 * solution value the view gave.
 */
export interface PositionObjectPayload {
  readonly ariaLabel: Option.Option<string>;
  readonly ariaLabelledby: Option.Option<string>;
  /**
   * Whether the first input takes `autofocus`: the interaction is the first one a validation
   * message names.
   */
  readonly autofocus: boolean;
  readonly cardinality: (typeof cardinalities)[number];
  readonly centerPoint: readonly [x: number, y: number];
  readonly class: string;
  /**
   * The name its inputs post under: the view's name for the response, else
   * `entryName(instance, response)`; each input's `name` is one of its point entries.
   */
  readonly formName: string;
  /**
   * The effective `max-choices`: the author's, else 1; zero is no bound.
   */
  readonly maxChoices: bigint;
  /**
   * The effective `min-choices`: the author's, else 0.
   */
  readonly minChoices: bigint;
  readonly object: readonly PayloadNode[];
  /**
   * The positions the view shows, in order: a refused post's strings paired x then y, else the
   * values shown.
   */
  readonly positions: readonly ShownPosition[];
  /**
   * The identifier of the response it binds.
   */
  readonly response: string;
  readonly stage: ImageSize;
  /**
   * Where the Root stands among the Controls the renderer names (Q10), set exactly when the author
   * named it by neither `aria-label` nor `aria-labelledby`.
   */
  readonly unnamed: Option.Option<UnnamedPosition>;
}

/**
 * The JSON form of a body-node list, as the codec writes the object's content.
 */
type BodyNodesJson = SchemaKit["BodyNodes"]["Encoded"];

/**
 * A Position Object in the redacted JSON form: each `Option` an optional key, each count as decimal
 * digits, no path.
 */
export interface PositionObjectJson {
  readonly ariaLabel?: string;
  readonly ariaLabelledby?: string;
  readonly cardinality: (typeof cardinalities)[number];
  readonly centerPoint: readonly [number, number];
  readonly class: string;
  readonly kind: "position-object";
  readonly maxChoices?: string;
  readonly minChoices?: string;
  readonly object: BodyNodesJson;
  readonly response: string;
  readonly stage?: ImageSize;
}

/**
 * A part of Position Object, by the key a host's override and the part table name it.
 */
export type PositionObjectPart =
  | "marker"
  | "markers"
  | "object"
  | "point"
  | "points"
  | "root"
  | "stage"
  | "x"
  | "y";

/**
 * The rows of Position Object's parts, each declared once; {@link partRow} derives the owner, the
 * key and the `data-slot` marker.
 *
 * The Stage is the container's element, a flow container that holds the stage image and every
 * Root inside it. The Root is a `role="group"` custom element holding the Object, a `div` around
 * the object image, the Markers, an `svg` over the stage that stays `aria-hidden` and holds one
 * Marker, an SVG `image`, per placed position, and the Points, a `div` holding one Point per
 * position, a `fieldset` whose legend numbers it and which holds the two number inputs, X and Y.
 */
const parts = {
  marker: {
    defaults: {},
    element: "image",
    listOwner: false,
    merged: ["href", "x", "y", "width", "height", "data-position"],
    tagClass: "any",
  },
  markers: {
    defaults: {},
    element: "svg",
    listOwner: false,
    merged: ["aria-hidden", "viewBox", "width", "height"],
    tagClass: "any",
  },
  object: {
    defaults: {},
    element: "div",
    listOwner: false,
    merged: [],
    tagClass: "flow-container",
  },
  point: {
    defaults: {},
    element: "fieldset",
    legendOwner: true,
    listOwner: false,
    merged: ["data-position"],
    tagClass: "fieldset",
  },
  points: {
    defaults: {},
    element: "div",
    listOwner: false,
    merged: [],
    tagClass: "flow-container",
  },
  root: {
    defaults: {},
    element,
    listOwner: false,
    merged: [
      "role",
      "aria-labelledby",
      "aria-label",
      "class",
      "data-entry-name",
      "data-min-choices",
      "data-max-choices",
      "data-center-point",
    ],
    tagClass: "flow-container",
  },
  stage: {
    defaults: {},
    element: stageElement,
    listOwner: false,
    merged: ["data-width", "data-height"],
    tagClass: "flow-container",
  },
  x: {
    defaults: {},
    element: "input",
    listOwner: false,
    merged: [
      "name",
      "type",
      "value",
      "min",
      "max",
      "step",
      "aria-label",
      "aria-describedby",
      "aria-invalid",
      "disabled",
      "autofocus",
      "autocomplete",
    ],
    tagClass: "native-input",
  },
  y: {
    defaults: {},
    element: "input",
    listOwner: false,
    merged: [
      "name",
      "type",
      "value",
      "min",
      "max",
      "step",
      "aria-label",
      "aria-describedby",
      "aria-invalid",
      "disabled",
      "autocomplete",
    ],
    tagClass: "native-input",
  },
} satisfies { readonly [Q in PositionObjectPart]: PartSpec };

/**
 * The module's owner and parts, as {@link partRow} reads them.
 */
const spec = { owner, parts } as const;

/**
 * The row of every Position Object part as placed: none of them depends on a placement.
 */
const rows = {
  marker: partRow(spec, "marker"),
  markers: partRow(spec, "markers"),
  object: partRow(spec, "object"),
  point: partRow(spec, "point"),
  points: partRow(spec, "points"),
  root: partRow(spec, "root"),
  stage: partRow(spec, "stage"),
  x: partRow(spec, "x"),
  y: partRow(spec, "y"),
} satisfies { readonly [Q in PositionObjectPart]: PartRow };

/**
 * The strings the renderer writes for Position Object, by locale. A `{name}` is a placeholder
 * that {@link say} fills.
 */
const words = {
  en: {
    atLeast: "Place the object at least {n} times.",
    atLeastOne: "Place the object at least once.",
    atMost: "Place the object at most {n} times.",
    atMostOne: "Place the object at most once.",
    halfPoint: "Give each position as two whole numbers, x and y.",
    offStage: "Place each position on the stage: x from 0 to {width}, y from 0 to {height}.",
    position: "Position {n}",
    x: "Horizontal position, 0 to {max}",
    y: "Vertical position, 0 to {max}",
  },
} as const satisfies Readonly<Record<Locale, Readonly<Record<string, string>>>>;

/**
 * The key of a string the renderer writes for Position Object.
 */
type Word = keyof (typeof words)["en"];

/**
 * A `{name}` placeholder in a string of {@link words}; its one group is the name.
 */
const placeholder = /\{(?<name>[A-Za-z]+)\}/gu;

/**
 * Write Position Object's text for a key in a locale, each placeholder filled.
 *
 * @param locale The locale of the renderer's own text.
 * @param key The string to write.
 * @param values The value of each `{name}` placeholder the string holds.
 * @returns The string, a placeholder with no value left as written.
 */
const say = (locale: Locale, key: Word, values: Readonly<Record<string, string>> = {}): string =>
  words[locale][key].replaceAll(placeholder, (whole, name: string) => values[name] ?? whole);

/**
 * A whole number as an attribute or an input writes it: optional sign, digits, and nothing else
 * but surrounding whitespace.
 */
const wholeNumber = /^\s*-?[0-9]+\s*$/u;

/**
 * Read a whole number from text, none when the text is not one.
 *
 * @param value The text.
 * @returns The number.
 */
const wholeOf = (value: string): Option.Option<number> =>
  wholeNumber.test(value) ? Option.some(Number(value.trim())) : Option.none();

/**
 * Read a positive dimension from an attribute list, by name.
 *
 * @param attributes The element's attributes, as the model or the payload holds them.
 * @param name `width` or `height`.
 * @returns The dimension, none when the attribute is absent, not a whole number, or not positive.
 */
const dimensionOf = (
  attributes: readonly { readonly name: string; readonly value: string }[],
  name: "height" | "width",
): Option.Option<number> =>
  Option.fromUndefinedOr(attributes.find((attribute) => attribute.name === name)).pipe(
    Option.flatMap(({ value }) => wholeOf(value)),
    Option.filter((value) => value > 0),
  );

/**
 * A node of the model or the payload, as far as the image helpers read it: its kind.
 */
interface NodeLike {
  readonly kind: string;
}

/**
 * An element of the model (`BodyElement`) or the payload (`ElementPayload`), as far as the image
 * helpers read it: its tag, its attributes and its children.
 */
interface ElementLike extends NodeLike {
  readonly attributes: readonly { readonly name: string; readonly value: string }[];
  readonly children: readonly NodeLike[];
  readonly kind: "element";
  readonly tag: string;
}

/**
 * Tell whether a node is an element.
 *
 * @param node The node.
 * @returns Whether it is an element, of the model or the payload.
 */
const isElementLike = (node: NodeLike): node is ElementLike => node.kind === "element";

/**
 * Find the image element among body or payload nodes: the first `img` at any depth, else the
 * first `object`. A `picture` is found by the `img` it holds.
 *
 * @param nodes The image's nodes.
 * @returns The element, none when there is none.
 */
const imageElementOf = (nodes: readonly NodeLike[]): Option.Option<ElementLike> => {
  const found = (tag: string, within: readonly NodeLike[]): Option.Option<ElementLike> => {
    for (const node of within) {
      if (isElementLike(node)) {
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
 * @param nodes The image's nodes.
 * @returns The size.
 */
const sizeOf = (nodes: readonly NodeLike[]): Option.Option<ImageSize> =>
  Option.flatMap(imageElementOf(nodes), (image) =>
    Option.all({
      height: dimensionOf(image.attributes, "height"),
      width: dimensionOf(image.attributes, "width"),
    }),
  );

/**
 * Give the URL the Marker draws the object from: the object image's `src` (`img`) or `data`
 * (`object`), rebased on the asset base as the emitter writes the image's own, none when the
 * image has no URL or `url.ts` drops it.
 *
 * @param object The object's payload nodes.
 * @param assetBase The asset base of the render.
 * @returns The URL to write as `href`.
 */
const objectUrlOf = (object: readonly PayloadNode[], assetBase: string): Option.Option<string> =>
  Option.flatMap(imageElementOf(object), (image) => {
    const attribute = image.tag === "object" ? "data" : "src";

    return Option.flatMap(
      Option.fromUndefinedOr(image.attributes.find((entry) => entry.name === attribute)),
      ({ value }) =>
        Option.flatMap(urlContextOf(image.tag, attribute), (context) => {
          const url = classifyUrl(context, value);

          return url.kind === "dropped" ? Option.none() : Option.some(formatUrl(url, assetBase));
        }),
    );
  });

/**
 * The effective bounds of a Position Object: how many times the object may be placed, at most and
 * at least. A `max` of zero is no bound.
 */
interface Bounds {
  readonly max: bigint;
  readonly min: bigint;
}

/**
 * Give the effective bounds of a Position Object: the author's `max-choices`, else 1, and the
 * author's `min-choices`, else 0.
 *
 * @param interaction The model node.
 * @returns The bounds; a `max` of zero is no bound.
 */
const boundsOf = (
  interaction: Pick<PositionObjectInteraction, "maxChoices" | "minChoices">,
): Bounds => ({
  max: Option.getOrElse(interaction.maxChoices, () => 1n),
  min: Option.getOrElse(interaction.minChoices, () => 0n),
});

/**
 * How many groups of inputs the page renders: the effective `max-choices` when it is above zero,
 * else the effective `min-choices`, and at least one; more when the view shows more positions.
 *
 * @param bounds The effective bounds.
 * @param shown How many positions the view shows.
 * @returns The number of groups.
 */
const groupsOf = (bounds: Bounds, shown: number): number =>
  Math.max(Number(bounds.max > 0n ? bounds.max : bounds.min), 1, shown);

/**
 * Pair a refused post's strings into positions, x then y per position; a trailing string is an x
 * with an empty y.
 *
 * @param posted The strings, in posted order.
 * @returns The positions.
 */
const pairedOf = (posted: readonly string[]): readonly ShownPosition[] =>
  Arr.makeBy(Math.ceil(posted.length / 2), (index) => ({
    x: posted[index * 2] ?? "",
    y: posted[index * 2 + 1] ?? "",
  }));

/**
 * Give the positions a list of values shows: each point as its two coordinates, a value of any
 * other type as nothing.
 *
 * @param values The values shown.
 * @returns The positions.
 */
const shownOf = (values: readonly Single[]): readonly ShownPosition[] =>
  values.flatMap((single) =>
    single.baseType === "point" ? [{ x: String(single.value[0]), y: String(single.value[1]) }] : [],
  );

/**
 * Give the author's name of a Root: `aria-label` when it holds anything but whitespace, and
 * `aria-labelledby` where an element of the item carries one of its ids.
 *
 * @param names The interaction's `ariaLabel` and `ariaLabelledby`.
 * @param instance The item instance key, which scopes the ids.
 * @returns The naming attributes, none when the author gave none that applies.
 */
const authoredName = (
  names: Pick<PositionObjectPayload, "ariaLabel" | "ariaLabelledby">,
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
 * The attributes the connect function computes for one position's parts.
 */
interface PositionProps {
  /**
   * The legend that numbers the Point, plain markup rather than a part.
   */
  readonly legend: TextProps;
  /**
   * The Marker, none when either coordinate is not a whole number or the object has no URL.
   */
  readonly marker: Option.Option<Attributes>;
  readonly point: Attributes;
  readonly x: Attributes;
  readonly y: Attributes;
}

/**
 * The attributes of every part of one Position Object, computed once by {@link connectOf}.
 */
interface Props {
  readonly markers: Attributes;
  readonly object: Attributes;
  readonly points: Attributes;
  /**
   * One per group of inputs, in order.
   */
  readonly positions: readonly PositionProps[];
  readonly root: Attributes;
}

/**
 * Compute every attribute of every part of one Position Object: the connect function.
 *
 * - Root: the marker, the state (`data-mode`, and `data-disabled` when the author disabled every
 *   control), `role="group"`, the author's `class`, the entry name, the effective bounds and the
 *   effective centre point the runtime reads, and the group's name: the author's `aria-label` and
 *   `aria-labelledby` ({@link authoredName}), else the Q10 name when the renderer names it.
 * - Markers: `aria-hidden`, the stage's size as `viewBox`, `width` and `height`.
 * - Marker: the object's URL as `href`, its size, and `x` and `y`: the position less the centre
 *   point, so the centre point lands on the position.
 * - Point: its position as `data-position`; its legend numbers it.
 * - X and Y: `type="number"`, the point entry's name, the value shown, `min="0"`, `max` the stage's
 *   width or height, `step="1"`, a name that says which axis and the bound, `autocomplete="off"`,
 *   `disabled` unless the page accepts input, and, when the response is invalid, `aria-invalid` and
 *   `aria-describedby` → the message ids; the first X takes `autofocus` when the view says so.
 *
 * @param interaction The Position Object's payload.
 * @param payload The payload, which gives the instance, the mode, `finished` and the messages.
 * @param locale The locale of the renderer's own text.
 * @param assetBase The asset base the Marker's `href` is rebased on; empty for a bare connect.
 * @returns The attributes of every part.
 */
const connectOf = (
  interaction: PositionObjectPayload,
  payload: Payload,
  locale: Locale,
  assetBase: string,
): Props => {
  const { instance } = payload;
  const { stage } = interaction;
  const problems = payload.messages.filter((entry) => entry.response === interaction.response);
  const writes = payload.mode === "answering" && !payload.finished;
  const [xName, yName] = pointEntryNames(interaction.formName);
  const url = objectUrlOf(interaction.object, assetBase);
  const objectSize = sizeOf(interaction.object);
  const [centreX, centreY] = interaction.centerPoint;
  const count = groupsOf(
    { max: interaction.maxChoices, min: interaction.minChoices },
    interaction.positions.length,
  );
  const input = (name: string, value: string, max: number, axis: "x" | "y"): Attributes => ({
    ...when(problems.length > 0, {
      "aria-describedby": problems.map((entry) => entry.id).join(" "),
      "aria-invalid": "true",
    }),
    "aria-label": say(locale, axis, { max: String(max) }),
    autocomplete: "off",
    "data-slot": rows[axis].slot,
    ...when(!writes, { disabled: true }),
    max: String(max),
    min: "0",
    name,
    step: "1",
    type: "number",
    ...when(value !== "", { value }),
  });

  return {
    markers: {
      "aria-hidden": "true",
      "data-slot": rows.markers.slot,
      height: String(stage.height),
      viewBox: `0 0 ${String(stage.width)} ${String(stage.height)}`,
      width: String(stage.width),
    },
    object: { "data-slot": rows.object.slot },
    points: { "data-slot": rows.points.slot },
    positions: Arr.makeBy(count, (index): PositionProps => {
      const shown = interaction.positions[index] ?? { x: "", y: "" };
      const position = String(index + 1);
      const placed = Option.all({ x: wholeOf(shown.x), y: wholeOf(shown.y) });

      return {
        legend: { props: {}, text: say(locale, "position", { n: numeral(locale, index + 1) }) },
        marker: Option.map(Option.all({ href: url, point: placed }), ({ href, point }) => ({
          "data-position": position,
          "data-slot": rows.marker.slot,
          ...Option.match(objectSize, {
            onNone: () => ({}),
            onSome: (size) => ({ height: String(size.height), width: String(size.width) }),
          }),
          href,
          x: String(point.x - centreX),
          y: String(point.y - centreY),
        })),
        point: { "data-position": position, "data-slot": rows.point.slot },
        x: {
          ...input(xName, shown.x, stage.width, "x"),
          ...when(index === 0 && interaction.autofocus && writes, { autofocus: true }),
        },
        y: input(yName, shown.y, stage.height, "y"),
      };
    }),
    root: {
      ...Option.match(interaction.unnamed, {
        onNone: () => authoredName(interaction, instance),
        onSome: (position) => ({
          "aria-label":
            position.count > 1
              ? message(locale, "answerOf", {
                  count: String(position.count),
                  n: String(position.n),
                })
              : message(locale, "answer"),
        }),
      }),
      ...when(interaction.class !== "", { class: interaction.class }),
      "data-center-point": `${String(centreX)} ${String(centreY)}`,
      ...when(payload.finished, { "data-disabled": true }),
      "data-entry-name": interaction.formName,
      "data-max-choices": String(interaction.maxChoices),
      "data-min-choices": String(interaction.minChoices),
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
  marker: props.positions.flatMap(({ marker }) => Option.toArray(marker)),
  markers: props.markers,
  object: props.object,
  point: props.positions.map(({ point }) => point),
  points: props.points,
  root: props.root,
  x: props.positions.map(({ x }) => x),
  y: props.positions.map(({ y }) => y),
});

/**
 * Place a part through `applyPart` with its replacement from the render's state, so every swap
 * holds I1 to I4.
 *
 * @param state The render's emit state.
 * @param part The part.
 * @param attributes The part's attributes.
 * @param children The nodes the part holds.
 * @returns The part's element, or the refusal of the swap.
 */
const placeWith = (
  state: EmitState,
  part: PositionObjectPart,
  attributes: Attributes,
  children: readonly Node[],
): Result.Result<Element, PartSwapRefused> =>
  applyPart(
    rows[part],
    attributes,
    children,
    Option.getOrUndefined(state.parts.replacementFor(owner, part)),
  );

/**
 * Render a Position Object: a Root holding the Object, the Markers with one Marker per placed
 * position, and the Points, one Point per group of inputs, each a `fieldset` whose legend numbers
 * it and which holds X then Y.
 *
 * The object's content goes through {@link emitNodes}, as the body's does, so it gets its id
 * scoping, URLs and Notices. Each part goes through `applyPart` with its replacement from
 * `state.parts` ({@link placeWith}). The legend is plain markup, not a part: it is the Point's
 * first child, which a swap of the Point must keep.
 *
 * @param interaction The Position Object's payload.
 * @param payload The render's payload.
 * @param state The render's emit state.
 * @returns The Root, or the refusal of a part swap.
 */
const renderPositionObject = (
  interaction: PositionObjectPayload,
  payload: Payload,
  state: EmitState,
): Result.Result<Element, PartSwapRefused> => {
  const props = connectOf(interaction, payload, state.locale, state.assetBase);

  return Result.gen(function* positionObjectRoot() {
    const content = yield* emitNodes(interaction.object, payload, state, nestedInteraction(owner));
    const object = yield* placeWith(state, "object", props.object, content);
    const markers = yield* Result.all(
      props.positions.flatMap(({ marker }) =>
        Option.toArray(marker).map((attributes) => placeWith(state, "marker", attributes, [])),
      ),
    );
    const overlay = yield* placeWith(state, "markers", props.markers, markers);
    const points = yield* Result.all(
      props.positions.map((position) =>
        Result.gen(function* pointGroup() {
          const x = yield* placeWith(state, "x", position.x, []);
          const y = yield* placeWith(state, "y", position.y, []);

          return yield* placeWith(state, "point", position.point, [
            h("legend", position.legend.props, [text(position.legend.text)]),
            x,
            y,
          ]);
        }),
      ),
    );
    const group = yield* placeWith(state, "points", props.points, points);

    return yield* placeWith(state, "root", props.root, [object, overlay, group]);
  });
};

/**
 * Check a Position Object's response, which the caller decoded, in two tiers.
 *
 * - A {@link Malformed} input: a position with one coordinate and not the other, or a coordinate that
 *   is no whole number.
 * - Tier (a), always: the effective `max-choices`, when above zero, caps the count.
 * - Tier (b), only under `validateResponses`: the effective `min-choices`, and every point lies on
 *   the stage, from 0 to its width and from 0 to its height. The stage's edge is tier (b) because
 *   the area mapping maps a point anywhere, a point in no area to its `default-value`, and the
 *   engine scores a stored point off the stage so; the inputs' `min` and `max` guide the candidate,
 *   and `validateResponses` holds a post to them.
 *
 * @param interaction The Position Object.
 * @param input The decoded value, or why the entries did not decode.
 * @param configuration The configuration, which gives the locale and `validateResponses`.
 * @returns One message per problem, none when the response is accepted.
 */
const validatePositionObject = (
  interaction: PositionObjectInteraction,
  input: Value | Malformed,
  configuration: { readonly locale: Locale; readonly validateResponses: boolean },
): readonly ValidationMessage[] => {
  const { locale } = configuration;
  const problem = (written: string): ValidationMessage => ({
    response: interaction.response,
    text: written,
  });

  if (input instanceof Malformed) {
    return [problem(say(locale, "halfPoint"))];
  }

  const { max, min } = boundsOf(interaction);
  const points = input.values.flatMap((single) =>
    single.baseType === "point" ? [single.value] : [],
  );
  const offStage = interaction.stage.pipe(
    Option.filter((stage) =>
      points.some(
        ([x, y]) => x < 0n || y < 0n || x > BigInt(stage.width) || y > BigInt(stage.height),
      ),
    ),
  );
  const count = BigInt(points.length);
  const bound = (n: bigint, one: Word, many: Word): string =>
    n === 1n ? say(locale, one) : say(locale, many, { n: numeral(locale, n) });

  return [
    ...(max > 0n && count > max ? [problem(bound(max, "atMostOne", "atMost"))] : []),
    ...(configuration.validateResponses
      ? [
          ...Option.toArray(offStage).map((stage) =>
            problem(
              say(locale, "offStage", {
                height: String(stage.height),
                width: String(stage.width),
              }),
            ),
          ),
          ...(count < min ? [problem(bound(min, "atLeastOne", "atLeast"))] : []),
        ]
      : []),
  ];
};

/**
 * The elements of the object the interaction holds, by the part of the region that holds them.
 *
 * @param interaction The model node.
 * @returns The object's region.
 */
const ownRegions = (interaction: PositionObjectInteraction): readonly OwnRegion[] => [
  { choice: Option.none(), nodes: interaction.object, part: "content", written: "nodes" },
];

/**
 * Copy a Position Object's model node into its payload node: its object through the kit, the
 * effective bounds, the entry name the host chose, and the positions the view shows.
 *
 * The positions are a refused post's strings paired x then y ({@link pairedOf}) when the view
 * restores one, else the values the view shows ({@link RedactKit.shown}) as coordinates
 * ({@link shownOf}). A node the stage has not adopted has no stage size; no hub reaches one, and
 * its copy takes a size of zero.
 *
 * @param interaction The model node.
 * @param kit What the payload hands a module's `redact`.
 * @returns The payload node.
 */
const redactPositionObject = (
  interaction: PositionObjectInteraction,
  kit: RedactKit,
): PositionObjectPayload => {
  const { max, min } = boundsOf(interaction);

  return {
    ariaLabel: interaction.ariaLabel,
    ariaLabelledby: interaction.ariaLabelledby,
    autofocus: kit.autofocus,
    cardinality: interaction.cardinality,
    centerPoint: interaction.centerPoint,
    class: interaction.class,
    formName: kit.formName(interaction.response),
    maxChoices: max,
    minChoices: min,
    object: kit.nodes(interaction.object),
    positions: Option.match(kit.posted(interaction.response), {
      onNone: () => shownOf(kit.shown(interaction.response)),
      onSome: pairedOf,
    }),
    response: interaction.response,
    stage: Option.getOrElse(interaction.stage, () => ({ height: 0, width: 0 })),
    unnamed: kit.unnamed,
  };
};

/**
 * Read the author's `center-point`: two whole numbers separated by whitespace, x then y, as the
 * XSD's list of `xs:int` writes them.
 *
 * @param read The reader kit.
 * @param source The interaction element.
 * @param path The element's path.
 * @returns The centre point, none when the attribute is absent, or the refusal `attribute-type`
 *   when its value is not two whole numbers.
 */
const centerPointOf = (
  read: ReaderKit,
  source: SourceElement,
  path: string,
): Result.Result<Option.Option<readonly [x: number, y: number]>, Refusal> =>
  Option.match(read.attributeOf(source, "center-point"), {
    onNone: () => Result.succeed(Option.none()),
    onSome: (attribute) => {
      const fields = attribute.value.trim().split(/\s+/u);
      const point =
        fields.length === 2
          ? Option.all([wholeOf(fields[0] ?? ""), wholeOf(fields[1] ?? "")])
          : Option.none();

      return Option.match(point, {
        onNone: () =>
          Result.fail(
            read.refusal("attribute-type", attributePath(path, attribute), {
              attribute: "center-point",
              value: attribute.value,
            }),
          ),
        onSome: ([x, y]) => Result.succeed(Option.some([x, y] as const)),
      });
    },
  });

/**
 * Tell whether an element's path places it directly inside a stage: its parent segment, its index
 * among siblings aside, is `qti-position-object-stage`.
 *
 * @param path The element's path.
 * @returns Whether a stage is its parent.
 */
const insideStage = (path: string): boolean => {
  const segments = path.split("/");
  const parent = segments.at(-2) ?? "";

  return parent.replace(/\[[0-9]+\]$/u, "") === stageElement;
};

/**
 * Read `qti-position-object-interaction`: the refusal `undeclared-response` when it names no
 * declaration; the notice when its response is not a `single` or `multiple` `point`, when it
 * stands outside a stage, when it holds no object image, or when the object image writes no size
 * while it writes no `center-point`; otherwise its object, the counts it wrote, and the effective
 * centre point.
 *
 * @param source The element.
 * @param context The element's path, its notice, and the kit it is read with.
 * @returns The model node, the unsupported node, or a refusal.
 */
const parsePositionObject: InteractionModule<
  "position-object",
  PositionObjectInteraction,
  PositionObjectPayload
>["parse"] = (source, context) => {
  const { read } = context;

  return Result.gen(function* readPositionObject() {
    const response = yield* read.requiredAttribute(source, "response-identifier");
    const declaration = read.bound;
    if (Option.isNone(declaration)) {
      return yield* Result.fail(
        read.refusal("undeclared-response", attributePath(context.path, response), {
          response: read.identifierOf(response.value),
        }),
      );
    }

    const cardinality = Arr.findFirst(cardinalities, (value) =>
      Option.contains(declaration.value.cardinality, value),
    );
    if (
      !Option.contains(declaration.value.baseType, "point") ||
      Option.isNone(cardinality) ||
      !insideStage(context.path)
    ) {
      return yield* context.notice(element);
    }

    const imageElement = Arr.findFirst(read.elementsOf(source), (child) =>
      imageTags.some((tag) => read.isQti(child, tag)),
    );
    if (Option.isNone(imageElement)) {
      return yield* context.notice(element);
    }

    const written = yield* centerPointOf(read, source, context.path);
    const object = yield* read.nodes(source, { children: [imageElement.value] });
    const centre = Option.orElse(written, () =>
      Option.map(sizeOf(object), (size): readonly [x: number, y: number] => [
        size.width / 2,
        size.height / 2,
      ]),
    );
    if (Option.isNone(centre)) {
      return yield* context.notice(element);
    }

    read.markElement(source);

    const minChoices = yield* read.countAttribute(source, "min-choices");
    const maxChoices = yield* read.countAttribute(source, "max-choices");

    return {
      ariaLabel: read.valueOf(source, "aria-label"),
      ariaLabelledby: read.valueOf(source, "aria-labelledby"),
      cardinality: cardinality.value,
      centerPoint: centre.value,
      class: Option.getOrElse(read.valueOf(source, "class"), () => ""),
      kind: "position-object" as const,
      maxChoices,
      minChoices,
      object,
      path: context.path,
      response: read.identifierOf(response.value),
      stage: Option.none(),
    };
  });
};

/**
 * Read `qti-position-object-stage` into the module's container node: the notice
 * `qti-position-object-stage` when its first element child is no image, when that image writes
 * no positive `width` and `height`, or when it holds no interaction of this kind; otherwise its
 * children as the body walk read them, each interaction of this kind given the stage's size.
 *
 * @param source The stage element.
 * @param children The stage's children as the body walk read them.
 * @param context The element's path, its notice, and the kit it is read with.
 * @returns The container node, the unsupported node, or a refusal.
 */
const parseStage: ModuleContainer<"position-object">["parse"] = (
  source: SourceElement,
  children: readonly BodyNode[],
  context: ParseContext,
) => {
  const first = children.find((child) => child.kind !== "text");
  const size =
    first?.kind === "element" && Arr.contains(imageTags, first.tag)
      ? sizeOf([first])
      : Option.none();
  const holdsInteraction = children.some((child) => child.kind === "position-object");
  if (Option.isNone(size) || !holdsInteraction) {
    return context.notice(stageElement);
  }

  context.read.markElement(source);

  const node: ContainerNode<"position-object"> = {
    children: children.map((child) =>
      child.kind === "position-object" ? { ...child, stage: size } : child,
    ),
    kind: "container",
    module: "position-object",
    path: context.path,
  };

  return Result.succeed(node);
};

/**
 * Render the stage around its children's output: the Stage part, carrying the stage's size as
 * `data-width` and `data-height`, read from the first Position Object inside it.
 *
 * @param node The container's payload node.
 * @param children The children as the emitter rendered them.
 * @param _payload The render's payload.
 * @param state The render's emit state.
 * @returns The Stage, or the refusal of a part swap.
 */
const renderStage: ModuleContainer<"position-object">["render"] = (
  node: ContainerPayload,
  children: readonly Node[],
  _payload: Payload,
  state: EmitState,
) => {
  const stage = Arr.findFirst(
    node.children,
    (child): child is ModulePayloadOf<"position-object"> => child.kind === "position-object",
  ).pipe(Option.map((child) => child.payload.stage));

  return placeWith(
    state,
    "stage",
    {
      ...Option.match(stage, {
        onNone: () => ({}),
        onSome: (size) => ({
          "data-height": String(size.height),
          "data-width": String(size.width),
        }),
      }),
      "data-slot": rows.stage.slot,
    },
    children,
  );
};

/**
 * The Position Object module: reads `qti-position-object-interaction` and its stage, copies,
 * renders and checks them.
 */
export const positionObjectModule: InteractionModule<
  "position-object",
  PositionObjectInteraction,
  PositionObjectPayload,
  PositionObjectPart,
  PositionObjectJson
> = {
  /**
   * The one response Position Object binds, a `point`, which posts coordinates as decimal digits
   * through its point entries and so has no number base of its own.
   */
  bindings: (interaction) => [{ base: Option.none(), response: interaction.response }],
  /**
   * Position Object's connect function: the attributes of every part, by part key, the Marker's
   * `href` as the object writes it.
   */
  connect: (interaction, payload, locale) => flattened(connectOf(interaction, payload, locale, "")),
  /**
   * The stage the module owns as the container of its interactions: `qti-position-object-stage`,
   * read by {@link parseStage} and rendered by {@link renderStage}.
   */
  container: { element: stageElement, parse: parseStage, render: renderStage },
  /**
   * The object's nodes: what the render writes as content.
   */
  content: (interaction) => interaction.object,
  /**
   * One Control: the Root is the group the renderer names (Q10), and each input inside it is named
   * by its own axis within the group.
   */
  controls: () => 1,
  element,
  feature,
  /**
   * True: the module renders the kind.
   */
  implemented: true,
  kind: "position-object",
  /**
   * The NULL of Position Object's binding: a `point` of the response's cardinality with no value.
   */
  nullValue: (interaction) => nullOf("point", interaction.cardinality),
  owner,
  /**
   * Read `qti-position-object-interaction`: {@link parsePositionObject}.
   */
  parse: parsePositionObject,
  /**
   * The rows of Position Object's parts, by part key.
   */
  parts,
  /**
   * The codec of the model node's JSON form: each `Option` an optional key, the counts as decimal
   * digits, the centre point and the stage's size as finite numbers, no path.
   */
  payloadSchema: ({ BodyNodes, NoPath, OptionalCount, OptionalText, Schema }) =>
    Schema.Struct({
      ariaLabel: OptionalText,
      ariaLabelledby: OptionalText,
      cardinality: Schema.Literals(cardinalities),
      centerPoint: Schema.Tuple([Schema.Finite, Schema.Finite]),
      class: Schema.String,
      kind: Schema.Literal("position-object"),
      maxChoices: OptionalCount,
      minChoices: OptionalCount,
      object: BodyNodes,
      path: NoPath,
      response: Schema.String,
      stage: Schema.OptionFromOptionalKey(
        Schema.Struct({ height: Schema.Finite, width: Schema.Finite }),
      ),
    }),
  /**
   * Position Object's payload copy: {@link redactPositionObject}.
   */
  redact: redactPositionObject,
  /**
   * The object's region.
   */
  regions: ownRegions,
  /**
   * Render a Position Object: {@link renderPositionObject}.
   */
  render: renderPositionObject,
  /**
   * Rebuild the node with the object replaced.
   */
  replaceRegions: (interaction, contents) => ({
    ...interaction,
    object: contents[0] ?? interaction.object,
  }),
  /**
   * The value Position Object shows for a stored response: the value as it is. The view shows
   * every point it holds, and the check refuses what the bounds do not admit.
   */
  restore: (_interaction, stored) => stored,
  /**
   * No shuffle: a Position Object has no choices to present.
   */
  sequence: () => Option.none(),
  /**
   * The value Position Object shows for the correct response: the value as it is.
   */
  solution: (_interaction, correct) => correct,
  /**
   * The renderer names the Root when the author named it by neither `aria-label` nor
   * `aria-labelledby` (Q10): a Position Object has no Prompt to name it.
   */
  unnamed: (_interaction, unauthored) => unauthored,
  /**
   * Check a Position Object's response: {@link validatePositionObject}.
   */
  validate: validatePositionObject,
};

/**
 * Select Point (Q-18, the `select-point` kind): `qti-select-point-interaction` read into its model
 * node, copied into its payload node, rendered without script, and checked.
 *
 * Without script the interaction is its image and, as the script-free path, one group of two native
 * number inputs per point the candidate may give: x then y, in the image's pixel coordinates, each
 * bounded by the image's size (`min="0"`, `max` its width or height, `step="1"`), named "Point n,
 * x, 0 to width" so each is told apart. The two inputs post under the two entry names a `point`
 * response posts under, `<entry>.x` and `<entry>.y`, one pair per group in order, which `decode`
 * pairs by position; the runtime (issue ei-15, the click and crosshair path) reads
 * `data-entry-name`, `data-width`, `data-height`, `data-min-choices` and `data-max-choices` from
 * the Root. A restored, posted or solution point is shown twice: in its group's inputs and as a
 * Marker, an SVG circle in the Markers overlay stacked on the image, placed by `cx` and `cy` in a
 * `viewBox` of the image's size, never by an inline `style`, which plate's Content Security Policy
 * refuses. The response's area mapping is never rendered, hinted at or copied into the payload: the
 * page holds the correct points only in solution mode, as values.
 *
 * It follows three readings of `docs/spec-readings.md`, each cited by its wording, all enforced by
 * the engine's `areaHolds` when the response processing maps the points:
 *
 * - "A point on an area's boundary is inside it." A point on the circle's edge takes its mapped
 *   value.
 * - "A point inside several areas of an area mapping takes the mapped value of the first area that
 *   holds it, in document order, and each area adds its mapped value at most once." Two points in
 *   one area add its value once.
 * - "A point inside no area adds the mapping's `default-value` once per distinct point." Two distinct
 *   points in no area add the default twice, the same point twice adds it once.
 *
 * Beyond those readings, the defaults are issue ei-14's: the script-free path renders `max-choices`
 * point groups when it is above 0, else `min-choices` groups, and at least one; a `single` binding
 * renders one group whatever the counts say; a shown response with more points than that gets a
 * group per point, so a restored response is never cut. An interaction whose image (`img`, the
 * `img` of a `picture`, or `object`) carries no positive integer `width` and `height` gives its own
 * notice naming the two attributes, since the inputs have no bounds and the Markers no frame.
 * `min-choices` and `max-choices` are validated as written, `max-choices` of 0 being no limit. A
 * negative coordinate is refused always; one above the image's width or height only under
 * `validateResponses`, since `score` runs the always-on tier and the corpus scores such a point at
 * the mapping's `default-value` ({@link validateSelectPoint}).
 *
 * Strings the renderer writes here live in this module, in English ({@link words}).
 *
 * @module
 * @see https://html.spec.whatwg.org/multipage/input.html#number-state-(type=number)
 * @see https://html.spec.whatwg.org/multipage/image-maps.html#image-map-processing-model
 */
import { Array as Arr, Option, Result } from "effect";
import type { SchemaKit } from "#plate/codec/redacted.ts";
import type { Configuration } from "#plate/configuration.ts";
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
  ParseContext,
  PartSpec,
  ReaderKit,
  RedactKit,
  TextProps,
} from "#plate/interactions/contract.ts";
import { numeral } from "#plate/messages.ts";
import type { Locale } from "#plate/messages.ts";
import type { BodyNode, Unsupported } from "#plate/model/item.ts";
import { nullOf, trimXmlSpace } from "#plate/model/values.ts";
import type { ResponseValue, Single, Value } from "#plate/model/values.ts";
import type { EmitState, Payload, PayloadNode, ValidationMessage } from "#plate/payload.ts";
import type { Refusal } from "#plate/validate/refusal.ts";

/**
 * The owner of every Select Point part in the part table.
 */
const owner = "select-point-interaction";

/**
 * Select Point's identifier in the QTI 3.0 conformance list, Appendix A.
 */
const feature = "Q-18";

/**
 * The QTI element Select Point is read from, which its notice names.
 */
const element = "qti-select-point-interaction";

/**
 * The cardinalities a `point` response of a Select Point may have: one point, or several.
 */
const cardinalities = ["multiple", "single"] as const;

/**
 * The cardinality of a Select Point's response.
 */
export type SelectPointCardinality = (typeof cardinalities)[number];

/**
 * A `qti-select-point-interaction` as the item model holds it (Q-18, `select-point`): its Prompt,
 * its image with the size that bounds its points, its response's cardinality, and the counts it
 * wrote.
 *
 * `minChoices` and `maxChoices` are the counts as written, none when absent; the groups the
 * interaction renders are {@link groupsOf}'s. `image` holds the author's image element (`img`,
 * `picture` or `object`) as body nodes, and `width` and `height` the positive integers its `width`
 * and `height` attributes gave, without which `open` gives the notice.
 */
export interface SelectPointInteraction extends ModuleInteraction<"select-point"> {
  readonly cardinality: SelectPointCardinality;
  /**
   * The author's `class` value, empty when absent.
   */
  readonly class: string;
  readonly height: number;
  readonly image: readonly BodyNode[];
  readonly maxChoices: Option.Option<bigint>;
  readonly minChoices: Option.Option<bigint>;
  readonly prompt: Option.Option<readonly BodyNode[]>;
  readonly width: number;
}

/**
 * One point as the page shows it: the text of its x input and of its y input, each empty when the
 * point gives none.
 */
export interface PointText {
  readonly x: string;
  readonly y: string;
}

/**
 * A Select Point as the page may know it (Q-18, `select-point`): what the model node holds of the
 * image and the counts, the name its inputs post under, how many point groups the view renders,
 * and the points the view shows. It holds no correct response and no area: `points` is the stored,
 * posted or solution value the view gave, as the texts its inputs show.
 */
export interface SelectPointPayload {
  readonly ariaLabel: Option.Option<string>;
  readonly ariaLabelledby: Option.Option<string>;
  readonly autofocus: boolean;
  readonly cardinality: SelectPointCardinality;
  readonly class: string;
  /**
   * The name its inputs post under, which `.x` and `.y` extend: the view's name for the response,
   * else `entryName(instance, response)`.
   */
  readonly formName: string;
  /**
   * How many point groups the page renders ({@link groupsOf}, and one per shown point beyond that).
   */
  readonly groups: number;
  readonly height: number;
  readonly image: readonly PayloadNode[];
  readonly maxChoices: Option.Option<bigint>;
  readonly minChoices: Option.Option<bigint>;
  /**
   * The points the view shows, in order, at most `groups` of them.
   */
  readonly points: readonly PointText[];
  readonly prompt: Option.Option<readonly PayloadNode[]>;
  /**
   * The identifier of the response it binds.
   */
  readonly response: string;
  readonly width: number;
}

/**
 * The JSON form of a body-node list, as the codec writes a Prompt's content.
 */
type BodyNodesJson = SchemaKit["BodyNodes"]["Encoded"];

/**
 * A Select Point in the redacted JSON form: each `Option` an optional key, each count as decimal
 * digits, no path.
 */
export interface SelectPointJson {
  readonly ariaLabel?: string;
  readonly ariaLabelledby?: string;
  readonly cardinality: SelectPointCardinality;
  readonly class: string;
  readonly height: number;
  readonly image: BodyNodesJson;
  readonly kind: "select-point";
  readonly maxChoices?: string;
  readonly minChoices?: string;
  readonly prompt?: BodyNodesJson;
  readonly response: string;
  readonly width: number;
}

/**
 * A part of Select Point, by the key a host's override and the part table name it.
 */
export type SelectPointPart =
  | "image"
  | "marker"
  | "markers"
  | "point"
  | "points"
  | "prompt"
  | "root"
  | "x"
  | "y";

/**
 * The rows of Select Point's parts, each declared once; {@link partRow} derives the owner, the key
 * and the `data-slot` marker.
 *
 * The Root is a `role="group"` custom element, as a Graphic Order's is, and holds the Prompt, the
 * Image and the Points. The Image is a flow container that stacks the Markers, an `aria-hidden`
 * `svg` of the image's size, on the author's image; each Marker is a `circle` any element may
 * replace. The Points hold one Point per group, a `fieldset` whose first child is its legend
 * ("Point n"), then the X and Y inputs, native inputs whose `type` I1 writes back, each with the
 * name, bounds and value plate computed.
 */
const parts = {
  image: {
    defaults: {},
    element: "div",
    listOwner: false,
    merged: [],
    tagClass: "flow-container",
  },
  marker: {
    defaults: {},
    element: "circle",
    listOwner: false,
    merged: ["cx", "cy", "r"],
    tagClass: "any",
  },
  markers: {
    defaults: {},
    element: "svg",
    listOwner: false,
    merged: ["aria-hidden", "preserveAspectRatio", "viewBox"],
    tagClass: "any",
  },
  point: {
    defaults: {},
    element: "fieldset",
    legendOwner: true,
    listOwner: false,
    merged: ["data-index"],
    tagClass: "fieldset",
  },
  points: {
    defaults: {},
    element: "div",
    listOwner: false,
    merged: [],
    tagClass: "flow-container",
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
    element: "qti-select-point-interaction",
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
      "data-width",
      "data-height",
    ],
    tagClass: "flow-container",
  },
  x: {
    defaults: {},
    element: "input",
    listOwner: false,
    merged: [
      "id",
      "name",
      "type",
      "value",
      "min",
      "max",
      "step",
      "disabled",
      "autocomplete",
      "inputmode",
      "aria-label",
      "aria-invalid",
      "autofocus",
    ],
    tagClass: "native-input",
  },
  y: {
    defaults: {},
    element: "input",
    listOwner: false,
    merged: [
      "id",
      "name",
      "type",
      "value",
      "min",
      "max",
      "step",
      "disabled",
      "autocomplete",
      "inputmode",
      "aria-label",
      "aria-invalid",
    ],
    tagClass: "native-input",
  },
} satisfies { readonly [Q in SelectPointPart]: PartSpec };

/**
 * The module's owner and parts, as {@link partRow} reads them.
 */
const spec = { owner, parts } as const;

/**
 * The row of every Select Point part as placed: none of them depends on a placement.
 */
const rows = {
  image: partRow(spec, "image"),
  marker: partRow(spec, "marker"),
  markers: partRow(spec, "markers"),
  point: partRow(spec, "point"),
  points: partRow(spec, "points"),
  prompt: partRow(spec, "prompt"),
  root: partRow(spec, "root"),
  x: partRow(spec, "x"),
  y: partRow(spec, "y"),
} satisfies { readonly [Q in SelectPointPart]: PartRow };

/**
 * The strings the renderer writes for Select Point, by locale. A `{name}` is a placeholder that
 * {@link say} fills.
 */
const words = {
  en: {
    atLeast: "Mark at least {n} points.",
    atLeastOne: "Mark at least 1 point.",
    atMost: "Mark at most {n} points.",
    atMostOne: "Mark at most 1 point.",
    coordinate: "Point {n}, {axis}, 0 to {bound}",
    malformed:
      "Give each point as two whole numbers, x from 0 to {width} and y from 0 to {height}, both filled or both empty.",
    outside: "Point {n}: {axis} must be from 0 to {bound}.",
    point: "Point {n}",
  },
} as const satisfies Readonly<Record<Locale, Readonly<Record<string, string>>>>;

/**
 * The key of a string the renderer writes for Select Point.
 */
type Word = keyof (typeof words)["en"];

/**
 * A `{name}` placeholder in a string of {@link words}; its one group is the name.
 */
const placeholder = /\{(?<name>[A-Za-z]+)\}/gu;

/**
 * Write Select Point's text for a key in a locale, each placeholder filled.
 *
 * @param locale The locale of the renderer's own text.
 * @param key The string to write.
 * @param values The value of each `{name}` placeholder the string holds.
 * @returns The string, a placeholder with no value left as written.
 */
const say = (locale: Locale, key: Word, values: Readonly<Record<string, string>> = {}): string =>
  words[locale][key].replaceAll(placeholder, (whole, name: string) => values[name] ?? whole);

/**
 * An axis a coordinate is measured along, which names the input and picks the bound.
 */
type Axis = "x" | "y";

/**
 * The two axes, in the order a point writes them and the inputs stand.
 */
const axes: readonly Axis[] = ["x", "y"];

/**
 * Give the bound of an axis: the image's width for x, its height for y.
 *
 * @param size The image's size.
 * @param size.height The image's height.
 * @param size.width The image's width.
 * @param axis The axis.
 * @returns The greatest coordinate inside the image along it.
 */
const boundOf = (size: { readonly height: number; readonly width: number }, axis: Axis): number =>
  axis === "x" ? size.width : size.height;

/**
 * Keep a count that constrains something: one above zero.
 *
 * @param count The count as written, none when absent.
 * @returns The count when it is above 0, else none.
 */
const aboveZero = (count: Option.Option<bigint>): Option.Option<bigint> =>
  count.pipe(Option.filter((value) => value > 0n));

/**
 * Count the point groups an interaction renders: one for a `single` binding; else `max-choices`
 * when above 0, else `min-choices` when above 0, else one (issue ei-14's defaults).
 *
 * @param interaction The binding's cardinality and the counts as written.
 * @param interaction.cardinality The response's cardinality.
 * @param interaction.maxChoices The `max-choices` as written, none when absent.
 * @param interaction.minChoices The `min-choices` as written, none when absent.
 * @returns How many groups to render.
 */
const groupsOf = (
  interaction: Pick<SelectPointInteraction, "cardinality" | "maxChoices" | "minChoices">,
): number => {
  if (interaction.cardinality === "single") {
    return 1;
  }

  return Number(
    Option.getOrElse(
      Option.orElse(aboveZero(interaction.maxChoices), () => aboveZero(interaction.minChoices)),
      () => 1n,
    ),
  );
};

/**
 * Give the most points a response may hold: one under a `single` binding, else `max-choices` when
 * above 0, else no limit.
 *
 * @param interaction The binding's cardinality and the `max-choices` as written.
 * @returns The most, none for no limit.
 */
const mostOf = (
  interaction: Pick<SelectPointInteraction, "cardinality" | "maxChoices">,
): Option.Option<bigint> =>
  interaction.cardinality === "single" ? Option.some(1n) : aboveZero(interaction.maxChoices);

/**
 * The lexical form of a whole number as a number input posts it: an optional sign and digits.
 */
const wholeNumber = /^[+-]?[0-9]+$/u;

/**
 * Read a shown point's texts as the position of its Marker, none unless both are whole numbers.
 *
 * @param point The point's texts.
 * @returns `[x, y]` as the Marker's `cx` and `cy`, in the image's units.
 */
const markerPositionOf = (point: PointText): Option.Option<readonly [string, string]> => {
  const [x, y] = [point.x.trim(), point.y.trim()];

  return wholeNumber.test(x) && wholeNumber.test(y)
    ? Option.some([String(BigInt(x)), String(BigInt(y))])
    : Option.none();
};

/**
 * Pair the strings a refused post sent into points: the n-th string a point's x and the next its
 * y, in the order `encode` writes them; an unpaired last string is an x with an empty y.
 *
 * @param posted The posted strings.
 * @returns The points, in posted order.
 */
const postedPoints = (posted: readonly string[]): readonly PointText[] =>
  Arr.chunksOf(posted, 2).map(([x, y = ""]) => ({ x, y }));

/**
 * Give the texts a shown point value's inputs show.
 *
 * @param singles The values the view shows.
 * @returns One per point among them, its coordinates as decimal digits.
 */
const shownPoints = (singles: readonly Single[]): readonly PointText[] =>
  singles.flatMap((single) =>
    single.baseType === "point" ? [{ x: String(single.value[0]), y: String(single.value[1]) }] : [],
  );

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
  names: Pick<SelectPointPayload, "ariaLabel" | "ariaLabelledby">,
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
 * The attributes the connect function computes for one point group: its fieldset with its
 * legend's text, and, per axis, the input and the visible label beside it.
 */
interface GroupProps {
  readonly inputs: Readonly<Record<Axis, Attributes>>;
  readonly labels: Readonly<Record<Axis, TextProps>>;
  readonly point: TextProps;
}

/**
 * The attributes of every part of one Select Point, computed once by {@link connectOf}.
 */
interface Props {
  /**
   * One per point group, in order.
   */
  readonly groups: readonly GroupProps[];
  readonly image: Attributes;
  /**
   * One per shown point whose two texts are whole numbers, in order.
   */
  readonly markers: readonly Attributes[];
  readonly markersList: Attributes;
  readonly points: Attributes;
  readonly prompt: Attributes;
  readonly root: Attributes;
}

/**
 * Compute every attribute of every part of one Select Point: the connect function.
 *
 * - Root: the marker, the state (`data-mode`, and `data-disabled` when the author disabled every
 *   control), `role="group"`, the author's `class`, the entry name, the counts as written and the
 *   image's size the runtime reads, and the group's name: with a Prompt, `aria-labelledby` → the
 *   Prompt's id, else the author's `aria-label` and `aria-labelledby` ({@link authoredName});
 *   `aria-describedby` → the message ids when the response is invalid.
 * - Markers: `aria-hidden`, `viewBox` of the image's size with `preserveAspectRatio="none"`, so it
 *   scales with the image; one Marker per shown point whose texts are whole numbers, at its `cx`
 *   and `cy` with a fixed `r`.
 * - Point: `data-index` from 1, and the legend's text "Point n".
 * - X and Y: a number `input`; its id, the entry name with `.x` or `.y`, `min="0"`, `max` the image's
 *   width or height, `step="1"`, `inputmode="numeric"` and `autocomplete="off"`; the text the view
 *   shows as `value` when it has one; `disabled` when finished or not editable (review and
 *   solution); its name "Point n, x, 0 to width" as `aria-label`; `aria-invalid` when the response
 *   was refused; and `autofocus` on the first X when the payload says.
 *
 * @param interaction The Select Point's payload.
 * @param payload The payload, which gives the instance, the mode, `finished` and the messages.
 * @param locale The locale of the renderer's own text.
 * @returns The attributes of every part.
 */
const connectOf = (interaction: SelectPointPayload, payload: Payload, locale: Locale): Props => {
  const { instance } = payload;
  const id = (...segments: readonly string[]) =>
    scopedId(instance, interaction.response, ...segments);
  const problems = payload.messages.filter((entry) => entry.response === interaction.response);
  const off = payload.finished || payload.mode !== "answering";
  const groups = Array.from({ length: interaction.groups }, (_, index): GroupProps => {
    const n = numeral(locale, index + 1);
    const point = interaction.points[index];
    const inputOf = (axis: Axis): Attributes => ({
      "aria-label": say(locale, "coordinate", {
        axis,
        bound: numeral(locale, boundOf(interaction, axis)),
        n,
      }),
      ...when(problems.length > 0, { "aria-invalid": "true" }),
      ...when(interaction.autofocus && index === 0 && axis === "x", { autofocus: true }),
      autocomplete: "off",
      "data-slot": rows[axis].slot,
      ...when(off, { disabled: true }),
      id: id("point", String(index + 1), axis),
      inputmode: "numeric",
      max: String(boundOf(interaction, axis)),
      min: "0",
      name: `${interaction.formName}.${axis}`,
      step: "1",
      type: "number",
      ...Option.match(
        Option.fromUndefinedOr(point?.[axis]).pipe(Option.filter((shown) => shown !== "")),
        {
          onNone: () => ({}),
          onSome: (shown) => ({ value: shown }),
        },
      ),
    });
    const labelOf = (axis: Axis): TextProps => ({
      props: { for: id("point", String(index + 1), axis) },
      text: axis,
    });

    return {
      inputs: { x: inputOf("x"), y: inputOf("y") },
      labels: { x: labelOf("x"), y: labelOf("y") },
      point: {
        props: { "data-index": String(index + 1), "data-slot": rows.point.slot },
        text: say(locale, "point", { n }),
      },
    };
  });

  return {
    groups,
    image: { "data-slot": rows.image.slot },
    markers: interaction.points.flatMap((point) =>
      Option.toArray(
        Option.map(markerPositionOf(point), ([cx, cy]): Attributes => ({
          cx,
          cy,
          "data-slot": rows.marker.slot,
          r: "6",
        })),
      ),
    ),
    markersList: {
      "aria-hidden": "true",
      "data-slot": rows.markers.slot,
      preserveAspectRatio: "none",
      viewBox: `0 0 ${String(interaction.width)} ${String(interaction.height)}`,
    },
    points: { "data-slot": rows.points.slot },
    prompt: { "data-slot": rows.prompt.slot, id: id("prompt") },
    root: {
      ...(Option.isSome(interaction.prompt)
        ? { "aria-labelledby": id("prompt") }
        : authoredName(interaction, instance)),
      ...when(problems.length > 0, {
        "aria-describedby": problems.map((entry) => entry.id).join(" "),
      }),
      ...when(interaction.class !== "", { class: interaction.class }),
      ...when(payload.finished, { "data-disabled": true }),
      "data-entry-name": interaction.formName,
      "data-height": String(interaction.height),
      "data-max-choices": String(Option.getOrElse(interaction.maxChoices, () => 0n)),
      "data-min-choices": String(Option.getOrElse(interaction.minChoices, () => 0n)),
      "data-mode": payload.mode,
      "data-slot": rows.root.slot,
      "data-width": String(interaction.width),
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
  image: props.image,
  marker: props.markers,
  markers: props.markersList,
  point: props.groups.map(({ point }) => point),
  points: props.points,
  prompt: props.prompt,
  root: props.root,
  x: props.groups.map(({ inputs }) => inputs.x),
  y: props.groups.map(({ inputs }) => inputs.y),
});

/**
 * Render a Select Point: a Root holding the Prompt, when there is one, the Image with the Markers
 * after the author's image, and the Points, one Point per group holding its legend, then the X
 * input and the Y input, each behind a visible label.
 *
 * The Prompt's and the image's content go through {@link emitNodes}, as the body's do, so they get
 * its id scoping, heading shift, URLs and Notices. Each part goes through `applyPart` with its
 * replacement from `state.parts`, so every swap holds I1 to I4; a Point is a legend owner, so a
 * replacement keeps its legend first. The legend and the labels are no parts: they are the handed
 * children a swap must keep.
 *
 * @param interaction The Select Point's payload.
 * @param payload The render's payload.
 * @param state The render's emit state.
 * @returns The Root, or the refusal of a part swap.
 */
const renderSelectPoint = (
  interaction: SelectPointPayload,
  payload: Payload,
  state: EmitState,
): Result.Result<Element, PartSwapRefused> => {
  const props = connectOf(interaction, payload, state.locale);
  const emitContent = (
    nodes: readonly PayloadNode[],
  ): Result.Result<readonly Node[], PartSwapRefused> =>
    emitNodes(nodes, payload, state, nestedInteraction(owner));
  const place = (
    part: SelectPointPart,
    attributes: Attributes,
    children: readonly Node[],
  ): Result.Result<Element, PartSwapRefused> =>
    applyPart(
      rows[part],
      attributes,
      children,
      Option.getOrUndefined(state.parts.replacementFor(owner, part)),
    );

  return Result.gen(function* selectPointRoot() {
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
    const markers = yield* Result.all(
      props.markers.map((attributes) => place("marker", attributes, [])),
    );
    const overlay = yield* place("markers", props.markersList, markers);
    const frame = yield* place("image", props.image, [...image, overlay]);
    const groups = yield* Result.all(
      props.groups.map((group) =>
        Result.gen(function* pointGroup() {
          const legend = h("legend", {}, [text(group.point.text)]);
          const fields = yield* Result.all(
            axes.map((axis) =>
              Result.map(place(axis, group.inputs[axis], []), (input) => [
                h("label", group.labels[axis].props, [text(group.labels[axis].text)]),
                input,
              ]),
            ),
          );

          return yield* place("point", group.point.props, [legend, ...fields.flat()]);
        }),
      ),
    );
    const points = yield* place("points", props.points, groups);

    return yield* place("root", props.root, [...Option.toArray(prompt), frame, points]);
  });
};

/**
 * Check a Select Point's response, which the caller decoded, in two tiers.
 *
 * - A {@link Malformed} input: a point with one coordinate filled and the other empty, or text that
 *   is no whole number, gives one message naming both bounds.
 * - Tier (a), always: no coordinate is negative, which no image has a pixel for (the message names
 *   the point, the axis and the bound), and the most points ({@link mostOf}) caps the count.
 * - Tier (b), only under `validateResponses`: no coordinate is above the image's width or height (the
 *   same message), and `min-choices`, when written above 0.
 *
 * The upper bound is tier (b), not (a), because `score` runs tier (a) on every response it maps,
 * and the 1EdTech corpus items score a point beyond the image's `width` and `height` at the
 * mapping's `default-value` (`src/engine/templates.test.ts`): those attributes are the image's
 * display size, and a point past them is still a point of the image's plane, which the area
 * mapping reads. A host that posts the script-free form sets `validateResponses` to refuse it, and
 * the inputs' `max` already holds a browser to it.
 *
 * @param interaction The Select Point.
 * @param input The decoded value, or why the entries did not decode.
 * @param configuration The configuration, which gives the locale and `validateResponses`.
 * @returns One message per problem, none when the response is accepted.
 */
const validateSelectPoint = (
  interaction: SelectPointInteraction,
  input: Value | Malformed,
  configuration: Pick<Configuration, "locale" | "validateResponses">,
): readonly ValidationMessage[] => {
  const { locale } = configuration;
  const problem = (written: string): ValidationMessage => ({
    response: interaction.response,
    text: written,
  });

  if (input instanceof Malformed) {
    return [
      problem(
        say(locale, "malformed", {
          height: numeral(locale, interaction.height),
          width: numeral(locale, interaction.width),
        }),
      ),
    ];
  }

  const points = shownPoints(input.values);
  const outside = points.flatMap((point, index) =>
    axes.flatMap((axis) => {
      const coordinate = BigInt(point[axis]);
      const bound = boundOf(interaction, axis);
      const beyond = configuration.validateResponses && coordinate > BigInt(bound);

      return coordinate < 0n || beyond
        ? [
            problem(
              say(locale, "outside", {
                axis,
                bound: numeral(locale, bound),
                n: numeral(locale, index + 1),
              }),
            ),
          ]
        : [];
    }),
  );
  const count = BigInt(points.length);
  const most = mostOf(interaction);
  const least = aboveZero(interaction.minChoices);
  const bound = (n: bigint, one: Word, many: Word): string =>
    n === 1n ? say(locale, one) : say(locale, many, { n: numeral(locale, n) });

  return [
    ...outside,
    ...(Option.exists(most, (max) => count > max)
      ? [
          problem(
            bound(
              Option.getOrElse(most, () => 1n),
              "atMostOne",
              "atMost",
            ),
          ),
        ]
      : []),
    ...(configuration.validateResponses && Option.exists(least, (min) => count < min)
      ? [
          problem(
            bound(
              Option.getOrElse(least, () => 1n),
              "atLeastOne",
              "atLeast",
            ),
          ),
        ]
      : []),
  ];
};

/**
 * The elements of QTI's HTML subset an interaction's image may be.
 */
const imageTags = ["img", "object", "picture"] as const;

/**
 * Read a dimension attribute of a source element as HTML does: digits alone, more than zero.
 *
 * @param read The reader kit.
 * @param node The image element.
 * @param name `width` or `height`.
 * @returns The number, none when the element writes none or one that is not a positive integer.
 */
const dimensionOf = (
  read: ReaderKit,
  node: SourceElement,
  name: "height" | "width",
): Option.Option<number> =>
  read.valueOf(node, name).pipe(
    Option.map((value) => value.trim()),
    Option.filter((value) => /^[0-9]+$/u.test(value)),
    Option.map(Number),
    Option.filter((value) => value > 0),
  );

/**
 * Find the element that carries an image's size: an `img` or `object` itself, and the first `img`
 * of a `picture`.
 *
 * @param read The reader kit.
 * @param image The image element.
 * @returns The sized element, none for a `picture` with no `img`.
 */
const sizedElementOf = (read: ReaderKit, image: SourceElement): Option.Option<SourceElement> =>
  read.isQti(image, "picture")
    ? Arr.findFirst(read.elementsOf(image), (child) => read.isQti(child, "img"))
    : Option.some(image);

/**
 * The elements of the content the interaction holds, by the part of the region that holds them.
 *
 * @param interaction The model node.
 * @returns The Prompt's region, when it has a Prompt, then the image's.
 */
const ownRegions = (interaction: SelectPointInteraction): readonly OwnRegion[] => [
  ...Option.toArray(interaction.prompt).map((nodes): OwnRegion => ({
    choice: Option.none(),
    nodes,
    part: "prompt",
    written: "nodes",
  })),
  { choice: Option.none(), nodes: interaction.image, part: "content", written: "nodes" },
];

/**
 * Copy a Select Point's model node into its payload node: its content through the kit, the entry
 * name the host chose, how many groups the page renders, and the points the view shows.
 *
 * The points are the strings a refused post sent when the view restores one, paired x then y
 * ({@link postedPoints}), else the point values the view shows ({@link shownPoints}). The groups
 * are {@link groupsOf}'s, and one per shown point beyond them.
 *
 * @param interaction The model node.
 * @param kit What the payload hands a module's `redact`.
 * @returns The payload node.
 */
const redactSelectPoint = (
  interaction: SelectPointInteraction,
  kit: RedactKit,
): SelectPointPayload => {
  const points = Option.match(kit.posted(interaction.response), {
    onNone: () => shownPoints(kit.shown(interaction.response)),
    onSome: postedPoints,
  });

  return {
    ariaLabel: interaction.ariaLabel,
    ariaLabelledby: interaction.ariaLabelledby,
    autofocus: kit.autofocus,
    cardinality: interaction.cardinality,
    class: interaction.class,
    formName: kit.formName(interaction.response),
    groups: Math.max(groupsOf(interaction), points.length),
    height: interaction.height,
    image: kit.nodes(interaction.image),
    maxChoices: interaction.maxChoices,
    minChoices: interaction.minChoices,
    points,
    prompt: interaction.prompt.pipe(Option.map(kit.nodes)),
    response: interaction.response,
    width: interaction.width,
  };
};

/**
 * Read `qti-select-point-interaction`'s binding: the notice when its response is not a `single` or
 * `multiple` `point`; the refusal `undeclared-response` when it names no declaration.
 *
 * @param source The interaction element.
 * @param context The parse context.
 * @returns The response's identifier and cardinality, or the notice or refusal.
 */
const bindingOf = (
  source: SourceElement,
  context: ParseContext,
): Result.Result<
  { readonly cardinality: SelectPointCardinality; readonly response: string } | Unsupported,
  Refusal
> =>
  Result.gen(function* readBinding() {
    const { read } = context;
    const response = yield* read.requiredAttribute(source, "response-identifier");
    const declaration = read.bound;
    if (Option.isNone(declaration)) {
      return yield* Result.fail(
        read.refusal("undeclared-response", attributePath(context.path, response), {
          response: read.identifierOf(response.value),
        }),
      );
    }

    if (!Option.contains(declaration.value.baseType, "point")) {
      return yield* context.notice(
        `base-type="${Option.getOrElse(read.valueOf(declaration.value.element, "base-type"), () => "")}"`,
      );
    }

    const cardinality = Arr.findFirst(cardinalities, (candidate) =>
      Option.contains(declaration.value.cardinality, candidate),
    );
    if (Option.isNone(cardinality)) {
      return yield* context.notice(
        `cardinality="${Option.getOrElse(read.valueOf(declaration.value.element, "cardinality"), () => "")}"`,
      );
    }

    return { cardinality: cardinality.value, response: read.identifierOf(response.value) };
  });

/**
 * The Select Point module: reads `qti-select-point-interaction`, copies, renders and checks it.
 */
export const selectPointModule: InteractionModule<
  "select-point",
  SelectPointInteraction,
  SelectPointPayload,
  SelectPointPart,
  SelectPointJson
> = {
  /**
   * The one response Select Point binds, a `point`, which posts two whole numbers per value and so
   * has no number base of its own.
   */
  bindings: (interaction) => [{ base: Option.none(), response: interaction.response }],
  /**
   * Select Point's connect function: the attributes of every part, by part key.
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
   * Two Controls per point group ({@link groupsOf}): the X and Y inputs.
   */
  controls: (interaction) => groupsOf(interaction) * 2,
  element,
  feature,
  /**
   * True: the module renders the kind.
   */
  implemented: true,
  kind: "select-point",
  /**
   * The NULL of Select Point's binding: a `point` of its cardinality with no value.
   */
  nullValue: (interaction) => nullOf("point", interaction.cardinality),
  owner,
  /**
   * Read `qti-select-point-interaction`: its binding ({@link bindingOf}); the notice `element` when
   * it holds no image; the notice `<tag>[width][height]` when its image carries no positive
   * integer `width` and `height`; otherwise its Prompt, its image with its size, and the counts it
   * wrote.
   */
  parse: (source, context) => {
    const { read } = context;

    return Result.gen(function* readSelectPoint() {
      const binding = yield* bindingOf(source, context);
      if ("kind" in binding) {
        return binding;
      }

      const imageElement = Arr.findFirst(read.elementsOf(source), (child) =>
        imageTags.some((tag) => read.isQti(child, tag)),
      );
      if (Option.isNone(imageElement)) {
        return yield* context.notice(element);
      }

      const sized = sizedElementOf(read, imageElement.value);
      const size = sized.pipe(
        Option.flatMap((node) =>
          Option.all({
            height: dimensionOf(read, node, "height"),
            width: dimensionOf(read, node, "width"),
          }),
        ),
      );
      if (Option.isNone(size)) {
        const tag = Option.match(sized, {
          onNone: () => read.nameOf(imageElement.value),
          onSome: read.nameOf,
        });

        return yield* context.notice(`${tag}[width][height]`);
      }

      read.markElement(source);

      const minChoices = yield* read.countAttribute(source, "min-choices");
      const maxChoices = yield* read.countAttribute(source, "max-choices");
      const prompt = yield* read.content(source, "qti-prompt");
      const image = yield* read.nodes(source, { children: [imageElement.value] });

      return {
        ariaLabel: read.valueOf(source, "aria-label"),
        ariaLabelledby: read.valueOf(source, "aria-labelledby"),
        cardinality: binding.cardinality,
        class: Option.getOrElse(read.valueOf(source, "class"), () => ""),
        height: size.value.height,
        image,
        kind: "select-point" as const,
        maxChoices,
        minChoices,
        path: context.path,
        prompt,
        response: binding.response,
        width: size.value.width,
      };
    });
  },
  /**
   * The rows of Select Point's parts, by part key.
   */
  parts,
  /**
   * The codec of the model node's JSON form: each `Option` an optional key, the counts as decimal
   * digits, the size as positive integers, no path.
   */
  payloadSchema: ({ BodyNodes, NoPath, OptionalCount, OptionalText, Schema }) =>
    Schema.Struct({
      ariaLabel: OptionalText,
      ariaLabelledby: OptionalText,
      cardinality: Schema.Literals(cardinalities),
      class: Schema.String,
      height: Schema.Int.check(Schema.isGreaterThanOrEqualTo(1)),
      image: BodyNodes,
      kind: Schema.Literal("select-point"),
      maxChoices: OptionalCount,
      minChoices: OptionalCount,
      path: NoPath,
      prompt: Schema.OptionFromOptionalKey(BodyNodes),
      response: Schema.String,
      width: Schema.Int.check(Schema.isGreaterThanOrEqualTo(1)),
    }),
  /**
   * Select Point's payload copy: {@link redactSelectPoint}.
   */
  redact: redactSelectPoint,
  /**
   * The Prompt's region, when it has a Prompt, then the image's.
   */
  regions: ownRegions,
  /**
   * Render a Select Point: its Root holding the Prompt, the image under its Markers, and the point
   * groups of number inputs.
   */
  render: renderSelectPoint,
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
   * The value Select Point shows for a stored response: the points as stored.
   */
  restore: (_interaction, stored: ResponseValue) => stored,
  /**
   * No shuffle: a Select Point presents nothing to shuffle.
   */
  sequence: () => Option.none(),
  /**
   * The value Select Point shows for the correct response: the points as declared.
   */
  solution: (_interaction, correct: ResponseValue) => correct,
  /**
   * The renderer names every Control itself, "Point n, x, 0 to width", whatever the author wrote,
   * so none takes the renderer's "Answer" name.
   */
  unnamed: () => false,
  /**
   * Check a Select Point's response: {@link validateSelectPoint}.
   */
  validate: validateSelectPoint,
};

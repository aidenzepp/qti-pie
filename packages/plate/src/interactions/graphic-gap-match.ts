/**
 * Graphic Gap Match (Q-8): a `qti-graphic-gap-match-interaction` rendered without script as its
 * image with each associable hotspot drawn as a gap over its area, its gap choices beside the
 * image, and the restored directed pairs shown inside their gaps; its model node, its payload node,
 * its parts, its parse, redaction, connect and render functions, its response validation and its
 * bindings, on the module shape of Gap Match (`#plate/interactions/gap-match.ts`) with the image
 * and the areas of Hotspot (`#plate/interactions/hotspot.ts`).
 *
 * The readings of `docs/spec-readings.md` that bind this module, by their wording:
 *
 * - "A default hotspot is the last hotspot choice of its interaction, and a graphic gap match
 *   interaction has none." `open`'s structure check refuses a `default` associable hotspot here
 *   before the model is built, so {@link graphicGapMatchModule}'s `parse` never sees one and reads
 *   the four shapes that draw an area ({@link geometries}).
 * - "An area's `coords` that do not fit its shape are read as the HTML Standard's image-map
 *   processing reads an `area`'s." An area with fewer coordinates than its shape needs, or a radius
 *   of zero or less, holds no point ({@link areaHolds}), so its gap stands in the group of gaps
 *   with its label and draws no Outline over the image; coordinates beyond the shape's are ignored;
 *   a `rect`'s corners may come in either order.
 * - "A `qti-gap` appears only within a gap-match interaction, and a `qti-hottext` may appear in any
 *   flow or inline content." `open` refuses a `qti-gap` inside a gap text of this interaction, so a
 *   choice's content never holds one.
 *
 * The interaction binds a response of base type `directedPair` and cardinality `multiple`: each
 * pair is a gap choice, the source, and the associable hotspot it went to, the target. Unlike Gap
 * Match, a hotspot may hold several choices, up to its `match-max`, and one choice may go to one
 * hotspot several times, the pair then repeating in the value and counting each time against the
 * choice's `match-max`. A declaration of any other base type or cardinality is the notice
 * `base-type="…"` or `cardinality="…"`, as a binding no shipped kind renders is.
 *
 * {@link graphicGapMatchModule}'s render emits this structure: a `div` Root that is `role="group"`,
 * named by its Prompt through `aria-labelledby` (or by the author's names when there is no
 * Prompt), carrying `data-entry-name`, the name its hidden inputs post under, and
 * `data-max-associations`, which the runtime reads; the Prompt; the Image part, a box holding the
 * author's image (its `img`, `picture` or `object`, emitted as body content) and after it the Gaps
 * part, one Gap per hotspot in document order, each a `div` group laid over the whole image, named
 * by its `hotspot-label` (or by its position, "Area 2 of 3") through `aria-label`, holding its
 * Outline (an inline `svg` over the image, `aria-hidden`, whose one shape is the area, drawn in the
 * image's coordinate space) and, for each restored pair that names it, a GapChoice, an SVG `text`
 * with the choice's text, placed inside the area's bounding box in a second `svg` over the image
 * that carries no semantics of its own; then a `ul` of Choices, one `li` per gap choice in
 * presented order; and, only while the candidate may answer, one hidden input per pair under the
 * host's entry name (the wire of decision D2, which `runtime/wire.dom.ts` writes again from the
 * page). The stylesheet positions nothing by coordinates: the playground's pages carry a
 * `style-src 'self'` policy (rule `723e580c`), so no part carries an inline `style`, and the
 * geometry travels only as SVG attributes; the serialiser writes lower-case element names only, so
 * a `foreignObject` cannot carry HTML text to a coordinate, and the SVG `text` element is what
 * places a choice. A gap whose area draws no Outline holds its GapChoices directly, unplaced. The
 * page holds no other control: the select-then-place input is the runtime's (issue m3d-06), so
 * the script-free render shows the response and posts it (D3).
 *
 * The ASI XSD declares no `shuffle` on this interaction and no `fixed` on a gap choice, so `open`
 * refuses either written (`unknown-attribute`) and a document gives both false; the redacted form
 * may hold them true, and the choices are then presented in the order the seed and the instance
 * draw, each fixed choice at its document position, the hotspots never moving.
 *
 * A coordinate written with `%` is a percentage of the image: it is scaled by the image's `width`
 * or `height` when the author gave both, and when they gave neither the area draws no Outline, a
 * stated limit. The strings this module adds, the positional name of a hotspot with no
 * `hotspot-label` and the messages of the limits the renderer's own messages do not cover, are
 * English and live here (D7).
 *
 * @module
 */
/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shape` is the QTI attribute of `qti-associable-hotspot` and names an area's geometry, not a structure. */
import { Option, Result, pipe } from "effect";
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
import { areaHolds } from "#plate/engine/expressions/shapes.ts";
import { shuffleOrder } from "#plate/engine/random.ts";
import { Malformed } from "#plate/form/encoding.ts";
import { partRow } from "#plate/interactions/contract.ts";
import type {
  InteractionModule,
  ModuleInteraction,
  OwnRegion,
  ParseContext,
  PartSpec,
  ReaderKit,
  TextProps,
} from "#plate/interactions/contract.ts";
import { message, numeral } from "#plate/messages.ts";
import type { Locale } from "#plate/messages.ts";
import type { BodyNode, Unsupported } from "#plate/model/item.ts";
import { format, nullOf, trimXmlSpace } from "#plate/model/values.ts";
import type { Value } from "#plate/model/values.ts";
import type { EmitState, Payload, PayloadNode, ValidationMessage } from "#plate/payload.ts";
import type { Refusal } from "#plate/validate/refusal.ts";
import type { AreaShape } from "#plate/vocabulary.ts";

/**
 * The owner of every Graphic Gap Match part in the part table.
 */
const owner = "graphic-gap-match-interaction";

/**
 * Graphic Gap Match's identifier in the QTI 3.0 conformance list, Appendix A.
 */
const feature = "Q-8";

/**
 * The QTI element Graphic Gap Match is read from, which its notice names.
 */
const element = "qti-graphic-gap-match-interaction";

/**
 * The separator of the parts of a shuffle's key, as `choiceOrder` in `#plate/payload.ts` keys a
 * Choice's: the seed, the instance and the response, which no identifier or token holds.
 */
const keySeparator = "\u001F";

/**
 * The shape of an associable hotspot that draws an area: every value of `shape` but `default`,
 * which `open` refuses on this interaction (reading 80).
 */
export type HotspotGeometry = Exclude<AreaShape, "default">;

/**
 * The values of an associable hotspot's `shape` attribute this module reads: the XSD enumerates
 * `default` too, which never reaches the model here.
 */
const geometries = [
  "circle",
  "ellipse",
  "poly",
  "rect",
] as const satisfies readonly HotspotGeometry[];

/**
 * The elements that carry the interaction's image, in the QTI namespace: `img`, `picture`, or the
 * deprecated `object`.
 */
const imageElements = ["img", "picture", "object"] as const;

/**
 * A Graphic Gap Match part, by the key its row and its host override go by.
 */
type GraphicGapMatchPart =
  | "choice"
  | "choices"
  | "gap"
  | "gapChoice"
  | "gaps"
  | "hidden"
  | "image"
  | "outline"
  | "prompt"
  | "root";

/**
 * The rows of the Graphic Gap Match parts, each part once: the Root, the Prompt, the Image (the box
 * the gaps are positioned in) and the Gaps (the group of gaps, after the image) are flow
 * containers; the Choices a list of Choices; a Gap a flow container laid over the image; the
 * Outline an `svg`; a GapChoice an SVG `text` inside its Gap, which a replacement may make any
 * element; the hidden input a native input whose `type` stays `hidden`. `merged` lists every
 * attribute the connect function computes beyond the `data-slot` marker and the Root state
 * (`data-mode`, `data-disabled`), which a replacement may not override.
 */
const parts = {
  choice: {
    defaults: {},
    element: "li",
    listOwner: false,
    merged: ["data-identifier", "data-match-group", "data-match-max"],
    tagClass: "choice-item",
  },
  choices: {
    defaults: {},
    element: "ul",
    listOwner: true,
    merged: [],
    tagClass: "choice-list",
  },
  gap: {
    defaults: {},
    element: "div",
    listOwner: false,
    merged: ["aria-label", "data-gap", "data-match-group", "data-match-max", "role"],
    tagClass: "flow-container",
  },
  gapChoice: {
    defaults: {},
    element: "text",
    listOwner: false,
    merged: ["data-identifier", "x", "y"],
    tagClass: "any",
  },
  gaps: {
    defaults: {},
    element: "div",
    listOwner: false,
    merged: [],
    tagClass: "flow-container",
  },
  hidden: {
    defaults: {},
    element: "input",
    listOwner: false,
    merged: ["name", "type", "value"],
    tagClass: "native-input",
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
    merged: ["aria-hidden", "viewBox"],
    tagClass: "any",
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
      "data-max-associations",
      "role",
    ],
    tagClass: "flow-container",
  },
} as const satisfies { readonly [Q in GraphicGapMatchPart]: PartSpec };

/**
 * The module's owner and parts, which {@link partRow} derives each part's row from.
 */
const table = { owner, parts } as const;

/**
 * The row of every Graphic Gap Match part, which no placement changes.
 */
const rows = {
  choice: partRow(table, "choice"),
  choices: partRow(table, "choices"),
  gap: partRow(table, "gap"),
  gapChoice: partRow(table, "gapChoice"),
  gaps: partRow(table, "gaps"),
  hidden: partRow(table, "hidden"),
  image: partRow(table, "image"),
  outline: partRow(table, "outline"),
  prompt: partRow(table, "prompt"),
  root: partRow(table, "root"),
} satisfies { readonly [Q in GraphicGapMatchPart]: PartRow };

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
 * One `qti-gap-text` or `qti-gap-img` of a Graphic Gap Match (Q-8): a choice of the pair's source
 * side.
 */
export interface GraphicGapMatchChoice {
  /**
   * The choice's content as the body walk read it: the gap text's text and markup, or the gap
   * image's `img`, `picture` or `object`.
   */
  readonly content: readonly BodyNode[];
  /**
   * `fixed`: the choice keeps its document position when the interaction shuffles. The ASI
   * schema declares no such attribute on a gap choice, so a document gives false; the redacted
   * form may hold true.
   */
  readonly fixed: boolean;
  readonly identifier: string;
  /**
   * `object-label` of a `qti-gap-img`: the text that names the image, none for a gap text.
   */
  readonly label: Option.Option<string>;
  /**
   * `match-group`: the hotspots this choice may go to, none when absent, which means any.
   */
  readonly matchGroup: Option.Option<readonly string[]>;
  /**
   * `match-max`: the most hotspots this choice may fill, a repeat on one hotspot counting each
   * time; 0 is no limit.
   */
  readonly matchMax: bigint;
  /**
   * `match-min`, 0 when absent: the fewest hotspots this choice must fill for a valid response.
   */
  readonly matchMin: bigint;
}

/**
 * One `qti-associable-hotspot` of a Graphic Gap Match (Q-8): a gap of the pair's target side, an
 * area of the image.
 */
export interface AssociableHotspot {
  readonly coords: readonly Coordinate[];
  readonly identifier: string;
  /**
   * `hotspot-label`, the area's alternative text, which names the gap.
   */
  readonly label: Option.Option<string>;
  /**
   * `match-group`: the choices this hotspot accepts, none when absent, which means any.
   */
  readonly matchGroup: Option.Option<readonly string[]>;
  /**
   * `match-max`: the most choices this hotspot holds; 0 is no limit.
   */
  readonly matchMax: bigint;
  /**
   * `match-min`, 0 when absent: the fewest choices this hotspot must hold for a valid response.
   */
  readonly matchMin: bigint;
  readonly shape: HotspotGeometry;
}

/**
 * The model node of a Graphic Gap Match (Q-8), the kind `graphic-gap-match`: its Prompt, its
 * image, its choices and its hotspots in document order, and the limits and messages it declares,
 * bound to a `directedPair` response of `multiple` cardinality.
 */
export interface GraphicGapMatchInteraction extends ModuleInteraction<"graphic-gap-match"> {
  readonly choices: readonly GraphicGapMatchChoice[];
  /**
   * The author's `class` value, empty when absent.
   */
  readonly class: string;
  readonly hotspots: readonly AssociableHotspot[];
  /**
   * The image element and its subtree, read as body content, so the emitter resolves its URL and
   * keeps its `alt`.
   */
  readonly image: readonly BodyNode[];
  /**
   * `max-associations`, 1 when absent (the default the ASI XSD gives it on this interaction): the
   * most pairs a response may hold; 0 is no limit.
   */
  readonly maxAssociations: bigint;
  /**
   * The author's replacements for the messages of the two bounds, `data-max-selections-message` and
   * `data-min-selections-message`.
   */
  readonly messages: {
    readonly max: Option.Option<string>;
    readonly min: Option.Option<string>;
  };
  /**
   * `min-associations`, 0 when absent: the fewest pairs a valid response holds.
   */
  readonly minAssociations: bigint;
  readonly prompt: Option.Option<readonly BodyNode[]>;
  /**
   * `shuffle`: the choices, never the hotspots, are presented in an order keyed by the seed, the
   * instance and the response. The ASI schema declares no such attribute on this interaction, so a
   * document gives false; the redacted form may hold true.
   */
  readonly shuffle: boolean;
  readonly size: Option.Option<ImageSize>;
}

/**
 * One choice as the page may know it: its content, and what the render and the runtime read of its
 * limits.
 */
export interface GraphicGapMatchPayloadChoice {
  readonly content: readonly PayloadNode[];
  readonly identifier: string;
  readonly label: Option.Option<string>;
  /**
   * The hotspots the choice may go to, none listed when it may go to any.
   */
  readonly matchGroup: readonly string[];
  readonly matchMax: bigint;
}

/**
 * One hotspot as the page may know it: its identifier, label, shape and coordinates, and what the
 * render and the runtime read of its limits.
 */
export interface GraphicGapMatchPayloadHotspot {
  readonly coords: readonly Coordinate[];
  readonly identifier: string;
  readonly label: Option.Option<string>;
  /**
   * The choices the hotspot accepts, none listed when it accepts any.
   */
  readonly matchGroup: readonly string[];
  readonly matchMax: bigint;
  readonly shape: HotspotGeometry;
}

/**
 * The payload node of a Graphic Gap Match (Q-8), the kind `graphic-gap-match`: its Prompt, its
 * image, its choices in presented order, its hotspots, the name its hidden inputs post under, and
 * the pairs to restore. It holds no correct response.
 */
export interface GraphicGapMatchPayload {
  readonly ariaLabel: Option.Option<string>;
  readonly ariaLabelledby: Option.Option<string>;
  readonly choices: readonly GraphicGapMatchPayloadChoice[];
  /**
   * The author's `class` value, empty when absent.
   */
  readonly class: string;
  /**
   * The name its hidden inputs post under: the view's name for the response, else
   * `entryName(instance, response)`.
   */
  readonly formName: string;
  readonly hotspots: readonly GraphicGapMatchPayloadHotspot[];
  readonly image: readonly PayloadNode[];
  /**
   * `max-associations` as the item reads it, which the Root carries for the runtime.
   */
  readonly maxAssociations: bigint;
  readonly prompt: Option.Option<readonly PayloadNode[]>;
  /**
   * The identifier of the response it binds.
   */
  readonly response: string;
  /**
   * The pairs to show, each as posted, `<choice> <hotspot>`: the strings posted when the view has
   * messages, else the view's value.
   */
  readonly restore: readonly string[];
  readonly size: Option.Option<ImageSize>;
}

/**
 * The JSON form of a choice in a redacted body, with no path: its counts as decimal digits and
 * each `Option` an optional key.
 */
interface GraphicGapMatchChoiceJson {
  readonly content: readonly unknown[];
  readonly fixed: boolean;
  readonly identifier: string;
  readonly label?: string;
  readonly matchGroup?: readonly string[];
  readonly matchMax: string;
  readonly matchMin: string;
}

/**
 * The JSON form of a hotspot in a redacted body: its counts as decimal digits and each `Option` an
 * optional key.
 */
interface AssociableHotspotJson {
  readonly coords: readonly Coordinate[];
  readonly identifier: string;
  readonly label?: string;
  readonly matchGroup?: readonly string[];
  readonly matchMax: string;
  readonly matchMin: string;
  readonly shape: HotspotGeometry;
}

/**
 * The JSON form of {@link GraphicGapMatchInteraction} in a redacted body, as `payloadSchema`
 * encodes it: its counts as decimal digits, each `Option` an optional key, and no path. Its
 * content is held as the body's own JSON form, which this module cannot name.
 */
export interface GraphicGapMatchJson {
  readonly ariaLabel?: string;
  readonly ariaLabelledby?: string;
  readonly choices: readonly GraphicGapMatchChoiceJson[];
  readonly class: string;
  readonly hotspots: readonly AssociableHotspotJson[];
  readonly image: readonly unknown[];
  readonly kind: "graphic-gap-match";
  readonly maxAssociations: string;
  readonly messages: { readonly max?: string; readonly min?: string };
  readonly minAssociations: string;
  readonly prompt?: readonly unknown[];
  readonly response: string;
  readonly shuffle: boolean;
  readonly size?: ImageSize;
}

/**
 * The bounding box of a drawn area in the image's coordinate space, which frames the choices placed
 * in its gap.
 */
interface Frame {
  readonly height: number;
  readonly width: number;
  readonly x: number;
  readonly y: number;
}

/**
 * What the connect function computes for one gap: the Gap's attributes, its Outline when it draws
 * one (the shape and the Outline's attributes) and, for each restored pair that names the hotspot,
 * a GapChoice with its text, in the pairs' order, placed in the area's frame when there is one.
 */
interface GapItem {
  readonly gap: Attributes;
  readonly outline: Option.Option<{ readonly figure: Element; readonly props: Attributes }>;
  readonly placed: readonly TextProps[];
}

/**
 * The attributes of every part of one Graphic Gap Match, computed once by {@link connect}: one
 * entry per choice in presented order, per gap in document order, and per hidden input.
 */
interface Connected {
  readonly choice: readonly Attributes[];
  readonly choices: Attributes;
  readonly gaps: Attributes;
  readonly hidden: readonly Attributes[];
  readonly image: Attributes;
  readonly items: readonly GapItem[];
  readonly prompt: Attributes;
  readonly root: Attributes;
  /**
   * The image's `viewBox` attribute, which every `svg` over the image carries, none when its size
   * is unknown.
   */
  readonly viewBox: Attributes;
}

/**
 * Name a hotspot with no `hotspot-label` by its position among the hotspots, in English: "Area 2
 * of 3" (1.1.1 Non-text Content; D7).
 *
 * @param n The hotspot's position, from 1.
 * @param count How many hotspots there are.
 * @returns The name.
 */
const positionalName = (n: number, count: number): string => `Area ${n} of ${count}`;

/**
 * Give the choices in the order a render presents them: document order, or with `shuffle` the
 * order `shuffleOrder` draws under the key `<seed>\u001F<instance>\u001F<response>`, where an
 * absent seed is the empty string, each fixed choice at its document position. The hotspots never
 * move. The same interaction, seed and instance always give the same order, so `sequence` reports
 * the order `render` presents.
 *
 * @param interaction The Graphic Gap Match: its choices, its response and its `shuffle`.
 * @param seed The configuration's `seed`, none when it has none.
 * @param instance The item instance key the interaction is rendered under.
 * @returns The choices, in presented order.
 */
const presented = (
  interaction: Pick<GraphicGapMatchInteraction, "choices" | "response" | "shuffle">,
  seed: Option.Option<string>,
  instance: string,
): readonly GraphicGapMatchChoice[] =>
  interaction.shuffle
    ? shuffleOrder(
        [Option.getOrElse(seed, () => ""), instance, interaction.response].join(keySeparator),
        interaction.choices.map((choice) => choice.fixed),
      ).flatMap((index) => interaction.choices[index] ?? [])
    : interaction.choices;

/**
 * Split a posted pair into its source and its target, as a `directedPair` is written: two
 * identifiers separated by white space.
 *
 * @param pair The pair as posted.
 * @returns The two sides, none for a text that is not two identifiers.
 */
const sidesOf = (pair: string): Option.Option<readonly [string, string]> => {
  const [source, target, ...rest] = splitTokens(pair);

  return source === undefined || target === undefined || rest.length > 0
    ? Option.none()
    : Option.some([source, target] as const);
};

/**
 * Collapse runs of ASCII whitespace to one space and trim the ends.
 *
 * @param value The text.
 * @returns The collapsed text.
 */
const collapse = (value: string): string =>
  value.replaceAll(/[\t\n\f\r ]+/gu, " ").replaceAll(/^ | $/gu, "");

/**
 * Collect the text of some payload nodes: every text node, at any depth, as written.
 *
 * @param nodes The nodes.
 * @returns The text, concatenated.
 */
const textIn = (nodes: readonly PayloadNode[]): string =>
  nodes
    .map((node) => {
      if (node.kind === "text") {
        return node.text;
      }

      return node.kind === "element" ? textIn(node.children) : "";
    })
    .join("");

/**
 * Give the text a choice shows inside a gap: its content's text, collapsed; for a choice with none,
 * the `object-label` of a gap image; else "Choice n of count", `n` its presented position.
 *
 * @param choice The choice.
 * @param position The choice's position `n`, from 1, among the `count` choices as presented.
 * @param count How many choices there are.
 * @param locale The locale of the renderer's own text.
 * @returns The text.
 */
const shownText = (
  choice: GraphicGapMatchPayloadChoice,
  position: number,
  count: number,
  locale: Locale,
): string => {
  const written = collapse(textIn(choice.content));
  const label = collapse(Option.getOrElse(choice.label, () => ""));

  if (written !== "") {
    return written;
  }

  return label === ""
    ? message(locale, "choiceOf", { count: numeral(locale, count), n: numeral(locale, position) })
    : label;
};

/**
 * Name the group when the Prompt does not: the author's `aria-label`, as written unless it is
 * blank, and `aria-labelledby` with each id scoped by the instance; the group is `role="group"`
 * only when something names it.
 *
 * @param interaction The Graphic Gap Match's payload.
 * @param instance The item instance key, which scopes the author's ids.
 * @returns The naming attributes, none when the author gave neither.
 */
const authorsName = (interaction: GraphicGapMatchPayload, instance: string): Attributes => {
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
 * Read a hotspot's coordinates as numbers in the image's coordinate space: a percentage scaled by
 * the image's width (an x coordinate, a `circle`'s radius or an `ellipse`'s horizontal radius) or
 * its height (a y coordinate or a vertical radius); none when a percentage appears and the image's
 * size is unknown, the stated limit.
 *
 * @param hotspot The hotspot.
 * @param size The image's size, when known.
 * @returns The coordinates as numbers, or none.
 */
const numbersOf = (
  hotspot: GraphicGapMatchPayloadHotspot,
  size: Option.Option<ImageSize>,
): Option.Option<readonly number[]> => {
  if (hotspot.coords.every((coordinate) => !coordinate.percent)) {
    return Option.some(hotspot.coords.map((coordinate) => coordinate.value));
  }

  return size.pipe(
    Option.map(({ height, width }) =>
      hotspot.coords.map((coordinate, index) => {
        if (!coordinate.percent) {
          return coordinate.value;
        }

        // An ellipse's vertical radius is its fourth coordinate; every other even index is an x
        // coordinate, a circle's radius included, and every odd index a y coordinate.
        const alongHeight = index % 2 === 1 || (hotspot.shape === "ellipse" && index === 3);

        return (coordinate.value / 100) * (alongHeight ? height : width);
      }),
    ),
  );
};

/**
 * The presentation attribute every drawn shape carries: it takes pointer events where its Gap, its
 * Outline and every other box over the image take none, so a pointer on the area, and only there,
 * reaches the gap, which the runtime (issue m3d-06) listens on. A presentation attribute is not a
 * `style` attribute, so the playground's policy admits it.
 */
const hit = { "pointer-events": "visiblePainted" } as const;

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
const holdsAnyPoint = (geometry: HotspotGeometry, coords: readonly number[]): boolean => {
  const [x = 0, y = 0] = coords;

  return areaHolds[geometry](coords, x, y);
};

/**
 * Give the vertex pairs of a `poly`'s coordinates, an odd last coordinate ignored, as coordinates
 * beyond a geometry's are.
 *
 * @param coords The coordinates, as numbers.
 * @returns Each vertex, x then y.
 */
const verticesOf = (coords: readonly number[]): readonly (readonly [number, number])[] => {
  const vertices: (readonly [number, number])[] = [];
  for (let index = 0; index + 1 < coords.length; index += 2) {
    vertices.push([coords[index] ?? 0, coords[index + 1] ?? 0]);
  }

  return vertices;
};

/**
 * Give the bounding box of an area whose coordinates fit its geometry, in the image's coordinate
 * space: the box the choices placed in its gap are framed on.
 *
 * @param geometry The hotspot's `shape` attribute.
 * @param coords Its coordinates, as numbers, which fit the geometry.
 * @returns The frame.
 */
const frameOf = (geometry: HotspotGeometry, coords: readonly number[]): Frame => {
  switch (geometry) {
    case "rect": {
      const [left = 0, top = 0, right = 0, bottom = 0] = coords;

      return {
        height: Math.abs(bottom - top),
        width: Math.abs(right - left),
        x: Math.min(left, right),
        y: Math.min(top, bottom),
      };
    }
    case "circle": {
      const [cx = 0, cy = 0, r = 0] = coords;

      return { height: 2 * r, width: 2 * r, x: cx - r, y: cy - r };
    }
    case "ellipse": {
      const [cx = 0, cy = 0, rx = 0, ry = 0] = coords;

      return { height: 2 * ry, width: 2 * rx, x: cx - rx, y: cy - ry };
    }
    case "poly": {
      const vertices = verticesOf(coords);
      const xs = vertices.map(([x]) => x);
      const ys = vertices.map(([, y]) => y);
      const x = Math.min(...xs);
      const y = Math.min(...ys);

      return { height: Math.max(...ys) - y, width: Math.max(...xs) - x, x, y };
    }
    default: {
      return geometry satisfies never;
    }
  }
};

/**
 * Draw an area whose coordinates fit its geometry, in the image's coordinate space: a `rect` from
 * its corners in either order, a `circle`, an `ellipse`, or a `polygon` from its vertex pairs, an
 * odd last coordinate ignored, as coordinates beyond a geometry's are.
 *
 * @param geometry The hotspot's `shape` attribute.
 * @param coords Its coordinates, as numbers, which fit the geometry.
 * @returns The SVG element.
 */
const drawn = (geometry: HotspotGeometry, coords: readonly number[]): Element => {
  switch (geometry) {
    case "rect": {
      const frame = frameOf(geometry, coords);

      return h("rect", {
        ...hit,
        "data-shape": "rect",
        height: String(frame.height),
        width: String(frame.width),
        x: String(frame.x),
        y: String(frame.y),
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
      return h("polygon", {
        ...hit,
        "data-shape": "poly",
        points: verticesOf(coords)
          .map(([x, y]) => `${String(x)},${String(y)}`)
          .join(" "),
      });
    }
    default: {
      return geometry satisfies never;
    }
  }
};

/**
 * Give the one SVG element that draws a hotspot's area, with the area's frame: the area
 * {@link drawn} from its coordinates, or none for an area that holds no point ({@link areaHolds}),
 * which is how HTML's image-map processing reads an `area` with too few coordinates or a radius of
 * zero or less, and none when a percentage appears and the image's size is unknown.
 *
 * @param hotspot The hotspot.
 * @param size The image's size, when known.
 * @returns The element and its frame, or none.
 */
const outlineOf = (
  hotspot: GraphicGapMatchPayloadHotspot,
  size: Option.Option<ImageSize>,
): Option.Option<{ readonly figure: Element; readonly frame: Frame }> =>
  numbersOf(hotspot, size).pipe(
    Option.filter((coords) => holdsAnyPoint(hotspot.shape, coords)),
    Option.map((coords) => ({
      figure: drawn(hotspot.shape, coords),
      frame: frameOf(hotspot.shape, coords),
    })),
  );

/**
 * How the GapChoices of one gap are laid in its area's frame, in the image's coordinate space: the
 * stack of choices is centred on the frame's centre, which lies inside every convex area where a
 * corner of the frame does not, each choice one `line` below the one before, so several choices in
 * one gap never hide each other completely, and each baseline sits `baseline` units below its
 * line's centre, which centres text of the stylesheet's size on it. The units are the image's own,
 * so the text scales with the image; the stylesheet anchors each text on its `x`.
 */
const placement = { baseline: 6, line: 20 } as const;

/**
 * Give the choices the restored pairs put in one hotspot, in the pairs' order: a pair counts when
 * its source names a choice and its target the hotspot, and a pair that repeats counts each time.
 * With the area's frame, each GapChoice carries the `x` and `y` of its baseline
 * ({@link placement}); without one, the gap draws no Outline and its GapChoices stand unplaced.
 *
 * @param interaction The Graphic Gap Match's payload.
 * @param hotspot The hotspot's identifier.
 * @param frame The area's bounding box, none when it draws no Outline.
 * @param locale The locale of the renderer's own text.
 * @returns One GapChoice per pair that names the hotspot, with its text ({@link shownText}).
 */
const placedIn = (
  interaction: GraphicGapMatchPayload,
  hotspot: string,
  frame: Option.Option<Frame>,
  locale: Locale,
): readonly TextProps[] =>
  interaction.restore
    .flatMap((pair) => {
      const sides = Option.getOrUndefined(sidesOf(pair));
      if (sides === undefined || sides[1] !== hotspot) {
        return [];
      }

      const position = interaction.choices.findIndex((choice) => choice.identifier === sides[0]);
      const choice = interaction.choices[position];

      return choice === undefined ? [] : [{ choice, position: position + 1 }];
    })
    .map(({ choice, position }, line, all) => ({
      props: {
        "data-identifier": choice.identifier,
        "data-slot": rows.gapChoice.slot,
        ...Option.match(frame, {
          onNone: () => ({}),
          onSome: ({ height, width, x, y }) => ({
            x: String(x + width / 2),
            y: String(
              y + height / 2 + (line - (all.length - 1) / 2) * placement.line + placement.baseline,
            ),
          }),
        }),
      },
      text: shownText(choice, position, interaction.choices.length, locale),
    }));

/**
 * Compute every attribute of every part of one Graphic Gap Match: the connect function.
 *
 * - Root: the marker, the state (`data-mode`, and `data-disabled` when the author disabled every
 *   control), the author's `class`, `data-entry-name`, the name the runtime writes its hidden
 *   inputs under, and `data-max-associations`, the written value or its default. It is
 *   `role="group"`, named by the Prompt through `aria-labelledby` → the Prompt's id, and the
 *   author's names are not written; with no Prompt, by the author's `aria-label` and
 *   `aria-labelledby`; with neither, the group stays unnamed and carries no role.
 *   `aria-describedby` → the message ids when the response has a message.
 * - Prompt: the marker and its id. Image, Gaps, Choices: the marker.
 * - Choice, one for each choice in presented order: its identifier, its `match-max` and, when the
 *   choice names its hotspots, its `match-group`.
 * - Gap, one for each hotspot in document order: `role="group"` named by `aria-label`, the
 *   `hotspot-label` or the positional name; its identifier as `data-gap`; its `match-max` and, when
 *   the hotspot names its choices, its `match-group`. Its Outline, when it draws one: the marker,
 *   `aria-hidden`, and the image's `viewBox` when its size is known. Its GapChoices, one for each
 *   restored pair that names it ({@link placedIn}).
 * - Hidden, one for each pair to restore, only while the candidate may answer: `type="hidden"`, the
 *   name and the pair as posted. None in `review` and `solution`, nor when the author finished the
 *   item: the form posts nothing for it.
 *
 * @param interaction The Graphic Gap Match's payload.
 * @param payload The payload, which gives the instance, the mode, `finished` and the messages.
 * @param locale The locale of the renderer's own text.
 * @returns The attributes of every part.
 */
const connect = (
  interaction: GraphicGapMatchPayload,
  payload: Payload,
  locale: Locale,
): Connected => {
  const { instance } = payload;
  const promptId = scopedId(instance, interaction.response, "prompt");
  const messageIds = payload.messages
    .filter((entry) => entry.response === interaction.response)
    .map((entry) => entry.id);
  const answering = payload.mode === "answering" && !payload.finished;
  const viewBox = Option.match(interaction.size, {
    onNone: () => ({}),
    onSome: ({ height, width }) => ({ viewBox: `0 0 ${String(width)} ${String(height)}` }),
  });

  return {
    choice: interaction.choices.map((choice) => ({
      "data-identifier": choice.identifier,
      ...when(choice.matchGroup.length > 0, { "data-match-group": choice.matchGroup.join(" ") }),
      "data-match-max": String(choice.matchMax),
      "data-slot": rows.choice.slot,
    })),
    choices: { "data-slot": rows.choices.slot },
    gaps: { "data-slot": rows.gaps.slot },
    hidden: answering
      ? interaction.restore.map((pair) => ({
          "data-slot": rows.hidden.slot,
          name: interaction.formName,
          type: "hidden",
          value: pair,
        }))
      : [],
    image: { "data-slot": rows.image.slot },
    items: interaction.hotspots.map((hotspot, index) => {
      const outline = outlineOf(hotspot, interaction.size);

      return {
        gap: {
          "aria-label": Option.getOrElse(hotspot.label, () =>
            positionalName(index + 1, interaction.hotspots.length),
          ),
          "data-gap": hotspot.identifier,
          ...when(hotspot.matchGroup.length > 0, {
            "data-match-group": hotspot.matchGroup.join(" "),
          }),
          "data-match-max": String(hotspot.matchMax),
          "data-slot": rows.gap.slot,
          role: "group",
        },
        outline: outline.pipe(
          Option.map(({ figure }) => ({
            figure,
            props: { "aria-hidden": "true", "data-slot": rows.outline.slot, ...viewBox },
          })),
        ),
        placed: placedIn(
          interaction,
          hotspot.identifier,
          outline.pipe(Option.map(({ frame }) => frame)),
          locale,
        ),
      };
    }),
    prompt: { "data-slot": rows.prompt.slot, id: promptId },
    root: {
      ...Option.match(interaction.prompt, {
        onNone: () => authorsName(interaction, instance),
        onSome: () => ({ "aria-labelledby": promptId, role: "group" }),
      }),
      ...when(messageIds.length > 0, { "aria-describedby": messageIds.join(" ") }),
      ...when(interaction.class !== "", { class: interaction.class }),
      "data-entry-name": interaction.formName,
      "data-max-associations": String(interaction.maxAssociations),
      ...when(payload.finished, { "data-disabled": true }),
      "data-mode": payload.mode,
      "data-slot": rows.root.slot,
    },
    viewBox,
  };
};

/**
 * Frame the choices placed in a gap: an `svg` over the image in the Outline's coordinate space
 * (the same `viewBox`), `role="presentation"` so it adds no semantics of its own, holding the
 * GapChoices, each an SVG `text` at the baseline {@link placedIn} gave it.
 *
 * @param viewBox The Outline's `viewBox` attribute, none when the image's size is unknown.
 * @param placed The GapChoice elements.
 * @returns The framing element.
 */
const framed = (viewBox: Attributes, placed: readonly Element[]): Element =>
  h("svg", { role: "presentation", ...viewBox }, placed);

/**
 * Render a Graphic Gap Match: a `div` Root holding the Prompt, when there is one, the Image part
 * (the author's image, then the Gaps part with one Gap per hotspot, each holding its Outline and
 * its placed choices), a `ul` of Choices, and the hidden inputs.
 *
 * Each part goes through `applyPart` with its replacement from `state.parts`, so every swap holds
 * I1 to I4. The Prompt, each choice's content and the image go through {@link emitNodes}, as the
 * body's do, with the heading shift, ids and URLs of the body, so the image's URL resolves against
 * the asset base.
 *
 * @param interaction The Graphic Gap Match's payload.
 * @param payload The payload of the whole render, which gives the instance and `finished`.
 * @param state The locale, the heading level and the resolved part overrides.
 * @returns The Graphic Gap Match Root, or {@link PartSwapRefused} when a replacement breaks the
 *   swap invariant.
 * @throws {NestedInteractionDefect} When the Prompt or a choice's content holds an interaction,
 *   which QTI's schema admits nowhere there.
 */
const render = (
  interaction: GraphicGapMatchPayload,
  payload: Payload,
  state: EmitState,
): Result.Result<Element, PartSwapRefused> => {
  const props = connect(interaction, payload, state.locale);
  const emitContent = (
    nodes: readonly PayloadNode[],
  ): Result.Result<readonly Node[], PartSwapRefused> =>
    emitNodes(nodes, payload, state, nestedInteraction(owner));
  const replacement = (part: GraphicGapMatchPart) =>
    Option.getOrUndefined(state.parts.replacementFor(owner, part));
  const gapOf = (item: GapItem): Result.Result<Element, PartSwapRefused> =>
    Result.gen(function* gapItem() {
      const outline = yield* Result.transposeOption(
        item.outline.pipe(
          Option.map(({ figure, props: outlineProps }) =>
            applyPart(rows.outline, outlineProps, [figure], replacement("outline")),
          ),
        ),
      );
      const placed = yield* pipe(
        item.placed.map((chosen) =>
          applyPart(rows.gapChoice, chosen.props, [text(chosen.text)], replacement("gapChoice")),
        ),
        Result.all,
      );
      const shown: readonly Node[] = Option.match(item.outline, {
        onNone: () => placed,
        onSome: () => (placed.length === 0 ? [] : [framed(props.viewBox, placed)]),
      });

      return yield* applyPart(
        rows.gap,
        item.gap,
        [...Option.toArray(outline), ...shown],
        replacement("gap"),
      );
    });

  return Result.gen(function* graphicGapMatchRoot() {
    const prompt = yield* Result.transposeOption(
      interaction.prompt.pipe(
        Option.map((content) =>
          Result.flatMap(emitContent(content), (nodes) =>
            applyPart(rows.prompt, props.prompt, nodes, replacement("prompt")),
          ),
        ),
      ),
    );
    const image = yield* emitContent(interaction.image);
    const gaps = yield* pipe(props.items.map(gapOf), Result.all);
    const group = yield* applyPart(rows.gaps, props.gaps, gaps, replacement("gaps"));
    const box = yield* applyPart(rows.image, props.image, [...image, group], replacement("image"));
    const choices = yield* pipe(
      interaction.choices.map((choice, index) =>
        Result.flatMap(emitContent(choice.content), (nodes) =>
          applyPart(rows.choice, props.choice[index] ?? {}, nodes, replacement("choice")),
        ),
      ),
      Result.all,
    );
    const list = yield* applyPart(rows.choices, props.choices, choices, replacement("choices"));
    const hidden = yield* pipe(
      props.hidden.map((input) => applyPart(rows.hidden, input, [], replacement("hidden"))),
      Result.all,
    );

    return yield* applyPart(
      rows.root,
      props.root,
      [...Option.toArray(prompt), box, list, ...hidden],
      replacement("root"),
    );
  });
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
 * Record a `template-identifier` an element carries as a mark: plate shows no choice or hotspot by
 * a template value here.
 *
 * @param read The reader kit.
 * @param carrier The gap choice or hotspot.
 */
const markTemplate = (read: ReaderKit, carrier: SourceElement): void => {
  if (Option.isSome(read.valueOf(carrier, "template-identifier"))) {
    read.mark(carrier, "template-identifier");
  }
};

/**
 * Read one `qti-gap-text` or `qti-gap-img` into its choice: its identifier, its limits and its
 * content as the body walk reads it.
 *
 * @param read The reader kit.
 * @param choice The gap text or gap image.
 * @returns The choice, or a refusal.
 */
const readChoice = (
  read: ReaderKit,
  choice: SourceElement,
): Result.Result<GraphicGapMatchChoice, Refusal> =>
  Result.gen(function* readGapChoice() {
    read.markElement(choice);
    markTemplate(read, choice);

    const matchMax = yield* read.countAttribute(choice, "match-max");
    const matchMin = yield* read.countAttribute(choice, "match-min");

    return {
      content: yield* read.nodes(choice),
      fixed: false,
      identifier: yield* read.identifierAttribute(choice, "identifier"),
      label: read.valueOf(choice, "object-label"),
      matchGroup: Option.map(read.valueOf(choice, "match-group"), splitTokens),
      matchMax: Option.getOrElse(matchMax, () => 0n),
      matchMin: Option.getOrElse(matchMin, () => 0n),
    };
  });

/**
 * Read one `qti-associable-hotspot` into its hotspot: its identifier, its shape and coordinates
 * as written, its label and its limits.
 *
 * @param read The reader kit.
 * @param hotspot The associable hotspot.
 * @returns The hotspot, or a refusal.
 */
const readHotspot = (
  read: ReaderKit,
  hotspot: SourceElement,
): Result.Result<AssociableHotspot, Refusal> =>
  Result.gen(function* readAssociableHotspot() {
    read.markElement(hotspot);
    markTemplate(read, hotspot);

    const identifier = yield* read.identifierAttribute(hotspot, "identifier");
    const geometryAttribute = yield* read.requiredAttribute(hotspot, "shape");
    const geometry = yield* read.listed(hotspot, "shape", geometryAttribute, geometries);
    const coords = yield* read.coordsOf(hotspot);
    const matchMax = yield* read.countAttribute(hotspot, "match-max");
    const matchMin = yield* read.countAttribute(hotspot, "match-min");

    return {
      coords: coords.map(([value, percent]) => ({ percent, value })),
      identifier,
      label: read.valueOf(hotspot, "hotspot-label"),
      matchGroup: Option.map(read.valueOf(hotspot, "match-group"), splitTokens),
      matchMax: Option.getOrElse(matchMax, () => 0n),
      matchMin: Option.getOrElse(matchMin, () => 0n),
      shape: geometry,
    };
  });

/**
 * Read a `qti-graphic-gap-match-interaction` as {@link graphicGapMatchModule} renders it, through
 * the kit.
 *
 * The response must be declared (`undeclared-response` otherwise, as the shipped kinds refuse),
 * of base type `directedPair` and cardinality `multiple`; a declaration outside that is the notice
 * `base-type="…"` or `cardinality="…"`. The interaction must hold an image (the notice
 * `qti-graphic-gap-match-interaction` when it has none). The Prompt, each choice's content and the
 * image are read by the body walk. The features it reads and does not render are recorded as
 * marks: `data-choices-container-width`, and `template-identifier` on a choice or a hotspot.
 *
 * @param source The interaction's source element.
 * @param context The element's path, its notice and the reader kit.
 * @returns The model node, its notice, or a refusal.
 */
const parse = (
  source: SourceElement,
  context: ParseContext,
): Result.Result<GraphicGapMatchInteraction | Unsupported, Refusal> =>
  Result.gen(function* readGraphicGapMatch() {
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

    if (!Option.contains(declaration.cardinality, "multiple")) {
      return yield* context.notice(`cardinality="${writtenOf("cardinality")}"`);
    }

    if (!Option.contains(declaration.baseType, "directedPair")) {
      return yield* context.notice(`base-type="${writtenOf("base-type")}"`);
    }

    const image = read
      .elementsOf(source)
      .find((child) => imageElements.some((local) => read.isQti(child, local)));
    if (image === undefined) {
      return yield* context.notice(element);
    }

    read.markElement(source);
    if (Option.isSome(read.valueOf(source, "data-choices-container-width"))) {
      read.mark(source, "data-choices-container-width");
    }

    const maxAssociations = yield* read.countAttribute(source, "max-associations");
    const minAssociations = yield* read.countAttribute(source, "min-associations");
    const prompt = yield* read.content(source, "qti-prompt");
    const imageNodes = yield* read.nodes(source, { children: [image] });
    const choices: GraphicGapMatchChoice[] = [];
    const hotspots: AssociableHotspot[] = [];

    for (const child of read.elementsOf(source)) {
      if (read.isQti(child, "qti-gap-text") || read.isQti(child, "qti-gap-img")) {
        choices.push(yield* readChoice(read, child));
      } else if (read.isQti(child, "qti-associable-hotspot")) {
        hotspots.push(yield* readHotspot(read, child));
      }
    }

    return {
      ariaLabel: read.valueOf(source, "aria-label"),
      ariaLabelledby: read.valueOf(source, "aria-labelledby"),
      choices,
      class: Option.getOrElse(read.valueOf(source, "class"), () => ""),
      hotspots,
      image: imageNodes,
      kind: "graphic-gap-match",
      maxAssociations: Option.getOrElse(maxAssociations, () => 1n),
      messages: {
        max: read.valueOf(source, "data-max-selections-message"),
        min: read.valueOf(source, "data-min-selections-message"),
      },
      minAssociations: Option.getOrElse(minAssociations, () => 0n),
      path: context.path,
      prompt,
      response,
      shuffle: false,
      size: sizeOf(read, image),
    };
  });

/**
 * Count how often each identifier occurs, in order of first occurrence.
 *
 * @param identifiers The identifiers, with repeats.
 * @returns Each identifier with its count.
 */
const countsOf = (identifiers: readonly string[]): ReadonlyMap<string, number> => {
  const counts = new Map<string, number>();

  for (const identifier of identifiers) {
    counts.set(identifier, (counts.get(identifier) ?? 0) + 1);
  }

  return counts;
};

/**
 * Give the identifiers a `match-group` admits.
 *
 * @param side The choice or hotspot, none for an identifier that names none.
 * @returns Its `match-group`, empty when it names none, which means any.
 */
const groupOf = (side: Pick<AssociableHotspot, "matchGroup"> | undefined): readonly string[] =>
  side === undefined ? [] : Option.getOrElse(side.matchGroup, (): readonly string[] => []);

/**
 * Write "time" or "times" for a count, in English: this module's own strings stay in it.
 *
 * @param count The count.
 * @returns The noun that agrees with it.
 */
const timesNoun = (count: bigint): string => (count === 1n ? "time" : "times");

/**
 * Write "choice" or "choices" for a count, in English: this module's own strings stay in it.
 *
 * @param count The count.
 * @returns The noun that agrees with it.
 */
const choiceNoun = (count: bigint): string => (count === 1n ? "choice" : "choices");

/**
 * Check a Graphic Gap Match's response, which the caller decoded, in two tiers.
 *
 * The caller decodes the posted entries with `decode`, under the entry name its form gave the
 * hidden inputs and the binding a `directedPair` response travels under, and passes the value, or
 * the {@link Malformed} `decode` gave; the entry name stays the caller's, while the messages and
 * the author's overrides stay here.
 *
 * - A {@link Malformed} input: `atMost` 1 when the response was posted more than once as a single,
 *   else `unknownChoice`.
 * - Tier (a), always: a pair that names no choice or no hotspot (`unknownChoice`); a hotspot that
 *   holds more choices than its `match-max` (0 is no limit); a choice that goes to more hotspots
 *   than its `match-max`, a repeat counting each time; a pair outside the choice's `match-group` or
 *   the hotspot's; and `max-associations` above 0 capping the pairs (`atMost`).
 * - Tier (b), only under `validateResponses`: fewer pairs than `min-associations` (`atLeast`), a
 *   hotspot that holds fewer choices than its `match-min`, and a choice that goes to fewer hotspots
 *   than its `match-min`.
 *
 * The author's `data-max-selections-message` and `data-min-selections-message` replace the
 * renderer's text for `atMost` and `atLeast`. The messages of the other limits are this module's,
 * in English, and each names the hotspot or the choice at fault.
 *
 * @param interaction The Graphic Gap Match.
 * @param input The decoded value, or why the entries did not decode.
 * @param configuration The configuration, which gives the locale and `validateResponses`.
 * @returns One message per problem, none when the response is accepted.
 */
const validate = (
  interaction: GraphicGapMatchInteraction,
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

  if (input instanceof Malformed) {
    return [input.reason === "single-many" ? tooMany(1n) : say(message(locale, "unknownChoice"))];
  }

  const pairs = input.values.flatMap((single) =>
    single.baseType === "directedPair" ? [single.value] : [],
  );
  const choices = new Map(interaction.choices.map((choice) => [choice.identifier, choice]));
  const hotspots = new Map(interaction.hotspots.map((hotspot) => [hotspot.identifier, hotspot]));
  const perHotspot = countsOf(pairs.map(([, target]) => target));
  const perChoice = countsOf(pairs.map(([source]) => source));
  const outside = [...new Set(pairs.map(([source, target]) => `${source} ${target}`))].flatMap(
    (pair) => {
      const [source = "", target = ""] = pair.split(" ");
      const choiceGroup = groupOf(choices.get(source));
      const hotspotGroup = groupOf(hotspots.get(target));

      if (choiceGroup.length > 0 && !choiceGroup.includes(target)) {
        return [
          say(
            `Choice ${source} cannot go on area ${target}; use one of ${choiceGroup.join(", ")} instead.`,
          ),
        ];
      }

      return hotspotGroup.length > 0 && !hotspotGroup.includes(source)
        ? [
            say(
              `Choice ${source} cannot go on area ${target}; that area takes ${hotspotGroup.join(", ")}.`,
            ),
          ]
        : [];
    },
  );
  const tierA = [
    ...(pairs.some(([source, target]) => !choices.has(source) || !hotspots.has(target))
      ? [say(message(locale, "unknownChoice"))]
      : []),
    ...interaction.hotspots.flatMap((hotspot) =>
      hotspot.matchMax > 0n && BigInt(perHotspot.get(hotspot.identifier) ?? 0) > hotspot.matchMax
        ? [
            say(
              `Place at most ${numeral(locale, hotspot.matchMax)} ${choiceNoun(hotspot.matchMax)} on area ${hotspot.identifier}.`,
            ),
          ]
        : [],
    ),
    ...interaction.choices.flatMap((choice) =>
      choice.matchMax > 0n && BigInt(perChoice.get(choice.identifier) ?? 0) > choice.matchMax
        ? [
            say(
              `Use choice ${choice.identifier} at most ${numeral(locale, choice.matchMax)} ${timesNoun(choice.matchMax)}.`,
            ),
          ]
        : [],
    ),
    ...outside,
    ...(interaction.maxAssociations > 0n && BigInt(pairs.length) > interaction.maxAssociations
      ? [tooMany(interaction.maxAssociations)]
      : []),
  ];

  if (!configuration.validateResponses) {
    return tierA;
  }

  return [
    ...tierA,
    ...(BigInt(pairs.length) < interaction.minAssociations
      ? [tooFew(interaction.minAssociations)]
      : []),
    ...interaction.hotspots.flatMap((hotspot) =>
      BigInt(perHotspot.get(hotspot.identifier) ?? 0) < hotspot.matchMin
        ? [
            say(
              `Place at least ${numeral(locale, hotspot.matchMin)} ${choiceNoun(hotspot.matchMin)} on area ${hotspot.identifier}.`,
            ),
          ]
        : [],
    ),
    ...interaction.choices.flatMap((choice) =>
      BigInt(perChoice.get(choice.identifier) ?? 0) < choice.matchMin
        ? [
            say(
              `Use choice ${choice.identifier} at least ${numeral(locale, choice.matchMin)} ${timesNoun(choice.matchMin)}.`,
            ),
          ]
        : [],
    ),
  ];
};

/**
 * The Graphic Gap Match module (Q-8), the kind `graphic-gap-match`.
 */
export const graphicGapMatchModule: InteractionModule<
  "graphic-gap-match",
  GraphicGapMatchInteraction,
  GraphicGapMatchPayload,
  GraphicGapMatchPart,
  GraphicGapMatchJson
> = {
  /**
   * The one response Graphic Gap Match binds, which `postings` reads: its `directedPair`s are
   * posted as text with no number base.
   */
  bindings: (interaction) => [{ base: Option.none(), response: interaction.response }],
  /**
   * Graphic Gap Match's connect function, {@link connect}, as the record of parts the contract
   * names: the Root, the Prompt, the Image, the Gaps, the Choices, each Choice in presented order,
   * and each hotspot's Gap, Outline and GapChoices in document order.
   */
  connect: (interaction, payload, locale) => {
    const props = connect(interaction, payload, locale);

    return {
      choice: props.choice,
      choices: props.choices,
      gap: props.items.map((item) => item.gap),
      gapChoice: props.items.flatMap((item) => item.placed),
      gaps: props.gaps,
      hidden: props.hidden,
      image: props.image,
      outline: props.items.flatMap((item) =>
        Option.match(item.outline, { onNone: () => [], onSome: (figure) => [figure.props] }),
      ),
      prompt: props.prompt,
      root: props.root,
    };
  },
  /**
   * The payload nodes the render writes as content: the Prompt, the image, then each choice's
   * content in presented order.
   */
  content: (interaction) => [
    ...Option.getOrElse(interaction.prompt, () => []),
    ...interaction.image,
    ...interaction.choices.flatMap((choice) => choice.content),
  ],
  /**
   * No Controls: the script-free render holds hidden inputs only, and the runtime gives the input.
   */
  controls: () => 0,
  element,
  feature,
  /**
   * True: the module renders the kind.
   */
  implemented: true,
  kind: "graphic-gap-match",
  /**
   * The NULL of the multiple `directedPair` response Graphic Gap Match binds.
   */
  nullValue: () => nullOf("directedPair", "multiple"),
  owner,
  parse,
  parts,
  /**
   * The codec of a Graphic Gap Match in a redacted body: every field of the model node but its
   * path.
   */
  payloadSchema: ({ BodyNodes, Count, NoPath, OptionalText, Schema }) =>
    Schema.Struct({
      ariaLabel: OptionalText,
      ariaLabelledby: OptionalText,
      choices: Schema.Array(
        Schema.Struct({
          content: BodyNodes,
          fixed: Schema.Boolean,
          identifier: Schema.String,
          label: OptionalText,
          matchGroup: Schema.OptionFromOptionalKey(Schema.Array(Schema.String)),
          matchMax: Count,
          matchMin: Count,
        }),
      ),
      class: Schema.String,
      hotspots: Schema.Array(
        Schema.Struct({
          coords: Schema.Array(Schema.Struct({ percent: Schema.Boolean, value: Schema.Number })),
          identifier: Schema.String,
          label: OptionalText,
          matchGroup: Schema.OptionFromOptionalKey(Schema.Array(Schema.String)),
          matchMax: Count,
          matchMin: Count,
          shape: Schema.Literals(geometries),
        }),
      ),
      image: BodyNodes,
      kind: Schema.Literal("graphic-gap-match"),
      maxAssociations: Count,
      messages: Schema.Struct({ max: OptionalText, min: OptionalText }),
      minAssociations: Count,
      path: NoPath,
      prompt: Schema.OptionFromOptionalKey(BodyNodes),
      response: Schema.String,
      shuffle: Schema.Boolean,
      size: Schema.OptionFromOptionalKey(
        Schema.Struct({ height: Schema.Number, width: Schema.Number }),
      ),
    }),
  /**
   * Copy the Graphic Gap Match into its payload node: its content through the kit, its choices in
   * the order the seed and the instance present them, its hotspots in document order, and the
   * pairs the view shows, as posted when the view holds a refused post.
   */
  redact: (interaction, kit) => {
    const posted = kit.posted(interaction.response);
    const shown = kit.shown(interaction.response).map(format);

    return {
      ariaLabel: interaction.ariaLabel,
      ariaLabelledby: interaction.ariaLabelledby,
      choices: presented(interaction, kit.seed, kit.instance).map((choice) => ({
        content: kit.nodes(choice.content),
        identifier: choice.identifier,
        label: choice.label,
        matchGroup: Option.getOrElse(choice.matchGroup, () => []),
        matchMax: choice.matchMax,
      })),
      class: interaction.class,
      formName: kit.formName(interaction.response),
      hotspots: interaction.hotspots.map((hotspot) => ({
        coords: hotspot.coords,
        identifier: hotspot.identifier,
        label: hotspot.label,
        matchGroup: Option.getOrElse(hotspot.matchGroup, () => []),
        matchMax: hotspot.matchMax,
        shape: hotspot.shape,
      })),
      image: kit.nodes(interaction.image),
      maxAssociations: interaction.maxAssociations,
      prompt: interaction.prompt.pipe(Option.map(kit.nodes)),
      response: interaction.response,
      restore: Option.getOrElse(posted, () => shown),
      size: interaction.size,
    };
  },
  /**
   * The regions of the node's own content, in document order: its Prompt, its image, then each
   * choice's content.
   */
  regions: (interaction) => [
    ...Option.match(interaction.prompt, {
      onNone: () => [],
      onSome: (nodes): readonly OwnRegion[] => [
        { choice: Option.none(), nodes, part: "prompt", written: "nodes" },
      ],
    }),
    { choice: Option.none(), nodes: interaction.image, part: "content", written: "nodes" },
    ...interaction.choices.map((choice): OwnRegion => ({
      choice: Option.some(choice.identifier),
      nodes: choice.content,
      part: "choice",
      written: "nodes",
    })),
  ],
  render,
  /**
   * Rebuild the node with each region's content replaced, in the order `regions` gives them: the
   * Prompt, the image, then each choice's content.
   */
  replaceRegions: (interaction, contents) => {
    const [first, ...rest] = contents;
    const after = Option.isSome(interaction.prompt) ? rest : contents;
    const [image = interaction.image, ...choiceContents] = after;

    return {
      ...interaction,
      choices: interaction.choices.map((choice, index) => ({
        ...choice,
        content: choiceContents[index] ?? choice.content,
      })),
      image,
      prompt: interaction.prompt.pipe(Option.map((nodes) => first ?? nodes)),
    };
  },
  /**
   * The value Graphic Gap Match shows for a stored response: the stored pairs themselves.
   */
  restore: (_interaction, stored) => stored,
  /**
   * The order Graphic Gap Match's choices were presented in, as the identifiers separated by
   * spaces; none without `shuffle`.
   */
  sequence: (interaction, seed, instance) =>
    interaction.shuffle
      ? Option.some(
          presented(interaction, seed, instance)
            .map((choice) => choice.identifier)
            .join(" "),
        )
      : Option.none(),
  /**
   * The value Graphic Gap Match shows for the correct response: the correct pairs themselves.
   */
  solution: (_interaction, correct) => correct,
  /**
   * False: Graphic Gap Match renders no Control the renderer names.
   */
  unnamed: () => false,
  validate,
};

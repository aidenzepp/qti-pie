/**
 * M1's closed value sets: the QTI vocabulary phase 1 models, renders and reads, as data.
 *
 * Every set is closed: a value outside it is unsupported or invalid, never guessed at. The model
 * builder, the verdict and the emitter read these lists, so what phase 1 renders is decided once.
 *
 * The emitter consults no vocabulary class: what an element does comes from its QTI name,
 * attributes and binding alone. {@link styledClasses} lists the classes `styles.css` presents, and
 * {@link behaviourClasses} those whose meaning needs script, which M1 styles none of.
 *
 * @module
 */
import { Array as Arr, Option } from "effect";
import { trimXmlSpace } from "#plate/model/values.ts";

/**
 * The eleven QTI base types, as the `base-type` attribute spells them.
 *
 * The value model holds nine of them; a declaration of `duration` or `file` is a mark (see
 * {@link renders}).
 */
export const baseTypes = [
  "identifier",
  "boolean",
  "integer",
  "float",
  "string",
  "point",
  "pair",
  "directedPair",
  "duration",
  "file",
  "uri",
] as const;

/**
 * A QTI base type.
 */
export type BaseType = (typeof baseTypes)[number];

/**
 * The four QTI cardinalities, as the `cardinality` attribute spells them.
 */
export const cardinalities = ["single", "multiple", "ordered", "record"] as const;

/**
 * A QTI cardinality.
 */
export type Cardinality = (typeof cardinalities)[number];

/**
 * The five shapes of a `qti-area-map-entry`, as its `shape` attribute spells them.
 */
// oxlint-disable-next-line anti-slop/no-shape-in-symbol-names -- `shape` is the QTI attribute of `qti-area-map-entry` and names an area's geometry, not a structure.
export const areaShapes = ["circle", "default", "ellipse", "poly", "rect"] as const;

/**
 * The shape of an area a point response is mapped by.
 */
// oxlint-disable-next-line anti-slop/no-shape-in-symbol-names -- `shape` is the QTI attribute of `qti-area-map-entry` and names an area's geometry, not a structure.
export type AreaShape = (typeof areaShapes)[number];

/**
 * The QTI names of the three interactions M1 renders: Choice (Q-2), Text Entry (Q-20) and Extended
 * Text (Q-5).
 */
export const interactionNames = [
  "qti-choice-interaction",
  "qti-text-entry-interaction",
  "qti-extended-text-interaction",
] as const;

/**
 * An interaction M1 renders, by its QTI name.
 */
export type InteractionName = (typeof interactionNames)[number];

/**
 * The text interactions, Text Entry and Extended Text, which share their bindings and most of
 * their unsupported features.
 */
const textInteractions = ["qti-text-entry-interaction", "qti-extended-text-interaction"] as const;

/**
 * The declarations whose `base-type` and `cardinality` the model reads.
 */
const declarations = ["qti-response-declaration", "qti-outcome-declaration"] as const;

/**
 * The response-processing elements of the engine (spec §4.12): the ten elements it evaluates and
 * the three branches of `qti-response-condition`. `qti-equal` runs in its default `exact`
 * tolerance mode only; one in `absolute` or `relative` mode is a mark keyed
 * `tolerance-mode="<mode>"`.
 *
 * An inline `qti-response-processing` that uses only these becomes a rule tree; one that uses any
 * other element is a mark keyed by that element's name.
 */
const engine = [
  "qti-response-condition",
  "qti-response-if",
  "qti-response-else-if",
  "qti-response-else",
  "qti-set-outcome-value",
  "qti-match",
  "qti-variable",
  "qti-correct",
  "qti-base-value",
  "qti-is-null",
  "qti-map-response",
  "qti-map-response-point",
  "qti-equal",
] as const;

/**
 * The declarations an interaction renders with: the response declaration it binds must have one of
 * `baseTypes` and one of `cardinalities`.
 */
export interface Binding {
  readonly baseTypes: readonly BaseType[];
  readonly cardinalities: readonly Cardinality[];
}

/**
 * Extended Text's binding, which also limits the `format` it renders with: one of `formats`, or
 * none, which means `plain`.
 */
export interface FormattedBinding extends Binding {
  readonly formats: readonly string[];
}

/**
 * What makes an element carry an unsupported feature.
 *
 * - `element`: the element itself is present.
 * - `attribute`: the element carries the attribute `name`, with any value. A name in the XML
 *   namespace is spelled with its reserved prefix, `xml:base`.
 * - `attribute-value`: the element's attribute `name` has the value `value`.
 * - `attribute-true`: the element's `xs:boolean` attribute `name` is true: `true` or `1` once its
 *   outer whitespace goes, as XSD reads it (reading Q8).
 * - `cardinality`: the response declaration the interaction binds has this cardinality.
 * - `refused-pattern`: the element carries the attribute `name`, and the translator refuses its value
 *   as an XML Schema regular expression (`translate` in `#plate/model/regex.ts`), so the pattern
 *   cannot be checked.
 * - `template`: the element's `template` URI resolves to this built-in ({@link templateName}).
 * - `untyped`: the declaration carries no `base-type` and its cardinality is not `record`, the one
 *   cardinality that has none.
 */
export type Condition =
  | { readonly kind: "element" }
  | { readonly kind: "attribute"; readonly name: string }
  | { readonly kind: "attribute-value"; readonly name: string; readonly value: string }
  | { readonly kind: "attribute-true"; readonly name: string }
  | { readonly cardinality: Cardinality; readonly kind: "cardinality" }
  | { readonly kind: "refused-pattern"; readonly name: string }
  | { readonly kind: "template"; readonly name: TemplateName }
  | { readonly kind: "untyped" };

/**
 * A feature phase 1 does not render, with the key the verdict and its notice name it by.
 *
 * `on` names the elements that can carry it by their QTI local name, or is `body` for every element
 * in the item body.
 */
export interface Feature {
  readonly feature: string;
  readonly on: "body" | readonly string[];
  readonly when: Condition;
}

/**
 * The phase-1 "renders" set of spec §4.5, which the model builder, the verdict and the emitter
 * read.
 */
export interface Renders {
  /**
   * The interactions phase 1 renders, each with the binding it renders with.
   */
  readonly bindings: {
    readonly "qti-choice-interaction": Binding;
    readonly "qti-extended-text-interaction": FormattedBinding;
    readonly "qti-text-entry-interaction": Binding;
  };
  /**
   * The `qti-*` elements phase 1 renders or reads, the engine's included. Every element in the QTI
   * namespace without the `qti-` prefix is HTML and renders as itself.
   */
  readonly elements: readonly string[];
  /**
   * The response-processing elements phase 1 evaluates.
   */
  readonly engine: readonly string[];
  /**
   * The features recorded on the verdict with no body notice. A declaration the model does not hold
   * carries one: its base type (`duration`, `file`, or `base-type=""` when it has none) or
   * `cardinality="record"`. Beyond these, a `qti-*` element outside the item body and outside
   * `elements` is a mark keyed by its own name, response processing by a template URI outside the
   * built-ins is a mark keyed `template="<uri>"`, inline response processing with an element
   * outside `engine` is a mark keyed by that element's name, and a `qti-equal` outside its `exact`
   * tolerance mode is a mark keyed `tolerance-mode="<mode>"`.
   */
  readonly marks: readonly Feature[];
  /**
   * The features shown as a notice in place of their interaction. Beyond these, a `qti-*` element
   * in the item body outside `elements` is a notice keyed by its own name, which covers the custom
   * interactions (Q-31, Q-32): accepted, not launched.
   */
  readonly notices: readonly Feature[];
}

/**
 * What phase 1 renders, reads, shows a notice for and marks, as data (spec §4.5).
 *
 * The emitter and the model builder read the same lists, so an element is rendered exactly when
 * the verdict does not name it unsupported.
 */
export const renders = {
  bindings: {
    "qti-choice-interaction": {
      baseTypes: ["identifier"],
      cardinalities: ["single", "multiple"],
    },
    "qti-extended-text-interaction": {
      baseTypes: ["string", "integer", "float"],
      cardinalities: ["single"],
      formats: ["plain", "preformatted", "xhtml"],
    },
    "qti-text-entry-interaction": {
      baseTypes: ["string", "integer", "float"],
      cardinalities: ["single"],
    },
  },
  elements: [
    "qti-assessment-item",
    "qti-response-declaration",
    "qti-outcome-declaration",
    "qti-correct-response",
    "qti-default-value",
    "qti-value",
    "qti-mapping",
    "qti-map-entry",
    "qti-area-mapping",
    "qti-area-map-entry",
    "qti-item-body",
    "qti-response-processing",
    ...interactionNames,
    "qti-prompt",
    "qti-simple-choice",
    ...engine,
  ],
  engine,
  marks: [
    {
      feature: 'shuffle="true"',
      on: ["qti-choice-interaction"],
      when: { kind: "attribute-true", name: "shuffle" },
    },
    {
      feature: "string-identifier",
      on: textInteractions,
      when: { kind: "attribute", name: "string-identifier" },
    },
    {
      feature: 'adaptive="true"',
      on: ["qti-assessment-item"],
      when: { kind: "attribute-true", name: "adaptive" },
    },
    {
      feature: "qti-template-declaration",
      on: ["qti-template-declaration"],
      when: { kind: "element" },
    },
    {
      feature: 'base-type="duration"',
      on: declarations,
      when: { kind: "attribute-value", name: "base-type", value: "duration" },
    },
    {
      feature: 'base-type="file"',
      on: declarations,
      when: { kind: "attribute-value", name: "base-type", value: "file" },
    },
    {
      feature: 'cardinality="record"',
      on: declarations,
      when: { kind: "attribute-value", name: "cardinality", value: "record" },
    },
    // A declaration with no base type is keyed `base-type=""`, as an interaction bound to one is.
    { feature: 'base-type=""', on: declarations, when: { kind: "untyped" } },
    { feature: "xml:base", on: "body", when: { kind: "attribute", name: "xml:base" } },
    {
      feature: "data-catalog-idref",
      on: "body",
      when: { kind: "attribute", name: "data-catalog-idref" },
    },
    {
      feature: "data-qti-suppress-tts",
      on: "body",
      when: { kind: "attribute", name: "data-qti-suppress-tts" },
    },
    { feature: "data-ssml", on: "body", when: { kind: "attribute", name: "data-ssml" } },
  ],
  notices: [
    // A pattern the translator takes is checked. One it refuses keeps this notice and the item stays
    // accepted: the schema types pattern-mask as xs:string, so such a pattern is unsupported, not
    // invalid.
    {
      feature: "pattern-mask",
      on: textInteractions,
      when: { kind: "refused-pattern", name: "pattern-mask" },
    },
    {
      feature: 'cardinality="record"',
      on: textInteractions,
      when: { cardinality: "record", kind: "cardinality" },
    },
    {
      feature: 'cardinality="multiple"',
      on: ["qti-extended-text-interaction"],
      when: { cardinality: "multiple", kind: "cardinality" },
    },
    {
      feature: 'cardinality="ordered"',
      on: ["qti-extended-text-interaction"],
      when: { cardinality: "ordered", kind: "cardinality" },
    },
  ],
} as const satisfies Renders;

/**
 * The vocabulary attributes that carry an author's replacement for a validation message.
 */
export const messageAttributes = [
  "data-max-selections-message",
  "data-min-selections-message",
  "data-patternmask-message",
] as const;

/**
 * The two URI prefixes of QTI 3's response-processing templates (reading 9.23's shared part).
 *
 * A built-in template is either prefix followed by its name, with or without `.xml`.
 */
export const templatePrefixes = [
  "https://purl.imsglobal.org/spec/qti/v3p0/rptemplates/",
  "https://www.imsglobal.org/question/qti_v3p0/rptemplates/",
] as const;

/**
 * The response-processing templates the renderer recognises by name (reading 9.23 at head-cto's
 * pick B, R-a), each of which runs as the rule tree its file gives: the three canonical templates
 * `match_correct`, `map_response` and `map_response_point`, and the Common Cartridge templates
 * `CC2_match` (the rules of `match_correct`), `CC2_match_basic` and `CC2_map_response`. A name is
 * the URI's final path segment, with or without `.xml`, under either of {@link templatePrefixes},
 * as {@link templateName} resolves it.
 */
export const templateNames = [
  "match_correct",
  "map_response",
  "map_response_point",
  "CC2_match",
  "CC2_match_basic",
  "CC2_map_response",
] as const;

/**
 * A response-processing template the renderer recognises.
 */
export type TemplateName = (typeof templateNames)[number];

/**
 * A run of XML whitespace.
 */
const xmlWhitespaceRun = /[\t\n\r ]+/gu;

/**
 * Resolve a `template` URI to the built-in it names.
 *
 * The XSD types `template` as `xs:anyURI`, whose whitespace facet is `collapse`, so the URI is
 * collapsed before it is matched: the XML whitespace at either end is removed and each inner run
 * becomes one space. A padded built-in URI names its template; a URI with whitespace inside it
 * names none.
 *
 * @param uri The `template` attribute's value, as written.
 * @returns The built-in's name when the collapsed `uri` is one of {@link templatePrefixes} followed
 *   by it, with or without `.xml`; none for any other URI.
 */
export const templateName = (uri: string): Option.Option<TemplateName> => {
  const collapsed = trimXmlSpace(uri).replaceAll(xmlWhitespaceRun, " ");

  return Arr.findFirst(templatePrefixes, (prefix) => collapsed.startsWith(prefix)).pipe(
    Option.map((prefix) => collapsed.slice(prefix.length)),
    Option.flatMap((rest) =>
      Arr.findFirst(templateNames, (name) => rest === name || rest === `${name}.xml`),
    ),
  );
};

/**
 * The owners of the QTI shared vocabulary classes M1 knows (I-19): the three interactions it
 * renders, and the item body, which carries the general utility classes.
 */
export type ClassOwner =
  | "choice-interaction"
  | "text-entry-interaction"
  | "extended-text-interaction"
  | "body";

/**
 * The two vertical-writing classes, which each interaction owner holds (`vocab.txt:4802-4840` for
 * Choice, `:4961` for Text Entry, `:5171` for Extended Text).
 */
const writingClasses = [
  "qti-writing-orientation-vertical-rl",
  "qti-writing-orientation-vertical-lr",
] as const;

/**
 * The vocabulary classes M1's stylesheet gives a presentation, by owner.
 *
 * The inventory is closed: a `qti-*` class outside it has no rule. It holds no alias for the
 * corpus misspelling `qti-label-suffix-period`, and not `qti-keyword-emphasis` (M4). The rest of
 * the vocabulary's utility classes and its layout grid are M3's.
 */
export const styledClasses: Readonly<Record<ClassOwner, readonly string[]>> = {
  /**
   * The general utility classes on the item body: `vocab.txt:441` (`qti-visually-hidden`), `:559`
   * (`qti-underline`), `:578` (`qti-italic`), `:1010` (`qti-hidden`) and `:1061` (`qti-bordered`,
   * `qti-well`).
   */
  body: [
    "qti-hidden",
    "qti-visually-hidden",
    "qti-underline",
    "qti-italic",
    "qti-bordered",
    "qti-well",
  ],
  /**
   * Choice's labels, suffixes, orientation, stacking, hidden controls and vertical writing: the
   * summary table, `vocab.txt:4026-4063`, and sections 1.2.1.1 to 1.2.1.9, `:4329-4840`, which add
   * `qti-labels-cjk-ideographic` and the writing classes.
   */
  "choice-interaction": [
    "qti-labels-none",
    "qti-labels-decimal",
    "qti-labels-lower-alpha",
    "qti-labels-upper-alpha",
    "qti-labels-cjk-ideographic",
    "qti-labels-suffix-none",
    "qti-labels-suffix-period",
    "qti-labels-suffix-parenthesis",
    "qti-orientation-horizontal",
    "qti-orientation-vertical",
    "qti-choices-stacking-1",
    "qti-choices-stacking-2",
    "qti-choices-stacking-3",
    "qti-choices-stacking-4",
    "qti-choices-stacking-5",
    "qti-input-control-hidden",
    ...writingClasses,
  ],
  /**
   * Extended Text's heights and vertical writing: the summary table, `vocab.txt:4095-4110`, with
   * section 1.2.3.1, `:4997`, and section 1.2.3.4, `:5171`.
   */
  "extended-text-interaction": [
    "qti-height-lines-3",
    "qti-height-lines-6",
    "qti-height-lines-15",
    ...writingClasses,
  ],
  /**
   * Text Entry's input widths and vertical writing: the summary table, `vocab.txt:4063-4095`, with
   * section 1.2.2.1, `:4847`, and section 1.2.2.3, `:4961`.
   */
  "text-entry-interaction": [
    "qti-input-width-1",
    "qti-input-width-2",
    "qti-input-width-3",
    "qti-input-width-4",
    "qti-input-width-6",
    "qti-input-width-10",
    "qti-input-width-15",
    "qti-input-width-20",
    "qti-input-width-25",
    "qti-input-width-30",
    "qti-input-width-35",
    "qti-input-width-40",
    "qti-input-width-45",
    "qti-input-width-50",
    "qti-input-width-72",
    ...writingClasses,
  ],
};

/**
 * The vocabulary classes whose meaning needs script, by owner: M1 recognises them and styles none
 * of them; their runtime is M3's.
 */
export const behaviourClasses: Readonly<Record<ClassOwner, readonly string[]>> = {
  /**
   * None: the body's utility classes M1 knows are all presentational.
   */
  body: [],
  /**
   * None: Choice's vocabulary is all presentational.
   */
  "choice-interaction": [],
  /**
   * The character counters, which count the response's characters live: `vocab.txt:5082`, section
   * 1.2.3.2.
   */
  "extended-text-interaction": ["qti-counter-up", "qti-counter-down"],
  /**
   * None: Text Entry's vocabulary is all presentational.
   */
  "text-entry-interaction": [],
};

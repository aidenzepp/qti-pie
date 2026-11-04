/**
 * M1's closed value sets: the QTI vocabulary phase 1 models, renders and reads, as data.
 *
 * Every set is closed: a value outside it is unsupported or invalid, never guessed at. The model
 * builder, the verdict and the emitter read these lists, so what phase 1 renders is decided once.
 *
 * Phase 1's emitter consults no behaviour class: what an element does comes from its QTI name,
 * attributes and binding alone. The presentational classes are M1-S2's stylesheet.
 *
 * @module
 */
import { Array as Arr, Option } from "effect";
import { trimXmlSpace } from "#plate/model/values.ts";

/**
 * The eleven QTI base types, as the `base-type` attribute spells them.
 *
 * Phase 1 models eight of them; a declaration of `point`, `duration` or `file` is a mark (see
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
 * The response-processing elements of phase 1's engine (spec §4.12): the eight elements it
 * evaluates and the three branches of `qti-response-condition`.
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
   * carries one: its base type (`point`, `duration`, `file`, or `base-type=""` when it has none) or
   * `cardinality="record"`. Beyond these, a `qti-*` element outside the item body and outside
   * `elements` is a mark keyed by its own name, response processing by a template URI outside the
   * built-ins is a mark keyed `template="<uri>"`, and inline response processing with an element
   * outside `engine` is a mark keyed by that element's name.
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
      formats: ["plain", "preformatted"],
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
      feature: 'base-type="point"',
      on: declarations,
      when: { kind: "attribute-value", name: "base-type", value: "point" },
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
    {
      feature: "map_response_point",
      on: ["qti-response-processing"],
      when: { kind: "template", name: "map_response_point" },
    },
  ],
  notices: [
    {
      feature: "pattern-mask",
      on: textInteractions,
      when: { kind: "attribute", name: "pattern-mask" },
    },
    {
      feature: 'format="xhtml"',
      on: ["qti-extended-text-interaction"],
      when: { kind: "attribute-value", name: "format", value: "xhtml" },
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
 * The response-processing templates phase 1 recognises by name: `match_correct` and `map_response`
 * run, and `map_response_point` is a mark.
 */
export const templateNames = ["match_correct", "map_response", "map_response_point"] as const;

/**
 * A response-processing template phase 1 recognises.
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
 *   by it, with or without `.xml`; none for any other URI, the `CC2_*` templates included.
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

/**
 * The item model: what phase 1 reads from a valid `qti-assessment-item`, typed, with every feature
 * it does not render named as a notice or a mark.
 *
 * {@link buildItem} reads the declarations, the body and the response processing into one
 * {@link Item}. The vocabulary module's `renders` decides what is modelled and what is unsupported,
 * so the verdict, the payload and the emitter meet the same decision. A typed value outside its
 * lexical space is the content refusal `value-type`, so a caller that builds an item stays total.
 *
 * @module
 */
import { Array as Arr, Data, Effect, Option, Result, pipe } from "effect";
import { attributePath, qtiNamespace, walk, xmlNamespace } from "#plate/document/source.ts";
import type {
  SourceAttribute,
  SourceChild,
  SourceDocument,
  SourceElement,
} from "#plate/document/source.ts";
import { translate } from "#plate/model/regex.ts";
import { isModelled, parseElementText, parseLexical, trimXmlSpace } from "#plate/model/values.ts";
import type { InvalidValue, ModelledBaseType, Single, Value } from "#plate/model/values.ts";
import { Refusal } from "#plate/validate/refusal.ts";
import type { RefusalRule } from "#plate/validate/refusal.ts";
import {
  // oxlint-disable-next-line anti-slop/no-shape-in-symbol-names -- `shape` is the QTI attribute of `qti-area-map-entry` and names an area's geometry, not a structure.
  areaShapes,
  baseTypes,
  cardinalities,
  greatestCount,
  interactionNames,
  leastCount,
  renders,
  templateName,
} from "#plate/vocabulary.ts";
import type {
  // oxlint-disable-next-line anti-slop/no-shape-in-symbol-names -- `shape` is the QTI attribute of `qti-area-map-entry` and names an area's geometry, not a structure.
  AreaShape,
  Condition,
  FeatureRule,
  InteractionName,
  TemplateName,
} from "#plate/vocabulary.ts";

/**
 * A feature the item holds and phase 1 does not render, where it is, and how it is shown: a
 * `notice` in the body in place of its part, or a `mark` on the verdict only.
 */
export interface UnsupportedFeature {
  /**
   * The feature's key, as the verdict and its notice name it: an element name, an attribute name,
   * or `name="value"`.
   */
  readonly feature: string;
  /**
   * The element path of the element that carries it.
   */
  readonly path: string;
  readonly shown: "mark" | "notice";
}

/**
 * One `qti-map-entry`: the key in its response's base type, the value it maps to, and whether a
 * string key compares case-sensitively (`case-sensitive`, false by default).
 */
export interface MapEntry {
  readonly caseSensitive: boolean;
  readonly key: Single;
  readonly value: number;
}

/**
 * A response's `qti-mapping`, in document order.
 */
export interface Mapping {
  /**
   * The value of a response value no entry maps; 0 when `default-value` is absent.
   */
  readonly defaultValue: number;
  readonly entries: readonly MapEntry[];
  readonly lowerBound: Option.Option<number>;
  readonly upperBound: Option.Option<number>;
}

/**
 * One `qti-area-map-entry`: an area of the coordinate space and the value a point inside it maps
 * to.
 */
export interface AreaMapEntry {
  /**
   * The `coords`, in written order. A coordinate written with `%` holds its number without the
   * sign; the mapping's `percent` records that one was.
   */
  readonly coords: readonly number[];
  readonly mappedValue: number;
  // oxlint-disable-next-line anti-slop/no-shape-in-symbol-names -- `shape` is the QTI attribute of `qti-area-map-entry` and names an area's geometry, not a structure.
  readonly shape: AreaShape;
}

/**
 * A point response's `qti-area-mapping`, its entries in document order.
 */
export interface AreaMapping {
  /**
   * The value of a point no area maps; 0 when `default-value` is absent.
   */
  readonly defaultValue: number;
  readonly entries: readonly AreaMapEntry[];
  readonly lowerBound: Option.Option<number>;
  /**
   * Whether any coordinate of any entry is written with `%`. What a percentage means in scoring is
   * open (9.15) and the corpus has none, so response processing that reads such a mapping is marked
   * `area-coords-percent` and does not run.
   */
  readonly percent: boolean;
  readonly upperBound: Option.Option<number>;
}

/**
 * A `qti-response-declaration` of a modelled base type and cardinality (I-1).
 */
export interface ResponseDeclaration {
  /**
   * The `qti-area-mapping` of a `point` declaration, when it has one; none for every other base
   * type.
   */
  readonly areaMapping: Option.Option<AreaMapping>;
  readonly baseType: ModelledBaseType;
  readonly cardinality: Value["cardinality"];
  /**
   * The `qti-correct-response`, when the declaration has one.
   */
  readonly correct: Option.Option<Value>;
  /**
   * The `qti-default-value`, when the declaration has one.
   */
  readonly defaultValue: Option.Option<Value>;
  readonly identifier: string;
  readonly mapping: Option.Option<Mapping>;
}

/**
 * The views an outcome is reported to, the XSD's `ViewEnumDType`.
 */
export const views = [
  "author",
  "candidate",
  "proctor",
  "scorer",
  "testConstructor",
  "tutor",
] as const;

/**
 * One of {@link views}.
 */
export type View = (typeof views)[number];

/**
 * A `qti-outcome-declaration` of a modelled base type and cardinality (I-2).
 *
 * Its last six fields are the attributes Results Reporting mirrors on an `outcomeVariable`, each
 * read as the XSD types it and none when the declaration does not carry it. No XSD default is
 * filled in, so an absent `normal-minimum` is none, not 0. Nothing renders them.
 */
export interface OutcomeDeclaration {
  readonly baseType: ModelledBaseType;
  readonly cardinality: Value["cardinality"];
  /**
   * The `qti-default-value`, when the declaration has one.
   */
  readonly defaultValue: Option.Option<Value>;
  readonly identifier: string;
  /**
   * `interpretation`, an `xs:string`, as written.
   */
  readonly interpretation: Option.Option<string>;
  /**
   * `long-interpretation`, an `xs:anyURI`, with its whitespace collapsed. It is only ever copied
   * into a result, never rendered or fetched, so it does not pass through `#plate/model/url.ts`.
   */
  readonly longInterpretation: Option.Option<string>;
  /**
   * `mastery-value`, an `xs:double`.
   */
  readonly masteryValue: Option.Option<number>;
  /**
   * `normal-maximum`, an `xs:double`. The structural check holds it above 0 (reading 16).
   */
  readonly normalMaximum: Option.Option<number>;
  /**
   * `normal-minimum`, an `xs:double`.
   */
  readonly normalMinimum: Option.Option<number>;
  /**
   * `view`, a list of {@link views} in the order written. The structural check holds it to at
   * least one view (reading 17).
   */
  readonly view: Option.Option<readonly View[]>;
}

/**
 * The six reporting attributes of an {@link OutcomeDeclaration}.
 */
export type OutcomeReporting = Pick<
  OutcomeDeclaration,
  | "interpretation"
  | "longInterpretation"
  | "masteryValue"
  | "normalMaximum"
  | "normalMinimum"
  | "view"
>;

/**
 * Construct the refusal of an attribute of the document being read, at that attribute's path.
 * Each model passes its own, so a refusal names the document and path it was found in.
 */
export type AttributeRefusal = (
  attribute: SourceAttribute,
  rule: RefusalRule,
  detail: Readonly<Record<string, string>>,
) => Refusal;

/**
 * An attribute of a body element as written, `xml:lang` under the name `xml:lang`.
 */
export interface BodyAttribute {
  readonly name: string;
  readonly value: string;
}

/**
 * An HTML element of the QTI namespace in the item body (I-8), with its attributes as written but
 * for the ones marked unsupported.
 */
export interface BodyElement {
  readonly attributes: readonly BodyAttribute[];
  readonly children: readonly BodyNode[];
  readonly kind: "element";
  readonly path: string;
  readonly tag: string;
}

/**
 * A run of text in the item body, whitespace included.
 */
export interface BodyText {
  readonly kind: "text";
  readonly text: string;
}

/**
 * A `qti-simple-choice`: its identifier, its content, and whether it is fixed.
 */
export interface SimpleChoice {
  readonly content: readonly BodyNode[];
  /**
   * `fixed`, an `xs:boolean`, false when absent: a fixed choice keeps its document position when
   * its Choice is shuffled.
   */
  readonly fixed: boolean;
  readonly identifier: string;
}

/**
 * A `qti-choice-interaction` (Q-2), bound to an identifier response of single or multiple
 * cardinality. The model keeps its choices in document order whatever `shuffle` says; the payload
 * presents a shuffled Choice's choices in the seeded order, each fixed choice at its own place.
 */
export interface ChoiceInteraction {
  /**
   * The author's `aria-label`, which names the group when there is no Prompt.
   */
  readonly ariaLabel: Option.Option<string>;
  /**
   * The author's `aria-labelledby`, an IDREFS value as written, which names the group when there is
   * no Prompt.
   */
  readonly ariaLabelledby: Option.Option<string>;
  readonly cardinality: "multiple" | "single";
  readonly choices: readonly SimpleChoice[];
  /**
   * The author's `class` value, empty when absent.
   */
  readonly class: string;
  readonly kind: "choice";
  /**
   * `max-choices`, 1 when absent: a count, 0 to 2^63-1, held exactly (reading 46).
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
  readonly orientation: Option.Option<string>;
  readonly path: string;
  readonly prompt: Option.Option<readonly BodyNode[]>;
  /**
   * The identifier of the response it binds, `response-identifier`.
   */
  readonly response: string;
  readonly shuffle: boolean;
}

/**
 * A `qti-text-entry-interaction` (Q-20), bound to a single `string`, `integer` or `float` response.
 */
export interface TextEntryInteraction {
  readonly ariaLabel: Option.Option<string>;
  readonly ariaLabelledby: Option.Option<string>;
  /**
   * The number base of an integer response, `base`, an `xs:int`, 10 when absent.
   */
  readonly base: number;
  readonly baseType: "float" | "integer" | "string";
  /**
   * The author's `class` value, empty when absent.
   */
  readonly class: string;
  /**
   * `expected-length`: a count, held exactly, with no upper bound.
   */
  readonly expectedLength: Option.Option<bigint>;
  readonly kind: "text-entry";
  readonly path: string;
  /**
   * `pattern-mask`, as written: an XML Schema regular expression the response must match, which
   * the translator takes. An interaction whose pattern the translator refuses is not built; it is
   * the notice `pattern-mask`.
   */
  readonly patternMask: Option.Option<string>;
  /**
   * The author's replacement for the pattern-mask message, `data-patternmask-message`.
   */
  readonly patternMaskMessage: Option.Option<string>;
  /**
   * `placeholder-text`.
   */
  readonly placeholder: Option.Option<string>;
  /**
   * The identifier of the response it binds, `response-identifier`.
   */
  readonly response: string;
}

/**
 * A `qti-extended-text-interaction` (Q-5): a Text Entry's fields, its prompt, `expected-lines`, a
 * `format` of `plain` (the default), `preformatted` or `xhtml`, and its binding's cardinality with
 * `max-strings` and `min-strings`.
 */
export interface ExtendedTextInteraction extends Omit<TextEntryInteraction, "kind"> {
  /**
   * The bound response's cardinality: `single`, or a container, `multiple` or `ordered`, whose
   * strings each take a Control of their own.
   */
  readonly cardinality: "multiple" | "ordered" | "single";
  /**
   * `expected-lines`: a count, held exactly, with no upper bound.
   */
  readonly expectedLines: Option.Option<bigint>;
  readonly format: "plain" | "preformatted" | "xhtml";
  readonly kind: "extended-text";
  /**
   * `max-strings`: a count, held exactly, with no upper bound (reading 46 does not list it). `0`
   * restricts nothing, as `max-choices` reads it (reading 53).
   */
  readonly maxStrings: Option.Option<bigint>;
  /**
   * `min-strings`, 0 when absent: a count, held exactly, with no upper bound. One above 100 shows
   * the notice `min-strings>100` in place of the Controls (Q23).
   */
  readonly minStrings: bigint;
  readonly prompt: Option.Option<readonly BodyNode[]>;
}

/**
 * A body part phase 1 does not render, shown as a notice in its place; its subtree is dropped.
 */
export interface Unsupported {
  /**
   * The feature's key, as {@link UnsupportedFeature.feature} names it.
   */
  readonly feature: string;
  readonly kind: "unsupported";
  readonly path: string;
}

/**
 * An interaction of the item model, the three phase 1 renders.
 */
export type Interaction = ChoiceInteraction | ExtendedTextInteraction | TextEntryInteraction;

/**
 * A node of the item body.
 */
export type BodyNode =
  | BodyElement
  | BodyText
  | ChoiceInteraction
  | TextEntryInteraction
  | ExtendedTextInteraction
  | Unsupported;

/**
 * An expression of the engine subset (spec §4.12), tagged by `kind`: `qti-match`, `qti-variable`,
 * `qti-correct`, `qti-base-value`, `qti-is-null`, `qti-map-response`, `qti-map-response-point`
 * and `qti-equal`. An `equal` is a `qti-equal` in its default `exact` tolerance mode, the one mode
 * the engine runs; one in `absolute` or `relative` mode is never built.
 */
export type Expression =
  | { readonly kind: "match"; readonly operands: readonly [Expression, Expression] }
  | { readonly kind: "equal"; readonly operands: readonly [Expression, Expression] }
  | { readonly identifier: string; readonly kind: "variable" }
  | { readonly identifier: string; readonly kind: "correct" }
  | { readonly kind: "base-value"; readonly value: Value }
  | { readonly kind: "is-null"; readonly operand: Expression }
  | { readonly identifier: string; readonly kind: "map-response" }
  | { readonly identifier: string; readonly kind: "map-response-point" };

/**
 * One `qti-response-if` or `qti-response-else-if`: its condition and the rules it runs.
 */
export interface Branch {
  readonly then: readonly Rule[];
  readonly when: Expression;
}

/**
 * A response rule of phase 1's engine subset: a `qti-response-condition` with its branches in
 * order and its `qti-response-else`, or a `qti-set-outcome-value`.
 */
export type Rule =
  | {
      readonly branches: readonly Branch[];
      readonly kind: "condition";
      readonly otherwise: Option.Option<readonly Rule[]>;
    }
  | { readonly expression: Expression; readonly identifier: string; readonly kind: "set-outcome" };

/**
 * A valid `qti-assessment-item` as phase 1 models it.
 *
 * `responses` and `outcomes` hold the declarations of modelled base types and cardinalities, in
 * document order; every other declaration is a mark. `processing` is none when the item has no
 * response processing, or when phase 1 cannot run it, which `unsupported` then marks. Phase 1
 * cannot run it on an item with template processing, which phase 1 does not run and which may set a
 * value response processing reads, such as a correct response. `unsupported` lists every feature
 * not rendered, in document order, each once per feature and path.
 */
export interface Item {
  readonly body: readonly BodyNode[];
  /**
   * The document's location as the host named it.
   */
  readonly document: string;
  readonly identifier: string;
  /**
   * The root's `xml:lang`.
   */
  readonly lang: Option.Option<string>;
  readonly outcomes: ReadonlyMap<string, OutcomeDeclaration>;
  readonly processing: Option.Option<readonly Rule[]>;
  readonly responses: ReadonlyMap<string, ResponseDeclaration>;
  readonly title: string;
  readonly unsupported: readonly UnsupportedFeature[];
}

/**
 * What one build reads and collects: the document, every element's path, and the unsupported
 * features found so far, in document order.
 */
interface Build {
  /**
   * The root's response declarations, keyed by their identifier as `identifierOf` reads it; the
   * last one when two share an identifier. Built once, so binding an interaction does not rescan
   * the root.
   */
  readonly declarations: ReadonlyMap<string, SourceElement>;
  readonly document: SourceDocument;
  /**
   * Each element's path, keyed by the element itself. A reader builds a fresh object per element,
   * so no element sits at two places in one document.
   */
  readonly paths: ReadonlyMap<SourceElement, string>;
  /**
   * The paths each feature in `unsupported` was recorded at, keyed by the feature, so
   * {@link record} finds a repeat without scanning the features recorded so far.
   */
  readonly recorded: Map<string, Set<string>>;
  readonly unsupported: UnsupportedFeature[];
}

/**
 * The `qti-*` elements the model reads or renders.
 */
const readElements: ReadonlySet<string> = new Set(renders.elements);

/**
 * The response-processing elements the engine runs.
 */
const engineElements: ReadonlySet<string> = new Set(renders.engine);

/**
 * The values of a `qti-equal`'s `tolerance-mode`, whose XSD type restricts `xs:string`, so a value
 * is compared as written. The default is `exact`, the one mode the engine runs.
 */
const toleranceModes = ["absolute", "exact", "relative"] as const;

/**
 * The features marked on the verdict.
 */
const marks: readonly FeatureRule[] = renders.marks;

/**
 * The features shown as a notice in place of their interaction.
 */
const notices: readonly FeatureRule[] = renders.notices;

/**
 * The features shown as a notice in place of an interaction's Controls, the interaction still
 * built.
 */
const controlNotices: readonly FeatureRule[] = renders.controlNotices;

/**
 * The attributes a body element loses because a mark names them, such as `xml:base`.
 */
const markedAttributes: ReadonlySet<string> = new Set(
  marks.flatMap((mark) =>
    mark.on === "body" && mark.when.kind === "attribute" ? [mark.when.name] : [],
  ),
);

/**
 * Name an element as a feature or a path step does: its local name in the QTI namespace,
 * `{<namespace>}<local>` in any other.
 *
 * @param element The element to name.
 * @returns The element's name.
 */
const nameOf = (element: SourceElement): string =>
  element.namespace === qtiNamespace ? element.local : `{${element.namespace}}${element.local}`;

/**
 * Name an attribute as `renders` conditions and body elements spell it.
 *
 * @param attribute The attribute to name.
 * @returns Its local name in no namespace, `xml:<local>` in the XML namespace, and none for a
 *   namespace declaration or an attribute of any other namespace.
 */
const attributeName = (attribute: SourceAttribute): Option.Option<string> => {
  if (attribute.namespace === "") {
    return Option.some(attribute.local);
  }

  return attribute.namespace === xmlNamespace
    ? Option.some(`xml:${attribute.local}`)
    : Option.none();
};

/**
 * Find an attribute of an element by name.
 *
 * @param element The element.
 * @param name The attribute's name, `xml:` prefixed in the XML namespace.
 * @returns The attribute, or none when the element does not carry it.
 */
const attributeOf = (element: SourceElement, name: string): Option.Option<SourceAttribute> =>
  Arr.findFirst(element.attributes, (attribute) =>
    Option.exists(attributeName(attribute), (candidate) => candidate === name),
  );

/**
 * Read an attribute's value as written.
 *
 * @param element The element.
 * @param name The attribute's name.
 * @returns The value, or none when the element does not carry the attribute.
 */
const valueOf = (element: SourceElement, name: string): Option.Option<string> =>
  Option.map(attributeOf(element, name), (attribute) => attribute.value);

/**
 * Report whether an element is in the QTI namespace, optionally with one local name.
 *
 * @param element The element.
 * @param local The local name it must have, any when absent.
 * @returns Whether `element` is that element.
 */
const isQti = (element: SourceElement, local?: string): boolean =>
  element.namespace === qtiNamespace && (local === undefined || element.local === local);

/**
 * Keep an element's element children.
 *
 * @param element The element.
 * @returns Its element children, in document order.
 */
const elementsOf = (element: SourceElement): readonly SourceElement[] =>
  element.children.filter((child): child is SourceElement => child.kind === "element");

/**
 * Keep an element's QTI children of one name.
 *
 * @param element The element.
 * @param local The children's local name.
 * @returns Those children, in document order.
 */
const childrenNamed = (element: SourceElement, local: string): readonly SourceElement[] =>
  elementsOf(element).filter((child) => isQti(child, local));

/**
 * Join an element's text children, the content of a `qti-value` or a `qti-base-value`.
 *
 * @param element The element.
 * @returns Its text, as written.
 */
const textOf = (element: SourceElement): string =>
  element.children.flatMap((child) => (child.kind === "text" ? [child.text] : [])).join("");

/**
 * A broken invariant of {@link buildItem}'s own walk or parse, a defect of this module that no input
 * can cause.
 *
 * It cannot occur: every element the build reads is in its walk, and a value {@link parseLexical}
 * gave for `float` or `integer` holds that base type. It is thrown, never returned, so
 * {@link buildItem}'s error channel holds only content refusals.
 */
export class BuildDefect extends Data.TaggedError("BuildDefect")<{
  readonly detail: string;
}> {
  /**
   * The broken invariant, and what to do with it.
   */
  override get message(): string {
    return `${this.detail} This is a defect in buildItem; report it with the item that caused it.`;
  }
}

/**
 * Give an element's path from the build's walk.
 *
 * @param build The build.
 * @param element An element of the build's document.
 * @returns The element's path.
 */
const pathOf = (build: Build, element: SourceElement): string => {
  const path = build.paths.get(element);
  if (path === undefined) {
    throw new BuildDefect({
      detail: `The element ${nameOf(element)} is not part of the document being built.`,
    });
  }

  return path;
};

/**
 * Record an unsupported feature, once per feature and path, in constant time.
 *
 * @param build The build that collects it.
 * @param entry The feature, its path and how it is shown.
 */
const record = (build: Build, entry: UnsupportedFeature): void => {
  const paths = build.recorded.get(entry.feature) ?? new Set<string>();
  if (!paths.has(entry.path)) {
    paths.add(entry.path);
    build.recorded.set(entry.feature, paths);
    build.unsupported.push(entry);
  }
};

/**
 * Construct a content refusal at an element or attribute path.
 *
 * @param build The build of the refused document.
 * @param rule The rule broken.
 * @param path Where.
 * @param detail The facts the verdict's wording names.
 * @returns The refusal.
 */
const refusal = (
  build: Build,
  rule: RefusalRule,
  path: string,
  detail: Readonly<Record<string, string>>,
): Refusal =>
  new Refusal({
    detail,
    document: build.document.location,
    location: { kind: "path", path },
    readerRule: Option.none(),
    rule,
    suggestion: Option.none(),
  });

/**
 * Turn a failed value parse into the refusal `value-type` at a path.
 *
 * @param build The build.
 * @param path The path of the element or attribute that holds the value.
 * @param parsed The parse.
 * @returns The parse, failing with the refusal.
 */
const typed = <A>(
  build: Build,
  path: string,
  parsed: Result.Result<A, InvalidValue>,
): Effect.Effect<A, Refusal> =>
  Effect.mapError(Effect.fromResult(parsed), (invalid) =>
    refusal(build, "value-type", path, { baseType: invalid.baseType, lexical: invalid.lexical }),
  );

/**
 * Read the number a float value holds.
 *
 * @param single A value that {@link parseLexical} gave for `float`.
 * @returns Its number.
 */
const floatOf = (single: Single): number => {
  if (single.baseType === "float") {
    return single.value;
  }

  throw new BuildDefect({ detail: `A ${single.baseType} value holds no float.` });
};

/**
 * Read the exact integer an integer value holds.
 *
 * @param single A value that {@link parseLexical} gave for `integer`.
 * @returns Its integer.
 */
const integerOf = (single: Single): bigint => {
  if (single.baseType === "integer") {
    return single.value;
  }

  throw new BuildDefect({ detail: `A ${single.baseType} value holds no integer.` });
};

/**
 * Read an attribute the element must carry.
 *
 * @param build The build.
 * @param element The element.
 * @param name The attribute's name.
 * @returns The attribute, or the refusal `missing-attribute` at the element.
 */
const requiredAttribute = (
  build: Build,
  element: SourceElement,
  name: string,
): Effect.Effect<SourceAttribute, Refusal> =>
  Option.match(attributeOf(element, name), {
    onNone: () =>
      Effect.fail(
        refusal(build, "missing-attribute", pathOf(build, element), {
          attribute: name,
          element: nameOf(element),
        }),
      ),
    onSome: (attribute) => Effect.succeed(attribute),
  });

/**
 * Read the value of an attribute the element must carry.
 *
 * @param build The build.
 * @param element The element.
 * @param name The attribute's name.
 * @returns The value as written, or the refusal `missing-attribute`.
 */
const required = (
  build: Build,
  element: SourceElement,
  name: string,
): Effect.Effect<string, Refusal> =>
  Effect.map(requiredAttribute(build, element, name), (attribute) => attribute.value);

/**
 * Read an identifier as its XSD type reads it.
 *
 * Every identifier the item reads is an `xs:NCName`, or an `xs:ID` or `xs:IDREF` derived from it:
 * the root's, a declaration's and a choice's `identifier`, an interaction's `response-identifier`,
 * and the `identifier` of `qti-variable`, `qti-correct`, `qti-map-response` and
 * `qti-set-outcome-value`. Their whitespace facet is `collapse`, and an NCName holds no inner
 * whitespace, so collapsing is removing the outer XML whitespace. Reading 7 keeps an attribute's
 * outer whitespace only for the base-typed attributes the XSD types as strings, which no
 * identifier is, so `" RESPONSE "` names `RESPONSE`, and refusing it would refuse valid content
 * (reading 1). The validators read these attributes the same way (`identifierOf` in
 * `src/validate/rules.ts`).
 *
 * @param written The attribute's value as written.
 * @returns The identifier it names.
 */
const identifierOf = (written: string): string => trimXmlSpace(written);

/**
 * Read an identifier attribute the element must carry, as `identifierOf` reads it.
 *
 * @param build The build.
 * @param element The element.
 * @param name The attribute's name.
 * @returns The identifier, or the refusal `missing-attribute`.
 */
const identifierAttribute = (
  build: Build,
  element: SourceElement,
  name: string,
): Effect.Effect<string, Refusal> =>
  Effect.map(requiredAttribute(build, element, name), (attribute) => identifierOf(attribute.value));

/**
 * Read an attribute the element carries whose value is one of a closed list.
 *
 * @param build The build.
 * @param element The element.
 * @param name The attribute's name.
 * @param attribute The attribute.
 * @param allowed The values it may take.
 * @returns The value, or the refusal `attribute-type` when it is outside `allowed`.
 */
const listed = <const T extends string>(
  build: Build,
  element: SourceElement,
  name: string,
  attribute: SourceAttribute,
  allowed: readonly T[],
): Effect.Effect<T, Refusal> =>
  Option.match(
    Arr.findFirst(allowed, (value) => value === attribute.value),
    {
      onNone: () =>
        Effect.fail(
          refusal(build, "attribute-type", attributePath(pathOf(build, element), attribute), {
            attribute: name,
            value: attribute.value,
          }),
        ),
      onSome: (value) => Effect.succeed(value),
    },
  );

/**
 * Read an attribute whose value is one of a closed list, such as `cardinality`.
 *
 * @param build The build.
 * @param element The element.
 * @param name The attribute's name.
 * @param allowed The values it may take.
 * @returns The value, none when absent, or the refusal `attribute-type` when it is outside
 *   `allowed`.
 */
const enumerated = <const T extends string>(
  build: Build,
  element: SourceElement,
  name: string,
  allowed: readonly T[],
): Effect.Effect<Option.Option<T>, Refusal> =>
  Effect.transposeOption(
    Option.map(attributeOf(element, name), (attribute) =>
      listed(build, element, name, attribute, allowed),
    ),
  );

/**
 * The check an integer attribute's type makes of a value: none when the type accepts it, or the
 * rule and the detail of the refusal.
 *
 * @param value The integer, exact.
 * @param lexical The attribute's value with its outer whitespace gone, as the refusal names it.
 * @returns None when the type accepts `value`, or the refusal's rule and detail.
 */
type IntegerCheck = (
  value: bigint,
  lexical: string,
) => Option.Option<readonly [RefusalRule, Readonly<Record<string, string>>]>;

/**
 * Read an attribute of an XSD integer type exactly: its outer whitespace goes, then it reads as a
 * QTI integer, which `refuse` checks against the type.
 *
 * @param build The build.
 * @param element The element.
 * @param name The attribute's name.
 * @param refuse The type's check of the integer.
 * @returns The integer, none when absent, the refusal `value-type` at the attribute when the value
 *   is not an integer, or the refusal `refuse` names, at the attribute.
 */
const xsIntegerOf = (
  build: Build,
  element: SourceElement,
  name: string,
  refuse: IntegerCheck,
): Effect.Effect<Option.Option<bigint>, Refusal> =>
  Effect.transposeOption(
    Option.map(attributeOf(element, name), (attribute) => {
      const path = attributePath(pathOf(build, element), attribute);
      const lexical = trimXmlSpace(attribute.value);

      return typed(build, path, parseLexical("integer", lexical)).pipe(
        Effect.map(integerOf),
        Effect.flatMap((value) =>
          Option.match(refuse(value, lexical), {
            onNone: () => Effect.succeed(value),
            onSome: ([rule, detail]) => Effect.fail(refusal(build, rule, path, detail)),
          }),
        ),
      );
    }),
  );

/**
 * The least `xs:int`, -2^31.
 */
const leastInt = -2_147_483_648n;

/**
 * The greatest `xs:int`, 2^31-1.
 */
const greatestInt = 2_147_483_647n;

/**
 * The count attributes plate reads that reading 46 holds to the signed 64-bit range.
 * `expected-length` and `expected-lines` are counts it does not name, so they have no upper bound.
 */
const rangedCounts: ReadonlySet<string> = new Set(["max-choices", "min-choices"]);

/**
 * Read an `xs:int` attribute, such as `base`, through {@link xsIntegerOf}.
 *
 * @param build The build.
 * @param element The element.
 * @param name The attribute's name.
 * @returns The number, none when absent, or the refusal `value-type` when the value is outside
 *   -2^31 to 2^31-1.
 */
const xsInt = (
  build: Build,
  element: SourceElement,
  name: string,
): Effect.Effect<Option.Option<number>, Refusal> =>
  Effect.map(
    xsIntegerOf(build, element, name, (value, lexical) =>
      value >= leastInt && value <= greatestInt
        ? Option.none()
        : Option.some(["value-type", { baseType: "xs:int", lexical }]),
    ),
    Option.map(Number),
  );

/**
 * Read a count attribute, an `xs:nonNegativeInteger` such as `max-choices`, exactly through
 * {@link xsIntegerOf}. `max-choices` and `min-choices` are reading 46's counts, which hold a signed
 * 64-bit value, so one above 2^63-1 is refused (operator ruling D, 2026-11-04). `expected-length`
 * and `expected-lines` are held at any size.
 *
 * @param build The build.
 * @param element The element.
 * @param name The attribute's name.
 * @returns The count, none when absent, the refusal `value-type` when the value is below 0, or the
 *   refusal `count-range` when a reading-46 count is above 2^63-1.
 */
const countAttribute = (
  build: Build,
  element: SourceElement,
  name: string,
): Effect.Effect<Option.Option<bigint>, Refusal> =>
  xsIntegerOf(build, element, name, (value, lexical) => {
    if (value < 0n) {
      return Option.some(["value-type", { baseType: "xs:nonNegativeInteger", lexical }]);
    }

    if (rangedCounts.has(name) && value > greatestCount) {
      return Option.some([
        "count-range",
        {
          attribute: name,
          greatest: String(greatestCount),
          least: String(leastCount),
          lexical,
          reading: "46",
        },
      ]);
    }

    return Option.none();
  });

/**
 * Read an `xs:boolean` attribute value as XSD does (reading Q8): its outer whitespace goes, then
 * `true` or `1` is true and `false` or `0` is false.
 *
 * @param written The value as written.
 * @returns The boolean, or none when the value is outside `xs:boolean`'s lexical space.
 */
const xsBooleanOf = (written: string): Option.Option<boolean> => {
  const lexical = trimXmlSpace(written);
  if (lexical === "true" || lexical === "1") {
    return Option.some(true);
  }

  return lexical === "false" || lexical === "0" ? Option.some(false) : Option.none();
};

/**
 * Read an `xs:boolean` attribute, such as `shuffle`, through {@link xsBooleanOf}.
 *
 * @param build The build.
 * @param element The element.
 * @param name The attribute's name.
 * @param absent The value when the element does not carry it, the XSD's default.
 * @returns The boolean, or the refusal `value-type`.
 */
const xsBoolean = (
  build: Build,
  element: SourceElement,
  name: string,
  absent: boolean,
): Effect.Effect<boolean, Refusal> =>
  Option.match(attributeOf(element, name), {
    onNone: () => Effect.succeed(absent),
    onSome: (attribute) =>
      Option.match(xsBooleanOf(attribute.value), {
        onNone: () =>
          Effect.fail(
            refusal(build, "value-type", attributePath(pathOf(build, element), attribute), {
              baseType: "boolean",
              lexical: attribute.value,
            }),
          ),
        onSome: (value) => Effect.succeed(value),
      }),
  });

/**
 * Read a float attribute exactly as written, as reading 7 reads `mapped-value` and the mapping's
 * bounds.
 *
 * @param build The build.
 * @param element The element.
 * @param name The attribute's name.
 * @returns The number, none when absent, or the refusal `value-type`.
 */
const floatAttribute = (
  build: Build,
  element: SourceElement,
  name: string,
): Effect.Effect<Option.Option<number>, Refusal> =>
  Effect.transposeOption(
    Option.map(attributeOf(element, name), (attribute) =>
      typed(
        build,
        attributePath(pathOf(build, element), attribute),
        parseLexical("float", attribute.value),
      ).pipe(Effect.map(floatOf)),
    ),
  );

/**
 * Find the response declaration an element binds through `response-identifier`; the last one when
 * two share the identifier. Both sides are compared as `identifierOf` reads them.
 *
 * @param build The build.
 * @param element An interaction.
 * @returns The declaration, or none when the element binds none or no declaration has its
 *   identifier.
 */
const boundDeclaration = (build: Build, element: SourceElement): Option.Option<SourceElement> =>
  Option.flatMap(Option.map(valueOf(element, "response-identifier"), identifierOf), (response) =>
    Option.fromUndefinedOr(build.declarations.get(response)),
  );

/**
 * Report whether a `renders` condition holds on an element.
 *
 * @param build The build.
 * @param condition The condition.
 * @param element The element.
 * @returns Whether the element carries the feature.
 */
const holds = (build: Build, condition: Condition, element: SourceElement): boolean => {
  if (condition.kind === "element") {
    return true;
  }

  if (condition.kind === "attribute") {
    return Option.isSome(attributeOf(element, condition.name));
  }

  if (condition.kind === "attribute-value") {
    return Option.getOrUndefined(valueOf(element, condition.name)) === condition.value;
  }

  if (condition.kind === "attribute-true") {
    return Option.getOrElse(
      Option.flatMap(valueOf(element, condition.name), xsBooleanOf),
      () => false,
    );
  }

  if (condition.kind === "untyped") {
    return (
      Option.isNone(attributeOf(element, "base-type")) &&
      Option.getOrUndefined(valueOf(element, "cardinality")) !== "record"
    );
  }

  if (condition.kind === "refused-pattern") {
    return Option.exists(valueOf(element, condition.name), (pattern) =>
      Result.isFailure(translate(pattern)),
    );
  }

  if (condition.kind === "integer-above") {
    return Option.exists(valueOf(element, condition.name), (written) =>
      Option.exists(
        Result.getSuccess(parseLexical("integer", trimXmlSpace(written))),
        (single) => integerOf(single) > condition.limit,
      ),
    );
  }

  if (condition.kind === "cardinality") {
    return (
      Option.getOrUndefined(
        Option.flatMap(boundDeclaration(build, element), (declaration) =>
          valueOf(declaration, "cardinality"),
        ),
      ) === condition.cardinality
    );
  }

  return (
    Option.getOrUndefined(Option.flatMap(valueOf(element, "template"), templateName)) ===
    condition.name
  );
};

/**
 * Report whether a feature can sit on an element.
 *
 * @param feature The feature.
 * @param element A QTI-namespace element.
 * @param inBody Whether the element is rendered in the item body.
 * @returns Whether the feature's `on` names the element.
 */
const sitsOn = (feature: FeatureRule, element: SourceElement, inBody: boolean): boolean =>
  feature.on === "body" ? inBody : feature.on.includes(element.local);

/**
 * Record the marks an element carries.
 *
 * @param build The build.
 * @param element A QTI-namespace element the model reads.
 * @param inBody Whether the element is rendered in the item body.
 */
const markElement = (build: Build, element: SourceElement, inBody: boolean): void => {
  for (const mark of marks) {
    if (sitsOn(mark, element, inBody) && holds(build, mark.when, element)) {
      record(build, { feature: mark.feature, path: pathOf(build, element), shown: "mark" });
    }
  }
};

/**
 * Record each `qti-*` element below an element that the model does not read, as a mark keyed by
 * its name. A marked element's own subtree is not searched.
 *
 * @param build The build.
 * @param element An element outside the body that the model reads, such as a declaration.
 */
const markUnreadWithin = (build: Build, element: SourceElement): void => {
  for (const child of elementsOf(element)) {
    if (isQti(child) && child.local.startsWith("qti-") && !readElements.has(child.local)) {
      record(build, { feature: child.local, path: pathOf(build, child), shown: "mark" });
    } else {
      markUnreadWithin(build, child);
    }
  }
};

/**
 * Read a container of `qti-value` children, such as `qti-correct-response`, as one value.
 *
 * @param build The build.
 * @param container The container.
 * @param baseType The declaration's base type.
 * @param cardinality The declaration's cardinality.
 * @returns The value, an empty string being NULL, or the refusal `value-type` at the first
 *   `qti-value` outside the base type's lexical space.
 */
const valueIn = (
  build: Build,
  container: SourceElement,
  baseType: ModelledBaseType,
  cardinality: Value["cardinality"],
): Effect.Effect<Value, Refusal> =>
  Effect.forEach(childrenNamed(container, "qti-value"), (value) =>
    typed(build, pathOf(build, value), parseElementText(baseType, textOf(value))),
  ).pipe(
    Effect.map((parsed) => ({ baseType, cardinality, values: parsed.flatMap(Option.toArray) })),
  );

/**
 * Read a declaration's optional value container.
 *
 * @param build The build.
 * @param declaration The declaration.
 * @param local The container's name, `qti-correct-response` or `qti-default-value`.
 * @param declared The declaration's base type and cardinality.
 * @returns The value, none when the declaration has no such container, or the refusal
 * `value-type`.
 */
const optionalValue = (
  build: Build,
  declaration: SourceElement,
  local: string,
  declared: Declared,
): Effect.Effect<Option.Option<Value>, Refusal> =>
  Effect.transposeOption(
    Option.map(Arr.head(childrenNamed(declaration, local)), (container) =>
      valueIn(build, container, declared.baseType, declared.cardinality),
    ),
  );

/**
 * The identifier, base type and cardinality of a declaration the model holds.
 */
interface Declared {
  readonly baseType: ModelledBaseType;
  readonly cardinality: Value["cardinality"];
  readonly identifier: string;
}

/**
 * Read a declaration's identifier, base type and cardinality.
 *
 * @param build The build.
 * @param declaration A response or outcome declaration.
 * @returns Them, none when the base type is absent or not modelled or the cardinality is
 *   `record`, or a refusal when `identifier` or `cardinality` is missing or a value is outside its
 *   list.
 */
const declared = (
  build: Build,
  declaration: SourceElement,
): Effect.Effect<Option.Option<Declared>, Refusal> =>
  Effect.gen(function* readDeclared() {
    const identifier = yield* identifierAttribute(build, declaration, "identifier");
    yield* requiredAttribute(build, declaration, "cardinality");

    const cardinality = yield* enumerated(build, declaration, "cardinality", cardinalities);
    const baseType = yield* enumerated(build, declaration, "base-type", baseTypes);

    return Option.flatMap(Option.all({ baseType, cardinality }), (read) =>
      read.cardinality !== "record" && isModelled(read.baseType)
        ? Option.some({ baseType: read.baseType, cardinality: read.cardinality, identifier })
        : Option.none(),
    );
  });

/**
 * Read a `qti-mapping` under its response's base type.
 *
 * @param build The build.
 * @param mapping The mapping element.
 * @param baseType The response's base type, which each `map-key` is read in, exactly as written.
 * @returns The mapping, or the refusal `value-type` at the first value outside its lexical space.
 */
const mappingOf = (
  build: Build,
  mapping: SourceElement,
  baseType: ModelledBaseType,
): Effect.Effect<Mapping, Refusal> =>
  Effect.gen(function* readMapping() {
    const defaultValue = yield* floatAttribute(build, mapping, "default-value");
    const lowerBound = yield* floatAttribute(build, mapping, "lower-bound");
    const upperBound = yield* floatAttribute(build, mapping, "upper-bound");
    const entries = yield* Effect.forEach(childrenNamed(mapping, "qti-map-entry"), (entry) =>
      Effect.gen(function* mapEntry() {
        const key = yield* requiredAttribute(build, entry, "map-key");
        const value = yield* requiredAttribute(build, entry, "mapped-value");
        const path = pathOf(build, entry);

        return {
          caseSensitive: yield* xsBoolean(build, entry, "case-sensitive", false),
          key: yield* typed(build, attributePath(path, key), parseLexical(baseType, key.value)),
          value: floatOf(
            yield* typed(build, attributePath(path, value), parseLexical("float", value.value)),
          ),
        };
      }),
    );

    return {
      defaultValue: Option.getOrElse(defaultValue, () => 0),
      entries,
      lowerBound,
      upperBound,
    };
  });

/**
 * One coordinate as `CoordsDType` writes it: decimal digits, then `%` or nothing.
 */
const coordinate = /^(?<digits>[0-9]+)%?$/u;

/**
 * Read a `qti-area-map-entry`'s `coords`, each coordinate's digits as `xs:double` reads them. How
 * many coordinates a value holds is the structure check's, which admits only `CoordsDType`.
 *
 * @param build The build.
 * @param entry The entry.
 * @returns Each coordinate's number and whether it is written with `%`, in written order, or the
 *   refusal `attribute-type` when a coordinate is outside `CoordsDType`.
 */
const coordsOf = (
  build: Build,
  entry: SourceElement,
): Effect.Effect<readonly (readonly [number, boolean])[], Refusal> =>
  Effect.flatMap(requiredAttribute(build, entry, "coords"), (attribute) => {
    const path = attributePath(pathOf(build, entry), attribute);

    return Effect.forEach(attribute.value.split(","), (written) => {
      const digits = coordinate.exec(written)?.groups?.["digits"];

      return digits === undefined
        ? Effect.fail(
            refusal(build, "attribute-type", path, { attribute: "coords", value: attribute.value }),
          )
        : Effect.map(
            typed(build, path, parseLexical("float", digits)),
            (single) => [floatOf(single), written.endsWith("%")] as const,
          );
    });
  });

/* oxlint-disable anti-slop/no-shape-in-symbol-names -- `shape` is the QTI attribute of `qti-area-map-entry` and names an area's geometry, not a structure. */
/**
 * Read a `qti-area-map-entry`.
 *
 * @param build The build.
 * @param entry The entry.
 * @returns The entry and whether a coordinate of it is written with `%`, or the refusal at its
 *   first attribute outside its type.
 */
const areaEntryOf = (
  build: Build,
  entry: SourceElement,
): Effect.Effect<{ readonly entry: AreaMapEntry; readonly percent: boolean }, Refusal> =>
  Effect.gen(function* readAreaEntry() {
    const shape = yield* Effect.flatMap(requiredAttribute(build, entry, "shape"), (attribute) =>
      listed(build, entry, "shape", attribute, areaShapes),
    );
    const coords = yield* coordsOf(build, entry);
    const value = yield* requiredAttribute(build, entry, "mapped-value");
    const path = attributePath(pathOf(build, entry), value);

    return {
      entry: {
        coords: coords.map(([number]) => number),
        mappedValue: floatOf(yield* typed(build, path, parseLexical("float", value.value))),
        shape,
      },
      percent: coords.some(([, percent]) => percent),
    };
  });
/* oxlint-enable anti-slop/no-shape-in-symbol-names */

/**
 * Read a point response's `qti-area-mapping`.
 *
 * @param build The build.
 * @param mapping The mapping element.
 * @returns The mapping, or the refusal at the first attribute outside its type.
 */
const areaMappingOf = (build: Build, mapping: SourceElement): Effect.Effect<AreaMapping, Refusal> =>
  Effect.gen(function* readAreaMapping() {
    const defaultValue = yield* floatAttribute(build, mapping, "default-value");
    const lowerBound = yield* floatAttribute(build, mapping, "lower-bound");
    const upperBound = yield* floatAttribute(build, mapping, "upper-bound");
    const read = yield* Effect.forEach(childrenNamed(mapping, "qti-area-map-entry"), (entry) =>
      areaEntryOf(build, entry),
    );

    return {
      defaultValue: Option.getOrElse(defaultValue, () => 0),
      entries: read.map(({ entry }) => entry),
      lowerBound,
      percent: read.some(({ percent }) => percent),
      upperBound,
    };
  });

/**
 * Read a `qti-response-declaration`.
 *
 * @param build The build.
 * @param declaration The declaration.
 * @returns The model, none when its base type or cardinality is not modelled, or a refusal.
 */
const responseDeclaration = (
  build: Build,
  declaration: SourceElement,
): Effect.Effect<Option.Option<ResponseDeclaration>, Refusal> =>
  Effect.gen(function* readResponseDeclaration() {
    const read = yield* declared(build, declaration);
    if (Option.isNone(read)) {
      return Option.none();
    }

    const correct = yield* optionalValue(build, declaration, "qti-correct-response", read.value);
    const defaultValue = yield* optionalValue(build, declaration, "qti-default-value", read.value);
    const mapping = yield* Effect.transposeOption(
      Option.map(Arr.head(childrenNamed(declaration, "qti-mapping")), (element) =>
        mappingOf(build, element, read.value.baseType),
      ),
    );
    const areaMapping = yield* Effect.transposeOption(
      pipe(
        Arr.head(childrenNamed(declaration, "qti-area-mapping")),
        Option.filter(() => read.value.baseType === "point"),
        Option.map((element) => areaMappingOf(build, element)),
      ),
    );

    return Option.some({ ...read.value, areaMapping, correct, defaultValue, mapping });
  });

/**
 * A run of XML whitespace, which an XSD list or a collapsed value reads as one space.
 */
const xmlWhitespaceRun = /[\t\n\r ]+/gu;

/**
 * Read an `xs:double` attribute as the XSD reads it (readings 7 and 56): outer whitespace goes,
 * then the literal reads in the double's lexical space, one beyond the largest finite double naming
 * that double.
 *
 * @param element The element.
 * @param name The attribute's name.
 * @param refuse The reader's refusal of an attribute.
 * @returns The number, none when absent, or the refusal `value-type` at the attribute.
 */
const doubleAttribute = (
  element: SourceElement,
  name: string,
  refuse: AttributeRefusal,
): Effect.Effect<Option.Option<number>, Refusal> =>
  Effect.transposeOption(
    Option.map(attributeOf(element, name), (attribute) => {
      const lexical = trimXmlSpace(attribute.value);

      return Effect.fromResult(parseLexical("float", lexical)).pipe(
        Effect.mapError(() => refuse(attribute, "value-type", { baseType: "xs:double", lexical })),
        Effect.map(floatOf),
      );
    }),
  );

/**
 * Read an outcome declaration's `view`, an XSD list of {@link views}: its tokens are the runs
 * between XML whitespace.
 *
 * @param declaration The declaration.
 * @param refuse The reader's refusal of an attribute.
 * @returns The views in the order written, none when absent, or the refusal `attribute-type` at
 *   the attribute when a token is not a view.
 */
const viewAttribute = (
  declaration: SourceElement,
  refuse: AttributeRefusal,
): Effect.Effect<Option.Option<readonly View[]>, Refusal> =>
  Effect.transposeOption(
    Option.map(attributeOf(declaration, "view"), (attribute) =>
      Effect.forEach(
        attribute.value.split(xmlWhitespaceRun).filter((token) => token !== ""),
        (token) =>
          Option.match(
            Arr.findFirst(views, (view) => view === token),
            {
              onNone: () =>
                Effect.fail(
                  refuse(attribute, "attribute-type", {
                    attribute: "view",
                    value: attribute.value,
                  }),
                ),
              onSome: (view) => Effect.succeed(view),
            },
          ),
      ),
    ),
  );

/**
 * Read the six attributes of a `qti-outcome-declaration` that Results Reporting mirrors on an
 * `outcomeVariable`, each as the XSD types it. The item and the test model both read a
 * declaration's through this, so the two read them alike.
 *
 * @param declaration The declaration.
 * @param refuse The reader's refusal of an attribute, at that attribute's path in its document.
 * @returns The six, each none when absent, or the refusal `value-type` at a double outside
 *   `xs:double`'s lexical space or `attribute-type` at a `view` naming something other than a view.
 */
export const outcomeReporting = (
  declaration: SourceElement,
  refuse: AttributeRefusal,
): Effect.Effect<OutcomeReporting, Refusal> =>
  Effect.gen(function* readOutcomeReporting() {
    const view = yield* viewAttribute(declaration, refuse);
    const normalMaximum = yield* doubleAttribute(declaration, "normal-maximum", refuse);
    const normalMinimum = yield* doubleAttribute(declaration, "normal-minimum", refuse);
    const masteryValue = yield* doubleAttribute(declaration, "mastery-value", refuse);

    return {
      interpretation: valueOf(declaration, "interpretation"),
      longInterpretation: Option.map(valueOf(declaration, "long-interpretation"), (written) =>
        trimXmlSpace(written).replaceAll(xmlWhitespaceRun, " "),
      ),
      masteryValue,
      normalMaximum,
      normalMinimum,
      view,
    };
  });

/**
 * Read a `qti-outcome-declaration`.
 *
 * @param build The build.
 * @param declaration The declaration.
 * @returns The model, none when its base type or cardinality is not modelled, or a refusal.
 */
const outcomeDeclaration = (
  build: Build,
  declaration: SourceElement,
): Effect.Effect<Option.Option<OutcomeDeclaration>, Refusal> =>
  Effect.gen(function* readOutcomeDeclaration() {
    const read = yield* declared(build, declaration);
    if (Option.isNone(read)) {
      return Option.none();
    }

    const reporting = yield* outcomeReporting(declaration, (attribute, rule, detail) =>
      refusal(build, rule, attributePath(pathOf(build, declaration), attribute), detail),
    );
    const defaultValue = yield* optionalValue(build, declaration, "qti-default-value", read.value);

    return Option.some({ ...read.value, ...reporting, defaultValue });
  });

/**
 * Replace a body part with its notice, and record the notice.
 *
 * @param build The build.
 * @param feature The feature's key.
 * @param path The part's path.
 * @returns The unsupported node.
 */
const notice = (build: Build, feature: string, path: string): Effect.Effect<Unsupported> =>
  Effect.sync(() => {
    record(build, { feature, path, shown: "notice" });

    return { feature, kind: "unsupported", path };
  });

/**
 * Read a body element's attributes as written, without namespace declarations, attributes of
 * other namespaces, or the attributes a mark names.
 *
 * @param element The element.
 * @returns Its attributes, `xml:lang` named `xml:lang`.
 */
const bodyAttributes = (element: SourceElement): readonly BodyAttribute[] =>
  element.attributes.flatMap((attribute) =>
    Option.match(attributeName(attribute), {
      onNone: () => [],
      onSome: (name) => (markedAttributes.has(name) ? [] : [{ name, value: attribute.value }]),
    }),
  );

/**
 * Read the children of a body element, the item body included.
 *
 * @param build The build.
 * @param parent The element.
 * @returns Its children's body nodes, in document order, or a refusal.
 */
const bodyNodes = (
  build: Build,
  parent: SourceElement,
): Effect.Effect<readonly BodyNode[], Refusal> =>
  pipe(
    parent.children,
    // oxlint-disable-next-line eslint/no-use-before-define -- `bodyNodes` and `bodyNode` are mutually recursive, as body elements nest; the call runs only after both are defined.
    Effect.forEach((child) => bodyNode(build, parent, child)),
  );

/**
 * Read the first `qti-prompt` of an interaction.
 *
 * @param build The build.
 * @param interaction The interaction.
 * @returns The prompt's content, none when it has no prompt, or a refusal.
 */
const promptOf = (
  build: Build,
  interaction: SourceElement,
): Effect.Effect<Option.Option<readonly BodyNode[]>, Refusal> =>
  Effect.transposeOption(
    Option.map(Arr.head(childrenNamed(interaction, "qti-prompt")), (prompt) => {
      markElement(build, prompt, true);

      return bodyNodes(build, prompt);
    }),
  );

/**
 * Bind an interaction to its response's base type and cardinality.
 *
 * @param binding The base types and cardinalities the interaction renders with.
 * @param declaration The declaration it names.
 * @returns The bound base type and cardinality, or the feature key of the first one outside the
 *   binding: `cardinality="…"`, then `base-type="…"`.
 */
const bind = <const B extends string, const C extends string>(
  binding: { readonly baseTypes: readonly B[]; readonly cardinalities: readonly C[] },
  declaration: SourceElement,
): Result.Result<{ readonly baseType: B; readonly cardinality: C }, string> => {
  const written = {
    baseType: Option.getOrElse(valueOf(declaration, "base-type"), () => ""),
    cardinality: Option.getOrElse(valueOf(declaration, "cardinality"), () => ""),
  };
  const cardinality = binding.cardinalities.find((value) => value === written.cardinality);
  if (cardinality === undefined) {
    return Result.fail(`cardinality="${written.cardinality}"`);
  }

  const baseType = binding.baseTypes.find((value) => value === written.baseType);

  return baseType === undefined
    ? Result.fail(`base-type="${written.baseType}"`)
    : Result.succeed({ baseType, cardinality });
};

/**
 * Read the fields Text Entry and Extended Text share.
 *
 * @param build The build.
 * @param interaction The interaction.
 * @param baseType The bound base type.
 * @returns The fields, or a refusal.
 */
const textFields = (
  build: Build,
  interaction: SourceElement,
  baseType: TextEntryInteraction["baseType"],
): Effect.Effect<Omit<TextEntryInteraction, "kind">, Refusal> =>
  Effect.gen(function* readTextFields() {
    const base = yield* xsInt(build, interaction, "base");

    return {
      ariaLabel: valueOf(interaction, "aria-label"),
      ariaLabelledby: valueOf(interaction, "aria-labelledby"),
      base: Option.getOrElse(base, () => 10),
      baseType,
      class: Option.getOrElse(valueOf(interaction, "class"), () => ""),
      expectedLength: yield* countAttribute(build, interaction, "expected-length"),
      path: pathOf(build, interaction),
      patternMask: valueOf(interaction, "pattern-mask"),
      patternMaskMessage: valueOf(interaction, "data-patternmask-message"),
      placeholder: valueOf(interaction, "placeholder-text"),
      response: yield* identifierAttribute(build, interaction, "response-identifier"),
    };
  });

/**
 * Read a `qti-choice-interaction` bound as Choice renders it.
 *
 * @param build The build.
 * @param interaction The interaction.
 * @param cardinality The bound cardinality.
 * @returns The Choice model, or a refusal.
 */
const choiceInteraction = (
  build: Build,
  interaction: SourceElement,
  cardinality: ChoiceInteraction["cardinality"],
): Effect.Effect<ChoiceInteraction, Refusal> =>
  Effect.gen(function* readChoice() {
    const maxChoices = yield* countAttribute(build, interaction, "max-choices");
    const minChoices = yield* countAttribute(build, interaction, "min-choices");
    const shuffle = yield* xsBoolean(build, interaction, "shuffle", false);
    const prompt = yield* promptOf(build, interaction);
    const choices = yield* Effect.forEach(
      childrenNamed(interaction, "qti-simple-choice"),
      (choice) =>
        Effect.gen(function* simpleChoice() {
          markElement(build, choice, true);

          const identifier = yield* identifierAttribute(build, choice, "identifier");
          const fixed = yield* xsBoolean(build, choice, "fixed", false);

          return { content: yield* bodyNodes(build, choice), fixed, identifier };
        }),
    );

    return {
      ariaLabel: valueOf(interaction, "aria-label"),
      ariaLabelledby: valueOf(interaction, "aria-labelledby"),
      cardinality,
      choices,
      class: Option.getOrElse(valueOf(interaction, "class"), () => ""),
      kind: "choice",
      maxChoices: Option.getOrElse(maxChoices, () => 1n),
      messages: {
        max: valueOf(interaction, "data-max-selections-message"),
        min: valueOf(interaction, "data-min-selections-message"),
      },
      minChoices: Option.getOrElse(minChoices, () => 0n),
      orientation: valueOf(interaction, "orientation"),
      path: pathOf(build, interaction),
      prompt,
      response: yield* identifierAttribute(build, interaction, "response-identifier"),
      shuffle,
    };
  });

/**
 * Read one of the three interactions phase 1 renders: its model when its binding is in `renders`
 * and it carries no notice feature, otherwise its notice. An Extended Text that carries a feature
 * of `renders.controlNotices`, such as `min-strings>100`, is still built, and the feature is
 * recorded as a notice that stands in place of its Controls.
 *
 * @param build The build.
 * @param interaction The interaction.
 * @param name Which of the three it is.
 * @returns The body node, or the refusal `undeclared-response` when it binds no declaration.
 */
const interactionNode = (
  build: Build,
  interaction: SourceElement,
  name: InteractionName,
): Effect.Effect<BodyNode, Refusal> =>
  Effect.gen(function* readInteraction() {
    const path = pathOf(build, interaction);
    const response = yield* requiredAttribute(build, interaction, "response-identifier");
    const declaration = boundDeclaration(build, interaction);
    if (Option.isNone(declaration)) {
      return yield* Effect.fail(
        refusal(build, "undeclared-response", attributePath(path, response), {
          response: identifierOf(response.value),
        }),
      );
    }

    const shown = Arr.findFirst(
      notices,
      (feature) => sitsOn(feature, interaction, true) && holds(build, feature.when, interaction),
    );
    if (Option.isSome(shown)) {
      return yield* notice(build, shown.value.feature, path);
    }

    if (name === "qti-choice-interaction") {
      const bound = bind(renders.bindings[name], declaration.value);
      if (Result.isFailure(bound)) {
        return yield* notice(build, bound.failure, path);
      }

      markElement(build, interaction, true);

      return yield* choiceInteraction(build, interaction, bound.success.cardinality);
    }

    if (name === "qti-text-entry-interaction") {
      const bound = bind(renders.bindings[name], declaration.value);
      if (Result.isFailure(bound)) {
        return yield* notice(build, bound.failure, path);
      }

      markElement(build, interaction, true);

      const fields = yield* textFields(build, interaction, bound.success.baseType);

      return { ...fields, kind: "text-entry" };
    }

    const binding = renders.bindings[name];
    const bound = bind(binding, declaration.value);
    if (Result.isFailure(bound)) {
      return yield* notice(build, bound.failure, path);
    }

    const written = Option.getOrElse(valueOf(interaction, "format"), () => "plain");
    const format = binding.formats.find((value) => value === written);
    if (format === undefined) {
      return yield* notice(build, `format="${written}"`, path);
    }

    markElement(build, interaction, true);

    const fields = yield* textFields(build, interaction, bound.success.baseType);
    const expectedLines = yield* countAttribute(build, interaction, "expected-lines");
    const maxStrings = yield* countAttribute(build, interaction, "max-strings");
    const minStrings = yield* countAttribute(build, interaction, "min-strings");
    for (const feature of controlNotices) {
      if (sitsOn(feature, interaction, true) && holds(build, feature.when, interaction)) {
        record(build, { feature: feature.feature, path, shown: "notice" });
      }
    }

    const prompt = yield* promptOf(build, interaction);

    return {
      ...fields,
      cardinality: bound.success.cardinality,
      expectedLines,
      format,
      kind: "extended-text",
      maxStrings,
      minStrings: Option.getOrElse(minStrings, () => 0n),
      prompt,
    };
  });

/**
 * Read one child of a body element.
 *
 * @param build The build.
 * @param parent The element that holds it.
 * @param child The child.
 * @returns Its body node: text as itself, an HTML element with its subtree, an interaction's model,
 *   or a notice for anything else, its subtree dropped; or a refusal.
 */
const bodyNode = (
  build: Build,
  parent: SourceElement,
  child: SourceChild,
): Effect.Effect<BodyNode, Refusal> => {
  if (child.kind === "text") {
    return Effect.succeed({ kind: "text", text: child.text });
  }

  if (child.kind === "entity") {
    return notice(build, `&${child.name};`, pathOf(build, parent));
  }

  const interaction = interactionNames.find((name) => isQti(child, name));
  if (interaction !== undefined) {
    return interactionNode(build, child, interaction);
  }

  if (!isQti(child) || child.local.startsWith("qti-")) {
    return notice(build, nameOf(child), pathOf(build, child));
  }

  return Effect.gen(function* bodyElement() {
    markElement(build, child, true);

    const children = yield* bodyNodes(build, child);

    return {
      attributes: bodyAttributes(child),
      children,
      kind: "element",
      path: pathOf(build, child),
      tag: child.local,
    };
  });
};

/**
 * Record an element the engine does not run, as a mark keyed by its name or by its own feature.
 *
 * @param build The build.
 * @param element The element.
 * @param feature The mark's key, the element's name by default.
 * @returns None, so the rule tree that holds it is none.
 */
const unread = (
  build: Build,
  element: SourceElement,
  feature: string = nameOf(element),
): Effect.Effect<Option.Option<never>> =>
  Effect.sync(() => {
    record(build, { feature, path: pathOf(build, element), shown: "mark" });

    return Option.none();
  });

/**
 * Read a `qti-equal`: its two operands, in its default `exact` tolerance mode.
 *
 * A `qti-equal` in its `absolute` or `relative` mode is the mark `tolerance-mode="<mode>"` at its
 * path, and its operands are read after it, so every element in them the engine does not run is
 * marked too. Its `tolerance`, `include-lower-bound` and `include-upper-bound` mean nothing in
 * `exact` mode, so they are not read.
 *
 * @param build The build.
 * @param element The `qti-equal` element.
 * @returns The `equal` expression; none when it is in another tolerance mode or holds an element
 *   the engine does not run; or the refusal an operand gives, or `attribute-type` for a
 *   `tolerance-mode` outside its three values, which the validator refuses first.
 */
const equalExpression = (
  build: Build,
  element: SourceElement,
): Effect.Effect<Option.Option<Expression>, Refusal> =>
  Effect.gen(function* readEqual() {
    const [left, right, ...extra] = elementsOf(element);
    if (left === undefined || right === undefined || extra.length > 0) {
      return yield* unread(build, element);
    }

    const mode = Option.getOrElse(
      yield* enumerated(build, element, "tolerance-mode", toleranceModes),
      () => "exact" as const,
    );
    if (mode !== "exact") {
      yield* unread(build, element, `tolerance-mode="${mode}"`);
    }

    const read = Option.all([
      // oxlint-disable-next-line eslint/no-use-before-define -- `equalExpression` and `expression` are mutually recursive, as operands nest; the call runs only after both are defined.
      yield* expression(build, left),
      // oxlint-disable-next-line eslint/no-use-before-define -- as above.
      yield* expression(build, right),
    ]);
    const equal = read.pipe(Option.map((pair): Expression => ({ kind: "equal", operands: pair })));

    return mode === "exact" ? equal : Option.none();
  });

/**
 * Read an expression of the engine subset.
 *
 * Every operand is read, so every element the engine does not run is marked, not only the first. A
 * `qti-equal` in its `absolute` or `relative` tolerance mode is the mark `tolerance-mode="<mode>"`
 * at its path, its operands read after it; only the default `exact` mode runs.
 *
 * @param build The build.
 * @param element The expression element.
 * @returns The expression, none when it holds an element or a tolerance mode the engine does not
 *   run, or the refusal `value-type` for a `qti-base-value` outside its lexical space. A document
 *   the validator would refuse can also fail with `attribute-type` for a `tolerance-mode` outside
 *   its three values.
 */
const expression = (
  build: Build,
  element: SourceElement,
): Effect.Effect<Option.Option<Expression>, Refusal> =>
  Effect.gen(function* readExpression() {
    const operands = elementsOf(element);
    if (!isQti(element) || !engineElements.has(element.local)) {
      return yield* unread(build, element);
    }

    switch (element.local) {
      case "qti-variable":
      case "qti-correct":
      case "qti-map-response":
      case "qti-map-response-point": {
        const identifier = yield* identifierAttribute(build, element, "identifier");
        const kinds = {
          "qti-correct": "correct",
          "qti-map-response": "map-response",
          "qti-map-response-point": "map-response-point",
          "qti-variable": "variable",
        } as const;

        return Option.some({ identifier, kind: kinds[element.local] });
      }
      case "qti-base-value": {
        const baseType = yield* enumerated(build, element, "base-type", baseTypes);
        if (Option.isNone(baseType)) {
          return yield* Effect.fail(
            refusal(build, "missing-attribute", pathOf(build, element), {
              attribute: "base-type",
              element: element.local,
            }),
          );
        }

        if (!isModelled(baseType.value)) {
          return yield* unread(build, element, `base-type="${baseType.value}"`);
        }

        const single = yield* typed(
          build,
          pathOf(build, element),
          parseElementText(baseType.value, textOf(element)),
        );

        return Option.some({
          kind: "base-value",
          value: {
            baseType: baseType.value,
            cardinality: "single",
            values: Option.toArray(single),
          },
        });
      }
      case "qti-is-null": {
        const [operand, ...extra] = operands;
        if (operand === undefined || extra.length > 0) {
          return yield* unread(build, element);
        }

        const read = yield* expression(build, operand);

        return read.pipe(Option.map((test) => ({ kind: "is-null", operand: test })));
      }
      case "qti-match": {
        const [left, right, ...extra] = operands;
        if (left === undefined || right === undefined || extra.length > 0) {
          return yield* unread(build, element);
        }

        const read = Option.all([yield* expression(build, left), yield* expression(build, right)]);

        return read.pipe(Option.map((pair) => ({ kind: "match", operands: pair })));
      }
      case "qti-equal": {
        return yield* equalExpression(build, element);
      }
      default: {
        return yield* unread(build, element);
      }
    }
  });

/**
 * Construct a branch.
 *
 * @param when Its condition.
 * @param then The rules it runs.
 * @returns The branch.
 */
// oxlint-disable-next-line unicorn/no-thenable -- `then` is the branch's rule list, the name the phase-1 slice list fixes; it is an array, never a function, so no `await` treats a branch as a promise.
const branchOf = (when: Expression, then: readonly Rule[]): Branch => ({ then, when });

/**
 * Read a sequence of response rules.
 *
 * @param build The build.
 * @param elements The rule elements, in order.
 * @returns The rules, none when any holds an element the engine does not run, or a refusal.
 */
const rules = (
  build: Build,
  elements: readonly SourceElement[],
): Effect.Effect<Option.Option<readonly Rule[]>, Refusal> =>
  pipe(
    elements,
    // oxlint-disable-next-line eslint/no-use-before-define -- `rules` and `rule` are mutually recursive, as conditions nest; the call runs only after both are defined.
    Effect.forEach((element) => rule(build, element)),
    Effect.map(Option.all),
  );

/**
 * Read a `qti-response-if` or `qti-response-else-if`: its first child is the condition and the rest
 * are the rules it runs.
 *
 * @param build The build.
 * @param element The branch element.
 * @returns The branch, none when it holds an element the engine does not run, or a refusal.
 */
const branch = (
  build: Build,
  element: SourceElement,
): Effect.Effect<Option.Option<Branch>, Refusal> =>
  Effect.gen(function* readBranch() {
    const [test, ...body] = elementsOf(element);
    if (test === undefined) {
      return yield* unread(build, element);
    }

    const when = yield* expression(build, test);
    const run = yield* rules(build, body);

    return Option.all([when, run]).pipe(Option.map(([read, then]) => branchOf(read, then)));
  });

/**
 * Read one response rule: a `qti-response-condition` or a `qti-set-outcome-value`.
 *
 * @param build The build.
 * @param element The rule element.
 * @returns The rule, none when it holds an element the engine does not run, or a refusal.
 */
const rule = (build: Build, element: SourceElement): Effect.Effect<Option.Option<Rule>, Refusal> =>
  Effect.gen(function* readRule() {
    const parts = elementsOf(element);
    if (isQti(element, "qti-set-outcome-value")) {
      const identifier = yield* identifierAttribute(build, element, "identifier");
      const [operand, ...extra] = parts;
      if (operand === undefined || extra.length > 0) {
        return yield* unread(build, element);
      }

      const read = yield* expression(build, operand);

      return read.pipe(
        Option.map((value) => ({ expression: value, identifier, kind: "set-outcome" })),
      );
    }

    if (!isQti(element, "qti-response-condition")) {
      return yield* unread(build, element);
    }

    const branches = yield* Effect.forEach(
      parts.filter((part) => isQti(part, "qti-response-if") || isQti(part, "qti-response-else-if")),
      (part) => branch(build, part),
    );
    const otherwise = yield* Option.match(
      Arr.findFirst(parts, (part) => isQti(part, "qti-response-else")),
      {
        onNone: () => Effect.succeed(Option.some(Option.none<readonly Rule[]>())),
        onSome: (part) => Effect.map(rules(build, elementsOf(part)), Option.map(Option.some)),
      },
    );
    const strays = yield* Effect.forEach(
      parts.filter(
        (part) =>
          !isQti(part, "qti-response-if") &&
          !isQti(part, "qti-response-else-if") &&
          !isQti(part, "qti-response-else"),
      ),
      (part) => unread(build, part),
    );

    return Option.map(
      Option.all({ branches: Option.all(branches), otherwise, strays: Option.all(strays) }),
      (read) => ({ branches: read.branches, kind: "condition", otherwise: read.otherwise }),
    );
  });

/**
 * Construct the rule that sets `SCORE`.
 *
 * @param operand Its value.
 * @returns The rule.
 */
const setScore = (operand: Expression): Rule => ({
  expression: operand,
  identifier: "SCORE",
  kind: "set-outcome",
});

/**
 * Construct a single float base value.
 *
 * @param value The number.
 * @returns The `base-value` expression of `value`.
 */
const floatValue = (value: number): Expression => ({
  kind: "base-value",
  value: { baseType: "float", cardinality: "single", values: [{ baseType: "float", value }] },
});

/**
 * Construct a `qti-variable`.
 *
 * @param identifier The variable's identifier.
 * @returns The `variable` expression of `identifier`.
 */
const variableOf = (identifier: string): Expression => ({ identifier, kind: "variable" });

/**
 * Construct the rule that sets an outcome to a single identifier base value.
 *
 * @param outcome The outcome's identifier.
 * @param value The identifier it is set to.
 * @returns The rule.
 */
const setIdentifier = (outcome: string, value: string): Rule => ({
  expression: {
    kind: "base-value",
    value: {
      baseType: "identifier",
      cardinality: "single",
      values: [{ baseType: "identifier", value }],
    },
  },
  identifier: outcome,
  kind: "set-outcome",
});

/**
 * `match_correct`'s rules: `SCORE` is 1 when `RESPONSE` matches its correct response, else 0.
 * `CC2_match`'s file holds the same rules.
 */
const matchCorrect: readonly Rule[] = [
  {
    branches: [
      branchOf(
        {
          kind: "match",
          operands: [variableOf("RESPONSE"), { identifier: "RESPONSE", kind: "correct" }],
        },
        [setScore(floatValue(1))],
      ),
    ],
    kind: "condition",
    otherwise: Option.some([setScore(floatValue(0))]),
  },
];

/**
 * The built-in templates, as the rule trees their text gives (`ea422814` §5.1): the files in QTI
 * 3's `rptemplates`, transcribed as data, because a browser module reads no file at run time.
 * `map_response_point` is `map_response` with `qti-map-response-point` in place of
 * `qti-map-response`. Of the Common Cartridge templates, `CC2_match` is `match_correct`;
 * `CC2_match_basic` sets `SCORE` to `MAXSCORE` and `FEEDBACKBASIC` to `correct` on a match, else
 * `FEEDBACKBASIC` to `incorrect`; and `CC2_map_response` is `map_response`, then sets `FEEDBACK` to
 * `correct` when `MAXSCORE` and `SCORE` are equal in `exact` mode, else to `incorrect`. A
 * template's tree goes through {@link runnable} as inline rules do, and is also checked for what it
 * needs: one that names a variable the item does not declare, such as `MAXSCORE`, is marked and
 * never refused, and so is one that needs a declaration the item does not provide, such as a
 * `qti-mapping` or a `SCORE` of a single float.
 */
const templates = {
  CC2_map_response: [
    {
      branches: [
        branchOf({ kind: "is-null", operand: variableOf("RESPONSE") }, [setScore(floatValue(0))]),
      ],
      kind: "condition",
      otherwise: Option.some([setScore({ identifier: "RESPONSE", kind: "map-response" })]),
    },
    {
      branches: [
        branchOf({ kind: "equal", operands: [variableOf("MAXSCORE"), variableOf("SCORE")] }, [
          setIdentifier("FEEDBACK", "correct"),
        ]),
      ],
      kind: "condition",
      otherwise: Option.some([setIdentifier("FEEDBACK", "incorrect")]),
    },
  ],
  CC2_match: matchCorrect,
  CC2_match_basic: [
    {
      branches: [
        branchOf(
          {
            kind: "match",
            operands: [variableOf("RESPONSE"), { identifier: "RESPONSE", kind: "correct" }],
          },
          [setScore(variableOf("MAXSCORE")), setIdentifier("FEEDBACKBASIC", "correct")],
        ),
      ],
      kind: "condition",
      otherwise: Option.some([setIdentifier("FEEDBACKBASIC", "incorrect")]),
    },
  ],
  map_response: [
    {
      branches: [
        branchOf({ kind: "is-null", operand: variableOf("RESPONSE") }, [setScore(floatValue(0))]),
      ],
      kind: "condition",
      otherwise: Option.some([setScore({ identifier: "RESPONSE", kind: "map-response" })]),
    },
  ],
  map_response_point: [
    {
      branches: [
        branchOf({ kind: "is-null", operand: variableOf("RESPONSE") }, [setScore(floatValue(0))]),
      ],
      kind: "condition",
      otherwise: Option.some([setScore({ identifier: "RESPONSE", kind: "map-response-point" })]),
    },
  ],
  match_correct: matchCorrect,
} satisfies Record<TemplateName, readonly Rule[]>;

/**
 * A response processing's rule tree, and the built-in template it is.
 */
interface ProcessingTree {
  /**
   * The built-in template the tree is, none for inline rules.
   */
  readonly template: Option.Option<TemplateName>;
  readonly tree: readonly Rule[];
}

/**
 * Read a `qti-response-processing`.
 *
 * Inline rules take precedence over a template, as the information model says. A built-in
 * template becomes its rule tree; a `template` outside the built-ins is marked `template="<uri>"`
 * either way.
 *
 * @param build The build.
 * @param processing The processing element.
 * @returns The rule tree with the template it is, none when the engine cannot run it, or a refusal.
 */
const processingOf = (
  build: Build,
  processing: SourceElement,
): Effect.Effect<Option.Option<ProcessingTree>, Refusal> => {
  const uri = valueOf(processing, "template");
  const builtIn = uri.pipe(Option.flatMap(templateName));
  if (Option.isSome(uri) && Option.isNone(builtIn)) {
    record(build, {
      feature: `template="${uri.value}"`,
      path: pathOf(build, processing),
      shown: "mark",
    });
  }

  const inline = elementsOf(processing);
  if (inline.length > 0 || Option.isNone(uri)) {
    return Effect.map(
      rules(build, inline),
      Option.map((tree) => ({ template: Option.none(), tree })),
    );
  }

  return Effect.succeed(
    builtIn.pipe(Option.map((name) => ({ template: Option.some(name), tree: templates[name] }))),
  );
};

/**
 * The elements whose `identifier` declares an item variable.
 */
const declarationElements: readonly string[] = [
  "qti-context-declaration",
  "qti-outcome-declaration",
  "qti-response-declaration",
  "qti-template-declaration",
];

/**
 * Give the built-in variables the engine holds a value of for an item: `numAttempts`, the attempt
 * count `runAttempt` in `#plate/engine/attempt.ts` passes, unless a declaration of the item names
 * a variable `numAttempts`. A declared variable wins over a built-in of the same name, as the prose
 * rules read a reference (`variableType` in `#plate/validate/rules.ts`), so such a rule reads the
 * declared variable: the engine reads it when the model holds it, and otherwise the rule is
 * marked. `duration` and `completionStatus` are never held.
 *
 * @param root The item's root.
 * @returns The built-in variables' identifiers the engine holds.
 */
const heldBuiltIns = (root: SourceElement): ReadonlySet<string> => {
  const named = new Set(
    elementsOf(root)
      .filter((child) => declarationElements.some((local) => isQti(child, local)))
      .flatMap((declaration) =>
        Option.match(valueOf(declaration, "identifier"), {
          onNone: () => [],
          onSome: (identifier) => [identifierOf(identifier)],
        }),
      ),
  );

  return new Set(["numAttempts"].filter((identifier) => !named.has(identifier)));
};

/**
 * Give each identifier a rule tree names that the engine does not hold, once, in the order the tree
 * first names it.
 *
 * The evaluator holds only the item's modelled responses and outcomes and the built-in
 * `numAttempts` (`Variables` in `#plate/engine/evaluate.ts`) and returns `UnknownIdentifierError`
 * for any other identifier a rule names, so `buildItem` runs no tree this walk finds a name in, and
 * that failure stays unreachable. A `qti-variable` reads a response, an outcome or a built-in
 * variable, `qti-correct`, `qti-map-response` and `qti-map-response-point` read a response,
 * `qti-match`, `qti-equal` and `qti-is-null` read what their operands read, and
 * `qti-set-outcome-value` sets an outcome. The names it finds are valid content, never refused
 * (reading 1): a response the model does not hold (base type `duration` or `file`, cardinality
 * `record`, or no base type), a template variable, an outcome the model does not hold, and the
 * built-in variables `duration` and `completionStatus`, read or set, which the engine holds no
 * value for. Reading 29 makes an item's `duration` a single float, so it is a valid name in an
 * item's rules. An identifier nothing declares is refused before the model is built when
 * inline rules name it; the walk finds it too. One a built-in template names, such as `MAXSCORE`
 * or `FEEDBACK` in a `CC2_*` template, is not in the document, so nothing refuses it: the walk
 * finds it, and the processing is marked.
 *
 * @param tree The rule tree.
 * @param responses The responses the model holds.
 * @param outcomes The outcomes the model holds.
 * @param builtIns The built-in variables the engine holds for this item ({@link heldBuiltIns}).
 * @returns The identifiers the engine does not hold, empty when it can run the tree.
 */
const unheldIdentifiers = (
  tree: readonly Rule[],
  responses: ReadonlyMap<string, ResponseDeclaration>,
  outcomes: ReadonlyMap<string, OutcomeDeclaration>,
  builtIns: ReadonlySet<string>,
): readonly string[] => {
  const unheld = new Set<string>();

  /**
   * Add each identifier an expression and its operands read that the engine does not hold.
   *
   * @param operand The expression.
   */
  const read = (operand: Expression): void => {
    switch (operand.kind) {
      case "variable": {
        if (
          !responses.has(operand.identifier) &&
          !outcomes.has(operand.identifier) &&
          !builtIns.has(operand.identifier)
        ) {
          unheld.add(operand.identifier);
        }

        break;
      }
      case "correct":
      case "map-response":
      case "map-response-point": {
        if (!responses.has(operand.identifier)) {
          unheld.add(operand.identifier);
        }

        break;
      }
      case "is-null": {
        read(operand.operand);
        break;
      }
      case "match":
      case "equal": {
        for (const each of operand.operands) {
          read(each);
        }
        break;
      }
      case "base-value": {
        break;
      }
      default: {
        operand satisfies never;
      }
    }
  };

  /**
   * Add each identifier a rule sequence names, nested branches included, that the engine does not
   * hold: each outcome it sets, and each identifier its expressions read.
   *
   * @param sequence The rules, in order.
   */
  const run = (sequence: readonly Rule[]): void => {
    for (const each of sequence) {
      if (each.kind === "set-outcome") {
        if (!outcomes.has(each.identifier)) {
          unheld.add(each.identifier);
        }

        read(each.expression);
      } else {
        for (const { then, when } of each.branches) {
          read(when);
          run(then);
        }
        if (Option.isSome(each.otherwise)) {
          run(each.otherwise.value);
        }
      }
    }
  };
  run(tree);

  return [...unheld];
};

/**
 * Give every expression a rule tree holds, operands and nested branches included, in the order the
 * tree names them.
 *
 * @param tree The rule tree.
 * @returns The expressions.
 */
const expressionsOf = (tree: readonly Rule[]): readonly Expression[] => {
  const found: Expression[] = [];

  /**
   * Add an expression and, after it, each of its operands.
   *
   * @param operand The expression.
   */
  const add = (operand: Expression): void => {
    found.push(operand);
    if (operand.kind === "is-null") {
      add(operand.operand);
    } else if (operand.kind === "match" || operand.kind === "equal") {
      for (const each of operand.operands) {
        add(each);
      }
    }
  };

  /**
   * Add the expressions of a rule sequence.
   *
   * @param sequence The rules, in order.
   */
  const run = (sequence: readonly Rule[]): void => {
    for (const each of sequence) {
      if (each.kind === "set-outcome") {
        add(each.expression);
      } else {
        for (const { then, when } of each.branches) {
          add(when);
          run(then);
        }
        if (Option.isSome(each.otherwise)) {
          run(each.otherwise.value);
        }
      }
    }
  };
  run(tree);

  return found;
};

/**
 * Report whether a rule tree maps a point through an area mapping that has a `%` coordinate, which
 * the engine does not run: what a percentage means in scoring is open (9.15).
 *
 * @param tree The rule tree.
 * @param responses The responses the model holds.
 * @returns Whether a `qti-map-response-point` in the tree names a response whose area mapping's
 *   `percent` is true.
 */
const readsPercentArea = (
  tree: readonly Rule[],
  responses: ReadonlyMap<string, ResponseDeclaration>,
): boolean =>
  expressionsOf(tree).some(
    (each) =>
      each.kind === "map-response-point" &&
      Option.exists(
        Option.flatMap(
          Option.fromUndefinedOr(responses.get(each.identifier)),
          (response) => response.areaMapping,
        ),
        (mapping) => mapping.percent,
      ),
  );

/**
 * The base type and cardinality of a value: what `qti-set-outcome-value` compares against the
 * outcome's declaration.
 */
type ValueType = Pick<Value, "baseType" | "cardinality">;

/**
 * Construct the `single` type of a base type.
 *
 * @param baseType The base type.
 * @returns The type.
 */
const singleType = (baseType: ModelledBaseType): ValueType => ({ baseType, cardinality: "single" });

/**
 * Give the type of every value an expression gives, as the evaluator gives it
 * (`evaluateExpression` in `#plate/engine/evaluate.ts`). Each case names the code it mirrors in
 * that file, so a change to either is seen in the other:
 *
 * - `variable`: the type of the response or the outcome it names, whose value the record holds
 *   (`evaluateExpression`'s `variable` case, through `variableValue`), else of the built-in it
 *   names: the one built-in the engine holds, `numAttempts` ({@link heldBuiltIns}), is a single
 *   integer (`builtInValue`).
 * - `correct`: its response's declared type, of the correct response or of the NULL in its place
 *   (`evaluateExpression`'s `correct` case).
 * - `base-value`: its own (`evaluateExpression`'s `base-value` case).
 * - `is-null`, `match` and `equal`: a single boolean (`evaluateExpression`'s `is-null`, `match` and
 *   `equal` cases, through `booleanOf` and `nullOf`).
 * - `map-response` and `map-response-point`: a single float (`mapResponse` and `mapResponsePoint`).
 *
 * A NULL keeps the type of the expression that gave it, and the session record holds each variable
 * at its declared type, so the type holds for every value the expression gives.
 *
 * @param operand The expression.
 * @param responses The responses the model holds.
 * @param outcomes The outcomes the model holds.
 * @param builtIns The built-in variables the engine holds for this item.
 * @returns Its type, none when it names an identifier the engine does not hold.
 */
const typeOf = (
  operand: Expression,
  responses: ReadonlyMap<string, ResponseDeclaration>,
  outcomes: ReadonlyMap<string, OutcomeDeclaration>,
  builtIns: ReadonlySet<string>,
): Option.Option<ValueType> => {
  switch (operand.kind) {
    case "variable": {
      const ofDeclaration: ValueType | undefined =
        responses.get(operand.identifier) ?? outcomes.get(operand.identifier);

      return Option.fromUndefinedOr(ofDeclaration).pipe(
        Option.orElse(() =>
          builtIns.has(operand.identifier) ? Option.some(singleType("integer")) : Option.none(),
        ),
      );
    }
    case "correct": {
      const ofDeclaration: ValueType | undefined = responses.get(operand.identifier);

      return Option.fromUndefinedOr(ofDeclaration);
    }
    case "base-value": {
      return Option.some(operand.value);
    }
    case "match":
    case "equal":
    case "is-null": {
      return Option.some(singleType("boolean"));
    }
    case "map-response":
    case "map-response-point": {
      return Option.some(singleType("float"));
    }
    default: {
      return operand satisfies never;
    }
  }
};

/**
 * Give each declaration a rule tree needs and the item does not provide, as the mark that names
 * it, once, in the order the tree first needs it.
 *
 * The evaluator returns `UnmappedResponseError` for a `qti-map-response` of a response with no
 * `qti-mapping` and for a `qti-map-response-point` of one with no `qti-area-mapping`, which only a
 * `point` declaration holds, and `OutcomeMismatchError` for a `qti-set-outcome-value` whose
 * expression's type ({@link typeOf}) is not the outcome's (`#plate/engine/evaluate.ts`). The prose
 * rules refuse inline rules that need these (`expression-type` and `template-requirements` in
 * `#plate/validate/rules.ts`). Of a built-in template they judge less: `template-requirements`
 * judges what a canonical template needs of `RESPONSE` and the base type of `SCORE`, not its
 * cardinality, and leaves the `CC2_*` templates alone (Q6). So {@link runnable} runs no built-in
 * template's tree this walk finds a need in, and those failures stay unreachable from one.
 * The marks name what is missing: `mapping:<identifier>` and `area-mapping:<identifier>` for the
 * response's mapping and area mapping, and `outcome-type:<identifier>` for an outcome a rule sets
 * to a value of another base type or cardinality. An identifier the engine does not hold is
 * {@link unheldIdentifiers}'s mark, and no need is judged of it.
 *
 * @param tree The rule tree.
 * @param responses The responses the model holds.
 * @param outcomes The outcomes the model holds.
 * @param builtIns The built-in variables the engine holds for this item ({@link heldBuiltIns}).
 * @returns The marks, empty when every need is met.
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#ExpMapResponse
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#Data_SetValue
 */
const unmetNeeds = (
  tree: readonly Rule[],
  responses: ReadonlyMap<string, ResponseDeclaration>,
  outcomes: ReadonlyMap<string, OutcomeDeclaration>,
  builtIns: ReadonlySet<string>,
): readonly string[] => {
  const unmet = new Set<string>();

  /**
   * Add the mark of each mapping an expression and its operands read that their response lacks.
   *
   * @param operand The expression.
   */
  const read = (operand: Expression): void => {
    if (operand.kind === "map-response" || operand.kind === "map-response-point") {
      const response = responses.get(operand.identifier);
      const point = operand.kind === "map-response-point";
      const lacking =
        response !== undefined &&
        (point ? Option.isNone(response.areaMapping) : Option.isNone(response.mapping));
      if (lacking) {
        unmet.add(`${point ? "area-mapping" : "mapping"}:${operand.identifier}`);
      }
    } else if (operand.kind === "is-null") {
      read(operand.operand);
    } else if (operand.kind === "match" || operand.kind === "equal") {
      for (const each of operand.operands) {
        read(each);
      }
    }
  };

  /**
   * Add the marks of a rule sequence, nested branches included: each mapping its expressions read
   * that their response lacks, and each outcome it sets to a value of another type.
   *
   * @param sequence The rules, in order.
   */
  const run = (sequence: readonly Rule[]): void => {
    for (const each of sequence) {
      if (each.kind === "set-outcome") {
        read(each.expression);

        const outcome = outcomes.get(each.identifier);
        const given = typeOf(each.expression, responses, outcomes, builtIns);
        if (
          outcome !== undefined &&
          Option.exists(
            given,
            (type) =>
              type.baseType !== outcome.baseType || type.cardinality !== outcome.cardinality,
          )
        ) {
          unmet.add(`outcome-type:${each.identifier}`);
        }
      } else {
        for (const { then, when } of each.branches) {
          read(when);
          run(then);
        }
        if (Option.isSome(each.otherwise)) {
          run(each.otherwise.value);
        }
      }
    }
  };
  run(tree);

  return [...unmet];
};

/**
 * A response processing read into a rule tree, with where its marks go.
 */
interface ReadProcessing extends ProcessingTree {
  /**
   * The number of marks recorded when the processing element was read, so the marks it gains later
   * keep document order.
   */
  readonly at: number;
  /**
   * The `qti-response-processing` element's path.
   */
  readonly path: string;
}

/**
 * Keep a rule tree the engine can run. Each identifier {@link unheldIdentifiers} finds is the mark
 * `variable:<identifier>` at the processing element's path, each need {@link unmetNeeds} finds in a
 * built-in template's tree is its mark there (`mapping:<identifier>`, `area-mapping:<identifier>`
 * or `outcome-type:<identifier>`), and a tree that maps a point through an area mapping with a `%`
 * coordinate ({@link readsPercentArea}) is the mark `area-coords-percent` there. The marks are
 * placed among the others in document order, and the tree is then none. So a built-in template the
 * item does not provide for, a `CC2_*` one (Q6) or a canonical one whose `SCORE` has the base type
 * `template-requirements` asks for and another cardinality, is marked and does not run, and is
 * never refused. Inline rules are not walked for needs: the prose rules refuse those that have one.
 *
 * @param build The build.
 * @param read The processing as read.
 * @param responses The responses the model holds.
 * @param outcomes The outcomes the model holds.
 * @returns The tree, or none when it names an identifier the engine does not hold, is a built-in
 *   template that needs a declaration the item does not provide, or reads an area mapping with a
 *   `%` coordinate.
 */
const runnable = (
  build: Build,
  read: ReadProcessing,
  responses: ReadonlyMap<string, ResponseDeclaration>,
  outcomes: ReadonlyMap<string, OutcomeDeclaration>,
): Option.Option<readonly Rule[]> => {
  const builtIns = heldBuiltIns(build.document.root);
  const features = [
    ...unheldIdentifiers(read.tree, responses, outcomes, builtIns).map(
      (identifier) => `variable:${identifier}`,
    ),
    ...(Option.isSome(read.template) ? unmetNeeds(read.tree, responses, outcomes, builtIns) : []),
  ];
  if (readsPercentArea(read.tree, responses)) {
    features.push("area-coords-percent");
  }

  const after = build.unsupported.splice(read.at);
  for (const feature of features) {
    build.unsupported.push({ feature, path: read.path, shown: "mark" });
  }
  for (const entry of after) {
    build.unsupported.push(entry);
  }

  return features.length === 0 ? Option.some(read.tree) : Option.none();
};

/**
 * Index every element of a document by its path.
 *
 * @param document The document.
 * @returns Each element's path, keyed by the element.
 */
const pathsOf = (document: SourceDocument): ReadonlyMap<SourceElement, string> =>
  new Map(Array.from(walk(document), (visit) => [visit.element, visit.path]));

/**
 * Key a document's response declarations by their identifier, as {@link Build}'s `declarations`
 * holds them: a later declaration replaces an earlier one with the same identifier, and one without
 * an identifier binds nothing.
 *
 * @param document The document.
 * @returns Each response declaration, keyed by its identifier as `identifierOf` reads it.
 */
const declarationsOf = (document: SourceDocument): ReadonlyMap<string, SourceElement> =>
  new Map(
    childrenNamed(document.root, "qti-response-declaration").flatMap((declaration) =>
      Option.match(valueOf(declaration, "identifier"), {
        onNone: () => [],
        onSome: (identifier) => [[identifierOf(identifier), declaration] as const],
      }),
    ),
  );

/**
 * Build the item model of a valid `qti-assessment-item`.
 *
 * The body keeps text and HTML elements as written. Choice, Text Entry and Extended Text become
 * their models when their binding is one `renders` lists and they carry no notice feature; any
 * other `qti-*` element in the body becomes a notice, its subtree dropped. Each `renders` mark adds
 * an unsupported feature, and so does each `qti-*` element outside the body that the model does
 * not read. Response processing is a rule tree: a built-in template resolves to the tree its text
 * gives, and inline rules become their tree when every element is in the engine. The tree is kept
 * only when the engine holds every identifier it names, the item provides every declaration a
 * built-in template's tree needs, and it maps no point through an area mapping with a `%`
 * coordinate; each identifier it does not hold is the mark `variable:<identifier>` at the
 * processing element's path, each such need unmet its mark there (`mapping:<identifier>`,
 * `area-mapping:<identifier>` or `outcome-type:<identifier>`), such a point mapping the mark
 * `area-coords-percent` there, and the processing is then none. An item whose root has a
 * `qti-template-processing` child keeps that element's mark and has no processing, whatever the
 * tree: template processing may set a template variable, a default value or a correct response,
 * and phase 1 runs none of it, so a score computed without it could be wrong.
 *
 * @param source A document the structural validator and the prose rules accepted.
 * @returns The item, or the refusal `value-type` at the first typed value outside its lexical
 *   space. A document the validator would refuse can also fail with `missing-attribute`,
 *   `attribute-type` or `undeclared-response`.
 */
export const buildItem = (source: SourceDocument): Effect.Effect<Item, Refusal> =>
  Effect.gen(function* readItem() {
    const build: Build = {
      declarations: declarationsOf(source),
      document: source,
      paths: pathsOf(source),
      recorded: new Map(),
      unsupported: [],
    };
    const { root } = source;
    markElement(build, root, false);

    const identifier = yield* identifierAttribute(build, root, "identifier");
    const title = yield* required(build, root, "title");
    const responses = new Map<string, ResponseDeclaration>();
    const outcomes = new Map<string, OutcomeDeclaration>();
    const body: BodyNode[] = [];
    let processing: Option.Option<ReadProcessing> = Option.none();

    for (const part of elementsOf(root).filter((child) => isQti(child))) {
      if (part.local === "qti-item-body") {
        markElement(build, part, true);
        for (const node of yield* bodyNodes(build, part)) {
          body.push(node);
        }
      } else if (part.local === "qti-response-processing") {
        markElement(build, part, false);

        const parsed = yield* processingOf(build, part);
        processing = parsed.pipe(
          Option.map((read) => ({
            ...read,
            at: build.unsupported.length,
            path: pathOf(build, part),
          })),
        );
      } else if (part.local === "qti-response-declaration") {
        markElement(build, part, false);
        markUnreadWithin(build, part);

        const read = yield* responseDeclaration(build, part);
        if (Option.isSome(read)) {
          responses.set(read.value.identifier, read.value);
        }
      } else if (part.local === "qti-outcome-declaration") {
        markElement(build, part, false);
        markUnreadWithin(build, part);

        const read = yield* outcomeDeclaration(build, part);
        if (Option.isSome(read)) {
          outcomes.set(read.value.identifier, read.value);
        }
      } else {
        markElement(build, part, false);
        if (!readElements.has(part.local)) {
          record(build, { feature: part.local, path: pathOf(build, part), shown: "mark" });
        }
      }
    }

    const runs = processing.pipe(
      Option.flatMap((read) => runnable(build, read, responses, outcomes)),
    );
    const templated = childrenNamed(root, "qti-template-processing").length > 0;

    return {
      body,
      document: source.location,
      identifier,
      lang: valueOf(root, "xml:lang"),
      outcomes,
      processing: templated ? Option.none() : runs,
      responses,
      title,
      unsupported: build.unsupported,
    };
  });

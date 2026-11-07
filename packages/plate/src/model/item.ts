/**
 * The item model: what plate reads from a valid `qti-assessment-item`, typed, with every feature
 * it does not render named as a notice or a mark.
 *
 * {@link buildItem} reads the declarations, the body and the response processing into one
 * {@link Item}. The vocabulary module's `renders` decides what is modelled and what is unsupported,
 * so the verdict, the payload and the emitter meet the same decision. A typed value outside its
 * lexical space is the content refusal `value-type`, so a caller that builds an item stays total.
 *
 * @module
 */
import { Array as Arr, Effect, Option, Result, pipe } from "effect";
import { attributePath, walk, xincludeNamespace } from "#plate/document/source.ts";
import type { SourceChild, SourceDocument, SourceElement } from "#plate/document/source.ts";
import {
  attributeName,
  attributeOf,
  childrenNamed,
  coordsOf,
  countAttribute,
  doubleAttribute,
  elementsOf,
  enumerated,
  floatAttribute,
  floatOf,
  greatestInt,
  identifierAttribute,
  identifierOf,
  integerOf,
  isQti,
  leastInt,
  listed,
  nameOf,
  pathOf,
  refusal,
  requiredAttribute,
  requiredValue,
  textOf,
  typed,
  valueOf,
  xsBoolean,
  xsBooleanOf,
  xsInt,
} from "#plate/model/attributes.ts";
import type { AttributeRefusal, ModelWalk } from "#plate/model/attributes.ts";
import type {
  Branch,
  DeclarationFacet,
  Expression,
  ExpressionType,
  KindRule,
  ResultAttributes,
  Rule,
} from "#plate/model/expression.ts";
import { kindRules, landedKinds, readExpression } from "#plate/model/expressions/read.ts";
import type { ExpressionReading } from "#plate/model/expressions/read.ts";
import { translate } from "#plate/model/regex.ts";
import { isModelled, parseElementText, parseLexical, trimXmlSpace } from "#plate/model/values.ts";
import type { ModelledBaseType, Single, Value } from "#plate/model/values.ts";
import type { Refusal } from "#plate/validate/refusal.ts";
import {
  // oxlint-disable-next-line anti-slop/no-shape-in-symbol-names -- `shape` is the QTI attribute of `qti-area-map-entry` and names an area's geometry, not a structure.
  areaShapes,
  baseTypes,
  cardinalities,
  interactionNames,
  outcomeViews,
  renders,
  templateName,
} from "#plate/vocabulary.ts";
import type {
  // oxlint-disable-next-line anti-slop/no-shape-in-symbol-names -- `shape` is the QTI attribute of `qti-area-map-entry` and names an area's geometry, not a structure.
  AreaShape,
  Condition,
  FeatureRule,
  InteractionName,
  OutcomeView,
  TemplateName,
} from "#plate/vocabulary.ts";

export type { Branch, Expression, Rule } from "#plate/model/expression.ts";

/**
 * A feature the item holds and plate does not render, where it is, and how it is shown: a
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
 * One `qti-match-table-entry`: the integer a lookup matches and the value it then gives.
 */
export interface MatchTableEntry {
  /**
   * `source-value`, an `xs:int`, held exact as every integer is (reading 45).
   */
  readonly sourceValue: bigint;
  /**
   * `target-value`, a value of the outcome's base type (reading 8), read exactly as written
   * (reading 7).
   */
  readonly targetValue: Single;
}

/**
 * An outcome's `qti-match-table`, its entries in document order.
 */
export interface MatchTable {
  /**
   * `default-value`, a value of the outcome's base type read exactly as written (reading 7), when
   * the table has one.
   */
  readonly defaultValue: Option.Option<Single>;
  readonly entries: readonly MatchTableEntry[];
  readonly kind: "match";
}

/**
 * One `qti-interpolation-table-entry`: the least number a lookup maps to its value.
 */
export interface InterpolationTableEntry {
  /**
   * `include-boundary`, an `xs:boolean` that is true when absent: whether a number equal to
   * `sourceValue` maps to this entry.
   */
  readonly includeBoundary: boolean;
  /**
   * `source-value`, a float read exactly as written (reading 7).
   */
  readonly sourceValue: number;
  /**
   * `target-value`, a value of the outcome's base type read exactly as written (reading 7).
   */
  readonly targetValue: Single;
}

/**
 * An outcome's `qti-interpolation-table`, its entries in document order.
 */
export interface InterpolationTable {
  /**
   * `default-value`, a value of the outcome's base type read exactly as written (reading 7), when
   * the table has one.
   */
  readonly defaultValue: Option.Option<Single>;
  readonly entries: readonly InterpolationTableEntry[];
  readonly kind: "interpolation";
}

/**
 * The table a `qti-lookup-outcome-value` maps its value through: the outcome's match table or its
 * interpolation table.
 */
export type LookupTable = InterpolationTable | MatchTable;

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
   * The `qti-match-table` or `qti-interpolation-table`, when the declaration has one.
   */
  readonly lookupTable: Option.Option<LookupTable>;
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
   * `view`, a list of {@link outcomeViews} in the order written. The structural check holds it to
   * at least one view (reading 17).
   */
  readonly view: Option.Option<readonly OutcomeView[]>;
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
 * A `qti-simple-choice` of a Choice, or a `qti-inline-choice` of an Inline Choice, which carries
 * the same fields: its identifier, its content, and whether it is fixed.
 */
export interface SimpleChoice {
  readonly content: readonly BodyNode[];
  /**
   * `fixed`, an `xs:boolean`, false when absent: a fixed choice keeps its document position when
   * its interaction is shuffled.
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
 * A `qti-inline-choice-interaction` (Q-12), bound to an identifier response of single
 * cardinality, which stands inside the author's sentence. The model keeps its choices in document
 * order whatever `shuffle` says; the payload presents a shuffled Inline Choice's choices in the
 * seeded order, each fixed choice at its own place, as a Choice's.
 */
export interface InlineChoiceInteraction {
  /**
   * The author's `aria-label`, which names the Control when no Label gives a name.
   */
  readonly ariaLabel: Option.Option<string>;
  /**
   * The author's `aria-labelledby`, an IDREFS value as written, which names the Control when no
   * Label gives a name.
   */
  readonly ariaLabelledby: Option.Option<string>;
  /**
   * Each `qti-inline-choice` in document order, which has a `qti-simple-choice`'s identifier,
   * content and `fixed`; the identifiers are unique within the interaction (info model 5.73.1).
   */
  readonly choices: readonly SimpleChoice[];
  /**
   * The author's `class` value, empty when absent.
   */
  readonly class: string;
  readonly kind: "inline-choice";
  /**
   * The content of the interaction's first `qti-label`, none when it has none.
   */
  readonly label: Option.Option<readonly BodyNode[]>;
  /**
   * The author's replacement for the too-few message, `data-min-selections-message`.
   */
  readonly messages: { readonly min: Option.Option<string> };
  /**
   * `min-choices`, 0 when absent: a count, 0 to 2^63-1, held exactly (reading 46). One above 1 is
   * kept as written, so under `validateResponses` no response of a single binding meets it.
   */
  readonly minChoices: bigint;
  readonly path: string;
  /**
   * The author's `data-prompt`, the text of the option that stands for no answer.
   */
  readonly placeholder: Option.Option<string>;
  /**
   * `required`, an `xs:boolean`, false when absent: under `validateResponses`, a NULL response is
   * refused even when `min-choices` is 0.
   */
  readonly required: boolean;
  /**
   * The identifier of the response it binds, `response-identifier`.
   */
  readonly response: string;
  /**
   * `shuffle`, an `xs:boolean`, false when absent.
   */
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
 * A body part plate does not render, shown as a notice in its place; its subtree is dropped.
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
 * An interaction of the item model, the four plate renders: Choice, Extended Text, Inline Choice
 * and Text Entry.
 */
export type Interaction =
  | ChoiceInteraction
  | ExtendedTextInteraction
  | InlineChoiceInteraction
  | TextEntryInteraction;

/**
 * A node of the item body: an element, a text, one of the four interactions, or a notice.
 */
export type BodyNode =
  | BodyElement
  | BodyText
  | ChoiceInteraction
  | InlineChoiceInteraction
  | TextEntryInteraction
  | ExtendedTextInteraction
  | Unsupported;

/**
 * A valid `qti-assessment-item` as plate models it.
 *
 * `responses` and `outcomes` hold the declarations of modelled base types and cardinalities, in
 * document order; every other declaration is a mark. `processing` is none when the item has no
 * response processing, or when plate cannot run it, which `unsupported` then marks. Plate cannot
 * run it on an item with template processing, which plate does not run and which may set a value
 * response processing reads, such as a correct response. `unsupported` lists every feature
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
 * What one item build reads and collects: the walk, the response declarations, the names of the
 * variables the item holds, and the unsupported features found so far, in document order.
 */
interface Build extends ModelWalk {
  /**
   * The root's response declarations, keyed by their identifier as `identifierOf` reads it; the
   * last one when two share an identifier. Built once, so binding an interaction does not rescan
   * the root.
   */
  readonly declarations: ReadonlyMap<string, SourceElement>;
  /**
   * The names of the variables the item holds: every declaration's identifier and the built-in
   * variables ({@link declaredNames}). A reader splits a string attribute's literal from a
   * reference against them, and the walks judge an unchecked reference by them.
   */
  readonly names: ReadonlySet<string>;
  /**
   * The paths each feature in `unsupported` was recorded at, keyed by the feature, so
   * {@link record} finds a repeat without scanning the features recorded so far.
   */
  readonly recorded: Map<string, Set<string>>;
  readonly unsupported: UnsupportedFeature[];
}

/**
 * The `qti-*` elements the model reads or renders: those `renders` lists, the engine's response
 * rules among them, and the element of each expression kind the registry has landed.
 */
const readElements: ReadonlySet<string> = new Set([
  ...renders.elements,
  ...landedKinds.map((kind) => `qti-${kind}`),
]);

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
 * Report whether some nodes hold only text and the named elements, all the way down: what a native
 * `option`, which holds only text, can show.
 *
 * @param nodes The nodes, such as a `qti-inline-choice`'s children.
 * @param elements The local names of the QTI-namespace elements allowed among them.
 * @returns Whether every descendant is text or such an element. An entity reference, or an element
 *   of another namespace, is neither.
 */
const textSafe = (nodes: readonly SourceChild[], elements: readonly string[]): boolean =>
  nodes.every(
    (node) =>
      node.kind === "text" ||
      (node.kind === "element" &&
        elements.includes(nameOf(node)) &&
        textSafe(node.children, elements)),
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

  if (condition.kind === "not-text-safe") {
    return childrenNamed(element, "qti-inline-choice").some(
      (choice) => !textSafe(choice.children, condition.elements),
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
  build: ModelWalk,
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
  build: ModelWalk,
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
  build: ModelWalk,
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
export const xmlWhitespaceRun = /[\t\n\r ]+/gu;

/**
 * Read an outcome declaration's `view`, an XSD list of {@link outcomeViews}: its tokens are the
 * runs between XML whitespace.
 *
 * @param declaration The declaration.
 * @param refuse The reader's refusal of an attribute.
 * @returns The views in the order written, none when absent, or the refusal `attribute-type` at
 *   the attribute when a token is not a view.
 */
const viewAttribute = (
  declaration: SourceElement,
  refuse: AttributeRefusal,
): Effect.Effect<Option.Option<readonly OutcomeView[]>, Refusal> =>
  Effect.transposeOption(
    Option.map(attributeOf(declaration, "view"), (attribute) =>
      Effect.forEach(
        attribute.value.split(xmlWhitespaceRun).filter((token) => token !== ""),
        (token) =>
          Option.match(
            Arr.findFirst(outcomeViews, (view) => view === token),
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
 * `outcomeVariable`, each as the XSD types it.
 *
 * @param declaration The declaration.
 * @param refuse The reader's refusal of an attribute, at that attribute's path in its document.
 * @returns The six, each none when absent, or the refusal `value-type` at a double outside
 *   `xs:double`'s lexical space or `attribute-type` at a `view` naming something other than a view.
 */
const outcomeReporting = (
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
 * Read a lookup table's optional `default-value` exactly as written (reading 7).
 *
 * @param build The build.
 * @param table The `qti-match-table` or `qti-interpolation-table`.
 * @param baseType The outcome's base type, which the value is read in.
 * @returns The value, none when absent, or the refusal `value-type` at the attribute.
 */
const tableDefault = (
  build: ModelWalk,
  table: SourceElement,
  baseType: ModelledBaseType,
): Effect.Effect<Option.Option<Single>, Refusal> =>
  Effect.transposeOption(
    Option.map(attributeOf(table, "default-value"), (attribute) =>
      typed(
        build,
        attributePath(pathOf(build, table), attribute),
        parseLexical(baseType, attribute.value),
      ),
    ),
  );

/**
 * Read a lookup table entry's `target-value` in its outcome's base type (reading 8), exactly as
 * written (reading 7).
 *
 * @param build The build.
 * @param entry The entry.
 * @param baseType The outcome's base type.
 * @returns The value, or the refusal `missing-attribute` or `value-type`.
 */
const targetValue = (
  build: ModelWalk,
  entry: SourceElement,
  baseType: ModelledBaseType,
): Effect.Effect<Single, Refusal> =>
  Effect.flatMap(requiredAttribute(build, entry, "target-value"), (attribute) =>
    typed(
      build,
      attributePath(pathOf(build, entry), attribute),
      parseLexical(baseType, attribute.value),
    ),
  );

/**
 * Read a `qti-match-table-entry`. Its `source-value`, an `xs:int`, is read as the XSD reads it:
 * outer whitespace goes, then the integer is held exactly and refused outside -2^31 to 2^31-1.
 *
 * @param build The build.
 * @param entry The entry.
 * @param baseType The outcome's base type.
 * @returns The entry, or the refusal `missing-attribute` or `value-type`.
 */
const matchEntryOf = (
  build: ModelWalk,
  entry: SourceElement,
  baseType: ModelledBaseType,
): Effect.Effect<MatchTableEntry, Refusal> =>
  Effect.gen(function* readMatchEntry() {
    const source = yield* requiredAttribute(build, entry, "source-value");
    const path = attributePath(pathOf(build, entry), source);
    const lexical = trimXmlSpace(source.value);
    const sourceValue = integerOf(yield* typed(build, path, parseLexical("integer", lexical)));
    if (sourceValue < leastInt || sourceValue > greatestInt) {
      return yield* Effect.fail(
        refusal(build, "value-type", path, { baseType: "xs:int", lexical }),
      );
    }

    return { sourceValue, targetValue: yield* targetValue(build, entry, baseType) };
  });

/**
 * Read a `qti-interpolation-table-entry`. Its `source-value` is a float read exactly as written
 * (reading 7), and its `include-boundary` is true when absent, the XSD's default.
 *
 * @param build The build.
 * @param entry The entry.
 * @param baseType The outcome's base type.
 * @returns The entry, or the refusal `missing-attribute` or `value-type`.
 */
const interpolationEntryOf = (
  build: ModelWalk,
  entry: SourceElement,
  baseType: ModelledBaseType,
): Effect.Effect<InterpolationTableEntry, Refusal> =>
  Effect.gen(function* readInterpolationEntry() {
    const source = yield* requiredAttribute(build, entry, "source-value");
    const sourceValue = floatOf(
      yield* typed(
        build,
        attributePath(pathOf(build, entry), source),
        parseLexical("float", source.value),
      ),
    );

    return {
      includeBoundary: yield* xsBoolean(build, entry, "include-boundary", true),
      sourceValue,
      targetValue: yield* targetValue(build, entry, baseType),
    };
  });

/**
 * Read an outcome declaration's lookup table, its `qti-match-table` or its
 * `qti-interpolation-table` (the XSD admits at most one of the two), in the outcome's base type.
 *
 * @param build The build.
 * @param declaration The declaration.
 * @param baseType The outcome's base type.
 * @returns The table, none when the declaration has none, or the refusal at its first attribute
 *   outside its type.
 */
const lookupTableOf = (
  build: ModelWalk,
  declaration: SourceElement,
  baseType: ModelledBaseType,
): Effect.Effect<Option.Option<LookupTable>, Refusal> =>
  Effect.transposeOption(
    Option.orElse(
      Option.map(
        Arr.head(childrenNamed(declaration, "qti-match-table")),
        (table): Effect.Effect<LookupTable, Refusal> =>
          Effect.gen(function* readMatchTable() {
            return {
              defaultValue: yield* tableDefault(build, table, baseType),
              entries: yield* Effect.forEach(
                childrenNamed(table, "qti-match-table-entry"),
                (entry) => matchEntryOf(build, entry, baseType),
              ),
              kind: "match" as const,
            };
          }),
      ),
      () =>
        Option.map(
          Arr.head(childrenNamed(declaration, "qti-interpolation-table")),
          (table): Effect.Effect<LookupTable, Refusal> =>
            Effect.gen(function* readInterpolationTable() {
              return {
                defaultValue: yield* tableDefault(build, table, baseType),
                entries: yield* Effect.forEach(
                  childrenNamed(table, "qti-interpolation-table-entry"),
                  (entry) => interpolationEntryOf(build, entry, baseType),
                ),
                kind: "interpolation" as const,
              };
            }),
        ),
    ),
  );

/**
 * Read a `qti-outcome-declaration`, an item's or a test's: the item and the test model both read
 * one through this, so the two read them alike.
 *
 * @param build The build.
 * @param declaration The declaration.
 * @returns The model, none when its base type is absent or not modelled or its cardinality is
 *   `record`, or a refusal when `identifier` or `cardinality` is missing or a value is outside its
 *   type.
 */
export const outcomeDeclaration = (
  build: ModelWalk,
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
    const lookupTable = yield* lookupTableOf(build, declaration, read.value.baseType);

    return Option.some({ ...read.value, ...reporting, defaultValue, lookupTable });
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
 * Read the content of an interaction's first child of one name, such as its `qti-prompt` or an
 * Inline Choice's `qti-label`.
 *
 * @param build The build.
 * @param interaction The interaction.
 * @param local The child's local name.
 * @returns The child's content, none when it has no such child, or a refusal.
 */
const firstContent = (
  build: Build,
  interaction: SourceElement,
  local: "qti-label" | "qti-prompt",
): Effect.Effect<Option.Option<readonly BodyNode[]>, Refusal> =>
  Effect.transposeOption(
    Option.map(Arr.head(childrenNamed(interaction, local)), (child) => {
      markElement(build, child, true);

      return bodyNodes(build, child);
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
 * Read a choice of a Choice or an Inline Choice, a `qti-simple-choice` or a `qti-inline-choice`:
 * its identifier, its `fixed`, an `xs:boolean` false when absent, and its content.
 *
 * @param build The build.
 * @param choice The choice.
 * @returns The choice, or a refusal.
 */
const simpleChoiceOf = (
  build: Build,
  choice: SourceElement,
): Effect.Effect<SimpleChoice, Refusal> =>
  Effect.gen(function* simpleChoice() {
    markElement(build, choice, true);

    const identifier = yield* identifierAttribute(build, choice, "identifier");
    const fixed = yield* xsBoolean(build, choice, "fixed", false);

    return { content: yield* bodyNodes(build, choice), fixed, identifier };
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
    const prompt = yield* firstContent(build, interaction, "qti-prompt");
    const choices = yield* Effect.forEach(
      childrenNamed(interaction, "qti-simple-choice"),
      (choice) => simpleChoiceOf(build, choice),
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
 * Read a `qti-inline-choice-interaction`, bound as Inline Choice renders it, to a single
 * identifier.
 *
 * `min-choices`, `required`, `shuffle` and each choice's `fixed` are read as their XSD types read
 * them, their outer whitespace gone (reading 7): `required=" true "` is true. `template-identifier`
 * and `show-hide` are not read.
 *
 * @param build The build.
 * @param interaction The interaction.
 * @returns The Inline Choice model, or a refusal.
 */
const inlineChoiceInteraction = (
  build: Build,
  interaction: SourceElement,
): Effect.Effect<InlineChoiceInteraction, Refusal> =>
  Effect.gen(function* readInlineChoice() {
    const minChoices = yield* countAttribute(build, interaction, "min-choices");
    const required = yield* xsBoolean(build, interaction, "required", false);
    const shuffle = yield* xsBoolean(build, interaction, "shuffle", false);
    const label = yield* firstContent(build, interaction, "qti-label");
    const choices = yield* Effect.forEach(
      childrenNamed(interaction, "qti-inline-choice"),
      (choice) => simpleChoiceOf(build, choice),
    );

    return {
      ariaLabel: valueOf(interaction, "aria-label"),
      ariaLabelledby: valueOf(interaction, "aria-labelledby"),
      choices,
      class: Option.getOrElse(valueOf(interaction, "class"), () => ""),
      kind: "inline-choice",
      label,
      messages: { min: valueOf(interaction, "data-min-selections-message") },
      minChoices: Option.getOrElse(minChoices, () => 0n),
      path: pathOf(build, interaction),
      placeholder: valueOf(interaction, "data-prompt"),
      required,
      response: yield* identifierAttribute(build, interaction, "response-identifier"),
      shuffle,
    };
  });

/**
 * Read one of the four interactions plate renders: its model when its binding is in `renders` and
 * it carries no notice feature, otherwise its notice. An Inline Choice whose choices hold content a
 * native `option` cannot show is the notice `qti-inline-choice-interaction`. An Extended Text that
 * carries a feature of `renders.controlNotices`, such as `min-strings>100`, is still built, and the
 * feature is recorded as a notice that stands in place of its Controls.
 *
 * @param build The build.
 * @param interaction The interaction.
 * @param name Which of the four it is.
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

    if (name === "qti-inline-choice-interaction") {
      const bound = bind(renders.bindings[name], declaration.value);
      if (Result.isFailure(bound)) {
        return yield* notice(build, bound.failure, path);
      }

      markElement(build, interaction, true);

      return yield* inlineChoiceInteraction(build, interaction);
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

    const prompt = yield* firstContent(build, interaction, "qti-prompt");

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
 * Give the generic expression reader its context for a build: the walk, the names the item holds,
 * and the build's two ways to record a mark, so `record` and the build stay here.
 *
 * @param build The build.
 * @returns The reading context.
 */
const readingOf = (build: Build): ExpressionReading => ({
  declared: build.names,
  mark: (element, feature) =>
    Effect.sync(() => {
      record(build, { feature, path: pathOf(build, element), shown: "mark" });
    }),
  unread: (element, feature) => unread(build, element, feature),
  walk: build,
});

/**
 * Read an expression through the registry's generic reader (`readExpression` in
 * `#plate/model/expressions/read.ts`), each kind by its family's reader spec.
 *
 * Every operand is read, so every element the engine does not run is marked, not only the first. A
 * kind whose family has not landed is marked `qti-<kind>` at its path. A `qti-variable`'s optional
 * `weight-identifier` is read and held; an item's processing never evaluates it.
 *
 * @param build The build.
 * @param element The expression element.
 * @returns The expression, none when it holds anything the engine does not run, or the refusal
 *   an attribute gives: `value-type` for a `qti-base-value` outside its lexical space, and, in a
 *   document the validator refuses first, the refusal of any attribute outside its type.
 */
const expression = (
  build: Build,
  element: SourceElement,
): Effect.Effect<Option.Option<Expression>, Refusal> => readExpression(readingOf(build), element);

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
 * Read a sequence of response rules. A `qti-response-processing-fragment`'s rules take its place,
 * so the sequence holds no fragment.
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
    // oxlint-disable-next-line eslint/no-use-before-define -- `rules` and `rule` are mutually recursive, as conditions and fragments nest; the call runs only after both are defined.
    Effect.forEach((element) => rule(build, element)),
    Effect.map((read) => Option.map(Option.all(read), (each) => each.flat())),
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
 * The mark of an XInclude `include` in response processing, which is never fetched (S-6), as the
 * test model marks one.
 */
const includeMark = "xi:include";

/**
 * Read the rule that holds one expression and names an outcome: a `qti-set-outcome-value` or a
 * `qti-lookup-outcome-value`.
 *
 * @param build The build.
 * @param element The rule element.
 * @param kind The rule's kind.
 * @returns The rule, none when it does not hold exactly one expression or its expression holds an
 *   element the engine does not run, or a refusal.
 */
const outcomeRule = (
  build: Build,
  element: SourceElement,
  kind: "lookup-outcome" | "set-outcome",
): Effect.Effect<Option.Option<Rule>, Refusal> =>
  Effect.gen(function* readOutcomeRule() {
    const identifier = yield* identifierAttribute(build, element, "identifier");
    const [operand, ...extra] = elementsOf(element);
    if (operand === undefined || extra.length > 0) {
      return yield* unread(build, element);
    }

    const read = yield* expression(build, operand);

    return read.pipe(Option.map((value): Rule => ({ expression: value, identifier, kind })));
  });

/**
 * Read one response rule element into the rules it runs: a `qti-response-condition`, a
 * `qti-set-outcome-value`, a `qti-lookup-outcome-value` and a `qti-exit-response` are one rule
 * each, and a `qti-response-processing-fragment` is its own rules, read in place, nested fragments
 * included. An XInclude `include` is never fetched (S-6): it is marked `xi:include` at its path, so
 * the processing that holds it runs none.
 *
 * @param build The build.
 * @param element The rule element.
 * @returns The rules, none when it holds an element the engine does not run, or a refusal.
 */
const rule = (
  build: Build,
  element: SourceElement,
): Effect.Effect<Option.Option<readonly Rule[]>, Refusal> =>
  Effect.gen(function* readRule() {
    if (element.namespace === xincludeNamespace && element.local === "include") {
      return yield* unread(build, element, includeMark);
    }

    if (isQti(element, "qti-response-processing-fragment")) {
      return yield* rules(build, elementsOf(element));
    }

    if (isQti(element, "qti-exit-response")) {
      return Option.some<readonly Rule[]>([{ kind: "exit" }]);
    }

    if (isQti(element, "qti-set-outcome-value") || isQti(element, "qti-lookup-outcome-value")) {
      const kind = isQti(element, "qti-set-outcome-value") ? "set-outcome" : "lookup-outcome";
      const read = yield* outcomeRule(build, element, kind);

      return read.pipe(Option.map((each) => [each]));
    }

    if (!isQti(element, "qti-response-condition")) {
      return yield* unread(build, element);
    }

    const parts = elementsOf(element);
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
      (read): readonly Rule[] => [
        { branches: read.branches, kind: "condition", otherwise: read.otherwise },
      ],
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
  operands: [],
  value: { baseType: "float", cardinality: "single", values: [{ baseType: "float", value }] },
});

/**
 * Construct a `qti-variable`.
 *
 * @param identifier The variable's identifier.
 * @returns The `variable` expression of `identifier`.
 */
const variableOf = (identifier: string): Expression => ({
  identifier,
  kind: "variable",
  operands: [],
  weightIdentifier: Option.none(),
});

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
    operands: [],
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
          operands: [
            variableOf("RESPONSE"),
            { identifier: "RESPONSE", kind: "correct", operands: [] },
          ],
        },
        [setScore(floatValue(1))],
      ),
    ],
    kind: "condition",
    otherwise: Option.some([setScore(floatValue(0))]),
  },
];

/**
 * The built-in templates, as the rule trees their text gives: the files in QTI 3's `rptemplates`,
 * transcribed as data, because a browser module reads no file at run time. `map_response_point` is
 * `map_response` with `qti-map-response-point` in place of `qti-map-response`. Of the Common
 * Cartridge templates, `CC2_match` is `match_correct`; `CC2_match_basic` sets `SCORE` to `MAXSCORE`
 * and `FEEDBACKBASIC` to `correct` on a match, else `FEEDBACKBASIC` to `incorrect`; and
 * `CC2_map_response` is `map_response`, then sets `FEEDBACK` to `correct` when `MAXSCORE` and
 * `SCORE` are equal in `exact` mode, else to `incorrect`. A template's tree goes through
 * {@link runnable} as inline rules do, and is also checked for what it needs: one that names a
 * variable the item does not declare, such as `MAXSCORE`, is marked and never refused, and so is
 * one that needs a declaration the item does not provide, such as a `qti-mapping` or a `SCORE` of a
 * single float.
 */
const templates = {
  CC2_map_response: [
    {
      branches: [
        branchOf({ kind: "is-null", operands: [variableOf("RESPONSE")] }, [
          setScore(floatValue(0)),
        ]),
      ],
      kind: "condition",
      otherwise: Option.some([
        setScore({ identifier: "RESPONSE", kind: "map-response", operands: [] }),
      ]),
    },
    {
      branches: [
        branchOf(
          {
            includeLowerBound: true,
            includeUpperBound: true,
            kind: "equal",
            operands: [variableOf("MAXSCORE"), variableOf("SCORE")],
            tolerance: [],
            toleranceMode: "exact",
          },
          [setIdentifier("FEEDBACK", "correct")],
        ),
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
            operands: [
              variableOf("RESPONSE"),
              { identifier: "RESPONSE", kind: "correct", operands: [] },
            ],
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
        branchOf({ kind: "is-null", operands: [variableOf("RESPONSE")] }, [
          setScore(floatValue(0)),
        ]),
      ],
      kind: "condition",
      otherwise: Option.some([
        setScore({ identifier: "RESPONSE", kind: "map-response", operands: [] }),
      ]),
    },
  ],
  map_response_point: [
    {
      branches: [
        branchOf({ kind: "is-null", operands: [variableOf("RESPONSE")] }, [
          setScore(floatValue(0)),
        ]),
      ],
      kind: "condition",
      otherwise: Option.some([
        setScore({ identifier: "RESPONSE", kind: "map-response-point", operands: [] }),
      ]),
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
 * Give the identifier of each variable an item's declarations declare: its response, outcome,
 * template and context declarations.
 *
 * @param root The item's root.
 * @returns The declared identifiers.
 */
const declaredIdentifiers = (root: SourceElement): ReadonlySet<string> =>
  new Set(
    elementsOf(root)
      .filter((child) => declarationElements.some((local) => isQti(child, local)))
      .flatMap((declaration) =>
        Option.match(valueOf(declaration, "identifier"), {
          onNone: () => [],
          onSome: (identifier) => [identifierOf(identifier)],
        }),
      ),
  );

/**
 * The built-in variables the engine can hold a value of, each with its type: `numAttempts`, the
 * attempt count `runAttempt` in `#plate/engine/attempt.ts` passes, a single integer; and the
 * built-in outcome `completionStatus`, which the session record holds among its outcomes
 * (`outcomeDefaults` in `#plate/model/record.ts`), a single identifier.
 */
const builtInTypes: ReadonlyMap<string, ValueType> = new Map<string, ValueType>([
  ["completionStatus", { baseType: "identifier", cardinality: "single" }],
  ["numAttempts", { baseType: "integer", cardinality: "single" }],
]);

/**
 * The built-in variables a rule may set as it sets an outcome: `completionStatus`, as the prose
 * rules let `qti-set-outcome-value` and `qti-lookup-outcome-value` name it (`builtInsNamed` in
 * `#plate/validate/rules.ts`).
 */
const settableBuiltIns: ReadonlySet<string> = new Set(["completionStatus"]);

/**
 * Give the built-in variables the engine holds a value of for an item: each of
 * {@link builtInTypes}, `numAttempts` and `completionStatus`, unless a declaration of the item
 * names a variable by that name. A declared variable wins over a built-in of the same name, as the
 * prose rules read a reference (`variableType` in `#plate/validate/rules.ts`), so such a rule reads
 * the declared variable: the engine reads it when the model holds it, and otherwise the rule is
 * marked. `duration` is never held.
 *
 * @param root The item's root.
 * @returns The built-in variables' identifiers the engine holds.
 */
const heldBuiltIns = (root: SourceElement): ReadonlySet<string> => {
  const named = declaredIdentifiers(root);

  return new Set([...builtInTypes.keys()].filter((identifier) => !named.has(identifier)));
};

/**
 * The built-in variables an item's rules may name, whatever the engine holds of them:
 * `numAttempts`, `duration`, `completionStatus` and the context variable `QTI_CONTEXT`.
 */
const builtInVariables: readonly string[] = [
  "completionStatus",
  "duration",
  "numAttempts",
  "QTI_CONTEXT",
];

/**
 * Give the names of the variables an item holds: every identifier its declarations declare and
 * every built-in variable. `qti-pattern-match`'s `pattern` is a reference only when it braces one
 * of them (ruling R1), and an unchecked reference, such as a `qti-equal`'s `tolerance` token, is
 * judged only when it names one of them (9.11).
 *
 * @param root The item's root.
 * @returns The names.
 */
const declaredNames = (root: SourceElement): ReadonlySet<string> =>
  new Set([...declaredIdentifiers(root), ...builtInVariables]);

/**
 * A variable one of an expression's attributes names, by its kind's reference facet: its identifier
 * and whether a reference there is checked.
 */
interface NamedReference {
  readonly checked: boolean;
  readonly identifier: string;
}

/**
 * Report whether a value a variant's field holds is a reference to a variable, the `ref` member of
 * `LiteralOrRef` in `#plate/model/expression.ts`.
 *
 * @param held The field's value, or one value of a list field.
 * @returns Whether it is a reference.
 */
const isReference = (
  held: unknown,
): held is { readonly _tag: "ref"; readonly identifier: string } =>
  typeof held === "object" &&
  held !== null &&
  "_tag" in held &&
  held._tag === "ref" &&
  "identifier" in held &&
  typeof held.identifier === "string";

/**
 * Give each variable an expression's attributes name, through its kind's reference facet: in the
 * facet's order and, within a list attribute such as `tolerance`, in written order. A literal names
 * nothing.
 *
 * The facet names each attribute's field in the variant, so the walk looks the field up by that
 * name among the variant's fields and finds the references generically, in place of a case per
 * kind.
 *
 * @param operand The expression.
 * @param kindRule Its kind's rule.
 * @returns The variables its attributes name.
 */
const referencesOf = (operand: Expression, kindRule: KindRule): readonly NamedReference[] => {
  const fields = new Map<string, unknown>(Object.entries(operand));

  return kindRule.references.flatMap((entry) => {
    const held = fields.get(entry.field);
    const values: readonly unknown[] = entry.list && Array.isArray(held) ? held : [held];

    return values
      .filter((value) => isReference(value))
      .map((reference) => ({ checked: entry.checked, identifier: reference.identifier }));
  });
};

/**
 * Give each identifier a rule tree names that the engine does not hold, once, in the order the tree
 * first names it.
 *
 * The evaluator holds only the item's modelled responses and outcomes and the built-in
 * `numAttempts` and `completionStatus` ({@link heldBuiltIns}; `Variables` in
 * `#plate/engine/evaluate.ts`) and returns `UnknownIdentifierError` for any other identifier a rule
 * names, so `buildItem` runs no tree this walk finds a name in, and that failure stays
 * unreachable. The walk reads each expression through its kind's rule in the
 * registry (`kindRules` in `#plate/model/expressions/read.ts`), in place of a case per kind:
 *
 * - The declaration facet: the `identifier` of a kind that expects a response, such as `qti-correct`,
 *   `qti-map-response` and `qti-map-response-point`, names one the engine holds only among the
 *   responses; that of a kind that expects any variable, such as `qti-variable`, among the
 *   responses, the outcomes and the built-in variables.
 * - The reference facet: each variable an attribute names (`referencesOf`), before the operands, in
 *   the facet's order. A checked reference names one the engine holds as `qti-variable` does. An
 *   unchecked one, a `qti-equal`'s `tolerance` token, is judged only when a declaration or a
 *   built-in names it: one that names nothing is never marked, and gives NULL at run time (9.11).
 * - The operands, which every kind holds in `operands`, so the walk recurses without a case per
 *   operator.
 *
 * `qti-set-outcome-value` and `qti-lookup-outcome-value` set an outcome, or the built-in
 * `completionStatus` where the engine holds it ({@link settableBuiltIns}). The names it finds are
 * valid content, never refused (reading 1): a response the model does not hold (base type
 * `duration` or `file`, cardinality `record`, or no base type), a template variable, an outcome the
 * model does not hold, the built-in variable `duration`, read or set, which the engine holds no
 * value for, and the built-in `completionStatus` where a declaration names it. Reading 29 makes an
 * item's `duration` a single float, so it is a valid name in an item's rules. An identifier nothing
 * declares is refused before the model is built when inline rules name it; the walk finds it too.
 * One a built-in template names, such as `MAXSCORE` or `FEEDBACK` in a `CC2_*` template, is not in
 * the document, so nothing refuses it: the walk finds it, and the processing is marked.
 *
 * @param tree The rule tree.
 * @param responses The responses the model holds.
 * @param outcomes The outcomes the model holds.
 * @param builtIns The built-in variables the engine holds for this item ({@link heldBuiltIns}).
 * @param names The names of the variables the item holds ({@link declaredNames}).
 * @returns The identifiers the engine does not hold, empty when it can run the tree.
 */
const unheldIdentifiers = (
  tree: readonly Rule[],
  responses: ReadonlyMap<string, ResponseDeclaration>,
  outcomes: ReadonlyMap<string, OutcomeDeclaration>,
  builtIns: ReadonlySet<string>,
  names: ReadonlySet<string>,
): readonly string[] => {
  const unheld = new Set<string>();

  /**
   * Report whether the engine holds a variable of a name, as `qti-variable` reads it.
   *
   * @param identifier The name.
   * @returns Whether a response, an outcome or a built-in variable the engine holds has it.
   */
  const isHeld = (identifier: string): boolean =>
    responses.has(identifier) || outcomes.has(identifier) || builtIns.has(identifier);

  /**
   * Add each identifier an expression and its operands read that the engine does not hold: the
   * declaration its kind's declaration facet names, then each variable its attributes name, then
   * those of its operands.
   *
   * @param operand The expression.
   */
  const read = (operand: Expression): void => {
    const kindRule: KindRule = kindRules[operand.kind];
    if (kindRule.declaration !== undefined && "identifier" in operand) {
      const held =
        kindRule.declaration.expected === "response"
          ? responses.has(operand.identifier)
          : isHeld(operand.identifier);
      if (!held) {
        unheld.add(operand.identifier);
      }
    }

    for (const { checked, identifier } of referencesOf(operand, kindRule)) {
      if ((checked || names.has(identifier)) && !isHeld(identifier)) {
        unheld.add(identifier);
      }
    }

    for (const each of operand.operands) {
      read(each);
    }
  };

  /**
   * Report whether the engine holds a variable a rule may set by a name: a modelled outcome, or a
   * built-in it holds that a rule may set ({@link settableBuiltIns}).
   *
   * @param identifier The name.
   * @returns Whether a set or a lookup of it runs.
   */
  const isSettable = (identifier: string): boolean =>
    outcomes.has(identifier) || (builtIns.has(identifier) && settableBuiltIns.has(identifier));

  /**
   * Add each identifier a rule sequence names, nested branches included, that the engine does not
   * hold: each outcome it sets or looks up, and each identifier its expressions read. An exit
   * names none.
   *
   * @param sequence The rules, in order.
   */
  const run = (sequence: readonly Rule[]): void => {
    for (const each of sequence) {
      if (each.kind === "condition") {
        for (const { then, when } of each.branches) {
          read(when);
          run(then);
        }
        if (Option.isSome(each.otherwise)) {
          run(each.otherwise.value);
        }
      } else if (each.kind !== "exit") {
        if (!isSettable(each.identifier)) {
          unheld.add(each.identifier);
        }

        read(each.expression);
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
    for (const each of operand.operands) {
      add(each);
    }
  };

  /**
   * Add the expressions of a rule sequence: a set's and a lookup's expression, and each branch's
   * condition and rules. An exit holds none.
   *
   * @param sequence The rules, in order.
   */
  const run = (sequence: readonly Rule[]): void => {
    for (const each of sequence) {
      if (each.kind === "condition") {
        for (const { then, when } of each.branches) {
          add(when);
          run(then);
        }
        if (Option.isSome(each.otherwise)) {
          run(each.otherwise.value);
        }
      } else if (each.kind !== "exit") {
        add(each.expression);
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
 * Give the value type of a type the kind rules give, none when the value model holds no value of
 * it: a base type of `any`, `unknown`, `duration` or `file`, or a cardinality of `record` or
 * `unknown`. Such a type is not judged.
 *
 * @param type The type.
 * @returns Its value type, or none.
 */
const valueTypeOf = (type: ExpressionType): Option.Option<ValueType> => {
  const { baseType, cardinality } = type;

  return isModelled(baseType) && cardinality !== "record" && cardinality !== "unknown"
    ? Option.some({ baseType, cardinality })
    : Option.none();
};

/**
 * Give the type of the declaration an expression's declaration facet names, as the engine reads
 * its value: among the responses for a kind that expects a response; among the responses, the
 * outcomes and the built-in variables the engine holds for one that expects any variable. The
 * built-ins the engine holds ({@link heldBuiltIns}) have the types {@link builtInTypes} gives:
 * `numAttempts` a single integer, `completionStatus` a single identifier.
 *
 * @param identifier The identifier the expression names.
 * @param expected The kind of variable the facet expects.
 * @param responses The responses the model holds.
 * @param outcomes The outcomes the model holds.
 * @param builtIns The built-in variables the engine holds for this item.
 * @returns The declaration's type, none when the engine holds no variable of that name.
 */
const declarationType = (
  identifier: string,
  expected: DeclarationFacet["expected"],
  responses: ReadonlyMap<string, ResponseDeclaration>,
  outcomes: ReadonlyMap<string, OutcomeDeclaration>,
  builtIns: ReadonlySet<string>,
): Option.Option<ValueType> => {
  const response: ValueType | undefined = responses.get(identifier);
  if (expected === "response") {
    return Option.fromUndefinedOr(response);
  }

  return Option.fromUndefinedOr(response ?? outcomes.get(identifier)).pipe(
    Option.orElse(() =>
      builtIns.has(identifier)
        ? Option.fromUndefinedOr(builtInTypes.get(identifier))
        : Option.none(),
    ),
  );
};

/**
 * Give the attributes an expression's result type depends on that it holds itself:
 * `qti-base-value`'s and `qti-test-variables`' base type and the operator name of
 * `qti-math-operator` and `qti-stats-operator`. Every other kind holds none.
 *
 * @param operand The expression.
 * @returns Its own result attributes.
 */
const ownAttributes = (operand: Expression): ResultAttributes => {
  if (operand.kind === "base-value") {
    return { baseType: operand.value.baseType };
  }

  if (operand.kind === "math-operator" || operand.kind === "stats-operator") {
    return { name: operand.name };
  }

  if (operand.kind === "test-variables") {
    return Option.match(operand.baseType, {
      onNone: () => ({}),
      onSome: (baseType) => ({ baseType }),
    });
  }

  return {};
};

/**
 * Give the type of every value an expression gives, through its kind's rule in the registry
 * (`kindRules` in `#plate/model/expressions/read.ts`): the rule's `resultType` over the types of
 * its operands, typed the same way, and its result attributes. For a kind with a declaration facet
 * the attributes carry the type of the declaration it names ({@link declarationType}), and none
 * when the engine holds no variable of that name, so a kind that takes the declaration's type is
 * then unknown; the kind's own attributes, such as `qti-base-value`'s base type, come from the
 * expression ({@link ownAttributes}). A type the value model holds no value of is none
 * ({@link valueTypeOf}): not judged.
 *
 * Each family's tests hold its evaluators to its rules (the type invariant in
 * `#plate/test/processing.ts`), and a NULL keeps the type of the expression that gave it, so the
 * type holds for every value the engine gives the expression.
 *
 * @param operand The expression.
 * @param responses The responses the model holds.
 * @param outcomes The outcomes the model holds.
 * @param builtIns The built-in variables the engine holds for this item.
 * @returns Its type, none when the rule gives a type the value model does not hold.
 */
const typeOf = (
  operand: Expression,
  responses: ReadonlyMap<string, ResponseDeclaration>,
  outcomes: ReadonlyMap<string, OutcomeDeclaration>,
  builtIns: ReadonlySet<string>,
): Option.Option<ValueType> => {
  /**
   * Give the type an expression's kind rule gives it.
   *
   * @param each The expression.
   * @returns Its type, unknown where the rule cannot say.
   */
  const expressionTypeOf = (each: Expression): ExpressionType => {
    const kindRule: KindRule = kindRules[each.kind];
    const declaration =
      kindRule.declaration === undefined || !("identifier" in each)
        ? Option.none()
        : declarationType(
            each.identifier,
            kindRule.declaration.expected,
            responses,
            outcomes,
            builtIns,
          );
    const operands: readonly Expression[] = each.operands;

    return kindRule.resultType(operands.map(expressionTypeOf), {
      ...ownAttributes(each),
      ...Option.getOrElse(declaration, () => ({})),
    });
  };

  return valueTypeOf(expressionTypeOf(operand));
};

/**
 * Give each declaration a rule tree needs and the item does not provide, as the mark that names
 * it, once, in the order the tree first needs it.
 *
 * The evaluator returns `UnmappedResponseError` for a `qti-map-response` of a response with no
 * `qti-mapping` and for a `qti-map-response-point` of one with no `qti-area-mapping`, which only a
 * `point` declaration holds, and `OutcomeMismatchError` for a `qti-set-outcome-value` whose
 * expression's type ({@link typeOf}) is not the outcome's, or a `qti-lookup-outcome-value` of an
 * outcome that is not single (`#plate/engine/evaluate.ts`). The prose rules refuse inline rules
 * that map a response with no mapping or set an outcome to another type (`expression-type` and
 * `template-requirements` in `#plate/validate/rules.ts`), but no prose rule judges a lookup's
 * outcome cardinality, and pantry's checker accepts a lookup of any outcome with a lookup table.
 * Of a built-in template they judge less: `template-requirements` judges what a canonical template
 * needs of `RESPONSE` and the base type of `SCORE`, not its cardinality, and leaves the `CC2_*`
 * templates alone (Q6). So this walk judges every need of a built-in template's tree and, of inline
 * rules, only each lookup's outcome cardinality, and {@link runnable} runs no tree it finds a need
 * in, so those failures stay unreachable from a checked item. The marks name what is missing:
 * `mapping:<identifier>` and `area-mapping:<identifier>` for the response's mapping and area
 * mapping, and `outcome-type:<identifier>` for an outcome a rule sets to a value of another base
 * type or cardinality. An identifier the engine does not hold is {@link unheldIdentifiers}'s mark,
 * and no need is judged of it; a `record` outcome is one.
 *
 * @param tree The rule tree.
 * @param responses The responses the model holds.
 * @param outcomes The outcomes the model holds.
 * @param builtIns The built-in variables the engine holds for this item ({@link heldBuiltIns}).
 * @param written `template` for a built-in template's tree, whose every need is judged, or
 *   `inline` for inline rules, of which only a lookup's outcome cardinality is.
 * @returns The marks, empty when every need is met.
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#ExpMapResponse
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#Data_SetValue
 * @see https://www.imsglobal.org/spec/qti/v3p0/info/index.html#Data_LookupOutcomeValue
 */
const unmetNeeds = (
  tree: readonly Rule[],
  responses: ReadonlyMap<string, ResponseDeclaration>,
  outcomes: ReadonlyMap<string, OutcomeDeclaration>,
  builtIns: ReadonlySet<string>,
  written: "inline" | "template",
): readonly string[] => {
  const unmet = new Set<string>();

  /**
   * Add the mark of each mapping an expression and its operands read that their response lacks,
   * of a template's tree only: the prose rules refuse an inline one.
   *
   * @param operand The expression.
   */
  const read = (operand: Expression): void => {
    if (written === "inline") {
      return;
    }

    if (operand.kind === "map-response" || operand.kind === "map-response-point") {
      const response = responses.get(operand.identifier);
      const point = operand.kind === "map-response-point";
      const lacking =
        response !== undefined &&
        (point ? Option.isNone(response.areaMapping) : Option.isNone(response.mapping));
      if (lacking) {
        unmet.add(`${point ? "area-mapping" : "mapping"}:${operand.identifier}`);
      }
    }

    for (const each of operand.operands) {
      read(each);
    }
  };

  /**
   * Add the marks of a rule sequence, nested branches included: each mapping its expressions read
   * that their response lacks, and each outcome it sets to a value of another type, a set's of a
   * template's tree only. A lookup gives a single value of its outcome's base type (reading 8), so
   * it needs an outcome of cardinality `single`, inline or not; an exit needs nothing.
   *
   * @param sequence The rules, in order.
   */
  const run = (sequence: readonly Rule[]): void => {
    for (const each of sequence) {
      if (each.kind === "condition") {
        for (const { then, when } of each.branches) {
          read(when);
          run(then);
        }
        if (Option.isSome(each.otherwise)) {
          run(each.otherwise.value);
        }
      } else if (each.kind !== "exit") {
        read(each.expression);

        const outcome = outcomes.get(each.identifier);
        if (outcome !== undefined && (written === "template" || each.kind === "lookup-outcome")) {
          const given =
            each.kind === "set-outcome"
              ? typeOf(each.expression, responses, outcomes, builtIns)
              : Option.some<ValueType>({ baseType: outcome.baseType, cardinality: "single" });
          if (
            Option.exists(
              given,
              (type) =>
                type.baseType !== outcome.baseType || type.cardinality !== outcome.cardinality,
            )
          ) {
            unmet.add(`outcome-type:${each.identifier}`);
          }
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
 * `variable:<identifier>` at the processing element's path, each need {@link unmetNeeds} finds is
 * its mark there (`mapping:<identifier>`, `area-mapping:<identifier>` or
 * `outcome-type:<identifier>`), and a tree that maps a point through an area mapping with a `%`
 * coordinate ({@link readsPercentArea}) is the mark `area-coords-percent` there. The marks are
 * placed among the others in document order, and the tree is then none. So a built-in template the
 * item does not provide for, a `CC2_*` one (Q6) or a canonical one whose `SCORE` has the base type
 * `template-requirements` asks for and another cardinality, is marked and does not run, and is
 * never refused. Inline rules are walked only for a lookup of an outcome that is not single, which
 * is marked `outcome-type:<identifier>` and never refused, as pantry accepts it; the prose rules
 * refuse the inline rules that have any other need.
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
    ...unheldIdentifiers(read.tree, responses, outcomes, builtIns, build.names).map(
      (identifier) => `variable:${identifier}`,
    ),
    ...unmetNeeds(
      read.tree,
      responses,
      outcomes,
      builtIns,
      Option.isSome(read.template) ? "template" : "inline",
    ),
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
export const pathsOf = (document: SourceDocument): ReadonlyMap<SourceElement, string> =>
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
 * an unsupported feature, and so does each `qti-*` element outside the body that the model does not
 * read. Response processing is a rule tree: a built-in template resolves to the tree its text
 * gives, and inline rules become their tree when every element is in the engine. The tree is kept
 * only when the engine holds every identifier it names, the item provides every declaration a
 * built-in template's tree needs, every outcome a lookup sets is single, and it maps no point
 * through an area mapping with a `%` coordinate; each identifier it does not hold is the mark
 * `variable:<identifier>` at the processing element's path, each such need unmet its mark there
 * (`mapping:<identifier>`, `area-mapping:<identifier>` or `outcome-type:<identifier>`), such a
 * point mapping the mark `area-coords-percent` there, and the processing is then none. An item
 * whose root has a `qti-template-processing` child keeps that element's mark and has no processing,
 * whatever the tree: template processing may set a template variable, a default value or a correct
 * response, and the engine runs none of it, so a score computed without it could be wrong.
 *
 * @param source A document the structural validator and the prose rules accepted.
 * @returns The item, or the refusal `value-type` at the first typed value outside its lexical
 *   space. A document the validator would refuse can also fail with `missing-attribute`,
 *   `attribute-type` or `undeclared-response`.
 */
export const buildItem = (source: SourceDocument): Effect.Effect<Item, Refusal> =>
  Effect.gen(function* readItem() {
    const build: Build = {
      builder: "buildItem",
      declarations: declarationsOf(source),
      document: source,
      names: declaredNames(source.root),
      paths: pathsOf(source),
      recorded: new Map(),
      unsupported: [],
    };
    const { root } = source;
    markElement(build, root, false);

    const identifier = yield* identifierAttribute(build, root, "identifier");
    const title = yield* requiredValue(build, root, "title");
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

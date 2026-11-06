/**
 * The prose rules: what QTI's information model and the project's readings require of an item
 * beyond what its XSD can say.
 *
 * {@link checkRules} returns every refusal it finds, in document order, and never stops at the
 * first, so the verdict can collect them beside the structural validator's. The list of rules is
 * closed: a rule this module does not implement is not refused, and each rule's function names the
 * sentence of the information model, or the reading, that settles it. A rule judges only what the
 * structural validator lets through: a missing or out-of-vocabulary attribute is the XSD's refusal,
 * so a prose rule that would read it passes over it rather than refusing the same fault twice.
 *
 * @module
 */
import { Array as Arr, Option, Result } from "effect";
import { attributePath, qtiNamespace, walk } from "#plate/document/source.ts";
import type {
  SourceAttribute,
  SourceDocument,
  SourceElement,
  Visit,
} from "#plate/document/source.ts";
import {
  accepts,
  expressionKinds,
  floatOrRefOf,
  integerOrRefOf,
  isUnlanded,
  singleOf,
  stringOrRefOf,
} from "#plate/model/expression.ts";
import type {
  ExpressionKind,
  ExpressionType,
  KindRule,
  LiteralOrRef,
  ReferenceEntry,
  ResultAttributes,
} from "#plate/model/expression.ts";
import { xsBooleanOf } from "#plate/model/attributes.ts";
import { kindRules } from "#plate/model/expressions/read.ts";
import {
  isModelled,
  isNcName,
  parseElementText,
  parseLexical,
  trimXmlSpace,
} from "#plate/model/values.ts";
import type { InvalidValue, ModelledBaseType } from "#plate/model/values.ts";
import { Refusal } from "#plate/validate/refusal.ts";
import type { RefusalRule } from "#plate/validate/refusal.ts";
import { governingTables } from "#plate/validate/structure.ts";
import type { Tables } from "#plate/validate/xsd.ts";
import { baseTypes, cardinalities, interactionNames, templateName } from "#plate/vocabulary.ts";
import type { BaseType, Cardinality, InteractionName, TemplateName } from "#plate/vocabulary.ts";

/**
 * The base types and cardinalities a response declaration may have when an interaction is bound to
 * it.
 *
 * A declaration of one of `cardinalities` other than `record` must also have one of `baseTypes`. A
 * `record` declaration is judged by its cardinality alone, because a record holds named fields
 * (`stringValue`, `floatValue`, …) and has no base type of its own.
 */
interface Requirement {
  readonly baseTypes: readonly BaseType[];
  readonly cardinalities: readonly Cardinality[];
}

/**
 * The binding each interaction plate renders requires, by its information-model class, quoted from
 * QTI 3.0's information model.
 *
 * This is what QTI allows, not what plate renders: a Text Entry bound to `record` or an Extended
 * Text bound to `multiple` is valid and becomes a notice (`renders` in the vocabulary), so it is
 * not refused here. Other interactions' bindings are not checked.
 */
const requirements = {
  // "The qti-choice-interaction must be bound to a response variable with a base-type of identifier
  // and single or multiple cardinality." (info.txt:8760)
  "qti-choice-interaction": {
    baseTypes: ["identifier"],
    cardinalities: ["single", "multiple"],
  },
  // "The extendedTextInteraction must be bound to a response variable of single, multipe, ordered or
  // record cardinality. [...] Otherwise it must have a base-type of string, integer or float."
  // (info.txt:8850)
  "qti-extended-text-interaction": {
    baseTypes: ["string", "integer", "float"],
    cardinalities: ["single", "multiple", "ordered", "record"],
  },
  // "The qti-inline-choice-interaction must be bound to a response variable with a base-type of
  // identifier and single cardinality only." (info.txt:8818)
  "qti-inline-choice-interaction": {
    baseTypes: ["identifier"],
    cardinalities: ["single"],
  },
  // "The qti-text-entry-interaction must be bound to a response variable with either single or
  // record cardinality only. For single cardinality the base-type must be one of string, integer or
  // float." (info.txt:8826)
  "qti-text-entry-interaction": {
    baseTypes: ["string", "integer", "float"],
    cardinalities: ["single", "record"],
  },
} as const satisfies Record<InteractionName, Requirement>;

/**
 * Read an identifier attribute's value as its XSD type reads it.
 *
 * Every identifier these rules compare is an `xs:NCName` or an `xs:ID` or `xs:IDREF` derived from
 * it, whose whitespace facet is `collapse`, and an NCName holds no inner whitespace, so collapsing
 * is removing the outer whitespace. Reading 7 keeps an attribute's outer whitespace only for the
 * base-typed attributes the XSD types as strings, which no identifier here is, so `" RESPONSE"`
 * names `RESPONSE` and refusing it would refuse valid content (reading 1).
 *
 * @param attribute The identifier attribute.
 * @returns The identifier it names.
 */
const identifierOf = (attribute: SourceAttribute): string => trimXmlSpace(attribute.value);

/**
 * Find an element's attribute in no namespace by its local name.
 *
 * @param element The element.
 * @param local The attribute's local name.
 * @returns The attribute, or none when the element does not carry it.
 */
const attributeOf = (element: SourceElement, local: string): Option.Option<SourceAttribute> =>
  Arr.findFirst(
    element.attributes,
    (attribute) => attribute.namespace === "" && attribute.local === local,
  );

/**
 * Report whether an element is a QTI element whose local name passes a test.
 *
 * @param element The element.
 * @param test The test of its local name.
 * @returns Whether `element` is in the QTI namespace and its local name passes `test`.
 */
const isQti = (element: SourceElement, test: (local: string) => boolean): boolean =>
  element.namespace === qtiNamespace && test(element.local);

/**
 * Report whether an element is one of the item's variable declarations, a `qti-*-declaration`.
 *
 * @param element The element.
 * @returns Whether it is a QTI element named `qti-<kind>-declaration`.
 */
const isDeclaration = (element: SourceElement): boolean =>
  isQti(element, (local) => local.startsWith("qti-") && local.endsWith("-declaration"));

/**
 * Report whether an element is an interaction.
 *
 * The XSD declares `response-identifier` on exactly the twenty-two `qti-*-interaction` elements. On
 * any other element only an attribute wildcard admits it, which binds nothing, so the rule that
 * resolves it reads it on interactions alone.
 *
 * @param element The element.
 * @returns Whether it is a QTI element named `qti-<kind>-interaction`.
 */
const isInteraction = (element: SourceElement): boolean =>
  isQti(element, (local) => local.startsWith("qti-") && local.endsWith("-interaction"));

/**
 * Find which of the interactions plate renders an element is, the ones whose binding these rules
 * check (`interactionNames` in the vocabulary).
 *
 * @param element The element.
 * @returns Its QTI name, or none for any other element.
 */
const renderedInteraction = (element: SourceElement): Option.Option<InteractionName> =>
  element.namespace === qtiNamespace
    ? Arr.findFirst(interactionNames, (name) => name === element.local)
    : Option.none();

/**
 * Report whether a declaration's base type and cardinality meet an interaction's requirement.
 *
 * @param requirement The interaction's requirement.
 * @param cardinality The declaration's cardinality.
 * @param baseType The declaration's base type, none when it carries no `base-type`.
 * @returns Whether the cardinality is one the requirement allows and, unless it is `record`, the
 *   base type is one it allows.
 */
const meets = (
  requirement: Requirement,
  cardinality: Cardinality,
  baseType: Option.Option<BaseType>,
): boolean =>
  requirement.cardinalities.includes(cardinality) &&
  (cardinality === "record" ||
    Option.exists(baseType, (value) => requirement.baseTypes.includes(value)));

/**
 * Index the item's declarations of one kind by the identifier each declares.
 *
 * The declarations are the root's children of that name. When two share an identifier, the last
 * one wins, as it does where the item model binds an interaction; the duplicate is
 * `duplicate-identifier`'s refusal.
 *
 * @param source The document.
 * @param kind The declarations' local name, such as `qti-response-declaration`.
 * @returns Each declared identifier with its declaration.
 */
const declarationsOf = (source: SourceDocument, kind: string): ReadonlyMap<string, SourceElement> =>
  new Map(
    source.root.children.flatMap((child) =>
      child.kind === "element" && isQti(child, (local) => local === kind)
        ? Option.toArray(
            Option.map(
              attributeOf(child, "identifier"),
              (identifier) => [identifierOf(identifier), child] as const,
            ),
          )
        : [],
    ),
  );

/**
 * Construct a refusal of this document at a path.
 *
 * @param source The document refused.
 * @param rule The rule it breaks.
 * @param path The element or attribute path the refusal points at.
 * @param detail The facts the verdict's wording needs.
 * @returns The refusal, with no suggestion and no reader rule.
 */
const refusal = (
  source: SourceDocument,
  rule: RefusalRule,
  path: string,
  detail: Readonly<Record<string, string>>,
): Refusal =>
  new Refusal({
    detail,
    document: source.location,
    location: { kind: "path", path },
    readerRule: Option.none(),
    rule,
    suggestion: Option.none(),
  });

/**
 * The choice elements whose `identifier` is unique within their interaction: each choice's local
 * name, with the local name of the interaction that scopes it.
 *
 * A `qti-simple-choice` is scoped only inside a Choice. In any other interaction that holds one,
 * such as an Order, these rules do not judge its identifier.
 */
const choiceScopes: ReadonlyMap<string, string> = new Map([
  ["qti-inline-choice", "qti-inline-choice-interaction"],
  ["qti-simple-choice", "qti-choice-interaction"],
]);

/**
 * Find the scope in which an element's `identifier` must be unique, if it has one.
 *
 * The item's declarations share one scope, the root: "All item variables declared in an item share
 * the same namespace" (info.txt:12006). A Choice's simple choices share another, the interaction:
 * the identifier of a simple choice "must not be used by any other choice" (info.txt:42411). An
 * Inline Choice's inline choices share theirs the same way: "This identifier must not be used by
 * any other choice or item variable." (info.txt:31918, InlineChoice 5.73.1). Both sentences also
 * forbid a choice identifier equal to an item variable's, which these rules do not refuse.
 *
 * @param source The document.
 * @param visit The element's visit.
 * @returns The element whose children share the scope, or none when no rule here scopes it.
 */
const uniquenessScope = (source: SourceDocument, visit: Visit): Option.Option<SourceElement> =>
  visit.parent.pipe(
    Option.filter(
      (parent) =>
        (parent === source.root && isDeclaration(visit.element)) ||
        (isQti(visit.element, (local) => choiceScopes.has(local)) &&
          isQti(parent, (local) => local === choiceScopes.get(visit.element.local))),
    ),
  );

/**
 * Apply `duplicate-identifier` to one element: its `identifier` is not one an earlier element of
 * its scope already declared.
 *
 * @param source The document.
 * @param visit The element's visit.
 * @param seen The identifiers each scope has declared so far, which this adds the element's to.
 * @returns The refusal at the repeated `identifier` attribute's path, or none for the first
 *   occurrence and for an element no scope holds.
 */
const duplicateIdentifier = (
  source: SourceDocument,
  visit: Visit,
  seen: Map<SourceElement, Set<string>>,
): readonly Refusal[] => {
  const scope = uniquenessScope(source, visit);
  const attribute = attributeOf(visit.element, "identifier");
  if (Option.isNone(scope) || Option.isNone(attribute)) {
    return [];
  }

  const identifier = identifierOf(attribute.value);
  const declared = seen.get(scope.value) ?? new Set<string>();
  seen.set(scope.value, declared);
  if (!declared.has(identifier)) {
    declared.add(identifier);

    return [];
  }

  return [
    refusal(source, "duplicate-identifier", attributePath(visit.path, attribute.value), {
      identifier,
    }),
  ];
};

/**
 * Apply `binding` and reading 19 to an interaction plate renders and the declaration it names.
 *
 * `binding` reads the declaration the interaction's `response-identifier` names, never any other
 * declaration in the document: QTI's Schematron runs some base-type tests against every
 * declaration, and reading 9 applies each rule by its intent, over the bound declaration. A
 * declaration whose `cardinality` is absent or outside the vocabulary, or whose `base-type` is
 * outside it, is the structural validator's refusal and is not judged here.
 *
 * Reading 19: an Extended Text bound to a `multiple` or `ordered` declaration carries `max-strings`
 * (the information model requires it of a container binding; the XSD makes it optional because it
 * cannot see the binding). Without it the interaction is `missing-attribute`; the binding itself
 * stays valid and keeps its notice.
 *
 * @param source The document.
 * @param visit The interaction's visit.
 * @param name Which of the interactions plate renders it is.
 * @param response The response identifier it names.
 * @param declaration The declaration of that identifier.
 * @returns The refusals `binding` and reading 19 give, empty when the binding holds.
 */
const bindingRules = (
  source: SourceDocument,
  visit: Visit,
  name: InteractionName,
  response: string,
  declaration: SourceElement,
): readonly Refusal[] => {
  const cardinality = Option.flatMap(attributeOf(declaration, "cardinality"), (attribute) =>
    Arr.findFirst(cardinalities, (value) => value === attribute.value),
  );
  if (Option.isNone(cardinality)) {
    return [];
  }

  const written = Option.map(attributeOf(declaration, "base-type"), (attribute) => attribute.value);
  const baseType = written.pipe(
    Option.flatMap((value) => Arr.findFirst(baseTypes, (candidate) => candidate === value)),
  );
  const judged = Option.isNone(written) || Option.isSome(baseType);
  const binding =
    judged && !meets(requirements[name], cardinality.value, baseType)
      ? [
          refusal(source, "binding", visit.path, {
            baseType: Option.getOrElse(written, () => ""),
            cardinality: cardinality.value,
            interaction: name,
            response,
          }),
        ]
      : [];

  const container = cardinality.value === "multiple" || cardinality.value === "ordered";
  const maxStrings =
    name === "qti-extended-text-interaction" &&
    container &&
    Option.isNone(attributeOf(visit.element, "max-strings"))
      ? [
          refusal(source, "missing-attribute", visit.path, {
            attribute: "max-strings",
            element: name,
          }),
        ]
      : [];

  return [...binding, ...maxStrings];
};

/**
 * Apply `undeclared-response` to an interaction, then `binding` and reading 19 to the declaration
 * it names.
 *
 * Reading I-8.6 (the goal's decision `01e90255`): an interaction's `response-identifier` names a
 * declared `qti-response-declaration`. Reading 14 makes a Text Entry's `response-identifier` a
 * plain identifier like every other interaction's, not an `xs:IDREF`, so this rule is the only
 * check on it. A text interaction's `string-identifier` is not resolved: reading 14 types it as a
 * plain identifier, and the qti package stores it unresolved. An interaction with no
 * `response-identifier` is the structural validator's `missing-attribute`.
 *
 * @param source The document.
 * @param visit The element's visit.
 * @param declarations The item's response declarations by identifier.
 * @returns The refusal at the `response-identifier` attribute's path when it names no
 *   declaration, otherwise the binding rules' refusals; none for an element that is not an
 *   interaction.
 */
const responseRules = (
  source: SourceDocument,
  visit: Visit,
  declarations: ReadonlyMap<string, SourceElement>,
): readonly Refusal[] => {
  const attribute = attributeOf(visit.element, "response-identifier");
  if (!isInteraction(visit.element) || Option.isNone(attribute)) {
    return [];
  }

  const response = identifierOf(attribute.value);
  const declaration = declarations.get(response);
  if (declaration === undefined) {
    return [
      refusal(source, "undeclared-response", attributePath(visit.path, attribute.value), {
        response,
      }),
    ];
  }

  return Option.match(renderedInteraction(visit.element), {
    onNone: () => [],
    onSome: (name) => bindingRules(source, visit, name, response, declaration),
  });
};

/**
 * The item's declarations a rule resolves identifiers against, and each element's parent, as the
 * walk has met them.
 */
interface Context {
  readonly outcomes: ReadonlyMap<string, SourceElement>;
  /**
   * Each element the rules have judged so far, but the root, with its parent.
   */
  readonly parents: Map<SourceElement, SourceElement>;
  readonly responses: ReadonlyMap<string, SourceElement>;
  /**
   * The responses whose correct response the item's template processing sets, by identifier.
   */
  readonly setCorrectResponses: ReadonlySet<string>;
  /**
   * Each expression typed so far, with its type ({@link expressionType}), so an expression's type
   * is worked out once however many of its ancestors judge their operands.
   */
  readonly types: Map<SourceElement, Option.Option<ExpressionType>>;
  /**
   * Every declaration a `qti-variable` may read: response, outcome, template and context
   * declarations alike.
   */
  readonly variables: ReadonlyMap<string, SourceElement>;
}

/**
 * A declaration a response-processing template or a `qti-map-response` needs: its kind and
 * identifier, and the base type and the child element it must have, where it must.
 */
interface Needed {
  readonly baseType: Option.Option<BaseType>;
  readonly child: Option.Option<string>;
  readonly declaration: "qti-outcome-declaration" | "qti-response-declaration";
  readonly identifier: string;
}

/**
 * The `SCORE` every standard template sets, which must be a float (research `ea422814` §5.1, from
 * the information model's response-processing templates).
 */
const floatScore: Needed = {
  baseType: Option.some("float"),
  child: Option.none(),
  declaration: "qti-outcome-declaration",
  identifier: "SCORE",
};

/**
 * Name the `RESPONSE` a standard template reads, which must hold a child element.
 *
 * @param child The child's local name.
 * @param baseType The base type it must have, none when any will do.
 * @returns What the template needs of `RESPONSE`.
 */
const responseHolding = (child: string, baseType: Option.Option<BaseType>): Needed => ({
  baseType,
  child: Option.some(child),
  declaration: "qti-response-declaration",
  identifier: "RESPONSE",
});

/**
 * What each standard template needs declared (research `ea422814` §5.1): a `RESPONSE` and a float
 * `SCORE`, where `match_correct`'s `RESPONSE` has a correct response, `map_response`'s a
 * `qti-mapping`, and `map_response_point`'s is a `point` with a `qti-area-mapping`.
 *
 * A `qti-correct-response` child is the one need template processing can meet instead: it may set
 * the correct response, but not a mapping or an area mapping ({@link templateRequirements}).
 *
 * The `CC2_*` templates need nothing here: `template-requirements` judges the three canonical
 * templates only (Q6), so a `CC2_*` template is never refused by it. What any built-in template's
 * tree needs beyond this table and the item does not provide, a canonical template's or a `CC2_*`
 * one's, such as a variable, a `qti-mapping`, or a `SCORE` of the cardinality as well as the base
 * type a rule sets, the item model marks instead, and that processing does not run (`runnable` in
 * `#plate/model/item.ts`).
 */
const templateNeeds = {
  CC2_map_response: [],
  CC2_match: [],
  CC2_match_basic: [],
  map_response: [responseHolding("qti-mapping", Option.none()), floatScore],
  map_response_point: [responseHolding("qti-area-mapping", Option.some("point")), floatScore],
  match_correct: [responseHolding("qti-correct-response", Option.none()), floatScore],
} as const satisfies Record<TemplateName, readonly Needed[]>;

/**
 * Report whether a declaration meets what a template or an expression needs of it.
 *
 * Its `base-type` is compared as written, as the binding rule and the item model compare it: a
 * value outside the vocabulary is the structural validator's refusal.
 *
 * @param declaration The declaration found under the needed identifier.
 * @param needed What is needed of it.
 * @returns Whether it has the needed base type and child, where they are needed.
 */
const provides = (declaration: SourceElement, needed: Needed): boolean =>
  Option.match(needed.baseType, {
    onNone: () => true,
    onSome: (baseType) =>
      Option.exists(
        attributeOf(declaration, "base-type"),
        (attribute) => attribute.value === baseType,
      ),
  }) &&
  Option.match(needed.child, {
    onNone: () => true,
    onSome: (child) =>
      declaration.children.some(
        (element) => element.kind === "element" && isQti(element, (local) => local === child),
      ),
  });

/**
 * Construct the detail of a `template-requirements` refusal: the element that needs the
 * declaration, and what it needs.
 *
 * @param element The local name of the element that needs it.
 * @param needed What it needs.
 * @returns The detail, with `baseType` and `child` only where they are needed.
 */
const neededDetail = (element: string, needed: Needed) => ({
  ...Option.match(needed.baseType, { onNone: () => ({}), onSome: (baseType) => ({ baseType }) }),
  ...Option.match(needed.child, { onNone: () => ({}), onSome: (child) => ({ child }) }),
  declaration: needed.declaration,
  element,
  identifier: needed.identifier,
});

/**
 * Apply `template-requirements` to a `qti-response-processing` that names a standard template.
 *
 * Research `ea422814` §5.1: each standard template needs a declared `RESPONSE`, with a correct
 * response for `match_correct`, a `qti-mapping` for `map_response`, and a `point` base type and a
 * `qti-area-mapping` for `map_response_point`, and a declared float `SCORE`. The template is
 * resolved by the vocabulary's `templateName` from its `template` as written, as the item model
 * resolves it; a `CC2_*` template needs nothing (Q6), and any other template is not judged. What a
 * built-in template's tree needs beyond {@link templateNeeds}, the item model marks. "If both
 * embedded rules and a template reference are supplied then the internal rules take precedence"
 * (the information model), so a template beside inline rules never runs and is not judged either;
 * the inline rules are.
 *
 * The correct response `match_correct` needs may also be set by template processing: "The response
 * variable to have its correct value set" is a template rule, `qti-set-correct-response` (the
 * information model, `info-compact.txt:11917`). Phase 1 does not run template processing, and the
 * item model then runs no response processing, but the item is valid, so it is not refused
 * (reading 1). So a `RESPONSE` with no `qti-correct-response` child meets the need when
 * {@link setCorrectResponses} finds one set. No template rule sets a mapping or an area mapping,
 * so those needs are met only by the declaration's child.
 *
 * @param source The document.
 * @param visit The element's visit.
 * @param context The item's declarations, and the responses whose correct response template
 *   processing sets.
 * @returns One refusal at the processing element's path per declaration the template needs and
 *   lacks; none for any other element.
 */
const templateRequirements = (
  source: SourceDocument,
  visit: Visit,
  context: Context,
): readonly Refusal[] => {
  const template = Option.flatMap(attributeOf(visit.element, "template"), (attribute) =>
    templateName(attribute.value),
  );
  const inline = visit.element.children.some((child) => child.kind === "element");
  if (
    !isQti(visit.element, (local) => local === "qti-response-processing") ||
    Option.isNone(template) ||
    inline
  ) {
    return [];
  }

  return templateNeeds[template.value].flatMap((needed) => {
    const declarations =
      needed.declaration === "qti-response-declaration" ? context.responses : context.outcomes;
    const declaration = declarations.get(needed.identifier);
    const setByTemplate =
      Option.exists(needed.child, (child) => child === "qti-correct-response") &&
      context.setCorrectResponses.has(needed.identifier);
    const remaining: Needed = setByTemplate ? { ...needed, child: Option.none() } : needed;

    return declaration !== undefined && provides(declaration, remaining)
      ? []
      : [
          refusal(source, "template-requirements", visit.path, {
            ...neededDetail(visit.element.local, needed),
            template: template.value,
          }),
        ];
  });
};

/**
 * Climb from an element through its ancestors, each passing its step's test in turn.
 *
 * @param context The parents the walk has met.
 * @param element The element to climb from.
 * @param steps One test per ancestor, the parent's first.
 * @returns The last ancestor climbed to, or none when an ancestor is missing or fails its test.
 */
const enclosing = (
  context: Context,
  element: SourceElement,
  steps: readonly ((ancestor: SourceElement) => boolean)[],
): Option.Option<SourceElement> => {
  let reached = element;
  for (const step of steps) {
    const ancestor = context.parents.get(reached);
    if (ancestor === undefined || !step(ancestor)) {
      return Option.none();
    }

    reached = ancestor;
  }

  return Option.some(reached);
};

/**
 * Report whether an element lies anywhere under a `qti-response-processing`.
 *
 * @param context The parents the walk has met.
 * @param element The element.
 * @returns Whether one of its ancestors is a `qti-response-processing`.
 */
const inResponseProcessing = (context: Context, element: SourceElement): boolean => {
  for (
    let ancestor = context.parents.get(element);
    ancestor !== undefined;
    ancestor = context.parents.get(ancestor)
  ) {
    if (isQti(ancestor, (local) => local === "qti-response-processing")) {
      return true;
    }
  }

  return false;
};

/**
 * What each inline mapping expression needs of the response it names.
 *
 * `qti-map-response` needs a `qti-mapping`, "the associated mapping, which must have been
 * declared" (the information model, `info-compact.txt:11438`). `qti-map-response-point` "looks up
 * the value of a response variable that must be of base-type point, and transforms it using the
 * associated areaMapping" (`info-compact.txt:11437`), so it needs a `point` response holding a
 * `qti-area-mapping`. The `identifier` here is a placeholder: each expression's own replaces it.
 */
const mappingNeeds = {
  "qti-map-response": responseHolding("qti-mapping", Option.none()),
  "qti-map-response-point": responseHolding("qti-area-mapping", Option.some("point")),
} as const satisfies Record<string, Needed>;

/**
 * The local name of an inline mapping expression.
 */
type MappingExpression = keyof typeof mappingNeeds;

/**
 * Apply `template-requirements` to an inline `qti-map-response` or `qti-map-response-point`: the
 * response it names is declared with what {@link mappingNeeds} lists for it. The qti package
 * refuses both as P27 (`checkMapping` in `packages/pantry/src/processing/check.ts`).
 *
 * An expression that names no response declaration is not judged here: an undeclared variable is
 * its own refusal, and this rule refuses only a declared response that lacks what it needs.
 *
 * @param source The document.
 * @param visit The element's visit.
 * @param context The item's declarations and the parents the walk has met.
 * @returns The refusal at the expression's path when its response lacks what it needs; none for any
 *   other element.
 */
const mapResponseRequirements = (
  source: SourceDocument,
  visit: Visit,
  context: Context,
): readonly Refusal[] => {
  const attribute = attributeOf(visit.element, "identifier");
  const expression = Arr.findFirst(Object.keys(mappingNeeds), (local): local is MappingExpression =>
    isQti(visit.element, (name) => name === local),
  );
  if (
    Option.isNone(expression) ||
    Option.isNone(attribute) ||
    !inResponseProcessing(context, visit.element)
  ) {
    return [];
  }

  const needed: Needed = {
    ...mappingNeeds[expression.value],
    identifier: identifierOf(attribute.value),
  };
  const declaration = context.responses.get(needed.identifier);

  return declaration === undefined || provides(declaration, needed)
    ? []
    : [
        refusal(
          source,
          "template-requirements",
          visit.path,
          neededDetail(visit.element.local, needed),
        ),
      ];
};

/**
 * Give an element's `base-type` when the value model holds values of it.
 *
 * A base type the value model does not hold (`duration`, `file`) has no lexical check here (the
 * slice list's 0.11 item 3), so its values are not judged. A `point` is held, so a value that is
 * not two integers is refused, as the qti package refuses it (`value-lexical`, the `point` pattern
 * in `packages/pantry/src/import/refusal.ts`). A missing or out-of-vocabulary `base-type` is the
 * structural validator's.
 *
 * @param element An element with a `base-type`, such as a declaration or a `qti-base-value`.
 * @returns Its base type, none when it is absent or not modelled.
 */
const modelledBaseType = (element: SourceElement): Option.Option<ModelledBaseType> =>
  Option.flatMap(attributeOf(element, "base-type"), (attribute) =>
    isModelled(attribute.value) ? Option.some(attribute.value) : Option.none(),
  );

/**
 * Give the base type a declaration's typed values take, when this rule judges them.
 *
 * A `record` declaration's values are typed field by field, so they are not judged, and neither
 * are values of a base type {@link modelledBaseType} does not give.
 *
 * @param declaration The declaration.
 * @returns Its base type, none when its values are not judged.
 */
const declaredBaseType = (declaration: SourceElement): Option.Option<ModelledBaseType> =>
  Option.exists(
    attributeOf(declaration, "cardinality"),
    (attribute) => attribute.value === "record",
  )
    ? Option.none()
    : modelledBaseType(declaration);

/**
 * Join an element's text children, the content of a `qti-value` or a `qti-base-value`, as the item
 * model joins them.
 *
 * @param element The element.
 * @returns Its text, as written.
 */
const textOf = (element: SourceElement): string =>
  element.children.flatMap((child) => (child.kind === "text" ? [child.text] : [])).join("");

/**
 * Construct the `value-type` refusals of a parse.
 *
 * @param source The document.
 * @param path The path of the element or attribute holding the value.
 * @param parsed The parse of its value.
 * @returns One refusal naming the base type and the text read, or none when the value parses.
 */
const valueRefusals = <A>(
  source: SourceDocument,
  path: string,
  parsed: Result.Result<A, InvalidValue>,
): readonly Refusal[] =>
  Option.toArray(
    Option.map(Result.getFailure(parsed), (failure) =>
      refusal(source, "value-type", path, {
        baseType: failure.baseType,
        lexical: failure.lexical,
      }),
    ),
  );

/**
 * Make a test of an element's QTI local name.
 *
 * @param names The local names that pass.
 * @returns The test.
 */
const named =
  (...names: readonly string[]) =>
  (element: SourceElement): boolean =>
    isQti(element, (local) => names.includes(local));

/**
 * The base-typed attributes reading 7 lists whose XSD type is a string, each with its element and
 * the ancestors that lead to the declaration that types it. The float attributes reading 7 also
 * lists (`mapped-value`, the mappings' bounds and `default-value`, an interpolation entry's
 * `source-value`) are XSD doubles, which the structural validator's `attribute-type` checks.
 */
const typedAttributes = [
  // Reading 7: "`map-key` of a map entry", under its response declaration's base type.
  {
    attribute: "map-key",
    element: "qti-map-entry",
    steps: [named("qti-mapping"), named("qti-response-declaration")],
  },
  // Reading 7: "a match table's and an interpolation table's `default-value`", under the outcome's.
  {
    attribute: "default-value",
    element: "qti-match-table",
    steps: [named("qti-outcome-declaration")],
  },
  {
    attribute: "default-value",
    element: "qti-interpolation-table",
    steps: [named("qti-outcome-declaration")],
  },
  // Reading 7: "their entries' `target-value`"; reading 8: a match table entry's `target-value` is a
  // value of the outcome's base type, not a base-type name.
  {
    attribute: "target-value",
    element: "qti-match-table-entry",
    steps: [named("qti-match-table"), named("qti-outcome-declaration")],
  },
  {
    attribute: "target-value",
    element: "qti-interpolation-table-entry",
    steps: [named("qti-interpolation-table"), named("qti-outcome-declaration")],
  },
] as const;

/**
 * Apply `value-type` to the base-typed attributes of one element.
 *
 * Reading 7: such an attribute's value is exact, and outer whitespace around a typed value makes it
 * invalid. That padding is the structural validator's `padded-attribute`, so for a base type other
 * than `string` the value is read here with its outer whitespace removed, and a padded value gives
 * one refusal, not two. For `string` the whitespace is part of the value and is kept.
 *
 * @param source The document.
 * @param visit The element's visit.
 * @param context The parents the walk has met.
 * @returns The refusal at each attribute's path whose value is outside its base type.
 */
const attributeValueType = (
  source: SourceDocument,
  visit: Visit,
  context: Context,
): readonly Refusal[] =>
  typedAttributes.flatMap((typed) => {
    if (!isQti(visit.element, (local) => local === typed.element)) {
      return [];
    }

    const attribute = attributeOf(visit.element, typed.attribute);
    const baseType = Option.flatMap(
      enclosing(context, visit.element, typed.steps),
      declaredBaseType,
    );
    if (Option.isNone(attribute) || Option.isNone(baseType)) {
      return [];
    }

    const written = attribute.value.value;
    const lexical = baseType.value === "string" ? written : trimXmlSpace(written);

    return valueRefusals(
      source,
      attributePath(visit.path, attribute.value),
      parseLexical(baseType.value, lexical),
    );
  });

/**
 * Give the base type an element's text is read in, when its text is a typed value this rule
 * judges: a `qti-base-value`'s own `base-type`, or the declaration's for a `qti-value` in a
 * declaration's `qti-correct-response` or `qti-default-value`.
 *
 * @param visit The element's visit.
 * @param context The parents the walk has met.
 * @returns The base type, none for any other element and for a value this rule does not judge.
 */
const textBaseType = (visit: Visit, context: Context): Option.Option<ModelledBaseType> => {
  if (isQti(visit.element, (local) => local === "qti-base-value")) {
    return modelledBaseType(visit.element);
  }

  if (!isQti(visit.element, (local) => local === "qti-value")) {
    return Option.none();
  }

  return Option.flatMap(
    enclosing(context, visit.element, [
      named("qti-correct-response", "qti-default-value"),
      isDeclaration,
    ]),
    declaredBaseType,
  );
};

/**
 * Apply `value-type` to an element whose text is a typed value.
 *
 * Reading 1 and the value model's lexical spaces (research `ea422814` §3): a `qti-value` in a
 * declaration's `qti-correct-response` or `qti-default-value` parses under the declaration's base
 * type, and a `qti-base-value` under its own `base-type`, after reading 7's trim of element text,
 * which the value model's `parseElementText` applies. A boolean is `true` or `false` (reading 34).
 *
 * @param source The document.
 * @param visit The element's visit.
 * @param context The parents the walk has met.
 * @returns The refusal at the element's path when its text is outside its base type; none for any
 *   other element and for a value whose base type is not judged.
 */
const textValueType = (
  source: SourceDocument,
  visit: Visit,
  context: Context,
): readonly Refusal[] =>
  Option.match(textBaseType(visit, context), {
    onNone: () => [],
    onSome: (baseType) =>
      valueRefusals(source, visit.path, parseElementText(baseType, textOf(visit.element))),
  });

/**
 * The built-in variables an item's response processing may read, with their types.
 *
 * `numAttempts`, `duration` and `completionStatus` are the item's (reading 29: in an item
 * `duration` is a single float, seconds). `QTI_CONTEXT` is the built-in context variable, a record,
 * which has no base type of its own: "any references within an item or an assessment to the
 * QTI_CONTEXT variable [...] must succeed" (`info-compact.txt:8456`).
 *
 * `duration` is typed here in every item, so a read of it types the same whether the item is time
 * dependent or not; an item that is not may not read it at all, which {@link untimedDuration}
 * decides.
 */
const builtIns: ReadonlyMap<string, ExpressionType> = new Map<string, ExpressionType>([
  ["completionStatus", singleOf("identifier")],
  ["duration", singleOf("float")],
  ["numAttempts", singleOf("integer")],
  ["QTI_CONTEXT", { baseType: "unknown", cardinality: "record" }],
]);

/**
 * Report whether a name, which no declaration answers, reads the built-in `duration` of an item
 * that is not time dependent: "The value of duration for items that are not time dependent must
 * not be used in any item or test-level expression" (`info-compact.txt:8472`). The qti package
 * refuses the same as `item-duration` (S-R49, `untimedDuration` in
 * `packages/pantry/src/processing/check.ts`).
 *
 * The root's `time-dependent` is read as `xs:boolean`. One that is absent or outside
 * `xs:boolean` is the structural validator's refusal, so the item is not judged untimed here. A
 * root other than a `qti-assessment-item` has no item `duration` of its own: a test reaches an
 * item's through an item ref, which is not judged here.
 *
 * @param source The document whose root the name is read in.
 * @param identifier The name, which the caller has found no declaration of.
 * @returns Whether the name is `duration` and the root is an item whose `time-dependent` is false.
 */
const untimedDuration = (source: SourceDocument, identifier: string): boolean =>
  identifier === "duration" &&
  isQti(source.root, (local) => local === "qti-assessment-item") &&
  Option.exists(
    Option.flatMap(attributeOf(source.root, "time-dependent"), (attribute) =>
      xsBooleanOf(attribute.value),
    ),
    (timeDependent) => !timeDependent,
  );

/**
 * The kind of variable an element's `identifier` must name: a response, an outcome, or any
 * variable.
 */
type Expected = "outcome" | "response" | "variable";

/**
 * The rules of inline response processing whose `identifier` names the variable they set, and the
 * kind each must name: `qti-set-outcome-value` sets an outcome variable (`info-compact.txt:11770`),
 * and so does `qti-lookup-outcome-value`, whose `identifier` is "The identifier of the outcome
 * variable to be set" (`:10775`).
 *
 * An expression names its variable through its kind's declaration facet in the registry instead
 * ({@link namingOf}).
 */
const referencing: ReadonlyMap<string, Expected> = new Map<string, Expected>([
  ["qti-lookup-outcome-value", "outcome"],
  ["qti-set-outcome-value", "outcome"],
]);

/**
 * The built-in variables each kind of reference may name.
 *
 * Response processing sets `completionStatus` like an outcome, and reads every built-in.
 */
const builtInsNamed = {
  outcome: ["completionStatus"],
  response: [],
  variable: [...builtIns.keys()],
} as const satisfies Record<Expected, readonly string[]>;

/**
 * The rules that may set a built-in variable: only `qti-set-outcome-value`, which sets
 * `completionStatus`. That variable changes only "by a setOutcomeValue rule in responseProcessing"
 * (`info.txt:8488`), and the qti package's `BuiltInRefKind` admits a built-in as a rule's target
 * only there (`packages/pantry/src/schema/processing.ts:622-627`, P9), so a
 * `qti-lookup-outcome-value` that targets it is refused.
 */
const builtInSetters: ReadonlySet<string> = new Set(["qti-set-outcome-value"]);

/**
 * An element's `identifier`, read as a reference to a variable of the kind the element names.
 */
interface Reference {
  readonly expected: Expected;
  readonly identifier: string;
}

/**
 * Give the expression kind an element is: a QTI element named `qti-` and one of the registry's
 * kinds.
 *
 * @param element The element.
 * @returns Its kind, none for any other element.
 */
const kindOf = (element: SourceElement): Option.Option<ExpressionKind> =>
  element.namespace === qtiNamespace && element.local.startsWith("qti-")
    ? Arr.findFirst(expressionKinds, (kind) => `qti-${kind}` === element.local)
    : Option.none();

/**
 * Give the attribute through which an element names a variable, and the kind of variable it must
 * name: a rule of {@link referencing}, or an expression whose kind's rule declares a declaration
 * facet (`qti-variable` and `qti-default` name any variable; `qti-correct`, `qti-map-response` and
 * `qti-map-response-point` a response). So a family that lands a kind with the facet has its
 * identifier checked here with no edit to this module.
 *
 * "This expression looks up the value of an item variable that has been declared in a
 * corresponding variable declaration or is one of the built-in variables" (`qti-variable`,
 * `info-compact.txt:9286`); `qti-correct`, `qti-map-response` and `qti-map-response-point` read a
 * response variable (`:11418`, `:11438`, `:11437`).
 *
 * @param element The element.
 * @returns The naming attribute and the kind expected, none for an element that names no variable.
 */
const namingOf = (
  element: SourceElement,
): Option.Option<{ readonly attribute: string; readonly expected: Expected }> => {
  const expected = referencing.get(element.local);
  if (element.namespace !== qtiNamespace) {
    return Option.none();
  }

  return expected === undefined
    ? Option.flatMap(kindOf(element), (kind) => Option.fromUndefinedOr(kindRules[kind].declaration))
    : Option.some({ attribute: "identifier", expected });
};

/**
 * Read the variable reference of an element that names one.
 *
 * @param element The element.
 * @returns Its reference, none for an element that names no variable and for one with no
 *   `identifier`, which is the structural validator's `missing-attribute`.
 */
const referenceOf = (element: SourceElement): Option.Option<Reference> =>
  Option.flatMap(namingOf(element), ({ attribute, expected }) =>
    Option.map(attributeOf(element, attribute), (written) => ({
      expected,
      identifier: identifierOf(written),
    })),
  );

/**
 * Give the value of an attribute when it is one of a vocabulary's, as written.
 *
 * @param element The element.
 * @param local The attribute's local name.
 * @param vocabulary The values the attribute may hold.
 * @returns The value, none when the attribute is absent or outside the vocabulary.
 */
const vocabularyValue = <A extends string>(
  element: SourceElement,
  local: string,
  vocabulary: readonly A[],
): Option.Option<A> =>
  Option.flatMap(attributeOf(element, local), (attribute) =>
    Arr.findFirst(vocabulary, (value) => value === attribute.value),
  );

/**
 * Give the type a declaration declares.
 *
 * A declaration whose `cardinality` is absent or outside the vocabulary, or whose `base-type` is
 * outside it, is the structural validator's refusal, so its type is not judged here. A declaration
 * with no `base-type` (a `record`) has no base type of its own, `unknown`.
 *
 * @param declaration The declaration.
 * @returns Its type, none when it is not judged.
 */
const declarationType = (declaration: SourceElement): Option.Option<ExpressionType> => {
  const baseType = vocabularyValue(declaration, "base-type", baseTypes);
  if (Option.isSome(attributeOf(declaration, "base-type")) && Option.isNone(baseType)) {
    return Option.none();
  }

  return Option.map(vocabularyValue(declaration, "cardinality", cardinalities), (cardinality) => ({
    baseType: Option.getOrElse(baseType, (): ExpressionType["baseType"] => "unknown"),
    cardinality,
  }));
};

/**
 * Give the item's declarations a reference of a kind may name.
 *
 * @param expected The kind of variable the reference must name.
 * @param context The item's declarations.
 * @returns The outcome or the response declarations, or every declaration a `qti-variable` may
 *   read, by identifier.
 */
const declarationsNamable = (
  expected: Expected,
  context: Context,
): ReadonlyMap<string, SourceElement> =>
  ({ outcome: context.outcomes, response: context.responses, variable: context.variables })[
    expected
  ];

/**
 * Find the variable a reference names, and its type.
 *
 * A declaration of the expected kind wins over a built-in of the same name. Identifiers compare
 * exactly, so one that holds `.` names the declaration of that exact identifier (reading 37); a
 * prefixed reference (`ITEMREF.VAR`, reading 4) belongs to a test's processing.
 *
 * @param reference The reference.
 * @param context The item's declarations.
 * @returns The variable's type, itself none when its declaration's type is not judged; none when
 *   no variable of the expected kind has the identifier.
 */
const variableType = (
  reference: Reference,
  context: Context,
): Option.Option<Option.Option<ExpressionType>> => {
  const declaration = declarationsNamable(reference.expected, context).get(reference.identifier);
  if (declaration !== undefined) {
    return Option.some(declarationType(declaration));
  }

  const namable: readonly string[] = builtInsNamed[reference.expected];

  return namable.includes(reference.identifier)
    ? Option.some(Option.fromUndefinedOr(builtIns.get(reference.identifier)))
    : Option.none();
};

/**
 * Apply `undeclared-variable` to an element of inline response processing that names a variable
 * ({@link namingOf}).
 *
 * An expression whose kind's rule declares a declaration facet names a variable of the kind the
 * facet expects: `qti-variable` a response, outcome, template or context declaration of the item,
 * or a built-in variable (`info-compact.txt:9286`); `qti-correct`, `qti-map-response` and
 * `qti-map-response-point` a response declaration. `qti-set-outcome-value` and
 * `qti-lookup-outcome-value` name an outcome declaration or `completionStatus`. Template processing
 * is not checked here. The qti package refuses each as P8 (`reference` and `target` in
 * `packages/pantry/src/processing/check.ts`). A reference attribute that names no variable is
 * {@link attributeReferences}' refusal.
 *
 * One that reads the built-in `duration`, which no declaration of the expected kind answers, in an
 * item that is not time dependent is refused too, with `check: "untimed-duration"`
 * ({@link untimedDuration}, pantry's `item-duration`). A declaration named `duration` is read
 * instead, timed or not, as the qti package's `reference` reads the declaration first. A rule
 * other than {@link builtInSetters} that targets a built-in no declaration answers, a
 * `qti-lookup-outcome-value` of `completionStatus`, is refused with `check: "built-in-target"`
 * and the information model's line as `source` (pantry's P9).
 *
 * @param source The document.
 * @param visit The element's visit.
 * @param context The item's declarations and the parents the walk has met.
 * @returns The refusal at the element's path when it names no variable of the kind it must, or the
 *   `duration` an item that is not time dependent does not have; none for any other element and
 *   for one outside response processing.
 */
const undeclaredVariable = (
  source: SourceDocument,
  visit: Visit,
  context: Context,
): readonly Refusal[] => {
  const reference = referenceOf(visit.element);
  if (Option.isNone(reference) || !inResponseProcessing(context, visit.element)) {
    return [];
  }

  const { expected, identifier } = reference.value;
  if (Option.isNone(variableType(reference.value, context))) {
    return [
      refusal(source, "undeclared-variable", visit.path, {
        element: visit.element.local,
        expected,
        identifier,
      }),
    ];
  }

  const builtIn = !declarationsNamable(expected, context).has(identifier);
  if (builtIn && referencing.has(visit.element.local) && !builtInSetters.has(visit.element.local)) {
    return [
      refusal(source, "undeclared-variable", visit.path, {
        check: "built-in-target",
        element: visit.element.local,
        identifier,
        source: "info.txt:8488",
      }),
    ];
  }

  return builtIn && untimedDuration(source, identifier)
    ? [
        refusal(source, "undeclared-variable", visit.path, {
          check: "untimed-duration",
          element: visit.element.local,
          identifier,
        }),
      ]
    : [];
};

/**
 * Give the child elements of an element, in document order: an expression's operands.
 *
 * @param element The element.
 * @returns Its child elements.
 */
const operandsOf = (element: SourceElement): readonly SourceElement[] =>
  element.children.flatMap((child) => (child.kind === "element" ? [child] : []));

/**
 * Give the one expression an element holds, its only child element.
 *
 * @param element A `qti-set-outcome-value` or a `qti-lookup-outcome-value`.
 * @returns Its expression, none when it holds no child element or more than one.
 */
const operandOf = (element: SourceElement): Option.Option<SourceElement> => {
  const operands = operandsOf(element);

  return operands.length === 1 ? Arr.head(operands) : Option.none();
};

/**
 * Give the attributes an expression's type depends on, as its kind's rule reads them
 * (`ResultAttributes` in `#plate/model/expression.ts`): the expression's own `base-type`
 * (`qti-base-value`'s) and operator `name` (`qti-math-operator`'s and `qti-stats-operator`'s), and,
 * for a kind whose rule declares a declaration facet, the type of the declaration it names
 * ({@link variableType}).
 *
 * A `base-type` outside the vocabulary is the structural validator's refusal and is not filled
 * in, nor is the type of a declaration that is not judged, so the rule reads either as unknown.
 *
 * @param expression The expression.
 * @param rule Its kind's rule.
 * @param context The item's declarations.
 * @returns The attributes, none when the kind's declaration facet names no variable of the kind it
 *   expects, which leaves the expression untyped.
 */
const resultAttributes = (
  expression: SourceElement,
  rule: KindRule,
  context: Context,
): Option.Option<ResultAttributes> => {
  const own: ResultAttributes = {
    ...Option.match(vocabularyValue(expression, "base-type", baseTypes), {
      onNone: () => ({}),
      onSome: (baseType) => ({ baseType }),
    }),
    ...Option.match(attributeOf(expression, "name"), {
      onNone: () => ({}),
      onSome: (name) => ({ name: name.value }),
    }),
  };
  if (rule.declaration === undefined) {
    return Option.some(own);
  }

  return Option.map(
    Option.flatMap(referenceOf(expression), (reference) => variableType(reference, context)),
    (declared) =>
      Option.match(declared, {
        onNone: () => own,
        onSome: ({ baseType, cardinality }) => ({ ...own, baseType, cardinality }),
      }),
  );
};

/**
 * Give the type of an expression through its kind's rule in the registry (`kindRules` in
 * `#plate/model/expressions/read.ts`): the rule's `resultType` over its operands' types, typed the
 * same way, and its {@link resultAttributes}. The qti package types expressions alike
 * (`resultType` in `packages/pantry/src/processing/types.ts`).
 *
 * An expression is untyped (none) when its element is no expression kind, when its kind's rule is
 * the unlanded rule, when any of its operands is untyped, or when its declaration facet names no
 * variable (ruling R3). Untyped is not judged, so a processing that holds a kind its family has
 * not landed is accepted untyped, and the qti package's typing of that kind returns family by
 * family as each lands (spec Q15, ruled B). Untyped is not a landed kind's `unknown` or `any`,
 * which pass up as the qti package passes them and satisfy every rule.
 *
 * Each type is kept in the context, so an expression is typed once however many of its ancestors
 * judge their operands.
 *
 * @param expression The expression.
 * @param context The item's declarations and the types worked out so far.
 * @returns Its type, none when it is untyped.
 */
const expressionType = (
  expression: SourceElement,
  context: Context,
): Option.Option<ExpressionType> => {
  const known = context.types.get(expression);
  if (known !== undefined) {
    return known;
  }

  const type = Option.flatMap(kindOf(expression), (kind) => {
    const rule: KindRule = kindRules[kind];
    if (isUnlanded(rule)) {
      return Option.none();
    }

    return Option.flatMap(
      Option.all(operandsOf(expression).map((operand) => expressionType(operand, context))),
      (operands) =>
        Option.map(resultAttributes(expression, rule, context), (attributes) =>
          rule.resultType(operands, attributes),
        ),
    );
  });
  context.types.set(expression, type);

  return type;
};

/**
 * The type an untyped operand is judged as: unknown, which satisfies every operand rule, so a
 * typed sibling is still judged (ruling R3).
 */
const untyped: ExpressionType = { baseType: "unknown", cardinality: "unknown" };

/**
 * Spell a type's base type for a refusal's detail.
 *
 * @param type The type.
 * @returns Its base type, empty for one with no base type of its own (`unknown`, or `any`).
 */
const baseTypeText = (type: ExpressionType): string =>
  type.baseType === "any" || type.baseType === "unknown" ? "" : type.baseType;

/**
 * Report whether two types agree, as the qti package's `compatible` compares them
 * (`packages/pantry/src/processing/check.ts`): the same base type unless either has none of its
 * own (`any` or `unknown`), and the same cardinality unless either is `unknown`.
 *
 * @param one A type.
 * @param other Another.
 * @returns Whether they agree.
 */
const agree = (one: ExpressionType, other: ExpressionType): boolean =>
  (one.baseType === other.baseType ||
    [one.baseType, other.baseType].some(
      (baseType) => baseType === "any" || baseType === "unknown",
    )) &&
  (one.cardinality === other.cardinality ||
    one.cardinality === "unknown" ||
    other.cardinality === "unknown");

/**
 * Apply `expression-type` to a `qti-set-outcome-value` of inline response processing.
 *
 * "Floating point values can not be assigned to integer variables and vice-versa"
 * (`info-compact.txt:11770`): the expression's base type and cardinality are the outcome's ({@link
 * agree}). A type with no base type (a `record`) compares by cardinality alone. An outcome or an
 * expression that is not typed is not judged. The qti package refuses the same as P20 (`typeRule`
 * in `packages/pantry/src/processing/check.ts`).
 *
 * @param source The document.
 * @param visit The element's visit.
 * @param context The item's declarations and the parents the walk has met.
 * @returns The refusal at the `qti-set-outcome-value`'s path when its expression's type is not its
 *   outcome's; none for any other element.
 */
const setOutcomeType = (
  source: SourceDocument,
  visit: Visit,
  context: Context,
): readonly Refusal[] => {
  if (
    !isQti(visit.element, (local) => local === "qti-set-outcome-value") ||
    !inResponseProcessing(context, visit.element)
  ) {
    return [];
  }

  const reference = referenceOf(visit.element);
  if (Option.isNone(reference)) {
    return [];
  }

  const outcome = Option.flatten(variableType(reference.value, context));
  const expression = Option.flatMap(operandOf(visit.element), (operand) =>
    expressionType(operand, context),
  );
  if (Option.isNone(outcome) || Option.isNone(expression)) {
    return [];
  }

  return agree(expression.value, outcome.value)
    ? []
    : [
        refusal(source, "expression-type", visit.path, {
          element: visit.element.local,
          expressionBaseType: baseTypeText(expression.value),
          expressionCardinality: expression.value.cardinality,
          identifier: reference.value.identifier,
          outcomeBaseType: baseTypeText(outcome.value),
          outcomeCardinality: outcome.value.cardinality,
        }),
      ];
};

/**
 * The local names of the response rules whose first child is a condition.
 */
const conditionBranches: ReadonlySet<string> = new Set(["qti-response-else-if", "qti-response-if"]);

/**
 * The type every condition has.
 */
const singleBoolean: ExpressionType = { baseType: "boolean", cardinality: "single" };

/**
 * Apply `expression-type` to the condition of a `qti-response-if` or `qti-response-else-if` of
 * inline response processing.
 *
 * "A responseIf part consists of an expression which must have an effective base-type of boolean
 * and single cardinality" (`info-compact.txt:10963`), and a `qti-response-else-if` part likewise
 * (`info-compact.txt:10945`): the branch's first child element, its condition, is a single
 * `boolean` ({@link agree}). A condition that is untyped ({@link expressionType}) is not judged,
 * and one of base type `any` or `unknown` passes, as a `qti-null` does. The qti package refuses the
 * same as P21 (`typeRule` and `conditionKinds` in `packages/pantry/src/processing/check.ts`).
 *
 * @param source The document.
 * @param visit The element's visit.
 * @param context The item's declarations and the parents the walk has met.
 * @returns The refusal at the branch's path, with `check: "condition"` and the condition's type,
 *   when its condition is not a single `boolean`; none for any other element.
 */
const conditionType = (
  source: SourceDocument,
  visit: Visit,
  context: Context,
): readonly Refusal[] => {
  if (
    !isQti(visit.element, (local) => conditionBranches.has(local)) ||
    !inResponseProcessing(context, visit.element)
  ) {
    return [];
  }

  const condition = Option.flatMap(Arr.head(operandsOf(visit.element)), (expression) =>
    expressionType(expression, context),
  );
  if (Option.isNone(condition) || agree(condition.value, singleBoolean)) {
    return [];
  }

  return [
    refusal(source, "expression-type", visit.path, {
      check: "condition",
      element: visit.element.local,
      expressionBaseType: baseTypeText(condition.value),
      expressionCardinality: condition.value.cardinality,
    }),
  ];
};

/**
 * The base types a lookup operand may have under each lookup table (reading 28).
 */
const lookupOperands = {
  "qti-interpolation-table": ["integer", "float", "duration"],
  "qti-match-table": ["integer"],
} as const satisfies Record<string, readonly BaseType[]>;

/**
 * The local name of a lookup table.
 */
type LookupTable = keyof typeof lookupOperands;

/**
 * Give the lookup table an outcome declaration holds.
 *
 * @param declaration The outcome declaration.
 * @returns The table's local name, none when the declaration holds neither table.
 */
const lookupTableOf = (declaration: SourceElement): Option.Option<LookupTable> =>
  Arr.findFirst(
    declaration.children.flatMap((child) =>
      child.kind === "element" && child.namespace === qtiNamespace ? [child.local] : [],
    ),
    (local): local is LookupTable => Object.hasOwn(lookupOperands, local),
  );

/**
 * Apply `template-requirements` to a `qti-lookup-outcome-value` of inline response processing: the
 * outcome it names is declared with a lookup table, as the lookup "sets the value of an outcome
 * variable to the value obtained by looking up the value of the associated expression in the
 * lookupTable associated with the outcome's declaration" (the information model,
 * `info-compact.txt:10774`).
 *
 * A lookup that names no outcome declaration is not judged here: an undeclared variable is its own
 * refusal, and this rule refuses only a declared outcome that holds neither a `qti-match-table` nor
 * a `qti-interpolation-table`. The detail has {@link neededDetail}'s keys, with both tables in
 * `child`.
 *
 * @param source The document.
 * @param visit The element's visit.
 * @param context The item's declarations and the parents the walk has met.
 * @returns The refusal at the `qti-lookup-outcome-value`'s path when its outcome holds no lookup
 *   table; none for any other element.
 */
const lookupTableRequirements = (
  source: SourceDocument,
  visit: Visit,
  context: Context,
): readonly Refusal[] => {
  const attribute = attributeOf(visit.element, "identifier");
  if (
    !isQti(visit.element, (local) => local === "qti-lookup-outcome-value") ||
    Option.isNone(attribute) ||
    !inResponseProcessing(context, visit.element)
  ) {
    return [];
  }

  const identifier = identifierOf(attribute.value);
  const declaration = context.outcomes.get(identifier);

  return declaration === undefined || Option.isSome(lookupTableOf(declaration))
    ? []
    : [
        refusal(source, "template-requirements", visit.path, {
          child: "qti-match-table or qti-interpolation-table",
          declaration: "qti-outcome-declaration",
          element: visit.element.local,
          identifier,
        }),
      ];
};

/**
 * Apply `expression-type` to a `qti-lookup-outcome-value`'s operand (reading 28).
 *
 * The operand is a single integer, float or duration, and an integer when the outcome holds a
 * `qti-match-table` (operator ruling `96840ced`, Q15 B: refused although plate's engine never runs
 * a lookup yet). An operand that is untyped ({@link expressionType}) is accepted. An outcome that
 * is undeclared or holds no lookup table is not judged here: they are `undeclared-variable`'s
 * refusal and {@link lookupTableRequirements}'s. The qti package refuses the same as P22
 * (`checkLookup` in `packages/pantry/src/processing/check.ts`).
 *
 * @param source The document.
 * @param visit The element's visit.
 * @param context The item's declarations and the parents the walk has met.
 * @returns The refusal at the `qti-lookup-outcome-value`'s path when its operand's type is not one
 *   its table allows; none for any other element.
 */
const lookupOperandType = (
  source: SourceDocument,
  visit: Visit,
  context: Context,
): readonly Refusal[] => {
  const attribute = attributeOf(visit.element, "identifier");
  if (
    !isQti(visit.element, (local) => local === "qti-lookup-outcome-value") ||
    Option.isNone(attribute) ||
    !inResponseProcessing(context, visit.element)
  ) {
    return [];
  }

  const identifier = identifierOf(attribute.value);
  const table = Option.flatMap(
    Option.fromUndefinedOr(context.outcomes.get(identifier)),
    lookupTableOf,
  );
  const operand = Option.flatMap(operandOf(visit.element), (expression) =>
    expressionType(expression, context),
  );
  if (Option.isNone(table) || Option.isNone(operand)) {
    return [];
  }

  return accepts(operand.value, lookupOperands[table.value], ["single"])
    ? []
    : [
        refusal(source, "expression-type", visit.path, {
          element: visit.element.local,
          expressionBaseType: baseTypeText(operand.value),
          expressionCardinality: operand.value.cardinality,
          identifier,
          reading: "28",
          table: table.value,
        }),
      ];
};

/**
 * Apply `expression-type` to the operands of an expression of inline response processing: each
 * operand its kind's rule does not accept (`operandsAccept` in the registry, `kindRules` in
 * `#plate/model/expressions/read.ts`), so the engine never meets an operand its evaluator does not
 * take. The qti package refuses the same as P23 (`operandRules` in
 * `packages/pantry/src/processing/check.ts`).
 *
 * An untyped operand is judged as unknown ({@link untyped}), which every rule accepts, so a typed
 * sibling is still judged (ruling R3). Each refusal is at the expression's path, one per operand
 * the rule gives, with `check: "operand"`: the operand's position among the expression's child
 * elements, from 1, its type, and what the kind accepts there (`acceptsBaseTypes` is `any` for a
 * kind that takes any base type). `qti-equal`, whose operands are single integers or floats
 * (`info-compact.txt:11415`), is refused through comparison's rule.
 *
 * @param source The document.
 * @param visit The element's visit.
 * @param context The item's declarations and the parents the walk has met.
 * @returns One refusal per operand of a type the kind does not accept; none for any other element.
 */
const operandTypes = (source: SourceDocument, visit: Visit, context: Context): readonly Refusal[] =>
  Option.match(kindOf(visit.element), {
    onNone: () => [],
    onSome: (kind) => {
      if (!inResponseProcessing(context, visit.element)) {
        return [];
      }

      const types = operandsOf(visit.element).map((operand) =>
        Option.getOrElse(expressionType(operand, context), () => untyped),
      );

      return kindRules[kind].operandsAccept(types).map((mismatch) => {
        const type = types[mismatch.position - 1] ?? untyped;

        return refusal(source, "expression-type", visit.path, {
          acceptsBaseTypes: mismatch.baseTypes === "any" ? "any" : mismatch.baseTypes.join(" "),
          acceptsCardinalities: mismatch.cardinalities.join(" "),
          check: "operand",
          element: visit.element.local,
          expressionBaseType: baseTypeText(type),
          expressionCardinality: type.cardinality,
          operand: String(mismatch.position),
        });
      });
    },
  });

/**
 * Classify one value of a reference attribute as the literal or the reference it holds, through
 * the classifier of the base type its facet entry names (`#plate/model/expression.ts`), the one the
 * item model's reader uses too. An integer attribute's value is read as `xs:integer` first, so
 * `INF` and `NaN` name variables there (ruling R4); a float's as `xs:double` first; a string's is a
 * reference only when it is a braced name of a variable the item holds (ruling R1).
 */
const classifiers = {
  float: floatOrRefOf,
  integer: integerOrRefOf,
  string: stringOrRefOf,
} as const satisfies Record<
  ReferenceEntry["baseType"],
  (written: string, declared: ReadonlySet<string>) => LiteralOrRef<unknown>
>;

/**
 * Split a reference attribute's value into the values it holds: the tokens of a list, which XML
 * whitespace separates, or the one value as written.
 *
 * @param written The attribute's value.
 * @param entry The attribute's facet entry.
 * @returns Each value, as written.
 */
const valuesOf = (written: string, entry: ReferenceEntry): readonly string[] =>
  entry.list ? written.split(/[\t\n\r ]+/u).filter((token) => token !== "") : [written];

/**
 * Apply `undeclared-variable` and `expression-type` to the variables an expression's reference
 * attributes name, as its kind's reference facet lists them (`references` of its rule in the
 * registry). The qti package refuses the same as P8 and P24 (`checkAttributeReference` in
 * `packages/pantry/src/processing/check.ts`).
 *
 * Each value of a checked entry's attribute goes through its classifier ({@link classifiers}); a
 * literal names no variable. A reference that no declaration of the item names and no built-in
 * answers is `undeclared-variable`, with the `attribute` (P8). One that names a variable other than
 * a single template or outcome variable of the entry's base type ({@link agree}) is
 * `expression-type` with `check: "reference"` (P24): a response, a context variable, a built-in,
 * or a template or outcome variable of another type. An entry that is not checked, `qti-equal`'s
 * `tolerance`, never refuses, and neither does a declaration whose own type is not judged. A
 * reference whose text is no NCName lies outside both members of the attribute's union, which is
 * the structural validator's refusal, so it is passed over here.
 *
 * A reference to the built-in `duration`, which no declaration answers, in an item that is not time
 * dependent is also `undeclared-variable`, with `check: "untimed-duration"` and the `attribute`
 * ({@link untimedDuration}, pantry's `item-duration`), before its P24: the qti package refuses
 * both, `item-duration` first. In a time-dependent item it is P24 alone.
 *
 * It reads only the facet entries it is given, so it judges any kind whose rule declares them.
 *
 * @param source The document.
 * @param visit The expression's visit.
 * @param references The reference facet of the expression's kind.
 * @param declarations Every declaration of the item, by identifier.
 * @returns The refusals at the expression's path, one per value that names no variable or one of
 *   another kind or type, and one more for each that names the `duration` an item that is not time
 *   dependent does not have.
 */
export const referenceRefusals = (
  source: SourceDocument,
  visit: Visit,
  references: readonly ReferenceEntry[],
  declarations: ReadonlyMap<string, SourceElement>,
): readonly Refusal[] =>
  references.flatMap((entry) => {
    const written = attributeOf(visit.element, entry.attribute);
    if (!entry.checked || Option.isNone(written)) {
      return [];
    }

    const declared: ReadonlySet<string> = new Set([...declarations.keys(), ...builtIns.keys()]);

    return valuesOf(written.value.value, entry).flatMap((value) => {
      const classified = classifiers[entry.baseType](value, declared);
      if (classified._tag === "literal" || !isNcName(classified.identifier)) {
        return [];
      }

      const { identifier } = classified;
      const declaration = declarations.get(identifier);
      if (declaration === undefined && !builtIns.has(identifier)) {
        return [
          refusal(source, "undeclared-variable", visit.path, {
            attribute: entry.attribute,
            element: visit.element.local,
            expected: "variable",
            identifier,
          }),
        ];
      }

      const fits =
        declaration !== undefined &&
        isQti(
          declaration,
          (local) => local === "qti-template-declaration" || local === "qti-outcome-declaration",
        ) &&
        !Option.exists(
          declarationType(declaration),
          (type) => !agree(type, singleOf(entry.baseType)),
        );

      return [
        ...(declaration === undefined && untimedDuration(source, identifier)
          ? [
              refusal(source, "undeclared-variable", visit.path, {
                attribute: entry.attribute,
                check: "untimed-duration",
                element: visit.element.local,
                identifier,
              }),
            ]
          : []),
        ...(fits
          ? []
          : [
              refusal(source, "expression-type", visit.path, {
                attribute: entry.attribute,
                check: "reference",
                element: visit.element.local,
                expectedBaseType: entry.baseType,
                identifier,
              }),
            ]),
      ];
    });
  });

/**
 * Apply {@link referenceRefusals} to an expression of inline response processing, with its kind's
 * reference facet from the registry.
 *
 * @param source The document.
 * @param visit The element's visit.
 * @param context The item's declarations and the parents the walk has met.
 * @returns The refusals of the variables its reference attributes name; none for any other
 * element.
 */
const attributeReferences = (
  source: SourceDocument,
  visit: Visit,
  context: Context,
): readonly Refusal[] =>
  Option.match(kindOf(visit.element), {
    onNone: () => [],
    onSome: (kind) =>
      inResponseProcessing(context, visit.element)
        ? referenceRefusals(source, visit, kindRules[kind].references, context.variables)
        : [],
  });

/**
 * The declarations whose variables a `qti-variable` may read. Where two share an identifier, the
 * later kind here wins; the duplicate is `duplicate-identifier`'s refusal.
 */
const variableDeclarations = [
  "qti-context-declaration",
  "qti-template-declaration",
  "qti-outcome-declaration",
  "qti-response-declaration",
] as const;

/**
 * List the elements the prose rules judge, in document order: exactly those the structural walk
 * checks, the keys of {@link governingTables}.
 *
 * One admission decides for both stages, so the rules never refuse what the walk does not check,
 * nor skip what it does. An element outside QTI's namespace is not judged, nor anything below it
 * that the walk does not reach, nor an element the walk refuses as unknown. In lax wildcard content
 * (rule `5b8ee08b`) the rules judge what the walk checks there, a global QTI element and what its
 * table admits below it, and not what the walk passes over: a nested QTI root (reading 6) or a QTI
 * element the XSD declares only locally, such as a `qti-choice-interaction` directly inside a
 * `qti-custom-interaction`.
 *
 * @param source The document.
 * @param tables The tables generated from the QTI XSD, the ones the structural walk checks it by.
 * @returns Each element the rules judge, with the path and the parent `walk` gives it.
 */
const judgedVisits = (source: SourceDocument, tables: Tables): readonly Visit[] => {
  const governing = governingTables(source, tables);

  return [...walk(source)].filter((visit) => governing.has(visit.element));
};

/**
 * Report whether a judged element holds an unexpanded entity reference where a rule may read it:
 * in an attribute's value or among its children, wildcard content included.
 *
 * @param element The element.
 * @returns Whether its attributes or its children hold a reference whose value is unknown.
 */
const holdsUnexpanded = (element: SourceElement): boolean =>
  element.attributes.some((attribute) => attribute.references.length > 0) ||
  element.children.some((child) => child.kind === "entity");

/**
 * Collect the responses whose correct response the item's template processing sets.
 *
 * Each `qti-set-correct-response` counts wherever it sits in the root's `qti-template-processing`,
 * among its rules or in a `qti-template-condition`'s branch, because phase 1 does not run template
 * processing and so cannot tell which branch would set it. Only the elements the rules judge count,
 * as everywhere in these rules.
 *
 * @param source The document.
 * @param visits The elements the rules judge, in document order, so each parent comes before its
 *   children.
 * @returns The identifier each such `qti-set-correct-response` names, read as {@link identifierOf}
 *   reads it.
 */
const setCorrectResponses = (
  source: SourceDocument,
  visits: readonly Visit[],
): ReadonlySet<string> => {
  const inTemplateProcessing = new Set<SourceElement>();
  const responses = new Set<string>();
  for (const visit of visits) {
    const entered = Option.exists(visit.parent, (parent) =>
      parent === source.root
        ? isQti(visit.element, (local) => local === "qti-template-processing")
        : inTemplateProcessing.has(parent),
    );
    if (entered) {
      inTemplateProcessing.add(visit.element);

      const identifier = attributeOf(visit.element, "identifier");
      if (
        isQti(visit.element, (local) => local === "qti-set-correct-response") &&
        Option.isSome(identifier)
      ) {
        responses.add(identifierOf(identifier.value));
      }
    }
  }

  return responses;
};

/**
 * Check a document against the prose rules: `undeclared-response`, `duplicate-identifier`,
 * `binding`, `template-requirements`, `value-type`, `undeclared-variable` and `expression-type`,
 * and reading 19's `max-strings` on an Extended Text bound to a container. `template-requirements`
 * judges the declarations a standard template, an inline `qti-map-response` or
 * `qti-map-response-point` and a `qti-lookup-outcome-value` need. `undeclared-variable` judges the
 * variable a rule or an expression names, through its kind's declaration facet in the registry,
 * and the variables its reference attributes name, through its kind's reference facet, and refuses
 * a read of the built-in `duration` in an item whose `time-dependent` is false.
 * `expression-type` judges what a `qti-set-outcome-value` sets, a lookup's operand, every
 * expression's operands by its kind's rule, and the variables its reference attributes name. Each
 * expression is typed through its kind's rule in the registry (`kindRules` in
 * `#plate/model/expressions/read.ts`), and one whose kind's family has not landed is untyped and
 * not judged.
 *
 * The rules judge exactly what the structural walk checks, and only an item they can read whole:
 *
 * - A root other than a QTI `qti-assessment-item` gives no refusal. Every rule reads an item's
 *   declarations, and phase 1 leaves any other root `unchecked` (spec §4.5).
 * - A document whose judged elements hold an unexpanded entity reference anywhere gives no refusal.
 *   The rules read identifiers across elements, so one reference whose value is unknown changes
 *   what another element's rule finds: `identifier="&id;"` on a declaration would make every
 *   `qti-variable` naming that identifier look undeclared. Such a document is `unchecked` unless
 *   the structural walk refuses it.
 * - Only the elements the structural walk checks are visited, the keys of {@link governingTables} for
 *   the same tables. An element outside QTI's namespace is not, nor is an element the walk refuses
 *   as unknown. In lax wildcard content the rules judge the elements the walk checks there as they
 *   judge them anywhere else (reading 57): an interaction there binds a declared response, its
 *   identifiers count toward `duplicate-identifier`, and an unexpanded entity reference among a
 *   checked element's children leaves the document to the verdict's `unchecked`.
 *
 * Every refusal is located at an element or attribute path and returned in document order; the
 * check never stops at the first. An empty list means no prose rule this module implements refuses
 * the document, not that the document is valid: the structural validator judges the XSD's rules.
 *
 * @param source The document to check.
 * @param tables The tables generated from the QTI XSD, the ones `checkStructure` checks the
 *   document by.
 * @returns The refusals, empty when every rule holds or the document is one the rules do not judge.
 * @see {@link Refusal} for what each refusal carries.
 */
export const checkRules = (source: SourceDocument, tables: Tables): readonly Refusal[] => {
  if (!isQti(source.root, (local) => local === "qti-assessment-item")) {
    return [];
  }

  const visits = judgedVisits(source, tables);
  if (visits.some((visit) => holdsUnexpanded(visit.element))) {
    return [];
  }

  const context: Context = {
    outcomes: declarationsOf(source, "qti-outcome-declaration"),
    parents: new Map(),
    responses: declarationsOf(source, "qti-response-declaration"),
    setCorrectResponses: setCorrectResponses(source, visits),
    types: new Map(),
    variables: new Map(variableDeclarations.flatMap((kind) => [...declarationsOf(source, kind)])),
  };
  const seen = new Map<SourceElement, Set<string>>();
  const refusals: Refusal[] = [];
  for (const visit of visits) {
    if (Option.isSome(visit.parent)) {
      context.parents.set(visit.element, visit.parent.value);
    }

    refusals.push(
      ...duplicateIdentifier(source, visit, seen),
      ...responseRules(source, visit, context.responses),
      ...templateRequirements(source, visit, context),
      ...mapResponseRequirements(source, visit, context),
      ...attributeValueType(source, visit, context),
      ...textValueType(source, visit, context),
      ...undeclaredVariable(source, visit, context),
      ...attributeReferences(source, visit, context),
      ...setOutcomeType(source, visit, context),
      ...conditionType(source, visit, context),
      ...lookupTableRequirements(source, visit, context),
      ...lookupOperandType(source, visit, context),
      ...operandTypes(source, visit, context),
    );
  }

  return refusals;
};

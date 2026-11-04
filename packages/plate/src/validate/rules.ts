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
import { Array as Arr, Effect, Option, Result } from "effect";
import { attributePath, qtiNamespace, walk } from "#plate/document/source.ts";
import type {
  SourceAttribute,
  SourceDocument,
  SourceElement,
  Visit,
} from "#plate/document/source.ts";
import { isModelled, parseElementText, parseLexical } from "#plate/model/values.ts";
import type { InvalidValue, ModelledBaseType } from "#plate/model/values.ts";
import { Refusal } from "#plate/validate/refusal.ts";
import type { RefusalRule } from "#plate/validate/refusal.ts";
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
 * The binding each phase-1 interaction's information-model class requires, quoted from QTI 3.0's
 * information model.
 *
 * This is what QTI allows, not what phase 1 renders: a Text Entry bound to `record` or an Extended
 * Text bound to `multiple` is valid and becomes a notice (`renders` in the vocabulary), so it is
 * not refused here. Other interactions' bindings are not checked in phase 1.
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
  // "The qti-text-entry-interaction must be bound to a response variable with either single or
  // record cardinality only. For single cardinality the base-type must be one of string, integer or
  // float." (info.txt:8826)
  "qti-text-entry-interaction": {
    baseTypes: ["string", "integer", "float"],
    cardinalities: ["single", "record"],
  },
} as const satisfies Record<InteractionName, Requirement>;

/**
 * The XML whitespace at either end of an attribute value: space, tab, carriage return and line
 * feed.
 */
const outerWhitespace = /^[\t\n\r ]+|[\t\n\r ]+$/gu;

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
const identifierOf = (attribute: SourceAttribute): string =>
  attribute.value.replaceAll(outerWhitespace, "");

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
 * Find which phase-1 interaction an element is, the three whose binding these rules check.
 *
 * @param element The element.
 * @returns Its QTI name, or none for any other element.
 */
const phaseOneInteraction = (element: SourceElement): Option.Option<InteractionName> =>
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
 * Find the scope in which an element's `identifier` must be unique, if it has one.
 *
 * The item's declarations share one scope, the root: "All item variables declared in an item share
 * the same namespace" (info.txt:12006). A Choice's simple choices share another, the interaction:
 * the identifier of a simple choice "must not be used by any other choice" (info.txt:42411). The
 * same sentence goes on to forbid a choice identifier equal to an item variable's, which this
 * phase does not refuse.
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
        (isQti(parent, (local) => local === "qti-choice-interaction") &&
          isQti(visit.element, (local) => local === "qti-simple-choice")),
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
 * Apply `binding` and reading 19 to a phase-1 interaction and the declaration it names.
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
 * @param name Which phase-1 interaction it is.
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

  return Option.match(phaseOneInteraction(visit.element), {
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
   * Each element the walk has reached, but the root, with its parent.
   */
  readonly parents: Map<SourceElement, SourceElement>;
  readonly responses: ReadonlyMap<string, SourceElement>;
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
 */
const templateNeeds = {
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
 * resolves it, so a `CC2_*` or other template is not judged. "If both embedded rules and a template
 * reference are supplied then the internal rules take precedence" (the information model), so a
 * template beside inline rules never runs and is not judged either; the inline rules are.
 *
 * @param source The document.
 * @param visit The element's visit.
 * @param context The item's declarations.
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

    return declaration !== undefined && provides(declaration, needed)
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
 * Apply `template-requirements` to an inline `qti-map-response`: the response it names is declared
 * with a `qti-mapping`, "the associated mapping, which must have been declared" (the information
 * model, `info-compact.txt:11438`).
 *
 * A `qti-map-response` that names no response declaration is not judged here: an undeclared
 * variable is its own refusal, and this rule refuses only a declared response with no mapping.
 *
 * @param source The document.
 * @param visit The element's visit.
 * @param context The item's declarations and the parents the walk has met.
 * @returns The refusal at the `qti-map-response`'s path when its response has no mapping; none for
 *   any other element.
 */
const mapResponseRequirements = (
  source: SourceDocument,
  visit: Visit,
  context: Context,
): readonly Refusal[] => {
  const attribute = attributeOf(visit.element, "identifier");
  if (
    !isQti(visit.element, (local) => local === "qti-map-response") ||
    Option.isNone(attribute) ||
    !inResponseProcessing(context, visit.element)
  ) {
    return [];
  }

  const needed: Needed = {
    ...responseHolding("qti-mapping", Option.none()),
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
 * A base type the value model does not hold (`point`, `duration`, `file`) has no lexical check here
 * (the slice list's 0.11 item 3), so its values are not judged. A missing or out-of-vocabulary
 * `base-type` is the structural validator's.
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
 * Give the failure of a value parse, if it failed.
 *
 * @param parsed The parse.
 * @returns The `InvalidValue`, none when the text is in the base type's lexical space.
 */
const invalid = <A>(parsed: Effect.Effect<A, InvalidValue>): Option.Option<InvalidValue> =>
  Result.getFailure(Effect.runSync(Effect.result(parsed)));

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
  parsed: Effect.Effect<A, InvalidValue>,
): readonly Refusal[] =>
  Option.toArray(
    Option.map(invalid(parsed), (failure) =>
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
    const lexical = baseType.value === "string" ? written : written.replaceAll(outerWhitespace, "");

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
 * The base type and cardinality of a variable or an expression, as `expression-type` compares
 * them. `baseType` is none for a value with no base type of its own: a `record`, or a declaration
 * that writes none.
 */
interface ExpressionType {
  readonly baseType: Option.Option<BaseType>;
  readonly cardinality: Cardinality;
}

/**
 * Construct a `single` type of a base type.
 *
 * @param baseType The base type.
 * @returns The type.
 */
const singleOf = (baseType: BaseType): ExpressionType => ({
  baseType: Option.some(baseType),
  cardinality: "single",
});

/**
 * The built-in variables an item's response processing may read, with their types.
 *
 * `numAttempts`, `duration` and `completionStatus` are the item's (reading 29: in an item
 * `duration` is a single float, seconds). `QTI_CONTEXT` is the built-in context variable, a
 * record: "any references within an item or an assessment to the QTI_CONTEXT variable [...] must
 * succeed" (`info-compact.txt:8456`).
 */
const builtIns: ReadonlyMap<string, ExpressionType> = new Map([
  ["completionStatus", singleOf("identifier")],
  ["duration", singleOf("float")],
  ["numAttempts", singleOf("integer")],
  ["QTI_CONTEXT", { baseType: Option.none(), cardinality: "record" }],
]);

/**
 * The kind of variable an element's `identifier` must name: a response, an outcome, or any
 * variable.
 */
type Expected = "outcome" | "response" | "variable";

/**
 * The elements of inline response processing whose `identifier` names a variable, and the kind
 * each must name.
 *
 * "This expression looks up the value of an item variable that has been declared in a
 * corresponding variable declaration or is one of the built-in variables" (`qti-variable`,
 * `info-compact.txt:9286`); `qti-correct` and `qti-map-response` read a response variable
 * (`:11418`, `:11438`); `qti-set-outcome-value` sets an outcome variable (`:11770`).
 */
const referencing: ReadonlyMap<string, Expected> = new Map([
  ["qti-correct", "response"],
  ["qti-map-response", "response"],
  ["qti-set-outcome-value", "outcome"],
  ["qti-variable", "variable"],
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
 * An element's `identifier`, read as a reference to a variable of the kind the element names.
 */
interface Reference {
  readonly expected: Expected;
  readonly identifier: string;
}

/**
 * Read the variable reference of an element that names one.
 *
 * @param element The element.
 * @returns Its reference, none for an element that names no variable and for one with no
 *   `identifier`, which is the structural validator's `missing-attribute`.
 */
const referenceOf = (element: SourceElement): Option.Option<Reference> => {
  const expected = referencing.get(element.local);
  if (element.namespace !== qtiNamespace || expected === undefined) {
    return Option.none();
  }

  return Option.map(attributeOf(element, "identifier"), (attribute) => ({
    expected,
    identifier: identifierOf(attribute),
  }));
};

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
 * with no `base-type` (a `record`) has a type with no base type.
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
    baseType,
    cardinality,
  }));
};

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
  const declarations = {
    outcome: context.outcomes,
    response: context.responses,
    variable: context.variables,
  }[reference.expected];
  const declaration = declarations.get(reference.identifier);
  if (declaration !== undefined) {
    return Option.some(declarationType(declaration));
  }

  const namable: readonly string[] = builtInsNamed[reference.expected];

  return namable.includes(reference.identifier)
    ? Option.some(Option.fromUndefinedOr(builtIns.get(reference.identifier)))
    : Option.none();
};

/**
 * Apply `undeclared-variable` to an element of inline response processing.
 *
 * `qti-variable` names a response, outcome, template or context declaration of the item, or a
 * built-in variable (`info-compact.txt:9286`); `qti-correct` and `qti-map-response` name a
 * response declaration; `qti-set-outcome-value` names an outcome declaration or
 * `completionStatus`. Template processing is not checked here.
 *
 * @param source The document.
 * @param visit The element's visit.
 * @param context The item's declarations and the parents the walk has met.
 * @returns The refusal at the element's path when it names no variable of the kind it must; none
 *   for any other element and for one outside response processing.
 */
const undeclaredVariable = (
  source: SourceDocument,
  visit: Visit,
  context: Context,
): readonly Refusal[] => {
  const reference = referenceOf(visit.element);
  if (
    Option.isNone(reference) ||
    !inResponseProcessing(context, visit.element) ||
    Option.isSome(variableType(reference.value, context))
  ) {
    return [];
  }

  return [
    refusal(source, "undeclared-variable", visit.path, {
      element: visit.element.local,
      expected: reference.value.expected,
      identifier: reference.value.identifier,
    }),
  ];
};

/**
 * Give the one expression an element holds, its only child element.
 *
 * @param element A `qti-set-outcome-value` or a `qti-lookup-outcome-value`.
 * @returns Its expression, none when it holds no child element or more than one.
 */
const operandOf = (element: SourceElement): Option.Option<SourceElement> => {
  const operands = element.children.flatMap((child) => (child.kind === "element" ? [child] : []));

  return operands.length === 1 ? Arr.head(operands) : Option.none();
};

/**
 * Give the type of an expression built only of the eight phase-1 elements (spec §4.12), each
 * naming a declared or built-in variable.
 *
 * `qti-base-value` is a single of its `base-type`; `qti-variable` and `qti-correct` have their
 * variable's type; `qti-map-response` is a single float; `qti-match` and `qti-is-null` are a
 * single boolean. An expression that holds any other element is not typed: phase 1 marks that
 * processing and never runs it (spec Q15, ruled B, where this is the one residual difference from
 * the qti package).
 *
 * @param expression The expression.
 * @param context The item's declarations.
 * @returns Its type, none when it is not typed.
 */
const expressionType = (
  expression: SourceElement,
  context: Context,
): Option.Option<ExpressionType> => {
  if (expression.namespace !== qtiNamespace) {
    return Option.none();
  }

  const variable = Option.flatMap(referenceOf(expression), (reference) =>
    variableType(reference, context),
  );
  switch (expression.local) {
    case "qti-base-value": {
      return Option.map(vocabularyValue(expression, "base-type", baseTypes), singleOf);
    }
    case "qti-variable":
    case "qti-correct": {
      return Option.flatten(variable);
    }
    case "qti-map-response": {
      return Option.as(variable, singleOf("float"));
    }
    case "qti-match":
    case "qti-is-null": {
      return expression.children.every(
        (child) => child.kind !== "element" || Option.isSome(expressionType(child, context)),
      )
        ? Option.some(singleOf("boolean"))
        : Option.none();
    }
    default: {
      return Option.none();
    }
  }
};

/**
 * Spell a type's base type for a refusal's detail.
 *
 * @param type The type.
 * @returns Its base type, empty when it has none.
 */
const baseTypeText = (type: ExpressionType): string => Option.getOrElse(type.baseType, () => "");

/**
 * Apply `expression-type` to a `qti-set-outcome-value` of inline response processing.
 *
 * "Floating point values can not be assigned to integer variables and vice-versa"
 * (`info-compact.txt:11770`): the expression's base type and cardinality are the outcome's. A type
 * with no base type (a `record`) compares by cardinality alone. An outcome or an expression that
 * is not typed is not judged.
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

  const agrees =
    expression.value.cardinality === outcome.value.cardinality &&
    (Option.isNone(expression.value.baseType) ||
      Option.isNone(outcome.value.baseType) ||
      expression.value.baseType.value === outcome.value.baseType.value);

  return agrees
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
 * Apply `expression-type` to a `qti-lookup-outcome-value`'s operand (reading 28).
 *
 * The operand is a single integer, float or duration, and an integer when the outcome holds a
 * `qti-match-table` (operator ruling `96840ced`, Q15 B: refused although phase 1 never runs a
 * lookup). An operand phase 1 cannot type is accepted untyped, and an outcome that is undeclared
 * or holds no lookup table is not judged here.
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

  const allowed: readonly BaseType[] = lookupOperands[table.value];
  const agrees =
    operand.value.cardinality === "single" &&
    !Option.exists(operand.value.baseType, (baseType) => !allowed.includes(baseType));

  return agrees
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
 * Check a document against the prose rules: `undeclared-response`, `duplicate-identifier`,
 * `binding`, `template-requirements`, `value-type`, `undeclared-variable` and `expression-type`,
 * and reading 19's `max-strings` on an Extended Text bound to a container.
 *
 * Every refusal is located at an element or attribute path and returned in document order; the
 * check never stops at the first. An empty list means no prose rule this module implements refuses
 * the document, not that the document is valid: the structural validator judges the XSD's rules.
 *
 * @param source The document to check.
 * @returns The refusals, empty when every rule holds.
 * @see {@link Refusal} for what each refusal carries.
 */
export const checkRules = (source: SourceDocument): readonly Refusal[] => {
  const context: Context = {
    outcomes: declarationsOf(source, "qti-outcome-declaration"),
    parents: new Map(),
    responses: declarationsOf(source, "qti-response-declaration"),
    variables: new Map(variableDeclarations.flatMap((kind) => [...declarationsOf(source, kind)])),
  };
  const seen = new Map<SourceElement, Set<string>>();
  const refusals: Refusal[] = [];
  for (const visit of walk(source)) {
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
      ...setOutcomeType(source, visit, context),
      ...lookupOperandType(source, visit, context),
    );
  }

  return refusals;
};

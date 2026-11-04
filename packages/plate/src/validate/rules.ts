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
import { Array as Arr, Option } from "effect";
import { attributePath, qtiNamespace, walk } from "#plate/document/source.ts";
import type {
  SourceAttribute,
  SourceDocument,
  SourceElement,
  Visit,
} from "#plate/document/source.ts";
import { Refusal } from "#plate/validate/refusal.ts";
import type { RefusalRule } from "#plate/validate/refusal.ts";
import { baseTypes, cardinalities, interactionNames } from "#plate/vocabulary.ts";
import type { BaseType, Cardinality, InteractionName } from "#plate/vocabulary.ts";

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
 * Index the item's response declarations by the identifier each declares.
 *
 * The declarations are the root's `qti-response-declaration` children. When two share an
 * identifier, the last one wins, as it does where the item model binds an interaction; the
 * duplicate is `duplicate-identifier`'s refusal.
 *
 * @param source The document.
 * @returns Each declared response identifier with its declaration.
 */
const responseDeclarations = (source: SourceDocument): ReadonlyMap<string, SourceElement> =>
  new Map(
    source.root.children.flatMap((child) =>
      child.kind === "element" && isQti(child, (local) => local === "qti-response-declaration")
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
 * Check a document against the prose rules: `undeclared-response`, `duplicate-identifier` and
 * `binding`, and reading 19's `max-strings` on an Extended Text bound to a container.
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
  const declarations = responseDeclarations(source);
  const seen = new Map<SourceElement, Set<string>>();
  const refusals: Refusal[] = [];
  for (const visit of walk(source)) {
    refusals.push(
      ...duplicateIdentifier(source, visit, seen),
      ...responseRules(source, visit, declarations),
    );
  }

  return refusals;
};

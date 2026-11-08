/**
 * The test prose rules: what QTI's information model and the project's readings require of a test
 * or section document beyond what its XSD can say.
 *
 * {@link checkTestRules} is to a test or section document what `checkRules` is to an item, and the
 * two never overlap: `checkRules` gives nothing for a root that is not an item, and this module
 * gives nothing for one that is not a test or a section. It returns every refusal it finds, in
 * document order, and never stops at the first. The list of rules is closed, and each rule's
 * function names the sentence of the information model, or the reading, that settles it.
 *
 * A test's printed variables are judged as an item's are, by the item rules' own judgement
 * (`printedVariableReferences`), against the test's declarations and built-ins: the test declares
 * the variables its printed variables name, as the qti package binds them (`bindsVariables`). A
 * section declares nothing, so a section document's printed variables are not judged.
 *
 * A test's and a section's expressions, in outcome processing, pre-conditions, branch rules and
 * template defaults, are judged by the item's processing rules too (`processingRefusals`), against
 * the processing scope: a test's processing reads more built-ins than its printed variables name.
 *
 * A field of a record declaration's value is judged as an item's is (`recordFieldRefusals`): it
 * carries `field-identifier` and `base-type`, and its text is a value of its own `base-type`.
 *
 * Two things a test may hold are valid here and are never refused. A dotted reference
 * (`ITEMREF.VAR`, `ITEMREF.N.VAR`, a part's or a section's `duration`) is valid in pre-conditions,
 * branch rules and outcome processing (readings 4, 5 and 37), and is typed `unknown` here ({@link
 * unknownPrefix}); reading 48 ("a dotted reference is accepted when exactly one reading names a
 * real item ref, test part or section and its variable") refuses one only when two readings of it
 * each name a real item ref, part or section and a variable it has, which needs the items' declared
 * variables, so only a package can judge it. A `min-time` above a `max-time` is valid, each limit
 * enforced on its own (T-O8).
 *
 * @module
 */
import { Option } from "effect";
import { attributePath, qtiNamespace, walk, xincludeNamespace } from "#plate/document/source.ts";
import type {
  SourceAttribute,
  SourceDocument,
  SourceElement,
  Visit,
} from "#plate/document/source.ts";
import { singleOf } from "#plate/model/expression.ts";
import { trimXmlSpace } from "#plate/model/values.ts";
import { Refusal } from "#plate/validate/refusal.ts";
import type { RefusalRule } from "#plate/validate/refusal.ts";
import {
  declarationsOf,
  printedVariableReferences,
  processingRefusals,
  recordFieldRefusals,
} from "#plate/validate/rules.ts";
import type { NamedVariable, PrefixedTyper, VariableScope } from "#plate/validate/rules.ts";
import { governingTables } from "#plate/validate/structure.ts";
import type { Tables } from "#plate/validate/xsd.ts";

/**
 * The roots these rules judge, by local name in QTI's namespace: a test and a section document.
 */
const testRoots: ReadonlySet<string> = new Set(["qti-assessment-section", "qti-assessment-test"]);

/**
 * The elements whose identifiers share one scope, the test: "The identifier of the test part must
 * be unique within the test and must not be the identifier of any qti-assessment-section or
 * qti-assessment-item-ref" (info.txt:47082), "the identifier of the section or item reference must
 * be unique within the test" (info.txt:10759), and of section refs "each reference must have a
 * unique identifier" (info.txt:67406). A branch rule's `target` may name any of the four, so they
 * share one scope.
 */
const identifiedParts: ReadonlySet<string> = new Set([
  "qti-assessment-item-ref",
  "qti-assessment-section",
  "qti-assessment-section-ref",
  "qti-test-part",
]);

/**
 * The children that make a section non-empty: "A Section must contain at least one other Section
 * or Item" (info.txt:9130, reading 26), a section ref standing for the section it names.
 */
const sectionMembers = [
  "qti-assessment-item-ref",
  "qti-assessment-section",
  "qti-assessment-section-ref",
] as const;

/**
 * The test content that holds no interaction and no template element (reading 25): a test's
 * rubric blocks and its test feedback.
 */
const testContent: ReadonlySet<string> = new Set(["qti-rubric-block", "qti-test-feedback"]);

/**
 * The template elements reading 25 keeps out of test content.
 */
const templateElements: ReadonlySet<string> = new Set([
  "qti-template-block",
  "qti-template-inline",
]);

/**
 * The eight expressions the information model allows only in outcome processing: each "can only be
 * used in outcomes processing" (info.txt:9332-9360, reading 23).
 */
const outcomeOnly: ReadonlySet<string> = new Set([
  "qti-number-correct",
  "qti-number-incorrect",
  "qti-number-presented",
  "qti-number-responded",
  "qti-number-selected",
  "qti-outcome-maximum",
  "qti-outcome-minimum",
  "qti-test-variables",
]);

/**
 * The elements outside outcome processing that hold a test's expressions, one of which a
 * misplaced expression's refusal names as its `context`.
 */
const expressionContexts: ReadonlySet<string> = new Set([
  "qti-branch-rule",
  "qti-pre-condition",
  "qti-template-default",
]);

/**
 * The declarations a test holds whose variables its printed variables may name: "This allows
 * globally scoped varables to be defined" (`info.txt:11725`, the test's context declarations) and
 * its outcome declarations. A test declares no template or response variable. Where two share an
 * identifier, the later kind here wins, as in an item.
 */
const testDeclarations = ["qti-context-declaration", "qti-outcome-declaration"] as const;

/**
 * The built-in variables of a test, each declared implicitly: "QTI_CONTEXT is a built-in variable
 * and so any references within an item or an assessment to the QTI_CONTEXT variable [...] must
 * succeed" (`info.txt:8456`), a record, and "The time spent on the test is recorded as if it were a
 * built-in response variable called 'duration' declared at the test-level and of base-type duration
 * and single cardinality" (`info.txt:9226`). An item's `completionStatus` and `numAttempts` are
 * item session variables, so a test does not build them in.
 */
const testBuiltIns: ReadonlyMap<string, NamedVariable> = new Map<string, NamedVariable>([
  ["duration", { kind: "response", type: Option.some(singleOf("duration")) }],
  [
    "QTI_CONTEXT",
    { kind: "context", type: Option.some({ baseType: "unknown", cardinality: "record" }) },
  ],
]);

/**
 * Collect what a test's printed variables resolve their names against: the test's declarations
 * ({@link testDeclarations}) and its built-ins ({@link testBuiltIns}).
 *
 * @param source The test.
 * @returns The test's scope.
 */
const testScope = (source: SourceDocument): VariableScope => ({
  builtIns: testBuiltIns,
  declarer: "test",
  variables: new Map(testDeclarations.flatMap((kind) => [...declarationsOf(source, kind)])),
});

/**
 * Type a test's prefixed read when the test is checked alone: `unknown`, which satisfies every
 * rule, since only a package holds the items whose variables it reads.
 *
 * @returns The type `unknown` of `unknown` cardinality.
 */
const unknownPrefix: PrefixedTyper = () => ({ baseType: "unknown", cardinality: "unknown" });

/**
 * Give the element path a refusal points at: an element's path as it is, an attribute's without
 * its last step, and none for a refusal located otherwise.
 *
 * @param refusal The refusal.
 * @returns The path of its element, or the empty string when it points at no path.
 */
const elementPathOf = (refusal: Refusal): string => {
  if (refusal.location.kind !== "path") {
    return "";
  }

  const { path } = refusal.location;
  const attribute = path.lastIndexOf("/@");

  return attribute === -1 ? path : path.slice(0, attribute);
};

/**
 * The elements the rules judge, with each element's parent.
 *
 * `parents` covers every element of the document, so an ancestor the structural walk passes over
 * is still reached when a rule climbs from a judged element.
 */
interface Judged {
  readonly parents: ReadonlyMap<SourceElement, SourceElement>;
  readonly visits: readonly Visit[];
}

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
 * Find an element's attribute in no namespace by its local name.
 *
 * @param element The element.
 * @param local The attribute's local name.
 * @returns The attribute, or none when the element does not carry it.
 */
const attributeOf = (element: SourceElement, local: string): Option.Option<SourceAttribute> =>
  Option.fromUndefinedOr(
    element.attributes.find((attribute) => attribute.namespace === "" && attribute.local === local),
  );

/**
 * Find the nearest ancestor of an element that is a QTI element whose local name passes a test.
 *
 * @param parents Each element's parent.
 * @param element The element to climb from.
 * @param test The test of an ancestor's local name.
 * @returns The nearest such ancestor, or none when no ancestor passes.
 */
const ancestor = (
  parents: ReadonlyMap<SourceElement, SourceElement>,
  element: SourceElement,
  test: (local: string) => boolean,
): Option.Option<SourceElement> => {
  for (let above = parents.get(element); above !== undefined; above = parents.get(above)) {
    if (isQti(above, test)) {
      return Option.some(above);
    }
  }

  return Option.none();
};

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
 * List the elements the rules judge, in document order: exactly those the structural walk checks,
 * the keys of `governingTables` (reading 57).
 *
 * One admission decides for both stages, so the rules never refuse what the walk does not check,
 * nor skip what it does. In lax wildcard content, such as a `qti-selection`'s or a
 * `qti-ordering`'s, the rules judge what the walk checks there and not what it passes over: a
 * nested `qti-assessment-section` stays foreign content (reading 6), so neither its identifier nor
 * its children are judged.
 *
 * @param source The document.
 * @param tables The tables generated from the QTI XSD, the ones the structural walk checks it by.
 * @returns The judged visits, and the parent of every element of the document.
 */
const judgedVisits = (source: SourceDocument, tables: Tables): Judged => {
  const governing = governingTables(source, tables);
  const parents = new Map<SourceElement, SourceElement>();
  const visits: Visit[] = [];
  for (const visit of walk(source)) {
    if (Option.isSome(visit.parent)) {
      parents.set(visit.element, visit.parent.value);
    }

    if (governing.has(visit.element)) {
      visits.push(visit);
    }
  }

  return { parents, visits };
};

/**
 * Report whether a judged element holds an unexpanded entity reference where a rule may read it:
 * in an attribute's value or among its children.
 *
 * @param element The element.
 * @returns Whether its attributes or its children hold a reference whose value is unknown.
 */
const holdsUnexpanded = (element: SourceElement): boolean =>
  element.attributes.some((attribute) => attribute.references.length > 0) ||
  element.children.some((child) => child.kind === "entity");

/**
 * Apply `duplicate-identifier` to one element: a part's, a section's, an item ref's or a section
 * ref's `identifier` is not one an earlier such element of the document already gave.
 *
 * Identifiers are compared as their `xs:NCName` type reads them, with the outer whitespace
 * collapsed, as the item rules compare theirs. A section document's identifiers are compared
 * within it, its root's included: any test that includes it holds them all.
 *
 * @param source The document.
 * @param visit The element's visit.
 * @param seen The identifiers given so far, which this adds the element's to.
 * @returns The refusal at the repeated `identifier` attribute's path, or none for the first
 *   occurrence and for any other element.
 */
const duplicateIdentifier = (
  source: SourceDocument,
  visit: Visit,
  seen: Set<string>,
): readonly Refusal[] => {
  const attribute = attributeOf(visit.element, "identifier");
  if (!isQti(visit.element, (local) => identifiedParts.has(local)) || Option.isNone(attribute)) {
    return [];
  }

  const identifier = trimXmlSpace(attribute.value.value);
  if (!seen.has(identifier)) {
    seen.add(identifier);

    return [];
  }

  return [
    refusal(source, "duplicate-identifier", attributePath(visit.path, attribute.value), {
      identifier,
    }),
  ];
};

/**
 * Apply reading 26's `child-count` to a section: it holds at least one item ref, section or
 * section ref.
 *
 * A section with an XInclude child is not counted: the inclusion is not performed, and what it
 * would supply may be the member the count needs, so refusing it could refuse a valid section
 * (reading 1). The verdict accepts such a document: a test's include is marked `xi:include`, and a
 * section document carries its root's mark.
 *
 * @param source The document.
 * @param visit The element's visit.
 * @returns The refusal at the section's path, or none when it holds a member or is not a section.
 */
const sectionChildCount = (source: SourceDocument, visit: Visit): readonly Refusal[] => {
  const { element } = visit;
  if (!isQti(element, (local) => local === "qti-assessment-section")) {
    return [];
  }

  const children = element.children.filter((child) => child.kind === "element");
  const counted = children.some(
    (child) =>
      child.namespace === xincludeNamespace ||
      isQti(child, (local) => sectionMembers.some((member) => member === local)),
  );
  if (counted) {
    return [];
  }

  return [
    refusal(source, "child-count", visit.path, {
      child: sectionMembers.join(" or "),
      element: element.local,
      required: "at least one",
      source: "reading 26",
    }),
  ];
};

/**
 * Apply readings 24 and 25's `misplaced-element` to an interaction or a template element: it does
 * not sit in a test's rubric block or test feedback.
 *
 * The full ASI XSD admits interactions and template content there; the information model's prose
 * and the test profile XSD forbid them, and reading 25 follows the prose. Printed variables and
 * inline or block feedback stay allowed, so they are not refused. Every interaction and template
 * element inside is refused, nested ones included.
 *
 * @param source The document.
 * @param visit The element's visit.
 * @param parents Each element's parent.
 * @returns The refusal at the element's path, naming the test content it sits in, or none.
 */
const misplacedInTestContent = (
  source: SourceDocument,
  visit: Visit,
  parents: ReadonlyMap<SourceElement, SourceElement>,
): readonly Refusal[] => {
  const { element } = visit;
  const excluded = isQti(
    element,
    (local) =>
      templateElements.has(local) || (local.startsWith("qti-") && local.endsWith("-interaction")),
  );
  if (!excluded) {
    return [];
  }

  return Option.match(
    ancestor(parents, element, (local) => testContent.has(local)),
    {
      onNone: () => [],
      onSome: (container) => [
        refusal(source, "misplaced-element", visit.path, {
          element: element.local,
          reading: "25",
          requires: `outside a test's ${container.local}`,
        }),
      ],
    },
  );
};

/**
 * Apply reading 23's `expression-placement` to an expression: an outcome-only expression, or a
 * `qti-variable` carrying `weight-identifier`, sits inside `qti-outcome-processing`.
 *
 * Weights are "defined only in the test context (and hence only in outcomes processing)", so a
 * weighted variable follows the eight expressions (T-O10, pick A) and cites the same reading. The
 * refusal names the pre-condition, branch rule or template default the expression sits in as its
 * `context`. A prefixed reference is never refused here.
 *
 * @param source The document.
 * @param visit The element's visit.
 * @param parents Each element's parent.
 * @returns The refusal at the expression's path, or at its `weight-identifier`'s, or none.
 */
const expressionPlacement = (
  source: SourceDocument,
  visit: Visit,
  parents: ReadonlyMap<SourceElement, SourceElement>,
): readonly Refusal[] => {
  const { element } = visit;
  const weight = isQti(element, (local) => local === "qti-variable")
    ? attributeOf(element, "weight-identifier")
    : Option.none();
  const restricted = isQti(element, (local) => outcomeOnly.has(local)) || Option.isSome(weight);
  if (
    !restricted ||
    Option.isSome(ancestor(parents, element, (local) => local === "qti-outcome-processing"))
  ) {
    return [];
  }

  const context = Option.match(
    ancestor(parents, element, (local) => expressionContexts.has(local)),
    {
      onNone: () => ({}),
      onSome: (container) => ({ context: container.local }),
    },
  );

  return Option.match(weight, {
    onNone: () => [
      refusal(source, "expression-placement", visit.path, {
        ...context,
        element: element.local,
        reading: "23",
      }),
    ],
    onSome: (attribute) => [
      refusal(source, "expression-placement", attributePath(visit.path, attribute), {
        attribute: attribute.local,
        ...context,
        element: element.local,
        reading: "23",
      }),
    ],
  });
};

/**
 * Check a test or section document against the test prose rules: `duplicate-identifier` over its
 * parts, sections, item refs and section refs, reading 26's `child-count` on each section, readings
 * 24 and 25's `misplaced-element` for an interaction or a template element in a rubric block or
 * test feedback, reading 23's `expression-placement` for an outcome-only expression, or a weighted
 * `qti-variable`, outside outcome processing, and, in a test, `undeclared-variable` and
 * `expression-type` for what a `qti-printed-variable` names, judged as an item's are
 * (`printedVariableReferences`): its `identifier` names an outcome the test declares, and its
 * `base` and `index`, written as a name, a single integer outcome the test declares, where a
 * context variable or a built-in of the test (`QTI_CONTEXT`, `duration`) is refused by its kind. A
 * section document's printed variables are not judged, since a section declares nothing. A field of
 * a record declaration's value that lacks `field-identifier` or `base-type` is `missing-attribute`,
 * and one whose text is outside its own `base-type` is `value-type`, at the paths and with the
 * details an item's gets (`recordFieldRefusals`, `info.txt:73046`).
 *
 * Its expressions are judged by the item's processing rules (`processingRefusals`, the qti
 * package's P8, P20 to P24 and P29), with every prefixed read typed `unknown`
 * ({@link unknownPrefix}). Each of their refusals is placed after the test rules' at the element
 * it judges ({@link elementPathOf}); one at no judged element, which those rules never give, would
 * follow all the others rather than be lost.
 *
 * The rules judge exactly what the structural walk checks, and only a document they can read
 * whole:
 *
 * - A root other than a QTI `qti-assessment-test` or `qti-assessment-section` gives no refusal; an
 *   item's rules are `checkRules`'.
 * - A document whose judged elements hold an unexpanded entity reference anywhere gives no refusal,
 *   as `checkRules` gives none for such an item: `identifier="&id;"` on one item ref could equal
 *   any other's, and an entity among a section's children may be its only member. The verdict
 *   leaves such a document unchecked unless the structural walk refuses it.
 * - Only the elements the structural walk checks are visited, the keys of `governingTables` for the
 *   same tables (reading 57).
 *
 * Every refusal is located at an element or attribute path. An empty list means no rule this module
 * implements refuses the document, not that it is valid: the structural validator judges the XSD's
 * rules, and a package judges what needs the items it holds.
 *
 * @param source The test or section document to check.
 * @param tables The tables generated from the QTI XSD, the ones `checkStructure` checks the
 *   document by.
 * @returns The refusals in document order, empty when every rule holds or the document is one the
 *   rules do not judge.
 * @see {@link Refusal} for what each refusal carries.
 */
export const checkTestRules = (source: SourceDocument, tables: Tables): readonly Refusal[] => {
  if (!isQti(source.root, (local) => testRoots.has(local))) {
    return [];
  }

  const { parents, visits } = judgedVisits(source, tables);
  if (visits.some((visit) => holdsUnexpanded(visit.element))) {
    return [];
  }

  const seen = new Set<string>();
  const scope = isQti(source.root, (local) => local === "qti-assessment-test")
    ? Option.some(testScope(source))
    : Option.none();
  const processing = Map.groupBy(processingRefusals(source, tables, unknownPrefix), elementPathOf);
  const placed = visits.flatMap((visit) => {
    const atVisit = processing.get(visit.path) ?? [];
    processing.delete(visit.path);

    return [
      ...duplicateIdentifier(source, visit, seen),
      ...sectionChildCount(source, visit),
      ...misplacedInTestContent(source, visit, parents),
      ...expressionPlacement(source, visit, parents),
      ...recordFieldRefusals(source, visit, parents),
      ...Option.match(scope, {
        onNone: () => [],
        onSome: (declared) => printedVariableReferences(source, visit, declared),
      }),
      ...atVisit,
    ];
  });

  return [...placed, ...[...processing.values()].flat()];
};

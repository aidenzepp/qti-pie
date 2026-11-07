/**
 * The test model: what M2 reads from a valid `qti-assessment-test`, typed, with every feature it
 * accepts and does not deliver named as a mark.
 *
 * {@link buildTest} reads the parts, their sections and item references in document order, each
 * `qti-item-session-control` attribute by attribute, each item reference's weights, variable
 * mappings and template defaults, the test's outcome declarations through the item model's own
 * reader, and its outcome processing into the item model's rules through the registry's expression
 * reader, with the item model's element and attribute readers. The features `testMarks` lists are
 * marks on the verdict, never notices, and the tree leaves them out or holds them inert, so a
 * sequence walked from it ignores them.
 *
 * @module
 */
import { Array as Arr, Effect, Option, pipe } from "effect";
import { attributePath, walk, xincludeNamespace } from "#plate/document/source.ts";
import type { SourceAttribute, SourceDocument, SourceElement } from "#plate/document/source.ts";
import {
  attributeOf,
  childrenNamed,
  elementsOf,
  floatOf,
  greatestInt,
  identifierAttribute,
  identifierOf,
  isQti,
  leastInt,
  listed,
  nameOf,
  pathOf,
  refusal,
  requiredAttribute,
  requiredValue,
  valueOf,
  xsBoolean,
  xsBooleanOf,
} from "#plate/model/attributes.ts";
import type { ModelWalk } from "#plate/model/attributes.ts";
import type { Branch, Expression, KindRule, Rule } from "#plate/model/expression.ts";
import { kindRules, readExpression } from "#plate/model/expressions/read.ts";
import type { ExpressionReading } from "#plate/model/expressions/read.ts";
import { outcomeDeclaration, pathsOf, xmlWhitespaceRun } from "#plate/model/item.ts";
import type { OutcomeDeclaration, UnsupportedFeature } from "#plate/model/item.ts";
import { integerLexical, parseLexical, trimXmlSpace } from "#plate/model/values.ts";
import type { Refusal } from "#plate/validate/refusal.ts";
import { navigationModes, renders, submissionModes, testMarks } from "#plate/vocabulary.ts";
import type {
  Condition,
  FeatureRule,
  NavigationMode,
  SubmissionMode,
  TestMark,
} from "#plate/vocabulary.ts";

/**
 * The seven attributes of a `qti-item-session-control`, each as the element writes it, or none when
 * it does not, or when the element has no `qti-item-session-control`. Nothing is filled in from an
 * enclosing element or a default here: the session resolves each attribute from the nearest element
 * that sets it.
 */
export interface ControlAttributes {
  readonly allowComment: Option.Option<boolean>;
  readonly allowReview: Option.Option<boolean>;
  readonly allowSkipping: Option.Option<boolean>;
  /**
   * `max-attempts`, an `xs:int`. A negative value is valid, kept as written, and marked
   * `max-attempts:negative`.
   */
  readonly maxAttempts: Option.Option<number>;
  readonly showFeedback: Option.Option<boolean>;
  readonly showSolution: Option.Option<boolean>;
  readonly validateResponses: Option.Option<boolean>;
}

/**
 * A `qti-template-default` the engine can apply: the template variable of the referenced item it
 * sets, and the expression the test evaluates for it, over the test's processing names.
 */
export interface TemplateDefault {
  readonly expression: Expression;
  readonly templateIdentifier: string;
}

/**
 * A `qti-assessment-item-ref`.
 */
export interface ItemRef {
  /**
   * The `category` identifiers, in written order; none when it is absent.
   */
  readonly category: readonly string[];
  readonly control: ControlAttributes;
  readonly fixed: boolean;
  /**
   * The `href` as `xs:anyURI` reads it: outer XML whitespace removed and each inner run collapsed
   * to one space. It is resolved against the test's own location in its package.
   */
  readonly href: string;
  readonly identifier: string;
  readonly kind: "item-ref";
  /**
   * Each `qti-variable-mapping`'s `target-identifier`, keyed to its `source-identifier`: a read of
   * the target through this item reference reads the item's source outcome.
   */
  readonly mappings: ReadonlyMap<string, string>;
  readonly required: boolean;
  /**
   * Each `qti-template-default` the engine can apply, in document order. One whose expression
   * reads a name the engine does not hold in a test, or holds an element the engine does not
   * run, is marked at its element and left out, so the template variable starts at the item's
   * own declared default.
   */
  readonly templateDefaults: readonly TemplateDefault[];
  /**
   * Each `qti-weight`'s `identifier`, keyed to its `value`, an `xs:double`.
   */
  readonly weights: ReadonlyMap<string, number>;
}

/**
 * A `qti-assessment-section`. `children` holds its sections and item references in document order;
 * a `qti-assessment-section-ref` and an `xi:include` are marked and not among them.
 */
export interface Section {
  readonly children: readonly SectionChild[];
  readonly control: ControlAttributes;
  readonly fixed: boolean;
  readonly identifier: string;
  readonly keepTogether: boolean;
  readonly kind: "section";
  readonly required: boolean;
  readonly title: string;
  readonly visible: boolean;
}

/**
 * What a section holds: a nested section or an item reference.
 */
export type SectionChild = ItemRef | Section;

/**
 * A `qti-test-part`. `children` holds its sections in document order; a
 * `qti-assessment-section-ref` is marked and not among them.
 */
export interface TestPart {
  readonly children: readonly Section[];
  readonly control: ControlAttributes;
  readonly identifier: string;
  readonly navigation: NavigationMode;
  readonly submission: SubmissionMode;
}

/**
 * A feature a test holds and M2 does not deliver, where it is. A test feature is always a mark on
 * the verdict, never a notice.
 */
export interface MarkedFeature extends UnsupportedFeature {
  readonly shown: "mark";
}

/**
 * A test's `qti-outcome-processing`, in one of three states: `absent` when the test has none,
 * `marked` when it has one the engine cannot run (its marks are in `Test.unsupported`), and `runs`
 * with its rules otherwise. A reader switches over the three exhaustively.
 */
export type OutcomeProcessing =
  | { readonly kind: "absent" }
  | { readonly kind: "marked" }
  | { readonly kind: "runs"; readonly rules: readonly Rule[] };

/**
 * A valid `qti-assessment-test` as M2 models it.
 *
 * `outcomes` holds the test's outcome declarations of modelled base types and cardinalities, as the
 * item model holds an item's, and `outcomeProcessing` its outcome processing in one of three
 * states. `unsupported` lists every feature not delivered, in document order, each once per feature
 * and path: the keys of `testMarks`, the marks the item model gives an outcome declaration it does
 * not hold, and the marks of outcome processing the engine cannot run.
 */
export interface Test {
  /**
   * The document's location as the host named it.
   */
  readonly document: string;
  readonly identifier: string;
  readonly outcomeProcessing: OutcomeProcessing;
  readonly outcomes: ReadonlyMap<string, OutcomeDeclaration>;
  readonly parts: readonly TestPart[];
  readonly title: string;
  readonly unsupported: readonly MarkedFeature[];
}

/**
 * The session control of an element that has no `qti-item-session-control`: every attribute
 * absent.
 */
export const absentControl: ControlAttributes = {
  allowComment: Option.none(),
  allowReview: Option.none(),
  allowSkipping: Option.none(),
  maxAttempts: Option.none(),
  showFeedback: Option.none(),
  showSolution: Option.none(),
  validateResponses: Option.none(),
};

/**
 * The `testMarks` keys that name an element: the element is the feature wherever it sits.
 */
const elementMarks: ReadonlySet<string> = new Set(
  testMarks.filter((mark) => mark.startsWith("qti-")),
);

/**
 * The mark of an XInclude `include`, which is never fetched.
 */
const includeMark: TestMark = "xi:include";

/**
 * The mark of a `qti-item-session-control` whose `allow-comment` is true.
 */
const commentMark: TestMark = 'allow-comment="true"';

/**
 * The mark of a negative `max-attempts`, at the attribute's path.
 */
const negativeAttemptsMark: TestMark = "max-attempts:negative";

/**
 * The item model's marks, which `renders` lists, that sit on an outcome declaration, such as
 * `base-type="duration"`.
 */
const declarationMarks: readonly FeatureRule[] = renders.marks.filter(
  (mark: FeatureRule) => mark.on !== "body" && mark.on.includes("qti-outcome-declaration"),
);

/**
 * The `qti-*` elements below an outcome declaration that the model reads: the item model's, which
 * `renders` lists, so the two cannot drift. Any other is a mark keyed by its name, as the item
 * model marks it.
 */
const declarationContent: ReadonlySet<string> = new Set(renders.elements);

/**
 * Read an integer written in an attribute, its outer whitespace gone, exactly.
 *
 * @param written The value as written.
 * @returns The integer, or none when the value is not one.
 */
const integerOf = (written: string): Option.Option<bigint> => {
  const lexical = trimXmlSpace(written);

  return integerLexical.test(lexical) ? Option.some(BigInt(lexical)) : Option.none();
};

/**
 * Read an attribute the element must carry whose value is one of a closed list, such as
 * `navigation-mode`.
 *
 * @param build The build.
 * @param element The element.
 * @param name The attribute's name.
 * @param allowed The values it may take.
 * @returns The value, or the refusal `missing-attribute` or `attribute-type`.
 */
const requiredListed = <const T extends string>(
  build: ModelWalk,
  element: SourceElement,
  name: string,
  allowed: readonly T[],
): Effect.Effect<T, Refusal> =>
  Effect.flatMap(requiredAttribute(build, element, name), (attribute) =>
    listed(build, element, name, attribute, allowed),
  );

/**
 * Read an `xs:boolean` attribute's value through {@link xsBooleanOf}.
 *
 * @param build The build.
 * @param element The element.
 * @param attribute The attribute.
 * @returns The boolean, or the refusal `value-type` at the attribute.
 */
const booleanValue = (
  build: ModelWalk,
  element: SourceElement,
  attribute: SourceAttribute,
): Effect.Effect<boolean, Refusal> =>
  Option.match(xsBooleanOf(attribute.value), {
    onNone: () =>
      Effect.fail(
        refusal(build, "value-type", attributePath(pathOf(build, element), attribute), {
          baseType: "boolean",
          lexical: attribute.value,
        }),
      ),
    onSome: (value) => Effect.succeed(value),
  });

/**
 * Read an optional `xs:boolean` attribute through {@link xsBooleanOf}.
 *
 * @param build The build.
 * @param element The element.
 * @param name The attribute's name.
 * @returns The boolean, none when absent, or the refusal `value-type` at the attribute.
 */
const booleanAttribute = (
  build: ModelWalk,
  element: SourceElement,
  name: string,
): Effect.Effect<Option.Option<boolean>, Refusal> =>
  Effect.transposeOption(
    Option.map(attributeOf(element, name), (attribute) => booleanValue(build, element, attribute)),
  );

/**
 * Read an `xs:boolean` attribute the element must carry, such as a section's `visible`.
 *
 * @param build The build.
 * @param element The element.
 * @param name The attribute's name.
 * @returns The boolean, or the refusal `missing-attribute` or `value-type`.
 */
const requiredBoolean = (
  build: ModelWalk,
  element: SourceElement,
  name: string,
): Effect.Effect<boolean, Refusal> =>
  Effect.flatMap(requiredAttribute(build, element, name), (attribute) =>
    booleanValue(build, element, attribute),
  );

/**
 * Read an `xs:int` attribute, such as `max-attempts`, exactly: outer whitespace goes, and the value
 * keeps `xs:int`'s range (readings 45 and 46), so a number holds it exactly.
 *
 * @param build The build.
 * @param element The element.
 * @param name The attribute's name.
 * @returns The number, none when absent, or the refusal `value-type` at the attribute when the value
 *   is not an integer from -2^31 to 2^31-1.
 */
const intAttribute = (
  build: ModelWalk,
  element: SourceElement,
  name: string,
): Effect.Effect<Option.Option<number>, Refusal> =>
  Effect.transposeOption(
    Option.map(attributeOf(element, name), (attribute) =>
      Option.match(
        Option.filter(
          integerOf(attribute.value),
          (value) => value >= leastInt && value <= greatestInt,
        ),
        {
          onNone: () =>
            Effect.fail(
              refusal(build, "value-type", attributePath(pathOf(build, element), attribute), {
                baseType: "xs:int",
                lexical: trimXmlSpace(attribute.value),
              }),
            ),
          onSome: (value) => Effect.succeed(Number(value)),
        },
      ),
    ),
  );

/**
 * Read an element's `qti-item-session-control`, attribute by attribute.
 *
 * @param build The build.
 * @param owner A test part, a section or an item reference.
 * @returns Each attribute the control writes, {@link absentControl} when the element has none, or a
 *   refusal at an attribute outside its type.
 */
const controlOf = (
  build: ModelWalk,
  owner: SourceElement,
): Effect.Effect<ControlAttributes, Refusal> =>
  Option.match(Arr.head(childrenNamed(owner, "qti-item-session-control")), {
    onNone: () => Effect.succeed(absentControl),
    onSome: (control) =>
      Effect.all({
        allowComment: booleanAttribute(build, control, "allow-comment"),
        allowReview: booleanAttribute(build, control, "allow-review"),
        allowSkipping: booleanAttribute(build, control, "allow-skipping"),
        maxAttempts: intAttribute(build, control, "max-attempts"),
        showFeedback: booleanAttribute(build, control, "show-feedback"),
        showSolution: booleanAttribute(build, control, "show-solution"),
        validateResponses: booleanAttribute(build, control, "validate-responses"),
      }),
  });

/**
 * Read a `qti-weight`: its `identifier`, and its `value` as an `xs:double`, outer whitespace gone
 * (readings 7 and 56), as `doubleAttribute` in `#plate/model/attributes.ts` reads one.
 *
 * @param build The build.
 * @param element The weight.
 * @returns The identifier and the weight, or the refusal `value-type` at a value outside the
 *   double's lexical space. A document the validator would refuse can also fail with
 *   `missing-attribute`.
 */
const weightOf = (
  build: ModelWalk,
  element: SourceElement,
): Effect.Effect<readonly [string, number], Refusal> =>
  Effect.gen(function* readWeight() {
    const identifier = yield* identifierAttribute(build, element, "identifier");
    const written = yield* requiredAttribute(build, element, "value");
    const lexical = trimXmlSpace(written.value);
    const value = yield* Effect.mapError(Effect.fromResult(parseLexical("float", lexical)), () =>
      refusal(build, "value-type", attributePath(pathOf(build, element), written), {
        baseType: "xs:double",
        lexical,
      }),
    );

    return [identifier, floatOf(build, value)] as const;
  });

/**
 * Read a `qti-variable-mapping`: its `target-identifier` and the `source-identifier` it reads.
 *
 * @param build The build.
 * @param element The mapping.
 * @returns The target and the source; a document the validator would refuse can fail with
 *   `missing-attribute`.
 */
const mappingOf = (
  build: ModelWalk,
  element: SourceElement,
): Effect.Effect<readonly [string, string], Refusal> =>
  Effect.all([
    identifierAttribute(build, element, "target-identifier"),
    identifierAttribute(build, element, "source-identifier"),
  ]);

/**
 * Read a `qti-template-default` into the default the engine applies, none when the engine cannot
 * apply it. It records its own marks, so the reader that builds the item references stays
 * unaware of the test's processing names.
 *
 * @param element The template default.
 * @returns The default, none when it is marked, or a refusal at an attribute outside its type.
 */
type DefaultReader = (
  element: SourceElement,
) => Effect.Effect<Option.Option<TemplateDefault>, Refusal>;

/**
 * Read a `qti-assessment-item-ref`, its weights, its variable mappings and its template defaults
 * among it. A later weight or mapping of the same identifier replaces an earlier one; the template
 * defaults keep document order, each the engine cannot apply left out.
 *
 * @param build The build.
 * @param readDefault How a template default is read.
 * @param element The item reference.
 * @returns The model, or a refusal at an attribute that is missing or outside its type.
 */
const itemRef = (
  build: ModelWalk,
  readDefault: DefaultReader,
  element: SourceElement,
): Effect.Effect<ItemRef, Refusal> =>
  Effect.gen(function* readItemRef() {
    const identifier = yield* identifierAttribute(build, element, "identifier");
    const href = yield* requiredValue(build, element, "href");
    const required = yield* xsBoolean(build, element, "required", false);
    const fixed = yield* xsBoolean(build, element, "fixed", false);
    const control = yield* controlOf(build, element);
    const mappings = yield* Effect.forEach(childrenNamed(element, "qti-variable-mapping"), (each) =>
      mappingOf(build, each),
    );
    const weights = yield* Effect.forEach(childrenNamed(element, "qti-weight"), (each) =>
      weightOf(build, each),
    );
    const templateDefaults = yield* Effect.forEach(
      childrenNamed(element, "qti-template-default"),
      readDefault,
    );

    return {
      category: Option.match(valueOf(element, "category"), {
        onNone: () => [],
        onSome: (written) => written.split(xmlWhitespaceRun).filter((token) => token !== ""),
      }),
      control,
      fixed,
      href: trimXmlSpace(href).replaceAll(xmlWhitespaceRun, " "),
      identifier,
      kind: "item-ref",
      mappings: new Map(mappings),
      required,
      templateDefaults: Arr.getSomes(templateDefaults),
      weights: new Map(weights),
    };
  });

/**
 * Read a `qti-assessment-section` and, in document order, the sections and item references it
 * holds.
 *
 * @param build The build.
 * @param readDefault How a template default is read.
 * @param element The section.
 * @returns The model, or a refusal at an attribute that is missing or outside its type.
 */
const section = (
  build: ModelWalk,
  readDefault: DefaultReader,
  element: SourceElement,
): Effect.Effect<Section, Refusal> =>
  Effect.gen(function* readSection() {
    const identifier = yield* identifierAttribute(build, element, "identifier");
    const required = yield* xsBoolean(build, element, "required", false);
    const fixed = yield* xsBoolean(build, element, "fixed", false);
    const title = yield* requiredValue(build, element, "title");
    const visible = yield* requiredBoolean(build, element, "visible");
    const keepTogether = yield* xsBoolean(build, element, "keep-together", true);
    const control = yield* controlOf(build, element);
    const children = yield* Effect.forEach(
      element.children.filter(
        (child): child is SourceElement =>
          child.kind === "element" &&
          isQti(child) &&
          (child.local === "qti-assessment-section" || child.local === "qti-assessment-item-ref"),
      ),
      (child): Effect.Effect<SectionChild, Refusal> =>
        child.local === "qti-assessment-section"
          ? section(build, readDefault, child)
          : itemRef(build, readDefault, child),
    );

    return {
      children,
      control,
      fixed,
      identifier,
      keepTogether,
      kind: "section",
      required,
      title,
      visible,
    };
  });

/**
 * Read a `qti-test-part` and its sections, in document order.
 *
 * @param build The build.
 * @param readDefault How a template default is read.
 * @param element The test part.
 * @returns The model, or a refusal at an attribute that is missing or outside its type.
 */
const testPart = (
  build: ModelWalk,
  readDefault: DefaultReader,
  element: SourceElement,
): Effect.Effect<TestPart, Refusal> =>
  Effect.gen(function* readTestPart() {
    const identifier = yield* identifierAttribute(build, element, "identifier");
    const navigation = yield* requiredListed(build, element, "navigation-mode", navigationModes);
    const submission = yield* requiredListed(build, element, "submission-mode", submissionModes);
    const control = yield* controlOf(build, element);
    const children = yield* Effect.forEach(
      childrenNamed(element, "qti-assessment-section"),
      (child) => section(build, readDefault, child),
    );

    return { children, control, identifier, navigation, submission };
  });

/**
 * Report whether a `renders` condition holds on an outcome declaration, as the item model judges
 * it.
 *
 * @param condition The condition.
 * @param declaration The declaration.
 * @returns Whether the declaration carries the feature. The conditions on an interaction's binding,
 *   its pattern, a count or a processing template never hold on a declaration.
 */
const holdsOn = (condition: Condition, declaration: SourceElement): boolean => {
  if (condition.kind === "element") {
    return true;
  }

  if (condition.kind === "attribute") {
    return Option.isSome(attributeOf(declaration, condition.name));
  }

  if (condition.kind === "attribute-value") {
    return Option.getOrUndefined(valueOf(declaration, condition.name)) === condition.value;
  }

  if (condition.kind === "attribute-true") {
    return Option.getOrElse(
      Option.flatMap(valueOf(declaration, condition.name), xsBooleanOf),
      () => false,
    );
  }

  return (
    condition.kind === "untyped" &&
    Option.isNone(attributeOf(declaration, "base-type")) &&
    Option.getOrUndefined(valueOf(declaration, "cardinality")) !== "record"
  );
};

/**
 * Name the element feature an element is, if it is one: a `qti-*` element `testMarks` names, or an
 * XInclude `include`.
 *
 * @param element The element.
 * @returns The feature's key, or none when the element is not one.
 */
const elementMark = (element: SourceElement): Option.Option<string> => {
  if (element.namespace === xincludeNamespace) {
    return element.local === "include" ? Option.some(includeMark) : Option.none();
  }

  return isQti(element) && elementMarks.has(element.local)
    ? Option.some(element.local)
    : Option.none();
};

/**
 * Give the marks a `qti-item-session-control` carries, in the order its attributes are written:
 * `allow-comment` true at the element, and a negative `max-attempts` at the attribute.
 *
 * @param control The control.
 * @param path Its path.
 * @returns Its marks.
 */
const controlMarks = (control: SourceElement, path: string): readonly MarkedFeature[] =>
  control.attributes.flatMap((attribute): readonly MarkedFeature[] => {
    if (attribute.namespace !== "") {
      return [];
    }

    if (
      attribute.local === "allow-comment" &&
      Option.getOrElse(xsBooleanOf(attribute.value), () => false)
    ) {
      return [{ feature: commentMark, path, shown: "mark" }];
    }

    return attribute.local === "max-attempts" &&
      Option.exists(integerOf(attribute.value), (value) => value < 0n)
      ? [{ feature: negativeAttemptsMark, path: attributePath(path, attribute), shown: "mark" }]
      : [];
  });

/**
 * Give every feature a test holds and M2 does not deliver, in document order.
 *
 * An element `testMarks` names, an XInclude `include` among them, is marked at its path, and its
 * own subtree is not searched, so a rubric block's stylesheet is not marked apart from the block. A
 * `qti-item-session-control` gives its own marks. A test-level outcome declaration is marked as the
 * item model marks an item's: the `renders` marks that sit on it, at its path, and each `qti-*`
 * element below it that the model does not read, keyed by its name, its subtree not searched. An
 * element a reader has marked already, the outcome processing and each template default, gives its
 * own mark when it is an element feature, then the reader's marks, where it stands, its subtree not
 * searched, so an `xi:include` in it is marked once.
 *
 * @param source The test.
 * @param placed The marks a reader gave, keyed by the element they stand at.
 * @returns The marks, each once per feature and path.
 */
const marksOf = (
  source: SourceDocument,
  placed: ReadonlyMap<SourceElement, readonly MarkedFeature[]>,
): readonly MarkedFeature[] => {
  const marks: MarkedFeature[] = [];
  const quiet = new Set<SourceElement>();
  const declared = new Set<SourceElement>();
  for (const visit of walk(source)) {
    const { element, path } = visit;
    const parent = Option.getOrUndefined(visit.parent);
    const feature = Option.getOrUndefined(elementMark(element));
    const read = placed.get(element);
    if (parent !== undefined && quiet.has(parent)) {
      quiet.add(element);
    } else if (read !== undefined) {
      const repeated = read.some((each) => each.feature === feature && each.path === path);
      if (feature !== undefined && !repeated) {
        marks.push({ feature, path, shown: "mark" });
      }

      marks.push(...read);
      quiet.add(element);
    } else if (parent !== undefined && declared.has(parent)) {
      if (
        isQti(element) &&
        element.local.startsWith("qti-") &&
        !declarationContent.has(element.local)
      ) {
        marks.push({ feature: element.local, path, shown: "mark" });
        quiet.add(element);
      } else {
        declared.add(element);
      }
    } else if (feature !== undefined) {
      marks.push({ feature, path, shown: "mark" });
      quiet.add(element);
    } else if (isQti(element) && element.local === "qti-item-session-control") {
      marks.push(...controlMarks(element, path));
    } else if (
      isQti(element) &&
      element.local === "qti-outcome-declaration" &&
      parent === source.root
    ) {
      for (const mark of declarationMarks) {
        if (holdsOn(mark.when, element)) {
          marks.push({ feature: mark.feature, path, shown: "mark" });
        }
      }
      declared.add(element);
    }
  }

  return marks;
};

/**
 * The built-in variables a test's processing may name, as the qti package gives them for a test
 * (`builtInsOf("test")` in `packages/pantry/src/processing/env.ts`), whatever the engine holds of
 * them. Of these the engine holds only the test's own `duration` (G-R3, pending: a test's
 * processing reads only the test's declared outcomes and its own `duration`).
 */
const processingBuiltIns: readonly string[] = [
  "completionStatus",
  "duration",
  "numAttempts",
  "QTI_CONTEXT",
];

/**
 * The last step of a dotted name that reads a part's, a section's or an item reference's duration.
 */
const durationStep = ".duration";

/**
 * What a test's processing, its outcome processing and its template defaults, resolves a name
 * against.
 */
interface ProcessingNames {
  /**
   * Every identifier the test's outcome and context declarations declare whole.
   */
  readonly declared: ReadonlySet<string>;
  /**
   * {@link ProcessingNames.declared} and {@link processingBuiltIns}: the names a braced string
   * attribute reads as a reference, and an unchecked reference is judged by.
   */
  readonly named: ReadonlySet<string>;
  /**
   * The outcomes the model holds, which the engine reads and sets.
   */
  readonly outcomes: ReadonlyMap<string, OutcomeDeclaration>;
  /**
   * The identifiers of the test's parts, sections and item references.
   */
  readonly structure: ReadonlySet<string>;
}

/**
 * Give the identifiers of a test's parts, sections and item references, nested sections included,
 * read from the elements the tree holds as {@link testPart} and {@link section} walk them, so the
 * names are known before the item references, whose template defaults read them, are built.
 *
 * @param root The test's root.
 * @returns Their identifiers.
 */
const structureOf = (root: SourceElement): ReadonlySet<string> => {
  const identifiers = new Set<string>();
  const add = (element: SourceElement): void => {
    for (const identifier of Option.toArray(
      Option.map(valueOf(element, "identifier"), identifierOf),
    )) {
      identifiers.add(identifier);
    }
  };
  const addChild = (element: SourceElement): void => {
    add(element);
    if (isQti(element, "qti-assessment-section")) {
      for (const child of elementsOf(element)) {
        if (isQti(child, "qti-assessment-section") || isQti(child, "qti-assessment-item-ref")) {
          addChild(child);
        }
      }
    }
  };
  for (const read of childrenNamed(root, "qti-test-part")) {
    add(read);
    for (const child of childrenNamed(read, "qti-assessment-section")) {
      addChild(child);
    }
  }

  return identifiers;
};

/**
 * Give what a test's processing resolves a name against.
 *
 * @param root The test's root.
 * @param outcomes The outcomes the model holds.
 * @returns The names.
 */
const processingNamesOf = (
  root: SourceElement,
  outcomes: ReadonlyMap<string, OutcomeDeclaration>,
): ProcessingNames => {
  const declared = new Set(
    [
      ...childrenNamed(root, "qti-outcome-declaration"),
      ...childrenNamed(root, "qti-context-declaration"),
    ].flatMap((declaration) =>
      Option.toArray(Option.map(valueOf(declaration, "identifier"), identifierOf)),
    ),
  );

  return {
    declared,
    named: new Set([...declared, ...processingBuiltIns]),
    outcomes,
    structure: structureOf(root),
  };
};

/**
 * Report whether the engine holds a variable a test's processing reads by a name. A name
 * the test declares whole is held when the model holds it as an outcome, so a context variable and
 * an outcome the model does not hold are not. A dotted name the test does not declare whole is a
 * prefixed read, which the test scope resolves, held unless it is a part's, a section's or an item
 * reference's `duration` (G-R3, pending). Any other name is held only when it is the test's own
 * `duration`: `numAttempts`, `completionStatus` and `QTI_CONTEXT` are not.
 *
 * @param names What the processing resolves a name against.
 * @param name The name.
 * @returns Whether the engine holds it.
 */
const isHeld = (names: ProcessingNames, name: string): boolean => {
  if (names.declared.has(name)) {
    return names.outcomes.has(name);
  }

  if (name.includes(".")) {
    return !(
      name.endsWith(durationStep) && names.structure.has(name.slice(0, -durationStep.length))
    );
  }

  return name === "duration";
};

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
 * Give each variable an expression's attributes name through its kind's reference facet, with
 * whether a reference there is checked, in the facet's order and, within a list attribute, in
 * written order.
 *
 * @param operand The expression.
 * @param kindRule Its kind's rule.
 * @returns The names and whether each is checked.
 */
const referencesOf = (
  operand: Expression,
  kindRule: KindRule,
): readonly { readonly checked: boolean; readonly identifier: string }[] => {
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
 * Add each name an expression and its operands read that the engine does not hold, in the order
 * they first name it, each expression through its kind's rule in the registry. An expression
 * reads, by its kind's declaration facet, a name {@link isHeld} holds; a kind that expects a
 * response reads only a prefixed one, since a test declares no response. A checked reference reads
 * a name {@link isHeld} holds; an unchecked one is judged only when a declaration or a built-in
 * names it.
 *
 * @param operand The expression.
 * @param names What the processing resolves a name against.
 * @param unheld Where the names are added.
 */
const addUnheldReads = (operand: Expression, names: ProcessingNames, unheld: Set<string>): void => {
  const kindRule: KindRule = kindRules[operand.kind];
  if (kindRule.declaration !== undefined && "identifier" in operand) {
    const { identifier } = operand;
    const held =
      kindRule.declaration.expected === "response"
        ? !names.declared.has(identifier) && identifier.includes(".") && isHeld(names, identifier)
        : isHeld(names, identifier);
    if (!held) {
      unheld.add(identifier);
    }
  }

  for (const { checked, identifier } of referencesOf(operand, kindRule)) {
    if ((checked || names.named.has(identifier)) && !isHeld(names, identifier)) {
      unheld.add(identifier);
    }
  }

  for (const each of operand.operands) {
    addUnheldReads(each, names, unheld);
  }
};

/**
 * Give each name a test's outcome rules read or set that the engine does not hold, once, in the
 * order the rules first name it, as the item model finds an item's (`unheldIdentifiers` in
 * `#plate/model/item.ts`). A rule sets a name the engine holds only when the model holds it as an
 * outcome; its expressions read as {@link addUnheldReads} judges them.
 *
 * @param rules The rules.
 * @param names What the processing resolves a name against.
 * @returns The names the engine does not hold, empty when it can run the rules.
 */
const unheldNames = (rules: readonly Rule[], names: ProcessingNames): readonly string[] => {
  const unheld = new Set<string>();

  /**
   * Add each name a rule sequence names, nested branches included, that the engine does not hold.
   *
   * @param sequence The rules, in order.
   */
  const run = (sequence: readonly Rule[]): void => {
    for (const each of sequence) {
      if (each.kind === "condition") {
        for (const { then, when } of each.branches) {
          addUnheldReads(when, names, unheld);
          run(then);
        }
        if (Option.isSome(each.otherwise)) {
          run(each.otherwise.value);
        }
      } else if (each.kind !== "exit") {
        if (!names.outcomes.has(each.identifier)) {
          unheld.add(each.identifier);
        }

        addUnheldReads(each.expression, names, unheld);
      }
    }
  };
  run(rules);

  return [...unheld];
};

/**
 * Report whether an element holds a `qti-test-variables` whose `variable-identifier` is `duration`,
 * read from the attribute whatever the kind's reader holds: the engine holds no item's `duration`
 * (G-R3, pending).
 *
 * @param element The element.
 * @returns Whether it, or an element below it, is one.
 */
const collectsDurations = (element: SourceElement): boolean =>
  (isQti(element, "qti-test-variables") &&
    Option.exists(
      valueOf(element, "variable-identifier"),
      (written) => identifierOf(written) === "duration",
    )) ||
  elementsOf(element).some(collectsDurations);

/**
 * Give the generic expression reader its context for a test's outcome processing: the walk, the
 * names a braced string attribute reads as a reference, and the two ways to record a mark, each
 * recorded once per feature and path, in the order they are read.
 *
 * @param build The build.
 * @param named The names a braced string attribute reads as a reference.
 * @param marks Where the marks are recorded.
 * @returns The reading context.
 */
const processingReading = (
  build: ModelWalk,
  named: ReadonlySet<string>,
  marks: MarkedFeature[],
): ExpressionReading => {
  const recorded = new Set<string>();
  const record = (element: SourceElement, feature: string): void => {
    const path = pathOf(build, element);
    const key = JSON.stringify([feature, path]);
    if (!recorded.has(key)) {
      recorded.add(key);
      marks.push({ feature, path, shown: "mark" });
    }
  };

  return {
    declared: named,
    mark: (element, feature) =>
      Effect.sync(() => {
        record(element, feature);
      }),
    unread: (element, feature = nameOf(element)) =>
      Effect.sync(() => {
        record(element, feature);

        return Option.none();
      }),
    walk: build,
  };
};

/**
 * Construct a branch of an outcome condition.
 *
 * @param when Its condition.
 * @param then The rules it runs.
 * @returns The branch.
 */
// oxlint-disable-next-line unicorn/no-thenable -- `then` is the branch's rule list, as `Branch` names it; it is an array, never a function, so no `await` treats a branch as a promise.
const branchOf = (when: Expression, then: readonly Rule[]): Branch => ({ then, when });

/**
 * Read a sequence of outcome rules. A `qti-outcome-processing-fragment`'s rules take its place, so
 * the sequence holds no fragment.
 *
 * @param reading The processing's reading context.
 * @param elements The rule elements, in order.
 * @returns The rules, none when any holds an element the engine does not run, or a refusal.
 */
const outcomeRules = (
  reading: ExpressionReading,
  elements: readonly SourceElement[],
): Effect.Effect<Option.Option<readonly Rule[]>, Refusal> =>
  pipe(
    elements,
    // oxlint-disable-next-line eslint/no-use-before-define -- `outcomeRules` and `outcomeRule` are mutually recursive, as conditions and fragments nest; the call runs only after both are defined.
    Effect.forEach((element) => outcomeRule(reading, element)),
    Effect.map((read) => Option.map(Option.all(read), (each) => each.flat())),
  );

/**
 * Read a `qti-outcome-if` or `qti-outcome-else-if`: its first child is the condition and the rest
 * are the rules it runs.
 *
 * @param reading The processing's reading context.
 * @param element The branch element.
 * @returns The branch, none when it holds no condition or an element the engine does not run, or a
 *   refusal.
 */
const outcomeBranch = (
  reading: ExpressionReading,
  element: SourceElement,
): Effect.Effect<Option.Option<Branch>, Refusal> =>
  Effect.gen(function* readOutcomeBranch() {
    const [test, ...body] = elementsOf(element);
    if (test === undefined) {
      return yield* reading.unread(element);
    }

    const when = yield* readExpression(reading, test);
    const run = yield* outcomeRules(reading, body);

    return Option.all([when, run]).pipe(Option.map(([read, then]) => branchOf(read, then)));
  });

/**
 * Report whether a part of an outcome condition is a branch: a `qti-outcome-if` or a
 * `qti-outcome-else-if`.
 *
 * @param part The part.
 * @returns Whether it is one.
 */
const isOutcomeBranch = (part: SourceElement): boolean =>
  isQti(part, "qti-outcome-if") || isQti(part, "qti-outcome-else-if");

/**
 * Read a `qti-outcome-condition`: its `qti-outcome-if` and each `qti-outcome-else-if` in order as
 * its branches, and its first `qti-outcome-else` as its otherwise. Every other child is marked by
 * its name.
 *
 * @param reading The processing's reading context.
 * @param element The condition.
 * @returns The rule, none when any part holds an element the engine does not run, or a refusal.
 */
const outcomeCondition = (
  reading: ExpressionReading,
  element: SourceElement,
): Effect.Effect<Option.Option<readonly Rule[]>, Refusal> =>
  Effect.gen(function* readOutcomeCondition() {
    const parts = elementsOf(element);
    const branches = yield* Effect.forEach(parts.filter(isOutcomeBranch), (part) =>
      outcomeBranch(reading, part),
    );
    const otherwise = yield* Option.match(
      Arr.findFirst(parts, (part) => isQti(part, "qti-outcome-else")),
      {
        onNone: () => Effect.succeed(Option.some(Option.none<readonly Rule[]>())),
        onSome: (part) =>
          Effect.map(outcomeRules(reading, elementsOf(part)), Option.map(Option.some)),
      },
    );
    const strays = yield* Effect.forEach(
      parts.filter((part) => !isOutcomeBranch(part) && !isQti(part, "qti-outcome-else")),
      (part) => reading.unread(part),
    );

    return Option.map(
      Option.all({ branches: Option.all(branches), otherwise, strays: Option.all(strays) }),
      (read): readonly Rule[] => [
        { branches: read.branches, kind: "condition", otherwise: read.otherwise },
      ],
    );
  });

/**
 * Read a `qti-set-outcome-value` or a `qti-lookup-outcome-value`: the outcome it names and the one
 * expression it holds.
 *
 * @param reading The processing's reading context.
 * @param element The rule element.
 * @param kind The rule's kind.
 * @returns The rule, none when it does not hold exactly one expression or its expression holds an
 *   element the engine does not run, or a refusal.
 */
const outcomeSetting = (
  reading: ExpressionReading,
  element: SourceElement,
  kind: "lookup-outcome" | "set-outcome",
): Effect.Effect<Option.Option<readonly Rule[]>, Refusal> =>
  Effect.gen(function* readOutcomeSetting() {
    const identifier = yield* identifierAttribute(reading.walk, element, "identifier");
    const [operand, ...extra] = elementsOf(element);
    if (operand === undefined || extra.length > 0) {
      return yield* reading.unread(element);
    }

    const read = yield* readExpression(reading, operand);

    return read.pipe(
      Option.map((expression): readonly Rule[] => [{ expression, identifier, kind }]),
    );
  });

/**
 * Read one outcome rule element into the rules it runs: a `qti-outcome-condition`, a
 * `qti-set-outcome-value`, a `qti-lookup-outcome-value` and a `qti-exit-test` are one rule each,
 * and a `qti-outcome-processing-fragment` is its own rules, read in place, nested fragments
 * included. An XInclude `include` is never fetched (S-6): it is marked `xi:include` at its path.
 * Any other element is marked by its name.
 *
 * @param reading The processing's reading context.
 * @param element The rule element.
 * @returns The rules, none when it holds an element the engine does not run, or a refusal.
 */
const outcomeRule = (
  reading: ExpressionReading,
  element: SourceElement,
): Effect.Effect<Option.Option<readonly Rule[]>, Refusal> => {
  if (element.namespace === xincludeNamespace && element.local === "include") {
    return reading.unread(element, includeMark);
  }

  if (isQti(element, "qti-outcome-processing-fragment")) {
    return outcomeRules(reading, elementsOf(element));
  }

  if (isQti(element, "qti-exit-test")) {
    return Effect.succeed(Option.some<readonly Rule[]>([{ kind: "exit" }]));
  }

  if (isQti(element, "qti-set-outcome-value")) {
    return outcomeSetting(reading, element, "set-outcome");
  }

  if (isQti(element, "qti-lookup-outcome-value")) {
    return outcomeSetting(reading, element, "lookup-outcome");
  }

  return isQti(element, "qti-outcome-condition")
    ? outcomeCondition(reading, element)
    : reading.unread(element);
};

/**
 * Give the marks an element of a test's processing gives: `variable:<name>` at the element's path
 * for each name the engine does not hold, as the item model marks an item's, then the marks its
 * reading recorded.
 *
 * @param build The build.
 * @param element The `qti-outcome-processing` or the `qti-template-default`.
 * @param unheld The names the engine does not hold, in the order they were found.
 * @param recorded The marks its reading recorded, in reading order.
 * @returns The marks.
 */
const processingMarks = (
  build: ModelWalk,
  element: SourceElement,
  unheld: ReadonlySet<string>,
  recorded: readonly MarkedFeature[],
): readonly MarkedFeature[] => {
  const path = pathOf(build, element);

  return [
    ...Array.from(unheld, (name): MarkedFeature => ({
      feature: `variable:${name}`,
      path,
      shown: "mark",
    })),
    ...recorded,
  ];
};

/**
 * A test's outcome processing as read: its state, and the marks it gives, in reading order.
 */
interface ReadProcessing {
  readonly marks: readonly MarkedFeature[];
  readonly outcomeProcessing: OutcomeProcessing;
}

/**
 * Read a test's `qti-outcome-processing` into the rules it runs.
 *
 * Its rules are read into the item model's {@link Rule} union, each expression through the
 * registry's generic reader. It is `marked`, and nothing is refused, when the engine cannot run
 * it: an element the reader marks at its path (an expression kind the registry has not landed, an
 * `xi:include`, a rule of a malformed shape), or a name the engine does not hold in a test
 * ({@link unheldNames}, and a `qti-test-variables` that names `duration`,
 * {@link collectsDurations}), each the mark `variable:<name>` at the processing element's path, as
 * the item model marks an item's. Otherwise it `runs` with its rules.
 *
 * @param build The build.
 * @param element The `qti-outcome-processing` element.
 * @param names What the processing resolves a name against.
 * @returns The state and its marks, the processing element's own first; or the refusal an
 *   attribute gives, such as `value-type` for a `qti-base-value` outside its lexical space.
 */
const outcomeProcessingOf = (
  build: ModelWalk,
  element: SourceElement,
  names: ProcessingNames,
): Effect.Effect<ReadProcessing, Refusal> =>
  Effect.gen(function* readOutcomeProcessing() {
    const recorded: MarkedFeature[] = [];
    const tree = yield* outcomeRules(
      processingReading(build, names.named, recorded),
      elementsOf(element),
    );
    const unheld = new Set(Option.isSome(tree) ? unheldNames(tree.value, names) : []);
    if (collectsDurations(element)) {
      unheld.add("duration");
    }

    const marks = processingMarks(build, element, unheld, recorded);

    return {
      marks,
      outcomeProcessing:
        Option.isSome(tree) && marks.length === 0
          ? { kind: "runs", rules: tree.value }
          : { kind: "marked" },
    };
  });

/**
 * A `qti-template-default` as read: the default the engine applies, none when it is marked, and the
 * marks it gives, in reading order.
 */
interface ReadDefault {
  readonly marks: readonly MarkedFeature[];
  readonly templateDefault: Option.Option<TemplateDefault>;
}

/**
 * Read a `qti-template-default` into the default the engine applies.
 *
 * Its one expression is read through the registry's generic reader, over the names a test's outcome
 * processing resolves (G-R3, pending: of those, the engine holds in a template default only the
 * test's declared outcomes, the test's own `duration`, which reads NULL there, and an item's
 * variables read by a prefixed name, as in outcome processing). It is left out, and nothing is
 * refused, when the engine cannot apply it: an element the reader marks at its path (an expression
 * kind the registry has not landed, an `xi:include`, a default that does not hold exactly one
 * expression), or a name the engine does not hold in a test ({@link addUnheldReads}, and a
 * `qti-test-variables` that names `duration`, {@link collectsDurations}), each the mark
 * `variable:<name>` at the default's path.
 *
 * @param build The build.
 * @param names What the test's processing resolves a name against.
 * @param element The `qti-template-default` element.
 * @returns The default and its marks, the default's own `variable:` marks first; or the refusal an
 *   attribute gives, such as `value-type` for a `qti-base-value` outside its lexical space.
 */
const templateDefaultOf = (
  build: ModelWalk,
  names: ProcessingNames,
  element: SourceElement,
): Effect.Effect<ReadDefault, Refusal> =>
  Effect.gen(function* readTemplateDefault() {
    const templateIdentifier = yield* identifierAttribute(build, element, "template-identifier");
    const recorded: MarkedFeature[] = [];
    const reading = processingReading(build, names.named, recorded);
    const [operand, ...extra] = elementsOf(element);
    const expression =
      operand === undefined || extra.length > 0
        ? yield* reading.unread(element)
        : yield* readExpression(reading, operand);
    const unheld = new Set<string>();
    if (Option.isSome(expression)) {
      addUnheldReads(expression.value, names, unheld);
    }

    if (collectsDurations(element)) {
      unheld.add("duration");
    }

    const marks = processingMarks(build, element, unheld, recorded);

    return {
      marks,
      templateDefault:
        marks.length === 0
          ? expression.pipe(
              Option.map((read): TemplateDefault => ({ expression: read, templateIdentifier })),
            )
          : Option.none(),
    };
  });

/**
 * Build the test model of a valid `qti-assessment-test`.
 *
 * The parts, their sections and item references are read in document order; a
 * `qti-assessment-section-ref` and an `xi:include` are marked and left out, and every other
 * `testMarks` feature is marked and left out of the tree or, as `allow-comment` and a negative
 * `max-attempts`, held as written. Each `qti-item-session-control` attribute is held as written or
 * absent, and each item reference's weights, variable mappings and template defaults are read, a
 * template default the engine cannot apply marked and left out ({@link templateDefaultOf}). The
 * test's outcome declarations are held and marked as the item model holds and marks an item's. Its
 * outcome processing is `absent` when it has none, `marked` when the engine cannot run it
 * ({@link outcomeProcessingOf}), and `runs` with its rules otherwise; nothing in it or in a
 * template default is refused but an attribute outside its type.
 *
 * @param source A document the structural validator and the prose rules accepted.
 * @returns The test, or the refusal `value-type` at the first typed value outside its lexical
 *   space. A document the validator would refuse can also fail with `missing-attribute` or
 *   `attribute-type`.
 */
export const buildTest = (source: SourceDocument): Effect.Effect<Test, Refusal> =>
  Effect.gen(function* readTest() {
    const build: ModelWalk = { builder: "buildTest", document: source, paths: pathsOf(source) };
    const { root } = source;
    const identifier = yield* identifierAttribute(build, root, "identifier");
    const title = yield* requiredValue(build, root, "title");
    const outcomes = new Map<string, OutcomeDeclaration>();
    for (const declaration of childrenNamed(root, "qti-outcome-declaration")) {
      const read = yield* outcomeDeclaration(build, declaration);
      if (Option.isSome(read)) {
        outcomes.set(read.value.identifier, read.value);
      }
    }

    const names = processingNamesOf(root, outcomes);
    const placed = new Map<SourceElement, readonly MarkedFeature[]>();
    const readDefault: DefaultReader = (element) =>
      Effect.gen(function* readPlacedDefault() {
        const read = yield* templateDefaultOf(build, names, element);
        placed.set(element, read.marks);

        return read.templateDefault;
      });
    const parts = yield* Effect.forEach(childrenNamed(root, "qti-test-part"), (part) =>
      testPart(build, readDefault, part),
    );
    const processing = Arr.head(childrenNamed(root, "qti-outcome-processing"));
    const read = yield* Option.match(processing, {
      onNone: () =>
        Effect.succeed<ReadProcessing>({ marks: [], outcomeProcessing: { kind: "absent" } }),
      onSome: (element) => outcomeProcessingOf(build, element, names),
    });
    if (Option.isSome(processing)) {
      placed.set(processing.value, read.marks);
    }

    return {
      document: source.location,
      identifier,
      outcomeProcessing: read.outcomeProcessing,
      outcomes,
      parts,
      title,
      unsupported: marksOf(source, placed),
    };
  });

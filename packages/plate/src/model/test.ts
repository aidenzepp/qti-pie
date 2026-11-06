/**
 * The test model: what M2 reads from a valid `qti-assessment-test`, typed, with every feature it
 * accepts and does not deliver named as a mark.
 *
 * {@link buildTest} reads the parts, their sections and item references in document order, each
 * `qti-item-session-control` attribute by attribute, and the test's outcome declarations through
 * the item model's own reader, with the item model's element and attribute readers. The features
 * `testMarks` lists are marks on the verdict, never notices, and the tree leaves them out or holds
 * them inert, so a sequence walked from it ignores them.
 *
 * @module
 */
import { Array as Arr, Effect, Option } from "effect";
import { attributePath, walk, xincludeNamespace } from "#plate/document/source.ts";
import type { SourceAttribute, SourceDocument, SourceElement } from "#plate/document/source.ts";
import {
  attributeOf,
  childrenNamed,
  greatestInt,
  identifierAttribute,
  isQti,
  leastInt,
  listed,
  outcomeDeclaration,
  pathOf,
  pathsOf,
  refusal,
  requiredAttribute,
  requiredValue,
  valueOf,
  xmlWhitespaceRun,
  xsBoolean,
  xsBooleanOf,
} from "#plate/model/item.ts";
import type { ModelWalk, OutcomeDeclaration, UnsupportedFeature } from "#plate/model/item.ts";
import { integerLexical, trimXmlSpace } from "#plate/model/values.ts";
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
  readonly required: boolean;
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
 * A valid `qti-assessment-test` as M2 models it.
 *
 * `outcomes` holds the test's outcome declarations of modelled base types and cardinalities, as the
 * item model holds an item's. `unsupported` lists every feature not delivered, in document order,
 * each once per feature and path: the keys of `testMarks`, and the marks the item model gives an
 * outcome declaration it does not hold.
 */
export interface Test {
  /**
   * The document's location as the host named it.
   */
  readonly document: string;
  readonly identifier: string;
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
 * The `qti-*` elements below an outcome declaration that the model reads. Any other is a mark keyed
 * by its name, as the item model marks it.
 */
const declarationContent: ReadonlySet<string> = new Set(["qti-default-value", "qti-value"]);

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
 * Read a `qti-assessment-item-ref`.
 *
 * @param build The build.
 * @param element The item reference.
 * @returns The model, or a refusal at an attribute that is missing or outside its type.
 */
const itemRef = (build: ModelWalk, element: SourceElement): Effect.Effect<ItemRef, Refusal> =>
  Effect.gen(function* readItemRef() {
    const identifier = yield* identifierAttribute(build, element, "identifier");
    const href = yield* requiredValue(build, element, "href");
    const required = yield* xsBoolean(build, element, "required", false);
    const fixed = yield* xsBoolean(build, element, "fixed", false);
    const control = yield* controlOf(build, element);

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
      required,
    };
  });

/**
 * Read a `qti-assessment-section` and, in document order, the sections and item references it
 * holds.
 *
 * @param build The build.
 * @param element The section.
 * @returns The model, or a refusal at an attribute that is missing or outside its type.
 */
const section = (build: ModelWalk, element: SourceElement): Effect.Effect<Section, Refusal> =>
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
        child.local === "qti-assessment-section" ? section(build, child) : itemRef(build, child),
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
 * @param element The test part.
 * @returns The model, or a refusal at an attribute that is missing or outside its type.
 */
const testPart = (build: ModelWalk, element: SourceElement): Effect.Effect<TestPart, Refusal> =>
  Effect.gen(function* readTestPart() {
    const identifier = yield* identifierAttribute(build, element, "identifier");
    const navigation = yield* requiredListed(build, element, "navigation-mode", navigationModes);
    const submission = yield* requiredListed(build, element, "submission-mode", submissionModes);
    const control = yield* controlOf(build, element);
    const children = yield* Effect.forEach(
      childrenNamed(element, "qti-assessment-section"),
      (child) => section(build, child),
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
 * element below it that the model does not read, keyed by its name, its subtree not searched.
 *
 * @param source The test.
 * @returns The marks, each once per feature and path.
 */
const marksOf = (source: SourceDocument): readonly MarkedFeature[] => {
  const marks: MarkedFeature[] = [];
  const quiet = new Set<SourceElement>();
  const declared = new Set<SourceElement>();
  for (const visit of walk(source)) {
    const { element, path } = visit;
    const parent = Option.getOrUndefined(visit.parent);
    const feature = Option.getOrUndefined(elementMark(element));
    if (parent !== undefined && quiet.has(parent)) {
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
 * Build the test model of a valid `qti-assessment-test`.
 *
 * The parts, their sections and item references are read in document order; a
 * `qti-assessment-section-ref` and an `xi:include` are marked and left out, and every other
 * `testMarks` feature is marked and left out of the tree or, as `allow-comment` and a negative
 * `max-attempts`, held as written. Each `qti-item-session-control` attribute is held as written or
 * absent. The test's outcome declarations are held and marked as the item model holds and marks an
 * item's.
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

    const parts = yield* Effect.forEach(childrenNamed(root, "qti-test-part"), (part) =>
      testPart(build, part),
    );

    return {
      document: source.location,
      identifier,
      outcomes,
      parts,
      title,
      unsupported: marksOf(source),
    };
  });

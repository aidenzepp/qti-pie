/**
 * The element and attribute readers every model build shares: finding an element's attributes,
 * children and text, reading an attribute exactly as its XSD type reads it, and constructing the
 * refusal of a value outside its type, located in the document being read.
 *
 * It is a leaf of the model. Its imports are only `#plate/count-range.ts`,
 * `#plate/document/source.ts`, `#plate/model/values.ts`, `#plate/validate/refusal.ts` and
 * `effect`, and it imports nothing from `item.ts`, so the item model, the test model and each
 * expression family's reader value-import it without a cycle.
 *
 * @module
 */
import { Array as Arr, Data, Effect, Option } from "effect";
import type { Result } from "effect";
import { greatestCount, leastCount } from "#plate/count-range.ts";
import { attributePath, qtiNamespace, xmlNamespace } from "#plate/document/source.ts";
import type { SourceAttribute, SourceDocument, SourceElement } from "#plate/document/source.ts";
import { parseLexical, trimXmlSpace } from "#plate/model/values.ts";
import type { InvalidValue, Single } from "#plate/model/values.ts";
import { Refusal } from "#plate/validate/refusal.ts";
import type { RefusalRule } from "#plate/validate/refusal.ts";

/**
 * Construct the refusal of an attribute of the document being read, at that attribute's path.
 *
 * @param attribute The attribute at fault.
 * @param rule The rule it breaks.
 * @param detail The facts the verdict's wording names.
 * @returns The refusal, located at the attribute in the document its reader walks.
 */
export type AttributeRefusal = (
  attribute: SourceAttribute,
  rule: RefusalRule,
  detail: Readonly<Record<string, string>>,
) => Refusal;

/**
 * What a model build reads a document through: the builder, the document, and every element's
 * path. The item and the test model each build one, so the readers below serve both and a refusal
 * names the document and path it was found in.
 */
export interface ModelWalk {
  /**
   * The function that builds the model, which a {@link BuildDefect} names.
   */
  readonly builder: "buildItem" | "buildTest";
  readonly document: SourceDocument;
  /**
   * Each element's path, keyed by the element itself. A reader builds a fresh object per element,
   * so no element sits at two places in one document.
   */
  readonly paths: ReadonlyMap<SourceElement, string>;
}

/**
 * Name an element as a feature or a path step does: its local name in the QTI namespace,
 * `{<namespace>}<local>` in any other.
 *
 * @param element The element to name.
 * @returns The element's name.
 */
export const nameOf = (element: SourceElement): string =>
  element.namespace === qtiNamespace ? element.local : `{${element.namespace}}${element.local}`;

/**
 * Name an attribute as `renders` conditions and body elements spell it.
 *
 * @param attribute The attribute to name.
 * @returns Its local name in no namespace, `xml:<local>` in the XML namespace, and none for a
 *   namespace declaration or an attribute of any other namespace.
 */
export const attributeName = (attribute: SourceAttribute): Option.Option<string> => {
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
export const attributeOf = (element: SourceElement, name: string): Option.Option<SourceAttribute> =>
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
export const valueOf = (element: SourceElement, name: string): Option.Option<string> =>
  Option.map(attributeOf(element, name), (attribute) => attribute.value);

/**
 * Report whether an element is in the QTI namespace, optionally with one local name.
 *
 * @param element The element.
 * @param local The local name it must have, any when absent.
 * @returns Whether `element` is that element.
 */
export const isQti = (element: SourceElement, local?: string): boolean =>
  element.namespace === qtiNamespace && (local === undefined || element.local === local);

/**
 * Keep an element's element children.
 *
 * @param element The element.
 * @returns Its element children, in document order.
 */
export const elementsOf = (element: SourceElement): readonly SourceElement[] =>
  element.children.filter((child): child is SourceElement => child.kind === "element");

/**
 * Keep an element's QTI children of one name.
 *
 * @param element The element.
 * @param local The children's local name.
 * @returns Those children, in document order.
 */
export const childrenNamed = (element: SourceElement, local: string): readonly SourceElement[] =>
  elementsOf(element).filter((child) => isQti(child, local));

/**
 * Join an element's text children, the content of a `qti-value` or a `qti-base-value`.
 *
 * @param element The element.
 * @returns Its text, as written.
 */
export const textOf = (element: SourceElement): string =>
  element.children.flatMap((child) => (child.kind === "text" ? [child.text] : [])).join("");

/**
 * A broken invariant of a model build's own walk or parse, a defect of this module that no input
 * can cause.
 *
 * It cannot occur: every element a build reads is in its walk, and a value {@link parseLexical}
 * gave for `float` or `integer` holds that base type. It is thrown, never returned, so the error
 * channels of `buildItem` and `buildTest` hold only content refusals.
 */
export class BuildDefect extends Data.TaggedError("BuildDefect")<{
  readonly builder: ModelWalk["builder"];
  readonly detail: string;
}> {
  /**
   * The broken invariant, and what to do with it.
   */
  override get message(): string {
    const document = this.builder === "buildItem" ? "item" : "test";

    return `${this.detail} This is a defect in ${this.builder}; report it with the ${document} that caused it.`;
  }
}

/**
 * Give an element's path from the build's walk.
 *
 * @param build The build.
 * @param element An element of the build's document.
 * @returns The element's path.
 */
export const pathOf = (build: ModelWalk, element: SourceElement): string => {
  const path = build.paths.get(element);
  if (path === undefined) {
    throw new BuildDefect({
      builder: build.builder,
      detail: `The element ${nameOf(element)} is not part of the document being built.`,
    });
  }

  return path;
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
export const refusal = (
  build: ModelWalk,
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
export const typed = <A>(
  build: ModelWalk,
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
export const floatOf = (single: Single): number => {
  if (single.baseType === "float") {
    return single.value;
  }

  throw new BuildDefect({
    builder: "buildItem",
    detail: `A ${single.baseType} value holds no float.`,
  });
};

/**
 * Read the exact integer an integer value holds.
 *
 * @param single A value that {@link parseLexical} gave for `integer`.
 * @returns Its integer.
 */
export const integerOf = (single: Single): bigint => {
  if (single.baseType === "integer") {
    return single.value;
  }

  throw new BuildDefect({
    builder: "buildItem",
    detail: `A ${single.baseType} value holds no integer.`,
  });
};

/**
 * Read an attribute the element must carry.
 *
 * @param build The build.
 * @param element The element.
 * @param name The attribute's name.
 * @returns The attribute, or the refusal `missing-attribute` at the element.
 */
export const requiredAttribute = (
  build: ModelWalk,
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
export const requiredValue = (
  build: ModelWalk,
  element: SourceElement,
  name: string,
): Effect.Effect<string, Refusal> =>
  Effect.map(requiredAttribute(build, element, name), (attribute) => attribute.value);

/**
 * Read an identifier as its XSD type reads it.
 *
 * Every identifier the item reads is an `xs:NCName`, or an `xs:ID` or `xs:IDREF` derived from it:
 * the root's, a declaration's and a choice's `identifier`, an interaction's `response-identifier`,
 * and the `identifier` an expression or a response rule names. Their whitespace facet is
 * `collapse`, and an NCName holds no inner whitespace, so collapsing is removing the outer XML
 * whitespace. Reading 7 keeps an attribute's outer whitespace only for the base-typed attributes
 * the XSD types as strings, which no identifier is, so `" RESPONSE "` names `RESPONSE`, and
 * refusing it would refuse valid content (reading 1). The validators read these attributes the
 * same way (`identifierOf` in `src/validate/rules.ts`).
 *
 * @param written The attribute's value as written.
 * @returns The identifier it names.
 */
export const identifierOf = (written: string): string => trimXmlSpace(written);

/**
 * Read an identifier attribute the element must carry, as `identifierOf` reads it.
 *
 * @param build The build.
 * @param element The element.
 * @param name The attribute's name.
 * @returns The identifier, or the refusal `missing-attribute`.
 */
export const identifierAttribute = (
  build: ModelWalk,
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
export const listed = <const T extends string>(
  build: ModelWalk,
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
export const enumerated = <const T extends string>(
  build: ModelWalk,
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
  build: ModelWalk,
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
export const leastInt = -2_147_483_648n;

/**
 * The greatest `xs:int`, 2^31-1.
 */
export const greatestInt = 2_147_483_647n;

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
export const xsInt = (
  build: ModelWalk,
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
export const countAttribute = (
  build: ModelWalk,
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
export const xsBooleanOf = (written: string): Option.Option<boolean> => {
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
export const xsBoolean = (
  build: ModelWalk,
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
export const floatAttribute = (
  build: ModelWalk,
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
 * One coordinate as `CoordsDType` writes it: decimal digits, then `%` or nothing.
 */
const coordinate = /^(?<digits>[0-9]+)%?$/u;

/**
 * Read the required `coords` of a `qti-area-map-entry` or a `qti-inside`, each coordinate's digits
 * as `xs:double` reads them. How many coordinates a value holds is the structure check's, which
 * admits only `CoordsDType`.
 *
 * @param build The build.
 * @param element The element that carries the `coords`.
 * @returns Each coordinate's number and whether it is written with `%`, in written order, or the
 *   refusal `missing-attribute` when it is absent or `attribute-type` when a coordinate is outside
 *   `CoordsDType`.
 */
export const coordsOf = (
  build: ModelWalk,
  element: SourceElement,
): Effect.Effect<readonly (readonly [number, boolean])[], Refusal> =>
  Effect.flatMap(requiredAttribute(build, element, "coords"), (attribute) => {
    const path = attributePath(pathOf(build, element), attribute);

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
export const doubleAttribute = (
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
